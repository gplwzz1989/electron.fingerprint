import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { $http, createHttpInstance, HttpConfig } from '@/http';
import { MessageType, SendMessageResultOutPut } from '@/service/datasync-service-manager';
import type { ImageInfo } from '../../baseModel';
import { DouyinPublishResult, UploadPartResult } from '../douyin-video';
import { getAuthKey, uploadCover } from '../douyin-base.service';
import { getDouyinUserInfo } from '../douyin-user';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { decodeResponse } from '@/media-platform/douyin/private_msg/re_msg_decode';
import { encodeRequest } from '@/media-platform/douyin/private_msg/send_msg_build';
import { AxiosProxyConfig } from 'axios';
import {
  checkVideoUpload,
  clientSign_v2,
  getUploadedVideoInfo,
  getVideoUploadArgs,
  type DouyinLocalStorageLike,
  UploadAuthInfo,
  uploadedVideoInfo,
  uploadVideoPart,
} from '@/media-platform/douyin/douyin-video.service';
import { aws4Interceptor } from 'aws4-axios';
import { Guid, logger, UploadEmitGate } from '@/utils';
import { errorCode } from '@/media-platform/errorCode';

const DEFAULT_ENVIRONMENT = {
  userAgent: HttpConfig.userAgent,
  appVersion: HttpConfig.userAgent.replace('Mozilla/', ''),
  appCodeName: 'Mozilla',
  language: 'zh-CN',
  platform: 'Win32',
  onLine: true,
  cookieEnabled: true,
  screenWidth: 1477,
  screenHeight: 831,
  timezone: 'Asia/Shanghai',
} as const;

const DEFAULT_REQUEST_OPTIONS = {
  aid: 6383,
  apiUrl: 'https://imapi.douyin.com',
  sendPath: '/v1/message/send',
  sdkVersion: '0.1.8',
  buildNumber: '0d50935:feat/pc-im-group',
  refer: 3,
  authType: 1,
  versionCode: '360000',
  devicePlatform: 'douyin_pc',
  biz: 'douyin_web',
  access: 'web_sdk',
  appName: 'douyin_pc',
  priorityRegion: 'cn',
  deviceId: '0',
  sessionDid: '0',
  textMessageType: 7,
  imageMessageType: 27,
} as const;

const IDENTITY_SECURITY_TOKEN_PATH = '/passport/safe/get_identity_security_token/';
const DOUYIN_WEB_ORIGIN = 'https://www.douyin.com';

const DEFAULT_SESSION = {
  msToken:
    '3qGDRwq8FXYBmPvkWAvWixaKH7N5hR06hFgxJV4ii10a8SEruD6X51odbYINyDFAwuYjT8NSoyToGQGgT6MjTNYmy8SVVh5phAm4Tl7Csh0kXaykidZN-G7Tdo4YtKYZHqQ9IsGEB-bz8u4RKBhO8zuT53uyLpj5ymQPEUP08Q_qo_MIoyoFbQ==',
  verifyFp: 'verify_mo02alfu_5SV8nyVI_1rUf_4TPR_BeUq_3tz9vd9c36Lz',
  conversation: {
    id: '0:1:77354322772:2015874506568715',
    shortId: '7628528816087941638',
    type: 1,
    inboxType: 0,
    ticket:
      '1laWxwIOwRJOwVmkeyTH3Vx52hz7wy1ljAJm5aCAebhCLe6YPWbu2I1ImZkJyYRqzw8vSx3egBEtiARbVW6ZBGa5z4AtqjJuEZgjKzvw6Hw7YHyQDfpKeGcRU',
  },
} as const;

const WEB_MSSDK_ASSET = path.resolve(__dirname, 'assets', 'webmssdk.js');

type HeadersInitLike = Record<string, string>;

interface BrowserRuntimeOptions {
  href?: string;
  userAgent?: string;
  appVersion?: string;
}

interface FrontierSignOutput {
  'X-Bogus'?: string;
}

interface DouyinIdentitySecurityToken {
  token: string;
  deviceId: string;
}

interface BytedAcrawlerGlobal {
  frontierSign?: (input: { 'X-MS-STUB': string }) => FrontierSignOutput;
}

interface RuntimeContext extends Record<string, unknown> {
  byted_acrawler?: BytedAcrawlerGlobal;
}

function createCanvasStub() {
  return {
    getContext() {
      return {
        fillRect() {},
        clearRect() {},
        drawImage() {},
        fillText() {},
        measureText(text: unknown) {
          return { width: String(text ?? '').length * 8 };
        },
        getImageData() {
          return { data: new Uint8ClampedArray(4) };
        },
        putImageData() {},
        createLinearGradient() {
          return { addColorStop() {} };
        },
        beginPath() {},
        closePath() {},
        moveTo() {},
        lineTo() {},
        stroke() {},
        arc() {},
        rect() {},
      };
    },
    toDataURL() {
      return 'data:image/png;base64,AA==';
    },
    width: 300,
    height: 150,
    style: {},
  };
}

