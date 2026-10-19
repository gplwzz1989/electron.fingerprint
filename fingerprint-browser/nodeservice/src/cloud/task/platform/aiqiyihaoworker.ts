import {
  BaseSinglePublishTask,
  BaseSinglePublishTaskArticle,
  BaseSinglePublishTaskVideo,
} from '../../model/BaseTaskFormModel';
import { ContentCreateTypeEnum, PubContentEnum } from '../../model/TypeEnum';
import {
  Aiqiyi,
  AiqiyiArticleTaskInput,
  AiqiyiVideoTaskInput,
  ListLevelInfoResponse,
  PlatformAuthorInfo,
} from '../../../media-platform';
import { BaseWorker } from './baseworker';
import { AuditResult, PublishResult } from '../../../media-platform/baseModel';
import { AiqiyiCategoryInfo } from '../../../media-platform/aiqiyi/aiqiyi-category.service';
import { BaseResult } from '@/media-platform/baseResult';
import { AiQiYiStatementType } from '@/platform-body/video';
import { IWebProxy } from '@/media-platform/webproxy';
import { errorCode } from '@/media-platform/errorCode';

export class AiqiyiHaoWorker extends BaseWorker {
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await Aiqiyi.getAiqiyiUserInfo(this.cookies, proxy);
    return this.checkResult(this.userInfo);
  }
  private checkResult(re: BaseResult): BaseResult {
    if (re?.code === 401 || re?.msg?.startsWith('Invalid')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    if (taskDataIn.publishType == PubContentEnum.video) {
      const task = taskDataIn as BaseSinglePublishTaskVideo;
      const verticalCover = task.verticalCovers?.[0];

      const taskData: AiqiyiVideoTaskInput = {
        taskId: task.taskId,
        pubType: task.pubType ?? 1,
        video: task.video,
        title: task.title,
        desc: task.desc,
        isOriginal: task.createType == ContentCreateTypeEnum.original ? 1 : 0,
        cover: {
          width: task.covers[0].width ?? 0,
          height: task.covers[0].height ?? 0,
          pathOrUrl: task.covers[0].pathOrUrl ?? '',
          size: task.covers[0].size ?? 0,
        },
        tags: task.tags ?? [],
        publishTime: task.prePubTime,
        category: task.category?.raw as AiqiyiCategoryInfo,
        proxy: task.proxy,
        cancelToken: task.cancelToken,
        needParts: task.needParts,
        verticalCover: verticalCover
          ? {
              width: verticalCover.width ?? 0,
              height: verticalCover.height ?? 0,
              pathOrUrl: verticalCover.pathOrUrl ?? '',
              size: verticalCover.size ?? 0,
            }
          : undefined,
      };

      if (task.statement?.type !== undefined && task.statement?.type !== null) {
        taskData.uploadStatement = task.statement.type as AiQiYiStatementType;
      }
      Object.keys(taskData).forEach((key) => {
        if (taskData[key] === undefined || taskData[key] === '' || taskData[key] === null) {
          delete taskData[key];
        }
      });

      const re = await Aiqiyi.publishVideo(this.cookies, taskData, this.event);
      return this.checkResult(re) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.article) {
      const task = taskDataIn as BaseSinglePublishTaskArticle;
      const taskData: AiqiyiArticleTaskInput = {
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
         * 文章内容 html
         */
        content: task.content,

        /**
         * 代理参数
         */
        proxy: task.proxy,
      };

      return this.checkResult(await Aiqiyi.publishArticle(this.cookies, taskData, this.event)) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.dynamic) {
      //
    }
  }

  public async checkAuditStatus(
    publishId: string,
    publishType: PubContentEnum,
    title?: string,
  ): Promise<AuditResult | undefined> {
    switch (publishType) {
      case PubContentEnum.video:
        return this.checkResult(await Aiqiyi.getAiqiyiVideoStatus(this.cookies, publishId)) as AuditResult;
      case PubContentEnum.article:
        return this.checkResult(await Aiqiyi.getAiqiyiArticleStatus(this.cookies, publishId, 5, title)) as AuditResult;
      default:
        return { code: 444, msg: '不支持的发布类型', publishId: publishId };
    }
  }

  public async deleteContent(docId: string, contentType?: PubContentEnum, isDraft?: boolean): Promise<BaseResult> {
    return this.checkResult(
      await Aiqiyi.deleteAiqiyiContent(this.cookies, contentType ?? PubContentEnum.video, docId, isDraft ?? false),
    );
  }

  public async getPublishCategory(contentType: PubContentEnum): Promise<ListLevelInfoResponse | undefined> {
    return this.checkResult(
      contentType === PubContentEnum.video
        ? await Aiqiyi.getAiqiYiVideoCategory(this.cookies)
        : { code: 445, msg: '不支持的类型' },
    );
  }
}
