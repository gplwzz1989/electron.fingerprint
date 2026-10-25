'use strict'

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('xGrokApi', {
  closePanel: () => ipcRenderer.invoke('x-grok:close-panel'),
  getStatus: environmentId => ipcRenderer.invoke('x-grok:status', environmentId),
  toggle: payload => ipcRenderer.invoke('x-grok:toggle', payload),
  triggerNow: environmentId => ipcRenderer.invoke('x-grok:trigger-now', environmentId),
  updateConfig: payload => ipcRenderer.invoke('x-grok:update-config', payload),
  onStatusChanged: callback => {
    const listener = (_event, payload) => callback(payload)
    ipcRenderer.on('x-grok:status-changed', listener)
    return () => ipcRenderer.removeListener('x-grok:status-changed', listener)
  },
  onPanelEnvironmentChanged: callback => {
    const listener = (_event, environmentId) => callback(environmentId)
    ipcRenderer.on('x-grok:panel-environment', listener)
    return () => ipcRenderer.removeListener('x-grok:panel-environment', listener)
  }
})
