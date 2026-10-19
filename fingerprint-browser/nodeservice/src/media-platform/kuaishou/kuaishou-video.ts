import {
  buildPostData,
  getUploadedVideoInfo,
  getUploadedVideoStatusResponse,
  getWaitPublishResponse,
  KuaishouVideoTaskInput,
  publish,
  UploadedVideoInfoResponse,
  UploadPartResponse,
  uploadVideoPart,
} from './kuaishou-video.service';
import { BaseResult } from '../baseResult';
import { EventEmitter } from 'events';
import fs from 'fs';
import {
  convertImageFileToBuffer,
  Guid,
  Logger,
  logger,
  publishStatusEnum,
  SetProgressEvent,
  SetProgressNewEvent,
  UploadEmitGate,
} from '../../utils';

import { AxiosError } from 'axios';
import { getUploadArgsResponse, regex, uploadImage, UploadImageResponse } from './kuaishou-base.service';
import path from 'path';
import { errorCode } from '../errorCode';
import { privateKey } from '../../utils/CancelToken';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createKuaiProxyAgent } from '@/media-platform/webproxy';

/**
 *  上传视频过程
 * @param taskData 任务数据
 * @param eventCallback 事件回调
 * @param fileStat 文件句柄
 * @param pubResult 发布结果
 * @param uploadArgs 上传参数
 * @param cookie 账号cookie
 * @param fileName 文件名
 * @param maxThread 最大并发上传数
 */
