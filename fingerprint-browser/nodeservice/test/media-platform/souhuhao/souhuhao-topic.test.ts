import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { getSouhuhaoTopicAsync } from '../../../src/media-platform/souhuhao/souhuhao-topic.service';

describe('【Mock】', () => {
  describe('获取搜狐号视频话题列表', () => {
    const server = setupServer(
      rest.get('https://mp.sohu.com*/mpbp/bp/news/v4/label/topic/list', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              data: [
                {
                  id: null,
                  name: '徐娇赵晴微信都没有',
                  type: 2,
                },
                {
                  id: null,
                  name: '虞书欣工作室致歉',
                  type: 2,
                },
                {
                  id: null,
                  name: '徐娇喝到真茶了',
                  type: 2,
                },
                {
                  id: null,
                  name: '汪峰 陈露',
                  type: 2,
                },
                {
                  id: null,
                  name: '王大陆与女友边吃火锅边亲吻',
                  type: 2,
                },
                {
                  id: null,
                  name: '交警通报虞书欣司机高速倒车',
                  type: 2,
                },
                {
                  id: null,
                  name: '曝95生当着媒体在室内抽烟',
                  type: 2,
                },
                {
                  id: null,
                  name: '大张伟 贾仙女让我做首健身时打气的歌',
                  type: 2,
                },
                {
                  id: null,
                  name: '迪丽热巴王安宇互相吓唬',
                  type: 2,
                },
                {
                  id: null,
                  name: '2023媒体反感艺人TOP3',
                  type: 2,
                },
              ],
              code: 2000000,
              msg: '',
              success: true,
            }),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const result = await getSouhuhaoTopicAsync('success', 1, '');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(2000000);
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('获取搜狐号视频话题列表', async () => {
    const cookie =
      'IPLOC=CN3210;cld=20240126091904;jv=b35a16bfea9740d74339aadb6f27d66e-Pz86bo1u1706231968506;gidinf=x099980109ee181cbc23db062000600a6d012a076ab1;clt=1706231944;tgw_l7_route=d130a8ed883f0fe15c57cdb74b5e2881;_dfp=C4bBuE9+5tuQdGN66qIUvXmgel18n/btqmarFUNE0iU=;ppinf=2|1706231968|1707441568|bG9naW5pZDowOnx1c2VyaWQ6Mjg6MTUwNDY0NjM4MDMwNjg0MTYwMEBzb2h1LmNvbXxzZXJ2aWNldXNlOjMwOjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMHxjcnQ6MTA6MjAyNC0wMS0yNnxlbXQ6MTowfGFwcGlkOjY6MTEzODA1fHRydXN0OjE6MXxwYXJ0bmVyaWQ6MTowfHJlbGF0aW9uOjA6fHV1aWQ6MTY6c2EwZDkwYzVlZGNmYmQ4M3x1aWQ6MTY6c2EwZDkwYzVlZGNmYmQ4M3x1bmlxbmFtZTowOnw;ppmdig=170625208700000031bb94694fdb9b7df4d6a277cffab6f0;pprdig=ZtjaAg471xtNUjfy2NHPhS1MrzfQw0_OtsDwnAb1sKAHZorNWDkfIxcDrf_JrbeJ35WgBI6hlXuVr0NckhUkp5eeIfxNYg6rs064FLduQQPBvme7dUc_Y5fvmHh00lQLPsHcTUGkJxLswU1P2xgKxbPRnKofW2wkkYPuGiaEK-c;reqtype=pc;SUV=1703080202864bvs2z6;t=1706234058704';

    const result = await getSouhuhaoTopicAsync(cookie, 121349544, '短句');
    console.debug(result);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(2000000);
  }, 10000000);
});
