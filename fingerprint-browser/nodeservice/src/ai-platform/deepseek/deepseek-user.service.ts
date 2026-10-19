import { $http } from '@/http';

/**
 * DeepSeek 用户信息响应接口
 */
export interface DeepSeekUserResponse {
  code: number;
  msg: string;
  data: {
    biz_code: number;
    biz_msg: string;
    biz_data: {
      id: string;
      token: string;
      email: string;
      mobile_number: string;
      area_code: string;
      status: number;
      id_profile: any;
      id_profiles: any[];
      chat: {
        is_muted: number;
        mute_until: any;
      };
      has_legacy_chat_history: boolean;
      need_birthday: boolean;
    };
  };
}

/**
 * 从cookie字符串中提取accToken
 * @param cookie Cookie字符串
 * @returns accToken值，如果未找到则返回空字符串
 */
const extractAccToken = (cookie: string): string => {
  // 如果cookie本身就是token格式（不包含=），直接返回
  if (!cookie.includes('=') || !cookie?.includes('accToken')) {
    return '';
  }

  // 尝试匹配 accToken=xxx 格式
  const accToken = cookie.split('accToken=')[1]?.split(';')[0];

  // 如果都没找到，返回空字符串
  return accToken?.trim();
};

/**
 * 获取DeepSeek用户信息
 * @param cookie Cookie字符串（需要包含accToken）
 * @returns 用户信息的JSON响应
 */
export const getDeepSeekUserInfo = async (cookie: string, proxyAgent?: object): Promise<DeepSeekUserResponse> => {
  const url = 'https://chat.deepseek.com/api/v0/users/current';

  // 从cookie中提取accToken
  const accToken = extractAccToken(cookie);

  const headers = {
    Cookie: cookie,
    authorization: `Bearer ${accToken}`,
    'x-client-locale': 'zh_CN',
    'sec-ch-ua-platform': '"Windows"',
    'sec-ch-ua': '"Chromium";v="146", "Not-A.Brand";v="24", "Microsoft Edge";v="146"',
    'sec-ch-ua-mobile': '?0',
    'x-client-timezone-offset': '28800',
    'x-app-version': '20241129.1',
    'x-client-platform': 'web',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Dest': 'empty',
    Referer: 'https://chat.deepseek.com/',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
  };

  const response = await $http.get<DeepSeekUserResponse>(url, {
    headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return response.data;
};
