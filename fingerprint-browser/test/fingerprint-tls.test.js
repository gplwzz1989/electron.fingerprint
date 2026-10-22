const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const net = require('node:net')
const http = require('node:http')
const http2 = require('node:http2')
const tls = require('node:tls')
const { X509Certificate } = require('node:crypto')
const { app, session } = require('electron/main')
const { applyProxyConfig } = require('../browser-tabs')
const { getDefaultProfile } = require('../profile-store')
const { applyTLSFingerprintConfig } = require('../tls-fingerprint')
const { readClientHello, isGrease } = require('./tls-client-hello')

const output = process.env.FP_FINGERPRINT_TEST_OUTPUT
if (!output || !path.resolve(output).startsWith(`${path.resolve(__dirname, '../../dist/electron-diagnostics/fingerprint')}${path.sep}`)) throw new Error('TLS 验证必须使用独立诊断目录。')
app.setPath('userData', path.join(output, 'data'))
const baselineOnly = process.env.FP_TLS_BASELINE_ONLY === '1'
const report = { ok: false, baselineOnly, implementationVerified: false, runtime: process.versions, samples: [], failures: [], scope: '受控 TCP TLS ClientHello、HTTP/2 和 HTTP/1.1；不覆盖 QUIC、真实 ECH 配置及 TLS 终止代理。' }
const sockets = new Set()
const servers = []
const sessions = []
const hellos = new Map()
const tunnelPorts = new Set()

function track (socket) { sockets.add(socket); socket.once('close', () => sockets.delete(socket)); return socket }
async function listen (server) {
  servers.push(server)
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve) })
  return server.address().port
}
function check (description, callback) {
  try { callback() } catch { report.failures.push({ description, message: 'TLS 样本与预期策略不一致，请核对采集字段。' }) }
}

