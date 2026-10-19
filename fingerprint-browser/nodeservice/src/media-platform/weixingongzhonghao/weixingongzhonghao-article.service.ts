import * as buffer from 'buffer';
import FormData from 'form-data';
import { $http } from '../../http';
import { getNowTimeStamp } from '../../utils/use-date';
import { isJson } from '../../utils';
import { HttpsProxyAgent } from 'https-proxy-agent';

export const uploadWeixinImageResponse = async (
  cookie: string,
  imageData: buffer.Buffer,
  ticketId: string,
  ticket: string,
  userToken: number,
  imgType: string = 'png',
  fileName: string = 'myPic.png',
): Promise<WeiXinUploadImageResponse> => {
  const url = 'https://mp.weixin.qq.com/cgi-bin/filetransfer?';

  const headers = {
    cookie: cookie,
    Referer: 'https://mp.weixin.qq.com/cgi-bin/home',
    Origin: 'https://mp.weixin.qq.com',
  };

  const params = {
    action: 'upload_material',
    f: 'json',
    scene: 8,
    writetype: 'doublewrite',
    groupid: 1,
    ticket_id: ticketId,
    ticket: ticket,
    svr_time: getNowTimeStamp(10),
    token: userToken,
    lang: 'zh_CN',
    seq: getNowTimeStamp(13),
    t: `0.245301${getNowTimeStamp(10)}`,
  };

  const postData = new FormData();
  postData.append('id', getNowTimeStamp(13));
  postData.append('name', fileName);
  postData.append('type', `image/${imgType}`);
  postData.append('lastModifiedDate', new Date().toString());
  postData.append('size', imageData.length);
  postData.append('file', imageData, { filename: fileName, contentType: `image/${imgType}` });

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface WeiXinUploadImageResponse {
  /**
   * 状态信息
   */
  base_resp: {
    /**
     *状态码
     * 0 正常 非0异常
     */
    ret: number;
    /**
     * 错误信息，正常为'ok'
     */
    err_msg: string;
  };
  location: string;
  /**
   * 类型，目前是image，可能还有video和voice/music等等
   */
  type: string;
  /**
   * 资源id
   */
  content: string;
  /**
   * 图片地址,不能公开访问
   */
  cdn_url: string;
}
export interface UploadImageByUrlResponse {
  base_resp: {
    /**
     * 提示消息，正常为'ok'
     */
    err_msg: string;
    /**
     * 状态码
     * 0为正常，非0异常
     */
    ret: number;
  };
  errcode: number;
  /**
   * 资源id
   */
  file_id: number;
  /**
   * 资源格式png/gif等
   */
  img_format: string;
  /**
   * 图片url地址
   */
  url: string;
}
export const getImageInfoFromUrlResponse = async (
  cookie: string,
  imageUrl: string,
  userToken: number,
): Promise<UploadImageByUrlResponse> => {
  const url = 'https://mp.weixin.qq.com/cgi-bin/uploadimg2cdn?';

  const headers = {
    cookie: cookie,
    Referer: 'https://mp.weixin.qq.com/cgi-bin/home',
    Origin: 'https://mp.weixin.qq.com',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  };

  const params = {
    lang: 'zh_CN',
    token: userToken,
    t: `0.428538${getNowTimeStamp(10)}`,
  };

  const postData = {
    t: 'ajax-editor-upload-img',
    imgUrl: imageUrl,
    token: userToken,
    lang: 'zh_CN',
    f: 'json',
    ajax: 1,
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    params: params,
  });

  return result.data;
};

/**
 *
 * @param cookie
 * @param postData 要提交得文章数据，value需要是已经url编码过得
 * @param userToken
 */
