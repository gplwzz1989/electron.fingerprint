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
  executeTask: 'task:execute', queryTask: 'task:query', cancelTask: 'task:cancel',
  observeSession: 'session:open', readSession: 'session:read', captureSession: 'session:capture', closeSession: 'session:close', runtime: 'application:runtime', prepareLaunch: 'application:prepare-launch', launchEncrypted: 'application:launch-encrypted', tabs: 'tabs:list', selectTab: 'tabs:select', closeTab: 'tabs:close', dashboard: 'tabs:dashboard', navigate: 'tabs:navigate', createTab: 'tabs:create-managed', openAuthTab: 'tabs:open-auth', setTabCapabilities: 'tabs:set-capabilities', requestLocalApi: 'automation:request', updateStatus: 'updates:status', checkUpdates: 'updates:check', installUpdate: 'updates:install',
  systemGetRuntime: 'system:get-runtime', systemControlWindow: 'system:control-window', systemGetUpdateStatus: 'system:get-update-status', systemCheckUpdates: 'system:check-updates', systemInstallUpdate: 'system:install-update',
  tabsListV2: 'tabs:list-v2', tabsSelectV2: 'tabs:select-v2', tabsCloseV2: 'tabs:close-v2', tabsNavigateV2: 'tabs:navigate-v2', tabsCreateV2: 'tabs:create-v2', tabsOpenDevTools: 'tabs:open-devtools', tabsDashboardV2: 'tabs:dashboard-v2',
  environmentsListV2: 'environments:list-v2', environmentsPrepareLaunchV2: 'environments:prepare-launch-v2', environmentsLaunchV2: 'environments:launch-v2', environmentsCloseV2: 'environments:close-v2', environmentsRemoveV2: 'environments:remove-v2', environmentsUpdateV2: 'environments:update-v2',
  tasksExecuteV2: 'tasks:execute-v2', tasksQueryV2: 'tasks:query-v2', tasksCancelV2: 'tasks:cancel-v2',
  platformGetStatusV2: 'platform:get-status-v2', platformStartAuthV2: 'platform:start-auth-v2', platformCancelAuthV2: 'platform:cancel-auth-v2'
}
const bridgeContract = { browserApi, desktopBridge }
const businessChannels = new Set([...Object.values(browserApi), ...Object.values(desktopBridge)])
const shellChannels = new Set(['tabs:list', 'tabs:select', 'tabs:close', 'tabs:reorder', 'tabs:navigate', 'tabs:dashboard', 'tabs:ordinary', 'tabs:devtools', 'tabs:save-auth', 'window:action', 'system:control-window', 'tabs:list-v2', 'tabs:select-v2', 'tabs:close-v2', 'tabs:navigate-v2', 'tabs:create-v2', 'tabs:open-devtools', 'tabs:dashboard-v2'])
const managementChannels = new Set(['tabs:create-managed', 'tabs:set-capabilities', 'updates:install', 'system:install-update', 'tabs:open-auth'])
const capabilityGroups = new Set(['application', 'system', 'workspace', 'presets', 'profiles', 'environments', 'groups', 'tabs', 'proxy', 'actions', 'tls', 'x-grok', 'automation', 'task'])
const bridgeArguments = () => ['--qijie-api-contract=' + encodeURIComponent(JSON.stringify(bridgeContract))]
module.exports = { bridgeContract, businessChannels, shellChannels, managementChannels, capabilityGroups, bridgeArguments }
