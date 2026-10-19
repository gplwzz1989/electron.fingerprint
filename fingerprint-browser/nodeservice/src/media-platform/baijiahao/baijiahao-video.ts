import { BaijiahaoTopicItem } from './baijiahao-topic.service';
import { BaijiahaoLocationItem } from './baijiahao-location.service';
import { BaijiahaoPublishResultOutput, CoverImagesMapResponse, CoverImagesResponse } from './baijiahao-article';
import { EventEmitter } from 'events';
import fs from 'fs';
import { errorCode } from '../../media-platform/errorCode';
import {
  GetMD5ByPathLike,
  htmlDecode,
  logger,
  publishStatusEnum,
  readImageData,
  SetProgressEvent,
  SetProgressNewEvent,
  sortQueryString,
  stepWaitTime,
  Task,
  UploadEmitGate,
} from '../../utils';
import {
  getUploadArgsResponse,
  publish,
  uploadCompleteResponse,
  UploadCompleteResponse,
  uploadVideoPart,
  UploadVideoPartResponse,
} from './baijiahao-video.service';
import path from 'path';
import { ImageInfo, ListItemInfo } from '../../media-platform/baseModel';
import { getCoordRcmdAsync, getCuttingPicAsync, getImgFromUrl, uploadImageBinary } from './baijiahao-article.service';
import { AxiosError } from 'axios';
import { getBaijiahaoUserInfoAsync } from './baijiahao-user.service';
import { getBaijiahaoBaseToken, getBaijiahaoTopicList } from './baijiahao-common';
import { CancelToken, privateKey } from '../../utils/CancelToken';
import { HtmlDocument } from '../../htmlAgilityPack';
import { createAppProxyAgent, createKuaiProxyAgent, KuaiDaiLiProxy } from '../webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';

const getBaijiahaoVideoPublishType = (width?: number, height?: number): 'video' | 'ugc_video' => {
  return width && height && width > height ? 'video' : 'ugc_video';
};

/**
 * 视频上传完整过程
 * @param taskData 任务数据
 * @param pubResult 发布结果对象
 * @param eventCallback 回调事件对象
 * @param appId 用户id
 * @param tokenStr
 * @param maxThread 最大并发上传数
 * @param cookie
 */
export const uploadVideo = async (
  taskData: BaijiahaoVideoTaskInput,
  pubResult: BaijiahaoPublishResultOutput,
  eventCallback: EventEmitter,
  appId: number,
  tokenStr: string,
  maxThread: number,
  cookie: string,
): Promise<UploadCompleteResponse | null | undefined> => {
  let fileHandle: fs.promises.FileHandle | null = null;
  try {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // 获取文件信息
    const fileStat = await fs.promises.stat(taskData.video.localPath);
    fileHandle = await fs.promises.open(taskData.video.localPath, 'r');
    const videoMd5 = await GetMD5ByPathLike(taskData.video.localPath);
    const fileName = path.basename(taskData.video.localPath);
    const videoLength = fileStat.size;

    // 百家号上传接口的类型必须与视频方向一致：竖版使用 tiny，横版使用 short。
    const uploadVideoType: 'short' | 'tiny' =
      getBaijiahaoVideoPublishType(taskData.video.width, taskData.video.height) === 'ugc_video' ? 'tiny' : 'short';

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // 获取上传参数
    let uploadVideoArgs = await getUploadArgsResponse(cookie, videoMd5, appId, tokenStr, uploadVideoType);
    if (!uploadVideoArgs?.upload_key) {
      uploadVideoArgs = await getUploadArgsResponse(cookie, videoMd5, appId, tokenStr, uploadVideoType);
    }
    if (!uploadVideoArgs?.upload_key) {
      // console.debug('获取上传参数失败', taskData.taskId, uploadVideoArgs);

      pubResult.code = uploadVideoArgs?.error_code ?? uploadVideoArgs.errno ?? errorCode.data_error;
      pubResult.msg = '获取上传参数失败:' + (uploadVideoArgs.error_msg ?? uploadVideoArgs?.errmsg ?? '');

      return null;
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // 开始读取并上传文件
    let readIndex = 0;

    // 分片大小
    const blockSize = 2097152;

    // 总片数
    const totalPartNums = Math.ceil(videoLength / blockSize);

    // 并行上传
    const tasks: Array<Promise<UploadVideoPartResponse>> = [];

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
      0,
      taskData.needParts === true,
    );

    //SetProgressEvent(eventCallback, 10, '视频上传中', taskData.taskId);
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
          //onPartUploaded();
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
          partNum++;

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
        onPartUploaded();
      }
    }

    //SetProgressEvent(eventCallback, 81, '视频上传完成', taskData.taskId);
    SetProgressNewEvent(
      eventCallback,
      publishStatusEnum.uploading,
      '视频上传中',
      taskData.taskId,
      totalPartNums,
      totalPartNums,
      taskData.needParts === true,
    );

    //SetProgressEvent(eventCallback, 82, '上传完成校验中', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // 检查视频上传是否成功
    let checkResult = await uploadCompleteResponse(
      cookie,
      appId,
      tokenStr,
      uploadVideoArgs.upload_key,
      totalPartNums,
      fileName,
      videoLength,
      uploadVideoType,
    );
    if (!checkResult?.bos_url) {
      checkResult = await uploadCompleteResponse(
        cookie,
        appId,
        tokenStr,
        uploadVideoArgs.upload_key,
        totalPartNums,
        fileName,
        videoLength,
        uploadVideoType,
      );
    }
    if (!checkResult?.bos_url) {
      //console.debug('视频上传校验失败', taskData.taskId, uploadVideoArgs, checkResult);

      pubResult.code = checkResult.error_code ?? checkResult.errno ?? errorCode.data_error;
      pubResult.msg = '上传校验失败:' + (checkResult.error_msg ?? checkResult.errmsg ?? '');

      return null;
    }

    //SetProgressEvent(eventCallback, 85, '获取上传完成视频信息', taskData.taskId);

    pubResult.code = 0;
    pubResult.msg = '';
    checkResult.uploadKey = uploadVideoArgs.upload_key;
    return checkResult;
    // endregion
  } catch (e) {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    logger.error(`百家号横版视频上传失败,${taskData.taskId},${(e as Error)?.message}`);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = '视频上传失败';
    return null;
  } finally {
    fileHandle?.close();
  }
};

