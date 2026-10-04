const fs = require('node:fs/promises')
const net = require('node:net')
const { randomUUID } = require('node:crypto')
const { app, WebContentsView, session } = require('electron/main')
const { applyFingerprintConfig } = require('./runtime-compat')
const { ProfileValidationError, normalizeUrl } = require('./profile-store')
const { createSocks5Proxy } = require('./socks5-proxy')

const HEADER_HEIGHT = 88
const DEFAULT_PROXY_TIMEOUT_MS = 10000

function proxyTimeoutMs () {
  const configured = Number(process.env.FP_PROXY_TIMEOUT_MS)
  return Number.isFinite(configured) && configured > 0 ? Math.min(configured, 60000) : DEFAULT_PROXY_TIMEOUT_MS
}

async function checkProxyConnection (proxy) {
  const parsed = new URL(proxy.server)
  const port = Number(parsed.port) || (proxy.mode === 'socks5' ? 1080 : parsed.protocol === 'https:' ? 443 : 80)
  await new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: parsed.hostname.replace(/^\[|\]$/g, ''), port })
    const timer = setTimeout(() => {
      socket.destroy()
      reject(new Error('代理连接超时。'))
    }, proxyTimeoutMs())
    const finish = error => {
      clearTimeout(timer)
      socket.destroy()
      if (error) reject(error)
      else resolve()
    }
    socket.once('connect', () => finish())
    socket.once('error', finish)
  })
}

async function loadUrlWithProxyTimeout (contents, url, proxy) {
  const loading = contents.loadURL(url)
  if (!proxy || proxy.mode === 'direct') return await loading
  let timer
  try {
    return await Promise.race([
      loading,
      new Promise((resolve, reject) => {
        timer = setTimeout(() => {
          reject(new ProfileValidationError('代理连接超时，已阻止继续加载。'))
          contents.stop()
        }, proxyTimeoutMs())
      })
    ])
  } finally {
    clearTimeout(timer)
  }
}

async function applyProxyConfig (profileSession, proxy, targetUrl) {
  const config = proxy || { mode: 'direct', server: '', username: '', password: '' }
  let proxyBridge
  try {
    if (config.mode === 'direct') {
      await profileSession.setProxy({ mode: 'direct' })
      return
    }
    if (config.mode === 'socks5' && (config.username || config.password)) proxyBridge = await createSocks5Proxy(config, proxyTimeoutMs())
    await profileSession.setProxy({ proxyRules: proxyBridge?.server || config.server })
    const resolution = await profileSession.resolveProxy(targetUrl)
    if (!resolution || /\bDIRECT\b/i.test(resolution)) throw new Error('代理解析结果包含直连。')
    await checkProxyConnection(config)
    return proxyBridge
  } catch (error) {
    proxyBridge?.close()
    if (error instanceof ProfileValidationError) throw error
    throw new ProfileValidationError('代理检测失败，已阻止直连，请检查代理地址和认证信息。')
  }
}

class TabBrowser {
  constructor (dataRoot, environmentRepository, options = {}) {
    this.dataRoot = dataRoot
    this.environmentRepository = environmentRepository
    this.getWindow = options.getWindow || (() => null)
    this.onEnvironmentChanged = options.onEnvironmentChanged || (() => {})
    this.window = null
    this.ready = null
    this.tabs = new Map()
    this.activeId = null
    this.shuttingDown = null
    app.on('login', (event, contents, _request, authInfo, callback) => {
      if (!authInfo.isProxy) return
      const tab = [...this.tabs.values()].find(item => item.view.webContents === contents)
      if (!tab) return
      event.preventDefault()
      const proxy = tab.profile.proxy || {}
      callback(proxy.username || '', proxy.password || '')
    })
  }

  attachWindow (window) {
    if (!window || window.isDestroyed()) return
    if (this.window === window) return
    this.window = window
    this.ready = Promise.resolve()
    window.on('resize', () => this.layout())
    window.on('closed', () => {
      if (this.window === window) {
        this.window = null
        this.ready = null
      }
    })
  }

