import WebSocket from 'ws';
import crypto from 'crypto';
import { BaseWebSocketService } from '@/cloud/task/base-websocket.service';
import { logger } from '@/utils';
import { createKuaiProxyAgent, IWebProxy } from '@/media-platform/webproxy';
import { getDouyinUserInfo } from '@/media-platform/douyin/douyin-user';
import {
  CommentBackItem,
  MessageBackItem,
  MessageMediaInfo,
  MessageType,
  Platforms,
  SessionType,
} from '@/service/datasync-service-manager';
import {
  DouyinImCommand,
  DouyinImPushFrame,
  DouyinImResponse,
  DouyinImWebSocketFrame,
  DouyinNewMessageNotify,
  parseDouyinImWebSocketFrame,
  parseDouyinMessageContent,
} from '@/media-platform/douyin/private_msg/douyin-im-websocket-parser';
import { getDouYinLatestCommentNoticeList } from '@/media-platform/douyin/douyin-comment';

export const DEFAULT_FRONTIER_IM_FP_ID = '9';
export const DEFAULT_FRONTIER_IM_AID = '6383';
export const DEFAULT_FRONTIER_IM_VERSION_CODE = 'fws_1.0.0';
export const DEFAULT_FRONTIER_IM_APP_KEY = 'e1bd35ec9db7b8d846de66ed140b1ad9';
export const DEFAULT_FRONTIER_IM_SALT = 'f8a69f1719916z';
export const DEFAULT_FRONTIER_IM_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36';
export const DEFAULT_FRONTIER_IM_REFERER = 'https://www.douyin.com/';
const DEFAULT_FRONTIER_IM_HEARTBEAT_INTERVAL = 15000;
const DEFAULT_FRONTIER_IM_HEARTBEAT_TIMEOUT = 8000;
const DEFAULT_FRONTIER_IM_COMMENT_POLLING_INTERVAL = 10000;
const DEFAULT_FRONTIER_IM_COMMENT_POLLING_JITTER_MIN = 5000;
const DEFAULT_FRONTIER_IM_COMMENT_POLLING_JITTER_MAX = 10000;
const DEDUPE_EXPIRE_MS = 10 * 60 * 1000;

export interface DouyinFrontierImAccessKeyOptions {
  fpId?: string;
  appKey?: string;
  salt?: string;
}

export interface DouyinFrontierImWebSocketServiceOptions {
  cookie: string;
  accountId?: string;
  userId?: string;
  proxy?: IWebProxy;
  referer?: string;
  userAgent?: string;
  enableCommentPolling?: boolean;
  commentPollingIntervalMs?: number;
}

export interface DouyinFrontierImNewMessageEvent {
  messages: MessageBackItem[];
  rawFrame?: DouyinImWebSocketFrame;
  response?: DouyinImResponse;
  notify?: DouyinNewMessageNotify;
}

export interface DouyinFrontierImNewCommentEvent {
  comments: CommentBackItem[];
  rawFrame?: DouyinImWebSocketFrame;
  payloadObject?: DouyinFrontierImCommentPayload;
}

export interface DouyinFrontierImResolvedIdentity {
  source: 'manual' | 'user_info';
  userId: string;
}

interface DouyinFrontierImCommentPayload {
  comment_id?: string;
  available_in_activity?: string;
  title?: string;
  content?: string;
  content_en?: string;
  open_url?: string;
  image_url?: string;
  item_id?: string;
  notice_id_str?: string;
  from_sec_uid?: string;
  from_uid?: string;
  inapp_push_type?: string;
  notice_type?: number | string;
  push_type?: string;
  extra?: {
    can_comment?: boolean;
    comment_permission_status?: number;
    level?: number;
    parent_id?: string;
  };
}

interface DouyinMessageContentObject {
  text?: string;
  tips?: string;
  description?: string;
  inline_pic?: string;
  ext?: string | Record<string, unknown>;
  ext_data?: Array<{ key?: string | number }>;
  template?: Array<{ key?: string | number; name?: string }>;
  locale_resources?: Array<{ lang?: string; text?: string }>;
  active_users?: Array<{ uid?: string | number; nickname?: string }>;
  passive_users?: Array<{ uid?: string | number; nickname?: string }>;
  resource_url?: {
    large_url_list?: string[];
    skey?: string;
  };
}

