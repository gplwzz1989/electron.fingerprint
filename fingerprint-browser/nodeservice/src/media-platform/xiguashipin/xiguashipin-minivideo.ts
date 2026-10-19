import { $http, createHttpInstance, HttpConfig } from '../../http';
import { Guid, htmlDecode, isJson, logger, SetProgressEvent } from '../../utils';
import { aws4Interceptor } from 'aws4-axios';
import { AxiosError } from 'axios';
import { EventEmitter } from 'events';
import * as fs from 'fs';

import { AuthDataOutput, getAuthKey, getSdkToken, uploadCover, uploadedImageInfo } from './xiguashipin-base.service';
import {
  checkVideoUpload,
  getUploadedVideoInfo,
  getVideoUploadArgs,
  UploadAuthInfo,
  uploadedVideoInfo,
  uploadVideoPart,
} from './xiguashipin-video.service';
import { errorCode } from '../errorCode';
import { CancelToken, privateKey } from '../../utils/CancelToken';
import { XiguashipinFriendInfo } from './xiguashipin-friend.service';
import { XiguashipinTopicInfo } from './xiguashipin-topics.service';
import { XiguashipinActivityInfo } from './xiguashipin-acticity.service';
import { HtmlDocument } from '../../htmlAgilityPack';

export const getFileSize = async (path: string): Promise<number> => {
  const fileStat = await fs.promises.stat(path);
  return fileStat.size;
};

/**
 * 视频上传完整过程
 * @param taskData 任务数据
 * @param authDataOut
 * @param pubResult 发布结果对象
 * @param eventCallback 回调事件对象
 * @param userId 用户id
 * @param maxThread 最大并发上传数
 * @param cookie
 */
