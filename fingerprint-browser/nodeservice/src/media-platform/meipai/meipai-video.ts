import fs from 'fs';
import { BaseResult } from '../baseResult';
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
import path from 'path';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import * as buffer from 'buffer';
import dayjs from 'dayjs';
import { MeiPaiCategoryInfo } from './meipai-category-service';
import {
  finishUploadMeiPaiVideoResponse,
  getMeiPaiUploadArgsResponse,
  getMeiPaiUploadImageArgs,
  MeiPaiBaseResponse,
  MeiPaiUploadFinishResponse,
  MeiPaiUploadImageArgsResponse,
  MeiPaiUploadPartResponse,
  publishMeiPaiVideoResponse,
  uploadMeiPaiImageResponse,
  uploadMeiPaiVideoPartResponse,
} from './meipai-video.service';
import { HtmlAgilityPack } from '@/article-parse/common/HtmlAgilityPack';

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
  taskData: MeiPaiVideoTaskInput,
  eventCallback: EventEmitter,
  fileStat: fs.Stats,
  pubResult: MeiPaiPublishResultOutput,
  maxThread: number,
  cookie: string,
): Promise<MeiPaiUploadFinishResponse | null | undefined> => {
  let fileHandle: fs.promises.FileHandle | null = null;
  try {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressEvent(eventCallback, 5, '正在获取上传参数', taskData.taskId);

    //获取上传参数
    // const fileLength = fileStat.size;
    const uploadArgs = await getMeiPaiUploadArgsResponse(cookie);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!uploadArgs?.token) {
      // console.debug('获取视频上传参数失败', taskData.taskId, uploadArgs);
      pubResult.code = errorCode.data_error;
      pubResult.msg = uploadArgs?.error ? uploadArgs?.error : '获取视频上传参数失败';
      return null;
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // 获取文件句柄
    fileHandle = await fs.promises.open(taskData.video.localPath, 'r');

    // 开始读取并上传文件
    let readIndex = 0;

    // 分片大小 8M
    const blockSize = 4194304;
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

    //SetProgressEvent(eventCallback, 8, ' 正在上传视频', taskData.taskId);

    // 并行上传
    const tasks: Array<Promise<MeiPaiUploadPartResponse>> = [];

    const ctxs: Map<number, string> = new Map<number, string>();

    //SetProgressEvent(eventCallback, 10, '视频上传中', taskData.taskId);

    // const fileName = path.basename(taskData.video.localPath);
    // 文件大小小于等单个分片大小
    if (blockSize >= fileStat.size) {
      const buffer = Buffer.alloc(fileStat.size);
      const readData = await fileHandle.read(buffer, 0, fileStat.size, readIndex);
      if (readData.buffer.length > 0) {
        const uploadResult = await uploadMeiPaiVideoPartResponse(
          cookie,
          readData.buffer,
          uploadArgs.upload_domain,
          uploadArgs.token,
          1,
          ctxs,
        );

        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);

        if (!uploadResult?.ctx) {
          // console.debug('视频分片上传失败', taskData.taskId, uploadResult);
          pubResult.msg = `视频分片上传失败${uploadResult?.error ?? ''}`;
          pubResult.code = errorCode.data_error;

          return null;
        }
        ctxs.set(1, uploadResult.ctx);
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
            uploadMeiPaiVideoPartResponse(
              cookie,
              readData.buffer,
              uploadArgs.upload_domain,
              uploadArgs.token,
              partNum,
              ctxs,
            ),
          );

          if (tasks.length > maxThread) {
            const uploadResult = await Promise.race(tasks);

            if (!uploadResult?.ctx) {
              // console.debug('视频分片上传失败', taskData.taskId, uploadResult);
              pubResult.msg = `视频分片上传失败${uploadResult?.error ?? ''}`;
              pubResult.code = errorCode.data_error;
              return null;
            }

            //去除第一个任务，并等待完成
            const uploadResultNew = await tasks.splice(0, 1)[0];

            if (!uploadResultNew?.ctx) {
              // console.debug('视频分片上传失败', taskData.taskId, uploadResultNew);
              pubResult.msg = `视频分片上传失败${uploadResultNew?.error ?? ''}`;
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

      if (!uploadResult?.ctx) {
        // console.debug('视频分片上传失败', taskData.taskId, uploadResult);
        pubResult.msg = `视频分片上传失败${uploadResult?.error ?? ''}`;
        pubResult.code = errorCode.data_error;
        return null;
      }
      onPartUploaded();
    }

    //视频上传完成
    let ctxStr = '';
    const ctxList: Array<string> = [];
    for (let i = 1; i <= ctxs.size; i++) {
      ctxList.push(ctxs.get(i) ?? '');
    }
    ctxStr = ctxList.join(',');
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressNewEvent(
      eventCallback,
      publishStatusEnum.uploading,
      '视频上传中',
      taskData.taskId,
      totalPartNums,
      totalPartNums,
      taskData.needParts === true,
    );

    const uploadedVideoInfo = await finishUploadMeiPaiVideoResponse(
      cookie,
      ctxStr,
      path.basename(taskData.video.localPath),
      fileStat.size,
      uploadArgs.upload_domain,
      uploadArgs.token,
    );
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!uploadedVideoInfo?.key) {
      // console.debug('视频上传完成校验失败', taskData.taskId, uploadedVideoInfo, ctxStr);
      pubResult.msg = `视频上传完成校验失败${uploadedVideoInfo?.error ?? ''}`;
      pubResult.code = errorCode.data_error;
      return null;
    }

    pubResult.code = 0;
    pubResult.msg = '';
    uploadedVideoInfo.token = uploadArgs.token;
    return uploadedVideoInfo;
    // endregion
  } catch (e) {
    logger.error(`美拍视频上传异常失败,${taskData.taskId},${(e as Error)?.message}`);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = '视频上传失败';
    return null;
  } finally {
    fileHandle?.close();
  }
};

