import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { getContentListAsync } from '@/media-platform/miaopai/miaopai-content-list.service';

describe('【Mock】', () => {
  describe('获取秒拍视频列表', () => {
    const server = setupServer(
      rest.get('https://creator.miaopai.com*/video/getList', (req, res, context) => {
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
                    scid: '8LaK4AYZJXcWM5Zoo7jLXSjGJpQHKmiIyobx3A__',
                    video_url: 'http://n.miaopai.com/media/9Or6hSOVyt32QVBUVzABWFqDCyFEZDyK',
                    title: '魔改配音，感觉还是差了点意思，将就下算了喽~',
                    desc: '魔改配音，感觉还是差了点意思，将就下算了喽~',
                    cover: 'http://imgaliyuncdn.miaopai.com/images/8LaK4AYZJXcWM5Zoo7jLXSjGJpQHKmiIyobx3A___M38K_4.jpg',
                    img: '',
                    category: [
                      {
                        channel_id: '7123501186115702784',
                        category_id: '5',
                        cname: '搞笑',
                      },
                    ],
                    topicinfo: [],
                    stream_url: '',
                    qr_url: 'video/qr?scid=8LaK4AYZJXcWM5Zoo7jLXSjGJpQHKmiIyobx3A__',
                    createtime: '2023-10-27 10:52:08',
                    height: 1080,
                    weight: 1430,
                    channel_status: 1,
                    flvid: '',
                    upload_type: '1',
                    tags: [],
                    has_ad: 0,
                    is_original: 0,
                    is_serialize: 0,
                    origin_complain: 0,
                    original_appeal: 0,
                    cover_filter: 0,
                    length: '0:00:38',
                    nc: 0,
                    anid: 0,
                    similar: 0,
                    edit_count: 0,
                    rmdStatus: 2,
                    rmdLable: [],
                    queueVideoInfo: 0,
                    retry: 0,
                    vcnt: 0,
                    ccnt: 0,
                    lcnt: 0,
                    scnt: 0,
                    fcnt: 0,
                    click_rate: '0%',
                    play_complete_rate: '0%',
                    show_num: '0',
                    play_num: 0,
                    up_num: 0,
                    comment_num: '0',
                    average_play_duration: '0秒',
                    qa_info: null,
                  },
                ],
                total: 38,
                page: '1',
                count: '1',
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
        expect(result.code).toBe(200);
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('获取秒拍视频列表', async () => {
    const cookie =
      'PHPSESSID=ac429e9f509040274b2f9fc94ea66310; weiba_captcha=257a5113d395c54ace400d5d43454216; SRV_CREATOR_COOKIE_LOGIN_TOKEN=a2HGavOKijyxnFtw9yLy5V5FNmB5LlruAIbcwJwXU2uFS%7Eed';

    const result = await getContentListAsync(cookie, 1, 10);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(200);
  }, 10000000);
});
