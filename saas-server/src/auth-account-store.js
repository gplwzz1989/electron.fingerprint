// 授权成功后，账号身份和加密会话统一写入 auth_accounts。
class AuthAccountStore {
  constructor (database, UserError) { this.db = database; this.UserError = UserError }
  async initialize () {
    await this.db.pool.query('CREATE TABLE IF NOT EXISTS auth_accounts(id VARCHAR(64) NOT NULL,workspace_id VARCHAR(36) NOT NULL,platform_code VARCHAR(100) NOT NULL,platform_user_id VARCHAR(256) NOT NULL,platform_user_name VARCHAR(160) NOT NULL,platform_avatar TEXT,environment_id VARCHAR(64) NOT NULL,auth_type VARCHAR(16) NOT NULL DEFAULT \'COOKIE\',auth_status VARCHAR(16) NOT NULL,platform_cookie_hash LONGTEXT NOT NULL,platform_local_storage_hash LONGTEXT NOT NULL,session_version BIGINT NOT NULL,origins JSON NOT NULL,entry_url TEXT,authorization_operation_id VARCHAR(64),last_authorized_at BIGINT NOT NULL,last_checked_at BIGINT NOT NULL,created_at BIGINT NOT NULL,updated_at BIGINT NOT NULL,PRIMARY KEY(workspace_id,id),UNIQUE KEY auth_account_identity(workspace_id,platform_code,platform_user_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4')
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
  async writeRows (execute, workspaceId, id, account, snapshot) {
    const data = this.validate(snapshot)
    const current = (await execute('SELECT session_version FROM auth_accounts WHERE workspace_id=? AND id=? FOR UPDATE', [workspaceId, id]))[0]
    const duplicate = (await execute('SELECT id FROM auth_accounts WHERE workspace_id=? AND platform_code=? AND platform_user_id=? FOR UPDATE', [workspaceId, account.platform || '', account.platformUserId || id]))[0]
    if (duplicate && duplicate.id !== id) throw new this.UserError('该平台身份已关联其他账号，请先核对历史绑定。', 409)
    const version = current ? Number(current.session_version) + 1 : 1
    const now = Date.now(); const origins = account.origins || Object.keys(data.storage)
    const columns = 'id,workspace_id,platform_code,platform_user_id,platform_user_name,platform_avatar,environment_id,auth_status,platform_cookie_hash,platform_local_storage_hash,session_version,origins,entry_url,authorization_operation_id,last_authorized_at,last_checked_at,created_at,updated_at'
    const values = [id, workspaceId, account.platform || '', account.platformUserId || id, account.name || '', account.avatar || '', account.environmentId || '', account.status || 'valid', this.db.encrypt(JSON.stringify(data.cookies)), this.db.encrypt(JSON.stringify(data.storage)), version, JSON.stringify(origins), account.launchUrl || '', account.authorizationOperationId || null, now, now, now, now]
    await execute(`INSERT INTO auth_accounts(${columns}) VALUES(${values.map(() => '?').join(',')}) ON DUPLICATE KEY UPDATE platform_user_name=VALUES(platform_user_name),platform_avatar=VALUES(platform_avatar),environment_id=VALUES(environment_id),auth_status=VALUES(auth_status),platform_cookie_hash=VALUES(platform_cookie_hash),platform_local_storage_hash=VALUES(platform_local_storage_hash),session_version=VALUES(session_version),origins=VALUES(origins),entry_url=VALUES(entry_url),authorization_operation_id=VALUES(authorization_operation_id),last_authorized_at=VALUES(last_authorized_at),last_checked_at=VALUES(last_checked_at),updated_at=VALUES(updated_at)`, values)
    return { sessionVersion: version }
  }
  async write (workspaceId, id, account, snapshot) { return await this.db.transaction(() => this.writeRows(this.db.execute.bind(this.db), workspaceId, id, account, snapshot)) }
  async read (workspaceId, id) {
    const row = (await this.db.execute('SELECT * FROM auth_accounts WHERE workspace_id=? AND id=?', [workspaceId, id]))[0]
    if (!row || row.auth_status === 'archived') return null
    try { return { cookies: JSON.parse(this.db.decrypt(row.platform_cookie_hash)), storage: JSON.parse(this.db.decrypt(row.platform_local_storage_hash)), sessionVersion: Number(row.session_version), origins: typeof row.origins === 'string' ? JSON.parse(row.origins) : row.origins, entryUrl: row.entry_url } } catch { throw new this.UserError('账号凭据无法读取，请联系管理员恢复原始加密密钥。', 500) }
  }
}
module.exports = { AuthAccountStore }
