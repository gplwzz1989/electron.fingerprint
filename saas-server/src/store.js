const fs = require('node:fs/promises')
const path = require('node:path')
const crypto = require('node:crypto')
const { hashPassword } = require('./auth')

class DataStore {
  constructor (dataDir) {
    this.dataDir = path.resolve(dataDir || path.join(__dirname, '..', 'data'))
    this.filePath = path.join(this.dataDir, 'saas-db.json')
    this.state = {
      users: [],
      workspaces: [],
      workspaceMembers: [],
      environments: [],
      leases: [],
      proxies: [],
      auditLogs: [],
      subscriptions: []
    }
    this.loaded = false
    this.savePromise = Promise.resolve()
  }

  async init () {
    if (this.loaded) return
    await fs.mkdir(this.dataDir, { recursive: true })
    try {
      const content = await fs.readFile(this.filePath, 'utf8')
      this.state = JSON.parse(content)
    } catch {
      // 初始化演示工作空间与管理员
      await this.seedDefaults()
    }
    this.loaded = true
  }

  async seedDefaults () {
    const adminId = 'usr_admin_001'
    const defaultWorkspaceId = 'ws_default_001'

    this.state.users = [
      {
        id: adminId,
        email: 'linmu@example.com',
        name: '林沐',
        passwordHash: hashPassword('Admin123456'),
        createdAt: Date.now()
      }
    ]

    this.state.workspaces = [
      {
        id: defaultWorkspaceId,
        name: '远航出海团队',
        plan: 'team',
        ownerId: adminId,
        quotaLimit: 300,
        memberLimit: 10,
        createdAt: Date.now()
      }
    ]

    this.state.workspaceMembers = [
      {
        id: 'mem_001',
        workspaceId: defaultWorkspaceId,
        userId: adminId,
        role: 'owner',
        environmentIds: [],
        createdAt: Date.now()
      }
    ]

    this.state.subscriptions = [
      {
        id: 'sub_001',
        workspaceId: defaultWorkspaceId,
        plan: 'team',
        planName: '团队版',
        environmentQuota: 300,
        memberQuota: 10,
        status: 'active',
        expiresAt: Date.now() + 365 * 24 * 3600 * 1000
      }
    ]

    await this.persist()
  }

  async persist () {
    this.savePromise = this.savePromise.then(async () => {
      const tempPath = `${this.filePath}.${crypto.randomUUID()}.tmp`
      await fs.writeFile(tempPath, JSON.stringify(this.state, null, 2), 'utf8')
      await fs.rename(tempPath, this.filePath)
    })
    return this.savePromise
  }

  // User 操作
  findUserByEmail (email) {
    return this.state.users.find(u => u.email.toLowerCase() === email.toLowerCase())
  }

  findUserById (id) {
    return this.state.users.find(u => u.id === id)
  }

