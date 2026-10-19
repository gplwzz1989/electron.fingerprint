import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import axios from 'axios';
import { logger } from '../../utils';

/**
 * 皮皮虾 a_bogus 本地签名运行时
 *
 * 背景：皮皮虾内容列表/状态查询接口(item_list 等)需要有效的 a_bogus 反爬签名，
 * 而外部签名服务(qianming)对该请求签不出有效值。经验证，字节的 bdms(rc-client-security)
 * SDK 在浏览器里会自动向请求注入 a_bogus。此运行时把 bdms.js + sdk-glue.js 放进 node vm
 * 里跑(与抖音私信的 webmssdk 同款做法)，启动时向 mssdk 换一次 token 并缓存，之后即可
 * 为任意 item_list 类请求生成有效 a_bogus。
 *
 * 用法：await pipixiaBdms.signUrl('/api/mp/bds/webapi/item_list/?status=1&...')
 *   返回：'/api/mp/bds/webapi/item_list/?status=1&...&a_bogus=xxxx'
 */

// 本地随包资源(dev / 源码运行时可用)；打包发版后可能不存在，此时回退到 CDN 下载缓存
const BDMS_ASSET = path.resolve(__dirname, 'assets', 'bdms.js');
const SDK_GLUE_ASSET = path.resolve(__dirname, 'assets', 'sdk-glue.js');

// 字节官方固定版本 CDN 地址(与皮皮虾 web 一致：bdms 1.0.1.20 / sdk-glue 1.0.0.65)
const BDMS_CDN = [
  'https://lf-c-flwb.bytetos.com/obj/rc-client-security/web/stable/1.0.1.20/bdms.js',
  'https://lf-headquarters-speed.yhgfb-cn-static.com/obj/rc-client-security/web/stable/1.0.1.20/bdms.js',
];
const SDK_GLUE_CDN = ['https://lf-c-flwb.bytetos.com/obj/rc-client-security/web/glue/1.0.0.65/sdk-glue.js'];

const CACHE_DIR = path.join(os.tmpdir(), 'ppx-bdms-cache');

/**
 * 加载 SDK 源码：优先本地随包文件 → 本地缓存 → 官方 CDN 下载并缓存
 */
const loadSdkSource = async (localPath: string, cacheName: string, cdnUrls: string[]): Promise<string> => {
  if (fs.existsSync(localPath)) {
    return fs.readFileSync(localPath, 'utf8');
  }
  const cachePath = path.join(CACHE_DIR, cacheName);
  if (fs.existsSync(cachePath)) {
    return fs.readFileSync(cachePath, 'utf8');
  }
  for (const url of cdnUrls) {
    try {
      const r = await axios.get<string>(url, { responseType: 'text', timeout: 20000, validateStatus: () => true });
      const src = typeof r.data === 'string' ? r.data : String(r.data);
      if (r.status === 200 && src.length > 1000) {
        try {
          fs.mkdirSync(CACHE_DIR, { recursive: true });
          fs.writeFileSync(cachePath, src, 'utf8');
        } catch {
          /* 缓存失败不影响使用 */
        }
        return src;
      }
    } catch {
      /* 尝试下一个 CDN */
    }
  }
  throw new Error(`皮皮虾签名SDK加载失败(本地与CDN均不可用): ${cacheName}`);
};

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.7204.185 Safari/537.36';

// bdms 需要真实联网的域名(设备 token 上报等)，其余请求在 vm 内伪造响应
const FORWARD_HOST_MARKERS = ['mssdk.bytedance.com', 'mssdk.pipix.com', 'zijieapi.com', 'bytetos.com', 'yhgfb-cn-static.com'];
// 皮皮虾业务域名：命中即为"待签名请求"，捕获注入后的 URL，不真实发出
const TARGET_HOST_MARKER = 'pipix.com';

const PPX_APP_ID = 1319;
const SIGN_PATHS = ['/api/mp/bds/webapi/'];

interface CaptureSlot {
  url?: string;
}

class PipixiaBdmsRuntime {
  private ctx: vm.Context | null = null;
  private capture: CaptureSlot = {};
  private tokenReadyResolve: (() => void) | null = null;
  private tokenReady: Promise<void> | null = null;
  private initPromise: Promise<void> | null = null;

