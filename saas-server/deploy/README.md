# 栖界 SaaS 服务端部署包

要求 Node.js 22 或更新版本、可连接的 MySQL。服务端业务代码和运行依赖已合并到 `saas-server/server/index.js` 单文件，首次启动不需要安装 npm 包；无 Chromium/Electron 内核和平台原生扩展。网页、指纹模板和配置文件作为外部资源随包提供。

## 部署

1. 解压后只需 `saas-server` 目录及包内启动脚本。服务端入口为 `saas-server/server/index.js`，无需 `src/`、`node_modules/` 或桌面项目目录。也可进入 `saas-server` 后设置 `SAAS_ENV=prod`，执行 `node server/index.js`。
2. 首次部署时，将 `saas-server/.env.example` 复制为 `saas-server/.env.prod`，填写 `DB_HOST`、`DB_PORT`、`DB_USER`、`DB_PASSWORD`、`DB_NAME`。已有环境配置应保留，不要覆盖。
3. `SAAS_PUBLIC_URL=https://qijie.xinmeitool.com` 已在部署模板中预填；默认 `HOST=127.0.0.1`、`PORT=8710`，可在同机使用反向代理提供 HTTPS。让该地址与客户端 prod 打包配置中的地址一致。
4. 在部署包根目录执行 `node saas-server/server/index.js --init-system-admin 管理员邮箱`。新账号将生成随机初始密码；已有账号只授予系统权限，不修改密码。然后登录 `/system-admin.html` 配置邮件、支付、套餐和更新；密钥加密保存且不回显。
5. Linux/macOS 执行 `sh start.sh prod`；Windows PowerShell 执行 `pwsh -File start.ps1 -Environment prod`。

程序从配置文件连接 MySQL，并在对应数据库创建所需表；不会初始化演示账号。配置文件只保留样例，包中没有真实数据库密码、邮箱授权码、商户证书或用户数据。服务端 `data/workspace/encryption.key` 在首次启动时生成，后续升级应与数据库一同保留和备份，以继续解密指纹、环境快照、代理凭据与验证码摘要。

桌面接入通过版本化的通用桥接和加密协议完成，业务 SDK 由网页自身提供。服务端启动会在事务中将旧明文指纹迁移为密文，不改变历史版本与种子；仍兼容已发行的旧加密消息。可选更新公开目录由 `.env.prod` 的 `CLIENT_UPDATES_DIR` 配置，私钥必须放在目录之外；第三方也可使用独立静态更新站点。接入说明见本项目 `docs/desktop-integration.md`。

## 升级与检查

- 升级前停止旧服务，保留真实 `.env.*`、`data/` 和数据库，替换程序文件后重启。
- PM2 配置仅监听 `server`、`public` 与平台运行资源目录，变更后延迟三秒重启，不监听数据及配置。升级前执行 `pm2 stop qijie-saas --watch` 关闭监听；全部文件上传并校验通过后，执行 `pm2 startOrRestart ecosystem.config.js --update-env` 和 `pm2 save`。只执行普通 stop 可能仍因上传变更被 watch 拉起；三秒延迟不能保证慢速上传已经完成。
- 不要在 PM2 运行时逐文件覆盖，也不要通过文本编辑器粘贴单文件 JS。将完整 ZIP 和包外 `SHA256SUMS` 上传，在解压后的启动脚本同级目录执行 `sha256sum -c /实际上传目录/SHA256SUMS`，全部通过后再启动。ZIP 本身先按 `.sha256` 校验；校验不一致时重新传输，不修改数据库、配置或加密密钥。
- `GET /api/health` 返回可用状态后再打开网页，首次使用通过邮箱验证码注册。
- 当前未接入的社媒平台不会提供虚假授权；QQ 公网投递和真实商户收款仍以部署后的实际外部服务验收为准。
- `release-manifest.json` 记录依赖版本、来源提交及构建时是否有未提交修改；`.sha256` 可用于校验 ZIP 文件。

