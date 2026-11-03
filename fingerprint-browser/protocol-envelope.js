'use strict'

/**
 * 跨端协议原子工具：统一信封结构与参数校验
 * 纯原子工具原语，不包含具体业务逻辑。
 */

function ensureObjectRequest (input, methodName) {
  if (input !== undefined && input !== null && (typeof input !== 'object' || Array.isArray(input))) {
    const error = new Error(`接口 ${methodName || 'API'} 参数必须为对象。`)
    error.code = 'PARAM_INVALID'
    throw error
  }
  return input || {}
}

function createResponseEnvelope (ok, data = undefined, code = ok ? 'SUCCESS' : 'FAILED', message = '', traceId = undefined) {
  const envelope = {
    ok: Boolean(ok),
    code: String(code || (ok ? 'SUCCESS' : 'FAILED')),
    message: message || (ok ? '操作成功' : '操作未完成，请重试。'),
    timestamp: Date.now()
  }
  if (ok && data !== undefined) {
    envelope.data = data
  }
  if (traceId) {
    envelope.traceId = traceId
  }
  return envelope
}

function createErrorEnvelope (code = 'FAILED', message = '操作未完成，请重试。', details = undefined, traceId = undefined) {
  const envelope = {
    ok: false,
    code: String(code || 'FAILED'),
    message: String(message || '操作未完成，请重试。'),
    timestamp: Date.now()
  }
  if (details !== undefined && details !== null) {
    envelope.details = details
  }
  if (traceId) {
    envelope.traceId = traceId
  }
  return envelope
}

function createEventEnvelope (event, data, source = 'system') {
  return {
    event: String(event),
    source: String(source || 'system'),
    timestamp: Date.now(),
    data: data !== undefined ? data : null
  }
}

module.exports = {
  ensureObjectRequest,
  createResponseEnvelope,
  createErrorEnvelope,
  createEventEnvelope
}
