import { createHttpInstance } from '../../http';
import { Guid, logger, publishStatusEnum, SetProgressEvent, SetProgressNewEvent, UploadEmitGate } from '../../utils';
import { aws4Interceptor } from 'aws4-axios';
import { AxiosError, AxiosProxyConfig } from 'axios';
import { EventEmitter } from 'events';
import * as fs from 'fs';

import { DouyinMiniAppInfo, DouyinTopicInfo } from '../douyin';
import { AuthDataOutput, getAuthKey, getSdkToken, uploadCover, uploadedImageInfo } from './douyin-base.service';
import { checkGoodsIsInvalid, DouyinGoodsInfo } from './douyin-shop.service';
import { DouyinUserInfo, getMediaUserInfo, getUserPositionPrivilegeNew } from './douyin-user.service';
import {
  checkVideoUpload,
  getUploadedVideoInfo,
  getVideoUploadArgs,
  publish,
  publishlimit,
  UploadAuthInfo,
  uploadedVideoInfo,
  uploadVideoPart,
} from './douyin-video.service';
import { errorCode } from '../errorCode';
import { DouyinActivityInfo } from '../douyin/douyin-activity.service';
import { CancelToken, privateKey } from '../../utils/CancelToken';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '../webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { DouYinCpsSpuItem } from '@/media-platform/douyin/douyin-location.service';
import { ImageInfo, ListItemInfo } from '@/media-platform';
import { DouyinMusicInfo } from '@/media-platform/douyin/douyin-music.service';
import { BaseTask } from '@/media-platform/baseTask';
import { getPublishVerifyMethods } from './douyin-publish-risk';

export const getFileSize = async (path: string): Promise<number> => {
  const fileStat = await fs.promises.stat(path);
  return fileStat.size;
};

/**
 * 视频上传完整过程
 * @param taskData 任务数据
 * @param authDataOut
 * @param pubResult 发布结果对象
 * @param eventCallback 回调事件对象
 * @param userId 用户id
 * @param maxThread 最大并发上传数
 * @param cookie
 * @param proxy
 */
