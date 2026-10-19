import { $http } from '@/http';
import * as buffer from 'buffer';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 获取私信对话用户列表
 * @param cookie
 * @param porch_user_id 商户id
 * @param limit
 * @param is_active
 */
export const getXiaohongshuMessageUserListResponse = async (
  cookie: string,
  porch_user_id: string = '',
  limit: number = 80,
  refreshtime: string = '',
  is_active: boolean = false,
): Promise<XiaohongshuMessageUserListResponse> => {
  const url = 'https://pro.xiaohongshu.com/api/edith/ads/pro/chat/chatline/chat';

  const headers = {
    Referer: 'https://pro.xiaohongshu.com/im/multiCustomerService',
    cookie: cookie,
    Authorization: '',
    'x-subsystem': 'ares',
  };

  const params = {
    porch_user_id: porch_user_id,
    limit: limit,
  };
  if (refreshtime) {
    params['ref_update_time'] = refreshtime;
  }
  if (is_active) {
    params['is_active'] = true;
  }

  const result = await $http.get(url, {
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface XiaohongshuMessageUserListResponse {
  /**
   * 0:正常
   */
  code: number;
  success: boolean;
  msg: string;
  data: {
    result: { success: boolean };
    chat_list: Array<XiaohongshuMessageUserInfo>;
  };
}
export interface XiaohongshuMessageUserInfo {
  sixin_chat: {
    /**
     * 13位时间戳，最新消息时间戳
     */
    last_msg_ts: number;
    /**
     * 最后一条消息内容
     */
    last_msg_content: string; //'[卡片] 蚁小二一键分发系统的群聊';
    /**
     * 会话中消息的序号？
     */
    last_store_id: number;
    /**
     * 对话用户id
     */
    user_id: string;
    /**
     * 对话用户昵称
     */
    nickname: string;
    /**
     * 对话用户头像
     */
    avatar: string;
  };
  session: {
    session_id: number;
    state: string; //'ENDED';
    /**
     * 是否已回复？
     */
    is_replied: boolean;
    grantor_user_id: string;
  };
  long_chat_view: {
    favorite: boolean;
    /**
     * 是否当前对话
     */
    active: boolean;
    /**
     * 13位时间戳
     */
    last_msg_ts: number;
  };
  /**
   * 是否在黑名单
   */
  in_blacklist: boolean;
}
/**
 *
 * @param cookie
 * @param porch_user_id 当前商户id？
 * @param customer_user_id 对话用户id
 * @param last_store_id 起始消息store_id
 * @param limit 单页数量
 */
export const getXiaohongshuMessageListResponse = async (
  cookie: string,
  porch_user_id: string,
  customer_user_id: string,
  last_store_id: number = 0,
  limit: number = 20,
): Promise<XiaohongshuMessageListResponse> => {
  const url = 'https://pro.xiaohongshu.com/api/edith/ads/pro/chat/chatline/msg';

  const headers = {
    Referer: 'https://pro.xiaohongshu.com/im/multiCustomerService',
    cookie: cookie,
    Authorization: '',
    'x-subsystem': 'ares',
  };

  const params = {
    porch_user_id: porch_user_id,
    limit: limit,
    customer_user_id: customer_user_id,
  };
  if (last_store_id) {
    params['ref_store_id'] = last_store_id;
  }

  const result = await $http.get(url, {
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface XiaohongshuMessageListResponse {
  msg: string;
  data: {
    messages: [
      {
        sixin_message: {
          /**
           * 消息id
           */
          id: string; //'5b7b6eb42352610001dcd389.61b8073f000000001000c5c2.1e787200c4e9cc0';
          /**
           * 消息发送人userid
           */
          sender_id: string;
          /**
           * 消息接收人用户id
           */
          receiver_id: string;
          /**
           * 消息类型
           */
          message_type: 'EMOTION' | 'TEXT' | 'IMAGE' | 'CARD';
          /**
           * 消息内容
           */
          content: string; // '{"applySource":"","emojiKey":"[谢谢宝R]","image":"https://fe-video-qc.xhscdn.com/fe-platform/f6abb97f38ac42c92ee4317a9affcb04a85c3b9d.png","subType":"greeting"}';
          /**
           * 消息时13位间戳
           */
          created_at: number;
          store_id: number;
        };
        message_extension: {
          /**
           * 目前见过0和1，应该是发送消息的用户类型
           */
          sender_type: number;
          /**
           * 发型消息的用户id
           */
          customer_user_id: string;
          /**
           * 发送消息的用户昵称
           */
          csa_name: string;
        };
      },
    ];
  };
  /**
   * 0: 正常，飞0异常
   */
  code: number;
  success: boolean;
}

/**
 *
 * @param cookie
 * @param porch_user_id 当前用户003userid
 * @param receiverId 接受消息的用户id
 * @param typeStr 消息类型 'TEXT'：纯文本消息（表情也是文本） | 'IMAGE':图片消息，图片消息的content是json字符串 | 'note':作品消息  ，还有商品和获客工具暂未
 * @param msgContent 消息内容，字符串
 * @param proxyAgent
 */
export const sendXiaohongshuProMessageResponse = async (
  cookie: string,
  porch_user_id: string,
  receiverId: string,
  typeStr: 'TEXT' | 'IMAGE' | 'note',
  msgContent: string,
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<XiaohongshuSendMessageResponse> => {
  const url = 'https://pro.xiaohongshu.com/api/edith/ads/pro/chat/chatline/msg';

  const headers = {
    Referer: 'https://pro.xiaohongshu.com/im/multiCustomerService',
    cookie: cookie,
    Authorization: '',
    'x-subsystem': 'ares',
  };

  const tm = new Date().getTime().toString();
  const postData = {
    sender_porch_id: porch_user_id,
    receiver_id: receiverId,
    content: msgContent,
    message_type: typeStr,
    uuid: `${tm}-${tm.substring(0, 5)}`,
    platform: 3,
  };

  const params = {
    porch_user_id: porch_user_id,
  };

  const result = await $http.post(url, postData, {
    headers: headers,
    params: params,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};

export interface XiaohongshuSendMessageResponse {
  /**
   * 状态码 0:正常 非0 异常
   */
  code: number;
  success: boolean;
  /**
   * 提示消息
   */
  msg: string;
  data: {
    /**
     * 当前发送的消息id
     */
    message_id: string;
    /**
     * 对话中消息序号吧？
     */
    store_id: number;
  };
}

/**
 * 获取用户信息
 * @param cookie
 */
export const getXiaohongshuProUserInfoResponse = async (cookie: string): Promise<XiaohongshuProUserInfoResponse> => {
  const url = 'https://pro.xiaohongshu.com/api/edith/ads/pro/chat/ads/user/info';

  const headers = {
    cookie: cookie,
    referer: 'https://pro.xiaohongshu.com/im/multiCustomerService',
    origin: 'https://pro.xiaohongshu.com',
    'x-subsystem': 'ares',
  };

  const result = await $http?.get(url, { headers: headers });

  return result.data;
};

export interface XiaohongshuProUserInfoResponse {
  /**
   * 状态码 0：正常 非0异常
   */
  code: number;
  data: {
    /**
     * 普通小红书账号id
     */
    c_user_id: string;
    /**
     * 商户id,003用户id,私信通会用
     */
    b_user_id: string;
    /**
     * 用户昵称
     */
    name: string;
    /**
     * 头像
     */
    avatar_url: string;
    /**
     * 003用户id,私信通会用
     */
    user_id: string;
  };
  msg: string;
}

/**
 * 获取发送图片消息时上传图片的参数
 * @param cookie
 */
export const getXiaohongshuProMsgImageArgResponse = async (
  cookie: string,
): Promise<XiaohongshuMessageImageArgResponse> => {
  const url =
    'https://pro.xiaohongshu.com/api/edith/ads/pro/chat/uploader/v3/token?biz_name=cs&scene=feeva_img&file_count=1&version=1&source=web';

  const headers = {
    cookie: cookie,
    referer: 'https://pro.xiaohongshu.com/im/multiCustomerService',
    origin: 'https://pro.xiaohongshu.com',
    'x-subsystem': 'ares',
    Authorization: '',
  };

  const result = await $http?.get(url, { headers: headers });

  return result.data;
};

export interface XiaohongshuMessageImageArgResponse {
  /**
   * 状态码 0:正常 飞0异常
   */
  code: number;
  success: boolean;
  msg: string;
  data: {
    upload_temp_permits: Array<XiaohongshuMsgImageArg>;
    result: { success: boolean };
  };
}

export interface XiaohongshuMsgImageArg {
  upload_addr: string; //'ros-upload.xiaohongshu.com';
  /**
   * 13位时间戳
   */
  expire_time: number;
  region: string;
  file_ids: Array<string>;
  upload_id: number;
  token: string;
  qos: number;
  cloud_type: number;
  bucket: string;
}

/**
 * 上传图片
 * @param imageData
 * @param upArgs
 */
export const uploadXiaohongshuProMsgImageResponse = async (
  imageData: buffer.Buffer,
  upArgs: XiaohongshuMsgImageArg,
): Promise<string> => {
  const url = `https://${upArgs.upload_addr}/${upArgs.file_ids[0]}`;

  const headers = {
    referer: 'https://pro.xiaohongshu.com',
    origin: 'https://pro.xiaohongshu.com',
    Authorization: '',
    'x-cos-security-token': upArgs.token,
    'Content-Type': 'image/jpeg',
  };

  const result = await $http?.put(url, imageData, { headers: headers });

  return result.headers['x-ros-preview-url'];
};