export const createWeixinArticleMsgResponse = async (
  cookie: string,
  postData: string,
  userToken: number,
  proxyAgent?: object,
): Promise<CreateArticleMsgResponse> => {
  const url = 'https://mp.weixin.qq.com/cgi-bin/operate_appmsg?';

  const headers = {
    cookie: cookie,
    'X-Requested-With': 'XMLHttpRequest',
    Referer: 'https://mp.weixin.qq.com/cgi-bin/home',
    Origin: 'https://mp.weixin.qq.com',
    'Content-Type': 'application/x-www-form-urlencoded',
    Charset: 'UTF-8',
  };

  const params = {
    t: 'ajax-response',
    sub: 'create',
    type: 77,
    token: userToken,
    lang: 'zh_CN',
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    params: params,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

/**
 * 创建公开消息
 */
export interface CreateArticleMsgResponse {
  /**
   * 消息id/草稿id 100004674
   */
  appMsgId: number;
  /**
   * 状态
   */
  base_resp: {
    /**
     * 错误消息
     */
    err_msg: string;
    /**
     * 状态码
     * 0正常 非0异常
     */
    ret: number;
  };

  data_seq: string;
  is_ad_optioal: number;
  msg: string;
  /**
   * 当前消息包含得文章列表  ['0_100004674_0', '0_100004674_1']
   */
  msg_index_id_list: Array<string>;
  ret: string;
}

/**
 * 创建公开消息
 * @param cookie
 * @param appMsgId
 * @param userToken
 */
export const weixinMassSendForCheck = async (
  cookie: string,
  appMsgId: number,
  userToken: number,
): Promise<BaseResponse> => {
  const url = 'https://mp.weixin.qq.com/cgi-bin/masssend?';

  const headers = {
    cookie: cookie,
    'Content-Type': 'application/x-www-form-urlencoded',
    Referer: `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&type=10&appmsgid=${appMsgId}&token=${userToken}&lang=zh_CN`,
    Origin: 'https://mp.weixin.qq.com',
  };

  const params = {
    t: 'ajax-response',
    for_check: 1,
    is_release_publish_page: 1,
    token: userToken,
    lang: 'zh_CN',
  };

  const postData = {
    appmsgid: appMsgId,
    token: userToken,
    lang: 'zh_CN',
    f: 'json',
    ajax: 1,
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    params: params,
  });

  return result.data;
};

/**
 * 创建公开文章后的后续第一步
 * @param cookie
 * @param appMsgId
 * @param userToken
 */
export const weixinMassCheckSame = async (
  cookie: string,
  appMsgId: number,
  userToken: number,
): Promise<BaseResponse> => {
  const url = 'https://mp.weixin.qq.com/cgi-bin/masssend?';

  const headers = {
    cookie: cookie,
    'Content-Type': 'application/x-www-form-urlencoded',
    Referer: `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&type=10&appmsgid=${appMsgId}&token=${userToken}&lang=zh_CN`,
    Origin: 'https://mp.weixin.qq.com',
  };

  const params = {
    action: 'check_same_material',
  };

  const postData = {
    appmsgid: appMsgId,
    token: userToken,
    lang: 'zh_CN',
    f: 'json',
    ajax: 1,
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    params: params,
  });

  return result.data;
};

/**
 * 创建公开文章后的后续第二步
 * @param cookie
 * @param appMsgId
 * @param userToken
 */
export const weixinMassCheckCopyRight = async (
  cookie: string,
  appMsgId: number,
  userToken: number,
): Promise<BaseResponse> => {
  const url = 'https://mp.weixin.qq.com/cgi-bin/masssend?';

  const headers = {
    cookie: cookie,
    'Content-Type': 'application/x-www-form-urlencoded',
    Referer: `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&type=10&appmsgid=${appMsgId}&token=${userToken}&lang=zh_CN`,
    Origin: 'https://mp.weixin.qq.com',
  };

  const params = {
    action: 'get_appmsg_copyright_stat',
    token: userToken,
    lang: 'zh_CN',
  };

  const postData = {
    appmsgid: appMsgId,
    token: userToken,
    lang: 'zh_CN',
    f: 'json',
    ajax: 1,
    random: `0.947380${getNowTimeStamp(10)}`,
    first_check: 1,
    type: 10,
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data) || !response.data.open_ad_reprint_status;
    },
    headers: headers,
    params: params,
  });

  return result.data;
};

/**
 * 创建公开文章后的后续第三步
 * @param cookie
 * @param appMsgId
 * @param userToken
 */
export const weixinMassCheckAd = async (cookie: string, appMsgId: number, userToken: number): Promise<BaseResponse> => {
  const url = 'https://mp.weixin.qq.com/cgi-bin/masssend?';

  const headers = {
    cookie: cookie,
    'Content-Type': 'application/x-www-form-urlencoded',
    Referer: `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&type=10&appmsgid=${appMsgId}&token=${userToken}&lang=zh_CN`,
    Origin: 'https://mp.weixin.qq.com',
  };

  const params = {
    action: 'check_ad',
    token: userToken,
    lang: 'zh_CN',
  };

  const postData = {
    appmsgid: appMsgId,
    token: userToken,
    lang: 'zh_CN',
    f: 'json',
    ajax: 1,
    random: `0.947380${getNowTimeStamp(10)}`,
    is_release_publish_page: 1,
    send_time: 0,
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    params: params,
  });

  return result.data;
};

/**
 * 创建公开文章后的后续第四步
 * @param cookie
 * @param appMsgId
 * @param userToken
 */
