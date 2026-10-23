const { isDeepStrictEqual } = require('node:util')
const { ProfileValidationError, createTLSFingerprintConfig } = require('./profile-store')

const environmentPolicies = new WeakMap()

const CHROME_TLS_VERSION_PRESETS = {
  120: {
    targetMajor: 120,
    targetVersion: '120.0.6099.109',
    description: 'Chrome 120 (传统 TLS 1.3 曲线, 无后量子, ALPS 17513, 禁用 ECH)',
    postQuantumKeyAgreementEnabled: false,
    supportedGroups: [29, 23, 24],
    alpsCodepoint: 17513,
    permuteExtensions: true,
    echEnabled: false,
    cipherSuites: [0xc02b, 0xc02f, 0xc02c, 0xc030, 0xcca9, 0xcca8, 0xc013, 0xc014, 0x009c, 0x009d, 0x002f, 0x0035],
    signatureAlgorithms: [0x0403, 0x0804, 0x0401, 0x0503, 0x0805, 0x0501, 0x0806, 0x0601]
  },
  124: {
    targetMajor: 124,
    targetVersion: '124.0.6367.207',
    description: 'Chrome 124 (草案后量子 Kyber-768, ALPS 17513)',
    postQuantumKeyAgreementEnabled: true,
    supportedGroups: [25497, 29, 23, 24],
    alpsCodepoint: 17513,
    permuteExtensions: true,
    echEnabled: true,
    cipherSuites: [0xc02b, 0xc02f, 0xc02c, 0xc030, 0xcca9, 0xcca8, 0xc013, 0xc014, 0x009c, 0x009d, 0x002f, 0x0035],
    signatureAlgorithms: [0x0403, 0x0804, 0x0401, 0x0503, 0x0805, 0x0501, 0x0806, 0x0601]
  },
  126: {
    targetMajor: 126,
    targetVersion: '126.0.6478.127',
    description: 'Chrome 126 (草案后量子 Kyber-768, ALPS 17513)',
    postQuantumKeyAgreementEnabled: true,
    supportedGroups: [25497, 29, 23, 24],
    alpsCodepoint: 17513,
    permuteExtensions: true,
    echEnabled: true,
    cipherSuites: [0xc02b, 0xc02f, 0xc02c, 0xc030, 0xcca9, 0xcca8, 0xc013, 0xc014, 0x009c, 0x009d, 0x002f, 0x0035],
    signatureAlgorithms: [0x0403, 0x0804, 0x0401, 0x0503, 0x0805, 0x0501, 0x0806, 0x0601]
  },
  128: {
    targetMajor: 128,
    targetVersion: '128.0.6613.137',
    description: 'Chrome 128 (过渡期 Kyber-768, ALPS 17513)',
    postQuantumKeyAgreementEnabled: true,
    supportedGroups: [25497, 29, 23, 24],
    alpsCodepoint: 17513,
    permuteExtensions: true,
    echEnabled: true,
    cipherSuites: [0xc02b, 0xc02f, 0xc02c, 0xc030, 0xcca9, 0xcca8, 0xc013, 0xc014, 0x009c, 0x009d, 0x002f, 0x0035],
    signatureAlgorithms: [0x0403, 0x0804, 0x0401, 0x0503, 0x0805, 0x0501, 0x0806, 0x0601]
  },
  130: {
    targetMajor: 130,
    targetVersion: '130.0.6723.116',
    description: 'Chrome 130 (过渡期后量子协商, ALPS 17513)',
    postQuantumKeyAgreementEnabled: true,
    supportedGroups: [25497, 29, 23, 24],
    alpsCodepoint: 17513,
    permuteExtensions: true,
    echEnabled: true,
    cipherSuites: [0xc02b, 0xc02f, 0xc02c, 0xc030, 0xcca9, 0xcca8, 0xc013, 0xc014, 0x009c, 0x009d, 0x002f, 0x0035],
    signatureAlgorithms: [0x0403, 0x0804, 0x0401, 0x0503, 0x0805, 0x0501, 0x0806, 0x0601]
  },
  138: {
    targetMajor: 138,
    targetVersion: '138.0.7204.185',
    description: 'Chrome 138 (正式标准 ML-KEM-768, 新版 ALPS 17613, ECH)',
    postQuantumKeyAgreementEnabled: true,
    supportedGroups: [4588, 29, 23, 24],
    alpsCodepoint: 17613,
    permuteExtensions: true,
    echEnabled: true,
    cipherSuites: [0xc02b, 0xc02f, 0xc02c, 0xc030, 0xcca9, 0xcca8, 0xc013, 0xc014, 0x009c, 0x009d, 0x002f, 0x0035],
    signatureAlgorithms: [0x0403, 0x0804, 0x0401, 0x0503, 0x0805, 0x0501, 0x0806, 0x0601]
  }
}

