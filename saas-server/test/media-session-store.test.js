const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const crypto = require('node:crypto')
const { WorkspaceDatabase } = require('../src/mysql-database')

test('关系会话：字段展开、逐值加密、重启迁移及跨成员隔离', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'media-session-rows-'))
  const databaseName = 'qijie_workspace_test_' + crypto.randomBytes(10).toString('hex')
  let db = new WorkspaceDatabase(directory, { databaseName }); await db.ready
  const userId = crypto.randomUUID(); const workspaceId = crypto.randomUUID(); const environmentId = crypto.randomUUID(); const accountId = crypto.randomUUID()
  const snapshot = {
    cookies: [
      { name: 'session', value: 'relational-session-secret', domain: '.example.com', path: '/', secure: true, httpOnly: true, session: false, hostOnly: false, expirationDate: 1900000000.25, sameSite: 'no_restriction', partitionKey: { topLevelSite: 'https://example.com', hasCrossSiteAncestor: false } },
      { name: 'session', value: '', domain: 'app.example.com', path: '/creator', secure: false, httpOnly: false, session: true, hostOnly: true, sameSite: 'lax' }
    ],
    storage: { 'https://example.com': { token: 'relational-storage-secret', empty: '' }, 'https://app.example.com': { token: 'different-origin-secret' } }
  }
  try {
    await db.execute('INSERT INTO users VALUES(?,?,?,?,?,?)', [userId, userId + '@example.com', '关系会话隔离验收', crypto.randomBytes(32).toString('hex'), Date.now(), Date.now()])
    await db.execute('INSERT INTO workspaces VALUES(?,?,?)', [workspaceId, '关系会话隔离验收', userId])
    await db.execute('INSERT INTO members VALUES(?,?,?,?,?)', [crypto.randomUUID(), workspaceId, userId, 'owner', JSON.stringify({ mode: 'all', ids: [] })])
    await db.put('environments', workspaceId, environmentId, { name: '隔离测试环境' }, null)
    await db.put('accounts', workspaceId, accountId, { environmentId, status: 'valid' }, null)
    await db.put('account-sessions', workspaceId, accountId, { credential: db.encrypt(JSON.stringify(snapshot)), updatedAt: Date.now() }, null)
    await db.close(); db = new WorkspaceDatabase(directory, { databaseName }); await db.ready
    const migrated = await db.get('account-sessions', workspaceId, accountId)
    assert.equal(migrated.credential, undefined); assert.equal(migrated.sessionStorage, 'relational-v1')
    const restored = await db.readAccountSession(workspaceId, userId, accountId)
    assert.deepEqual(JSON.parse(JSON.stringify({ cookies: restored.cookies, storage: restored.storage })), snapshot)
    assert.equal(restored.sessionVersion, 1)
    const cookies = await db.execute('SELECT * FROM media_session_cookies WHERE workspace_id=? AND session_id=?', [workspaceId, accountId])
    const storage = await db.execute('SELECT * FROM media_session_storage WHERE workspace_id=? AND session_id=?', [workspaceId, accountId])
    assert.equal(cookies.length, 2); assert.equal(storage.length, 3)
    assert(!JSON.stringify([...cookies, ...storage]).includes('relational-session-secret'))
    assert(!JSON.stringify(storage).includes('relational-storage-secret'))
    const columns = await db.execute('SHOW COLUMNS FROM media_session_cookies')
    assert(!columns.some(column => column.Type.toLowerCase() === 'json'))
    await db.authAccounts.write(workspaceId, accountId, await db.get('accounts', workspaceId, accountId), snapshot)
    assert.equal((await db.readAccountSession(workspaceId, userId, accountId)).sessionVersion, 2)
    await assert.rejects(db.readAccountSession(crypto.randomUUID(), userId, accountId), /访问权限/)
    await db.execute("UPDATE members SET role='viewer' WHERE workspace_id=? AND user_id=?", [workspaceId, userId])
    await assert.rejects(db.readAccountSession(workspaceId, userId, accountId), /没有此操作权限/)
    await db.execute("UPDATE members SET role='operator',scope=? WHERE workspace_id=? AND user_id=?", [JSON.stringify({ mode: 'selected', ids: [accountId] }), workspaceId, userId])
    await assert.rejects(db.readAccountSession(workspaceId, userId, accountId), /环境不存在或无法访问/)
    await db.execute("UPDATE members SET role='owner' WHERE workspace_id=? AND user_id=?", [workspaceId, userId])
    // 损坏旧密文不得被替换为空会话；原记录保留，修复后可再次迁移。
    const broken = crypto.randomUUID()
    await db.put('account-sessions', workspaceId, broken, { credential: 'broken-test-only' }, null)
    await assert.rejects(db.mediaSessions.migrate(), /已保留原始登录数据/)
    assert.equal((await db.get('account-sessions', workspaceId, broken)).credential, 'broken-test-only')
    const original = await db.get('account-sessions', workspaceId, broken)
    await db.put('account-sessions', workspaceId, broken, { credential: db.encrypt(JSON.stringify(snapshot)) }, original.revision)
    await db.mediaSessions.migrate()
    assert.equal((await db.mediaSessions.read(workspaceId, broken, 'account')).cookies.length, 2)
  } finally { await db.close() }
})
