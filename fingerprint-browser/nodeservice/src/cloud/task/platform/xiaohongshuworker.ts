import {
  BaseSinglePublishTask,
  BaseSinglePublishTaskDynamic,
  BaseSinglePublishTaskVideo,
} from '../../model/BaseTaskFormModel';
import { ContentCreateTypeEnum, PubContentEnum, VisibleTypeEnum } from '../../model/TypeEnum';
import {
  CommentContentListInfoResponse,
  CommentListInfoResponse,
  GeoLocation,
  ImageInfo,
  ListInfoResponse,
  ListItemInfo,
  ListMusicInfoResponse,
  MessageConversationListInfoResponse,
  MessageListInfoResponse,
  PlatformAuthorInfo,
  UserCanPublishInfo,
  Xiaohongshu,
  XiaohongshuDynamicTaskInput,
  XiaohongshuLocationInfo,
  XiaohongshuVideoTaskInput,
} from '../../../media-platform';
import { BaseWorker } from './baseworker';
import { AuditResult, PublishResult } from '../../../media-platform/baseModel';
import { errorCode } from '../../../media-platform/errorCode';
import { BaseResult } from '../../../media-platform/baseResult';
import { IWebProxy, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { PhotoInfo, XiaoHongShuStatementType } from '@/platform-body/video';
import { MessageType, Platforms, SessionType } from '@/service/datasync-service-manager';
import { XiaHongShuProService } from '@/media-platform/xiaohongshu/xiaohongshu-service';
import { EventEmitter } from 'events';
import { convertCookieStr } from '@/utils';
import { ShoppingPrivilege } from '@/cloud/model/SearchDataModel';
import { LocationType } from '@/platform-body/common';
import dayjs from 'dayjs';

export class XiaoHongShuWorker extends BaseWorker {
  public msgService?: XiaHongShuProService;
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await Xiaohongshu.getXiaohongshuUserInfo(this.cookies, proxy);
    return this.checkResult(this.userInfo);
  }

  public refreshCookie(cookie: string, localStorage?: object) {
    this.cookies = convertCookieStr(cookie, this.domain);
    this.localStorage = localStorage ? localStorage : localStorage;
    this.msgService?.updateCookie(this.cookies);
  }
  private checkResult(re: BaseResult): BaseResult {
    if (re?.code === -100 || re?.msg?.includes('登录')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    if (taskDataIn.publishType == PubContentEnum.video) {
      const task = taskDataIn as BaseSinglePublishTaskVideo;
      //TODO 转换补充数据位发布接口所需的数据
      const taskData: XiaohongshuVideoTaskInput = {
        taskId: task.taskId,
        pubType: task.pubType,
        video: task.video,
        cover: task.covers[0],
        title: task.title,
        desc: task.desc,
        visibilityType: 0,
        proxy: task.proxy,
        cancelToken: task.cancelToken,
        needParts: task.needParts,
      };

      //添加商品
      if (task.shopping_cart) {
        taskData.shopping_cart = task.shopping_cart as Array<ListItemInfo>;
      }

      //群聊
      if (task['group']) {
        taskData.group = task['group'] as ListItemInfo;
      }

      //直播预告
      if (task['bind_live_info']) {
        taskData.bind_live_info = task['bind_live_info'];
      }

      //合集
      if (task?.collection) {
        taskData.collectionId = (task.collection as ListItemInfo)?.yixiaoerId;
      }
      //可见类型
      if (task.visibleType) {
        switch (task.visibleType) {
          case VisibleTypeEnum.private:
            taskData.visibilityType = 1;
            break;
          case VisibleTypeEnum.friend:
            taskData.visibilityType = 4;
            break;
          default:
            taskData.visibilityType = 0;
            break;
        }
      }
      if (task.location) {
        //地点
        taskData.location = task.location.raw as XiaohongshuLocationInfo;
      }
      if (task.prePubTime) {
        //定时发布
        taskData.postTime = task.prePubTime;
      }
      if (task.category) {
        //分类
      }

      //申明
      if (task.statement?.type) {
        taskData.userDeclarationBind = {
          origin: task.statement.type as XiaoHongShuStatementType,
        };
        if (taskData.userDeclarationBind?.origin === XiaoHongShuStatementType.FORWARD) {
          taskData.userDeclarationBind.repostInfo = { source: task.statement['forward_source'] };
        } else if (taskData.userDeclarationBind?.origin === XiaoHongShuStatementType.OWN) {
          const photoInfo = task.statement['photoInfo'] as PhotoInfo;
          if (photoInfo?.address?.yixiaoerId && photoInfo?.time) {
            taskData.userDeclarationBind.photoInfo = {
              photoPlace: {
                subname: photoInfo?.address?.yixiaoerDesc ?? '',
                poiType: 12,
                poiId: photoInfo.address?.yixiaoerId,
                name: photoInfo.address?.yixiaoerName,
              },
              photoTime: dayjs(photoInfo.time).format('YYYY-MM-DD'),
            };
          }
        }
      }
      //原创
      if (task.createType === ContentCreateTypeEnum.original) {
        if (task.video.duration > 10) {
          taskData.isOriginal = 1;
        }
      }
      const re = await Xiaohongshu.publishVideo(this.cookies, taskData, this.event);
      return this.checkResult(re) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.dynamic) {
      const task = taskDataIn as BaseSinglePublishTaskDynamic;
      //TODO 转换补充数据位发布接口所需的数据
      const taskData: XiaohongshuDynamicTaskInput = {
        taskId: task.taskId,
        desc: task.desc,
        title: task.title,
        visibilityType: 0,
        proxy: task.proxy,
        images: task.images,
        cancelToken: task.cancelToken,
      };

      //添加商品
      if (task.shopping_cart) {
        taskData.shopping_cart = task.shopping_cart as Array<ListItemInfo>;
      }

      //群聊
      if (task['group']) {
        taskData.group = task['group'] as ListItemInfo;
      }

      //直播预告
      if (task['bind_live_info']) {
        taskData.bind_live_info = task['bind_live_info'];
      }

      //合集
      if (task?.collection) {
        taskData.collectionId = (task.collection as ListItemInfo)?.yixiaoerId;
      }
      //可见类型
      if (task.visibleType) {
        switch (task.visibleType) {
          case VisibleTypeEnum.private:
            taskData.visibilityType = 1;
            break;
          case VisibleTypeEnum.friend:
            taskData.visibilityType = 4;
            break;
          default:
            taskData.visibilityType = 0;
            break;
        }
      }
      if (task.location) {
        //地点
        taskData.location = task.location.raw as XiaohongshuLocationInfo;
      }
      if (task.prePubTime) {
        //定时发布
        taskData.postTime = task.prePubTime;
      }
      //申明
      if (task.statement?.type) {
        taskData.userDeclarationBind = {
          origin: task.statement.type as never as XiaoHongShuStatementType,
        };
        if (taskData.userDeclarationBind?.origin === XiaoHongShuStatementType.FORWARD) {
          taskData.userDeclarationBind.repostInfo = { source: task.statement['forward_source'] };
        } else if (taskData.userDeclarationBind?.origin === XiaoHongShuStatementType.OWN) {
          const photoInfo = task.statement['photoInfo'] as PhotoInfo;
          if (photoInfo?.address?.yixiaoerId && photoInfo?.time) {
            taskData.userDeclarationBind.photoInfo = {
              photoPlace: {
                subname: photoInfo?.address?.yixiaoerDesc ?? '',
                poiType: 12,
                poiId: photoInfo.address?.yixiaoerId,
                name: photoInfo.address?.yixiaoerName,
              },
              photoTime: dayjs(photoInfo.time).format('YYYY-MM-DD'),
            };
          }
        }
      }
      //原创
      if (task.createType === ContentCreateTypeEnum.original) {
        taskData.isOriginal = 1;
      }
      const re = await Xiaohongshu.publishDynamic(this.cookies, taskData, this.event);
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
    return this.checkResult(await Xiaohongshu.getXiaohongshuMediaStatus(this.cookies, publishId)) as AuditResult;
  }

  public async searchLocation(
    keyWord: string,
    nextPage: string,
    proxy?: KuaiDaiLiProxy,
  ): Promise<ListInfoResponse | undefined> {
    return this.checkResult(await Xiaohongshu.getXiaohongshuLocationList(this.cookies, keyWord, 1, proxy));
  }

  public async searchMusic(keyWord: string, nextPage: string): Promise<ListMusicInfoResponse | undefined> {
    //todo 小红书音乐
    return { code: 444, msg: '不支持的平台' };
  }

  public async deleteContent(docId: string): Promise<BaseResult> {
    return this.checkResult(await Xiaohongshu.deleteXiaohongshuContent(this.cookies, docId));
  }

  public async searchTopic(keyWord: string, contentType: PubContentEnum): Promise<ListInfoResponse | undefined> {
    return this.checkResult(await Xiaohongshu.getXiaohongshuTopicList(this.cookies, keyWord));
  }
  public async searchUserInfoList(keyWord: string): Promise<BaseResult> {
    return this.checkResult(await Xiaohongshu.getXiaohongshuFriendList(this.cookies, keyWord));
  }
  public async checkUserCanPublish(proxy?: IWebProxy): Promise<UserCanPublishInfo | undefined> {
    return { code: 0, data: { status: 0, msg: '' } };
    //有误判，先取消
    //return Xiaohongshu.getXiaoHongShuUserCanPubInfo(this.cookies, proxy);
  }

  public async addComment(taskParams: {
    contentId: string;
    text: string;
    commentId?: string;
    commentParentId?: string;
  }): Promise<BaseResult> {
    if (!this.userInfo?.yixiaoerId) {
      await this.getUserInfo();
    }
    const result = await Xiaohongshu.addXiaohongshuComment(
      this.cookies,
      taskParams.text,
      taskParams.contentId,
      taskParams.commentId,
    );

    return this.checkResult({
      code: result?.code ?? -1,
      msg: result?.msg,
      data: { commentId: result?.commentId ?? '' },
    });
  }

  public async delComment(delTaskPrams: { contentId: string; commentId: string }): Promise<BaseResult> {
    if (!this.userInfo?.yixiaoerId) {
      await this.getUserInfo();
    }
    const re = await Xiaohongshu.delXiaohongshuComment(this.cookies, delTaskPrams.contentId, delTaskPrams.commentId);
    return this.checkResult({ code: re?.code ?? -1, msg: re?.msg });
  }

  public async digComment(digTaskPrams: { contentId: string; commentId: string }): Promise<BaseResult> {
    if (!this.userInfo?.yixiaoerId) {
      await this.getUserInfo();
    }
    const re = await Xiaohongshu.digXiaohongshuComment(
      this.cookies,
      digTaskPrams.contentId,
      digTaskPrams.commentId,
      'like',
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
      await Xiaohongshu.getXiaoHongShuCommentByContent(
        this.cookies,
        taskParams.contentId,
        taskParams.commentId,
        taskParams.nextPage ?? '',
        taskParams.platformAuthorId,
      ),
    );
  }

  public async getCommentContent(taskParams: {
    nextPage: string;
    contentType: PubContentEnum;
    platformAuthorId: string;
  }): Promise<CommentContentListInfoResponse> {
    return this.checkResult(
      await Xiaohongshu.getXiaoHongShuCommentContent(this.cookies, taskParams.nextPage, taskParams.platformAuthorId),
    );
  }

  //获取会话列表
  public async getConversationList(taskParams: {
    nextPage: string;
    platformAuthorId: string;
    proxy?: IWebProxy;
  }): Promise<MessageConversationListInfoResponse> {
    if (!taskParams?.platformAuthorId && !this.userInfo?.yixiaoerId) {
      const userinfo = await Xiaohongshu.Pro.getXiaohongshuProUserInfo(this.cookies);
      taskParams.platformAuthorId = userinfo.yixiaoerId ?? '';
    }
    return this.checkResult(
      await Xiaohongshu.Pro.getXiaoHongShuProMessageConversationList(
        this.cookies,
        taskParams.nextPage,
        taskParams.platformAuthorId,
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
  }): Promise<MessageListInfoResponse> {
    return this.checkResult(
      await Xiaohongshu.Pro.getXiaoHongShuProMessageListByConversation(
        this.cookies,
        taskParams.sessionId,
        taskParams.sessionId ?? '',
        taskParams.nextPage,
        taskParams.platformAuthorId,
      ),
    );
  }
  //获取指定会话的详情，名称头像等
  public async getConversationInfo(taskParams: {
    sessionId: string;
    secSessionId: string;
    messageUserId: string;
    platformAuthorId: string;
  }): Promise<MessageConversationListInfoResponse> {
    const re = { code: 0, msg: '' };
    if (this.msgService?.localSessionCache?.has(taskParams.sessionId)) {
      const obj: any = this.msgService.localSessionCache.get(taskParams.sessionId);
      re['data'] = {
        platform: Platforms.XiaoHongShu,
        accountId: taskParams.platformAuthorId,
        messageUserId: taskParams.sessionId,
        messageUserName: obj.nickname,
        messageUserAvatar: obj.avatar,
        messageOwnerId: '',
        sessionId: taskParams.sessionId,
        secSessionId: '',
        sessionType: SessionType.stranger,
      };
      return this.checkResult(re);
    }
    return re;
  }

  public async SendMessage(taskParams: {
    sessionId: string;
    secSessionId: string;
    text: string;
    messageType: MessageType;
    imageInfo: ImageInfo;
    proxy?: IWebProxy;
  }): Promise<{ code: number; msg: string; messageId?: string }> {
    return this.checkResult(
      await Xiaohongshu.Pro.sendXiaohongshuProMessage(
        this.cookies,
        taskParams.sessionId,
        taskParams.messageType === MessageType.image ? 'IMAGE' : 'TEXT',
        taskParams.text,
        taskParams.imageInfo,
        taskParams.secSessionId,
        taskParams.proxy,
      ),
    ) as never;
  }
  public async createMsgService(
    task: { platformAuthorId: string },
    event: EventEmitter,
  ): Promise<{ code: number; msg: string }> {
    try {
      if (!this.msgService) {
        if (!task?.platformAuthorId && !this.userInfo?.yixiaoerId) {
          const userinfo = await Xiaohongshu.Pro.getXiaohongshuProUserInfo(this.cookies);
          task.platformAuthorId = userinfo.yixiaoerId ?? '';
        }
        this.msgService = new XiaHongShuProService(
          task.platformAuthorId,
          this.cookies as never,
          new Map<string, string>(),
          event,
        );
        this.msgService.init();
        return { code: 0, msg: '' };
      }
      return { code: 1, msg: '' };
    } catch (e) {
      this.msgService = undefined;
      return { code: 444, msg: '初始化化私信链接异常' };
    }
  }

  public async dropMsgService(): Promise<{ code: number; msg: string }> {
    try {
      this.msgService?.stop();
      this.msgService?.DataEvent?.removeAllListeners();
      return { code: 0, msg: '' };
    } catch (e) {
      return { code: 444, msg: '' };
    }
  }

  public async getActivityList(
    contentType?: PubContentEnum,
    categoryId?: string,
    keyWord?: string,
  ): Promise<BaseResult> {
    const re = await Xiaohongshu.getXiaoHongShuActivityListInfo(this.cookies);
    return this.checkResult(re);
  }

  public async getCollectionList(contentType?: PubContentEnum, args?: object): Promise<BaseResult> {
    return this.checkResult(await Xiaohongshu.getXiaohongshuCollection(this.cookies, (args as any)?.nextPage));
  }

  public async getGroupList(args?: object): Promise<BaseResult> {
    return this.checkResult(await Xiaohongshu.getXiaohongshuGroup(this.cookies, (args as any)?.nextPage));
  }

  public async getLivePlanList(args?: { platformAuthorId: string }): Promise<ListInfoResponse> {
    return this.checkResult(await Xiaohongshu.getXiaoHongShuZhiBoPlanList(this.cookies, args?.platformAuthorId));
  }

  public async getShoppingPrivilege(): Promise<ShoppingPrivilege | undefined> {
    const re = await Xiaohongshu.getXiaoHongShuShopPrivilege(this.cookies);
    return this.checkResult(re as never);
  }

  public async searchGoodsList(
    keyWord?: string,
    nextPage?: string,
    proxy?: KuaiDaiLiProxy,
    locationType?: LocationType,
    coords?: GeoLocation,
  ): Promise<BaseResult> {
    return this.checkResult(await Xiaohongshu.getXiaoHongShuGoodsList(this.cookies, nextPage,keyWord));
  }
}
