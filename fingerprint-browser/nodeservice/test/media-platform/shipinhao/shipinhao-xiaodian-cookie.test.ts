import { describe, expect, test } from 'vitest';
import {
  browserCookieJsonToCookieHeader,
  CHANNELS_COOKIE_DOMAIN,
  cookieHeaderToBrowserCookieJson,
  isXiaodianCredentialCookie,
  mergeBrowserCookieJson,
  setCookieHeaderToBrowserCookieJson,
  XIAODIAN_COOKIE_DOMAIN,
} from '../../../src/media-platform/shipinhao/xiaodian-login';

describe('【微信小店浏览器 Cookie JSON 工具】', () => {
  test('按小店和视频号域名转换并合并浏览器 Cookie JSON', () => {
    const xiaodianCookieJson = cookieHeaderToBrowserCookieJson(
      'talent_token=token-a; talent_rand=rand-a',
      XIAODIAN_COOKIE_DOMAIN,
    );
    const channelsCookieJson = cookieHeaderToBrowserCookieJson('sessionid=session-a; wxuin=uin-a', CHANNELS_COOKIE_DOMAIN);
    const mergedCookieJson = mergeBrowserCookieJson(xiaodianCookieJson, channelsCookieJson);

    expect(isXiaodianCredentialCookie(mergedCookieJson)).toBe(true);
    expect(browserCookieJsonToCookieHeader(mergedCookieJson, XIAODIAN_COOKIE_DOMAIN)).toBe(
      'talent_token=token-a; talent_rand=rand-a',
    );
    expect(browserCookieJsonToCookieHeader(mergedCookieJson, CHANNELS_COOKIE_DOMAIN)).toBe(
      'sessionid=session-a; wxuin=uin-a',
    );
  });

  test('Set-Cookie 按 domain + path + name 覆盖旧值', () => {
    const cookieJson = cookieHeaderToBrowserCookieJson('sessionid=old; wxuin=uin-a', CHANNELS_COOKIE_DOMAIN);
    const updatedCookieJson = setCookieHeaderToBrowserCookieJson(
      ['sessionid=new; Path=/; HttpOnly; Secure'],
      CHANNELS_COOKIE_DOMAIN,
      cookieJson,
    );

    expect(browserCookieJsonToCookieHeader(updatedCookieJson, CHANNELS_COOKIE_DOMAIN)).toBe('sessionid=new; wxuin=uin-a');
  });
});
