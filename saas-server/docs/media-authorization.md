# 平台授权接入

授权脚本属于独立 `media-platform` 项目。部署者安装该项目自身依赖并生成发布物，在本服务的环境配置中设置 `FP_EXTERNAL_SERVICE_ENTRY` 为部署的 `src/server.cjs` 绝对路径，随后重启 SaaS。未配置或依赖不可加载时平台入口保持禁用。

客户端使用 0.2.2 或更新版本；公开桥接新增 `observeSession`、`readSession`、`captureSession` 和 `closeSession`，仅固定首页可调用。登录标签以空能力启动，不向第三方平台页面开放管理能力。仅更新应用代码即可，复用已有 Electron 运行时，不编译原生内核。

接口均遵守现有登录、CSRF 和团队权限检查：

| 接口 | 用途 |
| --- | --- |
| `GET /api/platforms` | 动态平台目录及可用状态 |
| `GET /api/platform-runtime` | 带完整性摘要的脚本清单 |
| `POST /api/workspaces/:workspace/authorizations` | 平台、环境及可选原账号，创建任务 |
| `GET /api/workspaces/:workspace/authorizations/:id` | 当前用户的任务摘要 |
| `POST /api/workspaces/:workspace/authorizations/:id/complete` | 仅接收 RSA/AES-GCM 加密包，核验平台身份 |
| `POST /api/workspaces/:workspace/authorizations/:id/confirm` | 用户确认后原子保存账号及密文会话 |
| `POST /api/workspaces/:workspace/authorizations/:id/cancel` | 取消并清除任务中的私钥和会话 |

复用 `records` 表的 `authorizations`、`accounts` 和 `account-sessions` 类型，不更改既有表结构。凭据与任务私钥使用现有服务端加密密钥加密，升级时必须保留原 `encryption.key`。

验收分为数据库与权限测试、真实 Electron 桥接测试，以及四个平台分别由持有人登录的授权验收。前两项通过不能替代最后一项。账号身份核验失败、数据不完整或保存失败时不创建成功记录。
