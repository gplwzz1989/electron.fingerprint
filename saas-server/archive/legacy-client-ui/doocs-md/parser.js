'use strict'

let _themes = null
if (typeof DOOCS_THEMES !== 'undefined') {
  _themes = DOOCS_THEMES
} else if (typeof globalThis !== 'undefined' && globalThis.DOOCS_THEMES) {
  _themes = globalThis.DOOCS_THEMES
} else if (typeof window !== 'undefined' && window.DOOCS_THEMES) {
  _themes = window.DOOCS_THEMES
} else if (typeof require !== 'undefined') {
  try {
    _themes = require('./themes').DOOCS_THEMES
  } catch (_) {}
}

const DEFAULT_THEME_FALLBACK = {
  id: 'default',
  name: '经典微信绿',
  primaryColor: '#07c160',
  accentColor: '#10b981',
  bgColor: '#ffffff',
  textColor: '#2d3748',
  quoteBg: '#f7f9fa',
  quoteBorder: '#07c160',
  h1Style: 'display: table; margin: 30px auto 16px; padding: 0 16px; border-bottom: 2px solid #07c160; color: #111827; font-size: 20px; font-weight: bold; text-align: center;',
  h2Style: 'display: table; margin: 36px auto 18px; padding: 3px 12px; background-color: #07c160; color: #ffffff; border-radius: 4px; font-size: 17px; font-weight: bold; text-align: center;',
  h3Style: 'margin: 24px 0 12px; padding-left: 10px; border-left: 3px solid #07c160; color: #1f2937; font-size: 16px; font-weight: bold; line-height: 1.4;',
  blockquoteStyle: 'margin: 20px 0; padding: 14px 18px; background-color: #f7f9fa; border-left: 4px solid #07c160; border-radius: 0 8px 8px 0; color: #4b5563; font-size: 15px; line-height: 1.75;',
  codeBlockStyle: 'background-color: #1e293b; color: #e2e8f0; border-radius: 8px; padding: 14px 16px; overflow-x: auto; font-family: Menlo, Monaco, Consolas, monospace; font-size: 13px; line-height: 1.6;',
  inlineCodeStyle: 'background-color: #f1f5f9; color: #07c160; padding: 2px 6px; border-radius: 4px; font-size: 85%; font-family: monospace;',
  linkStyle: 'color: #07c160; text-decoration: underline; text-underline-offset: 3px;'
}

/**
 * Doocs/md 核心 Markdown 解析渲染引擎
 * 针对微信公众号排版进行了深度定制与内联样式编译，原生支持图文混合环绕
 */
class DoocsParser {
  /**
   * @param {Object} [options]
   * @param {string} [options.themeId] - 'default' | 'orange' | 'blue' | 'purple' | 'dark'
   * @param {string} [options.fontSize] - '14px' | '15px' | '16px' | '17px'
   * @param {number} [options.lineHeight] - 1.75
   */
  constructor (options = {}) {
    this.themeId = options.themeId || 'default'
    this.fontSize = options.fontSize || '16px'
    this.lineHeight = options.lineHeight || 1.8
    const themes = _themes || (typeof DOOCS_THEMES !== 'undefined' ? DOOCS_THEMES : null)
    this.theme = (themes && themes[this.themeId]) ? themes[this.themeId] : DEFAULT_THEME_FALLBACK
  }

  setTheme (themeId) {
    const themes = _themes || (typeof DOOCS_THEMES !== 'undefined' ? DOOCS_THEMES : null)
    if (themes && themes[themeId]) {
      this.themeId = themeId
      this.theme = themes[themeId]
    }
  }

  setFontSize (size) {
    this.fontSize = size || '16px'
  }

