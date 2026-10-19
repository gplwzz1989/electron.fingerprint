import {
  BaseSinglePublishTask,
  BaseSinglePublishTaskArticle,
  BaseSinglePublishTaskAudio,
  BaseSinglePublishTaskDynamic,
  BaseSinglePublishTaskVideo,
  OpenPlatformTaskSet,
  PlatformAccountInfo,
} from '../model/BaseTaskFormModel';
import { BackStagesEnum, BackStageStatusEnum, CallBackDataEvent, PubContentEnum } from '../model/TypeEnum';
import { EventEmitter } from 'events';
import { PushingScheduledTask } from '../schedule-service/schedule/pushing/pushing';
import { normalizePlatformCode, PlatformCodeInput, Platforms } from '../../service/datasync-service-manager';
import { DouYinWorker } from '../task/platform/douyinworker';
import { BaseWorker } from '../task/platform/baseworker';
import { auditStatusEnum, convertCookieStr, Guid, isJson, logger, publishStatusEnum, Random, Task } from '@/utils';
import { createHttpInstance } from '@/http';
import {
  AuditResult,
  CheckAndPublishInput,
  GeoLocation,
  ListGoodsInfoResponse,
  ListInfoResponse,
  ListLevelInfoResponse,
  ListMusicInfoResponse,
  PlatformAuthorInfo,
  PublishResult,
  UserCanPublishInfo,
  UserCanPublishNum,
  UserStatus,
} from '../../media-platform/baseModel';
import { errorCode } from '../../media-platform/errorCode';
import { QueryStateScheduledTask } from '../schedule-service/schedule/query-state/query-state';
import { KuaiShouWorker } from '../task/platform/kuaishouworker';
import crypto from 'crypto';
import { Readable } from 'stream';
import { PubConfig } from '@/Config';
import path from 'path';
import fs from 'fs';
import { BiliBiliWorker } from '../task/platform/bilibiliworker';
import { XinLangWeiBoWorker } from '../task/platform/xinlangweoboworker';
import { XiaoHongShuWorker } from '../task/platform/xiaohongshuworker';
import { ShiPinHaoWorker } from '../task/platform/shipinhaoworker';
import { BaiJiaHaoWorker } from '../task/platform/baijiahaoworker';
import { TouTiaoHaoWorker } from '../task/platform/toutiaohaoworker';
import { AiqiyiHaoWorker } from './platform/aiqiyihaoworker';
import { DaYuHaoWorker } from './platform/dayunhaoworker';
import { QiehaoWorker } from './platform/qiehaoworker';
import { SouHuHaoWorker } from './platform/souhuhaoworkder';
import { WeiShiWorker } from './platform/weishiworker';
import { WangYiHaoWorker } from './platform/wangyihaoworker';
import { YiDianHaoWorker } from './platform/yidianhaoworker';
import { ZhihuWorker } from './platform/zhihuworker';
import { AccountService } from '@/service/account-browser-service';
import { PlatformAccountInfoResponse } from '../model/UIFormModel';
import { eventBus } from '@/event/eventBus';
import { AxiosError } from 'axios';
import { BaseResult } from '../../media-platform/baseResult';
import { CancelToken } from '@/utils/CancelToken';
import { PiPiXiaWorker } from './platform/pipixiaworker';
import { IWebProxy, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { TengXunShiPinWorker } from './platform/tengxunshipinworker';
import { DuoDuoShiPinWorker } from './platform/duoduoshipinworker';
import { AZhanWorker } from './platform/azhanworker';
import { MeiPaiWorker } from './platform/meipaiworker';
import { AccountContentListViewOutPut, DataService, syncContentEventName } from '../../media-platform/data-service';
import { KuaiChuanHaoWorker } from './platform/kuaichuanhaoworker';
import { XueQiuHaoWorker } from './platform/xueqiuhaoworker';
import { SouHuShiPinWorker } from './platform/souhushipinworker';
import { PlatformTask, PlatformTaskSet } from '@/platform-body/platform-task';
import {
  CheckGoodsParams,
  LocationTypePrivilege,
  SearchLocationParams,
  ShoppingPrivilege,
} from '@/cloud/model/SearchDataModel';
import { XiaoHongShuShopWorker } from './platform/xiaohongshushopworker';
import { XiaoHongShuHomeWorker } from './platform/xiaohongshuhomeworker';
import { MeiYouWorker } from './platform/meiyouworker';
import { CheJiaHaoWorker } from './platform/chejiahaoworker';
import { WeiXinGongZhongHaoWorker } from './platform/weixingongzhonghaoworker';
import { WeiXinQrCode } from '@/media-platform/weixingongzhonghao/weixingongzhonghao-article';
import { YiCheHaoWorker } from './platform/yichehaoworker';
import { DongCheHaoWorker } from './platform/dongchehaoworker';
import { FengWangWorker } from './platform/fengwangworker';
import { DouBanWorker } from './platform/doubanworker';
import { CSDNWorker } from './platform/csdnworker';
import { DeWuWorker } from './platform/dewuworker';
import { JianShuHaoWorker } from './platform/jianshuworker';
import { WiFIWanNengWorker } from './platform/wifiwannengworker';
import { LocationType } from '@/platform-body/common';
import { AIDouBaoWorker } from './platform/ai_doubaoworker';
import {
  AIChatAttachmentParseResponse,
  AIChatConversationListResponse,
  AIChatMessageListResponse,
} from '../../ai-platform/interfaces';
import { AIDeepSeekWorker } from '@/cloud/task/platform/ai_deepseekworker';
import { WeiXinGongZhongHaoVideoContentItem } from '@/platform-body/video/weixingongzhonghao';
import { TaoBaoGuangHeWorker } from './platform/taobaoguangheworker';
import { RedNoteWorker } from '@/cloud/task/platform/rednoteworker';
import { XimalayaWorker } from '@/cloud/task/platform/ximalayaworker';

const $http = createHttpInstance();

const taskCancelCache: { [key: string]: CancelToken | null } = {};

export const globalPublishEvent = new EventEmitter();

export type PublishFeedbackHandler = (data: Record<string, unknown>) => void | Promise<void>;

export type LocalOpenPlatformTaskSet = Omit<OpenPlatformTaskSet, 'authorization'> & {
  authorization?: string;
};

/**
 * 推送发布任务集
 * @param taskFormData
 * @param authorization  回调开放平台需要的鉴权token
 */
export const pushOpenPlatformPublishTask = async (
  taskFormData: OpenPlatformTaskSet,
  authorization: string,
): Promise<string | undefined> => {
  if (authorization) {
    taskFormData.authorization = authorization;
  }
  if (!taskFormData.authorization) {
    return '回调auth参数不能为空';
  }
  return enqueueOpenPlatformPublishTask(taskFormData);
};

/**
 * 接收来自桌面端本机 Socket 的发布任务。
 * 本机入口不需要开放平台回调鉴权，发布事件通过 feedbackHandler 原路返回。
 */
export const pushLocalPublishTask = async (
  taskFormData: LocalOpenPlatformTaskSet,
  feedbackHandler: PublishFeedbackHandler,
): Promise<string | undefined> => {
  if (typeof feedbackHandler !== 'function') {
    return '本机Socket回传函数不能为空';
  }

  const localTaskFormData: OpenPlatformTaskSet = {
    ...taskFormData,
    authorization: '',
  };
  const error = await enqueueOpenPlatformPublishTask(localTaskFormData, feedbackHandler);
  taskFormData.taskSetId = localTaskFormData.taskSetId;
  return error;
};

/**
 * 发布任务公共入队流程。鉴权和回传渠道由公开入口决定。
 */
const enqueueOpenPlatformPublishTask = async (
  taskFormData: OpenPlatformTaskSet,
  feedbackHandler?: PublishFeedbackHandler,
): Promise<string | undefined> => {
  try {
    logger.error(`接收到发布任务数:${taskFormData?.tasks?.length}`);
    // if (!taskFormData?.authToken) {
    //   return '鉴权token不能为空';
    // }
    if (!taskFormData.publishType) {
      return '发布类型不能为空';
    }
    if (!taskFormData?.tasks?.length) {
      return '任务数据不能为空';
    }

    taskFormData.taskSetId = Guid.NewGuid().toString();

    for (const taskItem of taskFormData.tasks) {
      const openPlatAuthorInfo = taskFormData.platform.find((x) => x.id === taskItem.authorInfo.id);
      if (!openPlatAuthorInfo) {
        logger.error(`任务:${taskItem.taskId},未匹配到媒体号:${taskItem.authorInfo.id}信息`);
      } else {
        taskItem.authorInfo.cookie = openPlatAuthorInfo.platformCookie;
        taskItem.authorInfo.authorId = openPlatAuthorInfo.platformUserId;
        taskItem.authorInfo.authorName = openPlatAuthorInfo.platformUserName;
        taskItem.authorInfo.platform = openPlatAuthorInfo.platformCode;
        if (
          [Platforms.DouYin, Platforms.XiaoHongShuShangJiaHao].includes(openPlatAuthorInfo.platformCode) &&
          openPlatAuthorInfo.platformLocalStorage
        ) {
          taskItem.publishData['localStorage'] =
            typeof openPlatAuthorInfo.platformLocalStorage == 'string' &&
            openPlatAuthorInfo.platformLocalStorage?.includes('{')
              ? JSON.parse(openPlatAuthorInfo.platformLocalStorage)
              : openPlatAuthorInfo.platformLocalStorage;
        }
      }
      PubConfig.pushingSchedulerService.push(
        new PushingScheduledTask(
          taskItem.taskId,
          `${taskItem.authorInfo.platform}:${taskItem.authorInfo.authorId}`,
          async () => {
            try {
              await new PlatformWorker(taskFormData, taskItem, feedbackHandler).publish();
            } finally {
              eventBus.emit('publishFinished', taskItem.taskId);
            }
          },
        ),
      );
      if (taskFormData.publishType === PubContentEnum.video) {
        const url = ((taskItem.publishData as BaseSinglePublishTaskVideo)?.video as object)['url'];
        if (url) {
          if (!Downloader.inUseFile[url]) {
            Downloader.inUseFile[url] = [taskItem.taskId];
          } else {
            Downloader.inUseFile[url].push(taskItem.taskId);
          }
        }
      }
    }
    return undefined;
  } catch (error) {
    return '拆分任务异常失败' + error?.toString();
  }
};

/**
 * 完成发布验证并使用原始发布数据恢复发布
 */
export const checkAndPublish = async (
  input: CheckAndPublishInput,
): Promise<{ code: number; msg: string; accepted?: boolean }> => {
  if (!input?.taskId || !input?.checkStr || !input?.postData) {
    return { code: 400, msg: '发布恢复数据不完整' };
  }
  if (!['video', 'dynamic'].includes(input.publishType)) {
    return { code: 400, msg: '当前发布类型不支持恢复发布' };
  }
  if (!input.account?.id || !input.account?.cookie || !input.callback?.authorization) {
    return { code: 400, msg: '账号或回调信息不完整' };
  }
  const verifyType = input.verifyType === ('sms' as never) ? 'smscode' : input.verifyType;
  if (verifyType === 'password' && !input.password) {
    return { code: 400, msg: '密码不能为空' };
  }
  if (verifyType === 'smscode' && !/^\d{6}$/.test(input.codeNumber ?? '')) {
    return { code: 400, msg: '短信验证码必须是6位数字' };
  }
  if (!['password', 'smscode'].includes(verifyType)) {
    return { code: 400, msg: '不支持的验证方式' };
  }

  const taskSet = {
    publishType: input.publishType,
    authorization: input.callback.authorization,
    callBackData: input.callback.callBackData ?? {},
    publishChannel: '',
    clientId: '',
    tasks: [],
  } as PlatformTaskSet;
  const singleTask = {
    taskId: input.taskId,
    authorInfo: {
      id: input.account.id,
      platform: Platforms.DouYin,
      cookie: convertCookieStr(input.account.cookie),
      authorId: '',
      proxy: input.account.proxy as IWebProxy,
    },
    publishData: {},
  } as PlatformTask;
  return new PlatformWorker(taskSet, singleTask).checkAndPublish({ ...input, verifyType });
};

/**
 * 根据子任务taskId取消正在推送的任务
 * @param taskId
 */
export const cancelPublishTask = (taskId: string): BaseResult => {
  try {
    let re = PubConfig.pushingSchedulerService.remove(taskId);
    const cancelToken = taskCancelCache[taskId];
    if (cancelToken) {
      re = cancelToken.cancel();
    }
    return { code: re ? 0 : -1, msg: re ? '' : '已无法取消' };
  } catch (e) {
    let errMsg = '';
    if (e instanceof AxiosError) {
      errMsg = `网络异常:${e.message}`;
    } else if (e instanceof Error) {
      errMsg = e.message;
    } else {
      errMsg = `${e?.toString() ?? ''}`;
    }
    logger.error(`取消推送异常: ${taskId} ${errMsg}`);
    return { code: -1, msg: errMsg };
  }
};

export const checkAuditStatus = async (
  platform: PlatformCodeInput,
  accountResponse: PlatformAccountInfoResponse,
  taskId: string,
  publishId: string,
  publishType: PubContentEnum,
  authToken?: string,
  authorization?: string,
) => {
  const worker = new QueryWorker(authToken ?? PubConfig.API_Token, platform, {
    ...accountResponse,
    cookie: accountResponse.cookie ?? '',
    authorization: authorization,
  });
  // logger.error(
  //   `KEY:${authToken ?? PubConfig.API_Token},账号信息:${JSON.stringify({ ...accountResponse, cookie: '' })}`,
  // );
  return worker.checkAuditStatus(taskId, publishId, 99, publishType);
};

export const getPublishingTasks = (): string[] => {
  return PubConfig.pushingSchedulerService.getAllTasks();
};

/**
 * 开放平台发布类
 */
class PlatformWorker {
  /**
   * 发布实例，根据平台参数进行实例化对应的
   * @private
   */
  private worker: BaseWorker;

  /**
   * 转换后的task
   * @private
   */
  private task: BaseSinglePublishTask;

  constructor(
    private taskSet: PlatformTaskSet,
    private singleTask: PlatformTask,
    private feedbackHandler?: PublishFeedbackHandler,
  ) {
    this.task = {} as BaseSinglePublishTask;
    this.worker = new BaseWorker();
    switch (this.singleTask.authorInfo.platform) {
      case Platforms.DouYin:
        this.worker = new DouYinWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.KuaiShou:
        this.worker = new KuaiShouWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.BiLiBiLi:
        this.worker = new BiliBiliWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.XinLangWeiBo:
        this.worker = new XinLangWeiBoWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.XiaoHongShu:
        this.worker = new XiaoHongShuWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.RedNote:
        this.worker = new RedNoteWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.ShiPinHao:
        this.worker = new ShiPinHaoWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.BaiJiaHao:
        this.worker = new BaiJiaHaoWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.TouTiaoHao:
        this.worker = new TouTiaoHaoWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.AiQiYi:
        this.worker = new AiqiyiHaoWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.DaYuHao:
        this.worker = new DaYuHaoWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.QiEHao:
        this.worker = new QiehaoWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.SouHuHao:
        this.worker = new SouHuHaoWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.TengXunWeiShi:
        this.worker = new WeiShiWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.WangYiHao:
        this.worker = new WangYiHaoWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.YiDianHao:
        this.worker = new YiDianHaoWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.ZhiHu:
        this.worker = new ZhihuWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.SouHuShiPin:
        this.worker = new SouHuShiPinWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.PiPiXia:
        this.worker = new PiPiXiaWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.TengXunShiPin:
        this.worker = new TengXunShiPinWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.DuoDuoShiPin:
        this.worker = new DuoDuoShiPinWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.AcFun:
        this.worker = new AZhanWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.MeiPai:
        this.worker = new MeiPaiWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.KuaiChuanHao:
        this.worker = new KuaiChuanHaoWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.XueQiuHao:
        this.worker = new XueQiuHaoWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.XiaoHongShuShangJiaHao:
        this.worker = new XiaoHongShuShopWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.MeiYou:
        this.worker = new MeiYouWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.CheJiaHao:
        this.worker = new CheJiaHaoWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.WeiXinGongZhongHao:
        this.worker = new WeiXinGongZhongHaoWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.YiCheHao:
        this.worker = new YiCheHaoWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.DongCheHao:
        this.worker = new DongCheHaoWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.FengWang:
        this.worker = new FengWangWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.DouBan:
        this.worker = new DouBanWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.CSDN:
        this.worker = new CSDNWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.DeWu:
        this.worker = new DeWuWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.JianShu:
        this.worker = new JianShuHaoWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.WiFiWanNengYaoShi:
        this.worker = new WiFIWanNengWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.TaoBaoGuangHe:
        this.worker = new TaoBaoGuangHeWorker(singleTask.authorInfo.cookie, undefined);
        break;
      case Platforms.Ximalaya:
        this.worker = new XimalayaWorker(singleTask.authorInfo.cookie, undefined);
        break;
      default:
        logger.error(`不支持的平台:${singleTask.authorInfo.platform}`);
        //throw new Error('不支持的平台');
        break;
    }
    //进度监控，是否需要回传，按需修改
    this.worker?.event?.on('progress', this.postBackPublishProcess.bind(this));
    if (this.singleTask.authorInfo.platform === Platforms.WeiXinGongZhongHao) {
      //公众号扫码事件
      this.worker?.event?.on('qrCode', this.postBackQrCode.bind(this));
    }
  }

  /**
   * 开始发布任务
   */
  public async publish(): Promise<PublishResult | undefined> {
    let videoPath: string = '';
    let downVideoResult: DownloadResult | null = null;
    try {
      if (!this.singleTask?.authorInfo?.platform || !this.singleTask?.authorInfo?.cookie) {
        await this.postBackPublishProcess(
          publishStatusEnum.uploadFail,
          `任务:${this.singleTask?.taskId},未匹配到媒体号:${this.singleTask?.authorInfo?.id}信息`,
          this.singleTask?.taskId,
        );
        logger.error(`${JSON.stringify(this.taskSet)}-${JSON.stringify(this.singleTask)}`);
        return undefined;
      }
      //缓存任务id
      const cancelToken = new CancelToken();
      taskCancelCache[this.singleTask.taskId] = cancelToken;

      //取消任务推送
      if (cancelToken.cancelledValue) {
        await this.postBackPublishProcess(publishStatusEnum.uploadFail, CancelToken.cancelMsg, this.singleTask.taskId);
        return undefined;
      }
      //获取cookie等凭据

      if (!this.worker) {
        await this.postBackPublishProcess(
          publishStatusEnum.uploadFail,
          `不支持的平台:${this.singleTask.authorInfo.platform}`,
          this.singleTask.taskId,
        );
        return undefined;
      }
      if (this.taskSet.publishType === PubContentEnum.video) {
        //取消任务推送
        if (cancelToken.cancelledValue) {
          await this.postBackPublishProcess(
            publishStatusEnum.uploadFail,
            CancelToken.cancelMsg,
            this.singleTask.taskId,
          );
          return undefined;
        }

        const transTask = {
          ...this.singleTask.publishData,
          taskId: this.singleTask.taskId,
          platform: this.singleTask.authorInfo.platform,
          publishType: this.taskSet.publishType as PubContentEnum,
          ...(this.taskSet.isAppContent === true ? { isAppContent: true } : {}),
          needParts: this.taskSet.need_parts_back,
          platformAccount: {
            platformAccountId: this.singleTask.authorInfo.id,
            platformAuthorId: this.singleTask.authorInfo?.authorId,
            platformAccountName: this.singleTask.authorInfo?.authorName,
            cookie: this.singleTask.authorInfo.cookie,
            authorization: this.taskSet.authorization,
            callBackData: this.taskSet.callBackData,
          },
          proxy: this.singleTask.authorInfo.proxy,
        } as BaseSinglePublishTaskVideo;
        if (!transTask) {
          await this.postBackPublishProcess(
            publishStatusEnum.uploadFail,
            `不支持的平台/类型:${this.singleTask.authorInfo.platform}`,
            this.singleTask.taskId,
          );
          return undefined;
        }
        transTask.video.localPath = transTask?.video?.localPath ? transTask.video.localPath : transTask?.video?.['url'];
        if (transTask.platform === Platforms.WeiXinGongZhongHao) {
          const contentList = transTask.contentList as Array<WeiXinGongZhongHaoVideoContentItem>;
          if (contentList?.length) {
            for (const content of contentList) {
              content.video.localPath = content?.video?.localPath ? content.video.localPath : content?.video?.url ?? '';
            }
            if (!transTask.video.localPath) {
              transTask.video.localPath = contentList[0]?.video?.localPath ?? '';
            }
          }
        }
        if (!transTask?.video?.localPath?.toLowerCase()?.trim()?.startsWith('http')) {
          console.debug('使用本地路径视频', transTask?.video?.localPath);
          videoPath = transTask?.video?.localPath ?? '';
        } else {
          if (transTask.platform === Platforms.WeiXinGongZhongHao) {
            const contentList = transTask.contentList as Array<WeiXinGongZhongHaoVideoContentItem>;
            if (contentList?.length) {
              for (const content of contentList) {
                const contentVideoPath = content?.video?.localPath
                  ? content.video.localPath
                  : content?.video?.url ?? '';
                if (!contentVideoPath?.trim()) {
                  await this.postBackPublishProcess(
                    publishStatusEnum.uploadFail,
                    '视频地址为空',
                    this.singleTask.taskId,
                  );
                  logger.error(`视频地址为空:${this.singleTask.taskId}:${JSON.stringify(content?.video ?? {})}`);
                  return undefined;
                }
                downVideoResult = await Downloader.downloadFile('', contentVideoPath, '', 'mp4');

                if (!(downVideoResult?.localPath && fs.existsSync(downVideoResult?.localPath))) {
                  await this.postBackPublishProcess(
                    publishStatusEnum.uploadFail,
                    `视频下载失败:${content?.video?.localPath}`,
                    this.singleTask.taskId,
                  );
                  logger.error(`视频下载失败:${transTask?.video?.localPath}:${JSON.stringify(downVideoResult)}`);
                  return undefined;
                } else {
                  content.video.localPath = downVideoResult.localPath;
                  videoPath = downVideoResult.localPath;
                }
              }
            }
          } else {
            downVideoResult = await Downloader.downloadFile('', transTask?.video?.localPath, '', 'mp4');

            if (!(downVideoResult?.localPath && fs.existsSync(downVideoResult?.localPath))) {
              await this.postBackPublishProcess(
                publishStatusEnum.uploadFail,
                `视频下载失败:${transTask?.video?.localPath}`,
                this.singleTask.taskId,
              );
              logger.error(`视频下载失败:${transTask?.video?.localPath}:${JSON.stringify(downVideoResult)}`);
              return undefined;
            } else {
              videoPath = downVideoResult.localPath;
            }
          }
        }
        transTask.video.localPath = videoPath;
        //取消任务推送
        if (cancelToken.cancelledValue) {
          await this.postBackPublishProcess(
            publishStatusEnum.uploadFail,
            CancelToken.cancelMsg,
            this.singleTask.taskId,
          );
          return undefined;
        }
        this.task = transTask;
      } else if (this.taskSet.publishType === PubContentEnum.audio) {
        const transTask = {
          ...this.singleTask.publishData,
          taskId: this.singleTask.taskId,
          platform: this.singleTask.authorInfo.platform,
          publishType: PubContentEnum.audio,
          needParts: this.taskSet.need_parts_back,
          platformAccount: {
            platformAccountId: this.singleTask.authorInfo.id,
            platformAuthorId: this.singleTask.authorInfo.authorId,
            platformAccountName: this.singleTask.authorInfo?.authorName,
            cookie: this.singleTask.authorInfo.cookie,
            authorization: this.taskSet.authorization,
            callBackData: this.taskSet.callBackData,
          },
          proxy: this.singleTask.authorInfo.proxy,
        } as BaseSinglePublishTaskAudio;
        transTask.audio.localPath = transTask.audio.localPath || transTask.audio.url || '';
        if (!transTask.audio.localPath) {
          await this.postBackPublishProcess(publishStatusEnum.uploadFail, '音频地址为空', this.singleTask.taskId);
          return undefined;
        }
        if (transTask.audio.localPath.trim().toLowerCase().startsWith('http')) {
          const downloaded = await Downloader.downloadFile('', transTask.audio.localPath, '', 'mp3');
          if (!downloaded.localPath || !fs.existsSync(downloaded.localPath)) {
            await this.postBackPublishProcess(publishStatusEnum.uploadFail, '音频下载失败', this.singleTask.taskId);
            return undefined;
          }
          transTask.audio.localPath = downloaded.localPath;
        }
        const cover = transTask.cover ?? transTask.covers?.[0];
        if (cover?.pathOrUrl?.trim().toLowerCase().startsWith('http')) {
          const coverUrl = cover.pathOrUrl;
          const extension = path.extname(coverUrl.split('?')[0]).replace('.', '') || 'jpeg';
          const downloadedCover = await Downloader.downloadFile('', coverUrl, '', extension);
          if (!downloadedCover.localPath || !fs.existsSync(downloadedCover.localPath)) {
            await this.postBackPublishProcess(publishStatusEnum.uploadFail, '封面下载失败', this.singleTask.taskId);
            return undefined;
          }
          transTask.cover = { ...cover, pathOrUrl: downloadedCover.localPath };
        }
        this.task = transTask;
      } else if (this.taskSet.publishType === PubContentEnum.article) {
        const transTask = {
          ...this.singleTask.publishData,
          taskId: this.singleTask.taskId,
          platform: this.singleTask.authorInfo.platform,
          publishType: this.taskSet.publishType as PubContentEnum,
          needParts: this.taskSet.need_parts_back,
          platformAccount: {
            platformAccountId: this.singleTask.authorInfo.id,
            platformAuthorId: this.singleTask.authorInfo.authorId,
            platformAccountName: this.singleTask.authorInfo?.authorName,
            cookie: this.singleTask.authorInfo.cookie,
            authorization: this.taskSet.authorization,
            callBackData: this.taskSet.callBackData,
          },
          proxy: this.singleTask.authorInfo.proxy,
        } as BaseSinglePublishTaskArticle;
        if (transTask.contentPublishUrl) {
          const content = await getArticleContentByUrl(transTask.contentPublishUrl);
          if (content.statusCode != 0 || !content.data) {
            await this.postBackPublishProcess(
              publishStatusEnum.uploadFail,
              `下载文章内容失败:${content?.statusCode},${content.message}`,
              this.singleTask.taskId,
            );
            return undefined;
          }
          transTask.content = content.data;
        }
        this.task = transTask;
      } else if (
        this.taskSet.publishType === PubContentEnum.dynamic ||
        String(this.taskSet.publishType) === PubContentEnum.ImageText
      ) {
        const transTask = {
          ...this.singleTask.publishData,
          taskId: this.singleTask.taskId,
          platform: this.singleTask.authorInfo.platform,
          publishType:
            String(this.taskSet.publishType) === PubContentEnum.ImageText
              ? PubContentEnum.dynamic
              : (this.taskSet.publishType as PubContentEnum),
          needParts: this.taskSet.need_parts_back,
          platformAccount: {
            platformAccountId: this.singleTask.authorInfo.id,
            platformAuthorId: this.singleTask.authorInfo.authorId,
            platformAccountName: this.singleTask.authorInfo?.authorName,
            cookie: this.singleTask.authorInfo.cookie,
            authorization: this.taskSet.authorization,
            callBackData: this.taskSet.callBackData,
          },
          proxy: this.singleTask.authorInfo.proxy,
        } as BaseSinglePublishTaskDynamic;
        this.task = transTask;
      }
      //取消任务推送
      if (cancelToken.cancelledValue) {
        await this.postBackPublishProcess(publishStatusEnum.uploadFail, CancelToken.cancelMsg, this.singleTask.taskId);
        return undefined;
      }

      //取消任务推送
      if (cancelToken.cancelledValue) {
        await this.postBackPublishProcess(publishStatusEnum.uploadFail, CancelToken.cancelMsg, this.singleTask.taskId);
        return undefined;
      }
      if (!this.task || !this.task?.platform || !this.task?.platformAccount) {
        await this.postBackPublishProcess(publishStatusEnum.uploadFail, '任务转换失败', this.singleTask.taskId);
        return;
      }
      //加入取消参数
      this.task.cancelToken = cancelToken;
      //开始发布
      const result = await this.worker.publish(this.task);
      if (result?.code === errorCode.risk_verify) {
        logger.info(
          `发布任务等待验证:${this.task.taskId}，postData长度:${result.postData?.length ?? 0}，checkStr长度:${
            result.checkStr?.length ?? 0
          }`,
        );
      } else {
        logger.info(`发布结果:${this.task.taskId} ${JSON.stringify(result)}`);
      }
      // 先按历史流程回传发布结果，再额外回传风控等待验证事件
      const resultFeedback = this.postBackPublishResult(result);
      if (this.feedbackHandler) {
        await resultFeedback;
      }
      if (result?.code === errorCode.risk_verify && process.env.PUBLISH_RISK_RESUME_ENABLED !== 'false') {
        const verifyFeedback = this.postBackPublishVerifyRequired(result);
        if (this.feedbackHandler) {
          await verifyFeedback;
        }
      }
      return result;
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `发布失败，${e?.toString() ?? ''}`;
      }
      logger.error(`异常发布失败${this.singleTask.taskId}:${errMsg}:${JSON.stringify(this.task)}`);
      const resultFeedback = this.postBackPublishResult({
        code: -1,
        msg: `发布失败:${errMsg}`,
        taskId: this.singleTask.taskId,
      });
      if (this.feedbackHandler) {
        await resultFeedback;
      }
    } finally {
      this.worker.event?.removeAllListeners();
      taskCancelCache[this.singleTask.taskId] = null;
      const task = (this.singleTask?.publishData as BaseSinglePublishTaskVideo)?.video as object;
      const url = task ? task['url'] : '';
      if (url) {
        const index = Downloader.inUseFile[url]?.indexOf(this.singleTask.taskId);
        if (index >= 0) {
          Downloader.inUseFile[url].splice(index, 1);
          if (!(Downloader.inUseFile[url]?.length > 0)) {
            delete Downloader.downloadingList[downVideoResult?.src ?? ''];
            this.deleteTmpVideo(downVideoResult?.localPath ?? '');
          }
        }
      }
    }
  }

  /**
   * 完成用户验证后直接使用原始发布数据再次发布
   */
  public async checkAndPublish(
    input: CheckAndPublishInput,
  ): Promise<{ code: number; msg: string; accepted?: boolean }> {
    this.task = {
      taskId: input.taskId,
      publishType: input.publishType as PubContentEnum,
      platform: Platforms.DouYin,
      platformAccount: {
        platformAccountId: input.account.id,
        cookie: input.account.cookie,
        localStorage:
          typeof input.account.localStorage === 'string' && input.account.localStorage.startsWith('{')
            ? JSON.parse(input.account.localStorage)
            : (input.account.localStorage as object),
      },
      proxy: input.account.proxy as IWebProxy,
    } as BaseSinglePublishTask;
    const douyinWorker = this.worker as DouYinWorker;
    douyinWorker.refreshCookie(input.account.cookie, this.task.platformAccount.localStorage);
    const verifyResult = await douyinWorker.verifyPublishRisk({
      type: input.verifyType,
      code_number: input.codeNumber ?? '',
      password: input.password ?? '',
      checkStr: input.checkStr,
      proxy: input.account.proxy as KuaiDaiLiProxy,
    });
    input.password = undefined;
    input.codeNumber = undefined;
    if (verifyResult.code !== 0) {
      return { code: verifyResult.code, msg: verifyResult.msg || '发布验证失败，请检查后重试' };
    }

    let publishResult: PublishResult;
    try {
      publishResult = await douyinWorker.publishPostData(
        input.publishType,
        input.postData,
        input.taskId,
        input.account.proxy as KuaiDaiLiProxy,
      );
    } catch {
      publishResult = {
        code: -1,
        msg: '恢复发布失败，请稍后重试',
        taskId: input.taskId,
      };
    }
    this.postBackPublishResult(publishResult);
    return { code: publishResult.code ?? -1, msg: publishResult?.msg ?? '验证发布任务已受理', accepted: true };
  }

  private deleteTmpVideo(filePath: string) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      logger.error(`删除视频异常:${filePath}-${(e as Error).message}`);
    }
  }

  /**
   * 本机发布事件只通过调用方提供的 Socket 回传函数发送，不降级为 HTTP 回调。
   */
  private async postLocalPublishFeedback(postData: Record<string, unknown>): Promise<boolean> {
    if (!this.feedbackHandler) {
      return false;
    }

    try {
      await this.feedbackHandler(postData);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : e?.toString() ?? '';
      logger.error(`本机Socket发布事件回传失败:${this.singleTask.taskId}:${errMsg}`);
    }
    return true;
  }

  /**
   * 回传子任务进度
   * @param pubProcessStatus
   * @param msg
   * @param taskId
   * @param totalParts
   * @param uploadedParts
   * @private
   */
  private async postBackPublishProcess(
    pubProcessStatus: publishStatusEnum,
    msg: string,
    taskId: string,
    uploadedParts?: number,
    totalParts?: number,
  ): Promise<void> {
    try {
      const url = this.taskSet.authorization
        ? `${PubConfig.API_URL}${PubConfig.OpenCallBackUrlPath}`
        : `${PubConfig.API_URL}/tasks/${taskId}/status`;

      //根据实际情况组装数据
      const postData = {
        event: CallBackDataEvent.publishProcess,
        publishType: this.taskSet.publishType,
        taskId: taskId,
        callBackData: this.taskSet.callBackData,
        documentId: null,
        publishId: null,
        openUrl: null,
        errorMessage: '',
        stageStatus: '',
        stages: '',
        totalParts: totalParts,
        uploadedParts: uploadedParts,
      };
      switch (pubProcessStatus) {
        case publishStatusEnum.uploading:
          postData.stages = BackStagesEnum.upload;
          postData.stageStatus = BackStageStatusEnum.doing;
          break;
        case publishStatusEnum.uploadFail:
          postData.stages = BackStagesEnum.upload;
          postData.stageStatus = BackStageStatusEnum.fail;
          break;
        case publishStatusEnum.pushing:
          postData.stages = BackStagesEnum.push;
          postData.stageStatus = BackStageStatusEnum.doing;
          break;
        case publishStatusEnum.pushFail:
          postData.stages = BackStagesEnum.push;
          postData.stageStatus = BackStageStatusEnum.fail;
          break;
        default:
          //logger.error(`发布进度未知:taskId:${taskId} 状态结果:${pubProcessStatus}`);
          return;
        //throw new Error('未适配的状态');
      }
      if (postData.stageStatus == BackStageStatusEnum.fail) {
        postData.errorMessage = msg ?? '';
        const tmpMsg = postData.errorMessage?.toLowerCase();
        if (tmpMsg?.includes('timeout') || tmpMsg.includes('socket')) {
          postData.errorMessage = '网络异常，请重新发布';
        }
      }
      if (await this.postLocalPublishFeedback(postData)) {
        return;
      }
      const tm = Date.now();
      const headers = {
        authorization: this.taskSet.authorization ?? (PubConfig.API_Token ? PubConfig.API_Token : generateToken(tm)),
        timestamp: tm,
        'x-client': PubConfig.xClient,
      };
      //await Task.Delay(1000);
      const result = this.taskSet.authorization
        ? await $http.post<{ statusCode: number; message: string }>(url, postData, {
            headers: headers,
          })
        : await $http.patch<{ statusCode: number; message: string }>(url, postData, {
            headers: headers,
            retryCondition: (error, response) => {
              return !isJson(response.data);
            },
          });
      if (result?.data?.statusCode === 0) {
        console.log(`进度回调成功:${taskId}`);
        return;
      } else {
        logger.error(`进度结果回调失败:${taskId}:${JSON.stringify(postData)}： ${JSON.stringify(result?.data)}`);
      }
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `${e?.toString() ?? ''}`;
      }
      logger.error(`推送发布进度异常失败:taskId:${taskId} 状态结果:${pubProcessStatus}  ${errMsg}`);
    }
  }

  /**
   * 回传子任务进度
   * @param qrData
   * @private
   */
  private async postBackQrCode(qrData: WeiXinQrCode): Promise<void> {
    try {
      const url = `${PubConfig.API_URL}${PubConfig.OpenCallBackUrlPath}`;

      //根据实际情况组装数据
      const postData = {
        event: CallBackDataEvent.wxQrCode,
        publishType: this.taskSet.publishType,
        callBackData: this.taskSet.callBackData,
        ...qrData,
        errorMessage: qrData.msg,
      };

      if (await this.postLocalPublishFeedback(postData)) {
        return;
      }

      const tm = Date.now();
      const headers = {
        authorization: this.taskSet.authorization ?? (PubConfig.API_Token ? PubConfig.API_Token : generateToken(tm)),
        timestamp: tm,
        'x-client': PubConfig.xClient,
      };
      //await Task.Delay(1000);
      const result = await $http.post<{ statusCode: number; message: string }>(url, postData, {
        headers: headers,
      });
      if (result?.data?.statusCode === 0) {
        console.log(`公众号二维码回调成功:${qrData.taskId}`);
        return;
      } else {
        logger.error(
          `公众号二维码回调失败:${qrData.taskId}:${JSON.stringify(postData)}： ${JSON.stringify(result?.data)}`,
        );
      }
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `${e?.toString() ?? ''}`;
      }
      logger.error(`推送公众号二维码异常失败:taskId:${qrData.taskId} 状态结果:${JSON.stringify(qrData)}  ${errMsg}`);
    }
  }

  /**
   * 回传发布等待验证结果
   * @param publishResult
   * @private
   */
  private async postBackPublishVerifyRequired(publishResult: PublishResult): Promise<void> {
    const url = this.taskSet.authorization
      ? `${PubConfig.API_URL}${PubConfig.OpenCallBackUrlPath}`
      : `${PubConfig.API_URL}/tasks/${this.singleTask.taskId}/status`;
    const resumeData = {
      resumeVersion: 1,
      taskId: this.singleTask.taskId,
      applicationId: this.taskSet.applicationId ?? '',
      accountId: this.singleTask.authorInfo.id,
      platformCode: Platforms.DouYin,
      publishType: this.taskSet.publishType,
      publishChannel: this.taskSet.publishChannel ?? '',
      clientId: '',
      verifyMethods: publishResult.verifyMethods ?? ['password', 'smscode'],
      checkStr: publishResult.checkStr ?? '',
      postData: publishResult.postData ?? '',
      recordId: '',
      callBackData: this.taskSet.callBackData ?? {},
    };
    const postData = {
      event: CallBackDataEvent.publishVerifyRequired,
      publishType: this.taskSet.publishType,
      taskId: this.singleTask.taskId,
      callBackData: this.taskSet.callBackData,
      errorCode: errorCode.risk_verify,
      errorMessage:
        '发布失败:官方平台检测到您的账号存在风险，请先前往《创作者中心》里登录后单独发布一个作品，发布时会跳出验证，验证通过即可一键发布。',
      stageStatus: BackStageStatusEnum.fail,
      stages: BackStagesEnum.verify,
      verifyMethods: resumeData.verifyMethods,
      resumeData,
    };

    if (await this.postLocalPublishFeedback(postData)) {
      return;
    }

    for (let i = 0; i < 3; i++) {
      try {
        const tm = Date.now();
        const headers = {
          authorization: this.taskSet.authorization ?? (PubConfig.API_Token ? PubConfig.API_Token : generateToken(tm)),
          timestamp: tm,
          'x-client': PubConfig.xClient,
        };
        const result = this.taskSet.authorization
          ? await $http.post<{ statusCode: number; message: string }>(url, postData, { headers })
          : await $http.patch<{ statusCode: number; message: string }>(url, postData, { headers });
        if (result?.data?.statusCode === 0) {
          logger.info(
            `发布验证回调成功:${this.singleTask.taskId}，postData长度:${resumeData.postData.length}，checkStr长度:${resumeData.checkStr.length}`,
          );
          return;
        }
        logger.error(`发布验证回调失败:${this.singleTask.taskId}，状态码:${result?.data?.statusCode ?? -1}`);
      } catch (e) {
        const errMsg = e instanceof AxiosError ? '网络异常' : e instanceof Error ? e.message : '未知异常';
        logger.error(`发布验证回调异常:${this.singleTask.taskId}，${errMsg}`);
      }
      if (i < 2) {
        await Task.Delay(i === 0 ? 1000 * 60 * 3 : 1000 * 60 * 10);
      }
    }
  }

  /**
   * 回传发布结果
   * @param publishResult
   * @private
   */
  private async postBackPublishResult(publishResult: PublishResult | undefined): Promise<void> {
    for (let i = 0; i < 3; i++) {
      try {
        const url = this.taskSet.authorization
          ? `${PubConfig.API_URL}${PubConfig.OpenCallBackUrlPath}`
          : `${PubConfig.API_URL}/tasks/${this.singleTask.taskId}/status`;

        //根据实际情况组装数据
        const postData = {
          event: CallBackDataEvent.publishResult,
          publishType: this.taskSet.publishType,
          taskId: this.singleTask.taskId,
          callBackData: this.taskSet.callBackData,
          documentId: null,
          publishId: publishResult?.publishId?.toString(),
          openUrl: null,
          errorMessage: publishResult?.code === 0 ? '' : publishResult?.msg,
          stageStatus: publishResult?.code === 0 ? BackStageStatusEnum.success : BackStageStatusEnum.fail,
          stages: publishResult?.scheduled ? BackStagesEnum.scheduled : BackStagesEnum.push,
        };
        if (postData.errorMessage) {
          const tmpMsg = postData.errorMessage?.toLowerCase() ?? '';
          if (tmpMsg?.includes('timeout') || tmpMsg.includes('socket')) {
            postData.errorMessage = '网络异常，请重新发布';
          }
        }
        if (await this.postLocalPublishFeedback(postData)) {
          this.worker.event?.removeAllListeners();
          return;
        }
        const tm = Date.now();
        const headers = {
          authorization: this.taskSet.authorization ?? (PubConfig.API_Token ? PubConfig.API_Token : generateToken(tm)),
          timestamp: tm,
          'x-client': PubConfig.xClient,
        };

        const result = this.taskSet.authorization
          ? await $http.post<{ statusCode: number; message: string }>(url, postData, {
              headers: headers,
            })
          : await $http.patch<{ statusCode: number; message: string }>(url, postData, {
              headers: headers,
              retryCondition: (error, response) => {
                return !isJson(response.data);
              },
            });
        logger.info(`发布结果回调${this.task.taskId}:${JSON.stringify(postData)}${JSON.stringify(result?.data)}`);
        if (result?.data?.statusCode === 0) {
          this.worker.event?.removeAllListeners();
          return;
        } else {
          logger.error(
            `发布结果回调失败${this.singleTask.taskId} :${JSON.stringify(postData)}： ${JSON.stringify(result?.data)}`,
          );
          if (i === 0) {
            await Task.Delay(1000 * 60 * 3);
          } else if (i === 1) {
            await Task.Delay(100 * 60 * 10);
          }
        }
      } catch (e) {
        let errMsg = '';
        if (e instanceof AxiosError) {
          errMsg = `网络异常:${e.message}`;
        } else if (e instanceof Error) {
          errMsg = e.message;
        } else {
          errMsg = `${e?.toString() ?? ''}`;
        }
        logger.error(
          `发布结果回调异常失败:taskId:${this.singleTask.taskId} publishId:${publishResult?.publishId}  ${errMsg}`,
        );
        if (i === 0) {
          await Task.Delay(1000 * 60 * 3);
        } else if (i === 1) {
          await Task.Delay(100 * 60 * 10);
        }
      }
    }
    this.worker.event?.removeAllListeners();
  }
}

