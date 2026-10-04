const path = require('node:path')
const fs = require('node:fs/promises')
const { randomUUID } = require('node:crypto')
const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron/main')
const { TabBrowser } = require('./browser-tabs')
const { EnvironmentRepository } = require('./environment-repository')
const { ProfileRepository } = require('./profile-repository')
const {
  DEFAULT_URL,
  ProfileValidationError,
  createProfileRecord,
  getDefaultProfile,
  normalizeUrl
} = require('./profile-store')

if (process.env.FP_BROWSER_DATA_DIR) {
  app.setPath('userData', process.env.FP_BROWSER_DATA_DIR)
  app.setPath('sessionData', process.env.FP_BROWSER_DATA_DIR)
}

let dashboardWindow = null
let profileRepository = null
let environmentRepository = null
let tabBrowser = null
let quitting = false
let startup = Promise.resolve()

const APPLICATION_ID = 'com.qijie.fingerprintbrowser'
const APPLICATION_ICON = process.platform === 'win32'
  ? path.join(__dirname, 'assets', 'saas.ico')
  : path.join(__dirname, 'assets', 'saas.png')

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
  const candidates = configuredPath ? [path.resolve(configuredPath)] : [app.getPath('userData')]
  if (!configuredPath && process.platform === 'win32' && process.env.LOCALAPPDATA) {
    candidates.push(path.join(process.env.LOCALAPPDATA, '栖界', '指纹浏览器'))
  }
  if (!configuredPath) candidates.push(path.join(app.getPath('temp'), '栖界', '指纹浏览器'))

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
    } catch (error) {
      console.warn(`[启动应用] 数据目录不可用：${candidate}`, error?.message || error)
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
  const message = error instanceof ProfileValidationError ? error.message : fallback
  return { ok: false, error: message }
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
  const seed = JSON.parse(await fs.readFile(profileSeedPath(), 'utf8'))
  return await profileRepository.load([createProfileRecord({
    id: seed.id,
    name: 'Windows 11 中文桌面',
    url: DEFAULT_URL,
    fingerprint: seed
  })])
}

async function launchProfile (payload) {
  if (!payload || typeof payload !== 'object') throw new ProfileValidationError('启动参数无效。')
  const profile = profileRepository.list().find(item => item.id === payload.id)
  if (!profile) throw new ProfileValidationError('找不到要启动的浏览器配置。')
  const targetUrl = normalizeUrl(payload.url === undefined ? profile.url : String(payload.url).trim())
  return await tabBrowser.open(profile, targetUrl)
}

function registerIpc () {
  const trustedPages = new Set([
    require('node:url').pathToFileURL(path.join(__dirname, 'renderer', 'index.html')).href,
    require('node:url').pathToFileURL(path.join(__dirname, 'renderer', 'browser.html')).href
  ])
  // 只有本地管理页和标签栏可调用应用接口，远程网页不能操作其他标签。
  function assertTrusted (event) {
    if (quitting) throw new ProfileValidationError('应用正在退出，请稍后重新打开。')
    const trustedUrl = event.senderFrame?.url?.split('#', 1)[0]
    if (![dashboardWindow?.webContents, tabBrowser?.window?.webContents].includes(event.sender) ||
        event.senderFrame !== event.sender.mainFrame || !trustedPages.has(trustedUrl)) {
      throw new ProfileValidationError('当前页面无权操作浏览器配置或标签。')
    }
  }
  for (const action of ['list', 'select', 'close', 'navigate', 'new-page', 'dashboard']) {
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

  ipcMain.handle('profiles:draft', async event => {
    try {
      assertTrusted(event)
      const id = `profile-${randomUUID().slice(0, 8)}`
      return {
        ok: true,
        profile: createProfileRecord({
          id,
          name: '新建配置',
          url: DEFAULT_URL,
          fingerprint: getDefaultProfile()
        })
      }
    } catch (error) {
      return errorResult('创建配置草稿', error, '创建配置草稿失败。')
    }
  })

  ipcMain.handle('profiles:save', async (event, payload) => {
    try {
      assertTrusted(event)
      const nextProfile = await profileRepository.save(payload)
      tabBrowser.window?.webContents.send('profiles:changed')
      return { ok: true, profile: clone(nextProfile), profiles: profileRepository.list() }
    } catch (error) {
      return errorResult('保存配置', error, '保存浏览器配置失败。')
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
}

async function createDashboard () {
  dashboardWindow = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 980,
    minHeight: 680,
    title: '指纹浏览器 · 栖界工作空间',
    backgroundColor: '#0d1118',
    icon: APPLICATION_ICON,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
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
  dashboardWindow.webContents.on('will-navigate', event => event.preventDefault())
  await dashboardWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'))
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
    const { recovered } = await loadProfiles()
    environmentRepository = new EnvironmentRepository(app.getPath('userData'))
    await environmentRepository.load()
    tabBrowser = new TabBrowser(app.getPath('userData'), environmentRepository, {
      getWindow: () => dashboardWindow,
      onEnvironmentChanged: () => dashboardWindow?.webContents.send('environments:changed')
    })
    registerIpc()
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
    await tabBrowser?.shutdown()
    await environmentRepository?.waitForWrites()
    await profileRepository.waitForWrites()
    app.quit()
  })()
})

app.on('second-instance', () => { void activateClient() })
startup = start()
