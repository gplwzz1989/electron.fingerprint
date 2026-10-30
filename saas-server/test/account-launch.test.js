const test = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { WorkspaceServer } = require('../src/workspace-server')
const { getDefaultProfile } = require('../src/fingerprint/profile-store')
const { createLaunchRequest } = require('./desktop-protocol-consumer')

test('账号启动只向授权客户端返回密文，恢复独立账号会话并区分失效与网络错误', async () => {
  let failure = null; let duringVerification = null
  // 仅隔离测试控制平台核验结果，不访问或修改真实平台账号。
  const platformService = { catalog: [{ key: 'douyin', name: '抖音', url: 'https://creator.douyin.com/', origins: ['https://creator.douyin.com'] }], verifyAuthorization: async () => {
    if (duringVerification) await duringVerification()
    if (failure) throw Object.assign(new Error('隔离核验失败'), { code: failure })
    return { platformUserId: 'isolated-account' }
  } }
  const server = new WorkspaceServer({ port: 0, dataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'account-launch-')), databaseName: 'qijie_workspace_test_' + crypto.randomBytes(8).toString('hex'), platformService })
  const address = await server.start(); const origin = `http://127.0.0.1:${address.port}`; const db = server.database
  const owner = crypto.randomUUID(); const workspace = crypto.randomUUID(); const environmentId = crypto.randomUUID(); const accountId = crypto.randomBytes(24).toString('hex')
  try {
    await db.execute('INSERT INTO users VALUES(?,?,?,?,?,?)', [owner, owner + '@example.test', '账号启动验收', 'isolated-unusable-password', Date.now(), Date.now()])
    await db.execute('INSERT INTO workspaces VALUES(?,?,?)', [workspace, '账号启动隔离团队', owner])
    await db.execute('INSERT INTO members VALUES(?,?,?,?,?)', [crypto.randomUUID(), workspace, owner, 'owner', JSON.stringify({ mode: 'all', ids: [] })])
    await db.put('environments', workspace, environmentId, { name: '绑定环境', startUrl: 'about:blank', fingerprint: db.encodeFingerprint(getDefaultProfile()), proxyId: null }, null)
    let account = await db.put('accounts', workspace, accountId, { name: '隔离账号', platform: 'douyin', platformUserId: 'isolated-account', environmentId, status: 'valid' }, null)
    const snapshot = { cookies: [{ name: 'isolated-cookie', value: 'isolated-cookie-value', domain: '.douyin.com', path: '/', httpOnly: true, secure: true, sameSite: 'lax' }], storage: { 'https://creator.douyin.com': { 'isolated-key': 'isolated-storage-value' } } }
    await db.mediaSessions.write(workspace, accountId, 'account', snapshot)
    const auth = await db.createSession(owner)
    const api = async (action, body, expected = 200, csrf = true) => {
      const response = await fetch(`${origin}/api/workspaces/${workspace}/accounts/${accountId}/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: 'qijie_session=' + auth.token, ...(csrf ? { 'X-CSRF-Token': auth.csrf } : {}) }, body: JSON.stringify(body) })
      const data = await response.json(); assert.equal(response.status, expected, data.message); return data
    }
    const consumer = createLaunchRequest(workspace, accountId)
    await api('launch', consumer.request, 403, false)
    const data = await api('launch', consumer.request)
    assert(!JSON.stringify(data).includes('isolated-cookie-value'))
    assert(!JSON.stringify(data).includes('isolated-storage-value'))
    const profile = consumer.open(data.envelope)
    assert.equal(profile.id, accountId); assert.notEqual(profile.id, environmentId)
    assert.equal(profile.url, platformService.catalog[0].url)
    assert.equal(profile.session.format, 'desktop-session-v1')
    assert.equal(profile.localSessionSource.resourceId, environmentId)
    assert.deepEqual(profile.session.cookies, snapshot.cookies)
    assert.deepEqual(profile.session.storage, snapshot.storage)
    const wrongEnvironment = createLaunchRequest(workspace, environmentId)
    await api('launch', wrongEnvironment.request, 400)
    await db.execute("UPDATE members SET role='operator',scope=? WHERE workspace_id=? AND user_id=?", [JSON.stringify({ mode: 'selected', ids: [accountId] }), workspace, owner])
    await api('launch', consumer.request, 403)
    await db.execute("UPDATE members SET role='owner',scope=? WHERE workspace_id=? AND user_id=?", [JSON.stringify({ mode: 'all', ids: [] }), workspace, owner])
    failure = 'NETWORK_ERROR'; await api('check', {}, 503)
    assert.equal((await db.get('accounts', workspace, accountId)).status, 'valid')
    failure = 'AUTH_EXPIRED'; account = (await api('check', {})).item
    assert.equal(account.status, 'invalid'); await api('launch', consumer.request, 409)
    failure = null; assert.equal((await api('check', {})).item.status, 'valid')
    let started; let release
    const entered = new Promise(resolve => { started = resolve })
    duringVerification = async () => { started(); await new Promise(resolve => { release = resolve }) }
    const revokedCheck = api('check', {}, 403)
    await entered
    await db.execute("UPDATE members SET role='viewer' WHERE workspace_id=? AND user_id=?", [workspace, owner])
    release(); await revokedCheck
    duringVerification = null
    await api('launch', consumer.request, 403)
    await api('check', {}, 403)
  } finally { await server.stop() }
})
