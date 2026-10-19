import { $http, HttpConfig } from '../../http';
import {
  MediaType,
  ShipinhaoContentStatement,
  ShipinhaoStatementType,
  ShipinhaoTagInfo,
} from '../../media-platform/shipinhao/shipinhao-types';
import crypto from 'crypto';
import * as buffer from 'buffer';
import path from 'path';
import { convertImageFileToBuffer, Guid, isJson } from '../../utils';
import { ShipinhaoPublishResultOutput } from './shipinhao-video';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { errorCode } from '@/media-platform/errorCode';

/**
 * 获取用户信息
 * @param cookie
 * @param proxyAgent
 */
export const getUserinfoLite = async (
  cookie: string,
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<ShiPinHaoUserInfoResponse> => {
  const postData = {
    timestamp: getTimeStamp(13),
    _log_finder_uin: '',
    _log_finder_id: '',
    rawKeyBuff: null,
    pluginSessionId: null,
    scene: 7,
    reqScene: 7,
  };

  const url = 'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/auth/auth_data';

  const response = await $http.post(url, postData, {
    headers: {
      cookie: cookie,
      referer: 'https://channels.weixin.qq.com',
    },
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return response.data as ShiPinHaoUserInfoResponse;
};

/**
 * 鑾峰彇鐢ㄦ埛淇℃伅
 * @param cookie
 * @param proxyAgent
 */
export const getUserinfo = async (
  cookie: string,
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<ShiPinHaoUserInfoResponse> => {
  const response = await getUserinfoLite(cookie, proxyAgent);

  if (response.data?.finderUser) {
    const authData = await getUploadAuthKey(cookie, response?.data?.finderUser?.finderUsername ?? '', proxyAgent);
    if (authData?.data?.uin !== undefined) {
      response.data.finderUser.uin = authData.data.uin;
    } else {
      response.errCode = authData?.errCode ?? errorCode.data_error;
      response.errMsg = authData?.errMsg;
    }
  }

  return response;
};

/**
 * 获取上传认证参数
 * @param cookie  用户登录后的cookie，只支持k=v结构 eg:cookie1=123；cookie2=456
 * @param finderUsername 用户id，来源于用户接口
 * @param proxyAgent
 * @constructor
 */
export const getUploadAuthKey = async (
  cookie: string,
  finderUsername: string,
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<UploadAuthKeyResponse> => {
  const url = 'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/helper/helper_upload_params';
  const postData = {
    timestamp: getTimeStamp(13),
    _log_finder_id: finderUsername,
    rawKeyBuff: null,
  };
  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: {
      cookie: cookie,
      referer: 'https://channels.weixin.qq.com',
      Accept: 'application/json, text/plain, */*',
    },
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });
  return result.data;
};

export interface UploadAuthKeyResponse {
  errCode: number;
  errMsg: string;
  data?: { authKey: string; uin: number };
}

/**
 * 获取视频号创作申明标识。
 * @param cookie 用户登录后的cookie，只支持k=v结构 eg:cookie1=123；cookie2=456
 * @param finderUsername 用户id，来源于用户接口
 * @param rawKeyBuff 可选参数，默认空
 * @param proxyAgent
 */
export const getShipinhaoObjectTagList = async (
  cookie: string,
  finderUsername: string,
  rawKeyBuff: string,
  proxyAgent: HttpsProxyAgent<string> | object | undefined = undefined,
): Promise<ShipinhaoObjectTagListResponse> => {
  const pageUrl = 'https://channels.weixin.qq.com/micro/content/post/finderNewLifeCreate';
  const url =
    `https://channels.weixin.qq.com/micro/content/cgi-bin/mmfinderassistant-bin/post/finder_get_object_tag_list?_aid=${Guid.NewGuid()}` +
    `&_rid=${Guid.NewGuid()}&_pageUrl=${encodeURIComponent(pageUrl)}`;
  const postData = {
    source: 1,
    timestamp: getTimeStamp(13),
    _log_finder_uin: '',
    _log_finder_id: finderUsername ? finderUsername : '',
    rawKeyBuff: rawKeyBuff ? rawKeyBuff : '',
    pluginSessionId: null,
    scene: 7,
    reqScene: 7,
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: {
      cookie: cookie,
      referer: pageUrl,
      origin: 'https://channels.weixin.qq.com',
      'Content-Type': 'application/json',
    },
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};

export interface ShipinhaoObjectTagListResponse {
  errCode: number;
  errMsg: string;
  data?: {
    tagKey?: string;
  };
}

/**
 * 构造视频号发布用的创作申明信息。
 * @param cookie 用户登录后的cookie，只支持k=v结构 eg:cookie1=123；cookie2=456
 * @param statement 创作申明
 * @param finderUsername 用户id，来源于用户接口
 * @param rawKeyBuff 可选参数，默认空
 * @param proxyAgent
 */
export const buildShipinhaoTagInfo = async (
  cookie: string,
  statement: ShipinhaoContentStatement | null | undefined,
  finderUsername: string,
  rawKeyBuff: string,
  proxyAgent: HttpsProxyAgent<string> | object | undefined = undefined,
): Promise<ShipinhaoTagInfo | undefined> => {
  if (!statement) {
    return undefined;
  }

  const tagListResult = await getShipinhaoObjectTagList(cookie, finderUsername, rawKeyBuff, proxyAgent);
  if (tagListResult.errCode !== 0) {
    throw new Error(`获取视频号创作申明标识失败，${tagListResult.errMsg || '请稍后重试'}`);
  }
  if (!tagListResult.data?.tagKey) {
    throw new Error('获取视频号创作申明标识失败，未返回tagKey');
  }

  return {
    tagType: statement.type,
    tagKey: tagListResult.data.tagKey,
    repostSource: statement.type === ShipinhaoStatementType['内容为转载'] ? statement.repostSource : undefined,
  };
};

export const getTimeStamp = (len?: number): string => {
  if (len) {
    return Date.now().toString().substring(0, len);
  } else {
    return Date.now().toString();
  }
};

/**
 * 获取上传id
 * @param fileSize 文件大小
 * @param fileName  文件名，带后缀名
 * @param uin 微信id，来源于用户信息中uin或者上传参数中的uin
 * @param innerTaskId 任务id，随机uuid4，整个上传过程需要保持一致
 * @param authKey 认证参数，来源上传参数中的authKey
 * @param fileType 资源类型，视频:20302 图片:20304
 * @return
 * @constructor
 */
export const getUploadId = async (
  fileSize: number,
  fileName: string,
  uin: number,
  innerTaskId: string,
  authKey: string,
  fileType: MediaType,
): Promise<{ UploadID: string; errMsg?: string }> => {
  const partArray: Array<number> = [];
  const blockSize = 8388608;
  const partNum = Math.ceil(fileSize / blockSize);
  if (fileSize < blockSize) {
    partArray.push(fileSize);
  } else {
    for (let i = 1; i <= partNum; i++) {
      if (i * blockSize <= fileSize) {
        partArray.push(i * blockSize);
      } else {
        partArray.push(fileSize);
        break;
      }
    }
  }

  const postData = {
    BlockSum: partNum,
    BlockPartLength: partArray,
  };

  // noinspection SpellCheckingInspection
  const headers = {
    //'Content-MD5': null,
    'X-Arguments': `apptype=251&filetype=${fileType}&weixinnum=${uin}&filekey=${encodeURIComponent(
      fileName,
    )}&filesize=${fileSize}&taskid=${innerTaskId}&scene=2`,
    Authorization: authKey,
    Accept: 'application/json, text/plain, */*',
    'Content-MD5': 'null',
    Referer: 'https://channels.weixin.qq.com/',
    Origin: 'https://channels.weixin.qq.com/',
  };

  const url = 'https://finderassistancea.video.qq.com/applyuploaddfs';

  const result = await $http.put(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

/**
 * 上传图片完成流程
 * @param imgUrl 图片url或者本地路径
 * @param taskId 发布任务id
 * @param innerTaskId 发布流程内部任务id，发布流程需保持一致
 * @param uin 用户uin
 * @param authKey 上传认证参数
 * @param pubResult
 */
export const uploadCover = async (
  imgUrl: string,
  taskId: string,
  innerTaskId: string,
  uin: number,
  authKey: string,
  pubResult: ShipinhaoPublishResultOutput,
): Promise<{ DownloadURL: string; errMsg?: string; errCode?: number } | null> => {
  const imgDataRes = await convertImageFileToBuffer(imgUrl);
  if (!imgDataRes || !(imgDataRes?.length > 0)) {
    console.debug('封面读取失败', taskId, imgUrl);
    pubResult.code = -1;
    pubResult.msg = `读取封面失败:${imgUrl}`;
    return null;
  }
  //2025-12-30，确认官方已经不再报错，但是官方页面在上传时依然会压缩到512kb以下
  if (imgDataRes.length > 524288) {
    console.debug('封面大小超限制512kb', taskId, imgUrl);
    pubResult.code = -1;
    pubResult.msg = `封面大小超限制512kb:${imgUrl}`;
    return null;
  }

  const fileName = path.basename(imgUrl);

  const uploadIdOb = await getUploadId(imgDataRes.length, fileName, uin, innerTaskId, authKey, MediaType.image);
  if (!uploadIdOb.UploadID) {
    console.debug('获取上传id失败', taskId, uploadIdOb);
    pubResult.code = uploadIdOb['errCode'] ?? -1;
    pubResult.msg = `获取上传id失败:${uploadIdOb?.errMsg}`;
    return null;
  }

  const uploadResult = await uploadImage(
    imgDataRes,
    fileName,
    MediaType.image,
    uin,
    innerTaskId,
    imgDataRes.length,
    authKey,
    uploadIdOb.UploadID,
  );

  if (!uploadResult?.ETag?.toString()) {
    console.debug('上传图片失败', taskId, uploadResult);
    pubResult.code = uploadResult['errCode'] ?? -1;
    pubResult.msg = `上传图片失败${uploadResult?.errMsg}`;
    return null;
  }

  const imagePartList = [{ PartNumber: 1, ETag: uploadResult.ETag }];
  return await getUploadedImageInfo(
    imagePartList,
    uin,
    fileName,
    uploadIdOb.UploadID,
    imgDataRes.length,
    innerTaskId,
    authKey,
    MediaType.image,
  );
};

/**
 * 上传图片
 * @param imageData 图片二进制数据
 * @param fileName 文件名
 * @param fileType 资源类型，视频:20302 图片:20304
 * @param uin
 * @param innerTaskId 发布流程内部任务id，流程保持一致
 * @param fileSize 文件大小
 * @param authKey 认证参数
 * @param uploadId 上传id
 * @param partNum 分片编号，图片默认1
 */
export const uploadImage = async (
  imageData: buffer.Buffer,
  fileName: string,
  fileType: MediaType,
  uin: number,
  innerTaskId: string,
  fileSize: number,
  authKey: string,
  uploadId: string,
  partNum: number = 1,
): Promise<{ ETag: string; TransFlag: string; 'X-Errno': number; errMsg: string }> => {
  // noinspection SpellCheckingInspection
  const headers = {
    'Content-MD5': crypto.createHash('md5').update(imageData).digest('hex').toString(),
    'X-Arguments': `apptype=251&filetype=${fileType}&weixinnum=${uin}&filekey=${encodeURIComponent(
      fileName,
    )}&filesize=${fileSize}&taskid=${innerTaskId}&scene=0`,
    Authorization: authKey,
    'Content-Type': 'application/octet-stream',
    Referer: 'https://channels.weixin.qq.com/platform/post/create',
    Origin: 'https://channels.weixin.qq.com',
    'User-Agent': HttpConfig.userAgent,
  };

  const url = `https://finderassistancea.video.qq.com/uploadpartdfs?PartNumber=${partNum}&UploadID=${encodeURIComponent(
    uploadId,
  )}`;

  const result = await $http.put(url, imageData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

/**
 * 获取上传参数
 * @param partResultList 分片图片上传结果列表
 * @param uin 微信代号
 * @param fileName 文件名带后缀
 * @param uploadId 上传id
 * @param fileSize 文件大小
 * @param innerTaskId 任务id，山川过程需要保持一致
 * @param authKey 认证key
 * @param fileType 资源类型，视频:20302 图片:20304
 * @constructor
 */
export const getUploadedImageInfo = async (
  partResultList: Array<{ PartNumber: number; ETag: string }>,
  uin: number,
  fileName: string,
  uploadId: string,
  fileSize: number,
  innerTaskId: string,
  authKey: string,
  fileType: MediaType,
): Promise<{ DownloadURL: string; errMsg?: string; errCode?: number }> => {
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

  const postData = {
    TransFlag: '0_0',
    PartInfo: partResultList,
  };

  const url = `https://finderassistancea.video.qq.com/completepartuploaddfs?UploadID=${encodeURIComponent(uploadId)}`;

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface ShiPinHaoUserInfoResponse {
  /**
   * 错误码，0为正常，非0异常
   */
  errCode: number;
  /**
   * 提示消息
   */
  errMsg: string;
  /**
   * 消息体
   */
  data?: {
    /**
     * 用户信息
     */
    finderUser?: {
      /**
       * 用户长ID
       */
      finderUsername: string;
      /**
       * 昵称
       */
      nickname: string;
      /**
       * 头像URL
       */
      headImgUrl: string;
      /**
       * 作品数
       */
      feedsCount: number;
      /**
       * 粉丝数
       */
      fansCount: number;
      /**
       * 账号状态
       */
      acctStatus: number;
      /**
       * 视频号id
       */
      uniqId: string;
      /**
       * 后续需要使用的uin参数，疑似微信id
       */
      uin: number;
    };

    /**
     * 原创信息
     */
    entranceInfo: {
      originalEntranceInfo: {
        /**
         * 是否有原创权限 1有，非1无
         */
        contactAdditionalFlag: number;
      };
      /**
       *
       */
      dramaPostEntrance: number;
      /**
       * 是否有视频号剧集权限1:有
       */
      nativeDramaSelfOperatedEntrance?: number;
    };
    /**
     * 挂车信息
     */
    switchInfo: {
      /**
       * 是否有挂车权限 1有 非1无
       */
      enablePostWithProduct: number;
    };
  };
  entranceInfo?: {
    originalEntranceInfo: {
      /**
       * 是否有原创权限 1有，非1无
       */
      contactAdditionalFlag: number;
    };
    /**
     *
     */
    dramaPostEntrance: number;
    /**
     * 是否有视频号剧集权限1:有
     */
    nativeDramaSelfOperatedEntrance?: number;
  };
}

/**
 * 检测扩展链接是否有效
 * @param cookie
 * @param linkUrl 链接url地址
 * @param finderUsername
 * @param rawKeyBuff
 */
export const checkLinkValid = async (
  cookie: string,
  linkUrl: string,
  finderUsername: string,
  rawKeyBuff: string,
): Promise<checkLinkResponse> => {
  const url = 'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/helper/helper_parse_mp_link';

  const headers = {
    cookie: cookie,
    referer: 'https://channels.weixin.qq.com',
  };

  const postData = {
    timestamp: getTimeStamp(13),
    _log_finder_id: finderUsername ? finderUsername : '',
    url: linkUrl,
    rawKeyBuff: rawKeyBuff ? rawKeyBuff : '',
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface checkLinkResponse {
  /**
   * 状态码
   * 0正常，非0异常
   */
  errCode: number;
  /**
   * 提示消息
   */
  errMsg: string;

  data?: {
    /**
     * 标题
     */
    title: string;
  };
}

/**
 * 获取用户信息，包含高级权益信息
 * @param cookie
 * @param finderUsername
 */
export const getShipinhaoPrivilegeResponse = async (
  cookie: string,
  finderUsername?: string,
): Promise<ShipinhaoPrivilegeResponse> => {
  const url = 'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/auth/auth_data';

  const headers = {
    cookie: cookie,
    referer: 'https://channels.weixin.qq.com/index',
  };

  const postData = {
    timestamp: getTimeStamp(13),
    _log_finder_uin: null,
    _log_finder_id: finderUsername ? finderUsername : null,
    rawKeyBuff: null,
    pluginSessionId: null,
    scene: 7,
    reqScene: 7,
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface ShipinhaoPrivilegeResponse {
  /**
   * 状态码
   * 0正常，非0异常
   */
  errCode: number;
  /**
   * 提示消息
   */
  errMsg: string;

  data?: {
    entranceInfo: {
      originalEntranceInfo: {
        /**
         * 是否有原创权限 1有，非1无
         */
        contactAdditionalFlag: number;
      };
    };
    switchInfo: {
      /**
       * 是否有挂车权限 1有 非1无
       */
      enablePostWithProduct: number;
    };
  };
}

/**
 * 获取账号状态
 * @param cookie
 */
export const getShipinhaoStatusResponse = async (cookie: string): Promise<ShipinhaoUserStatusResponse> => {
  const url = 'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/post/check_finder_comm_face';

  const headers = {
    cookie: cookie,
    referer: 'https://channels.weixin.qq.com/index',
  };

  const postData = {
    appType: 1,
    checkType: 1,
    timestamp: getTimeStamp(13),
    _log_finder_uin: null,
    _log_finder_id: null,
    rawKeyBuff: null,
    pluginSessionId: null,
    scene: 7,
    reqScene: 7,
    verifyId: Guid.NewGuid().toString(),
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface ShipinhaoUserStatusResponse {
  errCode: number;
  errMsg: string;
  data?: {
    /**
     * 账号异常提示消息 ，为空表示账号正常
     */
    wording: string;
  };
}
