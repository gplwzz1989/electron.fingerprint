const fs = require('node:fs/promises')
const path = require('node:path')
const crypto = require('node:crypto')
const vm = require('node:vm')
const { ProfileValidationError } = require('./profile-store')

// 仅加载部署者指定的本地发布目录；网页不能提供脚本路径或执行代码。
class PlatformRuntime {
  constructor (directory) { this.directory = directory; this.jobs = new Map(); this.contexts = new Map() }
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
    const context = vm.createContext({ module, exports: module.exports, window: {}, URL, setTimeout, clearTimeout }, { codeGeneration: { strings: false, wasm: false } })
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
  bind (owner, tabId, task) {
    if (!task || typeof task.operationId !== 'string' || !/^[a-f0-9]{64}$/.test(task.proofKey) || task.expiresAt <= Date.now()) throw new ProfileValidationError('客户端授权上下文无效。')
    if (this.contexts.size >= 64) for (const [id, item] of this.contexts) if (item.expiresAt <= Date.now() || item.owner.isDestroyed()) this.contexts.delete(id)
    if (this.contexts.size >= 64) throw new ProfileValidationError('客户端授权上下文过多，请稍后重试。')
    const context = { ...task, owner, ownerUrl: owner.getURL(), tabId }
    this.contexts.set(task.operationId, context)
    const clear = () => { if (this.contexts.get(task.operationId) === context) this.contexts.delete(task.operationId); owner.removeListener('destroyed', clear); owner.removeListener('did-start-navigation', navigate); clearTimeout(timer) }
    const navigate = (_event, _url, inPlace, mainFrame) => { if (mainFrame && !inPlace) clear() }
    const timer = setTimeout(clear, Math.max(1, task.expiresAt - Date.now())); timer.unref()
    owner.once('destroyed', clear); owner.on('did-start-navigation', navigate)
  }
  async start (owner, input, desktop) {
    const ownerUrl = owner.getURL()
    const context = this.contexts.get(input?.task?.id)
    if (!context || context.owner !== owner || context.ownerUrl !== ownerUrl || context.tabId !== input.tabId) throw new ProfileValidationError('请先通过加密启动绑定授权任务。')
    const { runtime, rpa, manifest } = await this.load()
    const platform = runtime.catalog.find(item => item.key === context.platformKey)
    if (!platform) throw new ProfileValidationError('客户端能力包不支持此平台。')
    input = { ...input, task: { id: context.operationId, expiresAt: context.expiresAt, publicKey: context.publicKey, mode: context.mode, platform } }
    desktop.authorizeCapture = { proofKey: context.proofKey, platform, tabId: input.tabId, packageVersion: manifest.version, mode: context.mode, expectedUserId: context.expectedUserId }
    if (!input?.task?.id || !Number.isFinite(input.task.expiresAt) || input.task.expiresAt <= Date.now() || input.task.expiresAt > Date.now() + 15 * 60000 || !input.tabId) throw new ProfileValidationError('平台任务无效或已过期。')
    if ([...this.jobs.values()].some(job => job.owner === owner && !job.done)) throw new ProfileValidationError('已有平台任务正在执行，请先完成或取消。')
    if (owner.isDestroyed() || owner.getURL() !== ownerUrl) throw new ProfileValidationError('调用页面已关闭或变化。')
    if (this.jobs.size >= 32 || [...this.jobs.values()].some(job => job.owner === owner && !job.done)) throw new ProfileValidationError('平台任务较多，请稍后重试。')
    const id = crypto.randomUUID(); const controller = new AbortController()
    const job = { owner, controller, done: false, message: '正在启动平台授权…', version: manifest.version }
    this.jobs.set(id, job)
    const cancel = () => { controller.abort(); this.jobs.delete(id); cleanup() }
    const navigate = (_event, _url, inPlace, mainFrame) => { if (mainFrame && !inPlace) cancel() }
    const cleanup = () => { clearTimeout(job.timer); owner.removeListener('destroyed', cancel); owner.removeListener('did-start-navigation', navigate) }
    job.cleanup = cleanup
    owner.once('destroyed', cancel); owner.on('did-start-navigation', navigate)
    job.timer = setTimeout(cancel, 15 * 60000); job.timer.unref()
    job.promise = Promise.resolve().then(() => runtime.run({ desktop, rpa, task: input.task, tabId: input.tabId, signal: controller.signal, onProgress: message => { job.message = String(message).slice(0, 500) } })).then(result => { job.result = result }, error => { if (!controller.signal.aborted) console.error('[平台任务失败]', { code: error.code || error.name, site: error.stack?.split('\n').slice(1, 4).join(' ') }); job.error = controller.signal.aborted ? '已取消平台任务。' : '平台授权未完成，请检查登录窗口后重试。' }).finally(() => { job.done = true; clearTimeout(job.timer); job.timer = setTimeout(cancel, 60000); job.timer.unref() })
    return { id, version: manifest.version }
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
