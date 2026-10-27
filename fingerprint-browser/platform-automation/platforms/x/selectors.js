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
  MENTION_CANDIDATE: '[data-testid="TypeaheadUser"]',
  REPLY_TEXTAREA: '[role="dialog"] [data-testid="tweetTextarea_0"]',
  REPLY_BUTTON: '[role="dialog"] [data-testid="tweetButton"]',
  REPLY_CLOSE: '[role="dialog"] [data-testid="app-bar-close"]',
  TWEET_TEXTAREA: '[data-testid="tweetTextarea_0"], div[role="textbox"][data-testid*="tweetTextarea"], div[contenteditable="true"][role="textbox"]',
  TWEET_BUTTON: 'button[data-testid="tweetButtonInline"], button[data-testid="tweetButton"]'
}

function normalizeMentionHandles (value) {
  const entries = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/[\s,，;；]+/) : null
  if (!entries) throw new Error('提及账号格式无效，请填写 X 用户名，多个账号用空格或逗号分隔。')
  const handles = []
  for (const entry of entries) {
    if (typeof entry !== 'string') throw new Error('提及账号必须是 X 用户名。')
    const handle = entry.trim().replace(/^@/, '')
    if (!handle) continue
    if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) throw new Error('X 用户名只能包含 1 至 15 位字母、数字或下划线，请检查提及账号。')
    if (!handles.some(item => item.toLowerCase() === handle.toLowerCase())) handles.push(handle)
  }
  if (handles.length > 10) throw new Error('每条推文最多配置 10 个提及账号。')
  return handles
}

function normalizeXGrokConfig (value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('X 发帖配置格式无效。')
  const config = {}
  if (value.prompt !== undefined) {
    if (typeof value.prompt !== 'string' || !value.prompt.trim()) throw new Error('请填写 Grok 创作提示词。')
    config.prompt = value.prompt.trim()
  }
  if (value.intervalMs !== undefined) {
    if (!Number.isSafeInteger(value.intervalMs) || value.intervalMs < 60000 || value.intervalMs > 86400000) {
      throw new Error('发帖间隔应为 1 分钟至 24 小时。')
    }
    config.intervalMs = value.intervalMs
  }
  if (value.mentions !== undefined) config.mentions = normalizeMentionHandles(value.mentions)
  if (value.roamingEnabled !== undefined) {
    if (typeof value.roamingEnabled !== 'boolean') throw new Error('漫游评论开关无效。')
    config.roamingEnabled = value.roamingEnabled
  }
  if (value.commentSentences !== undefined) {
    const sentences = Array.isArray(value.commentSentences) ? value.commentSentences
      : typeof value.commentSentences === 'string' ? value.commentSentences.split(/\r?\n/) : null
    if (!sentences || sentences.some(sentence => typeof sentence !== 'string')) throw new Error('评论句子格式无效，请每行填写一句评论。')
    config.commentSentences = [...new Set(sentences.map(sentence => sentence.trim()).filter(Boolean))]
    if (config.commentSentences.length > 50 || config.commentSentences.some(sentence => [...sentence].length > 120)) {
      throw new Error('最多配置 50 句评论，每句不超过 120 个字符。')
    }
  }
  if (value.commentIntervalMs !== undefined) {
    if (!Number.isSafeInteger(value.commentIntervalMs) || value.commentIntervalMs < 60000 || value.commentIntervalMs > 3600000) {
      throw new Error('评论间隔应为 1 至 60 分钟。')
    }
    config.commentIntervalMs = value.commentIntervalMs
  }
  if (config.roamingEnabled && !config.commentSentences?.length) throw new Error('启用漫游评论前，请至少填写一句评论。')
  return config
}

function getXPostBodyBudget (mentions = []) {
  const suffix = normalizeMentionHandles(mentions).map(handle => '@' + handle).join(' ')
  // 为中文双倍计数、提及账号和编辑器空白留出空间，超限时仍以 X 页面校验为准。
  return Math.max(1, Math.min(120, Math.floor((280 - (suffix ? suffix.length + 1 : 0) - 12) / 2)))
}

function buildGrokPrompt (prompt, mentions = []) {
  return String(prompt).trim() + '\n\n发布约束：请遵守以上风格和结尾要求；正文总长度（包括中文、标点和换行）最多 ' +
    getXPostBodyBudget(mentions) + ' 个字符。不要附加解释或引号，提及账号由程序追加，请勿在正文中重复添加。'
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
  isXPlatformUrl,
  normalizeMentionHandles,
  normalizeXGrokConfig,
  getXPostBodyBudget,
  buildGrokPrompt
}
