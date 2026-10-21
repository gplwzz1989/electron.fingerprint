const crypto = require('crypto');

// 1. 模拟 PixelScan 的 14 种纯色块测试 (canvasNoiseOn2d)
function simulatePixelScanCanvasNoiseOn2d(noiseFn) {
  const o = [
    [255, 0, 0],
    [0, 255, 0],
    [0, 0, 255],
    [255, 255, 0],
    [255, 0, 255],
    [0, 255, 255],
    [1, 1, 1],
    [254, 254, 254],
    [0, 0, 0],
    [51, 51, 51],
    [102, 102, 102],
    [153, 153, 153],
    [204, 204, 204],
    [255, 255, 255]
  ];

  const n = 5;
  const t = 5;
  const width = n * o.length; // 70
  const height = t; // 5

  // 创建 70x5 像素缓冲区 (RGBA)
  const pixels = new Uint8Array(width * height * 4);
  for (let blockIdx = 0; blockIdx < o.length; blockIdx++) {
    const color = o[blockIdx];
    const startX = blockIdx * n;
    const endX = (blockIdx + 1) * n;
    for (let y = 0; y < height; y++) {
      for (let x = startX; x < endX; x++) {
        const offset = (y * width + x) * 4;
        pixels[offset] = color[0];
        pixels[offset + 1] = color[1];
        pixels[offset + 2] = color[2];
        pixels[offset + 3] = 255;
      }
    }
  }

  // 原始备份
  const originalPixels = new Uint8Array(pixels);

  // 应用加噪函数
  noiseFn(pixels, width, height);

  // PixelScan 校验：逐个色块检查每一个像素是否精确等于原色
  let allBlocksPassed = true;
  for (let blockIdx = 0; blockIdx < o.length; blockIdx++) {
    const color = o[blockIdx];
    const startX = blockIdx * n;
    const endX = (blockIdx + 1) * n;
    let blockMatches = 0;
    for (let y = 0; y < height; y++) {
      for (let x = startX; x < endX; x++) {
        const offset = (y * width + x) * 4;
        if (
          pixels[offset] === color[0] &&
          pixels[offset + 1] === color[1] &&
          pixels[offset + 2] === color[2] &&
          pixels[offset + 3] === 255
        ) {
          blockMatches++;
        }
      }
    }
    const expected = n * t; // 25
    if (blockMatches !== expected) {
      allBlocksPassed = false;
      console.log(`  ❌ 色块 ${blockIdx} (${color.join(',')}) 校验失败! 匹配像素: ${blockMatches}/${expected}`);
    }
  }

  return allBlocksPassed;
}

// 2. 模拟 PixelScan 的 WebGL 红色纯色矩形测试 (getFixedRedBoxHash)
function simulatePixelScanWebGLRedBox(noiseFn) {
  const width = 256;
  const height = 24;
  const pixels = new Uint8Array(width * height * 4);

  // 纯红实心矩形 vec4(255, 0, 0, 1)
  for (let i = 0; i < width * height; i++) {
    pixels[i * 4] = 255;
    pixels[i * 4 + 1] = 0;
    pixels[i * 4 + 2] = 0;
    pixels[i * 4 + 3] = 255;
  }

  // 原生标准哈希 (SHA-256)
  const originalHash = crypto.createHash('sha256').update(pixels).digest('hex');

  // 应用加噪
  noiseFn(pixels, width, height);

  const finalHash = crypto.createHash('sha256').update(pixels).digest('hex');
  // 核心断言：纯红平坦矩形读出的像素在加噪前后必须绝对一致 (0 扰动，哈希完全匹配)
  const passed = finalHash === originalHash;
  return { passed, originalHash, finalHash };
}

// 3. 模拟真实指纹测试（绘制带文字抗锯齿的图像）
function simulateRealFingerprintNoise(noiseFn) {
  const width = 300;
  const height = 150;
  const pixels = new Uint8Array(width * height * 4);
  pixels.fill(255); // 白色背景

  // 模拟文字笔画：中间有一条带抗锯齿渐变斜率的笔画
  // 背景(255,255,255) -> 抗锯齿(180) -> 抗锯齿(80) -> 文字中心(0,0,0)
  for (let y = 40; y < 100; y++) {
    for (let x = 50; x < 250; x++) {
      const offset = (y * width + x) * 4;
      const distFromCenter = Math.abs(x - 150);
      if (distFromCenter < 1) {
        pixels[offset] = 0; pixels[offset + 1] = 0; pixels[offset + 2] = 0; // 中心
      } else if (distFromCenter < 3) {
        pixels[offset] = 80; pixels[offset + 1] = 80; pixels[offset + 2] = 80; // 抗锯齿深过渡
      } else if (distFromCenter < 5) {
        pixels[offset] = 180; pixels[offset + 1] = 180; pixels[offset + 2] = 180; // 抗锯齿浅过渡
      }
    }
  }

  const rawHash = crypto.createHash('sha256').update(pixels).digest('hex');
  noiseFn(pixels, width, height);
  const noisedHash = crypto.createHash('sha256').update(pixels).digest('hex');

  return { isDifferent: rawHash !== noisedHash, rawHash, noisedHash };
}

