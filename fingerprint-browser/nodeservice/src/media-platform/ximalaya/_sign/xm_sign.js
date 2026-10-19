'use strict';
/**
 * xm-sign 生成器（创建作品接口 /reform-upload/upload/create 的 xm-sign 头）
 *
 * xm-sign = browserID + "&&" + sessionID
 * 二者由数盟(shuzilm)设备指纹 SDK(du_web_sdk) 产生：SDK 采集设备指纹(DNA)、
 * 经 XOR+urlSafeBase64 加密后 POST 到 hdaa.shuzilm.cn/report，由服务端签发 ID。
 * 因此必须联网。本模块在 Node vm 里以浏览器环境 mock 运行原始 du_web_sdk.js，
 * 真实发起 report 请求拿回服务端签发的 browserID/sessionID。
 *
 * 用法：
 *   const { getXmSign } = require('./xm_sign');
 *   const sign = await getXmSign();            // "xxx&&yyy"
 *   const { browserID, sessionID } = await getXmSign({ detail: true });
 *
 * 依赖：Node 内置模块 + 同目录 du_web_sdk.js（原始 SDK）。无第三方依赖。
 */

const fs = require('fs');
const vm = require('vm');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const http = require('http');
const { URL, URLSearchParams } = require('url');

// 喜马拉雅调用参数（来自 www 上传页 main.chunk：window._getDUH）
const DEFAULT_APP_ID = 't6pfoml9679z52kqw93uqu75eflqdg1bykhl';
const DEFAULT_SCENE = 'h5_goyxvzyohd';
const DEFAULT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36';
const SDK_PATH = path.join(__dirname, 'du_web_sdk.js');

function noop() {}

function makeStorage() {
  const m = {};
  return {
    getItem: (k) => (k in m ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v); },
    removeItem: (k) => { delete m[k]; },
    clear: () => { for (const k in m) delete m[k]; },
    key: (i) => Object.keys(m)[i] ?? null,
    get length() { return Object.keys(m).length; },
  };
}

// 内存版 IndexedDB（够 du_web_sdk 的 open/get/put 使用；异步回调避免死锁）
function makeIDBMock() {
  const dbs = {};
  const req = () => ({ onsuccess: null, onerror: null, onupgradeneeded: null, result: undefined });
  const fire = (r, result) => setTimeout(() => { r.result = result; if (typeof r.onsuccess === 'function') r.onsuccess({ target: r }); }, 0);
  function store(map) {
    return {
      get: (k) => { const r = req(); fire(r, map.has(k) ? map.get(k) : undefined); return r; },
      put: (v, k) => { const key = k !== undefined ? k : (v && v.temp); map.set(key, v); const r = req(); fire(r, key); return r; },
      add(v, k) { return this.put(v, k); },
      delete: (k) => { map.delete(k); const r = req(); fire(r, undefined); return r; },
      openCursor: () => { const r = req(); fire(r, null); return r; },
    };
  }
  return {
    open(name) {
      const r = req();
      const isNew = !dbs[name];
      if (isNew) dbs[name] = { stores: {} };
      const db = dbs[name];
      const handle = {
        objectStoreNames: { contains: (n) => !!db.stores[n], length: Object.keys(db.stores).length },
        createObjectStore(n) { if (!db.stores[n]) db.stores[n] = new Map(); return store(db.stores[n]); },
        transaction(names) {
          const tx = { oncomplete: null, onerror: null, objectStore: (n) => { if (!db.stores[n]) db.stores[n] = new Map(); return store(db.stores[n]); } };
          setTimeout(() => { if (typeof tx.oncomplete === 'function') tx.oncomplete({ target: tx }); }, 0);
          return tx;
        },
        close() {},
      };
      setTimeout(() => {
        r.result = handle;
        if (isNew && typeof r.onupgradeneeded === 'function') { try { r.onupgradeneeded({ target: r }); } catch (e) {} }
        if (typeof r.onsuccess === 'function') r.onsuccess({ target: r });
      }, 0);
      return r;
    },
    deleteDatabase(name) { delete dbs[name]; const r = req(); fire(r, undefined); return r; },
  };
}

