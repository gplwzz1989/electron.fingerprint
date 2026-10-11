const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const https = require('node:https')
const http = require('node:http')
const tls = require('node:tls')
const net = require('node:net')
const { X509Certificate, createHash } = require('node:crypto')
const { app, session } = require('electron/main')
const { applyProxyConfig } = require('../browser-tabs')
const { collectFingerprintSignals } = require('./fingerprint-probes')
const { getDefaultProfile } = require('../profile-store')
const { applyFingerprintConfig } = require('../runtime-compat')

const highEntropyHeaders = ['sec-ch-ua-platform-version', 'sec-ch-ua-arch', 'sec-ch-ua-bitness', 'sec-ch-ua-full-version-list']

function assertNoHighEntropyHints (headers, message) {
  for (const header of highEntropyHeaders) assert.equal(Object.hasOwn(headers, header), false, message)
}

async function readHintHeaders (window) {
  return await window.webContents.executeJavaScript("(async () => await (await fetch('/hints/echo', { cache: 'no-store' })).json())()")
}

async function collectNetworkRequests (phase) {
  function exchange (target, payload) {
    return new Promise(resolve => {
      const timer = setTimeout(() => resolve({ ok: false, completed: false }), 7000)
      target.onmessage = event => { clearTimeout(timer); resolve(event.data) }
      target.postMessage(payload)
    })
  }
  if (!window.fpNetworkProbes) {
    const dedicated = new Worker('/dedicated-worker.js')
    const shared = new SharedWorker('/shared-worker.js')
    shared.port.start()
    await navigator.serviceWorker.register('/service-worker.js')
    let timer
    let registration
    try {
      registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((resolve, reject) => { timer = setTimeout(() => reject(new Error('后台工作线程启动超时。')), 7000) })
      ])
    } finally { clearTimeout(timer) }
    window.fpNetworkProbes = { dedicated, shared, registration }
  }
  async function pageRequest (kind) {
    try {
      const response = await fetch(`/network-${phase}/${kind}`, { cache: 'no-store', signal: AbortSignal.timeout(4000) })
      return { ok: response.ok, completed: true, value: await response.json() }
    } catch { return { ok: false, completed: true } }
  }
  const probes = window.fpNetworkProbes
  const channel = new MessageChannel()
  const serviceResult = new Promise(resolve => {
    const timer = setTimeout(() => { channel.port1.close(); resolve({ ok: false, completed: false }) }, 7000)
    channel.port1.onmessage = event => { clearTimeout(timer); channel.port1.close(); resolve(event.data) }
    probes.registration.active.postMessage(`/network-${phase}/service-worker`, [channel.port2])
  })
  const websocketResult = new Promise(resolve => {
    const socket = new WebSocket(`${location.origin.replace(/^https:/, 'wss:')}/network-${phase}/websocket`)
    const timer = setTimeout(() => { socket.close(); resolve({ ok: false, completed: false }) }, 7000)
    socket.onopen = () => { clearTimeout(timer); socket.close(); resolve({ ok: true, completed: true }) }
    socket.onerror = () => { clearTimeout(timer); resolve({ ok: false, completed: true }) }
  })
  try {
    const [page, dedicated, shared, serviceWorker, redirect, websocket] = await Promise.all([
      pageRequest('page'), exchange(probes.dedicated, `/network-${phase}/dedicated-worker`),
      exchange(probes.shared.port, `/network-${phase}/shared-worker`), serviceResult,
      pageRequest('redirect'), websocketResult
    ])
    return { page, dedicated, shared, serviceWorker, redirect, websocket }
  } finally { channel.port2.close() }
}

