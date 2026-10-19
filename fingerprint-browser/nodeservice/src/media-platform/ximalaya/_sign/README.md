# 喜马拉雅上传签名（Node.js）

覆盖喜马拉雅 www 上传链路的两套签名，均以真实抓包数据验证通过。

## 目录

| 文件 | 说明 |
|------|------|
| `sign.js` | 核心模块：`xfmSignature()`（分片上传/合并签名）、`xmSign()`（拼装）、`xmSignAuto()`（联网自动取 xm-sign） |
| `xm_sign.js` | 在 Node vm 里运行数盟 SDK，联网产出 `xm-sign`；可 `node xm_sign.js` 直接跑 |
| `du_web_sdk.js` | 原始数盟设备指纹 SDK（被 vm 加载） |
| `test.js` | 用真实抓包验证 `x-xfm-signature`（7 分片 + mkfile，8/8） |
| `test_xmsign.js` | 验证 `xm-sign` 产出结构与真实样本一致 |
| `fixtures_*.json` | 真实抓包样本 |

## 一、x-xfm-signature（音频分片上传 / 文件合并）

纯离线可复现（HMAC-SHA256）。用于：
- `POST cupload.ximalaya.com/upload/file/blk`（分片）
- `POST cupload.ximalaya.com/upload/merge/mkfile`（合并）

算法：

```
待签串 = "POST" | MD5B64(body) | headerStr | queryStr
x-xfm-signature = Base64( HmacSHA256(待签串, atob(APP_SERCRET)) )
```

- 分隔符 `|`
- `MD5B64(body)`：body 为 JSON 时取 `Base64(MD5(JSON.stringify(body)))`；分片无 body，此段为空
- `headerStr`：`x-xfm-app-key`、`x-xfm-timestamp`、`x-xfm-upload-type` 三个头按字典序 `k=v&k=v`
- `queryStr`：分片 query 对象里是**原始未编码值**（中文文件名、带空格的 Date、`audio/mpeg`），key 转小写、排序、`k=v&k=v`
- 密钥：`tingWeb` 音频用 `atob("L2hRdnBpQzJT") = "/hQvpiC2S"`；视频 `FSYY` 用 `atob("bGEyY2JDWHBhc0Ey")`

用法：

```js
const { xfmSignature } = require('./sign');

// 分片
const { headers } = xfmSignature({
  appKey: 'tingWeb',
  uploadType: 'tingWebAudio',
  fileName: '个人朗读.mp3',
  timestamp: Date.now(),
  serverIp: '10.161.105.207',   // 第 2 片起用服务端返回的 ip
  queryData: { id: 'WU_FILE_0', name: '个人朗读.mp3', type: 'audio/mpeg',
    lastModifiedDate: 'Mon Mar 02 2026 11:03:34 GMT+0800 (中国标准时间)',
    size: 12699544, timeStart: Date.now(), chunks: 7, chunk: 0, multipartId: '', md5: '...', uid: 463872034 },
});
// headers 含 x-xfm-signature 等一整组头

// 合并
const { headers: h2 } = xfmSignature({
  appKey: 'tingWeb', uploadType: 'tingWebAudio', fileName: '个人朗读.mp3',
  bodyData: { uid: 463872034, uploadType: 'tingWebAudio', appkey: 'tingWeb', /* ... */ },
});
```

验证：`node test.js` → 8/8 passed。

## 二、xm-sign（创建最终音频作品）

用于 `POST www.ximalaya.com/reform-upload/upload/create` 的 `xm-sign` 头。

```
xm-sign = browserID + "&&" + sessionID
```

browserID / sessionID 由数盟(shuzilm)设备指纹 SDK(`du_web_sdk`) 产生：SDK 采集设备指纹(DNA)，
经 XOR + urlSafeBase64 加密后 **POST 到 `hdaa.shuzilm.cn/report`，由服务端签发**。因此**必须联网**，无法纯离线计算。

本模块的做法：在 Node vm 里以浏览器环境 mock 运行原始 `du_web_sdk.js`，让其内部 `XMLHttpRequest` 真实联网，
调 `getBrowserID`/`getSessionID` 取回服务端签发的 ID。

用法（自动、联网）：

```js
const { xmSignAuto } = require('./sign');
const sign = await xmSignAuto();                 // "xxx&&yyy"
// 或拿明细
const { getXmSign } = require('./xm_sign');
const { xmSign, browserID, sessionID } = await getXmSign({ detail: true });
```

用法（注入、若你已从浏览器 `await window._getDUH()` 拿到值）：

```js
const { xmSign } = require('./sign');
const sign = xmSign({ browserID: '...', sessionID: '...' });
```

命令行：`node xm_sign.js`

验证：`node test_xmsign.js` → 产出结构（`&&` 分隔、browserID 前缀 `D2`、长度 48、sessionID 结尾 `_1`）与真实抓包样本一致，且 report 请求真实返回 200。

### xm-sign 是随机的，这是正确行为（不要去固定它）

每次调用 `getXmSign()` 得到的 `browserID` / `sessionID` **都不一样**，这是符合真实浏览器行为的正确状态，不需要缓存或固定：

- 真实浏览器里每次刷新页面，`hdaa.shuzilm.cn/report` 的请求参数（每次带新的 `r=<uuid>`、nonce、时间戳、会话数据）和服务端返回本来就不同；`getSessionID` 每次新生成，`getBrowserID` 也随会话变化。
- 本实现每次调用等价于「一次新的页面刷新」：走完整的 `createNewId → 采集指纹 → 上报 → 服务端签发` 流程，拿到一套全新的**合法** ID（服务端返回 200，格式与真实样本一致）。
- 因此 `xm-sign` 本质是设备/会话指纹，「每次不同」正是它应有的样子。上传时它只要是数盟服务端签发的合法值即可，不要求和历史某次一致。

