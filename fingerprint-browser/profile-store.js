const { randomUUID } = require('node:crypto')

const DEFAULT_URL = 'https://example.com'
const DEFAULT_PROXY = { mode: 'direct', server: '', username: '', password: '' }

const DEFAULT_PROFILE = {
  schemaVersion: 1,
  id: 'win11-cn-desktop',
  enabled: true,
  browser: {
    family: 'Chrome',
    chromiumMajor: 138,
    userAgent: null,
    acceptLanguage: 'zh-CN,zh;q=0.9'
  },
  locale: {
    language: 'zh-CN',
    languages: ['zh-CN', 'zh'],
    timezone: 'Asia/Shanghai'
  },
  hardware: {
    hardwareConcurrency: 8,
    deviceMemory: 8,
    platform: 'Win32'
  },
  screen: {
    width: 1920,
    height: 1080,
    availWidth: 1920,
    availHeight: 1040,
    deviceScaleFactor: 1
  },
  graphics: {
    webglVendor: 'Google Inc. (Intel)',
    webglRenderer: 'ANGLE (Intel, Intel(R) UHD Graphics, D3D11)'
  },
  noise: {
    seed: 'win11-cn-desktop-stable',
    canvas: false,
    audio: false,
    rects: false
  },
  modules: {
    ua: true,
    clientHints: true,
    locale: true,
    timezone: true,
    navigator: true,
    screen: true,
    webgl: true,
    canvas: false,
    audio: false,
    fonts: false,
    webrtc: false,
    runtimeInspector: false
  }
}

class ProfileValidationError extends Error {
  constructor (message) {
    super(`指纹配置无效：${message}`)
    this.name = 'ProfileValidationError'
  }
}

function clone (value) {
  return JSON.parse(JSON.stringify(value))
}

function fail (message) {
  throw new ProfileValidationError(message)
}

function ensureObject (value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail(`${label}必须是对象。`)
  }
}

function ensureOnlyKeys (value, allowed, label) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      fail(`${label}包含不支持字段“${key}”。`)
    }
  }
}

function ensureString (value, label, minLength = 1) {
  if (typeof value !== 'string' || value.length < minLength) {
    fail(`${label}必须是长度至少为 ${minLength} 的字符串。`)
  }
}

function ensureBoolean (value, label) {
  if (typeof value !== 'boolean') {
    fail(`${label}必须是布尔值。`)
  }
}

function validateFingerprintProfile (profile) {
  ensureObject(profile, '顶层配置')
  ensureOnlyKeys(profile, ['schemaVersion', 'id', 'enabled', 'browser', 'locale', 'hardware', 'screen', 'graphics', 'noise', 'modules'], '顶层配置')

  if (profile.schemaVersion !== 1) fail('schemaVersion 必须为 1。')
  ensureString(profile.id, 'id')
  ensureBoolean(profile.enabled, 'enabled')

  ensureObject(profile.browser, 'browser')
  ensureOnlyKeys(profile.browser, ['family', 'chromiumMajor', 'userAgent', 'acceptLanguage'], 'browser')
  if (profile.browser.family !== 'Chrome') fail('browser.family 必须为 Chrome。')
  if (profile.browser.chromiumMajor !== 138) fail('browser.chromiumMajor 必须为 138。')
  if (profile.browser.userAgent !== null) ensureString(profile.browser.userAgent, 'browser.userAgent', 0)
  ensureString(profile.browser.acceptLanguage, 'browser.acceptLanguage')

  ensureObject(profile.locale, 'locale')
  ensureOnlyKeys(profile.locale, ['language', 'languages', 'timezone'], 'locale')
  ensureString(profile.locale.language, 'locale.language', 2)
  if (!Array.isArray(profile.locale.languages) || profile.locale.languages.length === 0) {
    fail('locale.languages 至少需要一个语言。')
  }
  for (const language of profile.locale.languages) ensureString(language, 'locale.languages 中的语言', 2)
  ensureString(profile.locale.timezone, 'locale.timezone')
  try {
    Intl.getCanonicalLocales([profile.locale.language, ...profile.locale.languages])
  } catch {
    fail('locale.language 和 locale.languages 必须使用有效的语言标记。')
  }
  try {
    new Intl.DateTimeFormat('zh-CN', { timeZone: profile.locale.timezone })
  } catch {
    fail('locale.timezone 必须是有效时区，例如 Asia/Shanghai。')
  }

  ensureObject(profile.hardware, 'hardware')
  ensureOnlyKeys(profile.hardware, ['hardwareConcurrency', 'deviceMemory', 'platform'], 'hardware')
  for (const key of ['hardwareConcurrency', 'deviceMemory']) {
    const value = profile.hardware[key]
    if (!Number.isInteger(value) || value < 1 || value > 1024) {
      fail(`hardware.${key} 必须是 1 到 1024 之间的整数。`)
    }
  }
  if (!['Win32', 'MacIntel', 'Linux x86_64'].includes(profile.hardware.platform)) {
    fail('硬件平台只能是 Win32、MacIntel 或 Linux x86_64。')
  }

  ensureObject(profile.screen, 'screen')
  ensureOnlyKeys(profile.screen, ['width', 'height', 'availWidth', 'availHeight', 'deviceScaleFactor'], 'screen')
  for (const key of ['width', 'height', 'availWidth', 'availHeight']) {
    if (!Number.isInteger(profile.screen[key]) || profile.screen[key] < 1 || profile.screen[key] > 2147483647) {
      fail(`screen.${key} 必须是 1 到 2147483647 之间的整数。`)
    }
  }
  if (profile.screen.availWidth > profile.screen.width || profile.screen.availHeight > profile.screen.height) {
    fail('screen 的可用尺寸不能大于总尺寸。')
  }
  if (!Number.isFinite(profile.screen.deviceScaleFactor) || profile.screen.deviceScaleFactor <= 0) {
    fail('screen.deviceScaleFactor 必须是大于 0 的有限数值。')
  }

  ensureObject(profile.graphics, 'graphics')
  ensureOnlyKeys(profile.graphics, ['webglVendor', 'webglRenderer'], 'graphics')
  ensureString(profile.graphics.webglVendor, 'graphics.webglVendor', 0)
  ensureString(profile.graphics.webglRenderer, 'graphics.webglRenderer', 0)

  ensureObject(profile.noise, 'noise')
  ensureOnlyKeys(profile.noise, ['seed', 'canvas', 'audio', 'rects'], 'noise')
  ensureString(profile.noise.seed, 'noise.seed')
  for (const key of ['canvas', 'audio', 'rects']) ensureBoolean(profile.noise[key], `noise.${key}`)

  ensureObject(profile.modules, 'modules')
  ensureOnlyKeys(profile.modules, ['ua', 'clientHints', 'locale', 'timezone', 'navigator', 'screen', 'webgl', 'canvas', 'audio', 'fonts', 'webrtc', 'runtimeInspector'], 'modules')
  for (const key of ['ua', 'clientHints', 'locale', 'timezone', 'navigator', 'screen', 'webgl', 'canvas', 'audio', 'fonts', 'webrtc']) {
    ensureBoolean(profile.modules[key], `modules.${key}`)
  }
  if (Object.hasOwn(profile.modules, 'runtimeInspector')) ensureBoolean(profile.modules.runtimeInspector, 'modules.runtimeInspector')

  return profile
}

