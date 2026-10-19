import { HtmlDocument } from '../../htmlAgilityPack';
import { EventEmitter } from 'events';
import {
  GetMD5ByPathLike,
  Guid,
  htmlDecode,
  logger,
  publishStatusEnum,
  readImageData,
  SetProgressEvent,
  SetProgressNewEvent,
  Task,
} from '../../utils';
import {
  getBaijiahaoKeywordListAsync,
  getBaijiahaoTitleRcmdAsync,
  getChooseImage,
  getCoordRcmdAsync,
  getCuttingPicAsync,
  getImgFromUrl,
  getSyncChooseImage,
  publish,
  PublishDataResponse,
  uploadImageBinary,
} from './baijiahao-article.service';
import { ImageInfo } from '../../media-platform/baseModel';
import { BaseResult } from '../../media-platform/baseResult';
import { AxiosError } from 'axios';
import { errorCode } from '../../media-platform/errorCode';
import { $http } from '../../http';
import path from 'path';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import {
  getUploadArgsResponse,
  uploadCompleteResponse,
  UploadCompleteResponse,
  uploadVideoPart,
  UploadVideoPartResponse,
} from '@/media-platform/baijiahao/baijiahao-video.service';
import fs from 'fs';
import { getBaijiahaoBaseToken, getBaijiahaoPublishArticleToken } from '@/media-platform/baijiahao/baijiahao-common';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '../webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';

const htmlDecodeKeepBr = (str: string): string => {
  const brPlaceholder = `__BAIJIAHAO_BR_${Guid.NewGuid()}__`;
  return htmlDecode(str.replace(/<br\s*\/>/gi, brPlaceholder)).replace(new RegExp(brPlaceholder, 'g'), '<br>');
};

/**
 *
 * @param cookie
 * @param app_id
 * @param taskData
 * @param token 百家号进入发文页面的token，使用getBaijiahaoBaseToken和getBaijiahaoPublishArticleToken获取
 * @param eventCallback
 */
