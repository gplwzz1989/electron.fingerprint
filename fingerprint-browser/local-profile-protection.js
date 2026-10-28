const { ProfileValidationError } = require('./profile-store')

function createLocalProfileProtection (safeStorage) {
  if (!safeStorage.isEncryptionAvailable() || safeStorage.getSelectedStorageBackend?.() === 'basic_text') throw new ProfileValidationError('系统安全存储不可用，无法保护本机指纹，请检查系统密钥服务后重试。')
  return {
    encode: value => ({ format: 'qijie-device-storage-v1', ciphertext: safeStorage.encryptString(JSON.stringify(value)).toString('base64') }),
    decode: value => {
      if (value?.format !== 'qijie-device-storage-v1') return value
      try { return JSON.parse(safeStorage.decryptString(Buffer.from(value.ciphertext, 'base64'))) } catch { throw new ProfileValidationError('本机指纹缓存无法解密，请使用原系统账户或从 SaaS 重新同步。') }
    }
  }
}
module.exports = { createLocalProfileProtection }
