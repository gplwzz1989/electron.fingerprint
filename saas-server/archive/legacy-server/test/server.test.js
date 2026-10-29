const assert = require('node:assert/strict')
const path = require('node:path')
const fs = require('node:fs/promises')
const os = require('node:os')
const http = require('node:http')
const { SaasServer } = require('../src/server')

async function request (url, options = {}) {
  const parsed = new URL(url)
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method: options.method || 'GET',
        headers: options.headers || {}
      },
      res => {
        let body = ''
        res.on('data', chunk => { body += chunk })
        res.on('end', () => {
          let json = null
          try { json = JSON.parse(body) } catch {}
          resolve({ status: res.statusCode, data: json, raw: body })
        })
      }
    )
    req.on('error', reject)
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body))
    }
    req.end()
  })
}

async function runTests () {
  console.log('--- 开始执行 SaaS 服务端全链路自动化回归测试 ---')
  const tempDir = path.join(os.tmpdir(), `saas-test-${Date.now()}`)
  const server = new SaasServer({ port: 0, dataDir: tempDir })
  const addr = await server.start()
  const baseUrl = `http://127.0.0.1:${addr.port}`

  try {
    // 1. 健康检查测试
    const health = await request(`${baseUrl}/api/v1/health`)
    assert.equal(health.status, 200)
    assert.equal(health.data.ok, true)
    console.log('✓ 1. 健康检查接口通过')

    // 2. 默认管理员登录
    const loginRes = await request(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: 'linmu@example.com', password: 'Admin123456' }
    })
    assert.equal(loginRes.status, 200)
    assert.ok(loginRes.data.token)
    assert.equal(loginRes.data.user.email, 'linmu@example.com')
    const token = loginRes.data.token
    const workspaceId = loginRes.data.workspaces[0].id
    console.log('✓ 2. 预置管理员登录与 Token 签发通过')

    // 3. 用户注册
    const regRes = await request(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: 'test_dev@example.com', password: 'Password123!', name: '测试开发者' }
    })
    assert.equal(regRes.status, 201)
    assert.ok(regRes.data.token)
    assert.equal(regRes.data.user.email, 'test_dev@example.com')
    console.log('✓ 3. 新用户注册与自动初始化工作空间通过')

    // 4. 环境云端同步与创建
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Device-Id': 'win-pc-office-01'
    }

    const envData = {
      id: 'env_cloud_test_01',
      profileName: '亚马逊北美站旗舰店',
      group: '电商运营',
      status: 'closed',
      fingerprint: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/138.0.0.0',
        canvas: { mode: 'noise', seed: 12345 }
      }
    }

    const createEnvRes = await request(`${baseUrl}/api/v1/workspaces/${workspaceId}/environments`, {
      method: 'POST',
      headers: authHeaders,
      body: envData
    })
    assert.equal(createEnvRes.status, 200)
    assert.equal(createEnvRes.data.environment.id, envData.id)

    const listEnvRes = await request(`${baseUrl}/api/v1/workspaces/${workspaceId}/environments`, {
      headers: authHeaders
    })
    assert.equal(listEnvRes.status, 200)
    assert.equal(listEnvRes.data.environments.length, 1)
    assert.equal(listEnvRes.data.environments[0].profileName, '亚马逊北美站旗舰店')
    console.log('✓ 4. 环境云端创建、元数据版本控制与列表查询通过')

    // 5. 分布式租约防多开（并发抢占加锁）
    // 设备 A 成功加锁
    const leaseResA = await request(`${baseUrl}/api/v1/workspaces/${workspaceId}/environments/${envData.id}/lease`, {
      method: 'POST',
      headers: authHeaders,
      body: { deviceId: 'win-pc-office-01', ttlMs: 10000 }
    })
    assert.equal(leaseResA.status, 200)
    assert.ok(leaseResA.data.lease.leaseId)
    const leaseId = leaseResA.data.lease.leaseId

    // 设备 B 尝试抢占同一环境 -> 必须被拦截并返回 409
    const leaseResB = await request(`${baseUrl}/api/v1/workspaces/${workspaceId}/environments/${envData.id}/lease`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Device-Id': 'mac-laptop-home-02'
      },
      body: { deviceId: 'mac-laptop-home-02', ttlMs: 10000 }
    })
    assert.equal(leaseResB.status, 409)
    assert.ok(leaseResB.data.error.includes('占用'))
    console.log('✓ 5. 分布式租约互斥（两设备并发防多开防顶号）验证通过')

    // 6. 租约续期与主动释放
    const renewRes = await request(`${baseUrl}/api/v1/workspaces/${workspaceId}/environments/${envData.id}/lease/renew`, {
      method: 'POST',
      headers: authHeaders,
      body: { leaseId, deviceId: 'win-pc-office-01', ttlMs: 20000 }
    })
    assert.equal(renewRes.status, 200)

    const releaseRes = await request(`${baseUrl}/api/v1/workspaces/${workspaceId}/environments/${envData.id}/lease/release`, {
      method: 'POST',
      headers: authHeaders,
      body: { leaseId, deviceId: 'win-pc-office-01' }
    })
    assert.equal(releaseRes.status, 200)

    // 释放后，设备 B 再次申请加锁 -> 应当成功
    const leaseResB2 = await request(`${baseUrl}/api/v1/workspaces/${workspaceId}/environments/${envData.id}/lease`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Device-Id': 'mac-laptop-home-02'
      },
      body: { deviceId: 'mac-laptop-home-02', ttlMs: 10000 }
    })
    assert.equal(leaseResB2.status, 200)
    console.log('✓ 6. 租约心跳续期、正常释放与跨设备平滑接管通过')

    // 7. 团队成员邀请与管理
    const inviteRes = await request(`${baseUrl}/api/v1/workspaces/${workspaceId}/members`, {
      method: 'POST',
      headers: authHeaders,
      body: { email: 'operator_chen@example.com', name: '陈悦', role: 'operator' }
    })
    assert.equal(inviteRes.status, 201)

    const membersRes = await request(`${baseUrl}/api/v1/workspaces/${workspaceId}/members`, {
      headers: authHeaders
    })
    assert.equal(membersRes.status, 200)
    assert.ok(membersRes.data.members.some(m => m.email === 'operator_chen@example.com'))
    console.log('✓ 7. 团队协同成员邀请、角色权限分配通过')

    // 8. 代理池管理
    const addProxyRes = await request(`${baseUrl}/api/v1/workspaces/${workspaceId}/proxies`, {
      method: 'POST',
      headers: authHeaders,
      body: {
        name: '美东静态原生 01',
        protocol: 'HTTP',
        host: '198.51.100.24',
        port: 8080,
        region: '美国 · 纽约'
      }
    })
    assert.equal(addProxyRes.status, 201)

    const proxiesRes = await request(`${baseUrl}/api/v1/workspaces/${workspaceId}/proxies`, {
      headers: authHeaders
    })
    assert.equal(proxiesRes.status, 200)
    assert.equal(proxiesRes.data.proxies.length, 1)
    console.log('✓ 8. 代理资源统一托管与分配查询通过')

    // 9. 订阅配额检查
    const billingRes = await request(`${baseUrl}/api/v1/workspaces/${workspaceId}/billing`, {
      headers: authHeaders
    })
    assert.equal(billingRes.status, 200)
    assert.equal(billingRes.data.usage.environments, 1)
    assert.equal(billingRes.data.usage.environmentQuota, 300)
    console.log('✓ 9. 商业化配额用量统计通过')

    // 10. 操作审计日志
    const auditRes = await request(`${baseUrl}/api/v1/workspaces/${workspaceId}/audit`, {
      headers: authHeaders
    })
    assert.equal(auditRes.status, 200)
    assert.ok(auditRes.data.logs.length >= 4)
    console.log('✓ 10. 团队操作审计存证流查询通过')

    console.log('\n========================================')
    console.log('🎉 恭喜！SaaS 服务端 10 大核心 API 链路全部测试通过！')
    console.log('========================================\n')
  } finally {
    await server.stop()
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})
  }
}

runTests().catch(err => {
  console.error('测试失败:', err)
  process.exit(1)
})
