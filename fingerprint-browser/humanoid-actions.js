/**
 * 仿生人类行为驱动引擎 (Humanoid Actions / Mouse Biometrics Engine)
 * 采用菲茨定律 (Fitts' Law) 拟合三次贝塞尔平滑曲线与微震颤模型，
 * 提供逼近真实人类物理键鼠操作的轨迹与事件序列，从根本上消解自动化行为识别 (Automated behavior detected)。
 */

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

/**
 * 高斯随机数生成器 (Box-Muller 变换)
 * @param {number} mean 均值
 * @param {number} stdev 标准差
 */
function randomGaussian (mean = 0, stdev = 1) {
  let u = 1 - Math.random()
  let v = Math.random()
  let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  return z * stdev + mean
}

/**
 * 三次贝塞尔曲线公式: B(t) = (1-t)^3*P0 + 3(1-t)^2*t*P1 + 3(1-t)*t^2*P2 + t^3*P3
 */
function cubicBezier (p0, p1, p2, p3, t) {
  const cx = 3 * (p1.x - p0.x)
  const bx = 3 * (p2.x - p1.x) - cx
  const ax = p3.x - p0.x - cx - bx

  const cy = 3 * (p1.y - p0.y)
  const by = 3 * (p2.y - p1.y) - cy
  const ay = p3.y - p0.y - cy - by

  const tSquared = t * t
  const tCubed = tSquared * t

  return {
    x: (ax * tCubed) + (bx * tSquared) + (cx * t) + p0.x,
    y: (ay * tCubed) + (by * tSquared) + (cy * t) + p0.y
  }
}

/**
 * 生成人类真实物理鼠标轨迹点阵
 * @param {{x: number, y: number}} start 起始点
 * @param {{x: number, y: number}} end 目标终点
 * @param {object} [options]
 * @returns {Array<{x: number, y: number, waitMs: number}>}
 */
function generateHumanoidPath (start, end, options = {}) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const distance = Math.hypot(dx, dy)

  // 根据移动距离动态计算总步数与耗时 (通常 15~40 步)
  const steps = Math.max(12, Math.min(60, Math.floor(distance / 18) + Math.floor(Math.random() * 8)))

  // 计算法向量与主弧度偏移
  const normal = { x: -dy / (distance || 1), y: dx / (distance || 1) }
  const arcDeviation = (Math.random() - 0.45) * Math.min(distance * 0.35, 120)

  // 控制点 1: 出发加速区 (约前 25%~35% 距离)
  const p1 = {
    x: start.x + dx * 0.28 + normal.x * arcDeviation,
    y: start.y + dy * 0.28 + normal.y * arcDeviation
  }

  // 控制点 2: 减速与瞄准区 (约后 65%~80% 距离)
  const p2 = {
    x: start.x + dx * 0.72 + normal.x * (arcDeviation * 0.6),
    y: start.y + dy * 0.72 + normal.y * (arcDeviation * 0.6)
  }

  const path = []
  for (let i = 0; i <= steps; i++) {
    const progress = i / steps
    // 菲茨定律减速缓动: 前半段加速，接近目标显著减速
    const t = Math.sin((progress * Math.PI) / 2)

    const point = cubicBezier(start, p1, p2, end, t)

    // 生理性手部微颤抖动 (终点处衰减为 0)
    const dampening = 1 - Math.pow(progress, 2)
    const jitterX = dampening > 0.1 ? randomGaussian(0, 0.6) * dampening : 0
    const jitterY = dampening > 0.1 ? randomGaussian(0, 0.6) * dampening : 0

    // 每帧时间间隔 (8ms ~ 16ms，高帧率平滑插值)
    const frameInterval = Math.max(7, Math.floor(randomGaussian(12, 2.5)))

    path.push({
      x: Math.round(point.x + jitterX),
      y: Math.round(point.y + jitterY),
      waitMs: frameInterval
    })
  }

  // 保证最终精确落点在目标坐标
  path[path.length - 1].x = end.x
  path[path.length - 1].y = end.y

  return path
}

/**
 * 获取元素视口内拟真落点 (正态分布内聚在中心 70% 椭圆区域，避免机械化永远点几何中心)
 */