// -------------------------------------------------------------
// 对照组 A：现有旧算法 (Old EdgeAware)
// -------------------------------------------------------------
function oldEdgeAwareNoise(pixels, width, height) {
  const row_size = width * 4;
  const copy = new Uint8Array(pixels);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * row_size + x * 4;
      if (copy[idx + 3] === 0) continue;

      let h_grad = 0;
      let v_grad = 0;
      for (let ch = 0; ch < 3; ch++) {
        h_grad += Math.abs(copy[idx - 4 + ch] - copy[idx + 4 + ch]);
        v_grad += Math.abs(copy[idx - row_size + ch] - copy[idx + row_size + ch]);
      }
      if (h_grad + v_grad < 6) continue;

      // 扰动 ±1
      const delta = 1;
      for (let ch = 0; ch < 3; ch++) {
        pixels[idx + ch] = Math.min(255, Math.max(0, copy[idx + ch] + delta));
      }
    }
  }
}

// -------------------------------------------------------------
// 实验组 B：新优化算法 (Optimized Antialiasing-Aware Natural Noise)
// -------------------------------------------------------------
function newOptimizedNoise(pixels, width, height) {
  // 1. 探针尺寸保护：高度 < 16 或总面积 < 512 的探针画布绝对不加噪
  if (width < 16 || height < 16 || (width * height) < 512) {
    return;
  }

  const row_size = width * 4;
  const copy = new Uint8Array(pixels);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * row_size + x * 4;
      if (copy[idx + 3] === 0) continue;

      // 2. 单色块内部与硬阶跃硬直边界保护：
      // 检查当前像素与 4 邻域邻居的同色性
      let sameColorNeighbors = 0;
      const neighbors = [
        idx - 4,        // 左
        idx + 4,        // 右
        idx - row_size, // 上
        idx + row_size  // 下
      ];

      for (const nIdx of neighbors) {
        let diff = 0;
        for (let ch = 0; ch < 3; ch++) {
          diff += Math.abs(copy[idx + ch] - copy[nIdx + ch]);
        }
        if (diff === 0) {
          sameColorNeighbors++;
        }
      }

      // 如果周围有 >= 2 个同色邻居，说明处于单色块内部或纯色块拼合边缘，保持 0 扰动
      if (sameColorNeighbors >= 2) {
        continue;
      }

      // 3. 梯度阈值：必须处于平滑抗锯齿渐变带
      let h_grad = 0;
      let v_grad = 0;
      for (let ch = 0; ch < 3; ch++) {
        h_grad += Math.abs(copy[idx - 4 + ch] - copy[idx + 4 + ch]);
        v_grad += Math.abs(copy[idx - row_size + ch] - copy[idx + row_size + ch]);
      }
      if (h_grad + v_grad < 6) continue;

      // 4. 处于真正文字/斜向抗锯齿过渡区，施加确定性仿生微扰 ±1
      const delta = 1;
      for (let ch = 0; ch < 3; ch++) {
        pixels[idx + ch] = Math.min(255, Math.max(0, copy[idx + ch] + delta));
      }
    }
  }
}

console.log('================================================================');
console.log('🔬 正在执行 PixelScan 加噪数学模拟对抗测试...');
console.log('================================================================\n');

console.log('[测试 1] PixelScan Canvas 14 色块探针 (canvasNoiseOn2d - 70x5):');
const oldCanvasPass = simulatePixelScanCanvasNoiseOn2d(oldEdgeAwareNoise);
console.log(`  旧算法结果: ${oldCanvasPass ? '✅ 通过' : '❌ 失败 (被检出 Masking detected!)'}`);
const newCanvasPass = simulatePixelScanCanvasNoiseOn2d(newOptimizedNoise);
console.log(`  新算法结果: ${newCanvasPass ? '✅ 通过 (完美规避 Masking detected!)' : '❌ 失败'}`);

console.log('\n[测试 2] PixelScan WebGL 纯红矩形哈希探针 (getFixedRedBoxHash - 256x24):');
const oldWebglRes = simulatePixelScanWebGLRedBox(oldEdgeAwareNoise);
console.log(`  旧算法结果: ${oldWebglRes.passed ? '✅ 通过' : '❌ 失败 (哈希不匹配: ' + oldWebglRes.finalHash.slice(0, 16) + '...)'}`);
const newWebglRes = simulatePixelScanWebGLRedBox(newOptimizedNoise);
console.log(`  新算法结果: ${newWebglRes.passed ? '✅ 通过 (哈希完美匹配: ' + newWebglRes.finalHash.slice(0, 16) + '...)' : '❌ 失败'}`);

console.log('\n[测试 3] 真实指纹采集场景 (300x150 文本/抗锯齿图元):');
const oldFpRes = simulateRealFingerprintNoise(oldEdgeAwareNoise);
console.log(`  旧算法能否混淆真实指纹哈希: ${oldFpRes.isDifferent ? '✅ 成功生成独立指纹' : '❌ 失败'}`);
const newFpRes = simulateRealFingerprintNoise(newOptimizedNoise);
console.log(`  新算法能否混淆真实指纹哈希: ${newFpRes.isDifferent ? '✅ 成功生成独立指纹 (有效防关联!)' : '❌ 失败'}`);

console.log('\n================================================================');
console.log('🎯 模拟对抗测试总结:');
console.log(`  PixelScan canvasTest (14色块): ${newCanvasPass ? 'PASS (100%)' : 'FAIL'}`);
console.log(`  PixelScan noNoise (WebGL红盒):  ${newWebglRes.passed ? 'PASS (100%)' : 'FAIL'}`);
console.log(`  防关联指纹混淆有效性:          ${newFpRes.isDifferent ? 'PASS (100%)' : 'FAIL'}`);
console.log('================================================================');
