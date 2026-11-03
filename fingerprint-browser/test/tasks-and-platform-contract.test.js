'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const {
  ensureObjectRequest,
  createResponseEnvelope,
  createErrorEnvelope
} = require('../protocol-envelope')
const { businessChannels } = require('../client-api-contract')
const { toEnvelope } = require('../task-gateway')

test('阶段四任务与平台授权契约白名单：包含 tasks:*-v2 与 platform:*-v2 独立通道', () => {
  assert.ok(businessChannels.has('tasks:execute-v2'), '应当包含 tasks:execute-v2')
  assert.ok(businessChannels.has('tasks:query-v2'), '应当包含 tasks:query-v2')
  assert.ok(businessChannels.has('tasks:cancel-v2'), '应当包含 tasks:cancel-v2')
  assert.ok(businessChannels.has('platform:get-status-v2'), '应当包含 platform:get-status-v2')
  assert.ok(businessChannels.has('platform:start-auth-v2'), '应当包含 platform:start-auth-v2')
  assert.ok(businessChannels.has('platform:cancel-auth-v2'), '应当包含 platform:cancel-auth-v2')
})

test('阶段四任务与平台授权参数强制对象化：基础类型直接拦截', () => {
  assert.throws(() => ensureObjectRequest('task-id-123', 'tasks.query'), /必须为对象/)
  assert.throws(() => ensureObjectRequest('task-id-456', 'tasks.cancel'), /必须为对象/)
  assert.throws(() => ensureObjectRequest('douyin', 'platform.startAuth'), /必须为对象/)

  const validReq = ensureObjectRequest({ taskId: 'task-123' }, 'tasks.query')
  assert.equal(validReq.taskId, 'task-123')

  // TaskEnvelope 结构验证
  const taskEnvelope = toEnvelope({
    taskId: 't-1',
    type: 'platform:authorize',
    status: 'success',
    createdAt: 1000,
    finishedAt: 2000,
    expiresAt: 3000,
    data: { platformUserId: 'u-1', cookies: [] },
    error: null
  })

  assert.equal(taskEnvelope.ok, true)
  assert.equal(taskEnvelope.taskId, 't-1')
  assert.equal(taskEnvelope.status, 'success')
  assert.equal(taskEnvelope.data.platformUserId, 'u-1')
})
