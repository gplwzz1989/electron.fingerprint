import { CancelToken, privateKey } from '../../utils/CancelToken';
import {
  Guid,
  logger,
  publishStatusEnum,
  Random,
  readImageData,
  SetProgressEvent,
  SetProgressNewEvent,
  stepWaitTime,
  Task,
  UploadEmitGate,
} from '../../utils';
import { EventEmitter } from 'events';
import fs from 'fs';
import { errorCode } from '../../media-platform/errorCode';
import { BaseResult } from '../../media-platform/baseResult';
import { AxiosError } from 'axios';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';
import {
  cutCoverImage,
  getImageUploadKeyResponse,
  getVideoUploadKeyResponse,
  MeiYouUploadResponse,
  publishMeiYouVideoResponse,
  uploadVideoPartBytes,
  uploadVideoPartStream,
} from './meiyou-video-service';
import path from 'path';
import dayjs from 'dayjs';

export const uploadVideo = async (
  taskData: MeiYouVideoTaskInput,
  eventCallback: EventEmitter,
  pubResult: MeiYouPublishVideoResultOutput,
  fileStat: fs.Stats,
  maxThread: number,
  cookie: string,
): Promise<MeiYouUploadResponse | null | undefined> => {
  try {
    const fileKey = `news/vod/${Guid.NewGuid()
      .toString()
      ?.replace(/-/g, '')
      ?.substring(0, 13)}${Date.now()}${new Random().Next(1111111, 5555555)}_0_0.mp4`;
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    const uploadArgs = await getVideoUploadKeyResponse(cookie, fileKey);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    //提取上传key参数
    if (!uploadArgs?.data?.video?.AccessKeySecret) {
      // console.debug('获取视频上传参数失败', taskData.taskId, uploadArgs);
      pubResult.code = uploadArgs?.code ?? errorCode.data_error;
      pubResult.msg = '获取视频上传参数失败:' + (uploadArgs?.message ?? '');
      if (pubResult.code === 2185) {
        pubResult.msg = '账号未完成作者认证，请打开美柚创作者中心认证后重试';
      }
      return null;
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    const fileName = path.basename(taskData.video.localPath);

    const totalPartNums = 1;
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

    const result = await uploadVideoPartStream(taskData.video.localPath, fileName, fileKey, uploadArgs, 'video/mp4');

    SetProgressNewEvent(
      eventCallback,
      publishStatusEnum.uploading,
      '视频上传中',
      taskData.taskId,
      totalPartNums,
      totalPartNums,
      taskData.needParts === true,
    );

    if (result?.code != 0) {
      // console.debug('视频上传校验失败', taskData.taskId, result, uploadArgs);
      pubResult.code = -1;
      pubResult.msg = `上传校验失败:${result?.message ?? ''}`;
      return null;
    }
    pubResult.code = 0;
    pubResult.msg = '';
    result.key = fileKey;
    result.url = uploadArgs.data.video.domain + fileKey;
    return result;
    // endregion
  } catch (e) {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    logger.error(`美柚视频上传异常失败，${taskData.taskId},${(e as Error)?.message}`);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = `视频上传失败:${(e as Error)?.message ?? (e as AxiosError)?.message ?? ''}`;
    return null;
  } finally {
  }
};

export const uploadCoverProcess = async (
  taskData: MeiYouVideoTaskInput,
  eventCallback: EventEmitter,
  cookie: string,
  pubResult: MeiYouPublishVideoResultOutput,
): Promise<MeiYouUploadResponse | null | undefined> => {
  try {
    SetProgressEvent(eventCallback, 90, '封面上传中', taskData.taskId);

    //读取图片数据
    const imageData = await readImageData(taskData.cover.pathOrUrl, 'jpeg');

    if (!imageData?.data?.length) {
      pubResult.msg = '读取图片失败';
      pubResult.code = errorCode.io_error;
      return null;
    }

    taskData.cancelToken?.throwIfCancelled(privateKey);

    const fileKey = `news/img/${Guid.NewGuid().toString()}_${new Random().Next(1111, 9999)}_${new Random().Next(
      1111,
      9999,
    )}.png`;
    //获取图片上传参数
    const uploadCoverArgs = await getImageUploadKeyResponse(cookie, fileKey);
    taskData.cancelToken?.throwIfCancelled(privateKey);

    //提取图片上传参数
    if (!uploadCoverArgs?.data?.image?.AccessKeySecret) {
      // console.debug('获取图片上传参数失败', taskData.taskId, uploadCoverArgs);
      pubResult.code = uploadCoverArgs?.code ?? errorCode.data_error;
      pubResult.msg = '获取图片上传参数失败:' + (uploadCoverArgs?.message ?? '');
      return null;
    }

    const fileName = Date.now() + '.png';

    const imageResult = await uploadVideoPartBytes(imageData.data, fileName, fileKey, uploadCoverArgs, 'image/png');
    if (imageResult?.code != 0) {
      pubResult.msg = `封面上传失败${imageResult?.message ?? ''}`;
      pubResult.code = errorCode.io_error;
      return null;
    }
    //裁剪

    const upUrl = uploadCoverArgs.data.image.endpoint + fileKey;
    const cutImage = await cutCoverImage(uploadCoverArgs.data.image.endpoint + fileKey, cookie);
    if (cutImage?.data?.url) {
      imageResult.url = cutImage.data?.url;
    } else {
      pubResult.msg = cutImage.message;
      pubResult.code = cutImage.code;
      return null;
      //imageResult.url = upUrl;
    }

    taskData.cancelToken?.throwIfCancelled(privateKey);
    pubResult.code = 0;
    pubResult.msg = '';
    imageResult.key = fileKey;
    return imageResult;
    //endregion
  } catch (e) {
    taskData.cancelToken?.throwIfCancelled(privateKey);
    console.error('封面上传失败', taskData.taskId, e);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = `封面上传失败${(e as Error)?.message ?? (e as AxiosError)?.message ?? ''}`;
    return null;
  }
};

/**
 * 发布美柚书视频
 * @param cookie
 * @param taskData 视频发布任务体
 * @param eventCallback 事件回调
 * @param maxThread 最大并发上传数
 * @param retryTimes 最大重试次数
 */
export const publishMeiYouVideo = async (
  cookie: string,
  taskData: MeiYouVideoTaskInput,
  eventCallback: EventEmitter,
  maxThread: number = 3,
  retryTimes: number = 3,
): Promise<MeiYouPublishVideoResultOutput> => {
  logger.info(`美柚视频发布 ${taskData.taskId}`);
  const pubResult: MeiYouPublishVideoResultOutput = {
    code: 0,
    msg: '',
    taskId: taskData.taskId,
  };
  try {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploading, '开始发布', taskData.taskId);
    if (!fs.existsSync(taskData.video.localPath?.toString() ?? '')) {
      pubResult.code = errorCode.io_error;
      pubResult.msg = '视频文件不存在:' + taskData.video.localPath;
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult?.msg ? pubResult.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }
    let webProxy: HttpsProxyAgent<string> | object | undefined = undefined;
    if (taskData.proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(taskData.proxy);
    }
    SetProgressEvent(eventCallback, 1, '准备上传中', taskData.taskId);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // region 获取发布前置准备参数
    //获取文件信息
    const fileStat = await fs.promises.stat(taskData.video.localPath);
    taskData.video.size = fileStat.size;

    SetProgressEvent(eventCallback, 3, '正在获取上传参数', taskData.taskId);

    // endregion
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // region 视频上传
    let uploadedVideoArgs = await uploadVideo(taskData, eventCallback, pubResult, fileStat, maxThread, cookie);
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      if (uploadedVideoArgs?.code != 0) {
        if (i < retryTimes - 1 && pubResult?.code != -100) {
          SetProgressEvent(eventCallback, 4, '上传失败,重试中', taskData.taskId);
          uploadedVideoArgs = await uploadVideo(taskData, eventCallback, pubResult, fileStat, maxThread, cookie);
          continue;
        }
        pubResult.code = pubResult?.code ?? errorCode.data_error;
        pubResult.msg = pubResult?.msg ?? '视频上传失败';
        logger.error(`视频上传失败 ${taskData.taskId} ${cookie} ${uploadedVideoArgs} ${JSON.stringify(pubResult)}`);
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
    if (uploadedVideoArgs?.code != 0) {
      pubResult.code = pubResult?.code ?? errorCode.data_error;
      pubResult.msg = pubResult?.msg ?? '视频上传失败';
      logger.error(`视频上传失败 ${taskData.taskId} ${cookie} ${uploadedVideoArgs} ${JSON.stringify(pubResult)}`);
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult?.msg ? pubResult.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }
    //endregion

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // region 封面上传
    let coverUploadRe = await uploadCoverProcess(taskData, eventCallback, cookie, pubResult);
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      if (!coverUploadRe?.key) {
        await Task.Delay(stepWaitTime);
        coverUploadRe = await uploadCoverProcess(taskData, eventCallback, cookie, pubResult);
      } else {
        break;
      }
    }
    if (!coverUploadRe?.key) {
      pubResult.code = pubResult?.code ?? errorCode.data_error;
      pubResult.msg = pubResult?.msg ?? '封面上传失败';
      logger.error(
        `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${JSON.stringify(pubResult)}`,
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
    // endregion
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    // region 组装并推送数据
    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    const postData = buildPublishPostData(taskData, coverUploadRe, uploadedVideoArgs);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);
    //组装发布数据
    // console.debug('美柚视频推送数据', taskData.taskId, cookie, postData);

    const publishResult = await publishMeiYouVideoResponse(cookie, postData, webProxy);
    // console.debug('美柚视频推送返回数据', taskData.taskId, cookie, publishResult);

    pubResult.code = publishResult?.code ?? -1;
    pubResult.msg = publishResult?.message ?? '';
    pubResult.publishId = publishResult?.data?.newsId?.toString();
    if (pubResult.code == 0 && pubResult.publishId) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      pubResult.code = pubResult?.code === 0 ? -1 : publishResult.code;
      pubResult.msg = `发布失败${publishResult['message'] ?? ''}`;
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
      logger.error(`美柚视频发布失败 ${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(publishResult)}`);
    }

    return pubResult;
    // endregion
  } catch (e) {
    SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
    //统一异常失败处理
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
      pubResult.msg = `发布失败，${e?.toString() ?? ''}`;
      pubResult.errorInfo = e?.toString();
    }
    SetProgressNewEvent(
      eventCallback,
      publishStatusEnum.pushFail,
      pubResult?.msg ? pubResult.msg : '推送失败',
      taskData.taskId,
    );
    logger.error(`美柚视频发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};

export interface MeiYouPublishVideoResultOutput extends BaseResult {
  /**
   * 任务唯一标志id
   */
  taskId: string;

  /**
   * 详细错误
   */
  errorInfo?: string;

  /**
   * 发布产生唯一id
   */
  publishId?: string;
}

export interface MeiYouVideoTaskInput {
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
  title?: string;

  /**
   * 定时发布时间戳
   */
  publishTime?: number;

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;

  /**
   * 是否需要上传分片进度
   */
  needParts?: boolean;
}

export const buildPublishPostData = (
  taskData: MeiYouVideoTaskInput,
  coverUrl: MeiYouUploadResponse,
  videoInfo: MeiYouUploadResponse,
): string => {
  const argList: Array<string> = [];

  argList.push('action=add&id=&type=12&status=12');
  argList.push(`title=${encodeURIComponent(taskData.title ?? '')}`);
  argList.push('video%5Btime%5D=00%3A07');
  argList.push(`video%5Bthumb%5D=${encodeURIComponent(coverUrl.url)}`);
  argList.push(`video%5Burl%5D=${encodeURIComponent(videoInfo.url)}`);
  argList.push(
    `video%5Bremark%5D=&video%5Bbt_rate%5D=11507&video%5Bsize%5D=${taskData.video.size ?? 1021223}&video%5Bwidth%5D=${
      taskData.video.width ?? 1080
    }&video%5Bheight%5D=${taskData.video.height ?? 1920}`,
  );

  if (taskData.publishTime) {
    argList.push('auto_publish=1');
    argList.push(`published_date=${encodeURIComponent(dayjs(taskData.publishTime).format('YYYY-MM-DD HH:mm:ss'))}`);
  }

  argList.push(`is_original=0&is_activities=0&is_seedlings=0&is_hot=0`);

  return argList.join('&');
};
