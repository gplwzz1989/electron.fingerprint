import { BaseTask } from '../../media-platform/baseTask';
import { CancelToken, privateKey } from '../../utils/CancelToken';
import { ZhihuTopicInfo } from './zhihu-topic.service';
import { ZhihuCategoryInfo } from './zhihu-category.service';
import { ZhihuActivityInfo } from './zhihu-activity.service';
import {
  GetMD5ByPathLike,
  Guid,
  htmlDecode,
  logger,
  publishStatusEnum,
  readImageData,
  SetProgressEvent,
  SetProgressNewEvent,
  stepWaitTime,
  Task,
  UploadEmitGate,
} from '../../utils';
import { HtmlDocument } from '../../htmlAgilityPack';
import {
  getImageUploadKeyResponse,
  getUploadArgsResponse,
  getUploadedImageInfo,
  getUploadedVideoEtag,
  getVideoUploadKeyResponse,
  prePublish,
  publish,
  saveDraft,
  uploadImagePart,
  uploadImageStatus,
  uploadVideoPart,
} from './zhihu-video.service';
import { EventEmitter } from 'events';

import fs from 'fs';
import { errorCode } from '../../media-platform/errorCode';

import { BaseResult } from '../../media-platform/baseResult';
import crypto from 'crypto';
import * as buffer from 'buffer';
import { AxiosError } from 'axios';
import { getZhihuTopicList } from '@/media-platform/zhihu/zhihu-common';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { HtmlAgilityPack } from '@/article-parse/common/HtmlAgilityPack';

