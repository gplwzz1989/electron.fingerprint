const test = require('node:test')
const assert = require('node:assert/strict')
const { computeTabLayout, layoutAfterClose } = require('../tab-strip-layout')

test('大量标签在各种窗口宽度下不溢出，活动标签始终保留，其他标签可在菜单中访问', () => {
  for (const count of [0, 1, 5, 15, 50, 200]) for (const width of [80, 300, 600, 1000]) {
    const tabs = Array.from({ length: count }, (_, index) => ({ id: `tab-${index}` }))
    for (const active of [null, tabs[0]?.id, tabs.at(-1)?.id]) {
      const result = computeTabLayout(tabs, active, width)
      assert(result.totalWidth <= width + 0.01)
      assert.equal(result.hiddenCount + result.visibleIds.length, count)
      assert(result.visibleIds.every(id => Number.isFinite(result.widths[id]) && result.widths[id] > 0))
      if (active) assert(result.visibleIds.includes(active))
      const indexes = result.visibleIds.map(id => tabs.findIndex(tab => tab.id === id))
      assert.deepEqual(indexes, [...indexes].sort((a, b) => a - b))
    }
  }
})
test('连续关闭保留下一关闭按钮的横坐标，关闭末尾时也不会立即整体扩宽', () => {
  const tabs = Array.from({ length: 6 }, (_, index) => ({ id: `tab-${index}` }))
  const layout = computeTabLayout(tabs, 'tab-2', 600)
  const right = (value, id) => { let x = 0; for (const key of value.visibleIds) { x += value.widths[key]; if (key === id) return x; x += 4 } }
  const middle = layoutAfterClose(tabs, layout, 'tab-2')
  assert.equal(middle.totalWidth, layout.totalWidth)
  assert.equal(right(middle, 'tab-3'), right(layout, 'tab-2'))
  const last = layoutAfterClose(tabs, layout, 'tab-5')
  assert.equal(right(last, 'tab-4'), right(layout, 'tab-5'))
})
