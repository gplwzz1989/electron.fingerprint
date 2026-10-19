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

import { AZhanVideoCategoryInfo } from './azhan-category.service';
import {
  AzhanCreateVideoResponse,
  AZhanUploadedImageInfoResponse,
  AzhanUploadPartResponse,
  checkUploadAZhanImageResponse,
  checkUploadedVideo,
  finishUploadResponse,
  getAZhanImageUploadArgsResponse,
  getAZhanImageUploadTokenResponse,
  getAZhanUploadArgsResponse,
  getAZhanUploadTokenResponse,
  getCreateAZhanVideoResponse,
  getUploadedAZhanImageInfoResponse,
  publishAZhanVideoResponse,
  uploadAZhanImageResponse,
  uploadAZhanVideoPartResponse,
} from './azhan-video.service';
import * as buffer from 'buffer';
import dayjs from 'dayjs';

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
  taskData: AZhanVideoTaskInput,
  eventCallback: EventEmitter,
  fileStat: fs.Stats,
  pubResult: AZhanPublishResultOutput,
  maxThread: number,
  cookie: string,
): Promise<AzhanCreateVideoResponse | null | undefined> => {
  let fileHandle: fs.promises.FileHandle | null = null;
  try {
    //获取上传token
    const uploadArgs = await getAZhanUploadArgsResponse(cookie, path.basename(taskData.video.localPath), fileStat.size);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!uploadArgs?.taskId) {
      // console.debug('获取视频上传domain失败', taskData.taskId, uploadArgs);
      pubResult.code = errorCode.data_error;
      pubResult.msg = `获取视频上传domain失败${uploadArgs?.message}`;
      return null;
    }
    //SetProgressEvent(eventCallback, 5, '正在获取上传参数', taskData.taskId);

    //获取上传参数
    // const fileLength = fileStat.size;
    const uploadTokenObj = await getAZhanUploadTokenResponse(cookie, uploadArgs.token);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!uploadTokenObj?.token_id) {
      // console.debug('获取视频上传参数失败', taskData.taskId, uploadTokenObj);
      pubResult.code = errorCode.data_error;
      pubResult.msg = uploadTokenObj?.message ? uploadTokenObj?.message : '获取视频上传参数失败';
      return null;
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // 获取文件句柄
    fileHandle = await fs.promises.open(taskData.video.localPath, 'r');

    // 开始读取并上传文件
    let readIndex = 0;

    // 分片大小 8M
    const blockSize = 2097152;
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
    const tasks: Array<Promise<AzhanUploadPartResponse>> = [];

    // SetProgressEvent(eventCallback, 10, '视频上传中', taskData.taskId);

    // const fileName = path.basename(taskData.video.localPath);
    // 文件大小小于等单个分片大小
    if (blockSize >= fileStat.size) {
      const buffer = Buffer.alloc(fileStat.size);
      const readData = await fileHandle.read(buffer, 0, fileStat.size, readIndex);
      if (readData.buffer.length > 0) {
        const uploadResult = await uploadAZhanVideoPartResponse(
          cookie,
          readData.buffer,
          1,
          0,
          readData.buffer.length - 1,
          readData.buffer.length,
          uploadArgs.token,
        );

        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);

        if (!uploadResult?.checksum) {
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
      let partNum = 0;
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
            uploadAZhanVideoPartResponse(
              cookie,
              readData.buffer,
              partNum,
              readIndex,
              readIndex + readData.buffer.length,
              fileStat.size,
              uploadArgs.token,
            ),
          );

          if (tasks.length > maxThread) {
            const uploadResult = await Promise.race(tasks);

            if (!uploadResult?.checksum) {
              // console.debug('视频分片上传失败', taskData.taskId, uploadResult);
              pubResult.msg = `视频分片上传失败${uploadResult?.message ?? ''}`;
              pubResult.code = errorCode.data_error;
              return null;
            }

            //去除第一个任务，并等待完成
            const uploadResultNew = await tasks.splice(0, 1)[0];

            if (!uploadResultNew?.checksum) {
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

      if (!uploadResult?.checksum) {
        // console.debug('视频分片上传失败', taskData.taskId, uploadResult);
        pubResult.msg = `视频分片上传失败${uploadResult?.message ?? ''}`;
        pubResult.code = errorCode.data_error;
        return null;
      }
      onPartUploaded();
    }

    //SetProgressEvent(eventCallback, 81, '视频上传完成', taskData.taskId);

    //视频上传完成
    await checkUploadedVideo(cookie, totalPartNums, uploadArgs.token);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    const uploadedVideoInfo = await getCreateAZhanVideoResponse(
      cookie,
      uploadArgs.taskId,
      path.basename(taskData.video.localPath),
    );
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!uploadedVideoInfo?.videoId) {
      // console.debug('视频上传完成校验失败', taskData.taskId, uploadedVideoInfo);
      pubResult.msg = `视频上传完成校验失败${uploadedVideoInfo?.message ?? ''}`;
      pubResult.code = errorCode.data_error;
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
    await finishUploadResponse(cookie, uploadArgs.taskId);

    pubResult.code = 0;
    pubResult.msg = '';
    return uploadedVideoInfo;
    // endregion
  } catch (e) {
    logger.error(`微视视频上传失败,${taskData.taskId},${(e as Error)?.message}`);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = '视频上传失败';
    return null;
  } finally {
    fileHandle?.close();
  }
};

const uploadCover = async (
  taskData: AZhanVideoTaskInput,
  fileName: string,
  imageData: buffer.Buffer,
  pubResult: AZhanPublishResultOutput,
  cookie: string,
): Promise<AZhanUploadedImageInfoResponse | null | undefined> => {
  try {
    let imageUploadArgs = await getAZhanImageUploadArgsResponse(cookie, fileName);
    if (!imageUploadArgs?.info?.token) {
      await Task.Delay(5000);
      imageUploadArgs = await getAZhanImageUploadArgsResponse(cookie, fileName);
    }
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (!imageUploadArgs?.info?.token) {
      // console.debug(`获取封面上传参数失败${imageUploadArgs?.message}`, imageUploadArgs);
      pubResult.code = -1;
      pubResult.msg = `获取封面上传参数失败${imageUploadArgs?.message}`;
      return null;
    }

    await getAZhanImageUploadTokenResponse(
      cookie,
      imageUploadArgs?.info?.token,
      imageUploadArgs?.info?.httpEndpointList[0],
    );
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    const imageResult = await uploadAZhanImageResponse(
      cookie,
      imageData,
      imageUploadArgs?.info?.token,
      imageUploadArgs?.info?.httpEndpointList[0],
    );
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (!imageResult?.checksum) {
      // console.debug(`封面上传失败${imageResult?.message}`, imageResult);
      pubResult.code = -1;
      pubResult.msg = `封面上传失败${imageResult?.message}`;
      return null;
    }

    await checkUploadAZhanImageResponse(
      cookie,
      imageUploadArgs?.info?.token,
      imageUploadArgs?.info?.httpEndpointList[0],
    );

    const imageResultInfo = await getUploadedAZhanImageInfoResponse(cookie, imageUploadArgs.info.token);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (!imageResultInfo?.url) {
      // console.debug(`封面上传信息失败${imageResult?.message}`, imageResult);
      pubResult.code = -1;
      pubResult.msg = `封面上传信息失败${imageResult?.message}`;
      return null;
    }
    pubResult.code = 0;
    pubResult.msg = '';
    return imageResultInfo;
    // endregion
  } catch (e) {
    //console.error('A站视频封面上传失败', taskData.taskId, e);
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
export const publishAZhanVideo = async (
  cookie: string,
  taskData: AZhanVideoTaskInput,
  eventCallback: EventEmitter,
  maxThreadOut: number = 3,
  retryTimes: number = 3,
): Promise<AZhanPublishResultOutput> => {
  logger.info(`A站视频发布 ${taskData.taskId}`);
  const pubResult: AZhanPublishResultOutput = {
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

      if (!uploadedVideoInfo?.videoId) {
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
    if (!uploadedVideoInfo?.videoId) {
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
    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    //endregion

    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);

    //存草稿
    const postData = buildPostData(taskData, uploadedVideoInfo, imageResult.url);

    // 组装发布数据

    // console.debug('A站视频推送数据', taskData.taskId, cookie, postData);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);

    // 推送数据
    const publishResult = await publishAZhanVideoResponse(cookie, postData, webProxy);
    // console.debug('A站视频推送返回数据', taskData.taskId, publishResult);

    pubResult.code = publishResult?.dougaId ? 0 : -1;
    pubResult.msg = publishResult?.errMsg?.message ?? publishResult?.errMsg?.error_msg ?? '';
    pubResult.publishId = publishResult?.dougaId?.toString();

    if (pubResult.code == 0 && pubResult.publishId) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      if (pubResult.msg?.includes('msg:')) {
        pubResult.msg = pubResult.msg?.split('msg:')[1];
      }
      pubResult.msg = `发布失败${pubResult.msg ?? ''}`;

      if (publishResult?.errMsg?.result === 400011) {
        pubResult.msg =
          '发布失败:官方平台检测到您的账号存在风险，请先前往《创作者中心》里登录后单独发布一个作品，发布时会跳出验证，验证通过即可一键发布。';
      }
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      SetProgressEvent(eventCallback, 100, pubResult?.msg, taskData.taskId);
      logger.error(`A站视频发布失败 ${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(publishResult)}`);
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
    logger.error(`A站视频发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};

export interface AZhanPublishResultOutput extends BaseResult {
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

export interface AZhanVideoTaskInput {
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
   * 标题
   */
  title: string;
  /**
   * 描述
   */
  desc?: string;

  /**
   * 一级分类
   */
  category: AZhanVideoCategoryInfo;

  /**
   * 二级分类
   */
  subcategory: AZhanVideoCategoryInfo;

  /**
   * 1:原创 ，0非原创
   */
  isOriginal?: 0 | 1;

  /**
   * 转载地址
   */
  forwardLinkUrl?: string;
  /**
   * 标签
   */
  tags: Array<string>;

  /**
   * 定时发布13位时间戳
   */
  publishTime?: number;

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;

  /**
   * 是否需要上传分片信息
   */
  needParts?: boolean;
}

/**
 * 组装发布数据
 * @param taskData  任务数据
 * @param videoInfo
 * @param coverUrl
 */
const buildPostData = (
  taskData: AZhanVideoTaskInput,
  videoInfo: AzhanCreateVideoResponse,
  coverUrl: string,
): string => {
  const argsList = new Array<string>();

  //定时发布
  if (taskData.publishTime) {
    const dtimeStr = dayjs(taskData.publishTime).format('YYYY-MM-DD HH:mm:00');
    argsList.push(`publishTime=${new Date(dtimeStr).getTime()}`);
  }
  argsList.push('title=' + encodeURIComponent(taskData.title?.toString() ?? ''));
  argsList.push('description=' + encodeURIComponent(taskData.desc?.toString() ?? ''));

  //标签
  taskData.tags = taskData.tags?.slice(0, 6);
  argsList.push('tagNames=' + encodeURIComponent(JSON.stringify(taskData.tags ?? [])));

  //分类
  argsList.push(`channelId=${taskData?.subcategory?.channelId ?? taskData.category?.channelId}`);

  argsList.push('coverUrl=' + encodeURIComponent(coverUrl));
  argsList.push('videoInfos=' + encodeURIComponent(`[{"videoId":${videoInfo.videoId},"title":"${taskData.title}"}]`));
  argsList.push('isJoinUpCollege=0');

  //原创
  if (!taskData.isOriginal) {
    argsList.push('creationType=1');
    if (taskData.forwardLinkUrl?.toString()) {
      argsList.push('originalLinkUrl=' + encodeURIComponent(taskData.forwardLinkUrl?.toString() ?? ''));
    }
  } else {
    argsList.push('creationType=3');
    //自制声明
    argsList.push('originalDeclare=0');
  }

  return argsList.join('&');
};
