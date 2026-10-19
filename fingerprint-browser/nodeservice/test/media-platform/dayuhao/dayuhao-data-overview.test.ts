import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import {
  getDataOverviewAsync,
  getDayuhaoDataOverviewFansAsync,
  getDayuhaoDataOverviewFansStatisticAsync,
  getDayuhaoDataOverviewIncomeAsync,
} from '@/media-platform/dayuhao/dayuhao-data-overview.service';

describe('【Mock】', () => {
  describe('获取大鱼号作品报表', () => {
    const server = setupServer(
      rest.get('https://mp.dayu.com*/dashboard/getNewContentList', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              data: [
                {
                  date: '20231113',
                  date_published: true,
                  show_pv: 0,
                  read_pv: 1,
                  video_vv: 0,
                  like_pv: 0,
                  comment_pv: 0,
                  share_pv: 0,
                  fav_pv: 0,
                  fans_read_pv: 0,
                  fans_video_vv: 0,
                  total_follow_uv: 0,
                  ds: 60693339,
                },
                {
                  date: '20231112',
                  date_published: true,
                  show_pv: 0,
                  read_pv: 1,
                  video_vv: 0,
                  like_pv: 0,
                  comment_pv: 0,
                  share_pv: 0,
                  fav_pv: 0,
                  fans_read_pv: 0,
                  fans_video_vv: 0,
                  total_follow_uv: 0,
                  ds: 60693336,
                },
                {
                  date: '20231111',
                  date_published: true,
                  show_pv: 0,
                  read_pv: 0,
                  video_vv: 2,
                  like_pv: 0,
                  comment_pv: 0,
                  share_pv: 0,
                  fav_pv: 0,
                  fans_read_pv: 0,
                  fans_video_vv: 0,
                  total_follow_uv: 0,
                  ds: 60693333,
                },
                {
                  date: '20231110',
                  date_published: true,
                  show_pv: 0,
                  read_pv: 0,
                  video_vv: 0,
                  like_pv: 0,
                  comment_pv: 0,
                  share_pv: 0,
                  fav_pv: 0,
                  fans_read_pv: 0,
                  fans_video_vv: 0,
                  total_follow_uv: 0,
                  ds: 60693330,
                },
                {
                  date: '20231109',
                  date_published: true,
                  show_pv: 0,
                  read_pv: 0,
                  video_vv: 0,
                  like_pv: 0,
                  comment_pv: 0,
                  share_pv: 0,
                  fav_pv: 0,
                  fans_read_pv: 0,
                  fans_video_vv: 0,
                  total_follow_uv: 0,
                  ds: 60693327,
                },
                {
                  date: '20231108',
                  date_published: true,
                  show_pv: 13,
                  read_pv: 1,
                  video_vv: 0,
                  like_pv: 0,
                  comment_pv: 0,
                  share_pv: 0,
                  fav_pv: 0,
                  fans_read_pv: 0,
                  fans_video_vv: 0,
                  total_follow_uv: 0,
                  ds: 60693324,
                },
                {
                  date: '20231107',
                  date_published: true,
                  show_pv: 909,
                  read_pv: 18,
                  video_vv: 0,
                  like_pv: 0,
                  comment_pv: 0,
                  share_pv: 0,
                  fav_pv: 0,
                  fans_read_pv: 0,
                  fans_video_vv: 0,
                  total_follow_uv: 0,
                  ds: 60693321,
                },
                {
                  date: '20231106',
                  date_published: true,
                  show_pv: 5199,
                  read_pv: 61,
                  video_vv: 0,
                  like_pv: 0,
                  comment_pv: 1,
                  share_pv: 0,
                  fav_pv: 0,
                  fans_read_pv: 0,
                  fans_video_vv: 0,
                  total_follow_uv: 0,
                  ds: 60693318,
                },
                {
                  date: '20231105',
                  date_published: true,
                  show_pv: 0,
                  read_pv: 2,
                  video_vv: 0,
                  like_pv: 0,
                  comment_pv: 0,
                  share_pv: 0,
                  fav_pv: 0,
                  fans_read_pv: 0,
                  fans_video_vv: 0,
                  total_follow_uv: 0,
                  ds: 60693315,
                },
                {
                  date: '20231104',
                  date_published: true,
                  show_pv: 0,
                  read_pv: 0,
                  video_vv: 0,
                  like_pv: 0,
                  comment_pv: 0,
                  share_pv: 0,
                  fav_pv: 0,
                  fans_read_pv: 0,
                  fans_video_vv: 0,
                  total_follow_uv: 0,
                  ds: 60693312,
                },
                {
                  date: '20231103',
                  date_published: true,
                  show_pv: 44,
                  read_pv: 0,
                  video_vv: 22,
                  like_pv: 0,
                  comment_pv: 0,
                  share_pv: 0,
                  fav_pv: 0,
                  fans_read_pv: 0,
                  fans_video_vv: 0,
                  total_follow_uv: 0,
                  ds: 60693309,
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
        const result = await getDataOverviewAsync('success', '', 'all');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.data).length(11);
      });
    });
  });

  describe('获取大鱼号粉丝报表列表', () => {
    const server = setupServer(
      rest.get('https://mp.dayu.com*/api/stat/user/fans/daylist_uc_v2', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              data: {
                list: [
                  {
                    ds: '20231114',
                    date: '2023-11-14',
                    follow_increase: 0,
                  },
                  {
                    ds: '20231113',
                    date: '2023-11-13',
                    follow_increase: 0,
                  },
                  {
                    ds: '20231112',
                    date: '2023-11-12',
                    follow_increase: 0,
                  },
                  {
                    ds: '20231111',
                    date: '2023-11-11',
                    follow_increase: 0,
                  },
                  {
                    ds: '20231110',
                    date: '2023-11-10',
                    follow_increase: 0,
                  },
                  {
                    ds: '20231109',
                    date: '2023-11-09',
                    follow_increase: 0,
                  },
                  {
                    ds: '20231108',
                    date: '2023-11-08',
                    follow_increase: 0,
                  },
                  {
                    ds: '20231107',
                    date: '2023-11-07',
                    follow_increase: 0,
                  },
                  {
                    ds: '20231106',
                    date: '2023-11-06',
                    follow_increase: 0,
                  },
                  {
                    ds: '20231105',
                    date: '2023-11-05',
                    follow_increase: 0,
                  },
                  {
                    ds: '20231104',
                    date: '2023-11-04',
                    follow_increase: 0,
                  },
                  {
                    ds: '20231103',
                    date: '2023-11-03',
                    follow_increase: 0,
                  },
                  {
                    ds: '20231102',
                    date: '2023-11-02',
                    follow_increase: 0,
                  },
                  {
                    ds: '20231101',
                    date: '2023-11-01',
                    follow_increase: 0,
                  },
                  {
                    ds: '20231031',
                    date: '2023-10-31',
                    follow_increase: 0,
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
        const result = await getDayuhaoDataOverviewFansAsync('success', '', '');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.data).length(15);
      });
    });
  });

  describe('获取大鱼号粉丝核心数据', () => {
    const server = setupServer(
      rest.get('https://mp.dayu.com*/api/stat/user/fans/summary_uc_v2', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              data: [
                {
                  value: '--',
                  text: '累计粉丝数',
                },
                {
                  value: '--',
                  text: '新增粉丝数',
                },
                {
                  value: '--',
                  text: '取消关注数',
                },
                {
                  text: '净增粉丝数',
                  value: 0,
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
        const result = await getDayuhaoDataOverviewFansStatisticAsync('success');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.data).length(4);
      });
    });
  });

  describe('获取大鱼号粉丝收益数据', () => {
    const server = setupServer(
      rest.get('https://mp.dayu.com*/dashboard/unifiedSettlement/getJournals', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              data: [
                {
                  id: 10169736,
                  sn: '20220910152807609080',
                  apply_date: 20220910,
                  app_id: 1,
                  app_user_id: '9dd14278b7814534ae9bad91ab8d1d76',
                  user_name: '光着屁股的秋葵',
                  inout: 1,
                  action: 1,
                  result: 1,
                  pretax_amount: 1,
                  tax_amount: 0,
                  aftertax_amount: 1,
                  previous_balance: 0,
                  next_balance: 1,
                  memo: '{"biz_id":1,"entry_id":6,"type":1,"bulk_id":202208,"returned":false,"tax_type":1,"royalty_fee_pretax_amount":"1.00","earned_income_pretax_amount":"0","writer_payment_pretax_amount":"0","no_tax_amount":"0"}',
                  status: 1,
                  created_at: '2022-09-10 15:28:07',
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
        const result = await getDayuhaoDataOverviewIncomeAsync('success');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.data).length(1);
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('获取大鱼号作品报表', async () => {
    const cookie =
      'cna=cLmZHS8x8HUCAdzK6KvT+DDo; _UP_A4A_11_=wb9051252d0048d4bf67e9d3f7ebc5a3; _UP_335_2B_=1; _pk_id.0044d54c18eb.bb64=cfbfbec8-fc95-4cef-8eaa-b610b5675290.1695795359.1.1695795359.1695795359.; _pk_id.0044d54c18eb.bb64=cfbfbec8-fc95-4cef-8eaa-b610b5675290.1695795359.1.1695795359.1695795359.; xlly_s=1; _UP_D_=pc; _UP_30C_6A_=st9076201dar8fd8iy5dl3l3mpvg8f1k; _UP_TS_=sg15e636e9659842608c7edd24f22f1231e; _UP_E37_B7_=sg15e636e9659842608c7edd24f22f1231e; _UP_TG_=st9076201dar8fd8iy5dl3l3mpvg8f1k; USER_TMP=uEyJWRKhpWGHgX8JwBWypg.T_7-DdhAfrG-2O26hhcCAGk_cdffD7OkrLEJqzhRCB6SQ5Ud3glmtkBQJ6UIZOV7K-vNg7wZFNPlymThprji3q3xpGYUTo2t2Mj8FY-HMXFVGFaqyEZLIKIjmM2_O81E6pOpDqgrclnAWUt52yTFxYktFttdqD4qXJZe1Zd43zEkmvj-3B9ho1-mbV0owp0g_aUn0xqbHBl2AukEv2YaSGzBys61VbQTGGHCSjTOuN64vtJN4cg_Rj0ZwygWFSza0YfeGiesFUEZ1kfXCEcd-CpMFpfbEdAS8wnK4e0zlU6fA12PEHAj4DD436_-ZEcEoSkH6Z8Kp4MYlFmrUlXnHSLMKNlW5_AkeqAGep9zVTjKh6ie14dFselrmKlzRxzqR7fQGwG1ZdhIsz0eAvT0GjF8-oQqXtMzzs9F50NkOsB2n0uPsfPhlybRHztU-nH2jpe6JKTUw72RI3GRkswqJKV_jO7ixnTfWrsHpGpBiosA_UStIcC7X8deNjFpXUX0jUSyv5_rWU0bn4MgVZ6GWVQ-51BcFBQ_bGtqmsc4u-nwo6xde5Bb3lwH7nzMsxvf8pfNweROqFasXXEiXhWkQzutIHgTSOZXgDXkDGnDcu_PWQBl08og8ZVU-afODGjzI8686JPEnPtuJ6YCpC53ApKH-3xn5pSiEudlnkDeMCdNCs-Vl-xWD6e4NZm51niIC-eazycMEfghFOR5s76RO_CYaUC9PJi0ypDtuIElQriSgfqkSTB59kEXZp9c4atGm3K3WJ3SYviDhNR2PkdcYQPBQXBT_YCHa7sUcCn25WoJeiSEQHDR5UqFY-il1Dkf4GDoJ8wn2IPjkbiKUwYeavRCxtiD3Jw5sUHfZobY5TPZdwPwZvmMUR6uGW7aJ1XOsP6DTzwrYonUaegLnrMG8n3p_48_GkLRHMmtM61fofHfaP0lOT1J3pFE3Zg_KN0KamNs_8y81hZIfeSJ1nZzsPf9y3-rVz13kemcutbhIvABwB4z44ft9JgKz1cRebSnPexqNr6EDYxYq9QSDO3y4viFK8EU9zcdXyga2iN-Z5jAROvAC8MfodK6nLOsTfMPThkgP0OiUu8wpz6I_9ILo91YwSC2PR2eRTnR32NMqIor4Go07fngn6RYh_8yMxPf8YnnI7YRwtajWOO3G9p0QSnKaWsrOZZWBBERXyukYWA.1699952630765.604800000.Xatney5lcZt_i3meQathq-VoserQEKHkT2f7LlkMtuM; tfstk=dcq9mJGuB6fM3vtTUCQhg8YewsBhZleN95yWmjcMlWFLt-gbmN8McyFbTVc1gNlXHSFFQxfqfm3bU5EimOo6GqNgFPVY3OkjGSNxiPbhqRyZ0m1oDgbuQuAbNp6k0QEKimofZ_YHcVS-07KqCsItQn1yS9tgjyH1oL1WfIGWOY3tNJQycnKoQQc8Cv-XcXDOQuEu2CgDZbHD59BpuEusLi93oJ1..; isg=BERENrFw_WPpvklv3TzKih6FFcI2XWjHl1kTJV7lco_SieVThm1dVr1oySFRlqAf';

    const result = await getDataOverviewAsync(cookie, '20231103', '20231113');
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.data).length(11);
  }, 10000000);

  test('获取大鱼号粉丝报表列表', async () => {
    const cookie =
      'cna=cLmZHS8x8HUCAdzK6KvT+DDo; _UP_A4A_11_=wb9051252d0048d4bf67e9d3f7ebc5a3; _UP_335_2B_=1; _pk_id.0044d54c18eb.bb64=cfbfbec8-fc95-4cef-8eaa-b610b5675290.1695795359.1.1695795359.1695795359.; _pk_id.0044d54c18eb.bb64=cfbfbec8-fc95-4cef-8eaa-b610b5675290.1695795359.1.1695795359.1695795359.; xlly_s=1; _UP_D_=pc; _UP_30C_6A_=st9076201dar8fd8iy5dl3l3mpvg8f1k; _UP_TS_=sg15e636e9659842608c7edd24f22f1231e; _UP_E37_B7_=sg15e636e9659842608c7edd24f22f1231e; _UP_TG_=st9076201dar8fd8iy5dl3l3mpvg8f1k; USER_TMP=uEyJWRKhpWGHgX8JwBWypg.T_7-DdhAfrG-2O26hhcCAGk_cdffD7OkrLEJqzhRCB6SQ5Ud3glmtkBQJ6UIZOV7K-vNg7wZFNPlymThprji3q3xpGYUTo2t2Mj8FY-HMXFVGFaqyEZLIKIjmM2_O81E6pOpDqgrclnAWUt52yTFxYktFttdqD4qXJZe1Zd43zEkmvj-3B9ho1-mbV0owp0g_aUn0xqbHBl2AukEv2YaSGzBys61VbQTGGHCSjTOuN64vtJN4cg_Rj0ZwygWFSza0YfeGiesFUEZ1kfXCEcd-CpMFpfbEdAS8wnK4e0zlU6fA12PEHAj4DD436_-ZEcEoSkH6Z8Kp4MYlFmrUlXnHSLMKNlW5_AkeqAGep9zVTjKh6ie14dFselrmKlzRxzqR7fQGwG1ZdhIsz0eAvT0GjF8-oQqXtMzzs9F50NkOsB2n0uPsfPhlybRHztU-nH2jpe6JKTUw72RI3GRkswqJKV_jO7ixnTfWrsHpGpBiosA_UStIcC7X8deNjFpXUX0jUSyv5_rWU0bn4MgVZ6GWVQ-51BcFBQ_bGtqmsc4u-nwo6xde5Bb3lwH7nzMsxvf8pfNweROqFasXXEiXhWkQzutIHgTSOZXgDXkDGnDcu_PWQBl08og8ZVU-afODGjzI8686JPEnPtuJ6YCpC53ApKH-3xn5pSiEudlnkDeMCdNCs-Vl-xWD6e4NZm51niIC-eazycMEfghFOR5s76RO_CYaUC9PJi0ypDtuIElQriSgfqkSTB59kEXZp9c4atGm3K3WJ3SYviDhNR2PkdcYQPBQXBT_YCHa7sUcCn25WoJeiSEQHDR5UqFY-il1Dkf4GDoJ8wn2IPjkbiKUwYeavRCxtiD3Jw5sUHfZobY5TPZdwPwZvmMUR6uGW7aJ1XOsP6DTzwrYonUaegLnrMG8n3p_48_GkLRHMmtM61fofHfaP0lOT1J3pFE3Zg_KN0KamNs_8y81hZIfeSJ1nZzsPf9y3-rVz13kemcutbhIvABwB4z44ft9JgKz1cRebSnPexqNr6EDYxYq9QSDO3y4viFK8EU9zcdXyga2iN-Z5jAROvAC8MfodK6nLOsTfMPThkgP0OiUu8wpz6I_9ILo91YwSC2PR2eRTnR32NMqIor4Go07fngn6RYh_8yMxPf8YnnI7YRwtajWOO3G9p0QSnKaWsrOZZWBBERXyukYWA.1699952630765.604800000.Xatney5lcZt_i3meQathq-VoserQEKHkT2f7LlkMtuM; tfstk=dcq9mJGuB6fM3vtTUCQhg8YewsBhZleN95yWmjcMlWFLt-gbmN8McyFbTVc1gNlXHSFFQxfqfm3bU5EimOo6GqNgFPVY3OkjGSNxiPbhqRyZ0m1oDgbuQuAbNp6k0QEKimofZ_YHcVS-07KqCsItQn1yS9tgjyH1oL1WfIGWOY3tNJQycnKoQQc8Cv-XcXDOQuEu2CgDZbHD59BpuEusLi93oJ1..; isg=BERENrFw_WPpvklv3TzKih6FFcI2XWjHl1kTJV7lco_SieVThm1dVr1oySFRlqAf';

    const result = await getDayuhaoDataOverviewFansAsync(cookie, '2023-10-31', '2023-11-14');
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.data.list).length(15);
  }, 10000000);

  test('获取大鱼号粉丝核心数据', async () => {
    const cookie =
      'cna=cLmZHS8x8HUCAdzK6KvT+DDo; _UP_A4A_11_=wb9051252d0048d4bf67e9d3f7ebc5a3; _UP_335_2B_=1; _pk_id.0044d54c18eb.bb64=cfbfbec8-fc95-4cef-8eaa-b610b5675290.1695795359.1.1695795359.1695795359.; _pk_id.0044d54c18eb.bb64=cfbfbec8-fc95-4cef-8eaa-b610b5675290.1695795359.1.1695795359.1695795359.; xlly_s=1; _UP_D_=pc; _UP_30C_6A_=st9076201dar8fd8iy5dl3l3mpvg8f1k; _UP_TS_=sg15e636e9659842608c7edd24f22f1231e; _UP_E37_B7_=sg15e636e9659842608c7edd24f22f1231e; _UP_TG_=st9076201dar8fd8iy5dl3l3mpvg8f1k; USER_TMP=uEyJWRKhpWGHgX8JwBWypg.T_7-DdhAfrG-2O26hhcCAGk_cdffD7OkrLEJqzhRCB6SQ5Ud3glmtkBQJ6UIZOV7K-vNg7wZFNPlymThprji3q3xpGYUTo2t2Mj8FY-HMXFVGFaqyEZLIKIjmM2_O81E6pOpDqgrclnAWUt52yTFxYktFttdqD4qXJZe1Zd43zEkmvj-3B9ho1-mbV0owp0g_aUn0xqbHBl2AukEv2YaSGzBys61VbQTGGHCSjTOuN64vtJN4cg_Rj0ZwygWFSza0YfeGiesFUEZ1kfXCEcd-CpMFpfbEdAS8wnK4e0zlU6fA12PEHAj4DD436_-ZEcEoSkH6Z8Kp4MYlFmrUlXnHSLMKNlW5_AkeqAGep9zVTjKh6ie14dFselrmKlzRxzqR7fQGwG1ZdhIsz0eAvT0GjF8-oQqXtMzzs9F50NkOsB2n0uPsfPhlybRHztU-nH2jpe6JKTUw72RI3GRkswqJKV_jO7ixnTfWrsHpGpBiosA_UStIcC7X8deNjFpXUX0jUSyv5_rWU0bn4MgVZ6GWVQ-51BcFBQ_bGtqmsc4u-nwo6xde5Bb3lwH7nzMsxvf8pfNweROqFasXXEiXhWkQzutIHgTSOZXgDXkDGnDcu_PWQBl08og8ZVU-afODGjzI8686JPEnPtuJ6YCpC53ApKH-3xn5pSiEudlnkDeMCdNCs-Vl-xWD6e4NZm51niIC-eazycMEfghFOR5s76RO_CYaUC9PJi0ypDtuIElQriSgfqkSTB59kEXZp9c4atGm3K3WJ3SYviDhNR2PkdcYQPBQXBT_YCHa7sUcCn25WoJeiSEQHDR5UqFY-il1Dkf4GDoJ8wn2IPjkbiKUwYeavRCxtiD3Jw5sUHfZobY5TPZdwPwZvmMUR6uGW7aJ1XOsP6DTzwrYonUaegLnrMG8n3p_48_GkLRHMmtM61fofHfaP0lOT1J3pFE3Zg_KN0KamNs_8y81hZIfeSJ1nZzsPf9y3-rVz13kemcutbhIvABwB4z44ft9JgKz1cRebSnPexqNr6EDYxYq9QSDO3y4viFK8EU9zcdXyga2iN-Z5jAROvAC8MfodK6nLOsTfMPThkgP0OiUu8wpz6I_9ILo91YwSC2PR2eRTnR32NMqIor4Go07fngn6RYh_8yMxPf8YnnI7YRwtajWOO3G9p0QSnKaWsrOZZWBBERXyukYWA.1699952630765.604800000.Xatney5lcZt_i3meQathq-VoserQEKHkT2f7LlkMtuM; tfstk=dcq9mJGuB6fM3vtTUCQhg8YewsBhZleN95yWmjcMlWFLt-gbmN8McyFbTVc1gNlXHSFFQxfqfm3bU5EimOo6GqNgFPVY3OkjGSNxiPbhqRyZ0m1oDgbuQuAbNp6k0QEKimofZ_YHcVS-07KqCsItQn1yS9tgjyH1oL1WfIGWOY3tNJQycnKoQQc8Cv-XcXDOQuEu2CgDZbHD59BpuEusLi93oJ1..; isg=BERENrFw_WPpvklv3TzKih6FFcI2XWjHl1kTJV7lco_SieVThm1dVr1oySFRlqAf';

    const result = await getDayuhaoDataOverviewFansStatisticAsync(cookie);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.data).length(4);
  }, 10000000);

  test('获取大鱼号粉丝收益数据', async () => {
    const cookie =
      'cna=cLmZHS8x8HUCAdzK6KvT+DDo; _UP_A4A_11_=wb9051252d0048d4bf67e9d3f7ebc5a3; _UP_335_2B_=1; _pk_id.0044d54c18eb.bb64=cfbfbec8-fc95-4cef-8eaa-b610b5675290.1695795359.1.1695795359.1695795359.; _pk_id.0044d54c18eb.bb64=cfbfbec8-fc95-4cef-8eaa-b610b5675290.1695795359.1.1695795359.1695795359.; xlly_s=1; _UP_D_=pc; _UP_30C_6A_=st9076201dar8fd8iy5dl3l3mpvg8f1k; _UP_TS_=sg15e636e9659842608c7edd24f22f1231e; _UP_E37_B7_=sg15e636e9659842608c7edd24f22f1231e; _UP_TG_=st9076201dar8fd8iy5dl3l3mpvg8f1k; USER_TMP=uEyJWRKhpWGHgX8JwBWypg.T_7-DdhAfrG-2O26hhcCAGk_cdffD7OkrLEJqzhRCB6SQ5Ud3glmtkBQJ6UIZOV7K-vNg7wZFNPlymThprji3q3xpGYUTo2t2Mj8FY-HMXFVGFaqyEZLIKIjmM2_O81E6pOpDqgrclnAWUt52yTFxYktFttdqD4qXJZe1Zd43zEkmvj-3B9ho1-mbV0owp0g_aUn0xqbHBl2AukEv2YaSGzBys61VbQTGGHCSjTOuN64vtJN4cg_Rj0ZwygWFSza0YfeGiesFUEZ1kfXCEcd-CpMFpfbEdAS8wnK4e0zlU6fA12PEHAj4DD436_-ZEcEoSkH6Z8Kp4MYlFmrUlXnHSLMKNlW5_AkeqAGep9zVTjKh6ie14dFselrmKlzRxzqR7fQGwG1ZdhIsz0eAvT0GjF8-oQqXtMzzs9F50NkOsB2n0uPsfPhlybRHztU-nH2jpe6JKTUw72RI3GRkswqJKV_jO7ixnTfWrsHpGpBiosA_UStIcC7X8deNjFpXUX0jUSyv5_rWU0bn4MgVZ6GWVQ-51BcFBQ_bGtqmsc4u-nwo6xde5Bb3lwH7nzMsxvf8pfNweROqFasXXEiXhWkQzutIHgTSOZXgDXkDGnDcu_PWQBl08og8ZVU-afODGjzI8686JPEnPtuJ6YCpC53ApKH-3xn5pSiEudlnkDeMCdNCs-Vl-xWD6e4NZm51niIC-eazycMEfghFOR5s76RO_CYaUC9PJi0ypDtuIElQriSgfqkSTB59kEXZp9c4atGm3K3WJ3SYviDhNR2PkdcYQPBQXBT_YCHa7sUcCn25WoJeiSEQHDR5UqFY-il1Dkf4GDoJ8wn2IPjkbiKUwYeavRCxtiD3Jw5sUHfZobY5TPZdwPwZvmMUR6uGW7aJ1XOsP6DTzwrYonUaegLnrMG8n3p_48_GkLRHMmtM61fofHfaP0lOT1J3pFE3Zg_KN0KamNs_8y81hZIfeSJ1nZzsPf9y3-rVz13kemcutbhIvABwB4z44ft9JgKz1cRebSnPexqNr6EDYxYq9QSDO3y4viFK8EU9zcdXyga2iN-Z5jAROvAC8MfodK6nLOsTfMPThkgP0OiUu8wpz6I_9ILo91YwSC2PR2eRTnR32NMqIor4Go07fngn6RYh_8yMxPf8YnnI7YRwtajWOO3G9p0QSnKaWsrOZZWBBERXyukYWA.1699952630765.604800000.Xatney5lcZt_i3meQathq-VoserQEKHkT2f7LlkMtuM; tfstk=dcq9mJGuB6fM3vtTUCQhg8YewsBhZleN95yWmjcMlWFLt-gbmN8McyFbTVc1gNlXHSFFQxfqfm3bU5EimOo6GqNgFPVY3OkjGSNxiPbhqRyZ0m1oDgbuQuAbNp6k0QEKimofZ_YHcVS-07KqCsItQn1yS9tgjyH1oL1WfIGWOY3tNJQycnKoQQc8Cv-XcXDOQuEu2CgDZbHD59BpuEusLi93oJ1..; isg=BERENrFw_WPpvklv3TzKih6FFcI2XWjHl1kTJV7lco_SieVThm1dVr1oySFRlqAf';

    const result = await getDayuhaoDataOverviewIncomeAsync(cookie);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});
