// 客户端业务接口契约：预加载只暴露这些具名方法，不向网页开放原始 IPC。
const browserApi = {
  listPresets: 'presets:list', listProfiles: 'profiles:list', getDraft: 'profiles:draft', previewFingerprint: 'profiles:preview', saveProfile: 'profiles:save', deleteProfile: 'profiles:delete', launchProfile: 'profiles:launch',
  listEnvironments: 'environments:list', reopenEnvironment: 'environments:reopen', closeEnvironment: 'environments:close', deleteEnvironment: 'environments:delete', updateEnvironmentGroup: 'environments:update-group', updateEnvironment: 'environments:update',
  listGroups: 'groups:list', createGroup: 'groups:create', updateGroup: 'groups:update', deleteGroup: 'groups:delete',
  listTabs: 'tabs:list', selectTab: 'tabs:select', closeTab: 'tabs:close', reorderTab: 'tabs:reorder', navigateTab: 'tabs:navigate', openDevToolsTab: 'tabs:devtools', newPageTab: 'tabs:new-page', showDashboard: 'tabs:dashboard',
  detectExitIp: 'proxy:detect-ip', alignProxyGeo: 'proxy:align-geo', randomHardware: 'profiles:randomHardware', humanoidClick: 'actions:click', humanoidType: 'actions:type', humanoidImeType: 'actions:ime-type', humanoidScroll: 'actions:scroll', humanoidDrag: 'actions:drag', getTLSPresets: 'tls:presets', resolveTLSConfig: 'tls:resolve',
  toggleXPanel: 'x-grok:toggle-panel', getXStatus: 'x-grok:status', toggleX: 'x-grok:toggle', updateXConfig: 'x-grok:update-config', requestLocalApi: 'automation:request'
}
const desktopBridge = {
  platformStatus: 'platform:status', startPlatformTask: 'platform:start', pollPlatformTask: 'platform:poll', cancelPlatformTask: 'platform:cancel',
  observeSession: 'session:open', readSession: 'session:read', captureSession: 'session:capture', closeSession: 'session:close', runtime: 'application:runtime', prepareLaunch: 'application:prepare-launch', launchEncrypted: 'application:launch-encrypted', tabs: 'tabs:list', selectTab: 'tabs:select', closeTab: 'tabs:close', dashboard: 'tabs:dashboard', navigate: 'tabs:navigate', createTab: 'tabs:create-managed', setTabCapabilities: 'tabs:set-capabilities', requestLocalApi: 'automation:request', updateStatus: 'updates:status', checkUpdates: 'updates:check', installUpdate: 'updates:install'
}
const bridgeContract = { browserApi, desktopBridge }
const businessChannels = new Set([...Object.values(browserApi), ...Object.values(desktopBridge)])
const shellChannels = new Set(['tabs:list', 'tabs:select', 'tabs:close', 'tabs:reorder', 'tabs:navigate', 'tabs:dashboard', 'tabs:ordinary', 'tabs:devtools', 'window:action'])
const managementChannels = new Set(['tabs:create-managed', 'tabs:set-capabilities', 'updates:install'])
const capabilityGroups = new Set(['application', 'workspace', 'presets', 'profiles', 'environments', 'groups', 'tabs', 'proxy', 'actions', 'tls', 'x-grok', 'automation'])
const bridgeArguments = () => ['--qijie-api-contract=' + encodeURIComponent(JSON.stringify(bridgeContract))]
module.exports = { bridgeContract, businessChannels, shellChannels, managementChannels, capabilityGroups, bridgeArguments }
