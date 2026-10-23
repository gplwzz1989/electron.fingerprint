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
  sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/><path d="M5 3v4M3 5h4M19 17v4M17 19h4"/>',
  file: '<path d="M5 3h9l5 5v13H5V3ZM14 3v5h5M8 13h8M8 17h6"/>'
}
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.browser}</svg>`
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))
const btn = (label, action, style = '', extra = '', symbol = '') => `<button class="button ${style}" data-action="${action}" ${extra}>${symbol ? icon(symbol) : ''}${label}</button>`
const badge = (text, color = '') => `<span class="status ${color}"><i class="dot"></i>${text}</span>`
const navItems = [['overview', '工作台', 'grid'], ['environments', '浏览器环境', 'browser'], ['creator', 'AI 创作中心', 'sparkles'], ['proxies', '代理资源', 'globe'], ['members', '团队成员', 'users'], ['audit', '操作记录', 'clock'], ['billing', '订阅与用量', 'wallet'], ['settings', '设置', 'settings']]
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
let environmentEditDraft = null
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

function setFingerprintField (path, value, targetDraft = draft) {
  const keys = path.split('.')
  let target = targetDraft.fingerprint
  for (const key of keys.slice(0, -1)) target = target[key]
  target[keys[keys.length - 1]] = value
  if (targetDraft === draft) updateFingerprintSummary()
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

const FINGERPRINT_PRESETS = [
  {
    id: 'win11-cn-intel',
    name: 'Windows 11 · 简体中文 · Intel UHD 核显 · 1080p (国内标准办公)',
    data: {
      platform: 'Win32',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
      language: 'zh-CN',
      languages: ['zh-CN', 'zh'],
      acceptLanguage: 'zh-CN,zh;q=0.9',
      timezone: 'Asia/Shanghai',
      cpu: 8,
      memory: 8,
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1040,
      scale: 1,
      webglVendor: 'Google Inc. (Intel)',
      webglRenderer: 'ANGLE (Intel, Intel(R) UHD Graphics, D3D11)'
    }
  },
  {
    id: 'win11-us-nvidia-rtx3060',
    name: 'Windows 11 · 英语美国 · NVIDIA RTX 3060 · 1080p · 纽约时区 (跨境出海推荐)',
    data: {
      platform: 'Win32',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
      language: 'en-US',
      languages: ['en-US', 'en'],
      acceptLanguage: 'en-US,en;q=0.9',
      timezone: 'America/New_York',
      cpu: 16,
      memory: 8,
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1040,
      scale: 1,
      webglVendor: 'Google Inc. (NVIDIA)',
      webglRenderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)'
    }
  },
  {
    id: 'win11-us-nvidia-rtx4070-2k',
    name: 'Windows 11 · 英语美国 · NVIDIA RTX 4070 · 2K超清 · 洛杉矶时区 (旗舰高配)',
    data: {
      platform: 'Win32',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
      language: 'en-US',
      languages: ['en-US', 'en'],
      acceptLanguage: 'en-US,en;q=0.9',
      timezone: 'America/Los_Angeles',
      cpu: 16,
      memory: 8,
      width: 2560,
      height: 1440,
      availWidth: 2560,
      availHeight: 1400,
      scale: 1.25,
      webglVendor: 'Google Inc. (NVIDIA)',
      webglRenderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)'
    }
  },
  {
    id: 'win10-us-intel-chicago',
    name: 'Windows 10 · 英语美国 · Intel UHD 630 · 1080p · 芝加哥时区 (稳健办公)',
    data: {
      platform: 'Win32',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
      language: 'en-US',
      languages: ['en-US', 'en'],
      acceptLanguage: 'en-US,en;q=0.9',
      timezone: 'America/Chicago',
      cpu: 8,
      memory: 8,
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1040,
      scale: 1,
      webglVendor: 'Google Inc. (Intel)',
      webglRenderer: 'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)'
    }
  },
  {
    id: 'win11-gb-london',
    name: 'Windows 11 · 英语英国 · Intel Iris Xe · 1080p · 伦敦时区 (英国站点)',
    data: {
      platform: 'Win32',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
      language: 'en-GB',
      languages: ['en-GB', 'en'],
      acceptLanguage: 'en-GB,en;q=0.9',
      timezone: 'Europe/London',
      cpu: 8,
      memory: 8,
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1040,
      scale: 1,
      webglVendor: 'Google Inc. (Intel)',
      webglRenderer: 'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)'
    }
  },
  {
    id: 'win11-ja-tokyo',
    name: 'Windows 11 · 日语日本 · Intel UHD · 1080p · 东京时区 (日本站点)',
    data: {
      platform: 'Win32',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
      language: 'ja-JP',
      languages: ['ja-JP', 'ja'],
      acceptLanguage: 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
      timezone: 'Asia/Tokyo',
      cpu: 8,
      memory: 8,
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1040,
      scale: 1,
      webglVendor: 'Google Inc. (Intel)',
      webglRenderer: 'ANGLE (Intel, Intel(R) UHD Graphics, D3D11)'
    }
  },
  {
    id: 'win11-de-berlin',
    name: 'Windows 11 · 德语德国 · AMD Radeon RX 580 · 1080p · 柏林时区 (欧洲德语区)',
    data: {
      platform: 'Win32',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
      language: 'de-DE',
      languages: ['de-DE', 'de', 'en'],
      acceptLanguage: 'de-DE,de;q=0.9,en;q=0.8',
      timezone: 'Europe/Berlin',
      cpu: 8,
      memory: 8,
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1040,
      scale: 1,
      webglVendor: 'Google Inc. (AMD)',
      webglRenderer: 'ANGLE (AMD, AMD Radeon RX 580 Direct3D11 vs_5_0 ps_5_0, D3D11)'
    }
  },
  {
    id: 'win11-fr-paris',
    name: 'Windows 11 · 法语法国 · Intel UHD 630 · 1080p · 巴黎时区 (欧洲法语区)',
    data: {
      platform: 'Win32',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
      language: 'fr-FR',
      languages: ['fr-FR', 'fr', 'en'],
      acceptLanguage: 'fr-FR,fr;q=0.9,en;q=0.8',
      timezone: 'Europe/Paris',
      cpu: 8,
      memory: 8,
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1040,
      scale: 1,
      webglVendor: 'Google Inc. (Intel)',
      webglRenderer: 'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)'
    }
  },
  {
    id: 'win11-sg-singapore',
    name: 'Windows 11 · 英语新加坡 · Intel Iris Xe · 1080p · 新加坡时区 (东南亚市场)',
    data: {
      platform: 'Win32',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
      language: 'en-SG',
      languages: ['en-SG', 'en', 'zh-CN'],
      acceptLanguage: 'en-SG,en;q=0.9,zh-CN;q=0.8',
      timezone: 'Asia/Singapore',
      cpu: 8,
      memory: 8,
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1040,
      scale: 1,
      webglVendor: 'Google Inc. (Intel)',
      webglRenderer: 'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)'
    }
  },
  {
    id: 'macos-us-m2',
    name: 'macOS Sonoma · 英语美国 · Apple M2 · 1440×900 · 纽约时区 (跨境出海推荐)',
    data: {
      platform: 'MacIntel',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
      language: 'en-US',
      languages: ['en-US', 'en'],
      acceptLanguage: 'en-US,en;q=0.9',
      timezone: 'America/New_York',
      cpu: 8,
      memory: 8,
      width: 1440,
      height: 900,
      availWidth: 1440,
      availHeight: 860,
      scale: 2,
      webglVendor: 'Google Inc. (Apple)',
      webglRenderer: 'ANGLE (Apple, Apple M2, OpenGL 4.1)'
    }
  },
  {
    id: 'macos-cn-m1',
    name: 'macOS Ventura · 简体中文 · Apple M1 · 1440×900 · 上海时区 (国内 Mac 办公)',
    data: {
      platform: 'MacIntel',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
      language: 'zh-CN',
      languages: ['zh-CN', 'zh'],
      acceptLanguage: 'zh-CN,zh;q=0.9',
      timezone: 'Asia/Shanghai',
      cpu: 8,
      memory: 8,
      width: 1440,
      height: 900,
      availWidth: 1440,
      availHeight: 860,
      scale: 2,
      webglVendor: 'Google Inc. (Apple)',
      webglRenderer: 'ANGLE (Apple, Apple M1, OpenGL 4.1)'
    }
  },
  {
    id: 'macos-us-m3',
    name: 'macOS Sonoma · 英语美国 · Apple M3 · 1440×900 · 洛杉矶时区 (旗舰高配)',
    data: {
      platform: 'MacIntel',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
      language: 'en-US',
      languages: ['en-US', 'en'],
      acceptLanguage: 'en-US,en;q=0.9',
      timezone: 'America/Los_Angeles',
      cpu: 8,
      memory: 8,
      width: 1440,
      height: 900,
      availWidth: 1440,
      availHeight: 860,
      scale: 2,
      webglVendor: 'Google Inc. (Apple)',
      webglRenderer: 'ANGLE (Apple, Apple M3, OpenGL 4.1)'
    }
  },
  {
    id: 'macos-ja-m2',
    name: 'macOS Sonoma · 日语日本 · Apple M2 · 1440×900 · 东京时区 (日本站点)',
    data: {
      platform: 'MacIntel',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
      language: 'ja-JP',
      languages: ['ja-JP', 'ja'],
      acceptLanguage: 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
      timezone: 'Asia/Tokyo',
      cpu: 8,
      memory: 8,
      width: 1440,
      height: 900,
      availWidth: 1440,
      availHeight: 860,
      scale: 2,
      webglVendor: 'Google Inc. (Apple)',
      webglRenderer: 'ANGLE (Apple, Apple M2, OpenGL 4.1)'
    }
  },
  {
    id: 'linux-us-amd',
    name: 'Linux x86_64 · 英语美国 · AMD Radeon · 1080p (Linux 平台)',
    data: {
      platform: 'Linux x86_64',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
      language: 'en-US',
      languages: ['en-US', 'en'],
      acceptLanguage: 'en-US,en;q=0.9',
      timezone: 'America/New_York',
      cpu: 8,
      memory: 8,
      width: 1920,
      height: 1080,
      availWidth: 1920,
      availHeight: 1040,
      scale: 1,
      webglVendor: 'Google Inc. (AMD)',
      webglRenderer: 'ANGLE (AMD, AMD Radeon RX 580, OpenGL 4.6)'
    }
  }
]

const USER_AGENT_OPTIONS = [
  { value: '', label: '内核原生（留空使用当前内核原生 User-Agent）' },
  { value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', label: 'Windows 11 / 10 · 64 位 · Chrome 138 (推荐)' },
  { value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.127 Safari/537.36', label: 'Windows 11 / 10 · 64 位 · Chrome 126 (后量子 Kyber 版)' },
  { value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.109 Safari/537.36', label: 'Windows 11 / 10 · 64 位 · Chrome 120 (经典稳定版 · 纯经典 TLS)' },
  { value: 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', label: 'Windows 10 · 32 位兼容模式 · Chrome 138' },
  { value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', label: 'macOS · Intel / Sonoma · Chrome 138' },
  { value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', label: 'macOS 14.4 Sonoma · Chrome 138' },
  { value: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', label: 'Linux x86_64 · Ubuntu/Debian · Chrome 138' }
]

const LANGUAGE_OPTIONS = [
  { value: 'zh-CN', label: 'zh-CN (简体中文 · 中国大陆)', defaultTimezone: 'Asia/Shanghai', defaultLanguages: ['zh-CN', 'zh'], defaultAccept: 'zh-CN,zh;q=0.9' },
  { value: 'zh-TW', label: 'zh-TW (繁体中文 · 中国台湾)', defaultTimezone: 'Asia/Taipei', defaultLanguages: ['zh-TW', 'zh', 'en-US'], defaultAccept: 'zh-TW,zh;q=0.9,en-US;q=0.8' },
  { value: 'zh-HK', label: 'zh-HK (繁体中文 · 中国香港)', defaultTimezone: 'Asia/Hong_Kong', defaultLanguages: ['zh-HK', 'zh', 'en-US'], defaultAccept: 'zh-HK,zh;q=0.9,en-US;q=0.8' },
  { value: 'en-US', label: 'en-US (英语 · 美国)', defaultTimezone: 'America/New_York', defaultLanguages: ['en-US', 'en'], defaultAccept: 'en-US,en;q=0.9' },
  { value: 'en-GB', label: 'en-GB (英语 · 英国)', defaultTimezone: 'Europe/London', defaultLanguages: ['en-GB', 'en'], defaultAccept: 'en-GB,en;q=0.9' },
  { value: 'en-CA', label: 'en-CA (英语 · 加拿大)', defaultTimezone: 'America/Toronto', defaultLanguages: ['en-CA', 'en-US', 'en'], defaultAccept: 'en-CA,en-US;q=0.9,en;q=0.8' },
  { value: 'en-AU', label: 'en-AU (英语 · 澳大利亚)', defaultTimezone: 'Australia/Sydney', defaultLanguages: ['en-AU', 'en-GB', 'en'], defaultAccept: 'en-AU,en-GB;q=0.9,en;q=0.8' },
  { value: 'en-SG', label: 'en-SG (英语 · 新加坡)', defaultTimezone: 'Asia/Singapore', defaultLanguages: ['en-SG', 'en', 'zh-CN'], defaultAccept: 'en-SG,en;q=0.9,zh-CN;q=0.8' },
  { value: 'ja-JP', label: 'ja-JP (日语 · 日本)', defaultTimezone: 'Asia/Tokyo', defaultLanguages: ['ja-JP', 'ja'], defaultAccept: 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7' },
  { value: 'ko-KR', label: 'ko-KR (韩语 · 韩国)', defaultTimezone: 'Asia/Seoul', defaultLanguages: ['ko-KR', 'ko'], defaultAccept: 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7' },
  { value: 'de-DE', label: 'de-DE (德语 · 德国)', defaultTimezone: 'Europe/Berlin', defaultLanguages: ['de-DE', 'de', 'en'], defaultAccept: 'de-DE,de;q=0.9,en;q=0.8' },
  { value: 'fr-FR', label: 'fr-FR (法语 · 法国)', defaultTimezone: 'Europe/Paris', defaultLanguages: ['fr-FR', 'fr', 'en'], defaultAccept: 'fr-FR,fr;q=0.9,en;q=0.8' },
  { value: 'es-ES', label: 'es-ES (西班牙语 · 西班牙)', defaultTimezone: 'Europe/Madrid', defaultLanguages: ['es-ES', 'es', 'en'], defaultAccept: 'es-ES,es;q=0.9,en;q=0.8' },
  { value: 'es-MX', label: 'es-MX (西班牙语 · 墨西哥)', defaultTimezone: 'America/Mexico_City', defaultLanguages: ['es-MX', 'es', 'en'], defaultAccept: 'es-MX,es;q=0.9,en;q=0.8' },
  { value: 'pt-BR', label: 'pt-BR (葡萄牙语 · 巴西)', defaultTimezone: 'America/Sao_Paulo', defaultLanguages: ['pt-BR', 'pt', 'en'], defaultAccept: 'pt-BR,pt;q=0.9,en;q=0.8' },
  { value: 'pt-PT', label: 'pt-PT (葡萄牙语 · 葡萄牙)', defaultTimezone: 'Europe/Lisbon', defaultLanguages: ['pt-PT', 'pt', 'en'], defaultAccept: 'pt-PT,pt;q=0.9,en;q=0.8' },
  { value: 'ru-RU', label: 'ru-RU (俄语 · 俄罗斯)', defaultTimezone: 'Europe/Moscow', defaultLanguages: ['ru-RU', 'ru', 'en'], defaultAccept: 'ru-RU,ru;q=0.9,en;q=0.8' },
  { value: 'it-IT', label: 'it-IT (意大利语 · 意大利)', defaultTimezone: 'Europe/Rome', defaultLanguages: ['it-IT', 'it', 'en'], defaultAccept: 'it-IT,it;q=0.9,en;q=0.8' },
  { value: 'nl-NL', label: 'nl-NL (荷兰语 · 荷兰)', defaultTimezone: 'Europe/Amsterdam', defaultLanguages: ['nl-NL', 'nl', 'en'], defaultAccept: 'nl-NL,nl;q=0.9,en;q=0.8' },
  { value: 'pl-PL', label: 'pl-PL (波兰语 · 波兰)', defaultTimezone: 'Europe/Warsaw', defaultLanguages: ['pl-PL', 'pl', 'en'], defaultAccept: 'pl-PL,pl;q=0.9,en;q=0.8' },
  { value: 'tr-TR', label: 'tr-TR (土耳其语 · 土耳其)', defaultTimezone: 'Europe/Istanbul', defaultLanguages: ['tr-TR', 'tr', 'en'], defaultAccept: 'tr-TR,tr;q=0.9,en;q=0.8' },
  { value: 'vi-VN', label: 'vi-VN (越南语 · 越南)', defaultTimezone: 'Asia/Ho_Chi_Minh', defaultLanguages: ['vi-VN', 'vi', 'en-US'], defaultAccept: 'vi-VN,vi;q=0.9,en-US;q=0.8' },
  { value: 'th-TH', label: 'th-TH (泰语 · 泰国)', defaultTimezone: 'Asia/Bangkok', defaultLanguages: ['th-TH', 'th', 'en-US'], defaultAccept: 'th-TH,th;q=0.9,en-US;q=0.8' },
  { value: 'id-ID', label: 'id-ID (印尼语 · 印度尼西亚)', defaultTimezone: 'Asia/Jakarta', defaultLanguages: ['id-ID', 'id', 'en-US'], defaultAccept: 'id-ID,id;q=0.9,en-US;q=0.8' },
  { value: 'ms-MY', label: 'ms-MY (马来语 · 马来西亚)', defaultTimezone: 'Asia/Kuala_Lumpur', defaultLanguages: ['ms-MY', 'ms', 'en-US'], defaultAccept: 'ms-MY,ms;q=0.9,en-US;q=0.8' },
  { value: 'fil-PH', label: 'fil-PH (菲律宾语 · 菲律宾)', defaultTimezone: 'Asia/Manila', defaultLanguages: ['fil-PH', 'fil', 'en-US'], defaultAccept: 'fil-PH,fil;q=0.9,en-US;q=0.8' },
  { value: 'ar-SA', label: 'ar-SA (阿拉伯语 · 沙特阿拉伯)', defaultTimezone: 'Asia/Riyadh', defaultLanguages: ['ar-SA', 'ar', 'en'], defaultAccept: 'ar-SA,ar;q=0.9,en;q=0.8' },
  { value: 'ar-AE', label: 'ar-AE (阿拉伯语 · 阿联酋)', defaultTimezone: 'Asia/Dubai', defaultLanguages: ['ar-AE', 'ar', 'en'], defaultAccept: 'ar-AE,ar;q=0.9,en;q=0.8' },
  { value: 'hi-IN', label: 'hi-IN (印地语 · 印度)', defaultTimezone: 'Asia/Kolkata', defaultLanguages: ['hi-IN', 'hi', 'en-US'], defaultAccept: 'hi-IN,hi;q=0.9,en-US;q=0.8' },
  { value: 'sv-SE', label: 'sv-SE (瑞典语 · 瑞典)', defaultTimezone: 'Europe/Stockholm', defaultLanguages: ['sv-SE', 'sv', 'en'], defaultAccept: 'sv-SE,sv;q=0.9,en;q=0.8' }
]

const ACCEPT_LANGUAGE_OPTIONS = [
  'zh-CN,zh;q=0.9',
  'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
  'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
  'zh-HK,zh;q=0.9,en-US;q=0.8,en;q=0.7',
  'en-US,en;q=0.9',
  'en-US,en;q=0.9,zh-CN;q=0.8',
  'en-GB,en;q=0.9',
  'en-CA,en-US;q=0.9,en;q=0.8',
  'en-AU,en-GB;q=0.9,en;q=0.8',
  'en-SG,en;q=0.9,zh-CN;q=0.8',
  'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
  'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  'de-DE,de;q=0.9,en;q=0.8',
  'fr-FR,fr;q=0.9,en;q=0.8',
  'es-ES,es;q=0.9,en;q=0.8',
  'es-MX,es;q=0.9,en;q=0.8',
  'pt-BR,pt;q=0.9,en;q=0.8',
  'pt-PT,pt;q=0.9,en;q=0.8',
  'ru-RU,ru;q=0.9,en;q=0.8',
  'it-IT,it;q=0.9,en;q=0.8',
  'nl-NL,nl;q=0.9,en;q=0.8',
  'pl-PL,pl;q=0.9,en;q=0.8',
  'tr-TR,tr;q=0.9,en;q=0.8',
  'vi-VN,vi;q=0.9,en-US;q=0.8',
  'th-TH,th;q=0.9,en-US;q=0.8',
  'id-ID,id;q=0.9,en-US;q=0.8',
  'ms-MY,ms;q=0.9,en-US;q=0.8',
  'fil-PH,fil;q=0.9,en-US;q=0.8',
  'ar-SA,ar;q=0.9,en;q=0.8',
  'ar-AE,ar;q=0.9,en;q=0.8',
  'hi-IN,hi;q=0.9,en-US;q=0.8',
  'sv-SE,sv;q=0.9,en;q=0.8'
]

const LANGUAGES_LIST_OPTIONS = [
  'zh-CN, zh',
  'zh-CN, zh, en-US, en',
  'zh-TW, zh, en-US',
  'zh-HK, zh, en-US',
  'en-US, en',
  'en-US, en, zh-CN',
  'en-GB, en',
  'en-CA, en-US, en',
  'en-AU, en-GB, en',
  'en-SG, en, zh-CN',
  'ja-JP, ja',
  'ja-JP, ja, en-US, en',
  'ko-KR, ko',
  'ko-KR, ko, en-US, en',
  'de-DE, de, en',
  'fr-FR, fr, en',
  'es-ES, es, en',
  'es-MX, es, en',
  'pt-BR, pt, en',
  'pt-PT, pt, en',
  'ru-RU, ru, en',
  'it-IT, it, en',
  'nl-NL, nl, en',
  'pl-PL, pl, en',
  'tr-TR, tr, en',
  'vi-VN, vi, en-US',
  'th-TH, th, en-US',
  'id-ID, id, en-US',
  'ms-MY, ms, en-US',
  'fil-PH, fil, en-US',
  'ar-SA, ar, en',
  'ar-AE, ar, en',
  'hi-IN, hi, en-US',
  'sv-SE, sv, en'
]

const TIMEZONE_OPTIONS = [
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (中国标准时间 UTC+8 · 北京/上海)' },
  { value: 'Asia/Hong_Kong', label: 'Asia/Hong_Kong (香港时间 UTC+8)' },
  { value: 'Asia/Taipei', label: 'Asia/Taipei (台北时间 UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (日本标准时间 UTC+9 · 东京)' },
  { value: 'Asia/Seoul', label: 'Asia/Seoul (韩国标准时间 UTC+9 · 首尔)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (新加坡时间 UTC+8)' },
  { value: 'Asia/Kuala_Lumpur', label: 'Asia/Kuala_Lumpur (马来西亚时间 UTC+8 · 吉隆坡)' },
  { value: 'Asia/Bangkok', label: 'Asia/Bangkok (泰国时间 UTC+7 · 曼谷)' },
  { value: 'Asia/Ho_Chi_Minh', label: 'Asia/Ho_Chi_Minh (越南时间 UTC+7 · 胡志明)' },
  { value: 'Asia/Jakarta', label: 'Asia/Jakarta (印尼时间 UTC+7 · 雅加达)' },
  { value: 'Asia/Manila', label: 'Asia/Manila (菲律宾时间 UTC+8 · 马尼拉)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (阿联酋时间 UTC+4 · 迪拜)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (印度标准时间 UTC+5:30 · 新德里)' },
  { value: 'Asia/Riyadh', label: 'Asia/Riyadh (沙特时间 UTC+3 · 利雅得)' },
  { value: 'Asia/Almaty', label: 'Asia/Almaty (哈萨克斯坦时间 UTC+5)' },
  { value: 'America/New_York', label: 'America/New_York (美国东部时间 UTC-5/-4 · 纽约/华盛顿)' },
  { value: 'America/Chicago', label: 'America/Chicago (美国中部时间 UTC-6/-5 · 芝加哥)' },
  { value: 'America/Denver', label: 'America/Denver (美国山地时间 UTC-7/-6 · 丹佛)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (美国太平洋时间 UTC-8/-7 · 洛杉矶/西雅图)' },
  { value: 'America/Phoenix', label: 'America/Phoenix (美国亚利桑那时间 UTC-7 · 无夏令时)' },
  { value: 'America/Anchorage', label: 'America/Anchorage (美国阿拉斯加时间 UTC-9/-8)' },
  { value: 'Pacific/Honolulu', label: 'Pacific/Honolulu (美国夏威夷时间 UTC-10 · 檀香山)' },
  { value: 'America/Toronto', label: 'America/Toronto (加拿大东部时间 UTC-5/-4 · 多伦多)' },
  { value: 'America/Vancouver', label: 'America/Vancouver (加拿大太平洋时间 UTC-8/-7 · 温哥华)' },
  { value: 'America/Mexico_City', label: 'America/Mexico_City (墨西哥时间 UTC-6 · 墨西哥城)' },
  { value: 'Europe/London', label: 'Europe/London (英国时间 UTC+0/+1 · 伦敦)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (欧洲中部时间 UTC+1/+2 · 德国柏林)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (欧洲中部时间 UTC+1/+2 · 法国巴黎)' },
  { value: 'Europe/Rome', label: 'Europe/Rome (欧洲中部时间 UTC+1/+2 · 意大利罗马)' },
  { value: 'Europe/Madrid', label: 'Europe/Madrid (欧洲中部时间 UTC+1/+2 · 西班牙马德里)' },
  { value: 'Europe/Amsterdam', label: 'Europe/Amsterdam (欧洲中部时间 UTC+1/+2 · 荷兰阿姆斯特丹)' },
  { value: 'Europe/Brussels', label: 'Europe/Brussels (欧洲中部时间 UTC+1/+2 · 比利时布鲁塞尔)' },
  { value: 'Europe/Warsaw', label: 'Europe/Warsaw (欧洲中部时间 UTC+1/+2 · 波兰华沙)' },
  { value: 'Europe/Zurich', label: 'Europe/Zurich (欧洲中部时间 UTC+1/+2 · 瑞士苏黎世)' },
  { value: 'Europe/Dublin', label: 'Europe/Dublin (爱尔兰时间 UTC+0/+1 · 都柏林)' },
  { value: 'Europe/Stockholm', label: 'Europe/Stockholm (瑞典时间 UTC+1/+2 · 斯德哥尔摩)' },
  { value: 'Europe/Moscow', label: 'Europe/Moscow (俄罗斯莫斯科时间 UTC+3)' },
  { value: 'Europe/Istanbul', label: 'Europe/Istanbul (土耳其时间 UTC+3 · 伊斯坦布尔)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (澳大利亚东部时间 UTC+10/+11 · 悉尼)' },
  { value: 'Australia/Melbourne', label: 'Australia/Melbourne (澳大利亚时间 UTC+10/+11 · 墨尔本)' },
  { value: 'Australia/Brisbane', label: 'Australia/Brisbane (澳大利亚昆士兰时间 UTC+10)' },
  { value: 'Australia/Perth', label: 'Australia/Perth (澳大利亚西部时间 UTC+8 · 珀斯)' },
  { value: 'Pacific/Auckland', label: 'Pacific/Auckland (新西兰时间 UTC+12/+13 · 奥克兰)' },
  { value: 'America/Sao_Paulo', label: 'America/Sao_Paulo (巴西时间 UTC-3 · 圣保罗)' },
  { value: 'America/Buenos_Aires', label: 'America/Buenos_Aires (阿根廷时间 UTC-3 · 布宜诺斯艾利斯)' }
]

const PLATFORM_OPTIONS = [
  { value: 'Win32', label: 'Win32 (Windows 桌面平台 · 推荐)' },
  { value: 'MacIntel', label: 'MacIntel (macOS 桌面平台 · Intel/Apple Silicon)' },
  { value: 'Linux x86_64', label: 'Linux x86_64 (Linux 桌面平台 · 64 位)' }
]

const CPU_OPTIONS = [
  { value: 2, label: '2 核心 / 线程 (双核基础办公)' },
  { value: 4, label: '4 核心 / 线程 (主流轻办公)' },
  { value: 6, label: '6 核心 / 线程 (六核主流配置)' },
  { value: 8, label: '8 核心 / 线程 (八核主流推荐)' },
  { value: 12, label: '12 核心 / 线程 (高性能平台)' },
  { value: 16, label: '16 核心 / 线程 (十六核高配主机)' },
  { value: 20, label: '20 核心 / 线程 (混合异构多核)' },
  { value: 24, label: '24 核心 / 线程 (高端工作站)' },
  { value: 32, label: '32 核心 / 线程 (专业级工作站)' },
  { value: 64, label: '64 核心 / 线程 (服务器级多核)' }
]

const MEMORY_OPTIONS = [
  { value: 1, label: '1 GiB (低配轻量环境)' },
  { value: 2, label: '2 GiB (入门办公配置)' },
  { value: 4, label: '4 GiB (标准推荐配置)' },
  { value: 8, label: '8 GiB (高性能极速推荐)' }
]

const SCALE_OPTIONS = [
  { value: 1, label: '1.0 (100% 标准无缩放 · 最常用)' },
  { value: 1.25, label: '1.25 (125% 笔记本高清推荐)' },
  { value: 1.5, label: '1.5 (150% 2K/超清推荐)' },
  { value: 1.75, label: '1.75 (175% 高分屏缩放)' },
  { value: 2, label: '2.0 (200% Retina / 4K 常见)' },
  { value: 2.5, label: '2.5 (250% 超高分辨率)' },
  { value: 3, label: '3.0 (300% 极高分辨率视网膜)' }
]

const SCREEN_PRESETS = [
  { label: '1920 × 1080 (1080p 全高清 · 最常见桌面，可用 1920×1040)', width: 1920, height: 1080, availWidth: 1920, availHeight: 1040 },
  { label: '1366 × 768 (常见办公笔记本，可用 1366×728)', width: 1366, height: 768, availWidth: 1366, availHeight: 728 },
  { label: '1440 × 900 (16:10 宽屏经典，可用 1440×860)', width: 1440, height: 900, availWidth: 1440, availHeight: 860 },
  { label: '1536 × 864 (Windows 缩放推荐分辨率，可用 1536×824)', width: 1536, height: 864, availWidth: 1536, availHeight: 824 },
  { label: '1600 × 900 (HD+ 宽屏，可用 1600×860)', width: 1600, height: 900, availWidth: 1600, availHeight: 860 },
  { label: '1680 × 1050 (WSXGA+ 宽屏，可用 1680×1010)', width: 1680, height: 1050, availWidth: 1680, availHeight: 1010 },
  { label: '1280 × 720 (720p 高清，可用 1280×680)', width: 1280, height: 720, availWidth: 1280, availHeight: 680 },
  { label: '1280 × 800 (16:10 便携本，可用 1280×760)', width: 1280, height: 800, availWidth: 1280, availHeight: 760 },
  { label: '1280 × 1024 (5:4 传统普屏，可用 1280×984)', width: 1280, height: 1024, availWidth: 1280, availHeight: 984 },
  { label: '2560 × 1440 (2K QHD 极清超宽，可用 2560×1400)', width: 2560, height: 1440, availWidth: 2560, availHeight: 1400 },
  { label: '2560 × 1600 (MacBook / 16:10 超清视网膜，可用 2560×1560)', width: 2560, height: 1600, availWidth: 2560, availHeight: 1560 },
  { label: '3840 × 2160 (4K UHD 极清旗舰屏，可用 3840×2120)', width: 3840, height: 2160, availWidth: 3840, availHeight: 2120 }
]

const SCREEN_WIDTH_OPTIONS = [1024, 1280, 1366, 1440, 1536, 1600, 1680, 1920, 2560, 3840]
const SCREEN_HEIGHT_OPTIONS = [720, 768, 800, 864, 900, 1024, 1050, 1080, 1440, 1600, 2160]
const SCREEN_AVAIL_WIDTH_OPTIONS = [1024, 1280, 1366, 1440, 1536, 1600, 1680, 1920, 2560, 3840]
const SCREEN_AVAIL_HEIGHT_OPTIONS = [680, 728, 760, 824, 860, 984, 1010, 1040, 1400, 1560, 2120]

const WEBGL_PRESETS = [
  {
    name: 'NVIDIA GeForce RTX 3060 (D3D11 · Windows 独立显卡推荐)',
    vendor: 'Google Inc. (NVIDIA)',
    renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  {
    name: 'NVIDIA GeForce RTX 4070 (D3D11 · Windows 高端独显)',
    vendor: 'Google Inc. (NVIDIA)',
    renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  {
    name: 'NVIDIA GeForce RTX 4060 (D3D11 · Windows 主流独显)',
    vendor: 'Google Inc. (NVIDIA)',
    renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  {
    name: 'NVIDIA GeForce RTX 3080 (D3D11 · Windows 旗舰独显)',
    vendor: 'Google Inc. (NVIDIA)',
    renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  {
    name: 'NVIDIA GeForce GTX 1660 SUPER (D3D11 · Windows 经典独显)',
    vendor: 'Google Inc. (NVIDIA)',
    renderer: 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  {
    name: 'NVIDIA GeForce GTX 1060 6GB (D3D11 · Windows 常见独显)',
    vendor: 'Google Inc. (NVIDIA)',
    renderer: 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 6GB Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  {
    name: 'Intel(R) UHD Graphics (D3D11 · Windows 官方通用核显)',
    vendor: 'Google Inc. (Intel)',
    renderer: 'ANGLE (Intel, Intel(R) UHD Graphics, D3D11)'
  },
  {
    name: 'Intel(R) UHD Graphics 630 (D3D11 · Windows 酷睿办公核显)',
    vendor: 'Google Inc. (Intel)',
    renderer: 'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  {
    name: 'Intel(R) Iris(R) Xe Graphics (D3D11 · Windows 锐炬轻薄本核显)',
    vendor: 'Google Inc. (Intel)',
    renderer: 'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  {
    name: 'Intel(R) HD Graphics 530 (D3D11 · Windows 经典核显)',
    vendor: 'Google Inc. (Intel)',
    renderer: 'ANGLE (Intel, Intel(R) HD Graphics 530 Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  {
    name: 'AMD Radeon RX 580 (D3D11 · Windows AMD 独立显卡)',
    vendor: 'Google Inc. (AMD)',
    renderer: 'ANGLE (AMD, AMD Radeon RX 580 Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  {
    name: 'AMD Radeon(TM) Graphics (D3D11 · Windows 锐龙核显)',
    vendor: 'Google Inc. (AMD)',
    renderer: 'ANGLE (AMD, AMD Radeon(TM) Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  {
    name: 'AMD Radeon RX 6600 (D3D11 · Windows AMD 中端独显)',
    vendor: 'Google Inc. (AMD)',
    renderer: 'ANGLE (AMD, AMD Radeon RX 6600 Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  {
    name: 'AMD Radeon RX 6700 XT (D3D11 · Windows AMD 高端独显)',
    vendor: 'Google Inc. (AMD)',
    renderer: 'ANGLE (AMD, AMD Radeon RX 6700 XT Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  {
    name: 'Apple M1 (OpenGL 4.1 · macOS Apple Silicon)',
    vendor: 'Google Inc. (Apple)',
    renderer: 'ANGLE (Apple, Apple M1, OpenGL 4.1)'
  },
  {
    name: 'Apple M2 (OpenGL 4.1 · macOS Apple Silicon)',
    vendor: 'Google Inc. (Apple)',
    renderer: 'ANGLE (Apple, Apple M2, OpenGL 4.1)'
  },
  {
    name: 'Apple M3 (OpenGL 4.1 · macOS Apple Silicon)',
    vendor: 'Google Inc. (Apple)',
    renderer: 'ANGLE (Apple, Apple M3, OpenGL 4.1)'
  },
  {
    name: 'AMD Radeon RX 580 (OpenGL 4.6 · Linux 平台)',
    vendor: 'Google Inc. (AMD)',
    renderer: 'ANGLE (AMD, AMD Radeon RX 580, OpenGL 4.6)'
  },
  {
    name: 'Intel(R) UHD Graphics 630 (OpenGL 4.6 · Linux 平台)',
    vendor: 'Google Inc. (Intel)',
    renderer: 'ANGLE (Mesa, Mesa Intel(R) UHD Graphics 630, OpenGL 4.6)'
  }
]

const WEBGL_VENDOR_OPTIONS = [
  { value: 'Google Inc. (NVIDIA)', label: 'Google Inc. (NVIDIA) - 英伟达显卡' },
  { value: 'Google Inc. (Intel)', label: 'Google Inc. (Intel) - 英特尔显卡' },
  { value: 'Google Inc. (AMD)', label: 'Google Inc. (AMD) - 超威半导体显卡' },
  { value: 'Google Inc. (Apple)', label: 'Google Inc. (Apple) - 苹果芯片显卡' },
  { value: 'Google Inc. (Google)', label: 'Google Inc. (Google) - 软件虚拟渲染' }
]

const WEBGL_RENDERER_OPTIONS = [
  'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 6GB Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (Intel, Intel(R) UHD Graphics, D3D11)',
  'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (Intel, Intel(R) HD Graphics 530 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (AMD, AMD Radeon RX 580 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (AMD, AMD Radeon(TM) Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (AMD, AMD Radeon RX 6600 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (AMD, AMD Radeon RX 6700 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (Apple, Apple M1, OpenGL 4.1)',
  'ANGLE (Apple, Apple M2, OpenGL 4.1)',
  'ANGLE (Apple, Apple M3, OpenGL 4.1)',
  'ANGLE (AMD, AMD Radeon RX 580, OpenGL 4.6)',
  'ANGLE (Mesa, Mesa Intel(R) UHD Graphics 630, OpenGL 4.6)'
]

const URL_PRESETS = [
  { value: 'https://example.com', label: '默认测试空白页 (https://example.com)' },
  { value: 'https://whoer.net', label: 'Whoer 指纹与伪装度检测 (https://whoer.net)' },
  { value: 'https://browserleaks.com/ip', label: 'BrowserLeaks IP 与指纹检测 (https://browserleaks.com/ip)' },
  { value: 'https://pixelscan.net', label: 'Pixelscan 机器人与风险检测 (https://pixelscan.net)' },
  { value: 'https://ipinfo.io', label: 'IPinfo IP 地理位置查询 (https://ipinfo.io)' },
  { value: 'https://www.google.com', label: 'Google 谷歌搜索 (https://www.google.com)' },
  { value: 'https://www.amazon.com', label: 'Amazon 亚马逊商城 (https://www.amazon.com)' },
  { value: 'https://www.ebay.com', label: 'eBay 跨境电商平台 (https://www.ebay.com)' },
  { value: 'https://www.tiktok.com', label: 'TikTok 海外短视频 (https://www.tiktok.com)' },
  { value: 'https://www.facebook.com', label: 'Facebook 社交平台 (https://www.facebook.com)' },
  { value: 'https://www.instagram.com', label: 'Instagram 社交平台 (https://www.instagram.com)' },
  { value: 'https://twitter.com', label: 'X / Twitter 平台 (https://twitter.com)' },
  { value: 'https://www.youtube.com', label: 'YouTube 视频平台 (https://www.youtube.com)' },
  { value: 'about:blank', label: '空白新标签页 (about:blank)' }
]

const NAME_PRESETS = [
  '美国旗舰店 · 运营',
  '美国站点 · 广告投放',
  '英国品牌站 · 主账号',
  '欧洲市场 · 跨境电商',
  '日本独立站 · 营销推广',
  '德国业务 · 客服专员',
  'TikTok 运营 · 账号 01',
  '社媒推广 · Facebook 矩阵',
  '亚马逊测评 · 买家号',
  '日常备用 · 独立环境'
]

const PROXY_PRESETS = [
  { mode: 'http', server: 'http://198.51.100.24:8080', label: '美国静态代理 03 (HTTP · 198.51.100.24:8080)' },
  { mode: 'socks5', server: 'socks5://203.0.113.56:1080', label: '英国业务代理 01 (SOCKS5 · 203.0.113.56:1080)' },
  { mode: 'http', server: 'http://203.0.113.80:8080', label: '德国客服代理 01 (HTTP · 203.0.113.80:8080)' },
  { mode: 'socks5', server: 'socks5://192.0.2.46:1080', label: '日本内容代理 01 (SOCKS5 · 192.0.2.46:1080)' }
]

function applyFingerprintPreset (presetId, targetDraft) {
  const preset = FINGERPRINT_PRESETS.find(p => p.id === presetId)
  if (!preset || !targetDraft?.fingerprint) return
  const fp = targetDraft.fingerprint
  fp.hardware.platform = preset.data.platform
  fp.browser.userAgent = preset.data.userAgent
  fp.locale.language = preset.data.language
  fp.locale.languages = cloneValue(preset.data.languages)
  fp.browser.acceptLanguage = preset.data.acceptLanguage
  fp.locale.timezone = preset.data.timezone
  fp.hardware.hardwareConcurrency = preset.data.cpu
  fp.hardware.deviceMemory = preset.data.memory
  fp.screen.width = preset.data.width
  fp.screen.height = preset.data.height
  fp.screen.availWidth = preset.data.availWidth
  fp.screen.availHeight = preset.data.availHeight
  fp.screen.deviceScaleFactor = preset.data.scale
  fp.graphics.webglVendor = preset.data.webglVendor
  fp.graphics.webglRenderer = preset.data.webglRenderer
  if (targetDraft === draft) {
    render()
  } else if (currentEnvironment) {
    const dialogBody = document.querySelector('.dialog.environment-edit .card-body')
    if (dialogBody) dialogBody.innerHTML = environmentEditDialog(currentEnvironment)
  }
  toast(`已应用指纹预设：${preset.name.split(' (')[0]}`)
}

function applyScreenPreset (index, targetDraft) {
  const preset = SCREEN_PRESETS[index]
  if (!preset || !targetDraft?.fingerprint) return
  const fp = targetDraft.fingerprint
  fp.screen.width = preset.width
  fp.screen.height = preset.height
  fp.screen.availWidth = preset.availWidth
  fp.screen.availHeight = preset.availHeight
  if (targetDraft === draft) {
    render()
  } else if (currentEnvironment) {
    const dialogBody = document.querySelector('.dialog.environment-edit .card-body')
    if (dialogBody) dialogBody.innerHTML = environmentEditDialog(currentEnvironment)
  }
  toast(`已应用屏幕分辨率：${preset.label.split(' ')[0]}`)
}

function applyWebglPreset (index, targetDraft) {
  const preset = WEBGL_PRESETS[index]
  if (!preset || !targetDraft?.fingerprint) return
  const fp = targetDraft.fingerprint
  fp.graphics.webglVendor = preset.vendor
  fp.graphics.webglRenderer = preset.renderer
  if (targetDraft === draft) {
    render()
  } else if (currentEnvironment) {
    const dialogBody = document.querySelector('.dialog.environment-edit .card-body')
    if (dialogBody) dialogBody.innerHTML = environmentEditDialog(currentEnvironment)
  }
  toast(`已应用显卡预设：${preset.name.split(' (')[0]}`)
}

function applyLanguagePreset (langVal, targetDraft) {
  const option = LANGUAGE_OPTIONS.find(o => o.value === langVal)
  if (!option || !targetDraft?.fingerprint) return
  const fp = targetDraft.fingerprint
  fp.locale.language = option.value
  fp.locale.languages = cloneValue(option.defaultLanguages)
  fp.browser.acceptLanguage = option.defaultAccept
  if (option.defaultTimezone) fp.locale.timezone = option.defaultTimezone
  if (targetDraft === draft) {
    render()
  } else if (currentEnvironment) {
    const dialogBody = document.querySelector('.dialog.environment-edit .card-body')
    if (dialogBody) dialogBody.innerHTML = environmentEditDialog(currentEnvironment)
  }
}

function getHostPlatform () {
  const p = window.browserApi?.hostPlatform || (typeof process !== 'undefined' ? process.platform : '')
  if (p === 'darwin') return 'darwin'
  if (p === 'linux') return 'linux'
  return 'win32'
}

function getHostPlatformLabel (host = getHostPlatform()) {
  if (host === 'darwin') return 'macOS'
  if (host === 'linux') return 'Linux'
  return 'Windows'
}

function getPlatformOptions (host = getHostPlatform()) {
  if (host === 'darwin') {
    return [{ value: 'MacIntel', label: 'MacIntel (macOS 桌面平台 · 本机相容推荐)' }]
  }
  if (host === 'linux') {
    return [{ value: 'Linux x86_64', label: 'Linux x86_64 (Linux 桌面平台 · 本机相容推荐)' }]
  }
  return [{ value: 'Win32', label: 'Win32 (Windows 桌面平台 · 本机相容推荐)' }]
}

function getFilteredFingerprintPresets (host = getHostPlatform()) {
  const targetPlatform = { win32: 'Win32', darwin: 'MacIntel', linux: 'Linux x86_64' }[host] || 'Win32'
  return FINGERPRINT_PRESETS.filter(p => p.data?.platform === targetPlatform)
}

function getFilteredUserAgentOptions (host = getHostPlatform()) {
  return USER_AGENT_OPTIONS.filter(opt => {
    if (!opt.value) return true
    if (host === 'win32') return /Windows NT/.test(opt.value)
    if (host === 'darwin') return /Macintosh/.test(opt.value)
    if (host === 'linux') return /Linux/.test(opt.value) && !/Android/.test(opt.value)
    return true
  })
}

function getFilteredWebglPresets (host = getHostPlatform()) {
  const list = []
  WEBGL_PRESETS.forEach((gpu, idx) => {
    const isD3D = /D3D|Direct3D/i.test(gpu.renderer)
    const isApple = /Apple/i.test(gpu.vendor) || /Apple/i.test(gpu.renderer)
    const isLinuxMesa = /Mesa/i.test(gpu.renderer) || /Linux/i.test(gpu.name)
    let match = false
    if (host === 'win32') match = isD3D && !isApple && !isLinuxMesa
    else if (host === 'darwin') match = isApple && !isD3D && !isLinuxMesa
    else if (host === 'linux') match = (isLinuxMesa || !isD3D) && !isApple
    else match = true
    if (match) list.push({ item: gpu, originalIndex: idx })
  })
  return list
}

function getFilteredWebglVendors (host = getHostPlatform()) {
  return WEBGL_VENDOR_OPTIONS.filter(v => {
    if (host === 'win32') return v.value !== 'Google Inc. (Apple)'
    if (host === 'darwin') return v.value !== 'Google Inc. (NVIDIA)'
    return true
  })
}

function getFilteredWebglRenderers (host = getHostPlatform()) {
  return WEBGL_RENDERER_OPTIONS.filter(r => {
    const isD3D = /D3D|Direct3D/i.test(r)
    const isApple = /Apple/i.test(r)
    const isLinuxMesa = /Mesa/i.test(r)
    if (host === 'win32') return isD3D && !isApple && !isLinuxMesa
    if (host === 'darwin') return isApple && !isD3D && !isLinuxMesa
    if (host === 'linux') return (isLinuxMesa || !isD3D) && !isApple
    return true
  })
}

function getFilteredScreenPresets (host = getHostPlatform()) {
  const list = []
  SCREEN_PRESETS.forEach((sp, idx) => {
    const isMacRetina = (sp.width === 1440 && sp.height === 900) ||
                        (sp.width === 2560 && sp.height === 1600) ||
                        (sp.width === 1280 && sp.height === 800)
    const isWinStandard = (sp.width === 1920 && sp.height === 1080) ||
                          (sp.width === 1366 && sp.height === 768) ||
                          (sp.width === 1536 && sp.height === 864) ||
                          (sp.width === 2560 && sp.height === 1440) ||
                          (sp.width === 3840 && sp.height === 2160)
    list.push({ item: sp, originalIndex: idx, isMacRetina, isWinStandard })
  })
  if (host === 'darwin') {
    list.sort((a, b) => (b.isMacRetina ? 1 : 0) - (a.isMacRetina ? 1 : 0))
  } else if (host === 'win32') {
    list.sort((a, b) => (b.isWinStandard ? 1 : 0) - (a.isWinStandard ? 1 : 0))
  }
  return list
}

function renderFingerprintFields (targetDraft = draft, options = {}) {
  const fingerprint = targetDraft.fingerprint
  if (!fingerprint) return `<div class="notice warning">${icon('sync')}正在生成本机推荐指纹，请稍候。</div>`
  const scope = options.scope ? ` data-fingerprint-scope="${options.scope}"` : ''
  const disabled = options.disabled ? ' disabled' : ''
  const host = getHostPlatform()
  const hostLabel = getHostPlatformLabel(host)
  const select = (path, label, value, optionsList, extraAttr = '') => {
    let hasCurrent = false
    const renderedOptions = optionsList.map(item => {
      const optVal = typeof item === 'object' && item !== null && 'value' in item ? item.value : item
      const optLabel = typeof item === 'object' && item !== null && 'label' in item ? item.label : String(item)
      const selected = String(optVal) === String(value)
      if (selected) hasCurrent = true
      return `<option value="${escapeHTML(optVal)}" ${selected ? 'selected' : ''}>${escapeHTML(optLabel)}</option>`
    })
    const fallbackOption = (!hasCurrent && value !== undefined && value !== null && value !== '')
      ? `<option value="${escapeHTML(Array.isArray(value) ? value.join(', ') : value)}" selected>当前值: ${escapeHTML(Array.isArray(value) ? value.join(', ') : value)}</option>`
      : ''
    return `<label class="field"><span>${label}</span><select${scope}${disabled} data-fingerprint-path="${path}"${typeof value === 'number' ? ' data-fingerprint-type="number"' : ''}${extraAttr}>${fallbackOption}${renderedOptions.join('')}</select></label>`
  }
  const text = (path, label, value, placeholder = '') => `<label class="field"><span>${label}</span><input${scope}${disabled} data-fingerprint-path="${path}" value="${escapeHTML(value ?? '')}" placeholder="${escapeHTML(placeholder)}" spellcheck="false"></label>`
  const toggle = (path, label, checked) => `<label class="radio-card"><input${scope}${disabled} type="checkbox" data-fingerprint-path="${path}" ${checked ? 'checked' : ''}><span>${label}</span></label>`
  const modules = [['ua', '用户代理'], ['clientHints', '客户端提示'], ['locale', '语言'], ['timezone', '时区'], ['navigator', '设备参数'], ['screen', '屏幕参数'], ['webgl', '图形参数'], ['canvas', '画布'], ['audio', '音频'], ['fonts', '字体'], ['webrtc', 'WebRTC'], ['runtimeInspector', '调试器兼容']]

  const presetSelector = `<div class="template-option" style="flex-direction:column;align-items:stretch;gap:12px">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="display:flex;align-items:center;gap:8px">
          <b>指纹方案快速预设 · 一键套用</b>
          <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:4px;font-size:11px;background:#eef4ff;color:#2c5cc5;border:1px solid #c8d9fb">${icon('shield')} 本机宿主已锁定：${hostLabel}</span>
        </div>
        <p>已自动过滤异构系统高危指纹参数，仅展示与当前 ${hostLabel} 物理宿主相容的安全推荐组合方案。</p>
      </div>
      ${options.hideTemplateActions ? '' : `<div>${btn('重新生成', 'regenerate-fingerprint', 'small', 'type="button"')} ${btn('恢复推荐值', 'restore-fingerprint', 'text small', 'type="button"')}</div>`}
    </div>
    <select${scope}${disabled} data-action="fingerprint-preset-change" style="width:100%;height:38px;padding:0 10px;border-radius:6px;border:1px solid #c9d5fa;background:#fff;color:#2c3e50;font-size:12px">
      <option value="">-- 选择推荐指纹组合方案（一键应用 · 仅限 ${hostLabel}） --</option>
      ${getFilteredFingerprintPresets(host).map(p => `<option value="${p.id}">${escapeHTML(p.name)}</option>`).join('')}
    </select>
  </div>`

  const seed = options.hideSeed ? `<div class="info-box">稳定指纹种子：<span class="mono">${escapeHTML(fingerprint.noise.seed)}</span><br>用于保持该环境的指纹稳定，创建后不可编辑。</div>` : text('noise.seed', '指纹种子', fingerprint.noise.seed, '自动生成的独立种子')

  return `${presetSelector}
    <section><h3>浏览器与语言</h3>
      <div class="form-row">
        ${select('browser.userAgent', '用户代理（User-Agent）', fingerprint.browser.userAgent ?? '', getFilteredUserAgentOptions(host))}
        ${select('locale.language', '主要语言（Language）', fingerprint.locale.language, LANGUAGE_OPTIONS, ' data-action="fingerprint-language-change"')}
      </div>
      <div class="form-row">
        ${select('browser.acceptLanguage', '请求语言（Accept-Language）', fingerprint.browser.acceptLanguage, ACCEPT_LANGUAGE_OPTIONS)}
        ${select('locale.languages', '语言列表（Languages）', fingerprint.locale.languages.join(', '), LANGUAGES_LIST_OPTIONS)}
      </div>
      <div class="form-row">
        ${select('locale.timezone', '时区（Timezone）', fingerprint.locale.timezone, TIMEZONE_OPTIONS)}
      </div>
    </section>
    <div class="form-divider"></div>
    <section><h3>设备与屏幕</h3>
      <div class="form-row">
        ${select('hardware.platform', '操作系统平台（Platform）', fingerprint.hardware.platform, getPlatformOptions(host))}
        ${select('hardware.hardwareConcurrency', 'CPU 线程数', fingerprint.hardware.hardwareConcurrency, CPU_OPTIONS)}
      </div>
      <div class="form-row">
        ${select('hardware.deviceMemory', '网页可见内存（GiB）', fingerprint.hardware.deviceMemory, MEMORY_OPTIONS)}
        ${select('screen.deviceScaleFactor', '屏幕缩放比例', fingerprint.screen.deviceScaleFactor, SCALE_OPTIONS)}
      </div>
      <div class="form-row">
        <label class="field" style="grid-column: span 2">
          <span>常用屏幕分辨率预设（一键切换宽、高与可用工作区 · 匹配 ${hostLabel} 比例）</span>
          <select${scope}${disabled} data-action="screen-preset-change">
            <option value="">-- 选择常用分辨率预设组合 --</option>
            ${getFilteredScreenPresets(host).map(({ item, originalIndex }) => `<option value="${originalIndex}">${escapeHTML(item.label)}</option>`).join('')}
          </select>
        </label>
      </div>
      <div class="form-row">
        ${select('screen.width', '屏幕宽度（Width）', fingerprint.screen.width, SCREEN_WIDTH_OPTIONS)}
        ${select('screen.height', '屏幕高度（Height）', fingerprint.screen.height, SCREEN_HEIGHT_OPTIONS)}
      </div>
      <div class="form-row">
        ${select('screen.availWidth', '可用宽度（Avail Width）', fingerprint.screen.availWidth, SCREEN_AVAIL_WIDTH_OPTIONS)}
        ${select('screen.availHeight', '可用高度（Avail Height）', fingerprint.screen.availHeight, SCREEN_AVAIL_HEIGHT_OPTIONS)}
      </div>
    </section>
    <div class="form-divider"></div>
    <section><h3>图形与噪声</h3>
      <div class="form-row">
        <label class="field" style="grid-column: span 2">
          <span>常用 WebGL 显卡预设（一键同步厂商与渲染引擎 · 仅限 ${hostLabel} 显卡架构）</span>
          <select${scope}${disabled} data-action="webgl-preset-change">
            <option value="">-- 选择常见独立显卡 / 核显预设 --</option>
            ${getFilteredWebglPresets(host).map(({ item, originalIndex }) => `<option value="${originalIndex}">${escapeHTML(item.name)}</option>`).join('')}
          </select>
        </label>
      </div>
      <div class="form-row">
        ${select('graphics.webglVendor', 'WebGL 厂商（Vendor）', fingerprint.graphics.webglVendor, getFilteredWebglVendors(host))}
        ${select('graphics.webglRenderer', 'WebGL 渲染器（Renderer）', fingerprint.graphics.webglRenderer, getFilteredWebglRenderers(host))}
      </div>
      ${seed}
      <div class="radio-cards">
        ${toggle('noise.canvas', 'Canvas 噪声', fingerprint.noise.canvas)}
        ${toggle('noise.audio', 'Audio 噪声', fingerprint.noise.audio)}
        ${toggle('noise.rects', '元素尺寸噪声', fingerprint.noise.rects)}
      </div>
    </section>
    <details class="advanced"><summary>指纹模块开关</summary><div class="radio-cards">${modules.map(([key, label]) => toggle(`modules.${key}`, label, fingerprint.modules[key])).join('')}</div><small>关闭模块时使用内核原生行为；配置保存成功不代表已通过所有网站检测。</small></details>
    <div class="form-divider"></div>${btn('检查配置组合', 'preview-fingerprint', 'small', `type="button"${scope}`)}<div data-fingerprint-review="${options.scope || 'wizard'}" role="status" aria-live="polite"></div>`
}

async function reviewFingerprint (targetDraft, proxy, forSave = false) {
  const source = cloneValue(targetDraft.fingerprint)
  let tlsFingerprint = targetDraft.tlsFingerprint
  if (!tlsFingerprint && window.browserApi?.resolveTLSConfig && targetDraft.fingerprint?.browser?.userAgent) {
    try {
      const resolved = await window.browserApi.resolveTLSConfig({ target: targetDraft.fingerprint.browser.userAgent })
      if (resolved?.ok && resolved.config) {
        tlsFingerprint = resolved.config
        targetDraft.tlsFingerprint = tlsFingerprint
      }
    } catch {}
  }
  const preview = await window.browserApi.previewFingerprint({ fingerprint: source, proxy, tlsFingerprint })
  if (!preview?.ok) throw new Error(preview?.error || '无法检查指纹配置，请重试。')
  if (JSON.stringify(source) !== JSON.stringify(targetDraft.fingerprint)) throw new Error('检查期间配置已修改，请重新检查。')
  const node = document.querySelector(`[data-fingerprint-review="${targetDraft === draft ? 'wizard' : 'environment'}"]`)
  if (node) node.innerHTML = `<div class="notice ${preview.canSave ? '' : 'error'}">${[preview.canSave ? '配置组合检查通过。' : '请先修正以下配置：', ...preview.errors, ...preview.changes.map(change => change.message), ...preview.warnings, preview.verification].map(escapeHTML).join('<br>')}</div>`
  if (!forSave) return preview
  if (!preview.canSave) throw new Error(preview.errors.join(''))
  const notices = [...preview.changes.map(change => change.message), ...preview.warnings]
  if (notices.length && !window.confirm(`${notices.join('\n')}\n是否按以上内容保存？`)) return null
  return preview.fingerprint
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
    `用户代理：${tab.userAgent || '使用内核默认值'}${browser.userAgent && (!tab.fingerprint.enabled || !modules.ua) ? `（保存配置未生效：${browser.userAgent}）` : ''}`,
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
    ...(tab.protection ? [
      `按配置启用：${tab.protection.configured.join('、') || '无读回及网络保护'}`,
      `未启用：${tab.protection.inactive.join('、') || '无'}`,
      ...tab.protection.warnings,
      tab.protection.verification
    ] : []),
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
  const mediaBtn = document.getElementById('unified-media')
  const fingerprint = document.getElementById('unified-fingerprint')
  if (mediaBtn) mediaBtn.disabled = !active
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
function environmentEditDialog (environment) {
  const raw = environment.raw
  const running = Boolean(raw?.status === 'open' || environment.state === '运行中')
  const proxy = raw.proxy || { mode: 'direct', server: '', username: '', password: '' }
  const groupOptions = groupNames().map(group => `<option ${group === environment.group ? 'selected' : ''}>${escapeHTML(group)}</option>`).join('')
  const closeAndEditBtn = `<button class="button small" type="button" data-action="close-env-and-edit" data-id="${escapeHTML(environment.id)}" style="margin-left:12px">关闭环境并编辑</button>`
  const proxyFields = running
    ? `<div class="notice warning">${icon('lock')}当前环境正在运行，代理配置已锁定。关闭环境后可编辑代理，修改将在下次启动时生效。${closeAndEditBtn}</div>`
    : `<h3>代理配置</h3><div class="form-row"><label class="field"><span>网络方式</span><select name="proxyMode" id="environment-proxy-mode">${[['direct', '不使用代理（默认）'], ['http', 'HTTP / HTTPS 代理'], ['socks5', 'SOCKS5 代理']].map(([value, label]) => `<option value="${value}" ${proxy.mode === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label><label class="field"><span>代理地址</span><input name="proxyServer" type="url" value="${escapeHTML(proxy.server)}" placeholder="http://服务器地址:端口" spellcheck="false"></label></div><div class="form-row"><label class="field"><span>代理账户（可选）</span><input name="proxyUsername" value="${escapeHTML(proxy.username)}" autocomplete="off"></label><label class="field"><span>代理密码（可选）</span><input name="proxyPassword" type="password" value="${escapeHTML(proxy.password)}" autocomplete="new-password"></label></div><div style="display:flex;align-items:center;justify-content:space-between;margin:8px 0"><small>修改代理后需要重新打开环境，连接失败时不会自动切换为直连。</small><button type="button" class="button small soft" data-action="detect-and-align-ip">探测出口并对齐时区</button></div>`
  const fingerprint = running
    ? `<h3>指纹参数</h3><div class="notice warning">${icon('lock')}当前环境正在运行，指纹参数已锁定。关闭环境后可编辑，修改将在下次启动时生效。${closeAndEditBtn}</div>`
    : `<h3>指纹参数</h3>${renderFingerprintFields(environmentEditDraft, { scope: 'environment', hideTemplateActions: true, hideSeed: true })}`
  const editUrlFields = `<div class="form-row"><label class="field"><span>启动网址预设</span><select data-action="preset-edit-url"><option value="">-- 选择常用网址 --</option>${URL_PRESETS.map(u => `<option value="${u.value}" ${raw.creationUrl === u.value ? 'selected' : ''}>${escapeHTML(u.label)}</option>`).join('')}</select></label><label class="field"><span>启动网址<span class="required">*</span></span><input type="url" name="creationUrl" id="environment-edit-url-input" required value="${escapeHTML(raw.creationUrl)}"><small>只修改下次启动地址；最近访问地址由浏览器自动记录。</small></label></div>`
  return `<form id="environment-edit-form" novalidate><input type="hidden" name="id" value="${escapeHTML(environment.id)}"><input type="hidden" name="metadataRevision" value="${escapeHTML(raw.metadataRevision)}"><input type="hidden" name="profileRevision" value="${escapeHTML(raw.profileRevision)}"><label class="field"><span>环境名称<span class="required">*</span></span><input name="name" required maxlength="80" value="${escapeHTML(raw.profileName)}"></label><div class="form-row"><label class="field"><span>业务分组</span><select name="group">${groupOptions}</select></label><label class="field"><span>保存方式</span><input value="${raw.storage === 'cloud' ? '云同步（当前未接通）' : '仅本地'}" disabled></label></div>${editUrlFields}<div class="form-divider"></div>${proxyFields}<div class="form-divider"></div>${fingerprint}<div class="form-divider"></div><div class="notice">${icon('lock')}环境 ID、数据目录、创建时间、来源配置 ID、配置版本、最近访问地址和稳定指纹种子不可编辑。</div></form>`
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
  if (wizardStep === 1) fields = `<div class="form-row"><label class="field"><span>环境名称<span class="required">*</span></span><input name="name" id="wizard-name-input" required maxlength="80" value="${escapeHTML(draft.name)}" placeholder="例如：美国旗舰店 · 运营"><small>用业务和用途命名，便于团队快速识别环境。</small></label><label class="field"><span>常用环境名称模板</span><select data-action="preset-name"><option value="">-- 选择快速填充环境名称 --</option>${NAME_PRESETS.map(n => `<option value="${escapeHTML(n)}">${escapeHTML(n)}</option>`).join('')}</select><small>点击下拉选项快速填充左侧环境名称，也可继续编辑。</small></label></div><div class="form-row"><label class="field"><span>业务分组</span><select name="group">${groupNames().map(g => `<option ${g === draft.group ? 'selected' : ''}>${escapeHTML(g)}</option>`).join('')}</select></label><label class="field"><span>负责人</span><select><option>林沐（我）</option><option>陈悦</option><option>王宁</option></select></label></div><div class="form-row"><label class="field"><span>启动网址预设</span><select data-action="preset-url"><option value="">-- 选择常用业务或检测网址 --</option>${URL_PRESETS.map(u => `<option value="${u.value}" ${draft.url === u.value ? 'selected' : ''}>${escapeHTML(u.label)}</option>`).join('')}</select><small>下拉快速选取常用网址，支持在右侧输入框自定义。</small></label><label class="field"><span>启动网址（确认地址）<span class="required">*</span></span><input type="url" id="wizard-url-input" value="${escapeHTML(draft.url)}" name="url" required><small>示例网址，创建后可在环境中随时调整。</small></label></div><div class="form-divider"></div><label class="field"><span>环境数据保存方式</span></label><div class="radio-cards"><label class="radio-card"><input name="storage" type="radio" value="local" ${draft.storage === 'local' ? 'checked' : ''}><span>仅本地<small>数据保存在这台设备上，不上传登录会话。</small></span></label><label class="radio-card"><input name="storage" type="radio" value="cloud" ${draft.storage === 'cloud' ? 'checked' : ''}><span>启用云同步<small>供授权成员交接；跨系统恢复需要兼容性检查。</small></span></label></div><div class="notice">${icon('shield')}新环境默认仅负责人和管理员可以访问，可在创建后调整授权。</div>`
  if (wizardStep === 2) fields = `<label class="field"><span>网络方式（代理可选）</span><select name="proxyMode" id="wizard-proxy-mode">${[['direct', '不使用代理（默认）'], ['http', 'HTTP / HTTPS 代理'], ['socks5', 'SOCKS5 代理']].map(([value, label]) => `<option value="${value}" ${proxy.mode === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label>${proxy.mode === 'direct' ? `<div class="notice">${icon('globe')}使用本机网络，无需选择代理或检查代理连接。</div>` : `<div class="form-row"><label class="field"><span>常用代理资源预设</span><select data-action="preset-proxy"><option value="">-- 选择预设代理快捷填入 --</option>${PROXY_PRESETS.filter(p => p.mode === proxy.mode).map(p => `<option value="${escapeHTML(p.server)}">${escapeHTML(p.label)}</option>`).join('')}</select><small>可直接从常用资源下拉选取，或在右侧输入框填写真实代理。</small></label><label class="field"><span>代理地址<span class="required">*</span></span><input name="proxyServer" id="wizard-proxy-server-input" type="url" required value="${escapeHTML(proxy.server)}" placeholder="${proxy.mode === 'socks5' ? 'socks5://服务器地址:端口' : 'http://服务器地址:端口'}" spellcheck="false"><small>填写真实代理地址和端口，不在地址中填写账户或密码。</small></label></div><div class="form-row"><label class="field"><span>代理账户（可选）</span><input name="proxyUsername" value="${escapeHTML(proxy.username)}" autocomplete="off"></label><label class="field"><span>代理密码（可选）</span><input name="proxyPassword" type="password" value="${escapeHTML(proxy.password)}" autocomplete="new-password"></label></div><div class="notice warning">${icon('alert')}代理会保存在环境快照中并用于真实网页请求。连接失败时不会自动使用本机网络。</div>`}<div class="form-divider"></div><div class="notice">${icon('fingerprint')}语言与时区沿用默认指纹模板，不会根据代理地址自动推断。</div><div class="notice warning">${icon('alert')}网络出口位置尚未验证。创建后请在同一环境中检查公网 IP 地理位置，并将语言、地区和时区作为一组校验；代理地址本身不能证明出口所在地区。</div>`
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
  return `<div class="detail-kv"><span>配置版本</span><b>${escapeHTML(environment.profileRevision)}</b><span>浏览器内核</span><b>${escapeHTML(`${browser.family || 'Chrome'} · ${browser.chromiumMajor || '未知'} ${browser.userAgent ? '· 自定义 UA' : '· 默认 UA'}`)}</b><span>语言与时区</span><b>${escapeHTML(`${locale.language || '未设置'} · ${locale.timezone || '未设置'}`)}</b><span>语言列表</span><b>${escapeHTML((locale.languages || []).join('、') || '未设置')}</b><span>平台与硬件</span><b>${escapeHTML(`${hardware.platform || '未设置'} · ${hardware.hardwareConcurrency || '未知'} 线程 · ${hardware.deviceMemory || '未知'} GiB`)}</b><span>屏幕</span><b>${escapeHTML(`${screen.width || '未知'} × ${screen.height || '未知'} · 缩放 ${screen.deviceScaleFactor || '未知'}`)}</b><span>图形</span><b>${escapeHTML(`${graphics.webglVendor || '使用原生值'} · ${graphics.webglRenderer || '使用原生值'}`)}</b><span>噪声种子</span><b class="mono">${escapeHTML(noise.seed || '未设置')}</b><span>启用模块</span><b>${escapeHTML(enabledModules.join('、') || '无')}</b></div><div class="notice">${icon('fingerprint')}指纹快照保存在该环境自己的配置中；修改浏览器配置模板不会改变此快照。</div>`
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
  const body = diagnostic ? diagnosticBody : detailTab === 'fingerprint' ? `<h3>当前环境指纹快照</h3>${fingerprintDetail(e)}` : detailTab === 'activity' ? `<h3>本地环境活动</h3>${activityDetail(e)}` : overview
  const footer = diagnostic ? btn('关闭', 'close-overlay') + btn('重新检查', 'retry-diagnostic', 'primary') : e.state === '运行中' ? btn('关闭环境', 'close-env', '', `data-id="${e.id}"`, 'stop') + btn('编辑环境', 'edit-environment', 'small', `data-id="${e.id}"`) + btn('进入环境', 'launch', 'primary', `data-id="${e.id}"`, 'play') : btn('关闭详情', 'close-overlay') + btn('编辑环境', 'edit-environment', 'small', `data-id="${e.id}"`) + btn('打开环境', 'launch', 'primary', `data-id="${e.id}"`, 'play')
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
  const root = document.getElementById('overlay-root')
  if (root) root.innerHTML = html
  document.body.style.overflow = 'hidden'
  const focus = document.querySelector('#overlay-root input, #overlay-root button, #overlay-root select')
  if (focus) focus.focus()
}
function closeOverlay() {
  const root = document.getElementById('overlay-root')
  if (root) root.innerHTML = ''
  document.body.style.overflow = ''
  if (lastFocus && lastFocus.isConnected) lastFocus.focus()
}
function dialog(title, body, footer = btn('知道了', 'close-overlay', 'primary'), className = '') {
  showOverlay(`<div class="dialog-backdrop" data-dismiss="dialog"><section class="dialog ${className}" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div class="card-head"><h2 id="dialog-title">${title}</h2><button class="icon-button" aria-label="关闭对话框" data-action="close-overlay">${icon('close')}</button></div><div class="card-body">${body}</div><div class="form-footer"><span></span><div class="actions">${footer}</div></div></section></div>`)
}
function onboarding() {
  showOverlay(`<div class="dialog-backdrop"><section class="dialog onboarding" role="dialog" aria-modal="true" aria-labelledby="onboarding-title"><div class="onboarding-grid"><div class="onboarding-story"><span class="brand-mark">${icon('fingerprint')}</span><h2>一个工作空间，<br>有序开展业务。</h2><p>从本地开始，按需邀请同事和开启云同步。</p><ul><li>每个业务保留独立会话</li><li>团队成员按授权访问</li><li>异常可诊断，数据可恢复</li></ul></div><form class="onboarding-form" id="onboarding-form"><h2 id="onboarding-title">设置你的工作空间</h2><p>这是首次使用流程演示，不会创建真实账号。</p><label class="field"><span>工作空间名称<span class="required">*</span></span><input required name="workspace" value="远航出海团队" maxlength="80"></label><label class="field"><span>主要业务</span><select><option>跨境电商与品牌运营</option><option>营销与内容协作</option><option>客户支持</option></select></label><div class="radio-cards"><label class="radio-card"><input type="radio" name="mode" checked><span>先使用本地环境<small>默认不上传登录数据，稍后按需开启同步。</small></span></label></div><button class="button primary" type="submit">开始创建首个环境 ${icon('arrow')}</button><button class="button text" type="button" data-action="close-overlay" style="margin-top:10px">稍后设置</button></form></div></section></div>`)
}
function render() {
  closeOverlay()
  route = location.hash.slice(1) || 'overview'
  const parent = ['create', 'detail', 'diagnostic', 'empty', 'browser'].includes(route) ? 'environments' : route === 'onboarding' ? 'overview' : route
  document.getElementById('navigation').innerHTML = navItems.map(([id, title, symbol]) => `<a class="nav-link ${id === parent ? 'active' : ''}" href="#${id}" data-route="${id}" ${id === parent ? 'aria-current="page"' : ''}>${icon(symbol)}<span>${title}</span>${id === 'proxies' ? '<span class="nav-count">1</span>' : ''}</a>`).join('')
  document.getElementById('breadcrumb').textContent = (navItems.find(n => n[0] === parent) || navItems[0])[1]
  document.getElementById('sidebar-quota').textContent = `${environments.length} / 300`
  const creatorViewFn = typeof window !== 'undefined' && typeof window.creatorPage === 'function' ? window.creatorPage : (typeof creatorPage === 'function' ? creatorPage : overview)
  const views = { overview, environments: environmentPage, creator: creatorViewFn, create: createPage, proxies: proxiesPage, members: membersPage, audit: auditPage, billing: billingPage, settings: settingsPage, browser: browserPage, detail: environmentPage, diagnostic: environmentPage, empty: () => environmentPage(true), onboarding: overview }
  document.getElementById('main').innerHTML = (views[route] || overview)()
  window.scrollTo(0, 0)
  if (route === 'creator') {
    if (typeof window !== 'undefined' && typeof window.attachCreatorEvents === 'function') window.attachCreatorEvents()
    else if (typeof attachCreatorEvents === 'function') attachCreatorEvents()
  }
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
  if (target.dataset.route) {
    event.preventDefault()
    return navigate(target.dataset.route)
  }
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
    case 'edit-environment': {
      if (!e) return toast('找不到该环境，请刷新后重试。')
      currentEnvironment = e
      environmentEditDraft = { fingerprint: cloneValue(e.raw.fingerprint) }
      dialog(`编辑“${escapeHTML(e.name)}”`, environmentEditDialog(e), '<button class="button" type="button" data-action="close-overlay">取消</button><button class="button primary" type="submit" form="environment-edit-form">保存修改</button>', 'environment-edit')
      break
    }
    case 'close-env-and-edit': {
      if (!e) return toast('找不到该环境，请刷新后重试。')
      void (async () => {
        try {
          const response = await window.browserApi.closeEnvironment(e.id)
          if (!response?.ok) throw new Error(response?.error || '关闭浏览器环境失败。')
          applyEnvironmentSnapshot(response.environments)
          const updated = environments.find(item => item.id === e.id) || e
          currentEnvironment = updated
          environmentEditDraft = { fingerprint: cloneValue(updated.raw.fingerprint) }
          dialog(`编辑“${escapeHTML(updated.name)}”`, environmentEditDialog(updated), '<button class="button" type="button" data-action="close-overlay">取消</button><button class="button primary" type="submit" form="environment-edit-form">保存修改</button>', 'environment-edit')
          toast('环境已关闭，现可编辑代理与指纹参数。')
        } catch (error) {
          toast(error?.message || '关闭环境失败，请重试。')
        }
      })()
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
    case 'preview-fingerprint': {
      const targetDraft = target.dataset.fingerprintScope === 'environment' ? environmentEditDraft : draft
      void (async () => {
        try {
          const proxy = targetDraft === draft ? draft.proxy : { mode: new FormData(document.getElementById('environment-edit-form')).get('proxyMode') }
          await reviewFingerprint(targetDraft, proxy)
        } catch (error) { toast(error?.message || '无法检查指纹配置，请重试。') }
      })()
      break
    }
    case 'detect-and-align-ip': {
      void (async () => {
        try {
          toast('正在探测出口网络 IP 与地理时区...')
          const res = await window.browserApi.detectExitIp()
          if (!res?.ok || !res?.data) throw new Error(res?.error || '无法解析出口 IP')
          const geo = res.data
          const timezoneSelect = document.getElementById('field-environment-timezone') || document.querySelector('select[name="timezone"]')
          if (timezoneSelect && geo.timezone) {
            timezoneSelect.value = geo.timezone
          }
          if (typeof environmentEditDraft === 'object' && environmentEditDraft) {
            if (!environmentEditDraft.locale) environmentEditDraft.locale = {}
            if (geo.timezone) environmentEditDraft.locale.timezone = geo.timezone
            if (geo.locale) {
              environmentEditDraft.locale.language = geo.locale.language
              environmentEditDraft.locale.languages = [...geo.locale.languages]
            }
          }
          toast(`出口 IP 探测成功: ${geo.ip} (${geo.country} · ${geo.city})，已自动对齐为 ${geo.timezone} 时区！`)
        } catch (err) {
          toast(err?.message || '探测出口 IP 失败，请检查网络。')
        }
      })()
      break
    }
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
    default:
      if (typeof window.handleCreatorAction === 'function') {
        void window.handleCreatorAction(action, target)
      }
      break
  }
})

function handleFingerprintFieldEvent (event) {
  const target = event.target
  if (!target.dataset.fingerprintPath) return
  const targetDraft = target.dataset.fingerprintScope === 'environment' ? environmentEditDraft : draft
  if (!targetDraft?.fingerprint) return
  let value = target.type === 'checkbox' ? target.checked : target.value
  if (target.dataset.fingerprintType === 'number') value = target.value === '' ? '' : Number(target.value)
  if (target.dataset.fingerprintPath === 'browser.userAgent' && value === '') value = null
  if (target.dataset.fingerprintPath === 'locale.languages') {
    value = Array.isArray(value) ? value : String(value).split(/[,，]/).map(item => item.trim()).filter(Boolean)
  }
  setFingerprintField(target.dataset.fingerprintPath, value, targetDraft)
  const review = document.querySelector(`[data-fingerprint-review="${targetDraft === draft ? 'wizard' : 'environment'}"]`)
  if (review) review.textContent = '配置已修改，请重新检查。'
}

document.addEventListener('input', event => {
  if (event.target.id === 'env-search') { searchTerm = event.target.value; environmentPageNumber = 1; refreshRows() }
  if (event.target.name === 'name' && event.target.closest('#wizard-form')) document.getElementById('preview-name').textContent = event.target.value
  if (event.target.name === 'url' && event.target.closest('#wizard-form')) draft.url = event.target.value
  handleFingerprintFieldEvent(event)
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

  const targetDraft = target.dataset.fingerprintScope === 'environment' ? environmentEditDraft : draft
  if (target.dataset.action === 'fingerprint-preset-change' && target.value) {
    applyFingerprintPreset(target.value, targetDraft)
    return
  }
  if (target.dataset.action === 'screen-preset-change' && target.value !== '') {
    applyScreenPreset(Number(target.value), targetDraft)
    return
  }
  if (target.dataset.action === 'webgl-preset-change' && target.value !== '') {
    applyWebglPreset(Number(target.value), targetDraft)
    return
  }
  if (target.dataset.action === 'fingerprint-language-change' && target.value) {
    applyLanguagePreset(target.value, targetDraft)
    return
  }
  if (target.dataset.action === 'preset-name' && target.value) {
    draft.name = target.value
    const input = document.getElementById('wizard-name-input')
    if (input) input.value = target.value
    const previewName = document.getElementById('preview-name')
    if (previewName) previewName.textContent = target.value
    return
  }
  if (target.dataset.action === 'preset-url' && target.value) {
    draft.url = target.value
    const input = document.getElementById('wizard-url-input')
    if (input) input.value = target.value
    return
  }
  if (target.dataset.action === 'preset-proxy' && target.value) {
    draft.proxy.server = target.value
    const input = document.getElementById('wizard-proxy-server-input')
    if (input) input.value = target.value
    const previewProxy = document.getElementById('preview-proxy')
    if (previewProxy) previewProxy.textContent = target.value
    return
  }
  if (target.dataset.action === 'preset-edit-url' && target.value) {
    const input = document.getElementById('environment-edit-url-input')
    if (input) input.value = target.value
    return
  }

  handleFingerprintFieldEvent(event)
})
document.addEventListener('submit', async event => {
  event.preventDefault()
  const formId = event.target.getAttribute('id')
  if (formId === 'group-create-form') {
    try {
      const data = new FormData(event.target)
      await applyGroupResponse(await window.browserApi.createGroup(String(data.get('name') || '').trim()))
      showGroupManager()
      toast('业务分组已创建。')
    } catch (error) { toast(error?.message || '创建业务分组失败，请重试。') }
    return
  }
  if (formId === 'group-edit-form') {
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
  if (formId === 'environment-group-form') {
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
  if (formId === 'environment-edit-form') {
    try {
      const data = new FormData(event.target)
      const environment = environments.find(item => item.id === data.get('id'))
      if (!environment) throw new Error('找不到该环境，请刷新后重试。')
      const update = {
        id: data.get('id'),
        name: String(data.get('name') || '').trim(),
        group: data.get('group'),
        creationUrl: String(data.get('creationUrl') || '').trim(),
        metadataRevision: Number(data.get('metadataRevision')),
        profileRevision: Number(data.get('profileRevision'))
      }
      const isRunning = Boolean(environment.raw.status === 'open' || environment.state === '运行中')
      if (!isRunning) {
        const mode = data.get('proxyMode')
        update.proxy = {
          mode,
          server: mode === 'direct' ? '' : String(data.get('proxyServer') || '').trim(),
          username: mode === 'direct' ? '' : String(data.get('proxyUsername') || ''),
          password: mode === 'direct' ? '' : String(data.get('proxyPassword') || '')
        }
        if (mode !== 'direct') {
          try {
            const address = new URL(update.proxy.server)
            if (!(mode === 'socks5' ? ['socks5:', 'socks5h:'] : ['http:', 'https:']).includes(address.protocol) || !address.hostname || (mode === 'socks5' && !address.port) || address.username || address.password) throw new Error()
          } catch {
            toast('请填写与所选代理类型一致的有效地址，并在独立字段中填写账户和密码。')
            return
          }
        }
        if (JSON.stringify(environmentEditDraft?.fingerprint) !== JSON.stringify(environment.raw.fingerprint)) {
          const fingerprint = await reviewFingerprint(environmentEditDraft, update.proxy, true)
          if (!fingerprint) return
          update.fingerprint = fingerprint
          if (environmentEditDraft?.tlsFingerprint) {
            update.tlsFingerprint = environmentEditDraft.tlsFingerprint
          }
        }
      } else {
        if (JSON.stringify(environmentEditDraft?.fingerprint) !== JSON.stringify(environment.raw.fingerprint)) {
          toast('请先关闭浏览器环境，再修改代理或指纹参数。')
          return
        }
      }
      const response = await window.browserApi.updateEnvironment(update)
      if (!response?.ok) throw new Error(response?.error || '编辑浏览器环境失败，请刷新后重试。')
      applyEnvironmentSnapshot(response.environments)
      environmentEditDraft = null
      closeOverlay()
      render()
      toast('浏览器环境已更新。')
    } catch (error) { toast(error?.message || '编辑浏览器环境失败，请刷新后重试。') }
    return
  }
  if (formId === 'wizard-form') {
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
      const fingerprint = await reviewFingerprint(draft, profile.proxy, true)
      if (!fingerprint) return
      profile.fingerprint = fingerprint
      if (draft.tlsFingerprint) {
        profile.tlsFingerprint = draft.tlsFingerprint
      }
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
  if (formId === 'invite-form') { const data = new FormData(event.target); members.push([String(data.get('name')).trim(), String(data.get('email')).trim(), data.get('role'), data.get('group'), '等待接受邀请', '待接受']); closeOverlay(); render(); toast('已加入邀请演示列表，没有发送邮件。') }
  if (formId === 'onboarding-form') { closeOverlay(); void startCreateWizard(); toast('已完成工作空间设置演示，继续创建首个环境。') }
  if (formId === 'address-form') toast('地址已输入；原型不会访问真实网站。')
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
document.getElementById('unified-media')?.addEventListener('click', event => {
  const rect = event.currentTarget.getBoundingClientRect()
  void window.browserApi?.toggleMediaPopover?.({
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height
  })
})
window.browserApi?.onMediaCountChanged?.(({ tabId, count }) => {
  const active = activeUnifiedTab()
  if (active && active.id === tabId) {
    const badge = document.getElementById('unified-media-badge')
    const btn = document.getElementById('unified-media')
    if (badge) {
      badge.textContent = count
      badge.style.display = count > 0 ? 'inline-block' : 'none'
    }
    btn?.classList.toggle('has-media', count > 0)
  }
})
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

if (typeof window !== 'undefined') {
  window.dialog = dialog
  window.showOverlay = showOverlay
  window.closeOverlay = closeOverlay
  window.toast = toast
}