/**
 * 已踢出队列，自由执行的内容同步列表任务，主要为了适配长时间任务
 */
const freeContentListTasks = new Set();
export const pushDataSyncTask = (
  platform: Platforms,
  dataType: 'accountOverView' | 'contentList',
  account: PlatformAccountInfo,
  proxy?: KuaiDaiLiProxy,
  maxDays: number = 7,
  maxCount: number = 1000,
  exArgs?: object,
): string | undefined => {
  try {
    const uniqueId = `${platform}_${dataType}_${account.platformAccountId}`;
    switch (dataType) {
      case 'accountOverView':
        PubConfig.dataSyncSchedulerService.push(
          new QueryStateScheduledTask(
            new Date(Date.now() + new Random().Next(0, 2) * 1000),
            uniqueId,
            uniqueId,
            async () => {
              await new QueryWorker('', platform, account).getAccountOverViewReportData(proxy);
            },
          ),
        );
        break;
      case 'contentList':
        if (!freeContentListTasks.has(uniqueId)) {
          PubConfig.dataSyncSchedulerService.push(
            new QueryStateScheduledTask(
              new Date(Date.now() + new Random().Next(2, 4) * 1000),
              uniqueId,
              uniqueId,
              async () => {
                await new QueryWorker('', platform, account).getAccountContentListView(
                  maxDays,
                  maxCount,
                  proxy,
                  undefined,
                  uniqueId,
                  exArgs,
                );
              },
            ),
          );
          freeContentListTasks.add(uniqueId);
        }

        break;
      default:
        throw new Error(`不支持的类型:${dataType}`);
    }
  } catch (e) {
    logger.error('添加数据同步任务失败${JSON.stringify(e)}');
  }
  return undefined;
};

