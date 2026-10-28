const { contextBridge, ipcRenderer } = require('electron')

// URL 工作空间仅暴露必要能力，远程页面不能访问文件系统或任意 IPC。
contextBridge.exposeInMainWorld('workspaceBridge', {
  shellVersion: 2,
  runtime: () => ipcRenderer.invoke('workspace:runtime'),
  launch: payload => ipcRenderer.invoke('workspace:launch', payload),
  tabs: () => ipcRenderer.invoke('tabs:list'),
  selectTab: id => ipcRenderer.invoke('tabs:select', id),
  closeTab: id => ipcRenderer.invoke('tabs:close', id),
  dashboard: () => ipcRenderer.invoke('tabs:dashboard'),
  navigate: payload => ipcRenderer.invoke('tabs:navigate', payload),
  createTab: payload => ipcRenderer.invoke('tabs:create-managed', payload),
  setTabCapabilities: payload => ipcRenderer.invoke('tabs:set-capabilities', payload),
  requestLocalApi: payload => ipcRenderer.invoke('automation:request', payload),
  onTabsChanged: callback => {
    const listener = (_event, payload) => callback(payload)
    ipcRenderer.on('tabs:changed', listener)
    return () => ipcRenderer.removeListener('tabs:changed', listener)
  }
})

// 具名业务契约由客户端主进程提供；实际授权仍在每次 IPC 调用时校验。
const contractArgument = process.argv.find(value => value.startsWith('--qijie-api-contract='))
if (contractArgument) {
  const contract = JSON.parse(decodeURIComponent(contractArgument.slice('--qijie-api-contract='.length)))
  const api = { hostPlatform: process.platform }
  for (const [method, channel] of Object.entries(contract.browserApi)) api[method] = payload => ipcRenderer.invoke(channel, method === 'createGroup' && typeof payload === 'string' ? { name: payload } : payload)
  for (const [method, channel] of Object.entries({ onTabsChanged: 'tabs:changed', onProfilesChanged: 'profiles:changed', onEnvironmentsChanged: 'environments:changed', onGroupsChanged: 'groups:changed' })) {
    api[method] = callback => { if (typeof callback !== 'function') return () => {}; const listener = (_event, payload) => callback(payload); ipcRenderer.on(channel, listener); return () => ipcRenderer.removeListener(channel, listener) }
  }
  contextBridge.exposeInMainWorld('browserApi', api)
}
