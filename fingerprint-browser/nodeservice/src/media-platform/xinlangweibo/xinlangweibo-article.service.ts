import { EventEmitter } from 'events';
import { convertCookieStr, logger, publishStatusEnum, SetProgressEvent, SetProgressNewEvent } from '../../utils';
import {
  createXinlangweiboDraft,
  generateRandomString,
  xinlangweiboCoverUploadImage,
  xinlangweiboUploadImage,
} from './xinlangweibo-common';
import { $http } from '../../http';
import FormData from 'form-data';
import type { WeiboToutiaoCollectionInfo } from './xinlangweibo-collection.service';
import type { XinlangweiboFriendInfo } from './xinlangweibo-friend.service';
import type { XinlangweiboPublishResultOutput } from './xinlangweibo-video';
import { AxiosError } from 'axios';
import { errorCode } from '../../media-platform/errorCode';
import { HtmlDocument } from '../../htmlAgilityPack';
import { ImageInfo } from '../../media-platform/baseModel';
import { getXinlangweiboIndex } from '@/media-platform/xinlangweibo/xinlangweibo-user.service';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '../webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { CancelToken, privateKey } from '@/utils/CancelToken';

/**
 * 头条文章专栏结构
 */
export interface WeiBoToutiaoCollection {
  // 合集名称
  title: string;
  sibling: number;
  allow_free: number;
  source: number;
  // 合集id
  id: number;
}

/**
 * 推荐文章结构
 */
interface ArticleRecommend {
  list: Array<{
    // 标题
    title: string;
    // oid
    oid: string;
  }>;
  switch: number;
}

/**
 * 新浪微博头条文章入参结构
 */
export interface XinlangweiboArticleTaskInput {
  cancelToken?: CancelToken;
  // 任务标识符
  taskId: string;

  // 0 草稿箱  1 发布
  pubType: number;

  // 用户id，用户信息接口中uid
  uid: number;

  // 水印位置，1:底部居右，2:底部居中，3:图片中心
  markpos: number;

  /**
   * 水印名称，为空时表示不使用水印
   */
  nick: string;

  // 文章标题
  title: string;

  // 文章内容html字符串
  content: string;

  // 文章封面图片
  cover: ImageInfo;

  // 仅粉丝阅读全文（1表示粉丝，0表示全部）
  follow_to_read?: number;

  // 文章 导语
  summary?: string;

  /**
   * 头条文章专栏列表，目前只支持选择一个合集
   */
  collection?: Array<WeiboToutiaoCollectionInfo>;

  // 推荐文章
  article_recommend?: ArticleRecommend;

  // 仅在rank:0公开下使用
  // 内容声明 0：无， 1：内容又AI生产， 2：内容为虚构演绎
  mblog_statement?: number;

  //如下为微博内容

  /**
   *可见类型 10：粉丝 0：公开
   */
  rank: number;

  /**
   * 定时发布时间 yyyy-MM-dd HH:mm
   */
  time: string;
  /**
   * 微博内容描述，当不给值时，默认按照官方规则使用文章标题拼接
   */
  contentText: string;

  /**
   * 微博话题
   */
  topics: Array<string>;

  /**
   * 1@微博好友列表
   */
  mentionedFriends: Array<XinlangweiboFriendInfo>;

  /**
   * 代理信息
   */
  proxy?: KuaiDaiLiProxy;
}