export function calculateFrontierImAccessKey(deviceId: string, options?: DouyinFrontierImAccessKeyOptions): string {
  const normalizedDeviceId = String(deviceId || '').trim();
  if (!normalizedDeviceId) {
    throw new Error('生成 frontier-im access_key 失败：缺少 device_id');
  }

  const fpId = String(options?.fpId || DEFAULT_FRONTIER_IM_FP_ID).trim();
  const appKey = String(options?.appKey || DEFAULT_FRONTIER_IM_APP_KEY).trim();
  const salt = String(options?.salt || DEFAULT_FRONTIER_IM_SALT).trim();

  return crypto.createHash('md5').update(`${fpId}${appKey}${normalizedDeviceId}${salt}`).digest('hex');
}

export function buildFrontierImWebSocketUrl(userId: string): string {
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) {
    throw new Error('生成 frontier-im WebSocket 地址失败：缺少 userId');
  }

  const searchParams = new URLSearchParams({
    device_platform: 'web',
    version_code: DEFAULT_FRONTIER_IM_VERSION_CODE,
    access_key: calculateFrontierImAccessKey(normalizedUserId),
    fpid: DEFAULT_FRONTIER_IM_FP_ID,
    aid: DEFAULT_FRONTIER_IM_AID,
    device_id: normalizedUserId,
    xsack: '0',
    xaack: '0',
    xsqos: '0',
    qos_sdk_version: '2',
  });

  return `wss://frontier-im.douyin.com/ws/v2?${searchParams.toString()}`;
}

export function shouldKeepDouyinFrontierImMessage(
  notify: DouyinNewMessageNotify | undefined,
  currentUserId?: string,
): boolean {
  if (!notify?.message) {
    return false;
  }

  if (notify.message.messageType === 50001) {
    const rawContent = typeof notify.message.content === 'string' ? notify.message.content : '';
    const contentObject = toMessageContentObject(parseDouyinMessageContent(rawContent));
    const commandType = resolveDouyinImCommandType(rawContent, notify.message.ext);
    return isDouyinUserEnterMessage(notify.message.messageType, commandType, notify.message.ext, contentObject);
  }

  if (notify.message.messageType !== 1001) {
    return true;
  }

  const contentObject = toMessageContentObject(parseDouyinMessageContent(notify.message.content));
  const localeResource =
    contentObject?.locale_resources?.find((item) => item?.lang?.toString() === 'zh-Hans') ??
    contentObject?.locale_resources?.[0];
  const activeUserId = contentObject?.active_users?.[0]?.uid?.toString() ?? '';
  if (localeResource?.text?.startsWith('{0}') && currentUserId && activeUserId === currentUserId) {
    return false;
  }

  return true;
}

