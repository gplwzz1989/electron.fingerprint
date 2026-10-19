import { BaseSinglePublishTask, BaseSinglePublishTaskArticle } from '../../model/BaseTaskFormModel';
import { PubContentEnum } from '../../model/TypeEnum';
import { BaseWorker } from './baseworker';
import { AuditResult, PlatformAuthorInfo, PublishResult } from '../../../media-platform/baseModel';
import { BaseResult } from '../../../media-platform/baseResult';
import { JianShu } from '@/media-platform/jianshu';
import { JianShuHaoArticleTaskInput } from '@/media-platform/jianshu/jianshu-article';
import { IWebProxy } from '@/media-platform/webproxy';
import { errorCode } from '@/media-platform/errorCode';

export class JianShuHaoWorker extends BaseWorker {
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await JianShu.getJianShuUserInfo(this.cookies, proxy);
    return this.checkResult(this.userInfo);
  }
  private checkResult(re: BaseResult): BaseResult {
    if (re?.code === 301 || re.msg?.includes('登录')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    if (taskDataIn.publishType == PubContentEnum.video) {
    } else if (taskDataIn.publishType === PubContentEnum.article) {
      const task = taskDataIn as BaseSinglePublishTaskArticle;
      const taskData: JianShuHaoArticleTaskInput = {
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

        proxy: task.proxy,
      };

      return this.checkResult(await JianShu.publishArticle(this.cookies, taskData, this.event)) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.dynamic) {
      //
    }
  }

  public async checkAuditStatus(publishId: string, publishType?: PubContentEnum): Promise<AuditResult | undefined> {
    return this.checkResult(await JianShu.getJianShuArticleStatus(this.cookies, publishId)) as AuditResult;
  }

  public async deleteContent(docId: string, contentType?: PubContentEnum, isDraft?: boolean): Promise<BaseResult> {
    return this.checkResult(await JianShu.deleteJianShuArticleContent(this.cookies, docId));
  }
}
