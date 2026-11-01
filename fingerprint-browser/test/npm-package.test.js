const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const pkg = require('../index')
const { parseArgs } = require('../bin/cli')
const metadata = require('../package.json')

test('NPM 包入口完整导出核心 API 与协议常量', () => {
  assert.equal(typeof pkg.launch, 'function')
  assert.equal(typeof pkg.getLaunchOptions, 'function')
  assert.equal(typeof pkg.runtimeExecutable, 'function')
  assert.equal(typeof pkg.resolveCandidateRuntime, 'function')
  assert.equal(typeof pkg.getClientConfig, 'function')
  assert.equal(typeof pkg.dataRoot, 'function')
  assert.equal(typeof pkg.defaultDataRoot, 'function')

  assert.equal(pkg.PROTOCOL_VERSION, 'desktop-launch-v1')
  assert.equal(typeof pkg.createLaunchRequest, 'function')
  assert.equal(typeof pkg.openLaunch, 'function')
  assert.equal(typeof pkg.sealLaunch, 'function')
  assert.equal(typeof pkg.validateLaunchRequest, 'function')

  assert.equal(typeof pkg.createProfileRecord, 'function')
  assert.equal(typeof pkg.getDefaultProfile, 'function')
  assert.equal(typeof pkg.getPresetTemplates, 'function')
})

test('NPM 包提供的 sealLaunch 与 createLaunchRequest 对称端到端加解密', () => {
  const scope = 'test-workspace-001'
  const resourceId = 'test-env-001'

  // 1. 模拟客户端发起启动请求
  const client = pkg.createLaunchRequest(scope, resourceId)
  assert.equal(client.request.protocol, 'desktop-launch-v1')
  assert.equal(client.request.scope, scope)
  assert.equal(client.request.resourceId, resourceId)

  // 2. 模拟服务端或调用方生成加密信封
  const mockProfile = {
    id: resourceId,
    name: 'NPM 测试环境',
    url: 'https://example.com',
    fingerprint: { ...pkg.getDefaultProfile(), id: resourceId }
  }
  const envelope = pkg.sealLaunch(mockProfile, client.request, { workspaceId: scope, environmentId: resourceId })
  assert.equal(envelope.format, 'desktop-launch-v1')
  assert.equal(envelope.scope, scope)
  assert.equal(envelope.resourceId, resourceId)
  assert.equal(typeof envelope.ciphertext, 'string')
  assert.equal(typeof envelope.wrappedKey, 'string')

  // 3. 模拟客户端消费解密信封
  const decrypted = client.open(envelope)
  assert.equal(decrypted.id, resourceId)
  assert.equal(decrypted.name, 'NPM 测试环境')
  assert.equal(decrypted.url, 'https://example.com')
})

test('CLI 参数解析工具正确处理各种长短参数与标志位', () => {
  const argv = [
    '--url', 'https://test.example.com',
    '-r', 'D:/custom-runtime',
    '--data-dir', 'D:/custom-data',
    '--env', 'prod',
    '--name', '定制浏览器',
    '--id', 'com.custom.app',
    '--detached',
    '--',
    '--disable-gpu',
    '--no-sandbox'
  ]
  const parsed = parseArgs(argv)
  assert.equal(parsed.appUrl, 'https://test.example.com')
  assert.equal(parsed.runtimeRoot, 'D:/custom-runtime')
  assert.equal(parsed.dataDir, 'D:/custom-data')
  assert.equal(parsed.environment, 'prod')
  assert.equal(parsed.appName, '定制浏览器')
  assert.equal(parsed.applicationId, 'com.custom.app')
  assert.equal(parsed.detached, true)
  assert.deepEqual(parsed.extraArgs, ['--disable-gpu', '--no-sandbox'])
})

test('CLI 二进制可通过 Node 正常调用并输出帮助和版本', () => {
  const cliPath = path.resolve(__dirname, '../bin/cli.js')

  const helpOutput = execFileSync(process.execPath, [cliPath, '--help'], { encoding: 'utf8' })
  assert.match(helpOutput, /指纹浏览器基座 CLI/)
  assert.match(helpOutput, /--url/)
  assert.match(helpOutput, /--runtime/)

  const versionOutput = execFileSync(process.execPath, [cliPath, '--version'], { encoding: 'utf8' }).trim()
  assert.equal(versionOutput, metadata.version)
})
