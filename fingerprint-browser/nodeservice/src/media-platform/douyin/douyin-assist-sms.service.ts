import { $http, HttpConfig } from '@/http';
import { encryptParams } from './douyin-base';

export interface DouyinAssistSmsRequestOptions {
  msToken?: string;
  aBogus?: string;
  sessionDtrait?: string;
  sdkToken: string;
  userAgent?: string;
  secChUa?: string;
  referer?: string;
  proxyAgent?: object;
}

export interface DouyinAssistSmsResponse {
  data?: {
    log_id?: string;
    mobile?: string;
    mobile_ticket?: string;
    retry_time?: number;
    error_code?: number;
    description?: string;
  };
  message?: string;
}

export interface DouyinAssistVerifyResponse {
  data?: {
    error_code?: number;
    description?: string;
  };
  message?: string;
}

const getCookieValue = (cookie: string, name: string): string => {
  const cookieItem = cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));
  return cookieItem?.slice(name.length + 1) ?? '';
};

const getEncryptUid = (checkStr: string): string => {
  let decodedCheckStr = checkStr;
  try {
    decodedCheckStr = decodeURIComponent(checkStr);
  } catch {
    decodedCheckStr = checkStr;
  }
  try {
    const checkData = JSON.parse(decodedCheckStr) as { encrypt_uid?: string };
    return checkData.encrypt_uid ?? '';
  } catch {
    throw new Error('风控参数格式异常，无法获取账号标识');
  }
};

/**
 * 按官方创作者中心的辅助手机号验证流程发送短信
 */
export const sendDouyinAssistSmsCode = async (
  cookie: string,
  checkStr: string,
  options: DouyinAssistSmsRequestOptions,
): Promise<DouyinAssistSmsResponse> => {
  const encryptUid = getEncryptUid(checkStr);
  if (!encryptUid) {
    throw new Error('风控参数中缺少账号标识');
  }

  const bizTraceId = getCookieValue(cookie, 'biz_trace_id');
  const passportCsrfToken = getCookieValue(cookie, 'passport_csrf_token');
  if (!bizTraceId || !passportCsrfToken) {
    throw new Error('账号Cookie缺少短信验证所需字段');
  }

  const postData = new URLSearchParams({
    mix_mode: '1',
    type: '363c',
    encrypt_uid: encryptUid,
    verify_ticket: '',
    copywriting_key: 'creator',
    new_verify_flow: '',
    is6Digits: '1',
    aid: '2906',
    std_verify_way: 'assist_mobile_sms_verify',
    new_authn_sdk_version: '1.0.0.413-web',
  });
  const msToken = options.msToken || getCookieValue(cookie, 'msToken');
  const aBogus = options.aBogus || '';
  const sessionDtraitHeader = options.sessionDtrait ? { 'x-tt-session-dtrait': options.sessionDtrait } : {};
  const query = new URLSearchParams({
    passport_jssdk_version: '5.1.2',
    passport_jssdk_type: 'lite',
    is_from_ttaccountsdk: '1',
    aid: '2906',
    language: 'zh',
    account_app_language: 'zh-CN',
    new_authn_sdk_version: '1.0.0.413-web',
    is_vcd: '1',
    biz_trace_id: bizTraceId,
    msToken,
    a_bogus: aBogus,
  });

  const response = await $http.post<DouyinAssistSmsResponse>(
    `https://creator.douyin.com/passport/web/send_code/?${query.toString()}`,
    postData.toString(),
    {
      headers: {
        cookie,
        ...sessionDtraitHeader,
        'x-secsdk-csrf-token': options.sdkToken,
        'x-tt-passport-csrf-token': passportCsrfToken,
        'x-tt-passport-trace-id': bizTraceId,
        'x-tt-passport-verify-portrait': '',
        'User-Agent': options.userAgent ?? HttpConfig.userAgent,
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: 'https://creator.douyin.com',
        Referer:
          options.referer ?? 'https://creator.douyin.com/creator-micro/content/post/video?enter_from=publish_page',
        ...(options.secChUa ? { 'sec-ch-ua': options.secChUa } : {}),
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
      httpAgent: options.proxyAgent,
      httpsAgent: options.proxyAgent,
    },
  );

  return response.data;
};

/**
 * 按官方创作者中心的新版辅助手机号验证流程校验短信验证码
 */
export const verifyDouyinAssistSmsCode = async (
  cookie: string,
  checkStr: string,
  smsCode: string,
  options: DouyinAssistSmsRequestOptions,
): Promise<string> => {
  const encryptUid = getEncryptUid(checkStr);
  if (!encryptUid) {
    throw new Error('风控参数中缺少账号标识');
  }

  const bizTraceId = getCookieValue(cookie, 'biz_trace_id');
  const passportCsrfToken = getCookieValue(cookie, 'passport_csrf_token');
  if (!bizTraceId || !passportCsrfToken) {
    throw new Error('账号Cookie缺少发布验证所需字段');
  }

  const encryptedPostData = encryptParams(
    {
      encrypt_uid: encryptUid,
      verify_ticket: '',
      type: '363c',
      copywriting_key: 'creator',
      new_verify_flow: '',
      code: smsCode,
      aid: 2906,
      std_verify_way: 'assist_mobile_sms_verify',
      new_authn_sdk_version: '1.0.0.413-web',
    },
    'code',
  ) as Record<string, unknown>;
  const postData = new URLSearchParams();
  for (const [key, value] of Object.entries(encryptedPostData)) {
    postData.set(key, String(value ?? ''));
  }

  const msToken = options.msToken || getCookieValue(cookie, 'msToken');
  const sessionDtraitHeader = options.sessionDtrait ? { 'x-tt-session-dtrait': options.sessionDtrait } : {};
  const query = new URLSearchParams({
    passport_jssdk_version: '5.1.2',
    passport_jssdk_type: 'lite',
    is_from_ttaccountsdk: '1',
    aid: '2906',
    language: 'zh',
    account_app_language: 'zh-CN',
    new_authn_sdk_version: '1.0.0.413-web',
    is_vcd: '1',
    biz_trace_id: bizTraceId,
    msToken,
    a_bogus: '',
  });

  const response = await $http.post<DouyinAssistVerifyResponse>(
    `https://creator.douyin.com/passport/web/validate_code/?${query.toString()}`,
    postData.toString(),
    {
      headers: {
        cookie,
        ...sessionDtraitHeader,
        'x-secsdk-csrf-token': options.sdkToken,
        'x-tt-passport-csrf-token': passportCsrfToken,
        'x-tt-passport-trace-id': bizTraceId,
        'x-tt-passport-verify-portrait': '',
        'User-Agent': options.userAgent ?? HttpConfig.userAgent,
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: 'https://creator.douyin.com',
        Referer:
          options.referer ?? 'https://creator.douyin.com/creator-micro/content/post/video?enter_from=publish_page',
        ...(options.secChUa ? { 'sec-ch-ua': options.secChUa } : {}),
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
      httpAgent: options.proxyAgent,
      httpsAgent: options.proxyAgent,
    },
  );

  if (response.data?.data?.error_code) {
    return response.data.data.description ?? '发布验证失败';
  }
  return '';
};
