'use strict'

/**
 * 平台自动化基类 (BasePlatformAutomation)
 * 规范多平台自动化的生命周期、心跳倒计时、日志记录与配置管理
 */

const { EventEmitter } = require('node:events')

class BasePlatformAutomation extends EventEmitter {
  constructor (options = {}) {
    super()
    this.platformId = options.platformId || 'base'
    this.platformName = options.platformName || 'Base Platform'
    this.tabBrowser = options.tabBrowser || null
    this.tasks = new Map() // environmentId -> TaskRecord
    this.defaultIntervalMs = options.defaultIntervalMs || 10 * 60 * 1000
    this.defaultPrompt = options.defaultPrompt || ''
  }

  setTabBrowser (tabBrowser) {
    this.tabBrowser = tabBrowser
  }

  /**
   * 判断环境是否匹配该平台（子类重写）
   * @param {Object} environment
   * @param {string} [targetUrl]
   * @returns {boolean}
   */
  match (environment, targetUrl) {
    throw new Error('子类必须实现 match 方法。')
  }

  /**
   * 环境打开生命周期钩子
   */
  onEnvironmentOpened (environment, tabId, targetUrl) {
    if (!this.match(environment, targetUrl)) return false

    const environmentId = environment.id
    const displayName = environment.profileName || environment.name || environmentId
    console.log(`[平台自动化][${this.platformName}] 检测到匹配环境打开：${displayName} (${environmentId})`)

    let task = this.tasks.get(environmentId)
    if (!task) {
      task = this.createTask(environmentId, tabId, displayName)
      this.tasks.set(environmentId, task)
    } else {
      task.tabId = tabId
      task.environmentName = displayName
    }

    this.addLog(task, 'info', `环境已打开，${this.platformName} 自动化引擎已就绪（待命状态，等待用户手动点击启动）。`)
    this.notifyStatus(task)
    return true
  }

  /**
   * 环境关闭生命周期钩子
   */
  onEnvironmentClosed (environmentId) {
    const task = this.tasks.get(environmentId)
    if (!task) return
    console.log(`[平台自动化][${this.platformName}] 环境已关闭，清理任务：${environmentId}`)
    this.stopTask(task)
    this.tasks.delete(environmentId)
    this.emit('task-removed', { platformId: this.platformId, environmentId })
  }

  createTask (environmentId, tabId, environmentName = '') {
    return {
      platformId: this.platformId,
      environmentId,
      tabId,
      environmentName,
      enabled: false,
      intervalMs: this.defaultIntervalMs,
      prompt: this.defaultPrompt,
      state: 'idle', // 'idle' | 'generating' | 'posting' | 'success' | 'error' | 'stopped'
      statusText: '未启动，等待手动开启',
      lastRunAt: null,
      nextRunAt: null,
      remainingSeconds: Math.round(this.defaultIntervalMs / 1000),
      lastGeneratedText: '',
      lastPostUrl: '',
      runCount: 0,
      timer: null,
      countdownInterval: null,
      logs: []
    }
  }

  addLog (task, level, message) {
    const timeStr = new Date().toLocaleTimeString('zh-CN', { hour12: false })
    const entry = { time: timeStr, level, message }
    task.logs.unshift(entry)
    if (task.logs.length > 60) task.logs.pop()
    console.log(`[平台自动化][${this.platformName}][${task.environmentName || task.environmentId}] [${timeStr}] ${message}`)
    this.notifyStatus(task)
  }

  scheduleNextRun (task, delayMs) {
    if (task.timer) {
      clearTimeout(task.timer)
      task.timer = null
    }
    if (task.countdownInterval) {
      clearInterval(task.countdownInterval)
      task.countdownInterval = null
    }

    const waitMs = typeof delayMs === 'number' ? delayMs : task.intervalMs
    task.nextRunAt = Date.now() + waitMs
    task.remainingSeconds = Math.max(0, Math.round(waitMs / 1000))

    // 秒级倒计时心跳
    task.countdownInterval = setInterval(() => {
      if (!task.nextRunAt) return
      const remaining = Math.max(0, Math.round((task.nextRunAt - Date.now()) / 1000))
      task.remainingSeconds = remaining
      if (remaining <= 0) {
        clearInterval(task.countdownInterval)
        task.countdownInterval = null
      }
      this.notifyStatus(task)
    }, 1000)

    task.timer = setTimeout(async () => {
      task.timer = null
      if (task.enabled) {
        await this.runCycle(task)
      }
    }, waitMs)
  }

  stopTask (task) {
    if (task.timer) {
      clearTimeout(task.timer)
      task.timer = null
    }
    if (task.countdownInterval) {
      clearInterval(task.countdownInterval)
      task.countdownInterval = null
    }
    task.state = 'stopped'
    task.statusText = '自动发帖已停止'
    task.nextRunAt = null
    task.remainingSeconds = 0
    this.notifyStatus(task)
  }