function createDocumentStub() {
  return {
    cookie: '',
    hidden: false,
    visibilityState: 'visible',
    documentElement: {
      style: {},
      clientWidth: DEFAULT_ENVIRONMENT.screenWidth,
      clientHeight: DEFAULT_ENVIRONMENT.screenHeight,
    },
    body: {
      appendChild() {},
      removeChild() {},
    },
    createElement(tagName: string) {
      if (String(tagName).toLowerCase() === 'canvas') {
        return createCanvasStub();
      }
      return {
        style: {},
        appendChild() {},
        removeChild() {},
        setAttribute() {},
        getContext() {
          return createCanvasStub().getContext();
        },
      };
    },
    addEventListener() {},
    removeEventListener() {},
  };
}

function createHeadersClass() {
  return class Headers {
    private readonly map: Map<string, string>;

    constructor(init: HeadersInitLike = {}) {
      this.map = new Map(Object.entries(init));
    }

    set(key: string, value: string) {
      this.map.set(String(key), String(value));
    }

    get(key: string) {
      return this.map.get(String(key));
    }

    forEach(callback: (value: string, key: string) => void) {
      for (const [key, value] of this.map.entries()) {
        callback(value, key);
      }
    }
  };
}

function createRequestClass(HeadersClass: ReturnType<typeof createHeadersClass>) {
  return class Request {
    url: string;

    method: string;

    headers: InstanceType<ReturnType<typeof createHeadersClass>>;

    constructor(input: unknown, init: { method?: string; headers?: HeadersInitLike } = {}) {
      this.url =
        typeof input === 'string'
          ? input
          : input && typeof input === 'object' && 'url' in input
          ? String((input as { url?: string }).url ?? '')
          : '';
      this.method = init.method || 'GET';
      this.headers = init.headers instanceof HeadersClass ? init.headers : new HeadersClass(init.headers || {});
    }
  };
}

function createResponseClass(HeadersClass: ReturnType<typeof createHeadersClass>) {
  return class Response {
    private readonly bodyValue: string;

    status: number;

    ok: boolean;

    headers: InstanceType<ReturnType<typeof createHeadersClass>>;

    url: string;

    constructor(body = '', init: { status?: number; headers?: HeadersInitLike; url?: string } = {}) {
      this.bodyValue = String(body);
      this.status = init.status || 200;
      this.ok = this.status >= 200 && this.status < 300;
      this.headers = init.headers instanceof HeadersClass ? init.headers : new HeadersClass(init.headers || {});
      this.url = init.url || '';
    }

    async text() {
      return this.bodyValue;
    }

    async json() {
      return JSON.parse(this.bodyValue || '{}');
    }
  };
}

function createRuntimeContext(options: BrowserRuntimeOptions = {}): vm.Context {
  const document = createDocumentStub();
  const location = {
    href: options.href || 'https://www.douyin.com/chat',
    origin: 'https://www.douyin.com',
    protocol: 'https:',
    host: 'www.douyin.com',
    hostname: 'www.douyin.com',
    pathname: '/chat',
    search: '',
    hash: '',
  };
  const navigator = {
    userAgent: options.userAgent || DEFAULT_ENVIRONMENT.userAgent,
    appVersion: options.appVersion || DEFAULT_ENVIRONMENT.appVersion,
    appCodeName: 'Mozilla',
    language: DEFAULT_ENVIRONMENT.language,
    languages: ['zh-CN', 'zh'],
    platform: DEFAULT_ENVIRONMENT.platform,
    onLine: true,
    cookieEnabled: true,
    hardwareConcurrency: 12,
    deviceMemory: 8,
    webdriver: false,
    plugins: [],
    mimeTypes: [],
  };

  const HeadersClass = createHeadersClass();
  const RequestClass = createRequestClass(HeadersClass);
  const ResponseClass = createResponseClass(HeadersClass);

  const context: RuntimeContext = {
    console,
    Buffer,
    ArrayBuffer,
    Uint8Array,
    Uint16Array,
    Uint32Array,
    Uint8ClampedArray,
    Int8Array,
    Int16Array,
    Int32Array,
    Float32Array,
    Float64Array,
    DataView,
    TextEncoder,
    TextDecoder,
    URL,
    URLSearchParams,
    Headers: HeadersClass,
    Request: RequestClass,
    Response: ResponseClass,
    atob(value: string) {
      return Buffer.from(String(value), 'base64').toString('binary');
    },
    btoa(value: string) {
      return Buffer.from(String(value), 'binary').toString('base64');
    },
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    crypto: crypto.webcrypto,
    performance: {
      now() {
        return Date.now();
      },
      timeOrigin: Date.now(),
    },
    Image: function Image() {},
    document,
    location,
    navigator,
    screen: {
      width: DEFAULT_ENVIRONMENT.screenWidth,
      height: DEFAULT_ENVIRONMENT.screenHeight,
      availWidth: DEFAULT_ENVIRONMENT.screenWidth,
      availHeight: DEFAULT_ENVIRONMENT.screenHeight,
      colorDepth: 24,
      pixelDepth: 24,
    },
    localStorage: {
      getItem() {
        return null;
      },
      setItem() {},
      removeItem() {},
    },
    sessionStorage: {
      getItem() {
        return null;
      },
      setItem() {},
      removeItem() {},
    },
    fetch: async function fetch() {
      return new ResponseClass('{}', {
        status: 200,
        headers: {},
      });
    },
    addEventListener() {},
    removeEventListener() {},
  };

  context.window = context;
  context.self = context;
  context.global = context;
  context.globalThis = context;
  (document as any).defaultView = context;

  return vm.createContext(context);
}