/**
 * 上传横板封面
 * @param cookie
 * @param taskId
 * @param appId
 * @param coverInfo 封面
 * @param pubResult
 */
export const uploadCover = async (
  cookie: string,
  taskId: string,
  appId: number,
  coverInfo: ImageInfo,
  pubResult: BaijiahaoPublishResultOutput,
): Promise<UploadedCoverInfo | null> => {
  const resultJson: {
    bos_url?: string;
    width?: number;
    height?: number;
    mime?: string;
    message?: string;
  } = {};
  const coverImagesList: Array<CoverImagesResponse> = [];
  const coverImagesMapList: Array<CoverImagesMapResponse> = [];

  //先在线转
  if (coverInfo.pathOrUrl.toLowerCase().startsWith('http')) {
    const uploadImageByUrlResult = await getImgFromUrl(cookie, coverInfo.pathOrUrl, 'videoV2');
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
    const imgData = await readImageData(coverInfo.pathOrUrl, 'jpeg');
    if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
      console.error(taskId, `图片下载失败-${imgData.status}-${coverInfo.pathOrUrl}`);
      pubResult.code = errorCode.data_error;
      pubResult.msg = `图片下载失败-${imgData.status}-${coverInfo.pathOrUrl}`;
      return null;
    }
    const binaryResult = await uploadImageBinary(cookie, appId, imgData.data, 'news', imgData.ext);

    if (binaryResult?.ret?.bos_url) {
      resultJson['bos_url'] = binaryResult?.ret?.bos_url;
      resultJson['mime'] = binaryResult?.ret?.mime;
      resultJson['message'] = binaryResult?.error_msg;
    }
  }

  if (!resultJson?.bos_url) {
    console.error(taskId, `图片上传失败-${resultJson?.message}-${coverInfo.pathOrUrl}`);
    pubResult.code = errorCode.data_error;
    pubResult.msg = (resultJson.message ?? '封面上传失败') + coverInfo.pathOrUrl;
    pubResult.errorInfo = `图片上传失败-${resultJson?.message}-${coverInfo.pathOrUrl}`;
    return null;
  }

  const imageUrl = resultJson?.bos_url;

  const coordResult = await getCoordRcmdAsync(
    cookie,
    resultJson?.width ?? coverInfo?.width ?? 4096,
    resultJson?.height ?? coverInfo?.height ?? 4096,
    imageUrl,
    'videoV2',
    'video',
  );

  const cuttingResponse = await getCuttingPicAsync(
    cookie,
    coordResult?.data?.x ?? 0,
    coordResult?.data?.y ?? 0,
    resultJson?.width ?? coverInfo?.width ?? 4096,
    resultJson?.height ?? coverInfo?.height ?? 4096,
    imageUrl,
    'videoV2',
    'video',
  );

  coverImagesList.push({
    src: cuttingResponse?.data?.src ?? resultJson?.bos_url,
    cropData: {
      x: coordResult?.data?.x ?? 0,
      y: coordResult?.data?.y ?? 0,
      width: coordResult?.data?.w ?? coverInfo?.width ?? 4096,
      height: coordResult?.data?.h ?? coverInfo?.height ?? 4096,
    },
    machine_chooseimg: 0,
    isLegal: 1,
  });

  coverImagesMapList.push({
    src: cuttingResponse?.data?.origin_src ?? cuttingResponse?.data?.src ?? resultJson?.bos_url,
    origin_src: cuttingResponse?.data?.src ?? resultJson?.bos_url,
  });
  pubResult.code = 0;
  pubResult.msg = '';
  return { coverImages: coverImagesList, coverImagesMap: coverImagesMapList };
};

