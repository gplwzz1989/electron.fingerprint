param(
  [string]$Python = 'python'
)

$ErrorActionPreference = 'Stop'
& $Python 'fp-kernel/tools/verify-version.py'
& $Python 'fp-kernel/tools/verify-patches.py'
Write-Host 'FP 基础验证通过'