class DouyinWebmssdkRuntime {
  private readonly context: vm.Context;

  private loaded: boolean = false;

  constructor(options: BrowserRuntimeOptions = {}) {
    this.context = createRuntimeContext(options);
  }

  private ensureLoaded() {
    if (this.loaded) {
      return;
    }
    const source = fs.readFileSync(WEB_MSSDK_ASSET, 'utf8');
    new vm.Script(source, { filename: WEB_MSSDK_ASSET }).runInContext(this.context, {
      timeout: 30000,
    });
    this.loaded = true;
  }

  getGlobal<T = unknown>(name: string): T {
    this.ensureLoaded();
    return (this.context as RuntimeContext)[name] as T;
  }
}

export class DouyinPrivateMessageSigner {
  private readonly runtime: DouyinWebmssdkRuntime;

  constructor(options: BrowserRuntimeOptions = {}) {
    this.runtime = new DouyinWebmssdkRuntime(options);
  }

  computeXBogus(msStub: string): string {
    const signer = this.runtime.getGlobal<BytedAcrawlerGlobal>('byted_acrawler');
    if (!signer || typeof signer.frontierSign !== 'function') {
      throw new Error('运行时里没有找到 byted_acrawler.frontierSign');
    }
    const result = signer.frontierSign({
      'X-MS-STUB': msStub,
    });
    const xBogus = result && result['X-Bogus'];
    if (!xBogus) {
      throw new Error('计算 X-Bogus 失败');
    }
    return xBogus;
  }
}

function parseCookieHeader(cookie: string): Map<string, string> {
  const map = new Map<string, string>();
  const parts = String(cookie || '')
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean);

  for (const part of parts) {
    const index = part.indexOf('=');
    if (index < 0) {
      map.set(part, '');
      continue;
    }
    map.set(part.slice(0, index).trim(), part.slice(index + 1));
  }

  return map;
}

function getCookieValue(cookie: string, key: string): string {
  const cookies = parseCookieHeader(cookie);
  return cookies.get(key) || '';
}

function getLocalStorageValue(localstorage: DouyinLocalStorageLike | undefined, key: string): string {
  const value = localstorage?.[key];
  if (typeof value === 'string') {
    return value.trim();
  }
  if (value == null) {
    return '';
  }
  return typeof value === 'object' ? JSON.stringify(value) : String(value).trim();
}

function decodeStorageValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch (e) {
    return value;
  }
}

function parseStorageJson<T = any>(rawValue: string): T | undefined {
  if (!rawValue) {
    return undefined;
  }
  try {
    const value = JSON.parse(decodeStorageValue(rawValue));
    if (typeof value?.data === 'string') {
      return JSON.parse(value.data);
    }
    return value?.data ?? value;
  } catch (e) {
    return undefined;
  }
}

function parseTicketGuardClientData(rawValue: string): Record<string, string> | undefined {
  if (!rawValue) {
    return undefined;
  }
  try {
    const value = decodeStorageValue(rawValue);
    const jsonText = value.trim().startsWith('{') ? value : Buffer.from(value, 'base64').toString('utf-8');
    return JSON.parse(jsonText);
  } catch (e) {
    return undefined;
  }
}

function resolveTicketGuardPublicKey(cookie: string, localstorage?: DouyinLocalStorageLike): string {
  const clientData =
    getLocalStorageValue(localstorage, 'bd_ticket_guard_client_data') ||
    getCookieValue(cookie, 'bd_ticket_guard_client_data');
  const clientDataV2 =
    getLocalStorageValue(localstorage, 'bd_ticket_guard_client_data_v2') ||
    getCookieValue(cookie, 'bd_ticket_guard_client_data_v2');
  const data = parseTicketGuardClientData(clientData) || parseTicketGuardClientData(clientDataV2);
  return data?.['bd-ticket-guard-ree-public-key'] || data?.ree_public_key || '';
}

function resolveTicketGuardWebVersion(cookie: string, localstorage?: DouyinLocalStorageLike): string {
  const rawValue =
    getLocalStorageValue(localstorage, 'security-sdk/s_sdk_sign_data_key/web_protect') ||
    getCookieValue(cookie, 'security-sdk/s_sdk_sign_data_key/web_protect');
  const signObj = parseStorageJson<{ ticket?: string }>(rawValue);
  return signObj?.ticket?.startsWith('hash') ? '2' : '1';
}

