import { EventEmitter } from 'events';
import {
  htmlDecode,
  logger,
  publishStatusEnum,
  Random,
  readImageData,
  SetProgressEvent,
  SetProgressNewEvent,
  Task,
} from '@/utils';
import { AxiosError } from 'axios';
import { errorCode } from '../errorCode';
import { HtmlDocument } from '@/htmlAgilityPack';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import { BaseResult } from '../baseResult';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '../webproxy';
import {
  covertImgFromUrl,
  checkRisk,
  getImageUploadArgs,
  publishCSDNArticleResponse,
  uploadImageResponse,
} from './csdn-article.service';
import { VisibleTypeEnum } from '@/cloud/model/TypeEnum';
import { HtmlAgilityPack } from '@/article-parse/common/HtmlAgilityPack';
import dayjs from 'dayjs';
import { ImageInfo } from '@/media-platform';
import { getCSDNUserInfo } from '@/media-platform/csdn/csdn-common';
import { getCSDNUserInfoResponse } from '@/media-platform/csdn/csdn-user.service';

/**
 *
 * @param cookie
 * @param taskData
 * @param eventCallback
 */
export const publishCSDNArticle = async (
  cookie: string,
  taskData: CSDNArticleTaskInput,
  eventCallback: EventEmitter,
  userId: string = '',
): Promise<CSDNPublishResultOutput> => {
  logger.info(`CSDN文章发布 ${taskData.taskId}`);
  const pubResult: CSDNPublishResultOutput = {
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

    if(!userId)
    {
      const userInfo=await getCSDNUserInfoResponse(cookie);
      userId=userInfo?.data?.username;
      if(!userId)
      {
        pubResult.code=userInfo?.code===0?-1:userInfo?.code??-1;
        pubResult.msg=userInfo.msg;
        return pubResult;
      }
    }
    cookie = await checkRisk(cookie,userId);
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

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    const draftData = buildPostData(taskData, content, uploadedCovers, true);
    const draftRe = await publishCSDNArticleResponse(cookie, draftData, webProxy);
    if (!draftRe?.data?.article_id) {
      pubResult.code = draftRe?.code === 200 ? 0 : draftRe?.code === 0 ? -1 : draftRe.code;
      pubResult.msg = draftRe.msg;
      return pubResult;
    }
    if (taskData.pubType === 0) {
      pubResult.code = draftRe?.code === 200 ? 0 : draftRe?.code === 0 ? -1 : draftRe.code;
      pubResult.msg = draftRe.msg;

      return pubResult;
    }
    const delayTime = new Random().Next(5, 10) * 1000;
    await Task.Delay(delayTime);
    //组装数据
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    const postData = buildPostData(taskData, content, uploadedCovers, false, draftRe?.data?.article_id);

    console.debug('CSDN推送数据', taskData.taskId, cookie, postData);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);
    const publishResult = await publishCSDNArticleResponse(cookie, postData, webProxy);
    console.debug('CSDN推送返回数据', taskData.taskId, publishResult);

    pubResult.code = publishResult?.code === 200 ? 0 : publishResult?.code === 0 ? -1 : publishResult?.code;
    pubResult.msg = publishResult?.message ? publishResult?.message : publishResult?.msg;

    pubResult.publishId = publishResult?.data?.article_id?.toString();

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
      logger.error(
        `CSDN文章发布失败 ${taskData.taskId} ${cookie} ${JSON.stringify(postData)} ${JSON.stringify(publishResult)}`,
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
    logger.error(`CSDN文章发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};

const replaceImgInHtml = async (
  cookie: string,
  content: string,
  taskId: string,
  eventCallback: EventEmitter,
  taskData: CSDNArticleTaskInput,
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
        if (result?.data?.url) {
          uploadedUrl = result.data.url;
        }
      }

      //下载后再上传
      if (!uploadedUrl) {
        const imgData = await readImageData(imgUrl, 'jpeg');

        const uploadImgArgs = await getImageUploadArgs(cookie);

        if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
          throw new Error(`图片读取失败-${imgData.status}-${imgUrl}`);
        }
        const binaryResult = await uploadImageResponse(cookie, imgData.data, uploadImgArgs);
        uploadedUrl = binaryResult?.data?.imageUrl;
        if (!uploadedUrl) {
          throw new Error(`图片上传失败-${imgUrl}`);
        }
      }

      //上传成功，替换内容中图片相关信息
      if (uploadedUrl) {
        img.setAttribute('src', uploadedUrl);
      } else {
        throw new Error(`图片上传失败-${imgUrl}}`);
      }
    }
    return htmlDecode(html.DocumentNode.OuterHtml());
  }

  return content;
};

const uploadCovers = async (cookie: string, covers: Array<ImageInfo>): Promise<Array<string>> => {
  const upCovers: Array<string> = [];
  if (covers?.length > 0) {
    for (const img of covers) {
      if (upCovers.length >= 3) {
        break;
      }
      let imgUrl = img.pathOrUrl;
      if (!imgUrl) {
        continue;
      }
      if (imgUrl.startsWith('//')) {
        imgUrl = 'http:' + imgUrl;
      }

      if (imgUrl.startsWith('http')) {
        const imgRe = await covertImgFromUrl(cookie, imgUrl);
        if (imgRe?.data?.url) {
          upCovers.push(imgRe?.data?.url);
          continue;
        }
      }

      //下载后再上传
      const imgData = await readImageData(imgUrl, 'jpeg');

      if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
        throw new Error(`封面图片读取失败-${imgData.status}-${imgUrl}`);
      }
      const uploadImgArgs = await getImageUploadArgs(cookie);
      const binaryResult = await uploadImageResponse(cookie, imgData.data, uploadImgArgs);
      const uploadedUrl = binaryResult?.data?.imageUrl;
      if (!uploadedUrl) {
        throw new Error(`封面图片上传失败-${binaryResult?.msg}-${imgUrl}`);
      }
      upCovers.push(uploadedUrl);
    }
  }

  return upCovers;
};

const buildPostData = (
  taskData: CSDNArticleTaskInput,
  content: string,
  covers: Array<string>,
  draft: boolean = false,
  article_id: number = 0,
): object => {
  const ori = taskData?.isOriginal?.toString();
  const html = new HtmlAgilityPack.HtmlDocument();
  html.LoadHtml('<p>' + taskData.desc + '</p>');

  const topics = html.DocumentNode.SelectNodes('//topic');
  if (topics?.length) {
    for (const topic of topics) {
      topic.innerHTML = ``;
      topic.textContent = '';
    }
  }

  const desc = html.DocumentNode?.InnerText() ?? '';
  const re = {
    article_id: article_id ? article_id : 0,
    title: taskData.title ?? '',
    description: desc && !desc.startsWith('undefined') ? desc : '',
    content: content ?? '',
    tags: taskData?.tags?.length ? taskData?.tags.join(',') : '',
    categories: '',
    type: ori == '4' ? 'translated' : ori == '2' ? 'repost' : ori == '1' ? 'original' : 'original',
    status: draft ? 2 : taskData.pubType > 0 ? 0 : 2,
    read_type: taskData.visibleType === VisibleTypeEnum.private ? 'private' : 'public', //: vtp == '2' ? 'read_need_fans' : 'read_need_vip',
    reason: '',
    resource_id: '',
    original_link: taskData?.originalUrl ?? '',
    authorized_status: false,
    check_original: false,
    source: 'pc_postedit',
    not_auto_saved: draft ? 0 : 1,
    creator_activity_id: '',
    cover_images: covers,
    cover_type: covers?.length > 1 ? 3 : covers?.length > 0 ? 1 : 0,
    vote_id: 0,
    scheduled_time: taskData.publishTime ? dayjs(taskData.publishTime).format('YYYY-MM-DD HH:mm:ss') : '0',
    is_new: 1,
    sync_git_code: 0,
  };
  if (taskData.creation_statement) {
    re['creation_statement'] = taskData.creation_statement;
  }
  return re;
};

export interface CSDNArticleTaskInput {
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
   * 文章摘要/描述
   */
  desc?: string;

  /**
   * 封面
   */
  covers: Array<ImageInfo>;

  /**
   * 可见类型
   */
  visibleType: VisibleTypeEnum;

  tags?: string[];

  /**
   * 文章内容 html
   */
  content: string;

  /**
   * 1:原创
   * 2:转载
   * 4:翻译
   */
  isOriginal?: 1 | 4 | 2;

  /**
   *当为转载时必填
   */
  originalUrl?: string;

  /**
   * 定时发布时间戳13
   */
  publishTime?: number;

  /**
   * 0：无声明
   * 1:不分内容由AI辅助生成
   * 2:内容来源网络，继续整合/再创作
   * 3:个人观点，仅供参考
   */
  creation_statement?: 0 | 1 | 2 | 3;

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}

export interface CSDNPublishResultOutput extends BaseResult {
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