/**
 * 获取媒体号信息
 * @param platform
 * @param cookie
 * @param proxy
 */
export const getPlatformUserInfo = async (
  platform: Platforms | string,
  cookie: string,
  proxy?: IWebProxy,
): Promise<PlatformAuthorInfo> => {
  try {
    const normalizedPlatform = normalizePlatformCode(platform) as Platforms;
    const worker = new QueryWorker('', normalizedPlatform, { cookie: cookie });
    const re = (await worker.getUserInfo(proxy)) ?? { code: 2, msg: '' };
    if (re?.code != 0 || !re?.yixiaoerId) {
      logger.error(`获取${platform}用户信息失败:${JSON.stringify(re)}`);
    }
    return re;
  } catch (e) {
    let errMsg = '';
    if (e instanceof AxiosError) {
      errMsg = `网络异常:${e.message}`;
    } else if (e instanceof Error) {
      errMsg = e.message;
    } else {
      errMsg = `发布失败，${e?.toString() ?? ''}`;
    }
    logger.error(`获取${platform}用户信息异常失败:${errMsg}`);
    return { code: 3, msg: errMsg };
  }
};
/**
 * 执行查询类等短时任务
 */
export class QueryWorker {
  /**
   * 发布实例，根据平台参数进行实例化对应的
   * @private
   */
  protected worker: BaseWorker;
  /**
   * 媒体号信息
   * @private
   */
  protected account: PlatformAccountInfo;

