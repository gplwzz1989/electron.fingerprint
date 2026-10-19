import { EventEmitter } from 'events';
import { logger, publishStatusEnum, readImageData, SetProgressEvent, SetProgressNewEvent, Task } from '@/utils';
import { AxiosError } from 'axios';
import { errorCode } from '../errorCode';
import { HtmlDocument } from '@/htmlAgilityPack';
import { ImageInfo } from '../baseModel';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '../webproxy';
import { publishAZhanArticleResponse } from './azhan-article.service';
import * as buffer from 'buffer';
import {
  AZhanUploadedImageInfoResponse,
  checkUploadAZhanImageResponse,
  getAZhanImageUploadArgsResponse,
  getAZhanImageUploadTokenResponse,
  getUploadedAZhanImageInfoResponse,
  uploadAZhanImageResponse,
} from './azhan-video.service';
import { AZhanPublishResultOutput } from './azhan-video';


/**
 *
 * @param cookie
 * @param taskData
 * @param eventCallback
 */
export const publishAZhanArticle = async (
  cookie: string,
  taskData: AZhanArticleTaskInput,
  eventCallback: EventEmitter,
): Promise<AZhanPublishResultOutput> => {
  logger.info(`A站号图文发布 ${taskData.taskId}`);
  const pubResult: AZhanPublishResultOutput = {
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

    // cookie=cookie.replace('_did=','_didOld');
    // const reCookie = await refreshUserCookie(cookie);
    // cookie = `${cookie};${reCookie}`;
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressEvent(eventCallback, 1, '准备上传图片', taskData.taskId);

    // 随机一个500-1000的数字延时
    await Task.Delay(Math.floor(Math.random() * 501) + 500);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    //上传正文中的图片
    const content = await replaceImgInHtml(
      cookie,
      taskData.content,
      taskData.taskId,
      eventCallback,
      taskData,
      pubResult,
    );

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // 随机一个500-1000的数字延时
    await Task.Delay(Math.floor(Math.random() * 501) + 1500);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    pubResult.code = 0;
    pubResult.msg = '';

    SetProgressEvent(eventCallback, 80, '准备上传封面', taskData.taskId);

    //上传封面
    let coverUrl;
    if (taskData.covers?.length) {
      const imgUrl = taskData.covers[0].pathOrUrl;
      const imgData = await readImageData(taskData.covers[0].pathOrUrl, 'jpeg');

      if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
        pubResult.msg = `封面读取失败-${imgData.status}-${imgUrl}`;
        pubResult.code = errorCode.io_error;
        return pubResult;
      }
      const binaryResult = await uploadImage(taskData, `${Date.now()}.png`, imgData.data, pubResult, cookie);
      coverUrl = binaryResult?.url;
      if (!coverUrl) {
        pubResult.msg = `封面上传失败-${binaryResult?.message ? binaryResult?.message : pubResult.msg}-${imgUrl}`;
        pubResult.code = binaryResult?.message ? binaryResult.result : -1;
        return pubResult;
      }
    }
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    //组装数据
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    const postData = buildPostData(taskData, content, coverUrl ?? '');

    console.debug('A站文章推送数据', taskData.taskId, cookie, postData);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);
    const publishResult = await publishAZhanArticleResponse(cookie, postData, webProxy);
    console.debug('A站文章推送返回数据', taskData.taskId, publishResult);

    pubResult.code = publishResult?.result ?? -1;
    pubResult.msg = publishResult?.error_msg ?? '发布失败';

    pubResult.publishId = publishResult?.articleId?.toString();

    if (pubResult.code == 0 && pubResult.publishId) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      pubResult.msg = `发布失败${pubResult.msg}`;
      if (pubResult.code === 400002) {
        pubResult.msg =
          '发布失败:官方平台检测到您的账号存在风险，请先前往《创作者中心》登录后发布文章，发布时会跳出验证，验证通过即可一键发布。';
      }
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
      logger.error(`A站号文章发布失败 ${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(publishResult)}`);
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
    logger.error(`A站号文章发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};

const replaceImgInHtml = async (
  cookie: string,
  content: string,
  taskId: string,
  eventCallback: EventEmitter,
  taskData: AZhanArticleTaskInput,
  pubResult: AZhanPublishResultOutput,
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
      //下载后再上传
      if (!uploadedUrl) {
        const imgData = await readImageData(imgUrl, 'jpeg');

        if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
          throw new Error(`图片读取失败-${imgData.status}-${imgUrl}`);
        }
        const binaryResult = await uploadImage(taskData, `${Date.now()}.png`, imgData.data, pubResult, cookie);
        uploadedUrl = binaryResult?.url;
        if (!uploadedUrl) {
          throw new Error(`图片上传失败-${binaryResult?.message ? binaryResult?.message : pubResult.msg}-${imgUrl}`);
        }
      }

      //上传成功，替换内容中图片相关信息
      if (uploadedUrl) {
        img.setAttribute('src', uploadedUrl);
        img.setAttribute('style', 'max-width: 700px');
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

const uploadImage = async (
  taskData: AZhanArticleTaskInput,
  fileName: string,
  imageData: buffer.Buffer,
  pubResult: AZhanPublishResultOutput,
  cookie: string,
): Promise<AZhanUploadedImageInfoResponse | null | undefined> => {
  try {
    let imageUploadArgs = await getAZhanImageUploadArgsResponse(cookie, fileName);
    if (!imageUploadArgs?.info?.token) {
      await Task.Delay(5000);
      imageUploadArgs = await getAZhanImageUploadArgsResponse(cookie, fileName);
    }
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (!imageUploadArgs?.info?.token) {
      console.debug(`获取图片上传参数失败${imageUploadArgs?.message}`, imageUploadArgs);
      pubResult.code = -1;
      pubResult.msg = `获取图片上传参数失败${imageUploadArgs?.message}`;
      return null;
    }

    await getAZhanImageUploadTokenResponse(
      cookie,
      imageUploadArgs?.info?.token,
      imageUploadArgs?.info?.httpEndpointList[0],
    );
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    const imageResult = await uploadAZhanImageResponse(
      cookie,
      imageData,
      imageUploadArgs?.info?.token,
      imageUploadArgs?.info?.httpEndpointList[0],
    );
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (!imageResult?.checksum) {
      console.debug(`图片上传失败${imageResult?.message}`, imageResult);
      pubResult.code = -1;
      pubResult.msg = `图片上传失败${imageResult?.message}`;
      return null;
    }

    await checkUploadAZhanImageResponse(
      cookie,
      imageUploadArgs?.info?.token,
      imageUploadArgs?.info?.httpEndpointList[0],
    );

    const imageResultInfo = await getUploadedAZhanImageInfoResponse(cookie, imageUploadArgs.info.token);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (!imageResultInfo?.url) {
      console.debug(`图片上传信息失败${imageResult?.message}`, imageResult);
      pubResult.code = -1;
      pubResult.msg = `图片上传信息失败${imageResult?.message}`;
      return null;
    }
    pubResult.code = 0;
    pubResult.msg = '';
    return imageResultInfo;
    // endregion
  } catch (e) {
    console.error('A站图片上传失败', taskData.taskId, e);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = '图片上传失败';
    return null;
  } finally {
  }
};
const buildPostData = (taskData: AZhanArticleTaskInput, content: string, coverImageUrl: string): string => {
  const argsList = new Array<string>();

  const detail = { bodyList: [{ orderId: 1, title: '', txt: encodeURIComponent(content ?? '') }] };
  argsList.push('title=' + encodeURIComponent(taskData.title?.toString() ?? ''));
  argsList.push('description=' + encodeURIComponent(taskData.desc?.toString() ?? ''));
  argsList.push('detail=' + encodeURIComponent(JSON.stringify(detail)));
  argsList.push('tagNames=' + encodeURIComponent(JSON.stringify(taskData.tags ?? [])));
  argsList.push('channelId=' + taskData.categoryId?.toString()); //一级分类
  argsList.push('realmId=' + taskData.subCategoryId?.toString()); //二级分类
  argsList.push('cover=' + encodeURIComponent(coverImageUrl ?? ''));
  argsList.push('supportZtEmot=true');
  //原创
  argsList.push('creationType=' + (taskData.isOriginal === 0 ? '1' : '3'));

  return argsList.join('&');
};

export interface AZhanArticleTaskInput {
  cancelToken?: CancelToken;
  /**
   * 任务ID
   */
  taskId: string;

  /**
   * 文章标题
   */
  title: string;

  /**
   * 描述
   */
  desc?: string;

  /**
   * 文章封面
   */
  covers?: Array<ImageInfo>;

  /**
   * 最多6个
   */
  tags?: Array<string>;

  /**
   * 文章内容 html
   */
  content: string;

  /**
   * 1:原创
   */
  isOriginal: 1 | 0;

  /**
   * 分类id
   */
  categoryId: string;

  /**
   * 二级分类id
   */
  subCategoryId: string;

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}
