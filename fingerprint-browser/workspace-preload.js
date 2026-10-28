const { contextBridge, ipcRenderer } = require('electron')

// URL 工作空间仅暴露必要能力，远程页面不能访问文件系统或任意 IPC。
contextBridge.exposeInMainWorld('workspaceBridge', {
  runtime: () => ipcRenderer.invoke('workspace:runtime'),
  launch: payload => ipcRenderer.invoke('workspace:launch', payload),
  tabs: () => ipcRenderer.invoke('tabs:list'),
  selectTab: id => ipcRenderer.invoke('tabs:select', id),
  closeTab: id => ipcRenderer.invoke('tabs:close', id),
  dashboard: () => ipcRenderer.invoke('tabs:dashboard'),
  navigate: payload => ipcRenderer.invoke('tabs:navigate', payload),
  onTabsChanged: callback => {
    const listener = (_event, payload) => callback(payload)
    ipcRenderer.on('tabs:changed', listener)
    return () => ipcRenderer.removeListener('tabs:changed', listener)
  }
})
