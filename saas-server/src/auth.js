const crypto = require('node:crypto')

const DEFAULT_SECRET = process.env.SAAS_JWT_SECRET || crypto.randomBytes(32).toString('hex')

function base64UrlEncode (str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function base64UrlDecode (str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  return Buffer.from(base64, 'base64').toString('utf8')
}

function hashPassword (password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `scrypt:${salt}:${hash}`
}

function verifyPassword (password, combined) {
  if (typeof password !== 'string' || typeof combined !== 'string') return false
  const parts = combined.split(':')
  const modern = parts[0] === 'scrypt' && parts.length === 3
  const [salt, originalHash] = modern ? parts.slice(1) : parts
  if (!salt || !/^[a-f0-9]+$/i.test(originalHash || '')) return false
  const hash = modern ? crypto.scryptSync(password, salt, 64) : crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha256')
  const expected = Buffer.from(originalHash, 'hex')
  return hash.length === expected.length && crypto.timingSafeEqual(hash, expected)
}

function signToken (payload, secret, expiresInSeconds = 7 * 24 * 3600) {
  const effectiveSecret = secret || DEFAULT_SECRET
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload))
  const signature = crypto
    .createHmac('sha256', effectiveSecret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  return `${encodedHeader}.${encodedPayload}.${signature}`
}

function verifyToken (token, secret) {
  const effectiveSecret = secret || DEFAULT_SECRET
  if (typeof token !== 'string') throw new Error('Token 无效')
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Token 格式错误')

  const [encodedHeader, encodedPayload, signature] = parts
  const expectedSignature = crypto
    .createHmac('sha256', effectiveSecret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  if (signature.length !== expectedSignature.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    throw new Error('Token 签名无效')
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload))
  const header = JSON.parse(base64UrlDecode(encodedHeader))
  if (header.alg !== 'HS256' || !Number.isInteger(payload.exp)) throw new Error('登录凭证无效。')
  const now = Math.floor(Date.now() / 1000)
  if (payload.exp && payload.exp < now) {
    throw new Error('Token 已过期')
  }

  return payload
}

module.exports = {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken
}