async function getHumanoidTargetPoint (webContents, selector) {
  const rect = await webContents.executeJavaScript(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, width: r.width, height: r.height };
  })()`)

  if (!rect || rect.width <= 0 || rect.height <= 0) {
    throw new Error(`未找到目标元素或元素不可见: ${selector}`)
  }

  // 中心点与内聚偏移
  const centerX = rect.x + rect.width / 2
  const centerY = rect.y + rect.height / 2
  const offsetX = randomGaussian(0, rect.width * 0.16)
  const offsetY = randomGaussian(0, rect.height * 0.16)

  const finalX = Math.round(Math.max(rect.x + 3, Math.min(rect.x + rect.width - 3, centerX + offsetX)))
  const finalY = Math.round(Math.max(rect.y + 3, Math.min(rect.y + rect.height - 3, centerY + offsetY)))

  return { x: finalX, y: finalY }
}

let lastMousePosition = { x: 100, y: 100 }

/**
 * 仿生人类平滑移动鼠标
 */
async function humanoidMouseMove (webContents, targetPoint) {
  const start = { ...lastMousePosition }
  const path = generateHumanoidPath(start, targetPoint)

  for (const p of path) {
    webContents.sendInputEvent({
      type: 'mouseMove',
      x: p.x,
      y: p.y
    })
    lastMousePosition = { x: p.x, y: p.y }
    await wait(p.waitMs)
  }
}

/**
 * 仿生人类点击 (平滑移动 -> 悬停视线对齐 -> 物理按压停留 -> 释放)
 */
async function humanoidClick (webContents, selectorOrPoint, options = {}) {
  let targetPoint
  if (typeof selectorOrPoint === 'string') {
    targetPoint = await getHumanoidTargetPoint(webContents, selectorOrPoint)
  } else {
    targetPoint = selectorOrPoint
  }

  // 1. 平滑移动光标到目标点
  await humanoidMouseMove(webContents, targetPoint)

  // 2. 悬停思考与对齐时延 (30ms ~ 90ms)
  await wait(Math.max(25, Math.floor(randomGaussian(50, 15))))

  // 3. 派发 mousedown
  webContents.sendInputEvent({
    type: 'mouseDown',
    x: targetPoint.x,
    y: targetPoint.y,
    button: 'left',
    clickCount: 1
  })

  // 4. 人类物理手指微按压停留时长 (Dwell Time，高斯均值 85ms，标准差 18ms)
  const dwellTime = Math.max(45, Math.min(160, Math.floor(randomGaussian(85, 18))))
  await wait(dwellTime)

  // 5. 派发 mouseUp 完成真实点击
  webContents.sendInputEvent({
    type: 'mouseUp',
    x: targetPoint.x,
    y: targetPoint.y,
    button: 'left',
    clickCount: 1
  })

  // 6. 点击后生理反应短暂停顿 (40ms ~ 120ms)
  await wait(Math.max(30, Math.floor(randomGaussian(70, 20))))
}

const KEY_NEIGHBORS = {
  a: ['q', 'w', 's', 'z'],
  b: ['v', 'g', 'h', 'n'],
  c: ['x', 'd', 'f', 'v'],
  d: ['s', 'e', 'r', 'f', 'c', 'x'],
  e: ['w', 'r', 'd', 's'],
  f: ['d', 'r', 't', 'g', 'v', 'c'],
  g: ['f', 't', 'y', 'h', 'b', 'v'],
  h: ['g', 'y', 'u', 'j', 'n', 'b'],
  i: ['u', 'o', 'k', 'j'],
  j: ['h', 'u', 'i', 'k', 'm', 'n'],
  k: ['j', 'i', 'o', 'l', 'm'],
  l: ['k', 'o', 'p'],
  m: ['n', 'j', 'k'],
  n: ['b', 'h', 'j', 'm'],
  o: ['i', 'p', 'l', 'k'],
  p: ['o', 'l'],
  q: ['w', 'a', 's'],
  r: ['e', 't', 'f', 'd'],
  s: ['a', 'w', 'e', 'd', 'x', 'z'],
  t: ['r', 'y', 'g', 'f'],
  u: ['y', 'i', 'j', 'h'],
  v: ['c', 'f', 'g', 'b'],
  w: ['q', 'e', 's', 'a'],
  x: ['z', 's', 'd', 'c'],
  y: ['t', 'u', 'h', 'g'],
  z: ['a', 's', 'x']
}

/**
 * 仿生人类键盘打字输入 (带生理性打字节奏、错字回退纠错与按键微颤时延)
 * @param {object} webContents Electron WebContents 实例
 * @param {string} text 目标输入文本
 * @param {object} [options] 配置选项 (typoRate: 错字率, baseInterval: 基础间隔)
 */
async function humanoidType (webContents, text, options = {}) {
  const typoRate = typeof options.typoRate === 'number' ? options.typoRate : 0.03
  const baseInterval = typeof options.baseInterval === 'number' ? options.baseInterval : 75

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const lower = char.toLowerCase()
    const neighbors = KEY_NEIGHBORS[lower]

    // 模拟人类拼写手误与自纠错 (仅针对字母且触发概率)
    if (neighbors && neighbors.length > 0 && Math.random() < typoRate) {
      const wrongChar = neighbors[Math.floor(Math.random() * neighbors.length)]
      const actualWrong = char === char.toUpperCase() ? wrongChar.toUpperCase() : wrongChar

      // 打出错误字符
      webContents.sendInputEvent({ type: 'keyDown', keyCode: actualWrong })
      webContents.sendInputEvent({ type: 'char', keyCode: actualWrong })
      await wait(Math.max(20, Math.floor(randomGaussian(40, 10))))
      webContents.sendInputEvent({ type: 'keyUp', keyCode: actualWrong })

      // 视觉发现错误思考停顿 (100ms ~ 250ms)
      await wait(Math.max(80, Math.floor(randomGaussian(160, 35))))

      // 派发 Backspace 退格删除
      webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Backspace' })
      webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Backspace' })

      // 删除后短暂停顿再输入正确字符
      await wait(Math.max(50, Math.floor(randomGaussian(90, 20))))
    }

    // 正常输入目标字符
    webContents.sendInputEvent({
      type: 'keyDown',
      keyCode: char
    })
    webContents.sendInputEvent({
      type: 'char',
      keyCode: char
    })

    // 真实手指物理按压时长 Dwell Time (20ms ~ 50ms)
    const dwellTime = Math.max(18, Math.min(65, Math.floor(randomGaussian(32, 8))))
    await wait(dwellTime)

    webContents.sendInputEvent({
      type: 'keyUp',
      keyCode: char
    })

    // 按键间隔 (均值 baseInterval ms，偶有微长停顿模拟人类打字思考)
    let keyInterval = Math.max(30, Math.floor(randomGaussian(baseInterval, 20)))
    if (char === ' ' || char === ',' || char === '.' || char === '\n') {
      keyInterval += Math.floor(Math.random() * 90) // 标点与换行思考时延
    }
    await wait(keyInterval)
  }
}

/**
 * 生成滑动验证码/滑块拖拽的生物学轨迹
 * 包含：初始瞄准静止 -> 启动加速 -> 匀速滑行 -> 接近减速 -> 末端过冲 (Overshoot 2~6px) -> 微调回拉 -> 释放
 */
function generateHumanoidDragPath (start, end, options = {}) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const distance = Math.hypot(dx, dy)
  const steps = Math.max(16, Math.min(50, Math.floor(distance / 8)))

  const path = []
  // 模拟真实人类滑动滑块时的过冲量 (2 到 6 像素)
  const overshootDistance = Math.min(distance * 0.05, 5 + Math.random() * 3)

  for (let i = 0; i <= steps; i++) {
    const progress = i / steps
    // 缓动曲线：前 80% 加速滑行，后 20% 减速并带有微过冲
    let factor
    if (progress < 0.8) {
      factor = Math.sin((progress / 0.8) * (Math.PI / 2)) * 0.95
    } else {
      const subProg = (progress - 0.8) / 0.2
      // 过冲后微回弹到 1.0
      factor = 0.95 + (1 + overshootDistance / (distance || 1) - 0.95) * Math.sin(subProg * Math.PI)
      if (progress === 1) factor = 1.0
    }

    // Y 轴微抖动 (物理手腕握持鼠标或触控板无法绝对走直线，带 ±1~2px 波动)
    const jitterY = randomGaussian(0, 0.8) * (1 - Math.abs(progress - 0.5) * 1.5)

    path.push({
      x: Math.round(start.x + dx * factor),
      y: Math.round(start.y + dy * factor + jitterY),
      waitMs: Math.max(6, Math.floor(randomGaussian(11, 2.5)))
    })
  }

  // 终点修正
  path[path.length - 1].x = end.x
  path[path.length - 1].y = end.y
  return path
}

/**
 * 仿生滑块拖拽 (专为破局极验/滑块验证码等行为风控设计)
 */
async function humanoidDrag (webContents, start, end, options = {}) {
  const startPoint = typeof start === 'string' ? await getHumanoidTargetPoint(webContents, start) : start
  const endPoint = typeof end === 'string' ? await getHumanoidTargetPoint(webContents, end) : end

  // 1. 移动到滑块起始位置
  await humanoidMouseMove(webContents, startPoint)
  await wait(Math.max(40, Math.floor(randomGaussian(80, 20))))

  // 2. 按下滑块
  webContents.sendInputEvent({
    type: 'mouseDown',
    x: startPoint.x,
    y: startPoint.y,
    button: 'left',
    clickCount: 1
  })
  await wait(Math.max(50, Math.floor(randomGaussian(100, 25))))

  // 3. 沿物理轨迹拖拽滑块
  const dragPath = generateHumanoidDragPath(startPoint, endPoint, options)
  for (const p of dragPath) {
    webContents.sendInputEvent({
      type: 'mouseMove',
      x: p.x,
      y: p.y,
      button: 'left'
    })
    lastMousePosition = { x: p.x, y: p.y }
    await wait(p.waitMs)
  }

  // 4. 到达终点后的确认停顿 (40ms ~ 120ms)
  await wait(Math.max(40, Math.floor(randomGaussian(80, 20))))

  // 5. 释放鼠标
  webContents.sendInputEvent({
    type: 'mouseUp',
    x: endPoint.x,
    y: endPoint.y,
    button: 'left',
    clickCount: 1
  })

  // 6. 操作完成后生理反应停顿
  await wait(Math.max(50, Math.floor(randomGaussian(100, 30))))
}

/**
 * 仿生非线性惯性滚动 (带初速度、阻尼衰减与微回弹)
 */
async function humanoidScroll (webContents, options = {}) {
  const {
    x = lastMousePosition.x,
    y = lastMousePosition.y,
    deltaY = 300,
    deltaX = 0,
    direction = 'down'
  } = options

  const effectiveDeltaY = direction === 'up' ? -Math.abs(deltaY) : Math.abs(deltaY)
  const steps = Math.max(8, Math.min(25, Math.floor(Math.abs(effectiveDeltaY) / 20)))

  // 采用三次缓出曲线 (easeOutCubic) 将总位移分配至各步
  let accumulated = 0
  for (let step = 1; step <= steps; step++) {
    const t = step / steps
    // easeOutCubic: 1 - Math.pow(1 - t, 3)
    const factor = 1 - Math.pow(1 - t, 3)
    const currentTarget = effectiveDeltaY * factor
    const stepDelta = Math.round(currentTarget - accumulated)
    accumulated += stepDelta

    if (stepDelta !== 0) {
      webContents.sendInputEvent({
        type: 'mouseWheel',
        x,
        y,
        deltaX: deltaX !== 0 ? Math.round(deltaX / steps) : 0,
        deltaY: -stepDelta, // Chromium mouseWheel delta 正负方向与屏幕滚动方向对齐
        canScroll: true
      })
    }

    // 滚动间隔 (10ms ~ 22ms)
    await wait(Math.max(9, Math.floor(randomGaussian(14, 3))))
  }
}

module.exports = {
  randomGaussian,
  generateHumanoidPath,
  generateHumanoidDragPath,
  humanoidMouseMove,
  humanoidClick,
  humanoidType,
  humanoidDrag,
  humanoidScroll,
  getHumanoidTargetPoint,
  KEY_NEIGHBORS
}
