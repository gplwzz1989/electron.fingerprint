import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { getDataOverviewAsync } from '@/media-platform/souhuhao/souhuhao-data-overview.service';

describe('【Mock】', () => {
  describe('获取搜狐号视频数据分析', () => {
    const server = setupServer(
      rest.get('https://mp.sohu.com*/mpbp/bp/news/v4/users/stat/overall', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              data: {
                result: {
                  list: [
                    {
                      date: '2023-10-30',
                      totalPv: 162,
                      totalVv: 162,
                      diff: 2,
                    },
                    {
                      date: '2023-10-31',
                      totalPv: 170,
                      totalVv: 170,
                      diff: 8,
                    },
                  ],
                },
                diff: 8,
                history: 178,
                status: 'ok',
              },
              code: 2000000,
              msg: '',
              success: true,
            }),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const result = await getDataOverviewAsync('success', 1, '', '');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(2000000);
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('获取搜狐号视频数据分析', async () => {
    const cookie =
      'SUV=1698810496971kn1djy; gidinf=x099980109ee17dd1c810cc5900011b6fcb5ecd27da5; clt=1698887944; cld=20231102091904; reqtype=pc; _dfp=RiOsKSgVB5ahf8cH1DIVHXmgel18n/btqmarFUNE0iU=; jv=0814325a531f9e1743c3688b91fc9fb4-VbN7uDV61698887972907; ppinf=2|1698887973|1700097573|bG9naW5pZDowOnx1c2VyaWQ6Mjg6MTUwNDY0NjM4MDMwNjg0MTYwMEBzb2h1LmNvbXxzZXJ2aWNldXNlOjMwOjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMHxjcnQ6MTA6MjAyMy0xMS0wMnxlbXQ6MTowfGFwcGlkOjY6MTEzODA1fHRydXN0OjE6MXxwYXJ0bmVyaWQ6MTowfHJlbGF0aW9uOjA6fHV1aWQ6MTY6c2EwZDkwYzVlZGNmYmQ4M3x1aWQ6MTY6c2EwZDkwYzVlZGNmYmQ4M3x1bmlxbmFtZTowOnw; pprdig=OjiGiABlQ18lugNL6w5sI74r5o5hk7sMNHrDSJi28TzYqfiRt-VMbJnnyCYgb544IHcqCsnOUsANC3BJsgYSBKE_O7tAL0QaquWOzBmmJixHgcDAGKfJHaWGMuDv96fdZgpi1BihF-lk173-cTdHWWnTPNjsTy17ZlWmA5Mj_yY; t=1698887990074; ppmdig=16988909960000008a1a2536c0ecef64a7c54a4d4c725aa1; tgw_l7_route=632e20bf787d79623d2f5548ef898768';

    const result = await getDataOverviewAsync(cookie, 121349544, '2023-10-30', '2023-10-31');
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(2000000);
  }, 10000000);
});
