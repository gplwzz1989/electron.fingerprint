const assert = require('node:assert/strict')
const EventEmitter = require('node:events')
const Module = require('node:module')
const fs = require('node:fs/promises')
const path = require('node:path')
const os = require('node:os')

// 1. Mock electron/main 模块
class MockWebContents extends EventEmitter {
  constructor () {
    super()
    this.session = mockSessionInstance
    this.windowOpenHandler = null
    this.loadedUrls = []
    this.navigationHistory = {
      canGoBack: () => false,
      canGoForward: () => false
    }
  }

  setWindowOpenHandler (handler) {
    this.windowOpenHandler = handler
  }

  getUserAgent () {
    return 'MockChrome/138.0.0.0'
  }

  getURL () {
    return this.loadedUrls[this.loadedUrls.length - 1] || 'about:blank'
  }

  async loadURL (url) {
    this.loadedUrls.push(url)
  }

  send () {}
  focus () {}
  close () {}
  isDestroyed () {
    return false
  }
}

class MockBrowserWindow extends EventEmitter {
  constructor (options = {}) {
    super()
    this.options = options
    this.webContents = options.webContents || new MockWebContents()
    this.destroyed = false
  }

  isDestroyed () {
    return this.destroyed
  }

  destroy () {
    this.destroyed = true
    this.emit('closed')
  }

  show () {}
  focus () {}
}

class MockWebContentsView {
  constructor (options = {}) {
    this.options = options
    this.webContents = new MockWebContents()
    this.bounds = { x: 0, y: 0, width: 0, height: 0 }
  }

  setBounds (bounds) {
    this.bounds = bounds
  }
}

const mockApp = new EventEmitter()

let mockSessionInstance = {
  setPermissionRequestHandler: () => {},
  setPermissionCheckHandler: () => {},
  setProxy: async () => {},
  resolveProxy: async () => 'DIRECT',
  setFingerprintConfig: () => {},
  cookies: {
    flushStore: async () => {}
  }
}

const origModuleLoad = Module._load
Module._load = function (request, parent, isMain) {
  if (request === 'electron/main') {
    return {
      app: mockApp,
      BrowserWindow: MockBrowserWindow,
      WebContentsView: MockWebContentsView,
      session: {
        fromPath: () => mockSessionInstance
      }
    }
  }
  return origModuleLoad.apply(this, arguments)
}

const { TabBrowser } = require('../browser-tabs')

