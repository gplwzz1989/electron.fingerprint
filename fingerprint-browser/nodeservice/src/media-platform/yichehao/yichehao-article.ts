import { HtmlDocument } from '@/htmlAgilityPack';
import {
  GetMD5,
  Guid,
  logger,
  publishStatusEnum,
  readImageData,
  SetProgressEvent,
  SetProgressNewEvent,
  Task,
} from '@/utils';
import dayjs from 'dayjs';
import { BaseResult } from '../baseResult';
import { ImageInfo, ListItemInfo } from '../baseModel';
import { EventEmitter } from 'events';
import { errorCode } from '../errorCode';
import { AxiosError } from 'axios';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '../webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import {
  ConvertImageInfoResponse,
  convertYiCheHaoImageResponse,
  publishYiCheHaoArticleResponse,
  uploadYiCheHaoArticleImageResponse,
} from '@/media-platform/yichehao/yichehao-article.service';
import { uploadYiCheHaoImageResponse } from '@/media-platform/yichehao/yichehao-video-service';

export async function publishYiCheHaoArticle(
  taskData: YiCheHaoArticleData,
  cookie: string,
  eventCallback?: EventEmitter,
) {
  logger.info(`易车号文章发布 ${taskData.taskId}`);
  const pubResult: YiDianHaoPublishResultOutput = {
    code: 0,
    msg: '',
    taskId: taskData.taskId,
  };
  if (!eventCallback) {
    eventCallback = new EventEmitter();
  }
  try {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploading, '开发发布', taskData.taskId);

    SetProgressEvent(eventCallback, 1, '准备上传图片', taskData.taskId);

    let webProxy: HttpsProxyAgent<string> | object | undefined = undefined;
    if (taskData.proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(taskData.proxy);
    }
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    taskData['content'] = await ReplaceImgInHtml(taskData['content'], cookie, taskData.taskId, eventCallback, taskData);

    SetProgressEvent(eventCallback, 80, '准备上传封面', taskData.taskId);

    const coverJArray = await uploadCovers(cookie, taskData.covers);
    if (!coverJArray?.length) {
      pubResult.code = 400;
      pubResult.msg = '封面上传失败';
      return pubResult;
    }

    const verticalCover = await uploadVerticalCover(cookie, taskData.verticalCover);
    if (!verticalCover) {
      pubResult.code = 400;
      pubResult.msg = '竖版封面上传失败';
      return pubResult;
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);

    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);

    const postData = buildPostData(taskData, coverJArray, verticalCover, taskData['imgKeys'] as Array<string>);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (taskData.pubType === 0) {
      //不可取消
      taskData.cancelToken?.disable(privateKey);
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    console.debug('易车号文章推送数据', taskData.taskId, cookie, postData);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);

    // 推送数据
    const publishResult = await publishYiCheHaoArticleResponse(cookie, postData, webProxy);
    console.debug('易车号文章推送返回数据', taskData.taskId, publishResult);

    pubResult.code = publishResult?.status === '1' ? 0 : 400;
    pubResult.publishId = publishResult?.data?.newsId?.toString();

    if (pubResult.code == 0 && pubResult.publishId) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      pubResult.msg = publishResult?.message ?? '发布失败';
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
      logger.error(
        `易车号文章发布失败 ${taskData.taskId} ${cookie} ${pubResult.publishId}  ${JSON.stringify(publishResult)}`,
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
    logger.error(`易车号文章发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }
  return pubResult;
}

async function ReplaceImgInHtml(
  htmlContent: string,
  cookie: string,
  taskId: string,
  eventCallback: EventEmitter,
  taskData: YiCheHaoArticleData,
): Promise<string> {
  const html = new HtmlDocument();
  html.LoadHtml(htmlContent);
  taskData['imgKeys'] = [];
  const imgNodes = html.DocumentNode.SelectNodes('//img');
  if (imgNodes?.length > 0) {
    let processCount = 0;
    for (const img of imgNodes) {
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

      let uploadUrl;
      let resultJson: any = {};
      if (imgUrl.startsWith('http')) {
        resultJson = await convertYiCheHaoImageResponse(cookie, imgUrl);
        uploadUrl = resultJson?.data?.imgKey;
      }

      if (!uploadUrl) {
        const imgData = await readImageData(imgUrl, 'jpeg');

        if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
          throw new Error(`图片读取失败-${imgData.status}-${imgUrl}`);
        }
        resultJson = await uploadYiCheHaoArticleImageResponse(cookie, imgData.data, 800, 800);
        uploadUrl = resultJson?.data?.imgKey;
      }

      if (!uploadUrl) {
        throw new Error('上传正文图片失败:' + imgUrl + `${resultJson?.message ?? ''}`);
      }
      img.setAttribute('src', uploadUrl);
      taskData['imgKeys'].push(uploadUrl);
    }
    return html.DocumentNode.OuterHtml();
  } else {
    return htmlContent;
  }
}

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

      let uploadedUrl;

      let resultJson: object | undefined = undefined;
      //直接官方转换
      if (imgUrl.toLowerCase().startsWith('http')) {
        resultJson = await convertYiCheHaoImageResponse(cookie, imgUrl);
        uploadedUrl = (resultJson as ConvertImageInfoResponse)?.data?.imgKey;
      }

      //下载后再上传
      if (!uploadedUrl) {
        const imgData = await readImageData(imgUrl, 'jpeg');

        if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
          throw new Error(`图片读取失败-${imgData.status}-${imgUrl}`);
        }
        resultJson = await uploadYiCheHaoImageResponse(cookie, imgData.data, 800, 800);
        uploadedUrl = (resultJson as ConvertImageInfoResponse)?.data?.imgKey;
      }

      if (!uploadedUrl) {
        throw new Error(`封面图片上传失败-${imgUrl}${resultJson ? resultJson['message'] ?? '' : ''}`);
      }
      upCovers.push(uploadedUrl);
      if (upCovers.length >= 3) {
        break;
      }
    }
  }

  return upCovers;
};

const uploadVerticalCover = async (cookie: string, cover: ImageInfo): Promise<string> => {
  let imgUrl = cover?.pathOrUrl;
  if (!imgUrl) {
    throw new Error('竖版封面不能为空');
  }
  if (imgUrl.startsWith('//')) {
    imgUrl = 'http:' + imgUrl;
  }

  let uploadedUrl;

  let resultJson: object | undefined = undefined;
  //直接官方转换
  if (imgUrl.toLowerCase().startsWith('http')) {
    resultJson = await convertYiCheHaoImageResponse(cookie, imgUrl);
    uploadedUrl = (resultJson as ConvertImageInfoResponse)?.data?.imgKey;
  }

  //下载后再上传
  if (!uploadedUrl) {
    const imgData = await readImageData(imgUrl, 'jpeg');

    if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
      throw new Error(`图片读取失败-${imgData.status}-${imgUrl}`);
    }
    resultJson = await uploadYiCheHaoImageResponse(cookie, imgData.data, 800, 800);
    uploadedUrl = (resultJson as ConvertImageInfoResponse)?.data?.imgKey;
  }

  if (!uploadedUrl) {
    throw new Error(`竖版封面图片上传失败-${imgUrl}${resultJson ? resultJson['message'] ?? '' : ''}`);
  }
  return uploadedUrl;
};
function buildPostData(
  taskData: YiCheHaoArticleData,
  coverList: Array<string>,
  vertivalCover: string,
  imageKeys: Array<string>,
) {
  const t = parseInt((Date.now() / 1000).toFixed(0));
  if (!imageKeys) {
    imageKeys = [];
  }
  if (coverList?.length) {
    coverList.forEach((item) => {
      imageKeys.push(item);
    });
  }
  if (vertivalCover) {
    imageKeys.push(vertivalCover);
  }
  const re = {
    cid: 500,
    ver: '1.0.0',
    uid: '',
    t: t,
    sign: '',
    param: {
      title: taskData.title,
      cover: coverList,
      content: taskData.content,
      newsId: 0,
      relatedSerialId: '', //'4175,4616,3152',
      keywords: '',
      publishTime: '',
      action: taskData.pubType === 0 ? 0 : 2,
      uniqueId: Guid.NewGuid().toString(),
      relatedActivityIds: '',
      hotTopicIds: '',
      voteId: null,
      relateMotorcycleIds: '',
      categoryId: 604,
      copyRight: 0,
      businessType: 0,
      reprint: !taskData.allowForward ? 0 : 1,
      aiSummary: 0,
      relatedCityId: 0,
      statementType: taskData.statementType ?? 0,
      businessTaskInfo: {},
      programId: null,
      relatedTagId: '',
      uprightPic: {
        url: vertivalCover,
        width: taskData.verticalCover.width ?? 768,
        height: taskData.verticalCover.height ?? 1024,
        sourceType: 2,
      },
      imgKeys: imageKeys.join(','),
    },
  };

  //定时
  if (taskData.prePubTime) {
    re.param.publishTime = dayjs(taskData.prePubTime).format('YYYY-MM-DD HH:mm:ss');
  }
  //话题
  if (taskData.topics?.length) {
    const ids = taskData.topics.map((m) => m.yixiaoerId);
    re.param.relatedSerialId = ids.join(',');
  }

  const signStr =
    'cid=' +
    re.cid +
    ';param=' +
    JSON.stringify(re.param) +
    ';ver=' +
    re.ver +
    ';t=' +
    re.t +
    ';' +
    '6AC46B43FC8DCD6E49F66F6C016F393F';
  re.sign = GetMD5(signStr);
  return JSON.stringify(re);
}
export interface YiDianHaoPublishResultOutput extends BaseResult {
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
  mediaContent?: Record<string, any>;
}

export interface YiCheHaoArticleData {
  cancelToken?: CancelToken;
  /**
   * 内容html
   */
  content: string;

  /**
   * 是否直接发布， 0保存草稿 1直接发布
   */
  pubType: number;

  /**
   * 封面图
   */
  covers: Array<ImageInfo>;

  /**
   * 竖版封面
   */
  verticalCover: ImageInfo;

  /**
   * 话题
   */
  topics?: Array<ListItemInfo>;

  /**
   * 标题
   */
  title: string;

  /**
   * 同意转发
   */
  allowForward?: boolean;

  /**
   * 允许生成摘要
   */
  allowAbstract?: boolean;

  /**
   * 1 个人观点，仅供参考 1
   * 2 内容来源于网络 2
   * 3 AI生成 3
   * 4 引用站内 4
   */
  statementType: 0 | 1 | 2 | 3 | 4;

  /**
   * 定时发布时间 13位时间戳,精确的分钟，5的倍数
   */

  prePubTime?: number;
  /**
   * 任务唯一标志id
   */
  taskId: string;

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}