export function buildDouyinMessageBackItemFromImNotify(
  notify: DouyinNewMessageNotify | undefined,
  currentUserId?: string,
): MessageBackItem | undefined {
  if (!notify?.message || !shouldKeepDouyinFrontierImMessage(notify, currentUserId)) {
    return undefined;
  }

  const message = notify.message;
  const rawContent = typeof message.content === 'string' ? message.content : '';
  const contentObject = toMessageContentObject(parseDouyinMessageContent(rawContent));
  const commandType = resolveDouyinImCommandType(rawContent, message.ext);
  const messageType = resolveDouyinImMessageType(
    message.messageType,
    rawContent,
    commandType,
    message.ext,
    contentObject,
  );
  const content =
    messageType === MessageType.user_enter
      ? ''
      : resolveDouyinImContentText(message.messageType, rawContent, contentObject, currentUserId);
  const timestamp = Number(message.createTime ?? Date.now()) || Date.now();
  const senderUserId = String(message.sender || '').trim();
  const sessionId = String(message.conversationId || notify.conversationId || '').trim();
  const toUserId = resolveDouyinImToUserId(sessionId, senderUserId);
  const currentUserIdText = String(currentUserId || '').trim();

  const item: MessageBackItem = {
    platform: Platforms.DouYin,
    accountId: currentUserIdText,
    messageId: String(message.serverMessageId || '').trim(),
    content,
    timestamp,
    messageUserId: String(message.secSender || '').trim(),
    sessionId,
    secSessionId: String(message.conversationShortId || '').trim(),
    sessionType: resolveDouyinImSessionType(message.conversationType, message.ext),
    messageOwnerUserId: '',
    messageType,
    index: resolveDouyinImIndex(notify),
    raw: {
      // notify,
      // contentObject,
    },
    isAuthor: !!currentUserIdText && senderUserId === currentUserIdText,
    fromUserId: senderUserId,
    toUserId,
  };
  if (item.messageType === MessageType.user_enter) {
    item.sessionType = SessionType.stranger;
  }

  const mediaInfo = buildDouyinImMediaInfo(messageType, contentObject);
  if (mediaInfo) {
    item.mediaInfo = mediaInfo;
  }

  return item;
}

export class DouyinFrontierImWebSocketService extends BaseWebSocketService {
  private cookie: string;
  private accountId?: string;
  private explicitUserId?: string;
  private proxy?: IWebProxy;
  private referer: string;
  private userAgent: string;
  private wsUrl?: string;
  private resolvedIdentity?: DouyinFrontierImResolvedIdentity;
  private heartbeatAckTimer?: NodeJS.Timeout;
  private commentPollingTimer?: NodeJS.Timeout;
  private commentPollingInProgress: boolean = false;
  private commentPollingVersion: number = 0;
  private commentPollingEnabled: boolean;
  private commentPollingIntervalMs: number;
  private lastCommentCreateTime?: number;
  private commentFirstFetchCompleted: boolean = false;
  private recentMessageIds: Map<string, number> = new Map();
  private userEnterSessionIds: Set<string> = new Set();

  constructor(options: DouyinFrontierImWebSocketServiceOptions) {
    super();
    this.cookie = options.cookie;
    this.accountId = String(options.accountId || '').trim() || undefined;
    this.explicitUserId = String(options.userId || '').trim() || undefined;
    this.proxy = options.proxy;
    this.referer = String(options.referer || '').trim() || DEFAULT_FRONTIER_IM_REFERER;
    this.userAgent = String(options.userAgent || '').trim() || DEFAULT_FRONTIER_IM_USER_AGENT;
    this.heartbeatInterval = DEFAULT_FRONTIER_IM_HEARTBEAT_INTERVAL;
    this.maxReconnectAttempts = 3;
    this.commentPollingEnabled = options.enableCommentPolling !== false;
    this.commentPollingIntervalMs =
      Number(options.commentPollingIntervalMs || 0) > 0
        ? Number(options.commentPollingIntervalMs)
        : DEFAULT_FRONTIER_IM_COMMENT_POLLING_INTERVAL;
  }

  protected getPlatformName(): string {
    return '抖音私信 IM';
  }

  protected getWebSocketUrl(): string {
    if (!this.wsUrl) {
      throw new Error('抖音私信 IM WebSocket 地址未初始化');
    }

    return this.wsUrl;
  }

  protected getWebSocketHeaders(): Record<string, string> {
    return {
      Origin: 'https://www.douyin.com',
      Referer: this.referer,
      'User-Agent': this.userAgent,
      Cookie: this.cookie,
    };
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

  public async prepareConnection(): Promise<void> {
    if (this.wsUrl && this.resolvedIdentity?.userId) {
      return;
    }

    this.resolvedIdentity = await this.resolveIdentity();
    this.wsUrl = buildFrontierImWebSocketUrl(this.resolvedIdentity.userId);
  }

  public connect(): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      super.connect();
      return;
    }

