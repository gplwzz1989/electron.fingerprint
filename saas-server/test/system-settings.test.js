const test = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { WorkspaceServer } = require('../src/workspace-server')

test('系统配置：全局管理员隔离、敏感值加密、热更新、版本冲突与重启持久化', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'qijie-system-config-'))
  const databaseName = 'qijie_workspace_test_system_' + crypto.randomBytes(6).toString('hex')
  let server = new WorkspaceServer({ port: 0, dataDir: directory, databaseName })
  let address = await server.start(); let origin = `http://127.0.0.1:${address.port}`
  let admin; let cookie; let csrf
  async function request (route, { method = 'GET', body, token = cookie, csrfToken = csrf, expected = 200 } = {}) {
    const response = await fetch(origin + route, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Cookie: token } : {}), ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) })
    const data = await response.json(); assert.equal(response.status, expected, data.message)
    return data
  }
  try {
    await t.test('未登录和普通团队所有者不能读取或修改全局配置', async () => {
      await request('/api/system/settings', { expected: 401 })
      const ordinary = await server.systemSettings.provisionAdmin('ordinary-system-test@example.test')
      const user = await server.database.userByEmail(ordinary.email)
      await server.database.execute('DELETE FROM system_administrators WHERE user_id=?', [user.id])
      const session = await server.database.createSession(user.id)
      await request('/api/system/settings', { token: `qijie_session=${session.token}`, expected: 403 })
      await request('/api/system/settings', { method: 'PUT', token: `qijie_session=${session.token}`, csrfToken: session.csrf, body: {}, expected: 403 })
      assert.equal((await server.database.membership((await server.database.workspaces(user.id))[0].id, user.id)).role, 'owner')
    })
    await t.test('本地初始化真实管理员，复用现有登录体系', async () => {
      admin = await server.systemSettings.provisionAdmin('admin-system-test@example.test')
      assert(admin.password.length >= 24)
      assert.equal((await server.systemSettings.provisionAdmin(admin.email)).password, null)
      const user = await server.database.userByEmail(admin.email)
      const session = await server.database.createSession(user.id)
      cookie = `qijie_session=${session.token}`; csrf = session.csrf
      assert.equal((await request('/api/auth/me')).isSystemAdmin, true)
      await request('/api/system/settings', { method: 'PUT', csrfToken: 'invalid', body: {}, expected: 403 })
    })
    await t.test('授权码从数据库读取，响应和审计不返回敏感值', async () => {
      const current = (await request('/api/system/settings')).settings
      const result = await request('/api/system/settings', { method: 'PUT', body: { revision: current.revision, values: { SMTP_HOST: 'smtp.qq.com', SMTP_PORT: '465', SMTP_SECURE: 'true', SMTP_USER: 'smtp-test@example.test', SMTP_PASSWORD: 'isolated-smtp-secret' } } })
      assert(!JSON.stringify(result).includes('isolated-smtp-secret'))
      assert.equal(result.settings.values.SMTP_PASSWORD, undefined)
      assert(result.settings.configuredSecrets.includes('SMTP_PASSWORD'))
      assert.equal(server.registrationMailer.transport.options.auth.pass, 'isolated-smtp-secret')
      assert.equal(result.emailDeliveryAvailable, true)
      const row = (await server.database.execute('SELECT value_ciphertext FROM system_settings WHERE id=1'))[0]
      assert(!row.value_ciphertext.includes('isolated-smtp-secret'))
      const audit = await request('/api/system/audit')
      assert(!JSON.stringify(audit).includes('isolated-smtp-secret'))
      assert(JSON.stringify(audit).includes('SMTP_PASSWORD'))
      await request('/api/system/settings', { method: 'PUT', body: { revision: current.revision, values: {} }, expected: 409 })
    })
    await t.test('密钥空输入保持原值，轮换和显式清除即时生效', async () => {
      let current = (await request('/api/system/settings')).settings
      await request('/api/system/settings', { method: 'PUT', body: { revision: current.revision, values: { SMTP_PASSWORD: '' } } })
      assert.equal(server.registrationMailer.transport.options.auth.pass, 'isolated-smtp-secret')
      current = (await request('/api/system/settings')).settings
      await request('/api/system/settings', { method: 'PUT', body: { revision: current.revision, values: { SMTP_PASSWORD: 'rotated-isolated-secret' } } })
      assert.equal(server.registrationMailer.transport.options.auth.pass, 'rotated-isolated-secret')
      current = (await request('/api/system/settings')).settings
      const result = await request('/api/system/settings', { method: 'PUT', body: { revision: current.revision, values: {}, clearSecrets: ['SMTP_PASSWORD'] } })
      assert.equal(result.emailDeliveryAvailable, false)
    })
    await t.test('非法字段、错误端口及无效密钥拒绝保存', async () => {
      const current = (await request('/api/system/settings')).settings
      for (const values of [{ PORT: '9000' }, { SMTP_PORT: '0' }, { ALIPAY_PRIVATE_KEY: 'invalid' }, { BILLING_PLANS: [{ id: 'incomplete' }] }]) await request('/api/system/settings', { method: 'PUT', body: { revision: current.revision, values }, expected: 400 })
      assert.equal((await request('/api/system/settings')).settings.revision, current.revision)
    })
    await t.test('套餐存入数据库并用于实际报价，后台资源可正常访问', async () => {
      const current = (await request('/api/system/settings')).settings
      const plan = { id: 'isolated-plan', name: '隔离验收套餐', amount: 1990, currency: 'CNY', periodDays: 30, enabled: true, quotas: { fingerprints: 2, environments: 2, members: 1 } }
      await request('/api/system/settings', { method: 'PUT', body: { revision: current.revision, values: { BILLING_PLANS: [plan] } } })
      assert.equal(server.billing.plans[0].amount, 1990)
      for (const file of ['/system-admin.html', '/system-admin.js', '/system-admin.css']) assert.equal((await fetch(origin + file)).status, 200)
    })
    await t.test('重启保留配置，不从旧环境文件重新覆盖', async () => {
      const revision = (await request('/api/system/settings')).settings.revision
      await server.stop()
      server = new WorkspaceServer({ port: 0, dataDir: directory, databaseName }); address = await server.start(); origin = `http://127.0.0.1:${address.port}`
      const state = await request('/api/system/settings')
      assert.equal(state.settings.revision, revision)
      assert.equal(state.emailDeliveryAvailable, false)
      assert.equal(server.billing.plans[0].id, 'isolated-plan')
    })
  } finally { await server.stop() }
})
