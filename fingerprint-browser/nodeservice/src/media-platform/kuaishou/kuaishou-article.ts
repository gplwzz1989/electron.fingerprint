import {
  Guid,
  htmlDecode,
  logger,
  publishStatusEnum,
  readImageData,
  SetProgressEvent,
  SetProgressNewEvent,
  stepWaitTime,
  Task,
} from '@/utils';
import { KuaishouFriendInfo } from './kuaishou-friend.service';
import { KuaishouGoodsInfo } from './kuaishou-shop.service';
import { KuaishouLocationInfo } from './kuaishou-location.service';
import { KuaishouTopicInfo } from './kuaishou-topic.service';
import { ImageInfo } from '../baseModel';
import { errorCode } from '../errorCode';
import { AxiosError } from 'axios';
import { EventEmitter } from 'events';
import { KuaishouPublishResultOutput } from './kuaishou-video';
import {
  getUploadImageArgs,
  publish,
  saveUploadedImages,
  uploadCoverImage,
  UploadCoverImageResponse,
  uploadImage,
  UploadImageArgsResponse,
  uploadImageComplete,
  uploadImageFinish,
} from './kuaishou-article.service';
import { regex } from './kuaishou-base.service';
import { KuaishouMusicInfo } from './kuaishou-music.service';
import { KuaishouMediaContent } from './kuaishou-content-list.service';
import { getKuaishouContentList, getKuaishouTopic } from './kuaishou-common';
import { HtmlDocument } from '@/htmlAgilityPack';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import { setActivityResponse } from '@/media-platform/kuaishou/kuaishou-activity.service';
import { KuaiShouMiniAppInfo } from '@/media-platform/kuaishou/kuaishou-miniapp.service';

/**
 * 发布快手视频
 * @param cookie
 * @param taskData 发布任务数据体
 * @param eventCallback 回调事件
 * @param retryTimes 最大重试次数
 */