    if (!this.wsUrl || !this.resolvedIdentity?.userId) {
      this.isConnecting = true;
      void this.prepareConnection()
        .then(() => {
          this.isConnecting = false;
          this.connect();
        })
        .catch((error) => {
          this.isConnecting = false;
          logger.error(`抖音私信 IM 准备 WebSocket 连接失败:${error}`);
          if (!this.isClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
            return;
          }
          this.onReconnectFailed('抖音私信 IM 准备 WebSocket 连接失败');
        });
      return;
    }

    if (!this.wsUrl || !this.resolvedIdentity?.userId) {
      logger.error('抖音私信 IM WebSocket 初始化失败：缺少 userId 或 wsUrl');
      this.emit('authFailed', '抖音私信 IM WebSocket 初始化失败：缺少 userId 或 wsUrl');
      return;
    }

    super.connect();
  }

  protected onConnected(): void {
    this.clearHeartbeatAckTimer();
    super.onConnected();
    this.emit('deviceResolved', {
      userId: this.resolvedIdentity?.userId ?? '',
      source: this.resolvedIdentity?.source ?? '',
      wsUrl: this.wsUrl ?? '',
    });
    this.startCommentPolling();
  }

  protected onClosed(code: number, reason: Buffer): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      this.stopCommentPolling();
    }
    this.clearHeartbeatAckTimer();
    super.onClosed(code, reason);
  }

  protected startHeartbeat(): void {
    this.stopHeartbeat();
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendHeartbeat();
    }
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendHeartbeat();
      }
    }, DEFAULT_FRONTIER_IM_HEARTBEAT_INTERVAL) as unknown as NodeJS.Timeout;
  }

  protected sendHeartbeat(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send('hi');
      this.resetHeartbeatAckTimer();
      this.logNonProd('抖音私信 IM 发送心跳');
      //console.log('发送hi');
    }
  }

  protected handleMessage(data: WebSocket.Data): void {
    const frame = parseDouyinImWebSocketFrame(data as never);

    if (frame.kind === 'heartbeat') {
      this.clearHeartbeatAckTimer();
      return;
    }
    console.log('1-------1', JSON.stringify(frame, null, 2));
    if (frame.kind === 'text') {
      this.logNonProd(`抖音私信 IM 忽略纯文本帧:${frame.kind}:${frame.rawText}`);
      return;
    }

    if (frame.kind === 'push-text') {
      const comments = buildDouyinCommentBackItemsFromFrontierImPayload(frame.pushFrame, frame.jsonPayload, '');
      if (comments.length > 0) {
        this.logNonProd('抖音私信 IM 收到评论 WebSocket 帧，已忽略，评论由轮询获取');
        // const dedupedComments = comments.filter((item) => this.rememberRecentComment(item));
        // if (dedupedComments.length > 0) {
        //   const event: DouyinFrontierImNewCommentEvent = {
        //     comments: dedupedComments,
        //     //rawFrame: frame,
        //     //payloadObject: (frame.jsonPayload || {}) as DouyinFrontierImCommentPayload,
        //   };
        //   this.emit('newComment', event);
        // }
        return;
      }

      this.logNonProd(`抖音私信 IM 忽略文本推送帧:${frame.kind}`);
      return;
    }

    if (frame.kind === 'protobuf-unknown') {
      logger.error(`抖音私信 IM 未识别的 protobuf 帧:${frame.error}`);
      this.emit('frameError', frame);
      return;
    }

    if (frame.pushFrame?.service !== 5 || (frame.response.cmd !== 500 && frame.response.cmd !== 511)) {
      return;
    }

    const notify = frame.response.body?.hasNewMessageNotify;
    if (!notify) {
      return;
    }

    const message = buildDouyinMessageBackItemFromImNotify(notify, this.resolvedIdentity?.userId);
    if (!message) {
      return;
    }
    if (message?.content == '{}' && message?.messageType === MessageType.text) {
      return;
    }

    if (!this.rememberRecentMessage(message)) {
      return;
    }
    if (!this.rememberUserEnterSession(message)) {
      return;
    }

    const event: DouyinFrontierImNewMessageEvent = {
      messages: [message],
      //rawFrame: frame,
      //response: frame.response,
      //notify: notify!,
    };
    if (message.messageType === MessageType.image && !message.mediaInfo) {
      event.messages = [];
    }
    this.emit('newMessage', event);
  }

  public updateCookie(cookie: string, userId?: string, proxy?: IWebProxy): void {
    this.stopCommentPolling();
    this.cookie = cookie;
    this.explicitUserId = String(userId || '').trim() || undefined;
    this.proxy = proxy;
    this.wsUrl = undefined;
    this.resolvedIdentity = undefined;
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
        logger.error(`抖音私信 IM 关闭旧连接失败:${error}`);
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
          logger.error(`抖音私信 IM 更新 Cookie 后重新初始化失败:${error}`);
          this.emit('authFailed', '抖音私信 IM 更新 Cookie 后重新初始化失败');
        });
    }, 1000);
  }

  public close(): void {
    this.stopCommentPolling();
    this.clearHeartbeatAckTimer();
    super.close();
  }

  public getResolvedIdentity(): DouyinFrontierImResolvedIdentity | undefined {
    return this.resolvedIdentity;
  }

  private async resolveIdentity(): Promise<DouyinFrontierImResolvedIdentity> {
    if (this.explicitUserId) {
      return {
        source: 'manual',
        userId: this.explicitUserId,
      };
    }

    const userInfo = await getDouyinUserInfo(this.cookie, this.proxy);
    const userId = String(userInfo?.yixiaoerId || '').trim();
    if (!userId) {
      throw new Error('获取抖音私信 IM userId 失败：当前账号缺少 uid');
    }

    return {
      source: 'user_info',
      userId,
    };
  }

  private rememberRecentMessage(message: MessageBackItem): boolean {
    const key = `${message.sessionId || ''}:${message.messageId || ''}`;
    if (!key || key === ':') {
      return true;
    }

    const now = Date.now();
    for (const [recentKey, timestamp] of this.recentMessageIds.entries()) {
      if (now - timestamp > DEDUPE_EXPIRE_MS) {
        this.recentMessageIds.delete(recentKey);
      }
    }

    if (this.recentMessageIds.has(key)) {
      return false;
    }

    this.recentMessageIds.set(key, now);
    return true;
  }

  private rememberUserEnterSession(message: MessageBackItem): boolean {
    if (message.messageType !== MessageType.user_enter || message.isAuthor !== false) {
      return true;
    }

    const normalizedSessionId = String(message.sessionId || '').trim();
    if (!normalizedSessionId) {
      return true;
    }

    if (this.userEnterSessionIds.has(normalizedSessionId)) {
      return false;
    }

    this.userEnterSessionIds.add(normalizedSessionId);
    return true;
  }

  private rememberRecentComment(comment: CommentBackItem): boolean {
    const key = `${comment.documentId || comment.contentId || ''}:${comment.commentId || ''}:${
      comment.timestamp || 0
    }:${comment.content || ''}`;
    if (!key || key.startsWith('::0:')) {
      return true;
    }

    const now = Date.now();
    for (const [recentKey, timestamp] of this.recentMessageIds.entries()) {
      if (now - timestamp > DEDUPE_EXPIRE_MS) {
        this.recentMessageIds.delete(recentKey);
      }
    }

    if (this.recentMessageIds.has(key)) {
      return false;
    }

    this.recentMessageIds.set(key, now);
    return true;
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
      const accountId = this.resolvedIdentity?.userId ?? this.explicitUserId ?? '';
      if (!accountId) {
        return;
      }

      const commentResult = await getDouYinLatestCommentNoticeList(this.cookie, accountId, {
        lastCreateTime: this.lastCommentCreateTime,
        isFirstFetch: !this.commentFirstFetchCompleted,
        proxy: this.proxy,
      });

      if (!this.isCommentPollingActive(version)) {
        return;
      }

      if (commentResult?.code === 8 || commentResult?.msg?.includes('登录')) {
        const reason = `抖音私信 IM 评论轮询登录状态异常:platformAccountId=${
          this.accountId ?? ''
        } platformAuthorId=${accountId} ${commentResult?.msg ?? ''}`;
        this.stopCommentPolling();
        logger.error(reason);
        this.emit('loginExpire', reason);
        return;
      }

      if (commentResult?.code !== 0) {
        logger.error(`抖音私信 IM 评论轮询失败:${commentResult?.msg ?? ''}`);
        return;
      }

      const resultData = commentResult.data as { lastCreateTime?: number } | undefined;
      const latestCreateTime = Number(resultData?.lastCreateTime ?? this.lastCommentCreateTime ?? 0);
      if (latestCreateTime > 0) {
        this.lastCommentCreateTime = latestCreateTime;
      }

      if (!this.commentFirstFetchCompleted) {
        this.commentFirstFetchCompleted = true;
      }

      const comments = Array.isArray(commentResult.dataList) ? (commentResult.dataList as CommentBackItem[]) : [];
      const dedupedComments = comments.filter((item) => this.rememberRecentComment(item));
      if (dedupedComments.length > 0) {
        const event: DouyinFrontierImNewCommentEvent = {
          comments: dedupedComments,
        };
        this.emit('newComment', event);
      }
    } catch (error) {
      logger.error(`抖音私信 IM 评论轮询异常:${error}`);
    } finally {
      this.commentPollingInProgress = false;
      if (this.isCommentPollingActive(version)) {
        this.scheduleNextCommentPolling(this.getCommentPollingDelay(), version);
      }
    }
  }

  private getCommentPollingDelay(): number {
    const jitter =
      Math.floor(
        Math.random() *
          (DEFAULT_FRONTIER_IM_COMMENT_POLLING_JITTER_MAX - DEFAULT_FRONTIER_IM_COMMENT_POLLING_JITTER_MIN + 1),
      ) + DEFAULT_FRONTIER_IM_COMMENT_POLLING_JITTER_MIN;
    return this.commentPollingIntervalMs + jitter;
  }

  private resetHeartbeatAckTimer(): void {
    this.clearHeartbeatAckTimer();
    this.heartbeatAckTimer = setTimeout(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.terminate();
      }
    }, DEFAULT_FRONTIER_IM_HEARTBEAT_TIMEOUT);
  }

  private clearHeartbeatAckTimer(): void {
    if (this.heartbeatAckTimer) {
      clearTimeout(this.heartbeatAckTimer);
      this.heartbeatAckTimer = undefined;
    }
  }
}

