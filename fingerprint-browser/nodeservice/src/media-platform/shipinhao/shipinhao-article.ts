import { publish } from './shipinhao-article.service';

import { getUploadAuthKey } from './shipinhao-base.service';
import { Guid, logger, publishStatusEnum, SetProgressEvent, SetProgressNewEvent, Task } from '../../utils';
import { EventEmitter } from 'events';
import { AxiosError } from 'axios';
import { getUserinfo } from './shipinhao-base.service';

import { BaseResult } from '../baseResult';
import { errorCode } from '../errorCode';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import {
  ShipinhaoActivityInfo,
  ShipinhaoCollectionInfo,
  ShipinhaoFriendInfo,
  ShipinhaoGoodsInfo,
  ShipinhaoLocationInfo,
} from '../';
import { ImageInfo, ListItemInfo } from '../baseModel';

import { uploadImageList } from './shipinhao-article.service';
import { PlatformMusicInfo } from '../model';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { ShipinhaoContentStatement } from './shipinhao-types';

/**
 * 视频发布
 * @param cookie
 * @param taskData 发布任务数据体
 * @param eventCallback 事件回调
 * @param finderUsername 用户id信息，可选，默认空
 * @param uin 用户uin信息，默认0
 * @param retryTimes 最大重试次数
 */
