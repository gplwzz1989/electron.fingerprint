const path = require('node:path')
const fs = require('node:fs/promises')
const { execFile } = require('node:child_process')
const { promisify } = require('node:util')

const execute = promisify(execFile)

async function createDiagnosticTLS (directory) {
  const candidates = [process.env.FP_TEST_OPENSSL, 'openssl'].filter(Boolean)
  try {
    const git = await execute('git', ['--exec-path'], { windowsHide: true })
    candidates.push(path.resolve(git.stdout.trim(), '../../../usr/bin', process.platform === 'win32' ? 'openssl.exe' : 'openssl'))
  } catch {}
  let executable
  for (const candidate of candidates) {
    try {
      await execute(candidate, ['version'], { windowsHide: true })
      executable = candidate
      break
    } catch {}
  }
  if (!executable) throw new Error('HTTPS 诊断需要 OpenSSL，请安装或通过 FP_TEST_OPENSSL 指定程序路径。')
  await fs.mkdir(directory, { recursive: true })
  const extensions = 'basicConstraints=critical,CA:FALSE\nkeyUsage=critical,digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\nsubjectAltName=DNS:a.localhost,DNS:b.localhost,DNS:tracker.localhost\n'
  await fs.writeFile(path.join(directory, 'server.cnf'), extensions, 'utf8')
  const options = { cwd: directory, windowsHide: true, timeout: 15000 }
  try {
    await execute(executable, ['req', '-x509', '-newkey', 'rsa:2048', '-noenc', '-sha256', '-days', '2', '-subj', '/CN=FP Diagnostic CA', '-addext', 'basicConstraints=critical,CA:TRUE', '-addext', 'keyUsage=critical,keyCertSign,cRLSign', '-keyout', 'ca.key', '-out', 'ca.pem'], options)
    await execute(executable, ['req', '-new', '-newkey', 'rsa:2048', '-noenc', '-subj', '/CN=a.localhost', '-keyout', 'server.key', '-out', 'server.csr'], options)
    await execute(executable, ['x509', '-req', '-in', 'server.csr', '-CA', 'ca.pem', '-CAkey', 'ca.key', '-CAcreateserial', '-days', '2', '-sha256', '-extfile', 'server.cnf', '-out', 'server.pem'], options)
    await fs.chmod(path.join(directory, 'ca.key'), 0o600)
    await fs.chmod(path.join(directory, 'server.key'), 0o600)
  } catch {
    throw new Error('无法生成 HTTPS 诊断证书，请检查 OpenSSL 版本和诊断目录权限。')
  }
}

module.exports = { createDiagnosticTLS }
