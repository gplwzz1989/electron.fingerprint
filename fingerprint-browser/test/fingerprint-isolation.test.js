const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const http = require('node:http')
const dgram = require('node:dgram')
const os = require('node:os')
const { app, BrowserWindow, session } = require('electron/main')
const { getDefaultProfile } = require('../profile-store')
const { applyFingerprintConfig } = require('../runtime-compat')
const { applyProxyConfig } = require('../browser-tabs')
const { describeFingerprintProtection } = require('../fingerprint-protection')
const { collectFingerprintSignals, collectWebRTCProbe, collectStorageSignals } = require('./fingerprint-probes')
const { verifyHTTPSNetwork } = require('./fingerprint-network')

const output = process.env.FP_FINGERPRINT_TEST_OUTPUT
const report = { ok: false, protectionReady: false, runtime: process.versions, transport: '本地 HTTP 安全上下文及诊断会话限定证书的 HTTPS，不代表公网验证。', checks: [], gaps: [], unverified: ['公网出口、目标 DNS、IPv6 与 QUIC', '远端 TURN 与真实会议', '工作线程完整指纹与完整图形格式', '发行包与跨进程恢复', 'HTTPS 代理、SOCKS5、认证与下载媒体的完整网络矩阵'], samples: [] }
const windows = []
const servers = []
let stun

if (!output || !path.resolve(output).startsWith(`${path.resolve(__dirname, '../../dist/electron-diagnostics/fingerprint')}${path.sep}`)) throw new Error('指纹验证必须使用独立诊断目录。')
app.setPath('userData', path.join(output, 'data'))