export const uploadVideo = async (
  taskData: XiguaVideoTaskInput,
  authDataOut: { node: AuthDataOutput },
  pubResult: XiguaPublishResult,
  eventCallback: EventEmitter,
  userId: string,
  maxThread: number,
  cookie: string,
): Promise<uploadedVideoInfo | null | undefined> => {
  let fileHandle: fs.promises.FileHandle | null = null;
  try {
    // 获取上传认证参数
    const authData = await getAuthKey(cookie);
    if (!authData?.data?.uploadToken?.AccessKeyID) {
      // console.debug('获取认证参数失败', taskData.taskId, authData);
      pubResult.code = authData.status;
      pubResult.msg = '获取认证参数失败:' + (authData.message ?? '');

      return null;
    }
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    authDataOut.node = authData;
    // 获取文件信息
    const fileStat = await fs.promises.stat(taskData.video.localPath);
    fileHandle = await fs.promises.open(taskData.video.localPath, 'r');

    // 提取认证信息
    const authResult: UploadAuthInfo = authData.data.uploadToken;

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
          accessKeyId: authResult.AccessKeyID ?? authResult.AccessKeyId,
          secretAccessKey: authResult.SecretAccessKey,
          sessionToken: authResult.SessionToken,
        },
      }),
    );

    // 获取上传参数
    const uploadVideoArgs = await getVideoUploadArgs(fileStat.size, userId, $httpSign);
    if (!uploadVideoArgs?.Result?.InnerUploadAddress?.UploadNodes) {
      // console.debug('获取上传参数失败', taskData.taskId, uploadVideoArgs);

      pubResult.code = uploadVideoArgs.status_code;
      pubResult.msg = '获取上传参数失败:' + (uploadVideoArgs.status_msg ?? uploadVideoArgs?.Error?.Message ?? '');

      return null;
    }
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // 准备上传分片信息列表
    const uploadedList: Map<number, string> = new Map<number, string>();

    // 上传id
    const uploadId = Guid.NewGuid().toString();

    // 开始读取并上传文件
    let readIndex = 0;

    // 分片大小
    let blockSize = 3145728; // 500M以下的视频，分片大小为3M，500M以上的视频，分片大小为5M，1G以上的视频大小为10M
    if (fileStat.size > 1024 * 1024 * 500) {
      blockSize = 1024 * 1024 * 5;
    } else if (fileStat.size > 1024 * 1024 * 1024) {
      blockSize = 1024 * 1024 * 10;
    }

    // 总片数
    const totalPartNums = Math.ceil(fileStat.size / blockSize);

    // 并行上传
    const tasks: Array<Promise<UploadPartResult>> = [];

    SetProgressEvent(eventCallback, 10, '视频上传中', taskData.taskId);

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
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);
        uploadedList.set(uploadResult.partNum, uploadResult.data.crc32);
      } else {
        pubResult.code = errorCode.io_error;
        pubResult.msg = '文件读取失败:' + taskData.video.localPath;

        return null;
      }
    }
    // 文件有多个分片
    else {
      let partNum = 0;
      while (readIndex < fileStat.size) {
        partNum++;

        SetProgressEvent(
          eventCallback,
          10 + Number.parseFloat(((partNum / totalPartNums) * 0.7 * 100).toFixed(2).substring(0, 4)),
          '视频上传中',
          taskData.taskId,
        );

        let canReadNum = blockSize;
        let buffer = Buffer.alloc(blockSize);
        if (readIndex + blockSize > fileStat.size) {
          canReadNum = fileStat.size - readIndex;
          buffer = Buffer.alloc(canReadNum);
        }

        const readData = await fileHandle.read(buffer, 0, canReadNum, readIndex);
        if (readData.buffer.length > 0) {
          //取消任务执行
          taskData.cancelToken?.throwIfCancelled(privateKey);

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
          pubResult.msg = '文件读取失败:' + taskData.video.localPath;

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

    SetProgressEvent(eventCallback, 81, '视频上传完成', taskData.taskId);

    const uploadStrList: Array<string> = [];

    if (uploadedList.size < totalPartNums) {
      // console.debug('视频上传失败', taskData.taskId, uploadedList);
      pubResult.code = errorCode.io_error;
      pubResult.msg = '视频上传失败:' + taskData.video.localPath;

      return null;
    }

    for (let i = 1; i <= uploadedList.size; i++) {
      uploadStrList.push(`${i}:${uploadedList.get(i)}`);
    }

    const uploadResultList = uploadStrList.join(',');

    SetProgressEvent(eventCallback, 82, '上传完成校验中', taskData.taskId);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // 检查视频上传是否成功
    const checkResult = await checkVideoUpload(userId, uploadId, uploadResultList, uploadVideoArgs);
    if (!checkResult.data?.key) {
      // console.debug('视频上传校验失败', taskData.taskId, uploadedList, checkResult);

      pubResult.code = -1;
      pubResult.msg = '上传校验失败:' + (checkResult.message ?? '');

      return null;
    }

    SetProgressEvent(eventCallback, 85, '获取上传完成视频信息', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //获取上传完成的视频信息
    const uploadVideoInfo = await getUploadedVideoInfo(userId, uploadVideoArgs, $httpSign);
    if (!(uploadVideoInfo?.Result?.Results?.length > 0)) {
      // console.debug('获取视频信息失败', taskData.taskId, uploadedList, uploadVideoInfo);

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
    console.error('西瓜视频上传失败', taskData.taskId, e);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = '视频上传失败';
    return null;
  } finally {
    fileHandle?.close();
  }
};

/**
 *  抖音发布视频
 * @param cookie cookie字符串 eg: cookie1=12;cookie2=345
 * @param taskData 发布入参
 * @param eventCallback 进度回调
 * @param userId 用户uid，来自于获取的用户信息中uid
 * @param retryTimes 单个步骤失败后重试次数
 * @param maxThread 视频并发山川数
 */
export const xiguaPublishMiniVideo = async (
  cookie: string,
  taskData: XiguaVideoTaskInput,
  eventCallback: EventEmitter,
  userId: string,
  maxThread: number = 3,
  retryTimes: number = 3,
): Promise<XiguaPublishResult> => {
  logger.info(`西瓜竖版发布 ${taskData.taskId}`);

  const pubResult: XiguaPublishResult = {
    code: 0,
    msg: 'ok',
    taskId: taskData.taskId,
  };
  try {
    if (!fs.existsSync(taskData.video.localPath?.toString() ?? '')) {
      pubResult.code = errorCode.io_error;
      pubResult.msg = '视频文件不存在:' + taskData.video.localPath;
      logger.error(`视频文件不存在 ${taskData.taskId} ${taskData.video.localPath}`);
      return pubResult;
    }

    if (taskData?.video?.height ?? 0 <= (taskData?.video?.width ?? 0)) {
      pubResult.code = errorCode.io_error;
      pubResult.msg = '横版视频请用横版接口';
      return pubResult;
    }
    SetProgressEvent(eventCallback, 1, '准备上传中', taskData.taskId);

    // region 准备发布上传前置数据

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // 获取sdkToken
    let sdkToken = await getSdkToken(cookie);
    for (let i = 0; i < retryTimes; i++) {
      sdkToken = await getSdkToken(cookie);
      if (sdkToken) {
        break;
      }
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressEvent(eventCallback, 3, '正在获取上传参数', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // 获取上传认证参数
    let authData: AuthDataOutput = {
      status: -1,
      message: '',
      data: { spaceName: '', clientIp: '', uploadToken: undefined },
    };
    const authDataIn = { node: authData };
    // endregion

    // region 视频上传
    let uploadVideoInfo = await uploadVideo(taskData, authDataIn, pubResult, eventCallback, userId, maxThread, cookie);
    for (let i = 0; i < retryTimes; i++) {
      if (!uploadVideoInfo || !(uploadVideoInfo?.Result?.Results?.length > 0)) {
        if (i < retryTimes - 1 && uploadVideoInfo?.status_code != 8 && pubResult?.code != 8) {
          SetProgressEvent(eventCallback, 4, '上传失败,重试中', taskData.taskId);
          uploadVideoInfo = await uploadVideo(
            taskData,
            authDataIn,
            pubResult,
            eventCallback,
            userId,
            maxThread,
            cookie,
          );
          continue;
        }
        logger.error(
          `视频上传失败 ${taskData.taskId} ${cookie} ${JSON.stringify(uploadVideoInfo)} ${JSON.stringify(pubResult)}`,
        );
        return pubResult;
      } else {
        break;
      }
    }
    if (!uploadVideoInfo) {
      pubResult.code = -2;
      pubResult.msg = '视频上传失败，请稍后重试';
      logger.error(
        `视频上传失败 ${taskData.taskId} ${cookie} ${JSON.stringify(uploadVideoInfo)} ${JSON.stringify(pubResult)}`,
      );
      return pubResult;
    }
    authData = authDataIn.node;
    // endregion

    // region 封面上传

    SetProgressEvent(eventCallback, 90, '封面上传中', taskData.taskId);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    let uploadedCoverInfo: uploadedImageInfo | null = await uploadCover(
      userId,
      taskData.cover.pathOrUrl,
      authData,
      taskData.taskId,
      pubResult,
    );
    for (let i = 0; i < retryTimes; i++) {
      if (uploadedCoverInfo == null || !(uploadedCoverInfo?.Result?.Results?.length > 0)) {
        if (i < retryTimes - 1) {
          uploadedCoverInfo = await uploadCover(userId, taskData.cover.pathOrUrl, authData, taskData.taskId, pubResult);
          continue;
        }

        pubResult.code = -1;
        pubResult.msg = `封面上传失败:${uploadedCoverInfo?.ResponseMetadata?.Error?.Message ?? ''}`;
        logger.error(
          `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${JSON.stringify(
            uploadedCoverInfo,
          )} ${JSON.stringify(pubResult)}`,
        );
        return pubResult;
      }
      break;
    }
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (uploadedCoverInfo == null) {
      logger.error(
        `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${JSON.stringify(
          uploadedCoverInfo,
        )} ${JSON.stringify(pubResult)}`,
      );
      return pubResult;
    }

    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);

    // endregion

    //任务不可取消
    taskData.cancelToken?.disable(privateKey);
    // region 组装并推送数据
    // 组装发布数据
    const publishResult = await publish(cookie, sdkToken, taskData, uploadedCoverInfo, uploadVideoInfo);

    pubResult.code = publishResult.status ?? -1;
    pubResult.msg = publishResult.message ?? '';
    pubResult.publishId = publishResult?.data?.ItemId?.toString();

    if (pubResult.msg == 'sms') {
      pubResult.msg =
        '发布失败:官方平台检测到您的账号存在风险，请先前往《创作者中心》里登录后单独发布一个作品，发布时会跳出验证，验证通过即可一键发布。';
      pubResult.code = -110;
    } else if (pubResult.msg == '服务异常') {
      pubResult.msg =
        '发布失败:检测到西瓜账号异常，请先前往《创作者中心》使用该西瓜账号发布一条内容，发布成功后即可继续在【一键发布】中操作。';
      pubResult.code = -110;
    }

    // console.debug('西瓜发布完成', taskData.taskId, taskData, uploadedCoverInfo, uploadVideoInfo, pubResult);

    if (pubResult.publishId) {
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
      logger.error(
        `西瓜横版发布失败 ${taskData.taskId} ${cookie} ${uploadedCoverInfo} ${JSON.stringify(
          uploadVideoInfo,
        )} ${JSON.stringify(publishResult)}`,
      );
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
      pubResult.msg = `发布失败，${e?.toString()}`;
      pubResult.errorInfo = e?.toString();
    }
    logger.error(`西瓜竖版视频发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};

export interface XiguaPublishResult {
  /**
   * 状态码
   * -0成功，非0失败
   */
  code: number;

  /**
   *提示消息
   */
  msg: string;

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

/**
 * 西瓜视频发布入参
 */
export interface XiguaVideoTaskInput {
  /**
   * 取消任务的操作对象
   */
  cancelToken?: CancelToken;
  /**
   * 任务唯一标志id
   */
  taskId: string;

  /**
   * 发布/存草稿
   */
  pubType: 1 | 0;
  /**
   * 视频信息
   */
  video: {
    /**
     * 时长-秒-可带小数
     */
    duration?: number;
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
   * 封面信息
   */
  cover: {
    /**
     * 封面宽度
     */
    width?: number;
    /**
     * 封面高度
     */
    height?: number;
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
   * 话题列表
   */
  topics?: Array<XiguashipinTopicInfo>;
  /**
   * at好友/用户列表
   */
  mentions?: Array<XiguashipinFriendInfo>;
  /**
   * 标题
   */
  title?: string;
  /**
   * 描述信息，支持话题和好友的任意位置插入(包含插入的好友和话题，和官方保持一致)
   */
  desc?: string;
  /**
   * 可见类型
   *  - 0: 公开
   *  - 1:私密
   *  - 2: 好友可见
   */
  visibility_type: number;

  /**
   * 是否允许下载
   *  - 0: 否
   *  - 1: 是
   */
  download: number;

  /**
   * 定时发布时间戳，10位
   */
  timing?: number;

  /**
   * 是否同步到抖音
   * -0否 ，1是
   */
  should_sync: number;

  /**
   *活动列表
   */
  activity?: XiguashipinActivityInfo;

  /**
   * 是否原创
   */
  isOriginal: 1 | 0;
}

/**
 * 上传分片结果（仅包含所需字段）
 */
export interface UploadPartResult {
  /**
   * 分片序号
   */
  partNum: number;
  /**
   * 分片数据
   */
  data?: {
    /**
     * 分片序号
     */
    part_number: string;
    /**
     * CRC32校验码
     */
    crc32: string;
  };
  /**
   * 状态码
   * -2000为正常
   */
  code: number;

  /**
   *  提示消息
   */
  message?: string;
}

const publish = async (
  cookie: string,
  sdkToken: string,
  publishPostData: XiguaVideoTaskInput,
  coverInfo: uploadedImageInfo,
  videoInfo: uploadedVideoInfo,
): Promise<{
  status: number;
  message?: string;
  data?: {
    ItemId: string;
  };
}> => {
  const headers = {
    cookie: cookie,
    'User-Agent': HttpConfig.userAgent,
    'Content-Type': 'application/json;charset=UTF-8',
    'x-secsdk-csrf-token': sdkToken,
    'bd-ticket-guard-web-version': '1',
    'bd-ticket-guard-version': '2',
    'bd-ticket-guard-iteration-version': '1',
    'bd-ticket-guard-client-data': cookie.split('bd_ticket_guard_client_data=')[1]?.split(';')[0]?.trim() ?? '',
    Referer: 'https://studio.ixigua.com/upload?from=post_article',
    Origin: 'https://studio.ixigua.com/',
  };

  const url = 'https://studio.ixigua.com/api/upload/CreateItem/?_signature=_';

  const postData = buildPostData(publishPostData, coverInfo, videoInfo);
  // console.debug('西瓜横版推送数据', publishPostData.taskId, cookie, postData);
  const publishResult = await $http.post(url, postData, {
    headers: headers,
  });
  // console.debug('西瓜横版推送返回数据', publishPostData.taskId, publishResult.data);
  if (isJson(publishResult.data)) {
    return publishResult.data;
  } else {
    return {
      status: publishResult.status ?? errorCode.data_error,
      message: '服务异常',
    };
  }
};

/**
 * 组装发布参数
 * @param taskData
 * @param coverInfo
 * @param videoInfo
 * @param shopDraftId 商品挂载id
 */
const buildPostData = (
  taskData: XiguaVideoTaskInput,
  coverInfo: uploadedImageInfo,
  videoInfo: uploadedVideoInfo,
): string => {
  const rePostData = {
    ItemId: '',
    Title: taskData.title ?? '',
    Abstract: taskData?.desc ?? '',
    //@好友
    TitleRichText: [],
    AbstractRichText: [] as Array<{ Text: string; Start: number; Length: number; Type: number; UserId: string }>,
    //是否禁止下载视频
    AttrsValueMap: {
      AuthorBanDownload: taskData?.download?.toString() == '1' ? '0' : '1',
    },
    VideoType: 2,
    IsNew: true,
    //申明原创
    ClaimOrigin: taskData?.isOriginal?.toString() == '1',
    CoverTitles: [],
    TemplateName: '',
    FilterName: '',
    //可见类型
    HideInfo: { HideType: taskData.visibility_type ?? 0 },
    VideoInfo: {
      Vid: videoInfo.Result.Results[0].Vid,
      VName: taskData.title ?? '',
      ThumbUri: coverInfo.Result.Results[0]?.Uri ?? videoInfo.Result.Results[0].PosterUri,
      ThumbUriFrom: 'custom',
      Duration: videoInfo.Result.Results[0].VideoMeta.Duration,
      VideoWidth: videoInfo.Result.Results[0].VideoMeta.OriginWidth ?? 1920,
      VideoHeight: videoInfo.Result.Results[0].VideoMeta.OriginHeight ?? 1080,
    },
    EnterFrom: 54,
    CreateSource: 1,
    //参与活动
    ActivityTag: taskData?.activity?.activityId ?? '0',
    CommonParams: {
      UserAgent: HttpConfig.userAgent,
      DevicePlatform: 'web',
      TerminalType: '01',
      OsType: '09',
      SoftType: 'chrome 95.0.4638.69',
    },
    IsRewardProject: false,
    //直接发布或存草稿
    PublishType: taskData.pubType ?? 0,
    isPublishNow: false,
    otherChangedExceptTimerStatus: false,
  };
  rePostData.AbstractRichText = [];
  //兼容话题好友活动中间插入
  if (taskData.desc?.includes('<p') && taskData.desc?.includes('</p>')) {
    const html = new HtmlDocument();
    html.LoadHtml(taskData.desc);
    let text = taskData.desc;
    const pList = html.DocumentNode.SelectNodes('//p');
    if (pList?.length > 0) {
      ////替换缓存
      const tmpDataMap = new Map<string, string>();

      let iCount = 0;
      //话题
      const topics = html.DocumentNode.SelectNodes('//topic');
      if (topics?.length > 0) {
        for (const item of topics) {
          iCount++;
          const topicStr = htmlDecode(item.getAttribute('raw') ?? '');
          if (!topicStr?.startsWith('{')) {
            continue;
          }

          const key = `{tmp_t${iCount}}`;
          item.textContent = key;
          tmpDataMap.set(key, topicStr);
        }
      }

      //好友
      const friends = html.DocumentNode.SelectNodes('//friend');
      if (friends?.length > 0) {
        for (const item of friends) {
          iCount++;
          const friendStr = htmlDecode(item.getAttribute('raw') ?? '');
          if (!friendStr?.startsWith('{')) {
            continue;
          }
          const key = `{tmp_f${iCount}}`;
          item.textContent = key;
          tmpDataMap.set(key, friendStr);
        }
      }

      //换行
      let newText = '';
      for (let pIndex = 0; pIndex < pList.length; pIndex++) {
        const pItem = pList[pIndex];
        newText = `${newText}${pItem.textContent}\n`;
      }

      //缓存替换
      const regex = /\{tmp_[^}]+\}/g;

      const matches: string[] = [];

      let match;
      while ((match = regex.exec(newText)) !== null) {
        matches.push(match[0]);
      }

      for (const tmpKey of matches) {
        const jo = JSON.parse(tmpDataMap.get(tmpKey) ?? '{}');
        const indexNum = newText.indexOf(tmpKey);
        const tagIds: Array<string> = [];
        if (tmpKey.includes('tmp_t')) {
          const topicOriName = jo.cha_name.trimStart();
          const replaceName = `#${topicOriName} `;
          newText = newText.replace(tmpKey, replaceName);
          tagIds.push(jo.id_str);
        } else if (tmpKey.includes('tmp_f')) {
          const friendOriName = jo?.nickname.trimStart();

          const replaceName = `@${friendOriName} `;
          newText = newText.replace(tmpKey, replaceName);

          const userTextItem = {
            Text: '@' + (jo.name ?? jo.userName),
            Start: indexNum + replaceName.length - 1,
            Length: indexNum + replaceName.length - 1,
            Type: 1,
            UserId: jo.user_id,
          };
          rePostData.AbstractRichText.push(userTextItem);
        }
      }

      text = htmlDecode(newText);
    } else {
      //话题
      const topics = html.DocumentNode.SelectNodes('//topic');
      if (topics?.length > 0) {
        const tagIds: Array<string> = [];
        for (const item of topics) {
          const itemHtmlStr = item.toString();
          const topicStr = htmlDecode(item.getAttribute('raw') ?? '');
          const topicItem = topicStr?.startsWith('{') ? JSON.parse(topicStr) : null;
          if (!topicItem) {
            continue;
          }
          const topicIndex = text.indexOf(itemHtmlStr);
          if (topicIndex < 0) {
            continue;
          }

          const topicShowName = item.textContent ?? '';
          text = text.replace(itemHtmlStr, topicShowName);
          tagIds.push(topicItem.id_str);
        }
        //话题
        if (taskData.topics && taskData.topics?.length > 0) {
          rePostData['HashtagIds'] = tagIds;
        }
      }

      //好友
      const friends = html.DocumentNode.SelectNodes('//friend');
      if (friends?.length > 0) {
        for (const item of friends) {
          const itemHtmlStr = item.toString();
          const friendStr = htmlDecode(item.getAttribute('raw') ?? '');
          const user = friendStr?.startsWith('{') ? JSON.parse(friendStr) : null;
          if (!user) {
            continue;
          }
          const friendIndex = text.indexOf(itemHtmlStr);
          if (friendIndex < 0) {
            continue;
          }

          const friendShowName = item.textContent ?? '';
          text = text.replace(itemHtmlStr, friendShowName);

          const userTextItem = {
            Text: '@' + (user.name ?? user.userName),
            Start: friendIndex,
            Length: (user.name ?? user.userName).length + 1,
            Type: 1,
            UserId: user.user_id,
          };
          rePostData.AbstractRichText.push(userTextItem);
        }
      }
    }
  } else {
    //在描述@好友
    if (taskData.mentions && taskData?.mentions?.length > 0) {
      //目前不确定@好友接在标题后面，也可以接在描述后面
      let desc = taskData.desc ?? '';

      for (const user of taskData.mentions) {
        const userTextItem = {
          Text: '@' + (user.name ?? user.userName),
          Start: desc.length,
          Length: (user.name ?? user.userName).length + 1,
          Type: 1,
          UserId: user.user_id,
        };
        desc += '@' + (user.name ?? user.userName) + ' ';
        rePostData.AbstractRichText.push(userTextItem);
      }
      rePostData['Abstract'] = desc;
    }
    //话题
    if (taskData.topics && taskData.topics?.length > 0) {
      rePostData['HashtagIds'] = taskData.topics.map((obj) => obj.id_str);
    }
  }

  //定时发布
  if (taskData?.timing) {
    rePostData['TimerStatus'] = 1;
    rePostData['TimerTime'] = taskData.timing;
  }

  //同步到抖音，请确保已绑定抖音号
  if (taskData.should_sync == 1) {
    const AwemeCreateItem = {
      ItemId: '',
      AwemeItemId: '',
      UserId: '',
      Text: '',
      TextExtra: '',
      CoverUri: '',
      PoiId: '',
      PoiName: '',
    };
    rePostData['SyncAweme'] = true;
    AwemeCreateItem['TextExtra'] = '';
    //描述+话题
    AwemeCreateItem['Text'] = rePostData.Abstract;

    rePostData['AwemeCreateItem'] = AwemeCreateItem;
  }
  return JSON.stringify(rePostData);
};
