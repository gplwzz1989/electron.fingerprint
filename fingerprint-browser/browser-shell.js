(function () {
  'use strict'
  const bridge = window.browserShell
  const address = document.getElementById('address')
  const list = document.querySelector('.browser-tabs')
  const pinned = document.querySelector('.pinned-tabs')
  let state = { tabs: [], activeId: null, home: {} }
  let editing = false
  let errorTimer
  let draggingId = null
  let pendingState = null
  let currentLayout = { visibleIds: [], widths: {}, totalWidth: 0, hiddenCount: 0 }
  let frozenLayout = null
  let closeResizeTimer
  let addressRevision = 0
  const pendingCloses = new Set()
  function releaseCloseLayout () { clearTimeout(closeResizeTimer); frozenLayout = null; updateLayout() }
  function holdCloseLayout (id) {
    clearTimeout(closeResizeTimer)
    const closingIds = [...(frozenLayout?.closingIds || []), id]
    const remaining = state.tabs.filter(tab => !(frozenLayout?.closingIds || []).includes(tab.id))
    frozenLayout = { ...window.QijieTabStripLayout.layoutAfterClose(remaining, currentLayout, id), closingIds, rowWidth: document.querySelector('.tab-row').clientWidth }
    closeResizeTimer = setTimeout(releaseCloseLayout, 1200)
  }
  function updateLayout () {
    const row = document.querySelector('.tab-row')
    const reserved = pinned.getBoundingClientRect().width + [...row.querySelectorAll(':scope>.add-tab,:scope>.all-tabs,:scope>.window-actions')].reduce((sum, node) => sum + node.getBoundingClientRect().width, 0) + 30
    if (frozenLayout && (frozenLayout.rowWidth !== row.clientWidth || state.activeId && !frozenLayout.visibleIds.includes(state.activeId) && !frozenLayout.closingIds.includes(state.activeId))) frozenLayout = null
    const layout = frozenLayout || window.QijieTabStripLayout.computeTabLayout(state.tabs, state.activeId, row.clientWidth - reserved)
    currentLayout = layout
    for (const item of list.children) {
      const width = layout.widths[item.dataset.id]
      item.hidden = width === undefined
      if (width !== undefined) { item.style.width = width + 'px'; item.classList.toggle('compact', width < 110); item.classList.toggle('tiny', width < 64) }
    }
    list.style.width = layout.totalWidth + 'px'
    const menu = document.querySelector('[data-action="tabs-menu"]'); menu.title = `全部标签（${state.tabs.length + 1}）${layout.hiddenCount ? `，另有 ${layout.hiddenCount} 个标签已收纳` : ''}`
    const count = menu.querySelector('.overflow-count'); count.textContent = String(layout.hiddenCount); count.hidden = !layout.hiddenCount
  }
  const symbols = { home: '<path d="m3 10 9-7 9 7v11H3V10Z M9 21v-7h6v7"/>', ordinary: '<rect x="3" y="4" width="18" height="15" rx="2"/><path d="M3 8h18M7 6h.1M10 6h.1"/>', managed: '<path d="M6 19c2-3 1-7 2-10a4.3 4.3 0 0 1 8 .1c1 3 0 7-1 10M3 16c1-2 0-5 1-8a8.5 8.5 0 0 1 16 0c1 3 .5 6 0 9M11 21c2-4 1-8 1-11"/>' }
  function showError (message) { const node = document.getElementById('error'); clearTimeout(errorTimer); node.textContent = message || '操作未完成，请重试。'; node.hidden = false; errorTimer = setTimeout(() => { node.hidden = true }, 6000) }
  async function call (operation) { try { const result = await operation(); if (!result?.ok) showError(result?.error); return result } catch { showError('客户端操作未完成，请重试。') } }
  function render (snapshot) {
    if (draggingId) { pendingState = snapshot; return }
    const oldTab = state.tabs.find(entry => entry.id === state.activeId) || state.home
    const changed = state.activeId !== snapshot.activeId; state = snapshot
    if (changed) editing = false
    list.replaceChildren()
    pinned.replaceChildren()
    const home = { ...snapshot.home, id: null, title: '首页 · 栖界', kind: 'home' }
    for (const tab of [home, ...snapshot.tabs]) {
      const item = document.createElement('div'); item.className = `tab${tab.id === snapshot.activeId ? ' active' : ''}${tab.loading ? ' loading' : ''}${tab.error ? ' error' : ''}`; item.setAttribute('role', 'tab'); item.setAttribute('aria-selected', String(tab.id === snapshot.activeId))
      item.dataset.id = tab.id || ''; item.draggable = Boolean(tab.id)
      const select = document.createElement('button'); select.className = 'tab-select'; select.type = 'button'; select.innerHTML = `<svg viewBox="0 0 24 24">${symbols[tab.kind] || symbols.managed}</svg>`; select.dataset.action = tab.id ? 'select' : 'home'; if (tab.id) select.dataset.id = tab.id
      const title = document.createElement('span'); title.textContent = tab.title || tab.profileName || '新标签页'; select.append(title); select.title = title.textContent; item.append(select)
      if (tab.id) { const close = document.createElement('button'); close.className = 'tab-close'; close.type = 'button'; close.dataset.action = 'close'; close.dataset.id = tab.id; close.setAttribute('aria-label', `关闭${title.textContent}`); close.innerHTML = '<svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg>'; item.append(close) }
      if (tab.id) list.append(item); else pinned.append(item)
    }
    updateLayout()
    const tab = snapshot.tabs.find(entry => entry.id === snapshot.activeId) || home
    if (tab.error && (changed || oldTab?.error !== tab.error)) showError(tab.error)
    address.readOnly = !snapshot.activeId; address.setAttribute('aria-label', address.readOnly ? 'SaaS 页面地址（只读）' : '网页地址'); document.getElementById('readonly-label').hidden = !address.readOnly
    if (!editing) address.value = tab.url === 'about:blank' && tab.kind === 'ordinary' ? '' : tab.url || ''
    address.placeholder = '搜索或输入网址'; address.title = tab.url || ''
    const reload = document.querySelector('[data-action="reload"]'); reload.setAttribute('aria-label', tab.loading ? '停止加载' : '刷新'); reload.title = tab.loading ? '停止加载' : '刷新'
    reload.innerHTML = tab.loading ? '<svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M20 9a8 8 0 1 0 0 6M20 3v6h-6"/></svg>'
    document.querySelector('.browser-chrome').classList.toggle('page-loading', Boolean(tab.loading))
    document.querySelector('[data-action="back"]').disabled = !tab.canGoBack; document.querySelector('[data-action="forward"]').disabled = !tab.canGoForward
    document.querySelector('[data-action="maximize"]').setAttribute('aria-label', snapshot.maximized ? '还原窗口' : '最大化')
    if (changed && tab.kind === 'ordinary' && tab.url === 'about:blank') { address.focus(); address.select() }
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-action]'); if (!button || button.disabled) return
    const action = button.dataset.action; const id = button.dataset.id
    if (['new', 'home', 'select'].includes(action)) releaseCloseLayout()
    if (action === 'new') void call(() => bridge.create())
    else if (action === 'home') void call(() => bridge.home())
    else if (action === 'select') void call(() => bridge.select(id))
    else if (action === 'close') { if (pendingCloses.has(id)) return; pendingCloses.add(id); holdCloseLayout(id); void call(() => bridge.close(id)).then(result => { pendingCloses.delete(id); if (!result?.ok) releaseCloseLayout() }) }
    else if (['back', 'forward', 'reload'].includes(action)) { editing = false; const current = state.tabs.find(tab => tab.id === state.activeId) || state.home; void call(() => bridge.navigate({ id: state.activeId, action: action === 'reload' && current.loading ? 'stop' : action })) }
    else if (action === 'devtools') void call(() => bridge.devtools(state.activeId))
    else if (['minimize', 'maximize', 'exit', 'downloads', 'menu', 'tabs-menu'].includes(action)) void call(() => bridge.windowAction(action))
  })
  address.addEventListener('input', () => { editing = true; addressRevision++ })
  address.addEventListener('focus', () => address.select())
  address.addEventListener('keydown', event => {
    if (event.key === 'Escape') { editing = false; render(state); address.select(); return }
    if (event.key !== 'Enter' || address.readOnly || event.isComposing) return
    event.preventDefault()
    const entered = address.value; let url
    try { url = window.QijieBrowserNavigation.resolveAddress(event.ctrlKey && !/[.:/\s]/.test(entered) ? `www.${entered}.com` : entered) } catch (error) { showError(error.message); editing = true; return }
    const revision = addressRevision; const id = state.activeId; address.value = url; editing = false
    void call(() => bridge.navigate({ id, action: 'load', url })).then(result => { if (revision !== addressRevision || id !== state.activeId) return; if (!result?.ok) { editing = true; address.value = entered; address.focus() } else render(state) })
  })
  document.querySelector('.drag-space').addEventListener('dblclick', () => { void call(() => bridge.windowAction('maximize')) })
  bridge.onState(render)
  bridge.onFocusAddress(() => { address.focus(); address.select() })
  list.addEventListener('dragstart', event => { const item = event.target.closest('.tab'); if (!item?.dataset.id || event.target.closest('.tab-close')) { event.preventDefault(); return }; releaseCloseLayout(); draggingId = item.dataset.id; event.dataTransfer.setData('application/x-qijie-tab', draggingId); event.dataTransfer.effectAllowed = 'move'; item.classList.add('dragging') })
  list.addEventListener('dragover', event => { if (!draggingId) return; event.preventDefault(); event.dataTransfer.dropEffect = 'move'; list.querySelectorAll('.drop-before,.drop-after').forEach(node => node.classList.remove('drop-before', 'drop-after')); const item = event.target.closest('.tab'); if (item && item.dataset.id !== draggingId) item.classList.add(event.clientX < item.getBoundingClientRect().left + item.getBoundingClientRect().width / 2 ? 'drop-before' : 'drop-after') })
  list.addEventListener('drop', event => {
    if (!draggingId) return; event.preventDefault()
    const item = event.target.closest('.tab'); const oldIndex = state.tabs.findIndex(tab => tab.id === draggingId)
    let index = item ? state.tabs.findIndex(tab => tab.id === item.dataset.id) + (item.classList.contains('drop-after') ? 1 : 0) : state.tabs.length
    if (oldIndex < index) index--
    const id = draggingId; draggingId = null; pendingState = null
    void call(() => bridge.reorder({ id, index: Math.max(0, Math.min(index, state.tabs.length - 1)) }))
  })
  list.addEventListener('dragend', () => { draggingId = null; const snapshot = pendingState || state; pendingState = null; render(snapshot) })
  list.addEventListener('keydown', event => { const item = event.target.closest('.tab'); if (!item || !event.altKey || !event.shiftKey || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return; event.preventDefault(); const index = state.tabs.findIndex(tab => tab.id === item.dataset.id); const target = Math.max(0, Math.min(state.tabs.length - 1, index + (event.key === 'ArrowLeft' ? -1 : 1))); void call(() => bridge.reorder({ id: item.dataset.id, index: target })) })
  new ResizeObserver(updateLayout).observe(document.querySelector('.tab-row'))
  list.addEventListener('mouseleave', () => { if (frozenLayout) { clearTimeout(closeResizeTimer); closeResizeTimer = setTimeout(releaseCloseLayout, 150) } })
  void call(() => bridge.state()).then(result => { if (result?.ok) render(result) })
})()
