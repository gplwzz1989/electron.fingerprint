import { HttpConfig, $http } from '@/http';
import { getXhsRemoteSign } from '@/media-platform/xhs-remote-sign.service';
import { createKuaiProxyAgent, IWebProxy } from '@/media-platform/webproxy';
import { AxiosRequestConfig } from 'axios';

export const REDNOTE_WEB_API_ORIGIN = 'https://webapi.rednote.com';
export const REDNOTE_WEB_ORIGIN = 'https://www.rednote.com';

export interface RedNoteSignedRequestOptions {
  proxy?: IWebProxy;
  referer?: string;
  /** 请求实际发送到的站点，默认使用 RedNote Web API。 */
  requestOrigin?: string;
  headers?: Record<string, string>;
}

export const replaceCookieA1 = (cookie: string, signedA1?: string): string => {
  if (!signedA1) return cookie;
  const cookieItems = cookie
    .split(';')
    .map((item) => item.trim())
    .filter((item) => item && !item.toLowerCase().startsWith('a1='));
  cookieItems.push(`a1=${signedA1}`);
  return cookieItems.join('; ');
};

const createSignedConfig = (
  cookie: string,
  sign: Awaited<ReturnType<typeof getXhsRemoteSign>>,
  options?: RedNoteSignedRequestOptions,
): AxiosRequestConfig => {
  const proxyAgent = options?.proxy ? createKuaiProxyAgent(options.proxy) : undefined;
  return {
    headers: {
      Accept: '*/*',
      'Accept-Language': HttpConfig.acceptLanguage,
      Authorization: '',
      Cookie: replaceCookieA1(cookie, sign.a1),
      Origin: REDNOTE_WEB_ORIGIN,
      Referer: options?.referer ?? `${REDNOTE_WEB_ORIGIN}/`,
      'Content-Type': 'application/json',
      'User-Agent': HttpConfig.userAgent,
      'X-s': sign['X-s'],
      'X-t': sign['X-t'].toString(),
      'X-S-Common': sign['X-S-Common'] ?? '',
      ...(sign['X-Rap-Param'] ? { 'X-Rap-Param': sign['X-Rap-Param'] } : {}),
      ...options?.headers,
    },
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  };
};

/** 使用同一份原始 JSON 字符串完成签名和发送，避免二次序列化导致验签失败。 */
export const redNoteSignedPostRaw = async <T>(
  cookie: string,
  path: string,
  body: string,
  options?: RedNoteSignedRequestOptions,
): Promise<T> => {
  const sign = await getXhsRemoteSign(path, body);
  const response = await $http.post<T>(
    `${REDNOTE_WEB_API_ORIGIN}${path}`,
    body,
    createSignedConfig(cookie, sign, options),
  );
  return response.data;
};

export const redNoteSignedPost = async <T>(
  cookie: string,
  path: string,
  data: unknown,
  options?: RedNoteSignedRequestOptions,
): Promise<T> => redNoteSignedPostRaw(cookie, path, JSON.stringify(data), options);

export const redNoteSignedGet = async <T>(
  cookie: string,
  path: string,
  options?: RedNoteSignedRequestOptions,
): Promise<T> => {
  const sign = await getXhsRemoteSign(path);
  const response = await $http.get<T>(
    `${options?.requestOrigin ?? REDNOTE_WEB_API_ORIGIN}${path}`,
    createSignedConfig(cookie, sign, options),
  );
  return response.data;
};
