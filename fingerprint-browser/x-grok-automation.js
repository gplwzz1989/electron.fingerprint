'use strict'

/**
 * 兼容层：重定向至模块化目录 platform-automation
 */

const { XPlatformAutomation, DEFAULT_PROMPT, DEFAULT_INTERVAL_MS } = require('./platform-automation/platforms/x')
const { PlatformAutomationManager } = require('./platform-automation')

module.exports = {
  XGrokAutomation: XPlatformAutomation,
  PlatformAutomationManager,
  DEFAULT_PROMPT,
  DEFAULT_INTERVAL_MS
}
