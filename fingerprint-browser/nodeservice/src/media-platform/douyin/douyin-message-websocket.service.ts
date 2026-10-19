import WebSocket from 'ws';
import crypto from 'crypto';
import vm from 'vm';
import zlib from 'zlib';
import { Buffer } from 'buffer';
import { BaseWebSocketService } from '@/cloud/task/base-websocket.service';
import { logger } from '@/utils';
import { createKuaiProxyAgent, IWebProxy } from '@/media-platform/webproxy';
import {
  CommentBackItem,
  MessageBackItem,
  MessageType,
  Platforms,
  SessionType,
} from '@/service/datasync-service-manager';
import { getDouyinUserInfo } from '@/media-platform/douyin/douyin-user';
import { $http } from '@/http';

const DEFAULT_FP_ID = '32';
const DEFAULT_AID = '6383';
const DEFAULT_CONN_TAG = 'aweme_pc_web';
const DEFAULT_VERSION_CODE = 'fws_1.0.0';
const DEFAULT_NOTICE_PC_APP_KEY = '32a1ede44a8715fd38c64d52cbd6dc7f5b';
const DEFAULT_NOTICE_PC_SALT = 'f8a69f1719916z';
const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36';
const DEFAULT_ACRAWLER_AID = 99999999;
const DEFAULT_PAGE_REFERER = 'https://www.douyin.com/';
const DEFAULT_PROTOCOLS = ['pbbp2'];
const DEFAULT_PING_INTERVAL = 15000;
const DEFAULT_PING_TIMEOUT = 4000;

interface DouyinMessageWebSocketServiceOptions {
  cookie: string;
  deviceId?: string;
  pageUrl?: string;
  referer?: string;
  proxy?: IWebProxy;
  accountId?: string;
}

interface DouyinNoticeEventPayload {
  id?: string;
  noticeType: 'dm' | 'comment' | 'like' | 'follow' | 'notice';
  summary: string;
  payloadObject?: Record<string, any> | null;
  frame?: Record<string, any>;
}

interface NoticeDeviceInfo {
  source: 'manual' | 'profile_page' | 'profile_page_challenge';
  deviceId: string;
  profileUrl?: string;
}

interface DouyinNewMessageEvent {
  messages: MessageBackItem[];
  raw?: DouyinNoticeEventPayload;
}

interface DouyinNewCommentEvent {
  comments: CommentBackItem[];
  raw?: DouyinNoticeEventPayload;
}

export class DouyinMessageWebSocketService extends BaseWebSocketService {
  private cookie: string;
  private proxy?: IWebProxy;
  private explicitDeviceId?: string;
  private pageUrl?: string;
  private referer: string;
  private accountId: string;
  private wsUrl?: string;
  private resolvedDeviceInfo?: NoticeDeviceInfo;
  private heartbeatAckTimer?: NodeJS.Timeout;

  constructor(options: DouyinMessageWebSocketServiceOptions) {
    super();
    this.cookie = options.cookie;
    this.proxy = options.proxy;
    this.explicitDeviceId = String(options.deviceId || '').trim() || undefined;
    this.pageUrl = String(options.pageUrl || '').trim() || undefined;
    this.referer = String(options.referer || '').trim() || DEFAULT_PAGE_REFERER;
    this.accountId = String(options.accountId || '').trim();
    this.heartbeatInterval = DEFAULT_PING_INTERVAL;
  }

  protected getPlatformName(): string {
    return '抖音';
  }

  protected getWebSocketProtocols(): string | string[] | undefined {
    return DEFAULT_PROTOCOLS;
  }

  protected getWebSocketOptions(): WebSocket.ClientOptions {
    if (!this.proxy?.serverAdd) {
      return {
        perMessageDeflate: false,
      };
    }

    return {
      agent: createKuaiProxyAgent(this.proxy),
      perMessageDeflate: false,
    };
  }

  protected getWebSocketUrl(): string {
    if (!this.wsUrl || !this.resolvedDeviceInfo?.deviceId) {
      throw new Error('抖音WebSocket连接地址未初始化');
    }

    return this.wsUrl;
  }

