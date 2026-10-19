import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    // TODO：生产环境需要清空 vitest
    // 'import.meta.vitest': 'undefined',
  },
  test: {
    // 隔离每个测试的环境
    isolate: true,

    // 测试超时，不宜过长
    testTimeout: 60000,

    // 测试环境
    environment: 'node',

    // 多线程
    threads: true,

    // 测试文件
    includeSource: ['src/**/*.{js,ts}'],

    // 覆盖率报告
    coverage: {
      clean: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },

    // 别名
    alias: {
      '@': resolve(__dirname, 'src'),
      '@@': resolve(__dirname, 'test'),
    },
  },
});
