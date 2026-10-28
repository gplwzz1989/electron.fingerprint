const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('browserShell', {
  state: () => ipcRenderer.invoke('tabs:list'),
  create: () => ipcRenderer.invoke('tabs:ordinary'),
  select: id => ipcRenderer.invoke('tabs:select', id),
  close: id => ipcRenderer.invoke('tabs:close', id),
  reorder: payload => ipcRenderer.invoke('tabs:reorder', payload),
  home: () => ipcRenderer.invoke('tabs:dashboard'),
  navigate: payload => ipcRenderer.invoke('tabs:navigate', payload),
  windowAction: action => ipcRenderer.invoke('window:action', action),
  devtools: id => ipcRenderer.invoke('tabs:devtools', id),
  onState: callback => { const listener = (_event, state) => callback(state); ipcRenderer.on('tabs:changed', listener); return () => ipcRenderer.removeListener('tabs:changed', listener) },
  onFocusAddress: callback => { const listener = () => callback(); ipcRenderer.on('shell:focus-address', listener); return () => ipcRenderer.removeListener('shell:focus-address', listener) }
})