  async ensureWindow () {
    if (this.window && !this.window.isDestroyed()) {
      await this.ready
      return
    }
    const window = this.getWindow()
    if (!window || window.isDestroyed()) throw new ProfileValidationError('管理窗口尚未准备好，请稍后重试。')
    this.attachWindow(window)
    await this.ready
  }

  snapshot () {
    return {
      activeId: this.activeId,
      tabs: [...this.tabs.values()].map(tab => ({
        id: tab.id,
        environmentId: tab.environmentId,
        profileId: tab.profile.id,
        profileName: tab.profile.name,
        revision: tab.profile.revision,
        title: tab.title,
        url: tab.url,
        dataDir: tab.dataDir,
        fingerprint: tab.profile.fingerprint,
        userAgent: tab.view.webContents.getUserAgent(),
        proxy: {
          mode: tab.profile.proxy?.mode || 'direct',
          server: tab.profile.proxy?.server || '',
          username: tab.profile.proxy?.username || '',
          hasPassword: Boolean(tab.profile.proxy?.password)
        },
        warning: tab.warning,
        error: tab.error,
        loading: tab.loading,
        canGoBack: tab.view.webContents.navigationHistory.canGoBack(),
        canGoForward: tab.view.webContents.navigationHistory.canGoForward()
      }))
    }
  }

  notify () {
    if (this.window && !this.window.isDestroyed()) this.window.webContents.send('tabs:changed', this.snapshot())
  }

  selectDashboard () {
    this.activeId = null
    this.layout()
    this.notify()
    if (this.window && !this.window.isDestroyed()) {
      this.window.show()
      this.window.focus()
    }
  }

  layout () {
    if (!this.window || this.window.isDestroyed()) return
    const [width, height] = this.window.getContentSize()
    for (const tab of this.tabs.values()) {
      const active = tab.id === this.activeId
      const attached = this.window.contentView.children.includes(tab.view)
      if (!active && attached) this.window.contentView.removeChildView(tab.view)
      if (active) {
        tab.view.setBounds({ x: 0, y: HEADER_HEIGHT, width, height: Math.max(0, height - HEADER_HEIGHT) })
        if (!attached) this.window.contentView.addChildView(tab.view)
      }
    }
  }

  getTab (id) {
    const tab = this.tabs.get(id)
    if (!tab) throw new ProfileValidationError('找不到要操作的标签。')
    return tab
  }

  tabIdsForEnvironment (environmentId) {
    return [...this.tabs.values()]
      .filter(tab => tab.environmentId === environmentId)
      .map(tab => tab.id)
  }

  select (id) {
    const tab = this.getTab(id)
    this.activeId = id
    this.layout()
    this.window.show()
    this.window.focus()
    tab.view.webContents.focus()
    this.notify()
  }

  async open (profile, targetUrl) {
    const environment = await this.environmentRepository.create(profile, targetUrl)
    try {
      return await this.openEnvironment(environment)
    } catch (error) {
      if (!this.tabs.has(environment.id)) {
        await this.environmentRepository.remove(environment.id).catch(removeError => console.error('[清理未打开环境]', removeError))
      }
      throw error
    }
  }

  async reopen (environmentId) {
    const environment = this.environmentRepository.get(environmentId)
    if (!environment) throw new ProfileValidationError('找不到浏览器环境。')
    if (this.isOpen(environment.id)) throw new ProfileValidationError('该浏览器环境已经打开。')
    try {
      await fs.access(environment.dataDir)
    } catch {
      throw new ProfileValidationError('环境数据目录不存在，无法恢复登录状态。')
    }
    return await this.openEnvironment(environment)
  }

  async openEnvironment (environment) {
    if (this.isOpen(environment.id)) throw new ProfileValidationError('该浏览器环境已经打开。')
    return await this.openPage(environment, environment.id)
  }

