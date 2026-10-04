const state = {
  profiles: [],
  environments: [],
  environmentQuery: '',
  environmentStatus: 'all',
  environmentPage: 1,
  environmentPageSize: 20,
  selectedEnvironmentIds: new Set(),
  editingId: null,
  draft: null
}

const elements = {
  status: document.querySelector('#status'),
  profileCount: document.querySelector('#profile-count'),
  profilesList: document.querySelector('#profiles-list'),
  environmentCount: document.querySelector('#environment-count'),
  environmentsList: document.querySelector('#environments-list'),
  environmentSearch: document.querySelector('#environment-search'),
  environmentStatusFilter: document.querySelector('#environment-status-filter'),
  environmentReset: document.querySelector('#environment-reset'),
  environmentBulkbar: document.querySelector('#environment-bulkbar'),
  environmentSelectedCount: document.querySelector('#environment-selected-count'),
  bulkOpenEnvironments: document.querySelector('#bulk-open-environments'),
  bulkCloseEnvironments: document.querySelector('#bulk-close-environments'),
  clearEnvironmentSelection: document.querySelector('#clear-environment-selection'),
  environmentPageInfo: document.querySelector('#environment-page-info'),
  environmentPrevious: document.querySelector('#environment-previous'),
  environmentNext: document.querySelector('#environment-next'),
  emptyState: document.querySelector('#empty-state'),
  form: document.querySelector('#profile-form'),
  editorTitle: document.querySelector('#editor-title'),
  newProfile: document.querySelector('#new-profile'),
  emptyNewProfile: document.querySelector('#empty-new-profile'),
  cancelEdit: document.querySelector('#cancel-edit'),
  profileName: document.querySelector('#profile-name'),
  profileUrl: document.querySelector('#profile-url'),
  profileProxyMode: document.querySelector('#profile-proxy-mode'),
  profileProxyServer: document.querySelector('#profile-proxy-server'),
  profileProxyUsername: document.querySelector('#profile-proxy-username'),
  profileProxyPassword: document.querySelector('#profile-proxy-password'),
  profileEnabled: document.querySelector('#profile-enabled'),
  profileLanguage: document.querySelector('#profile-language'),
  profileTimezone: document.querySelector('#profile-timezone'),
  profilePlatform: document.querySelector('#profile-platform'),
  profileCpu: document.querySelector('#profile-cpu'),
  profileMemory: document.querySelector('#profile-memory'),
  profileScreenWidth: document.querySelector('#profile-screen-width'),
  profileScreenHeight: document.querySelector('#profile-screen-height'),
  profileScale: document.querySelector('#profile-scale'),
  noiseCanvas: document.querySelector('#noise-canvas'),
  noiseAudio: document.querySelector('#noise-audio'),
  noiseRects: document.querySelector('#noise-rects'),
  profileUserAgent: document.querySelector('#profile-user-agent')
}

function clone (value) {
  return JSON.parse(JSON.stringify(value))
}

function unwrap (response) {
  if (!response || !response.ok) throw new Error(response?.error || '操作失败，请稍后重试。')
  return response
}

function setStatus (message, type = '') {
  elements.status.textContent = message
  elements.status.className = `status ${type}`.trim()
}

function formatProfileSummary (profile) {
  return `${profile.fingerprint.locale.language} · ${profile.fingerprint.locale.timezone}`
}

function createButton (text, action, id, className) {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = text
  button.dataset.action = action
  button.dataset.id = id
  button.className = className
  return button
}