export const weixinMassCheckMusic = async (
  cookie: string,
  appMsgId: number,
  userToken: number,
): Promise<BaseResponse> => {
  const url = 'https://mp.weixin.qq.com/cgi-bin/masssend?';

  const headers = {
    cookie: cookie,
    'Content-Type': 'application/x-www-form-urlencoded',
    Referer: `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&type=10&appmsgid=${appMsgId}&token=${userToken}&lang=zh_CN`,
    Origin: 'https://mp.weixin.qq.com',
  };

  const params = {
    action: 'check_music',
  };

  const postData = {
    appmsgid: appMsgId,
    token: userToken,
    lang: 'zh_CN',
    f: 'json',
    ajax: 1,
    masssend_check: 1,
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface BaseResponse {
  base_resp: {
    /**
     * 提示消息
     */
    err_msg: string;

    /**
     * 状态码，通常0为成功
     */
    ret: number;
  };
}

/**
 * 检查是否开启了扫码发布保护
 * @param cookie
 */
export const checkOpenQrCode = async (cookie: string, userToken: number): Promise<boolean> => {
  const url = 'https://mp.weixin.qq.com/cgi-bin/safecenterstatus?';

  const headers = {
    cookie: cookie,
    Referer: 'https://mp.weixin.qq.com/',
  };

  const params = {
    action: 'protect',
    token: userToken,
    lang: 'zh_CN',
    t: 'setting/safe-protect',
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return response.status >= 500;
    },
    headers: headers,
    params: params,
    responseType: 'text',
  });

  return result.data?.includes('wx.cgiData') && !result.data.includes('"protect_status":1');
};

/**
 * 推送最好的发布消息
 * @param cookie
 * @param postDataStr
 * @param userToken
 * @param appMsgId
 * @param notify
 * @param prePub
 * @param proxyAgent
 */
