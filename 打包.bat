@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
set "PACKAGE_SCRIPT=%SCRIPT_DIR%fingerprint-browser\scripts\package.ps1"
set "NO_PAUSE="

if "%~1"=="--no-pause" (
  set "NO_PAUSE=1"
)

where pwsh >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] PowerShell 7 (pwsh) is required. Please install pwsh.
  if not defined NO_PAUSE pause
  exit /b 1
)

if defined NO_PAUSE (
  pwsh -NoProfile -ExecutionPolicy Bypass -File "%PACKAGE_SCRIPT%"
) else (
  pwsh -NoProfile -ExecutionPolicy Bypass -File "%PACKAGE_SCRIPT%" %*
)
set "EXIT_CODE=%ERRORLEVEL%"

if %EXIT_CODE% NEQ 0 (
  echo.
  echo [ERROR] Packaging failed with exit code %EXIT_CODE%.
  if not defined NO_PAUSE pause
  exit /b %EXIT_CODE%
)

if not defined NO_PAUSE pause
exit /b 0
