const { randomUUID } = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

const DEFAULT_URL = 'https://example.com'
const DEFAULT_PROXY = { mode: 'direct', server: '', username: '', password: '' }
const DEFAULT_ENVIRONMENT_GROUP = '未分组'
const DEFAULT_ENVIRONMENT_STORAGE = 'local'

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

function migrateLegacyFingerprint (input) {
  const migrated = clone(input)
  if (migrated.hardware?.deviceMemory === 16) {
    // 兼容旧版本保存的 16 GiB 网页可见值，迁移为当前网页 API 契约的 8 GiB。
    migrated.hardware.deviceMemory = 8
  }
  return migrated
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
    if (key === 'deviceMemory' && ![1, 2, 4, 8].includes(value)) {
      fail('hardware.deviceMemory 必须是 1、2、4 或 8 GiB。')
    }
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
  const migratedInput = migrateLegacyFingerprint(input)
  const base = clone(DEFAULT_PROFILE)
  const profile = {
    ...base,
    ...migratedInput,
    browser: { ...base.browser, ...(migratedInput.browser || {}) },
    locale: { ...base.locale, ...(migratedInput.locale || {}) },
    hardware: { ...base.hardware, ...(migratedInput.hardware || {}) },
    screen: { ...base.screen, ...(migratedInput.screen || {}) },
    graphics: { ...base.graphics, ...(migratedInput.graphics || {}) },
    noise: { ...base.noise, ...(migratedInput.noise || {}) },
    modules: { ...base.modules, ...(migratedInput.modules || {}) }
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

function createTLSFingerprintConfig (input) {
  if (input === undefined || input === null) return undefined
  ensureObject(input, 'TLS 策略')
  ensureOnlyKeys(input, [
    'chromiumVersion', 'cipherSuites', 'permuteExtensions', 'echEnabled',
    'postQuantumKeyAgreementEnabled', 'supportedGroups', 'signatureAlgorithms',
    'alpsCodepoint', 'targetVersion', 'targetMajor', 'emulationMode'
  ], 'TLS 策略')
  if (typeof input.chromiumVersion !== 'string' || !/^138\.\d+\.\d+\.\d+$/.test(input.chromiumVersion)) {
    fail('TLS 策略必须声明当前 Chrome 138 内核的完整版本。')
  }
  if (Object.hasOwn(input, 'emulationMode') && !['native', 'cross-version'].includes(input.emulationMode)) {
    fail('TLS 策略 emulationMode 必须为 native 或 cross-version。')
  }
  if (Object.hasOwn(input, 'targetMajor') && (!Number.isInteger(input.targetMajor) || input.targetMajor < 100 || input.targetMajor > 200)) {
    fail('TLS 策略 targetMajor 必须为受支持的 Chrome 大版本整数 (100-200)。')
  }
  if (Object.hasOwn(input, 'targetVersion') && (typeof input.targetVersion !== 'string' || !/^\d+\.\d+\.\d+\.\d+$/.test(input.targetVersion))) {
    fail('TLS 策略 targetVersion 必须为合法的四段版本号字符串。')
  }
  for (const key of ['permuteExtensions', 'echEnabled', 'postQuantumKeyAgreementEnabled']) {
    if (Object.hasOwn(input, key)) ensureBoolean(input[key], `TLS 策略 ${key}`)
  }
  if (Object.hasOwn(input, 'alpsCodepoint') && ![17513, 17613].includes(input.alpsCodepoint)) {
    fail('TLS 策略的 ALPS 扩展标识必须为整数 17513 或 17613。')
  }
  const supported = {
    cipherSuites: [0xc02b, 0xc02f, 0xc02c, 0xc030, 0xcca9, 0xcca8, 0xc013, 0xc014, 0x009c, 0x009d, 0x002f, 0x0035],
    supportedGroups: [23, 24, 29, 4588, 25497],
    signatureAlgorithms: [0x0403, 0x0804, 0x0401, 0x0503, 0x0805, 0x0501, 0x0806, 0x0601]
  }
  for (const [key, allowed] of Object.entries(supported)) {
    if (!Object.hasOwn(input, key)) continue
    const values = input[key]
    if (!Array.isArray(values) || !values.length || values.length > allowed.length ||
      new Set(values).size !== values.length || values.some(value => !Number.isInteger(value) || !allowed.includes(value))) {
      fail(`TLS 策略 ${key} 必须是不重复的受支持整数列表，且不能为空。`)
    }
  }
  if (input.postQuantumKeyAgreementEnabled === false && input.supportedGroups?.some(group => group === 4588 || group === 25497)) {
    fail('关闭后量子密钥协商时，TLS 支持组不能包含 X25519MLKEM768 或 X25519Kyber768Draft00。')
  }
  return clone(input)
}

const PRESET_METADATA = {
  'win11-us-nvidia': {
    name: 'Windows 11 · 美东 · RTX 3060',
    description: 'Windows 11 / 英语(美东时区) / NVIDIA GeForce RTX 3060 / 16核 8G / 1080P'
  },
  'win10-us-intel': {
    name: 'Windows 10 · 美西 · Intel UHD 630',
    description: 'Windows 10 / 英语(美西时区) / Intel UHD Graphics 630 / 8核 8G / 2K 分辨率'
  },
  'win11-ja-intel': {
    name: 'Windows 11 · 日本 · Intel Iris Xe',
    description: 'Windows 11 / 日语(东京时区) / Intel Iris Xe Graphics / 16核 8G / 1.25 缩放'
  },
  'win11-us-chrome120-nvidia': {
    name: 'Windows 11 · 美东 · Chrome 120 经典稳定版',
    description: 'Windows 11 / 英语(美东时区) / Chrome 120 (纯传统 TLS 曲线) / RTX 3060 / 16核 8G / 1080P'
  },
  'win11-us-chrome126-nvidia': {
    name: 'Windows 11 · 美西 · Chrome 126 Kyber 版',
    description: 'Windows 11 / 英语(美西时区) / Chrome 126 (草案后量子) / RTX 4070 / 16核 8G / 2K 分辨率'
  }
}

let cachedPresetTemplates = null

function getPresetTemplates () {
  if (cachedPresetTemplates) return clone(cachedPresetTemplates)
  const profilesDir = path.join(__dirname, 'profiles')
  const templates = []
  try {
    if (fs.existsSync(profilesDir)) {
      const files = fs.readdirSync(profilesDir).filter(name => name.endsWith('.json'))
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(profilesDir, file), 'utf8')
          const profile = JSON.parse(content)
          validateFingerprintProfile(profile)
          const meta = PRESET_METADATA[profile.id] || {
            name: profile.id,
            description: `${profile.locale?.language || ''} / ${profile.locale?.timezone || ''} / ${profile.graphics?.webglRenderer || ''}`
          }
          templates.push({
            id: profile.id,
            name: meta.name,
            description: meta.description,
            profile
          })
        } catch {
          // 忽略单个损坏的模板
        }
      }
    }
  } catch {
    // 目录不可读时降级
  }
  cachedPresetTemplates = templates
  return clone(templates)
}