export const uploadVideo = async (
  taskData: KuaishouVideoTaskInput,
  eventCallback: EventEmitter,
  fileStat: fs.Stats,
  pubResult: KuaishouPublishResultOutput,
  cookie: string,
  fileName: string,
  maxThread: number,
): Promise<UploadedVideoInfoResponse | null | undefined> => {
  let fileHandle: fs.promises.FileHandle | null = null;
  try {
    //获取上传参数
    let uploadArgs = await getUploadArgsResponse(cookie);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (!uploadArgs.data?.token) {
      uploadArgs = await getUploadArgsResponse(cookie);
    }
    if (!uploadArgs.data?.token) {
      //console.debug('获取视频上传参数失败', taskData.taskId, uploadArgs);
      pubResult.code = uploadArgs?.result ?? errorCode.data_error;
      pubResult.msg = '获取视频上传参数失败:' + (uploadArgs?.message ?? '');
      return null;
    }

    // 获取文件句柄
    fileHandle = await fs.promises.open(taskData.video.localPath, 'r');

    // 准备上传分片信息列表
    const uploadedList: Map<number, string> = new Map<number, string>();

    // 开始读取并上传文件
    let readIndex = 0;

    // 分片大小 4M
    const blockSize = 4194304;
    //总片数
    const totalPartNums = Math.ceil(fileStat.size / blockSize);

    //并行上传
    const tasks: Array<Promise<UploadPartResponse>> = [];

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
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // 文件大小小于等单个分片大小
    if (blockSize >= fileStat.size) {
      const buffer = Buffer.alloc(fileStat.size);
      const readData = await fileHandle.read(buffer, 0, fileStat.size, readIndex);
      if (readData.buffer.length > 0) {
        const uploadResult = await uploadVideoPart(uploadArgs, readData.buffer, 0, 0, fileStat.size - 1, fileStat.size);

        if (!uploadResult?.checksum) {
          //console.debug('视频分片上传失败', taskData.taskId, uploadResult);
          pubResult.msg = `视频分片${uploadResult?.partNum ?? ''}上传失败${uploadResult?.message ?? ''}`;
          pubResult.code = uploadResult?.result ?? errorCode.data_error;

          return null;
        }
        uploadedList.set(0, uploadResult.checksum);
        //onPartUploaded();
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
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);
        const readData = await fileHandle.read(buffer, 0, canReadNum, readIndex);
        if (readData.buffer.length > 0) {
          tasks.push(
            uploadVideoPart(
              uploadArgs,
              readData.buffer,
              partNum - 1,
              readIndex,
              readIndex + readData.buffer.length - 1,
              fileStat.size,
            ),
          );

          if (tasks.length > maxThread) {
            const uploadResult = await Promise.race(tasks);

            if (!uploadResult?.checksum) {
              //console.debug(`视频分片${uploadResult?.partNum}上传失败`, taskData.taskId, uploadResult);
              pubResult.msg = `视频分片${uploadResult?.partNum}上传失败${uploadResult?.message ?? ''}`;
              pubResult.code = uploadResult?.result ?? errorCode.data_error;

              return null;
            }
            uploadedList.set(uploadResult.partNum, uploadResult.checksum);

            //去除第一个任务，并等待完成
            const uploadResultNew = await tasks.splice(0, 1)[0];

            if (!uploadResultNew?.checksum) {
              //console.debug(`视频分片${uploadResultNew?.partNum}上传失败`, taskData.taskId, uploadResultNew);
              pubResult.msg = `视频分片${uploadResultNew?.partNum}上传失败${uploadResultNew?.message ?? ''}`;
              pubResult.code = uploadResultNew?.result ?? errorCode.data_error;

              return null;
            }
            uploadedList.set(uploadResultNew.partNum, uploadResultNew.checksum);
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
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      const uploadResult = await tasks.splice(0, 1)[0];

      if (!uploadResult?.checksum) {
        //console.debug(`视频分片${uploadResult?.partNum}上传失败`, taskData.taskId, uploadResult);
        pubResult.msg = `视频分片${uploadResult?.partNum}上传失败${uploadResult?.message ?? ''}`;
        pubResult.code = errorCode.data_error;

        return null;
      }
      uploadedList.set(uploadResult.partNum, uploadResult.checksum);
      onPartUploaded();
    }

    //检查上传成功片数是否正确
    if (uploadedList.size < totalPartNums) {
      //console.debug('视频部分上传失败', taskData.taskId, uploadedList);
      pubResult.code = errorCode.io_error;
      pubResult.msg = '视频上传失败:' + taskData.video.localPath;
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

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //校验上传状态
    let uploadedVideoStatus = await getUploadedVideoStatusResponse(uploadArgs, totalPartNums);
    if (uploadedVideoStatus?.result != 1) {
      uploadedVideoStatus = await getUploadedVideoStatusResponse(uploadArgs, totalPartNums);
    }
    if (uploadedVideoStatus?.result != 1) {
      //console.debug('视频上传失败', taskData.taskId, uploadedVideoStatus);
      pubResult.code = uploadedVideoStatus?.result ?? errorCode.data_error;
      pubResult.msg = '视频上传失败' + (uploadedVideoStatus?.message ?? '');
      return null;
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // 获取上传完成的视频信息
    const uploadedVideoInfo = await getUploadedVideoInfo(cookie, uploadArgs, fileStat.size, fileName);

    //SetProgressEvent(eventCallback, 85, '获取上传完成视频信息', taskData.taskId);
    if (!uploadedVideoInfo?.data?.fileId) {
      logger.error(
        `获取视频上传完成信息失败,${taskData.taskId},${JSON.stringify(uploadedList)},${JSON.stringify(
          uploadedVideoInfo,
        )}`,
      );
      pubResult.code = -1;
      pubResult.msg = '获取视频上传信息失败:' + (uploadedVideoInfo?.message ?? '');
      return null;
    }
    pubResult.code = 0;
    pubResult.msg = '';
    return uploadedVideoInfo;
    // endregion
  } catch (e) {
    logger.error(`快手视频上传异常失败,${taskData.taskId},${(e as Error)?.message}`);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = '视频上传失败';
    return null;
  } finally {
    fileHandle?.close();
  }
};

/**
 * 发布快手视频
 * @param cookie
 * @param taskData 发布任务数据体
 * @param eventCallback 回调事件
 * @param maxThread 最大并发上传输数，默认3
 * @param retryTimes 最大重试次数
 */
export const publishKuaishouVideo = async (
  cookie: string,
  taskData: KuaishouVideoTaskInput,
  eventCallback: EventEmitter,
  maxThread: number = 3,
  retryTimes: number = 3,
): Promise<KuaishouPublishResultOutput> => {
  logger.info(`快手视频发布 ${taskData.taskId}`);
  const pubResult: KuaishouPublishResultOutput = {
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
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    SetProgressEvent(eventCallback, 1, '准备上传中', taskData.taskId);
    //获取文件信息
    const fileStat = await fs.promises.stat(taskData.video.localPath);
    taskData.video.size = fileStat.size;
    const fileName = path.basename(taskData.video.localPath);

    SetProgressEvent(eventCallback, 3, '正在获取上传参数', taskData.taskId);

    // region  视频上传
    let uploadedVideoInfo = await uploadVideo(
      taskData,
      eventCallback,
      fileStat,
      pubResult,
      cookie,
      fileName,
      maxThread,
    );

    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      if (!uploadedVideoInfo?.data?.fileId) {
        if (i < retryTimes - 1 && uploadedVideoInfo?.result != 109) {
          SetProgressEvent(eventCallback, 4, '上传失败,重试中', taskData.taskId);
          uploadedVideoInfo = await uploadVideo(
            taskData,
            eventCallback,
            fileStat,
            pubResult,
            cookie,
            fileName,
            maxThread,
          );
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

    if (!uploadedVideoInfo?.data?.fileId) {
      pubResult.code = uploadedVideoInfo?.result ?? pubResult?.code ?? errorCode.data_error;
      pubResult.msg = uploadedVideoInfo?.message ?? pubResult.msg ?? '视频上传失败';
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
    }
    //endregion
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // region 封面上传
    SetProgressEvent(eventCallback, 90, '封面读取中', taskData.taskId);

    //读取图片数据
    const imageData = await convertImageFileToBuffer(taskData.cover.pathOrUrl);
    SetProgressEvent(eventCallback, 90, '封面上传中', taskData.taskId);
    //上传图片数据
    let imageResult = await uploadImage(cookie, imageData);

    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      //判断封面是否上传成功
      if (!imageResult?.data?.coverKey) {
        //console.debug('封面上传失败', taskData.taskId, taskData?.cover?.pathOrUrl, imageResult);
        if (i < retryTimes - 1 && imageResult.result != 109) {
          imageResult = await uploadImage(cookie, imageData);
          continue;
        }
        pubResult.code = imageResult?.result ?? errorCode.data_error;
        pubResult.msg = '封面上传失败:' + (imageResult?.message ?? '');
        logger.error(
          `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${JSON.stringify(
            imageResult,
          )} ${JSON.stringify(pubResult)}`,
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
    if (!imageResult?.data?.coverKey) {
      pubResult.code = imageResult?.result ?? errorCode.data_error;
      pubResult.msg = '封面上传失败:' + (imageResult?.message ?? '');
      logger.error(
        `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${JSON.stringify(
          imageResult,
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
    taskData.cancelToken?.throwIfCancelled(privateKey);

    let pkImageResult: undefined | UploadImageResponse = undefined;
    if (taskData.pkCover?.pathOrUrl) {
      const imageData = await convertImageFileToBuffer(taskData.pkCover.pathOrUrl);
      pkImageResult = await uploadImage(cookie, imageData);

      for (let i = 0; i < retryTimes; i++) {
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);
        //判断封面是否上传成功
        if (!pkImageResult?.data?.coverKey) {
          // console.debug('pk封面上传失败', taskData.taskId, taskData?.pkCover?.pathOrUrl, pkImageResult);
          if (i < retryTimes - 1 && pkImageResult.result != 109) {
            pkImageResult = await uploadImage(cookie, imageData);
            continue;
          }
          pubResult.code = pkImageResult?.result ?? errorCode.data_error;
          pubResult.msg = 'pk封面上传失败:' + (pkImageResult?.message ?? '');
          logger.error(
            `pk封面上传失败 ${taskData.taskId} ${cookie} ${taskData.pkCover.pathOrUrl} ${JSON.stringify(
              pkImageResult,
            )} ${JSON.stringify(pubResult)}`,
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
      if (!pkImageResult?.data?.coverKey) {
        pubResult.code = pkImageResult?.result ?? errorCode.data_error;
        pubResult.msg = 'pk封面上传失败:' + (pkImageResult?.message ?? '');
        logger.error(
          `pk封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${JSON.stringify(
            pkImageResult,
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
    }

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    //endregion
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    // region 组装并推送数据
    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);

    const match = cookie.match(regex);
    const webapiId = match ? match[1] : Guid.NewGuid().toString().replace(/-/g, '');

    //组装发布数据
    const postData = await buildPostData(
      taskData,
      uploadedVideoInfo?.data?.fileId,
      imageResult.data.coverKey,
      webapiId,
      cookie,
      pkImageResult?.data?.coverKey,
    );
    // console.debug('快手推送数据', taskData.taskId, cookie, postData);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);
    //推送数据
    const publishResult = await publish(cookie, postData, webProxy);
    //console.debug('快手推送返回数据', taskData.taskId, publishResult);

    pubResult.code = publishResult?.result == 1 ? 0 : publishResult.result ?? -1;
    pubResult.msg = publishResult?.message ?? '';
    pubResult.publishId = publishResult?.currentTime?.toString()?.substring(0, 10);

    //查询发布状态，匹配publishId
    if (pubResult.code == 0) {
      try {
        //获取待发布列表
        const videoListResponse = await getWaitPublishResponse(cookie);

        if (videoListResponse?.data?.list?.length) {
          for (const content of videoListResponse.data.list) {
            if (content?.unPublishCoverKey == imageResult.data.coverKey) {
              pubResult.publishId = content.uploadTime.toString().substring(0, 10);
              break;
            }
          }
        }
      } catch (e) {
        console.log('查询匹配待发布内容异常', e?.toString());
      }
    }

    if (pubResult.code == 0 && pubResult.publishId) {
      if (taskData.publishTime) {
        pubResult.publishId = taskData.publishTime.toString().substring(0, 10);
      }
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      pubResult.msg = `发布失败${pubResult.msg}`;
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
      logger.error(`快手视频发布失败 ${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(publishResult)}`);
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
    logger.error(`快手视频发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};

export interface KuaishouPublishResultOutput extends BaseResult {
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
