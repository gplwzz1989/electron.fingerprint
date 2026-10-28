const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const crypto = require('node:crypto')
const { WorkspaceServer } = require('../src/workspace-server')
const { getDefaultProfile } = require('../../fingerprint-browser/profile-store')
const { createSmtpMailbox } = require('./smtp-mailbox')
const { createLaunchRequest } = require('../../fingerprint-browser/fingerprint-envelope')

test('真实数据库、会话、权限和资源完整链路', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'qijie-workspace-acceptance-'))
  const databaseName = 'qijie_workspace_test_' + crypto.randomBytes(8).toString('hex')
  const mailbox = await createSmtpMailbox(directory)
  let server = new WorkspaceServer({ port: 0, dataDir: directory, databaseName, mailConfigFile: mailbox.configFile })
  let address = await server.start(); let origin = `http://127.0.0.1:${address.port}`
  const accounts = {}
  async function api (route, { account, method = 'GET', body, csrf = true, expected = 200 } = {}) {
    const auth = accounts[account]
    const response = await fetch(origin + route, { method, headers: { 'Content-Type': 'application/json', ...(auth ? { Cookie: auth.cookie, ...(csrf ? { 'X-CSRF-Token': auth.csrf } : {}) } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
    const data = await response.json(); assert.equal(response.status, expected, `${route}: ${data.message || ''}`)
    return { data, cookie: response.headers.get('set-cookie')?.split(';')[0] }
  }
  try {
    await t.test('空数据库无演示账户，注册产生真实团队并登录', async () => {
      assert.equal((await server.database.execute('SELECT count(*) AS count FROM users'))[0].count, 0)
      for (const name of ['owner', 'outsider']) {
        const email = `${name}-${crypto.randomUUID()}@example.com`
        await api('/api/auth/registration-code', { method: 'POST', body: { email } })
        const result = await api('/api/auth/register', { method: 'POST', expected: 201, body: { email, verificationCode: mailbox.codeFor(email), password: crypto.randomBytes(24).toString('hex'), name, workspaceName: `${name}验收团队` } })
        accounts[name] = { ...result.data, cookie: result.cookie, workspaceId: result.data.workspaces[0].id }
      }
      assert.equal(accounts.owner.workspaces[0].role, 'owner')
      await api('/api/auth/me', { account: 'owner' })
      await api('/api/auth/me', { expected: 401 })
    })
    const base = `/api/workspaces/${accounts.owner.workspaceId}`
    let fingerprint; let environment
    await t.test('指纹保存、版本冲突与团队隔离', async () => {
      const profile = getDefaultProfile(); profile.id = crypto.randomUUID(); profile.noise.seed = crypto.randomUUID()
      fingerprint = (await api(`${base}/fingerprints`, { account: 'owner', method: 'POST', expected: 201, body: { name: '实际入库验收指纹', profile } })).data.item
      assert.equal(fingerprint.version, 1)
      assert.notEqual(fingerprint.profile.noise.seed, profile.noise.seed, '页面不能指定最终运行种子。')
      const rows = await server.database.execute('SELECT profile FROM fingerprint_versions WHERE fingerprint_id=?', [fingerprint.id])
      assert(!JSON.stringify(rows).includes(fingerprint.profile.noise.seed)); assert(JSON.stringify(rows).includes('qijie-fingerprint-storage-v1'))
      const updated = (await api(`${base}/fingerprints`, { account: 'owner', method: 'POST', expected: 201, body: { id: fingerprint.id, name: fingerprint.name, profile, expectedVersion: 1 } })).data.item
      await api(`${base}/fingerprints`, { account: 'owner', method: 'POST', expected: 409, body: { id: fingerprint.id, name: fingerprint.name, profile, expectedVersion: 1 } })
      await api(`${base}/fingerprints`, { account: 'outsider', expected: 403 })
      await api(`${base}/fingerprints`, { account: 'owner', method: 'POST', csrf: false, expected: 403, body: { name: '不能写入', profile } })
      assert.equal(updated.version, 2)
    })
    await t.test('环境锁定原指纹版本，服务器拒绝无效配置', async () => {
      environment = (await api(`${base}/environments`, { account: 'owner', method: 'POST', expected: 201, body: { name: '独立环境验收', fingerprintId: fingerprint.id, fingerprintVersion: 1, startUrl: origin + '/api/health' } })).data.item
      assert.equal(environment.fingerprintVersion, 1)
      assert.equal(environment.fingerprint, undefined)
      await api(`${base}/environments/${environment.id}/launch`, { account: 'owner', method: 'POST', body: {}, expected: 400 })
      const encryption = createLaunchRequest(accounts.owner.workspaceId, environment.id)
      await api(`${base}/environments/${environment.id}/launch`, { account: 'outsider', method: 'POST', body: encryption.request, expected: 403 })
      const launch = await api(`${base}/environments/${environment.id}/launch`, { account: 'owner', method: 'POST', body: encryption.request })
      assert.equal(launch.data.profile, undefined)
      assert(!JSON.stringify(launch.data).includes(fingerprint.profile.noise.seed))
      const decrypted = encryption.open(launch.data.envelope)
      assert.equal(decrypted.id, environment.id)
      assert.equal(decrypted.proxy.mode, 'direct')
      assert.equal(decrypted.fingerprint.noise.seed, fingerprint.profile.noise.seed)
      const stored = (await server.database.execute("SELECT data FROM records WHERE kind='environments' AND id=?", [environment.id]))[0]
      assert(!JSON.stringify(stored).includes(fingerprint.profile.noise.seed))
      await api(`${base}/fingerprints/${fingerprint.id}`, { account: 'owner', method: 'DELETE', expected: 409 })
      const invalid = getDefaultProfile(); invalid.screen.availWidth = invalid.screen.width + 1
      await api(`${base}/fingerprints`, { account: 'owner', method: 'POST', expected: 400, body: { name: '无效参数不得入库', profile: invalid } })
      invalid.screen.availWidth = invalid.screen.width; invalid.locale.languages = ['en-US']
      await api(`${base}/fingerprints`, { account: 'owner', method: 'POST', expected: 400, body: { name: '语言冲突不得入库', profile: invalid } })
    })
    await t.test('未通过检测的代理不入库，外部服务未配置时不造成功结果', async () => {
      await api(`${base}/proxies`, { account: 'owner', method: 'POST', expected: 422, body: { name: '本机受限地址', host: '127.0.0.1', port: 1, protocol: 'http' } })
      assert.equal((await api(`${base}/proxies`, { account: 'owner' })).data.items.length, 0)
      await api(`${base}/authorizations`, { account: 'owner', method: 'POST', expected: 503, body: { platform: 'douyin' } })
      await api(`${base}/orders`, { account: 'owner', method: 'POST', expected: 503, body: { method: 'wechat' } })
      const billing = (await api(`${base}/billing`, { account: 'owner' })).data
      assert.equal(billing.subscription, null); assert.equal(billing.usage.environments, 1)
      assert(billing.paymentMethods.every(item => item.enabled === false))
    })
    await t.test('真实邀请接受与只读权限生效', async () => {
      const invite = (await api(`${base}/invitations`, { account: 'owner', method: 'POST', expected: 201, body: { email: accounts.outsider.user.email, role: 'viewer' } })).data
      await api(`${base}/invitations/${invite.invitation.id}/accept`, { account: 'outsider', method: 'POST', body: { token: invite.token } })
      await api(`${base}/invitations/${invite.invitation.id}/accept`, { account: 'outsider', method: 'POST', expected: 403, body: { token: invite.token } })
      assert.equal((await api(`${base}/fingerprints`, { account: 'outsider' })).data.items.length, 0)
      const member = (await api(`${base}/members`, { account: 'owner' })).data.items.find(item => item.userId === accounts.outsider.user.id)
      await api(`${base}/members/${member.id}`, { account: 'owner', method: 'PUT', body: { role: 'viewer', scope: { mode: 'selected', ids: [fingerprint.id] } } })
      assert.equal((await api(`${base}/fingerprints`, { account: 'outsider' })).data.items.length, 1)
      await api(`${base}/fingerprints`, { account: 'outsider', method: 'POST', expected: 403, body: { name: '只读不能写入', profile: getDefaultProfile() } })
      await api(`${base}/members/${member.id}`, { account: 'outsider', method: 'PUT', expected: 403, body: { role: 'admin', scope: { mode: 'all', ids: [] } } })
    })
    await t.test('设置、会话及指纹在服务重启后仍然存在', async () => {
      await api(`${base}/settings`, { account: 'owner', method: 'PUT', body: { pageSize: 10, reduceMotion: true, expectedRevision: null } })
      // 仅在隔离测试库还原旧明文格式，验证升级会迁移且不会改变历史运行种子。
      await server.database.execute('UPDATE fingerprint_versions SET profile=? WHERE fingerprint_id=? AND version=1', [JSON.stringify(fingerprint.profile), fingerprint.id])
      const oldEnvironment = await server.database.get('environments', accounts.owner.workspaceId, environment.id)
      oldEnvironment.fingerprint = fingerprint.profile
      await server.database.execute("UPDATE records SET data=? WHERE kind='environments' AND id=?", [JSON.stringify(oldEnvironment), environment.id])
      await server.stop(); server = new WorkspaceServer({ port: 0, dataDir: directory, databaseName, mailConfigFile: mailbox.configFile }); address = await server.start(); origin = `http://127.0.0.1:${address.port}`
      const migrated = await server.database.execute('SELECT profile FROM fingerprint_versions WHERE fingerprint_id=? AND version=1', [fingerprint.id])
      assert(!JSON.stringify(migrated).includes(fingerprint.profile.noise.seed)); assert(JSON.stringify(migrated).includes('qijie-fingerprint-storage-v1'))
      const request = createLaunchRequest(accounts.owner.workspaceId, environment.id)
      const launch = await api(`${base}/environments/${environment.id}/launch`, { account: 'owner', method: 'POST', body: request.request })
      assert.equal(request.open(launch.data.envelope).fingerprint.noise.seed, fingerprint.profile.noise.seed)
      assert.equal((await api(`${base}/fingerprints`, { account: 'owner' })).data.items[0].version, 2)
      assert.equal((await api(`${base}/settings`, { account: 'owner' })).data.settings.reduceMotion, true)
      assert.equal((await api(`${base}/environments`, { account: 'owner' })).data.items[0].fingerprintVersion, 1)
      await api('/api/auth/logout', { account: 'owner', method: 'POST', body: {} })
      await api('/api/auth/me', { account: 'owner', expected: 401 })
    })
    await t.test('正式页面及八个静态导航均由服务提供', async () => {
      const response = await fetch(origin + '/'); assert.equal(response.status, 200)
      const html = await response.text(); assert.equal((html.match(/class="nav-link/g) || []).length, 8)
      assert(html.includes('workspace.js')); assert(!html.includes('prototype.js'))
      assert(response.headers.get('content-security-policy').includes("default-src 'self'"))
      const blocked = await fetch(origin + '/api/health', { headers: { Origin: 'https://untrusted.example' } }); assert.equal(blocked.status, 403)
    })
  } finally { await server.stop(); await mailbox.stop() }
})
