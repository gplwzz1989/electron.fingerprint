(function (root) {
  'use strict'
  // 此文件由 generate_fingerprint_engine.cjs 从现有实现导出，请修改源实现后重新生成。
  const DEFAULT_PROFILE = {
  "schemaVersion": 1,
  "id": "win11-cn-desktop",
  "enabled": true,
  "browser": {
    "family": "Chrome",
    "chromiumMajor": 138,
    "userAgent": null,
    "acceptLanguage": "zh-CN,zh;q=0.9"
  },
  "locale": {
    "language": "zh-CN",
    "languages": [
      "zh-CN",
      "zh"
    ],
    "timezone": "Asia/Shanghai"
  },
  "hardware": {
    "hardwareConcurrency": 8,
    "deviceMemory": 8,
    "platform": "Win32"
  },
  "screen": {
    "width": 1920,
    "height": 1080,
    "availWidth": 1920,
    "availHeight": 1040,
    "deviceScaleFactor": 1
  },
  "graphics": {
    "webglVendor": "Google Inc. (Intel)",
    "webglRenderer": "ANGLE (Intel, Intel(R) UHD Graphics, D3D11)"
  },
  "noise": {
    "seed": "win11-cn-desktop-stable",
    "canvas": false,
    "audio": false,
    "rects": false
  },
  "modules": {
    "ua": true,
    "clientHints": true,
    "locale": true,
    "timezone": true,
    "navigator": true,
    "screen": true,
    "webgl": true,
    "canvas": false,
    "audio": false,
    "fonts": false,
    "webrtc": false,
    "runtimeInspector": false
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


  const topology = (function () {
    /**
 * WebGL / WebGPU 深度硬件拓扑参数字典与一致性核验引擎
 * 为商业指纹浏览器提供物理级显卡参数对齐（规避 CreepJS / PixelScan 深度显卡拓扑探测）
 */

const crypto = root.crypto

const GPU_HARDWARE_TOPOLOGY = {
  'nvidia-rtx-modern': {
    family: 'NVIDIA RTX (Ampere / Ada Lovelace)',
    matcher: /RTX\s*(?:30\d\d|40\d\d)/i,
    maxTextureSize: 32768,
    maxCubeMapTextureSize: 32768,
    maxRenderbufferSize: 32768,
    maxViewportDims: [32768, 32768],
    maxVertexTextureImageUnits: 32,
    maxCombinedTextureImageUnits: 64,
    aliasedPointSizeRange: [1, 2047],
    aliasedLineWidthRange: [1, 1],
    shaderPrecision: {
      vertexHighFloat: { precision: 23, rangeMin: 127, rangeMax: 127 },
      fragmentHighFloat: { precision: 23, rangeMin: 127, rangeMax: 127 }
    },
    standardExtensions: [
      'ANGLE_instanced_arrays', 'EXT_blend_minmax', 'EXT_clip_control',
      'EXT_color_buffer_half_float', 'EXT_depth_clamp', 'EXT_float_blend',
      'EXT_frag_depth', 'EXT_polygon_offset_clamp', 'EXT_shader_texture_lod',
      'EXT_texture_compression_bptc', 'EXT_texture_compression_rgtc',
      'EXT_texture_filter_anisotropic', 'EXT_texture_mirror_clamp_to_edge',
      'KHR_parallel_shader_compile', 'OES_element_index_uint',
      'OES_fbo_render_mipmap', 'OES_standard_derivatives', 'OES_texture_float',
      'OES_texture_float_linear', 'OES_texture_half_float',
      'OES_texture_half_float_linear', 'OES_vertex_array_object',
      'WEBGL_color_buffer_float', 'WEBGL_compressed_texture_s3tc',
      'WEBGL_compressed_texture_s3tc_srgb', 'WEBGL_debug_renderer_info',
      'WEBGL_debug_shaders', 'WEBGL_depth_texture', 'WEBGL_draw_buffers',
      'WEBGL_lose_context', 'WEBGL_multi_draw'
    ]
  },
  'nvidia-gtx-classic': {
    family: 'NVIDIA GTX (Turing / Pascal)',
    matcher: /GTX\s*(?:10\d\d|16\d\d|20\d\d)/i,
    maxTextureSize: 32768,
    maxCubeMapTextureSize: 32768,
    maxRenderbufferSize: 32768,
    maxViewportDims: [32768, 32768],
    maxVertexTextureImageUnits: 32,
    maxCombinedTextureImageUnits: 64,
    aliasedPointSizeRange: [1, 2047],
    aliasedLineWidthRange: [1, 1],
    shaderPrecision: {
      vertexHighFloat: { precision: 23, rangeMin: 127, rangeMax: 127 },
      fragmentHighFloat: { precision: 23, rangeMin: 127, rangeMax: 127 }
    },
    standardExtensions: [
      'ANGLE_instanced_arrays', 'EXT_blend_minmax', 'EXT_color_buffer_half_float',
      'EXT_float_blend', 'EXT_frag_depth', 'EXT_shader_texture_lod',
      'EXT_texture_compression_bptc', 'EXT_texture_compression_rgtc',
      'EXT_texture_filter_anisotropic', 'KHR_parallel_shader_compile',
      'OES_element_index_uint', 'OES_standard_derivatives', 'OES_texture_float',
      'OES_texture_float_linear', 'OES_texture_half_float',
      'OES_vertex_array_object', 'WEBGL_compressed_texture_s3tc',
      'WEBGL_debug_renderer_info', 'WEBGL_depth_texture', 'WEBGL_lose_context'
    ]
  },
  'intel-integrated': {
    family: 'Intel HD / UHD / Iris Xe Graphics',
    matcher: /Intel.*(?:UHD|HD|Iris)/i,
    maxTextureSize: 16384,
    maxCubeMapTextureSize: 16384,
    maxRenderbufferSize: 16384,
    maxViewportDims: [16384, 16384],
    maxVertexTextureImageUnits: 16,
    maxCombinedTextureImageUnits: 32,
    aliasedPointSizeRange: [1, 1024],
    aliasedLineWidthRange: [1, 1],
    shaderPrecision: {
      vertexHighFloat: { precision: 23, rangeMin: 127, rangeMax: 127 },
      fragmentHighFloat: { precision: 23, rangeMin: 127, rangeMax: 127 }
    },
    standardExtensions: [
      'ANGLE_instanced_arrays', 'EXT_blend_minmax', 'EXT_color_buffer_half_float',
      'EXT_float_blend', 'EXT_frag_depth', 'EXT_shader_texture_lod',
      'EXT_texture_compression_rgtc', 'EXT_texture_filter_anisotropic',
      'KHR_parallel_shader_compile', 'OES_element_index_uint',
      'OES_standard_derivatives', 'OES_texture_float', 'OES_texture_float_linear',
      'OES_texture_half_float', 'OES_vertex_array_object',
      'WEBGL_compressed_texture_s3tc', 'WEBGL_debug_renderer_info',
      'WEBGL_depth_texture', 'WEBGL_lose_context'
    ]
  },
  'apple-silicon': {
    family: 'Apple Silicon (M1 / M2 / M3 / M4)',
    matcher: /Apple\s*M\d/i,
    maxTextureSize: 16384,
    maxCubeMapTextureSize: 16384,
    maxRenderbufferSize: 16384,
    maxViewportDims: [16384, 16384],
    maxVertexTextureImageUnits: 16,
    maxCombinedTextureImageUnits: 32,
    aliasedPointSizeRange: [1, 511],
    aliasedLineWidthRange: [1, 1],
    shaderPrecision: {
      vertexHighFloat: { precision: 23, rangeMin: 127, rangeMax: 127 },
      fragmentHighFloat: { precision: 23, rangeMin: 127, rangeMax: 127 }
    },
    standardExtensions: [
      'ANGLE_instanced_arrays', 'EXT_blend_minmax', 'EXT_clip_control',
      'EXT_color_buffer_half_float', 'EXT_depth_clamp', 'EXT_float_blend',
      'EXT_frag_depth', 'EXT_shader_texture_lod', 'EXT_texture_compression_bptc',
      'EXT_texture_filter_anisotropic', 'KHR_parallel_shader_compile',
      'OES_element_index_uint', 'OES_standard_derivatives', 'OES_texture_float',
      'OES_texture_float_linear', 'OES_texture_half_float', 'OES_vertex_array_object',
      'WEBGL_color_buffer_float', 'WEBGL_debug_renderer_info', 'WEBGL_depth_texture',
      'WEBGL_lose_context'
    ]
  },
  'amd-radeon-desktop': {
    family: 'AMD Radeon RX (RDNA2 / RDNA3)',
    matcher: /AMD|Radeon/i,
    maxTextureSize: 16384,
    maxCubeMapTextureSize: 16384,
    maxRenderbufferSize: 16384,
    maxViewportDims: [16384, 16384],
    maxVertexTextureImageUnits: 32,
    maxCombinedTextureImageUnits: 64,
    aliasedPointSizeRange: [1, 2047],
    aliasedLineWidthRange: [1, 1],
    shaderPrecision: {
      vertexHighFloat: { precision: 23, rangeMin: 127, rangeMax: 127 },
      fragmentHighFloat: { precision: 23, rangeMin: 127, rangeMax: 127 }
    },
    standardExtensions: [
      'ANGLE_instanced_arrays', 'EXT_blend_minmax', 'EXT_clip_control',
      'EXT_color_buffer_half_float', 'EXT_depth_clamp', 'EXT_float_blend',
      'EXT_frag_depth', 'EXT_shader_texture_lod', 'EXT_texture_compression_bptc',
      'EXT_texture_filter_anisotropic', 'KHR_parallel_shader_compile',
      'OES_element_index_uint', 'OES_standard_derivatives', 'OES_texture_float',
      'OES_texture_float_linear', 'OES_texture_half_float', 'OES_vertex_array_object',
      'WEBGL_compressed_texture_s3tc', 'WEBGL_debug_renderer_info', 'WEBGL_depth_texture',
      'WEBGL_lose_context'
    ]
  }
}

function getGPUHardwareTopology (rendererString) {
  if (!rendererString || typeof rendererString !== 'string') {
    return structuredClone(GPU_HARDWARE_TOPOLOGY['intel-integrated'])
  }
  for (const entry of Object.values(GPU_HARDWARE_TOPOLOGY)) {
    if (entry.matcher.test(rendererString)) {
      return structuredClone(entry)
    }
  }
  // 缺省自适应匹配
  if (/NVIDIA/i.test(rendererString)) {
    return structuredClone(GPU_HARDWARE_TOPOLOGY['nvidia-rtx-modern'])
  }
  if (/Apple/i.test(rendererString)) {
    return structuredClone(GPU_HARDWARE_TOPOLOGY['apple-silicon'])
  }
  if (/AMD|Radeon/i.test(rendererString)) {
    return structuredClone(GPU_HARDWARE_TOPOLOGY['amd-radeon-desktop'])
  }
  return structuredClone(GPU_HARDWARE_TOPOLOGY['intel-integrated'])
}

const RECOMMENDED_GPU_CONFIGS = {
  Win32: [
    {
      label: 'NVIDIA GeForce RTX 3060 (推荐桌面主流)',
      vendor: 'Google Inc. (NVIDIA)',
      renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)'
    },
    {
      label: 'NVIDIA GeForce RTX 4070 (高端电竞)',
      vendor: 'Google Inc. (NVIDIA)',
      renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)'
    },
    {
      label: 'Intel UHD Graphics 770 (办公核显)',
      vendor: 'Google Inc. (Intel)',
      renderer: 'ANGLE (Intel, Intel(R) UHD Graphics 770 Direct3D11 vs_5_0 ps_5_0, D3D11)'
    }
  ],
  MacIntel: [
    {
      label: 'Apple M2 Metal (macOS 现代配置)',
      vendor: 'Google Inc. (Apple)',
      renderer: 'ANGLE (Apple, Apple M2, OpenGL 4.1 Metal - 88)'
    },
    {
      label: 'Apple M3 Pro Metal',
      vendor: 'Google Inc. (Apple)',
      renderer: 'ANGLE (Apple, Apple M3 Pro, OpenGL 4.1 Metal - 89)'
    },
    {
      label: 'Intel Iris Plus Graphics (macOS Intel 兼容)',
      vendor: 'Google Inc. (Intel Inc.)',
      renderer: 'ANGLE (Intel Inc., Intel Iris Plus Graphics OpenGL Engine, OpenGL 4.1)'
    }
  ],
  'Linux x86_64': [
    {
      label: 'Mesa Intel UHD Graphics (Linux 主流)',
      vendor: 'Google Inc. (Intel Open Source Technology Center)',
      renderer: 'ANGLE (Intel Open Source Technology Center, Mesa Intel(R) UHD Graphics 620 (KBL GT2), OpenGL 4.6)'
    },
    {
      label: 'NVIDIA GeForce GTX 1660 SUPER (Linux 独立显卡)',
      vendor: 'Google Inc. (NVIDIA Corporation)',
      renderer: 'ANGLE (NVIDIA Corporation, NVIDIA GeForce GTX 1660 SUPER/PCIe/SSE2, OpenGL 4.5.0)'
    }
  ]
}

function getRecommendedGPUList (platform = 'Win32') {
  return RECOMMENDED_GPU_CONFIGS[platform] || RECOMMENDED_GPU_CONFIGS.Win32
}

function auditGPUProfileConsistency (fingerprint, options = {}) {
  const issues = []
  if (!fingerprint || !fingerprint.enabled || !fingerprint.modules?.webgl) {
    return { consistent: true, issues }
  }

  const { hardware, graphics, screen, modules } = fingerprint
  const renderer = graphics?.webglRenderer || ''
  const vendor = graphics?.webglVendor || ''
  const runtimePlatform = options.runtime?.platform || options.platform
  const hostPlatform = { win32: 'Win32', darwin: 'MacIntel', linux: 'Linux x86_64' }[runtimePlatform] || 'Win32'
  // 若 navigator 模块未开启，网页读取的是宿主真实平台；若已开启，读取的是 hardware.platform
  const platform = (modules?.navigator !== false) ? (hardware?.platform || hostPlatform) : hostPlatform

  // 1. 跨平台后端与厂商一致性
  if (/D3D|Direct3D/i.test(renderer) && platform !== 'Win32') {
    issues.push({
      field: 'graphics.webglRenderer',
      severity: 'error',
      message: `Direct3D (D3D) 是 Windows 平台专有图形后端，不可在 ${platform} 平台上声明。`
    })
  }

  if (/Apple|Metal/i.test(renderer) && platform !== 'MacIntel') {
    issues.push({
      field: 'graphics.webglRenderer',
      severity: 'error',
      message: `Apple Metal 渲染器仅适用于 macOS 平台，不可在 ${platform} 平台上声明。`
    })
  }

  // 移动端 GPU 拦截 (Adreno / Mali / PowerVR 不能出现在桌面平台)
  if (/Adreno|Mali|PowerVR/i.test(renderer)) {
    issues.push({
      field: 'graphics.webglRenderer',
      severity: 'error',
      message: '移动端 GPU 架构 (Adreno/Mali/PowerVR) 不支持在桌面端系统上声明。'
    })
  }

  if (/NVIDIA/i.test(renderer) && !/NVIDIA/i.test(vendor)) {
    issues.push({
      field: 'graphics.webglVendor',
      severity: 'warning',
      message: '渲染器声明为 NVIDIA 显卡，但厂商未声明为 Google Inc. (NVIDIA)。'
    })
  }

  if (/Intel/i.test(renderer) && !/Intel/i.test(vendor)) {
    issues.push({
      field: 'graphics.webglVendor',
      severity: 'warning',
      message: '渲染器声明为 Intel 显卡，但厂商未声明为 Google Inc. (Intel)。'
    })
  }

  // 2. 硬件拓扑与屏幕物理极限
  const topology = getGPUHardwareTopology(renderer)
  if (screen?.width > topology.maxTextureSize || screen?.height > topology.maxTextureSize) {
    issues.push({
      field: 'screen.width',
      severity: 'error',
      message: `屏幕分辨率 (${screen.width}×${screen.height}) 超出了该显卡支持的最大纹理/视口尺寸 (${topology.maxTextureSize})。`
    })
  }

  // 3. 硬件核心数合理性分析
  if (hardware?.concurrency) {
    if (hardware.concurrency < 2 || hardware.concurrency > 64) {
      issues.push({
        field: 'hardware.concurrency',
        severity: 'warning',
        message: `逻辑核心数 (${hardware.concurrency}) 偏离主流桌面常见硬件规格 (2-64)。`
      })
    }
    if (/Apple\s*M/i.test(renderer) && ![8, 10, 11, 12, 14, 16, 18, 24, 30, 36, 40].includes(hardware.concurrency)) {
      issues.push({
        field: 'hardware.concurrency',
        severity: 'warning',
        message: `Apple Silicon 芯片的 CPU 逻辑核心数通常为 8/10/12/16/24 等，当前配置 (${hardware.concurrency}) 可能存在特征异常。`
      })
    }
  }

  return {
    consistent: issues.filter(item => item.severity === 'error').length === 0,
    issues,
    topology
  }
}

const HARDWARE_TOPOLOGY_POOLS = {
  Win32: [
    {
      vendor: 'Google Inc. (NVIDIA)',
      renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)',
      cpus: [16, 24, 32],
      screens: [
        { width: 2560, height: 1440, availWidth: 2560, availHeight: 1400, deviceScaleFactor: 1.25 },
        { width: 1920, height: 1080, availWidth: 1920, availHeight: 1040, deviceScaleFactor: 1 },
        { width: 3840, height: 2160, availWidth: 3840, availHeight: 2110, deviceScaleFactor: 1.5 }
      ]
    },
    {
      vendor: 'Google Inc. (NVIDIA)',
      renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
      cpus: [12, 16],
      screens: [
        { width: 1920, height: 1080, availWidth: 1920, availHeight: 1040, deviceScaleFactor: 1 },
        { width: 2560, height: 1440, availWidth: 2560, availHeight: 1400, deviceScaleFactor: 1.25 }
      ]
    },
    {
      vendor: 'Google Inc. (NVIDIA)',
      renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
      cpus: [8, 12, 16],
      screens: [
        { width: 1920, height: 1080, availWidth: 1920, availHeight: 1040, deviceScaleFactor: 1 }
      ]
    },
    {
      vendor: 'Google Inc. (Intel)',
      renderer: 'ANGLE (Intel, Intel(R) UHD Graphics 770 Direct3D11 vs_5_0 ps_5_0, D3D11)',
      cpus: [8, 12, 16],
      screens: [
        { width: 1920, height: 1080, availWidth: 1920, availHeight: 1040, deviceScaleFactor: 1 },
        { width: 1536, height: 864, availWidth: 1536, availHeight: 824, deviceScaleFactor: 1.25 }
      ]
    },
    {
      vendor: 'Google Inc. (Intel)',
      renderer: 'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
      cpus: [8, 12],
      screens: [
        { width: 1920, height: 1080, availWidth: 1920, availHeight: 1040, deviceScaleFactor: 1.25 }
      ]
    }
  ],
  MacIntel: [
    {
      vendor: 'Google Inc. (Apple)',
      renderer: 'ANGLE (Apple, Apple M2, OpenGL 4.1 Metal - 88)',
      cpus: [8],
      screens: [
        { width: 1440, height: 900, availWidth: 1440, availHeight: 870, deviceScaleFactor: 2 },
        { width: 2560, height: 1600, availWidth: 2560, availHeight: 1570, deviceScaleFactor: 2 }
      ]
    },
    {
      vendor: 'Google Inc. (Apple)',
      renderer: 'ANGLE (Apple, Apple M3 Pro, OpenGL 4.1 Metal - 89)',
      cpus: [11, 12, 14],
      screens: [
        { width: 1512, height: 982, availWidth: 1512, availHeight: 952, deviceScaleFactor: 2 }
      ]
    },
    {
      vendor: 'Google Inc. (Intel Inc.)',
      renderer: 'ANGLE (Intel Inc., Intel Iris Plus Graphics OpenGL Engine, OpenGL 4.1)',
      cpus: [4, 8],
      screens: [
        { width: 1440, height: 900, availWidth: 1440, availHeight: 870, deviceScaleFactor: 2 }
      ]
    }
  ],
  'Linux x86_64': [
    {
      vendor: 'Google Inc. (Intel Open Source Technology Center)',
      renderer: 'ANGLE (Intel Open Source Technology Center, Mesa Intel(R) UHD Graphics 620 (KBL GT2), OpenGL 4.6)',
      cpus: [4, 8],
      screens: [
        { width: 1920, height: 1080, availWidth: 1920, availHeight: 1040, deviceScaleFactor: 1 }
      ]
    },
    {
      vendor: 'Google Inc. (NVIDIA Corporation)',
      renderer: 'ANGLE (NVIDIA Corporation, NVIDIA GeForce GTX 1660 SUPER/PCIe/SSE2, OpenGL 4.5.0)',
      cpus: [8, 12],
      screens: [
        { width: 1920, height: 1080, availWidth: 1920, availHeight: 1040, deviceScaleFactor: 1 }
      ]
    }
  ]
}

/**
 * 随机生成一套物理级绝对自洽的真实硬件参数组合
 * @param {object} [options]
 * @param {'Win32'|'MacIntel'|'Linux x86_64'} [options.platform='Win32'] 目标操作系统平台
 * @returns {Promise<object>} 服务端生成的自洽硬件配置包 (hardware, graphics, screen, noise)
 */
async function generateRandomHardwareProfile (options = {}) {
  const sessionResponse = await fetch('/api/auth/me', { credentials: 'same-origin' })
  const session = await sessionResponse.json()
  if (!sessionResponse.ok || !session.ok) throw new Error('请先登录工作空间再生成指纹。')
  const response = await fetch('/api/fingerprint-generate', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': session.csrf }, body: JSON.stringify({ platform: options.platform || 'Win32' }), signal: AbortSignal.timeout(30000) })
  const data = await response.json()
  if (!response.ok || !data.ok) throw new Error(data.message || '云端指纹生成失败，请稍后重试。')
  return data.parameters
}

return {
  GPU_HARDWARE_TOPOLOGY,
  RECOMMENDED_GPU_CONFIGS,
  HARDWARE_TOPOLOGY_POOLS,
  getRecommendedGPUList,
  getGPUHardwareTopology,
  auditGPUProfileConsistency,
  generateRandomHardwareProfile
}

  })()
  root.QijieFingerprintEngine = {
    createFingerprintProfile,
    validateFingerprintProfile,
    getDefaultProfile: () => clone(DEFAULT_PROFILE),
    ...topology
  }
})(window)
