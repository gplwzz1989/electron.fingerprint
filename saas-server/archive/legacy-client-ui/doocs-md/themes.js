'use strict'

/**
 * Doocs/md 核心主题系统 (微信 Markdown 编辑器)
 * 源码级集成，包含 5 套自媒体与微信生态最高频使用的经典排版主题
 */
const DOOCS_THEMES = {
  default: {
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
  },
  orange: {
    id: 'orange',
    name: '活力自媒体橙',
    primaryColor: '#f97316',
    accentColor: '#ea580c',
    bgColor: '#ffffff',
    textColor: '#1f2937',
    quoteBg: '#fff7ed',
    quoteBorder: '#f97316',
    h1Style: 'display: table; margin: 30px auto 16px; padding: 0 16px; border-bottom: 2px solid #f97316; color: #111827; font-size: 20px; font-weight: bold; text-align: center;',
    h2Style: 'display: table; margin: 36px auto 18px; padding: 3px 12px; background-color: #f97316; color: #ffffff; border-radius: 4px; font-size: 17px; font-weight: bold; text-align: center;',
    h3Style: 'margin: 24px 0 12px; padding-left: 10px; border-left: 3px solid #f97316; color: #111827; font-size: 16px; font-weight: bold; line-height: 1.4;',
    blockquoteStyle: 'margin: 20px 0; padding: 14px 18px; background-color: #fff7ed; border-left: 4px solid #f97316; border-radius: 0 8px 8px 0; color: #9a3412; font-size: 15px; line-height: 1.75;',
    codeBlockStyle: 'background-color: #1c1917; color: #fdba74; border-radius: 8px; padding: 14px 16px; overflow-x: auto; font-family: Menlo, Monaco, Consolas, monospace; font-size: 13px;',
    inlineCodeStyle: 'background-color: #ffedd5; color: #c2410c; padding: 2px 6px; border-radius: 4px; font-size: 85%; font-family: monospace;',
    linkStyle: 'color: #ea580c; text-decoration: underline; text-underline-offset: 3px;'
  },
  blue: {
    id: 'blue',
    name: '极客干货蓝',
    primaryColor: '#2563eb',
    accentColor: '#3b82f6',
    bgColor: '#ffffff',
    textColor: '#1e293b',
    quoteBg: '#eff6ff',
    quoteBorder: '#2563eb',
    h1Style: 'display: table; margin: 30px auto 16px; padding: 0 16px; border-bottom: 2px solid #2563eb; color: #0f172a; font-size: 20px; font-weight: bold; text-align: center;',
    h2Style: 'display: table; margin: 36px auto 18px; padding: 3px 12px; background-color: #2563eb; color: #ffffff; border-radius: 4px; font-size: 17px; font-weight: bold; text-align: center;',
    h3Style: 'margin: 24px 0 12px; padding-left: 10px; border-left: 3px solid #2563eb; color: #0f172a; font-size: 16px; font-weight: bold; line-height: 1.4;',
    blockquoteStyle: 'margin: 20px 0; padding: 14px 18px; background-color: #eff6ff; border-left: 4px solid #2563eb; border-radius: 0 8px 8px 0; color: #1e40af; font-size: 15px; line-height: 1.75;',
    codeBlockStyle: 'background-color: #0f172a; color: #93c5fd; border-radius: 8px; padding: 14px 16px; overflow-x: auto; font-family: Menlo, Monaco, Consolas, monospace; font-size: 13px;',
    inlineCodeStyle: 'background-color: #dbeafe; color: #1d4ed8; padding: 2px 6px; border-radius: 4px; font-size: 85%; font-family: monospace;',
    linkStyle: 'color: #2563eb; text-decoration: underline; text-underline-offset: 3px;'
  },
  purple: {
    id: 'purple',
    name: '优雅深邃紫',
    primaryColor: '#7c3aed',
    accentColor: '#8b5cf6',
    bgColor: '#ffffff',
    textColor: '#2e1065',
    quoteBg: '#faf5ff',
    quoteBorder: '#7c3aed',
    h1Style: 'display: table; margin: 30px auto 16px; padding: 0 16px; border-bottom: 2px solid #7c3aed; color: #3b0764; font-size: 20px; font-weight: bold; text-align: center;',
    h2Style: 'display: table; margin: 36px auto 18px; padding: 3px 12px; background-color: #7c3aed; color: #ffffff; border-radius: 4px; font-size: 17px; font-weight: bold; text-align: center;',
    h3Style: 'margin: 24px 0 12px; padding-left: 10px; border-left: 3px solid #7c3aed; color: #3b0764; font-size: 16px; font-weight: bold; line-height: 1.4;',
    blockquoteStyle: 'margin: 20px 0; padding: 14px 18px; background-color: #faf5ff; border-left: 4px solid #7c3aed; border-radius: 0 8px 8px 0; color: #581c87; font-size: 15px; line-height: 1.75;',
    codeBlockStyle: 'background-color: #1e1b4b; color: #c4b5fd; border-radius: 8px; padding: 14px 16px; overflow-x: auto; font-family: Menlo, Monaco, Consolas, monospace; font-size: 13px;',
    inlineCodeStyle: 'background-color: #f3e8ff; color: #6d28d9; padding: 2px 6px; border-radius: 4px; font-size: 85%; font-family: monospace;',
    linkStyle: 'color: #7c3aed; text-decoration: underline; text-underline-offset: 3px;'
  },
  dark: {
    id: 'dark',
    name: '极简纯粹黑',
    primaryColor: '#18181b',
    accentColor: '#3f3f46',
    bgColor: '#ffffff',
    textColor: '#18181b',
    quoteBg: '#f4f4f5',
    quoteBorder: '#18181b',
    h1Style: 'display: table; margin: 30px auto 16px; padding: 0 16px; border-bottom: 2px solid #18181b; color: #18181b; font-size: 20px; font-weight: bold; text-align: center;',
    h2Style: 'display: table; margin: 36px auto 18px; padding: 3px 12px; background-color: #18181b; color: #ffffff; border-radius: 4px; font-size: 17px; font-weight: bold; text-align: center;',
    h3Style: 'margin: 24px 0 12px; padding-left: 10px; border-left: 3px solid #18181b; color: #18181b; font-size: 16px; font-weight: bold; line-height: 1.4;',
    blockquoteStyle: 'margin: 20px 0; padding: 14px 18px; background-color: #f4f4f5; border-left: 4px solid #18181b; border-radius: 0 8px 8px 0; color: #3f3f46; font-size: 15px; line-height: 1.75;',
    codeBlockStyle: 'background-color: #27272a; color: #e4e4e7; border-radius: 8px; padding: 14px 16px; overflow-x: auto; font-family: Menlo, Monaco, Consolas, monospace; font-size: 13px;',
    inlineCodeStyle: 'background-color: #f4f4f5; color: #18181b; padding: 2px 6px; border-radius: 4px; font-size: 85%; font-family: monospace;',
    linkStyle: 'color: #18181b; text-decoration: underline; text-underline-offset: 3px; font-weight: 500;'
  }
}

if (typeof window !== 'undefined') {
  window.DOOCS_THEMES = DOOCS_THEMES
}
if (typeof globalThis !== 'undefined') {
  globalThis.DOOCS_THEMES = DOOCS_THEMES
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DOOCS_THEMES }
}

