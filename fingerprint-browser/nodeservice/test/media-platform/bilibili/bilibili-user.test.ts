import { describe, expect, test } from 'vitest';
import { Bilibili } from '../../../src';
import { getCookie } from './bilibili-article.test';

describe.runIf(true)('【获取B站分类列表】', () => {
  test('获取B站分类列表', async () => {
    const cookie = getCookie();
    const result = await Bilibili.searchBilibiliPublicAuthorList('人民日报');
    console.log('获取B站分类列表：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【搜索B站公开】', () => {
  test('公开作品', async () => {
    const cookie = getCookie();
    const result = await Bilibili.searchBilibiliPublicWorkList('蚁小二一键分发系统',undefined,'2');
    console.log('搜索B站作品：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});
