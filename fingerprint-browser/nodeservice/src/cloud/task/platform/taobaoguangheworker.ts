import {
  BaseSinglePublishTask,
  BaseSinglePublishTaskDynamic,
  BaseSinglePublishTaskVideo,
} from '../../model/BaseTaskFormModel';
import { PubContentEnum } from '../../model/TypeEnum';
import {
  AuditResult,
  GeoLocation,
  ListGoodsInfoResponse,
  PlatformAuthorInfo,
  PublishResult,
  TaoBaoGuangHe,
  TaoBaoGuangHePublishError,
} from '@/media-platform';
import type { TaoBaoGuangHeGoodsQueryOptions } from '@/media-platform';
import { errorCode } from '@/media-platform/errorCode';
import { BaseResult } from '@/media-platform/baseResult';
import { IWebProxy, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { LocationType } from '@/platform-body/common';
import { publishStatusEnum, SetProgressNewEvent } from '@/utils';
import { BaseWorker } from './baseworker';

/**
 * 淘宝光合网页端运行时 Worker。
 *
 * 当前支持授权后的账号识别，以及视频、图文发布。
 */
export class TaoBaoGuangHeWorker extends BaseWorker {
  private goodsPublishSession?: string;

  constructor(cookie?: string, localStorage?: object) {
    super(cookie, localStorage);
  }

  public override refreshCookie(cookie: string, localStorage?: object): void {
    super.refreshCookie(cookie, localStorage);
    this.goodsPublishSession = undefined;
  }

  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo> {
    const result = await TaoBaoGuangHe.getTaoBaoGuangHeUserInfo(this.cookies, proxy);
    const responseMessage = [result?.msg, result?.message]
      .filter((message): message is string => typeof message === 'string')
      .join(' ');
    const accountData =
      result?.data && typeof result.data === 'object' ? (result.data as Record<string, unknown>) : undefined;
    const accountId = accountData?.id ?? accountData?.userId ?? accountData?.uid;

    if (accountId !== undefined && accountId !== null && String(accountId).length > 0) {
      const accountName = accountData?.userNick ?? accountData?.nickname ?? accountData?.nickName;
      const accountAvatar = accountData?.avatar ?? accountData?.avatarUrl;
      return {
        code: errorCode.ok,
        msg: responseMessage,
        yixiaoerId: String(accountId),
        yixiaoerName: accountName == null ? '' : String(accountName),
        yixiaoerImageUrl: accountAvatar == null ? undefined : String(accountAvatar),
        raw: result,
      };
    }

    const responseCode = Number(result?.code);
    const code = Number.isFinite(responseCode) && responseCode !== 0 ? responseCode : errorCode.notLogin;
    return {
      code,
      msg: responseMessage || '淘宝光合账号信息获取失败',
      raw: result,
    };
  }

  public async checkAuditStatus(publishId: string): Promise<AuditResult> {
    if (!publishId) {
      throw new Error('publishId不能为空');
    }
    return TaoBaoGuangHe.getTaoBaoGuangHeMediaStatus(this.cookies, publishId);
  }

  public async deleteContent(docId: string): Promise<BaseResult> {
    return TaoBaoGuangHe.deleteTaoBaoGuangHeContent(this.cookies, docId);
  }

  public async getGoodsTabs(args?: object): Promise<BaseResult> {
    const options = (args ?? {}) as TaoBaoGuangHeGoodsQueryOptions;
    const result = await TaoBaoGuangHe.getTaoBaoGuangHeGoodsTabs(this.cookies, {
      ...options,
      publishSession: options.publishSession ?? this.goodsPublishSession,
    });
    this.goodsPublishSession = result.publishSession ?? this.goodsPublishSession;
    return result;
  }

  public async searchGoodsList(
    keyWord?: string,
    nextPage?: string,
    proxy?: KuaiDaiLiProxy,
    locationType?: LocationType,
    coords?: GeoLocation,
    args?: object,
  ): Promise<ListGoodsInfoResponse> {
    const options = (args ?? {}) as TaoBaoGuangHeGoodsQueryOptions;
    const result = await TaoBaoGuangHe.getTaoBaoGuangHeGoodsList(this.cookies, keyWord ?? '', nextPage ?? '', {
      ...options,
      proxy: options.proxy ?? proxy,
      publishSession: options.publishSession ?? this.goodsPublishSession,
    });
    this.goodsPublishSession = result.publishSession ?? this.goodsPublishSession;
    return result;
  }

  public async publish(taskDataIn: BaseSinglePublishTask): Promise<PublishResult | undefined> {
    const isImageText =
      taskDataIn.publishType === PubContentEnum.dynamic || taskDataIn.publishType === PubContentEnum.ImageText;
    if (taskDataIn.publishType !== PubContentEnum.video && !isImageText) {
      return { code: 444, msg: '淘宝光合暂只支持视频和图文发布', taskId: taskDataIn.taskId };
    }

    const task = taskDataIn as BaseSinglePublishTaskVideo &
      BaseSinglePublishTaskDynamic & {
        tags?: string[];
        topics?: Array<{ yixiaoerId: string; yixiaoerName: string; raw?: unknown }>;
        statement?: { type: number; forwardFrom?: string };
      };
    const contentName = isImageText ? '图文' : '视频';
    try {
      SetProgressNewEvent(this.event, publishStatusEnum.uploading, `开始发布淘宝光合${contentName}`, task.taskId);
      const result = isImageText
        ? await TaoBaoGuangHe.publishTaoBaoGuangHeImageText(this.cookies, task, {
            proxy: task.proxy,
            onStage: (stage, message) => {
              if (stage === 'upload') {
                SetProgressNewEvent(this.event, publishStatusEnum.uploading, message, task.taskId);
                return;
              }
              SetProgressNewEvent(this.event, publishStatusEnum.uploadSuccess, '图文图片上传完成', task.taskId);
              SetProgressNewEvent(this.event, publishStatusEnum.pushing, message, task.taskId);
            },
            onProgress: (uploadedParts, totalParts, message) => {
              SetProgressNewEvent(
                this.event,
                publishStatusEnum.uploading,
                message,
                task.taskId,
                totalParts,
                uploadedParts,
                false,
              );
            },
          })
        : await TaoBaoGuangHe.publishTaoBaoGuangHeVideo(this.cookies, task, {
            proxy: task.proxy,
            onStage: (stage, message) => {
              if (stage === 'upload') {
                SetProgressNewEvent(this.event, publishStatusEnum.uploading, message, task.taskId);
                return;
              }
              SetProgressNewEvent(this.event, publishStatusEnum.uploadSuccess, '视频和封面上传完成', task.taskId);
              SetProgressNewEvent(this.event, publishStatusEnum.pushing, message, task.taskId);
            },
            onProgress: (uploadedParts, totalParts, message) => {
              SetProgressNewEvent(
                this.event,
                publishStatusEnum.uploading,
                message,
                task.taskId,
                totalParts,
                uploadedParts,
                Boolean(task.needParts),
              );
            },
          });
      const scheduled = Number(task.prePubTime) > Date.now();
      if (!scheduled) {
        SetProgressNewEvent(this.event, publishStatusEnum.pushSuccess, `淘宝光合${contentName}发布成功`, task.taskId);
      }
      return {
        code: errorCode.ok,
        msg: scheduled ? '定时发布中' : '发布成功',
        taskId: task.taskId,
        publishId: result.publishId,
        scheduled,
      };
    } catch (error) {
      const publishError = error instanceof TaoBaoGuangHePublishError ? error : undefined;
      const message = error instanceof Error ? error.message : String(error ?? `淘宝光合${contentName}发布失败`);
      const code = publishError?.code ?? errorCode.data_error;
      const phase = publishError?.phase ?? 'upload';
      SetProgressNewEvent(
        this.event,
        phase === 'push' ? publishStatusEnum.pushFail : publishStatusEnum.uploadFail,
        message,
        task.taskId,
      );
      return {
        code,
        msg: message || `淘宝光合${contentName}发布失败`,
        taskId: task.taskId,
      };
    }
  }
}
