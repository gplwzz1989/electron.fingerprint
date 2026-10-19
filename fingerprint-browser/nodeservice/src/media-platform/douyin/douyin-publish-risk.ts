import { PublishVerifyType } from '@/media-platform/baseModel';
import { errorCode } from '@/media-platform/errorCode';
import { logger } from '@/utils';

const SECURITY_SDK_CRYPT_KEY = 'security-sdk/s_sdk_crypt_sdk';
const SECURITY_SDK_SIGN_KEY = 'security-sdk/s_sdk_sign_data_key/web_protect';

type DouyinLocalStorage = Record<string, unknown>;

export type PreparedDouyinPublishCookie = {
  code: number;
  msg: string;
  cookie: string;
  localStorage?: DouyinLocalStorage;
};

const parseDouyinLocalStorage = (value: unknown): DouyinLocalStorage | undefined => {
  if (!value) {
    return undefined;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }
  return typeof value === 'object' && !Array.isArray(value) ? (value as DouyinLocalStorage) : undefined;
};

/**
 * 按抖音发布链路准备 Cookie 和 LocalStorage 环境
 */
export const prepareDouyinPublishCookie = (
  cookie: string,
  localStorageValue?: unknown,
): PreparedDouyinPublishCookie => {
  const localStorage = parseDouyinLocalStorage(localStorageValue);
  const cryptValue = localStorage?.[SECURITY_SDK_CRYPT_KEY];
  const signValue = localStorage?.[SECURITY_SDK_SIGN_KEY];
  const encodedCryptValue = cryptValue === undefined ? '' : encodeURIComponent(String(cryptValue));
  const encodedSignValue = signValue === undefined ? '' : encodeURIComponent(String(signValue));
  let preparedCookie = cookie;

  const hasRequiredBaseCookie =
    preparedCookie.includes('bd_ticket_guard_client_data') && preparedCookie.includes('sid_tt');
  const hasExpectedSecurityCookie =
    Boolean(encodedCryptValue && encodedSignValue) &&
    preparedCookie.includes(`${SECURITY_SDK_CRYPT_KEY}=${encodedCryptValue}`) &&
    preparedCookie.includes(`${SECURITY_SDK_SIGN_KEY}=${encodedSignValue}`);

  if (localStorage?.[SECURITY_SDK_SIGN_KEY] && !hasExpectedSecurityCookie) {
    preparedCookie = preparedCookie.replace(new RegExp(`${SECURITY_SDK_SIGN_KEY}=`, 'g'), 'droppedCookie=');
    preparedCookie = preparedCookie.replace(new RegExp(`${SECURITY_SDK_CRYPT_KEY}=`, 'g'), 'droppedCookie=');
  }

  if (!hasRequiredBaseCookie) {
    return {
      code: errorCode.io_error,
      msg: '账号信息缺失，请重新授权此账号再试',
      cookie: preparedCookie,
      localStorage,
    };
  }

  if (!hasExpectedSecurityCookie) {
    if (!encodedCryptValue || !encodedSignValue) {
      return {
        code: errorCode.io_error,
        msg: '账号信息缺失，请重新授权此账号再试',
        cookie: preparedCookie,
        localStorage,
      };
    }
    preparedCookie = `${preparedCookie};${SECURITY_SDK_CRYPT_KEY}=${encodedCryptValue};${SECURITY_SDK_SIGN_KEY}=${encodedSignValue}`;
  }

  return { code: errorCode.ok, msg: '', cookie: preparedCookie, localStorage };
};

/**
 * 从抖音风控参数中识别可用验证方式
 */
export const getPublishVerifyMethods = (checkStr?: string): PublishVerifyType[] => {
  if (!checkStr) {
    return ['password', 'smscode'];
  }
  try {
    const normalized = decodeURIComponent(checkStr).toLowerCase();
    const methods: PublishVerifyType[] = [];
    if (normalized.includes('password') || normalized.includes('pwd')) {
      methods.push('password');
    }
    if (normalized.includes('sms') || normalized.includes('mobile') || normalized.includes('code')) {
      methods.push('smscode');
    }
    return methods.length > 0 ? methods : ['password', 'smscode'];
  } catch {
    logger.info(`发布风控验证方式解析失败，参数长度:${checkStr.length}`);
    return ['password', 'smscode'];
  }
};
