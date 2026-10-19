import { Xiaohongshushop, XiaohongshushopVideoTaskInput } from '@/media-platform/xiaohongshushop/xiaohongshushop';
import { describe, expect, test } from 'vitest';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { AccountService, Cloud, Platforms } from '../../../src';
import { Task } from '../../../src/utils';

export const getCookie = (fileName: string = 'cookie.txt'): string => {
  return fs.readFileSync(path.resolve(__dirname, fileName), { encoding: 'utf8' }).trim();
};

describe.runIf(true)('【有效性真实测试】', () => {
  test('小红书商家号有效性检测', async () => {
    const cookie = getCookie();

    const service = new AccountService(cookie, Platforms.XiaoHongShuShangJiaHao);

    const result = await service.checkAccountAlive();

    console.log('小红书发布有效性：', result);
    expect(result).toBe(1);
  }, 10000000);
});

describe.runIf(true)('【用户信息真实测试】', () => {
  test('小红书商家号用户信息', async () => {
    const cookie = getCookie();

    const result = await Cloud.getPlatformUserInfo(Platforms.XiaoHongShuShangJiaHao, cookie);

    console.log('小红书用户信息：', result);
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【视频发布真实测试】', () => {
  test('小红书商家号视频发布', async () => {
    const cookie = getCookie();

    const taskData: XiaohongshushopVideoTaskInput = {
      pubType: 1,
      taskId: '13123123',
      video: {
        localPath: 'I:\\download\\20260625-161120.mp4',
        width: 1080,
        height: 1920,
        duration: 0,
      },
      cover: {
        pathOrUrl: 'I:\\download\\20250213-111807.jpg',
        width: 1920,
        height: 1080,
      },
      visibilityType: 0,
      title: '对同心慈手软',
      isOriginal:1,
      desc: '<p>对同行心慈手软就是对自己残忍</p><p><topic text="搞笑"></topic></p><p>尾部</p>',
      // mentionedUser: [
      //   {
      //     red_id: '574806195',
      //     user_id: '5e1022d2000000000100395d',
      //     desc: '🙋‍♂️北漂8年，前字节、百度员工\n👉专注效率利器、AI技术、自媒体神器\n📕发誓把库里的1000个工具更新完',
      //     image: 'https://sns-avatar-qc.xhscdn.com/avatar/62c6b4607c57cf5af7839c4f.jpg?imageView2/2/w/80/format/jpg',
      //     image_size_large:
      //       'https://sns-avatar-qc.xhscdn.com/avatar/62c6b4607c57cf5af7839c4f.jpg?imageView2/2/w/120/format/jpg',
      //     red_official_verify_type: 0,
      //     show_red_official_verify_icon: false,
      //     user_nickname: '老麦的工具库',
      //     followed: false,
      //     red_official_verified: false,
      //   },
      // ],
      // topics: [
      //   {
      //     link: 'https://www.xiaohongshu.com/page/topics/5a438da580008606617213f4?naviHidden=yes',
      //     view_num: 45047190539,
      //     type: 'official',
      //     smart: false,
      //     id: '5a2a3309e39faf22617a15ac',
      //     name: '搞笑的日常',
      //   },
      // ],
      // location: {
      //   poiOid: '5a66b800299d7026de29f8e9',
      //   poiPageId: '5a9ce9f6e39faf280d42157b',
      //   source: 3,
      //   recommendType: 2,
      //   name: '五一广场',
      //   link: 'https://www.xiaohongshu.com/page/scenes/5a9ce9f6e39faf280d42157b?naviHidden=yes',
      //   rateScore: 0,
      //   category: 8,
      //   sortScore: 2147483646,
      //   distance: 12258880.1,
      //   latitude: 28.1965,
      //   poiLongId: 1513887247345187000,
      //   subname: '景点 | 长沙芙蓉区五一大道202号',
      //   cityNameSpell: 'ZHANGSHA',
      //   originSource: 2,
      //   cityName: '长沙',
      //   longitude: 112.97734,
      // },
      // postTime: new Date('2025-8-13').getTime(),
      // goods: {
      //   id: '643f8a9f8ac2b70001a6fcae',
      //   price: '44.9',
      //   image: 'http://qimg.xiaohongshu.com/material_space/5ec0d273-0b8c-403d-9e2b-9f4860676d81',
      //   name: '海鸥馋馋坤坤酒鬼辣条小零食麻辣儿时90后回忆小时候小吃休闲食品',
      //   item_status: 1,
      //   variants: [
      //     {
      //       id: '634559643d82ac00012c3959',
      //       name: '口味',
      //       value: '坤坤酒鬼辣条 5包【量少不划算】',
      //     },
      //   ],
      // },
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

describe.runIf(true)('【获取商品列表】', () => {
  test('获取商品列表', async () => {
    const cookie = getCookie();

    const result = await Xiaohongshushop.getXiaohongshushopFirstGoods(cookie);

    console.log('小红书商品：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【新版发布流程】', () => {
  test(
    '新视频发布',
    async () => {
      const result = Cloud.pushOpenPlatformPublishTask(
        {
          publishType: 'video',
          authorization: '1231231',
          platform: [
            {
              id: '81231231237',
              platformAvatar: '',
              platformUserId: '',
              platformUserName: '',
              platformCode: Platforms.XiaoHongShuShangJiaHao,
              platformCookie:
                'a1=1993ceace54dfu3npu5atbgxpy6cqxnelzud853z950000285482; webId=3b37b5e5a1032e9aec95aa0be72b7d53; customer-sso-sid=68c517549108255059574784plzfjrgzbzqx28gy; x-user-id-ark.xiaohongshu.com=605418e20000000001008a3e; customerClientId=746042430884954; gid=yjjqSdfyK21fyjjqSd0Sdu2q24fi7qIU72097ujDkCUvKf28SACIdY888JY24YJ8W4YS8D2i; acw_tc=0a42481517578972258421298e140a0aaf413da477ff071d5be65a80e9436f; access-token-ark.xiaohongshu.com=customer.ark.AT-68c5175501110955635998762dfnnhs15zbrvqrm; xsecappid=systemark; loadts=1757897227078; websectiga=cffd9dcea65962b05ab048ac76962acee933d26157113bb213105a116241fa6c; sec_poison_id=d7e853b3-0e23-44b7-9555-968eee40f95e',
            },
          ],
          tasks: [
            {
              taskId: '7',
              authorInfo: {
                platform: Platforms.XiaoHongShuShangJiaHao,
                id: '81231231237',
                cookie: '',
                authorId: '',
              },
              publishData: {
                video: {
                  localPath: 'I:\\download\\4、对于管理者来说，新媒体数据在哪里查看.mp4',
                  url: '',
                  width: 1024,
                  height: 768,
                  duration: 120,
                  size: 123,
                },
                covers: [
                  {
                    pathOrUrl: 'I:\\download\\20250915-104642.jpg',
                    width: 1024,
                    height: 768,
                    size: 123,
                  },
                ],
                title: '大屏数据',
                desc: '对于管理者来说，新媒体数据在哪里查看',
                pubType: 1,
                visibleType: 0,
                shopping_cart: [
                  {
                    yixiaoerId: '68c3de7830aed4000193294a',
                    yixiaoerName: '70迈 运营数据整合分析可视化大屏模板电商数据报表 黑色 买5减3',
                    yixiaoerImageUrl:
                      'http://qimg.xiaohongshu.com/arkgoods/1040g3no31ll4soipl00g5o2k33h092hu5qtuiao?imageView2/1/w/162/h/162/q/90.jpg',
                    price: 2890,
                    count: 6000,
                    yixiaoerDesc: '黑色/买5减3',
                    raw: {
                      name: '70迈 运营数据整合分析可视化大屏模板电商数据报表 黑色 买5减3',
                      sale_qty_total: 0,
                      item_id: '68c3de7830aed4000193294a',
                      related_note_30d_count: 0,
                      goods_id: '68c3de7830aed4000193294e',
                      purchase_price: 2890,
                      ai_recommend: 0,
                      variants: '黑色/买5减3',
                      extension: {
                        itemId: '68c3de7830aed4000193294a',
                        aiPublishPermission: '0',
                      },
                      original_price: 2890,
                      goods_seller_type: 'GOODS_SELLER',
                      deep_link:
                        'xhsdiscover://rn/lancer/goods/68c3de7830aed4000193294e?noteId=&listing_image=https%3A%2F%2Fqimg.xiaohongshu.com%2Farkgoods%2F1040g3no31ll4soipl00g5o2k33h092hu5qtuiao%3FitemId%3D68c3de7830aed4000193294e%26imageView2%2F1%2Fw%2F620%2Fh%2F828%2Fq%2F90.jpeg&first_height=1660&first_width=1242&prefetch-image=https%3A%2F%2Fqimg.xiaohongshu.com%2Farkgoods%2F1040g3no31ll4soipl00g5o2k33h092hu5qtuiao%3FitemId%3D68c3de7830aed4000193294e%26imageView2%2F1%2Fw%2F620%2Fh%2F828%2Fq%2F90.jpeg&max_width=1242&max_height=1660&hasVideo=false&total_image_size=5',
                      base_image: 'http://qimg.xiaohongshu.com/arkgoods/1040g3no31ll4soipl00g5o2k33h092hu5qtuiao',
                      purchase_price_range: '¥28.90~30.10',
                      related_note_total_count: 0,
                      image:
                        'http://qimg.xiaohongshu.com/arkgoods/1040g3no31ll4soipl00g5o2k33h092hu5qtuiao?imageView2/1/w/162/h/162/q/90.jpg',
                      passed: 1,
                      inventory: 6000,
                      sale_qty_recent30: 0,
                    },
                  },
                  {
                    yixiaoerId: '68c3dd7d20de3e0001117915',
                    yixiaoerName: '运营数据可视化分析报表大屏模板电商行业数据分析',
                    yixiaoerImageUrl:
                      'https://qimg.xiaohongshu.com/arkgoods/1040g3no31ll4soipl00g5o2k33h092hu5qtuiao?imageView2/1/w/162/h/162/q/90.jpg',
                    price: 2990,
                    count: 1000,
                    yixiaoerDesc: '--',
                    raw: {
                      related_note_30d_count: 0,
                      related_note_total_count: 0,
                      original_price: 2990,
                      goods_seller_type: 'GOODS_SELLER',
                      passed: 1,
                      ai_recommend: 0,
                      sale_qty_total: 0,
                      name: '运营数据可视化分析报表大屏模板电商行业数据分析',
                      deep_link:
                        'xhsdiscover://rn/lancer/goods/68c3dd7d20de3e0001117916?noteId=&listing_image=https%3A%2F%2Fqimg.xiaohongshu.com%2Farkgoods%2F1040g3no31ll4soipl00g5o2k33h092hu5qtuiao%3FitemId%3D68c3dd7d20de3e0001117916%26imageView2%2F1%2Fw%2F620%2Fh%2F828%2Fq%2F90.jpeg&first_height=1660&first_width=1242&prefetch-image=https%3A%2F%2Fqimg.xiaohongshu.com%2Farkgoods%2F1040g3no31ll4soipl00g5o2k33h092hu5qtuiao%3FitemId%3D68c3dd7d20de3e0001117916%26imageView2%2F1%2Fw%2F620%2Fh%2F828%2Fq%2F90.jpeg&max_width=1242&max_height=1660&hasVideo=false&total_image_size=5',
                      variants: '--',
                      sale_qty_recent30: 0,
                      goods_id: '68c3dd7d20de3e0001117916',
                      base_image: 'https://qimg.xiaohongshu.com/arkgoods/1040g3no31ll4soipl00g5o2k33h092hu5qtuiao',
                      extension: {
                        itemId: '68c3dd7d20de3e0001117915',
                        aiPublishPermission: '0',
                      },
                      inventory: 1000,
                      purchase_price_range: '¥29.90',
                      image:
                        'https://qimg.xiaohongshu.com/arkgoods/1040g3no31ll4soipl00g5o2k33h092hu5qtuiao?imageView2/1/w/162/h/162/q/90.jpg',
                      purchase_price: 2990,
                      item_id: '68c3dd7d20de3e0001117915',
                    },
                  },
                ],
              },
            },
          ],
          callBackData: {},
          publishChannel: '',
          clientId: '',
        },
        '123',
      );
      console.log(JSON.stringify(result, null, 2));
      await Task.Delay(40 * 60 * 1000);
    },
    40 * 60 * 1000,
  );
});

describe.runIf(true)('【状态查询测试】', () => {
  test('小红书商家号有效性检测', async () => {
    const cookie = getCookie();


    const result = await Xiaohongshushop.getXiaohongshushopMediaStatus(cookie,'68edec96000000000700d009');

    console.log('小红书状态：', result);
    expect(result).toBe(1);
  }, 10000000);
});

//68c77e5a000000001b020571
