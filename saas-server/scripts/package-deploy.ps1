param([string]$OutputRoot, [string]$NccCli = $env:SAAS_NCC_CLI)
$ErrorActionPreference = 'Stop'
$serverRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$distRoot = Join-Path $serverRoot 'dist'
if (!$OutputRoot) { $OutputRoot = $distRoot }
$outputDirectory = [IO.Path]::GetFullPath($OutputRoot)
if (!$outputDirectory.Equals($distRoot,[StringComparison]::OrdinalIgnoreCase)) { throw '部署包必须使用 saas-server/dist 固定目录，不能创建历史版本目录。' }
if (!$NccCli) {
  $localNcc = Join-Path $serverRoot 'node_modules/@vercel/ncc/dist/ncc/cli.js'
  if (Test-Path -LiteralPath $localNcc -PathType Leaf) { $NccCli = $localNcc }
}
# 先核验工具和输入，再将旧产物移入回收站；不触碰外部运行时和原生缓存。
if (!$NccCli -or !(Test-Path -LiteralPath $NccCli -PathType Leaf)) { throw '请通过 NccCli 参数或 SAAS_NCC_CLI 指定已有 ncc 编译工具入口。' }
$NccCli = (Resolve-Path -LiteralPath $NccCli).Path
if ($NccCli.StartsWith($distRoot + [IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { throw '打包工具位于待清理目录，请使用目录外的已有工具。' }
foreach ($inputPath in @('src/workspace-server.js','src/fingerprint/profiles','public','deploy/production.env.example','package.json','deploy/start.sh','deploy/ecosystem.config.js','prisma/schema.prisma','scripts/prisma-cli.cjs','scripts/prepare-prisma-engines.cjs','scripts/build-deploy-bundles.cjs','node_modules/prisma/build/index.js','node_modules/@prisma/fetch-engine/dist/index.js','node_modules/@vercel/ncc/dist/ncc/cli.js')) {
  if (!(Test-Path -LiteralPath (Join-Path $serverRoot $inputPath))) { throw ('打包所需文件缺失：' + $inputPath) }
}
& npm run prisma:validate --prefix $serverRoot
if ($LASTEXITCODE -ne 0) { throw 'Prisma 数据库结构校验失败。' }
& npm run prisma:generate --prefix $serverRoot
if ($LASTEXITCODE -ne 0) { throw 'Prisma Client 或 Linux x64 查询引擎生成失败。' }
& npm run prisma:prepare-linux-engine --prefix $serverRoot
if ($LASTEXITCODE -ne 0) { throw 'Prisma Linux x64 Schema Engine 准备失败。' }
foreach ($engine in @('node_modules/.prisma/client/query-engine-debian-openssl-3.0.x','node_modules/.prisma/client/query-engine-windows.exe','node_modules/@prisma/engines/schema-engine-debian-openssl-3.0.x','node_modules/@prisma/engines/schema-engine-windows.exe')) {
  $enginePath = Join-Path $serverRoot $engine
  if (!(Test-Path -LiteralPath $enginePath -PathType Leaf) -or (Get-Item -LiteralPath $enginePath).Length -lt 1MB) { throw ('Prisma 原生引擎缺失或无效：' + $engine) }
}
& node --check (Join-Path $serverRoot 'src/workspace-server.js')
if ($LASTEXITCODE -ne 0) { throw '服务端入口语法检查失败。' }
& node $NccCli version
if ($LASTEXITCODE -ne 0) { throw '单文件打包工具不可用。' }
# 先构建 shadcn/ui 公共界面组件，成功后才清理旧交付物。
& node (Join-Path $serverRoot 'scripts/build-ui.cjs')
if ($LASTEXITCODE -ne 0) { throw '公共界面组件构建失败，已保留旧产物。' }
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
    foreach ($item in (Get-ChildItem -LiteralPath $distRoot -Recurse -Force -File)) {
      if (!$item.FullName.StartsWith($distRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw '产物文件路径超出固定目录。' }
      [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile($item.FullName, 'OnlyErrorDialogs', 'SendToRecycleBin')
    }
    foreach ($item in (Get-ChildItem -LiteralPath $distRoot -Recurse -Force -Directory | Sort-Object { $_.FullName.Length } -Descending)) {
      if (!$item.FullName.StartsWith($distRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw '产物目录路径超出固定目录。' }
      [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteDirectory($item.FullName, 'OnlyErrorDialogs', 'SendToRecycleBin')
    }
    foreach ($item in (Get-ChildItem -LiteralPath $distRoot -Force -File)) { [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile($item.FullName, 'OnlyErrorDialogs', 'SendToRecycleBin') }
  } else { throw '当前清理流程需要 Windows 回收站，已保留旧产物。' }
}
$payload = Join-Path $outputDirectory 'qijie-saas-server'
$server = Join-Path $payload 'saas-server'
New-Item -ItemType Directory -Path $server -Force | Out-Null
# 业务依赖合并进服务入口；只保留 Prisma Client 的生成运行文件，不复制完整 node_modules。
& node --expose-gc (Join-Path $serverRoot 'scripts/build-deploy-bundles.cjs') $server
if ($LASTEXITCODE -ne 0) { throw '服务端或 Prisma 同步工具打包失败。' }
# 授权脚本与身份核验模块由独立客户端加载；SaaS 部署包只包含业务服务与任务结果校验。
& node --check (Join-Path $server 'server/index.js')
if ($LASTEXITCODE -ne 0) { throw '服务端生成文件语法校验失败。' }
& node --check (Join-Path $server 'prisma-cli/build/index.js')
if ($LASTEXITCODE -ne 0) { throw 'Prisma 同步工具生成文件语法校验失败。' }
foreach ($directory in @('prisma','scripts')) { New-Item -ItemType Directory -Path (Join-Path $server $directory) -Force | Out-Null }
Copy-Item -LiteralPath (Join-Path $serverRoot 'prisma/schema.prisma') -Destination (Join-Path $server 'prisma/schema.prisma') -Force
Copy-Item -LiteralPath (Join-Path $serverRoot 'scripts/prisma-cli.cjs') -Destination (Join-Path $server 'scripts/prisma-cli.cjs') -Force
foreach ($engine in @(
  @{ Source = 'node_modules/.prisma/client/query-engine-debian-openssl-3.0.x'; Name = 'query-engine-debian-openssl-3.0.x' },
  @{ Source = 'node_modules/@prisma/engines/schema-engine-debian-openssl-3.0.x'; Name = 'schema-engine-debian-openssl-3.0.x' }
)) {
  Copy-Item -LiteralPath (Join-Path $serverRoot $engine.Source) -Destination (Join-Path $server "prisma-cli/$($engine.Name)") -Force
}
$env:PRISMA_CLI_QUERY_ENGINE_TYPE = 'binary'
$env:PRISMA_QUERY_ENGINE_BINARY = Join-Path $serverRoot 'node_modules/.prisma/client/query-engine-windows.exe'
$env:PRISMA_SCHEMA_ENGINE_BINARY = Join-Path $serverRoot 'node_modules/@prisma/engines/schema-engine-windows.exe'
& node (Join-Path $server 'prisma-cli/build/index.js') --version
if ($LASTEXITCODE -ne 0) { throw 'Prisma Linux CLI 构建校验失败。' }
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
foreach ($file in @('start.sh','ecosystem.config.js')) { Copy-Item -LiteralPath (Join-Path $serverRoot "deploy/$file") -Destination (Join-Path $payload $file) }
$metadata = Get-Content -LiteralPath (Join-Path $serverRoot 'package.json') -Raw -Encoding utf8 | ConvertFrom-Json
# 运行依赖已经并入单文件，部署时不再安装依赖。
# PM2 和启动脚本直接执行入口，无需分发 package.json。
$files = Get-ChildItem -LiteralPath $payload -Recurse -File
if ($files | Where-Object { $_.Extension -eq '.exe' }) { throw 'Linux x64 部署包中发现 Windows 可执行文件。' }
if ($files | Where-Object { $_.Name -like '.env.*' -and $_.Name -ne '.env.example' -or $_.Extension -in @('.pem','.key','.p12','.pfx') }) { throw '部署包中发现真实环境配置或证书，已停止打包。' }
$commit = '未记录'; $dirty = $false
if (Get-Command git -ErrorAction SilentlyContinue) { $revision = & git -C $serverRoot rev-parse HEAD 2>$null; if ($LASTEXITCODE -eq 0) { $commit = $revision; $dirty = [bool](& git -C $serverRoot status --porcelain -- .) } }
@{ product='栖界 SaaS 服务端'; version=$metadata.version; sourceCommit=$commit; sourceDirty=$dirty; node='>=22'; database='MySQL'; target='Linux x64 / Debian OpenSSL 3.0'; format='单文件服务端'; dependencies=$metadata.dependencies } | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath (Join-Path $outputDirectory 'release-manifest.json') -Encoding utf8NoBOM
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = Join-Path $outputDirectory '栖界-SaaS服务端部署包.zip'
[IO.Compression.ZipFile]::CreateFromDirectory($payload,$archive,[IO.Compression.CompressionLevel]::Optimal,$false)
# 对压缩包内的实际字节逐项核验，另附清单供服务器解压后使用 sha256sum -c 校验。
$checksums = [Collections.Generic.List[string]]::new()
$zip = [IO.Compression.ZipFile]::OpenRead($archive)
try {
  if ($zip.Entries | Where-Object { [IO.Path]::GetExtension($_.FullName) -eq '.exe' }) { throw 'Linux x64 部署包压缩内容中发现 Windows 可执行文件。' }
  foreach ($file in (Get-ChildItem -LiteralPath $payload -Recurse -File | Sort-Object FullName)) {
    $relative = [IO.Path]::GetRelativePath($payload, $file.FullName).Replace('\','/')
    $expectedHash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    $entry = $zip.GetEntry($relative)
    if (!$entry -or $entry.Length -ne $file.Length) { throw ('压缩包文件缺失或长度不一致：' + $relative) }
    $stream = $entry.Open(); $hasher = [Security.Cryptography.SHA256]::Create()
    try { $actualHash = [Convert]::ToHexString($hasher.ComputeHash($stream)).ToLowerInvariant() } finally { $stream.Dispose(); $hasher.Dispose() }
    if ($actualHash -ne $expectedHash) { throw ('压缩包内容校验失败：' + $relative) }
    $checksums.Add($expectedHash + '  ' + $relative)
  }
} finally { $zip.Dispose() }
[IO.File]::WriteAllText((Join-Path $outputDirectory 'SHA256SUMS'), ($checksums -join "`n") + "`n", [Text.UTF8Encoding]::new($false))
((Get-FileHash -LiteralPath $archive).Hash.ToLower() + '  ' + [IO.Path]::GetFileName($archive)) | Set-Content -LiteralPath ($archive + '.sha256') -Encoding utf8NoBOM
Write-Output "已生成服务端部署包：$archive"
