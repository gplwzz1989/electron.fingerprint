import fs from 'fs';
import { BaseResult } from '../baseResult';
import { errorCode } from '../errorCode';
import {
  logger,
  publishStatusEnum,
  readImageData,
  SetProgressEvent,
  SetProgressNewEvent,
  Task,
  UploadEmitGate,
} from '../../utils';
import { AxiosError } from 'axios';
import { EventEmitter } from 'events';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import path from 'path';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import * as buffer from 'buffer';
import dayjs from 'dayjs';
import {
  CheJiaHaoBaseResponse,
  CheJiaHaoUploadArgsResponse,
  CheJiaHaoVideoPublishResponse,
  finishUploadCheJiaHaoVideoResponse,
  getCheJiaHaoImageUploadToken,
  getCheJiaHaoUploadArgsResponse,
  getCheJiaHaoUploadPreResponse,
  getVideoStateResponse,
  saveDraftCheJiaHaoVideoResponse,
  uploadCheJiaHaoImageResponse,
  uploadCheJiaHaoVideoPartResponse,
  UploadImageInfoResponse,
} from '@/media-platform/chejiahao/chejiahao-video-service';
import { HtmlAgilityPack } from '@/article-parse/common/HtmlAgilityPack';
import { ITask } from '@/media-platform/baseTask';

/**
 *
 * @param taskData 任务体
 * @param eventCallback 事件回调
 * @param fileStat 文件句柄
 * @param pubResult 发布结果
 * @param maxThread 最大并发上传
 * @param cookie
 */
