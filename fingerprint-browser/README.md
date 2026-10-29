# 桌面浏览器基座

本目录是独立的桌面应用项目，可单独放入任意 Git 仓库。无需同级业务服务、数据库、邮件配置或其他项目源码。第三方应用通过配置固定首页并调用公开桥接协议使用基座。

基座提供固定首页、多标签、普通网页与系统页面权限隔离、独立浏览环境、指纹参数执行、代理连接、本地令牌鉴权接口、自动化和签名更新。业务应用自行处理用户、登录、团队、账号授权、套餐、支付、指纹生成和业务数据库；基座不请求这些业务接口，不解析业务 Cookie。

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
pwsh -NoProfile -File scripts/package.ps1 -Environment dev -RuntimeRoot "已有运行时目录"
```

产物只写入本项目 `dist/`；脚本可在没有父级 Git 仓库的解压目录运行。Windows 安装包需要既有 NSIS 与资源编辑工具，可通过脚本参数指定。安装器按应用名称和标识配置安装目录、卸载注册项，不强杀运行中的其他基座。

真实第三方页面验证：使用运行时执行 `test/third-party-runtime.js` 并传入报告 JSON 的绝对路径；此测试不需要业务服务或 MySQL，只启动隔离的普通 HTTP 页面。

## 公开接入协议

网页使用 `window.desktopBridge` 与 `window.browserApi`。固定首页默认有完整能力；加号新建的网页没有桥接。系统创建页面的能力由固定首页配置，不能自行提权。本地 HTTP 接口仍只做令牌鉴权，不限制来源。

接口和密文格式见 [PROTOCOL.md](PROTOCOL.md)。不要导入基座源码来接入业务应用；通过版本化的桥接、HTTP 和 JSON 协议通信。

## 更新

显式设置 `updateUrl`、Ed25519 `updatePublicKey` 与 `updatesEnabled`。更新地址可以是任何符合公开清单格式的静态站点或发布服务，与首页提供方无关。未配置时显示更新未启用，不猜测业务系统的接口地址。私钥禁止放入客户端配置或公开目录。

`scripts/publish-update.js` 可生成密钥和签名清单，`--base-url` 指向安装包的公开下载目录；生成的 `{环境}-win32-x64.json` 可以作为任意静态文件发布，再将它的完整地址配置为 `updateUrl`。

旧业务界面和历史产品设计不属于基座发行内容；运行时缓存和原生编译目录不属于此项目源码。
