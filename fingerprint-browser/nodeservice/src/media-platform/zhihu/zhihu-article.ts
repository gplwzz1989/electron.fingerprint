import { ImageInfo } from '../../media-platform/baseModel';
import { ZhihuTopicInfo } from './zhihu-topic.service';
import { EventEmitter } from 'form-data';
import { BaseResult } from '../../media-platform/baseResult';
import {
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
import { errorCode } from '../../media-platform/errorCode';
import { HtmlDocument } from '../../htmlAgilityPack';
import { getImgFromUrl, publish, zhihuAddTopicToArticle, zhihuSaveArticleDraftAsync } from './zhihu-article.service';
import * as buffer from 'buffer';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import crypto from 'crypto';
import {
  getImageUploadKeyResponse,
  getUploadedImageInfo,
  uploadImagePart,
  uploadImageStatus,
} from './zhihu-video.service';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '../webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';

export const publishZhihuArticle = async (
  cookie: string,
  taskData: ZhihuArticleTaskInput,
  eventCallback: EventEmitter,
): Promise<ZhihuPublishArticleResultOutput> => {
  logger.info(`知乎文章发布 ${taskData.taskId}`);
  const pubResult: ZhihuPublishArticleResultOutput = {
    code: 0,
    msg: '',
    taskId: taskData.taskId,
  };
  try {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploading, '开始发布', taskData.taskId);
    SetProgressEvent(eventCallback, 1, '准备上传图片', taskData.taskId);
    let webProxy: HttpsProxyAgent<string> | object | undefined = undefined;
    if (taskData.proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(taskData.proxy);
    }

    //上传正文中的图片
    const content = await replaceImgInHtml(
      cookie,
      taskData.content,
      taskData.taskId,
      eventCallback,
      pubResult,
      taskData,
    );

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // 随机一个500-1000的数字延时
    await Task.Delay(Math.floor(Math.random() * 501) + 500);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressEvent(eventCallback, 80, '准备上传封面', taskData.taskId);

    let coverUrl;

    if (taskData.covers?.length) {
      for (let i = 0; i < 3; i++) {
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);

        coverUrl = await uploadImageProcess(taskData.covers[0].pathOrUrl, taskData.taskId, cookie, pubResult);
        if (coverUrl) {
          break;
        }
      }

      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      if (!coverUrl) {
        logger.error(
          `封面上传失败 ${taskData.taskId} ${cookie} ${JSON.stringify(taskData.covers)} ${JSON.stringify(pubResult)}`,
        );
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploadFail,
          pubResult?.msg ? pubResult.msg : '上传失败',
          taskData.taskId,
        );
        return pubResult;
      }
    } else {
      coverUrl = '';
    }

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);

    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    //组装数据
    const postData = buildPostData(taskData, content, coverUrl ?? '');

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (taskData.pubType === 0) {
      //不可取消
      taskData.cancelToken?.disable(privateKey);
    }
    console.debug('知乎保存草稿', taskData.taskId, cookie, postData);
    const draftResult = await zhihuSaveArticleDraftAsync(cookie, postData);
    console.debug('知乎保存草稿返回数据', taskData.taskId, draftResult);

    if (taskData.pubType === 0) {
      pubResult.publishId = draftResult?.id?.toString();
      pubResult.code = draftResult?.error?.code ?? 0;
      pubResult.msg = draftResult?.error?.message ?? '草稿保持成功';
      SetProgressNewEvent(
        eventCallback,
        pubResult?.code === 0 ? publishStatusEnum.pushSuccess : publishStatusEnum.pushFail,
        `推送草稿${pubResult.code ? '失败' : '成功'}`,
        taskData.taskId,
      );
      return pubResult;
    }
    // 设置话题
    if (taskData.topics.length > 0) {
      for (const topic of taskData.topics) {
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);
        await zhihuAddTopicToArticle(cookie, draftResult.id, topic);
      }
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);

    const publishResult = await publish(cookie, draftResult.id, taskData, webProxy);

    if (publishResult?.data?.result?.includes('id')) {
      const rePub = JSON.parse(publishResult.data.result);
      pubResult.publishId = rePub['publish']['id'];
    }

    if (pubResult.code == 0 && (pubResult.publishId || taskData.pubType == 1)) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      pubResult.msg = `发布失败${publishResult?.message ?? ''}`;
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
      logger.error(
        `知乎文章发布失败,-->${taskData.taskId}--> ${cookie}-->${postData} --> ${JSON.stringify(publishResult)}`,
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
    logger.error(`知乎文章发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};

export const replaceImgInHtml = async (
  cookie: string,
  content: string,
  taskId: string,
  eventCallback: EventEmitter,
  pubResult: ZhihuPublishArticleResultOutput,
  taskData: ZhihuArticleTaskInput,
): Promise<string> => {
  const html = new HtmlDocument();
  html.LoadHtml(content);
  const imgNodes = html.DocumentNode?.SelectNodes('//img');
  if (imgNodes?.length > 0) {
    let processCount = 0;
    for (const img of imgNodes) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      SetProgressEvent(eventCallback, (80 / imgNodes.length) * processCount + 5, '图片上传中', taskId);
      processCount++;
      let imgUrl = img.getAttribute('src') ?? img.getAttribute('data-src');
      if (!imgUrl) {
        continue;
      }
      if (imgUrl.startsWith('//')) {
        imgUrl = 'http:' + imgUrl;
      }

      let resultJson: UploadImageResponse = {};

      if (imgUrl.toLowerCase().startsWith('http')) {
        resultJson = await getImgFromUrl(cookie, imgUrl);
      }

      if (resultJson?.src) {
        img.setAttribute('src', resultJson?.src?.toString());
      } else {
        const upImgUrl = await uploadImageProcess(imgUrl, taskId, cookie, pubResult);
        if (upImgUrl) {
          img.setAttribute('src', upImgUrl);
        } else {
          throw new Error(`图片上传失败:${pubResult.msg}-${imgUrl}`);
        }
      }
      img.removeAttribute('img-data');
      img.removeAttribute('yxr-data');
      img.setAttribute('data-size', 'normal');
      img.setAttribute('data-caption', '');
      img.setAttribute('data-rawwidth', resultJson['data-rawwidth']?.toString() ?? '');
      img.setAttribute('data-rawheight', resultJson['data-rawheight']?.toString() ?? '');
      img.setAttribute('data-watermark', resultJson?.watermark ?? '');
      img.setAttribute('data-original-src', resultJson?.original_src ?? '');
      img.setAttribute('data-watermark-src', resultJson?.watermark_src ?? '');
    }
  }

  return html.DocumentNode.OuterHtml();
};

export const uploadImageProcess = async (
  imageUrl: string,
  taskId: string,
  cookie: string,
  pubResult: ZhihuPublishArticleResultOutput,
): Promise<string | null | undefined> => {
  try {
    //读取图片数据
    const imageData = await readImageData(imageUrl, 'jpeg');
    if (!imageData?.data || !(imageData?.data?.length > 500)) {
      pubResult.msg = `读取图片数据失败:${imageUrl}`;
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
      pubResult.msg = '获取图片上传参数失败:' + (uploadCoverArgs?.error?.message ?? '');
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
        pubResult.msg = `图片上传失败:${imageResult.split('<Error>')[1].split('<')[0]}`;
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
      pubResult.msg = `图片上传失败:${imageUrl}`;
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
    return imageInfo.original_src;
    //endregion
  } catch (e) {
    console.error('图片上传失败', taskId, e);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = `图片上传失败${imageUrl}`;
    return null;
  }
};

const buildPostData = (taskData: ZhihuArticleTaskInput, content: string, coverUrl: string): string => {
  const params = {};
  params['isTitleImageFullScreen'] = false;
  params['titleImage'] = coverUrl;
  params['title'] = taskData.title;
  params['content'] = htmlDecode(content);

  return JSON.stringify(params);
};

interface UploadImageResponse {
  src?: string;
  watermark?: string;
  watermark_hash?: string;
  watermark_src?: string;
  original_hash?: string;
  original_src?: string;
  'data-rawwidth'?: number;
  'data-rawheight'?: number;
}

export interface ZhihuPublishArticleResultOutput extends BaseResult {
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

export interface ZhihuArticleTaskInput {
  cancelToken?: CancelToken;
  /**
   * 任务ID
   */
  taskId: string;

  /**
   * 发布类型
   * 0 存草稿 平台支持才有效，否则默认为发布
   * 1 发布
   */
  pubType: number;

  /**
   * 文章信息
   */
  title: string;

  /**
   * 文章封面
   */
  covers?: Array<ImageInfo>;

  /**
   * 文章内容 html
   */
  content: string;

  /**
   * 文章话题
   */
  topics: Array<ZhihuTopicInfo>;

  /**
   * 文章创作声明
   */
  disclaimer?: string;

  /**
   * 创作申明
   * spoiler  包含剧透
   * medical_advice 包含意料建议
   * fictional_creation 虚构创作
   * contain_finance 包含理财内容
   * ai_creation 包含AI辅助创作
   * none 无申明
   */
  creationStatement?: { disclaimer_type: string; disclaimer_status: 'open' };

  /**
   * 代理信息
   */
  proxy?: KuaiDaiLiProxy;
}
