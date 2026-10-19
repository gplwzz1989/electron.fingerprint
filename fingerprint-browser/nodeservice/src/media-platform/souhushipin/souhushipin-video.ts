import fs from 'fs';
import { BaseResult } from '../baseResult';
import { errorCode } from '../errorCode';
import {
  logger,
  publishStatusEnum,
  readImageData,
  SetProgressEvent,
  SetProgressNewEvent,
  UploadEmitGate,
} from '../../utils';
import { AxiosError } from 'axios';
import { EventEmitter } from 'events';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import path from 'path';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '../../media-platform/webproxy';
import {
  checkFinishUpload,
  getUploadArgResponse,
  publishVideoResponse,
  reportProcess,
  SouHuShiPinUploadArgResponse,
  uploadImageResponse,
  UploadPartResponse,
  uploadVideoBinaryPart,
} from './souhushipin-video.service';
import { getUploadCapResponse, getUserInfoResponse, SouHuShiPinUserResponse } from './souhushipin-base.service';
import crypto from 'crypto';
import { PublishResult } from '../..//media-platform';
import { HtmlAgilityPack } from '@/article-parse/common/HtmlAgilityPack';
import { ITask } from '@/media-platform/baseTask';

/**
 *
 * @param taskData 任务体
 * @param eventCallback 事件回调
 * @param fileStat 文件句柄
 * @param pubResult 发布结果
 * @param maxThread 最大并发上传
 * @param cookie
 * @param userInfo
 */
