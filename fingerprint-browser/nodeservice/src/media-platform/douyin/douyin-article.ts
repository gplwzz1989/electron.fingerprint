import { DouyinUserInfo, getMediaUserInfo } from './douyin-user.service';
import { EventEmitter } from 'events';
import { DouyinPublishResult } from './douyin-video';
import { HttpConfig } from '../../http';
import {
  isJson,
  logger,
  publishStatusEnum,
  readImageData,
  SetProgressEvent,
  SetProgressNewEvent,
  Task,
} from '../../utils';
import { AuthDataOutput, getAuthKey, getSdkToken, uploadCover, uploadedImageInfo } from './douyin-base.service';
import { AxiosError } from 'axios';
import { $http } from '../../http';
import { DouyinMusicInfo } from './douyin-music.service';
import { ImageInfo, ListItemInfo } from '../baseModel';
import { errorCode } from '../errorCode';
import { HtmlDocument } from '../../htmlAgilityPack';
import { checkByPassword, clientSign } from './douyin-video.service';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import {
  DouYinGetImageFromUrlResponse,
  getImageFromUrlResponse,
  getImageUrlInfoResponse,
} from '@/media-platform/douyin/douyin-article.service';

/**
 * 抖音图文发布
 * @param cookie 账号有效登录cookie字符串key=v;key2=v2
 * @param taskData 抖音图文发布任务参数结构
 * @param eventCallback 事件回调
 * @param userId 用户uid
 * @param retryTimes 失败最大重试次数
 */
