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
    const domain = cookie.domain.replace(/^\./, '').toLowerCase()
    const origin = origins.find(value => { const host = new URL(value).hostname; return host === domain || cookie.hostOnly !== true && host.endsWith('.' + domain) })
    if (!origin || !domain.includes('.') && domain !== 'localhost' || cookie.path !== undefined && (typeof cookie.path !== 'string' || !cookie.path.startsWith('/')) || cookie.expirationDate !== undefined && !Number.isFinite(cookie.expirationDate)) fail()
    if (cookie.sameSite !== undefined && !['unspecified', 'no_restriction', 'lax', 'strict'].includes(cookie.sameSite)) fail()
    for (const key of ['secure', 'httpOnly', 'hostOnly']) if (cookie[key] !== undefined && typeof cookie[key] !== 'boolean') fail()
    const path = cookie.path || '/'
    const result = { url: `https://${domain}${path}`, name: cookie.name, value: cookie.value, path, secure: cookie.secure === true, httpOnly: cookie.httpOnly === true }
    if (cookie.hostOnly !== true) result.domain = cookie.domain
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
    try { prior = JSON.parse(await fs.readFile(markerFile, 'utf8')) } catch (error) { if (error.code !== 'ENOENT') throw new ProfileValidationError('本机会话版本记录无法读取，已阻止覆盖。') }
    if (prior?.version === snapshot.version && prior.complete === true) return { verify: async () => {}, cleanup: async () => {}, reused: true }
    if (typeof prior?.version === 'number' && typeof snapshot.version === 'number' && snapshot.version < prior.version) throw new ProfileValidationError('云端会话版本较旧，已保留本机登录状态。')
  }
  const persist = async () => {
    if (!markerFile) return
    const temporary = markerFile + '.' + randomUUID() + '.tmp'
    await fs.writeFile(temporary, JSON.stringify({ version: snapshot.version, complete: true }), { encoding: 'utf8', mode: 0o600 })
    await fs.rename(temporary, markerFile)
  }
  const previous = await contents.session.cookies.get({})
  try {
    for (const cookie of snapshot.cookies) await contents.session.cookies.set(cookie)
    await contents.session.cookies.flushStore()
  } catch {
    for (const cookie of snapshot.cookies) {
      try {
        await contents.session.cookies.remove(cookie.url, cookie.name)
        const prior = previous.find(item => item.name === cookie.name && item.domain.replace(/^\./, '') === new URL(cookie.url).hostname && item.path === cookie.path)
        if (prior) await contents.session.cookies.set(validateSessionSnapshot({ format: 'desktop-session-v1', origins: snapshot.origins, cookies: [prior] }).cookies[0])
      } catch { /* 保留失败事实，不输出任何 Cookie 值。 */ }
    }
    throw new ProfileValidationError('云端 Cookie 未能完整恢复，请关闭环境后重试。')
  }
  const pending = new Set(Object.keys(snapshot.storage))
  if (!pending.size) return { verify: persist, cleanup: async () => {} }
  // 新建 WebContents 尚无渲染目标时先初始化空白文档，不向平台发送未恢复的请求。
  if (!contents.getURL()) await contents.loadURL('about:blank')
  const marker = '__desktop_restore_' + randomUUID().replaceAll('-', '')
  const attached = !contents.debugger.isAttached(); let identifier; let stopped = false
  if (attached) contents.debugger.attach('1.3')
  const cleanup = async () => {
    if (stopped) return; stopped = true
    contents.removeListener('did-frame-finish-load', onLoad)
    try { if (identifier && !contents.isDestroyed()) await contents.debugger.sendCommand('Page.removeScriptToEvaluateOnNewDocument', { identifier }) } catch {}
    if (attached && !contents.isDestroyed() && contents.debugger.isAttached()) contents.debugger.detach()
  }
  const verify = async () => {
    if (contents.isDestroyed()) throw new ProfileValidationError('环境已关闭，会话恢复未完成。')
    for (const frame of contents.mainFrame.framesInSubtree) {
      let origin; try { origin = new URL(frame.url).origin } catch { continue }
      if (!pending.has(origin)) continue
      const restored = await frame.executeJavaScript(`localStorage.getItem(${JSON.stringify(marker)}) === 'done'`)
      if (!restored) throw new ProfileValidationError('云端页面存储未能恢复，请关闭环境后重试。')
      pending.delete(origin)
    }
    if (!pending.size) { contents.session.flushStorageData(); await persist(); await cleanup() }
  }
  const onLoad = () => { void verify().catch(() => {}) }
  contents.on('did-frame-finish-load', onLoad); contents.once('destroyed', () => { void cleanup() })
  try {
    await contents.debugger.sendCommand('Page.enable')
    const source = `(() => { const data=${JSON.stringify(snapshot.storage)}; const values=data[location.origin]; if(!values || localStorage.getItem(${JSON.stringify(marker)})==='done')return; for(const [key,value] of Object.entries(values))localStorage.setItem(key,value); localStorage.setItem(${JSON.stringify(marker)},'done'); })()`
    identifier = (await contents.debugger.sendCommand('Page.addScriptToEvaluateOnNewDocument', { source, worldName: 'desktop-session-restore' })).identifier
    return { verify, cleanup }
  } catch { await cleanup(); throw new ProfileValidationError('无法准备页面存储恢复，请关闭环境后重试。') }
}
module.exports = { validateSessionSnapshot, restoreSessionSnapshot }
