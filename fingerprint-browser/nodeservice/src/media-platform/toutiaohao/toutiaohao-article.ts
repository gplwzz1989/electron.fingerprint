import { ImageInfo } from '../../media-platform/baseModel';
import { HtmlDocument } from '../../htmlAgilityPack';
import {
  Guid,
  logger,
  publishStatusEnum,
  readImageData,
  SetProgressEvent,
  SetProgressNewEvent,
  Task,
} from '../../utils';
import { EventEmitter } from 'events';
import {
  getImgFromUrl,
  uploadImageBinary,
  publish,
  UploadToutiaohaoImageInfoResponse,
  UploadToutiaohaoImageResponse,
} from './toutiaohao-article.service';
import { BaseResult } from '../../media-platform/baseResult';
import { AxiosError } from 'axios';
import { errorCode } from '../../media-platform/errorCode';
import { $http, createHttpInstance } from '../../http';
import {
  checkVideoUpload,
  getAuthKey,
  getUploadedVideoInfo,
  getVideoUploadArgs,
  UploadedVideoInfo,
  UploadPartResult,
  uploadVideoPart,
} from '@/media-platform/toutiaohao/toutiaohao-video.service';
import fs from 'fs';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import { aws4Interceptor } from 'aws4-axios';
import { getToutiaohaoUserInfo } from '@/media-platform/toutiaohao/toutiaohao-common';
import path from 'path';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '../webproxy';

