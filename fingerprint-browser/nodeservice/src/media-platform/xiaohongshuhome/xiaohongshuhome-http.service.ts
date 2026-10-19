import { $http } from '@/http';
import { createKuaiProxyAgent, IWebProxy } from '@/media-platform/webproxy';
import { getNewSign } from './xiaohongshuhome-base.service';

const XIAOHONGSHUHOME_HOST = 'https://edith.xiaohongshu.com';
const XIAOHONGSHUHOME_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36';

export interface XiaohongshuhomeApiResponse<T = Record<string, any>> {
  code: number;
  msg?: string;
  success?: boolean;
  data?: T;
  [key: string]: any;
}

interface XiaohongshuhomeSignResult {
  'X-s'?: string;
  'X-t'?: string | number;
  'X-S-Common'?: string;
  a1?: string;
}

const updateCookieBySign = (cookie: string, sign: XiaohongshuhomeSignResult): string => {
  if (!sign.a1) {
    return cookie;
  }

  if (/(^|;\s*)a1=/.test(cookie)) {
    return cookie.replace(/(^|;\s*)a1=[^;]*/, `$1a1old=${sign.a1}`) + `;a1=${sign.a1}`;
  }

  return `${cookie};a1=${sign.a1}`;
};

const parseSignResult = (signText: string): XiaohongshuhomeSignResult => {
  if (!signText) {
    throw new Error('获取小红书主页接口签名失败，请稍后重试');
  }

  try {
    const sign = JSON.parse(signText) as XiaohongshuhomeSignResult;
    if (!sign['X-s']) {
      throw new Error('小红书主页接口签名缺少X-s参数，请稍后重试');
    }
    return sign;
  } catch (error) {
    if (error instanceof Error && error.message.includes('小红书主页接口')) {
      throw error;
    }
    throw new Error('解析小红书主页接口签名失败，请稍后重试');
  }
};

/**
 * 调用小红书主页接口，签名统一使用当前模块已有的签名服务。
 */
export const requestXiaohongshuhome = async <T = Record<string, any>>(
  cookie: string,
  urlPath: string,
  method: 'GET' | 'POST' = 'GET',
  body?: Record<string, any>,
  proxy?: IWebProxy,
): Promise<XiaohongshuhomeApiResponse<T>> => {
  const bodyText = body === undefined ? undefined : JSON.stringify(body);
  const sign = parseSignResult(await getNewSign(urlPath, bodyText));
  const requestCookie = updateCookieBySign(cookie, sign);
  const headers: Record<string, string> = {
    cookie: requestCookie,
    referer: 'https://www.xiaohongshu.com/',
    Origin: 'https://www.xiaohongshu.com',
    Accept: 'application/json, text/plain, */*',
    'User-Agent': XIAOHONGSHUHOME_USER_AGENT,
    Authorization: '',
    'X-s': sign['X-s'] as string,
    'X-t': sign['X-t']?.toString() ?? Date.now().toString(),
    'X-S-Common': sign['X-S-Common']?.toString() ?? '',
  };

  if (bodyText !== undefined) {
    headers['Content-Type'] = 'application/json;charset=UTF-8';
  }

  const webProxy = proxy?.serverAdd ? createKuaiProxyAgent(proxy) : undefined;
  const response =
    method === 'GET'
      ? await $http.get(`${XIAOHONGSHUHOME_HOST}${urlPath}`, {
          headers,
          httpAgent: webProxy,
          httpsAgent: webProxy,
        })
      : await $http.post(`${XIAOHONGSHUHOME_HOST}${urlPath}`, bodyText, {
          headers,
          httpAgent: webProxy,
          httpsAgent: webProxy,
        });

  if (!response?.data || typeof response.data !== 'object') {
    throw new Error('小红书主页接口返回数据格式异常，请稍后重试');
  }

  return response.data as XiaohongshuhomeApiResponse<T>;
};
