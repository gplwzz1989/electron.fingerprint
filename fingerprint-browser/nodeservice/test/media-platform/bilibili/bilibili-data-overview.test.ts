import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import {
  getDataOverviewAsync,
  getDataOverviewCoreAsync,
} from '@/media-platform/bilibili/bilibili-data-overview.service';

describe('【Mock】', () => {
  describe('获取b站数据列表', () => {
    const server = setupServer(
      rest.get('https://member.bilibili.com*/x/web/data/v2/overview/stat/graph', (req, res, context) => {
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
                tendency: [
                  {
                    date_key: 1689868800,
                    total_inc: 196,
                    sub_total_inc: 0,
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
        const result = await getDataOverviewAsync('success', 0, 'play');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(0);
      });
    });
  });

  describe('获取b站核心数据', () => {
    const server = setupServer(
      rest.get('https://member.bilibili.com*/x/web/data/v2/overview/stat/num', (req, res, context) => {
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
                play: 216,
                play_last: 0,
                visitor: 0,
                visitor_last: 0,
                fan: 1,
                fan_last: 0,
                like: 0,
                like_last: 0,
                fav: 0,
                fav_last: 0,
                coin: 0,
                coin_last: 0,
                dm: 0,
                dm_last: 0,
                comment: 0,
                comment_last: 0,
                share: 0,
                share_last: 0,
                elec: 0,
                elec_last: 0,
                vt: 0,
                vt_last: 0,
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
        const result = await getDataOverviewCoreAsync('success');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(0);
      });
    });
  });
});

describe.runIf(true)('【真实测试】', () => {
  test('获取b站数据列表', async () => {
    const cookie =
      "buvid3=1A87FD69-E123-E062-BEAA-43ED8C04BCAF13811infoc; b_nut=1758181613; buvid_fp=ca884197b0e55ac5e1e3efa4bb441b26; SESSDATA=fbfc4f6e%2C1773733626%2Cb29e4%2A92CjDtHjGRP2n0mSXyVixwmHMYejzXvLD8ieNRS7BSLZblaX6K-3vrW6_e2PeDbggAcN0SVkxYTVZlaV9TQlFZOWVlOHA0Slc0WmNMRUY1MFh2MlRwUGtMMDNxLThfeUVFNXNPX2JwMkM4WkFpOGNmOE9lb0RScG5wczBaWEdYZ1JZbGxzSk1tNE5BIIEC; bili_jct=c2512c840827422a20f59952a95769c4; DedeUserID=401253285; DedeUserID__ckMd5=ba6d48fa993ce777; sid=q9ob9rgz; _uuid=6D710A5110-B6F3-23A7-936D-39F4977A5F7623639infoc; enable_web_push=DISABLE; home_feed_column=5; browser_resolution=1920-960; theme-tip-show=SHOWED; buvid4=F27BACAD-546F-290C-5C2F-73B201ABB9D914435-025091815-oXXAX2v2saks+S4HadIvsw%3D%3D; b_lsid=4E54106AB_19B26AFCB94";

    const result = await getDataOverviewAsync(cookie, 1, 'like');
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取b站核心数据', async () => {
    const cookie =
      'buvid4=19B02227-1950-F658-32EB-1F8EAF4B9EDE92334-023091523-5dhZmvKtOm7dHgpkfAe7xA%3D%3D; buvid3=A5F0727D-5575-93A6-264F-AE47C45AD90495352infoc; b_nut=1694792493; PVID=1; _uuid=1210ACF1F-E6A3-6EF1-D374-FA38184210CD700135infoc; header_theme_version=CLOSE; home_feed_column=5; browser_resolution=1536-707; buvid_fp=37dcace2a3bf65c7487915629d5e0157; SESSDATA=0fb50641%2C1710836464%2C0afe8%2A91CjBkKOVG4DcLxtf6oaLsTt0rronClNY0_K31p2piCI3YqURihEsuKpT9zG3up3MVdJwSVk5pWUdDMF8xbmZaNHVMNUcxOWpYRDZTX19oVzYwcnVXNVRkWEFGVUUtOG9SUlJWcU9ndS1SMGtOUFVPOW8yVEJYYTJfb1NoZm5vWE1hSGc1VlNoSTB3IIEC; bili_jct=898fbf8971ecfc28d34e9b792f056760; DedeUserID=695912275; DedeUserID__ckMd5=512b609aa6a877b8; sid=747mmxbr; bp_video_offset_695912275=811656052212760630; innersign=0; b_lsid=10198F1038_18B46E7E10F; enable_web_push=DISABLE';

    const result = await getDataOverviewCoreAsync(cookie);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});
