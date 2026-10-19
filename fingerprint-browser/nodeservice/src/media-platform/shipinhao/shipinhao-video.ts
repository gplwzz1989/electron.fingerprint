import {
  getUploadedVideoInfo,
  saveTmpPostDraft,
  ShipinhaoVideoTaskInput,
  UploadPartResult,
  uploadVideoPart,
  publish,
  UploadedVideoInfoResponse,
} from './shipinhao-video.service';

import { uploadCover, getUploadAuthKey, UploadAuthKeyResponse } from '../shipinhao/shipinhao-base.service';
import {
  GetMD5ByPathLike,
  Guid,
  logger,
  publishStatusEnum,
  SetProgressEvent,
  SetProgressNewEvent,
  Task,
  UploadEmitGate,
} from '../../utils';
import { EventEmitter } from 'events';
import fs from 'fs';

import { AxiosError } from 'axios';
import { checkLinkValid, getUploadId, getUserinfo } from './shipinhao-base.service';
import path from 'path';
import { MediaType } from './shipinhao-types';
import { BaseResult } from '../baseResult';
import { errorCode } from '../errorCode';
import { privateKey } from '../../utils/CancelToken';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createKuaiProxyAgent } from '@/media-platform/webproxy';

/**
 *  视频上传过程
 * @param taskData 任务提
 * @param eventCallback 事件回调
 * @param pubResult 发布结果
 * @param fileStat 文件句柄
 * @param fileName 文件名
 * @param maxThread 最大并发上传
 * @param uin 用户uin参数
 * @param innerTaskId 过程id
 * @param uploadAuthDataOut
 * @param cookie
 * @param finderUsername
 */