  async openPageTab (environmentId, targetUrl) {
    const environment = this.environmentRepository.get(environmentId)
    if (!environment) throw new ProfileValidationError('找不到浏览器环境。')
    if (!this.isOpen(environment.id)) throw new ProfileValidationError('请先打开浏览器环境，再新建网页标签。')
    const existing = [...this.tabs.values()].find(tab => tab.environmentId === environment.id)
    if (existing) {
      this.select(existing.id)
      return { tabId: existing.id, reused: true }
    }
    return await this.openPage(environment, randomUUID(), targetUrl)
  }

  async openPage (environment, tabId, targetUrl) {
    const profile = {
      id: environment.profileId,
      name: environment.profileName,
      url: environment.lastUrl,
      revision: environment.profileRevision,
      fingerprint: environment.fingerprint,
      proxy: environment.proxy
    }
    const url = normalizeUrl(targetUrl || environment.lastUrl)
    await this.ensureWindow()
    const dataDir = environment.dataDir
    const snapshot = structuredClone(profile)
    if (!this.window || this.window.isDestroyed()) throw new ProfileValidationError('浏览器窗口已关闭，请重新创建标签。')
    // 同一环境内的网页标签复用同一个持久化会话，不同环境仍使用不同目录。
    const tabSession = session.fromPath(dataDir)
    // 外部协议在旧内核中默认放行，统一拒绝网页唤起外部程序，覆盖隐藏子框架。
    tabSession.setPermissionRequestHandler((_contents, permission, callback) => {
      callback(permission !== 'openExternal')
    })
    const proxyBridge = await applyProxyConfig(tabSession, snapshot.proxy, url)
    try {
    const warning = applyFingerprintConfig(tabSession, snapshot.fingerprint)
    const view = new WebContentsView({ webPreferences: {
      // 当前 Testing 内核需要显式初始化为显示状态，否则原生视图没有可截图的绘制表面。
      show: true,
      session: tabSession,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    } })
    const tab = { id: tabId, environmentId: environment.id, dataDir, profile: snapshot, view, proxyBridge, title: '新标签', url, warning, error: '', loading: false }
    const contents = view.webContents
    contents.setWindowOpenHandler(() => ({ action: 'deny' }))
    for (const event of ['will-navigate', 'will-redirect']) {
      contents.on(event, (navigationEvent, target) => {
        if (!/^https?:\/\//i.test(target) && target !== 'about:blank') navigationEvent.preventDefault()
      })
    }
    contents.on('page-title-updated', (_event, title) => { tab.title = title; this.notify() })
    contents.on('did-start-loading', () => { tab.loading = true; tab.error = ''; this.notify() })
    contents.on('did-stop-loading', () => { tab.loading = false; this.notify() })
    for (const event of ['did-navigate', 'did-navigate-in-page']) {
      contents.on(event, () => {
        tab.url = contents.getURL()
        void this.saveEnvironmentUrl(tab)
        this.notify()
      })
    }
    contents.on('did-fail-load', (_event, code, _description, _url, isMainFrame) => {
      if (isMainFrame && code !== -3) { tab.error = '网页加载失败，请检查网址和网络连接。'; this.notify() }
    })
    contents.on('render-process-gone', () => { tab.error = '页面进程已退出，请刷新标签重试。'; this.notify() })
    await this.environmentRepository.update(environment.id, { status: 'open', lastUrl: url })
    this.onEnvironmentChanged()
    this.tabs.set(tabId, tab)
    this.select(tabId)
    try {
      await loadUrlWithProxyTimeout(contents, url, snapshot.proxy)
    } catch (error) {
      console.error('[加载标签网页]', error)
      if (this.tabs.has(tabId)) {
        tab.error = '网页加载失败，请检查网址和网络连接。'
        this.notify()
      }
      if (error instanceof ProfileValidationError) throw error
      throw new ProfileValidationError('网页加载失败，标签已保留，可修改网址后重试。')
    }
    return { tabId, warning }
    } catch (error) {
      if (!this.tabs.has(tabId)) proxyBridge?.close()
      throw error
    }
  }

  async saveEnvironmentUrl (tab) {
    try {
      await this.environmentRepository.update(tab.environmentId, { lastUrl: tab.url })
      this.onEnvironmentChanged()
    } catch (error) {
      console.error('[保存环境网址]', error)
    }
  }

  isOpen (environmentId) {
    return this.tabIdsForEnvironment(environmentId).length > 0
  }

  async closeEnvironment (environmentId) {
    const environment = this.environmentRepository.get(environmentId)
    if (!environment) throw new ProfileValidationError('找不到浏览器环境。')
    for (const id of this.tabIdsForEnvironment(environmentId)) await this.close(id)
    if (this.environmentRepository.get(environmentId)?.status === 'open' && !this.isOpen(environmentId)) {
      await this.environmentRepository.update(environmentId, { status: 'closed' })
      this.onEnvironmentChanged()
    }
    return this.snapshot()
  }

  async close (id) {
    const tab = this.getTab(id)
    if (tab.closePromise) return await tab.closePromise
    const contents = tab.view?.webContents
    tab.closePromise = (async () => {
      if (contents && !contents.isDestroyed()) {
        try {
          await contents.session.cookies.flushStore()
        } catch {
          throw new ProfileValidationError('环境数据保存失败，标签仍保持打开状态。')
        }
      }
      const remainingTabIds = this.tabIdsForEnvironment(tab.environmentId).filter(tabId => tabId !== id)
      await this.environmentRepository.update(tab.environmentId, {
        status: remainingTabIds.length > 0 ? 'open' : 'closed',
        lastUrl: contents && !contents.isDestroyed() ? contents.getURL() || tab.url : tab.url
      })
      this.onEnvironmentChanged()
      if (this.window && !this.window.isDestroyed() && this.window.contentView.children.includes(tab.view)) {
        this.window.contentView.removeChildView(tab.view)
      }
      this.tabs.delete(id)
      if (contents && !contents.isDestroyed()) contents.close()
      tab.proxyBridge?.close()
      if (this.activeId === id) {
        this.activeId = null
        const nextId = this.tabs.keys().next().value
        if (nextId) this.select(nextId)
      }
      this.layout()
      this.notify()
    })()
    try {
      return await tab.closePromise
    } finally {
      tab.closePromise = null
    }
  }

  async shutdown () {
    if (this.shuttingDown) return await this.shuttingDown
    this.shuttingDown = (async () => {
      for (const id of [...this.tabs.keys()]) {
        try {
          await this.close(id)
        } catch (error) {
          console.error('[关闭浏览器环境]', error)
          const tab = this.tabs.get(id)
          await this.environmentRepository.update(tab?.environmentId || id, { status: 'closed' }).catch(updateError => console.error('[保存环境状态]', updateError))
          this.onEnvironmentChanged()
          const contents = tab?.view?.webContents
          if (contents && !contents.isDestroyed()) contents.close()
          tab?.proxyBridge?.close()
          this.tabs.delete(id)
        }
      }
      this.activeId = null
      await this.environmentRepository.waitForWrites()
    })()
    return await this.shuttingDown
  }

  async navigate (payload) {
    if (!payload || typeof payload !== 'object') throw new ProfileValidationError('标签操作参数无效。')
    const tab = this.getTab(payload.id)
    const contents = tab.view.webContents
    switch (payload.action) {
      case 'load':
        try {
          await loadUrlWithProxyTimeout(contents, normalizeUrl(payload.url), tab.profile.proxy)
        } catch (error) {
          if (error instanceof ProfileValidationError) throw error
          throw new ProfileValidationError('网页加载失败，请检查网址和网络连接。')
        }
        break
      case 'back':
        if (contents.navigationHistory.canGoBack()) contents.navigationHistory.goBack()
        break
      case 'forward':
        if (contents.navigationHistory.canGoForward()) contents.navigationHistory.goForward()
        break
      case 'reload': contents.reload(); break
      default: throw new ProfileValidationError('不支持此标签操作。')
    }
  }
}

module.exports = { TabBrowser }
