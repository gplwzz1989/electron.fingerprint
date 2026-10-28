const path = require('node:path')
const fs = require('node:fs/promises')
const { randomUUID } = require('node:crypto')
const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron/main')
const { TabBrowser } = require('./browser-tabs')
const { EnvironmentRepository } = require('./environment-repository')
const { GroupRepository, DEFAULT_GROUP_NAME } = require('./group-repository')
const { ProfileRepository } = require('./profile-repository')
const { previewFingerprintProfile, assertFingerprintSave } = require('./fingerprint-review')
const {
  assertTLSFingerprintRuntimeVersion,
  resolveTLSConfigForBrowser,
  getTLSVersionPreset,
  CHROME_TLS_VERSION_PRESETS
} = require('./tls-fingerprint')
const { dataRoot: resolveDataRoot } = require('./data-directory')
const {
  DEFAULT_URL,
  ProfileValidationError,
  createProfileRecord,
  getDefaultProfile,
  getPresetTemplates,
  getPresetTemplateById,
  normalizeUrl
} = require('./profile-store')
const { AutomationServer } = require('./automation-server')
const { detectExitIp, alignFingerprintWithGeo } = require('./geo-ip')
const { generateRandomHardwareProfile, getRecommendedGPUList } = require('./webgl-topology')
const {
  humanoidClick,
  humanoidType,
  humanoidImeType,
  humanoidDrag,
  humanoidScroll
} = require('./humanoid-actions')
const { PlatformAutomationManager } = require('./platform-automation')
const { isXPlatformUrl } = require('./platform-automation/platforms/x/selectors')
const { generateStealthScript } = require('./stealth-engine')
const { getClientConfig } = require('./client-config')
let clientConfig = null

let initialDataRoot = resolveDataRoot()
const fingerprintRuntime = { platform: process.platform, chromiumVersion: process.versions.chrome }
// WebGPU 防护由所属 Session 的图形模块控制，避免影响未启用保护的环境。
// 禁用 Blink 自动化受控特性，规避各类风控与 BotGuard 对自动化标志的底层探测
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled')

// 全局 WebContents 增强：禁用后台限速，并对 webview 页面自动装载可见性与焦点保持脚本
app.on('web-contents-created', (_event, contents) => {
  if (typeof contents.setBackgroundThrottling === 'function') {
    contents.setBackgroundThrottling(false)
  }
  if (typeof contents.getType === 'function' && contents.getType() === 'webview') {
    contents.on('dom-ready', () => {
      void contents.executeJavaScript(generateStealthScript()).catch(() => {})
    })
  }
})

try {
  clientConfig = getClientConfig({ packaged: app.isPackaged })
  if (!process.env.FP_BROWSER_DATA_DIR && clientConfig.environment !== 'prod') initialDataRoot = path.join(initialDataRoot, clientConfig.environment)
  app.setPath('userData', initialDataRoot)
  app.setPath('sessionData', initialDataRoot)
} catch {
  dialog.showErrorBox('应用数据目录不可用', '无法创建应用数据目录，请检查用户目录权限或设置可写的数据目录。')
  app.exit(1)
}

let dashboardWindow = null
let profileRepository = null
let environmentRepository = null
let groupRepository = null
let tabBrowser = null
let automationServer = null
let xGrokAutomation = null
let xGrokPanelWindow = null
let xGrokPanelReady = null
let xGrokPanelEnvironmentId = null
let mediaHub = null
let creatorHub = null
let quitting = false
let startup = Promise.resolve()

const APPLICATION_ID = 'com.qijie.fingerprintbrowser' + (clientConfig?.environment && clientConfig.environment !== 'prod' ? `.${clientConfig.environment}` : '')
const APPLICATION_ICON = process.platform === 'win32'
  ? path.join(__dirname, 'assets', 'saas.ico')
  : path.join(__dirname, 'assets', 'saas.png')

function hideXGrokPanel () {
  if (xGrokPanelWindow && !xGrokPanelWindow.isDestroyed() && xGrokPanelWindow.isVisible()) {
    xGrokPanelWindow.hide()
  }
  xGrokPanelEnvironmentId = null
}

