import { resolve } from 'path';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: ['es2020'],
    sourcemap: true,
    minify: true,
    cssMinify: true,
    rollupOptions: {
      // 排出不需要编译的包
      external: ['axios', 'fs', 'crypto', 'buffer', 'https', 'path', 'form-data'],
    },
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'index',
      fileName: 'index',
      formats: ['es', 'umd', 'cjs'],
    },
    outDir: 'lib',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [
    nodePolyfills({
      exclude: ['util', 'buffer', 'stream', 'net', 'url', 'path', 'fs', 'crypto', 'https'],
      globals: {
        process: true,
        Buffer: true,
        global: true,
      },
      protocolImports: true,
    }),
  ],
});
