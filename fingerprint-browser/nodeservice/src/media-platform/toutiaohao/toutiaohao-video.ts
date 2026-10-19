import { createHttpInstance, HttpConfig } from '../../http';
import {
  Guid,
  htmlDecode,
  logger,
  publishStatusEnum,
  SetProgressEvent,
  SetProgressNewEvent,
  Task,
  UploadEmitGate,
} from '../../utils';
import { aws4Interceptor } from 'aws4-axios';
import { AxiosError } from 'axios';
import { EventEmitter } from 'events';
import * as fs from 'fs';

import {
  checkVideoUpload,
  createTopicResponse,
  getAuthKey,
  getSdkToken,
  getUploadedVideoInfo,
  getVideoUploadArgs,
  publish,
  uploadCover,
  UploadedImageInfo,
  UploadedVideoInfo,
  UploadPartResult,
  uploadVideoPart,
} from './toutiaohao-video.service';
import { errorCode } from '../errorCode';
import { ToutiaohaoPublishResultOutput } from './toutiaohao-article';
import { DouyinTopicInfo } from '../douyin/douyin-topic.service';
import { CancelToken, privateKey } from '../../utils/CancelToken';
import { HtmlDocument } from '../../htmlAgilityPack';
import { getXiguaToken } from '../toutiaohao/toutiaohao-base.service';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { ITask } from '@/media-platform/baseTask';

/**
 * 视频上传完整过程
 * @param taskData 任务数据
 * @param pubResult 发布结果对象
 * @param eventCallback 回调事件对象
 * @param userId 用户id
 * @param maxThread 最大并发上传数
 * @param cookie
 */
