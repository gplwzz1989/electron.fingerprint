import { DayuhaoTopicInfo } from '../dayuhao/dayuhao-topic';
import { EventEmitter } from 'events';
import { BaseResult } from '../baseResult';
import { errorCode } from '../errorCode';
import fs from 'fs';
import { getDayuhaoUserInfo } from '../dayuhao/dayuhao-common';
import {
  logger,
  publishStatusEnum,
  readImageData,
  SetProgressEvent,
  SetProgressNewEvent,
  stepWaitTime,
  Task,
} from '../../utils';
import { UploadEmitGate } from '../../utils';

import path from 'path';
import {
  CutImageInfoResponse,
  DayuUploadedVideoIdResponse,
  getCutImageInfoResponse,
  getUploadArgsResponse,
  getUploadedVideoIdResponse,
  getUploadIdResponse,
  getUploadProcessResponse,
  getUploadSignResponse,
  pushVideoDataResponse,
  uploadImageInfoResponse,
  uploadVideoPart,
} from '../dayuhao/dayuhao-video.service';
import { ImageInfo } from '../baseModel';
import { AxiosError } from 'axios';
import { getNowTimeStamp } from '../../utils/use-date';
import { KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import { ITask } from '@/media-platform/baseTask';

/**
 * 视频上传完整过程
 * @param taskData 任务数据
 * @param pubResult 发布结果对象
 * @param eventCallback 回调事件对象
 * @param uid 用户id
 * @param requestId
 * @param maxThread 最大并发上传数
 * @param cookie
 */
export const uploadVideo = async (
  taskData: DayuhaoVideoTaskInput,
  pubResult: DayuhaoPublishResultOutput,
  eventCallback: EventEmitter,
  uid: string,
  requestId: string,
  maxThread: number,
  cookie: string,
): Promise<DayuUploadedVideoIdResponse | null> => {
  let fileHandle: fs.promises.FileHandle | null = null;
  try {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // 获取文件信息
    const fileStat = await fs.promises.stat(taskData.video.localPath);
    fileHandle = await fs.promises.open(taskData.video.localPath, 'r');

    const videoLength = fileStat.size;

    //获取上传sign
    const uploadSign = await getUploadSignResponse(cookie, uid, requestId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!uploadSign?.data?.sign) {
      // console.debug('获取上传参数失败', taskData.taskId, uploadSign);

      pubResult.code = uploadSign.code ?? errorCode.data_error;
      pubResult.msg = '获取上传参数失败:' + (uploadSign.message ?? uploadSign?.error?.message ?? '');

      return null;
    }

    // 获取上传参数
    const uploadVideoArgs = await getUploadArgsResponse(uid, uploadSign);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!uploadVideoArgs?.data?.list.length) {
      // console.debug('获取上传参数失败', taskData.taskId, uploadVideoArgs);

      pubResult.code = uploadVideoArgs?.code ?? errorCode.data_error;
      pubResult.msg = '获取上传参数失败:' + (uploadVideoArgs.message ?? '');

      return null;
    }

    // 获取上传Id
    const uploadVideoIdStr = await getUploadIdResponse(uploadVideoArgs);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!uploadVideoIdStr?.includes('<UploadId>')) {
      // console.debug('获取上传Id参数失败', taskData.taskId, uploadVideoArgs);

      pubResult.code = errorCode.data_error;
      pubResult.msg = '获取上Id传参数失败:' + (uploadVideoIdStr?.split('<Message>')[1].split('<')[0] ?? '');

      return null;
    }
    const uploadId = uploadVideoIdStr.split('<UploadId>')[1].split('<')[0];

    // 开始读取并上传文件
    let readIndex = 0;

    // 分片大小
    const blockSize = 5242880;

    // 总片数
    const totalPartNums = Math.ceil(videoLength / blockSize);

    // 并行上传
    const tasks: Array<Promise<string>> = [];

    const uploadedList = new Map<number, string>();
    // SetProgressEvent(eventCallback, 10, '视频上传中', taskData.taskId);

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
      const buffer = Buffer.alloc(videoLength);
      const readData = await fileHandle.read(buffer, 0, videoLength, readIndex);
      if (readData.buffer.length > 0) {
        const uploadProcessArgs = await getUploadProcessResponse(uploadVideoArgs, uploadSign, uid, 1, uploadId);

        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);

        const uploadResult = await uploadVideoPart(
          readData.buffer,
          uploadId,
          1,
          uploadProcessArgs.data.host,
          uploadProcessArgs.data.object,
          uploadProcessArgs.data.gmdate,
          uploadProcessArgs.data.authorization,
          uploadedList,
        );
        if (!uploadResult) {
          pubResult.code = errorCode.data_error;
          pubResult.msg = '视频分片上传失败';

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
      while (readIndex < videoLength) {
        partNum++;

        // SetProgressEvent(
        //   eventCallback,
        //   10 + Number.parseFloat(((partNum / totalPartNums) * 0.7 * 100).toFixed(2).substring(0, 4)),
        //   '视频上传中',
        //   taskData.taskId,
        // );

        let canReadNum = blockSize;
        let buffer = Buffer.alloc(blockSize);
        if (readIndex + blockSize > videoLength) {
          canReadNum = videoLength - readIndex;
          buffer = Buffer.alloc(canReadNum);
        }

        const readData = await fileHandle.read(buffer, 0, canReadNum, readIndex);
        if (readData.buffer.length > 0) {
          //取消任务执行
          taskData.cancelToken?.throwIfCancelled(privateKey);

          const uploadProcessArgs = await getUploadProcessResponse(uploadVideoArgs, uploadSign, uid, partNum, uploadId);
          tasks.push(
            uploadVideoPart(
              readData.buffer,
              uploadId,
              partNum,
              uploadProcessArgs.data.host,
              uploadProcessArgs.data.object,
              uploadProcessArgs.data.gmdate,
              uploadProcessArgs.data.authorization,
              uploadedList,
            ),
          );

          if (tasks.length > maxThread) {
            const uploadResult = await Promise.race(tasks);
            if (!uploadResult) {
              pubResult.code = errorCode.data_error;
              pubResult.msg = '视频分片上传失败';

              return null;
            }
            const uploadResultNew = await tasks.splice(0, 1)[0];
            if (!uploadResultNew) {
              pubResult.code = errorCode.data_error;
              pubResult.msg = '视频分片上传失败';

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
          pubResult.msg = '文件读取失败' + taskData.video.localPath;

          return null;
        }
      }
    }
    while (tasks.length > 0) {
      const uploadResult = await tasks.splice(0, 1)[0];
      if (!uploadResult) {
        pubResult.code = errorCode.data_error;
        pubResult.msg = '视频分片上传失败';

        return null;
      }
      onPartUploaded();
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    //获取上传完成信息
    const uploadCompletedArgs = await getUploadProcessResponse(
      uploadVideoArgs,
      uploadSign,
      uid,
      0,
      uploadId,
      'complete',
    );

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    //暂存  const uploadedInfo = await getFinishUploadInfoResponse(uploadCompletedArgs, uploadSign, uid);
    if (!uploadCompletedArgs?.data?.host) {
      // console.debug('视频上传校验失败', taskData.taskId, uploadVideoArgs, uploadCompletedArgs);

      pubResult.code = uploadCompletedArgs?.code ?? errorCode.data_error;
      pubResult.msg = '上传校验失败:' + (uploadCompletedArgs?.message ?? '');

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
    const partStrList: Array<string> = [];
    for (let i = 1; i <= uploadedList.size; i++) {
      const partEtag = uploadedList.get(i);
      partStrList.push(`<Part><PartNumber>${i}</PartNumber><ETag>${partEtag}</ETag></Part>`);
    }
    const uploadListStr = `<CompleteMultipartUpload>${partStrList.join('')}</CompleteMultipartUpload>`;

    // 检查视频上传是否成功
    const checkResult = await getUploadedVideoIdResponse(uploadCompletedArgs, uploadListStr, uploadId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!checkResult?.data?.id) {
      // console.debug('视频上传校验失败', taskData.taskId, uploadVideoArgs, checkResult);

      pubResult.code = checkResult.code ?? errorCode.data_error;
      pubResult.msg = '上传校验失败:' + (checkResult.message ?? '');

      return null;
    }

    pubResult.code = 0;
    pubResult.msg = '';
    checkResult.sign = uploadSign.data.sign;
    return checkResult;
    // endregion
  } catch (e) {
    logger.error(`大鱼号横版视频上传异常失败,${taskData.taskId},${(e as Error)?.message}`);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = '视频上传失败';
    return null;
  } finally {
    fileHandle?.close();
  }
};

/**
 * 上传横板封面
 * @param cookie
 * @param taskId
 * @param uid
 * @param coverInfo 封面
 * @param pubResult
 * @param imageUpSign
 * @param uToken
 * @param imageCutSign
 */
export const uploadCover = async (
  cookie: string,
  taskId: string,
  uid: string,
  coverInfo: ImageInfo,
  pubResult: DayuhaoPublishResultOutput,
  imageUpSign: string,
  uToken: string,
  imageCutSign: string,
): Promise<CutImageInfoResponse | null> => {
  //下载图片后上传
  const imgData = await readImageData(coverInfo.pathOrUrl, 'jpeg');
  if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
    console.error(taskId, `图片下载失败-${imgData.status}-${coverInfo.pathOrUrl}`);
    pubResult.code = errorCode.data_error;
    pubResult.msg = `图片下载失败-${imgData.status}-${coverInfo.pathOrUrl}`;
    return null;
  }
  const resultJson = await uploadImageInfoResponse(cookie, imgData.data, uid, imageUpSign, `myPic.${imgData.ext}`);

  if (!resultJson?.data?.src) {
    logger.error(`${taskId}-图片上传失败-${coverInfo.pathOrUrl}\n${JSON.stringify(resultJson)}`);
    pubResult.code = resultJson?.code ?? errorCode.data_error;
    pubResult.msg = `封面上传失败-${resultJson?.message}-${coverInfo.pathOrUrl}`;
    return null;
  }

  const uploadedImageInfo = await getCutImageInfoResponse(cookie, uid, imageCutSign, resultJson.data?.src, uToken);
  if (!uploadedImageInfo?.data?.url) {
    logger.error(
      `${taskId}-图片裁剪失败-${coverInfo.pathOrUrl}-${resultJson.data?.src}\n${JSON.stringify(uploadedImageInfo)}`,
    );
    pubResult.code = uploadedImageInfo?.code ?? errorCode.data_error;
    pubResult.msg = `图片裁剪失败-${uploadedImageInfo?.message}-${coverInfo.pathOrUrl}`;
    return null;
  }
  if (!uploadedImageInfo?.data?.url && uploadedImageInfo?.data?.src) {
    uploadedImageInfo.data.url = uploadedImageInfo?.data?.src;
  }
  pubResult.code = 0;
  pubResult.msg = '';
  return uploadedImageInfo;
};

/**
 *  抖音发布视频
 * @param cookie cookie字符串 eg: cookie1=12;cookie2=345
 * @param taskData 发布入参
 * @param eventCallback 进度回调
 * @param uid 用户uid
 * @param uToken 用户信息中utoken
 * @param requestId 用户信息中requestId
 * @param imageUpSign
 * @param imageCutSign
 * @param retryTimes 单个步骤失败后重试次数，默认3
 * @param maxThread 视频并发上传数，默认3
 */
export const publishDayuhaoVideo = async (
  cookie: string,
  taskData: DayuhaoVideoTaskInput,
  eventCallback: EventEmitter,
  uid: string,
  uToken: string,
  requestId: string,
  imageUpSign: string,
  imageCutSign: string,
  maxThread: number = 3,
  retryTimes: number = 3,
): Promise<DayuhaoPublishResultOutput> => {
  logger.error(`大鱼横版发布 ${taskData.taskId}`);

  const pubResult: DayuhaoPublishResultOutput = {
    code: 0,
    msg: '',
    taskId: taskData.taskId,
  };
  try {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploading, '开始发布', taskData.taskId);
    if (!fs.existsSync(taskData.video.localPath?.toString() ?? '')) {
      logger.error(`视频文件不存在 ${taskData.taskId} ${taskData.video.localPath}`);
      pubResult.code = errorCode.io_error;
      pubResult.msg = '视频文件不存在:' + taskData.video.localPath;
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult.msg ? pubResult?.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }

    //没有传入时，去获取
    if (!uid || !imageCutSign) {
      const userInfo = await getDayuhaoUserInfo(cookie);

      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      uid = userInfo?.data?.uid ?? '';
      requestId = userInfo.data?.requestId ?? '';
      uToken = userInfo.data?.utoken ?? '';
      imageUpSign = userInfo.data?.imageUpSign ?? '';
      imageCutSign = userInfo.data?.imageCutSign ?? '';
    }

    SetProgressEvent(eventCallback, 1, '准备上传中', taskData.taskId);

    // region 准备发布上传前置数据

    SetProgressEvent(eventCallback, 3, '正在获取上传参数', taskData.taskId);

    // 获取上传认证参数
    // endregion

    // region 视频上传
    let uploadVideoInfo = await uploadVideo(taskData, pubResult, eventCallback, uid, requestId, maxThread, cookie);
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      if (!uploadVideoInfo?.data?.id) {
        if (pubResult?.errorInfo?.includes('登录')) {
          SetProgressNewEvent(
            eventCallback,
            publishStatusEnum.uploadFail,
            pubResult.msg ? pubResult?.msg : '上传失败',
            taskData.taskId,
          );
          return pubResult;
        }
        if (i < retryTimes - 1) {
          SetProgressEvent(eventCallback, 4, '上传失败,重试中', taskData.taskId);
          uploadVideoInfo = await uploadVideo(taskData, pubResult, eventCallback, uid, requestId, maxThread, cookie);
          continue;
        }
        logger.error(
          `视频上传失败 ${taskData.taskId} ${cookie} ${JSON.stringify(uploadVideoInfo)} ${JSON.stringify(pubResult)}`,
        );
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploadFail,
          pubResult.msg ? pubResult?.msg : '上传失败',
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
        pubResult.msg ? pubResult?.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }
    // endregion

    // region 封面上传

    SetProgressEvent(eventCallback, 90, '封面上传中', taskData.taskId);

    //横板封面
    let uploadedCoverInfo = await uploadCover(
      cookie,
      taskData.taskId,
      uid,
      taskData.cover,
      pubResult,
      imageUpSign,
      uToken,
      imageCutSign,
    );
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      if (!uploadedCoverInfo?.data?.url) {
        if (i < retryTimes - 1) {
          await Task.Delay(stepWaitTime);
          uploadedCoverInfo = await uploadCover(
            cookie,
            taskData.taskId,
            uid,
            taskData.cover,
            pubResult,
            imageUpSign,
            uToken,
            imageCutSign,
          );
          continue;
        }
        logger.error(
          `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${JSON.stringify(
            uploadedCoverInfo,
          )} ${JSON.stringify(pubResult)}`,
        );
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploadFail,
          pubResult.msg ? pubResult?.msg : '上传失败',
          taskData.taskId,
        );
        pubResult.code = pubResult?.code ? pubResult.code : errorCode.data_error;
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
        pubResult.msg ? pubResult?.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }

    //竖版封面
    let uploadedVerticalCoverInfo: CutImageInfoResponse | null = null;
    if (taskData?.verticalCover?.pathOrUrl) {
      uploadedVerticalCoverInfo = await uploadCover(
        cookie,
        taskData.taskId,
        uid,
        taskData.cover,
        pubResult,
        imageUpSign,
        uToken,
        imageCutSign,
      );
      for (let i = 0; i < retryTimes; i++) {
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);

        if (!uploadedVerticalCoverInfo?.data?.url) {
          if (i < retryTimes - 1) {
            await Task.Delay(stepWaitTime);
            uploadedVerticalCoverInfo = await uploadCover(
              cookie,
              taskData.taskId,
              uid,
              taskData.cover,
              pubResult,
              imageUpSign,
              uToken,
              imageCutSign,
            );
            continue;
          }
          logger.error(
            `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${JSON.stringify(
              uploadedVerticalCoverInfo,
            )} ${JSON.stringify(pubResult)}`,
          );
          SetProgressNewEvent(
            eventCallback,
            publishStatusEnum.uploadFail,
            pubResult.msg ? pubResult?.msg : '上传失败',
            taskData.taskId,
          );
          pubResult.code = pubResult?.code ? pubResult.code : errorCode.data_error;
          return pubResult;
        }
        break;
      }
    }

    if (taskData.verticalCover?.pathOrUrl && uploadedVerticalCoverInfo == null) {
      logger.error(
        `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${JSON.stringify(
          uploadedVerticalCoverInfo,
        )} ${JSON.stringify(pubResult)}`,
      );
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult.msg ? pubResult?.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);

    // endregion
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    // region 组装并推送数据

    // 组装发布数据

    const draftData = buildDraftPostData(
      taskData,
      uploadedCoverInfo,
      uploadedVerticalCoverInfo,
      uploadVideoInfo,
      path.basename(taskData.video.localPath),
      '',
      uToken,
    );

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (taskData.pubType === 0) {
      //取消任务执行
      taskData.cancelToken?.disable(privateKey);
    }
    const draftResult = await pushVideoDataResponse(cookie, draftData, uToken, 'save-draft');
    if (!draftResult?.data?._id) {
      pubResult.code = -2;
      pubResult.msg = `草稿保存失败:${draftResult.error}`;
      logger.error(
        `草稿保存失败 ${taskData.taskId} ${cookie} ${JSON.stringify(draftData)} ${JSON.stringify(draftResult)}`,
      );
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult.msg ? pubResult?.msg : '推送失败',
        taskData.taskId,
      );
      return pubResult;
    }
    if (taskData.pubType === 0) {
      pubResult.code = 0;
      pubResult.publishId = draftResult.data._id;
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送草稿成功', taskData.taskId);
      return pubResult;
    }

    //推送数据
    const postData = buildPushPostData(draftResult.data._id, uToken, '');

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);

    // console.debug('大鱼号横版推送数据', taskData.taskId, cookie, draftData, postData);
    taskData.draftId = draftResult.data._id;
    const publishResult = await pushVideoDataResponse(cookie, postData, uToken, 'submit-article');
    // console.debug('大鱼号横版推送返回数据', taskData.taskId, publishResult);

    pubResult.code = publishResult.data?._id ? 0 : errorCode.data_error;
    pubResult.msg = publishResult.error ?? '';
    pubResult.publishId = publishResult?.data?.content_id ? draftResult.data._id : '';

    // console.debug('大鱼横版视频发布完成', taskData.taskId, taskData, uploadedCoverInfo, uploadVideoInfo, pubResult);

    if (pubResult.publishId) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult.msg ? pubResult?.msg : '推送失败',
        taskData.taskId,
      );
      logger.error(`大鱼横版发布失败 ${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(publishResult)}`);
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
    }

    return pubResult;
    // endregion
  } catch (e) {
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
      pubResult.msg ? pubResult?.msg : '推送失败',
      taskData.taskId,
    );
    logger.error(`大鱼横版发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};

/**
 * 组装发布参数
 * @param taskData
 * @param coverInfo
 * @param verticalCoverUrl
 * @param videoInfoIn
 * @param fileName
 * @param requestId
 * @param uToken
 */
const buildDraftPostData = (
  taskData: DayuhaoVideoTaskInput,
  coverInfo: CutImageInfoResponse,
  verticalCoverUrl: CutImageInfoResponse | null | undefined,
  videoInfoIn: DayuUploadedVideoIdResponse,
  fileName: string,
  requestId: string,
  uToken: string,
): string => {
  const argsList: Array<string> = [];

  argsList.push(
    `_rid=${
      requestId ?? ''
    }&labor_activity_mode=1&labor_activity_id=&is_join_labor=false&keyframe_index=&isCloseAdManual=false&article_id=&mid=`,
  );

  argsList.push('cover_from=1');
  argsList.push('article_category=1');
  //原创
  argsList.push(`is_original=${taskData.isOriginal ?? 0}`);

  //加入UC分润
  argsList.push(`is_show_ad=${taskData.isShowAd ?? false}`);

  //加入优酷流量分成
  argsList.push(`is_video_ad_share=${taskData.isVideoAdShare ?? false}`);

  argsList.push(`draft_id=${taskData.draftId ?? ''}`);
  argsList.push('materialId=');
  argsList.push(`videoId=${videoInfoIn.data.id ?? ''}`);
  argsList.push(`videoFileName=${encodeURIComponent(fileName ?? '')}`);

  const desc = taskData.desc ?? '';
  argsList.push(`sub_title=${encodeURIComponent(desc ?? '')}`);
  argsList.push(`coverImg=${encodeURIComponent(coverInfo?.data.url ?? '')}`);
  argsList.push(`origin_cover_url=${encodeURIComponent(coverInfo?.data.oriUrl ?? '')}`);
  argsList.push(`article_type=1&category=${encodeURIComponent(taskData.categoryName ?? '')}`);
  argsList.push('aoyun=false&weixin_promote=false&curDaySubmit=false');

  //标签
  if (taskData.tags?.length) {
    argsList.push('customize_tags=' + encodeURIComponent(JSON.stringify(taskData.tags ?? [])));
  } else {
    argsList.push('customize_tags=%5B%5D');
  }

  let title = taskData.title ?? '';
  //话题
  if (taskData.topics?.length) {
    let i = 0;
    for (const topic of taskData.topics) {
      argsList.push(encodeURIComponent('topics[' + i + '][id]') + '=' + topic.id);
      argsList.push(encodeURIComponent('topics[' + i + '][topic_title]') + '=' + encodeURIComponent(topic.title));
      title = `${title}#${topic.title} `;
      i++;
    }
  }

  argsList.push(`title=${encodeURIComponent(title)}`);

  //征文活动
  argsList.push('article_activity_title=&article_activity_id=');
  //横版视频竖版封面
  if (verticalCoverUrl?.data?.url) {
    argsList.push(
      `vertical_cover_url=${verticalCoverUrl.data.url}&keyword=&is_exclusive=false&use_vertical_cover=true`,
    );
  } else {
    argsList.push('vertical_cover_url=&keyword=&is_exclusive=false&use_vertical_cover=false');
  }

  argsList.push(`content_type=1001&checkMangoTv=false&mongoTvId=&&originCoverImg=&pageOpenTime=${getNowTimeStamp(10)}`);

  argsList.push(
    'cutOrderInfo%5Bstory_id%5D=&cutOrderInfo%5Bapp_id%5D=&cutOrderInfo%5Buniq_id%5D=&cutOrderInfo%5Bquery%5D=true&cutOrderInfo%5Bsave%5D=false&cutOrderInfo%5Berror%5D=false&cutOrderInfo%5Bvalid%5D=false',
  );
  argsList.push(`utoken=${uToken}`);

  //定时发布参数
  if (taskData.publishTime) {
    argsList.push('is_timed_release=true');
    argsList.push(`time_for_release=${taskData.publishTime}`);
  } else {
    argsList.push('is_timed_release=false');
    argsList.push(`time_for_release=${getNowTimeStamp(13)}`);
  }

  //申明
  if (taskData.sourceRemark?.type) {
    argsList.push(
      `${encodeURIComponent('source_remark_detail[type]')}=${encodeURIComponent(
        sourceRemarkDescObj[taskData.sourceRemark.type],
      )}`,
    );
  }

  return argsList.join('&');
};

