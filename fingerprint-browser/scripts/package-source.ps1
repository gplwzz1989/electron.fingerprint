param()
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$metadata = Get-Content -LiteralPath (Join-Path $projectRoot 'package.json') -Raw -Encoding utf8 | ConvertFrom-Json
$name = ($metadata.name -replace '^@[^/]+/', '')
$output = Join-Path $projectRoot ('dist/source-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
$payload = Join-Path $output $name
New-Item -ItemType Directory -Path $payload -Force | Out-Null
# 只导出本项目白名单，不读取相邻项目、用户数据、环境密钥或运行时缓存。
$rootFiles = @('package.json','package-lock.json','build-config.example.json','.env.example','.gitignore','LICENSE')
$files = @(Get-ChildItem -LiteralPath $projectRoot -File | Where-Object { $_.Extension -in @('.js','.md') -or $_.Name -in $rootFiles -or $_.Name -in @('browser-shell.html','browser-shell.css','new-tab.html','new-tab.css','update-installer.ps1') })
foreach ($file in $files) { Copy-Item -LiteralPath $file.FullName -Destination $payload }
foreach ($directory in @('src','public','docs','deploy','scripts','test','assets','platform-automation','renderer','profiles','media-hub','creator-hub')) {
  $source = Join-Path $projectRoot $directory
  if (Test-Path -LiteralPath $source) {
    if (Get-ChildItem -LiteralPath $source -Recurse -Force | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint }) { throw '源码目录包含链接，已停止导出。' }
    Copy-Item -LiteralPath $source -Destination $payload -Recurse
  }
}
$unsafe = Get-ChildItem -LiteralPath $payload -Recurse -Force -File | Where-Object { ($_.Name -match '^\.env(?:\.|$)' -and $_.Name -ne '.env.example') -or $_.Name -in @('client-config.json','build-config.json','automation-access.json') -or $_.Extension -in @('.pem','.key','.pfx','.p12') }
if ($unsafe) { throw '源码包包含私有配置或密钥，已停止导出。' }
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = Join-Path $output ($name + '-source.zip')
[IO.Compression.ZipFile]::CreateFromDirectory($payload, $archive, [IO.Compression.CompressionLevel]::Optimal, $false)
((Get-FileHash -LiteralPath $archive).Hash.ToLowerInvariant() + '  ' + [IO.Path]::GetFileName($archive)) | Set-Content -LiteralPath ($archive + '.sha256') -Encoding utf8NoBOM
Write-Output "已生成独立源码包：$archive"
