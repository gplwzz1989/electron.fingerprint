import { describe, expect, test } from 'vitest';
import { ShipinhaoDynamicTaskInput } from '../../../src/media-platform/shipinhao';
import { EventEmitter } from 'events';
import { Shipinhao } from '../../../src/media-platform/shipinhao';
import { AccountService, Platforms } from '../../../src';
import { convertCookieStr } from '../../../src/utils';

//region 真实测试
// 在此编写需要进行真实测试的代码，CI不会运行下列代码。
// ⚠️⚠️⚠️请注意，真实测试会真实发送请求，因此请谨慎使用。⚠️⚠️⚠️
// 将 describe.runIf(false) 改为 describe.runIf(true) 即可开启真实测试。测试完成需要改回 false。

describe.runIf(true)('【视频号图文发布真实测试】', () => {
  const cookie =
    'sessionid=BgAA9dAsaYveTVEGBXt23YXSJcia9EdCoFu%2BLSdcYf3N85y6nHL7%2FSlwPrpi288anC978H2o8sRYJqxXvIJSPguTlPsdJ42cVXjrUkgruUSH; wxuin=2408054298';
  test('视频号图文发布', async () => {
    const taskData: ShipinhaoDynamicTaskInput = {
      pubType: 1,
      taskId: '1717809227264909312',

      images: [
        {
          width: 800,
          height: 600,
          size: 312342,
          pathOrUrl:
            'https://oss-v2.yixiaoer.cn/yfb/test/t-6842b9707731899191a8ada3/6rtwd4a86xyarsllzj2et',
        },
        {
          width: 800,
          height: 600,
          size: 312342,
          pathOrUrl:
            'https://oss-v2.yixiaoer.cn/yfb/test/t-6842b9707731899191a8ada3/6rtwd4a86xyarsllzj2et',
        }
      ],
      title: '今天的天气标题',
      desc: '<p>家居好物我家的高颜值厨房好物，如果你用过一款好的锅<topic text="厨房好物" raw="{&quot;name&quot;:&quot;厨房好物&quot;,&quot;id&quot;:&quot;c4a74f88-bde7-4d15-a440-c5d21b5b7036s&quot;}"></topic>你会发现当属铁锅！<friend raw="{&quot;userId&quot;:1317651205,&quot;nickName&quot;:&quot;冷少呀&quot;,&quot;fansCount&quot;:0,&quot;headUrl&quot;:&quot;&quot;}"></friend></p>',
      uin: 0,
      finderUsername: '',
      statement:{type:1}
      //effectiveTime: 1737510240,
      // music: {
      //   id: '14564694613082118556',
      //   name: '盐城颜韵的背景声音',
      //   authorName: '盐城颜韵',
      //   image: 'http://wx.qlogo.cn/finderhead/XzhF92tBcexeR3GQSR2zZzFZYB8pU9e6H50kHuQHiaLo9Cw1nz1dkiag/0',
      //   url: 'https://finder.video.qq.com/251/20302/stodownload?encfilekey=Cvvj5Ix3eewK0tHtibORqcsqchXNh0Gf3sJcaYqC2rQBYdicjZT2wlNGBC6KR7HIoPm4XwwdLlTLKpVGssCDD6m8JbIwicLeY8YjFwjWHmp2QLZm8KibsNhK1r1bheABQTum&token=x5Y29zUxcibBQej2eWE62LyCKAG7M5ABMMqXUpO8STcg3P0RMq6LJP1DLpSAbTKInZBjicc0S2h712l7vCeffkXSzYQqLYbNicqEM55NEod8jibibpkgjQtRf74VGHO8IiaIoj05deV1ZM2lE7TmVcTWRyibVRZyxX5NqPnC6lQncQGEbU&idx=1&hy=SH&m=&uzid=2&X-snsvideoflag=xWT253',
      //   duration: 7000,
      //   raw: {
      //     colorList: [],
      //     hitInfo: [],
      //     playableInfo: {
      //       listenId: '14564694613082118556',
      //       type: 4,
      //       title: '盐城颜韵的背景声音',
      //       author: '盐城颜韵',
      //       cover: 'http://wx.qlogo.cn/finderhead/XzhF92tBcexeR3GQSR2zZzFZYB8pU9e6H50kHuQHiaLo9Cw1nz1dkiag/0',
      //       duration: 7000,
      //       finderFeedId: '',
      //       finderNonceId: '',
      //       finderExportId:
      //         'export/UzFfAgtgekIEAQAAAAAAYxcVRHlQ_gAAAAstQy6ubaLX4KHWvLEZgBPEyIBIKEZ-VvWJzNPgMJ8jr3tjyElxMunFvvdANRhY',
      //     },
      //     playable: 1,
      //     url: 'https://finder.video.qq.com/251/20302/stodownload?encfilekey=Cvvj5Ix3eewK0tHtibORqcsqchXNh0Gf3sJcaYqC2rQBYdicjZT2wlNGBC6KR7HIoPm4XwwdLlTLKpVGssCDD6m8JbIwicLeY8YjFwjWHmp2QLZm8KibsNhK1r1bheABQTum&token=x5Y29zUxcibBQej2eWE62LyCKAG7M5ABMMqXUpO8STcg3P0RMq6LJP1DLpSAbTKInZBjicc0S2h712l7vCeffkXSzYQqLYbNicqEM55NEod8jibibpkgjQtRf74VGHO8IiaIoj05deV1ZM2lE7TmVcTWRyibVRZyxX5NqPnC6lQncQGEbU&idx=1&hy=SH&m=&uzid=2&X-snsvideoflag=xWT253',
      //     isVideoUrl: true,
      //     musicType: 2,
      //     bgmSource: 2,
      //   },
      // },
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const result = await Shipinhao.publishDynamic(cookie, taskData, eventCall);

    console.log('视频号图文发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);

  //rjD5jyTuFrIpZ2ibE8T7Ym3K77SEULgkia7lJWIiatUK8Jicib0nuG236M1ngpGR4YT3u47nicKxAsGEoKZz6rl70v7Ezr1T9iaYDibeFibhYgLLLwNBGf9mq3OgrkA
  test('视频号图文查询', async () => {
    const result = await Shipinhao.getShipinhaoMediaStatus(
      cookie,
      'rjD5jyTuFrIpZ2ibE8T7Ym3K77SEULgkia7lJWIiatUK8Jicib0nuG236M1ngpGR4YT3u47nicKxAsGEoKZz6rl70v7Ezr1T9iaYDibeFibhYgLLLwNBGf9mq3OgrkA',
    );

    console.log('视频号图文发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);

  test('视频号用户信息', async () => {
    const result = await Shipinhao.getShipinhaoUserInfo(cookie);

    console.log('视频号用户信息：', result);
    expect(result.code).toBe(0);
  }, 10000000);

  test('视频号获取音乐列表-搜索', async () => {
    const result = await Shipinhao.getShipinhaoMusicList(cookie, 'search', '爱你',2, '', 5);

    console.log('视频音乐信息：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('视频号获取音乐列表-推荐', async () => {
    const result = await Shipinhao.getShipinhaoMusicList(cookie, 'recommend', '', 2, 'CAUQsYS4+fCDiwM=', 5);

    console.log('视频音乐信息：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('视频号获取音乐列表-收藏', async () => {
    const result = await Shipinhao.getShipinhaoMusicList(cookie, 'collect', '', 1, '', 5);

    console.log('视频音乐信息：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('检测用户有效性', async () => {
    const cookie =
      convertCookieStr("[{\"name\":\"sessionid\",\"value\":\"BgAAzYUiRtwDjkk2WxpQ%2BBixRfCeRF3vZJFuMOQ1AtKFL0yrmgd2xFWfjVEXkT13BcWwJtS5l7VIf1FdiEP16RP9U1MF9UgczDxGQbGgpVGa\",\"domain\":\"channels.weixin.qq.com\",\"hostOnly\":true,\"path\":\"/\",\"secure\":true,\"httpOnly\":false,\"session\":false,\"expirationDate\":1806546810.086961,\"sameSite\":\"no_restriction\"},{\"name\":\"wxuin\",\"value\":\"3379631448\",\"domain\":\"channels.weixin.qq.com\",\"hostOnly\":true,\"path\":\"/\",\"secure\":true,\"httpOnly\":false,\"session\":false,\"expirationDate\":1806546810.087035,\"sameSite\":\"no_restriction\"}]");
    const result = await new AccountService(cookie, Platforms.ShiPinHao).checkAccountAlive();
    console.log('有效性:' + result);
    expect(result).toBe(1);
  });
});
