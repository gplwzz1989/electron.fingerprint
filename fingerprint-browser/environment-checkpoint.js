const crypto = require('node:crypto')
const path = require('node:path')
const fs = require('node:fs/promises')

class CheckpointError extends Error {
  constructor (message) {
    super(message)
    this.name = 'CheckpointError'
  }
}

function safeRelativePath (value) {
  if (typeof value !== 'string' || !value || path.isAbsolute(value)) throw new CheckpointError('检查点文件路径无效。')
  const normalized = value.replaceAll('\\', '/')
  if (normalized.split('/').includes('..')) throw new CheckpointError('检查点文件路径越界。')
  return normalized
}

function withinRoot (root, relativePath) {
  const absolute = path.resolve(root, relativePath)
  const relative = path.relative(path.resolve(root), absolute)
  if (!relative || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new CheckpointError('检查点路径越界。')
  return absolute
}

async function hashFile (filePath, fileSystem) {
  const data = await fileSystem.readFile(filePath)
  return { size: data.byteLength, sha256: crypto.createHash('sha256').update(data).digest('hex') }
}

async function walk (root, current, fileSystem, files) {
  const entries = await fileSystem.readdir(current, { withFileTypes: true })
  for (const entry of entries) {
    const absolute = path.join(current, entry.name)
    if (entry.isSymbolicLink()) throw new CheckpointError('环境目录包含不支持的符号链接。')
    if (entry.isDirectory()) {
      await walk(root, absolute, fileSystem, files)
      continue
    }
    if (!entry.isFile()) continue
    const relative = safeRelativePath(path.relative(root, absolute))
    files.push({ path: relative, ...(await hashFile(absolute, fileSystem)) })
  }
}

async function createCheckpoint ({ environmentId, dataDir, baseVersion = 1, platform = process.platform, now = Date.now(), fileSystem = fs } = {}) {
  if (typeof environmentId !== 'string' || !environmentId.trim()) throw new CheckpointError('环境 ID 不能为空。')
  if (typeof dataDir !== 'string' || !dataDir.trim()) throw new CheckpointError('环境数据目录不能为空。')
  if (!Number.isInteger(baseVersion) || baseVersion < 1) throw new CheckpointError('检查点版本无效。')
  const root = path.resolve(dataDir || '')
  const files = []
  try {
    await walk(root, root, fileSystem, files)
  } catch (error) {
    if (error instanceof CheckpointError) throw error
    throw new CheckpointError('环境目录无法读取，不能创建检查点。')
  }
  files.sort((left, right) => left.path.localeCompare(right.path))
  return { schemaVersion: 1, environmentId: environmentId.trim(), baseVersion, platform, createdAt: now, files }
}

async function verifyCheckpoint ({ dataDir, manifest, targetPlatform = process.platform, fileSystem = fs } = {}) {
  if (!manifest || manifest.schemaVersion !== 1 || !Array.isArray(manifest.files)) throw new CheckpointError('检查点格式无效。')
  if (typeof dataDir !== 'string' || !dataDir.trim()) throw new CheckpointError('环境数据目录不能为空。')
  if (manifest.platform !== targetPlatform) return { ok: false, reason: 'platform', missing: [], changed: [], unexpected: [] }
  const root = path.resolve(dataDir || '')
  const missing = []
  const changed = []
  const listed = new Set()
  for (const file of manifest.files) {
    const relative = safeRelativePath(file.path)
    listed.add(relative)
    const absolute = withinRoot(root, relative)
    try {
      const actual = await hashFile(absolute, fileSystem)
      if (actual.size !== file.size || actual.sha256 !== file.sha256) changed.push(relative)
    } catch (error) {
      if (error.code === 'ENOENT') missing.push(relative)
      else throw new CheckpointError('检查点文件无法读取。')
    }
  }
  const actualFiles = []
  try {
    await walk(root, root, fileSystem, actualFiles)
  } catch (error) {
    if (error.code === 'ENOENT') return { ok: false, reason: 'missing-directory', missing, changed, unexpected }
    if (error instanceof CheckpointError) throw error
    throw new CheckpointError('环境目录无法读取，不能验证检查点。')
  }
  const unexpected = actualFiles.map(file => file.path).filter(relative => !listed.has(relative))
  return { ok: missing.length === 0 && changed.length === 0 && unexpected.length === 0, reason: null, missing, changed, unexpected }
}

function assertTransferVersion (baseVersion, currentVersion) {
  if (!Number.isInteger(baseVersion) || !Number.isInteger(currentVersion) || baseVersion !== currentVersion) {
    throw new CheckpointError('环境版本已变化，已保留本地数据并阻止覆盖。')
  }
  return true
}

module.exports = { CheckpointError, assertTransferVersion, createCheckpoint, verifyCheckpoint }
