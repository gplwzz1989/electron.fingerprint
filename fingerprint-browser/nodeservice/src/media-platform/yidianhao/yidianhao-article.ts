import { HtmlDocument } from '@/htmlAgilityPack';
import {
  htmlDecode,
  logger,
  publishStatusEnum,
  readImageData,
  SetProgressEvent,
  SetProgressNewEvent,
  Task,
} from '@/utils';
import dayjs from 'dayjs';
import { BaseResult } from '../baseResult';
import { ImageInfo } from '../baseModel';
import { EventEmitter } from 'events';
import { getArticleScheduleTime, getImageFromUrl, uploadImageBinary } from './yidianhao-video.service';
import { getYidianhaoUserInfo } from './yidianhao-common';
import { errorCode } from '../errorCode';
import { AxiosError } from 'axios';
import {
  prePubYidianhaoArticle,
  publishYidianhaoArticleResponse,
  saveYidianhaoArticleDraft,
} from './yidianhao-article.service';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '../webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { CancelToken, privateKey } from '@/utils/CancelToken';

export async function publishArticle(taskData: IYiDianHaoArticleData, cookie: string, eventCallback?: EventEmitter) {
  logger.info(`一点号文章发布 ${taskData.taskId}`);
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
    const userInfo = await getYidianhaoUserInfo(cookie);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!userInfo.data?.uid) {
      console.debug('获取用户信息失败', cookie, taskData.taskId, userInfo);
      pubResult.code = errorCode.io_error;
      pubResult.msg = userInfo?.msg ?? '获取用户信息失败';
      logger.error(`获取用户信息失败 ${taskData.taskId} ${cookie} ${JSON.stringify(userInfo)}`);
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult?.msg ? pubResult.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }

    taskData['content'] = await ReplaceImgInHtml(
      taskData['content'],
      cookie,
      userInfo.data.mpCode ?? '',
      taskData.taskId,
      eventCallback,
    );

    SetProgressEvent(eventCallback, 80, '准备上传封面', taskData.taskId);

    const coverJArray = await uploadCovers(cookie, taskData.covers, userInfo.data.mpCode ?? '');

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);

    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);

    const postData = buildPostData(taskData, coverJArray);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (taskData.pubType === 0) {
      //不可取消
      taskData.cancelToken?.disable(privateKey);
    }
    const draftData = await saveYidianhaoArticleDraft(cookie, postData, userInfo.data.mpCode ?? '');
    if (!draftData?.id) {
      pubResult.msg = `保存草稿失败${draftData?.reason ?? ''}`;
      pubResult.code = -1;
      logger.error(`保存草稿失败 ${taskData.taskId} ${cookie} ${postData}  ${JSON.stringify(draftData)}`);
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送草稿失败',
        taskData.taskId,
      );
      return pubResult;
    }

    pubResult.publishId = draftData?.id?.toString() ?? '';
    if (taskData.pubType === 0) {
      pubResult.msg = '草稿保存成功';
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送草稿成功', taskData.taskId);
      return pubResult;
    }
    // 组装发布数据

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    await getArticleScheduleTime(cookie, pubResult.publishId, userInfo.data.mpCode ?? '');

    console.debug('一点号文章推送数据', taskData.taskId, cookie, postData);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);
    //定时发布
    if (taskData.prePubTime) {
      const preResult = await prePubYidianhaoArticle(
        cookie,
        pubResult.publishId,
        taskData,
        userInfo.data.mpCode ?? '',
        webProxy,
      );
      if (preResult?.reason) {
        console.debug('定时发布失败', taskData.taskId, preResult);
        pubResult.msg = `定时发布失败${preResult?.reason ?? ''}`;
        pubResult.code = -1;
        logger.error(
          `${pubResult.msg} ${taskData.taskId} ${cookie} ${taskData.prePubTime}  ${JSON.stringify(preResult)}`,
        );
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.pushFail,
          pubResult?.msg ? pubResult.msg : '推动定时失败',
          taskData.taskId,
        );
        return pubResult;
      }
    }

    // 推送数据
    const publishResult = await publishYidianhaoArticleResponse(
      cookie,
      pubResult.publishId,
      userInfo.data.mpCode ?? '',
      webProxy,
    );
    console.debug('一点号文章推送返回数据', taskData.taskId, publishResult);

    pubResult.code = publishResult?.status === 'success' ? 0 : -1;

    if (pubResult.code == 0 && pubResult.publishId) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      pubResult.msg = `发布失败`;
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
      logger.error(
        `一点好文章发布失败 ${taskData.taskId} ${cookie} ${pubResult.publishId}  ${JSON.stringify(publishResult)}`,
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
    logger.error(`一点号文章发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }
  return pubResult;
}

async function ReplaceImgInHtml(
  htmlContent: string,
  cookie: string,
  mpCode: string,
  taskId: string,
  eventCallback: EventEmitter,
): Promise<string> {
  const html = new HtmlDocument();
  html.LoadHtml(htmlContent);
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
        resultJson = await getImageFromUrl(cookie, imgUrl, mpCode);
        uploadUrl = resultJson?.inner_addr;
      }

      if (!uploadUrl) {
        const imgData = await readImageData(imgUrl, 'jpeg');

        if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
          throw new Error(`图片读取失败-${imgData.status}-${imgUrl}`);
        }
        resultJson = await uploadImageBinary(cookie, imgData.data, mpCode, imgData.ext);
        if (!resultJson?.url) {
          resultJson = await uploadImageBinary(cookie, imgData.data, mpCode, imgData.ext);
        }
        uploadUrl = resultJson?.url;
      }

      if (!uploadUrl) {
        throw new Error('上传正文图片失败:' + imgUrl);
      }
      img.setAttribute('src', uploadUrl);
    }
    return html.DocumentNode.OuterHtml();
  } else {
    return htmlContent;
  }
}

const uploadCovers = async (cookie: string, covers: Array<ImageInfo>, mpCode: string): Promise<Array<string>> => {
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

      //直接官方转换
      if (imgUrl.toLowerCase().startsWith('http')) {
        const resultJson = await getImageFromUrl(cookie, imgUrl, mpCode);
        uploadedUrl = resultJson?.inner_addr;
      }

      //下载后再上传
      if (!uploadedUrl) {
        const imgData = await readImageData(imgUrl, 'jpeg');

        if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
          throw new Error(`图片读取失败-${imgData.status}-${imgUrl}`);
        }
        const resultJson = await uploadImageBinary(cookie, imgData.data, mpCode, img?.format ?? 'png');
        uploadedUrl = resultJson?.url;
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
function buildPostData(taskData: IYiDianHaoArticleData, coverList: Array<string>) {
  const re = {};
  re['activity_id'] = 0;
  re['all_data'] = {};
  re['appealStatus'] = '';
  re['audios'] = [];
  re['can_delete'] = true;
  re['can_editor'] = true;
  re['cate'] = '';
  re['cateB'] = '';
  re['comment'] = '';
  re['content'] = htmlDecode(taskData.content);
  const covers: Array<{ source: string; url: string }> = [];
  coverList.forEach((cover) => {
    covers.push({ source: '', url: cover });
  });
  re['covers'] = covers;
  re['coverType'] = coverList?.length > 2 ? 'three' : coverList?.length > 0 ? 'single' : 'default';
  re['data'] = {};
  re['date'] = '';
  re['dirty'] = false;
  re['editable'] = 1;
  re['editorType'] = 'articleEditor';
  re['goods'] = [];
  re['hasSubTitle'] = 0;
  re['id'] = '';
  re['images'] = [];
  re['import_hash'] = '';
  re['import_url'] = '';
  re['is_mobile'] = 0;
  re['isPubed'] = false;
  re['isStick'] = '';
  re['join_activity'] = 0;
  re['lastSaveTime'] = dayjs().format('HH:mm:ss');
  re['maxTimingDay'] = 7;
  re['minTimingHour'] = 3;
  re['newsId'] = '';
  re['notSaveToStore'] = true;
  re['push_failed_reason'] = '';
  re['push_status'] = 9;

  //re["scheduleTime"] = "";
  re['showCover'] = covers?.length > 0 ? covers[0].url : '';
  re['status'] = 0;
  re['subTitle'] = '';
  re['subTitleData'] = {};
  re['tags'] = [];
  re['title'] = taskData['title'];
  re['type'] = 0;
  re['ugcVideo'] = 0;
  re['updatedTime'] = Date.now();
  re['video_cate'] = '';
  re['video_cateB'] = '';
  re['videos'] = [];
  const votes = {};
  votes['isAdded'] = false;
  votes['vote_end_time'] = '';
  votes['vote_id'] = '';
  votes['vote_options'] = [];
  votes['vote_title'] = '';
  votes['vote_type'] = 1;
  re['votes'] = votes;
  //原创
  re['original'] = taskData.original ? 2 : 0;

  //赞赏
  re['reward'] = 0;
  //定时发布
  if (taskData.prePubTime) {
    const prePubTime = dayjs(taskData.prePubTime).format('YYYY-MM-DD HH:mm:00');
    re['timestamp'] = new Date(prePubTime).getTime();
    taskData['pub_time'] = re['timestamp'];
  }

  //声明
  if (taskData.wm_content_source) {
    re['wm_content_source'] = taskData.wm_content_source;
  }

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

export interface IYiDianHaoArticleData {
  cancelToken?: CancelToken;
  /**
   * 内容html
   */
  content: string;

  pulishId?: string;

  /**
   * 是否直接发布， 0保存草稿 1直接发布
   */
  pubType: number;

  /**
   * 封面图
   */
  covers: Array<ImageInfo>;

  /**
   * 标题
   */
  title: string;

  /**
   * 1 无需申明, 2 自行拍摄, 3 内容取材网络 ， 4 内容由AI生成 ,5 虚构情节内容
   */
  wm_content_source?: {
    type: 1 | 2 | 3 | 4 | 5;
    /**
     * 13为时间戳，当类型为自行拍摄时的拍摄时间
     */
    time?: number;

    /**
     * 拍摄地点，eg:'湖南省-长沙市-岳麓区'，'北京市-北京市-东城区'
     */
    place?: string;
  };

  /**
   * 定时发布时间 13位时间戳,精确的分钟，5的倍数
   */

  prePubTime?: number;
  /**
   * 任务唯一标志id
   */
  taskId: string;

  /**
   * 原创申明 1:申明 0:不申明
   */
  original?: 1 | 0;

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}
