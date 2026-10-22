const { createFingerprintProfile, ProfileValidationError } = require('./profile-store')
const { describeFingerprintProtection } = require('./fingerprint-protection')

function previewFingerprintProfile (input, runtime, proxy) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ProfileValidationError('指纹配置必须是对象。')
  const fingerprint = createFingerprintProfile(input)
  const changes = input.hardware?.deviceMemory === 16
    ? [{ field: 'hardware.deviceMemory', before: 16, after: 8, message: '网页可见内存将从 16 GiB 调整为 8 GiB；物理内存和登录数据不会改变。' }]
    : []
  const errors = []
  const warnings = describeFingerprintProtection(fingerprint, proxy).warnings
  const { browser, locale, hardware, graphics, modules } = fingerprint
  const hostPlatform = { win32: 'Win32', darwin: 'MacIntel', linux: 'Linux x86_64' }[runtime.platform]
  if (fingerprint.enabled) {
    if ((modules.ua || modules.clientHints) && browser.chromiumMajor !== Number(runtime.chromiumVersion?.split('.')[0])) {
      errors.push('配置的浏览器主版本与当前运行时不一致，请使用匹配的运行时。')
    }
    if ((modules.navigator || modules.fonts) && hardware.platform !== hostPlatform) {
      errors.push('操作系统平台与本机不一致；当前仅支持与真实宿主相容的桌面配置。')
    }
    if (modules.ua && browser.userAgent) {
      const version = browser.userAgent.match(/\bChrome\/(\d+\.\d+\.\d+\.\d+)\b/)?.[1]
      if (!version || Number(version.split('.')[0]) !== browser.chromiumMajor) {
        errors.push('用户代理必须包含与当前内核一致的 Chrome 主版本。')
      } else if (version !== `${browser.chromiumMajor}.0.0.0` && version !== runtime.chromiumVersion) {
        errors.push('用户代理完整版本与 TLS 内核不一致；请使用内核默认值、原生缩减版本或真实完整版本。')
      }
      const uaPlatform = /Windows NT/.test(browser.userAgent) ? 'Win32'
        : /Macintosh/.test(browser.userAgent) ? 'MacIntel'
          : /Linux/.test(browser.userAgent) && !/Android/.test(browser.userAgent) ? 'Linux x86_64' : null
      if (modules.clientHints && (uaPlatform !== hostPlatform || /Android|Mobile|iPhone|iPad/.test(browser.userAgent))) {
        errors.push('用户代理系统与真实桌面宿主的客户端提示不一致，请使用本机桌面用户代理。')
      }
      if (modules.navigator && uaPlatform && uaPlatform !== hardware.platform) {
        errors.push('用户代理系统与设备平台不一致。')
      }
    }
    if (modules.locale) {
      const canonical = value => Intl.getCanonicalLocales(value)[0]
      const language = canonical(locale.language)
      if (canonical(locale.languages[0]) !== language) errors.push('主要语言必须与语言列表首项一致。')
      let preferred
      let highestQuality = -1
      try {
        for (const entry of browser.acceptLanguage.split(',')) {
          const match = entry.trim().match(/^([a-zA-Z0-9-]+)(?:\s*;\s*q=(0(?:\.\d{1,3})?|1(?:\.0{1,3})?))?$/)
          if (!match) throw new Error()
          const tag = canonical(match[1])
          const quality = match[2] === undefined ? 1 : Number(match[2])
          if (quality > 0 && quality > highestQuality) {
            preferred = tag
            highestQuality = quality
          }
        }
        if (!preferred) throw new Error()
        if (preferred !== language) errors.push('请求语言中优先级最高的语言必须与主要语言一致。')
      } catch {
        errors.push('请求语言格式无效，请使用有效语言标记及 0 到 1 的权重，例如 zh-CN,zh;q=0.9。')
      }
    }
    if (modules.webgl) {
      if (/Apple|Metal/i.test(graphics.webglRenderer) && runtime.platform !== 'darwin') {
        errors.push('非 macOS 宿主不支持 Apple 图形渲染器，请使用与本机操作系统相容的显卡参数。')
      }
      if (/D3D|Direct3D/i.test(graphics.webglRenderer) && runtime.platform !== 'win32') {
        errors.push('当前宿主不支持 Windows 图形后端，请使用本机图形参数。')
      }
    }
  }
  return {
    fingerprint,
    changes,
    errors,
    warnings: warnings.filter(message => !errors.includes(message)),
    canSave: errors.length === 0,
    verification: '这里只检查配置组合；图形能力、字体渲染和防关联效果仍需实际验证。'
  }
}

function assertFingerprintSave (input, runtime, proxy) {
  const preview = previewFingerprintProfile(input, runtime, proxy)
  if (!preview.canSave) throw new ProfileValidationError(preview.errors.join(''))
  // 保存接口不静默调整提交值；界面预览确认后提交调整后的配置。
  if (preview.changes.length) throw new ProfileValidationError('请先预览并确认网页可见内存调整，再提交调整后的配置。')
  return preview.fingerprint
}

module.exports = { previewFingerprintProfile, assertFingerprintSave }
