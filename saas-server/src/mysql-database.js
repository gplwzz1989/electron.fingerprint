const mysql = require('mysql2/promise')
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const { AsyncLocalStorage } = require('node:async_hooks')
const { hashPassword, verifyPassword } = require('./auth')
const { readServerConfig } = require('./server-config')
const { AuthAccountStore } = require('./auth-account-store')

class UserError extends Error {
  constructor (message, status = 400) { super(message); this.status = status }
}
const parse = value => typeof value === 'string' ? JSON.parse(value) : value

function readDatabaseConfig (file = process.env.SAAS_CONFIG_FILE || path.join(__dirname, `../.env.${process.env.SAAS_ENV || 'dev'}`)) {
  const config = readServerConfig(file)
  if (!config.DB_HOST || !config.DB_USER || !config.DB_NAME || !config.DB_PORT || config.DB_PASSWORD === undefined) throw new Error('数据库配置不完整，请检查服务端环境配置文件。')
  if (!/^[a-zA-Z0-9_]+$/.test(config.DB_NAME) || !Number.isInteger(Number(config.DB_PORT))) throw new Error('数据库名称或端口配置无效。')
  return { host: config.DB_HOST, port: Number(config.DB_PORT), user: config.DB_USER, password: config.DB_PASSWORD, database: config.DB_NAME, charset: 'utf8mb4', supportBigNumbers: true, decimalNumbers: true, connectTimeout: 10000 }
}

