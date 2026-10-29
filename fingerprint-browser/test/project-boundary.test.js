const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

test('项目源码不跨目录导入，不使用相邻项目或工作区链接依赖', () => {
  const root = path.resolve(__dirname, '..')
  const inspect = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name)
      if (entry.isDirectory()) { if (!['node_modules','dist','.git','.idea','data','scratch','archive'].includes(entry.name)) inspect(file); continue }
      if (!entry.name.endsWith('.js')) continue
      const source = fs.readFileSync(file, 'utf8')
      for (const match of source.matchAll(/require\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g)) {
        const target = path.resolve(directory, match[1])
        assert(target === root || target.startsWith(root + path.sep), `${path.relative(root, file)} 存在跨项目源码导入。`)
      }
    }
  }
  inspect(root)
  const metadata = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
  for (const version of Object.values({ ...metadata.dependencies, ...metadata.devDependencies, ...metadata.optionalDependencies })) assert(!/^(?:file:|link:|workspace:)/.test(version), '禁止使用跨项目链接依赖。')
})
