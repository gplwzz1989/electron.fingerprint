# 栖界指纹浏览器 SaaS 云端协同服务 (SaaS Server)

栖界指纹浏览器服务端，提供网页工作空间、邮箱认证、团队权限、指纹版本、浏览器环境、代理检测与订阅支付接口。

当前默认启动入口为 `src/workspace-server.js`，提供新版页面、MySQL 持久化、邮箱验证码注册、会话认证和团队资源接口。下方旧版 `/api/v1`、租约与文件存储说明仅作历史原型参考，不作为新版能力验收结果；新版不创建预置用户或演示团队。

## 当前注册与 QQ 邮箱配置

注册流程：填写邮箱 → 获取验证码 → 输入验证码、密码、姓名与团队名称 → 验证通过后创建用户和团队并登录。登录仍使用邮箱与密码。

连接参数放在服务端 `.env.dev`、`.env.test`、`.env.prod` 中，程序根据 `SAAS_ENV` 选择环境；这些文件不提交，也不会打进客户端包。数据库连接和邮件服务共用配置读取入口。

首次拉取后，将本项目 `.env.example` 复制为所需环境文件并填写数据库、发件邮箱与授权码。本项目可独立安装、测试和部署，不需要桌面源码；网页通过自身 SDK 与公开桌面协议接入，详见 `docs/desktop-integration.md`。Git 仅提交样例，真实环境配置和支付证书均已忽略；不要将真实凭据填入样例文件。

| 配置项 | QQ 邮箱配置 |
| --- | --- |
| `SMTP_HOST` | `smtp.qq.com`，已预填 |
| `SMTP_PORT` | `465`，已预填 |
| `SMTP_SECURE` | `true`，已预填 |
| `SMTP_USER` | 填写你的 QQ 发件邮箱 |
| `SMTP_PASSWORD` | 填写邮箱 SMTP 授权码，不能填写邮箱登录密码 |
| `SMTP_FROM` | 填写同一发件邮箱；留空时使用 `SMTP_USER` |
| `SMTP_ALLOW_INSECURE_LOCAL` | 正常环境保持 `false`，仅隔离的本机邮件验收使用 |

填写后重启 SaaS 服务。未配置时页面会禁用验证码发送与注册，接口也不会绕过邮箱验证。验证码六位数字、五分钟有效、六十秒后可重发；同一邮箱每小时最多五次、同一来源每小时最多二十次。错误五次后须重新获取；新验证码替代旧验证码，注册成功后不可复用。

验证码只存带服务端密钥的摘要，不返回给接口调用方，不写入应用日志。SMTP 接受邮件后才激活验证码；用户、团队、成员和验证码消费在同一 MySQL 事务内完成。QQ 邮箱尚未配置时，本机 SMTP 验收不代表 QQ 公网投递已通过。

