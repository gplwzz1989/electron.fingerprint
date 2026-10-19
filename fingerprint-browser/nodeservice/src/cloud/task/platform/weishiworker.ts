import { BaseSinglePublishTask, BaseSinglePublishTaskVideo } from '../../model/BaseTaskFormModel';
import { PubContentEnum, VisibleTypeEnum } from '../../model/TypeEnum';
import { PlatformAuthorInfo, Tengxunweishi, WeishiVideoTaskInput } from '../../../media-platform';
import { BaseWorker } from './baseworker';
import { AuditResult, PublishResult } from '../../../media-platform/baseModel';
import { BaseResult } from '../../../media-platform/baseResult';
import { IWebProxy } from '@/media-platform/webproxy';
import { errorCode } from '@/media-platform/errorCode';

export class WeiShiWorker extends BaseWorker {
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    const per = await Tengxunweishi.getTengxunweishiAuthInfo(this.cookies, proxy);
    this.userInfo = await Tengxunweishi.getTengxunweishiUserInfo(
      this.cookies,
      per?.data?.personid?.toString() ?? '',
      proxy,
    );
    return this.checkResult(this.userInfo);
  }
  private checkResult(re: BaseResult): BaseResult {
    if (re?.code === 302 || re.code === 401 || re?.msg?.includes('登录')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    if (taskDataIn.publishType == PubContentEnum.video) {
      const task = taskDataIn as BaseSinglePublishTaskVideo;

      const taskData: WeishiVideoTaskInput = {
        taskId: task.taskId,
        visibleType: task.visibleType === VisibleTypeEnum.public ? 0 : 1,
        video: task.video,
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

      Object.keys(taskData).forEach((key) => {
        if (taskData[key] === undefined || taskData[key] === '' || taskData[key] === null) {
          delete taskData[key];
        }
      });

      const re = await Tengxunweishi.publishVideo(this.cookies, taskData, this.event);
      return this.checkResult(re) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.dynamic) {
      //
    }
  }

  public async checkAuditStatus(publishId: string): Promise<AuditResult | undefined> {
    return this.checkResult(await Tengxunweishi.getWeiShiVideoStatus(this.cookies, publishId)) as AuditResult;
  }

  public async deleteContent(docId: string): Promise<BaseResult> {
    return this.checkResult(await Tengxunweishi.deleteTengXunWeishiContent(this.cookies, docId, ''));
  }
}
