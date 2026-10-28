const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const crypto = require('node:crypto')
const { WorkspaceServer } = require('../src/workspace-server')
const { getDefaultProfile, createProxyConfig } = require('../../fingerprint-browser/profile-store')
const { createSmtpMailbox } = require('./smtp-mailbox')

test('实际代理检测、环境保存与客户端启动配置兼容', { skip: !process.env.SAAS_TEST_PROXY_URL }, async () => {
  const proxyUrl = new URL(process.env.SAAS_TEST_PROXY_URL)
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'qijie-live-proxy-'))
  const mailbox = await createSmtpMailbox(directory)
  const server = new WorkspaceServer({ port: 0, dataDir: directory, databaseName: 'qijie_workspace_test_' + crypto.randomBytes(8).toString('hex'), allowPrivateProxy: true, mailConfigFile: mailbox.configFile })
  const address = await server.start(); const origin = `http://127.0.0.1:${address.port}`
  let cookie; let csrf
  const api = async (route, body) => {
    const response = await fetch(origin + route, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie, 'X-CSRF-Token': csrf } : {}) }, body: JSON.stringify(body) })
    const data = await response.json(); assert(response.ok, data.message)
    if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0]
    return data
  }
  try {
    const email = `proxy-${crypto.randomUUID()}@example.test`
    await api('/api/auth/registration-code', { email })
    const owner = await api('/api/auth/register', { email, verificationCode: mailbox.codeFor(email), password: crypto.randomBytes(24).toString('hex'), name: '代理启动配置验收', workspaceName: '实际代理集成验收团队' })
    csrf = owner.csrf; const base = `/api/workspaces/${owner.workspaces[0].id}`
    const proxy = (await api(`${base}/proxies`, { name: '实际网络代理', protocol: proxyUrl.protocol === 'socks5:' ? 'socks5' : 'http', host: proxyUrl.hostname, port: Number(proxyUrl.port), username: decodeURIComponent(proxyUrl.username), password: decodeURIComponent(proxyUrl.password) })).item
    assert.equal(proxy.status, 'available'); assert(proxy.timezone); assert.equal(Object.hasOwn(proxy, 'credential'), false)
    const profile = getDefaultProfile(); profile.id = crypto.randomUUID(); profile.noise.seed = crypto.randomUUID(); profile.locale.timezone = proxy.timezone
    const fingerprint = (await api(`${base}/fingerprints`, { name: '网络出口兼容指纹', profile })).item
    const environment = (await api(`${base}/environments`, { name: '实际代理环境', fingerprintId: fingerprint.id, fingerprintVersion: fingerprint.version, proxyId: proxy.id, startUrl: origin + '/api/health', timezoneAcknowledged: true })).item
    const launch = await api(`${base}/environments/${environment.id}/launch`, {})
    const normalized = createProxyConfig(launch.profile.proxy)
    assert.equal(new URL(normalized.server).hostname, proxyUrl.hostname)
    assert.equal(normalized.mode, proxyUrl.protocol === 'socks5:' ? 'socks5' : 'http')
    assert.deepEqual(launch.profile.fingerprint, profile)
  } finally { await server.stop(); await mailbox.stop() }
})
