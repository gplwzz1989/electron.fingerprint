import { EventEmitter } from 'events';
import { BaseResult } from '../../media-platform/baseResult';
import fs from 'fs';
import { errorCode } from '../../media-platform/errorCode';
import {
  htmlDecode,
  logger,
  publishStatusEnum,
  readImageData,
  SetProgressEvent,
  SetProgressNewEvent,
  UploadEmitGate,
} from '../../utils';
import path from 'path';
import { AxiosError } from 'axios';
import {
  finishUploadAsync,
  getCheckVideoParamAsync,
  getQiehaoOmFinishUploadResponse,
  getQiehaoVideoArgsAsync,
  getVideoSm3,
  publish,
  QiehaoActivityHaveSignedAsync,
  QiehaoUploadCoverResponse,
  QiehaoUploadPartResponse,
  QiehaoVideoArgsResponse,
  uploadCoverAsync,
  uploadPartAsync,
} from './qiehao-video.service';
import crypto from 'crypto';
import { HtmlDocument } from '@/htmlAgilityPack';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import dayjs from 'dayjs';
import { ITask } from '@/media-platform/baseTask';

const uploadVideo = async (
  cookie: string,
  taskData: QiehaoVideoTaskInput,
  fileStat: fs.Stats,
  maxThread: number,
  fileName: string,
  seqId: string,
  uploadArgs: QiehaoVideoArgsResponse,
  pubResult: QiehaoPublishResultOutput,
  eventCallback: EventEmitter,
) => {
  let fileHandle: fs.promises.FileHandle | null = null;
  try {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // 获取文件句柄
    fileHandle = await fs.promises.open(taskData.video.localPath, 'r');

    // 准备上传分片信息列表
    //const uploadedList: Map<number, string> = new Map<number, string>();
    const uploadedList: Map<number, QiehaoUploadPartResponse> = new Map();

    // 开始读取并上传文件
    let readIndex = 0;

    // 分片大小 2M
    const blockSize = 2097152;
    //总片数
    const totalPartNums = Math.ceil(fileStat.size / blockSize);

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

    // 并行上传
    const tasks: Array<Promise<QiehaoUploadPartResponse>> = [];
    SetProgressNewEvent(
      eventCallback,
      publishStatusEnum.uploading,
      '视频上传中',
      taskData.taskId,
      totalPartNums,
      uploadedParts,
      taskData.needParts === true,
    );

    // 文件大小小于等单个分片大小
    if (blockSize >= fileStat.size) {
      const buffer = Buffer.alloc(fileStat.size);
      const readData = await fileHandle.read(buffer, 0, fileStat.size, readIndex);
      if (readData.buffer.length > 0) {
        const uploadResult = await uploadPartAsync(cookie, seqId, readData.buffer, 1, uploadArgs);

        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);

        if (uploadResult.code != 0) {
          // console.debug('视频分片上传失败', taskData.taskId, uploadResult);
          pubResult.msg = '视频分片上传失败';
          pubResult.code = errorCode.data_error;

          return null;
        }
        uploadedList.set(uploadResult.partNum, uploadResult);
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
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);

        partNum++;
        // SetProgressEvent(
        //   eventCallback,
        //   10 + Number.parseFloat(((partNum / totalPartNums) * 0.7 * 100).toFixed(2).substring(0, 4)),
        //   '视频上传中',
        //   taskData.taskId,
        // );
        let canReadNum = blockSize;
        let buffer = Buffer.alloc(blockSize);
        if (readIndex + blockSize > fileStat.size) {
          canReadNum = fileStat.size - readIndex;
          buffer = Buffer.alloc(canReadNum);
        }

        const readData = await fileHandle.read(buffer, 0, canReadNum, readIndex);
        if (readData.buffer.length > 0) {
          tasks.push(uploadPartAsync(cookie, seqId, readData.buffer, partNum, uploadArgs));

          if (tasks.length > maxThread) {
            const uploadResult = await Promise.race(tasks);

            if (uploadResult.code != 0) {
              // console.debug('视频分片上传失败', taskData.taskId, uploadResult);
              pubResult.msg = '视频分片上传失败';
              pubResult.code = errorCode.data_error;

              return null;
            }
            uploadedList.set(uploadResult.partNum, uploadResult);

            const uploadResultNew = await tasks.splice(0, 1)[0];

            if (uploadResultNew.code != 0) {
              // console.debug('视频分片上传失败', taskData.taskId, uploadResultNew);
              pubResult.msg = '视频分片上传失败';
              pubResult.code = errorCode.data_error;

              return null;
            }
            uploadedList.set(uploadResultNew.partNum, uploadResultNew);
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

      if (uploadResult.code != 0) {
        // console.debug('视频分片上传失败', taskData.taskId, uploadResult);
        pubResult.msg = '视频分片上传失败';
        pubResult.code = errorCode.data_error;

        return null;
      }
      uploadedList.set(uploadResult.partNum, uploadResult);
      onPartUploaded();
    }

    // 检查上传成功片数是否正确
    if (uploadedList.size < totalPartNums) {
      // console.debug('视频部分上传失败', taskData.taskId, uploadedList);
      pubResult.code = errorCode.io_error;
      pubResult.msg = '视频上传失败:' + taskData.video.localPath;
      return null;
    }

    const uploadPartParams: Array<{
      partNum: number;
      partSha: string;
    }> = [];

    for (let i = 1; i <= totalPartNums; i++) {
      uploadPartParams.push({
        partNum: i,
        partSha: uploadedList.get(i)?.partSha ?? '',
      });
    }

    // 获取上传完成的视频信息
    const finishUpload = await finishUploadAsync(cookie, uploadArgs, uploadPartParams);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (finishUpload?.code != 0) {
      // console.debug('视频上传失败', taskData.taskId, finishUpload.code);
      pubResult.code = finishUpload.code ?? errorCode.data_error;
      pubResult.msg = '视频上传失败';
      return null;
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
    const fileSha = crypto.createHash('md5').update(Buffer.alloc(fileStat.size)).digest('hex');

    const file_sm3 = await getVideoSm3(taskData.video.localPath);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    const omFinishUpload = await getQiehaoOmFinishUploadResponse(cookie, fileSha, file_sm3, uploadArgs);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (omFinishUpload?.response.code != 0) {
      // console.debug('视频上传失败', taskData.taskId, omFinishUpload);
      pubResult.code = omFinishUpload.response.code ?? errorCode.data_error;
      pubResult.msg = '视频上传失败';
      return null;
    }
    pubResult.code = 0;
    pubResult.msg = '';

    return finishUpload;
    // endregion
  } catch (e) {
    logger.error(`企鹅号视频上传异常失败,${taskData.taskId},${(e as Error)?.message}`);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = '视频上传失败';
    return null;
  } finally {
    fileHandle?.close();
  }
};

/**
 * 发布企鹅号视频
 * @param cookie
 * @param taskData 发布任务体
 * @param eventCallback 事件回调
 * @param maxThreadOut 最大并发上传
 * @param retryTimes 最大重试次数
 */
export const publishQiehaoVideo = async (
  cookie: string,
  taskData: QiehaoVideoTaskInput,
  eventCallback: EventEmitter,
  maxThreadOut: number = 3,
  retryTimes: number = 3,
): Promise<QiehaoPublishResultOutput> => {
  logger.info(`企鹅号发布 ${taskData.taskId}`);
  const pubResult: QiehaoPublishResultOutput = {
    code: 0,
    msg: '',
    taskId: taskData.taskId,
  };
  try {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploading, '开始发布', taskData.taskId);
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
    let webProxy: HttpsProxyAgent<string> | object | undefined = undefined;
    if (taskData.proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(taskData.proxy);
    }
    SetProgressEvent(eventCallback, 1, '准备上传中', taskData.taskId);

    //最多9个标签
    taskData.tags = taskData?.tags?.slice(0, 9);
    // 获取文件信息
    const fileStat = await fs.promises.stat(taskData.video.localPath);
    taskData.video.size = fileStat.size;
    const fileName = path.basename(taskData.video.localPath);

    SetProgressEvent(eventCallback, 2, '正在获取预上传参数', taskData.taskId);

    if (taskData?.activityInfo?.id) {
      const activitySignInfo = await QiehaoActivityHaveSignedAsync(cookie, taskData.activityInfo.id);

      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      if (activitySignInfo.response.code != 0) {
        pubResult.code = errorCode.data_error;
        pubResult.msg = activitySignInfo.response.msg;
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploadFail,
          pubResult?.msg ? pubResult.msg : '上传失败',
          taskData.taskId,
        );
        return pubResult;
      }
    }

    const seqId = ['f', +new Date(), Math.random()].join('').split('.').join('');

    let uploadVideoArgs = await getQiehaoVideoArgsAsync(cookie, fileName, fileStat.size, seqId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (uploadVideoArgs.response.code != 0) {
      for (let i = 0; i < retryTimes; i++) {
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);

        if (uploadVideoArgs.response.code != 0 || uploadVideoArgs.data.videoID != '') {
          // console.debug('获取视频上传参数失败', taskData.taskId, uploadVideoArgs);
          if (i < retryTimes - 1 && uploadVideoArgs.response.code != 0) {
            uploadVideoArgs = await getQiehaoVideoArgsAsync(cookie, fileName, fileStat.size, seqId);
            continue;
          }
          pubResult.code = uploadVideoArgs.response.code;
          pubResult.msg = '获取视频上传参数失败';
          logger.error(`获取视频上传参数失败 ${taskData.taskId} ${cookie} ${JSON.stringify(uploadVideoArgs)}`);
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
    }

    SetProgressEvent(eventCallback, 3, '准备上传视频', taskData.taskId);

    // region 上传视频
    let uploadIdArgs = await uploadVideo(
      cookie,
      taskData,
      fileStat,
      maxThreadOut,
      fileName,
      seqId,
      uploadVideoArgs,
      pubResult,
      eventCallback,
    );
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      if (uploadIdArgs?.code != 0) {
        if (i < retryTimes - 1 && pubResult.code != 0) {
          SetProgressEvent(eventCallback, 4, '上传失败,重试中', taskData.taskId);
          uploadIdArgs = await uploadVideo(
            cookie,
            taskData,
            fileStat,
            maxThreadOut,
            fileName,
            seqId,
            uploadVideoArgs,
            pubResult,
            eventCallback,
          );
          continue;
        }
        logger.error(
          `视频上传失败 ${taskData.taskId} ${cookie} ${JSON.stringify(uploadIdArgs)} ${JSON.stringify(pubResult)}`,
        );
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
    // endregion

    SetProgressEvent(eventCallback, 85, '获取上传完成视频信息', taskData.taskId);

    // region 封面上传
    SetProgressEvent(eventCallback, 90, '封面读取中', taskData.taskId);

    // 读取图片数据
    const imgData = await readImageData(taskData.cover.pathOrUrl, 'jpeg');
    if (imgData?.status < 200 || imgData?.status > 300 || !imgData.data || imgData.data?.length < 100) {
      pubResult.msg = `图片下载失败-${imgData.status}-${taskData.cover.pathOrUrl}`;
      pubResult.code = errorCode.io_error;
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult?.msg ? pubResult.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }
    SetProgressEvent(eventCallback, 90, '封面上传中', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // 上传图片数据
    let imageResult = await uploadCoverAsync(cookie, imgData.data, imgData.ext);
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      // 判断封面是否上传成功
      if (!imageResult.data.url['1']) {
        // console.debug('封面上传失败', taskData.taskId, taskData?.cover?.pathOrUrl, imageResult);
        if (i < retryTimes - 1 && imageResult.code != 0) {
          imageResult = await uploadCoverAsync(cookie, imgData.data, imgData.ext);
          continue;
        }
        pubResult.code = imageResult?.code ?? errorCode.data_error;
        pubResult.msg = '封面上传失败:' + (imageResult?.message ?? '');
        logger.error(
          `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${JSON.stringify(
            imageResult,
          )} ${JSON.stringify(pubResult)}`,
        );
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
    if (!imageResult?.data?.url?.['1']) {
      pubResult.code = imageResult?.code ?? errorCode.data_error;
      pubResult.msg = '封面上传失败:' + (imageResult?.message ?? '');
      logger.error(
        `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${JSON.stringify(
          imageResult,
        )} ${JSON.stringify(pubResult)}`,
      );
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult?.msg ? pubResult.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }
    //endregion

    SetProgressEvent(eventCallback, 92, '检测上传参数', taskData.taskId);
    await getCheckVideoParamAsync(cookie, taskData.title, taskData.desc, taskData.tags.join(' '));

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    const coverUrl =
      imageResult.data?.url?.['7201280'] ?? imageResult.data?.url?.['640360'] ?? imageResult.data?.url?.['1'];

    // 组装发布数据
    const postData = buildPostData(taskData, uploadVideoArgs, coverUrl, imageResult);
    // console.debug('企鹅号推送数据', taskData.taskId, cookie, postData);

    // 推送数据
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);
    const publishResult = await publish(cookie, taskData.pubType, postData, webProxy);
    // console.debug('企鹅号推送返回数据', taskData.taskId, publishResult);

    pubResult.code = publishResult?.response?.code;
    pubResult.msg = publishResult?.response?.msg ?? '';

    pubResult.publishId = publishResult?.data[0]?.articleId?.toString();

    if (typeof publishResult?.data == 'string') {
      const data = JSON.parse(publishResult?.data);
      pubResult.publishId = data['articleId'];
    }

    if (pubResult.code == 0 && (pubResult.publishId || taskData.pubType == 0)) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      pubResult.msg = `发布失败${pubResult.msg}`;
      if (pubResult.code === -5002) {
        pubResult.msg = '发布失败:发文数超限';
      }
      if (pubResult.code === -50121) {
        pubResult.msg = '账号资质未通过';
      }
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
      logger.error(`发布失败 ${taskData.taskId} ${cookie} ${postData}  ${JSON.stringify(pubResult)}`);
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
    logger.error(`企鹅号视频发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
    if (pubResult?.msg?.includes('not login')) {
      pubResult.msg = '账号失效，请重新授权后再试';
    }
  }

  return pubResult;
};

const buildPostData = (
  taskData: QiehaoVideoTaskInput,
  uploadVideoArgs: QiehaoVideoArgsResponse,
  cover: string,
  imageResult: QiehaoUploadCoverResponse,
): string => {
  let desc = '';
  if (taskData.desc) {
    const html = new HtmlDocument();
    html.LoadHtml(taskData.desc);
    desc = htmlDecode(html.DocumentNode.InnerText()).trim();
  }
  const videos = {
    title: taskData.title ?? '',
    desc: desc ?? '',
    tags: taskData.tags?.join(' ') ?? '',
    newcat: taskData.category,
    newsubcat: taskData.subCategory,
    user_original: taskData?.userOriginal ?? 0,
    om_activity_id: '',
    om_activity_name: '',
    event_id: '',
    event_name: '',
    activity_scene_id: 0,
    hotBreak: '',
    isHowto: '0',
    howtoInfo: '',
    public_benefit_flag: 0,
    commercialization_source: '',
    caimaiInfo: '',
    payInfo: '',
    daihuoInfo: '',
    self_declare: taskData?.selfDeclare
      ? JSON.stringify({ id: taskData.selfDeclare, desc: selfDeclareDesc[taskData.selfDeclare] })
      : '',
    vid: uploadVideoArgs.data.vid,
    imgurlsrc: 'capture',
    imgurl: cover,
    imgurl_ext: JSON.stringify(imageResult?.data?.url ?? ''),
    img_ext: '',
    img_direct: 0,
    needpub: taskData.pubType ? 0 : 1,
    source: 0,
    sub_source: 0,
  };

  if (taskData.original) {
    //原创
    videos['isOriginal'] = taskData?.original ?? '0';
    videos['outlink'] = taskData?.outLink ?? '';
    videos['vid'] = uploadVideoArgs.data.vid;
  }

  const articles = {
    title: taskData.title ?? '',
    desc: desc ?? '',
    tags: taskData.tags?.join(' '),
    newcat: taskData.category,
    newsubcat: taskData.subCategory,
    user_original: taskData.userOriginal ?? 0,
    om_activity_id: '',
    om_activity_name: '',
    event_id: '',
    event_name: '',
    activity_scene_id: 0,
    hotBreak: '',
    isHowto: '0',
    howtoInfo: '',
    public_benefit_flag: 0,
    commercialization_source: '',
    caimaiInfo: '',
    payInfo: '',
    daihuoInfo: '',
    self_declare: taskData?.selfDeclare
      ? JSON.stringify({ id: taskData.selfDeclare, desc: selfDeclareDesc[taskData.selfDeclare] })
      : '',
    vid: uploadVideoArgs.data.vid,
    imgurlsrc: 'capture',
    imgurl: cover,
    imgurl_ext: JSON.stringify(imageResult?.data?.url ?? ''),
    img_ext: '',
    img_direct: 0,
    needpub: taskData.pubType ? 0 : 1,
    source: 0,
    sub_source: 0,
    type: '56',
    articleId: '',
    content:
      '<p><iframe allowfullscreen="" f="no" frameborder="0" height="270" src="//v.qq.com/iframe/preview.html?vid=' +
      uploadVideoArgs.data.vid +
      '&amp;width=480&amp;height=270&amp;auto=0" type="video" width="480"></iframe></p>',
    video: `{"vid":"${uploadVideoArgs.data.vid}","desc":"${desc ?? ''}","title":"${
      taskData.title ?? ''
    }","type":"video","duration":"0:00:00","img":{}}`,
    ext_base: '',
  };
  //定时发布
  if (taskData.publishTime) {
    articles['scheduleTime'] = taskData.publishTime;
    articles['schedulePublishTime'] = dayjs(taskData.publishTime * 1000).format('YYYY-MM-DD HH:mm:ss');
  }

  //远程
  if (taskData.original) {
    articles['isOriginal'] = taskData.original ?? 0;
  }
  //创作热点
  const trendId = taskData?.eventInfo?.event_id ?? '';
  if (trendId) {
    articles['event_id'] = trendId;
    articles['event_name'] = taskData?.eventInfo?.name ?? '';
    videos['event_id'] = trendId;
    videos['event_name'] = taskData?.eventInfo?.name ?? '';
  } else {
    articles['event_id'] = '';
    articles['event_name'] = '';
    videos['event_id'] = '';
    videos['event_name'] = '';
  }

  //约稿参数
  const om_activity_id = taskData.activityInfo?.id?.toString();
  if (om_activity_id) {
    videos['om_activity_id'] = om_activity_id;
    videos['om_activity_name'] = taskData?.activityInfo?.name ?? '';
    articles['om_activity_id'] = om_activity_id;
    articles['om_activity_name'] = taskData?.activityInfo?.name ?? '';
    //约稿活动参数，
    const activityInfo = {};
    activityInfo['type'] = taskData?.activityInfo?.activity_type ?? 1;
    activityInfo['origin'] = taskData?.activityInfo?.origin ?? 0;
    activityInfo['origin_id'] = taskData?.activityInfo?.origin_id ?? '';
    activityInfo['commercial_data'] = taskData?.activityInfo?.commercial_data ?? '';
    activityInfo['commercial_type'] = taskData?.activityInfo?.commercial_type ?? 0;
    articles['activityInfo'] = activityInfo;
    videos['activityInfo'] = activityInfo;
  } else {
    videos['om_activity_id'] = '';
    videos['om_activity_name'] = '';
    videos['activityInfo'] = '';
    articles['activityInfo'] = '';
    articles['om_activity_id'] = '';
    articles['om_activity_name'] = '';
  }

  const videosJa = new Array<unknown>();
  videosJa.push(videos);
  const articlesJa = new Array<unknown>();
  articlesJa.push(articles);

  const postData = {
    title: '',
    title2: '',
    tag: '',
    video: '',
    cover_type: 1,
    imgurl_ext: '[]',
    category_id: '',
    content: '',
    orignal: taskData.original ?? 0,
    user_original: taskData.userOriginal ?? 0,
    music: '',
    activity: '',
    apply_olympic_flag: 0,
    apply_push_flag: 0,
    apply_reward_flag: 0,
    reward_flag: 0,
    survey_id: '',
    survey_name: '',
    videos: videosJa,
    articles: articlesJa,
    type: '56',
    relogin: 1,
  };
  return JSON.stringify(postData);
};

export interface QiehaoVideoTaskInput extends ITask {
  cancelToken?: CancelToken;
  /**
   * 发布类型
   * 0 存草稿 平台支持才有效，否则默认为发布
   * 1 发布
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
   *  描述
   */
  desc: string;

  /**
   * 标题
   */
  title: string;

  /**
   * 标签
   */
  tags: Array<string>;

  /**
   * 分类
   */
  category: string;

  /**
   * 二级分类
   */
  subCategory: string;

  /**
   * 原创 1:申明 0:不申明
   */
  original?: number;

  userOriginal?: number;

  /**
   * 外链
   */
  outLink?: string;

  /**
   * 活动信息
   */
  activityInfo?: {
    id: string;
    name: string;
    origin: number;
    origin_id: string;
    activity_type: string;
    commercial_data: string;
    commercial_type: number;
  };

  /**
   * 事件信息
   */
  eventInfo?: {
    event_id: string;
    name: string;
  };

  /**
   * 定时发布时间戳 10位，分钟数只能是5的倍数
   */
  publishTime?: number;

  /**
   * 自主申明
   * 0:暂不申明
   * 8:健康医疗分享，仅供参考
   * 9:危险行为，请勿模仿
   * 3:剧情演绎，仅供娱乐
   * 2:个人观点，仅供参考
   */
  selfDeclare?: 0 | 2 | 3 | 8 | 9;

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}
const selfDeclareDesc = {
  0: '暂无申明',
  2: '作者声明：个人观点，仅供参考',
  3: '作者声明：剧情演绎，仅供娱乐',
  9: '作者声明：危险行为，请勿模仿',
  8: '作者声明：健康医疗分享，仅供参考',
};

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
}
