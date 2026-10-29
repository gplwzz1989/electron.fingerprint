const crypto = require('node:crypto')

// 独立消费端测试实现，验证服务端仅通过公开协议互通。
function createLaunchRequest (scope, resourceId) {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
  const request = { protocol: 'desktop-launch-v1', scope, resourceId, nonce: crypto.randomBytes(32).toString('hex'), publicKey: publicKey.export({ type: 'spki', format: 'pem' }) }
  return { request, open: envelope => {
    const { format, scope: actualScope, resourceId: actualResource, nonce, expiresAt } = envelope
    if (format !== request.protocol || actualScope !== scope || actualResource !== resourceId || nonce !== request.nonce || expiresAt < Date.now()) throw new Error('启动协议不匹配。')
    const key = crypto.privateDecrypt({ key: privateKey, oaepHash: 'sha256' }, Buffer.from(envelope.wrappedKey, 'base64'))
    try {
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(envelope.iv, 'base64'))
      decipher.setAAD(Buffer.from(JSON.stringify({ format, scope, resourceId, nonce, expiresAt }))); decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'))
      return JSON.parse(Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, 'base64')), decipher.final()]).toString('utf8'))
    } finally { key.fill(0) }
  } }
}
module.exports = { createLaunchRequest }
