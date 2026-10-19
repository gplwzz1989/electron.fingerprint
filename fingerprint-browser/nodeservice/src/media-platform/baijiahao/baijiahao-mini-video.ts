//竖版视频
import { BaijiahaoLocationItem } from './baijiahao-location.service';
import { BaijiahaoTopicItem } from './baijiahao-topic.service';
import {
  getUploadArgsResponse,
  publish,
  uploadCompleteResponse,
  UploadCompleteResponse,
  uploadVideoPart,
  UploadVideoPartResponse,
} from './baijiahao-video.service';
import { EventEmitter } from 'events';
import fs from 'fs';
import {
  GetMD5ByPathLike,
  logger,
  publishStatusEnum,
  SetProgressEvent,
  SetProgressNewEvent,
  sortQueryString,
  stepWaitTime,
  Task,
  UploadEmitGate,
} from '../../utils';
import path from 'path';
import { errorCode } from '../../media-platform/errorCode';
import { BaijiahaoPublishResultOutput } from './baijiahao-article';
import { getBaijiahaoUserInfoAsync } from './baijiahao-user.service';
import { getBaijiahaoBaseToken } from './baijiahao-common';
import { AxiosError } from 'axios';
import { uploadCover, UploadedCoverInfo } from './baijiahao-video';
import { CancelToken, privateKey } from '../../utils/CancelToken';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '../webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { ListItemInfo } from '@/media-platform';

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
  taskData: BaijiahaoMiniVideoTaskInput,
  pubResult: BaijiahaoPublishResultOutput,
  eventCallback: EventEmitter,
  appId: number,
  tokenStr: string,
  maxThread: number,
  cookie: string,
): Promise<UploadCompleteResponse | null | undefined> => {
  let fileHandle: fs.promises.FileHandle | null = null;
  try {
    // 获取文件信息
    const fileStat = await fs.promises.stat(taskData.video.localPath);
    fileHandle = await fs.promises.open(taskData.video.localPath, 'r');
    const videoMd5 = await GetMD5ByPathLike(taskData.video.localPath);
    const fileName = path.basename(taskData.video.localPath);
    const videoLength = fileStat.size;

    // 获取上传参数
    let uploadVideoArgs = await getUploadArgsResponse(cookie, videoMd5, appId, tokenStr, 'tiny');
    if (!uploadVideoArgs?.upload_key) {
      uploadVideoArgs = await getUploadArgsResponse(cookie, videoMd5, appId, tokenStr, 'tiny');
    }
    if (!uploadVideoArgs?.upload_key) {
      // console.debug('获取上传参数失败', taskData.taskId, uploadVideoArgs);

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

    // 检查视频上传是否成功
    let checkResult = await uploadCompleteResponse(
      cookie,
      appId,
      tokenStr,
      uploadVideoArgs.upload_key,
      totalPartNums,
      fileName,
      videoLength,
      'tiny',
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
        'tiny',
      );
    }
    if (!checkResult?.bos_url) {
      // console.debug('视频上传校验失败', taskData.taskId, uploadVideoArgs, checkResult);

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
    logger.error(`百家号横版视频上传失败,${taskData.taskId},${(e as Error)?.message}`);
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
 * @param appId
 * @param tokenStr
 * @param retryTimes 单个步骤失败后重试次数，默认3
 * @param maxThread 视频并发上传数，默认3
 */
export const publishBaijiahaoMiniVideo = async (
  cookie: string,
  taskData: BaijiahaoMiniVideoTaskInput,
  eventCallback: EventEmitter,
  appId: number,
  tokenStr: string,
  maxThread: number = 3,
  retryTimes: number = 3,
): Promise<BaijiahaoPublishResultOutput> => {
  logger.info(`百家竖版发布 ${taskData.taskId} ${appId}`);

  const pubResult: BaijiahaoPublishResultOutput = {
    code: 0,
    msg: '',
    taskId: taskData.taskId,
  };
  try {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploading, '失败发布', taskData.taskId);
    let webProxy: HttpsProxyAgent<string> | object | undefined = undefined;
    if (taskData.proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(taskData.proxy);
    }
    if (!taskData.video.width || !taskData.video.height) {
      pubResult.code = errorCode.data_error;
      pubResult.msg = '视频宽高不能为空';
      SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, pubResult.msg ?? '上传失败', taskData.taskId);
      return pubResult;
    }
    if (taskData.video.width >= taskData.video.height) {
      pubResult.code = errorCode.data_error;
      pubResult.msg = '横版视频，请使用横版接口发布';
      SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, pubResult.msg ?? '上传失败', taskData.taskId);
      return pubResult;
    }

    if (!fs.existsSync(taskData.video.localPath?.toString() ?? '')) {
      logger.error(`视频文件不存在 ${taskData.taskId} ${taskData.video?.localPath}`);
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
          logger.error(`视频上传失败 ${taskData.taskId} ${cookie} ${JSON.stringify(uploadVideoInfo)} ${pubResult}`);
          SetProgressNewEvent(
            eventCallback,
            publishStatusEnum.uploadFail,
            pubResult.msg ?? '上传失败',
            taskData.taskId,
          );
          return pubResult;
        }
        if (i < retryTimes - 1) {
          SetProgressEvent(eventCallback, 4, '上传失败,重试中', taskData.taskId);
          uploadVideoInfo = await uploadVideo(taskData, pubResult, eventCallback, appId, tokenStr, maxThread, cookie);
          continue;
        }
        logger.error(
          `视频上传失败 ${taskData.taskId} ${cookie} ${JSON.stringify(uploadVideoInfo)} ${JSON.stringify(pubResult)}`,
        );
        SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, pubResult.msg ?? '上传失败', taskData.taskId);
        return pubResult;
      } else {
        break;
      }
    }
    if (!uploadVideoInfo) {
      pubResult.code = -2;
      pubResult.msg = '视频上传失败，请稍后重试重试';
      logger.error(
        `视频上传失败 ${taskData.taskId} ${cookie} ${JSON.stringify(uploadVideoInfo)} ${JSON.stringify(pubResult)}`,
      );
      SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, pubResult.msg ?? '上传失败', taskData.taskId);
      return pubResult;
    }
    // endregion

    // region 封面上传

    SetProgressEvent(eventCallback, 90, '封面上传中', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //横板封面
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
          `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover?.pathOrUrl} ${JSON.stringify(
            uploadedCoverInfo,
          )} ${JSON.stringify(pubResult)}`,
        );
        pubResult.code = pubResult?.code ? pubResult.code : errorCode.data_error;
        SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, pubResult.msg ?? '上传失败', taskData.taskId);
        return pubResult;
      }
      break;
    }

    if (uploadedCoverInfo == null) {
      logger.error(
        `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover?.pathOrUrl} ${JSON.stringify(
          uploadedCoverInfo,
        )} ${JSON.stringify(pubResult)}`,
      );
      SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, pubResult.msg ?? '上传失败', taskData.taskId);
      return pubResult;
    }
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //竖版封面
    let uploadedVerticalCoverInfo = await uploadCover(
      cookie,
      taskData.taskId,
      appId,
      taskData.verticalCover,
      pubResult,
    );
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      if (!uploadedVerticalCoverInfo?.coverImages || !(uploadedVerticalCoverInfo?.coverImages?.length > 0)) {
        if (i < retryTimes - 1) {
          await Task.Delay(stepWaitTime);
          uploadedVerticalCoverInfo = await uploadCover(cookie, taskData.taskId, appId, taskData.cover, pubResult);
          continue;
        }
        logger.error(
          `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover?.pathOrUrl} ${JSON.stringify(
            uploadedVerticalCoverInfo,
          )} ${JSON.stringify(pubResult)}`,
        );
        pubResult.code = pubResult?.code ? pubResult.code : errorCode.data_error;
        SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, pubResult.msg ?? '上传失败', taskData.taskId);
        return pubResult;
      }
      break;
    }

    if (uploadedVerticalCoverInfo == null) {
      logger.error(
        `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover?.pathOrUrl} ${JSON.stringify(
          uploadedVerticalCoverInfo,
        )} ${JSON.stringify(pubResult)}`,
      );
      SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, pubResult.msg ?? '上传失败', taskData.taskId);
      return pubResult;
    }
    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, pubResult.msg ?? '上传完成', taskData.taskId);
    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);

    // endregion

    // region 组装并推送数据
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, pubResult.msg ?? '推送中', taskData.taskId);
    // 组装发布数据
    const postData = buildPostData(taskData, uploadedCoverInfo, uploadedVerticalCoverInfo, uploadVideoInfo);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //推送数据
    // console.debug('百家号竖版推送数据', taskData.taskId, cookie, postData);
    //不能取消
    taskData.cancelToken?.disable(privateKey);
    const publishResult = await publish(
      cookie,
      postData,
      tokenStr,
      taskData.pubType == 0 ? 'save' : 'publish',
      webProxy,
    );
    // console.debug('百家号竖版推送返回数据', taskData.taskId, publishResult);

    pubResult.code = publishResult.errno ?? errorCode.data_error;
    pubResult.msg = publishResult.errmsg ?? '';
    pubResult.publishId = publishResult?.ret?.nid ?? publishResult.ret?.vid;

    // console.debug('百家竖版视频发布完成', taskData.taskId, taskData, uploadedCoverInfo, uploadVideoInfo, pubResult);

    if (pubResult.publishId) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushFail, pubResult.msg ?? '推送失败', taskData.taskId);
      logger.error(`百家竖版视频发布失败 ${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(publishResult)}`);
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
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushFail, pubResult.msg ?? '推送失败', taskData.taskId);
    logger.error(`百家号竖版发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};

/**
 * 组装发布参数
 * @param taskData
 * @param coverInfo
 * @param verticalCover
 * @param videoInfoIn
 */
const buildPostData = (
  taskData: BaijiahaoMiniVideoTaskInput,
  coverInfo: UploadedCoverInfo,
  verticalCover: UploadedCoverInfo,
  videoInfoIn: UploadCompleteResponse,
): string => {
  const argsList: Array<string> = [];

  argsList.push(`height_in_pixel=${taskData?.video.height ?? 1280}`);
  argsList.push(`width_in_pixel=${taskData.video?.width ?? 720}`);
  argsList.push('loadComplete=true');
  argsList.push('bjhmt=&order_id=&type=ugc_video');
  argsList.push(`video_duration=${taskData.video?.duration ?? 30}`);
  argsList.push(`size=${taskData?.video.size ?? 102400}`);
  argsList.push('source_reprinted_allow=0&nryx_mount_list=&is_consultant_card=0');
  argsList.push('image_edit_point=&ducut_info=&cover_source=upload&aigc_rebuild=&auto_mount_goods=0');
  argsList.push(`publish_statement=${taskData.statementType ?? 1}&publish_statement_sub=${taskData.statementSubType ?? 0}`);

  //标题
  argsList.push(`title=${encodeURIComponent(taskData.title ?? '')}`);

  //视频信息
  const contentJo = {
    title: taskData.title,
    mediaId: videoInfoIn.mediaId,
  };
  const contentJa = [contentJo];

  argsList.push(`content=${encodeURIComponent(JSON.stringify(contentJa))}`);

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
    argsList.push(`cover_layout=${coverInfo.coverImages?.length >= 3 ? 'three' : 'one'}`);
    argsList.push(`cover_images=${encodeURIComponent(JSON.stringify(coverInfo.coverImages))}`);
    argsList.push(`_cover_images_map=${encodeURIComponent(JSON.stringify(coverInfo.coverImagesMap))}`);
  } else {
    argsList.push('cover_layout=');
    argsList.push('cover_images=');
    argsList.push('_cover_images_map=');
  }

  //竖版封面
  if (verticalCover) {
    argsList.push(
      `vertical_cover_images=${encodeURIComponent(
        JSON.stringify([
          {
            src: verticalCover.coverImagesMap[0].src,
            content_original: verticalCover.coverImagesMap[0].origin_src,
          },
        ]),
      )}`,
    );
  } else {
    argsList.push('vertical_cover_images=');
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
    if (taskData.subCategoryName?.includes('/')) {
      const cates = taskData.subCategoryName.split('/');
      argsList.push(`cate_user_cms%5B1%5D=${encodeURIComponent(cates[0])}`);
      argsList.push(`cate_user_cms%5B1%5D=${encodeURIComponent(cates[1])}`);
    } else {
      argsList.push(`cate_user_cms%5B1%5D=${encodeURIComponent(taskData.subCategoryName)}`);
    }
  }

  //定时发布增加
  const pubTime = taskData?.publishTime?.toString()?.substring(0, 10);
  argsList.push('fe_from=BJH_CMS_PC');
  if (pubTime) {
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
  } else {
    argsList.push('bjhtopic_info=&bjhtopic_id=');
  }


  //合集
  if (taskData.collection?.yixiaoerId) {
    argsList.push(`video_set_id=${taskData.collection.yixiaoerId}`);
  }

  return sortQueryString(argsList, false);
};

/**
 * 百家横版视频发布入参
 */
export interface BaijiahaoMiniVideoTaskInput {
  cancelToken?: CancelToken;
  /**
   * 1：发布，0：存草稿
   */
  pubType: number;
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
  verticalCover: {
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
   * 话题
   */
  topic?: BaijiahaoTopicItem;

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
