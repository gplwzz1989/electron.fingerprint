import type { XiaodianBrowserCookie } from './types';

/**
 * 微信小店 Cookie 域名。
 */
export const XIAODIAN_COOKIE_DOMAIN = 'store.weixin.qq.com';

/**
 * 视频号 Cookie 域名。
 */
export const CHANNELS_COOKIE_DOMAIN = 'channels.weixin.qq.com';

type ParsedBrowserCookie = XiaodianBrowserCookie & {
  expired?: boolean;
};

const COOKIE_ATTRIBUTE_NAMES = new Set([
  'domain',
  'path',
  'expires',
  'max-age',
  'secure',
  'httponly',
  'samesite',
]);

/**
 * 判断 Cookie JSON 是否包含微信小店凭据。
 */
export function isXiaodianCredentialCookie(cookieJson: string): boolean {
  const cookieNames = readCookieNames(cookieJson, XIAODIAN_COOKIE_DOMAIN);
  return ['biz_token', 'biz_rand', 'biz_magic', 'talent_token', 'supplier_token', 'shop_token'].some((name) =>
    cookieNames.has(name),
  );
}

/**
 * 将浏览器 Cookie JSON 数组字符串归一化。
 */
export function normalizeBrowserCookieJson(cookieJson: string): string {
  return stringifyBrowserCookies(parseBrowserCookieJson(cookieJson));
}

/**
 * 解析浏览器 Cookie JSON 数组字符串。
 */
export function parseBrowserCookieJson(cookieJson: string): XiaodianBrowserCookie[] {
  const trimmed = cookieJson.trim().replace(/^\uFEFF/, '');
  if (!trimmed) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error('Cookie JSON 格式不正确，必须是浏览器 Cookie 数组字符串');
  }
  if (!Array.isArray(parsed)) throw new Error('Cookie JSON 格式不正确，必须是浏览器 Cookie 数组字符串');
  return parsed.map((item) => normalizeBrowserCookieItem(item));
}

/**
 * 将浏览器 Cookie JSON 数组字符串按域名转换成 Header Cookie。
 */
export function browserCookieJsonToCookieHeader(cookieJson: string, domain: string): string {
  return parseBrowserCookieJson(cookieJson)
    .filter((cookie) => isSameCookieDomain(cookie.domain, domain))
    .filter((cookie) => cookie.name && cookie.value !== undefined && cookie.value !== null)
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');
}

/**
 * 将 Header Cookie 转成指定域名下的浏览器 Cookie JSON 数组字符串。
 */
export function cookieHeaderToBrowserCookieJson(cookie: string, domain: string): string {
  return stringifyBrowserCookies(parseCookieHeader(cookie, domain));
}

/**
 * 将 Set-Cookie 合并进浏览器 Cookie JSON 数组字符串。
 */
export function setCookieHeaderToBrowserCookieJson(
  setCookie: string | string[],
  domain: string,
  baseCookieJson = '[]',
): string {
  const cookies = parseBrowserCookieJson(baseCookieJson);
  const cookieMap = new Map(cookies.map((cookie) => [browserCookieKey(cookie), cookie]));
  for (const cookie of parseSetCookieHeader(setCookie, domain)) {
    const key = browserCookieKey(cookie);
    if (cookie.expired) {
      cookieMap.delete(key);
    } else {
      const { expired: _expired, ...browserCookie } = cookie;
      cookieMap.set(key, browserCookie);
    }
  }
  return stringifyBrowserCookies([...cookieMap.values()]);
}

/**
 * 将 Header Cookie 合并进浏览器 Cookie JSON 数组字符串。
 */
export function mergeCookieHeaderIntoBrowserCookieJson(
  baseCookieJson: string,
  cookie: string,
  domain: string,
): string {
  return mergeBrowserCookieJson(baseCookieJson, cookieHeaderToBrowserCookieJson(cookie, domain));
}

/**
 * 合并多个浏览器 Cookie JSON 数组字符串，后面的 Cookie 覆盖前面的 Cookie。
 */
export function mergeBrowserCookieJson(...cookieJsonList: string[]): string {
  const cookieMap = new Map<string, XiaodianBrowserCookie>();
  for (const cookieJson of cookieJsonList) {
    for (const cookie of parseBrowserCookieJson(cookieJson)) {
      cookieMap.set(browserCookieKey(cookie), cookie);
    }
  }
  return stringifyBrowserCookies([...cookieMap.values()]);
}

/**
 * 按域名过滤浏览器 Cookie JSON 数组字符串。
 */
export function filterBrowserCookieJsonByDomain(cookieJson: string, domain: string): string {
  return stringifyBrowserCookies(parseBrowserCookieJson(cookieJson).filter((cookie) => isSameCookieDomain(cookie.domain, domain)));
}

function stringifyBrowserCookies(cookies: XiaodianBrowserCookie[]): string {
  return JSON.stringify(cookies);
}

