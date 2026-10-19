import { EventEmitter } from 'events';
import { generateToken } from '@/cloud/task/taskService';
import { CommentBackItem, MessageBackItem, Platforms, SyncEventName } from '@/service/datasync-service-manager';
import { PlatformAccountInfo } from '@/cloud/model/BaseTaskFormModel';
import { isJson, logger, Task } from '@/utils';
import { BaseResult } from '@/media-platform/baseResult';
import { PubConfig } from '@/Config';
import { CallBackDataEvent } from '@/cloud/model/TypeEnum';
import { AxiosError } from 'axios';
import { $webhookHttp } from '@/http';
import { MessageConversationListInfoResponse, MessageListInfoResponse } from '@/media-platform';
import { BaseWebSocketService } from '@/cloud/task/base-websocket.service';
import { BaseMsgWorker } from '@/cloud/task/base-msg-worker';
import { DouYinMsgWorker } from '@/cloud/task/douyin-msg-worker';
import { ShiPinHaoMsgWorker } from '@/cloud/task/shipinhao-msg-worker';
import { XiaohongshuhomeMsgWorker } from './xiaohongshuhome-msg-worker';
import { errorCode } from '@/media-platform/errorCode';

/**
 * 私信Worker服务
 * 专门处理私信监控和Webhook推送,与评论功能解耦
 * 用于常驻服务,持续监控平台账号的新私信
 *
 * 支持两种监听模式:
 * 1. 轮询模式: 定时调用API获取新消息(适用于大部分平台)
 * 2. WebSocket模式: 实时监听新消息通知(由平台模块提供WebSocket实现)
 */
export class MessageWorkerService {
  private static readonly WEB_SOCKET_IDLE_TIMEOUT_MS = 60 * 60 * 1000;
  private static readonly WEB_SOCKET_FALLBACK_POLLING_LOOP_SECOND = 30;
  protected readonly platform: Platforms;
  protected readonly authToken: string = '';
  protected readonly account: PlatformAccountInfo;
  protected readonly worker: BaseMsgWorker;
  public eventCall?: EventEmitter;
  protected gettingMsg: boolean = true;
  protected drop: boolean = false;
  protected lastMsgTimestamp: string = '';
  protected pollingLoopSecond: number = 30;
  protected heartbeatTimer?: NodeJS.Timeout;
  protected msgTimer?: NodeJS.Timeout;

  // WebSocket相关(由平台模块提供)
  protected wsService?: BaseWebSocketService;
  protected wsIdleTimer?: NodeJS.Timeout;
  protected wsFetchInProgress: boolean = false;
  protected wsFetchPending: boolean = false;
  private loginExpireHandled: boolean = false;

  constructor(platform: Platforms, account: PlatformAccountInfo) {
    this.platform = platform;
    this.account = MessageWorkerService.normalizeAccount(platform, account);
    this.eventCall = new EventEmitter();
    this.worker = this.createWorker(platform, this.account);

    // 启动心跳
    this.startHeartbeat();

    this.logNonProd(`MessageWorker已创建:${this.account.platformAccountId}`);
  }

  private logNonProd(message: string): void {
    if (process.env.ENV === 'test') {
      logger.info(message);
    }
  }

