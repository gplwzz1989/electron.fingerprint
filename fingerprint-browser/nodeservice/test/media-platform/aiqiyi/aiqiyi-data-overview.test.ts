import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { getDataOverviewAsync } from '@/media-platform/aiqiyi/aiqiyi-data-overview.service';

describe('【Mock】', () => {
  describe('获取爱奇艺数据分析', () => {
    const server = setupServer(
      rest.get('https://mp-api.iqiyi.com*/stat/api/1.0/video/data/user_trend', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 0,
              msg: 'success',
              data: {
                resultSize: 30,
                status: 'SUCCESS',
                data: [
                  {
                    date: '2023-09-26',
                    pv: 389,
                    vv: 10,
                    playtime: 484000.0,
                    commentNum: 0,
                    likeNum: 0,
                    shareNum: 0,
                    barrageNum: 0,
                    fansIncrNum: 0,
                    completionDegree: 0.7181008902077152,
                    fansVv: 0,
                    fansPlaytime: 0.0,
                    fansCommentNum: 0,
                    fansLikeNum: 0,
                    fansBarrageNum: 0,
                    fansCompletionDegree: 0.0,
                  },
                ],
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
        const result = await getDataOverviewAsync('success', '2023-09-25', '2023-10-24');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(0);
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('获取爱奇艺数据分析', async () => {
    const cookie =
      'QC006=eatla7qhi23w2boszthh4yc3; P00004=.1698219769.a707f2081f; QC005=67659a9c2553af085693142e93dbf993; P00001=c4NaNjZIJA3LENHPSS8dJl6CfL566AI5tlEuJMw10tklshFKIzrkzAvUsUe5xKKm1T0bb; P00003=1671129325; P00010=1671129325; P01010=1698249600; P00007=c4NaNjZIJA3LENHPSS8dJl6CfL566AI5tlEuJMw10tklshFKIzrkzAvUsUe5xKKm1T0bb; P00PRU=1671129325; P00002=%7B%22uid%22%3A%221671129325%22%2C%22pru%22%3A1671129325%2C%22user_name%22%3A%22188****0066%22%2C%22nickname%22%3A%22%5Cu806a%5Cu660e%5Cu7684%5Cu5c0f%5Cu5947%5Cu827aSIA%22%2C%22pnickname%22%3A%22%5Cu806a%5Cu660e%5Cu7684%5Cu5c0f%5Cu5947%5Cu827aSIA%22%2C%22type%22%3A11%2C%22email%22%3Anull%7D; QC160=%7B%22type%22%3A3%2C%22conformLoginType%22%3A0%7D; __dfp=a01c3a4164cadc42d1b553692c9870ec0d8a563dad31652110640e647b58085047@1699515766013@1698219767013';

    const result = await getDataOverviewAsync(cookie, '2023-09-25', '2023-10-24', 4);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);
});
