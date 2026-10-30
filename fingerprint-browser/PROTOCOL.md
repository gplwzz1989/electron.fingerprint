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

## 加密启动中的可选会话恢复

支持此功能的基座在 `desktopBridge.capabilities` 返回 `session-restore-v1`。业务网页应先检查该能力，再调用已有 `prepareLaunch` / `launchEncrypted`；不提供明文凭据导入桥接。

服务端密文明文可增加 `session:{format:"desktop-session-v1",origins,cookies,storage,version?}`。`origins` 是完整 HTTPS 来源数组；Cookie 使用 Electron 字段，必须属于来源范围；`storage` 按来源映射字符串键值，禁止跨来源混写。当前不支持带 `partitionKey` 的分区 Cookie，遇到时拒绝恢复，不降级为普通 Cookie。

恢复仅发生在目标环境首次访问之前；Cookie 属性保留 `hostOnly/path/httpOnly/secure/sameSite/expirationDate`。页面存储使用隔离世界的预导航脚本，每个来源只恢复一次，随后清理脚本及本次建立的调试连接；网站后续更新的令牌不会被导航覆盖。

服务端可同时提供 `localSessionSource:{resourceId,operationId}`，仅指向同来源、同作用域的授权采集环境。基座核对该环境持久化的本机采集任务标识；完全匹配时直接复用原数据目录，不导入云端会话。记录缺失或任务不匹配时回退到云端恢复。标识只能来自已确认保存的授权任务，不作为业务权限凭据。

Cookie 写入采用逐条尽力恢复，单条失败只记录不含 Cookie 值的拒绝代码，不撤销成功项或中止账号页面。页面存储恢复完成后记录本次版本，避免下一次打开再次覆盖网站更新的登录态。

`version` 可为正整数或不超过160字符的非空字符串。资源独立数据目录保存不含凭据的成功导入版本标记；同版本已完整导入则沿用磁盘会话，不再覆盖。数字旧版本被拒绝，不同字符串版本按不透明版本标识处理。无版本时按显式恢复请求执行。已有运行中标签禁止带会话重新导入，业务网页可直接选择已有标签；普通无会话启动行为不变。成功启动返回 `tabId`。
