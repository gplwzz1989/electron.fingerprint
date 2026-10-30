const fs = require('node:fs/promises')
const path = require('node:path')
const crypto = require('node:crypto')
const vm = require('node:vm')
const { ProfileValidationError } = require('./profile-store')

// 仅加载部署者指定的本地发布目录；网页不能提供脚本路径或执行代码。
class PlatformRuntime {
  constructor (directory) { this.directory = directory; this.jobs = new Map() }
  async load () {
    if (!this.directory || !path.isAbsolute(this.directory)) throw new ProfileValidationError('客户端尚未配置平台能力包，请联系管理员。')
    const directory = await fs.realpath(this.directory)
    const manifest = JSON.parse(await fs.readFile(path.join(directory, 'manifest.json'), 'utf8'))
    if (manifest.bridgeVersion !== 1 || !/^authorization-\d+\.\d+\.\d+-[a-f0-9]{12}\.js$/.test(manifest.file) || !/^[a-f0-9]{64}$/.test(manifest.sha256)) throw new ProfileValidationError('平台能力包清单无效，请重新发布。')
    const file = await fs.realpath(path.join(directory, manifest.file))
    if (path.dirname(file) !== directory || (await fs.stat(file)).size > 4 * 1024 * 1024) throw new ProfileValidationError('平台能力包文件无效。')
    const bytes = await fs.readFile(file)
    if (crypto.createHash('sha256').update(bytes).digest('hex') !== manifest.sha256) throw new ProfileValidationError('平台能力包完整性校验失败。')
    // VM 用于隔离模块变量；代码信任来自部署者控制的本地目录，不把 VM 当作安全沙箱。
    const context = vm.createContext({ window: {}, URL, setTimeout, clearTimeout }, { codeGeneration: { strings: false, wasm: false } })
    new vm.Script(bytes.toString('utf8'), { filename: manifest.file }).runInContext(context, { timeout: 1000 })
    const runtime = context.window.MediaPlatform
    if (runtime?.version !== manifest.version || typeof runtime.run !== 'function') throw new ProfileValidationError('平台能力包接口或版本不兼容。')
    return { runtime, manifest }
  }
  async start (owner, input, desktop) {
    const ownerUrl = owner.getURL()
    if (!input?.task?.id || !Number.isFinite(input.task.expiresAt) || input.task.expiresAt <= Date.now() || input.task.expiresAt > Date.now() + 15 * 60000 || !input.tabId) throw new ProfileValidationError('平台任务无效或已过期。')
    if ([...this.jobs.values()].some(job => job.owner === owner && !job.done)) throw new ProfileValidationError('已有平台任务正在执行，请先完成或取消。')
    const { runtime, manifest } = await this.load()
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
    job.promise = Promise.resolve().then(() => runtime.run({ desktop, task: input.task, tabId: input.tabId, signal: controller.signal, onProgress: message => { job.message = String(message).slice(0, 500) } })).then(result => { job.result = result }, () => { job.error = controller.signal.aborted ? '已取消平台任务。' : '平台授权未完成，请检查登录窗口后重试。' }).finally(() => { job.done = true; clearTimeout(job.timer); job.timer = setTimeout(cancel, 60000); job.timer.unref() })
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