function resolveMsToken(cookie: string, localstorage?: DouyinLocalStorageLike): string {
  return getLocalStorageValue(localstorage, 'msToken') || getCookieValue(cookie, 'msToken') || DEFAULT_SESSION.msToken;
}

function resolveVerifyFp(cookie: string, localstorage?: DouyinLocalStorageLike): string {
  return (
    getLocalStorageValue(localstorage, 's_v_web_id') ||
    getLocalStorageValue(localstorage, 'fp') ||
    getCookieValue(cookie, 's_v_web_id') ||
    getCookieValue(cookie, 'fp') ||
    DEFAULT_SESSION.verifyFp
  );
}

function resolveBizTraceId(cookie: string, localstorage?: DouyinLocalStorageLike): string {
  return (
    getLocalStorageValue(localstorage, 'biz_trace_id') ||
    getCookieValue(cookie, 'biz_trace_id') ||
    crypto.randomBytes(4).toString('hex')
  );
}

function resolvePassportCsrfToken(cookie: string): string {
  return getCookieValue(cookie, 'passport_csrf_token') || getCookieValue(cookie, 'passport_csrf_token_default');
}

function computeABogus(signer: DouyinPrivateMessageSigner, content: Buffer | Uint8Array | string): string {
  const msStub = crypto.createHash('md5').update(content).digest('hex');
  return signer.computeXBogus(msStub);
}

async function buildTicketGuardHeaders(
  cookie: string,
  localstorage?: DouyinLocalStorageLike,
  path: string = DEFAULT_REQUEST_OPTIONS.sendPath,
): Promise<HeadersInitLike> {
  const signValue = await clientSign_v2(cookie, 'comment', {
    path,
    localstorage,
  });
  return {
    'bd-ticket-guard-web-version': resolveTicketGuardWebVersion(cookie, localstorage),
    'bd-ticket-guard-version': '2',
    'bd-ticket-guard-iteration-version': '1',
    'bd-ticket-guard-web-sign-type': '1',
    'bd-ticket-guard-ree-public-key': resolveTicketGuardPublicKey(cookie, localstorage),
    'bd-ticket-guard-client-data': signValue,
  };
}

function buildIdentitySecurityTokenUrl(
  cookie: string,
  localstorage: DouyinLocalStorageLike | undefined,
  signer: DouyinPrivateMessageSigner,
): { url: URL; bizTraceId: string } {
  const bizTraceId = resolveBizTraceId(cookie, localstorage);
  const url = new URL(`${DOUYIN_WEB_ORIGIN}${IDENTITY_SECURITY_TOKEN_PATH}`);
  url.searchParams.set('passport_jssdk_version', '4.2.3');
  url.searchParams.set('passport_jssdk_type', 'lite');
  url.searchParams.set('is_from_ttaccountsdk', '1');
  url.searchParams.set('aid', String(DEFAULT_REQUEST_OPTIONS.aid));
  url.searchParams.set('language', 'zh');
  url.searchParams.set('scene', 'web_im');
  url.searchParams.set('auto_retry_req', '0');
  url.searchParams.set('skip_verify', 'false');
  url.searchParams.set('identity_token_force_get_tag', '0');
  url.searchParams.set('biz_trace_id', bizTraceId);
  url.searchParams.set('id_token_version', '1.2.10');
  url.searchParams.set('msToken', resolveMsToken(cookie, localstorage));

  const signContent = `${url.pathname}?${url.searchParams.toString()}`;
  url.searchParams.set('a_bogus', computeABogus(signer, signContent));
  return { url, bizTraceId };
}

async function getDouyinIdentitySecurityToken(
  cookie: string,
  localstorage: DouyinLocalStorageLike | undefined,
  signer: DouyinPrivateMessageSigner,
  proxyAgent?: object,
): Promise<DouyinIdentitySecurityToken> {
  try {
    const { url, bizTraceId } = buildIdentitySecurityTokenUrl(cookie, localstorage, signer);
    const ticketGuardHeaders = await buildTicketGuardHeaders(cookie, localstorage, IDENTITY_SECURITY_TOKEN_PATH);
    const response = await $http.get(url.toString(), {
      headers: {
        Accept: 'application/json, text/javascript',
        Cookie: String(cookie).trim(),
        Referer: `${DOUYIN_WEB_ORIGIN}/chat`,
        'User-Agent': DEFAULT_ENVIRONMENT.userAgent,
        'x-tt-passport-csrf-token': resolvePassportCsrfToken(cookie),
        'x-tt-passport-trace-id': bizTraceId,
        ...ticketGuardHeaders,
      },
      httpAgent: proxyAgent,
      httpsAgent: proxyAgent,
    });
    const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
    const token = data?.data?.identity_security_token?.toString()?.trim();
    const deviceId = data?.data?.device_id?.toString()?.trim();
    if (!token || !deviceId) {
      throw new Error('获取私信身份安全令牌失败,请稍后重试');
    }
    return { token, deviceId };
  } catch (e) {
    if (e instanceof Error && e.message.includes('账号签名信息缺失')) {
      throw e;
    }
    throw new Error('获取私信身份安全令牌失败,请稍后重试');
  }
}