export const uploadVideo = async (
  taskData: ShipinhaoVideoTaskInput,
  eventCallback: EventEmitter,
  pubResult: ShipinhaoPublishResultOutput,
  fileStat: fs.Stats,
  fileName: string,
  maxThread: number,
  uin: number,
  innerTaskId: string,
  uploadAuthDataOut: { node: UploadAuthKeyResponse },
  cookie: string,
  finderUsername: string,
): Promise<UploadedVideoInfoResponse | null | undefined> => {
  let fileHandle: fs.promises.FileHandle | null = null;
  try {
    //获取上传认证参数
    let uploadAuthData = await getUploadAuthKey(cookie, finderUsername ?? '');
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (!uploadAuthData?.data?.authKey) {
      uploadAuthData = await getUploadAuthKey(cookie, finderUsername ?? '');
    }
    if (!uploadAuthData?.data?.authKey) {
      const errCode = uploadAuthData?.errCode;
      // console.debug('获取上传认证参数失败', taskData.taskId, uploadAuthData);
      pubResult.code = errCode ?? errorCode.data_error;
      pubResult.msg = '获取上传认证参数失败:' + uploadAuthData?.errMsg;
      return null;
    }
    uploadAuthDataOut.node = uploadAuthData;

    // SetProgressEvent(eventCallback, 3, '正在获取上传参数', taskData.taskId);
    //获取上传参数
    let uploadVideoArgs = await getUploadId(
      fileStat.size,
      path.basename(taskData.video.localPath),
      uin,
      innerTaskId,
      uploadAuthData.data?.authKey ?? '',
      MediaType.video,
    );
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (!uploadVideoArgs?.UploadID) {
      uploadVideoArgs = await getUploadId(
        fileStat.size,
        path.basename(taskData.video.localPath),
        uin,
        innerTaskId,
        uploadAuthData.data?.authKey ?? '',
        MediaType.video,
      );
    }
    if (!uploadVideoArgs?.UploadID) {
      // console.debug('获取上传ID失败', taskData.taskId, uploadVideoArgs);
      pubResult.code = errorCode.data_error;
      pubResult.msg = '获取上传ID失败:' + (uploadVideoArgs.errMsg ?? '');
      pubResult.errorInfo = JSON.stringify(uploadVideoArgs);
      return null;
    }

    // 获取文件信息
    fileHandle = await fs.promises.open(taskData.video.localPath, 'r');

    // 准备上传分片信息列表
    const uploadedList: Map<number, string> = new Map<number, string>();

    // 开始读取并上传文件
    let readIndex = 0;

    // 分片大小
    const blockSize = 8388608; // 8M
    //总片数
    const totalPartNums = Math.ceil(fileStat.size / blockSize);

    //并行上传
    const tasks: Array<Promise<UploadPartResult>> = [];

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

    const uploadStrList = new Map<number, { PartNumber: number; ETag: string }>();
    // SetProgressEvent(eventCallback, 10, '视频上传中', taskData.taskId);

    // 文件大小小于等单个分片大小
    if (blockSize >= fileStat.size) {
      const buffer = Buffer.alloc(fileStat.size);
      const readData = await fileHandle.read(buffer, 0, fileStat.size, readIndex);
      if (readData.buffer.length > 0) {
        const uploadResult = await uploadVideoPart(
          readData.buffer,
          1,
          uploadVideoArgs.UploadID,
          uin,
          fileName,
          fileStat.size,
          innerTaskId,
          uploadAuthData?.data?.authKey ?? '',
          MediaType.video,
          uploadStrList,
        );
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);
        if (!uploadResult?.ETag && uploadResult['X-Errno'] != 0) {
          pubResult.code = uploadResult['X-Errno'] ?? -2;
          pubResult.msg = '视频分片上传失败:' + uploadResult.errMsg;
          if (uploadResult.errMsg === '服务异常') {
            uploadResult.errMsg = '请重新发布';
          }
          return null;
        }
        uploadedList.set(1, uploadResult.ETag ?? '');
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
            uploadVideoPart(
              readData.buffer,
              partNum,
              uploadVideoArgs.UploadID,
              uin,
              fileName,
              fileStat.size,
              innerTaskId,
              uploadAuthData?.data?.authKey ?? '',
              MediaType.video,
              uploadStrList,
            ),
          );

          if (tasks.length >= maxThread) {
            const uploadResult = await Promise.race(tasks);
            if (!uploadResult?.ETag?.toString() && uploadResult['X-Errno'] != 0) {
              //console.debug(`视频分片${partNum}上传失败:`, taskData.taskId, uploadResult);
              pubResult.code = uploadResult['X-Errno'];
              pubResult.msg = `视频分片${partNum}上传失败:` + uploadResult.errMsg;
              if (uploadResult.errMsg === '服务异常') {
                uploadResult.errMsg = '请重新发布';
              }
              return null;
            }

            uploadedList.set(uploadResult.PartNum, uploadResult.ETag ?? '');
            //onPartUploaded();
            const uploadResultNew = await tasks.splice(0, 1)[0];
            if (!uploadResultNew?.ETag?.toString() && uploadResultNew['X-Errno'] != 0) {
              //console.debug(`视频分片${partNum}上传失败:`, taskData.taskId, uploadResultNew);
              pubResult.code = uploadResultNew['X-Errno'];
              pubResult.msg = `视频分片${partNum}上传失败:` + uploadResultNew.errMsg;
              if (uploadResult.errMsg === '服务异常') {
                uploadResult.errMsg = '请重新发布';
              }
              return null;
            }
            uploadedList.set(uploadResultNew.PartNum, uploadResultNew.ETag ?? '');
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
      if (!uploadResult?.ETag?.toString() && uploadResult['X-Errno'] != 0) {
        //console.debug(`视频分片${uploadResult?.PartNum}上传失败:`, taskData.taskId, uploadResult);
        pubResult.code = uploadResult['X-Errno'];
        pubResult.msg = `视频分片${uploadResult?.PartNum}上传失败:` + uploadResult.errMsg;
        if (uploadResult.errMsg === '服务异常') {
          uploadResult.errMsg = '请重新发布';
        }
        return null;
      }
      uploadedList.set(uploadResult.PartNum, uploadResult.ETag ?? '');
      onPartUploaded();
    }

    if (uploadedList.size != totalPartNums) {
      // console.debug('视频上传失败', taskData.taskId, uploadedList);
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
    const listStr: Array<{ PartNumber: number; ETag: string }> = [];
    for (let i = 1; i <= uploadStrList.size; i++) {
      const item = uploadStrList.get(i);
      if (item) {
        listStr.push(item);
      }
    }
    const uploadVideoInfo = await getUploadedVideoInfo(
      listStr,
      uin,
      fileName,
      uploadVideoArgs.UploadID,
      fileStat.size,
      innerTaskId,
      uploadAuthData?.data?.authKey ?? '',
      MediaType.video,
    );

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!uploadVideoInfo.DownloadURL?.toString()) {
      // //console.debug('视频上传校验失败', taskData.taskId, uploadedList, uploadVideoInfo);
      pubResult.code = -1;
      pubResult.msg = '上传校验失败:' + (uploadVideoInfo?.errMsg ?? '');
      return null;
    }
    pubResult.code = 0;
    pubResult.msg = '';
    return uploadVideoInfo;
  } catch (e) {
    logger.error(`视频号上传视频异常失败${taskData.taskId},${(e as Error)?.message}`);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = '视频上传失败';
    return null;
  } finally {
    fileHandle?.close();
  }
};

