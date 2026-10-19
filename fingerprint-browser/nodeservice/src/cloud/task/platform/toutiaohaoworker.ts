import {
  BaseSinglePublishTask,
  BaseSinglePublishTaskArticle,
  BaseSinglePublishTaskDynamic,
  BaseSinglePublishTaskVideo,
} from '../../model/BaseTaskFormModel';
import { ContentCreateTypeEnum, PubContentEnum, VisibleTypeEnum } from '../../model/TypeEnum';
import {
  Douyin,
  GeoLocation,
  ListInfoResponse,
  ListItemInfo,
  PlatformAuthorInfo,
  Toutiaohao,
  ToutiaohaoArticleTaskInput,
  ToutiaohaoMiniVideoTaskInput,
  ToutiaohaoVideoTaskInput,
  UserCanPublishInfo,
  Xinlangweibo,
} from '../../../media-platform';
import { BaseWorker } from './baseworker';
import { AuditResult, PublishResult } from '../../../media-platform/baseModel';
import dayjs from 'dayjs';
import { BaseResult } from '@/media-platform/baseResult';
import { TouTiaoStatementType } from '@/platform-body/video';
import { TouTiaoDynamicTaskInput } from '@/media-platform/toutiaohao/toutiaohao-dynamic';
import { IWebProxy, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { LocationTypePrivilege } from '@/cloud/model/SearchDataModel';
import { LocationType } from '@/platform-body/common';
import { errorCode } from '@/media-platform/errorCode';

export class TouTiaoHaoWorker extends BaseWorker {
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await Toutiaohao.getToutiaohaoUserInfo(this.cookies, proxy);
    return this.checkResult(this.userInfo);
  }
  private checkResult(re: BaseResult): BaseResult {
    if (re?.code === 100004 || re?.msg?.includes('login')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    if (taskDataIn.publishType == PubContentEnum.video) {
      const task = taskDataIn as BaseSinglePublishTaskVideo;
      if (task.video.width >= task.video.height) {
        const taskData: ToutiaohaoVideoTaskInput = {
          taskId: task.taskId,
          video: task.video,
          cover: {
            width: task.covers[0].width ?? 0,
            height: task.covers[0].height ?? 0,
            pathOrUrl: task.covers[0].pathOrUrl ?? '',
            size: task.covers[0].size ?? 0,
          },
          pubType: task.pubType ?? 1,
          desc: task.desc,
          title: task.title,
          tags: task.tags ?? [],
          topics: task.topics?.map((topic) => topic.yixiaoerName).filter(Boolean) ?? [],
          original: task.createType == ContentCreateTypeEnum.original,
          visibilityType: task.visibleType == VisibleTypeEnum.public ? 0 : 1,
          proxy: task.proxy,
          cancelToken: task.cancelToken,
          needParts: task.needParts,
        };
        if (task.location) {
          //地点
        }
        if (task.prePubTime) {
          //定时发布
          taskData.publishTime = dayjs(task.prePubTime).format('YYYY-MM-DD HH:mm:ss');
        }
        if (task.category) {
          //分类
        }
        //申明
        if (task.statement?.type) {
          taskData.complianceInfo = {
            complianceType: task.statement.type as TouTiaoStatementType,
          };
        }

        const re = await Toutiaohao.publishVideo(this.cookies, taskData, this.event);
        return this.checkResult(re) as PublishResult;
      } else {
        const taskData: ToutiaohaoMiniVideoTaskInput = {
          taskId: task.taskId,
          video: task.video,
          cover: {
            width: task.covers[0].width ?? 0,
            height: task.covers[0].height ?? 0,
            pathOrUrl: task.covers[0].pathOrUrl ?? '',
            size: task.covers[0].size ?? 0,
          },
          title: task.title,
          proxy: task.proxy,
          cancelToken: task.cancelToken,
        };
        if (task.location) {
          //地点
        }

        if (task.category) {
          //分类
        }
        //申明
        if (task.statement?.type) {
          taskData.complianceInfo = {
            complianceType: task.statement.type as TouTiaoStatementType,
          };
        }

        const re = await Toutiaohao.publishMiniVideo(this.cookies, taskData, this.event);
        return this.checkResult(re) as PublishResult;
      }
    } else if (taskDataIn.publishType == PubContentEnum.article) {
      const task = taskDataIn as BaseSinglePublishTaskArticle;
      const taskData: ToutiaohaoArticleTaskInput = {
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

        /**
         * 文章信息
         */
        title: task.title,

        /**
         * 多标题
         */
        multiTitle: undefined,

        /**
         * 文章封面
         */
        covers: task.covers,

        /**
         * 文章内容 html
         */
        content: task.content,

        /**
         * 位置
         */
        location: {
          city: task.locationKeyword!,
          city_code: '',
        },

        /**
         * 广告类型 3投放广告赚收益，2不投放广告
         */
        adType: task['advertisement'] ?? 2,

        /**
         * 原创申明 1:申明 0:不申明
         */
        original: undefined,

        /**
         * 合集ID
         */
        collectionId: undefined,

        /**
         * 同步微头条 1:同步 0:不同步
         */
        tuwen_wtt_trans_flag: undefined,

        /**
         * 信息来源 （4取材网络，1引用站内，5个人观点，3AI生成）
         * 个人观点   5
         * 取材网络  4
         * 引用ai  3
         * 虚构演绎  6
         * 投资观点 7
         * 健康  8
         */
        infoSource: undefined,

        /**
         * 来源链接
         */
        sourceLink: undefined,

        /**
         * 时间
         */
        timeFormat: undefined,

        /**
         * 地点
         */
        sourcePosition: undefined,

        /**
         *定时发布时间,精确到分钟，2025-04-17 14:09
         */
        publishTime: task.prePubTime ? dayjs(task.prePubTime).format('YYYY-MM-DD HH:mm:ss') : undefined,

        /**
         * 允许赞赏 1:允许 0:不允许
         */
        praise: undefined,

        /**
         * 是否独家首发 1:独家/首发 0:非独家  需原创内容，且72小时内只能在头条发布
         */
        claimExclusive: task.isFirst! ? 1 : 0,

        /**
         * 外链链接
         */
        externLink: undefined,
        proxy: task.proxy,
      };
      if (task.statement?.type) {
        switch (task.statement.type) {
          case 1:
            taskData.infoSource = 4;
            break;
          case 2:
            taskData.infoSource = 5;
            break;
          case 3:
            taskData.infoSource = 3;
            break;
          case 6:
            taskData.infoSource = 6;
            break;
          case 7:
            taskData.infoSource = 7;
            break;
          case 8:
            taskData.infoSource = 8;
            break;
          default:
            break;
        }
      }

      //城市
      if (task.location?.yixiaoerId) {
        taskData.location = { city: task.location.yixiaoerName, city_code: task.location.yixiaoerId };
      }
      console.debug('头条号发布文章数据', taskData);
      const re = await Toutiaohao.publishArticle(this.cookies, taskData, this.event);
      return this.checkResult(re) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.dynamic) {
      const task = taskDataIn as BaseSinglePublishTaskDynamic;
      const taskData: TouTiaoDynamicTaskInput = {
        taskId: task.taskId,
        desc: task.desc,
        proxy: task.proxy,
        images: task.images,
        cancelToken: task.cancelToken,
        pubType: task.pubType,
      };
      if (task.statement?.type) {
        switch (task.statement.type as number) {
          case 1:
            taskData.infoSource = 4;
            break;
          case 2:
            taskData.infoSource = 5;
            break;
          case 3:
            taskData.infoSource = 3;
            break;
          case 6:
            taskData.infoSource = 6;
            break;
          case 7:
            taskData.infoSource = 7;
            break;
          case 8:
            taskData.infoSource = 8;
            break;
          default:
            break;
        }
      }
      const re = await Toutiaohao.publishDynamic(this.cookies, taskData, this.event);
      return this.checkResult(re) as PublishResult;
    }
  }

  public async checkAuditStatus(publishId: string, publishType?: PubContentEnum): Promise<AuditResult | undefined> {
    console.debug('头条号审核状态查询', publishId, publishType);
    switch (publishType) {
      case PubContentEnum.video:
        return this.checkResult(await Toutiaohao.getToutiaohaoVideoStatus(this.cookies, publishId)) as AuditResult;
      case PubContentEnum.article:
        return this.checkResult(await Toutiaohao.getToutiaohaoArticleStatus(this.cookies, publishId)) as AuditResult;
      case PubContentEnum.dynamic:
        return this.checkResult(
          await Toutiaohao.getToutiaohaoDynamicStatus(this.cookies, publishId, ''),
        ) as AuditResult;
      default:
        return { code: 444, msg: '不支持的发布类型', publishId: publishId };
    }
  }

  public async deleteContent(docId: string, contentType?: PubContentEnum, isDraft?: boolean): Promise<BaseResult> {
    return this.checkResult(
      await Toutiaohao.deleteToutiaohaoContent(this.cookies, contentType ?? PubContentEnum.article, docId),
    );
  }

  public async checkUserCanPublish(proxy?: IWebProxy): Promise<UserCanPublishInfo | undefined> {
    return this.checkResult(await Toutiaohao.getTouTiaoUserCanPubInfo(this.cookies, proxy)) as never;
  }

  public async getLocationTypePrivilege(): Promise<LocationTypePrivilege | undefined> {
    if (!this.userInfo?.yixiaoerId) {
      await this.getUserInfo();
    }
    if (!this.userInfo?.yixiaoerId) {
      return this.checkResult({ code: this.userInfo?.code ?? -1, msg: this.userInfo?.msg });
    }
    if (this.userInfo.raw && this.userInfo.raw['media']) {
      if (this.userInfo.raw['media']['has_ad_permission'] != undefined) {
        return { code: 0, has_ad_permission: this.userInfo.raw['media']['has_ad_permission'] };
      }
    }
    return { code: this.userInfo?.code ?? -1, msg: this.userInfo?.msg };
  }

  public static toutiaoCityList: object;
  public async searchLocation(
    keyWord: string,
    nextPage: string,
    proxy?: KuaiDaiLiProxy,
    locationType?: LocationType,
    coords?: GeoLocation,
    city?: ListItemInfo,
  ): Promise<ListInfoResponse | undefined> {
    if (TouTiaoHaoWorker.toutiaoCityList && TouTiaoHaoWorker.toutiaoCityList['dataList']?.length > 10) {
      return TouTiaoHaoWorker.toutiaoCityList as ListInfoResponse;
    }
    const re = await Toutiaohao.getToutiaohaoArticleLocationList(this.cookies, proxy as never);
    if (re.dataList?.length && re.dataList?.length > 10) {
      TouTiaoHaoWorker.toutiaoCityList = re;
    }
    return this.checkResult(re);
  }
}
