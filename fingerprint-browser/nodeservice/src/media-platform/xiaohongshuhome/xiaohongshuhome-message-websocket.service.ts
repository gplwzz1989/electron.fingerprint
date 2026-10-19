import WebSocket from 'ws';
import crypto from 'crypto';
import { logger } from '@/utils';
import { BaseWebSocketService } from '@/cloud/task/base-websocket.service';
import { createKuaiProxyAgent, IWebProxy } from '@/media-platform/webproxy';
import { CommentBackItem, MessageBackItem } from '@/service/datasync-service-manager';
import {
  normalizeXiaohongshuhomeMessage,
  XiaohongshuhomeRawMessage,
} from './xiaohongshuhome-message.service';
import { getXiaohongshuhomeLatestCommentNoticeList } from './xiaohongshuhome-comment';
import { getXiaohongshuhomeUnreadCount } from './xiaohongshuhome-common';

const XIAOHONGSHUHOME_WEBSOCKET_URL = 'wss://apppush-rws.xiaohongshu.com/rwp';
const XIAOHONGSHUHOME_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151.0.0.0 Safari/537.36';
const XIAOHONGSHUHOME_COMMENT_POLLING_INTERVAL_MS = 30000;

interface XiaohongshuhomeMessageWebSocketOptions {
  cookie: string;
  localStorage?: object;
  accountId?: string;
  userId?: string;
  aLt?: string;
  deviceId?: string;
  proxy?: IWebProxy;
  enableCommentPolling?: boolean;
  commentPollingIntervalMs?: number;
}

interface ProtoField {
  field: number;
  wire: number;
  value: number | Buffer;
}

interface XiaohongshuhomeIncomingMessage {
  messageId?: string;
  content?: string;
  contentType?: string | number;
  timestamp?: number;
  sender?: string;
  receiver?: string;
  storeId?: number;
  raw?: object;
}

const uuid = (): string => crypto.randomUUID();

const readVarint = (buffer: Buffer, offset: { value: number }): number => {
  let result = 0;
  let shift = 0;
  while (offset.value < buffer.length) {
    const current = buffer[offset.value++];
    result += (current & 0x7f) * 2 ** shift;
    if ((current & 0x80) === 0) {
      break;
    }
    shift += 7;
    if (shift > 53) {
      break;
    }
  }
  return result;
};

const parseProto = (buffer: Buffer): ProtoField[] => {
  const fields: ProtoField[] = [];
  const offset = { value: 0 };
  while (offset.value < buffer.length) {
    const tag = readVarint(buffer, offset);
    const field = tag >>> 3;
    const wire = tag & 7;
    if (!field) {
      break;
    }

    if (wire === 0) {
      fields.push({ field, wire, value: readVarint(buffer, offset) });
      continue;
    }

    if (wire === 2) {
      const length = readVarint(buffer, offset);
      const end = Math.min(buffer.length, offset.value + length);
      fields.push({ field, wire, value: buffer.subarray(offset.value, end) });
      offset.value = end;
      continue;
    }

    if (wire === 1) {
      offset.value += 8;
      continue;
    }

    if (wire === 5) {
      offset.value += 4;
      continue;
    }

    break;
  }
  return fields;
};

const parseJsonPayload = (payload: Buffer | string | object | undefined): Record<string, any> | undefined => {
  if (!payload) {
    return undefined;
  }
  if (typeof payload === 'object' && !Buffer.isBuffer(payload)) {
    return payload as Record<string, any>;
  }
  try {
    const text = Buffer.isBuffer(payload) ? payload.toString('utf8') : payload.toString();
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' ? parsed : undefined;
  } catch {
    return undefined;
  }
};

