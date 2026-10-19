import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { isJson } from '@/utils';
import { HttpsProxyAgent } from 'https-proxy-agent';

export let XinlangweiboPublicAuthorSearchDefaultCookie = 'SUB=_123qwe;';
const XinlangweiboPublicAuthorSearchUserAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0';
const XinlangweiboPublicAuthorSearchSecChUa = '"Microsoft Edge";v="149", "Chromium";v="149", "Not)A;Brand";v="24"';
const XinlangweiboPublicAuthorSearchAcceptLanguage = 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7,en-GB;q=0.6';

const appendXinlangweiboPublicAuthorSearchCookie = (cookie: string, name: string, value: string): string => {
  const cookieItem = `${name}=${value}`;
  if (!cookie?.trim()) {
    return cookieItem;
  }
  const cookieList = cookie
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean);
  const cookieIndex = cookieList.findIndex((item) => item.startsWith(`${name}=`));
  if (cookieIndex >= 0) {
    cookieList[cookieIndex] = cookieItem;
  } else {
    cookieList.push(cookieItem);
  }
  return cookieList.join('; ');
};

const mergeXinlangweiboPublicAuthorSearchResponseCookie = (cookie: string, setCookie: unknown): string => {
  const setCookieList = Array.isArray(setCookie) ? setCookie : typeof setCookie === 'string' ? [setCookie] : [];
  return setCookieList.reduce((newCookie, item) => {
    const cookieText = item?.toString().split(';')[0]?.trim();
    const splitIndex = cookieText?.indexOf('=') ?? -1;
    if (!cookieText || splitIndex <= 0) {
      return newCookie;
    }
    return appendXinlangweiboPublicAuthorSearchCookie(
      newCookie,
      cookieText.substring(0, splitIndex),
      cookieText.substring(splitIndex + 1),
    );
  }, cookie);
};

const syncXinlangweiboPublicAuthorSearchResponseCookie = (requestCookie: string, setCookie: unknown): string => {
  const nextDefaultCookie = mergeXinlangweiboPublicAuthorSearchResponseCookie(
    XinlangweiboPublicAuthorSearchDefaultCookie,
    setCookie,
  );
  XinlangweiboPublicAuthorSearchDefaultCookie = nextDefaultCookie;
  return mergeXinlangweiboPublicAuthorSearchResponseCookie(requestCookie, setCookie);
};

/**
 * 获取用户主页数据
 * @param cookie
 * @param uid 用户id
 */
export const getUserHomeDataAsync = async (cookie: string, uid: number): Promise<XinlangweiboUserHomeDataResponse> => {
  const result = await $http.get<unknown, AxiosResponse<XinlangweiboUserHomeDataResponse>>(
    'https://weibo.com/ajax/profile/info',
    {
      headers: {
        cookie: cookie,
        referer: `https://weibo.com/u/${uid}?tabtype=feed`,
        authority: 'weibo.com',
        'x-requested-with': 'XMLHttpRequest',
      },
      params: {
        uid: uid,
      },
    },
  );

  return result.data;
};

export interface XinlangweiboUserHomeDataResponse {
  ok: number;
  data: {
    user: {
      /**
       * 用户id
       */
      id: number;
      idstr: string;
      pc_new: number;

      /**
       * 昵称
       */
      screen_name: string;

      /**
       * 封面
       */
      profile_image_url: string;
      profile_url: string;
      verified: boolean;
      verified_type: number;
      domain: string;
      weihao: string;
      avatar_large: string;
      avatar_hd: string;
      follow_me: boolean;
      following: boolean;
      mbrank: number;
      mbtype: number;
      v_plus: number;
      planet_video: boolean;
      description: string;
      location: string;
      gender: string;
      /**
       * 粉丝数
       */
      followers_count: number;
      followers_count_str: string;

      /**
       * 关注数
       */
      friends_count: number;

      /**
       * 作品数
       */
      statuses_count: number;
      url: string;
      svip: number;
      vvip: number;
      cover_image_phone: string;
      icon_list: [];
      user_type: number;
      is_star: string;
      is_muteuser: boolean;
      special_follow: boolean;
      status_total_counter: {
        total_cnt: number;
      };
    };
    tabList: Array<{
      name: string;
      tabName: string;
    }>;
    blockText: string;
  };
  log: boolean;
  message: string;
}

export const getXinlangweiboBlueVIPUserResponse = async (
  cookie: string,
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<XinlangweiboBlueVIPUserInfoResponse | null> => {
  const url = 'https://e.weibo.com/v1/eps/native/info';

  const headers = {
    cookie: cookie,
    referer: `https://e.weibo.com/v1/eps/manage/home?url=https%3A%2F%2Fe.weibo.com%2Fv1%2Feps%2Fhomepage`,
    authority: 'weibo.com',
    'x-requested-with': 'XMLHttpRequest',
  };

  const result = await $http.get(url, { headers: headers, httpAgent: proxyAgent, httpsAgent: proxyAgent });

  return isJson(result.data) ? (result.data as XinlangweiboBlueVIPUserInfoResponse) : null;
};

export const getXinlangweiboIndex = async (
  cookie: string,
  proxyAgent: object | undefined = undefined,
): Promise<{ code: number; result: string; cookie?: string }> => {
  const url = 'https://me.weibo.com/';

  const headers = {
    cookie: cookie,
    referer: `https://weibo.com`,
  };

  const result = await $http.get(url, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
    maxRedirects: 0,
    responseType: 'text',
  });
  const cookies = result.headers['set-cookie'];
  if (cookies && cookies?.length > 0) {
    for (const key of cookies) {
      const item = key?.trim().split(';')[0]?.split('=');
      cookie = cookie.replace(item[0], `${item[0]}_Old`);
      cookie = `${cookie};${key.split(';')[0]}`;
    }
  }
  return { code: result.status, result: result.data, cookie: cookie };
};

export const getXinlangweiboPublicAuthorSearchHtml = async (
  cookie: string | undefined,
  keyWord: string,
  proxyAgent: HttpsProxyAgent<string> | object | undefined = undefined,
): Promise<string> => {
  const requestCookie = cookie?.trim() ? cookie : XinlangweiboPublicAuthorSearchDefaultCookie;
  const result = await $http.get<unknown, AxiosResponse<string>>('https://s.weibo.com/user', {
    headers: {
      Cookie: requestCookie,
      Referer: 'https://s.weibo.com/',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': XinlangweiboPublicAuthorSearchAcceptLanguage,
      'User-Agent': XinlangweiboPublicAuthorSearchUserAgent,
      'sec-ch-ua': XinlangweiboPublicAuthorSearchSecChUa,
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-User': '?1',
      'Sec-Fetch-Dest': 'document',
      'Upgrade-Insecure-Requests': '1',
    },
    params: {
      q: keyWord,
      Refer: 'index',
    },
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
    responseType: 'text',
  });
  syncXinlangweiboPublicAuthorSearchResponseCookie(requestCookie, result.headers['set-cookie']);
  return result.data?.toString() ?? '';
};

export interface XinlangweiboBlueVIPUserInfoResponse {
  code: string; //'100000';
  msg: string;
  data: {
    /**
     * 昵称
     */
    nickname: string;
    /**
     * 头像
     */
    image_url: string;
    /**
     * 用户页，徐亚分割出用户id
     */
    profile: string; //'https://weibo.com/u/7915231671';
  };
}
