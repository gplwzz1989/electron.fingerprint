const fs = require('node:fs/promises')
const path = require('node:path')
const crypto = require('node:crypto')
const { EventEmitter } = require('node:events')

function versionParts (value) {
  if (typeof value !== 'string' || !/^(0|[1-9]\d{0,5})\.(0|[1-9]\d{0,5})\.(0|[1-9]\d{0,5})$/.test(value)) throw new Error('更新版本号无效。')
  return value.split('.').map(Number)
}
function newerVersion (next, current) { const a = versionParts(next); const b = versionParts(current); for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i]; return false }
function updateUrl (input, channel) {
  const url = new URL(input)
  if (url.username || url.password || url.hash || (url.protocol !== 'https:' && !(channel === 'dev' && url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))) throw new Error('更新地址必须使用 HTTPS，开发环境仅允许本机 HTTP。')
  return url.href
}
function verifyManifest (envelope, { publicKey, channel, platform, arch, currentVersion, now = Date.now() }) {
  try {
    if (typeof envelope.payload !== 'string' || envelope.payload.length > 60000 || typeof envelope.signature !== 'string' || envelope.signature.length > 256) throw new Error()
    const key = crypto.createPublicKey(publicKey)
    if (key.asymmetricKeyType !== 'ed25519') throw new Error()
    const payload = Buffer.from(envelope.payload, 'base64')
    if (!crypto.verify(null, payload, key, Buffer.from(envelope.signature, 'base64'))) throw new Error()
    const manifest = JSON.parse(payload.toString('utf8'))
    if (manifest.format !== 'qijie-update-v1' || manifest.channel !== channel || manifest.platform !== platform || manifest.arch !== arch || !/^[a-f0-9]{64}$/.test(manifest.sha256) || !Number.isSafeInteger(manifest.size) || manifest.size < 1 || manifest.size > 2 * 1024 ** 3 || !Number.isSafeInteger(manifest.expiresAt) || manifest.expiresAt <= now || !Number.isSafeInteger(manifest.publishedAt) || manifest.publishedAt > now + 300000 || manifest.expiresAt <= manifest.publishedAt || typeof manifest.notes !== 'string' || manifest.notes.length > 4000) throw new Error()
    manifest.url = updateUrl(manifest.url, channel)
    versionParts(manifest.version); versionParts(currentVersion)
    return manifest
  } catch { throw new Error('更新信息验签失败、已过期或不适用于当前客户端。') }
}
async function fileDigest (file) {
  const hash = crypto.createHash('sha256'); const handle = await fs.open(file, 'r')
  try { for await (const chunk of handle.createReadStream()) hash.update(chunk); return hash.digest('hex') } finally { await handle.close() }
}
class ClientUpdater extends EventEmitter {
  constructor ({ config, directory, currentVersion, platform = process.platform, arch = process.arch, onReady = async () => {} }) {
    super(); this.config = config; this.directory = directory; this.currentVersion = currentVersion; this.platform = platform; this.arch = arch; this.onReady = onReady
    this.state = { status: config.enabled && platform === 'win32' ? 'idle' : 'disabled', currentVersion, message: config.enabled ? platform === 'win32' ? '等待检查更新。' : '当前平台暂不支持自动安装。' : '尚未配置更新地址及验签公钥。', progress: 0 }
    this.operation = null; this.installer = null; this.manifest = null
  }
  snapshot () { return { ...this.state } }
  setState (patch) { Object.assign(this.state, patch); this.emit('changed', this.snapshot()) }
  options () { return { ...this.config, channel: this.config.channel, platform: this.platform, arch: this.arch, currentVersion: this.currentVersion } }
  start () {
    if (this.state.status === 'disabled') return
    this.startTimer = setTimeout(() => { void this.check() }, 10000); this.startTimer.unref()
    this.timer = setInterval(() => { void this.check() }, 6 * 60 * 60 * 1000); this.timer.unref()
  }
  stop () { clearTimeout(this.startTimer); clearInterval(this.timer) }
  async check () {
    if (this.state.status === 'disabled' || this.state.status === 'installing') return this.snapshot()
    if (this.operation) return this.operation
    this.operation = this.checkAndDownload().finally(() => { this.operation = null })
    return this.operation
  }
  async checkAndDownload () {
    try {
      this.setState({ status: 'checking', message: '正在检查更新。', progress: 0 })
      const response = await fetch(updateUrl(this.config.url, this.config.channel), { redirect: 'error', signal: AbortSignal.timeout(30000), cache: 'no-store' })
      if (response.status === 204) { this.setState({ status: 'current', message: '当前没有可用更新。' }); return this.snapshot() }
      if (!response.ok) throw new Error('更新服务暂时不可用，请稍后重试。')
      const chunks = []; let size = 0
      for await (const chunk of response.body) { size += chunk.length; if (size > 65536) throw new Error('更新信息超出大小限制。'); chunks.push(chunk) }
      let envelope
      try { envelope = JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { throw new Error('更新信息格式不正确。') }
      const manifest = verifyManifest(envelope, this.options())
      if (!newerVersion(manifest.version, this.currentVersion)) { this.installer = null; this.setState({ status: 'current', message: '当前已是最新版本。' }); return this.snapshot() }
      const alreadyReady = this.manifest?.sha256 === manifest.sha256 && this.installer
      this.manifest = manifest; this.envelope = envelope
      this.setState({ status: 'downloading', version: manifest.version, notes: manifest.notes, message: '发现新版本，正在下载。' })
      await fs.mkdir(this.directory, { recursive: true, mode: 0o700 })
      const target = path.join(this.directory, `${manifest.version}-${manifest.sha256}.exe`)
      let cached = false
      try { cached = (await fs.stat(target)).size === manifest.size && await fileDigest(target) === manifest.sha256 } catch {}
      if (!cached) await this.download(manifest, target)
      this.installer = target
      this.setState({ status: 'ready', progress: 100, message: '更新已下载并校验，可以安装。' })
      if (!alreadyReady) await this.onReady(this.snapshot())
    } catch (error) {
      this.installer = null
      this.setState({ status: 'error', message: /^(更新|下载)/.test(error.message) ? error.message : '更新检查或下载失败，请检查网络后重试。' })
    }
    return this.snapshot()
  }
  async download (manifest, target) {
    const response = await fetch(manifest.url, { redirect: 'error', signal: AbortSignal.timeout(30 * 60 * 1000) })
    if (!response.ok || Number(response.headers.get('content-length') || manifest.size) !== manifest.size) throw new Error('下载的更新文件大小不符。')
    const temporary = target + '.' + crypto.randomUUID() + '.part'
    const handle = await fs.open(temporary, 'wx', 0o600); const hash = crypto.createHash('sha256'); let received = 0; let progress = -1
    try {
      for await (const chunk of response.body) {
        received += chunk.length
        if (received > manifest.size) throw new Error('下载的更新文件超出预期大小。')
        hash.update(chunk); let offset = 0
        while (offset < chunk.length) offset += (await handle.write(chunk, offset, chunk.length - offset)).bytesWritten
        const next = Math.floor(received * 100 / manifest.size)
        if (next !== progress) { progress = next; this.setState({ progress }) }
      }
      await handle.sync()
    } finally { await handle.close() }
    if (received !== manifest.size || hash.digest('hex') !== manifest.sha256) throw new Error('下载的更新文件校验失败，已阻止安装。')
    await fs.rename(temporary, target)
  }
  async prepareInstall () {
    if (this.state.status !== 'ready' || !this.installer || !this.envelope) throw new Error('更新尚未准备好，请先检查更新。')
    try {
      const manifest = verifyManifest(this.envelope, this.options())
      if (!newerVersion(manifest.version, this.currentVersion) || (await fs.stat(this.installer)).size !== manifest.size || await fileDigest(this.installer) !== manifest.sha256) throw new Error()
      return { installer: this.installer, sha256: manifest.sha256 }
    } catch {
      this.installer = null; this.setState({ status: 'error', message: '更新文件已失效或校验失败，请重新检查更新。' })
      throw new Error('更新文件已失效或校验失败，请重新检查更新。')
    }
  }
}
module.exports = { ClientUpdater, verifyManifest, newerVersion, updateUrl, fileDigest }
