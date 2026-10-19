import {
  BaseSinglePublishTask,
  BaseSinglePublishTaskArticle,
  BaseSinglePublishTaskVideo,
} from '../../model/BaseTaskFormModel';
import { PubContentEnum } from '../../model/TypeEnum';
import {
  QiehaoVideoTaskInput,
  Qiehao,
  QiehaoArticleTaskInput,
  PlatformAuthorInfo,
  ListLevelInfoResponse,
  UserCanPublishNum,
  Wangyihao,
  UserCanPublishInfo,
  UserStatus,
} from '../../../media-platform';
import { BaseWorker } from './baseworker';
import { AuditResult, PublishResult } from '../../../media-platform/baseModel';
import { BaseResult } from '../../../media-platform/baseResult';
import { QiEHaoArticleStatementType, QiEHaoStatementType } from '@/platform-body/video';
import { IWebProxy } from '@/media-platform/webproxy';
import { WangYiHaoUserInfoResponseData } from '@/media-platform/wangyihao/wangyihao-user.service';
import { errorCode } from '@/media-platform/errorCode';

function convertToMinuteMultipleOf5(timestamp: number) {
  const date = new Date(timestamp);

  const minutes = date.getMinutes();

  let targetMinutes: number;

  targetMinutes = Math.round(minutes / 5) * 5;
  if (targetMinutes === 60) {
    date.setHours(date.getHours() + 1);
    targetMinutes = 0;
  }

  date.setMinutes(targetMinutes);
  date.setSeconds(0);
  date.setMilliseconds(0);

  return date.getTime();
}

export class QiehaoWorker extends BaseWorker {
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await Qiehao.getQiehaoUserInfo(this.cookies, proxy);
    return this.checkResult(this.userInfo);
  }
  private checkResult(re: BaseResult): BaseResult {
    if (re?.code === -10403 || re?.msg?.includes('login')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    if (taskDataIn.publishType == PubContentEnum.video) {
      const task = taskDataIn as BaseSinglePublishTaskVideo;

      const taskData: QiehaoVideoTaskInput = {
        taskId: task.taskId,
        pubType: task.pubType ?? 1,
        video: task.video,
        cover: task.covers[0],
        desc: task.desc,
        title: task.title,
        tags: task.tags ?? [],
        publishTime: parseInt((convertToMinuteMultipleOf5(task.prePubTime ?? 0) / 1000).toFixed(0)),
        category: task.category?.yixiaoerName ?? '',
        subCategory: task.subCategory?.yixiaoerName ?? '',
        proxy: task.proxy,
        cancelToken: task.cancelToken,
        needParts: task.needParts,
      };

      //自主申明
      if (task.statement?.type) {
        const enumValues = Object.values(QiEHaoStatementType).filter((v) => typeof v === 'number') as number[];
        taskData.selfDeclare = enumValues.includes(task.statement.type)
          ? (task.statement.type as QiEHaoStatementType)
          : 0;
      }
      const re = await Qiehao.publishVideo(this.cookies, taskData, this.event);
      return this.checkResult(re) as PublishResult;
    } else if (taskDataIn.publishType === PubContentEnum.article) {
      const task = taskDataIn as BaseSinglePublishTaskArticle;
      const taskData: QiehaoArticleTaskInput = {
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
         * 文章封面
         */
        covers: task.covers,

        /**
         * 文章内容 html
         */
        content: task.content,

        /**
         *  标签
         */
        tags: task.tags ?? [],

        /**
         * 原创申明 1:申明 0:不申明
         */
        original: undefined,

        /**
         * 分类
         */
        category: undefined,

        /**
         * 定时发布时间戳 10位，时间必须是5分钟的整倍
         */
        publishTime: parseInt((convertToMinuteMultipleOf5(task.prePubTime ?? 0) / 1000).toFixed(0)),

        /**
         * 代理参数
         */
        proxy: task.proxy,
      };

      //申明
      if (task.statement?.type) {
        taskData.selfDeclare = task.statement.type as QiEHaoArticleStatementType;
      }
      return this.checkResult(await Qiehao.publishArticle(this.cookies, taskData, this.event)) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.dynamic) {
      //
    }
  }

  public async checkAuditStatus(publishId: string, publishType: PubContentEnum): Promise<AuditResult | undefined> {
    switch (publishType) {
      case PubContentEnum.video:
        return this.checkResult(await Qiehao.getQiehaoVideoStatus(this.cookies, publishId)) as AuditResult;
      case PubContentEnum.article:
        return this.checkResult(await Qiehao.getQiehaoArticleStatus(this.cookies, publishId)) as AuditResult;
      case PubContentEnum.dynamic:
        return { code: 444, msg: '不支持的发布类型', publishId: publishId };
      default:
        return { code: 444, msg: '不支持的发布类型', publishId: publishId };
    }
  }

  public async deleteContent(docId: string, contentType?: PubContentEnum, isDraft?: boolean): Promise<BaseResult> {
    return this.checkResult(
      await Qiehao.deleteQiehaoContent(this.cookies, contentType ?? PubContentEnum.article, docId),
    );
  }

  public async getPublishCategory(contentType: PubContentEnum): Promise<ListLevelInfoResponse | undefined> {
    return this.checkResult(
      contentType === 'video'
        ? await Qiehao.getQiehaoVideoCategory(this.cookies)
        : contentType === 'article'
        ? await Qiehao.getQiehaoArticleCategory(this.cookies)
        : { code: 445, msg: '不支持的类型' },
    );
  }
  public async checkUserCanPublish(proxy?: IWebProxy): Promise<UserCanPublishInfo | undefined> {
    let re = this.userInfo;
    if (!re?.yixiaoerId) {
      re = await this.getUserInfo(proxy);
    }
    if (re?.raw && re?.raw['cpInfo'] && re.raw['cpInfo']['isNotRealnameAuth'] === true) {
      return this.checkResult({
        code: re?.code ?? -1,
        msg: re?.msg,
        data: { status: UserStatus.unRealAuth, msg: '账号未认证,请打开企鹅号创作者中心认证后重试' },
      } as never) as never;
    } else if (re?.raw && re?.raw['cpInfo'] && re.raw['cpInfo']['creditscore'] === 0) {
      return this.checkResult({
        code: re?.code ?? -1,
        msg: re?.msg,
        data: { status: UserStatus.ban, msg: '账号已封禁/禁言' },
      }) as never;
    } else {
      return { code: re?.code ?? -1, msg: re?.msg, data: { status: UserStatus.ok, msg: '' } };
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

    const data = this.userInfo?.raw as {
      publishData: {
        publishedCount: number;
        maxPublishCount: number;
      };
    };

    if (data) {
      const remainArticleNum = data.publishData?.maxPublishCount - data.publishData?.publishedCount;
      const remainVideoNum = remainArticleNum;
      const result = {
        code: 0,
        data: {
          remain_article_num: remainArticleNum,
          remain_video_num: remainVideoNum,
          remain_dynamic_num: 1,
          msg: '',
        },
      };
      if (remainArticleNum === 0) {
        result.data.msg = '今日发文额度已用尽';
      }
      return this.checkResult(result) as never;
    } else {
      return this.checkResult({
        code: this.userInfo?.code ?? -1,
        msg: this.userInfo?.msg,
        data: { remain_article_num: 1, remain_video_num: 1, remain_total_num: 1, remain_dynamic_num: 1 },
      }) as never;
    }
  }
}
