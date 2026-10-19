import { $http, HttpConfig } from '../../http';
import { buildShipinhaoTagInfo, getTimeStamp } from './shipinhao-base.service';
import * as crypto from 'crypto';
import {
  MediaType,
  ShipinhaoContentStatement,
  ShipinhaoTagInfo,
} from './shipinhao-types';
import * as buffer from 'buffer';
import { ShipinhaoFriendInfo } from './shipinhao-friend.service';
import { ShipinhaoGoodsInfo } from './shipinhao-shop.service';
import { ShipinhaoCollectionInfo } from './shipinhao-collection.service';
import { ShipinhaoActivityInfo } from './shipinhao-activity.service';
import { ShipinhaoLocationInfo } from './shipinhao-location.service';
import XMLWriter from 'xml-writer';
import { htmlDecode, isJson, logger } from '../../utils';
import { HtmlDocument } from '../../htmlAgilityPack';

import { CancelToken } from '../../utils/CancelToken';
import { KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { ImageInfo, ListItemInfo } from '@/media-platform';
import { BaseTask } from '@/media-platform/baseTask';

/**
 * 上传分片
 * @param videoData 视频分片数据
 * @param partNum 分片编号
 * @param uploadId 上传资源id
 * @param uin 微信号
 * @param fileName 文件名带后缀
 * @param fileSize 文件大小
 * @param innerTaskId 任务id，随机uuid，上传过程保持一致
 * @param authKey 认证token，来源于获取上传参数接口
 * @param fileType 资源类型，视频:20302 图片:20304
 * @param uploadList
 * @constructor
 */
export const uploadVideoPart = async (
  videoData: buffer.Buffer,
  partNum: number,
  uploadId: string,
  uin: number,
  fileName: string,
  fileSize: number,
  innerTaskId: string,
  authKey: string,
  fileType: MediaType,
  uploadList: Map<number, { PartNumber: number; ETag: string }>,
): Promise<UploadPartResult> => {
  // noinspection SpellCheckingInspection
  const headers = {
    'Content-MD5': crypto.createHash('md5').update(videoData).digest('hex').toString(),
    'X-Arguments': `apptype=251&filetype=${fileType}&weixinnum=${uin}&filekey=${encodeURIComponent(
      fileName,
    )}&filesize=${fileSize}&taskid=${innerTaskId}&scene=0`,
    Authorization: authKey,
    'Content-Type': 'application/octet-stream',
    Referer: 'https://channels.weixin.qq.com/platform/post/create',
    Origin: 'https://channels.weixin.qq.com',
    'User-Agent': HttpConfig.userAgent,
    Accept: 'application/json, text/plain, */*',
  };

  const url = `https://finderassistancea.video.qq.com/uploadpartdfs?PartNumber=${partNum}&UploadID=${uploadId}`;

  let result = await $http.put(url, buffer.Buffer.from(videoData), {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });
  if (!(result?.data && typeof result.data == 'object')) {
    result = await $http.put(url, buffer.Buffer.from(videoData), {
      headers: headers,
    });
  }
  if (result?.data && typeof result.data == 'object') {
    result.data['PartNum'] = partNum;
    uploadList.set(partNum, { PartNumber: partNum, ETag: result.data.ETag });
  } else {
    return { PartNum: -1, 'X-Errno': result.status, errMsg: '服务异常' };
  }
  return result.data;
};

export interface UploadPartResult {
  ETag?: string;
  PartNum: number;
  TransFlag?: string;
  'X-Errno': number;
  errMsg?: string;
}

/**
 * 上传完成提交
 * @param uin
 * @param fileName
 * @param uploadId
 * @param fileSize
 * @param innerTaskId
 * @param authKey
 * @param fileType
 */
export const applyUploadedVideoInfo = async (
  uin: number,
  fileName: string,
  uploadId: string,
  fileSize: number,
  innerTaskId: string,
  authKey: string,
  fileType: MediaType,
): Promise<ApplyUploadedVideoInfoResponse> => {
  // noinspection SpellCheckingInspection
  const headers = {
    'Content-MD5': 'null',
    'X-Arguments': `apptype=251&filetype=${fileType}&weixinnum=${uin}&filekey=${encodeURIComponent(
      fileName,
    )}&filesize=${fileSize}&taskid=${innerTaskId}&scene=0`,
    Authorization: authKey,
    Referer: 'https://channels.weixin.qq.com/platform/post/create',
    Origin: 'https://channels.weixin.qq.com',
    'User-Agent': HttpConfig.userAgent,
  };

  const postData = {};

  const url = `https://finder-assistant.mp.video.tencent-cloud.com/applyuploaddfs?&PartNumberMarker=1&UploadID=${uploadId}`;

  const result = await $http.put(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });
  return result.data;
};

