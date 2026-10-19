import { BaseResult } from '../../media-platform/baseResult';
import {
  checkUploadResponse,
  getDispatchResponse,
  getUploadArgsResponse,
  publishResponse,
  uploadVideoImage,
  uploadVideoPart,
  XinlangweiboUploadCheckResponse,
  XinlangweiboUploadPartResponse,
} from './xinlangweibo-video.service';
import {
  getPersonalAccessTokenAsync,
  getXsrfToken,
  XinlangweiboImageInfoResultResponse,
} from './xinlangweibo-base.service';
import {
  convertCookieStr,
  Guid,
  htmlDecode,
  logger,
  publishStatusEnum,
  readImageData,
  SetProgressEvent,
  SetProgressNewEvent,
  sortQueryString,
  UploadEmitGate,
} from '../../utils';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { errorCode } from '../../media-platform/errorCode';
import { XinlangweiboCollectionInfo } from './xinlangweibo-collection.service';
import { XinlangweiboLocationInfo } from './xinlangweibo-location.service';
import { AxiosError } from 'axios';
import { generateRandomString, getXinlangweiboTopicList, getXinlangweiboUserInfo } from './xinlangweibo-common';
import { CancelToken, privateKey } from '../../utils/CancelToken';
import { WeiboTopicInfo } from './xinlangweibo-topic.service';
import { HtmlDocument } from '../../htmlAgilityPack';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '../webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { getXinlangweiboIndex } from '@/media-platform/xinlangweibo/xinlangweibo-user.service';
import { ListItemInfo } from '@/media-platform';
import { ITask } from '@/media-platform/baseTask';

