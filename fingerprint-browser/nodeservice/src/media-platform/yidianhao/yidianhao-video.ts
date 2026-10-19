import fs from 'fs';
import { BaseResult } from '../baseResult';
import { errorCode } from '../errorCode';
import {
  htmlDecode,
  logger,
  publishStatusEnum,
  Random,
  readImageData,
  SetProgressEvent,
  SetProgressNewEvent,
  UploadEmitGate,
} from '../../utils';
import { AxiosError } from 'axios';
import { EventEmitter } from 'events';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import { HtmlDocument } from '@/htmlAgilityPack';
import { getYidianhaoUserInfo, YidianhaoUserInfoOutput } from './yidianhao-common';
import {
  checkUploadedVideo,
  extraFrameVideo,
  getAKAndSK,
  getArticleScheduleTime,
  getImageFromUrl,
  getVideoDuration,
  getYidianHaoUploadArgs,
  getYidianhaoUploadId,
  prePubYidianhaoVideo,
  publishYidianhaoVideoResponse,
  saveYidianhaoVideoDraft,
  uploadImageBinary,
  uploadYidianhaoVideoPart,
  YidianhaoVideoUploadArgs,
} from './yidianhao-video.service';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { ITask } from '@/media-platform/baseTask';

/**
 *
 * @param taskData 任务体
 * @param eventCallback 事件回调
 * @param fileStat 文件句柄
 * @param uploadArgsOut
 * @param pubResult 发布结果
 * @param maxThread 最大并发上传
 * @param cookie
 * @param userInfo
 * @param akArgs
 */
