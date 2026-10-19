import {
  BaseSinglePublishTask,
  BaseSinglePublishTaskArticle,
  BaseSinglePublishTaskVideo,
} from '../../model/BaseTaskFormModel';
import { ContentCreateTypeEnum, PubContentEnum } from '../../model/TypeEnum';
import { Azhan, ListLevelInfoResponse, PlatformAuthorInfo } from '../../../media-platform';
import { BaseWorker } from './baseworker';
import { AuditResult, PublishResult } from '../../../media-platform/baseModel';
import { BaseResult } from '../../../media-platform/baseResult';
import { AZhanVideoTaskInput } from '../../../media-platform/azhan/azhan-video';
import { AZhanVideoCategoryInfo } from '../../../media-platform/azhan/azhan-category.service';
import { AZhanArticleTaskInput } from '@/media-platform/azhan/azhan-article';
import { IWebProxy } from '@/media-platform/webproxy';
import { errorCode } from '@/media-platform/errorCode';

export class AZhanWorker extends BaseWorker {
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await Azhan.getAzhanUserInfo(this.cookies, proxy);
    return this.checkResult(this.userInfo);
  }
  private checkResult(re: BaseResult): BaseResult {
    if (re?.code == 401 || re.msg?.includes('登录')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    if (taskDataIn.publishType == PubContentEnum.video) {
      const task = taskDataIn as BaseSinglePublishTaskVideo;

      if (!task.category?.yixiaoerId && !task.category?.yixiaoerName) {
        return { taskId: task.taskId, code: -1, msg: '分类不能为空', errorInfo: '分类不能为空' };
      }
      const taskData: AZhanVideoTaskInput = {
        taskId: task.taskId,
        video: task.video,
        title: task.title,
        desc: task.desc,
        cover: {
          width: task.covers[0].width ?? 0,
          height: task.covers[0].height ?? 0,
          pathOrUrl: task.covers[0].pathOrUrl ?? '',
          size: task.covers[0].size ?? 0,
        },
        publishTime: task.prePubTime,
        isOriginal: task.createType === ContentCreateTypeEnum.original ? 1 : 0,
        forwardLinkUrl: '',
        tags: task.tags ?? [],
        category:
          (task.category?.raw as AZhanVideoCategoryInfo) ??
          ((task.category?.raw as object)['raw'] as AZhanVideoCategoryInfo),
        subcategory:
          (task.subCategory?.raw as AZhanVideoCategoryInfo) ??
          ((task.subCategory?.raw as object)['raw'] as AZhanVideoCategoryInfo),
        proxy: task.proxy,
        cancelToken: task.cancelToken,
        needParts: task.needParts,
      };

      const re = await Azhan.publishVideo(this.cookies, taskData, this.event);
      return this.checkResult(re) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.article) {
      const task = taskDataIn as BaseSinglePublishTaskArticle;

      if (!task.category?.yixiaoerId) {
        return { taskId: task.taskId, code: -1, msg: '分类不能为空', errorInfo: '分类不能为空' };
      }
      const taskData: AZhanArticleTaskInput = {
        taskId: task.taskId,
        title: task.title,
        desc: task.desc,
        covers: task.covers,
        content: task.content,
        isOriginal: task.createType === ContentCreateTypeEnum.original ? 1 : 0,
        tags: task.tags?.slice(0, 6) ?? [],
        categoryId: task.category.yixiaoerId,
        subCategoryId: task.subCategory?.yixiaoerId ?? '',
        proxy: task.proxy,
        cancelToken: task.cancelToken,
      };

      const re = await Azhan.publishArticle(this.cookies, taskData, this.event);
      return this.checkResult(re) as PublishResult;
    }
  }

  public async checkAuditStatus(publishId: string, publishType?: PubContentEnum): Promise<AuditResult | undefined> {
    return this.checkResult(await Azhan.getAZhanMediaStatus(this.cookies, publishId, publishType)) as AuditResult;
  }

  public async deleteContent(docId: string, contentType?: PubContentEnum): Promise<BaseResult> {
    return this.checkResult(await Azhan.deleteAZhanMediaContent(this.cookies, docId, contentType));
  }

  public async getPublishCategory(contentType: PubContentEnum): Promise<ListLevelInfoResponse | undefined> {
    return await Azhan.getAZhanMediaCategory(this.cookies, contentType);
  }
}
