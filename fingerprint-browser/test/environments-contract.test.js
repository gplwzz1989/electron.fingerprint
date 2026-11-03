'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const {
  ensureObjectRequest,
  createResponseEnvelope,
  createErrorEnvelope
} = require('../protocol-envelope')
const { businessChannels } = require('../client-api-contract')

test('阶段三环境与启动接口契约白名单：包含 environments:*-v2 独立通道', () => {
  assert.ok(businessChannels.has('environments:list-v2'), '应当包含 environments:list-v2')
  assert.ok(businessChannels.has('environments:prepare-launch-v2'), '应当包含 environments:prepare-launch-v2')
  assert.ok(businessChannels.has('environments:launch-v2'), '应当包含 environments:launch-v2')
  assert.ok(businessChannels.has('environments:close-v2'), '应当包含 environments:close-v2')
  assert.ok(businessChannels.has('environments:remove-v2'), '应当包含 environments:remove-v2')
  assert.ok(businessChannels.has('environments:update-v2'), '应当包含 environments:update-v2')
})

test('阶段三环境接口参数强制对象化：基础类型直接拦截', () => {
  assert.throws(() => ensureObjectRequest('env-123', 'environments.close'), /必须为对象/)
  assert.throws(() => ensureObjectRequest('env-456', 'environments.remove'), /必须为对象/)
  assert.throws(() => ensureObjectRequest(789, 'environments.update'), /必须为对象/)

  const req = ensureObjectRequest({ id: 'env-123' }, 'environments.close')
  assert.equal(req.id, 'env-123')

  // prepareLaunch 信封规范
  const prepEnvelope = createResponseEnvelope(true, {
    requestId: 'req-1',
    nonce: '00'.repeat(32),
    publicKey: '-----BEGIN PUBLIC KEY-----...',
    protocol: 'desktop-launch-v1'
  }, 'SUCCESS', '准备完成')

  assert.equal(prepEnvelope.ok, true)
  assert.equal(prepEnvelope.data.requestId, 'req-1')
  assert.ok(prepEnvelope.data.publicKey.includes('PUBLIC KEY'))
})