export const publishToutiaohaoArticle = async (
  cookie: string,
  taskData: ToutiaohaoArticleTaskInput,
  eventCallback: EventEmitter,
): Promise<ToutiaohaoPublishResultOutput> => {
  logger.info(`头条号文章发布 ${taskData.taskId}`);
  const pubResult: ToutiaohaoPublishResultOutput = {
    code: 0,
    msg: '',
    taskId: taskData.taskId,
  };

  try {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploading, '开始发布', taskData.taskId);
    SetProgressEvent(eventCallback, 1, '准备上传图片', taskData.taskId);
    let webProxy: HttpsProxyAgent<string> | object | undefined = undefined;
    if (taskData.proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(taskData.proxy);
    }
    //上传正文中的图片
    const contentImage: CoverInfoList[] = [];
    let content = await replaceImgInHtml(
      cookie,
      taskData.content,
      taskData.taskId,
      contentImage,
      eventCallback,
      taskData,
    );

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    const userInfo = await getToutiaohaoUserInfo(cookie);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    content = await replaceVideoInHtml(
      cookie,
      content,
      taskData,
      userInfo?.data?.user?.id_str ?? '',
      pubResult,
      eventCallback,
      taskData.taskId,
    );
    pubResult.code = 0;
    pubResult.msg = '';
    SetProgressEvent(eventCallback, 80, '准备上传封面', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    //上传封面
    const uploadedCovers = await uploadCover(cookie, taskData.covers, contentImage);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    //组装数据
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    const postData = buildPostData(taskData, content, uploadedCovers, '');

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    await titleCheck(taskData.title);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    await titlePunctuation(taskData.title);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    await wordCheck(taskData.title);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    await spellCheckApply(taskData.title);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    console.debug('头条号推送数据', taskData.taskId, cookie, postData);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);

    const publishResult = await publish(cookie, postData, webProxy);
    console.debug('头条号推送返回数据', taskData.taskId, publishResult);

    pubResult.code = publishResult?.code ?? -1;
    pubResult.msg = publishResult?.message ?? '';
    pubResult.publishId = publishResult?.data?.pgc_id;

    if (pubResult.code == 0 && pubResult.publishId) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      pubResult.code = pubResult?.code != 0 ? pubResult?.code : -1;
      pubResult.msg = `发布失败${pubResult.msg}`;
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
      logger.error(
        `头条号文章发布失败 ${taskData.taskId} ${cookie} ${JSON.stringify(postData)} ${JSON.stringify(publishResult)}`,
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
    logger.error(`头条文章发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
    console.groupEnd();
  }

  return pubResult;
};

/**
 * 上传并替换正文中的图片信息
 * @param cookie
 * @param content 正文html
 * @param taskId
 * @param contentImage 用于存储正文中上传完成的图片信息
 * @param eventCallback
 * @param taskData
 */
const replaceImgInHtml = async (
  cookie: string,
  content: string,
  taskId: string,
  contentImage: CoverInfoList[],
  eventCallback: EventEmitter,
  taskData: ToutiaohaoArticleTaskInput,
): Promise<{ htmlContent: string; image: number; video: number }> => {
  const html = new HtmlDocument();
  html.LoadHtml('<div>' + content + '</div>');

  const imgNodes = html.DocumentNode?.SelectNodes('//img');

  if (imgNodes?.length > 100) {
    throw new Error(`你已经插入${imgNodes?.length}张图片了，目前最多支持插入100张哦`);
  }

  if (imgNodes?.length > 0) {
    let processCount = 0;
    for (const img of imgNodes) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      SetProgressEvent(eventCallback, (50 / imgNodes.length) * processCount + 5, '图片上传中', taskId);
      processCount++;
      let imgUrl = img.getAttribute('src') ?? img.getAttribute('data-src');
      if (!imgUrl) {
        continue;
      }
      if (imgUrl.startsWith('//')) {
        imgUrl = 'http:' + imgUrl;
      }

      let resultJson: UploadToutiaohaoImageResponse = { code: 0 };

      // 上传封面
      if (imgUrl.toLowerCase().startsWith('http')) {
        resultJson = await getImgFromUrl(cookie, imgUrl);
      }

      // 上传封面失败后，下载再上传
      if (!resultJson?.data?.image_url?.toString()) {
        const imgData = await readImageData(imgUrl, 'jpeg');

        if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
          throw new Error(`图片下载失败-${imgData.status}-${imgUrl}`);
        }
        resultJson = await uploadImageBinary(
          cookie,
          imgData.data,
          imgData.fileName ?? 'Mypic.jpeg',
          imgData.ext ?? 'jpeg',
        );
      }

      //上传成功，替换内容中图片相关信息
      if (resultJson?.data?.image_url?.toString()) {
        const upImageUrl = resultJson?.data?.image_url?.toString();
        img.removeAttribute('img-data');
        img.removeAttribute('yxr-data');
        img.setAttribute('src', upImageUrl);
        img.setAttribute('image_type', resultJson.data?.image_type?.toString() ?? '');
        img.setAttribute('mime_type', resultJson.data?.image_mime_type?.toString() ?? '');
        img.setAttribute('web_uri', resultJson.data?.image_uri?.toString() ?? '');
        img.setAttribute('img_width', resultJson.data?.image_width?.toString() ?? '');
        img.setAttribute('img_height', resultJson.data?.image_height?.toString() ?? '');

        if (!contentImage.some((item) => item.pathOrUrl == imgUrl)) {
          contentImage.push({ pathOrUrl: imgUrl, image_info: resultJson.data });
        }
      } else {
        throw new Error(`图片上传失败-${imgUrl}-${resultJson.message ?? ''}`);
      }
    }
    content = html.DocumentNode.OuterHtml();
    return { htmlContent: content, image: 1, video: 0 };
  } else {
    return { htmlContent: content, image: 0, video: 0 };
  }
};

const replaceVideoInHtml = async (
  cookie: string,
  content: { htmlContent: string; image: number },
  taskData: ToutiaohaoArticleTaskInput,
  userId: string,
  pubResult: ToutiaohaoPublishResultOutput,
  callback: EventEmitter,
  taskId: string,
): Promise<{ htmlContent: string; image: number; video: number }> => {
  const html = new HtmlDocument();
  html.LoadHtml('<div>' + content.htmlContent + '</div>');

  const videoNodes = html.DocumentNode.SelectNodes('//video');
  if (videoNodes?.length > 0) {
    let processCount = 0;

    for (const video of videoNodes) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      SetProgressEvent(callback, (25 / videoNodes.length) * processCount + 5, '视频上传中', taskId);
      processCount++;
      let videoPath = video.getAttribute('data-src');
      if (!videoPath) {
        videoPath = video.getAttribute('src') ?? '';
      }
      const upVideoInfo = await uploadVideo(videoPath, taskData, pubResult, userId, 3, cookie);

      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      if (!upVideoInfo) {
        throw new Error(`视频上传失败:${pubResult.msg}`);
      }
      const coverInfo = await getVideoCover(cookie, upVideoInfo.Result.Results[0].Vid);

      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      if (!coverInfo) {
        throw new Error(`自动获取视频封面失败:${videoPath}`);
      }
      const pTag = html.DocumentNode.doc.createElement('p');
      pTag.textContent = `{!-- PGC_VIDEO:{"sp":"toutiao","vid":"${upVideoInfo.Result.Results[0].Vid}","vu":"${
        upVideoInfo.Result.Results[0].Vid
      }","vname":"${path.basename(videoPath)}","vposter":"${coverInfo['url']}","thumb_url":"${
        coverInfo['uri']
      }","duration":${upVideoInfo.Result.Results[0].VideoMeta.Duration}} --}`;

      const pNode: Element = video.parentNode as Element;
      pNode.parentNode?.insertBefore(pTag, pNode);
      pNode.parentNode?.removeChild(pNode);
    }
    return { htmlContent: html.DocumentNode.OuterHtml(), image: content.image, video: 1 };
  } else {
    return { htmlContent: content.htmlContent, image: content.image, video: 0 };
  }
};

/**
 * 封面上传
 * @param cookie
 * @param covers 封面列表
 * @param contentImg 已经上传的正文图片
 */
const uploadCover = async (
  cookie: string,
  covers: Array<ImageInfo>,
  contentImg: Array<CoverInfoList>,
): Promise<Array<CoverInfoList>> => {
  const response: Array<CoverInfoList> = [];

  if (covers?.length > 0) {
    for (const img of covers) {
      //图片是正文中已经有的图片，直接使用
      if (contentImg.some((item) => item.pathOrUrl == img.pathOrUrl)) {
        const imageItem = contentImg.find((item) => item.pathOrUrl == img.pathOrUrl);
        if (imageItem?.image_info) {
          response.push({ pathOrUrl: img.pathOrUrl, image_info: imageItem.image_info });
        }
      } else {
        let uploadResult: UploadToutiaohaoImageResponse | undefined = undefined;

        //先在线转
        if (img.pathOrUrl.toLowerCase().startsWith('http')) {
          uploadResult = await getImgFromUrl(cookie, img.pathOrUrl);
        }

        //在线转换失败，走下载上传
        if (!uploadResult?.data?.image_url) {
          //下载图片后上传
          const imgData = await readImageData(img.pathOrUrl, 'jpeg');
          if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
            throw new Error(`图片下载失败-${imgData.status}-${img.pathOrUrl}`);
          }
          uploadResult = await uploadImageBinary(
            cookie,
            imgData.data,
            imgData.fileName ?? 'Mypic.jpeg',
            imgData.ext ?? 'jpeg',
          );
        }

        if (!uploadResult?.data?.image_url) {
          throw new Error(`图片上传失败-${uploadResult?.message}-${img.pathOrUrl}`);
        }

        response.push({ pathOrUrl: img.pathOrUrl, image_info: uploadResult?.data });
      }
    }
  }

  return response;
};

