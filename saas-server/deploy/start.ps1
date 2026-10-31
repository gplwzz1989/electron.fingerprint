param([ValidateSet('dev', 'test', 'prod')][string]$Environment = 'prod')
$ErrorActionPreference = 'Stop'
$serverDirectory = Join-Path $PSScriptRoot 'saas-server'
$configFile = Join-Path $serverDirectory ".env.$Environment"
if (!(Test-Path -LiteralPath $configFile)) { throw "请先将 saas-server/.env.example 复制为 .env.$Environment，并填写数据库与邮件配置。" }
$env:SAAS_ENV = $Environment
$env:PRISMA_CLI_QUERY_ENGINE_TYPE = 'binary'
$env:PRISMA_QUERY_ENGINE_BINARY = Join-Path $serverDirectory 'prisma-cli/query-engine-windows.exe'
$env:PRISMA_SCHEMA_ENGINE_BINARY = Join-Path $serverDirectory 'prisma-cli/schema-engine-windows.exe'
$env:PRISMA_CLI_PATH = Join-Path $serverDirectory 'prisma-cli/build/index.js'
Set-Location -LiteralPath $serverDirectory
& node scripts/prisma-cli.cjs db push
if ($LASTEXITCODE -ne 0) { throw 'Prisma 数据库结构同步失败，请检查数据库和 schema.prisma。' }
& node server/index.js
exit $LASTEXITCODE
