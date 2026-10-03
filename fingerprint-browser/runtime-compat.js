const { ProfileValidationError } = require('./profile-store')
const { isDeepStrictEqual } = require('node:util')

function comparableFingerprint (fingerprint) {
  const copy = structuredClone(fingerprint)
  if (copy.modules && copy.modules.runtimeInspector !== true) delete copy.modules.runtimeInspector
  return copy
}

function applyFingerprintConfig (profileSession, fingerprint) {
  if (typeof profileSession.setFingerprintConfig !== 'function') {
    throw new ProfileValidationError('当前运行时不包含指纹配置接口，请使用本项目编译的 Electron。')
  }
  if (typeof profileSession.getFingerprintConfig === 'function') {
    const existing = profileSession.getFingerprintConfig()
    if (existing && isDeepStrictEqual(comparableFingerprint(existing), comparableFingerprint(fingerprint))) return ''
    if (existing) {
      throw new ProfileValidationError('该环境会话已经锁定另一份指纹配置，不能更换环境指纹。')
    }
  }
  try {
    profileSession.setFingerprintConfig(fingerprint)
    return ''
  } catch (error) {
    if (/不支持字段[:：]\s*modules\.runtimeInspector\s*$/.test(error?.message || '')) {
      if (fingerprint.modules.runtimeInspector !== false) {
        throw new ProfileValidationError('当前运行时不支持调试器配置选项，请使用最新构建的 Electron。')
      }
      const compatible = structuredClone(fingerprint)
      delete compatible.modules.runtimeInspector
      try {
        profileSession.setFingerprintConfig(compatible)
        return '当前运行时不支持调试器配置选项，已按旧版内核默认行为加载；此选项未生效。'
      } catch {
        throw new ProfileValidationError('指纹配置无法加载，请使用与配置匹配的 Electron 运行时。')
      }
    }
    throw new ProfileValidationError('指纹配置无法加载，请检查配置或使用匹配的 Electron 运行时。')
  }
}

module.exports = { applyFingerprintConfig }