export const publishBaijiahaoArticle = async (
  cookie: string,
  app_id: number,
  taskData: BaijiahaoArticleTaskInput,
  token: string,
  eventCallback: EventEmitter,
): Promise<BaijiahaoPublishResultOutput> => {
  logger.info(`百家号图文发布 ${taskData.taskId}`);
  const pubResult: BaijiahaoPublishResultOutput = {
    code: 0,
    msg: '',
    taskId: taskData.taskId,
  };

  try {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    SetProgressEvent(eventCallback, 1, '准备上传图片', taskData.taskId);
    SetProgressNewEvent(eventCallback, publishStatusEnum.uploading, pubResult.msg ?? '开始发布', taskData.taskId);
    let webProxy: HttpsProxyAgent<string> | object | undefined = undefined;
    if (taskData.proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(taskData.proxy);
    }
    if (!token) {
      const tokenResult = await getBaijiahaoBaseToken(cookie);

      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      const publishTokenResult = await getBaijiahaoPublishArticleToken(cookie, tokenResult.token);

      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      token = publishTokenResult.publishToken;

      if (!token) {
        pubResult.msg = publishTokenResult.msg;
        pubResult.code = publishTokenResult.code;
        logger.error(
          `获取token失败 ${taskData.taskId} ${cookie} ${JSON.stringify(tokenResult)} ${JSON.stringify(
            publishTokenResult,
          )}`,
        );
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploadFail,
          pubResult.msg ?? '获取token失败',
          taskData.taskId,
        );
        return pubResult;
      }
    }
    // 标题检测
    const keywords = await getBaijiahaoKeywordListAsync(cookie, taskData.title, taskData.content, 'news');
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    const titleRcmdParams = {};
    titleRcmdParams['content'] = encodeURIComponent(taskData.content);
    titleRcmdParams['title'] = encodeURIComponent(taskData.title);
    if (keywords.errno === 0) {
      if (keywords?.domain && keywords.domain.length > 0) {
        titleRcmdParams['domain'] = encodeURIComponent(keywords.domain);
      }
      if (keywords?.data?.length > 0) {
        for (const keyword of keywords.data) {
          titleRcmdParams['keyword[]'] = encodeURIComponent(keyword.name);
        }
      }
    }
    const titleRcmdString = Object.keys(titleRcmdParams)
      .map((key) => `${key}=${titleRcmdParams[key]}`)
      .join('&');
    await getBaijiahaoTitleRcmdAsync(cookie, titleRcmdString, 'news');

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // 随机一个500-1000的数字延时
    await Task.Delay(Math.floor(Math.random() * 501) + 500);

    const uploadImageList: Array<UploadImageListResponse> = [];

    //上传正文中的图片
    let content = await replaceImgInHtml(
      cookie,
      app_id,
      taskData.content,
      taskData.taskId,
      uploadImageList,
      eventCallback,
      taskData,
    );
    if (!content) {
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult.msg ?? '上传正文图片失败',
        taskData.taskId,
      );
    }
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // 随机一个500-1000的数字延时
    await Task.Delay(Math.floor(Math.random() * 501) + 500);

    // chooseImage
    if (uploadImageList.length > 0) {
      const syncChooseParams = {};
      const chooseParams = {};
      syncChooseParams['type'] = 'news';
      chooseParams['title'] = encodeURIComponent(taskData.title);
      chooseParams['pic_num'] = taskData.covers.length >= 3 ? 3 : 1;
      for (let i = 0; i < uploadImageList.length; i++) {
        syncChooseParams[`urls[${i}]`] = uploadImageList[i].bos_url;
        chooseParams[`urls[${i}][url]`] = uploadImageList[i].bos_url;
        chooseParams[`urls[${i}][width]`] = uploadImageList[i].width;
        chooseParams[`urls[${i}][height]`] = uploadImageList[i].height;
      }
      const syncChooseString = Object.keys(syncChooseParams)
        .map((key) => `${key}=${syncChooseParams[key]}`)
        .join('&');

      const chooseString = Object.keys(chooseParams)
        .map((key) => `${key}=${chooseParams[key]}`)
        .join('&');
      await getSyncChooseImage(cookie, syncChooseString, 'news');

      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      await getChooseImage(cookie, chooseString, 'news');

      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      // 随机一个500-1000的数字延时
      await Task.Delay(Math.floor(Math.random() * 501) + 500);
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    //上传视频
    content = await replaceVideoInHtml(
      cookie,
      app_id,
      content,
      taskData.taskId,
      eventCallback,
      taskData,
      pubResult,
      token,
    );
    if (!content) {
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult.msg ?? '上传视频失败',
        taskData.taskId,
      );
    }
    pubResult.code = 0;
    pubResult.msg = '';

    SetProgressEvent(eventCallback, 80, '准备上传封面', taskData.taskId);
    //上传封面

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    const uploadedCovers = await uploadCovers(cookie, app_id, taskData.covers);

    if (!uploadedCovers?.coverImages?.length) {
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult.msg ?? '上传封面失败',
        taskData.taskId,
      );
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    const verticalCover = await uploadVerticalCover(
      cookie,
      app_id,
      taskData.verticalCover,
      taskData.verticalCoverWidth,
      taskData.verticalCoverHeight,
    );

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    //组装数据
    const postData = buildPostData(
      taskData,
      content,
      uploadedCovers.coverImages,
      uploadedCovers.coverImagesMap,
      verticalCover,
    );

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不能取消
    taskData.cancelToken?.disable(privateKey);

    console.debug('百家号推送数据', taskData.taskId, cookie, postData);
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    const publishResult = await publish(cookie, token, postData, taskData.pubType === 0 ? 0 : 1, webProxy);
    console.debug('百家号推送返回数据', taskData.taskId, publishResult);

    pubResult.code = publishResult?.errno;
    pubResult.msg = publishResult?.errmsg ?? '';
    pubResult.publishId = publishResult?.ret?.id;
    pubResult.mediaContent = publishResult?.ret;

    if (pubResult.code == 0 && pubResult.publishId) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      logger.error(`百家号图文发布失败 ${taskData.taskId} ${cookie} ${postData} ${publishResult}`);
      pubResult.msg = `发布失败${pubResult.msg}`;
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushFail, pubResult.msg ?? '推送失败', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
    }

    return pubResult;
  } catch (e) {
    SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
    console.debug('发布失败:', taskData.taskId, e?.toString(), taskData);

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
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushFail, pubResult.msg ?? '推送失败', taskData.taskId);
    logger.error(`百家号图文发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};

const replaceImgInHtml = async (
  cookie: string,
  app_id: number,
  content: string,
  taskId: string,
  uploadImageList: Array<UploadImageListResponse>,
  eventCallback: EventEmitter,
  taskData: BaijiahaoArticleTaskInput,
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

      const resultJson: {
        bos_url?: string;
        width?: number;
        height?: number;
        mime?: string;
        message?: string;
      } = {};

      //直接官方转换
      if (imgUrl?.toLowerCase().startsWith('http')) {
        const result = await getImgFromUrl(cookie, imgUrl, 'news');
        if (result?.data?.bos_url) {
          resultJson['bos_url'] = result?.data?.bos_url;
          resultJson['width'] = result?.data?.width;
          resultJson['height'] = result?.data?.height;
          resultJson['mime'] = result?.data?.mime;
          resultJson['message'] = result?.error_msg;
          uploadImageList.push({ bos_url: result.data.bos_url, width: result.data.width, height: result.data.height });
        }
      }

      //下载后再上传
      if (!resultJson?.bos_url) {
        const imgData = await readImageData(imgUrl, 'jpeg');

        if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
          throw new Error(`图片下载失败-${imgData.status}-${imgUrl}`);
        }
        const binaryResult = await uploadImageBinary(cookie, app_id, imgData.data, 'news', imgData.ext);
        if (binaryResult?.ret?.bos_url) {
          resultJson['bos_url'] = binaryResult?.ret?.bos_url;
          resultJson['mime'] = binaryResult?.ret?.mime;
          resultJson['message'] = binaryResult?.error_msg;
          uploadImageList.push({ bos_url: binaryResult.ret.bos_url, width: 0, height: 0 });
        }
      }

      //上传成功，替换内容中图片相关信息
      if (resultJson?.bos_url) {
        const upImageUrl = resultJson?.bos_url;
        img.setAttribute('src', upImageUrl);
        img.setAttribute('data-bjh-origin-src', upImageUrl);
      } else {
        throw new Error(`图片上传失败-${imgUrl}-${resultJson.message ?? ''}`);
      }
    }
    content = html.DocumentNode.OuterHtml();
    return htmlDecodeKeepBr(content);
  } else {
    //throw new Error('正文中至少需要一张图片');
    return content;
  }
};

const uploadCovers = async (
  cookie: string,
  app_id: number,
  covers: Array<ImageInfo>,
): Promise<{ coverImages: Array<CoverImagesResponse>; coverImagesMap: Array<CoverImagesMapResponse> }> => {
  const coverImagesList: Array<CoverImagesResponse> = [];
  const coverImagesMapList: Array<CoverImagesMapResponse> = [];
  if (covers?.length > 0) {
    for (const img of covers) {
      const resultJson: {
        bos_url?: string;
        width?: number;
        height?: number;
        mime?: string;
        message?: string;
      } = {};

      //先在线转
      if (img.pathOrUrl.toLowerCase().startsWith('http')) {
        const uploadImageByUrlResult = await getImgFromUrl(cookie, img.pathOrUrl, 'news');
        if (uploadImageByUrlResult?.data?.bos_url) {
          resultJson['bos_url'] = uploadImageByUrlResult?.data?.bos_url;
          resultJson['width'] = uploadImageByUrlResult?.data?.width;
          resultJson['height'] = uploadImageByUrlResult?.data?.height;
          resultJson['mime'] = uploadImageByUrlResult?.data?.mime;
          resultJson['message'] = uploadImageByUrlResult?.error_msg;
        }
      }

      //在线转换失败，走下载上传
      if (!resultJson?.bos_url) {
        //下载图片后上传
        const imgData = await readImageData(img.pathOrUrl, 'jpeg');
        if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
          throw new Error(`图片下载失败-${imgData.status}-${img.pathOrUrl}`);
        }
        const binaryResult = await uploadImageBinary(cookie, app_id, imgData.data, 'news', imgData.ext);

        if (binaryResult?.ret?.bos_url) {
          resultJson['bos_url'] = binaryResult?.ret?.bos_url;
          resultJson['mime'] = binaryResult?.ret?.mime;
          resultJson['message'] = binaryResult?.error_msg;
        }
      }

      if (!resultJson?.bos_url) {
        throw new Error(`图片上传失败-${resultJson?.message}-${img.pathOrUrl}`);
      }

      const imageUrl = resultJson?.bos_url;

      const coordResult = await getCoordRcmdAsync(
        cookie,
        resultJson?.width ?? img?.width ?? 4096,
        resultJson?.height ?? img?.height ?? 4096,
        imageUrl,
        'news',
        'news',
      );

      const cuttingResponse = await getCuttingPicAsync(
        cookie,
        coordResult?.data?.x ?? 0,
        coordResult?.data?.y ?? 0,
        resultJson?.width ?? img?.width ?? 4096,
        resultJson?.height ?? img?.height ?? 4096,
        imageUrl,
        'news',
        'news',
      );

      coverImagesList.push({
        src: decodeURIComponent(cuttingResponse?.data?.src ?? resultJson?.bos_url),
        cropData: {
          x: coordResult?.data?.x ?? 0,
          y: coordResult?.data?.y ?? 0,
          width: coordResult?.data?.w ?? img?.width ?? 4096,
          height: coordResult?.data?.h ?? img?.height ?? 4096,
        },
        machine_chooseimg: 0,
        isLegal: 1,
      });

      coverImagesMapList.push({
        src: decodeURIComponent(cuttingResponse?.data?.origin_src ?? cuttingResponse?.data?.src ?? resultJson?.bos_url),
        origin_src: decodeURIComponent(cuttingResponse?.data?.src ?? resultJson?.bos_url),
      });
    }
  }

  return { coverImages: coverImagesList, coverImagesMap: coverImagesMapList };
};

const uploadVerticalCover = async (
  cookie: string,
  app_id: number,
  verticalCover: string,
  verticalCoverWidth: number,
  verticalCoverHeight: number,
): Promise<string> => {
  const resultJson: {
    bos_url?: string;
    width?: number;
    height?: number;
    mime?: string;
    message?: string;
  } = {};
  if (!verticalCover) {
    return '';
  }
  //先在线转
  if (verticalCover?.toLowerCase()?.startsWith('http')) {
    const uploadImageByUrlResult = await getImgFromUrl(cookie, verticalCover, 'news');
    if (uploadImageByUrlResult?.data?.bos_url) {
      resultJson['bos_url'] = uploadImageByUrlResult?.data?.bos_url;
      resultJson['width'] = uploadImageByUrlResult?.data?.width;
      resultJson['height'] = uploadImageByUrlResult?.data?.height;
      resultJson['mime'] = uploadImageByUrlResult?.data?.mime;
      resultJson['message'] = uploadImageByUrlResult?.error_msg;
    }
  }

  //在线转换失败，走下载上传
  if (!resultJson?.bos_url) {
    //下载图片后上传
    const imgData = await readImageData(verticalCover, 'jpeg');
    if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
      throw new Error(`图片下载失败-${imgData.status}-${verticalCover}`);
    }
    const binaryResult = await uploadImageBinary(cookie, app_id, imgData.data, 'news');

    if (binaryResult?.ret?.bos_url) {
      resultJson['bos_url'] = binaryResult?.ret?.bos_url;
      resultJson['mime'] = binaryResult?.ret?.mime;
      resultJson['message'] = binaryResult?.error_msg;
    }
  }

  if (!resultJson?.bos_url) {
    throw new Error(`图片上传失败-${resultJson?.message}-${verticalCover}`);
  }

  const imageUrl = encodeURIComponent(resultJson?.bos_url);

  const coordResult = await getCoordRcmdAsync(
    cookie,
    resultJson?.width ?? verticalCoverWidth ?? 4096,
    resultJson?.height ?? verticalCoverHeight ?? 4096,
    imageUrl,
    'news',
    'newsRow',
  );

  const cuttingResponse = await getCuttingPicAsync(
    cookie,
    coordResult?.data?.x ?? 0,
    coordResult?.data?.y ?? 0,
    resultJson?.width ?? verticalCoverWidth ?? 4096,
    resultJson?.height ?? verticalCoverHeight ?? 4096,
    imageUrl,
    'news',
    'newsRow',
  );

  return cuttingResponse?.data?.src ?? resultJson?.bos_url;
};

const buildPostData = (
  taskData: BaijiahaoArticleTaskInput,
  content: string,
  coverImages: Array<CoverImagesResponse>,
  coverImagesMap: Array<CoverImagesMapResponse>,
  verticalCover: string,
): string => {
  const params = {};
  params['type'] = 'news';
  params['abstract_from'] = 3;
  params['task_enter_from'] = '';
  params['source'] = 'upload';
  params['cover_source'] = 'upload';
  params['bjhtopic_info'] = '';
  params['bjhtopic_id'] = '';
  params['usingImgFilter'] = false;
  params['title'] = encodeURIComponent(taskData.title);
  params['content'] = encodeURIComponent(content);
  params['vertical_cover'] = verticalCover ?? '';
  params['abstract'] = encodeURIComponent(taskData?.desc ?? '');
  if (taskData?.categoryName && taskData?.categoryName?.length > 0) {
    for (let i = 0; i < taskData?.categoryName?.length; i++) {
      params[`cate_user_cms[${i}]`] = encodeURIComponent(taskData?.categoryName[i]);
    }
  }
  params['len'] = content.length;
  params['subtitle'] = encodeURIComponent(taskData?.subTitle ?? '');
  if (coverImages?.length > 0) {
    params['cover_layout'] = coverImages?.length >= 3 ? 'three' : 'one';
    params['cover_images'] = encodeURIComponent(JSON.stringify(coverImages));
    params['_cover_images_map'] = encodeURIComponent(JSON.stringify(coverImagesMap));
  } else {
    params['cover_layout'] = 'one';
    params['cover_images'] = '';
    params['_cover_images_map'] = '';
  }
  params['original_status'] = taskData?.original ? taskData.original.toString() : '0';
  if (taskData.original && taskData.original === 2) {
    params['announce_id'] = 0;
    params['announce_info'] =
      '{"first_publish":0,"tp_author":' +
      (taskData?.originalAuthorName ?? '') +
      ',"tp_url":"' +
      (taskData?.originalUrl ?? '') +
      '"}';
  }

  if (taskData?.fansAttention && taskData.fansAttention === 1) {
    params['is_attention'] = 1;
    if (taskData?.attentionPrecent && taskData.attentionPrecent > 20) {
      params['is_attention_precent'] = taskData.attentionPrecent;
    } else {
      params['is_attention_precent'] = 20;
    }
  }
  let activityIndex = 0;

  // 自我推荐
  if (taskData?.selfRecommend && taskData.selfRecommend === 1) {
    params[`activity_list[${activityIndex}][id]`] = 1;
    params[`activity_list[${activityIndex}][is_checked]`] = 1;
    activityIndex++;
  }

  // 标题美化
  if (taskData?.titleBeautify && taskData.titleBeautify === 1) {
    params['isBeautify'] = true;
    params[`activity_list[${activityIndex}][id]`] = 408;
    params[`activity_list[${activityIndex}][is_checked]`] = 1;
    activityIndex++;
  } else {
    params['isBeautify'] = false;
  }

  // 自动生成视频
  params[`activity_list[${activityIndex}][id]`] = 'ttv';
  params[`activity_list[${activityIndex}][is_checked]`] =
    taskData?.generateVideo && taskData.generateVideo === 1 ? 1 : 0;
  activityIndex++;

  // aigc申明
  params[`activity_list[${activityIndex}][id]`] = 'aigc_bjh_status';
  params[`activity_list[${activityIndex}][is_checked]`] = taskData?.isAigc && taskData.isAigc === 1 ? 1 : 0;
  activityIndex++;

  // 金芒计划
  if (taskData?.kingMang && taskData.kingMang === 1) {
    params[`activity_list[${activityIndex}][id]`] = 'm_1';
    params[`activity_list[${activityIndex}][is_checked]`] = 1;
    activityIndex++;
  }

  // 支持打赏
  if (taskData?.reward && taskData.reward === 1) {
    params[`activity_list[${activityIndex}][id]`] = 'reward';
    params[`activity_list[${activityIndex}][is_checked]`] = 1;
    activityIndex++;
  }

  // 活动
  if (taskData?.activityId && taskData.activityId !== '0') {
    params[`activity_list[${activityIndex}][id]`] = `task_${taskData.activityId}`;
    params[`activity_list[${activityIndex}][is_checked]`] = 1;
    activityIndex++;
  }

  // 定时发布
  if (taskData?.publishTime && taskData.publishTime > 0) {
    params['clue'] = '';
    params['timer_time'] =
      taskData.publishTime > 999999999999 ? parseInt((taskData.publishTime / 1000).toFixed(0)) : taskData.publishTime;
  }

  const keys: string[] = Object.keys(params).sort((a, b) => a.localeCompare(b));

  return keys.reduce((acc, key, index) => {
    if (index === keys.length - 1) {
      return acc + key + '=' + params[key]; // 在最后一个键后面添加等号和对应的值
    } else {
      return acc + key + '=' + params[key] + '&'; // 在其他键后面添加等号、对应的值和&符号
    }
  }, '');
};

export interface CoverImagesResponse {
  src: string;
  cropData: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  machine_chooseimg: number;
  isLegal: number;
}

export interface CoverImagesMapResponse {
  src: string;
  origin_src: string;
}

export interface BaijiahaoArticleTaskInput {
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
   * 副标题
   */
  subTitle?: string;

  /**
   * 文章封面
   */
  covers: Array<ImageInfo>;

  /**
   * 竖版封面
   */
  verticalCover: string;

  /**
   * 竖版封面宽度
   */
  verticalCoverWidth: number;

  /**
   * 竖版封面高度
   */
  verticalCoverHeight: number;

  /**
   * 文章内容 html
   */
  content: string;

  /**
   * 描述
   */
  desc?: string;

  /**
   * 原创申明 1:申明 0:不申明
   */
  original?: number;

  /**
   * 首发作者
   */
  originalAuthorName?: string;

  /**
   * 首发链接
   */
  originalUrl?: string;

  /**
   * 文章分类
   */
  categoryName?: Array<string>;

  /**
   * 活动ID
   */
  activityId?: string;

  /**
   * 美化标题
   */
  titleBeautify?: number;

  /**
   * 自动生成视频
   */
  generateVideo?: number;

  /**
   * AI创作声明
   */
  isAigc?: number;

  /**
   * 支持用户打赏 1:支持 0:不支持
   */
  reward?: number;

  /**
   * 自荐
   */
  selfRecommend?: number;

  /**
   * 关注阅读全文
   */
  fansAttention?: number;

  /**
   * 关注阅读百分比
   */
  attentionPrecent?: number;

  /**
   * 金芒计划
   */
  kingMang?: number;

  /**
   * 定时发布，10位时间戳
   */
  publishTime?: number;

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}

export interface BaijiahaoPublishResultOutput extends BaseResult {
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
  mediaContent?: PublishDataResponse;
}

export interface UploadImageListResponse {
  bos_url: string;
  height?: number;
  width?: number;
}

const replaceVideoInHtml = async (
  cookie: string,
  app_id: number,
  content: string,
  taskId: string,
  eventCallback: EventEmitter,
  taskData: BaijiahaoArticleTaskInput,
  pubResult: BaijiahaoPublishResultOutput,
  tokenStr: string,
): Promise<string> => {
  const html = new HtmlDocument();
  html.LoadHtml(content);

  const videoNodes = html.DocumentNode?.SelectNodes('//video');

  if (videoNodes?.length > 0) {
    let processCount = 0;
    for (const video of videoNodes) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      // 每次随机一个500-1000的数字
      await Task.Delay(Math.floor(Math.random() * 501) + 500);
      SetProgressEvent(eventCallback, (25 / videoNodes.length) * processCount + 5, '视频上传中', taskId);
      processCount++;
      let videoPath = video.getAttribute('data-src');
      if (!videoPath) {
        videoPath = video.getAttribute('src') ?? '';
      }

      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      const upVideoInfo = await uploadVideo(videoPath, taskData, pubResult, eventCallback, app_id, tokenStr, 3, cookie);
      if (!upVideoInfo) {
        throw new Error(`视频上传失败:${pubResult.msg}`);
      }

      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      const coverInfo = await getVideoCover(cookie, upVideoInfo.mediaId, tokenStr);

      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      if (!coverInfo) {
        throw new Error(`自动获取视频封面失败:${videoPath}`);
      }
      const pTag = html.DocumentNode.doc.createElement('p');
      const pNode: Element = video.parentNode as Element;
      pNode.parentNode?.insertBefore(pTag, pNode);
      pNode.parentNode?.removeChild(pNode);
      pTag.setAttribute('data-bjh-box', 'video');
      const now = new Date().getTime();
      pTag.setAttribute('data-bjh-id', `video-box-WU_FILE_2${now}`);
      pTag.setAttribute('contenteditable', 'false');
      pTag.setAttribute('data-bjh-caption-id', `video-box-WU_FILE_2${now}`);
      pTag.setAttribute('data-bjh-video-media-id', upVideoInfo.mediaId);
      pTag.setAttribute('class', 'video-box upload-success');
      pTag.setAttribute('data-bjh-video-status', 'published');
      pTag.setAttribute('data-bjh-video-name', path.basename(videoPath));
      pTag.setAttribute('data-bjh-video-poster', coverInfo['coverImage']);

      const guid = Guid.NewGuid();

      const videoNode = html.DocumentNode.doc.createElement('video');
      videoNode.setAttribute('class', 'vjs-matrix video-js');
      videoNode.setAttribute('poster', coverInfo['coverImage']);
      videoNode.setAttribute('controlslist', 'nodownload');
      videoNode.setAttribute('id', 'vjs_video_1198_html5_api');
      videoNode.setAttribute('tabindex', '-1');
      videoNode.setAttribute('data-diagnose-id', guid);
      videoNode.setAttribute('video-cover-type', 'choose');
      videoNode.setAttribute('controls', 'controls');

      const sourceNode = html.DocumentNode.doc.createElement('source');
      sourceNode.setAttribute('src', coverInfo['sourceUrl']);
      sourceNode.setAttribute('type', 'video/mp4');
      sourceNode.setAttribute('data-diagnose-id', guid);
      videoNode.appendChild(sourceNode);
      pTag.appendChild(videoNode);
    }
    content = html.DocumentNode.OuterHtml();
    return content;
  }
  return content;
};

export const getVideoCover = async (
  cookie: string,
  videoId: string,
  tokenStr: string,
): Promise<object | null | undefined> => {
  for (let i = 0; i < 300; i++) {
    try {
      const url = `https://baijiahao.baidu.com/pcui/video/process`;

      const headers = {
        cookie: cookie,
        referer: 'https://baijiahao.baidu.com',
        token: tokenStr,
        'Content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      };

      const postData = `mediaId=${encodeURIComponent(videoId)}`;

      const result = await $http.post(url, postData, { headers: headers });

      if (result.data?.data?.editVideo?.coverImage?.startsWith('http')) {
        return result.data?.data?.editVideo;
      }
      await Task.Delay(1000);
    } catch (e) {
      console.error(e);
      await Task.Delay(1000);
    }
  }
  return null;
};

