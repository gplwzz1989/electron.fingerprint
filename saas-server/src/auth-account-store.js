// 授权成功后，账号信息、状态、环境关联和加密会话统一写入 platform_accounts。
const { catalog } = require('./client-platform-service')
const parse = value => typeof value === 'string' ? JSON.parse(value) : value
const toBigInt = value => typeof value === 'bigint' ? value : BigInt(Math.trunc(Number(value)))
class AuthAccountStore {
  constructor (database, UserError) { this.db = database; this.UserError = UserError }
  async initialize () {
    try { await this.db.client.platformAccount.count() } catch (error) { if (error.code === 'P2021') throw new Error('platform_accounts 表不存在，请先运行 Prisma 数据库同步。'); throw error }
  }
  summary (row, environmentName = '') {
    const platform = catalog.find(item => item.key === row.platformCode)
    return { id: row.id, platform: row.platformCode, platformName: platform?.name || row.platformCode, platformUserId: row.platformUserId, name: row.platformUserName, avatar: row.platformAvatar || '', environmentId: row.environmentId, environmentName, status: row.authStatus, checkedAt: Number(row.lastCheckedAt), createdAt: Number(row.createdAt), updatedAt: Number(row.updatedAt), revision: Number(row.revision) || 1, launchUrl: row.entryUrl || '', origins: parse(row.origins) || [], ...(row.deletedAt ? { deletedAt: Number(row.deletedAt) } : {}) }
  }
  async list (workspaceId) {
    const rows = await this.db.client.platformAccount.findMany({ where: { workspaceId, deletedAt: null, authStatus: { not: 'archived' } } })
    if (!rows.length) return []
    const environments = await this.db.client.record.findMany({ where: { kind: 'environments', workspaceId, id: { in: [...new Set(rows.map(row => row.environmentId))] }, deletedAt: null }, select: { id: true, data: true } })
    const names = new Map(environments.map(row => [row.id, parse(row.data)?.name || '']))
    return rows.map(row => this.summary(row, names.get(row.environmentId) || ''))
  }
  async get (workspaceId, id, { includeArchived = false, lock = false } = {}) {
    const row = await this.db.client.platformAccount.findUnique({ where: { workspaceId_id: { workspaceId, id } } })
    if (!row || (!includeArchived && (row.deletedAt !== null || row.authStatus === 'archived'))) return null
    const environment = await this.db.client.record.findFirst({ where: { kind: 'environments', workspaceId, id: row.environmentId, deletedAt: null }, select: { data: true } })
    return this.summary(row, parse(environment?.data)?.name || '')
  }
  async updateSummary (workspaceId, id, value, expectedRevision) {
    return await this.db.transaction(async () => {
      const row = await this.db.client.platformAccount.findUnique({ where: { workspaceId_id: { workspaceId, id } } })
      if (!row || row.deletedAt !== null || row.authStatus === 'archived') throw new this.UserError('账号不存在或无法访问。', 404)
      if (expectedRevision !== row.revision) throw new this.UserError('记录已更新，请重新加载后再保存。', 409)
      const status = value.status || row.authStatus
      if (!['valid', 'invalid', 'expired'].includes(status)) throw new this.UserError('账号状态无效。')
      const name = typeof value.name === 'string' ? value.name : row.platformUserName
      const avatar = typeof value.avatar === 'string' ? value.avatar : row.platformAvatar
      const checkedAt = Number(value.checkedAt) || Date.now(); const now = Date.now()
      await this.db.client.platformAccount.update({ where: { workspaceId_id: { workspaceId, id } }, data: { platformUserName: name, platformAvatar: avatar, authStatus: status, lastCheckedAt: toBigInt(checkedAt), updatedAt: toBigInt(now), revision: { increment: 1 } } })
      return await this.get(workspaceId, id)
    })
  }
  async archive (workspaceId, id) {
    return await this.db.transaction(async () => {
      const row = await this.db.client.platformAccount.findUnique({ where: { workspaceId_id: { workspaceId, id } } })
      if (!row || row.deletedAt !== null || row.authStatus === 'archived') throw new this.UserError('账号不存在或无法访问。', 404)
      const now = toBigInt(Date.now())
      await this.db.client.platformAccount.update({ where: { workspaceId_id: { workspaceId, id } }, data: { authStatus: 'archived', deletedAt: now, updatedAt: now, revision: { increment: 1 } } })
    })
  }
  validate (snapshot) {
    const cookieFields = ['domain', 'path', 'secure', 'httpOnly', 'session', 'hostOnly', 'sameSite', 'expirationDate', 'priority', 'sameParty', 'sourceScheme', 'sourcePort']
    const boolFields = new Set(['secure', 'httpOnly', 'session', 'hostOnly', 'sameParty'])
    if (!snapshot || !Array.isArray(snapshot.cookies) || snapshot.cookies.length > 2000 || snapshot.cookies.some(cookie => !cookie || typeof cookie.name !== 'string' || typeof cookie.value !== 'string' || Object.keys(cookie).some(key => !['name', 'value', 'partitionKey', ...cookieFields].includes(key)))) throw new this.UserError('平台会话 Cookie 格式不受支持，请重新授权。')
    for (const cookie of snapshot.cookies) {
      for (const key of cookieFields) if (cookie[key] !== undefined && (boolFields.has(key) ? typeof cookie[key] !== 'boolean' : ['expirationDate', 'sourcePort'].includes(key) ? typeof cookie[key] !== 'number' || !Number.isFinite(cookie[key]) : typeof cookie[key] !== 'string')) throw new this.UserError('平台 Cookie 属性格式无效。')
      const partition = cookie.partitionKey
      if (partition !== undefined && typeof partition !== 'string' && (!partition || typeof partition.topLevelSite !== 'string' || typeof partition.hasCrossSiteAncestor !== 'boolean' || Object.keys(partition).some(key => !['topLevelSite', 'hasCrossSiteAncestor'].includes(key)))) throw new this.UserError('平台分区 Cookie 格式无效。')
    }
    const storage = snapshot.storage || {}
    if (!storage || typeof storage !== 'object' || Array.isArray(storage)) throw new this.UserError('平台本地存储格式无效。')
    for (const [origin, entries] of Object.entries(storage)) {
      let url; try { url = new URL(origin) } catch { throw new this.UserError('平台存储来源无效。') }
      if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin || !entries || typeof entries !== 'object' || Array.isArray(entries) || Object.values(entries).some(value => typeof value !== 'string')) throw new this.UserError('平台存储来源或字段格式无效。')
    }
    return { cookies: snapshot.cookies, storage }
  }
  async writeRows (workspaceId, id, account, snapshot) {
    const data = this.validate(snapshot)
    const current = await this.db.client.platformAccount.findUnique({ where: { workspaceId_id: { workspaceId, id } } })
    const duplicate = await this.db.client.platformAccount.findFirst({ where: { workspaceId, platformCode: account.platform || '', platformUserId: account.platformUserId || id } })
    if (duplicate && duplicate.id !== id) throw new this.UserError('该平台身份已关联其他账号，请先核对历史绑定。', 409)
    const version = current ? Number(current.sessionVersion) + 1 : 1; const revision = current ? Number(current.revision) + 1 : 1
    const now = Date.now(); const origins = account.origins || Object.keys(data.storage)
    const dataToSave = { platformCode: account.platform || '', platformUserId: account.platformUserId || id, platformUserName: account.name || '', platformAvatar: account.avatar || '', environmentId: account.environmentId || '', authType: 'COOKIE', authStatus: account.status || 'valid', platformCookieHash: this.db.encrypt(JSON.stringify(data.cookies)), platformLocalStorageHash: this.db.encrypt(JSON.stringify(data.storage)), sessionVersion: BigInt(version), origins, entryUrl: account.launchUrl || '', authorizationOperationId: account.authorizationOperationId || null, lastAuthorizedAt: toBigInt(now), lastCheckedAt: toBigInt(now), updatedAt: toBigInt(now), revision, deletedAt: null }
    await this.db.client.platformAccount.upsert({
      where: { workspaceId_id: { workspaceId, id } },
      create: { id, workspaceId, createdAt: toBigInt(now), ...dataToSave },
      update: dataToSave
    })
    return { sessionVersion: version, revision }
  }
  async write (workspaceId, id, account, snapshot) { return await this.db.transaction(() => this.writeRows(workspaceId, id, account, snapshot)) }
  async read (workspaceId, id) {
    const row = await this.db.client.platformAccount.findUnique({ where: { workspaceId_id: { workspaceId, id } } })
    if (!row || row.deletedAt !== null || row.authStatus === 'archived') return null
    try { return { cookies: JSON.parse(this.db.decrypt(row.platformCookieHash)), storage: JSON.parse(this.db.decrypt(row.platformLocalStorageHash)), sessionVersion: Number(row.sessionVersion), origins: parse(row.origins), entryUrl: row.entryUrl } } catch { throw new this.UserError('账号凭据无法读取，请联系管理员恢复原始加密密钥。', 500) }
  }
}
module.exports = { AuthAccountStore }
