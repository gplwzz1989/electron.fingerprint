const test = require('node:test')
const assert = require('node:assert/strict')
const { validateSessionSnapshot } = require('../session-restore')
const snapshot = () => ({ format: 'desktop-session-v1', origins: ['https://creator.example.com'], cookies: [{ domain: 'creator.example.com', name: 'session', value: 'isolated-test', hostOnly: true, path: '/account', secure: true, httpOnly: true, sameSite: 'lax', expirationDate: 2000000000 }], storage: { 'https://creator.example.com': { token: 'isolated-test-token' } }, version: 'account-test:2' })
test('会话恢复按 domain 前导点保留Cookie范围且不扩大hostOnly', () => {
  const normalized = validateSessionSnapshot(snapshot()); const cookie = normalized.cookies[0]
  assert.equal(cookie.domain, undefined); assert.equal(cookie.url, 'https://creator.example.com/account')
  assert.equal(cookie.httpOnly, true); assert.equal(cookie.secure, true); assert.equal(cookie.sameSite, 'lax'); assert.equal(cookie.expirationDate, 2000000000)
  const domainCookie = snapshot(); domainCookie.cookies[0].domain = '.example.com'; domainCookie.cookies[0].hostOnly = true
  domainCookie.origins = ['https://creator.example.com']
  const domain = validateSessionSnapshot(domainCookie).cookies[0]
  assert.equal(domain.domain, '.example.com', '前导点必须保留为 desktop 相同的 Domain Cookie')
  const hostOnlyCookie = snapshot(); hostOnlyCookie.cookies[0].hostOnly = false
  assert.equal(validateSessionSnapshot(hostOnlyCookie).cookies[0].domain, undefined, '无前导点时即使字段冲突也不能扩大到子域')
  assert.equal(normalized.version, 'account-test:2')
})
test('旧版会话安全属性丢失时补足 SameSite 与前缀约束', () => {
  for (const attributes of [{ sameSite: 'no_restriction' }, { name: '__Secure-session' }, { name: '__Host-session' }, { name: '__Http-session' }, { name: '__Host-Http-session' }]) {
    const value = snapshot(); Object.assign(value.cookies[0], { secure: false, httpOnly: false, path: '/' }, attributes)
    const cookie = validateSessionSnapshot(value).cookies[0]
    assert.equal(cookie.secure, true)
    assert.equal(cookie.httpOnly, /Http-/.test(cookie.name))
    assert.equal(cookie.domain, undefined)
  }
})

test('非法来源、Cookie越界、hostOnly跨子域、非法字段与超大快照均拒绝', () => {
  for (const mutate of [value => { value.origins = ['http://creator.example.com'] }, value => { value.cookies[0].domain = '.other.example' }, value => { value.cookies[0].domain = 'example.com' }, value => { value.cookies[0].partitionKey = { topLevelSite: 'https://example.com' } }, value => { value.cookies[0].path = 'account' }, value => { value.storage['https://other.example'] = { token: 'test' } }, value => { value.storage['https://creator.example.com'].token = {} }, value => { value.version = -1 }, value => { value.cookies[0].value = 'a\r\nb' }, value => { value.storage['https://creator.example.com'].large = 'a'.repeat(300000) }]) {
    const value = snapshot(); mutate(value); assert.throws(() => validateSessionSnapshot(value), /恢复已阻止/)
  }
})