// OfflineAudioContext mock（音频指纹，稳定数据）
function makeOfflineAudioContext() {
  return function OfflineAudioContext(channels, length, sampleRate) {
    const p = () => ({ value: 0, setValueAtTime: noop, setTargetAtTime: noop, linearRampToValueAtTime: noop });
    const self = {
      currentTime: 0, sampleRate: sampleRate || 44100, destination: {}, oncomplete: null,
      createOscillator: () => ({ type: 'sine', frequency: p(), connect: noop, start: noop, stop: noop }),
      createDynamicsCompressor: () => ({ threshold: p(), knee: p(), ratio: p(), reduction: p(), attack: p(), release: p(), connect: noop }),
      createGain: () => ({ gain: p(), connect: noop }),
      createAnalyser: () => ({ connect: noop }),
      createScriptProcessor: () => ({ connect: noop }),
      startRendering() {
        const len = length || 44100;
        const buf = { length: len, numberOfChannels: 1, sampleRate: self.sampleRate, getChannelData: () => { const a = new Float32Array(len); for (let i = 0; i < len; i++) a[i] = Math.sin(i / 100) * 0.5; return a; } };
        setTimeout(() => { if (typeof self.oncomplete === 'function') self.oncomplete({ renderedBuffer: buf }); }, 0);
        return Promise.resolve(buf);
      },
    };
    return self;
  };
}

