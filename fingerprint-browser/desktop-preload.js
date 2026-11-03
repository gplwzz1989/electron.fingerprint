const { contextBridge, ipcRenderer } = require('electron')

// 远程应用仅暴露必要能力，远程页面不能访问文件系统或任意 IPC。
contextBridge.exposeInMainWorld('desktopBridge', {
  shellVersion: 2,
  protocolVersion: 2,
  capabilities: ['session-restore-v1', 'platform-runtime-v3'],
  system: {
    getRuntime: req => ipcRenderer.invoke('system:get-runtime', req || {}),
    controlWindow: req => ipcRenderer.invoke('system:control-window', req || {}),
    getUpdateStatus: req => ipcRenderer.invoke('system:get-update-status', req || {}),
    checkUpdates: req => ipcRenderer.invoke('system:check-updates', req || {}),
    installUpdate: req => ipcRenderer.invoke('system:install-update', req || {})
  },
  tabs: {
    list: req => ipcRenderer.invoke('tabs:list-v2', req || {}),
    select: req => ipcRenderer.invoke('tabs:select-v2', typeof req === 'string' ? { id: req } : (req || {})),
    close: req => ipcRenderer.invoke('tabs:close-v2', typeof req === 'string' ? { id: req } : (req || {})),
    navigate: req => ipcRenderer.invoke('tabs:navigate-v2', req || {}),
    create: req => ipcRenderer.invoke('tabs:create-v2', req || {}),
    openDevTools: req => ipcRenderer.invoke('tabs:open-devtools', typeof req === 'string' ? { id: req } : (req || {})),
    dashboard: req => ipcRenderer.invoke('tabs:dashboard-v2', req || {})
  },
  environments: {
    list: req => ipcRenderer.invoke('environments:list-v2', req || {}),
    prepareLaunch: req => ipcRenderer.invoke('environments:prepare-launch-v2', req || {}),
    launch: req => ipcRenderer.invoke('environments:launch-v2', req || {}),
    close: req => ipcRenderer.invoke('environments:close-v2', typeof req === 'string' ? { id: req } : (req || {})),
    remove: req => ipcRenderer.invoke('environments:remove-v2', typeof req === 'string' ? { id: req } : (req || {})),
    update: req => ipcRenderer.invoke('environments:update-v2', req || {})
  },
  tasks: {
    execute: req => ipcRenderer.invoke('tasks:execute-v2', req || {}),
    query: req => ipcRenderer.invoke('tasks:query-v2', req || {}),
    cancel: req => ipcRenderer.invoke('tasks:cancel-v2', req || {})
  },
  platform: {
    getStatus: req => ipcRenderer.invoke('platform:get-status-v2', req || {}),
    startAuth: req => ipcRenderer.invoke('platform:start-auth-v2', req || {}),
    cancelAuth: req => ipcRenderer.invoke('platform:cancel-auth-v2', req || {})
  },
  events: {
    on: (eventName, callback) => {
      if (typeof callback !== 'function') return () => {}
      const listener = (_event, envelope) => {
        if (envelope && typeof envelope === 'object' && 'event' in envelope && 'data' in envelope) {
          callback(envelope)
        } else {
          callback({
            event: eventName,
            source: 'desktop',
            timestamp: Date.now(),
            data: envelope
          })
        }
      }
      ipcRenderer.on(eventName, listener)
      return () => ipcRenderer.removeListener(eventName, listener)
    },
    once: (eventName, callback) => {
      if (typeof callback !== 'function') return
      const listener = (_event, envelope) => {
        if (envelope && typeof envelope === 'object' && 'event' in envelope && 'data' in envelope) {
          callback(envelope)
        } else {
          callback({
            event: eventName,
            source: 'desktop',
            timestamp: Date.now(),
            data: envelope
          })
        }
      }
      ipcRenderer.once(eventName, listener)
    }
  },
  platformStatus: () => ipcRenderer.invoke('platform:status'),
  startPlatformTask: payload => ipcRenderer.invoke('platform:start', payload),
  pollPlatformTask: payload => ipcRenderer.invoke('platform:poll', payload),
  cancelPlatformTask: payload => ipcRenderer.invoke('platform:cancel', payload),
  executeTask: payload => ipcRenderer.invoke('task:execute', payload),
  queryTask: payload => ipcRenderer.invoke('task:query', payload),
  cancelTask: payload => ipcRenderer.invoke('task:cancel', payload),
  onTaskCompleted: callback => {
    const listener = (_event, envelope) => callback(envelope)
    ipcRenderer.on('task:completed', listener)
    return () => ipcRenderer.removeListener('task:completed', listener)
  },
  observeSession: payload => ipcRenderer.invoke('session:open', payload),
  readSession: payload => ipcRenderer.invoke('session:read', payload),
  captureSession: payload => ipcRenderer.invoke('session:capture', payload),
  closeSession: payload => ipcRenderer.invoke('session:close', payload),
  runtime: () => ipcRenderer.invoke('application:runtime'),
  prepareLaunch: payload => ipcRenderer.invoke('application:prepare-launch', payload),
  launchEncrypted: payload => ipcRenderer.invoke('application:launch-encrypted', payload),
  dashboard: () => ipcRenderer.invoke('tabs:dashboard-v2'),
  navigate: payload => ipcRenderer.invoke('tabs:navigate-v2', payload),
  createTab: payload => ipcRenderer.invoke('tabs:create-managed', payload),
  openAuthTab: payload => ipcRenderer.invoke('tabs:open-auth', payload),
  setTabCapabilities: payload => ipcRenderer.invoke('tabs:set-capabilities', payload),
  requestLocalApi: payload => ipcRenderer.invoke('automation:request', payload),
  updateStatus: () => ipcRenderer.invoke('updates:status'),
  checkUpdates: () => ipcRenderer.invoke('updates:check'),
  installUpdate: () => ipcRenderer.invoke('updates:install'),
  onUpdateChanged: callback => {
    const listener = (_event, state) => callback(state?.data || state)
    ipcRenderer.on('updates:changed', listener)
    return () => ipcRenderer.removeListener('updates:changed', listener)
  },
  onTabsChanged: callback => {
    const listener = (_event, payload) => callback(payload?.data || payload)
    ipcRenderer.on('tabs:changed', listener)
    return () => ipcRenderer.removeListener('tabs:changed', listener)
  },
  onAuthSaved: callback => {
    const listener = (_event, payload) => callback(payload)
    ipcRenderer.on('authorization:saved', listener)
    return () => ipcRenderer.removeListener('authorization:saved', listener)
  }
})

// 具名业务契约由客户端主进程提供；实际授权仍在每次 IPC 调用时校验。
const contractArgument = process.argv.find(value => value.startsWith('--qijie-api-contract='))
if (contractArgument) {
  const contract = JSON.parse(decodeURIComponent(contractArgument.slice('--qijie-api-contract='.length)))
  const api = { hostPlatform: process.platform }
  for (const [method, channel] of Object.entries(contract.browserApi)) api[method] = payload => ipcRenderer.invoke(channel, method === 'createGroup' && typeof payload === 'string' ? { name: payload } : payload)
  for (const [method, channel] of Object.entries({ onTabsChanged: 'tabs:changed', onProfilesChanged: 'profiles:changed', onEnvironmentsChanged: 'environments:changed', onGroupsChanged: 'groups:changed', onAuthSaved: 'authorization:saved' })) {
    api[method] = callback => { if (typeof callback !== 'function') return () => {}; const listener = (_event, payload) => callback(payload?.data !== undefined ? payload.data : payload); ipcRenderer.on(channel, listener); return () => ipcRenderer.removeListener(channel, listener) }
  }
  contextBridge.exposeInMainWorld('browserApi', api)
}
