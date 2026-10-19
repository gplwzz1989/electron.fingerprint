import fs from 'fs';
import { BaseResult } from '../baseResult';
import { errorCode } from '../errorCode';
import {
  GetMD5ByPathLike,
  Guid,
  htmlDecode,
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
import { HtmlDocument } from '@/htmlAgilityPack';
import { getAuthInfoAsync, getPersonalAccessTokenAsync, TengxunweishiAuthInfo } from './tengxunweishi-user.service';
import {
  finishWeishiUpload,
  getWeishiVideoAuthAcc,
  getWeishiVideoUploadArgs,
  publishWeishiVideoResponse,
  uploadVideoCover,
  uploadWeishiVideoPart,
  WeiShiUploadArgs,
  WeishiUploadResponse,
} from './tengxunweishi-video.service';
import path from 'path';
import { WeishiTopicInfo } from './tengxunweishi-topic.service';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '@/media-platform/webproxy';
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
 * @param authInfo
 */
const uploadVideo = async (
  taskData: WeishiVideoTaskInput,
  eventCallback: EventEmitter,
  fileStat: fs.Stats,
  uploadArgsOut: { node: WeiShiUploadArgs },
  pubResult: WeishiPublishResultOutput,
  maxThread: number,
  cookie: string,
  authInfo: TengxunweishiAuthInfo,
): Promise<WeiShiUploadArgs | null | undefined> => {
  let fileHandle: fs.promises.FileHandle | null = null;
  try {
    //获取上传token
    const authAccInfo = await getWeishiVideoAuthAcc(cookie, fileStat.size, authInfo);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (authAccInfo?.code != 0) {
      // console.debug('获取视频上传token失败', taskData.taskId, authAccInfo);
      pubResult.code = authAccInfo.code;
      pubResult.msg = `获取视频上传token失败${authAccInfo?.msg}`;
      return null;
    }

    //获取上传参数
    // const fileLength = fileStat.size;
    const uploadArgs = await getWeishiVideoUploadArgs(cookie, authAccInfo);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!uploadArgs?.fileId) {
      // console.debug('获取视频上传参数失败', taskData.taskId, uploadArgs);
      pubResult.code = -1;
      pubResult.msg = uploadArgs?.msg ? uploadArgs?.msg : '获取视频上传参数失败';
      return null;
    }

    uploadArgsOut.node = uploadArgs;
    // 获取文件句柄
    fileHandle = await fs.promises.open(taskData.video.localPath, 'r');

    // 准备上传分片信息列表
    const uploadedList: Map<number, string> = new Map<number, string>();

    // 开始读取并上传文件
    let readIndex = 0;

    // 分片大小 8M
    const blockSize = 2097152;
    //总片数
    const totalPartNums = Math.ceil(fileStat.size / blockSize);

    // 并行上传
    const tasks: Array<Promise<WeishiUploadResponse>> = [];
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
        const uploadResult = await uploadWeishiVideoPart(
          cookie,
          readData.buffer,
          1,
          uploadArgs,
          authAccInfo,
          uploadedList,
        );

        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);

        if (!uploadResult?.partSha) {
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

        let canReadNum = blockSize;
        let buffer = Buffer.alloc(blockSize);
        if (readIndex + blockSize > fileStat.size) {
          canReadNum = fileStat.size - readIndex;
          buffer = Buffer.alloc(canReadNum);
        }

        const readData = await fileHandle.read(buffer, 0, canReadNum, readIndex);
        if (readData.buffer.length > 0) {
          tasks.push(uploadWeishiVideoPart(cookie, readData.buffer, partNum, uploadArgs, authAccInfo, uploadedList));

          if (tasks.length > maxThread) {
            const uploadResult = await Promise.race(tasks);

            if (!uploadResult?.partSha) {
              // console.debug('视频分片上传失败', taskData.taskId, uploadResult);
              pubResult.msg = `视频分片上传失败${uploadResult?.msg ?? ''}`;
              pubResult.code = errorCode.data_error;
              return null;
            }

            //去除第一个任务，并等待完成
            const uploadResultNew = await tasks.splice(0, 1)[0];

            if (!uploadResultNew?.partSha) {
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

      if (!uploadResult?.partSha) {
        // console.debug('视频分片上传失败', taskData.taskId, uploadResult);
        pubResult.msg = `视频分片上传失败${uploadResult?.msg ?? ''}`;
        pubResult.code = errorCode.data_error;
        return null;
      }
      onPartUploaded();
    }

    //视频上传完成
    const finishResult = await finishWeishiUpload(cookie, uploadArgs, uploadedList);

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

    uploadArgs.ms5 = await GetMD5ByPathLike(taskData.video.localPath);
    uploadArgs.sha1 = await GetMD5ByPathLike(taskData.video.localPath, 'sha1');
    pubResult.code = 0;
    pubResult.msg = '';
    return uploadArgs;
    // endregion
  } catch (e) {
    logger.error(`微视视频上传异常失败，${taskData.taskId},${(e as Error)?.message}`);
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
export const publishWeishiVideo = async (
  cookie: string,
  taskData: WeishiVideoTaskInput,
  eventCallback: EventEmitter,
  maxThreadOut: number = 3,
  retryTimes: number = 3,
): Promise<WeishiPublishResultOutput> => {
  logger.info(`微视视频发布 ${taskData.taskId}`);
  const pubResult: WeishiPublishResultOutput = {
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

    //尝试刷新token，微信登录的需要
    const accToken = await getPersonalAccessTokenAsync(cookie);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (accToken) {
      cookie = accToken;
    }

    const userAuthInfo = await getAuthInfoAsync(cookie);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!userAuthInfo.data?.personid) {
      // console.debug('获取用户信息失败', cookie, taskData.taskId, userAuthInfo);
      pubResult.code = errorCode.io_error;
      pubResult.msg = userAuthInfo?.errorMsg ?? '获取用户信息失败';
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

    const uploadArgs: WeiShiUploadArgs = { code: 0, msg: '' };
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
      userAuthInfo,
    );
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      if (!uploadedVideoInfo?.sha1) {
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
    if (!uploadedVideoInfo?.sha1) {
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
    let imageResult = await uploadVideoCover(cookie, imageData.data, fileName);
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      // 判断封面是否上传成功
      if (!imageResult?.rsp_body?.pic_cdn_url) {
        // console.debug('封面上传失败', taskData.taskId, taskData?.cover?.pathOrUrl, imageResult);
        if (i < retryTimes - 1) {
          imageResult = await await uploadVideoCover(cookie, imageData.data, fileName);
          continue;
        }
        pubResult.code = errorCode.data_error;
        pubResult.msg = `封面上传失败:${taskData.cover.pathOrUrl}` + (imageResult?.rsp_header?.errMsg ?? '');
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
    if (!imageResult?.rsp_body?.pic_cdn_url) {
      pubResult.code = errorCode.data_error;
      pubResult.msg = `封面上传失败:${taskData.cover.pathOrUrl}` + (imageResult?.rsp_header?.errMsg ?? '');
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
    const postData = buildPostData(
      userAuthInfo,
      taskData,
      uploadArgsIn.node,
      videoFileName,
      taskData.video.size,
      imageResult.rsp_body.pic_cdn_url,
    );

    // 组装发布数据

    // console.debug('微视视频推送数据', taskData.taskId, cookie, postData);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);

    // 推送数据
    const publishResult = await publishWeishiVideoResponse(cookie, postData, webProxy);
    // console.debug('微视视频推送返回数据', taskData.taskId, publishResult);

    pubResult.code = publishResult?.code ?? errorCode.data_error;
    pubResult.msg = publishResult?.msg ?? '';
    pubResult.publishId = uploadArgsIn.node.videoId;

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
      logger.error(`微视视频发布失败 ${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(publishResult)}`);
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
    logger.error(`微视视频发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};

export interface WeishiPublishResultOutput extends BaseResult {
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

export interface WeishiVideoTaskInput extends ITask {
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
   * 可见类型 0：公开 1：自己可见
   */
  visibleType?: 0 | 1;

  /**
   * 话题列表
   */
  topics?: Array<WeishiTopicInfo>;

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}

/**
 * 组装发布数据
 * @param userAuthInfo
 * @param taskData  任务数据
 * @param uploadArgs
 * @param fileName
 * @param fileSize
 * @param coverUrl
 */
const buildPostData = (
  userAuthInfo: TengxunweishiAuthInfo,
  taskData: WeishiVideoTaskInput,
  uploadArgs: WeiShiUploadArgs,
  fileName: string,
  fileSize: number,
  coverUrl: string,
): string => {
  const re = {};
  re['personId'] = userAuthInfo.data.personid;
  re['videoItemList'] = [];
  const videoItemList = {};

  let descStr = taskData?.desc?.toString() ?? '';
  //话题，兼容描述中嵌入话题和单独设置话题
  if (taskData.desc?.includes('<p') && taskData.desc?.includes('</p>')) {
    taskData.topics = [];
    //从描述中解析话题出来
    const html = new HtmlDocument();
    html.LoadHtml(taskData.desc);

    const pList = html.DocumentNode.SelectNodes('//p');
    if (pList?.length > 0) {
      //话题
      const topics = html.DocumentNode.SelectNodes('//topic');
      if (topics?.length > 0) {
        for (const item of topics) {
          const topicStr = htmlDecode(item.getAttribute('raw') ?? '');
          if (!topicStr?.startsWith('{')) {
            continue;
          }
          item.textContent = '';
          const topicItem = JSON.parse(topicStr);
          taskData.topics.push(topicItem);
        }
      }

      //换行
      let newText = '';
      for (let pIndex = 0; pIndex < pList.length; pIndex++) {
        const pItem = pList[pIndex];
        newText = `${newText}${pItem.textContent}\n`;
      }

      descStr = htmlDecode(newText);
      videoItemList['desc'] = descStr;
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
          taskData.topics.push(topicItem);
        }
      }
      videoItemList['desc'] = htmlDecode(html.DocumentNode.InnerText());
    }
  } else {
    videoItemList['desc'] = descStr;
  }

  //话题
  if (taskData.topics?.length) {
    //话题之间需要加空格
    for (const item of taskData.topics) {
      if (item?.id) {
        videoItemList['topic'] = {};
        videoItemList['topic']['id'] = item?.id ?? '';
        videoItemList['topic']['name'] = item?.name ?? '';
      }
    }
  }

  videoItemList['trackId'] = '';
  videoItemList['key'] = Guid.NewGuid();
  videoItemList['syncToOm'] = 0;
  videoItemList['uid'] = `f${Date.now()}08923611169268544`;
  videoItemList['video'] = {};
  videoItemList['video']['duration'] = parseInt(
    ((taskData?.video?.duration ? taskData?.video?.duration : 100) * 1000).toFixed(0),
  );
  videoItemList['video']['fileId'] = uploadArgs.fileId;
  videoItemList['video']['fileName'] = fileName;
  videoItemList['video']['fileSize'] = fileSize;
  videoItemList['video']['height'] = taskData.video?.height ?? 1080;
  videoItemList['video']['orientation'] = 0;
  videoItemList['video']['isH265Hvc1'] = 0;
  videoItemList['video']['md5'] = uploadArgs.ms5;
  videoItemList['video']['fileId'] = uploadArgs.videoId;
  videoItemList['video']['sha1'] = uploadArgs.sha1;
  videoItemList['video']['width'] = taskData.video.width ?? 1920;
  videoItemList['visibleType'] = 0; //0公开 1自己可见
  videoItemList['wording'] = descStr ?? '';
  //定时发布
  if (taskData.publishTime) {
    videoItemList['isPrePub'] = true;
    videoItemList['prePublishTs'] = parseInt((taskData.publishTime / 1000).toFixed(0));
  } else {
    videoItemList['isPrePub'] = false;
    videoItemList['prePublishTs'] = 0;
  }
  const imgList: Array<{ height?: number; width?: number; url?: string }> = [];
  const cover: { height?: number; width?: number; url?: string } = {};
  cover['height'] = taskData.cover?.height > 0 ? taskData.cover?.height : 1080;
  cover['width'] = taskData.cover?.width > 0 ? taskData.cover.width : 1920;
  cover['url'] = coverUrl ?? '';
  taskData['coverUrl'] = coverUrl ?? '';
  imgList.push(cover);
  videoItemList['imgList'] = imgList;
  re['videoItemList'].push(videoItemList);

  const reStr = {};
  reStr['data'] = JSON.stringify(re);
  return JSON.stringify(reStr);
};