const uploadVideo = async (
  taskData: YidianhaoVideoTaskInput,
  eventCallback: EventEmitter,
  fileStat: fs.Stats,
  uploadArgsOut: { node: YidianhaoVideoUploadArgs },
  pubResult: YidianhaoPublishResultOutput,
  maxThread: number,
  cookie: string,
  userInfo: YidianhaoUserInfoOutput,
  akArgs: { code: number; ak: string; sk: string },
): Promise<YidianhaoVideoUploadArgs | null | undefined> => {
  let fileHandle: fs.promises.FileHandle | null = null;
  try {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    //获取上传token
    let uploadArgs = await getYidianHaoUploadArgs(cookie, userInfo.data?.mpCode ?? '');

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (!uploadArgs?.result?.length) {
      uploadArgs = await getYidianHaoUploadArgs(cookie, userInfo.data?.mpCode ?? '');
    }

    if (!uploadArgs?.result?.length) {
      // console.debug('获取视频上传参数失败', taskData.taskId, uploadArgs);
      pubResult.code = -1;
      pubResult.msg = uploadArgs?.error ?? '获取视频上传参数失败';
      return null;
    }

    //获取上传参数
    const fileLength = fileStat.size;
    let uploadIdObj = await getYidianhaoUploadId(
      cookie,
      fileLength,
      uploadArgs,
      userInfo?.data?.mpCode ?? '',
      akArgs.sk,
      akArgs.ak,
    );

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (!uploadIdObj?.uploadId) {
      uploadIdObj = await getYidianhaoUploadId(
        cookie,
        fileLength,
        uploadArgs,
        userInfo?.data?.mpCode ?? '',
        akArgs.sk,
        akArgs.ak,
      );
    }

    if (!uploadIdObj?.uploadId) {
      // console.debug('获取视频上传ID失败', taskData.taskId, uploadArgs);
      pubResult.code = uploadIdObj?.code ?? -1;
      pubResult.msg = '获取视频上传ID失败';
      return null;
    }

    uploadArgsOut.node = uploadArgs;
    // 获取文件句柄
    fileHandle = await fs.promises.open(taskData.video.localPath, 'r');

    // 准备上传分片信息列表
    const uploadedList: Map<number, string> = new Map();

    // 开始读取并上传文件
    let readIndex = 0;

    // 分片大小 8M
    const blockSize = 5242880;
    //总片数
    const totalPartNums = Math.ceil(fileStat.size / blockSize);

    // 并行上传
    const tasks: Array<Promise<{ code: number; etag: string }>> = [];
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
    //const fileName = path.basename(taskData.video.localPath);
    // 文件大小小于等单个分片大小
    if (blockSize >= fileStat.size) {
      const buffer = Buffer.alloc(fileStat.size);
      const readData = await fileHandle.read(buffer, 0, fileStat.size, readIndex);
      if (readData.buffer.length > 0) {
        const uploadResult = await uploadYidianhaoVideoPart(
          cookie,
          readData.buffer,
          1,
          uploadIdObj.uploadId,
          akArgs.ak,
          akArgs.sk,
          userInfo.data?.mpCode ?? '',
          uploadArgs,
          uploadedList,
        );

        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);

        if (!uploadResult?.etag) {
          pubResult.msg = `视频分片上传失败`;
          pubResult.code = uploadResult?.code ?? errorCode.data_error;
          logger.error(`视频上传失败 ${taskData.taskId} ${cookie} ${JSON.stringify(uploadResult)}`);
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
          tasks.push(
            uploadYidianhaoVideoPart(
              cookie,
              readData.buffer,
              partNum,
              uploadIdObj.uploadId,
              akArgs.ak,
              akArgs.sk,
              userInfo.data?.mpCode ?? '',
              uploadArgs,
              uploadedList,
            ),
          );

          if (tasks.length > maxThread) {
            const uploadResult = await Promise.race(tasks);

            if (!uploadResult?.etag) {
              pubResult.msg = `视频分片上传失败`;
              pubResult.code = uploadResult?.code ?? errorCode.data_error;
              logger.error(`视频上传失败 ${taskData.taskId} ${cookie} ${JSON.stringify(uploadResult)}`);
              return null;
            }

            //去除第一个任务，并等待完成
            const uploadResultNew = await tasks.splice(0, 1)[0];

            if (!uploadResultNew?.etag) {
              pubResult.msg = `视频分片上传失败`;
              pubResult.code = uploadResultNew?.code ?? errorCode.data_error;
              logger.error(`视频上传失败 ${taskData.taskId} ${cookie} ${JSON.stringify(uploadResultNew)}`);
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
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      const uploadResult = await tasks.splice(0, 1)[0];

      if (!uploadResult?.etag) {
        pubResult.msg = `视频分片上传失败`;
        pubResult.code = uploadResult?.code ?? errorCode.data_error;
        logger.error(`视频上传失败 ${taskData.taskId} ${cookie} ${JSON.stringify(uploadResult)}`);
        return null;
      }
      onPartUploaded();
    }

    //视频上传完成
    let checkResult = await checkUploadedVideo(
      cookie,
      uploadIdObj.uploadId,
      akArgs.ak,
      akArgs.sk,
      userInfo.data?.mpCode ?? '',
      uploadArgs,
      uploadedList,
    );

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (!checkResult?.crc64) {
      checkResult = await checkUploadedVideo(
        cookie,
        uploadIdObj.uploadId,
        akArgs.ak,
        akArgs.sk,
        userInfo.data?.mpCode ?? '',
        uploadArgs,
        uploadedList,
      );
    }

    if (!checkResult?.crc64) {
      pubResult.msg = '视频上传完整校验失败';
      pubResult.code = checkResult?.code ?? errorCode.data_error;
      logger.error(`视频上传完整校验失败 ${taskData.taskId} ${cookie} ${JSON.stringify(checkResult)}`);
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

    await extraFrameVideo(cookie, userInfo.data?.mpCode ?? '', uploadArgs);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    await getVideoDuration(cookie, userInfo.data?.mpCode ?? '', uploadArgs);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    uploadArgs.uploadId = uploadIdObj.uploadId;
    pubResult.code = 0;
    pubResult.msg = '';
    return uploadArgs;
    // endregion
  } catch (e) {
    logger.error(` 一点号视频上传异常失败，${taskData.taskId},${(e as Error)?.message}`);
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
export const publishYidianhaoVideo = async (
  cookie: string,
  taskData: YidianhaoVideoTaskInput,
  eventCallback: EventEmitter,
  maxThreadOut: number = 3,
  retryTimes: number = 3,
): Promise<YidianhaoPublishResultOutput> => {
  logger.info(`一点号视频发布 ${taskData.taskId}`);
  const pubResult: YidianhaoPublishResultOutput = {
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
    //最多8个标签
    taskData.tags = taskData?.tags?.slice(0, 8);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    const userInfo = await getYidianhaoUserInfo(cookie);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!userInfo.data?.uid) {
      // console.debug('获取用户信息失败', cookie, taskData.taskId, userInfo);
      pubResult.code = errorCode.io_error;
      pubResult.msg = userInfo?.msg ?? '获取用户信息失败';
      logger.error(`获取用户信息失败 ${taskData.taskId} ${cookie} ${JSON.stringify(userInfo)}`);
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

    const akArgs = await getAKAndSK(userInfo.data.skUrl ?? '');

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!akArgs?.ak) {
      pubResult.code = akArgs.code ?? -1;
      pubResult.msg = '获取一点号ak失败';
      logger.error(`${pubResult.msg} ${taskData.taskId} ${cookie} ${JSON.stringify(akArgs)}`);
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult?.msg ? pubResult.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }

    const uploadArgs: YidianhaoVideoUploadArgs = { status: '', result: [] };
    const uploadArgsIn = { node: uploadArgs };

    // region 上传视频
    let uploadedVideoInfo = await uploadVideo(
      taskData,
      eventCallback,
      fileStat,
      uploadArgsIn,
      pubResult,
      maxThreadOut,
      cookie,
      userInfo,
      akArgs,
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
            userInfo,
            akArgs,
          );
          continue;
        }
        logger.error(
          `视频上传失败 ${taskData.taskId} ${cookie} ${JSON.stringify(uploadedVideoInfo)}  ${JSON.stringify(
            pubResult,
          )}`,
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
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (!uploadedVideoInfo?.uploadId) {
      logger.error(
        `视频上传失败 ${taskData.taskId} ${cookie} ${JSON.stringify(uploadedVideoInfo)}  ${JSON.stringify(pubResult)}`,
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

    SetProgressEvent(eventCallback, 85, '获取上传完成视频信息', taskData.taskId);

    // region 封面上传
    SetProgressEvent(eventCallback, 90, '封面读取中', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // 读取图片数据
    SetProgressEvent(eventCallback, 90, '封面上传中', taskData.taskId);
    // 上传图片数据
    let coverUrl = '';
    if (taskData.cover.pathOrUrl.toLowerCase().startsWith('http')) {
      const coverObj = await getImageFromUrl(cookie, taskData.cover.pathOrUrl, userInfo.data.mpCode ?? '');
      coverUrl = coverObj.inner_addr;
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (!coverUrl) {
      const imageData = await readImageData(taskData.cover.pathOrUrl, 'jpeg');

      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      if (!imageData.data) {
        // console.debug('读取封面失败', cookie, taskData.taskId, taskData.cover);
        pubResult.code = errorCode.io_error;
        pubResult.msg = `读取封面失败-${taskData.cover.pathOrUrl}`;
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploadFail,
          pubResult?.msg ? pubResult.msg : '上传失败',
          taskData.taskId,
        );
        return pubResult;
      }
      const coverObj = await uploadImageBinary(cookie, imageData.data, userInfo?.data?.mpCode ?? '', imageData.ext);

      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      coverUrl = coverObj.url;
      if (!coverUrl) {
        pubResult.code = errorCode.data_error;
        pubResult.msg = `封面上传失败-${taskData.cover.pathOrUrl}${coverObj.error ?? ''}`;
        logger.error(
          `${pubResult.msg} ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${JSON.stringify(coverObj)}`,
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
    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    //endregion
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);

    //存草稿
    const postData = buildPostData(taskData, coverUrl, uploadArgsIn.node, fileStat.size);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (taskData.pubType === 0) {
      //不可取消
      taskData.cancelToken?.disable(privateKey);
    }
    const draftData = await saveYidianhaoVideoDraft(cookie, postData, userInfo.data.mpCode ?? '');

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!draftData?.result?.result?.success[0]?.id) {
      // console.debug('保存草稿失败', taskData.taskId, draftData);
      pubResult.msg = '保存草稿失败';
      pubResult.code = -1;
      logger.error(`${pubResult.msg} ${taskData.taskId} ${cookie} ${postData}  ${JSON.stringify(draftData)}`);
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      return pubResult;
    }

    pubResult.publishId = draftData?.result?.result?.success[0]?.id?.toString() ?? '';
    if (taskData.pubType === 0) {
      pubResult.msg = '草稿保存成功';
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送草稿成功', taskData.taskId);
      return pubResult;
    }
    // 组装发布数据

    await getArticleScheduleTime(cookie, pubResult.publishId, userInfo.data.mpCode ?? '');

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);
    // console.debug('一点号视频推送数据', taskData.taskId, cookie, postData);

    //定时发布
    if (taskData.publishTime) {
      const preResult = await prePubYidianhaoVideo(cookie, pubResult.publishId, taskData, userInfo.data.mpCode ?? '');
      if (!preResult?.result?.length || !preResult.result[0]?.id) {
        // console.debug('定时发布失败', taskData.taskId, preResult);
        pubResult.msg = `定时发布失败${preResult['error'] ?? ''}`;
        pubResult.code = -1;
        logger.error(
          `${pubResult.msg} ${taskData.taskId} ${cookie} ${taskData.publishTime}  ${JSON.stringify(preResult)}`,
        );
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.pushFail,
          pubResult?.msg ? pubResult.msg : '推送失败',
          taskData.taskId,
        );
        return pubResult;
      }
    }

    // 推送数据
    const publishResult = await publishYidianhaoVideoResponse(
      cookie,
      pubResult.publishId,
      userInfo.data.mpCode ?? '',
      webProxy,
    );
    // console.debug('一点号视频推送返回数据', taskData.taskId, publishResult);

    pubResult.code = publishResult?.result?.status === 'success' ? 0 : -1;

    if (pubResult.code == 0 && pubResult.publishId) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      pubResult.msg = `发布失败`;
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
      logger.error(
        `一点好视频发布失败 ${taskData.taskId} ${cookie} ${pubResult.publishId}  ${JSON.stringify(publishResult)}`,
      );
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
    logger.error(`一点号视频发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};

export interface YidianhaoPublishResultOutput extends BaseResult {
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

export interface YidianhaoVideoTaskInput extends ITask {
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
    width: number;
    /**
     * 视频高度
     */
    height: number;
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
   * 发布类型
   * 0 存草稿
   * 1 发布
   */
  pubType: number;
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
  tags?: Array<string>;

  /**
   * 1 无需申明, 2 自行拍摄, 3 内容取材网络 ， 4 内容由AI生成 ,5 虚构情节内容
   */
  wm_content_source?: {
    type: 1 | 2 | 3 | 4 | 5;
    /**
     * 13为时间戳，当类型为自行拍摄时的拍摄时间
     */
    time?: number;

    /**
     * 拍摄地点，eg:'湖南省-长沙市-岳麓区'，'北京市-北京市-东城区'
     */
    place?: string;
  };
  /**
   * 定时发布13位时间戳，精确到分钟，分钟为5的倍数
   */
  publishTime?: number;

  /**
   * 创作类型 1:原创 0:转载
   */
  isOriginal?: 1 | 0;

  /**
   * 一级分类名称,必选
   */
  categoryName: string;

  /**
   * 二级分类名称,可选
   */
  subCategoryName?: string;

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}

/**
 * 组装发布数据
 * @param taskData  任务数据
 * @param coverUrl
 * @param uploadArgs
 * @param videoLength
 */
const buildPostData = (
  taskData: YidianhaoVideoTaskInput,
  coverUrl: string,
  uploadArgs: YidianhaoVideoUploadArgs,
  videoLength: number,
): string => {
  const re = {};
  const editorType = taskData.video.width > taskData.video.height ? 'videoEditor' : 'shortVideoEditor';
  re['activity_id'] = 0;
  re['articleNumber'] = 1;
  re['dirty'] = false;
  re['content'] = encodeURIComponent('<p>&nbsp;</p><div class="post-end"></div>');
  re['editorType'] = editorType;
  re['fetchFromRemote'] = false;
  re['join_activity'] = 0;
  re['maxTimingDay'] = 7;
  re['minTimingHour'] = 6;
  re['totalNumber'] = 1;
  //原创
  re['original'] = taskData.isOriginal ? 2 : 0;

  const article = {};
  article['articleIndex'] = 1;
  article['beautyImg'] = '';
  article['cate'] = '';
  article['cateA'] = taskData.categoryName;
  article['cateB'] = taskData.subCategoryName ?? '';
  article['contentMark'] = 0;
  article['cover'] = coverUrl;
  article['coverImg'] = '';
  //isHorizontal
  article['coverIsHorizontal'] = taskData.cover.width > taskData.cover.height;
  article['editorType'] = editorType;
  article['fileKey'] = uploadArgs.result[1];
  article['isFramesAddVideo'] = true;
  article['isGetVideoType'] = true;
  article['isHorizontal'] = taskData.video.width > taskData.video.height;
  article['title'] = taskData.title ?? '';
  article['originalTitle'] = taskData.title ?? '';
  article['subTitle'] = '';
  article['isPubed'] = false;
  article['status'] = 'success';
  article['summary'] = '';
  article['tags'] = taskData.tags && taskData.tags?.length > 0 ? taskData.tags : []; //这里需要是json数组
  article['uploadedSize'] = videoLength;
  article['uploadingStatus'] = 3;
  article['uploadProgress'] = 100;
  article['uploadRemaining'] = '-0.00048990857' + new Random().Next(1111, 99999) + '4051'; //-0.00048990857892814051
  article['uploadSpeed'] = '20' + new Random().Next(1111, 9999) + '.1174668029'; //=2071815.1174668029
  article['uploadTotalSize'] = videoLength;
  const tm = {};
  tm['1'] = article;
  re['articles'] = tm;

  if (taskData.desc) {
    const html = new HtmlDocument();
    html.LoadHtml(taskData.desc);
    article['summary'] = htmlDecode(html.DocumentNode.InnerText());
  }

  //定时发布
  if (taskData.publishTime) {
    re['timestamp'] = new Date(taskData.publishTime).setSeconds(0);
    taskData['pub_time'] = re['timestamp'];
  }

  //声明
  if (taskData.wm_content_source) {
    re['wm_content_source'] = taskData.wm_content_source;
  }
  return JSON.stringify(re);
};