export const uploadVideo = async (
  taskData: ZhiHuVideoTaskInput,
  eventCallback: EventEmitter,
  pubResult: ZhihuPublishVideoResultOutput,
  fileStat: fs.Stats,
  maxThread: number,
  cookie: string,
): Promise<string | null | undefined> => {
  let fileHandle: fs.promises.FileHandle | null = null;
  try {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    const fileMd5 = await GetMD5ByPathLike(taskData.video.localPath);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    const uploadArgs = await getVideoUploadKeyResponse(cookie, fileMd5, fileStat.size, 'mp4');

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (uploadArgs?.upload_file?.state == 1 && uploadArgs?.upload_file?.video_id) {
      return uploadArgs.upload_file.video_id;
    }
    //提取上传key参数
    if (!uploadArgs?.upload_vendor?.upload_token) {
      // console.debug('获取视频上传参数失败', taskData.taskId, uploadArgs);
      pubResult.code = uploadArgs?.error?.code ?? errorCode.data_error;
      pubResult.msg = '获取视频上传参数失败:' + (uploadArgs?.error?.message ?? '');
      return null;
    }

    SetProgressEvent(eventCallback, 5, '正在获取上传参数', taskData.taskId);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    //获取上传id
    const uploadIdResponse = await getUploadArgsResponse(cookie, uploadArgs);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!uploadIdResponse?.includes('UploadId')) {
      // console.debug('获取上传ID失败', taskData.taskId, uploadIdResponse);
      pubResult.code = errorCode.data_error;

      if (uploadIdResponse?.startsWith('{')) {
        const uploadIdError = JSON.parse(uploadIdResponse);
        pubResult.msg = `获取上传ID失败:${uploadIdError?.msg ?? ''}`;
      } else {
        pubResult.msg = `获取上传ID失败:${uploadIdResponse}`;
      }
      pubResult.errorInfo = uploadIdResponse;

      return null;
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //提取上传id
    const uploadId = uploadIdResponse.split('<UploadId>')[1].split('<')[0];
    uploadArgs.uploadId = uploadId;

    // 获取文件句柄
    fileHandle = await fs.promises.open(taskData.video.localPath, 'r');

    // 准备上传分片信息列表
    const uploadedList: Map<number, string> = new Map<number, string>();

    // 开始读取并上传文件
    let readIndex = 0;

    // 分片大小 5M
    const blockSize = 1048576;
    //总片数
    const totalPartNums = Math.ceil(fileStat.size / blockSize);

    //并行上传
    const tasks: Array<Promise<{ partNum: number; msg: string }>> = [];
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
        const uploadResult = await uploadVideoPart(readData.buffer, 1, uploadArgs, uploadId);

        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);

        if (!uploadResult?.msg || uploadResult?.msg?.startsWith('{')) {
          // console.debug('视频分片上传失败', taskData.taskId, uploadResult);
          if (uploadResult?.msg?.startsWith('{')) {
            const errorJo = JSON.parse(uploadResult.msg);
            pubResult.msg = `视频分片1上传失败${errorJo?.msg ?? ''}`;
          } else {
            pubResult.msg = '视频分片1上传失败';
          }
          pubResult.code = errorCode.data_error;

          return null;
        }
        uploadedList.set(1, uploadResult.msg);
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
          tasks.push(uploadVideoPart(readData.buffer, partNum, uploadArgs, uploadId));
          //取消任务执行
          taskData.cancelToken?.throwIfCancelled(privateKey);
          if (tasks.length > maxThread) {
            const uploadResult = await Promise.race(tasks);

            if (!uploadResult?.msg || uploadResult?.msg?.startsWith('{')) {
              // console.debug(`视频分片${uploadResult.partNum}上传失败`, taskData.taskId, uploadResult);
              if (uploadResult?.msg?.startsWith('{')) {
                const errorJo = JSON.parse(uploadResult.msg);
                pubResult.msg = `视频分片${uploadResult.partNum}上传失败${errorJo?.msg ?? ''}`;
              } else {
                pubResult.msg = '视频分片上传失败';
              }
              pubResult.code = errorCode.data_error;

              return null;
            }
            uploadedList.set(uploadResult.partNum, uploadResult.msg);

            //去除第一个任务，如果并等待完成
            const uploadResultNew = await tasks.splice(0, 1)[0];

            if (!uploadResultNew?.msg || uploadResultNew?.msg?.startsWith('{')) {
              // console.debug(`视频分片${uploadResultNew.partNum}上传失败`, taskData.taskId, uploadResultNew);
              if (uploadResultNew?.msg?.startsWith('{')) {
                const errorJo = JSON.parse(uploadResultNew.msg);
                pubResult.msg = `视频分片${uploadResultNew.partNum}上传失败${errorJo?.msg ?? ''}`;
              } else {
                pubResult.msg = '视频分片上传失败';
              }
              pubResult.code = errorCode.data_error;

              return null;
            }
            uploadedList.set(uploadResultNew.partNum, uploadResultNew.msg);
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

      if (!uploadResult?.msg || uploadResult?.msg?.startsWith('{')) {
        // console.debug(`视频分片${uploadResult.partNum}上传失败`, taskData.taskId, uploadResult);
        if (uploadResult?.msg?.startsWith('{')) {
          const errorJo = JSON.parse(uploadResult.msg);
          pubResult.msg = `视频分片${uploadResult.partNum}上传失败${errorJo?.msg ?? ''}`;
        } else {
          pubResult.msg = '视频分片上传失败';
        }
        pubResult.code = errorCode.data_error;

        return null;
      }
      uploadedList.set(uploadResult.partNum, uploadResult.msg);
      onPartUploaded();
    }

    if (uploadedList.size < totalPartNums) {
      // console.debug('视频部分上传失败', taskData.taskId, uploadedList);
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
    // 检查视频上传是否成功,并获取上传完成的视频信息
    const uploadedVideoInfo = await getUploadedVideoEtag(uploadArgs, uploadId, uploadedList);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (uploadedVideoInfo?.includes('<Error>')) {
      // console.debug('视频上传校验失败', taskData.taskId, uploadedList, uploadedVideoInfo);
      pubResult.code = -1;
      pubResult.msg = '上传校验失败:' + (uploadedVideoInfo?.split('<Error>')[1].split('<')[0] ?? '');
      return null;
    }
    pubResult.code = 0;
    pubResult.msg = '';
    return uploadArgs.upload_file.video_id;
    // endregion
  } catch (e) {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    logger.error(`知乎视频上传异常失败，${taskData.taskId},${(e as Error)?.message}`);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = '视频上传失败';
    return null;
  } finally {
    fileHandle?.close();
  }
};

