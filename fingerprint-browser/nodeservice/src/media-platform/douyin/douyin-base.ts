import { $http, HttpConfig } from '../../http';
import { getSignServerUrl, isJson, Task } from '../../utils';
import { getNowTimeStamp } from '../../utils/use-date';

export const hasDouYinDataManage = async (cookie: string): Promise<HasDataManageResponse> => {
  const url = `https://creator.douyin.com/aweme/v1/creator/user/info/?no_cache=${getNowTimeStamp(
    10,
  )}&aid=2906&app_name=aweme_creator_platform&device_platform=web&referer=&user_agent=Mozilla%2F5.0+(Windows+NT+10.0%3B+Win64%3B+x64)+AppleWebKit%2F537.36+(KHTML%2C+like+Gecko)+Chrome%2F84.0.4147.89+Safari%2F537.36&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=5.0+(Windows+NT+10.0%3B+Win64%3B+x64)+AppleWebKit%2F537.36+(KHTML%2C+like+Gecko)+Chrome%2F84.0.4147.89+Safari%2F537.36&browser_online=true&timezone_name=Asia%2FShanghai&_signature=`;

  const headers = {
    cookie: cookie,
    Referer: 'https://creator.douyin.com/',
  };

  const params = {};

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface HasDataManageResponse {
  has_data_mgmt_perm: true;
  status_code: number;
  status_msg: string;
}

export const openDouyinDataManageResponse = async (cookie: string): Promise<OpenDataManageResponse> => {
  const url = 'https://creator.douyin.com/aweme/v1/creator/role/apply?';

  const headers = {
    cookie: cookie,
    Referer: 'https://creator.douyin.com/',
  };

  const params = {
    aid: 2906,
    app_name: 'aweme_creator_platform',
    device_platform: 'web',
    referer: '',
    user_agent: HttpConfig.userAgent,
    cookie_enabled: true,
    screen_width: 1920,
    screen_height: 1080,
    browser_language: 'zh-CN',
    browser_platform: 'Win32',
    browser_name: 'Mozilla',
    browser_version: HttpConfig.userAgent,
    browser_online: true,
    timezone_name: 'Asia/Shanghai',
  };

  const postData = { role_key: 'CreatorDataManagementRole' };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface OpenDataManageResponse {
  extra: {
    now: number;
  };
  status_code: number;
  status_msg: string;
}

let portIndex = 0;
export const getSign = async (postStr: string = ''): Promise<string> => {
  portIndex++;
  let tmpIndex=portIndex;
  for (let i = 0; i < 4; i++) {
    try {
      // 每两次重试更换一次端口
      if (i > 0 && i % 2 === 0) {
        tmpIndex++;
      }
      // 准备请求数据
      const postData = {
        url: '',
        cookie: postStr,
        signType: 'browser',
        signCommand: 'pdouyin',
      };

      const url = getSignServerUrl('douyin', tmpIndex);
      // 发送请求
      const result = await $http.post<{
        signature?: string;
      }>(`${url}/Sign/GetSign`, postData, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      // 验证响应
      if (!result?.data?.signature || result.data?.signature === 'null') {
        await Task.Delay(1500);
        continue;
      }

      // 重置端口索引防止溢出
      if (portIndex > 100000) {
        portIndex = 0;
      }

      return result?.data?.signature;
    } catch (error) {
      // console.debug(`获取签名失败`, error);
    }
  }

  return '';
};

// {
//   "encrypt_uid": "J5NYUPtcxbi+QBbpivBT8+sq/K5v3J3uP8IH5tyyY05A1zs4eYLEHaUO0oI=",
//   "verify_ticket": "",
//   "copywriting_key": "creator",
//   "new_verify_flow": "",
//   "password": "123456",
//   "aid": 2906
// }
export function encryptParams(e: object, n: string): object {
  // 内置 encrypt 函数
  function encrypt(value: any): string {
    if (value === undefined) return '';

    const str = value.toString();
    const bytes: number[] = [];

    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);

      if (code <= 127) {
        bytes.push(code);
      } else if (code <= 2047) {
        bytes.push(192 | (code >> 6));
        bytes.push(128 | (code & 63));
      } else {
        bytes.push(224 | (code >> 12));
        bytes.push(128 | ((code >> 6) & 63));
        bytes.push(128 | (code & 63));
      }
    }

    for (let i = 0; i < bytes.length; i++) {
      bytes[i] &= 0xff;
    }

    return bytes.map((b) => (5 ^ b).toString(16)).join('');
  }

  if (typeof e !== 'object' || e === null) return e;

  const a: any = { ...e, mix_mode: 0 }; // 拷贝对象并初始化mix_mode
  let mixMode = 0;

  if (n && a[n] !== undefined) {
    mixMode |= 1;
    a[n] = encrypt(a[n]);
  }

  a.mix_mode = mixMode;
  return a;
}