function ensureXGrokPanelWindow () {
  if (xGrokPanelWindow && !xGrokPanelWindow.isDestroyed()) return xGrokPanelWindow
  if (!dashboardWindow || dashboardWindow.isDestroyed()) {
    throw new ProfileValidationError('管理窗口尚未准备好，请稍后重试。')
  }

  const panel = new BrowserWindow({
    parent: dashboardWindow,
    width: 380,
    height: 560,
    show: false,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'renderer', 'x-grok-panel-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })
  xGrokPanelWindow = panel
  panel.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  panel.webContents.on('will-navigate', event => event.preventDefault())
  panel.on('closed', () => {
    if (xGrokPanelWindow === panel) {
      xGrokPanelWindow = null
      xGrokPanelReady = null
      xGrokPanelEnvironmentId = null
    }
  })
  xGrokPanelReady = panel.loadFile(path.join(__dirname, 'renderer', 'x-grok-panel.html'))
    .catch(error => {
      if (xGrokPanelWindow === panel) {
        panel.destroy()
        xGrokPanelWindow = null
        xGrokPanelReady = null
      }
      throw error
    })
  return panel
}

function positionXGrokPanelWindow () {
  if (!dashboardWindow || dashboardWindow.isDestroyed() ||
      !xGrokPanelWindow || xGrokPanelWindow.isDestroyed()) return
  const [parentX, parentY] = dashboardWindow.getPosition()
  const [parentWidth] = dashboardWindow.getSize()
  const [panelWidth] = xGrokPanelWindow.getSize()
  xGrokPanelWindow.setPosition(
    Math.max(0, parentX + parentWidth - panelWidth - 18),
    Math.max(0, parentY + 88)
  )
}

async function showXGrokPanel (environmentId) {
  const panel = ensureXGrokPanelWindow()
  if (xGrokPanelReady) await xGrokPanelReady

  if (panel.isVisible() && xGrokPanelEnvironmentId === environmentId) {
    hideXGrokPanel()
    return false
  }

  xGrokPanelEnvironmentId = environmentId
  panel.webContents.send('x-grok:panel-environment', environmentId)
  positionXGrokPanelWindow()
  panel.show()
  panel.focus()
  return true
}

async function acquireClientLock () {
  // 客户端锁与配置、备用数据目录及发行包位置无关，同一系统用户只启动一个客户端。
  const lockRoot = path.join(app.getPath('temp'), `${APPLICATION_ID}-${process.getuid ? process.getuid() : 'user'}`)
  await fs.mkdir(lockRoot, { recursive: true })
  const dataRoot = app.getPath('userData')
  const applicationName = app.getName()
  try {
    app.setName(APPLICATION_ID)
    app.setPath('userData', lockRoot)
    return app.requestSingleInstanceLock()
  } finally {
    app.setPath('userData', dataRoot)
    app.setName(applicationName)
  }
}

async function activateClient () {
  try {
    await startup
    if (quitting) return
    if (!dashboardWindow || dashboardWindow.isDestroyed()) await createDashboard()
    if (dashboardWindow.isMinimized()) dashboardWindow.restore()
    dashboardWindow.show()
    dashboardWindow.focus()
  } catch {
    console.error('激活客户端失败，请从任务栏重新打开窗口。')
  }
}

async function ensureUserDataPath () {
  const configuredPath = process.env.FP_BROWSER_DATA_DIR?.trim()
  const candidates = [configuredPath ? path.resolve(configuredPath) : initialDataRoot]

  for (const candidate of candidates) {
    try {
      await fs.mkdir(candidate, { recursive: true })
      const probePath = path.join(candidate, `.write-check-${process.pid}`)
      const handle = await fs.open(probePath, 'w')
      await handle.close()
      await fs.unlink(probePath)
      if (candidate !== app.getPath('userData')) {
        app.setPath('userData', candidate)
        app.setPath('sessionData', candidate)
        console.warn(`[启动应用] 默认数据目录不可写，已切换到：${candidate}`)
      }
      return candidate
    } catch {
      console.warn(`[启动应用] 应用数据目录不可写：${candidate}`)
    }
  }
  throw new ProfileValidationError('应用数据目录不可写，请检查用户目录权限或设置 FP_BROWSER_DATA_DIR。')
}

function startupErrorMessage (error) {
  if (error instanceof ProfileValidationError) return error.message
  if (error?.code === 'EACCES' || error?.code === 'EPERM') return '应用数据目录不可写，请检查用户目录权限后重试。'
  return '无法读取或初始化浏览器配置，请检查应用数据目录后重试。'
}

function clone (value) {
  return JSON.parse(JSON.stringify(value))
}

function errorResult (context, error, fallback) {
  console.error(`[${context}]`, error)
  const message = error instanceof ProfileValidationError || error?.result ? error.message : fallback
  return { ok: false, error: message, ...(error?.result || {}) }
}

function profileSeedPath () {
  return path.join(__dirname, 'profiles', 'win11-cn-desktop.json')
}

function defaultUserAgent () {
  const chromeVersion = process.versions.chrome || '138.0.0.0'
  const platform = process.platform === 'win32'
    ? 'Windows NT 10.0; Win64; x64'
    : process.platform === 'darwin'
      ? 'Macintosh; Intel Mac OS X 10_15_7'
      : 'X11; Linux x86_64'
  return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`
}

async function loadProfiles () {
  const userDataPath = app.getPath('userData')
  profileRepository = new ProfileRepository(path.join(userDataPath, 'profiles.json'))
  return await profileRepository.load([])
}

async function launchProfile (payload) {
  if (!payload || typeof payload !== 'object') throw new ProfileValidationError('启动参数无效。')
  const profile = profileRepository.list().find(item => item.id === payload.id)
  if (!profile) throw new ProfileValidationError('找不到要启动的浏览器配置。')
  const targetUrl = normalizeUrl(payload.url === undefined ? profile.url : String(payload.url).trim())
  await groupRepository.ensure(profile.group)
  return await tabBrowser.open(profile, targetUrl, payload.operationId)
}

function registerIpc () {
  const trustedPages = new Set([
    clientConfig.appUrl,
    require('node:url').pathToFileURL(path.join(__dirname, 'renderer', 'index.html')).href,
    require('node:url').pathToFileURL(path.join(__dirname, 'renderer', 'browser.html')).href,
    require('node:url').pathToFileURL(path.join(__dirname, 'renderer', 'x-grok-panel.html')).href,
    require('node:url').pathToFileURL(path.join(__dirname, 'media-hub', 'popover.html')).href
  ])
  // 只有配置的工作空间地址、本地管理页和标签栏可调用应用接口，其他远程网页不能操作标签。
  function assertTrusted (event) {
    if (quitting) throw new ProfileValidationError('应用正在退出，请稍后重新打开。')
    const trustedUrl = event.senderFrame?.url?.split('#', 1)[0]
    if (![dashboardWindow?.webContents, tabBrowser?.window?.webContents, xGrokPanelWindow?.webContents].includes(event.sender) ||
        event.senderFrame !== event.sender.mainFrame || !trustedPages.has(trustedUrl)) {
      throw new ProfileValidationError('当前页面无权操作浏览器配置或标签。')
    }
  }
  ipcMain.handle('workspace:runtime', async event => {
    try { assertTrusted(event); return { ok: true, platform: process.platform, chromiumVersion: process.versions.chrome, environment: clientConfig.environment } } catch { return { ok: false, error: '当前页面无权访问本机能力。' } }
  })
  ipcMain.handle('workspace:launch', async (event, payload) => {
    try {
      assertTrusted(event)
      if (!payload || !/^[a-zA-Z0-9-]+$/.test(payload.workspaceId) || !/^[a-zA-Z0-9-]+$/.test(payload.environmentId)) throw new ProfileValidationError('环境标识无效。')
      const cookies = await event.sender.session.cookies.get({ url: clientConfig.appUrl })
      const cookie = cookies.filter(item => item.name === 'qijie_session').map(item => `${item.name}=${item.value}`).join('; ')
      const meResponse = await fetch(new URL('/api/auth/me', clientConfig.appUrl), { headers: { Cookie: cookie }, redirect: 'error' })
      const me = await meResponse.json()
      if (!meResponse.ok || !me.ok) throw new ProfileValidationError('登录已失效，请重新登录。')
      const response = await fetch(new URL(`/api/workspaces/${payload.workspaceId}/environments/${payload.environmentId}/launch`, clientConfig.appUrl), {
        method: 'POST', redirect: 'error', headers: { Cookie: cookie, Origin: new URL(clientConfig.appUrl).origin, 'X-CSRF-Token': me.csrf, 'Content-Type': 'application/json' }, body: '{}'
      })
      const data = await response.json()
      if (!response.ok || !data.ok) throw new ProfileValidationError(data.message || '无法读取环境启动配置。')
      const profile = createProfileRecord(data.profile)
      assertFingerprintSave(profile.fingerprint, fingerprintRuntime, profile.proxy)
      let existing = environmentRepository.list().find(item => item.profileId === profile.id)
      if (existing) {
        const configurationChanged = JSON.stringify(existing.fingerprint) !== JSON.stringify(profile.fingerprint) || JSON.stringify(existing.proxy) !== JSON.stringify(profile.proxy)
        if (configurationChanged && existing.status === 'open') throw new ProfileValidationError('服务端环境配置已变化，请先关闭本机环境后重试。')
        if (configurationChanged || existing.profileName !== profile.name || existing.creationUrl !== profile.url) {
          existing = await environmentRepository.updateProfile(existing.id, { name: profile.name, url: profile.url, ...(configurationChanged ? { fingerprint: profile.fingerprint, proxy: profile.proxy } : {}), expectedMetadataRevision: existing.metadataRevision, expectedProfileRevision: existing.profileRevision }, { preserveFingerprint: true })
          tabBrowser.updateEnvironmentProfile(existing)
        }
        const tabIds = tabBrowser.tabIdsForEnvironment(existing.id)
        if (tabIds.length) { tabBrowser.select(tabIds[0]); return { ok: true, environmentId: existing.id } }
        return { ok: true, ...await tabBrowser.reopen(existing.id) }
      }
      const environment = await environmentRepository.create(profile, profile.url, { preserveFingerprint: true })
      return { ok: true, ...await tabBrowser.openEnvironment(environment) }
    } catch (error) {
      return { ok: false, error: error instanceof ProfileValidationError ? error.message : '环境启动失败，请检查网络与本机运行时后重试。' }
    }
  })
  for (const action of ['list', 'select', 'close', 'navigate', 'new-page', 'devtools', 'dashboard']) {
    ipcMain.handle(`tabs:${action}`, async (event, payload) => {
      try {
        assertTrusted(event)
        let actionResult = {}
        if (action === 'select') tabBrowser.select(payload)
        if (action === 'close') {
          await tabBrowser.close(payload)
          dashboardWindow?.webContents.send('environments:changed')
        }
        if (action === 'navigate') {
          await tabBrowser.navigate(payload)
          dashboardWindow?.webContents.send('environments:changed')
        }
        if (action === 'devtools') tabBrowser.openDevTools(payload)
        if (action === 'new-page') {
          actionResult = await tabBrowser.openPageTab(payload?.environmentId, payload?.url)
          dashboardWindow?.webContents.send('environments:changed')
        }
        if (action === 'dashboard') {
          if (!dashboardWindow || dashboardWindow.isDestroyed()) await createDashboard()
          tabBrowser.selectDashboard()
          dashboardWindow.show()
          dashboardWindow.focus()
        }
        return { ok: true, ...actionResult, ...tabBrowser.snapshot() }
      } catch (error) {
        return errorResult('操作标签', error, '标签操作失败，请重试。')
      }
    })
  }
  ipcMain.handle('presets:list', async event => {
    try {
      assertTrusted(event)
      return { ok: true, presets: getPresetTemplates() }
    } catch (error) {
      return errorResult('读取预设模板', error, '读取预设模板失败。')
    }
  })

  ipcMain.handle('proxy:detect-ip', async (event, options) => {
    try {
      assertTrusted(event)
      const data = await detectExitIp(options)
      return { ok: true, data }
    } catch (error) {
      return errorResult('探测出口IP', error, error?.message || '探测公网出口 IP 失败。')
    }
  })

  ipcMain.handle('proxy:align-geo', async (event, payload) => {
    try {
      assertTrusted(event)
      const { profile, proxy, timeout } = payload || {}
      const geoInfo = await detectExitIp({ proxy, timeout })
      const aligned = alignFingerprintWithGeo(profile, geoInfo)
      return { ok: true, geoInfo, aligned }
    } catch (error) {
      return errorResult('对齐代理地理环境', error, error?.message || '探测代理或对齐地理环境失败。')
    }
  })

  ipcMain.handle('profiles:randomHardware', async (event, options) => {
    try {
      assertTrusted(event)
      const platform = options?.platform || (process.platform === 'darwin' ? 'MacIntel' : process.platform === 'linux' ? 'Linux x86_64' : 'Win32')
      const hardware = generateRandomHardwareProfile({ platform })
      return { ok: true, hardware }
    } catch (error) {
      return errorResult('生成自洽硬件指纹', error, '生成自洽硬件指纹失败。')
    }
  })

  ipcMain.handle('actions:click', async (event, payload) => {
    try {
      assertTrusted(event)
      const tabId = payload?.tabId || tabBrowser?.activeId
      const tab = tabBrowser?.getTab(tabId)
      if (!tab) throw new ProfileValidationError('未找到指定或激活的标签页。')
      const target = payload.selector || { x: Number(payload.x), y: Number(payload.y) }
      await humanoidClick(tab.view.webContents, target, payload.options)
      return { ok: true }
    } catch (error) {
      return errorResult('拟人化点击', error, '拟人化点击执行失败。')
    }
  })

  ipcMain.handle('actions:type', async (event, payload) => {
    try {
      assertTrusted(event)
      const tabId = payload?.tabId || tabBrowser?.activeId
      const tab = tabBrowser?.getTab(tabId)
      if (!tab) throw new ProfileValidationError('未找到指定或激活的标签页。')
      if (typeof payload?.text !== 'string') throw new ProfileValidationError('输入文本无效。')
      await humanoidType(tab.view.webContents, payload.text, payload.options)
      return { ok: true }
    } catch (error) {
      return errorResult('拟人化打字', error, '拟人化打字执行失败。')
    }
  })

  ipcMain.handle('actions:ime-type', async (event, payload) => {
    try {
      assertTrusted(event)
      const tabId = payload?.tabId || tabBrowser?.activeId
      const tab = tabBrowser?.getTab(tabId)
      if (!tab) throw new ProfileValidationError('未找到指定或激活的标签页。')
      if (typeof payload?.text !== 'string') throw new ProfileValidationError('输入文本无效。')
      await humanoidImeType(tab.view.webContents, payload.text, payload.options)
      return { ok: true }
    } catch (error) {
      return errorResult('拟人化IME输入', error, '拟人化 IME 输入法组词上屏失败。')
    }
  })

  ipcMain.handle('actions:scroll', async (event, payload) => {
    try {
      assertTrusted(event)
      const tabId = payload?.tabId || tabBrowser?.activeId
      const tab = tabBrowser?.getTab(tabId)
      if (!tab) throw new ProfileValidationError('未找到指定或激活的标签页。')
      await humanoidScroll(tab.view.webContents, payload)
      return { ok: true }
    } catch (error) {
      return errorResult('拟人化滚动', error, '拟人化滚动执行失败。')
    }
  })

  ipcMain.handle('actions:drag', async (event, payload) => {
    try {
      assertTrusted(event)
      const tabId = payload?.tabId || tabBrowser?.activeId
      const tab = tabBrowser?.getTab(tabId)
      if (!tab) throw new ProfileValidationError('未找到指定或激活的标签页。')
      await humanoidDrag(tab.view.webContents, payload.start, payload.end, payload.options)
      return { ok: true }
    } catch (error) {
      return errorResult('拟人化拖拽', error, '拟人化拖拽执行失败。')
    }
  })

  ipcMain.handle('profiles:list', async event => {
    try {
      assertTrusted(event)
      return { ok: true, profiles: profileRepository.list() }
    } catch (error) {
      return errorResult('读取配置', error, '读取浏览器配置失败。')
    }
  })

  ipcMain.handle('environments:list', async event => {
    try {
      assertTrusted(event)
      return { ok: true, environments: environmentRepository.list() }
    } catch (error) {
      return errorResult('读取浏览器环境', error, '读取浏览器环境失败。')
    }
  })

  ipcMain.handle('environments:reopen', async (event, id) => {
    try {
      assertTrusted(event)
      const result = await tabBrowser.reopen(id)
      dashboardWindow?.webContents.send('environments:changed')
      return { ok: true, ...result, environments: environmentRepository.list(), ...tabBrowser.snapshot() }
    } catch (error) {
      return errorResult('恢复浏览器环境', error, '恢复浏览器环境失败，请检查环境目录。')
    }
  })

  ipcMain.handle('environments:close', async (event, id) => {
    try {
      assertTrusted(event)
      const result = await tabBrowser.closeEnvironment(id)
      dashboardWindow?.webContents.send('environments:changed')
      return { ok: true, environments: environmentRepository.list(), ...result }
    } catch (error) {
      return errorResult('关闭浏览器环境', error, '关闭浏览器环境失败，请重试。')
    }
  })

  ipcMain.handle('environments:delete', async (event, id) => {
    try {
      assertTrusted(event)
      if (tabBrowser.isOpen(id)) throw new ProfileValidationError('请先关闭正在使用的浏览器环境。')
      const removal = await environmentRepository.remove(id)
      dashboardWindow?.webContents.send('environments:changed')
      return { ok: true, deletionPending: removal.pending, environments: environmentRepository.list() }
    } catch (error) {
      return errorResult('删除浏览器环境', error, '删除浏览器环境失败，未删除原有数据。')
    }
  })

  ipcMain.handle('environments:update-group', async (event, payload) => {
    try {
      assertTrusted(event)
      const group = payload?.group === undefined || payload?.group === null ? '' : String(payload.group).trim()
      if (group !== DEFAULT_GROUP_NAME && !groupRepository.getByName(group)) throw new ProfileValidationError('要设置的业务分组不存在，请先创建分组。')
      const environment = await environmentRepository.updateGroup(payload?.id, group, payload?.metadataRevision)
      dashboardWindow?.webContents.send('environments:changed')
      return { ok: true, environment, environments: environmentRepository.list() }
    } catch (error) {
      return errorResult('更新环境分组', error, '更新环境分组失败，请刷新后重试。')
    }
  })

  ipcMain.handle('environments:update', async (event, payload) => {
    try {
      assertTrusted(event)
      const hasGroup = Object.hasOwn(payload || {}, 'group')
      const group = payload?.group === undefined || payload?.group === null ? '' : String(payload.group).trim()
      if (hasGroup && group !== DEFAULT_GROUP_NAME && !groupRepository.getByName(group)) throw new ProfileValidationError('要设置的业务分组不存在，请先创建分组。')
      const update = {
        expectedMetadataRevision: payload?.metadataRevision,
        expectedProfileRevision: payload?.profileRevision
      }
      if (Object.hasOwn(payload || {}, 'group')) update.group = group
      for (const key of ['name', 'creationUrl', 'proxy', 'fingerprint', 'tlsFingerprint']) {
        if (Object.hasOwn(payload || {}, key)) update[key] = payload[key]
      }
      if (Object.hasOwn(update, 'fingerprint')) {
        const options = {
          tlsFingerprint: update.tlsFingerprint,
          allowCrossVersion: Boolean(update.tlsFingerprint?.emulationMode === 'cross-version')
        }
        assertFingerprintSave(update.fingerprint, fingerprintRuntime, update.proxy, options)
      }
      if (Object.hasOwn(update, 'tlsFingerprint')) assertTLSFingerprintRuntimeVersion(update.tlsFingerprint, fingerprintRuntime.chromiumVersion)
      const environment = await environmentRepository.updateProfile(payload?.id, update)
      tabBrowser.updateEnvironmentProfile(environment)
      dashboardWindow?.webContents.send('environments:changed')
      return { ok: true, environment, environments: environmentRepository.list(), ...tabBrowser.snapshot() }
    } catch (error) {
      return errorResult('编辑浏览器环境', error, '编辑浏览器环境失败，请刷新后重试。')
    }
  })

  ipcMain.handle('groups:list', async event => {
    try {
      assertTrusted(event)
      return { ok: true, groups: groupRepository.list() }
    } catch (error) {
      return errorResult('读取分组', error, '读取业务分组失败。')
    }
  })

  ipcMain.handle('groups:create', async (event, payload) => {
    try {
      assertTrusted(event)
      const group = await groupRepository.create(payload?.name)
      dashboardWindow?.webContents.send('groups:changed')
      return { ok: true, group, groups: groupRepository.list() }
    } catch (error) {
      return errorResult('创建分组', error, '创建业务分组失败。')
    }
  })

  ipcMain.handle('groups:update', async (event, payload) => {
    try {
      assertTrusted(event)
      const result = await groupRepository.rename(payload?.id, payload?.name)
      await environmentRepository.renameGroup(result.previousName, result.group.name)
      dashboardWindow?.webContents.send('groups:changed')
      dashboardWindow?.webContents.send('environments:changed')
      return { ok: true, group: result.group, groups: groupRepository.list(), environments: environmentRepository.list() }
    } catch (error) {
      return errorResult('修改分组', error, '修改业务分组失败，请刷新后重试。')
    }
  })

  ipcMain.handle('groups:delete', async (event, id) => {
    try {
      assertTrusted(event)
      const group = groupRepository.get(id)
      if (!group) throw new ProfileValidationError('找不到要删除的分组。')
      await environmentRepository.renameGroup(group.name, DEFAULT_GROUP_NAME)
      await groupRepository.remove(id)
      dashboardWindow?.webContents.send('groups:changed')
      dashboardWindow?.webContents.send('environments:changed')
      return { ok: true, groups: groupRepository.list(), environments: environmentRepository.list() }
    } catch (error) {
      return errorResult('删除分组', error, '删除业务分组失败，请重试。')
    }
  })

  ipcMain.handle('profiles:draft', async (event, payload) => {
    try {
      assertTrusted(event)
      const id = `profile-${randomUUID().slice(0, 8)}`
      let fingerprint = null
      if (payload?.presetId) {
        const preset = getPresetTemplateById(payload.presetId)
        if (preset) {
          fingerprint = clone(preset.profile)
        }
      }
      if (!fingerprint) {
        fingerprint = getDefaultProfile()
      }
      // 仅新草稿默认限制非代理 UDP，不改写已保存环境的开关。
      fingerprint.modules.webrtc = true
      if (process.platform !== 'win32') {
        fingerprint.hardware.platform = { darwin: 'MacIntel', linux: 'Linux x86_64' }[process.platform] || fingerprint.hardware.platform
        fingerprint.graphics.webglVendor = ''
        fingerprint.graphics.webglRenderer = ''
      }
      fingerprint.id = id
      fingerprint.noise.seed = `environment-${randomUUID()}`
      return {
        ok: true,
        profile: createProfileRecord({
          id,
          name: '新建配置',
          url: DEFAULT_URL,
          fingerprint
        })
      }
    } catch (error) {
      return errorResult('创建配置草稿', error, '创建配置草稿失败。')
    }
  })

  ipcMain.handle('profiles:preview', async (event, payload) => {
    try {
      assertTrusted(event)
      const options = {
        tlsFingerprint: payload?.tlsFingerprint,
        allowCrossVersion: Boolean(payload?.tlsFingerprint?.emulationMode === 'cross-version')
      }
      return { ok: true, ...previewFingerprintProfile(payload?.fingerprint, fingerprintRuntime, payload?.proxy, options) }
    } catch (error) {
      return errorResult('预览指纹配置', error, '无法检查指纹配置，请检查填写内容。')
    }
  })

  ipcMain.handle('profiles:save', async (event, payload) => {
    try {
      assertTrusted(event)
      const options = {
        tlsFingerprint: payload?.tlsFingerprint,
        allowCrossVersion: Boolean(payload?.tlsFingerprint?.emulationMode === 'cross-version')
      }
      assertFingerprintSave(payload?.fingerprint, fingerprintRuntime, payload?.proxy, options)
      if (Object.hasOwn(payload || {}, 'tlsFingerprint')) assertTLSFingerprintRuntimeVersion(payload.tlsFingerprint, fingerprintRuntime.chromiumVersion)
      const nextProfile = await profileRepository.save(payload)
      tabBrowser.window?.webContents.send('profiles:changed')
      return { ok: true, profile: clone(nextProfile), profiles: profileRepository.list() }
    } catch (error) {
      return errorResult('保存配置', error, '保存浏览器配置失败。')
    }
  })

  ipcMain.handle('tls:presets', async event => {
    try {
      assertTrusted(event)
      return { ok: true, presets: CHROME_TLS_VERSION_PRESETS }
    } catch (error) {
      return errorResult('获取 TLS 预设', error, '获取 TLS 预设失败。')
    }
  })

  ipcMain.handle('tls:resolve', async (event, payload) => {
    try {
      assertTrusted(event)
      const config = resolveTLSConfigForBrowser(payload?.target, { runtimeVersion: fingerprintRuntime.chromiumVersion })
      return { ok: true, config }
    } catch (error) {
      return errorResult('解析 TLS 策略', error, '解析 TLS 策略失败。')
    }
  })

  ipcMain.handle('profiles:delete', async (event, id) => {
    try {
      assertTrusted(event)
      await profileRepository.delete(id)
      tabBrowser.window?.webContents.send('profiles:changed')
      return { ok: true, profiles: profileRepository.list() }
    } catch (error) {
      return errorResult('删除配置', error, '删除浏览器配置失败。')
    }
  })

  ipcMain.handle('profiles:launch', async (event, payload) => {
    try {
      assertTrusted(event)
      const result = await launchProfile(payload)
      dashboardWindow?.webContents.send('environments:changed')
      return { ok: true, ...result }
    } catch (error) {
      return errorResult('启动浏览器', error, '启动浏览器配置失败。')
    }
  })

  ipcMain.handle('x-grok:toggle-panel', async (event, environmentId) => {
    try {
      assertTrusted(event)
      const activeTab = tabBrowser?.getTab(tabBrowser?.activeId)
      if (!activeTab || activeTab.environmentId !== environmentId) {
        throw new ProfileValidationError('当前 X 标签已切换，请重新打开 Grok 发帖面板。')
      }
      if (!isXPlatformUrl(activeTab.view.webContents.getURL())) {
        throw new ProfileValidationError('请先切换到 X 页面，再打开 Grok 发帖面板。')
      }
      const visible = await showXGrokPanel(environmentId)
      return { ok: true, visible }
    } catch (error) {
      return errorResult('显示 X 发帖面板', error, '无法打开 Grok 发帖面板。')
    }
  })

  ipcMain.handle('x-grok:close-panel', async (event) => {
    try {
      assertTrusted(event)
      hideXGrokPanel()
      return { ok: true }
    } catch (error) {
      return errorResult('关闭 X 发帖面板', error, '无法关闭 Grok 发帖面板。')
    }
  })

  ipcMain.handle('x-grok:status', async (event, environmentId) => {
    try {
      assertTrusted(event)
      const targetId = typeof environmentId === 'object' ? environmentId?.environmentId : environmentId
      const status = xGrokAutomation?.getTaskStatus(targetId)
      return { ok: true, status }
    } catch (error) {
      return errorResult('获取X发帖状态', error, '获取状态失败。')
    }
  })

  ipcMain.handle('x-grok:toggle', async (event, payload) => {
    try {
      assertTrusted(event)
      const { environmentId, enabled } = payload || {}
      const status = xGrokAutomation?.toggleTask(environmentId, enabled)
      return { ok: true, status }
    } catch (error) {
      return errorResult('切换X发帖状态', error, error.message || '切换发帖状态失败。')
    }
  })

  ipcMain.handle('x-grok:trigger-now', async (event, environmentId) => {
    try {
      assertTrusted(event)
      const targetId = typeof environmentId === 'object' ? environmentId?.environmentId : environmentId
      const status = await xGrokAutomation?.triggerNow(targetId)
      return { ok: true, status }
    } catch (error) {
      return errorResult('触发立即发帖', error, error.message || '触发发帖失败。')
    }
  })

  ipcMain.handle('x-grok:update-config', async (event, payload) => {
    try {
      assertTrusted(event)
      const { environmentId, intervalMs, prompt, mentions, roamingEnabled, commentSentences, commentIntervalMs } = payload || {}
      const status = await xGrokAutomation?.updateConfig(environmentId, { intervalMs, prompt, mentions, roamingEnabled, commentSentences, commentIntervalMs })
      return { ok: true, status }
    } catch (error) {
      return errorResult('更新X发帖配置', error, error.message || '更新配置失败。')
    }
  })
}

async function createDashboard () {
  clientConfig = getClientConfig({ packaged: app.isPackaged })
  dashboardWindow = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 980,
    minHeight: 680,
    title: '指纹浏览器 · 栖界工作空间',
    backgroundColor: '#f1f3f6',
    titleBarStyle: 'default',
    icon: APPLICATION_ICON,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'workspace-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })
  dashboardWindow.on('closed', () => {
    dashboardWindow = null
  })
  tabBrowser?.attachWindow(dashboardWindow)
  dashboardWindow.show()
  dashboardWindow.focus()
  dashboardWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  dashboardWindow.webContents.on('will-navigate', (event, url) => {
    if (url.split('#', 1)[0] !== clientConfig.appUrl) event.preventDefault()
  })
  while (!quitting && dashboardWindow && !dashboardWindow.isDestroyed()) {
    try { await dashboardWindow.loadURL(clientConfig.appUrl); break } catch {
      const result = await dialog.showMessageBox(dashboardWindow, { type: 'error', title: '无法连接工作空间', message: '工作空间服务暂不可用，请检查服务地址或网络后重试。', detail: clientConfig.appUrl, buttons: ['重试', '退出'], defaultId: 0, cancelId: 1 })
      if (result.response !== 0) { app.quit(); break }
    }
  }
}

async function start () {
  await app.whenReady()
  try {
    if (!await acquireClientLock()) {
      app.quit()
      return
    }
    app.setAppUserModelId(APPLICATION_ID)
    Menu.setApplicationMenu(null)
    app.userAgentFallback = defaultUserAgent()
    await ensureUserDataPath()
    clientConfig = getClientConfig({ packaged: app.isPackaged })
    const { recovered } = await loadProfiles()
    environmentRepository = new EnvironmentRepository(app.getPath('userData'))
    await environmentRepository.load()
    groupRepository = new GroupRepository(app.getPath('userData'))
    await groupRepository.load(environmentRepository.list())
    tabBrowser = new TabBrowser(app.getPath('userData'), environmentRepository, {
      getWindow: () => dashboardWindow,
      onEnvironmentChanged: () => dashboardWindow?.webContents.send('environments:changed')
    })
    xGrokAutomation = new PlatformAutomationManager({ tabBrowser })
    xGrokAutomation.on('status-changed', task => {
      if (xGrokPanelWindow && !xGrokPanelWindow.isDestroyed() &&
          xGrokPanelEnvironmentId === task.environmentId) {
        xGrokPanelWindow.webContents.send('x-grok:status-changed', task)
      }
    })
    tabBrowser.setXGrokAutomation(xGrokAutomation)
    registerIpc()
    automationServer = new AutomationServer({
      profileRepository,
      environmentRepository,
      groupRepository,
      tabBrowser,
      xGrokAutomation
    })
    try {
      await automationServer.start()
    } catch (serverError) {
      console.warn('[自动化服务启动提示]', serverError?.message || serverError)
    }
    await createDashboard()
    if (recovered) {
      await dialog.showMessageBox(dashboardWindow, {
        type: 'warning',
        title: '配置已从备份恢复',
        message: '主配置无法读取，已加载上一份有效备份。原文件未覆盖；下次保存时会保留损坏副本。',
        buttons: ['知道了']
      })
    }
  } catch (error) {
    console.error('[启动应用]', error)
    dialog.showErrorBox('指纹浏览器启动失败', startupErrorMessage(error))
    app.quit()
    return
  }

  app.on('activate', () => { void activateClient() })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', event => {
  if (quitting || !profileRepository) return
  event.preventDefault()
  quitting = true
  void (async () => {
    await startup
    if (xGrokAutomation) {
      for (const platform of xGrokAutomation.platforms.values()) {
        for (const envId of [...platform.tasks.keys()]) {
          platform.onEnvironmentClosed(envId)
        }
      }
    }
    await automationServer?.stop()
    await tabBrowser?.shutdown()
    await environmentRepository?.waitForWrites()
    await groupRepository?.waitForWrites()
    await profileRepository.waitForWrites()
    app.quit()
  })()
})

app.on('second-instance', () => { void activateClient() })
startup = start()