const uploadVideo = async (
  taskData: CheJiaHaoVideoTaskInput,
  eventCallback: EventEmitter,
  fileStat: fs.Stats,
  pubResult: CheJiaHaoPublishResultOutput,
  maxThread: number,
  cookie: string,
): Promise<CheJiaHaoUploadArgsResponse | null | undefined> => {
  let fileHandle: fs.promises.FileHandle | null = null;
  try {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    //SetProgressEvent(eventCallback, 5, '正在获取上传参数', taskData.taskId);

    //获取上传参数
    const fileName = path.basename(taskData.video.localPath);
    const uploadPre = await getCheJiaHaoUploadPreResponse(cookie);
    await Task.Delay(2300);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (!uploadPre?.result?.sign) {
      // console.debug('获取视频预上传参数失败', taskData.taskId, uploadPre);
      pubResult.code = errorCode.data_error;
      pubResult.msg = uploadPre?.message ? uploadPre?.message : '获取视频预上传参数失败';
      return null;
    }

    const uploadArgs = await getCheJiaHaoUploadArgsResponse(cookie, fileName, fileStat.size, uploadPre);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!uploadArgs?.result?.id) {
      // console.debug('获取视频上传参数失败', taskData.taskId, uploadArgs);
      pubResult.code = errorCode.data_error;
      pubResult.msg = uploadArgs?.message ? uploadArgs?.message : '获取视频上传参数失败';
      return null;
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // 获取文件句柄
    fileHandle = await fs.promises.open(taskData.video.localPath, 'r');

    // 开始读取并上传文件
    let readIndex = 0;

    // 分片大小 8M
    const blockSize = 10485760;
    //总片数
    const totalPartNums = Math.ceil(fileStat.size / blockSize);

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
      0,
      taskData.needParts === true,
    );

    //SetProgressEvent(eventCallback, 8, ' 正在上传视频', taskData.taskId);

    // 并行上传
    const tasks: Array<Promise<CheJiaHaoBaseResponse>> = [];

    const ctxs: Map<number, string> = new Map<number, string>();

    // SetProgressEvent(eventCallback, 10, '视频上传中', taskData.taskId);

    // const fileName = path.basename(taskData.video.localPath);
    // 文件大小小于等单个分片大小
    if (blockSize >= fileStat.size) {
      const buffer = Buffer.alloc(fileStat.size);
      const readData = await fileHandle.read(buffer, 0, fileStat.size, readIndex);
      if (readData.buffer.length > 0) {
        const uploadResult = await uploadCheJiaHaoVideoPartResponse(
          cookie,
          readData.buffer,
          uploadPre,
          uploadArgs,
          0,
          0,
          ctxs,
        );

        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);

        if (uploadResult?.returncode) {
          // console.debug('视频分片上传失败', taskData.taskId, uploadResult);
          pubResult.msg = `视频分片上传失败${uploadResult?.message ?? ''}`;
          pubResult.code = errorCode.data_error;

          return null;
        }
        //onPartUploaded();
      } else {
        pubResult.code = errorCode.io_error;
        pubResult.msg = '文件读取失败:' + taskData.video.localPath;
        return null;
      }
    }
    // 文件有多个分片
    else {
      let partNum = -1;
      while (readIndex < fileStat.size) {
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);

        partNum++;
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
          tasks.push(
            uploadCheJiaHaoVideoPartResponse(cookie, readData.buffer, uploadPre, uploadArgs, partNum, readIndex, ctxs),
          );

          if (tasks.length > maxThread) {
            const uploadResult = await Promise.race(tasks);

            if (uploadResult?.returncode) {
              // console.debug('视频分片上传失败', taskData.taskId, uploadResult);
              pubResult.msg = `视频分片上传失败${uploadResult?.message ?? ''}`;
              pubResult.code = errorCode.data_error;
              return null;
            }
            //去除第一个任务，并等待完成
            const uploadResultNew = await tasks.splice(0, 1)[0];

            if (uploadResultNew?.returncode) {
              // console.debug('视频分片上传失败', taskData.taskId, uploadResultNew);
              pubResult.msg = `视频分片上传失败${uploadResultNew?.message ?? ''}`;
              pubResult.code = errorCode.data_error;
              return null;
            }
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

      if (uploadResult?.returncode) {
        // console.debug('视频分片上传失败', taskData.taskId, uploadResult);
        pubResult.msg = `视频分片上传失败${uploadResult?.message ?? ''}`;
        pubResult.code = errorCode.data_error;
        return null;
      }
      onPartUploaded();
    }

    //SetProgressEvent(eventCallback, 81, '视频上传完成', taskData.taskId);

    //视频上传完成
    let ctxStr = '';
    const ctxList: Array<{ idx: number; hash: string }> = [];
    for (let i = 0; i < ctxs.size; i++) {
      ctxList.push({ idx: i, hash: ctxs.get(i) ?? '' });
    }
    ctxStr = ctxList.join(',');
    SetProgressNewEvent(
      eventCallback,
      publishStatusEnum.uploading,
      '视频上传中',
      taskData.taskId,
      totalPartNums,
      totalPartNums,
      taskData.needParts === true,
    );
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    await Task.Delay(800);
    const uploadedVideoInfo = await finishUploadCheJiaHaoVideoResponse(cookie, uploadPre, uploadArgs, ctxList);
    await Task.Delay(500);
    await getVideoStateResponse(cookie, uploadArgs.result.id);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (uploadedVideoInfo?.returncode != 0) {
      // console.debug('视频上传完成校验失败', taskData.taskId, uploadedVideoInfo, ctxStr);
      pubResult.msg = `视频上传完成校验失败${uploadedVideoInfo?.message ?? ''}`;
      pubResult.code = uploadedVideoInfo?.returncode ?? errorCode.data_error;
      return null;
    }

    pubResult.code = 0;
    pubResult.msg = '';
    return uploadArgs;
    // endregion
  } catch (e) {
    logger.error(`车家号视频上传异常失败,${taskData.taskId},${(e as Error)?.message}`);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = '视频上传失败';
    return null;
  } finally {
    fileHandle?.close();
  }
};

const uploadCover = async (
  taskData: CheJiaHaoVideoTaskInput,
  fileName: string,
  imageData: buffer.Buffer,
  pubResult: CheJiaHaoPublishResultOutput,
  cookie: string,
): Promise<UploadImageInfoResponse | null | undefined> => {
  try {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // 获取上传token
    const token = await getCheJiaHaoImageUploadToken(cookie);
    if (!token) {
      pubResult.code = -1;
      pubResult.msg = '获取上传token失败';
      return null;
    }

    // 从文件名获取扩展名
    const ext = path.extname(fileName).toLowerCase().replace('.', '') || 'jpg';
    const imageResult = await uploadCheJiaHaoImageResponse(cookie, imageData, token, ext);
    
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    
    if (imageResult?.code !== 0 || !imageResult?.url) {
      pubResult.code = -1;
      pubResult.msg = `封面上传失败${imageResult?.message}`;
      return imageResult;
    }

    pubResult.code = 0;
    pubResult.msg = '';
    return imageResult;
    // endregion
  } catch (e) {
    //console.error('美拍视频上传失败', taskData.taskId, e);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = '视频上传失败';
    return null;
  } finally {
  }
};

