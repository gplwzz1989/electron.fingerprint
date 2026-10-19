import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import FormData from 'form-data';
import { AxiosError } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import { Guid, logger, publishStatusEnum, SetProgressEvent, SetProgressNewEvent, Task } from '@/utils';
import { errorCode } from '../errorCode';
import { checkQrcodeOpen } from './weixingongzhonghao-user.service';
import {
  createWeiXinGongZhongHaoVideoFormData,
  finishWeiXinGongZhongHaoVideoUpload,
  initWeiXinGongZhongHaoVideoUpload,
  operateWeiXinGongZhongHaoVideo,
  saveWeiXinGongZhongHaoVideoDraft,
  uploadWeiXinGongZhongHaoVideoPart,
  WeiXinGongZhongHaoOperateMpVideoArgs,
  WeiXinGongZhongHaoVideoUploadInfo,
} from './weixingongzhonghao-video.service';
import {
  WeixinMsgTaskInput,
  WeixinPublishResultOutput,
  uploadImage,
  createPublicMsg,
  createSendMsg,
  buildPushData,
} from './weixingongzhonghao-article';
import { createWeixinArticleMsgResponse, pushMsgResponse } from './weixingongzhonghao-article.service';

export interface WeiXinGongZhongHaoVideoTaskInput {
  taskId: string;
  pubType: 0 | 1;
  notifySubscribers?: 0 | 1;
  sex?: 0 | 1 | 2;
  groupId?: string;
  country?: string;
  province?: string;
  city?: string;
  draftId?: string;
  publishTime?: number;
  contentList: Array<WeiXinGongZhongHaoVideoContentItem>;
  cancelToken?: CancelToken;
  proxy?: KuaiDaiLiProxy;
  needParts?: boolean;
}

export interface WeiXinGongZhongHaoVideoContentItem {
  /**
   * 标题 64字
   */
  title: string;
  /**
   * 描述，300字
   */
  desc?: string;
  video: {
    duration: number;
    width?: number;
    height?: number;
    size?: number;
    localPath: string;
  };
  cover: {
    width: number;
    height: number;
    size?: number;
    pathOrUrl: string;
  };
  isOriginal?: 0 | 1;
  /**
   * 创作来源
   * 0:无需申明
   * 1:内容有AI生产
   * 2:素材来源官方媒体/网络新闻
   * 3:内容剧情演绎，仅供娱乐
   * 4:个人观点，仅供参考
   * 5:健康医疗分享，仅供参考
   * 6:投资观点，仅供参考
   */
  contentSource?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  disableRecommend?: number;
  /**
   * 是否开启留言
   * 0:关闭 1:关注用户 2:关注7天以上用户 3:所有
   */
  needOpenComment: 0 | 1 | 2 | 3;
  needOpenReply?: 2 | 3 | 4 | 5;
  openFansMsg?: 0 | 1;
  syncToFinder?: 0 | 1;
}

interface WeiXinUploadedVideoCoverInfo {
  url: string;
  format: string;
  id: string;
}

const buildVideoPartSha = (bufferData: Buffer): string => crypto.createHash('sha1').update(bufferData).digest('hex');

const buildVideoCropList = (): string => {
  const ratioList = ['2.35_1', '1_1', '3_4', '16_9', 'video', 'finder'];
  return JSON.stringify({
    crop_list: ratioList.map((ratio) => ({
      ratio,
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 0,
      file_id: 0,
    })),
    crop_list_percent: ratioList.map((ratio) => ({
      ratio,
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 0,
      file_id: 0,
    })),
  });
};

const uploadVideoCover = async (
  cookie: string,
  cover: WeiXinGongZhongHaoVideoContentItem['cover'] | undefined,
  ticketId: string,
  ticket: string,
  userToken: number,
): Promise<WeiXinUploadedVideoCoverInfo> => {
  if (!cover?.pathOrUrl) {
    return {} as never;
  }
  const coverUrl = cover.pathOrUrl.startsWith('//') ? `http:${cover.pathOrUrl}` : cover.pathOrUrl;
  const resultJson = await uploadImage(cookie, coverUrl, ticketId, ticket, userToken);
  if (!resultJson?.url) {
    return {} as never;
  }
  return {
    url: resultJson.url,
    format: resultJson.format ?? '',
    id: resultJson.id ?? '',
  };
};

