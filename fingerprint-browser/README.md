# 桌面浏览器基座 (@qijie/desktop-base)

本目录是独立的桌面应用项目，同时支持作为 NPM 包在第三方应用与 CLI 中快速集成。无需同级业务服务、数据库、邮件配置或其他项目源码。第三方应用通过配置固定首页并调用公开桥接协议使用基座。

基座提供固定首页、多标签、普通网页与系统页面权限隔离、独立浏览环境、指纹参数执行、代理连接、本地令牌鉴权接口、自动化和签名更新。业务应用自行处理用户、登录、团队、账号授权、套餐、支付、指纹生成和业务数据库；基座不请求这些业务接口，不解析业务 Cookie。

## NPM 包使用指南

### 1. 安装

```bash
# 本地项目安装
npm install @qijie/desktop-base

# 或全局安装 CLI 工具
npm install -g @qijie/desktop-base
```

### 2. 命令行 CLI 使用

安装后即可直接使用 `fingerprint-browser` 或 `qijie-desktop` 命令，也支持 `npx` 免安装运行：

```bash
# 快速启动指定应用页面的浏览器基座
npx @qijie/desktop-base --url https://your-saas-domain.com

# 显式指定指纹内核运行时与运行环境
npx @qijie/desktop-base --runtime "D:/path/to/electron-fp-build/src/out/Release" --env dev

# 后台脱离终端静默启动
npx @qijie/desktop-base --url https://your-saas-domain.com --detached
```

**常用 CLI 选项**：
- `-u, --url <url>`：覆盖或指定浏览器基座启动的首页 URL。
- `-r, --runtime <dir>`：指定指纹版 Electron 运行时路径（也可通过环境变量 `FP_ELECTRON_RUNTIME` 设定）。
- `-d, --data-dir <dir>`：指定用户数据存储目录（也可通过环境变量 `FP_BROWSER_DATA_DIR` 设定）。
- `-e, --env <env>`：指定配置环境（`prod` | `dev` | `test`）。
- `--name <appName>`：定制窗口标题与应用名。
- `--id <appId>`：定制独立单实例锁与应用标识。
- `--detached`：在后台独立进程启动并释放终端。

---

### 3. Node.js 编程调用 (Programmatic API)

在后端服务、本地调度器或自动化脚本中直接导入基座能力：

```javascript
const {
  launch,
  sealLaunch,
  createLaunchRequest,
  getDefaultProfile,
  PROTOCOL_VERSION
} = require('@qijie/desktop-base')

// 1. 编程方式启动指纹浏览器基座
async function main() {
  const instance = await launch({
    appUrl: 'https://your-workspace.com',
    runtimeRoot: 'D:/path/to/runtime',
    environment: 'prod',
    // 传递给底层的额外 Chromium 参数
    extraArgs: ['--disable-gpu-shader-disk-cache']
  })

  console.log(`浏览器基座已启动，PID: ${instance.pid}，数据目录: ${instance.dataRoot}`)

  // 监听进程退出
  instance.process.on('exit', code => {
    console.log(`基座退出，退出码: ${code}`)
  })
}

// 2. 服务端生成符合规范的加密启动信封 (desktop-launch-v1)
function generateLaunchEnvelope(clientPublicKeyRequest, profileConfig) {
  const envelope = sealLaunch(
    profileConfig,
    clientPublicKeyRequest,
    { workspaceId: 'team-uuid', environmentId: 'env-uuid' }
  )
  return envelope
}
```

---

## 独立启动

要求 Node.js 22 或更新版本，以及已有的自定义 Electron 37.2.6 运行时。普通 Electron 不等价于已验证的指纹内核；基座不会自动下载、编译或修改内核。

1. 复制 `build-config.example.json` 为 `build-config.json`。
2. 配置 `appUrl` 为第三方应用的 HTTPS 地址，本机开发可使用 HTTP；固定首页由打包配置决定。
3. 配置应用独有的 `applicationId` 和 `appName`。不同应用标识对应不同的客户端单实例锁和数据目录，不共用业务会话。
4. 设置 `FP_ELECTRON_RUNTIME` 为已提供运行时目录，执行 `npm start`。也可将运行时放入本项目 `runtime/`。

不需要安装相邻服务的依赖。源码包不包含运行时、真实配置、用户数据或签名私钥。

## 独立验证与打包

```powershell
npm test
npm run package:source
pwsh -NoProfile -File scripts/package.ps1 -Environment prod -RuntimeRoot "已有运行时目录"
```

默认打包环境为 `prod`，首页为 `https://qijie.xinmeitool.com`；开发包需显式指定 `-Environment dev`。生产更新清单地址为 `https://qijie.xinmeitool.com/api/client-updates/prod/win32/x64.json`，配置正式验签公钥并发布签名清单后再开启自动更新。

产物只写入本项目 `dist/`；脚本可在没有父级 Git 仓库的解压目录运行。Windows 安装包需要既有 NSIS 与资源编辑工具，可通过脚本参数指定。安装器按应用名称和标识配置安装目录、卸载注册项，不强杀运行中的其他基座。

真实第三方页面验证：使用运行时执行 `test/third-party-runtime.js` 并传入报告 JSON 的绝对路径；此测试不需要业务服务或 MySQL，只启动隔离的普通 HTTP 页面。

## 公开接入协议

网页使用 `window.desktopBridge` 与 `window.browserApi`。固定首页默认有完整能力；加号新建的网页没有桥接。系统创建页面的能力由固定首页配置，不能自行提权。本地 HTTP 接口仍只做令牌鉴权，不限制来源。

接口和密文格式见 [PROTOCOL.md](PROTOCOL.md)。不要导入基座源码来接入业务应用；通过版本化的桥接、HTTP 和 JSON 协议通信。

## 更新

显式设置 `updateUrl`、Ed25519 `updatePublicKey` 与 `updatesEnabled`。更新地址可以是任何符合公开清单格式的静态站点或发布服务，与首页提供方无关。未配置时显示更新未启用，不猜测业务系统的接口地址。私钥禁止放入客户端配置或公开目录。

`scripts/publish-update.js` 可生成密钥和签名清单，`--base-url` 指向安装包的公开下载目录；生成的 `{环境}-win32-x64.json` 可以作为任意静态文件发布，再将它的完整地址配置为 `updateUrl`。

旧业务界面和历史产品设计不属于基座发行内容；运行时缓存和原生编译目录不属于此项目源码。
