import type { AxiosResponse } from 'axios';
import crypto from 'crypto';
import type { XiaodianApiResponse, XiaodianCookieMap, XiaodianCredential, XiaodianLoginType } from './types';

type HeaderValue = string | string[] | number | boolean | null | undefined;
type HeaderBag = Record<string, HeaderValue> & {
  get?: (name: string) => HeaderValue;
};

/**
 * 微信小店 PC 助手默认 User-Agent。
 */
export const DEFAULT_XIAODIAN_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) WeixinStoreAssistant/3.4.0 Chrome/108.0.5359.215 Electron/22.3.27 Safari/537.36';

/**
 * 默认二维码确认超时时间：2 分钟。
 */
export const DEFAULT_LOGIN_CONFIRM_TIMEOUT_MS = 120_000;

/**
 * 默认二维码状态轮询间隔。
 */
export const DEFAULT_LOGIN_POLLING_INTERVAL_MS = 3_000;

/**
 * 小店接口基础地址。
 */
export const XIAODIAN_BASE_URL = 'https://store.weixin.qq.com';

/**
 * 小店登录页地址。
 */
export const XIAODIAN_LOGIN_URL = `${XIAODIAN_BASE_URL}/shop?action=pcLogin&multiLogin=1`;

/**
 * 小店多身份登录接口地址。
 */
export const XIAODIAN_MULTI_LOGIN_BASE = `${XIAODIAN_BASE_URL}/shop-faas/mmecnodelogin/kfMultiLogin`;

/**
 * 默认视频号跳转目标 username。
 */
export const DEFAULT_FINDER_USERNAME =
  '';

let defaultDeviceId = '';

/**
 * 获取模块级设备 ID，避免同一进程内频繁变化。
 */
export function getDefaultDeviceId(): string {
  if (!defaultDeviceId) defaultDeviceId = crypto.randomUUID();
  return defaultDeviceId;
}

/**
 * 获取中文错误消息，避免向调用方暴露原始错误对象。
 */
export function toSafeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  return '未知错误';
}

/**
 * 判断是否为普通对象。
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 将接口响应归一化为对象。
 */
export function normalizeResponseData<TData>(data: unknown): XiaodianApiResponse<TData> | null {
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data) as unknown;
      return isRecord(parsed) ? (parsed as XiaodianApiResponse<TData>) : null;
    } catch {
      return null;
    }
  }
  return isRecord(data) ? (data as XiaodianApiResponse<TData>) : null;
}

/**
 * 读取接口返回码。
 */
export function getApiCode(data: XiaodianApiResponse<unknown>): number | string | undefined {
  return data.code ?? data.errCode ?? data.ret ?? data.baseResp?.ret ?? data.base_resp?.ret;
}

/**
 * 读取接口错误消息。
 */
export function getApiMessage(data: XiaodianApiResponse<unknown>): string {
  return data.message || data.errMsg || data.err_msg || data.baseResp?.errMsg || data.base_resp?.err_msg || '';
}

/**
 * 从响应头提取 Set-Cookie。
 */
export function extractSetCookies(headers: AxiosResponse<unknown>['headers']): string[] {
  const headerBag = headers as unknown as HeaderBag;
  const fromGetter = typeof headerBag.get === 'function' ? headerBag.get('set-cookie') : undefined;
  const value = fromGetter ?? headerBag['set-cookie'] ?? headerBag['Set-Cookie'];
  if (Array.isArray(value)) return value.map((item) => String(item));
  if (typeof value === 'string') return value.split(/,(?=\s*[^;,=\s]+=[^;,]*)/g);
  return [];
}

/**
 * 将 Set-Cookie 合并到 Cookie 字典。
 */
export function mergeSetCookiesIntoMap(cookies: XiaodianCookieMap, headers: AxiosResponse<unknown>['headers']): void {
  for (const cookieText of extractSetCookies(headers)) {
    const first = cookieText.split(';')[0];
    const index = first.indexOf('=');
    if (index <= 0) continue;
    cookies[first.slice(0, index).trim()] = first.slice(index + 1);
  }
}

/**
 * 将 Cookie 字典转为请求头字符串。
 */
export function cookieHeaderFromMap(cookies: XiaodianCookieMap): string {
  return Object.entries(cookies)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

/**
 * 将调用方传入的 Cookie 请求头字符串转为 Cookie 字典。
 */
export function cookieMapFromHeader(cookie: string): XiaodianCookieMap {
  const cookies: XiaodianCookieMap = {};
  const normalizedCookie = normalizeCookieHeaderText(cookie);
  for (const item of normalizedCookie.split(';')) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    const index = trimmed.indexOf('=');
    if (index <= 0) continue;
    cookies[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1);
  }
  return cookies;
}

/**
 * 归一化调用方传入的 Cookie 文本，兼容整体被单引号或双引号包住的情况。
 */
export function normalizeCookieHeaderText(cookie: string): string {
  let normalizedCookie = cookie.trim().replace(/^\uFEFF/, '');
  while (
    normalizedCookie.length >= 2 &&
    ((normalizedCookie.startsWith('"') && normalizedCookie.endsWith('"')) ||
      (normalizedCookie.startsWith("'") && normalizedCookie.endsWith("'")))
  ) {
    normalizedCookie = normalizedCookie.slice(1, -1).trim();
  }
  return normalizedCookie;
}

/**
 * 克隆小店凭据，避免调用方传入对象被原地污染。
 */
export function cloneXiaodianCredential(credential: XiaodianCredential): XiaodianCredential {
  const cookies = { ...credential.cookies };
  return {
    ...credential,
    cookies,
    cookie: credential.cookie || cookieHeaderFromMap(cookies),
  };
}

/**
 * 构造小店 Cookie。
 */
export function buildLoginCookies(
  loginType: XiaodianLoginType,
  loginResult: Record<string, unknown>,
): XiaodianCookieMap {
  const token = stringValue(loginResult.bizToken) || stringValue(loginResult.token);
  const rand = stringValue(loginResult.bizRand) || stringValue(loginResult.rand);
  const magic =
    stringValue(loginResult.csrfToken) || stringValue(loginResult.bizMagic) || stringValue(loginResult.magic);
  const ticket = stringValue(loginResult.bizTicket) || stringValue(loginResult.ticket);
  if (loginType === 'talent') {
    return {
      talent_token: token,
      talent_rand: rand,
      talent_magic: magic,
      talent_ticket: ticket,
    };
  }
  if (loginType === 'supplier') {
    return {
      supplier_token: token,
      supplier_rand: rand,
      supplier_magic: magic,
    };
  }
  return {
    biz_token: token,
    biz_rand: rand,
    biz_magic: magic,
    biz_ticket: ticket,
  };
}

/**
 * 读取字符串字段。
 */
export function stringValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

/**
 * 读取数字字段。
 */
export function numberValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

/**
 * 归一化二维码图片为 Data URL。
 */
export function normalizeQrcodeDataUrl(qrcodeImg: string): string {
  if (qrcodeImg.startsWith('data:image/')) return qrcodeImg;
  return `data:image/png;base64,${qrcodeImg}`;
}

/**
 * 判断小店登录类型。
 */
export function toXiaodianLoginType(value: unknown): XiaodianLoginType {
  if (value === 'talent' || value === 'supplier' || value === 'shop') return value;
  return 'shop';
}
