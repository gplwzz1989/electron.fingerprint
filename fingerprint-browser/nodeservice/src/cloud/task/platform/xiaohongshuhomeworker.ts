import {
  CommentContentListInfoResponse,
  CommentListInfoResponse,
  ImageInfo,
  MessageConversationListInfoResponse,
  MessageListInfoResponse,
  PlatformAuthorInfo,
} from '../../../media-platform';
import { BaseWorker } from './baseworker';
import { BaseResult } from '../../../media-platform/baseResult';
import { errorCode } from '../../../media-platform/errorCode';
import { IWebProxy } from '@/media-platform/webproxy';
import { Xiaohongshuhome } from '@/media-platform/xiaohongshuhome';
import { MessageType } from '@/service/datasync-service-manager';
import { PubContentEnum } from '@/cloud/model/TypeEnum';
import type { XiaohongshuhomeAltResult } from '@/media-platform/xiaohongshuhome/xiaohongshuhome-user';
import type { XiaohongshuhomeUnreadCountResponse } from '@/media-platform/xiaohongshuhome/xiaohongshuhome-common';

export class XiaoHongShuHomeWorker extends BaseWorker {
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await Xiaohongshuhome.getXiaohongshuhomeUserInfo(this.cookies, proxy);
    return this.checkResult(this.userInfo);
  }

  public async getWebSocketAuthInfo(proxy?: IWebProxy): Promise<XiaohongshuhomeAltResult> {
    const localStorage = (this.localStorage ?? {}) as Record<string, unknown>;
    const deviceId = [localStorage.device_id, localStorage.deviceId, localStorage.XHS_TAB_DEVICE_ID].find(
      (value): value is string => typeof value === 'string' && value.trim().length > 0,
    );

    return Xiaohongshuhome.getXiaohongshuhomeAlt(this.cookies, proxy, deviceId);
  }

  public async getUnreadCount(proxy?: IWebProxy): Promise<XiaohongshuhomeUnreadCountResponse> {
    return this.checkResult(await Xiaohongshuhome.getXiaohongshuhomeUnreadCount(this.cookies, proxy));
  }

  private async ensurePlatformAuthorId(platformAuthorId?: string, proxy?: IWebProxy): Promise<string> {
    if (platformAuthorId) {
      return platformAuthorId;
    }

    if (this.userInfo?.yixiaoerId) {
      return this.userInfo.yixiaoerId;
    }

    const userInfo = await this.getUserInfo(proxy);
    return userInfo?.yixiaoerId ?? '';
  }

  private async ensureAccountId(taskParams: {
    platformAuthorId?: string;
    platform?: Array<{ platformAccountId: string; platformAuthorId: string }>;
    proxy?: IWebProxy;
  }): Promise<string> {
    const platformAuthorId =
      taskParams.platform?.length && taskParams.platform[0].platformAuthorId
        ? taskParams.platform[0].platformAuthorId
        : undefined;
    return platformAuthorId ?? (await this.ensurePlatformAuthorId(taskParams.platformAuthorId, taskParams.proxy));
  }

  public async addComment(taskParams: {
    contentId: string;
    text: string;
    commentId?: string;
    commentParentId?: string;
    proxy?: IWebProxy;
    platformAuthorId?: string;
  }): Promise<BaseResult> {
    const result = await Xiaohongshuhome.addXiaohongshuhomeComment(
      this.cookies,
      taskParams.text,
      taskParams.contentId,
      taskParams.commentId,
      taskParams.proxy,
    );

    return this.checkResult({
      code: result?.code ?? -1,
      msg: result?.msg,
      data: { commentId: result?.commentId ?? '' },
    });
  }

  public async delComment(taskParams: {
    contentId: string;
    commentId: string;
    proxy?: IWebProxy;
    platformAuthorId?: string;
  }): Promise<BaseResult> {
    const result = await Xiaohongshuhome.delXiaohongshuhomeComment(
      this.cookies,
      taskParams.contentId,
      taskParams.commentId,
      taskParams.proxy,
    );

    return this.checkResult({ code: result?.code ?? -1, msg: result?.msg });
  }

  public async digComment(taskParams: {
    contentId: string;
    commentId: string;
    proxy?: IWebProxy;
    platformAuthorId?: string;
  }): Promise<BaseResult> {
    const result = await Xiaohongshuhome.digXiaohongshuhomeComment(
      this.cookies,
      taskParams.contentId,
      taskParams.commentId,
      taskParams.proxy,
    );

    return this.checkResult({ code: result?.code ?? -1, msg: result?.msg });
  }

  public async getCommentContent(taskParams: {
    nextPage?: string;
    contentType?: PubContentEnum;
    platformAuthorId?: string;
    proxy?: IWebProxy;
    platform?: Array<{ platformAccountId: string; platformAuthorId: string }>;
  }): Promise<CommentContentListInfoResponse> {
    const accountId = await this.ensureAccountId(taskParams);
    return this.checkResult(
      await Xiaohongshuhome.getXiaohongshuhomeCommentContent(
        this.cookies,
        taskParams.nextPage,
        accountId,
        taskParams.proxy,
      ),
    );
  }

  public async getContentComment(taskParams: {
    contentId: string;
    documentId?: string;
    commentId?: string;
    nextPage?: string;
    xsecToken?: string;
    platformAuthorId?: string;
    proxy?: IWebProxy;
    platform?: Array<{ platformAccountId: string; platformAuthorId: string }>;
  }): Promise<CommentListInfoResponse> {
    const accountId = await this.ensureAccountId(taskParams);
    return this.checkResult(
      await Xiaohongshuhome.getXiaohongshuhomeCommentByContent(
        this.cookies,
        taskParams.contentId,
        taskParams.commentId,
        taskParams.nextPage,
        accountId,
        taskParams.proxy,
        taskParams.xsecToken,
      ),
    );
  }

  public async getConversationList(taskParams: {
    nextPage?: string;
    platformAuthorId?: string;
    proxy?: IWebProxy;
    platform?: Array<{ platformAccountId: string; platformAuthorId: string }>;
  }): Promise<MessageConversationListInfoResponse> {
    const accountId = await this.ensureAccountId(taskParams);
    return this.checkResult(
      await Xiaohongshuhome.getXiaohongshuhomeMessageConversationList(
        this.cookies,
        taskParams.nextPage,
        accountId,
        taskParams.proxy,
      ),
    );
  }

  public async getConversationInfo(taskParams: {
    sessionId: string;
    secSessionId?: string;
    messageUserId?: string;
    platformAuthorId?: string;
    proxy?: IWebProxy;
    platform?: Array<{ platformAccountId: string; platformAuthorId: string }>;
  }): Promise<MessageConversationListInfoResponse> {
    const accountId = await this.ensureAccountId(taskParams);
    return this.checkResult(
      await Xiaohongshuhome.getXiaohongshuhomeMessageConversationInfo(
        this.cookies,
        taskParams.sessionId,
        taskParams.secSessionId,
        taskParams.messageUserId,
        accountId,
        taskParams.proxy,
      ),
    );
  }

  public async getNewConversationList(taskParams: {
    nextPage?: string;
    platformAuthorId?: string;
    proxy?: IWebProxy;
    platform?: Array<{ platformAccountId: string; platformAuthorId: string }>;
  }): Promise<MessageListInfoResponse> {
    return this.getNewMessageList(taskParams);
  }

  public async getMessageListByConversation(taskParams: {
    sessionId: string;
    secSessionId?: string;
    conversationType?: string;
    nextPage?: string;
    platformAuthorId?: string;
    messageUserId?: string;
    proxy?: IWebProxy;
    platform?: Array<{ platformAccountId: string; platformAuthorId: string }>;
  }): Promise<MessageListInfoResponse> {
    const accountId = await this.ensureAccountId(taskParams);
    return this.checkResult(
      await Xiaohongshuhome.getXiaohongshuhomeMessageListByConversation(
        this.cookies,
        taskParams.sessionId,
        taskParams.messageUserId ?? taskParams.sessionId,
        taskParams.nextPage,
        accountId,
        taskParams.proxy,
      ),
    );
  }

  // public async getNewMessageList(taskParams: {
  //   nextPage?: string;
  //   platformAuthorId?: string;
  //   proxy?: IWebProxy;
  //   platform?: Array<{ platformAccountId: string; platformAuthorId: string }>;
  // }): Promise<MessageListInfoResponse> {
  //   const accountId = await this.ensureAccountId(taskParams);
  //   if (!accountId) {
  //     return { code: errorCode.notLogin, msg: '获取小红书主页用户信息失败', dataList: [] };
  //   }
  //
  //   const cursors = this.parseMessageCursor(taskParams.nextPage);
  //   const result: MessageListInfoResponse = { code: 0, msg: '', dataList: [] };
  //   const conversations = [] as NonNullable<MessageConversationListInfoResponse['dataList']>;
  //   let conversationPage = '';
  //
  //   do {
  //     const conversationResult = await this.getConversationList({
  //       nextPage: conversationPage,
  //       platformAuthorId: accountId,
  //       proxy: taskParams.proxy,
  //     });
  //     if (conversationResult.code !== 0) {
  //       return conversationResult as MessageListInfoResponse;
  //     }
  //
  //     conversations.push(...(conversationResult.dataList ?? []));
  //     const currentPage = conversationPage;
  //     conversationPage = conversationResult.nextPage ?? '';
  //     if (!conversationPage || conversationPage === currentPage) {
  //       break;
  //     }
  //   } while (conversationPage);
  //
  //   for (const conversation of conversations) {
  //     if (!conversation.sessionId || !conversation.messageUserId) {
  //       continue;
  //     }
  //
  //     const previousCursor = cursors[conversation.sessionId] ?? 0;
  //     const messageResult = await this.getMessageListByConversation({
  //       sessionId: conversation.sessionId,
  //       messageUserId: conversation.messageUserId,
  //       platformAuthorId: accountId,
  //       proxy: taskParams.proxy,
  //     });
  //     if (messageResult.code !== 0) {
  //       return messageResult;
  //     }
  //
  //     let conversationCursor = Number((conversation.raw as Record<string, any> | undefined)?.max_store_id ?? 0);
  //     for (const message of messageResult.dataList ?? []) {
  //       const storeId = Number(message.index ?? 0);
  //       conversationCursor = Math.max(conversationCursor, storeId);
  //       if (storeId > previousCursor) {
  //         result.dataList?.push(message);
  //       }
  //     }
  //
  //     if (conversationCursor > previousCursor) {
  //       cursors[conversation.sessionId] = conversationCursor;
  //     }
  //   }
  //
  //   result.nextPage = JSON.stringify(cursors);
  //   return this.checkResult(result);
  // }

  public async getLatestCommentNoticeList(taskParams: {
    cursor?: string;
    platformAuthorId?: string;
    proxy?: IWebProxy;
    platform?: Array<{ platformAccountId: string; platformAuthorId: string }>;
  }): Promise<CommentListInfoResponse> {
    const accountId = await this.ensureAccountId(taskParams);
    return this.checkResult(
      await Xiaohongshuhome.getXiaohongshuhomeLatestCommentNoticeList(
        this.cookies,
        taskParams.cursor,
        accountId,
        taskParams.proxy,
      ),
    );
  }

  public async SendMessage(taskParams: {
    sessionId: string;
    secSessionId?: string;
    text: string;
    messageType?: MessageType;
    imageInfo?: ImageInfo;
    proxy?: IWebProxy;
    platformAuthorId?: string;
    platform?: Array<{ platformAccountId: string; platformAuthorId: string }>;
  }): Promise<{ code: number; msg: string; messageId?: string }> {
    if (taskParams.messageType && taskParams.messageType !== MessageType.text) {
      return { code: 444, msg: '小红书主页私信当前仅支持文本消息' };
    }
    if (taskParams.imageInfo) {
      return { code: 444, msg: '小红书主页私信当前不支持图片消息' };
    }

    const senderId = await this.ensureAccountId(taskParams);
    if (!senderId || !taskParams.sessionId) {
      return { code: errorCode.data_error, msg: '小红书主页私信缺少发送方或接收方id' };
    }

    return this.checkResult(
      await Xiaohongshuhome.sendXiaohongshuhomeMessage(
        this.cookies,
        senderId,
        taskParams.sessionId,
        taskParams.text,
        taskParams.proxy,
      ),
    ) as { code: number; msg: string; messageId?: string };
  }

  private parseMessageCursor(cursor?: string): Record<string, number> {
    if (!cursor) {
      return {};
    }

    try {
      const parsed = JSON.parse(cursor) as Record<string, unknown>;
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

  private checkResult(re: BaseResult): BaseResult {
    if (re?.code === -100 || re?.code === 401 || re?.msg?.includes('登录')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
}
