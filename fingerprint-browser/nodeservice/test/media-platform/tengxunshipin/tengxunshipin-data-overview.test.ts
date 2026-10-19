import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import {
  getDataOverviewAsync,
  getIncomeInfoListAsync,
} from '@/media-platform/tengxunshipin/tengxunshipin-data-overview.service';

describe('【Mock】', () => {
  describe('获取腾讯视频数据分析', () => {
    const server = setupServer(
      rest.get('https://access.v.qq.com*/trpc.creator_center.data_center.data_center/GetTrend', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 0,
              msg: '',
              data: {
                columns: [
                  {
                    name: 'in_binge_uv',
                    cname: '在追总人数',
                  },
                  {
                    name: 'in_subscribe_cnt',
                    cname: '粉丝数',
                  },
                  {
                    name: 'in_anti_vfinish_cnt',
                    cname: '播放量',
                  },
                  {
                    name: 'in_like_cnt',
                    cname: '获赞数',
                  },
                  {
                    name: 'in_comment_cnt',
                    cname: '评论数',
                  },
                  {
                    name: 'in_jitui_income_num',
                    cname: '鸡腿数',
                  },
                ],
                groups: [
                  {
                    name: 'play',
                    cname: '播放数据',
                    columns: ['in_anti_vfinish_cnt'],
                  },
                  {
                    name: 'interaction',
                    cname: '互动数据',
                    columns: [
                      'in_subscribe_cnt',
                      'in_like_cnt',
                      'in_comment_cnt',
                      'in_jitui_income_num',
                      'in_binge_uv',
                    ],
                  },
                ],
                data: [
                  {
                    data: {
                      date: '2023-11-15',
                      in_anti_vfinish_cnt: '0',
                      in_binge_uv: '0',
                      in_comment_cnt: '0',
                      in_jitui_income_num: '0',
                      in_like_cnt: '0',
                      in_subscribe_cnt: '0',
                    },
                  },
                  {
                    data: {
                      date: '2023-11-14',
                      in_anti_vfinish_cnt: '2',
                      in_binge_uv: '0',
                      in_comment_cnt: '0',
                      in_jitui_income_num: '0',
                      in_like_cnt: '0',
                      in_subscribe_cnt: '0',
                    },
                  },
                  {
                    data: {
                      date: '2023-11-13',
                      in_anti_vfinish_cnt: '6',
                      in_binge_uv: '0',
                      in_comment_cnt: '0',
                      in_jitui_income_num: '0',
                      in_like_cnt: '0',
                      in_subscribe_cnt: '0',
                    },
                  },
                  {
                    data: {
                      date: '2023-11-12',
                      in_anti_vfinish_cnt: '3',
                      in_binge_uv: '0',
                      in_comment_cnt: '0',
                      in_jitui_income_num: '0',
                      in_like_cnt: '0',
                      in_subscribe_cnt: '0',
                    },
                  },
                  {
                    data: {
                      date: '2023-11-11',
                      in_anti_vfinish_cnt: '8',
                      in_binge_uv: '0',
                      in_comment_cnt: '0',
                      in_jitui_income_num: '0',
                      in_like_cnt: '0',
                      in_subscribe_cnt: '0',
                    },
                  },
                  {
                    data: {
                      date: '2023-11-10',
                      in_anti_vfinish_cnt: '5',
                      in_binge_uv: '0',
                      in_comment_cnt: '0',
                      in_jitui_income_num: '0',
                      in_like_cnt: '0',
                      in_subscribe_cnt: '0',
                    },
                  },
                  {
                    data: {
                      date: '2023-11-09',
                      in_anti_vfinish_cnt: '0',
                      in_binge_uv: '0',
                      in_comment_cnt: '0',
                      in_jitui_income_num: '0',
                      in_like_cnt: '0',
                      in_subscribe_cnt: '0',
                    },
                  },
                  {
                    data: {
                      date: '2023-11-08',
                      in_anti_vfinish_cnt: '5',
                      in_binge_uv: '0',
                      in_comment_cnt: '0',
                      in_jitui_income_num: '0',
                      in_like_cnt: '0',
                      in_subscribe_cnt: '0',
                    },
                  },
                  {
                    data: {
                      date: '2023-11-07',
                      in_anti_vfinish_cnt: '2',
                      in_binge_uv: '0',
                      in_comment_cnt: '0',
                      in_jitui_income_num: '0',
                      in_like_cnt: '0',
                      in_subscribe_cnt: '0',
                    },
                  },
                  {
                    data: {
                      date: '2023-11-06',
                      in_anti_vfinish_cnt: '2',
                      in_binge_uv: '0',
                      in_comment_cnt: '0',
                      in_jitui_income_num: '0',
                      in_like_cnt: '0',
                      in_subscribe_cnt: '0',
                    },
                  },
                  {
                    data: {
                      date: '2023-11-05',
                      in_anti_vfinish_cnt: '1',
                      in_binge_uv: '0',
                      in_comment_cnt: '0',
                      in_jitui_income_num: '0',
                      in_like_cnt: '0',
                      in_subscribe_cnt: '0',
                    },
                  },
                  {
                    data: {
                      date: '2023-11-04',
                      in_anti_vfinish_cnt: '6',
                      in_binge_uv: '0',
                      in_comment_cnt: '0',
                      in_jitui_income_num: '0',
                      in_like_cnt: '0',
                      in_subscribe_cnt: '0',
                    },
                  },
                  {
                    data: {
                      date: '2023-11-03',
                      in_anti_vfinish_cnt: '6',
                      in_binge_uv: '0',
                      in_comment_cnt: '0',
                      in_jitui_income_num: '0',
                      in_like_cnt: '0',
                      in_subscribe_cnt: '0',
                    },
                  },
                  {
                    data: {
                      date: '2023-11-02',
                      in_anti_vfinish_cnt: '6',
                      in_binge_uv: '0',
                      in_comment_cnt: '0',
                      in_jitui_income_num: '0',
                      in_like_cnt: '0',
                      in_subscribe_cnt: '0',
                    },
                  },
                  {
                    data: {
                      date: '2023-11-01',
                      in_anti_vfinish_cnt: '9',
                      in_binge_uv: '0',
                      in_comment_cnt: '0',
                      in_jitui_income_num: '0',
                      in_like_cnt: '0',
                      in_subscribe_cnt: '0',
                    },
                  },
                  {
                    data: {
                      date: '2023-10-31',
                      in_anti_vfinish_cnt: '2',
                      in_binge_uv: '0',
                      in_comment_cnt: '0',
                      in_jitui_income_num: '0',
                      in_like_cnt: '0',
                      in_subscribe_cnt: '0',
                    },
                  },
                  {
                    data: {
                      date: '2023-10-30',
                      in_anti_vfinish_cnt: '2',
                      in_binge_uv: '0',
                      in_comment_cnt: '0',
                      in_jitui_income_num: '0',
                      in_like_cnt: '1',
                      in_subscribe_cnt: '0',
                    },
                  },
                  {
                    data: {
                      date: '2023-10-29',
                      in_anti_vfinish_cnt: '1',
                      in_binge_uv: '0',
                      in_comment_cnt: '0',
                      in_jitui_income_num: '0',
                      in_like_cnt: '0',
                      in_subscribe_cnt: '0',
                    },
                  },
                  {
                    data: {
                      date: '2023-10-28',
                      in_anti_vfinish_cnt: '5',
                      in_binge_uv: '0',
                      in_comment_cnt: '0',
                      in_jitui_income_num: '0',
                      in_like_cnt: '0',
                      in_subscribe_cnt: '0',
                    },
                  },
                  {
                    data: {
                      date: '2023-10-27',
                      in_anti_vfinish_cnt: '5',
                      in_binge_uv: '0',
                      in_comment_cnt: '0',
                      in_jitui_income_num: '0',
                      in_like_cnt: '0',
                      in_subscribe_cnt: '0',
                    },
                  },
                  {
                    data: {
                      date: '2023-10-26',
                      in_anti_vfinish_cnt: '3',
                      in_binge_uv: '0',
                      in_comment_cnt: '0',
                      in_jitui_income_num: '0',
                      in_like_cnt: '0',
                      in_subscribe_cnt: '0',
                    },
                  },
                  {
                    data: {
                      date: '2023-10-25',
                      in_anti_vfinish_cnt: '4',
                      in_binge_uv: '0',
                      in_comment_cnt: '0',
                      in_jitui_income_num: '0',
                      in_like_cnt: '0',
                      in_subscribe_cnt: '0',
                    },
                  },
                  {
                    data: {
                      date: '2023-10-24',
                      in_anti_vfinish_cnt: '1',
                      in_binge_uv: '0',
                      in_comment_cnt: '0',
                      in_jitui_income_num: '0',
                      in_like_cnt: '0',
                      in_subscribe_cnt: '0',
                    },
                  },
                  {
                    data: {
                      date: '2023-10-23',
                      in_anti_vfinish_cnt: '3',
                      in_binge_uv: '0',
                      in_comment_cnt: '0',
                      in_jitui_income_num: '0',
                      in_like_cnt: '0',
                      in_subscribe_cnt: '0',
                    },
                  },
                  {
                    data: {
                      date: '2023-10-22',
                      in_anti_vfinish_cnt: '2',
                      in_binge_uv: '0',
                      in_comment_cnt: '0',
                      in_jitui_income_num: '0',
                      in_like_cnt: '0',
                      in_subscribe_cnt: '0',
                    },
                  },
                  {
                    data: {
                      date: '2023-10-21',
                      in_anti_vfinish_cnt: '1',
                      in_binge_uv: '0',
                      in_comment_cnt: '0',
                      in_jitui_income_num: '0',
                      in_like_cnt: '0',
                      in_subscribe_cnt: '0',
                    },
                  },
                  {
                    data: {
                      date: '2023-10-20',
                      in_anti_vfinish_cnt: '0',
                      in_binge_uv: '0',
                      in_comment_cnt: '0',
                      in_jitui_income_num: '0',
                      in_like_cnt: '0',
                      in_subscribe_cnt: '0',
                    },
                  },
                  {
                    data: {
                      date: '2023-10-19',
                      in_anti_vfinish_cnt: '1',
                      in_binge_uv: '0',
                      in_comment_cnt: '0',
                      in_jitui_income_num: '0',
                      in_like_cnt: '0',
                      in_subscribe_cnt: '0',
                    },
                  },
                  {
                    data: {
                      date: '2023-10-18',
                      in_anti_vfinish_cnt: '3',
                      in_binge_uv: '0',
                      in_comment_cnt: '0',
                      in_jitui_income_num: '0',
                      in_like_cnt: '0',
                      in_subscribe_cnt: '0',
                    },
                  },
                  {
                    data: {
                      date: '2023-10-17',
                      in_anti_vfinish_cnt: '0',
                      in_binge_uv: '0',
                      in_comment_cnt: '0',
                      in_jitui_income_num: '0',
                      in_like_cnt: '0',
                      in_subscribe_cnt: '0',
                    },
                  },
                ],
                summaries: [
                  {
                    name: 'in_binge_uv',
                    cname: '在追总人数',
                    count: '0',
                    ratio: '',
                    columns: ['in_binge_uv'],
                  },
                  {
                    name: 'in_subscribe_cnt',
                    cname: '粉丝数',
                    count: '0',
                    ratio: '',
                    columns: ['in_subscribe_cnt'],
                  },
                  {
                    name: 'in_anti_vfinish_cnt',
                    cname: '播放量',
                    count: '94',
                    ratio: '0.6207',
                    columns: ['in_anti_vfinish_cnt'],
                  },
                  {
                    name: 'in_like_cnt',
                    cname: '获赞数',
                    count: '1',
                    ratio: '',
                    columns: ['in_like_cnt'],
                  },
                  {
                    name: 'in_comment_cnt',
                    cname: '评论数',
                    count: '0',
                    ratio: '',
                    columns: ['in_comment_cnt'],
                  },
                  {
                    name: 'in_jitui_income_num',
                    cname: '鸡腿数',
                    count: '0',
                    ratio: '',
                    columns: ['in_jitui_income_num'],
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
        const result = await getDataOverviewAsync('success', 385423148, 1583409860, '', '');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(0);
      });
    });
  });

  describe('获取腾讯视频收益数据', () => {
    const server = setupServer(
      rest.get(
        'https://access.v.qq.com*/trpc.creator_center.settlement.Wallet/GetIncomeInfoList',
        (req, res, context) => {
          const cookie = req.url.searchParams.get('cookie');

          // success
          if (cookie === 'success') {
            return res(
              context.status(200),
              context.json({
                code: 0,
                msg: 'ok',
                data: {
                  items: [
                    {
                      name: 'ipcreate_video_income',
                      cname: '流量分成',
                      withdrawAmount: '0',
                      itemStatus: 0,
                      incomeCName: '流量分成',
                      balance: '0',
                      sort: 10,
                    },
                    {
                      name: 'flow_amount',
                      cname: '流量分成-短视频',
                      withdrawAmount: '0',
                      itemStatus: 0,
                      incomeCName: '流量分成-短视频',
                      balance: '0',
                      sort: 100,
                    },
                    {
                      name: 'related_flow_amount',
                      cname: '流量分成-关联正片',
                      withdrawAmount: '0',
                      itemStatus: 0,
                      incomeCName: '流量分成-关联正片',
                      balance: '0',
                      sort: 200,
                    },
                    {
                      name: 'activity_amount',
                      cname: '活动',
                      withdrawAmount: '0',
                      itemStatus: 1,
                      incomeCName: '活动',
                      balance: '0',
                      sort: 300,
                    },
                    {
                      name: 'related_amount',
                      cname: '关联正片-会员开通',
                      withdrawAmount: '0',
                      itemStatus: 0,
                      incomeCName: '关联正片-会员开通',
                      balance: '0',
                      sort: 400,
                    },
                    {
                      name: 'business_order_amount',
                      cname: '商单',
                      withdrawAmount: '0',
                      itemStatus: 0,
                      incomeCName: '商单',
                      balance: '0',
                      sort: 500,
                    },
                    {
                      name: 'flow_album_amount',
                      cname: '专辑-流量分成',
                      withdrawAmount: '0',
                      itemStatus: 0,
                      incomeCName: '专辑-流量分成',
                      balance: '0',
                      sort: 800,
                    },
                    {
                      name: 'medium_guarantee_amount',
                      cname: '基础激励',
                      withdrawAmount: '0',
                      itemStatus: 1,
                      incomeCName: '基础激励',
                      balance: '0',
                      sort: 810,
                    },
                    {
                      name: 'drumstick_amount',
                      cname: '鸡腿收益',
                      withdrawAmount: '0',
                      itemStatus: 0,
                      incomeCName: '鸡腿收益',
                      balance: '0',
                      sort: 900,
                    },
                    {
                      name: 'album_activity_amount',
                      cname: '专辑活动',
                      withdrawAmount: '0',
                      itemStatus: 1,
                      incomeCName: '专辑活动',
                      balance: '0',
                      sort: 1000,
                    },
                    {
                      name: 'album_sharing_amount',
                      cname: '专辑-会员分账',
                      withdrawAmount: '0',
                      itemStatus: 0,
                      incomeCName: '专辑-会员分账',
                      balance: '0',
                      sort: 1200,
                    },
                  ],
                  totalIncome: '0',
                  totalWithdrawAmount: '0',
                  totalCantWithdrawAmount: '0',
                  info: {
                    CantWithdrawAmount: '0',
                    cidInfos: [],
                  },
                  reasons: [],
                  handInAmount: '0',
                },
              }),
            );
          }

          return req.passthrough();
        },
      ),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const result = await getIncomeInfoListAsync('success', 385423148, 1583409860);
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(0);
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('获取腾讯视频数据分析', async () => {
    const cookie =
      'video_guid=1938ff17d2cf12fc; video_platform=2; _clck=3509922215|1|fgi|0; pgv_pvid=1971602178; qq_domain_video_guid_verify=1938ff17d2cf12fc; _qimei_q36=; _qimei_h38=2db8a9497f375c35a34c816402000006517a1e; main_login=wx; vuserid=1409263885; access_token=74_ofy5hYthPa7GWYoGCOSY0rk70z8E6g40uLei5Zjz9WBmi0_JMFXIncNgGZSfazAcnbOtmf3kfm-rSUl4gD4l50igsGo_sKvPbZnaRBWfmBU; refresh_token=74_YTNZxeXrj3OyPUwF-9kZs_fn2KbrEY2W4mo1W3U91wFn8A-ZD3dWsSIhUFtpJ4V_GOmS1dOK7BEwMyGuVf4XHI8EVIZBluBF8ABy7-2T2y4; openid=ox8XOvkD_QF8RxV88IXNxR2VI5Ww; appid=wx5ed58254bc0d6b7f; wx_nick=%E4%BF%AE%E9%9A%90; wx_head=https://tvpic.gtimg.cn/head/ef8bc60f147e9c379c5cc0254a82d6eeda39a3ee5e6b4b0d3255bfef95601890afd80709/140; vcuid=9000402989; _qimei_fingerprint=69928e0a84b1b926582c4c55b6a55269; vusession=x6rG3NFGcjAwGWGai-pC6A.M; v_qq_com_session_lapse_time=1700130796535';

    const result = await getDataOverviewAsync(cookie, 2146292270, 1744544512, '2023-10-17', '2023-11-15');
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);

  test('获取腾讯视频收益数据', async () => {
    const cookie =
      'video_guid=1938ff17d2cf12fc; video_platform=2; _clck=3509922215|1|fgi|0; pgv_pvid=1971602178; qq_domain_video_guid_verify=1938ff17d2cf12fc; _qimei_q36=; _qimei_h38=2db8a9497f375c35a34c816402000006517a1e; main_login=wx; vuserid=1409263885; access_token=74_ofy5hYthPa7GWYoGCOSY0rk70z8E6g40uLei5Zjz9WBmi0_JMFXIncNgGZSfazAcnbOtmf3kfm-rSUl4gD4l50igsGo_sKvPbZnaRBWfmBU; refresh_token=74_YTNZxeXrj3OyPUwF-9kZs_fn2KbrEY2W4mo1W3U91wFn8A-ZD3dWsSIhUFtpJ4V_GOmS1dOK7BEwMyGuVf4XHI8EVIZBluBF8ABy7-2T2y4; openid=ox8XOvkD_QF8RxV88IXNxR2VI5Ww; appid=wx5ed58254bc0d6b7f; wx_nick=%E4%BF%AE%E9%9A%90; wx_head=https://tvpic.gtimg.cn/head/ef8bc60f147e9c379c5cc0254a82d6eeda39a3ee5e6b4b0d3255bfef95601890afd80709/140; vcuid=9000402989; _qimei_fingerprint=69928e0a84b1b926582c4c55b6a55269; vusession=x6rG3NFGcjAwGWGai-pC6A.M; v_qq_com_session_lapse_time=1700130796535';

    const result = await getIncomeInfoListAsync(cookie, 385423148, 1583409860);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);
});
