import { HttpConfig, $http } from '@/http';
import { errorCode } from '@/media-platform/errorCode';
import { PlatformAuthorInfo } from '@/media-platform/baseModel';
import { createKuaiProxyAgent, IWebProxy } from '@/media-platform/webproxy';

export const REDNOTE_USER_INFO_URL = 'https://creator.rednote.com/api/galaxy/user/info';
export const REDNOTE_PUBLISH_URL = 'https://creator.rednote.com/publish/publish';

export interface RedNoteUserInfo {
  userId: string;
  userName: string;
  userAvatar?: string;
  userDesc?: string;
  redId?: string;
  role?: string;
  permissions?: string[];
  zone?: string;
  realNameVerified?: boolean;
  [key: string]: unknown;
}

export interface RedNoteUserInfoResponse {
  result?: number;
  success: boolean;
  code: number;
  msg?: string;
  message?: string;
  data?: RedNoteUserInfo;
}

export const isValidRedNoteUserInfo = (
  result: RedNoteUserInfoResponse | undefined,
): result is RedNoteUserInfoResponse & { data: RedNoteUserInfo } =>
  result?.code === 0 && result.success === true && Boolean(result.data?.userId?.toString());

/**
 * 使用浏览器登录 Cookie 获取 RedNote 用户信息。该接口当前不需要签名头。
 */
export const getRedNoteUserInfoResponse = async (
  cookie: string,
  proxy?: IWebProxy,
): Promise<RedNoteUserInfoResponse> => {
  const proxyAgent = proxy ? createKuaiProxyAgent(proxy) : undefined;
  const response = await $http.get<RedNoteUserInfoResponse>(REDNOTE_USER_INFO_URL, {
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': HttpConfig.acceptLanguage,
      Cookie: cookie,
      Referer: REDNOTE_PUBLISH_URL,
      'User-Agent': HttpConfig.userAgent,
    },
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return response.data;
};

export const getRedNoteUserInfo = async (cookie: string, proxy?: IWebProxy): Promise<PlatformAuthorInfo> => {
  const result = await getRedNoteUserInfoResponse(cookie, proxy);
  if (isValidRedNoteUserInfo(result)) {
    return {
      code: errorCode.ok,
      msg: '',
      yixiaoerId: result.data.userId.toString(),
      yixiaoerName: result.data.userName?.toString() ?? '',
      yixiaoerImageUrl: result.data.userAvatar,
      verify: result.data.realNameVerified,
      raw: result.data,
    };
  }

  return {
    code: isRedNoteLoginExpired(result) ? errorCode.loginExpire : errorCode.unknown_error,
    msg: result?.msg ?? result?.message ?? 'RedNote用户信息获取失败',
    raw: result,
  };
};

export const isRedNoteLoginExpired = (result: RedNoteUserInfoResponse | undefined): boolean => {
  const message = `${result?.msg ?? ''}${result?.message ?? ''}`.toLowerCase();
  return result?.code === -100 || message.includes('登录') || message.includes('login');
};
