import { BaseSinglePublishTask, BaseSinglePublishTaskVideo } from '../../model/BaseTaskFormModel';
import { PubContentEnum } from '../../model/TypeEnum';
import { PlatformAuthorInfo, UserCanPublishInfo, UserStatus } from '../../../media-platform';
import { BaseWorker } from './baseworker';
import { AuditResult, PublishResult } from '../../../media-platform/baseModel';
import { BaseResult } from '../../../media-platform/baseResult';
import { MeiYou } from '@/media-platform/meiyou';
import { MeiYouVideoTaskInput } from '@/media-platform/meiyou/meiyou-video';
import { IWebProxy } from '@/media-platform/webproxy';
import { convertCookieStr } from '@/utils';
import { EventEmitter } from 'events';
import { errorCode } from '@/media-platform/errorCode';

export class MeiYouWorker extends BaseWorker {
  constructor(cookie?: string, localStorage?: object, eventCallBack?: EventEmitter, domain?: string) {
    super(cookie, localStorage);
    this.cookies = this.cookies.replace('expireTime=', 'expireTimeOld=');
    this.cookies = `${this.cookies};expireTime=${new Date('2200-10-10').getTime()}`;
  }
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    this.userInfo = await MeiYou.getMeiYouUserInfo(this.cookies, proxy);
    return this.checkResult(this.userInfo);
  }
  private checkResult(re: BaseResult): BaseResult {
    if (re?.code === 1001 || re.msg?.includes('登录')) {
      re.code = errorCode.loginExpire;
    }
    return re;
  }
  /**
   * 处理cookie
   * @param cookie
   * @param localStorage
   */
  public refreshCookie(cookie: string, localStorage?: object) {
    this.cookies = convertCookieStr(cookie, this.domain);
    this.cookies = this.cookies.replace('expireTime=', 'expireTimeOld=');
    this.cookies = `${this.cookies};expireTime=${new Date('2200-10-10').getTime()}`;
    this.localStorage = localStorage;
  }

  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    if (taskDataIn.publishType == PubContentEnum.video) {
      const task = taskDataIn as BaseSinglePublishTaskVideo;

      const taskData: MeiYouVideoTaskInput = {
        taskId: task.taskId,
        video: task.video,
        title: task.title,
        cover: {
          width: task.covers[0].width ?? 0,
          height: task.covers[0].height ?? 0,
          pathOrUrl: task.covers[0].pathOrUrl,
          size: task.covers[0].size ?? 0,
        },
        publishTime: task.prePubTime,
        proxy: task.proxy,
        cancelToken: task.cancelToken,
        needParts: task.needParts,
      };

      const re = await MeiYou.publishVideo(this.cookies, taskData, this.event);
      return this.checkResult(re) as PublishResult;
    } else if (taskDataIn.publishType == PubContentEnum.dynamic) {
      //
    }
  }

  public async checkAuditStatus(publishId: string, publishType?: PubContentEnum): Promise<AuditResult | undefined> {
    return this.checkResult(await MeiYou.getMeiYouMediaStatus(this.cookies, publishId, publishType)) as AuditResult;
  }

  public async deleteContent(docId: string): Promise<BaseResult> {
    return this.checkResult(await MeiYou.deleteMeiYouContent(this.cookies, docId));
  }
  public async checkUserCanPublish(proxy?: IWebProxy): Promise<UserCanPublishInfo | undefined> {
    return this.checkResult(await MeiYou.getMeiYouUserCAanPubInfo(this.cookies, proxy)) as never;
  }
}
