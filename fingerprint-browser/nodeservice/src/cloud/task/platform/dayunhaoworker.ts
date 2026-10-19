import {
  BaseSinglePublishTask,
  BaseSinglePublishTaskArticle,
  BaseSinglePublishTaskVideo,
} from '../../model/BaseTaskFormModel';
import { ContentCreateTypeEnum, PubContentEnum } from '../../model/TypeEnum';
import {
  Dayuhao,
  DayuhaoVideoTaskInput,
  IDayuhaoArticleData,
  PlatformAuthorInfo,
  UserCanPublishNum,
} from '../../../media-platform';
import { BaseWorker } from './baseworker';
import { AuditResult, PublishResult } from '../../../media-platform/baseModel';
import { BaseResult } from '../../../media-platform/baseResult';
import { DaYuHaoContentStatement } from '@/platform-body/video/dayuhao';
import { IWebProxy } from '@/media-platform/webproxy';
import { errorCode } from '@/media-platform/errorCode';

export class DaYuHaoWorker extends BaseWorker {
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await Dayuhao.getDayuhaoUserInfo(this.cookies, proxy);
    return this.checkResult(this.userInfo);
  }
  private checkResult(re: BaseResult): BaseResult {
    if (re.code === 401 || re?.msg?.includes('登录')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    if (taskDataIn.publishType == PubContentEnum.video) {
      const task = taskDataIn as BaseSinglePublishTaskVideo;

      const taskData: DayuhaoVideoTaskInput = {
        taskId: task.taskId,
        pubType: task.pubType ?? 1,
        video: task.video,
        title: task.title,
        desc: task.desc,
        tags: task.tags,
        isOriginal: task.createType == ContentCreateTypeEnum.original ? 1 : 0,
        categoryName: task.category?.yixiaoerName ?? '',
        cover: task.covers[0],
        publishTime: task.prePubTime,
        proxy: task.proxy,
        cancelToken: task.cancelToken,
        needParts: task.needParts,
      };

      Object.keys(taskData).forEach((key) => {
        if (taskData[key] === undefined || taskData[key] === '' || taskData[key] === null) {
          delete taskData[key];
        }
      });

      //申明
      if (task.statement?.type) {
        taskData.sourceRemark = task.statement as DaYuHaoContentStatement;
      }
      const re = await Dayuhao.publishVideo(this.cookies, taskData, this.event, '', '', '', '', '');
      return this.checkResult(re) as PublishResult;
    } else if (taskDataIn.publishType === PubContentEnum.article) {
      const task = taskDataIn as BaseSinglePublishTaskArticle;
      const taskData: IDayuhaoArticleData = {
        /**
         * 内容html
         */
        content: task.content,

        pulishId: '',

        /**
         * true:保存草稿,false:直接发布
         */
        save: task.pubType == 1 ? false : true,

        /**
         * 封面图
         */
        covers: task.covers,

        /**
         * 标题
         */
        title: task.title,

        /**
         * 定时发布时间 13位时间戳
         */
        prePubTime: task.prePubTime,
        /**
         * 任务唯一标志id
         */
        taskId: task.taskId,

        /**
         * 代理信息
         */
        proxy: task.proxy,
        cancelToken: task.cancelToken,
      };

      //申明
      if (task.statement?.type) {
        taskData.sourceRemark = task.statement as object as DaYuHaoContentStatement;
      }

      return this.checkResult(await Dayuhao.publishArticle(taskData, this.cookies, this.event)) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.dynamic) {
      //
    }
  }

  public async checkAuditStatus(publishId: string, publishType: PubContentEnum): Promise<AuditResult | undefined> {
    return this.checkResult(await Dayuhao.getDayuhaoMediaStatus(this.cookies, publishId)) as AuditResult;
  }

  public async deleteContent(docId: string, contentType?: PubContentEnum, isDraft?: boolean): Promise<BaseResult> {
    return this.checkResult(
      await Dayuhao.deleteDayuhaooContent(this.cookies, contentType ?? PubContentEnum.article, docId),
    );
  }
  //allowPublishNum
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
      allowPublishNum: number;
    };

    if (data) {
      const remainArticleNum = data.allowPublishNum;
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
        result.data.msg = '今日剩余:0篇';
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
