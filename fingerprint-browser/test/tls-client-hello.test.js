const assert = require('node:assert/strict')
const { fingerprintClientHello, readClientHello, isGrease, compareClientHello, validateTLSReference } = require('./tls-client-hello')

// 使用 JA4 公开技术规范的向量核对哈希，避免只与同一实现互相验证。
const hello = {
  legacyVersion: 771,
  ciphers: '1301,1302,1303,c02b,c02f,c02c,c030,cca9,cca8,c013,c014,009c,009d,002f,0035'.split(',').map(value => parseInt(value, 16)),
  extensions: '001b,0000,0033,0010,4469,0017,002d,000d,0005,0023,0012,002b,ff01,000b,000a,0015'.split(',').map(value => parseInt(value, 16)),
  groups: [29, 23, 24], pointFormats: [0], supportedVersions: [772, 771], alpnHex: ['6832'],
  signatureAlgorithms: '0403,0804,0401,0503,0805,0501,0806,0601'.split(',').map(value => parseInt(value, 16)), keyShareGroups: []
}
const expected = 't13d1516h2_8daaf6152771_e5627efa2ab1'
assert.equal(fingerprintClientHello(hello).ja4, expected)
const greased = structuredClone(hello)
for (const key of ['ciphers', 'extensions', 'groups', 'supportedVersions', 'signatureAlgorithms']) greased[key].unshift(0x2a2a)
assert.deepEqual(fingerprintClientHello(greased), fingerprintClientHello(hello))
assert.equal(isGrease(0x2a3a), false)
const reordered = { ...hello, extensions: [...hello.extensions].reverse() }
assert.equal(fingerprintClientHello(reordered).ja4, expected)
assert.notEqual(fingerprintClientHello(reordered).ja3, fingerprintClientHello(hello).ja3)
assert.match(fingerprintClientHello({ ...hello, alpnHex: ['2061'] }).ja4, /^t13d151621_/)
assert.match(fingerprintClientHello({ ...hello, alpnHex: [] }).ja4, /^t13d151600_/)

assert.equal(compareClientHello(reordered, hello).matches, true)
assert.equal(compareClientHello(reordered, hello, { fixedExtensionOrder: true }).matches, false)
for (const field of ['ciphers', 'groups', 'supportedVersions']) {
  const changed = { ...hello, [field]: [...hello[field]].reverse() }
  assert.equal(fingerprintClientHello(changed).ja4, expected)
  assert.deepEqual(compareClientHello(changed, hello).differences.map(value => value.field), [field])
}
const changedKeyShare = { ...hello, keyShareGroups: [29] }
assert.equal(fingerprintClientHello(changedKeyShare).ja4, expected)
assert.deepEqual(compareClientHello(changedKeyShare, hello).differences.map(value => value.field), ['keyShareGroups'])
const changedALPN = { ...hello, alpnHex: [...hello.alpnHex, '687474702f312e31'] }
assert.equal(fingerprintClientHello(changedALPN).ja4, expected)
assert.deepEqual(compareClientHello(changedALPN, hello).differences.map(value => value.field), ['alpnHex'])
const greaseA = { ...hello, ciphers: [0x2a2a, ...hello.ciphers], extensions: [0x3a3a, ...hello.extensions] }
const greaseB = { ...hello, ciphers: [0x4a4a, ...hello.ciphers], extensions: [0x5a5a, ...hello.extensions] }
assert.equal(compareClientHello(greaseA, greaseB).matches, true)
assert.equal(compareClientHello(greaseA, hello).matches, false)
const reference = { schemaVersion: 1, browser: { family: 'Chrome', version: '138.0.7204.185' }, platform: 'win32', source: { kind: 'independent-browser', capturedAt: '2026-10-22T06:00:00Z', description: '格式与比较器测试夹具，不是真实 Chrome 采集证据。' }, hello: { ...hello, ja4: '不可信的外部摘要' } }
assert.equal(validateTLSReference(reference).hello.ja4, expected)
for (const version of ['120.0.6099.109', '138.0.7204.184']) assert.equal(validateTLSReference({ ...reference, browser: { family: 'Chrome', version } }).browser.version, version)
for (const version of [138, null, undefined, {}, [], '120', '120.0.1', '120.0.1.2.3', '120.00.1.2', '0120.0.1.2', '120.0.a.1', '120.0.1.2beta', ' 120.0.1.2', '0.0.0.0', '120.0.1.4294967296']) assert.throws(() => validateTLSReference({ ...reference, browser: { family: 'Chrome', version } }), /四段版本/)
for (const invalid of [
  { ...reference, schemaVersion: 2 }, { ...reference, platform: 'unknown' },
  { ...reference, browser: { family: 'Electron', version: reference.browser.version } },
  { ...reference, source: { ...reference.source, kind: 'electron-baseline' } },
  { ...reference, source: { ...reference.source, capturedAt: '未知时间' } },
  { ...reference, source: { ...reference.source, description: ' ' } },
  { ...reference, hello: { ...hello, groups: undefined } },
  { ...reference, hello: { ...hello, groups: [65536] } },
  { ...reference, hello: { ...hello, alpnHex: ['6'] } },
  { ...reference, hello: { ...hello, extensions: [...hello.extensions, 41] } }
]) assert.throws(() => validateTLSReference(invalid), /TLS/)

const u16 = value => { const data = Buffer.alloc(2); data.writeUInt16BE(value); return data }
const vector16 = bytes => Buffer.concat([u16(bytes.length), bytes])
const vector8 = bytes => Buffer.concat([Buffer.from([bytes.length]), bytes])
const ids = values => Buffer.concat(values.map(u16))
const extension = (type, bytes) => Buffer.concat([u16(type), vector16(bytes)])
const dataFor = type => ({
  10: vector16(ids(hello.groups)), 11: vector8(Buffer.from(hello.pointFormats)),
  13: vector16(ids(hello.signatureAlgorithms)), 43: vector8(ids(hello.supportedVersions)),
  16: vector16(vector8(Buffer.from('h2'))), 51: vector16(Buffer.alloc(0))
}[type] || Buffer.alloc(0))
const body = Buffer.concat([u16(771), Buffer.alloc(32), vector8(Buffer.alloc(0)), vector16(ids(hello.ciphers)), vector8(Buffer.from([0])), vector16(Buffer.concat(hello.extensions.map(type => extension(type, dataFor(type)))))])
const handshakeHeader = Buffer.alloc(4)
handshakeHeader[0] = 1
handshakeHeader.writeUIntBE(body.length, 1, 3)
const handshake = Buffer.concat([handshakeHeader, body])
const record = bytes => Buffer.concat([Buffer.from([22, 3, 1]), vector16(bytes)])
const wire = Buffer.concat([record(handshake.subarray(0, 17)), record(handshake.subarray(17))])
for (let end = 0; end < wire.length; end++) assert.equal(readClientHello(wire.subarray(0, end)), null)
assert.equal(readClientHello(wire).ja4, expected)
assert.equal(readClientHello(wire).ja3Raw, fingerprintClientHello(hello).ja3Raw)
assert.throws(() => readClientHello(Buffer.alloc(131073)), /大小限制/)
assert.throws(() => readClientHello(Buffer.from([23, 3, 3, 0, 0])), /握手记录/)
const malformed = Buffer.from(body)
malformed.writeUInt16BE(65535, 35)
const malformedHeader = Buffer.from(handshakeHeader)
assert.throws(() => readClientHello(record(Buffer.concat([malformedHeader, malformed]))), /长度无效/)
console.log('ClientHello 分片解析、GREASE、JA4 公开向量、稳定字段与独立样本校验通过。')
