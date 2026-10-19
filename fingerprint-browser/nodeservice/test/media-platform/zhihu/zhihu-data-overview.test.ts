import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import {
  getDataOverviewAsync,
  getDataOverviewStatisticAsync,
  getDataOverviewIncomeAsync,
  getDataOverviewIncomeStatisticAsync,
  getSingleDataOverviewStatisticAsync,
  getSingleDataOverviewAsync,
} from '@/media-platform/zhihu/zhihu-data-overview.service';

describe('【Mock】', () => {
  describe('获取知乎内容分析', () => {
    const server = setupServer(
      rest.get('https://www.zhihu.com*/api/v4/creators/analysis/realtime/member/daily', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json([
              {
                p_date: '2023-11-03',
                pv: 166,
                play: 0,
                show: 869,
                upvote: 1,
                comment: 0,
                like: 0,
                collect: 2,
                share: 0,
                reaction: 0,
                re_pin: 0,
                like_and_reaction: 0,
                incr_upvote_num: null,
                desc_upvote_num: null,
                incr_like_num: null,
                desc_like_num: null,
                yesterday: null,
                today: null,
                advanced: null,
              },
              {
                p_date: '2023-11-02',
                pv: 189,
                play: 0,
                show: 936,
                upvote: 0,
                comment: 1,
                like: 2,
                collect: 2,
                share: 0,
                reaction: 0,
                re_pin: 0,
                like_and_reaction: 2,
                incr_upvote_num: null,
                desc_upvote_num: null,
                incr_like_num: null,
                desc_like_num: null,
                yesterday: null,
                today: null,
                advanced: null,
              },
              {
                p_date: '2023-11-01',
                pv: 141,
                play: 2,
                show: 777,
                upvote: 0,
                comment: 0,
                like: 0,
                collect: 0,
                share: 0,
                reaction: 0,
                re_pin: 0,
                like_and_reaction: 0,
                incr_upvote_num: null,
                desc_upvote_num: null,
                incr_like_num: null,
                desc_like_num: null,
                yesterday: null,
                today: null,
                advanced: null,
              },
              {
                p_date: '2023-10-31',
                pv: 143,
                play: 1,
                show: 820,
                upvote: 0,
                comment: 0,
                like: 0,
                collect: 2,
                share: 0,
                reaction: 0,
                re_pin: 0,
                like_and_reaction: 0,
                incr_upvote_num: null,
                desc_upvote_num: null,
                incr_like_num: null,
                desc_like_num: null,
                yesterday: null,
                today: null,
                advanced: null,
              },
              {
                p_date: '2023-10-30',
                pv: 128,
                play: 0,
                show: 826,
                upvote: 1,
                comment: 0,
                like: 0,
                collect: 0,
                share: 0,
                reaction: 0,
                re_pin: 0,
                like_and_reaction: 0,
                incr_upvote_num: null,
                desc_upvote_num: null,
                incr_like_num: null,
                desc_like_num: null,
                yesterday: null,
                today: null,
                advanced: null,
              },
              {
                p_date: '2023-10-29',
                pv: 129,
                play: 4,
                show: 758,
                upvote: 0,
                comment: 0,
                like: 0,
                collect: 0,
                share: 0,
                reaction: 0,
                re_pin: 0,
                like_and_reaction: 0,
                incr_upvote_num: null,
                desc_upvote_num: null,
                incr_like_num: null,
                desc_like_num: null,
                yesterday: null,
                today: null,
                advanced: null,
              },
              {
                p_date: '2023-10-28',
                pv: 98,
                play: 1,
                show: 639,
                upvote: 0,
                comment: 0,
                like: 0,
                collect: 0,
                share: 0,
                reaction: 0,
                re_pin: 0,
                like_and_reaction: 0,
                incr_upvote_num: null,
                desc_upvote_num: null,
                incr_like_num: null,
                desc_like_num: null,
                yesterday: null,
                today: null,
                advanced: null,
              },
            ]),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const result = await getDataOverviewAsync('success', 'all', '');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result).length(7);
      });
    });
  });

  describe('获取知乎内容分析统计', () => {
    const server = setupServer(
      rest.get('https://www.zhihu.com*/api/v4/creators/analysis/realtime/member/aggr', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              updated: '2023-11-06 10:56:43',
              pv: 994,
              play: 8,
              show: 5625,
              upvote: 2,
              comment: 1,
              like: 2,
              collect: 6,
              share: 0,
              reaction: 0,
              re_pin: 0,
              like_and_reaction: 2,
              incr_upvote_num: null,
              desc_upvote_num: null,
              incr_like_num: null,
              desc_like_num: null,
              yesterday: {
                updated: null,
                pv: 136,
                play: 4,
                show: 775,
                upvote: 0,
                comment: 0,
                like: 0,
                collect: 1,
                share: 1,
                reaction: 0,
                re_pin: 0,
                like_and_reaction: 0,
                incr_upvote_num: null,
                desc_upvote_num: null,
                incr_like_num: null,
                desc_like_num: null,
              },
              today: {
                updated: null,
                pv: 81,
                play: 1,
                show: 272,
                upvote: 1,
                comment: 0,
                like: 0,
                collect: 2,
                share: 0,
                reaction: 0,
                re_pin: 0,
                like_and_reaction: 0,
                incr_upvote_num: 1,
                desc_upvote_num: 0,
                incr_like_num: 0,
                desc_like_num: 0,
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
        const result = await getDataOverviewStatisticAsync('success', 'all', '');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.yesterday).not.toBeNull();
        expect(result.today).not.toBeNull();
      });
    });
  });

  describe('获取知乎收益分析', () => {
    const server = setupServer(
      rest.get('https://www.zhihu.com*/api/v4/creators/money/range', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json([
              {
                date: '2023-11-03',
                total: 0,
                channel_paid: 0,
                channel_content_money: 0,
                channel_good_good: 0,
                channel_zhi_plus: 0,
                channel_brand_task: 0,
                channel_other: 0,
              },
              {
                date: '2023-11-02',
                total: 0,
                channel_paid: 0,
                channel_content_money: 0,
                channel_good_good: 0,
                channel_zhi_plus: 0,
                channel_brand_task: 0,
                channel_other: 0,
              },
              {
                date: '2023-11-01',
                total: 0,
                channel_paid: 0,
                channel_content_money: 0,
                channel_good_good: 0,
                channel_zhi_plus: 0,
                channel_brand_task: 0,
                channel_other: 0,
              },
              {
                date: '2023-10-31',
                total: 0,
                channel_paid: 0,
                channel_content_money: 0,
                channel_good_good: 0,
                channel_zhi_plus: 0,
                channel_brand_task: 0,
                channel_other: 0,
              },
              {
                date: '2023-10-30',
                total: 0,
                channel_paid: 0,
                channel_content_money: 0,
                channel_good_good: 0,
                channel_zhi_plus: 0,
                channel_brand_task: 0,
                channel_other: 0,
              },
              {
                date: '2023-10-29',
                total: 0,
                channel_paid: 0,
                channel_content_money: 0,
                channel_good_good: 0,
                channel_zhi_plus: 0,
                channel_brand_task: 0,
                channel_other: 0,
              },
              {
                date: '2023-10-28',
                total: 0,
                channel_paid: 0,
                channel_content_money: 0,
                channel_good_good: 0,
                channel_zhi_plus: 0,
                channel_brand_task: 0,
                channel_other: 0,
              },
            ]),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const result = await getDataOverviewIncomeAsync('success', '', '');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result).length(7);
      });
    });
  });

  describe('获取知乎收益分析统计', () => {
    const server = setupServer(
      rest.get('https://www.zhihu.com*/api/v4/creators/money/card', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              today: 0,
              yesterday: 0,
              this_week: 0,
              last_week: 0,
              total: 0,
              balance: 0,
              diff: 0,
            }),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const result = await getDataOverviewIncomeStatisticAsync('success');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.today).not.toBeNull();
        expect(result.yesterday).not.toBeNull();
      });
    });
  });

  describe('获取知乎单篇统计', () => {
    const server = setupServer(
      rest.get('https://www.zhihu.com*/api/v4/creators/analysis/realtime/content/aggr', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              pv: 0,
              play: 2,
              show: 0,
              upvote: 0,
              comment: 0,
              like: 0,
              collect: 0,
              share: 0,
              reaction: 0,
              re_pin: 0,
              like_and_reaction: 0,
              incr_upvote_num: null,
              desc_upvote_num: null,
              incr_like_num: null,
              desc_like_num: null,
              yesterday: {
                p_date: '2023-12-03',
                pv: 0,
                play: 0,
                show: 0,
                upvote: 0,
                comment: 0,
                like: 0,
                collect: 0,
                share: 0,
                reaction: 0,
                re_pin: 0,
                like_and_reaction: 0,
                incr_upvote_num: null,
                desc_upvote_num: null,
                incr_like_num: null,
                desc_like_num: null,
                yesterday: null,
                today: null,
                advanced: {
                  finish_read_percent: null,
                  positive_interact_percent: '0.00%',
                  follower_translate: 0,
                  status: 'normal',
                },
              },
              today: {
                p_date: '2023-12-04',
                pv: 0,
                play: 0,
                show: 0,
                upvote: 0,
                comment: 0,
                like: 0,
                collect: 0,
                share: 0,
                reaction: 0,
                re_pin: 0,
                like_and_reaction: 0,
                incr_upvote_num: 0,
                desc_upvote_num: 0,
                incr_like_num: 0,
                desc_like_num: 0,
                yesterday: null,
                today: null,
                advanced: {
                  finish_read_percent: 'NaN%',
                  positive_interact_percent: '0.00%',
                  follower_translate: 0,
                  status: 'normal',
                },
              },
              advanced: {
                finish_read_percent: 'NaN%',
                positive_interact_percent: '0.00%',
                follower_translate: 0,
                status: 'normal',
              },
              zvideo: {
                id: '1713579743016792064',
                url_token: '1713579743016792064',
                title: '随便制作的视频jj？#dsf645收到- JFK尽快@骑士',
                excerpt: '11月29日随便制作的视频',
                thumbnail: 'https://picx.zhimg.com/v2-69b0dfec9cbc17b31c9d26511c268b68_r.jpg?source=117bd250',
                comment_permission: 'all',
                duration: 56.168,
                created_time: 1701329248,
                updated_time: 1701329563,
                co_creation: {
                  is_co_creation: false,
                  own: 0,
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
        const result = await getSingleDataOverviewStatisticAsync('success', '', 'article', '');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
      });
    });
  });

  describe('获取知乎单篇报表数据', () => {
    const server = setupServer(
      rest.get('https://www.zhihu.com*/api/v4/creators/analysis/realtime/content/daily', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json([
              {
                p_date: '2023-12-04',
                pv: 0,
                play: 0,
                show: 0,
                upvote: 0,
                comment: 0,
                like: 0,
                collect: 0,
                share: 0,
                reaction: 0,
                re_pin: 0,
                like_and_reaction: 0,
                incr_upvote_num: null,
                desc_upvote_num: null,
                incr_like_num: null,
                desc_like_num: null,
                yesterday: null,
                today: null,
                advanced: null,
              },
              {
                p_date: '2023-12-03',
                pv: 0,
                play: 0,
                show: 0,
                upvote: 0,
                comment: 0,
                like: 0,
                collect: 0,
                share: 0,
                reaction: 0,
                re_pin: 0,
                like_and_reaction: 0,
                incr_upvote_num: null,
                desc_upvote_num: null,
                incr_like_num: null,
                desc_like_num: null,
                yesterday: null,
                today: null,
                advanced: null,
              },
              {
                p_date: '2023-12-02',
                pv: 0,
                play: 0,
                show: 0,
                upvote: 0,
                comment: 0,
                like: 0,
                collect: 0,
                share: 0,
                reaction: 0,
                re_pin: 0,
                like_and_reaction: 0,
                incr_upvote_num: null,
                desc_upvote_num: null,
                incr_like_num: null,
                desc_like_num: null,
                yesterday: null,
                today: null,
                advanced: null,
              },
              {
                p_date: '2023-12-01',
                pv: 0,
                play: 2,
                show: 0,
                upvote: 0,
                comment: 0,
                like: 0,
                collect: 0,
                share: 0,
                reaction: 0,
                re_pin: 0,
                like_and_reaction: 0,
                incr_upvote_num: null,
                desc_upvote_num: null,
                incr_like_num: null,
                desc_like_num: null,
                yesterday: null,
                today: null,
                advanced: null,
              },
              {
                p_date: '2023-11-30',
                pv: 0,
                play: 0,
                show: 0,
                upvote: 0,
                comment: 0,
                like: 0,
                collect: 0,
                share: 0,
                reaction: 0,
                re_pin: 0,
                like_and_reaction: 0,
                incr_upvote_num: null,
                desc_upvote_num: null,
                incr_like_num: null,
                desc_like_num: null,
                yesterday: null,
                today: null,
                advanced: null,
              },
            ]),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const result = await getSingleDataOverviewAsync('success', '', 'article', '', '');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('获取知乎内容分析', async () => {
    const cookie =
      '_zap=06dc3a78-192f-4c2a-bb46-759af275de91; d_c0=AHAWkIgiVBaPTvmafr3ufkZBSjGnrlshzYA=|1676383319; _xsrf=CCiQPKwIFK1ByYUmNluRkw8vSHJQv2Pn; __snaker__id=WGQ5txxQ5yFO1CcX; YD00517437729195%3AWM_TID=V5WbGn4nasFBAABUVAPAnONMBbXYsZdQ; q_c1=5e063e8e2b2d41379bdf6cae1074cfc0|1697590976000|1697590976000; YD00517437729195%3AWM_NI=qrAr8Y1jIGw2F4CINaVr5CrzNhgRJxWvTqmNTBrqBpuWo0moWpGlqU%2FFO9%2BHJXlveVjYXHnQuVKaLtBKa0Ro5JUpyyx0k7wp01j8JXTHOvVV2wf4Ux6lLRqX8d%2BOBuyyYUQ%3D; YD00517437729195%3AWM_NIKE=9ca17ae2e6ffcda170e2e6eea9d4428287e1a7d64aed928ab3d54f828a8fb0c467fcbca5a4bc72ac8aa9aab32af0fea7c3b92ab3ae8f93bb53f3b687a8f63a86ec8daacd6b96aefba4f1728eb8a9b3c97495aa9c92f046989ebe92c17cb789a1d1f06595b0898df45fed9a81daaa448a88a497e85eaa8798a9ed5bb78a8582cf808295afd1d165f7969b91fc73bcf0a5d8f67cf4efa6d9c95498988197d55ef2a9aad5d874f6b484b3f454fcbce5b0c17fbba797b6d437e2a3; z_c0=2|1:0|10:1701139035|4:z_c0|80:MS4xX0p2bkNnQUFBQUFtQUFBQVlBSlZUVnVnVW1iZ01ER05KUHltdjE2TE8teldiSEpZTzBiTHZBPT0=|50081d78a3c346b4ebf733782fb5e4cb2d0de59ac35c0b035d42a66ab06507d5; SUBMIT_0=3debfaa6-b367-4c14-803f-5ea77a8674a6; Hm_lvt_98beee57fd2ef70ccdd5ca52b9740c49=1701136736,1701332431,1701353549,1701652380; Hm_lpvt_98beee57fd2ef70ccdd5ca52b9740c49=1701652380; SESSIONID=yYn0IFbgopYmqjvlL757c3WOfBRVbpEaWQ1TVzgrZQe; JOID=W1sVAkJ92RnCusOHY3RTQV5mXfl9DoN2-vOP5gUSo0Ouw6n7DOn8fa-wyoVqkPNua9vjaSVuDF2D1fgnx57ro5Y=; osd=UFgRAk522h3CtsiEZ3RfSl1iXfV2DYd29viM4gUeqECqw6XwD-38caSzzoVmm_Bqa9foaiFuAFaA0fgrzJ3vo5o=; KLBRSID=fe78dd346df712f9c4f126150949b853|1701652396|1701652378';

    const result = await getDataOverviewAsync(cookie, '2023-10-28', '2023-11-03');
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result).length(7);
  }, 10000000);

  test('获取知乎内容分析统计', async () => {
    const cookie =
      '_zap=06dc3a78-192f-4c2a-bb46-759af275de91; d_c0=AHAWkIgiVBaPTvmafr3ufkZBSjGnrlshzYA=|1676383319; _xsrf=CCiQPKwIFK1ByYUmNluRkw8vSHJQv2Pn; __snaker__id=WGQ5txxQ5yFO1CcX; YD00517437729195%3AWM_TID=V5WbGn4nasFBAABUVAPAnONMBbXYsZdQ; q_c1=5e063e8e2b2d41379bdf6cae1074cfc0|1697590976000|1697590976000; YD00517437729195%3AWM_NI=qrAr8Y1jIGw2F4CINaVr5CrzNhgRJxWvTqmNTBrqBpuWo0moWpGlqU%2FFO9%2BHJXlveVjYXHnQuVKaLtBKa0Ro5JUpyyx0k7wp01j8JXTHOvVV2wf4Ux6lLRqX8d%2BOBuyyYUQ%3D; YD00517437729195%3AWM_NIKE=9ca17ae2e6ffcda170e2e6eea9d4428287e1a7d64aed928ab3d54f828a8fb0c467fcbca5a4bc72ac8aa9aab32af0fea7c3b92ab3ae8f93bb53f3b687a8f63a86ec8daacd6b96aefba4f1728eb8a9b3c97495aa9c92f046989ebe92c17cb789a1d1f06595b0898df45fed9a81daaa448a88a497e85eaa8798a9ed5bb78a8582cf808295afd1d165f7969b91fc73bcf0a5d8f67cf4efa6d9c95498988197d55ef2a9aad5d874f6b484b3f454fcbce5b0c17fbba797b6d437e2a3; z_c0=2|1:0|10:1701139035|4:z_c0|80:MS4xX0p2bkNnQUFBQUFtQUFBQVlBSlZUVnVnVW1iZ01ER05KUHltdjE2TE8teldiSEpZTzBiTHZBPT0=|50081d78a3c346b4ebf733782fb5e4cb2d0de59ac35c0b035d42a66ab06507d5; SUBMIT_0=3debfaa6-b367-4c14-803f-5ea77a8674a6; Hm_lvt_98beee57fd2ef70ccdd5ca52b9740c49=1701136736,1701332431,1701353549,1701652380; Hm_lpvt_98beee57fd2ef70ccdd5ca52b9740c49=1701652380; SESSIONID=yYn0IFbgopYmqjvlL757c3WOfBRVbpEaWQ1TVzgrZQe; JOID=W1sVAkJ92RnCusOHY3RTQV5mXfl9DoN2-vOP5gUSo0Ouw6n7DOn8fa-wyoVqkPNua9vjaSVuDF2D1fgnx57ro5Y=; osd=UFgRAk522h3CtsiEZ3RfSl1iXfV2DYd29viM4gUeqECqw6XwD-38caSzzoVmm_Bqa9foaiFuAFaA0fgrzJ3vo5o=; KLBRSID=fe78dd346df712f9c4f126150949b853|1701652396|1701652378';

    const result = await getDataOverviewStatisticAsync(cookie, 'all', '2023-11-03');
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.yesterday).not.toBeNull();
    expect(result.today).not.toBeNull();
  }, 10000000);

  test('获取知乎收益分析', async () => {
    const cookie =
      '_zap=06dc3a78-192f-4c2a-bb46-759af275de91; d_c0=AHAWkIgiVBaPTvmafr3ufkZBSjGnrlshzYA=|1676383319; _xsrf=CCiQPKwIFK1ByYUmNluRkw8vSHJQv2Pn; __snaker__id=WGQ5txxQ5yFO1CcX; YD00517437729195%3AWM_TID=V5WbGn4nasFBAABUVAPAnONMBbXYsZdQ; q_c1=5e063e8e2b2d41379bdf6cae1074cfc0|1697590976000|1697590976000; YD00517437729195%3AWM_NI=qrAr8Y1jIGw2F4CINaVr5CrzNhgRJxWvTqmNTBrqBpuWo0moWpGlqU%2FFO9%2BHJXlveVjYXHnQuVKaLtBKa0Ro5JUpyyx0k7wp01j8JXTHOvVV2wf4Ux6lLRqX8d%2BOBuyyYUQ%3D; YD00517437729195%3AWM_NIKE=9ca17ae2e6ffcda170e2e6eea9d4428287e1a7d64aed928ab3d54f828a8fb0c467fcbca5a4bc72ac8aa9aab32af0fea7c3b92ab3ae8f93bb53f3b687a8f63a86ec8daacd6b96aefba4f1728eb8a9b3c97495aa9c92f046989ebe92c17cb789a1d1f06595b0898df45fed9a81daaa448a88a497e85eaa8798a9ed5bb78a8582cf808295afd1d165f7969b91fc73bcf0a5d8f67cf4efa6d9c95498988197d55ef2a9aad5d874f6b484b3f454fcbce5b0c17fbba797b6d437e2a3; z_c0=2|1:0|10:1701139035|4:z_c0|80:MS4xX0p2bkNnQUFBQUFtQUFBQVlBSlZUVnVnVW1iZ01ER05KUHltdjE2TE8teldiSEpZTzBiTHZBPT0=|50081d78a3c346b4ebf733782fb5e4cb2d0de59ac35c0b035d42a66ab06507d5; SUBMIT_0=3debfaa6-b367-4c14-803f-5ea77a8674a6; Hm_lvt_98beee57fd2ef70ccdd5ca52b9740c49=1701136736,1701332431,1701353549,1701652380; Hm_lpvt_98beee57fd2ef70ccdd5ca52b9740c49=1701652380; SESSIONID=yYn0IFbgopYmqjvlL757c3WOfBRVbpEaWQ1TVzgrZQe; JOID=W1sVAkJ92RnCusOHY3RTQV5mXfl9DoN2-vOP5gUSo0Ouw6n7DOn8fa-wyoVqkPNua9vjaSVuDF2D1fgnx57ro5Y=; osd=UFgRAk522h3CtsiEZ3RfSl1iXfV2DYd29viM4gUeqECqw6XwD-38caSzzoVmm_Bqa9foaiFuAFaA0fgrzJ3vo5o=; KLBRSID=fe78dd346df712f9c4f126150949b853|1701652396|1701652378';

    const result = await getDataOverviewIncomeAsync(cookie, '2023-10-28', '2023-11-03');
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result).length(7);
  }, 10000000);

  test('获取知乎收益分析统计', async () => {
    const cookie =
      '_zap=06dc3a78-192f-4c2a-bb46-759af275de91; d_c0=AHAWkIgiVBaPTvmafr3ufkZBSjGnrlshzYA=|1676383319; _xsrf=CCiQPKwIFK1ByYUmNluRkw8vSHJQv2Pn; __snaker__id=WGQ5txxQ5yFO1CcX; YD00517437729195%3AWM_TID=V5WbGn4nasFBAABUVAPAnONMBbXYsZdQ; q_c1=5e063e8e2b2d41379bdf6cae1074cfc0|1697590976000|1697590976000; YD00517437729195%3AWM_NI=qrAr8Y1jIGw2F4CINaVr5CrzNhgRJxWvTqmNTBrqBpuWo0moWpGlqU%2FFO9%2BHJXlveVjYXHnQuVKaLtBKa0Ro5JUpyyx0k7wp01j8JXTHOvVV2wf4Ux6lLRqX8d%2BOBuyyYUQ%3D; YD00517437729195%3AWM_NIKE=9ca17ae2e6ffcda170e2e6eea9d4428287e1a7d64aed928ab3d54f828a8fb0c467fcbca5a4bc72ac8aa9aab32af0fea7c3b92ab3ae8f93bb53f3b687a8f63a86ec8daacd6b96aefba4f1728eb8a9b3c97495aa9c92f046989ebe92c17cb789a1d1f06595b0898df45fed9a81daaa448a88a497e85eaa8798a9ed5bb78a8582cf808295afd1d165f7969b91fc73bcf0a5d8f67cf4efa6d9c95498988197d55ef2a9aad5d874f6b484b3f454fcbce5b0c17fbba797b6d437e2a3; z_c0=2|1:0|10:1701139035|4:z_c0|80:MS4xX0p2bkNnQUFBQUFtQUFBQVlBSlZUVnVnVW1iZ01ER05KUHltdjE2TE8teldiSEpZTzBiTHZBPT0=|50081d78a3c346b4ebf733782fb5e4cb2d0de59ac35c0b035d42a66ab06507d5; SUBMIT_0=3debfaa6-b367-4c14-803f-5ea77a8674a6; Hm_lvt_98beee57fd2ef70ccdd5ca52b9740c49=1701136736,1701332431,1701353549,1701652380; Hm_lpvt_98beee57fd2ef70ccdd5ca52b9740c49=1701652380; SESSIONID=yYn0IFbgopYmqjvlL757c3WOfBRVbpEaWQ1TVzgrZQe; JOID=W1sVAkJ92RnCusOHY3RTQV5mXfl9DoN2-vOP5gUSo0Ouw6n7DOn8fa-wyoVqkPNua9vjaSVuDF2D1fgnx57ro5Y=; osd=UFgRAk522h3CtsiEZ3RfSl1iXfV2DYd29viM4gUeqECqw6XwD-38caSzzoVmm_Bqa9foaiFuAFaA0fgrzJ3vo5o=; KLBRSID=fe78dd346df712f9c4f126150949b853|1701652396|1701652378';

    const result = await getDataOverviewIncomeStatisticAsync(cookie);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.today).not.toBeNull();
    expect(result.yesterday).not.toBeNull();
  }, 10000000);

  test('获取知乎单篇数据统计', async () => {
    const cookie =
      '_zap=06dc3a78-192f-4c2a-bb46-759af275de91; d_c0=AHAWkIgiVBaPTvmafr3ufkZBSjGnrlshzYA=|1676383319; _xsrf=CCiQPKwIFK1ByYUmNluRkw8vSHJQv2Pn; __snaker__id=WGQ5txxQ5yFO1CcX; YD00517437729195%3AWM_TID=V5WbGn4nasFBAABUVAPAnONMBbXYsZdQ; q_c1=5e063e8e2b2d41379bdf6cae1074cfc0|1697590976000|1697590976000; YD00517437729195%3AWM_NI=qrAr8Y1jIGw2F4CINaVr5CrzNhgRJxWvTqmNTBrqBpuWo0moWpGlqU%2FFO9%2BHJXlveVjYXHnQuVKaLtBKa0Ro5JUpyyx0k7wp01j8JXTHOvVV2wf4Ux6lLRqX8d%2BOBuyyYUQ%3D; YD00517437729195%3AWM_NIKE=9ca17ae2e6ffcda170e2e6eea9d4428287e1a7d64aed928ab3d54f828a8fb0c467fcbca5a4bc72ac8aa9aab32af0fea7c3b92ab3ae8f93bb53f3b687a8f63a86ec8daacd6b96aefba4f1728eb8a9b3c97495aa9c92f046989ebe92c17cb789a1d1f06595b0898df45fed9a81daaa448a88a497e85eaa8798a9ed5bb78a8582cf808295afd1d165f7969b91fc73bcf0a5d8f67cf4efa6d9c95498988197d55ef2a9aad5d874f6b484b3f454fcbce5b0c17fbba797b6d437e2a3; z_c0=2|1:0|10:1701139035|4:z_c0|80:MS4xX0p2bkNnQUFBQUFtQUFBQVlBSlZUVnVnVW1iZ01ER05KUHltdjE2TE8teldiSEpZTzBiTHZBPT0=|50081d78a3c346b4ebf733782fb5e4cb2d0de59ac35c0b035d42a66ab06507d5; SUBMIT_0=3debfaa6-b367-4c14-803f-5ea77a8674a6; Hm_lvt_98beee57fd2ef70ccdd5ca52b9740c49=1701136736,1701332431,1701353549,1701652380; Hm_lpvt_98beee57fd2ef70ccdd5ca52b9740c49=1701652380; SESSIONID=yYn0IFbgopYmqjvlL757c3WOfBRVbpEaWQ1TVzgrZQe; JOID=W1sVAkJ92RnCusOHY3RTQV5mXfl9DoN2-vOP5gUSo0Ouw6n7DOn8fa-wyoVqkPNua9vjaSVuDF2D1fgnx57ro5Y=; osd=UFgRAk522h3CtsiEZ3RfSl1iXfV2DYd29viM4gUeqECqw6XwD-38caSzzoVmm_Bqa9foaiFuAFaA0fgrzJ3vo5o=; KLBRSID=fe78dd346df712f9c4f126150949b853|1701652396|1701652378';

    const result = await getSingleDataOverviewStatisticAsync(cookie, '1713579743016792064', 'zvideo', '2023-12-04');
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取知乎收益分析统计', async () => {
    const cookie =
      '_zap=06dc3a78-192f-4c2a-bb46-759af275de91; d_c0=AHAWkIgiVBaPTvmafr3ufkZBSjGnrlshzYA=|1676383319; _xsrf=CCiQPKwIFK1ByYUmNluRkw8vSHJQv2Pn; __snaker__id=WGQ5txxQ5yFO1CcX; YD00517437729195%3AWM_TID=V5WbGn4nasFBAABUVAPAnONMBbXYsZdQ; q_c1=5e063e8e2b2d41379bdf6cae1074cfc0|1697590976000|1697590976000; YD00517437729195%3AWM_NI=qrAr8Y1jIGw2F4CINaVr5CrzNhgRJxWvTqmNTBrqBpuWo0moWpGlqU%2FFO9%2BHJXlveVjYXHnQuVKaLtBKa0Ro5JUpyyx0k7wp01j8JXTHOvVV2wf4Ux6lLRqX8d%2BOBuyyYUQ%3D; YD00517437729195%3AWM_NIKE=9ca17ae2e6ffcda170e2e6eea9d4428287e1a7d64aed928ab3d54f828a8fb0c467fcbca5a4bc72ac8aa9aab32af0fea7c3b92ab3ae8f93bb53f3b687a8f63a86ec8daacd6b96aefba4f1728eb8a9b3c97495aa9c92f046989ebe92c17cb789a1d1f06595b0898df45fed9a81daaa448a88a497e85eaa8798a9ed5bb78a8582cf808295afd1d165f7969b91fc73bcf0a5d8f67cf4efa6d9c95498988197d55ef2a9aad5d874f6b484b3f454fcbce5b0c17fbba797b6d437e2a3; z_c0=2|1:0|10:1701139035|4:z_c0|80:MS4xX0p2bkNnQUFBQUFtQUFBQVlBSlZUVnVnVW1iZ01ER05KUHltdjE2TE8teldiSEpZTzBiTHZBPT0=|50081d78a3c346b4ebf733782fb5e4cb2d0de59ac35c0b035d42a66ab06507d5; SUBMIT_0=3debfaa6-b367-4c14-803f-5ea77a8674a6; Hm_lvt_98beee57fd2ef70ccdd5ca52b9740c49=1701136736,1701332431,1701353549,1701652380; Hm_lpvt_98beee57fd2ef70ccdd5ca52b9740c49=1701652380; SESSIONID=yYn0IFbgopYmqjvlL757c3WOfBRVbpEaWQ1TVzgrZQe; JOID=W1sVAkJ92RnCusOHY3RTQV5mXfl9DoN2-vOP5gUSo0Ouw6n7DOn8fa-wyoVqkPNua9vjaSVuDF2D1fgnx57ro5Y=; osd=UFgRAk522h3CtsiEZ3RfSl1iXfV2DYd29viM4gUeqECqw6XwD-38caSzzoVmm_Bqa9foaiFuAFaA0fgrzJ3vo5o=; KLBRSID=fe78dd346df712f9c4f126150949b853|1701652396|1701652378';

    const result = await getSingleDataOverviewAsync(
      cookie,
      '1713579743016792064',
      'zvideo',
      '2023-11-28',
      '2023-12-04',
    );
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});