const buildPushPostData = (draftId: string, uToken: string, requestId: string = ''): string => {
  return `_rid=${
    requestId ?? ''
  }&dataList%5B0%5D%5B_id%5D=${draftId}&dataList%5B0%5D%5BisDraft%5D=1&dataList%5B0%5D%5Bgoods_num%5D=0&dataList%5B0%5D%5BcheckMangoTv%5D=false&dataList%5B0%5D%5BmongoTvId%5D=&curDaySubmit=false&utoken=${uToken}`;
};

export interface DayuhaoVideoTaskInput extends ITask{
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
  cover: ImageInfo;
  /**
   * 竖版封面
   */
  verticalCover?: ImageInfo;
  /**
   * 发布类型
   * 0 存草稿 平台支持才有效，否则默认为发布
   * 1 发布
   */
  pubType: number;
  /**
   * 标题
   */
  title: string;
  /**
   * 话题
   */
  topics?: Array<DayuhaoTopicInfo>;

  /**
   * 描述
   */
  desc: string;

  /**
   * 标签
   */
  tags?: Array<string>;

  /**
   * 一级分类
   */
  categoryName: string;

  /**
   * 草稿id
   */
  draftId?: string;

  /**
   * 定时发布13位时间戳
   */
  publishTime?: number;

  /**
   * 是否原创
   */
  isOriginal?: 0 | 1;

  /**
   * 是否加入UC分润
   */
  isShowAd?: boolean;

  /**
   * 是否加入优酷分成
   */
  isVideoAdShare?: boolean;

  /**
   * 0:无需申明
   * 3:虚构演绎
   * 4:AI生成
   */
  sourceRemark?: {
    type?: 0 | 3 | 4;
  };

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;

}

export const sourceRemarkDescObj = {
  3: '虚构演绎',
  4: 'AI生成',
};

export interface DayuhaoPublishResultOutput extends BaseResult {
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
