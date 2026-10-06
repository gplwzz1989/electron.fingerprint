# Pixelscan 检测归因与优化开发计划

日期：2026-10-06（中国标准时间）  
状态：原因分析和开发计划已完成；已采集七组当前内核的局部对照；PS-03～PS-08 的最小生产改动、独立补丁、Release 增量编译和应用层回归已完成；PS-01～PS-02 及真实 Pixelscan 复测仍未完成。

本计划补充 [浏览器指纹隔离改进开发计划](../2026-10-05/浏览器指纹隔离改进开发计划.md)，聚焦“掩蔽”和“自动化”两个告警。优先复用现有 Session 配置、Chromium 接口和验证入口，只安排能追溯到证据的局部修改。

## 1. 结论与目标

当前问题具有明确的浏览器实现成因：网页可见内存超出当前 Chromium 原生取值范围、UA 与高熵 Client Hints 完整版本冲突、Screen 与 CSS 设备尺寸冲突，以及音频、几何和画布噪声破坏原生接口的一致性。其中画布连续读回的变化已经收敛到 GPU/CPU 路径与红蓝通道顺序，值得优先修复。

这些是已经实测的异常信号，但本轮尚未逐项证明 Pixelscan 用哪个信号触发最终告警。“自动化”的确切命中项仍待正式启动方式对照和检测结果归因；目前不能断言只要关闭调试端口或打开调试器兼容选项就能通过。

目标是在约定的发行包、网络、环境和操作方式下，Pixelscan 完整检测明确显示指纹一致、未检测到掩蔽、未检测到自动化，同时保留环境隔离、隐私保护和正常网页功能。分别验收正常使用与产品实际支持的自动化方式；正常模式通过不能代替自动化模式通过。第三方规则会更新，验收结果应绑定测试时间和版本，不作永久不可识别承诺。

## 2. 证据与适用范围

### 2.1 本轮证据

- 最新五站报告：[指纹隔离测试报告](../../../dist/fingerprint-browser-evaluation-20261006/指纹隔离测试报告.md)。
- 最新 A/B 配置：[environments.json](../../../dist/fingerprint-browser-evaluation-20261006/environments.json)。
- 本轮局部诊断：[result.json](../../../dist/pixelscan-diagnosis-20261006/result.json)；复现入口：[probe.cjs](../../../dist/pixelscan-diagnosis-20261006/probe.cjs)。
- 最新迁移后局部诊断：[migrated-run/result.json](../../../dist/pixelscan-diagnosis-20261006/migrated-run/result.json)；旧 `deviceMemory=16` 配置仅在诊断进程内显式迁移为 8 GiB，原始配置未修改。
- 历史 Pixelscan 可见结果：[A](../../../dist/external-fp-regression-20261005-post-locale-full/A-pixelscan.json)、[B](../../../dist/external-fp-regression-20261005-post-locale-full/B-pixelscan.json)。历史 B 使用洛杉矶时区且关闭噪声，不能与最新纽约、开启噪声的 B 混为同一个配置。
- 历史 CreepJS：[B](../../../dist/external-fp-regression-20261005-post-locale-full/B-creepjs.json)，补充 ServiceWorker、Screen/CSS 和 Client Hints 证据。

最新报告中的 A：无掩蔽、检测到自动化、时区异常；B：检测到掩蔽、检测到自动化、时区异常。两组同时改变硬件、语言、时区、屏幕和多个模块，不能单凭 A/B 差异确定某一个开关的因果。

局部诊断复用 `J:\awork\electron-fp-build\src\out\Release\electron.exe`，创建独立数据目录和隐藏测试窗口，只访问本地页面。七组为：同内核无配置、A、B、B 单独关闭 Audio、B 单独关闭 Rects、B 单独关闭 Canvas、A 单独启用 runtimeInspector。它验证内核接口，不是新一轮 Pixelscan 评分，也不是未经修改的原生 Chrome 对照。

### 2.2 发布内核对应关系

| 项目 | 核验结果 |
| --- | --- |
| 发行版本与源码提交 | `0.1.0`；`cabdf091a061df7544fb2d363c820680cbfc6de6` |
| Electron / Chromium | `37.2.6` / `138.0.7204.185` |
| 当前 Release 内核 SHA-256 | `531E7F5EDE0BD707017BE8682BFECC4AE2EC51803CBF87BE538FB4CE1640CD97` |
| 发行客户端 SHA-256 | `B4B753A4A28D6B28E400E8AFB8B0413344D6C0B92466BE1ED19933BC698C4D16` |
| 对应清单 | [release-manifest.json](../../../dist/fingerprint-browser-win-x64/release-manifest.json)；以上两个实际文件哈希均与清单一致 |

