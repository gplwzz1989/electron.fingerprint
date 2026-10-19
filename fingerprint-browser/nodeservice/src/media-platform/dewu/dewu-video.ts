import { CancelToken, privateKey } from '../../utils/CancelToken';
import {
  Guid,
  htmlDecode,
  logger,
  publishStatusEnum,
  readImageData,
  SetProgressEvent,
  SetProgressNewEvent,
  stepWaitTime,
  Task,
  UploadEmitGate,
} from '../../utils';

import { HtmlDocument } from '../../htmlAgilityPack';
import {
  getImageUploadKeyResponse,
  getUploadArgsResponse,
  getUploadedVideoEtag,
  getVideoUploadKeyResponse,
  getUploadObjectUrl,
  publish,
  UploadArgsResponse,
  uploadImagePart,
  uploadVideoPart,
} from './dewu-video.service';
import { EventEmitter } from 'events';
import fs from 'fs';
import { errorCode } from '../../media-platform/errorCode';
import { BaseResult } from '../../media-platform/baseResult';
import crypto from 'crypto';
import * as buffer from 'buffer';
import { AxiosError } from 'axios';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { ListItemInfo } from '@/media-platform';
import { PositionItem } from './dewu-location.service';
import { getDeWuUserInfo } from '@/media-platform/dewu/dewu-common';
import { DeWuGoodsInfo } from '@/media-platform/dewu/dewu-shop.service';
import { ITask } from '@/media-platform/baseTask';

