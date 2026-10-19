import {
  BaseSinglePublishTask,
  BaseSinglePublishTaskArticle,
  BaseSinglePublishTaskVideo,
} from '../../model/BaseTaskFormModel';
import { ContentCreateTypeEnum, PubContentEnum } from '../../model/TypeEnum';
import { Douyin, ListInfoResponse, PlatformAuthorInfo } from '../../../media-platform';
import { BaseWorker } from './baseworker';
import { AuditResult, PublishResult } from '../../../media-platform/baseModel';
import { BaseResult } from '../../../media-platform/baseResult';
import { CheJiaHao } from '../../../media-platform/chejiahao';
import { CheJiaHaoVideoTaskInput } from '../../../media-platform/chejiahao/chejiahao-video';
import { CheJiaHaoArticleTaskInput } from '@/media-platform/chejiahao/chejiahao-article';
import { IWebProxy } from '@/media-platform/webproxy';
import { errorCode } from '@/media-platform/errorCode';

export class CheJiaHaoWorker extends BaseWorker {
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await CheJiaHao.getCheJiaHaoUserInfo(this.cookies, proxy);
    return this.checkResult(this.userInfo);
  }
  private checkResult(re: BaseResult): BaseResult {
    if (re?.code === 401 || re.msg?.includes('登录')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    if (taskDataIn.publishType == PubContentEnum.video) {
      const task = taskDataIn as BaseSinglePublishTaskVideo;
      const verticalCover = task.verticalCovers?.[0];

      const taskData: CheJiaHaoVideoTaskInput = {
        taskId: task.taskId,
        video: task.video,
        title: task.title,
        desc: task.desc,
        pubType: task.pubType,
        cover: {
          width: task.covers[0].width ?? 0,
          height: task.covers[0].height ?? 0,
          pathOrUrl: task.covers[0].pathOrUrl ?? '',
          size: task.covers[0].size ?? 0,
        },
        verticalCover: verticalCover
          ? {
              width: verticalCover.width ?? 0,
              height: verticalCover.height ?? 0,
              pathOrUrl: verticalCover.pathOrUrl ?? '',
              size: verticalCover.size ?? 0,
            }
          : undefined,
        publishTime: task.prePubTime,
        proxy: task.proxy,
        cancelToken: task.cancelToken,
        isOriginal: 0,
        isFirst: 0,
        needParts: task.needParts,
      };
      if (task.createType == ContentCreateTypeEnum.first) {
        taskData.isFirst = 1;
      }
      if (task.createType == ContentCreateTypeEnum.original) {
        taskData.isOriginal = 1;
      }

      return this.checkResult(await CheJiaHao.publishVideo(this.cookies, taskData, this.event)) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.article) {
      const task = taskDataIn as BaseSinglePublishTaskArticle;
      const taskData: CheJiaHaoArticleTaskInput = {
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

        covers: task.covers,

        verticalCover: task.verticalCovers?.length ? task.verticalCovers[0] : undefined,
        /**
         * 文章标题
         */
        title: task.title,

        /**
         * 文章内容 html
         */
        content: task.content,

        isOriginal: task.createType === ContentCreateTypeEnum.original ? 1 : 0,

        publishTime: task.prePubTime,

        proxy: task.proxy,
      };

      if (task.topics?.length) {
        taskData.topics = [{ type: 8, value: `${task.topics[0].yixiaoerId},0,0,0,${task.topics[0].yixiaoerName}` }];
      }

      return this.checkResult(await CheJiaHao.publishArticle(this.cookies, taskData, this.event)) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.dynamic) {
      return { code: 444, msg: '不支持的类型', taskId: taskDataIn.taskId };
    }
  }

  public async checkAuditStatus(publishId: string): Promise<AuditResult | undefined> {
    return this.checkResult(await CheJiaHao.getCheJiaHaoMediaStatus(this.cookies, publishId)) as AuditResult;
  }

  public async deleteContent(docId: string, publishType?: PubContentEnum): Promise<BaseResult> {
    return this.checkResult(await CheJiaHao.deleteCheJiaHaoContent(this.cookies, docId, publishType));
  }

  /**
   * 搜索话题
   * @param keyWord
   * @param contentType
   */
  public async searchTopic(keyWord: string, contentType: PubContentEnum): Promise<ListInfoResponse | undefined> {
    return this.checkResult(await CheJiaHao.getCheJiaHaoTopicInfo(this.cookies, keyWord));
  }
}