## 配置填写说明

生产 `.env.example` 仅保留数据库连接、监听参数和持久化目录等启动字段。业务字段从系统管理后台维护；首次升级可自动迁移旧环境文件中的业务值，后续不再由旧文件覆盖。配置采用每行 `字段=值`，不支持行尾注释、变量替换或多行值；路径优先填写绝对路径。生产启动脚本设置 `SAAS_ENV=prod`，默认读取 `.env.prod`；不要依赖开发配置。`SAAS_CONFIG_FILE` 属于进程环境参数，标准部署不设置，避免不同模块读取不同配置。

- 必填：MySQL 连接信息；正常注册还需真实 SMTP 邮件服务。
- 平台账号授权：包内包含当前授权脚本、校验清单及身份核验模块，默认相对路径即可加载；不依赖开发机的相邻项目或 node_modules。
- 更新：`CLIENT_UPDATES_DIR` 相对于配置文件解析；生产更新接口为 `https://qijie.xinmeitool.com/api/client-updates/prod/win32/x64.json`。清单内安装包 URL 使用 `https://qijie.xinmeitool.com/api/client-updates/artifacts/文件名.exe`。客户端还需配置与签名私钥对应的正式公钥并开启更新，目前客户端生产更新默认关闭。
- 支付：不开通时保持 `PAYMENTS_ENABLED=false`，商户字段留空。开启时分别补齐需要使用的支付渠道字段，证书和私钥单独部署，不能放进公开目录。
- 套餐：`BILLING_PLANS_FILE` 指向 JSON，根对象字段为 `plans` 数组。每项需包含 `id`（字母、数字、下划线或短横线，最长48字符）、`name`（1至80字符）、`enabled`（布尔值）、`amount`（人民币分，1至100000000的整数）、`currency`（CNY）、`periodDays`（1至3660的整数）、`quotas`（含 fingerprints、environments、members 三个1至10000000的整数）。必须填写真实售卖配置，包内不预置假套餐。
- 持久化：将数据目录及其中的 `encryption.key` 与数据库一同备份；丢失密钥后无法恢复已保存的敏感会话。

上线前配置域名解析与 HTTPS 反向代理，并检查 `/api/health`、真实邮件投递、平台授权以及需要开放的支付通道。打包成功不代表上述外部服务已验证。

## PM2 启动

首次启动前将 `saas-server/.env.example` 复制为 `.env.prod` 并补齐数据库等启动配置。在部署包根目录（包含 ecosystem.config.js 的目录）执行：

```sh
pm2 start ecosystem.config.js
pm2 save
pm2 logs qijie-saas --lines 100
```

端口优先级：`.env.prod` 中的 `PORT` → 进程环境变量 `PORT` → 默认 `8088`。配置文件中的端口不会被 PM2 保留的旧环境端口覆盖，反向代理应转发到该端口。修改配置后执行 `pm2 restart ecosystem.config.js`。

配置默认单实例，关闭文件监听；停止或重启会关闭 HTTP 服务和数据库连接。Linux 如需开机启动，执行 `pm2 startup` 并按照输出的系统命令配置，然后执行 `pm2 save`。

PM2 配置与停止方式依据：[应用配置](https://pm2.keymetrics.io/docs/usage/application-declaration/)、[平滑停止](https://pm2.keymetrics.io/docs/usage/signals-clean-restart/)。

## 业务配置数据库

邮件服务（含 SMTP 授权码）、支付密钥与证书、套餐、更新目录、公开地址和内网代理策略存入 `system_settings`，使用现有数据目录密钥加密；`system_administrators` 管理独立系统权限，`system_settings_audit` 仅记录修改字段，不记录密钥原文。后台地址为 `/system-admin.html`。空白密钥输入保持原值，清除时单独勾选。保存带版本校验并自动生效；更新公开域名后需同步确认代理与客户端域名。
