import fs from 'fs';
import { errorCode } from '../errorCode';
import {
  GetMD5ByPathLike,
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
import { PublishResult } from '../../media-platform';
import crc from 'crc';
import {
  checkUploadFinishResponse,
  getInitUploadResponse,
  getUploadArgsResponse,
  notifyUploadSucResponse,
  publishTengxunshipinResponse,
  UploadArgsResponse,
  uploadImageResponse,
  UploadPartResponse,
  uploadVideoPartResponse,
} from './tengxunshipin-video.service';
import { calculateVS_ACTK, getCookieAccessTokenValue, getCookieVusessionValue } from './tengxunshipin-base.service';
import { TengXunShiPinTopicInfo } from '@/media-platform/tengxunshipin/tengxunshipin-topic.service';
import { getPersonalAccessTokenAsync } from '@/media-platform/tengxunshipin/tengxunshipin-user.service';
import { ITask } from '@/media-platform/baseTask';

/**
 *
 * @param taskData 任务体
 * @param eventCallback 事件回调
 * @param fileStat 文件句柄
 * @param pubResult 发布结果
 * @param maxThread 最大并发上传
 * @param cookie
 * @param reqId
 */
const uploadVideo = async (
  taskData: TengXunShiPinVideoTaskInput,
  eventCallback: EventEmitter,
  fileStat: fs.Stats,
  pubResult: PublishResult,
  maxThread: number,
  cookie: string,
  reqId: string,
): Promise<UploadArgsResponse | null | undefined> => {
  let fileHandle: fs.promises.FileHandle | null = null;
  try {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    //SetProgressEvent(eventCallback, 5, '正在获取上传参数', taskData.taskId);
    const vsak = calculateVS_ACTK(getCookieAccessTokenValue(cookie));
    const g_vstk = calculateVS_ACTK(getCookieVusessionValue(cookie));
    //获取上传参数

    const initKeyObj = await getInitUploadResponse(cookie, g_vstk.toString(), reqId);
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (!initKeyObj?.data?.serverid) {
      // console.debug('获取视频上传出事参数失败', taskData.taskId, initKeyObj);
      pubResult.code = initKeyObj?.code ?? -1;
      pubResult.msg = `获取视频上传参数失败${initKeyObj?.msg}`;
      return null;
    }

    const uploadArgs = await getUploadArgsResponse(cookie, initKeyObj, reqId);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!uploadArgs?.vid) {
      // console.debug('获取视频上传参数失败', taskData.taskId, uploadArgs);
      pubResult.code = uploadArgs?.code ?? -1;
      pubResult.msg = `获取视频上传参数失败${uploadArgs?.msg}`;
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

    // 并行上传
    const tasks: Array<Promise<UploadPartResponse>> = [];

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
    const uploadedList: Map<number, string> = new Map();
    // 文件大小小于等单个分片大小
    if (blockSize >= fileStat.size) {
      const buffer = Buffer.alloc(fileStat.size);
      const readData = await fileHandle.read(buffer, 0, fileStat.size, readIndex);
      if (readData.buffer.length > 0) {
        const uploadResult = await uploadVideoPartResponse(
          uploadArgs,
          cookie,
          readData.buffer,
          1,
          uploadedList,
          reqId,
          initKeyObj.data.bztoken,
        );
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);

        if (uploadResult?.code != 0) {
          // console.debug('视频分片上传失败', taskData.taskId, uploadResult);
          pubResult.msg = `视频分片上传失败${uploadResult?.msg ?? ''}`;
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
          const crc32 = crc.crc32(readData.buffer).toString(16).replace('-', '');
          tasks.push(
            uploadVideoPartResponse(
              uploadArgs,
              cookie,
              readData.buffer,
              partNum,
              uploadedList,
              reqId,
              initKeyObj.data.bztoken,
            ),
          );
          uploadedList.set(partNum, crc32);

          if (tasks.length > maxThread) {
            const uploadResult = await Promise.race(tasks);

            if (uploadResult?.code != 0) {
              // console.debug('视频分片上传失败', taskData.taskId, uploadResult);
              pubResult.msg = `视频分片上传失败${uploadResult?.msg ?? ''}`;
              pubResult.code = errorCode.data_error;
              return null;
            }

            //去除第一个任务，并等待完成
            const uploadResultNew = await tasks.splice(0, 1)[0];

            if (uploadResultNew?.code != 0) {
              // console.debug('视频分片上传失败', taskData.taskId, uploadResultNew);
              pubResult.msg = `视频分片上传失败${uploadResultNew?.msg ?? ''}`;
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

      if (uploadResult?.code != 0) {
        // console.debug('视频分片上传失败', taskData.taskId, uploadResult);
        pubResult.msg = `视频分片上传失败${uploadResult?.msg ?? ''}`;
        pubResult.code = errorCode.data_error;
        return null;
      }
      onPartUploaded();
    }

    taskData.cancelToken?.throwIfCancelled(privateKey);

    const checkPostData = {};
    checkPostData['bizid'] = initKeyObj.data.bizid;
    checkPostData['fileName'] = uploadArgs.fileId;
    checkPostData['skipAudit'] = 1;
    checkPostData['uKey'] = uploadArgs.ukey;
    const list: Array<{ partNum: number; partSha?: string }> = [];
    for (let i = 1; i <= uploadedList.size; i++) {
      const secItem = {
        partNum: i,
        partSha: uploadedList.get(i),
      };
      list.push(secItem);
    }
    checkPostData['finishParts'] = list;

    //视频上传完成
    const finishResult = await checkUploadFinishResponse(
      cookie,
      JSON.stringify(checkPostData),
      uploadArgs,
      reqId,
      initKeyObj.data.bztoken,
    );
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (finishResult?.code != 0) {
      // console.debug('视频上传完成校验失败', taskData.taskId, finishResult);
      pubResult.msg = `视频上传完成校验失败${finishResult?.msg ?? ''}`;
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

    const fileSha = await GetMD5ByPathLike(taskData.video.localPath, 'sha1');
    const uploadedVideoInfo = await notifyUploadSucResponse(
      cookie,
      uploadArgs,
      reqId,
      initKeyObj,
      fileSha,
      fileStat.size,
      vsak,
      g_vstk,
    );
    if (uploadedVideoInfo?.code != 0) {
      // console.debug('视频上传完成校验失败', taskData.taskId, uploadedVideoInfo);
      pubResult.msg = `视频上传完成校验失败${uploadedVideoInfo?.msg ?? ''}`;
      pubResult.code = errorCode.data_error;
      return null;
    }
    uploadArgs.bizId = initKeyObj.data.bizid ?? 0;
    uploadArgs.bizToken = initKeyObj.data.bztoken ?? '';
    return uploadArgs;
    // endregion
  } catch (e) {
    logger.error(`腾讯视频视频上传异常失败，${taskData.taskId},${(e as Error)?.message}`);
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
export const publishTengXunShiPinVideo = async (
  cookie: string,
  taskData: TengXunShiPinVideoTaskInput,
  eventCallback: EventEmitter,
  maxThreadOut: number = 3,
  retryTimes: number = 3,
): Promise<PublishResult> => {
  logger.info(`腾讯视频视频发布 ${taskData.taskId}`);
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

    cookie = (await getPersonalAccessTokenAsync(cookie))?.cookie ?? cookie;
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // 获取文件信息
    const fileStat = await fs.promises.stat(taskData.video.localPath);
    taskData.video.size = fileStat.size;
    SetProgressEvent(eventCallback, 2, '正在获取上传参数', taskData.taskId);

    const reqId = ['f', +new Date(), Math.random()].join('').split('.').join('');

    // region 上传视频
    let uploadedVideoInfo = await uploadVideo(
      taskData,
      eventCallback,
      fileStat,
      pubResult,
      maxThreadOut,
      cookie,
      reqId,
    );
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      if (!uploadedVideoInfo?.vid) {
        if (i < retryTimes - 1 && pubResult.code != 111) {
          SetProgressEvent(eventCallback, 4, '上传失败,重试中', taskData.taskId);
          uploadedVideoInfo = await uploadVideo(
            taskData,
            eventCallback,
            fileStat,
            pubResult,
            maxThreadOut,
            cookie,
            reqId,
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

    const g_actk = calculateVS_ACTK(getCookieAccessTokenValue(cookie));
    const g_vstk = calculateVS_ACTK(getCookieVusessionValue(cookie));
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
      const imageResult = await uploadImageResponse(
        cookie,
        imageData.data,
        g_vstk.toString(),
        g_actk.toString(),
        taskData.cover.width ?? 2000,
        taskData.cover.height ?? 2000,
        uploadedVideoInfo.vid,
      );
      for (let i = 0; i < retryTimes; i++) {
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);

        if (!imageResult?.data?.url) {
          pubResult.code = errorCode.data_error;
          pubResult.msg = `封面上传失败:${taskData.cover.pathOrUrl}` + (imageResult?.msg ?? '');
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
        coverUrl = imageResult?.data.url;
      }
    }

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    //endregion

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    //存草稿
    const postData = buildPostData(uploadedVideoInfo, taskData, coverUrl);

    // 组装发布数据
    // console.debug('腾讯视频视频推送数据', taskData.taskId, cookie, postData);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);

    // 推送数据

    const publishResult = await publishTengxunshipinResponse(cookie, postData, g_vstk, g_actk, webProxy);
    // console.debug('腾讯视频视频推送返回数据', taskData.taskId, publishResult);

    pubResult.code = publishResult?.code ?? -1;
    pubResult.msg = publishResult?.msg ?? '';
    pubResult.publishId = publishResult?.code === 0 ? uploadedVideoInfo.vid : '';
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
      logger.error(`腾讯视频视频发布失败 ${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(publishResult)}`);
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
    logger.error(`腾讯视频视频发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};

export interface TengXunShiPinVideoTaskInput extends ITask {
  cancelToken?: CancelToken;

  /**
   * 0:存草稿 1：直接发布
   */
  pubType: 0 | 1;
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
   * 标题
   */
  title?: string;

  /**
   * 定时发布时间， 13位时间戳
   */
  prePubTime?: number;

  /**
   * 话题列表，目前只支持一个
   */
  topics?: TengXunShiPinTopicInfo[];

  /**
   * 1：内容由AI生成
   * 2：剧情演绎，仅供娱乐
   * 3：取材网络，谨慎甄别
   * 4：个人观点，仅供参考
   */
  claimSource?: 1 | 2 | 3 | 4;

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}

const claimSourceObj = {
  1: '123130723',
  2: '123130724',
  3: '123130725',
  4: '123130726',
};

/**
 * 组装发布数据
 * @param uploadedVideoInfo
 * @param taskData  任务数据
 * @param coverUrl
 */
const buildPostData = (
  uploadedVideoInfo: UploadArgsResponse,
  taskData: TengXunShiPinVideoTaskInput,
  coverUrl: string,
): string => {
  const reJo = {};
  const title = taskData?.title ?? '';

  reJo['video_title'] = title;
  reJo['vid'] = uploadedVideoInfo.vid;
  reJo['bizid'] = uploadedVideoInfo.bizId ?? 0;
  reJo['duration'] = taskData.video.duration ? Math.ceil(taskData.video.duration) : 59;
  reJo['image_url'] = coverUrl ?? '';
  reJo['aspect_ratio'] = `${taskData.video.width ?? 1920}x${taskData.video.height ?? 1080}`;
  //reJo['isOriginal'] = taskData?.isOriginal ?? 0;
  reJo['platform'] = '2';
  reJo['is_draft'] = taskData.pubType === 0;
  reJo['video_id'] = uploadedVideoInfo.videoId;
  const vtags: Array<{ video_tag_type: number; tag_data_list: Array<object> }> = [
    { video_tag_type: 10, tag_data_list: [] },
    { video_tag_type: 25, tag_data_list: [] },
    { video_tag_type: 22, tag_data_list: [] },
  ];

  //申明
  if (taskData.claimSource) {
    vtags.push({ video_tag_type: 24, tag_data_list: [{ id: claimSourceObj[taskData.claimSource] }] });
  } else {
    vtags.push({ video_tag_type: 24, tag_data_list: [] });
  }

  //话题
  if (taskData.topics?.length) {
    vtags.push({
      video_tag_type: 13,
      tag_data_list: [taskData.topics[0]],
    });
  }

  //定时
  if (taskData.prePubTime) {
    vtags.push({
      video_tag_type: 15,
      tag_data_list: [
        {
          id: taskData.prePubTime ? (taskData.prePubTime / 1000).toFixed(0) : '0',
        },
      ],
    });
  } else {
    vtags.push({ video_tag_type: 15, tag_data_list: [] });
  }

  reJo['vtags'] = vtags;

  return JSON.stringify(reJo, null, 2);
};
