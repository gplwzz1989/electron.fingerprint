import { BaseResult } from '../baseResult';
import {
  buildPostData,
  getUploadedVideoEtag,
  getUploadIdResponse,
  publish,
  uploadVideoPart,
  XiaohongshushopVideoTaskInput,
} from './xiaohongshushop-video.service';
import { EventEmitter } from 'events';
import fs from 'fs';
import { AxiosError } from 'axios';
import {
  convertImageFileToBuffer,
  logger,
  publishStatusEnum,
  SetProgressEvent,
  SetProgressNewEvent,
  UploadEmitGate,
} from '../../utils';
import { getUploadArgsResponse, uploadImage, XiaohongshuUploadNode } from './xiaohongshushop-base.service';

import { errorCode } from '../errorCode';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createKuaiProxyAgent } from '@/media-platform/webproxy';

export const uploadVideo = async (
  taskData: XiaohongshushopVideoTaskInput,
  eventCallback: EventEmitter,
  uploadNodeOut: { node: XiaohongshuUploadNode },
  pubResult: XiaohongshuPublishResultOutput,
  fileStat: fs.Stats,
  maxThread: number,
  cookie: string,
): Promise<string | null | undefined> => {
  let fileHandle: fs.promises.FileHandle | null = null;
  try {
    //获取上传参数
    const uploadArgs = await getUploadArgsResponse(cookie, 'video');
    const uploadNode = uploadArgs?.data?.uploadTempPermits?.length > 0 ? uploadArgs?.data?.uploadTempPermits[0] : null;
    //提取上传参数
    if (!uploadNode?.token) {
      // console.debug('获取视频上传参数失败', taskData.taskId, uploadArgs);
      pubResult.code = uploadArgs?.code ?? errorCode.data_error;
      pubResult.msg = '获取视频上传参数失败:' + (uploadArgs?.msg ?? '');
      return null;
    }
    uploadNodeOut.node = uploadNode;

    //获取上传id
    const uploadIdResponseStr = (await getUploadIdResponse(uploadNode))?.trim() ?? '';
    if (!uploadIdResponseStr?.includes('UploadId')) {
      // console.debug('获取上传ID失败', taskData.taskId, uploadIdResponseStr);
      pubResult.code = errorCode.data_error;

      if (uploadIdResponseStr?.startsWith('{')) {
        const uploadIdError = JSON.parse(uploadIdResponseStr);
        pubResult.msg = `获取上传ID失败:${uploadIdError?.msg ?? ''}`;
      } else {
        pubResult.msg = `获取上传ID失败:${uploadIdResponseStr}`;
      }
      pubResult.errorInfo = uploadIdResponseStr;

      return null;
    }

    //提取上传id
    const uploadId = uploadIdResponseStr.split('<UploadId>')[1].split('<')[0];

    // 获取文件句柄
    fileHandle = await fs.promises.open(taskData.video.localPath, 'r');

    // 准备上传分片信息列表
    const uploadedList: Map<number, string> = new Map<number, string>();

    // 开始读取并上传文件
    let readIndex = 0;

    // 分片大小 5M
    const blockSize = 5242880;
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
      0,
      taskData.needParts === true,
    );

    // 文件大小小于等单个分片大小
    if (blockSize >= fileStat.size) {
      const buffer = Buffer.alloc(fileStat.size);
      const readData = await fileHandle.read(buffer, 0, fileStat.size, readIndex);
      if (readData.buffer.length > 0) {
        const uploadResult = await uploadVideoPart(readData.buffer, 1, uploadNode, uploadId);

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
          tasks.push(uploadVideoPart(readData.buffer, partNum, uploadNode, uploadId));

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
    // 检查视频上传是否成功,并获取上传完成的视频信息
    const uploadedVideoInfo = await getUploadedVideoEtag(uploadNode, uploadId, uploadedList);

    if (!uploadedVideoInfo?.includes(uploadNode.fileIds[0])) {
      // console.debug('视频上传校验失败', taskData.taskId, uploadedList, uploadedVideoInfo);
      pubResult.code = -1;
      pubResult.msg = '上传校验失败:' + (uploadedVideoInfo ?? '');
      return null;
    }
    pubResult.code = 0;
    pubResult.msg = '';
    return uploadedVideoInfo;
    // endregion
  } catch (e) {
    logger.error(`小红书商家号视频上传异常失败，${taskData.taskId},${(e as Error)?.message}`);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = '视频上传失败';
    return null;
  } finally {
    fileHandle?.close();
  }
};

export const uploadCoverProcess = async (
  taskData: XiaohongshushopVideoTaskInput,
  eventCallback: EventEmitter,
  cookie: string,
  pubResult: XiaohongshuPublishResultOutput,
): Promise<XiaohongshuUploadNode | null | undefined> => {
  try {
    SetProgressEvent(eventCallback, 90, '封面上传中', taskData.taskId);

    //获取图片上传参数
    const uploadCoverArgs = await getUploadArgsResponse(cookie, 'image');

    //提取图片上传参数
    if (
      !uploadCoverArgs?.data?.uploadTempPermits?.length ||
      !uploadCoverArgs?.data?.uploadTempPermits[0]?.fileIds?.length
    ) {
      // console.debug('获取图片上传参数失败', taskData.taskId, uploadCoverArgs);
      pubResult.code = errorCode.data_error;
      pubResult.msg = '获取图片上传参数失败:' + (uploadCoverArgs?.msg ?? '');
      return null;
    }
    const imageUploadNode = uploadCoverArgs.data.uploadTempPermits[0];

    //读取图片数据
    const imageData = await convertImageFileToBuffer(taskData.cover.pathOrUrl);

    //上传图片数据，返回上传成功的图片url
    const imageResult = await uploadImage(imageData, imageUploadNode);

    //判断封面是否上传成功
    if (!imageResult?.toString()?.includes(imageUploadNode.fileIds[0])) {
      // console.debug('封面上传失败', taskData.taskId, taskData?.cover?.pathOrUrl, imageResult);
      pubResult.code = -1;
      pubResult.msg = '封面上传失败';
      if (imageResult?.startsWith('{')) {
        const imageReJo = JSON.parse(imageResult);
        pubResult.msg = imageReJo?.msg;
      }
      return null;
    }
    pubResult.code = 0;
    pubResult.msg = '';
    return imageUploadNode;
    //endregion
  } catch (e) {
    console.error('小红书封面上传失败', taskData.taskId, e);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = '视频上传失败';
    return null;
  }
};

/**
 * 发布小红书视频
 * @param cookie
 * @param taskData 小红书视频发布任务
 * @param eventCallback 事件回调
 * @param maxThread 最大并发上传数
 * @param retryTimes 最大重试次数
 */
export const xiaohongshuPublishVideo = async (
  cookie: string,
  taskData: XiaohongshushopVideoTaskInput,
  eventCallback: EventEmitter,
  maxThread: number = 3,
  retryTimes: number = 3,
): Promise<XiaohongshuPublishResultOutput> => {
  console.group('小红书发布', taskData.taskId);
  const pubResult: XiaohongshuPublishResultOutput = {
    code: 0,
    msg: 'ok',
    taskId: taskData.taskId,
  };
  try {
    if (!fs.existsSync(taskData.video.localPath?.toString() ?? '')) {
      // console.debug('视频文件不存在', taskData.taskId, taskData.video);
      pubResult.code = errorCode.io_error;
      pubResult.msg = '视频文件不存在:' + taskData.video.localPath;
      return pubResult;
    }

    SetProgressEvent(eventCallback, 1, '准备上传中', taskData.taskId);

    // region 获取发布前置准备参数
    //获取文件信息
    const fileStat = await fs.promises.stat(taskData.video.localPath);
    taskData.video.size = fileStat.size;

    SetProgressEvent(eventCallback, 3, '正在获取上传参数', taskData.taskId);
    let uploadNode: XiaohongshuUploadNode = {
      fileIds: [],
      token: '',
      expireTime: 0,
      qos: 0,
      cloudType: 0,
      uploadAddr: '',
      bucket: '',
      region: '',
      uploadId: 0,
    };
    const uploadNodeIn = { node: uploadNode };

    // endregion

    // region 视频上传
    let uploadVideoInfo = await uploadVideo(
      taskData,
      eventCallback,
      uploadNodeIn,
      pubResult,
      fileStat,
      maxThread,
      cookie,
    );
    for (let i = 0; i < retryTimes; i++) {
      if (!uploadVideoInfo) {
        if (i < retryTimes - 1 && pubResult?.code != -100) {
          SetProgressEvent(eventCallback, 4, '上传失败,重试中', taskData.taskId);
          uploadVideoInfo = await uploadVideo(
            taskData,
            eventCallback,
            uploadNodeIn,
            pubResult,
            fileStat,
            maxThread,
            cookie,
          );
          continue;
        }
        pubResult.code = pubResult?.code ?? errorCode.data_error;
        pubResult.msg = pubResult?.msg ?? '视频上传失败';
        return pubResult;
      } else {
        break;
      }
    }
    uploadNode = uploadNodeIn.node;
    //endregion

    // region 封面上传
    let imageUploadNode = await uploadCoverProcess(taskData, eventCallback, cookie, pubResult);
    for (let i = 0; i < retryTimes; i++) {
      if (!imageUploadNode || !(imageUploadNode?.fileIds?.length > 0)) {
        if (i < retryTimes - 1 && pubResult?.code != -100) {
          imageUploadNode = await uploadCoverProcess(taskData, eventCallback, cookie, pubResult);
          continue;
        }
        pubResult.code = pubResult?.code ?? errorCode.data_error;
        pubResult.msg = pubResult?.msg ?? '封面上传失败';
        return pubResult;
      } else {
        break;
      }
    }
    if (!imageUploadNode?.fileIds) {
      pubResult.code = pubResult?.code ?? errorCode.data_error;
      pubResult.msg = pubResult?.msg ?? '封面上传失败';
      return pubResult;
    }
    // endregion

    // region 组装并推送数据
    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);

    //组装发布数据
    const postData = await buildPostData(taskData, uploadNode.fileIds[0], imageUploadNode.fileIds[0], cookie);
    // console.debug('小红书推送数据', taskData.taskId, cookie, postData);
    let webProxy: HttpsProxyAgent<string> | object | undefined = undefined;
    if (taskData.proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(taskData.proxy);
    }
    //推送数据
    const publishResult = await publish(cookie, postData, webProxy, taskData.signContext);
    // console.debug('小红书推送返回数据', publishResult);

    pubResult.code = publishResult?.result ?? publishResult.code;
    pubResult.msg = publishResult?.msg;

    if (publishResult?.msg && publishResult.msg?.toString()?.includes('canvas illegal')) {
      pubResult.code = -110;
      pubResult.msg = '官方提示：请先到创作者中心发布一篇内容或验证后方可一键发布';
    }
    pubResult.publishId = publishResult?.data?.id;
    if (pubResult.code == 0 && pubResult.publishId) {
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      pubResult.code = pubResult?.code == 0 ? -1 : pubResult.code;
      pubResult.msg = `发布失败${pubResult.msg}`;
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
    }

    return pubResult;
    // endregion
  } catch (e) {
    SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
    // console.debug('发布失败:', taskData.taskId, e?.toString(), taskData);

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
  } finally {
    console.groupEnd();
  }

  return pubResult;
};

export interface XiaohongshuPublishResultOutput extends BaseResult {
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