function normalizeBrowserCookieItem(item: unknown): XiaodianBrowserCookie {
  if (!isRecord(item)) throw new Error('Cookie JSON 中存在非法 Cookie 项');
  const name = stringValue(item.name);
  if (!name) throw new Error('Cookie JSON 中存在缺少 name 的 Cookie 项');
  return {
    name,
    value: stringValue(item.value),
    domain: stringValue(item.domain),
    path: stringValue(item.path) || '/',
    hostOnly: booleanValue(item.hostOnly),
    secure: booleanValue(item.secure),
    httpOnly: booleanValue(item.httpOnly),
    session: booleanValue(item.session),
    expirationDate: numberValue(item.expirationDate),
    sameSite: stringValue(item.sameSite) || undefined,
  };
}

function parseCookieHeader(cookie: string, domain: string): XiaodianBrowserCookie[] {
  const cookies: XiaodianBrowserCookie[] = [];
  for (const segment of cookie.split(';')) {
    const trimmed = segment.trim();
    if (!trimmed) continue;
    const index = trimmed.indexOf('=');
    if (index <= 0) continue;
    const name = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1);
    if (!name) continue;
    cookies.push(createBrowserCookie(name, value, domain));
  }
  return cookies;
}

function parseSetCookieHeader(setCookie: string | string[], domain: string): ParsedBrowserCookie[] {
  const setCookieItems = Array.isArray(setCookie) ? setCookie : splitSetCookieText(setCookie);
  return setCookieItems.flatMap((item) => parseSetCookieItem(item, domain));
}

function splitSetCookieText(setCookie: string): string[] {
  return setCookie
    .split(/,(?=\s*[^;,=\s]+=[^;,]*)/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSetCookieItem(setCookie: string, domain: string): ParsedBrowserCookie[] {
  const segments = setCookie
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean);
  if (!segments.length) return [];
  const hasCookieAttribute = segments.slice(1).some((segment) => {
    const name = segment.split('=')[0]?.trim().toLowerCase();
    return COOKIE_ATTRIBUTE_NAMES.has(name);
  });
  if (!hasCookieAttribute) return parseCookieHeader(setCookie, domain);
  const first = segments[0];
  const index = first.indexOf('=');
  if (index <= 0) return [];
  const cookie = createBrowserCookie(first.slice(0, index).trim(), first.slice(index + 1), domain) as ParsedBrowserCookie;
  for (const segment of segments.slice(1)) {
    applyCookieAttribute(cookie, segment);
  }
  return [cookie];
}

function applyCookieAttribute(cookie: ParsedBrowserCookie, segment: string): void {
  const index = segment.indexOf('=');
  const name = (index >= 0 ? segment.slice(0, index) : segment).trim().toLowerCase();
  const value = index >= 0 ? segment.slice(index + 1).trim() : '';
  if (name === 'path') cookie.path = value || '/';
  if (name === 'max-age') {
    const maxAge = Number(value);
    if (Number.isFinite(maxAge)) {
      cookie.expired = maxAge <= 0;
      cookie.expirationDate = Math.floor(Date.now() / 1000) + maxAge;
      cookie.session = false;
    }
  }
  if (name === 'expires') {
    const expires = Date.parse(value);
    if (Number.isFinite(expires)) {
      cookie.expired = expires <= Date.now();
      cookie.expirationDate = Math.floor(expires / 1000);
      cookie.session = false;
    }
  }
  if (name === 'secure') cookie.secure = true;
  if (name === 'httponly') cookie.httpOnly = true;
  if (name === 'samesite') cookie.sameSite = value || undefined;
}

function createBrowserCookie(name: string, value: string, domain: string): XiaodianBrowserCookie {
  const normalizedDomain = domain.trim();
  return {
    name,
    value,
    domain: normalizedDomain,
    path: '/',
    hostOnly: !normalizedDomain.startsWith('.'),
    secure: true,
    httpOnly: false,
    session: true,
    sameSite: 'unspecified',
  };
}

function browserCookieKey(cookie: XiaodianBrowserCookie): string {
  return `${normalizeDomain(cookie.domain)}|${cookie.path || '/'}|${cookie.name}`;
}

function isSameCookieDomain(cookieDomain: string | undefined, targetDomain: string): boolean {
  return normalizeDomain(cookieDomain) === normalizeDomain(targetDomain);
}

function normalizeDomain(domain: string | undefined): string {
  return (domain || '').trim().replace(/^\./, '').toLowerCase();
}

function readCookieNames(cookieJson: string, domain: string): Set<string> {
  try {
    return new Set(parseBrowserCookieJson(cookieJson).filter((cookie) => isSameCookieDomain(cookie.domain, domain)).map((cookie) => cookie.name));
  } catch {
    return new Set(cookieJson.split(';').map((item) => item.trim().split('=')[0]).filter(Boolean));
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function booleanValue(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return undefined;
}
