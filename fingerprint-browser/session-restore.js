const { randomUUID } = require('node:crypto')
const fs = require('node:fs/promises')
const path = require('node:path')
const { ProfileValidationError } = require('./profile-store')

function validateSessionSnapshot (snapshot) {
  const fail = () => { throw new ProfileValidationError('云端会话格式或来源无效，恢复已阻止。') }
  if (!snapshot || snapshot.format !== 'desktop-session-v1' || Buffer.byteLength(JSON.stringify(snapshot)) > 262144 || !Array.isArray(snapshot.origins) || !snapshot.origins.length || snapshot.origins.length > 8 || !Array.isArray(snapshot.cookies) || snapshot.cookies.length > 1000) fail()
  const origins = snapshot.origins.map(value => { try { const url = new URL(value); if (url.protocol !== 'https:' || url.origin !== value) fail(); return url.origin } catch { return fail() } })
  if (snapshot.version !== undefined && !(typeof snapshot.version === 'string' && snapshot.version.length > 0 && snapshot.version.length <= 160 || Number.isSafeInteger(snapshot.version) && snapshot.version > 0)) fail()
  const cookies = snapshot.cookies.map(cookie => {
    if (!cookie || typeof cookie.name !== 'string' || !cookie.name || /[\x00-\x20\x7f=;,]/.test(cookie.name) || typeof cookie.value !== 'string' || /[\r\n\x00]/.test(cookie.value) || typeof cookie.domain !== 'string') fail()
    // 当前 Electron Cookie 写接口未声明分区键，不能将分区 Cookie 静默降级为普通 Cookie。
    if (cookie.partitionKey !== undefined && cookie.partitionKey !== null) fail()
    const domainCookie = cookie.domain.startsWith('.')
    const domain = cookie.domain.replace(/^\./, '').toLowerCase()
    const origin = origins.find(value => { const host = new URL(value).hostname; return host === domain || domainCookie && host.endsWith('.' + domain) })
    if (!origin || !domain.includes('.') && domain !== 'localhost' || cookie.path !== undefined && (typeof cookie.path !== 'string' || !cookie.path.startsWith('/')) || cookie.expirationDate !== undefined && !Number.isFinite(cookie.expirationDate)) fail()
    if (cookie.sameSite !== undefined && !['unspecified', 'no_restriction', 'lax', 'strict'].includes(cookie.sameSite)) fail()
    for (const key of ['secure', 'httpOnly', 'hostOnly']) if (cookie[key] !== undefined && typeof cookie[key] !== 'boolean') fail()
    const path = cookie.path || '/'
    // 兼容旧版采集将安全属性置为 false 的快照；只补足 Chromium 强制要求的属性，不扩大域或路径。
    const secure = cookie.secure === true || cookie.sameSite === 'no_restriction' || /^__(Secure|Host|Http)-/.test(cookie.name)
    const httpOnly = cookie.httpOnly === true || /^__(Http|Host-Http)-/.test(cookie.name)
    const result = { url: `https://${domain}${path}`, name: cookie.name, value: cookie.value, path, secure, httpOnly }
    // 与 desktop 保持一致：以前导点区分 Domain Cookie；无点时省略 domain 字段。
    if (domainCookie) result.domain = cookie.domain
    if (cookie.expirationDate !== undefined) result.expirationDate = cookie.expirationDate
    if (cookie.sameSite !== undefined) result.sameSite = cookie.sameSite
    return result
  })
  const storage = snapshot.storage || {}
  if (typeof storage !== 'object' || Array.isArray(storage) || Object.keys(storage).some(origin => !origins.includes(origin))) fail()
  for (const entries of Object.values(storage)) if (!entries || typeof entries !== 'object' || Array.isArray(entries) || Object.entries(entries).some(([key, value]) => key.length > 512 || typeof value !== 'string')) fail()
  return { format: snapshot.format, origins, cookies, storage, version: snapshot.version }
}