const decodeChatOneMessage = (buffer: Buffer): XiaohongshuhomeIncomingMessage | undefined => {
  let chatMessage: Record<string, any> | undefined;
  for (const field of parseProto(buffer)) {
    if (field.field !== 4 || !Buffer.isBuffer(field.value)) {
      continue;
    }
    const decoded: Record<string, any> = {};
    for (const child of parseProto(field.value)) {
      if (child.field === 1 && Buffer.isBuffer(child.value)) {
        decoded.mid = child.value.toString('utf8');
      } else if (child.field === 2 && Buffer.isBuffer(child.value)) {
        decoded.messageid = child.value.toString('utf8');
      } else if (child.field === 3 && typeof child.value === 'number') {
        decoded.ts = child.value;
      } else if (child.field === 5) {
        decoded.payload = child.value;
      }
    }
    chatMessage = decoded;
  }

  if (!chatMessage) {
    return undefined;
  }

  const payload = parseJsonPayload(chatMessage.payload);
  if (!payload) {
    return undefined;
  }

  let source = payload;
  const nested = parseJsonPayload(payload.content);
  if (nested) {
    source = { ...payload, ...nested };
  }

  return {
    messageId: String(chatMessage.messageid ?? chatMessage.mid ?? ''),
    content: String(source.content ?? source.front_chain ?? source.text ?? source.contentText ?? ''),
    contentType:
      source.content_type ?? source.contentType ?? source.message_type ?? source.messageType,
    timestamp: Number(source.timestamp ?? chatMessage.ts ?? Date.now()),
    sender: String(source.sender ?? source.sender_id ?? ''),
    receiver: String(source.receiver ?? source.receiver_id ?? ''),
    storeId: Number(source.store_id ?? source.index ?? 0) || undefined,
    raw: payload,
  };
};

const createHeartbeatFrame = (): string => JSON.stringify({ v: 1, t: 0 });

const createSignalFrame = (messageId: string, signalType: number, payload: object): string =>
  JSON.stringify({
    v: 1,
    t: 2,
    m: messageId,
    b: { d: { a: 1, s: signalType, b: payload } },
  });

const createSyncAckFrame = (messageId: string): string =>
  JSON.stringify({ v: 1, t: 4, m: messageId, b: { a: { c: 0, m: 'ok' } } });

export class XiaohongshuhomeMessageWebSocketService extends BaseWebSocketService {
  protected heartbeatInterval: number = 15000;

  private cookie: string;
  private localStorage?: object;
  private accountId: string;
  private userId: string;
  private deviceId: string;
  private aLt: string;
  private proxy?: IWebProxy;
  private authTimeout?: NodeJS.Timeout;
  private readonly signalMap: Map<string, number> = new Map();
  private commentPollingTimer?: NodeJS.Timeout;
  private commentPollingInProgress: boolean = false;
  private commentPollingVersion: number = 0;
  private commentPollingEnabled: boolean;
  private commentPollingIntervalMs: number;
  private lastCommentMentions?: number;
  private commentFirstFetchCompleted: boolean = false;
  private lastCommentCreateTime: number = 0;
  private readonly commentIds: Set<string> = new Set();

  constructor(options: XiaohongshuhomeMessageWebSocketOptions) {
    super();
    this.cookie = options.cookie;
    this.localStorage = options.localStorage;
    this.accountId = options.accountId ?? '';
    this.userId = options.userId ?? '';
    this.proxy = options.proxy;
    const identity = this.extractIdentity(options.localStorage);
    this.deviceId = options.deviceId ?? identity.deviceId;
    this.aLt = options.aLt ?? identity.aLt;
    this.userId = this.userId || identity.userId;
    this.accountId = this.accountId || this.userId;
    this.commentPollingEnabled = options.enableCommentPolling !== false;
    const commentPollingIntervalMs = Number(
      options.commentPollingIntervalMs ?? XIAOHONGSHUHOME_COMMENT_POLLING_INTERVAL_MS,
    );
    this.commentPollingIntervalMs =
      Number.isFinite(commentPollingIntervalMs) && commentPollingIntervalMs > 0
        ? commentPollingIntervalMs
        : XIAOHONGSHUHOME_COMMENT_POLLING_INTERVAL_MS;
  }

  public hasAuthCredentials(): boolean {
    return Boolean(this.aLt && this.userId);
  }

  protected getWebSocketUrl(): string {
    return XIAOHONGSHUHOME_WEBSOCKET_URL;
  }

  protected getWebSocketHeaders(): Record<string, string> {
    return {
      Cookie: this.cookie,
      Origin: 'https://www.xiaohongshu.com',
      Referer: 'https://www.xiaohongshu.com/',
      'User-Agent': XIAOHONGSHUHOME_USER_AGENT,
      Pragma: 'no-cache',
      'Cache-Control': 'no-cache',
    };
  }

