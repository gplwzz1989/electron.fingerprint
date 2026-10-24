# 栖界指纹浏览器 SaaS 云端协同服务 (SaaS Server)

栖界指纹浏览器团队商业版云端协同中枢服务，提供多租户认证、环境跨端同步、防顶号分布式租约、代理池托管、团队 RBAC 权限协同与订阅计费配额管控。

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
PORT=8088 SAAS_DATA_DIR=./data node src/server.js
```

### 2.3 运行全链路自动化测试
```bash
npm test
```

---

## 三、默认预置初始账号（开箱体验）
- **管理员账号**：`linmu@example.com`
- **初始密码**：`Admin123456`
- **默认工作空间**：`远航出海团队 (ws_default_001)`

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
