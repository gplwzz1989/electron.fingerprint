import { $http, HttpConfig } from '../../http';
import { AxiosResponse } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

export let BilibiliPublicAuthorSearchDefaultCookie = '';
const BilibiliPublicAuthorSearchUserAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0';
const BilibiliPublicAuthorSearchSecChUa = '"Microsoft Edge";v="149", "Chromium";v="149", "Not)A;Brand";v="24"';
const BilibiliPublicAuthorSearchAcceptLanguage = 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7,en-GB;q=0.6';

const appendBilibiliPublicAuthorSearchCookie = (cookie: string, name: string, value: string): string => {
  if (!name) {
    return cookie;
  }
  const cookieList = cookie
    .split(';')
    .map((item) => item.trim())
    .filter((item) => item && !item.startsWith(`${name}=`));
  cookieList.push(`${name}=${value}`);
  return `${cookieList.join('; ')};`;
};

const mergeBilibiliPublicAuthorSearchResponseCookie = (cookie: string, setCookie: unknown): string => {
  const responseCookieList = Array.isArray(setCookie) ? setCookie : typeof setCookie === 'string' ? [setCookie] : [];
  return responseCookieList.reduce((currentCookie, responseCookie) => {
    const cookiePair = responseCookie.split(';')[0]?.trim();
    const equalIndex = cookiePair.indexOf('=');
    if (equalIndex <= 0) {
      return currentCookie;
    }
    return appendBilibiliPublicAuthorSearchCookie(
      currentCookie,
      cookiePair.slice(0, equalIndex).trim(),
      cookiePair.slice(equalIndex + 1).trim(),
    );
  }, cookie);
};

const syncBilibiliPublicAuthorSearchResponseCookie = (requestCookie: string, setCookie: unknown): string => {
  const nextDefaultCookie = mergeBilibiliPublicAuthorSearchResponseCookie(
    BilibiliPublicAuthorSearchDefaultCookie,
    setCookie,
  );
  BilibiliPublicAuthorSearchDefaultCookie = nextDefaultCookie;
  return mergeBilibiliPublicAuthorSearchResponseCookie(requestCookie, setCookie);
};

/**
 * 获取B站公开作者搜索响应
 * @param cookie 为空时使用公开搜索默认 cookie
 * @param keyWord 搜索关键词
 * @param pageNum 页码
 * @param proxyAgent 代理
 */
export const getBilibiliPublicAuthorSearchResponse = async (
  cookie: string | undefined,
  keyWord: string,
  pageNum: number = 1,
  proxyAgent: HttpsProxyAgent<string> | object | undefined = undefined,
): Promise<BilibiliPublicAuthorSearchResponse> => {
  const requestCookie = cookie?.trim() ? cookie : BilibiliPublicAuthorSearchDefaultCookie;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const params = new URLSearchParams({
    category_id: '',
    search_type: 'bili_user',
    ad_resource: '5646',
    __refresh__: 'true',
    _extra: '',
    context: '',
    page: pageNum.toString(),
    page_size: '36',
    order: '',
    pubtime_begin_s: '0',
    pubtime_end_s: '0',
    duration: '',
    from_source: 'web_search',
    from_spmid: '333.337',
    platform: 'pc',
    highlight: '1',
    single_column: '0',
    keyword: keyWord ?? '',
    qv_id: '',
    source_tag: '3',
    gaia_vtoken: '',
    order_sort: '0',
    user_type: '0',
    dynamic_offset: '0',
    web_location: '1430654',
    w_rid: '',
    wts: timestamp,
  });
  const result = await $http.get<unknown, AxiosResponse<BilibiliPublicAuthorSearchResponse>>(
    `https://api.bilibili.com/x/web-interface/wbi/search/type?${params.toString()}`,
    {
      headers: {
        cookie: requestCookie,
        Host: 'api.bilibili.com',
        Origin: 'https://search.bilibili.com',
        Referer: `https://search.bilibili.com/upuser?from_source=web_search&keyword=${encodeURIComponent(keyWord ?? '')}`,
        'User-Agent': BilibiliPublicAuthorSearchUserAgent,
        Accept: '*/*',
        'Accept-Language': BilibiliPublicAuthorSearchAcceptLanguage,
        'sec-ch-ua': BilibiliPublicAuthorSearchSecChUa,
        'sec-ch-ua-mobile': HttpConfig.sec_ch_ua_mobile,
        'sec-ch-ua-platform': HttpConfig.sec_ch_ua_platform,
        'Sec-Fetch-Site': 'same-site',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
      },
      httpAgent: proxyAgent,
      httpsAgent: proxyAgent,
    },
  );
  syncBilibiliPublicAuthorSearchResponseCookie(requestCookie, result.headers['set-cookie']);
  return result.data;
};

export interface BilibiliPublicAuthorSearchItem {
  type?: string;
  mid?: number | string;
  uname?: string;
  usign?: string;
  fans?: number;
  videos?: number;
  upic?: string;
  verify_info?: string;
  official_verify?: {
    type?: number;
    desc?: string;
  };
}

export interface BilibiliPublicAuthorSearchResponse {
  code: number;
  message: string;
  ttl?: number;
  data?: {
    page?: number;
    pagesize?: number;
    numResults?: number;
    numPages?: number;
    result?: Array<BilibiliPublicAuthorSearchItem>;
  };
}