function renderProfiles () {
  elements.profileCount.textContent = `${state.profiles.length} 个`
  elements.profilesList.replaceChildren()

  if (state.profiles.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'list-empty'
    empty.textContent = '还没有浏览器配置。'
    elements.profilesList.append(empty)
    return
  }

  for (const profile of state.profiles) {
    const card = document.createElement('article')
    card.className = `profile-card${profile.id === state.editingId ? ' selected' : ''}`
    card.dataset.id = profile.id

    const cardTop = document.createElement('div')
    cardTop.className = 'profile-card-top'
    const name = document.createElement('h3')
    name.textContent = profile.name
    const stateBadge = document.createElement('span')
    stateBadge.className = `state-badge${profile.fingerprint.enabled ? '' : ' disabled'}`
    stateBadge.textContent = profile.fingerprint.enabled ? '已启用' : '已关闭'
    cardTop.append(name, stateBadge)

    const summary = document.createElement('p')
    summary.className = 'profile-summary'
    summary.textContent = formatProfileSummary(profile)

    const metadata = document.createElement('p')
    metadata.className = 'profile-metadata'
    metadata.textContent = `${profile.fingerprint.hardware.platform} · ${profile.fingerprint.hardware.hardwareConcurrency} 线程 · 版本 ${profile.revision}`

    const actions = document.createElement('div')
    actions.className = 'profile-actions'
    actions.append(
      createButton('新建环境', 'launch', profile.id, 'button button-small button-primary'),
      createButton('编辑', 'edit', profile.id, 'button button-small button-quiet'),
      createButton('删除', 'delete', profile.id, 'button button-small button-danger')
    )

    card.append(cardTop, summary, metadata, actions)
    elements.profilesList.append(card)
  }
}

function formatEnvironmentTime (timestamp) {
  return new Date(timestamp).toLocaleString('zh-CN', { dateStyle: 'short', timeStyle: 'short' })
}

function filteredEnvironments () {
  const query = state.environmentQuery.trim().toLowerCase()
  return [...state.environments]
    .filter(environment => state.environmentStatus === 'all' || environment.status === state.environmentStatus)
    .filter(environment => !query || `${environment.profileName} ${environment.id}`.toLowerCase().includes(query))
    .sort((left, right) => right.updatedAt - left.updatedAt)
}

function renderEnvironmentPagination (total, pageCount) {
  if (total === 0) {
    elements.environmentPageInfo.textContent = ''
    elements.environmentPrevious.disabled = true
    elements.environmentNext.disabled = true
    return
  }
  const start = (state.environmentPage - 1) * state.environmentPageSize + 1
  const end = Math.min(total, state.environmentPage * state.environmentPageSize)
  elements.environmentPageInfo.textContent = `${start}-${end} / ${total} 个环境 · 第 ${state.environmentPage} / ${pageCount} 页`
  elements.environmentPrevious.disabled = state.environmentPage <= 1
  elements.environmentNext.disabled = state.environmentPage >= pageCount
}