  async createUser ({ email, name, password }) {
    const user = {
      id: `usr_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      passwordHash: hashPassword(password),
      createdAt: Date.now()
    }
    this.state.users.push(user)
    await this.persist()
    return user
  }

  // Workspace 操作
  getWorkspace (id) {
    return this.state.workspaces.find(w => w.id === id)
  }

  getUserWorkspaces (userId) {
    const memberships = this.state.workspaceMembers.filter(m => m.userId === userId)
    return memberships.map(m => {
      const ws = this.getWorkspace(m.workspaceId)
      return {
        ...ws,
        role: m.role,
        environmentIds: m.environmentIds
      }
    }).filter(Boolean)
  }

  async createWorkspace ({ name, ownerId, plan = 'starter' }) {
    const wsId = `ws_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
    const quotaMap = { starter: 50, team: 300, scale: 1000 }
    const memberMap = { starter: 1, team: 10, scale: 30 }

    const workspace = {
      id: wsId,
      name: name.trim(),
      plan,
      ownerId,
      quotaLimit: quotaMap[plan] || 50,
      memberLimit: memberMap[plan] || 1,
      createdAt: Date.now()
    }
    this.state.workspaces.push(workspace)

    this.state.workspaceMembers.push({
      id: `mem_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
      workspaceId: wsId,
      userId: ownerId,
      role: 'owner',
      environmentIds: [],
      createdAt: Date.now()
    })

    this.state.subscriptions.push({
      id: `sub_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
      workspaceId: wsId,
      plan,
      planName: plan === 'team' ? '团队版' : plan === 'scale' ? '企业版' : '个人版',
      environmentQuota: quotaMap[plan] || 50,
      memberQuota: memberMap[plan] || 1,
      status: 'active',
      expiresAt: Date.now() + 30 * 24 * 3600 * 1000
    })

    await this.persist()
    return workspace
  }

  // 成员操作
  getWorkspaceMembers (workspaceId) {
    const members = this.state.workspaceMembers.filter(m => m.workspaceId === workspaceId)
    return members.map(m => {
      const user = this.findUserById(m.userId)
      return {
        id: m.id,
        userId: m.userId,
        name: user ? user.name : '未知',
        email: user ? user.email : '',
        role: m.role,
        environmentIds: m.environmentIds,
        createdAt: m.createdAt
      }
    })
  }

  async addWorkspaceMember (workspaceId, { userId, role = 'operator', environmentIds = [] }) {
    const member = {
      id: `mem_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
      workspaceId,
      userId,
      role,
      environmentIds,
      createdAt: Date.now()
    }
    this.state.workspaceMembers.push(member)
    await this.persist()
    return member
  }

  async removeWorkspaceMember (workspaceId, userId) {
    this.state.workspaceMembers = this.state.workspaceMembers.filter(
      m => !(m.workspaceId === workspaceId && m.userId === userId)
    )
    await this.persist()
  }

  // 环境操作
  listEnvironments (workspaceId) {
    return this.state.environments.filter(e => e.workspaceId === workspaceId)
  }

  getEnvironment (workspaceId, id) {
    return this.state.environments.find(e => e.workspaceId === workspaceId && e.id === id)
  }

  async saveEnvironment (workspaceId, record) {
    const existingIndex = this.state.environments.findIndex(
      e => e.workspaceId === workspaceId && e.id === record.id
    )

    const now = Date.now()
    const env = {
      ...record,
      workspaceId,
      updatedAt: now,
      metadataRevision: (record.metadataRevision || 1) + (existingIndex >= 0 ? 1 : 0)
    }

    if (existingIndex >= 0) {
      this.state.environments[existingIndex] = env
    } else {
      env.createdAt = now
      this.state.environments.push(env)
    }

    await this.persist()
    return env
  }

  async deleteEnvironment (workspaceId, id) {
    this.state.environments = this.state.environments.filter(
      e => !(e.workspaceId === workspaceId && e.id === id)
    )
    // 连带清理租约
    this.state.leases = this.state.leases.filter(l => l.environmentId !== id)
    await this.persist()
  }

  // 租约互斥操作 (防多开)
  getLease (environmentId) {
    const now = Date.now()
    const lease = this.state.leases.find(l => l.environmentId === environmentId)
    if (lease && lease.expiresAt > now) {
      return lease
    }
    return null
  }

  async acquireLease ({ workspaceId, environmentId, userId, deviceId, ttlMs = 60000 }) {
    const current = this.getLease(environmentId)
    const now = Date.now()

    if (current && current.deviceId !== deviceId) {
      const user = this.findUserById(current.userId)
      throw new Error(`环境已被成员 ${user?.name || current.userId} (设备: ${current.deviceId}) 占用，请稍后再试。`)
    }

    const fencingToken = (current?.fencingToken || 0) + 1
    const lease = {
      leaseId: `lease_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
      workspaceId,
      environmentId,
      userId,
      deviceId,
      fencingToken,
      issuedAt: now,
      expiresAt: now + ttlMs
    }

    this.state.leases = this.state.leases.filter(l => l.environmentId !== environmentId)
    this.state.leases.push(lease)
    await this.persist()
    return lease
  }

  async renewLease ({ leaseId, deviceId, ttlMs = 60000 }) {
    const lease = this.state.leases.find(l => l.leaseId === leaseId)
    if (!lease) throw new Error('租约不存在')
    if (lease.deviceId !== deviceId) throw new Error('租约设备不匹配')

    lease.expiresAt = Date.now() + ttlMs
    await this.persist()
    return lease
  }

  async releaseLease ({ leaseId, deviceId }) {
    this.state.leases = this.state.leases.filter(
      l => !(l.leaseId === leaseId && l.deviceId === deviceId)
    )
    await this.persist()
  }

  // 代理资源
  listProxies (workspaceId) {
    return this.state.proxies.filter(p => p.workspaceId === workspaceId)
  }

  async addProxy (workspaceId, proxyData) {
    const proxy = {
      id: `prx_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
      workspaceId,
      name: proxyData.name || '默认代理',
      protocol: proxyData.protocol || 'HTTP',
      host: proxyData.host,
      port: proxyData.port,
      username: proxyData.username || '',
      password: proxyData.password || '',
      status: 'active',
      latencyMs: proxyData.latencyMs || null,
      region: proxyData.region || '未知',
      createdAt: Date.now()
    }
    this.state.proxies.push(proxy)
    await this.persist()
    return proxy
  }

  // 审计日志
  listAuditLogs (workspaceId, limit = 50) {
    return this.state.auditLogs
      .filter(l => l.workspaceId === workspaceId)
      .slice(-limit)
      .reverse()
  }

  async recordAuditLog ({ workspaceId, userId, action, target, device, result = 'success', details = '' }) {
    const user = this.findUserById(userId)
    const log = {
      id: `aud_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`,
      workspaceId,
      userId,
      userName: user ? user.name : '系统',
      action,
      target,
      device: device || 'Web/桌面客户端',
      result,
      details,
      timestamp: Date.now()
    }
    this.state.auditLogs.push(log)
    await this.persist()
    return log
  }

  // 订阅配额
  getSubscription (workspaceId) {
    return this.state.subscriptions.find(s => s.workspaceId === workspaceId) || null
  }
}

module.exports = {
  DataStore
}