export const uploadCoverProcess = async (
  taskData: ZhiHuVideoTaskInput,
  eventCallback: EventEmitter,
  cookie: string,
  pubResult: ZhihuPublishVideoResultOutput,
): Promise<string | null | undefined> => {
  try {
    SetProgressEvent(eventCallback, 90, '封面上传中', taskData.taskId);

    //读取图片数据
    const imageData = await readImageData(taskData.cover.pathOrUrl, 'jpeg');

    taskData.cancelToken?.throwIfCancelled(privateKey);

    const fileMd5 = crypto
      .createHash('md5')
      .update(buffer.Buffer.from(imageData.data ?? ''))
      .digest('hex');

    //获取图片上传参数
    const uploadCoverArgs = await getImageUploadKeyResponse(cookie, fileMd5);
    taskData.cancelToken?.throwIfCancelled(privateKey);

    //提取图片上传参数
    if (!uploadCoverArgs?.upload_file?.image_id) {
      // console.debug('获取图片上传参数失败', taskData.taskId, uploadCoverArgs);
      pubResult.code = uploadCoverArgs?.error?.code ?? errorCode.data_error;
      pubResult.msg = '获取图片上传参数失败:' + (uploadCoverArgs?.error?.message ?? '');
      return null;
    }

    //上传图片数据，返回上传成功的图片url
    if (uploadCoverArgs.upload_file.state != 1) {
      const imageResult = await uploadImagePart(
        buffer.Buffer.from(imageData.data ?? ''),
        uploadCoverArgs,
        imageData.ext,
      );
      taskData.cancelToken?.throwIfCancelled(privateKey);
      //判断封面是否上传成功
      if (imageResult?.toString()?.includes('<Error>')) {
        // console.debug('封面上传失败', taskData.taskId, taskData?.cover?.pathOrUrl, imageResult);
        pubResult.code = -1;
        pubResult.msg = `封面上传失败:${imageResult.split('<Error>')[1].split('<')[0]}`;
        if (imageResult?.startsWith('{')) {
          const imageReJo = JSON.parse(imageResult);
          pubResult.msg = imageReJo?.msg;
        }
        return null;
      }
    }

    //获取上传成功的图片url
    let imageStatus = await uploadImageStatus(cookie, uploadCoverArgs);
    for (let i = 0; i < 3; i++) {
      taskData.cancelToken?.throwIfCancelled(privateKey);
      if (imageStatus == 204 || imageStatus == 200) {
        break;
      }
      await Task.Delay(stepWaitTime);
      imageStatus = await uploadImageStatus(cookie, uploadCoverArgs);
    }
    if (imageStatus != 204 && imageStatus != 200) {
      pubResult.code = imageStatus;
      pubResult.msg = '封面上传失败';
      return null;
    }

    let imageInfo = await getUploadedImageInfo(cookie, uploadCoverArgs);
    for (let i = 0; i < 3; i++) {
      taskData.cancelToken?.throwIfCancelled(privateKey);
      if (!imageInfo?.original_src) {
        await Task.Delay(stepWaitTime);
        imageInfo = await getUploadedImageInfo(cookie, uploadCoverArgs);
      } else {
        break;
      }
    }
    if (!imageInfo?.original_src) {
      pubResult.code = -1;
      pubResult.msg = '封面上传失败';
      return null;
    }
    taskData.cancelToken?.throwIfCancelled(privateKey);
    pubResult.code = 0;
    pubResult.msg = '';
    return imageInfo.original_src;
    //endregion
  } catch (e) {
    taskData.cancelToken?.throwIfCancelled(privateKey);
    console.error('封面上传失败', taskData.taskId, e);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = '封面上传失败';
    return null;
  }
};

/**
 * 发布小红书视频
 * @param cookie
 * @param taskData 视频发布任务体
 * @param eventCallback 事件回调
 * @param maxThread 最大并发上传数
 * @param retryTimes 最大重试次数
 */
