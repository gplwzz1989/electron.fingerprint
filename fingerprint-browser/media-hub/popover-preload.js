const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('mediaApi', {
  getExtraction: () => ipcRenderer.invoke('media:get-extraction'),
  getTasks: () => ipcRenderer.invoke('media:get-tasks'),
  startDownload: resource => ipcRenderer.invoke('media:start-download', resource),
  batchDownload: resources => ipcRenderer.invoke('media:batch-download', resources),
  cancelTask: taskId => ipcRenderer.invoke('media:cancel-task', taskId),
  openFile: taskId => ipcRenderer.invoke('media:open-file', taskId),
  openFolder: taskId => ipcRenderer.invoke('media:open-folder', taskId),
  closePopover: () => ipcRenderer.invoke('media:close-popover'),
  onTasksChanged: callback => {
    const listener = (_event, tasks) => callback(tasks)
    ipcRenderer.on('media:tasks-changed', listener)
    return () => ipcRenderer.removeListener('media:tasks-changed', listener)
  },
  onExtractionChanged: callback => {
    const listener = (_event, data) => callback(data)
    ipcRenderer.on('media:extraction-changed', listener)
    return () => ipcRenderer.removeListener('media:extraction-changed', listener)
  }
})
