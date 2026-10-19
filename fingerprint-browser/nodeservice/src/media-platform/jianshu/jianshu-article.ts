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
  createJianShuArticle,
  getJianShuArticleBaseInfo,
  getJianShuImageUploadArgs,
  publishJianShuArticleResponse,
  saveJianShuDraftResponse,
  uploadImageResponse,
} from './jianshu-article.service';

/**
 *
 * @param cookie
 * @param taskData
 * @param eventCallback
 */
export const publishJianShuArticle = async (
  cookie: string,
  taskData: JianShuHaoArticleTaskInput,
  eventCallback: EventEmitter,
): Promise<JianShuHaoPublishResultOutput> => {
  logger.info(`简书图文发布 ${taskData.taskId}`);
  const pubResult: JianShuHaoPublishResultOutput = {
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

    const noteBookInfo = await getJianShuArticleBaseInfo(cookie);
    if (!noteBookInfo?.length) {
      pubResult.msg = `获取文集失败，请检查是否创建文集`;
      pubResult.code = -1;
      return pubResult;
    }
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    const article = await createJianShuArticle(cookie, noteBookInfo[0].id, taskData.title);
    if (!article?.id) {
      pubResult.msg = `创建文章失败${article.error ?? ''}`;
      pubResult.code = 204;
      return pubResult;
    }

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
    // const uploadedCovers = await uploadCovers(cookie, taskData.covers);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    //组装数据
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    const postData = buildPostData(taskData, content, article.id);

    const draftRe = await saveJianShuDraftResponse(cookie, postData, article.id.toString());
    if (!draftRe?.id) {
      const error = draftRe?.error as Array<{ code: number; message: string }>;
      pubResult.msg = `保存文章失败${error?.length ? error[0].message : ''}`;
      pubResult.code = error?.length ? error[0].code ?? -1 : -1;
      return pubResult;
    }
    pubResult.publishId = article.id.toString();
    if (taskData.pubType === 0) {
      pubResult.msg = '';
      pubResult.code = 0;
      return pubResult;
    }

    console.debug('简书推送数据', taskData.taskId, cookie, postData);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);
    const publishResult = await publishJianShuArticleResponse(cookie, article.id, webProxy);
    console.debug('简书推送返回数据', taskData.taskId, publishResult);

    const error = publishResult?.error as Array<{ code: number; message: string }>;
    pubResult.code = error ? (error?.length > 0 ? error[0]?.code : publishResult?.error ? -1 : 0) : 0;
    pubResult.msg = error?.length ? error[0]?.message : JSON.stringify(publishResult?.error);

    if (pubResult.code == 0 && pubResult.publishId) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      pubResult.code = pubResult?.code === 0 ? -1 : pubResult.code;
      pubResult.msg = `发布失败 ${pubResult.msg}`;
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
      logger.error(`简书文章发布失败 ${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(publishResult)}`);
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
    logger.error(`简书文章发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};

const replaceImgInHtml = async (
  cookie: string,
  content: string,
  taskId: string,
  eventCallback: EventEmitter,
  taskData: JianShuHaoArticleTaskInput,
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

        const fileName = `${Date.now()}.png`;

        const uploadArgs = await getJianShuImageUploadArgs(cookie, fileName);
        if (!uploadArgs?.key) {
          throw new Error(`获取图片上传参数失败${uploadArgs.error ?? ''}`);
        }

        const binaryResult = await uploadImageResponse(cookie, imgData.data, fileName, uploadArgs);
        uploadedUrl = binaryResult?.url;
        if (!uploadedUrl) {
          throw new Error(`图片上传失败-${binaryResult.error ?? ''}-${imgUrl}`);
        }
      }

      //上传成功，替换内容中图片相关信息
      if (uploadedUrl) {
        img.setAttribute('class', 'uploaded-img');
        img.setAttribute('src', uploadedUrl);
        img.setAttribute('style', 'min-height:200px;min-width:200px;');
        img.setAttribute('width', 'auto');
        img.setAttribute('height', 'auto');
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

const buildPostData = (taskData: JianShuHaoArticleTaskInput, content: string, noteId: number): string => {
  const publishData = {};
  publishData['content'] = content;
  publishData['id'] = noteId;
  publishData['title'] = taskData.title ?? '';
  publishData['autosave_control'] = 1;
  return JSON.stringify(publishData);
};

export interface JianShuHaoArticleTaskInput {
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
   * 文章内容 html
   */
  content: string;

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}

export interface JianShuHaoPublishResultOutput extends BaseResult {
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