export const publishDouYinArticle = async (
  cookie: string,
  taskData: DouyinArticleTaskInput,
  eventCallback: EventEmitter,
  userId: string,
  retryTimes: number = 3,
): Promise<DouyinPublishResult> => {
  logger.info(`抖音文章发布 ${taskData.taskId}`);

  const pubResult: DouyinPublishResult = {
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
    if (taskData.localStorage && taskData.localStorage['security-sdk/s_sdk_sign_data_key/web_protect']) {
      cookie = cookie.replace(/security-sdk\/s_sdk_sign_data_key\/web_protect=/g, 'droppedCookie=');
      cookie = cookie.replace(/security-sdk\/s_sdk_crypt_sdk/g, 'droppedCookie=');
    }
    if (
      !cookie.includes('security-sdk/s_sdk_crypt_sdk') ||
      !cookie.includes('security-sdk/s_sdk_sign_data_key/web_protect') ||
      !cookie.includes('bd_ticket_guard_client_data') ||
      !cookie.includes('sid_tt')
    ) {
      if (
        !taskData.localStorage ||
        !taskData?.localStorage['security-sdk/s_sdk_crypt_sdk'] ||
        !taskData?.localStorage['security-sdk/s_sdk_sign_data_key/web_protect']
      ) {
        pubResult.code = errorCode.io_error;
        pubResult.msg = '账号信息缺失，请重新授权此账号再试';
        logger.error(`环境信息缺失 ${taskData.taskId} ${JSON.stringify(taskData.localStorage)}`);
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploadFail,
          pubResult?.msg ? pubResult?.msg : '上传失败',
          taskData.taskId,
        );
        return pubResult;
      } else if (!cookie.includes('bd_ticket_guard_client_data') || !cookie.includes('sid_tt')) {
        pubResult.code = errorCode.io_error;
        pubResult.msg = '账号信息缺失，请重新授权此账号再试';
        logger.error(`环境信息缺失 ${taskData.taskId} ${cookie}`);
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploadFail,
          pubResult?.msg ? pubResult?.msg : '上传失败',
          taskData.taskId,
        );
        return pubResult;
      }
      cookie = `${cookie};security-sdk/s_sdk_crypt_sdk=${encodeURIComponent(
        taskData?.localStorage['security-sdk/s_sdk_crypt_sdk'],
      )};security-sdk/s_sdk_sign_data_key/web_protect=${encodeURIComponent(
        taskData.localStorage['security-sdk/s_sdk_sign_data_key/web_protect'],
      )}`;
    }
    SetProgressEvent(eventCallback, 1, '准备上传图片', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // region 准备发布上传前置数据

    // 获取sdkToken
    let sdkToken = await getSdkToken(cookie);
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      sdkToken = await getSdkToken(cookie);
      if (sdkToken) {
        break;
      }
    }

    // 获取用户信息
    if (!userId) {
      let userInfo = await getMediaUserInfo(cookie);
      for (let i = 0; i < retryTimes; i++) {
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);
        userId = userInfo?.user?.uid;
        if (!userId) {
          if (i < retryTimes - 1 && userInfo?.status_code != 8) {
            userInfo = await getMediaUserInfo(cookie);
            continue;
          }
          pubResult.code = userInfo.status_code;
          pubResult.msg = userInfo.status_msg;
          logger.error(`获取用户信息失败 ${taskData.taskId} ${cookie} ${JSON.stringify(userInfo)}`);
          SetProgressNewEvent(
            eventCallback,
            publishStatusEnum.uploadFail,
            pubResult?.msg ? pubResult?.msg : '上传失败',
            taskData.taskId,
          );
          return pubResult;
        } else {
          break;
        }
      }
    }

    // 获取上传认证参数
    const authData: AuthDataOutput = await getAuthKey(cookie);

    taskData['content'] = await ReplaceImgInHtml(
      cookie,
      taskData.taskId,
      eventCallback,
      taskData,
      userId,
      authData,
      pubResult,
    );

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressEvent(eventCallback, 3, '正在获取上传参数', taskData.taskId);

    // endregion

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // region 封面上传

    SetProgressEvent(eventCallback, 90, '封面上传中', taskData.taskId);

    let uploadedCoverInfo: uploadedImageInfo | null = await uploadCover(
      userId,
      taskData.cover.pathOrUrl,
      authData,
      taskData.taskId,
      pubResult,
    );
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      if (uploadedCoverInfo == null || !(uploadedCoverInfo?.Result?.Results?.length > 0)) {
        if (i < retryTimes - 1) {
          uploadedCoverInfo = await uploadCover(userId, taskData.cover.pathOrUrl, authData, taskData.taskId, pubResult);
          continue;
        }

        pubResult.code = -1;
        pubResult.msg = pubResult.msg
          ? pubResult.msg
          : `封面上传失败:${uploadedCoverInfo?.ResponseMetadata?.Error?.Message ?? ''}`;
        logger.error(
          `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${uploadedCoverInfo} ${JSON.stringify(
            pubResult,
          )}`,
        );
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploadFail,
          pubResult?.msg ? pubResult?.msg : '上传失败',
          taskData.taskId,
        );
        return pubResult;
      }
      break;
    }
    if (uploadedCoverInfo == null) {
      logger.error(
        `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${uploadedCoverInfo} ${JSON.stringify(
          pubResult,
        )}`,
      );
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult?.msg ? pubResult?.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    let uploadedHeadCoverInfo: uploadedImageInfo | null = null;

    //头图
    if (taskData.headImage?.pathOrUrl) {
      uploadedHeadCoverInfo = await uploadCover(
        userId,
        taskData.headImage.pathOrUrl,
        authData,
        taskData.taskId,
        pubResult,
      );
      for (let i = 0; i < retryTimes; i++) {
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);
        if (uploadedHeadCoverInfo == null || !(uploadedHeadCoverInfo?.Result?.Results?.length > 0)) {
          if (i < retryTimes - 1) {
            uploadedHeadCoverInfo = await uploadCover(
              userId,
              taskData.headImage.pathOrUrl,
              authData,
              taskData.taskId,
              pubResult,
            );
            continue;
          }

          pubResult.code = -1;
          pubResult.msg = pubResult.msg
            ? pubResult.msg
            : `头图上传失败:${uploadedHeadCoverInfo?.ResponseMetadata?.Error?.Message ?? ''}`;
          logger.error(
            `头图上传失败 ${taskData.taskId} ${cookie} ${
              taskData.headImage.pathOrUrl
            } ${uploadedHeadCoverInfo} ${JSON.stringify(pubResult)}`,
          );
          SetProgressNewEvent(
            eventCallback,
            publishStatusEnum.uploadFail,
            pubResult?.msg ? pubResult?.msg : '头图上传失败',
            taskData.taskId,
          );
          return pubResult;
        }
        break;
      }
      if (uploadedHeadCoverInfo == null) {
        logger.error(
          `头图上传失败 ${taskData.taskId} ${cookie} ${
            taskData.headImage.pathOrUrl
          } ${uploadedHeadCoverInfo} ${JSON.stringify(pubResult)}`,
        );
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploadFail,
          pubResult?.msg ? pubResult?.msg : '头图上传失败',
          taskData.taskId,
        );
        return pubResult;
      }
    }
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    // endregion

    // region 组装并推送数据
    // 组装发布数据
    const postData = await buildArticlePostData_v2(taskData, uploadedCoverInfo, uploadedHeadCoverInfo);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不允许取消了
    taskData.cancelToken?.disable(privateKey);

    const publishResult = await publish(cookie, sdkToken, postData, taskData.taskId, webProxy, taskData.password);

    pubResult.code = publishResult.status_code;
    pubResult.msg = publishResult.status_msg ?? '';
    pubResult.publishId = publishResult?.item_id ?? publishResult?.aweme?.aweme_id?.toString();

    if (pubResult.msg == 'sms') {
      pubResult.msg =
        '发布失败:官方平台检测到您的账号存在风险，请先前往《创作者中心》里登录后单独发布一个作品，发布时会跳出验证，验证通过即可一键发布。';
      pubResult.code = -110;
    } else if (pubResult.msg == '服务异常') {
      pubResult.msg = '发布失败:官方平台检测到您的账号存在风险，请先前往《创作者中心》里登录后单独发布一个作品，发布时会跳出验证，验证通过即可一键发布。';
      pubResult.code = -110;
    }

    // console.debug('抖音图文发布完成', taskData.taskId, taskData, uploadedCoverInfo, pubResult);

    if (pubResult.publishId) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult?.msg : '推送失败',
        taskData.taskId,
      );
      logger.error(`抖音图文发布失败 ${taskData.taskId} ${cookie} ${postData}  ${JSON.stringify(publishResult)}`);
      pubResult.code = pubResult.code == 0 ? -1 : pubResult.code ?? -1;
      // console.debug('抖音发布失败:', publishResult, taskData, cookie);
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
    }

    return pubResult;
    // endregion
  } catch (e) {
    SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);

    // 统一异常失败处理
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
      pubResult?.msg ? pubResult?.msg : '推送失败',
      taskData.taskId,
    );
    logger.error(`抖音图文发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};
async function ReplaceImgInHtml(
  cookie: string,
  taskId: string,
  eventCallback: EventEmitter,
  taskData: DouyinArticleTaskInput,
  userId: string,
  authData: AuthDataOutput,
  pubResult: DouyinPublishResult,
): Promise<string> {
  const html = new HtmlDocument();
  html.LoadHtml(taskData.content);
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
      let resultJson: DouYinGetImageFromUrlResponse | undefined = undefined;
      if (imgUrl.startsWith('http')) {
        resultJson = await getImageFromUrlResponse(cookie, imgUrl);
        uploadUrl = resultJson?.uri;
      }

      let upRe: uploadedImageInfo | null | undefined = undefined;
      if (!uploadUrl) {
        const imgData = await readImageData(imgUrl, 'jpeg');

        if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
          throw new Error(`图片读取失败-${imgData.status}-${imgUrl}`);
        }
        upRe = await uploadCover(userId, imgUrl, authData, taskId, pubResult);
        uploadUrl = upRe?.Result?.Results[0]?.Uri;
      }

      if (!uploadUrl) {
        throw new Error('上传正文图片失败:' + imgUrl + `${upRe?.status_msg ?? resultJson?.status_msg ?? ''}`);
      }
      //img.setAttribute('src', uploadUrl);
      img.textContent = `![图片描述](${uploadUrl})`;
      let imgUrlRe = await getImageUrlInfoResponse(cookie, uploadUrl);
      if (!imgUrlRe?.url) {
        imgUrlRe = await getImageUrlInfoResponse(cookie, uploadUrl);
      }
      if (!imgUrlRe?.url) {
        throw new Error(`正文图片上传失败:${imgUrlRe?.status_msg ?? ''}`);
      }
      taskData['imgKeys'].push({
        key: uploadUrl,
        value: { width: resultJson?.width ?? 800, height: resultJson?.height, url: imgUrlRe?.url?.url_list[0] },
      });
    }
    taskData['textContent'] = html.DocumentNode.InnerText();
    return html.DocumentNode.OuterHtml();
  } else {
    taskData['textContent'] = html.DocumentNode.InnerText();
    return taskData.content;
  }
}
/**
 * 抖音图文发布入参
 */
export interface DouyinArticleTaskInput {
  /**
   * 取消任务发布
   */
  cancelToken?: CancelToken;
  /**
   * 任务唯一标志id
   */
  taskId: string;
  /**
   * 封面信息
   */
  cover: ImageInfo;
  /**
   * 图片信息列表
   */
  headImage?: ImageInfo;
  /**
   * 话题列表,最多5个
   */
  challenges?: Array<ListItemInfo>;

  /**
   * 标题，必选1-30个字
   */
  title: string;

  /**
   * 摘要信息，最多30字
   */
  text?: string;

  /**
   * 正文信息，最多8000字
   */
  content: string;

  /**
   * 添加的音乐信息
   */
  musicInfo?: DouyinMusicInfo;

  /**
   * 可见类型
   *  - 0: 公开
   *  - 1:私密
   *  - 2: 好友可见
   */
  visibility_type: number;

  /**
   * 定时发布时间戳，10位
   */
  timing?: number;

  /**
   * 账号web中的localStorage
   */
  localStorage?: object;

  /**
   * 代理
   */
  proxy?: KuaiDaiLiProxy;

  /**
   * 媒体号密码，用于发布时自动验证
   */
  password?: string;
}

const buildArticlePostData_v2 = async (
  taskData: DouyinArticleTaskInput,
  coverInfo: uploadedImageInfo,
  headImageInfo?: uploadedImageInfo | null,
): Promise<string> => {
  const postData = {
    item: {
      common: {
        text: taskData.title,
        description: taskData.text,
        long_article: taskData['textContent'] ?? '',
        long_article_image_info: taskData['imgKeys'],
        background_extracted: '#292b33',
        head_poster: headImageInfo?.Result?.PluginResult[0]?.ImageUri,
        text_extra: '[]',
        visibility_type: taskData.visibility_type ?? 0,
        timing: -1,
        media_type: 43,
        music_end_time: taskData.musicInfo?.duration ? taskData.musicInfo?.duration * 1000 : undefined,
        music_id: taskData.musicInfo?.music_id ?? taskData.musicInfo?.id_str ?? undefined,
        long_article_version: '1',
        creation_id: '',
      },
      cover: {
        custom_cover_image_width: taskData.cover.width ?? 800,
        custom_cover_image_height: taskData.cover.height ?? 600,
        poster: coverInfo?.Result?.Results[0].Uri,
      },
    },
  };

  //话题
  let text = taskData.title;
  if (taskData.challenges?.length) {
    let capIndex = 0;
    let index = taskData.title.length + 1;
    const ext = [];
    for (const topic of taskData.challenges) {
      ext.push({
        hashtag_id: topic.yixiaoerId,
        hashtag_name: topic.yixiaoerName,
        type: 1,
        start: index,
        end: index + topic.yixiaoerName.length + 1,
        caption_start: capIndex,
        caption_end: capIndex + topic.yixiaoerName.length + 1,
      } as never);
      text = text + ` #${topic.yixiaoerName}`;
      index = index += topic.yixiaoerName.length + 2;
      capIndex = capIndex + topic.yixiaoerName.length + 2;
    }
    postData.item.common.text = text;
    postData.item.common.text_extra = JSON.stringify(ext);
  }
  //定时
  if (taskData.timing) {
    postData.item.common.timing = taskData.timing;
  }

  return JSON.stringify(postData);
};

