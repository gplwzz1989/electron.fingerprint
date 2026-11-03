'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const {
  ensureObjectRequest,
  createResponseEnvelope,
  createErrorEnvelope,
  createEventEnvelope
} = require('../protocol-envelope')

test('protocol-envelope: ensureObjectRequest 严格校验单一对象参数', () => {
  assert.deepEqual(ensureObjectRequest({ a: 1 }), { a: 1 })
  assert.deepEqual(ensureObjectRequest(undefined), {})
  assert.deepEqual(ensureObjectRequest(null), {})
  
  assert.throws(() => ensureObjectRequest('string-id', 'testMethod'), /接口 testMethod 参数必须为对象/)
  assert.throws(() => ensureObjectRequest(123, 'testMethod'), /接口 testMethod 参数必须为对象/)
  assert.throws(() => ensureObjectRequest([1, 2], 'testMethod'), /接口 testMethod 参数必须为对象/)
})

test('protocol-envelope: createResponseEnvelope 正确生成统一响应信封', () => {
  const success = createResponseEnvelope(true, { list: [1, 2] }, 'SUCCESS', '获取成功', 'tr-1')
  assert.equal(success.ok, true)
  assert.equal(success.code, 'SUCCESS')
  assert.equal(success.message, '获取成功')
  assert.deepEqual(success.data, { list: [1, 2] })
  assert.equal(success.traceId, 'tr-1')
  assert.ok(typeof success.timestamp === 'number')

  const voidSuccess = createResponseEnvelope(true)
  assert.equal(voidSuccess.ok, true)
  assert.equal(voidSuccess.code, 'SUCCESS')
  assert.equal(voidSuccess.message, '操作成功')
  assert.equal('data' in voidSuccess, false)
})

test('protocol-envelope: createErrorEnvelope 正确生成错误信封', () => {
  const err = createErrorEnvelope('ENV_NOT_FOUND', '环境不存在', { id: 'e-1' })
  assert.equal(err.ok, false)
  assert.equal(err.code, 'ENV_NOT_FOUND')
  assert.equal(err.message, '环境不存在')
  assert.deepEqual(err.details, { id: 'e-1' })
})

test('protocol-envelope: createEventEnvelope 正确生成推送信封', () => {
  const evt = createEventEnvelope('tabs:changed', { activeId: 't-1' }, 'tabBrowser')
  assert.equal(evt.event, 'tabs:changed')
  assert.equal(evt.source, 'tabBrowser')
  assert.deepEqual(evt.data, { activeId: 't-1' })
  assert.ok(typeof evt.timestamp === 'number')
})
