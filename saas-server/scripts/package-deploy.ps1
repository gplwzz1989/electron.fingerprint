param([string]$OutputRoot)
$ErrorActionPreference = 'Stop'
$serverRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$distRoot = Join-Path $serverRoot 'dist'
if (!$OutputRoot) { $OutputRoot = Join-Path $distRoot ('saas-deploy-' + (Get-Date -Format 'yyyyMMdd-HHmmss')) }
$outputDirectory = [IO.Path]::GetFullPath($OutputRoot)
if (!$outputDirectory.StartsWith($distRoot + [IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { throw '部署包必须输出到工作区 dist 目录内。' }
if (Test-Path -LiteralPath $outputDirectory) { throw '部署目录已存在，请使用新目录，避免覆盖已有配置或用户数据。' }
$payload = Join-Path $outputDirectory 'qijie-saas-server'
$server = Join-Path $payload 'saas-server'
New-Item -ItemType Directory -Path $server -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $serverRoot 'src') -Destination $server -Recurse
Copy-Item -LiteralPath (Join-Path $serverRoot 'public') -Destination $server -Recurse
Copy-Item -LiteralPath (Join-Path $serverRoot 'docs') -Destination $server -Recurse
foreach ($file in @('.env.example','README.md')) { Copy-Item -LiteralPath (Join-Path $serverRoot $file) -Destination (Join-Path $server $file) }
foreach ($file in @('README.md','start.ps1','start.sh')) { Copy-Item -LiteralPath (Join-Path $serverRoot "deploy/$file") -Destination (Join-Path $payload $file) }
$metadata = Get-Content -LiteralPath (Join-Path $serverRoot 'package.json') -Raw -Encoding utf8 | ConvertFrom-Json
$metadata.scripts = @{ start = 'node src/workspace-server.js' }
$metadata | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath (Join-Path $server 'package.json') -Encoding utf8NoBOM
Copy-Item -LiteralPath (Join-Path $serverRoot 'package-lock.json') -Destination (Join-Path $server 'package-lock.json')
$lock = Get-Content -LiteralPath (Join-Path $server 'package-lock.json') -Raw -Encoding utf8 | ConvertFrom-Json -AsHashtable
foreach ($package in $lock.packages.Values) {
  if ($package.resolved) { $uri = [Uri]$package.resolved; if ($uri.UserInfo -or $uri.Query -or $uri.Scheme -ne 'https') { throw '依赖锁文件含非公开下载地址，已停止打包。' } }
}
Push-Location -LiteralPath $server
$npmCommand = if ($IsWindows) { 'npm.cmd' } else { 'npm' }
try { & $npmCommand ci --omit=dev --ignore-scripts --no-audit --no-fund; if ($LASTEXITCODE -ne 0) { throw '部署依赖安装失败。' } } finally { Pop-Location }
if (Get-ChildItem -LiteralPath (Join-Path $server 'node_modules') -Recurse -File -Filter '*.node') { throw '部署依赖含平台原生模块，不能声明为跨平台包。' }
$files = Get-ChildItem -LiteralPath $payload -Recurse -File
if ($files | Where-Object { $_.Name -like '.env.*' -and $_.Name -ne '.env.example' -or $_.Extension -in @('.pem','.key','.p12','.pfx') }) { throw '部署包中发现真实环境配置或证书，已停止打包。' }
$commit = '未记录'; $dirty = $false
if (Get-Command git -ErrorAction SilentlyContinue) { $revision = & git -C $serverRoot rev-parse HEAD 2>$null; if ($LASTEXITCODE -eq 0) { $commit = $revision; $dirty = [bool](& git -C $serverRoot status --porcelain -- .) } }
@{ product='栖界 SaaS 服务端'; version=$metadata.version; sourceCommit=$commit; sourceDirty=$dirty; node='>=20'; database='MySQL'; dependencies=$metadata.dependencies } | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath (Join-Path $payload 'release-manifest.json') -Encoding utf8NoBOM
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = Join-Path $outputDirectory '栖界-SaaS服务端部署包.zip'
[IO.Compression.ZipFile]::CreateFromDirectory($payload,$archive,[IO.Compression.CompressionLevel]::Optimal,$false)
((Get-FileHash -LiteralPath $archive).Hash.ToLower() + '  ' + [IO.Path]::GetFileName($archive)) | Set-Content -LiteralPath ($archive + '.sha256') -Encoding utf8NoBOM
Write-Output "已生成服务端部署包：$archive"