  protected getWebSocketOptions(): WebSocket.ClientOptions {
    const agent = this.proxy?.serverAdd ? createKuaiProxyAgent(this.proxy) : undefined;
    return agent ? { agent } : {};
  }

  protected getPlatformName(): string {
    return '小红书主页';
  }

  protected onConnected(): void {
    super.onConnected();
    this.clearAuthTimeout();
    if (!this.hasAuthCredentials()) {
      this.emit('authFailed', '小红书主页WebSocket缺少aLt或uid');
      this.close();
      return;
    }

    const loginId = uuid();
    this.signalMap.set(loginId, 0);
    this.send(
      createSignalFrame(loginId, 0, {
        appId: 'xhs-pc',
        authInfo: {
          authType: 'generic',
          sid: this.aLt,
          uid: this.userId,
          domain: 'red',
          extra: JSON.stringify({ appName: 'xhs-pc', appVersion: '6.37.3', 'User-Agent': 'Mozilla/5.0' }),
        },
        deviceInfo: {
          deviceId: this.deviceId,
          fingerprint: '9c6e5cbb-2f79-4b7b-9a50-9a0b2d1c3e4f',
          platform: 'browser',
          os: 'web',
          osVersion: '10.15',
          deviceName: 'Chrome',
          appVersion: '131.0.0.0',
          userAgent: XIAOHONGSHUHOME_USER_AGENT,
        },
        serviceTag: 'rrmp.b.i',
        bizInfos: [
          { bizName: 'im', serializeType: 'protobuf' },
          { bizName: 'push', serializeType: 'json' },
        ],
        roomInfo: [],
        roomInfos: [],
        tagInfo: [],
        extInfo: {},
        state: 1,
      }),
    );

    this.authTimeout = setTimeout(() => {
      this.emit('authFailed', '小红书主页WebSocket认证超时');
      this.close();
    }, 10000);
  }

  protected handleMessage(data: WebSocket.Data): void {
    const text = Buffer.isBuffer(data) ? data.toString('utf8') : data.toString();
    let frame: Record<string, any>;
    try {
      frame = JSON.parse(text) as Record<string, any>;
    } catch {
      return;
    }

    if (frame.t === 0) {
      this.send(createHeartbeatFrame());
      return;
    }

    if (frame.t === 2) {
      this.handleSignalAck(frame);
      return;
    }

    if (frame.t === 4) {
      this.handleSyncFrame(frame);
    }
  }

  private handleSignalAck(frame: Record<string, any>): void {
    const signalType = this.signalMap.get(String(frame.m));
    const ack = frame.b?.a;
    if (ack?.c !== 0) {
      this.emit('authFailed', `小红书主页WebSocket认证失败:${ack?.m ?? '未知错误'}`);
      this.close();
      return;
    }

    if (signalType === 0) {
      const registerId = uuid();
      this.signalMap.set(registerId, 1);
      setTimeout(() => {
        this.send(
          createSignalFrame(registerId, 1, {
            bizInfo: { bizName: 'im', serializeType: 'protobuf' },
            register: true,
          }),
        );
      }, 200);
      return;
    }

    if (signalType === 1) {
      this.clearAuthTimeout();
      this.emit('authenticated');
      this.startCommentPolling();
    }
  }

  private handleSyncFrame(frame: Record<string, any>): void {
    const dataList = frame.b?.d?.b;
    const messages: MessageBackItem[] = [];
    if (Array.isArray(dataList)) {
      for (const item of dataList) {
        if (!item?.d) {
          continue;
        }
        try {
          const incoming = decodeChatOneMessage(Buffer.from(String(item.d), 'base64'));
          const normalized = this.toMessageBackItem(incoming);
          if (normalized) {
            messages.push(normalized);
          }
        } catch (error) {
          logger.error(`解析小红书主页WebSocket私信失败:${error instanceof Error ? error.message : '数据异常'}`);
        }
      }
    }

    if (messages.length > 0) {
      this.emit('newMessage', { messages });
    }
    if (frame.m) {
      this.send(createSyncAckFrame(String(frame.m)));
    }
  }