function renderEnvironments () {
  const environments = filteredEnvironments()
  const pageCount = Math.max(1, Math.ceil(environments.length / state.environmentPageSize))
  state.environmentPage = Math.min(state.environmentPage, pageCount)
  const pageStart = (state.environmentPage - 1) * state.environmentPageSize
  const pageItems = environments.slice(pageStart, pageStart + state.environmentPageSize)
  const existingIds = new Set(state.environments.map(environment => environment.id))
  state.selectedEnvironmentIds = new Set([...state.selectedEnvironmentIds].filter(id => existingIds.has(id)))
  elements.environmentCount.textContent = `${state.environments.length} 个`
  elements.environmentsList.replaceChildren()
  if (environments.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'list-empty'
    empty.textContent = state.environments.length === 0 ? '新建环境后，环境会显示在这里。' : '没有符合当前筛选条件的环境。'
    elements.environmentsList.append(empty)
  } else {
    for (const environment of pageItems) {
      const card = document.createElement('article')
      card.className = 'environment-row environment-card'
      card.dataset.id = environment.id
      const selection = document.createElement('label')
      selection.className = 'environment-selection'
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.dataset.action = 'select-environment'
      checkbox.dataset.id = environment.id
      checkbox.checked = state.selectedEnvironmentIds.has(environment.id)
      checkbox.setAttribute('aria-label', `选择环境 ${environment.profileName}`)
      selection.append(checkbox)

      const details = document.createElement('div')
      details.className = 'environment-details'
      const top = document.createElement('div')
      top.className = 'profile-card-top'
      const name = document.createElement('h3')
      name.textContent = environment.profileName
      const badge = document.createElement('span')
      badge.className = `state-badge${environment.status === 'open' ? '' : ' disabled'}`
      badge.textContent = environment.status === 'open' ? '使用中' : '已关闭'
      top.append(name, badge)
      const summary = document.createElement('p')
      summary.className = 'profile-summary'
      summary.textContent = `${environment.fingerprint.locale.language} · ${environment.fingerprint.locale.timezone}`
      const metadata = document.createElement('p')
      metadata.className = 'profile-metadata'
      const proxyLabel = environment.proxy?.mode === 'direct' ? '直连' : environment.proxy?.server || '代理未配置'
      metadata.textContent = `${environment.id} · 版本 ${environment.profileRevision} · ${proxyLabel} · 最近使用 ${formatEnvironmentTime(environment.updatedAt)}`
      details.append(top, summary, metadata)

      const actions = document.createElement('div')
      actions.className = 'environment-actions'
      actions.append(createButton(
        environment.status === 'open' ? '关闭' : '重新打开',
        environment.status === 'open' ? 'close-environment' : 'reopen-environment',
        environment.id,
        `button button-small ${environment.status === 'open' ? 'button-quiet' : 'button-primary'}`
      ))
      const deleteButton = createButton('删除', 'delete-environment', environment.id, 'button button-small button-danger')
      deleteButton.disabled = environment.status === 'open'
      actions.append(deleteButton)
      card.append(selection, details, actions)
      elements.environmentsList.append(card)
    }
  }
  renderEnvironmentPagination(environments.length, pageCount)
  const selected = state.environments.filter(environment => state.selectedEnvironmentIds.has(environment.id))
  elements.environmentBulkbar.hidden = selected.length === 0
  elements.environmentSelectedCount.textContent = `已选择 ${selected.length} 个环境`
  elements.bulkOpenEnvironments.disabled = !selected.some(environment => environment.status === 'closed')
  elements.bulkCloseEnvironments.disabled = !selected.some(environment => environment.status === 'open')
}

function setFormVisibility (visible) {
  elements.form.hidden = !visible
  elements.emptyState.hidden = visible
}

function fillForm (profile, isNew) {
  const fingerprint = profile.fingerprint
  state.editingId = isNew ? null : profile.id
  state.draft = isNew ? profile : null
  elements.editorTitle.textContent = isNew ? '新建配置' : '编辑配置'
  elements.profileName.value = profile.name
  elements.profileUrl.value = profile.url
  const proxy = profile.proxy || { mode: 'direct', server: '', username: '', password: '' }
  elements.profileProxyMode.value = proxy.mode
  elements.profileProxyServer.value = proxy.server
  elements.profileProxyUsername.value = proxy.username
  elements.profileProxyPassword.value = proxy.password
  elements.profileProxyServer.disabled = proxy.mode === 'direct'
  elements.profileProxyUsername.disabled = proxy.mode === 'direct'
  elements.profileProxyPassword.disabled = proxy.mode === 'direct'
  elements.profileEnabled.checked = fingerprint.enabled
  elements.profileLanguage.value = fingerprint.locale.language
  elements.profileTimezone.value = fingerprint.locale.timezone
  elements.profilePlatform.value = fingerprint.hardware.platform
  elements.profileCpu.value = fingerprint.hardware.hardwareConcurrency
  elements.profileMemory.value = fingerprint.hardware.deviceMemory
  elements.profileScreenWidth.value = fingerprint.screen.width
  elements.profileScreenHeight.value = fingerprint.screen.height
  elements.profileScale.value = fingerprint.screen.deviceScaleFactor
  elements.noiseCanvas.checked = fingerprint.noise.canvas && fingerprint.modules.canvas
  elements.noiseAudio.checked = fingerprint.noise.audio && fingerprint.modules.audio
  elements.noiseRects.checked = fingerprint.noise.rects
  elements.profileUserAgent.value = fingerprint.browser.userAgent || ''
  setFormVisibility(true)
  renderProfiles()
}