  /**
   * 主解析编译方法：将 Markdown 转换为携带微信规范 Inline CSS 的 HTML
   * @param {string} markdown
   * @returns {string}
   */
  render (markdown = '') {
    if (!markdown || typeof markdown !== 'string') return ''

    const lines = markdown.replace(/\r\n/g, '\n').split('\n')
    const htmlChunks = []
    let inCodeBlock = false
    let codeBlockLang = ''
    let codeBlockLines = []
    let inList = false
    let listType = '' // 'ul' | 'ol'
    let inBlockquote = false
    let blockquoteLines = []
    let inTable = false
    let tableRows = []

    const flushList = () => {
      if (inList) {
        htmlChunks.push(`</${listType}>`)
        inList = false
        listType = ''
      }
    }

    const flushBlockquote = () => {
      if (inBlockquote) {
        const text = blockquoteLines.join('<br/>')
        htmlChunks.push(
          `<blockquote style="margin: 20px 0; padding: 14px 18px; background-color: ${this.theme.quoteBg}; border-left: 4px solid ${this.theme.quoteBorder}; border-radius: 0 8px 8px 0; color: #4b5563; font-size: 15px; line-height: 1.75; font-style: normal;">${text}</blockquote>`
        )
        inBlockquote = false
        blockquoteLines = []
      }
    }

    const flushTable = () => {
      if (inTable && tableRows.length > 0) {
        htmlChunks.push(this.renderTable(tableRows))
        inTable = false
        tableRows = []
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()

      // 1. 代码块处理 (```)
      if (trimmed.startsWith('```')) {
        if (!inCodeBlock) {
          flushList()
          flushBlockquote()
          flushTable()
          inCodeBlock = true
          codeBlockLang = trimmed.slice(3).trim() || 'plaintext'
          codeBlockLines = []
          continue
        } else {
          inCodeBlock = false
          htmlChunks.push(this.renderCodeBlock(codeBlockLines.join('\n'), codeBlockLang))
          codeBlockLines = []
          continue
        }
      }

      if (inCodeBlock) {
        codeBlockLines.push(line)
        continue
      }

      // 2. 表格行处理 (| a | b |)
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        flushList()
        flushBlockquote()
        inTable = true
        tableRows.push(trimmed)
        continue
      } else {
        flushTable()
      }

      // 3. 引用块 (>)
      if (trimmed.startsWith('>')) {
        flushList()
        inBlockquote = true
        blockquoteLines.push(this.renderInline(trimmed.replace(/^>\s*/, '')))
        continue
      } else {
        flushBlockquote()
      }

      // 4. 空行处理
      if (!trimmed) {
        flushList()
        continue
      }

      // 5. 标题处理 (# ~ ######)
      const hMatch = trimmed.match(/^(#{1,6})\s+(.*)$/)
      if (hMatch) {
        flushList()
        const level = hMatch[1].length
        const titleText = this.renderInline(hMatch[2])
        htmlChunks.push(this.renderHeading(level, titleText))
        continue
      }

      // 6. 分割线 (--- / ***)
      if (/^([-*_]){3,}$/.test(trimmed)) {
        flushList()
        htmlChunks.push(
          `<hr style="border: none; border-top: 1px dashed #d1d5db; margin: 30px auto; width: 90%;" />`
        )
        continue
      }

      // 7. 独立图片行 (支持图文混合环绕指令)
      const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/)
      if (imgMatch) {
        flushList()
        htmlChunks.push(this.renderImageFigure(imgMatch[1], imgMatch[2]))
        continue
      }

      // 8. 列表处理 (* / - / 1.)
      const ulMatch = trimmed.match(/^[-*+]\s+(.*)$/)
      if (ulMatch) {
        if (!inList || listType !== 'ul') {
          flushList()
          inList = true
          listType = 'ul'
          htmlChunks.push(`<ul style="margin: 16px 0 16px 20px; padding: 0; line-height: 1.8; color: ${this.theme.textColor}; font-size: ${this.fontSize};">`)
        }
        htmlChunks.push(`<li style="margin: 6px 0;">${this.renderInline(ulMatch[1])}</li>`)
        continue
      }

      const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/)
      if (olMatch) {
        if (!inList || listType !== 'ol') {
          flushList()
          inList = true
          listType = 'ol'
          htmlChunks.push(`<ol style="margin: 16px 0 16px 20px; padding: 0; line-height: 1.8; color: ${this.theme.textColor}; font-size: ${this.fontSize};">`)
        }
        htmlChunks.push(`<li style="margin: 6px 0;">${this.renderInline(olMatch[2])}</li>`)
        continue
      }

      // 9. 普通段落 (自动嵌入段内图片与文本混排)
      flushList()
      htmlChunks.push(
        `<p style="margin: 16px 0; font-size: ${this.fontSize}; line-height: ${this.lineHeight}; color: ${this.theme.textColor}; letter-spacing: 0.5px; text-align: justify; word-break: break-word;">${this.renderInline(trimmed)}</p>`
      )
    }

    flushList()
    flushBlockquote()
    flushTable()

    // 封装最外层 WeChat 容器
    return `
<section class="doocs-wechat-wrapper" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; font-size: ${this.fontSize}; line-height: ${this.lineHeight}; color: ${this.theme.textColor}; background-color: #ffffff; padding: 10px; max-width: 100%;">
  ${htmlChunks.join('\n')}
</section>
    `.trim()
  }

