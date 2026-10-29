# Desktop Bridge 协议 v1

本协议以接口、HTTP 和 JSON 约定互通，不要求业务服务使用 Node.js，不要求引用本项目代码。0.2.0 起基座只暴露通用 `desktopBridge`，业务应用自行封装自己的 SDK。所有异步方法返回 `{ok:true,...}` 或 `{ok:false,error:"中文说明"}`。

## 固定首页接口

| 方法 | 输入及用途 |
| --- | --- |
| `runtime()` | 返回平台、内核、环境、应用名称和协议版本 |
| `prepareLaunch({scope,resourceId})` | 创建六十秒内有效、绑定当前页面的加密请求 |
| `launchEncrypted({requestId,envelope,capabilities?,allowedOrigins?})` | 主进程解密并验证配置，创建或恢复独立环境 |
| `tabs()` / `selectTab(id)` / `closeTab(id)` | 查询及管理标签 |
| `navigate({id,url,action})` / `dashboard()` | 导航或回到固定首页 |
| `createTab(options)` | 创建可配置权限的系统网页标签 |
| `setTabCapabilities(options)` | 固定首页管理系统标签权限 |
| `requestLocalApi({path,method,body})` | 调用当前客户端本地接口，由主进程附加令牌 |
| `observeSession({tabId,origins,paths?,storageKeys?,publicKey,operationId})` | 仅固定首页可创建十五分钟内有效的会话观察；来源必须为 HTTPS |
| `readSession({id,cursor?})` | 读取匹配响应、游标和存储字段名称，不返回 Cookie 或存储值 |
| `captureSession({id})` | 将来源白名单内的 Cookie 和字段白名单内的存储值加密，返回 RSA-OAEP-SHA256/AES-256-GCM 信封 |
| `closeSession({id})` | 释放观察；仅创建观察的首页可以操作 |
| `updateStatus()` / `checkUpdates()` / `installUpdate()` | 更新状态、检查及经用户确认安装 |
| `onTabsChanged(callback)` / `onUpdateChanged(callback)` | 订阅状态，返回取消订阅函数 |

`browserApi` 保留具名的原生环境、代理、动作和参数校验接口。基座不自动生成业务指纹；第三方可显式提供参数，或使用下述加密启动协议。原生桥接不向网页开放文件系统、任意 IPC 或私钥。

## 加密启动

1. 首页调用 `prepareLaunch`，`scope` 是业务自行定义的不透明资源范围，`resourceId` 是范围内资源标识。
2. 返回 `{ok,requestId,protocol:"desktop-launch-v1",scope,resourceId,nonce,publicKey}`，公钥为 RSA-2048 SPKI PEM。私钥留在本机主进程。
3. 业务网页使用自己的认证、授权和 CSRF 流程将请求交给业务服务。服务端必须校验资源访问权限，不能仅凭该公钥授予业务权限。
4. 服务端生成或读取参数，随机生成 32 字节 AES 密钥和 12 字节 IV。按下列固定属性顺序序列化元数据作为 AES-256-GCM AAD：`{format:"desktop-launch-v1",scope,resourceId,nonce,expiresAt}`。`expiresAt` 为最多六十秒后的毫秒时间戳。
5. AES 明文为 UTF-8 JSON：`{id:resourceId,name,url,fingerprint,proxy?,tlsFingerprint?}`。指纹是内核已有参数契约，服务端负责生成自洽参数。
6. AES 密钥使用该次公钥执行 RSA-OAEP-SHA256 包装。返回元数据以及 Base64 字段 `iv`、`tag`（16 字节）、`ciphertext`、`wrappedKey`。
7. 网页将密文和 `requestId` 交给 `launchEncrypted`。基座验证调用方、原页面、范围、资源、时限和 GCM 认证，且每个请求只可消费一次。

不同首页来源及资源范围会映射到不同本机环境，避免同名资源复用会话。标签状态的 `externalReference` 包含 `origin/scope/resourceId`，业务应用可自行映射展示；基座不解释它们的业务含义。

## 信任与版本

固定首页由打包配置绑定；加号网页即使访问同一地址也不自动提权。系统标签按来源和能力授权，关闭即撤销。第三方持有效本地令牌可调用 HTTP 自动化接口；页面获得桥接权限与持有 HTTP 令牌是两条独立路径。

不兼容协议升级必须使用新的协议版本。业务服务与基座各自测试自己的实现，联调只验证公开消息，不共享实现文件或依赖包。端到端验收需要同时提供两个独立发布物，不能用源码交叉导入作为运行前提。

## 会话采集信封

0.2.2 新增。业务服务为每个任务生成 RSA 公钥，将公钥及任务标识交给固定首页。客户端返回 Base64 字段 `wrappedKey`、`iv`、`tag`、`ciphertext`，AES-GCM 附加认证数据为任务标识的 UTF-8 字节。解密 JSON 为 `{operationId,cookies,storage}`，`storage` 按完整来源地址分组。服务端必须重新核验任务归属、平台身份和权限后才能保存账号，不能将成功采集等同于授权成功。客户端不解析平台身份，不知道团队或业务接口地址。
