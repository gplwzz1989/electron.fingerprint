const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const crypto = require('node:crypto')
const { WorkspaceServer } = require('../src/workspace-server')
const { createSmtpMailbox } = require('./smtp-mailbox')

async function withRegistration (run) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'qijie-email-registration-'))
  const mailbox = await createSmtpMailbox(directory)
  const options = { port: 0, dataDir: directory, databaseName: 'qijie_workspace_test_' + crypto.randomBytes(8).toString('hex'), mailConfigFile: mailbox.configFile }
  let server = new WorkspaceServer(options); let address = await server.start()
  const context = {
    mailbox,
    database: () => server.database,
    api: async (route, body, expected = 200) => {
      const response = await fetch(`http://127.0.0.1:${address.port}${route}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await response.json(); assert.equal(response.status, expected, data.message)
      return data
    },
    restart: async () => { await server.stop(); server = new WorkspaceServer(options); address = await server.start() }
  }
  try { await run(context) } finally { await server.stop(); await mailbox.stop() }
}
const payload = email => ({ email, name: '邮箱注册验收', workspaceName: '隔离邮件验收团队', password: crypto.randomBytes(24).toString('hex') })

test('注册必须验证邮箱；真实 SMTP 收件、错误码、绑定邮箱与一次性消费', async () => {
  await withRegistration(async ({ api, mailbox, database }) => {
    const body = { email: 'verified@example.test', nickname: '邮箱注册验收', password: 'aB3!xY7?' }
    await api('/api/auth/registration-code', { email: '<verified@example.test>' }, 400)
    await api('/api/auth/registration-code', { email: 'a..b@example.test' }, 400)
    await api('/api/auth/registration-code', { email: 'verified@example.test\r\nBcc: other@example.test' }, 400)
    await api('/api/auth/register', body, 400)
    await api('/api/auth/register', { ...body, verificationCode: '000000' }, 400)
    const sent = await api('/api/auth/registration-code', { email: body.email.toUpperCase() })
    assert.equal(sent.expiresInSeconds, 300); assert.equal(sent.retryAfterSeconds, 60); assert.equal(Object.hasOwn(sent, 'code'), false)
    const code = mailbox.codeFor(body.email)
    const stored = (await database().execute('SELECT * FROM registration_codes WHERE email=?', [body.email]))[0]
    assert.equal(stored.delivered, 1); assert.equal(stored.code_hash.length, 64); assert.notEqual(stored.code_hash, code)
    await api('/api/auth/registration-code', { email: body.email }, 429); assert.equal(mailbox.messages.length, 1)
    const incorrect = code === '000000' ? '111111' : '000000'
    await api('/api/auth/register', { ...body, verificationCode: incorrect }, 400)
    assert.equal((await database().execute('SELECT attempts FROM registration_codes WHERE email=?', [body.email]))[0].attempts, 1)
    await api('/api/auth/register', { ...body, email: 'different@example.test', verificationCode: code }, 400)
    const tooShort = await api('/api/auth/register', { ...body, password: 'aB3!xY7', verificationCode: code }, 400)
    assert.match(tooShort.message, /8 个字符/)
    const registered = await api('/api/auth/register', { ...body, verificationCode: code }, 201)
    assert.equal(registered.user.email, body.email)
    assert.equal(registered.user.name, body.nickname)
    assert.equal(registered.workspaces[0].name, body.nickname)
    assert.equal(registered.workspaces[0].role, 'owner')
    const user = await database().userByEmail(body.email); assert(user.email_verified_at > 0)
    assert((await database().execute('SELECT consumed_at FROM registration_codes WHERE email=?', [body.email]))[0].consumed_at > 0)
    await api('/api/auth/register', { ...body, verificationCode: code }, 409)
    assert.equal((await database().execute('SELECT count(*) AS count FROM users'))[0].count, 1)
  })
})

test('验证码过期、重发替换与服务重启后的有效性', async () => {
  await withRegistration(async ({ api, mailbox, database, restart }) => {
    const body = payload('expires@example.test')
    await api('/api/auth/registration-code', { email: body.email }); const oldCode = mailbox.codeFor(body.email)
    await database().execute('UPDATE registration_codes SET expires_at=?,resend_after=0 WHERE email=?', [Date.now() - 1, body.email])
    await api('/api/auth/register', { ...body, verificationCode: oldCode }, 400)
    await api('/api/auth/registration-code', { email: body.email }); const newCode = mailbox.codeFor(body.email)
    if (oldCode !== newCode) await api('/api/auth/register', { ...body, verificationCode: oldCode }, 400)
    await restart()
    await api('/api/auth/register', { ...body, verificationCode: newCode }, 201)
  })
})

test('验证码错误达到五次后锁定，重新获取后恢复', async () => {
  await withRegistration(async ({ api, mailbox, database }) => {
    const body = payload('attempts@example.test')
    await api('/api/auth/registration-code', { email: body.email }); const code = mailbox.codeFor(body.email)
    for (let index = 0; index < 5; index++) await api('/api/auth/register', { ...body, verificationCode: code === '000000' ? '111111' : '000000' }, 400)
    await api('/api/auth/register', { ...body, verificationCode: code }, 429)
    await database().execute('UPDATE registration_codes SET resend_after=0 WHERE email=?', [body.email])
    await api('/api/auth/registration-code', { email: body.email })
    await api('/api/auth/register', { ...body, verificationCode: mailbox.codeFor(body.email) }, 201)
  })
})

test('SMTP 拒收不会使验证码可用，账户与团队均不会创建', async () => {
  await withRegistration(async ({ api, mailbox, database }) => {
    const body = payload('failed-delivery@example.test'); mailbox.rejectNext = true
    await api('/api/auth/registration-code', { email: body.email }, 503)
    const stored = (await database().execute('SELECT * FROM registration_codes WHERE email=?', [body.email]))[0]
    assert.equal(stored.delivered, 0); assert.equal(mailbox.messages.length, 0)
    await api('/api/auth/register', { ...body, verificationCode: '000000' }, 400)
    assert.equal((await database().execute('SELECT count(*) AS count FROM users'))[0].count, 0)
    assert.equal((await database().execute('SELECT count(*) AS count FROM workspaces'))[0].count, 0)
  })
})

test('同一邮箱每小时发送次数限制落在 MySQL 中', async () => {
  await withRegistration(async ({ api, mailbox, database }) => {
    const email = 'mailbox-limit@example.test'
    for (let index = 0; index < 5; index++) {
      await api('/api/auth/registration-code', { email })
      await database().execute('UPDATE registration_codes SET resend_after=0 WHERE email=?', [email])
    }
    await api('/api/auth/registration-code', { email }, 429); assert.equal(mailbox.messages.length, 5)
  })
})

test('同一来源每小时发送次数受限，不依赖单进程内存计数', async () => {
  await withRegistration(async ({ api, mailbox, restart }) => {
    for (let index = 0; index < 20; index++) await api('/api/auth/registration-code', { email: `ip-limit-${index}@example.test` })
    await restart()
    await api('/api/auth/registration-code', { email: 'ip-limit-final@example.test' }, 429)
    assert.equal(mailbox.messages.length, 20)
  })
})

test('未配置邮件服务时拒绝发送与绕过注册', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'qijie-email-unavailable-'))
  const configFile = path.join(directory, 'smtp.env'); fs.writeFileSync(configFile, 'SMTP_HOST=smtp.qq.com\nSMTP_PORT=465\nSMTP_SECURE=true\nSMTP_USER=\nSMTP_PASSWORD=\n', 'utf8')
  const server = new WorkspaceServer({ port: 0, dataDir: directory, databaseName: 'qijie_workspace_test_' + crypto.randomBytes(8).toString('hex'), mailConfigFile: configFile })
  const address = await server.start(); const origin = `http://127.0.0.1:${address.port}`
  try {
    const options = await (await fetch(origin + '/api/auth/registration-options')).json()
    assert.equal(options.emailVerificationRequired, true); assert.equal(options.emailDeliveryAvailable, false)
    const response = await fetch(origin + '/api/auth/registration-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'not-configured@example.test' }) })
    assert.equal(response.status, 503)
    const registration = await fetch(origin + '/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload('not-configured@example.test'), verificationCode: '000000' }) })
    assert.equal(registration.status, 400)
    assert.equal((await server.database.execute('SELECT count(*) AS count FROM users'))[0].count, 0)
  } finally { await server.stop() }
})

test('并发注册同一邮箱只创建一个账户和团队', async () => {
  await withRegistration(async ({ mailbox, database }) => {
    const body = payload('concurrent@example.test')
    const mailer = new (require('../src/registration-mailer').RegistrationMailer)(database(), mailbox.configFile)
    await mailer.sendCode(body.email, '127.0.0.1'); const verificationCode = mailbox.codeFor(body.email)
    const results = await Promise.allSettled([database().register({ ...body, verificationCode }), database().register({ ...body, verificationCode })])
    mailer.close()
    assert.equal(results.filter(item => item.status === 'fulfilled').length, 1)
    assert.equal((await database().execute('SELECT count(*) AS count FROM users'))[0].count, 1)
    assert.equal((await database().execute('SELECT count(*) AS count FROM workspaces'))[0].count, 1)
  })
})