function resolveDouyinImMessageType(
  messageType?: number,
  contentText?: string,
  commandType?: number,
  ext?: Record<string, string>,
  contentObject?: DouyinMessageContentObject,
): MessageType {
  if (isDouyinUserEnterMessage(messageType, commandType, ext, contentObject)) {
    return MessageType.user_enter;
  }
  if (messageType === 27 || contentText === '[图片]') {
    return MessageType.image;
  }
  if (messageType === 1 || messageType === 1001 || messageType === 50001) {
    return MessageType.system;
  }
  return MessageType.text;
}

function isDouyinUserEnterMessage(
  messageType?: number,
  commandType?: number,
  ext?: Record<string, string>,
  contentObject?: DouyinMessageContentObject,
): boolean {
  return (
    messageType === 50001 &&
    (commandType === 8 ||
      (commandType === 6 &&
        String(ext?.['s:strangers'] || '').trim() !== '' &&
        isDouyinInitialUserEnterContent(contentObject)))
  );
}

function isDouyinInitialUserEnterContent(contentObject?: DouyinMessageContentObject): boolean {
  const extData = contentObject?.ext_data;
  if (!Array.isArray(extData)) {
    return false;
  }

  const extDataKeys = extData.map((item) => String(item?.key || '').trim());
  if (extDataKeys.includes('a:hit_unfollowed_familiar_msg_test')) {
    return !extDataKeys.includes('a:freq_scene');
  }

  return extDataKeys.includes('a:freq_scene') && hasDouyinInitialUserEnterExt(contentObject?.ext);
}

