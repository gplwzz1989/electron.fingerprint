import { BaseSinglePublishTask, BaseSinglePublishTaskArticle } from '../../model/BaseTaskFormModel';
import { ContentCreateTypeEnum, PubContentEnum, VisibleTypeEnum } from '../../model/TypeEnum';
import { BaseWorker } from './baseworker';
import { AuditResult, PlatformAuthorInfo, PublishResult } from '../../../media-platform/baseModel';
import { BaseResult } from '../../../media-platform/baseResult';
import { Csdn } from '@/media-platform';
import { CSDNArticleTaskInput } from '@/media-platform/csdn/csdn-article';
import { IWebProxy } from '@/media-platform/webproxy';
import { CSDNStatement, CSDNStatementType } from '@/platform-body/video/csdn';
import { errorCode } from '@/media-platform/errorCode';
import { EventEmitter } from 'events';
import { convertCookieStr } from '@/utils';

export class CSDNWorker extends BaseWorker {
  constructor(cookie?: string, localStorage?: object, eventCallBack?: EventEmitter, domain?: string) {
    super();
    this.cookies = cookie ? convertCookieStr(cookie, domain ?? '.csdn.net', true) : '';
    this.localStorage = localStorage;
    this.domain = domain ?? '.csdn.com';
    this.event = eventCallBack ?? new EventEmitter();
  }
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await Csdn.getCSDNUserInfo(this.cookies, proxy);
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
    } else if (taskDataIn.publishType === PubContentEnum.article) {
      const task = taskDataIn as BaseSinglePublishTaskArticle;
      const taskData: CSDNArticleTaskInput = {
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

        /**
         * 文章标题
         */
        title: task.title,

        desc: task.desc,

        /**
         * 文章内容 html
         */
        content: task.content,

        /**
         * 原创申明 1:原创 2:转载 4:翻译
         */
        isOriginal:
          task.createType === ContentCreateTypeEnum.original
            ? 1
            : taskDataIn.createType === ContentCreateTypeEnum.forward
            ? 2
            : 4,

        tags: task.tags?.slice(0, 3) ?? [],

        visibleType: task.visibleType === VisibleTypeEnum.public ? VisibleTypeEnum.public : VisibleTypeEnum.private,

        originalUrl: task.contentSourceUrl,

        publishTime: task.prePubTime ?? 0,

        proxy: task.proxy,
      };

      //申明
      if (task.statement?.type) {
        taskData.creation_statement = task.statement.type as unknown as CSDNStatementType;
      }

      return this.checkResult(await Csdn.publishArticle(this.cookies, taskData, this.event)) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.dynamic) {
      //
    }
  }

  public async checkAuditStatus(publishId: string, publishType?: PubContentEnum): Promise<AuditResult | undefined> {
    return this.checkResult(await Csdn.getCSDNMediaStatus(this.cookies, publishId)) as AuditResult;
  }

  public async deleteContent(docId: string, contentType?: PubContentEnum, isDraft?: boolean): Promise<BaseResult> {
    return this.checkResult(await Csdn.deleteCSDNMediaContent(this.cookies, docId));
  }
}
