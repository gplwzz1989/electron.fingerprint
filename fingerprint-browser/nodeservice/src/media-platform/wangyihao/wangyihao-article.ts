import { EventEmitter } from 'events';
import { logger, publishStatusEnum, readImageData, SetProgressEvent, SetProgressNewEvent, Task } from '@/utils';
import { AxiosError } from 'axios';
import { errorCode } from '../errorCode';
import { HtmlDocument } from '@/htmlAgilityPack';
import { ImageInfo } from '../baseModel';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import { BaseResult } from '../baseResult';
import dayjs from 'dayjs';
import { getWangyihaoUserInfo } from './wangyihao-common';
import { getImgFromUrl, publishArticle, uploadImageBinary } from './wangyihao-article.service';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '../webproxy';

/**
 *
 * @param cookie
 * @param taskData
 * @param eventCallback
 */
export const publishWangyihaoArticle = async (
  cookie: string,
  taskData: WangyihaoArticleTaskInput,
  eventCallback: EventEmitter,
): Promise<WangyihaoPublishResultOutput> => {
  logger.info(`网易号图文发布 ${taskData.taskId}`);
  const pubResult: WangyihaoPublishResultOutput = {
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
    const userInfo = await getWangyihaoUserInfo(cookie);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (userInfo?.code != 0) {
      pubResult.msg = userInfo.msg;
      pubResult.code = userInfo?.code ?? -1;
      logger.error(`获取用户信息失败 ${taskData.taskId} ${cookie} ${JSON.stringify(userInfo)}`);
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult?.msg ? pubResult.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }

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
      userInfo.data?.tname ?? '',
      userInfo.data?.wemediaId ?? '',
      taskData,
    );

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
    const uploadedCovers = await uploadCovers(
      cookie,
      taskData.covers,
      userInfo?.data?.wemediaId ?? '',
      userInfo?.data?.tname ?? '',
    );

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    //组装数据
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    const postData = buildPostData(taskData, content, uploadedCovers, userInfo?.data?.wemediaId ?? '');

    console.debug('网易号推送数据', taskData.taskId, cookie, postData);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);
    const publishResult = await publishArticle(cookie, postData, userInfo?.data?.wemediaId ?? '', webProxy);
    console.debug('网易号推送返回数据', taskData.taskId, publishResult);

    pubResult.code = publishResult?.code === 1 ? 0 : -1;
    pubResult.msg = publishResult?.msg;

    pubResult.publishId = publishResult.data;
    if (pubResult.publishId?.includes('html,')) {
      pubResult.publishId = pubResult.publishId.split('html,')[1];
    } else if (pubResult.publishId?.includes('docId=')) {
      pubResult.publishId = pubResult.publishId.split('docId=')[1]?.split('&')[0];
    }

    if (pubResult.code == 0) {
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
      logger.error(`网易号文章发布失败 ${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(publishResult)}`);
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
    logger.error(`网易号文章发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
    if (pubResult.msg?.includes('您的账号未上线')) {
      pubResult.msg = '发布失败，账号暂无发布权益，请前往官方创作者中心开通后再试。';
    }
  }

  return pubResult;
};

const replaceImgInHtml = async (
  cookie: string,
  content: string,
  taskId: string,
  eventCallback: EventEmitter,
  wemediaId: string,
  nickName: string,
  taskData: WangyihaoArticleTaskInput,
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
        const result = await getImgFromUrl(cookie, imgUrl);
        if (result.data) {
          uploadedUrl = result?.data[imgUrl];
        }
      }

      //下载后再上传
      if (!uploadedUrl) {
        const imgData = await readImageData(imgUrl, 'jpeg');

        if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
          throw new Error(`图片读取失败-${imgData.status}-${imgUrl}`);
        }
        const binaryResult = await uploadImageBinary(cookie, imgData.data, nickName, wemediaId, imgData.ext);
        uploadedUrl = binaryResult?.data?.url;
        if (!uploadedUrl) {
          throw new Error(`图片上传失败-${binaryResult?.msg}-${imgUrl}`);
        }
      }

      //上传成功，替换内容中图片相关信息
      if (uploadedUrl) {
        img.setAttribute('src', uploadedUrl);
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

const uploadCovers = async (
  cookie: string,
  covers: Array<ImageInfo>,
  accountId: string,
  nickName: string,
): Promise<Array<string>> => {
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

      let uploadedUrl;

      //直接官方转换
      if (imgUrl.toLowerCase().startsWith('http')) {
        const result = await getImgFromUrl(cookie, imgUrl);
        if (result?.data) {
          uploadedUrl = result?.data[imgUrl];
        }
      }

      //下载后再上传
      if (!uploadedUrl) {
        const imgData = await readImageData(imgUrl, 'jpeg');

        if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
          throw new Error(`图片读取失败-${imgData.status}-${imgUrl}`);
        }
        const binaryResult = await uploadImageBinary(cookie, imgData.data, nickName, accountId, imgData.ext);
        uploadedUrl = binaryResult?.data?.url;
        if (!uploadedUrl) {
          throw new Error(`图片上传失败-${binaryResult?.msg}-${imgUrl}`);
        }
      }

      if (!uploadedUrl) {
        throw new Error(`封面图片上传失败-${imgUrl}`);
      }
      upCovers.push(uploadedUrl);
      if (upCovers.length >= 3) {
        break;
      }
    }
  }

  return upCovers;
};

const buildPostData = (
  taskData: WangyihaoArticleTaskInput,
  content: string,
  coverImages: Array<string>,
  wemediaId: string,
): string => {
  const argsList = new Array<string>();

  argsList.push(`sign=&timestamp=${Date.now()}&onlineState=2&firstPub=2`);
  argsList.push(`picUrl=${encodeURIComponent(coverImages.join('||')) ?? ''}`);
  argsList.push(`content=${encodeURIComponent(content ?? '')}`);
  argsList.push('articleId=-1');
  argsList.push(`cover=${coverImages?.length >= 3 ? 'threeImg' : coverImages?.length > 0 ? 'custom' : 'auto'}`);
  argsList.push(`operation=${taskData.pubType === 0 ? 'saveDraft' : 'publish'}`);
  argsList.push(`wemediaId=${wemediaId}`);
  argsList.push(`title=${encodeURIComponent(taskData.title)}`);

  //话题
  argsList.push('subjectId=');

  //定时发布
  if (taskData.publishTime) {
    argsList.push(
      `scheduled=1&publishTime=${encodeURIComponent(dayjs(taskData.publishTime).format('YYYY-MM-DD HH:mm:ss'))}`,
    );
  } else {
    argsList.push('scheduled=0');
  }
  //原创
  if (taskData.original === 1) {
    argsList.push('original=1');
  } else {
    argsList.push('original=0');
  }

  //申明
  if (taskData.creativeStatement) {
    argsList.push(`creativeStatement=${encodeURIComponent(taskData.creativeStatement)}`);
  }

  return argsList.join('&');
};

export interface WangyihaoArticleTaskInput {
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
   * 原创申明 1:申明 0:不申明
   */
  original?: 1 | 0;

  /**
   * 定时发布时间戳 13位
   */
  publishTime?: number;

  /**
   *创作申明
   * 内容由AI生成
   * 个人原创，仅供参考
   * 取材网络，谨慎辨别
   * 虚构演绎，仅供娱乐
   */
  creativeStatement?: string;

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}

export interface WangyihaoPublishResultOutput extends BaseResult {
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
