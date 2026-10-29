# 栖界 SaaS 服务端部署包

要求 Node.js 20 或更新版本、可连接的 MySQL。包中包含运行依赖，首次启动不需要联网安装 npm 包；依赖均为 JavaScript，无 Chromium/Electron 内核和平台原生扩展。

## 部署

1. 解压后只需 `saas-server` 目录及包内启动脚本。全部服务端模块已归入自身 `src/`，无需桌面项目目录或运行时。
2. 首次部署时，将 `saas-server/.env.example` 复制为 `saas-server/.env.prod`，填写 `DB_HOST`、`DB_PORT`、`DB_USER`、`DB_PASSWORD`、`DB_NAME`。已有环境配置应保留，不要覆盖。
3. 填写 `SAAS_PUBLIC_URL` 为对外 HTTPS 页面地址；默认 `HOST=127.0.0.1`、`PORT=8088`，可在同机使用反向代理提供 HTTPS。让该地址与客户端 prod 打包配置中的地址一致。
4. QQ 邮件填写 `SMTP_USER`、`SMTP_PASSWORD`（SMTP 授权码）、`SMTP_FROM`，默认 `smtp.qq.com:465`、SSL 已预填。支付配置和套餐说明见 `saas-server/README.md`；未配置真实商户时保持关闭。
5. Linux/macOS 执行 `sh start.sh prod`；Windows PowerShell 执行 `pwsh -File start.ps1 -Environment prod`。

程序从配置文件连接 MySQL，并在对应数据库创建所需表；不会初始化演示账号。配置文件只保留样例，包中没有真实数据库密码、邮箱授权码、商户证书或用户数据。服务端 `data/workspace/encryption.key` 在首次启动时生成，后续升级应与数据库一同保留和备份，以继续解密指纹、环境快照、代理凭据与验证码摘要。

桌面接入通过版本化的通用桥接和加密协议完成，业务 SDK 由网页自身提供。服务端启动会在事务中将旧明文指纹迁移为密文，不改变历史版本与种子；仍兼容已发行的旧加密消息。可选更新公开目录由 `.env.prod` 的 `CLIENT_UPDATES_DIR` 配置，私钥必须放在目录之外；第三方也可使用独立静态更新站点。接入说明见本项目 `docs/desktop-integration.md`。

## 升级与检查

- 升级前停止旧服务，保留真实 `.env.*`、`data/` 和数据库，替换程序文件后重启。
- `GET /api/health` 返回可用状态后再打开网页，首次使用通过邮箱验证码注册。
- 当前未接入的社媒平台不会提供虚假授权；QQ 公网投递和真实商户收款仍以部署后的实际外部服务验收为准。
- `release-manifest.json` 记录依赖版本、来源提交及构建时是否有未提交修改；`.sha256` 可用于校验 ZIP 文件。
