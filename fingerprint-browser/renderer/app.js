const state = {
  profiles: [],
  environments: [],
  editingId: null,
  draft: null
}

const elements = {
  status: document.querySelector('#status'),
  profileCount: document.querySelector('#profile-count'),
  profilesList: document.querySelector('#profiles-list'),
  environmentCount: document.querySelector('#environment-count'),
  environmentsList: document.querySelector('#environments-list'),
  emptyState: document.querySelector('#empty-state'),
  form: document.querySelector('#profile-form'),
  editorTitle: document.querySelector('#editor-title'),
  newProfile: document.querySelector('#new-profile'),
  emptyNewProfile: document.querySelector('#empty-new-profile'),
  cancelEdit: document.querySelector('#cancel-edit'),
  profileName: document.querySelector('#profile-name'),
  profileUrl: document.querySelector('#profile-url'),
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
      createButton('新建独立标签', 'launch', profile.id, 'button button-small button-primary'),
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

function renderEnvironments () {
  elements.environmentCount.textContent = `${state.environments.length} 个`
  elements.environmentsList.replaceChildren()
  if (state.environments.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'list-empty'
    empty.textContent = '新建独立标签后，环境会显示在这里。'
    elements.environmentsList.append(empty)
    return
  }
  for (const environment of [...state.environments].sort((left, right) => right.updatedAt - left.updatedAt)) {
    const card = document.createElement('article')
    card.className = 'profile-card environment-card'
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
    metadata.textContent = `版本 ${environment.profileRevision} · 最近使用 ${formatEnvironmentTime(environment.updatedAt)}`
    const actions = document.createElement('div')
    actions.className = 'profile-actions'
    actions.append(
      createButton(environment.status === 'open' ? '已打开' : '重新打开', 'reopen-environment', environment.id, 'button button-small button-primary'),
      createButton('删除环境', 'delete-environment', environment.id, 'button button-small button-danger')
    )
    if (environment.status === 'open') actions.firstChild.disabled = true
    card.append(top, summary, metadata, actions)
    elements.environmentsList.append(card)
  }
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
  try {
    const response = unwrap(await window.browserApi.launchProfile({ id: profile.id, url: profile.url }))
    setStatus(`已为“${profile.name}”新建独立标签。${response.warning || ''}`, response.warning ? '' : 'success')
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

async function deleteEnvironment (id) {
  const environment = state.environments.find(item => item.id === id)
  if (!environment || environment.status === 'open') return
  if (!window.confirm(`确定删除“${environment.profileName}”环境吗？这会删除该环境的 Cookie、缓存和登录数据，不能恢复。`)) return
  try {
    const response = unwrap(await window.browserApi.deleteEnvironment(id))
    state.environments = response.environments
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
  if (button.dataset.action === 'delete-environment') void deleteEnvironment(button.dataset.id)
})

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
