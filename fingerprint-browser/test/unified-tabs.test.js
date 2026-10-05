const assert = require('node:assert/strict')
const path = require('node:path')
const fs = require('node:fs/promises')
const http = require('node:http')
const net = require('node:net')
const { spawn } = require('node:child_process')
const { app, BrowserWindow, Menu, webContents } = require('electron/main')

const output = process.env.FP_TABS_TEST_OUTPUT
const result = { ok: false, stages: [] }
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
const timeout = setTimeout(() => { app.exit(1) }, 60000)
let server
let socksServer
const socksSockets = new Set()
const wizardSocksRequests = []
let requireSocksAuthentication = false
const wizardProxyRequests = []
const wizardDirectRequests = []
const wizardProxyAuthorization = 'Basic ' + Buffer.from('wizard-user:wizard-secret').toString('base64')
const permissionHandlers = new Map()
const externalDecisions = []
app.on('session-created', profileSession => {
  const setHandler = profileSession.setPermissionRequestHandler.bind(profileSession)
  profileSession.setPermissionRequestHandler = handler => {
    permissionHandlers.set(profileSession, handler)
    setHandler(handler && ((contents, permission, callback, details) => {
      handler(contents, permission, allowed => {
        if (permission === 'openExternal') externalDecisions.push({ allowed, url: details.externalURL })
        callback(allowed)
      }, details)
    }))
  }
})

