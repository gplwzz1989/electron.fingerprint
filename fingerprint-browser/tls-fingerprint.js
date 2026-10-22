const { isDeepStrictEqual } = require('node:util')
const { ProfileValidationError, createTLSFingerprintConfig } = require('./profile-store')

const environmentPolicies = new WeakMap()

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

function assertTLSRuntimeIdentity (fingerprint, chromiumVersion) {
  if (!fingerprint.enabled || !(fingerprint.modules.ua || fingerprint.modules.clientHints)) return
  const major = Number(chromiumVersion?.split('.')[0])
  if (major !== 138 || fingerprint.browser.chromiumMajor !== major) throw new ProfileValidationError('浏览器主版本与当前 TLS 内核不一致。')
  if (fingerprint.modules.ua && fingerprint.browser.userAgent) {
    const version = chromeVersionFromUserAgent(fingerprint.browser.userAgent)
    if (version !== chromiumVersion && version !== `${major}.0.0.0`) throw new ProfileValidationError('用户代理完整版本必须对应当前 TLS 内核或原生缩减版本。')
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
  if (Object.hasOwn(normalized, 'alpsCodepoint') && (!Array.isArray(capabilities.alpsCodepoints) || !capabilities.alpsCodepoints.includes(normalized.alpsCodepoint))) throw new ProfileValidationError('当前运行时不支持所选的 ALPS 扩展标识，请更新匹配的运行时。')
  try {
    profileSession.setSSLConfig({ fingerprint: normalized })
  } catch {
    throw new ProfileValidationError('TLS 策略无效，请检查套件、支持组、签名算法和扩展开关。')
  }
}

function applyEnvironmentTLSFingerprintConfig (profileSession, policy, chromiumVersion = process.versions.chrome) {
  const normalized = createTLSFingerprintConfig(policy)
  if (normalized && normalized.chromiumVersion !== chromiumVersion) throw new ProfileValidationError('环境 TLS 策略与当前内核版本不一致，请使用匹配的运行时。')
  if (environmentPolicies.has(profileSession)) {
    if (!isDeepStrictEqual(environmentPolicies.get(profileSession), normalized)) throw new ProfileValidationError('该环境会话已经锁定另一份 TLS 策略，请重启客户端后重新打开以生效。')
    return
  }
  if (normalized) applyTLSFingerprintConfig(profileSession, normalized, chromiumVersion)
  // 原生状态也随会话锁定，避免关闭页面后更换策略却复用旧连接。
  environmentPolicies.set(profileSession, normalized)
}

module.exports = { chromeVersionFromUserAgent, assertTLSRuntimeIdentity, applyTLSFingerprintConfig, applyEnvironmentTLSFingerprintConfig }
