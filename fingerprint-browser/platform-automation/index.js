'use strict'

/**
 * 平台自动化中心 (Platform Automation Hub)
 * 统一管理各独立社交/内容平台的自动化驱动（按平台目录隔离解耦）
 */

const { EventEmitter } = require('node:events')
const { XPlatformAutomation } = require('./platforms/x')

class PlatformAutomationManager extends EventEmitter {
  constructor (options = {}) {
    super()
    this.tabBrowser = options.tabBrowser || null
    this.platforms = new Map() // platformId -> PlatformAutomationInstance

    // 默认注册各主流平台驱动
    this.registerPlatform(new XPlatformAutomation({ tabBrowser: this.tabBrowser }))
  }

  setTabBrowser (tabBrowser) {
    this.tabBrowser = tabBrowser
    for (const platform of this.platforms.values()) {
      platform.setTabBrowser(tabBrowser)
    }
  }

  registerPlatform (platformInstance) {
    this.platforms.set(platformInstance.platformId, platformInstance)
    // 转发状态变更事件
    platformInstance.on('status-changed', snapshot => {
      this.emit('status-changed', snapshot)
    })
  }

  getPlatform (platformId) {
    return this.platforms.get(platformId)
  }

  /**
   * 查找匹配指定环境的平台驱动
   */
  findPlatformForEnvironment (environment, targetUrl) {
    for (const platform of this.platforms.values()) {
      if (platform.match(environment, targetUrl)) {
        return platform
      }
    }
    return null
  }

  /**
   * 环境打开时自动分发给对应平台驱动
   */
  onEnvironmentOpened (environment, tabId, targetUrl) {
    const matchedPlatform = this.findPlatformForEnvironment(environment, targetUrl)
    if (matchedPlatform) {
      matchedPlatform.onEnvironmentOpened(environment, tabId, targetUrl)
    }
  }

  /**
   * 环境关闭时清理所有平台中的关联任务
   */
  onEnvironmentClosed (environmentId) {
    for (const platform of this.platforms.values()) {
      platform.onEnvironmentClosed(environmentId)
    }
  }

  /**
   * 获取指定环境的当前自动化状态
   */
  getTaskStatus (environmentId) {
    for (const platform of this.platforms.values()) {
      const status = platform.getTaskStatus(environmentId)
      if (status) return status
    }
    return null
  }

  /**
   * 切换自动发帖开关
   */
  toggleTask (environmentId, enabled) {
    // 优先从已有任务的平台查找
    for (const platform of this.platforms.values()) {
      if (platform.tasks.has(environmentId)) {
        return platform.toggleTask(environmentId, enabled)
      }
    }

    // 否则尝试根据当前 tab 匹配的平台开启
    const tab = this.tabBrowser?.tabs.get(environmentId) || [...(this.tabBrowser?.tabs.values() || [])].find(t => t.environmentId === environmentId)
    const platform = this.findPlatformForEnvironment({ profileName: tab?.profileName, id: environmentId }, tab?.url) || this.getPlatform('x')
    return platform.toggleTask(environmentId, enabled)
  }

  /**
   * 立即触发一次发帖
   */
  async triggerNow (environmentId) {
    for (const platform of this.platforms.values()) {
      if (platform.tasks.has(environmentId)) {
        return await platform.triggerNow(environmentId)
      }
    }

    const tab = this.tabBrowser?.tabs.get(environmentId) || [...(this.tabBrowser?.tabs.values() || [])].find(t => t.environmentId === environmentId)
    const platform = this.findPlatformForEnvironment({ profileName: tab?.profileName, id: environmentId }, tab?.url) || this.getPlatform('x')
    return await platform.triggerNow(environmentId)
  }

  /**
   * 更新发帖参数配置
   */
  updateConfig (environmentId, payload) {
    for (const platform of this.platforms.values()) {
      if (platform.tasks.has(environmentId)) {
        return platform.updateConfig(environmentId, payload)
      }
    }

    const tab = this.tabBrowser?.tabs.get(environmentId) || [...(this.tabBrowser?.tabs.values() || [])].find(t => t.environmentId === environmentId)
    const platform = this.findPlatformForEnvironment({ profileName: tab?.profileName, id: environmentId }, tab?.url) || this.getPlatform('x')
    return platform.updateConfig(environmentId, payload)
  }
}

module.exports = {
  PlatformAutomationManager
}
