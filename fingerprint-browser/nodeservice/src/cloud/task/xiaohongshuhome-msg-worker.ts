import { EventEmitter } from 'events';
import { BaseMsgWorker, MsgWorkerIdentity } from '@/cloud/task/base-msg-worker';
import { BaseWebSocketService } from '@/cloud/task/base-websocket.service';
import { ImageInfo, MessageConversationListInfoResponse, MessageListInfoResponse } from '@/media-platform';
import { CommentBackItem, MessageType, SyncEventName } from '@/service/datasync-service-manager';
import { BaseResult } from '@/media-platform/baseResult';
import { errorCode } from '@/media-platform/errorCode';
import { IWebProxy } from '@/media-platform/webproxy';
import { logger } from '@/utils';
import { XiaoHongShuHomeWorker } from '@/cloud/task/platform/xiaohongshuhomeworker';
import { XiaohongshuhomeMessageWebSocketService } from '@/media-platform/xiaohongshuhome/xiaohongshuhome-message-websocket.service';

interface XiaohongshuhomeMessageCursor {
  [sessionId: string]: number;
}

interface XiaohongshuhomeMsgTaskParams {
  nextPage?: string;
  platformAuthorId?: string;
}

/**
 * 小红书主页私信监听专用 Worker。
 * 该 Worker 通过小红书主页平台 Worker 调用接口，不接管旧小红书模块。
 */
export class XiaohongshuhomeMsgWorker extends BaseMsgWorker {
  public readonly enableWebSocketIdleFallback: boolean = false;

  private lastMessageCursor?: string;
  private cursorInitialized: boolean = false;
  private lastCommentMentions?: number;
  private lastCommentCreateTime: number = 0;
  private commentFirstFetchCompleted: boolean = false;
  private readonly commentIds: Set<string> = new Set();
  private readonly messageIds: Set<string> = new Set();
  private cachedWsService?: XiaohongshuhomeMessageWebSocketService;
  private readonly platformWorker: XiaoHongShuHomeWorker;
  private websocketAuthRequestId: number = 0;

  constructor(cookie?: string, localStorage?: object, identity?: MsgWorkerIdentity) {
    super(cookie, localStorage, identity);
    this.platformWorker = new XiaoHongShuHomeWorker(cookie, localStorage);
  }

  protected normalizeLocalStorage(localStorage?: object): object | undefined {
    return localStorage;
  }

  public refreshCookie(cookie: string, localStorage?: object, proxy?: IWebProxy): void {
    super.refreshCookie(cookie, localStorage, proxy);
    this.platformWorker.refreshCookie(cookie, localStorage);
  }

  private normalizeResult<T extends BaseResult>(result: T): T {
    if (result?.code === -100 || result?.code === 401 || result?.msg?.includes('登录')) {
      result.code = errorCode.loginExpire;
    }
    return result;
  }

  private async ensurePlatformAuthorId(platformAuthorId?: string): Promise<string> {
    if (platformAuthorId) {
      this.platformAuthorId = platformAuthorId;
      return platformAuthorId;
    }
    if (this.platformAuthorId) {
      return this.platformAuthorId;
    }

    const userInfo = await this.platformWorker.getUserInfo(this.proxy);
    if (userInfo?.yixiaoerId) {
      this.platformAuthorId = userInfo.yixiaoerId;
    }
    return this.platformAuthorId ?? '';
  }

  public async getConversationList(taskParams: {
    nextPage?: string;
    platformAuthorId?: string;
  }): Promise<MessageConversationListInfoResponse> {
    const accountId = await this.ensurePlatformAuthorId(taskParams.platformAuthorId);
    return this.normalizeResult(
      await this.platformWorker.getConversationList({
        nextPage: taskParams.nextPage,
        platformAuthorId: accountId,
        proxy: this.proxy,
      }),
    );
  }

