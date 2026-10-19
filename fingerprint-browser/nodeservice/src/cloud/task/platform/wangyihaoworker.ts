import {
  BaseSinglePublishTask,
  BaseSinglePublishTaskArticle,
  BaseSinglePublishTaskVideo,
} from '../../model/BaseTaskFormModel';
import { ContentCreateTypeEnum, PubContentEnum } from '../../model/TypeEnum';
import {
  Douyin,
  ListLevelInfoResponse,
  PlatformAuthorInfo,
  UserCanPublishInfo,
  UserCanPublishNum,
  UserStatus,
  Wangyihao,
  WangyihaoArticleTaskInput,
  WangyiVideoCategory,
  WangyiVideoTaskInput,
} from '../../../media-platform';
import { BaseWorker } from './baseworker';
import { AuditResult, PublishResult } from '../../../media-platform/baseModel';
import dayjs from 'dayjs';
import { BaseResult } from '../../../media-platform/baseResult';
import { WangYiHaoStatementType } from '@/platform-body/video';
import { IWebProxy } from '@/media-platform/webproxy';
import { WangYiHaoUserInfoResponseData } from '@/media-platform/wangyihao/wangyihao-user.service';
import { LocationTypePrivilege } from '@/cloud/model/SearchDataModel';
import { errorCode } from '@/media-platform/errorCode';