/**
 *
 * @param cookie  账号cookie
 * @param taskData 任务体
 * @param eventCallback 事件回调
 * @param maxThreadOut 最大并发上传
 * @param retryTimes 最大重试次数
 */
export const publishCheJiaHaoVideo = async (
  cookie: string,
  taskData: CheJiaHaoVideoTaskInput,
  eventCallback: EventEmitter,
  maxThreadOut: number = 3,
  retryTimes: number = 3,
): Promise<CheJiaHaoPublishResultOutput> => {
  logger.info(`车家号视频发布 ${taskData.taskId}`);
  const pubResult: CheJiaHaoPublishResultOutput = {
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
      logger.error(`视频文件不存在 ${taskData.taskId} ${taskData.video.localPath}`);
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

    // 获取文件信息
    const fileStat = await fs.promises.stat(taskData.video.localPath);
    taskData.video.size = fileStat.size;
    SetProgressEvent(eventCallback, 2, '正在获取上传参数', taskData.taskId);

    // region 上传视频
    let uploadedVideoInfo = await uploadVideo(taskData, eventCallback, fileStat, pubResult, maxThreadOut, cookie);
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      if (!uploadedVideoInfo?.result?.id) {
        if (i < retryTimes - 1) {
          SetProgressEvent(eventCallback, 4, '上传失败,重试中', taskData.taskId);
          uploadedVideoInfo = await uploadVideo(taskData, eventCallback, fileStat, pubResult, maxThreadOut, cookie);
          continue;
        }
        logger.error(
          `视频上传失败 ${taskData.taskId} ${cookie} ${JSON.stringify(uploadedVideoInfo)} ${JSON.stringify(pubResult)}`,
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
    if (!uploadedVideoInfo?.result?.id) {
      return pubResult;
    }
    // endregion

    SetProgressEvent(eventCallback, 85, '获取上传完成视频信息', taskData.taskId);

    // region 封面上传
    SetProgressEvent(eventCallback, 90, '封面读取中', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // 读取图片数据
    const imageData = await readImageData(taskData.cover.pathOrUrl, 'jpeg');

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!imageData.data) {
      // console.debug('读取封面失败', cookie, taskData.taskId, taskData.cover);
      pubResult.code = errorCode.io_error;
      pubResult.msg = `读取封面失败-${taskData.cover.pathOrUrl}`;
      logger.error(`封面读取失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${imageData.status}`);
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult?.msg ? pubResult.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }
    SetProgressEvent(eventCallback, 90, '封面上传中', taskData.taskId);
    // 上传图片数据

    const fileName = `${Date.now()}.${imageData.ext}`;

    let imageResult = await uploadCover(taskData, fileName, imageData.data, pubResult, cookie);
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      // 判断封面是否上传成功
      if (!imageResult?.url) {
        // console.debug('封面上传失败', taskData.taskId, taskData?.cover?.pathOrUrl, imageResult);
        if (i < retryTimes - 1) {
          imageResult = await uploadCover(taskData, fileName, imageData.data, pubResult, cookie);
          continue;
        }
        pubResult.code = errorCode.data_error;
        pubResult.msg = `封面上传失败:${taskData.cover.pathOrUrl}` + (imageResult?.message ?? '');
        logger.error(
          `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${JSON.stringify(imageResult)}`,
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
    if (!imageResult?.url) {
      pubResult.code = errorCode.data_error;
      pubResult.msg = `封面上传失败:${taskData.cover.pathOrUrl}` + (imageResult?.message ?? '');
      logger.error(
        `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${JSON.stringify(imageResult)}`,
      );
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult?.msg ? pubResult.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }
    let verticalImageResult: UploadImageInfoResponse | null | undefined = undefined;
    if (taskData.verticalCover?.pathOrUrl) {
      SetProgressEvent(eventCallback, 90, '竖版封面读取中', taskData.taskId);

      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      const verticalImageData = await readImageData(taskData.verticalCover.pathOrUrl, 'jpeg');

      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      if (!verticalImageData.data) {
        pubResult.code = errorCode.io_error;
        pubResult.msg = `读取竖版封面失败-${taskData.verticalCover.pathOrUrl}`;
        logger.error(
          `竖版封面读取失败 ${taskData.taskId} ${cookie} ${taskData.verticalCover.pathOrUrl} ${verticalImageData.status}`,
        );
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploadFail,
          pubResult?.msg ? pubResult.msg : '上传失败',
          taskData.taskId,
        );
        return pubResult;
      }

      SetProgressEvent(eventCallback, 90, '竖版封面上传中', taskData.taskId);

      const verticalFileName = `${Date.now()}_vertical.${verticalImageData.ext}`;
      verticalImageResult = await uploadCover(taskData, verticalFileName, verticalImageData.data, pubResult, cookie);
      for (let i = 0; i < retryTimes; i++) {
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);

        if (!verticalImageResult?.url) {
          if (i < retryTimes - 1) {
            verticalImageResult = await uploadCover(
              taskData,
              verticalFileName,
              verticalImageData.data,
              pubResult,
              cookie,
            );
            continue;
          }
          pubResult.code = errorCode.data_error;
          pubResult.msg = `竖版封面上传失败:${taskData.verticalCover.pathOrUrl}` + (verticalImageResult?.message ?? '');
          logger.error(
            `竖版封面上传失败 ${taskData.taskId} ${cookie} ${taskData.verticalCover.pathOrUrl} ${JSON.stringify(verticalImageResult)}`,
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
      if (!verticalImageResult?.url) {
        pubResult.code = errorCode.data_error;
        pubResult.msg = `竖版封面上传失败:${taskData.verticalCover.pathOrUrl}` + (verticalImageResult?.message ?? '');
        logger.error(
          `竖版封面上传失败 ${taskData.taskId} ${cookie} ${taskData.verticalCover.pathOrUrl} ${JSON.stringify(verticalImageResult)}`,
        );
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploadFail,
          pubResult?.msg ? pubResult.msg : '上传失败',
          taskData.taskId,
        );
        return pubResult;
      }
    }
    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    //endregion

    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);

    //存草稿
    const draftData = buildDraftData(taskData, uploadedVideoInfo, imageResult, {
      verticalCoverUrl: verticalImageResult,
      enableStatementCheck: true,
    });

    // 组装发布数据

    // console.debug('车家号视频推送数据', taskData.taskId, cookie, draftData);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);

    // 推送数据
    const draftResult = await saveDraftCheJiaHaoVideoResponse(cookie, draftData, 0, webProxy);
    // console.debug('车家号视频推送返回数据', taskData.taskId, draftResult);
    if (!draftResult?.result?.draftId) {
      pubResult.code = draftResult?.returncode ?? -1;
      pubResult.msg = draftResult?.message ?? '保存草稿成功';
      return pubResult;
    } else if (taskData.pubType === 0) {
      pubResult.code = draftResult?.returncode ?? -1;
      pubResult.msg = draftResult?.message;
      return pubResult;
    }

    const pubData = buildDraftData(taskData, uploadedVideoInfo, imageResult, {
      draftId: draftResult.result.draftId,
      verticalCoverUrl: verticalImageResult,
      enableStatementCheck: true,
      publishType: 1,
    });
    const publishResult = await saveDraftCheJiaHaoVideoResponse(cookie, pubData, 1, webProxy);
    pubResult.publishId =
      publishResult?.result?.id?.toString() ??
      publishResult?.result?.draftId?.toString() ??
      publishResult?.result?.toString();
    pubResult.code = publishResult?.returncode ?? -1;
    pubResult.msg = publishResult?.message;

    if (pubResult.code == 0 && pubResult.publishId) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      if (pubResult.msg?.includes('msg:')) {
        pubResult.msg = pubResult.msg?.split('msg:')[1];
      }
      pubResult.msg = `发布失败${pubResult.msg ?? ''}`;
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
      logger.error(`美拍视频发布失败 ${taskData.taskId} ${cookie} ${draftData} ${JSON.stringify(draftResult)}`);
    }

    return pubResult;
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
      pubResult.msg = '发布失败，请查看详细错误信息';
      pubResult.errorInfo = e?.toString();
    }
    SetProgressNewEvent(
      eventCallback,
      publishStatusEnum.pushFail,
      pubResult?.msg ? pubResult.msg : '推送失败',
      taskData.taskId,
    );
    logger.error(`美拍视频发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};

export interface CheJiaHaoPublishResultOutput extends BaseResult {
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

export interface CheJiaHaoVideoTaskInput extends ITask {
  cancelToken?: CancelToken;
  /**
   * 任务唯一标志id
   */
  taskId: string;

  /**
   * 0：草稿 1：发布
   */
  pubType: 0 | 1;
  /**
   * 视频信息
   */
  video: {
    /**
     * 时长-秒
     */
    duration: number;
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
   * 横版封面信息
   */
  cover: {
    /**
     * 封面宽度
     */
    width: number;
    /**
     * 封面高度
     */
    height: number;
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
   * 竖版封面信息
   */
  verticalCover?: {
    /**
     * 封面宽度
     */
    width: number;
    /**
     * 封面高度
     */
    height: number;
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
   * 描述
   */
  desc: string;

  /**
   * 原创
   */
  isOriginal: 0 | 1;

  /**
   * 首发
   */
  isFirst: 0 | 1;
  /**
   * 定时发布13位时间戳
   */
  publishTime?: number;

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}

/**
 * 组装发布数据
 * @param taskData  任务数据
 * @param videoInfo
 * @param coverUrl
 */
const buildDraftData = (
  taskData: CheJiaHaoVideoTaskInput,
  videoInfo: CheJiaHaoUploadArgsResponse,
  coverUrl: UploadImageInfoResponse,
  options?: {
    draftId?: number;
    verticalCoverUrl?: UploadImageInfoResponse | null;
    enableStatementCheck?: boolean;
    publishType?: number;
  },
): string => {
  const html = new HtmlAgilityPack.HtmlDocument();
  html.LoadHtml('<p>' + taskData.desc + '</p>');

  const topics = html.DocumentNode.SelectNodes('//topic');
  if (topics?.length) {
    for (const topic of topics) {
      topic.innerHTML = ``;
      topic.textContent = '';
    }
  }

  const desc = html.DocumentNode.InnerText();
  const verticalCoverUrl = options?.verticalCoverUrl?.url ?? coverUrl.url;
  const verticalCoverHeight = options?.verticalCoverUrl?.url
    ? (taskData.verticalCover?.height ?? 0)
    : (taskData.cover?.height ?? 0);
  const verticalCoverWidth = options?.verticalCoverUrl?.url
    ? (taskData.verticalCover?.width ?? 0)
    : (taskData.cover?.width ?? 0);
  const reNew: Record<string, unknown> = {
    videoInfo: {
      filename: path.basename(taskData.video.localPath),
      vid: videoInfo.result.id,
      width: taskData.video.width,
      height: taskData.video.height,
      duration: taskData.video.duration ? taskData.video.duration : 10,
      firstframe: coverUrl.url,
    },
    title: taskData.title,
    summary: desc,
    suggestTitle: '',
    coverImageUrl: coverUrl?.url,
    columnId: 0,
    statementCheck: options?.enableStatementCheck ?? false,
    imgVerticalUrl: verticalCoverUrl,
    imgVerticalHeight: verticalCoverHeight,
    imgVerticalWidth: verticalCoverWidth,
    firstframeVertical: coverUrl.url,
    timerStatus: taskData.publishTime ? 1 : 0,
    timerTime: taskData.publishTime ? dayjs(taskData.publishTime).format('YYYY-MM-DD HH:mm') : '',
    publishType: options?.publishType ?? 0,
    club: {},
    role: 2,
    infoType: 3,
    videoType: 0,
    source: 'pc',
    ...(options?.draftId ? { draftId: options.draftId } : {}),
    ...(options?.enableStatementCheck ? { declarationLabel: '1' } : {}),
  };
  return JSON.stringify(reNew);
  const re = {
    videoInfo: {
      vid: videoInfo.result.id,
      width: taskData.video?.width ?? 0,
      height: taskData.video.height ?? 0,
      duration: taskData.video?.duration ? taskData.video.duration : 10,
      firstframe: '',
    },
    title: taskData.title ?? '',
    summary: desc ?? '',
    isMultiTitle: 0,
    coverImageUrl: coverUrl.url,
    imgVerticalUrl: coverUrl.url,
    imgVerticalHeight: 720,
    imgVerticalWidth: 1280,
    columnId: 0,
    statementCheck: true,
    activityIds: [0],
    timerStatus: 0,
    timerTime: '',
    publishType: taskData.pubType ?? 1,
    role: 2,
    infoType: 3,
    videoType: 1,
    isOriginal: 0,
    isFirst: 0,
  };

  //定时发布
  if (taskData.publishTime) {
    re.timerStatus = 1;
    re.timerTime = dayjs(taskData.publishTime).format('YYYY-MM-DD HH:mm');
  }

  //原创  首发
  re.isFirst = taskData.isFirst ?? 0;
  re.isOriginal = taskData.isOriginal ?? 0;

  return JSON.stringify(re);
};

