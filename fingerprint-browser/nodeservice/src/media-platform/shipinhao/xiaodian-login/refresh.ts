import {
  browserCookieJsonToCookieHeader,
  CHANNELS_COOKIE_DOMAIN,
  filterBrowserCookieJsonByDomain,
  mergeCookieHeaderIntoBrowserCookieJson,
  normalizeBrowserCookieJson,
  XIAODIAN_COOKIE_DOMAIN,
} from './browser-cookie';
import {
  getChannelsAuthorInfo,
  getChannelsSessionByXiaodianCredential,
  keepaliveXiaodianCredential,
} from './xiaodian-login';
import type {
  RefreshShipinhaoByXiaodianCookieOptions,
  RefreshShipinhaoByXiaodianCookieResult,
} from './types';

/**
 * 使用微信小店浏览器 Cookie JSON 刷新视频号 Cookie。
 *
 * 入参必须是浏览器可恢复的 Cookie JSON 数组字符串。函数只在调用小店和视频号接口前临时按域名转换 Header Cookie，
 * 返回值仍保持浏览器 Cookie JSON 数组字符串，方便调用方直接落库和恢复浏览器。
 */
export async function refreshShipinhaoByXiaodianCookie(
  cookieJson: string,
  options: RefreshShipinhaoByXiaodianCookieOptions = {},
): Promise<RefreshShipinhaoByXiaodianCookieResult> {
  let mergedCookieJson = normalizeBrowserCookieJson(cookieJson);
  let xiaodianCookie = browserCookieJsonToCookieHeader(mergedCookieJson, XIAODIAN_COOKIE_DOMAIN);
  if (!xiaodianCookie) throw new Error('微信小店 Cookie JSON 中缺少 store.weixin.qq.com 的登录 Cookie');

  const keepalive = await keepaliveXiaodianCredential(xiaodianCookie, options);
  mergedCookieJson = mergeCookieHeaderIntoBrowserCookieJson(mergedCookieJson, keepalive.cookie, XIAODIAN_COOKIE_DOMAIN);

  xiaodianCookie = browserCookieJsonToCookieHeader(mergedCookieJson, XIAODIAN_COOKIE_DOMAIN);
  if (!xiaodianCookie) throw new Error('微信小店保活后缺少可用的小店 Cookie');

  const channelsSession = await getChannelsSessionByXiaodianCredential(xiaodianCookie, options);
  mergedCookieJson = mergeCookieHeaderIntoBrowserCookieJson(
    mergedCookieJson,
    channelsSession.xiaodianCredential.cookie,
    XIAODIAN_COOKIE_DOMAIN,
  );
  mergedCookieJson = mergeCookieHeaderIntoBrowserCookieJson(mergedCookieJson, channelsSession.cookie, CHANNELS_COOKIE_DOMAIN);

  const channelsCookie = browserCookieJsonToCookieHeader(mergedCookieJson, CHANNELS_COOKIE_DOMAIN);
  if (!channelsCookie) throw new Error('视频号 Cookie 换取成功但缺少 channels.weixin.qq.com 的登录 Cookie');

  const authorInfo = await getChannelsAuthorInfo(channelsCookie, options.proxy);

  return {
    xiaodianCookieJson: filterBrowserCookieJsonByDomain(mergedCookieJson, XIAODIAN_COOKIE_DOMAIN),
    channelsCookieJson: filterBrowserCookieJsonByDomain(mergedCookieJson, CHANNELS_COOKIE_DOMAIN),
    mergedCookieJson,
    xiaodianCookie,
    channelsCookie,
    expireTime: keepalive.expireTime,
    maxExpireTime: keepalive.maxExpireTime,
    authorInfo,
    raw: {
      keepalive,
      channelsSession,
      authorInfo: authorInfo.raw,
    },
  };
}