  private toMessageBackItem(incoming?: XiaohongshuhomeIncomingMessage): MessageBackItem | undefined {
    if (!incoming) {
      return undefined;
    }
    const senderId = incoming.sender ?? '';
    const messageUserId =
      senderId === this.userId ? incoming.receiver || senderId : senderId || incoming.receiver || '';
    const raw: XiaohongshuhomeRawMessage = {
      id: incoming.messageId,
      sender_id: incoming.sender,
      receiver_id: incoming.receiver || this.userId,
      content: incoming.content ?? '',
      content_type: incoming.contentType,
      created_at: incoming.timestamp,
      store_id: incoming.storeId,
      websocket_payload: incoming.raw,
    };
    return normalizeXiaohongshuhomeMessage(raw, this.accountId, messageUserId, messageUserId);
  }

  public updateCookie(
    cookie: string,
    localStorage?: object,
    proxy?: IWebProxy,
    aLt?: string,
    deviceId?: string,
  ): void {
    this.stopCommentPolling();
    this.cookie = cookie;
    this.localStorage = localStorage;
    this.proxy = proxy;
    const identity = this.extractIdentity(localStorage);
    this.deviceId = deviceId ?? identity.deviceId;
    this.aLt = aLt ?? identity.aLt;
    this.userId = identity.userId || this.userId;
    this.accountId = this.accountId || this.userId;
    this.clearAuthTimeout();
    this.signalMap.clear();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    this.isClosed = true;
    if (this.ws) {
      try {
        this.ws.close();
      } catch (error) {
        logger.error(`关闭小红书主页旧WebSocket失败:${error instanceof Error ? error.message : '未知错误'}`);
      }
      this.ws = undefined;
    }
    this.stopHeartbeat();
    this.isConnecting = false;
    this.isClosed = false;
    setTimeout(() => this.connect(), 1000);
  }

  public close(): void {
    this.stopCommentPolling();
    this.clearAuthTimeout();
    this.signalMap.clear();
    super.close();
  }

  private startCommentPolling(): void {
    if (!this.commentPollingEnabled) {
      return;
    }

    this.stopCommentPolling();
    const version = ++this.commentPollingVersion;
    this.scheduleNextCommentPolling(0, version);
  }

  private stopCommentPolling(): void {
    this.commentPollingVersion++;
    if (this.commentPollingTimer) {
      clearTimeout(this.commentPollingTimer);
      this.commentPollingTimer = undefined;
    }
  }

  private scheduleNextCommentPolling(delayMs: number, version: number): void {
    if (!this.isCommentPollingActive(version)) {
      return;
    }

    if (this.commentPollingTimer) {
      clearTimeout(this.commentPollingTimer);
    }

    this.commentPollingTimer = setTimeout(() => {
      this.commentPollingTimer = undefined;
      void this.pollLatestComments(version);
    }, delayMs);
  }

  private isCommentPollingActive(version: number): boolean {
    return (
      this.commentPollingEnabled &&
      version === this.commentPollingVersion &&
      !this.isClosed &&
      this.ws?.readyState === WebSocket.OPEN
    );
  }

