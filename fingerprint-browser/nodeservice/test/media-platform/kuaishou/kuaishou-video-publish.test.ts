// noinspection SpellCheckingInspection

import { describe, expect, test } from 'vitest';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { KuaishouVideoTaskInput } from '../../../src/media-platform/kuaishou/kuaishou-video.service';
import { Cloud, Kuaishou, Platforms } from '../../../src';
import { Task } from '../../../src/utils';
import { KuaiShouTokenResponse } from '../../../src/media-platform/kuaishou/kuaishou-base.service';

export const getCookie = (fileName: string = 'cookie.txt'): string => {
  return fs.readFileSync(path.resolve(__dirname, fileName), { encoding: 'utf8' }).trim();
};

//region 真实测试
// 在此编写需要进行真实测试的代码，CI不会运行下列代码。
// ⚠️⚠️⚠️请注意，真实测试会真实发送请求，因此请谨慎使用。⚠️⚠️⚠️
// 将 describe.runIf(false) 改为 describe.runIf(true) 即可开启真实测试。测试完成需要改回 false。

describe.runIf(true)('【快手发布真实测试】', () => {
  test('快手发布', async () => {
    const cookie = getCookie();

    const taskData: KuaishouVideoTaskInput = {
      pubType: 1,
      taskId: '1717809227264909312',
      cover: {
        height: 0,
        pathOrUrl: 'I:\\download\\ac9f9f1a-320a-40d4-9cd4-d33bba55f6fb.jpg',
        size: 0,
        width: 0,
      },
      video: {
        duration: 0,
        height: 0,
        localPath: 'I:\\download\\niao.mp4',
        size: 137862920,
        width: 0,
      },
      visibilityType: 1,
      downloadType: 2,
      disableNearbyShow: true,
      allowSameFrame: true,
      desc: '记录',
      //desc: '对同行残忍就是对自己仁慈',
      //topics: [{ id: 0, name: '沟通', status: 1 }],
      //mentionedUser: [{ userId: 1317651205, userName: '尽心无悔907❤️', fansCount: 0, headUrl: '' }],
      //location: { id: 61169670, latitude: 28.179451, longitude: 112.936527 }, // location: { id: 60979860, latitude: 30.657401, longitude: 104.065861 },
      publishTime: 0,
      goods: undefined,
      proxy: {
        serverAdd: '106.15.138.47',
        serverPort: 44010,
        userName: 'kmayhgjq',
        password: '3kTXC4Jr35Dk8OiVKzKimTG4',
        type:'socks5'
      }
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const result = await Kuaishou.publishVideo(cookie, taskData, eventCall);

    console.log('快手发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(false)('【快手获取话题】', () => {
  test('快手话题', async () => {
    const cookie = getCookie();
    const result = await Kuaishou.getKuaishouTopic(cookie, '搞笑');
    console.log('快手话题：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(false)('【快手获取好友】', () => {
  test('快手好友', async () => {
    const cookie = getCookie();
    const result = await Kuaishou.getKuaishouFriend(cookie);
    console.log('快手好友：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【快手获取地理位置】', () => {
  test('快手地点', async () => {
    const cookie = getCookie();
    const loc = {
      accuracy: 3574,
      latitude: 39.9042,
      longitude: 116.4074,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    };
    const porxy = {
      serverAdd: '106.15.138.47',
      serverPort: 44010,
      userName: 'kmayhgjq',
      password: '3kTXC4Jr35Dk8OiVKzKimTG4',
    };
    const result = await Kuaishou.getKuaishouLocation(cookie, '', porxy, undefined);
    console.log('快手地点：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(false)('【快手获取分类】', () => {
  test('快手分类', async () => {
    const cookie = getCookie();
    const result = await Kuaishou.getKuaishouCategory(cookie);
    console.log('快手分类：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【快手查询发布状态】', () => {
  test('快手查询作品状态', async () => {
    const cookie = getCookie();
    const result = await Kuaishou.getKuaishouMediaStatus(cookie, '1765791934', 10, '');
    console.log('快手查询作品状态：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(false)('【快手删除作品】', () => {
  test('快手删除作品', async () => {
    const cookie = getCookie();
    const result = await Kuaishou.deleteKuaishouContent(cookie, '3x9n3jkf235ugn6');
    console.log('快手删除作品：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【获取快手作者信息】', () => {
  test('获取快手作者信息', async () => {
    const cookie = getCookie();
    const result = await Kuaishou.getKuaishouUserInfo(cookie);
    console.log('获取快手作者信息：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(false)('【获取快手商品信息】', () => {
  test('获取快手商品信息', async () => {
    const cookie = getCookie();
    const result = await Kuaishou.getKuaishouGoods(cookie, '', '');
    console.log('获取快手商品信息：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【获取快手高权益信息】', () => {
  test('获取快手高权益信息', async () => {
    let cookie = getCookie();
    // if (!cookie?.includes('passToken') || cookie?.includes('userId')) {
    //   return;
    // }
    const re = await Kuaishou.checkKuaiShouLogin(cookie);
    if (re?.code === 0) {
      const token = re.data as KuaiShouTokenResponse;
      if (token?.['kuaishou.web.cp.api_st']) {
        cookie = cookie.replace('kuaishou.web.cp.api_st=', 'dropcookie=');
        cookie = `${cookie};kuaishou.web.cp.api_st=${token?.['kuaishou.web.cp.api_st']}`;
      }
    }
    const result = await Kuaishou.getKuaishouShopPrivilege(cookie);
    console.log('获取快手高权益信息：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(false)('【获取快手账号状态】', () => {
  test('获取快手账号状态', async () => {
    const cookie = getCookie();
    const result = await Kuaishou.getKuaishouUserStatus(cookie);
    console.log('获取快手账号状态：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【获取快手商品列表】', () => {
  test('商品列表', async () => {
    const cookie = getCookie();
    const result = await Kuaishou.getKuaishouGoods(cookie);
    console.log('获取快手商品列表：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【获取快手合集列表】', () => {
  test('合集列表', async () => {
    const cookie = getCookie();
    const result = await Kuaishou.getKuaishouCollection(cookie);
    console.log('获取快手合集列表：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});
describe.runIf(true)('【获取快手好友列表】', () => {
  test('好友列表', async () => {
    const cookie = getCookie();
    const result = await Kuaishou.getKuaishouFriend(cookie, '搞笑');
    console.log('获取快手好友列表：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【获取快手好友列表】', () => {
  test('好友列表', async () => {
    const cookie = getCookie();
    const result = await Kuaishou.getKuaishouUserInfo(cookie);
    console.log('获取快手好友列表：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【获取快手购物车权限】', () => {
  test('获取快手购物车权限', async () => {
    const cookie = getCookie();
    const result = await Kuaishou.getKuaishouShopPrivilege(cookie);
    console.log('获取快手购物车权限：', JSON.stringify(result, null, 2));
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
              platformCode: Platforms.KuaiShou,
              platformCookie:
                '[{"name":"_did","value":"web_402337335B78A04C","domain":".kuaishou.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1749779089,"sameSite":"unspecified"},{"name":"userId","value":"2313707062","domain":".id.kuaishou.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1721355061.494054,"sameSite":"no_restriction"},{"name":"kpf","value":"PC_WEB","domain":".www.kuaishou.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1750903527.728787,"sameSite":"unspecified"},{"name":"kpn","value":"KUAISHOU_VISION","domain":".www.kuaishou.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1750903527.728857,"sameSite":"unspecified"},{"name":"clientid","value":"3","domain":".www.kuaishou.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1750903527.728871,"sameSite":"unspecified"},{"name":"did","value":"web_d2f867b10e5401ffa45a201f94c27767fce4","domain":".kuaishou.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1752803146.786704,"sameSite":"no_restriction"},{"name":"userId","value":"2313707062","domain":".kuaishou.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1720836661.540922,"sameSite":"no_restriction"},{"name":"userId","value":"2313707062","domain":"id.kuaishou.com","hostOnly":true,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1721355061.494054,"sameSite":"no_restriction"},{"name":"passToken","value":"ChNwYXNzcG9ydC5wYXNzLXRva2VuEsABYrhIy1Iiv1Lte0xzYzB4gzbjwDpwju2UgCxriycAofVpTr9r-Qtlz_3CgsWH4bs7JciYicFXFHF4s_f8RHLVef5qwNhq9xNU0BMSG2bWHWwP91r7OM_7FXAEdcC3QVzb11c3-HDLQitwKkTPb-PJFkiGcp4GrFvg0CA3QvWE6VGFgGcW-wOI3cwxxsCR7-3OcJQDFSMpPdXinLcyGPr8BnkfFVktz6upctxCWFVTXTcXknaRooDsq_uw4VY2DT-8GhKcgdhQPsVJRqdGMGWhwHcgOkwiIJj5RblYP0YqMvYZhMkUxdoPkuNbiUHmpFe2CwhsBUl3KAUwAQ","domain":"id.kuaishou.com","hostOnly":true,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1721355061.494065,"sameSite":"no_restriction"},{"name":"kuaishou.web.cp.api_st","value":"ChZrdWFpc2hvdS53ZWIuY3AuYXBpLnN0ErABD8Du_3KZ2aT9-qm0LWm8NbZmqMjrxkI30cKMXXYakayFwKNEP0zlABKTEHJhsUb9Tz73MEsGgbpH6ngwEx8ERk8YAkT3T_N-T8THlZf_gVXVw9mFuPZNWo8_uGwLQDOYUspU2dyhhDADn5dZbLfMBYqysR-w3X7Y4oFoUdjfy3i-QRGwxf3E0HkxjFOz9prbumsx0L1TR7TDhmS70Pi3kAe16_cmxx9PZ0tzqb59tnwaEhm8PP5rCBF1JNbWXtSlAOynOSIgx4TtfHztMXGgjjVqHKemjY-Dyf__3ccmrXqCEhmp0CkoBTAB","domain":".kuaishou.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1720836661.54098,"sameSite":"no_restriction"},{"name":"kuaishou.web.cp.api_ph","value":"57e2f68caabbe74a3e644b6ecd55108887a1","domain":".kuaishou.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1720836661.540994,"sameSite":"unspecified"},{"name":"passToken","value":"ChNwYXNzcG9ydC5wYXNzLXRva2VuEsABYrhIy1Iiv1Lte0xzYzB4gzbjwDpwju2UgCxriycAofVpTr9r-Qtlz_3CgsWH4bs7JciYicFXFHF4s_f8RHLVef5qwNhq9xNU0BMSG2bWHWwP91r7OM_7FXAEdcC3QVzb11c3-HDLQitwKkTPb-PJFkiGcp4GrFvg0CA3QvWE6VGFgGcW-wOI3cwxxsCR7-3OcJQDFSMpPdXinLcyGPr8BnkfFVktz6upctxCWFVTXTcXknaRooDsq_uw4VY2DT-8GhKcgdhQPsVJRqdGMGWhwHcgOkwiIJj5RblYP0YqMvYZhMkUxdoPkuNbiUHmpFe2CwhsBUl3KAUwAQ","domain":".id.kuaishou.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1721355061.494065,"sameSite":"no_restriction"}]',
            },
          ],
          tasks: [
            {
              taskId: '7',
              authorInfo: {
                platform: Platforms.KuaiShou,
                id: '81231231237',
                cookie: '',
                authorId: '',
                // proxy: {
                //   serverAdd: '106.15.138.47',
                //   serverPort: 44001,
                //   type: 'socks5',
                //   userName: 'kmayhgjq',
                //   password: '3kTXC4Jr35Dk8OiVKzKimTG4',
                // },
              },
              publishData: {
                video: {
                  localPath: 'I:\\download\\bc19ad1b-c014-475a-8b59-01ad8855e774123.mp4',
                  url: '',
                  width: 1024,
                  height: 768,
                  duration: 120,
                  size: 123,
                },
                covers: [
                  {
                    pathOrUrl: 'I:\\download\\20250707-171022.jpg',
                    width: 1024,
                    height: 768,
                    size: 123,
                  },
                ],
                title: '我是标题啊',
                desc: '<p>我是<topic text="辣条">#ahsh#</topic>描述啊</p><p><friend raw=\'{"yixiaoerId":"2566827398","yixiaoerName":"搞笑¹","yixiaoerImageUrl":"https://p66-pro.a.yximgs.com/uhead/AB/2023/10/03/22/BMjAyMzEwMDMyMjQ1MjRfMjU2NjgyNzM5OF8yX2hkNTAzXzQ2OA==_s.jpg","raw":{"userName":"搞笑¹","userId":2566827398,"fansCount":931069,"headUrl":"https://p66-pro.a.yximgs.com/uhead/AB/2023/10/03/22/BMjAyMzEwMDMyMjQ1MjRfMjU2NjgyNzM5OF8yX2hkNTAzXzQ2OA==_s.jpg"}}\'></friend>挂车</p>',
                visibleType: 0,
                collection: {
                  yixiaoerId: '666838',
                  yixiaoerName: '合集18',
                  viewNum: 0,
                  raw: {
                    collectionId: 666838,
                    title: '合集18',
                    photoSize: 0,
                  },
                },
                nearby_show: false,
                // shopping_cart: {
                //   yixiaoerId: '1757656698918_1',
                //   yixiaoerName: '2025新款卧室床头自粘装饰画墙贴纸画客厅房间沙发背景墙壁纸贴画',
                //   yixiaoerImageUrl:
                //     'https://p2-ec.ecukwai.com/bs2/image-kwaishop-product/ITEM_IMAGE-4058594532-d219aa9b619644228ff74b13a540dde6.jpg',
                //   price: 280,
                //   raw: {
                //     title: '2025新款卧室床头自粘装饰画墙贴纸画客厅房间沙发背景墙壁纸贴画',
                //     url: 'https://p2-ec.ecukwai.com/bs2/image-kwaishop-product/ITEM_IMAGE-4058594532-d219aa9b619644228ff74b13a540dde6.jpg',
                //     associateTaskId: {
                //       taskId: 0,
                //       bindId: '{"itemId":23500080577532,"putType":1}',
                //       entranceType: 1,
                //       bindType: '3',
                //       taskType: 'PLC',
                //     },
                //     price: 2.8,
                //     promoterName: null,
                //   },
                // },
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
