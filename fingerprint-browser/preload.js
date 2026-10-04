const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('browserApi', {
  listProfiles: () => ipcRenderer.invoke('profiles:list'),
  getDraft: () => ipcRenderer.invoke('profiles:draft'),
  saveProfile: profile => ipcRenderer.invoke('profiles:save', profile),
  deleteProfile: id => ipcRenderer.invoke('profiles:delete', id),
  launchProfile: payload => ipcRenderer.invoke('profiles:launch', payload),
  listEnvironments: () => ipcRenderer.invoke('environments:list'),
  reopenEnvironment: id => ipcRenderer.invoke('environments:reopen', id),
  closeEnvironment: id => ipcRenderer.invoke('environments:close', id),
  deleteEnvironment: id => ipcRenderer.invoke('environments:delete', id),
  listTabs: () => ipcRenderer.invoke('tabs:list'),
  selectTab: id => ipcRenderer.invoke('tabs:select', id),
  closeTab: id => ipcRenderer.invoke('tabs:close', id),
  navigateTab: payload => ipcRenderer.invoke('tabs:navigate', payload),
  newPageTab: payload => ipcRenderer.invoke('tabs:new-page', payload),
  showDashboard: () => ipcRenderer.invoke('tabs:dashboard'),
  onTabsChanged: callback => {
    const listener = (_event, snapshot) => callback(snapshot)
    ipcRenderer.on('tabs:changed', listener)
    return () => ipcRenderer.removeListener('tabs:changed', listener)
  },
  onProfilesChanged: callback => {
    const listener = () => callback()
    ipcRenderer.on('profiles:changed', listener)
    return () => ipcRenderer.removeListener('profiles:changed', listener)
  },
  onEnvironmentsChanged: callback => {
    const listener = () => callback()
    ipcRenderer.on('environments:changed', listener)
    return () => ipcRenderer.removeListener('environments:changed', listener)
  }
})