const titleCheck = async (title: string) => {
  await $http.get<unknown>(
    'https://mp.toutiao.com/mp/agw/creator_helper/title_check?title=' + encodeURIComponent(title ?? '') + '&title_id=',
    {
      headers: {
        Accept: 'application/json, text/plain, */*',
        referer: 'https://mp.toutiao.com/profile_v4/graphic/publish',
        'Content-type': 'multipart/form-data',
      },
      params: {},
    },
  );
};

const wordCheck = async (title: string) => {
  const url = 'https://mp.toutiao.com/mp/agw/creator_helper/word_check';

  const headers = {
    Accept: 'application/json, text/plain, */*',
    referer: 'https://mp.toutiao.com/profile_v4/graphic/publish',
    'Content-type': 'multipart/form-data',
  };

  await $http.post(
    url,
    { content: title, check_type: 1 },
    {
      headers: headers,
    },
  );
};

const titlePunctuation = async (title: string) => {
  const url = 'https://mp.toutiao.com/mp/agw/creator_helper/title_punctuation';

  const headers = {
    Accept: 'application/json, text/plain, */*',
    referer: 'https://mp.toutiao.com/profile_v4/graphic/publish',
    'Content-type': 'multipart/form-data',
  };

  await $http.post(
    url,
    { content: title },
    {
      headers: headers,
    },
  );
};

