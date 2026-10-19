import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { getContentListAsync } from '../../../src/media-platform/bilibili/bilibili-content-list.service';

describe('【Mock】', () => {
  describe('获取b站稿件列表', () => {
    const server = setupServer(
      rest.get('https://member.bilibili.com*/x/web/archives', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 0,
              message: '0',
              ttl: 1,
              data: {
                class: {
                  pubed: 2,
                  not_pubed: 0,
                  is_pubing: 0,
                },
                apply_count: {
                  neglected: 0,
                  pending: 0,
                  processed: 0,
                },
                archives: null,
                arc_audits: [
                  {
                    Archive: {
                      aid: 997640958,
                      bvid: 'BV14s4y1C76o',
                      mid: 695912275,
                      tid: 242,
                      tp_info: null,
                      title: '30926deabea450883b',
                      author: '',
                      cover: 'http://i0.hdslb.com/bfs/archive/b9cd759050c8f1c290340091d1ea71c59dd5b24f.jpg',
                      reject_reason: '',
                      reject_reason_url: '',
                      modify_advise: '',
                      problem_description: '',
                      problem_description_title: '',
                      reject_reason_id: 0,
                      tag: '万物皆可KPOP2.0,标签,SEVENTEEN《Super》安利挑战',
                      duration: 13,
                      copyright: 1,
                      no_reprint: 1,
                      ugcpay: 0,
                      order_id: 0,
                      order_name: '',
                      adorder_id: 0,
                      adorder_name: '',
                      adorder_no: '',
                      adorder_state: null,
                      online_time: 0,
                      desc: '30926deabea450883b',
                      mission_id: 1475964,
                      mission_name: '',
                      forward: 0,
                      attribute: 0,
                      state: 0,
                      state_desc: '开放浏览',
                      state_panel: 0,
                      source: '',
                      desc_format_id: 0,
                      attrs: {
                        is_coop: 0,
                        is_owner: 1,
                        is_dynamic: 0,
                        is_360: 0,
                        no_public: 0,
                        live: 0,
                        is_premiere: 0,
                        is_played: 0,
                      },
                      porder: null,
                      dynamic: '',
                      poi_object: null,
                      dtime: 0,
                      ptime: 1687816800,
                      ctime: 1687654128,
                      ugcpay_info: null,
                      staffs: null,
                      vote: null,
                      activity: null,
                      interactive: 0,
                      hl: null,
                      no_background: 0,
                      dynamic_video: 0,
                      no_public: 0,
                      is_360: 0,
                      bs_editor: 0,
                      up_from: 0,
                      desc_v2: null,
                      dynamic_v2: null,
                      limit_state: false,
                      appeal: '',
                      appeal_state: 0,
                      premiere: 0,
                      is_ugcpay_v2: 0,
                      political_media: 0,
                      political_editable: 0,
                      charging_pay: 0,
                    },
                    Videos: [],
                    stat: {
                      aid: 997640958,
                      view: 112,
                      danmaku: 0,
                      reply: 0,
                      favorite: 0,
                      coin: 0,
                      share: 0,
                      now_rank: 0,
                      his_rank: 0,
                      like: 1,
                      dislike: 0,
                      vt: 0,
                      vv: 112,
                    },
                    state_panel: 0,
                    parent_tname: '娱乐',
                    typename: '粉丝创作',
                    open_appeal: 0,
                    fast_pub: null,
                    captions_count: 0,
                    ai_captions_count: 0,
                    activity: null,
                    app_rules: null,
                    hl: null,
                    honors: null,
                    bs_editor: [],
                    copyright: null,
                    display_fields: [
                      {
                        name: 'view',
                        desc: '播放',
                        value: 112,
                        icon_url: {
                          normal: 'https://s1.hdslb.com/bfs/templar/york-static/qAnTDC0DSpuds9Rv.png',
                          night: 'https://s1.hdslb.com/bfs/templar/york-static/qAnTDC0DSpuds9Rv.png',
                        },
                      },
                      {
                        name: 'like',
                        desc: '点赞',
                        value: 1,
                        icon_url: {
                          normal: 'https://s1.hdslb.com/bfs/templar/york-static/wOdLWtIVZ2XE9vNZ.png',
                          night: 'https://s1.hdslb.com/bfs/templar/york-static/wOdLWtIVZ2XE9vNZ.png',
                        },
                      },
                      {
                        name: 'danmaku',
                        desc: '弹幕',
                        value: 0,
                        icon_url: {
                          normal: 'https://s1.hdslb.com/bfs/templar/york-static/lp4R9JrVm7Xk63vy.png',
                          night: 'https://s1.hdslb.com/bfs/templar/york-static/lp4R9JrVm7Xk63vy.png',
                        },
                      },
                      {
                        name: 'reply',
                        desc: '评论',
                        value: 0,
                        icon_url: {
                          normal: 'https://s1.hdslb.com/bfs/templar/york-static/IuXtxcG3v5O8to0K.png',
                          night: 'https://s1.hdslb.com/bfs/templar/york-static/IuXtxcG3v5O8to0K.png',
                        },
                      },
                      {
                        name: 'coin',
                        desc: '硬币',
                        value: 0,
                        icon_url: {
                          normal: 'https://s1.hdslb.com/bfs/templar/york-static/QUYSPlIn2NJpI6TB.png',
                          night: 'https://s1.hdslb.com/bfs/templar/york-static/QUYSPlIn2NJpI6TB.png',
                        },
                      },
                      {
                        name: 'fav',
                        desc: '收藏',
                        value: 0,
                        icon_url: {
                          normal: 'https://s1.hdslb.com/bfs/templar/york-static/RPCS9YBWZUQgypok.png',
                          night: 'https://s1.hdslb.com/bfs/templar/york-static/RPCS9YBWZUQgypok.png',
                        },
                      },
                      {
                        name: 'share',
                        desc: '分享',
                        value: 0,
                        icon_url: {
                          normal: 'https://s1.hdslb.com/bfs/templar/york-static/929bYp7TSIAecSPG.png',
                          night: 'https://s1.hdslb.com/bfs/templar/york-static/929bYp7TSIAecSPG.png',
                        },
                      },
                    ],
                  },
                ],
                page: {
                  pn: 1,
                  ps: 10,
                  count: 2,
                },
                tip: '',
                interact_test: false,
                rich_tip: null,
                copyright_banner: {
                  state: 0,
                  ignore_cnt: 0,
                  ignore_limit: 0,
                  expose_cnt: 0,
                  expose_limit: 0,
                },
                play_type: 1,
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
        const result = await getContentListAsync('success', 1, 1);
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(0);
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('获取b站稿件列表', async () => {
    const cookie = '';

    const result = await getContentListAsync(cookie, 1, 10);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);
});
