const http = require('node:http')
const url = require('node:url')
const { verifyToken, signToken, verifyPassword } = require('./auth')
const { DataStore } = require('./store')

class SaasServer {
  constructor ({ port = 8088, dataDir = null, secret = null } = {}) {
    this.port = port
    this.store = new DataStore(dataDir)
    this.secret = secret
    this.server = null
  }

  async start () {
    await this.store.init()

    this.server = http.createServer(async (req, res) => {
      // CORS 头支持
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Workspace-Id, X-Device-Id')

      if (req.method === 'OPTIONS') {
        res.writeHead(204)
        return res.end()
      }

      const parsedUrl = url.parse(req.url, true)
      const pathname = parsedUrl.pathname
      const method = req.method

      const sendJson = (status, data) => {
        res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify(data))
      }

      const getBody = () => {
        return new Promise((resolve, reject) => {
          let body = ''
          req.on('data', chunk => {
            body += chunk
            if (body.length > 5 * 1024 * 1024) { // 5MB 限制
              reject(new Error('请求体过大'))
            }
          })
          req.on('end', () => {
            if (!body) return resolve({})
            try {
              resolve(JSON.parse(body))
            } catch (err) {
              reject(new Error('JSON 格式错误'))
            }
          })
          req.on('error', reject)
        })
      }

      // 提取认证用户
      const authenticate = () => {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          throw new Error('缺少访问凭证，请先登录。')
        }
        const token = authHeader.slice(7)
        return verifyToken(token, this.secret)
      }

      try {
        // 1. 健康检查
        if (method === 'GET' && pathname === '/api/v1/health') {
          return sendJson(200, { ok: true, service: '栖界 SaaS 云端协同服务', status: 'online', timestamp: Date.now() })
        }

        // 2. 登录
        if (method === 'POST' && pathname === '/api/v1/auth/login') {
          const body = await getBody()
          const { email, password } = body
          if (!email || !password) return sendJson(400, { ok: false, error: '邮箱和密码不能为空。' })

          const user = this.store.findUserByEmail(email)
          if (!user || !verifyPassword(password, user.passwordHash)) {
            return sendJson(401, { ok: false, error: '邮箱或密码错误。' })
          }

          const workspaces = this.store.getUserWorkspaces(user.id)
          const token = signToken({ userId: user.id, email: user.email }, this.secret)

          return sendJson(200, {
            ok: true,
            token,
            user: { id: user.id, email: user.email, name: user.name },
            workspaces
          })
        }

        // 3. 注册
        if (method === 'POST' && pathname === '/api/v1/auth/register') {
          const body = await getBody()
          const { email, password, name, workspaceName } = body
          if (!email || !password || !name) {
            return sendJson(400, { ok: false, error: '必填字段不能为空。' })
          }
          if (this.store.findUserByEmail(email)) {
            return sendJson(409, { ok: false, error: '该邮箱已被注册。' })
          }

          const user = await this.store.createUser({ email, name, password })
          const workspace = await this.store.createWorkspace({
            name: workspaceName || `${name}的工作空间`,
            ownerId: user.id,
            plan: 'starter'
          })

          const token = signToken({ userId: user.id, email: user.email }, this.secret)
          return sendJson(201, {
            ok: true,
            token,
            user: { id: user.id, email: user.email, name: user.name },
            workspaces: [workspace]
          })
        }

        // 4. 当前用户信息
        if (method === 'GET' && pathname === '/api/v1/auth/me') {
          const authUser = authenticate()
          const user = this.store.findUserById(authUser.userId)
          if (!user) return sendJson(404, { ok: false, error: '用户不存在。' })
          const workspaces = this.store.getUserWorkspaces(user.id)
          return sendJson(200, {
            ok: true,
            user: { id: user.id, email: user.email, name: user.name },
            workspaces
          })
        }

        // 5. 工作空间相关路由匹配: /api/v1/workspaces/:workspaceId/...
        const wsMatch = pathname.match(/^\/api\/v1\/workspaces\/([^/]+)(\/.*)?$/)
        if (wsMatch) {
          const authUser = authenticate()
          const workspaceId = wsMatch[1]
          const subPath = wsMatch[2] || ''

          const workspaces = this.store.getUserWorkspaces(authUser.userId)
          const membership = workspaces.find(w => w.id === workspaceId)
          if (!membership) {
            return sendJson(403, { ok: false, error: '您无权访问该工作空间。' })
          }

          // 5.1 环境列表与检索
          if (method === 'GET' && subPath === '/environments') {
            const list = this.store.listEnvironments(workspaceId)
            // 附带当前租约状态
            const enriched = list.map(env => {
              const lease = this.store.getLease(env.id)
              return {
                ...env,
                activeLease: lease ? {
                  userId: lease.userId,
                  deviceId: lease.deviceId,
                  expiresAt: lease.expiresAt
                } : null
              }
            })
            return sendJson(200, { ok: true, environments: enriched })
          }

          // 5.2 保存/更新环境
          if (method === 'POST' && subPath === '/environments') {
            const body = await getBody()
            if (!body.id || !body.profileName) {
              return sendJson(400, { ok: false, error: '环境 ID 和名称为必填项。' })
            }

            // 配额检查
            const subscription = this.store.getSubscription(workspaceId)
            const currentCount = this.store.listEnvironments(workspaceId).length
            const isNew = !this.store.getEnvironment(workspaceId, body.id)
            if (isNew && subscription && currentCount >= subscription.environmentQuota) {
              return sendJson(403, { ok: false, error: `已达到套餐环境配额上限 (${subscription.environmentQuota})，请升级套餐。` })
            }

            const saved = await this.store.saveEnvironment(workspaceId, body)
            await this.store.recordAuditLog({
              workspaceId,
              userId: authUser.userId,
              action: isNew ? '创建环境' : '更新环境',
              target: saved.profileName || saved.id,
              device: req.headers['x-device-id'] || '客户端'
            })
            return sendJson(200, { ok: true, environment: saved })
          }

          // 5.3 删除环境
          const envDeleteMatch = subPath.match(/^\/environments\/([^/]+)$/)
          if (method === 'DELETE' && envDeleteMatch) {
            const envId = envDeleteMatch[1]
            const env = this.store.getEnvironment(workspaceId, envId)
            if (!env) return sendJson(404, { ok: false, error: '环境不存在。' })

            await this.store.deleteEnvironment(workspaceId, envId)
            await this.store.recordAuditLog({
              workspaceId,
              userId: authUser.userId,
              action: '删除环境',
              target: env.profileName || envId,
              device: req.headers['x-device-id'] || '客户端'
            })
            return sendJson(200, { ok: true, message: '环境已成功删除。' })
          }

          // 5.4 租约防多开: 申请租约
          const leaseMatch = subPath.match(/^\/environments\/([^/]+)\/lease$/)
          if (method === 'POST' && leaseMatch) {
            const envId = leaseMatch[1]
            const body = await getBody()
            const deviceId = body.deviceId || req.headers['x-device-id']
            if (!deviceId) return sendJson(400, { ok: false, error: '设备标识 (deviceId) 不能为空。' })

            try {
              const lease = await this.store.acquireLease({
                workspaceId,
                environmentId: envId,
                userId: authUser.userId,
                deviceId,
                ttlMs: body.ttlMs || 60000
              })
              await this.store.recordAuditLog({
                workspaceId,
                userId: authUser.userId,
                action: '启动环境',
                target: envId,
                device: deviceId
              })
              return sendJson(200, { ok: true, lease })
            } catch (err) {
              return sendJson(409, { ok: false, error: err.message })
            }
          }

          // 5.5 租约防多开: 续期
          const renewMatch = subPath.match(/^\/environments\/([^/]+)\/lease\/renew$/)
          if (method === 'POST' && renewMatch) {
            const body = await getBody()
            const lease = await this.store.renewLease({
              leaseId: body.leaseId,
              deviceId: body.deviceId || req.headers['x-device-id'],
              ttlMs: body.ttlMs || 60000
            })
            return sendJson(200, { ok: true, lease })
          }

          // 5.6 租约防多开: 释放
          const releaseMatch = subPath.match(/^\/environments\/([^/]+)\/lease\/release$/)
          if (method === 'POST' && releaseMatch) {
            const body = await getBody()
            await this.store.releaseLease({
              leaseId: body.leaseId,
              deviceId: body.deviceId || req.headers['x-device-id']
            })
            await this.store.recordAuditLog({
              workspaceId,
              userId: authUser.userId,
              action: '关闭环境',
              target: releaseMatch[1],
              device: body.deviceId || req.headers['x-device-id']
            })
            return sendJson(200, { ok: true, message: '租约已释放。' })
          }

          // 5.7 团队成员
          if (method === 'GET' && subPath === '/members') {
            const members = this.store.getWorkspaceMembers(workspaceId)
            return sendJson(200, { ok: true, members })
          }

          if (method === 'POST' && subPath === '/members') {
            if (!['owner', 'admin'].includes(membership.role)) {
              return sendJson(403, { ok: false, error: '仅所有者或管理员可邀请成员。' })
            }
            const body = await getBody()
            const { email, name, role = 'operator', environmentIds = [] } = body
            let user = this.store.findUserByEmail(email)
            if (!user) {
              // 自动创建邀请账号，初始随机密码
              user = await this.store.createUser({
                email,
                name: name || email.split('@')[0],
                password: 'TempPassword123!'
              })
            }
            const member = await this.store.addWorkspaceMember(workspaceId, {
              userId: user.id,
              role,
              environmentIds
            })
            await this.store.recordAuditLog({
              workspaceId,
              userId: authUser.userId,
              action: '邀请成员',
              target: `${email} (${role})`
            })
            return sendJson(201, { ok: true, member })
          }

          // 5.8 代理资源池
          if (method === 'GET' && subPath === '/proxies') {
            const proxies = this.store.listProxies(workspaceId)
            return sendJson(200, { ok: true, proxies })
          }

          if (method === 'POST' && subPath === '/proxies') {
            const body = await getBody()
            if (!body.host || !body.port) {
              return sendJson(400, { ok: false, error: '代理主机与端口不能为空。' })
            }
            const proxy = await this.store.addProxy(workspaceId, body)
            await this.store.recordAuditLog({
              workspaceId,
              userId: authUser.userId,
              action: '添加代理',
              target: `${proxy.protocol}://${proxy.host}:${proxy.port}`
            })
            return sendJson(201, { ok: true, proxy })
          }

          // 5.9 订阅与用量配额
          if (method === 'GET' && subPath === '/billing') {
            const subscription = this.store.getSubscription(workspaceId)
            const envCount = this.store.listEnvironments(workspaceId).length
            const memberCount = this.store.getWorkspaceMembers(workspaceId).length

            return sendJson(200, {
              ok: true,
              subscription,
              usage: {
                environments: envCount,
                environmentQuota: subscription ? subscription.environmentQuota : 50,
                members: memberCount,
                memberQuota: subscription ? subscription.memberQuota : 1
              }
            })
          }

          // 5.10 操作审计日志
          if (method === 'GET' && subPath === '/audit') {
            const logs = this.store.listAuditLogs(workspaceId)
            return sendJson(200, { ok: true, logs })
          }
        }

        // 默认 404
        return sendJson(404, { ok: false, error: `未找到请求的 API 路由: ${method} ${pathname}` })
      } catch (err) {
        console.error('[API Error]', err)
        return sendJson(err.message.includes('凭证') ? 401 : 500, {
          ok: false,
          error: err.message || '服务器内部处理异常。'
        })
      }
    })

    return new Promise((resolve, reject) => {
      this.server.listen(this.port, () => {
        resolve(this.server.address())
      })
      this.server.on('error', reject)
    })
  }

  async stop () {
    if (!this.server) return
    return new Promise((resolve, reject) => {
      this.server.close(err => {
        if (err) reject(err)
        else resolve()
      })
    })
  }
}

// 支持直接脚本启动
if (require.main === module) {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8088
  const server = new SaasServer({ port })
  server.start().then(addr => {
    console.log(`[栖界 SaaS 服务端] 已在 http://localhost:${addr.port} 启动运行。`)
  }).catch(err => {
    console.error('[栖界 SaaS 服务端启动失败]', err)
    process.exit(1)
  })
}

module.exports = {
  SaasServer
}
