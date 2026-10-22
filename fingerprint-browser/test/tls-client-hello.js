const { createHash } = require('node:crypto')

const isGrease = value => (value & 0x0f0f) === 0x0a0a && (value >> 8) === (value & 0xff)
const hex = value => value.toString(16).padStart(4, '0')
const hash12 = value => createHash('sha256').update(value).digest('hex').slice(0, 12)

function reader (data) {
  let offset = 0
  const take = count => {
    if (offset + count > data.length) throw new Error('TLS 握手字段长度无效。')
    const result = data.subarray(offset, offset + count)
    offset += count
    return result
  }
  const u8 = () => take(1)[0]
  const u16 = () => take(2).readUInt16BE()
  return { take, u8, u16, vector8: () => take(u8()), vector16: () => take(u16()), remaining: () => data.length - offset }
}

function integers (bytes) {
  if (bytes.length % 2) throw new Error('TLS 握手列表长度无效。')
  return Array.from({ length: bytes.length / 2 }, (_, index) => bytes.readUInt16BE(index * 2))
}

function fingerprintClientHello (hello) {
  const ciphers = hello.ciphers.filter(value => !isGrease(value))
  const extensions = hello.extensions.filter(value => !isGrease(value))
  const groups = hello.groups.filter(value => !isGrease(value))
  const signatures = hello.signatureAlgorithms.filter(value => !isGrease(value)).map(hex)
  const ja3Raw = [hello.legacyVersion, ciphers.join('-'), extensions.join('-'), groups.join('-'), hello.pointFormats.join('-')].join(',')
  const versions = hello.supportedVersions.filter(value => !isGrease(value))
  const version = versions.length ? Math.max(...versions) : hello.legacyVersion
  const versionCode = { 0x0304: '13', 0x0303: '12', 0x0302: '11', 0x0301: '10', 0x0300: 's3', 0x0002: 's2' }[version] || '00'
  const alpn = Buffer.from(hello.alpnHex[0] || '', 'hex')
  const alphanumeric = byte => (byte >= 48 && byte <= 57) || (byte >= 65 && byte <= 90) || (byte >= 97 && byte <= 122)
  const alpnText = alpn.length && alphanumeric(alpn[0]) && alphanumeric(alpn.at(-1)) ? alpn.toString('latin1') : alpn.toString('hex')
  const count = values => String(Math.min(values.length, 99)).padStart(2, '0')
  const prefix = `t${versionCode}${extensions.includes(0) ? 'd' : 'i'}${count(ciphers)}${count(extensions)}${alpnText ? alpnText[0] + alpnText.at(-1) : '00'}`
  const cipherList = ciphers.map(hex).sort().join(',')
  const extensionList = extensions.filter(value => value !== 0 && value !== 16).map(hex).sort().join(',')
  const extensionRaw = extensionList + (signatures.length ? `_${signatures.join(',')}` : '')
  return {
    ja3: createHash('md5').update(ja3Raw).digest('hex'), ja3Raw,
    ja4: `${prefix}_${cipherList ? hash12(cipherList) : '000000000000'}_${extensionList ? hash12(extensionRaw) : '000000000000'}`,
    ja4Raw: `${prefix}_${cipherList}_${extensionRaw}`
  }
}

const identifierFields = ['ciphers', 'extensions', 'groups', 'supportedVersions', 'signatureAlgorithms', 'keyShareGroups']

function validateClientHello (hello) {
  if (!hello || typeof hello !== 'object' || Array.isArray(hello) || !Number.isInteger(hello.legacyVersion) || hello.legacyVersion < 0 || hello.legacyVersion > 65535) throw new Error('TLS 对照样本缺少有效的握手版本。')
  for (const field of [...identifierFields, 'pointFormats']) {
    const maximum = field === 'pointFormats' ? 255 : 65535
    if (!Array.isArray(hello[field]) || hello[field].length > 512 || hello[field].some(value => !Number.isInteger(value) || value < 0 || value > maximum)) throw new Error('TLS 对照样本的握手列表无效或不完整。')
  }
  if (!hello.ciphers.length || new Set(hello.extensions).size !== hello.extensions.length || !Array.isArray(hello.alpnHex) || hello.alpnHex.length > 64 || hello.alpnHex.some(value => typeof value !== 'string' || !/^(?:[\da-f]{2}){1,255}$/i.test(value))) throw new Error('TLS 对照样本的套件、扩展或 ALPN 无效。')
  for (const [extension, field] of [[10, 'groups'], [11, 'pointFormats'], [13, 'signatureAlgorithms'], [16, 'alpnHex'], [43, 'supportedVersions'], [51, 'keyShareGroups']]) {
    if ((!hello.extensions.includes(extension) && hello[field].length) || (extension !== 51 && hello.extensions.includes(extension) && !hello[field].length)) throw new Error('TLS 对照样本的扩展与字段内容不一致。')
  }
}

function stableClientHello (hello, { fixedExtensionOrder = false } = {}) {
  validateClientHello(hello)
  const result = { legacyVersion: hello.legacyVersion }
  // 保留 GREASE 数量和位置，只归一化随机值；JA4 未覆盖的字段也参与对照。
  for (const field of identifierFields) result[field] = hello[field].map(value => isGrease(value) ? 0x0a0a : value)
  if (!fixedExtensionOrder) result.extensions.sort((left, right) => left - right)
  result.pointFormats = [...hello.pointFormats]
  result.alpnHex = hello.alpnHex.map(value => value.toLowerCase())
  return result
}