function selectProfile (id) {
  const profile = state.profiles.find(item => item.id === id)
  if (!profile) return
  fillForm(profile, false)
}

async function openDraft () {
  try {
    const response = unwrap(await window.browserApi.getDraft())
    fillForm(response.profile, true)
    setStatus('已创建新的配置草稿。', 'success')
  } catch (error) {
    setStatus(error.message, 'error')
  }
}

function cancelEdit () {
  if (state.editingId) {
    selectProfile(state.editingId)
    return
  }
  if (state.profiles.length > 0) {
    selectProfile(state.profiles[0].id)
    return
  }
  setFormVisibility(false)
}

function languagesFromPrimary (language) {
  const primary = language.trim()
  const separator = primary.indexOf('-')
  return separator > 0 ? [primary, primary.slice(0, separator)] : [primary]
}

function buildFormPayload () {
  const current = state.editingId
    ? state.profiles.find(profile => profile.id === state.editingId)
    : state.draft
  if (!current) throw new Error('没有正在编辑的配置。')

  const fingerprint = clone(current.fingerprint)
  const language = elements.profileLanguage.value.trim()
  const canvasNoise = elements.noiseCanvas.checked
  const audioNoise = elements.noiseAudio.checked
  fingerprint.enabled = elements.profileEnabled.checked
  fingerprint.browser.userAgent = elements.profileUserAgent.value.trim() || null
  fingerprint.browser.acceptLanguage = languagesFromPrimary(language).map((item, index) => index === 0 ? item : `${item};q=0.9`).join(',')
  fingerprint.locale.language = language
  fingerprint.locale.languages = languagesFromPrimary(language)
  fingerprint.locale.timezone = elements.profileTimezone.value.trim()
  fingerprint.hardware.platform = elements.profilePlatform.value
  fingerprint.hardware.hardwareConcurrency = Number(elements.profileCpu.value)
  fingerprint.hardware.deviceMemory = Number(elements.profileMemory.value)
  fingerprint.screen.width = Number(elements.profileScreenWidth.value)
  fingerprint.screen.height = Number(elements.profileScreenHeight.value)
  fingerprint.screen.availWidth = fingerprint.screen.width
  fingerprint.screen.availHeight = Math.max(1, fingerprint.screen.height - 40)
  fingerprint.screen.deviceScaleFactor = Number(elements.profileScale.value)
  fingerprint.noise.canvas = canvasNoise
  fingerprint.noise.audio = audioNoise
  fingerprint.noise.rects = elements.noiseRects.checked
  fingerprint.modules.canvas = canvasNoise
  fingerprint.modules.audio = audioNoise
  if (!state.editingId) fingerprint.noise.seed = `${current.id}-stable`

  return {
    id: current.id,
    revision: current.revision,
    expectedRevision: state.editingId ? current.revision : null,
    name: elements.profileName.value.trim(),
    url: elements.profileUrl.value.trim(),
    proxy: {
      mode: elements.profileProxyMode.value,
      server: elements.profileProxyServer.value.trim(),
      username: elements.profileProxyUsername.value,
      password: elements.profileProxyPassword.value
    },
    fingerprint
  }
}

async function saveProfile (event) {
  event.preventDefault()
  try {
    const response = unwrap(await window.browserApi.saveProfile(buildFormPayload()))
    state.profiles = response.profiles
    state.draft = null
    fillForm(response.profile, false)
    setStatus('配置已保存，新标签使用新版本；已打开标签保持原指纹。', 'success')
  } catch (error) {
    setStatus(error.message, 'error')
  }
}

