import { EventEmitter } from 'events';
import { ImageInfo, PublishResult } from '../../media-platform/baseModel';
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
} from '../../utils';
import { AxiosError } from 'axios';
import { errorCode } from '@/media-platform/errorCode';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import { ZhihuPublishArticleResultOutput } from './zhihu-article';
import crypto from 'crypto';
import * as buffer from 'buffer';
import {
  getImageUploadKeyResponse,
  getUploadedImageInfo,
  UploadedImageInfo,
  uploadImagePart,
  uploadImageStatus,
} from './zhihu-video.service';
import { getImgFromUrl } from './zhihu-article.service';
import { publishZhiHuDynamic, ZhiHuDynamicPyvlishDetail } from './zhihu-dunamic.service';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HtmlDocument } from '@/htmlAgilityPack';
import { getZhihuTopicList } from '@/media-platform/zhihu/zhihu-common';

/**
 * 发短内容入参
 */
export interface ZhiHuDynamicTaskInput {
  cancelToken?: CancelToken;
  taskId: string;

  title?: string;
  /**
   * 内容
   */
  desc?: string;

  // 图片最大限制9张
  images?: Array<ImageInfo>;

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}

interface UploadedDynamicImageInfo {
  image: {
    height: number;
    width: number;
    url: string;
    originalUrl: string;
    watermark: string;
    watermarkUrl: string;
  };
}

/**
 * 知乎短内容发布
 * @param cookie 账号cookie
 * @param taskData 任务数据
 * @param eventCallback 事件回调
 */
