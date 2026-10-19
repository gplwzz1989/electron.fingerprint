import fs from 'fs';
import { BaseResult } from '../baseResult';
import { errorCode } from '../errorCode';
import { logger, publishStatusEnum, readImageData, SetProgressEvent, SetProgressNewEvent } from '../../utils';
import { UploadEmitGate } from '../../utils';
import { AxiosError } from 'axios';
import { EventEmitter } from 'events';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import { HtmlDocument } from '@/htmlAgilityPack';
import path from 'path';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { DuoduoshipinUserInfoResponse, getUserInfoAsync } from './duoduoshipin-user.service';
import {
  checkUploadFinish,
  getDuoduoUploadDomain,
  getDuoduoUploadImageSignature,
  getDuoduoUploadSign,
  getDuoduoUploadSignature,
  getSign,
  publishDuoduoShipinResponse,
  uploadImageResponse,
  uploadVideoPartResponse,
} from './duoduoshipin-video.service';
import { ListItemInfo } from '@/media-platform';

/**
 *
 * @param taskData 任务体
 * @param eventCallback 事件回调
 * @param fileStat 文件句柄
 * @param pubResult 发布结果
 * @param maxThread 最大并发上传
 * @param cookie
 * @param authInfo
 */
const uploadVideo = async (
  taskData: DuoDuoVideoTaskInput,
  eventCallback: EventEmitter,
  fileStat: fs.Stats,
  pubResult: DuoDuoPublishResultOutput,
  maxThread: number,
  cookie: string,
  authInfo: DuoduoshipinUserInfoResponse,
): Promise<{ error_code: number; error_msg: string; url: string; vid: string; domain?: string } | null | undefined> => {
  let fileHandle: fs.promises.FileHandle | null = null;
  try {
    //获取上传token
    const uploadDomain = await getDuoduoUploadDomain(cookie, authInfo.result.anchorUid);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!uploadDomain?.endpoint) {
      // console.debug('获取视频上传domain失败', taskData.taskId, uploadDomain);
      pubResult.code = uploadDomain?.error_code ?? -1;
      pubResult.msg = `获取视频上传domain失败${uploadDomain?.error_msg}`;
      return null;
    }
    SetProgressEvent(eventCallback, 5, '正在获取上传参数', taskData.taskId);

    const antiSign = await getSign();
    if (!antiSign) {
      // console.debug('获取视频上传sign失败', taskData.taskId, uploadDomain);
      pubResult.code = -11;
      pubResult.msg = `获取视频上传sign失败`;
      return null;
    }

    //获取上传参数
    // const fileLength = fileStat.size;
    const uploadSignature = await getDuoduoUploadSignature(cookie, antiSign);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!uploadSignature?.signature) {
      // console.debug('获取视频上传参数失败', taskData.taskId, uploadSignature);
      pubResult.code = uploadSignature?.error_code != 0 ? uploadSignature?.error_code : -1;
      pubResult.msg = uploadSignature?.error_msg ? uploadSignature?.error_msg : '获取视频上传参数失败';
      return null;
    }

    const uploadSign = await getDuoduoUploadSign(cookie, antiSign, uploadSignature.signature);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!uploadSign?.sign) {
      // console.debug('获取视频上传参数失败', taskData.taskId, uploadSign);
      pubResult.code = uploadSign?.error_code != 0 ? uploadSign?.error_code : -1;
      pubResult.msg = uploadSign?.error_msg ? uploadSign?.error_msg : '获取视频上传参数失败';
      return null;
    }

    // 获取文件句柄
    fileHandle = await fs.promises.open(taskData.video.localPath, 'r');

    // 开始读取并上传文件
    let readIndex = 0;

    // 分片大小 8M
    const blockSize = 2097152;
    //总片数
    const totalPartNums = Math.ceil(fileStat.size / blockSize);

    //SetProgressEvent(eventCallback, 8, ' 正在上传视频', taskData.taskId);

    // 并行上传
    const tasks: Array<Promise<{ uploaded_part_num: number; error_code: number; error_msg: string }>> = [];

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

    // const fileName = path.basename(taskData.video.localPath);
    // 文件大小小于等单个分片大小
    if (blockSize >= fileStat.size) {
      const buffer = Buffer.alloc(fileStat.size);
      const readData = await fileHandle.read(buffer, 0, fileStat.size, readIndex);
      if (readData.buffer.length > 0) {
        const uploadResult = await uploadVideoPartResponse(
          uploadDomain.endpoint,
          cookie,
          readData.buffer,
          1,
          uploadSign.sign,
        );

        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);

        if (!uploadResult?.uploaded_part_num) {
          // console.debug('视频分片上传失败', taskData.taskId, uploadResult);
          pubResult.msg = `视频分片上传失败${uploadResult?.error_msg ?? ''}`;
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
          tasks.push(uploadVideoPartResponse(uploadDomain.endpoint, cookie, readData.buffer, partNum, uploadSign.sign));

          if (tasks.length > maxThread) {
            const uploadResult = await Promise.race(tasks);

            if (!uploadResult?.uploaded_part_num) {
              // console.debug('视频分片上传失败', taskData.taskId, uploadResult);
              pubResult.msg = `视频分片上传失败${uploadResult?.error_msg ?? ''}`;
              pubResult.code = errorCode.data_error;
              return null;
            }

            //去除第一个任务，并等待完成
            const uploadResultNew = await tasks.splice(0, 1)[0];

            if (!uploadResultNew?.uploaded_part_num) {
              // console.debug('视频分片上传失败', taskData.taskId, uploadResultNew);
              pubResult.msg = `视频分片上传失败${uploadResultNew?.error_msg ?? ''}`;
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

      if (!uploadResult?.uploaded_part_num) {
        // console.debug('视频分片上传失败', taskData.taskId, uploadResult);
        pubResult.msg = `视频分片上传失败${uploadResult?.error_msg ?? ''}`;
        pubResult.code = errorCode.data_error;
        return null;
      }
      onPartUploaded();
    }

    //SetProgressEvent(eventCallback, 81, '视频上传完成', taskData.taskId);

    SetProgressNewEvent(
      eventCallback,
      publishStatusEnum.uploading,
      '视频上传中',
      taskData.taskId,
      totalPartNums,
      totalPartNums,
      taskData.needParts === true,
    );
    //视频上传完成
    const finishResult = await checkUploadFinish(cookie, uploadSign.sign);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!finishResult?.url) {
      // console.debug('视频上传完成校验失败', taskData.taskId, finishResult);
      pubResult.msg = `视频上传完成校验失败${finishResult?.error_msg ?? ''}`;
      pubResult.code = errorCode.data_error;
      return null;
    }

    pubResult.code = 0;
    pubResult.msg = '';
    finishResult['domain'] = uploadDomain.endpoint;
    return finishResult;
    // endregion
  } catch (e) {
    logger.error(`多多视频上传异常失败，${taskData.taskId},${(e as Error)?.message}`);
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
export const publishDuoDuoVideo = async (
  cookie: string,
  taskData: DuoDuoVideoTaskInput,
  eventCallback: EventEmitter,
  maxThreadOut: number = 3,
  retryTimes: number = 3,
): Promise<DuoDuoPublishResultOutput> => {
  logger.info(`多多视频发布 ${taskData.taskId}`);
  const pubResult: DuoDuoPublishResultOutput = {
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

    const userAuthInfo = await getUserInfoAsync(cookie);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!userAuthInfo.result?.anchorUid) {
      // console.debug('获取用户信息失败', cookie, taskData.taskId, userAuthInfo);
      pubResult.code = userAuthInfo?.error_code ?? userAuthInfo?.errorCode ?? errorCode.io_error;
      pubResult.msg = userAuthInfo?.error_msg ?? userAuthInfo ?? '获取用户信息失败';
      logger.error(`获取用户信息失败 ${taskData.taskId} ${JSON.stringify(userAuthInfo)}`);
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult?.msg ? pubResult.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }
    // 获取文件信息
    const fileStat = await fs.promises.stat(taskData.video.localPath);
    taskData.video.size = fileStat.size;
    SetProgressEvent(eventCallback, 2, '正在获取上传参数', taskData.taskId);

    // region 上传视频
    let uploadedVideoInfo = await uploadVideo(
      taskData,
      eventCallback,
      fileStat,
      pubResult,
      maxThreadOut,
      cookie,
      userAuthInfo,
    );
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      if (!uploadedVideoInfo?.vid) {
        if (i < retryTimes - 1) {
          SetProgressEvent(eventCallback, 4, '上传失败,重试中', taskData.taskId);
          uploadedVideoInfo = await uploadVideo(
            taskData,
            eventCallback,
            fileStat,
            pubResult,
            maxThreadOut,
            cookie,
            userAuthInfo,
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
    if (!uploadedVideoInfo?.vid) {
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
    let antiSign = await getSign();
    let uploadSignature = await getDuoduoUploadImageSignature(cookie, antiSign);
    let imageResult = await uploadImageResponse(
      uploadedVideoInfo.domain ?? '',
      cookie,
      imageData.data,
      uploadSignature.signature,
    );
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      // 判断封面是否上传成功
      if (!imageResult?.url) {
        // console.debug('封面上传失败', taskData.taskId, taskData?.cover?.pathOrUrl, imageResult);
        if (i < retryTimes - 1) {
          if (!antiSign) {
            antiSign = await getSign();
          }
          if (!uploadSignature?.signature) {
            uploadSignature = await getDuoduoUploadImageSignature(cookie, antiSign);
          }
          imageResult = await uploadImageResponse(
            uploadedVideoInfo.domain ?? '',
            cookie,
            imageData.data,
            uploadSignature.signature,
          );
          continue;
        }
        pubResult.code = errorCode.data_error;
        pubResult.msg = `封面上传失败:${taskData.cover.pathOrUrl}` + (imageResult?.error_msg ?? '');
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
      pubResult.msg = `封面上传失败:${taskData.cover.pathOrUrl}` + (imageResult?.error_msg ?? '');
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
    const videoFileName = path.basename(taskData.video.localPath);
    //存草稿
    const postData = buildPostData(taskData, uploadedVideoInfo, imageResult.url);

    // 组装发布数据

    // console.debug('多多视频推送数据', taskData.taskId, cookie, postData);

    antiSign = await getSign();
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);

    // 推送数据
    const publishResult = await publishDuoduoShipinResponse(cookie, postData, antiSign, webProxy);
    // console.debug('多多视频推送返回数据', taskData.taskId, publishResult);

    const errCode = publishResult?.errorCode ?? publishResult?.errorCode;
    pubResult.code = publishResult?.result?.feedIds?.length ? 0 : errCode !== 0 ? errCode : -1;
    pubResult.msg = publishResult?.error_msg ?? publishResult?.errorMsg ?? '';
    pubResult.publishId = publishResult?.result?.feedIds[0];

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
      logger.error(`多多视频发布失败 ${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(publishResult)}`);
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
    logger.error(`多多视频发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};

export interface DuoDuoPublishResultOutput extends BaseResult {
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

export interface DuoDuoVideoTaskInput {
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
   * 描述
   */
  desc?: string;

  /**
   * 定时发布13位时间戳
   */
  publishTime?: number;

  /**
   * 话题列表
   */
  topics?: Array<DuoDuoTopicInfo>;

  /**
   * 内容申明
   */
  anchorDeclarationType?: number;

  /**
   * 商品
   */
  goodsInfo?: ListItemInfo;
  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
  needParts?: boolean;
}

export interface DuoDuoTopicInfo {
  id: string;
  name: string;
}

/**
 * 组装发布数据
 * @param taskData  任务数据
 * @param videoInfo
 * @param coverUrl
 */
const buildPostData = (
  taskData: DuoDuoVideoTaskInput,
  videoInfo: { error_code: number; error_msg: string; url: string; vid: string },
  coverUrl: string,
): string => {
  const html = new HtmlDocument();
  html.LoadHtml('<p>' + (taskData.desc ? taskData.desc : '') + '</p>');

  const desc = html.DocumentNode.InnerText() ?? taskData.desc;
  const rePostData = {
    feeds: [
      {
        //url: videoInfo?.url,
        desc: desc ?? '',
        cover: coverUrl,
        goodsIdList: [],
        vid: videoInfo?.vid,
        needCreateCoverUrl: false,
        outVideoUrl: '',
        anchorDeclarationType: taskData.anchorDeclarationType ? taskData.anchorDeclarationType : 11,
      },
    ],
  };
  if (taskData.goodsInfo?.yixiaoerId) {
    rePostData.feeds[0].goodsIdList.push(Number(taskData.goodsInfo.yixiaoerId) as never);
  }
  rePostData['commonPermission'] = true;
  rePostData['commonPermissionVer'] = '2.0';
  rePostData['goodsPermission'] = false;
  if (taskData.publishTime) {
    rePostData.feeds[0]['scheduleTime'] = taskData.publishTime;
  }
  return JSON.stringify(rePostData);
};
