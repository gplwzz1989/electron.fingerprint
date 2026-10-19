'use strict';
/**
 * 用真实抓包数据验证 xfmSignature 逐字节一致。
 *   - fixtures_blk.json    : 7 个分片 blk 请求（含真实 x-xfm-signature）
 *   - fixtures_mkfile.json : 1 个 mkfile 合并请求（body 为 JSON）
 * 运行： node test.js
 */

const fs = require('fs');
const path = require('path');
const { xfmSignature } = require('./sign');

// 把 URL query 还原成 SDK 内部的 queryData 对象：
//   application/x-www-form-urlencoded 风格 —— "+" 表示空格，其余 percent-decode。
function parseBlkQuery(url) {
  const qs = url.split('?')[1] || '';
  const obj = {};
  for (const pair of qs.split('&')) {
    if (!pair) continue;
    const i = pair.indexOf('=');
    const k = pair.slice(0, i);
    const raw = pair.slice(i + 1);
    let v;
    try {
      v = decodeURIComponent(raw.replace(/\+/g, ' '));
    } catch (e) {
      v = raw;
    }
    obj[k] = v;
  }
  return obj;
}

function lowerHeaders(h) {
  const o = {};
  for (const k in h) o[k.toLowerCase()] = h[k];
  return o;
}

let pass = 0;
let fail = 0;

function check(label, expected, got) {
  const ok = expected === got;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) {
    console.log('   expected:', expected);
    console.log('   got     :', got);
    fail++;
  } else {
    pass++;
  }
}

// --- 1) blk 分片 ---
const blks = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures_blk.json'), 'utf8'))
  .filter((r) => r.url.includes('upload/file/blk'));

for (const r of blks) {
  const h = lowerHeaders(r.headers);
  const query = parseBlkQuery(r.url);
  const { signature } = xfmSignature({
    appKey: h['x-xfm-app-key'],
    uploadType: h['x-xfm-upload-type'],
    fileName: query.name,
    timestamp: h['x-xfm-timestamp'],
    serverIp: h['x-xfm-upload-server-ip'] || '',
    bodyData: '',          // 分片 body 是二进制，签名 body 段为空
    queryData: query,
  });
  check(`blk chunk=${query.chunk}`, h['x-xfm-signature'], signature);
}

// --- 2) mkfile 合并 ---
const mk = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures_mkfile.json'), 'utf8'));
{
  const h = lowerHeaders(mk.headers);
  const { signature } = xfmSignature({
    appKey: h['x-xfm-app-key'],
    uploadType: h['x-xfm-upload-type'],
    fileName: mk.post_data.fileName,
    timestamp: h['x-xfm-timestamp'],
    serverIp: h['x-xfm-upload-server-ip'] || '',
    bodyData: mk.post_data,  // mkfile body 是 JSON 对象
    queryData: null,         // 无 query
  });
  check('mkfile', h['x-xfm-signature'], signature);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
