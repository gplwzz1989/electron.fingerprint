import { BaseMsgWorker, MsgWorkerIdentity } from '@/cloud/task/base-msg-worker';
import { MessageListInfoResponse, PlatformAuthorInfo } from '@/media-platform';
import { Douyin } from '../../media-platform/douyin';
import { BaseResult } from '@/media-platform/baseResult';
import { errorCode } from '@/media-platform/errorCode';
import { BaseWebSocketService } from '@/cloud/task/base-websocket.service';
import { DouyinMessageWebSocketService } from '@/media-platform/douyin/douyin-message-websocket.service';
import { logger } from '@/utils';
import { CommentBackItem, MessageBackItem, SyncEventName } from '@/service/datasync-service-manager';
import { EventEmitter } from 'events';
import {
  DouyinFrontierImWebSocketService
} from '@/media-platform/douyin/private_msg/standalone_notice_pc/douyin-frontier-im-websocket.service';

/**
 * 抖音私信监听专用 Worker
 * 只保留拉取私信所需的最小状态
 */
export class DouYinMsgWorker extends BaseMsgWorker {
  public readonly enableWebSocketIdleFallback: boolean = false;
  private lastMsgTimestamp?: string;
  private lastCommentCreateTime?: number;
  private commentFirstFetchCompleted: boolean = false;
  private cachedWsService?: DouyinFrontierImWebSocketService;//|DouyinMessageWebSocketService;

  constructor(cookie?: string, localStorage?: object, identity?: MsgWorkerIdentity) {
    super(cookie, localStorage, identity);
  }

  protected normalizeLocalStorage(localStorage?: object): object | undefined {
    return localStorage;
  }

  /**
   * 保证抖音作者 ID 可用
   */
  private async ensurePlatformAuthorId(platformAuthorId?: string): Promise<string> {
    if (platformAuthorId) {
      this.platformAuthorId = platformAuthorId;
      return platformAuthorId;
    }

    if (this.platformAuthorId) {
      return this.platformAuthorId;
    }

    const userInfo = await Douyin.getDouyinUserInfo(this.cookie, this.proxy);
    if (userInfo?.yixiaoerId) {
      this.platformAuthorId = userInfo.yixiaoerId;
      return userInfo.yixiaoerId;
    }

    return '';
  }

  /**
   * 仅缓存拉私信需要的最小用户信息
   */
  private cacheUserInfo(userInfo: PlatformAuthorInfo): void {
    const cachedUserInfo: PlatformAuthorInfo = {
      code: userInfo.code,
      yixiaoerId: userInfo.yixiaoerId,
      yixiaoerName: userInfo.yixiaoerName,
      yixiaoerImageUrl: userInfo.yixiaoerImageUrl,
      raw: undefined,
    };

    void cachedUserInfo;
  }

  /**
   * 保证抖音私信签名 token 可用
   */
  private normalizeResult<T extends BaseResult>(result: T): T {
    if (result?.code === 8 || result?.msg?.includes('登录')) {
      result.code = errorCode.loginExpire;
    }

    return result;
  }

  /**
   * 拉取抖音新私信
   */
  public async getNewMessageList(taskParams: {
    nextPage?: string;
    platformAuthorId?: string;
  }): Promise<MessageListInfoResponse> {
    const platformAuthorId = await this.ensurePlatformAuthorId(taskParams.platformAuthorId);
    let timeSep = Number(taskParams.nextPage ? taskParams.nextPage : 0);
    if (!timeSep) {
      timeSep = Date.now() * 1000;
    }

    const msgList: NonNullable<MessageListInfoResponse['dataList']> = [];
    let newResult = await Douyin.getDouYinMessageStrangerMessageList(
      this.cookie,
      this.localStorage ?? {},
      '',
      platformAuthorId,
      timeSep,
      this.proxy,
    );
    if (newResult?.msg?.includes('empty token')) {
      return { code: errorCode?.loginExpire, msg: '缺少签名参数' };
    }
    if (newResult?.code === 8 || newResult?.msg?.includes('登录')) {
      return this.normalizeResult(newResult);
    }
    while (newResult?.dataList?.length) {
      newResult.dataList.forEach((item) => {
        msgList.push(item);
      });

      if (!newResult.nextPage) {
        break;
      }

      newResult = await Douyin.getDouYinMessageStrangerMessageList(
        this.cookie,
        this.localStorage ?? {},
        newResult.nextPage,
        platformAuthorId,
        timeSep,
        this.proxy,
      );
    }

    const result = await Douyin.getDouYinNewMessageList(
      this.cookie,
      this.localStorage ?? {},
      taskParams.nextPage,
      platformAuthorId,
      this.proxy,
    );
    if (result?.msg?.includes('empty token')) {
      return { code: errorCode?.loginExpire, msg: '缺少签名参数' };
    }
    if (result?.dataList?.length) {
      result.dataList.forEach((item) => {
        msgList.push(item);
      });
    }

    result.dataList = msgList;
    if (result.dataList?.length) {
      const maxTime = Math.max(...result.dataList.map((item) => item.timestamp));
      const endTime = maxTime * 1000 + 1;
      const nextTime = Number(result.nextPage ?? endTime);
      if (endTime > nextTime) {
        result.nextPage = endTime.toString();
      }
    }

    if (!result.nextPage) {
      result.nextPage = timeSep.toString();
    }

    return this.normalizeResult(result);
  }

