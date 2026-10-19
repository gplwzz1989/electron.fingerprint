import { BaseSinglePublishTask, BaseSinglePublishTaskVideo } from '../../model/BaseTaskFormModel';
import { PubContentEnum } from '../../model/TypeEnum';
import { ListLevelInfoResponse, PlatformAuthorInfo, UserCanPublishInfo } from '../../../media-platform';
import { BaseWorker } from './baseworker';
import { AuditResult, PublishResult } from '../../../media-platform/baseModel';
import { FengWang } from '@/media-platform/fengwang';
import { FengWangVideoTaskInput } from '@/media-platform/fengwang/fengwang-video';
import { IWebProxy } from '@/media-platform/webproxy';
import { MeiYou } from '@/media-platform/meiyou';
import { BaseResult } from '@/media-platform/baseResult';
import { errorCode } from '@/media-platform/errorCode';

export class FengWangWorker extends BaseWorker {
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await FengWang.getFengWangUserInfo(this.cookies, proxy);
    return this.checkResult(this.userInfo);
  }
  private checkResult(re: BaseResult): BaseResult {
    if (re?.code === 403 || re.msg?.includes('登录')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    if (taskDataIn.publishType == PubContentEnum.video) {
      const task = taskDataIn as BaseSinglePublishTaskVideo;

      const taskData: FengWangVideoTaskInput = {
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
        proxy: task.proxy,
        cancelToken: task.cancelToken,
        tags: task.tags?.slice(0, 3) ?? [],
        category: task.category,
        subCategory: task.subCategory,
        needParts: task.needParts,
      };

      const re = await FengWang.publishVideo(this.cookies, taskData, this.event);
      return this.checkResult(re) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.dynamic) {
      //
    }
  }

  public async checkAuditStatus(publishId: string): Promise<AuditResult | undefined> {
    return this.checkResult(await FengWang.getFengWangMediaStatus(this.cookies, publishId)) as AuditResult;
  }

  // public async deleteContent(docId: string): Promise<BaseResult> {
  //   return await FengWang.deleteFengWangContent(this.cookies, docId);
  // }

  public async getPublishCategory(contentType: PubContentEnum): Promise<ListLevelInfoResponse | undefined> {
    return this.checkResult(
      contentType === 'video'
        ? await FengWang.getFengWangVideoCategory(this.cookies)
        : { code: 445, msg: '不支持的类型' },
    );
  }

  public async checkUserCanPublish(proxy?: IWebProxy): Promise<UserCanPublishInfo | undefined> {
    return this.checkResult(await FengWang.getFengWangUserCanPubInfo(this.cookies, proxy)) as never;
  }
}