function getTLSVersionPreset (majorOrVersion) {
  let major
  if (typeof majorOrVersion === 'number') {
    major = majorOrVersion
  } else if (typeof majorOrVersion === 'string') {
    const match = majorOrVersion.match(/^(\d+)/)
    if (match) major = Number(match[1])
  }
  if (!major || !Number.isInteger(major)) return null
  if (CHROME_TLS_VERSION_PRESETS[major]) {
    return structuredClone(CHROME_TLS_VERSION_PRESETS[major])
  }
  if (major < 124) {
    const preset = structuredClone(CHROME_TLS_VERSION_PRESETS[120])
    preset.targetMajor = major
    preset.targetVersion = `${major}.0.0.0`
    return preset
  } else if (major <= 130) {
    const preset = structuredClone(CHROME_TLS_VERSION_PRESETS[126])
    preset.targetMajor = major
    preset.targetVersion = `${major}.0.0.0`
    return preset
  } else {
    const preset = structuredClone(CHROME_TLS_VERSION_PRESETS[138])
    preset.targetMajor = major
    preset.targetVersion = `${major}.0.0.0`
    return preset
  }
}

function resolveTLSConfigForBrowser (target, options = {}) {
  const runtimeVersion = options.runtimeVersion || process.versions.chrome || '138.0.7204.185'
  let targetVersion
  let targetMajor
  if (typeof target === 'number') {
    targetMajor = target
    targetVersion = `${target}.0.0.0`
  } else if (typeof target === 'string') {
    const extracted = chromeVersionFromUserAgent(target)
    if (extracted) {
      targetVersion = extracted
      targetMajor = Number(extracted.split('.')[0])
    } else {
      targetVersion = target
      targetMajor = Number(target.split('.')[0])
    }
  } else if (target && typeof target === 'object') {
    if (target.version) {
      targetVersion = target.version
      targetMajor = Number(target.version.split('.')[0])
    } else if (target.browser?.userAgent) {
      targetVersion = chromeVersionFromUserAgent(target.browser.userAgent)
      targetMajor = targetVersion ? Number(targetVersion.split('.')[0]) : target.browser?.chromiumMajor
    } else if (target.chromiumMajor) {
      targetMajor = target.chromiumMajor
      targetVersion = `${targetMajor}.0.0.0`
    }
  }
  if (!targetMajor) targetMajor = 138
  const preset = getTLSVersionPreset(targetMajor)
  if (!preset) throw new ProfileValidationError(`不支持模拟该 Chrome 版本 (${targetMajor}) 的 TLS 指纹。`)

  const emulationMode = targetMajor === 138 ? 'native' : 'cross-version'
  return createTLSFingerprintConfig({
    chromiumVersion: runtimeVersion,
    targetMajor,
    targetVersion: targetVersion || preset.targetVersion,
    emulationMode,
    postQuantumKeyAgreementEnabled: preset.postQuantumKeyAgreementEnabled,
    supportedGroups: [...preset.supportedGroups],
    alpsCodepoint: preset.alpsCodepoint,
    permuteExtensions: preset.permuteExtensions,
    echEnabled: preset.echEnabled,
    cipherSuites: [...preset.cipherSuites],
    signatureAlgorithms: [...preset.signatureAlgorithms]
  })
}

