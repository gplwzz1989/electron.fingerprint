const fs = require('node:fs/promises')
const path = require('node:path')
const { readServerConfig } = require('./server-config')
const { UserError } = require('./mysql-database')

class ClientUpdateService {
  constructor (configFile) {
    const config = readServerConfig(configFile)
    this.directory = config.CLIENT_UPDATES_DIR ? path.resolve(path.dirname(configFile || process.env.SAAS_CONFIG_FILE || path.join(__dirname, `../.env.${process.env.SAAS_ENV || 'dev'}`)), config.CLIENT_UPDATES_DIR) : null
  }
  async handle (req, res, pathname) {
    if (!pathname.startsWith('/api/client-updates/')) return false
    if (req.method !== 'GET') throw new UserError('更新服务仅支持读取。', 405)
    if (!this.directory) { res.writeHead(204, { 'Cache-Control': 'no-store' }); res.end(); return true }
    const feed = pathname.match(/^\/api\/client-updates\/(dev|test|prod)\/(win32)\/(x64)\.json$/)
    const artifact = pathname.match(/^\/api\/client-updates\/artifacts\/([a-zA-Z0-9][a-zA-Z0-9._-]{0,150}\.exe)$/)
    if (!feed && !artifact) throw new UserError('更新文件不存在。', 404)
    const file = path.join(this.directory, feed ? `${feed[1]}-${feed[2]}-${feed[3]}.json` : artifact[1])
    let handle
    try { handle = await fs.open(file, 'r') } catch (error) { if (error.code !== 'ENOENT') throw error; res.writeHead(feed ? 204 : 404, { 'Cache-Control': 'no-store' }); res.end(); return true }
    try {
      const stat = await handle.stat()
      if (!stat.isFile() || feed && stat.size > 65536) throw new UserError('更新文件无效。', 503)
      res.writeHead(200, { 'Content-Type': feed ? 'application/json; charset=utf-8' : 'application/octet-stream', 'Content-Length': stat.size, 'Cache-Control': feed ? 'no-store' : 'public, max-age=3600' })
      const stream = handle.createReadStream(); res.on('close', () => stream.destroy()); stream.on('error', () => res.destroy())
      await new Promise(resolve => { stream.on('close', resolve); stream.pipe(res) })
    } finally { await handle.close() }
    return true
  }
}
module.exports = { ClientUpdateService }