export const publishKuaishouDynamic = async (
  cookie: string,
  taskData: KuaishouDynamicTaskInput,
  eventCallback: EventEmitter,
  retryTimes: number = 3,
): Promise<KuaishouPublishResultOutput> => {
  logger.info(`快手图文发布 ${taskData.taskId}`);
  const pubResult: KuaishouPublishResultOutput = {
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
    SetProgressEvent(eventCallback, 1, '准备上传图片', taskData.taskId);

    if (!(taskData.images?.length > 0)) {
      pubResult.code = 2;
      pubResult.msg = '最少需要一张图片';
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult?.msg ? pubResult.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }

    //最多支持31张图
    taskData.images = taskData.images.slice(0, 31);

    SetProgressEvent(eventCallback, 3, '正在上传图片', taskData.taskId);

    const match = regex.exec(cookie);
    const webapiId = match ? match[1] : Guid.NewGuid().toString().replace(/-/g, '');

    // region 图片上传
    const imgInfoList: Array<ImageInfo> = [];
    let processCount = 0;
    const contentInfo = { fileId: 0, atlasId: 0 };
    for (const img of taskData.images) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      SetProgressEvent(eventCallback, (80 / taskData.images.length) * processCount + 5, '图片上传中', taskData.taskId);
      processCount++;
      let imageUploadResult = await uploadImageProcess(
        taskData.taskId,
        img.pathOrUrl,
        cookie,
        webapiId,
        contentInfo.fileId,
        contentInfo.atlasId,
        pubResult,
      );
      for (let i = 0; i < retryTimes; i++) {
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);
        if (!imageUploadResult?.data || !(imageUploadResult?.data?.uploadInfo?.length > 0)) {
          if (i < retryTimes - 1 && pubResult?.code != -100) {
            imageUploadResult = await uploadImageProcess(
              taskData.taskId,
              img.pathOrUrl,
              cookie,
              webapiId,
              contentInfo.fileId,
              contentInfo.atlasId,
              pubResult,
            );
            continue;
          }
          pubResult.code = pubResult?.code ?? errorCode.data_error;
          pubResult.msg = pubResult?.msg ?? `图片上传失败${img.pathOrUrl}`;
          logger.error(
            `图片上传失败 ${taskData.taskId} ${cookie} ${img.pathOrUrl} ${JSON.stringify(
              imageUploadResult,
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
          contentInfo.fileId = imageUploadResult.data.fileId;
          contentInfo.atlasId = imageUploadResult.data.atlasId;
          imgInfoList.push({
            width: img.width ?? 4096,
            height: img.height ?? 4096,
            pathOrUrl: imageUploadResult.data.uploadInfo[0].blobKey,
          });
          break;
        }
      }
      if (!imageUploadResult?.data?.fileId) {
        pubResult.code = pubResult?.code ?? errorCode.data_error;
        pubResult.msg = pubResult?.msg ?? '图片上传失败';
        logger.error(
          `图片上传失败 ${taskData.taskId} ${cookie} ${img.pathOrUrl} ${JSON.stringify(
            imageUploadResult,
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
    }

    // endregion

    // region 上传封面
    SetProgressEvent(eventCallback, 90, '封面上传中', taskData.taskId);
    let coverUploadResult = await uploadCoverProcess(
      cookie,
      taskData.taskId,
      taskData.cover.pathOrUrl,
      webapiId,
      imgInfoList[0].pathOrUrl,
      pubResult,
    );
    for (let i = 0; i < retryTimes; i++) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      if (!coverUploadResult?.data?.coverKey) {
        if (i < retryTimes - 1 && pubResult?.code != -100) {
          coverUploadResult = await uploadCoverProcess(
            cookie,
            taskData.taskId,
            taskData.cover.pathOrUrl,
            webapiId,
            imgInfoList[0].pathOrUrl,
            pubResult,
          );
          continue;
        }
        pubResult.code = pubResult?.code ?? errorCode.data_error;
        pubResult.msg = pubResult?.msg ?? `封面上传失败${taskData.cover.pathOrUrl}`;
        logger.error(
          `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${JSON.stringify(
            coverUploadResult,
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
    if (!coverUploadResult?.data?.coverKey) {
      pubResult.code = pubResult?.code ?? errorCode.data_error;
      pubResult.msg = pubResult?.msg ?? `封面上传失败${taskData.cover.pathOrUrl}`;
      logger.error(
        `封面上传失败 ${taskData.taskId} ${cookie} ${taskData.cover.pathOrUrl} ${JSON.stringify(
          coverUploadResult,
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
    // endregion

    //region 保存正文图片
    await saveUploadedImages(
      cookie,
      contentInfo.fileId,
      contentInfo.atlasId,
      imgInfoList.map((x) => x.pathOrUrl),
      webapiId,
    );
    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    //endregion

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    // region 组装并推送数据
    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    //组装发布数据
    const postData = await buildPostData(
      taskData,
      coverUploadResult.data.coverKey,
      webapiId,
      contentInfo.fileId,
      contentInfo.atlasId,
      cookie,
    );
    console.debug('快手图文推送数据', taskData.taskId, cookie, postData);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    //不可取消
    taskData.cancelToken?.disable(privateKey);

    //推送数据
    const publishResult = await publish(cookie, postData, webProxy);
    console.debug('快手图文推送返回数据', publishResult);

    pubResult.code = publishResult?.result == 1 ? 0 : publishResult.result ?? 2;
    pubResult.msg = publishResult?.message;

    if (pubResult.code == 0) {
      pubResult.publishId = publishResult.currentTime.toString().substring(0, 10);
      const postJo = JSON.parse(postData);
      //查询正式的时间作为publishId
      const pubContent = await getPublishId(
        cookie,
        postJo['caption'],
        parseInt(pubResult.publishId),
        imgInfoList.length,
      );
      if (pubContent?.uploadTime) {
        pubResult.publishId = pubContent.uploadTime.toString().substring(0, 10);
      }
      if (taskData.publishTime) {
        pubResult.publishId = taskData.publishTime.toString().substring(0, 10);
      }
      if (taskData.publishTime) {
        pubResult.publishId = taskData.publishTime.toString().substring(0, 10);
      }
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
      logger.error(
        `快手图文发布失败 ${taskData.taskId} ${cookie}  ${JSON.stringify(postData)} ${JSON.stringify(publishResult)}`,
      );
    }

    return pubResult;
    // endregion
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
    logger.error(`快手图文发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
    console.groupEnd();
  }

  return pubResult;
};

export interface KuaishouDynamicTaskInput {
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
   * 图片信息列表
   */
  images: Array<ImageInfo>;
  /**
   *  描述
   */
  desc?: string;

  /**
   * 话题
   */
  topics?: Array<KuaishouTopicInfo>;

  /**
   * 好友
   */
  mentionedUser?: Array<KuaishouFriendInfo>;

  /**
   *地理位置
   */
  location?: KuaishouLocationInfo;

  /**
   * 可见类型
   * 1公开   4好友可见   2私密
   *
   */
  visibilityType: number;

  /**
   * 需要挂载的商品
   */
  goods?: KuaishouGoodsInfo;

  /**
   * 音乐信息
   */
  music?: KuaishouMusicInfo;

  /**
   * 定时发布，13位时间戳，不定时时默认为0
   */
  publishTime?: number;

  /**
   * 合集id
   */
  collectionId?: number;

  /**
   * 代理次阿叔
   */
  proxy?: KuaiDaiLiProxy;

  /**
   * 小程序挂载
   */
  miniAppInfo?: KuaiShouMiniAppInfo;

  /**
   * 作者申明
   */
  declareInfo?: {
    /**
     * 1：内容为ai生成
     * 2：演绎情节，仅供娱乐
     * 3:个人观点，仅供参考
     * 4:素材来源于网络，暂不支持
     */
    source?: 1 | 2 | 3 | 4;
  };
}

/**
 * 单图片上传流程
 * @param taskId
 * @param imgUrlPath 图片url或磁盘路径
 * @param cookie
 * @param webapiId
 * @param fileId
 * @param atlasId
 * @param pubResult
 */
const uploadImageProcess = async (
  taskId: string,
  imgUrlPath: string,
  cookie: string,
  webapiId: string,
  fileId: number,
  atlasId: number,
  pubResult: KuaishouPublishResultOutput,
): Promise<UploadImageArgsResponse | null> => {
  try {
    //获取图片上传参数
    const uploadImageArgs = await getUploadImageArgs(cookie, fileId, atlasId, webapiId);

    //提取图片上传参数
    if (!uploadImageArgs?.data?.fileId || !(uploadImageArgs?.data?.uploadInfo?.length > 0)) {
      console.debug('获取图片上传参数失败', taskId, uploadImageArgs);
      pubResult.code = errorCode.data_error;
      pubResult.msg = '获取图片上传参数失败:' + (uploadImageArgs?.message ?? '');
      return null;
    }
    const imageUploadNode = uploadImageArgs.data.uploadInfo[0];

    //读取图片数据
    const imageData = await readImageData(imgUrlPath, 'jpeg');
    if (!imageData?.data) {
      console.debug('读取图片失败', imgUrlPath, taskId, imageData.status);
      pubResult.code = errorCode.data_error;
      pubResult.msg = `读取图片失败:${imgUrlPath}` + (imageData.status ?? '');
      return null;
    }

    //上传图片数据，返回上传成功的图片url
    const imageResult = await uploadImage(imageData.data, imageUploadNode.token);

    //判断封面是否上传成功
    if (!imageResult?.checksum) {
      console.debug('图片上传失败', taskId, imgUrlPath, imageResult);
      pubResult.code = -1;
      pubResult.msg = `图片上传失败:${imgUrlPath}`;
      return null;
    }

    //图片数据上传完成通知
    const uploadComplete = await uploadImageComplete(imageUploadNode.token);
    if (uploadComplete?.result != undefined && uploadComplete?.result > 1) {
      console.debug('图片上传提交失败', taskId, imgUrlPath, uploadComplete);
      pubResult.code = -1;
      pubResult.msg = `图片上传失败:${imgUrlPath}`;
      return null;
    }

    //单个图片上传流程完成
    const uploadFinish = await uploadImageFinish(
      cookie,
      uploadImageArgs.data.fileId,
      uploadImageArgs.data.atlasId,
      imageUploadNode.blobKey,
      webapiId,
    );
    if (uploadComplete?.result != undefined && uploadFinish.result != 1) {
      console.debug('图片上传流程校验失败', taskId, imgUrlPath, uploadFinish);
      pubResult.code = -1;
      pubResult.msg = `图片上传失败:${imgUrlPath}`;
      return null;
    }

    pubResult.code = 0;
    pubResult.msg = '';
    return uploadImageArgs;
  } catch (e) {
    console.error('快手图片上传失败', taskId, e);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = `图片上传失败${imgUrlPath}`;
    return null;
  }
};

/**
 * 封面上传
 * @param cookie
 * @param taskId
 * @param imgUrlPath  封面地址
 * @param webapiId
 * @param blobKey
 * @param pubResult
 */
const uploadCoverProcess = async (
  cookie: string,
  taskId: string,
  imgUrlPath: string,
  webapiId: string,
  blobKey: string,
  pubResult: KuaishouPublishResultOutput,
): Promise<UploadCoverImageResponse | null> => {
  try {
    //读取图片数据
    const imageData = await readImageData(imgUrlPath, 'jpeg');
    if (!imageData?.data) {
      console.debug('读取封面图片失败', imgUrlPath, taskId, imageData.status);
      pubResult.code = errorCode.data_error;
      pubResult.msg = `读取封面图片失败:${imgUrlPath}` + (imageData.status ?? '');
      return null;
    }

    //上传图片数据，返回上传成功的图片url
    const imageResult = await uploadCoverImage(cookie, imageData.data, blobKey, webapiId);

    //判断封面是否上传成功
    if (!imageResult?.data?.coverKey) {
      console.debug('封面图片上传失败', taskId, imgUrlPath, imageResult);
      pubResult.code = -1;
      pubResult.msg = `封面上传失败:${imgUrlPath}`;
      return null;
    }

    pubResult.code = 0;
    pubResult.msg = '';
    return imageResult;
  } catch (e) {
    console.error('快手封面图片上传失败', taskId, e);
    pubResult.code = errorCode.unknown_error;
    pubResult.msg = `封面上传失败${imgUrlPath}`;
    return null;
  }
};

/**
 * 组装推送数据
 * @param taskData 发布任务体
 * @param coverKey 封面key
 * @param webapiId
 * @param fileId
 * @param atlasId
 * @param cookie
 */
const buildPostData = async (
  taskData: KuaishouDynamicTaskInput,
  coverKey: string,
  webapiId: string,
  fileId: number,
  atlasId: number,
  cookie: string,
): Promise<string> => {
  const re = {
    atlasId: atlasId,
    fileId: fileId,
    'kuaishou.web.cp.api_ph': webapiId,
    photoStatus: 1,
  };
  re['declareInfo'] = { source: 0, platform: 0, time: 0, location: '', sourceId: 0, sourceName: '' };

  //封面
  re['coverKey'] = coverKey;

  let descStr = taskData?.desc?.toString() ?? '';

  //富文本话题好友
  if (descStr?.includes('<p') && descStr?.includes('</p>')) {
    const html = new HtmlDocument();
    html.LoadHtml(descStr);

    const pList = html.DocumentNode.SelectNodes('//p');
    if (pList?.length > 0) {
      //话题
      const topics = html.DocumentNode.SelectNodes('//topic') ?? [];
      const activitis = html.DocumentNode.SelectNodes('//activity') ?? [];
      topics.push(...activitis);
      if (topics?.length > 0) {
        let topicNum = 0;
        for (const item of topics) {
          if (topicNum >= 4) {
            item.parentNode?.removeChild(item);
            continue;
          }
          let topicStr = htmlDecode(decodeURIComponent(item.getAttribute('raw') ?? ''));
          if (!topicStr?.startsWith('{')) {
            const text = item.getAttribute('text');
            const topicsTmp = await getKuaishouTopic(cookie, text ?? '');
            if (topicsTmp?.dataList?.length) {
              topicStr = JSON.stringify(topicsTmp.dataList[0]);
            } else {
              continue;
            }
          }
          topicNum++;
          const topicJo = JSON.parse(topicStr);
          if (topicJo?.raw?.activityId) {
            setActivityResponse(cookie, topicJo?.raw?.activityId);
          }
          item.textContent = `#${(topicJo?.raw as KuaishouTopicInfo)?.name ?? topicJo?.yixiaoerName} `;
        }
      }
      //好友
      const friends = html.DocumentNode.SelectNodes('//friend');
      if (friends?.length > 0) {
        for (const item of friends) {
          const friendStr = htmlDecode(decodeURIComponent(item.getAttribute('raw') ?? ''));
          if (!friendStr || !friendStr.startsWith('{')) {
            continue;
          }
          const friendJo = JSON.parse(friendStr);
          item.textContent = `@${friendJo?.raw?.userName ?? friendJo?.yixiaoerName}(O${
            friendJo?.raw?.userId ?? friendJo?.yixiaoerId ?? ''
          })`;
        }
      }
      //换行
      let newText = '';
      for (let pIndex = 0; pIndex < pList.length; pIndex++) {
        const pItem = pList[pIndex];
        newText = `${newText}${pItem.textContent}\n`;
      }
      descStr = htmlDecode(newText);
    }
  } else {
    // 话题
    if (taskData.topics?.length) {
      descStr = `${descStr} #${taskData.topics.map((obj) => obj.name).join(' #')}`;
    }

    // 好友
    if (taskData.mentionedUser?.length) {
      descStr = `@${taskData.mentionedUser
        .map((obj) => `${obj.userName}(O${obj.userId ?? ''})`)
        .join(' @')} ${descStr} `;
    }
  }

  //音乐
  if (taskData.music?.musicId) {
    re['musicId'] = taskData.music?.musicId;
  } else {
    re['musicId'] = '';
  }

  //地点
  if (taskData.location?.id) {
    re['poiId'] = taskData.location.id;
    re['latitude'] = taskData.location.latitude;
    re['longitude'] = taskData.location.longitude;
  } else {
    re['poiId'] = 0;
    re['latitude'] = 0;
    re['longitude'] = 0;
  }

  //可见类型
  re.photoStatus = taskData.visibilityType ?? 1;

  //内容
  re['caption'] = descStr;

  //定时发布
  re['publishTime'] = taskData.publishTime ?? 0;

  //关联商品
  if (taskData.goods?.associateTaskId?.taskId) {
    re['associateTasks'] = taskData.goods?.associateTaskId;
  }
  //挂载小程序
  else if (taskData.miniAppInfo?.associateTaskId) {
    re['associateTasks'] = [taskData.miniAppInfo.associateTaskId];
  }

  if (taskData.declareInfo?.source && taskData.declareInfo.source != 4) {
    re['declareInfo'] = { source: taskData.declareInfo.source };
  } else {
    re['declareInfo'] = { source: 0 };
  }
  //合集
  if (taskData.collectionId) {
    re['collectionId'] = taskData.collectionId;
  }
  return JSON.stringify(re);
};

/**
 * 获取publishId，模糊匹配，可能会出现不准确情况
 * @param cookie
 * @param pubDesc
 * @param publishTime
 * @param maxSecond
 */
const getPublishId = async (
  cookie: string,
  pubDesc: string,
  publishTime: number,
  maxSecond: number = 8,
): Promise<KuaishouMediaContent | null> => {
  if (maxSecond < 8) {
    maxSecond = 8;
  }
  const cursor = '9007199254740991';
  for (let i = 0; i < maxSecond; i++) {
    try {
      const contentResponse = await getKuaishouContentList(cookie, new Date(new Date().setHours(0)), cursor, '0', 10);
      if (contentResponse?.data && contentResponse?.data?.list?.length > 0) {
        for (const content of contentResponse.data.list) {
          const updateTime = parseInt(content?.uploadTime?.toString().substring(0, 10));
          const desc = content.title?.substring(0, 20)?.trim() ?? '';
          const compareDesc = pubDesc?.substring(0, 20)?.trim() ?? '';
          if (updateTime - publishTime < maxSecond && desc == compareDesc) {
            if (content?.unPublishCoverKey?.toString()) {
              if (i < maxSecond - 1) {
                await Task.Delay(stepWaitTime);
              } else {
                return content;
              }
            } else {
              return content;
            }
          } else {
            await Task.Delay(stepWaitTime);
          }
        }
      } else {
        if (i < maxSecond - 1) {
          await Task.Delay(stepWaitTime);
          continue;
        }
        break;
      }
    } catch (e) {
      if (i < maxSecond - 1) {
        await Task.Delay(stepWaitTime);
        continue;
      }
      break;
    }
  }
  return null;
};
