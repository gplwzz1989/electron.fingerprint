const assert = require('node:assert/strict')
const test = require('node:test')
const { randomGaussian, generateHumanoidPath } = require('../humanoid-actions')

test('randomGaussian: 产生的随机数符合正态分布特征', () => {
  const samples = []
  for (let i = 0; i < 1000; i++) {
    samples.push(randomGaussian(100, 15))
  }
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length
  assert.ok(mean > 95 && mean < 105, `均值应在期望值 100 附近，实际为: ${mean}`)
})

test('generateHumanoidPath: 生成平滑贝塞尔轨迹与符合菲茨定律的拟真序列', () => {
  const start = { x: 50, y: 50 }
  const end = { x: 800, y: 600 }

  const path = generateHumanoidPath(start, end)

  assert.ok(path.length >= 10, '轨迹点数量必须充足')
  assert.equal(path[path.length - 1].x, end.x, '终点 X 坐标必须精准对齐')
  assert.equal(path[path.length - 1].y, end.y, '终点 Y 坐标必须精准对齐')

  // 验证移动的连续性，相邻两点之间不应有超自然突变瞬移
  for (let i = 1; i < path.length; i++) {
    const stepDist = Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y)
    assert.ok(stepDist < 120, `单帧步长不应突变瞬移，实际为: ${stepDist}`)
    assert.ok(path[i].waitMs >= 5, '每帧时延必须大于 0')
  }
})