class WorkspaceDatabase {
  constructor (directory, { databaseName } = {}) {
    this.configuration = readDatabaseConfig()
    if (databaseName) {
      if (!/^qijie_workspace_test_[a-zA-Z0-9_]+$/.test(databaseName)) throw new Error('验收数据库必须使用独立的测试库名称。')
      this.configuration.database = databaseName
    }
    this.context = new AsyncLocalStorage()
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 })
    const keyFile = path.join(directory, 'encryption.key')
    try { this.key = fs.readFileSync(keyFile) } catch (error) {
      if (error.code !== 'ENOENT') throw error
      fs.writeFileSync(keyFile, crypto.randomBytes(32), { flag: 'wx', mode: 0o600 })
      this.key = fs.readFileSync(keyFile)
    }
    if (this.key.length !== 32) throw new Error('服务端数据加密密钥无效，请恢复原密钥。')
    this.authAccounts = new AuthAccountStore(this, UserError)
    this.ready = this.initialize()
  }
  async initialize () {
    const { database, ...connectionConfig } = this.configuration
    const connection = await mysql.createConnection(connectionConfig)
    try { await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`) } finally { await connection.end() }
    this.pool = mysql.createPool({ ...this.configuration, connectionLimit: 8, waitForConnections: true, queueLimit: 100 })
    const tables = [
      'CREATE TABLE IF NOT EXISTS platform_release_state(id INT PRIMARY KEY,release_version VARCHAR(32) NOT NULL,manifest JSON)',
      'CREATE TABLE IF NOT EXISTS platform_releases(id BIGINT AUTO_INCREMENT PRIMARY KEY,component VARCHAR(16) NOT NULL,version VARCHAR(32) NOT NULL,sha256 CHAR(64) NOT NULL,file_name VARCHAR(160) NOT NULL UNIQUE,size_bytes INT NOT NULL,published_by VARCHAR(36) NOT NULL,created_at BIGINT NOT NULL,INDEX platform_release_component(component,id))',
      'CREATE TABLE IF NOT EXISTS users(id VARCHAR(36) PRIMARY KEY,email VARCHAR(254) NOT NULL UNIQUE,name VARCHAR(160) NOT NULL,password_hash VARCHAR(256) NOT NULL,created_at BIGINT NOT NULL,email_verified_at BIGINT)',
      'CREATE TABLE IF NOT EXISTS workspaces(id VARCHAR(36) PRIMARY KEY,name VARCHAR(160) NOT NULL,owner_id VARCHAR(36) NOT NULL,INDEX workspaces_owner(owner_id))',
      'CREATE TABLE IF NOT EXISTS members(id VARCHAR(36) PRIMARY KEY,workspace_id VARCHAR(36) NOT NULL,user_id VARCHAR(36) NOT NULL,role VARCHAR(16) NOT NULL,scope JSON NOT NULL,UNIQUE(workspace_id,user_id),INDEX members_user(user_id))',
      'CREATE TABLE IF NOT EXISTS sessions(hash VARCHAR(64) PRIMARY KEY,user_id VARCHAR(36) NOT NULL,csrf VARCHAR(48) NOT NULL,expires_at BIGINT NOT NULL,INDEX sessions_user(user_id))',
      'CREATE TABLE IF NOT EXISTS fingerprints(id VARCHAR(36) PRIMARY KEY,workspace_id VARCHAR(36) NOT NULL,name VARCHAR(160) NOT NULL,version INT NOT NULL,created_by VARCHAR(36) NOT NULL,created_at BIGINT NOT NULL,updated_at BIGINT NOT NULL,deleted_at BIGINT,INDEX fingerprints_workspace(workspace_id,deleted_at),INDEX fingerprints_creator(created_by))',
      'CREATE TABLE IF NOT EXISTS fingerprint_versions(fingerprint_id VARCHAR(36) NOT NULL,version INT NOT NULL,profile JSON NOT NULL,created_by VARCHAR(36) NOT NULL,created_at BIGINT NOT NULL,PRIMARY KEY(fingerprint_id,version),INDEX fingerprint_versions_creator(created_by))',
      'CREATE TABLE IF NOT EXISTS records(kind VARCHAR(32) NOT NULL,id VARCHAR(64) NOT NULL,workspace_id VARCHAR(36) NOT NULL,data JSON NOT NULL,revision INT NOT NULL,deleted_at BIGINT,PRIMARY KEY(kind,id),INDEX records_workspace(workspace_id,kind,deleted_at))',
      'CREATE TABLE IF NOT EXISTS registration_codes(email VARCHAR(254) PRIMARY KEY,generation VARCHAR(36) NOT NULL,code_hash VARCHAR(64) NOT NULL,expires_at BIGINT NOT NULL,resend_after BIGINT NOT NULL,attempts INT NOT NULL,delivered TINYINT NOT NULL,consumed_at BIGINT)',
      'CREATE TABLE IF NOT EXISTS registration_limits(scope_key VARCHAR(80) PRIMARY KEY,window_start BIGINT NOT NULL,requests INT NOT NULL)',
      'CREATE TABLE IF NOT EXISTS billing_orders(id VARCHAR(32) PRIMARY KEY,workspace_id VARCHAR(36) NOT NULL,created_by VARCHAR(36) NOT NULL,request_id VARCHAR(36) NOT NULL,provider VARCHAR(24) NOT NULL,plan JSON NOT NULL,amount INT NOT NULL,currency VARCHAR(3) NOT NULL,status VARCHAR(16) NOT NULL,code_url TEXT,transaction_id VARCHAR(100),created_at BIGINT NOT NULL,expires_at BIGINT NOT NULL,paid_at BIGINT,checked_at BIGINT,UNIQUE(workspace_id,request_id),UNIQUE(provider,transaction_id),INDEX billing_workspace(workspace_id,created_at),INDEX billing_orders_creator(created_by))',
      'CREATE TABLE IF NOT EXISTS billing_subscriptions(workspace_id VARCHAR(36) PRIMARY KEY,plan JSON NOT NULL,starts_at BIGINT NOT NULL,expires_at BIGINT NOT NULL,last_order_id VARCHAR(32) NOT NULL,INDEX billing_subscriptions_last_order(last_order_id))'
    ]
    for (const statement of tables) await this.pool.query(statement + ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4')
    await this.pool.query("INSERT IGNORE INTO platform_release_state VALUES(1,'0.2.0',NULL)")
    const [verifiedColumn] = await this.pool.query("SHOW COLUMNS FROM users LIKE 'email_verified_at'")
    if (!verifiedColumn.length) {
      try { await this.pool.query('ALTER TABLE users ADD COLUMN email_verified_at BIGINT NULL') } catch (error) { if (error.code !== 'ER_DUP_FIELDNAME') throw error }
    }
    await this.migrateFingerprintEncryption()
    await this.authAccounts.initialize()
  }
  encodeFingerprint (profile) { return { format: 'qijie-fingerprint-storage-v1', ciphertext: this.encrypt(JSON.stringify({ purpose: 'fingerprint', profile })) } }
  decodeFingerprint (value) {
    const envelope = parse(value)
    if (envelope?.format !== 'qijie-fingerprint-storage-v1') throw new UserError('指纹密文格式无效，请联系管理员检查数据。', 500)
    try { const data = JSON.parse(this.decrypt(envelope.ciphertext)); if (data.purpose !== 'fingerprint' || !data.profile) throw new Error(); return data.profile } catch { throw new UserError('指纹无法解密，请联系管理员恢复服务端加密密钥。', 500) }
  }
  async migrateFingerprintEncryption () {
    // 在同一事务中迁移旧明文快照，升级不得丢弃已有指纹或改变历史版本。
    const connection = await this.pool.getConnection()
    try {
      await connection.beginTransaction()
      const [existing] = await connection.query("SELECT profile FROM fingerprint_versions WHERE JSON_EXTRACT(profile,'$.format') IS NOT NULL LIMIT 1")
      if (existing.length) this.decodeFingerprint(existing[0].profile)
      const [versions] = await connection.query("SELECT fingerprint_id,version,profile FROM fingerprint_versions WHERE JSON_EXTRACT(profile,'$.format') IS NULL FOR UPDATE")
      for (const row of versions) await connection.execute('UPDATE fingerprint_versions SET profile=? WHERE fingerprint_id=? AND version=?', [JSON.stringify(this.encodeFingerprint(parse(row.profile))), row.fingerprint_id, row.version])
      const [environments] = await connection.query("SELECT id,data FROM records WHERE kind='environments' AND JSON_EXTRACT(data,'$.fingerprint') IS NOT NULL AND JSON_EXTRACT(data,'$.fingerprint.format') IS NULL FOR UPDATE")
      for (const row of environments) { const data = parse(row.data); data.fingerprint = this.encodeFingerprint(data.fingerprint); await connection.execute("UPDATE records SET data=? WHERE kind='environments' AND id=?", [JSON.stringify(data), row.id]) }
      await connection.commit()
    } catch (error) { await connection.rollback(); throw error } finally { connection.release() }
  }
  async execute (statement, parameters = []) {
    await this.ready
    const [result] = await (this.context.getStore() || this.pool).execute(statement, parameters)
    return result
  }
  async transaction (operation) {
    await this.ready
    if (this.context.getStore()) return await operation()
    const connection = await this.pool.getConnection()
    try {
      await connection.beginTransaction()
      const result = await this.context.run(connection, operation)
      await connection.commit()
      return result
    } catch (error) { await connection.rollback(); throw error } finally { connection.release() }
  }
  verificationHash (email, generation, code) { return crypto.createHmac('sha256', this.key).update(`${email}:${generation}:${code}`).digest('hex') }
  async reserveRegistrationCode (email, ipKey, generation, codeHash) {
    return await this.transaction(async () => {
      const now = Date.now()
      for (const [scope, maximum] of [[`ip:${ipKey}`, 20], [`email:${crypto.createHash('sha256').update(email).digest('hex')}`, 5]]) {
        await this.execute('INSERT INTO registration_limits VALUES(?,?,0) ON DUPLICATE KEY UPDATE scope_key=scope_key', [scope, now])
        const limit = (await this.execute('SELECT * FROM registration_limits WHERE scope_key=? FOR UPDATE', [scope]))[0]
        const expired = now - limit.window_start >= 3600000
        if (!expired && limit.requests >= maximum) throw new UserError('验证码发送较频繁，请稍后再试。', 429)
        await this.execute('UPDATE registration_limits SET window_start=?,requests=? WHERE scope_key=?', [expired ? now : limit.window_start, expired ? 1 : limit.requests + 1, scope])
      }
      const current = (await this.execute('SELECT * FROM registration_codes WHERE email=? FOR UPDATE', [email]))[0]
      if (current?.resend_after > now) throw new UserError('验证码已发送，请六十秒后再试。', 429)
      await this.execute('INSERT INTO registration_codes VALUES(?,?,?,?,?,0,0,NULL) ON DUPLICATE KEY UPDATE generation=VALUES(generation),code_hash=VALUES(code_hash),expires_at=VALUES(expires_at),resend_after=VALUES(resend_after),attempts=0,delivered=0,consumed_at=NULL', [email, generation, codeHash, now + 300000, now + 60000])
    })
  }
  async markRegistrationCode (email, generation, delivered) {
    await this.execute('UPDATE registration_codes SET delivered=?,resend_after=IF(?,resend_after,?) WHERE email=? AND generation=? AND consumed_at IS NULL', [delivered ? 1 : 0, delivered ? 1 : 0, Date.now() + 5000, email, generation])
  }
  async register ({ email, name, password, workspaceName, verificationCode }) {
    try {
      const result = await this.transaction(async () => {
        if (await this.userByEmail(email)) throw new UserError('该邮箱已注册，请直接登录。', 409)
        const verification = (await this.execute('SELECT * FROM registration_codes WHERE email=? FOR UPDATE', [email]))[0]
        if (!verification || !verification.delivered || verification.consumed_at || verification.expires_at <= Date.now()) throw new UserError('验证码无效或已过期，请重新获取。')
        if (verification.attempts >= 5) throw new UserError('验证码错误次数过多，请重新获取。', 429)
        const submitted = this.verificationHash(email, verification.generation, String(verificationCode || ''))
        if (!crypto.timingSafeEqual(Buffer.from(submitted, 'hex'), Buffer.from(verification.code_hash, 'hex'))) {
          await this.execute('UPDATE registration_codes SET attempts=attempts+1 WHERE email=?', [email])
          return { verificationError: '验证码不正确，请检查邮箱后重试。' }
        }
        const userId = crypto.randomUUID(); const workspaceId = crypto.randomUUID()
        await this.execute('INSERT INTO users(id,email,name,password_hash,created_at,email_verified_at) VALUES(?,?,?,?,?,?)', [userId, email, name, hashPassword(password), Date.now(), Date.now()])
        await this.execute('INSERT INTO workspaces VALUES(?,?,?)', [workspaceId, workspaceName, userId])
        await this.execute('INSERT INTO members VALUES(?,?,?,?,?)', [crypto.randomUUID(), workspaceId, userId, 'owner', JSON.stringify({ mode: 'all', ids: [] })])
        await this.execute('UPDATE registration_codes SET consumed_at=? WHERE email=?', [Date.now(), email])
        return await this.user(userId)
      })
      if (result.verificationError) throw new UserError(result.verificationError)
      return result
    } catch (error) { if (error.code === 'ER_DUP_ENTRY') throw new UserError('该邮箱已注册，请直接登录。', 409); throw error }
  }
  async user (id) { return (await this.execute('SELECT id,email,name FROM users WHERE id=?', [id]))[0] || null }
  async userByEmail (email) { return (await this.execute('SELECT * FROM users WHERE email=?', [email]))[0] || null }
  async workspaces (userId) { return await this.execute('SELECT w.*,m.role FROM workspaces w JOIN members m ON w.id=m.workspace_id WHERE m.user_id=?', [userId]) }
  async membership (workspaceId, userId) {
    const member = (await this.execute('SELECT * FROM members WHERE workspace_id=? AND user_id=?', [workspaceId, userId]))[0]
    if (!member) throw new UserError('你没有该团队的访问权限。', 403)
    return { ...member, scope: parse(member.scope) }
  }
  async members (workspaceId) { return (await this.execute('SELECT m.id,m.user_id AS userId,m.role,m.scope,u.name,u.email FROM members m JOIN users u ON m.user_id=u.id WHERE m.workspace_id=?', [workspaceId])).map(item => ({ ...item, scope: parse(item.scope) })) }
  canAccess (member, id) { return ['owner', 'admin'].includes(member.role) || member.scope.mode === 'all' || member.scope.ids.includes(id) }
  assertWrite (member, admin = false) { if (!['owner', 'admin', ...(admin ? [] : ['operator'])].includes(member.role)) throw new UserError('你没有此操作权限。', 403) }
  async session (token) {
    if (!token) return null
    return (await this.execute('SELECT * FROM sessions WHERE hash=? AND expires_at>?', [crypto.createHash('sha256').update(token).digest('hex'), Date.now()]))[0] || null
  }
  async createSession (userId) {
    const token = crypto.randomBytes(32).toString('base64url'); const csrf = crypto.randomBytes(24).toString('hex')
    await this.execute('DELETE FROM sessions WHERE expires_at<=?', [Date.now()])
    await this.execute('INSERT INTO sessions VALUES(?,?,?,?)', [crypto.createHash('sha256').update(token).digest('hex'), userId, csrf, Date.now() + 86400000])
    return { token, csrf }
  }
  async logout (token) { await this.execute('DELETE FROM sessions WHERE hash=?', [crypto.createHash('sha256').update(token).digest('hex')]) }
  async changePassword (userId, currentPassword, newPassword, currentSessionHash) {
    return await this.transaction(async () => {
      const user = (await this.execute('SELECT password_hash FROM users WHERE id=? FOR UPDATE', [userId]))[0]
      if (!user) throw new UserError('账号不存在。', 404)
      if (!verifyPassword(currentPassword, user.password_hash)) throw new UserError('当前密码不正确。', 401)
      if (verifyPassword(newPassword, user.password_hash)) throw new UserError('新密码不能与当前密码相同。')
      await this.execute('UPDATE users SET password_hash=? WHERE id=?', [hashPassword(newPassword), userId])
      await this.execute('DELETE FROM sessions WHERE user_id=? AND hash<>?', [userId, currentSessionHash])
    })
  }
  async list (kind, workspaceId) {
    if (kind === 'accounts') return await this.authAccounts.list(workspaceId)
    return (await this.execute('SELECT id,data,revision FROM records WHERE kind=? AND workspace_id=? AND deleted_at IS NULL', [kind, workspaceId])).map(row => ({ ...parse(row.data), id: row.id, revision: row.revision }))
  }
  async get (kind, workspaceId, id) {
    if (kind === 'accounts') return await this.authAccounts.get(workspaceId, id)
    const row = (await this.execute('SELECT id,data,revision FROM records WHERE kind=? AND workspace_id=? AND id=? AND deleted_at IS NULL', [kind, workspaceId, id]))[0]
    return row ? { ...parse(row.data), id: row.id, revision: row.revision } : null
  }
  async put (kind, workspaceId, id, value, expectedRevision) {
    if (kind === 'accounts') return await this.authAccounts.updateSummary(workspaceId, id, value, expectedRevision)
    try {
      return await this.transaction(async () => {
        const current = (await this.execute('SELECT * FROM records WHERE kind=? AND id=? FOR UPDATE', [kind, id]))[0]
        if (current && (current.workspace_id !== workspaceId || current.deleted_at)) throw new UserError('记录不存在或无法访问。', 404)
        if ((current && expectedRevision !== current.revision) || (!current && expectedRevision !== null)) throw new UserError('记录已更新，请重新加载后再保存。', 409)
        const revision = (current?.revision || 0) + 1
        if (current) await this.execute('UPDATE records SET data=?,revision=? WHERE kind=? AND id=? AND workspace_id=?', [JSON.stringify(value), revision, kind, id, workspaceId])
        else await this.execute('INSERT INTO records(kind,id,workspace_id,data,revision) VALUES(?,?,?,?,?)', [kind, id, workspaceId, JSON.stringify(value), revision])
        return { ...value, id, revision }
      })
    } catch (error) { if (['ER_DUP_ENTRY', 'ER_LOCK_DEADLOCK'].includes(error.code)) throw new UserError('记录被其他操作更新，请刷新后重试。', 409); throw error }
  }
  async remove (kind, workspaceId, id) {
    if (kind === 'accounts') return await this.authAccounts.archive(workspaceId, id)
    await this.execute('UPDATE records SET deleted_at=? WHERE kind=? AND workspace_id=? AND id=?', [Date.now(), kind, workspaceId, id])
  }
  async fingerprints (workspaceId) { return (await this.execute('SELECT f.*,v.profile FROM fingerprints f JOIN fingerprint_versions v ON f.id=v.fingerprint_id AND f.version=v.version WHERE f.workspace_id=? AND f.deleted_at IS NULL', [workspaceId])).map(row => ({ id: row.id, name: row.name, version: row.version, createdAt: row.created_at, updatedAt: row.updated_at, profile: this.decodeFingerprint(row.profile) })) }
  async fingerprint (workspaceId, id, version) { const row = (await this.execute('SELECT f.*,v.profile FROM fingerprints f JOIN fingerprint_versions v ON f.id=v.fingerprint_id AND v.version=? WHERE f.workspace_id=? AND f.id=? AND f.deleted_at IS NULL', [version, workspaceId, id]))[0]; return row ? { id: row.id, name: row.name, version, profile: this.decodeFingerprint(row.profile) } : null }
  async saveFingerprint (workspaceId, userId, { id = crypto.randomUUID(), name, profile, expectedVersion = null }) {
    try {
      return await this.transaction(async () => {
        const current = (await this.execute('SELECT * FROM fingerprints WHERE id=? FOR UPDATE', [id]))[0]
        if (current && (current.workspace_id !== workspaceId || current.deleted_at)) throw new UserError('指纹不存在或无法访问。', 404)
        if ((current && expectedVersion !== current.version) || (!current && expectedVersion !== null)) throw new UserError('指纹版本已变化，请重新加载后再保存。', 409)
        const version = (current?.version || 0) + 1; const now = Date.now()
        if (current) await this.execute('UPDATE fingerprints SET name=?,version=?,updated_at=? WHERE id=? AND workspace_id=?', [name, version, now, id, workspaceId])
        else await this.execute('INSERT INTO fingerprints VALUES(?,?,?,?,?,?,?,NULL)', [id, workspaceId, name, version, userId, now, now])
        await this.execute('INSERT INTO fingerprint_versions VALUES(?,?,?,?,?)', [id, version, JSON.stringify(this.encodeFingerprint(profile)), userId, now])
        return await this.fingerprint(workspaceId, id, version)
      })
    } catch (error) { if (['ER_DUP_ENTRY', 'ER_LOCK_DEADLOCK'].includes(error.code)) throw new UserError('指纹被其他操作更新，请刷新后重试。', 409); throw error }
  }
  encrypt (text) { const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv); return Buffer.concat([iv, cipher.update(text), cipher.final(), cipher.getAuthTag()]).toString('base64') }
  decrypt (value) { const bytes = Buffer.from(value, 'base64'); const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, bytes.subarray(0, 12)); decipher.setAuthTag(bytes.subarray(-16)); return Buffer.concat([decipher.update(bytes.subarray(12, -16)), decipher.final()]).toString('utf8') }
  async readAccountSession (workspaceId, userId, accountId) {
    return await this.transaction(async () => {
      await this.execute('SELECT id FROM workspaces WHERE id=? FOR UPDATE', [workspaceId])
      const row = (await this.execute('SELECT * FROM members WHERE workspace_id=? AND user_id=? FOR UPDATE', [workspaceId, userId]))[0]
      if (!row) throw new UserError('你没有该团队的访问权限。', 403)
      const member = { ...row, scope: parse(row.scope) }; this.assertWrite(member)
      const account = await this.authAccounts.get(workspaceId, accountId, { lock: true })
      if (!account || !this.canAccess(member, accountId)) throw new UserError('账号不存在或无法访问。', 404)
      const environment = (await this.execute("SELECT id FROM records WHERE kind='environments' AND workspace_id=? AND id=? AND deleted_at IS NULL FOR UPDATE", [workspaceId, account.environmentId]))[0]
      if (!environment || !this.canAccess(member, environment.id)) throw new UserError('账号环境不存在或无法访问。', 403)
      const snapshot = await this.authAccounts.read(workspaceId, accountId)
      if (!snapshot) throw new UserError('账号会话尚未保存，请重新授权。', 409)
      return snapshot
    })
  }
  async close () { await this.ready; await this.pool.end() }
}

module.exports = { WorkspaceDatabase, UserError, readDatabaseConfig }
