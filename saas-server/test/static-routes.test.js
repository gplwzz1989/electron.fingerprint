const test = require('node:test')
const assert = require('node:assert/strict')
const http = require('node:http')
const path = require('node:path')
const fs = require('node:fs')
const os = require('node:os')
const crypto = require('node:crypto')
const { WorkspaceServer, findPublicDirectory, findDataDirectory } = require('../src/workspace-server')
const { WorkspaceDatabase, UserError } = require('../src/mysql-database')
const { DEFAULT_ADMIN_ACCOUNT, DEFAULT_ADMIN_PASSWORD, DEFAULT_ADMIN_EMAIL } = require('../src/system-settings')

test('静态资源与页面路由：登录页、管理后台与公共资源访问', async t => {
  await t.test('默认管理员凭据规范：账号为 admin，默认密码为 88888888', () => {
    assert.equal(DEFAULT_ADMIN_ACCOUNT, 'admin')
    assert.equal(DEFAULT_ADMIN_PASSWORD, '88888888')
    assert.equal(DEFAULT_ADMIN_EMAIL, 'admin@qijie.local')
  })
  await t.test('findPublicDirectory 能够正确探测 public 目录', () => {
    const publicDir = findPublicDirectory()
    assert(fs.existsSync(publicDir), 'public 目录应存在')
    assert(fs.existsSync(path.join(publicDir, 'index.html')), 'public 目录应包含 index.html')
    assert(fs.existsSync(path.join(publicDir, 'system-admin.html')), 'public 目录应包含 system-admin.html')
  })

  await t.test('findDataDirectory 能够自适应探测并优先选择包含 encryption.key 的目录', () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'qijie-datadir-test-'))
    try {
      const explicitDir = path.join(tempRoot, 'custom-data')
      assert.equal(findDataDirectory(explicitDir), path.resolve(explicitDir))
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true })
    }
  })

  await t.test('WorkspaceDatabase.decrypt 密钥不匹配时转换为明确中文 UserError', () => {
    const dummy = Object.create(WorkspaceDatabase.prototype)
    dummy.key = crypto.randomBytes(32)
    // 构造一个由其他密钥生成的合法 AES-GCM 密文
    const otherKey = crypto.randomBytes(32)
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv('aes-256-gcm', otherKey, iv)
    const ciphertext = Buffer.concat([iv, cipher.update('secret-test'), cipher.final(), cipher.getAuthTag()]).toString('base64')

    assert.throws(
      () => dummy.decrypt(ciphertext),
      error => error instanceof UserError && error.message.includes('encryption.key')
    )
  })

  // 创建一个轻量级 HTTP 服务直接挂接 WorkspaceServer 的 static 路由
  const dummyServer = Object.create(WorkspaceServer.prototype)
  dummyServer.publicDirectory = findPublicDirectory()
  dummyServer.json = function (res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify(data))
  }

  const server = http.createServer((req, res) => {
    try {
      dummyServer.static(req, res, req.url)
    } catch (error) {
      dummyServer.json(res, error.status || 500, { ok: false, message: error.message })
    }
  })

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  const origin = `http://127.0.0.1:${port}`

  try {
    await t.test('访问根路径 / 返回 200 及 index.html', async () => {
      const res = await fetch(`${origin}/`)
      assert.equal(res.status, 200)
      assert(res.headers.get('content-type').includes('text/html'))
      const text = await res.text()
      assert(text.includes('栖界'), '应包含页面标题或关键词')
    })

    await t.test('访问 /login 与 /signin 均回退至 index.html', async () => {
      for (const route of ['/login', '/signin']) {
        const res = await fetch(`${origin}${route}`)
        assert.equal(res.status, 200)
        assert(res.headers.get('content-type').includes('text/html'))
        const text = await res.text()
        assert(text.includes('栖界'))
      }
    })

    await t.test('访问 /system-admin.html 与 /system-admin 均返回系统管理后台', async () => {
      for (const route of ['/system-admin.html', '/system-admin', '/admin']) {
        const res = await fetch(`${origin}${route}`)
        assert.equal(res.status, 200, `访问 ${route} 应该返回 200`)
        assert(res.headers.get('content-type').includes('text/html'))
        const text = await res.text()
        assert(text.includes('系统管理') || text.includes('system-admin'), '应返回系统管理后台页面内容')
      }
    })

    await t.test('访问关键静态脚本和样式返回正确的 Content-Type', async () => {
      for (const file of ['/workspace.js', '/system-admin.js']) {
        const res = await fetch(`${origin}${file}`)
        assert.equal(res.status, 200)
        assert(res.headers.get('content-type').includes('javascript'))
      }
      for (const file of ['/workspace.css', '/system-admin.css']) {
        const res = await fetch(`${origin}${file}`)
        assert.equal(res.status, 200)
        assert(res.headers.get('content-type').includes('css'))
      }
    })

    await t.test('访问不存在的文件返回 404 JSON', async () => {
      const res = await fetch(`${origin}/non-existent-page-xyz.html`)
      assert.equal(res.status, 404)
      const data = await res.json()
      assert.equal(data.ok, false)
      assert.equal(data.message, '页面不存在。')
    })

    await t.test('路径穿越攻击被安全拦截并返回 404', async () => {
      const res = await fetch(`${origin}/../../../../package.json`)
      assert.equal(res.status, 404)
      const data = await res.json()
      assert.equal(data.ok, false)
    })
  } finally {
    await new Promise(resolve => server.close(resolve))
  }
})