const spellCheckApply = async (title: string) => {
  const url = 'https://mp.toutiao.com/mp/agw/creator_helper/spell_check_apply';

  const headers = {
    Accept: 'application/json, text/plain, */*',
    referer: 'https://mp.toutiao.com/profile_v4/graphic/publish',
    'Content-type': 'multipart/form-data',
  };

  await $http.post(
    url,
    { content: title },
    {
      headers: headers,
    },
  );
};

const buildPostData = (
  taskData: ToutiaohaoArticleTaskInput,
  content: { htmlContent: string; image: number; video: number },
  covers: Array<CoverInfoList>,
  pgc_id: string,
): string => {
  const params = {};
  params['source'] = 0;
  params['disable_praise'] = 0;
  params['is_fans_article'] = 0;
  params['tree_plan_article'] = 0;
  params['title'] = encodeURIComponent(taskData.title ?? '');
  params['content'] = encodeURIComponent(content.htmlContent);
  params['save'] = taskData.pubType === 0 ? 0 : 1;
  const editorStat: { image?: number; video?: number } = {};
  if (content.image) {
    editorStat.image = 1;
  }
  if (content.video) {
    editorStat.video = 1;
  }
  if (content.image > 0 || content.video > 0) {
    params['mp_editor_stat'] = encodeURIComponent(JSON.stringify(editorStat));
  }
  const coverList: Array<{
    ic_uri: string;
    id: string;
    thumb_width: number;
    thumb_height: number;
    uri: string;
    url: string;
    thumb_url: string;
    origin_uri: string;
  }> = [];
  if (covers.length > 0) {
    for (const img of covers) {
      if (img.image_info) {
        coverList.push({
          ic_uri: '',
          id: '',
          thumb_width: img.image_info.image_width,
          thumb_height: img.image_info.image_height,
          uri: img.image_info.image_uri,
          url: img.image_info.image_url,
          thumb_url: img.image_info.image_uri,
          origin_uri: img.image_info.image_uri,
        });
      }
    }
  }
  params['pgc_feed_covers'] = encodeURIComponent(coverList?.length > 0 ? JSON.stringify(coverList) : '[]');
  params['article_ad_type'] = taskData['adType'];

  const extra = {};
  extra['gd_ext'] = { entrance: '', from_page: 'publisher_mp', enter_from: 'PC', device_platform: 'mp', is_message: 0 };
  // 开启原创
  if (taskData?.original && taskData.original === 1) {
    params['origin_debut_check_pgc_normal'] = 1;
    params['claim_origin'] = 1;
    params['pgc_debut'] = 1;
    params['exclusive'] = 1;
  } else {
    params['origin_debut_check_pgc_normal'] = 0;
    params['claim_origin'] = 0;
  }

  //独家首发
  if (taskData?.claimExclusive && taskData?.claimExclusive === 1) {
    params['claim_exclusive'] = 1;
  }

  if (taskData?.collectionId) {
    extra['want_join_collection_id'] = taskData.collectionId;
  }

  if (taskData.tuwen_wtt_trans_flag === 1) {
    extra['tuwen_wtt_trans_flag'] = '1';
  }

  if (taskData?.location && taskData?.location?.city) {
    extra['manual_selected_city'] = JSON.stringify({
      city: taskData?.location?.city,
      city_code: taskData?.location?.city_code,
    });
  }

  if (taskData?.infoSource && taskData.infoSource > 0) {
    if (taskData.infoSource === 1) {
      extra['info_source'] = {
        source_type: taskData.infoSource,
        source_link: taskData.sourceLink ?? '',
        time_format: taskData.timeFormat ?? '',
        position: taskData.sourcePosition ?? {},
      };
    } else {
      extra['info_source'] = {
        source_type: taskData.infoSource,
        source_link: '',
        time_format: '',
        position: {},
      };
    }
  }

  if (taskData?.multiTitle && taskData.multiTitle.length > 0) {
    extra['is_multi_title'] = 1;
    const multi: Array<{
      ai_title: string;
      id: string;
      old_source: string;
      source: string;
      text: string;
      visibility_level: number;
    }> = [];
    for (const multiTitleItem of taskData.multiTitle) {
      multi.push({
        ai_title: '',
        id: '0',
        old_source: 'author',
        source: 'author',
        text: multiTitleItem,
        visibility_level: 0,
      });
    }
    extra['sub_titles'] = multi;
  }

  params['extra'] = encodeURIComponent(JSON.stringify(extra));

  params['extern_link'] = taskData.externLink ?? '';

  if (pgc_id) {
    params['pgc_id'] = pgc_id;
  }

  if (taskData.publishTime) {
    params['timer_status'] = 1;
    params['timer_time'] =
      taskData.publishTime.length == 19 ? taskData.publishTime.substring(0, 16) : taskData.publishTime;
  } else {
    params['timer_status'] = 0;
    params['timer_time'] = '';
  }

  return Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join('&');
};