  public async handleWebSocketPushData(notifyData?: any): Promise<void> {
    this.updateWebSocketMessageCursor(notifyData?.messages);
    this.updateWebSocketCommentCursor(notifyData?.comments);
  }

  private updateWebSocketMessageCursor(messages?: MessageBackItem[]): void {
    if (!Array.isArray(messages) || messages.length === 0) {
      return;
    }

    const maxTime = Math.max(...messages.map((item) => Number(item.timestamp) || 0));
    if (maxTime <= 0) {
      return;
    }

    const nextCursor = (maxTime * 1000 + 1).toString();
    if (!this.lastMsgTimestamp || Number(nextCursor) > Number(this.lastMsgTimestamp)) {
      this.lastMsgTimestamp = nextCursor;
    }
  }

  private updateWebSocketCommentCursor(comments?: CommentBackItem[]): void {
    if (!Array.isArray(comments) || comments.length === 0) {
      return;
    }

    const maxCreateTime = Math.max(...comments.map((item) => Math.floor((Number(item.timestamp) || 0) / 1000)));
    if (maxCreateTime <= 0) {
      return;
    }

    this.lastCommentCreateTime = Math.max(this.lastCommentCreateTime ?? 0, maxCreateTime);
    this.commentFirstFetchCompleted = true;
  }

  /**
   * 常驻轮询拉取入口
   */
  public async fetchNewMessages(taskParams?: any): Promise<MessageListInfoResponse> {
    const accId = taskParams?.platformAuthorId;
    if (!accId && !this.platformAuthorId) {
      return { code: 400, msg: '获取用户信息失败' };
    }
    const platformAuthorId = (await this.ensurePlatformAuthorId()) ?? accId;

    if (taskParams?.event && taskParams.event instanceof EventEmitter) {
      await this.fetchLatestComments(platformAuthorId, taskParams.event);
    }

    const result = await this.getNewMessageList({
      nextPage: this.lastMsgTimestamp,
      platformAuthorId,
    });

    if (result.code === 0 && result.nextPage) {
      this.lastMsgTimestamp = result.nextPage;
    }

    return result;
  }

  private async fetchLatestComments(platformAuthorId: string, event: EventEmitter): Promise<void> {
    try {
      const commentResult = await Douyin.getDouYinLatestCommentNoticeList(this.cookie, platformAuthorId, {
        lastCreateTime: this.lastCommentCreateTime,
        isFirstFetch: !this.commentFirstFetchCompleted,
        proxy: this.proxy,
      });

      if (commentResult?.code === 8 || commentResult?.msg?.includes('登录')) {
        return;
      }

      const latestCreateTime = Number(commentResult?.data?.['lastCreateTime'] ?? this.lastCommentCreateTime ?? 0);
      if (latestCreateTime > 0) {
        this.lastCommentCreateTime = latestCreateTime;
      }

      if (!this.commentFirstFetchCompleted) {
        this.commentFirstFetchCompleted = true;
      }

      if (commentResult?.dataList?.length) {
        event.emit(SyncEventName.comment_data_back, commentResult.dataList as CommentBackItem[]);
      }
    } catch (error) {
      logger.error(`获取抖音最新评论失败:${this.platformAccountId}:${error}`);
    }
  }

  public async createWebSocketService(): Promise<BaseWebSocketService | null> {
    try {
      this.disposeWebSocketService();

      const wsService = new DouyinFrontierImWebSocketService({
        cookie: this.cookie,
        proxy: this.proxy,
        accountId: this.platformAuthorId,
        userId:this.platformAuthorId
      } as never);
      await wsService.prepareConnection();
      this.cachedWsService = wsService;
      return wsService;
    } catch (error) {
      logger.error(`创建抖音WebSocket服务失败:${error}`);
      return null;
    }
  }

  public disposeWebSocketService(): void {
    this.cachedWsService = undefined;
  }

  public updateWebSocketCookie(cookie: string, localStorage?: object): void {
    try {
      if (!this.cachedWsService) {
        return;
      }

      this.cachedWsService.updateCookie(cookie, undefined, this.proxy);
    } catch (error) {
      logger.error(`更新抖音WebSocket Cookie失败:${error}`);
    }
  }

  public async dropMsgService(): Promise<{ code: number; msg: string }> {
    this.disposeWebSocketService();
    return { code: 0, msg: '' };
  }
}
