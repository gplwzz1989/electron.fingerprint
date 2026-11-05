const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { EventEmitter } = require('node:events')
const { ProfileValidationError } = require('../profile-store')

function fixture (currentIdentity = '123456') {
  const messages = []
  const tab = { id: 'test-tab', authType: 'platform', authConfig: { accountId: 'test-account', platformKey: 'wechat', expectedUserId: '123456', detectedIdentity: { platformUserId: '123456', name: '旧资料', avatar: '' } } }
  const contents = {
    isDestroyed: () => false, getURL: () => 'https://mp.weixin.qq.com/cgi-bin/home?token=654321',
    session: { cookies: { flushStore: async () => {}, get: async () => [{ name: 'session', value: 'test-only', domain: '.weixin.qq.com' }, { name: 'other', value: 'excluded', domain: 'other.test' }] } },
    executeJavaScript: async source => source.includes('const response = await fetch') ? { status: 200, url: 'https://mp.weixin.qq.com/cgi-bin/home?token=654321', body: '隔离测试官方响应' } : { 'https://other.test': { key: 'excluded' } }
  }
  tab.view = { webContents: contents }
  const sandbox = {
    URL, ProfileValidationError, path, process, sessionObserver: null,
    tabBrowser: { getTab: () => tab, notify () {} },
    platformRuntime: { load: async () => ({ runtime: { catalog: [{ key: 'wechat', origins: ['https://mp.weixin.qq.com'], storageKeys: [], documentPaths: ['/cgi-bin/home'], identityRequest: '/cgi-bin/loginpage?url=%2Fcgi-bin%2Fhome' }] }, rpa: { identity: () => currentIdentity ? { platformUserId: currentIdentity, name: '最新资料', avatar: '' } : null } }) },
    dashboardView: { webContents: { isDestroyed: () => false, send: (channel, payload) => messages.push({ channel, payload }) } }, dashboardWindow: null
  }
  const source = fs.readFileSync(path.join(__dirname, '../main.js'), 'utf8')
  vm.runInNewContext(source.slice(source.indexOf('  async function saveTabAuth ('), source.indexOf("  handle('tabs:save-auth',")), sandbox)
  return { save: sandbox.saveTabAuth, messages, tab, contents }
}

test('已有账号保存前重新核验身份，筛选来源并返回最新资料', async () => {
  const state = fixture()
  const result = await state.save('test-tab', true)
  assert.equal(result.ok, true)
  assert.equal(result.data.manual, true)
  assert.equal(result.data.identity.name, '最新资料')
  assert.equal(result.data.cookies.length, 1)
  assert.equal(Object.values(result.data.storage).flatMap(values => Object.keys(values)).length, 0)
  assert(!JSON.stringify(result.data.storage).includes('excluded'))
  assert.equal(state.messages.length, 1)
  assert.equal(state.tab.saving, false)
})

test('切换账号、登录失效及离开平台时，不能沿用旧身份推送会话', async () => {
  for (const identity of ['654321', '']) {
    const state = fixture(identity)
    await assert.rejects(state.save('test-tab', true), /账号不一致|尚未确认/)
    assert.equal(state.messages.length, 0)
    assert.equal(state.tab.saving, false)
  }
  const state = fixture(); state.contents.getURL = () => 'https://other.test/'
  await assert.rejects(state.save('test-tab', true), /返回账号所属平台/)
  assert.equal(state.messages.length, 0)
})

test('未绑定环境的第三方账号标签不携带私有契约或桌面桥接', async () => {
  const source = fs.readFileSync(path.join(__dirname, '../browser-tabs.js'), 'utf8')
  let preferences
  const tabSession = { setPermissionRequestHandler () {}, setPermissionCheckHandler () {} }
  const sandbox = {
    normalizeUrl: value => value, randomUUID: () => 'test-tab', isPermissionAllowed: () => false,
    session: { fromPartition: () => tabSession }, STEALTH_PRELOAD_PATH: 'stealth-preload.js',
    WebContentsView: class {
      constructor (options) {
        preferences = options.webPreferences
        this.webContents = Object.assign(new EventEmitter(), { setWindowOpenHandler () {}, loadURL: async () => {} })
      }
    }
  }
  const start = source.indexOf('  async openOrdinary (')
  const end = source.indexOf('  async createManaged (', start)
  vm.runInNewContext('class TestBrowser { ' + source.slice(start, end) + ' }; globalThis.TestBrowser = TestBrowser', sandbox)
  const browser = Object.assign(new sandbox.TestBrowser(), { tabs: new Map(), ensureWindow: async () => {}, onSessionCreated () {}, trackTabIcon () {}, bindShortcuts () {}, bindAccountWindowOpen () {}, select () {}, notify () {} })
  await browser.openOrdinary('https://weibo.com/', { kind: 'managed', authType: 'platform' })
  assert.equal(preferences.preload, undefined)
  assert.equal(preferences.additionalArguments, undefined)
  assert.equal(browser.tabs.get('test-tab').authType, 'platform')
})
