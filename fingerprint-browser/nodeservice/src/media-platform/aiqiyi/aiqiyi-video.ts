import fs from 'fs';
import { BaseResult } from '../baseResult';
import { errorCode } from '../errorCode';
import {
  htmlDecode,
  logger,
  publishStatusEnum,
  readImageData,
  SetProgressEvent,
  SetProgressNewEvent,
  UploadEmitGate,
} from '../../utils';
import { AxiosError } from 'axios';
import path from 'path';
import { EventEmitter } from 'events';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import {
  AiqiyiUploadCoverResponse,
  AiqiyiVideoUploadArgsResponse,
  AiqiyiVideoUploadPartResponse,
  checkAiqiyiUploadVideoExist,
  finishAiqiyiUploadVideo,
  getAiqiyiAccToken,
  getAiqiyiUploadVideoArgs,
  publishAiqiyiVideo,
  saveAiqiyiVideoDraft,
  uploadVideoBinaryPart,
  uploadVideoCover,
} from './aiqiyi-video.service';
import { IQiYiSha1 } from './aiqiyi-sha';
import { HtmlDocument } from '@/htmlAgilityPack';
import dayjs from 'dayjs';
import { AiqiyiCategoryInfo } from './aiqiyi-category.service';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { BaseTask, ITask } from '@/media-platform/baseTask';
import { generateAiqiyiQipuId } from './aiqiyi-qipuid.service';

interface AiqiyiUploadedVideoInfo extends AiqiyiVideoUploadArgsResponse {
  fileUploadStartTime?: number;
  fileUploadEndTime?: number;
}

/**
 *
 * @param taskData 任务体
 * @param eventCallback 事件回调
 * @param fileStat 文件句柄
 * @param uploadArgsOut
 * @param pubResult 发布结果
 * @param maxThread 最大并发上传
 * @param cookie
 * @param fileSha
 */
