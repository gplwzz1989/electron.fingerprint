(function () {
  'use strict'

  const icons = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/>',
    lock: '<rect x="4.5" y="10" width="15" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
    shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
    browser: '<rect x="2.5" y="3.5" width="19" height="14" rx="2"/><path d="M8 21h8M12 17.5V21M7 7h.01M10 7h.01M13 7h7"/>',
    folder: '<path d="M3 7.5h7l2 2h9v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-10Z"/><path d="M3 9.5h18"/>',
    globe: '<circle cx="12" cy="12" r="9.2"/><path d="M3 12h18M12 2.8c2.2 2.5 3.3 5.6 3.3 9.2s-1.1 6.7-3.3 9.2c-2.2-2.5-3.3-5.6-3.3-9.2S9.8 5.3 12 2.8Z"/>',
    users: '<path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20M9 10.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM16 3.2a4 4 0 0 1 0 7.6M22 20v-1.5a4 4 0 0 0-3-3.9"/>',
    clock: '<circle cx="12" cy="12" r="9.2"/><path d="M12 6.5V12l3.5 2"/>',
    card: '<rect x="2.5" y="4" width="19" height="16" rx="2"/><path d="M2.5 9h19M7 15h4"/>',
    settings: '<circle cx="12" cy="12" r="3.2"/><path d="m19.2 13.3 1.3.8-1.1 2-1.5-.4a7.7 7.7 0 0 1-1.3.8l-.3 1.6H14l-.5-1.4a7.7 7.7 0 0 1-1.5 0l-.9 1.2-2-1.1.4-1.5a7.7 7.7 0 0 1-.8-1.3l-1.6-.3v-2.3l1.4-.5a7.7 7.7 0 0 1 0-1.5l-1.2-.9 1.1-2 1.5.4a7.7 7.7 0 0 1 1.3-.8l.3-1.6h2.3l.5 1.4a7.7 7.7 0 0 1 1.5 0l.9-1.2 2 1.1-.4 1.5a7.7 7.7 0 0 1 .8 1.3l1.6.3v2.3l-1.4.5a7.7 7.7 0 0 1 0 1.5Z"/>',
    sparkle: '<path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
    upload: '<path d="M12 16V4m-4 4 4-4 4 4M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
    video: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3V9Z"/>',
    article: '<path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M7 8h10M7 12h10M7 16h6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 20h16"/>',
    warning: '<path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.8 3h15.6a2 2 0 0 0 1.8-3l-7.9-14.1a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4m0 4h.01"/>',
    key: '<circle cx="8" cy="15" r="5"/><path d="m11.5 11.5 8-8 2 2-2 2 2 2-3 3-2-2-3 3"/>',
    monitor: '<rect x="2.5" y="3.5" width="19" height="14" rx="2"/><path d="M8 21h8M12 17.5V21"/>',
    sparkleGrid: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/><path d="m17 5 .6 1.4L19 7l-1.4.6L17 9l-.6-1.4L15 7l1.4-.6L17 5Z"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>'
  }

  Object.assign(icons, {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    fingerprint: '<path d="M6 19c2-3 1-7 2-10a4.3 4.3 0 0 1 8 .1c1 3 0 7-1 10M3 16c1-2 0-5 1-8a8.5 8.5 0 0 1 16 0c1 3 .5 6 0 9M11 21c2-4 1-8 1-11M8 22c2-3 2-6 2-9M17 22c1-2 2-4 2-6"/>',
    team: '<circle cx="9" cy="8" r="3.5"/><path d="M2 21v-3a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v3M16 5a3 3 0 0 1 0 6M22 21v-3a5 5 0 0 0-3-4.6"/>'
  })
  const data = window.QijieProductDesign
  const environmentManagementTabs = data.environmentManagementTabs
  const isEnvironmentManagement = route => environmentManagementTabs.some(([, id]) => id === route)
  const navigationRoute = route => isEnvironmentManagement(route) ? 'environments' : route
  const navigationLabels = { overview: '总览', environments: '环境', accounts: '账号', members: '团队', billing: '订阅', settings: '设置' }
  const narrowNavigation = window.matchMedia('(max-width:639px)')
  const sidebar = document.getElementById('workspace-sidebar')
  const navigationToggle = document.querySelector('.navigation-toggle')
  const navigationBackdrop = document.querySelector('.navigation-backdrop')
  function setNavigationOpen (open, restoreFocus = false) {
    document.body.classList.toggle('navigation-closed', !open)
    document.body.classList.toggle('navigation-overlay', open && narrowNavigation.matches)
    sidebar.inert = !open
    sidebar.setAttribute('aria-hidden', String(!open))
    navigationToggle.setAttribute('aria-expanded', String(open))
    navigationToggle.setAttribute('aria-label', open ? '收起导航' : '展开导航')
    navigationToggle.title = open ? '收起导航' : '展开导航'
    navigationBackdrop.hidden = !open || !narrowNavigation.matches
    if (restoreFocus) navigationToggle.focus()
    else if (open && narrowNavigation.matches) sidebar.querySelector('.sidebar-close').focus()
  }
  setNavigationOpen(!narrowNavigation.matches)
  narrowNavigation.addEventListener('change', () => setNavigationOpen(!narrowNavigation.matches))
  document.addEventListener('click', event => {
    if (event.target.closest('.navigation-toggle')) setNavigationOpen(document.body.classList.contains('navigation-closed'))
    else if (event.target.closest('[data-navigation-close]')) setNavigationOpen(false, true)
    else if (narrowNavigation.matches && event.target.closest('.sidebar [data-route]')) setNavigationOpen(false, true)
  })
  document.addEventListener('keydown', event => {
    if (!document.body.classList.contains('navigation-overlay')) return
    if (event.key === 'Escape') { event.preventDefault(); setNavigationOpen(false, true); return }
    if (event.key !== 'Tab') return
    const nodes = Array.from(sidebar.querySelectorAll('a[href], button:not(:disabled)')).filter(node => node.getClientRects().length)
    const first = nodes[0]; const last = nodes.at(-1)
    if (event.shiftKey && (document.activeElement === first || !sidebar.contains(document.activeElement))) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && (document.activeElement === last || !sidebar.contains(document.activeElement))) { event.preventDefault(); first?.focus() }
  })
  const drafts = new Map()
  let currentRoute = ''
  let baseRoute = ''
  const modalStack = []
  let renderingModal = false
  const primaryRoutes = new Set(['overview','fingerprints','environments','proxies','accounts','members','billing','settings'])
  let environmentReturn = false
  let platformPickerTrigger = null
  let platformPickerInert = []
  let selectedPlatform = null
  let modalPageId = ''
  let modalReturnRoute = ''
  let authorizationReturn = false
  const expandedGroups = new Set()
  const formCategories = new Map()
  const fingerprintEngine = window.QijieFingerprintEngine
  const fingerprintDraft = {}
  let generationRevision = 0
  let generationPending = false
  async function generateFingerprint (platform) {
    const revision = ++generationRevision
    generationPending = true
    document.dispatchEvent(new CustomEvent('workspace:render'))
    try {
      const generated = await fingerprintEngine.generateRandomHardwareProfile({ platform })
      if (revision !== generationRevision) return
      Object.assign(fingerprintDraft, generated)
      fingerprintDraft.browser.userAgent = null
      fingerprintDraft.modules.canvas = fingerprintDraft.noise.canvas
      fingerprintDraft.modules.audio = fingerprintDraft.noise.audio
      fillFingerprintForm(); updateSummary()
    } catch {
      if (revision !== generationRevision) return
      document.dispatchEvent(new CustomEvent('workspace:error', { detail: '云端指纹生成失败，请检查登录状态与网络后重试。' }))
    } finally {
      if (revision === generationRevision) { generationPending = false; document.dispatchEvent(new CustomEvent('workspace:render')) }
    }
  }
  let fingerprintName = ''
  const getProfileValue = path => path === 'name' ? fingerprintName : path.split('.').reduce((value,key)=>value?.[key],fingerprintDraft)
  const categoriesEnabled = (items,scope) => items?.length > 1 && !['environment-create','proxy-create','signin'].includes(scope)
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char])
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.file}</svg>`
  const button = item => {
    if (!item) return ''
    const cls = `button${item.primary ? ' primary' : ''}`
    return item.target
      ? `<a class="${cls}" href="#${escapeHTML(item.target)}" data-route="${escapeHTML(item.target)}">${escapeHTML(item.label)}</a>`
      : `<button class="${cls}" type="button" ${item.action ? `data-action="${escapeHTML(item.action)}"` : ''} ${item.closeDialog ? 'data-close-platforms' : ''} ${item.disabled ? 'disabled' : ''}>${escapeHTML(item.label)}</button>`
  }
  const notice = item => item ? `<div data-slot="alert" class="shadcn-alert notice ${escapeHTML(item.tone || 'info')}" ${item.tone === 'error' ? 'role="alert"' : ''}>${icon(item.tone === 'error' || item.tone === 'warning' ? 'warning' : 'shield')}<div><b>${escapeHTML(item.title)}</b><p>${escapeHTML(item.text)}</p></div></div>` : ''
  const tabs = items => items?.length ? `<nav class="tabs" aria-label="页面分类">${items.map(([label,id]) => `<a class="tab ${id === currentRoute ? 'active' : ''}" href="#${id}" data-route="${id}" ${id === currentRoute ? 'aria-current="page"' : ''}>${escapeHTML(label)}</a>`).join('')}</nav>` : ''
  const summary = item => item ? `<aside class="summary surface" aria-label="${escapeHTML(item.title)}"><h2>${escapeHTML(item.title)}</h2><dl>${(item.rows || []).map(([key,value])=>`<div><dt>${escapeHTML(key)}</dt><dd data-summary-label="${escapeHTML(key)}">${escapeHTML(value)}</dd></div>`).join('')}</dl><p>${escapeHTML(item.text)}</p></aside>` : ''
  function field(item, index, display, scope = currentRoute) {
    const id = `field-${scope}-${index}`
    let control
    if (display || item.type === 'display') control = `<output class="read-value" id="${id}">—</output>`
    else if (item.type === 'select') control = `<select id="${id}">${(item.options || []).map(value=>`<option value="${escapeHTML(value.value ?? value)}">${escapeHTML(value.label ?? value)}</option>`).join('')}</select>`
    else if (item.type === 'textarea') control = `<textarea id="${id}" placeholder="${escapeHTML(item.placeholder)}"></textarea>`
    else control = `<input id="${id}" type="${escapeHTML(item.type || 'text')}" ${item.readonly ? 'readonly' : ''} placeholder="${escapeHTML(item.placeholder)}" autocomplete="${scope==='signin' ? item.type==='password' ? 'current-password' : 'username' : item.type === 'password' ? 'new-password' : 'off'}">`
    return `<label class="field${item.full ? ' full' : ''}" for="${id}" ${item.profilePath ? `data-profile-path="${escapeHTML(item.profilePath)}"` : ''}><span>${escapeHTML(item.label)}</span>${control}${item.help ? `<small>${escapeHTML(item.help)}</small>` : ''}</label>`
  }
  function groups(items, display=false, scope=currentRoute) {
    const categorized = categoriesEnabled(items,scope)
    const active = formCategories.get(scope) || 0
    return (categorized ? `<nav class="form-categories" aria-label="配置分类">${items.map((item,index)=>`<button type="button" data-form-category="${index}" data-form-scope="${scope}" aria-pressed="${active===index}">${escapeHTML(item.title)}</button>`).join('')}</nav>` : '') + (items || []).map((item,groupIndex)=>{
      const key = `${scope}-${groupIndex}`
      const heading = `<div><h2>${escapeHTML(item.title)}</h2>${item.description ? `<p>${escapeHTML(item.description)}</p>` : ''}</div>`
      const fields = `<div class="field-grid">${item.fields.map((item,index)=>field(item,`${groupIndex}-${index}`,display,scope)).join('')}</div>`
      return item.collapsible && !categorized ? `<details class="surface form-section advanced-section" data-group-key="${key}" ${expandedGroups.has(key) ? 'open' : ''}><summary>${heading}<span>展开配置</span></summary>${fields}</details>` : `<section class="surface form-section" data-group-panel="${groupIndex}" data-form-scope="${scope}" ${categorized && active!==groupIndex ? 'hidden' : ''}><header>${heading}${button(item.action)}</header>${fields}</section>`
    }).join('')
  }
  const authorizationFlow = stage => `<ol class="authorization-flow" aria-label="账号授权进度">${['选择环境','平台登录','确认身份','保存授权'].map((label,index)=>`<li class="${index === stage ? 'current' : ''}" ${index === stage ? 'aria-current="step"' : ''}><span>${index+1}</span>${label}</li>`).join('')}</ol>`
  function steps(items) {
    return items?.length ? `<section class="surface steps-panel"><h2>处理步骤</h2><ol>${items.map(([title,text],index)=>`<li><span class="step-number">${index+1}</span><div><b>${escapeHTML(title)}</b><p>${escapeHTML(text)}</p></div></li>`).join('')}</ol></section>` : ''
  }
  function rows(items) {
    return items?.length ? `<dl class="surface value-list">${items.map(([key,value])=>`<div><dt>${escapeHTML(key)}</dt><dd>${escapeHTML(value)}</dd></div>`).join('')}</dl>` : ''
  }
  function table(item, filters) {
    if (!item) return ''
    return `<section class="surface table-panel">${filters?.length ? `<div class="table-tools"><label class="search-field">${icon('search')}<input id="search-${currentRoute}" aria-label="搜索列表" placeholder="搜索名称或编号"></label>${filters.map((value,index)=>`<select id="filter-${currentRoute}-${index}" aria-label="${escapeHTML(value)}">${(currentRoute==='accounts' && value==='全部平台' ? ['全部平台',...data.pages.find(item=>item.id==='account-platforms').platforms.map(item=>item.name)] : currentRoute==='accounts' && value==='授权状态' ? ['全部授权状态','授权有效','待重新授权','授权异常'] : [value]).map(option=>`<option>${escapeHTML(option)}</option>`).join('')}</select>`).join('')}</div>` : ''}<div class="table-scroll" data-slot="table-container"><table data-slot="table"><thead data-slot="table-header"><tr>${item.columns.map(label=>`<th data-slot="table-head" scope="col">${escapeHTML(label)}</th>`).join('')}</tr></thead><tbody data-slot="table-body"><tr><td data-slot="table-cell" colspan="${item.columns.length}"><div class="empty-state"><span class="empty-icon">${icon('folder')}</span><h2>${escapeHTML(item.emptyTitle)}</h2><p>${escapeHTML(item.emptyText)}</p>${button(item.action)}</div></td></tr></tbody></table></div></section>`
  }
  function renderPage(page) {
    const environmentManagement = isEnvironmentManagement(page.id)
    const top = `<header class="page-heading"><div><h1>${escapeHTML(environmentManagement ? '浏览器环境管理' : page.title)}</h1><p class="page-description">${escapeHTML(page.description)}</p></div><div class="page-actions">${(page.actions || []).map(button).join('')}</div></header>`
    let content = ''
    if (page.kind === 'dashboard') {
      content = `<section class="workflow-banner"><div><h2>从指纹资源到独立会话</h2><p>指纹可复用，环境独立保存登录数据，平台账号由系统完成授权与更新。</p></div><span>${icon('fingerprint')}<i></i>${icon('browser')}<i></i>${icon('users')}</span></section><div class="task-grid">${page.tiles.map(item=>`<a class="surface task-card" href="#${item.target}" data-route="${item.target}"><span class="task-icon">${icon(item.icon)}</span><h2>${escapeHTML(item.title)}</h2><p>${escapeHTML(item.text)}</p><span class="task-arrow">${icon('arrow')}</span></a>`).join('')}</div><div class="section-heading"><h2>最近使用的环境</h2><a href="#environments" data-route="environments">全部环境 →</a></div>${table(page.table)}`
    } else if (page.kind === 'list' || page.kind === 'plans') content = `${notice(page.notice)}${table(page.table,page.filters)}`
    else if (['form','details','settings','authorize','signin'].includes(page.kind)) {
      content = `${Number.isInteger(page.authorizationStage) ? authorizationFlow(page.authorizationStage) : ''}<div class="form-layout ${page.summary ? '' : 'single'}"><div class="form-main">${notice(page.notice)}${rows(page.rows)}${groups(page.groups,page.kind==='details')}${['fingerprint-create','fingerprint-protection'].includes(page.id) ? '<div class="fingerprint-validation" id="fingerprint-validation" role="status" aria-live="polite"></div>' : ''}${page.inlineActions ? `<div class="inline-actions">${page.inlineActions.map(button).join('')}</div>` : ''}${steps(page.steps)}${page.footer ? `<footer class="form-footer"><span>${escapeHTML(page.footerHint)}</span><div>${environmentReturn && page.id.startsWith('fingerprint-') ? button({label:'返回环境草稿',target:'environment-create'}) : ''}${page.footer.map(item=>button(authorizationReturn && page.id==='environment-create' && item.target==='environments' ? {label:'返回授权流程',target:'account-authorize'} : item)).join('')}</div></footer>` : ''}</div>${summary(page.summary)}</div>`
    } else if (page.kind === 'state') content = `<div class="state-content">${notice(page.notice)}${rows(page.rows)}${steps(page.steps)}${page.acknowledge ? `<label class="acknowledge"><input type="checkbox">${escapeHTML(page.acknowledge)}</label>` : ''}</div>`
    else if (page.kind === 'permissions') content = `${notice(page.notice)}<section class="surface permission-panel"><table data-slot="table"><thead data-slot="table-header"><tr>${page.permissionColumns.map(item=>`<th data-slot="table-head">${escapeHTML(item)}</th>`).join('')}</tr></thead><tbody data-slot="table-body">${page.permissionRows.map(row=>`<tr>${row.map((cell,index)=>`<${index?'td':'th'} data-slot="table-cell">${escapeHTML(cell)}</${index?'td':'th'}>`).join('')}</tr>`).join('')}</tbody></table></section>`
    else if (page.kind === 'billing') content = `${notice(page.notice)}<div class="usage-grid">${page.rows.map(([label,value])=>`<div class="surface usage-card"><span>${escapeHTML(label)}</span><b>${escapeHTML(value)}</b></div>`).join('')}</div><div class="section-heading"><h2>订阅订单</h2></div>${table(page.table)}`
    else if (page.kind === 'payment') content = `<div class="form-layout"><section class="surface payment-panel"><h2>确认订单</h2>${rows(page.rows)}<h2>选择付款方式</h2><div class="payment-methods">${page.methods.map(item=>`<label><input type="radio" name="payment-method">${icon('card')}<b>${escapeHTML(item)}</b></label>`).join('')}</div><div class="payment-code">${icon('card')}<h3>选择套餐后生成支付码</h3><p>订单与支付码生成后，使用对应应用扫码付款。</p></div><footer class="form-footer"><span>${escapeHTML(page.footerHint)}</span><div>${(page.footer||[]).map(button).join('')}</div></footer></section>${summary(page.summary)}</div>`
    const managementTabs = environmentManagement ? `<nav class="environment-management-tabs" aria-label="浏览器环境管理分类">${environmentManagementTabs.map(([label,id]) => `<a class="environment-management-tab${id === page.id ? ' active' : ''}" href="#${id}" data-route="${id}" ${id === page.id ? 'aria-current="page"' : ''}>${escapeHTML(label)}</a>`).join('')}</nav>` : ''
    return top + managementTabs + tabs(page.tabs) + content
  }
  function clearDialog(restoreFocus = true, normalizeRoute = true) {
    const root = document.getElementById('modal-root')
    if (!window.ShadcnUI.isDialogOpen()) return
    if (['proxy-create','signin'].includes(modalPageId)) {
      const values = {}
      root.querySelectorAll('input[id],select[id]').forEach(input=>{if(modalPageId!=='signin'||input.type!=='password') values[input.id]={value:input.value,checked:input.checked}})
      drafts.set(modalPageId,values)
    }
    window.ShadcnUI.closeDialog()
    platformPickerInert.forEach(({ node, inert }) => { node.inert = inert })
    platformPickerInert = []
    document.body.classList.remove('platform-modal-open')
    if (normalizeRoute && location.hash.split('?')[0] === `#${modalPageId}`) history.replaceState(null, '', `#${modalReturnRoute}`)
    if (restoreFocus && platformPickerTrigger?.isConnected) platformPickerTrigger.focus()
    platformPickerTrigger = null
    modalPageId = ''
  }
  function activateDialog(trigger, pageId, returnRoute) {
    modalPageId = pageId
    modalReturnRoute = returnRoute
    platformPickerTrigger = trigger || document.activeElement
    if (!platformPickerInert.length) platformPickerInert = Array.from(document.querySelectorAll('.sidebar, .shell'), node => ({ node, inert: node.inert }))
    platformPickerInert.forEach(({ node }) => { node.inert = true })
    document.body.classList.add('platform-modal-open')
    document.dispatchEvent(new CustomEvent('workspace:dialog',{detail:{pageId}}))
  }
  function openProxyDialog(trigger) {
    if (!renderingModal) return openPage('proxy-create', { trigger })
    const root = document.getElementById('modal-root')
    if (window.ShadcnUI.isDialogOpen()) return
    const page = data.pages.find(item=>item.id==='proxy-create')
    window.ShadcnUI.openDialog(`<div class="platform-backdrop"><section class="platform-picker proxy-picker" role="dialog" aria-modal="true" aria-labelledby="proxy-picker-title" aria-describedby="proxy-picker-description"><header class="platform-picker-header"><div><h2 id="proxy-picker-title">${escapeHTML(page.title)}</h2><p id="proxy-picker-description">${escapeHTML(page.description)}</p></div><button type="button" class="platform-picker-close" data-close-platforms aria-label="关闭添加代理弹框">${icon('close')}</button></header><div class="proxy-picker-body">${groups(page.groups,false,page.id)}<div class="proxy-checks"><b>连接检测</b><span>可用性：未检测</span><span>连通性：未检测</span><span>出口时区：尚未获取</span></div></div><footer class="platform-picker-footer"><p>${escapeHTML(page.footerHint)}</p><div>${page.footer.map(button).join('')}</div></footer></section></div>`, trigger, closePage)
    const saved = drafts.get(page.id)
    if (saved) root.querySelectorAll('input[id],select[id]').forEach(input=>{if(saved[input.id]) input.value=saved[input.id].value})
    activateDialog(trigger,page.id,currentRoute)
  }
  function openSigninDialog(trigger) {
    if (!renderingModal) return openPage('signin', { trigger })
    const root = document.getElementById('modal-root')
    if (window.ShadcnUI.isDialogOpen()) return
    const page = data.pages.find(item=>item.id==='signin')
    window.ShadcnUI.openDialog(`<div class="platform-backdrop"><section class="platform-picker signin-picker" role="dialog" aria-modal="true" aria-labelledby="signin-title" aria-describedby="signin-description"><header class="platform-picker-header"><div><h2 id="signin-title">${escapeHTML(page.title)}</h2><p id="signin-description">${escapeHTML(page.description)}</p></div><button type="button" class="platform-picker-close" data-close-platforms aria-label="关闭登录框">${icon('close')}</button></header><form class="signin-form">${groups(page.groups,false,page.id)}<footer class="platform-picker-footer"><p>${escapeHTML(page.footerHint)}</p><div>${button({label:'取消',closeDialog:true})}${page.footer.map(button).join('')}</div></footer></form></section></div>`, trigger, closePage)
    const saved = drafts.get(page.id)
    if(saved) root.querySelectorAll('input[id]').forEach(input=>{if(saved[input.id]) input.value=saved[input.id].value})
    activateDialog(trigger,page.id,currentRoute)
    root.querySelector('input[type="email"]').focus()
  }
  function fillFingerprintForm() {
    document.querySelectorAll('[data-profile-path]').forEach(field=>{
      const control=field.querySelector('input,select')
      const value=getProfileValue(field.dataset.profilePath)
      if(control) control.value=Array.isArray(value) ? value.join(',') : value ?? ''
    })
    validateFingerprintDraft()
  }
  function validateFingerprintDraft() {
    const panel=document.getElementById('fingerprint-validation')
    if(!panel) return
    if (!fingerprintDraft.id) { panel.classList.remove('error', 'warning'); panel.textContent = '登录后从 SaaS 服务端获取默认参数。'; return }
    const issues=[]
    const warnings=[]
    try {
      fingerprintEngine.validateFingerprintProfile(fingerprintDraft)
      const audit=fingerprintEngine.auditGPUProfileConsistency(fingerprintDraft)
      issues.push(...audit.issues.filter(item=>item.severity==='error').map(item=>item.message))
      warnings.push(...audit.issues.filter(item=>item.severity==='warning').map(item=>item.message))
      const canonical=value=>Intl.getCanonicalLocales(value)[0]
      if(canonical(fingerprintDraft.locale.language)!==canonical(fingerprintDraft.locale.languages[0])) issues.push('主要语言须与语言列表首项一致。')
      const preferred=fingerprintDraft.browser.acceptLanguage.split(',').map(value=>{const [tag,weight]=value.trim().split(';q=');return {tag:canonical(tag),weight:weight===undefined ? 1 : Number(weight)}})
      if(preferred.some(item=>!Number.isFinite(item.weight)||item.weight<0||item.weight>1)) issues.push('请求语言权重须在零到一之间。')
      preferred.sort((a,b)=>b.weight-a.weight)
      if(!preferred.length || preferred[0].weight<=0 || preferred[0].tag!==canonical(fingerprintDraft.locale.language)) issues.push('请求语言的最高优先级须与主要语言一致。')
      const ua=fingerprintDraft.browser.userAgent
      if(ua) {
        const major=ua.match(/Chrome\/(\d+)/)?.[1]
        const platform=/Windows NT/.test(ua) ? 'Win32' : /Macintosh/.test(ua) ? 'MacIntel' : /Linux/.test(ua) ? 'Linux x86_64' : ''
        if(Number(major)!==fingerprintDraft.browser.chromiumMajor) issues.push('浏览器标识的版本须与内核版本一致。')
        if(platform!==fingerprintDraft.hardware.platform) issues.push('浏览器标识的系统须与平台类型一致。')
        if(/Android|Mobile|iPhone|iPad/i.test(ua)) issues.push('当前配置仅支持桌面浏览器标识。')
      }
    } catch(error) {
      const labels={'schemaVersion':'配置版本','hardware.hardwareConcurrency':'处理器线程数','hardware.deviceMemory':'设备内存','hardware.platform':'平台类型','screen.deviceScaleFactor':'设备缩放比例','screen':'屏幕','browser.chromiumMajor':'内核主版本','locale.timezone':'时区','locale.language':'主要语言','locale.languages':'语言列表','noise.seed':'噪声种子'}
      let message=error.name==='ProfileValidationError' ? error.message : '请检查语言、时区与参数格式。'
      Object.entries(labels).forEach(([key,label])=>{message=message.split(key).join(label)})
      issues.push(message)
    }
    panel.classList.toggle('error',issues.length>0)
    panel.classList.toggle('warning',issues.length===0 && warnings.length>0)
    panel.textContent=issues.length ? issues.join(' ') : warnings.length ? `配置存在需确认项：${warnings.join(' ')}` : '配置组合检查通过；启动时仍需核验设备与内核兼容性。'
  }
  function updateFingerprintDraft(event) {
    const field=event.target.closest?.('[data-profile-path]')
    if(!field) return
    if (!fingerprintDraft.id) return
    const path=field.dataset.profilePath
    let value=event.target.value
    if(path==='name') fingerprintName=value
    else {
      const keys=path.split('.');const target=fingerprintDraft[keys[0]]
      if(event.target.type==='number' || path==='browser.chromiumMajor' || path==='hardware.deviceMemory') value=Number(value)
      else if(path==='locale.languages') value=value.split(',').map(item=>item.trim()).filter(Boolean)
      else if(typeof getProfileValue(path)==='boolean') value=value==='true'
      else if(path==='browser.userAgent') value=value.trim() || null
      if(Object.is(target[keys[1]],value)) return
      target[keys[1]]=value
      if(path==='noise.canvas') fingerprintDraft.modules.canvas=value
      if(path==='noise.audio') fingerprintDraft.modules.audio=value
      if(path==='modules.screen') fingerprintDraft.modules.navigator=value
      if(path==='hardware.platform') {
        void generateFingerprint(value)
      }
      if(path==='locale.language') {
        fingerprintDraft.locale.languages=value==='zh-CN' ? ['zh-CN','zh'] : value==='en-US' ? ['en-US','en'] : ['ja-JP','ja']
        fingerprintDraft.browser.acceptLanguage=fingerprintDraft.locale.languages.map((tag,index)=>tag+(index ? ';q=0.9' : '')).join(',')
        fillFingerprintForm()
      }
    }
    validateFingerprintDraft()
  }
  function openPlatformPicker(trigger) {
    if (!renderingModal) return openPage('account-platforms', { trigger })
    const root = document.getElementById('modal-root')
    if (window.ShadcnUI.isDialogOpen()) return
    const page = data.pages.find(item => item.id === 'account-platforms')
    window.ShadcnUI.openDialog(`<div class="platform-backdrop"><section class="platform-picker" role="dialog" aria-modal="true" aria-labelledby="platform-picker-title" aria-describedby="platform-picker-description"><header class="platform-picker-header"><div><h2 id="platform-picker-title">${escapeHTML(page.title)}</h2><p id="platform-picker-description">${escapeHTML(page.description)}</p></div><button class="platform-picker-close" type="button" data-close-platforms aria-label="关闭添加账号弹框">${icon('close')}</button></header><div class="platform-picker-grid">${page.platforms.map(item => `<button class="platform-choice" type="button" data-platform-key="${escapeHTML(item.key)}" ${item.disabled ? 'disabled' : ''}><span class="platform-logo">${item.icon ? `<img src="${escapeHTML(item.icon)}" width="32" height="32" alt="">` : `<span aria-hidden="true">${escapeHTML(item.name.slice(0, 1))}</span>`}</span><strong>${escapeHTML(item.name)}</strong>${item.disabled ? `<small>${escapeHTML(item.status)}</small>` : ''}</button>`).join('')}</div><footer class="platform-picker-footer"><p>${escapeHTML(page.footnote)}</p><button class="button" type="button" data-close-platforms>取消</button></footer></section></div>`, trigger, closePage)
    activateDialog(trigger,page.id,currentRoute)
  }
  function updateSummary() {
    const read = id => document.getElementById(`field-${currentRoute}-${id}`)?.value?.trim() || ''
    const write = (label,value) => document.querySelectorAll('[data-summary-label]').forEach(node=>{if(node.dataset.summaryLabel===label) node.textContent=value})
    if (currentRoute === 'fingerprint-create' && fingerprintDraft.hardware) {
      write('平台类型',{'Win32':'Windows','MacIntel':'macOS','Linux x86_64':'Linux'}[fingerprintDraft.hardware.platform])
      write('主要语言',fingerprintDraft.locale.language)
      write('时区',fingerprintDraft.locale.timezone)
    }
    if (currentRoute === 'environment-create') {
      write('环境名称',read('0-0') || '未填写')
      const proxy = document.getElementById('field-environment-create-2-1')
      const direct = read('2-0') === '不使用代理'
      proxy.closest('.field').hidden = direct
      proxy.disabled = direct
      write('代理连接',direct ? '不使用代理' : '等待选择与检测')
      write('时区一致性',direct ? '等待指纹信息' : '等待出口时区检测')
    }
    if (currentRoute === 'accounts') {
      const selected = document.getElementById('filter-accounts-0')?.value
      const platform = data.pages.find(item=>item.id==='account-platforms').platforms.find(item=>item.name===selected)
      const title = document.querySelector('#page .empty-state h2')
      const description = document.querySelector('#page .empty-state p')
      if (platform && title) {title.textContent=`登录后查看${platform.name}账号`;description.textContent='登录并选择团队后加载对应平台的真实账号。'}
      else if (title) {const page=data.pages.find(item=>item.id==='accounts');title.textContent=page.table.emptyTitle;description.textContent=page.table.emptyText}
    }
  }
  function getSurface() { return document.querySelector('#modal-root [role="dialog"]') || document.getElementById('page') }
  function saveDraft() {
    if (!currentRoute) return
    const values={}
    getSurface().querySelectorAll('input[id],select[id],textarea[id]').forEach(input=>{if (input.type !== 'password') values[input.id]={value:input.value,checked:input.checked}})
    drafts.set(currentRoute,values)
  }
  function restoreDraft(route, surface) {
    const saved=drafts.get(route)
    if(saved) surface.querySelectorAll('input[id],select[id],textarea[id]').forEach(input=>{if(saved[input.id] && !input.closest('[data-profile-path]')){input.value=saved[input.id].value;input.checked=saved[input.id].checked}})
  }
  // 主页面始终保留在底层，二级操作只替换模态内容，不丢失列表筛选和滚动位置。
  function renderBasePage(route, force = false) {
    const page=data.pages.find(item=>item.id===route) || data.pages[0]
    const surface=document.getElementById('page')
    if (baseRoute !== page.id || force || !surface.firstElementChild) {
      const operation=currentRoute; currentRoute=page.id
      surface.className=`page-${page.kind} page-${page.id}`
      surface.innerHTML=renderPage(page)
      restoreDraft(page.id,surface)
      currentRoute=operation
    }
    baseRoute=page.id
    document.getElementById('page-context').textContent=navigationLabels[navigationRoute(page.id)] || page.title
    document.querySelectorAll('#navigation [data-route]').forEach(link=>{const active=link.dataset.route===navigationRoute(page.nav);link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current')})
  }
  function modalFamily(route) {
    if (['fingerprint-create','fingerprint-protection'].includes(route)) return 'fingerprint-editor'
    if (['account-platforms','account-authorize'].includes(route)) return 'account-authorization'
    if (['plans','payment'].includes(route)) return 'checkout'
    return route
  }
  function modalClosed(pageId) { document.dispatchEvent(new CustomEvent('workspace:modal-closed',{detail:{pageId}})) }
  function renderModal(entry) {
    const page=data.pages.find(item=>item.id===entry.pageId)
    currentRoute=page.id; modalPageId=page.id
    environmentReturn=modalStack.some(entry=>entry.pageId==='environment-create')
    authorizationReturn=modalStack.some(entry=>entry.pageId==='account-authorize')
    const root=document.getElementById('modal-root')
    window.ShadcnUI.closeDialog()
    renderingModal=true
    try {
      if(page.id==='signin') openSigninDialog(entry.trigger)
      else if(page.id==='proxy-create') openProxyDialog(entry.trigger)
      else if(page.id==='account-platforms') openPlatformPicker(entry.trigger)
      else if(page.id==='account-authorize') {
        window.ShadcnUI.openDialog(`<div class="platform-backdrop"><section class="platform-picker authorization-environment-picker" role="dialog" aria-modal="true" aria-labelledby="authorization-environment-title"><header class="platform-picker-header"><div><h2 id="authorization-environment-title">选择授权环境</h2><p>${escapeHTML(selectedPlatform?.name || '')} · 选择后直接打开登录页</p></div><button class="platform-picker-close" type="button" data-close-platforms aria-label="关闭环境选择">${icon('close')}</button></header><div class="authorization-environments" data-media-environments role="listbox" aria-label="授权浏览器环境"><p class="authorization-environment-empty">正在读取环境…</p></div></section></div>`, entry.trigger, closePage)
        activateDialog(entry.trigger,page.id,baseRoute)
      }
      else {
        const markup=document.createElement('div')
        markup.innerHTML=`<div class="platform-backdrop"><section class="platform-picker workspace-modal" role="dialog" aria-modal="true" aria-labelledby="workspace-modal-title" aria-describedby="workspace-modal-description"><header class="platform-picker-header"><div><h2 id="workspace-modal-title">${escapeHTML(page.title)}</h2><p id="workspace-modal-description">${escapeHTML(page.description || '')}</p></div><button class="platform-picker-close" type="button" data-close-platforms aria-label="关闭${escapeHTML(page.title)}">${icon('close')}</button></header><div class="workspace-modal-body page-${page.kind} page-${page.id}">${renderPage(page)}</div></section></div>`
        const heading=markup.querySelector('.page-heading')
        const actions=heading?.querySelector('.page-actions')
        if(actions) markup.querySelector('.platform-picker-header>div').append(actions)
        heading?.remove()
        const footer=markup.querySelector('.form-main>.form-footer')
        if(footer){footer.classList.add('workspace-modal-footer');markup.querySelector('.workspace-modal').append(footer)}
        window.ShadcnUI.openDialog(markup.innerHTML, entry.trigger, closePage)
        activateDialog(entry.trigger,page.id,baseRoute)
      }
    } finally { renderingModal=false }
    restoreDraft(page.id,getSurface())
    if(page.id==='account-authorize' && selectedPlatform) {
      const field=document.getElementById('field-account-authorize-0-0'); if(field) field.textContent=selectedPlatform.name
    }
    fillFingerprintForm();updateSummary()
    document.dispatchEvent(new CustomEvent('workspace:render',{detail:{route:page.id,modal:true}}))
  }
  function restoreModal(entry) {
    renderModal(entry)
    document.dispatchEvent(new CustomEvent('workspace:render',{detail:{route:entry.pageId,modal:true,restored:true}}))
  }
  function closePage(restoreFocus = true) {
    if(!modalStack.length) return
    saveDraft()
    const closed=modalStack.pop()
    const parent=modalStack[modalStack.length-1]
    if(parent) {restoreModal(parent);if(restoreFocus && closed.trigger?.isConnected)closed.trigger.focus()}
    else { clearDialog(false,false); currentRoute=baseRoute; if(restoreFocus && closed.trigger?.isConnected)closed.trigger.focus(); document.dispatchEvent(new CustomEvent('workspace:render',{detail:{route:baseRoute}})) }
    history.replaceState(null,'',`#${parent?.pageId || baseRoute}`)
    modalClosed(closed.pageId)
  }
  function closeAllPages() {
    if(!modalStack.length) return
    saveDraft()
    const closed=modalStack.splice(0)
    clearDialog(false,false); currentRoute=baseRoute
    history.replaceState(null,'',`#${baseRoute}`)
    document.dispatchEvent(new CustomEvent('workspace:render',{detail:{route:baseRoute}}))
    closed.reverse().forEach(entry=>modalClosed(entry.pageId))
  }
  function closePlatformPicker(restoreFocus = true) { closePage(restoreFocus) }
  function openPage(route, options = {}) {
    if(currentRoute) saveDraft()
    let page=data.pages.find(item=>item.id===route)
    if(!page) page=data.pages.find(item=>item.id==='overview')
    if(options.platform) selectedPlatform=data.pages.find(item=>item.id==='account-platforms').platforms.find(item=>item.key===options.platform) || null
    if(page.id==='account-authorize' && !selectedPlatform) page=data.pages.find(item=>item.id==='account-platforms')
    if(primaryRoutes.has(page.id)) {
      const closed=modalStack.splice(0)
      clearDialog(false,false);currentRoute=page.id
      renderBasePage(page.id, options.refresh || baseRoute !== page.id)
      if(!options.fromHistory && location.hash!==`#${page.id}`) history.pushState(null,'',`#${page.id}`)
      closed.reverse().forEach(entry=>modalClosed(entry.pageId))
      document.dispatchEvent(new CustomEvent('workspace:render',{detail:{route:page.id}}));return
    }
    const previous=currentRoute
    saveDraft()
    if(!baseRoute) { renderBasePage(page.nav || 'overview'); currentRoute=baseRoute }
    if(previous==='account-authorize' && page.id==='environment-create')authorizationReturn=true
    if(previous==='environment-create' && page.id==='fingerprint-create')environmentReturn=true
    const existing=modalStack.findIndex(entry=>entry.pageId===page.id)
    if(existing>=0 && existing<modalStack.length-1) {
      while(modalStack.length>existing+1){const closed=modalStack.pop();modalClosed(closed.pageId)}
      restoreModal(modalStack[existing])
    } else if(modalStack.at(-1)?.pageId===page.id) { renderModal(modalStack.at(-1)) }
    else {
      const top=modalStack.at(-1)
      if(top && (options.replace || modalFamily(top.pageId)===modalFamily(page.id))) {modalStack.pop();modalClosed(top.pageId)}
      else if(top) { top.suspended = true }
      const entry={pageId:page.id,trigger:options.trigger || document.activeElement,nodes:null}
      modalStack.push(entry);renderModal(entry)
    }
    if(modalStack.at(-1)?.pageId!==page.id) return
    if(!options.fromHistory && location.hash!==`#${page.id}`)history.pushState(null,'',`#${page.id}`)
    else if(options.fromHistory && location.hash!==`#${page.id}`)history.replaceState(null,'',`#${page.id}`)
  }
  function render() {
    const route=location.hash.slice(1).split('?')[0] || 'overview'
    if(!baseRoute && !primaryRoutes.has(route))renderBasePage(data.pages.find(item=>item.id===route)?.nav || 'overview')
    openPage(route,{fromHistory:true,refresh:!modalStack.length && route===baseRoute})
  }
  document.addEventListener('click',event=>{
    const category=event.target.closest('[data-form-category]')
    if(category) {
      const scope=category.dataset.formScope;const index=Number(category.dataset.formCategory)
      formCategories.set(scope,index)
      document.querySelectorAll('[data-group-panel]').forEach(panel=>{if(panel.dataset.formScope===scope) panel.hidden=Number(panel.dataset.groupPanel)!==index})
      document.querySelectorAll('[data-form-category]').forEach(item=>{if(item.dataset.formScope===scope) item.setAttribute('aria-pressed',String(item===category))})
      return
    }
    if(event.target.closest('[data-action="generate-fingerprint"]')) {
      void generateFingerprint(fingerprintDraft.hardware?.platform || 'Win32')
      return
    }
    const closeButton = event.target.closest('[data-close-platforms]')
    if (closeButton) {
      closePlatformPicker()
      return
    }
    const platformButton = event.target.closest('[data-platform-key]')
    if (platformButton) {
      const page = data.pages.find(item => item.id === 'account-platforms')
      const platform = page.platforms.find(item => item.key === platformButton.dataset.platformKey)
      if (!platform || platform.disabled || platformButton.disabled) return
      selectedPlatform = platform
      openPage('account-authorize',{replace:true,trigger:platformButton})
      return
    }
    const link=event.target.closest('[data-route]')
    if(!link) return
    event.preventDefault()
    const next=link.dataset.route
    if(currentRoute==='account-authorize' && next==='environment-create') authorizationReturn=true
    if(next==='accounts') authorizationReturn=false
    if(currentRoute==='environment-create' && next==='fingerprint-create') environmentReturn=true
    if(next==='environments') environmentReturn=false
    openPage(next,{trigger:link})
  })
  document.addEventListener('input',event=>{updateFingerprintDraft(event);updateSummary()})
  document.addEventListener('change',event=>{updateFingerprintDraft(event);updateSummary()})
  document.addEventListener('toggle',event=>{
    const key=event.target.dataset?.groupKey
    if(key) {if(event.target.open) expandedGroups.add(key);else expandedGroups.delete(key)}
  },true)
  document.addEventListener('workspace:accordion-toggle', event => {
    if (event.detail?.open) expandedGroups.add(event.detail.key)
    else expandedGroups.delete(event.detail?.key)
  })
  document.addEventListener('submit',event=>event.preventDefault())
  window.addEventListener('hashchange',render)
  window.WorkspaceUI = {
    render,
    resetDraft: route => drafts.delete(route),
    closeDialog: closePlatformPicker,
    closePage,
    closeAllPages,
    openPage,
    getSurface,
    getBaseRoute: () => baseRoute,
    renderBase: () => renderBasePage(baseRoute,true),
    openSignin: openSigninDialog,
    getFingerprint: () => ({name:fingerprintName,profile:structuredClone(fingerprintDraft),generating:generationPending}),
    setFingerprint: (profile,name='') => {generationRevision++;generationPending=false;Object.assign(fingerprintDraft,structuredClone(profile));fingerprintName=name;fillFingerprintForm();updateSummary()},
    resetFingerprint: () => {generationRevision++;generationPending=false;Object.keys(fingerprintDraft).forEach(key=>delete fingerprintDraft[key]);fingerprintName='';fillFingerprintForm();updateSummary()},
    getRoute: () => currentRoute
  }
  render()
})()
