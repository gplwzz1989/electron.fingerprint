const assert = require('node:assert/strict')
const { WorkspaceAccessError, WorkspaceAccessStore, authorize } = require('../workspace-access')
const { WorkspaceLeaseStore } = require('../workspace-lease')

async function run () {
  let now = 1000
  const owner = { workspaceId: 'workspace-1', userId: 'owner-1', role: 'owner', environmentIds: [] }
  const operator = { workspaceId: 'workspace-1', userId: 'operator-1', role: 'operator', environmentIds: ['environment-1'] }
  const viewer = { workspaceId: 'workspace-1', userId: 'viewer-1', role: 'viewer', environmentIds: ['environment-1'] }
  assert.equal(authorize(viewer, 'environment:read', { workspaceId: 'workspace-1', environmentId: 'environment-1' }), true)
  await assert.rejects(async () => authorize(viewer, 'environment:read', { workspaceId: 'workspace-1', environmentId: 'environment-2' }), WorkspaceAccessError)
  await assert.rejects(async () => authorize(operator, 'environment:run', { workspaceId: 'workspace-2', environmentId: 'environment-1' }), /工作空间/)
  await assert.rejects(async () => authorize(viewer, 'cookie:export', { workspaceId: 'workspace-1' }), /无权/)

  const access = new WorkspaceAccessStore({ now: () => now, tokenFactory: () => 'invite-1' })
  const invite = access.issueInvite(owner, { workspaceId: 'workspace-1', role: 'operator', environmentIds: ['environment-1'], expiresAt: 2000 })
  assert.equal(access.acceptInvite(invite.code, 'operator-2').environmentIds[0], 'environment-1')
  await assert.rejects(async () => access.acceptInvite(invite.code, 'operator-3'), /已使用/)
  const revoked = access.issueInvite(owner, { workspaceId: 'workspace-1', role: 'viewer', environmentIds: ['environment-1'], expiresAt: 3000 })
  access.revokeInvite(owner, revoked.code)
  await assert.rejects(async () => access.acceptInvite(revoked.code, 'viewer-2'), /已撤销/)
  const expired = access.issueInvite(owner, { workspaceId: 'workspace-1', role: 'viewer', environmentIds: ['environment-1'], expiresAt: 1100 })
  now = 1100
  await assert.rejects(async () => access.acceptInvite(expired.code, 'viewer-3'), /已过期/)

  now = 2000
  const leases = new WorkspaceLeaseStore({ now: () => now, leaseFactory: () => 'lease-1' })
  const lease = leases.acquire(operator, { workspaceId: 'workspace-1', environmentId: 'environment-1', deviceId: 'device-1', ttlMs: 5000 })
  await assert.rejects(async () => leases.acquire({ ...operator, userId: 'operator-2', environmentIds: ['environment-1'] }, { workspaceId: 'workspace-1', environmentId: 'environment-1', deviceId: 'device-2', ttlMs: 5000 }), /占用/)
  assert.equal(leases.assertCanCommit(lease.leaseId, { userId: 'operator-1', deviceId: 'device-1', fencingToken: lease.fencingToken }), true)
  await assert.rejects(async () => leases.assertCanCommit(lease.leaseId, { userId: 'operator-1', deviceId: 'device-1', fencingToken: lease.fencingToken + 1 }), /版本已失效/)
  now = 8000
  await assert.rejects(async () => leases.renew(lease.leaseId, { userId: 'operator-1', deviceId: 'device-1', ttlMs: 5000 }), /已过期/)
  const nextLease = leases.acquire(operator, { workspaceId: 'workspace-1', environmentId: 'environment-1', deviceId: 'device-2', ttlMs: 5000 })
  assert.equal(nextLease.fencingToken, lease.fencingToken + 1, '新租约必须使用递增 fencingToken。')
  console.log('工作空间对象授权、邀请码撤销/过期和租约 fencingToken 自检通过。')
}

void run().catch(error => {
  console.error('工作空间与租约自检失败。', error)
  process.exitCode = 1
})
