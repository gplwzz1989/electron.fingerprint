/**
 * WebGL / WebGPU 深度硬件拓扑参数字典与一致性核验引擎
 * 为商业指纹浏览器提供物理级显卡参数对齐（规避 CreepJS / PixelScan 深度显卡拓扑探测）
 */

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

module.exports = {
  GPU_HARDWARE_TOPOLOGY,
  RECOMMENDED_GPU_CONFIGS,
  getRecommendedGPUList,
  getGPUHardwareTopology,
  auditGPUProfileConsistency
}
