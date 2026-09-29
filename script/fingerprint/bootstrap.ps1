$ErrorActionPreference = 'Stop'
$env:ELECTRON_BUILD_TOOLS_ROOT = 'G:\codex-build-tools\build-tools'
$env:Path = 'G:\nvm4w\global;G:\nvm4w\v22.18.0;G:\codex-build-tools\depot_tools;G:\codex-build-tools\bin;' + $env:Path
e sync
