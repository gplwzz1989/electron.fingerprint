const test = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { WorkspaceDatabase } = require('../src/mysql-database')
const { MediaAuthorizations } = require('../src/media-authorizations')

function seal (task, value) {
  const key = crypto.randomBytes(32); const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv); cipher.setAAD(Buffer.from(task.id))
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify({ ...value, operationId: task.id })), cipher.final()])
  return { wrappedKey: crypto.publicEncrypt({ key: task.publicKey, oaepHash: 'sha256' }, key).toString('base64'), iv: iv.toString('base64'), ciphertext: ciphertext.toString('base64'), tag: cipher.getAuthTag().toString('base64') }
}
test('隔离 MySQL：授权核验、加密持久化、身份匹配、重复确认及权限撤销', async () => {
  const db = new WorkspaceDatabase(fs.mkdtempSync(path.join(os.tmpdir(), 'media-authorization-')), { databaseName: 'qijie_workspace_test_' + crypto.randomBytes(10).toString('hex') })
  await db.ready
  const userId = crypto.randomUUID(); const workspaceId = crypto.randomUUID(); const environmentId = crypto.randomUUID()
  try {
    await db.execute('INSERT INTO users VALUES(?,?,?,?,?,?)', [userId, userId + '@example.com', '隔离授权测试', crypto.randomBytes(32).toString('hex'), Date.now(), Date.now()])
    await db.execute('INSERT INTO workspaces VALUES(?,?,?)', [workspaceId, '隔离授权测试', userId])
    await db.execute('INSERT INTO members VALUES(?,?,?,?,?)', [crypto.randomUUID(), workspaceId, userId, 'owner', JSON.stringify({ mode: 'all', ids: [] })])
    await db.put('environments', workspaceId, environmentId, { name: '隔离测试环境' }, null)
    // 仅此隔离测试以确定性校验器代替平台公网响应；生产模块没有该实现。
    const fixture = { catalog: ['douyin', 'shipinhao', 'kuaishou', 'xiaohongshu'].map(key => ({ key, name: key })), runtime: () => ({ manifest: { version: 'test-only' } }), verifyAuthorization: async (_, snapshot) => {
      if (snapshot.cookies?.[0]?.value !== 'test-session-secret') throw new Error('测试会话无效')
      return { platformUserId: snapshot.testIdentity || 'test-platform-id', name: '隔离测试身份', session: { ...snapshot, cookies: snapshot.cookies.map(cookie => ({ name: 'test-cookie', ...cookie })) } }
    } }
    const service = new MediaAuthorizations(db, fixture)
    const begin = () => service.begin(workspaceId, userId, { platform: 'douyin', environmentId })
    const task = await begin()
    await assert.rejects(service.handle(workspaceId, userId, task.id, 'complete', { ciphertext: 'invalid' }), /校验失败/)
    await assert.rejects(service.handle(workspaceId, userId, task.id, 'complete', seal(task, { cookies: [] })), /身份核验失败/)
    const envelope = seal(task, { cookies: [{ name: 'test-cookie', value: 'test-session-secret' }] })
    const review = await service.handle(workspaceId, userId, task.id, 'complete', envelope)
    assert.equal(review.status, 'review'); assert.equal((await db.list('accounts', workspaceId)).length, 0)
    const saved = await service.handle(workspaceId, userId, task.id, 'confirm', {})
    assert.equal(saved.status, 'saved')
    assert.equal((await service.handle(workspaceId, userId, task.id, 'confirm', {})).accountId, saved.accountId)
    assert.equal((await db.list('accounts', workspaceId)).length, 1)
    const credentials = await db.execute('SELECT value_ciphertext FROM media_session_cookies WHERE workspace_id=? AND session_id=?', [workspaceId, saved.accountId])
    assert(!JSON.stringify(credentials).includes('test-session-secret'))
    assert.equal((await db.readAccountSession(workspaceId, userId, saved.accountId)).cookies[0].value, 'test-session-secret')
    for (const platform of ['shipinhao', 'kuaishou', 'xiaohongshu']) {
      const another = await service.begin(workspaceId, userId, { platform, environmentId })
      await service.handle(workspaceId, userId, another.id, 'complete', seal(another, { cookies: [{ value: 'test-session-secret' }] }))
      const concurrent = await Promise.all([1, 2, 3].map(() => service.handle(workspaceId, userId, another.id, 'confirm', {})))
      assert(concurrent.every(item => item.accountId === concurrent[0].accountId))
    }
    assert.equal((await db.list('accounts', workspaceId)).length, 4)
    await assert.rejects(service.begin(workspaceId, userId, { platform: 'douyin', environmentId, accountId: saved.accountId }), /仍有效/)
    const expiredAccount = await db.get('accounts', workspaceId, saved.accountId)
    await db.put('accounts', workspaceId, saved.accountId, { ...expiredAccount, status: 'expired' }, expiredAccount.revision)
    const reauth = await service.begin(workspaceId, userId, { platform: 'douyin', environmentId, accountId: saved.accountId })
    await assert.rejects(service.handle(workspaceId, userId, reauth.id, 'complete', seal(reauth, { cookies: [{ value: 'test-session-secret' }], testIdentity: 'another-test-id' })), /身份与原账号不一致/)
    const cancelled = await begin(); await service.handle(workspaceId, userId, cancelled.id, 'cancel', {})
    await assert.rejects(service.handle(workspaceId, userId, cancelled.id, 'confirm', {}), /已结束/)
    await assert.rejects(service.handle(workspaceId, userId, task.id, 'unsupported', {}), /不支持/)
    const anotherUser = crypto.randomUUID()
    await db.execute('INSERT INTO users VALUES(?,?,?,?,?,?)', [anotherUser, anotherUser + '@example.com', '其他测试成员', crypto.randomBytes(32).toString('hex'), Date.now(), Date.now()])
    await db.execute('INSERT INTO members VALUES(?,?,?,?,?)', [crypto.randomUUID(), workspaceId, anotherUser, 'operator', JSON.stringify({ mode: 'all', ids: [] })])
    await assert.rejects(service.handle(workspaceId, anotherUser, task.id, '', {}), /无法访问此授权任务/)
    const foreignWorkspace = crypto.randomUUID()
    await db.execute('INSERT INTO workspaces VALUES(?,?,?)', [foreignWorkspace, '其他隔离团队', anotherUser])
    await assert.rejects(service.handle(foreignWorkspace, anotherUser, task.id, '', {}), /不存在/)

    // 平台请求在途时变更任务状态，验证完成必须重新检查数据库中的当前状态。
    const originalVerifier = fixture.verifyAuthorization
    async function inFlight (change, expected) {
      const pending = await begin(); let release; let entered
      const started = new Promise(resolve => { entered = resolve })
      fixture.verifyAuthorization = async (...args) => { entered(); await new Promise(resolve => { release = resolve }); return originalVerifier(...args) }
      const complete = service.handle(workspaceId, userId, pending.id, 'complete', seal(pending, { cookies: [{ value: 'test-session-secret' }] }))
      await started; await change(pending); release()
      try { await assert.rejects(complete, expected) } finally { fixture.verifyAuthorization = originalVerifier }
      return pending
    }
    await inFlight(async pending => {
      const stored = await db.get('authorizations', workspaceId, pending.id)
      await db.put('authorizations', workspaceId, pending.id, { ...stored, expiresAt: Date.now() - 1 }, stored.revision)
    }, /已结束/)
    const raceCancelled = await inFlight(pending => service.handle(workspaceId, userId, pending.id, 'cancel', {}), /已结束/)
    assert.equal((await db.get('authorizations', workspaceId, raceCancelled.id)).credential, null)
    await inFlight(() => db.execute("UPDATE members SET role='viewer' WHERE workspace_id=? AND user_id=?", [workspaceId, userId]), /没有此操作权限/)
    await db.execute("UPDATE members SET role='owner' WHERE workspace_id=? AND user_id=?", [workspaceId, userId])

    const snapshotTask = await begin()
    await service.handle(workspaceId, userId, snapshotTask.id, 'complete', seal(snapshotTask, { cookies: [{ value: 'test-session-secret' }] }))
    // 即使外层套餐事务已有一致性快照，落库检查仍必须读取锁定后的最新权限。
    await assert.rejects(db.transaction(async () => {
      await db.membership(workspaceId, userId)
      await db.pool.execute("UPDATE members SET role='viewer' WHERE workspace_id=? AND user_id=?", [workspaceId, userId])
      await service.handle(workspaceId, userId, snapshotTask.id, 'confirm', {})
    }), /没有此操作权限/)
    await db.execute("UPDATE members SET role='owner' WHERE workspace_id=? AND user_id=?", [workspaceId, userId])

    const operatorEnvironment = crypto.randomUUID()
    await db.put('environments', workspaceId, operatorEnvironment, { name: '受限成员测试环境' }, null)
    await db.execute("UPDATE members SET scope=? WHERE workspace_id=? AND user_id=?", [JSON.stringify({ mode: 'selected', ids: [operatorEnvironment] }), workspaceId, anotherUser])
    const owned = await service.begin(workspaceId, anotherUser, { platform: 'douyin', environmentId: operatorEnvironment })
    await service.handle(workspaceId, anotherUser, owned.id, 'complete', seal(owned, { cookies: [{ value: 'test-session-secret' }], testIdentity: 'operator-test-id' }))
    const ownedAccount = await service.handle(workspaceId, anotherUser, owned.id, 'confirm', {})
    const operatorMember = await db.membership(workspaceId, anotherUser)
    assert(db.canAccess(operatorMember, ownedAccount.accountId))
    assert(!db.canAccess(operatorMember, saved.accountId), '创建自己的账号不得扩大已有账号权限。')

    const rollbackEnvironment = crypto.randomUUID()
    await db.put('environments', workspaceId, rollbackEnvironment, { name: '事务回滚测试环境' }, null)
    const rollback = await service.begin(workspaceId, userId, { platform: 'douyin', environmentId: rollbackEnvironment })
    await service.handle(workspaceId, userId, rollback.id, 'complete', seal(rollback, { cookies: [{ value: 'test-session-secret' }], testIdentity: 'rollback-test-id' }))
    const originalPut = db.put.bind(db)
    db.put = async (...args) => { if (args[0] === 'accounts') throw new Error('仅隔离测试触发的入库失败'); return originalPut(...args) }
    try { await assert.rejects(service.handle(workspaceId, userId, rollback.id, 'confirm', {}), /入库失败/) } finally { db.put = originalPut }
    const rollbackId = crypto.createHash('sha256').update(JSON.stringify([workspaceId, 'douyin', 'rollback-test-id'])).digest('hex').slice(0, 48)
    assert.equal(await db.get('account-sessions', workspaceId, rollbackId), null)
    assert.equal(await db.mediaSessions.read(workspaceId, rollbackId, 'account'), null)
    assert.equal(await db.get('accounts', workspaceId, rollbackId), null)
    assert.equal((await db.get('authorizations', workspaceId, rollback.id)).status, 'review')
    assert.equal((await service.handle(workspaceId, userId, rollback.id, 'confirm', {})).status, 'saved')

    const revoked = await begin()
    await db.execute("UPDATE members SET role='viewer' WHERE workspace_id=? AND user_id=?", [workspaceId, userId])
    await assert.rejects(service.handle(workspaceId, userId, revoked.id, 'complete', envelope), /没有此操作权限/)
  } finally { await db.close() }
})
