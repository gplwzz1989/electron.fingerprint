'use strict'

const path = require('node:path')
const { ipcMain, shell, app } = require('electron')
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

    // 2. 文章创作
    ipcMain.handle('creator:generate-article', async (_event, params) => {
      return ArticleCreator.generateArticleDraft(params)
    })

    ipcMain.handle('creator:check-compliance', async (_event, text) => {
      return ArticleCreator.checkCompliance(text)
    })

    // 3. 动态/贴图创作
    ipcMain.handle('creator:create-post-config', async (_event, params) => {
      return PostCreator.createPostConfig(params)
    })

    ipcMain.handle('creator:save-post-image', async (_event, { base64Data, prefix }) => {
      await this.assetStore.ensureReady()
      const filePath = await PostCreator.saveBase64Image(this.assetStore.mediaDir, base64Data, prefix)
      return { ok: true, filePath }
    })

    // 4. 视频创作
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

    // 5. 自动发布与指纹环境联动
    ipcMain.handle('creator:prepare-publish', async (_event, { environmentId, asset }) => {
      return await PublisherAdapter.openInEnvironment({
        tabBrowser: this.tabBrowser,
        environmentId,
        asset
      })
    })

    // 6. 文件操作
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
