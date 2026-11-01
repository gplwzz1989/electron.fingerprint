const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const crypto = require('node:crypto')
const vm = require('node:vm')
const { EnvironmentRepository } = require('../environment-repository')
const { createProfileRecord, getDefaultProfile, ProfileValidationError } = require('../profile-store')

test('授权未选择环境时：不创建环境、不使用伪造指纹，使用受控原生标签页', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'unbound-auth-'))
  const repository = new EnvironmentRepository(directory)
  await repository.load()

  const source = await fs.readFile(path.join(__dirname, '../main.js'), 'utf8')
  const start = source.indexOf('async function preparePlatformAuthorization (owner, input) {')
  const end = source.indexOf('async function installClientUpdate () {', start)
  assert(start >= 0 && end > start)

  let ordinaryOpened = null
  let environmentOpened = null

  const sandbox = {
    require, fs, path, URL, randomUUID: crypto.randomUUID, createProfileRecord, getDefaultProfile, ProfileValidationError,
    assertFingerprintSave () {}, fingerprintRuntime: {},
    encryptedLaunchRequests: { consume: () => ({}) },
    environmentRepository: repository,
    capabilityRegistry: { normalize: input => input },
    DEFAULT_GROUP_NAME: '未分组',
    tabBrowser: {
      openOrdinary: async (url, options) => {
        ordinaryOpened = { url, options }
        return { tabId: 'ordinary-managed-tab-1' }
      },
      openEnvironment: async env => {
        environmentOpened = env
        return { tabId: 'env-tab-1' }
      },
      isOpen: () => false
    }
  }

  vm.runInNewContext(source.slice(start, end), sandbox)
  const prepare = sandbox.preparePlatformAuthorization

  const owner = { getURL: () => 'http://127.0.0.1:8088/#accounts' }
  const input = {
    task: { id: 'auth-task-no-env', mode: 'authorize', platformKey: 'douyin' },
    scope: 'workspace-1',
    resourceId: ''
  }

  const result = await prepare(owner, input)
  assert.equal(result.tabId, 'ordinary-managed-tab-1')
  assert.equal(result.environmentId, null)
  assert.equal(ordinaryOpened.options.kind, 'managed')
  assert.equal(environmentOpened, null)
  assert.equal(repository.list().length, 0, '未选环境时不应在环境仓储中生成持久环境')
})

test('授权选择了未曾打开过的远端环境：通过信封自动初始化本地环境，直接使用该环境的指纹与代理', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'unbound-auth-remote-'))
  const repository = new EnvironmentRepository(directory)
  await repository.load()

  const source = await fs.readFile(path.join(__dirname, '../main.js'), 'utf8')
  const start = source.indexOf('async function preparePlatformAuthorization (owner, input) {')
  const end = source.indexOf('async function installClientUpdate () {', start)
  assert(start >= 0 && end > start)

  const remoteEnvId = 'env-server-123'
  const customFp = getDefaultProfile()
  customFp.noise.seed = 'custom-server-seed'
  customFp.locale.timezone = 'America/New_York'

  let environmentOpened = null

  const sandbox = {
    require, fs, path, URL, randomUUID: crypto.randomUUID, createProfileRecord, getDefaultProfile, ProfileValidationError,
    assertFingerprintSave () {}, fingerprintRuntime: {},
    encryptedLaunchRequests: {
      consume: (_sender, req) => {
        assert.equal(req.requestId, 'test-request-id')
        return {
          profile: {
            id: remoteEnvId,
            name: '远端纽约环境',
            url: 'about:blank',
            fingerprint: customFp,
            proxy: { mode: 'direct', server: '', username: '', password: '' }
          },
          reference: { origin: 'http://127.0.0.1:8088', scope: 'workspace-1', resourceId: remoteEnvId }
        }
      }
    },
    environmentRepository: repository,
    capabilityRegistry: { normalize: input => input },
    DEFAULT_GROUP_NAME: '未分组',
    tabBrowser: {
      openOrdinary: async () => ({ tabId: 'fail-tab' }),
      openEnvironment: async env => {
        environmentOpened = env
        return { tabId: 'env-auth-tab' }
      },
      isOpen: () => false
    }
  }

  vm.runInNewContext(source.slice(start, end), sandbox)
  const prepare = sandbox.preparePlatformAuthorization

  const owner = { getURL: () => 'http://127.0.0.1:8088/#accounts' }
  const input = {
    task: { id: 'auth-task-with-remote-env', mode: 'authorize', platformKey: 'douyin' },
    scope: 'workspace-1',
    resourceId: remoteEnvId,
    requestId: 'test-request-id',
    envelope: { format: 'desktop-launch-v1' }
  }

  const result = await prepare(owner, input)
  assert.equal(result.tabId, 'env-auth-tab')
  assert(result.environmentId)
  assert(environmentOpened)
  assert.equal(environmentOpened.fingerprint.locale.timezone, 'America/New_York')
  assert.equal(environmentOpened.fingerprint.noise.seed, 'custom-server-seed')
})

