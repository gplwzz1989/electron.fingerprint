import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { getContentListAsync } from '@/media-platform/haokanshipin/haokanshipin-content-list.service';

describe('【Mock】', () => {
  describe('获取好看视频作品列表', () => {
    const server = setupServer(
      rest.get('https://dream.haokan.com*/creator/pccontentlist', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              timestamp: 1698203911,
              logid: '1111111838',
              status: 0,
              msg: '',
              data: {
                user_role: 'pgc',
                pageNum: 2,
                list: [
                  {
                    nid: '13034964099391201251',
                    mark_num: 0,
                    sticker_mark_show: false,
                    triplet_stickers_num: 0,
                    goods_stickers_num: 0,
                    interact_sticker_button_status: 'add',
                    interact_sticker_button_tips: '',
                    goods_num: 0,
                    video_type: '1',
                    publish_time: '1693563186',
                    publish_time_text: '2023-09-01 18:13:06',
                    top_tag: 2,
                    ucenter_production_status: 'publish',
                    ucenter_production_status_text: '已发布',
                    thread_id: '1047000059735199',
                    title: '等了3年的房子终于验收咯',
                    pre_publish_time: 0,
                    cover_src: 'https://f7.baidu.com/it/u=1290982175,591041338&fm=222&app=106&f=JPEG',
                    duration: 28,
                    duration_text: '00:28',
                    can_withdraw: 1,
                    show_edit: 1,
                    no_edit_reason: '发布15天以上不能修改',
                    feo_type: 0,
                    topic_list: [],
                    original_status: 0,
                    first_status_text: '',
                    first_status_color: '',
                    second_audit_text: '',
                    third_op_text: '',
                    third_op_url: '',
                    third_op_pc: 0,
                    has_edited: 0,
                    auditMsg: '',
                    audit_and_appeal: {
                      audit_msg: '',
                      duplicate_nid: '',
                      audit_guide_url: '',
                      article_audit_msg: '',
                      unDisplay: false,
                      appeal_status: 0,
                      appeal_url: '',
                      appeal_time: '',
                      appeal_result: 0,
                      reminder: 0,
                    },
                    play_cnt: 116,
                    play_cnt_text: '116',
                    video_role: 'pgc',
                    production_recommend_cnt: 709,
                    production_recommend_cnt_text: '709',
                    comment_cnt: 3,
                    comment_cnt_text: '3',
                    praise_cnt: 0,
                    praise_cnt_text: 0,
                    collect_cnt: 0,
                    collect_cnt_text: 0,
                    share_cnt: 0,
                    share_cnt_text: 0,
                    is_set_selected: 0,
                    unselected_message: '',
                    time_length: '00:00:28',
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
        const result = await getContentListAsync('success', '', 1, 20);
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.status).toBe(0);
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('获取好看视频作品列表', async () => {
    const cookie =
      'BDUSS=AwekU1MGpscXNtWFVKU0FNbGlGNE9YU2JkaXhwV1Etc1o0QWNiUlA5N3FFbUJsSVFBQUFBJCQAAAAAAAAAAAEAAAB0BbF8ueLXxcaoucm1xL3F0b4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOqFOGXqhThlRj; RT="z=1&dm=haokan.com&si=59e322b7-ce63-4392-b07d-d2481cfa24c2&ss=lo569q57&sl=c&tt=7ys&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf&ld=d6y7&nu=3ozua3c&cl=5zkq"';

    const result = await getContentListAsync(cookie, '', 1, 10);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.status).toBe(0);
  }, 10000000);
});