function buildSandbox(opts) {
  const UA = opts.userAgent || DEFAULT_UA;
  const netLog = [];

  class RealXHR {
    constructor() { this.readyState = 0; this.status = 0; this.responseText = ''; this.response = ''; this._headers = {}; this._listeners = {}; this.withCredentials = false; this.responseType = ''; }
    open(method, url) { this.method = method; this._url = url; this.readyState = 1; this._rsc(); }
    setRequestHeader(k, v) { this._headers[k] = v; }
    _rsc() { if (typeof this.onreadystatechange === 'function') { try { this.onreadystatechange(); } catch (e) {} } }
    _emit(t) { if (typeof this['on' + t] === 'function') { try { this['on' + t]({ type: t }); } catch (e) {} } (this._listeners[t] || []).forEach((cb) => { try { cb({ type: t }); } catch (e) {} }); }
    addEventListener(t, cb) { (this._listeners[t] = this._listeners[t] || []).push(cb); }
    removeEventListener() {}
    getAllResponseHeaders() { return ''; }
    getResponseHeader() { return null; }
    send(body) {
      let u; try { u = new URL(this._url, 'https://www.ximalaya.com'); } catch (e) { u = null; }
      const rec = { method: this.method, url: this._url, bodyLen: body ? (body.length || body.byteLength || 0) : 0 };
      netLog.push(rec);
      if (!u) { this._finish(0, ''); return; }
      const lib = u.protocol === 'http:' ? http : https;
      const headers = Object.assign({ 'User-Agent': UA, Origin: 'https://www.ximalaya.com', Referer: 'https://www.ximalaya.com/' }, this._headers);
      let bodyBuf = body;
      if (body && typeof body !== 'string' && !(body instanceof Buffer)) { try { bodyBuf = Buffer.from(body); } catch (e) { bodyBuf = String(body); } }
      const req = lib.request({ method: this.method || 'GET', hostname: u.hostname, port: u.port || (u.protocol === 'http:' ? 80 : 443), path: u.pathname + u.search, headers }, (res) => {
        const chunks = []; res.on('data', (c) => chunks.push(c));
        res.on('end', () => { const buf = Buffer.concat(chunks); rec.respStatus = res.statusCode; rec.respLen = buf.length; this._finish(res.statusCode, buf.toString('binary'), buf); });
      });
      req.on('error', (e) => { rec.err = e.message; this._finish(0, ''); });
      if (bodyBuf) req.write(bodyBuf);
      req.end();
    }
    _finish(status, text, buf) {
      this.status = status; this.responseText = text;
      this.response = this.responseType === 'arraybuffer' && buf ? buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) : text;
      this.readyState = 4; this._rsc(); this._emit('load'); this._emit('loadend');
    }
  }

  const documentBase = {
    cookie: '',
    createElement: (tag) => {
      const t = String(tag).toLowerCase();
      const el = { tagName: t.toUpperCase(), style: {}, setAttribute: noop, getAttribute: () => null, appendChild: (c) => c, removeChild: noop, insertBefore: (c) => c, addEventListener: noop, removeEventListener: noop, offsetWidth: 100, offsetHeight: 20, clientWidth: 100, clientHeight: 20, getBoundingClientRect: () => ({ width: 100, height: 20, top: 0, left: 0, right: 100, bottom: 20 }), childNodes: [], children: [] };
      if (t === 'canvas') {
        el.width = 300; el.height = 150;
        const c2d = new Proxy({
          canvas: el,
          measureText: (s) => ({ width: String(s).length * 7, actualBoundingBoxAscent: 10, actualBoundingBoxDescent: 3 }),
          getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(4, (w | 0) * (h | 0) * 4)), width: w | 0, height: h | 0 }),
          createLinearGradient: () => ({ addColorStop: noop }),
          createRadialGradient: () => ({ addColorStop: noop }),
          createPattern: () => ({}), getParameter: () => 0, getExtension: () => null, getSupportedExtensions: () => [],
        }, { get(tg, p) { if (p in tg) return tg[p]; if (typeof p === 'symbol') return undefined; return noop; }, set(tg, p, v) { tg[p] = v; return true; } });
        el.getContext = (type) => c2d;
        el.toDataURL = () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      }
      return el;
    },
    createElementNS: () => ({ style: {}, setAttribute: noop }),
    getElementsByTagName: (tag) => (String(tag).toLowerCase() === 'body' ? [documentBase.body] : []),
    getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
    documentElement: { style: {}, appendChild: (c) => c, lang: 'zh-CN' },
    body: { appendChild: (c) => c, removeChild: noop, insertBefore: (c) => c, style: {}, offsetWidth: 1920, offsetHeight: 969 },
    head: { appendChild: (c) => c },
    addEventListener: noop, removeEventListener: noop,
    referrer: 'https://www.ximalaya.com/', characterSet: 'UTF-8', readyState: 'complete', visibilityState: 'visible', hidden: false,
  };

  const navigatorBase = {
    userAgent: UA, appVersion: '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', appName: 'Netscape',
    platform: 'Win32', language: 'zh-CN', languages: ['zh-CN', 'zh'], vendor: 'Google Inc.', hardwareConcurrency: 8, deviceMemory: 8, maxTouchPoints: 0,
    cookieEnabled: true, doNotTrack: null, onLine: true, plugins: { length: 0 }, mimeTypes: { length: 0 }, webdriver: false,
    sendBeacon: (url, data) => { netLog.push({ method: 'BEACON', url, bodyLen: data ? (data.length || data.byteLength || 0) : 0 }); return true; },
    javaEnabled: () => false, product: 'Gecko', productSub: '20030107',
  };
  const screenBase = { width: 1920, height: 1080, availWidth: 1920, availHeight: 1040, colorDepth: 24, pixelDepth: 24 };

  const sandbox = {};
  Object.assign(sandbox, {
    document: documentBase, navigator: navigatorBase, screen: screenBase,
    localStorage: makeStorage(), sessionStorage: makeStorage(), XMLHttpRequest: RealXHR,
    location: { href: 'https://www.ximalaya.com/reform-upload/page/upload', host: 'www.ximalaya.com', hostname: 'www.ximalaya.com', protocol: 'https:', origin: 'https://www.ximalaya.com', pathname: '/reform-upload/page/upload', search: '' },
    setTimeout, clearTimeout, setInterval, clearInterval, queueMicrotask,
    Promise, Date, Math, JSON, Array, Object, String, Number, Boolean, RegExp, Error, TypeError, Function, Symbol, Map, Set, WeakMap, WeakSet, ArrayBuffer, Uint8Array, Uint16Array, Uint32Array, Int8Array, Uint8ClampedArray, Int32Array, Float32Array, Float64Array, DataView, parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent, encodeURI, decodeURI, escape, unescape,
    atob: (b) => Buffer.from(b, 'base64').toString('binary'),
    btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    TextEncoder, TextDecoder, URL, URLSearchParams,
    console: opts.debug ? console : { log: noop, debug: noop, warn: noop, info: noop, error: noop },
    performance: { now: () => Date.now(), timeOrigin: Date.now() },
    crypto: { getRandomValues: (arr) => { const b = crypto.randomBytes(arr.length); for (let i = 0; i < arr.length; i++) arr[i] = b[i]; return arr; }, subtle: undefined },
    Intl, devicePixelRatio: 1, indexedDB: makeIDBMock(), OfflineAudioContext: makeOfflineAudioContext(), AudioContext: makeOfflineAudioContext(),
    innerWidth: 1920, innerHeight: 969, outerWidth: 1920, outerHeight: 1040,
    addEventListener: noop, removeEventListener: noop, dispatchEvent: () => true,
    requestAnimationFrame: (cb) => setTimeout(() => cb(Date.now()), 16), cancelAnimationFrame: clearTimeout,
  });
  sandbox.window = sandbox; sandbox.self = sandbox; sandbox.top = sandbox; sandbox.parent = sandbox; sandbox.globalThis = sandbox;
  return { sandbox, netLog };
}

