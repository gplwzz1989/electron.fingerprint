const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { createFingerprintProfile } = require('../profile-store')
const { previewFingerprintProfile } = require('../fingerprint-review')

// 从 saas-app.js 提取定义的预设与选项常量
const saasAppCode = fs.readFileSync(path.join(__dirname, '../renderer/saas-app.js'), 'utf8')

function extractArray (varName) {
  const match = saasAppCode.match(new RegExp(`const ${varName} = (\\[[\\s\\S]*?\\n\\])`))
  if (!match) throw new Error(`未在 saas-app.js 中找到 ${varName}`)
  return eval(match[1]) // eslint-disable-line no-eval
}

const FINGERPRINT_PRESETS = extractArray('FINGERPRINT_PRESETS')
const LANGUAGE_OPTIONS = extractArray('LANGUAGE_OPTIONS')
const TIMEZONE_OPTIONS = extractArray('TIMEZONE_OPTIONS')
const SCREEN_PRESETS = extractArray('SCREEN_PRESETS')
const WEBGL_PRESETS = extractArray('WEBGL_PRESETS')
const URL_PRESETS = extractArray('URL_PRESETS')
const CPU_OPTIONS = extractArray('CPU_OPTIONS')
const MEMORY_OPTIONS = extractArray('MEMORY_OPTIONS')
const SCALE_OPTIONS = extractArray('SCALE_OPTIONS')

// 1. 测试语言与时区有效性
for (const item of LANGUAGE_OPTIONS) {
  assert.doesNotThrow(() => Intl.getCanonicalLocales(item.value), `语言标记无效: ${item.value}`)
  assert.doesNotThrow(() => Intl.getCanonicalLocales(item.defaultLanguages), `默认语言列表无效: ${item.defaultLanguages}`)
  assert.equal(item.defaultLanguages[0], item.value, `默认语言列表首位必须为主要语言: ${item.value}`)
  if (item.defaultTimezone) {
    assert.doesNotThrow(() => new Intl.DateTimeFormat('en-US', { timeZone: item.defaultTimezone }), `默认时区无效: ${item.defaultTimezone}`)
  }
}

for (const tz of TIMEZONE_OPTIONS) {
  assert.doesNotThrow(() => new Intl.DateTimeFormat('en-US', { timeZone: tz.value }), `时区无效: ${tz.value}`)
}

// 2. 测试屏幕分辨率预设
for (const sp of SCREEN_PRESETS) {
  assert.ok(sp.width > 0 && sp.height > 0, `屏幕宽高必须大于0: ${sp.label}`)
  assert.ok(sp.availWidth <= sp.width, `可用宽度不能大于总宽度: ${sp.label}`)
  assert.ok(sp.availHeight <= sp.height, `可用高度不能大于总高度: ${sp.label}`)
}

// 3. 测试显卡与渲染器预设
for (const gpu of WEBGL_PRESETS) {
  assert.ok(typeof gpu.vendor === 'string' && gpu.vendor.length > 0, `显卡厂商必须为非空字符串: ${gpu.name}`)
  assert.ok(typeof gpu.renderer === 'string' && gpu.renderer.length > 0, `显卡渲染器必须为非空字符串: ${gpu.name}`)
}

// 4. 测试常用网址预设
for (const urlItem of URL_PRESETS) {
  if (urlItem.value !== 'about:blank') {
    assert.doesNotThrow(() => new URL(urlItem.value), `预设网址无效: ${urlItem.value}`)
    assert.match(urlItem.value, /^https?:\/\//, `预设网址必须是 http/https: ${urlItem.value}`)
  }
}

// 5. 测试 CPU、内存与缩放选项
for (const cpu of CPU_OPTIONS) {
  assert.ok(Number.isInteger(cpu.value) && cpu.value >= 1, `CPU核心数必须为正整数: ${cpu.value}`)
}
for (const mem of MEMORY_OPTIONS) {
  assert.ok([1, 2, 4, 8].includes(mem.value), `内存必须符合规范 [1, 2, 4, 8]: ${mem.value}`)
}
for (const scale of SCALE_OPTIONS) {
  assert.ok(scale.value > 0, `屏幕缩放必须大于0: ${scale.value}`)
}

// 6. 测试全套指纹方案预设的合法性
for (const preset of FINGERPRINT_PRESETS) {
  const profileInput = {
    schemaVersion: 1,
    id: preset.id,
    enabled: true,
    browser: {
      family: 'Chrome',
      chromiumMajor: 138,
      userAgent: preset.data.userAgent,
      acceptLanguage: preset.data.acceptLanguage
    },
    locale: {
      language: preset.data.language,
      languages: preset.data.languages,
      timezone: preset.data.timezone
    },
    hardware: {
      platform: preset.data.platform,
      hardwareConcurrency: preset.data.cpu,
      deviceMemory: preset.data.memory
    },
    screen: {
      width: preset.data.width,
      height: preset.data.height,
      availWidth: preset.data.availWidth,
      availHeight: preset.data.availHeight,
      deviceScaleFactor: preset.data.scale
    },
    graphics: {
      webglVendor: preset.data.webglVendor,
      webglRenderer: preset.data.webglRenderer
    },
    noise: {
      seed: `${preset.id}-seed`,
      canvas: true,
      audio: true,
      rects: true
    },
    modules: {
      ua: true,
      clientHints: true,
      locale: true,
      timezone: true,
      navigator: true,
      screen: true,
      webgl: true,
      canvas: true,
      audio: true,
      fonts: false,
      webrtc: true,
      runtimeInspector: false
    }
  }

  // 校验底层 profile-store 是否能正常创建
  const profile = createFingerprintProfile(profileInput)
  assert.ok(profile, `无法创建预设指纹: ${preset.name}`)

  // 在对应平台下校验 previewFingerprintProfile
  const hostPlatformMap = { Win32: 'win32', MacIntel: 'darwin', 'Linux x86_64': 'linux' }
  const targetPlatform = hostPlatformMap[preset.data.platform] || 'win32'
  const runtime = { platform: targetPlatform, chromiumVersion: '138.0.0.0' }
  const preview = previewFingerprintProfile(profile, runtime)
  assert.equal(preview.errors.length, 0, `预设 ${preset.name} 存在配置校验错误: ${preview.errors.join('; ')}`)
  assert.equal(preview.canSave, true, `预设 ${preset.name} 应该允许保存`)
}

console.log('创建环境下拉选择所有参数与指纹方案预设校验自检通过。')
