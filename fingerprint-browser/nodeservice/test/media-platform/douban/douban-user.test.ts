import { describe, expect, test } from 'vitest';
import { AccountService, Cloud, Platforms } from '../../../src';

describe.runIf(true)('【真实测试】', () => {
  test('豆瓣用户信息', async () => {
    const cookie =
      'bid=D3RbVdyxAd4; dbcl2="184091618:PzpcTzyCjH8"; ck=95rz';

    const result = await Cloud.getPlatformUserInfo(Platforms.DouBan, cookie);
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【真实测试】', () => {
  test('豆瓣用户有效性', async () => {
    const cookie =
      'll="118267"; bid=ryi4XC_xUic; _pk_id.100001.8cb4=87ae4f68182b81fd.1728885899.; __utma=30149280.1287682771.1728885900.1728885900.1728885900.1; __utmc=30149280; ck=nlQ1';

    const result = await new AccountService(cookie, Platforms.DouBan).checkAccountAlive();
    console.log('有效性', result);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result).toBe(1);
  }, 10000000);
});
