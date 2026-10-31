# 平台授权接入

授权与 RPA 属于独立 media-platform 项目，由 0.4.0 客户端通过 platform-runtime-v3 加载。SaaS 不再配置 FP_EXTERNAL_SERVICE_ENTRY 或加载平台 SDK；管理员在系统后台上传 NCC 单文件 JS，服务端自动编号，客户端启动自行更新和缓存。详见[客户端授权重构](../../docs/客户端授权重构.md)。

客户端使用 0.4.0 或更新版本；公开桥接通过 `startPlatformTask`、`pollPlatformTask` 和 `cancelPlatformTask` 管理授权，观察器接口仅固定首页可调用。登录标签以空能力启动，不向第三方平台页面开放管理能力。仅更新应用代码即可，复用已有 Electron 运行时，不编译原生内核。

授权期间网页不请求 SaaS 后端。用户登录成功后，最终保存接口遵守现有登录、CSRF 和团队权限检查：

| 接口 | 用途 |
| --- | --- |
| `GET /api/platforms` | 动态平台目录及可用状态 |
| `GET /api/platform-runtime` | 返回客户端能力协议位置，不再提供执行脚本 |
| `POST /api/workspaces/:workspace/authorizations` | 仅接收客户端确认成功的授权结果；通过 Prisma 事务写入 `platform_accounts` |
| `POST /api/workspaces/:workspace/accounts/:id/launch` | 向一次性客户端公钥返回含账号会话的启动密文 |
| `POST /api/workspaces/:workspace/accounts/:id/check` | 接收客户端完成的检测结果并更新账号状态 |

`platform_accounts` 是媒体账号唯一数据表，保存身份、状态、环境关联和加密会话。授权期间不写任何服务端业务数据；成功保存时在该表中一次提交。新库不创建授权任务、Cookie 明细或存储明细表；当前数据库已重建，不做旧会话迁移。敏感凭据使用现有 `encryption.key` 加密，不使用 MySQL 外键。SaaS 业务数据由 Prisma ORM 读写，数据库结构由 `prisma/schema.prisma` 定义。部署与开发启动时执行 `prisma db push`；打包内含 Prisma CLI、Schema Engine 和 Query Engine，不需要安装完整 `node_modules`。

跨设备打开账号需要 0.2.6 或更新客户端。账号使用自己的独立会话目录，复用绑定环境的指纹和代理；服务器仅向一次性公钥发送 `desktop-launch-v1` 启动密文，网页端无法读到会话明文。客户端首次导航前恢复 HttpOnly Cookie 与按来源隔离的 localStorage；同一云端会话版本再次打开时沿用本机刷新后的登录态，更高版本才重新恢复。当前运行时不支持写入的分区 Cookie 明确报错，不降级为普通 Cookie。

“检测授权”通过客户端执行，仅在平台明确返回登录失效时更新为失效，网络错误不会误标。重新授权在界面和服务端均仅对失效或过期账号开放。账号授权客户端结果通过 JSAPI 回到网页；服务端不在登录期间轮询客户端、不下发授权任务，也不暂存待确认凭据。平台标识资源取自 `yixiaoer-universal/apps/web-root/shared/assets/platforms`，复制到本服务自身发布目录，不在运行时依赖参考项目。

验收分为数据库与权限测试、真实 Electron 桥接测试，以及四个平台分别由持有人登录的授权验收。前两项通过不能替代最后一项。账号身份核验失败、数据不完整或保存失败时不创建成功记录。
