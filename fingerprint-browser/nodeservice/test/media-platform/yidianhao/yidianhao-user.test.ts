import { describe, expect, test } from 'vitest';
import { getUserHomeDataAsync, getUserInfoAsync } from '@/media-platform/yidianhao/yidianhao-user.service';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { AccountService, Platforms } from '../../../src';

describe.runIf(true)('【真实测试】', () => {
  const cookie =
    'DID=node6c24f16b973da7b1; login-label=3575576337; BUILD_VERSION=aBZ4Wo3J1762837421691; JSESSIONID=9ee2ce733c32db6799ea0954b36d1f0710295915a9a32fe06aa2623a0809e805';
  test('获取一点号用户首页数据', async () => {
    const cookie =
      'JSESSIONID=302279b267f4e1f8e91c8e2e4c9f1d0f6defe322e3a799f65fe91f378cde4c29;wuid=291131398635194;wuid_createAt=2025-05-28 20:55:28';
    const result = await getUserHomeDataAsync(cookie);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);

  test('获取一点号用户信息', async () => {
    const result = await getUserInfoAsync(cookie);
    const re2 = await new AccountService(cookie, Platforms.YiDianHao).checkAccountAlive();
    console.log(`是否有效:${re2}`);
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);

  test('检测用户有效性', async () => {
    const cookie =
      'JSESSIONID=a894266771498e289e99a9f7401ac92e1a4bac0217f321b6374c9a8bbba95a79; DID=node32be9520809753a7; BUILD_VERSION=W4BCIyL1739169356768';
    const result = await new AccountService(cookie, Platforms.YiDianHao).checkAccountAlive();
    console.log('有效性:' + result);
    expect(result).toBe(1);
  });
});
