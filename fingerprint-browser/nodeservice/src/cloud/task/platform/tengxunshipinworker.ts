import { BaseSinglePublishTask, BaseSinglePublishTaskVideo } from '../../model/BaseTaskFormModel';
import { PubContentEnum } from '../../model/TypeEnum';
import { BaseWorker } from './baseworker';
import { AuditResult, PlatformAuthorInfo, PublishResult } from '../../../media-platform/baseModel';
import { BaseResult } from '../../../media-platform/baseResult';
import { TengXunShiPinVideoTaskInput } from '../../../media-platform/tengxunshipin/tengxunshipin-video';
import { Tengxunshipin } from '../../../media-platform';
import { TengXunShiPinTopicInfo } from '../../../media-platform/tengxunshipin/tengxunshipin-topic.service';
import { TengXunShiPinStatementType } from '@/platform-body/video/tengxunshipin';
import { IWebProxy } from '@/media-platform/webproxy';
import { errorCode } from '@/media-platform/errorCode';

export class TengXunShiPinWorker extends BaseWorker {
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await Tengxunshipin.getTengxunshipinUserInfo(this.cookies, proxy);
    return this.checkResult(this.userInfo);
  }
  private checkResult(re: BaseResult): BaseResult {
    if ((re && re?.code != 0 && re.code != -1) || re.msg?.includes('登录')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    if (taskDataIn.publishType == PubContentEnum.video) {
      const task = taskDataIn as BaseSinglePublishTaskVideo;

      const taskData: TengXunShiPinVideoTaskInput = {
        taskId: task.taskId,
        pubType: task.pubType,
        video: task.video,
        title: task.title,
        cover: {
          width: task.covers[0].width ?? 0,
          height: task.covers[0].height ?? 0,
          pathOrUrl: task.covers[0].pathOrUrl ?? '',
          size: task.covers[0].size ?? 0,
        },
        prePubTime: task.prePubTime,
        proxy: task.proxy,
        cancelToken: task.cancelToken,
        needParts: task.needParts,
      };

      if (task.tags?.length) {
        const tagText = task.tags[0];
        const topicTmp = await Tengxunshipin.searchTengXunShiPinTopicList(this.cookies, tagText);
        if (topicTmp?.dataList?.length) {
          taskData.topics = [topicTmp.dataList[0].raw as TengXunShiPinTopicInfo];
        }
      }

      //申明
      if (task.statement?.type) {
        taskData.claimSource = task.statement.type as TengXunShiPinStatementType;
      }

      const re = await Tengxunshipin.publishVideo(this.cookies, taskData, this.event);
      return this.checkResult(re) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.dynamic) {
      //
    }
  }

  public async checkAuditStatus(publishId: string): Promise<AuditResult | undefined> {
    return this.checkResult(await Tengxunshipin.getTengXunShiPinVideoStatus(this.cookies, publishId)) as AuditResult;
  }

  public async deleteContent(docId: string): Promise<BaseResult> {
    return this.checkResult(await Tengxunshipin.deleteTengXunShiPinContent(this.cookies, docId));
  }
}
