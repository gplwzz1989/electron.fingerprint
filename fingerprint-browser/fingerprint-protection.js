function describeFingerprintProtection (fingerprint, proxy = {}) {
  const active = fingerprint.enabled === true
  const { modules, noise, graphics } = fingerprint
  const capabilities = [
    ['画布读回保护', active && modules.canvas && noise.canvas],
    ['音频读回保护', active && modules.audio && noise.audio],
    ['元素几何保护', active && noise.rects],
    ['字体平台过滤', active && modules.fonts],
    ['非代理 UDP 限制', active && modules.webrtc],
    ['WebGPU 适配器访问限制', active && modules.webgl],
    ['WebGL 像素保护（部分格式）', active && modules.webgl && modules.canvas && noise.canvas && Boolean(graphics.webglVendor && graphics.webglRenderer)]
  ]
  const warnings = []
  for (const [key, label] of [['canvas', '画布'], ['audio', '音频']]) {
    if (active && noise[key] && !modules[key]) warnings.push(`${label}噪声已勾选，但对应模块关闭，保护不会生效。`)
  }
  if (proxy.mode && proxy.mode !== 'direct' && !(active && modules.webrtc)) warnings.push('代理环境未开启非代理 UDP 限制，需检查实时通信泄漏。')
  const uaMajor = fingerprint.browser.userAgent?.match(/Chrome\/(\d+)\./)?.[1]
  if (active && modules.ua && uaMajor && Number(uaMajor) !== fingerprint.browser.chromiumMajor) warnings.push('用户代理版本与配置的内核主版本不一致。')
  if (active && modules.locale && Intl.getCanonicalLocales(fingerprint.locale.languages[0])[0] !== Intl.getCanonicalLocales(fingerprint.locale.language)[0]) warnings.push('主要语言与语言列表首项不一致。')
  return {
    configured: capabilities.filter(([, enabled]) => enabled).map(([label]) => label),
    inactive: capabilities.filter(([, enabled]) => !enabled).map(([label]) => label),
    warnings,
    verification: '以上范围按配置判断，尚需验证网页实际结果；不代表已防止跨站关联。'
  }
}

module.exports = { describeFingerprintProtection }
