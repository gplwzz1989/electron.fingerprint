const crypto = require('node:crypto')

// Cookie 属性和来源存储逐项落列；仅敏感 value 使用既有服务端密钥加密。
const cookieFields = { domain: 'cookie_domain', path: 'cookie_path', secure: 'is_secure', httpOnly: 'is_http_only', session: 'is_session', hostOnly: 'is_host_only', sameSite: 'same_site', expirationDate: 'expires_at', priority: 'priority', sameParty: 'same_party', sourceScheme: 'source_scheme', sourcePort: 'source_port' }
const boolFields = new Set(['secure', 'httpOnly', 'session', 'hostOnly', 'sameParty'])
const parse = value => typeof value === 'string' ? JSON.parse(value) : value

class MediaSessionStore {
  constructor (database, UserError) { this.db = database; this.UserError = UserError }
  async initialize () {
    const statements = [
      'CREATE TABLE IF NOT EXISTS media_sessions(workspace_id VARCHAR(36) NOT NULL,session_id VARCHAR(64) NOT NULL,session_kind VARCHAR(16) NOT NULL,version BIGINT NOT NULL,updated_at BIGINT NOT NULL,PRIMARY KEY(workspace_id,session_id,session_kind))',
      'CREATE TABLE IF NOT EXISTS media_session_cookies(workspace_id VARCHAR(36) NOT NULL,session_id VARCHAR(64) NOT NULL,session_kind VARCHAR(16) NOT NULL,cookie_ordinal INT NOT NULL,cookie_name TEXT NOT NULL,value_ciphertext LONGTEXT NOT NULL,cookie_domain TEXT,cookie_path TEXT,is_secure TINYINT,is_http_only TINYINT,is_session TINYINT,is_host_only TINYINT,same_site VARCHAR(32),expires_at DOUBLE,priority VARCHAR(32),same_party TINYINT,source_scheme VARCHAR(32),source_port INT,partition_kind VARCHAR(16),partition_site TEXT,partition_cross_site TINYINT,PRIMARY KEY(workspace_id,session_id,session_kind,cookie_ordinal))',
      'CREATE TABLE IF NOT EXISTS media_session_storage(workspace_id VARCHAR(36) NOT NULL,session_id VARCHAR(64) NOT NULL,session_kind VARCHAR(16) NOT NULL,entry_hash CHAR(64) NOT NULL,storage_origin TEXT NOT NULL,storage_key TEXT NOT NULL,value_ciphertext LONGTEXT NOT NULL,PRIMARY KEY(workspace_id,session_id,session_kind,entry_hash))'
    ]
    for (const statement of statements) await this.db.pool.query(statement + ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4')
    await this.migrate()
  }
  validate (snapshot) {
    if (!snapshot || !Array.isArray(snapshot.cookies) || snapshot.cookies.length > 2000 || snapshot.cookies.some(cookie => !cookie || typeof cookie.name !== 'string' || typeof cookie.value !== 'string' || Object.keys(cookie).some(key => !['name', 'value', 'partitionKey', ...Object.keys(cookieFields)].includes(key)))) throw new this.UserError('平台会话 Cookie 格式不受支持，请重新授权。')
    for (const cookie of snapshot.cookies) {
      for (const key of Object.keys(cookieFields)) if (cookie[key] !== undefined && (boolFields.has(key) ? typeof cookie[key] !== 'boolean' : ['expirationDate', 'sourcePort'].includes(key) ? typeof cookie[key] !== 'number' || !Number.isFinite(cookie[key]) : typeof cookie[key] !== 'string')) throw new this.UserError('平台 Cookie 属性格式无效。')
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
  async writeRows (execute, workspaceId, sessionId, kind, snapshot) {
    const data = this.validate(snapshot)
    const header = (await execute('SELECT version FROM media_sessions WHERE workspace_id=? AND session_id=? AND session_kind=? FOR UPDATE', [workspaceId, sessionId, kind]))[0]
    const version = (Number(header?.version) || 0) + 1; const updatedAt = Date.now()
    await execute('INSERT INTO media_sessions VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE version=VALUES(version),updated_at=VALUES(updated_at)', [workspaceId, sessionId, kind, version, updatedAt])
    await execute('DELETE FROM media_session_cookies WHERE workspace_id=? AND session_id=? AND session_kind=?', [workspaceId, sessionId, kind])
    await execute('DELETE FROM media_session_storage WHERE workspace_id=? AND session_id=? AND session_kind=?', [workspaceId, sessionId, kind])
    for (const [index, cookie] of data.cookies.entries()) {
      const partition = cookie.partitionKey
      const columns = ['workspace_id', 'session_id', 'session_kind', 'cookie_ordinal', 'cookie_name', 'value_ciphertext', ...Object.values(cookieFields), 'partition_kind', 'partition_site', 'partition_cross_site']
      const values = [workspaceId, sessionId, kind, index, cookie.name, this.db.encrypt(cookie.value), ...Object.keys(cookieFields).map(key => cookie[key] ?? null), partition === undefined ? null : typeof partition === 'string' ? 'string' : 'object', typeof partition === 'string' ? partition : partition?.topLevelSite ?? null, typeof partition === 'object' ? partition.hasCrossSiteAncestor : null]
      await execute(`INSERT INTO media_session_cookies(${columns.join(',')}) VALUES(${columns.map(() => '?').join(',')})`, values)
    }
    for (const [origin, entries] of Object.entries(data.storage)) for (const [key, value] of Object.entries(entries)) {
      await execute('INSERT INTO media_session_storage VALUES(?,?,?,?,?,?,?)', [workspaceId, sessionId, kind, crypto.createHash('sha256').update(JSON.stringify([origin, key])).digest('hex'), origin, key, this.db.encrypt(value)])
    }
    return { sessionVersion: version, updatedAt }
  }
  async write (workspaceId, sessionId, kind, snapshot) { return await this.db.transaction(() => this.writeRows(this.db.execute.bind(this.db), workspaceId, sessionId, kind, snapshot)) }
  async read (workspaceId, sessionId, kind) { return await this.readRows(this.db.execute.bind(this.db), workspaceId, sessionId, kind) }
  async readRows (execute, workspaceId, sessionId, kind) {
    const header = (await execute('SELECT version FROM media_sessions WHERE workspace_id=? AND session_id=? AND session_kind=?', [workspaceId, sessionId, kind]))[0]
    if (!header) return null
    const rows = await execute('SELECT * FROM media_session_cookies WHERE workspace_id=? AND session_id=? AND session_kind=? ORDER BY cookie_ordinal', [workspaceId, sessionId, kind])
    const cookies = rows.map(row => {
      const cookie = { name: row.cookie_name, value: this.db.decrypt(row.value_ciphertext) }
      for (const [key, column] of Object.entries(cookieFields)) if (row[column] !== null) cookie[key] = boolFields.has(key) ? Boolean(row[column]) : row[column]
      if (row.partition_kind) cookie.partitionKey = row.partition_kind === 'string' ? row.partition_site : { topLevelSite: row.partition_site, hasCrossSiteAncestor: Boolean(row.partition_cross_site) }
      return cookie
    })
    const storage = Object.create(null)
    for (const row of await execute('SELECT storage_origin,storage_key,value_ciphertext FROM media_session_storage WHERE workspace_id=? AND session_id=? AND session_kind=?', [workspaceId, sessionId, kind])) { storage[row.storage_origin] ||= Object.create(null); storage[row.storage_origin][row.storage_key] = this.db.decrypt(row.value_ciphertext) }
    return { cookies, storage, sessionVersion: Number(header.version) }
  }
  async remove (workspaceId, sessionId, kind) {
    await this.db.transaction(async () => {
      await this.db.execute('DELETE FROM media_session_cookies WHERE workspace_id=? AND session_id=? AND session_kind=?', [workspaceId, sessionId, kind])
      await this.db.execute('DELETE FROM media_session_storage WHERE workspace_id=? AND session_id=? AND session_kind=?', [workspaceId, sessionId, kind])
      await this.db.execute('DELETE FROM media_sessions WHERE workspace_id=? AND session_id=? AND session_kind=?', [workspaceId, sessionId, kind])
    })
  }
  async migrate () {
    // 独立连接避免初始化 ready 循环等待；逐条事务迁移，失败时保留原始密文，禁止生成空会话替代。
    const connection = await this.db.pool.getConnection()
    try {
      const execute = async (sql, values = []) => (await connection.execute(sql, values))[0]
      const candidates = await execute("SELECT kind,id,workspace_id FROM records WHERE kind IN ('account-sessions','authorizations') AND deleted_at IS NULL AND JSON_EXTRACT(data,'$.credential') IS NOT NULL")
      for (const candidate of candidates) {
        await connection.beginTransaction()
        try {
          const row = (await execute('SELECT data FROM records WHERE kind=? AND id=? AND workspace_id=? FOR UPDATE', [candidate.kind, candidate.id, candidate.workspace_id]))[0]
          const data = parse(row.data)
          if (typeof data.credential === 'string' && data.credential) {
            const snapshot = JSON.parse(this.db.decrypt(data.credential))
            const kind = candidate.kind === 'account-sessions' ? 'account' : 'authorization'
            const existing = (await execute('SELECT version FROM media_sessions WHERE workspace_id=? AND session_id=? AND session_kind=? FOR UPDATE', [candidate.workspace_id, candidate.id, kind]))[0]
            if (existing) throw new Error('迁移目标已有会话，请先核对历史版本。')
            await this.writeRows(execute, candidate.workspace_id, candidate.id, kind, snapshot)
            const { credential, ...metadata } = data
            await execute('UPDATE records SET data=?,revision=revision+1 WHERE kind=? AND id=? AND workspace_id=?', [JSON.stringify({ ...metadata, sessionStorage: 'relational-v1' }), candidate.kind, candidate.id, candidate.workspace_id])
          }
          await connection.commit()
        } catch (error) { await connection.rollback(); throw new this.UserError('历史平台会话迁移未完成，已保留原始登录数据，请检查服务端加密密钥和会话格式。', 500) }
      }
    } finally { connection.release() }
  }
}
module.exports = { MediaSessionStore }
