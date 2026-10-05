const assert = require('node:assert/strict')
const path = require('node:path')
const fs = require('node:fs/promises')
const http = require('node:http')
const net = require('node:net')
const { spawn } = require('node:child_process')
const { app, BrowserWindow, webContents } = require('electron/main')

const output = process.env.FP_TABS_TEST_OUTPUT
const keepOpen = process.argv.includes('--keep-open')
const result = { ok: false, stages: [], tabs: [], screenshots: [] }
let server
const proxyServers = []
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const timeout = setTimeout(() => { void fail(new Error('多标签原生测试超时。')) }, 120000)
let finished = false
async function record (stage) {
  result.stages.push(stage)
  await fs.writeFile(path.join(output, 'result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8')
}
async function fail (error) {
  if (finished) return
  finished = true
  clearTimeout(timeout)
  result.error = error.message
  await record('检查失败')
  server?.close()
  for (const proxy of proxyServers) proxy.close()
  app.exit(1)
}
async function invoke (window, method, payload) {
  const response = await window.webContents.executeJavaScript(`window.browserApi[${JSON.stringify(method)}](${payload === undefined ? '' : JSON.stringify(payload)})`)
  assert.equal(response.ok, true, response.error || '应用接口操作失败。')
  return response
}
function contentsFor (tab) {
  const contents = webContents.getAllWebContents().find(item => item.session.storagePath === tab.dataDir)
  assert.ok(contents, '找不到标签的原生页面视图。')
  return contents
}
async function signalsFor (contents) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const signals = await contents.executeJavaScript('window.testSignals || null')
    if (signals) return signals
    await delay(50)
  }
  throw new Error('指纹检测页面没有完成读取。')
}
async function waitFor (condition, message) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await condition()) return
    await delay(50)
  }
  throw new Error(message)
}
async function capture (contents, filename, rect) {
  let failure
  for (let attempt = 0; attempt < 10; attempt++) {
    await delay(300)
    try {
      const screenshot = await contents.capturePage(rect)
      if (screenshot.isEmpty()) continue
      const png = screenshot.toPNG()
      assert.ok(png.length > 1000, '页面截图为空。')
      await fs.writeFile(path.join(output, filename), png)
      result.screenshots.push(filename)
      return
    } catch (error) {
      failure = error.message
    }
  }
  throw new Error(`页面未完成绘制，截图失败。${failure || ''}`)
}

const dashboardReady = new Promise(resolve => app.once('browser-window-created', (_event, window) => {
  window.webContents.once('did-finish-load', () => resolve(window))
}))
require('../main')

