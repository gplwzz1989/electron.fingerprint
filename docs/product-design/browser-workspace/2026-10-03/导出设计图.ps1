param(
  [Parameter(Mandatory = $true)][string]$BrowserPath
)

$ErrorActionPreference = 'Stop'
$taskRoot = [System.IO.Path]::GetFullPath($PSScriptRoot)
$taskOutput = Join-Path $taskRoot 'output/playwright'
$taskScreens = Join-Path $taskRoot 'screens'
$taskProfile = [System.IO.Path]::GetFullPath((Join-Path $taskRoot '../../../dist/product-design-export-profile'))
New-Item -ItemType Directory -Force -Path $taskOutput, $taskScreens | Out-Null
$taskPages = @(
  @('01-工作台', 'overview'),
  @('02-环境管理', 'environments'),
  @('03-创建环境-基本信息', 'create&step=1'),
  @('04-创建环境-代理地区', 'create&step=2&checked=1'),
  @('05-创建环境-指纹配置', 'create&step=3'),
  @('06-环境详情', 'detail'),
  @('07-代理资源', 'proxies'),
  @('08-团队成员', 'members'),
  @('09-操作记录', 'audit'),
  @('10-订阅与用量', 'billing'),
  @('11-客户端设置', 'settings'),
  @('12-环境浏览器', 'browser'),
  @('13-代理异常诊断', 'diagnostic'),
  @('14-首次使用空态', 'empty'),
  @('15-工作空间引导', 'onboarding'),
  @('16-批量操作', 'environments&selected=1')
)
foreach ($taskPage in $taskPages) {
  $taskFile = Join-Path $taskOutput ($taskPage[0] + '.png')
  # 以下参数仅用于独立的界面截图进程，不修改产品的沙箱策略。
  $taskArgs = @('--headless', '--single-process', '--no-sandbox', '--no-zygote', '--disable-crash-reporter', '--disable-breakpad', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=1440,1200', "--user-data-dir=$taskProfile", "--screenshot=$taskFile", ('http://127.0.0.1:8765/capture.html?page=' + $taskPage[1]))
  & $BrowserPath @taskArgs 2> (Join-Path $taskOutput '浏览器导出日志.txt') | Out-Null
  if (!(Test-Path -LiteralPath $taskFile)) { throw '设计图未生成，请检查浏览器路径和本地预览服务。' }
  $taskDestination = Join-Path $taskScreens ($taskPage[0] + '.png')
  Copy-Item -LiteralPath $taskFile -Destination $taskDestination
  Write-Output ('已导出：' + $taskPage[0])
}
