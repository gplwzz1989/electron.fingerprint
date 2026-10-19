import { BaseSinglePublishTask, BaseSinglePublishTaskArticle } from '../../model/BaseTaskFormModel';
import { PubContentEnum, VisibleTypeEnum } from '../../model/TypeEnum';
import { BaseWorker } from './baseworker';
import { AuditResult, PlatformAuthorInfo, PublishResult } from '../../../media-platform/baseModel';
import { BaseResult } from '../../../media-platform/baseResult';
import { XueQiuHaoArticleTaskInput } from '../../../media-platform/xueqiuhao/xueqiuhao-article';
import { Xueqiuhao } from '@/media-platform';
import { IWebProxy } from '@/media-platform/webproxy';
import { errorCode } from '@/media-platform/errorCode';

export class XueQiuHaoWorker extends BaseWorker {
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await Xueqiuhao.getXueqiuhaoUserInfo(this.cookies, proxy);
    return this.checkResult(this.userInfo);
  }
  private checkResult(re: BaseResult): BaseResult {
    if (re.msg?.includes('登录')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    if (taskDataIn.publishType == PubContentEnum.video) {
      return { code: 404, msg: '不支持的类型', taskId: '' };
    } else if (taskDataIn.publishType === PubContentEnum.article) {
      const task = taskDataIn as BaseSinglePublishTaskArticle;
      const taskData: XueQiuHaoArticleTaskInput = {
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
         * 定时发布时间戳 13位
         */
        publishTime: task.prePubTime,

        is_private: task.visibleType == VisibleTypeEnum.private,

        proxy: task.proxy,
      };

      //申明
      if (task.statement?.type) {
        taskData.ai_disclose = 301;
      }

      return this.checkResult(await Xueqiuhao.publishArticle(this.cookies, taskData, this.event)) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.dynamic) {
      //
    }
  }

  public async checkAuditStatus(publishId: string, publishType?: PubContentEnum): Promise<AuditResult | undefined> {
    return this.checkResult(await Xueqiuhao.getXueQiuArticleStatus(this.cookies, publishId)) as AuditResult;
  }

  public async deleteContent(docId: string, contentType?: PubContentEnum, isDraft?: boolean): Promise<BaseResult> {
    return this.checkResult(await Xueqiuhao.deleteXueQiuArticleContent(this.cookies, docId, isDraft ?? false));
  }
}