function createFingerprintProfile (input = {}) {
  ensureObject(input, '指纹配置')
  const base = clone(DEFAULT_PROFILE)
  const profile = {
    ...base,
    ...input,
    browser: { ...base.browser, ...(input.browser || {}) },
    locale: { ...base.locale, ...(input.locale || {}) },
    hardware: { ...base.hardware, ...(input.hardware || {}) },
    screen: { ...base.screen, ...(input.screen || {}) },
    graphics: { ...base.graphics, ...(input.graphics || {}) },
    noise: { ...base.noise, ...(input.noise || {}) },
    modules: { ...base.modules, ...(input.modules || {}) }
  }
  validateFingerprintProfile(profile)
  return profile
}

function normalizeUrl (value) {
  if (value === 'about:blank') return value
  ensureString(value, '网址')
  let parsed
  try {
    parsed = new URL(value)
  } catch {
    fail('网址格式不正确。')
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) fail('网址只支持 http、https 或 about:blank。')
  return parsed.toString()
}

function createProxyConfig (input) {
  if (input === undefined) return clone(DEFAULT_PROXY)
  ensureObject(input, 'proxy')
  ensureOnlyKeys(input, ['mode', 'server', 'username', 'password'], 'proxy')
  const mode = input.mode === undefined ? 'direct' : input.mode
  if (!['direct', 'http', 'socks5'].includes(mode)) fail('proxy.mode 只能是 direct、http 或 socks5。')
  const server = input.server === undefined || input.server === null ? '' : String(input.server).trim()
  const username = input.username === undefined || input.username === null ? '' : String(input.username)
  const password = input.password === undefined || input.password === null ? '' : String(input.password)
  if (mode === 'direct') {
    if (server || username || password) fail('直连模式不能填写代理地址或认证信息。')
    return clone(DEFAULT_PROXY)
  }
  ensureString(server, 'proxy.server')
  let parsed
  try {
    parsed = new URL(server)
  } catch {
    fail('proxy.server 必须是有效的代理地址。')
  }
  const protocols = mode === 'socks5' ? ['socks5:', 'socks5h:'] : ['http:', 'https:']
  if (!protocols.includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password) {
    fail(`proxy.server 必须使用 ${mode === 'socks5' ? 'socks5' : 'http'} 协议且不能内嵌认证信息。`)
  }
  if (mode === 'socks5' && (username || password) && (!username || !password || Buffer.byteLength(username, 'utf8') > 255 || Buffer.byteLength(password, 'utf8') > 255)) {
    fail('SOCKS5 认证需同时填写账号和密码，且每项不能超过 255 字节。')
  }
  return { mode, server, username, password }
}

function createProfileRecord (input = {}) {
  ensureObject(input, '浏览器配置记录')
  const source = input.fingerprint || input
  ensureObject(source, '指纹配置')
  const requestedId = typeof input.id === 'string' && input.id.trim() ? input.id.trim() : source.id
  const id = requestedId || `profile-${randomUUID().slice(0, 8)}`
  const fingerprint = createFingerprintProfile({ ...source, id })
  const name = input.name === undefined ? id : String(input.name).trim()
  if (!name) fail('配置名称不能为空。')
  const url = normalizeUrl(input.url === undefined ? DEFAULT_URL : String(input.url).trim())
  const revision = Number.isInteger(input.revision) && input.revision > 0 ? input.revision : 1
  return { id, name, url, revision, fingerprint, proxy: createProxyConfig(input.proxy) }
}

function getDefaultProfile () {
  return clone(DEFAULT_PROFILE)
}

module.exports = {
  DEFAULT_URL,
  createProxyConfig,
  ProfileValidationError,
  createFingerprintProfile,
  createProfileRecord,
  getDefaultProfile,
  normalizeUrl,
  validateFingerprintProfile
}
