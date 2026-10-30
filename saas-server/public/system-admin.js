;(function () {
  'use strict'
  const $ = selector => document.querySelector(selector)
  let csrf = ''; let settings = null; let dirty = false; let busy = false; let activeGroup = ''
  const descriptions = {
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
    const node = document.createElement(tag)
    if (text !== undefined) node.textContent = text
    if (className) node.className = className
    return node
  }
  function notify (message, error = false) { $('#message').textContent = message; $('#message').classList.toggle('error', error) }
  async function api (url, method = 'GET', body) {
    let response; let data
    try {
      response = await fetch(url, { method, credentials: 'same-origin', cache: 'no-store', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(20000) })
      data = await response.json()
    } catch { throw new Error('无法连接服务，请检查网络后重试。') }
    if (!response.ok || !data.ok) { const error = new Error(data.message || '操作未完成，请重试。'); error.status = response.status; throw error }
    return data
  }
  function changed () { dirty = true; $('#save-state').textContent = '有尚未保存的修改' }
  function showGroup (group) {
    activeGroup = group
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
      const label = element('label', title); const input = document.createElement('input')
      input.type = type; input.value = value ?? ''; input.dataset.planKey = key
      if (type === 'number') { input.min = key === 'amount' ? '0.01' : '1'; input.step = key === 'amount' ? '0.01' : '1' }
      label.append(input); row.append(label)
    }
    const controls = element('div', undefined, 'plan-controls'); const label = element('label', '上架')
    const enabled = document.createElement('input'); enabled.type = 'checkbox'; enabled.checked = plan.enabled === true; enabled.dataset.planKey = 'enabled'; label.prepend(enabled)
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
  function render (data) {
    settings = data.settings
    const groups = [...new Set(settings.fields.map(field => field.group))]
    $('#admin-nav').replaceChildren(); $('#settings-panels').replaceChildren()
    for (const [index, group] of groups.entries()) {
      const button = element('button'); button.type = 'button'; button.dataset.group = group
      button.append(element('span', String(index + 1).padStart(2, '0'), 'nav-number'), document.createTextNode(group))
      button.addEventListener('click', () => showGroup(group)); $('#admin-nav').append(button)
      const panel = element('section', undefined, 'settings-card'); panel.dataset.panel = group
      const head = element('header', undefined, 'section-head'); head.append(element('h2', group), element('p', descriptions[group], 'muted')); panel.append(head)
      const grid = element('div', undefined, 'field-grid')
      for (const field of settings.fields.filter(item => item.group === group)) {
        if (field.type === 'plans') { renderPlans(panel, settings.values[field.key] || []); continue }
        const box = element('div', undefined, 'field' + (field.type === 'secretMultiline' ? ' wide' : ''))
        const label = element('label', field.label, 'field-label'); label.htmlFor = field.key
        const input = document.createElement(field.type === 'boolean' ? 'select' : field.type === 'secretMultiline' ? 'textarea' : 'input')
        input.id = field.key; input.dataset.key = field.key
        if (field.type === 'boolean') {
          for (const [value, title] of [['false', '关闭'], ['true', '开启']]) { const option = element('option', title); option.value = value; input.append(option) }
        } else if (input.tagName === 'INPUT') input.type = field.secret ? 'password' : field.type === 'email' ? 'email' : field.type === 'port' ? 'number' : 'text'
        input.value = field.secret ? '' : settings.values[field.key] ?? ''
        if (field.secret) { input.autocomplete = 'new-password'; input.placeholder = '留空保持原值'; input.spellcheck = false }
        if (field.type === 'port') { input.min = '1'; input.max = '65535' }
        box.append(label, input)
        if (messages[field.key]) box.append(element('small', messages[field.key]))
        if (field.secret) {
          const configured = settings.configuredSecrets.includes(field.key)
          box.append(element('span', configured ? '已配置 · 原值不回显' : '尚未配置', configured ? 'secret-state' : 'muted'))
          if (configured) {
            const clear = element('label', undefined, 'clear-secret'); const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.dataset.clear = field.key
            clear.append(checkbox, document.createTextNode('清除已保存的值')); box.append(clear)
          }
        }
        grid.append(box)
      }
      if (grid.children.length) panel.append(grid)
      $('#settings-panels').append(panel)
    }
    const status = $('#service-status'); status.replaceChildren()
    status.append(element('span', data.emailDeliveryAvailable ? '邮件参数已配置' : '邮件待配置', data.emailDeliveryAvailable ? 'ready' : ''))
    for (const method of data.paymentMethods) status.append(element('span', `${method.name}：${method.enabled ? '已配置' : '未开放'}`, method.enabled ? 'ready' : ''))
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
  $('#reload').addEventListener('click', () => { if (!dirty || confirm('重新加载会放弃尚未保存的修改，是否继续？')) void load().catch(error => notify(error.message, true)) })
  $('#login-form').addEventListener('submit', async event => {
    event.preventDefault(); const button = event.submitter || event.target.querySelector('button[type="submit"]'); button.disabled = true
    try { await api('/api/auth/login', 'POST', Object.fromEntries(new FormData(event.target))); event.target.elements.password.value = ''; await load() } catch (error) { $('#login-message').textContent = error.message } finally { button.disabled = false }
  })
  $('#logout').addEventListener('click', async () => { try { await api('/api/auth/logout', 'POST', {}); dirty = false; location.reload() } catch (error) { notify(error.message, true) } })
  window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = '' } })
  void load().catch(error => {
    $('#initial-message').hidden = true; $('#login').hidden = false
    if (error.status !== 401) $('#login-message').textContent = error.message
  })
})()
