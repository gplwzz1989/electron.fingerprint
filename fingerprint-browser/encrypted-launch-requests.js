const { randomUUID } = require('node:crypto')
const { createLaunchRequest } = require('./fingerprint-envelope')
const { ProfileValidationError } = require('./profile-store')

class EncryptedLaunchRequests {
  constructor () { this.pending = new Map(); this.bound = new WeakSet() }
  prepare (sender, payload = {}) {
    for (const [id, value] of this.pending) if (value.expiresAt < Date.now() || value.sender.isDestroyed()) this.pending.delete(id)
    if (typeof payload.scope !== 'string' || !payload.scope || payload.scope.length > 256 || typeof payload.resourceId !== 'string' || !payload.resourceId || payload.resourceId.length > 128) throw new ProfileValidationError('请提供有效的应用资源范围和资源标识。')
    if (this.pending.size >= 64) throw new ProfileValidationError('待处理启动请求较多，请稍后重试。')
    if (!this.bound.has(sender)) { this.bound.add(sender); sender.once('destroyed', () => { for (const [id, value] of this.pending) if (value.sender === sender) this.pending.delete(id) }) }
    const encryption = createLaunchRequest(payload.scope, payload.resourceId); const requestId = randomUUID()
    this.pending.set(requestId, { sender, url: sender.getURL().split('#')[0], scope: payload.scope, resourceId: payload.resourceId, encryption, expiresAt: Date.now() + 60000 })
    return { requestId, ...encryption.request }
  }
  consume (sender, payload = {}) {
    const pending = this.pending.get(payload.requestId)
    if (!pending || pending.sender !== sender) throw new ProfileValidationError('启动请求不存在或不属于当前页面。')
    this.pending.delete(payload.requestId)
    if (pending.expiresAt < Date.now() || sender.isDestroyed() || sender.getURL().split('#')[0] !== pending.url) throw new ProfileValidationError('启动请求已失效，请重新获取。')
    try { return { profile: pending.encryption.open(payload.envelope), reference: { origin: new URL(pending.url).origin, scope: pending.scope, resourceId: pending.resourceId } } } catch { throw new ProfileValidationError('启动配置解密或校验失败，请重新获取。') }
  }
}
module.exports = { EncryptedLaunchRequests }
