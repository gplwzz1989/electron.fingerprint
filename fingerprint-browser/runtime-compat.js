const { ProfileValidationError } = require('./profile-store')
const { isDeepStrictEqual } = require('node:util')
const { assertTLSRuntimeIdentity } = require('./tls-fingerprint')

function comparableFingerprint (fingerprint) {
  const copy = structuredClone(fingerprint)
  if (copy.modules && copy.modules.runtimeInspector !== true) delete copy.modules.runtimeInspector
  return copy
}

function assertFingerprintCapabilities (profileSession, fingerprint, allowMissingCapabilitiesQuery) {
  if (!fingerprint.enabled) return ''
  let serialized
  try { serialized = JSON.stringify(fingerprint) } catch { throw new ProfileValidationError('指纹配置无法序列化，请检查配置内容。') }
  const required = [
    ['unicodeConfigTransport', /[^\x00-\x7f]/.test(serialized), '中文及特殊字符配置传输'],
    ['webgpuAdapterBlocking', fingerprint.modules.webgl, 'WebGPU 适配器访问限制'],
    ['workerLanguageList', fingerprint.modules.locale, '工作线程完整语言列表']
  ].filter(([, needed]) => needed)
  if (!required.length) return ''
  if (typeof profileSession.getFingerprintCapabilities !== 'function') {
    if (allowMissingCapabilitiesQuery) return '当前运行时缺少指纹能力查询接口；已尝试应用配置，但指纹能力无法验证，请更新匹配的运行时。'
    throw new ProfileValidationError('当前运行时不包含所需的指纹能力查询接口，请更新匹配的运行时。')
  }
  let capabilities
  try { capabilities = profileSession.getFingerprintCapabilities() } catch { throw new ProfileValidationError('无法读取当前运行时的指纹能力，请检查运行时是否完整。') }
  if (capabilities?.schemaVersion !== 1 || typeof capabilities.chromiumVersion !== 'string' || capabilities.chromiumVersion !== process.versions.chrome) throw new ProfileValidationError('指纹能力声明与当前内核版本不一致，请更新匹配的运行时。')
  for (const [key, , label] of required) {
    if (capabilities[key] !== true) throw new ProfileValidationError(`当前运行时不支持${label}，无法加载该环境，请更新匹配的运行时。`)
  }
  return ''
}

function applyFingerprintConfig (profileSession, fingerprint, options = {}) {
  if (typeof profileSession.setFingerprintConfig !== 'function') {
    throw new ProfileValidationError('当前运行时不包含指纹配置接口，请使用本项目编译的 Electron。')
  }
  if (process.versions.chrome) assertTLSRuntimeIdentity(fingerprint, process.versions.chrome)
  const capabilityWarning = assertFingerprintCapabilities(profileSession, fingerprint, options.allowMissingCapabilitiesQuery === true)
  if (typeof profileSession.getFingerprintConfig === 'function') {
    const existing = profileSession.getFingerprintConfig()
    if (existing && isDeepStrictEqual(comparableFingerprint(existing), comparableFingerprint(fingerprint))) return capabilityWarning
    if (existing) {
      throw new ProfileValidationError('该环境会话已经锁定另一份指纹配置，请重启客户端后重新打开以生效。')
    }
  }
  try {
    profileSession.setFingerprintConfig(fingerprint)
    return capabilityWarning
  } catch (error) {
    if (/不支持字段[:：]\s*modules\.runtimeInspector\s*$/.test(error?.message || '')) {
      if (fingerprint.modules.runtimeInspector !== false) {
        throw new ProfileValidationError('当前运行时不支持调试器配置选项，请使用最新构建的 Electron。')
      }
      const compatible = structuredClone(fingerprint)
      delete compatible.modules.runtimeInspector
      try {
        profileSession.setFingerprintConfig(compatible)
        return [capabilityWarning, '当前运行时不支持调试器配置选项，已按旧版内核默认行为加载；此选项未生效。'].filter(Boolean).join('；')
      } catch {
        throw new ProfileValidationError('指纹配置无法加载，请使用与配置匹配的 Electron 运行时。')
      }
    }
    throw new ProfileValidationError('指纹配置无法加载，请检查配置或使用匹配的 Electron 运行时。')
  }
}

module.exports = { applyFingerprintConfig }
