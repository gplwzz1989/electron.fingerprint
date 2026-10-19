import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import {
  getDataOverviewAsync,
  getDataOverviewCoreDataAsync,
} from '@/media-platform/xueqiuhao/xueqiuhao-data-overview.service';

describe('【Mock】', () => {
  describe('获取雪球号数据分析报表', () => {
    const server = setupServer(
      rest.get('https://mp.xueqiu.com*/xq/analysis/creator/data_center/analysis_overview.json', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 0,
              message: '请求成功',
              data: [
                {
                  value: 29,
                  created_at: '2023-11-08',
                  incr_value: -19,
                },
                {
                  value: 48,
                  created_at: '2023-11-07',
                  incr_value: 13,
                },
                {
                  value: 35,
                  created_at: '2023-11-06',
                  incr_value: 2,
                },
                {
                  value: 33,
                  created_at: '2023-11-05',
                  incr_value: -5,
                },
                {
                  value: 38,
                  created_at: '2023-11-04',
                  incr_value: -631,
                },
                {
                  value: 669,
                  created_at: '2023-11-03',
                  incr_value: -566,
                },
                {
                  value: 1235,
                  created_at: '2023-11-02',
                  incr_value: 150,
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
        const result = await getDataOverviewAsync('success');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(0);
      });
    });
  });

  describe('获取雪球号数据分析核心数据', () => {
    const server = setupServer(
      rest.get('https://mp.xueqiu.com*/xq/analysis/creator/data_center/query_overview.json', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 0,
              message: '请求成功',
              data: {
                increment_status_view_count: -19,
                increment_status_reply_count: 0,
                increment_status_retweet_count: 0,
                increment_status_like_count: 0,
                user_id: 0,
                view_count: 29,
                reply_count: 0,
                retweet_count: 0,
                like_count: 0,
                fav_count: 0,
                increment_status_fav_count: 0,
                created_at: 0,
                vod_count: 0,
                incr_vod_count: 0,
                vod_reply_count: 0,
                incr_vod_reply_count: 0,
                vod_retweet_count: 0,
                incr_vod_retweet_count: 0,
                vod_like_count: 0,
                incr_vod_like_count: 0,
                vod_fav_count: 0,
                incr_vod_fav_count: 0,
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
        expect(result.code).toBe(0);
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('获取雪球号数据分析报表', async () => {
    const cookie =
      'device_id=657672e32e5496b7c85150f7877f492c; cookiesu=851699425356647; s=aj19skjk8k; u=1494913091; remember=1; xq_a_token=357e6c99afc523727e54f0d6f1baf7ed5e6108cb; xqat=357e6c99afc523727e54f0d6f1baf7ed5e6108cb; xq_id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJ1aWQiOjE0OTQ5MTMwOTEsImlzcyI6InVjIiwiZXhwIjoxNzAxMzM4MjkwLCJjdG0iOjE2OTk0OTMwNTUyMDUsImNpZCI6ImQ5ZDBuNEFadXAifQ.e53tUnoEh3LrROm0x9Qk8lCRzst2gOtcMTP5fBTVXrqKi2B0eQ-0AqWCRc__ldlA7G35FT93HIpLmrqG4FEoorG4OwZAb1L-cRQ7vmRKtY4WbYUdOokUMImOi3MlpK8Sp0GoZ0S3wg0qViHisZREEIv1_36jz8JePymvFJEzAQJujayP__cZRH1dD-nhRoMIzrHqVDDIkxvyvKcBNI_0grMTHyB152GcR_saGvilGg6G_18kxGn2t0QA5yCJA7DyfrSmab9BKreh5KXRYuezZnDCCwq8h2tL4QpmR-vFLPaadopKqD1-IjBh2aKM1HQyPfLuq5jvcbdLViMRnKJ1jg; xq_r_token=8295e83a981bf45083ca5803ee33ec477e858ea1; xq_is_login=1; u=1494913091; aliyungf_tc=a70eff0562c50dc2fed26e8f74f8303147223d84b80cc43b7a1501937decbeb8; acw_tc=ac11000116994930669193802ec1f34204f90dcdd40bb8e321345899802296';

    const result = await getDataOverviewAsync(cookie);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);

  test('获取雪球号数据分析核心数据', async () => {
    const cookie =
      'device_id=657672e32e5496b7c85150f7877f492c; cookiesu=851699425356647; s=aj19skjk8k; u=1494913091; remember=1; xq_a_token=357e6c99afc523727e54f0d6f1baf7ed5e6108cb; xqat=357e6c99afc523727e54f0d6f1baf7ed5e6108cb; xq_id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJ1aWQiOjE0OTQ5MTMwOTEsImlzcyI6InVjIiwiZXhwIjoxNzAxMzM4MjkwLCJjdG0iOjE2OTk0OTMwNTUyMDUsImNpZCI6ImQ5ZDBuNEFadXAifQ.e53tUnoEh3LrROm0x9Qk8lCRzst2gOtcMTP5fBTVXrqKi2B0eQ-0AqWCRc__ldlA7G35FT93HIpLmrqG4FEoorG4OwZAb1L-cRQ7vmRKtY4WbYUdOokUMImOi3MlpK8Sp0GoZ0S3wg0qViHisZREEIv1_36jz8JePymvFJEzAQJujayP__cZRH1dD-nhRoMIzrHqVDDIkxvyvKcBNI_0grMTHyB152GcR_saGvilGg6G_18kxGn2t0QA5yCJA7DyfrSmab9BKreh5KXRYuezZnDCCwq8h2tL4QpmR-vFLPaadopKqD1-IjBh2aKM1HQyPfLuq5jvcbdLViMRnKJ1jg; xq_r_token=8295e83a981bf45083ca5803ee33ec477e858ea1; xq_is_login=1; u=1494913091; aliyungf_tc=a70eff0562c50dc2fed26e8f74f8303147223d84b80cc43b7a1501937decbeb8; acw_tc=ac11000116994930669193802ec1f34204f90dcdd40bb8e321345899802296';

    const result = await getDataOverviewCoreDataAsync(cookie);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);
});