  /**
   * 是否入参带cookie
   * @private
   */
  protected initCookie: boolean;

  /**
   * 媒体账号所属平台
   * @private
   */
  protected platform: Platforms;

  protected authToken: string;

  /**
   * 唯一id，用于标志一个queryWorker的唯一性
   * @private
   */
  protected uniqueId?: string;

  public eventCall?: EventEmitter;

  /**
   *
   * @param authToken
   * @param platform 所属平台
   * @param account 媒体号相关信息
   */
  constructor(authToken: string, platform: PlatformCodeInput, account: PlatformAccountInfo) {
    this.account = account;
    this.worker = new BaseWorker(account.cookie);
    this.platform = normalizePlatformCode(platform) as Platforms;
    this.authToken = authToken;
    this.initCookie = !!account?.cookie;
    this.eventCall = new EventEmitter();
    switch (this.platform) {
      case Platforms.DouYin:
        this.worker = new DouYinWorker(account.cookie, account.localStorage);
        break;
      case Platforms.KuaiShou:
        this.worker = new KuaiShouWorker(account.cookie, account.localStorage);
        break;
      case Platforms.BiLiBiLi:
        this.worker = new BiliBiliWorker(account.cookie, account.localStorage);
        break;
      case Platforms.XinLangWeiBo:
        this.worker = new XinLangWeiBoWorker(account.cookie, account.localStorage);
        break;
      case Platforms.XiaoHongShu:
        this.worker = new XiaoHongShuWorker(account.cookie, account.localStorage);
        break;
      case Platforms.RedNote:
        this.worker = new RedNoteWorker(account.cookie, account.localStorage);
        break;
      case Platforms.ShiPinHao:
        this.worker = new ShiPinHaoWorker(account.cookie, account.localStorage);
        break;
      case Platforms.BaiJiaHao:
        this.worker = new BaiJiaHaoWorker(account.cookie, account.localStorage);
        break;
      case Platforms.TouTiaoHao:
        this.worker = new TouTiaoHaoWorker(account.cookie, account.localStorage);
        break;
      case Platforms.AiQiYi:
        this.worker = new AiqiyiHaoWorker(account.cookie, account.localStorage);
        break;
      case Platforms.DaYuHao:
        this.worker = new DaYuHaoWorker(account.cookie, account.localStorage);
        break;
      case Platforms.QiEHao:
        this.worker = new QiehaoWorker(account.cookie, account.localStorage);
        break;
      case Platforms.SouHuHao:
        this.worker = new SouHuHaoWorker(account.cookie, account.localStorage);
        break;
      case Platforms.TengXunWeiShi:
        this.worker = new WeiShiWorker(account.cookie, account.localStorage);
        break;
      case Platforms.WangYiHao:
        this.worker = new WangYiHaoWorker(account.cookie, account.localStorage);
        break;
      case Platforms.YiDianHao:
        this.worker = new YiDianHaoWorker(account.cookie, account.localStorage);
        break;
      case Platforms.ZhiHu:
        this.worker = new ZhihuWorker(account.cookie, account.localStorage);
        break;
      case Platforms.SouHuShiPin:
        this.worker = new SouHuShiPinWorker(account.cookie, account.localStorage);
        break;
      case Platforms.PiPiXia:
        this.worker = new PiPiXiaWorker(account.cookie, account.localStorage);
        break;
      case Platforms.TengXunShiPin:
        this.worker = new TengXunShiPinWorker(account.cookie, account.localStorage);
        break;
      case Platforms.DuoDuoShiPin:
        this.worker = new DuoDuoShiPinWorker(account.cookie, account.localStorage);
        break;
      case Platforms.AcFun:
        this.worker = new AZhanWorker(account.cookie, account.localStorage);
        break;
      case Platforms.MeiPai:
        this.worker = new MeiPaiWorker(account.cookie, account.localStorage);
        break;
      case Platforms.KuaiChuanHao:
        this.worker = new KuaiChuanHaoWorker(account.cookie, account.localStorage);
        break;
      case Platforms.XueQiuHao:
        this.worker = new XueQiuHaoWorker(account.cookie, account.localStorage);
        break;
      case Platforms.XiaoHongShuShangJiaHao:
        this.worker = new XiaoHongShuShopWorker(account.cookie, account.localStorage);
        break;
      case Platforms.XiaoHongShuHome:
        this.worker = new XiaoHongShuHomeWorker(account.cookie, account.localStorage);
        break;
      case Platforms.MeiYou:
        this.worker = new MeiYouWorker(account.cookie, account.localStorage);
        break;
      case Platforms.CheJiaHao:
        this.worker = new CheJiaHaoWorker(account.cookie, account.localStorage);
        break;
      case Platforms.WeiXinGongZhongHao:
        this.worker = new WeiXinGongZhongHaoWorker(account.cookie, account.localStorage);
        break;
      case Platforms.YiCheHao:
        this.worker = new YiCheHaoWorker(account.cookie, account.localStorage);
        break;
      case Platforms.DongCheHao:
        this.worker = new DongCheHaoWorker(account.cookie, account.localStorage);
        break;
      case Platforms.FengWang:
        this.worker = new FengWangWorker(account.cookie, account.localStorage);
        break;
      case Platforms.DouBan:
        this.worker = new DouBanWorker(account.cookie, account.localStorage);
        break;
      case Platforms.CSDN:
        this.worker = new CSDNWorker(account.cookie, account.localStorage);
        break;
      case Platforms.DeWu:
        this.worker = new DeWuWorker(account.cookie, account.localStorage);
        break;
      case Platforms.JianShu:
        this.worker = new JianShuHaoWorker(account.cookie, account.localStorage);
        break;
      case Platforms.WiFiWanNengYaoShi:
        this.worker = new WiFIWanNengWorker(account.cookie, account.localStorage);
        break;
      case Platforms.AI_DouBao:
        this.worker = new AIDouBaoWorker(account.cookie, account.localStorage);
        break;
      case Platforms.AI_DeepSeek:
        this.worker = new AIDeepSeekWorker(account.cookie, account.localStorage);
        break;
      case Platforms.TaoBaoGuangHe:
        this.worker = new TaoBaoGuangHeWorker(account.cookie, account.localStorage);
        break;
      case Platforms.Ximalaya:
        this.worker = new XimalayaWorker(account.cookie, account.localStorage);
        break;
      default:
        logger.error(`不支持的平台:${platform}`);
        //throw new Error('不支持的平台');
        break;
    }
    if (this.worker) {
      this.worker.event = this.eventCall;
    }
  }

