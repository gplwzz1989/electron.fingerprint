const assert = require('node:assert/strict')
const path = require('node:path')
const fs = require('node:fs/promises')
const http = require('node:http')
const { app, BrowserWindow, Menu, webContents } = require('electron/main')

const output = process.env.FP_TABS_TEST_OUTPUT
const result = { ok: false, stages: [] }
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
const timeout = setTimeout(() => { app.exit(1) }, 60000)
let server
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
  await fs.writeFile(path.join(output, 'unified-home.png'), (await dashboard.webContents.capturePage()).toPNG())
  await record('统一窗口启动和固定首页标签通过')

  const page = await fs.readFile(path.join(__dirname, 'fingerprint-page.html'))
  server = http.createServer((_request, response) => {
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
    const saved = await invoke(dashboard, 'saveProfile', draft)
    profiles.push(saved.profile)
    await invoke(dashboard, 'launchProfile', { id: draft.id })
  }
  await waitFor(async () => (await invoke(dashboard, 'listTabs')).tabs.length === 2, '环境标签没有创建完成。')
  const snapshot = await invoke(dashboard, 'listTabs')
  assert.equal(BrowserWindow.getAllWindows().length, 1, '创建环境后出现了独立多标签窗口。')
  assert.notEqual(snapshot.tabs[0].dataDir, snapshot.tabs[1].dataDir, '不同环境复用了数据目录。')
  for (const tab of snapshot.tabs) assert.ok(contentsFor(tab), '环境网页视图没有挂载。')
  const chrome = await dashboard.webContents.executeJavaScript("({ tabs: document.querySelectorAll('#unified-tabs [role=tab]').length, selected: document.querySelectorAll('#unified-tabs [aria-selected=true]').length, overflow: getComputedStyle(document.querySelector('#unified-tabs')).overflow })")
  assert.deepEqual(chrome, { tabs: 3, selected: 1, overflow: 'hidden' }, '环境标签栏布局不符合浏览器式管理。')
  await record('环境标签同窗创建、首页保留和无滚动条通过')

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
  await invoke(dashboard, 'closeTab', first.id)
  await record('关闭环境、状态同步和返回首页通过')
  result.ok = true
  await record('全部统一标签回归完成')
  clearTimeout(timeout)
  server.close()
  app.quit()
}

void run().catch(async error => {
  result.error = error.message
  await record('检查失败')
  server?.close()
  clearTimeout(timeout)
  app.exit(1)
})
