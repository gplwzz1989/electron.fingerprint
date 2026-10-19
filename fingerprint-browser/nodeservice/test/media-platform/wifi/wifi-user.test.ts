import { describe, expect, test } from 'vitest';
import { AccountService, Cloud, Platforms } from '../../../src';

describe.runIf(true)('【真实测试】', () => {
  test('获取wifi用户信息', async () => {
    const cookie =
      'JSESSIONID=nodeMedia1nijli3tbwlar2y3nw6m2jsvv.nodeMedia;';

    const result = await Cloud.getPlatformUserInfo(Platforms.WiFiWanNengYaoShi, cookie);
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);

  test('获取wifi用户有效性检测', async () => {
    const cookie =
      'JSESSIONID=nodeMediaxry9zlf7gzlcimz98ypk7pcw.nodeMedia';

    const result = await new AccountService(cookie, Platforms.WiFiWanNengYaoShi).checkAccountAlive();
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result).toBe(1);
  }, 10000000);
});