async function verifyHTTPSNetwork ({ output, sessions, createWindow, listen, report }) {
  for (const flag of ['ignore-certificate-errors', 'ignore-certificate-errors-spki-list', 'allow-insecure-localhost']) assert.equal(app.commandLine.hasSwitch(flag), false, '诊断不能使用忽略证书错误的启动参数。')
  const ca = await fs.readFile(path.join(output, 'tls', 'ca.pem'))
  const cert = await fs.readFile(path.join(output, 'tls', 'server.pem'))
  const key = await fs.readFile(path.join(output, 'tls', 'server.key'))
  const expected = new X509Certificate(cert)
  const hosts = ['a.localhost', 'b.localhost', 'tracker.localhost']
  const activeTunnelPorts = new Set()
  const requests = []
  const sockets = new Set()
  const tunnels = []
  const workerQuery = `async function query (url) {
    try {
      const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(4000) })
      return { ok: response.ok, completed: true, value: await response.json(), navigator: { userAgent: navigator.userAgent, platform: navigator.platform, language: navigator.language, hardwareConcurrency: navigator.hardwareConcurrency, deviceMemory: navigator.deviceMemory } }
    } catch { return { ok: false, completed: true } }
  }`
  const origin = https.createServer({ key, cert }, (request, response) => {
    const url = new URL(request.url, `https://${request.headers.host}`)
    const clientHints = Object.fromEntries(Object.entries(request.headers).filter(([name]) => name.startsWith('sec-ch-') || ['device-memory', 'dpr', 'rtt', 'downlink', 'ect'].includes(name)))
    requests.push({ host: url.host, pathname: url.pathname, userAgent: request.headers['user-agent'], acceptLanguage: request.headers['accept-language'], clientHints, encrypted: request.socket.encrypted === true, throughProxy: activeTunnelPorts.has(request.socket.remotePort) })
    response.setHeader('Cache-Control', 'no-store')
    if (url.pathname === '/hints/clear') response.setHeader('Accept-CH', '')
    else if (url.pathname === '/hints/non-ua') response.setHeader('Accept-CH', 'Sec-CH-Device-Memory, Sec-CH-DPR, RTT, Downlink, ECT')
    else if (!url.pathname.startsWith('/hints/')) response.setHeader('Accept-CH', 'Sec-CH-UA-Full-Version-List, Sec-CH-UA-Platform, Sec-CH-UA-Platform-Version, Sec-CH-UA-Arch, Sec-CH-UA-Bitness')
    if (url.pathname === '/hints/echo') {
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.end(JSON.stringify(clientHints))
    } else if (url.pathname === '/headers') {
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.end(JSON.stringify({ userAgent: request.headers['user-agent'], acceptLanguage: request.headers['accept-language'], hints: request.headers['sec-ch-ua-full-version-list'] || null, clientHints }))
    } else if (url.pathname.endsWith('/redirect')) {
      response.writeHead(302, { Location: url.pathname.replace(/\/redirect$/, '/redirect-target') })
      response.end()
    } else if (url.pathname.startsWith('/network-')) {
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.end(JSON.stringify({ pathname: url.pathname }))
    } else if (url.pathname.endsWith('-worker.js')) {
      response.setHeader('Content-Type', 'application/javascript; charset=utf-8')
      if (url.pathname === '/service-worker.js') response.end(`${workerQuery}; self.addEventListener('install', event => event.waitUntil(self.skipWaiting())); self.addEventListener('activate', event => event.waitUntil(self.clients.claim())); self.addEventListener('message', event => { event.waitUntil((async () => { event.ports[0].postMessage(await query(event.data)); event.ports[0].close() })()) })`)
      else if (url.pathname === '/shared-worker.js') response.end(`${workerQuery}; onconnect = event => { const port = event.ports[0]; port.onmessage = async message => port.postMessage(await query(message.data)); port.start() }`)
      else response.end(`${workerQuery}; onmessage = async event => postMessage(await query(event.data))`)
    } else {
      response.setHeader('Content-Type', 'text/html; charset=utf-8')
      response.end('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>HTTPS 隔离验证</title><body>仅用于独立诊断。</body></html>')
    }
  })
  origin.on('secureConnection', socket => { sockets.add(socket); socket.once('close', () => sockets.delete(socket)) })
  origin.on('upgrade', (request, socket) => {
    const websocketKey = request.headers['sec-websocket-key']
    if (!websocketKey || !/^\/network-(before|after|environment-[0-2])\/websocket$/.test(request.url)) { socket.destroy(); return }
    requests.push({ pathname: request.url, encrypted: true, throughProxy: activeTunnelPorts.has(socket.remotePort) })
    const accept = createHash('sha1').update(`${websocketKey}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest('base64')
    socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`)
    socket.on('data', () => socket.end())
    socket.on('error', () => {})
  })
  const port = await listen(origin)
  const siteA = `https://a.localhost:${port}`
  const siteB = `https://b.localhost:${port}`
  report.https = { certificateTrust: '每轮独立 CA；Node 校验链和主机名后，仅诊断 Session 信任指定叶证书及三处测试主机。不导入系统证书，不忽略证书错误。', certificateFingerprint: expected.fingerprint256, preflight: [], samples: [], contextSamples: [], hintContracts: [], controls: [], requests, tunnels }
  try {
    for (const hostname of hosts) {
      const protocol = await new Promise((resolve, reject) => {
        const socket = tls.connect({ host: '127.0.0.1', port, servername: hostname, ca, rejectUnauthorized: true })
        socket.setTimeout(5000, () => { socket.destroy(); reject(new Error('HTTPS 证书预检超时。')) })
        socket.once('error', () => reject(new Error('HTTPS 证书链或主机名校验失败。')))
        socket.once('secureConnect', () => { const value = socket.getProtocol(); socket.end(); resolve(value) })
      })
      report.https.preflight.push({ hostname, authorized: true, protocol })
    }
    function trustDiagnosticCertificate (profileSession) {
      // 只信任已通过真实 TLS 预检的本轮证书；其他证书和主机继续由系统验证。
      profileSession.setCertificateVerifyProc((request, callback) => {
        let accepted = false
        try {
          const certificate = new X509Certificate(request.certificate.data)
          const now = Date.now()
          accepted = hosts.includes(request.hostname) && certificate.fingerprint256 === expected.fingerprint256 && Boolean(certificate.checkHost(request.hostname)) && now >= Date.parse(certificate.validFrom) && now <= Date.parse(certificate.validTo)
        } catch {}
        callback(accepted ? 0 : -3)
      })
    }
    for (const profileSession of sessions) trustDiagnosticCertificate(profileSession)
    const untrusted = session.fromPath(path.join(output, 'data', 'untrusted-https'))
    await untrusted.setProxy({ mode: 'direct' })
    const rejectedWindow = createWindow(untrusted)
    let untrustedRejected = false
    try { await rejectedWindow.loadURL(siteA) } catch { untrustedRejected = true }
    assert.equal(untrustedRejected, true, '没有诊断信任配置的会话接受了测试证书。')
    const wrongHostWindow = createWindow(sessions[0])
    let wrongHostRejected = false
    try { await wrongHostWindow.loadURL(`https://untrusted.localhost:${port}/`) } catch { wrongHostRejected = true }
    assert.equal(wrongHostRejected, true, '诊断证书被用于授权范围以外的主机。')
    report.https.untrustedRejected = untrustedRejected
    report.https.wrongHostRejected = wrongHostRejected
    report.checks.push('HTTPS 证书链/主机名预检、诊断会话限定信任和拒绝对照通过。')

    for (const [index, profileSession] of sessions.entries()) {
      const window = createWindow(profileSession)
      await window.loadURL(`${siteA}/hints/passive`)
      const unnegotiated = await readHintHeaders(window)
      assertNoHighEntropyHints(unnegotiated, '尚未协商的来源提前发送了高熵用户代理提示。')
      for (const site of [siteA, siteB]) {
        await window.loadURL(site)
        const signals = await window.webContents.executeJavaScript(`(${collectFingerprintSignals.toString()})()`)
        const sample = { environment: index, signals, missingHints: [], expectsNegotiation: index !== 0 }
        report.https.samples.push(sample)
        assert.equal(signals.secureContext, true, 'HTTPS 页面不是安全上下文。')
        assert.equal(signals.navigator.userAgent, signals.headers.userAgent, 'HTTPS 页面与请求用户代理不一致。')
        assert.ok(signals.navigator.hints, 'HTTPS 页面未提供客户端提示。')
        for (const [field, header] of [['platform', 'sec-ch-ua-platform'], ['platformVersion', 'sec-ch-ua-platform-version'], ['architecture', 'sec-ch-ua-arch'], ['bitness', 'sec-ch-ua-bitness']]) {
          if (!signals.headers.clientHints[header]) { sample.missingHints.push(header); continue }
          assert.equal(JSON.parse(signals.headers.clientHints[header]), signals.navigator.hints[field], 'HTTPS 客户端提示与网页高熵值不一致。')
        }
        if (!signals.headers.hints) sample.missingHints.push('sec-ch-ua-full-version-list')
        else for (const item of signals.navigator.hints.fullVersionList) assert.ok(signals.headers.hints.includes(`${JSON.stringify(item.brand)};v=${JSON.stringify(item.version)}`), 'HTTPS 版本列表请求头与网页值不一致。')
        assert.deepEqual(signals.worker.hints, signals.navigator.hints, 'HTTPS 页面与工作线程客户端提示不一致。')
      }
      try {
        const contexts = await window.webContents.executeJavaScript(`(${collectNetworkRequests.toString()})(${JSON.stringify(`environment-${index}`)})`)
        report.https.contextSamples.push({ environment: index, contexts })
        const expectedNavigator = report.https.samples.find(sample => sample.environment === index).signals.navigator
        for (const kind of ['dedicated', 'shared', 'serviceWorker']) {
          assert.equal(contexts[kind].ok && contexts[kind].completed, true, '后台线程一致性采集缺少有效网络对照。')
          const route = { dedicated: 'dedicated-worker', shared: 'shared-worker', serviceWorker: 'service-worker' }[kind]
          const request = requests.find(item => item.pathname === `/network-environment-${index}/${route}`)
          assert.ok(request, '后台线程客户端提示缺少源站请求记录。')
          contexts[kind].clientHints = request.clientHints
          contexts[kind].requestUserAgent = request.userAgent
          contexts[kind].requestLanguage = request.acceptLanguage
          assert.equal(request.userAgent, expectedNavigator.userAgent, '后台线程请求用户代理与网页值不一致。')
          if (index !== 0) assert.ok(request.acceptLanguage?.startsWith(expectedNavigator.language), '后台线程请求语言与环境配置不一致。')
          for (const [field, header] of [['platform', 'sec-ch-ua-platform'], ['platformVersion', 'sec-ch-ua-platform-version'], ['architecture', 'sec-ch-ua-arch'], ['bitness', 'sec-ch-ua-bitness']]) {
            if (request.clientHints[header]) assert.equal(JSON.parse(request.clientHints[header]), expectedNavigator.hints[field], '后台线程请求提示与网页高熵值不一致。')
          }
          if (index !== 0 && highEntropyHeaders.some(header => !request.clientHints[header])) report.unverified.push(`环境 ${index} 的 ${kind} 请求未完成高熵用户代理提示协商，需单独核验传输入口。`)
          const mismatches = ['userAgent', 'platform', 'language', 'hardwareConcurrency', 'deviceMemory'].filter(field => contexts[kind].navigator[field] !== expectedNavigator[field])
          if (mismatches.length) report.gaps.push(`环境 ${index} 的 ${kind} 与页面配置不一致：${mismatches.join('、')}。`)
        }
      } finally {
        await window.webContents.executeJavaScript("(() => { const probes = window.fpNetworkProbes; probes?.dedicated.terminate(); probes?.shared.port.close() })()")
      }
      const frameStart = requests.length
      await window.webContents.executeJavaScript(`(async () => {
        const frame = document.createElement('iframe')
        let timer
        try {
          await new Promise((resolve, reject) => {
            timer = setTimeout(() => reject(new Error('子框架提示采集超时。')), 5000)
            frame.onload = () => resolve()
            frame.src = ${JSON.stringify(`https://tracker.localhost:${port}/hints/frame`)}
            document.body.append(frame)
          })
        } finally { clearTimeout(timer); frame.remove() }
      })()`)
      const frame = requests.slice(frameStart).find(item => item.pathname === '/hints/frame')
      assert.ok(frame, '子框架客户端提示缺少有效请求对照。')
      assertNoHighEntropyHints(frame.clientHints, '未授权的跨来源子框架获得了高熵用户代理提示。')
      await window.loadURL(`${siteA}/hints/clear`)
      const cleared = await readHintHeaders(window)
      assertNoHighEntropyHints(cleared, '空协商响应没有清除来源的高熵提示。')
      await window.loadURL(`${siteA}/hints/non-ua`)
      const nonUA = await readHintHeaders(window)
      for (const header of ['sec-ch-device-memory', 'sec-ch-dpr', 'rtt', 'downlink', 'ect']) assert.equal(Object.hasOwn(nonUA, header), false, '用户代理协商启用了尚未核验的硬件或网络提示。')
      await window.loadURL(`${siteB}/hints/passive`)
      const retained = await readHintHeaders(window)
      report.https.hintContracts.push({ environment: index, unnegotiated, cleared, nonUA, otherOriginRetained: retained, frame: frame.clientHints })
      if (index !== 0 && process.env.FP_FINGERPRINT_REQUIRE_CLIENT_HINTS === '1') {
        for (const header of highEntropyHeaders) assert.ok(retained[header], '清除一个来源的协商影响了同会话的其他来源。')
      }
    }
    report.checks.push('HTTPS 三环境双站用户代理、已发送客户端提示与页面/工作线程值一致。')
    const configuredMissingHints = report.https.samples.filter(sample => sample.expectsNegotiation && sample.missingHints.length)
    if (configuredMissingHints.length) report.gaps.push('HTTPS 已声明接受高熵客户端提示，但启用配置的环境未发送部分协商请求头；缺失字段见 HTTPS 样本。')
    else report.checks.push('HTTPS 开启配置的两环境双站高熵用户代理提示完整协商通过。')
    if (process.env.FP_FINGERPRINT_REQUIRE_CLIENT_HINTS === '1') assert.equal(configuredMissingHints.length, 0, '客户端提示修复验收失败，开启配置的环境仍缺少协商请求头。')

    for (const mode of ['fresh', 'module-disabled', 'fingerprint-disabled']) {
      const profileSession = session.fromPath(path.join(output, 'data', `hints-${mode}`))
      const profile = getDefaultProfile()
      if (mode === 'module-disabled') profile.modules.clientHints = false
      if (mode === 'fingerprint-disabled') profile.enabled = false
      applyFingerprintConfig(profileSession, profile)
      trustDiagnosticCertificate(profileSession)
      const window = createWindow(profileSession)
      try {
        await window.loadURL(`${siteB}${mode === 'fresh' ? '/hints/passive' : '/'}`)
        const headers = await readHintHeaders(window)
        assertNoHighEntropyHints(headers, '新会话继承了其他会话的协商，或关闭配置后仍启用了协商。')
        report.https.controls.push({ mode, headers })
      } finally { profileSession.setCertificateVerifyProc(null) }
    }
    const scriptDisabled = createWindow(sessions[1], false)
    const scriptDisabledStart = requests.length
    await scriptDisabled.loadURL(`${siteB}/hints/no-script`)
    const disabledRequest = requests.slice(scriptDisabledStart).find(item => item.pathname === '/hints/no-script')
    assert.ok(disabledRequest, '禁用脚本的导航没有到达测试端点。')
    assertNoHighEntropyHints(disabledRequest.clientHints, '关闭脚本的页面仍发送已缓存的高熵用户代理提示。')
    report.https.controls.push({ mode: 'javascript-disabled', headers: disabledRequest.clientHints })
    const sibling = createWindow(sessions[1])
    await sibling.loadURL(`${siteB}/hints/passive`)
    const siblingHeaders = await readHintHeaders(sibling)
    if (process.env.FP_FINGERPRINT_REQUIRE_CLIENT_HINTS === '1') {
      for (const header of highEntropyHeaders) assert.ok(siblingHeaders[header], '同会话新页面没有复用本来源的协商。')
    }
    report.https.controls.push({ mode: 'same-session-new-page', headers: siblingHeaders })
    report.checks.push('用户代理提示无预先发送、空响应清除、会话/来源隔离、关闭配置与子框架权限边界通过。')
    if (report.https.contextSamples.every(sample => ['dedicated', 'shared', 'serviceWorker'].every(kind => {
      const expectedNavigator = report.https.samples.find(item => item.environment === sample.environment).signals.navigator
      return ['userAgent', 'platform', 'language', 'hardwareConcurrency', 'deviceMemory'].every(field => sample.contexts[kind].navigator[field] === expectedNavigator[field])
    }))) report.checks.push('三环境页面、独立/共享/后台工作线程基本配置一致。')

    const proxySockets = new Set()
    const proxy = http.createServer((_request, response) => { response.writeHead(405); response.end('测试代理只接受 HTTPS 隧道。') })
    proxy.on('connection', socket => { proxySockets.add(socket); socket.once('close', () => proxySockets.delete(socket)); socket.on('error', () => {}) })
    proxy.on('connect', (request, client, head) => {
      if (!hosts.some(hostname => request.url === `${hostname}:${port}`)) { client.end('HTTP/1.1 403 Forbidden\r\n\r\n'); return }
      const upstream = net.createConnection({ host: '127.0.0.1', port })
      proxySockets.add(upstream)
      let localPort
      upstream.once('connect', () => {
        localPort = upstream.localPort
        activeTunnelPorts.add(localPort)
        tunnels.push({ authority: request.url })
        client.write('HTTP/1.1 200 Connection Established\r\n\r\n')
        if (head.length) upstream.write(head)
        upstream.pipe(client)
        client.pipe(upstream)
      })
      upstream.once('close', () => { activeTunnelPorts.delete(localPort); proxySockets.delete(upstream); client.destroy() })
      upstream.on('error', () => client.destroy())
      client.once('close', () => upstream.destroy())
    })
    const proxyPort = await listen(proxy)
    const proxySession = session.fromPath(path.join(output, 'data', 'https-proxy'))
    trustDiagnosticCertificate(proxySession)
    await applyProxyConfig(proxySession, { mode: 'http', server: `http://127.0.0.1:${proxyPort}`, username: '', password: '' }, siteA)
    const window = createWindow(proxySession)
    try {
      await window.loadURL(siteA)
      const before = await window.webContents.executeJavaScript(`(${collectNetworkRequests.toString()})('before')`)
      report.https.network = { before }
      for (const [kind, value] of Object.entries(before)) {
        assert.equal(value.completed && value.ok, true, `${kind} 正常代理对照没有完成。`)
        const route = { dedicated: 'dedicated-worker', shared: 'shared-worker', serviceWorker: 'service-worker' }[kind] || kind
        assert.ok(requests.some(item => item.pathname === `/network-before/${route}`), `${kind} 对照缺少源站请求。`)
      }
      assert.ok(requests.some(item => item.pathname === '/network-before/redirect-target'), '重定向未到达目标。')
      assert.ok(requests.filter(item => item.pathname.startsWith('/network-before/')).every(item => item.encrypted && item.throughProxy), 'HTTPS 后台或重定向请求出现直连。')
      for (const kind of ['dedicated', 'shared', 'serviceWorker']) {
        for (const field of ['userAgent', 'platform', 'language', 'hardwareConcurrency', 'deviceMemory']) assert.equal(before[kind].navigator[field], report.https.samples[0].signals.navigator[field], '未配置会话的页面与后台工作线程基本字段不一致。')
      }
      for (const socket of proxySockets) socket.destroy()
      proxy.closeAllConnections()
      await new Promise(resolve => proxy.close(resolve))
      await proxySession.closeAllConnections()
      const after = await window.webContents.executeJavaScript(`(${collectNetworkRequests.toString()})('after')`)
      report.https.network.after = after
      for (const [kind, value] of Object.entries(after)) {
        assert.equal(value.completed, true, `${kind} 代理故障采集超时，不能认定阻断通过。`)
        assert.equal(value.ok, false, `${kind} 在代理故障后仍加载成功。`)
      }
      assert.equal(requests.filter(item => item.pathname.startsWith('/network-after/')).length, 0, 'HTTPS 后台请求在代理故障后回退直连。')
      report.checks.push('HTTPS 隧道下页面、两类工作线程、后台工作线程、重定向与加密 WebSocket 正常代理及故障阻断通过。')
    } finally {
      for (const socket of proxySockets) socket.destroy()
      proxy.closeAllConnections()
      proxy.close()
      proxySession.setCertificateVerifyProc(null)
      if (!window.isDestroyed()) await window.webContents.executeJavaScript("(() => { const probes = window.fpNetworkProbes; probes?.dedicated.terminate(); probes?.shared.port.close() })()").catch(() => {})
    }
  } finally {
    for (const socket of sockets) socket.destroy()
    for (const profileSession of sessions) profileSession.setCertificateVerifyProc(null)
  }
}

module.exports = { verifyHTTPSNetwork }
