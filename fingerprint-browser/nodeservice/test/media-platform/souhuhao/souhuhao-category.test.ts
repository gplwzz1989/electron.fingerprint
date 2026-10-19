import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import {
  getSouhuhaoSubVideoCategoryAsync,
  getSouhuVideoCategoryAsync,
} from '../../../src/media-platform/souhuhao/souhuhao-category.service';
import { getSouhuhaoVideoCategory } from '../../../src/media-platform/souhuhao/souhuhao-common';
import { QueryWorker } from '../../../src/cloud/task/taskService';
import { Platforms } from '../../../src';

describe('【Mock】', () => {
  describe('获取搜狐号视频一级分类', () => {
    const server = setupServer(
      rest.get('https://mp.sohu.com*/mpbp/bp/account/common/channels-data-api', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json([
              {
                id: 10,
                name: '军事',
                cmsChannelId: 207,
                cmsPName: '其它专区',
                createTime: null,
                status: 1,
                level: 10,
              },
              {
                id: 12,
                name: '文化',
                cmsChannelId: 223,
                cmsPName: '其它专区',
                createTime: null,
                status: 1,
                level: 12,
              },
              {
                id: 13,
                name: '历史',
                cmsChannelId: 711,
                cmsPName: '其它专区',
                createTime: null,
                status: 1,
                level: 13,
              },
              {
                id: 15,
                name: '财经',
                cmsChannelId: 104,
                cmsPName: '财经专区',
                createTime: null,
                status: 1,
                level: 15,
              },
              {
                id: 17,
                name: '体育',
                cmsChannelId: 102,
                cmsPName: '体育栏目',
                createTime: null,
                status: 1,
                level: 17,
              },
              {
                id: 18,
                name: '汽车',
                cmsChannelId: 106,
                cmsPName: '汽车专栏',
                createTime: null,
                status: 1,
                level: 18,
              },
              {
                id: 19,
                name: '娱乐',
                cmsChannelId: 115,
                cmsPName: '其它专区',
                createTime: null,
                status: 1,
                level: 19,
              },
              {
                id: 23,
                name: '时尚',
                cmsChannelId: 750,
                cmsPName: '时尚专区',
                createTime: null,
                status: 1,
                level: 23,
              },
              {
                id: 24,
                name: '健康',
                cmsChannelId: 114,
                cmsPName: '健康专栏',
                createTime: null,
                status: 1,
                level: 26,
              },
              {
                id: 25,
                name: '教育',
                cmsChannelId: 105,
                cmsPName: '教育栏目',
                createTime: null,
                status: 1,
                level: 27,
              },
              {
                id: 26,
                name: '母婴',
                cmsChannelId: 128,
                cmsPName: '母婴',
                createTime: null,
                status: 1,
                level: 28,
              },
              {
                id: 27,
                name: '星座',
                cmsChannelId: 126,
                cmsPName: '星座专栏',
                createTime: null,
                status: 1,
                level: 29,
              },
              {
                id: 28,
                name: '美食',
                cmsChannelId: 221,
                cmsPName: '美食专栏',
                createTime: null,
                status: 1,
                level: 30,
              },
              {
                id: 29,
                name: '旅游',
                cmsChannelId: 120,
                cmsPName: '旅游专栏',
                createTime: null,
                status: 1,
                level: 31,
              },
              {
                id: 30,
                name: '科技',
                cmsChannelId: 107,
                cmsPName: 'IT栏目',
                createTime: null,
                status: 1,
                level: 32,
              },
              {
                id: 31,
                name: '情感',
                cmsChannelId: 111,
                cmsPName: '情感专区',
                createTime: null,
                status: 1,
                level: 33,
              },
              {
                id: 34,
                name: '其它',
                cmsChannelId: 104,
                cmsPName: '其它专区',
                createTime: null,
                status: 1,
                level: 38,
              },
              {
                id: 38,
                name: '公益',
                cmsChannelId: 266,
                cmsPName: '公益栏目',
                createTime: null,
                status: 1,
                level: 37,
              },
              {
                id: 40,
                name: '警法',
                cmsChannelId: 490,
                cmsPName: '其它专区',
                createTime: null,
                status: 1,
                level: 38,
              },
              {
                id: 41,
                name: '动漫',
                cmsChannelId: 201,
                cmsPName: '动漫栏目',
                createTime: null,
                status: 1,
                level: 41,
              },
              {
                id: 42,
                name: '游戏',
                cmsChannelId: 245,
                cmsPName: '游戏专栏',
                createTime: null,
                status: 1,
                level: 42,
              },
              {
                id: 43,
                name: '生活',
                cmsChannelId: 206,
                cmsPName: '其它专区',
                createTime: null,
                status: 1,
                level: 43,
              },
              {
                id: 44,
                name: '宠物',
                cmsChannelId: 121,
                cmsPName: '其它专区',
                createTime: null,
                status: 1,
                level: 44,
              },
              {
                id: 45,
                name: '搞笑',
                cmsChannelId: 302,
                cmsPName: '其它专区',
                createTime: null,
                status: 1,
                level: 45,
              },
              {
                id: 46,
                name: '政务',
                cmsChannelId: 103,
                cmsPName: '其他专区',
                createTime: null,
                status: 1,
                level: 46,
              },
              {
                id: 48,
                name: '三农',
                cmsChannelId: 0,
                cmsPName: '',
                createTime: null,
                status: 1,
                level: 0,
              },
            ]),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const result = await getSouhuVideoCategoryAsync('success', 1);
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
      });
    });
  });

  describe('获取搜狐号视频二级分类', () => {
    const server = setupServer(
      rest.get('https://mp.sohu.com*/mpbp/bp/news/v4/videoChannels', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              data: [
                {
                  id: 4,
                  name: '军事',
                  channelId: 10,
                  status: 1,
                  createdTime: 1556178834000,
                },
                {
                  id: 5,
                  name: '收藏鉴宝',
                  channelId: 12,
                  status: 1,
                  createdTime: 1556244572000,
                },
                {
                  id: 6,
                  name: '农人',
                  channelId: 12,
                  status: 1,
                  createdTime: 1556244572000,
                },
                {
                  id: 7,
                  name: '历史',
                  channelId: 13,
                  status: 1,
                  createdTime: 1556244712000,
                },
                {
                  id: 8,
                  name: '足球',
                  channelId: 17,
                  status: 1,
                  createdTime: 1556244933000,
                },
                {
                  id: 9,
                  name: '篮球',
                  channelId: 17,
                  status: 1,
                  createdTime: 1556244933000,
                },
                {
                  id: 10,
                  name: '排球',
                  channelId: 17,
                  status: 1,
                  createdTime: 1556244933000,
                },
                {
                  id: 11,
                  name: '羽毛球',
                  channelId: 17,
                  status: 1,
                  createdTime: 1556244933000,
                },
                {
                  id: 12,
                  name: '马拉松',
                  channelId: 17,
                  status: 1,
                  createdTime: 1556244933000,
                },
                {
                  id: 13,
                  name: '极限运动',
                  channelId: 17,
                  status: 1,
                  createdTime: 1556244933000,
                },
                {
                  id: 14,
                  name: '户外',
                  channelId: 17,
                  status: 1,
                  createdTime: 1556244933000,
                },
                {
                  id: 15,
                  name: '小众运动',
                  channelId: 17,
                  status: 1,
                  createdTime: 1556244933000,
                },
                {
                  id: 16,
                  name: '健身',
                  channelId: 17,
                  status: 1,
                  createdTime: 1556244933000,
                },
                {
                  id: 17,
                  name: '汽车体验',
                  channelId: 18,
                  status: 1,
                  createdTime: 1556245012000,
                },
                {
                  id: 18,
                  name: '车模车展',
                  channelId: 18,
                  status: 1,
                  createdTime: 1556245012000,
                },
                {
                  id: 19,
                  name: '行车安全',
                  channelId: 18,
                  status: 1,
                  createdTime: 1556245012000,
                },
                {
                  id: 20,
                  name: '赛车',
                  channelId: 18,
                  status: 1,
                  createdTime: 1556245012000,
                },
                {
                  id: 21,
                  name: '明星八卦',
                  channelId: 19,
                  status: 1,
                  createdTime: 1556245311000,
                },
                {
                  id: 22,
                  name: '娱乐报道',
                  channelId: 19,
                  status: 1,
                  createdTime: 1556245311000,
                },
                {
                  id: 23,
                  name: '原创节目',
                  channelId: 19,
                  status: 1,
                  createdTime: 1556245311000,
                },
                {
                  id: 24,
                  name: '花絮片段',
                  channelId: 19,
                  status: 1,
                  createdTime: 1556245311000,
                },
                {
                  id: 25,
                  name: '影评',
                  channelId: 19,
                  status: 1,
                  createdTime: 1556245311000,
                },
                {
                  id: 26,
                  name: '音乐',
                  channelId: 19,
                  status: 1,
                  createdTime: 1556245311000,
                },
                {
                  id: 27,
                  name: '街拍',
                  channelId: 23,
                  status: 1,
                  createdTime: 1556245471000,
                },
                {
                  id: 28,
                  name: '穿搭',
                  channelId: 23,
                  status: 1,
                  createdTime: 1556245471000,
                },
                {
                  id: 29,
                  name: '男神',
                  channelId: 23,
                  status: 1,
                  createdTime: 1556245471000,
                },
                {
                  id: 30,
                  name: '女神',
                  channelId: 23,
                  status: 1,
                  createdTime: 1556245471000,
                },
                {
                  id: 31,
                  name: '美容',
                  channelId: 23,
                  status: 1,
                  createdTime: 1556245471000,
                },
                {
                  id: 32,
                  name: '美妆',
                  channelId: 23,
                  status: 1,
                  createdTime: 1556245471000,
                },
                {
                  id: 33,
                  name: '美发',
                  channelId: 23,
                  status: 1,
                  createdTime: 1556245471000,
                },
                {
                  id: 34,
                  name: '手工',
                  channelId: 23,
                  status: 1,
                  createdTime: 1556245471000,
                },
                {
                  id: 35,
                  name: '绘画',
                  channelId: 23,
                  status: 1,
                  createdTime: 1556245471000,
                },
                {
                  id: 36,
                  name: '舞蹈',
                  channelId: 23,
                  status: 1,
                  createdTime: 1556245471000,
                },
                {
                  id: 37,
                  name: '素人表演',
                  channelId: 23,
                  status: 1,
                  createdTime: 1556245471000,
                },
                {
                  id: 38,
                  name: '魔术',
                  channelId: 23,
                  status: 1,
                  createdTime: 1556245471000,
                },
                {
                  id: 39,
                  name: '健康',
                  channelId: 24,
                  status: 1,
                  createdTime: 1556245606000,
                },
                {
                  id: 40,
                  name: '早教',
                  channelId: 25,
                  status: 1,
                  createdTime: 1556245710000,
                },
                {
                  id: 41,
                  name: '心理学',
                  channelId: 25,
                  status: 1,
                  createdTime: 1556245710000,
                },
                {
                  id: 42,
                  name: '语言学习',
                  channelId: 25,
                  status: 1,
                  createdTime: 1556245710000,
                },
                {
                  id: 43,
                  name: '中小学教育',
                  channelId: 25,
                  status: 1,
                  createdTime: 1556245710000,
                },
                {
                  id: 44,
                  name: '高等教育',
                  channelId: 25,
                  status: 1,
                  createdTime: 1556245710000,
                },
                {
                  id: 45,
                  name: '职场教育',
                  channelId: 25,
                  status: 1,
                  createdTime: 1556245710000,
                },
                {
                  id: 46,
                  name: '科普',
                  channelId: 25,
                  status: 1,
                  createdTime: 1556245710000,
                },
                {
                  id: 47,
                  name: '知识百科',
                  channelId: 25,
                  status: 1,
                  createdTime: 1556245710000,
                },
                {
                  id: 48,
                  name: '美食',
                  channelId: 28,
                  status: 1,
                  createdTime: 1556245897000,
                },
                {
                  id: 49,
                  name: '旅游',
                  channelId: 29,
                  status: 1,
                  createdTime: 1556245942000,
                },
                {
                  id: 50,
                  name: '手机',
                  channelId: 30,
                  status: 1,
                  createdTime: 1556246033000,
                },
                {
                  id: 51,
                  name: '电脑',
                  channelId: 30,
                  status: 1,
                  createdTime: 1556246033000,
                },
                {
                  id: 52,
                  name: '黑科技',
                  channelId: 30,
                  status: 1,
                  createdTime: 1556246033000,
                },
                {
                  id: 53,
                  name: '其他',
                  channelId: 34,
                  status: 1,
                  createdTime: 1556246089000,
                },
                {
                  id: 54,
                  name: '动漫',
                  channelId: 41,
                  status: 1,
                  createdTime: 1556246208000,
                },
                {
                  id: 55,
                  name: '卡通短剧',
                  channelId: 41,
                  status: 1,
                  createdTime: 1556246208000,
                },
                {
                  id: 56,
                  name: '游戏',
                  channelId: 42,
                  status: 1,
                  createdTime: 1556246262000,
                },
                {
                  id: 57,
                  name: '开箱',
                  channelId: 43,
                  status: 1,
                  createdTime: 1556246465000,
                },
                {
                  id: 58,
                  name: '生活百态',
                  channelId: 43,
                  status: 1,
                  createdTime: 1556246465000,
                },
                {
                  id: 59,
                  name: '生活技巧',
                  channelId: 43,
                  status: 1,
                  createdTime: 1556246465000,
                },
                {
                  id: 60,
                  name: '摄影',
                  channelId: 43,
                  status: 1,
                  createdTime: 1556246465000,
                },
                {
                  id: 61,
                  name: '家居',
                  channelId: 43,
                  status: 1,
                  createdTime: 1556246465000,
                },
                {
                  id: 62,
                  name: '花卉绿植',
                  channelId: 43,
                  status: 1,
                  createdTime: 1556246465000,
                },
                {
                  id: 63,
                  name: '艺术设计',
                  channelId: 43,
                  status: 1,
                  createdTime: 1556246465000,
                },
                {
                  id: 64,
                  name: '情感',
                  channelId: 43,
                  status: 1,
                  createdTime: 1556246465000,
                },
                {
                  id: 65,
                  name: '街访',
                  channelId: 43,
                  status: 1,
                  createdTime: 1556246465000,
                },
                {
                  id: 66,
                  name: '正能量',
                  channelId: 43,
                  status: 1,
                  createdTime: 1556246465000,
                },
                {
                  id: 67,
                  name: '运势',
                  channelId: 43,
                  status: 1,
                  createdTime: 1556246465000,
                },
                {
                  id: 68,
                  name: '动物',
                  channelId: 43,
                  status: 1,
                  createdTime: 1556246465000,
                },
                {
                  id: 69,
                  name: '宠物',
                  channelId: 44,
                  status: 1,
                  createdTime: 1556246631000,
                },
                {
                  id: 70,
                  name: '恶搞',
                  channelId: 45,
                  status: 1,
                  createdTime: 1556246763000,
                },
                {
                  id: 71,
                  name: '搞笑段子',
                  channelId: 45,
                  status: 1,
                  createdTime: 1556246763000,
                },
                {
                  id: 72,
                  name: '相声小品',
                  channelId: 45,
                  status: 1,
                  createdTime: 1556246763000,
                },
                {
                  id: 73,
                  name: '变装',
                  channelId: 45,
                  status: 1,
                  createdTime: 1556246763000,
                },
                {
                  id: 74,
                  name: '萌娃',
                  channelId: 45,
                  status: 1,
                  createdTime: 1556246763000,
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
        const result = await getSouhuhaoSubVideoCategoryAsync('success', 1);
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(2000000);
      });
    });
  });
});