const uploadWeiXinGongZhongHaoVideo = async (
  cookie: string,
  video: WeiXinGongZhongHaoVideoContentItem['video'],
  taskId: string,
  userToken: number,
  eventCallback: EventEmitter,
  pubResult: WeixinPublishResultOutput,
  cancelToken?: CancelToken,
  needParts?: boolean,
): Promise<WeiXinGongZhongHaoVideoUploadInfo | null> => {
  let fileHandle: fs.promises.FileHandle | null = null;
  try {
    if (!fs.existsSync(video.localPath?.toString() ?? '')) {
      pubResult.code = errorCode.io_error;
      pubResult.msg = '视频文件不存在:' + video.localPath;
      return null;
    }

    const fileStat = await fs.promises.stat(video.localPath);
    video.size = fileStat.size;
    const fileName = path.basename(video.localPath);
    const fingerprint = Guid.NewGuid().toString().replace(/-/g, '');
    SetProgressEvent(eventCallback, 3, '正在获取上传参数', taskId);
    const videoDuration = Math.max(0, Math.round((video.duration ?? 0) * 1000));
    const videoWidth = video.width ?? 0;
    const videoHeight = video.height ?? 0;

    let uploadInfo = await initWeiXinGongZhongHaoVideoUpload(cookie, userToken, {
      filename: fileName,
      filesize: fileStat.size,
      width: videoWidth,
      height: videoHeight,
      videoDuration,
      fingerprint,
    });
    if (!uploadInfo) {
      uploadInfo = await initWeiXinGongZhongHaoVideoUpload(cookie, userToken, {
        filename: fileName,
        filesize: fileStat.size,
        width: videoWidth,
        height: videoHeight,
        videoDuration,
        fingerprint,
      });
    }
    if (!uploadInfo) {
      pubResult.code = errorCode.data_error;
      pubResult.msg = '获取视频上传参数失败';
      return null;
    }

    cancelToken?.throwIfCancelled(privateKey);
    fileHandle = await fs.promises.open(video.localPath, 'r');
    const blockSize = uploadInfo.partSize || 4194304;
    const totalPartNums = Math.ceil(fileStat.size / blockSize);
    const uploadedList = new Map<number, string>();
    const tasks: Array<Promise<string>> = [];
    let uploadedParts = 0;

    SetProgressNewEvent(
      eventCallback,
      publishStatusEnum.uploading,
      '视频上传中',
      taskId,
      totalPartNums,
      0,
      needParts === true,
    );

    let readIndex = 0;
    let partNum = 0;
    while (readIndex < fileStat.size) {
      cancelToken?.throwIfCancelled(privateKey);
      partNum++;
      const canReadNum = Math.min(blockSize, fileStat.size - readIndex);
      const bufferData = Buffer.alloc(canReadNum);
      const readData = await fileHandle.read(bufferData, 0, canReadNum, readIndex);
      if (!readData.buffer.length) {
        pubResult.code = errorCode.io_error;
        pubResult.msg = '文件读取失败:' + video.localPath;
        return null;
      }
      const partSha = buildVideoPartSha(readData.buffer);
      tasks.push(uploadWeiXinGongZhongHaoVideoPart(cookie, userToken, uploadInfo, partNum, partSha, readData.buffer));
      if (tasks.length >= 3) {
        const uploadResult = await Promise.race(tasks);
        const first = tasks.splice(0, 1)[0];
        const uploadResult2 = await first;
        for (const resultText of [uploadResult, uploadResult2]) {
          if (!resultText || resultText.startsWith('_')) {
            pubResult.code = errorCode.data_error;
            pubResult.msg = '视频分片上传失败';
            return null;
          }
          const [partNo, partShaValue] = resultText.split('_');
          uploadedList.set(parseInt(partNo), partShaValue);
          uploadedParts++;
        }
      }
      readIndex += readData.buffer.length;
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploading,
        '视频上传中',
        taskId,
        totalPartNums,
        uploadedParts,
        needParts === true,
      );
    }

    while (tasks.length > 0) {
      cancelToken?.throwIfCancelled(privateKey);
      const uploadResult = await tasks.splice(0, 1)[0];
      if (!uploadResult || uploadResult.startsWith('_')) {
        pubResult.code = errorCode.data_error;
        pubResult.msg = '视频分片上传失败';
        return null;
      }
      const [partNo, partShaValue] = uploadResult.split('_');
      uploadedList.set(parseInt(partNo), partShaValue);
      uploadedParts++;
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploading,
        '视频上传中',
        taskId,
        totalPartNums,
        uploadedParts,
        needParts === true,
      );
    }

    const finishResult = await finishWeiXinGongZhongHaoVideoUpload(cookie, userToken, uploadInfo.vid);
    cancelToken?.throwIfCancelled(privateKey);
    if (finishResult?.base_resp?.err_msg != 'ok') {
      pubResult.code = errorCode.data_error;
      pubResult.msg = `视频上传确认失败${finishResult?.base_resp?.err_msg}`;
      return null;
    }

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskId);
    return uploadInfo;
  } catch (e) {
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = '视频上传失败';
    logger.error(`微信公众号视频上传异常失败 ${taskId} ${(e as Error)?.message}`);
    return null;
  } finally {
    fileHandle?.close();
  }
};

