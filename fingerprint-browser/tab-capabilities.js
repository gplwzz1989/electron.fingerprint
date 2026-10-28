const { businessChannels, shellChannels, managementChannels, capabilityGroups } = require('./client-api-contract')
const { ProfileValidationError } = require('./profile-store')

class TabCapabilities {
  constructor () { this.entries = new Map() }
  normalize (input = {}) {
    const capabilities = input.capabilities ?? []
    const origins = input.allowedOrigins ?? []
    if (!Array.isArray(capabilities) || capabilities.length > 16 || capabilities.some(value => value !== '*' && !capabilityGroups.has(value))) throw new ProfileValidationError('标签能力配置无效。')
    if (!Array.isArray(origins) || origins.length > 32) throw new ProfileValidationError('标签授权来源配置无效。')
    const allowedOrigins = origins.map(value => {
      let url
      try { url = new URL(value) } catch { throw new ProfileValidationError('标签授权来源必须是完整的网页来源地址。') }
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.origin !== value) throw new ProfileValidationError('标签授权来源不能包含路径、凭据或查询参数。')
      return url.origin
    })
    return { capabilities: [...new Set(capabilities)], allowedOrigins: [...new Set(allowedOrigins)] }
  }
  register (contents, kind, options = {}) {
    const entry = { contents, kind, pinnedUrl: options.pinnedUrl, ...this.normalize(options) }
    this.entries.set(contents.id, entry)
    contents.once?.('destroyed', () => this.revoke(contents))
    return entry
  }
  update (contents, policy) {
    const entry = this.entries.get(contents.id)
    if (!entry || entry.kind !== 'managed') throw new ProfileValidationError('只能调整 SaaS 创建标签的能力。')
    const normalized = this.normalize({ ...entry, ...policy })
    Object.assign(entry, normalized)
    return normalized
  }
  revoke (contents) { this.entries.delete(contents.id) }
  assert (event, channel) {
    const entry = this.entries.get(event.sender?.id)
    if (!entry || entry.contents !== event.sender || event.sender.isDestroyed() || event.senderFrame !== event.sender.mainFrame) throw new ProfileValidationError('当前页面无权调用客户端内部接口。')
    const url = event.senderFrame.url?.split('#', 1)[0]
    if (entry.kind === 'home' && url === entry.pinnedUrl && businessChannels.has(channel)) return entry
    if (entry.kind === 'shell' && url === entry.pinnedUrl && shellChannels.has(channel)) return entry
    if (entry.kind === 'panel' && url === entry.pinnedUrl && channel.startsWith('x-grok:')) return entry
    if (entry.kind === 'managed' && businessChannels.has(channel) && !managementChannels.has(channel)) {
      let origin
      try { origin = new URL(url).origin } catch {}
      if (entry.allowedOrigins.includes(origin) && (entry.capabilities.includes('*') || entry.capabilities.includes(channel.split(':')[0]))) return entry
    }
    throw new ProfileValidationError('当前标签未获准使用此客户端能力。')
  }
}

module.exports = { TabCapabilities }
