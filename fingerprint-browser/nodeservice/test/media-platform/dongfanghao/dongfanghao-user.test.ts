import { describe, test, expect } from 'vitest';
import { getUserHomeDataAsync } from '@/media-platform/dongfanghao/dongfanghao-user.service';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';

describe('【Mock】', () => {
  describe('获取东方号用户首页数据', () => {
    const server = setupServer(
      rest.get('https://rong.tt.cn*/east-other/hot/dataTotal', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.body({
              code: 0,
              data: {
                allscore: '0',
                comment_pv: '0',
                ysdmoney: '0.00',
                read_pv: '0',
                fans_num: '0',
              },
              msg: '成功',
            }),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const result = await getUserHomeDataAsync('success');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(0);
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('获取东方号用户首页数据', async () => {
    const cookie = 'sign=1; login_token=user_tokena34d28a5af997f3cf2d59e18874070066';
    const result = await getUserHomeDataAsync(cookie);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);
});