export const pushMsgResponse = async (
  cookie: string,
  postDataStr: string,
  userToken: number,
  appMsgId: number,
  notify: number = 0,
  prePub: boolean = true,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<BaseResponse> => {
  let url = `https://mp.weixin.qq.com/cgi-bin/masssend?t=ajax-response&token=${userToken}&lang=zh_CN`;
  //非群发
  if (notify === 0) {
    url = `${url}&is_release_publish_page=1`;
  }
  if (notify === 1 && prePub) {
    url = `${url}&action=time_send`;
  }
  const headers = {
    cookie: cookie,
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    Referer: `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&type=10&appmsgid=${appMsgId}&token=${userToken}&lang=zh_CN`,
    Origin: 'https://mp.weixin.qq.com',
  };

  const result = await $http.post(url, postDataStr, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};

/**
 * 获取ticket
 * @param cookie
 * @param appMsgId
 * @param userToken
 */
export const getQrCodeTicket = async (
  cookie: string,
  appMsgId: number,
  userToken: number,
): Promise<QrCodeTicketResponse> => {
  const url = 'https://mp.weixin.qq.com/misc/safeassistant?';

  const headers = {
    cookie: cookie,
    'Content-Type': 'application/x-www-form-urlencoded',
    Referer: `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&type=10&appmsgid=${appMsgId}&token=${userToken}&lang=zh_CN`,
    Origin: 'https://mp.weixin.qq.com',
  };

  const params = {
    '1': 1,
    token: userToken,
    lang: 'zh_CN',
  };

  const postData = {
    token: userToken,
    lang: 'zh_CN',
    f: 'json',
    ajax: 1,
    action: 'get_ticket',
    random: `0.741791${getNowTimeStamp(10)}`,
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface QrCodeTicketResponse {
  base_resp: {
    /**
     * 状态码 0正常
     */
    ret: number;
    /**
     * 提示消息
     */
    err_msg: string;
  };
  /**
   * 组装二维码链接的ticket
   */
  ticket: string;
  /**
   * 后续用到的参数，可选
   */
  operation_seq: string;
}

/**
 * 获取uuid
 * @param cookie
 * @param appMsgId
 * @param userToken
 * @param qrTicket
 */
export const getQrCodeUUID = async (
  cookie: string,
  appMsgId: number,
  userToken: number,
  qrTicket: string,
): Promise<QrCodeUUIDResponse> => {
  const url = 'https://mp.weixin.qq.com/safe/safeqrconnect?';

  const headers = {
    cookie: cookie,
    'Content-Type': 'application/x-www-form-urlencoded',
    Referer: `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&type=10&appmsgid=${appMsgId}&token=${userToken}&lang=zh_CN`,
    Origin: 'https://mp.weixin.qq.com',
  };

  const params = {
    '1': 1,
    token: userToken,
    lang: 'zh_CN',
  };

  const postData = {
    token: userToken,
    lang: 'zh_CN',
    f: 'json',
    ajax: 1,
    state: 0,
    random: `0.741791${getNowTimeStamp(10)}`,
    login_type: 'safe_center',
    type: 'json',
    ticket: qrTicket,
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface QrCodeUUIDResponse {
  uuid: string;
  genuuid_res: number;
}

export const waitQrCodeScanResult = async (
  cookie: string,
  appMsgId: number,
  userToken: number,
  qrUUID: string,
): Promise<WaitQrCodeScanResponse> => {
  const url = 'https://mp.weixin.qq.com/safe/safeuuid?';

  const headers = {
    cookie: cookie,
    'Content-Type': 'application/x-www-form-urlencoded',
    Referer: `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&type=10&appmsgid=${appMsgId}&token=${userToken}&lang=zh_CN`,
    Origin: 'https://mp.weixin.qq.com',
  };

  const params = {
    timespam: getNowTimeStamp(13),
    token: userToken,
    lang: 'zh_CN',
  };

  const postData = {
    token: userToken,
    lang: 'zh_CN',
    f: 'json',
    ajax: 1,
    random: `0.741791${getNowTimeStamp(10)}`,
    uuid: qrUUID,
    type: 'json',
    action: 'json',
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface WaitQrCodeScanResponse {
  errcode: number;
  code: string;
  appname: string;
  redirect_uri: string;
  key: string;
  pass_ticket: string;
  card_name: string;
  check_status: number;
  confirm_resp: {
    redirect_uri: '';
    component_status: 0;
    component_pre_auth_code: '';
    component_appid: '';
    bizuin: '';
    open_component_uin: 0;
    open_mp_appid: '';
    open_mp_uin: 0;
    open_biz_mp_mchid: 0;
    biz_mp_uin: 0;
    biz_mp_appid: '';
    biz_mp_mchid: 0;
  };
}

export const prePub = async (
  cookie: string,
  appMsgId: number,
  userToken: number,
  qrUUID: string,
): Promise<PrePubResponse> => {
  const url = 'https://mp.weixin.qq.com/misc/safeassistant?';

  const headers = {
    cookie: cookie,
    'Content-Type': 'application/x-www-form-urlencoded',
    Referer: `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&type=10&appmsgid=${appMsgId}&token=${userToken}&lang=zh_CN`,
    Origin: 'https://mp.weixin.qq.com',
  };

  const params = {
    '1': 1,
    token: userToken,
    lang: 'zh_CN',
  };

  const postData = {
    token: userToken,
    lang: 'zh_CN',
    f: 'json',
    ajax: 1,
    random: `0.741791${getNowTimeStamp(10)}`,
    uuid: qrUUID,
    action: 'get_uuid',
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface PrePubResponse {
  base_resp: {
    ret: number;
    err_msg: string;
  };
  isadmin: number;
}

export const getSendMassSendPage = async (cookie: string, appMsgId: number, userToken: number): Promise<string> => {
  const url = `https://mp.weixin.qq.com/cgi-bin/masssendpage?t=mass/send&type=10&appmsgid=${appMsgId}&token=${userToken}&lang=zh_CN`;

  const headers = {
    cookie: cookie,
    Referer: `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&type=10&appmsgid=${appMsgId}&token=${userToken}&lang=zh_CN`,
    Origin: 'https://mp.weixin.qq.com',
  };

  const result = await $http.get(url, {
    headers: headers,
    responseType: 'text',
  });

  return result.data;
};

export const getAllowSign = async (cookie: string, appMsgId: number, userToken: number): Promise<string> => {
  const url = `https://mp.weixin.qq.com/cgi-bin/setprotocolsign?cgi=setprotocolsign&lang=zh_CN&token=${userToken}`;

  const headers = {
    cookie: cookie,
    'Content-Type': 'application/x-www-form-urlencoded',
    Referer: `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&type=10&appmsgid=${appMsgId}&token=${userToken}&lang=zh_CN`,
    Origin: 'https://mp.weixin.qq.com',
  };

  const postData = {
    issigned: 1,
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    responseType: 'text',
  });

  return result.data;
};

export const getSendMassSendAfterSign = async (
  cookie: string,
  appMsgId: number,
  userToken: number,
): Promise<string> => {
  const url = `https://mp.weixin.qq.com/cgi-bin/masssendpage?t=mass/send&lang=zh_CN&token=${userToken}`;

  const headers = {
    cookie: cookie,
    Referer: `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit&action=edit&type=10&appmsgid=${appMsgId}&token=${userToken}&lang=zh_CN`,
    Origin: 'https://mp.weixin.qq.com',
  };

  const result = await $http.get(url, {
    headers: headers,
    responseType: 'text',
  });

  return result.data;
};
