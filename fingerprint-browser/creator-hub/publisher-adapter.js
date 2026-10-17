'use strict'

// 各大社交媒体与短视频平台的官方创作者发布后台 URL
const PLATFORM_CREATOR_URLS = {
  xiaohongshu: 'https://creator.xiaohongshu.com/publish/publish',
  douyin: 'https://creator.douyin.com/creator-micro/content/upload',
  bilibili: 'https://member.bilibili.com/platform/upload/video/frame',
  wechat: 'https://mp.weixin.qq.com/',
  zhihu: 'https://www.zhihu.com/creator',
  weibo: 'https://weibo.com/'
}

class PublisherAdapter {
  /**
   * 获取指定平台的创作者上传网址
   * @param {string} platform
   */
  static getCreatorUrl (platform) {
    return PLATFORM_CREATOR_URLS[platform] || PLATFORM_CREATOR_URLS.xiaohongshu
  }

  /**
   * 为目标平台装配发布载荷草稿包
   * @param {import('./types').CreativeAsset} asset
   * @param {string} [platform]
   */
  static preparePublishPayload (asset, platform) {
    const targetPlatform = platform || asset.targetPlatform || 'xiaohongshu'
    const creatorUrl = this.getCreatorUrl(targetPlatform)

    let formattedText = asset.content || ''
    // 若有标签，补充在文末
    if (Array.isArray(asset.tags) && asset.tags.length > 0) {
      const tagLine = asset.tags.map(t => (t.startsWith('#') ? t : `#${t}`)).join(' ')
      if (!formattedText.includes(tagLine)) {
        formattedText = `${formattedText}\n\n${tagLine}`
      }
    }

    return {
      assetId: asset.id,
      platform: targetPlatform,
      creatorUrl,
      title: asset.title,
      text: formattedText,
      coverPath: asset.coverPath || '',
      mediaFiles: asset.mediaFiles || [],
      tags: asset.tags || []
    }
  }

  /**
   * 与指纹浏览器环境联动：在指定环境的独立标签页中打开创作者后台并准备填报
   * @param {Object} options
   * @param {import('../browser-tabs').TabBrowser} options.tabBrowser
   * @param {string} options.environmentId
   * @param {import('./types').CreativeAsset} options.asset
   */
  static async openInEnvironment ({ tabBrowser, environmentId, asset }) {
    if (!tabBrowser) throw new Error('浏览器未初始化')
    if (!environmentId) throw new Error('请选择一个已配置的指纹环境')

    const payload = this.preparePublishPayload(asset)
    const targetUrl = payload.creatorUrl

    // 检查环境是否已经打开，若未打开先打开，若已打开则新建/导航标签页
    let tab = null
    if (tabBrowser.isOpen(environmentId)) {
      tab = await tabBrowser.openPageTab(environmentId, targetUrl)
    } else {
      const env = tabBrowser.environmentRepository?.get(environmentId)
      if (!env) throw new Error('找不到指定的指纹浏览器环境')
      tab = await tabBrowser.openPage(env, environmentId)
      await tabBrowser.navigate({ id: tab.id, action: 'load', url: targetUrl })
    }

    return {
      ok: true,
      tabId: tab.id,
      environmentId,
      creatorUrl: targetUrl,
      payload
    }
  }

  static buildPublishPayload (options) {
    const asset = options.asset || options
    return this.preparePublishPayload(asset, options.platform)
  }

  getCreatorUrl (platform) { return PublisherAdapter.getCreatorUrl(platform) }
  preparePublishPayload (asset, platform) { return PublisherAdapter.preparePublishPayload(asset, platform) }
  buildPublishPayload (options) { return PublisherAdapter.buildPublishPayload(options) }
}

module.exports = {
  PublisherAdapter,
  PLATFORM_CREATOR_URLS
}
