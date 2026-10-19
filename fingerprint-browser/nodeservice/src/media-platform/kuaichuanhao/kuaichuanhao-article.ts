import { EventEmitter } from 'events';
import { logger, publishStatusEnum, readImageData, SetProgressEvent, SetProgressNewEvent, Task } from '@/utils';
import { AxiosError } from 'axios';
import { errorCode } from '../errorCode';
import { HtmlDocument } from '@/htmlAgilityPack';
import { ImageInfo } from '../baseModel';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import { BaseResult } from '../baseResult';
import dayjs from 'dayjs';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '../webproxy';
import {
  covertImgFromUrl,
  getPublishToken,
  publishKuaiChuanArticleResponse,
  uploadImageResponse,
} from './kuaichuanhao-article.service';
import { KuaichuanhaoTopicInfo } from './kuaichuanhao-topic.service';

/**
 *
 * @param cookie
 * @param taskData
 * @param eventCallback
 */
export const publishKuaiChuanArticle = async (
  cookie: string,
  taskData: KuaiChuanHaoArticleTaskInput,
  eventCallback: EventEmitter,
): Promise<KuaichuanhaoPublishResultOutput> => {
  logger.info(`快传号图文发布 ${taskData.taskId}`);
  const pubResult: KuaichuanhaoPublishResultOutput = {
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

    const pubToken = await getPublishToken(cookie);
    cookie=`${cookie};opennews=${pubToken.opennews}`;
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!pubToken?.data) {
      pubResult.code = pubToken?.errno ?? -1;
      pubResult.msg = pubToken?.errmsg ?? '发布失败';
      return pubResult;
    }

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    //组装数据
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    const postData = buildPostData(taskData, content, uploadedCovers, pubToken.data);

    console.debug('快传号推送数据', taskData.taskId, cookie, postData);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);
    const publishResult = await publishKuaiChuanArticleResponse(cookie, postData, taskData.pubType, webProxy);
    console.debug('快传号推送返回数据', taskData.taskId, publishResult);

    pubResult.code = publishResult?.errno ?? -1;
    pubResult.msg = publishResult?.errmsg ?? '发布失败';

    pubResult.publishId = publishResult?.data?.id?.toString();

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
      logger.error(`快传号文章发布失败 ${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(publishResult)}`);
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
    logger.error(`快传号文章发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};

const replaceImgInHtml = async (
  cookie: string,
  content: string,
  taskId: string,
  eventCallback: EventEmitter,
  taskData: KuaiChuanHaoArticleTaskInput,
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
      let groupId;

      //直接官方转换
      if (imgUrl.toLowerCase().startsWith('http')) {
        const result = await covertImgFromUrl(cookie, imgUrl);
        if (result.data?.list?.length) {
          uploadedUrl = result?.data?.list[0].url;
          groupId = result.data.group_id;
        }
      }

      //下载后再上传
      if (!uploadedUrl) {
        const imgData = await readImageData(imgUrl, 'jpeg');

        if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
          throw new Error(`图片读取失败-${imgData.status}-${imgUrl}`);
        }
        const binaryResult = await uploadImageResponse(cookie, imgData.data);
        uploadedUrl = binaryResult?.data?.url;
        if (!uploadedUrl) {
          throw new Error(`图片上传失败-${binaryResult.errmsg}-${imgUrl}`);
        }
      }

      //上传成功，替换内容中图片相关信息
      if (uploadedUrl) {
        img.setAttribute('src', uploadedUrl);
        img.setAttribute('data-replaced', 'true');
        if (groupId) {
          img.setAttribute('data-uploading', 'false');
          img.setAttribute('data-failed', 'false');
          img.setAttribute('data-ident', groupId);
        }
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
      const uploadedUrl = binaryResult?.data?.url;
      if (!uploadedUrl) {
        throw new Error(`封面图片上传失败-${binaryResult?.errmsg}-${imgUrl}`);
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
  taskData: KuaiChuanHaoArticleTaskInput,
  content: string,
  coverImages: Array<string>,
  publisToken: string,
): string => {
  const argsList = new Array<string>();

  argsList.push('exclusive=0');
  argsList.push('c_topic=&cate=');
  argsList.push('title=' + encodeURIComponent(taskData.title));
  argsList.push('content=' + encodeURIComponent(content));
  if (taskData.categoryId) {
    argsList.push(`realm=${taskData.categoryId}`);
  }
  //argsList.push('picarule_facedetect=' + (coverImages?.length > 0 ? '1' : '0'));
  argsList.push('image_style=' + (coverImages?.length > 3 ? '4' : coverImages?.length >= 1 ? '1' : '0'));
  argsList.push(`token=${publisToken}`);
  if (coverImages?.length > 0) {
    for (let i = 0; i < coverImages.length; i++) {
      argsList.push(encodeURIComponent('image_list[' + i + ']') + '=' + encodeURIComponent(coverImages[i]));
      if (coverImages.length > 3) {
        if (i >= 3) break;
      } else break;
    }
  }
  //话题
  argsList.push('topic_id=' + (taskData.topic?.yixiaoerId ?? ''));
  // //活动
  // if (taskData.activity?.yixiaoerName) {
  //   argsList.push('activity_id=' + taskData.activity.yixiaoerId);
  //   argsList.push('activity_name=' + taskData.activity.yixiaoerName);
  // }
  argsList.push(`create_time=${Date.now().toString().substring(0, 10)}`);
  //定时发布参数
  if (taskData.publishTime) {
    argsList.push('status_fixed_time=1');
    argsList.push(`fixed_time=${encodeURIComponent(dayjs(taskData.publishTime).format('YYYY-MM-DD HH:mm:ss'))}`);
  } else {
    argsList.push('status_fixed_time=0');
    argsList.push('fixed_time=0');
  }
  //原创
  if (taskData?.isOriginal == 1) {
    // argsList.push('original_status=1');
    // let originalAuthor = taskData?.originalAuthor?.toString();
    // if (!originalAuthor) originalAuthor = this.userInfo?.name?.toString() ?? '';
    // argsList.push('original_author=' + encodeURIComponent(originalAuthor));
    // const originalUrl = taskData?.originalUrl?.toString() ?? '';
    // if (originalUrl?.startsWith('http')) {
    //   argsList.push('original_type=2');
    //   argsList.push('original_url=' + encodeURIComponent('[' + originalUrl + ']'));
    // } else {
    //   argsList.push('original_type=1');
    //   argsList.push('original_url=' + encodeURIComponent('[]'));
    // }
  }

  return argsList.join('&');
};

export interface KuaiChuanHaoArticleTaskInput {
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
   * 1:原创
   */
  isOriginal?: 1 | 0;
  /**
   * 话题
   */
  topic?: KuaichuanhaoTopicInfo;

  /**
   * 分类id
   */
  categoryId?: string;

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}

export interface KuaichuanhaoPublishResultOutput extends BaseResult {
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
