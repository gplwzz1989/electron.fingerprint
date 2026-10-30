param([string]$OutputRoot, [string]$NccCli = $env:SAAS_NCC_CLI, [string]$PlatformRoot = $env:FP_PLATFORM_ROOT)
$ErrorActionPreference = 'Stop'
$serverRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$distRoot = Join-Path $serverRoot 'dist'
if (!$OutputRoot) { $OutputRoot = $distRoot }
$outputDirectory = [IO.Path]::GetFullPath($OutputRoot)
if (!$outputDirectory.Equals($distRoot,[StringComparison]::OrdinalIgnoreCase)) { throw '部署包必须使用 saas-server/dist 固定目录，不能创建历史版本目录。' }
# 先核验工具和输入，再将旧产物移入回收站；不触碰外部运行时和原生缓存。
if (!$NccCli -or !(Test-Path -LiteralPath $NccCli -PathType Leaf)) { throw '请通过 NccCli 参数或 SAAS_NCC_CLI 指定已有 ncc 编译工具入口。' }
$NccCli = (Resolve-Path -LiteralPath $NccCli).Path
if ($NccCli.StartsWith($distRoot + [IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { throw '打包工具位于待清理目录，请使用目录外的已有工具。' }
foreach ($inputPath in @('src/workspace-server.js','src/fingerprint/profiles','public','deploy/production.env.example','package.json','deploy/start.ps1','deploy/start.sh','deploy/ecosystem.config.js')) {
  if (!(Test-Path -LiteralPath (Join-Path $serverRoot $inputPath))) { throw ('打包所需文件缺失：' + $inputPath) }
}
& node --check (Join-Path $serverRoot 'src/workspace-server.js')
if ($LASTEXITCODE -ne 0) { throw '服务端入口语法检查失败。' }
& node $NccCli version
if ($LASTEXITCODE -ne 0) { throw '单文件打包工具不可用。' }
if (!$PlatformRoot) { $PlatformRoot = Join-Path $serverRoot '../../media-platform' }
$PlatformRoot = [IO.Path]::GetFullPath($PlatformRoot)
if ($PlatformRoot.StartsWith($distRoot + [IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { throw '平台项目位于待清理目录，请使用目录外的实际平台项目。' }
foreach ($file in @('src/server.cjs','scripts/release.cjs','package.json')) {
  if (!(Test-Path -LiteralPath (Join-Path $PlatformRoot $file) -PathType Leaf)) { throw ('平台授权项目缺少文件：' + $file) }
}
& node -e "require.resolve('@yixiaoer/platform-service', {paths:[process.argv[1]]})" $PlatformRoot
if ($LASTEXITCODE -ne 0) { throw '平台身份核验依赖未安装，已保留旧产物。' }
if (Test-Path -LiteralPath $distRoot) {
  $pending = [Collections.Generic.Queue[string]]::new()
  $pending.Enqueue($distRoot)
  while ($pending.Count) {
    $directory = $pending.Dequeue()
    if ((Get-Item -LiteralPath $directory -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw '产物目录包含链接，已停止清理。' }
    foreach ($item in (Get-ChildItem -LiteralPath $directory -Force)) {
      if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw '产物目录包含链接，已停止清理。' }
      if ($item.PSIsContainer) {
        if ($item.Name -in @('data','workspace')) { throw '旧产物包含数据目录，已停止清理，请先检查并备份。' }
        $pending.Enqueue($item.FullName)
      } elseif (($item.Name -like '.env.*' -and $item.Name -ne '.env.example') -or $item.Name -in @('.env','encryption.key','electron.exe','profiles.json','environments.json') -or $item.Extension -in @('.pem','.key','.p12','.pfx')) { throw '旧产物包含配置、密钥、用户数据或运行时，已停止清理。' }
    }
  }
  if ($IsWindows) {
    $running = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -and $_.CommandLine.Replace('/','\').Contains($distRoot) }
    if ($running) { throw '旧部署产物正在运行，请先停止服务再打包。' }
    Add-Type -AssemblyName Microsoft.VisualBasic
    foreach ($item in (Get-ChildItem -LiteralPath $distRoot -Force)) {
      if ($item.PSIsContainer) { [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteDirectory($item.FullName, 'OnlyErrorDialogs', 'SendToRecycleBin') }
      else { [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile($item.FullName, 'OnlyErrorDialogs', 'SendToRecycleBin') }
    }
  } else { throw '当前清理流程需要 Windows 回收站，已保留旧产物。' }
}
$payload = Join-Path $outputDirectory 'qijie-saas-server'
$server = Join-Path $payload 'saas-server'
New-Item -ItemType Directory -Path $server -Force | Out-Null
# 业务代码和运行依赖合并为单文件，不分发源码目录或 node_modules。
& node $NccCli build (Join-Path $serverRoot 'src/workspace-server.js') -o (Join-Path $server 'server') --no-cache
if ($LASTEXITCODE -ne 0) { throw '服务端单文件打包失败。' }
# 授权脚本与身份核验模块一并生成，只分发当前清单引用的脚本。
& node (Join-Path $PlatformRoot 'scripts/release.cjs')
if ($LASTEXITCODE -ne 0) { throw '平台授权脚本生成失败。' }
$platformDirectory = Join-Path $server 'platform-service'
& node $NccCli build (Join-Path $PlatformRoot 'src/server.cjs') -o (Join-Path $platformDirectory 'server') --no-cache
if ($LASTEXITCODE -ne 0) { throw '平台身份核验模块打包失败。' }
$platformManifest = Get-Content -LiteralPath (Join-Path $PlatformRoot 'dist/manifest.json') -Raw -Encoding utf8 | ConvertFrom-Json
if ($platformManifest.file -notmatch '^authorization-[0-9]+\.[0-9]+\.[0-9]+-[a-f0-9]{12}\.js$') { throw '平台授权脚本清单无效。' }
$platformAssets = Join-Path $platformDirectory 'dist'
New-Item -ItemType Directory -Path $platformAssets -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $PlatformRoot 'dist/manifest.json') -Destination (Join-Path $platformAssets 'manifest.json')
Copy-Item -LiteralPath (Join-Path $PlatformRoot ('dist/' + $platformManifest.file)) -Destination (Join-Path $platformAssets $platformManifest.file)
if ((Get-FileHash -LiteralPath (Join-Path $platformAssets $platformManifest.file)).Hash.ToLower() -ne $platformManifest.sha256) { throw '平台授权脚本校验失败。' }
Copy-Item -LiteralPath (Join-Path $serverRoot 'src/fingerprint/profiles') -Destination (Join-Path $server 'server/profiles') -Recurse
# 只复制网页运行资源，排除项目说明和素材来源记录。
$publicRoot = Join-Path $serverRoot 'public'
foreach ($file in (Get-ChildItem -LiteralPath $publicRoot -Recurse -File)) {
  if ($file.Extension -in @('.md','.markdown') -or $file.Name -eq '来源.json') { continue }
  $destination = Join-Path (Join-Path $server 'public') ([IO.Path]::GetRelativePath($publicRoot, $file.FullName))
  New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName($destination)) -Force | Out-Null
  Copy-Item -LiteralPath $file.FullName -Destination $destination
}
Copy-Item -LiteralPath (Join-Path $serverRoot 'deploy/production.env.example') -Destination (Join-Path $server '.env.example')
# 部署模板使用正式域名，不携带任何开发或生产凭据。
$templateFile = Join-Path $server '.env.example'
$template = [IO.File]::ReadAllText($templateFile).Replace('SAAS_PUBLIC_URL=http://127.0.0.1:8088', 'SAAS_PUBLIC_URL=https://qijie.xinmeitool.com').Replace('PORT=8088', 'PORT=8710')
[IO.File]::WriteAllText($templateFile, $template, [Text.UTF8Encoding]::new($false))
foreach ($file in @('start.ps1','start.sh','ecosystem.config.js')) { Copy-Item -LiteralPath (Join-Path $serverRoot "deploy/$file") -Destination (Join-Path $payload $file) }
$metadata = Get-Content -LiteralPath (Join-Path $serverRoot 'package.json') -Raw -Encoding utf8 | ConvertFrom-Json
# 运行依赖已经并入单文件，部署时不再安装依赖。
# PM2 和启动脚本直接执行入口，无需分发 package.json。
$files = Get-ChildItem -LiteralPath $payload -Recurse -File
if ($files | Where-Object { $_.Name -like '.env.*' -and $_.Name -ne '.env.example' -or $_.Extension -in @('.pem','.key','.p12','.pfx') }) { throw '部署包中发现真实环境配置或证书，已停止打包。' }
$commit = '未记录'; $dirty = $false
if (Get-Command git -ErrorAction SilentlyContinue) { $revision = & git -C $serverRoot rev-parse HEAD 2>$null; if ($LASTEXITCODE -eq 0) { $commit = $revision; $dirty = [bool](& git -C $serverRoot status --porcelain -- .) } }
@{ product='栖界 SaaS 服务端'; version=$metadata.version; sourceCommit=$commit; sourceDirty=$dirty; node='>=22'; database='MySQL'; format='单文件服务端'; dependencies=$metadata.dependencies } | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath (Join-Path $outputDirectory 'release-manifest.json') -Encoding utf8NoBOM
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = Join-Path $outputDirectory '栖界-SaaS服务端部署包.zip'
[IO.Compression.ZipFile]::CreateFromDirectory($payload,$archive,[IO.Compression.CompressionLevel]::Optimal,$false)
((Get-FileHash -LiteralPath $archive).Hash.ToLower() + '  ' + [IO.Path]::GetFileName($archive)) | Set-Content -LiteralPath ($archive + '.sha256') -Encoding utf8NoBOM
Write-Output "已生成服务端部署包：$archive"