**一次上传会话内应复用同一套值**：一次上传任务开始时取一次 `xm-sign`，`create` 时用；不同上传任务之间各自重取（等价于「每次刷新页面」）。

```js
const { getXmSign } = require('./xm_sign');
// 一次上传任务开始时取一次；仅 create 接口用它
const xmSign = await getXmSign();   // "browserID&&sessionID"
```

## 三、x-tId（上传链路的 trace id，与 xm-sign 无关）

`x-tId` 用于 `clamper-token/token`、`upload/file/blk`、`upload/merge/mkfile` 三类请求，对应 uploader 内部的 `file._traceId`。**它和 `xm-sign` 是两回事**（虽然都可能含 `&&`）。

真实生成规则（来自 uploader chunk）：

```
_traceId = Date.now() + "-" + Math.random().toString(36).substring(2)
           + (page === "web_upload" ? "&&" + sessionId : "")
```

- `sessionId` 是 uploader 初始化时生成的一个 **uuid v4**。
- **web 上传页**（`page === "web_upload"`）时带 `&&sessionId` 后缀；其它场景没有后缀。抓包两种形态都出现过：
  - `1788429907441-jcl9dbw7sbg&&ab45ecc0-4375-4e0d-9552-2010e8ebdcd8`（有后缀）
  - `1788429935032-9bqcddhgaar`（无后缀）

关键行为（已由抓包证实）：

- `x-tId` 在 `token` 请求时生成一次，之后**同一次上传会话的 blk、mkfile 全部复用同一个值**。
- 下一次上传任务重新生成一个新的 `x-tId`。
- **`create` 接口不带 `x-tId`**（只带 `xm-sign`）。

用法：

```js
const { makeTId } = require('./sign');

// 一次上传任务开始时生成一次
const { tId, sessionId } = makeTId();          // web 上传页，默认带 &&sessionId
// const { tId } = makeTId({ webUpload: false }); // 无后缀形态
// const { tId } = makeTId({ sessionId: '已有的uuid' }); // 指定 sessionId

// token / blk / mkfile 的请求头都放这同一个 tId：
//   headers['x-tId'] = tId
// create 不需要 x-tId
```

## 整条上传链路的复用关系

```js
const { xfmSignature, makeTId } = require('./sign');
const { getXmSign } = require('./xm_sign');

// —— 一次上传任务开始，各取一次 ——
const { tId } = makeTId();          // token/blk/mkfile 全程复用
const xmSign = await getXmSign();   // 仅 create 用

// token :  headers['x-tId'] = tId
// blk    : headers = { ...xfmSignature({...}).headers, 'x-tId': tId, Authorization: token }
// mkfile : headers = { ...xfmSignature({...}).headers, 'x-tId': tId, Authorization: token }
// create : headers = { 'xm-sign': xmSign, 'content-type': 'application/json;charset=UTF-8' }
```

## 说明与注意

- `xm-sign` 每次运行会向数盟服务器发起真实请求，用当前设备指纹换取 ID；每次结果不同属正常（见上一节），不需要固定或持久化缓存。
- `xm_sign.js` 对 SDK 的 `simpleXORCipher` 打了 null-guard 补丁，仅避免无头环境个别指纹项为空时崩溃，不改变已采集到的字段值。
- 依赖：Node 内置模块（crypto/vm/https/http/url）+ `du_web_sdk.js`。无第三方 npm 依赖。

## 关键参数速记

| 项 | 值 / 规则 |
|----|-----------|
| `x-xfm-signature` 算法 | `Base64(HmacSHA256("POST\|MD5B64(body)\|headerStr\|queryStr", atob(APP_SERCRET)))` |
| 分隔符 | `\|`（竖线） |
| 密钥（音频/图片/文档 `tingWeb`） | `atob("L2hRdnBpQzJT")` = `/hQvpiC2S`（模块内置，传 `appKey:'tingWeb'` 自动选） |
| 密钥（视频 `FSYY`） | `atob("bGEyY2JDWHBhc0Ey")` = `la2cbCXpasE2` |
| 参与签名的头（升序） | `x-xfm-app-key`、`x-xfm-timestamp`、`x-xfm-upload-type` |
| `headerStr` | 上面三个头按字典序 `k=v&k=v` |
| `queryStr`（仅分片 blk） | query 对象**原始未编码值**（中文文件名、带空格 Date、`audio/mpeg`），key 转小写、排序、`k=v&k=v` |
| body 段 | mkfile：`Base64(MD5(JSON.stringify(body)))`；分片 blk：空 |
| `uploadType`（音频） | `tingWebAudio`；`appKey` = `tingWeb` |
| 分片大小 | 1 MB（1048576） |
| 上传链路 | `clamper-token/token` → `upload/file/blk`(每片 x-xfm-signature) → `upload/merge/mkfile`(x-xfm-signature) → `reform-upload/upload/create`(xm-sign) |
| `xm-sign` | `browserID&&sessionID`（联网取）。仅 `create` 用；一次任务取一次，不同任务各自重取 |
| `x-tId` | `Date.now()+"-"+随机36进制 (+ "&&"+sessionId 仅 web_upload)`；用 `makeTId()`。用于 token/blk/mkfile，一次会话复用；**create 不带**。与 xm-sign 无关 |
