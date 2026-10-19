import { logger } from '@/utils';
import { BaseMsgWorker, MsgWorkerIdentity } from '@/cloud/task/base-msg-worker';
import { BaseWebSocketService } from '@/cloud/task/base-websocket.service';
import { MessageListInfoResponse, Shipinhao } from '@/media-platform';
import { ShipinhaoMessageWebSocketService } from '@/media-platform/shipinhao/shipinhao-message-websocket.service';
import { BaseResult } from '@/media-platform/baseResult';
import { errorCode } from '@/media-platform/errorCode';
import { ShipinhaoRecentCommentFetcher } from '@/cloud/task/shipinhao-recent-comment-fetcher';
import type { ShipinhaoRecentCommentFetchParams } from '@/cloud/task/shipinhao-recent-comment-fetcher';

/**
 * 视频号私信监听专用 Worker
 * 只保留监听和拉取私信所需的最小状态
 */
export class ShiPinHaoMsgWorker extends BaseMsgWorker {
  public readonly enableWebSocketIdleFallback: boolean = false;
  private static finderUsernameCache: Map<string, string> = new Map();

  private cachedWsService?: ShipinhaoMessageWebSocketService;
  private msgCursorCookie?: string;
  private finderUsername?: string;
  private readonly recentCommentFetcher: ShipinhaoRecentCommentFetcher;

  constructor(cookie?: string, localStorage?: object, identity?: MsgWorkerIdentity) {
    super(cookie, undefined, identity);
    this.recentCommentFetcher = new ShipinhaoRecentCommentFetcher({
      getCookie: () => this.cookie,
      ensureIdentity: (platformAuthorId) => this.ensureIdentity(platformAuthorId),
    });
  }

  private logNonProd(message: string): void {
    if (process.env.ENV === 'test') {
      logger.info(message);
    }
  }

  private normalizeResult<T extends BaseResult>(result: T): T {
    if (
      result?.code === 300333 ||
      result?.code === 300334 ||
      result?.code === 300342 ||
      result?.msg?.includes('登录')
    ) {
      result.code = errorCode.loginExpire;
    }

    return result;
  }

  /**
   * 保证视频号监听需要的账号标识可用
   */
  private async ensureIdentity(
    platformAuthorId?: string,
  ): Promise<{ platformAuthorId: string; finderUsername: string }> {
    if (platformAuthorId) {
      this.platformAuthorId = platformAuthorId;
    }

    if (this.platformAuthorId) {
      const cachedFinderUsername = ShiPinHaoMsgWorker.finderUsernameCache.get(this.platformAuthorId);
      if (cachedFinderUsername) {
        this.finderUsername = cachedFinderUsername;
        return {
          platformAuthorId: this.platformAuthorId,
          finderUsername: cachedFinderUsername,
        };
      }

      if (this.finderUsername) {
        return {
          platformAuthorId: this.platformAuthorId,
          finderUsername: this.finderUsername,
        };
      }
    }

    const userInfo = await Shipinhao.getShipinhaoMessageInitInfo(this.cookie, this.proxy);
    if (userInfo?.yixiaoerId) {
      this.platformAuthorId = userInfo.yixiaoerId;
    }

    const finderUsername =
      typeof userInfo?.raw?.['finderUsername'] === 'string' ? (userInfo.raw['finderUsername'] as string) : '';

    if (finderUsername) {
      this.finderUsername = finderUsername;
      if (this.platformAuthorId) {
        ShiPinHaoMsgWorker.finderUsernameCache.set(this.platformAuthorId, finderUsername);
      }
    }

    return {
      platformAuthorId: this.platformAuthorId ?? '',
      finderUsername: this.finderUsername ?? '',
    };
  }

  /**
   * 拉取视频号全量新私信
   */
  public async getNewMessageList(taskParams: {
    nextPage?: string;
    platformAuthorId?: string;
  }): Promise<MessageListInfoResponse> {
    const identity = await this.ensureIdentity(taskParams.platformAuthorId);
    const result = await Shipinhao.getShiPinHaoNewMessageList(
      this.cookie,
      taskParams.nextPage ?? '',
      identity.finderUsername,
      identity.platformAuthorId,
      undefined,
      this.proxy,
    );
    if (!taskParams.nextPage) {
      const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
      result.dataList = result.dataList?.filter((item) => item.timestamp >= thirtyMinutesAgo);
    }
    return this.normalizeResult(result);
  }

