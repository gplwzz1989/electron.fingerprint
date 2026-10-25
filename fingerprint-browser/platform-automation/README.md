# 平台自动化引擎架构与多平台接入规范

本项目采用了**模块化插件驱动架构**（Driver & Bus Pattern），将各社交/内容平台（如 X/Twitter、Reddit、微博、小红书等）的自动化操作与主程序生命周期彻底解耦。每个平台拥有独立的物理代码目录，共享统一的基类状态机与调度中心，能够极速扩展接入新平台。

---

## 1. 整体架构与目录结构

```
platform-automation/
├── base-automation.js          # 【抽象基类】规范生命周期、状态机、定时器调度、倒计时与日志队列
├── index.js                    # 【调度总线】平台驱动注册表，统一路由环境事件与 IPC 操作
├── README.md                   # 【接入规范】本指南
└── platforms/                  # 【各平台独立功能目录】物理隔离，互不干扰
    ├── x/                      # X (Twitter) 平台驱动实现
    │   ├── selectors.js        # DOM 选择器、文本清洗纯函数、URL 严格判定
    │   └── index.js            # 驱动引擎实现（Grok AI 生成、推文发布、防跨域安全检查）
    └── <platform-id>/          # 后续扩展新平台目录（例如 reddit, xiaohongshu, weibo 等）
        ├── selectors.js
        └── index.js
```

---

## 2. 核心组件职责分工

### 2.1 调度总线 (`PlatformAutomationManager`)
- **驱动注册中心**：维护 `platforms: Map<platformId, BasePlatformAutomation>` 实例字典。
- **环境事件分发**：当浏览器标签打开、切换或关闭时，自动根据目标网页 URL 匹配对应平台的自动化驱动，实现静默挂载与资源销毁。
- **统一服务接口**：提供标准化的 `getTaskStatus`、`toggleTask`、`triggerNow`、`updateConfig` 方法，统一转发至所属平台。

### 2.2 抽象基类 (`BasePlatformAutomation`)
子类开箱即用，已内置以下完整能力，**无需在新平台中重复编写**：
- **心跳倒计时机制**：1 秒一次平滑倒计时，向前端实时推送 `remainingSeconds`。
- **任务状态机管理**：`idle`（待命） → `generating`（生成中） → `posting`（发布中） → `success`（成功） / `error`（异常）。
- **定时调度与防抖**：防止多次触发重叠，安全清理定时器与闭环调度。
- **持久日志队列**：循环存储最新 60 条操作与异常日志（包含时间戳、级别与详细说明）。
- **默认待命策略**：环境打开时初始化为 `enabled: false`，严格遵守“用户手动点击启动才运行”的设计规范。

---

## 3. 新增平台接入极速指南（只需 3 步）

以接入一个新平台（例如 `reddit`）为例：

### 第一步：在 `platforms/` 下建立独立目录
新建 `platform-automation/platforms/reddit/`，包含两个文件：

#### 1) `selectors.js`
定义页面 DOM 选择器及平台特征验证纯函数：
```javascript
'use strict'

const SELECTORS = {
  SUBREDDIT_INPUT: '...',
  POST_TITLE: '...',
  POST_BODY: '...',
  SUBMIT_BUTTON: '...'
}

function isRedditUrl (url) {
  if (!url || typeof url !== 'string') return false
  try {
    const host = new URL(url.trim()).hostname.toLowerCase()
    return host === 'reddit.com' || host.endsWith('.reddit.com')
  } catch {
    return false
  }
}

module.exports = { SELECTORS, isRedditUrl }
```

#### 2) `index.js`
继承 `BasePlatformAutomation`，仅需实现 `match` 与 `runCycle` 两个核心方法：
```javascript
'use strict'

const { BasePlatformAutomation } = require('../../base-automation')
const { SELECTORS, isRedditUrl } = require('./selectors')

class RedditPlatformAutomation extends BasePlatformAutomation {
  constructor (options = {}) {
    super({
      platformId: 'reddit',
      platformName: 'Reddit',
      tabBrowser: options.tabBrowser || null,
      defaultIntervalMs: 15 * 60 * 1000, // 默认 15 分钟
      defaultPrompt: '默认 Prompt...'
    })
  }

  // 1. 判断是否浏览该平台网页（严格基于 URL）
  match (environment, targetUrl) {
    const url = targetUrl || environment?.creationUrl || environment?.lastUrl || ''
    return isRedditUrl(url)
  }

  // 2. 核心业务执行循环（创作与发布）
  async runCycle (task) {
    const tab = this.getTabForEnvironment(task.environmentId)
    if (!tab || !tab.view || tab.view.webContents.isDestroyed()) return
    const contents = tab.view.webContents

    // 安全检查：若用户当前不是在该平台网页，跳过执行
    if (!isRedditUrl(contents.getURL())) {
      this.addLog(task, 'warn', '当前网页不是 Reddit，已跳过发帖。')
      this.scheduleNextRun(task, task.intervalMs)
      return
    }

    try {
      task.state = 'generating'
      this.addLog(task, 'info', '正在准备发布内容...')
      
      // ... 编写具体的页面 DOM 操作与内容提交 ...

      task.state = 'success'
      task.runCount += 1
      this.addLog(task, 'info', 'Reddit 帖子发布成功！')
    } catch (err) {
      task.state = 'error'
      this.addLog(task, 'error', `发布失败: ${err.message}`)
    } finally {
      if (task.enabled) {
        this.scheduleNextRun(task, task.intervalMs)
      }
    }
  }
}

module.exports = { RedditPlatformAutomation }
```

---

### 第二步：在调度总线中注册新驱动
打开 `platform-automation/index.js`，引入并一行代码注册：
```javascript
const { XPlatformAutomation } = require('./platforms/x')
const { RedditPlatformAutomation } = require('./platforms/reddit') // 新增引入

class PlatformAutomationManager extends EventEmitter {
  constructor (options = {}) {
    super()
    this.tabBrowser = options.tabBrowser || null
    this.platforms = new Map()

    // 注册各平台驱动
    this.registerPlatform(new XPlatformAutomation({ tabBrowser: this.tabBrowser }))
    this.registerPlatform(new RedditPlatformAutomation({ tabBrowser: this.tabBrowser })) // 新增注册
  }
}
```

---

### 第三步：在前端统一视图绑定入口
平台任务状态结构是标准的统一快照：
```json
{
  "platformId": "reddit",
  "environmentId": "env-123",
  "enabled": false,
  "state": "idle",
  "intervalMs": 900000,
  "remainingSeconds": 900,
  "statusText": "未启动，等待手动开启",
  "runCount": 0,
  "logs": []
}
```
前端无论是通过顶部快捷按钮还是平台操作面板，均可直接消费标准字段，无缝接入倒计时、启停开关与实时执行日志。
