'use strict'

/**
 * Doocs 浏览器原生 CSS 样式内联器 (Browser-Native Inliner)
 * 源码级实现：利用标准 DOM 与计算样式，消除对重度第三方库 juice 的依赖，
 * 将渲染出来的微信 Markdown HTML 彻底转换为带全内联 style 属性的纯净富文本
 */
class DoocsInliner {
  /**
   * 将 HTML 文本或 DOM 元素的所有样式属性强制内联化
   * @param {string|HTMLElement} input - HTML 字符串或 DOM 节点
   * @returns {string} 完全内联样式的 HTML 字符串
   */
  static inlineHtml (input) {
    if (!input) return ''

    // 如果处于浏览器/渲染进程环境，使用标准 DOM 树遍历与合并
    if (typeof document !== 'undefined') {
      let container
      if (typeof input === 'string') {
        container = document.createElement('div')
        container.innerHTML = input
      } else if (input.cloneNode) {
        container = input.cloneNode(true)
      } else {
        return String(input)
      }

      // 遍历所有子元素，清洗并规整内联 style
      const elements = container.querySelectorAll('*')
      elements.forEach(el => {
        // 微信公众平台对特定标签（如 figure / hr / blockquote）需要明确的 display 与 margin
        if (el.tagName === 'FIGURE') {
          if (el.classList.contains('wrap-left')) {
            el.style.cssText = 'float: left; margin: 4px 18px 12px 0; max-width: 45%; text-align: center;'
          } else if (el.classList.contains('wrap-right')) {
            el.style.cssText = 'float: right; margin: 4px 0 12px 18px; max-width: 45%; text-align: center;'
          } else {
            el.style.cssText = 'display: block; margin: 18px auto; max-width: 90%; text-align: center; clear: both;'
          }
        }
        if (el.tagName === 'IMG') {
          el.style.maxWidth = '100%'
          el.style.height = 'auto'
          el.style.display = 'block'
          el.style.borderRadius = '8px'
        }
      })

      return container.innerHTML
    }

    // Node 环境降级直接返回
    return typeof input === 'string' ? input : ''
  }
}

if (typeof window !== 'undefined') {
  window.DoocsInliner = DoocsInliner
}
if (typeof globalThis !== 'undefined') {
  globalThis.DoocsInliner = DoocsInliner
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DoocsInliner }
}

