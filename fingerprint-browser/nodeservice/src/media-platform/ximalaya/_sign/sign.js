'use strict';
/**
 * 喜马拉雅上传签名 - Node.js 实现
 *
 * 覆盖两套签名：
 *   1) x-xfm-signature  —— 音频分片上传(/upload/file/blk) 与 文件合并(/upload/merge/mkfile)
 *      纯离线可复现（HMAC-SHA256），已用真实抓包数据验证通过。
 *   2) xm-sign          —— 创建最终音频作品(/reform-upload/upload/create)
 *      = browserID + "&&" + sessionID，来自数盟(shuzilm)设备指纹 SDK(window.du_web_sdk)，
 *      属浏览器指纹黑盒，无法纯离线计算，这里做成注入接口（外部传入真实值）。
 *
 * 依赖：仅 Node 内置 crypto。
 */

const crypto = require('crypto');

// ------------------------------------------------------------------
// 通用工具
// ------------------------------------------------------------------

function md5Base64(str) {
  if (!str) return '';
  return crypto.createHash('md5').update(str, 'utf8').digest('base64');
}

function hmacSha256Base64(data, key) {
  return crypto.createHmac('sha256', key).update(data, 'utf8').digest('base64');
}

// ------------------------------------------------------------------
// 1) x-xfm-signature
// ------------------------------------------------------------------

// 参与签名的 header 白名单（升序），其 join(",") 即 x-xfm-signature-headers 的值
const SIGN_HEADERS = ['x-xfm-app-key', 'x-xfm-timestamp', 'x-xfm-upload-type'].sort();

// uploadType 映射（studio 源码里的 audio/video 会被映射；tingWebAudio 这类直接透传）
const UPLOAD_TYPE_MAP = { audio: 'tingAudio', video: 'tingVideo', enterpriseNoLogoVideo: 'enterpriseNoLogoVideo' };

// 各 app 的密钥（APP_SERCRET 是 base64，真实 HMAC key = atob(APP_SERCRET)）
// 抓包(www 音频上传)用的是 tingWeb -> L2hRdnBpQzJT
const APP_SERCRET = {
  tingWeb: 'L2hRdnBpQzJT',   // atob => "/hQvpiC2S" —— 图片/文档/音频等
  ting: 'L2hRdnBpQzJT',
  FSYY: 'bGEyY2JDWHBhc0Ey',  // atob => "la2cbCXpasE2" —— 视频
};

function atob(b64) {
  return Buffer.from(b64, 'base64').toString('binary');
}

/** 构造 headerStr：按 SIGN_HEADERS 顺序取值拼 k=v&k=v */
function buildHeaderStr(headers) {
  return SIGN_HEADERS.map((k) => `${k}=${headers[k]}`).join('&');
}

/** 构造 queryStr：key 转小写、排序、拼 k=v&k=v（值为“原始未编码”值） */
function buildQueryStr(queryObj) {
  if (!queryObj) return '';
  const lower = {};
  for (const k in queryObj) {
    if (Object.prototype.hasOwnProperty.call(queryObj, k)) {
      lower[k.toLowerCase()] = queryObj[k];
    }
  }
  return Object.keys(lower)
    .sort()
    .map((k) => `${k}=${lower[k]}`)
    .join('&');
}

/**
 * 计算 x-xfm-signature 及配套的一整组 x-xfm-* 请求头。
 *
 * @param {Object} opts
 * @param {string} opts.appKey        x-xfm-app-key，例如 "tingWeb"
 * @param {string} opts.uploadType    x-xfm-upload-type，例如 "tingWebAudio"
 * @param {string} opts.fileName      原始文件名（中文无需编码，函数内部会对 header 用的文件名做 encode）
 * @param {number} [opts.timestamp]   x-xfm-timestamp，默认 Date.now()
 * @param {string} [opts.serverIp]    x-xfm-upload-server-ip，分片第 2 片起服务端返回的 ip，默认 ""
 * @param {string} [opts.appSercret]  base64 密钥，默认按 appKey 查表（tingWeb=>L2hRdnBpQzJT）
 * @param {Object|string} [opts.bodyData]   请求体对象（mkfile 用；blk 为空）
 * @param {Object} [opts.queryData]   query 对象（blk 用；键为原始值：中文文件名、原始 Date、audio/mpeg 等）
 * @returns {{ headers: Object, signature: string, signBase: string }}
 */
