param(
  [string]$RuntimeRoot = $env:FP_ELECTRON_RUNTIME,
  [string]$Compiler = $env:FP_NSIS_COMPILER,
  [string]$ResourceEditor = $env:FP_RESOURCE_EDITOR
)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$workspaceRoot = (Resolve-Path (Join-Path $projectRoot '..')).Path
$outputRoot = [IO.Path]::GetFullPath((Join-Path $workspaceRoot 'dist'))
$payload = Join-Path $outputRoot 'fingerprint-browser-win-x64'
$buildRoot = Join-Path $outputRoot 'installer-build'
$installer = Join-Path $outputRoot '指纹浏览器-安装包.exe'
$compiledInstaller = Join-Path $buildRoot '指纹浏览器-安装包.exe'
$portable = Join-Path $outputRoot '指纹浏览器-便携版.zip'
$failureMessage = '打包失败，请检查运行时、安装包编译工具和输出目录。'

function Remove-Output ([string]$Target) {
  $resolved = [IO.Path]::GetFullPath($Target)
  if (!$resolved.StartsWith($outputRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw '清理路径超出产物目录。'
  }
  if (!(Test-Path -LiteralPath $resolved)) { return }
  $item = Get-Item -LiteralPath $resolved -Force
  if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw '产物目录不能是目录链接。' }
  if ($item.PSIsContainer) {
    $userFiles = Get-ChildItem -LiteralPath $resolved -Recurse -Force -File | Where-Object { $_.Name -in @('profiles.json', 'environments.json') }
    if ($userFiles) { throw '历史产物包含用户数据，不能自动清理。' }
  }
  Remove-Item -LiteralPath $resolved -Recurse -Force
}