export interface ApplyUploadedVideoInfoResponse {
  ListPartsResult: {
    PartNumberMarker: string;
    Part: Array<{
      PartNumber: string;
      ETag: string;
    }>;
  };
  'X-Errno': number;
}

/**
 *获取上传完成的视频信息
 * @param partResultList 分片上传结果列表
 * @param uin 微信代号
 * @param fileName 文件名带后缀
 * @param uploadId 上传id
 * @param fileSize 文件大小
 * @param innerTaskId 任务id，山川过程需要保持一致
 * @param authKey 认证key
 * @param fileType 资源类型，视频:20302 图片:20304
 * @constructor
 */
export const getUploadedVideoInfo = async (
  partResultList: Array<{ PartNumber: number; ETag: string }>,
  uin: number,
  fileName: string,
  uploadId: string,
  fileSize: number,
  innerTaskId: string,
  authKey: string,
  fileType: MediaType,
): Promise<UploadedVideoInfoResponse> => {
  // noinspection SpellCheckingInspection
  const headers = {
    'Content-MD5': 'null',
    'X-Arguments': `apptype=251&filetype=${fileType}&weixinnum=${uin}&filekey=${encodeURIComponent(
      fileName,
    )}&filesize=${fileSize}&taskid=${innerTaskId}&scene=2`,
    Authorization: authKey,
    Referer: 'https://channels.weixin.qq.com/',
    Origin: 'https://channels.weixin.qq.com',
    'User-Agent': HttpConfig.userAgent,
  };

  const postData = {
    TransFlag: '0_0',
    PartInfo: partResultList,
  };

  const url = `https://finderassistancea.video.qq.com/completepartuploaddfs?UploadID=${uploadId}`;

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });
  return result.data;
};

export interface UploadedVideoInfoResponse {
  DownloadURL: string;
  errMsg?: string;
  'X-Errno': number;
}

/**
 * 保存上传完成的视频信息
 * @param cookie
 * @param videoUrl 上传完成的视频url
 * @param videoWidth 视频像素宽度
 * @param videoHeight 视频像素高度
 * @param duration 视频时长,秒
 * @param fileSize 视频文件大小,字节
 * @param finderUsername 可循啊参数,默认空
 */