test('未绑定环境的账号打开：解封后指纹为 disabled，启动原生会话并不注入指纹欺骗', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'unbound-account-launch-'))
  const repository = new EnvironmentRepository(directory)
  await repository.load()

  const accountId = 'account-without-env'
  const reference = { origin: 'http://127.0.0.1:8088', scope: 'workspace-1', resourceId: accountId }
  const decrypted = {
    id: accountId,
    name: '无环境授权账号',
    url: 'https://channels.weixin.qq.com/',
    fingerprint: null,
    proxy: { mode: 'direct', server: '', username: '', password: '' },
    session: { format: 'desktop-session-v1', cookies: [], storage: {}, version: 1 }
  }

  const source = await fs.readFile(path.join(__dirname, '../main.js'), 'utf8')
  const start = source.indexOf("  handle('application:launch-encrypted',")
  const end = source.indexOf("  handle('window:action',", start)
  assert(start >= 0 && end > start)

  let launchedEnv = null
  let launchHandler = null

  const sandbox = {
    require, fs, path, URL, randomUUID: crypto.randomUUID, createProfileRecord, ProfileValidationError,
    validateSessionSnapshot: input => input,
    assertTrusted () {},
    assertFingerprintSave (fp) {
      assert.equal(fp.enabled, false, '无环境账号的指纹必须处于关闭状态（原生模式）')
    },
    fingerprintRuntime: {},
    encryptedLaunchRequests: {
      consume: () => ({ profile: structuredClone(decrypted), reference: structuredClone(reference) })
    },
    environmentRepository: repository,
    platformRuntime: { load: async () => ({ runtime: { catalog: [] } }), bind () {} },
    capabilityRegistry: { normalize: input => input },
    handle: (_channel, callback) => { launchHandler = callback },
    tabBrowser: {
      async openEnvironment (env) {
        launchedEnv = env
        return { tabId: 'account-tab-1' }
      },
      isOpen: () => false,
      tabIdsForEnvironment: () => []
    }
  }

  vm.runInNewContext(source.slice(start, end), sandbox)
  const result = await launchHandler({ sender: {} }, { capabilities: [], allowedOrigins: [] })
  assert.equal(result.ok, true, result.error)
  assert(launchedEnv)
  assert.equal(launchedEnv.fingerprint.enabled, false, '启动环境的指纹必须未启用（原生）')
})

test('Cookie 加解密端到端保留：无环境/无指纹（fingerprint为null）账号的加密信封可正常解密', () => {
  const { createLaunchRequest } = require('../fingerprint-envelope')
  const { sealLaunch } = require('./protocol-provider')
  const context = { scope: 'test-workspace', resourceId: 'test-unbound-account' }
  const profile = {
    id: context.resourceId,
    name: '无指纹账号',
    url: 'https://channels.weixin.qq.com/',
    fingerprint: null,
    proxy: { mode: 'direct', server: '', username: '', password: '' },
    session: { format: 'desktop-session-v1', cookies: [{ name: 'test_token', value: 'secret_123' }], storage: {} }
  }

  const clientReq = createLaunchRequest(context.scope, context.resourceId)
  const encrypted = sealLaunch(profile, clientReq.request, context)

  // 解密信封必须成功，不能因 fingerprint 为 null 而抛解密失败
  const opened = clientReq.open(encrypted)
  assert.equal(opened.id, context.resourceId)
  assert.equal(opened.fingerprint, null)
  assert.deepEqual(opened.session.cookies, profile.session.cookies)
})

