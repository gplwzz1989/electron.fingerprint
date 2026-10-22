const { ProfileValidationError } = require('./profile-store')

function assertTLSRuntimeIdentity (fingerprint, chromiumVersion) {
  if (!fingerprint.enabled || !(fingerprint.modules.ua || fingerprint.modules.clientHints)) return
  const major = Number(chromiumVersion?.split('.')[0])
  if (major !== 138 || fingerprint.browser.chromiumMajor !== major) throw new ProfileValidationError('浏览器主版本与当前 TLS 内核不一致。')
  if (fingerprint.modules.ua && fingerprint.browser.userAgent) {
    const version = fingerprint.browser.userAgent.match(/\bChrome\/(\d+\.\d+\.\d+\.\d+)\b/)?.[1]
    if (version !== chromiumVersion && version !== `${major}.0.0.0`) throw new ProfileValidationError('用户代理完整版本必须对应当前 TLS 内核或原生缩减版本。')
  }
}

function applyTLSFingerprintConfig (profileSession, policy, chromiumVersion = process.versions.chrome) {
  if (!policy || typeof policy !== 'object' || Array.isArray(policy) || (policy.chromiumVersion !== undefined && policy.chromiumVersion !== chromiumVersion)) throw new ProfileValidationError('TLS 策略必须对应当前内核版本。')
  if (typeof profileSession.getTLSFingerprintCapabilities !== 'function') throw new ProfileValidationError('当前运行时未包含 TLS 指纹策略接口，请更新运行时后使用。')
  let capabilities
  try { capabilities = profileSession.getTLSFingerprintCapabilities() } catch { throw new ProfileValidationError('无法读取当前运行时的 TLS 策略能力。') }
  if (capabilities?.schemaVersion !== 1 || capabilities.chromiumVersion !== chromiumVersion || !chromiumVersion?.startsWith('138.')) throw new ProfileValidationError('TLS 策略与当前内核版本不一致。')
  try {
    profileSession.setSSLConfig({ fingerprint: { ...policy, chromiumVersion } })
  } catch {
    throw new ProfileValidationError('TLS 策略无效，请检查密码套件顺序和扩展开关。')
  }
}

module.exports = { assertTLSRuntimeIdentity, applyTLSFingerprintConfig }
