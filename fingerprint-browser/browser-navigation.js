;(function (root) {
  'use strict'
  function resolveAddress (input) {
    const value = String(input || '').trim()
    if (!value || value === 'about:blank') return 'about:blank'
    let target = value
    const local = /^(?:localhost|127(?:\.\d{1,3}){3}|\[::1\])(?::\d+)?(?:[/?#]|$)/i.test(value)
    const hostWithPort = /^[\w.-]+:\d+(?:[/?#]|$)/.test(value)
    if (local || hostWithPort) target = 'http://' + value
    else if (/^[a-z][a-z0-9+.-]*:/i.test(value)) {
      if (!/^https?:\/\//i.test(value)) throw new Error('网址只支持 http、https 或 about:blank。')
    } else if (/\s/.test(value) || !/^[^/?#\s]+\.[^/?#\s]+/.test(value)) return 'https://www.baidu.com/s?wd=' + encodeURIComponent(value)
    else target = 'https://' + value
    try { const url = new URL(target); if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error(); return url.href } catch { throw new Error('网址格式不正确，请检查后重试。') }
  }
  if (typeof module === 'object' && module.exports) module.exports = { resolveAddress }
  else root.QijieBrowserNavigation = { resolveAddress }
})(typeof window === 'object' ? window : globalThis)
