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
  return structuredClone(GPU_HARDWARE_TOPOLOGY['intel-integrated'])
}

function auditGPUProfileConsistency (fingerprint, options = {}) {
  const issues = []
  if (!fingerprint || !fingerprint.enabled || !fingerprint.modules?.webgl) {
    return { consistent: true, issues }
  }

  const { hardware, graphics, screen } = fingerprint
  const renderer = graphics?.webglRenderer || ''
  const vendor = graphics?.webglVendor || ''
  const platform = hardware?.platform || 'Win32'

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

  return {
    consistent: issues.filter(item => item.severity === 'error').length === 0,
    issues,
    topology
  }
}

module.exports = {
  GPU_HARDWARE_TOPOLOGY,
  getGPUHardwareTopology,
  auditGPUProfileConsistency
}
