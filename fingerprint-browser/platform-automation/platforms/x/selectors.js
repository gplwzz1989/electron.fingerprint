'use strict'

/**
 * X (Twitter) 平台 DOM 选择器与页面数据契约
 * 统一管理 Grok 页面交互与发帖框 DOM 结构
 */

const SELECTORS = {
  // 登录态检测
  LOGIN_INDICATORS: [
    'a[href="/login"]',
    '[data-testid="loginButton"]'
  ],
  ACCOUNT_INDICATORS: [
    '[data-testid="SideNav_AccountSwitcher_Button"]',
    '[data-testid="AppTabBar_Profile_Link"]',
    'a[href="/home"]'
  ],

  // Grok 对话界面
  GROK_INPUT: '[role="textbox"][contenteditable="true"][aria-label="Ask anything"], div[contenteditable="true"][aria-label*="Ask" i], div[contenteditable="true"][role="textbox"], textarea',
  GROK_SEND_BUTTON: 'button[aria-label="Send"], button[aria-label="发送"], button[aria-label*="Send" i], button[type="submit"]',
  GROK_STOP_BUTTON: 'button[aria-label*="Stop" i], button[data-testid*="stop" i]',
  GROK_MESSAGE_BLOCK: '[data-quotable-message]',
  GROK_CONTENT_HOLDER: '.grok-trace-soft-enter, .wrap-break-word',

  // 发帖界面
  POST_TRIGGER_NAV: 'a[data-testid="SideNav_NewTweet_Button"], a[href="/compose/post"]',
  TWEET_TEXTAREA: '[data-testid="tweetTextarea_0"], div[role="textbox"][data-testid*="tweetTextarea"], div[contenteditable="true"][role="textbox"]',
  TWEET_BUTTON: 'button[data-testid="tweetButtonInline"], button[data-testid="tweetButton"]'
}

/**
 * 清理 Grok 生成的正文，去除客套前缀、思维链残留与首尾引号
 * @param {string} raw
 * @returns {string}
 */
function cleanGeneratedText (raw) {
  if (!raw) return ''
  let text = raw.trim()
  let prevText
  do {
    prevText = text
    text = text.trim()
    // 剥离多层引号
    if ((text.startsWith('"') && text.endsWith('"')) ||
        (text.startsWith('“') && text.endsWith('”')) ||
        (text.startsWith("'") && text.endsWith("'"))) {
      text = text.slice(1, -1).trim()
    }
    // 去除常见的模型客套前缀
    text = text.replace(/^(好的[，,！!]?|好的[：:]|这[是一条为您为你]+.*?推文[：:]|这里是.*?推文[：:]|Here is a tweet.*?[:：]|Tweet:)\s*/i, '')
  } while (text !== prevText)

  // 限制单条推文最大长度（X 平台单条限制通常为 280 字符）
  if (text.length > 270) {
    text = text.slice(0, 267) + '...'
  }
  return text
}

/**
 * 严格判断 URL 是否属于 X (Twitter) 官方域名
 * @param {string} url
 * @returns {boolean}
 */
function isXPlatformUrl (url) {
  if (!url || typeof url !== 'string') return false
  try {
    const parsed = new URL(url.trim())
    const host = parsed.hostname.toLowerCase()
    return host === 'x.com' ||
      host.endsWith('.x.com') ||
      host === 'twitter.com' ||
      host.endsWith('.twitter.com')
  } catch {
    const lower = String(url).toLowerCase()
    return lower.includes('x.com') || lower.includes('twitter.com')
  }
}

module.exports = {
  SELECTORS,
  cleanGeneratedText,
  isXPlatformUrl
}
