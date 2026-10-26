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

  const pageTitles = {
    overview: '工作台',
    environments: '环境列表',
    'create-basic': '新建环境',
    'create-network': '新建环境',
    'create-fingerprint': '新建环境',
    detail: '环境详情',
    browser: '环境浏览器',
    proxies: '代理资源',
    'creator-video': 'AI 创作',
    'creator-article': 'AI 创作',
    'creator-post': 'AI 创作',
    'creator-assets': 'AI 创作',
    'creator-publish': 'AI 创作',
    members: '团队成员',
    audit: '操作记录',
    billing: '订阅计费',
    settings: '系统设置',
    onboarding: '首次使用',
    'proxy-error': '代理连接诊断',
    search: '搜索',
    'media-panel': '媒体提取中心',
    'media-queue': '媒体下载队列',
    'x-grok-panel': 'X 发帖控制'
  }

  const creatorTabs = [
    ['creator-video', '视频创作', 'video'],
    ['creator-article', '长文排版', 'article'],
    ['creator-post', '图文笔记', 'image'],
    ['creator-assets', '作品库', 'folder'],
    ['creator-publish', '发布配置', 'arrow']
  ]

  function icon (name, extraClass = '') {
    return `<svg class="${extraClass}" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.file}</svg>`
  }

  function button (text, route, style = '') {
    if (route) return `<a class="button ${style}" href="#${route}" data-route="${route}">${text}</a>`
    return `<button class="button ${style}" type="button" data-action="notice">${text}</button>`
  }

  function pageHeading (eyebrow, title, description, actions = '') {
    return `<header class="page-heading"><div class="page-heading-main"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="page-description">${description}</p></div>${actions ? `<div class="page-actions">${actions}</div>` : ''}</header>`
  }

  function emptyIllustration () {
    return `<div class="empty-illustration" aria-hidden="true"><div class="empty-window"></div><span class="empty-plus">＋</span></div>`
  }

  function emptyState (title, text, action = '', className = '') {
    return `<div class="empty-state ${className}">${emptyIllustration()}<h2>${title}</h2><p>${text}</p>${action ? `<div class="empty-actions">${action}</div>` : ''}</div>`
  }

  function stepper (active) {
    const labels = ['基本信息', '网络连接', '指纹配置']
    return `<div class="stepper" aria-label="环境创建进度">${labels.map((label, index) => `<div class="step ${index + 1 === active ? 'active' : index + 1 < active ? 'done' : ''}"><span class="step-number">${index + 1 < active ? '✓' : index + 1}</span><span>${label}</span></div>${index < labels.length - 1 ? '<span class="step-line"></span>' : ''}`).join('')}</div>`
  }

  function creatorShell (route, body) {
    const current = creatorTabs.find(item => item[0] === route) || creatorTabs[0]
    return `<div class="creator-header"><div><p class="eyebrow">可选工具</p><h1>AI 创作中心</h1><p>按需使用视频、长文、图文与发布工具；不影响环境创建和浏览。</p></div><span class="tag neutral">扩展工具</span></div><nav class="creator-tabs" aria-label="创作工作区">${creatorTabs.map(([id, label, symbol]) => `<a class="creator-tab ${id === current[0] ? 'active' : ''}" href="#${id}" data-route="${id}" role="tab" aria-selected="${id === current[0]}">${icon(symbol)}${label}</a>`).join('')}</nav>${body}`
  }

  function renderOverview () {
    return `${pageHeading('本机工作空间', '工作台', '集中管理独立浏览环境、代理连接与会话状态。每项业务从一个清晰、可控的环境开始。', button('<span class="button-icon">＋</span>新建环境', 'create-basic', 'primary'))}
      <section class="hero"><div class="hero-copy"><p class="eyebrow">栖界 · 独立浏览环境</p><h1>让每个账号，<br>都有自己的工作空间。</h1><p>为不同业务隔离登录状态和浏览数据。按需配置代理，在同一处查看环境、连接与会话状态。</p><div class="hero-actions">${button('<span class="button-icon">＋</span>创建浏览环境', 'create-basic', 'primary')}${button('浏览产品工作方式', 'onboarding', 'ghost')}</div></div><div class="hero-visual" aria-hidden="true"><div class="browser-illustration"><div class="illustration-sidebar"></div><div class="illustration-content"><div class="illustration-card"></div></div></div><div class="floating-chip one"><i></i> 独立会话</div><div class="floating-chip two"><i></i> 本地数据</div></div></section>
      <div class="home-grid"><section class="surface home-panel"><div class="section-title"><div><h2>从这里开始</h2><p>创建并启动一个隔离的浏览环境</p></div><a class="text-link" href="#environments" data-route="environments">环境管理 <span aria-hidden="true">→</span></a></div><div class="workflow"><div class="workflow-step current"><span class="step-number">1</span><b>建立环境</b><p>设置业务名称、启动网址和本机数据位置。</p></div><div class="workflow-step"><span class="step-number">2</span><b>确认连接</b><p>选择网络方式。代理无法连接时会阻止启动。</p></div><div class="workflow-step"><span class="step-number">3</span><b>开始工作</b><p>在独立会话中访问网站，登录状态与其他环境隔离。</p></div></div></section>
      <section class="surface home-panel"><div class="section-title"><div><h2>默认保护</h2><p>让关键边界清晰可见</p></div>${icon('shield')}</div><div class="local-principles"><div class="principle"><span class="principle-icon">${icon('folder')}</span><div><b>数据优先保存在本机</b><p>登录信息和环境数据不会默认上传。</p></div></div><div class="principle"><span class="principle-icon">${icon('globe')}</span><div><b>代理失败不自动直连</b><p>连接异常时明确提示，保留当前配置。</p></div></div><div class="principle"><span class="principle-icon">${icon('lock')}</span><div><b>环境之间相互隔离</b><p>同一环境的标签共享会话，不同环境独立。</p></div></div></div></section></div>
      <div class="home-bottom"><section class="surface home-panel"><div class="section-title"><div><h2>最近使用的环境</h2><p>创建后会显示在这里</p></div><a class="text-link" href="#environments" data-route="environments">查看全部</a></div>${emptyState('尚未创建浏览环境', '先为一项业务建立独立会话。创建过程会分步说明数据保存、网络和指纹配置。', button('新建环境', 'create-basic', 'primary'), 'recent-empty')}</section><section class="surface home-panel"><div class="section-title"><div><h2>需要帮助？</h2><p>快速了解产品与数据边界</p></div>${icon('file')}</div><div class="local-principles"><div class="principle"><span class="principle-icon">${icon('browser')}</span><div><b>环境与浏览器标签</b><p>了解环境、会话与多标签页之间的关系。</p></div></div><div class="principle"><span class="principle-icon">${icon('warning')}</span><div><b>代理连接异常</b><p>查看检查失败后的处理方式。</p></div></div></div><div style="margin-top:13px">${button('打开首次使用指南', 'onboarding', 'soft small')}</div></section></div>`
  }

  function renderEnvironments () {
    return `${pageHeading('核心工作 / 隔离会话', '环境列表', '每个环境拥有独立的浏览会话、配置快照与启动网址。', button('<span class="button-icon">＋</span>新建环境', 'create-basic', 'primary'))}
      <section class="surface"><div class="tabs" role="tablist" aria-label="环境状态筛选"><button class="tab active" type="button" role="tab" aria-selected="true">全部环境</button><button class="tab" type="button" role="tab" aria-selected="false">正在运行</button><button class="tab" type="button" role="tab" aria-selected="false">需要处理</button></div><div class="filter-bar"><label class="search-field">${icon('search')}<input aria-label="搜索环境" placeholder="搜索环境名称或编号"></label><select class="select-field" aria-label="按分组筛选"><option>全部分组</option><option>未分组</option></select><select class="select-field" aria-label="环境排序"><option>最近使用</option><option>按名称排序</option></select><button class="button small" type="button" data-action="notice">管理分组</button></div>${emptyState('这里还没有环境', '为一项业务创建独立环境。浏览数据和登录状态会与其他环境隔离。', `${button('创建第一个环境', 'create-basic', 'primary')}${button('了解环境隔离', 'onboarding', 'soft')}`, 'env-empty')}<div class="list-foot"><span>环境名称、代理和运行状态会在创建后显示。</span><span>本机数据</span></div></section>`
  }

  function renderCreate (active) {
    const route = active === 1 ? 'create-basic' : active === 2 ? 'create-network' : 'create-fingerprint'
    const title = active === 1 ? '先建立业务环境' : active === 2 ? '选择网络连接方式' : '确认浏览器配置'
    const description = active === 1 ? '为环境命名并选择本机保存方式。后续可单独修改启动网址。' : active === 2 ? '可以直接连接，也可以按需配置代理。连接检查会在创建前执行。' : '选择内核默认配置或按需填写参数。可用能力以实际运行时检查结果为准。'
    let content = ''
    if (active === 1) {
      content = `<div class="form-stack"><label class="field"><span>环境名称<span class="required">*</span></span><input autocomplete="off" placeholder="输入便于识别的名称"><small>建议按业务用途命名，方便以后查找。</small></label><div class="form-grid"><label class="field"><span>业务分组</span><select><option>暂不分组</option></select><small>可以稍后建立或调整分组。</small></label><label class="field"><span>启动网址</span><input inputmode="url" placeholder="https://"><small>留空时可在启动后输入网址。</small></label></div><div class="divider"></div><div><label class="field"><span>数据保存方式</span></label><div class="radio-options" style="margin-top:8px"><label class="radio-option selected"><input type="radio" name="storage" checked><span><b>保存在本机</b><small>登录状态和环境数据仅保存在这台设备。</small></span></label><label class="radio-option"><input type="radio" name="storage" disabled><span><b>跨设备同步</b><small>需要工作空间同步服务接入后使用。</small></span></label></div></div></div>`
    } else if (active === 2) {
      content = `<div class="form-stack"><div><label class="field"><span>网络方式</span></label><div class="radio-options" style="margin-top:8px"><label class="radio-option selected"><input type="radio" name="network" checked><span><b>直接连接</b><small>使用当前设备网络。适合不需要独立出口的场景。</small></span></label><label class="radio-option"><input type="radio" name="network"><span><b>使用代理</b><small>连接指定代理。无法连接时不会自动改为直连。</small></span></label></div></div><div class="notice">${icon('shield')}代理连接检查会在保存前执行。凭据只在需要时显示，保存后默认掩码。</div><div class="form-grid"><label class="field"><span>代理协议</span><select><option>选择协议</option><option>HTTP / HTTPS</option><option>SOCKS5</option></select></label><label class="field"><span>代理地址</span><input placeholder="主机名或 IP 地址"></label><label class="field"><span>端口</span><input inputmode="numeric" placeholder="端口号"></label><label class="field"><span>用户名（可选）</span><input autocomplete="off" placeholder="代理用户名"></label><label class="field"><span>密码（可选）</span><input type="password" autocomplete="new-password" placeholder="代理密码"></label></div><div class="field-error" aria-live="polite" hidden>代理连接失败时会在此显示处理说明。</div><button class="button soft" type="button" data-action="notice">检查代理连接</button></div>`
    } else {
      content = `<div class="form-stack"><div><label class="field"><span>指纹配置方式</span></label><div class="radio-options" style="margin-top:8px"><label class="radio-option selected"><input type="radio" name="fingerprint" checked><span><b>使用内核默认配置</b><small>使用当前运行时提供的默认值。</small></span></label><label class="radio-option"><input type="radio" name="fingerprint"><span><b>自定义配置</b><small>按需调整语言、时区、屏幕和硬件参数。</small></span></label></div></div><div class="surface-flat" style="padding:14px"><div class="section-title" style="margin-bottom:11px"><div><h2>配置摘要</h2><p>首次启动前保存为稳定快照</p></div><span class="tag blue">待运行时校验</span></div><div class="summary-list"><div class="summary-row"><span>浏览器内核</span><b>由当前运行时提供</b></div><div class="summary-row"><span>语言与时区</span><b>使用设备默认值</b></div><div class="summary-row"><span>屏幕与图形参数</span><b>按运行时能力检查</b></div></div></div><div class="notice">${icon('lock')}创建后，指纹配置会随环境保存。修改前需要关闭正在运行的环境。</div></div>`
    }
    const forward = active === 1 ? 'create-network' : 'create-fingerprint'
    const actionText = active === 3 ? '创建环境' : '继续'
    return `${pageHeading('环境列表 / 新建', '新建环境', '用三步建立一个可独立管理的浏览环境。')}${stepper(active)}<div class="step-layout"><section class="surface form-card"><div class="form-card-head"><div><h2>${title}</h2><p>${description}</p></div><span class="tag neutral">第 ${active} 步 / 共 3 步</span></div>${content}<div class="flow-footer"><small>环境数据默认保存在本机。</small><div class="flow-actions">${active > 1 ? button('上一步', active === 2 ? 'create-basic' : 'create-network', 'soft') : button('取消', 'environments', 'ghost')}${active < 3 ? button(`继续 ${icon('arrow')}`, forward, 'primary') : `<button class="button primary" type="button" data-action="notice">${actionText} ${icon('arrow')}</button>`}</div></div></section><aside class="surface aside-card"><h3>${active === 1 ? '创建前了解' : active === 2 ? '网络连接规则' : '指纹配置原则'}</h3><p>${active === 1 ? '环境是独立会话的边界。每个环境拥有自己的 Cookie、缓存和浏览数据。' : active === 2 ? '只有连接检查成功后，使用代理的环境才会启动。失败时保留代理配置并提示修复。' : '模板仅提供配置起点。实际支持能力由当前运行时决定，不以页面选项代替验证。'}</p><ul class="check-list"><li><span class="check-icon">✓</span><span>${active === 1 ? '不同环境的登录状态相互隔离' : active === 2 ? '代理认证信息默认以掩码显示' : '关闭环境后才能编辑配置'}</span></li><li><span class="check-icon">✓</span><span>${active === 1 ? '环境可以稍后编辑和分组' : active === 2 ? '失败时不会自动切换成本机网络' : '未配置时保持内核原生行为'}</span></li></ul><div class="divider" style="margin:16px 0 12px"></div><a class="text-link" href="#proxy-error" data-route="proxy-error">查看连接失败示例 →</a></aside></div>`
  }

  function renderDetail () {
    return `${pageHeading('环境列表 / 环境详情', '环境详情', '环境名称、连接方式、指纹快照与使用状态集中查看。', button('返回环境列表', 'environments', 'soft'))}<div class="split-layout"><div class="detail-sections"><section class="surface detail-section"><h2>基础信息</h2><div class="placeholder-row"><span>环境名称</span><b>选择环境后显示真实名称</b></div><div class="placeholder-row"><span>环境编号</span><b>由系统读取，不在评审稿中生成</b></div><div class="placeholder-row"><span>数据位置</span><b>读取本机配置</b></div><div class="placeholder-row"><span>最近使用</span><b>由真实运行记录提供</b></div></section><section class="surface detail-section"><h2>网络与代理</h2><div class="placeholder-row"><span>连接方式</span><b>选择环境后显示真实配置</b></div><div class="placeholder-row"><span>代理地址</span><b>认证信息默认掩码</b></div><div class="placeholder-row"><span>连接检查</span><b>尚未执行</b></div></section><section class="surface detail-section"><h2>指纹配置快照</h2><div class="placeholder-row"><span>配置来源</span><b>读取当前环境快照</b></div><div class="placeholder-row"><span>兼容性</span><b>由实际运行时检查</b></div></section></div><aside class="surface detail-aside"><h3>先选择一个环境</h3><p>环境详情只呈现已保存的真实配置。这里不预填演示名称、代理地址、运行记录或指纹值。</p>${button('打开环境列表', 'environments', 'primary small')}<div class="divider" style="margin:16px 0"></div><div class="summary-row"><span>浏览会话</span><b>按环境隔离</b></div><div class="summary-row"><span>配置修改</span><b>运行中时锁定</b></div></aside></div>`
  }

  function renderBrowser () {
    return `${pageHeading('环境列表 / 浏览器窗口', '环境浏览器', '在独立会话中访问网站。同一环境的网页标签共享登录状态。', button('返回环境列表', 'environments', 'soft'))}<section class="surface browser-page-card"><div class="browser-envbar"><div class="browser-envbar-left">${icon('browser')}<b>尚未选择环境</b><span class="tag neutral">会话未启动</span></div><div class="browser-envbar-right"><span class="tag blue">本机浏览器</span></div></div><div class="browser-toolbar-inner"><button class="browser-tool-button" aria-label="后退" disabled>${icon('back')}</button><button class="browser-tool-button" aria-label="刷新" disabled>↻</button><div class="browser-address">${icon('lock')}<span>选择环境后输入网址</span></div><button class="browser-tool-button" aria-label="下载" disabled>${icon('download')}</button></div><div class="browser-web-empty">${emptyIllustration()}<h2>选择一个环境开始浏览</h2><p>每个环境拥有独立的 Cookie、缓存和网络配置。当前页面不会打开外部网站。</p>${button('前往环境列表', 'environments', 'primary small')}</div><div class="browser-footnote">不同环境使用不同会话；同一环境中的网页标签共享登录状态。</div></section>`
  }

  function renderProxies () {
    return `${pageHeading('网络资源', '代理资源', '集中检查代理连接，并查看环境绑定关系。代理异常时不会静默改用本机网络。', `<button class="button" type="button" data-action="notice">导入代理</button><button class="button primary" type="button" data-action="notice"><span class="button-icon">＋</span>添加代理</button>`)}
      <div class="proxy-summary"><section class="surface summary-tile"><small>代理条目</small><b>连接后显示</b></section><section class="surface summary-tile"><small>连接状态</small><b>按需执行检查</b></section><section class="surface summary-tile"><small>认证凭据</small><b>默认掩码显示</b></section></div>
      <section class="surface"><div class="table-head"><span>代理名称</span><span>类型与地址</span><span>出口地区</span><span>绑定环境</span><span>连接状态</span></div>${emptyState('尚未添加代理资源', '添加前准备好代理协议、服务器地址和端口。保存后可以执行连接检查。', `<button class="button primary" type="button" data-action="notice"><span class="button-icon">＋</span>添加代理</button><button class="button soft" type="button" data-route="proxy-error" data-action="route">查看异常处理</button>`, 'table-empty')}<div class="list-foot"><span>代理凭据不会显示在列表中。</span><span>本机管理</span></div></section>`
  }

  function renderCreatorVideo () {
    return creatorShell('creator-video', `<div class="creator-workspace"><section class="surface creator-pane"><div class="pane-head"><h2>视频项目设置</h2><span class="tag green">本地渲染</span></div><div class="pane-content"><div class="upload-zone">${icon('video')}<b>选择本地视频素材</b><small>添加后会显示真实文件名与大小，不预置演示素材。</small><button class="button small" type="button" data-action="notice">浏览本机文件</button></div><label class="field"><span>创作主题</span><input placeholder="输入视频主题或要点"></label><div class="form-grid"><label class="field"><span>视频时长</span><select><option>选择时长</option><option>15 秒</option><option>30 秒</option><option>60 秒</option></select></label><label class="field"><span>画面比例</span><select><option>选择比例</option><option>9:16 竖屏</option><option>16:9 横屏</option></select></label></div><label class="field"><span>字幕</span><select><option>按需添加字幕</option><option>开启</option><option>关闭</option></select></label></div><div class="pane-actions"><small>渲染使用本机 FFmpeg。</small><button class="button primary small" type="button" data-action="notice" disabled>生成分镜</button></div></section><section class="surface creator-pane"><div class="pane-head"><h2>预览与分镜</h2><span class="tag neutral">等待素材</span></div><div class="preview-canvas"><span class="preview-icon">${icon('video')}</span><h3>预览将在这里生成</h3><p>添加素材并填写创作主题后，可检查分镜、字幕和视频画面。</p></div></section></div>`)
  }

  function renderCreatorArticle () {
    return creatorShell('creator-article', `<div class="creator-workspace"><section class="surface creator-pane"><div class="pane-head"><h2>文章设置</h2><span class="tag blue">公众号排版</span></div><div class="pane-content"><label class="field"><span>文章主题</span><input placeholder="输入文章主题"></label><div class="form-grid"><label class="field"><span>内容风格</span><select><option>选择内容风格</option><option>知识分享</option><option>产品介绍</option><option>新闻简报</option></select></label><label class="field"><span>目标平台</span><select><option>选择发布平台</option><option>微信公众号</option></select></label></div><label class="field"><span>关键词（选填）</span><input placeholder="添加有助于表达重点的关键词"></label><div class="notice">${icon('file')}生成内容需要人工检查。排版预览不代表已经发布。</div></div><div class="pane-actions"><small>支持 Markdown 编辑与排版预览。</small><button class="button primary small" type="button" data-action="notice" disabled>开始撰写</button></div></section><section class="surface creator-pane"><div class="pane-head"><h2>文章预览</h2><button class="button small" type="button" data-action="notice" disabled>复制排版</button></div><div class="preview-canvas"><span class="preview-icon">${icon('article')}</span><h3>文章预览区</h3><p>填写主题并生成或编辑内容后，在此检查标题、正文与排版效果。</p></div></section></div>`)
  }

  function renderCreatorPost () {
    return creatorShell('creator-post', `<div class="creator-workspace"><section class="surface creator-pane"><div class="pane-head"><h2>图文内容</h2><span class="tag blue">多图笔记</span></div><div class="pane-content"><label class="field"><span>笔记标题</span><input placeholder="输入笔记标题"></label><label class="field"><span>正文内容</span><textarea placeholder="写下你的内容"></textarea></label><div class="upload-zone">${icon('image')}<b>添加图片</b><small>从本机选择图片。支持拖动调整顺序和封面。</small><button class="button small" type="button" data-action="notice">选择图片</button></div><label class="field"><span>发布平台</span><select><option>选择发布平台</option><option>小红书</option><option>抖音</option></select></label></div><div class="pane-actions"><small>发布前请检查图片和平台格式。</small><button class="button primary small" type="button" data-action="notice" disabled>预览图文</button></div></section><section class="surface creator-pane"><div class="pane-head"><h2>移动端预览</h2><span class="tag neutral">暂无内容</span></div><div class="preview-canvas"><div class="phone-preview"><div class="phone-notch"></div><div class="phone-screen"><span class="preview-icon">${icon('image')}</span><b>内容预览</b><small>添加标题与图片后显示真实内容</small></div></div></div></section></div>`)
  }

  function renderCreatorAssets () {
    return creatorShell('creator-assets', `<section class="surface"><div class="filter-bar"><label class="search-field">${icon('search')}<input aria-label="搜索作品" placeholder="搜索作品名称"></label><select class="select-field" aria-label="作品类型"><option>全部类型</option><option>视频</option><option>长文</option><option>图文</option></select><button class="button small" type="button" data-action="notice">刷新作品库</button></div>${emptyState('作品库暂时为空', '本机生成或保存的作品会在这里整理。当前没有预置示例内容。', button('开始创作', 'creator-video', 'primary'), 'table-empty')}<div class="list-foot"><span>作品和素材保存在本机。</span><span>本地资产</span></div></section>`)
  }

  function renderCreatorPublish () {
    return creatorShell('creator-publish', `<div class="publish-layout"><section class="surface"><div class="pane-head"><h2>选择发布账号</h2><span class="tag neutral">由环境登录状态提供</span></div>${emptyState('没有可用的发布账号', '请先在目标浏览环境中登录平台账号。账号状态读取成功后，会列在这里供你选择。', button('前往环境列表', 'environments', 'primary small'), 'account-empty')}<div class="list-foot"><span>不会从其他环境读取登录状态。</span><span>账号按环境隔离</span></div></section><section class="surface"><div class="pane-head"><h2>发布内容</h2><span class="tag neutral">待选择账号</span></div><div class="publish-options"><label class="field"><span>发布平台</span><select disabled><option>选择已关联账号后可用</option></select></label><label class="field"><span>发布时间</span><select disabled><option>选择立即发布或定时发布</option></select></label><div class="notice">${icon('lock')}账号授权、内容预览和发布结果会按每个目标账号分别确认。</div><button class="button primary" type="button" disabled>确认发布</button></div></section></div>`)
  }

  function renderMembers () {
    return `${pageHeading('协作与管理', '团队成员', '按成员与环境范围管理访问权限。成员变更应留下可追溯记录。', `<button class="button primary" type="button" data-action="notice">邀请成员</button>`)}<section class="surface"><div class="tabs" role="tablist"><button class="tab active" role="tab" aria-selected="true">成员</button><button class="tab" role="tab" aria-selected="false">角色与权限</button><button class="tab" role="tab" aria-selected="false">邀请记录</button></div><div class="filter-bar"><label class="search-field">${icon('search')}<input aria-label="搜索成员" placeholder="搜索成员姓名或邮箱"></label><select class="select-field" aria-label="成员角色"><option>所有角色</option></select><button class="button small" type="button" data-action="notice">权限说明</button></div>${emptyState('还没有邀请团队成员', '邀请成员后，可以按角色和环境范围授予权限。敏感操作应明确授权并记录。', button('邀请成员', null, 'primary'), 'table-empty')}<div class="list-foot"><span>成员列表只显示真实工作空间成员。</span><span>权限变更可审计</span></div></section>`
  }

  function renderAudit () {
    return `${pageHeading('协作与管理', '操作记录', '按时间、成员和结果查找关键变更。记录不包含 Cookie、代理密码或网页正文。', `<button class="button" type="button" data-action="notice">导出记录</button>`)}<section class="surface"><div class="record-filters"><span class="filter-caption">筛选记录</span><select class="select-field" aria-label="日期范围"><option>选择时间范围</option></select><select class="select-field" aria-label="操作人"><option>所有成员</option></select><select class="select-field" aria-label="操作类型"><option>所有操作</option></select><select class="select-field" aria-label="操作结果"><option>所有结果</option></select><button class="button small" type="button" data-action="notice">清除筛选</button></div><div class="audit-table"><span>发生时间</span><span>成员</span><span>操作</span><span>目标</span><span>结果</span></div>${emptyState('暂无操作记录', '环境、网络和权限变更将在操作发生后写入记录。当前不显示虚构的成员或事件。', '', 'table-empty')}<div class="list-foot"><span>敏感数据默认脱敏。</span><span>记录由真实操作生成</span></div></section>`
  }

  function renderBilling () {
    return `${pageHeading('协作与管理', '订阅计费', '查看工作空间的订阅权益和用量。仅展示服务端确认的套餐、价格与账单。')}<section class="billing-state"><div class="billing-icon">${icon('card')}</div><div><span class="tag orange">服务尚未连接</span><h2 style="margin-top:10px">订阅与在线计费暂不可用</h2><p>当前评审稿不展示套餐价格、账单金额或配额数字。计费服务接入后，页面会读取真实订阅状态和用量。</p></div></section><div class="billing-grid"><section class="surface billing-card"><h3>工作空间权益</h3><p>由订阅服务返回当前可用环境数、成员席位和同步空间。套餐详情未接入前不显示虚构权益。</p><div style="margin-top:14px"><button class="button small" type="button" data-action="notice" disabled>查看套餐</button></div></section><section class="surface billing-card"><h3>发票与付款方式</h3><p>付款记录、发票信息和续费状态将在安全的计费服务接入后显示。</p><div style="margin-top:14px"><button class="button small" type="button" data-action="notice" disabled>管理付款方式</button></div></section></div>`
  }

  function renderSettings () {
    return `${pageHeading('协作与管理', '系统设置', '调整本地数据保护、代理检查、更新与诊断。')}<div class="settings-layout"><div class="settings-list"><section class="surface setting-section"><h2>环境与数据</h2><div class="setting-row"><div><b>关闭环境前创建恢复点</b><p>保留可恢复状态。磁盘空间不足时显示明确提醒。</p></div><button class="switch on" role="switch" aria-checked="true" aria-label="关闭环境前创建恢复点"></button></div><div class="setting-row"><div><b>启动前检查代理连接</b><p>代理无法连接时阻止启动，不静默切换到本机网络。</p></div><button class="switch on" role="switch" aria-checked="true" aria-label="启动前检查代理连接"></button></div><div class="setting-row"><div><b>环境数据位置</b><p>显示由应用实际配置的本机存储路径。</p></div><button class="button small" type="button" data-action="notice">查看位置</button></div></section><section class="surface setting-section"><h2>更新与诊断</h2><div class="setting-row"><div><b>检查更新</b><p>检查客户端与内核版本，并保留环境数据。</p></div><button class="button small" type="button" data-action="notice">检查更新</button></div><div class="setting-row"><div><b>导出诊断信息</b><p>导出前预览具体字段，不包含登录数据、代理密码或网页正文。</p></div><button class="button small" type="button" data-action="notice">预览内容</button></div><div class="setting-row"><div><b>减少界面动效</b><p>可跟随系统偏好设置。</p></div><span class="setting-value">跟随系统</span></div></section></div><aside><section class="surface settings-aside"><div class="billing-icon" style="margin-bottom:12px">${icon('shield')}</div><h3>能力以实际运行时为准</h3><p>内核版本、平台架构和指纹能力通过本机运行时读取。页面选项不代表能力已经验证。</p><div class="summary-row"><span>运行时信息</span><b>由客户端提供</b></div><div class="summary-row"><span>能力检查</span><b>启动时读取</b></div><div style="margin-top:13px">${button('查看产品工作方式', 'onboarding', 'soft small')}</div></section></aside></div>`
  }

  function renderOnboarding () {
    return `${pageHeading('开始使用', '了解栖界', '从独立环境和会话隔离开始，按需管理代理、数据和团队访问。', button('创建浏览环境', 'create-basic', 'primary'))}<section class="onboarding-hero"><div><p class="eyebrow">先本地，后协作</p><h1>工作空间清晰，<br>每个环境彼此独立。</h1><p>栖界围绕浏览环境组织日常工作：先为业务创建独立会话，再选择网络和指纹配置。可选工具与团队权限不会改变环境隔离边界。</p></div><div class="onboarding-art" aria-hidden="true"><span class="ring">${icon('shield')}</span></div></section><div class="onboarding-grid"><section class="surface onboarding-card"><span class="principle-icon">${icon('browser')}</span><h2>1. 建立浏览环境</h2><p>每个环境拥有独立的 Cookie、缓存和登录状态，便于分开管理不同业务。</p></section><section class="surface onboarding-card"><span class="principle-icon">${icon('globe')}</span><h2>2. 检查网络连接</h2><p>直连或指定代理由你选择。代理检查失败时，会告诉你如何恢复。</p></section><section class="surface onboarding-card"><span class="principle-icon">${icon('folder')}</span><h2>3. 管理本机数据</h2><p>数据默认留在本机。同步与计费状态只在服务实际可用时展示。</p></section></div>`
  }

  function renderProxyError () {
    return `${pageHeading('环境列表 / 网络诊断', '代理连接诊断', '失败信息应说明问题并给出下一步，不暴露原始错误对象。', button('返回新建流程', 'create-network', 'soft'))}<div class="error-page"><section class="error-banner"><span class="error-symbol">${icon('warning')}</span><div><h2>无法连接此代理</h2><p>请检查代理协议、服务器地址、端口和认证信息，然后重新检查。当前配置已保留，浏览器不会自动改用本机网络。</p></div></section><section class="surface error-recovery"><h3>你可以这样处理</h3><ul class="recovery-list"><li><i>1</i><span>确认代理地址和端口没有输入错误。</span></li><li><i>2</i><span>确认代理账户仍可用；认证信息默认以掩码显示。</span></li><li><i>3</i><span>检查代理服务商是否允许当前设备连接。</span></li><li><i>4</i><span>修复后重新执行连接检查，再启动环境。</span></li></ul><div class="flow-footer"><small>未发起真实网络请求。</small><div class="flow-actions"><button class="button" type="button" data-route="create-network" data-action="route">返回检查设置</button><button class="button primary" type="button" data-action="notice">重新检测</button></div></div></section></div>`
  }

  function renderSearch () {
    return `<div class="search-overlay"><label class="search-overlay-input">${icon('search')}<input autofocus aria-label="搜索环境、分组和操作" placeholder="搜索环境、分组和操作"></label><div class="search-suggestions"><div class="suggestion-label">快速前往</div><a class="suggestion" href="#environments" data-route="environments">${icon('browser')}环境列表<kbd>Enter</kbd></a><a class="suggestion" href="#proxies" data-route="proxies">${icon('globe')}代理资源</a><a class="suggestion" href="#creator-video" data-route="creator-video">${icon('sparkle')}可选工具 · AI 创作</a><div class="suggestion-label">创建</div><a class="suggestion" href="#create-basic" data-route="create-basic">${icon('plus')}新建浏览环境</a><a class="suggestion" href="#settings" data-route="settings">${icon('settings')}系统设置</a></div></div><p style="margin:0 auto;max-width:680px;color:#83909d;font-size:9px">搜索仅匹配当前工作空间可见的真实记录。</p>`
  }

  function renderMediaPanel (tasks = false) {
    const current = tasks ? 'media-queue' : 'media-panel'
    return `<section class="aux-preview media-panel"><header class="aux-head"><span class="aux-brand">${icon('image')}</span><b>媒体提取中心</b><button type="button" class="aux-close" aria-label="收起" data-route="browser">×</button></header><nav class="aux-tabs" aria-label="媒体任务"><a href="#media-panel" data-route="media-panel" class="${tasks ? '' : 'active'}">已捕获媒体</a><a href="#media-queue" data-route="media-queue" class="${tasks ? 'active' : ''}">下载队列</a></nav>${tasks ? '' : `<div class="aux-filters"><button class="active" type="button">全部</button><button type="button">视频</button><button type="button">音频</button><button type="button">图片</button></div>`}<div class="aux-empty">${icon(tasks ? 'download' : 'image')}<h2>${tasks ? '暂无下载任务' : '当前页面没有捕获到媒体'}</h2><p>${tasks ? '从已捕获媒体中选择资源后，下载进度与结果会显示在这里。' : '开始播放或刷新当前页面后，检测到的视频、音频和图片会显示在这里。'}</p>${tasks ? '' : '<button class="button small" type="button" data-action="notice">刷新当前页面</button>'}</div><footer class="aux-foot"><span>${icon('shield')}下载遵循当前环境代理</span><a href="#browser" data-route="browser">收起</a></footer></section>`
  }

  function renderXGrokPanel () {
    const prompt = '请写一条关于最新科技、AI或数字化生活的精简推文（X post）。语言幽默有趣或富有洞察力，字数在120字以内。直接输出推文正文，严禁输出任何引号、前缀说明或解释。'
    return `<section class="aux-preview grok-panel"><header class="aux-head"><span class="aux-brand">${icon('sparkle')}</span><b>X 发帖控制</b><button type="button" class="aux-close" aria-label="关闭" data-route="browser">×</button></header><div class="grok-panel-content"><section class="grok-status"><span class="tag orange">未连接</span><h2>当前没有可用的 X 浏览环境</h2><p>先在目标环境中登录 X，再打开此控制面板。</p></section><section class="grok-stat"><div><b>发帖状态</b><span>未启动 · 等待环境</span></div><strong>--:--</strong></section><section class="grok-stat"><div><b>发布周期</b><span>可选 5、10、15 或 30 分钟</span></div><select aria-label="发帖间隔"><option>10 分钟 / 次</option><option>5 分钟 / 次</option><option>15 分钟 / 次</option><option>30 分钟 / 次</option></select></section><div class="grok-actions"><button class="button primary small" type="button" disabled>启动定时发帖</button><button class="button small" type="button" disabled>立即发帖</button></div><label class="field grok-prompt"><span>Grok 创作提示词</span><textarea readonly>${prompt}</textarea></label><a class="text-link grok-save" href="#x-grok-panel" data-action="notice">保存提示词</a><div class="grok-log"><b>执行日志</b><p>暂无发帖日志。启动后记录真实任务状态。</p></div></div></section>`
  }

  const renderers = {
    overview: renderOverview,
    environments: renderEnvironments,
    'create-basic': () => renderCreate(1),
    'create-network': () => renderCreate(2),
    'create-fingerprint': () => renderCreate(3),
    detail: renderDetail,
    browser: renderBrowser,
    proxies: renderProxies,
    'creator-video': renderCreatorVideo,
    'creator-article': renderCreatorArticle,
    'creator-post': renderCreatorPost,
    'creator-assets': renderCreatorAssets,
    'creator-publish': renderCreatorPublish,
    members: renderMembers,
    audit: renderAudit,
    billing: renderBilling,
    settings: renderSettings,
    onboarding: renderOnboarding,
    'proxy-error': renderProxyError,
    search: renderSearch,
    'media-panel': () => renderMediaPanel(false),
    'media-queue': () => renderMediaPanel(true),
    'x-grok-panel': renderXGrokPanel
  }

  function activeNav (route) {
    if (route.startsWith('creator-')) return 'creator-video'
    if (route.startsWith('create-') || ['detail', 'browser', 'proxy-error'].includes(route)) return 'environments'
    return route
  }

  function render () {
    const route = location.hash.slice(1) || 'overview'
    const renderer = renderers[route] || renderOverview
    document.body.classList.toggle('aux-window-preview', route.startsWith('media-') || route === 'x-grok-panel')
    document.getElementById('page').innerHTML = renderer()
    document.getElementById('page-context').textContent = pageTitles[route] || pageTitles.overview
    const selected = activeNav(route)
    document.querySelectorAll('#navigation .nav-link').forEach(link => {
      const isCurrent = link.dataset.route === selected
      link.classList.toggle('active', isCurrent)
      if (isCurrent) link.setAttribute('aria-current', 'page')
      else link.removeAttribute('aria-current')
    })
    if (route === 'search') {
      requestAnimationFrame(() => document.querySelector('.search-overlay-input input')?.focus())
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  let toastTimer = 0
  function showNotice () {
    const toast = document.getElementById('toast')
    toast.textContent = '这是界面评审稿，没有保存数据或连接真实服务。'
    toast.classList.add('visible')
    window.clearTimeout(toastTimer)
    toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 2600)
  }

  document.addEventListener('click', event => {
    const routeTarget = event.target.closest('[data-route]')
    if (routeTarget) {
      event.preventDefault()
      const targetRoute = routeTarget.dataset.route
      if (location.hash === `#${targetRoute}`) render()
      else location.hash = targetRoute
      return
    }
    const actionTarget = event.target.closest('[data-action]')
    if (actionTarget?.dataset.action === 'notice') showNotice()
  })

  document.addEventListener('change', event => {
    if (event.target.matches('.radio-option input[type="radio"]')) {
      const name = event.target.name
      document.querySelectorAll(`input[type="radio"][name="${name}"]`).forEach(input => {
        input.closest('.radio-option')?.classList.toggle('selected', input.checked)
      })
    }
  })

  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault()
      if (location.hash !== '#search') location.hash = 'search'
      else document.querySelector('.search-overlay-input input')?.focus()
    }
    if (event.key === 'Escape' && location.hash === '#search') location.hash = 'overview'
  })

  window.addEventListener('hashchange', render)
  render()
})()
