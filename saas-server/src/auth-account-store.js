// 授权成功后，账号信息、状态、环境关联和加密会话统一写入 auth_accounts。
const { catalog } = require('./client-platform-service')
const parse = value => typeof value === 'string' ? JSON.parse(value) : value
class AuthAccountStore {
  constructor (database, UserError) { this.db = database; this.UserError = UserError }
  async initialize () {
    await this.db.pool.query('CREATE TABLE IF NOT EXISTS auth_accounts(id VARCHAR(64) NOT NULL,workspace_id VARCHAR(36) NOT NULL,platform_code VARCHAR(100) NOT NULL,platform_user_id VARCHAR(256) NOT NULL,platform_user_name VARCHAR(160) NOT NULL,platform_avatar TEXT,environment_id VARCHAR(64) NOT NULL,auth_type VARCHAR(16) NOT NULL DEFAULT \'COOKIE\',auth_status VARCHAR(16) NOT NULL,platform_cookie_hash LONGTEXT NOT NULL,platform_local_storage_hash LONGTEXT NOT NULL,session_version BIGINT NOT NULL,origins JSON NOT NULL,entry_url TEXT,authorization_operation_id VARCHAR(64),last_authorized_at BIGINT NOT NULL,last_checked_at BIGINT NOT NULL,created_at BIGINT NOT NULL,updated_at BIGINT NOT NULL,revision INT NOT NULL DEFAULT 1,deleted_at BIGINT NULL,PRIMARY KEY(workspace_id,id),UNIQUE KEY auth_account_identity(workspace_id,platform_code,platform_user_id),INDEX auth_account_environment(workspace_id,environment_id,deleted_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4')
    const [revision] = await this.db.pool.query("SHOW COLUMNS FROM auth_accounts LIKE 'revision'")
    if (!revision.length) await this.db.pool.query('ALTER TABLE auth_accounts ADD COLUMN revision INT NOT NULL DEFAULT 1')
    const [deletedAt] = await this.db.pool.query("SHOW COLUMNS FROM auth_accounts LIKE 'deleted_at'")
    if (!deletedAt.length) await this.db.pool.query('ALTER TABLE auth_accounts ADD COLUMN deleted_at BIGINT NULL')
    const [environmentIndex] = await this.db.pool.query("SHOW INDEX FROM auth_accounts WHERE Key_name='auth_account_environment'")
    if (!environmentIndex.length) await this.db.pool.query('CREATE INDEX auth_account_environment ON auth_accounts(workspace_id,environment_id,deleted_at)')
  }
  summary (row) {
    const environment = parse(row.environment_data)
    const platform = catalog.find(item => item.key === row.platform_code)
    return { id: row.id, platform: row.platform_code, platformName: platform?.name || row.platform_code, platformUserId: row.platform_user_id, name: row.platform_user_name, avatar: row.platform_avatar || '', environmentId: row.environment_id, environmentName: environment?.name || '', status: row.auth_status, checkedAt: Number(row.last_checked_at), createdAt: Number(row.created_at), updatedAt: Number(row.updated_at), revision: Number(row.revision) || 1, launchUrl: row.entry_url || '', origins: parse(row.origins) || [], ...(row.deleted_at ? { deletedAt: Number(row.deleted_at) } : {}) }
  }
  async list (workspaceId) {
    const rows = await this.db.execute("SELECT a.*,e.data AS environment_data FROM auth_accounts a LEFT JOIN records e ON e.kind='environments' AND e.workspace_id=a.workspace_id AND e.id=a.environment_id AND e.deleted_at IS NULL WHERE a.workspace_id=? AND a.deleted_at IS NULL AND a.auth_status<>'archived'", [workspaceId])
    return rows.map(row => this.summary(row))
  }
  async get (workspaceId, id, { includeArchived = false, lock = false } = {}) {
    const active = includeArchived ? '' : " AND a.deleted_at IS NULL AND a.auth_status<>'archived'"
    const locking = lock ? ' FOR UPDATE' : ''
    const row = (await this.db.execute(`SELECT a.*,e.data AS environment_data FROM auth_accounts a LEFT JOIN records e ON e.kind='environments' AND e.workspace_id=a.workspace_id AND e.id=a.environment_id AND e.deleted_at IS NULL WHERE a.workspace_id=? AND a.id=?${active}${locking}`, [workspaceId, id]))[0]
    return row ? this.summary(row) : null
  }
  async updateSummary (workspaceId, id, value, expectedRevision) {
    return await this.db.transaction(async () => {
      const row = (await this.db.execute('SELECT * FROM auth_accounts WHERE workspace_id=? AND id=? FOR UPDATE', [workspaceId, id]))[0]
      if (!row || row.deleted_at || row.auth_status === 'archived') throw new this.UserError('账号不存在或无法访问。', 404)
      if (expectedRevision !== row.revision) throw new this.UserError('记录已更新，请重新加载后再保存。', 409)
      const status = value.status || row.auth_status
      if (!['valid', 'invalid', 'expired'].includes(status)) throw new this.UserError('账号状态无效。')
      const name = typeof value.name === 'string' ? value.name : row.platform_user_name
      const avatar = typeof value.avatar === 'string' ? value.avatar : row.platform_avatar
      const checkedAt = Number(value.checkedAt) || Date.now(); const now = Date.now()
      await this.db.execute('UPDATE auth_accounts SET platform_user_name=?,platform_avatar=?,auth_status=?,last_checked_at=?,updated_at=?,revision=revision+1 WHERE workspace_id=? AND id=?', [name, avatar, status, checkedAt, now, workspaceId, id])
      return await this.get(workspaceId, id)
    })
  }
  async archive (workspaceId, id) {
    return await this.db.transaction(async () => {
      const row = (await this.db.execute('SELECT id FROM auth_accounts WHERE workspace_id=? AND id=? AND deleted_at IS NULL FOR UPDATE', [workspaceId, id]))[0]
      if (!row) throw new this.UserError('账号不存在或无法访问。', 404)
      const now = Date.now()
      await this.db.execute("UPDATE auth_accounts SET auth_status='archived',deleted_at=?,updated_at=?,revision=revision+1 WHERE workspace_id=? AND id=?", [now, now, workspaceId, id])
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
  async writeRows (execute, workspaceId, id, account, snapshot) {
    const data = this.validate(snapshot)
    const current = (await execute('SELECT session_version,revision FROM auth_accounts WHERE workspace_id=? AND id=? FOR UPDATE', [workspaceId, id]))[0]
    const duplicate = (await execute('SELECT id FROM auth_accounts WHERE workspace_id=? AND platform_code=? AND platform_user_id=? FOR UPDATE', [workspaceId, account.platform || '', account.platformUserId || id]))[0]
    if (duplicate && duplicate.id !== id) throw new this.UserError('该平台身份已关联其他账号，请先核对历史绑定。', 409)
    const version = current ? Number(current.session_version) + 1 : 1; const revision = current ? Number(current.revision) + 1 : 1
    const now = Date.now(); const origins = account.origins || Object.keys(data.storage)
    const columns = 'id,workspace_id,platform_code,platform_user_id,platform_user_name,platform_avatar,environment_id,auth_status,platform_cookie_hash,platform_local_storage_hash,session_version,origins,entry_url,authorization_operation_id,last_authorized_at,last_checked_at,created_at,updated_at,revision,deleted_at'
    const values = [id, workspaceId, account.platform || '', account.platformUserId || id, account.name || '', account.avatar || '', account.environmentId || '', account.status || 'valid', this.db.encrypt(JSON.stringify(data.cookies)), this.db.encrypt(JSON.stringify(data.storage)), version, JSON.stringify(origins), account.launchUrl || '', account.authorizationOperationId || null, now, now, now, now, revision, null]
    await execute(`INSERT INTO auth_accounts(${columns}) VALUES(${values.map(() => '?').join(',')}) ON DUPLICATE KEY UPDATE platform_user_name=VALUES(platform_user_name),platform_avatar=VALUES(platform_avatar),environment_id=VALUES(environment_id),auth_status=VALUES(auth_status),platform_cookie_hash=VALUES(platform_cookie_hash),platform_local_storage_hash=VALUES(platform_local_storage_hash),session_version=VALUES(session_version),origins=VALUES(origins),entry_url=VALUES(entry_url),authorization_operation_id=VALUES(authorization_operation_id),last_authorized_at=VALUES(last_authorized_at),last_checked_at=VALUES(last_checked_at),updated_at=VALUES(updated_at),revision=VALUES(revision),deleted_at=NULL`, values)
    return { sessionVersion: version, revision }
  }
  async write (workspaceId, id, account, snapshot) { return await this.db.transaction(() => this.writeRows(this.db.execute.bind(this.db), workspaceId, id, account, snapshot)) }
  async read (workspaceId, id) {
    const row = (await this.db.execute("SELECT * FROM auth_accounts WHERE workspace_id=? AND id=? AND deleted_at IS NULL AND auth_status<>'archived'", [workspaceId, id]))[0]
    if (!row) return null
    try { return { cookies: JSON.parse(this.db.decrypt(row.platform_cookie_hash)), storage: JSON.parse(this.db.decrypt(row.platform_local_storage_hash)), sessionVersion: Number(row.session_version), origins: typeof row.origins === 'string' ? JSON.parse(row.origins) : row.origins, entryUrl: row.entry_url } } catch { throw new this.UserError('账号凭据无法读取，请联系管理员恢复原始加密密钥。', 500) }
  }
}
module.exports = { AuthAccountStore }