function hasDouyinInitialUserEnterExt(ext?: string | Record<string, unknown>): boolean {
  const extObject = parseDouyinMessageContent(ext);
  if (!extObject || typeof extObject !== 'object' || Array.isArray(extObject)) {
    return false;
  }
  if (!Object.prototype.hasOwnProperty.call(extObject, 'a:hit_unfollowed_familiar_msg_test')) {
    return false;
  }

  const freqScene = parseDouyinMessageContent((extObject as Record<string, unknown>)['a:freq_scene']);
  if (!freqScene || typeof freqScene !== 'object' || Array.isArray(freqScene)) {
    return false;
  }

  const c2cMeta = (freqScene as Record<string, unknown>).c2c_meta;
  if (!c2cMeta || typeof c2cMeta !== 'object' || Array.isArray(c2cMeta)) {
    return false;
  }

  const c2cMetaObject = c2cMeta as Record<string, unknown>;
  return (
    (freqScene as Record<string, unknown>).scene === 'c2c' &&
    isDouyinZeroValue(c2cMetaObject.status) &&
    isDouyinZeroValue(c2cMetaObject.userId) &&
    isDouyinZeroValue(c2cMetaObject.serOpCnt)
  );
}

function isDouyinZeroValue(value: unknown): boolean {
  return value !== undefined && value !== null && String(value).trim() === '0';
}

