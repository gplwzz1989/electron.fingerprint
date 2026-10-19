import { BilibiliPublishResultOutput } from './bilibili-video';
import { regex } from './bilibili-base.service';
import { HtmlDocument } from '../../htmlAgilityPack';
import { getImgFromUrl, UploadBilibiliImageResponse, uploadImageBinary } from './bilibili-article.service';
import { logger, publishStatusEnum, readImageData, SetProgressEvent, SetProgressNewEvent } from '../../utils';
import { ImageInfo } from '../../media-platform/baseModel';
import { EventEmitter } from 'events';

import { publish } from './bilibili-article.service';
import { AxiosError } from 'axios';
import { errorCode } from '../errorCode';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import { KuaiDaiLiProxy } from '@/media-platform/webproxy';

/**
 * 图文发布
 * @param cookie 账号登录成功cookie eg:key=value;key1=value2
 * @param taskData 图文发布任务体
 * @param eventCallback 进度通知回调
 */
export const publishBilibiliArticle = async (
  cookie: string,
  taskData: BilibiliArticleTaskInput,
  eventCallback: EventEmitter,
): Promise<BilibiliPublishResultOutput> => {
  logger.error(`B站图文发布 ${taskData.taskId}`);
  const pubResult: BilibiliPublishResultOutput = {
    code: 0,
    msg: '',
    taskId: taskData.taskId,
  };
  try {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploading, '开始发布', taskData.taskId);
    const csrfTokenMatch = regex.exec(cookie);
    const csrfToken = csrfTokenMatch ? csrfTokenMatch[1] : '';
    if (!csrfToken) {
      logger.error(`cookie部分缺失 ${taskData.taskId} ${cookie}`);
      pubResult.code = -1;
      pubResult.msg = '登录失效';
      SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, pubResult.msg ?? '上传失败', taskData.taskId);
      return pubResult;
    }

    SetProgressEvent(eventCallback, 1, '准备上传图片', taskData.taskId);
    //上传正文中的图片
    const contentImage = new Map<string, string>();
    const content = await replaceImgInHtml(
      cookie,
      taskData.content,
      csrfToken,
      contentImage,
      taskData.taskId,
      eventCallback,
      taskData,
    );

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressEvent(eventCallback, 80, '准备上传封面', taskData.taskId);
    //上传封面
    const uploadedCovers = await uploadCover(cookie, taskData.covers, csrfToken, contentImage);
    if (!uploadedCovers?.length) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, '封面上传失败', taskData.taskId);
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    //组装数据
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    const buvid = /buvid3=([a-zA-Z0-9-]{20,})/;
    const buvid3 = buvid.exec(cookie);
    const postData = buildPostData(taskData, content, uploadedCovers, '', csrfToken, buvid3 ? buvid3[1] : '');

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);

    console.debug('B站推送数据', taskData.taskId, cookie, postData);
    let publishResult = await publish(cookie, postData, csrfToken, taskData.pubType);
    if (publishResult.code === -352) {
      publishResult = await publish(
        cookie,
        postData,
        csrfToken,
        taskData.pubType,
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0',
      );
    }
    console.debug('B站推送返回数据', taskData.taskId, publishResult);

    pubResult.code = publishResult?.code;
    pubResult.msg = publishResult?.message ?? '';
    pubResult.publishId = publishResult?.data?.aid?.toString();

    if (pubResult.code == 0 && (pubResult.publishId || taskData.pubType == 0)) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      pubResult.msg = `发布失败${pubResult.msg}`;
      if ((pubResult.code === -352)) {
        pubResult.msg =
          '发布失败:官方检测到您的账号存在风险,请前往此账号《创作者中心》发布作品,发布时会跳出验证,验证通过即可一键发布。';
      }
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushFail, pubResult.msg, taskData.taskId);
      logger.error(`B站文章发布失败 ${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(publishResult)}`);
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
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushFail, pubResult.msg, taskData.taskId);
    logger.error(`B站文章发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};

/**
 * 上传并替换正文中的图片信息
 * @param cookie
 * @param content 正文html
 * @param csrfToken
 * @param contentImage 用于存储正文中上传完成的图片信息
 * @param taskId
 * @param eventCallback
 * @param taskData
 */
const replaceImgInHtml = async (
  cookie: string,
  content: string,
  csrfToken: string,
  contentImage: Map<string, string>,
  taskId: string,
  eventCallback: EventEmitter,
  taskData: BilibiliArticleTaskInput,
): Promise<{ htmlContent: string; textContent: string }> => {
  content = content.replace(/<div>/g, '<p>');
  content = content.replace(/<\/div>/g, '<p>');
  const html = new HtmlDocument();
  html.LoadHtml(content);

  const imgNodes = html.DocumentNode?.SelectNodes('//img');
  if (imgNodes?.length > 100) {
    throw new Error(`你已经插入${imgNodes?.length}张图片了，目前最多支持插入100张哦`);
  }

  if (imgNodes?.length > 0) {
    let processCount = 0;
    for (const img of imgNodes) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      SetProgressEvent(eventCallback, (80 / imgNodes.length) * processCount + 5, '图片上传中', taskId);
      processCount++;
      let imgUrl = img.getAttribute('src') ?? img.getAttribute('data-src');
      if (!imgUrl) {
        continue;
      }
      if (imgUrl.startsWith('//')) {
        imgUrl = 'http:' + imgUrl;
      }

      let resultJson: UploadBilibiliImageResponse = { code: 0 };

      //直接官方转换
      if (imgUrl.toLowerCase().startsWith('http')) {
        resultJson = await getImgFromUrl(cookie, imgUrl, csrfToken);
      }
      //下载后再上传
      if (!resultJson?.data?.url?.toString()) {
        const imgData = await readImageData(imgUrl, 'jpeg');

        if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
          throw new Error(`图片下载失败-${imgData.status}-${imgUrl}`);
        }
        resultJson = await uploadImageBinary(cookie, imgData.data, csrfToken, imgData.ext);
      }

      //上传成功，替换内容中图片相关信息
      if (resultJson?.data?.url?.toString()) {
        const upImageUrl = resultJson?.data?.url?.toString();
        img.setAttribute('src', upImageUrl.replace(/https?:/, ''));
        img.setAttribute('data-data', '');
        img.setAttribute('data-size', resultJson.data?.size?.toString() ?? '');

        //把img标签放到figure标签里，还要新增figcaption标签
        const figure = html.DocumentNode.doc.createElement('figure');
        const figcaption = html.DocumentNode.doc.createElement('figcaption');
        const cloneimgNode = img.cloneNode();

        figure.setAttribute('contenteditable', 'false');
        figure.setAttribute('class', 'img-box');
        figcaption.setAttribute('class', 'caption');
        figcaption.setAttribute('contenteditable', '');
        figure.appendChild(cloneimgNode);
        figure.appendChild(figcaption);
        if (!img.parentNode?.nodeName?.toString() || img.parentNode?.nodeName?.toString() === '#document') {
          const p = html.DocumentNode.doc.createElement('p');
          p.appendChild(figure);
          img.parentNode?.insertBefore(p, img);
          html.DocumentNode.doc.removeChild(img);
        } else {
          img.parentNode.insertBefore(figure, img);
          html.DocumentNode.doc.removeChild(img);
        }
        contentImage.set(imgUrl, resultJson?.data?.url);
      } else {
        throw new Error(`图片上传失败-${imgUrl}-${resultJson.message ?? ''}`);
      }
    }
    content = html.DocumentNode.OuterHtml();
    content = content.replace(
      /<figcaption class="caption" contenteditable=""\/>/g,
      '<figcaption class="caption" contenteditable=""></figcaption>',
    );
    content = content.replace(/<\/figure>/g, '</figure><p><br></p>');
    return { htmlContent: content, textContent: html.DocumentNode.InnerText() };
  } else {
    return { htmlContent: content, textContent: html.DocumentNode.InnerText() };
  }
};

/**
 * 封面上传
 * @param cookie
 * @param covers 封面列表
 * @param csrfToken
 * @param contentImg 已经上传的正文图片
 */
const uploadCover = async (
  cookie: string,
  covers: Array<ImageInfo>,
  csrfToken: string,
  contentImg: Map<string, string>,
): Promise<Array<ImageInfo>> => {
  const re: Array<ImageInfo> = [];

  if (covers?.length > 0) {
    for (const img of covers) {
      //图片是正文中已经有的图片，直接使用
      if (contentImg.get(img.pathOrUrl)) {
        re.push({ pathOrUrl: contentImg.get(img.pathOrUrl) ?? '' });
      } else {
        let uploadResult: UploadBilibiliImageResponse | undefined = undefined;

        //先在线转
        if (img.pathOrUrl.toLowerCase().startsWith('http')) {
          uploadResult = await getImgFromUrl(cookie, img.pathOrUrl, csrfToken);
        }

        //在线转换失败，走下载上传
        if (!uploadResult?.data?.url) {
          //下载图片后上传
          const imgData = await readImageData(img.pathOrUrl, 'jpeg');
          if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
            throw new Error(`图片下载失败-${imgData.status}-${img.pathOrUrl}`);
          }
          uploadResult = await uploadImageBinary(cookie, imgData.data, csrfToken, imgData.ext);
        }

        if (!uploadResult?.data?.url) {
          throw new Error(`图片上传失败-${uploadResult?.message}-${img.pathOrUrl}`);
        }

        re.push({ pathOrUrl: uploadResult.data.url });
      }
    }
  }

  return re;
};

/**
 * 构造发布数据
 * @param taskData 图文发布任务体
 * @param content 经过处理后的内容，包裹html内容和纯文字内容
 * @param covers 上传完成的封面信息
 * @param aid 草稿id，可对更新草稿
 * @param csrfToken
 * @param buvid3
 */
// noinspection SpellCheckingInspection
const buildPostData = (
  taskData: BilibiliArticleTaskInput,
  content: { htmlContent: string; textContent: string },
  covers: Array<ImageInfo>,
  aid: string,
  csrfToken: string,
  buvid3: string,
): string => {
  const re = {};
  const contentText = content.textContent;
  re['title'] = encodeURIComponent(taskData.title ?? '');
  re['banner_url'] = '';
  re['content'] = encodeURIComponent(content.htmlContent);
  re['summary'] = encodeURIComponent(contentText.substring(0, 250).trim());
  re['words'] = contentText?.length;

  //二级分类id
  re['category'] = taskData.secondCategoryId ? taskData.secondCategoryId : '15';

  //文集id
  re['list_id'] = '0';

  //无封面类型
  re['tid'] = '5';
  if (!(covers?.length > 0)) {
    //1封面类型
    re['tid'] = '5';
  } else if (covers?.length > 2) {
    //3封面类型
    re['tid'] = '3';
  } else {
    //封面类型
    re['tid'] = '4';
  }

  re['reprint'] = '0';

  //标签
  re['tags'] = encodeURIComponent(taskData.tags ? taskData.tags.join(',') : '');

  //封面
  re['image_urls'] = encodeURIComponent(
    covers?.length > 0 ? covers.map((x) => x.pathOrUrl.replace(/https?:/, '')).join(',') : '',
  );
  re['origin_image_urls'] = re['image_urls'];
  re['dynamic_intro'] = '';
  re['media_id'] = '0';
  re['spoiler'] = '0';
  re['original'] = taskData.original ?? '0';
  re['top_video_bvid'] = '';
  re['aid'] = aid ?? '';
  re['csrf'] = csrfToken;
  re['platform'] = 'web';
  re['buvid'] = buvid3;
  re['device'] = '';
  re['build'] = '';
  re['mobi_app'] = '';
  //re['private_pub'] = 2; //2:公开
  if (taskData.pubType == 0) {
    //保存草稿
    re['action'] = '1';
  } else {
    re['up_reply_closed'] = '0';
    re['comment_selected'] = '0';
    re['items'] = '';
    if (taskData.activityId?.toString()) {
      //活动id
      re['act_id'] = taskData.activityId ?? '';
    }

    //定时发布
    if (taskData.publishTime) {
      const timeStr = taskData.publishTime?.toString();
      if (timeStr.length < 10) {
        throw new Error('定时发布日期格式非法:' + timeStr);
      }
      if (timeStr.length == 13) {
        re['publish_time'] = taskData.publishTime / 1000;
      } else {
        re['publish_time'] = parseInt(timeStr.substring(0, 10));
      }
    } else {
      re['publish_time'] = '0';
    }
  }
  const reList: Array<string> = [];
  for (const key in re) {
    reList.push(`${key}=${re[key]}`);
  }
  return reList.join('&');
};

export interface BilibiliArticleTaskInput {
  cancelToken?: CancelToken;
  /**
   * 任务id
   */
  taskId: string;

  /**
   * 发布类型
   * 0 存草稿 平台支持才有效，否则默认为发布
   * 1 发布
   */
  pubType: number;

  /**
   * 标题
   */
  title: string;

  /**
   * 封面，支持单封面和三封面
   */
  covers: Array<ImageInfo>;

  /**
   * 内容，html字符串
   */
  content: string;

  /**
   * 一级分类id
   */
  firstCategoryId: number;

  /**
   * 二级分类id
   */
  secondCategoryId: number;

  /**
   * 标签
   */
  tags?: Array<string>;

  /**
   * 原创申明 1:申明 0:不申明
   */
  original?: number;

  /**
   * 活动id
   */
  activityId?: string;

  /**
   *定时发布时间
   */
  publishTime?: number;

  proxy?: KuaiDaiLiProxy;
}
