const test = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const { createLaunchRequest, sealLaunch, validateLaunchRequest } = require('../fingerprint-envelope')

test('启动密文绑定客户端密钥、团队、环境、时限与单次请求，篡改或重放不能使用', () => {
  const context = { workspaceId: crypto.randomUUID(), environmentId: crypto.randomUUID() }
  const profile = { id: context.environmentId, fingerprint: { noise: { seed: crypto.randomUUID() } }, proxy: { password: crypto.randomBytes(24).toString('hex') } }
  const first = createLaunchRequest(context.workspaceId, context.environmentId)
  const second = createLaunchRequest(context.workspaceId, context.environmentId)
  const encrypted = sealLaunch(profile, first.request, context)
  assert(!JSON.stringify(encrypted).includes(profile.fingerprint.noise.seed))
  assert(!JSON.stringify(encrypted).includes(profile.proxy.password))
  assert.throws(() => second.open(encrypted), /解密或校验失败/)
  for (const change of [{ workspaceId: crypto.randomUUID() }, { environmentId: crypto.randomUUID() }, { expiresAt: Date.now() - 1 }, { nonce: 'f'.repeat(64) }, { ciphertext: crypto.randomBytes(100).toString('base64') }, { tag: crypto.randomBytes(16).toString('base64') }]) assert.throws(() => first.open({ ...encrypted, ...change }), /解密或校验失败/)
  assert.deepEqual(first.open(encrypted), profile)
  assert.throws(() => first.open(encrypted), /已使用/)
  assert.throws(() => validateLaunchRequest({ nonce: 'a'.repeat(64), publicKey: '无效公钥' }), /无效/)
})
