import { describe, expect, test } from 'vitest';
import { Xiaohongshu } from '../../../src';
import { getCookie } from './xiaohongshu-video-publish.test';

describe.runIf(true)('【群聊查询】', () => {
  test('小红书权利奥查询', async () => {
    const cookie = getCookie();

    const result = await Xiaohongshu.getXiaohongshuGroup(cookie);
    console.log(JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【合集查询】', () => {
  test('小红书合集查询', async () => {
    const cookie = getCookie();

    const result = await Xiaohongshu.getXiaohongshuCollection(cookie);
    console.log(JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
    expect(result.code).toBe(0);
  }, 10000000);
});