function buildContent(text: string): string {
  return JSON.stringify({
    aweType: 700,
    type: 0,
    richTextInfos: [],
    text,
  });
}

interface MessageImageResourceUrl {
  oid: string;
  skey: string;
  data_size: number;
  md5: string;
}

interface MessageImageContent {
  resource_url: MessageImageResourceUrl;
  cover_height: number;
  cover_width: number;
  check_pics: string[];
  md5: string;
  from_gallery: 1;
  aweType: 2702;
}

interface SendMessagePayload {
  content: string;
  messageType: number;
}

function buildImageContent(imageInfo: ImageInfo, uploadedImage: uploadedVideoInfo): string {
  const resultItem = uploadedImage.Result.Results?.[0];
  const md5 = resultItem?.Encryption?.SourceMd5 ?? '';
  const content: MessageImageContent = {
    resource_url: {
      oid: resultItem?.Encryption?.Uri,
      skey: resultItem?.Encryption?.SecretKey ?? '',
      data_size: resultItem?.Encryption?.Extra?.img_size ?? imageInfo.size ?? 0,
      md5,
    },
    cover_height: resultItem?.Encryption?.Extra?.img_height ?? imageInfo.height ?? 0,
    cover_width: resultItem?.Encryption?.Extra?.img_width ?? imageInfo.width ?? 0,
    check_pics: [],
    md5,
    from_gallery: 1,
    aweType: 2702,
  };

  if (!content.resource_url.oid || !content.resource_url.skey || !content.resource_url.md5) {
    throw new Error('图片上传信息不完整');
  }

  return JSON.stringify(content);
}

async function buildSendMessagePayload(
  input: SendDouyinPrivateMessageInput,
  clientMessageId: string,
  result: SendMessageResultOutPut,
): Promise<SendMessagePayload | undefined> {
  if (input.messageType === MessageType.text || !input.messageType) {
    return {
      content: buildContent(input.text),
      messageType: DEFAULT_REQUEST_OPTIONS.textMessageType,
    };
  }
  if (input.messageType === MessageType.image && !input.imageInfo?.pathOrUrl) {
    result.code = 400;
    result.msg = '图片地址不能为空';
    return undefined;
  }
  if (!input.userId) {
    const userInfo = await getDouyinUserInfo(input.cookie, input.proxy);
    if (!userInfo?.yixiaoerId) {
      result.code = userInfo?.code && userInfo.code !== 0 ? userInfo.code : -1;
      result.msg = userInfo?.msg ?? '获取当前账号信息失败';
      return undefined;
    }
    input.userId = userInfo.yixiaoerId;
  }

  const uploadResult: DouyinPublishResult = {
    code: 0,
    msg: '',
    taskId: clientMessageId,
  };
  const uploadedImageInfo = await uploadMsgImageAndVideo(
    input.imageInfo as ImageInfo,
    uploadResult,
    input.userId,
    1,
    input.cookie,
  );

  if (!uploadedImageInfo?.Result?.Results?.length) {
    result.code = uploadResult.code && uploadResult.code !== 0 ? uploadResult.code : -1;
    const uploadErrorMsg = uploadedImageInfo?.status_msg ?? '';
    result.msg = uploadResult.msg || (uploadErrorMsg ? `图片上传失败:${uploadErrorMsg}` : '图片上传失败');
    return undefined;
  }

  return {
    content: buildImageContent(input.imageInfo as never, uploadedImageInfo),
    messageType: DEFAULT_REQUEST_OPTIONS.imageMessageType,
  };
}

function buildStime(): string {
  const suffix = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `${Date.now()}.${suffix}`;
}

function buildHeaders(identity: DouyinIdentitySecurityToken): HeadersInitLike {
  return {
    identity_security_token: JSON.stringify({
      token: identity.token,
    }),
    identity_security_device_id: identity.deviceId,
    identity_security_aid: '',
    session_aid: String(DEFAULT_REQUEST_OPTIONS.aid),
    session_did: DEFAULT_REQUEST_OPTIONS.sessionDid,
    app_name: DEFAULT_REQUEST_OPTIONS.appName,
    priority_region: DEFAULT_REQUEST_OPTIONS.priorityRegion,
    user_agent: DEFAULT_ENVIRONMENT.userAgent,
    cookie_enabled: String(DEFAULT_ENVIRONMENT.cookieEnabled),
    browser_language: DEFAULT_ENVIRONMENT.language,
    browser_platform: DEFAULT_ENVIRONMENT.platform,
    browser_name: DEFAULT_ENVIRONMENT.appCodeName,
    browser_version: DEFAULT_ENVIRONMENT.appVersion,
    browser_online: String(DEFAULT_ENVIRONMENT.onLine),
    screen_width: String(DEFAULT_ENVIRONMENT.screenWidth),
    screen_height: String(DEFAULT_ENVIRONMENT.screenHeight),
    referer: '',
    timezone_name: DEFAULT_ENVIRONMENT.timezone,
    deviceId: DEFAULT_REQUEST_OPTIONS.deviceId,
    'is-retry': '0',
  };
}

