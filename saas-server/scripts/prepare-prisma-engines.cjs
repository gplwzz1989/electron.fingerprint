const fs = require('node:fs')
const path = require('node:path')
const { BinaryType, download } = require('@prisma/fetch-engine')
const { enginesVersion } = require('@prisma/engines')

async function main () {
  const engineDirectory = path.resolve(__dirname, '../node_modules/@prisma/engines')
  const binary = path.join(engineDirectory, 'schema-engine-debian-openssl-3.0.x')
  if (!fs.existsSync(binary) || fs.statSync(binary).size < 1024 * 1024) {
    await download({
      binaries: { [BinaryType.SchemaEngineBinary]: engineDirectory },
      binaryTargets: ['debian-openssl-3.0.x'],
      version: enginesVersion,
      showProgress: true,
      failSilent: false
    })
  }
  if (!fs.existsSync(binary) || fs.statSync(binary).size < 1024 * 1024) throw new Error('未能准备 Linux x64 Prisma Schema Engine。')
  process.stdout.write('已准备 Linux x64 Prisma Schema Engine（Debian / OpenSSL 3）。\n')
}

main().catch(error => {
  console.error(error.message || 'Prisma Linux 引擎准备失败。')
  process.exitCode = 1
})
