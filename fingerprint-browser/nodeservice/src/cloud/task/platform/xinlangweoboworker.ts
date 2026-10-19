import {
  BaseSinglePublishTask,
  BaseSinglePublishTaskArticle,
  BaseSinglePublishTaskDynamic,
  BaseSinglePublishTaskVideo,
} from '../../model/BaseTaskFormModel';
import { ContentCreateTypeEnum, PubContentEnum, VisibleTypeEnum } from '../../model/TypeEnum';
import {
  CommentContentListInfoResponse,
  CommentListInfoResponse,
  ImageInfo,
  ListInfoResponse,
  ListItemInfo,
  ListLevelInfoResponse,
  MessageConversationListInfoResponse,
  MessageListInfoResponse,
  PlatformAuthorInfo,
  UserCanPublishNum,
  XinlangweiboArticleTaskInput,
  XinlangweiboLocationInfo,
  XinlangweiboMicroArticleTaskInput,
  XinlangweiboVideoTaskInput,
} from '../../../media-platform';
import { Xinlangweibo } from '../../../media-platform/xinlangweibo/xinlangweibo';
import { BaseWorker } from './baseworker';
import { AuditResult, PublishResult } from '../../../media-platform/baseModel';
import { convertCookieStr, logger } from '@/utils';
import { errorCode } from '../../../media-platform/errorCode';
import dayjs from 'dayjs';
import { BaseResult } from '../../../media-platform/baseResult';
import { IWebProxy, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { EventEmitter } from 'events';
import { LocationTypePrivilege } from '@/cloud/model/SearchDataModel';
import { MessageType, SyncEventName } from '@/service/datasync-service-manager';

export class XinLangWeiBoWorker extends BaseWorker {
  constructor(cookie?: string, localStorage?: object, eventCallBack?: EventEmitter, domain?: string) {
    super();
    this.cookies = cookie ? convertCookieStr(cookie, domain ?? 'weibo.com') : '';
    this.localStorage = localStorage;
    this.domain = domain ?? 'weibio.com';
    this.event = eventCallBack ?? new EventEmitter();
  }
  private checkResult(re: BaseResult): BaseResult {
    if (re.code === -100 || re?.msg?.includes('login')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await Xinlangweibo.getXinlangweiboUserInfo(this.cookies, proxy);
    return this.checkResult(this.userInfo);
  }
  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    if (taskDataIn.publishType == PubContentEnum.video) {
      const task = taskDataIn as BaseSinglePublishTaskVideo;
      //TODO 转换补充数据位发布接口所需的数据
      const taskData: XinlangweiboVideoTaskInput = {
        taskId: task.taskId,
        video: task.video,
        cover: {
          width: task.covers[0].width ?? 0,
          height: task.covers[0].height ?? 0,
          pathOrUrl: task.covers[0].pathOrUrl ?? '',
          size: task.covers[0].size ?? 0,
        },
        desc: task.desc,
        title: task.title,
        allowDownload: false,
        createType: task.createType === ContentCreateTypeEnum.original ? 0 : 1,
        visibilityType: task.visibleType == VisibleTypeEnum.public ? 0 : 1,
        proxy: task.proxy,
        cancelToken: task.cancelToken,
        needParts: task.needParts,
      };
      if (task.location) {
        //地点
        taskData.location = task.location.raw as XinlangweiboLocationInfo;
      }
      if (task.prePubTime) {
        if (!this.userInfo?.yixiaoerId) {
          this.userInfo = await Xinlangweibo.getXinlangweiboUserInfo(this.cookies);
        }
        if ((this.userInfo.raw as object)['verified_type'] != 2 && (this.userInfo.raw as object)['vvip'] != 1) {
          const pri = await Xinlangweibo.getXinlangweiboSchedulePostFrequency(this.cookies);
          //定时发布
          if (!pri?.data?.schedule?.residue_num) {
            return {
              code: -1,
              msg: pri.data?.edit?.residue_num
                ? '已无定时发布次数，请前往新浪微博官方平台确认。'
                : '此账号无定时发布权益，请前往新浪微博官方平台确认。',
              taskId: task.taskId,
            };
          }
        }
        taskData.publishTime = task.prePubTime;
      }
      if (task.category) {
        //分类
        taskData.subCategoryId = parseInt(task.subCategory?.yixiaoerId ?? task.category?.yixiaoerId ?? '0');
      }

      //合集
      if (task.collection) {
        const collections = task.collection as Array<ListItemInfo>;
        if (collections?.length) {
          taskData.collections = collections;
        }
      }
      const re = await Xinlangweibo.publishVideo(this.cookies, taskData, this.event);
      return this.checkResult(re) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.dynamic) {
      const task = taskDataIn as BaseSinglePublishTaskDynamic;
      //TODO 转换补充数据位发布接口所需的数据
      const taskData: XinlangweiboMicroArticleTaskInput = {
        taskId: task.taskId,
        contentText: task.desc,
        visible: task.visibleType === VisibleTypeEnum.public ? 0 : 1,
        images: task.images,
        proxy: task.proxy,
        cancelToken: task.cancelToken,
        mblog_statement: task.statement?.type as never,
      };
      if (task.location) {
        //地点
        taskData.location = task.location.raw as XinlangweiboLocationInfo;
      }
      if (task.prePubTime) {
        if (!this.userInfo?.yixiaoerId) {
          this.userInfo = await Xinlangweibo.getXinlangweiboUserInfo(this.cookies);
        }
        if ((this.userInfo.raw as object)['verified_type'] != 2 && (this.userInfo.raw as object)['vvip'] != 1) {
          const pri = await Xinlangweibo.getXinlangweiboSchedulePostFrequency(this.cookies);
          //定时发布
          if (pri?.data?.schedule?.residue_num) {
            taskData.schedule_timestamp = task.prePubTime;
          } else {
            return {
              code: -1,
              msg: pri.data?.edit?.residue_num
                ? '已无定时发布次数，请前往新浪微博官方平台确认。'
                : '此账号无定时发布权益，请前往新浪微博官方平台确认。',
              taskId: task.taskId,
            };
          }
        }
        taskData.schedule_timestamp = task.prePubTime;
      }

      const re = await Xinlangweibo.publishDynamic(
        this.cookies,
        Number(task.platformAccount.platformAuthorId ?? ''),
        1,
        '@' + task.platformAccount.platformAccountName ?? '',
        taskData,
        this.event,
      );
      return this.checkResult(re) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.article) {
      const task = taskDataIn as BaseSinglePublishTaskArticle;
      const taskData: XinlangweiboArticleTaskInput = {
        cancelToken: task.cancelToken,
        /**
         * 任务ID
         */
        taskId: task.taskId,

        /**
         * 发布类型
         * 0 存草稿 平台支持才有效，否则默认为发布
         * 1 发布
         */
        pubType: task.pubType ?? 1,

        // 用户id，用户信息接口中uid
        uid: parseInt(task.platformAccount.platformAuthorId ?? ''),

        // 水印位置，1:底部居右，2:底部居中，3:图片中心
        markpos: 1,

        /**
         * 水印名称，为空时表示不使用水印
         */
        nick: '',

        /**
         * 文章信息
         */
        title: task.title,

        /**
         * 文章内容 html
         */
        content: task.content,

        // 文章封面图片
        cover: task.covers[0],

        // 仅粉丝阅读全文（1表示粉丝，0表示全部）
        follow_to_read: 0,

        // 文章 导语
        summary: undefined,

        /**
         * 头条文章专栏列表，目前只支持选择一个合集
         */
        collection: undefined,

        // 推荐文章
        article_recommend: undefined,

        // 仅在rank:0公开下使用
        // 内容声明 0：无， 1：内容又AI生产， 2：内容为虚构演绎
        mblog_statement: undefined,

        //如下为微博内容

        /**
         *可见类型 10：粉丝 0：公开
         */
        rank: 0,

        /**
         * 定时发布时间 yyyy-MM-dd HH:mm
         */
        time: '',
        /**
         * 微博内容描述，当不给值时，默认按照官方规则使用文章标题拼接
         */
        contentText: '',

        /**
         * 微博话题
         */
        topics: [],

        /**
         * 1@微博好友列表
         */
        mentionedFriends: [],
        proxy: task.proxy,
      };
      if (taskDataIn.prePubTime) {
        if (!this.userInfo?.yixiaoerId) {
          this.userInfo = await Xinlangweibo.getXinlangweiboUserInfo(this.cookies);
        }

        if ((this.userInfo.raw as object)['verified_type'] != 2) {
          const pri = await Xinlangweibo.getXinlangweiboSchedulePostFrequency(this.cookies);
          //定时发布
          if (pri?.data?.schedule?.residue_num) {
            taskData.time = dayjs(task.prePubTime).format('YYYY-MM-DD HH:mm');
          } else {
            return {
              code: -1,
              msg: pri.data?.edit?.residue_num
                ? '已无定时发布次数，请前往新浪微博官方平台确认。'
                : '此账号无定时发布权益，请前往新浪微博官方平台确认。',
              taskId: task.taskId,
            };
          }
        }
        taskData.time = dayjs(task.prePubTime).format('YYYY-MM-DD HH:mm');
      }

      console.debug('微博发布数据', JSON.stringify(taskData));

      return this.checkResult(await Xinlangweibo.publishArticle(this.cookies, taskData, this.event)) as PublishResult;
    } else {
      return {
        code: errorCode.data_error,
        msg: `不支持的内容类型:${taskDataIn.publishType}`,
        taskId: taskDataIn.taskId,
      };
    }
  }

  public async checkAuditStatus(publishId: string, publishType?: PubContentEnum): Promise<AuditResult | undefined> {
    return this.checkResult(await Xinlangweibo.getXinlangweiboVideoStatus(this.cookies, publishId)) as AuditResult;
  }

  public async searchLocation(
    keyWord: string,
    nextPage: string,
    proxy?: KuaiDaiLiProxy,
  ): Promise<ListInfoResponse | undefined> {
    return this.checkResult(await Xinlangweibo.getxinlangweiboLocationList(this.cookies, keyWord, proxy));
  }

  public refreshCookie(cookie: string, localStorage?: object) {
    this.cookies = convertCookieStr(cookie, 'weibo.com');
    this.localStorage = localStorage;
  }

  public async deleteContent(docId: string, contentType?: PubContentEnum, isDraft?: boolean): Promise<BaseResult> {
    return this.checkResult(
      await Xinlangweibo.deleteXinlangweiboContent(
        this.cookies,
        docId,
        contentType ?? PubContentEnum.article,
        isDraft ?? false,
      ),
    );
  }

  public async searchTopic(keyWord: string, contentType: PubContentEnum): Promise<ListInfoResponse | undefined> {
    return this.checkResult(await Xinlangweibo.getXinlangweiboTopicList(this.cookies, keyWord));
  }

  public async getCollectionList(contentType?: PubContentEnum): Promise<BaseResult> {
    return this.checkResult(await Xinlangweibo.getXinlangweiboVideoCollectionList(this.cookies));
  }

  public async getLocationTypePrivilege(): Promise<LocationTypePrivilege | undefined> {
    if (!this.userInfo?.yixiaoerId) {
      this.userInfo = await Xinlangweibo.getXinlangweiboUserInfo(this.cookies);
    }
    if (!this.userInfo?.yixiaoerId) {
      return this.checkResult({ code: this.userInfo?.code, msg: this.userInfo?.msg });
    }

    if ((this.userInfo.raw as object)['verified_type'] != 2) {
      if ((this.userInfo.raw as object)['vvip'] === 1) {
        return {
          code: 0,
          msg: '',
          scheduled_enable: true,
        };
      }
      if ((this.userInfo.raw as object)['svip'] != 1) {
        return {
          code: 0,
          msg: '',
          scheduled_enable: false,
        };
      }
      const pri = await Xinlangweibo.getXinlangweiboSchedulePostFrequency(this.cookies);
      if (pri?.code != 0) {
        return this.checkResult({ code: pri?.code, msg: pri?.msg });
      }
      //定时发布
      if (pri?.data?.schedule?.residue_num) {
        return {
          code: 0,
          msg: '',
          scheduled_enable: true,
        };
      } else {
        return {
          code: 0,
          msg: '',
          scheduled_enable: false,
        };
      }
    } else {
      return {
        code: 0,
        msg: '',
        scheduled_enable: true,
      };
    }
  }

  public async checkUserCanPublishNum(
    createType: PubContentEnum,
    proxy?: IWebProxy,
  ): Promise<UserCanPublishNum | undefined> {
    if (createType == PubContentEnum.article) {
      const re = await Xinlangweibo.getXinLangWeiBoArticleDraftNum(this.cookies, proxy);
      if (re?.data?.remain_article_num === 0) {
        re.data.msg = '草稿箱已满，到 <微博头条文章-专栏> 删除不需要的草稿即可发布。';
      }
      return this.checkResult(re) as never;
    } else {
      return {
        code: 0,
        msg: '',
        data: { remain_article_num: 1, remain_video_num: 1, remain_total_num: 1, remain_dynamic_num: 1 },
      };
    }
  }

  public async addComment(taskParams: {
    contentId: string;
    text: string;
    commentId?: string;
    commentParentId?: string;
    commentUserId?: string;
  }): Promise<BaseResult> {
    if (!this.userInfo?.yixiaoerId) {
      await this.getUserInfo();
    }
    const result = await Xinlangweibo.addXinlangweiboComment(
      this.cookies,
      taskParams.text,
      taskParams.contentId,
      taskParams.commentId,
      taskParams.commentUserId,
    );

    return this.checkResult({
      code: result?.code ?? -1,
      msg: result?.msg,
      data: { commentId: result?.commentId ?? '' },
    });
  }

  public async delComment(delTaskPrams: { contentId: string; commentId: string }): Promise<BaseResult> {
    const re = await Xinlangweibo.delXinlangweiboComment(this.cookies, delTaskPrams.contentId, delTaskPrams.commentId);
    return this.checkResult({ code: re?.code ?? -1, msg: re?.msg });
  }

  public async digComment(digTaskPrams: { contentId: string; commentId: string }): Promise<BaseResult> {
    const re = await Xinlangweibo.digXinlangweiboComment(
      this.cookies,
      digTaskPrams.contentId,
      digTaskPrams.commentId,
      'updateLike',
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
      await Xinlangweibo.getXinlangweiboCommentByContent(
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
      await Xinlangweibo.getXinlangweiboCommentContent(this.cookies, taskParams.nextPage, taskParams.platformAuthorId),
    );
  }

  public async getConversationList(taskParams: {
    nextPage: string;
    platformAuthorId: string;
    proxy?: IWebProxy;
  }): Promise<MessageConversationListInfoResponse> {
    return this.checkResult(
      await Xinlangweibo.getWeiBoMessageConversationList(this.cookies, taskParams.platformAuthorId, taskParams.proxy),
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
      await Xinlangweibo.getWeiBoMessageListByConversation(
        this.cookies,
        taskParams.sessionId,
        '',
        taskParams.nextPage,
        taskParams.platformAuthorId,
      ),
    );
  }
  public async getConversationInfo(taskParams: {
    sessionId: string;
    secSessionId: string;
    messageUserId: string;
    platformAuthorId: string;
  }): Promise<MessageConversationListInfoResponse> {
    return this.checkResult(
      await Xinlangweibo.getWeiBOMessageConversationInfo(
        this.cookies,
        taskParams.sessionId,
        taskParams.platformAuthorId,
      ),
    );
  }

  public static msgClients: Map<string, string> = new Map<string, string>();
  public async SendMessage(taskParams: {
    sessionId: string;
    secSessionId: string;
    text: string;
    messageType: MessageType;
    imageInfo: ImageInfo;
    proxy?: IWebProxy;
    platformAuthorId: string;
  }): Promise<{ code: number; msg: string; messageId?: string }> {
    const clientId = XinLangWeiBoWorker.msgClients.get(taskParams.platformAuthorId) ?? '';
    return this.checkResult(
      await Xinlangweibo.sendWeiBoMessage(
        this.cookies,
        taskParams.sessionId,
        taskParams.messageType === MessageType.image ? 'IMAGE' : 'TEXT',
        taskParams.text,
        clientId,
        taskParams.platformAuthorId,
        taskParams.imageInfo,
        taskParams.proxy,
      ),
    ) as never;
  }

  private stopMsgService = false;
  private msgServiceRunning = false;
  private loopId = 1;

  public async createMsgService(
    task: { platformAuthorId: string },
    event: EventEmitter,
  ): Promise<{ code: number; msg: string }> {
    try {
      if (this.msgServiceRunning) {
        return { code: 0, msg: '' };
      }
      if (!task.platformAuthorId) {
        await this.getUserInfo();
        if (!this.userInfo?.yixiaoerId) {
          logger.error(`创建微博私信服务失败:${this.userInfo?.msg}`);
          return this.checkResult(this.userInfo as never) as never;
        }
        task.platformAuthorId = this.userInfo?.yixiaoerId ?? '';
      }
      if (!XinLangWeiBoWorker.msgClients.get(task.platformAuthorId)) {
        const clientRe = await Xinlangweibo.getWeiboConnectClientResponse(this.cookies);
        XinLangWeiBoWorker.msgClients.set(task.platformAuthorId, clientRe[0].clientId);
      }
      this.runMsgService(task.platformAuthorId);
      this.msgServiceRunning = true;
      this.event = event;
      return { code: 1, msg: '' };
    } catch (e) {
      return { code: 444, msg: '初始化化私信服务异常' };
    }
  }

  private async runMsgService(accountId: string): Promise<void> {
    while (!this.stopMsgService) {
      try {
        const re = await Xinlangweibo.getWeiBoNewMessageList(
          this.cookies,
          this.loopId.toString(),
          XinLangWeiBoWorker.msgClients.get(accountId) ?? '',
          accountId,
        );
        if (re.dataList) {
          this.event.emit(SyncEventName.msg_data_back, re.dataList);
        }
      } catch (e) {
        logger.error(`轮训微博私信异常${(e as Error)?.message ?? JSON.stringify(e)}`);
      } finally {
        this.loopId++;
      }
    }
    this.msgServiceRunning = false;
  }
  public async dropMsgService(): Promise<{ code: number; msg: string }> {
    try {
      this.stopMsgService = true;

      this.event?.removeAllListeners();
      return { code: 0, msg: '' };
    } catch (e) {
      return { code: 444, msg: '' };
    }
  }

  public async getPublishCategory(contentType: PubContentEnum): Promise<ListLevelInfoResponse | undefined> {
    return this.checkResult(
      contentType === 'video' ? await Xinlangweibo.getWeiboCategory(this.cookies) : { code: 445, msg: '不支持的类型' },
    );
  }
}
