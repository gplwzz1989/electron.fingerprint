const { randomUUID } = require('node:crypto')

const ROLES = ['owner', 'admin', 'operator', 'viewer']
const ACTIONS = {
  'environment:read': new Set(['owner', 'admin', 'operator', 'viewer']),
  'environment:run': new Set(['owner', 'admin', 'operator']),
  'environment:write': new Set(['owner', 'admin']),
  'environment:delete': new Set(['owner', 'admin']),
  'member:manage': new Set(['owner', 'admin']),
  'billing:manage': new Set(['owner']),
  'cookie:export': new Set(['owner'])
}

class WorkspaceAccessError extends Error {
  constructor (message) {
    super(message)
    this.name = 'WorkspaceAccessError'
  }
}

function clone (value) {
  return structuredClone(value)
}

function requiredString (value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new WorkspaceAccessError(`${label}不能为空。`)
  return value.trim()
}

function normalizeActor (actor) {
  if (!actor || typeof actor !== 'object') throw new WorkspaceAccessError('成员身份无效。')
  const workspaceId = requiredString(actor.workspaceId, '工作空间 ID')
  const userId = requiredString(actor.userId, '成员 ID')
  if (!ROLES.includes(actor.role)) throw new WorkspaceAccessError('成员角色无效。')
  if (actor.environmentIds !== undefined && !Array.isArray(actor.environmentIds)) throw new WorkspaceAccessError('环境授权范围格式无效。')
  const environmentIds = [...new Set((actor.environmentIds || []).map(id => requiredString(id, '环境 ID')))]
  return { workspaceId, userId, role: actor.role, environmentIds }
}

function authorize (actorInput, action, resource = {}) {
  const actor = normalizeActor(actorInput)
  if (!resource || typeof resource !== 'object' || Array.isArray(resource)) throw new WorkspaceAccessError('授权对象无效。')
  if (!ACTIONS[action]) throw new WorkspaceAccessError('不支持的权限操作。')
  if (requiredString(resource.workspaceId, '工作空间 ID') !== actor.workspaceId) {
    throw new WorkspaceAccessError('成员无权访问此工作空间。')
  }
  if (!ACTIONS[action].has(actor.role)) throw new WorkspaceAccessError('成员无权执行此操作。')
  if (resource.environmentId !== undefined) {
    const environmentId = requiredString(resource.environmentId, '环境 ID')
    if (!['owner', 'admin'].includes(actor.role) && !actor.environmentIds.includes(environmentId)) {
      throw new WorkspaceAccessError('成员无权访问此环境。')
    }
  }
  return true
}

class WorkspaceAccessStore {
  constructor ({ now = () => Date.now(), tokenFactory = randomUUID } = {}) {
    this.now = now
    this.tokenFactory = tokenFactory
    this.invites = new Map()
  }

  issueInvite (actor, input = {}) {
    const workspaceId = requiredString(input.workspaceId, '工作空间 ID')
    authorize(actor, 'member:manage', { workspaceId })
    const role = input.role || 'viewer'
    if (!['admin', 'operator', 'viewer'].includes(role)) throw new WorkspaceAccessError('邀请角色无效。')
    if (input.environmentIds !== undefined && !Array.isArray(input.environmentIds)) throw new WorkspaceAccessError('邀请环境范围格式无效。')
    const environmentIds = [...new Set((input.environmentIds || []).map(id => requiredString(id, '环境 ID')))]
    if (role !== 'admin' && environmentIds.length === 0) throw new WorkspaceAccessError('操作成员和只读成员必须指定环境范围。')
    const expiresAt = Number(input.expiresAt)
    if (!Number.isInteger(expiresAt) || expiresAt <= this.now()) throw new WorkspaceAccessError('邀请码有效期必须晚于当前时间。')
    const code = requiredString(this.tokenFactory(), '邀请码')
    const invite = {
      code,
      workspaceId,
      role,
      environmentIds,
      issuedBy: requiredString(actor.userId, '成员 ID'),
      issuedAt: this.now(),
      expiresAt,
      status: 'active',
      revokedAt: null,
      acceptedAt: null,
      acceptedBy: null
    }
    this.invites.set(code, invite)
    return clone(invite)
  }

  revokeInvite (actor, code) {
    const invite = this.getInvite(code)
    authorize(actor, 'member:manage', { workspaceId: invite.workspaceId })
    if (invite.status === 'active') {
      invite.status = 'revoked'
      invite.revokedAt = this.now()
    }
    return clone(invite)
  }

  acceptInvite (code, userId) {
    const invite = this.getInvite(code)
    if (invite.status === 'revoked') throw new WorkspaceAccessError('邀请码已撤销。')
    if (invite.status === 'accepted') throw new WorkspaceAccessError('邀请码已使用。')
    if (this.now() >= invite.expiresAt) {
      invite.status = 'expired'
      throw new WorkspaceAccessError('邀请码已过期。')
    }
    const memberId = requiredString(userId, '成员 ID')
    invite.status = 'accepted'
    invite.acceptedAt = this.now()
    invite.acceptedBy = memberId
    return {
      workspaceId: invite.workspaceId,
      userId: memberId,
      role: invite.role,
      environmentIds: [...invite.environmentIds]
    }
  }

  getInvite (code) {
    const normalized = requiredString(code, '邀请码')
    const invite = this.invites.get(normalized)
    if (!invite) throw new WorkspaceAccessError('邀请码不存在。')
    return invite
  }
}

module.exports = { ACTIONS, ROLES, WorkspaceAccessError, WorkspaceAccessStore, authorize }
