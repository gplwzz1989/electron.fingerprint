import { EventEmitter } from 'events';
import { Readable } from 'stream';
import { getHttpStream } from '@/httpStream';
import { convertCookieStr } from '@/utils';
import { BaseSinglePublishTask } from '../../model/BaseTaskFormModel';
import {
  AuditResult,
  CommentContentListInfoResponse,
  CommentListInfoResponse,
  GeoLocation,
  ListInfoResponse,
  ListItemInfo,
  ListLevelInfoResponse,
  ListMusicInfoResponse,
  MessageConversationListInfoResponse,
  MessageListInfoResponse,
  PlatformAuthorInfo,
  PublishResult,
  UserCanPublishInfo,
  UserCanPublishNum,
  UserStatus,
} from '../../../media-platform/baseModel';
import { PubContentEnum } from '@/cloud/model/TypeEnum';
import { BaseResult } from '@/media-platform/baseResult';
import { IWebProxy, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { LocationType } from '@/platform-body/common';
import { CheckGoodsParams, LocationTypePrivilege, ShoppingPrivilege } from '@/cloud/model/SearchDataModel';
import { DataSyncTaskItem, Platforms } from '@/service/datasync-service-manager';
import {
  SendMessageOptions,
  AIChatConversationListResponse,
  AIChatMessageListResponse,
  AIChatAttachmentParseResponse,
} from '@/ai-platform/interfaces';

export class BaseWorker {
  public cookies: string;
  protected localStorage: object | undefined;
  protected domain?: string;
  public event: EventEmitter;
  protected userInfo: PlatformAuthorInfo | undefined;
  constructor(cookie?: string, localStorage?: object, eventCallBack?: EventEmitter, domain?: string) {
    this.cookies = cookie ? convertCookieStr(cookie, domain) : '';
    this.localStorage = localStorage;
    this.domain = domain;
    this.event = eventCallBack ?? new EventEmitter();
  }

  /**
   * 处理cookie
   * @param cookie
   * @param localStorage
   */
  public refreshCookie(cookie: string, localStorage?: object) {
    this.cookies = convertCookieStr(cookie, this.domain);
    this.localStorage = localStorage;
  }

  /**
   * 获取发布配置分类
   * @param contentType
   */
  public async getPublishCategory(contentType: PubContentEnum): Promise<ListLevelInfoResponse | undefined> {
    return { code: 444, msg: '不支持的平台' };
  }

  /**
   * 获取媒体号信息
   */
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    return { code: 444, msg: '不支持的平台' };
  }

  public async checkUserCanPublish(proxy?: IWebProxy): Promise<UserCanPublishInfo | undefined> {
    return { code: 0, msg: '', data: { status: UserStatus.ok } };
  }

  public async checkUserCanPublishNum(
    createType: PubContentEnum,
    proxy?: IWebProxy,
  ): Promise<UserCanPublishNum | undefined> {
    return {
      code: 0,
      msg: '',
      data: { remain_article_num: 1, remain_video_num: 1, remain_total_num: 1, remain_dynamic_num: 1 },
    };
  }
  /**
   * 发布内容
   * @param taskDataIn
   */
  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    if (!taskDataIn) {
      throw new Error('任务为空');
    }
    return { code: 444, msg: '不支持的平台' } as PublishResult;
  }

  /**
   * 查询发布内容的审核状态
   * @param publishId
   * @param publishType
   * @param desc
   */
  public async checkAuditStatus(
    publishId: string,
    publishType?: PubContentEnum,
    desc?: string,
  ): Promise<AuditResult | undefined> {
    if (!publishId) {
      throw new Error('publishId不能为空');
    }
    return { code: 444, msg: '当前平台不支持作品状态查询', publishId };
  }

  /**
   * 获取地理位置权限
   */
  public async getLocationTypePrivilege(): Promise<LocationTypePrivilege | undefined> {
    return { code: 444, msg: '不支持的平台' };
  }

  /**
   * 搜索地理位置
   * @param keyWord
   * @param nextPage
   * @param proxy
   * @param locationType
   * @param coords
   */
  public async searchLocation(
    keyWord: string,
    nextPage: string,
    proxy?: KuaiDaiLiProxy,
    locationType?: LocationType,
    coords?: GeoLocation,
    city?: ListItemInfo,
    localMode?: number,
  ): Promise<ListInfoResponse | undefined> {
    return { code: 444, msg: '不支持的平台' } as ListInfoResponse;
  }

  /**
   * 搜索话题
   * @param keyWord
   * @param contentType
   */
  public async searchTopic(
    keyWord: string,
    contentType: PubContentEnum,
    categoryId?: string,
  ): Promise<ListInfoResponse | undefined> {
    return { code: 444, msg: '不支持的平台' } as ListInfoResponse;
  }

  /**
   * 搜索参与话题。与普通话题搜索独立，平台按需实现。
   */
  public async searchParticipationTopic(
    keyWord: string,
    contentType: PubContentEnum,
    categoryId?: string,
    args?: object,
  ): Promise<ListInfoResponse | undefined> {
    return { code: 444, msg: '不支持的平台' } as ListInfoResponse;
  }

  /**
   * 搜索音乐
   * @param keyWord
   * @param nextPage
   */
  public async searchMusic(keyWord: string, nextPage: string): Promise<ListMusicInfoResponse | undefined> {
    return { code: 444, msg: '不支持的平台' } as ListMusicInfoResponse;
  }

  /**
   * 根据分类获取音乐
   * @param categoryId
   * @param categoryName
   * @param nextPage
   */
  public async getMusicByCategory(
    categoryId: string,
    categoryName: string,
    nextPage: string,
  ): Promise<ListMusicInfoResponse | undefined> {
    return { code: 444, msg: '不支持的平台' } as ListMusicInfoResponse;
  }

  /**
   * 删除内容
   * @param docId
   * @param contentType
   * @param isDraft
   */
  public async deleteContent(docId: string, contentType?: PubContentEnum, isDraft?: boolean): Promise<BaseResult> {
    return { code: 444, msg: '不支持的平台' };
  }

  /**
   * 搜索当前平台用户列表
   * @param keyWord
   */
  public async searchUserInfoList(keyWord: string): Promise<BaseResult> {
    return { code: 444, msg: '不支持的平台' };
  }

  /**
   * 搜索剧集列表
   * @param _keyWord 搜索关键词
   * @param _pageNum 翻页页码
   */
  public async searchDramaList(args: object): Promise<BaseResult> {
    return { code: 444, msg: '不支持的平台' };
  }

  /**
   * 搜索其他平台用户列表
   * @param keyWord
   * @param platform 平台代码
   */
  public async searchOtherUserInfoList(keyWord: string, platform?: Platforms): Promise<BaseResult> {
    return { code: 444, msg: '不支持的平台' };
  }

  /**
   * 搜索内容列表
   * @param yixiaoerId
   * @param keyWord
   * @param platform
   */
  public async searchContentList(
    yixiaoerId: string,
    keyWord?: string,
    platform?: Platforms,
    nextPage?: string,
  ): Promise<BaseResult> {
    return { code: 444, msg: '不支持的平台' };
  }

  /**
   * 搜索投票列表
   * @param keyWord
   */
  public async searchVoteList(keyWord?: string): Promise<BaseResult> {
    return { code: 444, msg: '不支持的平台' };
  }

  /**
   * 搜索投票详情
   * @param voteId
   */
  public async getVoteDetail(voteId: string): Promise<BaseResult> {
    return { code: 444, msg: '不支持的平台' };
  }

  /**
   * 搜索商品/团队列表
   * @param keyWord
   */
  public async searchGoodsList(
    keyWord?: string,
    nextPage?: string,
    proxy?: KuaiDaiLiProxy,
    locationType?: LocationType,
    coords?: GeoLocation,
    options?: object,
  ): Promise<BaseResult> {
    return { code: 444, msg: '不支持的平台' };
  }

  /**
   * 获取商品选择器分类/筛选项
   * @param args 平台自定义查询参数
   */
  public async getGoodsTabs(args?: object): Promise<BaseResult> {
    return { code: 444, msg: '不支持的平台' };
  }

  /**
   * 搜索商品/团队列表
   * @param keyWord
   */
  public async parseGoodsDetail(keyWord?: string): Promise<BaseResult> {
    return { code: 444, msg: '不支持的平台' };
  }

  /**
   * 检测商品/挂车参数合法性
   * @param goods
   */
  public async checkPublishGoods(goods: CheckGoodsParams): Promise<BaseResult> {
    return { code: 444, msg: '不支持的平台' };
  }
  /**
   * 获取合集列表
   * @param contentType
   */
  public async getCollectionList(contentType?: PubContentEnum, args?: object): Promise<BaseResult> {
    return { code: 444, msg: '不支持的平台' };
  }

  /**
   * 获取群聊/群组列表
   * @param args
   */
  public async getGroupList(args?: object): Promise<BaseResult> {
    return { code: 444, msg: '不支持的平台' };
  }

  /**
   * 获取直播预告
   * @param args
   */
  public async getLivePlanList(args?: object): Promise<ListInfoResponse> {
    return { code: 444, msg: '不支持的平台' };
  }

  /**
   * 获取可同步的app列表
   * @param args
   */
  public async getSyncAppList(args?: object): Promise<ListInfoResponse> {
    return { code: 444, msg: '不支持的平台' };
  }

  /**
   * 获取活动分类列表
   * @param contentType
   */
  public async getActivityCategory(contentType?: PubContentEnum): Promise<BaseResult> {
    return { code: 444, msg: '不支持的平台' };
  }

  /**
   * 获取活动列表
   * @param contentType
   */
  public async getActivityList(
    contentType?: PubContentEnum,
    categoryId?: string,
    keyWord?: string,
    args?: object,
  ): Promise<BaseResult> {
    return { code: 444, msg: '不支持的平台' };
  }

  /**
   * 获取参与话题推荐列表。与活动/普通话题接口独立，平台按需实现。
   */
  public async getParticipationTopicList(
    contentType?: PubContentEnum,
    categoryId?: string,
    args?: object,
  ): Promise<ListInfoResponse | undefined> {
    return { code: 444, msg: '不支持的平台' } as ListInfoResponse;
  }

  /**
   * 获取热点列表
   * @param contentType
   */
  public async getHotEventList(contentType?: PubContentEnum, keyWord?: string): Promise<BaseResult> {
    return { code: 444, msg: '不支持的平台' };
  }

  /**
   * 获取挑战列表
   * @param contentType
   */
  public async getTiaoZhanList(keyWord?: string): Promise<BaseResult> {
    return { code: 444, msg: '不支持的平台' };
  }

  /**
   * 获取挂车权限
   */
  public async getShoppingPrivilege(): Promise<ShoppingPrivilege | undefined> {
    return { code: 444, msg: '不支持的平台' };
  }

  /**
   * 获取小程序挂在权限
   */
  public async getMiniAppPrivilege(): Promise<BaseResult | undefined> {
    return { code: 444, msg: '不支持的平台' };
  }
  /**
   * 获取城市列表
   * @param proxy
   */
  public async getLocationCity(proxy?: KuaiDaiLiProxy): Promise<ListInfoResponse | undefined> {
    return { code: 444, msg: '不支持的平台' } as ListInfoResponse;
  }
  /**
   * 获取影视
   * @param args
   */
  public async getFilmList(args?: object): Promise<ListInfoResponse | undefined> {
    return { code: 444, msg: '不支持的平台' } as ListInfoResponse;
  }

  /**
   * 获取游戏列表
   * @param args
   */
  public async getGameList(args?: object): Promise<ListInfoResponse | undefined> {
    return { code: 444, msg: '不支持的平台' } as ListInfoResponse;
  }

  /**
   * 获取小程序
   * @param keyWord
   */
  public async getMiniAppList(keyWord?: string): Promise<BaseResult> {
    return { code: 444, msg: '不支持的平台' };
  }

  /**
   * 获取共创权益信息
   * @param keyWord
   */
  public async getCoCreation(keyWord?: string): Promise<ListInfoResponse> {
    return { code: 444, msg: '不支持的平台' };
  }

  public async getCommentList(taskParams: DataSyncTaskItem, eventCall?: EventEmitter): Promise<BaseResult> {
    return { code: 444, msg: '不支持的平台' };
  }

  public async addComment(taskParams: object): Promise<BaseResult> {
    return { code: 444, msg: '不支持的平台' };
  }

  public async delComment(delTaskPrams: object): Promise<BaseResult> {
    return { code: 444, msg: '不支持的平台' };
  }

  public async digComment(digTaskPrams: object): Promise<BaseResult> {
    return { code: 444, msg: '不支持的平台' };
  }
  public async getCommentContent(taskParams: object): Promise<CommentContentListInfoResponse> {
    return { code: 444, msg: '不支持的平台' };
  }
  public async getContentComment(taskParams: object): Promise<CommentListInfoResponse> {
    return { code: 444, msg: '不支持的平台' };
  }

  //获取会话列表
  public async getConversationList(taskParams: object): Promise<MessageConversationListInfoResponse> {
    return { code: 444, msg: '不支持的平台' };
  }

  //获取指定会话的详情，名称头像等
  public async getConversationInfo(taskParams: object): Promise<BaseResult> {
    return { code: 444, msg: '不支持的平台' };
  }
  //获取陌生人/新增会话消息
  public async getNewConversationList(taskParams: object): Promise<MessageListInfoResponse> {
    return { code: 444, msg: '不支持的平台' };
  }

  //获取指定会话的消息，默认第一页
  public async getMessageListByConversation(taskParams: object): Promise<MessageListInfoResponse> {
    return { code: 444, msg: '不支持的平台' };
  }

  public async getNewMessageList(taskParams: object): Promise<MessageListInfoResponse> {
    return { code: 444, msg: '不支持的平台' };
  }
  public async SendMessage(taskParams: object): Promise<{ code: number; msg: string; messageId?: string }> {
    return { code: 444, msg: '不支持的平台' };
  }

  public async createMsgService(task: object, event?: EventEmitter): Promise<{ code: number; msg: string }> {
    return { code: 444, msg: '不支持的平台' };
  }
  public async dropMsgService(): Promise<{ code: number; msg: string }> {
    return { code: 444, msg: '不支持的平台' };
  }

  /**
   * 获取新消息(可选方法,用于WebSocket通知后获取消息)
   * 平台可以实现此方法来处理WebSocket通知后的消息获取
   * @param notifyData WebSocket通知数据
   * @returns 消息列表
   */
  public async fetchNewMessages?(notifyData?: any): Promise<MessageListInfoResponse> {
    // 默认调用getNewMessageList
    return this.getNewMessageList({});
  }

  public async parseMessageMedia(data?: object): Promise<BaseResult> {
    return { code: 400, msg: '不支持的平台' };
  }
  /**
   * 初始化消息游标cookie(可选方法)
   * 某些平台(如视频号)需要在WebSocket连接后初始化消息游标
   */
  public async initMsgCursorCookie?(): Promise<void> {
    // 默认不实现
  }

  /**
   * 创建WebSocket服务(可选方法)
   * 如果平台支持WebSocket,子类可以实现此方法
   * @returns WebSocket服务实例或null
   */
  public async createWebSocketService?(): Promise<any | null> {
    return null;
  }

  /**
   * 更新WebSocket Cookie(可选方法)
   * 如果实现了createWebSocketService,建议也实现此方法
   * @param cookie 新的Cookie字符串
   * @param localStorage 本地存储(可选)
   */
  public updateWebSocketCookie?(cookie: string, localStorage?: object): void {
    // 默认不实现
  }

  public async checkPublishRiskStatus(taskParams: object): Promise<BaseResult> {
    return { code: 444, msg: '不支持的平台' };
  }
  public async sendPublishCheckSmsCode(taskParams: object): Promise<BaseResult> {
    return { code: 444, msg: '不支持的平台' };
  }
  public async verifyPublishRisk(taskParams: object): Promise<BaseResult> {
    return { code: 444, msg: '不支持的平台' };
  }

  /**
   * 获取AI对话会话列表
   */
  public async getAIChatConversationList(taskParams: {
    cursor?: string;
    limit?: number;
  }): Promise<AIChatConversationListResponse> {
    return { code: 400, msg: '不支持的平台', items: [], hasMore: false };
  }

  /**
   * 获取指定AI对话会话的消息列表
   */
  public async getAIChatMessages(taskParams: {
    conversationId: string;
    cursor?: string;
    limit?: number;
  }): Promise<AIChatMessageListResponse> {
    return { code: 400, msg: '不支持的平台', items: [], hasMore: false };
  }

  /**
   * 发送AI对话消息并接收回复。
   */
  public async sendAIChatMessage(taskParams: {
    content: string;
    options?: SendMessageOptions;
    streamResponse?: boolean;
  }): Promise<{ code: number; msg: string; messageId?: string; conversationId?: string; aiResponseContent?: string }> {
    return { code: 400, msg: '不支持的平台' };
  }

  /**
   * 解析AI对话附件信息
   */
  public async parseAIChatAttachment(taskParams: {
    attachmentId: string;
    exportType?: string;
    attachmentType?: 'document' | 'video';
  }): Promise<AIChatAttachmentParseResponse> {
    return { code: 400, msg: '不支持的平台' };
  }

  public async getDownloadRequest(taskParams: {
    url?: string;
    id: string;
    exportType?: string;
    attachmentType?: 'document' | 'video';
  }): Promise<BaseResult> {
    if (!taskParams?.url) {
      return { code: 400, msg: '下载地址不能为空' };
    }

    return {
      code: 0,
      msg: 'success',
      data: {
        url: taskParams.url,
        headers: {},
      },
    };
  }

  public async downloadFile(taskParams: {
    url?: string;
    id: string;
    exportType?: string;
    attachmentType?: 'document' | 'video';
  }): Promise<Readable | BaseResult> {
    try {
      if (!taskParams?.url) {
        return { code: 400, msg: '下载地址不能为空' };
      }

      const stream = await getHttpStream(taskParams.url);
      const status = stream.statusCode ?? -1;
      if (status < 200 || status >= 300) {
        stream.resume();
        return { code: status, msg: '下载失败' };
      }

      return stream as unknown as Readable;
    } catch (e: any) {
      return { code: e?.code || -1, msg: e?.message || '下载文件失败' };
    }
  }
}
