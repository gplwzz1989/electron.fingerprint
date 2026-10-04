const elements = {
  tabs: document.querySelector('#tabs'),
  profiles: document.querySelector('#profile-picker'),
  newPageTab: document.querySelector('#new-page-tab'),
  newTab: document.querySelector('#new-tab'),
  address: document.querySelector('#address'),
  back: document.querySelector('#back'),
  forward: document.querySelector('#forward'),
  reload: document.querySelector('#reload'),
  go: document.querySelector('#go'),
  summary: document.querySelector('#fingerprint-summary'),
  dataDir: document.querySelector('#data-dir'),
  status: document.querySelector('#status')
}
let state = { activeId: null, tabs: [] }

async function operate (operation) {
  try {
    const response = await operation()
    if (!response.ok) throw new Error(response.error || '操作失败，请重试。')
    return response
  } catch (error) {
    elements.status.textContent = error.message
    elements.status.title = error.message
    return null
  }
}

function render (snapshot) {
  const focused = document.activeElement
  const focusId = focused?.dataset.id
  const focusAction = focused?.dataset.action
  state = snapshot
  elements.tabs.replaceChildren()
  for (const tab of state.tabs) {
    const active = tab.id === state.activeId
    const card = document.createElement('div')
    card.className = `tab${active ? ' active' : ''}`
    const select = document.createElement('button')
    select.type = 'button'
    select.className = 'tab-select'
    select.dataset.id = tab.id
    select.dataset.action = 'select'
    select.setAttribute('role', 'tab')
    select.setAttribute('aria-selected', String(active))
    select.tabIndex = active ? 0 : -1
    select.textContent = `${tab.profileName} · ${tab.title}`
    select.title = select.textContent
    const close = document.createElement('button')
    close.type = 'button'
    close.className = 'tab-close'
    close.dataset.id = tab.id
    close.dataset.action = 'close'
    close.textContent = '×'
    close.setAttribute('aria-label', `关闭 ${tab.profileName} 标签`)
    card.append(select, close)
    elements.tabs.append(card)
  }
  if (focusId) {
    const target = [...elements.tabs.querySelectorAll('button')].find(button => button.dataset.id === focusId && button.dataset.action === focusAction)
    target?.focus()
  }
  elements.tabs.querySelector('.active')?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  const active = state.tabs.find(tab => tab.id === state.activeId)
  if (document.activeElement !== elements.address) elements.address.value = active?.url || ''
  elements.address.disabled = !active
  elements.back.disabled = !active?.canGoBack
  elements.forward.disabled = !active?.canGoForward
  elements.reload.disabled = !active
  elements.go.disabled = !active
  elements.newPageTab.disabled = !active
  if (active) {
    const fingerprint = active.fingerprint
    const environmentTabs = state.tabs.filter(tab => tab.environmentId === active.environmentId).length
    elements.summary.textContent = `${active.profileName} · ${environmentTabs} 个网页标签 · 版本 ${active.revision} · ${fingerprint.enabled ? '独立指纹' : '指纹关闭，使用原生值'} · ${fingerprint.locale.language} · ${fingerprint.locale.timezone} · ${fingerprint.hardware.hardwareConcurrency} 线程 · ${fingerprint.screen.width} × ${fingerprint.screen.height}`
    elements.dataDir.textContent = `独立目录：${active.dataDir}`
    elements.status.textContent = active.error || (active.loading ? '网页加载中…' : active.warning || '标签已就绪。')
  } else {
    elements.summary.textContent = '选择配置新建环境；同一环境可继续打开多个网页标签。'
    elements.dataDir.textContent = ''
    elements.status.textContent = ''
  }
  elements.dataDir.title = elements.dataDir.textContent
  elements.status.title = elements.status.textContent
}

async function refreshProfiles () {
  const response = await operate(() => window.browserApi.listProfiles())
  if (!response) return
  const selected = elements.profiles.value
  elements.profiles.replaceChildren()
  for (const profile of response.profiles) {
    const option = document.createElement('option')
    option.value = profile.id
    option.textContent = profile.name
    elements.profiles.append(option)
  }
  if (response.profiles.some(profile => profile.id === selected)) elements.profiles.value = selected
  elements.newTab.disabled = response.profiles.length === 0
}

elements.tabs.addEventListener('click', async event => {
  const button = event.target.closest('button[data-id]')
  if (!button) return
  const response = await operate(() => button.dataset.action === 'close'
    ? window.browserApi.closeTab(button.dataset.id)
    : window.browserApi.selectTab(button.dataset.id))
  if (response) render(response)
})
elements.tabs.addEventListener('keydown', async event => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  const index = state.tabs.findIndex(tab => tab.id === state.activeId)
  let nextIndex = event.key === 'ArrowLeft' ? index - 1 : index + 1
  if (event.key === 'Home') nextIndex = 0
  if (event.key === 'End') nextIndex = state.tabs.length - 1
  const tab = state.tabs[(nextIndex + state.tabs.length) % state.tabs.length]
  if (tab) {
    await operate(() => window.browserApi.selectTab(tab.id))
    elements.tabs.querySelector('.active .tab-select')?.focus()
  }
})
elements.newTab.addEventListener('click', () => {
  void operate(() => window.browserApi.launchProfile({ id: elements.profiles.value }))
})
elements.newPageTab.addEventListener('click', () => {
  const active = state.tabs.find(tab => tab.id === state.activeId)
  if (!active) return
  void operate(() => window.browserApi.newPageTab({ environmentId: active.environmentId }))
})
document.querySelector('#dashboard').addEventListener('click', () => { void operate(() => window.browserApi.showDashboard()) })
document.querySelector('#navigation').addEventListener('submit', event => {
  event.preventDefault()
  const url = elements.address.value.trim()
  elements.address.blur()
  void operate(() => window.browserApi.navigateTab({ id: state.activeId, action: 'load', url }))
})
for (const action of ['back', 'forward', 'reload']) {
  elements[action].addEventListener('click', () => { void operate(() => window.browserApi.navigateTab({ id: state.activeId, action })) })
}
window.browserApi.onTabsChanged(render)
window.browserApi.onProfilesChanged(() => { void refreshProfiles() })
async function init () {
  await refreshProfiles()
  const response = await operate(() => window.browserApi.listTabs())
  if (response) render(response)
}
void init()