async function launchProfile (id) {
  const profile = state.profiles.find(item => item.id === id)
  if (!profile) return
  const fingerprint = profile.fingerprint
  const summary = [
    `配置：${profile.name}`,
    `指纹版本：${profile.revision}`,
    `语言与时区：${fingerprint.locale.language} · ${fingerprint.locale.timezone}`,
    `平台与线程：${fingerprint.hardware.platform} · ${fingerprint.hardware.hardwareConcurrency}`,
    `屏幕：${fingerprint.screen.width} × ${fingerprint.screen.height}`,
    `代理：${profile.proxy?.mode === 'direct' ? '直连' : profile.proxy?.server || '未配置'}`
  ].join('\n')
  if (!window.confirm(`即将创建新的浏览器环境，已有环境不会被修改。\n\n${summary}\n\n确认继续吗？`)) return
  try {
    const response = unwrap(await window.browserApi.launchProfile({ id: profile.id, url: profile.url }))
    setStatus(`已为“${profile.name}”新建环境。${response.warning || ''}`, response.warning ? '' : 'success')
  } catch (error) {
    setStatus(error.message, 'error')
  }
}

async function refreshEnvironments () {
  const response = unwrap(await window.browserApi.listEnvironments())
  state.environments = response.environments
  renderEnvironments()
}

async function reopenEnvironment (id) {
  try {
    const response = unwrap(await window.browserApi.reopenEnvironment(id))
    state.environments = response.environments
    renderEnvironments()
    setStatus('已恢复原有环境，保留原指纹和登录数据。', 'success')
  } catch (error) {
    setStatus(error.message, 'error')
  }
}

async function closeEnvironment (id) {
  try {
    const response = unwrap(await window.browserApi.closeEnvironment(id))
    state.environments = response.environments
    state.selectedEnvironmentIds.delete(id)
    renderEnvironments()
    setStatus('环境已关闭，登录数据已保存。', 'success')
  } catch (error) {
    setStatus(error.message, 'error')
  }
}

async function updateSelectedEnvironments (operation, successMessage) {
  const selected = state.environments.filter(environment => state.selectedEnvironmentIds.has(environment.id))
  if (selected.length === 0) return
  try {
    let environments = state.environments
    for (const environment of selected) {
      if (operation === 'open' && environment.status === 'closed') {
        environments = unwrap(await window.browserApi.reopenEnvironment(environment.id)).environments
      }
      if (operation === 'close' && environment.status === 'open') {
        environments = unwrap(await window.browserApi.closeEnvironment(environment.id)).environments
      }
    }
    state.environments = environments
    state.selectedEnvironmentIds.clear()
    renderEnvironments()
    setStatus(successMessage, 'success')
  } catch (error) {
    await refreshEnvironments()
    setStatus(error.message, 'error')
  }
}

async function deleteEnvironment (id) {
  const environment = state.environments.find(item => item.id === id)
  if (!environment || environment.status === 'open') return
  if (!window.confirm(`确定删除“${environment.profileName}”环境吗？这会删除该环境的 Cookie、缓存和登录数据，不能恢复。`)) return
  try {
    const response = unwrap(await window.browserApi.deleteEnvironment(id))
    state.environments = response.environments
    state.selectedEnvironmentIds.delete(id)
    renderEnvironments()
    setStatus(response.deletionPending
      ? '环境已从列表移除，页面进程释放后会自动清理本地数据。'
      : '独立环境及其本地数据已删除。', 'success')
  } catch (error) {
    setStatus(error.message, 'error')
  }
}