export const uploadVideo = async (
  taskData: ToutiaohaoVideoTaskInput,
  pubResult: ToutiaohaoPublishResultOutput,
  eventCallback: EventEmitter,
  userId: string,
  maxThread: number,
  cookie: string,
): Promise<UploadedVideoInfo | null | undefined> => {
  let fileHandle: fs.promises.FileHandle | null = null;
  try {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // 获取上传认证参数
    const authData = await getAuthKey(cookie);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!authData?.data?.uploadToken) {
      // console.debug('获取认证参数失败', taskData.taskId, authData);
      pubResult.code = authData.status;
      pubResult.msg = '获取认证参数失败:' + (authData.message ?? '');

      return null;
    }
    // 获取文件信息
    const fileStat = await fs.promises.stat(taskData.video.localPath);
    fileHandle = await fs.promises.open(taskData.video.localPath, 'r');

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // 提取认证信息
    const authResult = authData.data.uploadToken;

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
          accessKeyId: authResult.AccessKeyId,
          secretAccessKey: authResult.SecretAccessKey,
          sessionToken: authResult.SessionToken,
        },
      }),
    );

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // 获取上传参数
    let uploadVideoArgs = await getVideoUploadArgs(
      fileStat.size,
      userId,
      $httpSign,
      'video',
      authData?.data?.spaceName,
    );

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (!uploadVideoArgs?.Result?.InnerUploadAddress?.UploadNodes) {
      uploadVideoArgs = await getVideoUploadArgs(fileStat.size, userId, $httpSign, 'video', authData?.data?.spaceName);
    }

    if (!uploadVideoArgs?.Result?.InnerUploadAddress?.UploadNodes) {
      // console.debug('获取上传参数失败', taskData.taskId, uploadVideoArgs);

      pubResult.code = uploadVideoArgs.status_code;
      pubResult.msg = '获取上传参数失败:' + (uploadVideoArgs.status_msg ?? uploadVideoArgs?.Error?.Message ?? '');

      return null;
    }

    // 准备上传分片信息列表
    const uploadedList: Map<number, string> = new Map<number, string>();

    // 上传id
    const uploadId = Guid.NewGuid().toString();

    // 开始读取并上传文件
    let readIndex = 0;

    // 分片大小
    let blockSize = 3145728; // 50M以下的视频，分片大小为3M，500M以上的视频，分片大小为5M，1G以上的视频大小为10M
    if (fileStat.size > 1024 * 1024 * 50) {
      blockSize = 1024 * 1024 * 5;
    } else if (fileStat.size > 1024 * 1024 * 1024) {
      blockSize = 1024 * 1024 * 10;
    }

    // 总片数
    const totalPartNums = Math.ceil(fileStat.size / blockSize);

    // 并行上传
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
      uploadedParts,
      taskData.needParts === true,
    );

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // 文件大小小于等单个分片大小
    if (blockSize >= fileStat.size) {
      const buffer = Buffer.alloc(fileStat.size);
      const readData = await fileHandle.read(buffer, 0, fileStat.size, readIndex);
      if (readData.buffer.length > 0) {
        const uploadResult = await uploadVideoPart(readData.buffer, 1, blockSize, userId, uploadId, uploadVideoArgs);

        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);

        if (!uploadResult?.data?.crc32) {
          pubResult.code = uploadResult.code;
          pubResult.msg = '视频分片上传失败:' + uploadResult.message;

          return null;
        }
        uploadedList.set(uploadResult.partNum, uploadResult.data.crc32);
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

        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);
        //
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
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);
        const readData = await fileHandle.read(buffer, 0, canReadNum, readIndex);
        if (readData.buffer.length > 0) {
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
      // console.debug('视频上传失败', taskData.taskId, uploadedList);
      pubResult.code = errorCode.io_error;
      pubResult.msg = '视频上传失败:' + taskData.video.localPath;

      return null;
    }

    for (let i = 1; i <= uploadedList.size; i++) {
      uploadStrList.push(`${i}:${uploadedList.get(i)}`);
    }

    const uploadResultList = uploadStrList.join(',');

    SetProgressEvent(eventCallback, 82, '上传完成校验中', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // 检查视频上传是否成功
    let checkResult = await checkVideoUpload(userId, uploadId, uploadResultList, uploadVideoArgs);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (!checkResult.data?.hash) {
      checkResult = await checkVideoUpload(userId, uploadId, uploadResultList, uploadVideoArgs);
    }
    if (!checkResult.data?.hash) {
      // console.debug('视频上传校验失败', taskData.taskId, uploadedList, checkResult);

      pubResult.code = -1;
      pubResult.msg = '上传校验失败:' + (checkResult.message ?? '');

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

    //获取上传完成的视频信息
    let uploadVideoInfo = await getUploadedVideoInfo(userId, uploadVideoArgs, authData.data.spaceName, $httpSign);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (!(uploadVideoInfo?.Result?.Results?.length > 0)) {
      uploadVideoInfo = await getUploadedVideoInfo(userId, uploadVideoArgs, authData.data.spaceName, $httpSign);
    }

    if (!(uploadVideoInfo?.Result?.Results?.length > 0)) {
      // console.debug('获取视频信息失败', taskData.taskId, uploadedList, uploadVideoInfo);

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
    logger.error(`头条号横版视频上传异常失败，${taskData.taskId},${(e as Error)?.message}`);
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
 * @param userId 来自于获取的用户信息中userid，默认位空
 * @param retryTimes 单个步骤失败后重试次数，默认3
 * @param maxThread 视频并发上传数，默认3
 */
export const resolveToutiaohaoVideoTopicNames = (topics: Array<string> | undefined, tags: Array<string>): Array<string> => {
  const topicNames = topics?.filter((topic) => topic?.trim()) ?? [];
  return topicNames.length > 0 ? topicNames : tags;
};

export const publishToutiaohaoVideo = async (
  cookie: string,
  taskData: ToutiaohaoVideoTaskInput,
  eventCallback: EventEmitter,
  userId: string = '',
  maxThread: number = 3,
  retryTimes: number = 3,
): Promise<ToutiaohaoPublishResultOutput> => {
  logger.info(`头条横版发布 ${taskData.taskId}`);

  const pubResult: ToutiaohaoPublishResultOutput = {
    code: 0,
    msg: '',
    taskId: taskData.taskId,
  };
  try {
    if (!validateToutiaohaoVideoTags(taskData.tags)) {
      pubResult.code = errorCode.data_error;
      pubResult.msg = '头条横版视频标签必须是1至5个字符串';
      return pubResult;
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploading, '开始发布', taskData.taskId);
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
        pubResult?.msg ? pubResult.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }

    SetProgressEvent(eventCallback, 1, '准备上传中', taskData.taskId);
    if (!cookie?.includes('xigua_csrf_token')) {
      let tokenStr = await getXiguaToken(cookie);
      for (let i = 0; i < 3; i++) {
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);

        if (tokenStr?.length > 0) {
          break;
        }
        await Task.Delay(1000);
        tokenStr = await getXiguaToken(cookie);
      }

      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      if (tokenStr?.length > 0) {
        cookie = `${cookie};${tokenStr.map((obj) => obj.split(';')[0]).join(';')}`;
      } else {
        cookie = `${cookie};${tokenStr.join(';')}`;
      }
    }
    // region 准备发布上传前置数据

    SetProgressEvent(eventCallback, 3, '正在获取上传参数', taskData.taskId);

    // if (!userId) {
    //   const userInfo = await getUserInfoAsync(cookie);
    //   if (userInfo?.data?.user?.id) {
    //     userId = userInfo.data.user.id.toString();
    //   }
    // }

    // 获取上传认证参数
    // endregion
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // region 视频上传
    let uploadVideoInfo = await uploadVideo(taskData, pubResult, eventCallback, userId, maxThread, cookie);
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      if (!uploadVideoInfo || !(uploadVideoInfo?.Result?.Results?.length > 0)) {
        if (i < retryTimes - 1 && uploadVideoInfo?.status_code != 8 && pubResult?.code != 8) {
          SetProgressEvent(eventCallback, 4, '上传失败,重试中', taskData.taskId);
          uploadVideoInfo = await uploadVideo(taskData, pubResult, eventCallback, userId, maxThread, cookie);
          continue;
        }
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
    if (!uploadVideoInfo) {
      pubResult.code = -2;
      pubResult.msg = '视频上传失败，请稍后重试重试';
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
    // endregion

    // region 封面上传

    SetProgressEvent(eventCallback, 90, '封面上传中', taskData.taskId);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    let uploadedCoverInfo: UploadedImageInfo | null = await uploadCover(
      cookie,
      userId,
      taskData.cover.pathOrUrl,
      taskData.taskId,
      pubResult,
    );
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      if (!uploadedCoverInfo?.data || !(uploadedCoverInfo?.data?.length > 0)) {
        if (i < retryTimes - 1) {
          uploadedCoverInfo = await uploadCover(cookie, userId, taskData.cover.pathOrUrl, taskData.taskId, pubResult);
          continue;
        }
        pubResult.code = -1;
        pubResult.msg = `封面上传失败:${uploadedCoverInfo?.message ?? ''}`;
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
        pubResult?.msg ? pubResult.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // 封面上传
    let douyinCoverKey = '';
    if (taskData.syncAwemeTask?.cover?.pathOrUrl) {
      let uploadedDouyinCoverInfo: UploadedImageInfo | null = await uploadCover(
        cookie,
        userId,
        taskData.syncAwemeTask.cover.pathOrUrl,
        taskData.taskId,
        pubResult,
      );
      for (let i = 0; i < retryTimes; i++) {
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);
        if (!uploadedDouyinCoverInfo?.data || !(uploadedDouyinCoverInfo?.data?.length > 0)) {
          if (i < retryTimes - 1) {
            uploadedDouyinCoverInfo = await uploadCover(
              cookie,
              userId,
              taskData.syncAwemeTask.cover.pathOrUrl,
              taskData.taskId,
              pubResult,
            );
            continue;
          }

          pubResult.code = -1;
          pubResult.msg = `封面上传失败:${uploadedDouyinCoverInfo?.message ?? ''}`;
          logger.error(
            `同步到抖音封面上传失败 ${taskData.taskId} ${cookie} ${
              taskData.syncAwemeTask.cover.pathOrUrl
            } ${JSON.stringify(uploadedDouyinCoverInfo)} ${JSON.stringify(pubResult)}`,
          );
          SetProgressNewEvent(
            eventCallback,
            publishStatusEnum.uploadFail,
            pubResult?.msg ? pubResult.msg : '上传失败',
            taskData.taskId,
          );
          return pubResult;
        }
        break;
      }
      if (!uploadedDouyinCoverInfo?.data) {
        logger.error(
          `同步到抖音封面上传失败 ${taskData.taskId} ${cookie} ${
            taskData.syncAwemeTask.cover.pathOrUrl
          } ${JSON.stringify(uploadedDouyinCoverInfo)} ${JSON.stringify(pubResult)}`,
        );
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploadFail,
          pubResult?.msg ? pubResult.msg : '上传失败',
          taskData.taskId,
        );
        return pubResult;
      } else {
        douyinCoverKey = uploadedDouyinCoverInfo.data[0].uri;
      }
    }
    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // endregion
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    //处理html格式的描述
    parseDescAndTopic(taskData);

    // 头条网页端在创建话题和发布视频时都会携带同一个安全 csrf token
    const sdkToken = await getSdkToken(cookie);
    const regex = /xigua_csrf_token=.*/;
    const match = cookie.match(regex);
    const csrfToken = match ? match[0].split(';')[0].split('=')[1] : '';

    //将话题转为id
    let topicIds: Array<string> = [];
    const topicNamesToPublish = resolveToutiaohaoVideoTopicNames(taskData.topics, taskData.tags);
    if (topicNamesToPublish.length > 0) {
      const topicRes = await createTopicResponse(cookie, topicNamesToPublish, sdkToken);
      if (topicRes?.code !== 0 || !topicRes?.data?.length) {
        pubResult.code = errorCode.data_error;
        pubResult.msg = `头条话题创建失败:${topicRes?.message ?? ''}`;
        return pubResult;
      }
      topicIds = topicRes.data.map((x) => x.id_str).filter(Boolean);
      if (topicIds.length === 0) {
        pubResult.code = errorCode.data_error;
        pubResult.msg = '头条话题创建失败:未返回话题ID';
        return pubResult;
      }
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // region 组装并推送数据

    // 组装发布数据
    const postData = buildPostData(taskData, uploadedCoverInfo, uploadVideoInfo, '', userId, douyinCoverKey, topicIds);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    //不可取消
    taskData.cancelToken?.disable(privateKey);
    //推送数据
    const publishResult = await publish(cookie, sdkToken, csrfToken, postData, taskData.taskId, webProxy);

    pubResult.code = publishResult?.data?.Code ?? publishResult.status ?? errorCode.data_error;
    pubResult.msg =
      publishResult?.data?.Message ?? publishResult?.data?.BaseResp?.StatusMessage ?? publishResult.message ?? '';
    pubResult.publishId = publishResult?.data?.ItemId;

    // console.debug('头条横版视频发布完成', taskData.taskId, taskData, uploadedCoverInfo, uploadVideoInfo, pubResult);

    if (pubResult.publishId) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      pubResult.code = pubResult?.code != 0 ? pubResult?.code : -1;
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
      logger.error(`头条横版视频发布失败 ${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(publishResult)}`);
    }

    return pubResult;
    // endregion
  } catch (e) {
    SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
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
      pubResult?.msg ? pubResult.msg : '推送失败',
      taskData.taskId,
    );
    logger.error(`头条横版视频发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};

/**
 * 如果描述desc是html字符串，需要讲html解析为纯文本，并且讲描述中的话题解析出来
 * @param taskData
 */
const parseDescAndTopic = (taskData: ToutiaohaoVideoTaskInput): void => {
  if (!taskData.topics) {
    taskData.topics = [];
  }
  //话题，兼容描述中嵌入话题和单独设置话题
  if (taskData.desc?.includes('<p') && taskData.desc?.includes('</p>')) {
    //从描述中解析话题出来
    const html = new HtmlDocument();
    html.LoadHtml(taskData.desc);

    const pList = html.DocumentNode.SelectNodes('//p');
    if (pList?.length > 0) {
      //话题
      const topics = html.DocumentNode.SelectNodes('//topic');
      if (topics?.length > 0) {
        for (const item of topics) {
          let topicStr = htmlDecode(item.getAttribute('raw') ?? '');
          if (!topicStr?.startsWith('{')) {
            const text = item.getAttribute('text');
            if (text) {
              topicStr = `{"yixiaoerName":"${text}"}`;
            } else {
              continue;
            }
          }
          item.textContent = '';
          taskData.topics.push(JSON.parse(topicStr).yixiaoerName);
          break;
        }
      }

      //换行
      let newText = '';
      for (let pIndex = 0; pIndex < pList.length; pIndex++) {
        const pItem = pList[pIndex];
        newText = `${newText}${pItem.textContent}\n`;
      }

      taskData.desc = newText;
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
          taskData.topics.push(topicItem?.yixiaoerName);
        }
      }
      taskData.desc = htmlDecode(html.DocumentNode.InnerText());
    }
  }
};

/**
 * 组装发布参数
 * @param taskData
 * @param coverInfo
 * @param videoInfoIn
 * @param draftId 草稿id，用于二次编辑更新草稿，备用
 * @param userId
 * @param douyinVideoCover
 * @param topicIds
 */
export const buildPostData = (
  taskData: ToutiaohaoVideoTaskInput,
  coverInfo: UploadedImageInfo,
  videoInfoIn: UploadedVideoInfo,
  draftId: string,
  userId: string,
  douyinVideoCover?: string,
  topicIds?: Array<string>,
): string => {
  const video = videoInfoIn.Result.Results[0].VideoMeta;
  const rePostData = {};
  const desc = taskData.desc ?? '';
  const title = taskData.title ?? '';
  rePostData['Abstract'] = !desc ? title : desc;
  //申明原创
  rePostData['ClaimOrigin'] = taskData?.original ?? false;
  rePostData['ColumnChosen'] = '';
  rePostData['Commodity'] = [];
  const composs = {};
  composs['CompassVideoId'] = '';
  composs['CompassVideoName'] = '';
  composs['CompassVideoType'] = 0;
  rePostData['CompassVideo'] = composs;
  rePostData['CoverTitles'] = [];
  rePostData['CreateSource'] = 2;
  rePostData['DevicePlatform'] = 'pc';
  rePostData['EnterFrom'] = 5;
  rePostData['ExternalLink'] = taskData.externalLink ?? '';
  rePostData['FilterName'] = '';
  rePostData['from'] = 'mp';
  rePostData['IsNew'] = true;
  rePostData['ItemId'] = draftId ?? '';
  rePostData['tags'] = taskData.tags;
  //话题
  if (topicIds && topicIds?.length > 0) {
    rePostData['HashtagIds'] = topicIds;
  }

  rePostData['OsType'] = '09';
  rePostData['TerminalType'] = '01';
  rePostData['VideoInfo'] = {
    Duration: video.Duration,
    ThumbUri: coverInfo?.data ? coverInfo?.data[0]?.uri : video.Uri,
    Vid: videoInfoIn.Result.Results[0].Vid,
    VName: `${taskData.title}.mp4`,
  };
  rePostData['VideoType'] = 3;
  rePostData['Praise'] = taskData.praise ?? false;

  const agentPart = HttpConfig.userAgent.split('/');
  rePostData['SoftType'] = `chrome ${agentPart[agentPart.length - 1]}`;
  rePostData['TemplateName'] = '';
  rePostData['Title'] = title;

  rePostData['SyncAweme'] = taskData.syncAweme ?? 0;
  //定时发布
  if (taskData?.publishTime) {
    rePostData['TimerTime'] = parseInt(new Date(taskData.publishTime).getTime().toString().substring(0, 10));
  }
  //征文活动
  rePostData['ActivityTag'] = taskData.activityId ?? '';

  rePostData['Content'] = '';
  rePostData['duration'] = video.Duration ?? 0;
  rePostData['GovernForward'] = 0;
  rePostData['GovForwardGroupId'] = -1;
  rePostData['needFullIP'] = 'True';
  rePostData['needIp'] = 'True';
  rePostData['NeedPay'] = 0;
  rePostData['Port'] = 0;
  // 草稿还是发布
  rePostData['PublishType'] = taskData.pubType ?? 1;
  rePostData['Save'] = taskData.pubType ?? 1;

  rePostData['SlaveItems'] = '';
  rePostData['subTitle'] = taskData['subTitle'];
  rePostData['TitleId'] = userId;
  rePostData['VideoThirdMonitorUrl'] = '';
  rePostData['XiguaPlay'] = 0;

  //可见类型
  rePostData['HideInfo'] = { HideType: taskData.visibilityType ?? 0 };
  //同步到抖音，请确保已绑定抖音号
  if (taskData.syncAweme === 1 || taskData?.syncAwemeTask) {
    const AwemeCreateItem = {
      ItemId: '',
      AwemeItemId: '',
      UserId: '',
      Text: '',
      TextExtra: '',
      CoverUri: douyinVideoCover ?? '',
      CoverUrl: douyinVideoCover ?? '',
      PoiId: '',
      PoiName: '',
    };
    rePostData['SyncAweme'] = true;
    if (taskData?.syncAwemeTask?.cover || taskData?.syncAwemeTask?.desc || taskData?.syncAwemeTask?.topics?.length) {
      let text = taskData.syncAwemeTask.desc ?? taskData.title ?? '';
      //话题
      const topicNames = new Array<{
        start: number;
        type: number;
        user_id: string;
        end: number;
        hashtag_name: string;
      }>();
      let titleIndex = text.length;
      const topicJa = taskData?.syncAwemeTask?.topics;
      if (topicJa?.length > 0) {
        const topicIds = new Array<string>();
        for (const item of topicJa) {
          const name = item?.cha_name?.toString() ?? item?.toString();
          text = text + ' #' + name;
          const topic = {
            start: titleIndex,
            type: 1,
            user_id: '',
            end: titleIndex + name.length + 2,
            hashtag_name: name,
          };
          topicNames.push(topic);
          if (item?.cid) {
            topicIds.push(item?.cid.toString());
          }
          titleIndex = text.length;
        }
      }

      if (topicNames?.length > 0) {
        AwemeCreateItem['TextExtra'] = JSON.stringify(topicNames);
      } else {
        AwemeCreateItem['TextExtra'] = '';
      }

      //地理位置
      if (taskData?.syncAwemeTask.poi_id && taskData?.syncAwemeTask.poi_name) {
        AwemeCreateItem['PoiId'] = taskData.syncAwemeTask.poi_id;
        AwemeCreateItem['PoiName'] = encodeURIComponent(taskData.syncAwemeTask.poi_name);
      }
      //描述+话题
      AwemeCreateItem['Text'] = text;

      rePostData['AwemeCreateItem'] = AwemeCreateItem;
    }
  }
  //合集
  if (taskData.collectionId) {
    rePostData['PrependPSeriesId'] = taskData.collectionId?.toString();
  }

  //申明
  if (taskData.complianceInfo?.complianceType) {
    if (taskData.complianceInfo.complianceType === 1) {
      rePostData['ComplianceInfo'] = { IsAIGC: false, ComplianceType: 1, CreativeInfo: {} };
    } else if (taskData.complianceInfo.complianceType === 2) {
      rePostData['ComplianceInfo'] = { IsAIGC: false, ComplianceType: 2, MaterialInfo: { MaterialSource: 2 } };
    } else {
      rePostData['ComplianceInfo'] = {
        IsAIGC: taskData.complianceInfo.complianceType === 3,
        ComplianceType: taskData.complianceInfo.complianceType,
      };
    }
  }
  return JSON.stringify(rePostData);
};

/**
 * 头条横版视频发布入参
 */
export const validateToutiaohaoVideoTags = (tags: unknown): tags is Array<string> => {
  return Array.isArray(tags) && tags.length >= 1 && tags.length <= 5 && tags.every((tag) => typeof tag === 'string');
};

export interface ToutiaohaoVideoTaskInput extends ITask {
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
   * 视频标签，必须包含1至5个字符串；单个标签不限制长度
   */
  tags: Array<string>;

  /**
   * 话题
   */
  topics?: Array<string>;

  /**
   * 描述
   */
  desc?: string;

  /**
   * 是否原创
   */
  original: boolean;
  /**
   * 可见类型
   *  - 0: 公开
   *  - 1:私密
   *  - 2: 粉丝可见
   */
  visibilityType: number;

  /**
   * 扩展链接,
   */
  externalLink?: string;

  /**
   * 赞赏
   */
  praise?: boolean;

  /**
   * 同步到抖音 1:是，非1:否，高权益选项
   */
  syncAweme?: number;

  /**
   *  同步到抖音时，抖音配置参数
   */
  syncAwemeTask?: SyncAwemeTask;

  /**
   * 正文活动id
   */
  activityId?: string;

  /**
   * 合集Id
   */
  collectionId?: string;

  /**
   * 定时发布日期时间，格式2024-01-01 00:00:01
   */
  publishTime?: string;

  /**
   * 作品申明
   */
  complianceInfo?: {
    /**
     * 1:自行拍摄
     * 2:取自站外
     * 3:AI生成
     * 6:虚构演绎，故事经历
     * 7:投资观点，仅供参考
     * 8:健康医疗分享，仅供参考
     */
    complianceType?: 1 | 2 | 3 | 6 | 7 | 8;
  };

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}

export interface SyncAwemeTask {
  /**
   * 封面信息
   */
  cover?: {
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
   * 同步到抖音的描述
   */
  desc?: string;

  /**
   * 同步到抖音的话题，来自抖音话题接口
   */
  topics: Array<DouyinTopicInfo>;
  /**
   * 抖音地理位置id，来自抖音地址接口
   */
  poi_id?: string;

  /**
   *抖音地理位置名称，来自抖音地址接口
   */
  poi_name?: string;
}
