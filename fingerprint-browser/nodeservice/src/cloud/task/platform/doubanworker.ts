import { BaseSinglePublishTask, BaseSinglePublishTaskArticle } from '../../model/BaseTaskFormModel';
import { ContentCreateTypeEnum, PubContentEnum, VisibleTypeEnum } from '../../model/TypeEnum';
import { BaseWorker } from './baseworker';
import { AuditResult, PlatformAuthorInfo, PublishResult } from '../../../media-platform/baseModel';
import { BaseResult } from '../../../media-platform/baseResult';
import { DouBan } from '@/media-platform/douban/douban';
import { DouBanArticleTaskInput } from '@/media-platform/douban/douban-article';
import { IWebProxy } from '@/media-platform/webproxy';
import { errorCode } from '@/media-platform/errorCode';

export class DouBanWorker extends BaseWorker {
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await DouBan.getDouBanUserInfo(this.cookies, proxy);
    return this.checkResult(this.userInfo);
  }
  private checkResult(re: BaseResult): BaseResult {
    if (re?.code === 301 || re?.code === 302 || re.msg?.includes('login')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    if (taskDataIn.publishType == PubContentEnum.video) {
    } else if (taskDataIn.publishType === PubContentEnum.article) {
      const task = taskDataIn as BaseSinglePublishTaskArticle;
      const taskData: DouBanArticleTaskInput = {
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
         * 原创申明 1:申明 0:不申明
         */
        isOriginal: task.createType === ContentCreateTypeEnum.original ? 1 : 0,

        tags: task.tags?.slice(0, 5) ?? [],

        visibleType: task.visibleType === VisibleTypeEnum.public ? VisibleTypeEnum.public : VisibleTypeEnum.private,

        proxy: task.proxy,
      };

      return this.checkResult(await DouBan.publishArticle(this.cookies, taskData, this.event)) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.dynamic) {
      //
    }
  }

  public async checkAuditStatus(publishId: string, publishType?: PubContentEnum): Promise<AuditResult | undefined> {
    return this.checkResult(await DouBan.getDouBanArticleStatus(this.cookies, publishId, '')) as AuditResult;
  }

  public async deleteContent(docId: string, contentType?: PubContentEnum, isDraft?: boolean): Promise<BaseResult> {
    return this.checkResult(await DouBan.deleteDouBanArticleContent(this.cookies, docId));
  }
}
