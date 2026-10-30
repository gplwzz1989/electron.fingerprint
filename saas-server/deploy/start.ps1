param([ValidateSet('dev', 'test', 'prod')][string]$Environment = 'prod')
$ErrorActionPreference = 'Stop'
$serverDirectory = Join-Path $PSScriptRoot 'saas-server'
$configFile = Join-Path $serverDirectory ".env.$Environment"
if (!(Test-Path -LiteralPath $configFile)) { throw "请先将 saas-server/.env.example 复制为 .env.$Environment，并填写数据库与邮件配置。" }
$env:SAAS_ENV = $Environment
Set-Location -LiteralPath $serverDirectory
& node server/index.js
exit $LASTEXITCODE