function resolveDouyinImCommandType(rawContent: string, ext?: Record<string, string>): number | undefined {
  const extCommandType = Number(ext?.['s:command_type'] || 0);
  if (Number.isFinite(extCommandType) && extCommandType > 0) {
    return Math.trunc(extCommandType);
  }

  const contentObject = parseDouyinMessageContent(rawContent);
  if (!contentObject || typeof contentObject !== 'object' || Array.isArray(contentObject)) {
    return undefined;
  }

  const commandType = Number(
    (contentObject as Record<string, unknown>).command_type ??
      (contentObject as Record<string, unknown>).commant_type ??
      0,
  );
  if (Number.isFinite(commandType) && commandType > 0) {
    return Math.trunc(commandType);
  }

  return undefined;
}

function resolveDouyinImSessionType(conversationType?: number, ext?: Record<string, string>): SessionType {
  if (conversationType === 2) {
    return SessionType.group;
  }
  const isStranger =
    ext?.['s:is_stranger'] === 'true' ||
    (ext?.['s:chat_tag'] === 'stranger' && Boolean(ext?.['s:is_stranger_message']));
  if (isStranger) {
    return SessionType.stranger;
  }
  return SessionType.friend;
}

function resolveDouyinImIndex(notify: DouyinNewMessageNotify): number | undefined {
  const indexV2 = Number(notify.indexInConversationV2 || 0);
  if (Number.isFinite(indexV2) && indexV2 > 0) {
    return Math.trunc(indexV2);
  }

  const indexV1 = Number(notify.indexInConversation || 0);
  if (Number.isFinite(indexV1) && indexV1 > 0) {
    return Math.trunc(indexV1);
  }

  return undefined;
}

function resolveDouyinImToUserId(sessionId: string, senderUserId: string): string {
  if (!sessionId || !senderUserId) {
    return '';
  }

  return sessionId.replace(`:${senderUserId}`, '').split(':')[2] ?? '';
}

