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
      if (profile.id !== resourceId) throw new Error()
      return profile
    } finally { key.fill(0) }
  } catch { throw new Error('启动配置解密或校验失败，请重新获取环境配置。') }
}
function validateLaunchRequest (request) {
  if (!request || !/^[a-f0-9]{64}$/.test(request.nonce) || typeof request.publicKey !== 'string' || request.publicKey.length > 2048) throw new Error('启动加密请求无效，请升级客户端后重试。')
  let key
  try { key = crypto.createPublicKey(request.publicKey) } catch { throw new Error('客户端加密公钥无效。') }
  if (key.asymmetricKeyType !== 'rsa' || key.asymmetricKeyDetails.modulusLength < 2048 || key.asymmetricKeyDetails.modulusLength > 4096) throw new Error('客户端加密公钥不符合要求。')
  if (request.protocol && request.protocol !== FORMAT) throw new Error('客户端启动协议版本不受支持。')
  return key
}

function sealLaunch (profile, request, context = {}) {
  const publicKey = validateLaunchRequest(request)
  const scope = context.workspaceId || context.scope || request.scope
  const resourceId = context.environmentId || context.resourceId || request.resourceId
  if (request.protocol === FORMAT && (request.scope !== scope || request.resourceId !== resourceId)) throw new Error('启动请求与当前团队或环境不一致。')
  const metadata = { format: FORMAT, scope, resourceId, nonce: request.nonce, expiresAt: Date.now() + 60000 }
  const key = crypto.randomBytes(32); const iv = crypto.randomBytes(12)
  try {
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv); cipher.setAAD(Buffer.from(JSON.stringify(metadata)))
    const ciphertext = Buffer.concat([cipher.update(JSON.stringify(profile), 'utf8'), cipher.final()])
    const wrappedKey = crypto.publicEncrypt({ key: publicKey, oaepHash: 'sha256', padding: crypto.constants.RSA_PKCS1_OAEP_PADDING }, key)
    return { ...metadata, iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), ciphertext: ciphertext.toString('base64'), wrappedKey: wrappedKey.toString('base64') }
  } finally { key.fill(0) }
}

module.exports = {
  FORMAT,
  createLaunchRequest,
  openLaunch,
  sealLaunch,
  validateLaunchRequest
}
