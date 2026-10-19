import { describe, expect, test } from 'vitest';
import { EventEmitter } from 'events';
import { ShipinhaoVideoTaskInput } from '@/media-platform/shipinhao/shipinhao-video.service';
import { Cloud, Shipinhao, Platforms } from '../../../src';
import { convertCookieStr, Task } from '../../../src/utils';
import { ShiPinHaoUserInfoResponse } from '../../../src/media-platform/shipinhao/shipinhao-base.service';

describe.runIf(true)('【真实测试】', () => {
  const cookie =
    convertCookieStr('sessionid=BgAAXOjBib%2FNoSrTln3WIqvKRE%2Bu6%2BB6AhGU8ml9xvx2Yaaw1c8pzLrFB8xGaeS2Ret%2FA084WqUEjF9xtI6IVNfhdIH5MxDdoAADpV5bXU4%3D');
  test('视频号地址搜索测试', async () => {
    const result = await Shipinhao.getShipinhaoLocation(cookie, '天府广场');

    // assets
    console.log('视频号地址：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('视频号视频发布测试', async () => {
    let taskData: ShipinhaoVideoTaskInput = {
      pubType: 1,
      taskId: '1717809227264909312',
      cover: {
        pathOrUrl:
          'https://yixiaoer-img.oss-cn-shanghai.aliyuncs.com/20240201/e5560fe9-49a2-4c65-b9d2-a7b3ec1c6ff5.jpg',
      },
      postFlag: 0,
      uin: 0,
      finderUsername: '',

      //描述
      desc: '对话华大基因尹烨引发癌症的因素有哪些！n',

      video: {
        localPath: 'Z:\\系统默认下载位置\\对话华大基因尹烨引发癌症的因素有哪些.mp4',
        width: 1920,
        height: 1080,
        duration: 59,
      },
      //活动
    };
    taskData = {
      pubType: 1,
      taskId: '',
      uin: 0,
      video: {
        duration: 407,
        width: 1080,
        height: 1260,
        size: 17071440,
        localPath: 'I:\\download\\niao.mp4',
      },
      cover: {
        width: 804,
        height: 1080,
        size: 229494,
        pathOrUrl: 'I:\\download\\d2c35ece-e211-4f4f-ac28-13daf8e05595.jpg',
      },
      horizontalCover:{
        width: 804,
        height: 1080,
        size: 229494,
        pathOrUrl: 'I:\\download\\niao.jpg',
      },
      //desc: '<p>家居好物我家的高颜值厨房好物，如果你用过一款好的锅<topic text="厨房好物" raw="{&quot;name&quot;:&quot;厨房好物&quot;,&quot;id&quot;:&quot;c4a74f88-bde7-4d15-a440-c5d21b5b7036s&quot;}"></topic>你会发现<topic text="好物分享" raw="{&quot;name&quot;:&quot;好物分享&quot;,&quot;id&quot;:&quot;936ba463-f7f2-42d3-994c-fec9073525b1s&quot;}"></topic>其他的锅都没有你的好用<topic text="好物推荐" raw="{&quot;name&quot;:&quot;好物推荐&quot;,&quot;id&quot;:&quot;e6ab755f-3d1b-466e-9e2e-3490547b8938s&quot;}"></topic>最好用、最实用、最安全的锅<topic text="厨房物品" raw="{&quot;name&quot;:&quot;厨房物品&quot;,&quot;id&quot;:&quot;32cfb6f0-a222-4a92-ba4e-15b07276f51as&quot;}"></topic>当属铁锅！</p>',
      shortTitle: '',
      //uin: 145381578,
      finderUsername: '',
      mentionUser: [],
      postFlag: 0,
      topics: [],
      //effectiveTime:1743566280
      // location: {
      //   uid: 'qqmap_12733205952214486088',
      //   name: '天府广场地铁2号线宽窄巷子旁精品公寓(文庙西街分店)',
      //   longitude: 104.05096435546875,
      //   latitude: 30.656295776367188,
      //   address: '文庙西街101号',
      //   province: '四川省',
      //   city: '成都市',
      //   region: '青羊区',
      //   fullAddress: '四川省成都市青羊区文庙西街101号',
      //   source: 0,
      // },
      // proxy: {
      //   serverAdd: 'q317.kdltpspro.com',
      //   serverPort: 15818,
      //   type: 'kuaidaili',
      //   userName: 't13520529596225',
      //   password: 'ri29p0ex',
      //   area: '',
      //   province: '11',
      //   sid: 'aa0001',
      // },
    };

    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });

    const result = await Shipinhao.publishVideo(cookie, taskData, eventCall, '');

    // assets
    console.log('s视频号横版视频发布：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('视频号视频发布状态', async () => {
    const result = await Shipinhao.getShipinhaoMediaStatus(
      cookie,
      'rjD5jyTuFrIpZ2ibE8T7Ym3K77SEULgkial2eksCKd4vZRVbfLA86nlJYY6t59Zkj5r77kEMSVRvXqZdxsBlxJfE2asRqWLXHz61zy5jfYEZxGC4ibDrSO34w',
    );

    // assets
    console.log('s视频号横版视频状态：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('视频号用户信息', async () => {
    const result = await Shipinhao.getShipinhaoUserInfo(cookie);

    const oriInfo = result?.data as never as ShiPinHaoUserInfoResponse;
    let mm= !!oriInfo?.data?.entranceInfo?.nativeDramaSelfOperatedEntrance;
    // assets
    console.log('视频号状态：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('视频号商品列表', async () => {
    const result = await Shipinhao.getShipinhaoGoods(cookie, '10000301644007');

    // assets
    console.log('视频号商品列表：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('视频号用户列表', async () => {
    const result = await Shipinhao.getShipinhaoFriend(cookie, '王者');

    // assets
    console.log('视频号用户列表：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('视频号活动列表', async () => {
    const result = await Shipinhao.getShipinhaoActivity(cookie, '王者');

    // assets
    console.log('视频号活动列表：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('视频号挂车权限', async () => {
    const result = await Shipinhao.getShipinhaoPrivilege(cookie);

    // assets
    console.log('视频号挂车权限：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('视频号地址', async () => {
    const result = await Shipinhao.getShipinhaoLocation(cookie,'天府');

    // assets
    console.log('视频号地址：', JSON.stringify(result, null, 2));
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
              platformCode: Platforms.ShiPinHao,
              platformCookie:
                'qq_domain_video_guid_verify=18c1f9591ade489b; _qimei_uuid42=1981d12002c10041c1f1e18d1de62ccaf4461d23c2; video_platform=2; video_guid=18c1f9591ade489b; _qimei_fingerprint=39f9123ef8044d0c2b6a05d6dc1ae5b6; _qimei_i_3=5fea4d819d5b57d9c1c5f6310f8c75b6f3edf7a2400850d1b0882e5f739a2169686b35943989e2bbb082; _qimei_h38=8f95bee2c1f1e18d1de62cca02000009e1981d; RK=W6c80Ydbab; ptcz=44037b88a68371d74a6db0c9aa64e6e03f92ec6f975add7fa43e64f8d60add87; vdevice_h38=8f95bee2c1f1e18d1de62cca02000009e1981d; vdevice_h42=1981d12002c10041c1f1e18d1de62ccaf4461d23c2; vqq_next_refresh_time=7200; v_next_refresh_time=7200; qq_nick=%E7%8E%8B%E8%80%85%E4%BD%93%E9%AA%8C%E6%9C%8D; qq_head=https%3A%2F%2Ftvpic.gtimg.cn%2Fhead%2F13ac287746010364e3279f71daa8a54cda39a3ee5e6b4b0d3255bfef95601890afd80709%2F344; vcuid=9015271708; _qimei_i_1=6db3548ac353558994c2fc635ad272b5f6e6f0f0460e0580e7dc79582493206c61633ec03980eadd8292ddd4; vqq_login_time_init=1756461692; v_login_time_init=1756461692; _vcuid_debug="2025-08-29 18:01:33.199719272 +0800 CST m=+788932.949479715"; sessionid=BgAAoYfDbluLXaEE0UsF8IZrLN7%2FyA%2Bg6FOZACbjybpqNf4wUtJfefutOYs3V5TQ%2BRGVYmbP9nefP3mJrIGUCgVM3qLx1pxunz67snbgXCXb; wxuin=2748758218',
            },
          ],
          tasks: [
            {
              taskId: '7',
              authorInfo: {
                platform: Platforms.ShiPinHao,
                id: '81231231237',
                cookie: '',
                authorId: '',
              },
              publishData: {
                video: {
                  localPath: 'I:\\download\\20250915-102036.mp4',
                  url: '',
                  width: 1024,
                  height: 768,
                  duration: 120,
                  size: 123,
                },
                covers: [
                  {
                    pathOrUrl: 'I:\\download\\20250915-102132.jpg',
                    width: 1024,
                    height: 768,
                    size: 123,
                  },
                ],
                // short_title: 'AI拍视频',
                desc: '<p>3分钟教会<friend raw=\'{"yixiaoerId":"v2_060000231003b20faec8c5ea8b1cc2d3ca0ce937b077edf9fb2597852ebe3dab2eca48cc810e@finder","yixiaoerName":"王者荣耀风度t","yixiaoerImageUrl":"https://wx.qlogo.cn/finderhead/EXg9bKK3ibibLRmqicp7d2koW2hJIxiaPGUvNbmUwR175Iiaes4ZmKhYWjkTUicHtsE19ibSSA4HWKcialY/0","raw":{"username":"v2_060000231003b20faec8c5ea8b1cc2d3ca0ce937b077edf9fb2597852ebe3dab2eca48cc810e@finder","headImgUrl":"https://wx.qlogo.cn/finderhead/EXg9bKK3ibibLRmqicp7d2koW2hJIxiaPGUvNbmUwR175Iiaes4ZmKhYWjkTUicHtsE19ibSSA4HWKcialY/0","nickName":"王者荣耀风度t","authImgUrl":"https://dldir1v6.qq.com/weixin/checkresupdate/auth_icon_level3_2e2f94615c1e4651a25a7e0446f63135.png","authCompanyName":""}}\'>123</friend>你用AI拍视频</p>',
                pubType: 0,
                visibleType: 1,
                // activity: {
                //   yixiaoerId:
                //     'event/UzFfAgtgekIEAQAAAAAAc60Ez_vC8QAAAAstQy6ubaLX4KHWvLEZgBPEs6EMBBATYcL9zNPgMCmPJ3Hl_Y3fMr8XXXBDosb6ZdY',
                //   yixiaoerName: '微信时刻 · 王者荣耀神操作',
                //   raw: {
                //     eventTopicId:
                //       'event/UzFfAgtgekIEAQAAAAAAc60Ez_vC8QAAAAstQy6ubaLX4KHWvLEZgBPEs6EMBBATYcL9zNPgMCmPJ3Hl_Y3fMr8XXXBDosb6ZdY',
                //     eventName: '王者荣耀神操作',
                //     eventCreatorNickname: '微信时刻',
                //   },
                // },
                // shopping_cart: {
                //   yixiaoerId: '10000177538378',
                //   yixiaoerName:
                //     '【正版】剪映 视频剪辑/调色/特效从入门到精通 短视频制作/拍摄/录音 3分钟打造人气短视频 剪映教程书籍',
                //   yixiaoerDesc: '人民邮电出版社',
                //   yixiaoerImageUrl:
                //     'https://wst.wxapp.tc.qq.com/161/20304/snscosdownload/SZ/reserved/676d0970000cf9a827abb7ea4d67bc1e000000a000004f50?imageView2/1/w/800/h/800/q/50',
                //   price: 7980,
                //   count: 4012,
                //   raw: {
                //     imgUrls: [
                //       'https://wst.wxapp.tc.qq.com/161/20304/snscosdownload/SZ/reserved/676d0970000cf9a827abb7ea4d67bc1e000000a000004f50?imageView2/1/w/800/h/800/q/50',
                //     ],
                //     showBoxItems: [],
                //     iconUrls: [],
                //     belowTitleBlocks: [
                //       {
                //         wording: '运费险',
                //         color: 'rgba(0,0,0,0.4)',
                //         border: '0.5px solid rgba(0,0,0,0.1)',
                //         borderRadius: '3px',
                //         font: 0,
                //         tagType: 5,
                //       },
                //       {
                //         wording: '7天无理由',
                //         color: 'rgba(0,0,0,0.4)',
                //         border: '0.5px solid rgba(0,0,0,0.1)',
                //         borderRadius: '3px',
                //         font: 0,
                //         tagType: 4,
                //       },
                //     ],
                //     belowTitleBlocksBside: [],
                //     iconTags: [],
                //     coupons: [],
                //     productIconTags: [
                //       {
                //         tagType: 5,
                //       },
                //       {
                //         tagType: 4,
                //       },
                //     ],
                //     productId: '14000541806546',
                //     title:
                //       '【正版】剪映 视频剪辑/调色/特效从入门到精通 短视频制作/拍摄/录音 3分钟打造人气短视频 剪映教程书籍',
                //     stock: 4012,
                //     marketPrice: 20940,
                //     sellingPrice: 7980,
                //     status: 1,
                //     platformName: '人民邮电出版社',
                //     halfPage: {
                //       appid: 'wxca8d4b8e8feedc2a',
                //       path: 'main/channels/buy/buy.html?productId=10000177538378&realappid=wx089d33ad815a7801',
                //       headimgUrl:
                //         'http://mmbiz.qpic.cn/sz_mmbiz_png/vHjyUM7QDBrHtFvkqImwdHynhGhxXsfE6SPs56RyYLnkbt9SRj0V2Mxtcics5kwUs50Reia3u6YNiaVY0V79Trtrg/0?wx_fmt=png/0',
                //       nickname: '人民邮电出版社',
                //     },
                //     fullPage: {
                //       appid: 'wxalitecd3434f9a28b4db218f4730961d39d55',
                //       path: 'pages/pool/shop/detail?spuId=10000177538378&username=v2_060000231003b20faec8c5e1811cc4d1ce00e837b077ac9b887a7ba30cb9cf5765ff526e782c@finder',
                //       headimgUrl:
                //         'http://mmbiz.qpic.cn/sz_mmbiz_png/vHjyUM7QDBrHtFvkqImwdHynhGhxXsfE6SPs56RyYLnkbt9SRj0V2Mxtcics5kwUs50Reia3u6YNiaVY0V79Trtrg/0?wx_fmt=png/0',
                //       nickname: '人民邮电出版社',
                //       appType: 1,
                //     },
                //     noSale: 0,
                //     appid: 'wx089d33ad815a7801',
                //     isCarryingProduct: 1,
                //     commissionRate: 100000,
                //     commissionEstimate: 798,
                //     sales: 4725,
                //     outProductId: '10000177538378',
                //     thirdCategoryId: '128199',
                //     commissionInfo: {
                //       commissionRate: 100000,
                //       commissionEstimate: 798,
                //     },
                //     productType: 13,
                //     canRemove: 1,
                //     previewPage: {
                //       appid: 'wxca8d4b8e8feedc2a',
                //       path: 'main/pages/productDetail/productDetail.html?productId=10000177538378&realappid=wx089d33ad815a7801',
                //       headimgUrl:
                //         'http://mmbiz.qpic.cn/sz_mmbiz_png/vHjyUM7QDBrHtFvkqImwdHynhGhxXsfE6SPs56RyYLnkbt9SRj0V2Mxtcics5kwUs50Reia3u6YNiaVY0V79Trtrg/0?wx_fmt=png/0',
                //       nickname: '人民邮电出版社',
                //     },
                //     productArea: 0,
                //     customSortOrder: '0',
                //     giftActivityInfo: {
                //       productImgUrls: [],
                //     },
                //     previewPageParam: {
                //       productSource: 1,
                //       cpsSpuId: '10000177538378',
                //       cpsLink: '',
                //     },
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
