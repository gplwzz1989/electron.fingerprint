import fs from 'fs';
import { errorCode } from '../errorCode';
import {
  logger,
  publishStatusEnum,
  readImageData,
  SetProgressEvent,
  SetProgressNewEvent,
  UploadEmitGate,
} from '../../utils';
import { AxiosError } from 'axios';
import { EventEmitter } from 'events';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '../../media-platform/webproxy';
import { ListItemInfo, PublishResult } from '../../media-platform';
import {
  checkVideoUploadFinish,
  getAuthorization,
  getCsrfToken,
  getMediaUploadArgs,
  getUploadedImageInfoResponse,
  getUploadedVideoInfoResponse,
  getUploadId,
  PiPiXiaUploadPartResponse,
  publishPiPiXiaVideoResponse,
  UploadedVideoInfoResponse,
  uploadImageResponse,
  uploadVideoPartResponse,
} from './pipixia-video.service';
import crc from 'crc';
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
  taskData: PiPiXiaVideoTaskInput,
  eventCallback: EventEmitter,
  fileStat: fs.Stats,
  pubResult: PublishResult,
  maxThread: number,
  cookie: string,
): Promise<UploadedVideoInfoResponse | null | undefined> => {
  let fileHandle: fs.promises.FileHandle | null = null;
  try {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    //SetProgressEvent(eventCallback, 5, '正在获取上传参数', taskData.taskId);

    //获取上传参数

    const authorKeyObj = await getAuthorization(cookie);
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (!authorKeyObj?.data?.AuthSha1) {
      // console.debug('获取视频上传参数auth失败', taskData.taskId, authorKeyObj);
      pubResult.code = authorKeyObj?.status_code ?? -1;
      pubResult.msg = `获取视频上传参数失败${authorKeyObj?.message}`;
      return null;
    }

    const uploadArgs = await getMediaUploadArgs(
      cookie,
      taskData.video.size ?? 0,
      'GetVideoUploadParams',
      authorKeyObj.data.AuthSha1,
    );
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!uploadArgs?.data?.uploadurl) {
      // console.debug('获取视频上传参数失败', taskData.taskId, uploadArgs);
      pubResult.code = uploadArgs?.code === 2000 ? 0 : -1;
      pubResult.msg = `获取视频上传参数失败${uploadArgs?.message}`;
      return null;
    }

    const uploadIdObj = await getUploadId(cookie, uploadArgs);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (!uploadIdObj?.payload?.uploadID) {
      // console.debug('获取视频上传参数id失败', taskData.taskId, uploadIdObj);
      pubResult.code = -1;
      pubResult.msg = `获取视频上传参数失败${uploadIdObj?.error?.message ?? ''}`;
      return null;
    }

    // 获取文件句柄
    fileHandle = await fs.promises.open(taskData.video.localPath, 'r');

    // 开始读取并上传文件
    let readIndex = 0;

    // 分片大小 8M
    const blockSize = fileStat.size > 5242880 ? 5242880 : Math.ceil(fileStat.size / 2);
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
      uploadedParts,
      taskData.needParts === true,
    );

    // 并行上传
    const tasks: Array<Promise<PiPiXiaUploadPartResponse>> = [];

    // const fileName = path.basename(taskData.video.localPath);
    const uploadedList: Map<number, string> = new Map();
    // 文件大小小于等单个分片大小
    if (blockSize >= fileStat.size) {
      const buffer = Buffer.alloc(fileStat.size);
      const readData = await fileHandle.read(buffer, 0, fileStat.size, readIndex);
      if (readData.buffer.length > 0) {
        let crc32 = crc.crc32(readData.buffer).toString(16).replace('-', '');
        while (crc32.length < 8) {
          crc32 = `0${crc32}`;
        }
        const uploadResult = await uploadVideoPartResponse(
          uploadArgs,
          cookie,
          readData.buffer,
          1,
          uploadIdObj.payload.uploadID,
          1,
          crc32,
        );
        uploadedList.set(1, crc32);
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);

        if (uploadResult?.success != 0) {
          // console.debug('视频分片上传失败', taskData.taskId, uploadResult);
          pubResult.msg = `视频分片上传失败${uploadResult?.error?.message ?? ''}`;
          pubResult.code = errorCode.data_error;

          return null;
        }
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
          let crc32 = crc.crc32(readData.buffer).toString(16).replace('-', '');
          while (crc32.length < 8) {
            crc32 = `0${crc32}`;
          }
          tasks.push(
            uploadVideoPartResponse(
              uploadArgs,
              cookie,
              readData.buffer,
              partNum,
              uploadIdObj.payload.uploadID,
              totalPartNums,
              crc32,
            ),
          );
          uploadedList.set(partNum, crc32);

          if (tasks.length > maxThread) {
            const uploadResult = await Promise.race(tasks);

            if (uploadResult?.success != 0) {
              // console.debug('视频分片上传失败', taskData.taskId, uploadResult);
              pubResult.msg = `视频分片上传失败${uploadResult?.error?.message ?? ''}`;
              pubResult.code = errorCode.data_error;
              return null;
            }

            //去除第一个任务，并等待完成
            const uploadResultNew = await tasks.splice(0, 1)[0];

            if (uploadResultNew?.success != 0) {
              // console.debug('视频分片上传失败', taskData.taskId, uploadResultNew);
              pubResult.msg = `视频分片上传失败${uploadResultNew?.error?.message ?? ''}`;
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

      if (uploadResult?.success != 0) {
        // console.debug('视频分片上传失败', taskData.taskId, uploadResult);
        pubResult.msg = `视频分片上传失败${uploadResult?.error?.message ?? ''}`;
        pubResult.code = errorCode.data_error;
        return null;
      }
      onPartUploaded();
    }

    taskData.cancelToken?.throwIfCancelled(privateKey);

    const uploadStrList: Array<string> = [];
    for (let i = 1; i <= uploadedList.size; i++) {
      uploadStrList.push(`${i}:${uploadedList.get(i)}`);
    }
    const uploadResultList = uploadStrList.join(',');

    //视频上传完成
    const finishResult = await checkVideoUploadFinish(
      uploadArgs,
      cookie,
      uploadIdObj.payload.uploadID,
      uploadResultList,
    );
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!finishResult?.payload?.hash) {
      // console.debug('视频上传完成校验失败', taskData.taskId, finishResult);
      pubResult.msg = `视频上传完成校验失败${finishResult?.error?.message ?? ''}`;
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

    const uploadedVideoInfo = await getUploadedVideoInfoResponse(uploadArgs, cookie, authorKeyObj.data.AuthSha1);
    if (!uploadedVideoInfo?.data?.vid) {
      // console.debug('视频上传完成校验失败', taskData.taskId, uploadedVideoInfo);
      pubResult.msg = `视频上传完成校验失败${uploadedVideoInfo?.message ?? ''}`;
      pubResult.code = errorCode.data_error;
      return null;
    }

    return uploadedVideoInfo;
    // endregion
  } catch (e) {
    logger.error(`皮皮虾视频上传异常失败，${taskData.taskId},${(e as Error)?.message}`);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = '视频上传失败';
    return null;
  } finally {
    fileHandle?.close();
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
export const publishPiPiXiaVideo = async (
  cookie: string,
  taskData: PiPiXiaVideoTaskInput,
  eventCallback: EventEmitter,
  maxThreadOut: number = 3,
  retryTimes: number = 3,
): Promise<PublishResult> => {
  logger.info(`皮皮虾视频发布 ${taskData.taskId}`);
  const pubResult: PublishResult = {
    code: 0,
    msg: 'ok',
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

      if (!uploadedVideoInfo?.data?.vid) {
        if (i < retryTimes - 1 && pubResult.code != 111) {
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
    if (!uploadedVideoInfo?.data?.vid) {
      return pubResult;
    }
    // endregion

    SetProgressEvent(eventCallback, 85, '获取上传完成视频信息', taskData.taskId);

    // region 封面上传
    SetProgressEvent(eventCallback, 90, '封面读取中', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    //封面处理
    let coverUrl = '';
    if (taskData.cover?.pathOrUrl) {
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

      //const fileName = `${Date.now()}.${imageData.ext}`;
      let uploadImageAuth = await getAuthorization(cookie);
      let uploadArgs = await getMediaUploadArgs(
        cookie,
        imageData.data.length,
        'GetImageUploadParams',
        uploadImageAuth?.data?.AuthSha1 ?? '',
      );
      let imageResult = await uploadImageResponse(uploadArgs, cookie, imageData.data);
      let imageInfoResult = await getUploadedImageInfoResponse(uploadArgs, cookie, uploadImageAuth.data.AuthSha1);
      for (let i = 0; i < retryTimes; i++) {
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);

        if (!uploadImageAuth?.data?.AuthSha1) {
          if (i < retryTimes - 1) {
            uploadImageAuth = await await getAuthorization(cookie);
            continue;
          }
          pubResult.code = uploadImageAuth?.status_code ?? -1;
          pubResult.msg = `获取图片上传参数失败:${uploadImageAuth?.message}`;
          return pubResult;
        }

        if (!uploadArgs?.data?.uploadurl) {
          if (i < retryTimes - 1) {
            uploadArgs = await getMediaUploadArgs(
              cookie,
              imageData.data.length,
              'GetImageUploadParams',
              uploadImageAuth?.data?.AuthSha1 ?? '',
            );
            continue;
          }
          pubResult.code = -1;
          pubResult.msg = `获取图片上传参数失败:${uploadArgs?.message}`;
          return pubResult;
        }
        // 判断封面是否上传成功
        if (!imageResult?.payload?.hash) {
          // console.debug('封面上传失败', taskData.taskId, taskData?.cover?.pathOrUrl, imageResult);
          if (i < retryTimes - 1) {
            imageResult = await uploadImageResponse(uploadArgs, cookie, imageData.data);
            continue;
          }
          pubResult.code = errorCode.data_error;
          pubResult.msg = `封面上传失败:${taskData.cover.pathOrUrl}` + (imageResult?.error?.message ?? '');
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

        if (!imageInfoResult?.data[0]?.uri) {
          if (i < retryTimes - 1) {
            imageInfoResult = await getUploadedImageInfoResponse(uploadArgs, cookie, uploadImageAuth.data.AuthSha1);
            continue;
          }
          pubResult.code = -1;
          pubResult.msg = `获取图片上传参数失败:${imageInfoResult?.message}`;
          return pubResult;
        }
      }
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      if (!imageInfoResult?.data[0]?.uri) {
        pubResult.code = errorCode.data_error;
        pubResult.msg = `封面上传失败:${taskData.cover.pathOrUrl}` + (imageInfoResult?.message ?? '');
        logger.error(
          `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${JSON.stringify(imageInfoResult)}`,
        );
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploadFail,
          pubResult?.msg ? pubResult.msg : '上传失败',
          taskData.taskId,
        );
        return pubResult;
      }
      coverUrl = imageInfoResult?.data[0]?.uri;
    }

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    //endregion

    const crsfTokenStr = await getCsrfToken(cookie);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    //存草稿
    const postData = buildPostData(uploadedVideoInfo, taskData, coverUrl);

    // 组装发布数据

    // console.debug('皮皮虾视频推送数据', taskData.taskId, cookie, postData);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);

    // 推送数据

    const publishResult = await publishPiPiXiaVideoResponse(cookie, postData, crsfTokenStr, webProxy);
    // console.debug('皮皮虾视频推送返回数据', taskData.taskId, publishResult);

    pubResult.code = publishResult?.status_code ?? -1;
    pubResult.msg = publishResult?.message ?? publishResult?.status_message ?? '';
    pubResult.publishId = publishResult?.data?.item?.item_id_str;

    if (pubResult.code == 0 && pubResult.publishId) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      pubResult.msg = `发布失败${pubResult.msg ?? ''}`;
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
      logger.error(`皮皮虾视频发布失败 ${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(publishResult)}`);
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
    logger.error(`皮皮虾视频发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};

export interface PiPiXiaVideoTaskInput extends ITask {
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
  cover?: {
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
   * 描述
   */
  desc?: string;

  /**
   * 话题
   */
  topic?: ListItemInfo;

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}

/**
 * 组装发布数据
 * @param uploadedVideoInfo
 * @param taskData  任务数据
 * @param coverUrl
 */
const buildPostData = (
  uploadedVideoInfo: UploadedVideoInfoResponse,
  taskData: PiPiXiaVideoTaskInput,
  coverUrl: string,
): string => {
  const argsList = new Array<string>();

  argsList.push(`cover_uri=${coverUrl}`);
  argsList.push(`duration=${uploadedVideoInfo?.data?.video?.duration}`);
  if (taskData.desc?.includes('<p>')) {
    const html = new HtmlAgilityPack.HtmlDocument();
    html.LoadHtml(taskData.desc);
    const topics = html.DocumentNode.SelectNodes('//topic');
    if (topics.length) {
      for (const topic of topics) {
        topic.innerHTML = '';
      }
    }
    argsList.push(
      `text=${encodeURIComponent(html.DocumentNode.InnerText() ?? html.DocumentNode.doc.textContent ?? '')}`,
    );
  } else {
    argsList.push(`text=${encodeURIComponent(taskData.desc ?? '')}`);
  }

  const hashtagId = taskData.topic?.yixiaoerId?.trim();
  if (hashtagId) {
    argsList.push(`hashtag_id=${encodeURIComponent(hashtagId)}`);
  }

  argsList.push(`video_id=${uploadedVideoInfo?.data?.vid}`);
  argsList.push(`video_type=${uploadedVideoInfo?.data?.video?.format}`);

  return argsList.join('&');
};