SMTP 加密行为参见 [Nodemailer 官方 SMTP 文档](https://nodemailer.com/smtp)，QQ 邮箱授权码参见 [QQ 邮箱帮助](https://help.mail.qq.com/detail/106/985)。

## 当前支付与套餐配置

支付实现采用微信 Native 扫码、支付宝当面付预创建订单；服务端签名请求、验签应答，通知验签后再更新 MySQL 订单和订阅。扫码页面只使用支付平台真实返回的链接生成二维码，不内置价格、订单或支付成功数据。未配置时通道保持关闭。

在对应服务端环境文件中填写配置，完成商户验收后将 `PAYMENTS_ENABLED` 设为 `true`。微信使用 `WECHAT_PAY_APP_ID`、`WECHAT_PAY_MCH_ID`、`WECHAT_PAY_SERIAL_NO`、`WECHAT_PAY_API_V3_KEY`、`WECHAT_PAY_PRIVATE_KEY_PATH`、`WECHAT_PAY_PLATFORM_CERT_PATH`、`WECHAT_PAY_NOTIFY_URL`。平台验签文件支持证书或公钥；使用公钥时另填 `WECHAT_PAY_PLATFORM_SERIAL_NO=PUB_KEY_ID_...`，使用证书时自动读取序列号。证书与私钥路径须为服务端绝对路径。

支付宝填写 `ALIPAY_APP_ID`、`ALIPAY_SELLER_ID`、`ALIPAY_PRIVATE_KEY_PATH`、`ALIPAY_PUBLIC_KEY_PATH`、`ALIPAY_NOTIFY_URL`。当前使用普通 RSA2 公钥模式，证书模式未开放。`ALIPAY_SANDBOX=true` 仅用于支付宝官方沙箱，生产环境拒绝沙箱配置。微信、支付宝回调地址分别为公网 HTTPS 的 `/api/payments/wechat/notify`、`/api/payments/alipay/notify`，不带查询参数。更换证书后重启服务。

`BILLING_PLANS_FILE` 指向 JSON 套餐文件，路径相对于环境配置文件。文件根节点为 `plans` 数组；未配置或数组为空时无在售套餐。每个在售项包含唯一 `id`、`name`、`enabled=true`、`currency=CNY`、整数 `amount`（分）、整数 `periodDays`，以及 `quotas` 中的 `fingerprints`、`environments`、`members` 正整数。运营方配置实际报价和权益，不提供虚构默认套餐。

下单金额、币种、时长和权益始终取服务端套餐快照，不采信前端金额。相同请求标识只创建一个订单；网络超时保留待确认原单，通过主动查单恢复。回调校验应用、商户、订单金额和唯一平台流水；并发重复通知只开通一次。当前支持同套餐续费，剩余时长接续；有效期内不开放跨套餐变更。极端情况下跨套餐旧单延迟成功会标记“已付款，待核对”，保留已付事实并等待人工处理。已开通订阅按权益校验新增指纹、环境和成员；到期保留查看和移除，阻止新增、修改及启动。未订阅团队目前不设置虚构免费配额。

| 新版支付接口 | 用途 |
| --- | --- |
| `GET /api/workspaces/:id/billing` | 实际用量、订阅、套餐与通道；仅管理员可查看订单 |
| `POST /api/workspaces/:id/orders` | 传 `planId`、`method`、UUID `requestId` 创建幂等订单 |
| `GET /api/workspaces/:id/orders/:orderId` | 读取原订单 |
| `GET /api/workspaces/:id/orders/:orderId/code` | 返回有效订单的真实支付二维码 SVG |
| `POST /api/workspaces/:id/orders/:orderId/refresh` | 向平台查单，确认成功后更新权益 |
| `POST /api/payments/wechat/notify` | 验签、AES-GCM 解密微信成功通知 |
| `POST /api/payments/alipay/notify` | 验证支付宝 RSA2 异步通知 |

新增国际支付方式可实现 `payment-providers.js` 中的 `create`、`query`、`notification` 接口，并登记支付方式与独立通知路由；订单幂等、权益事务和权限检查统一由 `billing-service.js` 执行。当前金额仅支持人民币，国际币种须先实现独立报价与金额核对，不能直接复用人民币价格。

协议依据：[微信 Native 下单](https://pay.wechatpay.cn/doc/v3/merchant/4012791877)、[微信平台验签](https://pay.wechatpay.cn/doc/v3/merchant/4013053420)、[支付宝官方 Node SDK 签名规则](https://github.com/alipay/alipay-sdk-nodejs-all)。`test/billing.test.js` 仅在测试进程拦截支付网络并生成临时证书，覆盖真实密码学校验及独立 MySQL 事务，不代表真实商户收款已经验收。SMTP、平台授权和实际付款的外部验收状态须单独记录。

## 系统管理后台

生产包使用精简启动配置，邮件、支付、套餐、更新目录和公开地址在 `/system-admin.html` 维护，并加密存入数据库。部署后运行 `node saas-server/server/index.js --init-system-admin 管理员邮箱` 初始化系统管理员；该命令仅在服务器本地执行。旧环境文件的业务配置仅在首次初始化时迁入数据库，本文前述文件字段保留兼容迁移说明；后续以后台配置为准。平台授权脚本与身份核验模块随生产包提供。

## 当前开发与客户端

开发客户端读取 `fingerprint-browser/build-config.json` 的 `dev` 地址，默认 `http://127.0.0.1:8088/`；`test` 地址由部署者填写；`prod` 首页为 `https://qijie.xinmeitool.com`，打包脚本默认使用 `prod`。生产部署时在 `.env.prod` 设置 `SAAS_PUBLIC_URL=https://qijie.xinmeitool.com`；客户端生产更新清单地址为 `https://qijie.xinmeitool.com/api/client-updates/prod/win32/x64.json`，服务端通过 `CLIENT_UPDATES_DIR` 提供签名清单和安装包。客户端不包含业务 HTML、服务端环境文件或数据库密码。

`npm start` 读取对应环境文件并连接 MySQL；`npm test` 使用独立的 `qijie_workspace_test_*` 数据库，不向开发库初始化测试账号。`node scripts/acceptance-server.js` 只用于已有隔离库的网页验收；`--local-mailbox` 额外启用本机测试收件器，正式服务禁止启用。配置文件中的数据库密码按完整原值读取，不要省略末尾字符。

## 以下为旧版原型历史说明

---

## 一、核心特性与架构

1. **Local-First + Cloud Sync 架构**：客户端离线优先运行，联网毫秒级增量同步元数据；
2. **防顶号分布式租约（Lease Protocol）**：基于 Fencing Token 互斥锁，彻底杜绝多设备并发多开导致的出海账号风控关联封号；
3. **RBAC 细粒度权限管控**：所有者（Owner）、管理员（Admin）、操作者（Operator）、观察者（Viewer）4 级角色及环境级授权隔离；
4. **统一代理池托管**：支持 HTTP / SOCKS5 代理批量导入、连通性探测、加密存储与分配；
5. **开箱即用零外部强依赖**：基于 Node.js 现代异步 I/O 构建，支持单机文件事务持久化与集群 PostgreSQL / Redis 平滑扩展。

---

## 二、快速启动

### 2.1 依赖要求
- Node.js >= 20.0.0

### 2.2 启动服务
```bash
# 启动服务（默认监听端口 8088）
npm start

# 或指定端口与数据目录启动
PORT=8088 SAAS_DATA_DIR=./data node src/workspace-server.js
```

### 2.3 运行全链路自动化测试
```bash
npm test
```

---

## 三、初始化账户

新版无预置账户，首次使用请完成邮箱验证码注册并创建团队。历史 `src/server.js` 仅保留供迁移参考，不应作为正式服务入口。

---

## 四、核心 API 契约概览

所有需要认证的接口均需在 Header 中携带：
`Authorization: Bearer <token>`
`X-Device-Id: <client-device-unique-id>`

| 模块 | 方法 | 路由 | 说明 |
|---|---|---|---|
| **健康检查** | `GET` | `/api/v1/health` | 服务健康探针 |
| **认证中心** | `POST` | `/api/v1/auth/login` | 邮箱密码登录，返回 JWT 及工作空间 |
| | `POST` | `/api/v1/auth/register` | 用户注册，自动初始化默认工作空间 |
| | `GET` | `/api/v1/auth/me` | 获取当前用户信息及工作空间列表 |
| **环境云同步** | `GET` | `/api/v1/workspaces/:wsId/environments` | 获取环境列表（含实时租约占用状态） |
| | `POST` | `/api/v1/workspaces/:wsId/environments` | 创建/增量保存环境（含配额拦截） |
| | `DELETE` | `/api/v1/workspaces/:wsId/environments/:id` | 删除环境（连带清理租约与检查点） |
| **租约防多开** | `POST` | `/api/v1/workspaces/:wsId/environments/:id/lease` | 申请独占租约（互斥锁定） |
| | `POST` | `/api/v1/workspaces/:wsId/environments/:id/lease/renew`| 租约心跳保活续期 |
| | `POST` | `/api/v1/workspaces/:wsId/environments/:id/lease/release`| 关闭环境并主动释放租约 |
| **团队协同** | `GET` | `/api/v1/workspaces/:wsId/members` | 查询工作空间成员与权限范围 |
| | `POST` | `/api/v1/workspaces/:wsId/members` | 邀请团队新成员并分配环境访问范围 |
| **代理资源池** | `GET` | `/api/v1/workspaces/:wsId/proxies` | 获取工作空间代理池列表 |
| | `POST` | `/api/v1/workspaces/:wsId/proxies` | 导入/添加新代理节点 |
| **订阅与配额** | `GET` | `/api/v1/workspaces/:wsId/billing` | 查询当前套餐配额与实时用量占比 |
| **操作审计** | `GET` | `/api/v1/workspaces/:wsId/audit` | 检索成员操作历史存证日志 |
