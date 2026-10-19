'use strict';
// 验证 getXmSign() 产出的 xm-sign 结构与真实抓包样本一致（不比对具体 ID 值，因每次设备指纹不同）
const { getXmSign } = require('./xm_sign');

// 真实抓包样本（www /reform-upload/upload/create 的 xm-sign）
const REAL = 'D2sHikiMWCvTxR5DFv8UFHL5KAOk2lPTX8oNzKJYIjQ9AX57&&P_Gfj7ANiZolQaugZ8K13T8dhkm1xiGxwADQO2gg6wUFpKzEf1CP18C3G-Fm1Rpr_2';

function analyze(sign) {
  const parts = sign.split('&&');
  return {
    hasSep: sign.includes('&&'),
    partCount: parts.length,
    browserLen: parts[0] ? parts[0].length : 0,
    sessionLen: parts[1] ? parts[1].length : 0,
    browserPrefix: parts[0] ? parts[0].slice(0, 2) : '',
    // 后段结尾 _<数字> 的模式
    sessionTail: parts[1] ? /_\d+$/.test(parts[1]) : false,
  };
}

(async () => {
  console.log('真实样本结构:', analyze(REAL));
  const got = await getXmSign({ detail: true });
  console.log('\n生成 xm-sign :', got.xmSign);
  console.log('生成结构    :', analyze(got.xmSign));

  const g = analyze(got.xmSign);
  const r = analyze(REAL);
  const checks = [
    ['含 && 分隔符', g.hasSep === true],
    ['两段结构', g.partCount === 2],
    ['browserID 非空', g.browserLen > 20],
    ['sessionID 非空', g.sessionLen > 20],
    ['browserID 前缀 D2（与真实一致）', g.browserPrefix === r.browserPrefix],
    ['sessionID 结尾 _<数字>（与真实一致）', g.sessionTail === r.sessionTail],
    ['真实 report 已发出', got.netLog.filter((n) => /shuzilm/.test(n.url) && n.respStatus === 200).length >= 1],
  ];
  let ok = 0;
  console.log('');
  for (const [name, pass] of checks) { console.log((pass ? 'PASS' : 'FAIL') + '  ' + name); if (pass) ok++; }
  console.log(`\n${ok}/${checks.length} passed`);
  process.exit(ok === checks.length ? 0 : 1);
})().catch((e) => { console.error('失败:', e.message); process.exit(1); });
