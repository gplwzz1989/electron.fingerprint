import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import {
  getDataOverviewAsync,
  getDataOverviewCoreDataAsync,
  getDataOverviewIncomeAsync,
} from '@/media-platform/miaopai/miaopai-data-overview.service';

describe('【Mock】', () => {
  describe('获取秒拍视频数据明细', () => {
    const server = setupServer(
      rest.get('https://creator.miaopai.com*/statis/getvideoalldatalist', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 200,
              msg: '操作成功',
              data: {
                list: [
                  {
                    date: '2023-10-30',
                    ccnt: '--',
                    lcnt: '--',
                    vcnt: '--',
                    pubChanCnt: '--',
                    validFansCnt: '--',
                    newFansCnt: '--',
                  },
                ],
                total: 30,
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
        const result = await getDataOverviewAsync('success', 1);
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(200);
      });
    });
  });

  describe('获取秒拍视频概览数据', () => {
    const server = setupServer(
      rest.get('https://creator.miaopai.com*/statis/getuservideodata', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 200,
              msg: '操作成功',
              data: {
                today: {
                  validFansCnt: 0,
                  fansChangeStatus: 0,
                  fansChangeCnt: 0,
                  sumVcnt: 0,
                  totalChanCnt: 0,
                  pubChanCnt: 0,
                  vcnt: 0,
                  lcnt: 0,
                  ccnt: 0,
                },
                yesterday: {
                  validFansCnt: 0,
                  fansChangeStatus: 0,
                  fansChangeCnt: 0,
                  sumVcnt: 0,
                  totalChanCnt: 0,
                  pubChanCnt: 0,
                  vcnt: 0,
                  lcnt: 0,
                  ccnt: 0,
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
        const result = await getDataOverviewCoreDataAsync('success');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(200);
      });
    });
  });

  describe('获取秒拍视频结算中心', () => {
    const server = setupServer(
      rest.get('https://creator.miaopai.com*/Checkout/getAmount', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 200,
              msg: '操作成功',
              data: {
                extract: 0,
                surplus: 0,
                allow_extract: 0,
                min_take: 100,
                extract_msg: '必须在每月的1号~~5号,在能够申请!',
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
        const result = await getDataOverviewIncomeAsync('success');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(200);
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('获取秒拍视频数据明细', async () => {
    const cookie =
      'PHPSESSID=ac429e9f509040274b2f9fc94ea66310; weiba_captcha=257a5113d395c54ace400d5d43454216; SRV_CREATOR_COOKIE_LOGIN_TOKEN=a2HGavOKijyxnFtw9yLy5V5FNmB5LlruAIbcwJwXU2uFS%7Eed';

    const result = await getDataOverviewAsync(cookie, 1);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(200);
  }, 10000000);

  test('获取秒拍视频概览数据', async () => {
    const cookie =
      'PHPSESSID=ac429e9f509040274b2f9fc94ea66310; weiba_captcha=257a5113d395c54ace400d5d43454216; SRV_CREATOR_COOKIE_LOGIN_TOKEN=a2HGavOKijyxnFtw9yLy5V5FNmB5LlruAIbcwJwXU2uFS%7Eed';

    const result = await getDataOverviewCoreDataAsync(cookie);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(200);
  }, 10000000);

  test('获取秒拍视频结算中心', async () => {
    const cookie =
      'PHPSESSID=ac429e9f509040274b2f9fc94ea66310; weiba_captcha=257a5113d395c54ace400d5d43454216; SRV_CREATOR_COOKIE_LOGIN_TOKEN=a2HGavOKijyxnFtw9yLy5V5FNmB5LlruAIbcwJwXU2uFS%7Eed';

    const result = await getDataOverviewIncomeAsync(cookie);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(200);
  }, 10000000);
});
