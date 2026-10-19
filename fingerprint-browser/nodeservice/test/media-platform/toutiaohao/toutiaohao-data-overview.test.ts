import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import {
  getDataOverviewAsync,
  getDataOverviewFansAsync,
  getSingleDataOverviewStatisticAsync,
  getSingleDataOverview,
} from '@/media-platform/toutiaohao/toutiaohao-data-overview.service';

describe('【Mock】', () => {
  describe('头条号粉丝分析', () => {
    const server = setupServer(
      rest.get('https://mp.toutiao.com*/mp/agw/statistic/v2/fans/trends', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 0,
              daily_fans_stats: [
                {
                  date: '2023-10-01',
                  fans_stat: {
                    active_fans_count: 42,
                    active_fans_rate: 0,
                    change_count: 0,
                    decrease_count: 0,
                    increase_count: 0,
                    total_fans_count: 55,
                  },
                },
              ],
              message: 'success',
            }),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const result = await getDataOverviewAsync('success', '2023-10-01', '2023-10-30');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(0);
      });
    });
  });

  describe('头条号作品数据流量分析', () => {
    const server = setupServer(
      rest.get('https://mp.toutiao.com*/mp/agw/statistic/v2/content/stat_trends', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 0,
              daily_stat_datas: [
                {
                  author_stat: {
                    consume_data: {
                      fans_go_detail_count: 0,
                      fans_go_detail_count_new: 0,
                      fans_impression_count: 0,
                      fans_impression_count_new: 0,
                      fans_play_count: -1,
                      fans_play_count_new: -1,
                      go_detail_count: 14,
                      go_detail_count_new: 14,
                      impression_count: 1061,
                      impression_count_new: 1061,
                      play_count: -1,
                      play_count_new: -1,
                    },
                    fans_change_count: 0,
                    interaction_data: {
                      comment_count: 0,
                      digg_count: 0,
                    },
                  },
                  date: '2023-09-30',
                },
              ],
              message: 'success',
              total_stat: {
                consume_data: {
                  fans_go_detail_count: 4,
                  fans_go_detail_count_new: 4,
                  fans_impression_count: 75,
                  fans_impression_count_new: 75,
                  fans_play_count: -1,
                  fans_play_count_new: -1,
                  go_detail_count: 333,
                  go_detail_count_new: 333,
                  impression_count: 32077,
                  impression_count_new: 32077,
                  play_count: -1,
                  play_count_new: -1,
                  quality_support_impression_count: 0,
                  quality_support_read_count: 0,
                },
                fans_change_count: 0,
                interaction_data: {
                  comment_count: 0,
                  digg_count: 2,
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
        const result = await getDataOverviewFansAsync('success', '2023-10-01', '2023-10-30');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(0);
      });
    });
  });

  describe('头条号单篇作品统计分析', () => {
    const server = setupServer(
      rest.get('https://mp.toutiao.com*/mp/agw/statistic/v2/item/info', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 0,
              item_data: {
                cover_url:
                  'https://p3-sign.toutiaoimg.com/tos-cn-i-dy/79e92515e1104a06ad9cb6d66ffeb770~tplv-pk90l89vgd-crop-center:0:0.jpeg?from=3762548883&x-expires=1703992885&x-signature=ReD4dGUL5I%2BgzlqimZvp5cP4j1w%3D',
                create_time: 1700723527,
                duration: 16,
                genre_type: 2,
                item_id: '7304551928460116519',
                item_stat: {
                  consume_data: {
                    fans_go_detail_count: -1,
                    fans_go_detail_count_new: -1,
                    fans_impression_count: 5,
                    fans_impression_count_new: 0,
                    fans_play_count: 0,
                    fans_play_count_new: -1,
                    go_detail_count: -1,
                    go_detail_count_new: -1,
                    impression_count: 844,
                    impression_count_new: 0,
                    play_count: 82,
                    play_count_new: -1,
                  },
                  consume_detail: {
                    click_rate: 0.0971563981042654,
                    read_complete_rate: 44,
                    read_duration: 164,
                  },
                  fans_change_count: 0,
                  fans_data: {
                    change_count: 0,
                    decrease_count: 0,
                    increase_count: 0,
                    to_fans_rate: 0,
                  },
                  fans_data_v2: {
                    change_count: 0,
                    decrease_count: 0,
                    increase_count: 0,
                    to_fans_rate: 0,
                  },
                  income_data: {
                    basic_income: 0,
                    subsidy_income: -2,
                    total_income: 0,
                  },
                  interaction_data: {
                    comment_count: 0,
                    digg_count: 2,
                    forward_count: 0,
                    repin_count: 0,
                    share_count: 0,
                  },
                  ranking_data: {
                    click_rate_rank: 16,
                    interaction_rate_rank: 86,
                    read_complete_rate_rank: 82,
                    to_fans_rate_rank: -1,
                  },
                },
                join_reward_project: false,
                title: '3，2，1，来咯~来咯~我们来咯~#动画 #动画DIY #可爱视频',
              },
              message: 'success',
            }),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const result = await getSingleDataOverviewStatisticAsync('success', '2023-10-01', 2);
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(0);
      });
    });
  });

  describe('头条号单篇作品报表分析', () => {
    const server = setupServer(
      rest.get('https://mp.toutiao.com*/mp/agw/statistic/v2/item/traffic_analyse', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 0,
              daily_stats: [
                {
                  consume_data: {
                    fans_go_detail_count: 0,
                    fans_go_detail_count_new: 0,
                    fans_impression_count: 0,
                    fans_impression_count_new: 0,
                    fans_play_count: 0,
                    fans_play_count_new: 0,
                    go_detail_count: 0,
                    go_detail_count_new: 0,
                    impression_count: 310,
                    impression_count_new: 0,
                    play_count: 69,
                    play_count_new: 0,
                  },
                  date: '2023-11-24',
                },
                {
                  consume_data: {
                    fans_go_detail_count: 0,
                    fans_go_detail_count_new: 0,
                    fans_impression_count: 0,
                    fans_impression_count_new: 0,
                    fans_play_count: 0,
                    fans_play_count_new: 0,
                    go_detail_count: 0,
                    go_detail_count_new: 0,
                    impression_count: 80,
                    impression_count_new: 0,
                    play_count: 0,
                    play_count_new: 0,
                  },
                  date: '2023-11-25',
                },
                {
                  consume_data: {
                    fans_go_detail_count: 0,
                    fans_go_detail_count_new: 0,
                    fans_impression_count: 2,
                    fans_impression_count_new: 0,
                    fans_play_count: 0,
                    fans_play_count_new: 0,
                    go_detail_count: 0,
                    go_detail_count_new: 0,
                    impression_count: 90,
                    impression_count_new: 0,
                    play_count: 0,
                    play_count_new: 0,
                  },
                  date: '2023-11-26',
                },
                {
                  consume_data: {
                    fans_go_detail_count: 0,
                    fans_go_detail_count_new: 0,
                    fans_impression_count: 0,
                    fans_impression_count_new: 0,
                    fans_play_count: 0,
                    fans_play_count_new: 0,
                    go_detail_count: 0,
                    go_detail_count_new: 0,
                    impression_count: 64,
                    impression_count_new: 0,
                    play_count: 0,
                    play_count_new: 0,
                  },
                  date: '2023-11-27',
                },
                {
                  consume_data: {
                    fans_go_detail_count: 0,
                    fans_go_detail_count_new: 0,
                    fans_impression_count: 0,
                    fans_impression_count_new: 0,
                    fans_play_count: 0,
                    fans_play_count_new: 0,
                    go_detail_count: 0,
                    go_detail_count_new: 0,
                    impression_count: 65,
                    impression_count_new: 0,
                    play_count: 0,
                    play_count_new: 0,
                  },
                  date: '2023-11-28',
                },
                {
                  consume_data: {
                    fans_go_detail_count: 0,
                    fans_go_detail_count_new: 0,
                    fans_impression_count: 1,
                    fans_impression_count_new: 0,
                    fans_play_count: 0,
                    fans_play_count_new: 0,
                    go_detail_count: 0,
                    go_detail_count_new: 0,
                    impression_count: 76,
                    impression_count_new: 0,
                    play_count: 0,
                    play_count_new: 0,
                  },
                  date: '2023-11-29',
                },
              ],
              jump_rate: [],
              message: 'success',
              total_stat: {
                consume_data: {
                  fans_go_detail_count: 0,
                  fans_go_detail_count_new: 0,
                  fans_impression_count: 3,
                  fans_impression_count_new: 0,
                  fans_play_count: 0,
                  fans_play_count_new: 0,
                  go_detail_count: 0,
                  go_detail_count_new: 0,
                  impression_count: 685,
                  impression_count_new: 0,
                  play_count: 69,
                  play_count_new: 0,
                },
                consume_detail: {
                  click_rate: 0.10072992700729927,
                  read_complete_rate: 0,
                  read_duration: 0,
                },
                fans_change_count: 0,
                fans_data: {},
                interaction_data: {},
                ranking_data: {},
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
        const result = await getSingleDataOverview('success', '7304551928460116519', '2023-11-24', '2023-11-29', 2);
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(0);
      });
    });
  });
});

