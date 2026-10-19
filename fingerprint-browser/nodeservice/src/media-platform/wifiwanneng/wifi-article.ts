import { EventEmitter } from 'events';
import { logger, publishStatusEnum, readImageData, SetProgressEvent, SetProgressNewEvent, Task } from '@/utils';
import { AxiosError } from 'axios';
import { errorCode } from '../errorCode';
import { HtmlDocument } from '@/htmlAgilityPack';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import { BaseResult } from '../baseResult';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '../webproxy';
import {
  convertWiFiImageResponse,
  cutWiFiImageResponse,
  publishWiFiArticleResponse,
  uploadImageResponse,
} from './wifi-article.service';
import { ImageInfo } from '@/media-platform';
import { getWiFiContentListResponse } from './wifi-content-list.service';

/**
 *
 * @param cookie
 * @param taskData
 * @param eventCallback
 */
export const publishWiFiArticle = async (
  cookie: string,
  taskData: WiFiHaoArticleTaskInput,
  eventCallback: EventEmitter,
): Promise<WiFiHaoPublishResultOutput> => {
  logger.info(`WIFI图文发布 ${taskData.taskId}`);
  const pubResult: WiFiHaoPublishResultOutput = {
    code: 0,
    msg: '',
    taskId: taskData.taskId,
  };

  try {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploading, '开始发布', taskData.taskId);
    let webProxy: HttpsProxyAgent<string> | object | undefined = undefined;
    if (taskData.proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(taskData.proxy);
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressEvent(eventCallback, 1, '准备上传图片', taskData.taskId);

    // 随机一个500-1000的数字延时
    await Task.Delay(Math.floor(Math.random() * 501) + 500);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    //上传正文中的图片
    const content = await replaceImgInHtml(cookie, taskData.content, taskData.taskId, eventCallback, taskData);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // 随机一个500-1000的数字延时
    await Task.Delay(Math.floor(Math.random() * 501) + 500);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    pubResult.code = 0;
    pubResult.msg = '';

    SetProgressEvent(eventCallback, 80, '准备上传封面', taskData.taskId);

    // //上传封面
    const uploadedCovers = await uploadCovers(cookie, taskData.covers);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    //组装数据
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    const postData = buildPostData(taskData, content, uploadedCovers);

    const contentListPre = await getWiFiContentListResponse(cookie, 0, 1);

    console.debug('WIFI推送数据', taskData.taskId, cookie, postData);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);
    const publishResult = await publishWiFiArticleResponse(cookie, postData, webProxy);
    console.debug('WIFI推送返回数据', taskData.taskId, publishResult);

    pubResult.code =
      publishResult?.error?.message || publishResult?.success === false ? publishResult?.error?.code ?? -1 : 0;
    pubResult.msg = publishResult?.error?.message;
    pubResult.publishId = publishResult?.data?.newsId;
    if (publishResult?.success && !pubResult.publishId) {
      for (let i = 0; i < 3; i++) {
        await Task.Delay(1500);
        const content = await getWiFiContentListResponse(cookie, 0, 1);
        if (content?.data?.length) {
          const pid = content.data[0].id;
          const title = content.data[0].title?.trim();
          const now = Date.now();
          if (Math.abs((content.data[0].create_date - now) / 1000) < 20 && taskData.title?.trim() == title) {
            pubResult.publishId = pid;
            break;
          } else if (contentListPre?.data?.length) {
            if (
              (content.data[0].create_date - contentListPre.data[0].create_date) / 1000 < 10 &&
              contentListPre.data[0].id != content.data[0].id
            ) {
              pubResult.publishId = pid;
              break;
            }
          }
          if (!pubResult.publishId) {
            pubResult.publishId = pid;
          }
        }
      }
    }

    if (pubResult.code == 0 && pubResult.publishId) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      pubResult.code = -1;
      pubResult.msg = `发布失败${pubResult.msg}`;
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
      logger.error(`WIFI文章发布失败 ${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(publishResult)}`);
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
    logger.error(`WIFI文章发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};

const replaceImgInHtml = async (
  cookie: string,
  content: string,
  taskId: string,
  eventCallback: EventEmitter,
  taskData: WiFiHaoArticleTaskInput,
): Promise<string> => {
  const html = new HtmlDocument();
  html.LoadHtml(content);

  const imgNodes = html.DocumentNode?.SelectNodes('//img');

  if (imgNodes?.length > 0) {
    let processCount = 0;
    for (const img of imgNodes) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      // 每次随机一个500-1000的数字
      await Task.Delay(Math.floor(Math.random() * 501) + 500);
      SetProgressEvent(eventCallback, (50 / imgNodes.length) * processCount + 5, '图片上传中', taskId);
      processCount++;
      let imgUrl = img.getAttribute('src') ?? img.getAttribute('data-src');
      if (!imgUrl) {
        continue;
      }
      if (imgUrl.startsWith('//')) {
        imgUrl = 'http:' + imgUrl;
      }

      let uploadedUrl;

      if (imgUrl?.startsWith('http')) {
        const imgResult = await convertWiFiImageResponse(cookie, imgUrl);
        if (imgResult?.list?.length) {
          uploadedUrl = imgResult.list[0].url;
        }
      }
      //下载后再上传
      if (!uploadedUrl) {
        const imgData = await readImageData(imgUrl, 'jpeg');

        if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
          throw new Error(`图片读取失败-${imgData.status}-${imgUrl}`);
        }

        const fileName = `${Date.now()}.png`;

        const binaryResult = await uploadImageResponse(cookie, imgData.data, fileName);
        uploadedUrl = binaryResult?.url;
        if (!uploadedUrl) {
          throw new Error(`图片上传失败-${binaryResult?.error?.message ?? ''}-${imgUrl}`);
        }
      }

      //上传成功，替换内容中图片相关信息
      if (uploadedUrl) {
        img.setAttribute('src', uploadedUrl);
        img.setAttribute('title', '');
        img.setAttribute('alt', '');
      } else {
        throw new Error(`图片上传失败-${imgUrl}`);
      }
    }
    content = html.DocumentNode.OuterHtml();
    return content;
  } else {
    return content;
  }
};

const uploadCovers = async (cookie: string, covers: Array<ImageInfo>): Promise<Array<string>> => {
  const upCovers: Array<string> = [];
  if (covers?.length > 0) {
    for (const img of covers) {
      let imgUrl = img.pathOrUrl;
      if (!imgUrl) {
        continue;
      }
      if (imgUrl.startsWith('//')) {
        imgUrl = 'http:' + imgUrl;
      }

      let uploadImgUrl;
      if (imgUrl.startsWith('http')) {
        const imgResult = await convertWiFiImageResponse(cookie, imgUrl);
        if (imgResult?.list?.length) {
          uploadImgUrl = imgResult.list[0].url;
        }
      }
      if (!uploadImgUrl) {
        //下载后再上传
        const imgData = await readImageData(imgUrl, 'jpeg');

        if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
          throw new Error(`封面图片读取失败-${imgData.status}-${imgUrl}`);
        }
        const fileName = `${Date.now()}.png`;
        const binaryResult = await uploadImageResponse(cookie, imgData.data, fileName);
        const uploadedUrl = binaryResult?.data?.url;
        if (!uploadedUrl) {
          throw new Error(`封面图片上传失败-${binaryResult?.error?.message ?? ''}-${imgUrl}`);
        }
      }

      const cutResult = await cutWiFiImageResponse(cookie, uploadImgUrl, img);
      if (cutResult?.data?.result?.length && cutResult?.data?.result[0]?.url) {
        upCovers.push(cutResult.data.result[0].url);
      } else {
        upCovers.push(uploadImgUrl);
      }
      if (upCovers.length >= 3) {
        break;
      }
    }
  }

  return upCovers;
};

const buildPostData = (taskData: WiFiHaoArticleTaskInput, content: string, covers: Array<string>): string => {
  const argsList: Array<string> = [];
  argsList.push(`news_content=${encodeURIComponent(content)}`);
  argsList.push(`category=${taskData.categoryId ?? ''}`);
  argsList.push(`cover_count=${covers?.length > 2 ? 3 : 1}`);
  argsList.push(`title=${encodeURIComponent(taskData.title ?? '')}`);
  if (covers?.length > 2) {
    covers = covers.splice(0, 3);
  } else {
    covers = covers?.splice(0, 1);
  }
  argsList.push(`cover_pics=${covers?.length ? covers.join(',') : ''}`);
  argsList.push('id=');
  argsList.push('original=0'); //
  if (taskData.pubType === 0) {
    argsList.push('onlysave=1');
  }

  return argsList.join('&');
};

export interface WiFiHaoArticleTaskInput {
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
  pubType: 0 | 1;

  /**
   * 文章标题
   */
  title: string;

  /**
   * 封面，支持单封面和三封面
   */
  covers: Array<ImageInfo>;

  /**
   * 文章内容 html
   */
  content: string;

  /**
   * 分类id
   */
  categoryId?: string;

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}

export interface WiFiHaoPublishResultOutput extends BaseResult {
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

  /**
   * 返回结果
   */
  mediaContent?: object;
}