export interface SendDouyinPrivateMessageInput {
  cookie: string;
  sessionId: string;
  sessionShortId: string;
  text: string;
  /**
   * 图片消息参数
   */
  imageInfo?: ImageInfo;
  localstorage?: DouyinLocalStorageLike;
  ticket?: string;
  conversationType?: number;
  inboxType?: number;
  proxy?: KuaiDaiLiProxy;
  messageType?: MessageType;
  userId?: string;
}

export async function sendDouyinPrivateMessage(input: SendDouyinPrivateMessageInput): Promise<SendMessageResultOutPut> {
  const result: SendMessageResultOutPut = {
    code: 0,
    msg: '',
  };
  const clientMessageId = crypto.randomUUID();
  const ticket = input.ticket?.trim() || '';
  const conversationType = input.conversationType ?? DEFAULT_SESSION.conversation.type;
  const inboxType = input.inboxType ?? DEFAULT_SESSION.conversation.inboxType;
  const messagePayload = await buildSendMessagePayload(input, clientMessageId, result);
  if (!messagePayload) {
    return result;
  }
  const httpAgent = input.proxy?.serverAdd ? createKuaiProxyAgent(input.proxy) : undefined;
  const signer = new DouyinPrivateMessageSigner();
  const identitySecurity = await getDouyinIdentitySecurityToken(input.cookie, input.localstorage, signer, httpAgent);
  const requestBuffer = encodeRequest({
    cmd: 100,
    sequence_id: Math.floor(Date.now() % 1000000),
    sdk_version: DEFAULT_REQUEST_OPTIONS.sdkVersion,
    token: '',
    refer: DEFAULT_REQUEST_OPTIONS.refer,
    inbox_type: inboxType,
    build_number: DEFAULT_REQUEST_OPTIONS.buildNumber,
    body: {
      send_message_body: {
        conversation_id: input.sessionId,
        conversation_type: conversationType,
        conversation_short_id: input.sessionShortId,
        content: messagePayload.content,
        ext: {
          's:mentioned_users': '',
          's:client_message_id': clientMessageId,
          's:stime': buildStime(),
        },
        message_type: messagePayload.messageType,
        ticket,
        client_message_id: clientMessageId,
      },
    },
    device_id: DEFAULT_REQUEST_OPTIONS.deviceId,
    device_platform: DEFAULT_REQUEST_OPTIONS.devicePlatform,
    version_code: DEFAULT_REQUEST_OPTIONS.versionCode,
    headers: buildHeaders(identitySecurity),
    auth_type: DEFAULT_REQUEST_OPTIONS.authType,
    biz: DEFAULT_REQUEST_OPTIONS.biz,
    access: DEFAULT_REQUEST_OPTIONS.access,
  }).finish();

  const verifyFp = resolveVerifyFp(input.cookie, input.localstorage);
  const aBogus = computeABogus(signer, requestBuffer);
  const ticketGuardHeaders = await buildTicketGuardHeaders(input.cookie, input.localstorage);

  const url = new URL(`${DEFAULT_REQUEST_OPTIONS.apiUrl}${DEFAULT_REQUEST_OPTIONS.sendPath}`);
  url.searchParams.set('verifyFp', verifyFp);
  url.searchParams.set('fp', verifyFp);
  url.searchParams.set('msToken', resolveMsToken(input.cookie, input.localstorage));
  url.searchParams.set('a_bogus', aBogus);

  const response = await $http.post(url.toString(), requestBuffer, {
    headers: {
      Accept: 'application/x-protobuf',
      'Content-Type': 'application/x-protobuf',
      Cookie: String(input.cookie).trim(),
      Origin: 'https://www.douyin.com',
      Referer: 'https://www.douyin.com/',
      'User-Agent': DEFAULT_ENVIRONMENT.userAgent,
      ...ticketGuardHeaders,
    },
    responseType: 'arraybuffer',
    timeout: 10000,
    httpAgent,
    httpsAgent: httpAgent,
  });

  const decoded = decodeResponse(Buffer.from(response.data));
  const messageId = decoded?.body?.send_message_body?.server_message_id?.toString();
  if (!messageId || decoded?.body?.send_message_body?.status != 0) {
    const checkStr = decoded?.body?.send_message_body?.check_message?.toString();
    if (decoded?.error_desc && decoded.error_desc !== 'OK') {
      return {
        code: 172400,
        msg: decoded.error_desc,
      };
    }
    const checkObj = JSON.parse(checkStr);
    return {
      code: Number(decoded?.body?.send_message_body?.check_code) ?? decoded?.body?.send_message_body ?? -1,
      msg: `发送失败:${checkObj?.status_msg?.msg_content?.tips ?? decoded?.error_desc ?? ''}`,
    };
  }

  return {
    code: decoded?.body?.send_message_body ?? decoded?.status_code ?? 0,
    msg: decoded?.error_desc ?? '',
    messageId,
  };
}