export const zhihuPublishDynamic = async (
  cookie: string,
  taskData: ZhiHuDynamicTaskInput,
  eventCallback: EventEmitter,
): Promise<PublishResult> => {
  logger.info(`知乎图文发布 ${taskData.taskId}`);
  const pubResult: PublishResult = {
    code: 0,
    msg: '',
    taskId: taskData.taskId,
  };

  try {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    let webProxy: HttpsProxyAgent<string> | object | undefined = undefined;
    if (taskData.proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(taskData.proxy);
    }
    const postData = {
      action: 'pin',
      data: {
        publish: { traceId: `${Date.now()},${Guid.NewGuid().toString()}` },
        commentsPermission: { comment_permission: 'all' },
        extra_info: { view_permission: 'all', publisher: 'pc' },
        draft: { disabled: 1 },
        title: { title: taskData?.title ?? '' },
        hybrid: {
          html: '',
        },
        media: {
          medias: [],
        },
        topic: {
          topics: [],
        },
      },
    };

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploading, '开始发布', taskData.taskId);
    // 图片发布时用到的类型
    const imageList: Array<UploadedDynamicImageInfo> = [];

    SetProgressEvent(eventCallback, 1, '准备上传图片', taskData.taskId);

    taskData.images = taskData.images?.slice(0, 9);

    // region 上传图片
    if (taskData.images && taskData.images.length > 0) {
      for (const img of taskData.images) {
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);
        if (img.pathOrUrl?.startsWith('http')) {
          const convertRe = await getImgFromUrl(cookie, img.pathOrUrl);
          if (convertRe?.src) {
            imageList.push({
              image: {
                height: convertRe?.['data-rawheight'] ?? img?.height ?? 720,
                width: convertRe?.['data-rawheight'] ?? img?.width ?? 1280,
                url: convertRe.src,
                originalUrl: convertRe?.original_src,
                watermark: convertRe?.watermark,
                watermarkUrl: convertRe?.watermark_src,
              },
            });
            continue;
          }
        }
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);
        let uploadRe = await uploadImageProcess(img.pathOrUrl, taskData.taskId, cookie, pubResult);
        if (!uploadRe) {
          uploadRe = await uploadImageProcess(img.pathOrUrl, taskData.taskId, cookie, pubResult);
        }
        if (!uploadRe?.original_src) {
          return pubResult;
        }
        imageList.push({
          image: {
            height: img?.height ?? 720,
            width: img?.width ?? 1280,
            url: uploadRe?.src,
            originalUrl: uploadRe?.original_src,
            watermark: uploadRe?.watermark,
            watermarkUrl: uploadRe?.watermark_src,
          },
        });
      }
    }
    // endregion

    //图片
    postData.data.media.medias = imageList as never[];

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);

    //正文

    let content = '<p>' + taskData.desc + '</p>';
    if (taskData.desc) {
      //从描述中解析话题出来
      const html = new HtmlDocument();
      html.LoadHtml(content);
      const topicItems = [];
      //话题
      const topics = html.DocumentNode.SelectNodes('//topic');
      if (topics?.length > 0) {
        for (const item of topics) {
          let topicStr = htmlDecode(item.getAttribute('raw') ?? '');
          if (!topicStr?.startsWith('{')) {
            const text = item.getAttribute('text') ?? '';
            const tmpTopic = await getZhihuTopicList(cookie, text);
            if (tmpTopic?.dataList?.length) {
              topicStr = JSON.stringify(tmpTopic.dataList[0]);
            } else {
              topicStr = JSON.stringify({ yixiaoerName: text });
            }
          }
          const topicItem = JSON.parse(topicStr);
          topicItems.push({ topic_id: topicItem?.yixiaoerId, topic_name: topicItem?.yixiaoerName } as never);
          const tp = html.DocumentNode.doc.createElement('a');
          tp.setAttribute('class', 'hash_tag');
          tp.setAttribute('data-topic-name', topicItem?.yixiaoerName);
          tp.textContent = `#${topicItem?.yixiaoerName}#`;
          item.parentNode?.insertBefore(tp, item);
          html.DocumentNode.doc.removeChild(item);
        }
      }

      content = htmlDecode(html.DocumentNode.OuterHtml());
      postData.data.hybrid.html = content;
      postData.data.topic.topics = topicItems;
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    // 数据推送
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);
    const result = await publishZhiHuDynamic(cookie, JSON.stringify(postData), webProxy);
    // 发布失败
    if (result.code != 0) {
      pubResult.code = result?.code ?? -1;
      pubResult.msg = result.message ? result?.message : result?.toast_message ?? '';
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      logger.error(
        `知乎图文发布失败 ${taskData.taskId} ${cookie} ${JSON.stringify(postData)} ${JSON.stringify(result)}`,
      );
    } else {
      pubResult.msg = '发布成功';
      const detail = JSON.parse(result.data.result) as ZhiHuDynamicPyvlishDetail;
      pubResult.publishId = detail?.id?.toString();
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
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
    logger.error(`知乎图文发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
    if (pubResult?.msg?.includes('账号信息不完整')) {
      pubResult.msg = '账号信息不完整，请退出账号重新授权后再试。';
    }
  }

  return pubResult;
};

export const uploadImageProcess = async (
  imageUrl: string,
  taskId: string,
  cookie: string,
  pubResult: ZhihuPublishArticleResultOutput,
): Promise<UploadedImageInfo | null | undefined> => {
  try {
    //读取图片数据
    const imageData = await readImageData(imageUrl, 'jpeg');

    if (!(imageData?.data && imageData?.data?.length > 500)) {
      pubResult.msg = `读取图片失败${imageData.status}-${imageUrl}`;
      pubResult.code = errorCode.io_error;
      return null;
    }

    const fileMd5 = crypto
      .createHash('md5')
      .update(buffer.Buffer.from(imageData.data ?? ''))
      .digest('hex');

    //获取图片上传参数
    const uploadCoverArgs = await getImageUploadKeyResponse(cookie, fileMd5);

    //提取图片上传参数
    if (!uploadCoverArgs?.upload_file?.image_id) {
      console.debug('获取图片上传参数失败', taskId, uploadCoverArgs);
      pubResult.code = uploadCoverArgs?.error?.code ?? errorCode.data_error;
      pubResult.msg = `获取图片上传参数失败:${uploadCoverArgs?.error?.message ?? ''} ${imageUrl}`;
      return null;
    }

    //上传图片数据，返回上传成功的图片url
    if (uploadCoverArgs.upload_file.state != 1) {
      const imageResult = await uploadImagePart(
        buffer.Buffer.from(imageData.data ?? ''),
        uploadCoverArgs,
        imageData.ext,
      );
      //判断封面是否上传成功
      if (imageResult?.toString()?.includes('<Error>')) {
        console.debug('图片上传失败', taskId, imageUrl, imageResult);
        pubResult.code = -1;
        pubResult.msg = `图片上传失败:${imageResult.split('<Error>')[1].split('<')[0]}${imageUrl}`;
        if (imageResult?.startsWith('{')) {
          const imageReJo = JSON.parse(imageResult);
          pubResult.msg = imageReJo?.msg;
        }
        return null;
      }
    }

    //获取上传成功的图片url
    let imageStatus = await uploadImageStatus(cookie, uploadCoverArgs);
    for (let i = 0; i < 5; i++) {
      if (imageStatus == 204 || imageStatus == 200) {
        break;
      }
      await Task.Delay(stepWaitTime);
      imageStatus = await uploadImageStatus(cookie, uploadCoverArgs);
    }
    if (imageStatus != 204 && imageStatus != 200) {
      pubResult.code = imageStatus;
      pubResult.msg = `图片上传失败${imageStatus}:${imageUrl}`;
      return null;
    }

    let imageInfo = await getUploadedImageInfo(cookie, uploadCoverArgs);
    for (let i = 0; i < 5; i++) {
      if (!imageInfo?.original_src) {
        await Task.Delay(stepWaitTime);
        imageInfo = await getUploadedImageInfo(cookie, uploadCoverArgs);
      } else {
        break;
      }
    }
    if (!imageInfo?.original_src) {
      pubResult.code = -1;
      pubResult.msg = `图片上传失败:${imageUrl}`;
      return null;
    }
    pubResult.code = 0;
    pubResult.msg = '';
    return imageInfo;
    //endregion
  } catch (e) {
    console.error('图片上传失败', taskId, e);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = `图片上传失败${(e as Error)?.message ?? ''}${imageUrl}`;
    return null;
  }
};

/**
 * 数据推送至平台
 * @param cookie
 * @param postData
 * @param isPrePub
 */
