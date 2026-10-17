const { BilibiliAdapter } = require('./adapters/bilibili')
const { DouyinAdapter } = require('./adapters/douyin')
const { XiaohongshuAdapter } = require('./adapters/xiaohongshu')
const { GenericAdapter } = require('./adapters/generic')

class AdapterRegistry {
  constructor () {
    this.adapters = []
    this.fallbackAdapter = new GenericAdapter()
    this.initDefaultAdapters()
  }

  initDefaultAdapters () {
    // 注册内置适配器，高优先级放前
    this.register(new BilibiliAdapter())
    this.register(new DouyinAdapter())
    this.register(new XiaohongshuAdapter())
  }

  /**
   * 注册新适配器（方便后续扩展新站点）
   * @param {import('./types').BaseAdapter} adapter
   */
  register (adapter) {
    if (!adapter || typeof adapter.match !== 'function') {
      throw new Error('无效的适配器对象。')
    }
    // 避免重复注册
    this.adapters = this.adapters.filter(item => item.id !== adapter.id)
    this.adapters.push(adapter)
  }

  /**
   * 根据当前网址匹配最佳适配器
   * @param {string} url
   * @returns {import('./types').BaseAdapter}
   */
  findAdapter (url) {
    if (typeof url === 'string') {
      for (const adapter of this.adapters) {
        try {
          if (adapter.match(url)) return adapter
        } catch (e) {
          console.warn(`[适配器匹配异常: ${adapter.id}]`, e)
        }
      }
    }
    return this.fallbackAdapter
  }
}

module.exports = {
  AdapterRegistry
}
