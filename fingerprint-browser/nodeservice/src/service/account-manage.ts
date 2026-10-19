import { MediaAccount } from '@/service/model/media-account';
import { $http } from '@/http';
import { convertCookie, Cookie, isJson, Task } from '@/utils';
import pako from 'pako';

export class AccountManager {
  public static accountList = new Map<string, MediaAccount>();

  public static api_url: string = '';

  private static token: string = '';

  public static async initAllPlatformAccounts(token: string, apiUrl: string): Promise<boolean> {
    try {
      AccountManager.token = token;
      AccountManager.api_url = apiUrl;
      let nextTime = 0;
      AccountManager.accountList.clear();
      for (let i = 0; i < 100; i++) {
        const tmpList = await getPlatformAccounts(token, nextTime);
        if (tmpList?.statusCode !== 0) {
          console.error('获取', tmpList.message ?? '请求媒体账号数据异常');
          await Task.Delay(200);
        } else {
          if (tmpList?.data?.data && tmpList?.data?.data?.length > 0) {
            if (tmpList?.data?.data?.length >= 10) {
              nextTime = tmpList?.data?.data[tmpList.data.data?.length - 1].createdAt;
            }
            for (const item of tmpList?.data?.data) {
              AccountManager.accountList.set(item.id, item);
            }
          } else {
            break;
          }
        }
      }
      return AccountManager.accountList.size > 0;
    } catch (error) {
      console.error('获取媒体账号信息异常中断', error);
      return false;
    }
  }

  public static async getPlatformAccountCookie(accountId: string): Promise<string | undefined> {
    try {
      const account = AccountManager.accountList.get(accountId);
      if (!account) {
        return '';
      }
      const chkResult = await checkPlatformAccountCookie(AccountManager.api_url, account.spaceId, AccountManager.token);
      if (chkResult) {
        if (account.cookieMd5 !== chkResult) {
          const cookie = await getPlatformAccountCookie(AccountManager.api_url, account.spaceId, AccountManager.token);
          if (cookie?.cookies && cookie?.cookies?.length > 0) {
            account.cookieMd5 = chkResult;
            account.cookie = convertCookie(cookie.cookies);
            return account.cookie;
          } else {
            return account.cookie;
          }
        }
      } else {
        return '';
      }
    } catch (error) {
      console.error('获取cookie失败', error);
    }
    return undefined;
  }
}

export const checkPlatformAccountCookie = async (api_url: string, spaceId: string, token: string): Promise<string> => {
  const url = `${api_url}/storages/site-spaces/head-url?fileKey=${spaceId}`;

  const headers = {
    authorization: token,
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  const ossUrl = result?.data?.data;
  if (!ossUrl) {
    return '';
  }

  const cookieCheckDataRes = await $http.get(ossUrl);
  return cookieCheckDataRes?.headers['Content-Md5'];
};

export const getPlatformAccountCookie = async (
  api_url: string,
  spaceId: string,
  token: string,
): Promise<PlatformAccountCookieStorage | null> => {
  const url = `${api_url}/storages/site-spaces/access-url?fileKey=${spaceId}`;

  const headers = {
    authorization: token,
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  const ossUrl = result?.data?.data;
  if (!ossUrl) {
    return null;
  }

  const cookieCompressDataRes = await $http.get(ossUrl, { responseType: 'arraybuffer' });
  const jsonString = pako.inflate(cookieCompressDataRes.data, { to: 'string' });
  return JSON.parse(jsonString).cookies as PlatformAccountCookieStorage;
};

export interface PlatformAccountCookieStorage {
  cookies: Array<Cookie>;
  localStorage: Array<Record<string, string>>;
}

export const getPlatformAccounts = async (token: string, nextTime: number): Promise<PlatformAccountResponse> => {
  const url = 'https://lite-api-staging.yixiaoer.cn/platform-accounts?isolation=true';

  const headers = {
    Accept: 'application/json',
    authorization: token,
  };
  const params = {};
  if (nextTime) {
    params['time'] = nextTime;
  }
  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface PlatformAccountResponse {
  statusCode: number;
  message?: string;
  data: {
    page: number;
    size: number;
    totalSize: number;
    totalPage: number;
    data?: Array<MediaAccount>;
  };
}