  private buildContext(): vm.Context {
    const capture = this.capture;
    const forwardOrFake = (
      method: string,
      url: string,
      body: unknown,
      headers: Record<string, string>,
      onDone: (status: number, text: string) => void,
    ) => {
      let host = '';
      try {
        host = new URL(url, 'https://pipix.com').hostname;
      } catch {
        host = '';
      }
      if (FORWARD_HOST_MARKERS.some((h) => host.includes(h))) {
        axios
          .request({
            method: method as never,
            url,
            data: body,
            headers: { ...headers, 'user-agent': UA },
            timeout: 15000,
            validateStatus: () => true,
          })
          .then((r) => {
            const text = typeof r.data === 'string' ? r.data : JSON.stringify(r.data);
            onDone(r.status, text);
            if (host.includes('mssdk') && this.tokenReadyResolve) {
              this.tokenReadyResolve();
              this.tokenReadyResolve = null;
            }
          })
          .catch(() => onDone(0, ''));
        return;
      }
      if (host.includes(TARGET_HOST_MARKER)) {
        // 待签名的业务请求：记录注入后的 URL，返回伪造响应即可(真实请求由调用方带 cookie 发)
        capture.url = url;
      }
      onDone(200, '{}');
    };

    const canvas = () => ({
      getContext: () => ({
        fillRect() {}, clearRect() {}, drawImage() {}, fillText() {},
        measureText: (t: unknown) => ({ width: String(t ?? '').length * 8 }),
        getImageData: () => ({ data: new Uint8ClampedArray(4) }),
        putImageData() {}, createLinearGradient: () => ({ addColorStop() {} }),
        beginPath() {}, closePath() {}, moveTo() {}, lineTo() {}, stroke() {}, arc() {}, rect() {},
        save() {}, restore() {}, translate() {}, scale() {}, setTransform() {}, fill() {},
      }),
      toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      width: 300, height: 150, style: {},
    });

    const documentStub: Record<string, unknown> = {
      cookie: '', hidden: false, visibilityState: 'visible', readyState: 'complete',
      referrer: 'https://pipix.com/', title: 'ppx',
      documentElement: { style: {}, clientWidth: 1536, clientHeight: 864, lang: 'zh' },
      head: { appendChild() {}, removeChild() {}, insertBefore() {} },
      body: { appendChild() {}, removeChild() {}, insertBefore() {} },
      getElementsByTagName: () => [{ appendChild() {}, insertBefore() {} }],
      getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
      createElement: (t: string) => {
        const tag = String(t).toLowerCase();
        if (tag === 'canvas') return canvas();
        return {
          style: {}, appendChild() {}, removeChild() {}, setAttribute() {},
          getContext: () => canvas().getContext(),
          addEventListener(ev: string, cb: () => void) { if (ev === 'load') setTimeout(cb, 0); },
          src: '',
        };
      },
      addEventListener() {}, removeEventListener() {}, createEvent: () => ({ initEvent() {} }),
    };

    const location = {
      href: 'https://pipix.com/mp/upload?status=pass', origin: 'https://pipix.com', protocol: 'https:',
      host: 'pipix.com', hostname: 'pipix.com', port: '', pathname: '/mp/upload', search: '?status=pass', hash: '',
    };
    const navigator = {
      userAgent: UA, appVersion: UA.replace('Mozilla/', ''), appCodeName: 'Mozilla', appName: 'Netscape',
      product: 'Gecko', vendor: 'Google Inc.', language: 'zh-CN', languages: ['zh-CN', 'zh'], platform: 'Win32',
      onLine: true, cookieEnabled: true, hardwareConcurrency: 12, deviceMemory: 8, maxTouchPoints: 0,
      webdriver: false, plugins: { length: 0 }, mimeTypes: { length: 0 }, sendBeacon: () => true,
      connection: { effectiveType: '4g', rtt: 50, downlink: 10 },
    };

    class XHR {
      method = '';
      url = '';
      reqHeaders: Record<string, string> = {};
      readyState = 0;
      status = 0;
      responseText = '';
      response = '';
      responseType = '';
      withCredentials = false;
      timeout = 0;
      onreadystatechange: (() => void) | null = null;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      onloadend: (() => void) | null = null;
      private listeners: Record<string, Array<() => void>> = {};
      open(m: string, u: string) { this.method = m; this.url = u; }
      setRequestHeader(k: string, v: string) { this.reqHeaders[k] = String(v); }
      overrideMimeType() {}
      addEventListener(ev: string, cb: () => void) { (this.listeners[ev] = this.listeners[ev] || []).push(cb); }
      removeEventListener() {}
      getAllResponseHeaders() { return 'content-type: application/json'; }
      getResponseHeader() { return null; }
      abort() {}
      send(b?: unknown) {
        forwardOrFake(this.method, this.url, b, this.reqHeaders, (status, text) => {
          this.status = status;
          this.responseText = text;
          this.response = text;
          this.readyState = 4;
          if (this.onreadystatechange) try { this.onreadystatechange(); } catch { /* ignore */ }
          if (this.onload) try { this.onload(); } catch { /* ignore */ }
          (this.listeners['load'] || []).forEach((f) => { try { f(); } catch { /* ignore */ } });
          (this.listeners['loadend'] || []).forEach((f) => { try { f(); } catch { /* ignore */ } });
        });
      }
    }

    const ctx: Record<string, unknown> = {
      console, Buffer, ArrayBuffer, SharedArrayBuffer, Uint8Array, Uint16Array, Uint32Array, Uint8ClampedArray,
      Int8Array, Int16Array, Int32Array, Float32Array, Float64Array, BigInt64Array, BigUint64Array, DataView,
      TextEncoder, TextDecoder, URL, URLSearchParams,
      atob: (v: string) => Buffer.from(String(v), 'base64').toString('binary'),
      btoa: (v: string) => Buffer.from(String(v), 'binary').toString('base64'),
      setTimeout, clearTimeout, setInterval, clearInterval, queueMicrotask, setImmediate,
      crypto: crypto.webcrypto, msCrypto: crypto.webcrypto,
      performance: { now: () => Date.now(), timeOrigin: Date.now(), timing: {}, getEntriesByType: () => [] },
      Image: function Image() { return { addEventListener() {}, src: '' }; },
      Date, Math, JSON, RegExp, Error, TypeError, RangeError, Promise, Symbol, Reflect, Proxy, Map, Set, WeakMap, WeakSet,
      document: documentStub, location, navigator,
      screen: { width: 1536, height: 864, availWidth: 1536, availHeight: 824, colorDepth: 24, pixelDepth: 24 },
      history: { length: 1, pushState() {}, replaceState() {} },
      localStorage: (() => { const m: Record<string, string> = {}; return { getItem: (k: string) => (k in m ? m[k] : null), setItem: (k: string, v: unknown) => { m[k] = String(v); }, removeItem: (k: string) => { delete m[k]; }, clear: () => {} }; })(),
      sessionStorage: (() => { const m: Record<string, string> = {}; return { getItem: (k: string) => (k in m ? m[k] : null), setItem: (k: string, v: unknown) => { m[k] = String(v); }, removeItem: (k: string) => { delete m[k]; }, clear: () => {} }; })(),
      XMLHttpRequest: XHR,
      fetch: async (u: unknown, opt: { method?: string; body?: unknown; headers?: Record<string, string> } = {}) => {
        const url = typeof u === 'string' ? u : (u as { url?: string })?.url ?? '';
        return await new Promise((resolve) => {
          forwardOrFake(opt.method || 'GET', url, opt.body, opt.headers || {}, (status, text) => {
            resolve({ status, ok: status >= 200 && status < 400, text: async () => text, json: async () => JSON.parse(text || '{}'), headers: { get: () => null } });
          });
        });
      },
      WebSocket: function WebSocket() { return { send() {}, close() {}, addEventListener() {} }; },
      importScripts: () => {},
      addEventListener() {}, removeEventListener() {}, dispatchEvent() {}, postMessage() {},
      requestAnimationFrame: (cb: (t: number) => void) => setTimeout(() => cb(Date.now()), 0),
      cancelAnimationFrame: () => {},
      requestIdleCallback: (cb: (d: { timeRemaining: () => number }) => void) => setTimeout(() => cb({ timeRemaining: () => 5 }), 0),
      getComputedStyle: () => ({ getPropertyValue: () => '' }),
      matchMedia: () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {} }),
    };
    ctx.window = ctx;
    ctx.self = ctx;
    ctx.top = ctx;
    ctx.parent = ctx;
    ctx.frames = ctx;
    ctx.global = ctx;
    ctx.globalThis = ctx;
    (documentStub as { defaultView?: unknown }).defaultView = ctx;
    return vm.createContext(ctx);
  }

  private async doInit(): Promise<void> {
    const bdmsSrc = await loadSdkSource(BDMS_ASSET, 'bdms.js', BDMS_CDN);
    const glueSrc = await loadSdkSource(SDK_GLUE_ASSET, 'sdk-glue.js', SDK_GLUE_CDN);

    const ctx = this.buildContext();
    this.ctx = ctx;
    this.tokenReady = new Promise<void>((resolve) => {
      this.tokenReadyResolve = resolve;
    });

    new vm.Script(bdmsSrc, { filename: 'bdms.js' }).runInContext(ctx, { timeout: 20000 });
    new vm.Script(glueSrc, { filename: 'sdk-glue.js' }).runInContext(ctx, { timeout: 20000 });

    const init = (ctx as unknown as { _SdkGlueInit?: (cfg: unknown) => void })._SdkGlueInit;
    if (typeof init !== 'function') {
      throw new Error('sdk-glue 未暴露 _SdkGlueInit');
    }
    init({ appId: PPX_APP_ID, aid: PPX_APP_ID, region: 'cn', bdms: { paths: SIGN_PATHS, boe: false } });

    // 等 bdms 向 mssdk 换回 token(带超时兜底)
    await Promise.race([
      this.tokenReady,
      new Promise<void>((resolve) => setTimeout(resolve, 8000)),
    ]);
    logger.info('皮皮虾 a_bogus 运行时初始化完成');
  }

  private init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.doInit().catch((e) => {
        // 初始化失败则清空，下次可重试
        this.initPromise = null;
        this.ctx = null;
        throw e;
      });
    }
    return this.initPromise;
  }

  /**
   * 重置运行时(token 失效时调用，下次 signUrl 会重新初始化)
   */
  reset(): void {
    this.initPromise = null;
    this.ctx = null;
  }

  /**
   * 为皮皮虾请求路径生成带 a_bogus 的完整 URL
   * @param urlOrPath 形如 '/api/mp/bds/webapi/item_list/?status=1&offset=0&count=10&media_type=3'
   * @returns 注入 a_bogus 后的 URL(相对路径，需自行拼 https://pipix.com)
   */
  async signUrl(urlOrPath: string): Promise<string> {
    await this.init();
    const ctx = this.ctx;
    if (!ctx) throw new Error('皮皮虾签名运行时不可用');

    const full = urlOrPath.startsWith('http') ? urlOrPath : `https://pipix.com${urlOrPath}`;
    this.capture.url = undefined;

    // 驱动一次 hooked XHR，让 bdms 注入 a_bogus
    const driver = `(function(){try{var x=new XMLHttpRequest();x.open('GET',${JSON.stringify(full)});x.setRequestHeader('content-type','application/json');x.send();}catch(e){}})()`;
    vm.runInContext(driver, ctx);

    // 通过函数边界读取，避免 TS 将属性收窄；a_bogus 注入通常同步完成，轮询兜底
    const readCaptured = (): string | undefined => this.capture.url;
    const isSigned = (u: string | undefined): u is string => !!u && u.includes('a_bogus=');
    for (let i = 0; i < 40; i++) {
      if (isSigned(readCaptured())) break;
      await new Promise((r) => setTimeout(r, 25));
    }
    const signed = readCaptured();
    if (!isSigned(signed)) {
      throw new Error('a_bogus 注入失败');
    }
    return signed;
  }
}

export const pipixiaBdms = new PipixiaBdmsRuntime();
