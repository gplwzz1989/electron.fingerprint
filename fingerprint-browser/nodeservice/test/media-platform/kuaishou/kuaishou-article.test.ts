// noinspection SpellCheckingInspection

import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '../../mock/mock';
import { getContentListAsync } from '../../../src/media-platform/kuaishou/kuaishou-content-list.service';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { AccountService, Kuaishou, KuaishouDynamicTaskInput, Platforms } from '../../../src';
import { convertCookieStr } from '../../../src/utils';

export const getCookie = (fileName: string = 'cookie.txt'): string => {
  return fs.readFileSync(path.resolve(__dirname, fileName), { encoding: 'utf8' }).trim();
};

//region 真实测试
// 在此编写需要进行真实测试的代码，CI不会运行下列代码。
// ⚠️⚠️⚠️请注意，真实测试会真实发送请求，因此请谨慎使用。⚠️⚠️⚠️
// 将 describe.runIf(false) 改为 describe.runIf(true) 即可开启真实测试。测试完成需要改回 false。

describe.runIf(false)('【快手图文发布真实测试】', () => {
  test('快手图文发布', async () => {
    const cookie = getCookie();

    const taskData: KuaishouDynamicTaskInput = {
      pubType: 1,
      taskId: '1717809227264909312',
      cover: {
        height: 0,
        pathOrUrl:
          'https://yixiaoer-img.oss-cn-shanghai.aliyuncs.com/20231226/2a988eb6-cb2f-491e-8e01-d17ff70d5ba7.jpg',
        size: 0,
        width: 0,
      },
      images: [
        {
          pathOrUrl:
            'https://yixiaoer-img.oss-cn-shanghai.aliyuncs.com/20231226/2a988eb6-cb2f-491e-8e01-d17ff70d5ba7.jpg',
        },
        {
          pathOrUrl:
            'https://yixiaoer-img.oss-cn-shanghai.aliyuncs.com/20231226/bdad9443-1e67-4ff8-a1de-e72dc735c8aa.jpg',
        },
        {
          pathOrUrl:
            'https://yixiaoer-img.oss-cn-shanghai.aliyuncs.com/20231226/1ccbb1f6-3a28-49c6-90ef-b7442eb21d4c.jpg',
        },
      ],
      visibilityType: 2,
      music: {
        musicId: '6277446803$4',
        cover: [
          {
            cdn: 'm2.a.kwimgs.com',
            url: 'https://m2.a.kwimgs.com/bs2/image-music/bm_U626qXORURQ_v.jpg',
          },
          {
            cdn: 'm1.a.kwimgs.com',
            url: 'https://m1.a.kwimgs.com/bs2/image-music/bm_U626qXORURQ_v.jpg',
          },
        ],
        title: '搞笑搞怪曲',
        author: '欢柏',
        duration: 99000,
        url: [
          {
            cdn: 'm2.kwaicdn.com',
            url: 'https://m2.kwaicdn.com/bs2/image-music/bm_U626qXORURQ_v.m4a?pkey=AAVvXWS6GkA42R7cWp-ex6nEfP4eoyN9WJQFrNgmCXnQHyD-E2kaSv3JP2w3-TA7k9DcWvuu0cjVEXp48p2q_reOibfwc-0-w2BGojStmoPRPJTHD2n9L8p1LtjidkISyHY',
          },
          {
            cdn: 'm1.kwaicdn.com',
            url: 'https://m1.kwaicdn.com/bs2/image-music/bm_U626qXORURQ_v.m4a?pkey=AAVm1BY4AdZOhNiHd571tMoMyLwN64PaBCtLahFxy0mKbPwVB6d9Ntuf9gVoLcPjAT8qZDNcyrrEafT-8Msd-1jqqVd5O634ZVNDaKCxjEgiJfyz7ZY6o7hd6V805C8VZBo',
          },
        ],
      },
      desc: '<p>对同行残忍<topic raw="{&quot;id&quot;:0,&quot;name&quot;:&quot;沟通&quot;,&quot;status&quot;:1}"></topic>就是对<friend raw="{&quot;userId&quot;:1317651205,&quot;userName&quot;:&quot;尽心无悔907❤️&quot;,&quot;fansCount&quot;:0,&quot;headUrl&quot;:&quot;&quot;}"></friend>自己仁慈</p>',
      // topics: [{ id: 0, name: '沟通', status: 1 }],
      // mentionedUser: [{ userId: 1317651205, userName: '尽心无悔907❤️', fansCount: 0, headUrl: '' }],
      location: { id: 61169670, latitude: 28.179451, longitude: 112.936527 },

      goods: undefined,
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const result = await Kuaishou.publishArticle(cookie, taskData, eventCall);

    console.log('快手发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(false)('【快手获取音乐】', () => {
  test('快手音乐', async () => {
    const cookie = getCookie();
    const result = await Kuaishou.getKuaishouMusicList(cookie, '搞笑');
    console.log('快手音乐：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【快手权益】', () => {
  test('快手权益', async () => {
    const cookie = getCookie();
    const result = await Kuaishou.getKuaishouShopPrivilege(cookie);
    console.log('快手权益：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});


//1705031217
describe.runIf(true)('【快手图文状态查询】', () => {
  const cookie =
    '[{"name":"_did","value":"web_402337335B78A04C","domain":".kuaishou.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1749779089,"sameSite":"unspecified"},{"name":"userId","value":"2313707062","domain":".id.kuaishou.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1721355061.494054,"sameSite":"no_restriction"},{"name":"kpf","value":"PC_WEB","domain":".www.kuaishou.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1750903527.728787,"sameSite":"unspecified"},{"name":"kpn","value":"KUAISHOU_VISION","domain":".www.kuaishou.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1750903527.728857,"sameSite":"unspecified"},{"name":"clientid","value":"3","domain":".www.kuaishou.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1750903527.728871,"sameSite":"unspecified"},{"name":"did","value":"web_d2f867b10e5401ffa45a201f94c27767fce4","domain":".kuaishou.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1752803146.786704,"sameSite":"no_restriction"},{"name":"userId","value":"2313707062","domain":".kuaishou.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1720836661.540922,"sameSite":"no_restriction"},{"name":"userId","value":"2313707062","domain":"id.kuaishou.com","hostOnly":true,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1721355061.494054,"sameSite":"no_restriction"},{"name":"passToken","value":"ChNwYXNzcG9ydC5wYXNzLXRva2VuEsABYrhIy1Iiv1Lte0xzYzB4gzbjwDpwju2UgCxriycAofVpTr9r-Qtlz_3CgsWH4bs7JciYicFXFHF4s_f8RHLVef5qwNhq9xNU0BMSG2bWHWwP91r7OM_7FXAEdcC3QVzb11c3-HDLQitwKkTPb-PJFkiGcp4GrFvg0CA3QvWE6VGFgGcW-wOI3cwxxsCR7-3OcJQDFSMpPdXinLcyGPr8BnkfFVktz6upctxCWFVTXTcXknaRooDsq_uw4VY2DT-8GhKcgdhQPsVJRqdGMGWhwHcgOkwiIJj5RblYP0YqMvYZhMkUxdoPkuNbiUHmpFe2CwhsBUl3KAUwAQ","domain":"id.kuaishou.com","hostOnly":true,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1721355061.494065,"sameSite":"no_restriction"},{"name":"kuaishou.web.cp.api_st","value":"ChZrdWFpc2hvdS53ZWIuY3AuYXBpLnN0ErABD8Du_3KZ2aT9-qm0LWm8NbZmqMjrxkI30cKMXXYakayFwKNEP0zlABKTEHJhsUb9Tz73MEsGgbpH6ngwEx8ERk8YAkT3T_N-T8THlZf_gVXVw9mFuPZNWo8_uGwLQDOYUspU2dyhhDADn5dZbLfMBYqysR-w3X7Y4oFoUdjfy3i-QRGwxf3E0HkxjFOz9prbumsx0L1TR7TDhmS70Pi3kAe16_cmxx9PZ0tzqb59tnwaEhm8PP5rCBF1JNbWXtSlAOynOSIgx4TtfHztMXGgjjVqHKemjY-Dyf__3ccmrXqCEhmp0CkoBTAB","domain":".kuaishou.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1720836661.54098,"sameSite":"no_restriction"},{"name":"kuaishou.web.cp.api_ph","value":"57e2f68caabbe74a3e644b6ecd55108887a1","domain":".kuaishou.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1720836661.540994,"sameSite":"unspecified"},{"name":"passToken","value":"ChNwYXNzcG9ydC5wYXNzLXRva2VuEsABYrhIy1Iiv1Lte0xzYzB4gzbjwDpwju2UgCxriycAofVpTr9r-Qtlz_3CgsWH4bs7JciYicFXFHF4s_f8RHLVef5qwNhq9xNU0BMSG2bWHWwP91r7OM_7FXAEdcC3QVzb11c3-HDLQitwKkTPb-PJFkiGcp4GrFvg0CA3QvWE6VGFgGcW-wOI3cwxxsCR7-3OcJQDFSMpPdXinLcyGPr8BnkfFVktz6upctxCWFVTXTcXknaRooDsq_uw4VY2DT-8GhKcgdhQPsVJRqdGMGWhwHcgOkwiIJj5RblYP0YqMvYZhMkUxdoPkuNbiUHmpFe2CwhsBUl3KAUwAQ","domain":".id.kuaishou.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1721355061.494065,"sameSite":"no_restriction"}]';
  test('快手图文状态查询', async () => {
    //1705031972  uploadTime=1705032016
    const result = await Kuaishou.getKuaishouArticleStatus(
      cookie,
      '1705032016',
      '今天的天气很好啊，灰蒙蒙的雾霾很足啊',
    );
    console.log('快手图文状态查询：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('快手权益', async () => {
    const cookie1 = convertCookieStr(cookie);
    const result = await Kuaishou.getKuaishouShopPrivilege(cookie1);
    console.log('快手权益：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('检测用户有效性', async () => {

    const result = await new AccountService(cookie, Platforms.KuaiShou).checkAccountAlive();
    console.log('有效性:' + result);
    expect(result).toBe(1);
  });
});
