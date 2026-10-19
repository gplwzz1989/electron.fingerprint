import { BaseSinglePublishTask, BaseSinglePublishTaskVideo } from '../../model/BaseTaskFormModel';
import { PubContentEnum } from '../../model/TypeEnum';
import { BaseWorker } from './baseworker';
import {
  AuditResult,
  GeoLocation,
  ListItemInfo,
  PlatformAuthorInfo,
  PublishResult,
} from '../../../media-platform/baseModel';
import { BaseResult } from '../../../media-platform/baseResult';
import { Duoduoshipin, Xiaohongshu } from '../../../media-platform';
import { DuoDuoVideoTaskInput } from '../../../media-platform/duoduoshipin/duoduoshipin-video';
import { IWebProxy, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { errorCode } from '@/media-platform/errorCode';
import { LocationType } from '@/platform-body/common';

export class DuoDuoShiPinWorker extends BaseWorker {
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await Duoduoshipin.getDuoduoshipinUserInfo(this.cookies, proxy);
    return this.checkResult(this.userInfo);
  }
  private checkResult(re: BaseResult): BaseResult {
    if (re?.code === 40032 || re?.code === 40001) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    if (taskDataIn.publishType == PubContentEnum.video) {
      const task = taskDataIn as BaseSinglePublishTaskVideo;

      const taskData: DuoDuoVideoTaskInput = {
        taskId: task.taskId,
        video: task.video,
        cover: {
          width: task.covers[0].width ?? 0,
          height: task.covers[0].height ?? 0,
          pathOrUrl: task.covers[0].pathOrUrl ?? '',
          size: task.covers[0].size ?? 0,
        },
        desc: task.desc,
        publishTime: task.prePubTime,
        proxy: task.proxy,
        cancelToken: task.cancelToken,
        anchorDeclarationType: task.statement?.type,
        goodsInfo: task.shopping_cart as ListItemInfo,
        needParts: task.needParts,
      };

      const re = await Duoduoshipin.publishVideo(this.cookies, taskData, this.event);
      return this.checkResult(re) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.dynamic) {
      //
    }
  }

  public async checkAuditStatus(publishId: string): Promise<AuditResult | undefined> {
    return this.checkResult(await Duoduoshipin.getDuoDuoVideoStatus(this.cookies, publishId)) as AuditResult;
  }

  public async deleteContent(docId: string): Promise<BaseResult> {
    return this.checkResult(await Duoduoshipin.deleteDuoDuoShiPinContent(this.cookies, docId));
  }

  public async searchGoodsList(
    keyWord?: string,
    nextPage?: string,
    proxy?: KuaiDaiLiProxy,
    locationType?: LocationType,
    coords?: GeoLocation,
  ): Promise<BaseResult> {
    return this.checkResult(await Duoduoshipin.getDuoduoshipinGoodsList(this.cookies, keyWord));
  }
}