const uploadVideo = async (
  taskData: SouHuShiPinVideoTaskInput,
  eventCallback: EventEmitter,
  fileStat: fs.Stats,
  pubResult: SouHuShiPinPublishResultOutput,
  maxThread: number,
  cookie: string,
  userInfo: SouHuShiPinUserResponse,
): Promise<SouHuShiPinUploadArgResponse | null | undefined> => {
  let fileHandle: fs.promises.FileHandle | null = null;
  try {
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    SetProgressEvent(eventCallback, 5, '正在获取上传参数', taskData.taskId);

    //获取上传参数

    const keyStr = Date.now().toString();
    cookie = cookie.replace(/tv-vlt/g, 'tv-vltOld');
    cookie = `${cookie};tv-vlt=${keyStr}`;

    const ketStr = `23DB79C859A861584E13B7807E7631C5_${userInfo.data.id}_${keyStr}`;
    const md5 = crypto.createHash('md5').update(ketStr).digest('hex');

    const uploadArgs = await getUploadArgResponse(cookie, taskData.title, taskData.video.size ?? 0, md5);
    await reportProcess(
      path.basename(taskData.video.localPath),
      Math.ceil(taskData.video.size ?? 0 / (1024 * 1024)),
      'init',
      uploadArgs,
    );
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!uploadArgs?.id) {
      // console.debug('获取视频上传参数失败', taskData.taskId, uploadArgs);
      pubResult.code = uploadArgs?.isold ? 111 : -1;
      pubResult.msg = `获取视频上传参数失败${uploadArgs?.isold ? ':请勿重复上传视频' : uploadArgs?.statusText}`;
      return null;
    }

    // 获取文件句柄
    fileHandle = await fs.promises.open(taskData.video.localPath, 'r');

    // 开始读取并上传文件
    let readIndex = 0;

    // 分片大小 8M
    const blockSize = 5242880;
    //总片数
    const totalPartNums = Math.ceil(fileStat.size / blockSize);

    // 并行上传
    const tasks: Array<Promise<UploadPartResponse>> = [];

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
    // const fileName = path.basename(taskData.video.localPath);
    // 文件大小小于等单个分片大小
    if (blockSize >= fileStat.size) {
      const buffer = Buffer.alloc(fileStat.size);
      const readData = await fileHandle.read(buffer, 0, fileStat.size, readIndex);
      if (readData.buffer.length > 0) {
        const uploadResult = await uploadVideoBinaryPart(uploadArgs, cookie, readData.buffer, 1, blockSize);

        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);

        if (!uploadResult?.id) {
          // console.debug('视频分片上传失败', taskData.taskId, uploadResult);
          pubResult.msg = `视频分片上传失败${uploadResult?.code ?? ''}`;
          pubResult.code = errorCode.data_error;

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
      while (readIndex < fileStat.size) {
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);

        partNum++;
        let canReadNum = blockSize;
        let buffer = Buffer.alloc(blockSize);
        if (readIndex + blockSize > fileStat.size) {
          canReadNum = fileStat.size - readIndex;
          buffer = Buffer.alloc(canReadNum);
        }

        const readData = await fileHandle.read(buffer, 0, canReadNum, readIndex);
        if (readData.buffer.length > 0) {
          tasks.push(uploadVideoBinaryPart(uploadArgs, cookie, readData.buffer, partNum, blockSize));

          if (tasks.length > maxThread) {
            const uploadResult = await Promise.race(tasks);

            if (!uploadResult?.id) {
              // console.debug('视频分片上传失败', taskData.taskId, uploadResult);
              pubResult.msg = `视频分片上传失败${uploadResult?.code ?? ''}`;
              pubResult.code = errorCode.data_error;
              return null;
            }

            //去除第一个任务，并等待完成
            const uploadResultNew = await tasks.splice(0, 1)[0];

            if (!uploadResultNew?.id) {
              // console.debug('视频分片上传失败', taskData.taskId, uploadResultNew);
              pubResult.msg = `视频分片上传失败${uploadResultNew?.code ?? ''}`;
              pubResult.code = errorCode.data_error;
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

      if (!uploadResult?.id) {
        // console.debug('视频分片上传失败', taskData.taskId, uploadResult);
        pubResult.msg = `视频分片上传失败${uploadResult?.code ?? ''}`;
        pubResult.code = errorCode.data_error;
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
    //视频上传完成
    const finishResult = await checkFinishUpload(uploadArgs, cookie, taskData.video.size ?? 0);
    await reportProcess(
      path.basename(taskData.video.localPath),
      Math.ceil(taskData.video.size ?? 0 / (1024 * 1024)),
      'success',
      uploadArgs,
    );
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!finishResult?.id) {
      // console.debug('视频上传完成校验失败', taskData.taskId, finishResult);
      pubResult.msg = `视频上传完成校验失败${finishResult?.code ?? ''}`;
      pubResult.code = errorCode.data_error;
      return null;
    }

    return uploadArgs;
    // endregion
  } catch (e) {
    logger.error(`搜狐视频视频上传异常失败，${taskData.taskId},${(e as Error)?.message}`);
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
export const publishSouHuShiPinVideo = async (
  cookie: string,
  taskData: SouHuShiPinVideoTaskInput,
  eventCallback: EventEmitter,
  maxThreadOut: number = 3,
  retryTimes: number = 3,
): Promise<PublishResult> => {
  logger.info(`搜狐视频视频发布 ${taskData.taskId}`);
  const pubResult: PublishResult = {
    code: 0,
    msg: 'ok',
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

    const userInfo = await getUserInfoResponse(cookie);

    //最多2个话题标签
    taskData.tags = taskData.tags?.slice(0, 2);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    const cap = await getUploadCapResponse(cookie);
    if (cap?.data) {
      pubResult.msg = '操作频繁，需要验证';
      pubResult.code = -1;
      return pubResult;
    }

    // 获取文件信息
    const fileStat = await fs.promises.stat(taskData.video.localPath);
    taskData.video.size = fileStat.size;
    SetProgressEvent(eventCallback, 2, '正在获取上传参数', taskData.taskId);

    // region 上传视频
    let uploadedVideoInfo = await uploadVideo(
      taskData,
      eventCallback,
      fileStat,
      pubResult,
      maxThreadOut,
      cookie,
      userInfo,
    );
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      if (!uploadedVideoInfo?.id) {
        if (i < retryTimes - 1 && pubResult.code != 111) {
          SetProgressEvent(eventCallback, 4, '上传失败,重试中', taskData.taskId);
          uploadedVideoInfo = await uploadVideo(
            taskData,
            eventCallback,
            fileStat,
            pubResult,
            maxThreadOut,
            cookie,
            userInfo,
          );
          continue;
        }
        logger.error(
          `视频上传失败 ${taskData.taskId} ${cookie} ${JSON.stringify(uploadedVideoInfo)} ${JSON.stringify(pubResult)}`,
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
    if (!uploadedVideoInfo?.id) {
      return pubResult;
    }
    // endregion

    SetProgressEvent(eventCallback, 85, '获取上传完成视频信息', taskData.taskId);

    // region 封面上传
    SetProgressEvent(eventCallback, 90, '封面读取中', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    //封面处理
    let coverUrl = '';
    if (taskData.cover?.pathOrUrl) {
      // 读取图片数据
      const imageData = await readImageData(taskData.cover.pathOrUrl, 'jpeg');

      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      if (!imageData.data) {
        // console.debug('读取封面失败', cookie, taskData.taskId, taskData.cover);
        pubResult.code = errorCode.io_error;
        pubResult.msg = `读取封面失败-${taskData.cover.pathOrUrl}`;
        logger.error(`封面读取失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${imageData.status}`);
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploadFail,
          pubResult?.msg ? pubResult.msg : '上传失败',
          taskData.taskId,
        );
        return pubResult;
      }
      SetProgressEvent(eventCallback, 90, '封面上传中', taskData.taskId);
      // 上传图片数据

      const fileName = `${Date.now()}.png`;
      let imageResult = await uploadImageResponse(cookie, imageData.data, fileName);
      for (let i = 0; i < retryTimes; i++) {
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);

        // 判断封面是否上传成功
        if (!imageResult?.url) {
          // console.debug('封面上传失败', taskData.taskId, taskData?.cover?.pathOrUrl, imageResult);
          if (i < retryTimes - 1) {
            imageResult = await uploadImageResponse(cookie, imageData.data, fileName);
            continue;
          }
          pubResult.code = errorCode.data_error;
          pubResult.msg = `封面上传失败:${taskData.cover.pathOrUrl}` + (imageResult?.status ?? '');
          logger.error(
            `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${JSON.stringify(imageResult)}`,
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
      if (!imageResult?.url) {
        pubResult.code = errorCode.data_error;
        pubResult.msg = `封面上传失败:${taskData.cover.pathOrUrl}` + (imageResult?.status ?? '');
        logger.error(
          `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${JSON.stringify(imageResult)}`,
        );
        SetProgressNewEvent(
          eventCallback,
          publishStatusEnum.uploadFail,
          pubResult?.msg ? pubResult.msg : '上传失败',
          taskData.taskId,
        );
        return pubResult;
      }
      coverUrl = imageResult.url;
    }

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    //endregion

    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    //存草稿
    let postData = buildPostData(uploadedVideoInfo, taskData, coverUrl);

    // 组装发布数据
    // console.debug('搜狐视频视频推送数据', taskData.taskId, cookie, postData);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);

    // 推送数据
    const keyStr = Date.now().toString();
    cookie = cookie.replace(/tv-vlt/g, 'otv-vltold');
    cookie = `${cookie};tv-vlt=${keyStr}`;
    let ketStr = `23DB79C859A861584E13B7807E7631C5_${uploadedVideoInfo.id}_${uploadedVideoInfo.userId}_${keyStr}`;
    if (taskData.pubType === 0) {
      ketStr = `23DB79C859A861584E13B7807E7631C5_${uploadedVideoInfo.userId}_${keyStr}`;
    }
    const md5 = crypto.createHash('md5').update(ketStr).digest('hex');

    postData = postData + `&ndltk=${md5}`;

    const publishResult = await publishVideoResponse(cookie, postData, taskData.pubType === 0, webProxy);
    // console.debug('搜狐视频视频推送返回数据', taskData.taskId, publishResult);

    pubResult.code = publishResult?.status === 1 ? 0 : errorCode.data_error;
    pubResult.msg = publishResult?.statusText ?? '';
    pubResult.publishId =
      publishResult?.status === 1
        ? publishResult?.id
          ? publishResult?.id.toString()
          : uploadedVideoInfo.id.toString()
        : '';

    if (pubResult.code == 0 && pubResult.publishId) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      if (pubResult.msg?.includes('msg:')) {
        pubResult.msg = pubResult.msg?.split('msg:')[1];
      }
      pubResult.msg = `发布失败${pubResult.msg ?? ''}`;
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
      logger.error(`搜狐视频视频发布失败 ${taskData.taskId} ${cookie} ${postData} ${JSON.stringify(publishResult)}`);
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
    logger.error(`搜狐视频视频发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
  }

  return pubResult;
};

export interface SouHuShiPinPublishResultOutput extends BaseResult {
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

export interface SouHuShiPinVideoTaskInput extends ITask {
  cancelToken?: CancelToken;

  /**
   * 0：存草稿 1：直接发布
   */
  pubType: 0 | 1;
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
  cover?: {
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
   * 描述
   */
  desc?: string;

  /**
   * 可见类型 0公开 3自己可见 2 密码可见
   */
  visibleType?: 0 | 3 | 2;

  /**
   * 标签
   */
  tags?: Array<string>;

  /**
   *创作雷荣申明
   * 0：无需申明
   * 3：AI生成
   * 4：虚构演绎
   * 5：AI数字人生成
   */
  contentMark?: {
    type?: 0 | 3 | 4 | 5;
  };

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}

const contentMarkTextObj = {
  3: { type: 3, content: '该内容为AI技术合成，请谨慎甄别', link: '', name: 'AI生成' },
  4: { type: 4, content: '该内容为虚构剧情，仅供娱乐', link: '', name: '虚构演绎' },
  5: { type: 5, content: '该内容为AI数字人技术合成，请谨慎甄别', link: '', name: 'AI数字人生成' },
};

/**
 * 组装发布数据
 * @param taskData  任务数据
 * @param uploadArgs
 * @param coverUrl
 */
const buildPostData = (
  uploadArgs: SouHuShiPinUploadArgResponse,
  taskData: SouHuShiPinVideoTaskInput,
  coverUrl: string,
): string => {
  const argsList = new Array<string>();
  argsList.push(`token=${uploadArgs.token}`);
  argsList.push(`status=1&id=${uploadArgs.id}&title=${encodeURIComponent(taskData.title ?? '')}`);
  if (taskData.desc?.includes('<p>')) {
    const html = new HtmlAgilityPack.HtmlDocument();
    html.LoadHtml(taskData.desc);
    const topics = html.DocumentNode.SelectNodes('//topic');
    if (topics.length) {
      for (const topic of topics) {
        topic.innerHTML = '';
        topic.textContent = '';
      }
    }
    argsList.push(
      `introduction=${encodeURIComponent(
        html.DocumentNode.InnerText() ?? html.DocumentNode.doc.textContent ?? '',
      )}&snsIds=&playType=0&pid=0`,
    );
  } else {
    argsList.push(`introduction=${encodeURIComponent(taskData.desc ?? '')}&snsIds=&playType=0&pid=0`);
  }

  //话题=>标签
  if (taskData.tags?.length) {
    const topics: Array<{ subjectName: string }> = [];
    for (const tag of taskData.tags) {
      topics.push({ subjectName: tag });
    }
    argsList.push('subjectList=' + encodeURIComponent(JSON.stringify(topics)));
  } else {
    argsList.push('subjectList=' + encodeURIComponent(JSON.stringify([])));
  }
  argsList.push('transientInfos=&userUploadPic=0&age=-1');

  argsList.push('limitDownload=0&downEditAble=true&extraInfos=0&categoriesId=329&cateCode=329');
  argsList.push(
    `education=-1&effectTitle=&effectid=0&fwd=${encodeURIComponent(
      `//my.tv.sohu.com/user/${uploadArgs.userId}&isold=false&job=-1&location=50&md5status=0&payStatus=2&pcatecode=0&photoUrls=&playLimit=0`,
    )}`,
  );

  argsList.push(`pname=&sex=50&srcip=${uploadArgs.srcip}`);
  argsList.push(`smallCover=${encodeURIComponent(coverUrl ? `${coverUrl}` : uploadArgs.smallCover ?? '')}`);
  argsList.push(`cover=${encodeURIComponent(coverUrl ? `${coverUrl}` : uploadArgs.smallCover ?? '')}`);
  argsList.push(`statusText=&tag=&userId=${uploadArgs.userId}&videoLevel=0&videoType=10&videostatus=29`);
  argsList.push(`vto=${encodeURIComponent(uploadArgs.vto)}&vtos=${encodeURIComponent(uploadArgs.vtos)}`);

  //密码可见时的密码
  argsList.push('passwd=' + (taskData['password'] ?? ''));
  //可见类型
  argsList.push(`plevel=${taskData.visibleType ?? 0}`);
  //圈子
  argsList.push('groupId=');

  //创作申明
  if (taskData.contentMark?.type && contentMarkTextObj[taskData.contentMark?.type]) {
    argsList.push(`contentMark=${encodeURIComponent(JSON.stringify(contentMarkTextObj[taskData.contentMark.type]))}`);
    argsList.push(`${encodeURIComponent('contentMarkObj[markType]')}=${taskData.contentMark.type}`);
    argsList.push(
      `${encodeURIComponent('contentMarkObj[name]]')}=${encodeURIComponent(
        contentMarkTextObj[taskData.contentMark.type].name,
      )}`,
    );
    argsList.push(
      `${encodeURIComponent('contentMarkObj[defaultText]')}=${encodeURIComponent(
        contentMarkTextObj[taskData.contentMark.type].content,
      )}`,
    );
  } else {
    argsList.push(`${encodeURIComponent('contentMarkObj[markType]')}=0`);
    argsList.push(`${encodeURIComponent('contentMarkObj[name]]')}=${encodeURIComponent('无需标注')}`);
    argsList.push(`${encodeURIComponent('contentMarkObj[defaultText]')}=`);
    argsList.push('&contentMark=');
  }

  //原创
  // const origin = taskData.isOriginal?.toString();
  // if (origin == '1') {
  //   argsList.push('publisher=1');
  // } else argsList.push('publisher=0');

  //定时发布
  argsList.push('releaseTime=0');

  return argsList.join('&');
};