  private getJitteredDelay(baseMs: number, ratio: number = 0.1): number {
    if (baseMs <= 0) {
      return 0;
    }

    const delta = Math.floor(baseMs * ratio);
    const min = Math.max(0, baseMs - delta);
    const max = baseMs + delta;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private stopWebSocketIdleTimer(): void {
    if (this.wsIdleTimer) {
      clearTimeout(this.wsIdleTimer);
      this.wsIdleTimer = undefined;
    }
  }

  private isWebSocketIdleFallbackEnabled(): boolean {
    return this.worker.enableWebSocketIdleFallback !== false;
  }

  private releaseWebSocketRuntime(): void {
    const wsService = this.wsService;
    this.wsService = undefined;
    this.stopWebSocketIdleTimer();
    this.wsFetchInProgress = false;
    this.wsFetchPending = false;

    if (wsService) {
      try {
        wsService.close();
      } catch (error) {
        logger.error(`关闭WebSocket 失败:${this.account.platformAccountId}:${error}`);
      }
    }

    this.worker.disposeWebSocketService();
  }

  private startWebSocketIdleTimer(): void {
    if (!this.wsService) {
      return;
    }

    this.stopWebSocketIdleTimer();
    if (!this.isWebSocketIdleFallbackEnabled()) {
      return;
    }

    this.wsIdleTimer = setTimeout(() => {
      void this.handleWebSocketIdleTimeout();
    }, MessageWorkerService.WEB_SOCKET_IDLE_TIMEOUT_MS);
  }

  private async handleWebSocketIdleTimeout(): Promise<void> {
    if (this.drop || !this.wsService || !this.isWebSocketIdleFallbackEnabled()) {
      return;
    }

    logger.info(`WebSocket 连续 3600 秒没有新消息，切换到 HTTP 轮询接力:${this.account.platformAccountId}`);

    this.releaseWebSocketRuntime();
    await this.startPollingMode(MessageWorkerService.WEB_SOCKET_FALLBACK_POLLING_LOOP_SECOND);
  }
  /**
   * 仅保留私信监听所需的最小账号信息
   */
  private static normalizeAccount(platform: Platforms, account: PlatformAccountInfo): PlatformAccountInfo {
    const normalizedAccount: PlatformAccountInfo = {
      cookie: account.cookie,
      platformAccountId: account.platformAccountId,
      platformAuthorId: account.platformAuthorId,
      authorization: account.authorization,
      proxy: account.proxy,
    };

    if (platform === Platforms.DouYin) {
      const source = (account.localStorage ?? {}) as Record<string, unknown>;
      normalizedAccount.localStorage = {
        'security-sdk/s_sdk_pri_key': source['security-sdk/s_sdk_pri_key'],
        'security-sdk/s_sdk_crypt_sdk': source['security-sdk/s_sdk_crypt_sdk'],
        'security-sdk/s_sdk_sign_data_key/token': source['security-sdk/s_sdk_sign_data_key/token'],
        'security-sdk/s_sdk_sign_data_key/web_protect': source['security-sdk/s_sdk_sign_data_key/web_protect'],
      };
    }

    if (platform === Platforms.XiaoHongShuHome) {
      normalizedAccount.localStorage = account.localStorage;
    }

    return normalizedAccount;
  }

  /**
   * 创建私信监听专用 Worker
   */
  private createWorker(platform: Platforms, account: PlatformAccountInfo): BaseMsgWorker {
    switch (platform) {
      case Platforms.DouYin:
        return new DouYinMsgWorker(account.cookie, account.localStorage, {
          platformAccountId: account.platformAccountId,
          platformAuthorId: account.platformAuthorId,
          proxy: account.proxy,
        });
      case Platforms.ShiPinHao:
        return new ShiPinHaoMsgWorker(account.cookie, undefined, {
          platformAccountId: account.platformAccountId,
          platformAuthorId: account.platformAuthorId,
          proxy: account.proxy,
        });
      case Platforms.XiaoHongShuHome:
        return new XiaohongshuhomeMsgWorker(account.cookie, account.localStorage, {
          platformAccountId: account.platformAccountId,
          platformAuthorId: account.platformAuthorId,
          proxy: account.proxy,
        });
      default:
        throw new Error(`当前私信常驻监听暂不支持平台:${platform}`);
    }
  }

  /**
   * 启动私信监控
   * @param loopSecond 轮询间隔(秒),默认30秒
   * @param lastMsgTimestamp 上次消息时间戳(可选)
   */
  public async startGetMessage(loopSecond: number = 30, lastMsgTimestamp?: string): Promise<void> {
    this.logNonProd(`[startGetMessage] 开始启动私信监控:${this.account.platformAccountId},轮询间隔:${loopSecond}秒`);
    this.pollingLoopSecond = loopSecond;

    if (lastMsgTimestamp) {
      this.lastMsgTimestamp = lastMsgTimestamp;
    }

    // 尝试从平台Worker获取WebSocket服务
    this.logNonProd(`[startGetMessage] 尝试获取WebSocket服务:${this.account.platformAccountId}`);
    const wsService = await this.tryGetWebSocketService();

    if (wsService) {
      // 使用WebSocket模式
      this.logNonProd(`[startGetMessage] 使用WebSocket模式:${this.account.platformAccountId}`);
      await this.startWebSocketMode(wsService);
    } else {
      // 使用轮询模式
      this.logNonProd(`[startGetMessage] 使用轮询模式:${this.account.platformAccountId}`);
      await this.startPollingMode(loopSecond);
    }
  }

  /**
   * 尝试从平台Worker获取WebSocket服务
   * 由各平台模块决定是否提供WebSocket支持
   */
  private async tryGetWebSocketService(): Promise<BaseWebSocketService | null> {
    try {
      this.logNonProd(`[tryGetWebSocketService] 检查平台是否支持WebSocket:${this.account.platformAccountId}`);

      // 调用平台Worker的方法获取WebSocket服务
      // 如果平台不支持WebSocket,会返回null
      if (typeof this.worker.createWebSocketService === 'function') {
        this.logNonProd(
          `[tryGetWebSocketService] 平台支持WebSocket,调用createWebSocketService:${this.account.platformAccountId}`,
        );
        const wsService = await this.worker.createWebSocketService();
        this.logNonProd(
          `[tryGetWebSocketService] createWebSocketService返回:${this.account.platformAccountId},wsService=${
            wsService ? '有值' : 'null'
          }`,
        );
        return wsService || null;
      }

      this.logNonProd(
        `[tryGetWebSocketService] 平台不支持WebSocket(没有createWebSocketService方法):${this.account.platformAccountId}`,
      );
      return null;
    } catch (error) {
      logger.error(`获取WebSocket服务失败:${this.account.platformAccountId}:${error}`);
      return null;
    }
  }

  /**
   * 启动WebSocket监听模式
   */
  private async startWebSocketMode(wsService: BaseWebSocketService): Promise<void> {
    try {
      this.wsService = wsService;

      // 初始化平台Worker的消息游标(如果平台需要)
      if (typeof this.worker.initMsgCursorCookie === 'function') {
        await this.worker.initMsgCursorCookie();
      }

      // 绑定事件监听器
      this.bindWebSocketEventListeners();

      // 连接WebSocket
      this.wsService.connect();
      this.startWebSocketIdleTimer();

      this.logNonProd(`WebSocket 监听已启动:${this.account.platformAccountId}`);
    } catch (error) {
      logger.error(`启动 WebSocket 模式失败:${this.account.platformAccountId}:${error}`);
      this.releaseWebSocketRuntime();
      await this.startPollingMode(MessageWorkerService.WEB_SOCKET_FALLBACK_POLLING_LOOP_SECOND);
    }
  }
  /**
   * 绑定WebSocket事件监听器
   */
  private bindWebSocketEventListeners(): void {
    if (!this.wsService) {
      return;
    }

    // 监听连接事件 - 重要: 每次连接成功都会触发,包括重连
    this.wsService.on('connected', () => {
      this.startWebSocketIdleTimer();

      if (typeof this.worker.initMsgCursorCookie === 'function') {
        this.worker.initMsgCursorCookie().catch((error) => {
          logger.error(`重连后初始化消息游标失败:${this.account.platformAccountId}:${error}`);
        });
      }
    });

    // 监听认证失败事件
    this.wsService.on('authFailed', async (reason) => {
      logger.error(`WebSocket 认证失败:${this.account.platformAccountId}:${reason}`);
      this.releaseWebSocketRuntime();
      await this.startPollingMode(MessageWorkerService.WEB_SOCKET_FALLBACK_POLLING_LOOP_SECOND);
    });

    this.wsService.on('reconnectFailed', async (reason) => {
      logger.error(`WebSocket 重连达到最大次数，降级为轮询:${this.account.platformAccountId}:${reason}`);
      this.releaseWebSocketRuntime();
      await this.startPollingMode(MessageWorkerService.WEB_SOCKET_FALLBACK_POLLING_LOOP_SECOND);
    });

    this.wsService.on('loginExpire', (reason) => {
      void this.handleLoginExpire(reason?.toString?.() ?? '登录失效');
    });

    // 监听新消息通知
    this.wsService.on('newMessage', (notifyData) => {
      //console.log('新消息到达',notifyData);
      this.logNonProd(`收到新消息通知:${this.account.platformAccountId}`);
      this.startWebSocketIdleTimer();

      // 调用获取新消息接口并推送
      void this.fetchAndPushNewMessages(notifyData);
    });

    this.wsService.on('newComment', (notifyData) => {
      this.logNonProd(`收到评论通知:${this.account.platformAccountId}`);
      this.startWebSocketIdleTimer();
      void this.pushWebSocketComments(notifyData);
    });

    // 监听错误事件
    this.wsService.on('error', (error) => {
      logger.error(`WebSocket错误:${this.account.platformAccountId}:${error}`);
    });

    // 监听关闭事件
    this.wsService.on('closed', (code, reason) => {
      this.logNonProd(`WebSocket 已关闭:${this.account.platformAccountId}:code=${code},reason=${reason}`);
      this.stopWebSocketIdleTimer();
    });
  }

  /**
   * 获取并推送新消息
   * 统一调用平台Worker的fetchNewMessages方法,由平台决定具体实现
   * @param notifyData WebSocket通知数据(可选,某些平台可能直接包含消息内容)
   */
  private async fetchAndPushNewMessages(notifyData?: any): Promise<void> {
    if (this.hasDirectWebSocketMessages(notifyData)) {
      await this.fetchAndPushNewMessagesInner(notifyData);
      return;
    }

    if (this.wsFetchInProgress) {
      this.wsFetchPending = true;
      this.logNonProd(`WebSocket通知已排队:${this.account.platformAccountId}`);
      return;
    }

    this.wsFetchInProgress = true;

    try {
      do {
        this.wsFetchPending = false;
        await this.fetchAndPushNewMessagesInner(notifyData);
        notifyData = undefined;
      } while (this.wsFetchPending && !this.drop);
    } finally {
      this.wsFetchInProgress = false;
    }
  }

  private hasDirectWebSocketMessages(notifyData?: any): boolean {
    return Array.isArray(notifyData?.messages);
  }

  private async fetchAndPushNewMessagesInner(notifyData?: any): Promise<void> {
    try {
      // 如果通知数据中已包含完整消息,直接推送
      //console.log('收到通知',notifyData);
      if (notifyData?.messages && Array.isArray(notifyData.messages)) {
        this.logNonProd(
          `WebSocket通知包含私信内容,直接推送:${this.account.platformAccountId}:数量=${notifyData.messages.length}`,
        );
        void this.handleWebSocketPushData(notifyData);
        await this.postBackPrivateMsg(notifyData.messages, { code: 0 });
        return;
      }

      let result: MessageListInfoResponse;
      if (typeof this.worker.fetchNewMessages === 'function') {
        result = await this.worker.fetchNewMessages({
          ...(notifyData ?? {}),
          event: this.eventCall,
          platformAuthorId: this.account.platformAuthorId ?? '',
        });
      } else {
        result = await this.worker.getNewMessageList({
          platformAuthorId: this.account.platformAuthorId ?? '',
        });
      }

      if (result.code === errorCode.loginExpire) {
        await this.handleLoginExpire(result.msg);
        return;
      }

      if (result.code === 0 && result.dataList && result.dataList.length > 0) {
        this.logNonProd(`获取到新消息:${this.account.platformAccountId}:数量=${result.dataList.length}`);
        await this.postBackPrivateMsg(result.dataList, { code: 0 });
      } else if (result.code !== 0 && result.code !== 444) {
        logger.error(`获取新消息失败:${this.account.platformAccountId}:code=${result.code}`);
      }
    } catch (error) {
      logger.error(`获取新消息失败:${this.account.platformAccountId}:${error}`);
    }
  }

  /**
   * 启动轮询监听模式
   */
  private async pushWebSocketComments(notifyData?: any): Promise<void> {
    try {
      if (notifyData?.comments && Array.isArray(notifyData.comments) && notifyData.comments.length > 0) {
        this.logNonProd(
          `WebSocket通知包含评论内容,直接推送:${this.account.platformAccountId}:数量=${notifyData.comments.length}`,
        );
        void this.handleWebSocketPushData(notifyData);
        await this.postBackComment(notifyData.comments, { code: 0 });
      }
    } catch (error) {
      logger.error(
        `推送评论失败:${this.account.platformAccountId}:${error}:${notifyData.comments.length}:${notifyData?.comments[0]?.content}`,
      );
    }
  }

  private async handleWebSocketPushData(notifyData?: any): Promise<void> {
    try {
      await this.worker.handleWebSocketPushData({
        ...(notifyData ?? {}),
        platformAuthorId: this.account.platformAuthorId ?? '',
      });
    } catch (error) {
      logger.error(`处理WebSocket推送数据失败:${this.account.platformAccountId}:${error}`);
    }
  }

  private async handleLoginExpire(reason?: string): Promise<void> {
    if (this.drop || this.loginExpireHandled) {
      return;
    }

    this.loginExpireHandled = true;
    logger.error(`私信监控登录失效:${this.account.platformAccountId}${reason ? `:${reason}` : ''}`);

    try {
      await this.postBackPrivateMsgLoginExpire();
    } finally {
      this.stop();
    }
  }

  private async startPollingMode(loopSecond: number): Promise<void> {
    const loopTime = loopSecond * 1000;
    let hasNewMessage = false;

    this.stopWebSocketIdleTimer();
    this.wsFetchInProgress = false;
    this.wsFetchPending = false;

    let platformSupportsWebSocket = false;
    try {
      if (typeof this.worker.createWebSocketService === 'function') {
        const testWs = await this.worker.createWebSocketService();
        platformSupportsWebSocket = testWs !== null;
        if (testWs) {
          testWs.close();
          this.worker.disposeWebSocketService();
        }
      }
    } catch (error) {
      platformSupportsWebSocket = false;
    }

    this.logNonProd(
      `开始监控私信（轮询模式）:${this.account.platformAccountId},间隔:${loopSecond}秒,平台支持WebSocket:${platformSupportsWebSocket}`,
    );

    const msgDataBackHandler = (data: MessageBackItem[]) => {
      if (data && data.length > 0) {
        hasNewMessage = true;
        void this.postBackPrivateMsg(data, { code: 0 });
      }
    };

    const msgDataNotifyHandler = () => {
      hasNewMessage = true;
      void this.postBackPrivateMsgNotify();
    };

    const commentDataBackHandler = (data: CommentBackItem[]) => {
      if (data && data.length > 0) {
        void this.postBackComment(data, { code: 0 });
      }
    };

    // 注册事件监听器(只注册一次)
    this.eventCall?.on(SyncEventName.msg_data_back, msgDataBackHandler);
    this.eventCall?.on(SyncEventName.msg_data_notify, msgDataNotifyHandler);
    this.eventCall?.on(SyncEventName.comment_data_back, commentDataBackHandler);

    try {
      const startupDelay = Math.min(loopTime, 3000);
      if (startupDelay > 0) {
        await Task.Delay(Math.floor(Math.random() * (startupDelay + 1)));
      }

      while (true) {
        try {
          if (this.drop) {
            this.logNonProd(`私信监控已停止:${this.account.platformAccountId}`);
            return;
          }

          if (!this.gettingMsg) {
            await Task.Delay(this.getJitteredDelay(60000));
            continue;
          }

          // 调用平台Worker获取消息
          const re = await this.worker.createMsgService(
            { platformAuthorId: this.account.platformAuthorId ?? '' },
            this.eventCall ?? new EventEmitter(),
          );

          if (re.code === errorCode.loginExpire) {
            await this.handleLoginExpire(re.msg);
            return;
          }

          if (re.code !== 0 && re.code !== 444) {
            logger.error(`获取消息失败:${this.account.platformAccountId}:${re.msg}`);
          }

          // 只有在平台真正支持WebSocket时才尝试重新连接
          // WebSocket失败降级到轮询后，获取到新消息时尝试重连
          // 对于不支持WebSocket的平台，跳过这个逻辑
          if (hasNewMessage && !this.wsService && platformSupportsWebSocket) {
            hasNewMessage = false;
            logger.info(`轮询模式获取到新消息，尝试重新连接 WebSocket:${this.account.platformAccountId}`);

            const wsService = await this.tryGetWebSocketService();
            if (wsService) {
              logger.info(`重新连接 WebSocket 成功，切换回 WebSocket 模式:${this.account.platformAccountId}`);
              await this.startWebSocketMode(wsService);
              return;
            }
          } else if (hasNewMessage) {
            hasNewMessage = false;
          }

          await Task.Delay(this.getJitteredDelay(loopTime));
        } catch (error) {
          logger.error(
            `私信监控异常:${this.account.platformAccountId}:${
              error instanceof Error ? error.message : error?.toString()
            }`,
          );
          await Task.Delay(this.getJitteredDelay(loopTime));
        }
      }
    } finally {
      // 清理事件监听器
      this.eventCall?.off(SyncEventName.msg_data_back, msgDataBackHandler);
      this.eventCall?.off(SyncEventName.msg_data_notify, msgDataNotifyHandler);
      this.eventCall?.off(SyncEventName.comment_data_back, commentDataBackHandler);
    }
  }

  /**
   * 停止Worker
   * 清理所有资源和监听器
   */
  public stop(): boolean {
    this.drop = true;
    this.gettingMsg = false;

    // 清理心跳定时器
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }

    // 清理消息轮询定时器
    if (this.msgTimer) {
      clearTimeout(this.msgTimer);
      this.msgTimer = undefined;
    }

    this.releaseWebSocketRuntime();

    this.eventCall?.removeAllListeners();
    this.eventCall = undefined;

    void this.worker.dropMsgService();

    this.logNonProd(`MessageWorker已停止:${this.account.platformAccountId}`);
    return true;
  }
  /**
   * 更新Cookie
   * 在不停止Worker的情况下更新认证凭证
   */
  public updateCookie(cookie: string, localStorage?: object, proxy?: PlatformAccountInfo['proxy']): string {
    if (!cookie || cookie.length < 10 || (!cookie.includes('=') && !cookie.trim().startsWith('['))) {
      return 'cookie格式异常';
    }

    this.account.cookie = cookie;
    this.account.proxy = proxy ?? this.account.proxy;
    this.worker.refreshCookie(cookie, localStorage, this.account.proxy);
    this.gettingMsg = true;

    // 如果使用WebSocket模式,通知平台Worker更新Cookie
    if (this.wsService) {
      try {
        // 由平台Worker负责更新WebSocket的Cookie
        // updateWebSocketCookie会关闭并重新连接,但不会移除事件监听器
        if (typeof this.worker.updateWebSocketCookie === 'function') {
          this.worker.updateWebSocketCookie(cookie, localStorage);
        }
      } catch (error) {
        logger.error(`更新WebSocket Cookie失败:${this.account.platformAccountId}:${error}`);
      }
    }

    this.logNonProd(`Cookie已更新:${this.account.platformAccountId}`);
    return '';
  }

