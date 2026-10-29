const fs = require('node:fs/promises')
const path = require('node:path')
const crypto = require('node:crypto')
const { fileDigest, updateUrl, verifyManifest } = require('../client-updater')

async function main () {
  const options = {}
  for (let i = 2; i < process.argv.length; i += 2) { if (!process.argv[i].startsWith('--') || process.argv[i + 1] === undefined) throw new Error('发布参数不完整。'); options[process.argv[i].slice(2)] = process.argv[i + 1] }
  if (options['init-keys']) {
    const directory = path.resolve(options['init-keys']); await fs.mkdir(directory, { recursive: true, mode: 0o700 })
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519')
    await fs.writeFile(path.join(directory, 'update-private.pem'), privateKey.export({ type: 'pkcs8', format: 'pem' }), { flag: 'wx', mode: 0o600 })
    await fs.writeFile(path.join(directory, 'update-public.pem'), publicKey.export({ type: 'spki', format: 'pem' }), { flag: 'wx', mode: 0o644 })
    console.log('更新签名密钥已生成。私钥仅保存在指定目录，不得提交或放入更新公开目录。'); return
  }
  if (!options.key || !options.artifact || !options.output || !options.version || !['dev', 'test', 'prod'].includes(options.channel) || !options['base-url']) throw new Error('请填写 key、artifact、output、version、channel 和 base-url 发布参数。')
  const directory = path.resolve(options.output); const keyPath = path.resolve(options.key)
  const release = JSON.parse(await fs.readFile(path.join(path.dirname(path.resolve(options.artifact)), 'fingerprint-browser-win-x64', 'release-manifest.json'), 'utf8'))
  if (release.version !== options.version || release.environment !== options.channel || path.extname(options.artifact).toLowerCase() !== '.exe') throw new Error('发布版本、环境或安装包类型与实际打包清单不一致。')
  if (keyPath.startsWith(directory + path.sep)) throw new Error('签名私钥不能放在更新公开目录中。')
  const key = crypto.createPrivateKey(await fs.readFile(keyPath))
  if (key.asymmetricKeyType !== 'ed25519') throw new Error('更新签名需要 Ed25519 私钥。')
  const publicKey = crypto.createPublicKey(key).export({ type: 'spki', format: 'pem' })
  const sha256 = await fileDigest(options.artifact)
  const name = `qijie-${options.version}-${options.channel}-${sha256.slice(0, 16)}.exe`
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) throw new Error('更新版本号无效。')
  const publishedAt = Date.now()
  const downloadBase = options['base-url'].replace(/\/?$/, '/')
  const manifest = { format: 'qijie-update-v1', version: options.version, channel: options.channel, platform: 'win32', arch: 'x64', sha256, size: (await fs.stat(options.artifact)).size, url: updateUrl(new URL(name, downloadBase).href, options.channel), publishedAt, expiresAt: publishedAt + 30 * 86400000, notes: options['notes-file'] ? (await fs.readFile(options['notes-file'], 'utf8')).trim() : '修复已知问题并改善使用体验。' }
  const payload = Buffer.from(JSON.stringify(manifest)); const envelope = { payload: payload.toString('base64'), signature: crypto.sign(null, payload, key).toString('base64') }
  verifyManifest(envelope, { publicKey, channel: options.channel, platform: 'win32', arch: 'x64', currentVersion: '0.0.0' })
  await fs.mkdir(directory, { recursive: true, mode: 0o755 })
  await fs.copyFile(options.artifact, path.join(directory, name))
  if (await fileDigest(path.join(directory, name)) !== sha256) throw new Error('发布安装包复制后校验失败。')
  const feed = path.join(directory, `${options.channel}-win32-x64.json`); const temporary = feed + '.' + crypto.randomUUID() + '.tmp'
  await fs.writeFile(temporary, JSON.stringify(envelope), { flag: 'wx', mode: 0o644 }); await fs.rename(temporary, feed)
  console.log(`已发布 ${options.channel} 客户端 ${options.version} 的签名更新清单与安装包。`)
}
main().catch(error => { console.error(error.message && !error.code ? error.message : '更新发布失败，请检查密钥、安装包和输出目录权限。'); process.exitCode = 1 })