  toggleTask (environmentId, enabled) {
    let task = this.tasks.get(environmentId)
    if (!task) {
      const tab = this.getTabForEnvironment(environmentId)
      if (!tab) throw new Error('未找到该环境打开的标签页，请先打开环境。')
      task = this.createTask(environmentId, tab.id, tab.profileName || environmentId)
      this.tasks.set(environmentId, task)
    }

    const targetEnabled = typeof enabled === 'boolean' ? enabled : !task.enabled
    task.enabled = targetEnabled

    if (targetEnabled) {
      task.statusText = `已手动启动，将在 ${Math.round(task.intervalMs / 60000)} 分钟后发帖`
      this.addLog(task, 'info', `已手动启动自动发帖，将在 ${Math.round(task.intervalMs / 60000)} 分钟后自动执行发帖。`)
      this.scheduleNextRun(task, task.intervalMs)
    } else {
      this.addLog(task, 'info', '任务已被手动暂停。')
      this.stopTask(task)
    }
    return this.getTaskSnapshot(task)
  }

  async triggerNow (environmentId) {
    let task = this.tasks.get(environmentId)
    if (!task) {
      const tab = this.getTabForEnvironment(environmentId)
      if (!tab) throw new Error('未找到该环境打开的标签页，请先打开环境。')
      task = this.createTask(environmentId, tab.id, tab.profileName || environmentId)
      this.tasks.set(environmentId, task)
    }

    if (task.state === 'generating' || task.state === 'posting') {
      throw new Error('当前正在执行任务中，请稍候。')
    }

    this.addLog(task, 'info', '手动立即触发执行。')
    void this.runCycle(task)
    return this.getTaskSnapshot(task)
  }

  updateConfig (environmentId, { intervalMs, prompt }) {
    let task = this.tasks.get(environmentId)
    if (!task) {
      const tab = this.getTabForEnvironment(environmentId)
      if (!tab) throw new Error('未找到该环境打开的标签页。')
      task = this.createTask(environmentId, tab.id, tab.profileName || environmentId)
      this.tasks.set(environmentId, task)
    }

    if (typeof intervalMs === 'number' && intervalMs >= 60000) {
      task.intervalMs = intervalMs
      this.addLog(task, 'info', `发帖间隔已修改为 ${Math.round(intervalMs / 60000)} 分钟。`)
      if (task.enabled) {
        this.scheduleNextRun(task, intervalMs)
      }
    }

    if (typeof prompt === 'string' && prompt.trim()) {
      task.prompt = prompt.trim()
      this.addLog(task, 'info', '已更新创作提示词。')
    }

    this.notifyStatus(task)
    return this.getTaskSnapshot(task)
  }

  getTabForEnvironment (environmentId) {
    if (!this.tabBrowser) return null
    for (const tab of this.tabBrowser.tabs.values()) {
      if (tab.environmentId === environmentId) return tab
    }
    return null
  }

  getTaskSnapshot (task) {
    return {
      platformId: this.platformId,
      platformName: this.platformName,
      environmentId: task.environmentId,
      tabId: task.tabId,
      environmentName: task.environmentName,
      enabled: task.enabled,
      intervalMs: task.intervalMs,
      prompt: task.prompt,
      state: task.state,
      statusText: task.statusText,
      lastRunAt: task.lastRunAt,
      nextRunAt: task.nextRunAt,
      remainingSeconds: task.remainingSeconds,
      lastGeneratedText: task.lastGeneratedText,
      lastPostUrl: task.lastPostUrl,
      runCount: task.runCount,
      logs: task.logs
    }
  }

  getTaskStatus (environmentId) {
    const task = this.tasks.get(environmentId)
    if (!task) {
      const tab = this.getTabForEnvironment(environmentId)
      if (tab) {
        return {
          platformId: this.platformId,
          platformName: this.platformName,
          environmentId,
          tabId: tab.id,
          enabled: false,
          state: 'idle',
          statusText: '未启动自动发帖',
          intervalMs: this.defaultIntervalMs,
          prompt: this.defaultPrompt,
          remainingSeconds: 0,
          logs: []
        }
      }
      return null
    }
    return this.getTaskSnapshot(task)
  }

  notifyStatus (task) {
    const snapshot = this.getTaskSnapshot(task)
    this.emit('status-changed', snapshot)
    if (this.tabBrowser?.window && !this.tabBrowser.window.isDestroyed()) {
      this.tabBrowser.window.webContents.send('platform-automation:status-changed', snapshot)
      // 保持向下兼容旧事件名称
      this.tabBrowser.window.webContents.send('x-grok:status-changed', snapshot)
    }
  }

  /**
   * 核心执行循环（子类必须实现）
   * @param {Object} task
   */
  async runCycle (task) {
    throw new Error('子类必须实现 runCycle 方法。')
  }
}

module.exports = { BasePlatformAutomation }
