import { $http } from '@/http';
import { ResponseBody } from './private_msg/re_msg_decode';
import { Buffer } from 'protobufjs';

/**
 * 获取对话列表
 * @param cookie
 * @param buffer
 * @param proxyAgent
 */
export const getDouYinMessageConversationListResponse = async (
  cookie: string,
  buffer: Buffer,
  proxyAgent?: object | undefined,
): Promise<Buffer> => {
  const url = 'https://imapi.douyin.com/v2/message/get_by_user_init';

  const header = {
    Accept: 'application/x-protobuf',
    Referer: 'https://creator.douyin.com/',
    Cookie: cookie,
    Origin: 'https://creator.douyin.com',
    'Content-Type': 'application/x-protobuf',
    'Sec-Fetch-Site': 'same-site',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Dest': 'empty',
  };

  const result = await $http.post(url, buffer, {
    headers: header,
    responseType: 'arraybuffer',
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

/**
 * 向指定会话发送消息
 * @param cookie
 * @param buffer
 * @param proxyAgent
 */
export const sendDouYinMessageBYConversation = async (
  cookie: string,
  buffer: Buffer,
  proxyAgent?: object | undefined,
): Promise<Buffer> => {
  const url = 'https://imapi.snssdk.com/v1/message/send';

  const header = {
    referer: 'https://creator.douyin.com',
    cookie: cookie,
    Origin: 'https://creator.douyin.com',
    'Content-Type': 'application/x-protobuf',
  };

  const result = await $http.post(url, buffer, {
    headers: header,
    responseType: 'arraybuffer',
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};
/**
 * 获取新消息列表
 * @param cookie
 * @param buffer
 */
export const getDouYinMessageNewListResponse = async (
  cookie: string,
  buffer: Buffer,
  proxyAgent?: object | undefined,
): Promise<Buffer> => {
  const url = 'https://imapi.douyin.com/v1/message/get_by_user';

  const header = {
    Accept: 'application/x-protobuf',
    Referer: 'https://creator.douyin.com/',
    Cookie: cookie,
    Origin: 'https://creator.douyin.com',
    'Content-Type': 'application/x-protobuf',
    'Sec-Fetch-Site': 'same-site',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Dest': 'empty',
  };

  const result = await $http.post(url, buffer, {
    headers: header,
    responseType: 'arraybuffer',
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

/**
 * 获取具体对话历史消息列表
 * @param cookie
 * @param buffer
 */
export const getDouYinMessageHistoryListResponse = async (
  cookie: string,
  buffer: Buffer,
  proxyAgent?: object | undefined,
): Promise<Buffer> => {
  const url = 'https://imapi.douyin.com/v1/message/get_by_conversation';

  const header = {
    Accept: 'application/x-protobuf',
    Referer: 'https://creator.douyin.com/',
    Cookie: cookie,
    Origin: 'https://creator.douyin.com',
    'Content-Type': 'application/x-protobuf',
    'Sec-Fetch-Site': 'same-site',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Dest': 'empty',
  };

  const result = await $http.post(url, buffer, {
    headers: header,
    responseType: 'arraybuffer',
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

/**
 * 获取陌生人新对话
 * @param cookie
 * @param buffer
 */
export const getDouYinMessageNewConversationListResponse = async (
  cookie: string,
  buffer: Buffer,
  proxyAgent?: object | undefined,
): Promise<Buffer> => {
  const url = 'https://imapi.douyin.com/v1/stranger/get_conversation_list';

  const header = {
    Accept: 'application/x-protobuf',
    Referer: 'https://creator.douyin.com/',
    Cookie: cookie,
    Origin: 'https://creator.douyin.com',
    'Content-Type': 'application/x-protobuf',
    'Sec-Fetch-Site': 'same-site',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Dest': 'empty',
  };

  const result = await $http.post(url, buffer, {
    headers: header,
    responseType: 'arraybuffer',
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
    timeout: 10000,
  });

  return result.data;
};

export const getDouYinMessageUserDetailResponse = async (
  cookie: string,
  userIds: Array<string>,
  sdkToken: string,
  proxyAgent?: object | undefined,
): Promise<MessageUserInfoResponseData> => {
  const url =
    'https://creator.douyin.com/aweme/v1/creator/im/user_detail/?aid=2906&app_name=aweme_creator_platform&device_platform=web&referer=&user_agent=Mozilla%2F5.0+(Windows+NT+10.0%3B+Win64%3B+x64)+AppleWebKit%2F537.36+(KHTML%2C+like+Gecko)+Chrome%2F142.0.0.0+Safari%2F537.36+Edg%2F142.0.0.0&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=5.0+(Windows+NT+10.0%3B+Win64%3B+x64)+AppleWebKit%2F537.36+(KHTML%2C+like+Gecko)+Chrome%2F142.0.0.0+Safari%2F537.36+Edg%2F142.0.0.0&browser_online=true&timezone_name=Asia%2FShanghai&msToken=&a_bogus=';

  const header = {
    referer: 'https://creator.douyin.com',
    cookie: cookie,
    Origin: 'https://creator.douyin.com',
    'Content-Type': 'application/json',
    'x-secsdk-csrf-token': sdkToken,
  };

  const postData = { user_ids: userIds };

  const result = await $http.post(url, postData, {
    headers: header,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

interface MessageUserInfoResponseData {
  extra: {
    now: number;
  };
  status_code: number;
  status_msg: string;
  status_message: string;
  user_list: Array<{
    user: {
      SecretUseId: string;
      ShareQrcodeUri: string;
      ShortId: string;
      avatar_thumb: {
        uri: string;
        url_list: string[];
      };
      nickname: string;
      signature: string;
    };
    user_id: string;
  }>;
}