const buildWeiXinGongZhongHaoVideoPostData = async (
  cookie: string,
  taskData: WeiXinGongZhongHaoVideoTaskInput,
  ticketId: string,
  ticket: string,
  userToken: number,
  pubResult: WeixinPublishResultOutput,
  eventCallback: EventEmitter,
): Promise<{ postData: FormData; draftId?: string; appMsgId?: number } | null> => {
  if (!taskData.contentList?.length) {
    pubResult.code = -1;
    pubResult.msg = '内容列表不能为空';
    return null;
  }

  const contentList: Array<{
    title: string;
    desc: string;
    content: string;
    coverUrl: string;
    coverUrl16_9: string;
    coverUrl1_1: string;
    coverUrlBack: string;
    cropList: string;
    videoId: string;
    mpVideoInfo: string;
    duration: number;
    width: number;
    height: number;
    claimSourceType: number;
    disableRecommend: number;
    isOriginal: number;
    needOpenComment: 0 | 1 | 2 | 3;
    needOpenReply: 2 | 3 | 4 | 5;
    openFansMsg: 0 | 1;
    import_to_finder: 0 | 1;
    shareVideoId?: string;
  }> = [];
  for (const item of taskData.contentList) {
    const uploadInfo = await uploadWeiXinGongZhongHaoVideo(
      cookie,
      item.video,
      taskData.taskId,
      userToken,
      eventCallback,
      pubResult,
      taskData.cancelToken,
      taskData.needParts,
    );
    if (!uploadInfo?.vid) {
      return null;
    }
    const coverUploadResult = await uploadVideoCover(cookie, item.cover, ticketId, ticket, userToken);
    if (!coverUploadResult?.url) {
      pubResult.code = errorCode.data_error;
      pubResult.msg = `封面上传失败:${item.cover?.pathOrUrl ?? ''}`;
      return null;
    }
    const coverUrl = coverUploadResult.url;
    const videoWidth = item.video.width ?? item.cover.width ?? 0;
    const videoHeight = item.video.height ?? item.cover.height ?? 0;
    const mpVideoInfo: WeiXinGongZhongHaoOperateMpVideoArgs = {
      title: item.title,
      appmsgid: '',
      coverUrl,
      coverUrl16_9: coverUrl,
      coverUrl1_1: coverUrl,
      coverUrlBack: coverUrl,
      cropCoordinate: '',
      // cropCoordinate: JSON.stringify([
      //   { x: 0, y: 6, x2: 544, y2: 312, w: 544, h: 306 },
      //   { x: 0, y: 0, x2: 312, y2: 312, w: 312, h: 312 },
      //   { x: 0, y: 6, x2: 544, y2: 312, w: 544, h: 306 },
      // ]),
      vid: uploadInfo.vid,
      remind_ori: item.isOriginal ?? 0,
      danmu_pub_type: 1,
      text_coordinate: null,
      applyori: item.isOriginal ?? 0,
      save: 1,
      fingerprint: Guid.NewGuid().toString(),
      token: userToken,
      lang: 'zh_CN',
      f: 'json',
      ajax: 1,
    } as never;
    let saveVideo = await operateWeiXinGongZhongHaoVideo(cookie, userToken, mpVideoInfo);
    if (!saveVideo?.appmsgid) {
      saveVideo = await operateWeiXinGongZhongHaoVideo(cookie, userToken, mpVideoInfo);
    }
    if (!saveVideo?.appmsgid) {
      pubResult.code = saveVideo?.base_resp?.ret ?? errorCode.data_error;
      pubResult.msg = `视频保存失败:${saveVideo?.base_resp?.err_msg ?? ''}`;
      return null;
    }
    const mpVideoInfoResult = {
      list: [
        {
          base_info: {
            digest: '',
            duration: item?.video?.duration ?? 0,
            duration_ms: (item?.video?.duration ?? 0) * 1000,
            height: item.video.height ?? 720,
            is_from_api: false,
            is_from_app: false,
            is_mp_video: true,
            is_own_vid: true,
            need_vidsn: true,
            ori_status: item.isOriginal ?? 0,
            status: 7,
            title: item.title,
            upload_time: Date.now() / 1000,
            width: item.video.width ?? 1080,
          },
          cover_info: {
            cover_url: coverUrl,
            cover_url_16_9: coverUrl,
            cover_url_1_1: coverUrl,
            cover_url_back: coverUrl,
            crop_coordinate: '',
            text_coordinate: 'null',
          },
          option_info: {
            applyori: item.isOriginal ?? 0,
            can_import_to_finder: true,
            danmu_pub_type: 1,
            save: true,
            reprint_confirm: 0,
          },
          play_info: [],
          status_info: {
            is_appmsg_unauthorized: false,
            is_mp_video_check_fail: false,
            is_mp_video_checking: false,
            is_mp_video_delete: false,
            is_mp_video_forbid: false,
            is_mp_video_transing: false,
            is_mp_video_waiting: false,
            mp_video_forbid_reason: 0,
            mp_video_overseas_limit: 0,
          },
          task_info: { reason: 0, status: 1 },
          vid: uploadInfo.vid,
        },
      ],
    };
    contentList.push({
      title: item.title,
      desc: item.desc ?? '',
      content: '',
      coverUrl,
      coverUrl16_9: coverUrl,
      coverUrl1_1: coverUrl,
      coverUrlBack: coverUrl,
      cropList: buildVideoCropList(),
      videoId: uploadInfo.vid,
      mpVideoInfo: JSON.stringify(mpVideoInfoResult),
      duration: item.video.duration,
      width: videoWidth,
      height: videoHeight,
      claimSourceType: item.contentSource ?? 0,
      disableRecommend: item.disableRecommend ?? 0,
      isOriginal: item.isOriginal ?? 0,
      needOpenComment: item.needOpenComment ?? 1,
      needOpenReply: item.needOpenReply ?? 3,
      openFansMsg: item.openFansMsg ?? 0,
      import_to_finder: item.syncToFinder ?? 0,
      shareVideoId: uploadInfo.vid ?? '',
    });
  }

  const postData = createWeiXinGongZhongHaoVideoFormData({ contentList }, userToken, taskData.draftId);

  return { postData };
};

