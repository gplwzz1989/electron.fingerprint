;(function (root) {
  'use strict'
  // 标签不横向滚动：先缩窄，达到图标宽度后将多余标签收纳到全部标签菜单。
  function computeTabLayout (tabs, activeId, availableWidth) {
    const available = Math.max(0, availableWidth)
    if (!tabs.length || !available) return { visibleIds: [], widths: {}, totalWidth: 0, hiddenCount: tabs.length }
    const gap = 4; const minimum = 34; const activeMinimum = Math.min(76, available)
    const activeIndex = tabs.findIndex(tab => tab.id === activeId)
    const capacity = Math.max(1, Math.floor((available + gap - (activeIndex >= 0 ? activeMinimum - minimum : 0)) / (minimum + gap)))
    const indexes = Array.from({ length: Math.min(tabs.length, capacity) }, (_, index) => index)
    if (activeIndex >= indexes.length) indexes[indexes.length - 1] = activeIndex
    const visible = indexes.map(index => tabs[index]); const count = visible.length
    const space = Math.max(0, available - gap * (count - 1)); const uniform = Math.min(230, space / count)
    const widths = {}
    for (const tab of visible) widths[tab.id] = activeIndex >= 0 && uniform < activeMinimum ? tab.id === activeId ? activeMinimum : (space - activeMinimum) / Math.max(1, count - 1) : uniform
    return { visibleIds: visible.map(tab => tab.id), widths, totalWidth: visible.reduce((sum, tab) => sum + widths[tab.id], 0) + gap * (count - 1), hiddenCount: tabs.length - count }
  }
  function layoutAfterClose (tabs, layout, closedId) {
    const visibleIds = layout.visibleIds.filter(id => id !== closedId); const widths = { ...layout.widths }
    const closedIndex = tabs.findIndex(tab => tab.id === closedId); const width = widths[closedId]
    if (width !== undefined) {
      const next = tabs[closedIndex + 1]?.id
      if (next) { if (!visibleIds.includes(next)) visibleIds.splice(Math.min(layout.visibleIds.indexOf(closedId), visibleIds.length), 0, next); widths[next] = width }
      else if (visibleIds.length) widths[visibleIds.at(-1)] += width + 4
      delete widths[closedId]
    }
    return { visibleIds, widths, totalWidth: layout.totalWidth, hiddenCount: Math.max(0, tabs.length - 1 - visibleIds.length) }
  }
  const api = { computeTabLayout, layoutAfterClose }
  if (typeof module === 'object' && module.exports) module.exports = api
  else root.QijieTabStripLayout = api
})(typeof window === 'object' ? window : globalThis)
