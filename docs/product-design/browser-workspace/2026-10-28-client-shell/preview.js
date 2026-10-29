(function () {
  'use strict'
  // 此文件只驱动设计评审的标签和地址状态，不连接业务服务，也不暴露客户端 API。
  const homeUrl = 'http://127.0.0.1:8088/#overview'
  const tabs = [{ id: 'home', kind: 'home', title: '首页 · 栖界', url: homeUrl, history: [homeUrl], index: 0 }]
  let activeId = 'home'
  let sequence = 0
  const address = document.getElementById('preview-address')
  const dialog = document.getElementById('login-preview')
  const tabList = document.querySelector('.browser-tabs')
  const icons = {
    home: '<path d="m3 10 9-7 9 7v11H3V10Z M9 21v-7h6v7"/>',
    newtab: '<rect x="3" y="4" width="18" height="15" rx="2"/><path d="M3 8h18M7 6h.1M10 6h.1"/>',
    managed: '<path d="M6 19c2-3 1-7 2-10a4.3 4.3 0 0 1 8 .1c1 3 0 7-1 10M3 16c1-2 0-5 1-8a8.5 8.5 0 0 1 16 0c1 3 .5 6 0 9M11 21c2-4 1-8 1-11"/>'
  }
  const current = () => tabs.find(tab => tab.id === activeId)
  const feedback = (text, error = false) => { const node = document.getElementById('preview-feedback'); node.textContent = text; node.classList.toggle('error', error) }
  function render () {
    const selected = current()
    tabList.replaceChildren()
    for (const tab of tabs) {
      const item = document.createElement('div'); item.className = 'browser-tab'; item.setAttribute('role', 'tab'); item.setAttribute('aria-selected', String(tab.id === activeId)); item.dataset.kind = tab.kind
      const activate = document.createElement('button'); activate.type = 'button'; activate.className = 'tab-activate'; activate.setAttribute('aria-label', `切换到${tab.title}`)
      activate.innerHTML = `<svg viewBox="0 0 24 24">${icons[tab.kind]}</svg>`
      const label = document.createElement('span'); label.className = 'tab-title'; label.textContent = tab.title; activate.append(label)
      activate.addEventListener('click', () => { activeId = tab.id; render() }); item.append(activate)
      if (tab.kind !== 'home') {
        const close = document.createElement('button'); close.type = 'button'; close.className = 'tab-close'; close.setAttribute('aria-label', `关闭${tab.title}`); close.innerHTML = '<svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg>'
        close.addEventListener('click', () => { const index = tabs.findIndex(entry => entry.id === tab.id); tabs.splice(index, 1); if (activeId === tab.id) activeId = tabs[Math.max(0, index - 1)].id; render() }); item.append(close)
      }
      tabList.append(item)
    }
    document.querySelectorAll('.screen').forEach(node => { node.hidden = node.id !== selected.kind })
    document.querySelectorAll('[data-scene]').forEach(node => node.classList.toggle('active', node.dataset.scene === selected.kind))
    address.readOnly = selected.kind === 'home'; address.value = selected.url === 'about:blank' ? '' : selected.url; address.placeholder = '输入网址'; address.setAttribute('aria-label', address.readOnly ? 'SaaS 地址（只读）' : '网页地址')
    document.querySelector('.readonly-label').hidden = !address.readOnly
    document.querySelector('[data-history="back"]').disabled = selected.index === 0
    document.querySelector('[data-history="forward"]').disabled = selected.index === selected.history.length - 1
    document.getElementById('scene-description').textContent = {
      home: '固定首页：地址由打包配置决定，不可关闭或改为其他网站；拥有完整客户端业务 API。',
      newtab: '“＋”创建的普通标签：直接输入网址浏览，不要求选择环境，不开放客户端内部 API。',
      managed: 'SaaS 创建的标签：可用于账号、环境或其他系统任务，能力由 SaaS 授权配置决定。'
    }[selected.kind]
  }
  function openTab (kind = 'newtab') {
    if (kind === 'home') { activeId = 'home'; render(); return }
    if (kind === 'managed') { const existing = tabs.find(tab => tab.kind === 'managed'); if (existing) { activeId = existing.id; render(); return } }
    const id = `tab-${++sequence}`
    tabs.push({ id, kind, title: kind === 'managed' ? '环境标签' : '新标签页', url: 'about:blank', history: ['about:blank'], index: 0 })
    activeId = id; feedback(''); render(); address.focus()
  }
  document.querySelector('.add-tab').addEventListener('click', () => openTab())
  document.querySelectorAll('[data-scene]').forEach(button => button.addEventListener('click', () => openTab(button.dataset.scene)))
  document.addEventListener('click', event => {
    const close = event.target.closest('[data-close]'); if (close) { dialog.hidden = true; return }
    const hotspot = event.target.closest('[data-action]'); if (!hotspot) return
    if (hotspot.dataset.action === 'login') { dialog.hidden = false; dialog.querySelector('input').focus() }
    else if (hotspot.dataset.action === 'focus-address') { address.focus(); address.select() }
    else openTab(hotspot.dataset.action)
  })
  address.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || address.readOnly) return
    event.preventDefault()
    let url
    try { const value = address.value.trim(); url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`); if (!['https:', 'http:', 'about:'].includes(url.protocol) || url.username || url.password || (url.protocol === 'about:' && url.href !== 'about:blank')) throw new Error() } catch { feedback('请输入完整、有效的网页地址。', true); return }
    const selected = current(); selected.url = url.href; selected.title = selected.url === 'about:blank' ? '新标签页' : url.hostname
    selected.history.splice(selected.index + 1); selected.history.push(url.href); selected.index++
    render(); feedback('地址已记录在设计预览中。正式客户端将在此标签内加载网页；当前预览未发出网页请求。')
  })
  document.querySelectorAll('[data-history]').forEach(button => button.addEventListener('click', () => { const selected = current(); selected.index += button.dataset.history === 'back' ? -1 : 1; selected.url = selected.history[selected.index]; selected.title = selected.url === 'about:blank' ? '新标签页' : new URL(selected.url).hostname; render() }))
  document.querySelector('[data-refresh]').addEventListener('click', () => feedback('当前为外观评审，刷新动作将在正式客户端作用于当前网页。'))
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') dialog.hidden = true
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'l') { event.preventDefault(); address.focus(); address.select() }
  })
  document.querySelector('.modal').addEventListener('submit', event => {
    event.preventDefault(); const invalid = [...event.target.querySelectorAll('input')].find(input => !input.validity.valid)
    event.target.querySelector('.error').textContent = invalid ? '请填写完整、有效的邮箱和密码。' : '当前为设计预览，请在正式客户端完成登录。'; if (invalid) invalid.focus()
  })
  render()
})()
