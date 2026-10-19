import { BaseSinglePublishTask, BaseSinglePublishTaskArticle } from '../../model/BaseTaskFormModel';
import { PubContentEnum } from '../../model/TypeEnum';
import { BaseWorker } from './baseworker';
import {
  AuditResult,
  ListLevelInfoResponse,
  PlatformAuthorInfo,
  PublishResult,
} from '../../../media-platform/baseModel';
import { WiFi } from '@/media-platform/wifiwanneng';
import { WiFiHaoArticleTaskInput } from '@/media-platform/wifiwanneng/wifi-article';
import { BaseResult } from '@/media-platform/baseResult';
import { IWebProxy } from '@/media-platform/webproxy';
import { Wangyihao } from '@/media-platform';
import { errorCode } from '@/media-platform/errorCode';

export class WiFIWanNengWorker extends BaseWorker {
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await WiFi.getWiFiUserInfo(this.cookies, proxy);
    return this.checkResult(this.userInfo);
  }
  private checkResult(re: BaseResult): BaseResult {
    if (re?.code === 9000001 || re.msg?.includes('登录')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    if (taskDataIn.publishType == PubContentEnum.video) {
    } else if (taskDataIn.publishType === PubContentEnum.article) {
      const task = taskDataIn as BaseSinglePublishTaskArticle;
      const taskData: WiFiHaoArticleTaskInput = {
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

        /**
         * 文章内容 html
         */
        content: task.content,

        categoryId: task.category?.yixiaoerId,
        proxy: task.proxy,
      };

      return this.checkResult(await WiFi.publishArticle(this.cookies, taskData, this.event)) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.dynamic) {
      //
    }
  }

  public async checkAuditStatus(publishId: string, publishType?: PubContentEnum): Promise<AuditResult | undefined> {
    return this.checkResult(await WiFi.getWiFiArticleStatus(this.cookies, publishId)) as AuditResult;
  }

  public async deleteContent(docId: string, contentType?: PubContentEnum, isDraft?: boolean): Promise<BaseResult> {
    return this.checkResult(await WiFi.deleteWiFiArticleContent(this.cookies, docId));
  }
  public async getPublishCategory(contentType: PubContentEnum): Promise<ListLevelInfoResponse | undefined> {
    return this.checkResult(await WiFi.getWifiMediaCategory(this.cookies, contentType));
  }
}
