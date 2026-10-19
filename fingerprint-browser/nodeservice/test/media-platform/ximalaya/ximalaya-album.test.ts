import { describe, expect, test } from 'vitest';
import { Ximalaya } from '@/media-platform/ximalaya';

// 填入可用的喜马拉雅创作中心 Cookie 后启用真实专辑查询。不要提交真实 Cookie。
const cookie = '';
const page = 1;
const pageSize = 10;
const keyword = '';

describe('喜马拉雅专辑查询', () => {
  test.skipIf(!cookie.trim())('分页查询可用于发布的专辑列表', async () => {
    const result = await Ximalaya.getXimalayaAlbum(cookie, page, pageSize, keyword);

    console.info('喜马拉雅专辑查询结果:', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
    expect(result.dataList?.[0]).toMatchObject({
      yixiaoerId: expect.any(String),
      yixiaoerName: expect.any(String),
      raw: expect.any(Object),
    });
  });
});