  public async getConversationInfo(taskParams: {
    sessionId: string;
    secSessionId?: string;
    messageUserId?: string;
    platformAuthorId?: string;
  }): Promise<MessageConversationListInfoResponse> {
    const accountId = await this.ensurePlatformAuthorId(taskParams.platformAuthorId ?? taskParams.secSessionId);
    return this.normalizeResult(
      await this.platformWorker.getConversationInfo({
        sessionId: taskParams.sessionId,
        secSessionId: taskParams.secSessionId,
        messageUserId: taskParams.messageUserId,
        platformAuthorId: accountId,
        proxy: this.proxy,
      }),
    );
  }

  public async getNewConversationList(taskParams: {
    nextPage?: string;
    platformAuthorId?: string;
  }): Promise<MessageListInfoResponse> {
    const accountId = await this.ensurePlatformAuthorId(taskParams.platformAuthorId);
    return this.normalizeResult(
      await this.platformWorker.getNewConversationList({
        nextPage: taskParams.nextPage,
        platformAuthorId: accountId,
        proxy: this.proxy,
      }),
    );
  }

  public async getMessageListByConversation(taskParams: {
    sessionId: string;
    secSessionId?: string;
    nextPage?: string;
    platformAuthorId?: string;
  }): Promise<MessageListInfoResponse> {
    const accountId = await this.ensurePlatformAuthorId(taskParams.platformAuthorId ?? taskParams.secSessionId);
    return this.normalizeResult(
      await this.platformWorker.getMessageListByConversation({
        sessionId: taskParams.sessionId,
        nextPage: taskParams.nextPage,
        platformAuthorId: accountId,
        proxy: this.proxy,
      }),
    );
  }

  public async getNewMessageList(taskParams: XiaohongshuhomeMsgTaskParams): Promise<MessageListInfoResponse> {
    const accountId = await this.ensurePlatformAuthorId(taskParams.platformAuthorId);
    if (!accountId) {
      return { code: errorCode.notLogin, msg: '获取小红书主页用户信息失败' };
    }

    const result: MessageListInfoResponse = { code: 0, msg: '', dataList: [] };
    const cursors = this.parseMessageCursor(taskParams.nextPage ?? this.lastMessageCursor);
    const isInitialFetch = !this.cursorInitialized && !taskParams.nextPage && !this.lastMessageCursor;
    const conversationResult = await this.getConversationList({ platformAuthorId: accountId });
    if (conversationResult.code !== 0) {
      return conversationResult as MessageListInfoResponse;
    }

    for (const conversation of conversationResult.dataList ?? []) {
      const sessionId = conversation.sessionId;
      const messageUserId = conversation.messageUserId;
      if (!sessionId || !messageUserId) {
        continue;
      }

      const rawConversation = conversation.raw as Record<string, any> | undefined;
      const maxStoreId = Number(rawConversation?.max_store_id ?? 0);
      const previousCursor = cursors[sessionId] ?? cursors.__global__ ?? 0;

      if (isInitialFetch) {
        if (maxStoreId > 0) {
          cursors[sessionId] = maxStoreId;
          continue;
        }
      }

      const messageResult = await this.platformWorker.getMessageListByConversation({
        sessionId,
        messageUserId,
        platformAuthorId: accountId,
        proxy: this.proxy,
      });
      if (messageResult.code !== 0) {
        return messageResult;
      }

      let conversationMaxStoreId = maxStoreId;
      for (const item of messageResult.dataList ?? []) {
        const storeId = Number(item.index ?? 0);
        conversationMaxStoreId = Math.max(conversationMaxStoreId, storeId);
        const messageKey = this.getMessageKey(item.sessionId ?? sessionId, item.messageId);
        if (isInitialFetch) {
          this.rememberMessage(item.sessionId ?? sessionId, item.messageId);
        }
        if (
          isInitialFetch ||
          storeId <= previousCursor ||
          (messageKey && this.messageIds.has(messageKey))
        ) {
          if (isInitialFetch && storeId > 0) {
            cursors[sessionId] = Math.max(cursors[sessionId] ?? 0, storeId);
          }
          continue;
        }
        result.dataList?.push(item);
        this.rememberMessage(item.sessionId ?? sessionId, item.messageId);
      }

      if (conversationMaxStoreId > previousCursor) {
        cursors[sessionId] = conversationMaxStoreId;
      }
    }

    this.cursorInitialized = true;
    result.nextPage = this.serializeMessageCursor(cursors);
    return this.normalizeResult(result);
  }

