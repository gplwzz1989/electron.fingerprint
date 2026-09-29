# 架构

FingerprintProfile 属于 Session 对应的 ElectronBrowserContext，不属于 BrowserWindow。

第一阶段链路：

```text
Session -> ElectronBrowserContext -> FingerprintContext -> Renderer
```

没有 Profile 时不添加任何 FP 配置，保持 Electron 原始行为。第一版配置在 Renderer 创建前确定，不支持热更新。
