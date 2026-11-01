const crypto = require('node:crypto')
const { UserError } = require('./mysql-database')
const { catalog, verifyClientResult } = require('./client-platform-service')

class MediaAuthorizations {
  constructor (database) { this.db = database }
  assertReauthorizable (account) {
    if (!['invalid', 'expired'].includes(account?.status)) throw new UserError('账号授权仍有效，无需重新授权。', 409)
  }
  async lockContext (workspaceId, userId, environmentId) {
    const member = await this.db.membership(workspaceId, userId)
    this.db.assertWrite(member)
    if (!environmentId) return { member, environment: null }
    const environment = await this.db.get('environments', workspaceId, environmentId)
    if (!environment || !this.db.canAccess(member, environment.id)) throw new UserError('浏览器环境不存在或无法访问。', 403)
    return { member, environment }
  }
  async save (workspaceId, userId, body) {
    if (!body || typeof body.operationId !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(body.operationId) || !['authorize', 'reauthorize'].includes(body.mode) || body.mode === 'reauthorize' && (typeof body.accountId !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(body.accountId))) throw new UserError('授权结果信息无效，请重新授权。')
    const envId = typeof body.environmentId === 'string' && /^[a-zA-Z0-9-]{1,64}$/.test(body.environmentId) ? body.environmentId : ''
    const platform = catalog.find(item => item.key === body.platform)
    if (!platform) throw new UserError('该平台不在系统支持范围内。')
    let verified
    try {
      verified = verifyClientResult({ id: body.operationId, mode: body.mode, targetAccountId: body.accountId || null, platform: { key: platform.key } }, body.result)
    } catch (verifyErr) {
      console.error('[平台授权校验失败]', verifyErr?.message, {
        operationId: body.operationId,
        resultOperationId: body.result?.operationId,
        platformKey: platform.key,
        resultPlatformKey: body.result?.platform?.key,
        resultKeys: Object.keys(body.result || {})
      })
      throw new UserError(`平台身份或会话校验失败（${verifyErr.message}），请重新授权。`, 422)
    }
    if (verified.outcome !== 'valid' || !verified.session) throw new UserError('平台未确认授权成功，不会保存账号数据。', 422)
    return await this.db.transaction(async () => {
      const { member, environment } = await this.lockContext(workspaceId, userId, envId)
      const accountId = crypto.createHash('sha256').update(JSON.stringify([workspaceId, platform.key, verified.platformUserId])).digest('hex').slice(0, 48)
      if (body.accountId && body.accountId !== accountId) throw new UserError('原账号标识与平台身份不匹配，请重新授权。', 409)
      let account = body.accountId
        ? await this.db.authAccounts.get(workspaceId, accountId)
        : await this.db.authAccounts.get(workspaceId, accountId, { includeArchived: true })
      if (body.accountId && (!account || account.revision !== body.expectedRevision && account.authorizationOperationId !== body.operationId || account.platform !== platform.key || account.platformUserId !== verified.platformUserId)) throw new UserError('原账号记录已变化，请重新授权。', 409)
      if (account && !this.db.canAccess(member, accountId)) throw new UserError('此账号已在团队中，请联系管理员分配权限。', 403)
      if (account?.authorizationOperationId === body.operationId && account.status === 'valid') return { account, outcome: 'valid' }
      if (account && account.status !== 'archived') this.assertReauthorizable(account)
      const accountData = { platformUserId: verified.platformUserId, name: verified.name, avatar: verified.avatar || '', platform: platform.key, environmentId: envId || account?.environmentId || '', status: 'valid', launchUrl: verified.platform.url, origins: verified.platform.origins, authorizationOperationId: body.operationId }
      await this.db.authAccounts.write(workspaceId, accountId, accountData, verified.session)
      const saved = await this.db.authAccounts.get(workspaceId, accountId)
      // 受限操作成员创建的账号也需纳入其原有资源范围，保证保存后能在列表中查看；不扩大其他资源权限。
      if (!account && member.role === 'operator' && member.scope.mode === 'selected') {
        await this.db.client.member.update({ where: { workspaceId_userId: { workspaceId, userId } }, data: { scope: { ...member.scope, ids: [...new Set([...member.scope.ids, accountId])] } } })
      }
      return { account: saved, outcome: 'valid' }
    })
  }
  async check (workspaceId, userId, accountId, body) {
    if (!body || typeof body.operationId !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(body.operationId)) throw new UserError('检测结果无效，请重新检测。')
    return await this.db.transaction(async () => {
      const member = await this.db.membership(workspaceId, userId); this.db.assertWrite(member)
      const account = await this.db.get('accounts', workspaceId, accountId)
      if (!account || !this.db.canAccess(member, accountId) || body.platform !== account.platform) throw new UserError('账号不存在或无法访问。', 404)
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
