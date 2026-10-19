import fs from 'fs';
import path from 'path';
import { describe, expect, test } from 'vitest';
import {
  getDataOverviewListAsync,
  getSingleDataOverviewAsync,
} from '@/media-platform/douyin/douyin-data-overview.service';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';

export const getCookie = (fileName: string = 'cookie.txt'): string => {
  return fs.readFileSync(path.resolve(__dirname, fileName), { encoding: 'utf8' }).trim();
};

describe('【Mock】', () => {
  describe('获取抖音数据总览', () => {
    const server = setupServer(
      rest.get('https://creator.douyin.com*/aweme/v1/creator/data/overview/option/', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              current_count: '8',
              extra: {
                now: 1697681228000,
              },
              last_period_incr: '-1',
              option_list: [
                {
                  count: '4',
                  date: '2023-10-12',
                  last_day_incr_rate: '-71.43%',
                },
                {
                  count: '7',
                  date: '2023-10-13',
                  last_day_incr_rate: '+75.00%',
                },
                {
                  count: '3',
                  date: '2023-10-14',
                  last_day_incr_rate: '-57.14%',
                },
                {
                  count: '9',
                  date: '2023-10-15',
                  last_day_incr_rate: '+200.00%',
                },
                {
                  count: '3',
                  date: '2023-10-16',
                  last_day_incr_rate: '-66.67%',
                },
                {
                  count: '9',
                  date: '2023-10-17',
                  last_day_incr_rate: '+200.00%',
                },
                {
                  count: '8',
                  date: '2023-10-18',
                  last_day_incr_rate: '-11.11%',
                },
              ],
              option_type: 1,
              permission_key: '',
              status_code: 0,
              status_msg: '',
            }),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const cookie = getCookie();
        const result = await getDataOverviewListAsync(cookie, 1, 3);
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.status_code).toBe(0);
      });
    });
  });

  describe('获取抖音单篇数据', () => {
    const server = setupServer(
      rest.get('https://creator.douyin.com*/web/api/creator/data/item/option/', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              analysis_all_data: [],
              analysis_single_data: [],
              extra: {
                now: 1701392703000,
              },
              granularity_ab: 1,
              related_item: [],
              status_code: 0,
              status_msg: '',
              trend_data: [
                {
                  key: '2023-11-23 00:00:00',
                  value: 0.021844660194174758,
                },
                {
                  key: '2023-11-24 00:00:00',
                  value: 0.02578268876611418,
                },
                {
                  key: '2023-11-25 00:00:00',
                  value: 0.027491408934707903,
                },
                {
                  key: '2023-11-26 00:00:00',
                  value: 0.026533996683250415,
                },
                {
                  key: '2023-11-27 00:00:00',
                  value: 0.026143790849673203,
                },
                {
                  key: '2023-11-28 00:00:00',
                  value: 0.02702702702702703,
                },
                {
                  key: '2023-11-29 00:00:00',
                  value: 0.02631578947368421,
                },
                {
                  key: '2023-11-30 00:00:00',
                  value: 0.02627511591962906,
                },
              ],
            }),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const cookie = getCookie();
        const result = await getSingleDataOverviewAsync(cookie, '7304551786646392104', 3);
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.status_code).toBe(0);
      });
    });
  });
});

describe.runIf(true)('【真实测试】', () => {
  test('获取抖音数据总览', async () => {
    const cookie = getCookie();
    const result = await getDataOverviewListAsync(cookie, 1, 3);
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.status_code).toBe(0);
  }, 10000000);

  test('获取抖音单篇数据', async () => {
    const cookie = getCookie();
    const result = await getSingleDataOverviewAsync(cookie, '7304551786646392104', 1700723525);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.status_code).toBe(0);
  }, 10000000);
});
