'use strict'

function getDoocsInliner () {
  if (typeof window !== 'undefined' && window.DoocsInliner) return window.DoocsInliner
  if (typeof globalThis !== 'undefined' && globalThis.DoocsInliner) return globalThis.DoocsInliner
  if (typeof require !== 'undefined') {
    try {
      return require('./inliner').DoocsInliner
    } catch (_) {}
  }
  return null
}


/**
 * Doocs 剪贴板交互模块
 * 封装多 MIME (text/html + text/plain) 写入，适配各大浏览器与微信公众平台粘贴
 */
async function copyWechatHtmlToClipboard (rawHtml) {
  if (!rawHtml) throw new Error('复制内容不能为空')

  const inliner = getDoocsInliner()
  const inlinedHtml = inliner ? inliner.inlineHtml(rawHtml) : rawHtml

  // 1. 优先使用现代 Clipboard API (text/html + text/plain)
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof window.ClipboardItem !== 'undefined') {
    const textBlob = new Blob([inlinedHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()], { type: 'text/plain' })
    const htmlBlob = new Blob([inlinedHtml], { type: 'text/html' })

    await navigator.clipboard.write([
      new window.ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob
      })
    ])
    return { ok: true, length: inlinedHtml.length }
  }

  // 2. 降级方案：创建临时隐藏 DOM 进行 Selection 复制
  if (typeof document !== 'undefined') {
    const div = document.createElement('div')
    div.style.position = 'fixed'
    div.style.left = '-9999px'
    div.style.top = '0'
    div.innerHTML = inlinedHtml
    document.body.appendChild(div)

    const range = document.createRange()
    range.selectNodeContents(div)
    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)

    const success = document.execCommand('copy')
    document.body.removeChild(div)

    if (!success) throw new Error('execCommand copy 执行失败')
    return { ok: true, length: inlinedHtml.length }
  }

  throw new Error('当前环境不支持剪贴板操作')
}

if (typeof window !== 'undefined') {
  window.copyWechatHtmlToClipboard = copyWechatHtmlToClipboard
}
if (typeof globalThis !== 'undefined') {
  globalThis.copyWechatHtmlToClipboard = copyWechatHtmlToClipboard
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { copyWechatHtmlToClipboard }
}