工作区已有应用代码、补丁和文档的未提交改动。发行清单中的提交号不能单独证明工作区与发行包内容完全相同，正式修改和复测仍须归档实际补丁、配置与产物哈希。

## 3. 掩蔽与一致性告警：已复现的问题

| 问题 | 本轮实测 | 原因入口 | 与 Pixelscan 告警的关系 |
| --- | --- | --- | --- |
| 网页可见内存异常 | 无配置/A 为 8，B 为 16 | `profile-store.js`、Schema、`fingerprint_profile_parser.cc` 接受 1～1024；Navigator 补丁直接返回配置整数 | 已确认实现偏离当前内核原生范围；是否直接命中该站尚待单变量复测 |
| UA/Client Hints 版本冲突 | A/B UA 为 `138.0.7204.185`，高熵完整版本为 `138.0.0.0`；无配置两者一致 | `fingerprint_config.cc::ApplyClientHintsOverride` 把完整版本拼成主版本加 `.0.0.0` | 站点公开采集脚本确实读取 UA 和高熵 `uaFullVersion`，存在直接可见的矛盾 |
| GREASE 品牌改写 | 无配置的 `Not)A;Brand` 为 8 / `8.0.0.0`；配置后为 138 / `138.0.0.0` | 同一函数遍历改写所有品牌 | 已确认对兼容探测品牌也做了非原生改写；最终规则命中待验证 |
| Screen/CSS 矛盾 | A 声称 1920×1080，B 声称 1440×900；两者 CSS 设备尺寸仍为 1477×831 | `screen.cc` 的覆盖未同步到 `media_values.cc` 的设备尺寸来源 | 页面可以直接交叉查询；本轮 DPR 查询与配置相符，不把所有 DPR 路径一并判错 |
| Audio 参数变化 | 请求 44100，B 的 Context/Buffer 返回 `44100.00390625`；关闭 Audio 恢复 44100 | `offline_audio_context.cc` 调整构造采样率，输出时长也随之变化 | 已确认违背请求参数语义；站点音频采集使用 44100 采样率，会受到该实现影响 |
| 空 Range 几何变化 | B 的空范围 x 为 `0.000018227296095574275`、y 为 `0.00019687475287355483`；关闭 Rects 恢复零 | `range.cc` 对空矩形也应用 Document 的固定偏移 | 已确认人为改写可通过简单几何向量观察；没有该站具体命中证据 |
| Canvas 读回不稳定 | B 同画布第一、二次不相同，第二、三次相同；CPU 路径连续读回相同；关闭 Canvas 恢复稳定 | Canvas 快照沿用底层颜色格式后直接调用 `NoisePixels`；第二次读回触发 CPU 回退 | 已确认可观察的不稳定；强烈指向颜色通道顺序问题，待以格式观测进一步闭环 |

当前 Chromium 的 `ApproximatedDeviceMemory` 明确把网页可见值限制到 8。物理内存为 16 GB 或更高不意味着 `navigator.deviceMemory` 应返回 16；两种概念需要在配置和界面中区分。

Canvas 的固定白色测试中，B 首次像素为 `[253,253,254,253]`，第二次为 `[254,253,253,253]`；整幅像素符合红、蓝互换，CPU 路径与第二次相同。源码中的 CPU 回退阈值为两次读回，噪声辅助函数沿用快照颜色格式。这支持优先检查 BGRA/RGBA 表示和转换顺序，而不是先增大或减小随机幅度。

此前 BrowserLeaks 的相同签名证明的是其特定绘制和重新检测场景。它没有证明同一画布在加速状态改变、不同尺寸、透明度和多种导出接口下都稳定。本轮发现应作为该结论的范围补充，不覆盖旧证据。

历史 CreepJS 中，Window 的完整版本是 `138.0.0.0`，ServiceWorker 是 `138.0.7204.185`。本轮普通 DedicatedWorker 返回 `138.0.0.0`，与 Window 相同；因此不能写成“所有 Worker 都泄漏版本”，必须区分 DedicatedWorker、SharedWorker 和 ServiceWorker。

## 4. 自动化告警：已确认事实与待归因部分

### 4.1 已确认

