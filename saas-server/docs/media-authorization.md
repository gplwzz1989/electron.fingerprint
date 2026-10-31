# 平台授权接入

授权与 RPA 属于独立 media-platform 项目，由 0.3.0 客户端通过 platform-runtime-v2 加载。SaaS 不再配置 FP_EXTERNAL_SERVICE_ENTRY 或加载平台 SDK；管理员在系统后台上传 NCC 单文件 JS，服务端自动编号，客户端启动自行更新和缓存。详见[客户端授权重构](../../docs/客户端授权重构.md)。

客户端使用 0.2.2 或更新版本；公开桥接新增 `observeSession`、`readSession`、`captureSession` 和 `closeSession`，仅固定首页可调用。登录标签以空能力启动，不向第三方平台页面开放管理能力。仅更新应用代码即可，复用已有 Electron 运行时，不编译原生内核。

接口均遵守现有登录、CSRF 和团队权限检查：

| 接口 | 用途 |
| --- | --- |
| `GET /api/platforms` | 动态平台目录及可用状态 |
| `GET /api/platform-runtime` | 返回客户端能力协议位置，不再提供执行脚本 |
| `POST /api/workspaces/:workspace/authorizations` | 平台、环境及可选原账号，创建任务 |
| `GET /api/workspaces/:workspace/authorizations/:id` | 当前用户的任务摘要 |
| `POST /api/workspaces/:workspace/authorizations/:id/complete` | 接收客户端身份与会话加密包，核对任务证明及原账号身份 |
| `POST /api/workspaces/:workspace/authorizations/:id/confirm` | 用户确认后原子保存账号及密文会话 |
| `POST /api/workspaces/:workspace/authorizations/:id/cancel` | 取消并清除任务中的私钥和会话 |
| `POST /api/workspaces/:workspace/accounts/:id/launch` | 向一次性客户端公钥返回含账号会话的启动密文 |
| `POST /api/workspaces/:workspace/accounts/:id/check` | 检测真实授权状态，明确登录失效后允许重新授权 |

账号摘要与任务状态保留在 `records`；0.3.0 正式账号使用 `auth_accounts` 保存身份和加密会话。以下关系表仅用于临时授权及历史迁移：`media_sessions` 保存归属及版本，`media_session_cookies` 按 Cookie 逐行保存域、路径、过期时间、HttpOnly、SameSite 等独立属性，`media_session_storage` 按来源及存储键逐行保存。敏感值使用既有服务端密钥逐项加密，不把 Cookie 数组或 localStorage 对象存为 JSON。启动时事务迁移旧 `account-sessions` 及待确认任务中的密文，成功才移除旧凭据；失败保留原记录并阻止启动，升级必须保留原 `encryption.key`。

跨设备打开账号需要 0.2.6 或更新客户端。账号使用自己的独立会话目录，复用绑定环境的指纹和代理；服务器仅向一次性公钥发送 `desktop-launch-v1` 启动密文，网页端无法读到会话明文。客户端首次导航前恢复 HttpOnly Cookie 与按来源隔离的 localStorage；同一云端会话版本再次打开时沿用本机刷新后的登录态，更高版本才重新恢复。当前运行时不支持写入的分区 Cookie 明确报错，不降级为普通 Cookie。

“检测授权”通过客户端执行，仅在平台明确返回登录失效时更新为失效，网络错误不会误标。重新授权在界面和服务端均仅对失效或过期账号开放。平台标识资源取自 `yixiaoer-universal/apps/web-root/shared/assets/platforms`，复制到本服务自身发布目录，不在运行时依赖参考项目。

验收分为数据库与权限测试、真实 Electron 桥接测试，以及四个平台分别由持有人登录的授权验收。前两项通过不能替代最后一项。账号身份核验失败、数据不完整或保存失败时不创建成功记录。
