import { BaseSinglePublishTask, BaseSinglePublishTaskVideo } from '../../model/BaseTaskFormModel';
import { PubContentEnum, VisibleTypeEnum } from '../../model/TypeEnum';
import { GeoLocation, ListInfoResponse, PlatformAuthorInfo } from '../../../media-platform';
import { BaseWorker } from './baseworker';
import { AuditResult, PublishResult } from '../../../media-platform/baseModel';
import { DeWu } from '@/media-platform/dewu';
import { DeWuVideoTaskInput } from '@/media-platform/dewu/dewu-video';
import { BaseResult } from '@/media-platform/baseResult';
import { IWebProxy, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { LocationType } from '@/platform-body/common';
import { DeWuContentStatement } from '@/platform-body/video/dewu';
import { errorCode } from '@/media-platform/errorCode';

export class DeWuWorker extends BaseWorker {
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await DeWu.getDeWuUserInfo(this.cookies, proxy);
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
      const task = taskDataIn as BaseSinglePublishTaskVideo;

      const taskData: DeWuVideoTaskInput = {
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
        proxy: task.proxy,
        cancelToken: task.cancelToken,
        location: task.location,
        visibleType: task.visibleType === VisibleTypeEnum.private ? 1 : 0,
        goodsList: task.shopping_cart as never,
        needParts: task.needParts,
      };

      //申明
      if (task.statement?.type) {
        const statement = task.statement as DeWuContentStatement;
        taskData.userClaim = statement.type;
      }
      const re = await DeWu.publishVideo(this.cookies, taskData, this.event);
      return this.checkResult(re) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.dynamic) {
      //
    }
  }

  public async checkAuditStatus(publishId: string): Promise<AuditResult | undefined> {
    return (await DeWu.getDeWuMediaStatus(this.cookies, publishId)) as AuditResult;
  }

  public async deleteContent(docId: string): Promise<BaseResult> {
    return await DeWu.deleteDeWuContent(this.cookies, docId);
  }

  public async searchLocation(
    keyWord: string,
    nextPage: string,
    proxy?: KuaiDaiLiProxy,
    locationType?: LocationType,
    coords?: GeoLocation,
  ): Promise<ListInfoResponse | undefined> {
    return await DeWu.getDeWuLocation(this.cookies, keyWord, proxy, coords);
  }
  public async searchTopic(keyWord: string, contentType: PubContentEnum): Promise<ListInfoResponse | undefined> {
    const re = await DeWu.getDeWuTopics(this.cookies, keyWord);
    return this.checkResult(re);
  }
  public async searchGoodsList(
    keyWord?: string,
    nextPage?: string,
    proxy?: KuaiDaiLiProxy,
    locationType?: LocationType,
    coords?: GeoLocation,
  ): Promise<BaseResult> {
    return this.checkResult(await DeWu.getDeWuGoodsList(this.cookies, keyWord ?? ''));
  }
}
