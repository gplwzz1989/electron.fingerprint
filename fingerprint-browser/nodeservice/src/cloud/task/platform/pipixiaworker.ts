import { BaseSinglePublishTask, BaseSinglePublishTaskVideo } from '../../model/BaseTaskFormModel';
import { PubContentEnum } from '../../model/TypeEnum';
import { BaseWorker } from './baseworker';
import { AuditResult, ListInfoResponse, PlatformAuthorInfo, PublishResult } from '../../../media-platform/baseModel';
import { PiPiXiaVideoTaskInput } from '../../../media-platform/pipixia/pipixia-video';
import { Pipixia } from '../../../media-platform';
import { IWebProxy } from '@/media-platform/webproxy';
import { BaseResult } from '@/media-platform/baseResult';
import { errorCode } from '@/media-platform/errorCode';
import { EventEmitter } from 'events';
import { convertCookieStr } from '@/utils';
import type { PiPiXiaVideoPlatformBody } from '@/platform-body/video/pipixia';

export class PiPiXiaWorker extends BaseWorker {
  constructor(cookie?: string, localStorage?: object, eventCallBack?: EventEmitter, domain?: string) {
    super(cookie, localStorage, eventCallBack, 'pipix.com');
    this.cookies = cookie ? convertCookieStr(cookie, domain ?? 'pipix.com') : '';
    this.localStorage = localStorage;
    this.domain = domain ?? 'pipix.com';
    this.event = eventCallBack ?? new EventEmitter();
  }
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await Pipixia.getPiPiXiaUserInfo(this.cookies, proxy);
    return this.checkResult(this.userInfo);
  }
  private checkResult(re: BaseResult): BaseResult {
    if (re.msg?.includes('login')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    if (taskDataIn.publishType == PubContentEnum.video) {
      const task = taskDataIn as BaseSinglePublishTaskVideo & PiPiXiaVideoPlatformBody;

      const taskData: PiPiXiaVideoTaskInput = {
        taskId: task.taskId,
        video: task.video,
        desc: task.desc,
        topic: task.topic,
        cover: {
          width: task.covers[0].width ?? 0,
          height: task.covers[0].height ?? 0,
          pathOrUrl: task.covers[0].pathOrUrl ?? '',
          size: task.covers[0].size ?? 0,
        },
        proxy: task.proxy,
        cancelToken: task.cancelToken,
        needParts: task.needParts,
      };

      const re = await Pipixia.publishVideo(this.cookies, taskData, this.event);
      return this.checkResult(re) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.dynamic) {
      //
    }
  }

  public async checkAuditStatus(publishId: string): Promise<AuditResult | undefined> {
    return this.checkResult(await Pipixia.getPiPiXiaVideoStatus(this.cookies, publishId)) as AuditResult;
  }

  public async searchTopic(keyWord: string, contentType: PubContentEnum): Promise<ListInfoResponse | undefined> {
    return this.checkResult(await Pipixia.getPipixiaTopics(this.cookies, keyWord)) as ListInfoResponse;
  }

  //皮皮虾目前官方删除不可用，暂无支持
  // public async deleteContent(docId: string): Promise<BaseResult> {
  //
  // }
}
