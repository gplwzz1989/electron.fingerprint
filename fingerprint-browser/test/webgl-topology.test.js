const assert = require('node:assert/strict')
const {
  GPU_HARDWARE_TOPOLOGY,
  getGPUHardwareTopology,
  auditGPUProfileConsistency
} = require('../webgl-topology')
const { getDefaultProfile } = require('../profile-store')

// 1. 显卡拓扑基础字典
assert.ok(GPU_HARDWARE_TOPOLOGY['nvidia-rtx-modern'], '必须具备现代 NVIDIA RTX 拓扑')
assert.ok(GPU_HARDWARE_TOPOLOGY['intel-integrated'], '必须具备 Intel 核显拓扑')
assert.ok(GPU_HARDWARE_TOPOLOGY['apple-silicon'], '必须具备 Apple 芯片拓扑')

// 2. 自适应拓扑匹配
const rtx3060Topo = getGPUHardwareTopology('ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)')
assert.equal(rtx3060Topo.maxTextureSize, 32768)
assert.deepEqual(rtx3060Topo.aliasedPointSizeRange, [1, 2047])
assert.ok(rtx3060Topo.standardExtensions.includes('WEBGL_compressed_texture_s3tc'))

const intelTopo = getGPUHardwareTopology('ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)')
assert.equal(intelTopo.maxTextureSize, 16384)
assert.deepEqual(intelTopo.aliasedPointSizeRange, [1, 1024])

const appleTopo = getGPUHardwareTopology('ANGLE (Apple, Apple M2, OpenGL 4.1)')
assert.equal(appleTopo.maxTextureSize, 16384)
assert.deepEqual(appleTopo.aliasedPointSizeRange, [1, 511])

// 3. 一致性核验
const goodProfile = getDefaultProfile()
goodProfile.hardware.platform = 'Win32'
goodProfile.graphics.webglVendor = 'Google Inc. (NVIDIA)'
goodProfile.graphics.webglRenderer = 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)'
const auditGood = auditGPUProfileConsistency(goodProfile)
assert.equal(auditGood.consistent, true)
assert.equal(auditGood.issues.filter(i => i.severity === 'error').length, 0)

// 场景 A: Mac 平台配置了 D3D 渲染器
const badMacProfile = structuredClone(goodProfile)
badMacProfile.hardware.platform = 'MacIntel'
const auditBadMac = auditGPUProfileConsistency(badMacProfile)
assert.equal(auditBadMac.consistent, false)
assert.match(auditBadMac.issues[0].message, /Direct3D/)

// 场景 B: Windows 平台配置了 Apple Metal 渲染器
const badWinProfile = structuredClone(goodProfile)
badWinProfile.graphics.webglRenderer = 'ANGLE (Apple, Apple M2, Metal)'
const auditBadWin = auditGPUProfileConsistency(badWinProfile)
assert.equal(auditBadWin.consistent, false)
assert.match(auditBadWin.issues[0].message, /Apple Metal/)

// 场景 C: 屏幕尺寸超过纹理上限
const badResProfile = structuredClone(goodProfile)
badResProfile.graphics.webglVendor = 'Google Inc. (Intel)'
badResProfile.graphics.webglRenderer = 'ANGLE (Intel, Intel(R) HD Graphics 4000, D3D11)'
badResProfile.screen.width = 65536
const auditBadRes = auditGPUProfileConsistency(badResProfile)
assert.equal(auditBadRes.consistent, false)
const errorIssue = auditBadRes.issues.find(i => i.severity === 'error')
assert.ok(errorIssue, '必须报告 error 级别的纹理尺寸违规')
assert.match(errorIssue.message, /超出了该显卡支持的最大纹理/)

console.log('WebGL 深度物理参数拓扑与自洽性核验自检通过。')