export const uploadMsgImageAndVideo = async (
  media: ImageInfo,
  pubResult: DouyinPublishResult,
  userId: string,
  maxThread: number,
  cookie: string,
  proxy: AxiosProxyConfig | undefined = undefined,
): Promise<uploadedVideoInfo | null | undefined> => {
  let fileHandle: fs.promises.FileHandle | null = null;
  let mediaBuffer: Buffer | null = null;
  try {
    if (proxy) {
      //console.log('proxy', proxy.host);
    }
    // 获取上传认证参数
    const authData = await getAuthKey(cookie);
    if (!authData?.auth) {
      //console.debug('获取认证参数失败', taskData.taskId, authData);
      pubResult.code = authData.status_code;
      pubResult.msg = '获取认证参数失败:' + (authData.status_msg ?? '');
      if (authData?.status_msg?.includes('用户未登录')) {
        pubResult.msg = '账号登录信息失效，请重新授权此账号再试';
      }
      return null;
    }

    // 获取文件信息
    const isRemoteMedia = media.pathOrUrl.startsWith('http://') || media.pathOrUrl.startsWith('https://');
    let fileSize = 0;
    if (isRemoteMedia) {
      const response = await $http.get(media.pathOrUrl, { responseType: 'arraybuffer' });
      if (response.status > 300) {
        pubResult.msg = '图片下载失败';
        pubResult.code = response.status ?? -1;
        return null;
      }
      mediaBuffer = Buffer.from(response.data);
      fileSize = mediaBuffer.length;
    } else {
      const fileStat = await fs.promises.stat(media.pathOrUrl);
      fileSize = fileStat.size;
      fileHandle = await fs.promises.open(media.pathOrUrl, 'r');
    }
    if (!media.size) {
      media.size = fileSize;
    }
    if (!media.height || !media.width) {
      media.width = 200;
      media.height = 200;
    }
    const readMediaChunk = async (offset: number, length: number): Promise<Buffer | null> => {
      if (mediaBuffer) {
        if (offset >= mediaBuffer.length) {
          return null;
        }
        return mediaBuffer.subarray(offset, Math.min(offset + length, mediaBuffer.length));
      }
      if (!fileHandle) {
        return null;
      }
      const buffer = Buffer.alloc(length);
      const readData = await fileHandle.read(buffer, 0, length, offset);
      if (readData.bytesRead <= 0) {
        return null;
      }
      return readData.buffer.subarray(0, readData.bytesRead);
    };

    // 提取认证信息
    const authResult: UploadAuthInfo = JSON.parse(authData.auth);

    // 初始化 http
    const $httpSign = createHttpInstance();
    $httpSign.interceptors.request.use(
      aws4Interceptor({
        instance: $httpSign,
        options: {
          region: 'cn-north-1',
          service: 'vod',
        },
        credentials: {
          accessKeyId: authResult.AccessKeyID,
          secretAccessKey: authResult.SecretAccessKey,
          sessionToken: authResult.SessionToken,
        },
      }),
    );

    // 获取上传参数
    const uploadVideoArgs = await getVideoUploadArgs(fileSize, userId, $httpSign, undefined, 'image', 'zhenzhen');
    if (!uploadVideoArgs?.Result?.InnerUploadAddress?.UploadNodes) {
      //console.debug('获取上传参数失败', taskData.taskId, uploadVideoArgs);
      pubResult.code = uploadVideoArgs.status_code;
      pubResult.msg = '获取上传参数失败:' + (uploadVideoArgs.status_msg ?? uploadVideoArgs?.Error?.Message ?? '');

      return null;
    }
    // 准备上传分片信息列表
    const uploadedList = new Map<number, string>();

    // 上传id
    const uploadId = Guid.NewGuid().toString();

    // 开始读取并上传文件
    let readIndex = 0;

    // 分片大小
    let blockSize = 3145728; // 500M以下的视频，分片大小为3M，500M以上的视频，分片大小为5M，1G以上的视频大小为10M
    if (fileSize > 1024 * 1024 * 500) {
      blockSize = 1024 * 1024 * 5;
    } else if (fileSize > 1024 * 1024 * 1024) {
      blockSize = 1024 * 1024 * 10;
    }

    // 总片数
    const totalPartNums = Math.ceil(fileSize / blockSize);

    let uploadedParts = 0;

    const emitGate = new UploadEmitGate(fileSize, totalPartNums);
    const onPartUploaded = () => {
      uploadedParts++;
    };

    // 并行上传
    const tasks: Array<Promise<UploadPartResult>> = [];

    //SetProgressEvent(eventCallback, 10, '视频上传中', taskData.taskId);

    // 文件大小小于等单个分片大小
    if (blockSize >= fileSize) {
      const readData = await readMediaChunk(readIndex, fileSize - readIndex);
      if (readData && readData.length > 0) {
        const uploadResult = await uploadVideoPart(readData, 1, blockSize, userId, uploadId, uploadVideoArgs);
        if (!uploadResult?.data?.crc32) {
          pubResult.code = uploadResult.code;
          pubResult.msg = '文件分片上传失败:' + uploadResult.message;

          return null;
        }
        uploadedList.set(uploadResult.partNum, uploadResult.data.crc32);
        //onPartUploaded();
      } else {
        pubResult.code = errorCode.io_error;
        pubResult.msg = '文件读取失败:' + media.pathOrUrl;

        return null;
      }
    }
    // 文件有多个分片
    else {
      let partNum = 0;
      while (readIndex < fileSize) {
        partNum++;

        // SetProgressEvent(
        //   eventCallback,
        //   10 + Number.parseFloat(((partNum / totalPartNums) * 0.7 * 100).toFixed(2).substring(0, 4)),
        //   '视频上传中',
        //   taskData.taskId,
        // );

        let canReadNum = blockSize;
        if (readIndex + blockSize > fileSize) {
          canReadNum = fileSize - readIndex;
        }

        const readData = await readMediaChunk(readIndex, canReadNum);
        if (readData && readData.length > 0) {
          tasks.push(uploadVideoPart(readData, partNum, blockSize, userId, uploadId, uploadVideoArgs));

          if (tasks.length > maxThread) {
            const uploadResult = await Promise.race(tasks);
            if (!uploadResult?.data?.crc32) {
              pubResult.code = uploadResult.code;
              pubResult.msg = '文件分片上传失败:' + uploadResult.message;

              return null;
            }

            uploadedList.set(uploadResult.partNum, uploadResult.data.crc32);
            const uploadResultNew = await tasks.splice(0, 1)[0];
            if (!uploadResultNew?.data?.crc32) {
              pubResult.code = uploadResultNew.code;
              pubResult.msg = '文件分片上传失败:' + uploadResultNew.message;

              return null;
            }

            uploadedList.set(uploadResultNew.partNum, uploadResultNew.data.crc32);
            onPartUploaded();
          }

          readIndex += readData.length;

          if (canReadNum < blockSize) {
            break;
          }
        } else {
          pubResult.code = errorCode.io_error;
          pubResult.msg = '文件读取失败:' + media.pathOrUrl;

          return null;
        }
      }
    }
    while (tasks.length > 0) {
      const uploadResult = await tasks.splice(0, 1)[0];
      if (!uploadResult?.data?.crc32) {
        pubResult.code = uploadResult.code;
        pubResult.msg = '文件分片上传失败:' + uploadResult.message;

        return null;
      }
      uploadedList.set(uploadResult.partNum, uploadResult.data?.crc32 ?? '');
      onPartUploaded();
    }

    const uploadStrList: Array<string> = [];

    if (uploadedList.size < totalPartNums) {
      ///console.debug('视频上传失败', taskData.taskId, uploadedList);
      pubResult.code = errorCode.io_error;
      pubResult.msg = '文件上传失败:' + media.pathOrUrl;

      return null;
    }

    for (let i = 1; i <= uploadedList.size; i++) {
      uploadStrList.push(`${i}:${uploadedList.get(i)}`);
    }

    const uploadResultList = uploadStrList.join(',');

    // 检查视频上传是否成功
    const checkResult = await checkVideoUpload(userId, uploadId, uploadResultList, uploadVideoArgs);
    if (!checkResult.data?.hash) {
      //console.debug('视频上传校验失败', taskData.taskId, uploadedList, checkResult);

      pubResult.code = -1;
      pubResult.msg = '上传校验失败:' + (checkResult.message ?? '');

      return null;
    }

    //获取上传完成的视频信息
    const uploadVideoInfo = await getUploadedVideoInfo(userId, uploadVideoArgs, $httpSign, undefined, true, 'zhenzhen');
    if (!(uploadVideoInfo?.Result?.Results?.length > 0)) {
      //console.debug('获取视频信息失败', taskData.taskId, uploadedList, uploadVideoInfo);

      pubResult.code = -1;
      pubResult.msg = '获取文件信息失败:' + (uploadVideoInfo.status_msg ?? '');

      return null;
    }
    pubResult.code = 0;
    pubResult.msg = '';
    return uploadVideoInfo;
    // endregion
  } catch (e) {
    logger.error(`抖音消息文件上传异常失败,${(e as Error)?.message}`);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = '文件上传失败';
    return null;
  } finally {
    fileHandle?.close();
  }
};
