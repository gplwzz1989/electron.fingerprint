const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { createHash } = require('node:crypto')
const { readTLSReference, validateTLSReport } = require('../scripts/test-fingerprint')

async function run () {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'fp-tls-reference-'))
  try {
    const filename = path.join(directory, 'reference.json')
    const reference = {
      schemaVersion: 1, browser: { family: 'Chrome', version: '138.0.7204.185' }, platform: 'win32',
      source: { kind: 'independent-browser', capturedAt: '2026-10-22T08:00:00Z', description: '格式校验夹具，不作为真实浏览器证据。' },
      hello: { legacyVersion: 771, ciphers: [0x1301], extensions: [], groups: [], pointFormats: [], supportedVersions: [], signatureAlgorithms: [], alpnHex: [], keyShareGroups: [] }
    }
    const bytes = Buffer.from(JSON.stringify(reference), 'utf8')
    await fs.writeFile(filename, bytes)
    const captured = await readTLSReference(filename)
    assert.deepEqual(captured.bytes, bytes)
    assert.equal(captured.sha256, createHash('sha256').update(bytes).digest('hex'))
    assert.deepEqual(captured.reference.browser, reference.browser)
    await assert.rejects(readTLSReference(directory), /指纹验证无法读取/)
    await assert.rejects(readTLSReference(path.join(directory, 'missing.json')), /指纹验证无法读取/)
    for (const invalid of ['{', JSON.stringify({ ...reference, schemaVersion: 2 }), ' '.repeat(262145)]) {
      await fs.writeFile(filename, invalid, 'utf8')
      await assert.rejects(readTLSReference(filename), /指纹验证无法读取/)
    }

    const samples = names => names.flatMap(name => ['direct', 'tunnel'].map(route => ({ name, route, hello: { throughProxy: route === 'tunnel' }, baselineComparison: { matches: true }, ...(route === 'tunnel' ? { tunnelComparison: { matches: true } } : {}) })))
    const baseline = { ok: true, baselineOnly: true, implementationVerified: false, runtime: { chrome: '138.0.7204.185' }, platform: 'win32', failures: [], samples: samples(['native']), independentReference: { provided: false, compared: false, matches: null, runtimeIdentityMatches: null, samples: [] } }
    assert.doesNotThrow(() => validateTLSReport(baseline, true, null))
    assert.throws(() => validateTLSReport({ ...baseline, implementationVerified: true }, true, null), /TLS/)
    assert.throws(() => validateTLSReport({ ...baseline, samples: [] }, true, null), /TLS/)
    assert.throws(() => validateTLSReport(baseline, false, null), /TLS/)
    const complete = { ...baseline, baselineOnly: false, implementationVerified: true, samples: samples(['native', 'chrome138', 'custom', 'legacy-pq', 'update-before', 'update-custom', 'reset', 'native-after']) }
    assert.doesNotThrow(() => validateTLSReport(complete, false, null))
    assert.throws(() => validateTLSReport({ ...complete, samples: complete.samples.slice(1) }, false, null), /生命周期样本/)
    assert.throws(() => validateTLSReport({ ...complete, samples: [...complete.samples.slice(1), complete.samples[1]] }, false, null), /生命周期样本/)
    const metadata = { ...reference, sha256: captured.sha256 }
    const matched = { ...baseline, independentReference: { provided: true, compared: true, matches: true, runtimeIdentityMatches: true, sha256: captured.sha256, browser: reference.browser, platform: reference.platform, samples: baseline.samples.map(({ name, route }) => ({ name, route, matches: true, differences: [] })) } }
    assert.doesNotThrow(() => validateTLSReport(matched, true, metadata))
    assert.throws(() => validateTLSReport(matched, true, null), /不能声明/)
    assert.throws(() => validateTLSReport(baseline, true, metadata), /独立 TLS/)
    const differentTarget = { ...metadata, browser: { family: 'Chrome', version: '120.0.6099.1' }, platform: 'darwin' }
    const crossVersion = { ...matched, independentReference: { ...matched.independentReference, browser: differentTarget.browser, platform: differentTarget.platform, runtimeIdentityMatches: false } }
    assert.doesNotThrow(() => validateTLSReport(crossVersion, true, differentTarget))
    assert.throws(() => validateTLSReport({ ...crossVersion, independentReference: { ...crossVersion.independentReference, runtimeIdentityMatches: true } }, true, differentTarget), /身份标记/)
    for (const change of [
      report => { report.independentReference.sha256 = '其他样本' },
      report => { report.independentReference.browser.version = '139.0.0.0' },
      report => { report.independentReference.compared = false },
      report => { report.independentReference.matches = false },
      report => { report.independentReference.samples = [] },
      report => { report.independentReference.samples.pop() },
      report => { report.independentReference.samples[0].differences = [{ field: 'groups' }] }
    ]) {
      const invalid = structuredClone(matched)
      change(invalid)
      assert.throws(() => validateTLSReport(invalid, true, metadata), /独立 TLS/)
    }
  } finally {
    await fs.rm(directory, { recursive: true, force: true })
  }
  console.log('TLS 对照文件读取、摘要固定及报告完整性自检通过。')
}

void run().catch(() => { console.error('TLS 对照入口自检失败。'); process.exitCode = 1 })