function resolveDouyinImContentText(
  rawMessageType: number | undefined,
  rawContent: string,
  contentObject: DouyinMessageContentObject | undefined,
  currentUserId?: string,
): string {
  let content = resolveRawContentText(contentObject, rawContent);

  if (
    rawMessageType === 1 &&
    contentObject?.tips &&
    Array.isArray(contentObject.template) &&
    contentObject.tips.includes('{{')
  ) {
    content = String(contentObject.tips).replace(/\{\{(\d+)\}\}/g, (match, key) => {
      const templateItem = contentObject.template?.find((item) => item?.key?.toString() === key);
      return templateItem?.name?.toString() ?? match;
    });
  }

  if (rawMessageType === 1001) {
    const localeResource =
      contentObject?.locale_resources?.find((item) => item?.lang?.toString() === 'zh-Hans') ??
      contentObject?.locale_resources?.[0];
    if (
      localeResource?.text?.startsWith('{0}') &&
      currentUserId &&
      contentObject?.active_users?.[0]?.uid?.toString() === currentUserId
    ) {
      return '';
    }

    if (localeResource?.text) {
      content = localeResource.text.toString().replace(/\{(\d+)\}/g, (match, key) => {
        const userList =
          key === '0' ? contentObject?.active_users : key === '1' ? contentObject?.passive_users : undefined;
        const userText = Array.isArray(userList)
          ? userList
              .map((item) => item?.nickname?.toString() ?? '')
              .filter((item) => item)
              .join(',')
          : '';
        return ` ${userText || match} `;
      });
    }
  }

  return content;
}

function buildDouyinImMediaInfo(
  messageType: MessageType,
  contentObject: DouyinMessageContentObject | undefined,
): MessageMediaInfo | undefined {
  if (messageType !== MessageType.image || !contentObject) {
    return undefined;
  }

  return {
    mediaType: 'image',
    needParse: false,
    needDecode: true,
    base64: `data:image/png;base64,${contentObject.inline_pic ?? ''}`,
    mediaParams: {
      url: contentObject.resource_url?.large_url_list?.length ? contentObject.resource_url.large_url_list[0] : '',
      skey: contentObject.resource_url?.skey,
    },
  };
}

function resolveRawContentText(contentObject: DouyinMessageContentObject | undefined, rawContent: string): string {
  if (contentObject) {
    for (const field of ['text', 'tips', 'description'] as const) {
      const value = contentObject[field];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
  }

  return typeof rawContent === 'string' ? rawContent : '';
}

function buildDouyinCommentBackItemsFromFrontierImPayload(
  pushFrame: DouyinImPushFrame | undefined,
  payload: unknown,
  accountId?: string,
): CommentBackItem[] {
  if (!isDouyinFrontierImCommentPayload(pushFrame, payload)) {
    return [];
  }

  const commentPayload = payload as DouyinFrontierImCommentPayload;
  const content = normalizeDouyinFrontierCommentContent(commentPayload.content);
  if (!content) {
    return [];
  }

  const documentId = String(
    commentPayload.item_id || commentPayload.extra?.parent_id || commentPayload.notice_id_str || '',
  ).trim();
  const commentId = String(commentPayload.comment_id || commentPayload.notice_id_str || '').trim();

  const item: CommentBackItem = {
    platform: Platforms.DouYin,
    accountId: String(accountId || '').trim(),
    contentId: '',
    documentId,
    commentId: '',
    content,
    timestamp: Date.now(),
    commentUserId: String(commentPayload.from_uid || '').trim(),
    commentUserName: String(commentPayload.title || '').trim(),
    commentUserAvatar: String(commentPayload.image_url || '').trim(),
    isAuthor: false,
    //raw: commentPayload as unknown as object,
  };

  return [item];
}

function isDouyinFrontierImCommentPayload(
  pushFrame: DouyinImPushFrame | undefined,
  payload: unknown,
): payload is DouyinFrontierImCommentPayload {
  if (pushFrame?.service !== 20003) {
    return false;
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return false;
  }

  const commentPayload = payload as DouyinFrontierImCommentPayload;
  const noticeType = Number(commentPayload.notice_type || 0);
  if (noticeType === 31) {
    return true;
  }

  return Boolean(commentPayload.comment_id && commentPayload.item_id);
}

function normalizeDouyinFrontierCommentContent(text: unknown): string {
  const normalized = stripDouyinFrontierHtmlTags(String(text || '')).trim();
  return normalized.replace(/^评论了你[:：]\s*/u, '').trim();
}

function stripDouyinFrontierHtmlTags(text: string): string {
  return String(text || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toMessageContentObject(content: unknown): DouyinMessageContentObject | undefined {
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return undefined;
  }
  return content as DouyinMessageContentObject;
}