function xfmSignature(opts) {
  const {
    appKey,
    uploadType,
    fileName,
    timestamp = Date.now(),
    serverIp = '',
    bodyData = '',
    queryData = null,
  } = opts;

  const appSercret = opts.appSercret || APP_SERCRET[appKey] || 'L2hRdnBpQzJT';
  const key = atob(appSercret);

  // 组装 header 值
  const headers = {
    'x-xfm-timestamp': timestamp,
    'x-xfm-app-key': appKey || 'ting',
    'x-xfm-upload-type': UPLOAD_TYPE_MAP[uploadType] || uploadType,
    'x-xfm-upload-file-name': encodeURIComponent(fileName),
    'x-xfm-signature-headers': SIGN_HEADERS.join(','),
    'x-xfm-upload-single': false,
    'x-xfm-upload-server-ip': serverIp || '',
  };

  // 待签名串： "POST" | MD5B64(body) | headerStr | queryStr
  const SEP = '|';
  const bodyStr = typeof bodyData === 'string' ? bodyData : (bodyData ? JSON.stringify(bodyData) : '');
  const signBase =
    'POST' + SEP + md5Base64(bodyStr) + SEP + buildHeaderStr(headers) + SEP + buildQueryStr(queryData);

  const signature = hmacSha256Base64(signBase, key);
  headers['x-xfm-signature'] = signature;

  return { headers, signature, signBase };
}

// ------------------------------------------------------------------
// 2) xm-sign（创建作品）
// ------------------------------------------------------------------

/**
 * 组装 xm-sign（注入模式）。
 * xm-sign = browserID + "&&" + sessionID，均由数盟设备指纹 SDK(du_web_sdk) 产生。
 * 若你已从别处（浏览器 window._getDUH() 或 xm_sign.js）拿到 browserID/sessionID，用这个拼装。
 *
 * @param {Object} p
 * @param {string} p.browserID
 * @param {string} p.sessionID
 * @returns {string}
 */
function xmSign({ browserID, sessionID }) {
  if (!browserID || !sessionID) {
    throw new Error('xmSign 需要 browserID 和 sessionID');
  }
  return `${browserID}&&${sessionID}`;
}

/**
 * 生成 xm-sign（自动模式）：在 Node vm 里运行数盟 SDK，联网取回服务端签发的真实 ID。
 * 需联网。见 xm_sign.js。
 * @param {Object} [opts] 透传给 getXmSign
 * @returns {Promise<string>}
 */
function xmSignAuto(opts) {
  const { getXmSign } = require('./xm_sign');
  return getXmSign(opts);
}

// 生成一个 uuid v4（与 uploader 内部的 sessionId 生成算法一致）
function uuidV4() {
  const hex = '0123456789abcdef';
  const e = [];
  for (let t = 0; t < 36; t++) e[t] = hex[Math.floor(16 * Math.random())];
  e[14] = '4';
  e[19] = hex[(3 & parseInt(e[19], 16)) | 8];
  e[8] = e[13] = e[18] = e[23] = '-';
  return e.join('');
}

/**
 * 生成上传链路用的 x-tId（对应 uploader 里的 file._traceId）。
 *
 * 真实规则（来自 uploader chunk）：
 *   _traceId = Date.now() + "-" + Math.random().toString(36).substring(2)
 *              + (page === "web_upload" ? "&&" + sessionId : "")
 *
 * 用法：一次上传任务开始时生成一次，token / blk / mkfile 全程复用同一个值。
 * 注意：create 接口不带 x-tId。x-tId 与 xm-sign 是两回事（都含 "&&" 但成分不同）。
 *
 * @param {Object} [opts]
 * @param {boolean}[opts.webUpload=true] 是否 web_upload 页（为 true 时追加 "&&sessionId"）
 * @param {string} [opts.sessionId]      uploader 的 sessionId(uuid v4)；不传则自动生成
 * @returns {{ tId: string, sessionId: string }}
 */
function makeTId(opts = {}) {
  const webUpload = opts.webUpload !== false;
  const sessionId = opts.sessionId || uuidV4();
  const base = Date.now() + '-' + Math.random().toString(36).substring(2);
  const tId = webUpload ? base + '&&' + sessionId : base;
  return { tId, sessionId };
}

module.exports = {
  xfmSignature,
  xmSign,
  xmSignAuto,
  makeTId,
  uuidV4,
  // 导出内部工具，便于测试/扩展
  _internal: { md5Base64, hmacSha256Base64, buildHeaderStr, buildQueryStr, atob, SIGN_HEADERS, APP_SERCRET },
};