  private async pollLatestComments(version: number): Promise<void> {
    if (!this.isCommentPollingActive(version)) {
      return;
    }

    if (this.commentPollingInProgress) {
      this.scheduleNextCommentPolling(this.getCommentPollingDelay(), version);
      return;
    }

    this.commentPollingInProgress = true;
    try {
      const accountId = String(this.accountId || this.userId).trim();
      if (!accountId) {
        return;
      }

      const unreadCountResult = await getXiaohongshuhomeUnreadCount(this.cookie, this.proxy);
      if (!this.isCommentPollingActive(version)) {
        return;
      }

      if (unreadCountResult?.code === -100 || unreadCountResult?.code === 401 || unreadCountResult?.msg?.includes('登录')) {
        const reason = `小红书主页评论未读数轮询登录状态异常:${unreadCountResult?.msg ?? ''}`;
        this.stopCommentPolling();
        logger.error(reason);
        this.emit('loginExpire', reason);
        return;
      }

      if (unreadCountResult?.code !== 0) {
        logger.error(`小红书主页评论未读数轮询失败:${unreadCountResult?.msg ?? ''}`);
        return;
      }

      const mentions = Number(unreadCountResult.data?.mentions);
      if (!Number.isFinite(mentions)) {
        logger.error('小红书主页评论未读数轮询失败:未读数格式异常');
        return;
      }

      const previousMentions = this.lastCommentMentions;
      this.lastCommentMentions = mentions;
      if (previousMentions !== undefined && previousMentions === mentions) {
        return;
      }

      const commentResult = await getXiaohongshuhomeLatestCommentNoticeList(
        this.cookie,
        undefined,
        accountId,
        this.proxy,
      );
      if (!this.isCommentPollingActive(version)) {
        return;
      }

      if (commentResult?.code === -100 || commentResult?.code === 401 || commentResult?.msg?.includes('登录')) {
        const reason = `小红书主页评论轮询登录状态异常:${commentResult?.msg ?? ''}`;
        this.stopCommentPolling();
        logger.error(reason);
        this.emit('loginExpire', reason);
        return;
      }

      if (commentResult?.code !== 0) {
        logger.error(`小红书主页评论轮询失败:${commentResult?.msg ?? ''}`);
        return;
      }

      const previousCommentCreateTime = this.lastCommentCreateTime;
      const freshComments: CommentBackItem[] = [];
      const comments = Array.isArray(commentResult.dataList) ? commentResult.dataList : [];
      for (const comment of comments) {
        const commentKey = this.getCommentKey(comment);
        const isNew =
          !this.commentIds.has(commentKey) &&
          (!this.commentFirstFetchCompleted || comment.timestamp >= previousCommentCreateTime);
        this.rememberComment(comment, commentKey);
        if (this.commentFirstFetchCompleted && isNew) {
          freshComments.push(comment);
        }
      }

      this.commentFirstFetchCompleted = true;
      if (freshComments.length > 0) {
        this.emit('newComment', { comments: freshComments });
      }
    } catch (error) {
      logger.error(`小红书主页评论轮询异常:${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      this.commentPollingInProgress = false;
      if (this.isCommentPollingActive(version)) {
        this.scheduleNextCommentPolling(this.getCommentPollingDelay(), version);
      }
    }
  }

  private getCommentKey(comment: CommentBackItem): string {
    const contentKey = `${comment.documentId ?? comment.contentId ?? ''}:${comment.timestamp ?? 0}:${
      comment.content ?? ''
    }`;
    return `${comment.documentId ?? comment.contentId ?? ''}:${comment.commentId || contentKey}`;
  }

  private rememberComment(comment: CommentBackItem, commentKey: string): void {
    if (commentKey) {
      this.commentIds.add(commentKey);
    }
    this.lastCommentCreateTime = Math.max(this.lastCommentCreateTime, comment.timestamp || 0);
    if (this.commentIds.size > 2000) {
      const first = this.commentIds.values().next().value as string | undefined;
      if (first) {
        this.commentIds.delete(first);
      }
    }
  }

  private getCommentPollingDelay(): number {
    return this.getJitteredDelay(this.commentPollingIntervalMs);
  }

  protected sendHeartbeat(): void {
    this.send(createHeartbeatFrame());
  }

  protected onClosed(code: number, reason: Buffer): void {
    this.stopCommentPolling();
    this.clearAuthTimeout();
    super.onClosed(code, reason);
  }

  private clearAuthTimeout(): void {
    if (this.authTimeout) {
      clearTimeout(this.authTimeout);
      this.authTimeout = undefined;
    }
  }

  private extractIdentity(localStorage?: object): { aLt: string; userId: string; deviceId: string } {
    const source = (localStorage ?? {}) as Record<string, any>;
    let token: Record<string, any> = {};
    const rawToken = source.RWP_LOGIN_TOKEN;
    if (typeof rawToken === 'string') {
      try {
        token = JSON.parse(rawToken) as Record<string, any>;
      } catch {
        token = {};
      }
    } else if (rawToken && typeof rawToken === 'object') {
      token = rawToken as Record<string, any>;
    }

    return {
      aLt: String(source.aLt ?? token.aLt ?? ''),
      userId: String(source.uid ?? source.user_id ?? token.uid ?? token.user_id ?? ''),
      deviceId: String(source.device_id ?? source.deviceId ?? source.XHS_TAB_DEVICE_ID ?? ''),
    };
  }
}
