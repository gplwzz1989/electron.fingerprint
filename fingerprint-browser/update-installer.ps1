param(
  [Parameter(Mandatory=$true)][int]$ClientProcessId,
  [Parameter(Mandatory=$true)][string]$InstallerPath,
  [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{64}$')][string]$ExpectedHash
)
$ErrorActionPreference = 'Stop'
try {
  # 等待客户端正常保存会话并退出，不强杀任何浏览器进程。
  $clientProcess = Get-Process -Id $ClientProcessId -ErrorAction SilentlyContinue
  if ($clientProcess -and !$clientProcess.WaitForExit(90000)) { throw '客户端尚未退出，已停止安装更新。' }
  $resolvedInstaller = [IO.Path]::GetFullPath($InstallerPath)
  if ((Get-FileHash -LiteralPath $resolvedInstaller -Algorithm SHA256).Hash.ToLowerInvariant() -ne $ExpectedHash) { throw '更新文件校验失败，已停止安装。' }
  $installerProcess = Start-Process -FilePath $resolvedInstaller -ArgumentList @('/S', '/UPDATE') -Verb RunAs -WindowStyle Hidden -Wait -PassThru
  if ($installerProcess.ExitCode -ne 0) { throw '更新安装未完成，请重新启动客户端后重试。' }
} catch {
  Add-Type -AssemblyName PresentationFramework
  [System.Windows.MessageBox]::Show('更新未完成。请重新打开客户端，检查权限或网络后再试。', '客户端更新', 'OK', 'Error') | Out-Null
  exit 1
}
