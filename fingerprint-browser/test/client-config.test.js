const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { getClientConfig, validateAppUrl } = require('../client-config')

test('URL 工作空间只接受 HTTPS 或本机开发 HTTP', () => {
  assert.equal(validateAppUrl('http://127.0.0.1:8088/'), 'http://127.0.0.1:8088/')
  assert.equal(validateAppUrl('https://workspace.example/'), 'https://workspace.example/')
  for (const url of ['file:///index.html', 'javascript:alert(1)', 'http://remote.example/', 'https://user:password@example/', 'https://workspace.example/#signin', 'https://workspace.example/?token=value']) assert.throws(() => validateAppUrl(url))
})

test('开发环境读取打包配置；test 和 prod 缺少地址时拒绝启动', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'qijie-client-config-'))
  fs.writeFileSync(path.join(directory, 'build-config.json'), JSON.stringify({ dev: { appUrl: 'http://127.0.0.1:8088/' }, test: { appUrl: '' }, prod: { appUrl: '' } }))
  assert.deepEqual(getClientConfig({ directory, env: {} }), { appUrl: 'http://127.0.0.1:8088/', environment: 'dev' })
  assert.throws(() => getClientConfig({ directory, env: { FP_BUILD_ENV: 'test' } }), /未配置工作空间地址/)
  assert.throws(() => getClientConfig({ directory, env: { FP_BUILD_ENV: 'prod' } }), /未配置工作空间地址/)
  assert.throws(() => getClientConfig({ directory, packaged: true, env: {} }), /未配置工作空间地址/)
  fs.writeFileSync(path.join(directory, 'client-config.json'), JSON.stringify({ environment: 'test', appUrl: 'https://test.workspace.example/' }))
  assert.deepEqual(getClientConfig({ directory, packaged: true, env: {} }), { environment: 'test', appUrl: 'https://test.workspace.example/' })
})
