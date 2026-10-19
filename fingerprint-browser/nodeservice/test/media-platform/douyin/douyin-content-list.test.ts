import { describe, expect, test } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getContentListAsync } from '@/media-platform/douyin/douyin-content-list.service';
import { DataService, Platforms } from '../../../src';

export const getCookie = (fileName: string = 'cookie.txt'): string => {
  return fs.readFileSync(path.resolve(__dirname, fileName), { encoding: 'utf8' }).trim();
};

describe.runIf(true)('【真实测试】', () => {
  test('获取内容列表', async () => {
    const cookie = getCookie();
    const result = await getContentListAsync(cookie, 0);
    console.log(result);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.status_code).toBe(0);
  }, 10000000);
});
describe.runIf(true)('【真实测试内容列表analyze】', () => {
  test('获取内容列表2', async () => {
    const cookie = getCookie();
    const result = await DataService.SyncDataService.getAccountContentData(
      Platforms.DouYin,
      cookie,
      '12312312',
      undefined,
      7,
      10000,
      undefined,
      { tab: 'analyze' },
    );
    console.log(result);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});
