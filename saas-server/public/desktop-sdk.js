;(function () {
  'use strict'
  // SaaS 自己负责登录会话和业务路由；桌面基座只接收公开协议中的密文。
  const desktop = window.desktopBridge
  if (!desktop || desktop.protocolVersion !== 1) return
  const mapTabs = snapshot => ({ ...snapshot, tabs: (snapshot.tabs || []).map(tab => ({ ...tab, profileId: tab.externalReference?.resourceId || tab.profileId })) })
  window.workspaceBridge = {
    ...desktop,
    launch: async payload => {
      let request
      try {
        if (!payload || !/^[a-zA-Z0-9-]+$/.test(payload.workspaceId) || !/^[a-zA-Z0-9-]+$/.test(payload.environmentId)) throw new Error('环境标识无效。')
        const healthResponse = await fetch('/api/health', { credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(15000) })
        const health = await healthResponse.json()
        if (!healthResponse.ok || !health.ok) throw new Error('SaaS 服务暂不可用，请稍后重试。')
        if (Array.isArray(health.launchProtocols) && !health.launchProtocols.includes('desktop-launch-v1')) throw new Error('SaaS 服务仍是旧版本，请更新并重启服务后再启动环境。')
        request = await desktop.prepareLaunch({ scope: payload.workspaceId, resourceId: payload.environmentId })
        if (!request.ok) throw new Error(request.error || '客户端启动请求创建失败。')
        const meResponse = await fetch('/api/auth/me', { credentials: 'same-origin', signal: AbortSignal.timeout(15000) })
        const me = await meResponse.json()
        if (!meResponse.ok || !me.ok) throw new Error('登录已失效，请重新登录。')
        const response = await fetch(`/api/workspaces/${payload.workspaceId}/environments/${payload.environmentId}/launch`, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': me.csrf }, body: JSON.stringify(request), signal: AbortSignal.timeout(60000) })
        const data = await response.json()
        if (!response.ok || !data.ok) throw new Error(data.message || '无法取得环境启动配置。')
        if (data.envelope?.format !== 'desktop-launch-v1') throw new Error('SaaS 返回的启动协议不兼容，请更新并重启服务后重试。')
        return await desktop.launchEncrypted({ requestId: request.requestId, envelope: data.envelope, ...(payload.capabilities === undefined ? {} : { capabilities: payload.capabilities }), ...(payload.allowedOrigins === undefined ? {} : { allowedOrigins: payload.allowedOrigins }) })
      } catch (error) { return { ok: false, error: error.name === 'Error' ? error.message : '环境启动失败，请检查网络后重试。' } }
    },
    tabs: async () => mapTabs(await desktop.tabs()),
    onTabsChanged: callback => desktop.onTabsChanged(snapshot => callback(mapTabs(snapshot)))
  }
})()
