const fs = require('node:fs/promises')
const path = require('node:path')
const crypto = require('node:crypto')
const vm = require('node:vm')
const { ProfileValidationError } = require('./profile-store')
const { readAccountSession } = require('./session-observer')

// 仅加载部署者指定的本地发布目录；网页不能提供脚本路径或执行代码。
class PlatformRuntime {
  constructor (directory) { this.directory = directory; this.jobs = new Map() }
  async load () {
    if (!this.directory || !path.isAbsolute(this.directory)) throw new ProfileValidationError('客户端尚未配置平台能力包，请联系管理员。')
    const directory = await fs.realpath(this.directory)
    const manifest = JSON.parse(await fs.readFile(path.join(directory, 'manifest.json'), 'utf8'))
    if (manifest.bridgeVersion !== 2 || !/^authorization-\d+\.\d+\.\d+-[a-f0-9]{12}\.js$/.test(manifest.file) || !/^[a-f0-9]{64}$/.test(manifest.sha256)) throw new ProfileValidationError('平台能力包清单无效，请重新发布。')
    const file = await fs.realpath(path.join(directory, manifest.file))
    if (path.dirname(file) !== directory || (await fs.stat(file)).size > 4 * 1024 * 1024) throw new ProfileValidationError('平台能力包文件无效。')
    const bytes = await fs.readFile(file)
    if (crypto.createHash('sha256').update(bytes).digest('hex') !== manifest.sha256) throw new ProfileValidationError('平台能力包完整性校验失败。')
    // VM 用于隔离模块变量；代码信任来自部署者控制的本地目录，不把 VM 当作安全沙箱。
    const module = { exports: {} }
    const context = vm.createContext({ module, exports: module.exports, window: {}, URL, setTimeout, clearTimeout, fetch, AbortSignal, TextDecoder }, { codeGeneration: { strings: false, wasm: false } })
    new vm.Script(bytes.toString('utf8'), { filename: manifest.file }).runInContext(context, { timeout: 1000 })
    const runtime = context.window.MediaPlatform || module.exports
    if (!runtime || typeof runtime.run !== 'function') throw new ProfileValidationError('平台能力包接口或版本不兼容。')
    const rpaEntry = manifest.rpa
    if (!rpaEntry || !/^\d+\.\d+\.\d+$/.test(rpaEntry.version) || !/^rpa-\d+\.\d+\.\d+-[a-f0-9]{12}\.js$/.test(rpaEntry.file) || !/^[a-f0-9]{64}$/.test(rpaEntry.sha256)) throw new ProfileValidationError('RPA 能力清单无效。')
    const rpaFile = await fs.realpath(path.join(directory, rpaEntry.file))
    if (path.dirname(rpaFile) !== directory || (await fs.stat(rpaFile)).size > 4 * 1024 * 1024) throw new ProfileValidationError('RPA 能力文件无效。')
    const rpaBytes = await fs.readFile(rpaFile)
    if (crypto.createHash('sha256').update(rpaBytes).digest('hex') !== rpaEntry.sha256) throw new ProfileValidationError('RPA 能力完整性校验失败。')
    const rpaModule = { exports: {} }
    const rpaContext = vm.createContext({ module: rpaModule, exports: rpaModule.exports, window: {} }, { codeGeneration: { strings: false, wasm: false } })
    new vm.Script(rpaBytes.toString('utf8'), { filename: rpaEntry.file }).runInContext(rpaContext, { timeout: 1000 })
    const rpa = rpaContext.window.MediaRpa || rpaModule.exports
    if (!rpa || typeof rpa.identity !== 'function' || !Array.isArray(runtime.catalog)) throw new ProfileValidationError('平台或 RPA 能力接口不兼容。')
    return { runtime: { ...runtime, version: manifest.version }, rpa: { ...rpa, version: rpaEntry.version }, manifest }
  }
  async start (owner, input, desktop) {
    const ownerUrl = owner.getURL()
    const { runtime, rpa, manifest } = await this.load()
    const request = input?.task
    if (!request || typeof request.id !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(request.id) || !input.tabId) throw new ProfileValidationError('平台授权任务无效。')
    if (!['authorize', 'reauthorize', 'check'].includes(request.mode)) throw new ProfileValidationError('平台授权类型无效。')
    if (request.expectedUserId !== undefined && (typeof request.expectedUserId !== 'string' || request.expectedUserId.length > 256)) throw new ProfileValidationError('原账号身份无效。')
    const platform = runtime.catalog.find(item => item.key === request.platformKey)
    if (!platform) throw new ProfileValidationError('客户端能力包不支持此平台。')
    if (typeof input.tabId !== 'string' || !input.tabId) throw new ProfileValidationError('授权环境标签无效。')
    if (this.jobs.size >= 32) throw new ProfileValidationError('平台任务较多，请稍后重试。')
    const keys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } })
    const task = { id: request.id, expiresAt: Date.now() + 15 * 60000, publicKey: keys.publicKey, mode: request.mode, platform }
    desktop.authorizeCapture = { platform, tabId: input.tabId, packageVersion: manifest.version, mode: request.mode, expectedUserId: request.expectedUserId || '' }
    if (typeof runtime.getAccountInfo === 'function' && desktop.readAccountSession) {
      desktop.getAccountInfo = async ({ id }) => {
        const result = await runtime.getAccountInfo({ platformKey: platform.key, ...await desktop.readAccountSession({ id }), signal: controller.signal })
        if (result.ok && request.expectedUserId && result.identity.platformUserId !== request.expectedUserId) throw Object.assign(new Error('当前登录账号与原账号不一致，请使用原账号重新授权。'), { code: 'ACCOUNT_MISMATCH' })
        return result
      }
    }
    const id = crypto.randomUUID(); const controller = new AbortController()
    const job = { owner, controller, done: false, message: '正在启动平台授权…', version: manifest.version }
    this.jobs.set(id, job)
    const cancel = () => { controller.abort(); this.jobs.delete(id); cleanup() }
    const navigate = (_event, _url, inPlace, mainFrame) => { if (mainFrame && !inPlace) cancel() }
    const cleanup = () => { clearTimeout(job.timer); owner.removeListener('destroyed', cancel); owner.removeListener('did-start-navigation', navigate) }
    job.cleanup = cleanup
    owner.once('destroyed', cancel)
    if (!input.persistAcrossNavigation) owner.on('did-start-navigation', navigate)
    job.timer = setTimeout(cancel, 15 * 60000); job.timer.unref()
    job.promise = Promise.resolve().then(() => runtime.run({ desktop, rpa, task, tabId: input.tabId, signal: controller.signal, onProgress: message => { job.message = String(message).slice(0, 500) } })).then(result => { job.result = this.decryptCapture(result, keys.privateKey, request.id) }).catch(error => { if (!controller.signal.aborted) console.error('[平台任务失败]', { code: error.code || error.name, site: error.stack?.split('\n').slice(1, 4).join(' ') }); job.error = controller.signal.aborted ? '已取消平台任务。' : error.code === 'ACCOUNT_MISMATCH' ? error.message : platform.accountInfo ? '账号信息核验未完成，请确认平台已登录并检查网络；若客户端版本较旧，请更新后重试。' : '平台授权未完成，请检查登录窗口后重试。' }).finally(() => { job.done = true; clearTimeout(job.timer); job.timer = setTimeout(cancel, 60000); job.timer.unref() })
    return { id, version: manifest.version, tabId: input.tabId, environmentId: input.environmentId }
  }
  async getAccountInfo ({ platformKey, contents, storage }) {
    const { runtime } = await this.load()
    const platform = runtime.catalog.find(item => item.key === platformKey)
    if (!platform || typeof runtime.getAccountInfo !== 'function') return { ok: false, error: '请更新平台能力包后核验账号信息。' }
    return runtime.getAccountInfo({ platformKey, ...await readAccountSession(contents, platform.origins, storage) })
  }
  decryptCapture (envelope, privateKey, operationId) {
    try {
      const key = crypto.privateDecrypt({ key: privateKey, oaepHash: 'sha256' }, Buffer.from(envelope.wrappedKey, 'base64'))
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(envelope.iv, 'base64'))
      decipher.setAAD(Buffer.from(operationId)); decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'))
      const snapshot = JSON.parse(Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, 'base64')), decipher.final()]).toString('utf8'))
      if (snapshot.operationId !== operationId || !['valid', 'invalid'].includes(snapshot.outcome)) throw new Error()
      if (snapshot.outcome === 'valid' && (!snapshot.identity?.platformUserId || !Array.isArray(snapshot.cookies) || !snapshot.platform)) throw new Error()
      return snapshot
    } catch { throw new ProfileValidationError('客户端会话数据解密失败，请重新授权。') }
  }
  async poll (owner, id, cancel = false) {
    const job = this.jobs.get(id)
    if (!job || job.owner !== owner) throw new ProfileValidationError('平台任务不存在或不属于当前页面。')
    if (cancel) { job.controller.abort(); await job.promise }
    const result = { done: job.done, message: job.message, version: job.version, ...(job.done ? { result: job.result, error: job.error } : {}) }
    if (job.done) { job.cleanup(); this.jobs.delete(id) }
    return result
  }
}

module.exports = { PlatformRuntime }
