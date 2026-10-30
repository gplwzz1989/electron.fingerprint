const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const crypto = require('node:crypto')
const vm = require('node:vm')
const { EnvironmentRepository } = require('../environment-repository')
const { createProfileRecord, getDefaultProfile, ProfileValidationError } = require('../profile-store')
const { validateSessionSnapshot } = require('../session-restore')

test('同一远端资源重复启动复用已打开环境，本机标识归一化不改变种子及真实参数', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'encrypted-launch-identity-'))
  const repository = new EnvironmentRepository(directory); await repository.load()
  const reference = { origin: 'https://example.com', scope: crypto.randomUUID(), resourceId: crypto.randomUUID() }
  const fingerprint = getDefaultProfile(); fingerprint.noise.seed = crypto.randomUUID()
  const decrypted = { id: reference.resourceId, name: '隔离启动身份验收', url: 'https://example.com/platform', fingerprint }
  const tabs = new Map(); let launch; let importedSession
  const source = await fs.readFile(path.join(__dirname, '../main.js'), 'utf8')
  const start = source.indexOf("  handle('application:launch-encrypted',")
  const end = source.indexOf("  handle('window:action',", start)
  assert(start >= 0 && end > start)
  // 执行实际主进程处理器并使用真实文件仓储，只隔离 Electron 窗口及密文传输入口。
  vm.runInNewContext(source.slice(start, end), {
    require, fs, path, URL, validateSessionSnapshot, createProfileRecord, ProfileValidationError, assertTrusted () {}, assertFingerprintSave () {}, fingerprintRuntime: {},
    encryptedLaunchRequests: { consume: () => ({ profile: structuredClone(decrypted), reference: structuredClone(reference) }) },
    environmentRepository: repository,
    capabilityRegistry: { normalize: input => input },
    handle: (_channel, callback) => { launch = callback },
    tabBrowser: {
      async openEnvironment (environment, _policy, session) { importedSession = session; tabs.set(environment.id, ['test-tab']); await repository.update(environment.id, { status: 'open' }); return { tabId: 'test-tab' } },
      async reopen (id, _policy, session) { importedSession = session; tabs.set(id, ['test-tab']); return { tabId: 'test-tab' } },
      tabIdsForEnvironment: id => tabs.get(id) || [],
      select () {}, setCapabilities () {}, updateEnvironmentProfile () {}
    }
  })
  const first = await launch({ sender: {} }, { capabilities: [], allowedOrigins: [] })
  assert.equal(first.ok, true, first.error)
  const saved = repository.get(first.environmentId)
  assert.equal(saved.fingerprint.id, saved.profileId)
  assert.notEqual(saved.profileId, reference.resourceId)
  assert.equal(saved.fingerprint.noise.seed, fingerprint.noise.seed)
  const second = await launch({ sender: {} }, { capabilities: [], allowedOrigins: [] })
  assert.equal(second.ok, true, second.error)
  assert.equal(second.environmentId, first.environmentId)
  assert.equal(repository.list().length, 1)
  assert.deepEqual(repository.get(first.environmentId).fingerprint, saved.fingerprint)
  assert.deepEqual(repository.get(first.environmentId).externalReference, reference)
  // 真实参数变化仍必须拒绝覆盖打开中的环境，不能借修复放宽生命周期保护。
  decrypted.fingerprint.hardware.hardwareConcurrency = saved.fingerprint.hardware.hardwareConcurrency === 4 ? 8 : 4
  const changed = await launch({ sender: {} }, {})
  assert.equal(changed.ok, false)
  assert.match(changed.error, /服务端环境配置已变化/)
  assert.deepEqual(repository.get(first.environmentId).fingerprint, saved.fingerprint)
  // 同设备授权后按账号打开，必须复用采集目录，不能重新写云端 Cookie。
  decrypted.fingerprint = structuredClone(saved.fingerprint)
  decrypted.localSessionSource = { resourceId: reference.resourceId, operationId: 'isolated-authorization' }
  await fs.writeFile(path.join(saved.dataDir, 'local-session-capture.json'), JSON.stringify({ operationId: 'isolated-authorization' }))
  reference.resourceId = crypto.randomUUID(); decrypted.id = reference.resourceId
  decrypted.session = { format: 'desktop-session-v1', origins: ['https://example.com'], cookies: [], storage: {}, version: 1 }
  const localOpen = await launch({ sender: {} }, {})
  assert.equal(localOpen.ok, true, localOpen.error); assert.equal(localOpen.environmentId, first.environmentId)
  assert.equal(repository.list().length, 1)
  tabs.clear(); await repository.update(first.environmentId, { status: 'closed' })
  const localReopen = await launch({ sender: {} }, {})
  assert.equal(localReopen.ok, true, localReopen.error); assert.equal(localReopen.environmentId, first.environmentId)
  assert.equal(importedSession, null)
  // 其他设备或新的授权任务没有匹配采集凭据，仍必须恢复云端会话。
  decrypted.localSessionSource.operationId = 'different-authorization'
  const remoteOpen = await launch({ sender: {} }, {})
  assert.equal(remoteOpen.ok, true, remoteOpen.error); assert.notEqual(remoteOpen.environmentId, first.environmentId)
  assert.equal(importedSession.version, 1)
})