async function deleteProfile (id) {
  const profile = state.profiles.find(item => item.id === id)
  if (!profile || !window.confirm(`确定删除“${profile.name}”吗？`)) return
  try {
    const response = unwrap(await window.browserApi.deleteProfile(id))
    state.profiles = response.profiles
    if (state.editingId === id) {
      state.editingId = null
      if (state.profiles.length > 0) selectProfile(state.profiles[0].id)
      else setFormVisibility(false)
    }
    renderProfiles()
    setStatus('配置已删除。', 'success')
  } catch (error) {
    setStatus(error.message, 'error')
  }
}

async function refreshProfiles () {
  const response = unwrap(await window.browserApi.listProfiles())
  state.profiles = response.profiles
  renderProfiles()
  if (state.profiles.length > 0) selectProfile(state.profiles[0].id)
  else await openDraft()
}

elements.newProfile.addEventListener('click', () => void openDraft())
elements.emptyNewProfile.addEventListener('click', () => void openDraft())
elements.cancelEdit.addEventListener('click', cancelEdit)
elements.form.addEventListener('submit', event => void saveProfile(event))
elements.profileProxyMode.addEventListener('change', () => {
  const direct = elements.profileProxyMode.value === 'direct'
  elements.profileProxyServer.disabled = direct
  elements.profileProxyUsername.disabled = direct
  elements.profileProxyPassword.disabled = direct
  if (direct) {
    elements.profileProxyServer.value = ''
    elements.profileProxyUsername.value = ''
    elements.profileProxyPassword.value = ''
  }
})
elements.profilesList.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]')
  if (!button) return
  const { action, id } = button.dataset
  if (action === 'launch') void launchProfile(id)
  if (action === 'edit') selectProfile(id)
  if (action === 'delete') void deleteProfile(id)
})
elements.environmentsList.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]')
  if (!button) return
  if (button.dataset.action === 'reopen-environment') void reopenEnvironment(button.dataset.id)
  if (button.dataset.action === 'close-environment') void closeEnvironment(button.dataset.id)
  if (button.dataset.action === 'delete-environment') void deleteEnvironment(button.dataset.id)
})
elements.environmentsList.addEventListener('change', event => {
  const checkbox = event.target.closest('input[data-action="select-environment"]')
  if (!checkbox) return
  if (checkbox.checked) state.selectedEnvironmentIds.add(checkbox.dataset.id)
  else state.selectedEnvironmentIds.delete(checkbox.dataset.id)
  renderEnvironments()
})
elements.environmentSearch.addEventListener('input', () => {
  state.environmentQuery = elements.environmentSearch.value
  state.environmentPage = 1
  renderEnvironments()
})
elements.environmentStatusFilter.addEventListener('change', () => {
  state.environmentStatus = elements.environmentStatusFilter.value
  state.environmentPage = 1
  renderEnvironments()
})
elements.environmentReset.addEventListener('click', () => {
  state.environmentQuery = ''
  state.environmentStatus = 'all'
  state.environmentPage = 1
  elements.environmentSearch.value = ''
  elements.environmentStatusFilter.value = 'all'
  renderEnvironments()
})
elements.environmentPrevious.addEventListener('click', () => {
  state.environmentPage = Math.max(1, state.environmentPage - 1)
  renderEnvironments()
})
elements.environmentNext.addEventListener('click', () => {
  state.environmentPage += 1
  renderEnvironments()
})
elements.clearEnvironmentSelection.addEventListener('click', () => {
  state.selectedEnvironmentIds.clear()
  renderEnvironments()
})
elements.bulkOpenEnvironments.addEventListener('click', () => { void updateSelectedEnvironments('open', '选中的环境已打开。') })
elements.bulkCloseEnvironments.addEventListener('click', () => { void updateSelectedEnvironments('close', '选中的环境已关闭。') })

async function init () {
  setStatus('正在读取配置…')
  try {
    await refreshProfiles()
    await refreshEnvironments()
    setStatus('配置已就绪。', 'success')
  } catch (error) {
    setStatus(error.message, 'error')
  }
}

window.browserApi.onEnvironmentsChanged(() => { void refreshEnvironments() })
void init()