let cachedCode = null;
function loadPatchedCode() {
  if (cachedCode) return cachedCode;
  let code = fs.readFileSync(SDK_PATH, 'utf8');
  // 让 simpleXORCipher 容忍 null/空 输入，避免无头环境个别指纹项为空时崩溃
  const SIG = 'this[d(203)]=function(n,r){let i=d,a=(r[i(852)](0),"");';
  const PATCH = 'this[d(203)]=function(n,r){let i=d;if(n==null)n="";if(r==null||r==="")r=" ";var a=(r[i(852)](0),"");';
  if (code.includes(SIG)) code = code.replace(SIG, PATCH);
  cachedCode = code;
  return code;
}

/**
 * 生成 xm-sign。
 * @param {Object} [opts]
 * @param {string} [opts.appId]    数盟 appId（默认喜马拉雅 www 上传页值）
 * @param {string} [opts.scene]    场景标识（默认 h5_goyxvzyohd）
 * @param {string} [opts.userAgent]
 * @param {number} [opts.timeout]  单次取值超时 ms（默认 15000）
 * @param {boolean}[opts.detail]   为 true 时返回 { xmSign, browserID, sessionID, netLog }
 * @param {boolean}[opts.debug]    打开 SDK 内部日志
 * @returns {Promise<string|{xmSign,browserID,sessionID,netLog}>}
 */
async function getXmSign(opts = {}) {
  const appId = opts.appId || DEFAULT_APP_ID;
  const scene = opts.scene || DEFAULT_SCENE;
  const timeout = opts.timeout || 15000;

  const code = loadPatchedCode();
  const { sandbox, netLog } = buildSandbox(opts);
  const ctx = vm.createContext(sandbox);
  vm.runInContext(code, ctx, { filename: 'du_web_sdk.js', timeout: 20000 });

  const sdk = sandbox['du_web_sdk'];
  if (!sdk || typeof sdk.getBrowserID !== 'function') throw new Error('du_web_sdk 未正确加载');
  try { sdk.setConfig({ deb: 'false' }); } catch (e) {}

  const call = (fn) => new Promise((resolve) => {
    let done = false;
    const to = setTimeout(() => { if (!done) { done = true; resolve(null); } }, timeout);
    try { fn(appId, scene, '', (v) => { if (!done) { done = true; clearTimeout(to); resolve(v); } }); }
    catch (e) { clearTimeout(to); resolve(null); }
  });

  const [browserID, sessionID] = await Promise.all([call(sdk.getBrowserID.bind(sdk)), call(sdk.getSessionID.bind(sdk))]);
  if (!browserID || !sessionID) throw new Error('取 browserID/sessionID 失败: ' + JSON.stringify({ browserID, sessionID }));
  const xmSign = browserID + '&&' + sessionID;
  return opts.detail ? { xmSign, browserID, sessionID, netLog } : xmSign;
}

module.exports = { getXmSign, DEFAULT_APP_ID, DEFAULT_SCENE };

// 允许直接运行：node xm_sign.js
if (require.main === module) {
  getXmSign({ detail: true })
    .then((r) => { console.log('browserID:', r.browserID); console.log('sessionID:', r.sessionID); console.log('xm-sign  :', r.xmSign); console.log('report 请求数:', r.netLog.filter((n) => /shuzilm/.test(n.url)).length); })
    .catch((e) => { console.error('失败:', e.message); process.exit(1); });
}
