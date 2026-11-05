const crypto = require('node:crypto')
const fs = require('node:fs/promises')
const path = require('node:path')
const { ProfileValidationError } = require('./profile-store')

// 仅供受信任能力包调用，网页桥接不返回明文 Cookie 或可执行的请求函数。
async function readAccountSession (contents, origins, storage = {}) {
  if (contents.isDestroyed()) throw new Error('授权页面已关闭，请重新打开。')
  await contents.session.cookies.flushStore()
  const domains = origins.map(origin => new URL(origin).hostname)
  const cookies = (await contents.session.cookies.get({})).filter(cookie => typeof cookie.domain === 'string' && domains.some(host => host === cookie.domain.replace(/^\./, '') || host.endsWith('.' + cookie.domain.replace(/^\./, ''))))
  return {
    cookies, storage,
    request: async ({ url, headers, signal }) => {
      if (contents.isDestroyed() || !origins.includes(new URL(url).origin)) throw new Error('账号信息请求来源无效。')
      // 使用授权标签的 Session 发请求，保留代理出口和平台写入的新 Cookie。
      const response = await contents.session.fetch(url, { method: 'GET', headers, signal, redirect: 'manual' })
      if (response.status >= 300 && response.status < 400) return { url: new URL(response.headers.get('location') || url, url).href, status: response.status, body: '' }
      if (Number(response.headers.get('content-length')) > 2 * 1024 * 1024) throw new Error('账号信息响应过大。')
      const reader = response.body?.getReader(); const decoder = new TextDecoder(); let body = ''; let size = 0
      if (reader) {
        try {
          while (true) {
            const chunk = await reader.read()
            if (chunk.done) break
            size += chunk.value.byteLength
            if (size > 2 * 1024 * 1024) throw new Error('账号信息响应过大。')
            body += decoder.decode(chunk.value, { stream: true })
          }
          body += decoder.decode()
        } finally { await reader.cancel().catch(() => {}) }
      }
      if (contents.isDestroyed()) throw new Error('授权页面已关闭，请重新打开。')
      return { url: response.url || url, status: response.status, body }
    }
  }
}

