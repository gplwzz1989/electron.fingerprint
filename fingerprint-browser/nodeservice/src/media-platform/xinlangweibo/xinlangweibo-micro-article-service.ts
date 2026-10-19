import { EventEmitter } from 'events';
import { ImageInfo } from '../../media-platform/baseModel';
import {
  convertCookieStr,
  htmlDecode,
  logger,
  publishStatusEnum,
  SetProgressEvent,
  SetProgressNewEvent,
} from '../../utils';
import { getXinlangweiboTopicList, xinlangweiboUploadImage } from './xinlangweibo-common';
import { $http } from '../../http';
import { BaseResult } from '../../media-platform/baseResult';
import { XinlangweiboPublishResultOutput } from './xinlangweibo-video';
import { XinlangweiboFriendInfo } from './xinlangweibo-friend.service';
import { HtmlDocument } from '../../htmlAgilityPack';
import { XinlangweiboLocationInfo } from './xinlangweibo-location.service';
import { AxiosError } from 'axios';
import { errorCode } from '@/media-platform/errorCode';
import { getXinlangweiboIndex } from '@/media-platform/xinlangweibo/xinlangweibo-user.service';
import { KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { CancelToken, privateKey } from '@/utils/CancelToken';

/**
 * 发短内容入参
 */
export interface XinlangweiboMicroArticleTaskInput {
  cancelToken?: CancelToken;
  taskId: string;
  /**
   * 可见类型- 公开0；粉丝10；好友圈 6；仅自己可见 1； 群可见 5
   */
  visible: 0 | 10 | 6 | 1 | 5;
  /**
   * 内容
   */
  contentText?: string;
  // 图片最大限制18张
  images?: Array<ImageInfo>;
  // 话题 ： 格式["话题1","话题2"]
  topics?: Array<string>;
  // 定时发布时间戳，毫秒级13位
  schedule_timestamp?: number;

  /**
   * 要@的好友信息列表
   */
  mentionedFriends?: Array<XinlangweiboFriendInfo>;

  /**
   * 地理位置
   */
  location?: XinlangweiboLocationInfo;

  /**
   * 申明
   * 1:内容由AI生成
   * 2:内容为虚构演绎
   * 3:内容为转载
   * 4:内容为自主创作
   */
  mblog_statement?: number;
  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}

/**
 * 发短内容出参
 */
export interface XinlangweiboMicroArticlePublishResultOutput extends BaseResult {
  code: number;
  msg: string;
  // 任务id
  taskId: string;
  // 唯一id
  publishId?: number;
}

/**
 * 图片类型结构
 */
export interface XinlangweiboImageType {
  // 图片类型 image/png
  type: string;
  // 图片唯一表示
  pid: string;
  width?: number;
  height?: number;
}

/**
 * 短内容发布返回结构
 */
interface XinlangweiboPublishMicroArticleResult {
  ok: number;
  msg: string;
  data?: {
    // 创建时间
    created_at: string;
    // 作品id
    id: number;
    schedule_id: string;
    idstr: string;
    // 分享链接中的id
    mblogid: string;
    statuses: Array<{
      schedule_id: string;
    }>;
  };
}

interface PublishParams {
  content?: string; // 微博内容
  visible: number; // 可见性
  share_id: null;
  media: null;
  vote: null;
  pic_id?: string; // 图片ID数组
  mblog_statement?: number;
}
/**
 * 新浪微博短内容发布
 * @param cookie 账号cookie
 * @param uid 用户id
 * @param markpos 水印信息来自用户信息中的watermark
 * @param nick 水印信息来自用户信息中的watermark
 * @param taskData 任务数据
 * @param eventCallback 事件回调
 */
export const xinlangweiboPublishMicroArticle = async (
  cookie: string,
  uid: number,
  markpos: number,
  nick: number | string,
  taskData: XinlangweiboMicroArticleTaskInput,
  eventCallback: EventEmitter,
): Promise<XinlangweiboPublishResultOutput> => {
  logger.info(`新浪微博图文发布 ${taskData.taskId}`);
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
    // 图片发布时用到的类型
    let imageList: Array<XinlangweiboImageType> = [];

    // 短内容发布结构
    const publishParams: PublishParams = {
      content: taskData.contentText ?? '',
      visible: taskData.visible ?? 0,
      share_id: null,
      media: null,
      vote: null,
      mblog_statement: taskData.mblog_statement ? taskData.mblog_statement : undefined,
    };

    SetProgressEvent(eventCallback, 1, '准备上传图片', taskData.taskId);

    taskData.images = taskData.images?.slice(0, 18);

    // region 上传图片
    if (taskData.images && taskData.images.length > 0) {
      imageList = await privateUploadImages(
        cookie,
        uid,
        markpos,
        nick,
        taskData.images,
        eventCallback,
        taskData.taskId,
        taskData,
      );
      if (imageList.length === 0) {
        pubResult.code = 2;
        pubResult.msg = '图片上传失败';
        logger.error(`图片上传失败 ${taskData.taskId} ${cookie}  ${JSON.stringify(taskData.images)}`);
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploadFail,
          pubResult?.msg ? pubResult.msg : '上传失败',
          taskData.taskId,
        );
        return pubResult;
      } else {
        // 添加图片数组字段
        publishParams['pic_id'] = JSON.stringify(imageList);
      }
    }
    // endregion

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);

    if (taskData.contentText?.includes('<p') && taskData.contentText?.includes('</p>')) {
      //从描述中解析话题出来
      const html = new HtmlDocument();
      html.LoadHtml(taskData.contentText);
      let desc = '';
      const pList = html.DocumentNode.SelectNodes('//p');
      if (pList?.length > 0) {
        //话题
        const topics = html.DocumentNode.SelectNodes('//topic');
        if (topics?.length > 0) {
          for (const item of topics) {
            let topicStr = htmlDecode(decodeURIComponent(item.getAttribute('raw') ?? ''));
            if (!topicStr?.startsWith('{')) {
              const text = item.getAttribute('text') ?? '';
              const tmpTopic = await getXinlangweiboTopicList(cookie, text);
              if (tmpTopic?.dataList?.length) {
                topicStr = JSON.stringify(tmpTopic.dataList[0]);
              } else {
                continue;
              }
            }
            const topicItem = JSON.parse(topicStr)?.raw;
            item.textContent = `#${topicItem.topic}# `;
          }
        }
        //好友
        const friends = html.DocumentNode.SelectNodes('//friend');
        if (friends?.length > 0) {
          for (const item of friends) {
            const friendStr = htmlDecode(item.getAttribute('raw') ?? '');
            if (!friendStr || !friendStr.startsWith('{')) {
              continue;
            }
            const friendJo = JSON.parse(friendStr);
            item.textContent = `@${friendJo.screen_name} `;
          }
        }
        //换行
        let newText = '';
        for (let pIndex = 0; pIndex < pList.length; pIndex++) {
          const pItem = pList[pIndex];
          newText = `${newText}${pItem.textContent}\n`;
        }

        desc = htmlDecode(newText);
      } else {
        //话题
        const topics = html.DocumentNode.SelectNodes('//topic');
        if (topics?.length > 0) {
          for (const item of topics) {
            const topicStr = htmlDecode(item.getAttribute('raw') ?? '');
            const topicItem = topicStr?.startsWith('{') ? JSON.parse(topicStr) : null;
            if (!topicItem) {
              continue;
            }
            item.textContent = `#${topicItem.topic}# `;
          }
        }
        //好友
        const friends = html.DocumentNode.SelectNodes('//friend');
        if (friends?.length > 0) {
          for (const item of friends) {
            const friendStr = htmlDecode(item.getAttribute('raw') ?? '');
            if (!friendStr || !friendStr.startsWith('{')) {
              continue;
            }
            const friendJo = JSON.parse(friendStr);
            item.textContent = `@${friendJo.screen_name}`;
          }
        }
        desc = htmlDecode(html.DocumentNode.InnerText());
      }
      publishParams.content = desc;
    } else {
      // 话题处理
      if (taskData.topics && taskData.topics.length > 0) {
        publishParams.content += taskData.topics.map((topic) => `#${topic}#`).join(' ');
      }

      // 好友处理
      if (taskData.mentionedFriends && taskData.mentionedFriends?.length > 0) {
        publishParams.content += taskData.mentionedFriends.map((user) => ` @${user.screen_name}`).join('');
      }
    }

    //地点
    if (taskData.location?.pc_title) {
      publishParams.content = `${publishParams.content}${taskData.location.pc_title}`;
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (taskData.schedule_timestamp) {
      // 定时发布
      publishParams['schedule_timestamp'] = taskData.schedule_timestamp;
      publishParams['schedule_beijing_tz'] = 0;
      publishParams['schedule_id'] = '';
    }
    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    // 数据推送
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);
    const result = await publish(cookie, publishParams, !!taskData.schedule_timestamp);
    // 发布失败
    if (result.ok !== 1) {
      pubResult.code = 2;
      pubResult.msg = result.msg;
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      SetProgressEvent(eventCallback, 100, `发布失败：${result.msg}`, taskData.taskId);
      logger.error(
        `新浪微博图文发布失败 ${taskData.taskId} ${cookie} ${JSON.stringify(publishParams)} ${JSON.stringify(result)}`,
      );
    } else {
      pubResult.msg = '发布成功';
      pubResult.publishId = result?.data?.schedule_id?.toString() ?? result?.data?.id?.toString() ?? '';
      if (taskData.schedule_timestamp && !pubResult?.publishId && result?.data?.statuses?.length) {
        pubResult.publishId = result?.data?.statuses?.[0]?.schedule_id?.toString() ?? '';
      }
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
    logger.error(`新浪微博图文发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
    if (pubResult?.msg?.includes('账号信息不完整')) {
      pubResult.msg = '账号信息不完整，请退出账号重新授权后再试。';
    }
    if (pubResult?.msg?.includes('abnormal account')) {
      pubResult.msg = '账号存在异常，请前往官方创作者中心确认后再试。';
    }
  }

  return pubResult;
};

const privateUploadImages = async (
  cookie: string,
  uid: number,
  markpos: number,
  nick: number | string,
  images: Array<ImageInfo>,
  eventCallback: EventEmitter,
  taskId: string,
  taskData: XinlangweiboMicroArticleTaskInput,
): Promise<Array<XinlangweiboImageType>> => {
  const imageList: Array<XinlangweiboImageType> = [];
  let processCount = 0;
  for (const { pathOrUrl } of images) {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    SetProgressEvent(eventCallback, (80 / images.length) * processCount + 5, '图片上传中', taskId);
    processCount++;
    const imageResult = await xinlangweiboUploadImage(cookie, uid, markpos, nick, pathOrUrl);
    if (!imageResult?.data?.pic?.pid && imageResult?.data?.count === -5) {
      throw new Error(`图片上传失败:${pathOrUrl},请前往创作中心发布验证账号后重试`);
    }
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (!imageResult.data.ret) {
      SetProgressEvent(eventCallback, 90, '图片上传失败', taskId);
      return [];
    }

    const matches = /\.([^.]+)$/.exec(pathOrUrl);
    const ext = matches ? matches[1] : 'jpg';
    imageList.push({
      type: `image/${ext}`,
      pid: imageResult.data.pic.pid,
    });
  }
  return imageList;
};

/**
 * 数据推送至平台
 * @param cookie
 * @param postData
 * @param isPrePub
 */
const publish = async (
  cookie: string,
  postData: PublishParams,
  isPrePub: boolean,
): Promise<XinlangweiboPublishMicroArticleResult> => {
  const publishUrl = isPrePub
    ? 'https://weibo.com/ajax/statuses/schedule/upload'
    : 'https://weibo.com/ajax/statuses/update';

  // 提取 XSRF-TOKEN
  const xsrfTokenMatch = /XSRF-TOKEN=([^;\s]+)/.exec(cookie) ?? /X-CSRF-TOKEN=([^;\s]+)/.exec(cookie);
  const xsrfToken = xsrfTokenMatch ? xsrfTokenMatch[1] : null;

  const header = {
    Origin: 'https://weibo.com',
    Referer: 'https://weibo.com/',
    cookie: cookie,
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Xsrf-Token': xsrfToken,
  };

  const result = await $http.post(publishUrl, postData, {
    headers: header,
  });
  return result.data;
};
