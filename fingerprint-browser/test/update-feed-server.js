const fs = require('node:fs/promises')
const path = require('node:path')

// 隔离测试的普通 HTTP 文件服务，第三方更新源无需实现任何 SaaS 业务接口。
class UpdateFeedServer {
  constructor (directory) { this.directory = directory }
  async handle (req, res, pathname) {
    const name = pathname === '/dev-win32-x64.json' ? 'dev-win32-x64.json' : pathname.match(/^\/([a-z0-9-]+\.exe)$/)?.[1]
    if (!name) { res.writeHead(404); res.end(); return true }
    let body
    try { body = await fs.readFile(path.join(this.directory, name)) } catch (error) { if (error.code !== 'ENOENT') throw error; res.writeHead(name.endsWith('.json') ? 204 : 404); res.end(); return true }
    res.writeHead(200, { 'Content-Length': body.length }); res.end(body); return true
  }
}
module.exports = { UpdateFeedServer }
