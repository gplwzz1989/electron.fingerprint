import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import {
  getDataOverviewAsync,
  getSingleDataOverview,
  getSingleDataOverviewStatisticAsync,
} from '@/media-platform/baijiahao/baijiahao-data-overview.service';

describe('【Mock】', () => {
  describe('获取百家号数据内容分析', () => {
    const server = setupServer(
      rest.get('https://baijiahao.baidu.com*/author/eco/statistics/appStatistic', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              errno: 0,
              errmsg: 'success',
              data: {
                data: {
                  recommend_count: 0,
                  view_count: 73,
                  likes_count: 0,
                  collect_count: 0,
                  share_count: 0,
                  search_show: 568,
                  publish_count: 0,
                  origin_publish_count: 0,
                  publish_account_count: 0,
                  origin_publish_account_count: 0,
                  comment_count: 0,
                  all_view_duration: '--',
                  complete_rate: 8.1,
                  view_channel_count: {
                    other: 2,
                    spider: 41,
                  },
                  completion_view_count: 17,
                  total_view_count: 211,
                  event_day: '20231030',
                  news_quality: '0',
                  news_quality_rank: '0',
                  small_video_quality: '--',
                  small_video_quality_rank: '--',
                  small_video_v2_quality: '--',
                  small_video_v2_quality_rank: '--',
                  video_quality: '0',
                  video_quality_rank: '0',
                },
                list: [
                  {
                    recommend_count: 0,
                    comment_count: 0,
                    view_count: 38,
                    likes_count: 0,
                    collect_count: 0,
                    share_count: 0,
                    search_show: 298,
                    fans_recommend_count: 0,
                    fans_comment_count: 0,
                    fans_view_count: 0,
                    fans_likes_count: 0,
                    fans_collect_count: 0,
                    fans_share_count: 0,
                    fans_play_duration: 0,
                    publish_count: 0,
                    origin_publish_count: 0,
                    publish_account_count: 0,
                    origin_publish_account_count: 0,
                    complete_rate: 0.9,
                    all_view_duration: 914,
                    view_channel_count: {
                      spider: 20,
                      other: 1,
                    },
                    event_day: '20231030',
                    play_duration: 122,
                  },
                  {
                    recommend_count: 0,
                    comment_count: 0,
                    view_count: 35,
                    likes_count: 0,
                    collect_count: 0,
                    share_count: 0,
                    search_show: 270,
                    fans_recommend_count: 0,
                    fans_comment_count: 0,
                    fans_view_count: 0,
                    fans_likes_count: 0,
                    fans_collect_count: 0,
                    fans_share_count: 0,
                    fans_play_duration: 0,
                    publish_count: 0,
                    origin_publish_count: 0,
                    publish_account_count: 0,
                    origin_publish_account_count: 0,
                    complete_rate: 0.8,
                    all_view_duration: 912,
                    view_channel_count: {
                      other: 1,
                      spider: 21,
                    },
                    event_day: '20231029',
                    play_duration: 66,
                  },
                ],
                chart: [
                  {
                    recommend_count: 0,
                    comment_count: 0,
                    view_count: 35,
                    likes_count: 0,
                    collect_count: 0,
                    share_count: 0,
                    search_show: 270,
                    fans_recommend_count: 0,
                    fans_comment_count: 0,
                    fans_view_count: 0,
                    fans_likes_count: 0,
                    fans_collect_count: 0,
                    fans_share_count: 0,
                    fans_play_duration: 0,
                    total_play_duration: 66,
                    publish_count: 0,
                    origin_publish_count: 0,
                    publish_account_count: 0,
                    origin_publish_account_count: 0,
                    complete_rate: 0.8,
                    all_view_duration: 912,
                    view_channel_count: {
                      other: 1,
                      spider: 21,
                    },
                    event_day: '20231029',
                  },
                  {
                    recommend_count: 0,
                    comment_count: 0,
                    view_count: 38,
                    likes_count: 0,
                    collect_count: 0,
                    share_count: 0,
                    search_show: 298,
                    fans_recommend_count: 0,
                    fans_comment_count: 0,
                    fans_view_count: 0,
                    fans_likes_count: 0,
                    fans_collect_count: 0,
                    fans_share_count: 0,
                    fans_play_duration: 0,
                    total_play_duration: 122,
                    publish_count: 0,
                    origin_publish_count: 0,
                    publish_account_count: 0,
                    origin_publish_account_count: 0,
                    complete_rate: 0.9,
                    all_view_duration: 914,
                    view_channel_count: {
                      spider: 20,
                      other: 1,
                    },
                    event_day: '20231030',
                  },
                ],
                yesterday: {
                  comment_count: 0,
                  likes_count: 0,
                  collect_count: 0,
                  share_count: 0,
                  search_show: 298,
                  publish_count: 0,
                  origin_publish_count: 0,
                  publish_account_count: 0,
                  origin_publish_account_count: 0,
                  recommend_count: 0,
                  view_count: 38,
                  complete_rate: 0,
                  all_view_duration: 914,
                  event_day: '20231030',
                },
                week: {
                  comment_count: 0,
                  likes_count: 0,
                  collect_count: 0,
                  share_count: 1,
                  search_show: 256,
                  publish_count: 0,
                  origin_publish_count: 0,
                  publish_account_count: 0,
                  origin_publish_account_count: 0,
                  recommend_count: 0,
                  view_count: 46,
                  complete_rate: 0,
                  all_view_duration: 905,
                  event_day: '20231024',
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
        const result = await getDataOverviewAsync('success', '20231029', '20231030');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.errno).toBe(0);
      });
    });
  });

  describe('获取百家号单篇统计分析', () => {
    const server = setupServer(
      rest.get('https://baijiahao.baidu.com*/author/eco/statistics/ArticleStatisticV2', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              errno: 0,
              errmsg: 'success',
              data: {
                disp_pv: '--',
                fans_increase: '--',
                income_count: '--',
                reward_count: '--',
                complete_rate: 0,
                view_3s_dis: 71,
                avg_view_duration: '--',
                nid: '11876294052682509134',
                app_id: '1717839316314860',
                view_count: 614,
                likes_count: 0,
                comment_count: 3,
                share_count: 0,
                title: '植物羊绒四件套，接触肌肤柔软亲和',
                rec_count: 296,
                collect_count: 0,
                mount_mapp: 0,
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
        const result = await getSingleDataOverviewStatisticAsync('success', '20231029', 'video');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.errno).toBe(0);
      });
    });
  });

  describe('获取百家号单篇报表', () => {
    const server = setupServer(
      rest.get(
        'https://baijiahao.baidu.com*/author/eco/statistics/articleDailyListStatisticV2',
        (req, res, context) => {
          const cookie = req.url.searchParams.get('cookie');

          // success
          if (cookie === 'success') {
            return res(
              context.status(200),
              context.json({
                errno: 0,
                errmsg: 'success',
                data: {
                  list: [
                    {
                      recommend_count: 0,
                      view_count: 0,
                      likes_count: 0,
                      comment_count: 0,
                      collect_count: 0,
                      share_count: 0,
                      disp_pv: 0,
                      fans_increase: 0,
                      fans_view_count: 0,
                      fans_likes_count: 0,
                      fans_comment_count: 0,
                      fans_share_count: 0,
                      event_day: '20231130',
                    },
                    {
                      recommend_count: 0,
                      view_count: 3,
                      likes_count: 0,
                      comment_count: 0,
                      collect_count: 0,
                      share_count: 0,
                      disp_pv: 8,
                      fans_increase: 0,
                      fans_view_count: 0,
                      fans_likes_count: 0,
                      fans_comment_count: 0,
                      fans_share_count: 0,
                      event_day: '20231129',
                    },
                    {
                      recommend_count: 0,
                      view_count: 5,
                      likes_count: 0,
                      comment_count: 0,
                      collect_count: 0,
                      share_count: 0,
                      disp_pv: 8,
                      fans_increase: 0,
                      fans_view_count: 0,
                      fans_likes_count: 0,
                      fans_comment_count: 0,
                      fans_share_count: 0,
                      event_day: '20231128',
                    },
                    {
                      recommend_count: 0,
                      view_count: 2,
                      likes_count: 0,
                      comment_count: 0,
                      collect_count: 0,
                      share_count: 0,
                      disp_pv: 13,
                      fans_increase: 0,
                      fans_view_count: 0,
                      fans_likes_count: 0,
                      fans_comment_count: 0,
                      fans_share_count: 0,
                      event_day: '20231127',
                    },
                    {
                      recommend_count: 0,
                      view_count: 5,
                      likes_count: 0,
                      comment_count: 0,
                      collect_count: 0,
                      share_count: 0,
                      disp_pv: 17,
                      fans_increase: 0,
                      fans_view_count: 0,
                      fans_likes_count: 0,
                      fans_comment_count: 0,
                      fans_share_count: 0,
                      event_day: '20231126',
                    },
                    {
                      recommend_count: 0,
                      view_count: 5,
                      likes_count: 0,
                      comment_count: 0,
                      collect_count: 0,
                      share_count: 0,
                      disp_pv: 11,
                      fans_increase: 0,
                      fans_view_count: 0,
                      fans_likes_count: 0,
                      fans_comment_count: 0,
                      fans_share_count: 0,
                      event_day: '20231125',
                    },
                    {
                      recommend_count: 0,
                      view_count: 3,
                      likes_count: 0,
                      comment_count: 0,
                      collect_count: 0,
                      share_count: 0,
                      disp_pv: 9,
                      fans_increase: 0,
                      fans_view_count: 0,
                      fans_likes_count: 0,
                      fans_comment_count: 0,
                      fans_share_count: 0,
                      event_day: '20231124',
                    },
                    {
                      recommend_count: 1,
                      view_count: 3,
                      likes_count: 0,
                      comment_count: 0,
                      collect_count: 0,
                      share_count: 0,
                      disp_pv: 6,
                      fans_increase: 0,
                      fans_view_count: 0,
                      fans_likes_count: 0,
                      fans_comment_count: 0,
                      fans_share_count: 0,
                      event_day: '20231123',
                    },
                    {
                      recommend_count: 0,
                      view_count: 5,
                      likes_count: 0,
                      comment_count: 0,
                      collect_count: 0,
                      share_count: 0,
                      disp_pv: 11,
                      fans_increase: 0,
                      fans_view_count: 0,
                      fans_likes_count: 0,
                      fans_comment_count: 0,
                      fans_share_count: 0,
                      event_day: '20231122',
                    },
                    {
                      recommend_count: 0,
                      view_count: 5,
                      likes_count: 0,
                      comment_count: 0,
                      collect_count: 0,
                      share_count: 0,
                      disp_pv: 12,
                      fans_increase: 0,
                      fans_view_count: 0,
                      fans_likes_count: 0,
                      fans_comment_count: 0,
                      fans_share_count: 0,
                      event_day: '20231121',
                    },
                    {
                      recommend_count: 0,
                      view_count: 2,
                      likes_count: 0,
                      comment_count: 0,
                      collect_count: 0,
                      share_count: 0,
                      disp_pv: 6,
                      fans_increase: 0,
                      fans_view_count: 0,
                      fans_likes_count: 0,
                      fans_comment_count: 0,
                      fans_share_count: 0,
                      event_day: '20231120',
                    },
                    {
                      recommend_count: 0,
                      view_count: 7,
                      likes_count: 0,
                      comment_count: 0,
                      collect_count: 0,
                      share_count: 0,
                      disp_pv: 11,
                      fans_increase: 0,
                      fans_view_count: 0,
                      fans_likes_count: 0,
                      fans_comment_count: 0,
                      fans_share_count: 0,
                      event_day: '20231119',
                    },
                    {
                      recommend_count: 0,
                      view_count: 0,
                      likes_count: 0,
                      comment_count: 0,
                      collect_count: 0,
                      share_count: 0,
                      disp_pv: 9,
                      fans_increase: 0,
                      fans_view_count: 0,
                      fans_likes_count: 0,
                      fans_comment_count: 0,
                      fans_share_count: 0,
                      event_day: '20231118',
                    },
                    {
                      recommend_count: 0,
                      view_count: 4,
                      likes_count: 0,
                      comment_count: 0,
                      collect_count: 0,
                      share_count: 0,
                      disp_pv: 11,
                      fans_increase: 0,
                      fans_view_count: 0,
                      fans_likes_count: 0,
                      fans_comment_count: 0,
                      fans_share_count: 0,
                      event_day: '20231117',
                    },
                  ],
                  chart: [
                    {
                      recommend_count: 0,
                      view_count: 4,
                      likes_count: 0,
                      comment_count: 0,
                      collect_count: 0,
                      share_count: 0,
                      disp_pv: 11,
                      fans_increase: 0,
                      fans_view_count: 0,
                      fans_likes_count: 0,
                      fans_comment_count: 0,
                      fans_share_count: 0,
                      event_day: '20231117',
                    },
                    {
                      recommend_count: 0,
                      view_count: 0,
                      likes_count: 0,
                      comment_count: 0,
                      collect_count: 0,
                      share_count: 0,
                      disp_pv: 9,
                      fans_increase: 0,
                      fans_view_count: 0,
                      fans_likes_count: 0,
                      fans_comment_count: 0,
                      fans_share_count: 0,
                      event_day: '20231118',
                    },
                    {
                      recommend_count: 0,
                      view_count: 7,
                      likes_count: 0,
                      comment_count: 0,
                      collect_count: 0,
                      share_count: 0,
                      disp_pv: 11,
                      fans_increase: 0,
                      fans_view_count: 0,
                      fans_likes_count: 0,
                      fans_comment_count: 0,
                      fans_share_count: 0,
                      event_day: '20231119',
                    },
                    {
                      recommend_count: 0,
                      view_count: 2,
                      likes_count: 0,
                      comment_count: 0,
                      collect_count: 0,
                      share_count: 0,
                      disp_pv: 6,
                      fans_increase: 0,
                      fans_view_count: 0,
                      fans_likes_count: 0,
                      fans_comment_count: 0,
                      fans_share_count: 0,
                      event_day: '20231120',
                    },
                    {
                      recommend_count: 0,
                      view_count: 5,
                      likes_count: 0,
                      comment_count: 0,
                      collect_count: 0,
                      share_count: 0,
                      disp_pv: 12,
                      fans_increase: 0,
                      fans_view_count: 0,
                      fans_likes_count: 0,
                      fans_comment_count: 0,
                      fans_share_count: 0,
                      event_day: '20231121',
                    },
                    {
                      recommend_count: 0,
                      view_count: 5,
                      likes_count: 0,
                      comment_count: 0,
                      collect_count: 0,
                      share_count: 0,
                      disp_pv: 11,
                      fans_increase: 0,
                      fans_view_count: 0,
                      fans_likes_count: 0,
                      fans_comment_count: 0,
                      fans_share_count: 0,
                      event_day: '20231122',
                    },
                    {
                      recommend_count: 1,
                      view_count: 3,
                      likes_count: 0,
                      comment_count: 0,
                      collect_count: 0,
                      share_count: 0,
                      disp_pv: 6,
                      fans_increase: 0,
                      fans_view_count: 0,
                      fans_likes_count: 0,
                      fans_comment_count: 0,
                      fans_share_count: 0,
                      event_day: '20231123',
                    },
                    {
                      recommend_count: 0,
                      view_count: 3,
                      likes_count: 0,
                      comment_count: 0,
                      collect_count: 0,
                      share_count: 0,
                      disp_pv: 9,
                      fans_increase: 0,
                      fans_view_count: 0,
                      fans_likes_count: 0,
                      fans_comment_count: 0,
                      fans_share_count: 0,
                      event_day: '20231124',
                    },
                    {
                      recommend_count: 0,
                      view_count: 5,
                      likes_count: 0,
                      comment_count: 0,
                      collect_count: 0,
                      share_count: 0,
                      disp_pv: 11,
                      fans_increase: 0,
                      fans_view_count: 0,
                      fans_likes_count: 0,
                      fans_comment_count: 0,
                      fans_share_count: 0,
                      event_day: '20231125',
                    },
                    {
                      recommend_count: 0,
                      view_count: 5,
                      likes_count: 0,
                      comment_count: 0,
                      collect_count: 0,
                      share_count: 0,
                      disp_pv: 17,
                      fans_increase: 0,
                      fans_view_count: 0,
                      fans_likes_count: 0,
                      fans_comment_count: 0,
                      fans_share_count: 0,
                      event_day: '20231126',
                    },
                    {
                      recommend_count: 0,
                      view_count: 2,
                      likes_count: 0,
                      comment_count: 0,
                      collect_count: 0,
                      share_count: 0,
                      disp_pv: 13,
                      fans_increase: 0,
                      fans_view_count: 0,
                      fans_likes_count: 0,
                      fans_comment_count: 0,
                      fans_share_count: 0,
                      event_day: '20231127',
                    },
                    {
                      recommend_count: 0,
                      view_count: 5,
                      likes_count: 0,
                      comment_count: 0,
                      collect_count: 0,
                      share_count: 0,
                      disp_pv: 8,
                      fans_increase: 0,
                      fans_view_count: 0,
                      fans_likes_count: 0,
                      fans_comment_count: 0,
                      fans_share_count: 0,
                      event_day: '20231128',
                    },
                    {
                      recommend_count: 0,
                      view_count: 3,
                      likes_count: 0,
                      comment_count: 0,
                      collect_count: 0,
                      share_count: 0,
                      disp_pv: 8,
                      fans_increase: 0,
                      fans_view_count: 0,
                      fans_likes_count: 0,
                      fans_comment_count: 0,
                      fans_share_count: 0,
                      event_day: '20231129',
                    },
                    {
                      recommend_count: 0,
                      view_count: 0,
                      likes_count: 0,
                      comment_count: 0,
                      collect_count: 0,
                      share_count: 0,
                      disp_pv: 0,
                      fans_increase: 0,
                      fans_view_count: 0,
                      fans_likes_count: 0,
                      fans_comment_count: 0,
                      fans_share_count: 0,
                      event_day: '20231130',
                    },
                  ],
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
        const result = await getSingleDataOverview('success', '', '20231029', '20231030', 'video');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.errno).toBe(0);
      });
    });
  });
});

describe.runIf(true)('【真实测试】', () => {
  test('获取百家号数据内容分析', async () => {
    const cookie =
      'PSTM=1659435413; BIDUPSID=9AD8F95371FB5F95E3E4AF2EC9181314; BAIDUID=F051C5FB12677EFE099E29815E11DB98:SL=0:NR=10:FG=1; theme=bjh; gray=1; canary=0; MCITY=-%3A; BDSFRCVID=YXuOJexroG3B_xQJhrNWMFcHYuweG7bTDYrEOwXPsp3LGJLVdLE8EG0Pts1-dEu-S2OOogKKLmOTHpKF_2uxOjjg8UtVJeC6EG0Ptf8g0M5; H_BDCLCKID_SF=tRAOoC_-tDvDqTrP-trf5DCShUFs3x-JB2Q-XPoO3KOI_Pnhy47KX6DIQxb7XRQf5mkf3fbgy4op8P3y0bb2DUA1y4vpKU74fgTxoUJ2-KDVeh5Gqq-KXU4ebPRiWPr9QgbjahQ7tt5W8ncFbT7l5hKpbt-q0x-jLTnhVn0MBCK0hD89DjKKD6PVKgTa54cbb4o2WbCQyxnh8pcN2b5oQTtYBp7IBtvHBHvuKJOdy45beq06-lOUWJDkXpJvQnJjt2JxaqRC5pRpbh5jDh3MKToDb-oteltHB2Oy0hvcBn6cShnxyUjrDRLbXU6BK5vPbNcZ0l8K3l02V-bIe-t2XjQh-p52f6KjJnKt3H; H_WISE_SIDS=61027_61053_61075_61141_61161_61218_61206_61210_61215_61240; BDRCVFR[feWj1Vr5u3D]=I67x6TjHwwYf0; delPer=0; PSINO=7; BAIDUID_BFESS=F051C5FB12677EFE099E29815E11DB98:SL=0:NR=10:FG=1; BDSFRCVID_BFESS=YXuOJexroG3B_xQJhrNWMFcHYuweG7bTDYrEOwXPsp3LGJLVdLE8EG0Pts1-dEu-S2OOogKKLmOTHpKF_2uxOjjg8UtVJeC6EG0Ptf8g0M5; H_BDCLCKID_SF_BFESS=tRAOoC_-tDvDqTrP-trf5DCShUFs3x-JB2Q-XPoO3KOI_Pnhy47KX6DIQxb7XRQf5mkf3fbgy4op8P3y0bb2DUA1y4vpKU74fgTxoUJ2-KDVeh5Gqq-KXU4ebPRiWPr9QgbjahQ7tt5W8ncFbT7l5hKpbt-q0x-jLTnhVn0MBCK0hD89DjKKD6PVKgTa54cbb4o2WbCQyxnh8pcN2b5oQTtYBp7IBtvHBHvuKJOdy45beq06-lOUWJDkXpJvQnJjt2JxaqRC5pRpbh5jDh3MKToDb-oteltHB2Oy0hvcBn6cShnxyUjrDRLbXU6BK5vPbNcZ0l8K3l02V-bIe-t2XjQh-p52f6KjJnKt3H; ZFY=TXS3auL7ioD2x4BPLySkDPoq6I:Aqdxdl3iBZJVmZuNk:C; log_first_time=1732527218583; log_last_time=1732527237882; BDRCVFR[S4-dAuiWMmn]=I67x6TjHwwYf0; ZD_ENTRY=baidu; H_WISE_SIDS_BFESS=61027_61053_61075_61141_61161_61218_61206_61210_61215_61240; BA_HECTOR=2l2k0la52h008g2k210g0k0g1g8m1c1jkip1b1v; BDORZ=B490B5EBF6F3CD402E515D22BCDA1598; PHPSESSID=nqeckllfrk2h322i2l7cnagob4; ppfuid=FOCoIC3q5fKa8fgJnwzbE0LGziLN3VHbX8wfShDP6RCsfXQp/69CStRUAcn/QmhIlFDxPrAc/s5tJmCocrihdwitHd04Lvs3Nfz26Zt2holplnIKVacidp8Sue4dMTyfg65BJnOFhn1HthtSiwtygiD7piS4vjG/W9dLb1VAdqPNMaFa6COBr2OFC12lralcO0V6uxgO+hV7+7wZFfXG0MSpuMmh7GsZ4C7fF/kTgmuR/6nKv9JHDlbfxVRs8b2Q2yg1mRZO3kKtoXhXTvRGEXPXJGNvkH57irinoYdS2+41v2iwj13daM+9aWJ5GJCQu/SUbF5jV5AUyz/jBiIgKVObaDCHgWJZH3ZrTGYHmi7XJB9z3y2o8Kqxep5XBCsu5WSoiGtkBmuxgNnGvSmhCsTtlheGhftBTbUILzt33xSjQXz/gJEgSYx1vUQMipXdSecr9yhMSRLVoFktEC1isBapCm9qVt/6kSSW7Xg8l3SvK/S9Ff5RtLDcahg8QCqqP/JUZA7BRBFh68uqDQax10gfXgGxCNf3Sx8e4KXUBrqV/g3hEEf9luu8oPziRIwanIJY1XZupqPZgmfh8BLwT9YUuyc0u8RKTitzO23hSwGX7sI4U3M5cfLBwVX5m74NveYUNi7Li87S8ZbXy31eyxBDK4IiDGlt1VFsxDIz0RsVHZudegSJ4zYa95fLOW41HdqdlVsa4ORVPwaoYgWzWigT4KUSvejPWWbczD37o0JAMY0Xq/mt7JbC+fPJzgUfRzNZgPhgVUh3SShPYyzuP+stUM5mgs1HaIotoPws+vONShWJwz1YFh50cD2nHuAUHJMc4xeuRg7bfpEY/vwboa87Mf4DRxb3AAPFSzwHIQupzieM+QALqe3EwFiIk9Nti8jfUCnxofA3zANcmlfc4RXkuNYCZBWkNbmLJnCAaUdSDiq641gRtF4fILNK7ztfbqw6aD8guGaAe30S21IxszqOo2R7vfZvyT+BEUNopxhC8xSSMxCu8WMUnnfbjsasJYugTW5lGCyFRXKtKIQxSMPpLP2HQMI1/SI1/h9WAqjxxJNDJS+Dlsbqu3n4I65ujli/3rQ8Zk1MjmTOsz9+kTqOM4upsnQ6IWq/zeZTItMCgHpQhuhr4ip73honuzoJhfJJqPUSX01viD97GXfw7kf+R6as3JPAEXsdOdDsWEAgJn+ZMVrELI7pXz8Jko9Xv3uSDHo/C3kmFLrauvEYpUg3FbqEqM6JmRHqkwRhSJRrF+MyOoYKm6kqRoe11cJkzRszeYvFyXCPSuJ5oyoOgoCPKXE8fX73WOZ0mAlF1mc=; Hm_lvt_f7b8c775c6c8b6a716a75df506fb72df=1732863101; HMACCOUNT=302DC822FE42C2EB; __bid_n=191efa9c485982449ec431; XFT=q9gRflkSFpOgGclqCAJJtsqeJsXZN3kwnk0iE1uIrjE=; H_PS_PSSID=61027_61141_61206_61210_61215_61240_61188_61281; BDUSS=FIelVOU09kQjdLc0N3OVo2RU9GM0YzT0xmYWE3cThnanZkSTlpMTE3THg5WEJuRVFBQUFBJCQAAAAAAAAAAAEAAACuA1kz09DIpLjj0Ka1xGVuAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPFoSWfxaElnMn; BDUSS_BFESS=FIelVOU09kQjdLc0N3OVo2RU9GM0YzT0xmYWE3cThnanZkSTlpMTE3THg5WEJuRVFBQUFBJCQAAAAAAAAAAAEAAACuA1kz09DIpLjj0Ka1xGVuAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPFoSWfxaElnMn; ab_sr=1.0.1_NmJmNzc4YjAzYTBlZTFlMWYzNDZlNTZmOGY0YmYxNjkyZjU5YWU1NjcwMjdlNzZmYjBjMjYzNGZkNzY3ZmRmMzQwNDVjYmQ1NWE3M2Y5ZDgwMzM1YjQ4NmM0ODliMTU0ZTU5MTQzYWVlNGFiNWQ3N2M5Y2U3MGQ5ZDEwMmNhYThmNDBkZDY3NDYxY2RkM2FlNTYzZDM0ZTRkNjRmMGNmOTcwNTAzZDc5MGEzNGRjYmYyYWMzZGFlMzEwYTE5Zjk2; Hm_lpvt_f7b8c775c6c8b6a716a75df506fb72df=1732864911; RECENT_LOGIN=0; XFI=9c1e3080-ae22-11ef-919c-c133126ccbee; XFCS=129B8927829E724D84EB1FB2B5E43E6BDC251FEEA09D7D7A147B6A459DD92428; devStoken=a1e8925fc00d72728e7c739c44615e07b9ade114a8dc2f593576e1012bcb47b0; bjhStoken=25ee5e24b3b338e4207fb8e5260d4b5ab9ade114a8dc2f593576e1012bcb47b0; RT="z=1&dm=baidu.com&si=5a1ffe1e-b148-42e2-bc9c-3b1385e7983a&ss=m42dy532&sl=1m&tt=1qca&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf&r=4sodh7rg&ul=12xqz"';

    const result = await getDataOverviewAsync(cookie, '20241023', '20241121');
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.errno).toBe(0);
  }, 10000000);

  test('获取百家号单篇统计分析', async () => {
    const cookie =
      'BIDUPSID=9C4A3617F56F0798AD4FF5D9B675F7EB; PSTM=1676382873; theme=bjh; gray=1; canary=0; BAIDUID=1BEB09EEC472DFB910E53E07CCF4745E:SL=0:NR=10:FG=1; MCITY=-158%3A; BDUSS=FiRGh2OEhjSjVSYkRWeXh6fkFrdVVlcWtRaXdCUS1OckZWZUMyaUJkZU9Rb0psSVFBQUFBJCQAAAAAAAAAAAEAAAAuLOnSwO7PyMmt1Ly6sgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAI61WmWOtVplcX; BDUSS_BFESS=FiRGh2OEhjSjVSYkRWeXh6fkFrdVVlcWtRaXdCUS1OckZWZUMyaUJkZU9Rb0psSVFBQUFBJCQAAAAAAAAAAAEAAAAuLOnSwO7PyMmt1Ly6sgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAI61WmWOtVplcX; H_PS_PSSID=39676_39678_39712_39779_39790_39703_39796_39686_39817_39664_39837_39843; H_WISE_SIDS=39676_39678_39712_39779_39790_39703_39796_39686_39817_39664_39837_39843; H_WISE_SIDS_BFESS=39676_39678_39712_39779_39790_39703_39796_39686_39817_39664_39837_39843; BDORZ=B490B5EBF6F3CD402E515D22BCDA1598; BAIDUID_BFESS=1BEB09EEC472DFB910E53E07CCF4745E:SL=0:NR=10:FG=1; Hm_lvt_f7b8c775c6c8b6a716a75df506fb72df=1700443541,1701395604; Hm_lpvt_f7b8c775c6c8b6a716a75df506fb72df=1701395604; XFI=699832a0-8fec-11ee-a9b6-2d501e616088; PHPSESSID=6s84md38fomisf3avh84eh7lv0; devStoken=34f48c468ca0d2150276aa7f95dd0960b1d9a41df144a91e04cee124d336caf7; bjhStoken=3d77e68f8d8c3b0f75a03120297f73f9b1d9a41df144a91e04cee124d336caf7; ab_sr=1.0.1_ODM0NTVjMzJlNDRjM2VhNzY3NWRjMzJlNTljYjdiNDE0OWY5YTQ5YzU0OGMzM2YyODIzYjZlNGZiNjcyZWM3N2Q2NGJhMjI2NzZlZGRjMWJkYzBjZTVkMGY1OTRiYzIxOGE5ZmIwNWE1M2Q5ZDgwNzUyMTYxYWMwNTk4MzcxMjVlNWVjYWY1MGZlNTUwYzIyMDIyOTVlMGFkYjU3ZjViNTkxM2MzZWQ5NTJkNGQwZjRkNzc2MmFmZjliM2ZjYWQx; __bid_n=18b7f9fc8362304a70a10c; openTabIndex=tab_top1; XFCS=D7EFA21FAE88885FCC676696078A61DD61D47217359681E46D8BC513B6D627B7; XFT=fmWc/YVHgtBSwVYRCqE0feZKbTkHmA+UGrEIM6wYz8M=; RT="z=1&dm=baidu.com&si=1c897bbb-f06e-4604-a9ae-d7b7c39d4f5a&ss=lplz0hcg&sl=6&tt=87g&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf&ld=1ilz&nu=rb8toha&cl=tsg"';

    const result = await getSingleDataOverviewStatisticAsync(cookie, '11876294052682509134', 'video');
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.errno).toBe(0);
  }, 10000000);

  test('获取百家号单篇报表', async () => {
    const cookie =
      'BIDUPSID=9C4A3617F56F0798AD4FF5D9B675F7EB; PSTM=1676382873; theme=bjh; gray=1; canary=0; BAIDUID=1BEB09EEC472DFB910E53E07CCF4745E:SL=0:NR=10:FG=1; MCITY=-158%3A; BDUSS=FiRGh2OEhjSjVSYkRWeXh6fkFrdVVlcWtRaXdCUS1OckZWZUMyaUJkZU9Rb0psSVFBQUFBJCQAAAAAAAAAAAEAAAAuLOnSwO7PyMmt1Ly6sgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAI61WmWOtVplcX; BDUSS_BFESS=FiRGh2OEhjSjVSYkRWeXh6fkFrdVVlcWtRaXdCUS1OckZWZUMyaUJkZU9Rb0psSVFBQUFBJCQAAAAAAAAAAAEAAAAuLOnSwO7PyMmt1Ly6sgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAI61WmWOtVplcX; H_PS_PSSID=39676_39678_39712_39779_39790_39703_39796_39686_39817_39664_39837_39843; H_WISE_SIDS=39676_39678_39712_39779_39790_39703_39796_39686_39817_39664_39837_39843; H_WISE_SIDS_BFESS=39676_39678_39712_39779_39790_39703_39796_39686_39817_39664_39837_39843; BDORZ=B490B5EBF6F3CD402E515D22BCDA1598; BAIDUID_BFESS=1BEB09EEC472DFB910E53E07CCF4745E:SL=0:NR=10:FG=1; Hm_lvt_f7b8c775c6c8b6a716a75df506fb72df=1700443541,1701395604; Hm_lpvt_f7b8c775c6c8b6a716a75df506fb72df=1701395604; XFI=699832a0-8fec-11ee-a9b6-2d501e616088; PHPSESSID=6s84md38fomisf3avh84eh7lv0; devStoken=34f48c468ca0d2150276aa7f95dd0960b1d9a41df144a91e04cee124d336caf7; bjhStoken=3d77e68f8d8c3b0f75a03120297f73f9b1d9a41df144a91e04cee124d336caf7; ab_sr=1.0.1_ODM0NTVjMzJlNDRjM2VhNzY3NWRjMzJlNTljYjdiNDE0OWY5YTQ5YzU0OGMzM2YyODIzYjZlNGZiNjcyZWM3N2Q2NGJhMjI2NzZlZGRjMWJkYzBjZTVkMGY1OTRiYzIxOGE5ZmIwNWE1M2Q5ZDgwNzUyMTYxYWMwNTk4MzcxMjVlNWVjYWY1MGZlNTUwYzIyMDIyOTVlMGFkYjU3ZjViNTkxM2MzZWQ5NTJkNGQwZjRkNzc2MmFmZjliM2ZjYWQx; __bid_n=18b7f9fc8362304a70a10c; openTabIndex=tab_top1; XFCS=D7EFA21FAE88885FCC676696078A61DD61D47217359681E46D8BC513B6D627B7; XFT=fmWc/YVHgtBSwVYRCqE0feZKbTkHmA+UGrEIM6wYz8M=; RT="z=1&dm=baidu.com&si=1c897bbb-f06e-4604-a9ae-d7b7c39d4f5a&ss=lplz0hcg&sl=6&tt=87g&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf&ld=1ilz&nu=rb8toha&cl=tsg"';

    const result = await getSingleDataOverview(cookie, '11876294052682509134', '20231117', '20231130', 'video');
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.errno).toBe(0);
    expect(result.data.list).length(14);
  }, 10000000);
});