  public updateCookie(cookie: string): string {
    if (!cookie || cookie?.length < 10 || (!cookie?.includes('=') && !cookie?.trim()?.startsWith('['))) {
      return 'cookie格式异常';
    }
    this.account.cookie = cookie;
    this.worker.refreshCookie(cookie, undefined);
    return '';
  }

  /**
   * 检测账号登录有效性 0：无效 ，1：有效，-1：无法判断 -2：不支持的平台 -3:获取cookie失败
   */
  public async checkAccountAlive(proxy?: IWebProxy): Promise<number> {
    if (!this.worker) {
      //不支持的平台
      return -2;
    }
    if (!this.account.cookie) {
      return -3;
    }
    try {
      const accountService = new AccountService(this.account.cookie, this.platform);
      return accountService.checkAccountAlive(proxy);
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `${e?.toString() ?? ''}`;
      }
      logger.error(
        `检测账号有效性异常: ${this.account.platformAccountId}  ${this.account.platformAccountName} ${errMsg}`,
      );
      return -4;
    }
  }

  /**
   * 获取用户信息
   */
  public async getUserInfo(proxy?: IWebProxy): Promise<PlatformAuthorInfo | undefined> {
    try {
      return await this.worker.getUserInfo(proxy);
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `获取用户信息失败，${e?.toString() ?? ''}`;
      }
      logger.error(`获取用户信息失败:${this.account.platformAccountId}:${errMsg}`);
      return { code: 2, msg: errMsg };
    } finally {
    }
  }

  /**
   * 获取用户信息
   */
  public async getPublishCatergory(contentType: PubContentEnum): Promise<ListLevelInfoResponse | undefined> {
    try {
      return await this.worker.getPublishCategory(contentType);
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `获取发布分类失败，${e?.toString() ?? ''}`;
      }
      logger.error(`获取发布分类失败:${this.account.platformAccountId}:${errMsg}`);
      return { code: -1, msg: errMsg };
    } finally {
    }
  }

  /**
   * 查询审核状态（仅查询一次，不再循环轮询）
   * @param taskId
   * @param publishId
   * @param pubType
   * @param title
   */
  public async checkAuditStatus(
    taskId: string,
    publishId: string,
    loopNum: number = 0,
    pubType?: PubContentEnum,
    title?: string,
  ): Promise<AuditResult | undefined> {
    try {
      if (pubType === PubContentEnum.ImageText) {
        pubType = PubContentEnum.dynamic;
      }
      if (!this.worker) {
        await this.postBackAuditResult(taskId, { code: -1, msg: '不支持的平台', publishId: '' });
        return undefined;
      }

      const auditResult = await this.worker.checkAuditStatus(publishId, pubType, title);
      if (auditResult?.auditStatus != undefined) {
        await this.postBackAuditResult(taskId, auditResult);
        return auditResult;
      } else if (!auditResult || (auditResult.code === 0 && !auditResult.msg?.includes('未找到作品'))) {
        logger.info(`平台未提供作品状态，保留已有状态:taskId:${taskId} 结果 ${JSON.stringify(auditResult)}`);
      } else {
        await this.postBackAuditResult(taskId, auditResult);
        logger.error(`查询作品状态失败:taskId:${taskId} 结果  ${JSON.stringify(auditResult)}`);
      }
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `${e?.toString() ?? ''}`;
      }
      await this.postBackAuditResult(taskId, { code: 400, msg: '状态查询失败' + errMsg, publishId: publishId });
      logger.error(`查询作品状态失败:taskId:${taskId} 异常 ${errMsg}`);
    } finally {
    }
    return undefined;
  }

  /**
   * 获取地址类型权限
   * @param
   */
  public async getLocationTypePrivilege(): Promise<LocationTypePrivilege | undefined> {
    try {
      if (!this.worker) {
        return { code: -1, msg: '不支持的平台' };
      }
      return await this.worker.getLocationTypePrivilege();
    } catch (e) {
      return undefined;
    } finally {
    }
  }

  /**
   * 获取购物车/团购权限
   * @param
   */
  public async getShoppingPrivilege(): Promise<ShoppingPrivilege | undefined> {
    try {
      if (!this.worker) {
        return { code: 444, msg: '不支持的平台' };
      }
      const re = await this.worker.getShoppingPrivilege();
      if (re?.code && !re?.msg) {
        re.msg = `${this.account.platformAccountName ?? ''} 检测账号权限失败，请更新账号授权信息。`;
      }
      return re;
    } catch (e) {
      return undefined;
    } finally {
    }
  }
  /**
   * 获取小程序挂在权限
   */
  public async getMiniAppPrivilege(): Promise<BaseResult | undefined> {
    try {
      if (!this.worker) {
        return { code: 444, msg: '不支持的平台' };
      }
      const re = await this.worker.getMiniAppPrivilege();
      if (re?.code && !re?.msg) {
        re.msg = `${this.account.platformAccountName ?? ''} 检测账号小程序权限失败`;
      }
      return re;
    } catch (e) {
      return undefined;
    } finally {
    }
  }

  public async getCoCreation(): Promise<ListInfoResponse | undefined> {
    try {
      if (!this.worker) {
        return { code: 444, msg: '不支持的平台' };
      }
      const re = await this.worker.getCoCreation();
      if (re?.code && !re?.msg) {
        re.msg = `${this.account.platformAccountName ?? ''} 检测账号共创权限失败`;
      }
      return re;
    } catch (e) {
      return undefined;
    } finally {
    }
  }
  /**
   * 搜索地点
   * @param proxy
   */
  public async getLocationCity(proxy?: KuaiDaiLiProxy): Promise<ListInfoResponse | undefined> {
    try {
      if (!this.worker) {
        return { code: -1, msg: '不支持的平台' };
      }
      return await this.worker.getLocationCity(proxy);
    } catch (e) {
      return undefined;
    } finally {
    }
  }
  /**
   * 搜索地点
   * @param params
   */
  public async searchLocation(params: SearchLocationParams): Promise<ListInfoResponse | undefined> {
    try {
      if (!this.worker) {
        return { code: -1, msg: '不支持的平台' };
      }
      const keyWord = params.keyWord;
      const nextPage = params.nextPage ?? '';
      const proxy = params.proxy;
      return await this.worker.searchLocation(
        keyWord ?? '',
        nextPage,
        proxy,
        params.locationType,
        params.coords,
        params.city,
        (params as any)?.locationMode,
      );
    } catch (e) {
      return undefined;
    } finally {
    }
  }

  /**
   * 搜索话题
   * @param keyWord
   * @param contentType
   * @param categoryId
   */
  public async searchTopic(
    keyWord: string,
    contentType: PubContentEnum,
    categoryId?: string,
  ): Promise<ListInfoResponse | undefined> {
    try {
      if (!this.worker) {
        return { code: -1, msg: '不支持的平台' };
      }
      return await this.worker.searchTopic(keyWord ?? '', contentType, categoryId);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e ?? '话题搜索失败');
      logger.error(`搜索${this.account.platformAccountName ?? ''}话题失败:${this.account.platformAccountId ?? ''}:${message}`);
      return { code: errorCode.data_error, msg: message, dataList: [] };
    } finally {
    }
  }

  /**
   * 搜索参与话题，与普通话题搜索独立。
   */
  public async searchParticipationTopic(
    keyWord: string,
    contentType: PubContentEnum,
    categoryId?: string,
    args?: object,
  ): Promise<ListInfoResponse> {
    try {
      if (!this.worker) {
        return { code: -1, msg: '不支持的平台', dataList: [] };
      }
      return (await this.worker.searchParticipationTopic(
        keyWord ?? '',
        contentType,
        categoryId,
        args,
      )) as ListInfoResponse;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e ?? '参与话题搜索失败');
      logger.error(
        `搜索${this.account.platformAccountName ?? ''}参与话题失败:${this.account.platformAccountId ?? ''}:${message}`,
      );
      return { code: errorCode.data_error, msg: message, dataList: [] };
    } finally {
    }
  }

  public async getCollectionList(contentType?: PubContentEnum, args?: object): Promise<ListLevelInfoResponse> {
    try {
      if (!this.worker) {
        return { code: -1, msg: '不支持的平台' };
      }
      return await this.worker.getCollectionList(contentType, args);
    } catch (e) {
      return { code: 400, msg: (e as Error)?.message ?? (e as AxiosError)?.message };
    } finally {
    }
  }

  public async getGroupList(args?: object): Promise<BaseResult> {
    try {
      if (!this.worker) {
        return { code: -1, msg: '不支持的平台' };
      }
      return await this.worker.getGroupList(args);
    } catch (e) {
      return { code: 400, msg: (e as Error)?.message ?? (e as AxiosError)?.message };
    } finally {
    }
  }

  /**
   * 获取直播预告
   * @param args
   */
  public async getLivePlanList(args?: object): Promise<ListInfoResponse> {
    try {
      if (!this.worker) {
        return { code: -1, msg: '不支持的平台' };
      }
      return await this.worker.getLivePlanList(args);
    } catch (e) {
      return { code: 400, msg: (e as Error)?.message ?? (e as AxiosError)?.message };
    } finally {
    }
  }
  /**
   * 搜索音乐
   * @param keyWord
   * @param nextPage
   */
  public async searchMusic(keyWord: string, nextPage: string): Promise<ListMusicInfoResponse | undefined> {
    try {
      if (!this.worker) {
        return { code: -1, msg: '不支持的平台' };
      }

      const musicRes = await this.worker.searchMusic(keyWord ?? '', nextPage);
      if (musicRes?.dataList?.length) {
        musicRes.dataList = musicRes.dataList?.map((obj) => ({
          ...obj,
          id: obj.yixiaoerId,
          title: obj.yixiaoerName,
          artist: obj.authorName,
          url: obj.playUrl,
        }));
      }
      return musicRes;
    } catch (e) {
      return undefined;
    } finally {
    }
  }

  /**
   *搜索当前平台用户
   * @param keyWord 关键词
   */
  public async searchUserList(keyWord: string): Promise<ListInfoResponse | undefined> {
    try {
      if (!this.worker) {
        return { code: -1, msg: '不支持的平台' };
      }
      return await this.worker.searchUserInfoList(keyWord);
    } catch (e) {
      return undefined;
    } finally {
    }
  }

  /**
   * 搜索剧集列表
   * @param keyWord 搜索关键词，为空时获取默认剧集列表
   * @param pageNum 翻页页码
   */
  public async searchDramaList(args: object): Promise<ListInfoResponse | undefined> {
    try {
      if (!this.worker) {
        return { code: -1, msg: '不支持的平台' };
      }
      return await this.worker.searchDramaList(args);
    } catch (e) {
      return undefined;
    } finally {
    }
  }

  /**
   *在当前平台搜索其他平台用户，目前是适配在公众号中搜索视频号
   * @param keyWord 关键词
   */
  public async searchOtherUserInfoList(keyWord: string): Promise<ListInfoResponse | undefined> {
    try {
      if (!this.worker) {
        return { code: -1, msg: '不支持的平台' };
      }
      return await this.worker.searchOtherUserInfoList(keyWord);
    } catch (e) {
      return undefined;
    } finally {
    }
  }

  /**
   *在当前平台下搜索内容列表，
   * @param yixiaoerId 搜索用户列表获得的用户yixiaoerId
   * @param keyWord 关键词
   * @param platform 平台，备用，目前无用
   * @param nextPage 下一页参数，首页默认为空
   */
  public async searchContentList(
    yixiaoerId: string,
    keyWord?: string,
    platform?: Platforms,
    nextPage?: string,
  ): Promise<ListInfoResponse | undefined> {
    try {
      if (!this.worker) {
        return { code: -1, msg: '不支持的平台' };
      }
      return await this.worker.searchContentList(yixiaoerId, keyWord, platform, nextPage);
    } catch (e) {
      return undefined;
    } finally {
    }
  }

  /**
   * 获取/搜索投票列表
   * @param keyWord
   */
  public async searchVoteList(keyWord?: string): Promise<ListInfoResponse | undefined> {
    try {
      if (!this.worker) {
        return { code: -1, msg: '不支持的平台' };
      }
      return await this.worker.searchVoteList(keyWord);
    } catch (e) {
      return undefined;
    } finally {
    }
  }

  /**
   * 获取投票详情
   * @param yixiaoerId  投票列表中的yixiaoerId
   */
  public async getVoteDetail(yixiaoerId: string): Promise<ListInfoResponse | undefined> {
    try {
      if (!this.worker) {
        return { code: -1, msg: '不支持的平台' };
      }
      return await this.worker.getVoteDetail(yixiaoerId);
    } catch (e) {
      return undefined;
    } finally {
    }
  }

  /**
   * 根据分类获取音乐
   * @param categoryId
   * @param categoryName
   * @param nextPage
   */
  public async getMusicByCategory(
    categoryId: string,
    categoryName: string,
    nextPage: string,
  ): Promise<ListMusicInfoResponse | undefined> {
    try {
      if (!this.worker) {
        return { code: -1, msg: '不支持的平台' };
      }
      const musicRes = await this.worker.getMusicByCategory(categoryId ?? '', categoryName ?? '', nextPage);
      if (musicRes?.dataList?.length) {
        musicRes.dataList = musicRes.dataList?.map((obj) => ({
          ...obj,
          id: obj.yixiaoerId,
          title: obj.yixiaoerName,
          artist: obj.authorName,
          url: obj.playUrl,
        }));
      }
      return musicRes;
    } catch (e) {
      return undefined;
    } finally {
    }
  }

  /**
   * 搜索商品/团购列表
   * @param keyWord
   * @param nextPage
   * @param proxy
   * @param locationType
   * @param coords
   */
  public async searchGoodsList(
    keyWord?: string,
    nextPage?: string,
    proxy?: KuaiDaiLiProxy,
    locationType?: LocationType,
    coords?: GeoLocation,
    options?: object,
  ): Promise<ListGoodsInfoResponse> {
    try {
      if (!this.worker) {
        return { code: 400, msg: '不支持的平台' };
      }
      return this.worker.searchGoodsList(keyWord, nextPage, proxy, locationType, coords, options);
    } catch (e) {
      return { code: 400, msg: (e as Error)?.message ?? (e as AxiosError)?.message ?? '搜索商品失败' };
    }
  }

  /**
   * 获取商品选择器分类/筛选项
   * @param args 平台自定义查询参数
   */
  public async getGoodsTabs(args?: object): Promise<BaseResult> {
    try {
      if (!this.worker) {
        return { code: 400, msg: '不支持的平台' };
      }
      return this.worker.getGoodsTabs(args);
    } catch (e) {
      return { code: 400, msg: (e as Error)?.message ?? (e as AxiosError)?.message ?? '获取商品分类失败' };
    }
  }

  /**
   * 解析商品详情
   * @param keyWord
   */
  public async parseGoodsDetail(keyWord?: string): Promise<ListGoodsInfoResponse> {
    try {
      if (!this.worker) {
        return { code: 400, msg: '不支持的平台' };
      }
      return this.worker.parseGoodsDetail(keyWord);
    } catch (e) {
      return { code: 400, msg: (e as Error)?.message ?? (e as AxiosError)?.message ?? '解析商品失败' };
    }
  }

  /**
   * 获取挑战列表
   */
  public async checkPublishGoods(goods: CheckGoodsParams): Promise<ListInfoResponse> {
    try {
      if (!this.worker) {
        return { code: 400, msg: '不支持的平台' };
      }
      return this.worker.checkPublishGoods(goods);
    } catch (e) {
      return { code: 400, msg: (e as Error)?.message ?? (e as AxiosError)?.message ?? '检测商品发布异常失败' };
    }
  }

  /**
   * 获取活动分类列表
   * @param contentType
   */
  public async getActivityCategory(contentType?: PubContentEnum): Promise<ListInfoResponse> {
    try {
      if (!this.worker) {
        return { code: 400, msg: '不支持的平台' };
      }
      return this.worker.getActivityCategory(contentType);
    } catch (e) {
      return { code: 400, msg: (e as Error)?.message ?? (e as AxiosError)?.message ?? '获取活动分类失败' };
    }
  }

  /**
   * 获取活动列表
   * @param contentType
   * @param categoryId
   * @param keyWord
   */
  public async getActivityList(
    contentType?: PubContentEnum,
    categoryId?: string,
    keyWord?: string,
    args?: object,
  ): Promise<ListInfoResponse> {
    try {
      if (!this.worker) {
        return { code: 400, msg: '不支持的平台' };
      }
      return this.worker.getActivityList(contentType, categoryId, keyWord, args) as Promise<ListInfoResponse>;
    } catch (e) {
      return { code: 400, msg: (e as Error)?.message ?? (e as AxiosError)?.message ?? '获取活动失败' };
    }
  }

  /**
   * 获取参与话题推荐列表，与普通话题/活动列表独立。
   */
  public async getParticipationTopicList(
    contentType?: PubContentEnum,
    categoryId?: string,
    args?: object,
  ): Promise<ListInfoResponse> {
    try {
      if (!this.worker) {
        return { code: 400, msg: '不支持的平台', dataList: [] };
      }
      return (await this.worker.getParticipationTopicList(contentType, categoryId, args)) as ListInfoResponse;
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e ?? '获取参与话题失败');
      logger.error(
        `获取${this.account.platformAccountName ?? ''}参与话题失败:${this.account.platformAccountId ?? ''}:${message}`,
      );
      return { code: errorCode.data_error, msg: message, dataList: [] };
    }
  }

  public async getHotEventList(contentType?: PubContentEnum, keyWord?: string): Promise<ListInfoResponse> {
    try {
      if (!this.worker) {
        return { code: 400, msg: '不支持的平台' };
      }
      return this.worker.getHotEventList(contentType, keyWord);
    } catch (e) {
      return { code: 400, msg: (e as Error)?.message ?? (e as AxiosError)?.message ?? '获取热点失败' };
    }
  }

  /**
   * 获取挑战列表
   */
  public async getTiaoZhanList(keyWord?: string): Promise<ListInfoResponse> {
    try {
      if (!this.worker) {
        return { code: 400, msg: '不支持的平台' };
      }
      return this.worker.getTiaoZhanList(keyWord);
    } catch (e) {
      return { code: 400, msg: (e as Error)?.message ?? (e as AxiosError)?.message ?? '获取挑战失败' };
    }
  }

  /**
   * 获取小程序信息
   * @param keyWord
   */
  public async getMiniAppList(keyWord?: string): Promise<ListInfoResponse> {
    try {
      if (!this.worker) {
        return { code: 400, msg: '不支持的平台' };
      }
      return this.worker.getMiniAppList(keyWord);
    } catch (e) {
      return { code: 400, msg: (e as Error)?.message ?? (e as AxiosError)?.message ?? '获取小程序失败' };
    }
  }

  /**
   * 获取可同步的app列表
   * @param args
   */
  public async getSyncAppList(args?: object): Promise<ListInfoResponse> {
    try {
      if (!this.worker) {
        return { code: 400, msg: '不支持的平台' };
      }
      return this.worker.getSyncAppList(args);
    } catch (e) {
      return { code: 400, msg: (e as Error)?.message ?? (e as AxiosError)?.message ?? '获取可同步app失败' };
    }
  }
  /**
   * 获取影视
   * @param args
   */
  public async getFilmList(args?: object): Promise<ListInfoResponse | undefined> {
    try {
      if (!this.worker) {
        return { code: 400, msg: '不支持的平台' };
      }
      return this.worker.getFilmList(args);
    } catch (e) {
      return { code: 400, msg: (e as Error)?.message ?? (e as AxiosError)?.message ?? '获取影视列表失败' };
    }
  }

  /**
   * 获取游戏列表
   * @param args
   */
  public async getGameList(args?: object): Promise<ListInfoResponse | undefined> {
    try {
      if (!this.worker) {
        return { code: 400, msg: '不支持的平台' };
      }
      return this.worker.getGameList(args);
    } catch (e) {
      return { code: 400, msg: (e as Error)?.message ?? (e as AxiosError)?.message ?? '获取游戏列表失败' };
    }
  }

  /**
   * 检查账号发布是否已经风控
   * @param taskParams
   */
  public async checkPublishRiskStatus(taskParams: object): Promise<BaseResult> {
    try {
      if (!this.worker) {
        return { code: 400, msg: '不支持的平台' };
      }
      return this.worker.checkPublishRiskStatus(taskParams);
    } catch (e) {
      return { code: 400, msg: (e as Error)?.message ?? (e as AxiosError)?.message ?? '检车发布风控状态失败' };
    }
  }
  public async sendPublishCheckSmsCode(taskParams: object): Promise<BaseResult> {
    try {
      if (!this.worker) {
        return { code: 400, msg: '不支持的平台' };
      }
      return this.worker.sendPublishCheckSmsCode(taskParams);
    } catch (e) {
      return { code: 400, msg: (e as Error)?.message ?? (e as AxiosError)?.message ?? '发送短信失败' };
    }
  }
  public async verifyPublishRisk(taskParams: object): Promise<BaseResult> {
    try {
      if (!this.worker) {
        return { code: 400, msg: '不支持的平台' };
      }
      return this.worker.verifyPublishRisk(taskParams);
    } catch (e) {
      return { code: 400, msg: (e as Error)?.message ?? (e as AxiosError)?.message ?? '解除风控失败' };
    }
  }

  /**
   * 检查账号是否可发布
   * @param proxy
   */
  public async checkUserCanPublish(proxy?: IWebProxy): Promise<UserCanPublishInfo | undefined> {
    try {
      if (!this.worker) {
        return { code: 400, msg: '不支持的平台' };
      }
      return this.worker.checkUserCanPublish(proxy);
    } catch (e) {
      return { code: 400, msg: (e as Error)?.message ?? (e as AxiosError)?.message ?? '检测账号是否可发文失败' };
    }
  }

  /**
   * 检查账号剩余发布次数
   * @param createType
   * @param proxy
   */
  public async checkUserCanPublishNum(
    createType: PubContentEnum,
    proxy?: IWebProxy,
  ): Promise<UserCanPublishNum | undefined> {
    try {
      if (!this.worker) {
        return { code: 400, msg: '不支持的平台' };
      }
      return this.worker.checkUserCanPublishNum(createType, proxy);
    } catch (e) {
      return { code: 400, msg: (e as Error)?.message ?? (e as AxiosError)?.message ?? '检测账号剩余发文次数异常失败' };
    }
  }

  /**
   * 获取AI对话会话列表
   * @param taskParams 包含cursor和limit的参数对象
   */
  public async getAIChatConversationList(taskParams: {
    cursor?: string;
    limit?: number;
  }): Promise<AIChatConversationListResponse> {
    try {
      if (!this.worker) {
        return { code: 400, msg: '不支持的平台' };
      }
      return await this.worker.getAIChatConversationList(taskParams);
    } catch (e) {
      return { code: 400, msg: (e as Error)?.message ?? (e as AxiosError)?.message ?? '获取AI对话会话列表失败' };
    }
  }

  /**
   * 获取指定AI对话会话的消息列表
   * @param taskParams 包含conversationId、cursor和limit的参数对象
   */
  public async getAIChatMessages(taskParams: {
    conversationId: string;
    cursor?: string;
    limit?: number;
  }): Promise<AIChatMessageListResponse> {
    try {
      if (!this.worker) {
        return { code: 400, msg: '不支持的平台' };
      }
      return await this.worker.getAIChatMessages(taskParams);
    } catch (e) {
      return { code: 400, msg: (e as Error)?.message ?? (e as AxiosError)?.message ?? '获取AI对话消息列表失败' };
    }
  }

  /**
   * 发送AI对话消息并接收回复
   * @param taskParams 包含content、options和streamResponse的参数对象
   */
  public async sendAIChatMessage(taskParams: {
    content: string;
    options?: object;
    streamResponse?: boolean;
  }): Promise<{ code: number; msg: string; messageId?: string; conversationId?: string; aiResponseContent?: string }> {
    try {
      if (!this.worker) {
        return { code: 400, msg: '不支持的平台' };
      }
      return await this.worker.sendAIChatMessage(taskParams);
    } catch (e) {
      return {
        code: 400,
        msg: (e as Error)?.message ?? (e as AxiosError)?.message ?? '发送AI对话消息失败',
      };
    }
  }

  /**
   * 解析AI对话附件信息
   * @param taskParams 包含attachmentId和exportType的参数对象
   */
  public async parseAIChatAttachment(taskParams: object): Promise<AIChatAttachmentParseResponse> {
    try {
      if (!this.worker) {
        return { code: 400, msg: '不支持的平台' };
      }
      return await this.worker.parseAIChatAttachment(taskParams as never);
    } catch (e) {
      return { code: 400, msg: (e as Error)?.message ?? (e as AxiosError)?.message ?? '解析AI对话附件失败' };
    }
  }
  /**
   * 删除已推送的内容，前提是需要使用状态查询获得docId
   * @param docId
   * @param contentType
   * @param isDraft
   */
  public async downloadAIChatAttachment(taskParams: {
    url?: string;
    id: string;
    exportType?: string;
    attachmentType?: 'document' | 'video';
  }): Promise<Readable | BaseResult> {
    try {
      if (!this.worker) {
        return { code: 400, msg: 'Unsupported platform' };
      }
      return await this.worker.downloadFile(taskParams);
    } catch (e) {
      return { code: 400, msg: (e as Error)?.message ?? (e as AxiosError)?.message ?? 'Download AI attachment failed' };
    }
  }

  public async getAIChatAttachmentDownloadRequest(taskParams: {
    url?: string;
    id: string;
    exportType?: string;
    attachmentType?: 'document' | 'video';
  }): Promise<BaseResult> {
    try {
      if (!this.worker) {
        return { code: 400, msg: 'Unsupported platform' };
      }
      return await this.worker.getDownloadRequest(taskParams);
    } catch (e) {
      return {
        code: 400,
        msg: (e as Error)?.message ?? (e as AxiosError)?.message ?? 'Get AI attachment download request failed',
      };
    }
  }

  public async deleteContent(docId: string, contentType: PubContentEnum, isDraft: boolean): Promise<BaseResult> {
    try {
      if (!this.worker) {
        return { code: 444, msg: '不支持的平台' };
      }
      return this.worker.deleteContent(docId, contentType, isDraft);
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `${e?.toString() ?? ''}`;
      }
      logger.error(`删除作品状态失败:${this.platform}:docId:${docId} 异常 ${errMsg}`);
      return { code: -1, msg: errMsg };
    } finally {
    }
  }

  /**
   * 回传审核状态
   * @param taskId
   * @param auditResult
   * @private
   */
  protected async postBackAuditResult(taskId: string, auditResult: AuditResult | undefined): Promise<void> {
    try {
      const url = this.account.authorization
        ? `${PubConfig.API_URL}${PubConfig.OpenCallBackUrlPath}`
        : `${PubConfig.API_URL}/tasks/${taskId}/status`;

      //根据实际情况组装数据
      const postData = {
        event: CallBackDataEvent.auditStatus,
        callBackData: this.account.callBackData,
        taskId: taskId,
        accountId: this.account.platformAccountId,
        documentId: auditResult?.docId,
        publishId: auditResult?.publishId?.toString(),
        openUrl: auditResult?.openUrl ?? '',
        openUrls: auditResult?.openUrls,
        errorMessage: '',
        stageStatus: '',
        stages: '',
        code: 0,
      };
      switch (auditResult?.auditStatus) {
        case auditStatusEnum.inAudit:
          postData.stages = BackStagesEnum.review;
          postData.stageStatus = BackStageStatusEnum.doing;
          break;
        case auditStatusEnum.waitExecute:
          postData.stages = BackStagesEnum.transcoding;
          postData.stageStatus = BackStageStatusEnum.doing;
          break;
        case auditStatusEnum.executeFail:
          postData.stages = BackStagesEnum.transcoding;
          postData.stageStatus = BackStageStatusEnum.fail;
          postData.errorMessage = auditResult?.msg;
          break;
        case auditStatusEnum.deny:
          postData.stages = BackStagesEnum.review;
          postData.stageStatus = BackStageStatusEnum.fail;
          postData.errorMessage = auditResult?.msg;
          break;
        case auditStatusEnum.draft:
          postData.stages = BackStagesEnum.success;
          postData.stageStatus = BackStageStatusEnum.success;
          break;
        case auditStatusEnum.published:
          postData.stages = BackStagesEnum.success;
          postData.stageStatus = BackStageStatusEnum.success;
          break;
        case auditStatusEnum.prePublish:
          postData.stages = BackStagesEnum.scheduled;
          postData.stageStatus = BackStageStatusEnum.success;
          break;
        case auditStatusEnum.notPublic:
          postData.stages = BackStagesEnum.success;
          postData.stageStatus = BackStageStatusEnum.success;
          break;
        case auditStatusEnum.notSuitableForPublicity:
          postData.stages = BackStagesEnum.withdrawn;
          postData.stageStatus = BackStageStatusEnum.success;
          break;
        case auditStatusEnum.customWithdrawn:
          postData.stages = BackStagesEnum.withdrawn;
          postData.stageStatus = BackStageStatusEnum.success;
          break;
        default:
          logger.error(`审核进度未适配:taskId:${taskId} 状态结果:${JSON.stringify(auditResult)}`);
          break;
      }

      if (auditResult?.code === 0 && auditResult?.msg?.includes('未找到作品')) {
        postData.stages = BackStagesEnum.notfound;
        postData.stageStatus = BackStageStatusEnum.fail;
      } else if (auditResult?.code && !postData?.stages) {
        postData.code = auditResult?.code ?? 400;
        postData.errorMessage = `查询失败: ${auditResult?.msg ?? ''}`;
      }
      if (!postData?.stageStatus) {
        logger.error(`未适配的审核进度:taskId:${taskId} 结果  ${JSON.stringify(auditResult)}`);
        //return;
      }

      const tm = Date.now();
      const headers = {
        authToken: this.authToken,
        authorization: this.account.authorization ?? (PubConfig.API_Token ? PubConfig.API_Token : generateToken(tm)),
        timestamp: tm,
        'x-client': PubConfig.xClient,
      };

      const result = this.account.authorization
        ? await $http.post<{ statusCode: number; message: string }>(url, postData, {
            headers: headers,
          })
        : await $http.patch<{ statusCode: number; message: string }>(url, postData, {
            headers: headers,
            retryCondition: (error, response) => {
              return !isJson(response.data);
            },
          });
      if (result?.data?.statusCode === 0) {
        //logger.info(`推送审核状态成功:${taskId}:${JSON.stringify(postData)}`);
        return;
      } else {
        logger.error(
          `审核结果回调失败:${postData.stages},${taskId}:${JSON.stringify(postData)}： ${JSON.stringify(result?.data)}`,
        );
      }
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `发布失败，${e?.toString() ?? ''}`;
      }
      logger.error(`推送审核结果异常失败:taskId:${taskId} 状态结果:${JSON.stringify(auditResult)}  ${errMsg}`);
    }
  }

  /**
   * 获取账号概览数据
   * @param proxy
   */
  public async getAccountOverViewReportData(proxy?: KuaiDaiLiProxy): Promise<BaseResult> {
    try {
      const re = await DataService.SyncDataService.getAccountData(
        this.platform,
        this.account.cookie,
        this.account.platformAccountId ?? '',
        proxy,
      );
      this.postBackAccountOverViewResult(re.platformAccountId, re.overviewData, re.code, re.overView);
      if (re.overviewData) {
        return { code: 0, msg: undefined };
      } else {
        logger.error(`同步账号概览数据失败:${this.account.platformAccountId}:异常 ${JSON.stringify(re)}`);
        return { code: re.code ?? -1, msg: '同步失败' };
      }
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `${e?.toString() ?? ''}`;
      }
      this.postBackAccountOverViewResult(undefined, undefined, undefined);
      logger.error(`同步账号概览数据失败:${this.account.platformAccountId}:异常 ${errMsg}`);
      return { code: -1, msg: errMsg };
    } finally {
    }
  }

  /**
   * 获取7天内最新1000条作品数据
   * @param proxy
   * @param eventCallBack 可选，事件回调，事件名称为"",数据类型为AccountContentListViewOutPut
   * @param maxDays 可选，最大天数
   * @param maxCount 可选，最大数量
   * @param uniqueId 任务去重用
   * @param exArgs
   */
  public async getAccountContentListView(
    maxDays: number = 7,
    maxCount: number = 1000,
    proxy?: KuaiDaiLiProxy,
    eventCallBack?: EventEmitter,
    uniqueId?: string,
    exArgs?: object,
  ): Promise<BaseResult> {
    try {
      logger.info(`内容列表数据同步开始:${uniqueId ?? this.account.platformAccountId}`);

      if (!eventCallBack) {
        eventCallBack = new EventEmitter();
        const handler = this.postBackAccountContentListResult.bind(this);
        //分页回传
        eventCallBack.on(syncContentEventName, handler);
      }

      this.uniqueId = uniqueId ?? `${this.platform}_contentList_${this.account.platformAccountId}`;

      DataService.SyncDataService.getAccountContentData(
        this.platform,
        this.account.cookie,
        this.account.platformAccountId ?? '',
        eventCallBack,
        maxDays,
        maxCount,
        proxy,
        exArgs as never,
      )
        .then((x) => {
          logger.info(`内容列表数据同步结束:${x?.platformAccountId}`);
          this.postBackAccountContentListResult(undefined, true, x?.code);
        })
        .catch((x) => {
          logger.info(`内容列表数据同步异常结束:${x?.platformAccountId}`);
          this.postBackAccountContentListResult(undefined, true, x?.code);
        })
        .finally(() => {
          freeContentListTasks.delete(this.uniqueId);
          if (eventCallBack) {
            eventCallBack.removeAllListeners();
            eventCallBack = undefined;
          }
        });
      return { code: 0, msg: undefined };
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `${e?.toString() ?? ''}`;
      }
      logger.error(`同步账号概作品据失败:${this.account.platformAccountId}:异常 ${errMsg}`);
      return { code: -1, msg: errMsg };
    } finally {
    }
  }

  /**
   * 回传账号概览数据
   * @param platformAccountId
   * @param overViewData
   * @param code
   * @param newOverView
   * @private
   */
  protected async postBackAccountOverViewResult(
    platformAccountId?: string,
    overViewData?: string,
    code?: number,
    newOverView?: object | undefined,
  ): Promise<void> {
    try {
      const url = this.account.authorization
        ? `${PubConfig.API_URL}${PubConfig.OpenCallBackUrlPath}`
        : `${PubConfig.API_URL}/platform-accounts/${platformAccountId}/overview`;

      //根据实际情况组装数据
      const postData = {
        event: CallBackDataEvent.accountOverview,
        stageStatus: code ?? -1,
        accountId: this.account.platformAccountId,
        callBackData: this.account.callBackData,
        overviewData: overViewData,
        overView: newOverView,
        code: code ?? -1,
      };

      const tm = Date.now();
      const headers = {
        authToken: this.authToken,
        authorization: this.account.authorization ?? (PubConfig.API_Token ? PubConfig.API_Token : generateToken(tm)),
        timestamp: tm,
        'x-client': PubConfig.xClient,
      };

      const result = this.account.authorization
        ? await $http.post<{ statusCode: number; message: string }>(url, postData, {
            headers: headers,
          })
        : await $http.put<{ statusCode: number; message: string }>(url, postData, {
            headers: headers,
            retryCondition: (error, response) => {
              return !isJson(response.data);
            },
          });
      if (result?.data?.statusCode === 0) {
        logger.info(`推送账号概览数据成功:${platformAccountId}:${platformAccountId}`);
        return;
      } else {
        logger.error(
          `推送账号概率数据失败:${platformAccountId}:${JSON.stringify(postData)}： ${JSON.stringify(result?.data)}`,
        );
      }
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `发布失败，${e?.toString() ?? ''}`;
      }
      logger.error(
        `推送账号概览数据异常失败:taskId:${platformAccountId} 状态结果:${JSON.stringify(overViewData)}  ${errMsg}`,
      );
    }
  }
  /**
   * 回传账号作品数据
   * @private
   * @param data
   * @param isFinish  是否任务结束
   * @param code
   */
  protected async postBackAccountContentListResult(
    data?: AccountContentListViewOutPut,
    isFinish: boolean = false,
    code: number = 0,
  ): Promise<void> {
    try {
      const url = this.account.authorization
        ? `${PubConfig.API_URL}${PubConfig.OpenCallBackUrlPath}`
        : `${PubConfig.API_URL}/contents/report`;

      // if (!data?.data?.length) {
      //   return;
      // }

      const postData = {
        event: isFinish ? CallBackDataEvent.contentListEnd : CallBackDataEvent.contentList,
        callBackData: this.account.callBackData,
        accountId: this.account.platformAccountId,
        platformAccountId: this.account.platformAccountId,
        contentStatisticsData: data?.data ?? [],
        contentList: data?.dataList ?? [],
        code: code ?? 0,
      };

      const tm = Date.now();
      const headers = {
        authToken: this.authToken,
        authorization: this.account.authorization ?? (PubConfig.API_Token ? PubConfig.API_Token : generateToken(tm)),
        timestamp: tm,
        'x-client': PubConfig.xClient,
      };

      const result = await $http.post<{ statusCode: number; message: string }>(url, postData, {
        headers: headers,
        retryCondition: (error, response) => {
          return !isJson(response.data);
        },
      });
      if (result?.data?.statusCode === 0) {
        logger.info(`推送账号作品数据成功:${this.account.platformAccountId}:数量:${data?.dataList?.length ?? 0}`);
        return;
      } else {
        logger.error(
          `推送账号作品数据失败数量:${data?.dataList?.length ?? 0}:${this.account.platformAccountId}:${JSON.stringify(
            data,
          )}${JSON.stringify(result?.data)}`,
        );
      }
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `发布失败，${e?.toString() ?? ''}`;
      }
      logger.error(
        `推送账号作品数据失败:账号id:${this.account.platformAccountId} 作品结果:${JSON.stringify(
          data?.data,
        )} \n\n  ${errMsg}`,
      );
    }
  }
}

