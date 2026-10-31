const fs = require('node:fs/promises')
const path = require('node:path')
const crypto = require('node:crypto')
const vm = require('node:vm')
const { Prisma } = require('@prisma/client')
const { UserError } = require('./mysql-database')
const toBigInt = value => typeof value === 'bigint' ? value : BigInt(Math.trunc(Number(value)))

// 管理员上传的代码只作为静态发布资源保存；服务端不执行客户端能力文件。
class PlatformReleaseService {
  constructor (database, directory) { this.db = database; this.directory = directory }
  async current () {
    const row = await this.db.client.platformReleaseState.findUnique({ where: { id: 1 } })
    const manifest = row?.manifest
    return manifest?.file && manifest?.rpa ? manifest : null
  }
  async list () {
    const rows = await this.db.client.platformRelease.findMany({ orderBy: { id: 'desc' }, take: 50, select: { component: true, version: true, sha256: true, fileName: true, sizeBytes: true, publishedBy: true, createdAt: true } })
    return { manifest: await this.current(), items: rows.map(row => ({ component: row.component, version: row.version, sha256: row.sha256, file: row.fileName, size: row.sizeBytes, publishedBy: row.publishedBy, createdAt: Number(row.createdAt) })) }
  }
  async publish (component, bytes, userId) {
    if (!['platform', 'rpa'].includes(component)) throw new UserError('请选择平台能力或 RPA 组件。')
    if (!Buffer.isBuffer(bytes) || !bytes.length || bytes.length > 4 * 1024 * 1024) throw new UserError('请选择不超过 4 MB 的单文件 JS。')
    try { const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); new vm.Script(text) } catch { throw new UserError('上传文件不是有效的 UTF-8 JavaScript，请检查 NCC 打包产物。') }
    return await this.db.transaction(async () => {
      const state = await this.db.client.platformReleaseState.findUnique({ where: { id: 1 }, select: { releaseVersion: true } })
      if (!state) throw new UserError('发布版本状态尚未初始化，请先同步数据库。', 503)
      const parts = state.releaseVersion.split('.').map(Number); parts[2]++
      if (parts[2] > 999999) throw new UserError('发布版本号已达上限，请联系管理员调整发布系列。', 409)
      const version = parts.join('.'); const sha256 = crypto.createHash('sha256').update(bytes).digest('hex')
      const file = `${component === 'platform' ? 'authorization' : 'rpa'}-${version}-${sha256.slice(0, 12)}.js`
      await fs.mkdir(this.directory, { recursive: true })
      const temporary = path.join(this.directory, '.upload-' + crypto.randomUUID())
      await fs.writeFile(temporary, bytes, { flag: 'wx' }); await fs.rename(temporary, path.join(this.directory, file))
      await this.db.client.platformRelease.create({ data: { component, version, sha256, fileName: file, sizeBytes: bytes.length, publishedBy: userId, createdAt: toBigInt(Date.now()) } })
      const entries = {}
      for (const kind of ['platform', 'rpa']) {
        const latest = await this.db.client.platformRelease.findFirst({ where: { component: kind }, orderBy: { id: 'desc' }, select: { version: true, sha256: true, fileName: true } })
        entries[kind] = latest && { version: latest.version, sha256: latest.sha256, file: latest.fileName }
      }
      const manifest = entries.platform && entries.rpa ? { version, bridgeVersion: 2, file: entries.platform.file, sha256: entries.platform.sha256, rpa: entries.rpa } : null
      const updated = await this.db.client.platformReleaseState.updateMany({ where: { id: 1, releaseVersion: state.releaseVersion }, data: { releaseVersion: version, manifest: manifest || Prisma.DbNull } })
      if (updated.count !== 1) throw new UserError('另一个管理员刚刚发布了新版本，请刷新后重试。', 409)
      return { version, manifest, message: manifest ? '组件已发布，客户端下次启动将自动检测并更新。' : '组件已保存，请上传另一个组件后生成完整更新清单。' }
    })
  }
  async download (file) {
    if (!/^(authorization|rpa)-\d+\.\d+\.\d+-[a-f0-9]{12}\.js$/.test(file)) throw new UserError('能力文件地址无效。', 404)
    const row = await this.db.client.platformRelease.findUnique({ where: { fileName: file }, select: { sha256: true } })
    if (!row) throw new UserError('能力文件不存在。', 404)
    let bytes
    try { bytes = await fs.readFile(path.join(this.directory, file)) } catch { throw new UserError('能力文件缺失，请联系管理员重新发布。', 503) }
    if (crypto.createHash('sha256').update(bytes).digest('hex') !== row.sha256) throw new UserError('能力文件校验失败，已停止下载，请联系管理员重新发布。', 503)
    return bytes
  }
}
module.exports = { PlatformReleaseService }
