# 测试

首批测试必须覆盖：

1. 无 Profile 时保持 Electron 原始路径；
2. Profile A、Profile B、Normal Session 互不污染；
3. `hardwareConcurrency` 从 Session 配置传递到 Renderer；
4. 配置非法时在 Browser Process 拒绝，不导致崩溃。
