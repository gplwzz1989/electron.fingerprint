const fs = require('node:fs/promises')
const path = require('node:path')
const net = require('node:net')
const { randomUUID } = require('node:crypto')
const { app, BrowserWindow, WebContentsView, session } = require('electron/main')
const { applyFingerprintConfig } = require('./runtime-compat')
const { applyEnvironmentTLSFingerprintConfig } = require('./tls-fingerprint')
const { ProfileValidationError, normalizeUrl } = require('./profile-store')
const { createSocks5Proxy } = require('./socks5-proxy')
const { describeFingerprintProtection } = require('./fingerprint-protection')
const { generateStealthScript } = require('./stealth-engine')
const { bridgeArguments } = require('./client-api-contract')
const { pathToFileURL } = require('node:url')
const { resolveAddress } = require('./browser-navigation')

const STEALTH_PRELOAD_PATH = path.join(__dirname, 'stealth-preload.js')


const HEADER_HEIGHT = 94
const NEW_TAB_URL = pathToFileURL(path.join(__dirname, 'new-tab.html')).href
const DEFAULT_PROXY_TIMEOUT_MS = 10000
const ALLOWED_PERMISSION_TYPES = new Set(['fullscreen', 'pointerLock', 'clipboard-sanitized-write'])

class EnvironmentLaunchError extends Error {
  constructor (message, result) {
    super(message)
    this.name = 'EnvironmentLaunchError'
    this.result = result
  }
}

function proxyTimeoutMs () {
  const configured = Number(process.env.FP_PROXY_TIMEOUT_MS)
  return Number.isFinite(configured) && configured > 0 ? Math.min(configured, 60000) : DEFAULT_PROXY_TIMEOUT_MS
}