async function record () {
  await fs.writeFile(path.join(output, 'result.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
}

async function listen (server) {
  servers.push(server)
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  return server.address().port
}

function createWindow (profileSession, javascript = true) {
  const window = new BrowserWindow({ show: false, webPreferences: { session: profileSession, javascript, sandbox: true, contextIsolation: true, nodeIntegration: false } })
  windows.push(window)
  return window
}

async function thirdPartyStorage (contents, trackerOrigin, marker) {
  return await contents.executeJavaScript(`(async () => {
    const frame = document.createElement('iframe')
    const url = new URL('/tracker', ${JSON.stringify(trackerOrigin)})
    url.searchParams.set('parent', location.origin)
    ${marker ? `url.searchParams.set('marker', ${JSON.stringify(marker)})` : ''}
    try {
      return await new Promise((resolve, reject) => {
        const timer = setTimeout(() => { window.removeEventListener('message', onMessage); reject(new Error('第三方存储读取超时。')) }, 5000)
        function onMessage (event) {
          if (event.source !== frame.contentWindow || event.origin !== ${JSON.stringify(trackerOrigin)}) return
          clearTimeout(timer)
          window.removeEventListener('message', onMessage)
          resolve(event.data)
        }
        window.addEventListener('message', onMessage)
        frame.src = url.href
        document.body.append(frame)
      })
    } finally { frame.remove() }
  })()`)
}

async function run () {
  await app.whenReady()
  const originRequests = []
  const page = '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>指纹隔离验证</title><body>仅用于本地隔离验证。</body></html>'
  const origin = http.createServer((request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`)
    originRequests.push({ host: request.headers.host, pathname: url.pathname, throughProxy: request.headers['x-fp-test-proxy'] === '1' })
    response.setHeader('Cache-Control', 'no-store')
    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    response.setHeader('Accept-CH', 'Sec-CH-UA-Full-Version-List, Sec-CH-UA-Platform-Version')
    if (url.pathname === '/headers') {
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.end(JSON.stringify({ userAgent: request.headers['user-agent'], acceptLanguage: request.headers['accept-language'], hints: request.headers['sec-ch-ua-full-version-list'] || null }))
    } else if (url.pathname === '/tracker') {
      const parent = url.searchParams.get('parent')
      if (![siteA, siteB].includes(parent)) { response.writeHead(403); response.end('测试来源无效。'); return }
      const marker = url.searchParams.get('marker')
      const probe = `(${collectStorageSignals.toString()})(${JSON.stringify(marker)})`.replace(/</g, '\\u003c')
      response.end(`${page}<script>void (async () => { try { const stores = await ${probe}; parent.postMessage({ allowed: true, marker: stores.localStorage, stores }, ${JSON.stringify(parent)}) } catch { parent.postMessage({ allowed: false, reason: '第三方存储访问被拒绝。' }, ${JSON.stringify(parent)}) } })()</script>`)
    } else response.end(page)
  })
  const port = await listen(origin)
  const siteA = `http://a.localhost:${port}`
  const siteB = `http://b.localhost:${port}`
  const trackerOrigin = `http://tracker.localhost:${port}`
  const profiles = [null, getDefaultProfile(), getDefaultProfile()]
  for (const [index, profile] of profiles.entries()) {
    if (!profile) continue
    profile.id = `diagnostic-${index}`
    profile.noise.seed = `diagnostic-seed-${index}`
    profile.modules.canvas = true
    profile.modules.audio = true
    profile.noise.canvas = true
    profile.noise.audio = true
    profile.modules.webrtc = index === 2
    profile.hardware.hardwareConcurrency = index === 1 ? 4 : 12
    if (index === 2) {
      profile.locale = { language: 'en-US', languages: ['en-US', 'en'], timezone: 'America/New_York' }
      profile.browser.acceptLanguage = 'en-US,en;q=0.9'
    }
  }
  const sessions = []
  for (const [index, profile] of profiles.entries()) {
    const profileSession = session.fromPath(path.join(output, 'data', `environment-${index}`))
    if (profile) applyFingerprintConfig(profileSession, profile)
    sessions.push(profileSession)
    const window = createWindow(profileSession)
    await window.loadURL(`${siteA}/`)
    const first = await window.webContents.executeJavaScript(`(${collectFingerprintSignals.toString()})()`)
    assert.equal(first.secureContext, true, '本地测试来源不是安全上下文，不能完成本轮采集。')
    assert.equal(first.canvas.stable, true, '同一画布连续读回不稳定。')
    assert.equal(first.audio.sampleRate, 44100, '离线音频采样率不符合请求参数。')
    assert.equal(first.audio.duration, 64 / 44100, '音频帧数与时长不一致。')
    assert.equal(first.audio.copyMatches, true, '两种音频读回接口结果不同。')
    assert.deepEqual(first.emptyRange, { x: 0, y: 0, width: 0, height: 0 }, '空矩形没有保持零值。')
    for (const key of ['userAgent', 'platform', 'language', 'hardwareConcurrency', 'deviceMemory']) assert.equal(first.navigator[key], first.worker[key], `页面与工作线程的 ${key} 不一致。`)
    assert.equal(first.navigator.userAgent, first.headers.userAgent, '页面与请求用户代理不一致。')
    if (profile) {
      assert.equal(first.navigator.deviceMemory, profile.hardware.deviceMemory, '网页内存与环境配置不一致。')
      assert.equal(first.navigator.hardwareConcurrency, profile.hardware.hardwareConcurrency, '网页并发度与环境配置不一致。')
      assert.equal(first.navigator.language, profile.locale.language, '网页语言与环境配置不一致。')
      assert.ok(first.headers.acceptLanguage.startsWith(profile.locale.language), '请求语言与环境配置不一致。')
      assert.equal(first.timezone, profile.locale.timezone, '网页时区与环境配置不一致。')
      assert.equal(first.screen.cssWidth && first.screen.cssHeight, true, '网页屏幕与 CSS 设备尺寸不一致。')
    }
    const before = await window.webContents.executeJavaScript("localStorage.getItem('environment-marker')")
    assert.equal(before, null, '新环境复用了其他环境的本地存储。')
    const emptyStores = { localStorage: null, indexedDB: null, cacheStorage: null }
    assert.deepEqual(await window.webContents.executeJavaScript(`(${collectStorageSignals.toString()})()`), emptyStores, '新环境复用了其他环境的存储标识。')
    first.storage = await window.webContents.executeJavaScript(`(${collectStorageSignals.toString()})(${JSON.stringify(`environment-${index}`)})`)
    for (const value of Object.values(first.storage)) assert.equal(value, `environment-${index}`, '第一方存储写入未成功，隔离对照无效。')
    await window.webContents.executeJavaScript(`localStorage.setItem('environment-marker', ${JSON.stringify(`environment-${index}`)})`)
    await profileSession.cookies.set({ url: siteA, name: 'environment-marker', value: `environment-${index}`, expirationDate: Math.floor(Date.now() / 1000) + 3600 })
    const trackerA = await thirdPartyStorage(window.webContents, trackerOrigin, `environment-${index}`)
    await window.loadURL(`${siteB}/`)
    const second = await window.webContents.executeJavaScript(`(${collectFingerprintSignals.toString()})()`)
    second.storage = await window.webContents.executeJavaScript(`(${collectStorageSignals.toString()})()`)
    assert.deepEqual(second.storage, emptyStores, '不同第一方站点共享了存储标识。')
    const trackerB = await thirdPartyStorage(window.webContents, trackerOrigin)
    if (trackerA.allowed && trackerB.allowed && trackerA.marker === trackerB.marker) report.gaps.push(`环境 ${index} 的第三方存储跨站共享。`)
    for (const key of ['indexedDB', 'cacheStorage']) {
      if (trackerA.allowed && trackerB.allowed && trackerA.stores[key] !== null && trackerA.stores[key] === trackerB.stores[key]) report.gaps.push(`环境 ${index} 的第三方 ${key} 跨站共享。`)
    }
    if (profile && first.canvas.hashes[0] === second.canvas.hashes[0]) report.gaps.push(`环境 ${index} 的受保护画布在两个站点输出相同。`)
    if (profile && !first.audio.silent && first.audio.min === first.audio.max) report.gaps.push(`环境 ${index} 的静音音频暴露了固定偏移。`)
    report.samples.push({ environment: index, configuration: profile ? { ...profile, noise: { ...profile.noise, seed: '已隐藏' } } : null, protection: profile ? describeFingerprintProtection(profile) : null, first, second, trackerA, trackerB })
    await record()
  }
  for (const [index, profileSession] of sessions.entries()) {
    const cookies = await profileSession.cookies.get({ url: siteA, name: 'environment-marker' })
    assert.deepEqual(cookies.map(cookie => cookie.value), [`environment-${index}`], '环境间 Cookie 标识发生污染。')
  }
  assert.notEqual(report.samples[1].first.canvas.hashes[0], report.samples[2].first.canvas.hashes[0], '不同环境的画布保护没有产生不同结果。')
  const restored = createWindow(sessions[1])
  await restored.loadURL(`${siteA}/`)
  assert.equal(await restored.webContents.executeJavaScript("localStorage.getItem('environment-marker')"), 'environment-1', '同一会话新页面没有恢复存储。')
  const restoredSignals = await restored.webContents.executeJavaScript(`(${collectFingerprintSignals.toString()})()`)
  assert.equal(restoredSignals.canvas.hashes[0], report.samples[1].first.canvas.hashes[0], '同站页面重开后的画布结果变化。')
  assert.deepEqual(await restored.webContents.executeJavaScript(`(${collectStorageSignals.toString()})()`), report.samples[1].first.storage, '同一会话新页面没有恢复三类存储。')
  report.checks.push('三环境 Cookie/本地存储隔离、同会话页面重开、页面/工作线程一致性与读回语义通过。')
  if (report.samples.every(sample => sample.trackerA.allowed && sample.trackerA.marker === `environment-${sample.environment}` && sample.trackerB.allowed && sample.trackerB.marker === null)) report.checks.push('本地测试中，共同第三方的本地存储按顶级站点分区。')
  else report.unverified.push('第三方存储分区未满足完整可读写对照，需检查对应样本。')
  report.checks.push('三环境与第一方双站 IndexedDB/缓存存储隔离、同会话页面恢复通过。')
  if (report.samples.every(sample => sample.trackerA.allowed && sample.trackerB.allowed && Object.values(sample.trackerA.stores).every(value => value === `environment-${sample.environment}`) && Object.values(sample.trackerB.stores).every(value => value === null))) report.checks.push('共同第三方的本地存储、IndexedDB 和缓存存储按顶级站点分区。')
  else report.unverified.push('第三方 IndexedDB/缓存存储未形成完整可读写分区对照。')

  stun = dgram.createSocket('udp4')
  let stunRequests = 0
  stun.on('message', (message, remote) => {
    if (message.length < 20 || message.readUInt16BE(0) !== 1 || message.readUInt32BE(4) !== 0x2112a442) return
    stunRequests++
    const reply = Buffer.alloc(32)
    reply.writeUInt16BE(0x0101, 0)
    reply.writeUInt16BE(12, 2)
    message.copy(reply, 4, 4, 20)
    reply.writeUInt16BE(0x0020, 20)
    reply.writeUInt16BE(8, 22)
    reply[25] = 1
    reply.writeUInt16BE(remote.port ^ 0x2112, 26)
    remote.address.split('.').forEach((value, index) => { reply[28 + index] = Number(value) ^ message[4 + index] })
    stun.send(reply, remote.port, remote.address)
  })
  // WebRTC 不使用回环网卡收集候选，测试端点绑定本机非回环地址，并用实际请求确认可达。
  const addresses = Object.values(os.networkInterfaces()).flat().filter(item => item.family === 'IPv4' && !item.internal).map(item => item.address)
  const stunAddress = addresses.find(address => address.startsWith('192.168.')) || addresses[0] || '127.0.0.1'
  await new Promise((resolve, reject) => { stun.once('error', reject); stun.bind(0, stunAddress, resolve) })
  const stunUrl = `stun:${stunAddress}:${stun.address().port}`
  const control = await restored.webContents.executeJavaScript(`(${collectWebRTCProbe.toString()})(${JSON.stringify(stunUrl)})`)
  const controlRequests = stunRequests
  const protectedWindow = createWindow(sessions[2])
  await protectedWindow.loadURL(`${siteA}/`)
  const protectedProbe = await protectedWindow.webContents.executeJavaScript(`(${collectWebRTCProbe.toString()})(${JSON.stringify(stunUrl)})`)
  const protectedRequests = stunRequests - controlRequests
  report.webrtc = { control, controlRequests, protected: protectedProbe, protectedRequests, validControl: controlRequests > 0 }
  if (controlRequests > 0 && protectedProbe.supported && protectedProbe.completed) {
    assert.equal(protectedRequests, 0, '启用保护的环境仍向本地 STUN 发送非代理 UDP。')
    report.checks.push('可达本地 STUN 的对照有实际请求，保护环境未发送非代理 UDP。')
  } else report.unverified.push('本地 STUN 对照或保护采集未完成，不能认定限制已通过。')

  const proxyHits = []
  const proxy = http.createServer((request, response) => {
    const target = new URL(request.url)
    if (![siteA, siteB].includes(target.origin)) { response.writeHead(403); response.end('代理测试目标无效。'); return }
    proxyHits.push(target.pathname)
    const headers = { ...request.headers, 'x-fp-test-proxy': '1' }
    delete headers['proxy-authorization']
    const upstream = http.request({ hostname: '127.0.0.1', port, path: `${target.pathname}${target.search}`, method: request.method, headers }, incoming => { response.writeHead(incoming.statusCode, incoming.headers); incoming.pipe(response) })
    upstream.on('error', () => { response.writeHead(502); response.end('测试代理无法连接目标。') })
    request.pipe(upstream)
  })
  const proxyPort = await listen(proxy)
  const proxySession = session.fromPath(path.join(output, 'data', 'proxy-environment'))
  await applyProxyConfig(proxySession, { mode: 'http', server: `http://127.0.0.1:${proxyPort}`, username: '', password: '' }, `${siteA}/proxy-before`)
  const proxyWindow = createWindow(proxySession)
  await proxyWindow.loadURL(`${siteA}/proxy-before`)
  assert.ok(proxyHits.includes('/proxy-before'), '代理环境没有经测试代理加载目标。')
  assert.equal(originRequests.find(request => request.pathname === '/proxy-before')?.throughProxy, true, '代理目标出现直连。')
  proxy.closeAllConnections()
  await new Promise(resolve => proxy.close(resolve))
  await proxySession.closeAllConnections()
  let failed = false
  try { await proxyWindow.loadURL(`${siteA}/proxy-after`) } catch { failed = true }
  assert.equal(failed, true, '代理中途失效后目标仍被加载。')
  assert.equal(originRequests.filter(request => request.pathname === '/proxy-after').length, 0, '代理失效后发生目标直连。')
  report.proxy = { initialRequests: proxyHits, failureBlocked: failed, directRequestsAfterFailure: 0, loopbackBypassRemoved: true }
  report.checks.push('回环目标经指定代理加载，代理中途失效后未回退直连。')
  await verifyHTTPSNetwork({ output, sessions, createWindow, listen, report })
  report.ok = true
  await record()
  console.log(`指纹基线验证完成：${report.checks.length} 组检查通过，${report.gaps.length} 项保护差距，${report.unverified.length} 类尚未验证。`)
}

void (async () => {
  let code = 0
  try {
    await run()
  } catch (error) {
    code = 1
    report.error = error instanceof assert.AssertionError ? error.message.split('\n')[0] : '指纹采集未完成，请检查本地测试端点和运行时。'
    await record()
    console.error(report.error)
  } finally {
    for (const window of windows) if (!window.isDestroyed()) window.destroy()
    stun?.close()
    for (const server of servers) { server.closeAllConnections(); server.close() }
    app.exit(code)
  }
})()
