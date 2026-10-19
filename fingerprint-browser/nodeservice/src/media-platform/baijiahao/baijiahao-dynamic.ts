import {
  Guid,
  htmlDecode,
  logger,
  publishStatusEnum,
  readImageData,
  SetProgressEvent,
  SetProgressNewEvent,
  Task,
} from '@/utils';
import { ImageInfo, ListItemInfo } from '../baseModel';
import { errorCode } from '../errorCode';
import { AxiosError } from 'axios';
import { EventEmitter } from 'events';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import { BaijiahaoActivityInfo, BaijiahaoLocationItem, BaijiahaoPublishResultOutput } from '@/media-platform';
import { getImgFromUrl, uploadImageBinary } from './baijiahao-article.service';
import { getBaijiahaoUserInfoAsync } from './baijiahao-user.service';
import { HtmlAgilityPack } from '@/article-parse/common/HtmlAgilityPack';
import { getTopicListAsync } from './baijiahao-topic.service';
import { publishBaiJiaDynamicResponse } from '@/media-platform/baijiahao/baijiahao-dynamic.service';
import { getBaijiahaoBaseToken } from '@/media-platform/baijiahao/baijiahao-common';
import {
  getBaiJiaDynamicContentListAsync,
  getContentListAsync,
} from '@/media-platform/baijiahao/baijiahao-content-list.service';

/**
 * 发布百家图文
 * @param cookie
 * @param taskData 发布任务数据体
 * @param appId
 * @param token
 * @param eventCallback 回调事件
 * @param retryTimes 最大重试次数
 */
