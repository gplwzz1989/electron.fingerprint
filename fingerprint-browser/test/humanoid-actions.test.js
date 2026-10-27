const assert = require('node:assert/strict')
const test = require('node:test')
const {
  randomGaussian,
  generateHumanoidPath,
  generateHumanoidDragPath,
  humanoidMouseMove,
  humanoidClick,
  humanoidType,
  humanoidDrag,
  humanoidScroll,
  KEY_NEIGHBORS
} = require('../humanoid-actions')

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

test('generateHumanoidDragPath: 滑动验证码轨迹具备起手加速、减速与过冲回弹特征', () => {
  const start = { x: 100, y: 300 }
  const end = { x: 380, y: 300 }

  const dragPath = generateHumanoidDragPath(start, end)
  assert.ok(dragPath.length >= 15, '滑块轨迹点数必须充足')
  assert.equal(dragPath[dragPath.length - 1].x, end.x, '滑块终点 X 必须对齐')
  assert.equal(dragPath[dragPath.length - 1].y, end.y, '滑块终点 Y 必须对齐')

  // 验证 Y 轴存在微幅生理抖动 (不可是绝对水平机械死线)
  const hasYVariance = dragPath.some(p => p.y !== 300)
  assert.ok(hasYVariance, '真实人类滑动滑块必定伴随微幅手颤或握持抖动')
})

test('KEY_NEIGHBORS: 覆盖 QWERTY 键盘常用临近按键', () => {
  assert.ok(KEY_NEIGHBORS.a.includes('s'))
  assert.ok(KEY_NEIGHBORS.w.includes('e'))
  assert.ok(KEY_NEIGHBORS.m.includes('n'))
})

test('humanoidClick & humanoidScroll & humanoidDrag: mock webContents 派发正常', async () => {
  const events = []
  const mockWebContents = {
    sendInputEvent: event => events.push(event)
  }

  // 测试拟人化滚动
  await humanoidScroll(mockWebContents, { deltaY: 200, steps: 5 })
  const wheelEvents = events.filter(e => e.type === 'mouseWheel')
  assert.ok(wheelEvents.length >= 3, '必须派发多帧平滑滚动事件')

  // 测试拟人化点击
  await humanoidClick(mockWebContents, { x: 200, y: 200 })
  assert.ok(events.some(e => e.type === 'mouseDown'))
  assert.ok(events.some(e => e.type === 'mouseUp'))

  // 测试拟人化拖拽
  await humanoidDrag(mockWebContents, { x: 50, y: 100 }, { x: 250, y: 100 })
  const dragMoves = events.filter(e => e.type === 'mouseMove' && e.button === 'left')
  assert.ok(dragMoves.length >= 10, '拖拽过程必须持续派发带左键的 mouseMove')
})

test('动态候选在鼠标移动期间重排时，点击前重新定位目标中心', async () => {
  const events = []
  let reads = 0
  const contents = {
    async executeJavaScript (script) {
      assert.ok(!/dispatchEvent|execCommand|\.click\(/.test(script), '目标定位只能读取页面状态')
      reads += 1
      return { x: reads === 1 ? 10 : 80, y: reads === 1 ? 10 : 80, width: 20, height: 20 }
    },
    sendInputEvent: event => events.push(event)
  }
  await humanoidClick(contents, '[data-testid="TypeaheadUser"]', { recheckTarget: true })
  const down = events.find(event => event.type === 'mouseDown')
  assert.deepEqual({ x: down.x, y: down.y }, { x: 90, y: 90 })
  assert.ok(reads >= 3, '候选移动后必须再次确认位置稳定')
})

test('动态帖子定位回调在按下前重新读取位置，不使用先前滚动坐标', async () => {
  const events=[]
  let reads=0
  await humanoidClick({sendInputEvent:event=>events.push(event)}, {x:1,y:1}, {recheckTarget:true,resolvePoint:async()=>{
    reads+=1
    return reads===1?{x:20,y:20}:{x:70,y:80}
  }})
  const down=events.find(event=>event.type==='mouseDown')
  assert.deepEqual({x:down.x,y:down.y},{x:70,y:80})
  assert.ok(reads>=3)
})