// 仅提供通用观察与加密采集能力，平台规则由客户端加载的独立能力包提供。
class SessionObserver {
  constructor (browser, { logger = null } = {}) { this.browser = browser; this.jobs = new Map(); this.logger = logger }
  log (level, message, details) {
    // 默认通过桥接读取 diagnostics，不向可能已关闭的启动管道写日志。
    // 外部日志故障不能打断响应解析；日志器自身负责其输出流的异步错误。
    try { Promise.resolve(this.logger?.[level]?.(message, details)).catch(() => {}) } catch {}
  }
  async open (owner, input) {
    if (!input || typeof input.operationId !== 'string' || !input.operationId || input.operationId.length > 160 || owner.isDestroyed()) throw new ProfileValidationError('会话观察任务参数无效。')
    if (this.jobs.size >= 32) throw new ProfileValidationError('正在进行的会话观察过多。')
    const tab = this.browser.getTab(input.tabId)
    if (!tab?.view || tab.kind !== 'managed') throw new ProfileValidationError('请选择独立环境中的标签。')
    if (!Array.isArray(input.origins) || !input.origins.length || input.origins.length > 8) throw new ProfileValidationError('会话来源配置无效。')
    const origins = input.origins.map(value => { const url = new URL(value); if (url.protocol !== 'https:' || url.origin !== value) throw new ProfileValidationError('会话来源必须为完整的安全网页来源。'); return value })
    const paths = input.paths || []
    if (!Array.isArray(paths) || paths.length > 8 || paths.some(value => typeof value !== 'string' || !value.startsWith('/') || value.length > 512)) throw new ProfileValidationError('网络观察路径配置无效。')
    const documentPaths = input.documentPaths || []
    if (input.metadataOnly !== undefined && typeof input.metadataOnly !== 'boolean') throw new ProfileValidationError('网络观察模式无效。')
    if (!Array.isArray(documentPaths) || documentPaths.length > 8 || documentPaths.some(value => typeof value !== 'string' || !value.startsWith('/') || value.length > 512 || value.includes('?'))) throw new ProfileValidationError('文档观察路径配置无效。')
    const storageKeys = input.storageKeys || []
    if (!Array.isArray(storageKeys) || storageKeys.length > 64 || storageKeys.some(key => typeof key !== 'string' || key.length > 256)) throw new ProfileValidationError('会话存储字段配置无效。')
    const contents = tab.view.webContents
    if ([...this.jobs.values()].some(job => job.contents === contents)) throw new ProfileValidationError('此环境标签已有会话观察任务。')
    const key = crypto.createPublicKey(input.publicKey)
    if (key.asymmetricKeyType !== 'rsa' || key.asymmetricKeyDetails.modulusLength < 2048) throw new ProfileValidationError('授权加密公钥无效。')
    const id = crypto.randomUUID(); const job = { id, owner, contents, origins, paths, storageKeys, publicKey: input.publicKey, operationId: input.operationId, responses: [], pending: new Map(), cursor: 0, diagnostics: { matchedResponses: 0, parsedResponses: 0, failedResponses: 0, lastType: null, lastStatus: null } }
    job.attached = !contents.debugger.isAttached()
    job.dataDir = tab.dataDir
    if (job.attached) contents.debugger.attach('1.3')
    job.listener = async (_event, method, data) => {
      try {
        if (this.jobs.get(id) !== job) return
        if (method === 'Network.responseReceived' && origins.includes(new URL(data.response.url).origin) && ((documentPaths.includes(new URL(data.response.url).pathname) && ['Document', 'XHR', 'Fetch', 'Other'].includes(data.type)) || ((!paths.length || paths.some(value => new URL(data.response.url).pathname.includes(value))) && ['XHR', 'Fetch', 'Other'].includes(data.type)))) {
          Object.assign(job.diagnostics, { matchedResponses: job.diagnostics.matchedResponses + 1, lastType: data.type, lastStatus: data.response.status })
          this.log('info', '[会话观察] 已匹配授权响应', { operationId: job.operationId, ...job.diagnostics })
          if (input.metadataOnly) {
            job.responses.push({ url: data.response.url, status: data.response.status, body: null, cursor: ++job.cursor })
            if (job.responses.length > 24) job.responses.shift()
            return
          }
          if (job.pending.size < 128) job.pending.set(data.requestId, { url: data.response.url, status: data.response.status })
        }
        if (method === 'Network.loadingFailed') job.pending.delete(data.requestId)
        if (method === 'Network.loadingFinished' && job.pending.has(data.requestId)) {
          const response = job.pending.get(data.requestId); job.pending.delete(data.requestId)
          const textResponse = documentPaths.includes(new URL(response.url).pathname)
          const limit = textResponse ? 2 * 1024 * 1024 : 262144
          if (data.encodedDataLength > limit) { job.diagnostics.failedResponses++; this.log('warn', '[会话观察] 匹配响应超过采集大小限制', { operationId: job.operationId, ...job.diagnostics }); return }
          const result = await contents.debugger.sendCommand('Network.getResponseBody', { requestId: data.requestId })
          if (result.body.length > Math.ceil(limit * 4 / 3)) return
          const raw = result.base64Encoded ? Buffer.from(result.body, 'base64').toString('utf8') : result.body
          if (Buffer.byteLength(raw, 'utf8') > limit) return
          let body
          try { body = JSON.parse(raw) } catch (error) { if (!textResponse) throw error; body = raw }
          if (this.jobs.get(id) !== job) return
          job.diagnostics.parsedResponses++
          this.log('info', '[会话观察] 已解析授权响应', { operationId: job.operationId, ...job.diagnostics })
          job.responses.push({ ...response, body, cursor: ++job.cursor }); if (job.responses.length > 24) job.responses.shift()
        }
      } catch { /* 非 JSON 响应及已销毁页面无需作为授权结果。 */
        if (this.jobs.get(id) === job && method === 'Network.loadingFinished') { job.diagnostics.failedResponses++; this.log('warn', '[会话观察] 授权响应解析未完成', { operationId: job.operationId, ...job.diagnostics }) }
      }
    }
    contents.debugger.on('message', job.listener)
    this.jobs.set(id, job)
    const cleanup = () => { void this.close(owner, id).catch(() => {}) }
    contents.once('destroyed', cleanup); owner.once('destroyed', cleanup)
    job.ownerNavigation = (_event, _url, isInPlace, isMainFrame) => { if (isMainFrame && !isInPlace) cleanup() }
    if (!input.persistAcrossNavigation) owner.on('did-start-navigation', job.ownerNavigation)
    job.cleanup = cleanup
    job.timer = setTimeout(cleanup, 15 * 60 * 1000); job.timer.unref()
    try { await contents.debugger.sendCommand('Network.enable', { maxResourceBufferSize: documentPaths.length ? 2 * 1024 * 1024 : 262144 }); this.get(owner, id); return { id } } catch (error) { await this.close(owner, id); throw error }
  }
  get (owner, id) {
    const job = this.jobs.get(id)
    if (!job || job.owner !== owner || owner.isDestroyed() || job.contents.isDestroyed() || !job.contents.debugger.isAttached()) throw new ProfileValidationError('授权观察已结束，请重新开始。')
    return job
  }
  async read (owner, input) {
    const job = this.get(owner, input.id)
    const storage = {}
    for (const frame of job.contents.mainFrame.framesInSubtree) {
      let origin; try { origin = new URL(frame.url).origin } catch { continue }
      if (!job.origins.includes(origin)) continue
      try { const values = await frame.executeJavaScript(`location.origin === ${JSON.stringify(origin)} ? Object.fromEntries(${JSON.stringify(job.storageKeys)}.filter(key => localStorage.getItem(key) !== null).map(key => [key, localStorage.getItem(key)])) : {}`); storage[origin] = { ...storage[origin], ...values } } catch {}
    }
    this.get(owner, input.id)
    job.storage = storage
    return { responses: job.responses.filter(item => item.cursor > (input.cursor || 0)), cursor: job.cursor, diagnostics: { ...job.diagnostics }, storageKeys: Object.fromEntries(Object.entries(storage).map(([origin, values]) => [origin, Object.keys(values)])) }
  }
  async capture (owner, input, authorization = null) {
    const job = this.get(owner, input.id)
    // 等待授权页面及其资源结束加载，超时或取消时不上传未完成的会话；已完成 Cookie 账号核验的链路不等待无关页面资源。
    const deadline = Date.now() + 30000
    while (!authorization?.platform?.accountInfo && job.contents.isLoading()) {
      if (Date.now() >= deadline) throw new ProfileValidationError('授权页面加载超时，请等待页面加载完成后重新采集。')
      await new Promise(resolve => setTimeout(resolve, 100))
      this.get(owner, input.id)
    }
    await this.read(owner, input)
    await job.contents.session.cookies.flushStore()
    this.get(owner, input.id)
    const domains = job.origins.map(origin => new URL(origin).hostname)
    const cookies = (await job.contents.session.cookies.get({})).filter(cookie => typeof cookie.domain === 'string' && domains.some(host => host === cookie.domain.replace(/^\./, '') || host.endsWith('.' + cookie.domain.replace(/^\./, ''))))
    this.get(owner, input.id)
    const snapshot = { operationId: job.operationId, cookies, storage: job.storage }
    if (authorization) {
      const invalid = input.outcome === 'invalid' && authorization.mode === 'check' && authorization.expectedUserId
      if (!invalid && !input.identity?.platformUserId) throw new ProfileValidationError('尚未取得平台真实身份，请等待登录完成。')
      Object.assign(snapshot, { identity: invalid ? { platformUserId: authorization.expectedUserId } : input.identity, outcome: invalid ? 'invalid' : 'valid', platform: authorization.platform, packageVersion: authorization.packageVersion })
    }
    const payload = Buffer.from(JSON.stringify(snapshot))
    if (payload.length > 160000) throw new ProfileValidationError('授权数据过大，请使用独立环境重新登录。')
    // 保存本机采集操作标识，后续打开账号时可复用本机登录态，避免重复恢复云端会话。
    if (job.dataDir && snapshot.outcome === 'valid') await fs.writeFile(path.join(job.dataDir, 'local-session-capture.json'), JSON.stringify({ operationId: job.operationId }), { encoding: 'utf8', mode: 0o600 })
    const key = crypto.randomBytes(32); const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
    cipher.setAAD(Buffer.from(job.operationId))
    return { wrappedKey: crypto.publicEncrypt({ key: job.publicKey, oaepHash: 'sha256' }, key).toString('base64'), iv: iv.toString('base64'), ciphertext: Buffer.concat([cipher.update(payload), cipher.final()]).toString('base64'), ...{ tag: cipher.getAuthTag().toString('base64') } }
  }
  async accountSession (owner, input) {
    const job = this.get(owner, input.id)
    await this.read(owner, input)
    const data = await readAccountSession(job.contents, job.origins, job.storage)
    this.get(owner, input.id)
    return data
  }
  async close (owner, id) {
    const job = this.jobs.get(id); if (!job || job.owner !== owner) return
    this.jobs.delete(id); clearTimeout(job.timer)
    owner.removeListener('destroyed', job.cleanup)
    owner.removeListener('did-start-navigation', job.ownerNavigation)
    job.pending.clear(); job.responses.length = 0; job.storage = null
    if (!job.contents.isDestroyed()) {
      job.contents.removeListener('destroyed', job.cleanup)
      const debuggerApi = job.contents.debugger
      debuggerApi.removeListener('message', job.listener)
      if (job.attached && debuggerApi.isAttached() && !debuggerApi.listenerCount('message')) debuggerApi.detach()
    }
  }
}
module.exports = { SessionObserver, readAccountSession }