const uploadCover = async (
  taskData: MeiPaiVideoTaskInput,
  fileName: string,
  imageData: buffer.Buffer,
  pubResult: MeiPaiPublishResultOutput,
  cookie: string,
): Promise<MeiPaiUploadFinishResponse | null | undefined> => {
  try {
    const imageUploadArgs = await getMeiPaiUploadImageArgs(cookie);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    const baseRe = imageUploadArgs as MeiPaiBaseResponse;
    const uploadArgs = (imageUploadArgs as Array<MeiPaiUploadImageArgsResponse>)[0];
    if (baseRe?.error || !uploadArgs?.mtyun?.token) {
      // console.debug(`获取封面上传参数失败${baseRe.error}`, imageUploadArgs);
      pubResult.code = -1;
      pubResult.msg = `获取封面上传参数失败${baseRe.error}`;
      return null;
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    const imageResult = await uploadMeiPaiImageResponse(cookie, imageData, uploadArgs);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (!imageResult?.key) {
      // console.debug(`封面上传失败${imageResult?.error}`, imageResult);
      pubResult.code = -1;
      pubResult.msg = `封面上传失败${imageResult?.error}`;
      return null;
    }

    pubResult.code = 0;
    pubResult.msg = '';
    imageResult.token = uploadArgs.mtyun.token;
    return imageResult;
    // endregion
  } catch (e) {
    console.error('美拍视频上传失败', taskData.taskId, e);
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
export const publishMeiPaiVideo = async (
  cookie: string,
  taskData: MeiPaiVideoTaskInput,
  eventCallback: EventEmitter,
  maxThreadOut: number = 3,
  retryTimes: number = 3,
): Promise<MeiPaiPublishResultOutput> => {
  logger.info(`美拍视频发布 ${taskData.taskId}`);
  const pubResult: MeiPaiPublishResultOutput = {
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

      if (!uploadedVideoInfo?.key) {
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
    if (!uploadedVideoInfo?.key) {
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
      if (!imageResult?.key) {
        // console.debug('封面上传失败', taskData.taskId, taskData?.cover?.pathOrUrl, imageResult);
        if (i < retryTimes - 1) {
          imageResult = await uploadCover(taskData, fileName, imageData.data, pubResult, cookie);
          continue;
        }
        pubResult.code = errorCode.data_error;
        pubResult.msg = `封面上传失败:${taskData.cover.pathOrUrl}` + (imageResult?.error ?? '');
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
    if (!imageResult?.key) {
      pubResult.code = errorCode.data_error;
      pubResult.msg = `封面上传失败:${taskData.cover.pathOrUrl}` + (imageResult?.error ?? '');
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
    const postData = buildPostData(taskData, uploadedVideoInfo, imageResult);

    // 组装发布数据

    // console.debug('美拍视频推送数据', taskData.taskId, cookie, postData);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);

    // 推送数据
    const publishResult = await publishMeiPaiVideoResponse(cookie, postData, webProxy);
    // console.debug('美拍视频推送返回数据', taskData.taskId, publishResult);

    pubResult.code = publishResult?.error_code ?? -1;
    pubResult.msg = publishResult?.error;
    pubResult.publishId = imageResult.key?.split('.')[0];

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
      logger.error(`美拍视频发布失败 ${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(publishResult)}`);
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

export interface MeiPaiPublishResultOutput extends BaseResult {
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

export interface MeiPaiVideoTaskInput {
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
  category?: MeiPaiCategoryInfo;

  /**
   * 二级分类
   */
  subcategory?: MeiPaiCategoryInfo;

  /**
   * 定时发布13位时间戳
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

/**
 * 组装发布数据
 * @param taskData  任务数据
 * @param videoInfo
 * @param coverUrl
 */
const buildPostData = (
  taskData: MeiPaiVideoTaskInput,
  videoInfo: MeiPaiUploadFinishResponse,
  coverUrl: MeiPaiUploadFinishResponse,
): string => {
  const argsList = new Array<string>();

  //分类
  argsList.push(`category_id=${taskData.subcategory?.id ?? taskData.category?.id ?? ''}`);
  argsList.push('title=' + encodeURIComponent(taskData.title?.toString() ?? ''));

  const html = new HtmlAgilityPack.HtmlDocument();
  html.LoadHtml('<p>' + taskData.desc + '</p>');

  const topics = html.DocumentNode.SelectNodes('//topic');
  if (topics?.length) {
    for (const topic of topics) {
      topic.innerHTML = `${topic.textContent}#`;
    }
  }

  const caption = html.DocumentNode.InnerText();

  argsList.push('caption=' + encodeURIComponent(caption));
  argsList.push('watermark=0');
  argsList.push(`token=${encodeURIComponent(videoInfo.token ?? '')}`);
  argsList.push(`key=${videoInfo.key ?? ''}`);
  //封面
  argsList.push(`cover_pic=${encodeURIComponent(`http://mvimg10.meitudata.com/${coverUrl.key}`)}`);
  argsList.push('screenshot_time=' + (coverUrl.key ? '' : '1'));
  argsList.push(`video_width=${taskData.video.width ? taskData.video.width : 720}`);
  argsList.push(`video_height=${taskData.video.height ? taskData.video.height : 1280}`);
  argsList.push(`video_duration=${taskData.video.duration?.toFixed(0) ?? 10}`);
  argsList.push('is_sync_mtxx=0');

  //定时
  if (taskData.publishTime) {
    argsList.push(`date=${dayjs(taskData.publishTime).format('YYYY-MM-DD HH:mm')}`);
  }

  return argsList.join('&');
};
