import { EventEmitter } from 'events';
import {
  htmlDecode,
  logger,
  publishStatusEnum,
  readImageData,
  SetProgressEvent,
  SetProgressNewEvent,
  Task,
} from '../../utils';
import { AxiosError } from 'axios';
import { errorCode } from '../../media-platform/errorCode';
import { HtmlDocument } from '@/htmlAgilityPack';
import { ImageInfo } from '../baseModel';
import { CancelToken, privateKey } from '../../utils/CancelToken';
import { BaseResult } from '../baseResult';
import {
  getCoverImageResponse,
  getImgFromUrl,
  publishArticle,
  QieCoverImageItem,
  QieUrlImageItem,
  uploadImageBinary,
} from './qiehao-article.service';
import { QiehaoArticleCategory } from './qiehao-category.service';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '../webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 *
 * @param cookie
 * @param taskData
 * @param eventCallback
 */
export const publishQiehaoArticle = async (
  cookie: string,
  taskData: QiehaoArticleTaskInput,
  eventCallback: EventEmitter,
): Promise<QiehaoPublishResultOutput> => {
  logger.info(`企鹅号图文发布 ${taskData.taskId}`);
  const pubResult: QiehaoPublishResultOutput = {
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
    if (taskData.pubType === 0 && taskData.publishTime) {
      pubResult.code = -1;
      pubResult.msg = '定时发布不能存草稿';
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult?.msg ? pubResult.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }
    SetProgressEvent(eventCallback, 1, '准备上传图片', taskData.taskId);

    // 随机一个500-1000的数字延时
    await Task.Delay(Math.floor(Math.random() * 501) + 500);

    const uploadImageList: Array<QieUrlImageItem> = [];

    //上传正文中的图片
    const content = await replaceImgInHtml(
      cookie,
      taskData.content,
      taskData.taskId,
      uploadImageList,
      eventCallback,
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
    const uploadedCovers = await uploadCovers(cookie, taskData.covers);
    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    //组装数据
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    const postData = buildPostData(taskData, content, uploadedCovers);

    console.debug('企鹅号推送数据', taskData.taskId, cookie, postData);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);
    const publishResult = await publishArticle(cookie, taskData.pubType, postData, !!taskData.publishTime, webProxy);
    console.debug('企鹅号推送返回数据', taskData.taskId, publishResult);

    pubResult.code = publishResult?.response?.code ?? -1;
    pubResult.msg = publishResult?.response?.msg;

    if (pubResult.code == 0) {
      pubResult.publishId = publishResult?.data['articleId'];
      if (!pubResult.publishId && publishResult?.data['article']) {
        pubResult.publishId = publishResult?.data['article']['Farticle_id']?.toString();
      }
      if (!pubResult.publishId && publishResult?.data && publishResult?.data[0]) {
        pubResult.publishId = publishResult.data[0]['articleId'];
      }
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      if (pubResult.msg?.includes('msg:')) {
        pubResult.msg = pubResult.msg?.split('msg:')[1];
      }
      if (pubResult.code === -5002) {
        pubResult.msg = '发布失败:发文数超限';
      }
      if (pubResult.code === -50121) {
        pubResult.msg = '账号资质未通过';
      }
      pubResult.msg = `发布失败${pubResult.msg}`;
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
      logger.error(`企鹅号文章发布失败 ${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(publishResult)}`);
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
    logger.error(`企鹅号文章发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
    if (pubResult?.msg?.includes('not login')) {
      pubResult.msg = '账号失效，请重新授权后再试';
    }
  }

  return pubResult;
};

const replaceImgInHtml = async (
  cookie: string,
  content: string,
  taskId: string,
  uploadImageList: Array<QieUrlImageItem>,
  eventCallback: EventEmitter,
  taskData: QiehaoArticleTaskInput,
): Promise<string> => {
  if (content.includes('<a') && content.includes('</a>')) {
    //不允许外链，需要移除
    content = content.replace(/<a[^>]+>(.*?)<\/a>/g, '$1');
  }
  const html = new HtmlDocument();
  html.LoadHtml(content);

  const imgNodes = html.DocumentNode?.SelectNodes('//img');

  if (imgNodes?.length > 0) {
    const uploadedImgs: any = {};
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
        const result = await getImgFromUrl(cookie, imgUrl);
        if (result?.data[imgUrl].size) {
          const upItem =
            result?.data?.[imgUrl].size?.['1000'] ??
            result?.data?.[imgUrl].size?.['641'] ??
            result?.data?.[imgUrl].size?.['640'] ??
            result?.data?.[imgUrl].size?.['0'];
          uploadedUrl = upItem?.imageUrl ?? upItem?.imageUrl ?? upItem?.imageUrl ?? upItem?.imageUrl;
          uploadImageList.push(upItem);
        }
      }

      //下载后再上传
      if (!uploadedUrl) {
        const imgData = await readImageData(imgUrl, 'jpeg');

        if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
          throw new Error(`图片读取失败-${imgData.status}-${imgUrl}`);
        }
        const binaryResult = await uploadImageBinary(cookie, imgData.data, imgData.ext);
        if (binaryResult?.data?.url?.size) {
          const upItem =
            binaryResult?.data?.url?.size?.['1000'] ??
            binaryResult?.data?.url?.size?.['641'] ??
            binaryResult?.data?.url?.size?.['640'] ??
            binaryResult?.data?.url?.size?.['0'];
          uploadedUrl = upItem?.imageUrl ?? upItem?.imageUrl ?? upItem?.imageUrl ?? upItem?.imageUrl;
          uploadImageList.push(upItem);
        }
        if (!uploadedUrl) {
          throw new Error(`图片上传失败-${binaryResult.message}-${imgUrl}`);
        }
      }

      //上传成功，替换内容中图片相关信息
      if (uploadedUrl) {
        img.setAttribute('src', uploadedUrl);
        img.setAttribute('ori_src', imgUrl);
        uploadedImgs[uploadedUrl] = { aigc_user_statement: 2, can_modify: 1, id: uploadedUrl, resource_type: 'image' };
      } else {
        throw new Error(`图片上传失败-${imgUrl}}`);
      }
    }
    taskData['imgStatement'] = JSON.stringify(uploadedImgs);
    content = html.DocumentNode.OuterHtml();
    return content;
  } else {
    return content;
  }
};

const uploadCovers = async (cookie: string, covers: Array<ImageInfo>): Promise<Array<QieCoverImageItem>> => {
  const upCovers: Array<QieCoverImageItem> = [];
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
        const result = await getImgFromUrl(cookie, imgUrl);
        if (result?.data[imgUrl].size) {
          const upItem =
            result?.data?.[imgUrl].size?.['1000'] ??
            result?.data?.[imgUrl].size?.['641'] ??
            result?.data?.[imgUrl].size?.['640'] ??
            result?.data?.[imgUrl].size?.['0'];
          uploadedUrl = upItem?.imageUrl ?? upItem?.imageUrl ?? upItem?.imageUrl ?? upItem?.imageUrl;
        }
      }

      //下载后再上传
      if (!uploadedUrl) {
        const imgData = await readImageData(imgUrl, 'jpeg');

        if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
          throw new Error(`图片读取失败-${imgData.status}-${imgUrl}`);
        }
        const binaryResult = await uploadImageBinary(cookie, imgData.data, imgData.ext);
        if (binaryResult?.data?.url?.size) {
          const upItem =
            binaryResult?.data?.url?.size?.['1000'] ??
            binaryResult?.data?.url?.size?.['641'] ??
            binaryResult?.data?.url?.size?.['640'] ??
            binaryResult?.data?.url?.size?.['0'];
          uploadedUrl = upItem?.imageUrl ?? upItem?.imageUrl ?? upItem?.imageUrl ?? upItem?.imageUrl;
        }
        if (!uploadedUrl) {
          throw new Error(`封面图片上传失败-${binaryResult.message}-${imgUrl}`);
        }
      }

      const coverFinalUrl = await getCoverImageResponse(cookie, uploadedUrl);
      if (!coverFinalUrl?.data?.url) {
        throw new Error(`封面图片上传失败-${coverFinalUrl.message}-${imgUrl}`);
      }
      upCovers.push(coverFinalUrl.data.url);
      if (upCovers.length >= 3) {
        break;
      }
    }
  }

  return upCovers;
};

const buildPostData = (
  taskData: QiehaoArticleTaskInput,
  content: string,
  coverImages: Array<QieCoverImageItem>,
): string => {
  const declareMap = {
    1: '该文章由AI生成',
    2: '个人观点，仅供参考',
    3: '剧情演绎，仅供娱乐',
    7: '该文章由AI辅助创作',
    8: '健康医疗分享，仅供参考',
    9: '危险行为，请勿模仿',
  };
  const re = {
    video: '',
    title: '',
    title2: '',
    tag: '',
    cover_type: 1,
    imgurl_ext: '',
    category_id: '',
    content: '',
    orignal: '0',
    user_original: 0,
    needpub: 0,
    commercialization_source: '',
    caimaiInfo: '',
    isHowto: 0,
    howtoInfo: '',
    daihuoInfo: '',
    conclusion: '',
    summary: '',
    event: '',
    mediaId: '',
    music: '',
    activity: '',
    apply_olympic_flag: 0,
    apply_push_flag: 0,
    apply_reward_flag: 0,
    reward_flag: 0,
    survey_id: '',
    survey_name: '',
    type: 0,
    novel: '',
    activity_type: '',
    business_cash: 0,
    business_optimize: 0,
    commodity: '',
    pushInfo: '',
    is_commercial: 0,
    temp: '',
    video_source_data: '',
    event_id: '',
    event_name: '',
    om_activity_id: '',
    om_activity_name: '',
    imgurlsrc: 'custom',
    resource_aigc_mark_info: taskData['imgStatement'],
  };
  re.video = '';
  re.title = taskData.title ?? '';
  re.title2 = '';
  let tagStr = '';
  const tags = taskData?.tags;
  while (tags?.length >= 5) {
    tags.pop();
  }
  if (tags?.length > 0) {
    tagStr = tags.join(',');
  }
  re.tag = tagStr ?? '';
  re.cover_type = coverImages?.length >= 3 ? 3 : 1;
  re.imgurl_ext = JSON.stringify(coverImages);
  re.category_id = taskData?.category?.id?.toString() ?? '';
  re.content = htmlDecode(content ?? '');

  re.orignal = '0';
  re.user_original = 0;

  re.needpub = taskData.pubType ?? 0;
  re.commercialization_source = '';
  re.caimaiInfo = '';
  re.isHowto = 0;
  re.howtoInfo = '';
  re.daihuoInfo = '';
  re.conclusion = '';
  re.summary = '';
  re.event = '';
  re.music = '';
  re.activity = '';
  re.apply_olympic_flag = 0;
  re.apply_push_flag = 0;
  re.apply_reward_flag = 0;
  re.reward_flag = 0;
  re.survey_id = '';
  re.survey_name = '';
  re.type = 0;
  re.novel = '';
  re.activity_type = '';
  re.business_cash = 0;
  re.business_optimize = 0;
  re.type = 0;
  re.commodity = '';
  re.pushInfo = '';
  re.is_commercial = 0;
  re.temp = '';
  re.video_source_data = '';

  //创作热点

  re.event_id = '';
  re.event_name = '';

  //约稿参数
  re.om_activity_id = '';
  re.om_activity_name = '';

  //定时发布
  if (taskData.publishTime) {
    re['scheduleTime'] = taskData.publishTime.toString();
  }
  //申明
  if (taskData.selfDeclare) {
    re['selfDeclare'] = JSON.stringify({ id: taskData.selfDeclare, desc: declareMap[taskData.selfDeclare] });
  } else {
    re['selfDeclare'] = JSON.stringify({ id: 0, desc: '作者声明：暂不声明' });
  }
  return JSON.stringify(re);
};

export interface QiehaoArticleTaskInput {
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
   * 文章信息
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
   *  标签
   */
  tags: Array<string>;

  /**
   * 原创申明 1:申明 0:不申明
   */
  original?: number;

  /**
   * 分类
   */
  category?: QiehaoArticleCategory;

  /**
   * 定时发布时间戳 10位，时间必须是5分钟的整倍
   */
  publishTime?: number;

  /**
   * 自主申明
   * 0:暂不申明
   * 1:该文章由AI生成
   * 2:个人观点，仅供参考
   * 3:剧情演绎，仅供娱乐
   * 7:该文章由AI辅助创作
   * 8:健康医疗分享，仅供参考
   * 9:危险行为，请勿模仿
   */
  selfDeclare?: 0 | 1 | 2 | 3 | 7 | 8 | 9;

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}

export interface QiehaoPublishResultOutput extends BaseResult {
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
