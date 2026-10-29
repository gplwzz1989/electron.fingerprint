const crypto = require('node:crypto')

const FORMAT = 'desktop-launch-v1'
function createLaunchRequest (scope, resourceId) {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
  const request = { protocol: FORMAT, scope, resourceId, publicKey: publicKey.export({ type: 'spki', format: 'pem' }), nonce: crypto.randomBytes(32).toString('hex') }
  let consumed = false
  return { request, open: envelope => { if (consumed) throw new Error('启动配置已使用，请重新获取。'); const profile = openLaunch(envelope, privateKey, { scope, resourceId, nonce: request.nonce }); consumed = true; return profile } }
}
function openLaunch (envelope, privateKey, expected) {
  try {
    const { format, scope, resourceId, nonce, expiresAt } = envelope || {}
    if (format !== FORMAT || scope !== expected.scope || resourceId !== expected.resourceId || nonce !== expected.nonce || !Number.isSafeInteger(expiresAt) || expiresAt < Date.now() || expiresAt > Date.now() + 65000 || typeof envelope.ciphertext !== 'string' || envelope.ciphertext.length > 524288) throw new Error()
    const key = crypto.privateDecrypt({ key: privateKey, oaepHash: 'sha256', padding: crypto.constants.RSA_PKCS1_OAEP_PADDING }, Buffer.from(envelope.wrappedKey, 'base64'))
    try {
      const iv = Buffer.from(envelope.iv, 'base64'); const tag = Buffer.from(envelope.tag, 'base64')
      if (key.length !== 32 || iv.length !== 12 || tag.length !== 16) throw new Error()
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
      decipher.setAAD(Buffer.from(JSON.stringify({ format, scope, resourceId, nonce, expiresAt }))); decipher.setAuthTag(tag)
      const profile = JSON.parse(Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, 'base64')), decipher.final()]).toString('utf8'))
      if (profile.id !== resourceId || !profile.fingerprint) throw new Error()
      return profile
    } finally { key.fill(0) }
  } catch { throw new Error('启动配置解密或校验失败，请重新获取环境配置。') }
}
module.exports = { createLaunchRequest }