export const shipinhaoPublishDynamic = async (
  cookie: string,
  taskData: ShipinhaoDynamicTaskInput,
  eventCallback: EventEmitter,
  finderUsername?: string,
  uin: number = 0,
  retryTimes: number = 3,
): Promise<ShipinhaoPublishResultOutput> => {
  console.group('视频号图文发布', taskData.taskId, finderUsername);
  const pubResult: ShipinhaoPublishResultOutput = {
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
    // 上传id
    const innerTaskId = Guid.NewGuid().toString();
    const clientId = Guid.NewGuid().toString();

    if (!(taskData.images?.length > 0)) {
      console.debug('至少需要一张图片');
      pubResult.code = errorCode.data_error;
      pubResult.msg = '至少需要一张图片';
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult?.msg ? pubResult.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }

    //最多支持18张图
    taskData.images = taskData.images.slice(0, 18);

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    SetProgressEvent(eventCallback, 1, '准备上传中', taskData.taskId);

    // region 获取上传前准备信息
    const rawBuffer = '';
    if (!uin) {
      let userInfo = await getUserinfo(cookie);

      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      uin = userInfo.data?.finderUser?.uin ?? 0;
      finderUsername = userInfo.data?.finderUser?.finderUsername ?? '';
      for (let i = 0; i < retryTimes; i++) {
        //取消任务执行
        taskData.cancelToken?.throwIfCancelled(privateKey);
        if (!uin) {
          const errCode = userInfo?.errCode;
          if (i < retryTimes - 1) {
            await Task.Delay(1000);
            if (!finderUsername) {
              userInfo = await getUserinfo(cookie);
              uin = userInfo.data?.finderUser?.uin ?? 0;
              finderUsername = userInfo.data?.finderUser?.finderUsername ?? '';
            } else {
              const tmpKey = await getUploadAuthKey(cookie, finderUsername);
              uin = tmpKey?.data?.uin ?? 0;
              if (userInfo) {
                userInfo['auth'] = tmpKey;
                userInfo.errMsg = tmpKey.errMsg;
                userInfo.errCode = tmpKey.errCode;
              } else {
                userInfo = { errCode: tmpKey?.errCode, errMsg: tmpKey?.errMsg };
              }
            }

            continue;
          }
          pubResult.code = errCode ?? errorCode.data_error;
          pubResult.msg = '获取用户信息失败' + (errCode == 300334 || errCode == 300333 ? '登录失效' : userInfo.errMsg);
          logger.error(`获取用户信息失败 ${taskData.taskId} ${cookie} ${JSON.stringify(userInfo)}`);
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
    if (!taskData.uin) {
      taskData.uin = uin;
    }

    //获取上传认证参数
    const uploadAuthData = await getUploadAuthKey(cookie, finderUsername ?? '');

    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);

    if (!uploadAuthData?.data?.authKey) {
      const errCode = uploadAuthData?.errCode;
      console.debug('获取上传认证参数失败', taskData.taskId, uploadAuthData);
      pubResult.code = errCode > 0 ? errCode : errorCode.data_error;
      pubResult.msg = '获取上传认证参数失败:' + uploadAuthData?.errMsg;
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.uploadFail,
        pubResult?.msg ? pubResult.msg : '上传失败',
        taskData.taskId,
      );
      return pubResult;
    }

    // region 上传图片
    const imgInfoList: Array<PubImageInfo> = [];
    let processCount = 0;
    for (const img of taskData.images) {
      //取消任务执行
      taskData.cancelToken?.throwIfCancelled(privateKey);

      SetProgressEvent(eventCallback, (80 / taskData.images.length) * processCount + 5, '图片上传中', taskData.taskId);
      processCount++;
      for (let i = 0; i < retryTimes; i++) {
        const imgInfo = await uploadImageList(
          img.pathOrUrl,
          taskData.taskId,
          innerTaskId,
          uin,
          uploadAuthData.data.authKey,
          pubResult,
        );
        //成功
        if (imgInfo?.DownloadURL) {
          imgInfoList.push({
            url: `https://finder.video.qq.com${imgInfo?.DownloadURL?.split('qq.com')[1]}`,
            md5sum: imgInfo.md5 ?? '',
            fileSize: img.size ?? 0,
            thumbUrl: imgInfo.DownloadURL,
            fullThumbUrl: imgInfo.DownloadURL,
            width: img.width ?? 0,
            height: img.height ?? 0,
            mediaType: 2,
            videoPlayLen: 0,
            urlCdnTaskId: '',
          });
          break;
        }
        //失败
        else {
          if (i < retryTimes - 1) {
            await Task.Delay(3000);
            continue;
          }
          pubResult.code = pubResult.code > 0 ? pubResult.code : -1;
          pubResult.msg = pubResult.msg ? pubResult.msg : `图片上传失败${img.pathOrUrl}`;
          SetProgressNewEvent(
            eventCallback,
            publishStatusEnum.uploadFail,
            pubResult?.msg ? pubResult.msg : '上传失败',
            taskData.taskId,
          );
          return pubResult;
        }
      }
    }
    // endregion

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '上传完成', taskData.taskId);
    //取消任务执行
    taskData.cancelToken?.throwIfCancelled(privateKey);
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送中', taskData.taskId);
    SetProgressEvent(eventCallback, 95, '正在推送数据', taskData.taskId);

    //取消任务执行
    taskData.cancelToken?.disable(privateKey);
    // region 组装并推送数据
    // 组装发布数据
    const publishResult = await publish(cookie, taskData, imgInfoList, finderUsername, rawBuffer, clientId, webProxy);
    if (taskData.pubType === 0) {
      pubResult.code = publishResult?.errCode ?? 2;
      pubResult.msg = publishResult.errMsg ?? '';
    } else {
      pubResult.code = publishResult?.data?.baseResp?.errcode ?? 2;
      pubResult.msg = publishResult?.data?.baseResp?.errmsg ?? publishResult.errMsg ?? '';
    }

    if (publishResult?.data?.baseResp?.errcode?.toString() == '-11224') {
      pubResult.msg = '视频号管理员完成实名且绑定手机号后才可以发表';
    }
    const transCoverUrl = imgInfoList[0].thumbUrl ?? imgInfoList[0].fullThumbUrl;
    pubResult.publishId = (transCoverUrl.includes('encfilekey=') ? transCoverUrl.split('encfilekey=')[1] : '').split(
      '&',
    )[0];
    if (pubResult.code == 0) {
      SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '推送成功', taskData.taskId);
      SetProgressEvent(eventCallback, 100, '发布成功', taskData.taskId);
    } else {
      pubResult.publishId = undefined;
      logger.error(
        `视频号图文发布失败 ${taskData.taskId} ${cookie} ${JSON.stringify(taskData)} ${JSON.stringify(publishResult)}`,
      );
      SetProgressNewEvent(
        eventCallback,
        publishStatusEnum.pushFail,
        pubResult?.msg ? pubResult.msg : '推送失败',
        taskData.taskId,
      );
      SetProgressEvent(eventCallback, 100, '发布失败', taskData.taskId);
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
      pubResult.msg = `发布失败，${e?.toString() ?? ''}`;
      pubResult.errorInfo = e?.toString();
    }
    SetProgressNewEvent(
      eventCallback,
      publishStatusEnum.pushFail,
      pubResult?.msg ? pubResult.msg : '推送失败',
      taskData.taskId,
    );
    logger.error(`视频号图文发布,异常失败 ${taskData.taskId} ${cookie} ${JSON.stringify(pubResult)}`);
  } finally {
    if (pubResult?.code === 300333) {
      pubResult.msg = '登录失效';
    } else if (pubResult?.code === 300334) {
      pubResult.msg = '登录失效，同一微信授权了新账号。';
    } else if (pubResult?.code == 300330) {
      pubResult.msg = '未登录';
    } else if (pubResult?.code == 300002) {
      pubResult.msg = '官方平台在校验音乐/位置/定时信息时失败了，请重新编辑后发布。';
    }
  }

  return pubResult;
};