  public async fetchNewMessages(taskParams?: any): Promise<MessageListInfoResponse> {
    const accountId = await this.ensurePlatformAuthorId(taskParams?.platformAuthorId);
    if (!accountId) {
      return { code: errorCode.notLogin, msg: '获取小红书主页用户信息失败' };
    }

    if (taskParams?.event instanceof EventEmitter) {
      await this.fetchLatestComments(accountId, taskParams.event);
    }

    const result = await this.getNewMessageList({
      nextPage: this.lastMessageCursor,
      platformAuthorId: accountId,
    });
    if (result.code === 0 && result.nextPage) {
      this.lastMessageCursor = result.nextPage;
    }
    return result;
  }

  public async initMsgCursorCookie(): Promise<void> {
    // 小红书主页 WebSocket 只处理连接成功后收到的私信，首条实时消息到达时再记录游标。
  }

  public async SendMessage(taskParams: {
    sessionId: string;
    secSessionId?: string;
    text: string;
    messageType?: MessageType;
    imageInfo?: ImageInfo;
    proxy?: IWebProxy;
  }): Promise<{ code: number; msg: string; messageId?: string }> {
    if (taskParams.messageType && taskParams.messageType !== MessageType.text) {
      return { code: 444, msg: '小红书主页私信当前仅支持文本消息' };
    }
    if (taskParams.imageInfo) {
      return { code: 444, msg: '小红书主页私信当前不支持图片消息' };
    }

    const senderId = await this.ensurePlatformAuthorId(taskParams.secSessionId);
    if (!senderId || !taskParams.sessionId) {
      return { code: errorCode.data_error, msg: '小红书主页私信缺少发送方或接收方id' };
    }
    return this.platformWorker.SendMessage({
      sessionId: taskParams.sessionId,
      secSessionId: taskParams.secSessionId,
      text: taskParams.text,
      messageType: taskParams.messageType,
      imageInfo: taskParams.imageInfo,
      platformAuthorId: senderId,
      proxy: taskParams.proxy ?? this.proxy,
    });
  }

  public async fetchRecentComments(taskParams: {
    days: number;
    platformAuthorId?: string;
    event?: EventEmitter;
  }): Promise<BaseResult> {
    const accountId = await this.ensurePlatformAuthorId(taskParams.platformAuthorId);
    if (!accountId) {
      return { code: errorCode.notLogin, msg: '获取小红书主页用户信息失败' };
    }

    const result = await this.platformWorker.getLatestCommentNoticeList({
      platformAuthorId: accountId,
      proxy: this.proxy,
    });
    if (result.code === 0 && taskParams.event && result.dataList?.length) {
      const minTimestamp = Date.now() - Math.max(taskParams.days ?? 0, 0) * 24 * 60 * 60 * 1000;
      const comments = result.dataList.filter((item) => item.timestamp >= minTimestamp);
      if (comments.length) {
        taskParams.event.emit(SyncEventName.comment_data_back, comments);
      }
    }
    return this.normalizeResult({ code: result.code, msg: result.msg });
  }

  public async handleWebSocketPushData(notifyData?: any): Promise<void> {
    const messages = notifyData?.messages as Array<import('@/service/datasync-service-manager').MessageBackItem>;
    if (Array.isArray(messages)) {
      const cursors = this.parseMessageCursor(this.lastMessageCursor);
      for (const message of messages) {
        const storeId = Number(message.index ?? 0);
        if (message.sessionId && storeId > (cursors[message.sessionId] ?? 0)) {
          cursors[message.sessionId] = storeId;
        }
        this.rememberMessage(message.sessionId, message.messageId);
      }
      this.lastMessageCursor = this.serializeMessageCursor(cursors);
    }

    const comments = notifyData?.comments as CommentBackItem[];
    if (Array.isArray(comments)) {
      for (const comment of comments) {
        this.rememberComment(comment);
      }
      this.commentFirstFetchCompleted = true;
    }
  }