/**
 * 视频下载
 */
const downHttp = createHttpInstance();
class Downloader {
  /**
   * 缓存列表
   */
  public static downloadingList = {};

  /**
   * 正在使用的视频列表
   */
  public static inUseFile: { [key: string]: [string] } = {};

  public static keyCache = {};

  public static async downloadFile(
    authToken: string,
    url: string,
    key: string,
    ext: string = 'mp4',
  ): Promise<DownloadResult> {
    let filePath = '';
    let writer: fs.WriteStream | null = null;
    let readStream: any = null;
    const cacheKey = key ? key : url;
    try {
      //如果是key，则需要先获取下载地址
      if (key) {
        if (Downloader.keyCache[cacheKey]) {
          //如果存在本地文件，直接返回
          return { src: key, localPath: Downloader.keyCache[cacheKey] };
        }
        //否则获取下载地址并下载
        const urlResult = await getOssUrl(authToken, key);
        if (!urlResult?.data) {
          return { localPath: '', state: -1, msg: `获取下载地址失败:${urlResult?.message}:${key}` };
        }
        url = urlResult?.data;
      }
      await Task.Delay(new Random().Next(300, 2000));
      if (!key) {
        console.info('没有key，直接下载');
      }
      if (!url.trim().toLowerCase().startsWith('http')) {
        return { src: url, localPath: url };
      }
      //如果存在直接返回
      if (Downloader.downloadingList[cacheKey] && Downloader.downloadingList[cacheKey].localPath) {
        if (fs.existsSync(Downloader.downloadingList[cacheKey].localPath)) {
          return Downloader.downloadingList[cacheKey];
        }
        Downloader.downloadingList[cacheKey] = { localPath: '', msg: '', state: 0 };
      }
      //先删除下载失败记录
      else if (Downloader.downloadingList[cacheKey] && Downloader.downloadingList[cacheKey].state == -1) {
        Downloader.downloadingList[cacheKey] = { localPath: '', msg: '', state: 0 };
      }
      //如果在下载中，则等待，最多等待10分钟
      else if (Downloader.downloadingList[cacheKey]) {
        for (let i = 0; i < (PubConfig.xClient === 'desktop' ? 600 : 200); i++) {
          console.log(`等待下载中..${i}：${url}`);
          await Task.Delay(3000);
          if (Downloader.downloadingList[cacheKey].localPath || Downloader.downloadingList[cacheKey].state == -1) {
            return Downloader.downloadingList[cacheKey];
          }
        }
        //等待下载超时后
        return { localPath: '', state: -1, msg: `等待下载超时10分钟:${url}` };
      } else {
        Downloader.downloadingList[cacheKey] = { localPath: '', msg: '', state: 0 };
      }

      //创建路径
      const fileName = crypto.createHash('md5').update(cacheKey).digest('hex') + `.${ext}`;
      if (!PubConfig.userYixiaoerVideoTmpDir) {
        PubConfig.setUserVideoDataDir();
      }
      filePath = path.join(PubConfig.userYixiaoerVideoTmpDir, fileName);
      //文件存在
      if (fs.existsSync(filePath)) {
        Downloader.downloadingList[cacheKey].localPath = filePath;
        Downloader.downloadingList[cacheKey].state = 1;
        Downloader.downloadingList[cacheKey].src = cacheKey;
        return Downloader.downloadingList[cacheKey];
      }

      const fileNetStream = await downHttp.get(url, { responseType: 'stream' });
      if (fileNetStream.status > 204) {
        Downloader.downloadingList[cacheKey].state = -1;
        Downloader.downloadingList[cacheKey].msg = `${url} ${fileNetStream.statusText}`;
        return Downloader.downloadingList[cacheKey];
      }

      readStream = fileNetStream.data;
      writer = fs.createWriteStream(filePath);
      readStream.pipe(writer);

      await new Promise((resolve, reject) => {
        writer?.on('finish', resolve);
        writer?.on('error', reject);
        readStream?.on('error', reject);
      });

      Downloader.downloadingList[cacheKey].localPath = filePath;
      Downloader.downloadingList[cacheKey].state = 1;
      Downloader.downloadingList[cacheKey].src = cacheKey;

      return Downloader.downloadingList[cacheKey];
    } catch (e) {
      let errMsg = '';
      if (e instanceof AxiosError) {
        errMsg = `网络异常:${e.message}`;
      } else if (e instanceof Error) {
        errMsg = e.message;
      } else {
        errMsg = `${e?.toString() ?? ''}`;
      }
      logger.error(`下载异常失败${errMsg}`);

      // Close streams before deleting file
      if (readStream) {
        try {
          readStream.destroy();
        } catch (e) {}
      }
      if (writer) {
        try {
          writer.close();
        } catch (e) {}
      }

      if (fs.existsSync(filePath)) {
        try {
          await Task.Delay(300);
          fs.unlinkSync(filePath);
        } catch (e) {}
      }

      if (Downloader.downloadingList[cacheKey]) {
        Downloader.downloadingList[cacheKey].state = -1;
        Downloader.downloadingList[cacheKey].msg = `下载失败:${url}:${errMsg}\n`;
      }
      return { localPath: '', state: -1, msg: `下载失败:${url}:${errMsg}\n` };
    } finally {
      // Ensure all streams are properly closed
      if (readStream) {
        try {
          readStream.destroy();
        } catch (e) {}
      }
      if (writer) {
        try {
          writer.close();
        } catch (e) {}
      }

      //清除历史数据
      setTimeout(() => {
        PubConfig.deleteFilesOlderThanGivenDays(PubConfig.userYixiaoerVideoTmpDir, 1);
      }, 60000);
    }
  }
}

