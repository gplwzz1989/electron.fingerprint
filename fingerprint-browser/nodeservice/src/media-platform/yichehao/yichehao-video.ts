import fs from 'fs';
import { BaseResult } from '../baseResult';
import { errorCode } from '../errorCode';
import {
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
import path from 'path';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import * as buffer from 'buffer';
import dayjs from 'dayjs';
import { HtmlAgilityPack } from '@/article-parse/common/HtmlAgilityPack';
import {
  buildYiCheHaoVideoSign,
  finishUploadYiCheHaoVideoResponse,
  getYiCheHaoUploadArgsResponse,
  publishYiCheHaoVideoResponse,
  saveUploadYiCheHaoVideoResponse,
  UploadImageInfoResponse,
  uploadYiCheHaoImageResponse,
  uploadYiCheHaoVideoPartResponse,
  YiCheHaoUploadArgsResponse,
  YiCheHaoUploadVideoResponse,
} from './yichehao-video-service';
import { ITask } from '@/media-platform/baseTask';
import { ImageInfo, ListItemInfo } from '@/media-platform/baseModel';

/**
 *
 * @param taskData 任务体
 * @param eventCallback 事件回调
 * @param fileStat 文件句柄
 * @param pubResult 发布结果
 * @param maxThread 最大并发上传
 * @param cookie
 */
const uploadVideo = async (
  taskData: YiCheHaoVideoTaskInput,
  eventCallback: EventEmitter,
  fileStat: fs.Stats,
  pubResult: YiCheHaoPublishResultOutput,
  maxThread: number,
  cookie: string,
): Promise<YiCheHaoUploadArgsResponse | null | undefined> => {
  let fileHandle: fs.promises.FileHandle | null = null;
  try {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //获取上传参数
    const fileName = path.basename(taskData.video.localPath);

    const uploadArgs = await getYiCheHaoUploadArgsResponse(cookie);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!uploadArgs?.data) {
      // console.debug('获取视频上传参数失败', taskData.taskId, uploadArgs);
      pubResult.code = errorCode.data_error;
      pubResult.msg = uploadArgs?.message ? uploadArgs?.message : '获取视频上传参数失败';
      return null;
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // 获取文件句柄
    fileHandle = await fs.promises.open(taskData.video.localPath, 'r');

    const now = new Date();
    // 开始读取并上传文件
    let readIndex = 0;

    // 分片大小 8M
    const blockSize = 1048576;
    //总片数
    const totalPartNums = Math.ceil(fileStat.size / blockSize);

    // 并行上传
    const tasks: Array<Promise<YiCheHaoUploadVideoResponse>> = [];
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
        const uploadResult = await uploadYiCheHaoVideoPartResponse(
          cookie,
          readData.buffer,
          uploadArgs,
          1,
          1,
          fileName,
          fileStat.size,
        );

        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);

        if (uploadResult?.code != 200) {
          // console.debug('视频分片上传失败', taskData.taskId, uploadResult);
          pubResult.msg = `视频分片上传失败${uploadResult?.message ?? ''}`;
          pubResult.code = errorCode.data_error;

          return null;
        }
        uploadArgs.fileKey = uploadResult?.data?.fileKey ?? uploadArgs.fileKey;
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
            uploadYiCheHaoVideoPartResponse(
              cookie,
              readData.buffer,
              uploadArgs,
              partNum,
              totalPartNums,
              fileName,
              fileStat.size,
            ),
          );

          if (tasks.length > maxThread) {
            const uploadResult = await Promise.race(tasks);

            if (uploadResult?.code != 200) {
              // console.debug('视频分片上传失败', taskData.taskId, uploadResult);
              pubResult.msg = `视频分片上传失败${uploadResult?.message ?? ''}`;
              pubResult.code = errorCode.data_error;
              return null;
            }
            uploadArgs.fileKey = uploadResult?.data?.fileKey ?? uploadArgs.fileKey;

            //去除第一个任务，并等待完成
            const uploadResultNew = await tasks.splice(0, 1)[0];

            if (uploadResultNew?.code != 200) {
              // console.debug('视频分片上传失败', taskData.taskId, uploadResultNew);
              pubResult.msg = `视频分片上传失败${uploadResultNew?.message ?? ''}`;
              pubResult.code = errorCode.data_error;
              return null;
            }
            uploadArgs.fileKey = uploadResultNew?.data?.fileKey ?? uploadArgs.fileKey;
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

      if (uploadResult?.code != 200) {
        // console.debug('视频分片上传失败', taskData.taskId, uploadResult);
        pubResult.msg = `视频分片上传失败${uploadResult?.message ?? ''}`;
        pubResult.code = errorCode.data_error;
        return null;
      }
      uploadArgs.fileKey = uploadResult?.data?.fileKey ?? uploadArgs.fileKey;
      onPartUploaded();
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    const uploadedVideoInfo = await finishUploadYiCheHaoVideoResponse(cookie, uploadArgs);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (uploadedVideoInfo?.code != 200) {
      // console.debug('视频上传完成校验失败', taskData.taskId, uploadedVideoInfo, uploadArgs);
      pubResult.msg = `视频上传完成校验失败${uploadedVideoInfo?.message ?? ''}`;
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

    const saveFileName = uploadArgs.fileKey ?? path.parse(fileName).name;
    const saveVideo = await saveUploadYiCheHaoVideoResponse(cookie, uploadArgs, saveFileName, now, fileStat.size);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (saveVideo?.status?.toString() != '1') {
      // console.debug('保存视频信息失败', taskData.taskId, saveVideo, uploadArgs);
      pubResult.msg = `保存视频信息失败:${saveVideo?.message ?? ''}`;
      pubResult.code = errorCode.data_error;
      return null;
    }
    uploadArgs.videoId = typeof saveVideo?.data === 'number' ? saveVideo.data : saveVideo?.data?.videoId;
    uploadArgs.fileId = (typeof saveVideo?.data === 'object' ? saveVideo?.data?.fileId : undefined) ?? uploadArgs.uploadId;
    uploadArgs.fileKey = saveFileName;
    if (!uploadArgs.videoId) {
      pubResult.msg = '保存视频信息后未返回视频编号';
      pubResult.code = errorCode.data_error;
      return null;
    }

    pubResult.code = 0;
    pubResult.msg = '';
    return uploadArgs;
    // endregion
  } catch (e) {
    logger.error(`易车号视频上传异常失败，${taskData.taskId},${(e as Error)?.message}`);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = '视频上传失败';
    return null;
  } finally {
    fileHandle?.close();
  }
};

const uploadCover = async (
  taskData: YiCheHaoVideoTaskInput,
  imageData: buffer.Buffer,
  cookie: string,
  coverInfo: ImageInfo,
  pubResult: YiCheHaoPublishResultOutput,
): Promise<UploadImageInfoResponse | null | undefined> => {
  try {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    const imageResult = await uploadYiCheHaoImageResponse(cookie, imageData, coverInfo.width ?? 800, coverInfo.height ?? 800);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (!imageResult?.data?.imgKey) {
      // console.debug(`封面上传失败${imageResult?.message}`, imageResult);
      pubResult.code = -1;
      pubResult.msg = `封面上传失败${imageResult?.message}`;
      return null;
    }

    pubResult.code = 0;
    pubResult.msg = '';
    return imageResult;
    // endregion
  } catch (e) {
    console.error('易车视频上传失败', taskData.taskId, e);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = '视频上传失败';
    return null;
  } finally {
  }
};

const uploadCoverWithRetry = async (
  taskData: YiCheHaoVideoTaskInput,
  coverInfo: ImageInfo | undefined,
  coverName: '封面' | '竖版封面',
  retryTimes: number,
  cookie: string,
  pubResult: YiCheHaoPublishResultOutput,
): Promise<UploadImageInfoResponse | null> => {
  if (!coverInfo?.pathOrUrl) {
    if (coverName === '竖版封面') {
      return null;
    }
    pubResult.code = errorCode.data_error;
    pubResult.msg = '封面不能为空';
    return null;
  }

  const imageData = await readImageData(coverInfo.pathOrUrl, 'jpeg');
  taskData.cancelToken?.throwIfCancelled(privateKey);

  if (!imageData.data) {
    pubResult.code = errorCode.io_error;
    pubResult.msg = `读取${coverName}失败-${coverInfo.pathOrUrl}`;
    logger.error(`${coverName}读取失败 ${taskData.taskId} ${cookie} ${coverInfo.pathOrUrl} ${imageData.status}`);
    return null;
  }

  let imageResult = await uploadCover(taskData, imageData.data, cookie, coverInfo, pubResult);
  for (let i = 0; i < retryTimes; i++) {
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (!imageResult?.data?.imgKey) {
      if (i < retryTimes - 1) {
        imageResult = await uploadCover(taskData, imageData.data, cookie, coverInfo, pubResult);
        continue;
      }
      pubResult.code = errorCode.data_error;
      pubResult.msg = `${coverName}上传失败:${coverInfo.pathOrUrl}` + (imageResult?.message ?? '');
      logger.error(`${coverName}上传失败 ${taskData.taskId} ${cookie} ${coverInfo.pathOrUrl} ${JSON.stringify(imageResult)}`);
      return null;
    }
    break;
  }

  if (!imageResult?.data?.imgKey) {
    pubResult.code = errorCode.data_error;
    pubResult.msg = `${coverName}上传失败:${coverInfo.pathOrUrl}` + (imageResult?.message ?? '');
    logger.error(`${coverName}上传失败 ${taskData.taskId} ${cookie} ${coverInfo.pathOrUrl} ${JSON.stringify(imageResult)}`);
    return null;
  }

  return imageResult;
};

/**
 *
 * @param cookie  账号cookie
 * @param taskData 任务体
 * @param eventCallback 事件回调
 * @param maxThreadOut 最大并发上传
 * @param retryTimes 最大重试次数
 */
export const publishYiCheHaoVideo = async (
  cookie: string,
  taskData: YiCheHaoVideoTaskInput,
  eventCallback: EventEmitter,
  maxThreadOut: number = 3,
  retryTimes: number = 3,
): Promise<YiCheHaoPublishResultOutput> => {
  logger.info(`易车号视频发布 ${taskData.taskId}`);
  const pubResult: YiCheHaoPublishResultOutput = {
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

    // 获取文件信息
    const fileStat = await fs.promises.stat(taskData.video.localPath);
    taskData.video.size = fileStat.size;
    SetProgressEvent(eventCallback, 2, '正在获取上传参数', taskData.taskId);

    // region 上传视频
    let uploadedVideoInfo = await uploadVideo(taskData, eventCallback, fileStat, pubResult, maxThreadOut, cookie);
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      if (!uploadedVideoInfo?.data) {
        if (i < retryTimes - 1) {
          SetProgressEvent(eventCallback, 4, '上传失败,重试中', taskData.taskId);
          uploadedVideoInfo = await uploadVideo(taskData, eventCallback, fileStat, pubResult, maxThreadOut, cookie);
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
    if (!uploadedVideoInfo?.data) {
      return pubResult;
    }
    // endregion

    SetProgressEvent(eventCallback, 85, '获取上传完成视频信息', taskData.taskId);

    SetProgressEvent(eventCallback, 90, '封面上传中', taskData.taskId);
    const imageResult = await uploadCoverWithRetry(taskData, taskData.cover, '封面', retryTimes, cookie, pubResult);
    if (!imageResult?.data?.imgKey) {
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult?.msg ? pubResult.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }

    let verticalImageResult: UploadImageInfoResponse | null = null;
    if (taskData.verticalCover?.pathOrUrl) {
      SetProgressEvent(eventCallback, 92, '竖版封面上传中', taskData.taskId);
      verticalImageResult = await uploadCoverWithRetry(
        taskData,
        taskData.verticalCover,
        '竖版封面',
        retryTimes,
        cookie,
        pubResult,
      );
      if (!verticalImageResult?.data?.imgKey) {
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

    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);

    //存草稿
    const postData = buildPostData(taskData, uploadedVideoInfo, imageResult, verticalImageResult);

    // 组装发布数据

    // console.debug('易车号视频推送数据', taskData.taskId, cookie, postData);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);

    // 推送数据
    const publishResult = await publishYiCheHaoVideoResponse(cookie, postData, webProxy);
    // console.debug('易车号视频推送返回数据', taskData.taskId, publishResult);

    pubResult.code = publishResult?.status?.toString() === '1' ? 0 : parseInt(publishResult?.status ?? '-1');
    pubResult.msg = publishResult?.message;
    pubResult.publishId = uploadedVideoInfo?.videoId?.toString();

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
      logger.error(`易车视频发布失败 ${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(publishResult)}`);
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
    logger.error(`易车视频发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};

export interface YiCheHaoPublishResultOutput extends BaseResult {
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

export interface YiCheHaoVideoTaskInput extends ITask {
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
   * 竖版封面
   */
  verticalCover?: ImageInfo;

  /**
   * 标题
   */
  title: string;
  /**
   * 描述
   */
  desc: string;

  /**
   * 是否原创
   * 1:原创
   * 0:非原创
   */
  isOriginal?: 0 | 1;

  /**
   * 同意转发
   * 1:是
   * 0:否
   */
  allowForward?: boolean;

  /**
   * 话题
   */
  topics?: Array<ListItemInfo>;

  /**
   * 作品声明
   * 1 个人观点，仅供参考
   * 2 内容来源于网络
   * 3 AI生成
   */
  statementType?: 0 | 1 | 2 | 3;

  /**
   * 节目备案号
   */
  recodeNum?: string;

  /**
   * 相关视频id
   */
  relateVideoId?: string;

  /**
   * 相关视频插入时间，格式 mm:ss
   */
  relateTime?: string;

  /**
   * 易车视频类型
   * 1:易车原创
   * 2:易车首发
   * 3:易车独家
   * 4:商配
   */
  videoType?: Array<'1' | '2' | '3' | '4'>;

  /**
   * 定时发布13位时间戳
   */
  publishTime?: number;

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}

/**
 * 组装发布数据
 * @param taskData  任务数据
 * @param videoInfo
 * @param coverInfo
 */
const buildPostData = (
  taskData: YiCheHaoVideoTaskInput,
  videoInfo: YiCheHaoUploadArgsResponse,
  coverInfo: UploadImageInfoResponse,
  verticalCoverInfo?: UploadImageInfoResponse | null,
): string => {
  const html = new HtmlAgilityPack.HtmlDocument();
  html.LoadHtml('<p>' + taskData.desc + '</p>');

  const topics = html.DocumentNode.SelectNodes('//topic');
  if (topics?.length) {
    for (const topic of topics) {
      topic.innerHTML = ``;
      topic.textContent = '';
    }
  }

  const desc = html.DocumentNode.InnerText();
  const imgKeys = [coverInfo.data.imgKey];
  const verticalCoverImage = verticalCoverInfo?.data?.imgKey ?? '';
  if (verticalCoverImage) {
    imgKeys.push(verticalCoverImage);
  }
  const now = parseInt((Date.now() / 1000).toFixed(0));
  const re = {
    cid: 500,
    ver: '1.0.0',
    uid: '',
    t: now,
    sign: '',
    param: {
      videoId: videoInfo.videoId ?? 0,
      title: taskData.title ?? '',
      uploadType: taskData.isOriginal === 1 ? '0' : '2',
      statementType: taskData.statementType ? taskData.statementType.toString() : '',
      description: desc ?? '',
      carModelList: [],
      motorRelationList: [],
      relatedActivityIds: '',
      hotTopicIds: taskData.topics?.length ? taskData.topics.map((item) => item.yixiaoerId).join(',') : '',
      creaters: [],
      videoType: taskData.videoType?.length ? taskData.videoType.join(',') : '',
      programId: '',
      timePublishFlag: taskData.publishTime ? 1 : 0,
      timePublishTime: taskData.publishTime ? dayjs(taskData.publishTime).format('YYYY-MM-DD HH:mm:ss') : '',
      checkTimerPubTime: !!taskData.publishTime,
      recodeNum: taskData.recodeNum ?? '',
      templateType: 0,
      cityId: '',
      cityName: '',
      auditTagList: '',
      coverImageUrl: coverInfo.data.imgKey,
      verticalCoverImageUrl: verticalCoverImage,
      imgKeys: imgKeys.join(','),
      relateVideoId: taskData.relateVideoId ?? '',
      relateTime: taskData.relateTime ?? '',
      qualityLabel: [],
      shared: taskData.allowForward === false ? '0' : '1',
      autoVerticalCover: verticalCoverImage ? 0 : 1,
      coverWidth: coverInfo.data.width ?? taskData.cover.width,
      coverHeight: coverInfo.data.height ?? taskData.cover.height,
      verticalCoverWidth: verticalCoverInfo?.data?.width ?? taskData.verticalCover?.width ?? 0,
      verticalCoverHeight: verticalCoverInfo?.data?.height ?? taskData.verticalCover?.height ?? 0,
      businessTaskInfo: {},
      pubPointList: [],
      actionType: 0,
      fileId: videoInfo.fileId ?? videoInfo.uploadId,
    },
  };

  re.sign = buildYiCheHaoVideoSign(re);
  return JSON.stringify(re);
};
