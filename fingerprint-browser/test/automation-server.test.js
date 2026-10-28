const assert = require('node:assert/strict')
const { AutomationServer } = require('../automation-server')

async function run () {
  // 构造 mock 数据仓储和 mock 浏览器
  const mockEnvironments = [
    { id: 'env-1', name: '环境1', group: '未分组', url: 'https://example.com' }
  ]
  const openIds = new Set()

  const mockTabBrowser = {
    isOpen: id => openIds.has(id),
    open: async (profile, url) => {
      openIds.add(profile.id)
      return { success: true, tabId: 'tab-1' }
    },
    reopen: async id => {
      openIds.add(id)
      return { success: true, tabId: 'tab-reopened' }
    },
    closeEnvironment: async id => {
      openIds.delete(id)
      return { closed: true }
    },
    snapshot: () => ({
      tabs: Array.from(openIds).map(id => ({ id, title: `Tab ${id}` })),
      activeTabId: Array.from(openIds)[0] || null
    })
  }

  const mockEnvRepo = {
    list: () => [...mockEnvironments],
    remove: async id => {
      const idx = mockEnvironments.findIndex(e => e.id === id)
      if (idx !== -1) mockEnvironments.splice(idx, 1)
      return { pending: false }
    }
  }

  const mockProfileRepo = {
    list: () => [...mockEnvironments],
    save: async record => {
      mockEnvironments.push(record)
      return record
    }
  }

  const server = new AutomationServer({
    port: 0, // 自动绑定可用随机端口
    environmentRepository: mockEnvRepo,
    profileRepository: mockProfileRepo,
    tabBrowser: mockTabBrowser
  })

  const { port } = await server.start()
  const baseUrl = `http://127.0.0.1:${port}`
  const authorizedFetch = (url, options = {}) => fetch(url, { ...options, headers: { ...options.headers, Authorization: `Bearer ${server.token}` } })

  try {
    assert.equal((await fetch(`${baseUrl}/api/v1/health`)).status, 403, '无令牌请求必须拒绝。')
    assert.equal((await authorizedFetch(`${baseUrl}/api/v1/health`, { headers: { Origin: 'https://caller.example' } })).status, 200, '携带有效令牌时不限制网页来源。')
    assert.equal((await authorizedFetch(`${baseUrl}/api/v1/health`, { headers: { 'Sec-Fetch-Site': 'cross-site' } })).status, 200, '有效令牌允许跨站请求。')
    assert.equal((await fetch(`${baseUrl}/api/v1/health`, { headers: { Origin: 'https://caller.example' } })).status, 403, '跨域请求也必须持有有效令牌。')
    const preflight = await fetch(`${baseUrl}/api/v1/health`, { method: 'OPTIONS', headers: { Origin: 'https://caller.example', 'Access-Control-Request-Headers': 'authorization' } })
    assert.equal(preflight.status, 204); assert.equal(preflight.headers.get('access-control-allow-origin'), '*')
    // 1. 健康检查测试
    const healthRes = await authorizedFetch(`${baseUrl}/api/v1/health`)
    assert.equal(healthRes.status, 200)
    const healthJson = await healthRes.json()
    assert.equal(healthJson.ok, true)
    assert.equal(healthJson.status, 'running')
    assert.equal(healthJson.version, '0.1.0')

    // 2. 预设列表测试
    const presetsRes = await authorizedFetch(`${baseUrl}/api/v1/presets`)
    assert.equal(presetsRes.status, 200)
    const presetsJson = await presetsRes.json()
    assert.equal(presetsJson.ok, true)
    assert.ok(presetsJson.presets.length >= 3)

    // 3. 单个预设获取测试
    const presetDetailRes = await authorizedFetch(`${baseUrl}/api/v1/presets/win11-us-nvidia`)
    assert.equal(presetDetailRes.status, 200)
    const presetDetail = await presetDetailRes.json()
    assert.equal(presetDetail.preset.id, 'win11-us-nvidia')

    const unknownPresetRes = await authorizedFetch(`${baseUrl}/api/v1/presets/non-existent`)
    assert.equal(unknownPresetRes.status, 404)

    // 4. 环境列表
    const envsRes = await authorizedFetch(`${baseUrl}/api/v1/environments`)
    assert.equal(envsRes.status, 200)
    const envsJson = await envsRes.json()
    assert.equal(envsJson.ok, true)
    assert.equal(envsJson.count, 1)
    assert.equal(envsJson.environments[0].isOpen, false)

    // 5. 启动环境
    const startRes = await authorizedFetch(`${baseUrl}/api/v1/environments/env-1/start`, { method: 'POST' })
    assert.equal(startRes.status, 200)
    const startJson = await startRes.json()
    assert.equal(startJson.ok, true)
    assert.equal(openIds.has('env-1'), true)

    // 查看启动状态
    const envDetailRes = await authorizedFetch(`${baseUrl}/api/v1/environments/env-1`)
    const envDetail = await envDetailRes.json()
    assert.equal(envDetail.environment.isOpen, true)

    // 6. 停止环境
    const stopRes = await authorizedFetch(`${baseUrl}/api/v1/environments/env-1/stop`, { method: 'POST' })
    assert.equal(stopRes.status, 200)
    assert.equal(openIds.has('env-1'), false)

    // 7. 使用预设一键创建环境
    const createRes = await authorizedFetch(`${baseUrl}/api/v1/environments/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'auto-env-2',
        name: '自动化预设环境',
        presetId: 'win11-us-nvidia'
      })
    })
    assert.equal(createRes.status, 201)
    const createJson = await createRes.json()
    assert.equal(createJson.ok, true)
    assert.equal(createJson.environment.fingerprint.graphics.webglVendor, 'Google Inc. (NVIDIA)')

    // 8. GPU 推荐与审计接口测试
    const gpuRecRes = await authorizedFetch(`${baseUrl}/api/v1/gpu/recommend?platform=Win32`)
    assert.equal(gpuRecRes.status, 200)
    const gpuRec = await gpuRecRes.json()
    assert.ok(gpuRec.recommendations.length >= 2)

    const gpuAuditRes = await authorizedFetch(`${baseUrl}/api/v1/gpu/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enabled: true,
        modules: { webgl: true, navigator: true },
        hardware: { platform: 'Win32', concurrency: 8 },
        graphics: {
          webglVendor: 'Google Inc. (NVIDIA)',
          webglRenderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)'
        },
        screen: { width: 1920, height: 1080 }
      })
    })
    assert.equal(gpuAuditRes.status, 200)
    const gpuAuditJson = await gpuAuditRes.json()
    assert.equal(gpuAuditJson.audit.consistent, true)

    // 测试一键随机物理自洽硬件接口
    const randomHwRes = await authorizedFetch(`${baseUrl}/api/v1/fingerprint/random-hardware?platform=Win32`)
    assert.equal(randomHwRes.status, 200)
    const randomHwJson = await randomHwRes.json()
    assert.equal(randomHwJson.ok, true)
    assert.equal(randomHwJson.hardware.hardware.platform, 'Win32')
    assert.ok(randomHwJson.hardware.graphics.webglRenderer.length > 0)

    // 9. 拟人化行为动作接口测试 (actions: click, type, scroll, drag)
    const actionEvents = []
    mockTabBrowser.getTab = () => ({
      view: {
        webContents: {
          sendInputEvent: evt => actionEvents.push(evt)
        }
      }
    })
    mockTabBrowser.activeId = 'tab-1'

    const clickRes = await authorizedFetch(`${baseUrl}/api/v1/actions/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x: 150, y: 150 })
    })
    assert.equal(clickRes.status, 200)
    assert.ok(actionEvents.some(e => e.type === 'mouseDown'))

    const scrollRes = await authorizedFetch(`${baseUrl}/api/v1/actions/scroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deltaY: 200 })
    })
    assert.equal(scrollRes.status, 200)
    assert.ok(actionEvents.some(e => e.type === 'mouseWheel'))

    const typeRes = await authorizedFetch(`${baseUrl}/api/v1/actions/type`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'ok', options: { typoRate: 0, baseInterval: 10 } })
    })
    assert.equal(typeRes.status, 200)
    assert.ok(actionEvents.some(e => e.type === 'char' && e.keyCode === 'o'))

    // 10. 404 路由验证
    const notFoundRes = await authorizedFetch(`${baseUrl}/api/v1/unknown-endpoint`)
    assert.equal(notFoundRes.status, 404)

    console.log('自动化 REST API 服务与环境控制测试通过。')
  } finally {
    await server.stop()
  }
}

void run()
