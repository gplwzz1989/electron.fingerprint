const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const { AsyncLocalStorage } = require('node:async_hooks')
const { Prisma, PrismaClient } = require('@prisma/client')
const { hashPassword, verifyPassword } = require('./auth')
const { readServerConfig } = require('./server-config')
const { AuthAccountStore } = require('./auth-account-store')

class UserError extends Error {
  constructor (message, status = 400) { super(message); this.status = status }
}
const parse = value => typeof value === 'string' ? JSON.parse(value) : value
const normalize = value => {
  if (typeof value === 'bigint') return Number(value)
  if (Array.isArray(value)) return value.map(normalize)
  if (value && typeof value === 'object' && !(value instanceof Date)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalize(item)]))
  return value instanceof Date ? value.getTime() : value
}
const toBigInt = value => typeof value === 'bigint' ? value : BigInt(Math.trunc(Number(value)))
function databaseUrl (configuration) {
  const hostname = configuration.host.includes(':') && !configuration.host.startsWith('[') ? `[${configuration.host}]` : configuration.host
  return `mysql://${encodeURIComponent(configuration.user)}:${encodeURIComponent(configuration.password)}@${hostname}:${configuration.port}/${configuration.database}?connection_limit=8&connect_timeout=10`
}

function readDatabaseConfig (file = process.env.SAAS_CONFIG_FILE || path.join(__dirname, `../.env.${process.env.SAAS_ENV || 'dev'}`)) {
  const config = readServerConfig(file)
  if (!config.DB_HOST || !config.DB_USER || !config.DB_NAME || !config.DB_PORT || config.DB_PASSWORD === undefined) throw new Error('数据库配置不完整，请检查服务端环境配置文件。')
  if (!/^[a-zA-Z0-9_]+$/.test(config.DB_NAME) || !Number.isInteger(Number(config.DB_PORT))) throw new Error('数据库名称或端口配置无效。')
  return { host: config.DB_HOST, port: Number(config.DB_PORT), user: config.DB_USER, password: config.DB_PASSWORD, database: config.DB_NAME }
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
    const url = databaseUrl(this.configuration)
    this.prisma = new PrismaClient({ datasources: { db: { url } } })
    this.authAccounts = new AuthAccountStore(this, UserError)
    this.ready = this.initialize()
  }
  async initialize () {
    try { await this.prisma.$connect() } catch { throw new Error('无法连接 Prisma 配置的 MySQL 数据库。') }
    try {
      await this.prisma.platformReleaseState.upsert({ where: { id: 1 }, create: { id: 1, releaseVersion: '0.2.0', manifest: Prisma.DbNull }, update: {} })
    } catch (error) {
      if (error.code === 'P2021') throw new Error('Prisma 数据库结构尚未同步，请执行 `npm run prisma:sync`。')
      throw error
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
    // 保留已有指纹快照并加密；只通过 Prisma 模型读取和更新。
    await this.prisma.$transaction(async transaction => await this.context.run(transaction, async () => {
      const versions = await this.client.fingerprintVersion.findMany()
      for (const row of versions) {
        const profile = parse(row.profile)
        if (profile?.format === 'qijie-fingerprint-storage-v1') this.decodeFingerprint(profile)
        else await this.client.fingerprintVersion.update({ where: { fingerprintId_version: { fingerprintId: row.fingerprintId, version: row.version } }, data: { profile: this.encodeFingerprint(profile) } })
      }
      const environments = await this.client.record.findMany({ where: { kind: 'environments', deletedAt: null } })
      for (const row of environments) {
        const data = parse(row.data)
        if (!data?.fingerprint || data.fingerprint.format === 'qijie-fingerprint-storage-v1') continue
        await this.client.record.update({ where: { kind_id: { kind: row.kind, id: row.id } }, data: { data: { ...data, fingerprint: this.encodeFingerprint(data.fingerprint) } } })
      }
    }), { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
  }
  get client () { return this.context.getStore() || this.prisma }
  async transaction (operation) {
    await this.ready
    if (this.context.getStore()) return await operation()
    return await this.prisma.$transaction(async transaction => await this.context.run(transaction, operation), { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
  }
  verificationHash (email, generation, code) { return crypto.createHmac('sha256', this.key).update(`${email}:${generation}:${code}`).digest('hex') }
  async reserveRegistrationCode (email, ipKey, generation, codeHash) {
    return await this.transaction(async () => {
      const now = Date.now()
      for (const [scope, maximum] of [[`ip:${ipKey}`, 20], [`email:${crypto.createHash('sha256').update(email).digest('hex')}`, 5]]) {
        const limit = await this.client.registrationLimit.upsert({ where: { scopeKey: scope }, create: { scopeKey: scope, windowStart: toBigInt(now), requests: 0 }, update: {} })
        const expired = now - Number(limit.windowStart) >= 3600000
        if (!expired && limit.requests >= maximum) throw new UserError('验证码发送较频繁，请稍后再试。', 429)
        await this.client.registrationLimit.update({ where: { scopeKey: scope }, data: { windowStart: toBigInt(expired ? now : Number(limit.windowStart)), requests: expired ? 1 : limit.requests + 1 } })
      }
      const current = await this.client.registrationCode.findUnique({ where: { email } })
      if (current && Number(current.resendAfter) > now) throw new UserError('验证码已发送，请六十秒后再试。', 429)
      await this.client.registrationCode.upsert({
        where: { email },
        create: { email, generation, codeHash, expiresAt: toBigInt(now + 300000), resendAfter: toBigInt(now + 60000), attempts: 0, delivered: 0, consumedAt: null },
        update: { generation, codeHash, expiresAt: toBigInt(now + 300000), resendAfter: toBigInt(now + 60000), attempts: 0, delivered: 0, consumedAt: null }
      })
    })
  }
  async markRegistrationCode (email, generation, delivered) {
    const current = await this.client.registrationCode.findUnique({ where: { email } })
    if (!current || current.generation !== generation || current.consumedAt !== null) return
    await this.client.registrationCode.update({ where: { email }, data: { delivered: delivered ? 1 : 0, resendAfter: delivered ? current.resendAfter : toBigInt(Date.now() + 5000) } })
  }
  async register ({ email, name, password, workspaceName, verificationCode }) {
    try {
      const result = await this.transaction(async () => {
        if (await this.userByEmail(email)) throw new UserError('该邮箱已注册，请直接登录。', 409)
        const verification = await this.client.registrationCode.findUnique({ where: { email } })
        if (!verification || !verification.delivered || verification.consumedAt !== null || Number(verification.expiresAt) <= Date.now()) throw new UserError('验证码无效或已过期，请重新获取。')
        if (verification.attempts >= 5) throw new UserError('验证码错误次数过多，请重新获取。', 429)
        const submitted = this.verificationHash(email, verification.generation, String(verificationCode || ''))
        if (!crypto.timingSafeEqual(Buffer.from(submitted, 'hex'), Buffer.from(verification.codeHash, 'hex'))) {
          await this.client.registrationCode.update({ where: { email }, data: { attempts: { increment: 1 } } })
          return { verificationError: '验证码不正确，请检查邮箱后重试。' }
        }
        const userId = crypto.randomUUID(); const workspaceId = crypto.randomUUID()
        const now = toBigInt(Date.now())
        await this.client.user.create({ data: { id: userId, email, name, passwordHash: hashPassword(password), createdAt: now, emailVerifiedAt: now } })
        await this.client.workspace.create({ data: { id: workspaceId, name: workspaceName, ownerId: userId } })
        await this.client.member.create({ data: { id: crypto.randomUUID(), workspaceId, userId, role: 'owner', scope: { mode: 'all', ids: [] } } })
        await this.client.registrationCode.update({ where: { email }, data: { consumedAt: now } })
        return await this.user(userId)
      })
      if (result.verificationError) throw new UserError(result.verificationError)
      return result
    } catch (error) { if (error.code === 'P2002') throw new UserError('该邮箱已注册，请直接登录。', 409); throw error }
  }
  async user (id) { return normalize(await this.client.user.findUnique({ where: { id }, select: { id: true, email: true, name: true } })) }
  async userByEmail (email) { return normalize(await this.client.user.findUnique({ where: { email } })) }
  async workspaces (userId) {
    const members = await this.client.member.findMany({ where: { userId }, select: { workspaceId: true, role: true } })
    if (!members.length) return []
    const roles = new Map(members.map(member => [member.workspaceId, member.role]))
    const workspaces = await this.client.workspace.findMany({ where: { id: { in: members.map(member => member.workspaceId) } } })
    return normalize(workspaces).map(workspace => ({ ...workspace, role: roles.get(workspace.id) }))
  }
  async membership (workspaceId, userId) {
    const member = await this.client.member.findUnique({ where: { workspaceId_userId: { workspaceId, userId } } })
    if (!member) throw new UserError('你没有该团队的访问权限。', 403)
    return normalize(member)
  }
  async members (workspaceId) {
    const members = await this.client.member.findMany({ where: { workspaceId } })
    if (!members.length) return []
    const users = await this.client.user.findMany({ where: { id: { in: members.map(member => member.userId) } }, select: { id: true, name: true, email: true } })
    const byId = new Map(users.map(user => [user.id, user]))
    return normalize(members).map(member => ({ id: member.id, userId: member.userId, role: member.role, scope: member.scope, name: byId.get(member.userId)?.name, email: byId.get(member.userId)?.email }))
  }
  canAccess (member, id) { return ['owner', 'admin'].includes(member.role) || member.scope.mode === 'all' || member.scope.ids.includes(id) }
  assertWrite (member, admin = false) { if (!['owner', 'admin', ...(admin ? [] : ['operator'])].includes(member.role)) throw new UserError('你没有此操作权限。', 403) }
  async session (token) {
    if (!token) return null
    const session = await this.client.session.findUnique({ where: { hash: crypto.createHash('sha256').update(token).digest('hex') } })
    return session && Number(session.expiresAt) > Date.now() ? normalize(session) : null
  }
  async createSession (userId) {
    const token = crypto.randomBytes(32).toString('base64url'); const csrf = crypto.randomBytes(24).toString('hex')
    const now = Date.now()
    await this.client.session.deleteMany({ where: { expiresAt: { lte: toBigInt(now) } } })
    await this.client.session.create({ data: { hash: crypto.createHash('sha256').update(token).digest('hex'), userId, csrf, expiresAt: toBigInt(now + 86400000) } })
    return { token, csrf }
  }
  async logout (token) { await this.client.session.deleteMany({ where: { hash: crypto.createHash('sha256').update(token).digest('hex') } }) }
  async changePassword (userId, currentPassword, newPassword, currentSessionHash) {
    return await this.transaction(async () => {
      const user = await this.client.user.findUnique({ where: { id: userId }, select: { passwordHash: true } })
      if (!user) throw new UserError('账号不存在。', 404)
      if (!verifyPassword(currentPassword, user.passwordHash)) throw new UserError('当前密码不正确。', 401)
      if (verifyPassword(newPassword, user.passwordHash)) throw new UserError('新密码不能与当前密码相同。')
      await this.client.user.update({ where: { id: userId }, data: { passwordHash: hashPassword(newPassword) } })
      await this.client.session.deleteMany({ where: { userId, hash: { not: currentSessionHash } } })
    })
  }
  async list (kind, workspaceId) {
    if (kind === 'accounts') return await this.authAccounts.list(workspaceId)
    const rows = await this.client.record.findMany({ where: { kind, workspaceId, deletedAt: null } })
    return rows.map(row => ({ ...normalize(parse(row.data)), id: row.id, revision: row.revision }))
  }
  async get (kind, workspaceId, id) {
    if (kind === 'accounts') return await this.authAccounts.get(workspaceId, id)
    const row = await this.client.record.findFirst({ where: { kind, workspaceId, id, deletedAt: null } })
    return row ? { ...normalize(parse(row.data)), id: row.id, revision: row.revision } : null
  }
  async put (kind, workspaceId, id, value, expectedRevision) {
    if (kind === 'accounts') return await this.authAccounts.updateSummary(workspaceId, id, value, expectedRevision)
    try {
      return await this.transaction(async () => {
        const current = await this.client.record.findUnique({ where: { kind_id: { kind, id } } })
        if (current && (current.workspaceId !== workspaceId || current.deletedAt !== null)) throw new UserError('记录不存在或无法访问。', 404)
        if ((current && expectedRevision !== current.revision) || (!current && expectedRevision !== null)) throw new UserError('记录已更新，请重新加载后再保存。', 409)
        const revision = (current?.revision || 0) + 1
        if (current) {
          const result = await this.client.record.updateMany({ where: { kind, id, workspaceId, revision: current.revision, deletedAt: null }, data: { data: value, revision } })
          if (result.count !== 1) throw new UserError('记录已更新，请重新加载后再保存。', 409)
        } else await this.client.record.create({ data: { kind, id, workspaceId, data: value, revision, deletedAt: null } })
        return { ...value, id, revision }
      })
    } catch (error) { if (['P2002', 'P2034'].includes(error.code)) throw new UserError('记录被其他操作更新，请刷新后重试。', 409); throw error }
  }
  async remove (kind, workspaceId, id) {
    if (kind === 'accounts') return await this.authAccounts.archive(workspaceId, id)
    await this.client.record.updateMany({ where: { kind, workspaceId, id, deletedAt: null }, data: { deletedAt: toBigInt(Date.now()) } })
  }
  async fingerprints (workspaceId) {
    const rows = await this.client.fingerprint.findMany({ where: { workspaceId, deletedAt: null } })
    const profiles = await Promise.all(rows.map(row => this.client.fingerprintVersion.findUnique({ where: { fingerprintId_version: { fingerprintId: row.id, version: row.version } } })))
    return rows.flatMap((row, index) => profiles[index] ? [{ id: row.id, name: row.name, version: row.version, createdAt: Number(row.createdAt), updatedAt: Number(row.updatedAt), profile: this.decodeFingerprint(profiles[index].profile) }] : [])
  }
  async fingerprint (workspaceId, id, version) {
    const row = await this.client.fingerprint.findFirst({ where: { workspaceId, id, deletedAt: null } })
    if (!row) return null
    const selectedVersion = version ?? row.version
    const profile = await this.client.fingerprintVersion.findUnique({ where: { fingerprintId_version: { fingerprintId: id, version: selectedVersion } } })
    return profile ? { id: row.id, name: row.name, version: selectedVersion, profile: this.decodeFingerprint(profile.profile) } : null
  }
  async saveFingerprint (workspaceId, userId, { id = crypto.randomUUID(), name, profile, expectedVersion = null }) {
    try {
      return await this.transaction(async () => {
        const current = await this.client.fingerprint.findUnique({ where: { id } })
        if (current && (current.workspaceId !== workspaceId || current.deletedAt !== null)) throw new UserError('指纹不存在或无法访问。', 404)
        if ((current && expectedVersion !== current.version) || (!current && expectedVersion !== null)) throw new UserError('指纹版本已变化，请重新加载后再保存。', 409)
        const version = (current?.version || 0) + 1; const now = Date.now()
        if (current) await this.client.fingerprint.update({ where: { id }, data: { name, version, updatedAt: toBigInt(now) } })
        else await this.client.fingerprint.create({ data: { id, workspaceId, name, version, createdBy: userId, createdAt: toBigInt(now), updatedAt: toBigInt(now), deletedAt: null } })
        await this.client.fingerprintVersion.create({ data: { fingerprintId: id, version, profile: this.encodeFingerprint(profile), createdBy: userId, createdAt: toBigInt(now) } })
        return await this.fingerprint(workspaceId, id, version)
      })
    } catch (error) { if (['P2002', 'P2034'].includes(error.code)) throw new UserError('指纹被其他操作更新，请刷新后重试。', 409); throw error }
  }
  encrypt (text) { const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv); return Buffer.concat([iv, cipher.update(text), cipher.final(), cipher.getAuthTag()]).toString('base64') }
  decrypt (value) { const bytes = Buffer.from(value, 'base64'); const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, bytes.subarray(0, 12)); decipher.setAuthTag(bytes.subarray(-16)); return Buffer.concat([decipher.update(bytes.subarray(12, -16)), decipher.final()]).toString('utf8') }
  async readAccountSession (workspaceId, userId, accountId) {
    return await this.transaction(async () => {
      const row = await this.client.member.findUnique({ where: { workspaceId_userId: { workspaceId, userId } } })
      if (!row) throw new UserError('你没有该团队的访问权限。', 403)
      const member = normalize(row); this.assertWrite(member)
      const account = await this.authAccounts.get(workspaceId, accountId, { lock: true })
      if (!account || !this.canAccess(member, accountId)) throw new UserError('账号不存在或无法访问。', 404)
      const environment = await this.client.record.findUnique({ where: { kind_id: { kind: 'environments', id: account.environmentId } } })
      if (!environment || environment.workspaceId !== workspaceId || environment.deletedAt !== null || !this.canAccess(member, environment.id)) throw new UserError('账号环境不存在或无法访问。', 403)
      const snapshot = await this.authAccounts.read(workspaceId, accountId)
      if (!snapshot) throw new UserError('账号会话尚未保存，请重新授权。', 409)
      return snapshot
    })
  }
  async close () { await this.ready; await this.prisma.$disconnect() }
}

module.exports = { WorkspaceDatabase, UserError, readDatabaseConfig }