  /**
   * 标题编译 (微信公众号风格)
   */
  renderHeading (level, text) {
    if (level === 1) {
      return `<h1 style="${this.theme.h1Style}">${text}</h1>`
    }
    if (level === 2) {
      return `<h2 style="${this.theme.h2Style}">${text}</h2>`
    }
    if (level === 3) {
      return `<h3 style="${this.theme.h3Style}">${text}</h3>`
    }
    return `<h${level} style="margin: 18px 0 10px; font-size: ${this.fontSize}; font-weight: bold; color: ${this.theme.primaryColor};">${text}</h${level}>`
  }

  /**
   * 核心图文混合环绕编译 (支持 #left, #right, #center, |left, |right)
   */
  renderImageFigure (altText, urlString) {
    let wrap = 'center'
    let url = urlString.trim()
    let caption = altText || ''

    // 探测图注与环绕指令：url#left 或 alt|left
    if (url.includes('#left') || altText.includes('|left')) {
      wrap = 'left'
      url = url.replace('#left', '')
      caption = caption.replace('|left', '').trim()
    } else if (url.includes('#right') || altText.includes('|right')) {
      wrap = 'right'
      url = url.replace('#right', '')
      caption = caption.replace('|right', '').trim()
    } else if (url.includes('#center') || altText.includes('|center')) {
      wrap = 'center'
      url = url.replace('#center', '')
      caption = caption.replace('|center', '').trim()
    }

    // 微信公众号杂志级图文环绕样式定义
    let figureStyle = 'display: block; margin: 18px auto; max-width: 90%; text-align: center;'
    if (wrap === 'left') {
      figureStyle = 'float: left; margin: 4px 18px 12px 0; max-width: 45%; text-align: center;'
    } else if (wrap === 'right') {
      figureStyle = 'float: right; margin: 4px 0 12px 18px; max-width: 45%; text-align: center;'
    }

    return `
<figure class="wrap-${wrap}" style="${figureStyle}">
  <img src="${url}" style="width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); display: block;" alt="${caption}" />
  ${caption ? `<figcaption style="font-size: 12px; color: #9ca3af; margin-top: 6px; font-style: italic;">图：${caption}</figcaption>` : ''}
</figure>
    `.trim()
  }