function isPermissionAllowed (permission) {
  return ALLOWED_PERMISSION_TYPES.has(permission)
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
  const proxied = proxy && proxy.mode !== 'direct'
  let timer
  try {
    return await Promise.race([
      loading,
      new Promise((resolve, reject) => {
        timer = setTimeout(() => {
          reject(new ProfileValidationError(proxied ? '代理连接超时，已阻止继续加载。' : '网页加载超时，请检查网址或网络后重试。'))
          contents.stop()
        }, proxied ? proxyTimeoutMs() : 30000)
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
    // 禁止 Chromium 对回环目标隐式绕过代理，代理环境只能使用配置的网络路径。
    await profileSession.setProxy({ proxyRules: proxyBridge?.server || config.server, proxyBypassRules: '<-loopback>' })
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
    this.capabilityRegistry = options.capabilityRegistry || null
    this.onSessionCreated = options.onSessionCreated || (() => {})
    this.preserveServerFingerprints = Boolean(options.preserveServerFingerprints)
    this.dashboardView = null
    this.onEnvironmentChanged = options.onEnvironmentChanged || (() => {})
    this.window = null
    this.ready = null
    this.tabs = new Map()
    this.createOperations = new Map()
    this.activeId = null
    this.shuttingDown = null
    this.mediaHub = options.mediaHub || null
    this.xGrokAutomation = options.xGrokAutomation || null
    app.on('login', (event, contents, _request, authInfo, callback) => {
      if (!authInfo.isProxy) return
      const tab = [...this.tabs.values()].find(item => item.view.webContents === contents)
      if (!tab) return
      event.preventDefault()
      const proxy = tab.profile?.proxy || tab.networkProxy || {}
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
    const home = this.dashboardView?.webContents
    return {
      activeId: this.activeId,
      maximized: this.window?.isMaximized?.() || false,
      home: home && !home.isDestroyed() ? { url: home.getURL() || this.homeUrl, loading: home.isLoading(), canGoBack: home.navigationHistory.canGoBack(), canGoForward: home.navigationHistory.canGoForward(), error: this.homeError || '' } : {},
      tabs: [...this.tabs.values()].map(tab => !tab.profile ? ({ id: tab.id, kind: tab.kind, ownerEnvironmentId: tab.ownerEnvironmentId, profileId: tab.ownerEnvironmentId ? this.environmentRepository.get(tab.ownerEnvironmentId)?.profileId : undefined, title: tab.title, url: tab.url, loading: tab.loading, error: tab.error, canGoBack: tab.view.webContents.navigationHistory.canGoBack(), canGoForward: tab.view.webContents.navigationHistory.canGoForward() }) : ({
        id: tab.id,
        kind: 'managed',
        environmentId: tab.environmentId,
        profileId: tab.profile.id,
        externalReference: this.environmentRepository.get(tab.environmentId)?.externalReference,
        profileName: tab.profile.name,
        revision: tab.profile.revision,
        title: tab.title,
        url: tab.url,
        dataDir: tab.dataDir,
        fingerprint: tab.profile.fingerprint,
        ...(tab.profile.tlsFingerprint ? { tlsFingerprint: tab.profile.tlsFingerprint } : {}),
        protection: describeFingerprintProtection(tab.profile.fingerprint, tab.profile.proxy),
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

  updateEnvironmentProfile (environment) {
    for (const tab of this.tabs.values()) {
      if (tab.environmentId !== environment.id) continue
      tab.profile.name = environment.profileName
      tab.profile.url = environment.creationUrl
      tab.profile.revision = environment.profileRevision
      if (environment.fingerprint) {
        tab.profile.fingerprint = structuredClone(environment.fingerprint)
      }
      if (environment.proxy) {
        tab.profile.proxy = structuredClone(environment.proxy)
      }
    }
    this.notify()
  }

  notify () {
    if (this.window && !this.window.isDestroyed()) {
      const snapshot = this.snapshot()
      this.window.webContents.send('tabs:changed', snapshot)
      if (this.dashboardView && !this.dashboardView.webContents.isDestroyed()) this.dashboardView.webContents.send('tabs:changed', snapshot)
      for (const tab of this.tabs.values()) {
        if (tab.kind === 'ordinary' || !this.capabilityRegistry) continue
        const sender = tab.view.webContents
        try { this.capabilityRegistry.assert({ sender, senderFrame: sender.mainFrame }, 'tabs:list'); sender.send('tabs:changed', snapshot) } catch {}
      }
    }
  }

  attachDashboard (view, url) {
    this.dashboardView = view; this.homeUrl = url
    const contents = view.webContents
    this.bindShortcuts(contents)
    contents.setWindowOpenHandler(details => {
      if (/^https?:\/\//i.test(details.url) || details.url === 'about:blank') void this.openOrdinary(details.url).catch(() => {})
      return { action: 'deny' }
    })
    for (const name of ['will-navigate', 'will-redirect']) contents.on(name, (event, destination) => {
      if (destination.split('#', 1)[0] !== this.homeUrl) {
        event.preventDefault()
        if (/^https?:\/\//i.test(destination)) void this.openOrdinary(destination).catch(() => {})
      }
    })
    for (const name of ['did-navigate', 'did-navigate-in-page', 'did-start-loading', 'did-stop-loading', 'page-title-updated']) contents.on(name, () => this.notify())
    contents.on('did-start-loading', () => { this.homeError = '' })
    contents.on('did-fail-load', (_event, code, _description, _url, main) => { if (main && code !== -3) { this.homeError = 'SaaS 页面无法加载，请检查服务地址或网络后刷新。'; this.notify() } })
    this.layout()
  }

  bindShortcuts (contents) {
    contents.on('before-input-event', (event, input) => {
      if (input.type !== 'keyDown') return
      const key = input.key.toLowerCase(); const modifier = input.control || input.meta
      if (modifier && key === 't') { event.preventDefault(); void this.openOrdinary().catch(() => {}) }
      if (modifier && key === 'l') { event.preventDefault(); this.window.webContents.focus(); this.window.webContents.send('shell:focus-address') }
      if (modifier && key === 'w') { event.preventDefault(); if (this.activeId) void this.close(this.activeId).catch(() => {}) }
      if ((modifier && key === 'r') || key === 'f5') { event.preventDefault(); contents.reload() }
      if (key === 'f12') { event.preventDefault(); contents.openDevTools({ mode: 'detach' }) }
    })
  }

  selectDashboard () {
    this.activeId = null
    this.layout()
    this.notify()
    if (this.window && !this.window.isDestroyed()) {
      this.window.show()
      this.window.focus()
      this.dashboardView?.webContents.focus()
    }
  }

  layout () {
    if (!this.window || this.window.isDestroyed()) return
    const [width, height] = this.window.getContentSize()
    if (this.dashboardView) {
      const attached = this.window.contentView.children.includes(this.dashboardView)
      if (this.activeId && attached) this.window.contentView.removeChildView(this.dashboardView)
      if (!this.activeId) {
        this.dashboardView.setBounds({ x: 0, y: HEADER_HEIGHT, width, height: Math.max(0, height - HEADER_HEIGHT) })
        if (!attached) this.window.contentView.addChildView(this.dashboardView)
      }
    }
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

  reorder (payload) {
    if (!payload || !Number.isInteger(payload.index) || payload.index < 0 || payload.index >= this.tabs.size) throw new ProfileValidationError('标签目标位置无效。')
    const tab = this.getTab(payload.id)
    const order = [...this.tabs.values()].filter(item => item !== tab)
    order.splice(payload.index, 0, tab)
    this.tabs.clear(); for (const item of order) this.tabs.set(item.id, item)
    this.notify()
    return this.snapshot()
  }

  tabIdsForEnvironment (environmentId) {
    return [...this.tabs.values()]
      .filter(tab => tab.environmentId === environmentId || tab.ownerEnvironmentId === environmentId)
      .map(tab => tab.id)
  }

  setMediaHub (mediaHub) {
    this.mediaHub = mediaHub
  }

  setXGrokAutomation (xGrokAutomation) {
    this.xGrokAutomation = xGrokAutomation
  }

  select (id) {
    const tab = this.getTab(id)
    this.activeId = id
    this.layout()
    this.window.show()
    this.window.focus()
    tab.view.webContents.focus()
    this.notify()
    if (this.mediaHub) {
      void this.mediaHub.extractCurrentMedia()
    }
  }

  openDevTools (id) {
    const contents = id ? this.getTab(id).view.webContents : this.dashboardView?.webContents
    if (!contents) throw new ProfileValidationError('当前页面尚未准备好。')
    if (contents.isDestroyed()) throw new ProfileValidationError('当前标签页面已关闭，请重新打开后再调试。')
    contents.openDevTools({ mode: 'detach', activate: true })
  }

  async openOrdinary (targetUrl = 'about:blank', options = {}) {
    const url = normalizeUrl(targetUrl)
    await this.ensureWindow()
    const kind = options.kind === 'managed' ? 'managed' : 'ordinary'
    const tabSession = options.session || session.fromPartition(kind === 'ordinary' ? 'persist:ordinary-browser' : `persist:managed-${randomUUID()}`)
    this.onSessionCreated(tabSession)
    tabSession.setPermissionRequestHandler((_contents, permission, callback) => callback(isPermissionAllowed(permission)))
    tabSession.setPermissionCheckHandler((_contents, permission) => isPermissionAllowed(permission))
    const view = new WebContentsView({ webPreferences: { session: tabSession, contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false, ...(kind === 'managed' ? { preload: path.join(__dirname, 'desktop-preload.js'), additionalArguments: bridgeArguments() } : options.ownerEnvironmentId ? { preload: STEALTH_PRELOAD_PATH } : {}) } })
    const contents = view.webContents
    const tab = { id: randomUUID(), kind, ownerEnvironmentId: options.ownerEnvironmentId, view, title: '新标签页', url, error: '', loading: false, networkProxy: options.proxy }
    this.tabs.set(tab.id, tab)
    this.capabilityRegistry?.register(contents, kind, options)
    this.bindShortcuts(contents)
    contents.setWindowOpenHandler(details => {
      if (/^https?:\/\//i.test(details.url) || details.url === 'about:blank') void this.openOrdinary(details.url, { session: tabSession, proxy: options.proxy, ownerEnvironmentId: options.ownerEnvironmentId }).catch(() => {})
      return { action: 'deny' }
    })
    for (const name of ['will-navigate', 'will-redirect']) contents.on(name, (event, destination) => {
      if (!/^https?:\/\//i.test(destination) && destination !== 'about:blank') event.preventDefault()
    })
    contents.on('page-title-updated', (_event, title) => { tab.title = title || '新标签页'; this.notify() })
    contents.on('did-start-loading', () => { tab.loading = true; tab.error = ''; this.notify() })
    contents.on('did-stop-loading', () => { tab.loading = false; this.notify() })
    for (const name of ['did-navigate', 'did-navigate-in-page']) contents.on(name, () => { tab.url = contents.getURL() === NEW_TAB_URL ? 'about:blank' : contents.getURL(); this.notify() })
    contents.on('did-fail-load', (_event, code, _description, _url, main) => { if (main && code !== -3) { tab.error = '网页加载失败，请检查网址和网络后刷新。'; this.notify() } })
    contents.on('render-process-gone', () => { tab.error = '网页进程已退出，请刷新后重试。'; this.notify() })
    this.select(tab.id)
    try { if (url === 'about:blank' && kind === 'ordinary') await contents.loadURL(NEW_TAB_URL); else await contents.loadURL(url) } catch { tab.error = '网页加载失败，请检查网址和网络后刷新。'; this.notify() }
    if (url === 'about:blank' && kind === 'ordinary') { this.window.webContents.focus(); this.window.webContents.send('shell:focus-address') }
    return { tabId: tab.id }
  }

  async createManaged (payload) {
    if (!payload || typeof payload !== 'object') throw new ProfileValidationError('请提供有效的系统标签配置。')
    const environment = payload.environmentId ? this.environmentRepository.get(payload.environmentId) : null
    if (payload.environmentId && !environment) throw new ProfileValidationError('找不到要使用的浏览器环境。')
    const url = normalizeUrl(payload.url || environment?.creationUrl || 'about:blank')
    const policy = this.capabilityRegistry.normalize({ capabilities: payload.capabilities ?? ['*'], allowedOrigins: payload.allowedOrigins ?? (/^https?:/.test(url) ? [new URL(url).origin] : []) })
    if (environment) return await this.openPage(environment, randomUUID(), url, policy)
    return await this.openOrdinary(url, { kind: 'managed', ...policy })
  }

  setCapabilities (payload) {
    if (!payload || typeof payload !== 'object') throw new ProfileValidationError('标签能力配置无效。')
    const tab = this.getTab(payload.id)
    if (tab.kind !== 'managed') throw new ProfileValidationError('普通网页标签不能升级为系统标签。')
    return this.capabilityRegistry.update(tab.view.webContents, payload)
  }

  async open (profile, targetUrl, operationId) {
    if (typeof operationId === 'string' && operationId.trim()) {
      const existing = this.createOperations.get(operationId)
      if (existing) return await existing
      const operation = this.createEnvironment(profile, targetUrl)
      this.createOperations.set(operationId, operation)
      return await operation
    }
    return await this.createEnvironment(profile, targetUrl)
  }

  async createEnvironment (profile, targetUrl) {
    const environment = await this.environmentRepository.create(profile, targetUrl, { preserveFingerprint: this.preserveServerFingerprints })
    try {
      const result = await this.openEnvironment(environment)
      return { ...result, environmentId: environment.id, launchState: 'started' }
    } catch (error) {
      if (error instanceof EnvironmentLaunchError) throw error
      const started = this.tabs.has(environment.id)
      const stateMessage = started ? '环境已创建并启动，但目标网页加载失败，可从环境列表重试。' : '环境已创建，但浏览器尚未启动，可从环境列表重试。'
      const detail = error instanceof ProfileValidationError ? `${error.message} ` : ''
      throw new EnvironmentLaunchError(
        `${detail}${stateMessage}`,
        { environmentId: environment.id, launchState: started ? 'page-failed' : 'created' }
      )
    }
  }

  async reopen (environmentId, policy) {
    const environment = this.environmentRepository.get(environmentId)
    if (!environment) throw new ProfileValidationError('找不到浏览器环境。')
    if (this.isOpen(environment.id)) throw new ProfileValidationError('该浏览器环境已经打开。')
    try {
      await fs.access(environment.dataDir)
    } catch {
      throw new ProfileValidationError('环境数据目录不存在，无法恢复登录状态。')
    }
    return await this.openEnvironment(environment, policy)
  }

  async openEnvironment (environment, policy) {
    if (this.isOpen(environment.id)) throw new ProfileValidationError('该浏览器环境已经打开。')
    return await this.openPage(environment, environment.id, undefined, policy)
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

  async openPage (environment, tabId, targetUrl, policy = {}) {
    const profile = {
      id: environment.profileId,
      name: environment.profileName,
      url: environment.creationUrl,
      revision: environment.profileRevision,
      fingerprint: environment.fingerprint,
      tlsFingerprint: environment.tlsFingerprint,
      proxy: environment.proxy
    }
    const url = normalizeUrl(targetUrl || environment.creationUrl)
    const preserveLastUrl = environment.status === 'closed' && !targetUrl
    await this.ensureWindow()
    const dataDir = environment.dataDir
    const snapshot = structuredClone(profile)
    if (!this.window || this.window.isDestroyed()) throw new ProfileValidationError('浏览器窗口已关闭，请重新创建标签。')
    // 同一环境内的网页标签复用同一个持久化会话，不同环境仍使用不同目录。
    // 严格使用规范目录路径，确保 LevelDB 与 SQLite WAL 存储引擎正常工作并保持持久化登录态。
    const tabSession = session.fromPath(dataDir)
    this.onSessionCreated(tabSession)
    const tlsWarning = applyEnvironmentTLSFingerprintConfig(tabSession, snapshot.tlsFingerprint)
    if (this.mediaHub?.sniffer) {
      this.mediaHub.sniffer.attachSession(tabSession, () => this.activeId)
    }
    // 外部协议在旧内核中默认放行，统一拒绝网页唤起外部程序，覆盖隐藏子框架。
    tabSession.setPermissionRequestHandler((_contents, permission, callback) => {
      callback(isPermissionAllowed(permission))
    })
    tabSession.setPermissionCheckHandler((_contents, permission) => isPermissionAllowed(permission))
    const proxyBridge = await applyProxyConfig(tabSession, snapshot.proxy, url)
    try {
      if (snapshot.proxy && snapshot.proxy.mode !== 'direct' && snapshot.fingerprint?.modules) {
        snapshot.fingerprint.modules.webrtc = true
      }
      const fingerprintWarning = applyFingerprintConfig(tabSession, snapshot.fingerprint, { allowMissingCapabilitiesQuery: true })
      const warning = [tlsWarning, fingerprintWarning].filter(Boolean).join('；')
      const targetUA = snapshot.fingerprint?.browser?.userAgent ||
        `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${process.versions.chrome || '138.0.0.0'} Safari/537.36`
      if (typeof tabSession.setUserAgent === 'function') tabSession.setUserAgent(targetUA)
    const view = new WebContentsView({ webPreferences: {
      // 当前 Testing 内核需要显式初始化为显示状态，否则原生视图没有可截图的绘制表面。
      show: true,
      session: tabSession,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: STEALTH_PRELOAD_PATH,
      additionalArguments: bridgeArguments(),
      backgroundThrottling: false
    } })
    const tab = { id: tabId, kind: 'managed', environmentId: environment.id, dataDir, profile: snapshot, view, proxyBridge, title: '新标签', url, warning, error: '', loading: false, preserveLastUrl, popups: new Set() }
    const contents = view.webContents
    this.capabilityRegistry?.register(contents, 'managed', { capabilities: ['*'], allowedOrigins: /^https?:/.test(url) ? [new URL(url).origin] : [], ...policy })
    this.bindShortcuts(contents)
    if (typeof contents.setBackgroundThrottling === 'function') {
      contents.setBackgroundThrottling(false)
    }
    contents.setWindowOpenHandler(({ url, disposition }) => {
      const isHttpOrBlank = /^https?:\/\//i.test(url) || url === 'about:blank'
      if (this.dashboardView) {
        if (isHttpOrBlank) void this.openOrdinary(url, { session: tabSession, proxy: snapshot.proxy, ownerEnvironmentId: environment.id }).catch(() => {})
        return { action: 'deny' }
      }
      switch (disposition) {
        case 'new-window': {
          if (!isHttpOrBlank) return { action: 'deny' }
          return {
            action: 'allow',
            createWindow: (options) => {
              const popup = new BrowserWindow({
                ...options,
                autoHideMenuBar: true,
                webPreferences: {
                  ...options?.webPreferences,
                  preload: STEALTH_PRELOAD_PATH,
                  backgroundThrottling: false
                }
              })
              if (typeof popup.webContents.setBackgroundThrottling === 'function') {
                popup.webContents.setBackgroundThrottling(false)
              }
              tab.popups.add(popup)
              popup.once('closed', () => {
                tab.popups.delete(popup)
              })
              popup.webContents.on('will-navigate', (event, target) => {
                if (!/^https?:\/\//i.test(target) && target !== 'about:blank') {
                  event.preventDefault()
                }
              })
              popup.webContents.on('dom-ready', () => {
                void popup.webContents.executeJavaScript(generateStealthScript()).catch(() => {})
              })
              popup.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
              return popup.webContents
            }
          }
        }
        case 'default':
        case 'other':
        case 'foreground-tab':
        case 'background-tab': {
          if (isHttpOrBlank && url !== 'about:blank') {
            void contents.loadURL(url)
          }
          return { action: 'deny' }
        }
        default:
          return { action: 'deny' }
      }
    })
    for (const event of ['will-navigate', 'will-redirect']) {
      contents.on(event, (navigationEvent, target) => {
        if (!/^https?:\/\//i.test(target) && target !== 'about:blank') navigationEvent.preventDefault()
      })
    }
    contents.on('page-title-updated', (_event, title) => { tab.title = title; this.notify() })
    contents.on('dom-ready', () => {
      void contents.executeJavaScript(generateStealthScript()).catch(() => {})
    })
    contents.on('did-start-loading', () => { tab.loading = true; tab.error = ''; this.notify() })
    contents.on('did-stop-loading', () => {
      tab.loading = false
      tab.preserveLastUrl = false
      this.notify()
      if (this.mediaHub && this.activeId === tab.id) {
        void this.mediaHub.extractCurrentMedia()
      }
    })
    for (const event of ['did-navigate', 'did-navigate-in-page']) {
      contents.on(event, () => {
        tab.url = contents.getURL()
        if (this.mediaHub) {
          this.mediaHub.sniffer.clearTab(tab.id)
          this.mediaHub.cachedExtractions.delete(tab.id)
        }
        if (!tab.preserveLastUrl) void this.saveEnvironmentUrl(tab)
        this.notify()
      })
    }
    contents.on('did-fail-load', (_event, code, _description, _url, isMainFrame) => {
      if (isMainFrame && code !== -3) { tab.error = '网页加载失败，请检查网址和网络连接。'; this.notify() }
    })
    contents.on('render-process-gone', () => { tab.error = '页面进程已退出，请刷新标签重试。'; this.notify() })
    await this.environmentRepository.update(environment.id, { status: 'open' })
    this.onEnvironmentChanged()
    this.tabs.set(tabId, tab)
    this.select(tabId)
    try {
      await loadUrlWithProxyTimeout(contents, url, snapshot.proxy)
      if (this.xGrokAutomation) {
        this.xGrokAutomation.onEnvironmentOpened(environment, tabId, url)
      }
    } catch (error) {
      console.error('[加载标签网页]', error)
      tab.preserveLastUrl = false
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
      const environmentId = tab.environmentId || tab.ownerEnvironmentId
      const remainingTabIds = environmentId ? this.tabIdsForEnvironment(environmentId).filter(tabId => tabId !== id) : []
      if (environmentId) await this.environmentRepository.update(environmentId, {
        status: remainingTabIds.length > 0 ? 'open' : 'closed',
        lastUrl: contents && !contents.isDestroyed() ? contents.getURL() || tab.url : tab.url
      })
      if (environmentId && remainingTabIds.length === 0 && this.xGrokAutomation) {
        this.xGrokAutomation.onEnvironmentClosed(environmentId)
      }
      this.onEnvironmentChanged()
      if (this.mediaHub) {
        this.mediaHub.sniffer.clearTab(id)
        this.mediaHub.cachedExtractions.delete(id)
      }
      if (this.window && !this.window.isDestroyed() && this.window.contentView.children.includes(tab.view)) {
        this.window.contentView.removeChildView(tab.view)
      }
      if (tab.popups) {
        for (const popup of tab.popups) {
          if (!popup.isDestroyed()) popup.destroy()
        }
        tab.popups.clear()
      }
      const order = [...this.tabs.keys()]; const closingIndex = order.indexOf(id)
      this.tabs.delete(id)
      this.capabilityRegistry?.revoke(contents)
      if (contents && !contents.isDestroyed()) contents.close()
      tab.proxyBridge?.close()
      if (this.activeId === id) {
        this.activeId = null
        const nextId = order.slice(closingIndex + 1).find(key => this.tabs.has(key)) || order.slice(0, closingIndex).reverse().find(key => this.tabs.has(key))
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
          if (tab?.popups) {
            for (const popup of tab.popups) {
              if (!popup.isDestroyed()) popup.destroy()
            }
            tab.popups.clear()
          }
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
    if (!payload.id && this.dashboardView) {
      const contents = this.dashboardView.webContents
      if (payload.action === 'reload') { void contents.loadURL(this.homeUrl).catch(() => {}); return }
      if (payload.action === 'stop') { contents.stop(); this.notify(); return }
      if (payload.action === 'back' && contents.navigationHistory.canGoBack()) contents.navigationHistory.goBack()
      else if (payload.action === 'forward' && contents.navigationHistory.canGoForward()) contents.navigationHistory.goForward()
      else if (!['back', 'forward'].includes(payload.action)) throw new ProfileValidationError('首页地址由打包配置决定，不能更换。')
      return
    }
    const tab = this.getTab(payload.id)
    const contents = tab.view.webContents
    switch (payload.action) {
      case 'load':
        let url
        try { url = resolveAddress(payload.url) } catch (error) { throw new ProfileValidationError(error.message) }
        tab.url = url; tab.error = ''; this.notify()
        if (this.activeId === tab.id) contents.focus()
        try {
          await loadUrlWithProxyTimeout(contents, url === 'about:blank' && tab.kind === 'ordinary' ? NEW_TAB_URL : url, tab.profile?.proxy)
        } catch (error) {
          if (error?.code === 'ERR_ABORTED' || error?.errno === -3) return
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
      case 'stop': contents.stop(); tab.loading = false; tab.url = contents.getURL() === NEW_TAB_URL ? 'about:blank' : contents.getURL() || tab.url; this.notify(); break
      default: throw new ProfileValidationError('不支持此标签操作。')
    }
  }
}

module.exports = { TabBrowser, applyProxyConfig }