export class WangYiHaoWorker extends BaseWorker {
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await Wangyihao.getWangyihaoUserInfo(this.cookies, proxy);
    return this.checkResult(this.userInfo);
  }
  private checkResult(re: BaseResult): BaseResult {
    if (re?.code === 100021 || re?.msg?.includes('未登录')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    if (taskDataIn.publishType == PubContentEnum.video) {
      const task = taskDataIn as BaseSinglePublishTaskVideo;

      if (!this.userInfo?.yixiaoerId) {
        await this.getUserInfo();
      }
      const taskData: WangyiVideoTaskInput = {
        taskId: task.taskId,
        pubType: task.pubType ?? 1,
        video: task.video,
        title: task.title,
        tags: task.tags,
        category:
          (task.category?.raw as WangyiVideoCategory) ?? ({ categoryName: task.category?.yixiaoerName } as never),
        subCategory:
          (task.subCategory?.raw as WangyiVideoCategory) ?? ({ categoryName: task.subCategory?.yixiaoerName } as never),
        isOriginal: task.createType == ContentCreateTypeEnum.original ? 1 : 0,
        cover: {
          width: task.covers[0].width ?? 0,
          height: task.covers[0].height ?? 0,
          pathOrUrl: task.covers[0].pathOrUrl ?? '',
          size: task.covers[0].size ?? 0,
        },
        proxy: task.proxy,
        cancelToken: task.cancelToken,
        needParts: task.needParts,
      };

      if (task.prePubTime) {
        //定时发布
        taskData.publishTime = dayjs(task.prePubTime).format('YYYY-MM-DD HH:mm:ss');
      }

      if (task.statement?.type) {
        const type = task.statement.type as WangYiHaoStatementType;
        const typeMap = {
          1: '内容由AI生成',
          2: '个人原创，仅供参考',
          3: '取材网络，谨慎辨别',
          4: '虚构演绎，仅供娱乐',
        };
        taskData.creativeStatement = typeMap[type];
      }
      Object.keys(taskData).forEach((key) => {
        if (taskData[key] === undefined || taskData[key] === '' || taskData[key] === null) {
          delete taskData[key];
        }
      });

      const re = await Wangyihao.publishVideo(
        this.cookies,
        taskData,
        this.event,
        this.userInfo?.data ? this.userInfo?.data['wemediaId'] : '' ?? '',
      );
      return this.checkResult(re) as PublishResult;
    } else if (taskDataIn.publishType === PubContentEnum.article) {
      const task = taskDataIn as BaseSinglePublishTaskArticle;
      const taskData: WangyihaoArticleTaskInput = {
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
         * 文章标题
         */
        title: task.title,

        /**
         * 文章封面
         */
        covers: task.covers,

        /**
         * 文章内容 html
         */
        content: task.content,

        /**
         * 原创申明 1:申明 0:不申明
         */
        original: undefined,

        /**
         * 定时发布时间戳 13位
         */
        publishTime: task.prePubTime,

        proxy: task.proxy,
      };
      if (task.statement?.type) {
        const type = task.statement.type as number as WangYiHaoStatementType;
        const typeMap = {
          1: '内容由AI生成',
          2: '个人原创，仅供参考',
          3: '取材网络，谨慎辨别',
          4: '虚构演绎，仅供娱乐',
        };
        taskData.creativeStatement = typeMap[type];
      }
      if (task.createType === ContentCreateTypeEnum.original) {
        taskData.original = 1;
      }

      return this.checkResult(await Wangyihao.publishArticle(this.cookies, taskData, this.event)) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.dynamic) {
      //
    }
  }

  public async checkAuditStatus(publishId: string, publishType?: PubContentEnum): Promise<AuditResult | undefined> {
    return this.checkResult(
      await Wangyihao.getWangyihaoMediaStatus(
        this.cookies,
        publishId,
        publishType === PubContentEnum.video ? 'video' : publishType === PubContentEnum.article ? 'article' : 'dynamic',
      ),
    ) as AuditResult;
  }

  public async deleteContent(docId: string, contentType?: PubContentEnum, isDraft?: boolean): Promise<BaseResult> {
    return this.checkResult(
      await Wangyihao.deleteWangyihaoContent(this.cookies, contentType ?? PubContentEnum.article, docId, '', ''),
    );
  }

  public async getPublishCategory(contentType: PubContentEnum): Promise<ListLevelInfoResponse | undefined> {
    return this.checkResult(await Wangyihao.getWangyihaoCategory(this.cookies, ''));
  }

  public async checkUserCanPublish(proxy?: IWebProxy): Promise<UserCanPublishInfo | undefined> {
    const re = await this.getUserInfo(proxy);
    if (re?.verify === false) {
      return this.checkResult({
        code: re?.code ?? -1,
        msg: re?.msg,
        data: { status: UserStatus.unRealAuth, msg: '用户未认证，请打开网易号创作中心认证后再试' },
      }) as never;
    } else {
      return this.checkResult({
        code: re?.code ?? -1,
        msg: re?.msg,
        data: { status: UserStatus.ok, msg: '' },
      }) as never;
    }
  }

  public async checkUserCanPublishNum(
    createType: PubContentEnum,
    proxy?: IWebProxy,
  ): Promise<UserCanPublishNum | undefined> {
    if (!this.userInfo?.yixiaoerId) {
      const re = await this.getUserInfo(proxy);
      if (re?.code != 0) {
        return this.checkResult({ code: re?.code ?? -1, msg: re?.msg }) as never;
      }
      this.userInfo = re;
    }

    const data = this.userInfo?.raw as WangYiHaoUserInfoResponseData;

    if (data) {
      const remainArticleNum = data.maxDailyPublishCount - data.todayPubCount;
      const remainVideoNum = data.videoMaxDailyPublishCount - data.videoTodayPubCount;
      const result = {
        code: 0,
        data: {
          remain_article_num: remainArticleNum,
          remain_video_num: remainVideoNum,
          remain_dynamic_num: 1,
        },
      };
      return this.checkResult(result) as never;
    } else {
      return this.checkResult({
        code: this.userInfo?.code ?? -1,
        msg: this.userInfo?.msg,
        data: { remain_article_num: 1, remain_video_num: 1, remain_total_num: 1, remain_dynamic_num: 1 },
      }) as never;
    }
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
    const oriInfo = this.userInfo?.raw as WangYiHaoUserInfoResponseData;
    return this.checkResult({
      code: 0,
      msg: '',
      article_original: oriInfo?.original === 2,
      video_original: oriInfo.originalVideo === 2,
    } as never) as never;
  }
}
