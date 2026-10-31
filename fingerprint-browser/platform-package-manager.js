const fs = require('node:fs/promises')
const path = require('node:path')
const crypto = require('node:crypto')
const { PlatformRuntime } = require('./platform-runtime')
const { newerVersion, updateUrl } = require('./client-updater')

// 能力包由客户端自行缓存和更新；下载源仅来自部署配置，网页不能指定发布源。
class PlatformPackageManager {
  constructor ({ directory, bundledDirectory, url = '', channel = 'prod', fetcher = fetch }) {
    this.directory = directory; this.bundledDirectory = bundledDirectory; this.url = url; this.channel = channel; this.fetcher = fetcher
    this.runtime = null; this.operation = null; this.state = { status: 'idle', message: '正在读取本机平台能力。' }
  }
  async initialize () {
    await fs.mkdir(this.directory, { recursive: true })
    try {
      const pointer = JSON.parse(await fs.readFile(path.join(this.directory, 'current.json'), 'utf8'))
      if (!/^\d+\.\d+\.\d+-[a-f0-9]{12}-[a-f0-9]{12}$/.test(pointer.release)) throw new Error()
      this.runtime = new PlatformRuntime(path.join(this.directory, pointer.release))
      await this.runtime.load()
    } catch { this.runtime = null }
    // 安装包中的能力也写入本地缓存；升级客户端时只采用更新的已校验版本。
    try {
      const bundled = new PlatformRuntime(this.bundledDirectory); const { manifest } = await bundled.load()
      const current = this.runtime && (await this.runtime.load()).manifest
      if (!current || newerVersion(manifest.version, current.version)) await this.install(manifest, file => fs.readFile(path.join(this.bundledDirectory, file)))
    } catch { if (!this.runtime) this.state = { status: 'error', message: '本机尚无可用的平台能力包，请检查客户端安装或独立发布源。' } }
    return this.runtime
  }
  async bytes (url, limit) {
    const response = await this.fetcher(url, { redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(15000) })
    if (!response.ok || Number(response.headers.get('content-length')) > limit) throw new Error('能力包下载失败。')
    const chunks = []; let size = 0
    for await (const chunk of response.body) { size += chunk.length; if (size > limit) { throw new Error('能力包超过大小限制。') }; chunks.push(chunk) }
    return Buffer.concat(chunks)
  }
  check () {
    if (this.operation) return this.operation
    this.operation = this.checkNow().finally(() => { this.operation = null })
    return this.operation
  }
  async checkNow () {
    if (!this.url) return (this.state = { status: 'local', message: '正在使用本地能力；尚未配置独立发布源。' })
    try {
      this.state = { status: 'checking', message: '客户端正在检查平台和 RPA 版本。' }
      const source = updateUrl(this.url, this.channel)
      const manifest = JSON.parse((await this.bytes(source, 65536)).toString('utf8'))
      if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) throw new Error()
      const current = this.runtime && (await this.runtime.load()).manifest
      if (current && !newerVersion(manifest.version, current.version)) {
        if (manifest.version === current.version && (manifest.sha256 !== current.sha256 || manifest.rpa?.sha256 !== current.rpa.sha256)) throw new Error()
        return (this.state = { status: 'current', version: current.version, message: '平台和 RPA 已是当前可用版本。' })
      }
      const base = new URL('.', source)
      await this.install(manifest, file => this.bytes(new URL(file, base).href, 4 * 1024 * 1024))
      return (this.state = { status: 'updated', version: manifest.version, message: '平台和 RPA 已校验并缓存，新任务将使用新版本。' })
    } catch {
      return (this.state = { status: 'error', message: this.runtime ? '平台能力更新未完成，继续使用已校验的本地版本。' : '平台能力下载失败，请检查独立发布源配置与网络。' })
    }
  }
  async install (manifest, read) {
    if (manifest.bridgeVersion !== 2 || !/^\d+\.\d+\.\d+$/.test(manifest.version) || !/^authorization-\d+\.\d+\.\d+-[a-f0-9]{12}\.js$/.test(manifest.file) || !/^[a-f0-9]{64}$/.test(manifest.sha256) || !/^rpa-\d+\.\d+\.\d+-[a-f0-9]{12}\.js$/.test(manifest.rpa?.file) || !/^[a-f0-9]{64}$/.test(manifest.rpa?.sha256)) throw new Error('能力清单无效。')
    const release = `${manifest.version}-${manifest.sha256.slice(0, 12)}-${manifest.rpa.sha256.slice(0, 12)}`
    const candidate = path.join(this.directory, '.pending-' + crypto.randomUUID())
    await fs.mkdir(candidate)
    for (const entry of [manifest, manifest.rpa]) {
      const bytes = await read(entry.file)
      if (bytes.length > 4 * 1024 * 1024 || crypto.createHash('sha256').update(bytes).digest('hex') !== entry.sha256) throw new Error('能力包完整性不一致。')
      await fs.writeFile(path.join(candidate, entry.file), bytes, { flag: 'wx' })
    }
    await fs.writeFile(path.join(candidate, 'manifest.json'), JSON.stringify(manifest), 'utf8')
    await new PlatformRuntime(candidate).load()
    const destination = path.join(this.directory, release)
    try { await fs.rename(candidate, destination) } catch (error) {
      if (!['EEXIST', 'ENOTEMPTY', 'EPERM'].includes(error.code)) throw error
      await new PlatformRuntime(destination).load()
    }
    const temporary = path.join(this.directory, 'current-' + crypto.randomUUID() + '.json')
    await fs.writeFile(temporary, JSON.stringify({ release }), { flag: 'wx' })
    await fs.rename(temporary, path.join(this.directory, 'current.json'))
    // 保持宿主及在途任务对象，仅切换之后 load 的版本目录。
    if (this.runtime) this.runtime.directory = destination
    else this.runtime = new PlatformRuntime(destination)
  }
}
module.exports = { PlatformPackageManager }
