Unicode true
!include "MUI2.nsh"
!include "x64.nsh"
!include "WinVer.nsh"

!define APP_NAME "栖界指纹浏览器"
!define APP_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\com.qijie.fingerprintbrowser"
Name "${APP_NAME}"
OutFile "${OUTPUT_FILE}"
InstallDir "$LOCALAPPDATA\Programs\栖界\指纹浏览器"
InstallDirRegKey HKCU "${APP_KEY}" "InstallLocation"
RequestExecutionLevel user
SetCompressor /SOLID lzma
SetOverwrite on
Icon "${PAYLOAD_DIR}\resources\app\assets\saas.ico"
UninstallIcon "${PAYLOAD_DIR}\resources\app\assets\saas.ico"
VIProductVersion "${APP_VERSION}.0"
VIAddVersionKey /LANG=2052 "ProductName" "${APP_NAME}"
VIAddVersionKey /LANG=2052 "FileDescription" "${APP_NAME}安装程序"
VIAddVersionKey /LANG=2052 "FileVersion" "${APP_VERSION}"
VIAddVersionKey /LANG=2052 "LegalCopyright" "栖界"

!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN "$INSTDIR\指纹浏览器.exe"
!define MUI_FINISHPAGE_RUN_TEXT "启动栖界指纹浏览器"
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "SimpChinese"

Function .onInit
  ${IfNot} ${RunningX64}
    MessageBox MB_ICONSTOP "此安装包需要 64 位 Windows 系统。"
    Abort
  ${EndIf}
  ${IfNot} ${AtLeastWin10}
    MessageBox MB_ICONSTOP "此安装包需要 Windows 10 或更新版本。"
    Abort
  ${EndIf}
FunctionEnd

Section "安装客户端"
  SetShellVarContext current
  SetOutPath "$INSTDIR"
  File /r "${PAYLOAD_DIR}\*.*"
  WriteUninstaller "$INSTDIR\卸载.exe"
  CreateDirectory "$SMPROGRAMS\${APP_NAME}"
  CreateShortcut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\指纹浏览器.exe" "" "$INSTDIR\resources\app\assets\saas.ico"
  CreateShortcut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk" "$INSTDIR\指纹浏览器.exe" "" "$INSTDIR\resources\app\assets\saas.ico"
  CreateShortcut "$SMPROGRAMS\${APP_NAME}\卸载.lnk" "$INSTDIR\卸载.exe"
  WriteRegStr HKCU "${APP_KEY}" "DisplayName" "${APP_NAME}"
  WriteRegStr HKCU "${APP_KEY}" "DisplayVersion" "${APP_VERSION}"
  WriteRegStr HKCU "${APP_KEY}" "Publisher" "栖界"
  WriteRegStr HKCU "${APP_KEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${APP_KEY}" "DisplayIcon" "$INSTDIR\resources\app\assets\saas.ico"
  WriteRegStr HKCU "${APP_KEY}" "UninstallString" '"$INSTDIR\卸载.exe"'
  WriteRegStr HKCU "${APP_KEY}" "QuietUninstallString" '"$INSTDIR\卸载.exe" /S'
  WriteRegDWORD HKCU "${APP_KEY}" "NoModify" 1
  WriteRegDWORD HKCU "${APP_KEY}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  SetShellVarContext current
  !include "${UNINSTALL_FILES}"
  Delete "$INSTDIR\卸载.exe"
  RMDir "$INSTDIR"
  Delete "$DESKTOP\${APP_NAME}.lnk"
  Delete "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk"
  Delete "$SMPROGRAMS\${APP_NAME}\卸载.lnk"
  RMDir "$SMPROGRAMS\${APP_NAME}"
  DeleteRegKey HKCU "${APP_KEY}"
SectionEnd