function auditTLSVersionConsistency (fingerprint, policy, options = {}) {
  const runtimeVersion = options.runtimeVersion || process.versions.chrome || '138.0.7204.185'
  const runtimeMajor = Number(runtimeVersion.split('.')[0]) || 138

  if (!fingerprint || !fingerprint.enabled) return { consistent: true, mode: 'disabled' }
  const uaVersion = fingerprint.modules?.ua && fingerprint.browser?.userAgent
    ? chromeVersionFromUserAgent(fingerprint.browser.userAgent)
    : null
  const uaMajor = uaVersion ? Number(uaVersion.split('.')[0]) : null
  const declaredMajor = uaMajor || fingerprint.browser?.chromiumMajor || runtimeMajor

  if (!policy) {
    if (declaredMajor !== runtimeMajor) {
      return {
        consistent: false,
        reason: `用户代理主版本为 Chrome ${declaredMajor}，但未配置对应的 TLS 跨版本模拟策略，底层网络将暴露 Chrome ${runtimeMajor} 的 TLS 特征。`,
        suggestedPolicy: resolveTLSConfigForBrowser(declaredMajor, { runtimeVersion })
      }
    }
    return { consistent: true, mode: 'native' }
  }

  const policyTargetMajor = policy.targetMajor || (policy.targetVersion ? Number(policy.targetVersion.split('.')[0]) : null)

  if (declaredMajor < 124) {
    if (policy.postQuantumKeyAgreementEnabled !== false) {
      return {
        consistent: false,
        reason: `用户代理为 Chrome ${declaredMajor}，但 TLS 策略启用了后量子协商 (Chrome ${declaredMajor} 不支持后量子协商)。`,
        suggestedPolicy: resolveTLSConfigForBrowser(declaredMajor, { runtimeVersion })
      }
    }
    if (policy.supportedGroups?.some(g => g === 4588 || g === 25497)) {
      return {
        consistent: false,
        reason: `用户代理为 Chrome ${declaredMajor}，但 TLS 曲线组包含了后量子算法标识。`,
        suggestedPolicy: resolveTLSConfigForBrowser(declaredMajor, { runtimeVersion })
      }
    }
    if (policy.alpsCodepoint === 17613) {
      return {
        consistent: false,
        reason: `用户代理为 Chrome ${declaredMajor}，但使用了 Chrome 131+ 才引入的新版 ALPS 码点 17613。`,
        suggestedPolicy: resolveTLSConfigForBrowser(declaredMajor, { runtimeVersion })
      }
    }
  } else if (declaredMajor <= 130) {
    if (policy.supportedGroups?.includes(4588)) {
      return {
        consistent: false,
        reason: `用户代理为 Chrome ${declaredMajor}，但 TLS 曲线组包含了 Chrome 131+ 的 ML-KEM-768 (4588)。`,
        suggestedPolicy: resolveTLSConfigForBrowser(declaredMajor, { runtimeVersion })
      }
    }
    if (policy.alpsCodepoint === 17613) {
      return {
        consistent: false,
        reason: `用户代理为 Chrome ${declaredMajor}，但使用了新版 ALPS 码点 17613 (该版本应为 17513)。`,
        suggestedPolicy: resolveTLSConfigForBrowser(declaredMajor, { runtimeVersion })
      }
    }
  }

  return {
    consistent: true,
    mode: policy.emulationMode || (declaredMajor === runtimeMajor ? 'native' : 'cross-version'),
    targetMajor: policyTargetMajor || declaredMajor
  }
}

function chromeVersionFromUserAgent (userAgent) {
  if (typeof userAgent !== 'string') return undefined
  const start = userAgent.indexOf('Chrome/')
  if (start < 0 || (start > 0 && userAgent[start - 1] !== ' ') || userAgent.indexOf('Chrome/', start + 7) !== -1) return undefined
  const version = userAgent.slice(start + 7).match(/^[0-9.]+/)?.[0]
  if (!version) return undefined
  const end = start + 7 + version.length
  if (end < userAgent.length && userAgent[end] !== ' ' && userAgent[end] !== ')') return undefined
  return version
}

function assertTLSFingerprintRuntimeVersion (policy, chromiumVersion = process.versions.chrome, message = 'TLS 策略与当前内核版本不一致，请使用匹配的运行时。') {
  const normalized = createTLSFingerprintConfig(policy)
  if (normalized && normalized.chromiumVersion !== chromiumVersion) throw new ProfileValidationError(message)
  return normalized
}

function assertTLSRuntimeIdentity (fingerprint, chromiumVersion, options = {}) {
  if (!fingerprint.enabled || !(fingerprint.modules.ua || fingerprint.modules.clientHints)) return
  const major = Number(chromiumVersion?.split('.')[0])
  const allowCrossVersion = Boolean(
    options.allowCrossVersion ||
    fingerprint.tlsFingerprint?.emulationMode === 'cross-version' ||
    options.mode === 'cross-version'
  )

  if (!allowCrossVersion) {
    if (major !== 138 || fingerprint.browser.chromiumMajor !== major) throw new ProfileValidationError('浏览器主版本与当前 TLS 内核不一致。')
    if (fingerprint.modules.ua && fingerprint.browser.userAgent) {
      const version = chromeVersionFromUserAgent(fingerprint.browser.userAgent)
      if (version !== chromiumVersion && version !== `${major}.0.0.0`) throw new ProfileValidationError('用户代理完整版本必须对应当前 TLS 内核或原生缩减版本。')
    }
    return
  }

  const uaVersion = fingerprint.modules.ua && fingerprint.browser.userAgent
    ? chromeVersionFromUserAgent(fingerprint.browser.userAgent)
    : null
  const targetMajor = uaVersion ? Number(uaVersion.split('.')[0]) : (fingerprint.tlsFingerprint?.targetMajor || fingerprint.browser?.chromiumMajor)
  if (!targetMajor || targetMajor < 100 || targetMajor > 200) {
    throw new ProfileValidationError('跨版本模拟需要合法的 Chrome 目标版本 (100-200)。')
  }
  if (fingerprint.tlsFingerprint?.targetMajor && fingerprint.tlsFingerprint.targetMajor !== targetMajor) {
    throw new ProfileValidationError(`跨版本模拟中 TLS 目标主版本 (${fingerprint.tlsFingerprint.targetMajor}) 与用户代理主版本 (${targetMajor}) 不一致。`)
  }
  if (fingerprint.tlsFingerprint) {
    const audit = auditTLSVersionConsistency(fingerprint, fingerprint.tlsFingerprint, { runtimeVersion: chromiumVersion })
    if (!audit.consistent) {
      throw new ProfileValidationError(`跨版本 TLS 策略不自洽：${audit.reason}`)
    }
  }
}

