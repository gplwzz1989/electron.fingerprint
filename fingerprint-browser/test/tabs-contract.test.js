'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const {
  ensureObjectRequest,
  createResponseEnvelope,
  createErrorEnvelope
} = require('../protocol-envelope')
const { businessChannels, shellChannels } = require('../client-api-contract')

test('阶段二标签页接口契约白名单：包含 tabs:*-v2 独立通道', () => {
  assert.ok(businessChannels.has('tabs:list-v2'), '应当包含 tabs:list-v2')
  assert.ok(businessChannels.has('tabs:select-v2'), '应当包含 tabs:select-v2')
  assert.ok(businessChannels.has('tabs:close-v2'), '应当包含 tabs:close-v2')
  assert.ok(businessChannels.has('tabs:navigate-v2'), '应当包含 tabs:navigate-v2')
  assert.ok(businessChannels.has('tabs:create-v2'), '应当包含 tabs:create-v2')
  assert.ok(businessChannels.has('tabs:open-devtools'), '应当包含 tabs:open-devtools')
  assert.ok(businessChannels.has('tabs:dashboard-v2'), '应当包含 tabs:dashboard-v2')

  assert.ok(shellChannels.has('tabs:list-v2'), '外壳应当有权调用 tabs:list-v2')
  assert.ok(shellChannels.has('tabs:select-v2'), '外壳应当有权调用 tabs:select-v2')
  assert.ok(shellChannels.has('tabs:close-v2'), '外壳应当有权调用 tabs:close-v2')
})

test('阶段二标签页接口参数强制对象化：基础类型直接拦截', () => {
  // 必须是对象
  assert.throws(() => ensureObjectRequest('tab-123', 'tabs.select'), /必须为对象/)
  assert.throws(() => ensureObjectRequest(456, 'tabs.close'), /必须为对象/)
  assert.throws(() => ensureObjectRequest('https://example.com', 'tabs.navigate'), /必须为对象/)

  // 正确对象参数通过
  const req = ensureObjectRequest({ id: 'tab-123' }, 'tabs.select')
  assert.equal(req.id, 'tab-123')

  // 出参结构验证
  const listEnvelope = createResponseEnvelope(true, {
    activeId: 'tab-1',
    tabs: [{ id: 'tab-1', title: '主页' }]
  }, 'SUCCESS', '获取成功')

  assert.equal(listEnvelope.ok, true)
  assert.equal(listEnvelope.code, 'SUCCESS')
  assert.deepEqual(listEnvelope.data.activeId, 'tab-1')
  assert.equal(listEnvelope.data.tabs.length, 1)
})