export interface UploadedCoverInfo {
  coverImages: Array<CoverImagesResponse>;
  coverImagesMap: Array<CoverImagesMapResponse>;
}

/**
 *  抖音发布视频
 * @param cookie cookie字符串 eg: cookie1=12;cookie2=345
 * @param taskData 发布入参
 * @param eventCallback 进度回调
 * @param appId
 * @param tokenStr
 * @param retryTimes 单个步骤失败后重试次数，默认3
 * @param maxThread 视频并发上传数，默认3
 */
export const publishBaijiahaoVideo = async (
  cookie: string,
  taskData: BaijiahaoVideoTaskInput,
  eventCallback: EventEmitter,
  appId: number,
  tokenStr: string,
  maxThread: number = 3,
  retryTimes: number = 3,
): Promise<BaijiahaoPublishResultOutput> => {
  logger.error(`百家横版视频发布 ${taskData.taskId} ${appId}`);

  const pubResult: BaijiahaoPublishResultOutput = {
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
      webProxy = taskData.isAppContent
        ? createAppProxyAgent(taskData.proxy)
        : createKuaiProxyAgent(taskData.proxy);
    }
    const videoType = getBaijiahaoVideoPublishType(taskData.video.width, taskData.video.height);
    // if (!taskData.video.width || !taskData.video.height) {
    //   pubResult.code = errorCode.data_error;
    //   pubResult.msg = '视频宽高不能为空';
    //   SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, pubResult.msg ?? '上传失败', taskData.taskId);
    //   return pubResult;
    // }
    // if (taskData.video.width < taskData.video.height) {
    //   pubResult.code = errorCode.data_error;
    //   pubResult.msg = '竖版视频，请使用竖版接口发布';
    //   SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, pubResult.msg ?? '上传失败', taskData.taskId);
    //   return pubResult;
    // }

    if (!fs.existsSync(taskData.video.localPath?.toString() ?? '')) {
      logger.error(`视频文件不存在 ${taskData.taskId} ${taskData.video.localPath}`);
      pubResult.code = errorCode.io_error;
      pubResult.msg = '视频文件不存在:' + taskData.video.localPath;
      SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, pubResult.msg ?? '上传失败', taskData.taskId);
      return pubResult;
    }
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //没有传入时，去获取
    if (!appId) {
      const userInfo = await getBaijiahaoUserInfoAsync(cookie);
      appId = userInfo?.data?.user?.app_id;
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //获取token
    if (!tokenStr) {
      const tokenResult = await getBaijiahaoBaseToken(cookie);
      tokenStr = tokenResult.token;
    }
    SetProgressEvent(eventCallback, 1, '准备上传中', taskData.taskId);

    // region 准备发布上传前置数据

    SetProgressEvent(eventCallback, 3, '正在获取上传参数', taskData.taskId);

    // 获取上传认证参数
    // endregion

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // region 视频上传
    let uploadVideoInfo = await uploadVideo(taskData, pubResult, eventCallback, appId, tokenStr, maxThread, cookie);
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      if (!uploadVideoInfo || !uploadVideoInfo?.uploadKey) {
        if (pubResult?.errorInfo?.includes('登录')) {
          SetProgressNewEvent(
            eventCallback,
            publishStatusEnum.uploadFail,
            pubResult.msg ?? pubResult.errorInfo ?? '上传失败',
            taskData.taskId,
          );
          return pubResult;
        }
        if (i < retryTimes - 1) {
          SetProgressEvent(eventCallback, 4, '上传失败,重试中', taskData.taskId);
          uploadVideoInfo = await uploadVideo(taskData, pubResult, eventCallback, appId, tokenStr, maxThread, cookie);
          continue;
        }
        logger.error(`视频上传失败 ${taskData.taskId} ${cookie} ${pubResult.msg} ${JSON.stringify(uploadVideoInfo)}`);
        SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, pubResult.msg ?? '上传失败', taskData.taskId);
        return pubResult;
      } else {
        break;
      }
    }
    if (!uploadVideoInfo) {
      pubResult.code = -2;
      pubResult.msg = '视频上传失败，请稍后重试重试';
      logger.error(`视频上传失败 ${taskData.taskId} ${cookie} ${JSON.stringify(uploadVideoInfo)}`);
      SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, pubResult.msg ?? '上传失败', taskData.taskId);
      return pubResult;
    }
    // endregion

    // region 封面上传

    SetProgressEvent(eventCallback, 90, '封面上传中', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    let uploadedCoverInfo = await uploadCover(cookie, taskData.taskId, appId, taskData.cover, pubResult);
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      if (!uploadedCoverInfo?.coverImages || !(uploadedCoverInfo?.coverImages?.length > 0)) {
        if (i < retryTimes - 1) {
          await Task.Delay(stepWaitTime);
          uploadedCoverInfo = await uploadCover(cookie, taskData.taskId, appId, taskData.cover, pubResult);
          continue;
        }
        logger.error(
          `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${JSON.stringify(
            pubResult,
          )} ${JSON.stringify(uploadedCoverInfo)}`,
        );
        pubResult.code = pubResult?.code ? pubResult.code : errorCode.data_error;
        SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, pubResult.msg ?? '上传失败', taskData.taskId);
        return pubResult;
      }
      break;
    }

    if (uploadedCoverInfo == null) {
      logger.error(
        `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${JSON.stringify(
          pubResult,
        )} ${JSON.stringify(uploadedCoverInfo)}`,
      );
      SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, pubResult.msg ?? '上传失败', taskData.taskId);
      return pubResult;
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //竖版封面
    let uploadedVerticalCoverInfo: UploadedCoverInfo | null = null;
    if (taskData.verticalCover?.pathOrUrl) {
      uploadedVerticalCoverInfo = await uploadCover(cookie, taskData.taskId, appId, taskData.verticalCover, pubResult);
      for (let i = 0; i < retryTimes; i++) {
        taskData.cancelToken?.throwIfCancelled(privateKey);
        if (!uploadedVerticalCoverInfo?.coverImages || !(uploadedVerticalCoverInfo?.coverImages?.length > 0)) {
          if (i < retryTimes - 1) {
            await Task.Delay(stepWaitTime);
            uploadedVerticalCoverInfo = await uploadCover(cookie, taskData.taskId, appId, taskData.verticalCover, pubResult);
            continue;
          }
          logger.error(
            `竖版封面上传失败 ${taskData.taskId} ${cookie} ${taskData.verticalCover.pathOrUrl} ${JSON.stringify(
              pubResult,
            )} ${JSON.stringify(uploadedVerticalCoverInfo)}`,
          );
          pubResult.code = pubResult?.code ? pubResult.code : errorCode.data_error;
          SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, pubResult.msg ?? '上传失败', taskData.taskId);
          return pubResult;
        }
        break;
      }
    }
    if (taskData.verticalCover?.pathOrUrl && uploadedVerticalCoverInfo == null) {
      logger.error(
        `竖版封面上传失败 ${taskData.taskId} ${cookie} ${taskData.verticalCover.pathOrUrl} ${JSON.stringify(
          pubResult,
        )} ${JSON.stringify(uploadedVerticalCoverInfo)}`,
      );
      SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, pubResult.msg ?? '上传失败', taskData.taskId);
      return pubResult;
    }

    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);
    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    // endregion

    // region 组装并推送数据

    //过滤多余标签
    taskData.tags = taskData.tags?.slice(0, 5);

    // 组装发布数据
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    const postData = await buildPostData(
      taskData,
      uploadedCoverInfo,
      uploadedVerticalCoverInfo,
      uploadVideoInfo,
      path.basename(taskData.video.localPath),
      taskData.draftId ?? '',
      cookie,
      videoType,
    );
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //推送数据
    // console.debug('百家号横版推送数据', taskData.taskId, cookie, postData);
    //不可取消
    taskData.cancelToken?.disable(privateKey);

    const publishResult = await publish(
      cookie,
      postData,
      tokenStr,
      taskData.pubType == 0 ? 'save' : 'publish',
      webProxy,
      videoType,
    );
    // console.debug('百家号横版推送返回数据', taskData.taskId, publishResult);

    pubResult.code = publishResult.errno ?? errorCode.data_error;
    pubResult.msg = publishResult.errmsg ?? '';
    pubResult.publishId =
      publishResult?.ret?.id ?? publishResult.ret?.article_id ?? publishResult?.ret?.nid ?? publishResult?.ret?.vid;

    // console.debug('百家横版视频发布完成', taskData.taskId, taskData, uploadedCoverInfo, uploadVideoInfo, pubResult);

    if (pubResult.publishId) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushFail, pubResult.msg ?? '推送失败', taskData.taskId);
      logger.error(`百家号横版视频发布失败 ${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(publishResult)}`);
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
    }

    return pubResult;
    // endregion
  } catch (e) {
    SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);

    // console.debug('发布失败:', taskData.taskId, appId, e?.toString(), taskData);

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
    if (pubResult.msg?.includes('标题最多50字') && taskData.desc?.includes('<p>')) {
      pubResult.msg = '描述最多50字';
    }
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushFail, pubResult.msg ?? '推送失败', taskData.taskId);
    logger.error(`百家号横版发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};

/**
 * 组装发布参数
 * @param taskData
 * @param coverInfo
 * @param verticalCoverUrl
 * @param videoInfoIn
 * @param fileName
 * @param draftId 草稿id，用于二次编辑更新草稿，备用
 * @param cookie
 * @param videoType
 */
const buildPostData = async (
  taskData: BaijiahaoVideoTaskInput,
  coverInfo: UploadedCoverInfo,
  verticalCoverInfo: UploadedCoverInfo | null,
  videoInfoIn: UploadCompleteResponse,
  fileName: string,
  draftId: string,
  cookie?: string,
  videoType?: 'video' | 'ugc_video',
): Promise<string> => {
  const argsList: Array<string> = [];
  const isUgcVideo = videoType === 'ugc_video';
  const isHtmlDesc = taskData.desc.includes('<p>');
  const videoDuration = taskData.video?.duration > 0 ? taskData.video.duration : 0;
  const videoSize = taskData.video?.size ?? Number(videoInfoIn.size ?? 0) ?? 0;
  const videoWidth = taskData.video?.width ?? 0;
  const videoHeight = taskData.video?.height ?? 0;

  argsList.push(`video_duration=${videoDuration}`);
  argsList.push(`type=${videoType ? videoType : 'video'}`);
  if (isUgcVideo) {
    argsList.push('loadComplete=true');
    argsList.push('video_pick_type=0');
    argsList.push('source_reprinted_allow=0&nryx_mount_list=&is_consultant_card=0');
    argsList.push(
      'image_edit_point=&ducut_info=&cover_source=screen&cover_source_tag_for_fe=video_cut&bjhmt=&aigc_rebuild=',
    );
    argsList.push(`publish_statement=${taskData.statementType ?? 1}&publish_statement_sub=${taskData.statementSubType ?? 0}`);
    argsList.push(`${encodeURIComponent('cover_image_source[wide_cover_image_source]')}=video_cut`);
    argsList.push(`${encodeURIComponent('cover_image_source[vertical_cover_image_source]')}=first_frame`);
    argsList.push('auto_mount_content=0&auto_mount_goods=0');
    argsList.push(`size=${videoSize}`);
    argsList.push(`width_in_pixel=${videoWidth}`);
    argsList.push(`height_in_pixel=${videoHeight}`);
  } else {
    argsList.push('usingImgFilter=false&source_reprinted_allow=0&nryx_mount_list=&is_consultant_card=');
    argsList.push('image_edit_point=&ducut_info=&cover_source=upload&bjhmt=&aigc_rebuild=');
    argsList.push(`publish_statement=${taskData.statementType ?? 1}&publish_statement_sub=${taskData.statementSubType ?? 0}`);
  }

  //提取并适配html格式的描述和话题
  let newDesc = taskData.desc;
  const topicsList = [];
  const buildManualTopic = (name: string): BaijiahaoTopicItem => ({
    category: '',
    guide: '',
    id: '-1',
    link: {
      scheme: '',
      url: '',
    },
    sv_small_images: {
      height: '',
      https: '',
      wide: '',
    },
    title: name,
  });
  //话题，兼容描述中嵌入话题和单独设置话题
  if (taskData.desc?.includes('<p') && taskData.desc?.includes('</p>')) {
    //从描述中解析话题出来
    const html = new HtmlDocument();
    html.LoadHtml(taskData.desc);

    const pList = html.DocumentNode.SelectNodes('//p');
    if (pList?.length > 0) {
      //话题
      const topics = html.DocumentNode.SelectNodes('//topic');
      if (topics?.length > 0) {
        for (const item of topics) {
          let topicStr = htmlDecode(item.getAttribute('raw') ?? '');
          let topText = '';
          if (!topicStr?.startsWith('{')) {
            topText = item.getAttribute('text') ?? '';
            if (!topText) {
              continue;
            }
            const topicName = topText.trim();
            const tmpTopc = await getBaijiahaoTopicList(cookie ?? '', topText, '');
            const firstTopic = tmpTopc?.dataList?.[0];
            if (firstTopic?.yixiaoerName?.trim() === topicName) {
              topicStr = JSON.stringify(firstTopic);
            } else {
              topicStr = JSON.stringify({
                yixiaoerId: '-1',
                yixiaoerName: topicName,
                raw: buildManualTopic(topicName),
              });
            }
          }
          if (topicStr?.startsWith('{')) {
            const top = JSON.parse(topicStr);
            topicsList.push(top as never);
            item.textContent = `#${top.yixiaoerName}#`;
          } else {
            //topicsList.push({ yixiaoerName: topText.trim(), yixiaoerId: '0' } as never);
            item.textContent = `#${topText?.trim()}#`;
          }
        }
      }

      //换行
      let newText = '';
      for (let pIndex = 0; pIndex < pList.length; pIndex++) {
        const pItem = pList[pIndex];
        newText = `${newText}${pItem.textContent}\n`;
      }

      newDesc = newText?.trim() ?? '';
    } else {
      //话题
      const topics = html.DocumentNode.SelectNodes('//topic');
      if (topics?.length > 0) {
        for (const item of topics) {
          let topicStr = htmlDecode(item.getAttribute('raw') ?? '');
          let topText = '';
          if (!topicStr?.startsWith('{')) {
            topText = item.getAttribute('text') ?? '';
            if (!topText) {
              continue;
            }
            const topicName = topText.trim();
            const tmpTopc = await getBaijiahaoTopicList(cookie ?? '', topText, '');
            const firstTopic = tmpTopc?.dataList?.[0];
            if (firstTopic?.yixiaoerName?.trim() === topicName) {
              topicStr = JSON.stringify(firstTopic);
            } else {
              topicStr = JSON.stringify({
                yixiaoerId: '-1',
                yixiaoerName: topicName,
                raw: buildManualTopic(topicName),
              });
            }
          }
          if (topicStr?.startsWith('{')) {
            const top = JSON.parse(topicStr);
            topicsList.push(top as never);
            item.textContent = `#${top.yixiaoerName}#`;
          } else {
            //topicsList.push({ yixiaoerName: topText.trim(), yixiaoerId: '0' } as never);
            item.textContent = `#${topText?.trim()}#`;
          }
        }
      }

      //换行
      let newText = '';
      for (let pIndex = 0; pIndex < pList.length; pIndex++) {
        const pItem = pList[pIndex];
        newText = `${newText}${pItem.textContent}\n`;
      }

      newDesc = newText ?? '';
    }
  }

  //视频信息
  const contentTitle = isHtmlDesc ? newDesc : taskData.title;
  const contentDesc = isHtmlDesc ? undefined : taskData.desc;
  const contentJo = isUgcVideo
    ? {
        title: contentTitle,
        mediaId: videoInfoIn.mediaId,
      }
    : {
        title: contentTitle,
        desc: contentDesc,
        mediaId: videoInfoIn.mediaId,
        videoName: fileName?.length > 2 ? fileName : `${taskData.title}.mp4`,
        local: 1,
      };
  const contentJa = [contentJo];

  argsList.push('pub_source_from=pc_faburukou');
  argsList.push(`content=${encodeURIComponent(JSON.stringify(contentJa))}`);
  //描述
  if (isHtmlDesc) {
    argsList.push(`title=${encodeURIComponent(newDesc)}`);
    if (topicsList?.length) {
      let i = 0;
      for (const item of topicsList) {
        const topInfo = (item as any)?.raw as BaijiahaoTopicItem;
        argsList.push(`${encodeURIComponent(`bjhtopic_infos[${i}][title]`)}=${encodeURIComponent(topInfo.title)}`);
        argsList.push(`${encodeURIComponent(`bjhtopic_infos[${i}][id]`)}=${topInfo.id}`);
        argsList.push(`${encodeURIComponent(`bjhtopic_infos[${i}][name]`)}=${encodeURIComponent(topInfo.title)}`);
        argsList.push(`${encodeURIComponent(`bjhtopic_ids[${i}]`)}=${topInfo.id}`);
        if (topInfo.id === '-1') {
          i++;
          continue;
        }
        argsList.push(`${encodeURIComponent(`bjhtopic_infos[${i}][guide]`)}=`);
        argsList.push(`${encodeURIComponent(`bjhtopic_infos[${i}][category]`)}=${topInfo.category}`);
        argsList.push(
          `${encodeURIComponent(`bjhtopic_infos[${i}][link][scheme]`)}=${encodeURIComponent(topInfo.link.scheme)}`,
        );
        argsList.push(
          `${encodeURIComponent(`bjhtopic_infos[${i}][link][url]`)}=${encodeURIComponent(topInfo.link.url)}`,
        );
        argsList.push(
          `${encodeURIComponent(`bjhtopic_infos[${i}][sv_small_images][height]`)}=${topInfo.sv_small_images.height}`,
        );
        argsList.push(
          `${encodeURIComponent(`bjhtopic_infos[${i}][sv_small_images][https]`)}=${encodeURIComponent(
            topInfo.sv_small_images?.https ?? '',
          )}`,
        );
        argsList.push(
          `${encodeURIComponent(`bjhtopic_infos[${i}][sv_small_images][wide]`)}=${topInfo.sv_small_images.wide}`,
        );
        argsList.push(`${encodeURIComponent(`bjhtopic_infos[${i}][read_num]`)}=100`);
        i++;
      }
    } else if (isUgcVideo) {
      argsList.push('bjhtopic_infos=&bjhtopic_ids=');
    }
  } else {
    argsList.push(`title=${encodeURIComponent(taskData.title)}`);
    argsList.push(`desc=${encodeURIComponent(contentDesc ?? '')}`);
    if (isUgcVideo) {
      argsList.push('bjhtopic_infos=&bjhtopic_ids=');
    }
  }

  const fingerPrinting = {
    s2l: null,
    s2game: null,
    bjh: { duration: videoDuration },
  };
  argsList.push(`bjh_video_finger_printing=${encodeURIComponent(JSON.stringify(fingerPrinting))}`);

  //绑定爱奇艺
  if (taskData?.bindIqiyi) {
    argsList.push('iqiyi_info%5Biqiyi_check%5D=true&iqiyi_info%5Bshow_bind_tips%5D=1');
  }
  ///标签
  const tags = taskData.tags ?? [];
  argsList.push(`tag=${encodeURIComponent(tags.join(','))}`);

  //地点
  if (taskData?.location?.uid) {
    const rawData = {
      addr: taskData?.location.addr,
      city: taskData?.location.city_name,
      poi_type: 'life',
      type: 0,
      city_id: taskData?.location.city_id,
      lng: 0,
      lat: 0,
      name: taskData?.location.name,
      pid: taskData?.location.street_id ?? taskData?.location.uid,
      tag: '',
    };
    const tags = [];
    if (taskData?.location?.cla?.length > 0) {
      for (const tag of taskData.location.cla) {
        tags.push(tag[1]);
      }
    }
    rawData.tag = tags.join(',');
    argsList.push(`position_lat_lng=${encodeURIComponent(JSON.stringify(rawData))}`);
  } else {
    argsList.push('position_lat_lng=%7B%7D');
  }
  //横版封面
  if (coverInfo.coverImages?.length > 0) {
    argsList.push(`cover_layout=${coverInfo.coverImages.length >= 3 ? 'three' : 'one'}`);
    if (isUgcVideo) {
      const ugcCoverImages = coverInfo.coverImages.map((item, index) => ({
        ...item,
        source: 'local',
        src: coverInfo.coverImagesMap?.[index]?.src ?? item.src,
        cropData: item.cropData ?? {},
        isLegal: 0,
        cover_source_tag: 'video_cut',
      }));
      argsList.push(`cover_images=${encodeURIComponent(JSON.stringify(ugcCoverImages))}`);
    } else {
      argsList.push(`cover_images=${encodeURIComponent(JSON.stringify(coverInfo.coverImages))}`);
    }
    argsList.push(`_cover_images_map=${encodeURIComponent(JSON.stringify(coverInfo.coverImagesMap))}`);
  } else {
    if (isUgcVideo) {
      argsList.push('cover_layout=');
      argsList.push('cover_images=');
    }
    argsList.push('_cover_images_map=');
  }

  //竖版封面
  const verticalCoverSrc = verticalCoverInfo?.coverImagesMap?.[0]?.src ?? '';
  const verticalCoverOriginal =
    verticalCoverInfo?.coverImagesMap?.[0]?.origin_src ??
    verticalCoverInfo?.coverImagesMap?.[0]?.src ??
    '';
  if (isUgcVideo) {
    if (verticalCoverSrc) {
      argsList.push(
        `vertical_cover_images=${encodeURIComponent(
          JSON.stringify([
            {
              content_original: verticalCoverOriginal,
              src: verticalCoverSrc,
              cropData: {},
              isLegal: 0,
              cover_source_tag: 'first_frame',
            },
          ]),
        )}`,
      );
    } else {
      argsList.push('vertical_cover_images=');
    }
  } else if (verticalCoverSrc) {
    argsList.push(`vertical_cover=${encodeURIComponent(verticalCoverSrc)}`);
  } else {
    argsList.push('vertical_cover=');
  }

  //是否原创
  argsList.push(`original_status=${taskData.original ? 2 : 0}`);
  if (taskData.original) {
    argsList.push('announce_id=0');
    if (taskData.original?.firstPub) {
      argsList.push('announce_info=' + encodeURIComponent(JSON.stringify({ first_publish: 1 })));
    } else {
      argsList.push(
        'announce_info=' +
          encodeURIComponent(
            JSON.stringify({
              first_publish: 1,
              tp_author: taskData.original.originalAuthorName,
              tp_url: taskData.original.originalUrl,
            }),
          ),
      );
    }
  }

  let activityIndex = 0;
  //自荐
  if (taskData.selfRecommend) {
    argsList.push(
      `activity_list%5B${activityIndex}%5D%5Bid%5D=1&activity_list%5B${activityIndex}%5D%5Bis_checked%5D=1`,
    );
    activityIndex++;
  }
  //标题美化
  if (taskData.titleBeautify) {
    argsList.push('isBeautify=true');
    argsList.push(
      `activity_list%5B${activityIndex}%5D%5Bid%5D=408&activity_list%5B${activityIndex}%5D%5Bis_checked%5D=1`,
    );
    activityIndex++;
  } else {
    argsList.push('isBeautify=false');
  }

  //aigc申明
  argsList.push(
    `activity_list%5B${activityIndex}%5D%5Bid%5D=aigc_bjh_status&activity_list%5B${activityIndex}%5D%5Bis_checked%5D=${
      taskData?.isAigc === true ? 1 : 0
    }`,
  );
  activityIndex++;

  //支持打赏
  if (taskData.reward) {
    argsList.push(
      `activity_list%5B${activityIndex}%5D%5Bid%5D=reward&activity_list%5B${activityIndex}%5D%5Bis_checked%5D=1`,
    );
    activityIndex++;
  }
  //征文活动
  const activityId = taskData.activityId?.toString();
  if (activityId && activityId != '0') {
    argsList.push(
      `activity_list%5B${activityIndex}%5D%5Bis_checked%5D=1&activity_list%5B${activityIndex}%5D%5Bid%5D=task_${activityId}`,
    );
    activityIndex++;
  }

  //分类
  if (taskData.categoryName) {
    argsList.push(`cate_user_cms%5B0%5D=${encodeURIComponent(taskData.categoryName)}`);
  }
  if (taskData.subCategoryName) {
    argsList.push(`cate_user_cms%5B1%5D=${encodeURIComponent(taskData.subCategoryName)}`);
  }

  //编辑草稿用，备用
  if (draftId) {
    argsList.push(`article_id=${draftId}`);
  }
  //定时发布增加
  const pubTime = taskData?.publishTime?.toString()?.substring(0, 10);
  argsList.push('fe_from=BJH_CMS_PC');
  if (isUgcVideo && pubTime) {
    argsList.push(`clue=&timer_time=${pubTime ?? ''}`);
  } else if (pubTime) {
    argsList.push(`clue=1&timer_time=${pubTime}`);
  }

  //话题
  if (taskData.topic?.title) {
    const topicJo = taskData.topic;
    argsList.push(
      `bjhtopic_id=${topicJo.id}&bjhtopic_info%5B0%5D%5Bid%5D=${
        topicJo.id
      }&bjhtopic_info%5B0%5D%5Btitle%5D=${encodeURIComponent(topicJo.title ?? '')}` +
        `&bjhtopic_info%5B0%5D%5Bguide%5D=${encodeURIComponent(topicJo.guide ?? '')}` +
        `&bjhtopic_info%5B0%5D%5Bcover%5D=${encodeURIComponent(topicJo.link?.url ?? '')}`,
    );
  } else if (!topicsList?.length) {
    argsList.push('bjhtopic_info=&bjhtopic_id=');
  }

  //合集
  if (taskData.collection?.yixiaoerId) {
    argsList.push(`video_set_id=${taskData.collection.yixiaoerId}`);
  }

  return sortQueryString(argsList, true);
};