const publish = async (
  cookie: string,
  sdkToken: string,
  postData: string,
  taskId: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
  password?: string,
): Promise<{
  status_code: number;
  status_msg?: string;
  aweme?: {
    aweme_id: string;
  };
  item_id?: string;
}> => {
  let pubKey = '';
  if (cookie?.includes('bd_ticket_guard_client_data=')) {
    pubKey = JSON.parse(
      Buffer.from(
        decodeURIComponent(cookie.split('bd_ticket_guard_client_data=')[1]?.split(';')[0]?.trim()),
        'base64',
      ).toString('utf-8'),
    )['bd-ticket-guard-ree-public-key'];
  } else if (cookie?.includes('bd_ticket_guard_client_data_v2=')) {
    pubKey = JSON.parse(
      Buffer.from(
        decodeURIComponent(cookie.split('bd_ticket_guard_client_data_v2=')[1]?.split(';')[0]?.trim()),
        'base64',
      ).toString('utf-8'),
    )['ree_public_key'];
  }

  const signValue = clientSign(cookie);
  const signObj = JSON.parse(
    JSON.parse(
      decodeURIComponent(cookie.split('security-sdk/s_sdk_sign_data_key/web_protect=')[1]?.split(';')[0]?.trim()),
    ).data,
  );
  const webVer = signObj.ticket?.startsWith('hash') ? '2' : '1';
  const headers = {
    cookie: cookie,
    'User-Agent': HttpConfig.userAgent,
    'Content-Type': 'application/json;charset=UTF-8',
    'x-secsdk-csrf-request': '1',
    'x-secsdk-csrf-token': sdkToken,
    'bd-ticket-guard-web-version': webVer,
    'bd-ticket-guard-version': '2',
    'bd-ticket-guard-iteration-version': '1',
    'bd-ticket-guard-web-sign-type': '0',
    'bd-ticket-guard-ree-public-key': pubKey,
    'bd-ticket-guard-client-data': signValue,
    Referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
    Origin: 'https://creator.douyin.com/',
  };

  const msToken = cookie.split('msToken=')[1]?.split(';')[0] ?? `a12man123masb${Date.now()}`;

  const url = `https://creator.douyin.com/web/api/media/aweme/create_v2/?read_aid=2906&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=5.0+%28Windows+NT+10.0%3B+Win64%3B+x64%29+AppleWebKit%2F537.36+%28KHTML%2C+like+Gecko%29+Chrome%2F140.0.0.0+Safari%2F537.36&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&support_h265=1&msToken=${msToken}&a_bogus=`;
  // console.debug('抖音推送数据', taskId, cookie, postData);
  let publishResult = await $http.post(url, postData, {
    headers: headers,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  // console.debug('抖音推送返回数据', taskId, publishResult.data);
  if (publishResult.headers['x-tt-verify-passport-decision']) {
    if (password) {
      const checkRe = await checkByPassword(
        cookie,
        sdkToken,
        password,
        publishResult.headers['x-tt-verify-passport-decision'],
        proxyAgent,
      );
      if (checkRe) {
        logger.info(`自动验证失败:${checkRe}`);
        return { status_code: 110, status_msg: 'sms' };
      } else {
        publishResult = await $http.post(url, postData?.trim(), {
          headers: headers,
          httpAgent: proxyAgent,
          httpsAgent: proxyAgent,
        });
      }
    } else {
      return { status_code: 110, status_msg: 'sms' };
    }
  }
  if (isJson(publishResult.data)) {
    return publishResult.data;
  } else {
    return {
      status_code: publishResult.status ?? errorCode.data_error,
      status_msg: '服务异常',
    };
  }
};
