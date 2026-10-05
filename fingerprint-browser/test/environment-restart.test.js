const assert = require('node:assert/strict')
const { app, webContents } = require('electron/main')

const mode = process.env.FP_RESTART_MODE
const url = process.env.FP_RESTART_URL
const dashboardReady = new Promise(resolve => app.once('browser-window-created', (_event, window) => {
  window.webContents.once('did-finish-load', () => resolve(window))
}))
require('../main')

async function invoke (window, method, payload) {
  const response = await window.webContents.executeJavaScript(`window.browserApi[${JSON.stringify(method)}](${payload === undefined ? '' : JSON.stringify(payload)})`)
  assert.equal(response.ok, true, response.error || '应用接口操作失败。')
  return response
}

function contentsFor (tab) {
  const contents = webContents.getAllWebContents().find(item => item.session.storagePath === tab.dataDir)
  assert.ok(contents, '找不到环境页面。')
  return contents
}

async function run () {
  assert.ok(url, '缺少环境恢复测试网址。')
  const dashboard = await dashboardReady
  if (mode === 'write') {
    const draftResponse = await invoke(dashboard, 'getDraft')
    const draft = draftResponse.profile
    draft.name = '重启恢复环境'
    draft.url = url
    const saved = await invoke(dashboard, 'saveProfile', draft)
    await invoke(dashboard, 'launchProfile', { id: saved.profile.id })
    const host = dashboard
    const snapshot = await invoke(host, 'listTabs')
    const tab = snapshot.tabs[0]
    const contents = contentsFor(tab)
    const alternateUrl = `${url}?restart-last`
    await contents.loadURL(alternateUrl)
    assert.equal(contents.getURL(), alternateUrl, '重启前导航测试页面没有加载。')
    await contents.executeJavaScript("localStorage.setItem('restart-marker','保留'); document.title = '重启恢复测试'")
    await contents.session.cookies.set({ url, name: 'restart-marker', value: '保留', expirationDate: Math.floor(Date.now() / 1000) + 3600 })
    await contents.session.cookies.flushStore()
    app.quit()
    return
  }
  if (mode !== 'read') throw new Error('环境恢复测试模式无效。')
  const environments = await invoke(dashboard, 'listEnvironments')
  assert.equal(environments.environments.length, 1, '重启后环境记录数量不正确。')
  assert.equal(environments.environments[0].status, 'closed', '重启后环境没有恢复为已关闭状态。')
  assert.equal(environments.environments[0].creationUrl, url, '重启后创建地址没有保留。')
  assert.equal(environments.environments[0].lastUrl, `${url}?restart-last`, '重启后最近访问地址没有保留。')
  const restored = await invoke(dashboard, 'reopenEnvironment', environments.environments[0].id)
  const host = dashboard
  const tab = restored.tabs.find(item => item.environmentId === environments.environments[0].id)
  const contents = contentsFor(tab)
  assert.equal(contents.getURL(), url, '跨进程重启后环境没有回到创建时地址。')
  assert.equal(await contents.executeJavaScript("localStorage.getItem('restart-marker')"), '保留', '重启后本地存储没有恢复。')
  assert.equal((await contents.session.cookies.get({ url, name: 'restart-marker' })).length, 1, '重启后 Cookie 没有恢复。')
  await invoke(host, 'closeTab', tab.id)
  await new Promise(resolve => setTimeout(resolve, 150))
  app.quit()
}

void run().catch(error => {
  console.error('环境恢复子进程测试失败。', error)
  app.exit(1)
})
