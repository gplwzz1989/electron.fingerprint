/**
 * 适配器基类与数据契约规范
 * 支持视频 (video)、音频 (audio)、图片 (image) 多媒体资源提取
 */

class BaseAdapter {
  constructor () {
    this.id = 'base'
    this.name = '基础适配器'
  }

  /**
   * 判断当前 URL 是否归本适配器处理
   * @param {string} url - 标签页网址
   * @param {object} [context] - 可选上下文
   * @returns {boolean}
   */
  match (url, context) {
    return false
  }

  /**
   * 提取页面多媒体资源
   * @param {object} context
   * @param {string} context.tabId - 标签ID
   * @param {string} context.url - 当前页面网址
   * @param {Electron.WebContents} context.webContents - 当前网页 WebContents
   * @param {Electron.Session} context.session - 当前环境持久化 Session
   * @param {object} [context.proxy] - 环境代理配置
   * @param {Array} [context.sniffed] - 网络层嗅探到的媒体请求
   * @returns {Promise<MediaExtractionResult>}
   */
  async extract (context) {
    throw new Error('需由子类实现 extract 方法。')
  }
}

module.exports = {
  BaseAdapter
}
