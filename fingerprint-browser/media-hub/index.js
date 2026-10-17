const { ipcMain } = require('electron')
const { AdapterRegistry } = require('./adapter-registry')
const { MediaSniffer } = require('./media-sniffer')
const { DownloadManager } = require('./download-manager')
const { PopoverWindow } = require('./popover-window')

class MediaHub {
  constructor () {
    this.adapterRegistry = new AdapterRegistry()
    this.sniffer = new MediaSniffer()
    this.downloadManager = new DownloadManager()
    this.popoverWindow = null
    this.tabBrowser = null
    this.dashboardWindow = null
    this.cachedExtractions = new Map() // tabId -> result
  }

  attach ({ tabBrowser, dashboardWindow }) {
    this.tabBrowser = tabBrowser
    this.dashboardWindow = dashboardWindow
    this.popoverWindow = new PopoverWindow(dashboardWindow)

    // 监听网络层嗅探变化，向前端同步角标
    this.sniffer.on('change', ({ tabId, count }) => {
      this.notifyTabMediaCount(tabId, count)
    })

    // 监听下载任务变化，向弹出窗推送最新任务列表
    this.downloadManager.on('tasks-changed', tasks => {
      this.popoverWindow.sendTasks(tasks)
    })

    this.registerIpc()
  }

  getActiveTab () {
    if (!this.tabBrowser || !this.tabBrowser.activeId) return null
    try {
      return this.tabBrowser.getTab(this.tabBrowser.activeId)
    } catch {
      return null
    }
  }

  async extractCurrentMedia () {
    const tab = this.getActiveTab()
    if (!tab || !tab.view || tab.view.webContents.isDestroyed()) {
      return null
    }

    const adapter = this.adapterRegistry.findAdapter(tab.url)
    const context = {
      tabId: tab.id,
      url: tab.url,
      webContents: tab.view.webContents,
      session: tab.view.webContents.session,
      proxy: tab.profile?.proxy,
      sniffed: this.sniffer.getForTab(tab.id)
    }

    try {
      const result = await adapter.extract(context)
      this.cachedExtractions.set(tab.id, result)
      this.popoverWindow.sendExtraction(result)
      const count = result.resources?.length || 0
      this.notifyTabMediaCount(tab.id, count)
      return result
    } catch (err) {
      console.warn(`[提取媒体异常: ${adapter.id}]`, err.message)
      // 降级为通用嗅探器
      if (adapter.id !== 'generic') {
        const fallback = this.adapterRegistry.fallbackAdapter
        try {
          const fallbackResult = await fallback.extract(context)
          this.cachedExtractions.set(tab.id, fallbackResult)
          this.popoverWindow.sendExtraction(fallbackResult)
          const count = fallbackResult.resources?.length || 0
          this.notifyTabMediaCount(tab.id, count)
          return fallbackResult
        } catch (_) {}
      }
      return null
    }
  }

  notifyTabMediaCount (tabId, count) {
    if (this.dashboardWindow && !this.dashboardWindow.isDestroyed()) {
      this.dashboardWindow.webContents.send('media:count-changed', { tabId, count })
    }
  }

  registerIpc () {
    // 切换气泡面板显示/隐藏
    ipcMain.handle('media:toggle-popover', async (_event, anchorBounds) => {
      const isShown = this.popoverWindow.toggle(anchorBounds)
      if (isShown) {
        // 展开时立即触发解析
        void this.extractCurrentMedia()
      }
      return { ok: true, isShown }
    })

    // 获取当前标签页媒体提取数据
    ipcMain.handle('media:get-extraction', async () => {
      const tab = this.getActiveTab()
      if (!tab) return null
      return this.cachedExtractions.get(tab.id) || await this.extractCurrentMedia()
    })

    // 获取下载任务
    ipcMain.handle('media:get-tasks', () => {
      return this.downloadManager.listTasks()
    })

    // 开始单个下载
    ipcMain.handle('media:start-download', (_event, resource) => {
      const tab = this.getActiveTab()
      return this.downloadManager.startDownload({
        tabId: tab?.id,
        session: tab?.view?.webContents?.session,
        resource
      })
    })

    // 批量下载
    ipcMain.handle('media:batch-download', async (_event, resources) => {
      const tab = this.getActiveTab()
      const session = tab?.view?.webContents?.session
      if (Array.isArray(resources)) {
        for (const res of resources) {
          this.downloadManager.startDownload({
            tabId: tab?.id,
            session,
            resource: res
          })
        }
      }
      return { ok: true }
    })

    // 取消任务
    ipcMain.handle('media:cancel-task', (_event, taskId) => {
      this.downloadManager.cancelTask(taskId)
      return { ok: true }
    })

    // 打开文件
    ipcMain.handle('media:open-file', (_event, taskId) => {
      this.downloadManager.openFile(taskId)
      return { ok: true }
    })

    // 打开所在目录
    ipcMain.handle('media:open-folder', (_event, taskId) => {
      this.downloadManager.openFolder(taskId)
      return { ok: true }
    })

    // 关闭浮窗
    ipcMain.handle('media:close-popover', () => {
      this.popoverWindow.hide()
      return { ok: true }
    })

    // 获取特定标签页媒体数量
    ipcMain.handle('media:get-count', (_event, tabId) => {
      const cached = this.cachedExtractions.get(tabId)
      if (cached && cached.resources) return cached.resources.length
      return this.sniffer.getForTab(tabId).length
    })
  }
}

module.exports = {
  MediaHub
}