async function run () {
  const testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tab-browser-popups-test-'))
  const envDataDir = path.join(testDir, 'tab-env-1')
  await fs.mkdir(envDataDir, { recursive: true })

  const seedFingerprint = JSON.parse(await fs.readFile(path.join(__dirname, '..', 'profiles', 'win11-cn-desktop.json'), 'utf8'))
  const mockEnv = {
    id: 'env-1',
    profileId: 'prof-1',
    profileName: '测试环境',
    creationUrl: 'https://x.com',
    profileRevision: 1,
    dataDir: envDataDir,
    status: 'closed',
    proxy: { mode: 'direct' },
    fingerprint: seedFingerprint
  }

  const mockEnvRepo = {
    get: id => (id === mockEnv.id ? mockEnv : null),
    update: async (_id, patch) => Object.assign(mockEnv, patch),
    waitForWrites: async () => {}
  }

  const mockHostWindow = {
    isDestroyed: () => false,
    getContentSize: () => [1200, 800],
    contentView: {
      children: [],
      addChildView (v) { this.children.push(v) },
      removeChildView (v) {
        const i = this.children.indexOf(v)
        if (i !== -1) this.children.splice(i, 1)
      }
    },
    webContents: new MockWebContents(),
    on: () => {},
    show: () => {},
    focus: () => {}
  }

  const tabBrowser = new TabBrowser(testDir, mockEnvRepo, {
    getWindow: () => mockHostWindow
  })

  // 1. 打开环境标签
  const openResult = await tabBrowser.openEnvironment(mockEnv)
  assert.equal(openResult.tabId, 'env-1')

  const tab = tabBrowser.getTab('env-1')
  assert.ok(tab, '应成功获取到 tab 实例')
  assert.ok(tab.popups instanceof Set, 'tab 应当具有 popups Set 集合')

  const contents = tab.view.webContents
  assert.ok(typeof contents.windowOpenHandler === 'function', '应注册了 setWindowOpenHandler 处理函数')

  // 2. 模拟 Apple 登录等 OAuth 弹窗（disposition 为 new-window）
  const oauthResponse = contents.windowOpenHandler({
    url: 'https://appleid.apple.com/auth/authorize?client_id=test',
    disposition: 'new-window'
  })
  assert.equal(oauthResponse.action, 'allow', 'OAuth 弹窗应当被放行 (allow)')
  assert.equal(typeof oauthResponse.createWindow, 'function', '应当提供 createWindow 定制函数')

  const popupWebContents = new MockWebContents()
  const createdContents = oauthResponse.createWindow({
    webContents: popupWebContents,
    width: 600,
    height: 600
  })
  assert.equal(createdContents, popupWebContents, 'createWindow 应返回子窗口的 webContents')
  assert.equal(tab.popups.size, 1, '新创建的弹窗应登记在 tab.popups 中')

  const popupWindow = [...tab.popups][0]
  assert.equal(popupWindow.options.autoHideMenuBar, true, '弹窗应自动隐藏菜单栏')

  // 3. 模拟弹窗关闭，验证从集合自动注销
  popupWindow.destroy()
  assert.equal(tab.popups.size, 0, '弹窗关闭后应从 tab.popups 中移除')

  // 4. 模拟非法 scheme 弹窗拦截
  const dangerousResponse = contents.windowOpenHandler({
    url: 'javascript:alert(1)',
    disposition: 'new-window'
  })
  assert.equal(dangerousResponse.action, 'deny', '非 http/https 的危险 scheme 弹窗应被拒绝')

  // 5. 模拟普通链接 target="_blank" 点击（disposition 为 foreground-tab）
  contents.loadedUrls = []
  const linkResponse = contents.windowOpenHandler({
    url: 'https://x.com/explore',
    disposition: 'foreground-tab'
  })
  assert.equal(linkResponse.action, 'deny', '非弹窗打开应当返回 deny 阻止弹出新窗口')
  assert.equal(contents.loadedUrls.includes('https://x.com/explore'), true, '非弹窗打开应转为在当前标签页就地加载')

  // 6. 再次创建一个弹窗，验证标签页关闭时会级联销毁所有弹窗
  const secondOauth = contents.windowOpenHandler({
    url: 'https://appleid.apple.com/auth/authorize?client_id=test2',
    disposition: 'new-window'
  })
  const secondPopupContents = new MockWebContents()
  secondOauth.createWindow({ webContents: secondPopupContents })
  assert.equal(tab.popups.size, 1)

  const activePopup = [...tab.popups][0]
  assert.equal(activePopup.isDestroyed(), false)

  await tabBrowser.close('env-1')
  assert.equal(activePopup.isDestroyed(), true, '标签关闭时应级联销毁未关闭的弹窗')

  // TLS 策略在创建网页前应用，持久化会话在关闭、重开时保持锁定。
  const version = '138.0.7204.185'
  const oldChrome = Object.getOwnPropertyDescriptor(process.versions, 'chrome')
  Object.defineProperty(process.versions, 'chrome', { value: version, configurable: true })
  try {
    mockEnv.tlsFingerprint = { chromiumVersion: version, cipherSuites: [0xc02f, 0xc030] }
    await assert.rejects(tabBrowser.reopen(mockEnv.id), /重启客户端/)
    const calls = []
    mockSessionInstance = {
      ...mockSessionInstance,
      getTLSFingerprintCapabilities: () => ({ schemaVersion: 1, chromiumVersion: version, cipherOrder: 'tls1.2' }),
      setSSLConfig (config) { calls.push('tls'); assert.deepEqual(config.fingerprint, mockEnv.tlsFingerprint) },
      setFingerprintConfig () { calls.push('fingerprint') }
    }
    await tabBrowser.reopen(mockEnv.id)
    assert.deepEqual(calls.slice(0, 2), ['tls', 'fingerprint'], '首次请求前应先应用保存的 TLS 策略。')
    assert.equal(tabBrowser.getTab(mockEnv.id).view.webContents.loadedUrls.length, 1)
    assert.deepEqual(tabBrowser.snapshot().tabs[0].tlsFingerprint, mockEnv.tlsFingerprint)
    const repeatedTab = await tabBrowser.openPageTab(mockEnv.id, 'https://example.com/other')
    assert.equal(repeatedTab.reused, true)
    assert.equal(calls.filter(value => value === 'tls').length, 1, '同环境重复标签应复用已经锁定的 TLS 会话。')
    await tabBrowser.close(mockEnv.id)
    await tabBrowser.reopen(mockEnv.id)
    assert.equal(calls.filter(value => value === 'tls').length, 1, '重开相同会话不能重复设置 TLS。')
    await tabBrowser.close(mockEnv.id)
    mockEnv.tlsFingerprint = { ...mockEnv.tlsFingerprint, cipherSuites: [0xc030] }
    await assert.rejects(tabBrowser.reopen(mockEnv.id), /重启客户端/)
    assert.equal(tabBrowser.tabs.size, 0, '策略不匹配时不能创建网页。')
    mockSessionInstance = { ...mockSessionInstance, getTLSFingerprintCapabilities: undefined }
    await assert.rejects(tabBrowser.reopen(mockEnv.id), /未包含 TLS/)
    assert.equal(tabBrowser.tabs.size, 0, '运行时不支持 TLS 策略时必须阻止打开网页。')
    assert.equal(calls.filter(value => value === 'tls').length, 1)
  } finally {
    if (oldChrome) Object.defineProperty(process.versions, 'chrome', oldChrome)
    else delete process.versions.chrome
  }

  // 清理临时目录
  await fs.rm(testDir, { recursive: true, force: true }).catch(() => {})
  console.log('OAuth 弹窗分流与生命周期管理自检通过。')
}

void run().catch(err => {
  console.error('测试失败:', err)
  process.exit(1)
})