describe.runIf(true)('【真实测试】', () => {
  test('头条号粉丝分析', async () => {
    const cookie =
      '_ga=GA1.1.2119465388.1676854476; store-region-src=uid; _ba=BA0.2-20230505-5110e-TqikTI6Zl4mJSwSAgt3i; store-region=cn-hn; _ga_QEHZPBE5HH=GS1.1.1698117706.2.1.1698117710.0.0.0; n_mh=WfG9P1kPVp0lMf82QiP8dLt12GUsPK36SqbGS_DSRn0; ttcid=bbe641974aa243d6a25b8019c9b695e715; tt_scid=OK0jtQxgEPnCdjpbHht4skitJGfcXItUW4kqMYmL4r..gPy0gQf7IjTagjgwNiwt1995; csrf_session_id=f53d843dd8f9388e8dbd4e22072c64b3; passport_csrf_token=d853b4819a2902d4570aa80f32f05a93; passport_csrf_token_default=d853b4819a2902d4570aa80f32f05a93; s_v_web_id=verify_m2mvqvwc_GRcgSqnq_2JRb_4bxC_AhO4_Cweb1wWTLCnI; ttwid=1%7CB732I93jeIgaWUy9SEHSxNKaNBkXvn4u5bA0o8EZCtc%7C1729748754%7C7cf09750223fe7c17a888418d0073462f2ce4fef119a93b8a2384e32d6e95be2; d_ticket=270c541d4bb495ec51d88a0ed2d608769ae45; sso_auth_status=99debde5bfca38d1f5344f5a38e7f4e4; sso_auth_status_ss=99debde5bfca38d1f5344f5a38e7f4e4; sso_uid_tt=29f73d2597924c42796eaa386b48b763; sso_uid_tt_ss=29f73d2597924c42796eaa386b48b763; toutiao_sso_user=09a71edbc1e633dcf631b4426ddcf1f4; toutiao_sso_user_ss=09a71edbc1e633dcf631b4426ddcf1f4; sid_ucp_sso_v1=1.0.0-KDA4NGVlNDNiMjE3ODFjMDM3MjJmMDgwN2EzMjlkZDAzOGVjMzFiNmQKHwit24DmoYyxBBCovue4BhjPCSAMMKCah5EGOAJA8QcaAmhsIiAwOWE3MWVkYmMxZTYzM2RjZjYzMWI0NDI2ZGRjZjFmNA; ssid_ucp_sso_v1=1.0.0-KDA4NGVlNDNiMjE3ODFjMDM3MjJmMDgwN2EzMjlkZDAzOGVjMzFiNmQKHwit24DmoYyxBBCovue4BhjPCSAMMKCah5EGOAJA8QcaAmhsIiAwOWE3MWVkYmMxZTYzM2RjZjYzMWI0NDI2ZGRjZjFmNA; odin_tt=1fedbcd993a402f9de9c4378073cb67d4c8b7c1c561745f8d207aa634a518a54ef65b0b735fdbdca00efe5ed2c3c0bf282a277052586789b38c6cba4eef6f5a1; passport_auth_status=e4ef94d5f849c7237c16cca97daa2697%2C044b1745ca2a3e58522b9197a6f5a52c; passport_auth_status_ss=e4ef94d5f849c7237c16cca97daa2697%2C044b1745ca2a3e58522b9197a6f5a52c; sid_guard=f3d2cffa584ab30d85f6e8b3642748f2%7C1729748777%7C5184001%7CMon%2C+23-Dec-2024+05%3A46%3A18+GMT; uid_tt=211c827419e0696056ed84aea7e63628; uid_tt_ss=211c827419e0696056ed84aea7e63628; sid_tt=f3d2cffa584ab30d85f6e8b3642748f2; sessionid=f3d2cffa584ab30d85f6e8b3642748f2; sessionid_ss=f3d2cffa584ab30d85f6e8b3642748f2; is_staff_user=false; sid_ucp_v1=1.0.0-KGQ5ZTZmYmM3Nzc5M2U2YTk1NWM5OWJjNmNmMWY0ODIyM2JiODkzZTkKGQit24DmoYyxBBCpvue4BhjPCSAMOAJA8QcaAmxmIiBmM2QyY2ZmYTU4NGFiMzBkODVmNmU4YjM2NDI3NDhmMg; ssid_ucp_v1=1.0.0-KGQ5ZTZmYmM3Nzc5M2U2YTk1NWM5OWJjNmNmMWY0ODIyM2JiODkzZTkKGQit24DmoYyxBBCpvue4BhjPCSAMOAJA8QcaAmxmIiBmM2QyY2ZmYTU4NGFiMzBkODVmNmU4YjM2NDI3NDhmMg; gfkadpd=1231,25897; csrf_session_id=f53d843dd8f9388e8dbd4e22072c64b3';

    const result = await getDataOverviewAsync(cookie, '2024-10-01', '2024-10-30');
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);

  test('头条号作品数据流量分析', async () => {
    const cookie =
      'tt_webid=7278476931607217721; _ga=GA1.1.1952899537.1694652487; passport_csrf_token=372f72462c5a5c674aff3d62ec80c566; sso_uid_tt_ss=6029e8532c46b0c87d029f4286408ada; toutiao_sso_user_ss=4811594b00c7e35f171a6b09d13a5f27; ssid_ucp_sso_v1=1.0.0-KGIwNWJiODQ3YzliYTZhNDBmYWQ2MWQxZWVjZTI2NjZhNzJjZDJiZTIKHQiZ8t_43AIQqp7XqQYY9hcgDDC_ssDUBTgCQPEHGgJobCIgNDgxMTU5NGIwMGM3ZTM1ZjE3MWE2YjA5ZDEzYTVmMjc; uid_tt_ss=6029e8532c46b0c87d029f4286408ada; sessionid_ss=4811594b00c7e35f171a6b09d13a5f27; odin_tt=e691c699ebebe86259c5dc04d7e94a2e2fe0af57d362199c29201e1a304307da2450498f8378486c904e6c596fbef456; _ga_QEHZPBE5HH=GS1.1.1698722721.3.1.1698722731.0.0.0; s_v_web_id=verify_lodsdw4i_tagYD9cY_jY7u_4vIW_BLHm_Twj4qRJ8tJPr; csrf_session_id=40071ac948953dd5f070796d17acd4fe; ttwid=1%7CTs4IVIuTKwndep8x1NcxA0yINuSxsw1yUtOrNg_EuVI%7C1701339916%7C4653f70670dbb67624898654d47c7ebb938c3b777f59fcf8e44921cfab36ff26';

    const result = await getDataOverviewFansAsync(cookie, '2023-10-01', '2023-10-30');
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);

  test('头条号单篇作品统计分析', async () => {
    const cookie =
      'tt_webid=7278476931607217721; _ga=GA1.1.1952899537.1694652487; passport_csrf_token=372f72462c5a5c674aff3d62ec80c566; sso_uid_tt_ss=6029e8532c46b0c87d029f4286408ada; toutiao_sso_user_ss=4811594b00c7e35f171a6b09d13a5f27; ssid_ucp_sso_v1=1.0.0-KGIwNWJiODQ3YzliYTZhNDBmYWQ2MWQxZWVjZTI2NjZhNzJjZDJiZTIKHQiZ8t_43AIQqp7XqQYY9hcgDDC_ssDUBTgCQPEHGgJobCIgNDgxMTU5NGIwMGM3ZTM1ZjE3MWE2YjA5ZDEzYTVmMjc; uid_tt_ss=6029e8532c46b0c87d029f4286408ada; sessionid_ss=4811594b00c7e35f171a6b09d13a5f27; odin_tt=e691c699ebebe86259c5dc04d7e94a2e2fe0af57d362199c29201e1a304307da2450498f8378486c904e6c596fbef456; _ga_QEHZPBE5HH=GS1.1.1698722721.3.1.1698722731.0.0.0; s_v_web_id=verify_lodsdw4i_tagYD9cY_jY7u_4vIW_BLHm_Twj4qRJ8tJPr; csrf_session_id=40071ac948953dd5f070796d17acd4fe; ttwid=1%7CTs4IVIuTKwndep8x1NcxA0yINuSxsw1yUtOrNg_EuVI%7C1701339916%7C4653f70670dbb67624898654d47c7ebb938c3b777f59fcf8e44921cfab36ff26';

    const result = await getSingleDataOverviewStatisticAsync(cookie, '7304551928460116519', 2);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
    expect(result.item_data.create_time).toBe(1700723527);
  }, 10000000);

  test('头条号单篇作品报表分析', async () => {
    const cookie =
      'tt_webid=7278476931607217721; _ga=GA1.1.1952899537.1694652487; passport_csrf_token=372f72462c5a5c674aff3d62ec80c566; sso_uid_tt_ss=6029e8532c46b0c87d029f4286408ada; toutiao_sso_user_ss=4811594b00c7e35f171a6b09d13a5f27; ssid_ucp_sso_v1=1.0.0-KGIwNWJiODQ3YzliYTZhNDBmYWQ2MWQxZWVjZTI2NjZhNzJjZDJiZTIKHQiZ8t_43AIQqp7XqQYY9hcgDDC_ssDUBTgCQPEHGgJobCIgNDgxMTU5NGIwMGM3ZTM1ZjE3MWE2YjA5ZDEzYTVmMjc; uid_tt_ss=6029e8532c46b0c87d029f4286408ada; sessionid_ss=4811594b00c7e35f171a6b09d13a5f27; odin_tt=e691c699ebebe86259c5dc04d7e94a2e2fe0af57d362199c29201e1a304307da2450498f8378486c904e6c596fbef456; _ga_QEHZPBE5HH=GS1.1.1698722721.3.1.1698722731.0.0.0; s_v_web_id=verify_lodsdw4i_tagYD9cY_jY7u_4vIW_BLHm_Twj4qRJ8tJPr; csrf_session_id=40071ac948953dd5f070796d17acd4fe; ttwid=1%7CTs4IVIuTKwndep8x1NcxA0yINuSxsw1yUtOrNg_EuVI%7C1701339916%7C4653f70670dbb67624898654d47c7ebb938c3b777f59fcf8e44921cfab36ff26';

    const result = await getSingleDataOverview(cookie, '7304551928460116519', '2023-11-24', '2023-11-29', 2);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
    expect(result.daily_stats).length(6);
  }, 10000000);
});