1. 最新 A/B 的 `modules.runtimeInspector` 均为 `false`；现有兼容补丁仅显式开启时收敛部分 Runtime 行为。
2. 最新五站测试使用专用远程调试端口 19227。是否开启端口、是否连接调试客户端、是否执行 `Runtime.enable`、是否进行了自动化输入，是不同变量。
3. 局部七组均返回 `navigator.webdriver=false`，插件列表为正常存在的五个 PDF 插件名称。不能把此次告警直接归因于 webdriver 为 true 或插件列表为空。
4. A 的 `Error.stack` getter 探针在无调试连接、连接并开启 Runtime 后，读取次数均为 0。该探针未复现常见的堆栈序列化检测路径，不能作为 CDP 导致告警的证据。
5. 连接调试器后，A 正常发出一条 `Runtime.consoleAPICalled`；启用 runtimeInspector 的 A 不发出该事件。这证明开关实际改变调试行为，也说明它可能影响依赖控制台事件的工具。协议事件的变化本身不等于网页检测到自动化。

### 4.2 站点公开采集脚本核查

2026-10-06 只读访问 [指纹检测页面](https://pixelscan.net/fingerprint-check)、[fptc.min.js](https://pixelscan.net/assets/fptc.min.js) 和页面实际引用的 [主包](https://pixelscan.net/main.bcd00fb60800a542.js)。对十六进制字符串转义只做文本解码，没有执行下载代码。

公开采集器读取 `navigator.webdriver`、UA、Client Hints 的 `uaFullVersion`、屏幕和 DPR，并构造 44100 采样率的 OfflineAudioContext。主包还包含机器人检测状态 `navigatorCheckStatus`、`webdriverCheckStatus`、`cdpCheckStatus`、`userAgentStatus`，以及指纹扫描的 `botDetection` 状态。

这证明该产品具有多类采集与机器人检查入口。还没有追踪完成本次指纹页面的最终告警与这些状态的具体关联，不能把独立机器人检测工具的状态直接当成本次指纹扫描的命中明细。

### 4.3 下一步归因标准

同一发行包、同一配置和同一出口，每次重新启动页面后分别测试：正常启动无调试端口 → 仅开放端口未连接 → 连接但不启用 Runtime → 启用 Runtime → 产品支持的自动化操作。普通 Chrome 与同内核无配置作为独立对照。

先记录未连接时的最终页面和截图，再做仪器观测；连接调试器后得到的结果要单独归档。相同网络下普通 Chrome 也告警时，继续检查站点启发式、网络信誉和测试条件，不能只在本系统堆叠补丁。

能复现“只改变一个变量，自动化判定随之改变”，并记录具体状态或响应字段后，才将该项写成确定根因。否则保留为待归因。消除已确认的 API 矛盾可以优先开发，不必等待所有闭源规则都解析完成。

## 5. 开发调整与执行顺序

### 阶段一：补齐自动化归因并冻结测试条件

| 编号 | 工作内容 | 交付与验收 |
| --- | --- | --- |
| PS-01 | 完成 4.3 的启动对照，记录页面终态、三个告警类别、配置、出口、客户端/内核哈希和调试状态 | 自动化结论有原始证据；采集失败、扫描未结束和未返回结论均记为无效 |
| PS-02 | 先对齐出口时区与配置；核对 Date、Intl、夏令时和 HTTP/JS 语言 | 时区告警消失后再评估掩蔽/自动化；语言选择合理，不把中文用户使用美国出口一概当成浏览器缺陷 |

旧的 P1-04 提前执行，并升级为专项发布前置；不继续用五站 A/B 多变量对照代替原因实验。最新纽约 B 与旧金山出口的错配需先处理；已有洛杉矶 B 无时区告警但仍有自动化告警，说明时区修正不能解决全部问题。

### 阶段二：优先修复确定的一致性缺陷

| 编号 / 优先级 | 最小实现方案 | 候选位置与层级 | 验收 |
| --- | --- | --- | --- |
| PS-03 / P0 | 区分物理内存与网页可见内存；在现有整数协议内先约束为 1、2、4、8；明确旧环境 16 等值的迁移 | 应用 `profile-store.js`、配置界面和环境保存入口；同步 Schema、Electron 解析器与 Navigator `.cc` 边界 | 非法可见值被明确处理；A/B/Window/Worker 值一致；旧环境不被静默换指纹 |
| PS-04 / P0 | 默认使用真实内核元数据；保留 GREASE 生成；UA、真实品牌版本和完整版本采用同一来源 | `fingerprint_config.cc::ApplyClientHintsOverride`、`electron_api_web_contents.cc` 现有覆盖接口；核查 Worker 网络链路 | 当前默认配置 UA/高熵版本一致；Window/各类 Worker 与 HTTPS 实际收包一致；高熵头按 Accept-CH 协商检查 |
| PS-05 / P0 | 统一网页可见 Screen 与 CSS 设备尺寸，复用已有 Screen/覆盖入口；核查窗口缩放和多显示器语义 | 屏幕模块 `screen.cc`、CSS `media_values.cc`，必要时使用合法的窄适配入口 | JS/CSS 同一屏幕坐标体系，缩放/DPR 与布局行为正确；禁止简单把物理像素等同 CSS 像素 |
| PS-06 / P0 | 在噪声入口按明确颜色格式处理，优先验证并修复 BGRA/RGBA 路径差异；保持原画布内容不被读回修改 | `canvas_interventions_helper.cc`；关联 `base_rendering_context_2d.cc` 读回和 `NoisePixels` 现有能力 | 默认/GPU/CPU/回退路径，连续十次读取一致；纯色、透明、半透明、子区域、不同尺寸及导出后解码一致 |
| PS-07 / P0 | 保持 OfflineAudioContext 请求的采样率和帧数；重新选择保护入口和算法，验证音频数据导出一致性 | `offline_audio_context.cc` 及已有音频导出能力；复用现有配置和开关 | 请求采样率等于 Context/Buffer 可见值；时长等于帧数/采样率；两种构造形式和导出入口一致 |
| PS-08 / P1 | 空矩形保留原生零值；审查固定全局平移和文本指标整体比例能否造成矛盾或被反推 | `element.cc`、`range.cc` 及现有 Canvas 文本噪声实现；尽量局部 `.cc` 修复 | 空范围、无布局、CSS 整数位置、滚动/变换、Range/Element/SVG 等价关系正确；保持命中测试和点击定位 |

PS-03 的第一版不扩展到 0.25/0.5 等小数：现有字段是整数。只有产品确需完整取值集合时，才评估 Schema、解析、序列化、传输和消费者的协议变更；不能直接添加小数后宣称支持。

PS-06、PS-07 和 PS-08 对应旧计划 P1-02，按已复现缺陷分别拆开验收。其中 Canvas 连续读回与音频参数问题提升到 P0。旧计划的 Locale/Intl 初始化和 WebGL 噪声开关已完成部分继续复用，不重复开发。

### 阶段三：按自动化根因做必要调整

| 归因结果 | 开发动作 | 验收重点 |
| --- | --- | --- |
| 无调试连接也告警，且与版本/屏幕等单变量缺陷相关 | 先完成对应 P0；每次修复后重测机器人分类 | 记录具体哪个修复改变了结论，避免将同批多项改动都写成根因 |
| 仅连接或 Runtime 启用后告警 | 验证现有 runtimeInspector 对具体信号的作用；先评估协议行为和工具兼容性 | 导航、执行、输入、iframe/Worker、异常、控制台和调试功能仍能完成；不能以“没有事件返回”作为检测通过 |
| 正常模式通过、自动化操作后告警 | 继续追踪实际输入与协议实现差异，以及站点返回的命中项 | 自动化模式单独验收；保留真实操作事件语义，不把随机延时作为根因修复 |
| 原生对照也告警 | 对照网络信誉、站点状态及版本差异，保存完整证据 | 记录仍未达到的目标；不据此把本系统写成已通过 |

保留 sandbox、contextIsolation 和 Node 隔离，按 Session 维护授权语义。媒体设备为空、系统语音语言与网页语言不同、字体数量或同一机器的 GPU 字符串相同都不足以单独证明自动化；只有明确的对照证据才安排额外改动。当前已有五个插件，暂不开发伪造插件数组。

### 阶段四：保留保护能力，做发行验收

先逐一验收 Canvas、Audio、Rects、WebGL 和字体，再组合开启。暂时关闭某个缺陷模块可以作为对照或兼容降级，但必须标注保护范围；全部关闭后告警消失不能作为“隔离能力与掩蔽能力同时达标”的交付证据。

GPU 字符串覆盖不会自动改变真实 GPU 的扩展、精度和渲染能力。先选与实际平台、后端和能力相容的模板，再评估额外覆盖；字体集合仍需结合平台、渲染和权限判断。跨站防关联继续沿用旧计划 P1-05，单独验收，不与 Pixelscan 通过混成一个分数。

## 6. 验收矩阵与完成门槛

| 维度 | 必测场景 |
| --- | --- |
| 基线 | 普通 Chrome、同内核无配置、Profile 禁用、模块关闭、修复前 A/B、修复后环境 |
| 启动方式 | 正常使用、仅端口开放、调试连接、Runtime 启用、支持的自动化方式 |
| 生命周期 | 同画布十次读回、三次页面重开、三次客户端恢复、两环境同时运行、关闭其中一个后继续使用 |
| 上下文 | Window、同源/跨源 iframe、DedicatedWorker、SharedWorker、ServiceWorker；接口不可用时标为不适用 |
| 网络与隐私 | 出口位置、时区/夏令时、HTTP/JS 语言、HTTPS Client Hints 协商、WebRTC 在实际代理与端点可达条件下的候选和来源地址 |
| 产品功能 | 登录、表单、页面交互、音频、Canvas 内容导出、权限、环境恢复和自动化工具功能 |

完成门槛：

1. 确定的内存、版本、屏幕、采样率、空几何和连续读回缺陷均有回归证据。
2. 至少两个独立环境，每个约定使用方式在三次客户端启动中各完成三次 Pixelscan 有效检测；三类目标状态均通过。共九次/环境/方式，所有有效结果都保留，不只挑选成功截图。
3. Pixelscan 正常加载并完成检测，未拦截其必要脚本或篡改页面/返回结果；扫描失败不记通过。
4. 正常模式与自动化模式分别报告。只完成其中一项时，整体目标仍未完成。
5. Cookie/存储/会话隔离、站点内稳定、隐私模块实际保护范围和产品功能无回退；旧环境按明确策略迁移或维持既有快照。
6. CreepJS、BrowserLeaks、BrowserScan 至少完成交叉回归，确认没有把告警转移到其他接口。公开唯一性数据作为独立指标，不换算成固定识别概率。

## 7. 构建与交付约束

本轮已修改应用层校验、Schema、Electron 配置解析和六个原生实现文件，并新增独立 Chromium 补丁；未修改公共头、GN 参数或原生缓存。Release 原生增量编译已在 `J:\awork\electron-fp-build\src\out\Release` 完成，之后 Ninja 预演为 `ninja: no work to do.`；诊断进程已退出。

后续实现先按应用层 → Electron 会话/适配 → Chromium 所属能力定位。默认改私有 `.cc`；修改协议、公共 `.h` 或跨层接口前，列出所有调用方、生产方与消费者，说明局部方案不足和实际依赖影响。Screen/CSS 的共同来源尤其需要按 Blink 现有依赖边界实现，不能让 Blink 包含 Electron 项目头。

仅应用层调整复用现有 Release 运行时。涉及原生变更时，保留 `J:\awork\electron-fp-build\src\out\Release` 的构建图、依赖记录、对象文件和缓存，修改前后分别执行 `ninja.bat -C out\Release -n -d explain electron`，比较实际失效原因和步骤；超过十步先暂停排查。仅在新增任务都能由本次变更解释后，对最小目标以 `-j 4` 构建，打包 ZIP 单独预演。

对改动的 `.cc` 必须使用现有 `check_cpp_syntax.py` 做单文件检查；本轮检索仍未找到该脚本，因此该项未检查，不能用编译或局部运行代替。禁止清缓存、全量构建、换输出目录或升级上游来绕过局部问题。

每个任务分别交付最小补丁、局部回归、原生预演及必要构建结果、发行包哈希、Pixelscan 原始记录和未达到项目。执行顺序为：启动归因/网络对齐 → 内存与版本 → 屏幕与画布 → 音频/几何 → 有证据的自动化修复 → 完整发行验收。

## 8. 本轮执行记录

- PS-03～PS-08 的修复已编译进当前 Release；旧 `deviceMemory=16` 配置在最新解析器中被明确拒绝，未静默替换。
- 显式迁移为 8 GiB 后，七组局部验证均通过：Window/Worker 内存一致、UA 与高熵完整版本一致、Screen/CSS 尺寸一致、OfflineAudioContext 参数一致、空 Range 为零、Canvas 连续读回稳定，`navigator.webdriver` 保持 `false`。
- `npm test`、`npm run test:tabs`、`npm run test:environments`、补丁校验和 Release Ninja 预演均通过；标签测试中的代理失败和退出阶段异常为既有负向场景日志，进程退出码为 0。
- 尚未完成同一出口下正常启动、调试连接和受支持自动化方式的 Pixelscan 有效复测，因此不能宣称“自动化”和“掩蔽”告警已消除；本轮也未加入第三方检测绕过或伪造人类行为逻辑。
