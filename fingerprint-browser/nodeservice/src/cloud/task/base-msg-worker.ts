import { EventEmitter } from 'events';
import { convertCookieStr } from '@/utils';
import { MessageConversationListInfoResponse, MessageListInfoResponse } from '@/media-platform';
import { BaseResult } from '@/media-platform/baseResult';
import { IWebProxy } from '@/media-platform/webproxy';
import { SyncEventName } from '@/service/datasync-service-manager';
import { BaseWebSocketService } from '@/cloud/task/base-websocket.service';

/**
 * 私信监听专用账号标识
 */
export interface MsgWorkerIdentity {
  platformAccountId?: string;
  platformAuthorId?: string;
  proxy?: IWebProxy;
}

/**
 * 私信监听专用基础 Worker
 * 只保留常驻监听和拉取消息所需的最小能力
 */
export abstract class BaseMsgWorker {
  public readonly enableWebSocketIdleFallback: boolean = true;
  public cookie: string;
  protected localStorage?: object;
  protected proxy?: IWebProxy;
  protected platformAccountId?: string;
  protected platformAuthorId?: string;

  constructor(cookie?: string, localStorage?: object, identity?: MsgWorkerIdentity) {
    this.cookie = this.normalizeCookie(cookie);
    this.localStorage = this.normalizeLocalStorage(localStorage);
    this.proxy = identity?.proxy;
    this.platformAccountId = identity?.platformAccountId;
    this.platformAuthorId = identity?.platformAuthorId;
  }

  /**
   * 更新 cookie，仅保留当前平台监听所需的 localStorage
   */
  public refreshCookie(cookie: string, localStorage?: object, proxy?: IWebProxy): void {
    this.cookie = this.normalizeCookie(cookie);
    this.localStorage = this.normalizeLocalStorage(localStorage);
    this.proxy = proxy;
  }

  /**
   * 轮询模式统一入口
   */
  public async createMsgService(
    task: { platformAuthorId: string },
    event: EventEmitter,
  ): Promise<{ code: number; msg: string }> {
    if (task?.platformAuthorId) {
      this.platformAuthorId = task.platformAuthorId;
    }

    try {
      const result = await this.fetchNewMessages({ event });
      if (result.code === 0 && result.dataList && result.dataList.length > 0) {
        event.emit(SyncEventName.msg_data_back, result.dataList);
      }

      return { code: result?.code ?? -1, msg: result?.msg ?? '' };
    } catch (error) {
      return { code: -1, msg: `获取消息失败:${error}` };
    }
  }

  /**
   * 停止监听时释放专用资源
   */
  public async dropMsgService(): Promise<{ code: number; msg: string }> {
    return { code: 0, msg: '' };
  }

  /**
   * 获取新消息
   * 子类按平台实现
   */
  public abstract fetchNewMessages(notifyData?: any): Promise<MessageListInfoResponse>;

  /**
   * 获取会话列表
   * 私信常驻监听默认不支持
   */
  public async getConversationList(taskParams: object): Promise<MessageConversationListInfoResponse> {
    return { code: 444, msg: '当前私信常驻监听不支持会话查询' };
  }

  /**
   * 获取会话详情
   * 私信常驻监听默认不支持
   */
  public async getConversationInfo(taskParams: object): Promise<BaseResult> {
    return { code: 444, msg: '当前私信常驻监听不支持会话查询' };
  }

  /**
   * 获取陌生人会话列表
   * 私信常驻监听默认不支持
   */
  public async getNewConversationList(taskParams: object): Promise<MessageListInfoResponse> {
    return { code: 444, msg: '当前私信常驻监听不支持会话查询' };
  }

  /**
   * 获取指定会话消息
   * 私信常驻监听默认不支持
   */
  public async getMessageListByConversation(taskParams: object): Promise<MessageListInfoResponse> {
    return { code: 444, msg: '当前私信常驻监听不支持会话查询' };
  }

  /**
   * 按拉取参数获取新消息
   * 私信常驻监听默认不支持
   */
  public async getNewMessageList(taskParams: object): Promise<MessageListInfoResponse> {
    return { code: 444, msg: '当前私信常驻监听不支持直接查询新消息' };
  }

  /**
   * 发送消息
   * 私信常驻监听默认不支持
   */
  public async SendMessage(taskParams: object): Promise<{ code: number; msg: string; messageId?: string }> {
    return { code: 444, msg: '当前私信常驻监听不支持发消息' };
  }

  /**
   * 抓取近期评论
   * 默认不支持
   */
  public async fetchRecentComments(taskParams: object): Promise<BaseResult> {
    return { code: 444, msg: '当前私信常驻监听不支持评论抓取' };
  }

  /**
   * 创建 WebSocket 服务
   * 默认不支持
   */
  public async createWebSocketService(): Promise<BaseWebSocketService | null> {
    return null;
  }

  /**
   * 初始化消息游标
   * 默认不需要
   */
  public async initMsgCursorCookie(): Promise<void> {}

  /**
   * 处理 WebSocket 直接携带的数据
   * 默认不需要
   */
  public async handleWebSocketPushData(notifyData?: any): Promise<void> {}

  /**
   * 更新 WebSocket 鉴权信息
   * 默认不需要
   */
  public updateWebSocketCookie(cookie: string, localStorage?: object): void {}

  /**
   * 释放 WebSocket 相关缓存
   * 子类按需实现
   */
  public disposeWebSocketService(): void {}

  /**
   * 规范化 cookie
   */
  protected normalizeCookie(cookie?: string): string {
    return cookie ? convertCookieStr(cookie, this.getCookieDomain()) : '';
  }

  /**
   * 当前平台 cookie 需要补充的 domain
   */
  protected getCookieDomain(): string | undefined {
    return undefined;
  }

  /**
   * 规范化当前平台需要保留的 localStorage
   */
  protected normalizeLocalStorage(localStorage?: object): object | undefined {
    return undefined;
  }
}
