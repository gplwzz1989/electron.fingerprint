'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const { createEventEnvelope } = require('../protocol-envelope')

test('阶段五事件中心信封规范：所有 Push 事件必须包含标准信封字段', () => {
  // 1. 标签变更事件
  const tabsEvt = createEventEnvelope('tabs:changed', { activeId: 'tab-1', tabs: [] }, 'tabBrowser')
  assert.equal(tabsEvt.event, 'tabs:changed')
  assert.equal(tabsEvt.source, 'tabBrowser')
  assert.ok(typeof tabsEvt.timestamp === 'number')
  assert.deepEqual(tabsEvt.data, { activeId: 'tab-1', tabs: [] })

  // 2. 任务完成事件
  const taskEvt = createEventEnvelope('tasks:completed', { ok: true, taskId: 'task-1', status: 'success' }, 'taskGateway')
  assert.equal(taskEvt.event, 'tasks:completed')
  assert.equal(taskEvt.data.taskId, 'task-1')

  // 3. 更新变更事件
  const updateEvt = createEventEnvelope('updates:changed', { status: 'ready', currentVersion: '0.4.0' }, 'updater')
  assert.equal(updateEvt.event, 'updates:changed')
  assert.equal(updateEvt.data.status, 'ready')

  // 4. 环境变更事件（杜绝推 undefined）
  const envEvt = createEventEnvelope('environments:changed', { action: 'change', scope: 'environment' }, 'main')
  assert.equal(envEvt.event, 'environments:changed')
  assert.notEqual(envEvt.data, undefined)
  assert.notEqual(envEvt.data, null)
  assert.equal(envEvt.data.scope, 'environment')
})