  /**
   * 启动心跳定时器
   * 每59秒发送一次心跳事件
   */
  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
    }

    const scheduleNextHeartbeat = () => {
      this.heartbeatTimer = setTimeout(
        () => {
          if (this.drop) {
            return;
          }

          const heartData = {
            action: 'heartbeat',
            platformAccountId: this.account.platformAccountId ?? 'none',
            code: 0,
            msg: '',
            timestamp: Date.now(),
          };
          this.eventCall?.emit('heartbeat', heartData);

          if (!this.drop) {
            scheduleNextHeartbeat();
          }
        },
        this.getJitteredDelay(59 * 1000, 0.1),
      );
    };

    scheduleNextHeartbeat();
  }

  /**
   * 推送私信数据到Webhook
   * @param data 私信数据列表
   * @param re 结果对象
   */
  protected async postBackPrivateMsg(data: MessageBackItem[], re: BaseResult): Promise<void> {
    try {
      const url = `${PubConfig.API_URL}${PubConfig.OpenCallBackUrlPath}`;
      const postData = {
        event: CallBackDataEvent.privateMsg,
        accountId: this.account.platformAccountId,
        data: data,
      };

      const tm = Date.now();
      const headers = {
        authToken: this.authToken,
        authorization: this.account.authorization ?? (PubConfig.API_Token ? PubConfig.API_Token : generateToken(tm)),
        timestamp: tm,
        'x-client': PubConfig.xClient,
      };

      const result = await $webhookHttp.post<{ statusCode: number; message: string }>(url, postData, {
        headers: headers,
        retryCondition: (error, response) => {
          return !isJson(response.data);
        },
        timeout:5000
      });

      if (result?.data?.statusCode === 0) {
        this.logNonProd(`推送私信数据成功:${this.account.platformAccountId}:数量:${data?.length ?? 0}`);

        // 更新最后消息时间戳
        if (data?.length > 0) {
          const lastMsg = data[data.length - 1];
          if (lastMsg?.timestamp) {
            this.lastMsgTimestamp = lastMsg.timestamp.toString();
          }
        }
      } else {
        logger.error(
          `推送私信数据失败:${this.account.platformAccountId}:${JSON.stringify(result?.data)}:${
            data?.length ?? 0
          }:${data?.[0]?.content}`,
        );
      }
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `推送失败，${e?.toString() ?? ''}`;
      }
      logger.error(`推送私信数据异常:账号id:${this.account.platformAccountId} ${errMsg}`);
    }
  }

  /**
   * 推送私信通知(轻量级)
   * 仅通知有新私信,不包含具体数据
   */
  protected async postBackComment(data: CommentBackItem[], re: BaseResult): Promise<void> {
    try {
      const url = `${PubConfig.API_URL}${PubConfig.OpenCallBackUrlPath}`;
      const postData = {
        event: CallBackDataEvent.commentList,
        accountId: this.account.platformAccountId,
        data: data,
      };

      const tm = Date.now();
      const headers = {
        authToken: this.authToken,
        authorization: this.account.authorization ?? (PubConfig.API_Token ? PubConfig.API_Token : generateToken(tm)),
        timestamp: tm,
        'x-client': PubConfig.xClient,
      };

      const result = await $webhookHttp.post<{ statusCode: number; message: string }>(url, postData, {
        headers: headers,
        retryCondition: (error, response) => {
          return !isJson(response.data);
        },
      });

      if (result?.data?.statusCode === 0) {
        this.logNonProd(`推送评论通知成功${this.account.platformAccountId}:评论数:${data?.length ?? 0}`);
      } else {
        logger.error(
          `推送评论失败${this.account.platformAccountId}:${JSON.stringify(result?.data)}:${data?.length}:${
            data ? data[0]?.content : ''
          }`,
        );
      }
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `推送评论失败:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `推送评论失败${e?.toString() ?? ''}`;
      }
      logger.error(`推送评论失败，用户id:${this.account.platformAccountId} ${errMsg}`);
    }
  }

  protected async postBackPrivateMsgNotify(): Promise<void> {
    try {
      const url = `${PubConfig.API_URL}${PubConfig.OpenCallBackUrlPath}`;
      const postData = {
        event: CallBackDataEvent.privateMsgNotify,
        accountId: this.account.platformAccountId,
        data: {},
      };

      const tm = Date.now();
      const headers = {
        authToken: this.authToken,
        authorization: this.account.authorization ?? (PubConfig.API_Token ? PubConfig.API_Token : generateToken(tm)),
        timestamp: tm,
        'x-client': PubConfig.xClient,
      };

      const result = await $webhookHttp.post<{ statusCode: number; message: string }>(url, postData, {
        headers: headers,
        retryCondition: (error, response) => {
          return !isJson(response.data);
        },
      });

      if (result?.data?.statusCode === 0) {
        this.logNonProd(`推送私信通知成功:${this.account.platformAccountId}`);
      } else {
        logger.error(`推送私信通知失败:${this.account.platformAccountId}:${JSON.stringify(result?.data)}`);
      }
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `推送失败，${e?.toString() ?? ''}`;
      }
      logger.error(`推送私信通知异常:账号id:${this.account.platformAccountId} ${errMsg}`);
    }
  }

  /**
   * 推送私信登录失效事件到Webhook
   */
  protected async postBackPrivateMsgLoginExpire(): Promise<void> {
    try {
      const url = `${PubConfig.API_URL}${PubConfig.OpenCallBackUrlPath}`;
      const postData = {
        event: CallBackDataEvent.loginExpire,
        accountId: this.account.platformAccountId,
        data: {
          code: errorCode.loginExpire,
          msg: '登录失效',
        },
      };

      const tm = Date.now();
      const headers = {
        authToken: this.authToken,
        authorization: this.account.authorization ?? (PubConfig.API_Token ? PubConfig.API_Token : generateToken(tm)),
        timestamp: tm,
        'x-client': PubConfig.xClient,
      };

      const result = await $webhookHttp.post<{ statusCode: number; message: string }>(url, postData, {
        headers: headers,
        retryCondition: (error, response) => {
          return !isJson(response.data);
        },
      });

      if (result?.data?.statusCode === 0) {
        this.logNonProd(`推送私信登录失效事件成功:${this.account.platformAccountId}`);
      } else {
        logger.error(`推送私信登录失效事件失败:${this.account.platformAccountId}:${JSON.stringify(result?.data)}`);
      }
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `推送失败，${e?.toString() ?? ''}`;
      }
      logger.error(`推送私信登录失效事件异常:账号id:${this.account.platformAccountId} ${errMsg}`);
    }
  }

  // ========== 以下是REST API方法,用于临时实例调用 ==========

  /**
   * 获取会话列表
   */
  public async getConversationList(taskParams: object): Promise<MessageConversationListInfoResponse> {
    try {
      return await this.worker.getConversationList(taskParams);
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `获取对话列表失败，${e?.toString() ?? ''}`;
      }
      logger.error(`获取对话列表失败:${this.account.platformAccountId}:${errMsg}`);
      return { code: 2, msg: errMsg };
    }
  }

  /**
   * 获取指定会话的详情
   */
  public async getConversationInfo(taskParams: object): Promise<BaseResult> {
    try {
      return await this.worker.getConversationInfo(taskParams);
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `获取对话详情失败，${e?.toString() ?? ''}`;
      }
      logger.error(`获取对话详情失败:${this.account.platformAccountId}:${errMsg}`);
      return { code: 2, msg: errMsg };
    }
  }

  /**
   * 获取陌生人/新增会话
   */
  public async getNewConversationList(taskParams: object): Promise<MessageListInfoResponse> {
    try {
      return await this.worker.getNewConversationList(taskParams);
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `获取新对话列表失败，${e?.toString() ?? ''}`;
      }
      logger.error(`获取新对话列表失败:${this.account.platformAccountId}:${errMsg}`);
      return { code: 2, msg: errMsg };
    }
  }

  /**
   * 获取指定会话的消息
   */
  public async getMessageListByConversation(taskParams: object): Promise<MessageListInfoResponse> {
    try {
      return await this.worker.getMessageListByConversation(taskParams);
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `获取对话历史消息列表失败，${e?.toString() ?? ''}`;
      }
      logger.error(`获取对话历史消息列表失败:${this.account.platformAccountId}:${errMsg}`);
      return { code: 2, msg: errMsg };
    }
  }

  /**
   * 获取新消息列表
   */
  public async getNewMessageList(taskParams: object): Promise<MessageListInfoResponse> {
    try {
      return await this.worker.getNewMessageList(taskParams);
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `获取新消息列表失败，${e?.toString() ?? ''}`;
      }
      logger.error(`获取新消息列表失败:${this.account.platformAccountId}:${errMsg}`);
      return { code: 2, msg: errMsg };
    }
  }

  /**
   * 发送消息
   */
  public async SendMessage(taskParams: object): Promise<{ code: number; msg: string; messageId?: string }> {
    try {
      return await this.worker.SendMessage(taskParams);
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `发送消息失败，${e?.toString() ?? ''}`;
      }
      logger.error(`发送消息失败:${this.account.platformAccountId}:${errMsg}`);
      return { code: 2, msg: errMsg };
    }
  }

  public async fetchRecentComments(taskParams: { days: number; platformAuthorId?: string }): Promise<BaseResult> {
    if (this.drop) {
      return { code: 2, msg: '私信Worker已停止，无法获取评论' };
    }

    const eventCall = new EventEmitter();
    eventCall.on(SyncEventName.comment_data_back, (data: CommentBackItem[]) => {
      if (data?.length) {
        void this.postBackComment(data, { code: 0 });
      }
    });

    try {
      const result = await this.worker.fetchRecentComments({
        ...taskParams,
        platformAuthorId: taskParams.platformAuthorId ?? this.account.platformAuthorId ?? '',
        event: eventCall,
      });
      if (result.code === errorCode.loginExpire) {
        await this.handleLoginExpire(result.msg);
      }
      return result.code === 0 && !result.msg ? { ...result, msg: '执行完成' } : result;
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `视频号评论抓取失败:${e?.toString() ?? ''}`;
      }
      logger.error(`视频号评论抓取失败:${this.account.platformAccountId}:${errMsg}`);
      return { code: 2, msg: errMsg };
    } finally {
      eventCall.removeAllListeners();
    }
  }
}
