@echo off
chcp 65001 >nul
title 启动栖界指纹浏览器(发行版)

set SCRIPT_DIR=%~dp0
set APP_EXE=%SCRIPT_DIR%dist\fingerprint-browser-win-x64\指纹浏览器.exe

if not exist "%APP_EXE%" (
  echo [提示] 未找到打包程序：%APP_EXE%
  echo 请先运行 打包.bat 完成打包。
  pause
  exit /b 1
)

echo 正在启动已打包的栖界指纹浏览器...
start "" "%APP_EXE%" %*
exit /b 0