async function run () {
  await fs.mkdir(output, { recursive: true })
  const dashboard = await dashboardReady
  await record('管理页启动完成')
  const secondInstance = spawn(process.execPath, [path.resolve(__dirname, '..'), `--user-data-dir=${app.getPath('userData')}`], {
    env: process.env,
    windowsHide: true,
    stdio: 'ignore'
  })
  const secondInstanceExit = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      secondInstance.kill()
      reject(new Error('重复实例没有及时退出。'))
    }, 10000)
    secondInstance.once('error', error => { clearTimeout(timer); reject(error) })
    secondInstance.once('exit', code => { clearTimeout(timer); resolve(code) })
  })
  assert.equal(secondInstanceExit, 0, '重复实例没有正常退出。')
  assert.equal(BrowserWindow.getAllWindows().length, 1, '重复实例创建了新的管理窗口。')
  await record('同一数据目录单实例保护通过')
  const page = await fs.readFile(path.join(__dirname, 'fingerprint-page.html'))
  server = http.createServer((request, response) => {
    if (request.url === '/headers') {
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.end(JSON.stringify({ acceptLanguage: request.headers['accept-language'] || '' }))
    } else {
      response.setHeader('Content-Type', 'text/html; charset=utf-8')
      response.end(page)
    }
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const url = `http://127.0.0.1:${server.address().port}/`
  const proxyEndpoints = []
  for (const [name, username, password] of [
    ['代理一', 'proxy-user-1', 'proxy-pass-1'],
    ['代理二', 'proxy-user-2', 'proxy-pass-2']
  ]) {
    const hits = []
    const expectedAuthorization = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
    const proxy = http.createServer((request, response) => {
      hits.push({ authorization: request.headers['proxy-authorization'] || '', url: request.url })
      if (request.headers['proxy-authorization'] !== expectedAuthorization) {
        response.writeHead(407, { 'Proxy-Authenticate': 'Basic realm="fingerprint-browser"' })
        response.end()
        return
      }
      if (request.url.endsWith('/headers')) {
        response.setHeader('Content-Type', 'application/json; charset=utf-8')
        response.end(JSON.stringify({ acceptLanguage: request.headers['accept-language'] || '', proxy: name }))
        return
      }
      response.setHeader('Content-Type', 'text/html; charset=utf-8')
      response.end(page)
    })
    await new Promise(resolve => proxy.listen(0, '127.0.0.1', resolve))
    proxyServers.push(proxy)
    proxyEndpoints.push({ name, username, password, expectedAuthorization, hits, server: `http://127.0.0.1:${proxy.address().port}` })
  }
  const saved = []
  for (const [name, cpu, language, timezone, width, height] of [
    ['标签甲 · 中文上海', 4, 'zh-CN', 'Asia/Shanghai', 1920, 1080],
    ['标签乙 · 英文纽约', 12, 'en-US', 'America/New_York', 1366, 768]
  ]) {
    const { profile } = await invoke(dashboard, 'getDraft')
    profile.name = name
    profile.url = url
    profile.fingerprint.locale = { language, languages: [language, language.split('-')[0]], timezone }
    profile.fingerprint.browser.acceptLanguage = `${language},${language.split('-')[0]};q=0.9`
    profile.fingerprint.hardware.hardwareConcurrency = cpu
    Object.assign(profile.fingerprint.screen, { width, height, availWidth: width, availHeight: height - 40 })
    const response = await invoke(dashboard, 'saveProfile', profile)
    saved.push(response.profile)
    await invoke(dashboard, 'launchProfile', { id: profile.id })
    await record(`${name}创建完成`)
  }
  const host = BrowserWindow.getAllWindows().find(window => window !== dashboard)
  assert.ok(host, '没有创建多标签浏览器窗口。')
  assert.equal(BrowserWindow.getAllWindows().length, 2, '没有在同一窗口中承载标签。')
  const snapshot = await invoke(host, 'listTabs')
  assert.equal(snapshot.tabs.length, 2, '标签数量不正确。')
  assert.notEqual(snapshot.tabs[0].dataDir, snapshot.tabs[1].dataDir, '标签数据目录发生复用。')
  const [first, second] = snapshot.tabs.map(contentsFor)
  assert.notEqual(first.session, second.session, '标签会话发生复用。')
  for (let index = 0; index < snapshot.tabs.length; index++) {
    const tab = snapshot.tabs[index]
    await invoke(host, 'selectTab', tab.id)
    const contents = contentsFor(tab)
    const signals = await signalsFor(contents)
    const fingerprint = saved[index].fingerprint
    assert.equal(signals.language, fingerprint.locale.language, '页面语言不符合标签配置。')
    assert.equal(signals.timezone, fingerprint.locale.timezone, '页面时区不符合标签配置。')
    assert.equal(signals.hardwareConcurrency, fingerprint.hardware.hardwareConcurrency, '页面线程数不符合标签配置。')
    assert.equal(signals.screenWidth, fingerprint.screen.width, '页面屏幕宽度不符合标签配置。')
    assert.equal(signals.screenHeight, fingerprint.screen.height, '页面屏幕高度不符合标签配置。')
    assert.equal(signals.acceptLanguage, fingerprint.browser.acceptLanguage, '请求语言不符合标签配置。')
    if (!fingerprint.browser.userAgent) assert.equal(signals.userAgent.includes('Electron/'), false, '默认 User-Agent 不应暴露 Electron 版本。')
    assert.equal(contents.session.storagePath, tab.dataDir, '实际会话数据路径不符合标签目录。')
    assert.equal(await contents.executeJavaScript('typeof window.browserApi'), 'undefined', '远程页面不应暴露应用通信接口。')
    assert.equal(await contents.executeJavaScript('typeof require'), 'undefined', '远程页面不应启用 Node.js。')
    const diskProfile = JSON.parse(await fs.readFile(path.join(tab.dataDir, 'fingerprint.json'), 'utf8'))
    assert.equal(diskProfile.fingerprint.locale.language, signals.language, '标签独立指纹快照未保存。')
    result.tabs.push({ id: tab.id, dataDir: tab.dataDir, signals })
    result.display = {
      windowVisible: host.isVisible(), windowFocused: host.isFocused(), windowBounds: host.getBounds(),
      rootBounds: host.contentView.getBounds(),
      children: host.contentView.children.map(view => ({ bounds: view.getBounds(), visible: view.getVisible() })),
      page: await contents.executeJavaScript('({visibility:document.visibilityState,width:innerWidth,height:innerHeight})')
    }
    await record(`标签 ${index + 1} 页面指纹读取和独立目录验证通过`)
    await capture(contents, `tab-${index + 1}.png`)
    await capture(host.webContents, `tab-${index + 1}-bar.png`, { x: 0, y: 0, width: host.getContentSize()[0], height: 144 })
  }
  await record('同一窗口内两个标签、独立数据目录和不同页面指纹通过')
  await invoke(host, 'selectTab', snapshot.tabs[0].id)
  await first.executeJavaScript("localStorage.setItem('tab-isolation','甲'); sessionStorage.setItem('tab-isolation','甲')")
  await first.session.cookies.set({ url, name: 'tab-isolation', value: 'first' })
  await invoke(host, 'selectTab', snapshot.tabs[1].id)
  assert.equal(await second.executeJavaScript("localStorage.getItem('tab-isolation')"), null, '标签本地存储发生泄漏。')
  assert.equal(await second.executeJavaScript("sessionStorage.getItem('tab-isolation')"), null, '标签会话存储发生泄漏。')
  assert.equal((await second.session.cookies.get({ url, name: 'tab-isolation' })).length, 0, '标签 Cookie 发生泄漏。')
  await record('Cookie、本地存储和会话存储隔离通过')
  await first.executeJavaScript(`(async () => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open('tab-isolation', 1)
      request.onupgradeneeded = () => request.result.createObjectStore('values')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    await new Promise((resolve, reject) => {
      const transaction = database.transaction('values', 'readwrite')
      transaction.objectStore('values').put('甲', 'marker')
      transaction.oncomplete = resolve
      transaction.onerror = reject
    })
    database.close()
    await (await caches.open('tab-isolation')).put('/marker', new Response('甲'))
  })()`)
  assert.equal(await second.executeJavaScript("(async () => (await indexedDB.databases()).some(database => database.name === 'tab-isolation'))()"), false, '标签数据库发生泄漏。')
  assert.equal(await second.executeJavaScript("caches.has('tab-isolation')"), false, '标签缓存存储发生泄漏。')
  await first.session.cookies.flushStore()
  await second.session.cookies.set({ url, name: 'tab-own-cookie', value: 'second' })
  await second.session.cookies.flushStore()
  for (const tab of snapshot.tabs) await fs.access(path.join(tab.dataDir, 'Network', 'Cookies'))
  await record('数据库和缓存存储隔离、独立 Cookie 文件落盘通过')
  const duplicate = await invoke(host, 'launchProfile', { id: saved[0].id })
  const sameProfileTab = (await invoke(host, 'listTabs')).tabs.find(tab => tab.id === duplicate.tabId)
  const duplicateContents = contentsFor(sameProfileTab)
  assert.notEqual(sameProfileTab.dataDir, snapshot.tabs[0].dataDir, '相同配置的新标签复用了目录。')
  assert.notEqual(duplicateContents.session, first.session, '相同配置的新标签复用了会话。')
  assert.equal(await duplicateContents.executeJavaScript("localStorage.getItem('tab-isolation')"), null, '相同配置的新标签共享了本地存储。')
  const duplicateCloseResponses = await Promise.all([
    host.webContents.executeJavaScript(`window.browserApi.closeTab(${JSON.stringify(duplicate.tabId)})`),
    host.webContents.executeJavaScript(`window.browserApi.closeTab(${JSON.stringify(duplicate.tabId)})`)
  ])
  assert.ok(duplicateCloseResponses.every(response => response.ok), '重复关闭同一标签不应触发原生页面异常。')
  assert.equal((await invoke(host, 'listTabs')).tabs.length, 2, '关闭标签没有释放视图。')
  await fs.access(sameProfileTab.dataDir)
  await record('同一配置多标签独立和关闭保留数据目录通过')
  saved[0].fingerprint.hardware.hardwareConcurrency = 6
  const updated = await invoke(dashboard, 'saveProfile', saved[0])
  await invoke(host, 'selectTab', snapshot.tabs[0].id)
  assert.equal((await signalsFor(first)).hardwareConcurrency, 4, '配置编辑影响了已打开标签。')
  const revised = await invoke(host, 'launchProfile', { id: updated.profile.id })
  const revisedTab = (await invoke(host, 'listTabs')).tabs.find(tab => tab.id === revised.tabId)
  assert.equal((await signalsFor(contentsFor(revisedTab))).hardwareConcurrency, 6, '新标签没有使用更新后的指纹。')
  await invoke(host, 'closeTab', revised.tabId)
  await record('已打开标签保持独立指纹快照、新标签使用最新配置通过')
  const staleSave = await dashboard.webContents.executeJavaScript(`window.browserApi.saveProfile(${JSON.stringify(saved[0])})`)
  assert.equal(staleSave.ok, false, '过期编辑覆盖了新配置。')
  assert.match(staleSave.error, /重新加载/)
  const invalidTimezone = structuredClone(updated.profile)
  invalidTimezone.fingerprint.locale.timezone = '不存在的时区'
  const invalidSave = await dashboard.webContents.executeJavaScript(`window.browserApi.saveProfile(${JSON.stringify(invalidTimezone)})`)
  assert.equal(invalidSave.ok, false, '无效时区通过了应用保存接口。')
  assert.match(invalidSave.error, /有效时区/)
  const persisted = JSON.parse(await fs.readFile(path.join(app.getPath('userData'), 'profiles.json'), 'utf8'))
  assert.equal(persisted.find(profile => profile.id === updated.profile.id).revision, updated.profile.revision)
  await fs.access(path.join(app.getPath('userData'), 'profiles.json.bak'))
  await record('版本冲突、非法配置拒绝和备份落盘通过')
  const rejected = await host.webContents.executeJavaScript("window.browserApi.navigateTab({ id: " + JSON.stringify(snapshot.tabs[0].id) + ", action: 'load', url: 'file:///C:/Windows/win.ini' })")
  assert.equal(rejected.ok, false, '标签不应允许加载本地文件。')
  await invoke(host, 'navigateTab', { id: snapshot.tabs[0].id, action: 'load', url: `${url}?navigation-check` })
  await invoke(host, 'selectTab', snapshot.tabs[0].id)
  assert.equal((await signalsFor(first)).hardwareConcurrency, 4, '标签导航后指纹发生变化。')
  assert.equal(await first.executeJavaScript("localStorage.getItem('tab-isolation')"), '甲', '标签导航丢失独立存储。')
  const visibleTabs = await host.webContents.executeJavaScript("({ count: document.querySelectorAll('[role=tab]').length, selected: document.querySelectorAll('[aria-selected=true]').length, chromeHeight: document.querySelector('#browser-chrome').getBoundingClientRect().height })")
  assert.equal(visibleTabs.count, 2, '标签栏未显示两个标签。')
  assert.equal(visibleTabs.selected, 1, '标签栏选中状态错误。')
  assert.ok(Math.abs(visibleTabs.chromeHeight - 144) < 1, '标签栏高度与原生页面位置不匹配。')
  await record('标签导航、界面选中状态和远程页面权限检查通过')
  await host.webContents.executeJavaScript(`document.querySelector('button[data-action="select"][data-id="${snapshot.tabs[1].id}"]').click()`)
  await waitFor(async () => (await invoke(host, 'listTabs')).activeId === snapshot.tabs[1].id, '标签按钮未切换原生页面。')
  await host.webContents.executeJavaScript("document.querySelector('.active .tab-select').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))")
  await waitFor(async () => (await invoke(host, 'listTabs')).activeId === snapshot.tabs[0].id, '键盘无法切换标签。')
  await host.webContents.executeJavaScript('document.querySelector("#back").click()')
  await waitFor(() => first.getURL() === url && !first.isLoading(), '标签后退失败。')
  await host.webContents.executeJavaScript('document.querySelector("#forward").click()')
  await waitFor(() => first.getURL().includes('navigation-check') && !first.isLoading(), '标签前进失败。')
  await host.webContents.executeJavaScript('document.querySelector("#reload").click()')
  await waitFor(async () => !first.isLoading() && (await first.executeJavaScript('!!window.testSignals')), '标签刷新失败。')
  await host.webContents.executeJavaScript(`document.querySelector('#profile-picker').value = ${JSON.stringify(saved[1].id)}; document.querySelector('#new-tab').click()`)
  await waitFor(async () => (await invoke(host, 'listTabs')).tabs.length === 3, '新建标签按钮没有创建标签。')
  const extra = (await invoke(host, 'listTabs')).tabs.find(tab => !snapshot.tabs.some(original => original.id === tab.id))
  assert.equal((await signalsFor(contentsFor(extra))).hardwareConcurrency, 12, '新建按钮没有使用选中的指纹配置。')
  await host.webContents.executeJavaScript(`document.querySelector('button[data-action="close"][data-id="${extra.id}"]').click()`)
  await waitFor(async () => (await invoke(host, 'listTabs')).tabs.length === 2, '关闭标签按钮没有移除标签。')
  const currentSize = host.getSize()
  host.setSize(1100, 720)
  await delay(300)
  const activeView = host.contentView.children[0]
  const [contentWidth, contentHeight] = host.getContentSize()
  assert.equal(activeView.getBounds().width, contentWidth, '窗口缩放后标签宽度错误。')
  assert.equal(activeView.getBounds().height, contentHeight - 144, '窗口缩放后标签高度错误。')
  host.setSize(...currentSize)
  await record('新建、关闭、切换按钮、键盘、前进后退刷新及窗口缩放通过')
  const editorProfile = (await invoke(dashboard, 'listProfiles')).profiles[0]
  const editorPayload = structuredClone(editorProfile)
  editorPayload.name = '管理页保存回归'
  const editorResponse = await invoke(dashboard, 'saveProfile', editorPayload)
  assert.equal(editorResponse.profile.revision, editorProfile.revision + 1, '管理页保存没有携带正确版本。')
  await record('管理页配置版本提交与内容安全策略回归通过')
  await dashboard.webContents.executeJavaScript("location.hash = 'environments'")
  await waitFor(async () => await dashboard.webContents.executeJavaScript("Boolean(document.querySelector('#env-rows'))"), '高保真环境页没有加载。')
  const dashboardEnvironments = await invoke(dashboard, 'listEnvironments')
  const firstEnvironment = dashboardEnvironments.environments.find(environment => environment.id === snapshot.tabs[0].environmentId)
  assert.ok(firstEnvironment, '没有保存新建环境记录。')
  assert.equal(firstEnvironment.status, 'open', '正在使用的环境状态不正确。')
  assert.equal(firstEnvironment.creationUrl, url, '环境没有保存创建时的启动地址。')
  const environmentCards = await dashboard.webContents.executeJavaScript("document.querySelectorAll('#env-rows .environment-card').length")
  assert.equal(environmentCards, dashboardEnvironments.environments.length, '管理页没有显示完整独立环境列表。')
  const environmentTable = await dashboard.webContents.executeJavaScript(`({
    rows: document.querySelectorAll('#env-rows .environment-row').length,
    search: Boolean(document.querySelector('#env-search')),
    statusFilter: Boolean(document.querySelector('[data-filter=running]')),
    pagination: Boolean(document.querySelector('.pagination'))
  })`)
  assert.equal(environmentTable.rows, dashboardEnvironments.environments.length, '管理页环境表格行数不正确。')
  assert.equal(environmentTable.search, true, '管理页没有显示环境搜索框。')
  assert.equal(environmentTable.statusFilter, true, '管理页没有显示环境状态筛选。')
  assert.equal(environmentTable.pagination, true, '管理页没有显示环境分页控件。')
  const environmentCountBeforeCancel = dashboardEnvironments.environments.length
  await dashboard.webContents.executeJavaScript("location.hash = 'environments'")
  await waitFor(async () => await dashboard.webContents.executeJavaScript("Boolean(document.querySelector('#env-search'))"), '返回环境列表失败。')
  assert.equal((await invoke(dashboard, 'listEnvironments')).environments.length, environmentCountBeforeCancel, '取消创建环境后不应新增环境记录。')
  await record('新建环境摘要确认和取消操作通过')
  const secondEnvironmentId = snapshot.tabs[1].environmentId
  await dashboard.webContents.executeJavaScript(`const input = document.querySelector('#env-search'); input.value = ${JSON.stringify(secondEnvironmentId)}; input.dispatchEvent(new Event('input', { bubbles: true }))`)
  await waitFor(async () => await dashboard.webContents.executeJavaScript("document.querySelectorAll('#env-rows .environment-row').length === 1"), '环境搜索没有过滤列表。')
  await dashboard.webContents.executeJavaScript("document.querySelector('#environment-reset').click()")
  await waitFor(async () => await dashboard.webContents.executeJavaScript(`document.querySelectorAll('#env-rows .environment-row').length === ${dashboardEnvironments.environments.length}`), '环境筛选重置失败。')
  await dashboard.webContents.executeJavaScript(`document.querySelector('input[data-action="select-environment"][data-id="${secondEnvironmentId}"]').click()`)
  await dashboard.webContents.executeJavaScript("document.querySelector('#bulk-close-environments').click()")
  await waitFor(async () => (await invoke(dashboard, 'listEnvironments')).environments.find(environment => environment.id === secondEnvironmentId)?.status === 'closed', '批量关闭环境失败。')
  await dashboard.webContents.executeJavaScript(`document.querySelector('input[data-action="select-environment"][data-id="${secondEnvironmentId}"]').click()`)
  await dashboard.webContents.executeJavaScript("document.querySelector('#bulk-open-environments').click()")
  await waitFor(async () => (await invoke(dashboard, 'listEnvironments')).environments.find(environment => environment.id === secondEnvironmentId)?.status === 'open', '批量打开环境失败。')
  await record('环境表格搜索、筛选、分页控件和批量开关通过')
  const proxyTabs = []
  for (const endpoint of proxyEndpoints) {
    const { profile } = await invoke(dashboard, 'getDraft')
    profile.name = `代理测试 · ${endpoint.name}`
    profile.url = 'http://proxy-target.test/'
    profile.proxy = { mode: 'http', server: endpoint.server, username: endpoint.username, password: endpoint.password }
    const savedProxy = await invoke(dashboard, 'saveProfile', profile)
    const launchedProxy = await invoke(dashboard, 'launchProfile', { id: savedProxy.profile.id })
    const proxyTab = (await invoke(host, 'listTabs')).tabs.find(tab => tab.id === launchedProxy.tabId)
    assert.ok(proxyTab, '代理环境没有创建网页标签。')
    proxyTabs.push({ profile: savedProxy.profile, tab: proxyTab, endpoint })
    const proxyContents = contentsFor(proxyTab)
    await signalsFor(proxyContents)
    await waitFor(() => endpoint.hits.some(hit => hit.authorization === endpoint.expectedAuthorization), `代理 ${endpoint.name} 没有完成 407 认证。`)
    assert.equal(savedProxy.profile.proxy.username, endpoint.username, `代理 ${endpoint.name} 认证配置没有按环境保存。`)
    assert.equal(endpoint.hits.some(hit => hit.authorization && hit.authorization !== endpoint.expectedAuthorization), false, `代理 ${endpoint.name} 认证信息发生串用。`)
    assert.equal(proxyContents.session.storagePath, proxyTab.dataDir, '代理环境没有使用独立数据目录。')
  }
  for (const item of proxyTabs) await invoke(host, 'closeTab', item.tab.id)
  await record('按环境代理设置、407 认证隔离和代理请求检测通过')
  const beforeUnavailableProxy = (await invoke(dashboard, 'listEnvironments')).environments.length
  const unavailableProbe = net.createServer()
  await new Promise(resolve => unavailableProbe.listen(0, '127.0.0.1', resolve))
  const unavailablePort = unavailableProbe.address().port
  await new Promise(resolve => unavailableProbe.close(resolve))
  const { profile: unavailableProfile } = await invoke(dashboard, 'getDraft')
  unavailableProfile.name = '代理不可达阻断测试'
  unavailableProfile.url = 'http://proxy-target.test/'
  unavailableProfile.proxy = { mode: 'http', server: `http://127.0.0.1:${unavailablePort}` }
  const unavailableSaved = await invoke(dashboard, 'saveProfile', unavailableProfile)
  const unavailableResult = await dashboard.webContents.executeJavaScript(`window.browserApi.launchProfile(${JSON.stringify({ id: unavailableSaved.profile.id })})`)
  assert.equal(unavailableResult.ok, false, '代理端口不可达时不应启动环境。')
  assert.match(unavailableResult.error, /代理检测失败|代理连接超时/, '代理不可达错误提示不明确。')
  assert.equal((await invoke(dashboard, 'listEnvironments')).environments.length, beforeUnavailableProxy + 1, '代理不可达时应保留已创建环境供重试。')
  assert.equal(unavailableResult.launchState, 'created', '代理不可达结果没有区分已创建未启动。')
  assert.ok(unavailableResult.environmentId, '代理不可达结果没有返回环境 ID。')
  await record('代理不可达时保留已创建环境并返回启动阶段通过')
  process.env.FP_PROXY_TIMEOUT_MS = '500'
  const hangingProxy = http.createServer(() => {})
  await new Promise(resolve => hangingProxy.listen(0, '127.0.0.1', resolve))
  const { profile: hangingProfile } = await invoke(dashboard, 'getDraft')
  hangingProfile.name = '代理响应超时测试'
  hangingProfile.url = 'http://proxy-target.test/'
  hangingProfile.proxy = { mode: 'http', server: `http://127.0.0.1:${hangingProxy.address().port}` }
  const hangingSaved = await invoke(dashboard, 'saveProfile', hangingProfile)
  const hangingResult = await dashboard.webContents.executeJavaScript(`window.browserApi.launchProfile(${JSON.stringify({ id: hangingSaved.profile.id })})`)
  assert.equal(hangingResult.ok, false, '代理不响应时不应无限等待。')
  assert.match(hangingResult.error, /代理连接超时/, '代理响应超时错误提示不明确。')
  const hangingTab = (await invoke(host, 'listTabs')).tabs.find(tab => tab.profileId === hangingSaved.profile.id)
  if (hangingTab) await invoke(host, 'closeTab', hangingTab.id)
  await new Promise(resolve => hangingProxy.close(resolve))
  await record('代理无响应时加载超时通过')
  const pageFailureProbe = net.createServer()
  await new Promise(resolve => pageFailureProbe.listen(0, '127.0.0.1', resolve))
  const pageFailurePort = pageFailureProbe.address().port
  await new Promise(resolve => pageFailureProbe.close(resolve))
  const { profile: pageFailureProfile } = await invoke(dashboard, 'getDraft')
  pageFailureProfile.name = '目标网页加载失败测试'
  pageFailureProfile.url = `http://127.0.0.1:${pageFailurePort}/page-failed`
  const pageFailureSaved = await invoke(dashboard, 'saveProfile', pageFailureProfile)
  const pageFailureResult = await dashboard.webContents.executeJavaScript(`window.browserApi.launchProfile(${JSON.stringify({ id: pageFailureSaved.profile.id })})`)
  assert.equal(pageFailureResult.ok, false, '目标网页加载失败时不应返回成功。')
  assert.equal(pageFailureResult.launchState, 'page-failed', '目标网页加载失败没有返回 page-failed 阶段。')
  assert.ok(pageFailureResult.environmentId, '目标网页加载失败没有返回已创建环境 ID。')
  const pageFailureTab = (await invoke(host, 'listTabs')).tabs.find(tab => tab.profileId === pageFailureSaved.profile.id)
  assert.ok(pageFailureTab, '目标网页加载失败后应保留可重试的环境标签。')
  await invoke(host, 'closeTab', pageFailureTab.id)
  await record('目标网页加载失败保留环境并返回失败阶段通过')
  const firstDataDir = snapshot.tabs[0].dataDir
  const expectedLastUrl = first.getURL()
  await invoke(host, 'selectTab', snapshot.tabs[0].id)
  const sameEnvironmentUrl = `${url}?same-environment=1`
  const sameEnvironmentResponse = await invoke(host, 'newPageTab', {
    environmentId: firstEnvironment.id,
    url: sameEnvironmentUrl
  })
  const sameEnvironmentTab = sameEnvironmentResponse.tabs.find(tab => tab.environmentId === firstEnvironment.id && tab.id !== snapshot.tabs[0].id)
  assert.ok(sameEnvironmentTab, '没有创建同一环境的第二个网页标签。')
  assert.equal(sameEnvironmentTab.dataDir, firstDataDir, '同一环境网页标签没有复用数据目录。')
  let sameEnvironmentContents
  await waitFor(() => {
    sameEnvironmentContents = webContents.getAllWebContents().find(contents => contents !== first && contents.session.storagePath === firstDataDir && contents.getURL() === sameEnvironmentUrl)
    return Boolean(sameEnvironmentContents)
  }, '找不到同一环境的第二个原生页面视图。')
  assert.equal(sameEnvironmentContents.session.storagePath, first.session.storagePath, '同一环境网页标签没有复用持久化会话。')
  await signalsFor(sameEnvironmentContents)
  await first.executeJavaScript("localStorage.setItem('same-environment','共享')")
  await first.session.cookies.set({ url, name: 'same-environment', value: '共享' })
  assert.equal(await sameEnvironmentContents.executeJavaScript("localStorage.getItem('same-environment')"), '共享', '同一环境网页标签没有共享本地存储。')
  assert.equal((await sameEnvironmentContents.session.cookies.get({ url, name: 'same-environment' })).length, 1, '同一环境网页标签没有共享 Cookie。')
  await invoke(host, 'closeTab', sameEnvironmentTab.id)
  const environmentAfterChildClose = (await invoke(dashboard, 'listEnvironments')).environments.find(environment => environment.id === firstEnvironment.id)
  assert.equal(environmentAfterChildClose.status, 'open', '关闭同一环境的一个网页标签后环境状态不应关闭。')
  assert.equal((await invoke(host, 'listTabs')).tabs.filter(tab => tab.environmentId === firstEnvironment.id).length, 1, '关闭网页标签后根标签没有保留。')
  await record('同一环境网页标签共享会话、目录并可独立关闭通过')
  await first.executeJavaScript("localStorage.setItem('environment-reopen','保留')")
  await first.session.cookies.set({ url, name: 'environment-reopen', value: '保留' })
  await invoke(host, 'closeTab', snapshot.tabs[0].id)
  const closedEnvironment = (await invoke(dashboard, 'listEnvironments')).environments.find(environment => environment.id === firstEnvironment.id)
  assert.equal(closedEnvironment.status, 'closed', '关闭标签后环境状态没有保存。')
  assert.equal(closedEnvironment.lastUrl, expectedLastUrl, '关闭标签后最近网址没有保存。')
  assert.equal(closedEnvironment.creationUrl, url, '关闭环境时不应修改创建时的启动地址。')
  const reopened = await invoke(dashboard, 'reopenEnvironment', firstEnvironment.id)
  const reopenedTab = reopened.tabs.find(tab => tab.environmentId === firstEnvironment.id)
  assert.ok(reopenedTab, '没有重新打开原有环境。')
  assert.equal(reopenedTab.dataDir, firstDataDir, '恢复环境创建了新数据目录。')
  const reopenedContents = contentsFor(reopenedTab)
  await waitFor(() => reopenedContents.getURL() === url && !reopenedContents.isLoading(), '恢复环境没有回到创建时的启动地址。')
  const reopenedEnvironment = (await invoke(dashboard, 'listEnvironments')).environments.find(environment => environment.id === firstEnvironment.id)
  assert.equal(reopenedEnvironment.creationUrl, url, '重开环境覆盖了创建时的启动地址。')
  assert.equal(reopenedEnvironment.lastUrl, expectedLastUrl, '重开环境不应覆盖最近访问地址。')
  assert.equal((await signalsFor(reopenedContents)).hardwareConcurrency, 4, '恢复环境没有使用原指纹快照。')
  assert.equal(await reopenedContents.executeJavaScript("localStorage.getItem('environment-reopen')"), '保留', '恢复环境没有保留本地存储。')
  assert.equal((await reopenedContents.session.cookies.get({ url, name: 'environment-reopen' })).length, 1, '恢复环境没有保留 Cookie。')
  await invoke(host, 'closeTab', reopenedTab.id)
  const deleteEnvironmentResult = await invoke(dashboard, 'deleteEnvironment', firstEnvironment.id)
  assert.equal(deleteEnvironmentResult.environments.some(environment => environment.id === firstEnvironment.id), false, '环境删除后仍在列表中。')
  if (deleteEnvironmentResult.deletionPending) {
    await fs.access(path.join(app.getPath('userData'), 'environment-deletions.json'))
  } else {
    await assert.rejects(fs.access(firstDataDir), '环境目录删除后仍然存在。')
  }
  await record('环境列表、关闭恢复原目录和登录数据、确认后安全删除通过')
  if (!keepOpen) {
    for (const tab of (await invoke(host, 'listTabs')).tabs) await invoke(host, 'closeTab', tab.id)
    assert.equal((await invoke(host, 'listTabs')).activeId, null, '关闭最后标签后仍有选中项。')
    assert.equal(host.contentView.children.length, 0, '关闭最后标签后原生视图未释放。')
    const reopened = await invoke(host, 'launchProfile', { id: saved[1].id })
    await invoke(host, 'closeTab', reopened.tabId)
    host.close()
    await invoke(dashboard, 'launchProfile', { id: saved[1].id })
    await record('关闭全部标签、新建标签及重建浏览器窗口通过')
  } else {
    await invoke(host, 'selectTab', snapshot.tabs[0].id)
  }
  result.ok = true
  await record('全部检查完成')
  finished = true
  clearTimeout(timeout)
  if (!keepOpen) {
    server.close()
    app.quit()
  }
}
void run().catch(fail)
