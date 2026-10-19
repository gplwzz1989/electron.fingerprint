import { BaseWorker } from './baseworker';
import {
  BaseSinglePublishTask,
  BaseSinglePublishTaskDynamic,
  BaseSinglePublishTaskVideo,
} from '@/cloud/model/BaseTaskFormModel';
import {
  AuditResult,
  GeoLocation,
  ListInfoResponse,
  PlatformAuthorInfo,
  PublishResult,
} from '@/media-platform/baseModel';
import {
  getRedNoteLocationList,
  getRedNoteGroupList,
  getRedNoteMediaStatus,
  getRedNoteMentionUserList,
  getRedNoteTopicList,
  getRedNoteUserInfo,
  publishRedNoteDynamic,
  publishRedNoteVideo,
  toRedNoteDynamicPublishInput,
  toRedNoteVideoPublishInput,
} from '@/media-platform/rednote';
import { IWebProxy, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { PubContentEnum } from '@/cloud/model/TypeEnum';
import { AxiosError } from 'axios';
import { errorCode } from '@/media-platform/errorCode';

export class RedNoteWorker extends BaseWorker {
  constructor(cookie?: string, localStorage?: object) {
    super(cookie, localStorage, undefined, 'rednote.com');
  }

  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo> {
    return getRedNoteUserInfo(this.cookies, proxy);
  }

  public async publish(taskData: BaseSinglePublishTask): Promise<PublishResult> {
    if (taskData.publishType === PubContentEnum.video) {
      return publishRedNoteVideo(
        this.cookies,
        toRedNoteVideoPublishInput(taskData as BaseSinglePublishTaskVideo),
        this.event,
      );
    }
    if (taskData.publishType !== PubContentEnum.dynamic && taskData.publishType !== PubContentEnum.ImageText) {
      return {
        code: errorCode.data_error,
        msg: `RedNote不支持的内容类型:${taskData.publishType}`,
        taskId: taskData.taskId,
      };
    }
    const input = toRedNoteDynamicPublishInput(taskData as BaseSinglePublishTaskDynamic);
    return publishRedNoteDynamic(this.cookies, input, this.event);
  }

  public async checkAuditStatus(publishId: string, _publishType?: PubContentEnum): Promise<AuditResult> {
    return getRedNoteMediaStatus(this.cookies, publishId);
  }

  private toSearchError(error: unknown): ListInfoResponse {
    if (error instanceof AxiosError) {
      return { code: errorCode.request_error, msg: error.message, dataList: [] };
    }
    if (error instanceof Error) {
      return { code: errorCode.data_error, msg: error.message, dataList: [] };
    }
    return { code: errorCode.unknown_error, msg: String(error ?? ''), dataList: [] };
  }

  public async searchTopic(
    keyWord: string,
    _contentType: PubContentEnum,
    _categoryId?: string,
  ): Promise<ListInfoResponse> {
    try {
      return await getRedNoteTopicList(this.cookies, keyWord);
    } catch (error) {
      return this.toSearchError(error);
    }
  }

  public async searchLocation(
    keyWord: string,
    nextPage: string,
    proxy?: KuaiDaiLiProxy,
    _locationType?: Parameters<BaseWorker['searchLocation']>[3],
    coords?: GeoLocation,
  ): Promise<ListInfoResponse> {
    try {
      const parsedPage = Number.parseInt(nextPage, 10);
      const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
      return await getRedNoteLocationList(this.cookies, keyWord, page, proxy, coords);
    } catch (error) {
      return this.toSearchError(error);
    }
  }

  public async searchUserInfoList(keyWord: string): Promise<ListInfoResponse> {
    try {
      return await getRedNoteMentionUserList(this.cookies, keyWord);
    } catch (error) {
      return this.toSearchError(error);
    }
  }

  public async getGroupList(args?: { proxy?: IWebProxy }): Promise<ListInfoResponse> {
    try {
      return await getRedNoteGroupList(this.cookies, args?.proxy);
    } catch (error) {
      return this.toSearchError(error);
    }
  }
}