/**
 * 视频发布
 * @param cookie
 * @param taskData 发布任务数据体
 * @param eventCallback 事件回调
 * @param finderUsername 用户id信息，可选，默认空
 * @param uin 用户uin信息，默认0
 * @param maxThread 视频上传最大并发数，默认3
 * @param retryTimes 最大重试次数
 */
export const shipinhaoPublishVideo = async (
  cookie: string,
  taskData: ShipinhaoVideoTaskInput,
  eventCallback: EventEmitter,
  finderUsername?: string,
  uin: number = 0,
  maxThread: number = 3,
  retryTimes: number = 3,
): Promise<ShipinhaoPublishResultOutput> => {
  logger.info(`视频号视频发布 ${taskData.taskId}`);
  const pubResult: ShipinhaoPublishResultOutput = {
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
    // 上传id
    const innerTaskId = Guid.NewGuid().toString();
    const clientId = Guid.NewGuid().toString();
    //补充默认数据
    if (!taskData.video.duration) {
      taskData.video.duration = 59;
    }
    if (!taskData.video.width) {
      taskData.video.width = 1280;
      taskData.video.height = 1920;
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

    // region 获取上传前准备信息
    const rawBuffer = '';
    if (!uin) {
      let userInfo = await getUserinfo(cookie);
      uin = userInfo.data?.finderUser?.uin ?? 0;
      finderUsername = userInfo.data?.finderUser?.finderUsername ?? '';
      for (let i = 0; i < retryTimes; i++) {
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);
        if (!uin) {
          const errCode = userInfo?.errCode;
          if (i < retryTimes - 1) {
            await Task.Delay(1000);
            if (!finderUsername) {
              userInfo = await getUserinfo(cookie);
              uin = userInfo.data?.finderUser?.uin ?? 0;
              finderUsername = userInfo.data?.finderUser?.finderUsername ?? '';
            } else {
              const tmpKey = await getUploadAuthKey(cookie, finderUsername);
              uin = tmpKey?.data?.uin ?? 0;
              if (userInfo) {
                userInfo['auth'] = tmpKey;
                userInfo.errMsg = tmpKey.errMsg;
                userInfo.errCode = tmpKey.errCode;
              } else {
                userInfo = { errCode: tmpKey?.errCode, errMsg: tmpKey?.errMsg };
              }
            }

            continue;
          }
          pubResult.code = errCode ?? errorCode.data_error;
          pubResult.msg = '获取用户信息失败' + (errCode == 300334 || errCode == 300333 ? '登录失效' : userInfo.errMsg);
          logger.error(`获取用户信息失败 ${taskData.taskId} ${cookie} ${JSON.stringify(userInfo)}`);
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
    }
    if (!taskData.uin) {
      taskData.uin = uin;
    }
    //验证扩展链接是否有效
    if (taskData.link) {
      let linkRe = await checkLinkValid(cookie, taskData.link, finderUsername ?? '', rawBuffer);
      for (let i = 0; i < retryTimes; i++) {
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);
        if (linkRe?.data?.title) {
          taskData.linkTitle = linkRe.data.title;
          break;
        } else {
          const errCode = linkRe?.errCode;
          if (i < retryTimes - 1 && errCode != 300330 && errCode != 300333) {
            linkRe = await checkLinkValid(cookie, taskData.link, finderUsername ?? '', rawBuffer);
            continue;
          }
          // console.debug('扩展链接非法', taskData.taskId, taskData.link, linkRe);
          pubResult.code = linkRe?.errCode ?? errorCode.data_error;
          pubResult.msg = '扩展链接非法:' + taskData.link;
          logger.error(`扩展链接非法 ${taskData.taskId} ${cookie} ${JSON.stringify(linkRe)}`);
          SetProgressNewEvent(
            eventCallback,
            publishStatusEnum.uploadFail,
            pubResult?.msg ? pubResult.msg : '上传失败',
            taskData.taskId,
          );
          return pubResult;
        }
      }
    }

    //视频基本信息
    const fileStat = await fs.promises.stat(taskData.video.localPath);
    const fileSize = fileStat.size;
    taskData.video.size = fileSize;
    const fileName = path.basename(taskData.video.localPath);

    //获取上传认证参数
    let uploadAuthData: UploadAuthKeyResponse = { errCode: -2, errMsg: '未初始化' };
    const uploadAuthDataIn = { node: uploadAuthData };
    // endregion

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    SetProgressEvent(eventCallback, 3, '正在获取上传认证参数', taskData.taskId);

    // region 视频上传
    let uploadVideoInfo = await uploadVideo(
      taskData,
      eventCallback,
      pubResult,
      fileStat,
      fileName,
      maxThread,
      uin,
      innerTaskId,
      uploadAuthDataIn,
      cookie,
      finderUsername ?? '',
    );
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      if (!uploadVideoInfo?.DownloadURL?.toString()) {
        if (i < retryTimes - 1 && pubResult.code != 300330 && pubResult.code != 300333) {
          SetProgressEvent(eventCallback, 4, '上传失败,重试中', taskData.taskId);
          uploadVideoInfo = await uploadVideo(
            taskData,
            eventCallback,
            pubResult,
            fileStat,
            fileName,
            maxThread,
            uin,
            innerTaskId,
            uploadAuthDataIn,
            cookie,
            finderUsername ?? '',
          );
          continue;
        }
        pubResult.code = pubResult?.code > 0 ? pubResult.code : 2;
        pubResult.msg = pubResult.msg ?? uploadVideoInfo?.errMsg;
        logger.error(
          `视频上传失败 ${taskData.taskId} ${cookie} ${JSON.stringify(uploadVideoInfo)} ${JSON.stringify(pubResult)}`,
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
    if (!uploadVideoInfo?.DownloadURL?.toString()) {
      pubResult.code = pubResult?.code > 0 ? pubResult.code : 2;
      pubResult.msg = '视频上传失败:' + (uploadVideoInfo?.errMsg ?? pubResult.msg);
      logger.error(
        `视频上传失败 ${taskData.taskId} ${cookie} ${JSON.stringify(uploadVideoInfo)} ${JSON.stringify(pubResult)}`,
      );
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult?.msg ? pubResult.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }
    uploadAuthData = uploadAuthDataIn.node;

    // endregion
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // region 保存草稿
    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);
    const transVideoUrl = 'https://finder.video.qq.com' + uploadVideoInfo.DownloadURL?.toString().split('qq.com')[1];

    let saveTmpData = await saveTmpPostDraft(
      cookie,
      transVideoUrl,
      taskData.video.width,
      taskData.video.height,
      taskData.video.duration,
      fileSize,
      finderUsername,
    );
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      if (!saveTmpData?.data?.draftId) {
        // console.debug('保存视频数据失败', taskData.taskId, transVideoUrl, uploadVideoInfo, saveTmpData);
        if (i < retryTimes - 1 && saveTmpData?.errCode != 300330 && saveTmpData?.errCode != 300333) {
          saveTmpData = await saveTmpPostDraft(
            cookie,
            transVideoUrl,
            taskData.video.width,
            taskData.video.height,
            taskData.video.duration,
            fileSize,
            finderUsername,
          );
          continue;
        }
        pubResult.code = saveTmpData?.errCode > 0 ? saveTmpData?.errCode : -1;
        pubResult.msg = `保存视频数据失败:${saveTmpData.errMsg ?? ''}`;
        logger.error(
          `保存视频数据失败 ${taskData.taskId} ${cookie} ${JSON.stringify(saveTmpData)} ${JSON.stringify(pubResult)}`,
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

    // endregion
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // region 封面上传
    SetProgressEvent(eventCallback, 90, '封面上传中', taskData.taskId);
    let uploadedCoverInfo = await uploadCover(
      taskData.cover.pathOrUrl,
      taskData.taskId,
      innerTaskId,
      uin,
      uploadAuthData?.data?.authKey ?? '',
      pubResult,
    );
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      if (!uploadedCoverInfo?.DownloadURL?.toString()) {
        // console.debug('封面上传失败', taskData.taskId, taskData?.cover?.pathOrUrl, uploadedCoverInfo);
        if (i < retryTimes - 1) {
          uploadedCoverInfo = await uploadCover(
            taskData.cover.pathOrUrl,
            taskData.taskId,
            innerTaskId,
            uin,
            uploadAuthData?.data?.authKey ?? '',
            pubResult,
          );
          continue;
        }
        pubResult.code = pubResult?.code > 0 ? pubResult.code : uploadedCoverInfo?.errCode ?? -1;
        pubResult.msg = pubResult.msg ? pubResult.msg : `封面上传失败:${uploadedCoverInfo?.errMsg ?? ''}`;
        logger.error(
          `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${JSON.stringify(
            uploadedCoverInfo,
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

    //横版封面
    let hCoverInfo: { DownloadURL: string; errMsg?: string | undefined; errCode?: number | undefined } | null = null;
    if (taskData.horizontalCover?.pathOrUrl) {
      hCoverInfo = await uploadCover(
        taskData.horizontalCover.pathOrUrl,
        taskData.taskId,
        innerTaskId,
        uin,
        uploadAuthData?.data?.authKey ?? '',
        pubResult,
      );
      for (let i = 0; i < retryTimes; i++) {
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);
        if (!hCoverInfo?.DownloadURL?.toString()) {
          // console.debug('横版封面上传失败', taskData.taskId, taskData?.horizontalCover?.pathOrUrl, hCoverInfo);
          if (i < retryTimes - 1) {
            hCoverInfo = await uploadCover(
              taskData.horizontalCover.pathOrUrl,
              taskData.taskId,
              innerTaskId,
              uin,
              uploadAuthData?.data?.authKey ?? '',
              pubResult,
            );
            continue;
          }
          pubResult.code = pubResult?.code > 0 ? pubResult.code : hCoverInfo?.errCode ?? -1;
          pubResult.msg = pubResult.msg ? pubResult.msg : `横版封面上传失败:${hCoverInfo?.errMsg ?? ''}`;
          logger.error(
            `横版封面上传失败 ${taskData.taskId} ${cookie} ${taskData.horizontalCover.pathOrUrl} ${JSON.stringify(
              hCoverInfo,
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
    }

    // endregion
    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    const transCoverUrl = 'https://finder.video.qq.com' + uploadedCoverInfo?.DownloadURL?.toString().split('qq.com')[1];
    const transHCoverUrl = taskData.horizontalCover?.pathOrUrl
      ? 'https://finder.video.qq.com' + hCoverInfo?.DownloadURL?.toString().split('qq.com')[1]
      : undefined;
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);
    // region 组装并推送数据
    // 组装发布数据
    const fileMd5 = await GetMD5ByPathLike(taskData.video.localPath);
    const publishResult = await publish(
      cookie,
      taskData,
      transVideoUrl,
      transCoverUrl,
      fileMd5,
      saveTmpData?.data?.draftId ?? '',
      saveTmpData?.data?.clipKey ?? '',
      finderUsername,
      rawBuffer,
      clientId,
      webProxy,
      transHCoverUrl,
    );
    if (taskData.pubType === 0) {
      pubResult.code = publishResult?.errCode ?? 2;
      pubResult.msg = publishResult.errMsg ?? '';
    } else {
      pubResult.code = publishResult?.data?.baseResp?.errcode ?? 2;
      pubResult.msg = publishResult?.data?.baseResp?.errmsg ?? publishResult.errMsg ?? '';
    }

    if (publishResult?.data?.baseResp?.errcode?.toString() == '-11224') {
      pubResult.msg = '视频号管理员完成实名且绑定手机号后才可以发表';
    }
    pubResult.publishId = (transCoverUrl.includes('encfilekey=') ? transCoverUrl.split('encfilekey=')[1] : '').split(
      '&',
    )[0];
    if (pubResult.code == 0) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      pubResult.publishId = undefined;
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      logger.error(
        `视频号视频发布失败 ${taskData.taskId} ${cookie} ${JSON.stringify(taskData)} ${JSON.stringify(publishResult)}`,
      );
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
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
    logger.error(`视频号视频发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
    if (pubResult?.code === 300333) {
      pubResult.msg = '登录失效';
    } else if (pubResult?.code === 300334) {
      pubResult.msg = '登录失效，同一微信授权了新账号。';
    } else if (pubResult?.code == 300330) {
      pubResult.msg = '未登录';
    } else if (pubResult?.code == 300002) {
      pubResult.msg = '官方平台在校验音乐/位置/定时信息时失败了，请重新编辑后发布。';
    }
  }

  return pubResult;
};

export interface ShipinhaoPublishResultOutput extends BaseResult {
  /**
   * 状态码
   * -0成功，非0失败
   */
  code: number;

  /**
   *提示消息
   */
  msg: string;

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