export interface ShipinhaoPublishResultOutput extends BaseResult {
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

export interface ShipinhaoDynamicTaskInput {
  cancelToken?: CancelToken;
  /**
   * 发布类型
   * 0 存草稿
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
  /**
   * 图片信息列表
   */
  images: Array<ImageInfo>;
  // /**
  //  * 封面信息
  //  */
  // cover: {
  //   /**
  //    * 封面宽度
  //    */
  //   width?: number;
  //   /**
  //    * 封面高度
  //    */
  //   height?: number;
  //   /**
  //    * 封面字节数大小
  //    */
  //   size?: number;
  //   /**
  //    * 封面url或本地路径
  //    */
  //   pathOrUrl: string;
  // };

  /**
   * 图文标题
   */
  title: string;

  /**
   *  描述
   */
  desc?: string;

  /**
   * 账号uin来自获取的账号信息中uin
   */
  uin: number;

  /**
   * 账号id，来自账号信息获取接口中finderUsername
   */
  finderUsername: string;

  /**
   * at用户 列表
   */
  mentionUser?: Array<ShipinhaoFriendInfo>;

  /**
   *  商品
   */
  goods?: ShipinhaoGoodsInfo;

  /**
   * 合集
   */
  collection?: ShipinhaoCollectionInfo;

  /**
   * 短剧
   */
  drama?: ListItemInfo;

  /**
   * 活动
   */
  event?: ShipinhaoActivityInfo;

  /**
   * 话题---自定义
   */
  topics?: Array<string>;

  /**
   *视频号地点信息
   */
  location?: ShipinhaoLocationInfo;

  /**
   * 音乐信息
   */
  music?: PlatformMusicInfo;

  /**
   * 创作申明
   */
  statement?: ShipinhaoContentStatement;

  /**
   * 定时发布时间戳 10位
   */
  effectiveTime?: number;

  /**
   * 代理参数
   */
  proxy?: KuaiDaiLiProxy;
}

export interface PubImageInfo {
  url: string;
  fileSize: number;
  thumbUrl: string;
  fullThumbUrl: string;
  mediaType: 2;
  videoPlayLen: 0;
  width: number;
  height: number;
  md5sum: string;
  urlCdnTaskId: '';
}