  public async createWebSocketService(): Promise<BaseWebSocketService | null> {
    try {
      this.disposeWebSocketService();
      const accountId = await this.ensurePlatformAuthorId();
      if (!accountId) {
        return null;
      }
      const authInfo = await this.platformWorker.getWebSocketAuthInfo(this.proxy);
      if (authInfo.code !== 0 || !authInfo.aLt) {
        logger.error(`创建小红书主页WebSocket服务失败:${authInfo.msg ?? '获取WebSocket登录参数失败'}`);
        return null;
      }
      const wsService = new XiaohongshuhomeMessageWebSocketService({
        cookie: this.cookie,
        localStorage: this.localStorage,
        accountId,
        userId: accountId,
        aLt: authInfo.aLt,
        deviceId: authInfo.deviceId,
        proxy: this.proxy,
      });
      if (!wsService.hasAuthCredentials()) {
        return null;
      }
      this.cachedWsService = wsService;
      return wsService;
    } catch (error) {
      logger.error(`创建小红书主页WebSocket服务失败:${error instanceof Error ? error.message : '未知错误'}`);
      return null;
    }
  }

  public disposeWebSocketService(): void {
    if (this.cachedWsService) {
      this.cachedWsService.close();
    }
    this.cachedWsService = undefined;
  }

  public updateWebSocketCookie(cookie: string, localStorage?: object): void {
    this.cookie = this.normalizeCookie(cookie);
    this.localStorage = this.normalizeLocalStorage(localStorage);
    this.platformWorker.refreshCookie(cookie, localStorage);
    if (!this.cachedWsService) {
      return;
    }

    const requestId = ++this.websocketAuthRequestId;
    void (async () => {
      try {
        const authInfo = await this.platformWorker.getWebSocketAuthInfo(this.proxy);
        if (requestId !== this.websocketAuthRequestId || !this.cachedWsService) {
          return;
        }
        if (authInfo.code !== 0 || !authInfo.aLt) {
          logger.error(`更新小红书主页WebSocket登录参数失败:${authInfo.msg ?? '获取WebSocket登录参数失败'}`);
          return;
        }
        this.cachedWsService.updateCookie(
          this.cookie,
          this.localStorage,
          this.proxy,
          authInfo.aLt,
          authInfo.deviceId,
        );
      } catch (error) {
        if (requestId === this.websocketAuthRequestId) {
          logger.error(`更新小红书主页WebSocket登录参数失败:${error instanceof Error ? error.message : '未知错误'}`);
        }
      }
    })();
  }

  public async dropMsgService(): Promise<{ code: number; msg: string }> {
    this.disposeWebSocketService();
    this.lastMessageCursor = undefined;
    this.cursorInitialized = false;
    this.lastCommentMentions = undefined;
    this.lastCommentCreateTime = 0;
    this.commentFirstFetchCompleted = false;
    this.commentIds.clear();
    this.messageIds.clear();
    return { code: 0, msg: '' };
  }

  public async getCommentContent(taskParams: {
    nextPage?: string;
    platformAuthorId?: string;
  }): Promise<import('@/media-platform').CommentContentListInfoResponse> {
    return this.platformWorker.getCommentContent({
      nextPage: taskParams.nextPage,
      platformAuthorId: taskParams.platformAuthorId,
      proxy: this.proxy,
    });
  }

