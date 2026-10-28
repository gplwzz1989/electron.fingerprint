const { domainToASCII } = require('node:url')

function normalizeEmail (value) {
  if (typeof value !== 'string' || value.length > 254) return null
  const parts = value.trim().split('@')
  if (parts.length !== 2) return null
  const [local, suppliedDomain] = parts
  if (!local || local.length > 64 || !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local) || local.startsWith('.') || local.endsWith('.') || local.includes('..')) return null
  const domain = domainToASCII(suppliedDomain).toLowerCase()
  if (!domain || domain.length > 253 || !domain.includes('.') || domain.split('.').some(label => label.length > 63 || !/^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(label))) return null
  return `${local.toLowerCase()}@${domain}`
}

module.exports = { normalizeEmail }
