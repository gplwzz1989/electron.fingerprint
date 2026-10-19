import { BaseSinglePublishTask, BaseSinglePublishTaskVideo } from '../../model/BaseTaskFormModel';
import { PubContentEnum, VisibleTypeEnum } from '../../model/TypeEnum';
import { BaseWorker } from './baseworker';
import { AuditResult, PlatformAuthorInfo, PublishResult } from '../../../media-platform/baseModel';
import { BaseResult } from '../../../media-platform/baseResult';
import { SouHuShiPinVideoTaskInput } from '../../../../src/media-platform/souhushipin/souhushipin-video';
import { SouHuShiPin } from '../../../../src/media-platform/souhushipin';
import { SouHuShiPinContentStatement } from '@/platform-body/video/sohushipin';
import { IWebProxy } from '@/media-platform/webproxy';
import { errorCode } from '@/media-platform/errorCode';

export class SouHuShiPinWorker extends BaseWorker {
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await SouHuShiPin.getSouHuShiPinUserInfo(this.cookies, proxy);
    return this.checkResult(this.userInfo);
  }
  private checkResult(re: BaseResult): BaseResult {
    if (re?.code == 302 || re.msg?.includes('登录')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    if (taskDataIn.publishType == PubContentEnum.video) {
      const task = taskDataIn as BaseSinglePublishTaskVideo;

      const taskData: SouHuShiPinVideoTaskInput = {
        taskId: task.taskId,
        pubType: task.pubType ?? 1,
        visibleType: task.visibleType === VisibleTypeEnum.public ? 0 : 3,
        video: task.video,
        title: task.title,
        desc: task.desc,
        cover: {
          width: task.covers[0].width ?? 0,
          height: task.covers[0].height ?? 0,
          pathOrUrl: task.covers[0].pathOrUrl ?? '',
          size: task.covers[0].size ?? 0,
        },
        proxy: task.proxy,
        cancelToken: task.cancelToken,
        tags: task.tags,
        needParts: task.needParts,
      };
      //申明
      if (task.statement?.type) {
        taskData.contentMark = task.statement as SouHuShiPinContentStatement;
      }
      const re = await SouHuShiPin.publishVideo(this.cookies, taskData, this.event);
      return this.checkResult(re) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.dynamic) {
      //
    }
  }

  public async checkAuditStatus(publishId: string): Promise<AuditResult | undefined> {
    return this.checkResult(await SouHuShiPin.getSouHuShiPinVideoStatus(this.cookies, publishId)) as AuditResult;
  }

  public async deleteContent(docId: string): Promise<BaseResult> {
    return this.checkResult(await SouHuShiPin.deleteSouhushipinContent(this.cookies, docId, ''));
  }
}