function compareClientHello (actual, expected, options) {
  const normalizedActual = stableClientHello(actual, options)
  const normalizedExpected = stableClientHello(expected, options)
  const differences = Object.keys(normalizedExpected).filter(field => JSON.stringify(normalizedActual[field]) !== JSON.stringify(normalizedExpected[field])).map(field => ({ field, expected: normalizedExpected[field], actual: normalizedActual[field] }))
  return { matches: differences.length === 0, differences }
}

function validateTLSReference (reference, chromiumVersion) {
  if (!reference || reference.schemaVersion !== 1 || reference.browser?.family !== 'Chrome' || !/^138\.\d+\.\d+\.\d+$/.test(reference.browser.version) || reference.browser.version !== chromiumVersion || !['win32', 'darwin', 'linux'].includes(reference.platform)) throw new Error('独立 TLS 对照必须提供与当前内核完整版本一致的 Chrome 138 样本及平台。')
  const source = reference.source
  if (source?.kind !== 'independent-browser' || typeof source.description !== 'string' || !source.description.trim() || source.description.length > 1000 || typeof source.capturedAt !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(source.capturedAt) || !Number.isFinite(Date.parse(source.capturedAt))) throw new Error('独立 TLS 对照缺少有效的采集来源或时间。')
  validateClientHello(reference.hello)
  if (reference.hello.extensions.includes(41)) throw new Error('独立 TLS 对照必须使用未恢复会话票据的首次握手。')
  const hello = { legacyVersion: reference.hello.legacyVersion }
  for (const field of [...identifierFields, 'pointFormats', 'alpnHex']) hello[field] = [...reference.hello[field]]
  return { schemaVersion: 1, browser: { family: 'Chrome', version: reference.browser.version }, platform: reference.platform, source: { kind: source.kind, capturedAt: source.capturedAt, description: source.description.trim() }, hello: { ...hello, ...fingerprintClientHello(hello) } }
}

function parseBody (body) {
  const input = reader(body)
  const hello = { legacyVersion: input.u16(), ciphers: [], extensions: [], groups: [], pointFormats: [], supportedVersions: [], signatureAlgorithms: [], alpnHex: [], keyShareGroups: [] }
  input.take(32)
  input.vector8()
  hello.ciphers = integers(input.vector16())
  input.vector8()
  if (input.remaining()) {
    const extensions = reader(input.vector16())
    const seen = new Set()
    while (extensions.remaining()) {
      const type = extensions.u16()
      const data = extensions.vector16()
      if (seen.has(type)) throw new Error('TLS 握手包含重复扩展。')
      seen.add(type)
      hello.extensions.push(type)
      const value = reader(data)
      if ([10, 13, 43].includes(type)) {
        const entries = integers(type === 43 ? value.vector8() : value.vector16())
        if (type === 10) hello.groups = entries
        if (type === 13) hello.signatureAlgorithms = entries
        if (type === 43) hello.supportedVersions = entries
      } else if (type === 11) hello.pointFormats = [...value.vector8()]
      else if (type === 16) {
        const protocols = reader(value.vector16())
        while (protocols.remaining()) hello.alpnHex.push(protocols.vector8().toString('hex'))
      } else if (type === 51) {
        const shares = reader(value.vector16())
        while (shares.remaining()) { hello.keyShareGroups.push(shares.u16()); shares.vector16() }
      } else continue
      if (value.remaining()) throw new Error('TLS 扩展包含多余字段。')
    }
  }
  if (input.remaining()) throw new Error('TLS 握手包含多余数据。')
  return { ...hello, ...fingerprintClientHello(hello) }
}

// 只读取 TCP 上的首个 ClientHello，支持跨 TCP 分片和跨 TLS record，限制缓冲区大小。
function readClientHello (bytes) {
  if (bytes.length > 131072) throw new Error('TLS 握手超过诊断大小限制。')
  let offset = 0
  let handshake = Buffer.alloc(0)
  while (offset + 5 <= bytes.length) {
    if (bytes[offset] !== 22) throw new Error('未收到 TLS 握手记录。')
    const size = bytes.readUInt16BE(offset + 3)
    if (size > 18432) throw new Error('TLS 记录超过大小限制。')
    if (offset + 5 + size > bytes.length) return null
    handshake = Buffer.concat([handshake, bytes.subarray(offset + 5, offset + 5 + size)])
    offset += 5 + size
    if (handshake.length >= 4) {
      if (handshake[0] !== 1) throw new Error('首个 TLS 握手消息不是 ClientHello。')
      const length = handshake.readUIntBE(1, 3)
      if (length > 131068) throw new Error('ClientHello 超过诊断大小限制。')
      if (handshake.length >= length + 4) return parseBody(handshake.subarray(4, length + 4))
    }
  }
  return null
}

module.exports = { readClientHello, fingerprintClientHello, isGrease, stableClientHello, compareClientHello, validateTLSReference }
