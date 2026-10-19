import {
  getUploadArgsResponse,
  getUploadIdResponse,
  pushWangyiVideo,
  UploadArgsResponse,
  uploadVideoCover,
  uploadVideoFinishResponse,
  uploadVideoPart,
} from '../wangyihao/wangyihao-video.service';
import { EventEmitter } from 'events';
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
import { getWangyihaoUserInfo } from '../wangyihao/wangyihao-common';
import { AxiosError } from 'axios';
import { WangyiVideoTopicInfo } from '../wangyihao/wangyihao-topic.service';
import path from 'path';
import { WangyiVideoCategory } from '../wangyihao';
import XMLWriter from 'xml-writer';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { CancelToken, privateKey } from '@/utils/CancelToken';
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
 */
const uploadVideo = async (
  taskData: WangyiVideoTaskInput,
  eventCallback: EventEmitter,
  fileStat: fs.Stats,
  pubResult: WangyiPublishResultOutput,
  maxThread: number,
  cookie: string,
): Promise<UploadArgsResponse | null | undefined> => {
  let fileHandle: fs.promises.FileHandle | null = null;
  try {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    //获取上传参数
    let uploadArgs = await getUploadArgsResponse(cookie, path.basename(taskData.video.localPath));

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (!uploadArgs?.url) {
      uploadArgs = await getUploadArgsResponse(cookie, path.basename(taskData.video.localPath));
    }

    if (!uploadArgs?.url) {
      //logger.error(`获取视频上传参数失败${taskData.taskId} ${cookie} ${JSON.stringify(uploadArgs)}`);
      pubResult.code = -1;
      pubResult.msg = '获取视频上传参数失败';
      return null;
    }
    //SetProgressEvent(eventCallback, 5, '正在获取上传参数', taskData.taskId);

    let uploadIdStr = await getUploadIdResponse(cookie, uploadArgs);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (!uploadIdStr?.includes('<UploadId>')) {
      uploadIdStr = await getUploadIdResponse(cookie, uploadArgs);
    }

    if (!uploadIdStr?.includes('<UploadId>')) {
      logger.error(`获取视频上传id失败${taskData.taskId} ${cookie} ${JSON.stringify(uploadIdStr)}`);
      pubResult.code = -1;
      pubResult.msg = '获取视频上传id失败';
      return null;
    }
    uploadArgs.uploadId = uploadIdStr.split('<UploadId>')[1].split('<')[0];

    // 获取文件句柄
    fileHandle = await fs.promises.open(taskData.video.localPath, 'r');

    // 准备上传分片信息列表
    const uploadedList = new Map<number, string>();
    const uploadedStr = '';

    // 开始读取并上传文件
    let readIndex = 0;

    // 分片大小 8M
    const blockSize = 3145728;
    //总片数
    const totalPartNums = Math.ceil(fileStat.size / blockSize);

    // 并行上传
    const tasks: Array<Promise<string>> = [];

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
        const uploadResult = await uploadVideoPart(readData.buffer, 1, uploadArgs);

        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);

        if (uploadResult?.startsWith('_')) {
          // console.debug('视频分片上传失败', taskData.taskId, uploadResult);
          pubResult.msg = '视频分片上传失败';
          pubResult.code = errorCode.data_error;

          return null;
        }
        const upSplit = uploadResult.split('_');
        uploadedList.set(parseInt(upSplit[0]), upSplit[1]);
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
          tasks.push(uploadVideoPart(readData.buffer, partNum, uploadArgs));

          if (tasks.length > maxThread) {
            const uploadResult = await Promise.race(tasks);

            if (uploadResult?.startsWith('_')) {
              // console.debug('视频分片上传失败', taskData.taskId, uploadResult);
              if (uploadResult?.startsWith('{')) {
                const reJo = JSON.parse(uploadResult);
                pubResult.msg = reJo['msg'] ?? '视频上传失败';
                pubResult.code = reJo['code'] ?? errorCode.data_error;
              } else {
                pubResult.msg = '视频分传失败';
                pubResult.code = errorCode.data_error;
              }
              //logger.error(`视频分片上传失败 ${taskData.taskId} ${JSON.stringify(uploadResult)}`);
              return null;
            }
            let upSplit = uploadResult.split('_');
            uploadedList.set(parseInt(upSplit[0]), upSplit[1]);

            //去除第一个任务，并等待完成
            const uploadResultNew = await tasks.splice(0, 1)[0];

            if (uploadResultNew?.startsWith('_')) {
              // console.debug('视频分片上传失败', taskData.taskId, uploadResultNew);
              if (uploadResultNew?.startsWith('{')) {
                const reJo = JSON.parse(uploadResultNew);
                pubResult.msg = reJo['msg'] ?? '视频上传失败';
                pubResult.code = reJo['code'] ?? errorCode.data_error;
              } else {
                pubResult.msg = '视频分传失败';
                pubResult.code = errorCode.data_error;
              }
              //logger.error(`视频分片上传失败 ${taskData.taskId} ${JSON.stringify(uploadResult)}`);
              return null;
            }
            upSplit = uploadResultNew.split('_');
            uploadedList.set(parseInt(upSplit[0]), upSplit[1]);
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

      if (uploadResult?.startsWith('_')) {
        // console.debug('视频分片上传失败', taskData.taskId, uploadResult);
        if (uploadResult?.startsWith('{')) {
          const reJo = JSON.parse(uploadResult);
          pubResult.msg = reJo['msg'] ?? '视频上传失败';
          pubResult.code = reJo['code'] ?? errorCode.data_error;
        } else {
          pubResult.msg = '视频分传失败';
          pubResult.code = errorCode.data_error;
        }
        //logger.error(`视频分片上传失败 ${taskData.taskId} ${JSON.stringify(uploadResult)}`);
        return null;
      }
      const upSplit = uploadResult.split('_');
      uploadedList.set(parseInt(upSplit[0]), upSplit[1]);
      onPartUploaded();
    }
    if (uploadedStr.startsWith('_')) {
      // console.debug('视频上传失败', taskData.taskId, uploadedList);
      pubResult.msg = '视频上传失败';
      pubResult.code = errorCode.data_error;
      //logger.error(`视频分片上传失败 ${taskData.taskId} ${JSON.stringify(uploadedStr)}`);
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
    const xmlETag = new XMLWriter();
    xmlETag.startElement('CompleteMultipartUpload');
    for (let i = 1; i <= uploadedList.size; i++) {
      xmlETag.startElement('Part');
      xmlETag.writeElement('PartNumber', i);
      xmlETag.writeElement('ETag', uploadedList.get(i));
      xmlETag.endElement();
    }
    xmlETag.endElement();

    let uploadFinish = await uploadVideoFinishResponse(xmlETag.toString(), uploadArgs);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (uploadFinish?.includes('<Error>')) {
      uploadFinish = await uploadVideoFinishResponse(xmlETag.toString(), uploadArgs);
    }

    if (uploadFinish?.includes('<Error>')) {
      // console.debug('视频上传确认失败', taskData.taskId, uploadedList, uploadFinish);
      pubResult.code = -1;
      pubResult.msg = '视频上传确认失败';
      logger.error(`视频上传确认失败 ${taskData.taskId} ${uploadFinish}`);
      return null;
    } else {
      uploadArgs.md5 = uploadFinish.split('<ETag>')[1].split('<')[0];
    }

    pubResult.code = 0;
    pubResult.msg = '';
    return uploadArgs;
    // endregion
  } catch (e) {
    logger.error(`网易视频上传异常失败，${taskData.taskId},${(e as Error)?.message}`);
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
 * @param wemediaId 用户id
 * @param maxThreadOut 最大并发上传
 * @param retryTimes 最大重试次数
 */
export const publishWangyiVideo = async (
  cookie: string,
  taskData: WangyiVideoTaskInput,
  eventCallback: EventEmitter,
  wemediaId: string,
  maxThreadOut: number = 3,
  retryTimes: number = 3,
): Promise<WangyiPublishResultOutput> => {
  logger.info(`网易视频发布 ${taskData.taskId}`);
  const pubResult: WangyiPublishResultOutput = {
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
    //最多5个标签
    taskData.tags = taskData?.tags?.slice(0, 5);
    SetProgressEvent(eventCallback, 1, '准备上传中', taskData.taskId);
    let webProxy: HttpsProxyAgent<string> | object | undefined = undefined;
    if (taskData.proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(taskData.proxy);
    }
    if (!wemediaId) {
      const userInfo = await getWangyihaoUserInfo(cookie);
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      if (userInfo.data?.wemediaId) {
        wemediaId = userInfo.data.wemediaId;
      } else {
        pubResult.code = errorCode.io_error;
        pubResult.msg = '获取用户id失败，请传入用户id';
        logger.error(`获取用户id失败 ${taskData.taskId} ${cookie} ${JSON.stringify(userInfo)}`);
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploadFail,
          pubResult?.msg ? pubResult.msg : '上传失败',
          taskData.taskId,
        );
        return pubResult;
      }
    }
    // 获取文件信息
    const fileStat = await fs.promises.stat(taskData.video.localPath);
    taskData.video.size = fileStat.size;
    SetProgressEvent(eventCallback, 2, '正在获取上传参数', taskData.taskId);

    // region 上传视频
    let uploadedVideoInfo = await uploadVideo(taskData, eventCallback, fileStat, pubResult, maxThreadOut, cookie);
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      if (!uploadedVideoInfo?.vid) {
        if (i < retryTimes - 1 && pubResult.code != -101) {
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
    if (!uploadedVideoInfo?.vid) {
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
    }
    // endregion

    SetProgressEvent(eventCallback, 85, '获取上传完成视频信息', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // region 封面上传
    SetProgressEvent(eventCallback, 90, '封面读取中', taskData.taskId);

    // 读取图片数据
    const imageData = await readImageData(taskData.cover.pathOrUrl, 'jpeg');

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!imageData.data) {
      // console.debug('读取封面失败', cookie, taskData.taskId, taskData.cover);
      pubResult.code = errorCode.io_error;
      pubResult.msg = `读取封面失败-${taskData.cover.pathOrUrl}`;
      logger.error(`读取封面失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl}`);
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
    let imageResult = await uploadVideoCover(cookie, wemediaId, imageData.data);
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      // 判断封面是否上传成功
      if (!imageResult?.data?.url) {
        // console.debug('封面上传失败', taskData.taskId, taskData?.cover?.pathOrUrl, imageResult);
        if (i < retryTimes - 1) {
          imageResult = await uploadVideoCover(cookie, wemediaId, imageData.data);
          continue;
        }
        pubResult.code = imageResult?.code == 0 ? errorCode.data_error : imageResult.code ?? errorCode.data_error;
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
      } else {
        break;
      }
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!imageResult?.data?.url) {
      pubResult.code = imageResult?.code == 0 ? errorCode.data_error : imageResult.code ?? errorCode.data_error;
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

    //endregion
    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    const coverUrl = imageResult.data.url;

    // 组装发布数据
    const postData = buildPostData(uploadedVideoInfo, taskData, coverUrl);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // console.debug('网易视频推送数据', taskData.taskId, cookie, postData);

    // 推送数据
    //不可取消
    taskData.cancelToken?.disable(privateKey);
    const publishResult = await pushWangyiVideo(cookie, postData, wemediaId, webProxy);
    // console.debug('网易视频推送返回数据', taskData.taskId, publishResult);

    if (taskData.pubType === 0) {
      if (publishResult?.data?.includes(',')) {
        pubResult.publishId = publishResult.data.split(',')[1];
      }
      if (publishResult.code === 1) {
        SetProgressEvent(eventCallback, 100, '保存成功', taskData.taskId);
        pubResult.code = 0;
        pubResult.msg = '保存成功';
        SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送草稿成功', taskData.taskId);
      } else {
        SetProgressEvent(eventCallback, 100, '保存失败', taskData.taskId);
        pubResult.code = -1;
        pubResult.msg = publishResult?.msg ?? '保存失败';
        logger.error(
          `网易号保存失败 ${taskData.taskId} ${cookie} ${JSON.stringify(postData)} ${JSON.stringify(publishResult)}`,
        );
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.pushFail,
          pubResult?.msg ? pubResult.msg : '推送草稿失败',
          taskData.taskId,
        );
      }
      return pubResult;
    } else {
      pubResult.code = publishResult?.code === 1 ? 0 : -1;
      pubResult.msg = publishResult?.msg ?? '';
      if (publishResult?.data?.includes(',')) {
        pubResult.publishId = publishResult.data.split(',')[1];
      }

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
        logger.error(
          `网易号视频发布失败 ${taskData.taskId} ${cookie} ${JSON.stringify(postData)} ${JSON.stringify(
            publishResult,
          )}`,
        );
      }

      return pubResult;
    }
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
    logger.error(`网易号视频发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
    if (pubResult.msg?.includes('您的账号未上线')) {
      pubResult.msg = '发布失败，账号暂无发布权益，请前往官方创作者中心开通后再试。';
    }
  }

  return pubResult;
};

export interface WangyiPublishResultOutput extends BaseResult {
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

export interface WangyiVideoTaskInput extends ITask {
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
   * 话题列表，可多个
   */
  topics?: Array<WangyiVideoTopicInfo>;

  /**
   * 标签
   */
  tags?: Array<string>;

  /**
   *创作申明
   * 内容由AI生成
   * 个人原创，仅供参考
   * 取材网络，谨慎辨别
   * 虚构演绎，仅供娱乐
   */
  creativeStatement?: string; // '内容由AI生成' | '个人原创，仅供参考' | '取材网络，谨慎辨别' | '虚构演绎，仅供娱乐';

  /**
   * 一级分类
   */
  category?: WangyiVideoCategory;
  /**
   * 二级分类
   */
  subCategory?: WangyiVideoCategory;

  /**
   * 定时发布日期 格式:2024-03-12 14:13:01
   */
  publishTime?: string;

  /**
   * 是否原创
   */
  isOriginal?: 1 | 0;

  /**
   * 自动回复内容
   */
  autoCommentText?: string;

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}

/**
 * 组装发布数据
 * @param uploadedVideoInfo  上传完成的视频信息
 * @param taskData  任务数据
 * @param coverUrl 上传完成的封面url
 */
const buildPostData = (
  uploadedVideoInfo: UploadArgsResponse,
  taskData: WangyiVideoTaskInput,
  coverUrl: string,
): string => {
  const argsList: Array<string> = [];
  const dra = taskData.video.duration ? parseInt(taskData.video.duration.toString()) : 100;
  argsList.push(`playlength=${dra}`);
  argsList.push(`filesize=${taskData.video.size ?? 1024}`);
  argsList.push(`rvideoid=${uploadedVideoInfo.vid}`);
  argsList.push(`filepath=${encodeURIComponent(uploadedVideoInfo.url)}`);

  argsList.push(`state=success&pageUrl=&remake=0&title=${encodeURIComponent(taskData.title ?? '')}`);

  const subCategory = taskData.subCategory?.categoryName;
  if (!subCategory) {
    argsList.push(`categoryV6=${encodeURIComponent(taskData.category?.categoryName ?? '')}`);
  } else {
    argsList.push(
      `categoryV6=${encodeURIComponent(`${taskData.category?.categoryName}/${taskData.subCategory?.categoryName}`)}`,
    );
  }

  argsList.push('description=');

  //标签
  if (taskData.tags && taskData.tags?.length > 0) {
    argsList.push(`tag=${encodeURIComponent(taskData.tags.join(','))}`);
  } else {
    argsList.push('tag=');
  }

  //封面
  argsList.push(`picUrl=${encodeURIComponent(coverUrl)}`);

  //草稿还是发布
  argsList.push(`sign=&timestamp=&videoMaterialType=${taskData.pubType ?? 1}`);

  //定时发布
  if (taskData.publishTime) {
    argsList.push(`scheduled=1&publishTime=${taskData.publishTime}`);
  } else {
    argsList.push('scheduled=0');
  }

  //原创
  if (taskData.isOriginal == 1) {
    argsList.push('isOriginal=1');
  } else {
    argsList.push('isOriginal=5');
  }

  //话题
  if (taskData.topics && taskData.topics?.length > 0) {
    argsList.push(`subjectId=${taskData.topics?.map((m) => m.subjectId)?.join(',')}`);
  } else {
    argsList.push('subjectId=');
  }

  //申明
  if (taskData.creativeStatement) {
    argsList.push(`creativeStatement=${encodeURIComponent(taskData.creativeStatement)}`);
  }

  //自动回复内容
  argsList.push(`autoCommentText=${encodeURIComponent(taskData?.autoCommentText ?? '双击视频，交个朋友')}`);

  return argsList.join('&');
};