const uploadVideo = async (
  taskData: AiqiyiVideoTaskInput,
  eventCallback: EventEmitter,
  fileStat: fs.Stats,
  uploadArgsOut: { node: AiqiyiVideoUploadArgsResponse },
  pubResult: AiqiyiPublishResultOutput,
  maxThread: number,
  cookie: string,
  fileSha: string,
): Promise<AiqiyiUploadedVideoInfo | null | undefined> => {
  let fileHandle: fs.promises.FileHandle | null = null;
  let fileUploadStartTime = Date.now();
  let fileUploadEndTime = fileUploadStartTime;
  try {
    //获取上传token
    const accTokenResponse = await getAiqiyiAccToken(cookie, 'person', 'UGC');
    if (accTokenResponse?.code != 0) {
      //console.debug('获取视频上传token失败', taskData.taskId, accTokenResponse);
      pubResult.code = accTokenResponse.code;
      pubResult.msg = '获取视频上传token失败';
      return null;
    }
    SetProgressEvent(eventCallback, 5, '正在获取上传参数', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    //获取上传参数
    const fileLength = fileStat.size;
    const uploadArgs: AiqiyiUploadedVideoInfo = await getAiqiyiUploadVideoArgs(cookie, fileLength, accTokenResponse.data);
    if (!uploadArgs?.data?.upload_url) {
      //console.debug('获取视频上传参数失败', taskData.taskId, uploadArgs);
      pubResult.code = -1;
      pubResult.msg = uploadArgs?.msg ? uploadArgs?.msg : '获取视频上传参数失败';
      return null;
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    uploadArgsOut.node = uploadArgs;
    // 获取文件句柄
    fileHandle = await fs.promises.open(taskData.video.localPath, 'r');

    // 准备上传分片信息列表
    const uploadedList: Array<string> = [];

    // 开始读取并上传文件
    let readIndex = 0;

    // 分片大小 8M
    const blockSize = 8388608;
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
    fileUploadStartTime = Date.now();

    //SetProgressEvent(eventCallback, 8, ' 正在上传视频', taskData.taskId);

    // 并行上传
    const tasks: Array<Promise<AiqiyiVideoUploadPartResponse>> = [];

    //SetProgressEvent(eventCallback, 10, '视频上传中', taskData.taskId);

    const timeStamp = Date.now();
    const fileName = path.basename(taskData.video.localPath);
    // 文件大小小于等单个分片大小
    if (blockSize >= fileStat.size) {
      const buffer = Buffer.alloc(fileStat.size);
      const readData = await fileHandle.read(buffer, 0, fileStat.size, readIndex);
      if (readData.buffer.length > 0) {
        const uploadResult = await uploadVideoBinaryPart(
          uploadArgs,
          cookie,
          readData.buffer,
          1,
          1,
          0,
          fileLength - 1,
          fileLength,
          fileName,
          timeStamp,
        );

        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);

        if (!uploadResult?.file_id) {
          // console.debug('视频分片上传失败', taskData.taskId, uploadResult);
          pubResult.msg = `视频分片上传失败${uploadResult?.msg ?? ''}`;
          pubResult.code = errorCode.data_error;

          return null;
        }
        uploadedList.push(uploadResult.range_md5);
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
            uploadVideoBinaryPart(
              uploadArgs,
              cookie,
              readData.buffer,
              partNum,
              totalPartNums,
              readIndex,
              readIndex + canReadNum - 1,
              fileLength,
              fileName,
              timeStamp,
            ),
          );

          if (tasks.length > maxThread) {
            const uploadResult = await Promise.race(tasks);

            if (!uploadResult?.range_md5) {
              //console.debug('视频分片上传失败', taskData.taskId, uploadResult);
              pubResult.msg = `视频分片上传失败${uploadResult?.msg ?? ''}`;
              pubResult.code = errorCode.data_error;
              return null;
            }
            uploadedList.push(uploadResult.range_md5);

            //去除第一个任务，并等待完成
            const uploadResultNew = await tasks.splice(0, 1)[0];

            if (!uploadResultNew?.range_md5) {
              //console.debug('视频分片上传失败', taskData.taskId, uploadResultNew);
              pubResult.msg = `视频分片上传失败${uploadResultNew?.msg ?? ''}`;
              pubResult.code = errorCode.data_error;
              return null;
            }
            uploadedList.push(uploadResultNew.range_md5);
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

      if (!uploadResult?.range_md5) {
        //console.debug('视频分片上传失败', taskData.taskId, uploadResult);
        pubResult.msg = `视频分片上传失败${uploadResult?.msg ?? ''}`;
        pubResult.code = errorCode.data_error;
        return null;
      }
      uploadedList.push(uploadResult?.range_md5);
      onPartUploaded();
    }

    //SetProgressEvent(eventCallback, 81, '视频上传完成', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    //视频上传完成
    await finishAiqiyiUploadVideo(cookie, uploadArgs.data.file_id);
    fileUploadEndTime = Date.now();

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

    //检查是否有存在视频冲突
    const checkExist = await checkAiqiyiUploadVideoExist(cookie, uploadArgs.data.file_id, fileSha);
    if (checkExist?.data?.exist) {
      pubResult.msg = `该视频与爱奇艺其它视频重复，如您是原作者，可去官网申诉`;
      pubResult.code = errorCode.data_error;
      return { code: '', msg: pubResult.msg };
    }
    // if(checkExist?.msg?.includes('exist'))
    // {
    //   pubResult.msg = `已上传过相同视频`;
    //   pubResult.code = errorCode.data_error;
    //   return { code: '', msg: pubResult.msg };
    // }

    uploadArgs.fileUploadStartTime = fileUploadStartTime;
    uploadArgs.fileUploadEndTime = fileUploadEndTime;
    pubResult.code = 0;
    pubResult.msg = '';
    return uploadArgs;
    // endregion
  } catch (e) {
    logger.error(`一点号视频上传失败,${taskData.taskId},${(e as Error)?.message}`);
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
export const publishQiqiyiVideo = async (
  cookie: string,
  taskData: AiqiyiVideoTaskInput,
  eventCallback: EventEmitter,
  maxThreadOut: number = 3,
  retryTimes: number = 3,
): Promise<AiqiyiPublishResultOutput> => {
  logger.info(`爱奇艺视频发布 ${taskData.taskId}`);
  const pubResult: AiqiyiPublishResultOutput = {
    code: 0,
    msg: '',
    taskId: taskData.taskId,
  };
  try {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    SetProgressNewEvent(eventCallback, publishStatusEnum.uploading, '发布开始', taskData.taskId);
    if (!fs.existsSync(taskData.video.localPath?.toString() ?? '')) {
      logger.error(`视频文件不存在 ${taskData.taskId} ${JSON.stringify(taskData.video)}`);
      pubResult.code = errorCode.io_error;
      pubResult.msg = '视频文件不存在:' + taskData.video.localPath;
      SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, pubResult.msg, taskData.taskId);
      return pubResult;
    }
    let webProxy: HttpsProxyAgent<string> | object | undefined = undefined;
    if (taskData.proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(taskData.proxy);
    }
    SetProgressEvent(eventCallback, 1, '准备上传中', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    //最多10个标签
    taskData.tags = taskData?.tags?.slice(0, 10);
    // 获取文件信息
    const fileStat = await fs.promises.stat(taskData.video.localPath);
    taskData.video.size = fileStat.size;
    SetProgressEvent(eventCallback, 2, '正在获取上传参数', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    const uploadArgs: AiqiyiVideoUploadArgsResponse = { code: '', msg: '' };
    const uploadArgsIn = { node: uploadArgs };
    const fileSha = await new IQiYiSha1().GetSha1(taskData.video.localPath);
    // region 上传视频
    let uploadedVideoInfo = await uploadVideo(
      taskData,
      eventCallback,
      fileStat,
      uploadArgsIn,
      pubResult,
      maxThreadOut,
      cookie,
      fileSha,
    );
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      if (!uploadedVideoInfo) {
        if (i < retryTimes - 1 && pubResult.code != -101) {
          SetProgressEvent(eventCallback, 4, '上传失败,重试中', taskData.taskId);
          uploadedVideoInfo = await uploadVideo(
            taskData,
            eventCallback,
            fileStat,
            uploadArgsIn,
            pubResult,
            maxThreadOut,
            cookie,
            fileSha,
          );
          continue;
        }
        logger.error(`爱奇艺视频上传失败 ${taskData.taskId} ${cookie} ${JSON.stringify(uploadedVideoInfo)}`);
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploadFail,
          pubResult?.msg ?? '视频上传失败',
          taskData.taskId,
        );
        return pubResult;
      } else {
        break;
      }
    }
    if (!uploadedVideoInfo?.data) {
      logger.error(`爱奇艺视频上传失败 ${taskData.taskId} ${cookie} ${JSON.stringify(uploadedVideoInfo)}`);
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult?.msg ?? '视频上传失败',
        taskData.taskId,
      );
      return pubResult;
    }
    // endregion

    SetProgressEvent(eventCallback, 85, '获取上传完成视频信息', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // region 封面上传
    SetProgressEvent(eventCallback, 90, '封面读取中', taskData.taskId);

    // 读取图片数据
    const imageData = await readImageData(taskData.cover.pathOrUrl, 'jpeg');
    if (!imageData.data) {
      logger.error(`读取封面失败 ${taskData.taskId} ${JSON.stringify(taskData.cover)}`);
      pubResult.code = errorCode.io_error;
      pubResult.msg = `读取封面失败-${taskData.cover.pathOrUrl}`;
      SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, pubResult.msg, taskData.taskId);
      return pubResult;
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressEvent(eventCallback, 90, '封面上传中', taskData.taskId);
    // 上传图片数据
    const upCoverAccToken = await getAiqiyiAccToken(cookie, 'iqiyi', 'COMMON');
    if (!upCoverAccToken?.data) {
      logger.error(`获取封面上传token失败 ${taskData.taskId} ${cookie} ${JSON.stringify(upCoverAccToken)}`);
      pubResult.code = -1;
      pubResult.msg = upCoverAccToken.msg ?? '获取封面上传token失败';
      SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, pubResult.msg, taskData.taskId);
      return pubResult;
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    let imageResult = await uploadVideoCover(
      cookie,
      imageData.data,
      upCoverAccToken.data,
      imageData?.ext ?? 'jpeg',
      imageData.fileName ?? '1231.jpeg',
    );
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      // 判断封面是否上传成功
      if (!imageResult?.data?.share_url) {
        // console.debug('封面上传失败', taskData.taskId, taskData?.cover?.pathOrUrl, imageResult);
        if (i < retryTimes - 1) {
          imageResult = await uploadVideoCover(
            cookie,
            imageData.data,
            upCoverAccToken.data,
            imageData?.ext ?? 'jpeg',
            imageData.fileName ?? '1231.jpeg',
          );
          continue;
        }
        logger.error(
          `封面上传失败 ${taskData.taskId} ${taskData.cover?.pathOrUrl} ${cookie} ${JSON.stringify(imageResult)}`,
        );
        pubResult.code = errorCode.data_error;
        pubResult.msg = `封面上传失败:${taskData.cover.pathOrUrl}` + (imageResult?.msg ?? '');
        SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, pubResult.msg, taskData.taskId);
        return pubResult;
      } else {
        break;
      }
    }
    if (!imageResult?.data?.share_url) {
      logger.error(
        `封面上传失败 ${taskData.taskId} ${taskData.cover?.pathOrUrl} ${cookie} ${JSON.stringify(imageResult)}`,
      );
      pubResult.code = errorCode.data_error;
      pubResult.msg = `封面上传失败:${taskData.cover.pathOrUrl}` + (imageResult?.msg ?? '');
      SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, pubResult.msg, taskData.taskId);
      return pubResult;
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    let verticalImageResult: AiqiyiUploadCoverResponse | undefined = undefined;
    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (taskData.verticalCover?.pathOrUrl) {
      SetProgressEvent(eventCallback, 92, '竖版封面读取中', taskData.taskId);
      const verticalImageData = await readImageData(taskData.verticalCover.pathOrUrl, 'jpeg');
      if (!verticalImageData.data) {
        logger.error(`读取竖版封面失败 ${taskData.taskId} ${JSON.stringify(taskData.verticalCover)}`);
        pubResult.code = errorCode.io_error;
        pubResult.msg = `读取竖版封面失败-${taskData.verticalCover.pathOrUrl}`;
        SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, pubResult.msg, taskData.taskId);
        return pubResult;
      }

      taskData.cancelToken?.throwIfCancelled(privateKey);

      SetProgressEvent(eventCallback, 92, '竖版封面上传中', taskData.taskId);
      verticalImageResult = await uploadVideoCover(
        cookie,
        verticalImageData.data,
        upCoverAccToken.data,
        verticalImageData?.ext ?? 'jpeg',
        verticalImageData.fileName ?? '1231.jpeg',
      );
      for (let i = 0; i < retryTimes; i++) {
        taskData.cancelToken?.throwIfCancelled(privateKey);
        if (!verticalImageResult?.data?.share_url) {
          if (i < retryTimes - 1) {
            verticalImageResult = await uploadVideoCover(
              cookie,
              verticalImageData.data,
              upCoverAccToken.data,
              verticalImageData?.ext ?? 'jpeg',
              verticalImageData.fileName ?? '1231.jpeg',
            );
            continue;
          }
          logger.error(
            `竖版封面上传失败 ${taskData.taskId} ${taskData.verticalCover?.pathOrUrl} ${cookie} ${JSON.stringify(
              verticalImageResult,
            )}`,
          );
          pubResult.code = errorCode.data_error;
          pubResult.msg = `竖版封面上传失败:${taskData.verticalCover.pathOrUrl}` + (verticalImageResult?.msg ?? '');
          SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, pubResult.msg, taskData.taskId);
          return pubResult;
        } else {
          break;
        }
      }

      if (!verticalImageResult?.data?.share_url) {
        logger.error(
          `竖版封面上传失败 ${taskData.taskId} ${taskData.verticalCover?.pathOrUrl} ${cookie} ${JSON.stringify(
            verticalImageResult,
          )}`,
        );
        pubResult.code = errorCode.data_error;
        pubResult.msg = `竖版封面上传失败:${taskData.verticalCover.pathOrUrl}` + (verticalImageResult?.msg ?? '');
        SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, pubResult.msg, taskData.taskId);
        return pubResult;
      }

      taskData.cancelToken?.throwIfCancelled(privateKey);
    }
    //endregion

    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    const qipuIdResult = await generateAiqiyiQipuId(
      cookie,
      {
        fileId: uploadArgsIn.node.data?.file_id ?? '',
        fileUploadStartTime: uploadedVideoInfo.fileUploadStartTime ?? Date.now(),
        fileUploadEndTime: uploadedVideoInfo.fileUploadEndTime ?? Date.now(),
      },
      webProxy,
    );
    if (qipuIdResult?.code !== 0 || !qipuIdResult?.data) {
      logger.error(`获取爱奇艺作品ID失败 ${taskData.taskId} ${cookie} ${JSON.stringify(qipuIdResult)}`);
      pubResult.code = qipuIdResult?.code ?? errorCode.data_error;
      pubResult.msg = qipuIdResult?.msg ?? '获取爱奇艺作品ID失败';
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushFail, pubResult.msg, taskData.taskId);
      return pubResult;
    }
    //存草稿
    const postData = buildPostData(
      fileSha,
      taskData,
      imageResult,
      uploadArgsIn.node,
      qipuIdResult.data,
      taskData.pubType == 0,
      verticalImageResult,
    );

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    //不可取消
    taskData.cancelToken?.disable(privateKey);
    const draftResult = await saveAiqiyiVideoDraft(cookie, JSON.stringify(postData), webProxy);
    if (taskData.pubType === 0) {
      pubResult.code = draftResult?.code ?? -1;
      pubResult.msg = draftResult?.msg;
      pubResult.publishId = draftResult?.data?.data?.id?.toString() ?? '';
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送草稿成功', taskData.taskId);
      return pubResult;
    } else if (!draftResult?.data?.data?.id) {
      pubResult.code = draftResult?.code ?? -1;
      pubResult.msg = draftResult?.msg;
      pubResult.publishId = draftResult?.data?.data?.id?.toString() ?? '';
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送草稿失败', taskData.taskId);
      return pubResult;
    }
    // 组装发布数据

    //console.debug('爱奇艺视频推送数据', taskData.taskId, cookie, postData);

    postData['draftId']=draftResult.data.data.id;
    // 推送数据
    const publishResult = await publishAiqiyiVideo(cookie, uploadArgsIn.node.data?.file_id ?? '',JSON.stringify(postData), webProxy);
    //console.debug('爱奇艺视频推送返回数据', taskData.taskId, publishResult);

    pubResult.code = publishResult?.code ?? errorCode.data_error;
    pubResult.msg = publishResult?.msg ?? '';
    pubResult.publishId = publishResult?.data?.qipuId?.toString() ?? '';

    if (pubResult.code == 0 && pubResult.publishId) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      pubResult.msg = `${pubResult?.msg ?? '发布失败'}`;
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushFail, pubResult.msg, taskData.taskId);
      logger.error(
        `爱奇艺视频发布失败 ${taskData.taskId} cookie:${cookie} 推送数据:${postData},返回数据:${JSON.stringify(
          publishResult,
        )}`,
      );
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
    }

    return pubResult;
  } catch (e) {
    //SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
    // console.debug('发布失败:', taskData.taskId, e?.toString(), taskData);
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushFail, '发布异常失败', taskData.taskId);
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
    logger.error(`爱奇艺发布，异常失败 ${taskData.taskId} ${cookie} ${pubResult.msg}`);
  } finally {
  }

  return pubResult;
};

