import { HtmlDocument } from '@/htmlAgilityPack';
import { DayuhaoUserInfoResponse, getUserInfoAsync } from './dayuhao-user.service';
import { htmlDecode, logger, publishStatusEnum, SetProgressEvent, SetProgressNewEvent, Task } from '@/utils';
import dayjs from 'dayjs';
import { BaseResult } from '../baseResult';
import { ImageInfo } from '../baseModel';
import { EventEmitter } from 'events';
import { AxiosError } from 'axios';
import { errorCode } from '@/media-platform/errorCode';
import {
  getDayuAutoCovers,
  getImgFromUrl,
  publishDayuhaoArticle,
  saveDayuhaoArticleDraft,
  uploadArticleImage,
} from './dayuhao-article.service';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '../webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import { sourceRemarkDescObj } from '@/media-platform/dayuhao/dayuhao-video';

export async function publishArticle(taskData: IDayuhaoArticleData, cookie: string, eventCallback?: EventEmitter) {
  logger.info(`大鱼号文章发布 ${taskData.taskId}`);
  if (!eventCallback) {
    eventCallback = new EventEmitter();
  }
  const pubResult: DayuHaoPublishResultOutput = {
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
    const userInfo = await getUserInfoAsync(cookie);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (userInfo?.code != 0) {
      pubResult.msg = userInfo?.msg ?? '获取用户信息失败';
      pubResult.code = userInfo?.code ?? -1;
      logger.error(`获取用户信息失败 ${taskData.taskId} ${cookie} ${JSON.stringify(userInfo)}`);
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult.msg ? pubResult?.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }

    taskData.content = htmlDecode(
      await ReplaceImgInHtml(cookie, taskData.content, userInfo, eventCallback, taskData.taskId, taskData),
    );

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressEvent(eventCallback, 80, '准备上传封面', taskData.taskId);
    const coverJarray = await GetCoverPackge(cookie, taskData, userInfo);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);

    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    //存草稿
    const draftPostData = GetDraftPostData(taskData, coverJarray, userInfo);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (taskData.save) {
      //不可取消
      taskData.cancelToken?.disable(privateKey);
    }
    const draftData = await saveDayuhaoArticleDraft(cookie, draftPostData, userInfo.data.utoken);
    if (!draftData?.data?._id) {
      pubResult.code = -1;
      pubResult.msg = draftData?.error ?? '草稿保存失败';
      logger.error(`草稿保存失败 ${taskData.taskId} ${cookie} ${draftPostData} ${JSON.stringify(draftData)}`);
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult.msg ? pubResult?.msg : '推送草稿失败',
        taskData.taskId,
      );
      return pubResult;
    }
    pubResult.publishId = draftData.data._id;
    if (taskData.save) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送草稿成功', taskData.taskId);
      return pubResult;
    }

    //发布
    const postData = GetPublishPostData(taskData, userInfo, pubResult.publishId);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);

    const publishResult = await publishDayuhaoArticle(cookie, postData, userInfo.data.utoken, webProxy);
    if (publishResult?.errorType === 'original') {
      pubResult.code = -1;
      pubResult.msg = `发布失败:与其他原创申明文章冲突,URL:${
        publishResult?.result ? publishResult?.result[pubResult.publishId].link : ''
      }`;
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult.msg ? pubResult?.msg : '推送失败',
        taskData.taskId,
      );
      logger.error(`大鱼号文章发布失败 ${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(publishResult)}`);
    } else if (publishResult.error) {
      pubResult.code = -1;
      pubResult.msg = `发布失败:${publishResult?.error ?? ''}`;
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult.msg ? pubResult?.msg : '推送失败',
        taskData.taskId,
      );
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
      logger.error(`大鱼号文章发布失败 ${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(publishResult)}`);
    } else {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    }

    return pubResult;
  } catch (e) {
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
      pubResult.msg ? pubResult?.msg : '推送失败',
      taskData.taskId,
    );
    logger.error(`大鱼号文章发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
}

async function ReplaceImgInHtml(
  cookie: string,
  htmlContent: string,
  userInfo: DayuhaoUserInfoResponse,
  eventCallback: EventEmitter,
  taskId: string,
  taskData: IDayuhaoArticleData,
) {
  const html = new HtmlDocument();
  html.LoadHtml(htmlContent);
  const imgNodes = html.DocumentNode.SelectNodes('//img');

  if (imgNodes?.length > 0) {
    let processCount = 0;
    for (const img of imgNodes) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      await Task.Delay(Math.floor(Math.random() * 501) + 500);
      SetProgressEvent(eventCallback, (50 / imgNodes.length) * processCount + 5, '图片上传中', taskId);
      processCount++;
      let resultJson: Record<string, any> = {};
      let imgUrl = img.getAttribute('src') ?? img.getAttribute('data-src');

      if (!imgUrl) continue;
      if (imgUrl.startsWith('//')) imgUrl = 'http:' + imgUrl;
      if (imgUrl.startsWith('http')) resultJson = await getImgFromUrl(cookie, imgUrl, userInfo);
      if (!resultJson?.data?.imgInfo?.url?.toString()) {
        resultJson = await uploadArticleImage(cookie, imgUrl, userInfo);
      }
      if (resultJson.code?.toString() == '0' && resultJson?.data != null) {
        const upImageUrl = resultJson?.data?.imgInfo?.url?.toString();
        img.setAttribute('src', upImageUrl);
        img.setAttribute('_src', upImageUrl);
        img.setAttribute('uploaded', '1');
        img.setAttribute('data-width', resultJson.data?.imgInfo?.width?.toString() ?? '');
        img.setAttribute('data-height', resultJson.data?.imgInfo?.height?.toString() ?? '');
        img.setAttribute('data-phash', resultJson.data?.imgInfo?.phash?.toString() ?? '');
      } else {
        throw '正文图片上传失败:' + imgUrl + ':' + resultJson['message'] + '|' + JSON.stringify(resultJson);
      }
    }

    return html.DocumentNode.OuterHtml();
  }

  return htmlContent;
}

async function GetCoverPackge(
  cookie: string,
  taskData: IDayuhaoArticleData,
  userInfo: DayuhaoUserInfoResponse,
): Promise<Array<any>> {
  const coverImgs = new Array<any>();

  const covers = taskData?.covers;

  //自动封面，将根据指定的封面数从正文提取封面图，这里如果auto为真，原则上covers个数要大于0
  if (covers?.length > 0) {
    if (covers.length == 2) covers.pop();
    while (covers.length > 3) covers.pop();

    const contentImgs = new Array<string>();
    contentImgs.push('_rid=' + userInfo.data.requestId);
    for (let index = 0; index < covers.length; index++) {
      const imgUrl = covers[index].pathOrUrl;
      let imgObject: null | Record<string, any> = null;

      if (imgUrl.startsWith('http')) {
        imgObject = await getImgFromUrl(cookie, imgUrl, userInfo);
      }
      if (!imgObject?.data?.imgInfo?.url?.toString()) {
        imgObject = await uploadArticleImage(cookie, imgUrl, userInfo);
      }

      let reImgUrl = imgObject?.url?.toString();
      if (!reImgUrl) {
        reImgUrl = imgObject?.data?.imgInfo?.url?.toString();
      }
      if (!reImgUrl) {
        throw '上传封面失败:' + imgUrl;
      }
      contentImgs.push('imgs%5B' + index + '%5D%5Burl%5D=' + encodeURIComponent(reImgUrl));
    }
    contentImgs.push('utoken=' + userInfo.data.utoken);
    const choseCoverPostStr = contentImgs.join('&');

    const choseResult = await getDayuAutoCovers(cookie, choseCoverPostStr, userInfo.data.utoken);

    const error = choseResult as { error: string };
    if (error?.error) {
      throw `封面上传自动校验失败:${error.error}`;
    }

    const choseImgsJarray = choseResult as Array<{ url: string; origin: string }>;

    if (choseImgsJarray?.length > 0) {
      for (const item of choseImgsJarray) {
        coverImgs.push(item);
        if (coverImgs.length >= 3) {
          break;
        }
      }
    }
  }

  //如果都没指定，就不带封面字段
  return coverImgs;
}

function GetDraftPostData(
  taskData: IDayuhaoArticleData,
  coverJarray: Array<any>,
  userInfo: DayuhaoUserInfoResponse,
): string {
  const argsList = new Array<string>();

  const content = taskData.content?.toString();
  const title = taskData.title.toString();
  if (title.trim().length < 5) throw '标题字数不能少于5个';

  argsList.push(
    '_rid=' + userInfo.data.requestId + '&labor_activity_mode=1&labor_activity_id=&is_join_labor=false&isPaste=0',
  );
  argsList.push('draft_id=');
  argsList.push('article_id=');
  argsList.push('content_id=');
  //粉丝直通
  argsList.push('is_fans_show=false');

  argsList.push('title=' + encodeURIComponent(title));
  argsList.push('content=' + encodeURIComponent(content));
  //作者名称 这个是选填，有些用户名超过10个字就会报错，过滤掉,不填也没关系
  let autname = userInfo.data.nickname?.toString();
  if (autname?.length > 10) {
    autname = '';
  }
  argsList.push('author=' + encodeURIComponent(autname));
  for (let i = 0; i < 3; i++) {
    if (i == 0 && coverJarray.length > i) {
      const urlImg = encodeURIComponent(coverJarray[i].url?.toString() ?? '');
      argsList.push('coverImg=' + urlImg);
      argsList.push('cover_from=auto');
      argsList.push('origin_cover_url=' + urlImg);
      argsList.push('origin_cover_img=' + coverJarray[i]['md5']);
    } else if (i == 0) {
      argsList.push('coverImg=');
      argsList.push('cover_from=');
      argsList.push('origin_cover_url=');
      argsList.push('origin_cover_img=');
    }
    if (coverJarray.length > i) {
      const urlImg = encodeURIComponent(coverJarray[i].url?.toString() ?? '');
      argsList.push('covers%5B' + i + '%5D%5Burl%5D=' + urlImg);
      argsList.push('covers%5B' + i + '%5D%5BsrcUrl%5D=' + urlImg);
      argsList.push('covers%5B' + i + '%5D%5Bfrom%5D=auto');
      argsList.push('covers%5B' + i + '%5D%5Borigin_img%5D=' + coverJarray[i]['md5']);
    } else {
      argsList.push('covers%5B' + i + '%5D%5Burl%5D=');
      argsList.push('covers%5B' + i + '%5D%5BsrcUrl%5D=');
      argsList.push('covers%5B' + i + '%5D%5Bfrom%5D=');
      //argsList.push("covers%5B" + i + "%5D%5Burl%5D=");
    }
  }
  argsList.push('article_type=1&aoyun=false&weixin_promote=false');
  //原创
  argsList.push('is_original=' + (taskData['isOriginal'] ?? '0'));
  //征文活动
  argsList.push('article_activity_title=&article_activity_id=' + taskData['activityId']);
  //赞赏
  argsList.push('open_award=' + (taskData['praise'] ?? 0));
  //允许转载
  argsList.push('open_reproduce=' + (taskData['allowReprinted'] ?? 0));

  //加入UC分润
  argsList.push('is_show_ad= false');

  argsList.push('defaultAuthor=false');

  argsList.push('curDaySubmit=false&simpleMode=true');
  //副标题

  argsList.push('second_title=&use_second_title=false');

  argsList.push('use_multi_cover=' + (coverJarray?.length > 1 ? 'true' : 'false'));
  argsList.push('keyword=&is_exclusive=false&isCloseAdManual=false');
  argsList.push(
    'source=1&pageOpenTime=' + Date.now() + '&useTime=' + parseInt(String(Math.random() * (300000 - 100000) + 1)),
  );
  argsList.push('assistantStat%5BtitleTyposCount%5D=0&assistantStat%5BtotalTitleTyposCount%5D=0');
  argsList.push(
    'assistantStat%5BtotalTitleTypoTypeCounts%5D%5B%5D=0&assistantStat%5BtotalTitleTypoTypeCounts%5D%5B%5D=0',
  );
  argsList.push(
    'assistantStat%5BtotalTitleTypoTypeCounts%5D%5B%5D=0&assistantStat%5BtotalTitleTypoTypeCounts%5D%5B%5D=0',
  );
  argsList.push(
    'assistantStat%5BtotalTitleTypoTypeCounts%5D%5B%5D=0&assistantStat%5BtotalTitleTypoTypeCounts%5D%5B%5D=0',
  );
  argsList.push(
    'assistantStat%5BtotalTitleTypoTypeCounts%5D%5B%5D=0&assistantStat%5BtotalTitleTypoTypeCounts%5D%5B%5D=0',
  );
  argsList.push('assistantStat%5BtotalTitleTypoTypeCounts%5D%5B%5D=0&assistantStat%5BtitleWarningCount%5D=0');
  argsList.push(
    'assistantStat%5BtotalTitleWarningCount%5D=0&assistantStat%5BcontentTyposCount%5D=0&assistantStat%5BtotalContentTyposCount%5D=0',
  );
  argsList.push('assistantStat%5BcontentDiversionsCount%5D=0&assistantStat%5BimageDiversionItemsCount%5D=0');
  argsList.push(
    'assistantStat%5BtotalImageDiversionItemsCount%5D=0&assistantStat%5BtextDiversionItemsCount%5D=0&assistantStat%5BtotalTextDiversionItemsCount%5D=0',
  );
  argsList.push('assistantStat%5BtotalContentDiversionsCount%5D=0&assistantStat%5BtotalCorrectContentTypoCount%5D=0');
  argsList.push(
    'assistantStat%5BpreviousTitle%5D=' +
      encodeURIComponent(title) +
      '&assistantStat%5BtitleUpdateStartAt%5D=' +
      encodeURIComponent(dayjs().add(10, 'minute').toString()) +
      '&assistantStat%5BcontentUpdateStartAt%5D=' +
      encodeURIComponent(dayjs().add(-5, 'minute').toString()) +
      '&assistantStat%5BcontentUpdateEndAt%5D=' +
      encodeURIComponent(dayjs().add(-10, 'minute').toString()),
  );
  argsList.push('utoken=' + userInfo.data.utoken);
  //定时发布参数
  if (taskData.prePubTime) {
    argsList.push('is_timed_release=true');
    argsList.push(`time_for_release=${taskData.prePubTime}`);
  } else {
    argsList.push('is_timed_release=false');
    argsList.push('time_for_release=' + Date.now());
  }

  //申明
  if (taskData.sourceRemark?.type) {
    argsList.push(
      `${encodeURIComponent('source_remark_detail[type]')}=${encodeURIComponent(
        sourceRemarkDescObj[taskData.sourceRemark.type],
      )}`,
    );
  }

  return argsList.join('&');
}

function GetPublishPostData(taskData: IDayuhaoArticleData, userInfo: DayuhaoUserInfoResponse, draftId: string): string {
  const result =
    '_rid=' +
    userInfo.data.requestId +
    '&dataList%5B0%5D%5B_id%5D=' +
    draftId +
    '&dataList%5B0%5D%5BisDraft%5D=1&dataList%5B0%5D%5Breproduce%5D=&dataList%5B0%5D%5Bgoods_num%5D=0&curDaySubmit=false&utoken=' +
    userInfo.data.utoken;
  return result;
}

export interface IDayuhaoArticleData {
  cancelToken?: CancelToken;
  /**
   * 内容html
   */
  content: string;

  pulishId?: string;

  /**
   * true:保存草稿,false:直接发布
   */
  save: boolean;

  /**
   * 封面图
   */
  covers: Array<ImageInfo>;

  /**
   * 标题
   */
  title: string;

  /**
   * 定时发布时间 13位时间戳
   */
  prePubTime?: number;
  /**
   * 任务唯一标志id
   */
  taskId: string;

  /**
   * 代理信息
   */
  proxy?: KuaiDaiLiProxy;

  /**
   * 0:无需申明
   * 3:虚构演绎
   * 4:AI生成
   */
  sourceRemark?: {
    type?: 0 | 3 | 4;
  };
}

export interface DayuHaoPublishResultOutput extends BaseResult {
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
