const crypto = require('node:crypto')
const { UserError } = require('./mysql-database')
const { catalog, verifyClientResult } = require('./client-platform-service')

class MediaAuthorizations {
  constructor (database) { this.db = database }
  assertReauthorizable (account) {
    if (!['invalid', 'expired'].includes(account?.status)) throw new UserError('账号授权仍有效，无需重新授权。', 409)
  }
  async lockContext (workspaceId, userId, environmentId) {
    await this.db.execute('SELECT id FROM workspaces WHERE id=? FOR UPDATE', [workspaceId])
    const row = (await this.db.execute('SELECT * FROM members WHERE workspace_id=? AND user_id=? FOR UPDATE', [workspaceId, userId]))[0]
    if (!row) throw new UserError('你没有该团队的访问权限。', 403)
    const member = { ...row, scope: typeof row.scope === 'string' ? JSON.parse(row.scope) : row.scope }
    this.db.assertWrite(member)
    const environmentRow = (await this.db.execute("SELECT id,data,deleted_at FROM records WHERE kind='environments' AND id=? AND workspace_id=? FOR UPDATE", [environmentId, workspaceId]))[0]
    const environment = environmentRow && !environmentRow.deleted_at ? { ...(typeof environmentRow.data === 'string' ? JSON.parse(environmentRow.data) : environmentRow.data), id: environmentRow.id } : null
    if (!environment || !this.db.canAccess(member, environment.id)) throw new UserError('浏览器环境不存在或无法访问。', 403)
    return { member, environment }
  }
  async save (workspaceId, userId, body) {
    if (!body || typeof body.operationId !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(body.operationId) || typeof body.environmentId !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(body.environmentId) || !['authorize', 'reauthorize'].includes(body.mode) || body.mode === 'reauthorize' && (typeof body.accountId !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(body.accountId))) throw new UserError('授权结果信息无效，请重新授权。')
    const platform = catalog.find(item => item.key === body.platform)
    if (!platform) throw new UserError('该平台不在系统支持范围内。')
    let verified
    try { verified = verifyClientResult({ id: body.operationId, mode: body.mode, targetAccountId: body.accountId || null, platform: { key: platform.key } }, body.result) } catch { throw new UserError('平台身份或会话校验失败，请重新授权。', 422) }
    if (verified.outcome !== 'valid' || !verified.session) throw new UserError('平台未确认授权成功，不会保存账号数据。', 422)
    return await this.db.transaction(async () => {
      const { member, environment } = await this.lockContext(workspaceId, userId, body.environmentId)
      const accountId = crypto.createHash('sha256').update(JSON.stringify([workspaceId, platform.key, verified.platformUserId])).digest('hex').slice(0, 48)
      if (body.accountId && body.accountId !== accountId) throw new UserError('原账号标识与平台身份不匹配，请重新授权。', 409)
      let account = await this.db.get('accounts', workspaceId, accountId)
      if (body.accountId && (!account || account.revision !== body.expectedRevision && account.authorizationOperationId !== body.operationId || account.platform !== platform.key || account.platformUserId !== verified.platformUserId || account.environmentId !== body.environmentId)) throw new UserError('原账号记录已变化，请重新授权。', 409)
      if (account && !this.db.canAccess(member, accountId)) throw new UserError('此账号已在团队中，请联系管理员分配权限。', 403)
      if (account?.authorizationOperationId === body.operationId && account.status === 'valid') return { account, outcome: 'valid' }
      // 相同平台身份重新添加时恢复逻辑删除记录，保留原账号标识及历史凭据，不新建重复身份。
      if (!account) {
        const removed = (await this.db.execute("SELECT data,revision FROM records WHERE kind='accounts' AND workspace_id=? AND id=? AND deleted_at IS NOT NULL FOR UPDATE", [workspaceId, accountId]))[0]
        if (removed) {
          const metadata = typeof removed.data === 'string' ? JSON.parse(removed.data) : removed.data
          if (metadata.platform !== platform.key || metadata.platformUserId !== verified.platformUserId || !this.db.canAccess(member, accountId)) throw new UserError('原账号记录无法恢复，请联系管理员。', 403)
          await this.db.execute("UPDATE records SET deleted_at=NULL WHERE kind='accounts' AND workspace_id=? AND id=?", [workspaceId, accountId])
          account = { ...metadata, id: accountId, revision: removed.revision }
        }
      }
      if (account) this.assertReauthorizable(account)
      if (account && account.environmentId !== body.environmentId) throw new UserError('该账号已绑定其他环境，请使用原环境重新授权。', 409)
      if ((await this.db.list('accounts', workspaceId)).some(item => item.environmentId === body.environmentId && item.platform === platform.key && item.id !== accountId)) throw new UserError('此环境已绑定同平台的其他账号，请使用独立环境。', 409)
      const accountData = { platformUserId: verified.platformUserId, name: verified.name, avatar: verified.avatar || '', platform: platform.key, environmentId: body.environmentId, status: 'valid', launchUrl: verified.platform.url, origins: verified.platform.origins, authorizationOperationId: body.operationId }
      await this.db.authAccounts.write(workspaceId, accountId, accountData, verified.session)
      const saved = await this.db.put('accounts', workspaceId, accountId, { ...accountData, platformName: platform.name, environmentName: environment.name, checkedAt: Date.now(), updatedAt: Date.now() }, account?.revision ?? null)
      // 受限操作成员创建的账号也需纳入其原有资源范围，保证保存后能在列表中查看；不扩大其他资源权限。
      if (!account && member.role === 'operator' && member.scope.mode === 'selected') {
        await this.db.execute('UPDATE members SET scope=? WHERE workspace_id=? AND user_id=?', [JSON.stringify({ ...member.scope, ids: [...new Set([...member.scope.ids, accountId])] }), workspaceId, userId])
      }
      return { account: saved, outcome: 'valid' }
    })
  }
  async check (workspaceId, userId, accountId, body) {
    if (!body || typeof body.operationId !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(body.operationId)) throw new UserError('检测结果无效，请重新检测。')
    return await this.db.transaction(async () => {
      await this.db.execute('SELECT id FROM workspaces WHERE id=? FOR UPDATE', [workspaceId])
      const row = (await this.db.execute('SELECT * FROM members WHERE workspace_id=? AND user_id=? FOR UPDATE', [workspaceId, userId]))[0]
      if (!row) throw new UserError('你没有该团队的访问权限。', 403)
      const member = { ...row, scope: typeof row.scope === 'string' ? JSON.parse(row.scope) : row.scope }; this.db.assertWrite(member)
      const account = await this.db.get('accounts', workspaceId, accountId)
      if (!account || !this.db.canAccess(member, accountId) || body.environmentId !== account.environmentId || body.platform !== account.platform) throw new UserError('账号不存在或无法访问。', 404)
      const environment = await this.db.get('environments', workspaceId, account.environmentId)
      if (!environment || !this.db.canAccess(member, environment.id)) throw new UserError('账号绑定的浏览器环境不存在或无法访问。', 403)
      let verified
      try { verified = verifyClientResult({ id: body.operationId, mode: 'check', targetAccountId: accountId, platform: { key: account.platform } }, body.result) } catch { throw new UserError('客户端未返回有效的账号检测结果。', 422) }
      if (verified.platformUserId !== account.platformUserId) throw new UserError('检测到的平台身份与当前账号不一致。', 409)
      const status = verified.outcome === 'invalid' ? 'invalid' : 'valid'
      const item = await this.db.put('accounts', workspaceId, accountId, { ...account, status, checkedAt: Date.now() }, account.revision)
      return { account: item, outcome: status === 'invalid' ? 'invalid' : 'valid' }
    })
  }
}
module.exports = { MediaAuthorizations }
