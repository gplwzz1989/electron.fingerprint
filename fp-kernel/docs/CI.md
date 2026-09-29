# CI

`fp-validate.yml` 负责版本、Schema 和补丁登记检查。

Windows x64 重型构建工作流先保留 `workflow_dispatch`，避免在完成基础验证前消耗共享 Runner 资源。
