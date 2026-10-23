const { createFingerprintProfile, ProfileValidationError } = require('./profile-store')
const { describeFingerprintProtection } = require('./fingerprint-protection')
const { chromeVersionFromUserAgent, auditTLSVersionConsistency } = require('./tls-fingerprint')
const { auditGPUProfileConsistency } = require('./webgl-topology')

function previewFingerprintProfile (input, runtime, proxy, options = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ProfileValidationError('指纹配置必须是对象。')
  const rawFingerprint = Object.hasOwn(input, 'fingerprint') ? input.fingerprint : input
  const tlsFingerprint = Object.hasOwn(input, 'tlsFingerprint')
    ? input.tlsFingerprint
    : (options.tlsFingerprint || rawFingerprint.tlsFingerprint)
  const cleanFingerprint = { ...rawFingerprint }
  delete cleanFingerprint.tlsFingerprint
  const fingerprint = createFingerprintProfile(cleanFingerprint)
  const changes = input.hardware?.deviceMemory === 16
    ? [{ field: 'hardware.deviceMemory', before: 16, after: 8, message: '网页可见内存将从 16 GiB 调整为 8 GiB；物理内存和登录数据不会改变。' }]
    : []
  const errors = []
  const warnings = describeFingerprintProtection(fingerprint, proxy).warnings
  const { browser, locale, hardware, graphics, modules } = fingerprint
  const hostPlatform = { win32: 'Win32', darwin: 'MacIntel', linux: 'Linux x86_64' }[runtime.platform]
  const allowCrossVersion = Boolean(
    options.allowCrossVersion ||
    tlsFingerprint?.emulationMode === 'cross-version' ||
    options.mode === 'cross-version'
  )

  if (fingerprint.enabled) {
    const runtimeMajor = Number(runtime.chromiumVersion?.split('.')[0])
    if ((modules.ua || modules.clientHints)) {
      if (!allowCrossVersion && browser.chromiumMajor !== runtimeMajor) {
        errors.push('配置的浏览器主版本与当前运行时不一致，请使用匹配的运行时。')
      } else if (allowCrossVersion) {
        if (!browser.chromiumMajor || browser.chromiumMajor < 100 || browser.chromiumMajor > 200) {
          errors.push('跨版本仿真需要指定合法的 Chrome 大版本 (100-200)。')
        }
      }
    }
    if ((modules.navigator || modules.fonts) && hardware.platform !== hostPlatform) {
      errors.push('操作系统平台与本机不一致；当前仅支持与真实宿主相容的桌面配置。')
    }
    if (modules.ua && browser.userAgent) {
      const version = chromeVersionFromUserAgent(browser.userAgent)
      const targetMajor = version ? Number(version.split('.')[0]) : null
      if (!version) {
        errors.push('用户代理格式无效，无法识别 Chrome 版本。')
      } else if (!allowCrossVersion) {
        if (targetMajor !== browser.chromiumMajor) {
          errors.push('用户代理必须包含与当前内核一致的 Chrome 主版本。')
        } else if (version !== `${browser.chromiumMajor}.0.0.0` && version !== runtime.chromiumVersion) {
          errors.push('用户代理完整版本与 TLS 内核不一致；请使用内核默认值、原生缩减版本或真实完整版本。')
        }
      } else if (allowCrossVersion) {
        if (!targetMajor || targetMajor < 100 || targetMajor > 200) {
          errors.push('跨版本仿真需要指定合法的 Chrome 目标版本 (100-200)。')
        } else {
          const audit = auditTLSVersionConsistency(
            fingerprint,
            tlsFingerprint,
            { runtimeVersion: runtime.chromiumVersion }
          )
          if (!audit.consistent) {
            errors.push(`跨版本 TLS 策略不自洽：${audit.reason}`)
          } else if (targetMajor !== runtimeMajor) {
            warnings.push(`已启用 Chrome ${targetMajor} 跨版本 TLS 仿真；ClientHello 特征已对齐目标版本。`)
          }
        }
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
      const gpuAudit = auditGPUProfileConsistency(fingerprint, { runtime })
      for (const issue of gpuAudit.issues) {
        if (issue.severity === 'error') {
          if (!errors.includes(issue.message)) {
            errors.push(issue.message)
          }
        } else if (issue.severity === 'warning') {
          if (!warnings.includes(issue.message)) {
            warnings.push(issue.message)
          }
        }
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
