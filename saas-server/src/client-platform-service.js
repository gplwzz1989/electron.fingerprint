// 这里只维护业务支持范围；平台入口、识别规则与执行脚本由客户端能力包提供。
const catalog = [{ key: 'shipinhao', name: '视频号' }, { key: 'kuaishou', name: '快手' }, { key: 'xiaohongshu', name: '小红书' }, { key: 'douyin', name: '抖音' }]
function verifyClientResult (task, payload) {
  if (!payload || payload.operationId !== task.id || payload.platform?.key !== task.platform.key) throw new Error('客户端授权结果与当前操作不匹配。')
  if (payload.outcome === 'invalid' && task.mode === 'check' && task.targetAccountId && typeof payload.identity?.platformUserId === 'string') return { outcome: 'invalid', platformUserId: payload.identity.platformUserId }
  if (payload.outcome !== 'valid') throw new Error('客户端未确认授权成功。')
  const identity = payload.identity
  if (!identity || typeof identity.platformUserId !== 'string' || !identity.platformUserId.trim() || identity.platformUserId.length > 256 || typeof identity.name !== 'string' || identity.name.length > 160 || typeof identity.avatar !== 'string' || identity.avatar.length > 2048) throw new Error('客户端未返回完整的平台身份。')
  const definition = payload.platform
  if (typeof definition.url !== 'string' || !Array.isArray(definition.origins) || !definition.origins.length || definition.origins.length > 8 || definition.origins.some(origin => { const url = new URL(origin); return url.protocol !== 'https:' || url.origin !== origin }) || !definition.origins.includes(new URL(definition.url).origin)) throw new Error('客户端平台来源无效。')
  if (!Array.isArray(payload.cookies) || !payload.cookies.length || payload.cookies.some(cookie => typeof cookie.domain !== 'string' || !definition.origins.some(origin => { const host = new URL(origin).hostname; const domain = cookie.domain.replace(/^\./, ''); return host === domain || host.endsWith('.' + domain) }))) throw new Error('客户端平台会话来源不匹配。')
  if (Object.keys(payload.storage || {}).some(origin => !definition.origins.includes(origin))) throw new Error('客户端存储来源不匹配。')
  return { ...identity, platform: definition, packageVersion: payload.packageVersion, session: { cookies: payload.cookies, storage: payload.storage || {} } }
}
module.exports = { catalog, verifyClientResult }
