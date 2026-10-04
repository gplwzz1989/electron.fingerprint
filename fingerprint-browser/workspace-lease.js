const { randomUUID } = require('node:crypto')
const { WorkspaceAccessError, authorize } = require('./workspace-access')

function clone (value) {
  return structuredClone(value)
}

function requiredString (value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new WorkspaceAccessError(`${label}不能为空。`)
  return value.trim()
}

class WorkspaceLeaseStore {
  constructor ({ now = () => Date.now(), leaseFactory = randomUUID } = {}) {
    this.now = now
    this.leaseFactory = leaseFactory
    this.leases = new Map()
    this.nextFencingToken = new Map()
  }

  acquire (actor, input = {}) {
    const workspaceId = requiredString(input.workspaceId, '工作空间 ID')
    const environmentId = requiredString(input.environmentId, '环境 ID')
    authorize(actor, 'environment:run', { workspaceId, environmentId })
    const current = this.leases.get(environmentId)
    if (current && current.expiresAt > this.now()) throw new WorkspaceAccessError('环境已被其他设备占用。')
    const ttlMs = Number(input.ttlMs)
    if (!Number.isInteger(ttlMs) || ttlMs < 1000 || ttlMs > 24 * 60 * 60 * 1000) throw new WorkspaceAccessError('租约时长无效。')
    const fencingToken = (this.nextFencingToken.get(environmentId) || 0) + 1
    const lease = {
      leaseId: requiredString(this.leaseFactory(), '租约 ID'),
      workspaceId,
      environmentId,
      userId: requiredString(actor.userId, '成员 ID'),
      deviceId: requiredString(input.deviceId, '设备 ID'),
      fencingToken,
      issuedAt: this.now(),
      expiresAt: this.now() + ttlMs
    }
    this.nextFencingToken.set(environmentId, fencingToken)
    this.leases.set(environmentId, lease)
    return clone(lease)
  }

  renew (leaseId, input = {}) {
    const lease = this.find(leaseId)
    this.assertCurrent(lease, input)
    const ttlMs = Number(input.ttlMs)
    if (!Number.isInteger(ttlMs) || ttlMs < 1000 || ttlMs > 24 * 60 * 60 * 1000) throw new WorkspaceAccessError('租约时长无效。')
    lease.expiresAt = this.now() + ttlMs
    return clone(lease)
  }

  assertCanCommit (leaseId, input = {}) {
    const lease = this.find(leaseId)
    this.assertCurrent(lease, input)
    if (Number(input.fencingToken) !== lease.fencingToken) throw new WorkspaceAccessError('租约版本已失效，禁止提交。')
    return true
  }

  release (leaseId, input = {}) {
    const lease = this.find(leaseId)
    this.assertCurrent(lease, input)
    this.leases.delete(lease.environmentId)
    return true
  }

  find (leaseId) {
    const normalized = requiredString(leaseId, '租约 ID')
    const lease = [...this.leases.values()].find(item => item.leaseId === normalized)
    if (!lease) throw new WorkspaceAccessError('租约不存在或已失效。')
    return lease
  }

  assertCurrent (lease, input) {
    if (lease.expiresAt <= this.now()) {
      this.leases.delete(lease.environmentId)
      throw new WorkspaceAccessError('租约已过期。')
    }
    if (requiredString(input.deviceId, '设备 ID') !== lease.deviceId || requiredString(input.userId, '成员 ID') !== lease.userId) {
      throw new WorkspaceAccessError('当前设备或成员不是租约持有者。')
    }
    if (input.workspaceId !== undefined && requiredString(input.workspaceId, '工作空间 ID') !== lease.workspaceId) {
      throw new WorkspaceAccessError('租约不属于此工作空间。')
    }
  }
}

module.exports = { WorkspaceLeaseStore }
