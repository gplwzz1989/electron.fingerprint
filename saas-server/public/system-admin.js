;(function () {
  'use strict'
  const $ = selector => document.querySelector(selector)
  let csrf = ''; let settings = null; let dirty = false; let busy = false; let activeGroup = ''
  const descriptions = {
    能力版本: '分别上传 NCC 打包后的平台能力与 RPA 单文件 JS。版本号自动递增；客户端启动时自行检测、校验并缓存更新。',
    基础: '公开地址与代理访问策略对整个平台生效。监听端口和数据库连接仍在服务器配置文件中维护。',
    邮件: '配置注册验证码邮件。SMTP 授权码加密保存在数据库中，填写后不会回显。',
    支付: '完成真实商户配置与验收后，再开启支付。未配置完整的渠道不会开放。',
    微信支付: '填写真实商户信息。私钥、平台证书或公钥可直接粘贴，无需另行配置证书文件路径。',
    支付宝: '填写正式应用与收款账户信息。生产环境禁止使用沙箱。',
    套餐: '仅配置实际售卖的套餐。未添加套餐时，前台不提供任何在售套餐。',
    客户端更新: '填写服务器上的签名更新文件目录；相对路径以服务端配置文件所在目录为基准。'
  }
  const messages = {
    SMTP_SECURE: '465 端口通常开启；587 端口通常关闭并使用 STARTTLS。',
    SMTP_FROM: '留空时使用 SMTP 登录邮箱。',
    SMTP_PASSWORD: '填写邮箱服务商提供的 SMTP 授权码，不是邮箱网页登录密码。',
    WECHAT_PAY_API_V3_KEY: '须为 32 字节。',
    CLIENT_UPDATES_DIR: '目录内放置 prod-win32-x64.json 和清单引用的安装包；签名私钥不要放在此目录。'
  }
  function element (tag, text, className) {
    if (tag === 'button' && window.ShadcnUI) return window.ShadcnUI.createControl('button', { text, props: { className } })
    const node = document.createElement(tag)
    if (text !== undefined) node.textContent = text
    if (className) node.className = className
    return node
  }
  function notify (message, error = false) {
    const status = $('#message'); status.textContent = message; status.dataset.tone = error ? 'error' : 'success'
    window.ShadcnUI?.notify(message, error ? 'error' : 'success')
  }
  async function api (url, method = 'GET', body) {
    let response; let data
    try {
      response = await fetch(url, { method, credentials: 'same-origin', cache: 'no-store', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(20000) })
      data = await response.json()
    } catch { throw new Error('无法连接服务，请检查网络后重试。') }
    if (!response.ok || !data.ok) { const error = new Error(data.message || '操作未完成，请重试。'); error.status = response.status; throw error }
    return data
  }
  function loginErrorMessage (error) {
    if (error?.message === '邮箱格式不正确。') return '邮箱格式不正确，请检查邮箱并重试。'
    if (error?.message === 'Maximum call stack size exceeded') return '后台管理页面加载失败，请刷新后重试。'
    if (['当前账号没有系统管理员权限，请联系服务器管理员。', '无法连接服务，请检查网络后重试。'].includes(error?.message)) return error.message
    return Number.isInteger(error?.status) ? error.message : '后台管理页面加载失败，请刷新后重试。'
  }
  const passwordChangeMarkup = `<section class="platform-picker password-change-dialog"><header class="platform-picker-header password-change-header"><div><h2>修改登录密码</h2><p>验证当前密码后设置新密码。</p></div><button class="platform-picker-close" type="button" data-password-close aria-label="关闭"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header><form id="password-change-form" class="password-change-form"><div class="password-change-fields"><label class="field" for="password-current"><span>当前密码</span><input id="password-current" name="currentPassword" type="password" autocomplete="current-password" placeholder="请输入当前密码" required></label><label class="field" for="password-new"><span>新密码</span><input id="password-new" name="newPassword" type="password" autocomplete="new-password" placeholder="至少 8 个字符" minlength="8" maxlength="256" required></label><label class="field" for="password-confirm"><span>确认新密码</span><input id="password-confirm" name="confirmPassword" type="password" autocomplete="new-password" placeholder="再次输入新密码" maxlength="256" required></label></div><p class="password-change-message" id="password-change-message" role="alert" aria-live="assertive"></p><footer class="password-change-footer"><button class="button" type="button" data-password-cancel>取消</button><button class="button primary" type="submit">保存新密码</button></footer></form></section>`
  function openPasswordChangeDialog (trigger) {
    const close = () => { window.ShadcnUI.closeDialog(); if (trigger?.isConnected) trigger.focus() }
    const dialog = window.ShadcnUI.openDialog(passwordChangeMarkup, trigger, close)
    const form = dialog.querySelector('#password-change-form')
    const message = dialog.querySelector('#password-change-message')
    dialog.addEventListener('click', event => { if (event.target.closest?.('[data-password-close], [data-password-cancel]')) close() })
    form.addEventListener('input', () => { message.textContent = '' })
    form.addEventListener('submit', async event => {
      event.preventDefault()
      message.textContent = ''
      const currentPassword = form.elements.currentPassword
      const newPassword = form.elements.newPassword
      const confirmPassword = form.elements.confirmPassword
      const submit = event.submitter
      if (newPassword.value !== confirmPassword.value) { message.textContent = '两次输入的新密码不一致。'; confirmPassword.focus(); return }
      if (submit) submit.disabled = true
      try {
        const result = await api('/api/auth/password', 'POST', { currentPassword: currentPassword.value, newPassword: newPassword.value, confirmPassword: confirmPassword.value })
        notify(result.message)
        close()
      } catch (error) { message.textContent = error.message; notify(error.message, true) } finally { if (submit) submit.disabled = false }
    })
  }
  function changed (event) { if (event?.target?.dataset.releaseFile) return; dirty = true; $('#save-state').textContent = '有尚未保存的修改' }
  function showGroup (group) {
    activeGroup = group
    const saveBar = document.querySelector('.save-bar'); if (saveBar) saveBar.hidden = group === '能力版本'
    for (const panel of document.querySelectorAll('[data-panel]')) panel.hidden = panel.dataset.panel !== group
    for (const button of document.querySelectorAll('[data-group]')) {
      if (button.dataset.group === group) button.setAttribute('aria-current', 'page')
      else button.removeAttribute('aria-current')
    }
  }
  function planRow (plan = {}) {
    const row = element('div', undefined, 'plan-row')
    for (const [key, title, type, value] of [
      ['id', '套餐标识', 'text', plan.id], ['name', '套餐名称', 'text', plan.name],
      ['amount', '价格（元）', 'number', plan.amount === undefined ? '' : plan.amount / 100], ['periodDays', '有效天数', 'number', plan.periodDays],
      ['fingerprints', '指纹数量', 'number', plan.quotas?.fingerprints], ['environments', '环境数量', 'number', plan.quotas?.environments], ['members', '成员数量', 'number', plan.quotas?.members]
    ]) {
      const label = element('label', title); const input = window.ShadcnUI.createControl('input', { type, value: value ?? '' })
      input.dataset.planKey = key
      if (type === 'number') { input.min = key === 'amount' ? '0.01' : '1'; input.step = key === 'amount' ? '0.01' : '1' }
      label.append(input); row.append(label)
    }
    const controls = element('div', undefined, 'plan-controls'); const label = element('label', '上架')
    const enabled = window.ShadcnUI.createControl('checkbox', { checked: plan.enabled === true, label: '上架' }); enabled.dataset.planKey = 'enabled'; label.prepend(enabled)
    const remove = element('button', '移除'); remove.type = 'button'; remove.addEventListener('click', () => { row.remove(); changed(); updateEmptyPlans() })
    controls.append(label, remove); row.append(controls); return row
  }
  function updateEmptyPlans () { const empty = $('#empty-plans'); if (empty) empty.hidden = Boolean(document.querySelector('.plan-row')) }
  function renderPlans (panel, plans) {
    const box = element('div', undefined, 'plans'); const rows = element('div'); rows.id = 'plan-rows'
    const empty = element('p', '尚未配置套餐，前台不会显示在售项目。', 'empty-plans'); empty.id = 'empty-plans'
    for (const plan of plans) rows.append(planRow(plan))
    const tools = element('div', undefined, 'plan-tools'); const add = element('button', '＋ 添加套餐'); add.type = 'button'
    add.addEventListener('click', () => { rows.append(planRow()); changed(); updateEmptyPlans() })
    tools.append(element('span', '币种：人民币', 'muted'), add); box.append(rows, empty, tools); panel.append(box)
  }
  function renderCapabilities (panel) {
    const body = element('div', undefined, 'field-grid'); panel.append(body)
    const current = element('p', '正在读取已发布版本…', 'muted field wide')
    const history = element('div', undefined, 'audit field wide'); const refresh = async () => {
      const result = await api('/api/system/platform-releases')
      current.textContent = result.manifest ? '当前发布版本：' + result.manifest.version + '；检测清单：' + location.origin + '/api/platform-releases/manifest.json' : '尚未生成完整清单，请分别上传平台能力与 RPA。'
      history.replaceChildren(...result.items.map(item => element('p', (item.component === 'platform' ? '平台能力' : 'RPA') + ' · ' + item.version + ' · ' + Math.ceil(item.size / 1024) + ' KB · ' + new Date(item.createdAt).toLocaleString('zh-CN'))))
    }
    body.append(current)
    for (const [component, title] of [['platform', '平台能力'], ['rpa', 'RPA']]) {
      const row = element('div', undefined, 'field'); const label = element('label', title + ' 单文件 JS', 'field-label')
      const input = window.ShadcnUI.createControl('input', { type: 'file', props: { accept: '.js,application/javascript' } }); input.dataset.releaseFile = component; input.setAttribute('hidden', '')
      const choose = element('button', '选择 JS 文件'); choose.type = 'button'
      const fileName = element('span', '尚未选择文件', 'file-selection-name')
      choose.addEventListener('click', () => input.click())
      input.addEventListener('change', () => { fileName.textContent = input.files?.[0]?.name || '尚未选择文件' })
      const button = element('button', '上传并发布' + title); button.type = 'button'
      button.addEventListener('click', async () => {
        const file = input.files?.[0]
        if (!file || !file.name.endsWith('.js') || !file.size || file.size > 4 * 1024 * 1024) { notify('请选择不超过 4 MB 的 NCC 单文件 JS。', true); return }
        button.disabled = true
        try {
          const response = await fetch('/api/system/platform-releases/' + component, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/javascript', 'X-CSRF-Token': csrf }, body: file, signal: AbortSignal.timeout(60000) })
          const result = await response.json()
          if (!response.ok || !result.ok) throw new Error(result.message || '组件发布失败，请重试。')
          input.value = ''; fileName.textContent = '尚未选择文件'; notify(result.message + ' 发布编号：' + result.version); await refresh()
        } catch (error) { notify(error.message || '组件发布失败，请检查网络。', true) } finally { button.disabled = false }
      })
      row.append(label, input, choose, fileName, button); body.append(row)
    }
    body.append(element('p', '只上传实现客户端宿主接口的自包含文件；服务端只校验语法与摘要，不执行上传代码。客户端校验失败时保留原版本。', 'muted field wide'), history)
    void refresh().catch(error => { current.textContent = error.message })
  }
  function render (data) {
    settings = data.settings
    const groups = [...new Set(settings.fields.map(field => field.group)), '能力版本']
    window.ShadcnUI.clearAdminTabs()
    $('#admin-nav').replaceChildren(); $('#settings-panels').replaceChildren()
    const tabItems = []
    for (const [index, group] of groups.entries()) {
      const panel = element('section', undefined, 'settings-card'); panel.dataset.panel = group
      const head = element('header', undefined, 'section-head'); head.append(element('h2', group), element('p', descriptions[group], 'muted')); panel.append(head)
      if (group === '能力版本') renderCapabilities(panel)
      const grid = element('div', undefined, 'field-grid')
      for (const field of settings.fields.filter(item => item.group === group)) {
        if (field.type === 'plans') { renderPlans(panel, settings.values[field.key] || []); continue }
        const box = element('div', undefined, 'field' + (field.type === 'secretMultiline' ? ' wide' : ''))
        const label = element('label', field.label, 'field-label'); label.htmlFor = field.key
        const input = field.type === 'boolean'
          ? window.ShadcnUI.createControl('select', { value: String(settings.values[field.key] ?? 'false'), label: field.label, items: [{ value: 'false', label: '关闭' }, { value: 'true', label: '开启' }] })
          : window.ShadcnUI.createControl(field.type === 'secretMultiline' ? 'textarea' : 'input', { type: field.secret ? 'password' : field.type === 'email' ? 'email' : field.type === 'port' ? 'number' : 'text', value: field.secret ? '' : settings.values[field.key] ?? '' })
        input.id = field.key; input.dataset.key = field.key
        input.value = field.secret ? '' : settings.values[field.key] ?? ''
        if (field.secret) { input.autocomplete = 'new-password'; input.placeholder = '留空保持原值'; input.spellcheck = false }
        if (field.type === 'port') { input.min = '1'; input.max = '65535' }
        box.append(label, input)
        if (messages[field.key]) box.append(element('small', messages[field.key]))
        if (field.secret) {
          const configured = settings.configuredSecrets.includes(field.key)
          box.append(element('span', configured ? '已配置 · 原值不回显' : '尚未配置', configured ? 'secret-state' : 'muted'))
          if (configured) {
            const clear = element('label', undefined, 'clear-secret'); const checkbox = window.ShadcnUI.createControl('checkbox', { label: '清除已保存的值' }); checkbox.dataset.clear = field.key
            clear.append(checkbox, document.createTextNode('清除已保存的值')); box.append(clear)
          }
        }
        grid.append(box)
      }
      if (grid.children.length) panel.append(grid)
      tabItems.push({ value: group, label: group, number: String(index + 1).padStart(2, '0'), panel })
    }
    $('#admin-nav').append(window.ShadcnUI.createAdminTabs(tabItems, groups.includes(activeGroup) ? activeGroup : groups[0], showGroup))
    const status = $('#service-status'); status.replaceChildren()
    status.append(window.ShadcnUI.createBadge(data.emailDeliveryAvailable ? '邮件参数已配置' : '邮件待配置', data.emailDeliveryAvailable ? 'success' : 'secondary', data.emailDeliveryAvailable ? 'ready' : ''))
    for (const method of data.paymentMethods) status.append(window.ShadcnUI.createBadge(`${method.name}：${method.enabled ? '已配置' : '未开放'}`, method.enabled ? 'success' : 'secondary', method.enabled ? 'ready' : ''))
    $('#revision').textContent = `配置版本 ${settings.revision} · 更新于 ${new Date(settings.updatedAt).toLocaleString('zh-CN')}`
    $('#save-state').textContent = '当前修改已保存'; dirty = false
    showGroup(groups.includes(activeGroup) ? activeGroup : groups[0]); updateEmptyPlans()
  }
  async function loadAudit () {
    const result = await api('/api/system/audit'); const box = $('#audit-list'); box.replaceChildren()
    if (!result.items.length) box.append(element('p', '暂无配置变更记录。', 'muted'))
    const names = new Map(settings.fields.map(field => [field.key, field.label]))
    for (const item of result.items) {
      const keys = typeof item.changed_fields === 'string' ? JSON.parse(item.changed_fields) : item.changed_fields
      box.append(element('div', `${new Date(item.created_at).toLocaleString('zh-CN')} · ${item.email} · 版本 ${item.revision}：${keys.map(key => names.get(key) || key).join('、')}`, 'audit-row'))
    }
  }
  async function load () {
    const me = await api('/api/auth/me'); csrf = me.csrf
    if (!me.isSystemAdmin) throw new Error('当前账号没有系统管理员权限，请联系服务器管理员。')
    $('#identity').textContent = me.user.email
    const data = await api('/api/system/settings'); render(data)
    $('#login').hidden = true; $('#console').hidden = false; $('#initial-message').hidden = true
    try { await loadAudit() } catch { $('#audit-list').textContent = '变更记录暂时无法加载。' }
  }
  $('#settings-form').addEventListener('input', changed)
  $('#settings-form').addEventListener('change', changed)
  $('#settings-form').addEventListener('submit', async event => {
    event.preventDefault(); if (busy) return; busy = true
    const save = event.submitter; if (save) save.disabled = true
    try {
      const values = Object.fromEntries([...document.querySelectorAll('[data-key]')].map(input => [input.dataset.key, input.value]))
      values.BILLING_PLANS = [...document.querySelectorAll('.plan-row')].map(row => {
        const value = key => row.querySelector(`[data-plan-key="${key}"]`).value
        return { id: value('id'), name: value('name'), amount: Math.round(Number(value('amount')) * 100), periodDays: Number(value('periodDays')), currency: 'CNY', enabled: row.querySelector('[data-plan-key="enabled"]').checked, quotas: Object.fromEntries(['fingerprints', 'environments', 'members'].map(key => [key, Number(value(key))])) }
      })
      const clearSecrets = [...document.querySelectorAll('[data-clear]:checked')].map(input => input.dataset.clear)
      const result = await api('/api/system/settings', 'PUT', { revision: settings.revision, values, clearSecrets })
      render(result); notify(result.message); await loadAudit()
    } catch (error) { notify(error.message, true) } finally { busy = false; if (save) save.disabled = false }
  })
  $('#reload').addEventListener('click', async () => { if (!dirty || await window.WorkspaceDialogs.confirm({ title: '放弃未保存的修改？', description: '重新加载会丢弃尚未保存的设置。已保存的配置不受影响。', actionLabel: '重新加载', destructive: true, trigger: $('#reload') })) void load().catch(error => notify(error.message, true)) })
  $('#change-password').addEventListener('click', event => openPasswordChangeDialog(event.currentTarget))
  $('#login-form').addEventListener('input', event => {
    if (event.target.name !== 'email') return
    event.target.removeAttribute('aria-invalid')
    if ($('#login-message').dataset.emailError === 'true') { $('#login-message').textContent = ''; delete $('#login-message').dataset.emailError }
  })
  $('#login-form').addEventListener('submit', async event => {
    event.preventDefault()
    const button = event.submitter || event.target.querySelector('button[type="submit"]')
    const email = event.target.elements.email
    email.value = email.value.normalize('NFKC').replace(/[\u200B-\u200D\u2060\uFEFF]/g, '').trim()
    email.removeAttribute('aria-invalid')
    $('#login-message').textContent = ''; delete $('#login-message').dataset.emailError
    button.disabled = true
    try {
      await api('/api/auth/login', 'POST', Object.fromEntries(new FormData(event.target)))
      event.target.elements.password.value = ''
      await load()
    } catch (error) {
      if (!Number.isInteger(error.status) || error.message === 'Maximum call stack size exceeded') console.error('[系统管理页面加载异常]', error)
      const message = loginErrorMessage(error)
      $('#login-message').textContent = message
      if (error.message === '邮箱格式不正确。') {
        email.setAttribute('aria-invalid', 'true')
        $('#login-message').dataset.emailError = 'true'
        email.focus()
      }
      notify(message, true)
    } finally { button.disabled = false }
  })
  $('#logout').addEventListener('click', async () => {
    if (dirty && !await window.ShadcnUI.confirm({ title: '退出系统管理？', description: '当前修改尚未保存，退出后将丢失这些修改。', actionLabel: '退出', destructive: true, trigger: $('#logout') })) return
    try { await api('/api/auth/logout', 'POST', {}); dirty = false; location.reload() } catch (error) { notify(error.message, true) }
  })
  document.addEventListener('click', async event => {
    const link = event.target.closest?.('a[href]')
    if (!dirty || !link || link.origin !== location.origin || (link.pathname === location.pathname && link.hash === location.hash)) return
    event.preventDefault()
    if (await window.ShadcnUI.confirm({ title: '离开系统管理？', description: '当前修改尚未保存，离开后将丢失这些修改。', actionLabel: '离开', destructive: true, trigger: link })) { dirty = false; location.assign(link.href) }
  }, true)
  void load().catch(error => {
    $('#initial-message').hidden = true; $('#login').hidden = false
    if (error.status !== 401) {
      if (!Number.isInteger(error.status) || error.message === 'Maximum call stack size exceeded') console.error('[系统管理初始化异常]', error)
      const message = loginErrorMessage(error)
      $('#login-message').textContent = message; notify(message, true)
    }
  })
})()
