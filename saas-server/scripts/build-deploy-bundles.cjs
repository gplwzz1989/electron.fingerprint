const fs = require('node:fs/promises')
const path = require('node:path')
const ncc = require('@vercel/ncc')

const serverRoot = path.resolve(__dirname, '..')
const distRoot = path.join(serverRoot, 'dist')
const outputRoot = path.resolve(process.argv[2] || '')
const inside = (root, candidate) => candidate.startsWith(root + path.sep)

function executableCode (code, label) {
  const marker = 'eval("require.main === module")'
  if (code.includes(marker)) return code.replace(marker, 'true')
  if (code.includes("require.main === require.cache[eval('__filename')]")) return code
  throw new Error(`${label}的启动入口标记与打包器输出不匹配。`)
}

async function writeAsset (root, key, asset) {
  const destination = path.resolve(root, key)
  if (!inside(root, destination)) throw new Error('打包器输出路径越界，已停止生成服务包。')
  await fs.mkdir(path.dirname(destination), { recursive: true })
  await fs.writeFile(destination, asset.source)
}

async function bundleWorkspace () {
  const output = path.join(outputRoot, 'server')
  const result = await ncc(path.join(serverRoot, 'src/workspace-server.js'), { cache: false })
  await fs.mkdir(output, { recursive: true })
  await fs.writeFile(path.join(output, 'index.js'), executableCode(result.code, 'SaaS 服务'))
  for (const [key, asset] of Object.entries(result.assets)) {
    const generatedClientAsset = key.startsWith('saas-server/node_modules/.prisma/client/') && ['.js', '.json', '.wasm', '.prisma'].some(extension => key.endsWith(extension))
    const effectPackageAsset = key === 'saas-server/node_modules/effect/.index/package.json'
    const schemaAsset = key === 'schema.prisma'
    const runtimeChunk = path.dirname(key) === '.' && key.endsWith('.js')
    if (generatedClientAsset || effectPackageAsset || schemaAsset || runtimeChunk) await writeAsset(output, key, asset)
  }
}

async function bundlePrismaCli () {
  const output = path.join(outputRoot, 'prisma-cli', 'build')
  const result = await ncc(path.join(serverRoot, 'node_modules/prisma/build/index.js'), { cache: false })
  await fs.mkdir(output, { recursive: true })
  await fs.writeFile(path.join(output, 'index.js'), executableCode(result.code, 'Prisma CLI'))
  for (const [key, asset] of Object.entries(result.assets)) {
    if (path.dirname(key) === '.' && key.endsWith('.js')) await writeAsset(output, key, asset)
  }
  const packageDirectory = path.join(outputRoot, 'prisma-cli')
  await fs.copyFile(path.join(serverRoot, 'node_modules/prisma/package.json'), path.join(packageDirectory, 'package.json'))
  for (const wasm of ['prisma_schema_build_bg.wasm', 'schema_engine_bg.wasm']) {
    await fs.copyFile(path.join(serverRoot, `node_modules/prisma/build/${wasm}`), path.join(output, wasm))
  }
}

async function main () {
  if (!inside(distRoot, outputRoot)) throw new Error('SaaS 部署构建只能写入固定 dist 目录。')
  await bundleWorkspace()
  if (global.gc) global.gc()
  await bundlePrismaCli()
}

main().catch(error => {
  console.error(error.message || '服务端打包未完成。')
  process.exitCode = 1
})