/**
 * 百家横版视频发布入参
 */
export interface BaijiahaoVideoTaskInput {
  cancelToken?: CancelToken;
  /**
   * 是否来自 App 内容发布任务；Web 任务不启用 App 专用兼容逻辑。
   */
  isAppContent?: boolean;
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
   * 竖版封面
   */
  verticalCover?: {
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
   * 话题
   */
  topic?: BaijiahaoTopicItem;

  /**
   * 描述
   */
  desc: string;

  /**
   *绑定爱奇艺
   */
  bindIqiyi?: boolean;

  /**
   * 标签
   */
  tags?: Array<string>;

  /**
   * 地点/位置
   */
  location?: BaijiahaoLocationItem;

  /**
   * 是否原创
   */
  original?: {
    /**
     * 是否首发
     */
    firstPub: boolean;
    /**
     * 当非首发时，首发所属的作者昵称
     */
    originalAuthorName?: string;
    /**
     * 非首发时，首发作品的公开访问链接
     */
    originalUrl?: string;
  };

  /**
   * 自荐
   */
  selfRecommend?: boolean;

  /**
   * 标题美化
   */
  titleBeautify?: boolean;

  /**
   *AI创作申明
   */
  isAigc?: boolean;

  /**
   * 视频主申明
   */
  statementType?: number;

  /**
   * 视频副申明
   */
  statementSubType?: number;

  /**
   * 支持打赏
   */
  reward?: boolean;

  /**
   * 正文活动id
   */
  activityId?: string;

  /**
   * 一级分类
   */
  categoryName?: string;
  /**
   * 二级分类
   */
  subCategoryName?: string;

  /**
   * 草稿id
   */
  draftId?: string;

  /**
   * 定时发布10位时间戳
   */
  publishTime?: number;

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;

  /**
   * 是否需要分片上传进度
   */
  needParts?: boolean;

  /**
   * 合集
   */
  collection?: ListItemInfo;
}
