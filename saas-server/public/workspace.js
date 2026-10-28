(function () {
  'use strict'
  const state = { user: null, workspaces: [], workspaceId: '', csrf: '', ready: false, lists: {}, editFingerprint: null, editEnvironment: null, selectedMember: null, proxyCheck: null, timezoneAcknowledged: false, page: 1, busy: false }
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
  const labelRole = role => ({ owner: '所有者', admin: '管理员', operator: '操作成员', viewer: '只读成员' })[role] || '未分配'
  const timestamp = value => value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '尚未检查'
  const currentWorkspace = () => state.workspaces.find(item => item.id === state.workspaceId)
  const canWrite = () => ['owner', 'admin', 'operator'].includes(currentWorkspace()?.role)
  const canAdmin = () => ['owner', 'admin'].includes(currentWorkspace()?.role)
  const base = () => `/api/workspaces/${state.workspaceId}`
  let viewRevision = 0
  let nativeTabs = { tabs: [], activeId: null }
  let clientUpdate = null
  let fingerprintDefaultsRequest = null
  async function loadFingerprintDefaults () {
    if (fingerprintDefaultsRequest) return fingerprintDefaultsRequest
    fingerprintDefaultsRequest = request('/api/fingerprint-defaults').then(data => { if (['fingerprint-create', 'fingerprint-protection'].includes(window.WorkspaceUI.getRoute()) && !state.editFingerprint) window.WorkspaceUI.setFingerprint(data.profile, '') }).finally(() => { fingerprintDefaultsRequest = null })
    return fingerprintDefaultsRequest
  }
  const registration = { emailDeliveryAvailable: null, email: '', resendAt: 0, timer: null }
  const payment = { workspaceId: '', planId: '', order: null, requestId: '', timer: null }
  const amountLabel = value => `¥${(value / 100).toFixed(2)}`
  const orderStatus = value => ({ creating: '等待平台确认', pending: '待付款', paid: '已支付', expired: '支付码已过期', review: '已付款，待核对' })[value] || '待核对'
  let invitationInProgress = false
  async function acceptPendingInvitation () {
    const invitation = location.hash.match(/^#invite\/([^/]+)\/([^/]+)\/([^/]+)$/)
    if (!invitation || !state.user || invitationInProgress) return
    invitationInProgress = true
    try {
      if (!confirm('是否接受此团队邀请？')) { history.replaceState(null, '', '#overview'); window.WorkspaceUI.render(); return }
      await request(`/api/workspaces/${encodeURIComponent(invitation[1])}/invitations/${encodeURIComponent(invitation[2])}/accept`, 'POST', { token: invitation[3] })
      const current = await request('/api/auth/me')
      state.workspaces = current.workspaces; state.workspaceId = invitation[1]
      await reload(); history.replaceState(null, '', '#members'); window.WorkspaceUI.render(); noticeResult('已加入受邀团队。')
    } catch (error) { history.replaceState(null, '', '#overview'); window.WorkspaceUI.render(); showError(error.message) } finally { invitationInProgress = false }
  }
  function renderNativeTabs (snapshot) {
    if (!snapshot?.tabs) return
    nativeTabs = snapshot
    const toolbar = document.querySelector('.native-toolbar')
    if (!toolbar) return
    toolbar.querySelector('.native-tabs').innerHTML = `<div class="native-tab ${snapshot.activeId ? '' : 'active'}"><button data-native-operation="dashboard" title="切回指纹、环境和账号管理页面">管理工作台</button></div>${snapshot.tabs.map(tab => `<div class="native-tab ${snapshot.activeId === tab.id ? 'active' : ''}"><button data-native-operation="select" data-tab-id="${escape(tab.id)}">${escape(tab.title || tab.profileName)}</button><button data-native-operation="close" data-tab-id="${escape(tab.id)}" aria-label="关闭${escape(tab.profileName)}标签">×</button></div>`).join('')}`
    renderNativeAddress()
  }
  function renderNativeAddress () {
    const address = document.querySelector('.native-address input')
    if (!address) return
    const activeTab = nativeTabs.tabs.find(tab => tab.id === nativeTabs.activeId)
    address.value = activeTab?.url || location.href
    address.readOnly = !activeTab
    address.setAttribute('aria-label', activeTab ? '网页地址' : 'SaaS 页面地址（只读）')
    address.title = address.value
  }
  async function closeNativeTabs () {
    if (!window.workspaceBridge) return
    for (const tab of [...nativeTabs.tabs].filter(tab => tab.kind !== 'ordinary' || tab.ownerEnvironmentId)) {
      const result = await window.workspaceBridge.closeTab(tab.id)
      if (!result.ok) throw new Error('部分浏览器环境未能关闭，请先关闭后重试。')
    }
    await window.workspaceBridge.dashboard()
  }

  async function request (url, method = 'GET', body) {
    let response
    try { response = await fetch(url, { method, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...(state.csrf ? { 'X-CSRF-Token': state.csrf } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }) } catch { throw new Error('无法连接工作空间服务，请检查网络后重试。') }
    const data = await response.json().catch(() => ({ message: '服务返回异常，请稍后重试。' }))
    if (!response.ok || !data.ok) {
      if (response.status === 401) { state.user = null; state.csrf = ''; try { await closeNativeTabs() } catch { showError('登录已失效，请关闭仍在运行的浏览器环境。') } updateShell() }
      throw new Error(data.message || '操作未完成，请稍后重试。')
    }
    return data
  }
  function showError (message, modal = false) {
    const container = modal ? document.querySelector('#modal-root .platform-picker') : document.getElementById('page')
    if (!container) return
    let panel = container.querySelector('.operation-error')
    if (!panel) { panel = document.createElement('div'); panel.className = 'notice error operation-error'; panel.setAttribute('role', 'alert'); container.prepend(panel) }
    panel.textContent = message
  }
  function clearError () { document.querySelectorAll('.operation-error').forEach(node => node.remove()) }
  function validateFormInputs (container) {
    const fields = container.matches?.('input') ? [container] : [...container.querySelectorAll('input')]
    let firstInvalid = null
    for (const field of fields) {
      const label = field.closest('.field')
      label?.querySelector('.field-error')?.remove(); field.removeAttribute('aria-invalid')
      if (field.checkValidity()) continue
      const title = label?.querySelector('span')?.textContent.replace(/\s*\*$/, '') || '此项'
      const message = field.validity.valueMissing ? `请填写${title}。` : field.type === 'email' ? '请填写完整、有效的邮箱地址。' : field.name === 'verificationCode' ? '请输入六位数字验证码。' : field.validity.tooShort ? '密码至少需要十二个字符。' : '请检查输入内容。'
      field.setAttribute('aria-invalid', 'true')
      const error = document.createElement('small'); error.className = 'field-error'; error.textContent = message; label?.append(error)
      firstInvalid ||= field
    }
    if (firstInvalid) { firstInvalid.focus(); showError('请检查标红的输入项。', true); return false }
    return true
  }
  function noticeResult (message) {
    let node = document.getElementById('workspace-result')
    if (!node) { node = document.createElement('div'); node.id = 'workspace-result'; node.className = 'workspace-result'; node.setAttribute('role', 'status'); document.querySelector('.shell').append(node) }
    node.textContent = message; setTimeout(() => node.remove(), 5000)
  }
  function updateShell () {
    const login = document.querySelector('.topbar [data-route="signin"]')
    if (login) login.textContent = state.user ? state.user.name : '登录'
    document.querySelector('.logout-button')?.remove()
    if (state.user) document.querySelector('.topbar-actions').insertAdjacentHTML('beforeend', '<button class="row-action logout-button" data-operation="logout">退出登录</button>')
    const switcher = document.querySelector('.workspace-switch')
    if (state.user) {
      switcher.disabled = false; switcher.innerHTML = `<span>${escape(currentWorkspace()?.name || '选择团队')}<small>${escape(labelRole(currentWorkspace()?.role))}</small></span>`
      switcher.setAttribute('aria-label', '切换团队')
    } else { switcher.disabled = true; switcher.innerHTML = '<span>选择团队<small>登录后加载团队</small></span>' }
  }
  async function reload () {
    if (!state.user || !state.workspaceId) { state.lists = {}; return }
    const resources = ['fingerprints', 'environments', 'proxies', 'accounts', 'members', 'billing', 'settings']
    const results = await Promise.all(resources.map(resource => request(`${base()}/${resource}`)))
    state.lists = Object.fromEntries(resources.map((name, index) => [name, results[index].items || results[index]]))
    document.documentElement.classList.toggle('reduce-motion', Boolean(state.lists.settings?.settings?.reduceMotion))
  }
  function routeTo (route) { if (location.hash === `#${route}`) window.WorkspaceUI.render(); else location.hash = route }
  function actions (items) { return items.map(item => `<button class="row-action${item.danger ? ' danger' : ''}" type="button" data-operation="${item.action}" data-id="${escape(item.id)}" ${item.disabled ? 'disabled' : ''}>${escape(item.label)}</button>`).join('') }
  function cells (route, item) {
    if (route === 'fingerprints') return [`${escape(item.name)}<small>版本 ${item.version}</small>`, escape(`Chrome ${item.profile.browser.chromiumMajor} / ${item.profile.hardware.platform}`), escape(`${item.profile.locale.language} / ${item.profile.locale.timezone}`), String((state.lists.environments || []).filter(environment => environment.fingerprintId === item.id).length), escape(timestamp(item.updatedAt)), actions([{ action: 'edit-fingerprint', id: item.id, label: '编辑', disabled: !canWrite() }, { action: 'remove-fingerprint', id: item.id, label: '移除', danger: true, disabled: !canWrite() }])]
    if (route === 'environments' || route === 'overview') {
      const fingerprint = state.lists.fingerprints?.find(record => record.id === item.fingerprintId)
      const proxy = state.lists.proxies?.find(record => record.id === item.proxyId)
      const values = [escape(item.name), escape(`${fingerprint?.name || '指纹快照'} · 版本 ${item.fingerprintVersion}`), escape(proxy?.name || '直连'), window.workspaceBridge ? nativeTabs.tabs.some(tab => tab.profileId === item.id) ? '运行中' : '未运行' : '请在客户端查看', escape(timestamp(item.updatedAt)), actions([{ action: 'launch-environment', id: item.id, label: '启动', disabled: !window.workspaceBridge || !canWrite() }, { action: 'edit-environment', id: item.id, label: '编辑', disabled: !canWrite() }, { action: 'remove-environment', id: item.id, label: '移除', danger: true, disabled: !canWrite() }])]
      return route === 'overview' ? values.filter((_value, index) => index !== 4) : values
    }
    if (route === 'proxies') return [escape(item.name), escape(`${item.protocol.toUpperCase()} · ${item.host}:${item.port}`), `<span class="${item.status === 'available' ? 'status-valid' : 'status-error'}">${item.status === 'available' ? '已检测可用' : '检测失败'}</span><small>${escape(timestamp(item.checkedAt))}</small>`, escape(item.timezone), String((state.lists.environments || []).filter(environment => environment.proxyId === item.id).length), actions([{ action: 'check-proxy', id: item.id, label: '重新检测', disabled: !canWrite() }, { action: 'remove-proxy', id: item.id, label: '移除', danger: true, disabled: !canWrite() }])]
    if (route === 'members') return [escape(item.name), escape(labelRole(item.role)), item.scope.mode === 'all' ? '全部资源' : `${item.scope.ids.length} 项资源`, '已加入', escape(item.email), actions([{ action: 'permissions', id: item.id, label: '权限', disabled: !canAdmin() || item.role === 'owner' }, { action: 'remove-member', id: item.id, label: '移除', danger: true, disabled: !canAdmin() || item.role === 'owner' || item.userId === state.user?.id }])]
    return [escape(item.name), escape(item.status), escape(item.environmentName), escape(timestamp(item.checkedAt)), '']
  }
  function populateTable (route) {
    const table = document.querySelector('#page .table-panel table')
    if (!table) return
    const resource = route === 'overview' ? 'environments' : route
    let records = state.lists[resource] || []
    if (!Array.isArray(records)) return
    const query = document.getElementById(`search-${route}`)?.value.trim().toLowerCase()
    if (query) records = records.filter(item => [item.name, item.id, item.email, item.host].some(value => String(value || '').toLowerCase().includes(query)))
    if (route === 'accounts') {
      const platform = document.getElementById('filter-accounts-0')?.value
      if (platform && platform !== '全部平台') { const key = window.QijieProductDesign.pages.find(page => page.id === 'account-platforms').platforms.find(item => item.name === platform)?.key; records = records.filter(item => item.platform === key) }
      const status = document.getElementById('filter-accounts-1')?.value
      if (status && status !== '全部授权状态') records = records.filter(item => ({ valid: '授权有效', expired: '待重新授权', error: '授权异常' })[item.status] === status)
      const environment = document.getElementById('filter-accounts-2')?.value
      if (environment) records = records.filter(item => item.environmentId === environment)
    }
    if (route === 'fingerprints') { const platform = document.getElementById('filter-fingerprints-0')?.value; if (platform) records = records.filter(item => item.profile.hardware.platform === platform) }
    if (route === 'members') { const role = document.getElementById('filter-members-0')?.value; if (role) records = records.filter(item => item.role === role) }
    if (route === 'proxies') {
      const protocol = document.getElementById('filter-proxies-0')?.value; if (protocol) records = records.filter(item => item.protocol === protocol)
      const status = document.getElementById('filter-proxies-1')?.value; if (status) records = records.filter(item => item.status === status)
    }
    if (route === 'environments') {
      const proxy = document.getElementById('filter-environments-1')?.value
      if (proxy) records = records.filter(item => proxy === 'direct' ? !item.proxyId : Boolean(item.proxyId))
      const running = document.getElementById('filter-environments-0')?.value
      if (running) records = records.filter(item => nativeTabs.tabs.some(tab => tab.profileId === item.id) === (running === 'open'))
    }
    const size = route === 'overview' ? 5 : state.lists.settings?.settings?.pageSize || 20
    const pages = Math.max(1, Math.ceil(records.length / size)); state.page = Math.min(state.page, pages)
    const visible = records.slice((state.page - 1) * size, state.page * size)
    const tbody = table.tBodies[0]
    if (visible.length) tbody.innerHTML = visible.map(item => `<tr>${cells(route, item).map(value => `<td>${value}</td>`).join('')}</tr>`).join('')
    else {
      const config = window.QijieProductDesign.pages.find(page => page.id === route)?.table
      tbody.innerHTML = `<tr><td colspan="${table.rows[0].cells.length}"><div class="empty-state"><h2>${state.user ? escape(query ? '没有找到匹配记录' : config?.emptyTitle || '暂无记录') : '登录后查看团队资源'}</h2><p>${state.user ? escape(query ? '请调整搜索或筛选条件。' : config?.emptyText || '') : '使用工作空间账户登录，或注册并创建团队。'}</p>${!state.user ? '<button class="button primary" data-operation="login">登录工作空间</button>' : ''}</div></td></tr>`
    }
    const panel = table.closest('.table-panel'); panel.querySelector('.pagination')?.remove()
    if (state.user && route !== 'overview') panel.insertAdjacentHTML('beforeend', `<div class="pagination"><span>共 ${records.length} 条</span><button class="button" data-operation="page-back" ${state.page <= 1 ? 'disabled' : ''}>上一页</button><span>${state.page} / ${pages}</span><button class="button" data-operation="page-next" ${state.page >= pages ? 'disabled' : ''}>下一页</button></div>`)
  }
  const input = (route, group, index) => document.getElementById(`field-${route}-${group}-${index}`)
  function setOptions (select, options, prompt, selected = '') {
    if (!select) return
    select.replaceChildren(new Option(prompt, ''))
    options.forEach(item => select.add(new Option(item.label, item.value)))
    select.value = selected
  }
  function assignAction (label, operation, enabled) {
    document.querySelectorAll('#page button,#modal-root button').forEach(button => { if (button.textContent.trim() === label) { button.dataset.operation = operation; button.disabled = !enabled } })
  }
  function prepareFilters (route) {
    const set = (index, options, prompt) => { const select = document.getElementById(`filter-${route}-${index}`); if (select) setOptions(select, options, prompt, select.value) }
    if (route === 'fingerprints') set(0, [{ label: 'Windows', value: 'Win32' }, { label: 'macOS', value: 'MacIntel' }, { label: 'Linux', value: 'Linux x86_64' }], '全部平台类型')
    if (route === 'members') set(0, ['owner', 'admin', 'operator', 'viewer'].map(role => ({ label: labelRole(role), value: role })), '全部角色')
    if (route === 'proxies') { set(0, [{ label: 'HTTP / HTTPS', value: 'http' }, { label: 'SOCKS5', value: 'socks5' }], '全部协议'); set(1, [{ label: '已检测可用', value: 'available' }, { label: '检测失败', value: 'unavailable' }], '全部检测状态') }
    if (route === 'environments') { set(0, [{ label: '运行中', value: 'open' }, { label: '未运行', value: 'closed' }], '全部运行状态'); const status = document.getElementById('filter-environments-0'); if (status) status.disabled = !window.workspaceBridge; set(1, [{ label: '直连', value: 'direct' }, { label: '使用代理', value: 'proxy' }], '全部网络连接') }
    if (route === 'accounts') set(2, (state.lists.environments || []).map(item => ({ label: item.name, value: item.id })), '全部环境')
  }
  function prepareEnvironment () {
    const edit = state.editEnvironment
    const fingerprints = (state.lists.fingerprints || []).map(item => ({ label: `${item.name} · 版本 ${item.version}`, value: `${item.id}@${item.version}` }))
    if (edit && !fingerprints.some(item => item.value === `${edit.fingerprintId}@${edit.fingerprintVersion}`)) fingerprints.push({ label: `当前锁定指纹 · 版本 ${edit.fingerprintVersion}`, value: `${edit.fingerprintId}@${edit.fingerprintVersion}` })
    setOptions(input('environment-create', 1, 0), fingerprints, '选择已保存指纹', edit ? `${edit.fingerprintId}@${edit.fingerprintVersion}` : '')
    setOptions(input('environment-create', 2, 1), (state.lists.proxies || []).map(item => ({ label: `${item.name} · ${item.timezone}`, value: item.id })), '请选择代理', edit?.proxyId || '')
    if (edit) {
      input('environment-create', 0, 0).value = edit.name; input('environment-create', 0, 1).value = edit.startUrl
      input('environment-create', 2, 0).value = edit.proxyId ? '选择已有代理' : '不使用代理'
      input('environment-create', 2, 0).dispatchEvent(new Event('change', { bubbles: true }))
    }
    assignAction('创建环境', 'save-environment', Boolean(state.user && canWrite()))
    updateEnvironmentSummary()
  }
  function updateEnvironmentSummary () {
    const selected = input('environment-create', 1, 0)?.value
    if (!selected) return
    const [id, version] = selected.split('@'); const fingerprint = state.lists.fingerprints?.find(item => item.id === id)
    document.querySelectorAll('[data-summary-label]').forEach(node => {
      if (node.dataset.summaryLabel === '已选指纹') node.textContent = `${fingerprint?.name || '锁定指纹'} · 版本 ${version}`
      if (node.dataset.summaryLabel === '指纹兼容性') node.textContent = '客户端启动时检查'
      if (node.dataset.summaryLabel === '时区一致性' && input('environment-create', 2, 0)?.value === '不使用代理') node.textContent = fingerprint?.profile.locale.timezone || state.editEnvironment?.fingerprint.locale.timezone || '等待指纹信息'
    })
  }
  function renderSettings () {
    const main = document.querySelector('.form-main'); if (!main) return
    const settings = state.lists.settings?.settings || { reduceMotion: false, pageSize: 20 }
    main.innerHTML = `<section class="form-section"><h2>团队界面设置</h2><div class="field-grid"><label class="field"><span>每页条数</span><select id="settings-page-size">${[10, 20, 50].map(size => `<option ${settings.pageSize === size ? 'selected' : ''}>${size}</option>`).join('')}</select></label><label class="field"><span>界面动效</span><select id="settings-motion"><option value="false">标准动效</option><option value="true" ${settings.reduceMotion ? 'selected' : ''}>减少动效</option></select></label></div></section><footer class="form-footer"><span>设置按团队保存。</span><button class="button primary" data-operation="save-settings" ${!canAdmin() ? 'disabled' : ''}>保存设置</button></footer>`
    if (window.workspaceBridge?.updateStatus) { main.insertAdjacentHTML('beforeend', '<section class="form-section client-update-panel" aria-live="polite"></section>'); renderClientUpdates() }
  }
  function renderClientUpdates () {
    const panel = document.querySelector('.client-update-panel'); if (!panel) return
    const update = clientUpdate || { status: 'checking', message: '正在读取客户端更新状态。' }
    panel.innerHTML = `<h2>客户端更新</h2><p>当前版本：${escape(update.currentVersion || '读取中')}${update.version ? ` · 可用版本：${escape(update.version)}` : ''}</p><p class="${update.status === 'error' ? 'error' : ''}" ${update.status === 'error' ? 'role="alert"' : ''}>${escape(update.message)}${update.status === 'downloading' ? ` ${Number(update.progress) || 0}%` : ''}</p>${update.notes ? `<p>${escape(update.notes)}</p>` : ''}<button class="button" data-operation="check-client-updates" ${['disabled', 'checking', 'downloading', 'installing'].includes(update.status) ? 'disabled' : ''}>检查更新</button> <button class="button primary" data-operation="install-client-update" ${update.status === 'ready' ? '' : 'disabled'}>安装更新</button>`
  }
  function renderBilling () {
    const billing = state.lists.billing
    if (!billing) return
    const values = [billing.subscription?.name || '未开通', String(billing.usage.fingerprints), String(billing.usage.environments), String(billing.usage.members)]
    const labels = ['当前订阅', '已保存指纹', '浏览器环境', '团队成员']
    document.querySelector('.usage-grid').innerHTML = labels.map((label, index) => `<div class="surface usage-card"><span>${label}</span><b>${escape(values[index])}</b></div>`).join('')
    const notice = document.querySelector('#page .notice')
    if (notice) notice.textContent = billing.subscription ? `${billing.subscription.active ? '订阅有效' : '订阅已到期'} · ${timestamp(billing.subscription.expiresAt)}。有效期内可续费当前套餐，续费时长自动接续。` : '当前团队尚未开通订阅，用量来自已保存的实际资源。'
    const tbody = document.querySelector('#page .table-panel tbody')
    const size = 5; const pages = Math.max(1, Math.ceil(billing.orders.length / size)); state.page = Math.max(1, Math.min(state.page, pages))
    if (tbody && billing.orders.length) tbody.innerHTML = billing.orders.slice((state.page - 1) * size, state.page * size).map(order => `<tr><td>${escape(order.id)}<small>${escape(timestamp(order.createdAt))}</small></td><td>${escape(order.plan.name)}</td><td>${amountLabel(order.amount)}</td><td>${escape(order.method === 'wechat' ? '微信支付' : '支付宝')}</td><td>${escape(orderStatus(order.status))}${canAdmin() ? `<button class="row-action" data-operation="open-order" data-id="${escape(order.id)}">查看</button>` : ''}</td></tr>`).join('')
    document.querySelector('#page .pagination')?.remove()
    if (pages > 1) tbody.closest('.table-panel').insertAdjacentHTML('beforeend', `<div class="pagination"><span>最近 ${billing.orders.length} 条订单</span><button class="button" data-operation="page-back" ${state.page <= 1 ? 'disabled' : ''}>上一页</button><span>${state.page} / ${pages}</span><button class="button" data-operation="page-next" ${state.page >= pages ? 'disabled' : ''}>下一页</button></div>`)
  }
  function renderPlans () {
    const billing = state.lists.billing
    const table = document.querySelector('#page .table-panel')
    if (!table) return
    const notice = document.querySelector('#page .notice')
    if (!billing?.plans.length) { if (notice) notice.textContent = '当前暂无在售套餐，请稍后查看。'; return }
    if (notice) notice.textContent = '价格以当前团队的订单为准。有效期内仅支持当前套餐续费，续费时长自动接续。'
    table.querySelector('tbody').innerHTML = billing.plans.map(plan => `<tr><td><strong>${escape(plan.name)}</strong></td><td>${plan.periodDays} 天</td><td>${plan.quotas.environments} 个环境 / ${plan.quotas.fingerprints} 个指纹</td><td>${plan.quotas.members} 位成员</td><td>${amountLabel(plan.amount)} <button class="row-action" data-operation="choose-plan" data-id="${escape(plan.id)}" ${!canAdmin() || (billing.subscription?.active && billing.subscription.id !== plan.id) ? 'disabled' : ''}>${billing.subscription?.active && billing.subscription.id === plan.id ? '续费' : '选择'}</button></td></tr>`).join('')
  }
  function renderPayment () {
    if (payment.workspaceId !== state.workspaceId) { payment.workspaceId = state.workspaceId; payment.order = null; payment.planId = ''; payment.requestId = '' }
    const billing = state.lists.billing; const panel = document.querySelector('#page .payment-panel')
    if (!panel) return
    const order = payment.order
    const plan = order?.plan || billing?.plans.find(item => item.id === payment.planId)
    const summary = document.querySelector('#page .summary')
    if (summary) summary.innerHTML = plan ? `<h2>订阅权益</h2><dl><div><dt>浏览器环境</dt><dd>${plan.quotas.environments} 个</dd></div><div><dt>可复用指纹</dt><dd>${plan.quotas.fingerprints} 个</dd></div><div><dt>团队成员</dt><dd>${plan.quotas.members} 位</dd></div></dl><p>付款确认后开通权益；当前套餐续费时长自动接续。</p>` : '<h2>订单确认</h2><p>选择套餐后显示实际价格与权益。</p>'
    if (!plan) { panel.innerHTML = '<div class="empty-state"><h2>请先选择套餐</h2><p>选择套餐后确认金额与付款方式。</p><a class="button primary" href="#plans" data-route="plans">选择套餐</a></div>'; return }
    const methods = billing.paymentMethods
    const selected = panel.querySelector('[name="payment-method"]:checked')?.value || methods.find(method => method.enabled)?.key || ''
    panel.innerHTML = `<h2>确认订单</h2><div class="detail-rows"><div><span>套餐</span><b>${escape(plan.name)}</b></div><div><span>订阅时长</span><b>${plan.periodDays} 天</b></div><div><span>应付金额</span><b>${amountLabel(order?.amount || plan.amount)}</b></div></div>${order ? `<p>订单：${escape(order.id)}</p><p role="status">${escape(orderStatus(order.status))}</p>` : `<h2>选择付款方式</h2><div class="payment-methods">${methods.map(method => `<label><input type="radio" name="payment-method" value="${method.key}" ${method.enabled ? method.key === selected ? 'checked' : '' : 'disabled'}><b>${escape(method.name)}</b>${!method.enabled ? '<small>暂未开放</small>' : ''}</label>`).join('')}</div>`}<div class="payment-code">${order?.hasPaymentCode ? `<img class="payment-qr" src="${base()}/orders/${order.id}/code" alt="${escape(order.method === 'wechat' ? '微信' : '支付宝')}订单付款二维码"><p>使用${order.method === 'wechat' ? '微信' : '支付宝'}扫一扫。有效至 ${escape(timestamp(order.expiresAt))}。</p>` : `<h3>${order?.status === 'paid' ? '付款已确认' : order?.status === 'review' ? '付款已收到，正在核对权益' : order ? '请查询原订单的付款结果' : '确认后生成付款码'}</h3><p>${order?.status === 'paid' ? '订阅权益已更新，可返回查看。' : '付款结果以平台确认记录为准。'}</p>`}</div><footer class="form-footer"><span>请核对套餐、金额和付款方式。</span><div><a class="button" href="#billing" data-route="billing">返回订阅</a>${order ? `<button class="button primary" data-operation="refresh-payment" ${['paid', 'review'].includes(order.status) ? 'disabled' : ''}>查询付款结果</button>` : `<button class="button primary" data-operation="create-payment" ${!canAdmin() || !methods.some(method => method.enabled) ? 'disabled' : ''}>获取支付码</button>`}</div></footer>`
  }
  function pollPayment () {
    clearTimeout(payment.timer)
    if (window.WorkspaceUI.getRoute() !== 'payment' || !['creating', 'pending'].includes(payment.order?.status) || !payment.order?.expiresAt || payment.order.expiresAt <= Date.now()) return
    const workspaceId = state.workspaceId; const id = payment.order.id
    payment.timer = setTimeout(async () => {
      if (document.hidden || window.WorkspaceUI.getRoute() !== 'payment') { pollPayment(); return }
      try {
        const result = await request(`${base()}/orders/${id}/refresh`, 'POST', {})
        if (workspaceId !== state.workspaceId || payment.order?.id !== id) return
        payment.order = result.order
        if (['paid', 'review'].includes(result.order.status)) await reload()
        renderPayment(); pollPayment()
      } catch (error) { showError(error.message) }
    }, 15000)
  }
  async function render () {
    const revision = ++viewRevision; const route = window.WorkspaceUI.getRoute()
    if (['fingerprint-create', 'fingerprint-protection'].includes(route) && state.user && !window.WorkspaceUI.getFingerprint().profile.id) {
      await loadFingerprintDefaults()
      if (revision !== viewRevision) return
    }
    const requiresContext = {
      'fingerprint-detail': 'fingerprints', 'fingerprint-compatibility': 'fingerprints', 'environment-detail': 'environments', 'timezone-conflict': 'environments', 'proxy-failure': 'proxies',
      'account-authorize': 'accounts', 'account-login': 'accounts', 'account-confirm': 'accounts', 'account-save-error': 'accounts', 'account-reauthorize': 'accounts', 'account-mismatch': 'accounts', 'payment-pending': 'billing'
    }
    if (requiresContext[route]) { routeTo(requiresContext[route]); noticeResult('请从具体记录进入操作流程。'); return }
    updateShell()
    if (route === 'overview') document.querySelector('#page h1').textContent = state.user ? `欢迎回来，${state.user.name}` : '欢迎使用栖界'
    if (state.user) document.querySelectorAll('#page .form-footer>span').forEach(node => { if (node.textContent.includes('登录后')) node.textContent = canWrite() ? '修改将保存到当前团队。' : '当前角色为只读，无法保存修改。' })
    prepareFilters(route)
    assignAction('保存到指纹库', 'save-fingerprint', Boolean(state.user && canWrite() && window.WorkspaceUI.getFingerprint().profile.id && !window.WorkspaceUI.getFingerprint().generating))
    assignAction('发送邀请', 'invite-member', Boolean(state.user && canAdmin()))
    assignAction('创建邀请', 'invite-member', Boolean(state.user && canAdmin()))
    if (['overview', 'fingerprints', 'environments', 'proxies', 'accounts', 'members'].includes(route)) populateTable(route)
    if (route === 'environment-create') prepareEnvironment()
    if (route === 'settings') renderSettings()
    if (route === 'billing' && state.user) renderBilling()
    if (route === 'plans' && state.user) renderPlans()
    if (route === 'payment') { renderPayment(); pollPayment() } else clearTimeout(payment.timer)
    if (route === 'member-permissions') renderPermissions()
    if (route === 'member-invite') setOptions(input('member-invite', 0, 1), [{ label: '操作成员', value: 'operator' }, { label: '只读成员', value: 'viewer' }], '选择角色')
    if (['plans', 'payment'].includes(route) && !state.lists.billing?.paymentMethods.some(method => method.enabled)) {
      const target = document.querySelector('#page .form-main,#page .payment-panel,#page .state-content') || document.getElementById('page')
      if (!target.querySelector('.payment-unavailable')) target.insertAdjacentHTML('afterbegin', '<div class="notice warning payment-unavailable">在线付款暂未开放，请稍后再试。</div>')
      document.querySelectorAll('.payment-methods input').forEach(input => { input.disabled = true })
    }
    if (revision !== viewRevision) return
  }
  function prepareDialog (pageId) {
    if (pageId === 'signin') {
      document.querySelector('.signin-form').noValidate = true
      assignAction('登录', 'signin', true)
      document.querySelector('.signin-form [data-operation="signin"]').type = 'submit'
      document.querySelector('.signin-form input[type="email"]').required = true
      document.querySelector('.signin-form input[type="password"]').required = true
      document.querySelector('.signin-form').insertAdjacentHTML('beforeend', '<p class="auth-switch"><button type="button" data-operation="show-register">没有账户？注册并创建团队</button></p>')
    }
    if (pageId === 'proxy-create') assignAction('检测并保存', 'save-proxy', Boolean(state.user && canWrite()))
    if (pageId === 'account-platforms') {
      const page = window.QijieProductDesign.pages.find(item => item.id === 'account-platforms')
      document.querySelectorAll('[data-platform-key]').forEach(button => { const platform = page.platforms.find(item => item.key === button.dataset.platformKey); button.disabled = !state.user || platform.disabled })
    }
  }
  function registerForm () {
    const form = document.querySelector('.signin-form')
    form.classList.add('is-registration')
    form.innerHTML = `<section class="form-section"><div class="field-grid">${[['姓名', 'name', 'text'], ['团队名称', 'workspaceName', 'text'], ['邮箱', 'email', 'email']].map(([label, name, type]) => `<label class="field${name === 'email' ? ' full' : ''}"><span>${label}</span><input required name="${name}" type="${type}" autocomplete="${name === 'email' ? 'email' : name === 'name' ? 'name' : 'organization'}"></label>`).join('')}<div class="verification-code-row field full"><label class="field"><span>邮箱验证码</span><input required name="verificationCode" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code" placeholder="六位数字验证码"></label><button class="button" type="button" data-operation="send-registration-code" disabled>获取验证码</button></div><label class="field full"><span>密码（至少十二个字符）</span><input required name="password" type="password" minlength="12" maxlength="256" autocomplete="new-password"></label></div><p class="registration-feedback" role="status" aria-live="polite">正在检查邮件服务…</p></section><footer class="platform-picker-footer"><button class="button" type="button" data-operation="show-signin">返回登录</button><button class="button primary" type="submit" data-operation="register" disabled>验证邮箱并注册</button></footer>`
    document.getElementById('signin-title').textContent = '注册工作空间'
    const describeAvailability = () => {
      if (!form.isConnected) return
      const feedback = form.querySelector('.registration-feedback')
      feedback.classList.toggle('error', registration.emailDeliveryAvailable === false)
      feedback.textContent = registration.emailDeliveryAvailable ? '验证码五分钟内有效，六十秒后可以重新获取。' : '验证码邮件服务暂未配置，请稍后注册或联系管理员。'
      updateRegistrationCountdown()
    }
    if (registration.emailDeliveryAvailable === null) void request('/api/auth/registration-options').then(data => { registration.emailDeliveryAvailable = data.emailDeliveryAvailable; describeAvailability() }).catch(error => showError(error.message, true))
    else describeAvailability()
    clearInterval(registration.timer)
    registration.timer = setInterval(() => { if (!form.isConnected) { clearInterval(registration.timer); return } updateRegistrationCountdown() }, 1000)
  }
  function updateRegistrationCountdown () {
    const button = document.querySelector('[data-operation="send-registration-code"]')
    if (!button || button.getAttribute('aria-busy') === 'true') return
    const email = document.querySelector('.signin-form [name="email"]')?.value.trim().toLowerCase()
    const seconds = email === registration.email ? Math.max(0, Math.ceil((registration.resendAt - Date.now()) / 1000)) : 0
    button.disabled = !registration.emailDeliveryAvailable || seconds > 0
    button.textContent = seconds ? `${seconds} 秒后重新获取` : '获取验证码'
    const submit = document.querySelector('[data-operation="register"]')
    if (submit && submit.getAttribute('aria-busy') !== 'true') submit.disabled = registration.emailDeliveryAvailable !== true
  }
  function renderPermissions () {
    const target = state.selectedMember
    const panel = document.querySelector('.permission-panel')
    if (!target || !panel) { showError('请先从成员列表选择要管理的成员。'); return }
    const resources = ['fingerprints', 'environments', 'proxies', 'accounts'].flatMap(kind => (state.lists[kind] || []).map(item => ({ ...item, kind })))
    panel.innerHTML = `<section class="form-section"><h2>${escape(target.name)}的权限</h2><div class="field-grid"><label class="field"><span>角色</span><select id="permission-role">${['admin', 'operator', 'viewer'].map(role => `<option value="${role}" ${role === target.role ? 'selected' : ''}>${labelRole(role)}</option>`).join('')}</select></label><label class="field"><span>资源范围</span><select id="permission-scope"><option value="selected">指定资源</option><option value="all" ${target.scope.mode === 'all' ? 'selected' : ''}>全部资源</option></select></label></div><div class="resource-choices">${resources.map(item => `<label><input type="checkbox" name="resource-scope" value="${item.id}" ${target.scope.ids.includes(item.id) ? 'checked' : ''}>${escape(item.name)}</label>`).join('') || '<p>团队尚无可分配的资源。</p>'}</div><button class="button primary" data-operation="save-permissions">保存权限</button></section>`
  }
  async function checkEnvironmentProxy () {
    const mode = input('environment-create', 2, 0)?.value
    const proxyId = input('environment-create', 2, 1)?.value
    const fingerprintId = input('environment-create', 1, 0)?.value.split('@')[0]
    state.proxyCheck = null; state.timezoneAcknowledged = false
    document.getElementById('timezone-confirmation')?.remove()
    if (mode === '不使用代理' || !proxyId) return
    const result = (await request(`${base()}/proxies/${proxyId}/check`, 'POST', {})).result
    if (input('environment-create', 2, 1)?.value !== proxyId) return
    state.proxyCheck = result
    const fingerprint = state.lists.fingerprints.find(item => item.id === fingerprintId)
    document.querySelectorAll('[data-summary-label]').forEach(node => { if (node.dataset.summaryLabel === '代理连接') node.textContent = '实际检测通过'; if (node.dataset.summaryLabel === '时区一致性') node.textContent = fingerprint?.profile.locale.timezone === result.timezone ? '一致' : '存在差异' })
    if (fingerprint && fingerprint.profile.locale.timezone !== result.timezone) document.querySelector('.form-main').insertAdjacentHTML('beforeend', `<label class="notice warning" id="timezone-confirmation"><input id="timezone-acknowledge" type="checkbox">出口时区为 ${escape(result.timezone)}，与指纹时区 ${escape(fingerprint.profile.locale.timezone)} 不同。我已了解差异并保留此指纹。</label>`)
  }
  async function run (operation, button) {
    const route = window.WorkspaceUI.getRoute(); const id = button?.dataset.id
    if (operation === 'check-client-updates') {
      const result = await window.workspaceBridge.checkUpdates()
      if (!result.ok) throw new Error(result.error || '检查更新失败。')
      clientUpdate = result; renderClientUpdates(); return
    }
    if (operation === 'install-client-update') {
      const result = await window.workspaceBridge.installUpdate()
      if (!result.ok) throw new Error(result.error || '安装更新失败。')
      return
    }
    if (operation === 'login') return window.WorkspaceUI.openSignin(button)
    if (operation === 'show-register') return registerForm()
    if (operation === 'show-signin') { window.WorkspaceUI.closeDialog(false); return window.WorkspaceUI.openSignin(button) }
    if (operation === 'send-registration-code') {
      const form = document.querySelector('.signin-form'); const emailInput = form.querySelector('[name="email"]')
      if (!validateFormInputs(emailInput)) return
      const email = emailInput.value.trim().toLowerCase()
      const data = await request('/api/auth/registration-code', 'POST', { email })
      registration.email = email; registration.resendAt = Date.now() + data.retryAfterSeconds * 1000
      const feedback = form.querySelector('.registration-feedback'); feedback.classList.remove('error'); feedback.textContent = '验证码邮件已发送，请在五分钟内完成注册。'
      form.querySelector('[name="verificationCode"]').focus()
      return
    }
    if (operation === 'choose-plan') {
      payment.workspaceId = state.workspaceId; payment.planId = id; payment.order = null; payment.requestId = crypto.randomUUID(); routeTo('payment'); return
    }
    if (operation === 'create-payment') {
      const method = document.querySelector('[name="payment-method"]:checked')?.value
      if (!method) throw new Error('请选择已开放的付款方式。')
      const result = await request(`${base()}/orders`, 'POST', { planId: payment.planId, method, requestId: payment.requestId })
      payment.order = result.order; await reload(); renderPayment(); pollPayment(); return
    }
    if (operation === 'open-order') {
      payment.workspaceId = state.workspaceId; payment.order = (await request(`${base()}/orders/${id}`)).order; payment.planId = payment.order.plan.id; routeTo('payment'); return
    }
    if (operation === 'refresh-payment') {
      payment.order = (await request(`${base()}/orders/${payment.order.id}/refresh`, 'POST', {})).order
      await reload(); renderPayment(); pollPayment(); return
    }
    if (operation === 'signin' || operation === 'register') {
      const form = document.querySelector('.signin-form'); if (!validateFormInputs(form)) return
      let body
      if (operation === 'register') body = Object.fromEntries(new FormData(form))
      else body = { email: form.querySelector('input[type="email"]').value, password: form.querySelector('input[type="password"]').value }
      const data = await request(`/api/auth/${operation === 'register' ? 'register' : 'login'}`, 'POST', body)
      Object.assign(state, { user: data.user, csrf: data.csrf, workspaces: data.workspaces, workspaceId: data.workspaces[0]?.id || '' })
      await reload(); window.WorkspaceUI.closeDialog(); window.WorkspaceUI.render(); noticeResult('已登录工作空间。'); await acceptPendingInvitation(); return
    }
    if (!state.user) return window.WorkspaceUI.openSignin(button)
    if (operation === 'logout') { await closeNativeTabs(); await request('/api/auth/logout', 'POST', {}); Object.assign(state, { user: null, csrf: '', lists: {}, workspaceId: '' }); window.WorkspaceUI.render(); return }
    if (operation === 'save-fingerprint') {
      const draft = window.WorkspaceUI.getFingerprint()
      if (draft.generating || !draft.profile.id) throw new Error('请等待云端指纹生成完成。')
      if (!draft.name.trim()) throw new Error('请填写指纹名称。')
      await request(`${base()}/fingerprints`, 'POST', { name: draft.name, profile: draft.profile, ...(state.editFingerprint ? { id: state.editFingerprint.id, expectedVersion: state.editFingerprint.version } : {}) })
      state.editFingerprint = null; await reload(); routeTo('fingerprints'); noticeResult('指纹已保存到团队数据库。'); return
    }
    if (operation === 'edit-fingerprint') { state.editFingerprint = state.lists.fingerprints.find(item => item.id === id); routeTo('fingerprint-create'); window.WorkspaceUI.setFingerprint(state.editFingerprint.profile, state.editFingerprint.name); return }
    if (operation === 'edit-environment') { state.editEnvironment = (await request(`${base()}/environments/${id}`)).item; routeTo('environment-create'); return }
    if (operation === 'save-environment') {
      const selected = input(route, 1, 0).value.split('@'); const proxyId = input(route, 2, 0).value === '选择已有代理' ? input(route, 2, 1).value : null
      if (!selected[0]) throw new Error('请先选择已保存的指纹。')
      if (input(route, 2, 0).value === '选择已有代理' && !proxyId) throw new Error('请选择代理资源。')
      await request(`${base()}/environments`, 'POST', { name: input(route, 0, 0).value, startUrl: input(route, 0, 1).value, fingerprintId: selected[0], fingerprintVersion: Number(selected[1]), proxyId, timezoneAcknowledged: Boolean(document.getElementById('timezone-acknowledge')?.checked || state.editEnvironment?.timezoneAcknowledged), ...(state.editEnvironment ? { id: state.editEnvironment.id, expectedRevision: state.editEnvironment.revision } : {}) })
      state.editEnvironment = null; await reload(); routeTo('environments'); noticeResult('环境已保存，指纹版本已锁定。'); return
    }
    if (operation === 'save-proxy') {
      const value = (group, index) => document.getElementById(`field-proxy-create-${group}-${index}`).value
      await request(`${base()}/proxies`, 'POST', { name: value(0, 0), protocol: value(0, 1) === 'SOCKS5' ? 'socks5' : value(0, 1) === 'HTTP / HTTPS' ? 'http' : '', host: value(0, 2), port: Number(value(0, 3)), username: value(1, 0), password: value(1, 1) })
      await reload(); window.WorkspaceUI.closeDialog(); window.WorkspaceUI.render(); noticeResult('代理已通过连接检测并保存。'); return
    }
    if (operation === 'check-proxy') { const result = (await request(`${base()}/proxies/${id}/check`, 'POST', {})).result; await reload(); window.WorkspaceUI.render(); noticeResult(`检测通过，出口时区为 ${result.timezone}。`); return }
    if (operation.startsWith('remove-')) {
      const resource = { 'remove-fingerprint': 'fingerprints', 'remove-environment': 'environments', 'remove-proxy': 'proxies', 'remove-member': 'members' }[operation]
      if (!resource || !confirm('确认移除此记录？正在使用的指纹或代理不会被移除。')) return
      await request(`${base()}/${resource}/${id}`, 'DELETE'); await reload(); window.WorkspaceUI.render(); noticeResult('记录已移除。'); return
    }
    if (operation === 'launch-environment') {
      if (!window.workspaceBridge) throw new Error('请在栖界客户端中启动浏览器环境。')
      const result = await window.workspaceBridge.launch({ workspaceId: state.workspaceId, environmentId: id })
      if (!result.ok) throw new Error(result.error || '环境启动失败。')
      noticeResult('浏览器环境已打开。'); return
    }
    if (operation === 'permissions') { state.selectedMember = state.lists.members.find(item => item.id === id); routeTo('member-permissions'); return }
    if (operation === 'save-permissions') {
      await request(`${base()}/members/${state.selectedMember.id}`, 'PUT', { role: document.getElementById('permission-role').value, scope: { mode: document.getElementById('permission-scope').value, ids: [...document.querySelectorAll('[name="resource-scope"]:checked')].map(item => item.value) } })
      await reload(); routeTo('members'); noticeResult('成员权限已更新。'); return
    }
    if (operation === 'invite-member') {
      const email = input('member-invite', 0, 0).value; const role = input('member-invite', 0, 1).value
      if (!['operator', 'viewer'].includes(role)) throw new Error('请选择受邀成员角色。')
      const data = await request(`${base()}/invitations`, 'POST', { email, role })
      const link = `${location.origin}/#invite/${state.workspaceId}/${data.invitation.id}/${data.token}`
      const output = document.createElement('div'); output.className = 'notice'; output.textContent = `邀请已创建，请将此链接交给受邀成员（七天内有效）：${link}`; document.querySelector('.form-main').append(output); return
    }
    if (operation === 'save-settings') {
      await request(`${base()}/settings`, 'PUT', { reduceMotion: document.getElementById('settings-motion').value === 'true', pageSize: Number(document.getElementById('settings-page-size').value), expectedRevision: state.lists.settings.settings.revision })
      await reload(); window.WorkspaceUI.render(); noticeResult('设置已保存。'); return
    }
    if (operation === 'page-back' || operation === 'page-next') { state.page += operation === 'page-next' ? 1 : -1; if (route === 'billing') renderBilling(); else populateTable(route) }
  }
  document.addEventListener('workspace:render', () => { void render().catch(error => showError(error.message)) })
  document.addEventListener('workspace:error', event => showError(event.detail))
  document.addEventListener('workspace:dialog', event => prepareDialog(event.detail.pageId))
  document.addEventListener('click', event => {
    const destination = event.target.closest('[data-route]')
    if (destination?.dataset.route === 'fingerprint-create' && /创建|新建/.test(destination.textContent) && !['fingerprint-create', 'fingerprint-protection'].includes(window.WorkspaceUI.getRoute())) {
      state.editFingerprint = null
      window.WorkspaceUI.resetFingerprint()
      void loadFingerprintDefaults().catch(error => showError(error.message))
    }
    if (destination?.dataset.route === 'environment-create' && /新建|建立/.test(destination.textContent)) { state.editEnvironment = null; window.WorkspaceUI.resetDraft('environment-create') }
    const native = event.target.closest('[data-native-operation]')
    if (native && window.workspaceBridge) {
      event.preventDefault()
      const action = native.dataset.nativeOperation
      const promise = action === 'dashboard' ? window.workspaceBridge.dashboard() : action === 'select' ? window.workspaceBridge.selectTab(native.dataset.tabId) : window.workspaceBridge.closeTab(native.dataset.tabId)
      void promise.then(result => { if (!result.ok) showError(result.error || '浏览器操作失败。') }).catch(() => showError('浏览器操作未完成。'))
      return
    }
    const loginLink = event.target.closest('.topbar [data-route="signin"]')
    if (loginLink && state.user) { event.preventDefault(); event.stopImmediatePropagation(); routeTo('settings'); return }
    if (event.target.closest('.workspace-switch') && state.user) {
      void closeNativeTabs().then(async () => { const current = state.workspaces.findIndex(item => item.id === state.workspaceId); state.workspaceId = state.workspaces[(current + 1) % state.workspaces.length].id; await reload(); window.WorkspaceUI.render() }).catch(error => showError(error.message)); return
    }
    const operation = event.target.closest('[data-operation]')
    if (!operation || operation.disabled || state.busy) return
    event.preventDefault(); event.stopImmediatePropagation(); clearError(); state.busy = true
    const wasDisabled = operation.disabled; const originalLabel = operation.textContent
    operation.disabled = true; operation.setAttribute('aria-busy', 'true')
    if (operation.dataset.operation === 'send-registration-code') operation.textContent = '正在发送…'
    void run(operation.dataset.operation, operation).catch(error => showError(error.message, Boolean(document.querySelector('#modal-root .platform-picker')))).finally(() => { state.busy = false; if (operation.isConnected) { operation.disabled = wasDisabled; operation.textContent = originalLabel; operation.removeAttribute('aria-busy'); updateRegistrationCountdown() } })
  })
  document.addEventListener('input', event => { if (event.target.id?.startsWith('search-')) { state.page = 1; populateTable(window.WorkspaceUI.getRoute()) } if (event.target.matches('.signin-form [name="email"]')) updateRegistrationCountdown(); if (window.WorkspaceUI.getRoute() === 'environment-create') queueMicrotask(updateEnvironmentSummary) })
  document.addEventListener('change', event => {
    if (event.target.id?.startsWith('filter-')) { state.page = 1; populateTable(window.WorkspaceUI.getRoute()) }
    if (['field-environment-create-1-0', 'field-environment-create-2-0', 'field-environment-create-2-1'].includes(event.target.id)) { queueMicrotask(updateEnvironmentSummary); void checkEnvironmentProxy().catch(error => showError(error.message)) }
  })
  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' && event.target.matches('.native-address input') && !event.target.readOnly && nativeTabs.activeId) {
      event.preventDefault()
      void window.workspaceBridge.navigate({ id: nativeTabs.activeId, url: event.target.value }).then(result => { if (!result.ok) showError(result.error || '网页打开失败。') })
    }
  })
  async function init () {
    try {
      if (window.workspaceBridge) {
        if (window.workspaceBridge.shellVersion !== 2) {
          document.body.classList.add('client-native')
          const toolbar = document.createElement('div'); toolbar.className = 'native-toolbar'; toolbar.innerHTML = '<div class="native-tabs"></div><div class="native-address"><input aria-label="SaaS 页面地址（只读）" readonly spellcheck="false"></div>'; document.body.prepend(toolbar)
          renderNativeAddress()
        }
        window.workspaceBridge.onTabsChanged(snapshot => { renderNativeTabs(snapshot); if (['overview', 'environments'].includes(window.WorkspaceUI.getRoute())) populateTable(window.WorkspaceUI.getRoute()) })
        const snapshot = await window.workspaceBridge.tabs(); renderNativeTabs(snapshot)
        if (window.workspaceBridge.updateStatus) {
          clientUpdate = await window.workspaceBridge.updateStatus()
          window.workspaceBridge.onUpdateChanged(update => { clientUpdate = update; renderClientUpdates() })
        }
      }
      const catalog = (await request('/api/platforms')).platforms
      window.QijieProductDesign.pages.find(page => page.id === 'account-platforms').platforms.forEach(item => { const actual = catalog.find(platform => platform.key === item.key); item.disabled = !actual?.enabled; item.status = actual?.reason || '' })
      try { const data = await request('/api/auth/me'); Object.assign(state, { user: data.user, workspaces: data.workspaces, workspaceId: data.workspaces[0]?.id || '', csrf: data.csrf }); await reload() } catch (error) { if (error.message !== '请先登录工作空间。') throw error }
      state.ready = true; await render()
      await acceptPendingInvitation()
    } catch (error) { showError(error.message) }
  }
  document.addEventListener('DOMContentLoaded', () => { void init() })
  window.addEventListener('hashchange', () => { renderNativeAddress(); void acceptPendingInvitation() })
})()
