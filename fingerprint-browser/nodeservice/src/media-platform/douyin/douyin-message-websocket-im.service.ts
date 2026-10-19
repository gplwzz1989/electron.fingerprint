import { IWebProxy } from '@/media-platform/webproxy';
import {
  DouyinFrontierImNewMessageEvent,
  DouyinFrontierImResolvedIdentity,
  DouyinFrontierImWebSocketService,
  DouyinFrontierImWebSocketServiceOptions,
} from '@/media-platform/douyin/private_msg/standalone_notice_pc/douyin-frontier-im-websocket.service';

export interface DouyinMessageImWebSocketServiceOptions {
  cookie: string;
  userId?: string;
  deviceId?: string;
  pageUrl?: string;
  referer?: string;
  proxy?: IWebProxy;
  accountId?: string;
  userAgent?: string;
}

export interface DouyinMessageImResolvedDeviceInfo {
  source: 'manual' | 'user_info';
  deviceId: string;
  userId: string;
}

export type DouyinMessageImNewMessageEvent = DouyinFrontierImNewMessageEvent;

function normalizeFrontierImOptions(
  options: DouyinMessageImWebSocketServiceOptions,
): DouyinFrontierImWebSocketServiceOptions {
  return {
    cookie: options.cookie,
    userId: String(options.userId || options.deviceId || '').trim() || undefined,
    proxy: options.proxy,
    referer: options.referer,
    userAgent: options.userAgent,
  };
}

/**
 * 基于 frontier-im 私信链路的抖音消息 WebSocket 服务。
 * 不替换现有通知版服务，单独提供一个 IM 版本实现。
 */
export class DouyinMessageWebSocketImService extends DouyinFrontierImWebSocketService {
  constructor(options: DouyinMessageImWebSocketServiceOptions) {
    super(normalizeFrontierImOptions(options));
  }

  public updateCookie(cookie: string, deviceId?: string, proxy?: IWebProxy): void {
    super.updateCookie(cookie, deviceId, proxy);
  }

  public getResolvedDeviceInfo(): DouyinMessageImResolvedDeviceInfo | undefined {
    const identity = this.getResolvedIdentity();
    if (!identity?.userId) {
      return undefined;
    }

    return {
      source: identity.source,
      deviceId: identity.userId,
      userId: identity.userId,
    };
  }
}

export type DouyinMessageWebSocketServiceOptions = DouyinMessageImWebSocketServiceOptions;
export type NoticeDeviceInfo = DouyinMessageImResolvedDeviceInfo;
export type DouyinNewMessageEvent = DouyinMessageImNewMessageEvent;
export type DouyinMessageResolvedIdentity = DouyinFrontierImResolvedIdentity;
