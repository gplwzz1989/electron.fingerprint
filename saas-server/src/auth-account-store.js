// 正式账号凭据以 auth_accounts 为唯一读取源；旧关系会话保留作升级恢复，不再参与新账号写入。
class AuthAccountStore {
  constructor (database, UserError) { this.db = database; this.UserError = UserError }
  async initialize () {
    await this.db.pool.query('CREATE TABLE IF NOT EXISTS auth_accounts(id VARCHAR(64) NOT NULL,workspace_id VARCHAR(36) NOT NULL,platform_code VARCHAR(100) NOT NULL,platform_user_id VARCHAR(256) NOT NULL,platform_user_name VARCHAR(160) NOT NULL,platform_avatar TEXT,environment_id VARCHAR(64) NOT NULL,auth_type VARCHAR(16) NOT NULL DEFAULT \'COOKIE\',auth_status VARCHAR(16) NOT NULL,platform_cookie_hash LONGTEXT NOT NULL,platform_local_storage_hash LONGTEXT NOT NULL,session_version BIGINT NOT NULL,origins JSON NOT NULL,entry_url TEXT,authorization_operation_id VARCHAR(64),last_authorized_at BIGINT NOT NULL,last_checked_at BIGINT NOT NULL,created_at BIGINT NOT NULL,updated_at BIGINT NOT NULL,PRIMARY KEY(workspace_id,id),UNIQUE KEY auth_account_identity(workspace_id,platform_code,platform_user_id),FOREIGN KEY(workspace_id) REFERENCES workspaces(id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4')
    const connection = await this.db.pool.getConnection()
    const execute = async (sql, args = []) => (await connection.execute(sql, args))[0]
    try {
      await connection.beginTransaction()
      const rows = await execute("SELECT r.id,r.workspace_id,r.data FROM records r LEFT JOIN auth_accounts a ON a.workspace_id=r.workspace_id AND a.id=r.id WHERE r.kind='accounts' AND r.deleted_at IS NULL AND a.id IS NULL FOR UPDATE")
      for (const row of rows) {
        const account = typeof row.data === 'string' ? JSON.parse(row.data) : row.data
        const snapshot = await this.db.mediaSessions.readRows(execute, row.workspace_id, row.id, 'account')
        if (!snapshot) continue
        await this.writeRows(execute, row.workspace_id, row.id, account, snapshot, true)
      }
      await connection.commit()
    } catch { await connection.rollback(); throw new this.UserError('账号凭据迁移未完成，原始会话已保留，请检查加密密钥与账号数据。', 500) } finally { connection.release() }
  }
  async writeRows (execute, workspaceId, id, account, snapshot, migration = false) {
    const data = this.db.mediaSessions.validate(snapshot)
    const current = (await execute('SELECT session_version FROM auth_accounts WHERE workspace_id=? AND id=? FOR UPDATE', [workspaceId, id]))[0]
    const duplicate = (await execute('SELECT id FROM auth_accounts WHERE workspace_id=? AND platform_code=? AND platform_user_id=? FOR UPDATE', [workspaceId, account.platform || '', account.platformUserId || id]))[0]
    if (duplicate && duplicate.id !== id) throw new this.UserError('该平台身份已关联其他账号，请先核对历史绑定。', 409)
    const version = current ? Number(current.session_version) + 1 : migration ? Number(snapshot.sessionVersion) || 1 : 1
    const now = Date.now(); const origins = account.origins || Object.keys(data.storage)
    const columns = 'id,workspace_id,platform_code,platform_user_id,platform_user_name,platform_avatar,environment_id,auth_status,platform_cookie_hash,platform_local_storage_hash,session_version,origins,entry_url,authorization_operation_id,last_authorized_at,last_checked_at,created_at,updated_at'
    const values = [id, workspaceId, account.platform || '', account.platformUserId || id, account.name || '', account.avatar || '', account.environmentId || '', account.status || 'valid', this.db.encrypt(JSON.stringify(data.cookies)), this.db.encrypt(JSON.stringify(data.storage)), version, JSON.stringify(origins), account.launchUrl || '', account.authorizationOperationId || null, now, now, now, now]
    await execute(`INSERT INTO auth_accounts(${columns}) VALUES(${values.map(() => '?').join(',')}) ON DUPLICATE KEY UPDATE platform_user_name=VALUES(platform_user_name),platform_avatar=VALUES(platform_avatar),environment_id=VALUES(environment_id),auth_status=VALUES(auth_status),platform_cookie_hash=VALUES(platform_cookie_hash),platform_local_storage_hash=VALUES(platform_local_storage_hash),session_version=VALUES(session_version),origins=VALUES(origins),entry_url=VALUES(entry_url),authorization_operation_id=VALUES(authorization_operation_id),last_authorized_at=VALUES(last_authorized_at),last_checked_at=VALUES(last_checked_at),updated_at=VALUES(updated_at)`, values)
    return { sessionVersion: version }
  }
  async write (workspaceId, id, account, snapshot) { return await this.db.transaction(() => this.writeRows(this.db.execute.bind(this.db), workspaceId, id, account, snapshot)) }
  async read (workspaceId, id) {
    const row = (await this.db.execute('SELECT * FROM auth_accounts WHERE workspace_id=? AND id=?', [workspaceId, id]))[0]
    if (!row) return null
    try { return { cookies: JSON.parse(this.db.decrypt(row.platform_cookie_hash)), storage: JSON.parse(this.db.decrypt(row.platform_local_storage_hash)), sessionVersion: Number(row.session_version), origins: typeof row.origins === 'string' ? JSON.parse(row.origins) : row.origins, entryUrl: row.entry_url } } catch { throw new this.UserError('账号凭据无法读取，请联系管理员恢复原始加密密钥。', 500) }
  }
}
module.exports = { AuthAccountStore }