export const zhihuPublishVideo = async (
  cookie: string,
  taskData: ZhiHuVideoTaskInput,
  eventCallback: EventEmitter,
  maxThread: number = 3,
  retryTimes: number = 3,
): Promise<ZhihuPublishVideoResultOutput> => {
  logger.info(`知乎视频发布 ${taskData.taskId}`);
  const pubResult: ZhihuPublishVideoResultOutput = {
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
    let uploadedVideoId = await uploadVideo(taskData, eventCallback, pubResult, fileStat, maxThread, cookie);
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      if (!uploadedVideoId) {
        if (i < retryTimes - 1 && pubResult?.code != -100) {
          SetProgressEvent(eventCallback, 4, '上传失败,重试中', taskData.taskId);
          uploadedVideoId = await uploadVideo(taskData, eventCallback, pubResult, fileStat, maxThread, cookie);
          continue;
        }
        pubResult.code = pubResult?.code ?? errorCode.data_error;
        pubResult.msg = pubResult?.msg ?? '视频上传失败';
        logger.error(`视频上传失败 ${taskData.taskId} ${cookie} ${uploadedVideoId} ${JSON.stringify(pubResult)}`);
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
    if (!uploadedVideoId) {
      pubResult.code = pubResult?.code ?? errorCode.data_error;
      pubResult.msg = pubResult?.msg ?? '视频上传失败';
      logger.error(`视频上传失败 ${taskData.taskId} ${cookie} ${uploadedVideoId} ${JSON.stringify(pubResult)}`);
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
    let coverUrl = await uploadCoverProcess(taskData, eventCallback, cookie, pubResult);
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      if (!coverUrl) {
        await Task.Delay(stepWaitTime);
        coverUrl = await uploadCoverProcess(taskData, eventCallback, cookie, pubResult);
      } else {
        break;
      }
    }
    if (!coverUrl) {
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

    let postData = buildPublishPostData('', taskData, uploadedVideoId, coverUrl);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (taskData.pubType === 0) {
      //不可取消
      taskData.cancelToken?.disable(privateKey);
    }
    // //存草稿
    const draftData = await publish(cookie, postData, 0, webProxy);
    pubResult.publishId = draftData?.data?.content_id;
    if (!draftData?.data?.content_id) {
      pubResult.code = draftData?.code ?? errorCode.data_error;
      pubResult.msg = draftData?.message ?? '发布失败';
      logger.error(`保存草稿失败 ${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(draftData)}`);
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      return pubResult;
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // await saveDraft(cookie, postData, draftData.id);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (taskData.pubType == 0) {
      pubResult.code = 0;
      pubResult.msg = '保存草稿成功';
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送草稿成功', taskData.taskId);
      return pubResult;
    }

    //推送数据
    postData = buildPublishPostData(draftData.data.content_id, taskData, uploadedVideoId, coverUrl);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);
    //组装发布数据
    // console.debug('知乎视频推送数据', taskData.taskId, cookie, postData);

    const publishResult = await publish(cookie, postData, taskData.pubType, webProxy);
    // console.debug('知乎视频推送返回数据', taskData.taskId, cookie, publishResult);

    pubResult.code = publishResult?.code ?? errorCode.data_error;
    pubResult.msg = publishResult?.message ?? '';
    // if (taskData.pubType != 1) {
    //   pubResult.publishId = publishResult.data.content_id?.toString();
    // } else {
    //   const reStr = publishResult?.data?.result?.startsWith('{') ? JSON.parse(publishResult.data.result) : undefined;
    //   pubResult.publishId = reStr ? reStr['id'] : '';
    // }
    if (pubResult.code == 0 && pubResult.publishId) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      pubResult.msg = `发布失败${publishResult['message'] ?? ''}`;
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
      logger.error(
        `知乎视频发布失败 ${taskData.taskId} ${cookie} ${postData} ${taskData.postTime} ${JSON.stringify(
          publishResult,
        )}`,
      );
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
    logger.error(`知乎视频发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};

export interface ZhihuPublishVideoResultOutput extends BaseResult {
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

/**
 * 组装发布数据
 * @param taskData 任务数据体
 * @param videoId
 * @param coverUrl
 */
export const buildDraftPostData = async (
  taskData: ZhiHuVideoTaskInput,
  videoId: string,
  coverUrl: string,
  cookie: string,
): Promise<string> => {
  const reJo = {};
  reJo['file'] = {};
  reJo['image_url'] = coverUrl;
  reJo['status'] = 'uploaded';
  reJo['title'] = taskData.title ?? '';
  reJo['video_id'] = videoId;
  const video = {};
  video['id'] = videoId;
  reJo['video'] = video;

  //原创转载
  if (taskData.isOriginal === 1) {
    reJo['zvideo_type'] = 'original';
  } else {
    reJo['zvideo_type'] = 'reprint';
  }

  //内容来源
  if (taskData.contentSource) {
    const srcObj: { method?: number; channel?: string } = {};
    if (taskData.contentSource.channel) {
      srcObj['channel'] = taskData.contentSource.channel;
    }
    if (taskData.contentSource.method != undefined) {
      srcObj['method'] = taskData.contentSource.method;
    }
    reJo['content_source'] = srcObj;
  }

  //活动
  if (taskData?.activity?.id) {
    reJo['campaign_id'] = taskData?.activity?.id;
  }

  //话题，兼容描述中嵌入话题和单独设置话题
  if (taskData.desc?.includes('<p') && taskData.desc?.includes('</p>')) {
    if (!taskData.topics) {
      taskData.topics = [];
    }

    //从描述中解析话题出来
    const html = new HtmlDocument();
    html.LoadHtml(taskData.desc);

    const pList = html.DocumentNode.SelectNodes('//p');
    if (pList?.length > 0) {
      //话题
      const topics = html.DocumentNode.SelectNodes('//topic');
      if (topics?.length > 0) {
        for (const item of topics) {
          if (taskData.topics?.length >= 6) {
            item.parentNode?.removeChild(item);
            continue;
          }
          let topicStr = htmlDecode(item.getAttribute('raw') ?? '');
          if (!topicStr?.startsWith('{')) {
            const text = htmlDecode(item.getAttribute('text') ?? '');
            const tmpTopic = await getZhihuTopicList(cookie, text);
            if (tmpTopic?.data?.length) {
              topicStr = JSON.stringify(tmpTopic.data[0]);
            } else {
              item.parentNode?.removeChild(item);
              continue;
            }
          }
          item.textContent = '';
          const topicItem = JSON.parse(topicStr);
          taskData.topics.push(topicItem);
        }
      }

      //换行
      let newText = '';
      for (let pIndex = 0; pIndex < pList.length; pIndex++) {
        const pItem = pList[pIndex];
        newText = `${newText}${pItem.textContent}\n`;
      }

      reJo['description'] = newText;
    } else {
      //话题
      const topics = html.DocumentNode.SelectNodes('//topic');
      if (topics?.length > 0) {
        for (const item of topics) {
          const topicStr = htmlDecode(item.getAttribute('raw') ?? '');
          const topicItem = topicStr?.startsWith('{') ? JSON.parse(topicStr) : null;
          if (!topicItem) {
            continue;
          }
          item.textContent = '';
          taskData.topics.push(topicItem);
        }
      }
      reJo['description'] = htmlDecode(html.DocumentNode.InnerText());
    }
  } else {
    reJo['description'] = taskData.desc ?? '';
  }
  if (taskData.topics && taskData.topics?.length > 0) {
    reJo['topic_ids'] = taskData.topics.map((obj) => obj.id);
  } else if (taskData.pubType == 1) {
    throw new Error('至少需要一个话题');
  }

  //分类
  if (taskData.pubType == 1 && !taskData.firstLevel?.id) {
    throw new Error('分类/领域不能为空');
  }
  const category = { category: {} };
  category.category['first_level'] = taskData.firstLevel?.id;
  category.category['second_level'] = taskData.secondLevel?.id;
  reJo['category'] = category;

  return JSON.stringify(reJo);
};

export interface ZhiHuVideoTaskInput extends BaseTask {
  cancelToken?: CancelToken;
  /**
   * 话题
   */
  topics: Array<ZhihuTopicInfo>;

  /**
   * 定时发布，10位时间戳
   */
  postTime?: number;

  /**
   * 一级分类
   */
  firstLevel: ZhihuCategoryInfo;

  /**
   * 二级分类
   */
  secondLevel: ZhihuCategoryInfo;

  /**
   * 是否原创 1:原创，0:转载
   */
  isOriginal: 0 | 1;

  /**
   * 活动
   */
  activity?: ZhihuActivityInfo;

  /**
   * 申明来源
   */
  contentSource?: {
    /**
     * 1:自行拍摄，暂不支持 2:图片视频由ai生成
     */

    method?: 2;

    /**
     * officialWebsite:官网
     * newsReport:新闻报道
     * TVMedia:电视媒体
     * printMedia：纸质媒体
     */
    channel?: 'officialWebsite' | 'newsReport' | 'TVMedia' | 'printMedia';
  };

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}

export const buildPublishPostData = (
  draftId: string,
  taskData: ZhiHuVideoTaskInput,
  videoId: string,
  coverUrl: string,
): string => {
  const descStr = '<p>' + taskData.desc ?? '' + '</p>';
  const html = new HtmlAgilityPack.HtmlDocument();
  html.LoadHtml(descStr);
  const topics = html.DocumentNode.SelectNodes('//topic');
  if (topics?.length > 0) {
    let c = 0;
    for (const topic of topics) {
      if (c >= 10 && topic) {
        topic.textContent = '';
        (topic as Element)?.parentNode?.removeChild(topic);
      }
      const topicStr = htmlDecode(decodeURIComponent(topic.getAttribute('data') ?? ''));
      const topicData = topicStr?.startsWith('{') ? (JSON.parse(topicStr) as ZhihuTopicInfo) : undefined;
      const a = html.DocumentNode.doc.createElement('a');
      a.setAttribute('class', 'hash_tag');
      const topicName = topicData?.name ?? topic.getAttribute('text');
      a.setAttribute('data-topic-name', `#${topicName}#`);
      a.setAttribute('data-topic-id', topicData?.id ?? '0');
      a.textContent = `#${topicName}#`;
      const pNode: Element = topic as Element;
      pNode.parentNode?.insertBefore(a, pNode);
      pNode.parentNode?.removeChild(pNode);
      c++;
    }
  }
  let descNew = html.DocumentNode.OuterHtml() ?? '';
  if (descNew === '<p/>') {
    descNew = '<p></p>';
  }
  const re = {
    action: 'pin',
    data: {
      publish: { traceId: `${Date.now()},${Guid.NewGuid()}` },
      commentsPermission: { comment_permission: 'all' },
      extra_info: { view_permission: 'all', publisher: 'pc' },
      draft: { disabled: 1, id: draftId },
      title: { title: taskData?.title },
      hybrid: {
        html: descNew,
        textLength: taskData.desc?.length,
      },
      media: {
        medias: [
          {
            video: {
              cover: {
                originalUrl: coverUrl ?? '',
                width: taskData?.cover?.width ?? 0,
                height: taskData?.cover?.height ?? 0,
              },
              videoId: videoId,
              width: taskData.video?.width ?? 0,
              height: taskData.video?.height ?? 0,
            },
          },
        ],
      },
      originalReprint: { originalReprint: taskData.isOriginal === 1 ? 'original' : 'reprint' },
      schedule: undefined,
    },
  };
  //申明
  if (taskData.contentSource?.method) {
    re.data['hybridInfo'] = { contentSource: taskData.contentSource };
  }
  //定时发布
  if (taskData.postTime) {
    re.data.schedule = { publishAt: taskData.postTime } as never;
  }

  //分类
  if (taskData.firstLevel?.id) {
    re.data['category'] = { category: { first_level: Number(taskData.firstLevel.id) } };
  }
  return JSON.stringify(re);
};