export const uploadVideo = async (
  videoPath: string,
  taskData: BaijiahaoArticleTaskInput,
  pubResult: BaijiahaoPublishResultOutput,
  eventCallback: EventEmitter,
  appId: number,
  tokenStr: string,
  maxThread: number,
  cookie: string,
): Promise<UploadCompleteResponse | null | undefined> => {
  let fileHandle: fs.promises.FileHandle | null = null;
  try {
    if (videoPath.startsWith('yi-file://')) {
      videoPath = videoPath.replace('yi-file://', '');
    }
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // 获取文件信息
    const fileStat = await fs.promises.stat(videoPath);
    fileHandle = await fs.promises.open(videoPath, 'r');
    const videoMd5 = await GetMD5ByPathLike(videoPath);
    const fileName = path.basename(videoPath);
    const videoLength = fileStat.size;

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // 获取上传参数
    const uploadVideoArgs = await getUploadArgsResponse(cookie, videoMd5, appId, tokenStr, 'short');
    if (!uploadVideoArgs?.upload_key) {
      console.debug('获取上传参数失败', taskData.taskId, uploadVideoArgs);

      pubResult.code = uploadVideoArgs?.error_code ?? uploadVideoArgs.errno ?? errorCode.data_error;
      pubResult.msg = '获取上传参数失败:' + (uploadVideoArgs.error_msg ?? uploadVideoArgs?.errmsg ?? '');

      return null;
    }

    // 开始读取并上传文件
    let readIndex = 0;

    // 分片大小
    const blockSize = 2097152;

    // 总片数
    const totalPartNums = Math.ceil(videoLength / blockSize);

    // 并行上传
    const tasks: Array<Promise<UploadVideoPartResponse>> = [];

    SetProgressEvent(eventCallback, 10, '视频上传中', taskData.taskId);
    if (uploadVideoArgs.list?.length != totalPartNums) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      // 文件大小小于等单个分片大小
      if (blockSize >= fileStat.size) {
        const buffer = Buffer.alloc(videoLength);
        const readData = await fileHandle.read(buffer, 0, videoLength, readIndex);
        if (readData.buffer.length > 0) {
          const uploadResult = await uploadVideoPart(
            cookie,
            readData.buffer,
            0,
            1,
            appId,
            videoMd5,
            fileName,
            videoLength,
            uploadVideoArgs.upload_key,
          );
          if (!uploadResult?.uploadId) {
            pubResult.code = uploadResult.error_code ?? uploadResult.errno ?? errorCode.data_error;
            pubResult.msg = '视频分片上传失败:' + (uploadResult.error_msg ?? uploadResult.errmsg ?? '');

            return null;
          }
        } else {
          pubResult.code = errorCode.io_error;
          pubResult.msg = '文件读取失败:' + videoPath;

          return null;
        }
      }
      // 文件有多个分片
      else {
        let partNum = 0;
        while (readIndex < videoLength) {
          partNum++;

          SetProgressEvent(
            eventCallback,
            10 + Number.parseFloat(((partNum / totalPartNums) * 0.7 * 100).toFixed(2).substring(0, 4)),
            '视频上传中',
            taskData.taskId,
          );

          let canReadNum = blockSize;
          let buffer = Buffer.alloc(blockSize);
          if (readIndex + blockSize > videoLength) {
            canReadNum = videoLength - readIndex;
            buffer = Buffer.alloc(canReadNum);
          }
          //取消任务执行
          taskData.cancelToken?.throwIfCancelled(privateKey);
          const readData = await fileHandle.read(buffer, 0, canReadNum, readIndex);
          if (readData.buffer.length > 0) {
            tasks.push(
              uploadVideoPart(
                cookie,
                readData.buffer,
                partNum - 1,
                totalPartNums,
                appId,
                videoMd5,
                fileName,
                videoLength,
                uploadVideoArgs.upload_key,
              ),
            );

            if (tasks.length > maxThread) {
              const uploadResult = await Promise.race(tasks);
              if (!uploadResult?.uploadId) {
                pubResult.code = uploadResult.error_code ?? uploadResult.errno ?? errorCode.data_error;
                pubResult.msg = '视频分片上传失败:' + (uploadResult.error_msg ?? uploadResult.errmsg ?? '');

                return null;
              }

              const uploadResultNew = await tasks.splice(0, 1)[0];
              if (!uploadResultNew?.uploadId) {
                pubResult.code = uploadResult.error_code ?? uploadResult.errno ?? errorCode.data_error;
                pubResult.msg = '视频分片上传失败:' + (uploadResult.error_msg ?? uploadResult.errmsg ?? '');

                return null;
              }
            }

            readIndex += readData.buffer.length;

            if (canReadNum < blockSize) {
              break;
            }
          } else {
            pubResult.code = errorCode.io_error;
            pubResult.msg = '文件读取失败:' + videoPath;

            return null;
          }
        }
      }
      while (tasks.length > 0) {
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);
        const uploadResult = await tasks.splice(0, 1)[0];
        if (!uploadResult?.uploadId) {
          pubResult.code = uploadResult.error_code ?? uploadResult.errno ?? errorCode.data_error;
          pubResult.msg = '视频分片上传失败:' + (uploadResult.error_msg ?? uploadResult.errmsg ?? '');

          return null;
        }
      }
    }

    SetProgressEvent(eventCallback, 81, '视频上传完成', taskData.taskId);

    SetProgressEvent(eventCallback, 82, '上传完成校验中', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // 检查视频上传是否成功
    const checkResult = await uploadCompleteResponse(
      cookie,
      appId,
      tokenStr,
      uploadVideoArgs.upload_key,
      totalPartNums,
      fileName,
      videoLength,
      'short',
    );
    if (!checkResult?.bos_url) {
      console.debug('视频上传校验失败', taskData.taskId, uploadVideoArgs, checkResult);

      pubResult.code = checkResult.error_code ?? checkResult.errno ?? errorCode.data_error;
      pubResult.msg = '上传校验失败:' + (checkResult.error_msg ?? checkResult.errmsg ?? '');

      return null;
    }

    SetProgressEvent(eventCallback, 85, '获取上传完成视频信息', taskData.taskId);

    pubResult.code = 0;
    pubResult.msg = '';
    checkResult.uploadKey = uploadVideoArgs.upload_key;
    return checkResult;
    // endregion
  } catch (e) {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    console.error('百家号横版视频上传失败', taskData.taskId, e);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = '视频上传失败';
    return null;
  } finally {
    fileHandle?.close();
  }
};
