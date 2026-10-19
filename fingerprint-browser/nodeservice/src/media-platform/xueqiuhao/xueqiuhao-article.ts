import { EventEmitter } from 'events';
import { logger, publishStatusEnum, readImageData, SetProgressEvent, SetProgressNewEvent, Task } from '@/utils';
import { AxiosError } from 'axios';
import { errorCode } from '../errorCode';
import { HtmlDocument } from '@/htmlAgilityPack';
import { ImageInfo } from '../baseModel';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import { BaseResult } from '../baseResult';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '../webproxy';
import {
  covertImgFromUrl,
  getSessionToken,
  publishXueQiuArticleResponse,
  saveDraftXueQiuArticleResponse,
  uploadImageResponse,
} from './xueqiuhao-article.service';

/**
 *
 * @param cookie
 * @param taskData
 * @param eventCallback
 */
export const publishXueQiuHaoArticle = async (
  cookie: string,
  taskData: XueQiuHaoArticleTaskInput,
  eventCallback: EventEmitter,
): Promise<XueQiuHaoPublishResultOutput> => {
  logger.info(`雪球号图文发布 ${taskData.taskId}`);
  const pubResult: XueQiuHaoPublishResultOutput = {
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
    //上传封面
    const uploadedCovers = await uploadCovers(cookie, taskData.covers);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (taskData.pubType === 0) {
      const postData = buildPostData(taskData, content, uploadedCovers, '');
      const draftRe = await saveDraftXueQiuArticleResponse(cookie, postData, webProxy);
      if (draftRe?.id) {
        pubResult.code = 0;
        pubResult.publishId = draftRe?.id?.toString();
      } else {
        pubResult.code = -1;
        pubResult.msg = draftRe?.error_description ?? `保存草稿失败:${draftRe?.error_code}`;
      }
      return pubResult;
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    const pubToken = await getSessionToken(cookie);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!pubToken?.session_token) {
      pubResult.code = -1;
      pubResult.msg = pubToken?.error_description ?? '发布失败';
      return pubResult;
    }

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    //组装数据
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    const postData = buildPostData(taskData, content, uploadedCovers, pubToken.session_token);

    console.debug('雪球号推送数据', taskData.taskId, cookie, postData);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);
    const publishResult = await publishXueQiuArticleResponse(cookie, postData, webProxy);
    console.debug('雪球号推送返回数据', taskData.taskId, publishResult);

    pubResult.code = publishResult?.id ? 0 : -1;
    pubResult.msg = publishResult?.error_description ?? '发布失败';

    pubResult.publishId = publishResult.id?.toString();

    if (pubResult.code == 0 && pubResult.publishId) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      pubResult.msg = `发布失败${pubResult.msg}`;
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
      logger.error(`雪球号文章发布失败 ${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(publishResult)}`);
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
    logger.error(`雪球号文章发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};

const replaceImgInHtml = async (
  cookie: string,
  content: string,
  taskId: string,
  eventCallback: EventEmitter,
  taskData: XueQiuHaoArticleTaskInput,
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

      //直接官方转换
      if (imgUrl.toLowerCase().startsWith('http')) {
        const result = await covertImgFromUrl(cookie, imgUrl);
        if (result?.url && result?.filename) {
          uploadedUrl = result?.url?.startsWith('http')
            ? `${result.url}/${result.filename}`
            : `https:${result.url}/${result.filename}`;
        }
      }
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      //下载后再上传
      if (!uploadedUrl) {
        const imgData = await readImageData(imgUrl, 'jpeg');

        if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
          throw new Error(`图片读取失败-${imgData.status}-${imgUrl}`);
        }
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);
        const binaryResult = await uploadImageResponse(cookie, imgData.data);
        if (binaryResult?.url && binaryResult?.filename) {
          uploadedUrl = binaryResult?.url?.startsWith('http')
            ? `${binaryResult.url}/${binaryResult.filename}`
            : `https:${binaryResult.url}/${binaryResult.filename}`;
        }

        if (!uploadedUrl) {
          throw new Error(`图片上传失败-${binaryResult?.error_description}-${imgUrl}`);
        }
      }

      //上传成功，替换内容中图片相关信息
      if (uploadedUrl) {
        img.setAttribute('src', uploadedUrl);
        img.setAttribute('class', 'ke_img');
        img.setAttribute('alt', '');
      } else {
        throw new Error(`图片上传失败-${imgUrl}}`);
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

      //下载后再上传
      const imgData = await readImageData(imgUrl, 'jpeg');

      if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
        throw new Error(`封面图片读取失败-${imgData.status}-${imgUrl}`);
      }
      const binaryResult = await uploadImageResponse(cookie, imgData.data);
      const uploadedUrl = binaryResult?.url ? `${binaryResult.url}/${binaryResult.filename}` : undefined;
      if (!uploadedUrl) {
        throw new Error(`封面图片上传失败-${binaryResult?.error_description}-${imgUrl}`);
      }

      if (!uploadedUrl) {
        throw new Error(`封面图片上传失败-${imgUrl}`);
      }
      upCovers.push(uploadedUrl);
      if (upCovers.length >= 1) {
        break;
      }
    }
  }

  return upCovers;
};

const buildPostData = (
  taskData: XueQiuHaoArticleTaskInput,
  content: string,
  coverImages: Array<string>,
  publishToken: string,
): string => {
  const argsList = new Array<string>();

  //session_token=2DD2GC6qZzxp2MU7YxFsdM
  argsList.push('title=' + encodeURIComponent(taskData.title));
  argsList.push('status=' + encodeURIComponent(content));

  argsList.push(`cover_pic=${encodeURIComponent(coverImages[0])}`);

  argsList.push('show_cover_pic=true&original=false&legal_user_state=open');
  argsList.push('industry_category_name=&original_event_id=&original_event_active=true&legal_user_visible=false');
  argsList.push(`is_private=${taskData.is_private ?? false}`);
  if (publishToken) {
    argsList.push(`session_token=${publishToken}`);
  }

  //申明
  if (taskData.ai_disclose) {
    argsList.push('ai_disclose=301');
  }

  return argsList.join('&');
};

export interface XueQiuHaoArticleTaskInput {
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
   * 文章封面
   */
  covers: Array<ImageInfo>;

  /**
   * 文章内容 html
   */
  content: string;

  /**
   * 定时发布时间戳 13位
   */
  publishTime?: number;

  /**
   * true:私密 ，false 公开
   */
  is_private: boolean;

  /**
   * AI创作申明
   */
  ai_disclose?: number;

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}

export interface XueQiuHaoPublishResultOutput extends BaseResult {
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
