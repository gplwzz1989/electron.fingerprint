const test = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { WorkspaceServer } = require('../src/workspace-server')
const { getDefaultProfile } = require('../src/fingerprint/profile-store')

test('四类资源删除：权限、关联拦截、账号归档与原始加密数据保留', async () => {
  const server = new WorkspaceServer({ port: 0, dataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'resource-removal-')), databaseName: 'qijie_workspace_test_' + crypto.randomBytes(8).toString('hex') })
  const address = await server.start(); const db = server.database
  const user = crypto.randomUUID(); const workspace = crypto.randomUUID(); const environment = crypto.randomUUID(); const proxy = crypto.randomUUID(); const account = crypto.randomUUID()
  try {
    await db.execute('INSERT INTO users VALUES(?,?,?,?,?,?)', [user, user + '@example.test', '资源删除隔离测试', '不可用于登录的摘要', Date.now(), Date.now()])
    await db.execute('INSERT INTO workspaces VALUES(?,?,?)', [workspace, '资源删除隔离测试', user])
    await db.execute('INSERT INTO members VALUES(?,?,?,?,?)', [crypto.randomUUID(), workspace, user, 'owner', JSON.stringify({ mode: 'all', ids: [] })])
    const fingerprint = await db.saveFingerprint(workspace, user, { name: '隔离测试指纹', profile: getDefaultProfile() })
    await db.put('proxies', workspace, proxy, { name: '仅测试关联的代理', credential: db.encrypt('{}') }, null)
    await db.put('environments', workspace, environment, { name: '隔离测试环境', fingerprintId: fingerprint.id, proxyId: proxy }, null)
    const metadata = { name: '隔离测试账号', platform: 'douyin', platformUserId: 'isolated-deletion-user', environmentId: environment, status: 'valid' }
    await db.authAccounts.write(workspace, account, metadata, { cookies: [{ name: 'session', value: 'isolated-preserved-secret' }], storage: {} })
    await db.put('accounts', workspace, account, metadata, null)
    const auth = await db.createSession(user)
    const remove = async (kind, id, expected) => {
      const response = await fetch(`http://127.0.0.1:${address.port}/api/workspaces/${workspace}/${kind}/${id}`, { method: 'DELETE', headers: { Cookie: 'qijie_session=' + auth.token, 'X-CSRF-Token': auth.csrf } })
      const result = await response.json(); assert.equal(response.status, expected, result.message)
    }
    await remove('fingerprints', fingerprint.id, 409); await remove('proxies', proxy, 409); await remove('environments', environment, 409)
    await db.execute("UPDATE members SET role='viewer' WHERE workspace_id=? AND user_id=?", [workspace, user])
    for (const [kind, id] of [['fingerprints', fingerprint.id], ['proxies', proxy], ['environments', environment], ['accounts', account]]) await remove(kind, id, 403)
    await db.execute("UPDATE members SET role='owner' WHERE workspace_id=? AND user_id=?", [workspace, user])
    await remove('accounts', crypto.randomUUID(), 404); await remove('accounts', account, 200)
    assert.equal(await db.get('accounts', workspace, account), null); assert.equal(await db.authAccounts.read(workspace, account), null)
    const retained = (await db.execute('SELECT auth_status,platform_cookie_hash FROM auth_accounts WHERE workspace_id=? AND id=?', [workspace, account]))[0]
    assert.equal(retained.auth_status, 'archived'); assert.equal(JSON.parse(db.decrypt(retained.platform_cookie_hash))[0].value, 'isolated-preserved-secret')
    await remove('environments', environment, 200); await remove('fingerprints', fingerprint.id, 200); await remove('proxies', proxy, 200)
    assert.equal((await db.fingerprints(workspace)).length, 0); assert.equal((await db.list('environments', workspace)).length, 0); assert.equal((await db.list('proxies', workspace)).length, 0)
  } finally { await server.stop() }
})