  /**
   * 代码块编译 (带 Mac 三色圆点控制台外壳)
   */
  renderCodeBlock (code, lang) {
    const escaped = this.escapeHtml(code)
    const macDotsSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="45px" height="13px" viewBox="0 0 450 130"><ellipse cx="50" cy="65" rx="50" ry="52" fill="#ed6c60"/><ellipse cx="225" cy="65" rx="50" ry="52" fill="#f7c151"/><ellipse cx="400" cy="65" rx="50" ry="52" fill="#64c856"/></svg>`

    return `
<section style="margin: 20px 0; background-color: #1e293b; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.12);">
  <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 14px; background-color: #0f172a; border-bottom: 1px solid #334155;">
    <span>${macDotsSvg}</span>
    <span style="font-size: 11px; color: #94a3b8; font-family: monospace; text-transform: uppercase;">${(lang || 'CODE').toUpperCase()}</span>
  </div>
  <pre style="margin: 0; padding: 14px 16px; overflow-x: auto; color: #f8fafc; font-size: 13px; line-height: 1.6; font-family: Menlo, Monaco, Consolas, monospace;"><code>${escaped}</code></pre>
</section>
    `.trim()
  }

  /**
   * 表格编译
   */
  renderTable (rows) {
    if (rows.length < 2) return ''
    const parseRow = r => r.split('|').map(c => c.trim()).filter((_, idx, arr) => idx !== 0 && idx !== arr.length - 1)
    const headerCols = parseRow(rows[0])
    const bodyRows = rows.slice(2).map(parseRow)

    const ths = headerCols.map(h => `<th style="border: 1px solid #e2e8f0; background-color: #f8fafc; color: #1e293b; padding: 8px 14px; font-weight: bold; text-align: left;">${this.renderInline(h)}</th>`).join('')
    const trs = bodyRows.map((r, rIdx) => {
      const bg = rIdx % 2 === 0 ? '#ffffff' : '#fcfcfd'
      const tds = r.map(c => `<td style="border: 1px solid #e2e8f0; padding: 8px 14px; color: #475569;">${this.renderInline(c)}</td>`).join('')
      return `<tr style="background-color: ${bg};">${tds}</tr>`
    }).join('')

    return `
<div style="margin: 20px 0; overflow-x: auto;">
  <table style="width: 100%; border-collapse: collapse; font-size: 14px; line-height: 1.6; border: 1px solid #e2e8f0; border-radius: 6px;">
    <thead><tr>${ths}</tr></thead>
    <tbody>${trs}</tbody>
  </table>
</div>
    `.trim()
  }

  /**
   * 行内 Markdown 解析 (粗体、斜体、删除线、行内代码、行内图片、超链接)
   */
  renderInline (text = '') {
    let out = text

    // 行内图片 (支持图文环绕标记)
    out = out.replace(/!\[(.*?)\]\((.*?)\)/g, (_, alt, url) => {
      return this.renderImageFigure(alt, url)
    })

    // 粗体 (**text** or __text__)
    out = out.replace(/\*\*(.*?)\*\*/g, `<strong style="color: ${this.theme.primaryColor}; font-weight: bold;">$1</strong>`)
    out = out.replace(/__(.*?)__/g, `<strong style="color: ${this.theme.primaryColor}; font-weight: bold;">$1</strong>`)

    // 斜体 (*text* or _text_)
    out = out.replace(/\*(.*?)\*/g, `<em>$1</em>`)

    // 删除线 (~~text~~)
    out = out.replace(/~~(.*?)~~/g, `<del style="color: #94a3b8;">$1</del>`)

    // 行内代码 (`code`)
    out = out.replace(/`([^`]+)`/g, `<code style="${this.theme.inlineCodeStyle}">$1</code>`)

    // 链接 [text](href)
    out = out.replace(/\[(.*?)\]\((.*?)\)/g, `<a href="$2" style="${this.theme.linkStyle}" target="_blank">$1</a>`)

    return out
  }

  escapeHtml (str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }
}

if (typeof window !== 'undefined') {
  window.DoocsParser = DoocsParser
}
if (typeof globalThis !== 'undefined') {
  globalThis.DoocsParser = DoocsParser
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DoocsParser }
}