const getOssUrl = async (
  authKey: string,
  fileKey: string,
): Promise<{ statusCode: number; data?: string; message?: string }> => {
  try {
    if (fileKey.startsWith('http')) {
      return { statusCode: 0, data: fileKey };
    }
    const tm = Date.now();
    const result = await $http.get(
      `${PubConfig.API_URL}/storages/cloud-publish/access-url?key=tianyiyun&fileKey=${fileKey}&channel=tianyiyun`,
      {
        headers: {
          authToken: authKey,
          authorization: PubConfig.API_Token ? PubConfig.API_Token : generateToken(tm),
          timestamp: tm,
          'x-client': PubConfig.xClient,
        },
      },
    );
    return result.data;
  } catch (e) {
    let errMsg = '';
    if (e instanceof AxiosError) {
      errMsg = `网络异常:${e.message}`;
    } else if (e instanceof Error) {
      errMsg = e.message;
    } else {
      errMsg = `${e?.toString() ?? ''}`;
    }
    return { statusCode: -1, message: errMsg };
  }
};

interface DownloadResult {
  /**
   * 入参url或者key
   */
  src?: string;
  /**
   * 下载后本地路径
   */
  localPath: string;
  state?: number;
  msg?: string;
}

export const generateToken = (timestamp: number): string => {
  const data = `${timestamp}yixiaoer_cloud_publish`;
  return crypto.createHash('md5').update(data).digest('hex');
};

const getArticleContentByUrl = async (
  contentUrl: string,
): Promise<{ statusCode: number; data?: string; message?: string }> => {
  try {
    const tm = Date.now();
    const result = await $http.get(contentUrl, {
      headers: {
        referer: 'lj_publish',
      },
    });
    return result.data;
  } catch (e) {
    let errMsg = '';
    if (e instanceof AxiosError) {
      errMsg = `网络异常:${e.message}`;
    } else if (e instanceof Error) {
      errMsg = e.message;
    } else {
      errMsg = `${e?.toString() ?? ''}`;
    }
    return { statusCode: -1, message: errMsg };
  }
};
