import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { getUserHomeDataAsync, getUserInfoAsync } from '@/media-platform/haokanshipin/haokanshipin-user.service';

describe('【Mock】', () => {
  describe('好看视频首页数据', () => {
    const server = setupServer(
      rest.get('https://dream.haokan.com*/creator/authorpcdatacenter', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              timestamp: 1698211911,
              logid: '1911326940',
              status: 0,
              msg: '',
              data: {
                realNameCheck: 1,
                videoShareIncomeApply: 1,
                data: {
                  video_view: {
                    total: 1669,
                    trend: 2,
                  },
                  fans_info: {
                    total: 4,
                    trend: 0,
                  },
                  income_info: {
                    total: 0,
                    trend: 0,
                    lastDate: 1697644800,
                  },
                  yqsl_info: {
                    total: '--',
                    trend: '--',
                  },
                  yqsl_income_info: {
                    total: '--',
                    trend: '--',
                  },
                },
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
        const result = await getUserHomeDataAsync('success');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.status).toBe(0);
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('好看视频首页数据', async () => {
    const cookie =
      'BDUSS=AwekU1MGpscXNtWFVKU0FNbGlGNE9YU2JkaXhwV1Etc1o0QWNiUlA5N3FFbUJsSVFBQUFBJCQAAAAAAAAAAAEAAAB0BbF8ueLXxcaoucm1xL3F0b4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOqFOGXqhThlRj; RT="z=1&dm=haokan.com&si=59e322b7-ce63-4392-b07d-d2481cfa24c2&ss=lo569q57&sl=c&tt=7ys&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf&ld=d6y7&nu=3ozua3c&cl=5zkq"';

    const result = await getUserHomeDataAsync(cookie);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.status).toBe(0);
  }, 10000000);

  test('好看视频用户信息', async () => {
    const cookie =
      'Hm_lvt_24c4c446cdc4c13e079326a4d1603775=1709261746;Hm_lpvt_24c4c446cdc4c13e079326a4d1603775=1709261815;BDUSS=tWaHBHR1p5ZmJzT2E2VFk4bTM2aEY4QVhjekluRTBNcWcxN0xoTGZoUFowQWhtSUFBQUFBJCQAAAAAAAAAAAEAAAAuLOnSwO7PyMmt1Ly6sgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANlD4WXZQ-FlV2;RT="z=1&dm=haokan.com&si=122874bd-cb99-4070-9562-a1d1044dafeb&ss=lt82b78v&sl=3&tt=29h&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf&ld=1j8a"';

    const result = await getUserInfoAsync(cookie);

    console.log(result);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.status).toBe(0);
  }, 10000000);
});