function applyTLSFingerprintConfig (profileSession, policy, chromiumVersion = process.versions.chrome) {
  if (!policy || typeof policy !== 'object' || Array.isArray(policy) || (policy.chromiumVersion !== undefined && policy.chromiumVersion !== chromiumVersion)) throw new ProfileValidationError('TLS 策略必须对应当前内核版本。')
  if (typeof chromiumVersion !== 'string' || !chromiumVersion.startsWith('138.')) throw new ProfileValidationError('TLS 策略与当前内核版本不一致。')
  const normalized = createTLSFingerprintConfig({ ...policy, chromiumVersion })
  if (typeof profileSession.getTLSFingerprintCapabilities !== 'function' || typeof profileSession.setSSLConfig !== 'function') throw new ProfileValidationError('当前运行时未包含 TLS 指纹策略接口，请更新运行时后使用。')
  let capabilities
  try { capabilities = profileSession.getTLSFingerprintCapabilities() } catch { throw new ProfileValidationError('无法读取当前运行时的 TLS 策略能力。') }
  if (capabilities?.schemaVersion !== 1 || capabilities.chromiumVersion !== chromiumVersion || !chromiumVersion?.startsWith('138.')) throw new ProfileValidationError('TLS 策略与当前内核版本不一致。')
  const required = { cipherSuites: ['cipherOrder', 'tls1.2'], permuteExtensions: ['extensionPermutation', true], echEnabled: ['ech', true], postQuantumKeyAgreementEnabled: ['postQuantumKeyAgreement', true], supportedGroups: ['supportedGroups', true], signatureAlgorithms: ['signatureAlgorithms', true] }
  for (const [key, [capability, value]] of Object.entries(required)) {
    if (Object.hasOwn(normalized, key) && capabilities[capability] !== value) throw new ProfileValidationError(`当前运行时不支持 TLS 策略字段 ${key}，请更新匹配的运行时。`)
  }
  if (normalized.supportedGroups?.includes(25497) && (!Array.isArray(capabilities.supportedGroupIds) || !capabilities.supportedGroupIds.includes(25497))) throw new ProfileValidationError('当前运行时不支持 X25519Kyber768Draft00 密钥协商组，请更新匹配的运行时。')
  if (Object.hasOwn(normalized, 'alpsCodepoint') && (!Array.isArray(capabilities.alpsCodepoints) || !capabilities.alpsCodepoints.includes(normalized.alpsCodepoint))) throw new ProfileValidationError('当前运行时不支持所选的 ALPS 扩展标识，请更新匹配的运行时。')
  try {
    profileSession.setSSLConfig({ fingerprint: normalized })
  } catch {
    throw new ProfileValidationError('TLS 策略无效，请检查套件、支持组、签名算法和扩展开关。')
  }
}

function applyEnvironmentTLSFingerprintConfig (profileSession, policy, chromiumVersion = process.versions.chrome) {
  const normalized = assertTLSFingerprintRuntimeVersion(policy, chromiumVersion, '环境 TLS 策略与当前内核版本不一致，请使用匹配的运行时。')
  if (environmentPolicies.has(profileSession)) {
    if (!isDeepStrictEqual(environmentPolicies.get(profileSession), normalized)) throw new ProfileValidationError('该环境会话已经锁定另一份 TLS 策略，请重启客户端后重新打开以生效。')
    return
  }
  if (normalized) applyTLSFingerprintConfig(profileSession, normalized, chromiumVersion)
  environmentPolicies.set(profileSession, normalized)
}

module.exports = {
  CHROME_TLS_VERSION_PRESETS,
  getTLSVersionPreset,
  resolveTLSConfigForBrowser,
  auditTLSVersionConsistency,
  chromeVersionFromUserAgent,
  assertTLSRuntimeIdentity,
  assertTLSFingerprintRuntimeVersion,
  applyTLSFingerprintConfig,
  applyEnvironmentTLSFingerprintConfig
}
