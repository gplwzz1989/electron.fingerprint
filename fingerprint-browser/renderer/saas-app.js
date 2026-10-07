'use strict'

const paths = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  browser: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18M7 6.5h.01M10 6.5h.01"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 7h14M5 17h14"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M21 21v-3a6 6 0 0 0-4-5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  wallet: '<rect x="3" y="5" width="18" height="15" rx="3"/><path d="M3 9h18M15 13h6v4h-6zM7 5V3h11v2"/>',
  settings: '<path d="m9 3-1 3-3 1-2 3 2 2-1 3 3 2 1 3h4l1-3 3-1 2-3-2-2 1-3-3-2-1-3H9Z"/><circle cx="10" cy="12" r="3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0v7l2 3H4l2-3V8ZM9 21h6"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 4 3c-1 .4-1 1-1 2M12 17h.01"/>',
  play: '<path d="m8 4 12 8-12 8V4Z"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="1.5"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
  alert: '<path d="m12 3 10 18H2L12 3ZM12 9v5M12 17h.01"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m7 12 3 3 7-7"/>',
  sync: '<path d="M20 7v5h-5M4 17v-5h5M5 7a8 8 0 0 1 13-1l2 3M4 15l2 3a8 8 0 0 0 13-1"/>',
  cloud: '<path d="M6 18a5 5 0 0 1-1-10 7 7 0 0 1 13-1 5.5 5.5 0 0 1 0 11H6Z"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  upload: '<path d="M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5"/>',
  folder: '<path d="M3 7V4h7l3 3h8v13H3V7Z"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  left: '<path d="m14 5-7 7 7 7"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
  monitor: '<rect x="3" y="3" width="18" height="13" rx="2"/><path d="M8 21h8M12 16v5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
  fingerprint: '<path d="M4 11a8 8 0 0 1 16 0M7 13v-2a5 5 0 0 1 10 0v4c0 3-1 5-2 7M10 16v-5a2 2 0 0 1 4 0v5c0 2-.6 4-1.5 5M4 14v2c0 2 .5 4 1.5 5M7 17c0 2 .5 3 1 4M20 14v3"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  chart: '<path d="M4 3v17h17M8 15l4-5 4 3 5-8"/>',
  file: '<path d="M5 3h9l5 5v13H5V3ZM14 3v5h5M8 13h8M8 17h6"/>'
}
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.browser}</svg>`
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))
const btn = (label, action, style = '', extra = '', symbol = '') => `<button class="button ${style}" data-action="${action}" ${extra}>${symbol ? icon(symbol) : ''}${label}</button>`
const badge = (text, color = '') => `<span class="status ${color}"><i class="dot"></i>${text}</span>`
const navItems = [['overview', '工作台', 'grid'], ['environments', '浏览器环境', 'browser'], ['proxies', '代理资源', 'globe'], ['members', '团队成员', 'users'], ['audit', '操作记录', 'clock'], ['billing', '订阅与用量', 'wallet'], ['settings', '设置', 'settings']]
let environments = []
let groups = []
const members = [
  ['林沐', 'linmu@example.com', '所有者', '全部环境', '今天 09:42', '有效'],
  ['陈悦', 'chenyue@example.com', '管理员', '电商运营 · 4 个环境', '今天 09:36', '有效'],
  ['王宁', 'wangning@example.com', '操作者', '内容营销 · 2 个环境', '今天 09:21', '有效'],
  ['周禾', 'zhouhe@example.com', '操作者', '客户支持 · 2 个环境', '今天 09:18', '有效'],
  ['赵晨', 'zhaochen@example.com', '只读成员', '电商运营 · 4 个环境', '等待接受邀请', '待接受']
]
let route = 'overview'
let filter = 'all'
let searchTerm = ''
let groupFilter = '全部分组'
let environmentPageNumber = 1
let environmentSort = 'recent'
const environmentPageSize = 20
let wizardStep = 1
let wizardSubmitting = false
let profiles = []
let currentEnvironment = null
let detailTab = 'overview'
let toastTimer
let lastFocus
function freshWizardDraft () {
  return { name: '美国旗舰店 · 运营', group: '电商运营', storage: 'local', url: 'https://example.com', proxy: { mode: 'direct', server: '', username: '', password: '' }, profile: null, fingerprint: null, recommendedFingerprint: null }
}
let draft = freshWizardDraft()
let selected = new Set()
let unifiedTabs = { activeId: null, tabs: [] }

function resetWizard () {
  wizardStep = 1
  wizardSubmitting = false
  draft = freshWizardDraft()
}

function cloneValue (value) {
  return JSON.parse(JSON.stringify(value))
}

async function startCreateWizard () {
  resetWizard()
  navigate('create')
  try {
    const response = await window.browserApi.getDraft()
    if (!response?.ok) throw new Error(response?.error || '创建指纹草稿失败。')
    draft.profile = response.profile
    draft.fingerprint = cloneValue(response.profile.fingerprint)
    draft.recommendedFingerprint = cloneValue(response.profile.fingerprint)
    render()
  } catch (error) {
    toast(error?.message || '创建指纹草稿失败，请重试。')
  }
}

function setFingerprintField (path, value) {
  const keys = path.split('.')
  let target = draft.fingerprint
  for (const key of keys.slice(0, -1)) target = target[key]
  target[keys[keys.length - 1]] = value
  updateFingerprintSummary()
}

function updateFingerprintSummary () {
  const node = document.getElementById('preview-fingerprint')
  const fingerprint = draft.fingerprint
  if (!node || !fingerprint) return
  node.textContent = `${fingerprint.locale.language} · ${fingerprint.hardware.platform} · ${fingerprint.screen.width} × ${fingerprint.screen.height}`
}

function fingerprintChanged () {
  return JSON.stringify(draft.fingerprint) !== JSON.stringify(draft.recommendedFingerprint)
}

async function regenerateFingerprint () {
  if (fingerprintChanged() && !window.confirm('已修改指纹参数，重新生成会覆盖这些修改。是否继续？')) return
  try {
    const response = await window.browserApi.getDraft()
    if (!response?.ok) throw new Error(response?.error || '重新生成指纹失败。')
    const fingerprint = cloneValue(response.profile.fingerprint)
    fingerprint.id = draft.profile.id
    draft.fingerprint = fingerprint
    draft.recommendedFingerprint = cloneValue(fingerprint)
    render()
    toast('已生成新的指纹初始值。')
  } catch (error) {
    toast(error?.message || '重新生成指纹失败，请重试。')
  }
}

function restoreFingerprint () {
  if (!fingerprintChanged()) return
  if (!window.confirm('是否放弃当前修改并恢复推荐值？')) return
  draft.fingerprint = cloneValue(draft.recommendedFingerprint)
  render()
  toast('已恢复推荐指纹值。')
}

function renderFingerprintFields () {
  const fingerprint = draft.fingerprint
  if (!fingerprint) return `<div class="notice warning">${icon('sync')}正在生成本机推荐指纹，请稍候。</div>`
  const text = (path, label, value, placeholder = '') => `<label class="field"><span>${label}</span><input data-fingerprint-path="${path}" value="${escapeHTML(value ?? '')}" placeholder="${escapeHTML(placeholder)}" spellcheck="false"></label>`
  const number = (path, label, value, min = 1) => `<label class="field"><span>${label}</span><input data-fingerprint-path="${path}" data-fingerprint-type="number" type="number" min="${min}" step="${min < 1 ? min : 1}" value="${escapeHTML(value)}"></label>`
  const select = (path, label, value, options) => `<label class="field"><span>${label}</span><select data-fingerprint-path="${path}">${options.map(option => `<option value="${escapeHTML(option)}" ${option === value ? 'selected' : ''}>${escapeHTML(option)}</option>`).join('')}</select></label>`
  const toggle = (path, label, checked) => `<label class="radio-card"><input type="checkbox" data-fingerprint-path="${path}" ${checked ? 'checked' : ''}><span>${label}</span></label>`
  const modules = [['ua', '用户代理'], ['clientHints', '客户端提示'], ['locale', '语言'], ['timezone', '时区'], ['navigator', '设备参数'], ['screen', '屏幕参数'], ['webgl', '图形参数'], ['canvas', '画布'], ['audio', '音频'], ['fonts', '字体'], ['webrtc', 'WebRTC'], ['runtimeInspector', '调试器兼容']]
  return `<div class="template-option"><div><b>本机推荐指纹 · 可自定义</b><p>自动生成初始值，修改后会保存为该环境的独立指纹快照。</p></div><div>${btn('重新生成', 'regenerate-fingerprint', 'small', 'type="button"')} ${btn('恢复推荐值', 'restore-fingerprint', 'text small', 'type="button"')}</div></div>
    <section><h3>浏览器与语言</h3><div class="form-row">${text('browser.userAgent', '用户代理（留空使用内核默认值）', fingerprint.browser.userAgent, '留空使用当前内核')}</div><div class="form-row">${text('browser.acceptLanguage', '请求语言', fingerprint.browser.acceptLanguage)}${text('locale.language', '主要语言', fingerprint.locale.language)}</div><div class="form-row">${text('locale.languages', '语言列表（逗号分隔）', fingerprint.locale.languages.join(', '))}${text('locale.timezone', '时区', fingerprint.locale.timezone, '例如 Asia/Shanghai')}</div></section>
    <div class="form-divider"></div><section><h3>设备与屏幕</h3><div class="form-row">${select('hardware.platform', '操作系统平台', fingerprint.hardware.platform, ['Win32', 'MacIntel', 'Linux x86_64'])}${number('hardware.hardwareConcurrency', 'CPU 线程数', fingerprint.hardware.hardwareConcurrency)}</div><div class="form-row">${select('hardware.deviceMemory', '网页可见内存（GiB）', fingerprint.hardware.deviceMemory, [1, 2, 4, 8])}${number('screen.deviceScaleFactor', '屏幕缩放', fingerprint.screen.deviceScaleFactor, 0.1)}</div><div class="form-row">${number('screen.width', '屏幕宽度', fingerprint.screen.width)}${number('screen.height', '屏幕高度', fingerprint.screen.height)}</div><div class="form-row">${number('screen.availWidth', '可用宽度', fingerprint.screen.availWidth)}${number('screen.availHeight', '可用高度', fingerprint.screen.availHeight)}</div></section>
    <div class="form-divider"></div><section><h3>图形与噪声</h3><div class="form-row">${text('graphics.webglVendor', 'WebGL 厂商', fingerprint.graphics.webglVendor)}${text('graphics.webglRenderer', 'WebGL 渲染器', fingerprint.graphics.webglRenderer)}</div>${text('noise.seed', '指纹种子', fingerprint.noise.seed, '自动生成的独立种子')}<div class="radio-cards">${toggle('noise.canvas', 'Canvas 噪声', fingerprint.noise.canvas)}${toggle('noise.audio', 'Audio 噪声', fingerprint.noise.audio)}${toggle('noise.rects', '元素尺寸噪声', fingerprint.noise.rects)}</div></section>
    <details class="advanced"><summary>指纹模块开关</summary><div class="radio-cards">${modules.map(([key, label]) => toggle(`modules.${key}`, label, fingerprint.modules[key])).join('')}</div><small>关闭模块时使用内核原生行为；配置保存成功不代表已通过所有网站检测。</small></details>`
}

function activeUnifiedTab () {
  return unifiedTabs.tabs.find(tab => tab.id === unifiedTabs.activeId) || null
}

function fingerprintTooltip (tab) {
  if (!tab) return '选择环境标签后查看指纹参数与代理信息。'
  const { browser, locale, hardware, screen, graphics, noise, modules } = tab.fingerprint
  const proxy = tab.proxy || { mode: 'direct' }
  const switches = { ua: '用户代理', clientHints: '客户端提示', locale: '语言', timezone: '时区', navigator: '设备', screen: '屏幕', webgl: '图形', canvas: '画布', audio: '音频', fonts: '字体', webrtc: '实时通信', runtimeInspector: '调试器兼容' }
  const status = value => value ? '开启' : '关闭'
  return [
    `当前标签：${tab.profileName} · 配置版本 ${tab.revision}`,
    `指纹状态：${tab.fingerprint.enabled ? '启用' : '停用，下列为保存配置，页面使用原生值'}`,
    `代理：${{ direct: '直连（不使用代理）', http: '网页代理', socks5: '套接字代理' }[proxy.mode]}`,
    ...(proxy.mode === 'direct' ? [] : [`代理地址：${proxy.server}`, `代理账户：${proxy.username || '未配置'}`, `代理密码：${proxy.hasPassword ? '已配置（已隐藏）' : '未配置'}`]),
    `浏览器：${browser.family} · 内核主版本 ${browser.chromiumMajor}`,
    `用户代理：${browser.userAgent || tab.userAgent || '使用内核默认值'}`,
    `平台：${hardware.platform}`,
    `语言：${locale.language} · 语言列表：${locale.languages.join('、')}`,
    `请求语言：${browser.acceptLanguage || '使用内核默认值'}`,
    `时区：${locale.timezone}`,
    `硬件：${hardware.hardwareConcurrency} 线程 · 内存 ${hardware.deviceMemory} 吉字节`,
    `屏幕：${screen.width} × ${screen.height} · 可用 ${screen.availWidth} × ${screen.availHeight} · 缩放 ${screen.deviceScaleFactor}`,
    `图形厂商：${graphics.webglVendor || '使用原生值'}`,
    `图形渲染器：${graphics.webglRenderer || '使用原生值'}`,
    `噪声：画布${status(noise.canvas)} · 音频${status(noise.audio)} · 元素尺寸${status(noise.rects)}`,
    `噪声种子：${noise.seed}`,
    `模块：${Object.entries(modules).map(([key, enabled]) => `${switches[key]}${status(enabled)}`).join('、')}`,
    ...(tab.warning ? [`兼容提示：${tab.warning}`] : [])
  ].join('\n')
}

function renderUnifiedTabs (snapshot = { activeId: null, tabs: [] }) {
  unifiedTabs = snapshot
  const tabbar = document.getElementById('unified-tabs')
  if (!tabbar) return
  tabbar.replaceChildren()
  const dashboardTab = document.createElement('button')
  dashboardTab.type = 'button'
  dashboardTab.className = `unified-tab dashboard-tab${unifiedTabs.activeId ? '' : ' active'}`
  dashboardTab.dataset.action = 'dashboard-tab'
  dashboardTab.setAttribute('role', 'tab')
  dashboardTab.setAttribute('aria-selected', String(!unifiedTabs.activeId))
  dashboardTab.innerHTML = '<span class="unified-tab-icon">⌂</span><span class="unified-tab-title">首页</span>'
  tabbar.append(dashboardTab)
  for (const tab of unifiedTabs.tabs) {
    const item = document.createElement('div')
    item.className = `unified-tab${tab.id === unifiedTabs.activeId ? ' active' : ''}`
    item.dataset.id = tab.id
    const select = document.createElement('button')
    select.type = 'button'
    select.className = 'unified-tab-select'
    select.dataset.action = 'environment-tab'
    select.dataset.id = tab.id
    select.setAttribute('role', 'tab')
    select.setAttribute('aria-selected', String(tab.id === unifiedTabs.activeId))
    select.innerHTML = `<span class="unified-tab-icon">${icon('browser')}</span><span class="unified-tab-title">${escapeHTML(tab.profileName || '浏览器环境')}</span>`
    select.title = tab.profileName || '浏览器环境'
    const close = document.createElement('button')
    close.type = 'button'
    close.className = 'unified-tab-close'
    close.dataset.action = 'close-environment-tab'
    close.dataset.id = tab.id
    close.setAttribute('aria-label', `关闭${tab.profileName || '浏览器环境'}`)
    close.textContent = '×'
    item.append(select, close)
    tabbar.append(item)
  }
  const newTab = document.createElement('button')
  newTab.type = 'button'
  newTab.className = 'unified-tab-new'
  newTab.dataset.action = 'new-default-tab'
  newTab.setAttribute('aria-label', '使用默认参数新建标签')
  newTab.title = '使用默认参数新建标签'
  newTab.innerHTML = icon('plus')
  tabbar.append(newTab)
  const active = activeUnifiedTab()
  const address = document.getElementById('unified-address')
  const back = document.getElementById('unified-back')
  const forward = document.getElementById('unified-forward')
  const reload = document.getElementById('unified-reload')
  const go = document.getElementById('unified-go')
  const devtools = document.getElementById('unified-devtools')
  const fingerprint = document.getElementById('unified-fingerprint')
  if (fingerprint) {
    if (!fingerprint.firstElementChild) fingerprint.innerHTML = icon('fingerprint')
    fingerprint.disabled = !active
    // 原生悬停提示可以显示在网页视图之上，避免普通网页浮层被遮挡。
    fingerprint.title = fingerprintTooltip(active)
  }
  if (address && document.activeElement !== address) address.value = active?.url || ''
  if (address) address.disabled = !active
  if (back) back.disabled = !active?.canGoBack
  if (forward) forward.disabled = !active?.canGoForward
  if (reload) reload.disabled = !active
  if (devtools) devtools.disabled = !active
  if (go) go.disabled = !active
  document.body.classList.toggle('environment-tab-active', Boolean(active))
}

async function focusEnvironmentTab (environmentId) {
  const snapshot = await window.browserApi.listTabs()
  const tab = snapshot.tabs.find(item => item.environmentId === environmentId)
  if (!tab) return false
  const response = await window.browserApi.selectTab(tab.id)
  if (!response?.ok) throw new Error(response?.error || '切换浏览器环境失败。')
  return true
}

async function operateUnifiedTab (operation) {
  try {
    const response = await operation()
    if (!response?.ok) throw new Error(response?.error || '标签操作失败，请重试。')
    renderUnifiedTabs(response)
  } catch (error) {
    toast(error?.message || '标签操作失败，请重试。')
  }
}

async function createDefaultTab () {
  const profile = profiles.find(item => item.id === 'win11-cn-desktop') || profiles[0]
  if (!profile) return toast('没有可用的默认浏览器配置，请先创建配置。')
  try {
    const response = await window.browserApi.launchProfile({ id: profile.id })
    if (!response?.ok) throw new Error(response?.error || '新建标签失败，请重试。')
    const snapshot = await window.browserApi.listTabs()
    if (!snapshot?.ok) throw new Error(snapshot?.error || '读取新标签状态失败，请重试。')
    renderUnifiedTabs(snapshot)
  } catch (error) {
    toast(error?.message || '新建标签失败，请重试。')
  }
}

function formatRealTime (timestamp) {
  if (!timestamp) return '尚未使用'
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return '尚未使用'
  const now = new Date()
  const time = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  return date.toDateString() === now.toDateString()
    ? `今天 ${time}`
    : date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }).replace('/', '月') + `日 ${time}`
}

function mapEnvironment (environment) {
  const fingerprint = environment.fingerprint || {}
  const timezone = fingerprint.locale?.timezone || '未设置时区'
  const profileName = environment.profileName || '未命名环境'
  const language = fingerprint.locale?.language || ''
  return {
    id: environment.id,
    raw: environment,
    name: profileName,
    group: environment.group || '未分组',
    site: environment.lastUrl || '未设置网址',
    letter: [...profileName][0] || '环',
    country: timezone,
    code: language.split('-')[1] || '本地',
    ip: '未检测',
    proxyLabel: environment.proxy?.mode && environment.proxy.mode !== 'direct' ? environment.proxy.server : '直连（不使用代理）',
    owner: '我',
    state: environment.status === 'open' ? '运行中' : '已关闭',
    sync: environment.storage === 'cloud' ? '云同步未接通' : '仅本地',
    time: formatRealTime(environment.updatedAt),
    color: language.toLowerCase().startsWith('en') ? 'orange' : language.toLowerCase().startsWith('zh') ? 'purple' : '',
    profileRevision: environment.profileRevision,
    lastUrl: environment.lastUrl
  }
}

function groupNames () {
  const names = new Set(['未分组'])
  for (const group of groups) if (group?.name) names.add(group.name)
  for (const environment of environments) if (environment.group) names.add(environment.group)
  if (draft?.group) names.add(draft.group)
  return [...names]
}

function sortedFilteredEnvironments () {
  const list = filteredEnvironments().slice()
  if (environmentSort === 'name') {
    return list.sort((left, right) => left.name.localeCompare(right.name, 'zh-CN') || left.id.localeCompare(right.id))
  }
  return list.sort((left, right) => (right.raw.updatedAt || 0) - (left.raw.updatedAt || 0) || left.name.localeCompare(right.name, 'zh-CN'))
}

function pagedEnvironments () {
  const list = sortedFilteredEnvironments()
  const pageCount = Math.max(1, Math.ceil(list.length / environmentPageSize))
  environmentPageNumber = Math.min(Math.max(environmentPageNumber, 1), pageCount)
  const start = (environmentPageNumber - 1) * environmentPageSize
  return { list: list.slice(start, start + environmentPageSize), total: list.length, pageCount }
}

function applyEnvironmentSnapshot (snapshot) {
  environments = (snapshot || []).map(mapEnvironment)
  const currentId = currentEnvironment?.id
  currentEnvironment = environments.find(item => item.id === currentId) || environments[0] || null
  const { pageCount } = pagedEnvironments()
  if (environmentPageNumber > pageCount) environmentPageNumber = pageCount
}

async function loadRealData (showToast = true) {
  try {
    const [environmentResult, profileResult, groupResult] = await Promise.all([
      window.browserApi.listEnvironments(),
      window.browserApi.listProfiles(),
      window.browserApi.listGroups()
    ])
    if (!environmentResult?.ok) throw new Error(environmentResult?.error || '读取浏览器环境失败。')
    if (!profileResult?.ok) throw new Error(profileResult?.error || '读取浏览器配置失败。')
    if (!groupResult?.ok) throw new Error(groupResult?.error || '读取业务分组失败。')
    applyEnvironmentSnapshot(environmentResult.environments)
    profiles = profileResult.profiles || []
    groups = groupResult.groups || []
    render()
    if (showToast) toast(environments.length ? `已加载 ${environments.length} 个真实浏览器环境。` : '当前还没有浏览器环境，可新建一个环境。')
  } catch (error) {
    toast(error?.message || '读取真实浏览器环境失败，请重试。')
    render()
  }
}

async function launchEnvironment (environment) {
  if (!environment) return
  try {
    if (environment.state !== '运行中') {
      const response = await window.browserApi.reopenEnvironment(environment.id)
      if (!response?.ok) throw new Error(response?.error || '打开浏览器环境失败。')
      applyEnvironmentSnapshot(response.environments)
    } else {
      const focused = await focusEnvironmentTab(environment.id)
      if (!focused) throw new Error('找不到该环境的已打开标签，请重新打开环境。')
    }
    currentEnvironment = environments.find(item => item.id === environment.id) || environment
    render()
    toast(`已打开“${currentEnvironment.name}”环境。`)
  } catch (error) {
    toast(error?.message || '打开浏览器环境失败，请重试。')
  }
}

async function closeEnvironment (environment) {
  if (!environment) return
  try {
    const response = await window.browserApi.closeEnvironment(environment.id)
    if (!response?.ok) throw new Error(response?.error || '关闭浏览器环境失败。')
    applyEnvironmentSnapshot(response.environments)
    closeOverlay()
    navigate('environments')
    toast('环境已关闭，登录数据已保存。')
  } catch (error) {
    toast(error?.message || '关闭浏览器环境失败，请重试。')
  }
}

function confirmEnvironmentDeletion (environment) {
  if (!environment) return toast('找不到该环境，请刷新环境列表。')
  const running = environment.state === '运行中'
  dialog('删除浏览器环境', `<p>确定删除“${escapeHTML(environment.name)}”吗？</p><div class="notice error" style="margin-top:18px">将删除这个环境的本地数据，包括登录状态、Cookie、缓存和指纹快照，删除后不可恢复。配置模板会保留。${running ? '<br>此环境正在运行，确认后将先关闭环境再删除。' : ''}</div>`, btn('取消', 'close-overlay') + btn(running ? '关闭并删除' : '确认删除', 'confirm-delete-env', 'danger', `data-id="${environment.id}"`))
}

async function deleteEnvironment (environment, button) {
  if (!environment) return toast('找不到该环境，请刷新环境列表。')
  button.disabled = true
  try {
    if (environment.state === '运行中') {
      const closed = await window.browserApi.closeEnvironment(environment.id)
      if (!closed?.ok) return toast(closed?.error || '关闭环境失败，未执行删除。')
    }
    const response = await window.browserApi.deleteEnvironment(environment.id)
    if (!response?.ok) return toast(response?.error || '删除环境失败，请重试。')
    selected.delete(environment.id)
    applyEnvironmentSnapshot(response.environments)
    closeOverlay()
    navigate('environments')
    toast(response.deletionPending ? '环境已删除；被占用的本地数据将在下次启动时清理。' : '环境和本地数据已删除。')
  } catch {
    toast('删除环境失败，请重试。')
  } finally {
    button.disabled = false
  }
}

async function updateSelected (operation) {
  const ids = [...selected]
  if (!ids.length) return
  try {
    for (const id of ids) {
      const item = environments.find(environment => environment.id === id)
      if (!item) continue
      if (operation === 'open' && item.state !== '运行中') {
        const response = await window.browserApi.reopenEnvironment(id)
        if (!response?.ok) throw new Error(response?.error || '批量打开环境失败。')
        applyEnvironmentSnapshot(response.environments)
      }
      if (operation === 'close' && item.state === '运行中') {
        const response = await window.browserApi.closeEnvironment(id)
        if (!response?.ok) throw new Error(response?.error || '批量关闭环境失败。')
        applyEnvironmentSnapshot(response.environments)
      }
    }
    selected.clear()
    render()
    toast(operation === 'open' ? '选中的环境已打开。' : '选中的环境已关闭。')
  } catch (error) {
    toast(error?.message || '批量操作环境失败，请重试。')
  }
}

function heading(title, subtitle, actions = '', eyebrow = '') {
  return `<div class="page-heading"><div>${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ''}<h1>${title}</h1><p>${subtitle}</p></div><div class="actions">${actions}</div></div>`
}
function metrics() {
  const running = environments.filter(e => e.state === '运行中').length
  const issues = environments.filter(e => e.state === '代理异常' || e.sync === '同步失败').length
  return `<div class="metrics"><div class="card metric"><span class="metric-icon">${icon('browser')}</span><div><small>环境总数</small><b>${environments.length}</b><p>3 个业务分组</p></div></div><div class="card metric"><span class="metric-icon green">${icon('play')}</span><div><small>正在运行</small><b>${running}<span> 个环境</span></b><p>本机独立会话</p></div></div><div class="card metric"><span class="metric-icon orange">${icon('alert')}</span><div><small>需要处理</small><b>${issues}<span> 项</span></b><p>代理与同步异常</p></div></div><div class="card metric"><span class="metric-icon purple">${icon('chart')}</span><div><small>环境配额</small><b>${environments.length}<span> / 300</span></b><div class="progress"><i style="width:${Math.max(8, environments.length / 3)}%"></i></div></div></div></div>`
}
function overview() {
  return `${heading('早上好，林沐', '今天的业务环境已准备就绪。先处理异常，再开始团队的日常工作。', btn('新建环境', 'create', 'primary', '', 'plus'), '你的团队工作空间')}
  <section class="welcome"><div><h2>把每个业务，放进独立的环境</h2><p>从创建到交接，让登录状态、访问权限和工作记录都有清晰归属。</p><div class="welcome-steps"><span>${icon('checkCircle')}创建工作空间</span><span>${icon('checkCircle')}建立首个环境</span><span>${icon('users')}邀请同事开始协作</span></div></div><div class="actions">${btn('查看新手引导', 'onboarding', 'soft')}</div><div class="welcome-art">${icon('fingerprint')}</div></section>
  ${metrics()}<div class="overview-grid"><div><section class="card"><div class="card-head"><h2>最近使用的环境</h2><a class="button text small" href="#environments">查看全部 ${icon('arrow')}</a></div>${environments.slice(0, 5).map(e => `<div class="recent-row"><span class="env-logo ${e.color}">${e.letter}</span><div class="grow"><button class="env-title" data-action="detail" data-id="${e.id}">${e.name}</button><p>${e.group} <span class="footer-divider">·</span> ${e.country}</p></div>${badge(e.state, e.state === '运行中' ? 'green' : e.state === '代理异常' ? 'orange' : '')}${btn(e.state === '运行中' ? '进入' : e.state === '代理异常' ? '诊断' : '打开', e.state === '代理异常' ? 'diagnostic' : 'launch', e.state === '代理异常' ? 'small' : 'small soft', `data-id="${e.id}"`)}</div>`).join('')}</section><div class="system-card"><div class="actions">${icon('shield')}<b style="font-size:12px">数据保存位置由你决定</b><span class="tiny-tag" style="margin-left:auto">本地优先</span></div><p>仅本地环境不会上传登录数据。开启云同步前，请确认存储范围和获授权成员；不同系统的会话交接需通过兼容性检查。</p></div></div><div><section class="card"><div class="card-head"><h2>需要你的关注</h2><span class="status orange">2 项</span></div><div class="issue"><span class="issue-icon">${icon('globe')}</span><div><b>法国环境的代理连接失败</b><p>最后检查于 09:21，启动已阻止。</p>${btn('检查代理连接', 'diagnostic', 'text small', 'data-id="QJ-1003"')}</div></div><div class="issue"><span class="issue-icon">${icon('sync')}</span><div><b>日本环境未完成云同步</b><p>本机数据已保存，团队版本未更新。</p>${btn('查看同步状态', 'detail', 'text small', 'data-id="QJ-1006"')}</div></div></section><div class="mini-heading"><h3>团队最近动态</h3><a href="#audit" class="muted" style="font-size:10px">全部记录 →</a></div><section class="card card-body"><div class="activity"><i class="timeline-dot"></i><div>林沐打开了美国旗舰店<p>今天 09:42 · 本机客户端</p></div></div><div class="activity"><i class="timeline-dot"></i><div>陈悦完成英国环境同步<p>今天 09:36 · 上海办公电脑</p></div></div><div class="activity"><i class="timeline-dot"></i><div>赵晨收到工作空间邀请<p>昨天 18:40 · 等待接受</p></div></div></section></div></div>`
}
function filteredEnvironments() {
  return environments.filter(e => (filter === 'all' || (filter === 'running' ? e.state === '运行中' : e.state === '代理异常' || e.sync === '同步失败')) && (groupFilter === '全部分组' || e.group === groupFilter) && `${e.name} ${e.owner} ${e.id}`.toLowerCase().includes(searchTerm.toLowerCase()))
}
function environmentRows() {
  const list = pagedEnvironments().list
  if (!list.length) return `<tr><td colspan="8"><div class="empty">${icon('search')}<h2>没有找到匹配的环境</h2><p>试试其他关键词，或清除分组和状态筛选。</p>${btn('清除筛选', 'reset-filters')}</div></td></tr>`
  return list.map(e => `<tr class="environment-row environment-card"><td><input type="checkbox" data-action="select-environment" data-select="${e.id}" data-id="${e.id}" aria-label="选择${escapeHTML(e.name)}" ${selected.has(e.id) ? 'checked' : ''}></td><td><div class="env-name"><span class="env-logo ${e.color}">${e.letter}</span><div><button class="env-title" data-action="detail" data-id="${e.id}">${escapeHTML(e.name)}</button><div class="env-meta"><span>${e.id}</span><span class="chip">${escapeHTML(e.group)}</span></div></div></div></td><td><span class="country">${e.code}</span>${e.country}<span class="cell-sub mono">${escapeHTML(e.proxyLabel || e.ip)}</span></td><td><span class="person"><span class="avatar ${e.owner === '王宁' ? 'purple' : ''}">${e.owner[0]}</span>${e.owner}</span></td><td><span class="sync ${e.sync === '同步失败' ? 'warning' : e.sync === '仅本地' ? 'local' : ''}">${icon(e.sync === '仅本地' ? 'monitor' : 'sync')}${e.sync}</span></td><td>${badge(e.state, e.state === '运行中' ? 'green' : e.state === '代理异常' ? 'orange' : '')}</td><td><span style="font-size:10px;color:#7d8a9c">${e.time}</span></td><td><div class="row-actions">${btn(e.state === '运行中' ? '进入' : e.state === '代理异常' ? '诊断' : '打开', e.state === '代理异常' ? 'diagnostic' : 'launch', e.state === '代理异常' ? 'small' : 'small soft', `data-id="${e.id}"`)}${btn('分组', 'edit-environment-group', 'small', `data-id="${e.id}"`)}${btn('删除', 'delete-env', 'small danger', `data-id="${e.id}" aria-label="删除${escapeHTML(e.name)}"`)}<button class="icon-button" aria-label="查看${escapeHTML(e.name)}的详情" data-action="detail" data-id="${e.id}">${icon('more')}</button></div></td></tr>`).join('')
}
function groupManager () {
  const items = groups.filter(group => group.name !== '未分组').map(group => `<div class="setting-row"><div><b>${escapeHTML(group.name)}</b><p>${environments.filter(environment => environment.group === group.name).length} 个环境</p></div><div class="actions">${btn('编辑', 'edit-group', 'small', `data-id="${group.id}"`)}${btn('删除', 'delete-group', 'small danger', `data-id="${group.id}"`)}</div></div>`).join('')
  return `<div class="dialog-backdrop" data-dismiss="dialog"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="group-dialog-title"><div class="card-head"><h2 id="group-dialog-title">管理业务分组</h2><button class="icon-button" aria-label="关闭分组管理" data-action="close-overlay">${icon('close')}</button></div><div class="card-body"><form id="group-create-form"><label class="field"><span>新分组名称</span><input name="name" required maxlength="80" placeholder="例如：海外广告"></label><div class="form-footer" style="padding:0;border:0"><span></span><button class="button primary" type="submit">添加分组 ${icon('plus')}</button></div></form><div class="form-divider"></div><div class="setting-row"><div><b>未分组</b><p>系统默认分组，删除其他分组时环境会回到这里。</p></div><span class="tiny-tag">系统保留</span></div>${items || '<div class="empty"><h2>还没有自定义分组</h2><p>创建分组后，可以在新建环境时选择。</p></div>'}</div><div class="form-footer"><span></span><div class="actions">${btn('完成', 'close-overlay', 'primary')}</div></div></section></div>`
}
function environmentGroupDialog (environment) {
  const options = groupNames().map(group => `<option ${group === environment.group ? 'selected' : ''}>${escapeHTML(group)}</option>`).join('')
  return `<form id="environment-group-form"><input type="hidden" name="id" value="${escapeHTML(environment.id)}"><input type="hidden" name="revision" value="${environment.raw.metadataRevision}"><label class="field"><span>所属分组</span><select name="group">${options}</select></label></form>`
}
function environmentPage(empty = false) {
  const { total, pageCount } = pagedEnvironments()
  const groupOptions = groupNames().map(group => `<option ${group === groupFilter ? 'selected' : ''}>${escapeHTML(group)}</option>`).join('')
  const pagination = pageCount > 1 ? `<div class="pagination">${btn('‹', 'environment-page-prev', 'page-box', `aria-label="上一页" ${environmentPageNumber <= 1 ? 'disabled' : ''}`)}${Array.from({ length: pageCount }, (_item, index) => btn(String(index + 1), 'environment-page', `page-box${environmentPageNumber === index + 1 ? ' current' : ''}`, `data-page="${index + 1}"`)).join('')}${btn('›', 'environment-page-next', 'page-box', `aria-label="下一页" ${environmentPageNumber >= pageCount ? 'disabled' : ''}`)}</div>` : '<div class="pagination"><span class="page-box current">1</span></div>'
  return `${heading('浏览器环境', '管理业务的独立会话，保持登录状态和团队访问有序。', btn('导入环境', 'import', '', '', 'upload') + btn('管理分组', 'manage-groups', '', '', 'folder') + btn('新建环境', 'create', 'primary', '', 'plus'))}${metrics()}
  <section class="card"><div class="tabs"><button class="tab ${filter === 'all' ? 'active' : ''}" data-filter="all">全部环境<span>${environments.length}</span></button><button class="tab ${filter === 'running' ? 'active' : ''}" data-filter="running">正在运行<span>${environments.filter(e => e.state === '运行中').length}</span></button><button class="tab ${filter === 'issues' ? 'active' : ''}" data-filter="issues">需要处理<span>${environments.filter(e => e.state === '代理异常' || e.sync === '同步失败').length}</span></button></div>
  ${empty ? `<div class="empty">${icon('browser')}<h2>创建你的第一个浏览器环境</h2><p>为一个业务建立独立会话。名称、分组和代理可在创建时设置。</p>${btn('创建第一个环境', 'create', 'primary', '', 'plus')}</div>` : `<div class="table-toolbar"><label class="search-field">${icon('search')}<input id="env-search" aria-label="搜索环境名称、编号或负责人" placeholder="搜索环境名称、编号或负责人" value="${escapeHTML(searchTerm)}"></label><select class="filter" id="group-filter" aria-label="筛选业务分组"><option ${groupFilter === '全部分组' ? 'selected' : ''}>全部分组</option>${groupOptions}</select><select class="filter" id="environment-sort" aria-label="环境排序"><option value="recent" ${environmentSort === 'recent' ? 'selected' : ''}>最近启动优先</option><option value="name" ${environmentSort === 'name' ? 'selected' : ''}>名称排序</option></select>${btn('重置', 'reset-filters', 'text small', 'id="environment-reset"')}<span class="toolbar-note">最近启动优先 · 共 ${total} 个匹配环境</span></div><div class="table-wrap"><table class="env-table"><thead><tr><th style="width:38px"><input type="checkbox" id="select-all" aria-label="选择当前筛选下的全部环境"></th><th>环境名称</th><th>代理与地区</th><th>负责人</th><th>同步状态</th><th>运行状态</th><th>最近使用</th><th>操作</th></tr></thead><tbody id="env-rows">${environmentRows()}</tbody></table></div><div class="bulkbar" id="bulkbar" ${selected.size ? '' : 'hidden'}><span id="selected-count">已选择 ${selected.size} 个环境</span>${btn('批量打开', 'bulk-launch', 'small', 'id="bulk-open-environments"')}${btn('批量关闭', 'bulk-close', 'small', 'id="bulk-close-environments"')}${btn('取消选择', 'clear-selection', 'text small')}</div><div class="table-footer"><span id="row-count">显示 ${Math.min(environmentPageSize, total)} 个环境 · 共 ${environments.length} 个</span><span>20 条 / 页</span>${pagination}</div>`}</section><p class="below-note">${icon('lock')}环境间隔离数据；同一环境内的网页标签共享登录会话。修改模板不会改变已有环境的指纹快照。</p>`
}
function createPage() {
  const title = wizardStep === 1 ? '为新业务建立一个独立空间' : wizardStep === 2 ? '选择网络方式，按需配置代理' : '检查指纹配置并创建'
  const subtitle = wizardStep === 1 ? '给环境一个便于识别的名称，再选择业务分组与保存方式。' : wizardStep === 2 ? '默认不使用代理，可以直接继续。启用代理后，创建时会检查真实连接，失败时不会改为直连。' : '推荐模板按宿主与运行时能力校验，创建后保存为稳定快照。'
  const proxy = draft.proxy || { mode: 'direct', server: '', username: '', password: '' }
  const proxyLabel = proxy.mode === 'direct' ? '直连（不使用代理）' : proxy.server || '待填写代理地址'
  let fields = ''
  if (wizardStep === 1) fields = `<label class="field"><span>环境名称<span class="required">*</span></span><input name="name" required maxlength="80" value="${escapeHTML(draft.name)}" placeholder="例如：美国旗舰店 · 运营"><small>用业务和用途命名，便于团队找到正确环境。</small></label><div class="form-row"><label class="field"><span>业务分组</span><select name="group">${groupNames().map(g => `<option ${g === draft.group ? 'selected' : ''}>${escapeHTML(g)}</option>`).join('')}</select></label><label class="field"><span>负责人</span><select><option>林沐（我）</option><option>陈悦</option><option>王宁</option></select></label></div><label class="field"><span>启动网址</span><input type="url" value="${escapeHTML(draft.url)}" name="url"><small>示例网址，可在创建后修改。</small></label><div class="form-divider"></div><label class="field"><span>环境数据保存方式</span></label><div class="radio-cards"><label class="radio-card"><input name="storage" type="radio" value="local" ${draft.storage === 'local' ? 'checked' : ''}><span>仅本地<small>数据保存在这台设备上，不上传登录会话。</small></span></label><label class="radio-card"><input name="storage" type="radio" value="cloud" ${draft.storage === 'cloud' ? 'checked' : ''}><span>启用云同步<small>供授权成员交接；跨系统恢复需要兼容性检查。</small></span></label></div><div class="notice">${icon('shield')}新环境默认仅负责人和管理员可以访问，可在创建后调整授权。</div>`
  if (wizardStep === 2) fields = `<label class="field"><span>网络方式（代理可选）</span><select name="proxyMode" id="wizard-proxy-mode">${[['direct', '不使用代理（默认）'], ['http', 'HTTP / HTTPS 代理'], ['socks5', 'SOCKS5 代理']].map(([value, label]) => `<option value="${value}" ${proxy.mode === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label>${proxy.mode === 'direct' ? `<div class="notice">${icon('globe')}使用本机网络，无需选择代理或检查代理连接。</div>` : `<label class="field"><span>代理地址<span class="required">*</span></span><input name="proxyServer" type="url" required value="${escapeHTML(proxy.server)}" placeholder="${proxy.mode === 'socks5' ? 'socks5://服务器地址:端口' : 'http://服务器地址:端口'}" spellcheck="false"><small>填写真实代理地址和端口，不在地址中填写账户或密码。</small></label><div class="form-row"><label class="field"><span>代理账户（可选）</span><input name="proxyUsername" value="${escapeHTML(proxy.username)}" autocomplete="off"></label><label class="field"><span>代理密码（可选）</span><input name="proxyPassword" type="password" value="${escapeHTML(proxy.password)}" autocomplete="new-password"></label></div><div class="notice warning">${icon('alert')}代理会保存在环境快照中并用于真实网页请求。连接失败时不会自动使用本机网络。</div>`}<div class="form-divider"></div><div class="notice">${icon('fingerprint')}语言与时区沿用默认指纹模板，不会根据代理地址自动推断。</div><div class="notice warning">${icon('alert')}网络出口位置尚未验证。创建后请在同一环境中检查公网 IP 地理位置，并将语言、地区和时区作为一组校验；代理地址本身不能证明出口所在地区。</div>`
   if (wizardStep === 3) fields = renderFingerprintFields()
   return `${heading('新建浏览器环境', '三步完成创建。先明确业务，再确认网络与指纹配置。', btn('取消创建', 'cancel-create'))}<div class="steps">${['基本信息', '网络与代理', '指纹配置'].map((label, i) => `${i ? '<div class="step-line"></div>' : ''}<div class="step ${wizardStep === i + 1 ? 'active' : wizardStep > i + 1 ? 'done' : ''}"><i>${wizardStep > i + 1 ? icon('check') : i + 1}</i>${label}</div>`).join('')}</div><div class="form-layout"><form class="card" id="wizard-form"><div class="form-content"><div class="form-intro"><h2>${title}</h2><p>${subtitle}</p></div>${fields}</div><div class="form-footer">${wizardStep > 1 ? btn('上一步', 'wizard-back', '', 'type="button"', 'left') : '<small>必填项已标注 *</small>'}<button class="button primary" type="submit">${wizardStep === 3 ? '创建环境' : '保存并继续'}${icon('arrow')}</button></div></form><aside class="card summary-card"><h3>创建预览</h3><div class="summary-item"><span>环境名称</span><b id="preview-name">${escapeHTML(draft.name)}</b></div><div class="summary-item"><span>所属分组</span><b>${draft.group}</b></div><div class="summary-item"><span>保存方式</span><b>${draft.storage === 'cloud' ? '云同步（用户启用）' : '仅本地'}</b></div><div class="summary-item"><span>网络方式</span><b id="preview-proxy">${escapeHTML(proxyLabel)}</b></div><div class="summary-item"><span>指纹摘要</span><b id="preview-fingerprint">${draft.fingerprint ? `${draft.fingerprint.locale.language} · ${draft.fingerprint.hardware.platform} · ${draft.fingerprint.screen.width} × ${draft.fingerprint.screen.height}` : '正在生成'}</b></div><div class="summary-feature"><span>${icon('browser')}</span><div><b>独立登录会话</b><p>Cookie、缓存与业务数据归属于当前环境。</p></div></div><div class="summary-feature"><span>${icon('fingerprint')}</span><div><b>稳定的指纹快照</b><p>重新打开继续使用原快照，不因模板更新而变化。</p></div></div><div class="summary-feature"><span>${icon('users')}</span><div><b>按需授权成员</b><p>仅获授权成员可访问，敏感导出权限单独管理。</p></div></div><p class="summary-note">创建时保存并应用所选网络和指纹设置；代理连接失败时不会自动改为直连。</p></aside></div>`
}
function proxiesPage() {
  const items = [['美国静态代理 03', 'HTTP', '美国 · 纽约', '198.51.100.24:8080', '126 ms', '2', '可用'], ['英国业务代理 01', 'SOCKS5', '英国 · 伦敦', '203.0.113.56:1080', '158 ms', '1', '可用'], ['法国内容代理 02', 'HTTP', '法国 · 巴黎', '192.0.2.18:8080', '—', '1', '连接失败'], ['德国客服代理 01', 'HTTP', '德国 · 柏林', '203.0.113.80:8080', '142 ms', '1', '可用'], ['日本内容代理 01', 'SOCKS5', '日本 · 东京', '192.0.2.46:1080', '86 ms', '1', '可用']]
  return `${heading('代理资源', '统一管理网络出口，按环境绑定。代理凭据不会显示给未授权成员。', btn('批量导入', 'import-proxies', '', '', 'upload') + btn('添加代理', 'add-proxy', 'primary', '', 'plus'))}<div class="notice warning" style="margin-bottom:24px">${icon('alert')}1 个代理连接异常，相关环境的启动已阻止。最后检查于今天 09:21。${btn('查看诊断', 'diagnostic', 'text small', 'data-id="QJ-1003"')}</div><section class="card"><div class="card-head"><h2>代理列表 <span class="tiny-tag">5 个资源</span></h2>${btn('检查全部连接', 'check-all-proxies', 'small', '', 'sync')}</div><div class="table-wrap"><table><thead><tr><th>代理名称 / 类型</th><th>出口地区</th><th>地址</th><th>响应延迟</th><th>已绑定环境</th><th>检测结果</th><th>操作</th></tr></thead><tbody>${items.map((p, i) => `<tr><td><div class="env-name"><span class="env-logo">${icon('globe')}</span><div><b style="font-size:12px;font-weight:500">${p[0]}</b><span class="cell-sub">${p[1]} · 密码已隐藏</span></div></div></td><td>${p[2]}</td><td class="mono">${p[3]}</td><td>${p[4]}</td><td>${p[5]} 个</td><td>${badge(p[6], i === 2 ? 'orange' : 'green')}</td><td>${btn(i === 2 ? '诊断' : '检查', i === 2 ? 'diagnostic' : 'check-single-proxy', 'small', 'data-id="QJ-1003"')}</td></tr>`).join('')}</tbody></table></div><div class="table-footer">连接结果为设计演示，所有 IP 使用文档保留地址。<span>检测结果不等于长期可用性</span></div></section><div class="settings-grid stack-gap"><section class="card card-body"><h3>批量导入前先预览</h3><p class="summary-note">支持协议、地址与认证字段的格式校验，重复项和错误行逐项标记。确认之前不写入代理资源。</p>${btn('查看导入流程', 'import-proxies', 'text small')}</section><section class="card card-body"><h3>连接失败的默认行为</h3><p class="summary-note">不静默切换到本机网络。更换代理后需重新检查，再打开相关环境。</p>${badge('阻止直连', 'blue')}</section></div>`
}
function membersPage() {
  return `${heading('团队成员', '把正确的环境交给正确的人。成员角色与业务范围分别管理。', btn('邀请成员', 'invite', 'primary', '', 'plus'))}<section class="card"><div class="invite-banner"><span class="metric-icon">${icon('users')}</span><div><b style="font-size:13px">5 / 10 个成员席位</b><p>待接受的邀请占用席位。离职成员可停用并撤销后续访问。</p></div><a class="button small" href="#billing">查看席位用量</a></div><div class="table-wrap"><table><thead><tr><th>成员</th><th>角色</th><th>可访问范围</th><th>最近活跃</th><th>状态</th><th>操作</th></tr></thead><tbody>${members.map((m, i) => `<tr><td><div class="person"><span class="avatar ${i === 2 ? 'purple' : 'blue'}">${escapeHTML(m[0][0])}</span><div><b style="font-size:12px;font-weight:500">${escapeHTML(m[0])}</b><span class="cell-sub">${escapeHTML(m[1])}</span></div></div></td><td>${m[2]}</td><td>${m[3]}</td><td style="color:var(--muted);font-size:11px">${m[4]}</td><td>${badge(m[5], m[5] === '有效' ? 'green' : 'orange')}</td><td>${i === 0 ? '<span class="tiny-tag">当前账号</span>' : btn(m[5] === '有效' ? '管理授权' : '查看邀请', 'permissions', 'small', `data-index="${i}"`)}</td></tr>`).join('')}</tbody></table></div></section><div class="settings-grid stack-gap"><section class="card card-body"><h3>角色控制操作，授权控制范围</h3><p class="summary-note">管理员可以管理成员和环境；操作者只能运行获授权环境；只读成员不能启动环境或读取凭据。计费与所有权由所有者管理。</p></section><section class="card card-body"><h3>敏感导出单独授权</h3><p class="summary-note">默认不授予 Cookie 与代理凭据导出权限。权限变更会写入操作记录；已复制的本地数据无法保证远程抹除。</p></section></div>`
}
function auditPage() {
  const events = [['09:42:18', '林沐', '打开环境', '美国旗舰店 · 主账号', '本机客户端', '成功'], ['09:36:05', '陈悦', '提交同步版本', '英国品牌店 · 运营', '上海办公电脑', '成功'], ['09:21:44', '王宁', '检查代理', '法国内容代理 02', '本机客户端', '连接失败'], ['09:18:12', '周禾', '打开环境', '德国业务 · 客服', '客服工作电脑', '成功'], ['昨天 18:40', '林沐', '邀请成员', '赵晨 · 只读成员', '本机客户端', '邀请已发送'], ['昨天 17:52', '王宁', '提交同步版本', '日本品牌 · 内容', '本机客户端', '上传失败'], ['昨天 16:35', '陈悦', '关闭环境', '加拿大业务 · 运营', '上海办公电脑', '成功']]
  return `${heading('操作记录', '查看成员、设备与环境的操作结果，追踪异常和权限变更。', btn('导出脱敏记录', 'export-audit', '', '', 'download'))}<section class="card"><div class="table-toolbar"><span class="tiny-tag">今天及昨天</span><span class="tiny-tag">全部成员</span><span class="tiny-tag">全部操作类型</span>${btn('筛选记录', 'audit-filters', 'small')}<span class="toolbar-note">时间按当前工作空间时区显示</span></div><div class="table-wrap"><table><thead><tr><th>时间</th><th>操作成员</th><th>操作类型</th><th>操作对象</th><th>设备</th><th>结果</th></tr></thead><tbody>${events.map(e => `<tr><td class="mono">${e[0]}</td><td><span class="person"><span class="avatar">${e[1][0]}</span>${e[1]}</span></td><td>${e[2]}</td><td>${e[3]}</td><td style="color:var(--muted);font-size:11px">${e[4]}</td><td><span class="audit-result ${e[5].includes('失败') ? 'warning' : ''}">${e[5]}</span></td></tr>`).join('')}</tbody></table></div><div class="table-footer">演示 7 条操作记录<span>保留范围与期限以正式套餐说明为准</span></div></section><p class="below-note">${icon('shield')}记录不包含代理密码、Cookie、网页正文和完整浏览历史。导出需要专门权限。</p>`
}
function billingPage() {
  const plans = [['个人版', '独立业务，轻松开始', '99', ['50 个环境', '1 个成员席位', '本地环境与稳定快照', '基础诊断与安全升级'], '选择个人版'], ['团队版', '多人成员，有序交接', '299', ['300 个环境', '10 个成员席位', '分组授权与操作记录', '10 GB 云同步空间'], '当前演示套餐'], ['成长版', '更大规模的运营团队', '899', ['1,000 个环境', '30 个成员席位', '30 GB 云同步空间', '接口权限与优先支持'], '查看升级方案']]
  return `${heading('订阅与用量', '清楚了解每一项配额，再选择适合团队的方案。', btn('查看账单', 'invoices'))}<div class="notice warning" style="margin-bottom:22px">${icon('alert')}以下价格、配额、期限均为设计占位，尚未成为正式报价。代理流量不包含在这些示例套餐中。</div><section class="card billing-current"><div><div class="eyebrow">当前演示订阅</div><h2>团队版 ${badge('有效', 'green')}</h2><p>按月订阅 · 示例到期日期 2026-11-03<br>降级与到期不会删除本地环境。</p></div><div class="billing-usage"><div><small>环境</small><b>${environments.length}<span> / 300</span></b></div><div><small>成员席位</small><b>${members.length}<span> / 10</span></b></div><div><small>同步空间</small><b>1.2<span> / 10 GB</span></b></div></div></section><div class="plan-grid">${plans.map((p, i) => `<section class="card plan ${i === 1 ? 'featured' : ''}">${i === 1 ? '<span class="plan-label">适合团队</span>' : ''}<h2>${p[0]}</h2><p>${p[1]}</p><div class="price">¥${p[2]}<span> / 工作空间 / 月</span></div><p>仅为布局演示，正式定价待验证</p><ul>${p[3].map(x => `<li>${icon('check')}${x}</li>`).join('')}</ul>${i === 1 ? '<button class="button soft" disabled>当前演示套餐</button>' : btn(p[4], 'plan-preview', i === 2 ? 'primary' : '', `data-plan="${p[0]}"`)}</section>`).join('')}</div><div class="settings-grid stack-gap"><section class="card card-body"><h3>配额的计算方式</h3><p class="summary-note">待接受邀请占用成员席位；环境删除后的回收站计数规则需要在正式套餐说明中确认。云同步空间只计算已启用同步的环境。</p></section><section class="card card-body"><h3>到期、超限和降级</h3><p class="summary-note">保留本地数据和导出能力；已打开窗口可以安全关闭。超限时限制新增，降级前先预览受影响项目。</p></section></div>`
}
function settingsPage() {
  return `${heading('客户端设置', '管理这台设备的存储、更新与诊断，不影响团队其他成员的本机设置。')}<div class="settings-grid"><div><section class="card"><div class="card-head"><h2>本机与数据</h2><span class="tiny-tag">演示设备</span></div><div class="setting-row"><div><b>设备名称</b><p>运营工作电脑 · Windows x64（演示）</p></div>${btn('编辑', 'device-name', 'small')}</div><div class="setting-row"><div><b>环境数据保存位置</b><p>系统应用数据目录 · 不依赖项目源码路径</p></div>${btn('迁移预览', 'migration', 'small')}</div><div class="setting-row"><div><b>关闭环境前创建恢复点</b><p>完成一致性检查后再保存，磁盘不足时给出提醒。</p></div><button class="switch on" data-action="toggle" role="switch" aria-checked="true" aria-label="关闭环境前创建恢复点"><i></i></button></div><div class="setting-row"><div><b>首次运行环境时检查代理</b><p>连接失败会阻止启动，不静默切换本机网络。</p></div><span class="status blue">默认开启</span></div></section><section class="card stack-gap"><div class="card-head"><h2>更新与诊断</h2></div><div class="setting-row"><div><b>稳定版更新通道</b><p>运行中的环境关闭后再安装；更新前保留迁移备份。</p></div>${btn('检查更新', 'updates', 'small')}</div><div class="setting-row"><div><b>导出诊断包</b><p>导出前预览内容，不包含 Cookie 或代理密码。</p></div>${btn('预览诊断', 'diagnostic-export', 'small')}</div><div class="setting-row"><div><b>减少界面动效</b><p>自动跟随系统偏好。</p></div><span class="tiny-tag">跟随系统</span></div></section></div><aside><section class="card card-body"><div class="metric-icon">${icon('shield')}</div><h2 style="margin-top:18px">能力以实际内核为准</h2><p class="summary-note">定制运行时、浏览器内核与模板支持需要分别显示。当前原型没有连接运行时，不能验证本机指纹能力。</p><div class="summary-item"><span>应用版本</span><b>商业版设计稿</b></div><div class="summary-item"><span>实际运行时</span><b>未连接</b></div><div class="summary-item"><span>指纹能力检查</span><b>待实机验证</b></div>${btn('查看版本规划', 'version-plan', 'text small')}</section><section class="card card-body stack-gap"><h3>常用快捷键</h3><div class="summary-item"><span>全局搜索</span><b>Ctrl / ⌘ + K</b></div><div class="summary-item"><span>创建环境</span><b>Ctrl / ⌘ + N</b></div><div class="summary-item"><span>浏览器地址栏</span><b>Ctrl / ⌘ + L</b></div></section></aside></div><div class="release-grid">${[['Windows x64', '干净系统安装、签名与升级迁移', 'monitor'], ['macOS · Intel', '原生 x64 运行时、签名与公证', 'monitor'], ['macOS · Apple Silicon', '原生 arm64 实机运行、签名与公证', 'monitor']].map(p => `<section class="card release-card">${icon(p[2])}<h3>${p[0]}</h3><p>${p[1]}</p>${badge('商业交付待实施', 'blue')}</section>`).join('')}</div>`
}
function browserPage() {
  const e = currentEnvironment
  return `${heading('环境浏览器', '同一业务环境内可打开多个网页标签；不同环境的会话互相隔离。', btn('返回环境列表', 'return-env', '', '', 'left'))}<div class="browser-surface"><div class="browser-envbar"><div>${icon('browser')}<strong>${escapeHTML(e.name)}</strong><span class="chip">${e.id}</span></div><div>${badge('独立会话', 'green')}<span>${e.country} · ${e.ip}</span></div></div><div class="browser-tabs"><button class="browser-tab active" data-action="browser-tab" data-tab="业务概览">${icon('grid')}业务概览 ${icon('close')}</button><button class="browser-tab" data-action="browser-tab" data-tab="订单管理">${icon('file')}订单管理 ${icon('close')}</button><button class="browser-tab" data-action="browser-tab" data-tab="帮助中心">${icon('help')}帮助中心 ${icon('close')}</button><button class="icon-button" aria-label="新建网页标签" data-action="new-browser-tab">${icon('plus')}</button></div><form class="browser-address" id="address-form"><button class="icon-button" aria-label="浏览器后退" type="button" data-action="browser-back">${icon('left')}</button><button class="icon-button" aria-label="刷新演示内容" type="button" data-action="browser-refresh">${icon('sync')}</button><label class="address-input">${icon('lock')}<input id="browser-address" aria-label="浏览器地址" value="https://example.com/workspace" spellcheck="false"><span class="tiny-tag">演示页面</span></label><button class="icon-button" aria-label="下载管理" type="button" data-action="downloads">${icon('download')}</button><button class="icon-button" aria-label="站点权限" type="button" data-action="site-permissions">${icon('shield')}</button></form><div class="browser-content"><div class="website-title"><div><div class="eyebrow">示例业务后台</div><h2 id="website-title">业务概览</h2><p>这是产品设计中的示例页面，不会访问真实站点。</p></div><span class="tiny-tag">今天 · 2026 年 10 月 3 日</span></div><div class="browser-widgets"><div class="browser-widget"><small>今日订单</small><b>128</b><p>较昨日增加 12.3% · 示例</p></div><div class="browser-widget"><small>待处理订单</small><b>24</b><p>团队处理中 · 示例</p></div><div class="browser-widget"><small>客户咨询</small><b>16</b><p>最近 24 小时 · 示例</p></div></div><section class="card card-body stack-gap"><h3>最近七天的订单趋势</h3><div class="order-bars" aria-label="示例订单趋势图">${[35, 48, 42, 57, 65, 58, 82, 72, 91, 79, 94, 100].map(h => `<i style="height:${h}%"></i>`).join('')}</div><div class="table-footer" style="padding:10px 0 0;border:0">9 月 27 日 <span>10 月 3 日</span></div></section></div><div class="browser-summary"><span>${icon('shield')} 本环境标签共享 Cookie 与登录状态</span><span>代理检查：演示通过 · 同步：${e.sync} · 站点权限：按需询问</span></div></div><p class="below-note">${icon('fingerprint')}目标交互设计：一个环境一个浏览器窗口，窗口内多网页标签；现有 Demo 的独立标签数据将分别保留为环境。</p>`
}
function detailDate (timestamp) {
  if (!timestamp) return '暂无记录'
  const date = new Date(timestamp)
  return Number.isNaN(date.getTime()) ? '暂无记录' : date.toLocaleString('zh-CN', { hour12: false })
}

function fingerprintDetail (environment) {
  const fingerprint = environment.raw?.fingerprint || {}
  const browser = fingerprint.browser || {}
  const locale = fingerprint.locale || {}
  const hardware = fingerprint.hardware || {}
  const screen = fingerprint.screen || {}
  const graphics = fingerprint.graphics || {}
  const noise = fingerprint.noise || {}
  const modules = fingerprint.modules || {}
  const moduleLabels = { ua: '用户代理', clientHints: '客户端提示', locale: '语言', timezone: '时区', navigator: '设备', screen: '屏幕', webgl: '图形', canvas: '画布', audio: '音频', fonts: '字体', webrtc: 'WebRTC', runtimeInspector: '调试器兼容' }
  const enabledModules = Object.entries(modules).filter(([, enabled]) => enabled).map(([key]) => moduleLabels[key] || key)
  return `<div class="detail-kv"><span>配置版本</span><b>${escapeHTML(environment.profileRevision)}</b><span>浏览器内核</span><b>${escapeHTML(`${browser.family || 'Chrome'} · ${browser.chromiumMajor || '未知'} ${browser.userAgent ? '· 自定义 UA' : '· 默认 UA'}`)}</b><span>语言与时区</span><b>${escapeHTML(`${locale.language || '未设置'} · ${locale.timezone || '未设置'}`)}</b><span>语言列表</span><b>${escapeHTML((locale.languages || []).join('、') || '未设置')}</b><span>平台与硬件</span><b>${escapeHTML(`${hardware.platform || '未设置'} · ${hardware.hardwareConcurrency || '未知'} 线程 · ${hardware.deviceMemory || '未知'} GiB`)}</b><span>屏幕</span><b>${escapeHTML(`${screen.width || '未知'} × ${screen.height || '未知'} · 缩放 ${screen.deviceScaleFactor || '未知'}`)}</b><span>图形</span><b>${escapeHTML(`${graphics.webglVendor || '使用原生值'} · ${graphics.webglRenderer || '使用原生值'}`)}</b><span>噪声种子</span><b class="mono">${escapeHTML(noise.seed || '未设置')}</b><span>启用模块</span><b>${escapeHTML(enabledModules.join('、') || '无')}</b></div><div class="notice">${icon('fingerprint')}指纹快照来自该环境创建时保存的配置；修改模板不会改变此快照。</div>`
}

function activityDetail (environment) {
  const raw = environment.raw || {}
  const events = [{ time: raw.createdAt, title: '环境记录创建', detail: `来源配置修订 ${raw.profileRevision || '未知'}，创建地址为 ${raw.creationUrl || 'about:blank'}` }]
  if (raw.updatedAt && raw.updatedAt !== raw.createdAt) events.unshift({ time: raw.updatedAt, title: '环境记录最近更新', detail: `当前状态：${raw.status === 'open' ? '运行中' : '已关闭'}，元数据修订 ${raw.metadataRevision || 1}` })
  return `<div class="activity-list">${events.map(event => `<div class="activity"><i class="timeline-dot"></i><div><b>${escapeHTML(event.title)}</b><p>${escapeHTML(detailDate(event.time))} · ${escapeHTML(event.detail)}</p></div></div>`).join('')}</div><div class="notice">${icon('clock')}这里展示本地环境记录中的创建和更新时间；详细操作审计将在本地审计模块接通后显示。</div>`
}

function detailDrawer (e, diagnostic = false) {
  if (!e) return `<div class="backdrop" data-dismiss="drawer"><section class="drawer" role="dialog" aria-modal="true"><div class="drawer-body"><div class="empty"><h2>找不到浏览器环境</h2><p>该环境可能已被删除，请刷新环境列表。</p></div></div><div class="drawer-footer">${btn('关闭', 'close-overlay', 'primary')}</div></section></div>`
  const raw = e.raw || {}
  const proxy = raw.proxy || { mode: 'direct', server: '' }
  const fail = e.sync === '同步失败'
  const tabs = [['overview', '概览'], ['fingerprint', '指纹快照'], ['activity', '活动']].map(([tab, label]) => `<button class="tab ${detailTab === tab ? 'active' : ''}" data-action="detail-tab" data-tab="${tab}">${label}</button>`).join('')
  const overview = `<div class="detail-banner">${badge(e.state, e.state === '运行中' ? 'green' : '')}<span class="muted" style="font-size:10px">最近更新：${escapeHTML(detailDate(raw.updatedAt))}</span></div><h3>基本信息</h3><div class="detail-kv"><span>所属分组</span><b>${escapeHTML(e.group)}</b><span>保存方式</span><b>${escapeHTML(e.sync)}</b><span>创建地址</span><b class="mono">${escapeHTML(raw.creationUrl || 'about:blank')}</b><span>最近访问</span><b class="mono">${escapeHTML(raw.lastUrl || 'about:blank')}</b><span>代理</span><b>${escapeHTML(proxy.mode === 'direct' ? '直连（不使用代理）' : proxy.server || '已配置但地址未知')}</b><span>业务修订</span><b>${escapeHTML(raw.metadataRevision || 1)}</b><span>数据目录</span><b class="mono">${escapeHTML(raw.dataDir || '未记录')}</b></div><h3>同步与交接</h3><div class="notice ${fail ? 'warning' : 'success'}">${icon(fail ? 'alert' : 'checkCircle')}${fail ? '本机版本已保存，云端版本未接通，当前不会伪装为同步成功。' : e.sync === '仅本地' ? '本地环境不上传登录数据。' : '云同步接口尚未接通，当前数据仍保存在本机。'}</div>`
  const diagnosticBody = `<div class="notice error">${icon('alert')}当前环境没有启动成功，未使用本机网络回退。请检查代理配置或网页地址后重试。</div><h3>本地记录</h3><div class="detail-kv"><span>环境状态</span><b>${escapeHTML(e.state)}</b><span>代理</span><b>${escapeHTML(proxy.mode === 'direct' ? '直连' : proxy.server || '未配置')}</b><span>创建地址</span><b class="mono">${escapeHTML(raw.creationUrl || 'about:blank')}</b><span>数据处理</span><b>环境目录与指纹快照已保留</b></div>`
  const body = diagnostic ? diagnosticBody : detailTab === 'fingerprint' ? `<h3>创建时指纹快照</h3>${fingerprintDetail(e)}` : detailTab === 'activity' ? `<h3>本地环境活动</h3>${activityDetail(e)}` : overview
  const footer = diagnostic ? btn('关闭', 'close-overlay') + btn('重新检查', 'retry-diagnostic', 'primary') : e.state === '运行中' ? btn('关闭环境', 'close-env', '', `data-id="${e.id}"`, 'stop') + btn('进入环境', 'launch', 'primary', `data-id="${e.id}"`, 'play') : btn('关闭详情', 'close-overlay') + btn('打开环境', 'launch', 'primary', `data-id="${e.id}"`, 'play')
  return `<div class="backdrop" data-dismiss="drawer"><section class="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title"><div class="drawer-head"><span class="env-logo ${e.color}">${escapeHTML(e.letter)}</span><div><h2 id="drawer-title">${diagnostic ? '环境启动诊断' : escapeHTML(e.name)}</h2><p>${escapeHTML(e.id)} · ${escapeHTML(e.group)}</p></div><button class="icon-button" aria-label="关闭详情" data-action="close-overlay">${icon('close')}</button></div>${diagnostic ? '' : `<div class="tabs">${tabs}</div>`}<div class="drawer-body">${body}</div><div class="drawer-footer">${footer}</div></section></div>`
}function toast(message) {
  clearTimeout(toastTimer)
  const node = document.getElementById('toast')
  node.textContent = message
  node.classList.add('show')
  toastTimer = setTimeout(() => node.classList.remove('show'), 4200)
}
function showOverlay(html) {
  lastFocus = document.activeElement
  document.getElementById('overlay-root').innerHTML = html
  document.body.style.overflow = 'hidden'
  const focus = document.querySelector('#overlay-root input, #overlay-root button, #overlay-root select')
  if (focus) focus.focus()
}
function closeOverlay() {
  document.getElementById('overlay-root').innerHTML = ''
  document.body.style.overflow = ''
  if (lastFocus && lastFocus.isConnected) lastFocus.focus()
}
function dialog(title, body, footer = btn('知道了', 'close-overlay', 'primary')) {
  showOverlay(`<div class="dialog-backdrop" data-dismiss="dialog"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div class="card-head"><h2 id="dialog-title">${title}</h2><button class="icon-button" aria-label="关闭对话框" data-action="close-overlay">${icon('close')}</button></div><div class="card-body">${body}</div><div class="form-footer"><span></span><div class="actions">${footer}</div></div></section></div>`)
}
function onboarding() {
  showOverlay(`<div class="dialog-backdrop"><section class="dialog onboarding" role="dialog" aria-modal="true" aria-labelledby="onboarding-title"><div class="onboarding-grid"><div class="onboarding-story"><span class="brand-mark">${icon('fingerprint')}</span><h2>一个工作空间，<br>有序开展业务。</h2><p>从本地开始，按需邀请同事和开启云同步。</p><ul><li>每个业务保留独立会话</li><li>团队成员按授权访问</li><li>异常可诊断，数据可恢复</li></ul></div><form class="onboarding-form" id="onboarding-form"><h2 id="onboarding-title">设置你的工作空间</h2><p>这是首次使用流程演示，不会创建真实账号。</p><label class="field"><span>工作空间名称<span class="required">*</span></span><input required name="workspace" value="远航出海团队" maxlength="80"></label><label class="field"><span>主要业务</span><select><option>跨境电商与品牌运营</option><option>营销与内容协作</option><option>客户支持</option></select></label><div class="radio-cards"><label class="radio-card"><input type="radio" name="mode" checked><span>先使用本地环境<small>默认不上传登录数据，稍后按需开启同步。</small></span></label></div><button class="button primary" type="submit">开始创建首个环境 ${icon('arrow')}</button><button class="button text" type="button" data-action="close-overlay" style="margin-top:10px">稍后设置</button></form></div></section></div>`)
}
function render() {
  closeOverlay()
  route = location.hash.slice(1) || 'overview'
  const parent = ['create', 'detail', 'diagnostic', 'empty', 'browser'].includes(route) ? 'environments' : route === 'onboarding' ? 'overview' : route
  document.getElementById('navigation').innerHTML = navItems.map(([id, title, symbol]) => `<a class="nav-link ${id === parent ? 'active' : ''}" href="#${id}" ${id === parent ? 'aria-current="page"' : ''}>${icon(symbol)}<span>${title}</span>${id === 'proxies' ? '<span class="nav-count">1</span>' : ''}</a>`).join('')
  document.getElementById('breadcrumb').textContent = (navItems.find(n => n[0] === parent) || navItems[0])[1]
  document.getElementById('sidebar-quota').textContent = `${environments.length} / 300`
  const views = { overview, environments: environmentPage, create: createPage, proxies: proxiesPage, members: membersPage, audit: auditPage, billing: billingPage, settings: settingsPage, browser: browserPage, detail: environmentPage, diagnostic: environmentPage, empty: () => environmentPage(true), onboarding: overview }
  document.getElementById('main').innerHTML = (views[route] || overview)()
  window.scrollTo(0, 0)
  if (route === 'detail') showOverlay(detailDrawer(currentEnvironment))
  if (route === 'diagnostic') showOverlay(detailDrawer(currentEnvironment || environments[0], true))
  if (route === 'onboarding') onboarding()
}
function navigate(next) {
  if (location.hash === `#${next}`) render()
  else location.hash = next
}
function refreshRows() {
  const rows = document.getElementById('env-rows')
  if (!rows) return
  const page = pagedEnvironments()
  rows.innerHTML = environmentRows()
  document.getElementById('row-count').textContent = `显示 ${Math.min(environmentPageSize, page.total)} 个环境 · 共 ${environments.length} 个`
  document.getElementById('selected-count').textContent = `已选择 ${selected.size} 个环境`
  document.getElementById('bulkbar').hidden = selected.size === 0
  document.getElementById('select-all').checked = page.list.length > 0 && page.list.every(e => selected.has(e.id))
}

function showGroupManager () {
  showOverlay(groupManager())
}

async function applyGroupResponse (response) {
  if (!response?.ok) throw new Error(response?.error || '分组操作失败，请重试。')
  groups = response.groups || groups
  if (response.environments) applyEnvironmentSnapshot(response.environments)
}

document.addEventListener('click', event => {
  const target = event.target.closest('[data-action], [data-route], [data-filter], [data-dismiss]')
  if (!target) return
  if (target.dataset.dismiss && event.target === target) return closeOverlay()
  if (target.dataset.route) return navigate(target.dataset.route)
  if (target.dataset.filter) { filter = target.dataset.filter; environmentPageNumber = 1; return render() }
  const action = target.dataset.action
  const e = environments.find(item => item.id === target.dataset.id) || currentEnvironment
  if (target.closest('form') && target.tagName === 'BUTTON' && !target.hasAttribute('type')) event.preventDefault()
  switch (action) {
    case 'create': void startCreateWizard(); break
    case 'manage-groups': showGroupManager(); break
    case 'edit-environment-group': {
      if (!e) return toast('找不到该环境，请刷新后重试。')
      dialog(`修改“${escapeHTML(e.name)}”的分组`, environmentGroupDialog(e), '<button class="button" type="button" data-action="close-overlay">取消</button><button class="button primary" type="submit" form="environment-group-form">保存修改</button>')
      break
    }
    case 'detail-tab': {
      if (!e) return toast('找不到该环境，请刷新后重试。')
      detailTab = ['overview', 'fingerprint', 'activity'].includes(target.dataset.tab) ? target.dataset.tab : 'overview'
      showOverlay(detailDrawer(e))
      break
    }
    case 'edit-group': {
      const group = groups.find(item => item.id === target.dataset.id)
      if (!group) return toast('找不到该分组，请刷新后重试。')
      dialog('编辑业务分组', `<form id="group-edit-form"><input type="hidden" name="id" value="${escapeHTML(group.id)}"><label class="field"><span>分组名称</span><input name="name" required maxlength="80" value="${escapeHTML(group.name)}"></label></form>`, `<button class="button" type="button" data-action="close-overlay">取消</button><button class="button primary" type="submit" form="group-edit-form">保存修改</button>`)
      break
    }
    case 'delete-group': {
      const group = groups.find(item => item.id === target.dataset.id)
      if (!group || !window.confirm(`确定删除“${group.name}”分组吗？其中的环境会移动到“未分组”。`)) break
      void (async () => {
        try {
          await applyGroupResponse(await window.browserApi.deleteGroup(group.id))
          environmentPageNumber = 1
          closeOverlay()
          render()
          toast('分组已删除，原环境已移动到未分组。')
        } catch (error) { toast(error?.message || '删除业务分组失败，请重试。') }
      })()
      break
    }
    case 'environment-page': environmentPageNumber = Number(target.dataset.page) || 1; return render()
    case 'environment-page-prev': environmentPageNumber--; return render()
    case 'environment-page-next': environmentPageNumber++; return render()
    case 'return-env': case 'cancel-create': closeOverlay(); navigate('environments'); break
    case 'detail': currentEnvironment = e; detailTab = 'overview'; showOverlay(detailDrawer(e)); break
    case 'diagnostic': currentEnvironment = e; showOverlay(detailDrawer(e, true)); break
    case 'close-overlay': closeOverlay(); break
    case 'onboarding': onboarding(); break
    case 'launch': currentEnvironment = e; void launchEnvironment(e); break
    case 'close-env': void closeEnvironment(e); break
    case 'delete-env': confirmEnvironmentDeletion(environments.find(item => item.id === target.dataset.id)); break
    case 'confirm-delete-env': void deleteEnvironment(environments.find(item => item.id === target.dataset.id), target); break
    case 'reset-filters': filter = 'all'; searchTerm = ''; groupFilter = '全部分组'; environmentSort = 'recent'; environmentPageNumber = 1; selected.clear(); render(); break
    case 'clear-selection': selected.clear(); refreshRows(); break
    case 'bulk-launch': void updateSelected('open'); break
    case 'bulk-close': void updateSelected('close'); break
    case 'wizard-back': wizardStep--; render(); break
    case 'regenerate-fingerprint': void regenerateFingerprint(); break
    case 'restore-fingerprint': restoreFingerprint(); break
    case 'retry-diagnostic': toast('当前诊断服务尚未连接，请在代理资源中检查连接后重试。'); break
    case 'open-proxies': navigate('proxies'); break
    case 'retry-sync': toast('同步服务尚未连接，当前环境数据仍保存在本机。'); break
    case 'check-single-proxy': case 'check-all-proxies': toast('演示检查完成：4 个可用、1 个连接失败；未执行真实网络检测。'); break
    case 'invite': dialog('邀请团队成员', `<form id="invite-form"><label class="field"><span>成员姓名</span><input name="name" required maxlength="40" placeholder="例如：赵晨"></label><label class="field"><span>邮箱<span class="required">*</span></span><input name="email" required type="email" placeholder="member@example.com"></label><div class="form-row"><label class="field"><span>成员角色</span><select name="role"><option>操作者</option><option>管理员</option><option>只读成员</option></select></label><label class="field"><span>授权分组</span><select name="group"><option>电商运营</option><option>内容营销</option><option>客户支持</option></select></label></div><div class="notice">${icon('lock')}默认关闭敏感数据导出权限。这是邀请演示，不发送邮件。</div></form>`, btn('取消', 'close-overlay') + '<button class="button primary" type="submit" form="invite-form">创建邀请演示</button>'); break
    case 'permissions': {
      const member = members[Number(target.dataset.index)]
      dialog(`${escapeHTML(member[0])}的访问权限`, `<p>角色：${member[2]}<br>范围：${member[3]}</p><div class="thin-rule"></div><div class="notice">${icon('shield')}可以查看获授权环境的元数据。${member[2] === '只读成员' ? '只读成员不能启动环境。' : '运行环境按角色允许。'} Cookie 与代理凭据导出默认关闭。</div><p style="margin-top:20px">完整的撤权、过期邀请和权限编辑列入团队 Beta 开发；本原型仅演示授权摘要。</p>`); break
    }
    case 'plan-preview': dialog(`确认${target.dataset.plan}的配额口径`, '<p>此处用于评审升级流程。价格、含税方式、扣款周期、环境/席位/空间上限需在正式购买前再次确认。</p><div class="notice warning" style="margin-top:18px">本原型没有接入支付，不会生成订单或扣款。</div>'); break
    case 'invoices': dialog('账单与付款记录', '<p>正式版会显示订单、付款状态、周期、金额、币种与发票入口；支付结果由服务端验证回调确认。</p><div class="info-box">当前没有真实账单。套餐页面的金额均为设计占位。</div>'); break
    case 'search': dialog('搜索环境与功能', `<label class="field"><span>环境关键词</span><input id="global-search-input" placeholder="名称、编号或负责人"></label><p>输入关键词后，前往环境列表查看结果。</p>`, btn('取消', 'close-overlay') + btn('搜索环境', 'perform-search', 'primary', '', 'search')); break
    case 'perform-search': searchTerm = document.getElementById('global-search-input').value; filter = 'all'; groupFilter = '全部分组'; closeOverlay(); navigate('environments'); break
    case 'notifications': filter = 'issues'; navigate('environments'); break
    case 'toggle': { const on = target.getAttribute('aria-checked') !== 'true'; target.classList.toggle('on', on); target.setAttribute('aria-checked', String(on)); toast('已切换演示设置，不影响真实客户端。'); break }
    case 'dashboard-tab': void window.browserApi.showDashboard(); break
    case 'new-default-tab': void createDefaultTab(); break
    case 'environment-tab': void operateUnifiedTab(() => window.browserApi.selectTab(target.dataset.id)); break
    case 'close-environment-tab': void operateUnifiedTab(() => window.browserApi.closeTab(target.dataset.id)); break
    case 'open-devtools': void operateUnifiedTab(() => window.browserApi.openDevToolsTab(activeUnifiedTab()?.id)); break
    case 'browser-tab': document.querySelectorAll('.browser-tab').forEach(tab => tab.classList.toggle('active', tab === target)); document.getElementById('website-title').textContent = target.dataset.tab; break
    case 'new-browser-tab': { const tab = document.createElement('button'); tab.className = 'browser-tab'; tab.dataset.action = 'browser-tab'; tab.dataset.tab = '新标签'; tab.innerHTML = `${icon('browser')}新标签 ${icon('close')}`; target.before(tab); toast('已添加环境内网页标签演示，共享本环境会话。'); break }
    case 'browser-refresh': case 'browser-back': toast('浏览器导航为设计演示，不执行真实页面请求。'); break
    case 'downloads': dialog('当前环境的下载', '<p>暂无下载任务。正式版下载需归属于当前环境，并提供保存位置、取消、失败重试和来源信息。</p>'); break
    case 'site-permissions': dialog('站点权限 · 示例页面', '<p>摄像头、麦克风、定位、通知均按来源与环境询问。不会因为使用指纹浏览器默认允许权限。</p><div class="info-box">本原型没有请求设备权限。</div>'); break
    case 'export-audit': dialog('导出操作记录', '<p>导出字段：时间、成员、设备、操作类型、目标与结果。默认脱敏，不含 Cookie、代理凭据和网页正文。</p><div class="notice" style="margin-top:15px">当前只展示导出预览，没有生成真实审计文件。</div>'); break
    case 'audit-filters': dialog('筛选操作记录', '<p>正式版支持日期范围、成员、操作类型和结果组合筛选。本稿使用固定示例记录，供字段与状态评审。</p>'); break
    case 'import': case 'import-proxies': dialog(action === 'import' ? '导入环境 · 预览流程' : '批量导入代理 · 预览流程', '<p>选择文件 → 校验格式与重复项 → 逐项预览 → 确认导入。失败行保留错误原因，不覆盖已有环境。</p><div class="notice warning" style="margin-top:18px">本稿没有读取用户文件或处理真实凭据。文件导入列入后续开发。</div>'); break
    case 'add-proxy': dialog('添加代理', '<label class="field"><span>代理名称</span><input placeholder="例如：美国静态代理 04"></label><div class="form-row"><label class="field"><span>类型</span><select><option>HTTP</option><option>SOCKS5</option></select></label><label class="field"><span>服务器地址</span><input placeholder="示例地址，不输入真实凭据"></label></div><p>正式版包含认证信息与保存前连接检查。本稿只演示字段布局。</p>'); break
    case 'diagnostic-export': dialog('诊断包内容预览', '<p>应用版本、实际内核版本、设备架构、能力检测结果、脱敏的错误记录。</p><div class="notice success" style="margin-top:18px">不包含登录数据、代理密码、网页正文或系统密钥。</div>'); break
    case 'migration': dialog('数据迁移预览', '<p>正式版先检测原目录与空间，再创建备份。迁移成功并校验后才切换路径，失败继续使用原目录。</p><div class="info-box">当前原型不访问或移动你的真实数据。</div>'); break
    case 'updates': dialog('检查更新', '<p>原型未连接更新服务。正式版需检查产物签名、版本兼容和环境占用，在安全关闭窗口后安装。</p>'); break
    case 'version-plan': dialog('三平台运行时规划', '<p>Windows x64、macOS Intel x64、macOS Apple Silicon arm64 分别构建与实机验证。网页平台字符串不能证明 CPU 架构支持。</p><div class="notice warning" style="margin-top:18px">目前没有从原型连接真实运行时，页面不能证明上述商业交付已经完成。</div>'); break
    case 'device-name': dialog('本机设备名称', '<label class="field"><span>设备名称</span><input value="运营工作电脑" maxlength="80"></label><p>这是字段设计预览，不会修改系统设备名称。</p>'); break
    case 'workspace': dialog('切换工作空间', '<p>当前演示工作空间：远航出海团队。</p><div class="info-box">正式版按组织隔离环境、成员、代理与账单，不跨空间自动共享数据。</div>'); break
    case 'help': dialog('帮助与支持', '<p>评审入口：完整开发计划、设计交付规范、关键页面 PNG 和官方竞品资料均保存在本原型所在目录。</p><div class="info-box">本次没有连接客服或发送任何外部消息。</div>'); break
  }
})

document.addEventListener('input', event => {
  if (event.target.id === 'env-search') { searchTerm = event.target.value; environmentPageNumber = 1; refreshRows() }
  if (event.target.name === 'name' && event.target.closest('#wizard-form')) document.getElementById('preview-name').textContent = event.target.value
  if (event.target.dataset.fingerprintPath) {
    const target = event.target
    let value = target.type === 'checkbox' ? target.checked : target.value
    if (target.dataset.fingerprintType === 'number') value = target.value === '' ? '' : Number(target.value)
    if (target.dataset.fingerprintPath === 'browser.userAgent' && value === '') value = null
    if (target.dataset.fingerprintPath === 'locale.languages') value = String(value).split(/[,，]/).map(item => item.trim()).filter(Boolean)
    setFingerprintField(target.dataset.fingerprintPath, value)
  }
  const proxyField = { proxyServer: 'server', proxyUsername: 'username', proxyPassword: 'password' }[event.target.name]
  if (proxyField && event.target.closest('#wizard-form')) {
    draft.proxy[proxyField] = event.target.value
    document.getElementById('preview-proxy').textContent = draft.proxy.server.trim() || '待填写代理地址'
  }
})
document.addEventListener('change', event => {
  const target = event.target
  if (target.id === 'wizard-proxy-mode') { draft.proxy.mode = target.value; render() }
  if (target.id === 'group-filter') { groupFilter = target.value; environmentPageNumber = 1; refreshRows() }
  if (target.id === 'environment-sort') { environmentSort = target.value; environmentPageNumber = 1; refreshRows() }
  if (target.dataset.select) { target.checked ? selected.add(target.dataset.select) : selected.delete(target.dataset.select); refreshRows() }
  if (target.id === 'select-all') { pagedEnvironments().list.forEach(e => target.checked ? selected.add(e.id) : selected.delete(e.id)); refreshRows() }
})
document.addEventListener('submit', async event => {
  event.preventDefault()
  if (event.target.id === 'group-create-form') {
    try {
      const data = new FormData(event.target)
      await applyGroupResponse(await window.browserApi.createGroup(String(data.get('name') || '').trim()))
      showGroupManager()
      toast('业务分组已创建。')
    } catch (error) { toast(error?.message || '创建业务分组失败，请重试。') }
    return
  }
  if (event.target.id === 'group-edit-form') {
    try {
      const data = new FormData(event.target)
      await applyGroupResponse(await window.browserApi.updateGroup({ id: data.get('id'), name: String(data.get('name') || '').trim() }))
      closeOverlay()
      environmentPageNumber = 1
      render()
      toast('业务分组已修改。')
    } catch (error) { toast(error?.message || '修改业务分组失败，请重试。') }
    return
  }
  if (event.target.id === 'environment-group-form') {
    try {
      const data = new FormData(event.target)
      const response = await window.browserApi.updateEnvironmentGroup({ id: data.get('id'), group: data.get('group'), metadataRevision: Number(data.get('revision')) })
      if (!response?.ok) throw new Error(response?.error || '更新环境分组失败，请刷新后重试。')
      applyEnvironmentSnapshot(response.environments)
      closeOverlay()
      render()
      toast('环境分组已更新。')
    } catch (error) { toast(error?.message || '更新环境分组失败，请刷新后重试。') }
    return
  }
  if (event.target.id === 'wizard-form') {
    if (wizardStep === 3 && wizardSubmitting) return
    if (wizardStep === 1) { const data = new FormData(event.target); draft = { ...draft, name: String(data.get('name')).trim(), group: data.get('group'), storage: data.get('storage'), url: String(data.get('url') || 'https://example.com').trim() }; if (!draft.name) { toast('请输入环境名称。'); return } }
    if (wizardStep === 2) {
      const data = new FormData(event.target)
      const mode = data.get('proxyMode')
      draft.proxy = { mode, server: mode === 'direct' ? '' : String(data.get('proxyServer') || '').trim(), username: mode !== 'direct' ? String(data.get('proxyUsername') || '') : '', password: mode !== 'direct' ? String(data.get('proxyPassword') || '') : '' }
      if (mode !== 'direct') {
        try {
          const address = new URL(draft.proxy.server)
          if (!(mode === 'socks5' ? ['socks5:', 'socks5h:'] : ['http:', 'https:']).includes(address.protocol) || !address.hostname || (mode === 'socks5' && !address.port) || address.username || address.password) throw new Error()
        } catch { toast('请填写与所选代理类型一致的有效地址，并在独立字段中填写账户和密码。'); return }
      }
    }
    if (wizardStep < 3) { wizardStep++; render(); return }
    if (wizardStep === 3) wizardSubmitting = true
    try {
      if (!draft.profile || !draft.fingerprint) throw new Error('指纹草稿尚未生成，请稍后重试。')
      const profile = { ...draft.profile, fingerprint: cloneValue(draft.fingerprint) }
      profile.name = draft.name
      profile.group = draft.group
      profile.storage = draft.storage
      profile.url = draft.url || profile.url
      profile.proxy = draft.proxy
      const operationId = crypto.randomUUID()
      const saveResponse = await window.browserApi.saveProfile(profile)
      if (!saveResponse?.ok) throw new Error(saveResponse?.error || '保存浏览器配置失败。')
      profiles = saveResponse.profiles || profiles
      const launchResponse = await window.browserApi.launchProfile({ id: saveResponse.profile.id, url: profile.url, operationId })
      if (!launchResponse?.ok) {
        if (!launchResponse.environmentId) throw new Error(launchResponse.error || '创建浏览器环境失败。')
        closeOverlay()
        navigate('environments')
        await loadRealData(false)
        const launchStateMessage = launchResponse.launchState === 'page-failed' ? '环境已创建并启动，但网页加载失败，可从环境列表重试。' : '环境已创建，但浏览器尚未启动，可从环境列表重试。'
        toast(`${launchResponse.error || '环境启动失败。'} ${launchStateMessage}`)
        return
      }
      const environmentResponse = await window.browserApi.listEnvironments()
      if (!environmentResponse?.ok) throw new Error(environmentResponse?.error || '刷新浏览器环境失败。')
      applyEnvironmentSnapshot(environmentResponse.environments)
      currentEnvironment = environments.find(item => item.raw?.profileId === profile.id || item.raw?.profileName === profile.name) || environments[0] || null
      const createdName = draft.name
      closeOverlay()
      void startCreateWizard()
      toast(`已创建“${createdName}”环境并打开浏览器窗口。`)
    } catch (error) {
      toast(error?.message || '创建浏览器环境失败，请重试。')
    } finally {
      wizardSubmitting = false
    }
  }
  if (event.target.id === 'invite-form') { const data = new FormData(event.target); members.push([String(data.get('name')).trim(), String(data.get('email')).trim(), data.get('role'), data.get('group'), '等待接受邀请', '待接受']); closeOverlay(); render(); toast('已加入邀请演示列表，没有发送邮件。') }
  if (event.target.id === 'onboarding-form') { closeOverlay(); void startCreateWizard(); toast('已完成工作空间设置演示，继续创建首个环境。') }
  if (event.target.id === 'address-form') toast('地址已输入；原型不会访问真实网站。')
})
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeOverlay()
  const dialogNode = document.querySelector('#overlay-root [role="dialog"]')
  if (dialogNode && event.key === 'Tab') {
    const focusable = [...dialogNode.querySelectorAll('button:not(:disabled),input,select,textarea,a[href],summary')]
    const first = focusable[0], last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); document.querySelector('[data-action="search"]').click() }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n' && !dialogNode) { event.preventDefault(); document.querySelector('[data-action="create"]')?.click() }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'l' && route === 'browser') { event.preventDefault(); document.getElementById('browser-address').select() }
})
document.getElementById('unified-navigation').addEventListener('submit', event => {
  event.preventDefault()
  const active = activeUnifiedTab()
  const address = document.getElementById('unified-address')
  if (!active || !address.value.trim()) return
  address.blur()
  void operateUnifiedTab(() => window.browserApi.navigateTab({ id: active.id, action: 'load', url: address.value.trim() }))
})
for (const action of ['back', 'forward', 'reload']) {
  document.getElementById(`unified-${action}`).addEventListener('click', () => {
    const active = activeUnifiedTab()
    if (!active) return
    void operateUnifiedTab(() => window.browserApi.navigateTab({ id: active.id, action }))
  })
}
window.addEventListener('hashchange', render)
window.browserApi.onEnvironmentsChanged(() => { void loadRealData(false) })
window.browserApi.onProfilesChanged(() => { void loadRealData(false) })
window.browserApi.onGroupsChanged(() => { void loadRealData(false) })
window.browserApi.onTabsChanged(renderUnifiedTabs)
document.getElementById('support-icon').innerHTML = icon('help')
document.getElementById('search-icon').innerHTML = icon('search')
document.getElementById('notification-icon').innerHTML = icon('bell')
render()
async function initUnifiedTabs () {
  const response = await window.browserApi.listTabs()
  if (response?.ok) renderUnifiedTabs(response)
}
void initUnifiedTabs()
void loadRealData()