function getPresetTemplateById (id) {
  if (!id) return null
  const templates = getPresetTemplates()
  return templates.find(item => item.id === id) || null
}

function createProfileRecord (input = {}) {
  ensureObject(input, '浏览器配置记录')
  let source = input.fingerprint
  if (!source && input.presetId) {
    const preset = getPresetTemplateById(input.presetId)
    if (preset) {
      source = preset.profile
    }
  }
  if (!source) {
    source = input
  }
  ensureObject(source, '指纹配置')
  const requestedId = typeof input.id === 'string' && input.id.trim() ? input.id.trim() : source.id
  const id = requestedId || `profile-${randomUUID().slice(0, 8)}`
  const fingerprint = createFingerprintProfile({ ...source, id })
  const name = input.name === undefined ? id : String(input.name).trim()
  if (!name) fail('配置名称不能为空。')
  const url = normalizeUrl(input.url === undefined ? DEFAULT_URL : String(input.url).trim())
  const revision = Number.isInteger(input.revision) && input.revision > 0 ? input.revision : 1
  const groupValue = input.group === undefined || input.group === null ? DEFAULT_ENVIRONMENT_GROUP : String(input.group).trim()
  if (groupValue.length > 80) fail('环境分组名称不能超过 80 个字符。')
  const group = groupValue || DEFAULT_ENVIRONMENT_GROUP
  const storage = input.storage === undefined || input.storage === null ? DEFAULT_ENVIRONMENT_STORAGE : input.storage
  if (!['local', 'cloud'].includes(storage)) fail('环境保存方式只能是 local 或 cloud。')
  const tlsFingerprint = createTLSFingerprintConfig(input.tlsFingerprint)
  return { id, name, group, storage, url, revision, fingerprint, proxy: createProxyConfig(input.proxy), ...(tlsFingerprint ? { tlsFingerprint } : {}) }
}

function getDefaultProfile () {
  return clone(DEFAULT_PROFILE)
}

module.exports = {
  DEFAULT_URL,
  DEFAULT_ENVIRONMENT_GROUP,
  DEFAULT_ENVIRONMENT_STORAGE,
  createProxyConfig,
  createTLSFingerprintConfig,
  ProfileValidationError,
  createFingerprintProfile,
  createProfileRecord,
  getDefaultProfile,
  getPresetTemplates,
  getPresetTemplateById,
  normalizeUrl,
  validateFingerprintProfile
}