export const xinlangweiboPublishArticle = async (
  cookie: string,
  taskData: XinlangweiboArticleTaskInput,
  eventCallback: EventEmitter,
): Promise<XinlangweiboPublishResultOutput> => {
  logger.info(`微博头条文章发布 ${taskData.taskId}`);
  // 文章发布结果
  const pubResult: XinlangweiboPublishResultOutput = {
    code: 0,
    msg: '',
    taskId: taskData.taskId,
  };

  try {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    cookie = convertCookieStr(cookie, 'weibo.com');
    const newCookie = await getXinlangweiboIndex(cookie);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (newCookie?.cookie) {
      cookie = newCookie.cookie;
    }
    SetProgressNewEvent(eventCallback, publishStatusEnum.uploading, '开始发布', taskData.taskId);
    let webProxy: HttpsProxyAgent<string> | object | undefined = undefined;
    if (taskData.proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(taskData.proxy);
    }
    // 文章发布结构
    const publishParams = {
      title: taskData.title,
      follow_to_read: taskData.follow_to_read ?? 0,
      subtitle: '',
      type: '',
      writer: '',
      summary: '',
      collection: [],
      status: 0,
      publish_at: '',
      updated: '',
      content_type: 0,
    };

    SetProgressEvent(eventCallback, 1, '准备上传封面', taskData.taskId);
    // 封面处理

    if (taskData.cover?.pathOrUrl) {
      SetProgressEvent(eventCallback, 2, '封面上传中', taskData.taskId);
      const coverResult = await xinlangweiboCoverUploadImage(cookie, taskData.cover.pathOrUrl);

      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      if (coverResult.data.code !== 'A00006') {
        SetProgressEvent(eventCallback, 10, `封面上传失败:${coverResult.data?.errno}`, taskData.taskId);
        pubResult.code = -2;
        pubResult.msg = `封面上传失败:${taskData.cover?.pathOrUrl}${
          coverResult?.data?.count === -5 ? '无权上传，请前往创作中心验证账号后重试' : ''
        }`;
        logger.error(`封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover} ${JSON.stringify(coverResult)}`);
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploadFail,
          pubResult?.msg ? pubResult.msg : '上传失败',
          taskData.taskId,
        );
        return pubResult;
      } else {
        // 根据pid解析图片URl
        publishParams['cover'] = `https://wx2.sinaimg.cn/large/${coverResult.data.data?.pics?.pic_1.pid}.jpg`;
      }
    } else {
      SetProgressEvent(eventCallback, 10, '封面地址不正确,上传失败', taskData.taskId);
      pubResult.code = -2;
      pubResult.msg = `封面地址不正确,上传失败:${taskData.cover}`;
      logger.error(`封面地址不正确,上传失败 ${taskData.taskId} ${cookie} ${taskData.cover}`);
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult?.msg ? pubResult.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    SetProgressEvent(eventCallback, 15, '封面上传成功', taskData.taskId);
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    SetProgressEvent(eventCallback, 20, '准备发布文章', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // 准备草稿箱 获取文章id
    const draftResult = await createXinlangweiboDraft(cookie, taskData.uid);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!draftResult?.data?.data?.id) {
      pubResult.code = -1;
      pubResult.msg = '创建草稿失败:' + draftResult.msg;
      logger.error(`创建草稿失败 ${taskData.taskId} ${cookie} ${taskData.uid} ${JSON.stringify(draftResult)}`);
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '创建草稿失败',
        taskData.taskId,
      );
      return pubResult;
    }

    publishParams['id'] = draftResult.data.data.id;
    // 处理正文中的图片， 替换位平台的url
    publishParams['content'] = await replaceImageSrcInContent(
      cookie,
      taskData.content,
      taskData.uid,
      taskData.markpos,
      taskData.nick,
      taskData.taskId,
      eventCallback,
      taskData,
    );

    const params = buildPublishParams(taskData, publishParams);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (taskData.pubType === 0) {
      //不可取消
      taskData.cancelToken?.disable(privateKey);
    }

    //保存草稿
    const saveResult = await saveArticle(cookie, taskData.uid, draftResult.data?.data?.id?.toString() ?? '', params);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (taskData.pubType == 0) {
      pubResult.code = saveResult.code == 100000 ? 0 : -1;
      pubResult.msg = saveResult.msg;
      if (pubResult.code === 0 && draftResult.data?.data?.id) {
        pubResult.publishId = draftResult.data.data.id;
        SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送草稿成功', taskData.taskId);
      } else {
        logger.error(
          `保存草稿失败 ${taskData.taskId} ${cookie} ${JSON.stringify(params)} ${JSON.stringify(saveResult)}`,
        );
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.pushFail,
          pubResult?.msg ? pubResult.msg : '推送草稿失败',
          taskData.taskId,
        );
      }
      return pubResult;
    }

    let text = taskData.contentText ? taskData.contentText : `发布了头条文章：《${taskData.title}》`;

    //话题
    if (taskData.topics && taskData.topics.length > 0) {
      text += taskData.topics.map((topic) => `#${topic}#`).join(' ');
    }

    // 好友处理
    if (taskData.mentionedFriends && taskData.mentionedFriends?.length > 0) {
      text += taskData.mentionedFriends.map((user) => ` @${user.screen_name}`).join('');
    }

    const pushData = {
      id: draftResult.data.data.id,
      rank: taskData.rank ?? 0,
      mblog_statement: taskData.mblog_statement ?? 0,
      text: text,
      only_render_h5: 0,
      is_aigc_used: 0,
      is_original: 0,
      mpkey: 0,
      time: taskData.time ? taskData.time : '',
      timestamp: taskData.time ? 8 : '',
      support_all_tag: 1,
      ver: 4.0,
    };

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);

    // 发布文章
    const publishArticleResult = await pushArticle(
      cookie,
      taskData.uid,
      draftResult.data?.data?.id ?? '',
      pushData,
      webProxy,
    );

    if (publishArticleResult.code == 100000 && publishArticleResult?.data?.object_id) {
      pubResult.code = 0;
      pubResult.publishId = publishArticleResult?.data?.object_id;
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布文章成功', taskData.taskId);
    } else {
      pubResult.code = publishArticleResult?.code ? publishArticleResult.code : -1;
      pubResult.msg = publishArticleResult.msg;
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      SetProgressEvent(eventCallback, 99, '发布文章失败', taskData.taskId);
      logger.error(
        `微博头条文章发布失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pushData)} ${JSON.stringify(
          publishArticleResult,
        )}`,
      );
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
    logger.error(`微博头条文章发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
    if (pubResult?.msg?.includes('请手动保存后重新提交')) {
      pubResult.msg =
        '每日发布首条新浪微博文章，需前往平台验证身份（打开新浪微博首页，进入“头条文章”编辑页面点击<下一步>完成验证）';
    }
    if (pubResult?.msg?.includes('abnormal account')) {
      pubResult.msg = '账号存在异常，请前往官方创作者中心确认后再试。';
    }
  }

  return pubResult;
};

const saveArticle = async (cookie: string, uid: number, draftId: string, publishParams) => {
  const rid = generateRandomString(16);

  const url = `https://card.weibo.com/article/v3/aj/editor/draft/save?uid=${uid}&id=${draftId}&_rid=${rid}`;

  const header = {
    Cookie: cookie,
    Origin: 'https://card.weibo.com',
    Referer: 'https://card.weibo.com/article/v3/editor',
    'Content-Type': 'application/x-www-form-urlencoded',
    'Sn-Reqid': rid,
  };

  const result = await $http.post(url, publishParams, {
    headers: header,
  });

  return result.data;
};

const pushArticle = async (
  cookie: string,
  uid: number,
  draftId: string,
  publishParams,
  proxyAgent?: HttpsProxyAgent<string> | object,
) => {
  const rid = generateRandomString(16);

  const url = `https://card.weibo.com/article/v3/aj/editor/draft/publish${
    publishParams.time ? 'timing' : ''
  }?uid=${uid}&id=${draftId}&_rid=${rid}`;

  const header = {
    Cookie: cookie,
    Origin: 'https://card.weibo.com',
    Referer: 'https://card.weibo.com/article/v3/editor',
    'Content-Type': 'application/x-www-form-urlencoded',
    'Sn-Reqid': rid,
  };

  const result = await $http.post(url, publishParams, {
    headers: header,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

/**
 * 构建发布参数
 * @param taskData
 * @param params
 */
const buildPublishParams = (taskData: XinlangweiboArticleTaskInput, params: object) => {
  let publishParams = {};
  const formData = new FormData();
  // 导语处理
  if (taskData?.summary) {
    publishParams['summary'] = taskData.summary;
    formData.append('summary', taskData.summary);
  }

  // 合集处理
  if (taskData?.collection && taskData?.collection?.length > 0) {
    publishParams['collection'] = taskData.collection.map((obj) => ({
      allow_free: obj.allow_free,
      id: obj.id,
      title: obj.title,
      sibling: obj.sibling,
      source: obj.source,
    }));
  }

  // 推荐文章处理
  if (taskData?.article_recommend && taskData?.article_recommend?.list?.length > 0) {
    publishParams['article_recommend'] = taskData.article_recommend;
  }

  const collect = publishParams['collection'];
  publishParams = { ...publishParams, ...params };
  publishParams['collection'] = JSON.stringify(collect);
  return publishParams;
};

/**
 * 替换正文中的图片地址；变更成平台官方地址
 * @param cookie
 * @param content
 * @param uid
 * @param markpos
 * @param nick
 * @param taskId
 * @param eventCallback
 * @param taskData
 */
const replaceImageSrcInContent = async (
  cookie: string,
  content: string,
  uid: number,
  markpos: number,
  nick: string,
  taskId: string,
  eventCallback: EventEmitter,
  taskData: XinlangweiboArticleTaskInput,
) => {
  const dom = new HtmlDocument();
  dom.LoadHtml(content);

  const imgElements = dom.DocumentNode.SelectNodes('//img');

  // 无图片
  if (imgElements?.length === 0) {
    return content;
  }

  // 有图片
  const processCount = 0;
  for (const imageNode of imgElements) {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    SetProgressEvent(eventCallback, (80 / imgElements.length) * processCount + 5, '内容图片上传中', taskId);

    let imgUrl = imageNode.getAttribute('src') ?? imageNode.getAttribute('data-src');
    if (!imgUrl) {
      continue;
    }
    if (imgUrl?.startsWith('//')) {
      imgUrl = `https:${imgUrl}`;
    }
    const result = await xinlangweiboUploadImage(cookie, uid, markpos, nick, imgUrl, 3);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // 图片上传失败
    if (!result.data.ret) {
      SetProgressEvent(eventCallback, 90, '内容图片上传失败', taskId);
      throw new Error(
        `图片上传失败-${imgUrl}${result?.data?.count === -5 ? '无权上传，请前往创作中心验证账号后重试' : ''}`,
      );
    }
    imageNode.setAttribute('src', `https://wx3.sinaimg.cn/large/${result.data.pic.pid}.jpg`);
  }

  return dom.DocumentNode.OuterHtml();
};
