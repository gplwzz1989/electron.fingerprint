import {
  Xiaohongshushop,
  XiaohongshushopTopicListResultOutput,
  XiaohongshuVideoTaskInput,
} from '@/media-platform/xiaohongshushop/xiaohongshushop';
import { describe, expect, test } from 'vitest';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '../../mock/mock';
import { convertCookieStr } from '../../../src/utils';
export const getCookie = (fileName: string = 'cookie.txt'): string => {
  return fs.readFileSync(path.resolve(__dirname, fileName), { encoding: 'utf8' }).trim();
};

describe('【Mock】', () => {
  describe('获取小红书用户数据', () => {
    const server = setupServer(
      rest.get('https://creator.xiaohongshu.com*/api/galaxy/creator/note/user/posted', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 0,
              success: true,
              msg: '成功',
              data: {
                can_apply_customs: false,
                can_seller_all_brands: false,
                is_official: false,
                single_branded: false,
                createTime: '2023-03-09 21:06:56',
                brand_ids: ['60ee95a70000000004018a8f'],
                brand_white_user: true,
                declaration_mode: 'self_ship',
                main_category_ids: ['5a310e243f7d1712823ba477'],
                seller_id: '6409d9f09a611c0001398135',
                use_logistics_plan: true,
                avatar: {
                  path: 'https://sns-avatar-qc.xhscdn.com/avatar/f467b4f4-151c-3bd7-ab36-04856c30557f?imageView2/2/w/120/format/jpg',
                  width: 120,
                  height: 120,
                  link: 'https://sns-avatar-qc.xhscdn.com/avatar/f467b4f4-151c-3bd7-ab36-04856c30557f?imageView2/2/w/120/format/jpg',
                },
                role: 'partner',
                seller_type: 10,
                account_type: 'SECONDARY',
                name: '参考仓库邮资设定',
                email: '15974811524@163.com',
                seller_name: '海鸥馋馋零食店的店',
                user_id: '64141e9ba93c290001249bd8',
                brief: '',
                member_price_enable: false,
                permissions: {
                  presale: [],
                },
                config_values: {
                  set_cs_mode: '',
                  self_pre_cs: '',
                  shopStar: '4.0',
                  self_cs_on: '',
                  alipay_smid: '2088520518628162',
                  wechat_erqing: '1',
                  alipay_erqing: '1',
                  shopScore:
                    '{"afterSale":{"detail":{"refundTime":0.0,"refundGoodsTime":0.0},"level":"MIDDLE","peerRate":0.28,"score":4.05},"delivery":{"detail":{"deliverReturnRate":0.0,"payReceiveTime":59.8,"deliverOnTime":0.8},"level":"MIDDLE","peerRate":0.3,"score":4.22},"dispute":{"detail":{"disputeRate":0.0},"level":"HIGH","peerRate":1.0,"score":5.0},"item":{"detail":{"goodsRefundRate":0.0,"goodsScore":5.0},"level":"MIDDLE","peerRate":0.45,"score":4.44},"replyRate":{"detail":{"replyRate":0.0},"level":"MIDDLE","peerRate":0.64,"score":4.47},"shopScore":{"level":"MIDDLE","peerRate":0.42,"score":4.44}}',
                  wechat_smid: '1640489810',
                },
                category_ids: ['55b6740de7798944b47924c7', '5a310e243f7d1712823ba477'],
                state: 100,
                deactivated: true,
                sns_user_id: '',
                user_name: '零售店',
                brand_score: 25,
                company_name: '海鸥馋馋零食店的店',
                trade_mode: 0,
                user_email: '821665909@qq.com',
                seller_image:
                  'https://sns-avatar-qc.xhscdn.com/avatar/f467b4f4-151c-3bd7-ab36-04856c30557f?imageView2/2/w/120/format/jpg',
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
        const result = await Xiaohongshushop.getXiaohongshushopUserInfo();
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.result).toBe(0);
        expect(result.success).toBe(true);
      });
    });
  });
});

//region 真实测试
// 在此编写需要进行真实测试的代码，CI不会运行下列代码。
// ⚠️⚠️⚠️请注意，真实测试会真实发送请求，因此请谨慎使用。⚠️⚠️⚠️
// 将 describe.runIf(false) 改为 describe.runIf(true) 即可开启真实测试。测试完成需要改回 false。