export const saveTmpPostDraft = async (
  cookie: string,
  videoUrl: string,
  videoWidth: number,
  videoHeight: number,
  duration: number,
  fileSize: number,
  finderUsername?: string,
): Promise<SaveTmpResponse> => {
  const url = 'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/post/post_clip_video';

  // noinspection JSSuspiciousNameCombination
  let targetHeight = videoHeight;
  let targetWidth = videoWidth;
  if (videoWidth <= videoHeight) {
    const bi = parseFloat((videoHeight / videoWidth).toFixed(5));
    if (videoWidth == videoHeight && videoHeight >= 1080) {
      targetHeight = 1080;
      targetWidth = 1080;
    } else if (videoHeight > 1920) {
      targetHeight = 1920;
      targetWidth = parseInt((1920 / bi).toFixed(0));
    }
  }
  const postData = {
    url: videoUrl,
    timeStart: 0,
    cropDuration: 0,
    height: videoHeight,
    width: videoWidth,
    x: 0,
    y: 0,
    clipOriginVideoInfo: {
      width: videoWidth,
      height: videoHeight,
      duration: duration,
      fileSize: fileSize,
    },
    traceInfo: {
      traceKey: `FPT_${getTimeStamp(10)}_1378746213`,
      uploadCdnStart: getTimeStamp(10),
      uploadCdnEnd: getTimeStamp(10),
    },
    targetWidth: targetWidth,
    targetHeight: targetHeight,
    type: 4,
    timestamp: getTimeStamp(13).toString(),
    _log_finder_uin: null,
    _log_finder_id: finderUsername,
    rawKeyBuff: null,
    pluginSessionId: null,
    scene: 7,
    reqScene: 7,
  };

  const headers = {
    cookie: cookie,
    referer: 'https://channels.weixin.qq.com/platform/post/create',
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface SaveTmpResponse {
  /**
   * 状态码
   */
  errCode: number;
  /**
   * 提示消息
   */
  errMsg: string;
  data?: {
    clipKey: string;
    /**
     * 草稿临时id
     */
    draftId: string;
  };
}

export interface ShipinhaoVideoTaskInput extends BaseTask {
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
  video: {
    /**
     * 时长-秒-可带小数
     */
    duration: number;
    /**
     * 视频宽度
     */
    width: number;
    /**
     * 视频高度
     */
    height: number;
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
   * 分享卡片封面
   */
  horizontalCover?: ImageInfo;

  /**
   *  描述
   */
  desc?: string;

  /**
   * 短标题
   */
  shortTitle?: string;

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
   * 是否原创
   * 0 否
   * 1 是
   */
  postFlag: number;

  /**
   * 创作申明
   */
  statement?: ShipinhaoContentStatement;

  /**
   * 扩展链接
   */
  link?: string;

  /**
   * 扩展文章标题，默认空
   */
  linkTitle?: string;

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
   * 定时发布时间戳 10位
   */
  effectiveTime?: number;

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
   *  代理参数
   */
  proxy?: KuaiDaiLiProxy;
}

/**
 * 准备数据，并推送到官方
 * @param cookie
 * @param taskData  发布任务体
 * @param videoUrl 上传完成的视频url
 * @param coverUrl 上传完成的封面url
 * @param fileMd5 视频文件md5
 * @param draftId 暂存的草稿id
 * @param clipKey 暂存的草稿id
 * @param finderUsername 可选参数,默认空
 * @param rawKeyBuff 可循啊参数，默认空
 * @param clientId 随机uuid
 * @param proxyAgent
 * @constructor
 */
export const publish = async (
  cookie: string,
  taskData: ShipinhaoVideoTaskInput,
  videoUrl: string,
  coverUrl: string,
  fileMd5: string,
  draftId: string,
  clipKey: string,
  finderUsername?: string,
  rawKeyBuff?: string,
  clientId?: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
  hCoverUrl?: string,
): Promise<ShipinhaoPublishResponse> => {
  const url = `https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/post/post_${
    taskData.pubType == 1 ? 'create' : 'draft'
  }`;

  const headers = {
    referer: 'https://channels.weixin.qq.com/platform/post/create',
    cookie: cookie,
    'Content-type': 'application/json',
  };

  const tagInfo = await buildShipinhaoTagInfo(
    cookie,
    taskData.statement,
    finderUsername ?? '',
    rawKeyBuff ?? '',
    proxyAgent,
  );
  const postData = buildPostData(
    taskData,
    videoUrl,
    coverUrl,
    fileMd5,
    draftId,
    clipKey,
    finderUsername ?? '',
    rawKeyBuff ?? '',
    clientId ?? '',
    hCoverUrl,
    tagInfo,
  );

  //logger.info(`视频号推送header，${JSON.stringify(headers)}`);
  logger.info(`视频号推送数据${taskData.taskId}\n${cookie}\n${postData}`);
  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });
  logger.info(`视频号推送返回数据${taskData.taskId}\n${JSON.stringify(result.data)}`);
  return result.data;
};
export const buildPostData = (
  taskData: ShipinhaoVideoTaskInput,
  videoUrl: string,
  coverUrl: string,
  fileMd5: string,
  draftId: string,
  clipKey: string,
  finderUsername: string,
  rawKeyBuff: string,
  clientId: string,
  hCoverUrl?: string,
  tagInfo?: ShipinhaoTagInfo,
): string => {
  //计算适配宽高比
  const rate = taskData.video?.height > 0 ? taskData.video?.width / taskData.video?.height : 0;
  let isFullPost = 1;
  if (rate > 0.857 && rate > 0) {
    isFullPost = 0;
  }

  let location = {};
  const locationAddress = taskData.location?.address?.trim() || taskData.location?.fullAddress?.trim() || '';
  if (taskData.location?.uid) {
    location = {
      latitude: taskData.location.latitude,
      longitude: taskData.location.longitude,
      city: taskData.location.city,
      poiName: taskData.location.name,
      address: locationAddress,
      poiClassifyId: taskData.location.uid,
    };
  } else if (taskData.location?.city) {
    location = {
      latitude: taskData.location.latitude,
      longitude: taskData.location.longitude,
      city: taskData.location.city,
      poiClassifyId: '',
    };
  }

  const xmlETag = new XMLWriter();

  //话题，好友/用户，地点数据预备
  const topics = taskData.topics?.length ? taskData.topics : [];
  const mentionUser = taskData?.mentionUser?.length ? taskData.mentionUser : [];
  const mentionedUser: Array<{ nickname: string }> = [];
  const mentionedUserNameList: Array<string> = [];
  let descStr = '';

  //兼容html中话题好友
  if (taskData.desc?.includes('<p') && taskData.desc?.includes('</p>')) {
    const html = new HtmlDocument();
    html.LoadHtml(taskData.desc);

    const pList = html.DocumentNode.SelectNodes('//p');
    if (pList?.length > 0) {
      const html = new HtmlDocument();
      html.LoadHtml(taskData.desc);

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
            let topicStr = htmlDecode(decodeURIComponent(item.getAttribute('raw') ?? ''));
            if (!topicStr?.startsWith('{')) {
              const text = item.getAttribute('text') ?? '';
              topicStr = JSON.stringify({ yixiaoerId: '1', yixiaoerName: text, raw: { id: 1, name: text } });
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
            const friendStr = htmlDecode(decodeURIComponent(item.getAttribute('raw') ?? ''));
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

        const strList: Array<string> = [];

        //分割
        for (const tmpKey of matches) {
          const preStr = newText.split(tmpKey)[0];
          if (preStr.length > 0) {
            strList.push(preStr.trimStart());
          }
          strList.push(tmpKey);
          newText = newText.replace(preStr + tmpKey, '');
        }
        if (newText?.trim()) {
          strList.push(newText.trim());
        }
        //创建话题 用户 描述数据
        xmlETag.startElement('finder');
        xmlETag.writeElement('version', 1);

        let viewNum = 0;
        const atList: Array<number> = [];

        //替换
        for (let i = 0; i < strList.length; i++) {
          const item = strList[i];
          if (item.includes('tmp_f')) {
            const jo = JSON.parse(tmpDataMap.get(item) ?? '{}');
            const nameStr = jo?.raw?.nickName ?? jo?.yixiaoerName;
            strList[i] = `@${nameStr} `;
            mentionedUserNameList.push(nameStr);
            mentionedUser.push({ nickname: nameStr });
            atList.push(viewNum - 1);
            viewNum += 2;
          } else if (item.includes('tmp_t')) {
            const jo = JSON.parse(tmpDataMap.get(item) ?? '{}');
            strList[i] = `#${jo?.raw?.name ?? jo?.yixiaoerName} `;
            viewNum += 2;
          } else {
            viewNum++;
          }
        }
        descStr = htmlDecode(strList.join(''));

        xmlETag.writeElement('valuecount', viewNum);
        xmlETag.startElement('style');
        xmlETag.writeElement('at', atList.join(','));
        xmlETag.endElement();

        let vNum = 0;
        for (let i = 0; i < strList.length; i++) {
          const item = strList[i];
          //话题
          if (item.startsWith('#')) {
            xmlETag.startElement(`value${vNum}`);
            xmlETag.writeElement('topic', `<![CDATA[${item.trim()}#]]>`);
            xmlETag.endElement();
            vNum++;
            xmlETag.writeElement(`value${vNum}`, '<![CDATA[ ]]>');
            vNum++;
          }
          //@用户/好友
          else if (item.startsWith('@')) {
            xmlETag.writeElement(`value${vNum}`, `<![CDATA[${item.trim()}]]>`);
            vNum++;
            xmlETag.writeElement(`value${vNum}`, '<![CDATA[ ]]>');
          } else {
            xmlETag.writeElement(`value${vNum}`, `<![CDATA[${item}]]>`);
            vNum++;
          }
        }

        xmlETag.endElement();

        console.log('创建xml成功：' + xmlETag.toString());
      }
    } else {
      descStr = html.DocumentNode.InnerText();
    }
  } else {
    //创建话题 用户 描述数据
    xmlETag.startElement('finder');
    xmlETag.writeElement('version', 1);
    // noinspection SpellCheckingInspection
    xmlETag.writeElement('valuecount', 1 + topics.length + mentionUser.length);
    xmlETag.startElement('style');
    let atIndex: string;
    if (mentionUser?.length > 0) {
      atIndex = '';
      const atStart = (topics?.length ?? 0) + 1;
      for (let at = 0; at < mentionUser?.length; at++) {
        atIndex = (atStart + at).toString() + ',';
      }
      atIndex = atIndex.substring(0, atIndex.length - 1);
    } else {
      atIndex = (topics?.length > 0 ? topics.length + 2 : 2).toString();
    }
    xmlETag.writeElement('at', atIndex);
    xmlETag.endElement();
    xmlETag.writeElement(
      'value0',
      '<![CDATA[' + (taskData?.desc?.toString()?.split('#')[0]?.split('@')[0] ?? '') + ']]>',
    );
    let v = 1;
    //话题
    if (topics?.length > 0)
      for (let i = 0; i < topics.length; i++) {
        const topicStr = topics[i];
        if (!topicStr) {
          continue;
        }
        xmlETag.startElement('value' + v);
        xmlETag.writeElement('topic', '<![CDATA[#' + topicStr + '#]]>');
        xmlETag.endElement();
        v++;
      }
    //@用户/好友
    if (mentionUser?.length > 0) {
      for (let i = 0; i < mentionUser.length; i++) {
        xmlETag.writeElement('value' + v, '<![CDATA[@' + (mentionUser[i].nickName ?? '') + ']]>');
        v++;
        mentionedUser.push({ nickname: mentionUser[i].nickName });
        mentionedUserNameList.push(mentionUser[i].nickName);
      }
    }
    xmlETag.endElement();

    descStr =
      (taskData?.desc ?? '') +
      (mentionedUserNameList?.length > 0 ? '@' + mentionedUserNameList.join('@') : '') +
      (topics?.length > 0 ? '#' + topics.join('#') : '');
    console.log('创建xml成功：' + xmlETag.toString());
  }

  //短标题
  const shortTitles: Array<{ shortTitle: string }> = [];
  if (taskData.shortTitle) {
    shortTitles.push({ shortTitle: taskData.shortTitle });
  }

  // noinspection SpellCheckingInspection
  const re = {
    longitude: 0,
    latitude: 0,
    feedLongitude: 0,
    feedLatitude: 0,
    originalFlag: 0,
    objectType: 0,
    //原创
    postFlag: taskData?.postFlag ?? 0,
    isFullPost: isFullPost, //新字段 宽高比小于6/7为0，大于为1
    handleFlag: taskData.video?.duration > 60 ? 2 : 1,
    topics: topics,
    objectDesc: {
      description: descStr,
      event: {},
      extReading: {
        //拓展链接
        link: taskData.link?.toString() ?? '',
        title: taskData.linkTitle?.toString() ?? '',
      },
      mediaType: 4,
      location: location,
      topic: {
        finderTopicInfo: xmlETag?.toString()?.replace(/&lt;/g, '<')?.replace(/&gt;/g, '>') ?? '',
      },
      mentionedUser: mentionedUser,
      mpTitle: '',
      media: [
        {
          coverUrl: coverUrl,
          fileSize: taskData.video.size,
          fullCoverUrl: coverUrl,
          fullThumbUrl: coverUrl,
          height: taskData.video.height,
          md5sum: fileMd5,
          mediaType: 4,
          shareCoverUrl: hCoverUrl,
          url: videoUrl,
          thumbUrl: coverUrl,
          urlCdnTaskId: draftId,
          videoPlayLen: taskData.video?.duration ? taskData.video.duration : 10, //NumHelper.ToFloat(taskData?.duration),
          width: taskData.video.width,
        },
      ],
      shortTitle: shortTitles, //短标题ceshi
    },
    tagInfo: tagInfo,
    report: {
      _log_finder_id: finderUsername,

      clipKey: clipKey,
      draftId: draftId,
      height: taskData.video.width ?? 1920,
      width: taskData.video.height ?? 1280,
      pluginSessionId: null,
      rawKeyBuff: rawKeyBuff ? rawKeyBuff : '',
      scene: 7,
      reqScene: 7,
      timestamp: getTimeStamp(13),
      duration: taskData.video.duration ? taskData.video.duration : 10,
      fileSize: taskData.video.size,
      uploadCost: Math.ceil((taskData.video.size ?? 1024 * 1024) / 524287) * 1000,
    },
    clientid: clientId,
    timestamp: getTimeStamp(13),
    _log_finder_id: finderUsername,
  };
  if (taskData.video.duration > 60) {
    re['mode'] = 1;
  }
  //商品
  if (taskData.goods?.productId) {
    re.objectDesc['product'] = {
      productId: taskData.goods.productId,
      title: taskData.goods.title,
    };
    re.objectDesc['component'] = {
      id: taskData.goods.productId,
      type: 1,
    };
    re.objectDesc.extReading['urlType'] = 5;
  }
  //短剧
  if (taskData.drama?.yixiaoerId) {
    re.objectDesc['component'] = {
      id: taskData.drama.yixiaoerId,
      type: 8,
      title: taskData.drama.yixiaoerName,
    };
    re.objectDesc.extReading['urlType'] = 13;
  }
  //合集
  if (taskData.collection?.id) {
    re.objectDesc.topic['collectionId'] = taskData.collection.id;
    re.objectDesc.topic['collectionName'] = taskData.collection.name;
  }
  if (taskData.video.duration > 60) {
    // noinspection SpellCheckingInspection
    // noinspection SpellCheckingInspection
    re['megavideoDesc'] = {
      description: descStr,
      location: location,
      extReading: {
        //拓展链接
        link: taskData.link?.toString() ?? '',
        title: taskData['linkTitle']?.toString() ?? '',
      },
      feadLocation: {
        latitude: 0,
        longitude: 0,
      },
      media: [
        {
          coverUrl: coverUrl,
          thumbUrl: coverUrl,
          url: videoUrl,
          videoPlayLen: taskData.video.duration ? taskData.video.duration : 10,
          videoPlayLenMs: (taskData.video.duration ? taskData.video.duration : 10) * 1000,
          width: taskData.video.width,
          height: taskData.video.height,
          fileSize: taskData.video.size,
          md5sum: fileMd5,
        },
      ],
    };
  }
  re['scene'] = 7;
  re['reqScene'] = 7;
  re['videoClipTaskId'] = draftId;
  //定时任务
  const prePubTime = taskData.effectiveTime?.toString();
  if (prePubTime && prePubTime.length > 9) {
    re['effectiveTime'] = taskData.effectiveTime;
  }
  //活动
  if (taskData.event?.eventTopicId) {
    re.objectDesc['event'] = taskData.event;
  }

  if (taskData.pubType === 0) {
    const result = {
      _log_finder_id: re._log_finder_id,
      objectId: null,
      pluginSessionId: null,
      postReq: re,
      rawKeyBuff: '',
      scene: 7,
      reqScene: 7,
      timestamp: getTimeStamp(13),
    };
    delete re.objectDesc['product'];
    return JSON.stringify(result);
  } else {
    return JSON.stringify(re);
  }
};

export interface ShipinhaoPublishResponse {
  errCode: number;
  errMsg: string;
  data?: {
    errorCode: number;
    msg: string;
    baseResp: {
      // noinspection SpellCheckingInspection
      errcode: number;
      errmsg: string;
    };
  };
}
