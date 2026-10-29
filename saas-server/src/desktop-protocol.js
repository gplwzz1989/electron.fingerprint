const crypto = require('node:crypto')

// 服务端独立实现公开的基座协议，不导入桌面客户端源码。
function validateLaunchRequest (request) {
  if (!request || !/^[a-f0-9]{64}$/.test(request.nonce) || typeof request.publicKey !== 'string' || request.publicKey.length > 2048) throw new Error('启动加密请求无效，请升级客户端后重试。')
  let key
  try { key = crypto.createPublicKey(request.publicKey) } catch { throw new Error('客户端加密公钥无效。') }
  if (key.asymmetricKeyType !== 'rsa' || key.asymmetricKeyDetails.modulusLength < 2048 || key.asymmetricKeyDetails.modulusLength > 4096) throw new Error('客户端加密公钥不符合要求。')
  if (request.protocol && request.protocol !== 'desktop-launch-v1') throw new Error('客户端启动协议版本不受支持。')
  return key
}
function sealLaunch (profile, request, context) {
  const publicKey = validateLaunchRequest(request)
  const modern = request.protocol === 'desktop-launch-v1'
  if (modern && (request.scope !== context.workspaceId || request.resourceId !== context.environmentId)) throw new Error('启动请求与当前团队或环境不一致。')
  // 旧字段仅用于兼容已发行的 0.1.1 客户端；新基座使用不含业务含义的 scope/resourceId。
  const metadata = modern
    ? { format: 'desktop-launch-v1', scope: context.workspaceId, resourceId: context.environmentId, nonce: request.nonce, expiresAt: Date.now() + 60000 }
    : { format: 'qijie-launch-v1', workspaceId: context.workspaceId, environmentId: context.environmentId, nonce: request.nonce, expiresAt: Date.now() + 60000 }
  const key = crypto.randomBytes(32); const iv = crypto.randomBytes(12)
  try {
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv); cipher.setAAD(Buffer.from(JSON.stringify(metadata)))
    const ciphertext = Buffer.concat([cipher.update(JSON.stringify(profile), 'utf8'), cipher.final()])
    const wrappedKey = crypto.publicEncrypt({ key: publicKey, oaepHash: 'sha256', padding: crypto.constants.RSA_PKCS1_OAEP_PADDING }, key)
    return { ...metadata, iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), ciphertext: ciphertext.toString('base64'), wrappedKey: wrappedKey.toString('base64') }
  } finally { key.fill(0) }
}
module.exports = { validateLaunchRequest, sealLaunch }
