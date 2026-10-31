;(function () {
  'use strict'
  let selectedPlatform = ''; let running = null; let retrySave = null; let recovery = null; let recovering = false; let saving = false; let confirming = false; let renderRevision = 0
  let detachedAuthorization = false
  let authorizationModalClosed = false; let closingAfterSave = false
  const surface = () => window.WorkspaceUI?.getSurface?.() || document.getElementById('page')
  const currentContext = () => window.getMediaWorkspace?.() || {}
  const sameContext = context => context?.workspaceId === currentContext().workspaceId && context?.userId === currentContext().userId
  function assertContext (context) {
    if (!sameContext(context) || context.controller?.signal.aborted) throw new Error('授权上下文已变化或已取消，请重新开始。')
  }
  const escape = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
  async function api (path, method = 'GET', body) {
    let me
    try { me = await fetch('/api/auth/me', { credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(15000) }).then(response => response.json()) } catch { throw new Error('无法连接工作空间，请检查网络后重试。') }
    if (!me.ok) throw new Error('请先登录工作空间。')
    let response
    try { response = await fetch(path, { method, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': me.csrf }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(60000) }) } catch { throw new Error('请求未完成，请检查网络后重试。') }
    let data
    try { data = await response.json() } catch { throw new Error('服务响应异常，请稍后重试。') };  if (!response.ok || !data.ok) { console.error('[授权诊断] ' + JSON.stringify({ action: path.split('/').at(-1), status: response.status, code: data.errorCode || '' })); throw Object.assign(new Error(data.message || '授权操作未完成，请重试。'), { status: response.status }) }; return data
  }
  function status (message, error = false) {
    message = typeof message === 'string' && message ? message : '正在等待平台授权…'
    if (detachedAuthorization || surface()?.querySelector('[data-media-environments]')) {
      document.dispatchEvent(new CustomEvent('media:notice', { detail: { message, error, pending: !error && !message.startsWith('已取消'), retry: error && Boolean(retrySave || recovery) } })); return
    }
    if (authorizationModalClosed) return
    const target = surface()
    if (!target?.querySelector('#media-auth-status')) target?.insertAdjacentHTML('afterbegin', '<p id="media-auth-status" class="notice" aria-live="polite"></p>')
    const box = target?.querySelector('#media-auth-status')
    if (box) { box.textContent = message; box.classList.toggle('status-error', error); box.setAttribute('role', error ? 'alert' : 'status') }
  }
  async function loadRuntime (signal) {
    if (signal?.aborted) throw new Error('已取消授权。')
    const desktop = window.workspaceBridge
    if (!desktop?.platformStatus) throw new Error('请升级客户端以使用独立平台能力。')
    const result = await desktop.platformStatus()
    if (!result?.ok) throw new Error(result?.error || '客户端平台能力不可用。')
    if (result.protocol !== 'platform-runtime-v3') throw new Error('请更新客户端后再授权账号。')
  }
  async function runPlatform ({ task, scope, resourceId, signal, onProgress }) {
    const desktop = window.workspaceBridge
    const started = await desktop.startPlatformTask({ task, scope, resourceId })
    if (!started?.ok) throw new Error(started?.error || '客户端授权环境启动失败。')
    const abort = () => { void desktop.cancelPlatformTask({ id: started.id }).catch(() => {}) }
    signal.addEventListener('abort', abort, { once: true })
    let finished = false
    try {
      while (!signal.aborted) {
        const state = await desktop.pollPlatformTask({ id: started.id })
        if (!state?.ok) throw new Error(state?.error || '平台任务已结束。')
        onProgress(state.message)
        if (state.done) { finished = true; if (state.error) throw new Error(state.error); return { result: state.result, tabId: started.tabId } }
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      throw new Error('已取消授权。')
    } finally { signal.removeEventListener('abort', abort); if (!finished) await desktop.cancelPlatformTask({ id: started.id }).catch(() => {}) }
  }
  async function save (pending) {
    if (saving) throw new Error('正在保存授权，请稍候。')
    assertContext(pending); saving = true
    try {
      status('授权成功，正在保存账号会话…')
      const result = await api(pending.path, 'POST', { operationId: pending.task.id, mode: pending.task.mode, platform: pending.task.platformKey, environmentId: pending.task.environmentId, accountId: pending.task.accountId, expectedRevision: pending.task.expectedRevision, result: pending.envelope })
      assertContext(pending); confirming = true
      retrySave = null
      // 入库成功后才关闭本任务标签，界面收尾失败不能把授权成功改成失败。
      const warnings = []
      try { const closed = await window.workspaceBridge.closeTab(pending.tabId); if (!closed?.ok) throw new Error() } catch { warnings.push('账号已保存，授权窗口未能自动关闭，请手动关闭。') }
      try { const dashboard = await window.workspaceBridge.dashboard(); if (!dashboard?.ok) throw new Error() } catch { warnings.push('账号已保存，请手动返回首页查看账号列表。') }
      if (sameContext(pending)) {
        status('授权已保存，正在刷新账号列表。')
        closingAfterSave = true
        try {
          if (window.WorkspaceUI?.getRoute?.() === 'account-authorize') {
            if (window.WorkspaceUI.closePage) window.WorkspaceUI.closePage()
            else window.WorkspaceUI.closeDialog?.()
          }
          location.hash = 'accounts'
        } finally { closingAfterSave = false }
        document.dispatchEvent(new CustomEvent('media:saved', { detail: { success: result.outcome !== 'invalid', message: pending.task?.mode === 'check' ? result.outcome === 'invalid' ? '账号登录已失效，请重新授权。' : '账号授权有效。' : pending.task?.mode === 'reauthorize' ? '账号已重新授权。' : '账号授权成功，已添加到账号列表。', warning: warnings.join(' ') } }))
      }
    } catch (error) {
      throw error
    } finally { saving = false; confirming = false }
  }
  async function cancel () {
    if (confirming) throw new Error('正在确认保存结果，请等待完成后再操作。')
    ;(running || recovery?.controller || retrySave?.controller)?.abort()
    retrySave = null; recovery = null
    status('已取消授权。')
  }
  async function retry () {
    if (retrySave) return save(retrySave)
    throw new Error('当前没有待保存的授权结果，请重新开始授权。')
  }
  async function start (account) {
    if (running || saving || recovering) throw new Error('已有授权正在进行，请先取消或完成。')
    if (retrySave || recovery) throw new Error('上次授权尚未保存，请先重试保存或取消。')
    const desktop = window.workspaceBridge
    if (!desktop?.startPlatformTask) throw new Error('请在支持账号授权的新版客户端中操作。')
    const environmentId = account?.environmentId || surface()?.querySelector('#field-account-authorize-0-1')?.value
    if (!environmentId) throw new Error('请先选择独立浏览器环境。')
    const context = currentContext(); const workspaceId = context.workspaceId
    if (!workspaceId) throw new Error('请先选择团队。')
    if (!context.canWrite) throw new Error('当前角色无权授权账号，请联系管理员。')
    detachedAuthorization = Boolean(window.WorkspaceUI?.closeAllPages)
    if (detachedAuthorization) window.WorkspaceUI.closeAllPages()
    running = new AbortController(); const controller = running
    Object.assign(controller, { workspaceId: context.workspaceId, userId: context.userId })
    context.controller = controller
    try {
      await loadRuntime(controller.signal); assertContext(context)
      const mode = account?.checkOnly === true ? 'check' : account?.id ? 'reauthorize' : 'authorize'
      const task = { id: crypto.randomUUID(), mode, platformKey: account?.platform || selectedPlatform, environmentId, accountId: account?.id || null, ...(Number.isInteger(account?.revision) ? { expectedRevision: account.revision } : {}), ...(account?.platformUserId ? { expectedUserId: account.platformUserId } : {}) }
      assertContext(context)
      const runnerController = new AbortController(); controller.signal.addEventListener('abort', () => runnerController.abort(), { once: true })
      const savePath = mode === 'check' ? `/api/workspaces/${workspaceId}/accounts/${account.id}/check` : `/api/workspaces/${workspaceId}/authorizations`
      recovery = { ...context, path: savePath, task, tabId: null, runnerController, runnerPromise: null }
      const pending = recovery
      pending.runnerPromise = runPlatform({ task, scope: workspaceId, resourceId: environmentId, signal: runnerController.signal, onProgress: message => { if (sameContext(context)) status(message) } })
      const completed = await pending.runnerPromise
      pending.tabId = completed.tabId
      const envelope = completed.result
      if (envelope?.operationId !== task.id || (mode === 'check' ? !['valid', 'invalid'].includes(envelope?.outcome) : envelope?.outcome !== 'valid')) throw new Error('客户端未确认授权成功，服务端未收到授权数据。')
      assertContext(context)
      retrySave = { ...pending, envelope }; recovery = null
      await save(retrySave)
    } catch (error) {
      if (!retrySave || controller.signal.aborted || !sameContext(context)) { if (controller.signal.aborted || !sameContext(context)) retrySave = null; recovery = null }
      if (sameContext(context) && !controller.signal.aborted) await desktop.dashboard().catch(() => {})
      throw error
    } finally { running = null }
  }
  document.addEventListener('click', event => {
    const platform = event.target.closest('[data-platform-key]'); if (platform) selectedPlatform = platform.dataset.platformKey
    const environment = event.target.closest('[data-media-environment]')
    const button = environment || event.target.closest('[data-media-operation]'); if (!button) return
    event.preventDefault(); event.stopImmediatePropagation()
    button.disabled = true
    Promise.resolve().then(() => {
      if (button.dataset.mediaOperation === 'cancel') return cancel()
      if (button.dataset.mediaOperation === 'retry') return retry()
      return environment ? start({ environmentId: environment.dataset.mediaEnvironment, platform: selectedPlatform }) : start()
    }).catch(error => status(error.message, true)).finally(() => { button.disabled = false })
  }, true)
  document.addEventListener('media:reauthorize', event => {
    const account = event.detail
    if (!account) return
    try {
      window.WorkspaceUI?.openPage?.('account-authorize', { platform: account.platform })
      void start(account).catch(error => status(error.message, true))
    } catch { status('授权面板暂时无法打开，请重试。', true) }
  })
  document.addEventListener('media:context-changing', () => { void cancel().catch(error => status(error.message, true)) })
  document.addEventListener('workspace:modal-closed', event => {
    if (event.detail?.pageId !== 'account-authorize') return
    authorizationModalClosed = true; renderRevision++
    // 关闭授权面板只停止任务与观察，保留已扫码环境和平台登录态。
    if (!detachedAuthorization && !closingAfterSave && !confirming) void cancel().catch(() => {})
  })
  document.addEventListener('workspace:render', async event => {
    const revision = ++renderRevision
    if (running && !sameContext({ workspaceId: running.workspaceId, userId: running.userId })) running.abort()
    if (retrySave && !sameContext(retrySave)) { retrySave.controller?.abort(); retrySave = null }
    if (recovery && !sameContext(recovery)) { const stale = recovery; recovery = null; stale.controller.abort() }
    if (event.detail?.route !== 'account-authorize') return
    authorizationModalClosed = false
    const target = surface()
    const footer = target?.querySelector('.form-footer')
    if (footer) {
      const actions = footer.querySelector('div'); if (actions) actions.innerHTML = '<button class="button" data-media-operation="cancel">取消授权</button><button class="button" data-media-operation="retry">重试保存</button><button class="button primary" data-media-operation="start">开始授权</button>'
      if (!target.querySelector('#media-auth-status')) footer.insertAdjacentHTML('beforebegin', '<p id="media-auth-status" class="notice" role="status" aria-live="polite">请选择独立环境后开始授权。</p>')
    }
    try {
      const context = currentContext(); const workspaceId = context.workspaceId
      if (!workspaceId) return
      const items = context.environments
      if (!Array.isArray(items)) throw new Error('环境列表尚未加载，请刷新工作空间后重试。')
      if (revision !== renderRevision || !sameContext(context)) return
      const list = target?.querySelector('[data-media-environments]')
      if (list) list.innerHTML = items.length ? items.map(item => `<button class="authorization-environment-option" type="button" role="option" data-media-environment="${escape(item.id)}" ${context.canWrite ? '' : 'disabled'}><span>${escape(item.name)}</span><span aria-hidden="true">→</span></button>`).join('') : '<p class="authorization-environment-empty">暂无可用环境，请先创建浏览器环境。</p>'
      const select = target?.querySelector('#field-account-authorize-0-1')
      if (select) select.innerHTML = '<option value="">选择独立浏览器环境</option>' + items.map(item => `<option value="${escape(item.id)}">${escape(item.name)}</option>`).join('')
    } catch (error) { status(error.message, true) }
  })
})()