export const uploadVideo = async (
  taskData: DeWuVideoTaskInput,
  eventCallback: EventEmitter,
  pubResult: DeWuPublishVideoResultOutput,
  fileStat: fs.Stats,
  maxThread: number,
  cookie: string,
  authorId?: string,
): Promise<UploadArgsResponse | null | undefined> => {
  let fileHandle: fs.promises.FileHandle | null = null;
  try {
    const fileName = `${authorId}_${Guid.NewGuid().toString()}_${Date.now() + 10000}_w451h602.mp4`;
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    const uploadArgs = await getVideoUploadKeyResponse(cookie, fileName, 'mp4', {
      byte: fileStat.size,
      w: 0,
      h: 0,
      fileExtension: 'mp4',
    });

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    //提取上传key参数
    if (!uploadArgs?.data?.securityToken) {
      // console.debug('获取视频上传参数失败', taskData.taskId, uploadArgs);
      pubResult.code = uploadArgs?.code ?? errorCode.data_error;
      pubResult.msg = '获取视频上传参数失败:' + (uploadArgs?.msg ?? '');
      return null;
    }

    //SetProgressEvent(eventCallback, 5, '正在获取上传参数', taskData.taskId);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    //获取上传id
    const uploadIdResponse = await getUploadArgsResponse(cookie, uploadArgs);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!uploadIdResponse?.includes('UploadId')) {
      // console.debug('获取上传ID失败', taskData.taskId, uploadIdResponse);
      pubResult.code = errorCode.data_error;

      if (uploadIdResponse?.startsWith('{')) {
        const uploadIdError = JSON.parse(uploadIdResponse);
        pubResult.msg = `获取上传ID失败:${uploadIdError?.msg ?? ''}`;
      } else {
        pubResult.msg = `获取上传ID失败:${uploadIdResponse}`;
      }
      pubResult.errorInfo = uploadIdResponse;

      return null;
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //提取上传id
    const uploadId = uploadIdResponse.split('<UploadId>')[1].split('<')[0];

    // 获取文件句柄
    fileHandle = await fs.promises.open(taskData.video.localPath, 'r');

    // 准备上传分片信息列表
    const uploadedList: Map<number, string> = new Map<number, string>();

    // 开始读取并上传文件
    let readIndex = 0;

    // 分片大小 5M
    const blockSize = 1048576;
    //总片数
    const totalPartNums = Math.ceil(fileStat.size / blockSize);

    //并行上传
    const tasks: Array<Promise<{ partNum: number; msg: string }>> = [];

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
      const buffer = Buffer.alloc(fileStat.size);
      const readData = await fileHandle.read(buffer, 0, fileStat.size, readIndex);
      if (readData.buffer.length > 0) {
        const uploadResult = await uploadVideoPart(readData.buffer, 1, uploadArgs, uploadId);

        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);

        if (!uploadResult?.msg || uploadResult?.msg?.startsWith('{')) {
          // console.debug('视频分片上传失败', taskData.taskId, uploadResult);
          if (uploadResult?.msg?.startsWith('{')) {
            const errorJo = JSON.parse(uploadResult.msg);
            pubResult.msg = `视频分片1上传失败${errorJo?.msg ?? ''}`;
          } else {
            pubResult.msg = '视频分片1上传失败';
          }
          pubResult.code = errorCode.data_error;

          return null;
        }
        uploadedList.set(1, uploadResult.msg);
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
          tasks.push(uploadVideoPart(readData.buffer, partNum, uploadArgs, uploadId));
          //取消任务执行
          taskData.cancelToken?.throwIfCancelled(privateKey);
          if (tasks.length > maxThread) {
            const uploadResult = await Promise.race(tasks);

            if (!uploadResult?.msg || uploadResult?.msg?.startsWith('{')) {
              // console.debug(`视频分片${uploadResult.partNum}上传失败`, taskData.taskId, uploadResult);
              if (uploadResult?.msg?.startsWith('{')) {
                const errorJo = JSON.parse(uploadResult.msg);
                pubResult.msg = `视频分片${uploadResult.partNum}上传失败${errorJo?.msg ?? ''}`;
              } else {
                pubResult.msg = '视频分片上传失败';
              }
              pubResult.code = errorCode.data_error;

              return null;
            }
            uploadedList.set(uploadResult.partNum, uploadResult.msg);

            //去除第一个任务，如果并等待完成
            const uploadResultNew = await tasks.splice(0, 1)[0];

            if (!uploadResultNew?.msg || uploadResultNew?.msg?.startsWith('{')) {
              // console.debug(`视频分片${uploadResultNew.partNum}上传失败`, taskData.taskId, uploadResultNew);
              if (uploadResultNew?.msg?.startsWith('{')) {
                const errorJo = JSON.parse(uploadResultNew.msg);
                pubResult.msg = `视频分片${uploadResultNew.partNum}上传失败${errorJo?.msg ?? ''}`;
              } else {
                pubResult.msg = '视频分片上传失败';
              }
              pubResult.code = errorCode.data_error;

              return null;
            }
            uploadedList.set(uploadResultNew.partNum, uploadResultNew.msg);
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

      if (!uploadResult?.msg || uploadResult?.msg?.startsWith('{')) {
        // console.debug(`视频分片${uploadResult.partNum}上传失败`, taskData.taskId, uploadResult);
        if (uploadResult?.msg?.startsWith('{')) {
          const errorJo = JSON.parse(uploadResult.msg);
          pubResult.msg = `视频分片${uploadResult.partNum}上传失败${errorJo?.msg ?? ''}`;
        } else {
          pubResult.msg = '视频分片上传失败';
        }
        pubResult.code = errorCode.data_error;

        return null;
      }
      uploadedList.set(uploadResult.partNum, uploadResult.msg);
      onPartUploaded();
    }
    // SetProgressEvent(eventCallback, 81, '视频上传完成', taskData.taskId);

    if (uploadedList.size < totalPartNums) {
      // console.debug('视频部分上传失败', taskData.taskId, uploadedList);
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
    // SetProgressEvent(eventCallback, 82, '上传完成校验中', taskData.taskId);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // 检查视频上传是否成功,并获取上传完成的视频信息
    const uploadedVideoInfo = await getUploadedVideoEtag(uploadArgs, uploadId, uploadedList);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // SetProgressEvent(eventCallback, 85, '获取上传完成视频信息', taskData.taskId);
    if (uploadedVideoInfo?.includes('<Error>')) {
      // console.debug('视频上传校验失败', taskData.taskId, uploadedList, uploadedVideoInfo);
      pubResult.code = -1;
      pubResult.msg = '上传校验失败:' + (uploadedVideoInfo?.split('<Error>')[1].split('<')[0] ?? '');
      return null;
    }
    pubResult.code = 0;
    pubResult.msg = '';
    return uploadArgs;
    // endregion
  } catch (e) {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    console.error('得物视频上传失败', taskData.taskId, e);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = '视频上传失败';
    return null;
  } finally {
    fileHandle?.close();
  }
};

export const uploadCoverProcess = async (
  taskData: DeWuVideoTaskInput,
  eventCallback: EventEmitter,
  cookie: string,
  pubResult: DeWuPublishVideoResultOutput,
  authorId: string,
): Promise<UploadArgsResponse | null | undefined> => {
  try {
    SetProgressEvent(eventCallback, 90, '封面上传中', taskData.taskId);

    //读取图片数据
    const imageData = await readImageData(taskData.cover.pathOrUrl, 'jpeg');

    if (!imageData?.data?.length) {
      pubResult.msg = '读取图片失败';
      pubResult.code = errorCode.io_error;
      return null;
    }

    taskData.cancelToken?.throwIfCancelled(privateKey);

    const fileMd5 = crypto
      .createHash('md5')
      .update(buffer.Buffer.from(imageData.data ?? ''))
      .digest('hex');

    const fileName = `${authorId}_${fileMd5}_${Date.now()}_w451h602.png`;
    //获取图片上传参数
    const uploadCoverArgs = await getImageUploadKeyResponse(cookie, fileName, 'png', {
      byte: imageData.data.length,
      w: taskData.cover.width ?? 0,
      h: taskData.cover.height ?? 0,
      fileExtension: '.png',
    });
    taskData.cancelToken?.throwIfCancelled(privateKey);

    //提取图片上传参数
    if (!uploadCoverArgs?.data?.signature) {
      // console.debug('获取图片上传参数失败', taskData.taskId, uploadCoverArgs);
      pubResult.code = uploadCoverArgs?.code ?? errorCode.data_error;
      pubResult.msg = '获取图片上传参数失败:' + (uploadCoverArgs?.msg ?? '');
      return null;
    }

    const imageResult = await uploadImagePart(imageData.data, uploadCoverArgs, 'png', fileName);
    if (imageResult?.length > 34 || imageResult?.length < 32) {
      pubResult.msg = '封面上传失败';
      pubResult.code = errorCode.io_error;
      return null;
    }
    //上传图片数据，返回上传成功的图片url

    taskData.cancelToken?.throwIfCancelled(privateKey);
    pubResult.code = 0;
    pubResult.msg = '';
    return uploadCoverArgs;
    //endregion
  } catch (e) {
    taskData.cancelToken?.throwIfCancelled(privateKey);
    console.error('封面上传失败', taskData.taskId, e);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = '封面上传失败';
    return null;
  }
};

/**
 * 发布得物书视频
 * @param cookie
 * @param taskData 视频发布任务体
 * @param eventCallback 事件回调
 * @param maxThread 最大并发上传数
 * @param retryTimes 最大重试次数
 */
export const publishDeWuVideo = async (
  cookie: string,
  taskData: DeWuVideoTaskInput,
  eventCallback: EventEmitter,
  maxThread: number = 3,
  retryTimes: number = 3,
): Promise<DeWuPublishVideoResultOutput> => {
  logger.info(`得物视频发布 ${taskData.taskId}`);
  const pubResult: DeWuPublishVideoResultOutput = {
    code: 0,
    msg: '',
    taskId: taskData.taskId,
  };
  try {
    let authorId = taskData['auhtorId'];
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploading, '开始发布', taskData.taskId);
    if (!fs.existsSync(taskData.video.localPath?.toString() ?? '')) {
      pubResult.code = errorCode.io_error;
      pubResult.msg = '视频文件不存在:' + taskData.video.localPath;
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
    if (!authorId) {
      const userInfo = await getDeWuUserInfo(cookie);
      if (userInfo?.yixiaoerId) {
        authorId = userInfo.yixiaoerId;
      } else {
        pubResult.code = userInfo?.code ?? -1;
        pubResult.msg = userInfo?.msg;
        return pubResult;
      }
    }
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // region 获取发布前置准备参数
    //获取文件信息
    const fileStat = await fs.promises.stat(taskData.video.localPath);
    taskData.video.size = fileStat.size;

    SetProgressEvent(eventCallback, 3, '正在获取上传参数', taskData.taskId);

    // endregion
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // region 视频上传
    let uploadedVideoArgs = await uploadVideo(
      taskData,
      eventCallback,
      pubResult,
      fileStat,
      maxThread,
      cookie,
      authorId,
    );
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      if (!uploadedVideoArgs?.data?.filePath) {
        if (i < retryTimes - 1 && pubResult?.code != -100) {
          SetProgressEvent(eventCallback, 4, '上传失败,重试中', taskData.taskId);
          uploadedVideoArgs = await uploadVideo(
            taskData,
            eventCallback,
            pubResult,
            fileStat,
            maxThread,
            cookie,
            authorId,
          );
          continue;
        }
        pubResult.code = pubResult?.code ?? errorCode.data_error;
        pubResult.msg = pubResult?.msg ?? '视频上传失败';
        logger.error(`视频上传失败 ${taskData.taskId} ${cookie} ${uploadedVideoArgs} ${JSON.stringify(pubResult)}`);
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
    if (!uploadedVideoArgs?.data?.filePath) {
      pubResult.code = pubResult?.code ?? errorCode.data_error;
      pubResult.msg = pubResult?.msg ?? '视频上传失败';
      logger.error(`视频上传失败 ${taskData.taskId} ${cookie} ${uploadedVideoArgs} ${JSON.stringify(pubResult)}`);
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult?.msg ? pubResult.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }
    //endregion

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // region 封面上传
    let coverUrl = await uploadCoverProcess(taskData, eventCallback, cookie, pubResult, authorId);
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      if (!coverUrl?.data?.filePath) {
        await Task.Delay(stepWaitTime);
        coverUrl = await uploadCoverProcess(taskData, eventCallback, cookie, pubResult, authorId);
      } else {
        break;
      }
    }
    if (!coverUrl?.data?.filePath) {
      pubResult.code = pubResult?.code ?? errorCode.data_error;
      pubResult.msg = pubResult?.msg ?? '封面上传失败';
      logger.error(
        `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${JSON.stringify(pubResult)}`,
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
    // endregion
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    // region 组装并推送数据
    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    const postData = buildPublishPostData(taskData, coverUrl, uploadedVideoArgs);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);
    //组装发布数据
    // console.debug('得物视频推送数据', taskData.taskId, cookie, postData);

    const publishResult = await publish(cookie, postData, webProxy);
    // console.debug('得物视频推送返回数据', taskData.taskId, cookie, publishResult);

    pubResult.code = publishResult?.code === 200 ? 0 : publishResult?.code === 0 ? -1 : publishResult?.code;
    pubResult.msg = publishResult?.msg ?? '';
    pubResult.publishId = publishResult?.data?.TrendId?.toString();
    if (pubResult.code == 0 && pubResult.publishId) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送成功', taskData.taskId);
      //SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      pubResult.msg = `发布失败${publishResult?.msg ?? publishResult['message'] ?? ''}`;
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      //SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
      logger.error(`得物视频发布失败 ${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(publishResult)}`);
    }

    return pubResult;
    // endregion
  } catch (e) {
    //SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
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
    logger.error(`得物视频发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};

export interface DeWuPublishVideoResultOutput extends BaseResult {
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

export interface DeWuVideoTaskInput extends ITask {
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
   *  描述
   */
  desc: string;

  /**
   * 标题
   */
  title?: string;

  /**
   * 地理位置
   */
  location?: ListItemInfo;

  /**
   * 0:公开
   * 1：私密
   */
  visibleType?: 0 | 1;
  /**
   * 话题
   */
  // topics: Array<ZhihuTopicInfo>;

  /**
   * 申明来源
   * 0:不不添加自主声明
   * 1：内容由AI生成
   * 2：内容不含营销推广属性
   * 3：内容涉及专业运动
   * 4：剧情演绎，仅供娱乐
   */
  userClaim?: 0 | 1 | 2 | 3 | 4;

  /**
   * 商品
   */
  goodsList?: Array<ListItemInfo>;

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}

export const buildPublishPostData = (
  taskData: DeWuVideoTaskInput,
  coverUrl: UploadArgsResponse,
  videoInfo: UploadArgsResponse,
): string => {
  let descStr = taskData.desc?.toString() ?? '';
  if (descStr?.includes('<p') && descStr?.includes('</p>')) {
    const html = new HtmlDocument();
    html.LoadHtml(descStr);

    const pList = html.DocumentNode.SelectNodes('//p');
    if (pList?.length > 0) {
      //话题
      const topics = html.DocumentNode.SelectNodes('//topic');
      if (topics?.length > 0) {
        let topicNum = 0;
        for (const item of topics) {
          if (topicNum >= 4) {
            item.parentNode?.removeChild(item);
            continue;
          }
          const topicStr = htmlDecode(item.getAttribute('raw') ?? '');
          if (!topicStr?.startsWith('{')) {
            const text = item.getAttribute('text');
            item.textContent = ` #${text}`;
            continue;
            // const topicsTmp = await getKuaishouTopic(cookie, text ?? '');
            // if (topicsTmp?.data?.tags?.length) {
            //   topicStr = JSON.stringify(topicsTmp.data.tags[0].tag);
            // } else {
            //   continue;
            // }
          }
          topicNum++;
          const topicJo = JSON.parse(topicStr);
          item.textContent = ` #${topicJo.name ?? topicJo?.tag?.name} `;
        }
      }

      //换行
      let newText = '';
      for (let pIndex = 0; pIndex < pList.length; pIndex++) {
        const pItem = pList[pIndex];
        newText = `${newText}${pItem.textContent}\n`;
      }
      descStr = htmlDecode(newText);
    }
  }
  const re = {
    coverUrl: getUploadObjectUrl(coverUrl),
    videoUrl: getUploadObjectUrl(videoInfo),
    //好友
    atUserList: [],
    //话题
    sharpInfo: [
      // { id: 8656, name: '动漫', type: 5, position: 0 },
      // { id: 3954, name: '二次元', type: 5, position: 1 },
    ],
    //videoPosition: [{ productId: 25873323, propertyId: 776808111 }],
    videoResourceId: videoInfo.data.resourceId,
    coverResourceId: coverUrl.data.resourceId,
    title: taskData.title ?? '',
    content: descStr,
    //位置
    //geo: { title: '天府广场', lat: '30.657372', lng: '104.065901' },
    userShowStatus: taskData?.visibleType ?? 0, //0公开 1私密
    videoDuration: (taskData.video.duration ? taskData?.video?.duration : 12) * 1000,
  };
  //申明
  if (taskData.userClaim) {
    re['userClaim'] = taskData.userClaim?.toString();
  }

  //地理位置
  if (taskData?.location?.yixiaoerId) {
    const location = taskData?.location?.raw as PositionItem;
    re['geo'] = { title: taskData.location.yixiaoerName, lat: location.lat, lng: location.lng };
  }

  //商品
  if (taskData.goodsList?.length) {
    const goods = taskData.goodsList.map((x) => x.raw as DeWuGoodsInfo);
    const goodslist = [];
    goods.forEach((x) => {
      goodslist.push({ productId: x.productId, propertyId: x.propertyId } as never);
    });
    re['videoPosition'] = goodslist;
  }
  return JSON.stringify(re);
};
