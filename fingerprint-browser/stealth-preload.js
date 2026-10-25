/**
 * 网页标签与 OAuth 弹窗专用防检测预加载守护脚本
 * 在主世界（Main World）最先阶段注入完整原生伪装体系，彻底防御 BotGuard、reCAPTCHA 及各类风控反爬
 */

const { webFrame } = require('electron')
const { generateStealthScript } = require('./stealth-engine')

try {
  // 在 Main World 执行原生环境伪装代码
  webFrame.executeJavaScript(generateStealthScript())
} catch (error) {
  console.error('[Stealth Preload Error]', error)
}
