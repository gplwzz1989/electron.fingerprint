import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { getContentListAsync } from '@/media-platform/tengxunweishi/tengxunweishi-content-list.service';

describe('【Mock】', () => {
  describe('获取腾讯微视视频列表', () => {
    const server = setupServer(
      rest.get('https://media.weishi.qq.com*/media-api/getVideoList', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 0,
              msg: 'success',
              personDetail: {
                personId: '1586339338503863',
                avatar: 'http://avatar1.weishi.qq.com/bbccc03682b44dc79ed5506c03d2avatar_640.jpg',
                nickName: '修隐',
                fansNum: 46,
                interestNum: 5,
                receivePraiseNum: 321,
                lastUpdateTime: '0',
                totalVideoNum: '0',
                incVideoNum: '0',
                totalPlayVv: '0',
                incPlayVv: '0',
                incFansNum: '0',
              },
              feedDetailList: [
                {
                  feedId: '7gsopayVx1Qa48u2S',
                  wording: '',
                  video: {
                    fileId: 'gzc_5764_1047_0b53wig4qaanrmanv34b3bsbvmqezcza3sca',
                    fileSize: '5960230',
                    sha1: '704f31ef5eeefc636de5edf1f7e81a79f060d025',
                    duration: '35760',
                    width: 1280,
                    height: 720,
                    md5: '0b867e53c1d233ce9fe49d54549a2323',
                    orientation: 0,
                    isH265Hvc1: 0,
                  },
                  imgList: [
                    {
                      url: 'http://weishi.gtimg.com/upload/20230616/013080484357.jpeg',
                      width: 1280,
                      height: 720,
                    },
                  ],
                  playNum: 195,
                  commentNum: 1,
                  likeNum: 4,
                  isPublish: 1,
                  publishTime: '1686901486',
                  isLocked: 0,
                  isSyncToOm: 0,
                  desc: '妖比人懂事：西游记游客吵架牛魔王劝架 #主题公园#主题公园 ',
                  isLegal: 0,
                  isRecommed: true,
                  collectionID: '',
                  isPrePub: false,
                },
              ],
              isFinished: 0,
              attachInfo:
                '{"home_page_attach_info":"{\\"old_attach_info\\":\\"\\",\\"new_attach_info\\":\\"{\\\\\\"page_size\\\\\\":9,\\\\\\"position\\\\\\":18,\\\\\\"next_finish\\\\\\":false,\\\\\\"feed_id\\\\\\":\\\\\\"7gsopayVx1NVvm8AS\\\\\\"}\\"}","home_page_is_finish":false,"pre_attach_info":{"begin_ts":9999999999,"is_finish":true}}',
              total: 0,
              feedId: '',
            }),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const result = await getContentListAsync('success', '', '');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(0);
        expect(result).toHaveProperty('isFinished');
        expect(result.feedDetailList).length(1);
        expect(result).toHaveProperty('feedDetailList[0].feedId', '7gsopayVx1Qa48u2S');
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('获取腾讯微视视频列表', async () => {
    const cookie =
      'pac_uid=0_c2b637e12e21c; iip=0; ptui_loginuin=33325126; RK=mH2YkWa5H4; ptcz=9e3b6d78d2eadb7eb1284a327cf3cc5de6c3db259c8487942655dc70cf7d57f3; _qpsvr_localtk=0.08298283979979981; accessToken=73_NG9vdxVkOWuQ_96lZSmQSgeyFoblAPm-21oqug3hFnyN6uMyDbSeBPQFF6EqWRZmfYNXFccyU12mtpULv3UZdS7Hk_XeTsuezooLV3RklCE; sThrAppid=wx4e681083a33bb413; iAuthType=3; openid=osjlD5kL01dLNOEUp32Kjm33XLBc; w_openid=osjlD5kL01dLNOEUp32Kjm33XLBc; refreshToken=73_112eD2ptMCkxJp1vLWsl3PipLOSF30zMO6Y3AE2HJ6X5-ItRfhDnE-p2_ah9o5gHQJuC2XnfDPfyAnohEj4zvHog8ffFVq_ClUvFwiVaJaI; person_id=1586339338503863';

    const result = await getContentListAsync(cookie, '1586339338503863', '');
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);
});
