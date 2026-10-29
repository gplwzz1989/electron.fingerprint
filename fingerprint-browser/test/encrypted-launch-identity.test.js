const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const crypto = require('node:crypto')
const vm = require('node:vm')
const { EnvironmentRepository } = require('../environment-repository')
const { createProfileRecord, getDefaultProfile, ProfileValidationError } = require('../profile-store')

test('同一远端资源重复启动复用已打开环境，本机标识归一化不改变种子及真实参数', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'encrypted-launch-identity-'))
  const repository = new EnvironmentRepository(directory); await repository.load()
  const reference = { origin: 'https://example.com', scope: crypto.randomUUID(), resourceId: crypto.randomUUID() }
  const fingerprint = getDefaultProfile(); fingerprint.noise.seed = crypto.randomUUID()
  const decrypted = { id: reference.resourceId, name: '隔离启动身份验收', url: 'https://example.com/platform', fingerprint }
  const tabs = new Map(); let launch
  const source = await fs.readFile(path.join(__dirname, '../main.js'), 'utf8')
  const start = source.indexOf("  handle('application:launch-encrypted',")
  const end = source.indexOf("  handle('window:action',", start)
  assert(start >= 0 && end > start)
  // 执行实际主进程处理器并使用真实文件仓储，只隔离 Electron 窗口及密文传输入口。
  vm.runInNewContext(source.slice(start, end), {
    require, createProfileRecord, ProfileValidationError, assertTrusted () {}, assertFingerprintSave () {}, fingerprintRuntime: {},
    encryptedLaunchRequests: { consume: () => ({ profile: structuredClone(decrypted), reference: structuredClone(reference) }) },
    environmentRepository: repository,
    capabilityRegistry: { normalize: input => input },
    handle: (_channel, callback) => { launch = callback },
    tabBrowser: {
      async openEnvironment (environment) { tabs.set(environment.id, ['test-tab']); await repository.update(environment.id, { status: 'open' }); return { tabId: 'test-tab' } },
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
})