export interface CoverInfoList {
  pathOrUrl: string;
  image_info: UploadToutiaohaoImageInfoResponse;
}

export interface ToutiaohaoArticleTaskInput {
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
  pubType: number;

  /**
   * 文章信息
   */
  title: string;

  /**
   * 多标题
   */
  multiTitle?: Array<string>;

  /**
   * 文章封面
   */
  covers: Array<ImageInfo>;

  /**
   * 文章内容 html
   */
  content: string;

  /**
   * 位置
   */
  location?: {
    city: string;
    city_code: string;
  };

  /**
   * 广告类型 3投放广告赚收益，2不投放广告
   */
  adType: number;

  /**
   * 原创申明 1:申明 0:不申明
   */
  original?: number;

  /**
   * 合集ID
   */
  collectionId?: string;

  /**
   * 同步微头条 1:同步 0:不同步
   */
  tuwen_wtt_trans_flag?: number;

  /**
   * 信息来源 （4取材网络，1引用站内，5个人观点，3AI生成）
   */
  infoSource?: number;

  /**
   * 来源链接
   */
  sourceLink?: string;

  /**
   * 时间
   */
  timeFormat?: string;

  /**
   * 地点
   */
  sourcePosition?: {
    position: string;
    city: string;
    longitude: number;
    latitude: number;
    typeCode: string;
    poiId: string;
  };

  /**
   *定时发布时间,精确到分钟，2025-04-17 14:09
   */
  publishTime?: string;

  /**
   * 允许赞赏 1:允许 0:不允许
   */
  praise?: number;

  /**
   * 是否独家首发 1:独家/首发 0:非独家  需原创内容，且72小时内只能在头条发布
   */
  claimExclusive?: number;

  /**
   * 外链链接
   */
  externLink?: string;

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}

export interface ToutiaohaoPublishResultOutput extends BaseResult {
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
}

