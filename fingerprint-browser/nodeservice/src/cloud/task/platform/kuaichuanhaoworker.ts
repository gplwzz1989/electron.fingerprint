import { BaseSinglePublishTask, BaseSinglePublishTaskArticle } from '../../model/BaseTaskFormModel';
import { ContentCreateTypeEnum, PubContentEnum } from '../../model/TypeEnum';
import { BaseWorker } from './baseworker';
import {
  AuditResult,
  PlatformAuthorInfo,
  PublishResult,
  UserCanPublishInfo,
  UserStatus,
} from '../../../media-platform/baseModel';
import { BaseResult } from '../../../media-platform/baseResult';
import { KuaiChuanHao } from '@/media-platform/kuaichuanhao/kuaichuanhao';
import { KuaiChuanHaoArticleTaskInput } from '../../../media-platform/kuaichuanhao/kuaichuanhao-article';
import { IWebProxy } from '@/media-platform/webproxy';
import { errorCode } from '@/media-platform/errorCode';

export class KuaiChuanHaoWorker extends BaseWorker {
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await KuaiChuanHao.getKuaiChuanUserInfo(this.cookies, proxy);
    return this.checkResult(this.userInfo);
  }
  private checkResult(re: BaseResult): BaseResult {
    if (re?.code === 12) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    if (taskDataIn.publishType == PubContentEnum.video) {
    } else if (taskDataIn.publishType === PubContentEnum.article) {
      const task = taskDataIn as BaseSinglePublishTaskArticle;
      const taskData: KuaiChuanHaoArticleTaskInput = {
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
        isOriginal: task.createType === ContentCreateTypeEnum.original ? 1 : 0,

        /**
         * 定时发布时间戳 13位
         */
        publishTime: task.prePubTime,

        topic: undefined,

        proxy: task.proxy,
      };

      if (task.tags?.length) {
        for (const tag of task.tags) {
          //无号，暂缓
          //taskData.topic
        }
      }

      return this.checkResult(await KuaiChuanHao.publishArticle(this.cookies, taskData, this.event)) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.dynamic) {
      //
    }
  }

  public async checkAuditStatus(publishId: string, publishType?: PubContentEnum): Promise<AuditResult | undefined> {
    return this.checkResult(await KuaiChuanHao.getKuaiChuanArticleStatus(this.cookies, publishId)) as AuditResult;
  }

  public async deleteContent(docId: string, contentType?: PubContentEnum, isDraft?: boolean): Promise<BaseResult> {
    return this.checkResult(await KuaiChuanHao.deleteKuaiChuanArticleContent(this.cookies, docId, 0));
  }

  public async checkUserCanPublish(proxy?: IWebProxy): Promise<UserCanPublishInfo | undefined> {
    const re = await this.getUserInfo(proxy);
    if (re?.code === errorCode.accountUnVerify) {
      return this.checkResult({
        code: 0,
        msg: re?.msg,
        data: { status: UserStatus.unVerify, msg: re.msg },
      }) as never;
    } else {
      return this.checkResult({
        code: re?.code ?? -1,
        msg: re?.msg,
        data: { status: UserStatus.ok, msg: '' },
      }) as never;
    }
  }
}