export const publishXinlangweiboVideo = async (
  cookie: string,
  taskData: XinlangweiboVideoTaskInput,
  eventCallback: EventEmitter,
  source: number = 339644097,
  maxThreadOut: number = 3,
  retryTimes: number = 3,
): Promise<XinlangweiboPublishResultOutput> => {
  logger.error(`微博视频发布 ${taskData.taskId}`);
  const pubResult: XinlangweiboPublishResultOutput = {
    code: 0,
    msg: '',
    taskId: taskData.taskId,
  };
  try {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploading, '开始发布', taskData.taskId);
    cookie = convertCookieStr(cookie, 'weibo.com');
    const newCookie = await getXinlangweiboIndex(cookie);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (newCookie?.cookie) {
      cookie = newCookie.cookie;
    }
    let webProxy: HttpsProxyAgent<string> | object | undefined = undefined;
    if (taskData.proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(taskData.proxy);
    }
    if (!fs.existsSync(taskData.video.localPath?.toString() ?? '')) {
      pubResult.code = errorCode.io_error;
      pubResult.msg = '视频文件不存在:' + taskData.video.localPath;
      logger.error(`视频文件不存在 ${taskData.taskId} ${taskData.video.localPath}`);
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult?.msg ? pubResult.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressEvent(eventCallback, 1, '准备上传中', taskData.taskId);
    const userInfo = await getXinlangweiboUserInfo(cookie);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressEvent(eventCallback, 3, '正在获取上传参数', taskData.taskId);

    //尝试刷新token，微信登录的需要
    const accToken = await getPersonalAccessTokenAsync(cookie);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (accToken) {
      cookie = accToken;
    }
    const xsrfToken = getXsrfToken(cookie) ?? '';
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    SetProgressEvent(eventCallback, 4, '正在上传视频', taskData.taskId);
    // region 上传视频
    let uploadedVideoInfo = await uploadVideo(
      taskData,
      pubResult,
      eventCallback,
      xsrfToken,
      maxThreadOut,
      cookie,
      source,
    );

    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      if (!uploadedVideoInfo?.media_id) {
        if (i < retryTimes - 1) {
          SetProgressEvent(eventCallback, 5, '上传失败,重试中', taskData.taskId);
          uploadedVideoInfo = await uploadVideo(
            taskData,
            pubResult,
            eventCallback,
            xsrfToken,
            maxThreadOut,
            cookie,
            source,
          );
          continue;
        }
        logger.error(
          `视频上传失败 ${taskData.taskId} ${cookie} ${JSON.stringify(uploadedVideoInfo)} ${JSON.stringify(pubResult)}`,
        );
        if (
          pubResult.msg &&
          (pubResult.msg.includes('user need identity authentication') || pubResult.msg.includes('请求参数不合法'))
        ) {
          pubResult.msg =
            '账号发布频繁，需在官方完成图形验证才能发博成功，若今日仍有需求，建议使用 <浏览器发布>。（部分账号第二天将会解禁）';
        }
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploadFail,
          pubResult?.msg ? pubResult.msg : '上传失败',
          taskData.taskId,
        );
        return pubResult;
      } else {
        break;
      }
    }
    if (!uploadedVideoInfo?.media_id) {
      logger.error(
        `视频上传失败 ${taskData.taskId} ${cookie} ${JSON.stringify(uploadedVideoInfo)} ${JSON.stringify(pubResult)}`,
      );
      if (
        pubResult.msg &&
        (pubResult.msg.includes('user need identity authentication') || pubResult.msg.includes('请求参数不合法'))
      ) {
        pubResult.msg =
          '账号发布频繁，需在官方完成图形验证才能发博成功，若今日仍有需求，建议使用 <浏览器发布>。（部分账号第二天将会解禁）';
      }
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult?.msg ? pubResult.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }

    // endregion
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // region 封面上传
    SetProgressEvent(eventCallback, 90, '封面读取中', taskData.taskId);

    SetProgressEvent(eventCallback, 90, '封面上传中', taskData.taskId);
    // 上传图片数据
    let imageResult = await uploadCoverProcess(
      taskData,
      eventCallback,
      cookie,
      userInfo.data.user?.id ?? 0,
      userInfo.data.user?.watermark?.markpos ?? 1,
      userInfo.data.user?.watermark?.nick == 0 ? userInfo.data.user.screen_name : '',
      pubResult,
    );
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      // 判断封面是否上传成功
      if (!imageResult?.pic?.pid) {
        // console.debug('封面上传失败', taskData.taskId, taskData?.cover?.pathOrUrl, imageResult);
        if (i < retryTimes - 1) {
          imageResult = await uploadCoverProcess(
            taskData,
            eventCallback,
            cookie,
            userInfo.data.user?.id ?? 0,
            userInfo.data.user?.watermark?.markpos ?? 1,
            userInfo.data.user?.watermark?.nick == 0 ? userInfo.data.user.screen_name : '',
            pubResult,
          );
          continue;
        }
        pubResult.code = pubResult.code ?? errorCode.data_error;
        logger.error(
          `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${JSON.stringify(
            imageResult,
          )} ${JSON.stringify(pubResult)}`,
        );
        if (
          pubResult.msg &&
          (pubResult.msg.includes('user need identity authentication') || pubResult.msg.includes('请求参数不合法'))
        ) {
          pubResult.msg =
            '账号发布频繁，需在官方完成图形验证才能发博成功，若今日仍有需求，建议使用 <浏览器发布>。（部分账号第二天将会解禁）';
        }
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploadFail,
          pubResult?.msg ? pubResult.msg : '上传失败',
          taskData.taskId,
        );
        return pubResult;
      } else {
        break;
      }
    }
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (!imageResult?.pic?.pid) {
      pubResult.code = pubResult.code ?? errorCode.data_error;
      logger.error(
        `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${JSON.stringify(
          imageResult,
        )} ${JSON.stringify(pubResult)}`,
      );
      if (
        pubResult.msg &&
        (pubResult.msg.includes('user need identity authentication') || pubResult.msg.includes('请求参数不合法'))
      ) {
        pubResult.msg =
          '账号发布频繁，需在官方完成图形验证才能发博成功，若今日仍有需求，建议使用 <浏览器发布>。（部分账号第二天将会解禁）';
      }
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult?.msg ? pubResult.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }

    //endregion
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);

    // 组装发布数据
    const postData = await buildPostData(taskData, imageResult, uploadedVideoInfo, cookie);
    // console.debug('微博视频推送数据', taskData.taskId, cookie, postData);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // 推送数据
    //不可取消
    taskData.cancelToken?.disable(privateKey);
    const publishResult = await publishResponse(cookie, postData, xsrfToken, webProxy, !!taskData.publishTime);
    // console.debug('微博视频推送返回数据', taskData.taskId, publishResult);

    if (publishResult.ok === 1) {
      pubResult.code = 0;
    } else {
      pubResult.code = publishResult.ok != 0 ? publishResult.ok : 1;
    }

    pubResult.msg = publishResult?.msg ?? '';
    pubResult.publishId = uploadedVideoInfo.media_id;

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
      logger.error(`新浪微博视频发布失败 ${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(publishResult)}`);
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
    logger.error(`新浪微博视频发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
    //文案处理
    if (
      pubResult.msg &&
      (pubResult.msg.includes('user need identity authentication') || pubResult.msg.includes('请求参数不合法'))
    ) {
      pubResult.msg =
        '账号发布频繁，需在官方完成图形验证才能发博成功，若今日仍有需求，建议使用 <浏览器发布>。（部分账号第二天将会解禁）';
    } else if (pubResult?.msg?.includes('账号信息不完整')) {
      pubResult.msg = '账号信息不完整，请退出账号重新授权后再试。';
    }
    if (pubResult?.msg?.includes('abnormal account')) {
      pubResult.msg = '账号存在异常，请前往官方创作者中心确认后再试。';
    }
  }

  return pubResult;
};

/**
 * 上传视频分片
 * @param taskData
 * @param pubResult
 * @param eventCallback
 * @param source
 * @param xsrfToken
 * @param maxThread
 * @param cookie
 */
export const uploadVideo = async (
  taskData: XinlangweiboVideoTaskInput,
  pubResult: XinlangweiboPublishResultOutput,
  eventCallback: EventEmitter,
  xsrfToken: string,
  maxThread: number,
  cookie: string,
  source: number = 339644097,
): Promise<XinlangweiboUploadCheckResponse | null | undefined> => {
  let fileHandle: fs.promises.FileHandle | null = null;
  try {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // 获取文件信息
    const fileStat = await fs.promises.stat(taskData.video.localPath);
    fileHandle = await fs.promises.open(taskData.video.localPath, 'r');

    const fileName = generateRandomString(10) + path.basename(taskData.video.localPath);
    const videoLength = fileStat.size;

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // 获取上传参数
    const uploadVideoArgs = await getUploadArgs(cookie, fileName, videoLength, pubResult, source);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (!uploadVideoArgs) {
      // console.debug('获取上传参数失败', taskData.taskId, uploadVideoArgs, pubResult);

      pubResult.code = pubResult.code ?? errorCode.data_error;

      return null;
    }

    // 开始读取并上传文件
    let readIndex = 0;

    // 分片大小
    const blockSize = 8388608;

    // 总片数
    const totalPartNums = Math.ceil(videoLength / blockSize);

    // 并行上传
    const tasks: Array<Promise<XinlangweiboUploadPartResponse>> = [];
    let uploadedParts = 0;
    const emitGate = new UploadEmitGate(fileStat.size, totalPartNums);
    const onPartUploaded = () => {
      uploadedParts++;
      if (emitGate.shouldEmit(uploadedParts)) {
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploading,
          '视频上传中',
          taskData.taskId,
          totalPartNums,
          uploadedParts,
          taskData.needParts === true,
        );
      }
    };

    SetProgressNewEvent(
      eventCallback,
      publishStatusEnum.uploading,
      '视频上传中',
      taskData.taskId,
      totalPartNums,
      uploadedParts,
      taskData.needParts === true,
    );
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // 文件大小小于等单个分片大小
    if (blockSize >= fileStat.size) {
      const buffer = Buffer.alloc(videoLength);
      const readData = await fileHandle.read(buffer, 0, videoLength, readIndex);
      if (readData.buffer.length > 0) {
        const uploadResult = await uploadVideoPart(
          readData.buffer,
          uploadVideoArgs,
          0,
          blockSize,
          totalPartNums,
          xsrfToken,
          source,
        );
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);
        if (uploadResult?.result != true) {
          pubResult.code = uploadResult.error_code ?? errorCode.data_error;
          pubResult.msg = '视频分片上传失败:' + (uploadResult.error ?? '');

          return null;
        }
      } else {
        pubResult.code = errorCode.io_error;
        pubResult.msg = '文件读取失败:' + taskData.video.localPath;

        return null;
      }
    }
    // 文件有多个分片
    else {
      let partNum = 0;
      while (readIndex < videoLength) {
        // SetProgressEvent(
        //   eventCallback,
        //   10 + Number.parseFloat(((partNum / totalPartNums) * 0.7 * 100).toFixed(2).substring(0, 4)),
        //   '视频上传中',
        //   taskData.taskId,
        // );

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
            uploadVideoPart(readData.buffer, uploadVideoArgs, partNum, blockSize, totalPartNums, xsrfToken, source),
          );

          if (tasks.length > maxThread) {
            const uploadResult = await Promise.race(tasks);
            if (uploadResult?.result != true) {
              pubResult.code = uploadResult.error_code ?? errorCode.data_error;
              pubResult.msg = '视频分片上传失败:' + (uploadResult.error ?? '');

              return null;
            }
            //onPartUploaded();

            const uploadResultNew = await tasks.splice(0, 1)[0];
            if (uploadResultNew?.result != true) {
              pubResult.code = uploadResult.error_code ?? errorCode.data_error;
              pubResult.msg = '视频分片上传失败:' + (uploadResult.error ?? '');

              return null;
            }
            onPartUploaded();
          }

          readIndex += readData.buffer.length;

          if (canReadNum < blockSize) {
            break;
          }
        } else {
          pubResult.code = errorCode.io_error;
          pubResult.msg = '文件读取失败:' + taskData.video.localPath;

          return null;
        }
        partNum++;
      }
    }
    while (tasks.length > 0) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      const uploadResult = await tasks.splice(0, 1)[0];
      if (uploadResult?.result != true) {
        pubResult.code = uploadResult.error_code ?? errorCode.data_error;
        pubResult.msg = '视频分片上传失败:' + (uploadResult?.error ?? '');

        return null;
      }
      onPartUploaded();
    }

    SetProgressNewEvent(
      eventCallback,
      publishStatusEnum.uploading,
      '视频上传中',
      taskData.taskId,
      totalPartNums,
      totalPartNums,
      taskData.needParts === true,
    );

    // 检查视频上传是否成功
    const checkResult = await checkUploadResponse(
      cookie,
      uploadVideoArgs,
      xsrfToken,
      totalPartNums,
      videoLength,
      source,
    );
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (!checkResult?.auth) {
      // console.debug('视频上传校验失败', taskData.taskId, uploadVideoArgs, checkResult);

      pubResult.code = checkResult.error_code ?? errorCode.data_error;
      pubResult.msg = '上传校验失败:' + (checkResult.error ?? '');

      return null;
    }

    pubResult.code = 0;
    pubResult.msg = '';
    return checkResult;
    // endregion
  } catch (e) {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    logger.error(`新浪微博视频上传异常失败，${taskData.taskId},${(e as Error)?.message}`);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = '视频上传失败';
    return null;
  } finally {
    fileHandle?.close();
  }
};

/**
 * 获取视频上传参数
 * @param cookie
 * @param fileName
 * @param videoSize
 * @param pubResult
 * @param source
 */
const getUploadArgs = async (
  cookie: string,
  fileName: string,
  videoSize: number,
  pubResult: XinlangweiboPublishResultOutput,
  source: number = 339644097,
): Promise<WeiboUploadArgs | null> => {
  try {
    const xsrfToken = getXsrfToken(cookie) ?? '';

    const disPatchData = await getDispatchResponse(cookie, xsrfToken);

    if (disPatchData?.ok != 1) {
      pubResult.msg = disPatchData.message;
      pubResult.code = -1;
      return null;
    }

    let initUrl = disPatchData.data.video.init_url;
    if (initUrl?.includes('?')) {
      initUrl = `${initUrl}&`;
    } else {
      initUrl = `${initUrl}?`;
    }
    const getArgsUrl = `${initUrl}source=${source}&size=${videoSize}&name=${encodeURIComponent(
      fileName,
    )}&type=video&client=web&session_id=${Guid.NewGuid()}`;

    const uploadArgs = await getUploadArgsResponse(cookie, getArgsUrl, xsrfToken);

    if (uploadArgs.error) {
      pubResult.msg = uploadArgs.error;
      pubResult.code = uploadArgs.error_code;
      return null;
    }

    const reArgs: WeiboUploadArgs = {
      check_url: disPatchData.data.video.check_url,
      upload_url: disPatchData.data.video.upload_url,
      upload_id: uploadArgs.upload_id,
      media_id: uploadArgs.media_id,
      auth: uploadArgs.auth,
    };
    pubResult.code = 0;
    pubResult.msg = '';
    return reArgs;
  } catch (e) {
    pubResult.code = -1;
    pubResult.msg = e?.toString();
    return null;
  }
};

export const uploadCoverProcess = async (
  taskData: XinlangweiboVideoTaskInput,
  eventCallback: EventEmitter,
  cookie: string,
  uid: number,
  waterMark: number,
  nickName: string,
  pubResult: XinlangweiboPublishResultOutput,
): Promise<XinlangweiboImageInfoResultResponse | null | undefined> => {
  try {
    SetProgressEvent(eventCallback, 90, '封面上传中', taskData.taskId);

    //读取图片数据
    const imageData = await readImageData(taskData.cover.pathOrUrl, 'jpeg');

    if (!imageData?.data) {
      pubResult.code = -1;
      pubResult.msg = `封面下载失败:${taskData.cover.pathOrUrl}`;
      return null;
    }

    //上传图片数据，返回上传成功的图片url
    const imageResult = await uploadVideoImage(cookie, uid, waterMark, nickName, imageData.data);

    //判断封面是否上传成功
    if (!imageResult?.pic?.pid) {
      // console.debug('微博视频封面上传失败', taskData.taskId, taskData?.cover?.pathOrUrl, imageResult);
      pubResult.code = -1;
      pubResult.msg = `封面上传失败:${taskData.cover.pathOrUrl}`;
      return null;
    }
    pubResult.code = 0;
    pubResult.msg = '';
    return imageResult;
    //endregion
  } catch (e) {
    console.error('微博视频封面上传失败', taskData.taskId, e);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = `封面上传失败:${taskData.cover.pathOrUrl}`;
    return null;
  }
};

export interface WeiboUploadArgs {
  check_url: string;
  upload_url: string;
  upload_id: string;
  media_id: string;
  auth: string;
}

const buildPostData = async (
  taskData: XinlangweiboVideoTaskInput,
  coverInfo: XinlangweiboImageInfoResultResponse,
  videoInfoIn: XinlangweiboUploadCheckResponse,
  cookie: string,
): Promise<string> => {
  const argsList: Array<string> = [];
  const categoryId = taskData.subCategoryId ?? '';
  const videoInfo = {
    titles: [
      {
        title: taskData.title ?? '',
        default: 'true',
      },
    ],
    covers: [
      {
        pid: coverInfo.pic.pid,
        width: taskData.cover.width ?? 640,
        height: taskData.cover.height ?? 368,
      },
    ],
    free_duration: {
      start: 0,
      end: 30,
    },
    type: 'video',
    media_id: videoInfoIn.media_id,
    resource: {
      video_down: taskData.allowDownload ? 1 : 0,
    },
    homemade: {
      channel_ids: [categoryId],

      //创作类型
      type: taskData?.createType,
    },
    approval_reprint: '1',
    playlist: {
      // "playlist_video": true,   //合集参数
      // "album_ids": "4724760375132300"
    },
  };

  //合集
  if (taskData.collections && taskData.collections?.length > 0) {
    const ids = taskData.collections.map((x) => x.yixiaoerId).join(',');
    videoInfo.playlist['playlist_video'] = true;
    videoInfo.playlist['album_ids'] = ids;
  }

  const title = taskData.title?.toString();
  let content = '';

  //话题，兼容描述中嵌入话题和单独设置话题
  if (taskData.desc?.includes('<p') && taskData.desc?.includes('</p>')) {
    //从描述中解析话题出来
    const html = new HtmlDocument();
    html.LoadHtml(taskData.desc);
    let desc = '';
    const pList = html.DocumentNode.SelectNodes('//p');
    if (pList?.length > 0) {
      //话题
      const topics = html.DocumentNode.SelectNodes('//topic');
      if (topics?.length > 0) {
        for (const item of topics) {
          let topicStr = htmlDecode(decodeURIComponent(item.getAttribute('raw') ?? ''));
          if (!topicStr?.startsWith('{')) {
            const text = item.getAttribute('text') ?? '';
            const tmpTopic = await getXinlangweiboTopicList(cookie, text);
            if (tmpTopic?.dataList?.length) {
              topicStr = JSON.stringify(tmpTopic.dataList[0]);
            } else {
              continue;
            }
          }
          const topicItem = JSON.parse(topicStr)?.raw;
          item.textContent = `#${topicItem.topic}# `;
        }
      }

      //换行
      let newText = '';
      for (let pIndex = 0; pIndex < pList.length; pIndex++) {
        const pItem = pList[pIndex];
        newText = `${newText}${pItem.textContent}\n`;
      }

      desc = htmlDecode(newText);
    } else {
      //话题
      const topics = html.DocumentNode.SelectNodes('//topic');
      if (topics?.length > 0) {
        for (const item of topics) {
          const topicStr = htmlDecode(item.getAttribute('raw') ?? '');
          let topicItem = topicStr?.startsWith('{') ? JSON.parse(topicStr)?.raw : null;
          if (!topicItem) {
            const text = item.getAttribute('text') ?? '';
            const tmpTopic = await getXinlangweiboTopicList(cookie, text);
            if (tmpTopic?.dataList?.length) {
              topicItem = tmpTopic.dataList[0]?.raw;
            } else {
              continue;
            }
          }
          item.textContent = `#${topicItem.topic}# `;
        }
      }
      desc = htmlDecode(html.DocumentNode.InnerText());
    }
    content = title ? `${title ?? ''}${desc ?? ''}` : desc;
  } else {
    const topicList = taskData.topics && taskData.topics?.length > 0 ? taskData.topics.map((obj) => obj.topic) : [];
    const topicStr = topicList?.length > 0 ? `#${topicList.join('# #')}# ` : '';
    content = title
      ? `${title ?? ''}${topicStr ?? ''}${taskData.desc ?? ''}`
      : `${topicStr ?? ''}${taskData.desc ?? ''}`;
  }

  //地理位置
  if (taskData.location?.pc_title) {
    content = `${content ?? ''}${taskData.location?.pc_title ?? ''}`;
  }

  argsList.push(`content=${encodeURIComponent(content)}`);
  argsList.push('pic_id=');
  argsList.push(`visible=${taskData.visibilityType ?? 10}`);
  argsList.push(`media=${encodeURIComponent(JSON.stringify(videoInfo))}`);
  argsList.push(`vote=${encodeURIComponent('{}')}`);
  argsList.push('approval_state=0');

  //定时发布
  if (taskData.publishTime) {
    argsList.push(`schedule_timestamp=${taskData.publishTime}`);
    argsList.push('schedule_id=');
    argsList.push('schedule_beijing_tz=0');
  }

  return sortQueryString(argsList, false);
};

