/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Vitest
   *  - `true`: 启用`vite`测试
   *  - `false`: 禁用`vite`测试
   */
  readonly VITEST: string;

  /**
   * Vitest mode
   *  - `RUN`: 使用`vite`运行测试
   */
  readonly VITEST_MODE: string;

  // readonly VITE_APP_TITLE: string;
  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  readonly vitest: boolean;
}
