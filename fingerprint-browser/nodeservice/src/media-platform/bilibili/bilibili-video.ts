import {
  BilibiliVideoTaskInput,
  buildPostData,
  getUploadDomainResponse,
  getUploadArgsResponse,
  getUploadedVideoInfoResponse,
  getUploadIdResponse,
  publish,
  uploadVideoPart,
  UploadArgsResponse,
  UploadIdResponse,
  BilibiliUploadDomainResponse,
  getRecTagsResponse,
  getRecCategoryResponse,
} from './bilibili-video.service';
import { EventEmitter } from 'events';
import { BaseResult } from '../baseResult';
import { regex, uploadImage } from './bilibili-base.service';
import fs from 'fs';
import {
  convertImageFileToBuffer,
  logger,
  publishStatusEnum,
  SetProgressEvent,
  SetProgressNewEvent,
  stepWaitTime,
  Task,
  UploadEmitGate,
} from '../../utils';
import { AxiosError } from 'axios';
import { errorCode } from '../../media-platform/errorCode';
import { privateKey } from '../../utils/CancelToken';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createKuaiProxyAgent } from '@/media-platform/webproxy';

/**
 *
 * @param taskData 任务体
 * @param eventCallback 事件回调
 * @param fileStat 文件句柄
 * @param uploadArgsOut
 * @param pubResult 发布结果
 * @param maxThread 最大并发上传
 * @param fileName 文件名
 * @param cookie
 * @param uploadDomain 获取到的上传地址列表
 * @param retryTimes
 */