export const uploadVideo = async (
  taskData: DouyinVideoTaskInput,
  authDataOut: { node: AuthDataOutput },
  pubResult: DouyinPublishResult,
  eventCallback: EventEmitter,
  userId: string,
  maxThread: number,
  cookie: string,
  proxy: AxiosProxyConfig | undefined = undefined,
): Promise<uploadedVideoInfo | null | undefined> => {
  let fileHandle: fs.promises.FileHandle | null = null;
  try {
    if (proxy) {
      //console.log('proxy', proxy.host);
    }
    // 获取上传认证参数
    const authData = await getAuthKey(cookie);
    if (!authData?.auth) {
      //console.debug('获取认证参数失败', taskData.taskId, authData);
      pubResult.code = authData.status_code;
      pubResult.msg = '获取认证参数失败:' + (authData.status_msg ?? '');
      if (authData?.status_msg?.includes('用户未登录')) {
        pubResult.msg = '账号登录信息失效，请重新授权此账号再试';
      }
      return null;
    }
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    authDataOut.node = authData;
    // 获取文件信息
    const fileStat = await fs.promises.stat(taskData.video.localPath);
    fileHandle = await fs.promises.open(taskData.video.localPath, 'r');

    // 提取认证信息
    const authResult: UploadAuthInfo = JSON.parse(authData.auth);

    // 初始化 http
    const $httpSign = createHttpInstance();
    $httpSign.interceptors.request.use(
      aws4Interceptor({
        instance: $httpSign,
        options: {
          region: 'cn-north-1',
          service: 'vod',
        },
        credentials: {
          accessKeyId: authResult.AccessKeyID,
          secretAccessKey: authResult.SecretAccessKey,
          sessionToken: authResult.SessionToken,
        },
      }),
    );

    // 获取上传参数
    const uploadVideoArgs = await getVideoUploadArgs(fileStat.size, userId, $httpSign);
    if (!uploadVideoArgs?.Result?.InnerUploadAddress?.UploadNodes) {
      //console.debug('获取上传参数失败', taskData.taskId, uploadVideoArgs);
      pubResult.code = uploadVideoArgs.status_code;
      pubResult.msg = '获取上传参数失败:' + (uploadVideoArgs.status_msg ?? uploadVideoArgs?.Error?.Message ?? '');

      return null;
    }
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // 准备上传分片信息列表
    const uploadedList = new Map<number, string>();

    // 上传id
    const uploadId = Guid.NewGuid().toString();

    // 开始读取并上传文件
    let readIndex = 0;

    // 分片大小
    let blockSize = 3145728; // 500M以下的视频，分片大小为3M，500M以上的视频，分片大小为5M，1G以上的视频大小为10M
    if (fileStat.size > 1024 * 1024 * 500) {
      blockSize = 1024 * 1024 * 5;
    } else if (fileStat.size > 1024 * 1024 * 1024) {
      blockSize = 1024 * 1024 * 10;
    }

    // 总片数
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

    // 并行上传
    const tasks: Array<Promise<UploadPartResult>> = [];

    //SetProgressEvent(eventCallback, 10, '视频上传中', taskData.taskId);

    // 文件大小小于等单个分片大小
    if (blockSize >= fileStat.size) {
      const buffer = Buffer.alloc(fileStat.size);
      const readData = await fileHandle.read(buffer, 0, fileStat.size, readIndex);
      if (readData.buffer.length > 0) {
        const uploadResult = await uploadVideoPart(readData.buffer, 1, blockSize, userId, uploadId, uploadVideoArgs);
        if (!uploadResult?.data?.crc32) {
          pubResult.code = uploadResult.code;
          pubResult.msg = '视频分片上传失败:' + uploadResult.message;

          return null;
        }
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);
        uploadedList.set(uploadResult.partNum, uploadResult.data.crc32);
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

        const readData = await fileHandle.read(buffer, 0, canReadNum, readIndex);
        if (readData.buffer.length > 0) {
          //取消任务执行
          taskData.cancelToken?.throwIfCancelled(privateKey);

          tasks.push(uploadVideoPart(readData.buffer, partNum, blockSize, userId, uploadId, uploadVideoArgs));

          if (tasks.length > maxThread) {
            const uploadResult = await Promise.race(tasks);
            if (!uploadResult?.data?.crc32) {
              pubResult.code = uploadResult.code;
              pubResult.msg = '视频分片上传失败:' + uploadResult.message;

              return null;
            }

            uploadedList.set(uploadResult.partNum, uploadResult.data.crc32);
            const uploadResultNew = await tasks.splice(0, 1)[0];
            if (!uploadResultNew?.data?.crc32) {
              pubResult.code = uploadResultNew.code;
              pubResult.msg = '视频分片上传失败:' + uploadResultNew.message;

              return null;
            }

            uploadedList.set(uploadResultNew.partNum, uploadResultNew.data.crc32);
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
      if (!uploadResult?.data?.crc32) {
        pubResult.code = uploadResult.code;
        pubResult.msg = '视频分片上传失败:' + uploadResult.message;

        return null;
      }
      uploadedList.set(uploadResult.partNum, uploadResult.data?.crc32 ?? '');
      onPartUploaded();
    }

    const uploadStrList: Array<string> = [];

    if (uploadedList.size < totalPartNums) {
      ///console.debug('视频上传失败', taskData.taskId, uploadedList);
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
    for (let i = 1; i <= uploadedList.size; i++) {
      uploadStrList.push(`${i}:${uploadedList.get(i)}`);
    }

    const uploadResultList = uploadStrList.join(',');

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // 检查视频上传是否成功
    const checkResult = await checkVideoUpload(userId, uploadId, uploadResultList, uploadVideoArgs);
    if (!checkResult.data?.hash) {
      //console.debug('视频上传校验失败', taskData.taskId, uploadedList, checkResult);

      pubResult.code = -1;
      pubResult.msg = '上传校验失败:' + (checkResult.message ?? '');

      return null;
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //获取上传完成的视频信息
    const uploadVideoInfo = await getUploadedVideoInfo(userId, uploadVideoArgs, $httpSign);
    if (!(uploadVideoInfo?.Result?.Results?.length > 0)) {
      //console.debug('获取视频信息失败', taskData.taskId, uploadedList, uploadVideoInfo);

      pubResult.code = -1;
      pubResult.msg = '获取视频信息失败:' + (uploadVideoInfo.status_msg ?? '');

      return null;
    }
    pubResult.code = 0;
    pubResult.msg = '';
    return uploadVideoInfo;
    // endregion
  } catch (e) {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    logger.error(`抖音视频上传异常失败,${taskData.taskId},${(e as Error)?.message}`);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = '视频上传失败';
    return null;
  } finally {
    fileHandle?.close();
  }
};

/**
 *  抖音发布视频
 * @param cookie cookie字符串 eg: cookie1=12;cookie2=345
 * @param taskData 发布入参
 * @param eventCallback 进度回调
 * @param userId 用户uid，来自于获取的用户信息中uid
 * @param retryTimes 单个步骤失败后重试次数
 * @param maxThread 视频并发山川数
 */
export const douyinPublishVideo = async (
  cookie: string,
  taskData: DouyinVideoTaskInput,
  eventCallback: EventEmitter,
  userId: string,
  maxThread: number = 3,
  retryTimes: number = 3,
): Promise<DouyinPublishResult> => {
  logger.info(`抖音视频发布 ${taskData.taskId}`);
  SetProgressNewEvent(eventCallback, publishStatusEnum.uploading, '开始发布', taskData.taskId);
  const pubResult: DouyinPublishResult = {
    code: 0,
    msg: '',
    taskId: taskData.taskId,
  };
  try {
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
        pubResult.msg ? pubResult?.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }

    if (taskData.localStorage && taskData.localStorage['security-sdk/s_sdk_sign_data_key/web_protect']) {
      cookie = cookie.replace(/security-sdk\/s_sdk_sign_data_key\/web_protect=/g, 'droppedCookie=');
      cookie = cookie.replace(/security-sdk\/s_sdk_crypt_sdk/g, 'droppedCookie=');
    }
    if (
      !cookie.includes('security-sdk/s_sdk_crypt_sdk') ||
      !cookie.includes('security-sdk/s_sdk_sign_data_key/web_protect') ||
      !cookie.includes('bd_ticket_guard_client_data') ||
      !cookie.includes('sid_tt')
    ) {
      if (
        !taskData.localStorage ||
        !taskData?.localStorage['security-sdk/s_sdk_crypt_sdk'] ||
        !taskData?.localStorage['security-sdk/s_sdk_sign_data_key/web_protect']
      ) {
        pubResult.code = errorCode.io_error;
        pubResult.msg = '账号信息缺失，请重新授权此账号再试';
        logger.error(`环境信息缺失 ${taskData.taskId} ${JSON.stringify(taskData.localStorage)}`);
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploadFail,
          pubResult.msg ? pubResult?.msg : '上传失败',
          taskData.taskId,
        );
        return pubResult;
      } else if (!cookie.includes('bd_ticket_guard_client_data') || !cookie.includes('sid_tt')) {
        pubResult.code = errorCode.io_error;
        pubResult.msg = '账号信息缺失，请重新授权此账号再试';
        logger.error(`环境信息缺失 ${taskData.taskId} ${cookie}`);
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploadFail,
          pubResult.msg ? pubResult?.msg : '上传失败',
          taskData.taskId,
        );
        return pubResult;
      }
      cookie = `${cookie};security-sdk/s_sdk_crypt_sdk=${encodeURIComponent(
        taskData?.localStorage['security-sdk/s_sdk_crypt_sdk'],
      )};security-sdk/s_sdk_sign_data_key/web_protect=${encodeURIComponent(
        taskData.localStorage['security-sdk/s_sdk_sign_data_key/web_protect'],
      )}`;
    }
    SetProgressEvent(eventCallback, 1, '准备上传中', taskData.taskId);

    // region 准备发布上传前置数据

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // 获取sdkToken
    let sdkToken = await getSdkToken(cookie);
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      sdkToken = await getSdkToken(cookie, i);
      if (sdkToken) {
        break;
      }
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    //判断是否有地址带货权限
    if (taskData.location?.isCommerceIntention === true) {
      const locPri = await getUserPositionPrivilegeNew(cookie);
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      if (locPri?.status_code === 0) {
        if (locPri?.has_promote_auth !== true) {
          taskData.location.isCommerceIntention = false;
          taskData.location.cpsInfo = undefined;
        }
      } else {
        pubResult.code = locPri?.status_code ?? -1;
        pubResult.msg = `鉴别店铺推广权限失败:${pubResult.msg ?? ''}`;
      }
    }

    // 获取用户信息
    if (!userId) {
      let userInfo = await getMediaUserInfo(cookie);
      for (let i = 0; i < retryTimes; i++) {
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);
        userId = userInfo?.user?.uid;
        if (!userId) {
          if (i < retryTimes - 1 && userInfo?.status_code != 8) {
            userInfo = await getMediaUserInfo(cookie);
            continue;
          }
          pubResult.code = userInfo.status_code;
          pubResult.msg = userInfo.status_msg;
          logger.error(`获取用户信息失败 ${taskData.taskId} ${cookie} ${JSON.stringify(userInfo)}`);
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
    }

    let shopDraftId = '';

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // 商品挂车
    if (taskData.goodsInfoList && taskData.goodsInfoList?.length > 0) {
      let pushGoodsResult = await checkGoodsIsInvalid(cookie, sdkToken, taskData.goodsInfoList);
      for (let i = 0; i < retryTimes; i++) {
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);
        if (!pushGoodsResult?.shop_draft_id) {
          // console.debug('抖音挂载商品失败', taskData.taskId, taskData.goodsInfoList, pushGoodsResult);
          if (i < retryTimes - 1 && pushGoodsResult?.status_code != 8) {
            pushGoodsResult = await checkGoodsIsInvalid(cookie, sdkToken, taskData.goodsInfoList);
            continue;
          }
          pubResult.code = pushGoodsResult.status_code;
          pubResult.msg = '挂载商品失败:' + (pushGoodsResult.status_msg ?? '');
          logger.error(`挂在商品失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pushGoodsResult)}`);
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

      shopDraftId = pushGoodsResult.shop_draft_id;
    }

    SetProgressEvent(eventCallback, 3, '正在获取上传参数', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // 获取上传认证参数
    let authData: AuthDataOutput = { status_code: -1, auth: '', ak: '', status_msg: '' };
    const authDataIn = { node: authData };
    // endregion

    // region 视频上传
    let uploadVideoInfo = await uploadVideo(taskData, authDataIn, pubResult, eventCallback, userId, maxThread, cookie);
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      if (!uploadVideoInfo || !(uploadVideoInfo?.Result?.Results?.length > 0)) {
        if (i < retryTimes - 1 && uploadVideoInfo?.status_code != 8 && pubResult?.code != 8) {
          SetProgressEvent(eventCallback, 4, '上传失败,重试中', taskData.taskId);
          uploadVideoInfo = await uploadVideo(
            taskData,
            authDataIn,
            pubResult,
            eventCallback,
            userId,
            maxThread,
            cookie,
          );
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
    authData = authDataIn.node;
    // endregion

    // region 封面上传

    SetProgressEvent(eventCallback, 90, '封面上传中', taskData.taskId);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    let uploadedCoverInfo: uploadedImageInfo | null = await uploadCover(
      userId,
      taskData.cover.pathOrUrl,
      authData,
      taskData.taskId,
      pubResult,
    );
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      if (uploadedCoverInfo == null || !(uploadedCoverInfo?.Result?.Results?.length > 0)) {
        if (i < retryTimes - 1) {
          uploadedCoverInfo = await uploadCover(userId, taskData.cover.pathOrUrl, authData, taskData.taskId, pubResult);
          continue;
        }
        pubResult.code = -1;
        pubResult.msg = `封面上传失败:${uploadedCoverInfo?.ResponseMetadata?.Error?.Message ?? ''}`;
        logger.error(
          `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${JSON.stringify(uploadedCoverInfo)}`,
        );
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploadFail,
          pubResult.msg ? pubResult?.msg : '上传失败',
          taskData.taskId,
        );
        return pubResult;
      }
      break;
    }
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (uploadedCoverInfo == null) {
      logger.error(
        `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${JSON.stringify(uploadedCoverInfo)}`,
      );
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult.msg ? pubResult?.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }

    //横版封面
    let horizontalCoverInfo: uploadedImageInfo | null = null;
    if (taskData.horizontalCover?.pathOrUrl) {
      horizontalCoverInfo = await uploadCover(
        userId,
        taskData.horizontalCover.pathOrUrl,
        authData,
        taskData.taskId,
        pubResult,
      );
      for (let i = 0; i < retryTimes; i++) {
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);
        if (horizontalCoverInfo == null || !(horizontalCoverInfo?.Result?.Results?.length > 0)) {
          if (i < retryTimes - 1) {
            horizontalCoverInfo = await uploadCover(
              userId,
              taskData.horizontalCover.pathOrUrl,
              authData,
              taskData.taskId,
              pubResult,
            );
            continue;
          }
          pubResult.code = -1;
          pubResult.msg = `横版封面上传失败:${horizontalCoverInfo?.ResponseMetadata?.Error?.Message ?? ''}`;
          logger.error(
            `横版封面上传失败 ${taskData.taskId} ${cookie} ${taskData.horizontalCover.pathOrUrl} ${JSON.stringify(
              horizontalCoverInfo,
            )}`,
          );
          SetProgressNewEvent(
            eventCallback,
            publishStatusEnum.uploadFail,
            pubResult.msg ? pubResult?.msg : '上传失败',
            taskData.taskId,
          );
          return pubResult;
        }
        break;
      }
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      if (horizontalCoverInfo == null) {
        logger.error(
          `横版封面上传失败 ${taskData.taskId} ${cookie} ${taskData.horizontalCover.pathOrUrl} ${JSON.stringify(
            horizontalCoverInfo,
          )}`,
        );
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploadFail,
          pubResult.msg ? pubResult?.msg : '上传失败',
          taskData.taskId,
        );
        return pubResult;
      }
    }

    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);

    // endregion

    // region 组装并推送数据
    // 组装发布数据

    if (!sdkToken) {
      sdkToken = await getSdkToken(cookie);
      if (!sdkToken) {
        sdkToken = cookie.split('secsdk_csrf_token=')[1]?.split(';')[0];
      }
    }
    if (!sdkToken) {
      pubResult.code = -1;
      pubResult.msg = '获取用户token失败';
      logger.error(`封面上传失败 ${taskData.taskId} ${cookie} ${JSON.stringify(sdkToken)}`);
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult.msg ? pubResult?.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);

    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    await publishlimit(cookie, sdkToken);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //任务不可取消
    taskData.cancelToken?.disable(privateKey);
    const publishResult = await publish(
      cookie,
      sdkToken,
      taskData,
      uploadedCoverInfo,
      uploadVideoInfo,
      shopDraftId,
      webProxy,
      taskData.password,
      horizontalCoverInfo,
    );

    pubResult.code = publishResult.status_code;
    pubResult.msg = publishResult.status_msg ?? '';
    pubResult.publishId = publishResult?.item_id ?? publishResult?.aweme?.aweme_id?.toString();
    pubResult.checkStr = publishResult.checkStr;
    pubResult.postData = publishResult.postData;
    pubResult.verifyMethods = publishResult.checkStr ? getPublishVerifyMethods(publishResult.checkStr) : undefined;

    if (pubResult.msg == '服务异常') {
      pubResult.msg = '发布失败:官方平台检测到您的账号存在风险，请先前往《创作者中心》里登录后单独发布一个作品，发布时会跳出验证，验证通过即可一键发布。';
      pubResult.code = -110;
    }

    // console.debug('抖音发布完成', taskData.taskId, taskData, uploadedCoverInfo, uploadVideoInfo, pubResult);

    if (pubResult.publishId) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult?.msg : '推送失败',
        taskData.taskId,
      );
      if (pubResult.code === errorCode.risk_verify) {
        logger.info(
          `抖音视频发布等待验证 ${taskData.taskId}，postData长度:${pubResult.postData?.length ?? 0}，checkStr长度:${pubResult.checkStr?.length ?? 0}`,
        );
      } else {
        logger.error(
          `抖音视频发布失败 ${taskData.taskId} ${cookie} ${JSON.stringify(taskData)}  ${JSON.stringify(publishResult)}`,
        );
      }
      pubResult.code = pubResult.code == 0 ? -1 : pubResult.code ?? -1;
      // console.debug('抖音发布失败:', publishResult, taskData, cookie);
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
      pubResult.msg = `发布失败，${e?.toString()}`;
      pubResult.errorInfo = e?.toString();
    }
    SetProgressNewEvent(
      eventCallback,
      publishStatusEnum.pushFail,
      pubResult?.msg ? pubResult?.msg : '推送失败',
      taskData.taskId,
    );
    logger.error(`抖音视频发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};

export interface DouyinPublishResult {
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

  /**
   * 发布风控验证参数
   */
  checkStr?: string;

  /**
   * 已经组装完成的原始发布数据
   */
  postData?: string;

  /**
   * 当前风控支持的验证方式
   */
  verifyMethods?: Array<'password' | 'smscode'>;
}

/**
 * 抖音视频发布入参
 */
export interface DouyinVideoTaskInput extends BaseTask {
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
     * 时长-秒-可带小数
     */
    duration?: number;
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
   * 封面信息
   */
  cover: {
    /**
     * 封面宽度
     */
    width?: number;
    /**
     * 封面高度
     */
    height?: number;
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
   * 横版封面
   */
  horizontalCover?: ImageInfo;
  /**
   * 话题列表
   */
  challenges?: Array<DouyinTopicInfo>;
  /**
   * at好友/用户列表
   */
  mentions?: Array<DouyinUserInfo>;
  /**
   * 标题
   */
  title?: string;
  /**
   * 描述信息，支持话题和好友的任意位置插入(包含插入的好友和话题，和官方保持一致)
   */
  text?: string;
  /**
   * 可见类型
   *  - 0: 公开
   *  - 1:私密
   *  - 2: 好友可见
   */
  visibility_type: number;

  /**
   * 是否允许下载
   *  - 0: 否
   *  - 1: 是
   */
  download: number;

  /**
   * 一级分类id
   */
  tag_level1_id?: number;

  /**
   * 二级分类id
   */
  tag_level2_id?: number;

  /**
   * 标签id列表
   */
  tag_level3_id?: Array<number>;

  /**
   * 标签名称列表
   */
  tag_level3_name?: Array<string>;

  /**
   * 合集Id
   */
  mix_id?: string;

  /**
   * 合集下集数编号,0表示第一集，1表示第二集，以此类推
   */
  mix_order?: number;

  /**
   * 定时发布时间戳，10位
   */
  timing?: number;

  /**
   * 地理位置id
   */
  poi_id?: string;

  /**
   *地理位置名称
   */
  poi_name?: string;

  /**
   * 新版位置参数
   */
  location?: {
    /**
     * 地理位置id
     */
    poiId?: string;

    /**
     *地理位置名称
     */
    poiName?: string;

    /**
     * 是否智能推广
     */
    recommendPoiGroup: boolean;

    /**
     * 是否推广门店，关闭后相当于打卡模式
     */
    isCommerceIntention: boolean;

    /**
     * 带货商品范围
     */
    cpsInfo?: {
      /**
       * 0:勾选"选择带货商品范围-全部"，勾选时cps_choose_source_list和cps_choose_mini_app_list为空数组
       * 1::取消勾选
       */
      cps_choose_scence: 0 | 1;
      /**
       * 取消勾选后勾选的商家platform-source列表
       */
      cps_choose_source_list: Array<number>;
      /**
       * 取消勾选后，选择的商家的小程序id（mini-app-id）列表
       */
      cps_choose_mini_app_list: Array<string>;
    };
  };

  /**
   * 热点名称
   */
  hot_sentence?: string;

  /**
   * 挂载的小程序信息
   */
  miniAppInfo?: DouyinMiniAppInfo;

  /**
   *  挂载的商品信息列表
   */
  goodsInfoList?: Array<DouyinGoodsInfo>;

  /**
   * 挂载团购
   */
  location_shopping?: {
    /**
     * 1:推荐其他品牌商品
     * 2：只推荐相同品牌商品
     */
    brand_switch_value: 0 | 1 | 2;
    /**
     * 推广标题
     */
    sale_title: string;
    /**
     * 团购信息
     */
    data: DouYinCpsSpuItem;
  };

  /**
   * 是否同步到西瓜
   * -0否 ，1是
   */
  should_sync: number;

  /**
   *活动列表
   */
  activity?: Array<DouyinActivityInfo>;

  /**
   * 创作申明
   */
  declareInfo?: {
    /**
     * 什么类型
     * self_shoot 自行拍摄
     * from_net_v3 内容取材于网络
     * aigc 内容由AI生成
     * maybe_unsuitable可能引人不适
     * only_fun_new 虚构演绎，仅供娱乐
     * dangerous_behavior 危险行为，请勿模仿
     */
    choose_value:
      | 'self_shoot'
      | 'from_net_v3'
      | 'aigc'
      | 'maybe_unsuitable'
      | 'only_fun_new'
      | 'dangerous_behavior'
      | 'personal_opinion'
      | 'marketing';
    /**
     * 自行拍摄地点，如 '湖南 长沙','北京','上海','西班牙','德国'
     * 拼接方式为国内省级区域+空格+城市，国外为国家.具体以拍摄地点接口数据为准
     */
    user_declare_place?: string;

    /**
     * 申明拍摄地点的id
     */
    user_declare_place_geoname_id?: number;

    /**
     * 什么拍摄的日期 格式:'yyyy-MM-dd','2024-05-01'
     */
    user_declare_time?: string;

    /**
     * 申明取材于网络时的来源
     * 站外:取材站外
     * 抖音作品:取材站内
     */
    source?: '站外' | '抖音作品';
    /**
     * 取材站内时， 抖音作品id，来源于观看历史接口
     */
    from_item_id?: string;
  };
  /**
   * 加入挑战
   */
  flashMobInfo?: ListItemInfo;

  /**
   * 账号web中的localStorage
   */
  localStorage?: object;

  /**
   * 代理配置
   */
  proxy?: KuaiDaiLiProxy;

  /**
   * 媒体号密码，用于发布时自动验证
   */
  password?: string;

  /**
   * 同时发布到
   */
  sync_apps?: Array<ListItemInfo>;

  /**
   * 添加的音乐信息
   */
  musicInfo?: DouyinMusicInfo;

  /**
   * 共创信息
   */
  cooperation_info?: Array<{
    /**
     * 共创身份类型
     */
    typeId: string;
    /**
     * 共创人id列表
     */
    userIds: Array<string>;
  }>;

  /**
   * 游戏手柄
   */
  game?: ListItemInfo;

  /**
   * 影视演绎
   */
  film?: ListItemInfo;
}

/**
 * 上传分片结果（仅包含所需字段）
 */
export interface UploadPartResult {
  /**
   * 分片序号
   */
  partNum: number;
  /**
   * 分片数据
   */
  data?: {
    /**
     * 分片序号
     */
    part_number: string;
    /**
     * CRC32校验码
     */
    crc32: string;
  };
  /**
   * 状态码
   * -2000为正常
   */
  code: number;

  /**
   *  提示消息
   */
  message?: string;
}
