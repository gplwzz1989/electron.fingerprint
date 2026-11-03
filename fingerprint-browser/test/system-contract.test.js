'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const {
  ensureObjectRequest,
  createResponseEnvelope,
  createErrorEnvelope
} = require('../protocol-envelope')
const { bridgeContract, businessChannels, shellChannels } = require('../client-api-contract')

test('阶段一系统接口契约白名单：包含 system: 独立通道', () => {
  assert.ok(businessChannels.has('system:get-runtime'), '应当包含 system:get-runtime')
  assert.ok(businessChannels.has('system:control-window'), '应当包含 system:control-window')
  assert.ok(businessChannels.has('system:get-update-status'), '应当包含 system:get-update-status')
  assert.ok(businessChannels.has('system:check-updates'), '应当包含 system:check-updates')
  assert.ok(businessChannels.has('system:install-update'), '应当包含 system:install-update')
  assert.ok(shellChannels.has('system:control-window'), '外壳应当有权控制窗口')
})

test('阶段一系统接口参数与信封：必须是单一对象入参并返回规范信封', () => {
  // 1. 传基础类型必须拦截
  assert.throws(() => ensureObjectRequest('minimize', 'system.controlWindow'), /必须为对象/)
  assert.throws(() => ensureObjectRequest(123, 'system.getRuntime'), /必须为对象/)

  // 2. 正确对象参数通过
  const validReq = ensureObjectRequest({ action: 'minimize' }, 'system.controlWindow')
  assert.equal(validReq.action, 'minimize')

  // 3. 返回结构必须符合 ResponseEnvelope
  const runtimeEnvelope = createResponseEnvelope(true, {
    platform: 'win32',
    chromiumVersion: '130.0.0.0',
    appName: '指纹浏览器',
    protocolVersion: 2
  }, 'SUCCESS', '获取成功', 'tr-test')

  assert.equal(runtimeEnvelope.ok, true)
  assert.equal(runtimeEnvelope.code, 'SUCCESS')
  assert.equal(runtimeEnvelope.data.protocolVersion, 2)
  assert.equal(runtimeEnvelope.traceId, 'tr-test')
  assert.ok(runtimeEnvelope.timestamp > 0)
})
