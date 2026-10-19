import {
  BaseSinglePublishTask,
  BaseSinglePublishTaskDynamic,
  BaseSinglePublishTaskVideo,
} from '../../model/BaseTaskFormModel';
import { ContentCreateTypeEnum, PubContentEnum } from '../../model/TypeEnum';
import {
  CommentContentListInfoResponse,
  CommentListInfoResponse,
  Douyin,
  GeoLocation,
  GoodsItemInfo,
  ImageInfo,
  Kuaishou,
  ListInfoResponse,
  ListItemInfo,
  ListMusicInfoResponse,
  MessageConversationListInfoResponse,
  MessageListInfoResponse,
  PlatformAuthorInfo,
  Shipinhao,
  ShipinhaoActivityInfo,
  ShipinhaoCollectionInfo,
  ShipinhaoDynamicTaskInput,
  ShipinhaoGoodsInfo,
  ShipinhaoLocationInfo,
} from '../../../media-platform';
import { BaseWorker } from './baseworker';
import { AuditResult, PublishResult } from '../../../media-platform/baseModel';
import { ShipinhaoVideoTaskInput } from '../../../media-platform/shipinhao/shipinhao-video.service';
import { ShipinhaoStatementType } from '../../../media-platform/shipinhao/shipinhao-types';
import { errorCode } from '../../../media-platform/errorCode';
import { PlatformMusicInfo } from '../../../media-platform/model';
import { BaseResult } from '../../../media-platform/baseResult';
import { IWebProxy, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { LocationType } from '@/platform-body/common';
import { LocationTypePrivilege, ShoppingPrivilege } from '@/cloud/model/SearchDataModel';
import { MessageType } from '@/service/datasync-service-manager';
import { ShipinhaoMessageWebSocketService } from '@/media-platform/shipinhao/shipinhao-message-websocket.service';
import { BaseWebSocketService } from '@/cloud/task/base-websocket.service';
import { logger } from '@/utils';
import { WangYiHaoUserInfoResponseData } from '@/media-platform/wangyihao/wangyihao-user.service';
import { ShiPinHaoUserInfoResponse } from '@/media-platform/shipinhao/shipinhao-base.service';

export class ShiPinHaoWorker extends BaseWorker {
  /**
   * finderUsername缓存，key为yixiaoerId，value为finderUsername
   * @private
   */
  private static finderUsernameCache: Map<string, string> = new Map();

  /**
   * 缓存的WebSocket服务实例
   * @private
   */
  private cachedWsService?: ShipinhaoMessageWebSocketService;

  private logNonProd(message: string): void {
    if (process.env.ENV === 'test') {
      logger.info(message);
    }
  }

  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await Shipinhao.getShipinhaoUserInfo(this.cookies, proxy);

    // 缓存finderUsername
    if (this.userInfo?.yixiaoerId && this.userInfo?.raw?.['finderUsername']) {
      ShiPinHaoWorker.finderUsernameCache.set(this.userInfo.yixiaoerId, this.userInfo.raw['finderUsername']);
    }

    return this.checkResult(this.userInfo);
  }
  private checkResult(re: BaseResult): BaseResult {
    if (re?.code === 300333 || re?.code === 300334 || re.code === 300342 || re?.msg?.includes('登录')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }

  /**
   * 获取finderUsername，优先从缓存获取
   * @param platformAuthorId 平台作者ID（可选，如果不传则使用userInfo中的yixiaoerId）
   * @private
   */
  private async getFinderUsername(platformAuthorId?: string): Promise<string> {
    // 优先从缓存获取
    if (platformAuthorId) {
      const cached = ShiPinHaoWorker.finderUsernameCache.get(platformAuthorId);
      if (cached) {
        return cached;
      }
    }

    if (!this.userInfo?.yixiaoerId) {
      await this.getUserInfo();
    }

    // 从userInfo中获取
    return this.userInfo?.raw ? this.userInfo.raw['finderUsername'] : '';
  }
  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    if (taskDataIn.publishType == PubContentEnum.video) {
      const task = taskDataIn as BaseSinglePublishTaskVideo;
      //TODO 转换补充数据位发布接口所需的数据
      const taskData: ShipinhaoVideoTaskInput = {
        taskId: task.taskId,
        pubType: task.pubType ?? 1,
        video: task.video,
        cover: task.covers[0],
        desc: task.desc,
        uin: 0,
        finderUsername: '',
        postFlag: task.createType == ContentCreateTypeEnum.original ? 1 : 0,
        proxy: task.proxy,
        cancelToken: task.cancelToken,
        horizontalCover: task.horizontalCover,
        needParts: task.needParts,
        statement: task.statement ?? undefined,
        //短剧
        drama: task.drama,
      };

      //合集
      if (task.collection) {
        const coll = task.collection as ListItemInfo;
        taskData.collection = {
          id: coll.yixiaoerId,
          name: coll.yixiaoerName,
        };
      }
      if (task.location) {
        //地点
        taskData.location = task.location.raw as ShipinhaoLocationInfo;
      }
      if (task.prePubTime) {
        //定时发布
        taskData.effectiveTime = parseInt((task.prePubTime / 1000).toFixed(0));
      }
      if (task.category) {
        //分类
      }
      //挂车
      if (task.shopping_cart) {
        const goodsInfo = (task.shopping_cart as GoodsItemInfo)?.raw as ShipinhaoGoodsInfo;
        if (goodsInfo?.productId) {
          taskData.goods = goodsInfo;
        }
      }

      //活动
      if (task.activity) {
        taskData.event = (task.activity as ListItemInfo)?.raw as ShipinhaoActivityInfo;
      }

      //短标题
      taskData.shortTitle = task.short_title;

      const re = await Shipinhao.publishVideo(this.cookies, taskData, this.event);
      return this.checkResult(re) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.dynamic) {
      const task = taskDataIn as BaseSinglePublishTaskDynamic;
      //TODO 转换补充数据位发布接口所需的数据
      const taskData: ShipinhaoDynamicTaskInput = {
        taskId: task.taskId,
        pubType: task.pubType ?? 1,
        desc: task.desc,
        title: task.title,
        uin: 0,
        finderUsername: '',
        proxy: task.proxy,
        images: task.images,
        cancelToken: task.cancelToken,
        statement: task.statement ? { type: Number(task.statement.type) as ShipinhaoStatementType } : undefined,
        //短剧
        drama: task.drama,
      };
      //合集
      if (task.collection) {
        const coll = task.collection as ListItemInfo;
        taskData.collection = {
          id: coll.yixiaoerId,
          name: coll.yixiaoerName,
        };
      }
      if (task.location) {
        //地点
        taskData.location = task.location.raw as ShipinhaoLocationInfo;
      }
      if (task.prePubTime) {
        //定时发布
        taskData.effectiveTime = parseInt((task.prePubTime / 1000).toFixed(0));
      }
      //音乐
      if (task.music) {
        taskData.music = task.music.raw as PlatformMusicInfo;
      }

      //挂车
      if (task.shopping_cart) {
        const goodsInfo = (task.shopping_cart as GoodsItemInfo)?.raw as ShipinhaoGoodsInfo;
        if (goodsInfo?.productId) {
          taskData.goods = goodsInfo;
        }
      }

      //活动
      if (task.activity) {
        taskData.event = (task.activity as ListItemInfo)?.raw as ShipinhaoActivityInfo;
      }

      const re = await Shipinhao.publishDynamic(this.cookies, taskData, this.event);
      return this.checkResult(re) as PublishResult;
    } else {
      return {
        code: errorCode.data_error,
        msg: `不支持的内容类型:${taskDataIn.publishType}`,
        taskId: taskDataIn.taskId,
      };
    }
  }

  public async checkAuditStatus(publishId: string, publishType?: PubContentEnum): Promise<AuditResult | undefined> {
    return this.checkResult(await Shipinhao.getShipinhaoMediaStatus(this.cookies, publishId)) as AuditResult;
  }

  public async searchLocation(
    keyWord: string,
    nextPage: string,
    proxy?: KuaiDaiLiProxy,
  ): Promise<ListInfoResponse | undefined> {
    return this.checkResult(await Shipinhao.getShipinhaoLocation(this.cookies, keyWord, '', proxy));
  }

  public async searchMusic(keyWord: string, nextPage: string): Promise<ListMusicInfoResponse | undefined> {
    const seps = nextPage?.split('_');
    let pageNum = 1;
    let lastBuffer = '';
    if (seps?.length) {
      pageNum = Number(seps[0]);
      if (!pageNum) {
        pageNum = 1;
      }
      lastBuffer = seps?.length > 1 ? seps[1] : '';
    }
    return this.checkResult(
      await Shipinhao.getShipinhaoMusicList(
        this.cookies,
        keyWord ? 'search' : 'recommend',
        keyWord,
        pageNum,
        lastBuffer,
      ),
    );
  }

  public async deleteContent(docId: string): Promise<BaseResult> {
    return this.checkResult(await Shipinhao.deleteShipinhaoContent(this.cookies, docId));
  }

  public async searchTopic(keyWord: string, contentType: PubContentEnum): Promise<ListInfoResponse | undefined> {
    return Shipinhao.getShipinhaoTopicList(keyWord, this.cookies);
  }

  public async searchGoodsList(
    keyWord?: string,
    nextPage?: string,
    proxy?: KuaiDaiLiProxy,
    locationType?: LocationType,
    coords?: GeoLocation,
  ): Promise<BaseResult> {
    return this.checkResult(await Shipinhao.getShipinhaoGoods(this.cookies, keyWord ?? '', '', nextPage));
  }

  public async getActivityList(
    contentType?: PubContentEnum,
    categoryId?: string,
    keyWord?: string,
  ): Promise<BaseResult> {
    return this.checkResult(await Shipinhao.getShipinhaoActivity(this.cookies, keyWord ?? ''));
  }

  public async searchUserInfoList(keyWord: string): Promise<BaseResult> {
    return this.checkResult(await Shipinhao.getShipinhaoFriend(this.cookies, keyWord));
  }

  /**
   * 搜索视频号剧集列表
   * @param args
   */
  public async searchDramaList(args: {
    keyWord?: string;
    nextPage?: string;
    platform?: Array<{ platformUserId: string }>;
  }): Promise<BaseResult> {
    const finderUserName = await this.getFinderUsername(args.platform ? args.platform[0].platformUserId : '');
    return this.checkResult(
      await Shipinhao.getShipinhaoDrama(this.cookies, args.keyWord ?? '', finderUserName, Number(args.nextPage ?? '1')),
    );
  }

  /**
   * 获取挂车权限
   */
  public async getShoppingPrivilege(): Promise<ShoppingPrivilege | undefined> {
    const re = await Shipinhao.getShipinhaoPrivilege(this.cookies);
    return this.checkResult({
      code: re?.code ?? -1,
      msg: re?.msg,
      shopping_cart: re?.data?.switchInfo?.enablePostWithProduct === 1,
    } as never) as never;
  }

  public async addComment(taskParams: {
    contentId: string;
    text: string;
    commentId?: string;
    commentParentId?: string;
    proxy?: KuaiDaiLiProxy;
    platformAuthorId: string;
  }): Promise<BaseResult> {
    const result = await Shipinhao.addShipinhaoComment(
      this.cookies,
      await this.getFinderUsername(taskParams.platformAuthorId),
      taskParams.text,
      taskParams.contentId,
      taskParams.commentId,
      taskParams.commentParentId,
      taskParams.proxy,
    );

    return this.checkResult({
      code: result?.code ?? -1,
      msg: result?.msg,
      data: { commentId: result?.commentId ?? '' },
    });
  }

  public async delComment(delTaskPrams: {
    contentId: string;
    commentId: string;
    platformAuthorId: string;
  }): Promise<BaseResult> {
    const re = await Shipinhao.delShipinhaoComment(
      this.cookies,
      await this.getFinderUsername(delTaskPrams.platformAuthorId),
      delTaskPrams.contentId,
      delTaskPrams.commentId,
    );
    return this.checkResult({ code: re?.code ?? -1, msg: re?.msg });
  }

  public async digComment(digTaskPrams: {
    contentId: string;
    commentId: string;
    platformAuthorId: string;
  }): Promise<BaseResult> {
    const re = await Shipinhao.digShipinhaoComment(
      this.cookies,
      await this.getFinderUsername(digTaskPrams.platformAuthorId),
      digTaskPrams.contentId,
      digTaskPrams.commentId,
      1,
    );
    return this.checkResult({ code: re?.code ?? -1, msg: re?.msg });
  }

  public async getContentComment(taskParams: {
    contentId: string;
    commentId: string;
    nextPage: string;
    platformAuthorId: string;
  }): Promise<CommentListInfoResponse> {
    return this.checkResult(
      await Shipinhao.getShiPinHaoCommentByContent(
        this.cookies,
        taskParams.contentId,
        taskParams.commentId,
        taskParams.nextPage ?? '',
        taskParams.platformAuthorId,
        await this.getFinderUsername(taskParams.platformAuthorId),
      ),
    );
  }

  public async getCommentContent(taskParams: {
    nextPage: string;
    contentType: PubContentEnum;
    platformAuthorId: string;
  }): Promise<CommentContentListInfoResponse> {
    return this.checkResult(
      await Shipinhao.getShiPinHaoCommentContent(
        this.cookies,
        taskParams.nextPage,
        taskParams.platformAuthorId,
        await this.getFinderUsername(taskParams.platformAuthorId),
        taskParams.contentType,
      ),
    );
  }

  //获取会话列表
  public async getConversationList(taskParams: {
    nextPage: string;
    platformAuthorId: string;
    proxy?: IWebProxy;
  }): Promise<MessageConversationListInfoResponse> {
    return this.checkResult(
      await Shipinhao.getShiPinHaoMessageConversationList(
        this.cookies,
        taskParams.nextPage,
        await this.getFinderUsername(taskParams.platformAuthorId),
        taskParams.platformAuthorId,
        taskParams.proxy,
      ),
    );
  }

  //获取指定会话的详情，名称头像等
  public async getConversationInfo(taskParams: {
    sessionId: string;
    secSessionId: string;
    messageUserId: string;
    platformAuthorId: string;
    proxy?: IWebProxy;
  }): Promise<MessageConversationListInfoResponse> {
    return this.checkResult(
      await Shipinhao.getShiPinHaoMessageConversationInfo(
        this.cookies,
        taskParams.sessionId,
        taskParams.secSessionId,
        taskParams.messageUserId,
        await this.getFinderUsername(taskParams.platformAuthorId),
        taskParams.proxy,
      ),
    );
  }

  public async getMessageListByConversation(taskParams: {
    sessionId: string;
    secSessionId?: string;
    conversationType?: string;
    nextPage?: string;
    platformAuthorId: string;
    proxy?: IWebProxy;
  }): Promise<MessageListInfoResponse> {
    const re = await Shipinhao.getShiPinHaoNewMessageList(
      this.cookies,
      taskParams.nextPage ?? '',
      await this.getFinderUsername(taskParams.platformAuthorId),
      taskParams.platformAuthorId,
      taskParams.sessionId,
      taskParams.proxy,
    );

    return this.checkResult(re);
  }

  public async getNewMessageList(taskParams: {
    nextPage?: string;
    platformAuthorId?: string;
    proxy?: IWebProxy;
  }): Promise<MessageListInfoResponse> {
    const re = await Shipinhao.getShiPinHaoNewMessageList(
      this.cookies,
      taskParams.nextPage ?? '',
      await this.getFinderUsername(taskParams.platformAuthorId),
      taskParams.platformAuthorId,
      undefined,
      taskParams.proxy,
    );

    if (!taskParams.nextPage) {
      // const now = new Date();
      // now.setHours(0, 0, 0, 0);
      // const timestamp = now.getTime();
      re.dataList = re.dataList?.slice(20);
    }

    return this.checkResult(re);
  }

  /**
   * 获取单条新消息(用于WebSocket通知后)
   * @param taskParams 包含cursorCookie的参数
   */
  public async getNewMsg(taskParams: {
    cursorCookie: string;
    platformAuthorId?: string;
    proxy?: IWebProxy;
  }): Promise<MessageListInfoResponse> {
    const re = await Shipinhao.getShiPinHaoNewMsg(
      this.cookies,
      taskParams.cursorCookie,
      await this.getFinderUsername(taskParams.platformAuthorId),
      taskParams.platformAuthorId,
      taskParams.proxy,
    );

    //re.dataList = re.dataList?.sort((a, b) => a.timestamp - b.timestamp);

    return this.checkResult(re);
  }

  /**
   * 获取新消息(实现BaseWorker的可选方法)
   * 视频号特定逻辑:管理消息游标cookie,根据是否有cookie选择调用不同接口
   * @param notifyData WebSocket通知数据(可选)
   */
  public async fetchNewMessages(notifyData?: any): Promise<MessageListInfoResponse> {
    try {
      // 如果有消息游标cookie,使用get-new-msg接口获取单条新消息
      if (this.msgCursorCookie) {
        this.logNonProd(`使用get-new-msg接口获取新消息`);

        const result = await this.getNewMsg({
          cursorCookie: this.msgCursorCookie,
          platformAuthorId: this.userInfo?.yixiaoerId ?? '',
        });

        // 更新cookie用于下次调用
        if (result.code === 0 && result.nextPage) {
          this.msgCursorCookie = result.nextPage;
          this.logNonProd(`消息游标cookie已更新`);
        }

        return result;
      }

      // 没有cookie,使用getNewMessageList接口
      this.logNonProd(`使用getNewMessageList接口获取新消息`);

      const result = await this.getNewMessageList({
        platformAuthorId: this.userInfo?.yixiaoerId ?? '',
      });

      // 如果返回了nextPage,保存为消息游标cookie
      if (result.code === 0 && result.nextPage) {
        this.msgCursorCookie = result.nextPage;
        this.logNonProd(`消息游标cookie已初始化`);
      }

      return result;
    } catch (error) {
      logger.error(`获取新消息失败:${error}`);
      return {
        code: -1,
        msg: `获取新消息失败:${error}`,
        dataList: [],
      };
    }
  }

  /**
   * 初始化消息游标cookie
   * 调用一次getNewMessageList获取初始cookie
   */
  public async initMsgCursorCookie(): Promise<void> {
    try {
      this.logNonProd(`初始化消息游标cookie`);

      const result = await this.getNewMessageList({
        platformAuthorId: this.userInfo?.yixiaoerId ?? '',
      });

      if (result.code === 0 && result.nextPage) {
        this.msgCursorCookie = result.nextPage;
        this.logNonProd(`消息游标cookie初始化成功`);
      } else {
        this.logNonProd(`消息游标cookie初始化失败:code=${result.code}`);
      }
    } catch (error) {
      logger.error(`初始化消息游标cookie失败:${error}`);
    }
  }

  /**
   * 消息游标cookie(用于get-new-msg接口)
   */
  private msgCursorCookie?: string;
  public async SendMessage(taskParams: {
    sessionId: string;
    secSessionId: string;
    text: string;
    messageType: MessageType;
    imageInfo: ImageInfo;
    proxy?: IWebProxy;
    platformAuthorId?: string;
  }): Promise<{ code: number; msg: string; messageId?: string }> {
    return this.checkResult(
      await Shipinhao.sendShipinhaoMessage(
        this.cookies,
        await this.getFinderUsername(taskParams.platformAuthorId),
        taskParams.secSessionId,
        taskParams.sessionId,
        taskParams.messageType === MessageType.image ? 'IMAGE' : 'TEXT',
        taskParams.text,
        taskParams.imageInfo,
        taskParams.proxy,
      ),
    ) as never;
  }

  public async getCollectionList(contentType?: PubContentEnum): Promise<BaseResult> {
    return this.checkResult(await Shipinhao.getShipinhaoCollection(this.cookies));
  }

  /**
   * 创建WebSocket服务(供MessageWorkerService调用)
   * 如果平台支持WebSocket,实现此方法
   * @returns WebSocket服务实例或null
   */
  public async createWebSocketService(): Promise<BaseWebSocketService | null> {
    try {
      // 从Cookie中提取wxuin
      const wxuin = this.extractWxuinFromCookie(this.cookies);
      if (!wxuin) {
        this.logNonProd('无法从Cookie中提取wxuin,WebSocket不可用');
        return null;
      }

      // 从Cookie中提取sessionid
      const sessionid = this.extractSessionIdFromCookie(this.cookies);
      if (!sessionid) {
        this.logNonProd('无法从Cookie中提取sessionid,WebSocket不可用');
        return null;
      }

      // 创建WebSocket服务
      const wsService = new ShipinhaoMessageWebSocketService(sessionid, wxuin);

      // 缓存实例,用于后续更新Cookie
      this.cachedWsService = wsService;

      this.logNonProd(`视频号WebSocket服务已创建`);
      return wsService;
    } catch (error) {
      logger.error(`创建视频号WebSocket服务失败:${error}`);
      return null;
    }
  }

  /**
   * 更新WebSocket Cookie(供MessageWorkerService调用)
   * @param cookie 新的Cookie字符串
   * @param localStorage 本地存储(可选)
   */
  public updateWebSocketCookie(cookie: string, localStorage?: object): void {
    try {
      if (!this.cachedWsService) {
        this.logNonProd('没有缓存的WebSocket服务,无法更新Cookie');
        return;
      }

      // 从新Cookie中提取wxuin和sessionid
      const wxuin = this.extractWxuinFromCookie(cookie);
      const sessionid = this.extractSessionIdFromCookie(cookie);

      if (!wxuin || !sessionid) {
        this.logNonProd('无法从新Cookie中提取wxuin或sessionid,跳过更新');
        return;
      }

      // 更新WebSocket服务的Cookie
      this.cachedWsService.updateCookie(sessionid, wxuin);

      this.logNonProd('视频号WebSocket Cookie已更新');
    } catch (error) {
      logger.error(`更新视频号WebSocket Cookie失败:${error}`);
    }
  }

  /**
   * 从Cookie字符串中提取wxuin
   * @param cookie Cookie字符串
   * @returns wxuin值或null
   */
  private extractWxuinFromCookie(cookie: string): string | null {
    try {
      // 支持两种格式:
      // 1. "wxuin=3699295969"
      // 2. "wxuin=3699295969; other=value"
      const match = cookie.match(/wxuin=([^;]+)/);
      return match ? match[1].trim() : null;
    } catch (error) {
      logger.error(`提取wxuin失败:${error}`);
      return null;
    }
  }

  /**
   * 从Cookie字符串中提取sessionid
   * @param cookie Cookie字符串
   * @returns sessionid值或null
   */
  private extractSessionIdFromCookie(cookie: string): string | null {
    try {
      // sessionid可能是URL编码的
      // 格式: "sessionid=BgAAKydV5Hu715yCwU%2FXaLf8WBRN62mjTOUMVHXYezYvbjBZ1HzEWvOkIiauqIvi%2FMi7%2FE6OczA9p1AEP%2BKJ6pdqXzEa%2BxIkf7aQ3jLbZy1Y"
      const match = cookie.match(/sessionid=([^;]+)/);
      if (match) {
        // 返回原始值(保持URL编码状态)
        return match[1].trim();
      }
      return null;
    } catch (error) {
      logger.error(`提取sessionid失败:${error}`);
      return null;
    }
  }

  public async parseMessageMedia(taskParams: {
    mediaType?: string;
    mediaParams?: Record<string, any>;
    imgMsg?: Record<string, any>;
    rawContent?: string;
    timestamp?: string | number;
    outputType?: 'url' | 'base64';
    proxy?: IWebProxy;
  }): Promise<BaseResult> {
    const mediaParams = (taskParams.mediaParams ?? taskParams.imgMsg ?? {}) as Record<string, any>;
    const re = await Shipinhao.parseShipinhaoMessageImageResponse(
      this.cookies,
      this.userInfo?.raw ? this.userInfo?.raw['finderUsername'] : '',
      mediaParams,
      taskParams.outputType,
      taskParams.proxy,
    );

    return this.checkResult(re);
  }

  public async getLocationTypePrivilege(): Promise<LocationTypePrivilege | undefined> {
    if (!this.userInfo?.yixiaoerId) {
      await this.getUserInfo();
    }
    if (!this.userInfo?.yixiaoerId) {
      return this.checkResult({
        code: this.userInfo?.code ?? -1,
        msg: this.userInfo?.msg,
      });
    }
    const oriInfo = this.userInfo?.data as ShiPinHaoUserInfoResponse;
    return this.checkResult({
      code: 0,
      msg: '',
      drama: !!oriInfo?.entranceInfo?.nativeDramaSelfOperatedEntrance,
    } as never) as never;
  }
}