export const publishBaijiahaoDynamic = async (
  cookie: string,
  taskData: BaiJiaHaoDynamicTaskInput,
  appId: number = 0,
  token: string = '',
  eventCallback: EventEmitter,
  retryTimes: number = 3,
): Promise<BaijiahaoPublishResultOutput> => {
  logger.info(`百家图文发布 ${taskData.taskId}`);
  const pubResult: BaijiahaoPublishResultOutput = {
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
    SetProgressNewEvent(eventCallback, publishStatusEnum.uploading, '开始发布', taskData.taskId);
    SetProgressEvent(eventCallback, 1, '准备上传图片', taskData.taskId);

    if (!(taskData.images?.length > 0)) {
      pubResult.code = 2;
      pubResult.msg = '最少需要一张图片';
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult?.msg ? pubResult.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }

    if (!appId) {
      const userInfo = await getBaijiahaoUserInfoAsync(cookie);
      appId = userInfo?.data?.user?.app_id;
    }
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (!token) {
      const tokenObj = await getBaijiahaoBaseToken(cookie);
      token = tokenObj.token;
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    //最多支持9张图
    taskData.images = taskData.images.slice(0, 9);

    SetProgressEvent(eventCallback, 3, '正在上传图片', taskData.taskId);

    // region 图片上传
    const imgInfoList: Array<BaiJiaHaoDynamicImage> = [];
    let processCount = 0;

    for (const img of taskData.images) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      SetProgressEvent(eventCallback, (80 / taskData.images.length) * processCount + 5, '图片上传中', taskData.taskId);
      processCount++;
      let imageUploadResult = await uploadImageProcess(taskData.taskId, img.pathOrUrl, cookie, appId, pubResult);
      for (let i = 0; i < retryTimes; i++) {
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);
        if (!imageUploadResult?.url) {
          if (i < retryTimes - 1 && pubResult?.code != -100) {
            imageUploadResult = await uploadImageProcess(taskData.taskId, img.pathOrUrl, cookie, appId, pubResult);
            continue;
          }
          pubResult.code = pubResult?.code ?? errorCode.data_error;
          pubResult.msg = pubResult?.msg ?? `图片上传失败${img.pathOrUrl}`;
          logger.error(
            `图片上传失败 ${taskData.taskId} ${cookie} ${img.pathOrUrl} ${JSON.stringify(
              imageUploadResult,
            )} ${JSON.stringify(pubResult)}`,
          );
          SetProgressNewEvent(
            eventCallback,
            publishStatusEnum.uploadFail,
            pubResult?.msg ? pubResult.msg : '上传失败',
            taskData.taskId,
          );
          return pubResult;
        } else {
          imgInfoList.push(imageUploadResult);
          break;
        }
      }
      if (!imageUploadResult?.url) {
        pubResult.code = pubResult?.code ?? errorCode.data_error;
        pubResult.msg = pubResult?.msg ?? '图片上传失败';
        logger.error(
          `图片上传失败 ${taskData.taskId} ${cookie} ${img.pathOrUrl} ${JSON.stringify(
            imageUploadResult,
          )} ${JSON.stringify(pubResult)}`,
        );
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploadFail,
          pubResult?.msg ? pubResult.msg : '上传失败',
          taskData.taskId,
        );
        return pubResult;
      }
    }

    // endregion

    // region 上传封面
    SetProgressEvent(eventCallback, 90, '封面上传中', taskData.taskId);

    // endregion

    //region 保存正文图片

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    //endregion

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // region 组装并推送数据
    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    //组装发布数据
    const reContent = { text: '' };
    const postData = await buildPostData(taskData, cookie, imgInfoList, reContent);
    console.debug('百家图文推送数据', taskData.taskId, cookie, postData);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);

    //推送数据
    const publishResult = await publishBaiJiaDynamicResponse(cookie, token, postData, webProxy);
    console.debug('百家图文推送返回数据', publishResult);

    pubResult.code = publishResult?.errno ?? -1;
    pubResult.msg = publishResult?.errmsg;

    if (pubResult.code == 0) {
      await Task.Delay(3000);
      const nowStr = (Date.now() / 1000).toFixed(0);
      const now = parseInt(nowStr);
      try {
        let pubId = '';
        const reList = await getBaiJiaDynamicContentListAsync(cookie, 1, 3, 'moment');
        if (reList?.data?.list?.length) {
          for (const content of reList?.data?.list) {
            if (reContent.text.startsWith(content.content)) {
              if (!pubId) {
                pubId = content.article_id;
              }
              if (Math.abs(content.create_time - now) < 30) {
                pubId = content.article_id;
                pubResult.publishId = pubId;
                break;
              }
            }
          }
        }
      } catch (e) {}
      if (!pubResult.publishId) {
        pubResult.publishId = nowStr;
      }
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
      logger.error(
        `百家图文发布失败 ${taskData.taskId} ${cookie}  ${JSON.stringify(postData)} ${JSON.stringify(publishResult)}`,
      );
    }

    return pubResult;
    // endregion
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
    logger.error(`百家图文发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
    console.groupEnd();
  }

  return pubResult;
};

export interface BaiJiaHaoDynamicTaskInput {
  cancelToken?: CancelToken;

  /**
   * 任务唯一标志id
   */
  taskId: string;
  /**
   * 封面信息
   */
  cover: {
    /**
     * 封面宽度
     */
    width?: number;
    /**
     * 封面高度
     */
    height?: number;
    /**
     * 封面字节数大小
     */
    size?: number;
    /**
     * 封面url或本地路径
     */
    pathOrUrl: string;
  };
  /**
   * 图片信息列表
   */
  images: Array<ImageInfo>;
  /**
   *  描述内容
   */
  desc?: string;

  /**
   *地理位置
   */
  location?: BaijiahaoLocationItem;

  /**
   * 一级分类
   */
  categoryName?: string;
  /**
   * 二级分类
   */
  subCategoryName?: string;

  /**
   * 定时发布，13位时间戳，不定时时默认为0
   */
  publishTime?: number;

  /**
   * AI创作申明
   */
  isAigc: boolean;

  /**
   * 活动
   */
  activity?: ListItemInfo;
  /**
   * 代理次阿叔
   */
  proxy?: KuaiDaiLiProxy;
}

/**
 * 单图片上传流程
 * @param taskId
 * @param imgUrlPath 图片url或磁盘路径
 * @param cookie
 * @param appId
 * @param pubResult
 */
const uploadImageProcess = async (
  taskId: string,
  imgUrlPath: string,
  cookie: string,
  appId: number,
  pubResult: BaijiahaoPublishResultOutput,
): Promise<BaiJiaHaoDynamicImage | null> => {
  try {
    if (imgUrlPath.startsWith('http')) {
      const imgRe = await getImgFromUrl(cookie, imgUrlPath, 'news');
      if (imgRe?.data?.bos_url) {
        return {
          width: imgRe.data.width,
          height: imgRe.data.height,
          url: imgRe.data.bos_url,
          imagePrompt: '',
          id: Guid.NewGuid().toString(),
        };
      }
    }

    const imgData = await readImageData(imgUrlPath, 'jpeg');

    if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
      throw new Error(`图片下载失败-${imgData.status}-${imgUrlPath}`);
    }

    const imgResult = await uploadImageBinary(cookie, appId, imgData.data, 'news', 'jpeg');

    if (imgResult?.ret?.bos_url) {
      pubResult.code = 0;
      pubResult.msg = '';
      return {
        width: imgResult?.ret?.width ?? 1024,
        height: imgResult?.ret?.height ?? 1024,
        url: imgResult?.ret?.bos_url,
        imagePrompt: '',
        id: Guid.NewGuid().toString(),
      };
    } else {
      pubResult.code = imgResult?.error_code ?? -1;
      pubResult.msg = imgResult?.error_msg ?? '';
      return null;
    }
  } catch (e) {
    console.error('百家图片上传失败', taskId, e);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = `图片上传失败${imgUrlPath}`;
    return null;
  }
};

interface BaiJiaHaoDynamicImage {
  width: number;
  height: number;
  url: string;
  imagePrompt: string;
  id: string;
}

/**
 * 组装推送数据
 * @param taskData 发布任务体
 * @param cookie
 * @param image
 * @param reContent
 */
const buildPostData = async (
  taskData: BaiJiaHaoDynamicTaskInput,
  cookie: string,
  image: Array<BaiJiaHaoDynamicImage>,
  reContent: { text: string },
): Promise<string> => {
  const postData = {};
  postData['images'] = image;
  let content = '';

  const topicsInfo: Array<{ id: string; name: string }> = [];
  if (taskData.desc) {
    if (taskData?.desc?.includes('<p>') || taskData.desc?.includes('<topic>')) {
      const html = new HtmlAgilityPack.HtmlDocument();
      html.LoadHtml(taskData.desc);

      const pList = html.DocumentNode.SelectNodes('//p');
      if (pList?.length > 0) {
        //话题
        const topics = html.DocumentNode.SelectNodes('//topic');
        if (topics?.length > 0) {
          for (const item of topics) {
            const text = item.getAttribute('text');
            item.textContent = `#${text}# `;
            const topicsTmp = await getTopicListAsync(cookie, htmlDecode(text ?? ''), '', 4);
            if (topicsTmp?.data?.recommend?.length || topicsTmp?.data?.hot?.length) {
              const tp = topicsTmp?.data?.recommend[0] ?? topicsTmp?.data?.hot[0];
              topicsInfo.push({ id: tp?.id ?? '', name: tp?.title ?? text });
            }
          }
        }

        //换行
        let newText = '';
        for (let pIndex = 0; pIndex < pList.length; pIndex++) {
          const pItem = pList[pIndex];
          newText = `${newText}${pItem.textContent}\n`;
        }

        content = htmlDecode(newText);
      } else {
        content = taskData.desc;
      }
    } else {
      content = taskData.desc;
    }
  }

  postData['content'] = content;
  postData['group_list'] = [];
  postData['showtofans'] = 0;

  //话题
  if (topicsInfo.length) {
    postData['target'] = { topics: topicsInfo };
  }

  //定位
  if (taskData?.location) {
    postData['poi'] = { position_lat_lng: taskData.location };
  }

  //分类
  if (taskData.categoryName) {
    postData['cate_user_cms'] = [taskData.categoryName, taskData.subCategoryName];
  }
  const activityList: Array<{ id: string; is_checked: number }> = [];
  //AI创作申明
  if (taskData.isAigc) {
    activityList.push({
      id: 'aigc_bjh_status',
      is_checked: 1,
    });
  }
  //活动
  if (taskData.activity) {
    const topiclist = (taskData.activity?.raw as BaijiahaoActivityInfo)?.topic_list;
    activityList.push({
      id: `task_${taskData.activity.yixiaoerId}`,
      is_checked: 1,
      is_need: 0,
      topic_list: topiclist,
    } as never);
  }
  // //自动生成视频
  // if (taskData?.generateVideo === true) {
  //   activityList.push({
  //     id: 'ttv',
  //     is_checked: 1,
  //   });
  // }

  //定时发布
  if (taskData.publishTime) {
    postData['timer_time'] = parseInt((taskData.publishTime / 1000).toFixed(0));
  }

  //活动
  // if (taskData.activityId) {
  //   //activityList.push({"id":`task_${taskData.activity.id}`,"is_checked":1,"is_need":0,"topic_list":taskData.activity.topic_list});
  //   content = `#${taskData.activityName}#${content}`;
  //   activityList.push({ id: `task_${taskData.activityId}`, is_checked: 1, is_need: 0, topic_list: [] });
  // }

  postData['activity_list'] = activityList;
  postData['content'] = content;
  reContent.text = content.trimStart();

  return JSON.stringify(postData);
};