export const uploadVideo = async (
  filePath: string,
  taskData: ToutiaohaoArticleTaskInput,
  pubResult: ToutiaohaoPublishResultOutput,
  userId: string,
  maxThread: number,
  cookie: string,
): Promise<UploadedVideoInfo | null | undefined> => {
  let fileHandle: fs.promises.FileHandle | null = null;
  try {
    if (filePath.startsWith('yi-file://')) {
      filePath = filePath.replace('yi-file://', '');
    }
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // 获取上传认证参数
    const authData = await getAuthKey(cookie);
    if (!authData?.data?.uploadToken) {
      console.debug('获取认证参数失败', taskData.taskId, authData);
      pubResult.code = authData.status;
      pubResult.msg = '获取认证参数失败:' + (authData.message ?? '');

      return null;
    }
    // 获取文件信息
    const fileStat = await fs.promises.stat(filePath);
    fileHandle = await fs.promises.open(filePath, 'r');

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // 提取认证信息
    const authResult = authData.data.uploadToken;

    // 初始化 http
    const $httpSign = createHttpInstance();
    $httpSign.interceptors.request.use(
      aws4Interceptor({
        instance: $httpSign,
        options: {
          region: 'cn-north-1',
          service: 'vod',
        },
        credentials: {
          accessKeyId: authResult.AccessKeyId,
          secretAccessKey: authResult.SecretAccessKey,
          sessionToken: authResult.SessionToken,
        },
      }),
    );

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // 获取上传参数
    const uploadVideoArgs = await getVideoUploadArgs(fileStat.size, userId, $httpSign);
    if (!uploadVideoArgs?.Result?.InnerUploadAddress?.UploadNodes) {
      console.debug('获取上传参数失败', taskData.taskId, uploadVideoArgs);

      pubResult.code = uploadVideoArgs.status_code;
      pubResult.msg = '获取上传参数失败:' + (uploadVideoArgs.status_msg ?? uploadVideoArgs?.Error?.Message ?? '');

      return null;
    }

    // 准备上传分片信息列表
    const uploadedList: Map<number, string> = new Map<number, string>();

    // 上传id
    const uploadId = Guid.NewGuid().toString();

    // 开始读取并上传文件
    let readIndex = 0;

    // 分片大小
    let blockSize = 3145728; // 50M以下的视频，分片大小为3M，500M以上的视频，分片大小为5M，1G以上的视频大小为10M
    if (fileStat.size > 1024 * 1024 * 50) {
      blockSize = 1024 * 1024 * 5;
    } else if (fileStat.size > 1024 * 1024 * 1024) {
      blockSize = 1024 * 1024 * 10;
    }

    // 总片数
    const totalPartNums = Math.ceil(fileStat.size / blockSize);

    // 并行上传
    const tasks: Array<Promise<UploadPartResult>> = [];

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // 文件大小小于等单个分片大小
    if (blockSize >= fileStat.size) {
      const buffer = Buffer.alloc(fileStat.size);
      const readData = await fileHandle.read(buffer, 0, fileStat.size, readIndex);
      if (readData.buffer.length > 0) {
        const uploadResult = await uploadVideoPart(readData.buffer, 1, blockSize, userId, uploadId, uploadVideoArgs);
        if (!uploadResult?.data?.crc32) {
          pubResult.code = uploadResult.code;
          pubResult.msg = '视频分片上传失败:' + uploadResult.message;

          return null;
        }
        uploadedList.set(uploadResult.partNum, uploadResult.data.crc32);
      } else {
        pubResult.code = errorCode.io_error;
        pubResult.msg = '文件读取失败:' + filePath;

        return null;
      }
    }
    // 文件有多个分片
    else {
      let partNum = 0;
      while (readIndex < fileStat.size) {
        partNum++;
        let canReadNum = blockSize;
        let buffer = Buffer.alloc(blockSize);
        if (readIndex + blockSize > fileStat.size) {
          canReadNum = fileStat.size - readIndex;
          buffer = Buffer.alloc(canReadNum);
        }
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);
        const readData = await fileHandle.read(buffer, 0, canReadNum, readIndex);
        if (readData.buffer.length > 0) {
          tasks.push(uploadVideoPart(readData.buffer, partNum, blockSize, userId, uploadId, uploadVideoArgs));

          if (tasks.length > maxThread) {
            const uploadResult = await Promise.race(tasks);
            if (!uploadResult?.data?.crc32) {
              pubResult.code = uploadResult.code;
              pubResult.msg = '视频分片上传失败:' + uploadResult.message;

              return null;
            }

            uploadedList.set(uploadResult.partNum, uploadResult.data.crc32);
            const uploadResultNew = await tasks.splice(0, 1)[0];
            if (!uploadResultNew?.data?.crc32) {
              pubResult.code = uploadResultNew.code;
              pubResult.msg = '视频分片上传失败:' + uploadResultNew.message;

              return null;
            }

            uploadedList.set(uploadResultNew.partNum, uploadResultNew.data.crc32);
          }

          readIndex += readData.buffer.length;

          if (canReadNum < blockSize) {
            break;
          }
        } else {
          pubResult.code = errorCode.io_error;
          pubResult.msg = '文件读取失败:' + filePath;

          return null;
        }
      }
    }
    while (tasks.length > 0) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      const uploadResult = await tasks.splice(0, 1)[0];
      if (!uploadResult?.data?.crc32) {
        pubResult.code = uploadResult.code;
        pubResult.msg = '视频分片上传失败:' + uploadResult.message;

        return null;
      }
      uploadedList.set(uploadResult.partNum, uploadResult.data?.crc32 ?? '');
    }

    const uploadStrList: Array<string> = [];

    if (uploadedList.size < totalPartNums) {
      console.debug('视频上传失败', taskData.taskId, uploadedList);
      pubResult.code = errorCode.io_error;
      pubResult.msg = '视频上传失败:' + filePath;

      return null;
    }

    for (let i = 1; i <= uploadedList.size; i++) {
      uploadStrList.push(`${i}:${uploadedList.get(i)}`);
    }

    const uploadResultList = uploadStrList.join(',');

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // 检查视频上传是否成功
    const checkResult = await checkVideoUpload(userId, uploadId, uploadResultList, uploadVideoArgs);
    if (!checkResult.data?.hash) {
      console.debug('视频上传校验失败', taskData.taskId, uploadedList, checkResult);

      pubResult.code = -1;
      pubResult.msg = '上传校验失败:' + (checkResult.message ?? '');

      return null;
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //获取上传完成的视频信息
    const uploadVideoInfo = await getUploadedVideoInfo(userId, uploadVideoArgs, 'middlevideo_toutiao', $httpSign);
    if (!(uploadVideoInfo?.Result?.Results?.length > 0)) {
      console.debug('获取视频信息失败', taskData.taskId, uploadedList, uploadVideoInfo);

      pubResult.code = -1;
      pubResult.msg = '获取视频信息失败:' + (uploadVideoInfo.status_msg ?? '');

      return null;
    }
    pubResult.code = 0;
    pubResult.msg = '';
    return uploadVideoInfo;
    // endregion
  } catch (e) {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    console.error('头条号横版视频上传失败', taskData.taskId, e);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = '视频上传失败';
    return null;
  } finally {
    fileHandle?.close();
  }
};

export const getVideoCover = async (cookie: string, videoId: string): Promise<object | null | undefined> => {
  for (let i = 0; i < 120; i++) {
    try {
      const url = `https://mp.toutiao.com/mp/agw/article_material/video/get_thumb?vid=${videoId}`;

      const headers = {
        cookie: cookie,
        referer: 'https://mp.toutiao.com/profile_v4/graphic/publish',
        'Content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      };

      const result = await $http.get(url, { headers: headers });

      if (result.data?.items?.length > 0) {
        return result.data?.items[0];
      }
      await Task.Delay(1000);
    } catch (e) {
      console.error(e);
      await Task.Delay(1000);
    }
  }
  return null;
};
