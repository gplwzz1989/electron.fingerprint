import { describe, expect, test } from 'vitest';
import { Ximalaya } from '@/media-platform/ximalaya';

// 填入可用的喜马拉雅创作中心 Cookie 后启用真实搜索。不要提交真实 Cookie。
const cookie = '';
const categoryId = '4';
const keyword = '库克';

describe('喜马拉雅话题搜索', () => {
  test.skipIf(!cookie.trim())('按分类和关键词搜索话题', async () => {
    const result = await Ximalaya.searchTopic(cookie, categoryId, keyword);

    console.info('喜马拉雅话题搜索结果:', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
    expect(result.dataList?.length).toBeGreaterThan(0);
    expect(result.dataList?.[0]).toMatchObject({
      yixiaoerId: expect.any(String),
      yixiaoerName: expect.any(String),
      raw: expect.any(Object),
    });
  });
});