describe.runIf(true)('【真实测试】', () => {
  test('获取搜狐号视频一级分类', async () => {
    const cookie =
      'IPLOC=CN3210;cld=20240126091904;jv=b35a16bfea9740d74339aadb6f27d66e-Pz86bo1u1706231968506;gidinf=x099980109ee181cbc23db062000600a6d012a076ab1;clt=1706231944;tgw_l7_route=d130a8ed883f0fe15c57cdb74b5e2881;_dfp=C4bBuE9+5tuQdGN66qIUvXmgel18n/btqmarFUNE0iU=;ppinf=2|1706231968|1707441568|bG9naW5pZDowOnx1c2VyaWQ6Mjg6MTUwNDY0NjM4MDMwNjg0MTYwMEBzb2h1LmNvbXxzZXJ2aWNldXNlOjMwOjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMHxjcnQ6MTA6MjAyNC0wMS0yNnxlbXQ6MTowfGFwcGlkOjY6MTEzODA1fHRydXN0OjE6MXxwYXJ0bmVyaWQ6MTowfHJlbGF0aW9uOjA6fHV1aWQ6MTY6c2EwZDkwYzVlZGNmYmQ4M3x1aWQ6MTY6c2EwZDkwYzVlZGNmYmQ4M3x1bmlxbmFtZTowOnw;ppmdig=170625208700000031bb94694fdb9b7df4d6a277cffab6f0;pprdig=ZtjaAg471xtNUjfy2NHPhS1MrzfQw0_OtsDwnAb1sKAHZorNWDkfIxcDrf_JrbeJ35WgBI6hlXuVr0NckhUkp5eeIfxNYg6rs064FLduQQPBvme7dUc_Y5fvmHh00lQLPsHcTUGkJxLswU1P2xgKxbPRnKofW2wkkYPuGiaEK-c;reqtype=pc;SUV=1703080202864bvs2z6;t=1706234058704';

    const result = await getSouhuVideoCategoryAsync(cookie, 121349544);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取搜狐号视频二级分类', async () => {
    const cookie =
      'SUV=17531817620590gu1of; clt=1753181762; cld=20250722185602; mp-cv=100-1753181762252-00cbff39a151411cac1131d83efb8080; reqtype=pc; gidinf=x099980109ee1b074e6bbd450000525bfd105e4f74ae; _dfp=s6i6HwD0uf8uGLYKsOMgWzhK/jTaEqmmo6M5EFR3pqI=; jv=b7affbfea9dd298888ef2b96bfdbed43-jrMyTR9w1753181807978; ppinf=2|1753181808|1754391408|bG9naW5pZDowOnx1c2VyaWQ6Mjg6MTUwNDY0NjM4MDMwNjg0MTYwMEBzb2h1LmNvbXxzZXJ2aWNldXNlOjMwOjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMHxjcnQ6MTA6MjAyNS0wNy0yMnxlbXQ6MTowfGFwcGlkOjY6MTEzODA1fHBsYXQ6Mzpwd2R8dHJ1c3Q6MToxfHBhcnRuZXJpZDoxOjB8cmVsYXRpb246MDp8dXVpZDoxNjpzYTBkOTBjNWVkY2ZiZDgzfHVpZDoxNjpzYTBkOTBjNWVkY2ZiZDgzfHVuaXFuYW1lOjA6fA; pprdig=BwDjB_X1WX0RA-Iqxv72s6R1Y0GrDFMoiPxzJMN8KyCWGs9HhpRGDHue49wxV4aA8yHy-34FjZ3koe024YcrXHLvsI4pCveSNBOPAb47ocgMp-4kvRuR_z0IH0lhTXzVJH31Lv2IT71VvvoJbkuZCoR-dNRdgqNMtMAnEUXgYHM; tgw_l7_route=a614ee340c42f0cf510d055c19dc2294; ppmdig=175327528400000040a16ce6a97cd56e264c53fee2e54444; t=1753275284614';

    const result = await getSouhuhaoSubVideoCategoryAsync(cookie, 121349544);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(2000000);
  }, 10000000);

  test('获取搜狐号视频拼装二级分类', async () => {
    const cookie =
      'SUV=17531817620590gu1of; clt=1753181762; cld=20250722185602; mp-cv=100-1753181762252-00cbff39a151411cac1131d83efb8080; reqtype=pc; gidinf=x099980109ee1b074e6bbd450000525bfd105e4f74ae; _dfp=s6i6HwD0uf8uGLYKsOMgWzhK/jTaEqmmo6M5EFR3pqI=; jv=b7affbfea9dd298888ef2b96bfdbed43-jrMyTR9w1753181807978; ppinf=2|1753181808|1754391408|bG9naW5pZDowOnx1c2VyaWQ6Mjg6MTUwNDY0NjM4MDMwNjg0MTYwMEBzb2h1LmNvbXxzZXJ2aWNldXNlOjMwOjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMHxjcnQ6MTA6MjAyNS0wNy0yMnxlbXQ6MTowfGFwcGlkOjY6MTEzODA1fHBsYXQ6Mzpwd2R8dHJ1c3Q6MToxfHBhcnRuZXJpZDoxOjB8cmVsYXRpb246MDp8dXVpZDoxNjpzYTBkOTBjNWVkY2ZiZDgzfHVpZDoxNjpzYTBkOTBjNWVkY2ZiZDgzfHVuaXFuYW1lOjA6fA; pprdig=BwDjB_X1WX0RA-Iqxv72s6R1Y0GrDFMoiPxzJMN8KyCWGs9HhpRGDHue49wxV4aA8yHy-34FjZ3koe024YcrXHLvsI4pCveSNBOPAb47ocgMp-4kvRuR_z0IH0lhTXzVJH31Lv2IT71VvvoJbkuZCoR-dNRdgqNMtMAnEUXgYHM; tgw_l7_route=a614ee340c42f0cf510d055c19dc2294; ppmdig=175327528400000040a16ce6a97cd56e264c53fee2e54444; t=1753275284614';

    const result=await new QueryWorker('',Platforms.SouHuHao,{cookie:cookie,platformAuthorId:'121349544'}).getPublishCatergory('video');
    //const result = await getSouhuhaoVideoCategory(cookie, 121349544);
    console.debug(JSON.stringify(result,null,2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    //expect(result.code).toBe(0);
  }, 10000000);
});
