const path = require('node:path')
const { buildSync } = require('esbuild')

// 界面依赖预构建为自包含脚本；生产服务与网页均不依赖开发机或第三方 CDN。
buildSync({
  entryPoints: [path.join(__dirname, '../src/ui/dialogs.jsx')],
  outfile: path.join(__dirname, '../public/ui-components.js'),
  bundle: true,
  minify: true,
  platform: 'browser',
  format: 'iife',
  target: ['chrome138'],
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"' },
  legalComments: 'inline',
  charset: 'utf8'
})
console.log('shadcn/ui 弹层组件构建完成。')
