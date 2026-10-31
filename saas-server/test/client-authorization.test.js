const test = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { WorkspaceServer } = require('../src/workspace-server')
const { getDefaultProfile } = require('../src/fingerprint/profile-store')
const { createLaunchRequest } = require('./desktop-protocol-consumer')

function seal (task, payload, proofKey) {
  const value = { operationId: task.id, ...payload }
  value.proof = crypto.createHmac('sha256', proofKey).update(JSON.stringify(value)).digest('hex')
  const key = crypto.randomBytes(32); const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv); cipher.setAAD(Buffer.from(task.id))
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()])
  return { wrappedKey: crypto.publicEncrypt({ key: task.publicKey, oaepHash: 'sha256' }, key).toString('base64'), iv: iv.toString('base64'), ciphertext: ciphertext.toString('base64'), tag: cipher.getAuthTag().toString('base64') }
}
test('默认生产链路：无平台服务依赖，密文绑定任务、拒绝伪造、auth_accounts 入库与账号恢复', async () => {
  const server = new WorkspaceServer({ port: 0, dataDir: fs.mkdtempSync(path.join(os.tmpdir(), 'client-auth-')), databaseName: 'qijie_workspace_test_' + crypto.randomBytes(10).toString('hex') })
  const address = await server.start(); const db = server.database; const user = crypto.randomUUID(); const workspace = crypto.randomUUID(); const environment = crypto.randomUUID()
  try {
    await db.execute('INSERT INTO users VALUES(?,?,?,?,?,?)', [user, user + '@example.test', '隔离测试', '不可用于登录的测试摘要', Date.now(), Date.now()])
    await db.execute('INSERT INTO workspaces VALUES(?,?,?)', [workspace, '客户端授权隔离测试', user])
    await db.execute('INSERT INTO members VALUES(?,?,?,?,?)', [crypto.randomUUID(), workspace, user, 'owner', JSON.stringify({ mode: 'all', ids: [] })])
    await db.put('environments', workspace, environment, { name: '隔离测试环境', startUrl: 'about:blank', fingerprint: db.encodeFingerprint(getDefaultProfile()) }, null)
    const session = await db.createSession(user)
    const request = async (route, body, expected = 200) => {
      const response = await fetch(`http://127.0.0.1:${address.port}/api/workspaces/${workspace}/${route}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: 'qijie_session=' + session.token, 'X-CSRF-Token': session.csrf }, body: JSON.stringify(body) })
      const result = await response.json(); assert.equal(response.status, expected, result.message); return result
    }
    const task = (await request('authorizations', { platform: 'douyin', environmentId: environment }, 201)).task
    assert(!JSON.stringify(task).includes('proofKey'))
    const launch = createLaunchRequest(workspace, environment)
    const profile = launch.open((await request(`environments/${environment}/launch`, { ...launch.request, authorizationId: task.id })).envelope)
    assert.equal(profile.authorization.operationId, task.id)
    const payload = { identity: { platformUserId: 'isolated-real-protocol-id', name: '协议隔离测试身份', avatar: '' }, platform: { key: 'douyin', url: 'https://creator.douyin.com/', origins: ['https://creator.douyin.com'] }, cookies: [{ name: 'session', value: 'isolated-encrypted-value', domain: '.douyin.com', secure: true, httpOnly: true }], storage: {}, outcome: 'valid', packageVersion: '0.2.0' }
    await request(`authorizations/${task.id}/complete`, seal(task, payload, '0'.repeat(64)), 422)
    const envelope = seal(task, payload, profile.authorization.proofKey)
    assert.equal((await request(`authorizations/${task.id}/complete`, envelope)).task.status, 'review')
    const saved = (await request(`authorizations/${task.id}/confirm`, {})).task
    assert.equal(saved.status, 'saved')
    assert.equal((await request(`authorizations/${task.id}/confirm`, {})).task.accountId, saved.accountId)
    const rows = await db.execute('SELECT * FROM auth_accounts WHERE workspace_id=?', [workspace])
    assert.equal(rows.length, 1); assert.equal(rows[0].platform_user_id, payload.identity.platformUserId)
    assert(!JSON.stringify(rows).includes('isolated-encrypted-value'))
    assert.equal((await db.execute("SELECT * FROM media_sessions WHERE workspace_id=? AND session_kind='account'", [workspace])).length, 0)
    const accountLaunch = createLaunchRequest(workspace, saved.accountId)
    const accountProfile = accountLaunch.open((await request(`accounts/${saved.accountId}/launch`, accountLaunch.request)).envelope)
    assert.equal(accountProfile.platformKey, 'douyin'); assert.equal(accountProfile.session.cookies[0].value, 'isolated-encrypted-value')
    const check = (await request('authorizations', { platform: 'douyin', environmentId: environment, accountId: saved.accountId, checkOnly: true }, 201)).task
    const checkLaunch = createLaunchRequest(workspace, environment)
    const checkProfile = checkLaunch.open((await request(`environments/${environment}/launch`, { ...checkLaunch.request, authorizationId: check.id })).envelope)
    const invalid = { ...payload, outcome: 'invalid', identity: { platformUserId: payload.identity.platformUserId } }
    assert.equal((await request(`authorizations/${check.id}/complete`, seal(check, invalid, checkProfile.authorization.proofKey))).task.outcome, 'invalid')
    assert.equal((await db.get('accounts', workspace, saved.accountId)).status, 'invalid')
    assert.equal((await db.execute('SELECT auth_status FROM auth_accounts WHERE workspace_id=?', [workspace]))[0].auth_status, 'invalid')
    await request(`accounts/${saved.accountId}/launch`, createLaunchRequest(workspace, saved.accountId).request, 409)
  } finally { await server.stop() }
})
