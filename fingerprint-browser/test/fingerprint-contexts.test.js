const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const http = require('node:http')
const https = require('node:https')
const net = require('node:net')
const tls = require('node:tls')
const { X509Certificate } = require('node:crypto')
const { app, BrowserWindow, session } = require('electron/main')
const { getDefaultProfile } = require('../profile-store')
const { applyFingerprintConfig } = require('../runtime-compat')
const { applyProxyConfig } = require('../browser-tabs')
const { getContextFallbackFields, getWebGPUProtectionFailures, getWebGPUBaselineStatus } = require('../scripts/test-fingerprint')

const output = process.env.FP_FINGERPRINT_TEST_OUTPUT
const phase = process.env.FP_CONTEXT_PHASE || 'initial'
if (!output || !path.resolve(output).startsWith(`${path.resolve(__dirname, '../../dist/electron-diagnostics/fingerprint')}${path.sep}`)) throw new Error('上下文验证必须使用独立诊断目录。')
if (!['initial', 'restore'].includes(phase)) throw new Error('上下文验证阶段无效。')
app.setPath('userData', path.join(output, 'data'))
const report = { ok: false, phase, runtime: process.versions, samples: [], failures: [], tls: [], unverified: [], notApplicable: [], scope: '本地受控 HTTPS；记录协商协议和密码套件，不将其称为 JA3/JA4 或公网验收。' }
const windows = []
const sessions = []
const sockets = new Set()
let server
let proxy
const tunnelPorts = new Set()

async function collectContextSignals () {
  const graphics = new OffscreenCanvas(32, 32).getContext('webgl')
  const extension = graphics?.getExtension('WEBGL_debug_renderer_info')
  const result = {
    userAgent: navigator.userAgent, platform: navigator.platform,
    language: navigator.language, languages: [...navigator.languages],
    hardwareConcurrency: navigator.hardwareConcurrency, deviceMemory: navigator.deviceMemory,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    hints: navigator.userAgentData ? await navigator.userAgentData.getHighEntropyValues(['fullVersionList', 'platform', 'architecture', 'bitness']) : null,
    webglVendor: extension ? graphics.getParameter(extension.UNMASKED_VENDOR_WEBGL) : null,
    webgpu: { supported: Boolean(navigator.gpu), requests: {} },
    headers: await (await fetch('/headers', { cache: 'no-store' })).json()
  }
  graphics?.getExtension('WEBGL_lose_context')?.loseContext()
  for (const [name, options] of [
    ['default', {}], ['low-power', { powerPreference: 'low-power' }],
    ['high-performance', { powerPreference: 'high-performance' }], ['force-fallback', { forceFallbackAdapter: true }]
  ]) {
    const attempt = { adapter: false, device: false, adapterError: false, deviceError: false }
    if (navigator.gpu) {
      let adapter
      try {
        adapter = await navigator.gpu.requestAdapter(options)
        attempt.adapter = Boolean(adapter)
      } catch { attempt.adapterError = true }
      if (adapter) {
        if (name === 'default') result.webgpu.vendor = adapter.info.vendor
        try {
          const device = await adapter.requestDevice()
          attempt.device = Boolean(device)
          device?.destroy()
        } catch { attempt.deviceError = true }
      }
    }
    result.webgpu.requests[name] = attempt
  }
  return result
}

async function collectRelatedContexts (otherOrigin, restore) {
  function receive (port, start) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { port.close?.(); reject(new Error('上下文采集超时。')) }, 20000)
      port.onmessage = event => {
        clearTimeout(timer)
        port.onmessage = null
        if (event.data.error) reject(new Error('上下文采集失败。'))
        else resolve(event.data)
      }
      start()
    })
  }
  async function frameSample (origin) {
    const frame = document.createElement('iframe')
    let handler
    let timer
    try {
      return await new Promise((resolve, reject) => {
        timer = setTimeout(() => reject(new Error('子框架采集超时。')), 20000)
        handler = event => {
          if (event.source === frame.contentWindow && event.origin === origin) {
            if (event.data.error) reject(new Error('子框架采集失败。'))
            else resolve(event.data)
          }
        }
        window.addEventListener('message', handler)
        frame.src = `${origin}/frame?parent=${encodeURIComponent(location.origin)}`
        document.body.append(frame)
      })
    } finally { clearTimeout(timer); window.removeEventListener('message', handler); frame.remove() }
  }
  const dedicated = new Worker('/dedicated.js')
  const shared = new SharedWorker('/shared.js')
  shared.port.start()
  const channel = new MessageChannel()
  try {
    const registration = restore ? await navigator.serviceWorker.getRegistration() : await navigator.serviceWorker.register('/service.js')
    if (!registration) throw new Error('重启后未恢复后台线程注册。')
    await navigator.serviceWorker.ready
    const result = {}
    result.dedicated = await receive(dedicated, () => dedicated.postMessage(null))
    result.shared = await receive(shared.port, () => shared.port.postMessage(null))
    result.serviceWorker = await receive(channel.port1, () => registration.active.postMessage(null, [channel.port2]))
    result.sameOriginFrame = await frameSample(location.origin)
    result.crossOriginFrame = await frameSample(otherOrigin)
    return result
  } finally { dedicated.terminate(); shared.port.close(); channel.port1.close(); channel.port2.close() }
}

