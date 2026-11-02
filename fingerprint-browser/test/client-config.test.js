const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const crypto = require('node:crypto')
const { getClientConfig, validateAppUrl } = require('../client-config')

test('URL 工作空间只接受 HTTPS 或本机开发 HTTP', () => {
  assert.equal(validateAppUrl('http://127.0.0.1:8088/'), 'http://127.0.0.1:8088/')
  assert.equal(validateAppUrl('https://workspace.example/'), 'https://workspace.example/')
  for (const url of ['file:///index.html', 'javascript:alert(1)', 'http://remote.example/', 'https://user:password@example/', 'https://workspace.example/#signin', 'https://workspace.example/?token=value']) assert.throws(() => validateAppUrl(url))
})

test('开发环境读取打包配置；test 和 prod 缺少地址时拒绝启动', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'qijie-client-config-'))
  fs.writeFileSync(path.join(directory, 'build-config.json'), JSON.stringify({ dev: { appUrl: 'http://127.0.0.1:8088/' }, test: { appUrl: '' }, prod: { appUrl: '' } }))
  assert.equal(getClientConfig({ directory, env: {} }).appUrl, 'http://127.0.0.1:8088/')
  assert.equal(getClientConfig({ directory, env: {} }).updates.enabled, false)
  assert.throws(() => getClientConfig({ directory, env: { FP_BUILD_ENV: 'test' } }), /未配置工作空间地址/)
  assert.throws(() => getClientConfig({ directory, env: { FP_BUILD_ENV: 'prod' } }), /未配置工作空间地址/)
  assert.throws(() => getClientConfig({ directory, packaged: true, env: {} }), /未配置工作空间地址/)
  fs.writeFileSync(path.join(directory, 'client-config.json'), JSON.stringify({ environment: 'test', appUrl: 'https://test.workspace.example/' }))
  assert.equal(getClientConfig({ directory, packaged: true, env: {} }).updates.url, '')
  assert.equal(getClientConfig({ directory, packaged: true, env: { FP_APP_URL: 'https://other.example/' } }).appUrl, 'https://test.workspace.example/', '发行包首页不能被环境变量替换。')
  fs.writeFileSync(path.join(directory, 'client-config.json'), JSON.stringify({ environment: 'prod', appUrl: 'https://workspace.example/', updatesEnabled: true }))
  assert.throws(() => getClientConfig({ directory, packaged: true, env: {} }), /未配置更新验签公钥/)
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519')
  fs.writeFileSync(path.join(directory, 'client-config.json'), JSON.stringify({ environment: 'prod', appUrl: 'https://workspace.example/', updatesEnabled: false, updatePublicKey: privateKey.export({ type: 'pkcs8', format: 'pem' }) }))
  assert.throws(() => getClientConfig({ directory, packaged: true, env: {} }), /禁止写入签名私钥/)
  fs.writeFileSync(path.join(directory, 'client-config.json'), JSON.stringify({ environment: 'prod', appUrl: 'https://workspace.example/', updatesEnabled: true, updateUrl: 'https://updates.example/prod.json', updatePublicKey: publicKey.export({ type: 'spki', format: 'pem' }) }))
  assert.equal(getClientConfig({ directory, packaged: true, env: {} }).updates.enabled, true)
})

test('多环境独立属性推导：dev、test 与 prod 具有独立默认应用名与包标识，支持中文及括号', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'qijie-client-config-env-'))
  fs.writeFileSync(path.join(directory, 'client-config.json'), JSON.stringify({
    environment: 'dev',
    appUrl: 'http://127.0.0.1:8088/'
  }))
  const devConfig = getClientConfig({ directory, packaged: true, env: {} })
  assert.equal(devConfig.appName, '指纹浏览器 (开发版)')
  assert.equal(devConfig.applicationId, 'com.qijie.fingerprintbrowser.dev')

  fs.writeFileSync(path.join(directory, 'client-config.json'), JSON.stringify({
    environment: 'test',
    appUrl: 'https://test.workspace.example/'
  }))
  const testConfig = getClientConfig({ directory, packaged: true, env: {} })
  assert.equal(testConfig.appName, '指纹浏览器 (测试版)')
  assert.equal(testConfig.applicationId, 'com.qijie.fingerprintbrowser.test')

  fs.writeFileSync(path.join(directory, 'client-config.json'), JSON.stringify({
    environment: 'prod',
    appUrl: 'https://workspace.example/'
  }))
  const prodConfig = getClientConfig({ directory, packaged: true, env: {} })
  assert.equal(prodConfig.appName, '指纹浏览器')
  assert.equal(prodConfig.applicationId, 'com.qijie.fingerprintbrowser')
})