async function run () {
  await app.whenReady()
  const cert = await fs.readFile(path.join(output, 'tls/server.pem'))
  const key = await fs.readFile(path.join(output, 'tls/server.key'))
  const ca = await fs.readFile(path.join(output, 'tls/ca.pem'))
  const expected = new X509Certificate(cert).fingerprint256
  const backend = http2.createSecureServer({ key, cert, allowHTTP1: true })
  backend.on('session', value => value.on('error', () => {}))
  backend.on('request', (request, response) => {
    const sample = {
      hello: hellos.get(request.socket.remotePort), userAgent: request.headers['user-agent'],
      hints: Object.fromEntries(Object.entries(request.headers).filter(([key]) => key.startsWith('sec-ch-'))),
      negotiated: { protocol: request.socket.getProtocol(), cipher: request.socket.getCipher().standardName, alpn: request.socket.alpnProtocol, httpVersion: request.httpVersion }
    }
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.end(JSON.stringify(sample))
  })
  backend.on('connection', track)
  const backendPort = await listen(backend)
  await new Promise((resolve, reject) => {
    const socket = track(tls.connect({ host: '127.0.0.1', port: backendPort, servername: 'a.localhost', ca }))
    socket.once('secureConnect', () => { socket.end(); resolve() })
    socket.once('error', () => reject(new Error('TLS 诊断证书校验失败。')))
  })
  // 透明转发原始加密字节，不替换客户端握手或终止客户端 TLS。
  const observer = net.createServer(client => {
    track(client).pause()
    const upstream = track(net.connect({ host: '127.0.0.1', port: backendPort }, () => {
      const port = upstream.localPort
      let bytes = Buffer.alloc(0)
      let captured = false
      client.on('data', chunk => {
        if (captured) return
        try {
          bytes = Buffer.concat([bytes, chunk])
          const hello = readClientHello(bytes)
          if (hello) {
            hellos.set(port, { ...hello, throughProxy: tunnelPorts.has(client.remotePort) })
            captured = true
            bytes = Buffer.alloc(0)
          }
        } catch { client.destroy(); upstream.destroy() }
      })
      upstream.once('close', () => hellos.delete(port))
      client.pipe(upstream)
      upstream.pipe(client)
      client.resume()
    }))
    client.on('error', () => upstream.destroy())
    upstream.on('error', () => client.destroy())
    client.once('close', () => upstream.destroy())
    upstream.once('close', () => client.destroy())
  })
  const port = await listen(observer)
  const url = `https://a.localhost:${port}/`
  const proxy = http.createServer((_request, response) => { response.writeHead(405); response.end('仅支持诊断隧道。') })
  proxy.on('connection', track)
  proxy.on('connect', (request, client, head) => {
    if (request.url !== `a.localhost:${port}`) { client.destroy(); return }
    const upstream = track(net.connect({ host: '127.0.0.1', port }, () => {
      const localPort = upstream.localPort
      tunnelPorts.add(localPort)
      upstream.once('close', () => tunnelPorts.delete(localPort))
      client.write('HTTP/1.1 200 Connection Established\r\n\r\n')
      if (head.length) upstream.write(head)
      client.pipe(upstream)
      upstream.pipe(client)
    }))
    client.on('error', () => upstream.destroy())
    upstream.on('error', () => client.destroy())
    client.once('close', () => upstream.destroy())
    upstream.once('close', () => client.destroy())
  })
  const proxyPort = await listen(proxy)
  const custom = { cipherSuites: [0xc030, 0xc02f], permuteExtensions: false, echEnabled: false, postQuantumKeyAgreementEnabled: false }
  const cases = baselineOnly ? ['native'] : ['native', 'chrome138', 'custom', 'reset', 'native-after']
  for (const name of cases) {
    for (const route of ['direct', 'tunnel']) {
      // 各样本使用新 Session，避免恢复票据导致扩展列表变化，污染策略对照。
      const current = session.fromPartition(`tls-${name}-${route}`)
      sessions.push(current)
      current.setCertificateVerifyProc((request, callback) => {
        let accepted = false
        try { accepted = request.hostname === 'a.localhost' && new X509Certificate(request.certificate.data).fingerprint256 === expected } catch {}
        callback(accepted ? 0 : -3)
      })
      if (!['native', 'native-after'].includes(name)) {
        const fingerprint = getDefaultProfile()
        fingerprint.id = `tls-${name}-${route}`
        fingerprint.browser.userAgent = current.getUserAgent().replace(/Electron\/[^ ]+\s*/g, '').replace(/Chrome\/[\d.]+/, 'Chrome/138.0.0.0')
        current.setFingerprintConfig(fingerprint)
        applyTLSFingerprintConfig(current, name === 'chrome138' ? {} : custom)
        if (name === 'custom') check('非法 TLS 策略不覆盖现有配置', () => assert.throws(() => current.setSSLConfig({ fingerprint: { chromiumVersion: process.versions.chrome, cipherSuites: [0x1301] } })))
        if (name === 'reset') current.setSSLConfig({})
      }
      await applyProxyConfig(current, route === 'direct' ? { mode: 'direct' } : { mode: 'http', server: `http://127.0.0.1:${proxyPort}` }, url)
      const response = await current.fetch(url)
      if (!response.ok) throw new Error('TLS 诊断请求失败。')
      const sample = { name, route, ...await response.json() }
      report.samples.push(sample)
      check(`${name} ${route} 完整握手采集`, () => {
        assert.ok(sample.hello?.ja3 && sample.hello?.ja4)
        assert.equal(sample.hello.throughProxy, route === 'tunnel')
        assert.match(sample.userAgent, /Chrome\/138\./)
        assert.equal(sample.userAgent, current.getUserAgent())
        assert.equal(sample.negotiated.alpn, 'h2')
        assert.equal(sample.negotiated.httpVersion, '2.0')
      })
      await current.closeAllConnections()
    }
  }
  const original = report.samples[0].hello
  for (const sample of report.samples) {
    check(`${sample.name} ${sample.route} 握手策略`, () => {
      const hello = sample.hello
      if (sample.name === 'custom') {
        assert.deepEqual(hello.ciphers.filter(id => !isGrease(id) && ![0x1301, 0x1302, 0x1303].includes(id)), custom.cipherSuites)
        assert.equal(hello.extensions.includes(0xfe0d), false)
        assert.equal(hello.groups.includes(4588), false)
        assert.notEqual(hello.ja4, original.ja4)
      } else assert.equal(hello.ja4, original.ja4)
    })
    if (sample.route === 'tunnel') check(`${sample.name} 透明代理一致性`, () => {
      const direct = report.samples.find(value => value.name === sample.name && value.route === 'direct')
      assert.equal(sample.hello.ja4, direct.hello.ja4)
      assert.deepEqual(sample.negotiated, direct.negotiated)
      if (sample.name === 'custom') assert.equal(sample.hello.ja3, direct.hello.ja3)
    })
  }
  if (!baselineOnly) {
    const validation = session.fromPartition('tls-validation')
    for (const invalid of [{ chromiumVersion: '139.0.0.0' }, { cipherSuites: [0x1301] }, { cipherSuites: [0xc02f, 0xc02f] }, { cipherSuites: [0xc02f + 0.5] }, { permuteExtensions: 'false' }, { unknown: true }]) {
      check('非法 TLS 策略拒绝', () => assert.throws(() => validation.setSSLConfig({ fingerprint: { chromiumVersion: process.versions.chrome, ...invalid } })))
    }
    const profile = getDefaultProfile()
    profile.browser.userAgent = 'Mozilla/5.0 Chrome/139.0.0.0'
    profile.modules.clientHints = false
    check('原生 UA 版本约束', () => assert.throws(() => validation.setFingerprintConfig(profile)))
    check('非法 UA 无部分应用', () => assert.equal(validation.getFingerprintConfig(), null))
    profile.browser.userAgent = null
    validation.setFingerprintConfig(profile)
    check('启用配置后的 UA 修改约束', () => assert.throws(() => validation.setUserAgent('Mozilla/5.0 Chrome/139.0.0.0')))
  }
  report.ok = report.failures.length === 0
  report.implementationVerified = report.ok && !baselineOnly
}

void (async () => {
  const timer = setTimeout(() => { console.error('TLS 验证超时。'); app.exit(1) }, 150000)
  try { await run() } catch (error) {
    console.error('[tls-diagnostic]', error)
    report.failures.push({ description: '运行验证', message: 'TLS 验证未完成，请核对运行时能力和本轮日志。' })
  } finally {
    clearTimeout(timer)
    await fs.writeFile(path.join(output, 'tls-result.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
    for (const current of sessions) current.setCertificateVerifyProc(null)
    for (const socket of sockets) socket.destroy()
    for (const server of servers) server.close()
    console.log(`TLS ${baselineOnly ? '原生基线采集' : '策略验证'}：${report.samples.length} 个样本，${report.failures.length} 项未通过。`)
    app.exit(report.ok ? 0 : 1)
  }
})()