export interface XinlangweiboPublishResultOutput extends BaseResult {
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

export interface XinlangweiboVideoTaskInput extends ITask {
  cancelToken?: CancelToken;
  /**
   * 任务唯一标志id
   */
  taskId: string;
  /**
   * 视频信息
   */
  video: {
    /**
     * 时长-秒
     */
    duration: number;
    /**
     * 视频宽度
     */
    width?: number;
    /**
     * 视频高度
     */
    height?: number;
    /**
     * 视频字节数大小
     */
    size?: number;
    /**
     * 视频本地路径
     */
    localPath: string;
  };
  /**
   * 横版封面信息
   */
  cover: {
    /**
     * 封面宽度
     */
    width: number;
    /**
     * 封面高度
     */
    height: number;
    /**
     * 封面字节数大小
     */
    size?: number;
    /**
     * 封面url或本地路径
     */
    pathOrUrl: string;
  };

  /**
   * 标题
   */
  title: string;

  /**
   * 是否允许下载视频
   */
  allowDownload?: boolean;

  /**
   * 二级分类id
   */
  subCategoryId?: number;

  /**
   * 类型/创作类型
   * 0:原创
   * 1:转载
   * 2:二创
   *
   */
  createType: number;

  /**
   * 合集列表
   */
  collections?: Array<ListItemInfo>;
  /**
   * 微博话题
   */
  topics?: Array<WeiboTopicInfo>;

  /**
   * 微博内容描述
   */
  desc?: string;

  /**
   * 地点
   */
  location?: XinlangweiboLocationInfo;
  /**
   * 可见类型/谁可见
   * 0:公开
   * 10:粉丝可见
   * 6:好友可见
   * 1:自己可见
   */
  visibilityType: number;

  /**
   * 定时发布13位时间戳
   */
  publishTime?: number;

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}
