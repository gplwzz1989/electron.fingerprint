# 浏览器外壳与客户端 API

## 标签与会话

- 第一个标签固定为打包配置中的 SaaS 页面，不可关闭、换站点或改到其他位置；正常站内导航与刷新保留。
- “＋”直接创建普通标签，不要求选择环境；普通标签共用普通浏览器会话，不自动注入客户端桥接。
- SaaS 通过 `workspaceBridge.createTab` 或环境启动接口创建系统标签；指定环境时沿用该环境的指纹、代理和持久化会话。
- 系统标签默认完整业务能力；SaaS 可显式传入部分能力或空数组，并随时更新或撤销。网页跳转后按授权来源重新校验。普通弹窗不继承系统标签权限。
- 标签栏不横向滚动。标签增多时缩窄宽度，极多时收纳到“全部标签”菜单，固定首页和活动标签始终可见。普通／系统标签可拖动排序，或聚焦标签后按 Alt+Shift+左／右调整位置。
- 地址栏自动补全域名和本机地址，关键词使用百度搜索；加载中保留目标地址并提供停止按钮，加载失败和超时显示中文红色提示。关闭标签后默认选中右邻标签，连续关闭时暂时固定宽度及下一关闭按钮位置，停顿约 1.2 秒或离开标签栏后再重排。

## SaaS 页面调用

固定首页提供 `workspaceBridge` 与兼容的 `browserApi` 具名接口。系统标签同样具有具名接口，主进程逐次校验标签身份、主框架、授权来源和能力集合。`*` 代表完整业务能力；标签能力管理由固定 SaaS 首页负责，系统标签不能自行扩展授权。

```javascript
const result = await workspaceBridge.createTab({
  url: 'https://platform.example/',
  capabilities: ['workspace', 'automation', 'actions'],
  allowedOrigins: ['https://platform.example']
})
await workspaceBridge.setTabCapabilities({ id: result.tabId, capabilities: [] })
```

创建时可另外传入已有的 `environmentId`；不传时创建独立的系统网页标签。能力集合支持 `workspace`、`presets`、`profiles`、`environments`、`groups`、`tabs`、`proxy`、`actions`、`tls`、`x-grok`、`automation`。普通标签无法通过这个接口升级为系统标签。

## 本地自动化 HTTP

业务请求统一校验 `Authorization: Bearer <令牌>`，不限制 Origin。CORS 预检不读取业务数据；实际业务请求必须通过令牌校验。

客户端启动后将当前服务地址和令牌写入用户数据目录的 `automation-access.json`，仅供本机自动化程序读取；也可通过 `FP_AUTOMATION_TOKEN` 配置不少于 32 字符的令牌。文件不进入 Git 或发行包，令牌不写日志、不通过 HTTP 返回。

固定 SaaS 标签，以及具有 `automation` 或 `*` 能力且符合来源策略的系统标签，访问当前客户端 HTTP 接口时由主进程自动附加令牌，页面无需填写凭据。依据实际 WebContents 和请求框架判定身份，不通过 Origin 或 User-Agent 声明免鉴权。普通网页可以自行携带有效令牌访问，允许任意来源。

固定首页或已授权系统标签还可使用以下桥接，由主进程发起请求并代管令牌：

指纹环境配置了外部代理时，应使用此桥接调用本地接口；自动附加令牌只用于直接连接本机接口的请求，避免将本机令牌经外部代理传输。

```javascript
const result = await workspaceBridge.requestLocalApi({
  path: '/api/v1/health',
  method: 'GET'
})
```

只允许当前客户端的 `/api/v1/` 业务路径，不支持通过此接口代理任意网址。普通标签没有原生桥接对象，其 HTTP 鉴权与原生 IPC 授权是两条独立路径。

退出 SaaS 或切换团队时只关闭系统业务标签及其关联弹窗，手动“＋”创建的普通浏览标签保留。

## 发行内容与验收

客户端只打包浏览器外壳和不带权限的新标签页，SaaS 业务界面仍加载配置 URL。dev/test/prod 地址由本地 `build-config.json` 指定；发行包不接受 `FP_APP_URL` 环境变量替换首页。

`test/browser-shell-runtime.js` 使用已有 Electron 37.2.6 运行时、真实 WebContentsView、隔离会话和本机网页验证授权、导航、排序及布局，不编译内核、不访问外部账户。原生鼠标拖拽仍需在可用的桌面输入环境中进行手势验收，接口排序与真实标签顺序已有运行时测试。