  protected getWebSocketHeaders(): Record<string, string> {
    return {
      Origin: 'https://www.douyin.com',
      'User-Agent': DEFAULT_USER_AGENT,
      Cookie: this.cookie,
    };
  }

  public async prepareConnection(): Promise<void> {
    await this.ensureConnectionInfo();
  }

  public connect(): void {
    if (!this.wsUrl || !this.resolvedDeviceInfo?.deviceId) {
      logger.error('抖音WebSocket连接初始化失败：缺少连接参数');
      this.emit('authFailed', '抖音WebSocket连接初始化失败：缺少连接参数');
      return;
    }

    super.connect();
  }

  protected onConnected(): void {
    super.onConnected();
    this.emit('deviceResolved', {
      deviceId: this.resolvedDeviceInfo?.deviceId ?? '',
      source: this.resolvedDeviceInfo?.source ?? '',
      pageUrl: this.resolvedDeviceInfo?.profileUrl ?? '',
      wsUrl: this.wsUrl ?? '',
    });
  }

  protected sendHeartbeat(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send('hi');
      this.logNonProd('抖音发送WebSocket心跳');
      this.resetHeartbeatAckTimer();
    }
  }

  protected handleMessage(data: WebSocket.Data): void {
    try {
      const normalizedData = this.normalizeData(data);
      const parsed = this.parseNoticeMessage(normalizedData);

      if (parsed.summary === 'hi') {
        this.clearHeartbeatAckTimer();
        return;
      }
      //
      if (parsed.noticeType === 'notice') {
        const event = {
          //messages,
          //raw: parsed,
        } as DouyinNewMessageEvent;
        this.emit('newMessage', event);
      }
      if (parsed.noticeType === 'dm') {
        const messages = this.buildMessageBackItems(parsed);
        if (messages.length > 0) {
          const event = {
            //messages,
            //raw: parsed,
          } as DouyinNewMessageEvent;
          this.emit('newMessage', event);
        }
        return;
      }

      if (parsed.noticeType === 'comment') {
        const comments = this.buildCommentBackItems(parsed);
        if (comments.length > 0) {
          const event: DouyinNewCommentEvent = {
            comments,
            //raw: parsed,
          };
          this.emit('newComment', event);
        }
      }
    } catch (error) {
      logger.error(`抖音处理WebSocket消息失败:${error}`);
    }
  }

  public updateCookie(cookie: string, deviceId?: string, proxy?: IWebProxy): void {
    this.cookie = cookie;
    this.proxy = proxy;
    this.explicitDeviceId = String(deviceId || this.explicitDeviceId || '').trim() || undefined;
    this.wsUrl = undefined;
    this.resolvedDeviceInfo = undefined;
    this.clearHeartbeatAckTimer();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    this.isClosed = true;
    if (this.ws) {
      try {
        this.ws.close();
      } catch (error) {
        logger.error(`抖音关闭旧WebSocket失败:${error}`);
      }
      this.ws = undefined;
    }

    this.stopHeartbeat();
    this.isConnecting = false;
    this.isClosed = false;

    setTimeout(() => {
      void this.prepareConnection()
        .then(() => {
          this.connect();
        })
        .catch((error) => {
          logger.error(`抖音更新Cookie后重新初始化连接失败:${error}`);
          this.emit('authFailed', '抖音更新Cookie后重新初始化连接失败');
        });
    }, 1000);
  }

  public close(): void {
    this.clearHeartbeatAckTimer();
    super.close();
  }

  public getResolvedDeviceInfo(): NoticeDeviceInfo | undefined {
    return this.resolvedDeviceInfo;
  }

  private async ensureConnectionInfo(): Promise<void> {
    if (this.wsUrl && this.resolvedDeviceInfo?.deviceId) {
      return;
    }

    const deviceInfo = await this.resolveDeviceInfo();
    this.resolvedDeviceInfo = deviceInfo;
    this.wsUrl = this.buildNoticePcUrl(deviceInfo.deviceId);
  }

  private async resolveDeviceInfo(): Promise<NoticeDeviceInfo> {
    if (this.explicitDeviceId) {
      return {
        source: 'manual',
        deviceId: this.explicitDeviceId,
      };
    }

    const profileUrl = await this.resolveProfileUrl();
    return await this.fetchDeviceInfoFromProfilePage(profileUrl);
  }

  private async resolveProfileUrl(): Promise<string> {
    if (this.pageUrl) {
      return this.pageUrl;
    }

    const userInfo = await getDouyinUserInfo(this.cookie, this.proxy);
    const rawUser = userInfo?.raw as Record<string, any> | undefined;
    const secUid = String(userInfo?.user?.sec_uid || rawUser?.sec_uid || '').trim();
    if (!secUid) {
      throw new Error('获取抖音device_id失败：无法获取用户主页标识');
    }

    this.pageUrl = `https://www.douyin.com/user/${secUid}`;
    return this.pageUrl;
  }

  private calculateAccessKey(deviceId: string): string {
    return crypto
      .createHash('md5')
      .update(`${DEFAULT_NOTICE_PC_APP_KEY}${deviceId}${DEFAULT_NOTICE_PC_SALT}`)
      .digest('hex');
  }

  private buildNoticePcUrl(deviceId: string): string {
    if (!deviceId) {
      throw new Error('生成抖音通知WebSocket地址失败：缺少device_id');
    }

    const searchParams = new URLSearchParams({
      device_platform: 'web',
      version_code: DEFAULT_VERSION_CODE,
      access_key: this.calculateAccessKey(deviceId),
      fpid: DEFAULT_FP_ID,
      aid: DEFAULT_AID,
      device_id: deviceId,
      xsack: '0',
      xaack: '0',
      xsqos: '0',
      qos_sdk_version: '2',
      conn_tag: DEFAULT_CONN_TAG,
    });

    return `wss://frontier-pc.douyin.com/ws/v2?${searchParams.toString()}`;
  }

  private async fetchDeviceInfoFromProfilePage(profileUrl: string): Promise<NoticeDeviceInfo> {
    const firstResponse = await this.getText(profileUrl, this.cookie);
    if (firstResponse.statusCode >= 400) {
      throw new Error(`获取抖音device_id失败：请求主页返回 HTTP ${firstResponse.statusCode}`);
    }

    let bodyText = firstResponse.bodyText || '';
    let deviceId = this.extractUserUniqueId(bodyText);

    if (!deviceId && this.isChallengePage(bodyText)) {
      const nonce = this.extractCookieValue(firstResponse.headers?.['set-cookie'], '__ac_nonce');
      if (!nonce) {
        throw new Error('获取抖音device_id失败：挑战页缺少__ac_nonce');
      }

      const signature = this.calculateAcSignature({
        nonce,
        bodyText,
        pageUrl: profileUrl,
        referer: this.referer,
        cookie: this.mergeCookieValues(this.cookie, `__ac_nonce=${nonce}`),
      });

      const verifiedCookie = this.mergeCookieValues(
        this.cookie,
        `__ac_nonce=${nonce}`,
        `__ac_signature=${signature}`,
        `__ac_referer=${encodeURIComponent(this.referer)}`,
      );

      const verifiedResponse = await this.getText(profileUrl, verifiedCookie);
      if (verifiedResponse.statusCode >= 400) {
        throw new Error(`获取抖音device_id失败：挑战跳转后返回 HTTP ${verifiedResponse.statusCode}`);
      }

      bodyText = verifiedResponse.bodyText || '';
      deviceId = this.extractUserUniqueId(bodyText);

      if (deviceId) {
        return {
          source: 'profile_page_challenge',
          deviceId,
          profileUrl,
        };
      }
    }

    if (!deviceId) {
      throw new Error('获取抖音device_id失败：用户主页中未找到user_unique_id');
    }

    return {
      source: 'profile_page',
      deviceId,
      profileUrl,
    };
  }

  private async getText(
    urlString: string,
    cookie: string,
  ): Promise<{ statusCode: number; headers: any; bodyText: string }> {
    try {
      new URL(urlString);
    } catch (error) {
      throw new Error('获取抖音主页内容失败：请求地址无效');
    }

    try {
      const proxyAgent = this.proxy?.serverAdd ? createKuaiProxyAgent(this.proxy) : undefined;
      const response = await $http.get(urlString, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9',
          'Accept-Encoding': 'br',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          Referer: this.referer,
          Origin: 'https://www.douyin.com',
          'User-Agent': DEFAULT_USER_AGENT,
          Cookie: cookie,
        },
        httpAgent: proxyAgent,
        httpsAgent: proxyAgent,
      });

      const bodyText = this.decodeResponseBody(
        Buffer.isBuffer(response.data) ? response.data : Buffer.from(response.data),
        response.headers?.['content-encoding'],
      );

      return {
        statusCode: response.status || 0,
        headers: response.headers,
        bodyText,
      };
    } catch (error) {
      throw new Error('获取抖音主页内容失败：网络请求异常');
    }
  }

  private decodeResponseBody(buffer: Buffer, contentEncoding: string | string[] | undefined): string {
    const encoding = String(contentEncoding || '').toLowerCase();
    if (encoding.includes('br')) {
      return zlib.brotliDecompressSync(buffer).toString('utf8');
    }
    if (encoding.includes('gzip')) {
      return zlib.gunzipSync(buffer).toString('utf8');
    }
    if (encoding.includes('deflate')) {
      return zlib.inflateSync(buffer).toString('utf8');
    }
    return buffer.toString('utf8');
  }

  private extractUserUniqueId(bodyText: string): string {
    const deviceId = bodyText?.split('\\"user_unique_id\\":\\"')[1]?.split('\\"')[0];

    return deviceId;
  }

  private isChallengePage(bodyText: string): boolean {
    return (
      bodyText.includes('window.byted_acrawler.init') &&
      bodyText.includes('__ac_signature') &&
      bodyText.includes('window.location.reload()')
    );
  }

  private calculateAcSignature(input: {
    nonce: string;
    bodyText: string;
    pageUrl: string;
    referer: string;
    cookie: string;
  }): string {
    const challengeScript = this.extractChallengeBootstrapScript(input.bodyText);
    if (!challengeScript) {
      throw new Error('计算抖音__ac_signature失败：未找到挑战脚本');
    }

    const runtime = this.buildChallengeRuntime({
      pageUrl: input.pageUrl,
      referer: input.referer,
      cookie: input.cookie,
    });

    new vm.Script(challengeScript, { filename: 'douyin-challenge.js' }).runInContext(runtime.context, {
      timeout: 10000,
    });

    const acrawler = (runtime.windowObject as any).byted_acrawler;
    if (!acrawler || typeof acrawler.init !== 'function' || typeof acrawler.sign !== 'function') {
      throw new Error('计算抖音__ac_signature失败：挑战脚本未生成签名函数');
    }

    acrawler.init({ aid: DEFAULT_ACRAWLER_AID, dfp: 0 });
    return String(acrawler.sign('', input.nonce) || '').trim();
  }

  private extractChallengeBootstrapScript(bodyText: string): string {
    const scriptMatches = String(bodyText || '').match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
    for (const scriptTag of scriptMatches) {
      const inlineMatch = scriptTag.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
      const scriptText = inlineMatch?.[1] || '';
      if (scriptText.includes('_$jsvmprt(')) {
        return scriptText;
      }
    }
    return '';
  }

  private buildChallengeRuntime(options: { pageUrl: string; referer: string; cookie: string }) {
    const parsedUrl = new URL(options.pageUrl);
    const createStorage = () => {
      const store = new Map<string, string>();
      return {
        getItem(key: string) {
          return store.has(key) ? store.get(key) : null;
        },
        setItem(key: string, value: string) {
          store.set(String(key), String(value));
        },
        removeItem(key: string) {
          store.delete(String(key));
        },
        clear() {
          store.clear();
        },
      };
    };

    const location = {
      protocol: parsedUrl.protocol,
      href: parsedUrl.toString(),
      host: parsedUrl.host,
      hostname: parsedUrl.hostname,
      pathname: parsedUrl.pathname,
      search: parsedUrl.search,
      hash: parsedUrl.hash,
      reload() {},
    };

    const document = {
      cookie: options.cookie,
      referrer: options.referer,
      visibilityState: 'visible',
      wasDiscarded: false,
      createElement() {
        return {
          style: {},
          getContext() {
            return {};
          },
        };
      },
      getElementsByTagName() {
        return [];
      },
      querySelector() {
        return null;
      },
      querySelectorAll() {
        return [];
      },
      addEventListener() {},
      removeEventListener() {},
      body: {},
      documentElement: {
        clientWidth: 1477,
        clientHeight: 831,
      },
    };

    const windowObject: Record<string, any> = {
      window: null,
      global: null,
      document,
      location,
      navigator: {
        userAgent: DEFAULT_USER_AGENT,
        language: 'zh-CN',
        languages: ['zh-CN', 'zh'],
        platform: 'Win32',
        webdriver: false,
        plugins: [],
        mimeTypes: [],
      },
      screen: {
        width: 1477,
        height: 831,
        availWidth: 1477,
        availHeight: 831,
        colorDepth: 24,
        pixelDepth: 24,
      },
      history: {
        length: 1,
        pushState() {},
        replaceState() {},
      },
      performance: {
        timing: {
          navigationStart: Date.now(),
        },
        now: () => 0,
      },
      localStorage: createStorage(),
      sessionStorage: createStorage(),
      console,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      TextEncoder,
      TextDecoder,
      atob(value: string) {
        return Buffer.from(value, 'base64').toString('binary');
      },
      btoa(value: string) {
        return Buffer.from(value, 'binary').toString('base64');
      },
      fetch: async () => ({
        ok: true,
        json: async () => ({}),
        text: async () => '',
      }),
      XMLHttpRequest: function XMLHttpRequest() {
        this.open = function open() {};
        this.send = function send() {};
        this.setRequestHeader = function setRequestHeader() {};
      },
      Image: function Image() {},
      HTMLElement: function HTMLElement() {},
      HTMLCanvasElement: function HTMLCanvasElement() {},
      Request,
      Headers,
      WebSocket,
      JSON,
      Math,
      Date,
      String,
      Array,
      Object,
      Number,
      Boolean,
      RegExp,
      Promise,
      Error,
      TypeError,
      decodeURIComponent,
      encodeURIComponent,
      encodeURI,
      decodeURI,
      parseInt,
      parseFloat,
      isNaN,
      Infinity,
      NaN,
    };

    windowObject.window = windowObject;
    windowObject.global = windowObject;

    return {
      windowObject,
      context: vm.createContext(windowObject),
    };
  }

  private extractCookieValue(cookieItems: string | string[] | undefined, key: string): string {
    const items = Array.isArray(cookieItems) ? cookieItems : cookieItems ? [cookieItems] : [];
    for (const item of items) {
      const normalizedItem = String(item || '');
      if (normalizedItem.startsWith(`${key}=`)) {
        return normalizedItem.split(';')[0].slice(key.length + 1);
      }
    }
    return '';
  }

  private mergeCookieValues(...cookieParts: Array<string | undefined>): string {
    const cookieMap = new Map<string, string>();
    for (const part of cookieParts) {
      const segments = String(part || '')
        .split(';')
        .map((item) => item.trim())
        .filter(Boolean);

      for (const segment of segments) {
        const equalIndex = segment.indexOf('=');
        if (equalIndex <= 0) {
          continue;
        }
        const name = segment.slice(0, equalIndex).trim();
        const value = segment.slice(equalIndex + 1).trim();
        if (name) {
          cookieMap.set(name, value);
        }
      }
    }

    return Array.from(cookieMap.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }

  private normalizeData(data: WebSocket.Data): string | Buffer {
    if (Buffer.isBuffer(data)) {
      return this.normalizeTextFrame(data);
    }
    if (Array.isArray(data)) {
      return this.normalizeTextFrame(Buffer.concat(data));
    }
    return typeof data === 'string' ? data : data.toString();
  }

  private normalizeTextFrame(buffer: Buffer): string | Buffer {
    const text = buffer.toString('utf8');
    const normalizedText = text.trim();

    if (normalizedText === 'hi') {
      return 'hi';
    }

    if (normalizedText && (normalizedText.startsWith('{') || normalizedText.startsWith('['))) {
      return text;
    }

    return buffer;
  }

  private parseNoticeMessage(message: string | Buffer): DouyinNoticeEventPayload {
    if (typeof message === 'string') {
      if (message === 'hi') {
        return {
          noticeType: 'notice',
          summary: 'hi',
          payloadObject: null,
        };
      }

      try {
        const payloadObject = JSON.parse(message);
        return {
          id: String(payloadObject?.id || payloadObject?.ttpush_event_extra?.mid || ''),
          noticeType: this.inferNoticeType(payloadObject),
          summary: this.buildSummary(payloadObject),
          payloadObject,
        };
      } catch (error) {
        return {
          noticeType: 'notice',
          summary: message,
          payloadObject: null,
        };
      }
    }

    const frame = this.decodeFrontierFrame(message);
    const payloadText = Buffer.from(frame.payload || Buffer.alloc(0)).toString('utf8');
    let payloadObject: Record<string, any> | null = null;
    try {
      payloadObject = JSON.parse(payloadText);
    } catch (error) {}

    if (!payloadObject) {
      return {
        noticeType: 'notice',
        summary: `收到未知通知帧 service=${frame.service || 0} method=${frame.method || 0}`,
        payloadObject: null,
        frame,
      };
    }

    return {
      id: String(payloadObject?.id || payloadObject?.ttpush_event_extra?.mid || ''),
      noticeType: this.inferNoticeType(payloadObject),
      summary: this.buildSummary(payloadObject),
      payloadObject,
      frame,
    };
  }

  private inferNoticeType(payloadObject: Record<string, any>): 'dm' | 'comment' | 'like' | 'follow' | 'notice' {
    const eventType = String(payloadObject?.ttpush_event_extra?.event_type || '').toLowerCase();
    const itemType = String(payloadObject?.ttpush_event_extra?.item_type || '').toLowerCase();
    const pushType = String(payloadObject?.ttpush_event_extra?.push_type || '').toLowerCase();
    const rawText = JSON.stringify(payloadObject || {});

    if (eventType === 'im' || itemType === 'im_private' || pushType === 'im' || /chat\/center/i.test(rawText)) {
      return 'dm';
    }
    if (itemType === 'comment' || pushType === 'notice_comment' || /评论了你/i.test(rawText)) {
      return 'comment';
    }
    if (/点赞|click_push_digg|like_merge/i.test(rawText)) {
      return 'like';
    }
    if (/关注/i.test(rawText)) {
      return 'follow';
    }
    return 'notice';
  }

  private buildSummary(payloadObject: Record<string, any>): string {
    const title = this.stripHtmlTags(String(payloadObject?.title || ''));
    const content = this.stripHtmlTags(String(payloadObject?.text || payloadObject?.content || ''));
    if (title && content) {
      return `${title}: ${content}`;
    }
    return content || title || '收到通知事件';
  }

  private stripHtmlTags(text: string): string {
    return String(text || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private decodeFrontierFrame(input: Buffer): Record<string, any> {
    const state = { offset: 0 };
    const frame: Record<string, any> = {
      payload: Buffer.alloc(0),
    };

    while (state.offset < input.length) {
      const tag = Number(this.readVarint(input, state));
      const fieldNumber = tag >>> 3;
      const wireType = tag & 0x07;

      switch (fieldNumber) {
        case 1:
          frame.seqId = String(this.readVarint(input, state));
          break;
        case 2:
          frame.logId = String(this.readVarint(input, state));
          break;
        case 3:
          frame.service = Number(this.readVarint(input, state));
          break;
        case 4:
          frame.method = Number(this.readVarint(input, state));
          break;
        case 6:
          frame.payloadEncoding = this.readLengthDelimited(input, state).toString('utf8');
          break;
        case 7:
          frame.payloadType = this.readLengthDelimited(input, state).toString('utf8');
          break;
        case 8:
          frame.payload = Buffer.from(this.readLengthDelimited(input, state));
          break;
        case 11:
          frame.msgId = this.readLengthDelimited(input, state).toString('utf8');
          break;
        case 12:
          frame.frameType = Number(this.readVarint(input, state));
          break;
        default:
          this.skipField(input, state, wireType);
          break;
      }
    }

    return frame;
  }

  private readVarint(buffer: Buffer, state: { offset: number }): number {
    let result = 0;
    let shift = 0;

    while (state.offset < buffer.length) {
      const current = buffer[state.offset];
      state.offset += 1;
      result |= (current & 0x7f) << shift;
      if ((current & 0x80) === 0) {
        return result;
      }
      shift += 7;
    }

    throw new Error('读取varint失败');
  }

  private readLengthDelimited(buffer: Buffer, state: { offset: number }): Buffer {
    const length = Number(this.readVarint(buffer, state));
    const start = state.offset;
    const end = start + length;
    if (end > buffer.length) {
      throw new Error('读取length-delimited字段失败');
    }
    state.offset = end;
    return buffer.subarray(start, end);
  }

  private skipField(buffer: Buffer, state: { offset: number }, wireType: number): void {
    switch (wireType) {
      case 0:
        this.readVarint(buffer, state);
        return;
      case 1:
        state.offset += 8;
        return;
      case 2:
        this.readLengthDelimited(buffer, state);
        return;
      case 5:
        state.offset += 4;
        return;
      default:
        throw new Error(`不支持的wireType:${wireType}`);
    }
  }

  private buildMessageBackItems(parsed: DouyinNoticeEventPayload): MessageBackItem[] {
    const payload = parsed.payloadObject;
    if (!payload) {
      return [];
    }

    const extra = this.parseExtraStr(payload.extra_str);
    const openUrl = this.parseOpenUrl(payload.open_url);
    const content = this.normalizeDmContent(payload.text);
    const timestamp = this.resolveTimestamp(extra, payload);
    const messageType = this.resolveMessageType(openUrl.msg_type, content);
    const authorId = String(payload?.ttpush_event_extra?.author_id || extra.author_id || '').trim();
    const ownerId = String(payload?.ttpush_event_extra?.uid || '').trim();
    const sessionId = openUrl.conversation_id || '';
    const secSessionId = openUrl.conv_short_id || '';
    const isAuthor = ownerId ? authorId === ownerId : false;
    const messageUserId = this.resolveDmMessageUserId(openUrl, authorId, ownerId, isAuthor);
    const index = this.resolveDmIndex(openUrl);

    const item: MessageBackItem = {
      platform: Platforms.DouYin,
      accountId: this.accountId,
      messageId: String(payload?.ttpush_event_extra?.mid || payload.id || ''),
      content,
      timestamp,
      messageUserId,
      sessionId,
      secSessionId,
      sessionType: this.resolveSessionType(openUrl.conv_type),
      messageOwnerUserId: ownerId,
      messageType,
      index,
      isAuthor,
      fromUserId: authorId,
      toUserId: ownerId,
    };

    return [item];
  }

  private buildCommentBackItems(parsed: DouyinNoticeEventPayload): CommentBackItem[] {
    const payload = parsed.payloadObject;
    if (!payload) {
      return [];
    }

    const extra = this.parseExtraStr(payload.extra_str);
    const item: CommentBackItem = {
      platform: Platforms.DouYin,
      accountId: this.accountId,
      contentId: '', //这里取不到和创作中心一样的id，直接留空
      documentId: String(extra.aweme_id || ''),
      commentId: '', //这里取不到和创作中心一样的id，直接留空
      content: this.normalizeCommentContent(payload.text),
      timestamp: this.resolveTimestamp(extra, payload),
      commentUserId: '', //这里取不到和创作中心一样的id，直接留空,
      commentUserName: String(payload.title || ''),
      commentUserAvatar: String(payload.image_url || ''),
      isAuthor: false,
    };

    return item.content ? [item] : [];
  }

  private parseExtraStr(extraStr: unknown): Record<string, any> {
    if (typeof extraStr !== 'string' || !extraStr.trim()) {
      return {};
    }
    try {
      return JSON.parse(extraStr);
    } catch (error) {
      return {};
    }
  }

  private parseOpenUrl(openUrl: unknown): Record<string, string> {
    const result: Record<string, string> = {};
    if (typeof openUrl !== 'string' || !openUrl) {
      return result;
    }

    const decodedOpenUrl = this.safeDecodeURIComponent(openUrl);
    const queryIndex = decodedOpenUrl.indexOf('?');
    if (queryIndex < 0) {
      return result;
    }

    const searchParams = new URLSearchParams(decodedOpenUrl.slice(queryIndex + 1));
    for (const [key, value] of searchParams.entries()) {
      result[key] = value;
    }
    return result;
  }

  private safeDecodeURIComponent(value: string): string {
    try {
      return decodeURIComponent(value);
    } catch (error) {
      return value;
    }
  }

  private normalizeDmContent(text: unknown): string {
    const normalized = this.stripHtmlTags(String(text || '')).trim();
    return normalized.replace(/^私信了你:\s*/u, '').trim();
  }

  private normalizeCommentContent(text: unknown): string {
    const normalized = this.stripHtmlTags(String(text || '')).trim();
    return normalized.replace(/^评论了你[:：]\s*/u, '').trim();
  }

  private resolveTimestamp(extra: Record<string, any>, payload: Record<string, any>): number {
    const createTimeToNow = Number(extra.create_time_to_now || 0);
    if (createTimeToNow > 0) {
      if (createTimeToNow >= 1000000000000) {
        return Math.trunc(createTimeToNow);
      }
      if (createTimeToNow >= 1000000000) {
        return Math.trunc(createTimeToNow * 1000);
      }
      return Math.max(Date.now() - createTimeToNow * 1000, 0);
    }

    const eventId = Number(payload?.ttpush_event_extra?.event_id || payload?.id || 0);
    if (eventId > 1000000000000) {
      return Date.now();
    }

    return Date.now();
  }

  private resolveDmMessageUserId(
    openUrl: Record<string, string>,
    authorId: string,
    ownerId: string,
    isAuthor: boolean,
  ): string {
    const secUserId = String(openUrl.sec_user_id || '').trim();
    if (secUserId) {
      return secUserId;
    }

    return !isAuthor && authorId ? authorId : ownerId || authorId;
  }

  private resolveDmIndex(openUrl: Record<string, string>): number | undefined {
    const normalizedIndexV2 = Number(openUrl.index_v2 || 0);
    if (Number.isFinite(normalizedIndexV2) && normalizedIndexV2 > 0) {
      return Math.trunc(normalizedIndexV2);
    }

    const normalizedIndexV1 = Number(openUrl.index_v1 || 0);
    if (Number.isFinite(normalizedIndexV1) && normalizedIndexV1 > 0) {
      return Math.trunc(normalizedIndexV1);
    }

    return undefined;
  }

  private resolveMessageType(msgType: string | undefined, content: string): MessageType {
    const normalizedMsgType = String(msgType || '').trim();
    if (normalizedMsgType === '27' || content === '[图片]') {
      return MessageType.image;
    }
    return MessageType.text;
  }

  private resolveSessionType(convType: string | undefined): SessionType {
    return String(convType || '1') === '1' ? SessionType.friend : SessionType.group;
  }

  private resetHeartbeatAckTimer(): void {
    this.clearHeartbeatAckTimer();
    this.heartbeatAckTimer = setTimeout(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.terminate();
      }
    }, DEFAULT_PING_TIMEOUT);
  }

  private clearHeartbeatAckTimer(): void {
    if (this.heartbeatAckTimer) {
      clearTimeout(this.heartbeatAckTimer);
      this.heartbeatAckTimer = undefined;
    }
  }
}
