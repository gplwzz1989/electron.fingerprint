Unicode true
!include "MUI2.nsh"
!include "x64.nsh"
!include "WinVer.nsh"
!include "LogicLib.nsh"
!include "StrFunc.nsh"
!include "FileFunc.nsh"
${StrStr}
Var AutoUpdate

!ifndef APP_NAME
!define APP_NAME "浏览器基座"
!endif
!ifndef APP_KEY
!define APP_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\com.qijie.fingerprintbrowser"
!endif
Name "${APP_NAME}"
OutFile "${OUTPUT_FILE}"
InstallDir "$PROGRAMFILES64\${APP_NAME}"
RequestExecutionLevel admin
SetCompressor /SOLID lzma
SetOverwrite on
!define MUI_ICON "${PAYLOAD_DIR}\resources\app\assets\saas.ico"
!define MUI_UNICON "${PAYLOAD_DIR}\resources\app\assets\saas.ico"
VIProductVersion "${APP_VERSION}.0"
VIAddVersionKey /LANG=2052 "ProductName" "${APP_NAME}"
VIAddVersionKey /LANG=2052 "CompanyName" "栖界"
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
  ${GetParameters} $3
  ClearErrors
  ${GetOptions} $3 "/UPDATE" $4
  ${IfNot} ${Errors}
    StrCpy $AutoUpdate "1"
  ${EndIf}
  SetRegView 64
  ReadRegStr $0 HKLM "${APP_KEY}" "InstallLocation"
  ${If} $0 != ""
    StrCpy $INSTDIR $0
  ${EndIf}
  ${IfNot} ${RunningX64}
    MessageBox MB_ICONSTOP "此安装包需要 64 位 Windows 系统。"
    Abort
  ${EndIf}
  ${IfNot} ${AtLeastWin10}
    MessageBox MB_ICONSTOP "此安装包需要 Windows 10 或更新版本。"
    Abort
  ${EndIf}
  app_check:
    nsExec::ExecToStack 'tasklist /FI "IMAGENAME eq 指纹浏览器.exe" /NH /FO CSV'
    Pop $0
    Pop $1
    ${StrStr} $2 $1 "指纹浏览器.exe"
    ${If} $2 != ""
      ${If} $AutoUpdate == "1"
        MessageBox MB_ICONEXCLAMATION "仍有其他栖界客户端正在运行。请关闭后重新执行更新。"
        SetErrorLevel 1
        Abort
      ${EndIf}
      MessageBox MB_ICONEXCLAMATION "检测到浏览器基座仍在运行，请先正常关闭客户端后重新安装。"
      Abort
    ${EndIf}
    Goto app_check_done
  app_check_done:
FunctionEnd

Section "安装客户端"
  SetShellVarContext all
  SetOutPath "$INSTDIR"
  File /r "${PAYLOAD_DIR}\*.*"
  WriteUninstaller "$INSTDIR\卸载.exe"
  CreateDirectory "$SMPROGRAMS\${APP_NAME}"
  CreateShortcut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\指纹浏览器.exe" "" "$INSTDIR\resources\app\assets\saas.ico"
  CreateShortcut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk" "$INSTDIR\指纹浏览器.exe" "" "$INSTDIR\resources\app\assets\saas.ico"
  CreateShortcut "$SMPROGRAMS\${APP_NAME}\卸载.lnk" "$INSTDIR\卸载.exe" "" "$INSTDIR\resources\app\assets\saas.ico"
  WriteRegStr HKLM "${APP_KEY}" "DisplayName" "${APP_NAME}"
  WriteRegStr HKLM "${APP_KEY}" "DisplayVersion" "${APP_VERSION}"
  WriteRegStr HKLM "${APP_KEY}" "Publisher" "栖界"
  WriteRegStr HKLM "${APP_KEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKLM "${APP_KEY}" "DisplayIcon" "$INSTDIR\resources\app\assets\saas.ico"
  WriteRegStr HKLM "${APP_KEY}" "UninstallString" '"$INSTDIR\卸载.exe"'
  WriteRegStr HKLM "${APP_KEY}" "QuietUninstallString" '"$INSTDIR\卸载.exe" /S'
  WriteRegDWORD HKLM "${APP_KEY}" "NoModify" 1
  WriteRegDWORD HKLM "${APP_KEY}" "NoRepair" 1
  ${If} $AutoUpdate == "1"
    ExecShell "open" "$WINDIR\explorer.exe" '"$INSTDIR\指纹浏览器.exe"'
  ${EndIf}
SectionEnd

Section "Uninstall"
  SetRegView 64
  SetShellVarContext all
  !include "${UNINSTALL_FILES}"
  Delete "$INSTDIR\卸载.exe"
  RMDir "$INSTDIR"
  Delete "$DESKTOP\${APP_NAME}.lnk"
  Delete "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk"
  Delete "$SMPROGRAMS\${APP_NAME}\卸载.lnk"
  RMDir "$SMPROGRAMS\${APP_NAME}"
  DeleteRegKey HKLM "${APP_KEY}"
SectionEnd