async function record (stage) {
  result.stages.push(stage)
  await fs.writeFile(path.join(output, 'result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8')
}

async function invoke (window, method, payload) {
  const response = await window.webContents.executeJavaScript(`window.browserApi[${JSON.stringify(method)}](${payload === undefined ? '' : JSON.stringify(payload)})`)
  assert.equal(response.ok, true, response.error || '应用接口操作失败。')
  return response
}

async function waitFor (condition, message) {
  for (let attempt = 0; attempt < 120; attempt++) {
    if (await condition()) return
    await wait(50)
  }
  throw new Error(message)
}

function contentsFor (tab) {
  const contents = webContents.getAllWebContents().find(item => item.session.storagePath === tab.dataDir)
  assert.ok(contents, '找不到环境网页视图。')
  return contents
}

async function signalsFor (contents) {
  await waitFor(async () => await contents.executeJavaScript('Boolean(window.testSignals || window.testError)'), '指纹检测页面没有完成读取。')
  const error = await contents.executeJavaScript('window.testError || null')
  assert.equal(error, null, `指纹检测页面读取失败：${error}`)
  return await contents.executeJavaScript('window.testSignals')
}

const dashboardReady = new Promise(resolve => app.once('browser-window-created', (_event, window) => {
  window.webContents.once('did-finish-load', () => resolve(window))
}))
require('../main')

async function run () {
  await fs.mkdir(output, { recursive: true })
  const dashboard = await dashboardReady
  assert.equal(BrowserWindow.getAllWindows().length, 1, '启动时应该只有一个统一窗口。')
  assert.equal(Menu.getApplicationMenu(), null, 'Electron 默认菜单没有隐藏。')
  await waitFor(async () => await dashboard.webContents.executeJavaScript("Boolean(document.querySelector('#unified-tabs'))"), '统一标签栏没有加载。')
  const initialChrome = await dashboard.webContents.executeJavaScript("({ tabs: document.querySelectorAll('#unified-tabs [role=tab]').length, selected: document.querySelectorAll('#unified-tabs [aria-selected=true]').length, title: document.querySelector('#unified-tabs .dashboard-tab .unified-tab-title')?.textContent })")
  assert.deepEqual(initialChrome, { tabs: 1, selected: 1, title: '首页' }, '启动首页标签状态不正确。')
  assert.equal(await dashboard.webContents.executeJavaScript("document.querySelector('#unified-fingerprint').disabled"), true, '首页不应显示可用的标签指纹信息。')
  await fs.writeFile(path.join(output, 'unified-home.png'), (await dashboard.webContents.capturePage()).toPNG())
  await record('统一窗口启动和固定首页标签通过')

  const secondDataRoot = path.join(output, `second-client-${Date.now()}`)
  await fs.mkdir(secondDataRoot, { recursive: true })
  const secondInstanceSeen = new Promise(resolve => app.once('second-instance', resolve))
  dashboard.minimize()
  await waitFor(() => dashboard.isMinimized(), '验证窗口没有最小化。')
  const secondClient = spawn(process.execPath, [path.resolve(__dirname, '..'), `--user-data-dir=${secondDataRoot}`], {
    env: { ...process.env, FP_BROWSER_DATA_DIR: secondDataRoot }, windowsHide: true, stdio: 'ignore'
  })
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { secondClient.kill(); reject(new Error('重复客户端没有及时退出。')) }, 10000)
    secondClient.once('error', () => { clearTimeout(timer); reject(new Error('无法启动重复客户端验证。')) })
    secondClient.once('exit', code => { clearTimeout(timer); code === 0 ? resolve() : reject(new Error('重复客户端退出失败。')) })
  })
  await secondInstanceSeen
  await waitFor(() => !dashboard.isMinimized() && dashboard.isVisible() && dashboard.isFocused(), '重复启动没有恢复并激活已有客户端。')
  assert.equal(BrowserWindow.getAllWindows().length, 1, '重复启动创建了新的客户端窗口。')
  assert.equal(app.getPath('userData'), process.env.FP_BROWSER_DATA_DIR, '客户端锁改变了实际数据目录。')
  await record('不同数据目录重复启动互斥与已有窗口恢复激活通过')

  const page = await fs.readFile(path.join(__dirname, 'fingerprint-page.html'))
  server = http.createServer((request, response) => {
    const requestPath = new URL(request.url, 'http://fingerprint-browser.test').pathname
    if (requestPath === '/headers') {
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.end(JSON.stringify({ acceptLanguage: request.headers['accept-language'] || '' }))
      return
    }
    if (request.url.startsWith('http://wizard-proxy.invalid/')) {
      const authorized = request.headers['proxy-authorization'] === wizardProxyAuthorization
      wizardProxyRequests.push({ url: request.url, authorized })
      if (!authorized) {
        response.writeHead(407, { 'Proxy-Authenticate': 'Basic realm="proxy-check"' })
        response.end()
        return
      }
    }
    if (request.url.startsWith('/?wizard=')) wizardDirectRequests.push(request.url)
    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    response.end(page)
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const url = `http://127.0.0.1:${server.address().port}/`
  const profiles = []
  for (const [name, cpu] of [['环境一 · 上海', 4], ['环境二 · 纽约', 12]]) {
    const draft = (await invoke(dashboard, 'getDraft')).profile
    draft.name = name
    draft.url = url
    draft.fingerprint.hardware.hardwareConcurrency = cpu
    if (cpu === 12) {
      draft.url = 'http://fingerprint-tooltip-proxy.invalid/'
      draft.proxy = { mode: 'http', server: url.replace(/\/$/, ''), username: '测试代理账户', password: '测试代理密码' }
    }
    const saved = await invoke(dashboard, 'saveProfile', draft)
    profiles.push(saved.profile)
    const launch = await invoke(dashboard, 'launchProfile', cpu === 4 ? { id: draft.id, operationId: 'unified-create-idempotency' } : { id: draft.id })
    if (cpu === 4) {
      const repeated = await invoke(dashboard, 'launchProfile', { id: draft.id, operationId: 'unified-create-idempotency' })
      assert.equal(repeated.environmentId, launch.environmentId, '重复创建操作没有复用已创建环境。')
      assert.equal(repeated.tabId, launch.tabId, '重复创建操作没有复用已打开标签。')
    }
  }
  assert.notEqual(profiles[0].fingerprint.noise.seed, profiles[1].fingerprint.noise.seed, '每次创建草稿没有生成独立指纹种子。')
  await waitFor(async () => (await invoke(dashboard, 'listTabs')).tabs.length === 2, '环境标签没有创建完成。')
  const snapshot = await invoke(dashboard, 'listTabs')
  assert.equal(BrowserWindow.getAllWindows().length, 1, '创建环境后出现了独立多标签窗口。')
  assert.notEqual(snapshot.tabs[0].dataDir, snapshot.tabs[1].dataDir, '不同环境复用了数据目录。')
  for (const [index, tab] of snapshot.tabs.entries()) {
    const contents = contentsFor(tab)
    const signals = await signalsFor(contents)
    const fingerprint = profiles[index].fingerprint
    assert.equal(signals.webgl.available, true, 'WebGL1 上下文没有创建。')
    assert.equal(signals.webgl.unmaskedVendor, fingerprint.graphics.webglVendor, 'WebGL 厂商与环境配置不一致。')
    assert.equal(signals.webgl.unmaskedRenderer, fingerprint.graphics.webglRenderer, 'WebGL 渲染器与环境配置不一致。')
    assert.ok(signals.webgl.extensionCount > 0, 'WebGL 扩展列表为空。')
    assert.ok(signals.webgl.extensions.includes('WEBGL_debug_renderer_info'), 'WebGL 调试渲染器扩展不可用。')
    assert.equal(signals.webgl.pixel.length, 4, 'WebGL readPixels 没有返回 RGBA 像素。')
    assert.equal(signals.webgl.error, 0, 'WebGL 基础操作产生错误。')
    assert.equal(signals.webgl.shaderCompile, true, 'WebGL Shader 编译失败。')
    assert.equal(signals.webgl.shaderLog, '', 'WebGL Shader 编译日志不为空。')
    assert.equal(signals.webgl.getParameterCalls, 32, 'WebGL 参数读取回归次数不正确。')
    assert.ok(Number.isFinite(signals.webgl.getParameterElapsedMs), 'WebGL 参数读取耗时不可用。')
    assert.equal(typeof signals.webgl2.available, 'boolean', 'WebGL2 能力结果缺失。')
    assert.ok(signals.canvas2dDataUrlLength > 0, 'Canvas 2D 对照结果为空。')
  }
  const chrome = await dashboard.webContents.executeJavaScript("({ tabs: document.querySelectorAll('#unified-tabs [role=tab]').length, selected: document.querySelectorAll('#unified-tabs [aria-selected=true]').length, overflow: getComputedStyle(document.querySelector('#unified-tabs')).overflow })")
  assert.deepEqual(chrome, { tabs: 3, selected: 1, overflow: 'hidden' }, '环境标签栏布局不符合浏览器式管理。')
  await record('环境标签同窗创建、首页保留和无滚动条通过')

  const tooltipFor = async () => await dashboard.webContents.executeJavaScript("document.querySelector('#unified-fingerprint').title")
  assert.match(await tooltipFor(), /环境二 · 纽约.*配置版本 1/)
  assert.match(await tooltipFor(), /12 线程/)
  assert.match(await tooltipFor(), /代理：网页代理/)
  assert.match(await tooltipFor(), /代理账户：测试代理账户/)
  assert.match(await tooltipFor(), /代理密码：已配置（已隐藏）/)
  assert.equal((await tooltipFor()).includes('测试代理密码'), false, '指纹提示不应显示代理明文密码。')
  assert.equal(Object.hasOwn(snapshot.tabs[1].proxy, 'password'), false, '代理标签快照不应包含明文密码。')
  await invoke(dashboard, 'selectTab', snapshot.tabs[0].id)
  assert.match(await tooltipFor(), /环境一 · 上海/)
  assert.match(await tooltipFor(), /4 线程/)
  assert.match(await tooltipFor(), /代理：直连（不使用代理）/)
  const proxyTooltip = await dashboard.webContents.executeJavaScript(`fingerprintTooltip({ ...activeUnifiedTab(), proxy: { mode: 'socks5', server: 'socks5://127.0.0.1:1080', username: '测试代理账户', hasPassword: true } })`)
  assert.match(proxyTooltip, /代理地址：socks5:\/\/127.0.0.1:1080/)
  assert.match(proxyTooltip, /代理账户：测试代理账户/)
  assert.match(proxyTooltip, /代理密码：已配置（已隐藏）/)
  assert.equal(Object.hasOwn(snapshot.tabs[0].proxy, 'password'), false, '标签快照不应包含代理明文密码。')
  await record('地址栏指纹图标、标签快照切换和代理信息通过')

  const protocolContents = contentsFor(snapshot.tabs[0])
  const permissionHandler = permissionHandlers.get(protocolContents.session)
  assert.equal(typeof permissionHandler, 'function', '网页会话没有设置外部协议权限处理。')
  for (const [permission, expected] of [['openExternal', false], ['media', true]]) {
    let allowed
    permissionHandler(protocolContents, permission, value => { allowed = value }, {})
    assert.equal(allowed, expected, '外部协议权限策略不正确。')
  }
  await protocolContents.executeJavaScript(`(() => {
    const frame = document.createElement('iframe')
    frame.hidden = true
    frame.src = 'fp-protocol-regression://hidden-frame'
    document.body.appendChild(frame)
  })()`)
  await wait(500)
  assert.equal(externalDecisions.some(item => item.allowed), false, '隐藏框架的外部协议被放行。')
  if (process.env.FP_EXPECT_EXTERNAL_REQUEST === '1') {
    assert.ok(externalDecisions.some(item => item.url === 'fp-protocol-regression://hidden-frame' && !item.allowed), '旧内核没有验证到外部协议拒绝。')
  }
  await record('隐藏框架外部协议拒绝及其他权限行为通过')

  const second = snapshot.tabs[1]
  await invoke(dashboard, 'selectTab', second.id)
  await waitFor(async () => (await invoke(dashboard, 'listTabs')).activeId === second.id, '环境标签没有切换。')
  const selectedAfterSwitch = await dashboard.webContents.executeJavaScript(`document.querySelector('#unified-tabs [data-id="${second.id}"]')?.closest('.unified-tab')?.classList.contains('active')`)
  assert.equal(selectedAfterSwitch, true, '点击环境标签后界面没有定位到对应标签。')
  const reused = await invoke(dashboard, 'newPageTab', { environmentId: second.environmentId, url: `${url}?reuse=1` })
  assert.equal(reused.tabId, second.id, '同一环境创建了第二个标签。')
  assert.equal(reused.tabs.filter(tab => tab.environmentId === second.environmentId).length, 1, '环境没有保持单标签约束。')
  await record('环境列表定位和单环境单标签约束通过')

  const first = snapshot.tabs[0]
  const boundsBefore = dashboard.contentView.children[0]?.getBounds()
  assert.ok(boundsBefore, '当前环境视图没有显示。')
  const [contentWidth, contentHeight] = dashboard.getContentSize()
  assert.equal(boundsBefore.width, contentWidth, '网页视图宽度没有填满窗口。')
  assert.equal(boundsBefore.height, contentHeight - 88, '网页视图没有避开统一浏览器工具栏。')
  await invoke(dashboard, 'closeTab', second.id)
  const closed = (await invoke(dashboard, 'listEnvironments')).environments.find(item => item.id === second.environmentId)
  assert.equal(closed.status, 'closed', '关闭环境标签后状态没有变为已关闭。')
  await invoke(dashboard, 'showDashboard')
  await waitFor(async () => (await invoke(dashboard, 'listTabs')).activeId === null, '首页标签无法重新激活。')
  const finalChrome = await dashboard.webContents.executeJavaScript("({ tabs: document.querySelectorAll('#unified-tabs [role=tab]').length, selected: document.querySelectorAll('#unified-tabs [aria-selected=true]').length, body: document.body.classList.contains('environment-tab-active') })")
  assert.deepEqual(finalChrome, { tabs: 2, selected: 1, body: false }, '返回 SaaS 首页后的标签状态不正确。')
  assert.equal(await dashboard.webContents.executeJavaScript("document.querySelector('#unified-fingerprint').disabled"), true, '返回首页后指纹图标没有停用。')
  await invoke(dashboard, 'closeTab', first.id)
  await record('关闭环境、状态同步和返回首页通过')

  const templatesBeforeDelete = (await invoke(dashboard, 'listProfiles')).profiles.length
  await dashboard.webContents.executeJavaScript("location.hash = '#environments'")
  const deleteSelector = id => `[data-action="delete-env"][data-id="${id}"]`
  async function click (selector) {
    await waitFor(async () => await dashboard.webContents.executeJavaScript(`Boolean(document.querySelector(${JSON.stringify(selector)}))`), '环境删除操作入口没有显示。')
    await dashboard.webContents.executeJavaScript(`document.querySelector(${JSON.stringify(selector)}).click()`)
  }
  await click(`[data-select="${second.environmentId}"]`)
  await click(deleteSelector(second.environmentId))
  const confirmation = await dashboard.webContents.executeJavaScript("document.querySelector('#overlay-root').textContent")
  assert.ok(confirmation.includes('不可恢复') && confirmation.includes('Cookie'), '删除确认没有说明本地数据会被清理。')
  await fs.writeFile(path.join(output, 'environment-delete-confirmation.png'), (await dashboard.webContents.capturePage()).toPNG())
  await click('#overlay-root [data-action="close-overlay"]')
  assert.ok((await invoke(dashboard, 'listEnvironments')).environments.some(item => item.id === second.environmentId), '取消删除后环境被移除。')
  await fs.access(path.join(second.dataDir, 'fingerprint.json'))
  await click(deleteSelector(second.environmentId))
  await click('#overlay-root [data-action="confirm-delete-env"]')
  await waitFor(async () => !(await invoke(dashboard, 'listEnvironments')).environments.some(item => item.id === second.environmentId), '确认后环境没有从列表移除。')
  await waitFor(async () => await dashboard.webContents.executeJavaScript("document.querySelector('#bulkbar')?.hidden === true"), '删除后没有清除环境勾选状态。')
  await fs.access(path.join(first.dataDir, 'fingerprint.json'))

  await invoke(dashboard, 'reopenEnvironment', first.environmentId)
  await invoke(dashboard, 'showDashboard')
  const deniedDelete = await dashboard.webContents.executeJavaScript(`window.browserApi.deleteEnvironment(${JSON.stringify(first.environmentId)})`)
  assert.equal(deniedDelete.ok, false, '后台没有阻止直接删除运行中的环境。')
  await waitFor(async () => await dashboard.webContents.executeJavaScript(`document.querySelector(${JSON.stringify(deleteSelector(first.environmentId))})?.closest('tr')?.textContent.includes('运行中')`), '环境运行状态没有同步。')
  await click(deleteSelector(first.environmentId))
  assert.equal(await dashboard.webContents.executeJavaScript("document.querySelector('[data-action=confirm-delete-env]').textContent"), '关闭并删除', '运行中的环境没有提示先关闭再删除。')
  await click('#overlay-root [data-action="confirm-delete-env"]')
  await waitFor(async () => (await invoke(dashboard, 'listEnvironments')).environments.length === 0, '运行中的环境未完成关闭和删除。')
  assert.equal((await invoke(dashboard, 'listTabs')).tabs.length, 0, '删除环境后仍存在网页标签。')
  assert.equal((await invoke(dashboard, 'listProfiles')).profiles.length, templatesBeforeDelete, '删除环境误删了配置模板。')
  assert.equal(JSON.parse(await fs.readFile(path.join(process.env.FP_BROWSER_DATA_DIR, 'environments.json'), 'utf8')).length, 0, '环境删除没有持久化。')
  for (const deleted of [first, second]) {
    let directoryExists = false
    try { await fs.access(deleted.dataDir); directoryExists = true } catch {}
    if (!directoryExists) continue
    const pending = JSON.parse(await fs.readFile(path.join(process.env.FP_BROWSER_DATA_DIR, 'environment-deletions.json'), 'utf8'))
    assert.ok(pending.some(item => item.id === deleted.environmentId), '被占用的环境数据没有登记待清理任务。')
  }
  await record('环境删除入口、取消确认、关闭后删除、数据清理和模板保留通过')
  const initialGroups = await invoke(dashboard, 'listGroups')
  assert.ok(initialGroups.groups.some(group => group.name === '未分组'), '分组列表缺少系统默认分组。')
  const createdGroup = await invoke(dashboard, 'createGroup', '自动化分组')
  assert.ok(createdGroup.groups.some(group => group.name === '自动化分组'), '新建分组没有持久化。')
  const renamedGroup = await invoke(dashboard, 'updateGroup', { id: createdGroup.group.id, name: '自动化分组改名' })
  assert.ok(renamedGroup.groups.some(group => group.name === '自动化分组改名'), '修改分组没有持久化。')
  const deletedGroup = await invoke(dashboard, 'deleteGroup', createdGroup.group.id)
  assert.equal(deletedGroup.groups.some(group => group.id === createdGroup.group.id), false, '删除分组没有从列表移除。')
  await record('业务分组真实增改删和默认未分组通过')

  async function wizardInput (name, value) {
    await dashboard.webContents.executeJavaScript(`(() => {
      const input = document.querySelector('#wizard-form [name=${name}]')
      input.value = ${JSON.stringify(value)}
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })()`)
  }
  async function startWizard (name, targetUrl) {
    await invoke(dashboard, 'showDashboard')
    await dashboard.webContents.executeJavaScript("location.hash = '#environments'")
    await click('[data-action="create"]')
    await wizardInput('name', name)
    await wizardInput('url', targetUrl)
    await click('#wizard-form button[type="submit"]')
    await waitFor(async () => await dashboard.webContents.executeJavaScript("Boolean(document.querySelector('#wizard-proxy-mode'))"), '创建向导没有进入网络设置。')
  }
  async function finishWizard (expectSuccess = true) {
    await click('#wizard-form button[type="submit"]')
    await waitFor(async () => await dashboard.webContents.executeJavaScript("document.querySelector('#wizard-form button[type=submit]')?.textContent.includes('创建环境')"), '网络设置未能进入创建确认页。')
    await dashboard.webContents.executeJavaScript("document.querySelector('#toast').textContent = ''")
    await dashboard.webContents.executeJavaScript("(() => { const button = document.querySelector('#wizard-form button[type=submit]'); button.click(); button.click() })()")
    if (expectSuccess) await waitFor(async () => await dashboard.webContents.executeJavaScript("location.hash === '#create' && document.querySelector('#wizard-form [name=name]')?.value === '美国旗舰店 · 运营' && document.querySelector('#toast').textContent.includes('已创建')"), '环境创建向导未返回初始创建页。')
  }
  async function fingerprintInput (path, value) {
    await dashboard.webContents.executeJavaScript(`(() => {
      const input = document.querySelector('[data-fingerprint-path="${path}"]')
      input.value = ${JSON.stringify(value)}
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })()`)
  }
  async function chooseHttpProxy (address) {
    await dashboard.webContents.executeJavaScript("(() => { const mode = document.querySelector('#wizard-proxy-mode'); mode.value = 'http'; mode.dispatchEvent(new Event('change', { bubbles: true })) })()")
    await wizardInput('proxyServer', address)
  }
  await startWizard('向导直连环境', `${url}?wizard=direct`)
  assert.equal(await dashboard.webContents.executeJavaScript("document.querySelector('#wizard-proxy-mode').value"), 'direct', '新建环境没有默认选择直连。')
  assert.equal(await dashboard.webContents.executeJavaScript("Boolean(document.querySelector('[name=proxyServer], [data-action=check-proxy]'))"), false, '直连仍被要求填写或检查代理。')
  await click('#wizard-form button[type="submit"]')
  await waitFor(async () => await dashboard.webContents.executeJavaScript("Boolean(document.querySelector('[data-fingerprint-path=\\\"hardware.hardwareConcurrency\\\"]'))"), '指纹自定义页面没有加载。')
  const generatedSeed = await dashboard.webContents.executeJavaScript("document.querySelector('[data-fingerprint-path=\\\"noise.seed\\\"]')?.value")
  assert.ok(generatedSeed, '指纹草稿没有自动生成种子。')
  await fingerprintInput('hardware.hardwareConcurrency', '6')
  await fingerprintInput('noise.seed', 'wizard-custom-seed')
  await click('[data-action="wizard-back"]')
  await click('#wizard-form button[type="submit"]')
  await waitFor(async () => await dashboard.webContents.executeJavaScript("document.querySelector('[data-fingerprint-path=\\\"hardware.hardwareConcurrency\\\"]')?.value === '6'"), '切换步骤后丢失自定义指纹。')
  assert.equal(await dashboard.webContents.executeJavaScript("document.querySelector('[data-fingerprint-path=\\\"noise.seed\\\"]')?.value"), 'wizard-custom-seed', '切换步骤后丢失自定义种子。')
  await dashboard.webContents.executeJavaScript("(() => { const button = document.querySelector('#wizard-form button[type=submit]'); button.click(); button.click() })()")
  await waitFor(async () => await dashboard.webContents.executeJavaScript("location.hash === '#create' && document.querySelector('#toast').textContent.includes('已创建')"), '带自定义指纹的环境创建失败。')
  await waitFor(async () => (await invoke(dashboard, 'listEnvironments')).environments.some(item => item.profileName === '向导直连环境' && item.status === 'open'), '向导无法直接创建无代理环境。')
  const directEnvironments = (await invoke(dashboard, 'listEnvironments')).environments.filter(item => item.profileName === '向导直连环境')
  assert.equal(directEnvironments.length, 1, '重复点击创建按钮产生了重复环境。')
  const directEnvironment = directEnvironments[0]
  assert.equal(directEnvironment.proxy.mode, 'direct', '直连环境保存了错误代理模式。')
  assert.equal(directEnvironment.group, '电商运营', '环境分组没有保存到环境记录。')
  assert.equal(directEnvironment.storage, 'local', '环境保存方式没有保存到环境记录。')
  const directProfile = (await invoke(dashboard, 'listProfiles')).profiles.find(item => item.id === directEnvironment.profileId)
  assert.equal(directProfile.fingerprint.hardware.hardwareConcurrency, 6, '创建环境没有保存自定义线程数。')
  assert.equal(directProfile.fingerprint.noise.seed, 'wizard-custom-seed', '创建环境没有保存自定义指纹种子。')
  assert.equal(directProfile.group, '电商运营', '配置分组没有持久化。')
  assert.equal(directProfile.storage, 'local', '配置保存方式没有持久化。')
  assert.ok(wizardDirectRequests.includes('/?wizard=direct'), '直连环境没有使用本机网络。')
  await record('创建向导默认直连及本机网络请求通过')

  await startWizard('向导代理环境', 'http://wizard-proxy.invalid/')
  await chooseHttpProxy(`socks5://127.0.0.1:${server.address().port}`)
  await click('#wizard-form button[type="submit"]')
  assert.ok(await dashboard.webContents.executeJavaScript("Boolean(document.querySelector('#wizard-proxy-mode'))"), '与代理类型不符的地址未被拦截。')
  await wizardInput('proxyServer', url.replace(/\/$/, ''))
  await wizardInput('proxyUsername', 'wizard-user')
  await wizardInput('proxyPassword', 'wizard-secret')
  await wait(100)
  await fs.writeFile(path.join(output, 'wizard-proxy-settings.png'), (await dashboard.webContents.capturePage()).toPNG())
  await click('#wizard-form button[type="submit"]')
  await click('[data-action="wizard-back"]')
  assert.equal(await dashboard.webContents.executeJavaScript("document.querySelector('[name=proxyServer]').value"), url.replace(/\/$/, ''), '返回上一步丢失了代理设置。')
  await finishWizard()
  await waitFor(async () => (await invoke(dashboard, 'listEnvironments')).environments.some(item => item.profileName === '向导代理环境' && item.status === 'open'), '向导没有使用代理创建环境。')
  const proxyEnvironment = (await invoke(dashboard, 'listEnvironments')).environments.find(item => item.profileName === '向导代理环境')
  assert.deepEqual(proxyEnvironment.proxy, { mode: 'http', server: url.replace(/\/$/, ''), username: 'wizard-user', password: 'wizard-secret' }, '向导代理设置没有完整保存到环境快照。')
  assert.ok(wizardProxyRequests.some(request => request.authorized), '环境请求没有经过代理并完成账户认证。')
  const savedProxyEnvironment = JSON.parse(await fs.readFile(path.join(process.env.FP_BROWSER_DATA_DIR, 'environments.json'), 'utf8')).find(item => item.id === proxyEnvironment.id)
  assert.deepEqual(savedProxyEnvironment.proxy, proxyEnvironment.proxy, '环境代理设置没有持久化。')

  // 用本地 SOCKS5 服务验证协商、代理端域名解析及实际网页请求。
  socksServer = net.createServer(socket => {
    socksSockets.add(socket)
    socket.on('close', () => socksSockets.delete(socket))
    socket.on('error', () => socket.destroy())
    let stage = 'greeting'
    let buffered = Buffer.alloc(0)
    let destination = ''
    let authenticated = false
    socket.on('data', chunk => {
      buffered = Buffer.concat([buffered, chunk])
      if (stage === 'greeting') {
        if (buffered.length < 2 || buffered.length < 2 + buffered[1]) return
        const method = requireSocksAuthentication ? 2 : 0
        if (buffered[0] !== 5 || !buffered.subarray(2, 2 + buffered[1]).includes(method)) { socket.destroy(); return }
        buffered = buffered.subarray(2 + buffered[1])
        socket.write(Buffer.from([5, method]))
        stage = requireSocksAuthentication ? 'authentication' : 'connect'
      }
      if (stage === 'authentication') {
        if (buffered.length < 2 || buffered.length < 3 + buffered[1]) return
        const passwordOffset = 2 + buffered[1]
        const length = passwordOffset + 1 + buffered[passwordOffset]
        if (buffered.length < length) return
        authenticated = buffered[0] === 1 && buffered.subarray(2, passwordOffset).toString('utf8') === 'socks-user' && buffered.subarray(passwordOffset + 1, length).toString('utf8') === 'socks-secret'
        buffered = buffered.subarray(length)
        // 分段返回认证结果，覆盖真实网络报文被拆分的情况。
        if (authenticated) {
          socket.write(Buffer.from([1]))
          setTimeout(() => { if (!socket.destroyed) socket.write(Buffer.from([0])) }, 10)
        } else socket.write(Buffer.from([1, 1]))
        if (!authenticated) { socket.end(); return }
        stage = 'connect'
      }
      if (stage === 'connect') {
        if (buffered.length < 5) return
        if (buffered[0] !== 5 || buffered[1] !== 1 || buffered[3] !== 3) { socket.destroy(); return }
        const length = 7 + buffered[4]
        if (buffered.length < length) return
        destination = buffered.subarray(5, length - 2).toString('utf8')
        buffered = buffered.subarray(length)
        socket.write(Buffer.from([5, 0, 0, 1, 127, 0, 0, 1, 0, 80]))
        stage = 'request'
      }
      if (stage === 'request' && buffered.includes('\r\n\r\n')) {
        wizardSocksRequests.push({ destination, request: buffered.toString('utf8'), authenticated })
        stage = 'done'
        const body = '<title>SOCKS5 代理验证</title><p>' + 'x'.repeat(256 * 1024) + '</p>'
        socket.end(`HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: ${Buffer.byteLength(body)}\r\nConnection: close\r\n\r\n${body}`)
      }
    })
  })
  await new Promise(resolve => socksServer.listen(0, '127.0.0.1', resolve))
  await startWizard('向导 SOCKS5 环境', 'http://wizard-socks.invalid/')
  await dashboard.webContents.executeJavaScript("(() => { const mode = document.querySelector('#wizard-proxy-mode'); mode.value = 'socks5'; mode.dispatchEvent(new Event('change', { bubbles: true })) })()")
  const socksAddress = `socks5://127.0.0.1:${socksServer.address().port}`
  await wizardInput('proxyServer', socksAddress)
  await finishWizard()
  const socksEnvironment = (await invoke(dashboard, 'listEnvironments')).environments.find(item => item.profileName === '向导 SOCKS5 环境')
  assert.deepEqual(socksEnvironment.proxy, { mode: 'socks5', server: socksAddress, username: '', password: '' }, 'SOCKS5 环境没有保存真实代理设置。')
  assert.ok(wizardSocksRequests.some(item => item.destination === 'wizard-socks.invalid' && item.request.startsWith('GET / HTTP/1.1')), 'SOCKS5 环境没有经代理解析域名并发送真实网页请求。')
  await record('SOCKS5 创建向导、代理端域名解析及真实网页请求通过')

  requireSocksAuthentication = true
  async function startAuthenticatedSocks (name, password) {
    await startWizard(name, 'http://wizard-socks-auth.invalid/')
    await dashboard.webContents.executeJavaScript("(() => { const mode = document.querySelector('#wizard-proxy-mode'); mode.value = 'socks5'; mode.dispatchEvent(new Event('change', { bubbles: true })) })()")
    await wizardInput('proxyServer', socksAddress)
    await wizardInput('proxyUsername', 'socks-user')
    await wizardInput('proxyPassword', password)
  }
  await startAuthenticatedSocks('向导 SOCKS5 认证环境', 'socks-secret')
  await finishWizard()
  const authenticatedEnvironment = (await invoke(dashboard, 'listEnvironments')).environments.find(item => item.profileName === '向导 SOCKS5 认证环境')
  assert.deepEqual(authenticatedEnvironment.proxy, { mode: 'socks5', server: socksAddress, username: 'socks-user', password: 'socks-secret' }, 'SOCKS5 认证凭据没有完整保存。')
  assert.ok(wizardSocksRequests.some(item => item.destination === 'wizard-socks-auth.invalid' && item.authenticated), 'SOCKS5 账号密码认证后没有发送真实网页请求。')
  const authenticatedTab = (await invoke(dashboard, 'listTabs')).tabs.find(item => item.environmentId === authenticatedEnvironment.id)
  assert.equal(await contentsFor(authenticatedTab).executeJavaScript('document.body.textContent.length'), 256 * 1024, 'SOCKS5 转接截断了网页响应。')
  const bridgeResolution = await contentsFor(authenticatedTab).session.resolveProxy('http://wizard-socks-auth.invalid/')
  const bridgePort = Number(bridgeResolution.match(/:(\d+)$/)?.[1])
  assert.ok(bridgePort && bridgePort !== socksServer.address().port, '认证环境没有使用独立本地转接。')
  await invoke(dashboard, 'closeEnvironment', authenticatedEnvironment.id)
  const bridgeClosed = await new Promise(resolve => {
    const socket = net.createConnection({ host: '127.0.0.1', port: bridgePort })
    socket.once('connect', () => { socket.destroy(); resolve(false) })
    socket.once('error', () => resolve(true))
  })
  assert.equal(bridgeClosed, true, '关闭环境没有释放 SOCKS5 转接端口。')
  const requestsBeforeReopen = wizardSocksRequests.length
  await invoke(dashboard, 'reopenEnvironment', authenticatedEnvironment.id)
  assert.ok(wizardSocksRequests.slice(requestsBeforeReopen).some(item => item.authenticated), '恢复环境没有重新完成 SOCKS5 认证。')
  const beforeInvalidCredentials = wizardSocksRequests.length
  await startAuthenticatedSocks('向导 SOCKS5 错误密码环境', 'wrong-password')
  await finishWizard(false)
  await waitFor(async () => await dashboard.webContents.executeJavaScript("document.querySelector('#toast').textContent.includes('账号或密码错误')"), 'SOCKS5 错误密码没有被阻止。')
  assert.equal(wizardSocksRequests.length, beforeInvalidCredentials, 'SOCKS5 错误密码仍发送了网页请求。')
  assert.equal((await invoke(dashboard, 'listTabs')).tabs.length, 4, 'SOCKS5 认证失败仍创建了网页标签。')
  await record('SOCKS5 账号密码认证、错误密码阻止直连、关闭释放转接与恢复认证通过')

  const unavailableProxy = http.createServer()
  await new Promise(resolve => unavailableProxy.listen(0, '127.0.0.1', resolve))
  const unavailableAddress = `http://127.0.0.1:${unavailableProxy.address().port}`
  await new Promise(resolve => unavailableProxy.close(resolve))
  await startWizard('向导无效代理环境', `${url}?wizard=proxy-failure`)
  await chooseHttpProxy(unavailableAddress)
  await finishWizard(false)
  await waitFor(async () => await dashboard.webContents.executeJavaScript("document.querySelector('#toast').textContent.includes('已阻止直连')"), '代理连接失败没有提示阻止直连。')
  assert.equal(wizardDirectRequests.includes('/?wizard=proxy-failure'), false, '代理失败后流量被静默改为直连。')
  assert.equal((await invoke(dashboard, 'listTabs')).tabs.length, 4, '无效代理环境仍打开了网页标签。')
  const failedProxyEnvironment = (await invoke(dashboard, 'listEnvironments')).environments.find(item => item.profileName === '向导无效代理环境')
  assert.ok(failedProxyEnvironment?.id, '代理启动失败没有返回已创建环境 ID。')
  assert.equal(failedProxyEnvironment.status, 'closed', '代理启动失败的环境状态不应伪装为运行中。')
  await record('向导默认直连、真实代理与认证、配置持久化和连接失败阻止直连通过')
  result.ok = true
  await record('全部统一标签回归完成')
  clearTimeout(timeout)
  server.close()
  socksServer.close()
  for (const socket of socksSockets) socket.destroy()
  app.quit()
}

void run().catch(async error => {
  result.error = error.message
  result.errorStack = error.stack
  await record('检查失败')
  server?.close()
  socksServer?.close()
  for (const socket of socksSockets) socket.destroy()
  clearTimeout(timeout)
  app.exit(1)
})
