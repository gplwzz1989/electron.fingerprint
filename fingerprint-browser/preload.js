const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('browserApi', {
  hostPlatform: process.platform,
  listPresets: () => ipcRenderer.invoke('presets:list'),
  listProfiles: () => ipcRenderer.invoke('profiles:list'),
  getDraft: payload => ipcRenderer.invoke('profiles:draft', payload),
  previewFingerprint: profile => ipcRenderer.invoke('profiles:preview', profile),
  saveProfile: profile => ipcRenderer.invoke('profiles:save', profile),
  deleteProfile: id => ipcRenderer.invoke('profiles:delete', id),
  launchProfile: payload => ipcRenderer.invoke('profiles:launch', payload),
  listEnvironments: () => ipcRenderer.invoke('environments:list'),
  reopenEnvironment: id => ipcRenderer.invoke('environments:reopen', id),
  closeEnvironment: id => ipcRenderer.invoke('environments:close', id),
  deleteEnvironment: id => ipcRenderer.invoke('environments:delete', id),
  updateEnvironmentGroup: payload => ipcRenderer.invoke('environments:update-group', payload),
  updateEnvironment: payload => ipcRenderer.invoke('environments:update', payload),
  listGroups: () => ipcRenderer.invoke('groups:list'),
  createGroup: name => ipcRenderer.invoke('groups:create', { name }),
  updateGroup: payload => ipcRenderer.invoke('groups:update', payload),
  deleteGroup: id => ipcRenderer.invoke('groups:delete', id),
  listTabs: () => ipcRenderer.invoke('tabs:list'),
  selectTab: id => ipcRenderer.invoke('tabs:select', id),
  closeTab: id => ipcRenderer.invoke('tabs:close', id),
  navigateTab: payload => ipcRenderer.invoke('tabs:navigate', payload),
  openDevToolsTab: id => ipcRenderer.invoke('tabs:devtools', id),
  newPageTab: payload => ipcRenderer.invoke('tabs:new-page', payload),
  showDashboard: () => ipcRenderer.invoke('tabs:dashboard'),
  detectExitIp: options => ipcRenderer.invoke('proxy:detect-ip', options),
  alignProxyGeo: payload => ipcRenderer.invoke('proxy:align-geo', payload),
  randomHardware: options => ipcRenderer.invoke('profiles:randomHardware', options),
  humanoidClick: payload => ipcRenderer.invoke('actions:click', payload),
  humanoidType: payload => ipcRenderer.invoke('actions:type', payload),
  humanoidImeType: payload => ipcRenderer.invoke('actions:ime-type', payload),
  humanoidScroll: payload => ipcRenderer.invoke('actions:scroll', payload),
  humanoidDrag: payload => ipcRenderer.invoke('actions:drag', payload),
  getTLSPresets: () => ipcRenderer.invoke('tls:presets'),
  resolveTLSConfig: payload => ipcRenderer.invoke('tls:resolve', payload),
  toggleMediaPopover: bounds => ipcRenderer.invoke('media:toggle-popover', bounds),
  onMediaCountChanged: callback => {
    const listener = (_event, payload) => callback(payload)
    ipcRenderer.on('media:count-changed', listener)
    return () => ipcRenderer.removeListener('media:count-changed', listener)
  },
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
  },
  onGroupsChanged: callback => {
    const listener = () => callback()
    ipcRenderer.on('groups:changed', listener)
    return () => ipcRenderer.removeListener('groups:changed', listener)
  }
})

contextBridge.exposeInMainWorld('creatorApi', {
  listAssets: filter => ipcRenderer.invoke('creator:list-assets', filter),
  saveAsset: data => ipcRenderer.invoke('creator:save-asset', data),
  deleteAsset: id => ipcRenderer.invoke('creator:delete-asset', id),
  updateStatus: payload => ipcRenderer.invoke('creator:update-status', payload),
  generateArticle: params => ipcRenderer.invoke('creator:generate-article', params),
  checkCompliance: text => ipcRenderer.invoke('creator:check-compliance', text),
  createPostConfig: params => ipcRenderer.invoke('creator:create-post-config', params),
  savePostImage: payload => ipcRenderer.invoke('creator:save-post-image', payload),
  generateStoryboard: params => ipcRenderer.invoke('creator:generate-storyboard', params),
  renderVideo: params => ipcRenderer.invoke('creator:render-video', params),
  preparePublish: payload => ipcRenderer.invoke('creator:prepare-publish', payload),
  openFile: filePath => ipcRenderer.invoke('creator:open-file', filePath),
  listDownloadedMedia: options => ipcRenderer.invoke('creator:list-downloaded-media', options),
  selectLocalFiles: options => ipcRenderer.invoke('creator:select-local-files', options),
  getWechatTemplates: () => ipcRenderer.invoke('creator:get-wechat-templates'),
  validatePost: payload => ipcRenderer.invoke('creator:validate-post', payload),
  persistPostImages: payload => ipcRenderer.invoke('creator:persist-post-images', payload),
  getPublishTypes: () => ipcRenderer.invoke('creator:get-publish-types'),
  listPlatformAccounts: options => ipcRenderer.invoke('creator:list-platform-accounts', options),
  checkAccountStatus: payload => ipcRenderer.invoke('creator:check-account-status', payload),
  setCustomCookie: payload => ipcRenderer.invoke('creator:set-custom-cookie', payload),
  openPlatformLogin: payload => ipcRenderer.invoke('creator:open-platform-login', payload),
  publishMultiAccount: payload => ipcRenderer.invoke('creator:publish-multi-account', payload),
  onPublishProgress: callback => {
    const listener = (_event, data) => callback(data)
    ipcRenderer.on('creator:publish-progress', listener)
    return () => ipcRenderer.removeListener('creator:publish-progress', listener)
  }
})

contextBridge.exposeInMainWorld('xGrokApi', {
  getStatus: environmentId => ipcRenderer.invoke('x-grok:status', environmentId),
  toggle: payload => ipcRenderer.invoke('x-grok:toggle', payload),
  triggerNow: environmentId => ipcRenderer.invoke('x-grok:trigger-now', environmentId),
  updateConfig: payload => ipcRenderer.invoke('x-grok:update-config', payload),
  onStatusChanged: callback => {
    const listener = (_event, payload) => callback(payload)
    ipcRenderer.on('x-grok:status-changed', listener)
    return () => ipcRenderer.removeListener('x-grok:status-changed', listener)
  }
})