export const uploadVideo = async (
  taskData: BilibiliVideoTaskInput,
  eventCallback: EventEmitter,
  fileStat: fs.Stats,
  uploadArgsOut: { node: UploadArgsResponse },
  pubResult: BilibiliPublishResultOutput,
  maxThread: number,
  fileName: string,
  cookie: string,
  uploadDomain: BilibiliUploadDomainResponse,
  retryTimes: number = 0,
): Promise<UploadIdResponse | null | undefined> => {
  let fileHandle: fs.promises.FileHandle | null = null;
  try {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //获取上传参数
    const uploadArgs = await getUploadArgsResponse(cookie, fileName, fileStat.size, uploadDomain);
    if (!uploadArgs?.auth || !uploadArgs.endpoints || uploadArgs.endpoints.length <= 0) {
      //console.debug('获取视频上传参数失败', taskData.taskId, uploadArgs);
      pubResult.code = uploadArgs?.OK ?? errorCode.data_error;
      pubResult.msg = `获取视频上传参数失败 ${uploadArgs?.message ?? ''}`;
      return null;
    }
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    uploadArgsOut.node = uploadArgs;
    //SetProgressEvent(eventCallback, 5, '正在获取上传参数', taskData.taskId);

    // 获取文件句柄
    fileHandle = await fs.promises.open(taskData.video.localPath, 'r');

    // 准备上传分片信息列表
    const uploadedList: Array<string> = [];

    // 开始读取并上传文件
    let readIndex = 0;

    // 分片大小 8M
    const blockSize = 8388608;
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

    SetProgressNewEvent(
      eventCallback,
      publishStatusEnum.uploading,
      '视频上传中',
      taskData.taskId,
      totalPartNums,
      0,
      taskData.needParts === true,
    );

    SetProgressEvent(eventCallback, 8, ' 正在获取上传ID参数', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // 获取上传id相关数据
    const uploadIdArgs = await getUploadIdResponse(uploadArgs);

    if (!uploadIdArgs?.upload_id) {
      //console.debug('获取视频上传ID参数失败', taskData.taskId, uploadIdArgs);
      pubResult.code = uploadArgs?.OK ?? errorCode.data_error;
      pubResult.msg = '获取视频上传ID参数失败';
      return null;
    }

    // 并行上传
    const tasks: Array<Promise<string>> = [];

    // 文件大小小于等单个分片大小
    if (blockSize >= fileStat.size) {
      const buffer = Buffer.alloc(fileStat.size);
      const readData = await fileHandle.read(buffer, 0, fileStat.size, readIndex);
      if (readData.buffer.length > 0) {
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);
        const uploadResult = await uploadVideoPart(
          uploadArgs,
          readData.buffer,
          1,
          0,
          fileStat.size,
          uploadIdArgs.upload_id ?? '',
          totalPartNums,
          uploadArgs.endpoints[retryTimes % uploadArgs.endpoints.length],
        );

        if (uploadResult != '200') {
          //console.debug('视频分片上传失败', taskData.taskId, uploadResult);
          pubResult.msg = '视频分片上传失败';
          pubResult.code = errorCode.data_error;

          return null;
        }
        uploadedList.push(uploadResult);
        onPartUploaded();
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
        let canReadNum = blockSize;
        let buffer = Buffer.alloc(blockSize);
        if (readIndex + blockSize > fileStat.size) {
          canReadNum = fileStat.size - readIndex;
          buffer = Buffer.alloc(canReadNum);
        }
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);
        const readData = await fileHandle.read(buffer, 0, canReadNum, readIndex);
        if (readData.buffer.length > 0) {
          tasks.push(
            uploadVideoPart(
              uploadArgs,
              readData.buffer,
              partNum,
              readIndex,
              fileStat.size,
              uploadIdArgs.upload_id ?? '',
              totalPartNums,
              uploadArgs.endpoints[retryTimes % uploadArgs.endpoints.length],
            ),
          );

          if (tasks.length > maxThread) {
            const uploadResult = await Promise.race(tasks);

            if (uploadResult != '200') {
              //console.debug('视频分片上传失败', taskData.taskId, uploadResult);
              pubResult.msg = '视频分片上传失败';
              pubResult.code = errorCode.data_error;

              return null;
            }
            uploadedList.push(uploadResult);
            //onPartUploaded();

            //去除第一个任务，并等待完成
            const uploadResultNew = await tasks.splice(0, 1)[0];

            if (uploadResultNew != '200') {
              //console.debug('视频分片上传失败', taskData.taskId, uploadResultNew);
              pubResult.msg = '视频分片上传失败';
              pubResult.code = errorCode.data_error;

              return null;
            }
            uploadedList.push(uploadResultNew);
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

      if (uploadResult != '200') {
        //console.debug('视频分片上传失败', taskData.taskId, uploadResult);
        pubResult.msg = '视频分片上传失败';
        pubResult.code = errorCode.data_error;

        return null;
      }
      uploadedList.push(uploadResult);
      onPartUploaded();
    }

    // 检查上传成功片数是否正确
    if (uploadedList.length < totalPartNums) {
      //console.debug('视频部分上传失败', taskData.taskId, uploadedList);
      pubResult.code = errorCode.io_error;
      pubResult.msg = '视频上传失败:' + taskData.video.localPath;
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

    SetProgressEvent(eventCallback, 82, '上传完成校验中', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // 获取上传完成的视频信息
    const uploadedVideoStatus = await getUploadedVideoInfoResponse(
      uploadArgs,
      totalPartNums,
      fileName,
      uploadIdArgs.upload_id,
    );
    if (uploadedVideoStatus?.OK != 1) {
      //console.debug('视频上传失败', taskData.taskId, uploadedVideoStatus);
      pubResult.code = uploadedVideoStatus.http_code ?? errorCode.data_error;
      pubResult.msg = '视频上传失败';
      return null;
    }
    if (!uploadedVideoStatus?.key) {
      //console.debug('获取视频上传信息失败', taskData.taskId, uploadedList, uploadedVideoStatus);
      pubResult.code = -1;
      pubResult.msg = '获取视频上传信息失败';
      return null;
    }

    pubResult.code = 0;
    pubResult.msg = '';
    return uploadIdArgs;
    // endregion
  } catch (e) {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    logger.error(`B站视频上传异常失败,￥${taskData.taskId},${(e as Error)?.message}`);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = '视频上传失败';
    return null;
  } finally {
    fileHandle?.close();
  }
};

/**
 *
 * @param cookie  账号cookie
 * @param taskData 任务体
 * @param eventCallback 事件回调
 * @param maxThreadOut 最大并发上传
 * @param retryTimes 最大重试次数
 */
export const publishBilibiliVideo = async (
  cookie: string,
  taskData: BilibiliVideoTaskInput,
  eventCallback: EventEmitter,
  maxThreadOut: number = 3,
  retryTimes: number = 3,
): Promise<BilibiliPublishResultOutput> => {
  logger.info(`B站视频发布 ${taskData.taskId}`);
  const pubResult: BilibiliPublishResultOutput = {
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
    const csrfTokenMatch = regex.exec(cookie);
    const csrfToken = csrfTokenMatch ? csrfTokenMatch[1] : '';
    if (!csrfToken) {
      logger.error(`cookie部分缺失 ${cookie}`);
      pubResult.code = -1;
      pubResult.msg = '登录失效';
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
    SetProgressEvent(eventCallback, 1, '准备上传中', taskData.taskId);

    // 获取文件信息
    const fileStat = await fs.promises.stat(taskData.video.localPath);
    taskData.video.size = fileStat.size;
    //const fileName = path.basename(taskData.video.localPath);

    SetProgressEvent(eventCallback, 2, '正在获取预上传参数', taskData.taskId);

    const tm = new Date().getTime();
    const uploadFileId = `${cookie.split('DedeUserID=')[1]?.split(';')[0].trim()}_${tm}_${tm
      .toString()
      .substring(9, 12)}`;

    // 获取上传域名
    let uploadDomain = await getUploadDomainResponse(cookie);
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      if (uploadDomain.OK != 1 || !uploadDomain.lines?.length) {
        //console.debug('获取视频上传参数失败', taskData.taskId, uploadDomain);
        if (i < retryTimes - 1 && uploadDomain.OK != -101) {
          uploadDomain = await getUploadDomainResponse(cookie);
          continue;
        }
        pubResult.code = uploadDomain?.OK ?? errorCode.data_error;
        pubResult.msg = '获取视频上传参数失败';
        logger.error(`获取视频上传参数失败 ${taskData.taskId} ${cookie} ${JSON.stringify(uploadDomain)}`);
        SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, pubResult.msg ?? '上传失败', taskData.taskId);
        return pubResult;
      } else {
        break;
      }
    }
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    SetProgressEvent(eventCallback, 3, '正在获取预上传参数', taskData.taskId);

    let uploadArgs: UploadArgsResponse = { OK: 0 };
    const uploadArgsIn = { node: uploadArgs };
    // region 上传视频
    let uploadIdArgs = await uploadVideo(
      taskData,
      eventCallback,
      fileStat,
      uploadArgsIn,
      pubResult,
      maxThreadOut,
      uploadFileId,
      cookie,
      uploadDomain,
    );
    for (let i = 0; i < retryTimes; i++) {
      if (pubResult.msg?.includes('您上传视频过快，请您稍作休息后再继续')) {
        pubResult.msg =
          '发布失败:官方平台检测到您的账号存在风险，请先前往《创作者中心》里登录后单独发布一个作品，发布时会跳出验证，验证通过即可一键发布。';
        pubResult.code = -1;
        return pubResult;
      }
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      if (!uploadIdArgs?.key) {
        if (i < retryTimes - 1 && pubResult.code != -101) {
          SetProgressEvent(eventCallback, 4, '上传失败,重试中', taskData.taskId);
          uploadIdArgs = await uploadVideo(
            taskData,
            eventCallback,
            fileStat,
            uploadArgsIn,
            pubResult,
            maxThreadOut,
            uploadFileId,
            cookie,
            uploadDomain,
            i + 1,
          );
          continue;
        }
        logger.error(
          `视频上传失败 ${taskData.taskId} ${cookie} ${JSON.stringify(uploadIdArgs)} ${JSON.stringify(pubResult)}`,
        );
        SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, pubResult.msg ?? '上传失败', taskData.taskId);
        return pubResult;
      } else {
        break;
      }
    }
    if (!uploadIdArgs?.key) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, pubResult.msg ?? '上传失败', taskData.taskId);
      logger.error(`视频上传失败 ${taskData.taskId} ${cookie} ${JSON.stringify(uploadIdArgs)}`);
      return pubResult;
    }
    uploadArgs = uploadArgsIn.node;
    // endregion

    SetProgressEvent(eventCallback, 85, '获取上传完成视频信息', taskData.taskId);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // region 封面上传
    SetProgressEvent(eventCallback, 90, '封面读取中', taskData.taskId);

    // 读取图片数据
    const imageData = await convertImageFileToBuffer(taskData.cover.pathOrUrl);
    SetProgressEvent(eventCallback, 90, '封面上传中', taskData.taskId);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    // 上传图片数据
    let imageResult = await uploadImage(cookie, imageData);
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);
      // 判断封面是否上传成功
      if (!imageResult?.data?.url) {
        // console.debug('封面上传失败', taskData.taskId, taskData?.cover?.pathOrUrl, imageResult);
        if (i < retryTimes - 1 && imageResult.code != -101) {
          imageResult = await uploadImage(cookie, imageData);
          continue;
        }
        pubResult.code = imageResult?.code ?? errorCode.data_error;
        pubResult.msg = '封面上传失败:' + (imageResult?.message ?? '');
        logger.error(`封面上传失败 ${taskData.taskId} ${cookie} ${JSON.stringify(imageResult)} ${pubResult}`);
        SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, pubResult.msg ?? '上传失败', taskData.taskId);
        return pubResult;
      } else {
        break;
      }
    }
    if (!imageResult?.data?.url) {
      pubResult.code = imageResult?.code ?? errorCode.data_error;
      pubResult.msg = '封面上传失败:' + (imageResult?.message ?? '');
      logger.error(`封面上传失败 ${taskData.taskId} ${cookie} ${JSON.stringify(imageResult)} ${pubResult}`);
      SetProgressNewEvent(eventCallback, publishStatusEnum.uploadFail, pubResult.msg ?? '上传失败', taskData.taskId);
      return pubResult;
    }

    //endregion
    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    //默认数据补全
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '开始推送', taskData.taskId);
    //创作类型
    if (taskData.copyright != 1 && taskData.copyright != 2) {
      taskData.copyright = 3;
    }
    //分区，生活日常
    if (!taskData.tid && !taskData.category) {
      taskData.tid = 21;
      try {
        const recCategory = await getRecCategoryResponse(
          cookie,
          csrfToken,
          taskData.title ?? '12',
          uploadArgs.upos_uri?.split('/')[3]?.split('.')[0] ?? '',
          uploadFileId,
        );
        if (recCategory?.data?.length > 0) {
          taskData.tid = recCategory.data[0].id ?? 21;
        }
      } catch (e) {}
    }

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    //话题标签
    if (!taskData.desc?.includes('<topic') && !taskData.topic && (!taskData.tags || taskData.tags.length == 0)) {
      //获取推荐标签
      taskData.tags = [];
      try {
        await Task.Delay(stepWaitTime);
        const recTags = await getRecTagsResponse(
          cookie,
          taskData.tid,
          uploadArgs.upos_uri?.split('/')[3]?.split('.')[0] ?? '',
          taskData.title ?? '12',
          taskData.desc ?? '',
          uploadFileId,
        );
        if (recTags?.data?.length > 0) {
          for (let i = 0; i < recTags.data.length; i++) {
            taskData.tags.push(recTags.data[i].tag);
            if (taskData.tags.length >= 3) break;
          }
        } else {
          taskData.tags.push('记录');
        }
      } catch (e) {
        taskData.tags.push('记录');
      }
    }

    //标题
    if (!taskData.title) {
      taskData.title = '新作上线，快来看看！';
    }

    //过滤多余标签
    taskData.tags = taskData.tags?.slice(0, 10);

    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);

    const coverUrl = imageResult.data.url;

    // 组装发布数据
    const postData = await buildPostData(taskData, coverUrl, uploadArgs, csrfToken, uploadIdArgs?.key ?? '', cookie);
    // console.debug('B站推送数据', taskData.taskId, cookie, postData);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // 推送数据
    //不可取消
    taskData.cancelToken?.disable(privateKey);
    const publishResult = await publish(cookie, postData, csrfToken, taskData.pubType, webProxy);
    //console.debug('B站推送返回数据', taskData.taskId, publishResult);

    pubResult.code = publishResult?.code;
    pubResult.msg = publishResult?.message ?? '';
    pubResult.publishId = publishResult?.data?.aid?.toString();

    if (pubResult.code == 0 && (pubResult.publishId || taskData.pubType == 0)) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      logger.error(`B站视频发布失败 ${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(publishResult)}`);
      pubResult.msg = `发布失败${pubResult.msg}`;
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushFail, pubResult.msg, taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
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
      pubResult.msg = `发布失败，${e?.toString() ?? ''}`;
      pubResult.errorInfo = e?.toString();
    }
    logger.error(`B站视频发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushFail, pubResult.msg ?? '推送失败', taskData.taskId);
  } finally {
    if (pubResult?.msg && pubResult.msg.includes('验证码')) {
      pubResult.msg =
        '发布失败:官方检测到您的账号存在风险,请前往此账号《创作者中心》发布作品,发布时会跳出验证,验证通过即可一键发布。';
    }
  }

  return pubResult;
};

export interface BilibiliPublishResultOutput extends BaseResult {
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