  /**
   * 拉取视频号单条新私信
   */
  private async getNewMsg(taskParams: {
    cursorCookie: string;
    platformAuthorId?: string;
  }): Promise<MessageListInfoResponse> {
    const identity = await this.ensureIdentity(taskParams.platformAuthorId);
    const result = await Shipinhao.getShiPinHaoNewMsg(
      this.cookie,
      taskParams.cursorCookie,
      identity.finderUsername,
      identity.platformAuthorId,
      this.proxy,
    );

    return this.normalizeResult(result);
  }

  /**
   * 根据游标优先增量拉取，没有游标时退回列表接口
   */
  public async fetchNewMessages(notifyData?: any): Promise<MessageListInfoResponse> {
    const identity = await this.ensureIdentity();

    if (this.msgCursorCookie) {
      const result = await this.getNewMsg({
        cursorCookie: this.msgCursorCookie,
        platformAuthorId: identity.platformAuthorId,
      });

      if (result.code === 0 && result.nextPage) {
        this.msgCursorCookie = result.nextPage;
      }

      return result;
    }

    const result = await this.getNewMessageList({
      platformAuthorId: identity.platformAuthorId,
    });

    if (result.code === 0 && result.nextPage) {
      this.msgCursorCookie = result.nextPage;
    }

    return result;
  }

  /**
   * 初始化消息游标
   */
  public async initMsgCursorCookie(): Promise<void> {
    try {
      const identity = await this.ensureIdentity();
      const result = await this.getNewMessageList({
        platformAuthorId: identity.platformAuthorId,
      });

      if (result.code === 0 && result.nextPage) {
        this.msgCursorCookie = result.nextPage;
      }
    } catch (error) {
      logger.error(`初始化消息游标cookie失败:${error}`);
    }
  }

  /**
   * 创建视频号 WebSocket 服务
   */
  public async createWebSocketService(): Promise<BaseWebSocketService | null> {
    try {
      this.disposeWebSocketService();

      const wxuin = this.extractWxuinFromCookie(this.cookie);
      if (!wxuin) {
        this.logNonProd('无法从Cookie中提取wxuin,WebSocket不可用');
        return null;
      }

      const sessionid = this.extractSessionIdFromCookie(this.cookie);
      if (!sessionid) {
        this.logNonProd('无法从Cookie中提取sessionid,WebSocket不可用');
        return null;
      }

      const wsService = new ShipinhaoMessageWebSocketService(sessionid, wxuin, this.proxy);
      this.cachedWsService = wsService;
      this.logNonProd('视频号WebSocket服务已创建');
      return wsService;
    } catch (error) {
      logger.error(`创建视频号WebSocket服务失败:${error}`);
      return null;
    }
  }

  /**
   * 更新 WebSocket 鉴权信息
   */
  /**
   * 清理 WebSocket 缓存
   */
  public disposeWebSocketService(): void {
    this.cachedWsService = undefined;
  }

  public updateWebSocketCookie(cookie: string, localStorage?: object): void {
    try {
      if (!this.cachedWsService) {
        return;
      }

      const wxuin = this.extractWxuinFromCookie(cookie);
      const sessionid = this.extractSessionIdFromCookie(cookie);
      if (!wxuin || !sessionid) {
        return;
      }

      this.cachedWsService.updateCookie(sessionid, wxuin, this.proxy);
    } catch (error) {
      logger.error(`更新视频号WebSocket Cookie失败:${error}`);
    }
  }

  public async dropMsgService(): Promise<{ code: number; msg: string }> {
    this.disposeWebSocketService();
    this.msgCursorCookie = undefined;
    this.finderUsername = undefined;
    this.recentCommentFetcher.reset();
    return { code: 0, msg: '' };
  }

  public async fetchRecentComments(taskParams: ShipinhaoRecentCommentFetchParams): Promise<BaseResult> {
    return this.normalizeResult(await this.recentCommentFetcher.fetch(taskParams));
  }

  /**
   * 从 Cookie 中提取 wxuin
   */
  private extractWxuinFromCookie(cookie: string): string | null {
    try {
      const match = cookie.match(/wxuin=([^;]+)/);
      return match ? match[1].trim() : null;
    } catch (error) {
      logger.error(`提取wxuin失败:${error}`);
      return null;
    }
  }

  /**
   * 从 Cookie 中提取 sessionid
   */
  private extractSessionIdFromCookie(cookie: string): string | null {
    try {
      const match = cookie.match(/sessionid=([^;]+)/);
      return match ? decodeURIComponent(match[1].trim()) : null;
    } catch (error) {
      logger.error(`提取sessionid失败:${error}`);
      return null;
    }
  }
}
