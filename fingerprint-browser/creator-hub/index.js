'use strict'

const path = require('node:path')
const { ipcMain, shell, dialog, app } = require('electron')
const { AssetStore } = require('./asset-store')
const { ArticleCreator } = require('./article-creator')
const { PostCreator } = require('./post-creator')
const { VideoCreator } = require('./video-creator')
const { PublisherAdapter } = require('./publisher-adapter')

class CreatorHub {
  constructor () {
    const userData = app.getPath('userData')
    this.assetStore = new AssetStore(userData)
    this.tabBrowser = null
    this.dashboardWindow = null
  }

  attach ({ tabBrowser, dashboardWindow }) {
    this.tabBrowser = tabBrowser
    this.dashboardWindow = dashboardWindow
    this.registerIpc()
  }

  registerIpc () {
    // 1. 资产库管理
    ipcMain.handle('creator:list-assets', async (_event, filter) => {
      return await this.assetStore.list(filter)
    })

    ipcMain.handle('creator:save-asset', async (_event, data) => {
      return await this.assetStore.save(data)
    })

    ipcMain.handle('creator:delete-asset', async (_event, id) => {
      return await this.assetStore.delete(id)
    })

    ipcMain.handle('creator:update-status', async (_event, { id, status }) => {
      return await this.assetStore.updateStatus(id, status)
    })

    // 2. 媒体库素材扫描与选择
    ipcMain.handle('creator:list-downloaded-media', async (_event, options = {}) => {
      await this.assetStore.ensureReady()
      const downloadDir = path.join(app.getPath('downloads'), '栖界媒体库')
      const appRoot = app.getAppPath()
      const fixtureDir = path.join(appRoot, 'spec', 'fixtures')

      return await VideoCreator.listDownloadedMedia({
        downloadDir,
        mediaDir: this.assetStore.mediaDir,
        extraDirs: [fixtureDir, ...(options.extraDirs || [])]
      })
    })

    ipcMain.handle('creator:select-local-files', async (_event, { type = 'all', multi = true } = {}) => {
      const window = this.dashboardWindow
      let filters = []
      if (type === 'video') {
        filters = [{ name: '视频素材 (*.mp4, *.mov, *.mkv, *.webm)', extensions: ['mp4', 'mov', 'mkv', 'webm', 'avi', 'flv'] }]
      } else if (type === 'image') {
        filters = [{ name: '图片素材 (*.png, *.jpg, *.jpeg, *.webp, *.gif)', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'] }]
      } else {
        filters = [{ name: '所有支持媒体 (*.mp4, *.png, *.jpg, etc.)', extensions: ['mp4', 'mov', 'mkv', 'webm', 'png', 'jpg', 'jpeg', 'webp'] }]
      }

      const properties = ['openFile']
      if (multi) properties.push('multiSelections')

      const res = await dialog.showOpenDialog(window, {
        title: '选择本地创作素材',
        properties,
        filters
      })

      if (res.canceled || !res.filePaths) {
        return { canceled: true, filePaths: [] }
      }
      return { canceled: false, filePaths: res.filePaths }
    })

    // 3. 文章与微信公众号创作
    ipcMain.handle('creator:generate-article', async (_event, params) => {
      return ArticleCreator.generateArticleDraft(params)
    })

    ipcMain.handle('creator:check-compliance', async (_event, text) => {
      return ArticleCreator.checkCompliance(text)
    })

    ipcMain.handle('creator:get-wechat-templates', async () => {
      return ArticleCreator.getWechatTemplates()
    })

    // 4. 图文创作 (标题 + 富文本 + 多张图片)
    ipcMain.handle('creator:create-post-config', async (_event, params) => {
      return PostCreator.createPostConfig(params)
    })

    ipcMain.handle('creator:validate-post', async (_event, payload) => {
      return PostCreator.validatePostData(payload)
    })

    ipcMain.handle('creator:save-post-image', async (_event, { base64Data, prefix }) => {
      await this.assetStore.ensureReady()
      const filePath = await PostCreator.saveBase64Image(this.assetStore.mediaDir, base64Data, prefix)
      return { ok: true, filePath }
    })

    ipcMain.handle('creator:persist-post-images', async (_event, { images }) => {
      await this.assetStore.ensureReady()
      const filePaths = await PostCreator.persistPostImages(this.assetStore.mediaDir, images)
      return { ok: true, filePaths }
    })

    // 5. 视频创作 (FFmpeg + 下载视频素材)
    ipcMain.handle('creator:generate-storyboard', async (_event, params) => {
      return VideoCreator.generateStoryboard(params)
    })

    ipcMain.handle('creator:render-video', async (_event, params) => {
      await this.assetStore.ensureReady()
      return await VideoCreator.renderVideo({
        outputDir: this.assetStore.mediaDir,
        ...params
      })
    })

    // 6. 自动发布与指纹环境联动
    ipcMain.handle('creator:prepare-publish', async (_event, { environmentId, asset }) => {
      return await PublisherAdapter.openInEnvironment({
        tabBrowser: this.tabBrowser,
        environmentId,
        asset
      })
    })

    // 7. 文件操作
    ipcMain.handle('creator:open-file', async (_event, filePath) => {
      if (typeof filePath === 'string') {
        shell.showItemInFolder(filePath)
        return { ok: true }
      }
      return { ok: false }
    })
  }
}

module.exports = {
  CreatorHub,
  AssetStore,
  ArticleCreator,
  PostCreator,
  VideoCreator,
  PublisherAdapter
}
