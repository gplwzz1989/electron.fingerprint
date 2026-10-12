const http = require('node:http')
const { URL } = require('node:url')
const {
  createProfileRecord,
  getPresetTemplates,
  getPresetTemplateById,
  normalizeUrl,
  ProfileValidationError
} = require('./profile-store')

const DEFAULT_PORT = 39898
const DEFAULT_HOST = '127.0.0.1'

class AutomationServer {
  constructor (options = {}) {
    this.port = options.port !== undefined
      ? Number(options.port)
      : (Number(process.env.FP_AUTOMATION_PORT) || DEFAULT_PORT)
    this.host = options.host || process.env.FP_AUTOMATION_HOST || DEFAULT_HOST
    this.profileRepository = options.profileRepository || null
    this.environmentRepository = options.environmentRepository || null
    this.groupRepository = options.groupRepository || null
    this.tabBrowser = options.tabBrowser || null
    this.server = null
    this.listening = false
  }

  async start () {
    if (this.listening) return { port: this.port, host: this.host }

    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        void this.handleRequest(req, res)
      })

      this.server.on('error', error => {
        if (!this.listening) {
          reject(error)
        } else {
          console.error('[自动化服务异常]', error)
        }
      })

      this.server.listen(this.port, this.host, () => {
        this.listening = true
        const address = this.server.address()
        const actualPort = typeof address === 'object' && address ? address.port : this.port
        this.port = actualPort
        console.log(`[自动化服务] 正在监听 http://${this.host}:${this.port}`)
        resolve({ port: this.port, host: this.host })
      })
    })
  }

  async stop () {
    if (!this.server || !this.listening) return
    return new Promise(resolve => {
      this.server.close(() => {
        this.listening = false
        this.server = null
        resolve()
      })
    })
  }

  async handleRequest (req, res) {
    // 设置通用 CORS 头以支持本地自动化脚本和管理台调用
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    const parsedUrl = new URL(req.url, `http://${this.host}:${this.port}`)
    const pathname = parsedUrl.pathname
    const method = req.method.toUpperCase()

    try {
      const body = await this.readJsonBody(req)
      const result = await this.route(method, pathname, parsedUrl.searchParams, body)

      const statusCode = typeof result.statusCode === 'number' ? result.statusCode : 200
      res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify(result.body ?? result))
    } catch (error) {
      const status = error.statusCode || 500
      const message = error instanceof ProfileValidationError || error?.message
        ? error.message
        : '服务器内部错误，请检查请求参数或服务状态。'
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify({ ok: false, error: message }))
    }
  }

  async readJsonBody (req) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return {}
    return new Promise((resolve, reject) => {
      let data = ''
      req.on('data', chunk => {
        data += chunk
        if (data.length > 2 * 1024 * 1024) {
          const err = new Error('请求体过大，不能超过 2MB。')
          err.statusCode = 413
          reject(err)
        }
      })
      req.on('end', () => {
        if (!data.trim()) return resolve({})
        try {
          resolve(JSON.parse(data))
        } catch {
          const err = new Error('请求体不是合法的 JSON 格式。')
          err.statusCode = 400
          reject(err)
        }
      })
      req.on('error', reject)
    })
  }

  async route (method, pathname, query, body) {
    // 健康检查
    if (method === 'GET' && (pathname === '/api/v1/health' || pathname === '/health')) {
      return {
        ok: true,
        status: 'running',
        version: '0.1.0',
        platform: process.platform,
        pid: process.pid,
        uptime: Math.floor(process.uptime())
      }
    }

    // 获取预设模板列表
    if (method === 'GET' && pathname === '/api/v1/presets') {
      return {
        ok: true,
        presets: getPresetTemplates()
      }
    }

    // 获取单个预设模板
    const presetMatch = pathname.match(/^\/api\/v1\/presets\/([^/]+)$/)
    if (method === 'GET' && presetMatch) {
      const preset = getPresetTemplateById(presetMatch[1])
      if (!preset) {
        const error = new Error('找不到指定的预设模板。')
        error.statusCode = 404
        throw error
      }
      return { ok: true, preset }
    }

    // 环境列表
    if (method === 'GET' && pathname === '/api/v1/environments') {
      const rawList = this.environmentRepository ? this.environmentRepository.list() : []
      const environments = rawList.map(env => ({
        ...env,
        isOpen: this.tabBrowser ? this.tabBrowser.isOpen(env.id) : false
      }))
      return { ok: true, count: environments.length, environments }
    }

    // 创建环境
    if (method === 'POST' && pathname === '/api/v1/environments/create') {
      return await this.handleCreateEnvironment(body)
    }

    // 环境快速启动
    if (method === 'POST' && pathname === '/api/v1/environments/start') {
      const id = body.id || body.environmentId
      if (!id) {
        const error = new Error('必须提供待启动环境的 id。')
        error.statusCode = 400
        throw error
      }
      return await this.handleStartEnvironment(id, body.url)
    }

    // 环境快速关闭
    if (method === 'POST' && pathname === '/api/v1/environments/stop') {
      const id = body.id || body.environmentId
      if (!id) {
        const error = new Error('必须提供待关闭环境的 id。')
        error.statusCode = 400
        throw error
      }
      return await this.handleStopEnvironment(id)
    }

    // 获取特定环境详情
    const envMatch = pathname.match(/^\/api\/v1\/environments\/([^/]+)$/)
    if (method === 'GET' && envMatch) {
      const id = envMatch[1]
      const env = this.environmentRepository?.list().find(e => e.id === id)
      if (!env) {
        const error = new Error(`未找到 ID 为 ${id} 的环境。`)
        error.statusCode = 404
        throw error
      }
      return {
        ok: true,
        environment: {
          ...env,
          isOpen: this.tabBrowser ? this.tabBrowser.isOpen(id) : false
        }
      }
    }

    // 删除特定环境
    if (method === 'DELETE' && envMatch) {
      const id = envMatch[1]
      return await this.handleDeleteEnvironment(id)
    }

    // 针对特定环境的操作: /start 或 /stop
    const envActionMatch = pathname.match(/^\/api\/v1\/environments\/([^/]+)\/(start|stop)$/)
    if (method === 'POST' && envActionMatch) {
      const id = envActionMatch[1]
      const action = envActionMatch[2]
      if (action === 'start') {
        return await this.handleStartEnvironment(id, body.url)
      } else if (action === 'stop') {
        return await this.handleStopEnvironment(id)
      }
    }

    // 标签页快照
    if (method === 'GET' && pathname === '/api/v1/tabs') {
      if (!this.tabBrowser) {
        return { ok: true, tabs: [], activeTabId: null }
      }
      return { ok: true, ...this.tabBrowser.snapshot() }
    }

    // 在指定环境中打开新标签
    if (method === 'POST' && pathname === '/api/v1/tabs/new-page') {
      if (!this.tabBrowser) {
        const error = new Error('浏览器未初始化，无法打开页面。')
        error.statusCode = 503
        throw error
      }
      const environmentId = body.environmentId || body.id
      const targetUrl = body.url ? normalizeUrl(body.url) : undefined
      const result = await this.tabBrowser.openPageTab(environmentId, targetUrl)
      return { ok: true, ...result, ...this.tabBrowser.snapshot() }
    }

    // 未知路由 404
    const notFound = new Error(`未找到接口 ${method} ${pathname}`)
    notFound.statusCode = 404
    throw notFound
  }

  async handleCreateEnvironment (body) {
    const record = createProfileRecord(body)
    if (this.groupRepository && record.group) {
      await this.groupRepository.ensure(record.group)
    }
    if (this.profileRepository) {
      await this.profileRepository.save(record)
    }

    let startResult = null
    if (body.autoStart && this.tabBrowser) {
      try {
        startResult = await this.handleStartEnvironment(record.id, record.url)
      } catch (err) {
        startResult = { error: err.message }
      }
    }

    return {
      statusCode: 201,
      body: {
        ok: true,
        message: '环境创建成功。',
        environment: record,
        started: Boolean(body.autoStart && startResult && !startResult.error),
        startResult
      }
    }
  }

  async handleStartEnvironment (id, customUrl) {
    if (!this.tabBrowser) {
      const error = new Error('浏览器环境服务未就绪。')
      error.statusCode = 503
      throw error
    }

    const isAlreadyOpen = this.tabBrowser.isOpen(id)
    if (isAlreadyOpen) {
      if (customUrl) {
        await this.tabBrowser.openPageTab(id, normalizeUrl(customUrl))
      }
      return {
        ok: true,
        message: '环境已处于运行状态。',
        environmentId: id,
        ...this.tabBrowser.snapshot()
      }
    }

    // 优先从已持久化的环境仓库中恢复
    const existingEnv = this.environmentRepository?.list().find(e => e.id === id)
    if (existingEnv) {
      const reopenResult = await this.tabBrowser.reopen(id)
      if (customUrl) {
        await this.tabBrowser.openPageTab(id, normalizeUrl(customUrl))
      }
      return {
        ok: true,
        message: '环境已恢复启动。',
        environmentId: id,
        ...reopenResult,
        ...this.tabBrowser.snapshot()
      }
    }

    // 若尚未创建环境，从 profileRepository 中启动
    const profile = this.profileRepository?.list().find(p => p.id === id)
    if (!profile) {
      const error = new Error(`未找到 ID 为 ${id} 的配置或环境。`)
      error.statusCode = 404
      throw error
    }

    if (this.groupRepository) {
      await this.groupRepository.ensure(profile.group)
    }
    const targetUrl = customUrl ? normalizeUrl(customUrl) : profile.url
    const result = await this.tabBrowser.open(profile, targetUrl)
    return {
      ok: true,
      message: '环境已成功启动。',
      environmentId: id,
      ...result,
      ...this.tabBrowser.snapshot()
    }
  }

  async handleStopEnvironment (id) {
    if (!this.tabBrowser) {
      const error = new Error('浏览器服务未就绪。')
      error.statusCode = 503
      throw error
    }

    if (!this.tabBrowser.isOpen(id)) {
      return { ok: true, message: '环境未在运行中。', environmentId: id }
    }

    const result = await this.tabBrowser.closeEnvironment(id)
    return {
      ok: true,
      message: '环境已成功关闭。',
      environmentId: id,
      ...result
    }
  }

  async handleDeleteEnvironment (id) {
    if (!this.environmentRepository) {
      const error = new Error('环境存储服务未就绪。')
      error.statusCode = 503
      throw error
    }

    if (this.tabBrowser && this.tabBrowser.isOpen(id)) {
      const error = new Error('请先关闭正在运行的环境再执行删除。')
      error.statusCode = 409
      throw error
    }

    const removal = await this.environmentRepository.remove(id)
    return {
      ok: true,
      message: '环境删除成功。',
      environmentId: id,
      deletionPending: removal?.pending ?? false
    }
  }
}

module.exports = {
  AutomationServer,
  DEFAULT_PORT,
  DEFAULT_HOST
}
