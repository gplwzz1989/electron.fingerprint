import { $http } from '@/http';
import { Guid } from '@/utils';
import * as buffer from 'buffer';
import crypto from 'crypto';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { BaseResult } from '@/media-platform/baseResult';
import { getShipinhaoUserInfo } from './shipinhao-common';

/**
 * 发送私信
 * @param cookie
 * @param toUserFinderUserName 消息会话中的username，看起来像视频号的finderName，但是部分用户不是，v1开头的不是，v2开头的似乎是视频号的finderUserName，待定
 * @param finderName 视频号用户信息中的finderUserName
 * @param sessionId 消息会话id
 * @param msgType 1:文字/表情 3:图片
 * @param msgContent 消息体，文字和表情和图片消息体不一样
 * @param proxyAgent
 */
export const sendShipinhaoMessageResponse = async (
  cookie: string,
  toUserFinderUserName: string,
  finderName: string,
  sessionId: string,
  msgType: 1 | 3,
  msgContent: object,
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<ShipinhaoCreateMessageResponse> => {
  const url =
    'https://channels.weixin.qq.com/micro/interaction/cgi-bin/mmfinderassistant-bin/private-msg/send-private-msg?_rid=67aafda2-ce8d3ae9';

  const header = {
    referer: 'https://channels.weixin.qq.com/platform/post/create',
    cookie: cookie,
    Origin: 'https://channels.weixin.qq.com',
  };

  const postData = {
    msgPack: {
      sessionId: sessionId,
      fromUsername: finderName,
      toUsername: toUserFinderUserName,
      msgType: msgType, //1:文字 3:图片
      cliMsgId: Guid.NewGuid().toString(),
    },
    timestamp: Date.now().toString(),
    _log_finder_uin: '',
    _log_finder_id: finderName,
    rawKeyBuff: null,
    pluginSessionId: null,
    scene: 7,
    reqScene: 7,
  };
  if (msgType === 1) {
    //{ content: msgContent }
    postData.msgPack['textMsg'] = msgContent;
  } else if (msgType === 3) {
    //{"aeskey":"7a6d7362746776616e786f7474776f79","url":"3052020100044b3049020100020408aa58ca02033d11fe0204b1960399020467ab1ab2042462326435653734372d386433612d343866322d616265372d3338323862343664656365380204012438010201000400b93d9236","hdSize":70000,"midSize":26032,"thumbSize":3279,"thumbHeight":91,"thumbWidth":100,"md5":"c36911a7052d4cb26caf8ae354313c23"},"cliMsgId":"65b4cf58-801e-4e6d-95f1-e98b624d7f82"}
    postData.msgPack['imgMsg'] = msgContent;
  } else if (msgType === 3) {
    throw new Error(`不支持的类型:${msgType}`);
  }

  const result = await $http.post(url, postData, { headers: header, httpAgent: proxyAgent, httpsAgent: proxyAgent });

  return result.data;
};

export interface ShipinhaoCreateMessageResponse {
  /**
   * 0:正常 非0异常
   */
  errCode: number;
  errMsg: string;
  data: {
    baseResp: { errcode: number };
    /**
     * 消息id
     */
    svrMsgId: string;
  };
}

/**
 * 获取对话的详细信息
 * @param cookie
 * @param finderName 用户信息中的finderUserName
 * @param sessionIds 消息会话的id列表
 */
export const getShipinhaoMessageSessionDetailResponse = async (
  cookie: string,
  finderName: string,
  sessionIds: Array<string>,
  proxyAgent: HttpsProxyAgent<string> | object | undefined = undefined,
): Promise<ShipinhaoGetMessageSessionResponse> => {
  const url =
    'https://channels.weixin.qq.com/micro/interaction/cgi-bin/mmfinderassistant-bin/private-msg/get-session-info?_rid=67aaf4d9-4cd5da5c';

  const header = {
    referer: 'https://channels.weixin.qq.com/platform/post/create',
    cookie: cookie,
    Origin: 'https://channels.weixin.qq.com',
  };

  const postData = {
    sessionId: sessionIds ?? [],
    timestamp: Date.now().toString(),
    _log_finder_uin: '',
    _log_finder_id: finderName,
    rawKeyBuff: null,
    pluginSessionId: null,
    scene: 7,
    reqScene: 7,
  };

  const result = await $http.post(url, postData, {
    headers: header,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface ShipinhaoGetMessageSessionResponse {
  /**
   * 0:正常,非0异常
   */
  errCode: number;
  errMsg: string;
  data: {
    sessionInfo: Array<ShipinhaoMsgSession>;
    baseResp: { errcode: number };
  };
}

export interface ShipinhaoMsgSession {
  sessionId: string; // 'a07ceebdb5625c76b1d4f87759684dec61bcea084f98d0ce76fa8d7a6e7a9fd6@findermsg';
  /**
   * 会话用户id，似乎有extInfo的就是v2开头，否则v1开头，v2开头的似乎可以和视频号创作中心对应
   */
  username: string; // 'v2_060000231003b20faec8c7e58c1fc7ddc805e430b077c38c25364c007796021def5dcdd8117a@finder'; 'fv1_e42d918c16b33bf37b3839cc4de0c42ebcd072ffb5eb944ae79c26b3d7deda44@findermsgstranger';
  nickname: string; //'Max8862';
  headImgUrl: string; // 'http://wx.qlogo.cn/finderhead/0nn3FBrD9a3jMSzzjLaqjOK3klRoicfxt0HC9QCyia1aPKYu2nVJOhtA/0';
  sessionType: number; //有2,3两种，3表示已经有双向对话，2表示是单向对话，还没有回复过
  rejectMsg: number; //0;
  extInfo: {
    country: string; // '中国';
    province: string; // '湖北';
    city: string; // '十堰';
    sex: number; // 0;
    signature: string;
    authIconUrl: string;
    authProfession: string;
    exportId: string; // 'v2_060000231003b20faec8c4e38811c1d1cb00ea36b077845d3025a5ca135a5f2fddb4627cfa18@finder';
  };
  fromUserType: number; //有0, 1和2三种，暂不知道意义;
}

/**
 * 获取历史消息列表
 * @param cookie
 * @param finderName 用户信息中中的finderUserName
 * @param cursor_cookie
 * @param proxyAgent
 */
export const getShipinhaoMessageListResponse = async (
  cookie: string,
  finderName: string,
  cursor_cookie: string = '',
  proxyAgent: HttpsProxyAgent<string> | object | undefined = undefined,
): Promise<ShipinhaoMsgListResponse> => {
  const url = `https://channels.weixin.qq.com/micro/interaction/cgi-bin/mmfinderassistant-bin/private-msg/get-history-msg?_aid=${Guid.NewGuid().toString()}&_rid=69313ddf-3244d236&_pageUrl=https:%2F%2Fchannels.weixin.qq.com%2Fmicro%2Finteraction%2Fprivate_msg`;

  const header = {
    referer: 'https://channels.weixin.qq.com/micro/interaction/private_msg',
    cookie: cookie,
    Origin: 'https://channels.weixin.qq.com',
  };

  const postData = {
    cookie: cursor_cookie ?? '',
    timestamp: Date.now().toString(),
    _log_finder_uin: '',
    _log_finder_id: finderName,
    rawKeyBuff: null,
    pluginSessionId: null,
    scene: 7,
    reqScene: 7,
  };

  const result = await $http.post(url, postData, {
    headers: header,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

/**
 * 获取单条新消息(用于WebSocket通知后获取)
 * @param cookie HTTP Cookie
 * @param finderName 用户名
 * @param cursor_cookie 游标cookie(从上次调用返回)
 */
export const getShipinhaoNewMsg = async (
  cookie: string,
  finderName: string,
  cursor_cookie: string,
  proxyAgent: HttpsProxyAgent<string> | object | undefined = undefined,
): Promise<ShipinhaoMsgListResponse> => {
  const url = `https://channels.weixin.qq.com/micro/interaction/cgi-bin/mmfinderassistant-bin/private-msg/get-new-msg?_aid=${Guid.NewGuid().toString()}&_rid=69d5ffc1-488fa46e&_pageUrl=https:%2F%2Fchannels.weixin.qq.com%2Fmicro%2Finteraction%2Fprivate_msg`;

  const header = {
    referer: 'https://channels.weixin.qq.com/micro/interaction/private_msg',
    cookie: cookie,
    Origin: 'https://channels.weixin.qq.com',
  };

  const postData = {
    cookie: cursor_cookie,
    timestamp: Date.now().toString(),
    _log_finder_uin: null,
    _log_finder_id: finderName,
    rawKeyBuff: null,
    pluginSessionId: null,
    scene: 7,
    reqScene: 7,
  };

  const result = await $http.post(url, postData, {
    headers: header,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface ShipinhaoParseMediaMessageRequest {
  mediaType?: number;
  mediaParams?: Record<string, any>;
  imgMsg?: {
    aeskey: string;
    url: string;
    [key: string]: any;
  };
  rawContent?: string;
  timestamp?: string | number;
  outputType?: 'url' | 'base64';
}

export interface ShipinhaoParseMediaMessageData {
  mediaType: number;
  outputType: 'url' | 'base64';
  url?: string;
  base64?: string;
  ext?: string;
  contentType?: string;
  fileName?: string;
  raw?: object;
}

export interface ShipinhaoParseMediaMessageResponse extends BaseResult {
  data?: ShipinhaoParseMediaMessageData;
}

const getShipinhaoParseMediaParams = (mediaInfo: ShipinhaoParseMediaMessageRequest): Record<string, any> => {
  if (mediaInfo.mediaParams && typeof mediaInfo.mediaParams === 'object') {
    return mediaInfo.mediaParams;
  }

  return {
    ...(mediaInfo.imgMsg ?? {}),
    rawContent: mediaInfo.rawContent,
    timestamp: mediaInfo.timestamp,
  };
};

const getShipinhaoParseMediaOutputType = (
  outputType: 'url' | 'base64' | undefined,
  urlValue: string,
  base64Value: string,
): 'url' | 'base64' => {
  if (outputType === 'url') {
    return urlValue ? 'url' : 'base64';
  }

  if (outputType === 'base64') {
    return base64Value ? 'base64' : 'url';
  }

  return urlValue ? 'url' : 'base64';
};

const getShipinhaoMediaContentType = (ext?: string): string | undefined => {
  if (!ext) {
    return undefined;
  }

  const lowerExt = ext.toLowerCase();
  if (lowerExt === 'jpg' || lowerExt === 'jpeg') {
    return 'image/jpeg';
  }
  if (lowerExt === 'png') {
    return 'image/png';
  }
  if (lowerExt === 'gif') {
    return 'image/gif';
  }
  if (lowerExt === 'webp') {
    return 'image/webp';
  }
  if (lowerExt === 'bmp') {
    return 'image/bmp';
  }
  if (lowerExt === 'mp4') {
    return 'video/mp4';
  }
  if (lowerExt === 'pdf') {
    return 'application/pdf';
  }

  return undefined;
};

export const parseShipinhaoMessageMediaResponse = async (
  cookie: string,
  finderName: string,
  mediaInfo: ShipinhaoParseMediaMessageRequest,
): Promise<ShipinhaoParseMediaMessageResponse> => {
  const mediaParams = getShipinhaoParseMediaParams(mediaInfo);
  const mediaType = Number(mediaInfo.mediaType ?? mediaParams.mediaType ?? 3);
  const directUrl =
    typeof mediaParams.url === 'string'
      ? mediaParams.url
      : typeof mediaParams.mediaPath === 'string'
      ? mediaParams.mediaPath
      : '';
  const directBase64 =
    typeof mediaParams.base64 === 'string'
      ? mediaParams.base64
      : typeof mediaParams.imgContent === 'string'
      ? mediaParams.imgContent
      : '';
  const ext =
    typeof mediaParams.ext === 'string' ? mediaParams.ext : directUrl?.includes('.') ? directUrl.split('.').pop() : '';

  const result: ShipinhaoParseMediaMessageResponse = {
    code: 0,
    msg: '',
    data: {
      mediaType,
      outputType: getShipinhaoParseMediaOutputType(mediaInfo.outputType, directUrl, directBase64),
    },
  };

  if (directUrl || directBase64) {
    result.data = {
      mediaType,
      outputType: getShipinhaoParseMediaOutputType(mediaInfo.outputType, directUrl, directBase64),
      url: directUrl,
      base64: directBase64,
      ext: ext ?? '',
      contentType: mediaParams.contentType ?? getShipinhaoMediaContentType(ext ?? ''),
      fileName: mediaParams.fileName,
      raw: mediaParams,
    };
    return result;
  }

  try {
    if (!finderName) {
      const userInfo = await getShipinhaoUserInfo(cookie);
      if (userInfo?.data?.finderUser?.finderUsername) {
        finderName = userInfo.data.finderUser.finderUsername;
      } else {
        result.code = userInfo?.code ?? -1;
        result.msg = '获取视频号用户信息失败';
        return result;
      }
    }

    const url = `https://channels.weixin.qq.com/micro/interaction/cgi-bin/mmfinderassistant-bin/private-msg/get-media-info?_aid=${Guid.NewGuid().toString()}&_rid=${Guid.NewGuid().toString()}&_pageUrl=https:%2F%2Fchannels.weixin.qq.com%2Fmicro%2Finteraction%2Fprivate_msg`;
    const header = {
      referer: 'https://channels.weixin.qq.com/micro/interaction/private_msg',
      cookie: cookie,
      Origin: 'https://channels.weixin.qq.com',
    };

    const postData = {
      mediaType,
      imgMsg: mediaParams.imgMsg ?? mediaParams,
      rawContent: (typeof mediaParams.rawContent === 'string' ? mediaParams.rawContent : mediaInfo.rawContent) ?? '',
      timestamp: (mediaParams.timestamp ?? mediaInfo.timestamp ?? Date.now()).toString(),
      _log_finder_uin: null,
      _log_finder_id: finderName,
      rawKeyBuff: null,
      pluginSessionId: null,
      scene: 7,
      reqScene: 7,
    };

    const response = await $http.post(url, postData, { headers: header });
    const responseData = response.data as {
      errCode?: number;
      errMsg?: string;
      data?: {
        baseResp?: { errcode?: number };
        imgContent?: string;
        ext?: string;
        mediaPath?: string;
        contentType?: string;
        fileName?: string;
        url?: string;
        base64?: string;
        [key: string]: any;
      };
    };

    result.code = responseData?.errCode ?? -1;
    result.msg = responseData?.errCode === 0 ? '' : responseData?.errMsg ?? '解析媒体内容失败';

    const mediaData = responseData?.data ?? {};
    const urlValue = mediaData.mediaPath ?? mediaData.url ?? '';
    const base64Value = mediaData.imgContent ?? mediaData.base64 ?? '';
    const parsedExt = mediaData.ext ?? (urlValue?.includes('.') ? urlValue.split('.').pop() : '');
    result.data = {
      mediaType,
      outputType: getShipinhaoParseMediaOutputType(mediaInfo.outputType, urlValue, base64Value),
      url: urlValue,
      base64: base64Value,
      ext: parsedExt ?? '',
      contentType: mediaData.contentType ?? getShipinhaoMediaContentType(parsedExt ?? ''),
      fileName: mediaData.fileName,
      raw: {
        request: mediaParams,
        response: mediaData,
      },
    };

    if (!result.data.url && !result.data.base64) {
      result.code = -1;
      result.msg = result.msg || '未获取到可解析的媒体内容';
    }
  } catch (e) {
    result.code = -1;
    result.msg = '解析媒体内容失败，请稍后重试';
  }

  return result;
};

export const parseShipinhaoMessageImageResponse = async (
  cookie: string,
  finderName: string,
  mediaParams: Record<string, any>,
  outputType?: 'url' | 'base64',
): Promise<ShipinhaoParseMediaMessageResponse> => {
  return await parseShipinhaoMessageMediaResponse(cookie, finderName, {
    mediaType: 3,
    mediaParams,
    outputType,
  });
};

export interface ShipinhaoMsgListResponse {
  errCode: number;
  errMsg: string;
  data: {
    msg: Array<ShipinhaoMsgItem>;
    baseResp: { errcode: number };
    cookie: string;
  };
}

/**
 * 消息
 */
export interface ShipinhaoMsgItem {
  seq: number; // 4201;
  /**
   * 对话/会话id
   */
  sessionId: string; // '1236513122132'
  /**
   * 3:图片 1：文字
   */
  msgType: number; //1;
  bizType: number; //1;
  /**
   * 10位时间戳
   */
  ts: number; //1739257134;
  /**
   * 发送消息的人
   */
  fromUsername: string; // 'v2_060000231003b20faec8c4e68f1cc7d5c903ea33b0774b0ae2979b4f3373ebb37df95ec4740d@finder';
  /**
   * 接收消息的人
   */
  toUsername: string; // 'fv1_721b750105e0854a8466419b420931f2e006f4170694bd08bde75f05eb7ec49f@findermsgstranger';
  /**
   * 源数据
   */
  rawContent: string; // '逗b高洋';
  //rawContent: '<?xml version="1.0"?>\n<msg>\n\t<img aeskey="7a6d7362746776616e786f7474776f79" encryver="0" cdnthumbaeskey="7a6d7362746776616e786f7474776f79" cdnthumburl="3052020100044b3049020100020408aa58ca02033d11fe0204b1960399020467ab1ab2042462326435653734372d386433612d343866322d616265372d3338323862343664656365380204012438010201000400b93d9236" cdnthumblength="3279" cdnthumbheight="91" cdnthumbwidth="100" cdnmidheight="0" cdnmidwidth="0" cdnhdheight="0" cdnhdwidth="0" cdnmidimgurl="3052020100044b3049020100020408aa58ca02033d11fe0204b1960399020467ab1ab2042462326435653734372d386433612d343866322d616265372d3338323862343664656365380204012438010201000400b93d9236" length="26032" cdnbigimgurl="3052020100044b3049020100020408aa58ca02033d11fe0204b1960399020467ab1ab2042462326435653734372d386433612d343866322d616265372d3338323862343664656365380204012438010201000400b93d9236" hdlength="70000" md5="c36911a7052d4cb26caf8ae354313c23" />\n\t<platform_signature></platform_signature>\n\t<imgdatahash></imgdatahash>\n</msg>\n';
  imgMsg?: {
    aeskey: string; // '7a6d7362746776616e786f7474776f79';
    url: string; // '3052020100044b3049020100020408aa58ca02033d11fe0204b1960399020467ab1ab2042462326435653734372d386433612d343866322d616265372d3338323862343664656365380204012438010201000400b93d9236';
  };
  /**
   * 文字/表情消息
   */
  textMsg: { content: string };
  /**
   * 消息id
   */
  svrMsgId: string; //'718829822827279877';
  sessionType: number; //2:似乎是新的打招呼信息，3:是历史会话;
}

export const uploadShipinhaoMessageImageResponse = async (
  cookie: string,
  finderName: string,
  toUserFinderUserName: string,
  imgData: buffer.Buffer,
  proxyAgent: HttpsProxyAgent<string> | object | undefined = undefined,
): Promise<ShipinhaoUploadMsgImageResponse> => {
  const url =
    'https://channels.weixin.qq.com/micro/interaction/cgi-bin/mmfinderassistant-bin/private-msg/upload-media-info?_rid=67ab1ab2-3797edd0';

  const header = {
    referer: 'https://channels.weixin.qq.com/platform/post/create',
    cookie: cookie,
    Origin: 'https://channels.weixin.qq.com',
  };

  const postData = {
    content: `data:application/octet-stream;base64,${imgData.toString('base64')}`,
    chunk: 0,
    chunks: 1,
    fromUsername: finderName,
    toUsername: toUserFinderUserName,
    aesKey: 'U2FsdGVkX18cwrWR73LMGhBcmAX8xoNTgbmgkZBYkEs=',
    mediaSize: imgData.length,
    mediaType: 3,
    md5: crypto.createHash('md5').update(imgData).digest('hex'),
    timestamp: Date.now().toString(),
    _log_finder_uin: '',
    _log_finder_id: finderName,
    rawKeyBuff: null,
    pluginSessionId: null,
    scene: 7,
    reqScene: 7,
  };

  const result = await $http.post(url, postData, {
    headers: header,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface ShipinhaoUploadMsgImageResponse {
  errCode: number;
  errMsg: string;
  data: {
    baseResp: { errcode: number };
    imgMsg: {
      aeskey: string; //'7a6d7362746776616e786f7474776f79';
      url: string; // '3052020100044b3049020100020408aa58ca02033d11fe0204b1960399020467ab1ab2042462326435653734372d386433612d343866322d616265372d3338323862343664656365380204012438010201000400b93d9236';
      hdSize: number;
      midSize: number;
      thumbSize: number;
      thumbHeight: number;
      thumbWidth: number;
      md5: string;
    };
    mediaPath: string; // '/home/qspace/data/mmfinderassistantmsgsvr/264/getbigfile_1491611425__v2_060000231003b20faec8c4e68f1cc7d5c903ea33b0774b0ae2979b4f3373ebb37df95ec4740d_finder_c36911a7052d4cb26caf8ae354313c23_U2FsdGVkX18cwrWR73LMGhBcmAX8xoNTgbmgkZBYkEs_.';
  };
}
