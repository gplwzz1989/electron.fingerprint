const crypto = require('node:crypto')
const { UserError } = require('./mysql-database')

class MediaAuthorizations {
  constructor (database, platformService) { this.db = database; this.service = platformService }
  available () { try { return Boolean(this.service?.verifyAuthorization && this.service.runtime()) } catch { return false } }
  public (task) { return { id: task.id, platform: task.platform, environmentId: task.environmentId, publicKey: task.publicKey, expiresAt: task.expiresAt, status: ['waiting', 'review'].includes(task.status) && task.expiresAt <= Date.now() ? 'expired' : task.status, identity: task.identity, accountId: task.accountId, scriptVersion: task.scriptVersion } }
  async access (workspaceId, userId, task, current) {
    const member = current ? current.member : await this.db.membership(workspaceId, userId); this.db.assertWrite(member)
    const environment = current ? current.environment : await this.db.get('environments', workspaceId, task.environmentId)
    if (task.userId !== userId || !environment || !this.db.canAccess(member, environment.id)) throw new UserError('无法访问此授权任务。', 403)
    if (task.targetAccountId && !this.db.canAccess(member, task.targetAccountId)) throw new UserError('无法更新此账号。', 403)
    return member
  }
  assertReauthorizable (account) {
    if (!['invalid', 'expired'].includes(account?.status)) throw new UserError('账号授权仍有效，无需重新授权。', 409)
  }
  assertActive (task) {
    if (task.expiresAt <= Date.now() || task.status === 'cancelled') throw new UserError('授权已结束，请重新开始。', 409)
  }
  async locked (workspaceId, userId, id, operation) {
    return await this.db.transaction(async () => {
      // 先取得当前行及权限锁，再建立一致性读快照，避免核验耗时期间的撤权或环境删除被旧快照掩盖。
      await this.db.execute('SELECT id FROM workspaces WHERE id=? FOR UPDATE', [workspaceId])
      const row = (await this.db.execute("SELECT id,data,revision FROM records WHERE kind='authorizations' AND id=? AND workspace_id=? AND deleted_at IS NULL FOR UPDATE", [id, workspaceId]))[0]
      if (!row) throw new UserError('授权任务不存在。', 404)
      const task = { ...(typeof row.data === 'string' ? JSON.parse(row.data) : row.data), id: row.id, revision: row.revision }
      const memberRow = (await this.db.execute('SELECT * FROM members WHERE workspace_id=? AND user_id=? FOR UPDATE', [workspaceId, userId]))[0]
      if (!memberRow) throw new UserError('你没有该团队的访问权限。', 403)
      const member = { ...memberRow, scope: typeof memberRow.scope === 'string' ? JSON.parse(memberRow.scope) : memberRow.scope }
      const environmentRow = (await this.db.execute("SELECT id,data,deleted_at FROM records WHERE kind='environments' AND id=? AND workspace_id=? FOR UPDATE", [task.environmentId, workspaceId]))[0]
      const environment = environmentRow && !environmentRow.deleted_at ? { ...(typeof environmentRow.data === 'string' ? JSON.parse(environmentRow.data) : environmentRow.data), id: environmentRow.id } : null
      await this.access(workspaceId, userId, task, { member, environment })
      return await operation(task, member, environment)
    })
  }
  async begin (workspaceId, userId, body) {
    if (!this.available()) throw new UserError('平台授权服务尚未配置，请联系管理员。', 503)
    if (!body || typeof body.environmentId !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(body.environmentId)) throw new UserError('请选择有效的独立浏览器环境。')
    if (body.accountId !== undefined && (typeof body.accountId !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(body.accountId))) throw new UserError('原账号标识无效，请从账号列表重新进入。')
    const platform = this.service.catalog.find(item => item.key === body.platform)
    if (!platform) throw new UserError('该平台不在系统支持范围内。')
    const task = { id: crypto.randomUUID(), userId, platform, environmentId: body.environmentId, targetAccountId: body.accountId || null, status: 'waiting', expiresAt: Date.now() + 600000, scriptVersion: this.service.runtime().manifest.version }
    await this.access(workspaceId, userId, task)
    if (task.targetAccountId) {
      const account = await this.db.get('accounts', workspaceId, task.targetAccountId)
      if (!account || account.platform !== platform.key || account.environmentId !== body.environmentId) throw new UserError('重新授权的账号与环境不匹配。')
      this.assertReauthorizable(account)
    }
    const keys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } })
    task.publicKey = keys.publicKey; task.privateKey = this.db.encrypt(keys.privateKey)
    await this.db.put('authorizations', workspaceId, task.id, task, null)
    return this.public(task)
  }
  async handle (workspaceId, userId, id, action, body) {
    let task = await this.db.get('authorizations', workspaceId, id)
    if (!task) throw new UserError('授权任务不存在。', 404)
    await this.access(workspaceId, userId, task)
    if (action && !['complete', 'confirm', 'cancel'].includes(action)) throw new UserError('不支持此授权操作。')
    if (!action || task.status === 'saved') return this.public(task)
    this.assertActive(task)
    if (action === 'cancel') {
      return await this.locked(workspaceId, userId, id, async current => {
        if (current.status === 'saved') return this.public(current)
        this.assertActive(current)
        await this.db.mediaSessions.remove(workspaceId, id, 'authorization')
        return this.public(await this.db.put('authorizations', workspaceId, id, { ...current, status: 'cancelled', privateKey: null, credential: null }, current.revision))
      })
    }
    if (action === 'complete' && task.status === 'waiting') {
      let snapshot
      try {
        const key = crypto.privateDecrypt({ key: this.db.decrypt(task.privateKey), oaepHash: 'sha256' }, Buffer.from(body.wrappedKey, 'base64'))
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(body.iv, 'base64')); decipher.setAAD(Buffer.from(id)); decipher.setAuthTag(Buffer.from(body.tag, 'base64'))
        snapshot = JSON.parse(Buffer.concat([decipher.update(Buffer.from(body.ciphertext, 'base64')), decipher.final()]).toString('utf8'))
        if (snapshot.operationId !== id) throw new Error()
      } catch { throw new UserError('授权数据校验失败，请重新开始。') }
      let verified; let timer
      try { verified = await Promise.race([this.service.verifyAuthorization(task.platform.key, snapshot), new Promise((resolve, reject) => { timer = setTimeout(() => reject(new Error()), 45000); timer.unref() })]) } catch { throw new UserError('平台身份核验失败，请确认已登录并重试。', 422) } finally { clearTimeout(timer) }
      if (typeof verified?.platformUserId !== 'string' || !verified.platformUserId.trim() || verified.platformUserId.length > 256 || !verified.session || typeof verified.session !== 'object' || Array.isArray(verified.session)) throw new UserError('平台未返回完整身份或会话。', 422)
      return await this.locked(workspaceId, userId, id, async current => {
        this.assertActive(current)
        if (['review', 'saved'].includes(current.status)) return this.public(current)
        if (current.status !== 'waiting') throw new UserError('授权状态已变化，请重新开始。', 409)
        if (current.targetAccountId) {
          const account = await this.db.get('accounts', workspaceId, current.targetAccountId)
          if (!account || account.platform !== current.platform.key || account.environmentId !== current.environmentId || account.platformUserId !== verified.platformUserId) throw new UserError('登录身份与原账号不一致，请登录原账号。', 409)
          this.assertReauthorizable(account)
        }
        await this.db.mediaSessions.write(workspaceId, id, 'authorization', verified.session)
        return this.public(await this.db.put('authorizations', workspaceId, id, { ...current, privateKey: null, status: 'review', identity: { platformUserId: verified.platformUserId, name: verified.name, avatar: verified.avatar }, credential: null, sessionStorage: 'relational-v1' }, current.revision))
      })
    }
    if (action === 'confirm') {
      return await this.locked(workspaceId, userId, id, async (current, member, environment) => {
        task = current
        if (task.status === 'saved') return this.public(task)
        if (task.status !== 'review' || task.expiresAt <= Date.now()) throw new UserError('请先完成平台身份核验。', 409)
        const accountId = crypto.createHash('sha256').update(JSON.stringify([workspaceId, task.platform.key, task.identity.platformUserId])).digest('hex').slice(0, 48)
        const account = await this.db.get('accounts', workspaceId, accountId)
        if (task.targetAccountId && (task.targetAccountId !== accountId || !account || account.environmentId !== task.environmentId)) throw new UserError('原账号记录已变化，请重新授权。', 409)
        if (account) this.assertReauthorizable(account)
        if (account && !this.db.canAccess(member, accountId)) throw new UserError('此账号已在团队中，请联系管理员分配权限。', 403)
        if ((await this.db.list('accounts', workspaceId)).some(item => item.environmentId === task.environmentId && item.platform === task.platform.key && item.id !== accountId)) throw new UserError('此环境已绑定同平台的其他账号，请使用独立环境。', 409)
        const snapshot = await this.db.mediaSessions.read(workspaceId, id, 'authorization')
        if (!snapshot) throw new UserError('授权会话数据不存在，请重新开始。', 409)
        await this.db.mediaSessions.write(workspaceId, accountId, 'account', snapshot)
        await this.db.mediaSessions.remove(workspaceId, id, 'authorization')
        await this.db.put('accounts', workspaceId, accountId, { ...task.identity, platform: task.platform.key, platformName: task.platform.name, environmentId: task.environmentId, environmentName: environment.name, status: 'valid', checkedAt: Date.now(), updatedAt: Date.now() }, account?.revision ?? null)
        // 受限操作成员创建的账号也需纳入其原有资源范围，保证保存后能在列表中查看；不扩大其他资源权限。
        if (!account && member.role === 'operator' && member.scope.mode === 'selected') {
          await this.db.execute('UPDATE members SET scope=? WHERE workspace_id=? AND user_id=?', [JSON.stringify({ ...member.scope, ids: [...new Set([...member.scope.ids, accountId])] }), workspaceId, userId])
        }
        task = await this.db.put('authorizations', workspaceId, id, { ...task, status: 'saved', accountId, credential: null }, task.revision)
        return this.public(task)
      })
    }
    return this.public(task)
  }
}
module.exports = { MediaAuthorizations }
