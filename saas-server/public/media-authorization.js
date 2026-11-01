;(function () {
  'use strict'
  let selectedPlatform = ''
  const currentContext = () => window.getMediaWorkspace?.() || {}
  const escape = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])

  async function api (path, method = 'GET', body) {
    let me
    try { me = await fetch('/api/auth/me', { credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(15000) }).then(response => response.json()) } catch { throw new Error('无法连接工作空间，请检查网络后重试。') }
    if (!me.ok) throw new Error('请先登录工作空间。')
    let response
    try { response = await fetch(path, { method, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': me.csrf }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(60000) }) } catch { throw new Error('请求未完成，请检查网络后重试。') }
    let data
    try { data = await response.json() } catch { throw new Error('服务响应异常，请稍后重试。') }
    if (!response.ok || !data.ok) throw new Error(data.message || '授权操作未完成，请重试。')
    return data
  }

  function notifyResult (message, success) {
    document.dispatchEvent(new CustomEvent('media:saved', { detail: { success, message } }))
    if (window.ShadcnUI?.notify) {
      window.ShadcnUI.notify(message, success ? 'success' : 'error')
    }
  }

  const handledTasks = new Set()
  const PENDING_STORAGE_KEY = 'media_pending_auth_tasks'

  function getPendingTasks () {
    try {
      const text = sessionStorage.getItem(PENDING_STORAGE_KEY)
      return text ? JSON.parse(text) : {}
    } catch { return {} }
  }

  function setPendingTask (taskId, taskInfo) {
    try {
      const map = getPendingTasks()
      map[taskId] = taskInfo
      sessionStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(map))
    } catch {}
  }

  function removePendingTask (taskId) {
    try {
      const map = getPendingTasks()
      delete map[taskId]
      sessionStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(map))
    } catch {}
  }

  async function handleTaskFinished (envelope) {
    const taskId = envelope?.taskId
    if (!taskId || handledTasks.has(taskId)) return
    const pendingMap = getPendingTasks()
    const record = pendingMap[taskId]
    if (!record) return

    handledTasks.add(taskId)
    removePendingTask(taskId)

    if (!envelope.ok || envelope.status === 'failed' || envelope.status === 'cancelled') {
      const errMessage = envelope.error || (envelope.status === 'cancelled' ? '授权任务已取消。' : '授权未完成，请重试。')
      notifyResult(`授权失败：${errMessage}`, false)
      return
    }

    try {
      const authResult = envelope.data?.result || envelope.data
      const tabId = envelope.data?.tabId || record.tabId
      console.log('%c[SaaS 授权任务] 准备提交账号保存请求:', 'color: #3b82f6; font-weight: bold;', {
        task: record.task,
        tabId,
        authResult
      })
      await saveAccount(record.task, authResult, tabId)
      notifyResult(record.task.mode === 'check' ? '账号授权有效。' : '账号授权成功，已添加到账号列表。', true)
    } catch (saveErr) {
      console.error('[SaaS 授权任务] 保存请求失败:', saveErr)
      notifyResult(`授权保存失败：${saveErr.message}`, false)
    }
  }

  // 页面加载或刷新时，自愈检查之前未完结的任务
  async function recoverPendingTasks () {
    const desktop = window.workspaceBridge
    if (!desktop?.queryTask) return
    const pendingMap = getPendingTasks()
    for (const [taskId, record] of Object.entries(pendingMap)) {
      if (handledTasks.has(taskId)) continue
      try {
        const envelope = await desktop.queryTask({ taskId })
        console.log('[SaaS 授权自愈检查] 查询任务状态:', { taskId, envelope })
        if (envelope?.status && envelope.status !== 'running' && envelope.status !== 'pending') {
          await handleTaskFinished(envelope)
        }
      } catch {}
    }
  }

  // 注册统一网关的全局事件 Push 监听
  if (window.workspaceBridge?.onTaskCompleted) {
    window.workspaceBridge.onTaskCompleted(envelope => {
      console.log('%c[SaaS 授权任务] 监听到 Push 事件:', 'color: #8b5cf6; font-weight: bold;', envelope)
      if (envelope?.type === 'platform:authorize') {
        void handleTaskFinished(envelope)
      }
    })
  }
  void recoverPendingTasks()

  async function saveAccount (task, result, tabId) {
    const context = currentContext()
    const workspaceId = context.workspaceId
    const path = task.mode === 'check' ? `/api/workspaces/${workspaceId}/accounts/${task.accountId}/check` : `/api/workspaces/${workspaceId}/authorizations`
    const payload = {
      operationId: task.id,
      mode: task.mode,
      platform: task.platformKey,
      environmentId: task.environmentId || '',
      accountId: task.accountId,
      expectedRevision: task.expectedRevision,
      result
    }
    const saved = await api(path, 'POST', payload)
    if (tabId && window.workspaceBridge?.closeTab) {
      window.workspaceBridge.closeTab(tabId).catch(() => {})
    }
    return saved
  }

  async function pollTask (taskId, tabId, task) {
    const desktop = window.workspaceBridge
    const timeoutAt = Date.now() + 15 * 60 * 1000
    while (Date.now() < timeoutAt) {
      await new Promise(resolve => setTimeout(resolve, 800))
      let state
      try {
        state = await desktop.pollPlatformTask({ id: taskId })
      } catch (err) {
        notifyResult(`授权失败：${err.message || '任务查询异常'}`, false)
        return
      }
      if (!state?.ok) {
        notifyResult(`授权失败：${state?.error || '平台任务已终止'}`, false)
        return
      }
      if (state.done) {
        if (state.error) {
          notifyResult(`授权失败：${state.error}`, false)
          return
        }
        try {
          await saveAccount(task, state.result, tabId)
          notifyResult(task.mode === 'check' ? '账号授权有效。' : '账号授权成功，已添加到账号列表。', true)
        } catch (saveErr) {
          notifyResult(`授权保存失败：${saveErr.message}`, false)
        }
        return
      }
    }
    notifyResult('授权超时，请重试。', false)
  }

  async function start (account = {}) {
    const desktop = window.workspaceBridge
    if (!desktop?.startPlatformTask) {
      window.ShadcnUI?.notify?.('请在桌面客户端中进行账号授权。', 'error')
      return
    }
    const context = currentContext()
    const workspaceId = context.workspaceId
    if (!workspaceId) {
      window.ShadcnUI?.notify?.('请先选择团队。', 'error')
      return
    }
    if (!context.canWrite) {
      window.ShadcnUI?.notify?.('当前角色无权授权账号，请联系管理员。', 'error')
      return
    }

    const platformKey = account?.platform || selectedPlatform
    if (!platformKey) {
      window.ShadcnUI?.notify?.('请先选择要授权的平台。', 'error')
      return
    }
    const environmentId = account?.environmentId || ''
    const mode = account?.checkOnly === true ? 'check' : account?.id ? 'reauthorize' : 'authorize'
    const randomId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : (window.crypto?.randomUUID ? window.crypto.randomUUID() : 'auth-' + Date.now())
    const task = {
      id: randomId,
      mode,
      platformKey,
      environmentId,
      accountId: account?.id || null,
      ...(Number.isInteger(account?.revision) ? { expectedRevision: account.revision } : {}),
      ...(account?.platformUserId ? { expectedUserId: account.platformUserId } : {})
    }

    // 若指定了环境，从服务端预备加密启动配置，确保跨设备或未曾打开过的环境也能直接使用，无需预先手动打开
    let launchData = null
    if (environmentId && desktop.prepareLaunch) {
      try {
        const prep = await desktop.prepareLaunch({ scope: workspaceId, resourceId: environmentId })
        if (prep?.ok) {
          const resp = await api(`/api/workspaces/${workspaceId}/environments/${environmentId}/launch`, 'POST', prep)
          if (resp?.envelope) {
            launchData = { requestId: prep.requestId, envelope: resp.envelope }
          }
        }
      } catch (err) {
        console.warn('[授权环境预备] 从服务端取得环境配置未完成，回退本地环境:', err)
      }
    }

    // 优先使用单一异步网关接口，若不支持则平滑回退旧版接口
    if (desktop.executeTask) {
      setPendingTask(randomId, { task, environmentId, startedAt: Date.now() })
      let started
      try {
        started = await desktop.executeTask({
          type: 'platform:authorize',
          taskId: randomId,
          payload: { task, scope: workspaceId, resourceId: environmentId, ...(launchData || {}) }
        })
      } catch (err) {
        removePendingTask(randomId)
        window.ShadcnUI?.notify?.(`创建授权标签页失败：${err.message || '未知错误'}`, 'error')
        return
      }
      if (!started?.ok) {
        removePendingTask(randomId)
        window.ShadcnUI?.notify?.(`创建授权标签页失败：${started?.error || '未知错误'}`, 'error')
        return
      }

      // 成功创建授权标签页，web端立即关闭弹窗，由 Push 事件监听处理结果
      if (window.WorkspaceUI?.closePage) window.WorkspaceUI.closePage()
      else if (window.WorkspaceUI?.closeDialog) window.WorkspaceUI.closeDialog()

      // 启动低频兜底查询（每 2.5 秒，以防 Push 丢失或断网）
      void (async () => {
        const timeoutAt = Date.now() + 15 * 60 * 1000
        while (Date.now() < timeoutAt) {
          await new Promise(resolve => setTimeout(resolve, 2500))
          if (handledTasks.has(randomId)) break
          try {
            const envelope = await desktop.queryTask({ taskId: randomId })
            if (envelope?.status && envelope.status !== 'running' && envelope.status !== 'pending') {
              await handleTaskFinished(envelope)
              break
            }
          } catch {}
        }
      })()
      return
    }

    // 兼容回退：立即启动平台任务
    let started
    try {
      started = await desktop.startPlatformTask({ task, scope: workspaceId, resourceId: environmentId, ...(launchData || {}) })
    } catch (err) {
      window.ShadcnUI?.notify?.(`创建授权标签页失败：${err.message || '未知错误'}`, 'error')
      return
    }
    if (!started?.ok) {
      window.ShadcnUI?.notify?.(`创建授权标签页失败：${started?.error || '未知错误'}`, 'error')
      return
    }

    // 成功创建授权标签页，web端立即关闭弹窗，不需要任何阻断等待，后台静默监听授权结果
    if (window.WorkspaceUI?.closePage) window.WorkspaceUI.closePage()
    else if (window.WorkspaceUI?.closeDialog) window.WorkspaceUI.closeDialog()

    // 异步监听授权结果，允许多个任务同时进行，互不影响
    void pollTask(started.id, started.tabId, task)
  }

  document.addEventListener('click', event => {
    const platform = event.target.closest('[data-platform-key]')
    if (platform) selectedPlatform = platform.dataset.platformKey

    const directStart = event.target.closest('[data-media-operation="start-direct"]')
    if (directStart) {
      event.preventDefault()
      event.stopImmediatePropagation()
      void start({ platform: selectedPlatform })
      return
    }

    const envBtn = event.target.closest('[data-media-environment]')
    if (envBtn) {
      event.preventDefault()
      event.stopImmediatePropagation()
      void start({ environmentId: envBtn.dataset.mediaEnvironment, platform: selectedPlatform })
    }
  }, true)

  document.addEventListener('media:reauthorize', event => {
    const account = event.detail
    if (!account) return
    void start(account)
  })

  document.addEventListener('workspace:render', async event => {
    if (event.detail?.route !== 'account-authorize') return
    const target = window.WorkspaceUI?.getSurface?.() || document.getElementById('page')
    try {
      const context = currentContext()
      const items = context.environments || []
      const list = target?.querySelector('[data-media-environments]')
      if (list) {
        list.innerHTML = items.length
          ? items.map(item => `<button class="authorization-environment-option" type="button" role="option" data-media-environment="${escape(item.id)}" ${context.canWrite ? '' : 'disabled'}><span>${escape(item.name)}</span><span aria-hidden="true">→</span></button>`).join('')
          : '<p class="authorization-environment-empty">暂无可用环境，可直接点击下方“不选环境，直接授权”。</p>'
      }
    } catch {}
  })
})()
