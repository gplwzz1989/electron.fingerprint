import { EventEmitter } from 'events';
import {
  htmlDecode,
  logger,
  publishStatusEnum,
  readImageData,
  SetProgressEvent,
  SetProgressNewEvent,
  Task,
} from '@/utils';
import { AxiosError } from 'axios';
import { errorCode } from '../errorCode';
import { HtmlDocument } from '@/htmlAgilityPack';
import { ImageInfo } from '../baseModel';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import { BaseResult } from '../baseResult';
import { getImgFromUrl, publishArticle } from './souhuhao-article.service';
import { getSouhuhaoUserInfo } from './souhuhao-common';
import { uploadImageAsync } from './souhuhao-video.service';
import { SouhuhaoTopicItem } from './souhuhao-topic.service';
import dayjs from 'dayjs';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '../webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 *
 * @param cookie
 * @param taskData
 * @param eventCallback
 */
export const publishSouhuhaoArticle = async (
  cookie: string,
  taskData: SouhuhaoArticleTaskInput,
  eventCallback: EventEmitter,
): Promise<SouhuhaoPublishResultOutput> => {
  logger.info(`搜狐号图文发布 ${taskData.taskId}`);
  const pubResult: SouhuhaoPublishResultOutput = {
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
    let souhuAccountId: number = 0;
    const userInfoPre = await getSouhuhaoUserInfo(cookie);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (userInfoPre?.code) {
      pubResult.msg = userInfoPre.msg;
      pubResult.code = userInfoPre.code;
      logger.error(`获取用户信息失败 ${taskData.taskId} ${cookie} ${JSON.stringify(userInfoPre)}`);
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult?.msg ? pubResult.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }
    //const userInfo = userInfoPre.data?.data['0'].accountInfos[0];
    souhuAccountId = Number(userInfoPre.yixiaoerId) ?? 0;
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
      souhuAccountId,
      taskData,
    );
    // 随机一个500-1000的数字延时
    await Task.Delay(Math.floor(Math.random() * 501) + 500);

    pubResult.code = 0;
    pubResult.msg = '';

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressEvent(eventCallback, 80, '准备上传封面', taskData.taskId);
    //上传封面
    const uploadedCovers = await uploadCovers(cookie, taskData.covers, souhuAccountId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);

    //组装数据
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    const postData = buildPostData(
      taskData,
      content,
      uploadedCovers,
      (userInfoPre?.raw as { channelId: string })?.channelId?.toString(),
      souhuAccountId,
    );

    console.debug('搜狐号推送数据', taskData.taskId, cookie, postData);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);
    const publishResult = await publishArticle(
      cookie,
      taskData.pubType,
      postData,
      souhuAccountId,
      !!taskData.publishTime,
      webProxy,
    );
    console.debug('搜狐号推送返回数据', taskData.taskId, publishResult);

    pubResult.code = publishResult?.code === 2000000 ? 0 : -1;
    pubResult.msg = publishResult?.msg;

    const resultStr = JSON.stringify(publishResult.data);

    if (resultStr?.includes('ailureRelatedNewsTitle')) {
      pubResult.code = -1;
      pubResult.msg = '与已有原创文章冲突';
      logger.error(
        `与已有原创文章冲突 ${taskData.taskId} ${cookie} ${JSON.stringify(postData)} ${JSON.stringify(publishResult)}`,
      );
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      return pubResult;
    } else if (resultStr?.includes('originalStatus":10')) {
      pubResult.code = -1;
      pubResult.msg = '申明原创失败:请检查内容';
      logger.error(
        `申明原创失败:请检查内容 ${taskData.taskId} ${cookie} ${JSON.stringify(postData)} ${JSON.stringify(
          publishResult,
        )}`,
      );
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      return pubResult;
    }

    if (pubResult.code == 0 && resultStr?.startsWith('{')) {
      pubResult.publishId = publishResult.data.toString();
      if (!pubResult?.publishId) {
        pubResult.code = pubResult.code === 0 ? -1 : pubResult.code;
        if (pubResult.msg?.includes('msg:')) {
          pubResult.msg = pubResult.msg?.split('msg:')[1];
        }
        pubResult.msg = `发布失败${pubResult.msg}`;
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.pushFail,
          pubResult?.msg ? pubResult.msg : '推送失败',
          taskData.taskId,
        );
        SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
        logger.error(
          `搜狐号文章发布失败 ${taskData.taskId} ${cookie} ${JSON.stringify(postData)} ${JSON.stringify(
            publishResult,
          )}`,
        );
      } else {
        SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
        SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
      }
    } else if (pubResult.code === 0) {
      pubResult.publishId = resultStr.replace(/"/g, '');
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      if (pubResult.msg?.includes('msg:')) {
        pubResult.msg = pubResult.msg?.split('msg:')[1];
      }
      pubResult.msg = `发布失败${pubResult.msg}`;
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
      logger.error(
        `搜狐号文章发布失败 ${taskData.taskId} ${cookie} ${JSON.stringify(postData)} ${JSON.stringify(publishResult)}`,
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
    logger.error(`搜狐号文章发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
    console.groupEnd();
  }

  return pubResult;
};

const replaceImgInHtml = async (
  cookie: string,
  content: string,
  taskId: string,
  eventCallback: EventEmitter,
  userId: number,
  taskData: SouhuhaoArticleTaskInput,
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
        const result = await getImgFromUrl(cookie, imgUrl, userId);
        uploadedUrl = result?.url ?? result?.tl?.url ?? result.ori?.url;
      }

      //下载后再上传
      if (!uploadedUrl) {
        const imgData = await readImageData(imgUrl, 'jpeg');

        if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
          throw new Error(`图片读取失败-${imgData.status}-${imgUrl}`);
        }
        const binaryResult = await uploadImageAsync(cookie, userId, imgData.data, imgData.ext, 'article');
        uploadedUrl = binaryResult?.url ?? binaryResult?.tl?.url ?? binaryResult.ori?.url;
        if (!uploadedUrl) {
          throw new Error(`图片上传失败:${binaryResult?.msg ?? binaryResult?.code}-${imgUrl}`);
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

const uploadCovers = async (cookie: string, covers: Array<ImageInfo>, accountId: number): Promise<Array<string>> => {
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
        const result = await getImgFromUrl(cookie, imgUrl, accountId);
        uploadedUrl = result?.url || result?.tl?.url || result?.ori?.url;
      }

      //下载后再上传
      if (!uploadedUrl) {
        const imgData = await readImageData(imgUrl, 'jpeg');

        if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
          throw new Error(`图片读取失败-${imgData.status}-${imgUrl}`);
        }
        const binaryResult = await uploadImageAsync(cookie, accountId, imgData.data, imgData.ext, 'article');
        uploadedUrl = binaryResult?.url ?? binaryResult?.tl?.url ?? binaryResult.ori?.url;
        if (!uploadedUrl) {
          throw new Error(`封面图片上传失败-${imgUrl}`);
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
  taskData: SouhuhaoArticleTaskInput,
  content: string,
  coverImages: Array<string>,
  userChannelId: string,
  accountId: number,
): string => {
  const argsList = new Array<string>();

  argsList.push('title=' + encodeURIComponent(taskData.title ?? ''));
  argsList.push('brief=' + encodeURIComponent(taskData.desc?.toString() ?? ''));
  argsList.push('content=' + encodeURIComponent(htmlDecode(content)));
  argsList.push(`channelId=${userChannelId}`);
  argsList.push('categoryId=-1');
  argsList.push('id=0&userColumnId=0');
  argsList.push('businessCode=0');
  argsList.push('isAd=0');
  //信息来源
  if (!taskData.infoResource?.type) {
    argsList.push('infoResource=0&sourceUrl=');
  } else {
    argsList.push(`infoResource=${taskData.infoResource.type}&sourceUrl=${taskData.infoResource.sourceUrl ?? ''}`);
  }
  //原创
  argsList.push('isOriginal=' + (taskData.original ? 'true' : 'false'));
  argsList.push('cover=' + encodeURIComponent(coverImages?.length > 0 ? coverImages[0] : ''));
  argsList.push('attrIds=');
  argsList.push(`accountId=${accountId}`);
  //定时发布
  if (taskData.publishTime) {
    argsList.push(`scheduleTime=${encodeURIComponent(dayjs(taskData.publishTime).format('YYYY-MM-DD HH:mm'))}`);
  }
  //话题
  if (taskData.topics && taskData.topics?.length > 0) {
    taskData.topics.forEach((topic: any) => {
      topic['uid'] = `${topic.name}1`;
    });
    argsList.push('userLabels=' + encodeURIComponent(JSON.stringify(taskData.topics)));
    argsList.push('topicIds=');
  } else {
    argsList.push('topicIds=');
  }

  return argsList.join('&');
};

export interface SouhuhaoArticleTaskInput {
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
   * 描述/摘要
   */
  desc: string;

  /**
   * 文章封面
   */
  covers: Array<ImageInfo>;

  /**
   * 文章内容 html
   */
  content: string;

  /**
   * 话题，可选，最多3个
   */
  topics?: Array<SouhuhaoTopicItem>;

  /**
   * 原创申明 1:申明 0:不申明
   */
  original?: 1 | 0;

  /**
   * 定时发布时间戳 13位
   */
  publishTime?: number;

  /**
   * 创作声明
   */
  infoResource?: {
    /**
     * 0：无声明，1：引用声明 2:包含AI创作内容 3：包含虚构创作
     */
    type: 0 | 2 | 3;
    /**
     * 当"引用声明"时，需要引用的url地址
     */
    sourceUrl?: string;
  };

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}

export interface SouhuhaoPublishResultOutput extends BaseResult {
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