export interface AiqiyiPublishResultOutput extends BaseResult {
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

export interface AiqiyiVideoTaskInput extends ITask {
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
   * 发布类型
   * 0 存草稿
   * 1 发布
   */
  pubType: 0 | 1;
  /**
   * 标题
   */
  title: string;

  /**
   * 描述
   */
  desc?: string;

  /**
   * 标签
   */
  tags: Array<string>;

  /**
   *创作申明 0:无需声明 5:个人观点仅供参考 6:内容为转载 4:内容包含营销信息 2:含虚构演绎内容 1:含AI生成内容
   */
  uploadStatement?: 0 | 1 | 2 | 4 | 5 | 6;

  /**
   * 定时发布13位时间戳
   */
  publishTime?: number;

  /**
   * 创作类型 1:原创 0:转载
   */
  isOriginal?: 1 | 0;

  /**
   * 分类信息
   */
  category?: AiqiyiCategoryInfo;

  /**
   * 作品id，编辑已有作品时使用
   */
  qipuId?: number | string;

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}

/**
 * 组装发布数据
 * @param fileSha
 * @param taskData  任务数据
 * @param coverData
 * @param videoData
 * @param qipuId
 * @param isDraft
 */
const buildPostData = (
  fileSha: string,
  taskData: AiqiyiVideoTaskInput,
  coverData: AiqiyiUploadCoverResponse,
  videoData: AiqiyiVideoUploadArgsResponse,
  qipuId: number | string,
  isDraft: boolean = false,
  verticalCoverData?: AiqiyiUploadCoverResponse,
): object => {
  const re = {};
  // re['anime_tags'] = new Array<any>();
  // re['bind_bjh'] = 0; //是否同步到百家号

  //分类
  //原创或转载
  const timer = taskData.publishTime ? dayjs(taskData.publishTime).format('YYYY-MM-DD HH:mm:00') : '';
  let desc = '';
  if (taskData.desc) {
    const html = new HtmlDocument();
    html.LoadHtml(taskData.desc);
    desc = htmlDecode(html.DocumentNode.InnerText());
  }

  re['title'] = taskData.title;
  re['desc'] = desc;
  re['episodeType'] = 'RUGC';
  re['isDraft'] = isDraft;
  re['pagePublishStatus'] = isDraft ? 0 : timer ? 2 : 1;
  re['privacyPolicy'] = 0;
  re['video_pwd'] = '';
  re['timer'] = timer;
  re['uploadStatement'] = taskData?.uploadStatement ?? 0;
  re['riskWarning'] = '';
  re['isClockin'] = false;
  re['payVipTypes'] = [];
  re['previewTime'] = null;
  re['taskTag'] = '';
  re['contentType'] = null;
  re['channelId'] = taskData.category?.channelId ?? null;
  re['classifyId'] = taskData.category?.classifyId ?? null;
  re['classifyName'] = taskData.category?.classifyName ?? null;
  re['album'] = null;
  re['longVideoId'] = null;
  re['longVideoName'] = null;
  re['storeCatentryContent'] = null;
  re['videoType'] = 1;
  re['threedType'] = null;
  re['uploadSource'] = 'MP';

  const videoExt = path.extname(taskData.video.localPath).replace('.', '').toLowerCase() || 'mp4';
  const videoFileName = path.basename(taskData.video.localPath);
  re['uploadFileInfo'] = {
    fileId: videoData.data?.file_id ?? '',
    fileName: videoFileName,
    fileSize: taskData.video.size ?? 0,
    fileType: videoExt === 'mov' ? 'video/quicktime' : `video/${videoExt}`,
    sha1y: fileSha,
    width: taskData.video.width ?? 0,
    height: taskData.video.height ?? 0,
  };
  re['source'] = 'mp_pcw';

  const getCoverSwift = (data?: AiqiyiUploadCoverResponse) => data?.data?.file_path ?? data?.data?.httpInnerUrl ?? '';
  const getCoverUrl = (data?: AiqiyiUploadCoverResponse) => data?.data?.share_url?.replace('http://','https://') ?? '';
  const getScaleRatio = (scale: '4:3' | '16:9' | '3:4') => {
    if (scale === '16:9') {
      return 16 / 9;
    }
    if (scale === '3:4') {
      return 3 / 4;
    }
    return 4 / 3;
  };
  const buildCutInfo = (width: number, height: number, scale: '4:3' | '16:9' | '3:4') => {
    const ratio = getScaleRatio(scale);
    let cutWidth = width;
    let cutHeight = width / ratio;
    let xpos = 0;
    let ypos = scale === '3:4' ? 0 : Math.round((height - cutHeight) / 2);

    if (cutHeight > height) {
      cutHeight = height;
      cutWidth = height * ratio;
      xpos = Math.round((width - cutWidth) / 2);
      ypos = 0;
    }

    return {
      xpos: Math.max(0, xpos),
      ypos: Math.max(0, ypos),
      scale,
      width: Math.round(cutWidth),
      height: Math.round(cutHeight),
    };
  };
  const buildCover = (
    scale: '4:3' | '16:9' | '3:4',
    width: number,
    height: number,
    data?: AiqiyiUploadCoverResponse,
  ) => ({
    cutInfo: buildCutInfo(width, height, scale),
    aiImageId: '',
    swift: getCoverSwift(data),
    uploadType: 0,
    url: getCoverUrl(data),
    width,
    height,
  });

  const coverWidth = taskData.cover.width || 0;
  const coverHeight = taskData.cover.height || 0;
  const verticalCoverWidth = taskData.verticalCover?.width || coverWidth;
  const verticalCoverHeight = taskData.verticalCover?.height || coverHeight;
  const verticalCoverSourceData = verticalCoverData?.data?.share_url ? verticalCoverData : coverData;
  const cover = new Array<any>();
  //横板封面
  cover.push(buildCover('3:4', verticalCoverWidth, verticalCoverHeight, verticalCoverSourceData));
  cover.push(buildCover('4:3', coverWidth, coverHeight, coverData));
  cover.push(buildCover('16:9', coverWidth, coverHeight, coverData));


  // const yiBiyiImage = {
  //   cropBox: null,
  //   cutInfo: {
  //     xpos: 0,
  //     ypos: 0,
  //     width: 675,
  //     height: 675,
  //     scale: '1:1',
  //   },
  //   height: 675,
  //   width: 675,
  //   inner: coverData.data.file_path ?? coverData?.data?.httpInnerUrl ?? coverDataEnd?.data?.data?.innerUrl,
  //   swift: coverData.data.file_path ?? coverData?.data?.httpInnerUrl ?? coverDataEnd?.data?.data?.innerUrl,
  //   url: coverData.data.share_url ?? coverDataEnd?.data?.data?.outerUrl,
  //   uploadType: 0,
  //   aiImageId: '',
  // };
  // images.push(yiBiyiImage);

  re['cover'] = cover;
  re['panoramicImage'] = null;
  re['qipuId'] = qipuId ?? taskData.qipuId ?? null;
  re['operType'] = 'INSERT';

  return re;
};
