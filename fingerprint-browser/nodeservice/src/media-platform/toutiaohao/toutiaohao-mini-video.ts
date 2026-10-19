import { EventEmitter } from 'events';
import { ToutiaohaoPublishResultOutput } from './toutiaohao-article';
import fs from 'fs';
import { errorCode } from '../../media-platform/errorCode';
import {
  Guid,
  logger,
  publishStatusEnum,
  SetProgressEvent,
  SetProgressNewEvent,
  Task,
  UploadEmitGate,
} from '../../utils';
import {
  checkVideoUpload,
  getAuthKey,
  getSdkToken,
  getUploadedVideoInfo,
  getVideoUploadArgs,
  publish,
  uploadCover,
  UploadedImageInfo,
  UploadedVideoInfo,
  UploadPartResult,
  uploadVideoPart,
} from './toutiaohao-video.service';
import { AxiosError } from 'axios';
import { createHttpInstance, HttpConfig } from '../../http';
import { aws4Interceptor } from 'aws4-axios';

import { CancelToken, privateKey } from '../../utils/CancelToken';
import { getXiguaToken } from '../toutiaohao/toutiaohao-base.service';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { ITask } from '@/media-platform/baseTask';

/**
 *
 * @param cookie
 * @param taskData
 * @param eventCallback
 * @param userId 用户id，来自获取用户信息中的userid
 * @param maxThread 并发上传数，默认3
 * @param retryTimes 失败重试次数 ，默认3
 */