// 只在新打开的目标会话中恢复；平台规则与账号含义由密文生产方决定。
async function restoreSessionSnapshot (contents, snapshot, { dataDir } = {}) {
  const markerFile = dataDir && snapshot.version !== undefined ? path.join(dataDir, 'session-restore-version.json') : null
  let prior = null
  if (markerFile) {
    try { prior = JSON.parse(await fs.readFile(markerFile, 'utf8')) } catch {}
    if (prior?.version === snapshot.version && prior.complete === true) return { verify: async () => {}, cleanup: async () => {}, reused: true }
    if (typeof prior?.version === 'number' && typeof snapshot.version === 'number' && snapshot.version < prior.version) {
      // 本机版本较新，静默保留本机登录状态，直接打开页面，绝不抛错阻断
      return { verify: async () => {}, cleanup: async () => {}, reused: true }
    }
  }
  let persistPromise
  const persist = () => {
    // 加载事件与打开账号流程可能同时校验；同一版本只写一次，避免 Windows 并发替换文件失败。
    if (!persistPromise) persistPromise = persistVersion()
    return persistPromise
  }
  const persistVersion = async () => {
    if (!markerFile) return
    const temporary = markerFile + '.' + randomUUID() + '.tmp'
    await fs.writeFile(temporary, JSON.stringify({ version: snapshot.version, complete: true }), { encoding: 'utf8', mode: 0o600 })
    await fs.rename(temporary, markerFile)
  }
  const logCookieFailure = (message, error, index) => {
    // 只记录位置与内核拒绝代码，不输出 Cookie 值或原始错误对象。
    const reasons = String(error?.message || '').match(/\bEXCLUDE_[A-Z_]+\b/g) || []
    try { console.warn(message, { index, reasons: [...new Set(reasons)] }) } catch { /* 保留失败事实，不输出任何 Cookie 值。 */ }
  }
  // 与 desktop 一致逐条尽力恢复；单条失败不撤销已写入项，也不阻止后续 Cookie 与账号页面打开。
  for (const [index, cookie] of snapshot.cookies.entries()) {
    try { await contents.session.cookies.set(cookie) } catch (error) { logCookieFailure('[会话恢复] Cookie 写入失败，已跳过并继续。', error, index) }
  }
  try { await contents.session.cookies.flushStore() } catch (error) { logCookieFailure('[会话恢复] Cookie 持久化未完成，继续打开账号。', error) }
  const pending = new Set(Object.keys(snapshot.storage || {}))
  if (!pending.size) return { verify: persist, cleanup: async () => {} }
  // 新建 WebContents 尚无渲染目标时先初始化空白文档，不向平台发送未恢复的请求。
  if (!contents.getURL()) await contents.loadURL('about:blank')
  const marker = '__desktop_restore_' + randomUUID().replaceAll('-', '')
  const attached = !contents.debugger.isAttached(); let identifier; let stopped = false
  if (attached) {
    try { contents.debugger.attach('1.3') } catch {}
  }
  const cleanup = async () => {
    if (stopped) return; stopped = true
    contents.removeListener('did-frame-finish-load', onLoad)
    try { if (identifier && !contents.isDestroyed()) await contents.debugger.sendCommand('Page.removeScriptToEvaluateOnNewDocument', { identifier }) } catch {}
    if (attached && !contents.isDestroyed() && contents.debugger.isAttached()) {
      try { contents.debugger.detach() } catch {}
    }
  }
  const verify = async () => {
    if (contents.isDestroyed()) return
    try {
      for (const frame of contents.mainFrame?.framesInSubtree || []) {
        let origin; try { origin = new URL(frame.url).origin } catch { continue }
        if (!pending.has(origin)) continue
        const restored = await frame.executeJavaScript(`localStorage.getItem(${JSON.stringify(marker)}) === 'done'`).catch(() => false)
        if (restored) pending.delete(origin)
      }
      if (!pending.size) {
        try { contents.session.flushStorageData() } catch {}
        await persist()
        await cleanup()
      }
    } catch (err) {
      console.warn('[会话恢复] 校验跳过:', err.message)
    }
  }
  const onLoad = () => { void verify().catch(() => {}) }
  contents.on('did-frame-finish-load', onLoad); contents.once('destroyed', () => { void cleanup() })
  try {
    await contents.debugger.sendCommand('Page.enable')
    const source = `(() => { const data=${JSON.stringify(snapshot.storage)}; const values=data[location.origin]; if(!values || localStorage.getItem(${JSON.stringify(marker)})==='done')return; for(const [key,value] of Object.entries(values))localStorage.setItem(key,value); localStorage.setItem(${JSON.stringify(marker)},'done'); })()`
    identifier = (await contents.debugger.sendCommand('Page.addScriptToEvaluateOnNewDocument', { source, worldName: 'desktop-session-restore' })).identifier
    return { verify, cleanup }
  } catch (err) {
    await cleanup()
    console.warn('[会话恢复] 无法准备页面存储恢复，已跳过存储恢复保持页面可用:', err.message)
    return { verify: async () => {}, cleanup: async () => {} }
  }
}
module.exports = { validateSessionSnapshot, restoreSessionSnapshot }