export const publishWeiXinGongZhongHaoVideo = async (
  cookie: string,
  taskData: WeiXinGongZhongHaoVideoTaskInput,
  ticketId: string,
  ticket: string,
  userToken: number,
  userId: string,
  eventCallback: EventEmitter,
): Promise<WeixinPublishResultOutput> => {
  logger.info(`微信公众号视频发布 ${taskData.taskId}`);
  const pubResult: WeixinPublishResultOutput = {
    code: 0,
    msg: 'ok',
    taskId: taskData.taskId,
  };

  try {
    SetProgressEvent(eventCallback, 1, '准备上传视频', taskData.taskId);
    SetProgressNewEvent(eventCallback, publishStatusEnum.uploading, '开始发布', taskData.taskId);
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (await checkQrcodeOpen(cookie, userToken.toString())) {
      pubResult.code = -1;
      pubResult.msg = '发布失败，账号开启了群发保护，请关闭后再试。';
      return pubResult;
    }

    let webProxy: HttpsProxyAgent<string> | object | undefined = undefined;
    if (taskData.proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(taskData.proxy);
    }

    taskData.cancelToken?.throwIfCancelled(privateKey);
    const buildResult = await buildWeiXinGongZhongHaoVideoPostData(
      cookie,
      taskData,
      ticketId,
      ticket,
      userToken,
      pubResult,
      eventCallback,
    );
    if (!buildResult) {
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult?.msg ? pubResult.msg : '创建视频草稿失败',
        taskData.taskId,
      );
      return pubResult;
    }

    const isUpdate = Boolean(taskData.draftId);
    const draftResult = await saveWeiXinGongZhongHaoVideoDraft(
      cookie,
      userToken,
      buildResult.postData,
      isUpdate,
      buildResult.draftId,
    );
    taskData.cancelToken?.throwIfCancelled(privateKey);
    if (!draftResult?.appMsgId) {
      pubResult.code = draftResult?.base_resp?.ret ?? -1;
      pubResult.msg = `视频保存失败:${draftResult.base_resp?.err_msg ?? ''}`;
      return pubResult;
    }

    if (taskData.pubType === 0) {
      pubResult.code = 0;
      pubResult.publishId = `${draftResult.appMsgId}_${userId}`;
      return pubResult;
    }

    let pubReq = '';
    const pubCode = '';
    if (taskData.notifySubscribers == 0) {
      const publicResult = await createPublicMsg(cookie, draftResult.appMsgId, userToken);
      if (publicResult) {
        pubResult.code = -1;
        pubResult.msg = publicResult;
        return pubResult;
      }
    } else {
      const sendResult = await createSendMsg(cookie, draftResult.appMsgId, userToken);
      if (sendResult && !sendResult.startsWith('req_')) {
        pubResult.code = -1;
        pubResult.msg = sendResult;
        return pubResult;
      }
      pubReq = sendResult.substring(4);
    }

    taskData.cancelToken?.throwIfCancelled(privateKey);
    const pushTaskData: WeixinMsgTaskInput = {
      taskId: taskData.taskId,
      pubType: taskData.pubType,
      sex: (taskData.sex ?? 0) as 0 | 1 | 2,
      groupId: taskData.groupId,
      notifySubscribers: (taskData.notifySubscribers ?? 0) as 0 | 1,
      country: taskData.country,
      province: taskData.province,
      city: taskData.city,
      draftId: draftResult.appMsgId?.toString(),
      publishTime: taskData.publishTime ? parseInt(taskData.publishTime.toFixed(0)) : undefined,
      contentList: taskData.contentList.map((item) => ({
        title: item.title,
        desc: item.desc ?? '',
        needOpenComment: (item.needOpenComment ?? 1) as never,
        needOpenReply: (item.needOpenReply ?? 3) as never,
        cover: item.cover,
        content: '',
        disableRecommend: (item.disableRecommend ?? 0) as never,
        isOriginal: item.isOriginal ?? 0,
        openFansMsg: item.openFansMsg ?? 0,
        contentSource: item.contentSource ?? 0,
      })) as [],
      cancelToken: taskData.cancelToken,
      proxy: taskData.proxy,
    };

    const postData = buildPushData(
      pushTaskData,
      draftResult.appMsgId,
      userToken,
      pubReq,
      pubCode,
      taskData.notifySubscribers == 0,
    );
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    taskData.cancelToken?.disable(privateKey);
    let publishResult = await pushMsgResponse(cookie, postData, userToken,draftResult.appMsgId,taskData.notifySubscribers,!!taskData.publishTime, webProxy);
    if (publishResult?.base_resp?.ret != 0) {
      await Task.Delay(5000);
      publishResult = await pushMsgResponse(cookie, postData, userToken,draftResult.appMsgId,taskData.notifySubscribers,!!taskData.publishTime, webProxy);
    }

    pubResult.code = publishResult?.base_resp?.ret ?? errorCode.request_error;
    pubResult.msg = publishResult?.base_resp?.err_msg ?? '';
    pubResult.publishId = `${draftResult.appMsgId}_${userId}`;
    if (pubResult.code == 0 && pubResult.publishId) {
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      pubResult.msg = `发布失败${pubResult.msg}`;
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
      logger.error(`微信公众号视频发布失败:${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(publishResult)}`);
    }

    return pubResult;
  } catch (e) {
    SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
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
    logger.error(`微信公众号视频发布异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  }

  return pubResult;
};
