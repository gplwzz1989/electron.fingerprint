import { EventEmitter } from 'events';
import { BaseResult } from '../baseResult';
import fs from 'fs';
import { errorCode } from '../errorCode';
import {
  htmlDecode,
  logger,
  publishStatusEnum,
  readImageData,
  SetProgressEvent,
  SetProgressNewEvent,
} from '../../utils';
import path from 'path';
import { AxiosError } from 'axios';
import {
  publishVideoAsync,
  SouhuhaoUploadVideoResponse,
  uploadImageAsync,
  uploadVideoAsync,
} from './souhuhao-video.service';
import { SouhuhaoVideoCategoryItem } from '../souhuhao';
import { SouhuhaoTopicItem } from './souhuhao-topic.service';
import { HtmlDocument } from '@/htmlAgilityPack';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import { ITask } from '@/media-platform/baseTask';

export const publishSouhuhaoVideo = async (
  cookie: string,
  accountId: number,
  taskData: SouhuhaoVideoTaskInput,
  eventCallback: EventEmitter,
  retryTimes: number = 3,
): Promise<SouhuhaoVideoPublishResultOutput> => {
  logger.info(`搜狐号视频发布 ${taskData.taskId}`);
  const pubResult: SouhuhaoVideoPublishResultOutput = {
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
    const fileName = path.basename(taskData.video.localPath);

    // region 上传视频
    SetProgressNewEvent(
      eventCallback,
      publishStatusEnum.uploading,
      '视频上传中',
      taskData.taskId,
      1,
      0,
      taskData.needParts === true,
    );
    let uploadVideoInfo = await uploadVideoAsync(cookie, accountId, taskData.video.localPath, fileName);
    SetProgressNewEvent(
      eventCallback,
      publishStatusEnum.uploading,
      '视频上传中',
      taskData.taskId,
      1,
      1,
      taskData.needParts === true,
    );
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      // 判断封面是否上传成功
      if (uploadVideoInfo.code !== 100 && !uploadVideoInfo.id) {
        console.debug('封面上传失败', taskData.taskId, taskData?.video?.localPath, uploadVideoInfo);
        if (i < retryTimes - 1 && uploadVideoInfo.code !== 100) {
          uploadVideoInfo = await uploadVideoAsync(cookie, accountId, taskData.video.localPath, fileName);
          continue;
        }
        pubResult.code = errorCode.request_error;
        pubResult.msg = '封面上传失败:' + taskData?.cover?.pathOrUrl;
        logger.error(
          `封面上传失败 ${taskData.taskId} ${cookie} ${JSON.stringify(uploadVideoInfo)} ${JSON.stringify(pubResult)}`,
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
    // endregion

    SetProgressEvent(eventCallback, 85, '获取上传完成视频信息', taskData.taskId);

    // region 封面上传
    SetProgressEvent(eventCallback, 90, '封面读取中', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // 读取图片数据
    const imgData = await readImageData(taskData.cover.pathOrUrl, 'jpeg');
    if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
      pubResult.msg = `图片下载失败-${imgData.status}-${taskData.cover.pathOrUrl}`;
      pubResult.code = errorCode.io_error;
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
    SetProgressEvent(eventCallback, 90, '封面上传中', taskData.taskId);
    // 上传图片数据
    let imageResult = await uploadImageAsync(cookie, accountId, imgData.data, imgData.ext, 'video');
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      // 判断封面是否上传成功
      if (!imageResult.url) {
        if (i < retryTimes - 1 && !imageResult.url) {
          imageResult = await uploadImageAsync(cookie, accountId, imgData.data, imgData.ext, 'video');
          continue;
        }
        pubResult.code = errorCode.request_error;
        pubResult.msg = '封面上传失败:' + taskData?.cover?.pathOrUrl;
        logger.error(
          `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${JSON.stringify(
            imageResult,
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
    if (!imageResult?.url) {
      pubResult.code = errorCode.request_error;
      pubResult.msg = '封面上传失败:' + (taskData?.cover?.pathOrUrl ?? '');
      logger.error(
        `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${JSON.stringify(
          imageResult,
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
    //endregion

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    if (imageResult.url.startsWith('//')) imageResult.url = 'http:' + imageResult.url;

    const coverUrl = imageResult.url;

    // 组装发布数据
    const postData = buildPostData(accountId, taskData, uploadVideoInfo, coverUrl);
    console.debug('搜狐号推送数据', taskData.taskId, cookie, postData);

    // 推送数据
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);
    const publishResult = await publishVideoAsync(cookie, accountId, postData, taskData.pubType, webProxy);
    console.debug('搜狐号推送返回数据', taskData.taskId, publishResult);

    pubResult.code = publishResult?.code;
    pubResult.msg = publishResult?.msg ?? '';
    pubResult.publishId = publishResult?.data?.toString();

    if (pubResult.code == 2000000 && pubResult.publishId) {
      pubResult.code = 0;
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      pubResult.code = pubResult.code == 0 ? -1 : pubResult.code;
      pubResult.msg = `发布失败${pubResult.msg}`;
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
      logger.error(
        `搜狐号视频发布失败 ${taskData.taskId} ${cookie} ${JSON.stringify(postData)} ${JSON.stringify(publishResult)}`,
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
    logger.error(`搜狐号视频发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};

const buildPostData = (
  accountId: number,
  taskData: SouhuhaoVideoTaskInput,
  uploadVideoInfo: SouhuhaoUploadVideoResponse,
  coverUrl: string,
): string => {
  const params = {};
  params['accountId'] = accountId;
  params['videoId'] = uploadVideoInfo.id;
  params['channelId'] = taskData.category.id;
  params['cover'] = encodeURIComponent(coverUrl);
  params['headImage'] = '';
  params['title'] = encodeURIComponent(taskData.title);
  params['mobileTitle'] = '';
  params['columnNewsIds'] = taskData.columnIds && taskData.columnIds.length > 0 ? taskData.columnIds.join(',') : '';
  let desc = '';
  if (taskData.desc) {
    const html = new HtmlDocument();
    html.LoadHtml(taskData.desc);
    desc = htmlDecode(html.DocumentNode.InnerText());
  }
  params['brief'] = encodeURIComponent(desc);
  params['content'] = encodeURIComponent(uploadVideoInfo.videoHtml);
  params['id'] = 0;
  params['userColumnId'] = 0;
  params['modelId'] = '';
  params['topicIds'] = '';
  params['infoResource'] = taskData.infoResource ?? 0;
  params['sourceUrl'] = taskData.infoResource === 1 && taskData.sourceUrl ? taskData.sourceUrl : '';
  params['videoChannelId'] = taskData.subCategory?.id ?? 0;
  if (taskData.topics && taskData.topics.length > 0) {
    const topicIds: Array<{
      id: string;
      name: string;
      type: number;
      uid: string;
    }> = [];

    for (const element of taskData.topics) {
      topicIds.push({
        id: element.id,
        name: element.name,
        type: element.type,
        uid: element.name + element.id,
      });
    }

    params['userLabels'] = encodeURIComponent(JSON.stringify(topicIds));
  }

  return Object.keys(params).reduce((acc, key, index) => {
    if (index === Object.keys(params).length - 1) {
      return acc + key + '=' + params[key]; // 在最后一个键后面添加等号和对应的值
    } else {
      return acc + key + '=' + params[key] + '&'; // 在其他键后面添加等号、对应的值和&符号
    }
  }, '');
};

export interface SouhuhaoVideoTaskInput extends ITask {
  cancelToken?: CancelToken;
  /**
   * 发布类型
   * 0 存草稿 平台支持才有效，否则默认为发布
   * 1 发布
   */
  pubType: number;
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
  title: string;

  /**
   * 一级分类id
   */
  category: SouhuhaoVideoCategoryItem;

  /**
   * 二级分类id
   */
  subCategory?: SouhuhaoVideoCategoryItem;

  /**
   * 话题
   */
  topics?: Array<SouhuhaoTopicItem>;

  /**
   * 专栏id
   */
  columnIds?: Array<number>;

  /**
   * 信息来源 0无特别声明，1引用申明，2自行拍摄，3包含AI创作内容，4包含虚构创作
   */
  infoResource?: number;

  /**
   * 来源链接
   */
  sourceUrl?: string;

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}

export interface SouhuhaoVideoPublishResultOutput extends BaseResult {
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