function check (description, callback) {
  try { callback() } catch (error) { report.failures.push({ description, message: error instanceof assert.AssertionError ? error.message.split('\n')[0] : '验证未完成。' }) }
}

async function run () {
  await app.whenReady()
  const cert = await fs.readFile(path.join(output, 'tls', 'server.pem'))
  const key = await fs.readFile(path.join(output, 'tls', 'server.key'))
  const ca = await fs.readFile(path.join(output, 'tls', 'ca.pem'))
  const expected = new X509Certificate(cert)
  const probe = `(${collectContextSignals.toString()})()`
  const reply = `async function reply(port) { try { port.postMessage(await ${probe}) } catch { port.postMessage({ error: '采集失败。' }) } }`
  server = https.createServer({ cert, key, ALPNProtocols: ['http/1.1'] }, (request, response) => {
    const url = new URL(request.url, `https://${request.headers.host}`)
    response.setHeader('Cache-Control', 'no-store')
    response.setHeader('Accept-CH', 'Sec-CH-UA-Full-Version-List, Sec-CH-UA-Platform, Sec-CH-UA-Arch, Sec-CH-UA-Bitness')
    if (url.pathname === '/headers') {
      const transport = { host: url.host, protocol: request.socket.getProtocol(), cipher: request.socket.getCipher().standardName, alpn: request.socket.alpnProtocol, httpVersion: request.httpVersion, userAgent: request.headers['user-agent'], throughProxy: tunnelPorts.has(request.socket.remotePort) }
      report.tls.push(transport)
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.end(JSON.stringify({ userAgent: request.headers['user-agent'], language: request.headers['accept-language'], hints: Object.fromEntries(Object.entries(request.headers).filter(([name]) => name.startsWith('sec-ch-'))), tls: transport }))
    } else if (url.pathname.endsWith('.js')) {
      response.setHeader('Content-Type', 'application/javascript; charset=utf-8')
      if (url.pathname === '/service.js') response.end(`${reply}; self.addEventListener('install', event => event.waitUntil(self.skipWaiting())); self.addEventListener('activate', event => event.waitUntil(self.clients.claim())); self.addEventListener('message', event => event.waitUntil(reply(event.ports[0])))`)
      else if (url.pathname === '/shared.js') response.end(`${reply}; onconnect = event => { const port = event.ports[0]; port.onmessage = async () => await reply(port); port.start() }`)
      else response.end(`${reply}; onmessage = async () => await reply(self)`)
    } else {
      response.setHeader('Content-Type', 'text/html; charset=utf-8')
      const parent = url.searchParams.get('parent')
      const allowedParent = parent && /^https:\/\/[ab]\.localhost:\d+$/.test(parent)
      response.end(`<!doctype html><meta charset="utf-8"><title>上下文验证</title><body>独立诊断页面${url.pathname === '/frame' && allowedParent ? `<script>void (async () => { try { parent.postMessage(await ${probe}, ${JSON.stringify(parent)}) } catch { parent.postMessage({ error: '采集失败。' }, ${JSON.stringify(parent)}) } })()</script>` : ''}</body>`)
    }
  })
  server.on('connection', socket => { sockets.add(socket); socket.once('close', () => sockets.delete(socket)) })
  const fixturePath = path.join(output, 'context-fixture.json')
  const port = phase === 'restore' ? JSON.parse(await fs.readFile(fixturePath, 'utf8')).port : 0
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve) })
  const actualPort = server.address().port
  if (phase === 'initial') await fs.writeFile(fixturePath, JSON.stringify({ port: actualPort }), 'utf8')
  const siteA = `https://a.localhost:${actualPort}`
  const siteB = `https://b.localhost:${actualPort}`
  await new Promise((resolve, reject) => {
    const socket = tls.connect({ host: '127.0.0.1', port: actualPort, servername: 'a.localhost', ca })
    socket.once('secureConnect', () => { socket.end(); resolve() })
    socket.once('error', () => reject(new Error('诊断证书校验失败。')))
  })
  const profiles = [null, getDefaultProfile(), getDefaultProfile(), getDefaultProfile(), getDefaultProfile(), getDefaultProfile(), getDefaultProfile()]
  for (let index = 1; index < profiles.length; index++) {
    const profile = profiles[index]
    profile.id = `中文配置-${index}-😀-"引号"-\\-\n`
    profile.noise.seed = `固定种子-${index}-𠮷-\\u4e2d`
    profile.hardware.hardwareConcurrency = 2 + index * 2
    profile.graphics.webglVendor = `测试厂商-${index}-😀`
    profile.locale = { language: 'en-US', languages: ['en-US', 'en'], timezone: 'America/New_York' }
    profile.browser.acceptLanguage = 'en-US,en;q=0.9'
    if (index === 2) {
      profile.locale = { language: 'fr-FR', languages: ['fr-FR', 'fr'], timezone: 'Europe/Paris' }
      profile.browser.acceptLanguage = 'fr-FR,fr;q=0.9'
    }
    if (index === 6) {
      profile.id = 'ascii-profile'
      profile.noise.seed = 'ascii-seed'
      profile.graphics.webglVendor = 'ASCII vendor'
      profile.modules.clientHints = false
    }
    profile.modules.canvas = false
    profile.modules.audio = false
    profile.noise.canvas = false
    profile.noise.audio = false
    if (index === 3) profile.modules.webgl = false
    if (index === 4) profile.enabled = false
    if (index === 5) for (const module of Object.keys(profile.modules)) profile.modules[module] = false
  }
  for (const [index, profile] of profiles.entries()) {
    const profileSession = session.fromPath(path.join(output, 'data', `context-${index}`))
    sessions.push(profileSession)
    await profileSession.setProxy({ mode: 'direct' })
    profileSession.setCertificateVerifyProc((request, callback) => {
      let accepted = false
      try { accepted = ['a.localhost', 'b.localhost'].includes(request.hostname) && new X509Certificate(request.certificate.data).fingerprint256 === expected.fingerprint256 } catch {}
      callback(accepted ? 0 : -3)
    })
    if (profile) {
      applyFingerprintConfig(profileSession, profile)
      check(`环境 ${index} 配置往返`, () => assert.deepEqual(profileSession.getFingerprintConfig(), profile, '配置往返不一致。'))
    }
    const window = new BrowserWindow({ show: false, webPreferences: { session: profileSession, sandbox: true, contextIsolation: true, nodeIntegration: false } })
    windows.push(window)
    await window.loadURL(siteA)
    const marker = `环境-${index}`
    if (phase === 'initial') {
      assert.equal(await window.webContents.executeJavaScript("localStorage.getItem('context-marker')"), null, '新环境误用了其他环境的存储。')
      await window.webContents.executeJavaScript(`localStorage.setItem('context-marker', ${JSON.stringify(marker)})`)
    }
    assert.equal(await window.webContents.executeJavaScript("localStorage.getItem('context-marker')"), marker, '环境存储未恢复或串用。')
    const values = { page: await window.webContents.executeJavaScript(probe), ...await window.webContents.executeJavaScript(`(${collectRelatedContexts.toString()})(${JSON.stringify(siteB)}, ${phase === 'restore'})`) }
    report.samples.push({ index, values })
    for (const [context, value] of Object.entries(values)) {
      const native = report.samples[0].values[context]
      for (const field of ['userAgent', 'platform', 'language', 'hardwareConcurrency', 'deviceMemory', 'timezone']) {
        check(`环境 ${index} ${context} ${field}`, () => assert.deepEqual(value[field], values.page[field], '上下文配置不一致。'))
      }
      check(`环境 ${index} ${context} 语言列表一致`, () => assert.deepEqual(value.languages, values.page.languages, '上下文语言列表不一致。'))
      if (profile?.enabled && profile.modules.locale) check(`环境 ${index} ${context} 完整语言列表`, () => assert.deepEqual(value.languages, profile.locale.languages, '工作线程语言列表未完整应用。'))
      if (profile?.enabled && profile.modules.clientHints) {
        check(`环境 ${index} ${context} 高熵提示可用`, () => assert.ok(value.hints && typeof value.hints === 'object' && values.page.hints && typeof values.page.hints === 'object', '已启用客户端提示，但该上下文未返回高熵值。'))
        check(`环境 ${index} ${context} 客户端提示一致`, () => assert.deepEqual(value.hints, values.page.hints, '客户端提示在上下文之间不一致。'))
      }
      for (const field of getContextFallbackFields(profile)) {
        const actual = field.split('.').reduce((target, key) => target?.[key], value)
        const expected = field.split('.').reduce((target, key) => target?.[key], native)
        check(`环境 ${index} ${context} ${field} 原生回退`, () => assert.deepEqual(actual, expected, '关闭配置或模块后未保持该上下文的原生值。'))
      }
      const missingHintHeaders = ['sec-ch-ua-full-version-list', 'sec-ch-ua-platform', 'sec-ch-ua-arch', 'sec-ch-ua-bitness'].filter(header => !Object.hasOwn(value.headers.hints, header))
      if (profile?.enabled && profile.modules.clientHints && missingHintHeaders.length) {
        const description = `环境 ${index} ${context} 高熵提示请求头`
        report.unverified.push(`${description}缺少 ${missingHintHeaders.join('、')}；本项尚未完成线程协商验证。`)
        if (process.env.FP_FINGERPRINT_REQUIRE_CLIENT_HINTS === '1') report.failures.push({ description, message: '已要求严格验证，但该上下文缺少部分高熵用户代理提示请求头。' })
      }
      check(`环境 ${index} ${context} 请求身份`, () => {
        assert.equal(value.headers.userAgent, values.page.userAgent, '请求用户代理不一致。')
        assert.equal(value.headers.language.split(',')[0], values.page.language, '请求语言不一致。')
        const expectedLanguage = profile?.enabled && profile.modules.locale ? profile.browser.acceptLanguage : native.headers.language
        assert.equal(value.headers.language, expectedLanguage, '请求语言列表或优先级与环境配置不一致。')
      })
      if (profile?.enabled) {
        check(`环境 ${index} ${context} 配置生效`, () => {
          if (profile.modules.navigator) assert.equal(value.platform, profile.hardware.platform, '配置的平台值未生效。')
          if (profile.modules.navigator) assert.equal(value.hardwareConcurrency, profile.hardware.hardwareConcurrency, '配置的硬件值未生效。')
          if (profile.modules.navigator) assert.equal(value.deviceMemory, profile.hardware.deviceMemory, '配置的设备内存值未生效。')
          if (profile.modules.timezone) assert.equal(value.timezone, profile.locale.timezone, '配置的时区未生效。')
          if (profile.modules.locale) assert.equal(value.language, profile.locale.language, '配置的主要语言未生效。')
          if (profile.modules.webgl) assert.equal(value.webglVendor, profile.graphics.webglVendor, '图形名称未生效或本机不支持所需图形对照。')
        })
        if (profile.modules.webgl) {
          check(`环境 ${index} ${context} WebGPU 支持状态`, () => assert.equal(value.webgpu.supported, native.webgpu.supported, '保护配置改变了该上下文的 WebGPU API 支持状态。'))
          check(`环境 ${index} ${context} WebGPU 限制`, () => assert.deepEqual(getWebGPUProtectionFailures(value.webgpu), [], '受保护环境的某种 WebGPU 请求取得了适配器、设备或发生错误。'))
        }
      }
    }
    await profileSession.flushStorageData()
  }
  // 所有环境都已存在后重新创建页面和线程，检查后创建的配置是否污染已有环境。
  for (const sample of report.samples) {
    const window = windows[sample.index]
    await window.loadURL(siteA)
    sample.refreshed = { page: await window.webContents.executeJavaScript(probe), ...await window.webContents.executeJavaScript(`(${collectRelatedContexts.toString()})(${JSON.stringify(siteB)}, true)`) }
    check(`环境 ${sample.index} 刷新后请求语言`, () => assert.equal(sample.refreshed.page.headers.language.split(',')[0], sample.values.page.language, '刷新后请求语言发生串用。'))
    assert.equal(await window.webContents.executeJavaScript("localStorage.getItem('context-marker')"), `环境-${sample.index}`, '刷新后环境存储发生串用。')
    for (const [context, value] of Object.entries(sample.refreshed)) {
      check(`环境 ${sample.index} ${context} 刷新稳定`, () => {
        for (const field of ['userAgent', 'platform', 'language', 'languages', 'hardwareConcurrency', 'deviceMemory', 'timezone', 'hints', 'webglVendor', 'webgpu']) assert.deepEqual(value[field], sample.values[context][field], '刷新后上下文身份或图形策略改变。')
        assert.equal(value.headers.userAgent, sample.values[context].headers.userAgent, '刷新后请求用户代理改变。')
        assert.equal(value.headers.language, sample.values[context].headers.language, '刷新后请求语言改变。')
      })
    }
  }
  for (const [context, value] of Object.entries(report.samples[0].values)) {
    const status = getWebGPUBaselineStatus(value.webgpu)
    if (status === 'not-applicable') report.notApplicable.push(`${context} WebGPU：当前运行环境未提供可用的原生适配器及设备，本项不适用。`)
    else if (status === 'unverified') report.failures.push({ description: `${context} WebGPU 原生对照`, message: '默认模式未完成适配器及设备对照，本项未验证。' })
  }
  const invalid = session.fromPartition(`invalid-${phase}`)
  const invalidProfile = structuredClone(profiles[1])
  invalidProfile.hardware.hardwareConcurrency = -1
  check('非法配置拒绝', () => assert.throws(() => invalid.setFingerprintConfig(invalidProfile), '非法配置未被拒绝。'))
  check('非法配置无部分应用', () => assert.equal(invalid.getFingerprintConfig(), null, '非法配置发生了部分应用。'))
  proxy = http.createServer((request, response) => { response.writeHead(405); response.end('诊断仅支持 HTTPS 隧道。') })
  proxy.on('connect', (request, client, head) => {
    if (request.url !== `a.localhost:${actualPort}`) { client.destroy(); return }
    const upstream = net.connect({ host: '127.0.0.1', port: actualPort }, () => {
      tunnelPorts.add(upstream.localPort)
      const localPort = upstream.localPort
      upstream.once('close', () => tunnelPorts.delete(localPort))
      client.write('HTTP/1.1 200 Connection Established\r\n\r\n')
      if (head.length) upstream.write(head)
      upstream.pipe(client)
      client.pipe(upstream)
    })
    for (const socket of [client, upstream]) { sockets.add(socket); socket.once('close', () => sockets.delete(socket)) }
    client.on('error', () => upstream.destroy())
    upstream.on('error', () => client.destroy())
    client.once('close', () => upstream.destroy())
    upstream.once('close', () => client.destroy())
  })
  await new Promise((resolve, reject) => { proxy.once('error', reject); proxy.listen(0, '127.0.0.1', resolve) })
  await applyProxyConfig(sessions[0], { mode: 'http', server: `http://127.0.0.1:${proxy.address().port}`, username: '', password: '' }, siteA)
  await sessions[0].closeAllConnections()
  const proxyHeaders = await windows[0].webContents.executeJavaScript("(async () => await (await fetch('/headers', { cache: 'no-store' })).json())()")
  const directTLS = report.samples[0].values.page.headers.tls
  const proxyTLS = proxyHeaders.tls
  check('TLS 隧道实测', () => {
    assert.equal(directTLS.throughProxy, false, '直连对照路径不正确。')
    assert.equal(proxyTLS.throughProxy, true, '缺少经过代理的 TLS 样本。')
    for (const field of ['protocol', 'cipher', 'alpn', 'httpVersion', 'userAgent']) assert.equal(proxyTLS[field], directTLS[field], '直连与透明隧道协商结果不一致。')
  })
  report.tlsComparison = { direct: directTLS, tunnel: proxyTLS, limitation: '服务端只提供 HTTP/1.1；未测 HTTP/2、TLS 终止代理及 ClientHello 指纹。' }
  report.ok = report.failures.length === 0
}

void (async () => {
  const timeout = setTimeout(() => { console.error('上下文验证超时。'); app.exit(1) }, 160000)
  try { await run() } catch (error) {
    console.error('[context-diagnostic]', error)
    report.failures.push({ description: '运行验证', message: '上下文验证未完成，请检查本轮测试日志。' })
  }
  finally {
    clearTimeout(timeout)
    await fs.writeFile(path.join(output, `contexts-${phase}.json`), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
    for (const window of windows) if (!window.isDestroyed()) window.destroy()
    for (const profileSession of sessions) profileSession.setCertificateVerifyProc(null)
    for (const socket of sockets) socket.destroy()
    server?.close()
    proxy?.close()
    console.log(`上下文验证 ${phase === 'restore' ? '重启恢复' : '首次运行'}：${report.samples.length} 个环境，${report.failures.length} 项未通过。`)
    app.exit(report.ok ? 0 : 1)
  }
})()
