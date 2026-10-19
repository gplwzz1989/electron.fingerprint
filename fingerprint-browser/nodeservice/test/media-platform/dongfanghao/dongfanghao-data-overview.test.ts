import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { getDataOverviewAsync } from '@/media-platform/dongfanghao/dongfanghao-data-overview.service';

describe('【Mock】', () => {
  describe('获取东方号内容分析', () => {
    const server = setupServer(
      rest.get('https://mp.yidianzixun.com*/api/source-data', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 0,
              msg: '成功',
              inMsg: null,
              data: {
                bydaylist: [
                  {
                    dt: '20231107',
                    passtotal: 0,
                    comment_pv: 0,
                    collecttotal: 0,
                    read_pv: 0,
                    userid: '200000000309959',
                  },
                  {
                    dt: '20231106',
                    passtotal: 0,
                    comment_pv: 0,
                    collecttotal: 0,
                    read_pv: 0,
                    userid: '200000000309959',
                  },
                  {
                    dt: '20231105',
                    passtotal: 0,
                    comment_pv: 0,
                    collecttotal: 0,
                    read_pv: 0,
                    userid: '200000000309959',
                  },
                  {
                    dt: '20231104',
                    passtotal: 0,
                    comment_pv: 0,
                    collecttotal: 0,
                    read_pv: 0,
                    userid: '200000000309959',
                  },
                  {
                    dt: '20231103',
                    passtotal: 0,
                    comment_pv: 0,
                    collecttotal: 0,
                    read_pv: 0,
                    userid: '200000000309959',
                  },
                  {
                    dt: '20231102',
                    passtotal: 0,
                    comment_pv: 0,
                    collecttotal: 0,
                    read_pv: 0,
                    userid: '200000000309959',
                  },
                ],
                collections: 0,
                commentpv: 0,
                contentnum: 0,
                readpv: 0,
              },
            }),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const result = await getDataOverviewAsync('success', '20231102', '20231108');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(0);
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('获取东方号内容分析', async () => {
    const cookie = 'sign=1; login_token=user_tokena34d28a5af997f3cf2d59e18874070066';

    const result = await getDataOverviewAsync(cookie, '20231102', '20231108');
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);
});
