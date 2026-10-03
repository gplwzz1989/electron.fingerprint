const path = require('node:path')
const fs = require('node:fs/promises')
const { BrowserWindow, WebContentsView, session } = require('electron/main')
const { applyFingerprintConfig } = require('./runtime-compat')
const { ProfileValidationError, normalizeUrl } = require('./profile-store')

const HEADER_HEIGHT = 144

class TabBrowser {
  constructor (dataRoot, environmentRepository) {
    this.dataRoot = dataRoot
    this.environmentRepository = environmentRepository
    this.window = null
    this.ready = null
    this.tabs = new Map()
    this.activeId = null
    this.shuttingDown = null
  }

  async ensureWindow () {
    if (this.window && !this.window.isDestroyed()) {
      await this.ready
      return
    }
    const window = new BrowserWindow({
      width: 1400,
      height: 960,
      minWidth: 980,
      minHeight: 680,
      title: '多标签指纹浏览器',
      backgroundColor: '#10141c',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true
      }
    })
    this.window = window
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
    window.webContents.on('will-navigate', event => event.preventDefault())
    window.on('resize', () => this.layout())
    window.on('closed', () => {
      this.window = null
      this.ready = null
      void this.shutdown()
    })
    this.ready = window.loadFile(path.join(__dirname, 'renderer', 'browser.html'))
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
    if (this.tabs.has(environment.id)) throw new ProfileValidationError('该浏览器环境已经打开。')
    try {
      await fs.access(environment.dataDir)
    } catch {
      throw new ProfileValidationError('环境数据目录不存在，无法恢复登录状态。')
    }
    return await this.openEnvironment(environment)
  }

  async openEnvironment (environment) {
    if (this.tabs.has(environment.id)) throw new ProfileValidationError('该浏览器环境已经打开。')
    const profile = {
      id: environment.profileId,
      name: environment.profileName,
      url: environment.lastUrl,
      revision: environment.profileRevision,
      fingerprint: environment.fingerprint
    }
    const url = normalizeUrl(environment.lastUrl)
    await this.ensureWindow()
    const id = environment.id
    const dataDir = environment.dataDir
    const snapshot = structuredClone(profile)
    if (!this.window || this.window.isDestroyed()) throw new ProfileValidationError('浏览器窗口已关闭，请重新创建标签。')
    // 每个标签使用不同路径的持久化会话，不能按配置 ID 复用会话。
    const tabSession = session.fromPath(dataDir)
    const warning = applyFingerprintConfig(tabSession, snapshot.fingerprint)
    const view = new WebContentsView({ webPreferences: {
      // 当前 Testing 内核需要显式初始化为显示状态，否则原生视图没有可截图的绘制表面。
      show: true,
      session: tabSession,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    } })
    const tab = { id, environmentId: id, dataDir, profile: snapshot, view, title: '新标签', url, warning, error: '', loading: false }
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
    await this.environmentRepository.update(id, { status: 'open', lastUrl: url })
    this.tabs.set(id, tab)
    this.select(id)
    try {
      await contents.loadURL(url)
    } catch (error) {
      console.error('[加载标签网页]', error)
      if (this.tabs.has(id)) {
        tab.error = '网页加载失败，请检查网址和网络连接。'
        this.notify()
      }
      throw new ProfileValidationError('网页加载失败，标签已保留，可修改网址后重试。')
    }
    return { tabId: id, warning }
  }

  async saveEnvironmentUrl (tab) {
    try {
      await this.environmentRepository.update(tab.environmentId, { lastUrl: tab.url })
    } catch (error) {
      console.error('[保存环境网址]', error)
    }
  }

  isOpen (environmentId) {
    return this.tabs.has(environmentId)
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
      await this.environmentRepository.update(tab.environmentId, {
        status: 'closed',
        lastUrl: contents && !contents.isDestroyed() ? contents.getURL() || tab.url : tab.url
      })
      if (this.window && !this.window.isDestroyed() && this.window.contentView.children.includes(tab.view)) {
        this.window.contentView.removeChildView(tab.view)
      }
      this.tabs.delete(id)
      if (contents && !contents.isDestroyed()) contents.close()
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
          await this.environmentRepository.update(id, { status: 'closed' }).catch(updateError => console.error('[保存环境状态]', updateError))
          const tab = this.tabs.get(id)
          const contents = tab?.view?.webContents
          if (contents && !contents.isDestroyed()) contents.close()
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
          await contents.loadURL(normalizeUrl(payload.url))
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