export const publishToutiaohaoMiniVideo = async (
  cookie: string,
  taskData: ToutiaohaoMiniVideoTaskInput,
  eventCallback: EventEmitter,
  userId: string = '',
  maxThread: number = 3,
  retryTimes: number = 3,
): Promise<ToutiaohaoPublishResultOutput> => {
  logger.info(`头条竖版发布 ${taskData.taskId} ${userId}`);

  const pubResult: ToutiaohaoPublishResultOutput = {
    code: 0,
    msg: '',
    taskId: taskData.taskId,
  };
  try {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploading, '开始发布', taskData.taskId);
    let webProxy: HttpsProxyAgent<string> | object | undefined = undefined;
    if (taskData.proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(taskData.proxy);
    }
    if (!fs.existsSync(taskData.video.localPath?.toString() ?? '')) {
      pubResult.code = errorCode.io_error;
      pubResult.msg = '视频文件不存在:' + taskData.video.localPath;
      logger.error(`视频文件不存在 ${taskData.taskId} ${taskData.video.localPath}`);
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult?.msg ? pubResult.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }

    SetProgressEvent(eventCallback, 1, '准备上传中', taskData.taskId);

    // region 准备发布上传前置数据

    SetProgressEvent(eventCallback, 3, '正在获取上传参数', taskData.taskId);

    if (!cookie?.includes('xigua_csrf_token')) {
      let tokenStr = await getXiguaToken(cookie);

      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      for (let i = 0; i < 3; i++) {
        if (tokenStr?.length > 0) {
          break;
        }
        await Task.Delay(1000);
        tokenStr = await getXiguaToken(cookie);
      }
      if (tokenStr?.length > 0) {
        cookie = `${cookie};${tokenStr.map((obj) => obj.split(';')[0]).join(';')}`;
      } else {
        cookie = `${cookie};${tokenStr.join(';')}`;
      }
    }

    // if (!userId)
    // {
    //     const userInfo = await getUserInfoAsync(cookie);
    //     if (userInfo?.data?.user?.id) {
    //       userId = userInfo.data.user.id.toString();
    //     }
    //   }
    // }

    // 获取上传认证参数
    // endregion
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // region 视频上传
    let uploadVideoInfo = await uploadVideo(taskData, pubResult, eventCallback, userId, maxThread, cookie);
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      if (!uploadVideoInfo || !(uploadVideoInfo?.Result?.Results?.length > 0)) {
        if (i < retryTimes - 1 && uploadVideoInfo?.status_code != 8 && pubResult?.code != 8) {
          SetProgressEvent(eventCallback, 4, '上传失败,重试中', taskData.taskId);
          uploadVideoInfo = await uploadVideo(taskData, pubResult, eventCallback, userId, maxThread, cookie);
          continue;
        }
        logger.error(
          `视频上传失败 ${taskData.taskId} ${cookie} ${JSON.stringify(uploadVideoInfo)} ${JSON.stringify(pubResult)}`,
        );
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploadFail,
          pubResult?.msg ? pubResult.msg : '上传失败',
          taskData.taskId,
        );
        return pubResult;
      } else {
        break;
      }
    }
    if (!uploadVideoInfo) {
      pubResult.code = -2;
      pubResult.msg = '视频上传失败，请稍后重试重试';
      logger.error(
        `视频上传失败 ${taskData.taskId} ${cookie} ${JSON.stringify(uploadVideoInfo)} ${JSON.stringify(pubResult)}`,
      );
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult?.msg ? pubResult.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }
    // endregion

    // region 封面上传

    SetProgressEvent(eventCallback, 90, '封面上传中', taskData.taskId);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    let uploadedCoverInfo: UploadedImageInfo | null = await uploadCover(
      cookie,
      userId,
      taskData.cover.pathOrUrl,
      taskData.taskId,
      pubResult,
    );
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      if (!uploadedCoverInfo?.data || !(uploadedCoverInfo?.data?.length > 0)) {
        if (i < retryTimes - 1) {
          uploadedCoverInfo = await uploadCover(cookie, userId, taskData.cover.pathOrUrl, taskData.taskId, pubResult);
          continue;
        }

        pubResult.code = -1;
        pubResult.msg = `封面上传失败:${uploadedCoverInfo?.message ?? ''}`;
        logger.error(
          `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${JSON.stringify(
            uploadedCoverInfo,
          )} ${JSON.stringify(pubResult)}`,
        );
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploadFail,
          pubResult?.msg ? pubResult.msg : '上传失败',
          taskData.taskId,
        );
        return pubResult;
      }
      break;
    }

    if (uploadedCoverInfo == null) {
      logger.error(
        `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${JSON.stringify(
          uploadedCoverInfo,
        )} ${JSON.stringify(pubResult)}`,
      );
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult?.msg ? pubResult.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);

    // endregion
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // region 组装并推送数据
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    // 组装发布数据
    const postData = buildPostData(taskData, uploadedCoverInfo, uploadVideoInfo);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    const sdkToken = await getSdkToken(cookie);

    const csrfToken = cookie.split('xigua_csrf_token=')[1]?.split(';')[0];
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    //不可取消
    taskData.cancelToken?.disable(privateKey);
    //推送数据
    const publishResult = await publish(cookie, sdkToken, csrfToken, postData, taskData.taskId, webProxy);

    pubResult.code = publishResult.status ?? errorCode.data_error;
    pubResult.msg =
      publishResult?.data?.Message ?? publishResult?.data?.BaseResp?.StatusMessage ?? publishResult.message ?? '';
    pubResult.publishId = publishResult?.data?.ItemId;

    if (pubResult.publishId) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      pubResult.code = pubResult?.code != 0 ? pubResult?.code : -1;
      logger.error(`头条竖版视频发布失败 ${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(publishResult)}`);
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
    }

    return pubResult;
    // endregion
  } catch (e) {
    SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);

    // 统一异常失败处理
    pubResult.code = -1;

    if (e instanceof AxiosError) {
      pubResult.code = errorCode.request_error;
      pubResult.msg = `网络异常:${e.message}`;
      pubResult.errorInfo = e.stack?.toString();
    } else if (e instanceof Error) {
      pubResult.code = errorCode.data_error;
      pubResult.msg = e.message;
      pubResult.errorInfo = e.stack?.toString();
    } else {
      pubResult.msg = '发布失败，请查看详细错误信息';
      pubResult.errorInfo = e?.toString();
    }
    SetProgressNewEvent(
      eventCallback,
      publishStatusEnum.pushFail,
      pubResult?.msg ? pubResult.msg : '推送失败',
      taskData.taskId,
    );
    logger.error(`头条竖版视频发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};

/**
 * 抖音视频发布入参
 */
export interface ToutiaohaoMiniVideoTaskInput extends ITask {
  cancelToken?: CancelToken;
  /**
   * 任务唯一标志id
   */
  taskId: string;
  /**
   * 视频信息
   */
  video: {
    /**
     * 时长-秒-可带小数
     */
    duration?: number;
    /**
     * 视频宽度
     */
    width?: number;
    /**
     * 视频高度
     */
    height?: number;
    /**
     * 视频字节数大小
     */
    size?: number;
    /**
     * 视频本地路径
     */
    localPath: string;
  };
  /**
   * 封面信息
   */
  cover: {
    /**
     * 封面宽度
     */
    width?: number;
    /**
     * 封面高度
     */
    height?: number;
    /**
     * 封面字节数大小
     */
    size?: number;
    /**
     * 封面url或本地路径
     */
    pathOrUrl: string;
  };
  /**
   * 标题
   */
  title: string;

  /**
   * 作品申明
   */
  complianceInfo?: {
    /**
     * 1:自行拍摄
     * 2:取自站外
     * 3:AI生成
     * 6:虚构演绎，故事经历
     * 7:投资观点，仅供参考
     * 8:健康医疗分享，仅供参考
     */
    complianceType?: 1 | 2 | 3 | 6 | 7 | 8;
  };

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}

/**
 * 视频上传完整过程
 * @param taskData 任务数据
 * @param pubResult 发布结果对象
 * @param eventCallback 回调事件对象
 * @param userId 用户id
 * @param maxThread 最大并发上传数
 * @param cookie
 */
export const uploadVideo = async (
  taskData: ToutiaohaoMiniVideoTaskInput,
  pubResult: ToutiaohaoPublishResultOutput,
  eventCallback: EventEmitter,
  userId: string,
  maxThread: number,
  cookie: string,
): Promise<UploadedVideoInfo | null | undefined> => {
  let fileHandle: fs.promises.FileHandle | null = null;
  try {
    // 获取上传认证参数
    let authData = await getAuthKey(cookie);
    if (!authData?.data?.uploadToken) {
      authData = await getAuthKey(cookie);
    }
    if (!authData?.data?.uploadToken) {
      // console.debug('获取认证参数失败', taskData.taskId, authData);
      pubResult.code = authData.status;
      pubResult.msg = '获取认证参数失败:' + (authData.message ?? '');

      return null;
    }
    // 获取文件信息
    const fileStat = await fs.promises.stat(taskData.video.localPath);
    fileHandle = await fs.promises.open(taskData.video.localPath, 'r');

    // 提取认证信息
    const authResult = authData.data.uploadToken;

    // 初始化 http
    const $httpSign = createHttpInstance();
    $httpSign.interceptors.request.use(
      aws4Interceptor({
        instance: $httpSign,
        options: {
          region: 'cn-north-1',
          service: 'vod',
        },
        credentials: {
          accessKeyId: authResult.AccessKeyId,
          secretAccessKey: authResult.SecretAccessKey,
          sessionToken: authResult.SessionToken,
        },
      }),
    );

    // 获取上传参数
    let uploadVideoArgs = await getVideoUploadArgs(fileStat.size, userId, $httpSign, 'video', authData.data.spaceName);
    if (!uploadVideoArgs?.Result?.InnerUploadAddress?.UploadNodes) {
      uploadVideoArgs = await getVideoUploadArgs(fileStat.size, userId, $httpSign, 'video', authData.data.spaceName);
    }
    if (!uploadVideoArgs?.Result?.InnerUploadAddress?.UploadNodes) {
      // console.debug('获取上传参数失败', taskData.taskId, uploadVideoArgs);

      pubResult.code = uploadVideoArgs.status_code;
      pubResult.msg = '获取上传参数失败:' + (uploadVideoArgs.status_msg ?? uploadVideoArgs?.Error?.Message ?? '');

      return null;
    }

    // 准备上传分片信息列表
    const uploadedList: Map<number, string> = new Map<number, string>();

    // 上传id
    const uploadId = Guid.NewGuid().toString();

    // 开始读取并上传文件
    let readIndex = 0;

    // 分片大小
    let blockSize = 3145728; // 50M以下的视频，分片大小为3M，500M以上的视频，分片大小为5M，1G以上的视频大小为10M
    if (fileStat.size > 1024 * 1024 * 50) {
      blockSize = 1024 * 1024 * 5;
    } else if (fileStat.size > 1024 * 1024 * 1024) {
      blockSize = 1024 * 1024 * 10;
    }

    // 总片数
    const totalPartNums = Math.ceil(fileStat.size / blockSize);

    // 并行上传
    const tasks: Array<Promise<UploadPartResult>> = [];

    let uploadedParts = 0;
    const emitGate = new UploadEmitGate(fileStat.size, totalPartNums);
    const onPartUploaded = () => {
      uploadedParts++;
      if (emitGate.shouldEmit(uploadedParts)) {
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploading,
          '视频上传中',
          taskData.taskId,
          totalPartNums,
          uploadedParts,
          taskData.needParts === true,
        );
      }
    };

    SetProgressNewEvent(
      eventCallback,
      publishStatusEnum.uploading,
      '视频上传中',
      taskData.taskId,
      totalPartNums,
      uploadedParts,
      taskData.needParts === true,
    );
    // 文件大小小于等单个分片大小
    if (blockSize >= fileStat.size) {
      const buffer = Buffer.alloc(fileStat.size);
      const readData = await fileHandle.read(buffer, 0, fileStat.size, readIndex);
      if (readData.buffer.length > 0) {
        const uploadResult = await uploadVideoPart(readData.buffer, 1, blockSize, userId, uploadId, uploadVideoArgs);
        if (!uploadResult?.data?.crc32) {
          pubResult.code = uploadResult.code;
          pubResult.msg = '视频分片上传失败:' + uploadResult.message;

          return null;
        }
        uploadedList.set(uploadResult.partNum, uploadResult.data.crc32);
      } else {
        pubResult.code = errorCode.io_error;
        pubResult.msg = '文件读取失败:' + taskData.video.localPath;

        return null;
      }
    }
    // 文件有多个分片
    else {
      let partNum = 0;
      while (readIndex < fileStat.size) {
        partNum++;
        //
        // SetProgressEvent(
        //   eventCallback,
        //   10 + Number.parseFloat(((partNum / totalPartNums) * 0.7 * 100).toFixed(2).substring(0, 4)),
        //   '视频上传中',
        //   taskData.taskId,
        // );

        let canReadNum = blockSize;
        let buffer = Buffer.alloc(blockSize);
        if (readIndex + blockSize > fileStat.size) {
          canReadNum = fileStat.size - readIndex;
          buffer = Buffer.alloc(canReadNum);
        }

        const readData = await fileHandle.read(buffer, 0, canReadNum, readIndex);
        if (readData.buffer.length > 0) {
          tasks.push(uploadVideoPart(readData.buffer, partNum, blockSize, userId, uploadId, uploadVideoArgs));

          if (tasks.length > maxThread) {
            const uploadResult = await Promise.race(tasks);
            if (!uploadResult?.data?.crc32) {
              pubResult.code = uploadResult.code;
              pubResult.msg = '视频分片上传失败:' + uploadResult.message;

              return null;
            }

            uploadedList.set(uploadResult.partNum, uploadResult.data.crc32);
            onPartUploaded();
            const uploadResultNew = await tasks.splice(0, 1)[0];
            if (!uploadResultNew?.data?.crc32) {
              pubResult.code = uploadResultNew.code;
              pubResult.msg = '视频分片上传失败:' + uploadResultNew.message;

              return null;
            }

            uploadedList.set(uploadResultNew.partNum, uploadResultNew.data.crc32);
            onPartUploaded();
          }

          readIndex += readData.buffer.length;

          if (canReadNum < blockSize) {
            break;
          }
        } else {
          pubResult.code = errorCode.io_error;
          pubResult.msg = '文件读取失败:' + taskData.video.localPath;

          return null;
        }
      }
    }
    while (tasks.length > 0) {
      const uploadResult = await tasks.splice(0, 1)[0];
      if (!uploadResult?.data?.crc32) {
        pubResult.code = uploadResult.code;
        pubResult.msg = '视频分片上传失败:' + uploadResult.message;

        return null;
      }
      uploadedList.set(uploadResult.partNum, uploadResult.data?.crc32 ?? '');
      onPartUploaded();
    }

    const uploadStrList: Array<string> = [];

    if (uploadedList.size < totalPartNums) {
      // console.debug('视频上传失败', taskData.taskId, uploadedList);
      pubResult.code = errorCode.io_error;
      pubResult.msg = '视频上传失败:' + taskData.video.localPath;

      return null;
    }

    for (let i = 1; i <= uploadedList.size; i++) {
      uploadStrList.push(`${i}:${uploadedList.get(i)}`);
    }

    const uploadResultList = uploadStrList.join(',');

    // 检查视频上传是否成功
    let checkResult = await checkVideoUpload(userId, uploadId, uploadResultList, uploadVideoArgs);
    if (!checkResult?.data?.hash) {
      checkResult = await checkVideoUpload(userId, uploadId, uploadResultList, uploadVideoArgs);
    }
    if (!checkResult.data?.hash) {
      // console.debug('视频上传校验失败', taskData.taskId, uploadedList, checkResult);

      pubResult.code = -1;
      pubResult.msg = '上传校验失败:' + (checkResult.message ?? '');

      return null;
    }

    SetProgressNewEvent(
      eventCallback,
      publishStatusEnum.uploading,
      '视频上传中',
      taskData.taskId,
      totalPartNums,
      totalPartNums,
      taskData.needParts === true,
    );
    //获取上传完成的视频信息
    let uploadVideoInfo = await getUploadedVideoInfo(userId, uploadVideoArgs, authData.data.spaceName, $httpSign);
    if (!(uploadVideoInfo?.Result?.Results?.length > 0)) {
      uploadVideoInfo = await getUploadedVideoInfo(userId, uploadVideoArgs, authData.data.spaceName, $httpSign);
    }
    if (!(uploadVideoInfo?.Result?.Results?.length > 0)) {
      // console.debug('获取视频信息失败', taskData.taskId, uploadedList, uploadVideoInfo);

      pubResult.code = -1;
      pubResult.msg = '获取视频信息失败:' + (uploadVideoInfo.status_msg ?? '');

      return null;
    }
    pubResult.code = 0;
    pubResult.msg = '';
    return uploadVideoInfo;
    // endregion
  } catch (e) {
    logger.error(`头条号横版视频上传异常失败，${taskData.taskId},${(e as Error)?.message}`);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = '视频上传失败';
    return null;
  } finally {
    fileHandle?.close();
  }
};

/**
 * 组装发布参数
 * @param taskData
 * @param coverInfo
 * @param videoInfoIn
 */
const buildPostData = (
  taskData: ToutiaohaoMiniVideoTaskInput,
  coverInfo: UploadedImageInfo,
  videoInfoIn: UploadedVideoInfo,
): string => {
  const video = videoInfoIn.Result.Results[0].VideoMeta;

  const rePostData = {
    ItemId: '',
    //标题
    Title: taskData.title ?? '',
    VideoInfo: {
      Vid: videoInfoIn.Result.Results[0].Vid,
      VName: `${taskData.title ?? '视频1'}.mp4`,
      ThumbUri: coverInfo?.data[0]?.uri ?? '',
      ThumbUrl: coverInfo?.data[0]?.uri ?? '',
      Duration: video.Duration,
      VideoWidth: video.Width,
      VideoHeight: video.Height,
    },
    ClaimOrigin: false,
    Praise: false,
    PublishType: 1,
    From: 'mp',
    EnterFrom: 5,
    IsNew: true,
    VideoType: 6,
    ExternalLink: '',
    Label: [],
    CompassVideo: {
      CompassVideoId: '',
      CompassVideoName: '',
      CompassVideoType: 0,
    },
    Commodity: [],
    CreateSource: 2,
    HideInfo: {
      HideType: 0,
    },
    CoverTitles: [],
    TemplateName: '',
    FilterName: '',
    AttrsValueMap: {},
    etData: {},
    TerminalType: '01',
    OsType: '09',
    SoftType: 'chrome 108.0.5359.215',
    DevicePlatform: 'pc',
  };

  //申明
  if (taskData.complianceInfo?.complianceType) {
    if (taskData.complianceInfo.complianceType === 1) {
      rePostData['ComplianceInfo'] = { IsAIGC: false, ComplianceType: 1, CreativeInfo: {} };
    } else if (taskData.complianceInfo.complianceType === 2) {
      rePostData['ComplianceInfo'] = { IsAIGC: false, ComplianceType: 2, MaterialInfo: { MaterialSource: 2 } };
    } else {
      rePostData['ComplianceInfo'] = {
        IsAIGC: taskData.complianceInfo.complianceType === 3,
        ComplianceType: taskData.complianceInfo.complianceType,
      };
    }
  }
  const agentPart = HttpConfig.userAgent.split('/');
  rePostData.SoftType = `chrome ${agentPart[agentPart.length - 1]}`;
  return JSON.stringify(rePostData);
};