describe.runIf(false)('【真实测试】', () => {
  test('小红书商家号视频发布', async () => {
    const cookie = getCookie();

    const taskData: XiaohongshuVideoTaskInput = {
      pubType: 1,
      taskId: '13123123',
      video: {
        localPath: 'Z:\\系统默认下载位置\\植物神经紊乱表现，可以了解下.mp4',
        width: 1080,
        height: 1920,
      },
      cover: {
        pathOrUrl: 'Z:\\系统默认下载位置\\这是骆驼豹？.jpg',
        width: 1920,
        height: 1080,
      },
      visibilityType: 0,
      title: '对同心慈手软',
      desc: '对同行心慈手软就是对自己残忍',
      mentionedUser: [
        {
          red_id: '574806195',
          user_id: '5e1022d2000000000100395d',
          desc: '🙋‍♂️北漂8年，前字节、百度员工\n👉专注效率利器、AI技术、自媒体神器\n📕发誓把库里的1000个工具更新完',
          image: 'https://sns-avatar-qc.xhscdn.com/avatar/62c6b4607c57cf5af7839c4f.jpg?imageView2/2/w/80/format/jpg',
          image_size_large:
            'https://sns-avatar-qc.xhscdn.com/avatar/62c6b4607c57cf5af7839c4f.jpg?imageView2/2/w/120/format/jpg',
          red_official_verify_type: 0,
          show_red_official_verify_icon: false,
          user_nickname: '老麦的工具库',
          followed: false,
          red_official_verified: false,
        },
      ],
      topics: [
        {
          link: 'https://www.xiaohongshu.com/page/topics/5a438da580008606617213f4?naviHidden=yes',
          view_num: 45047190539,
          type: 'official',
          smart: false,
          id: '5a2a3309e39faf22617a15ac',
          name: '搞笑的日常',
        },
      ],
      location: {
        poiOid: '5a66b800299d7026de29f8e9',
        poiPageId: '5a9ce9f6e39faf280d42157b',
        source: 3,
        recommendType: 2,
        name: '五一广场',
        link: 'https://www.xiaohongshu.com/page/scenes/5a9ce9f6e39faf280d42157b?naviHidden=yes',
        rateScore: 0,
        category: 8,
        sortScore: 2147483646,
        distance: 12258880.1,
        latitude: 28.1965,
        poiLongId: 1513887247345187000,
        subname: '景点 | 长沙芙蓉区五一大道202号',
        cityNameSpell: 'ZHANGSHA',
        originSource: 2,
        cityName: '长沙',
        longitude: 112.97734,
      },
      postTime: 1698132613000,
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const result = await Xiaohongshushop.publishVideo(cookie, taskData, eventCall);

    console.log('小红书发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(false)('【真实测试用户信息】', () => {
  test('小红书商家号获取用户信息', async () => {
    const cookie = getCookie();

    const result = await Xiaohongshushop.getXiaohongshushopUserInfo(cookie);

    console.log('小红书商家号获取用户信息：', result);
    expect(result.code).toBe(0);
  }, 10000000);
});
describe.runIf(false)('【获取好友/用户】', () => {
  test('获取好友/用户', async () => {
    const cookie = getCookie();

    const result = await Xiaohongshushop.getXiaohongshushopFriendList(cookie, '搞笑');
    console.log('小红书获取好友/用户：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});
describe.runIf(false)('【获取获取话题】', () => {
  test('获取获取话题', async () => {
    const cookie = getCookie();

    const result: XiaohongshushopTopicListResultOutput = await Xiaohongshushop.getXiaohongshushopTopicList(
      cookie,
      '搞笑',
    );

    console.log('小红书商家号获获取话题：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(false)('【获取地点】', () => {
  test('获取地点', async () => {
    const cookie = getCookie();

    const result = await Xiaohongshushop.getXiaohongshushopLocationList(cookie, '五一广场');

    console.log('小红书商家号获取地点：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(false)('【获取作品审核状态】', () => {
  test('获取作品审核状态', async () => {
    const cookie = getCookie();

    const result = await Xiaohongshushop.getXiaohongshushopMediaStatus(cookie, '65d40eed000000000102bff9');

    console.log('小红书商家号获取作品审核状态：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【获取一级商品】', () => {
  test('获取一级商品', async () => {
    const cookie =convertCookieStr(getCookie());

    const result = await Xiaohongshushop.getXiaohongshushopFirstGoods(convertCookieStr(cookie));

    console.log('小红书商家号获取一级商品：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(false)('【获取二级商品】', () => {
  test('获取二级商品', async () => {
    const cookie = getCookie();

    const result = await Xiaohongshushop.getXiaohongshushopSecondGoods(cookie, '643f8aa049bb530001ed198d');

    console.log('小红书商家号获取二级商品：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

//endregion