try {
  if (!$RuntimeRoot) { $RuntimeRoot = Join-Path $workspaceRoot '../electron-fp-build/src/out/Release' }
  $RuntimeRoot = (Resolve-Path -LiteralPath $RuntimeRoot).Path
  if (!$Compiler) { $Compiler = Join-Path $env:LOCALAPPDATA 'electron-builder/Cache/nsis/nsis-3.0.4.1/makensis.exe' }
  if (!(Test-Path -LiteralPath $Compiler)) { throw '未找到安装包编译工具。' }
  if (!$ResourceEditor) { $ResourceEditor = Join-Path $env:LOCALAPPDATA 'electron-builder/Cache/winCodeSign/winCodeSign-2.6.0/rcedit-x64.exe' }
  if (!(Test-Path -LiteralPath $ResourceEditor)) { throw '未找到应用图标与产品信息编辑工具。' }
  New-Item -ItemType Directory -Path $outputRoot, $buildRoot -Force | Out-Null
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  $reference = [IO.Compression.ZipFile]::OpenRead((Join-Path $RuntimeRoot 'dist.zip'))
  try { $runtimeFiles = @($reference.Entries | Where-Object { $_.Name } | ForEach-Object { $_.FullName.TrimStart('./') }) } finally { $reference.Dispose() }
  foreach ($name in $runtimeFiles) {
    $source = [IO.Path]::GetFullPath((Join-Path $RuntimeRoot $name))
    if (!$source.StartsWith($RuntimeRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase) -or !(Test-Path -LiteralPath $source -PathType Leaf)) {
      throw '完整运行时清单无效或文件缺失。'
    }
  }

  $failureMessage = '清理旧产物失败，请关闭从旧产物启动的客户端，并确认旧目录没有用户数据。'
  $oldOutputs = Get-ChildItem -LiteralPath $outputRoot -Force | Where-Object {
    ($_.PSIsContainer -and $_.Name -match '^fingerprint-browser-(unified-windows-x64-v\d+|win-x64-saas-v\d+|win-x64)$') -or
    (!$_.PSIsContainer -and $_.Name -match '^指纹浏览器-.*windows-x64.*\.zip(?:\.sha256)?$')
  }
  foreach ($item in $oldOutputs) { Remove-Output $item.FullName }
  New-Item -ItemType Directory -Path $payload -Force | Out-Null

  $failureMessage = '复制运行时和应用文件失败，请检查输出目录是否可写。'
  foreach ($name in $runtimeFiles) {
    $targetName = if ($name -eq 'electron.exe') { '指纹浏览器.exe' } else { $name }
    $destination = Join-Path $payload $targetName
    New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($destination)) -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $RuntimeRoot $name) -Destination $destination -Force
  }
  $application = Join-Path $payload 'resources/app'
  New-Item -ItemType Directory -Path $application -Force | Out-Null
  Get-ChildItem -LiteralPath $projectRoot -File -Filter '*.js' | Copy-Item -Destination $application -Force
  Copy-Item -LiteralPath (Join-Path $projectRoot 'package.json') -Destination $application -Force
  foreach ($directory in @('assets', 'profiles', 'renderer')) {
    Copy-Item -LiteralPath (Join-Path $projectRoot $directory) -Destination $application -Recurse -Force
  }
  $metadata = Get-Content -LiteralPath (Join-Path $projectRoot 'package.json') -Raw -Encoding UTF8 | ConvertFrom-Json
  $version = $metadata.version
  $failureMessage = '写入应用图标与产品信息失败，请检查资源编辑工具和输出程序。'
  $program = Join-Path $payload '指纹浏览器.exe'
  # 只修改发行包内的程序资源，保留原始内核及其版本记录。
  & $ResourceEditor $program --set-icon (Join-Path $application 'assets/saas.ico') --set-version-string ProductName $metadata.productName --set-version-string FileDescription $metadata.productName --set-version-string CompanyName '栖界' --set-version-string OriginalFilename '指纹浏览器.exe' --set-version-string InternalName $metadata.productName --set-file-version $version --set-product-version $version
  if ($LASTEXITCODE -ne 0) { throw '应用品牌资源更新失败。' }
  $commit = git -C $workspaceRoot rev-parse HEAD
  @{ product = $metadata.productName; version = $version; sourceCommit = $commit; runtimeSha256 = (Get-FileHash -LiteralPath (Join-Path $RuntimeRoot 'electron.exe')).Hash; executableSha256 = (Get-FileHash -LiteralPath $program).Hash; installDirectory = '%ProgramFiles%\栖界\指纹浏览器'; dataDirectory = '%LOCALAPPDATA%\Programs\栖界\指纹浏览器' } |
    ConvertTo-Json | Set-Content -LiteralPath (Join-Path $payload 'release-manifest.json') -Encoding utf8NoBOM

  # 卸载只删除安装包内的文件和空目录，用户数据和额外文件不会被递归删除。
  $files = Get-ChildItem -LiteralPath $payload -Recurse -File
  $uninstallLines = @($files | ForEach-Object { 'Delete "$INSTDIR\' + [IO.Path]::GetRelativePath($payload, $_.FullName) + '"' })
  $uninstallLines += @(Get-ChildItem -LiteralPath $payload -Recurse -Directory | Sort-Object { $_.FullName.Length } -Descending | ForEach-Object { 'RMDir "$INSTDIR\' + [IO.Path]::GetRelativePath($payload, $_.FullName) + '"' })
  $uninstallList = Join-Path $buildRoot 'uninstall-files.nsh'
  $uninstallLines | Set-Content -LiteralPath $uninstallList -Encoding utf8NoBOM

  $failureMessage = '安装包编译失败，请查看 dist/installer-build/安装包编译.log。'
  & $Compiler /INPUTCHARSET UTF8 /OUTPUTCHARSET UTF8 "/DPAYLOAD_DIR=$payload" "/DOUTPUT_FILE=$compiledInstaller" "/DAPP_VERSION=$version" "/DUNINSTALL_FILES=$uninstallList" (Join-Path $PSScriptRoot 'installer.nsi') |
    Out-File -LiteralPath (Join-Path $buildRoot '安装包编译.log') -Encoding utf8
  if ($LASTEXITCODE -ne 0) { throw '安装包编译失败。' }
  # 先完成编译，再覆盖固定产物；旧安装器被占用时保留已编译的新包。
  $failureMessage = '新安装包已编译，覆盖旧安装包失败，请关闭正在运行的安装器后重新打包。'
  Copy-Item -LiteralPath $compiledInstaller -Destination $installer -Force

  $failureMessage = '生成便携包失败，请检查是否有程序正在占用旧包。'
  if (Test-Path -LiteralPath $portable) { Remove-Output $portable }
  [IO.Compression.ZipFile]::CreateFromDirectory($payload, $portable, [IO.Compression.CompressionLevel]::Optimal, $false)
  foreach ($artifact in @($installer, $portable)) {
    ((Get-FileHash -LiteralPath $artifact).Hash.ToLower() + '  ' + [IO.Path]::GetFileName($artifact)) | Set-Content -LiteralPath ($artifact + '.sha256') -Encoding utf8NoBOM
  }
  # 固定文件名覆盖后通知资源管理器更新图标，避免继续显示旧安装包的缓存图标。
  Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class PackageIconCache {
  [DllImport("shell32.dll", CharSet = CharSet.Unicode)]
  public static extern void SHChangeNotify(uint eventId, uint flags, string item1, IntPtr item2);
}
'@
  foreach ($programFile in @($installer, $program)) { [PackageIconCache]::SHChangeNotify(0x2000, 0x1005, $programFile, [IntPtr]::Zero) }
  [PackageIconCache]::SHChangeNotify(0x08000000, 0x1000, $null, [IntPtr]::Zero)
  Write-Host "已生成安装包：$installer"
  Write-Host "已生成便携包：$portable"
  Write-Host '产物名称固定，后续打包会覆盖更新。'
} catch {
  Write-Host $failureMessage -ForegroundColor Red
  exit 1
}
