const crypto = require('node:crypto')

// 仅供协议兼容性测试的独立第三方生产端，不引用任何 SaaS 实现。
function validateLaunchRequest (request) {
  try { return crypto.createPublicKey(request.publicKey) } catch { throw new Error('无效公钥。') }
}
function sealLaunch (profile, request, context) {
  const key = crypto.randomBytes(32); const iv = crypto.randomBytes(12)
  const metadata = { format: 'desktop-launch-v1', scope: context.scope, resourceId: context.resourceId, nonce: request.nonce, expiresAt: Date.now() + 60000 }
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv); cipher.setAAD(Buffer.from(JSON.stringify(metadata)))
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(profile)), cipher.final()])
  const wrappedKey = crypto.publicEncrypt({ key: validateLaunchRequest(request), oaepHash: 'sha256' }, key)
  key.fill(0)
  return { ...metadata, ciphertext: ciphertext.toString('base64'), wrappedKey: wrappedKey.toString('base64'), iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64') }
}
module.exports = { validateLaunchRequest, sealLaunch }