  public async getContentComment(taskParams: {
    contentId: string;
    xsecToken?: string;
    commentId?: string;
    nextPage?: string;
    platformAuthorId?: string;
  }): Promise<import('@/media-platform').CommentListInfoResponse> {
    return this.platformWorker.getContentComment({
      contentId: taskParams.contentId,
      xsecToken: taskParams.xsecToken,
      commentId: taskParams.commentId,
      nextPage: taskParams.nextPage,
      platformAuthorId: taskParams.platformAuthorId,
      proxy: this.proxy,
    });
  }

  private async fetchLatestComments(accountId: string, event: EventEmitter): Promise<void> {
    try {
      const unreadCountResult = await this.platformWorker.getUnreadCount(this.proxy);
      if (unreadCountResult.code !== 0) {
        logger.error(`获取小红书主页评论未读数失败:${this.platformAccountId}:${unreadCountResult.msg ?? ''}`);
        return;
      }

      const mentions = Number(unreadCountResult.data?.mentions);
      if (!Number.isFinite(mentions)) {
        logger.error(`获取小红书主页评论未读数失败:${this.platformAccountId}:未读数格式异常`);
        return;
      }

      const previousMentions = this.lastCommentMentions;
      this.lastCommentMentions = mentions;
      if (previousMentions !== undefined && previousMentions === mentions) {
        return;
      }

      const result = await this.platformWorker.getLatestCommentNoticeList({
        platformAuthorId: accountId,
        proxy: this.proxy,
      });
      if (result.code !== 0) {
        return;
      }

      const freshComments: CommentBackItem[] = [];
      const previousCommentCreateTime = this.lastCommentCreateTime;
      for (const comment of result.dataList ?? []) {
        const isNew =
          !this.commentIds.has(comment.commentId) &&
          (!this.commentFirstFetchCompleted || comment.timestamp >= previousCommentCreateTime);
        this.rememberComment(comment);
        if (this.commentFirstFetchCompleted && isNew) {
          freshComments.push(comment);
        }
      }

      this.commentFirstFetchCompleted = true;
      if (freshComments.length) {
        event.emit(SyncEventName.comment_data_back, freshComments);
      }
    } catch (error) {
      logger.error(
        `获取小红书主页最新评论失败:${this.platformAccountId}:${error instanceof Error ? error.message : '未知错误'}`,
      );
    }
  }

  private rememberComment(comment: CommentBackItem): void {
    if (comment.commentId) {
      this.commentIds.add(comment.commentId);
    }
    this.lastCommentCreateTime = Math.max(this.lastCommentCreateTime, comment.timestamp || 0);
    if (this.commentIds.size > 2000) {
      const first = this.commentIds.values().next().value as string | undefined;
      if (first) {
        this.commentIds.delete(first);
      }
    }
  }

  private parseMessageCursor(cursor?: string): XiaohongshuhomeMessageCursor {
    if (!cursor) {
      return {};
    }
    try {
      const parsed = JSON.parse(cursor) as Record<string, unknown>;
      if (typeof parsed === 'number' && Number.isFinite(parsed)) {
        return { __global__: parsed };
      }
      if (parsed && typeof parsed === 'object') {
        return Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key, Number(value) || 0]));
      }
    } catch {
      const numberCursor = Number(cursor);
      if (Number.isFinite(numberCursor)) {
        return { __global__: numberCursor };
      }
    }
    return {};
  }

  private getMessageKey(sessionId: string | undefined, messageId: string | undefined): string {
    if (!sessionId || !messageId) {
      return '';
    }
    return `${sessionId}:${messageId}`;
  }

  private rememberMessage(sessionId: string | undefined, messageId: string | undefined): void {
    const messageKey = this.getMessageKey(sessionId, messageId);
    if (!messageKey) {
      return;
    }
    this.messageIds.add(messageKey);
    if (this.messageIds.size > 2000) {
      const first = this.messageIds.values().next().value as string | undefined;
      if (first) {
        this.messageIds.delete(first);
      }
    }
  }

  private serializeMessageCursor(cursor: XiaohongshuhomeMessageCursor): string {
    return JSON.stringify(cursor);
  }
}
