import { BaseSinglePublishTask, BaseSinglePublishTaskVideo } from '../../model/BaseTaskFormModel';
import { PubContentEnum } from '../../model/TypeEnum';
import { ListLevelInfoResponse, PlatformAuthorInfo } from '../../../media-platform';
import { BaseWorker } from './baseworker';
import { AuditResult, PublishResult } from '../../../media-platform/baseModel';
import { BaseResult } from '../../../media-platform/baseResult';

import { MeiPaiVideoTaskInput } from '@/media-platform/meipai/meipai-video';
import { MeiPaiCategoryInfo } from '@/media-platform/meipai/meipai-category-service';
import { MeiPai } from '@/media-platform/meipai';
import { IWebProxy } from '@/media-platform/webproxy';
import { errorCode } from '@/media-platform/errorCode';

export class MeiPaiWorker extends BaseWorker {
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await MeiPai.getMeiPaiUserInfo(this.cookies, proxy);
    return this.checkResult(this.userInfo);
  }
  private checkResult(re: BaseResult): BaseResult {
    if (re?.code === 10001) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    if (taskDataIn.publishType == PubContentEnum.video) {
      const task = taskDataIn as BaseSinglePublishTaskVideo;

      const taskData: MeiPaiVideoTaskInput = {
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
        needParts: task.needParts,
      };

      if (task.category) {
        taskData.category =
          (task.category?.raw as MeiPaiCategoryInfo) ?? ((task.category?.raw as object)['raw'] as MeiPaiCategoryInfo);
      }
      if (task.subCategory) {
        taskData.subcategory =
          (task.subCategory?.raw as MeiPaiCategoryInfo) ??
          ((task.subCategory?.raw as object)['raw'] as MeiPaiCategoryInfo);
      }
      const re = await MeiPai.publishVideo(this.cookies, taskData, this.event);
      return this.checkResult(re) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.dynamic) {
      //
    }
  }

  public async checkAuditStatus(publishId: string): Promise<AuditResult | undefined> {
    return this.checkResult(await MeiPai.getMeiPaiVideoStatus(this.cookies, publishId)) as AuditResult;
  }

  public async deleteContent(docId: string): Promise<BaseResult> {
    return this.checkResult(await MeiPai.deleteMeiPaiShiPinContent(this.cookies, docId));
  }

  public async getPublishCategory(contentType: PubContentEnum): Promise<ListLevelInfoResponse | undefined> {
    return this.checkResult(
      contentType === 'video' ? await MeiPai.getMeiPaiVideoCategory(this.cookies) : { code: 445, msg: '不支持的类型' },
    );
  }
}
