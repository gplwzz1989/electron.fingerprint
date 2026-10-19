import { Xinlangweibo, XinlangweiboVideoTaskInput } from '../../../src/media-platform/xinlangweibo/index';
import { describe, expect, test, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { Platforms } from '../../../src';
import { Cloud } from '../../../src/cloud/index';
import { Task } from '../../../src/utils';
export const getCookie = (fileName: string = 'cookie.txt'): string => {
  return fs.readFileSync(path.resolve(__dirname, fileName), { encoding: 'utf8' }).trim();
};

it('获取用户信息', async () => {
  const cookie = getCookie();
  const result = await Xinlangweibo.getXinlangweiboUserInfo(cookie);
  const pro=await Xinlangweibo.getXinlangweiboSchedulePostFrequency(cookie);
  console.log(JSON.stringify(pro,null,2));
  console.log(JSON.stringify(result,null,2));
});

describe.runIf(true)('【真实发布测试】', () => {
  test('新浪微博视频发布', async () => {
    const cookie = getCookie();

    const taskData: XinlangweiboVideoTaskInput = {
      taskId: '13123123',
      video: {
        localPath: 'I:\\download\\niao.mp4',
        width: 1080,
        height: 1920,
        duration: 0,
      },
      cover: {
        pathOrUrl: 'I:\\download\\bd2677fc-314c-41a8-bdeb-ea73a7d12622.jpg',
        width: 1920,
        height: 1080,
      },
      visibilityType: 1,
      //publishTime:new Date('2025-8-19 12:00').getTime(),
      title: '分享一套熊猫GIF表情套装',
      desc: '<p><topic raw="{&quot;topic&quot;:&quot;青岛天气[超话]&quot;,&quot;id&quot;:&quot;5e8d8066-7c22-4f1b-b6cd-3236e65fe0cc&quot;}" text="搞笑">#搞笑</topic>搞笑视频</p><p>看看html中话题<topic raw="{&quot;topic&quot;:&quot;天气之子[超话]&quot;,&quot;id&quot;:&quot;1b7f5d08-4955-4d7f-aaa2-5dd06b12fc19&quot;}"></topic></p>',
      // topics: [
      //   { topic: '青岛天气[超话]', id: '5e8d8066-7c22-4f1b-b6cd-3236e65fe0cc' },
      //   { topic: '天气之子[超话]', id: '1b7f5d08-4955-4d7f-aaa2-5dd06b12fc19' },
      // ],
      allowDownload: false,

      /**
       * 类型/创作类型
       * 0:原创
       * 1:转载
       * 2:二创
       *
       */
      createType: 1,
      // proxy: {
      //   serverAdd: 'd393.kdltpspro.com',
      //   serverPort: 15818,
      //   type: 'kuaidaili',
      //   userName: 't13552986932913',
      //   password: '2mbl9d6n',
      //   area: '',
      //   province: '11',
      // },
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const result = await Xinlangweibo.publishVideo(cookie, taskData, eventCall);

    console.log('新浪微博视频发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(false)('【新浪微博话题】', () => {
  test('新浪微博话题', async () => {
    const cookie = getCookie();

    const result = await Xinlangweibo.getXinlangweiboTopicList(cookie, '天气');

    console.log('新浪微博话题：', result);
    expect(result.code).toBe(0);
  }, 10000000);
});
//endregion

describe.runIf(true)('【新浪微博视频状态查询】', () => {
  test('新浪微博视频状态查询', async () => {
    const cookie = getCookie();

    const result = await Xinlangweibo.getXinlangweiboVideoStatus(cookie, '5230281239822373');

    console.log('新浪微博视频状态查询：', result);
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【新浪微博合集列表】', () => {
  test('新浪微博合集列表', async () => {
    const cookie = getCookie();

    const result = await Xinlangweibo.getXinlangweiboVideoCollectionList(cookie);

    console.log('新浪微博合集列表：', result);
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【新浪微博分类列表】', () => {
  test('新浪微博分类列表', async () => {
    const cookie = getCookie();

    const result = await Xinlangweibo.getWeiboCategory(cookie);

    console.log('新浪微博分类列表：', JSON.stringify(result,null,2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【新版发布流程】', () => {
  test(
    '新视频发布',
    async () => {
      const result = Cloud.pushOpenPlatformPublishTask(
        {"callBackData":{"teamId":"6821ac8d50bc5fd636fa9801","userId":"6842b9707731899191a8ada5"},"publishType":"video","tasks":[{"taskId":"68e7723c653474d391caef46","publishData":{"video":{"duration":41.588,"width":1080,"height":1920,"size":47988791,"url":"https://oss.yixiaoer.cn/a297f37656d02f1b8543178f95d9cdf5/68e8c3bc/yfb/test/t-6821ac8d50bc5fd636fa9801/keugv0linhsfxbzki4d29","localPath":""},"covers":[{"width":607,"height":1080,"size":37473,"pathOrUrl":"https://oss.yixiaoer.cn/6936b9714f1b84f08e13fc1ba32dbffd/68e8c3bc/yfb/test/t-6821ac8d50bc5fd636fa9801/befgo7pmaefmd51yhx53q","format":""}],"title":"数据大屏","desc":"<p>数据大屏的作用</p>","createType":1,"location":null,"prePubTime":1760171246329,"visibleType":0},"authorInfo":{"platformName":"新浪微博","id":"cmg5zvov8001cgy0jcaw0xbqh","proxy":{"serverAdd":"10.0.0.6","serverPort":"4843"}}}],"publishChannel":"cloud","platform":[{"id":"cmg5zvov8001cgy0jcaw0xbqh","platformCode":"XinLangWeiBo","platformUserId":"7915231671","platformUserName":"蚁小二一键分发","platformCookie":"[{\"name\":\"X-CSRF-TOKEN\",\"value\":\"CK-YcoFiN_Imco0iJX5mN_Cib21wERlmxaFmc81zgXCMc_OIc7C=\",\"domain\":\".passport.weibo.com\",\"hostOnly\":false,\"path\":\"/\",\"secure\":true,\"httpOnly\":false,\"session\":true,\"sameSite\":\"unspecified\"},{\"name\":\"SCF\",\"value\":\"AnRnfubStTSM3UuuMNrk4ri16jALOIzqEf1XMTZmXREnFXeIk4-ztMDMUfo-l2FGCWAgSV34SoPIEbskJMVf8LQ.\",\"domain\":\".weibo.com\",\"hostOnly\":false,\"path\":\"/\",\"secure\":true,\"httpOnly\":true,\"session\":false,\"expirationDate\":1794550954.713016,\"sameSite\":\"no_restriction\"},{\"name\":\"SUB\",\"value\":\"_2A25F4yT5DeRhGeFH6lcT8y_KzD2IHXVmgTgxrDV8PUNbmtAbLXnckW9Ne_eieiVoRJ4AFdvLhDwgQjm49ib7C8I5\",\"domain\":\".weibo.com\",\"hostOnly\":false,\"path\":\"/\",\"secure\":true,\"httpOnly\":true,\"session\":false,\"expirationDate\":1791526953.716944,\"sameSite\":\"no_restriction\"},{\"name\":\"SUBP\",\"value\":\"0033WrSXqPxfM725Ws9jqgMF55529P9D9W5u0HJ2Z8nGKj6KXTvOaI-L5JpX5KzhUgL.FoM4eK-Ee02cS022dJLoI0YLxKnL1-2L1h2LxK-LBo5L12qLxKBLB.2L12eLxKBLBonL1h5LxK.L1KBLB--LxK-L1hnL1hqLxK-L12qL1K2t\",\"domain\":\".weibo.com\",\"hostOnly\":false,\"path\":\"/\",\"secure\":true,\"httpOnly\":false,\"session\":false,\"expirationDate\":1791526954.717078,\"sameSite\":\"no_restriction\"},{\"name\":\"ALC\",\"value\":\"ALC-8DFvkX-1759990954-4-214019445-a67178236b23073b9f6b859ac745-2\",\"domain\":\".passport.weibo.com\",\"hostOnly\":false,\"path\":\"/\",\"secure\":true,\"httpOnly\":true,\"session\":false,\"expirationDate\":1762582954.717139,\"sameSite\":\"no_restriction\"},{\"name\":\"ALF\",\"value\":\"02_1762582954\",\"domain\":\".weibo.com\",\"hostOnly\":false,\"path\":\"/\",\"secure\":true,\"httpOnly\":false,\"session\":false,\"expirationDate\":1762582954.717191,\"sameSite\":\"unspecified\"},{\"name\":\"ALF\",\"value\":\"02_1762582954\",\"domain\":\".sina.com.cn\",\"hostOnly\":false,\"path\":\"/\",\"secure\":true,\"httpOnly\":false,\"session\":false,\"expirationDate\":1762582954.862293,\"sameSite\":\"unspecified\"},{\"name\":\"ALC\",\"value\":\"ALC-8DFvkX-1759990954-4-1360594121-25a00f21ba2414190d0d5b5b5d10-2\",\"domain\":\".login.sina.com.cn\",\"hostOnly\":false,\"path\":\"/\",\"secure\":true,\"httpOnly\":true,\"session\":false,\"expirationDate\":1762582954.862019,\"sameSite\":\"no_restriction\"},{\"name\":\"SCF\",\"value\":\"AnRnfubStTSM3UuuMNrk4ri16jALOIzqEf1XMTZmXREnFXeIk4-ztMDMUfo-l2FGCdeBSq1PXPv00hctnE71gT0.\",\"domain\":\".sina.com.cn\",\"hostOnly\":false,\"path\":\"/\",\"secure\":true,\"httpOnly\":true,\"session\":false,\"expirationDate\":1794550954.862547,\"sameSite\":\"no_restriction\"},{\"name\":\"SUB\",\"value\":\"_2A25F4yT5DeRhGeFH6lcT8y_KzD2IHXVmgTgxrDV_PUJbkNAbLXehkW9Ne_eiehqmgDL8V6A8MnaLSbKufcwdGveL\",\"domain\":\".sina.com.cn\",\"hostOnly\":false,\"path\":\"/\",\"secure\":true,\"httpOnly\":true,\"session\":false,\"expirationDate\":1791526953.862599,\"sameSite\":\"no_restriction\"},{\"name\":\"SUBP\",\"value\":\"0033WrSXqPxfM725Ws9jqgMF55529P9D9W5u0HJ2Z8nGKj6KXTvOaI-L5NHD95QN1K2feoepSoMpWs4Dqcj6i--RiKLWiKnpi--fi-z7iKysi--Xi-iWiKyhi--Xi-zRiKn7i--4iK.Xi-88i--fiKnRiKnci--fiKysiK.p\",\"domain\":\".sina.com.cn\",\"hostOnly\":false,\"path\":\"/\",\"secure\":true,\"httpOnly\":false,\"session\":false,\"expirationDate\":1760595754.862644,\"sameSite\":\"no_restriction\"},{\"name\":\"SCF\",\"value\":\"AnRnfubStTSM3UuuMNrk4ri16jALOIzqEf1XMTZmXREnFXeIk4-ztMDMUfo-l2FGCf5trOCZjyjEi0rASuPLCWY.\",\"domain\":\".weibo.cn\",\"hostOnly\":false,\"path\":\"/\",\"secure\":true,\"httpOnly\":true,\"session\":false,\"expirationDate\":1794550954.983674,\"sameSite\":\"no_restriction\"},{\"name\":\"SUB\",\"value\":\"_2A25F4yT5DeRhGeFH6lcT8y_KzD2IHXVmgTgxrDV6PUJbktAbLWjzkW1Ne_eielkQzbsq6h0qvxWiHGKAxhLKUwK9\",\"domain\":\".weibo.cn\",\"hostOnly\":false,\"path\":\"/\",\"secure\":true,\"httpOnly\":true,\"session\":false,\"expirationDate\":1791526952.983873,\"sameSite\":\"no_restriction\"},{\"name\":\"SUBP\",\"value\":\"0033WrSXqPxfM725Ws9jqgMF55529P9D9W5u0HJ2Z8nGKj6KXTvOaI-L5NHD95QN1K2feoepSoMpWs4Dqcj6i--RiKLWiKnpi--fi-z7iKysi--Xi-iWiKyhi--Xi-zRiKn7i--4iK.Xi-88i--fiKnRiKnci--fiKysiK.p\",\"domain\":\".weibo.cn\",\"hostOnly\":false,\"path\":\"/\",\"secure\":true,\"httpOnly\":false,\"session\":false,\"expirationDate\":1791526954.983917,\"sameSite\":\"no_restriction\"},{\"name\":\"SSOLoginState\",\"value\":\"1759990955\",\"domain\":\".weibo.cn\",\"hostOnly\":false,\"path\":\"/\",\"secure\":true,\"httpOnly\":false,\"session\":true,\"sameSite\":\"no_restriction\"},{\"name\":\"ALF\",\"value\":\"1762582955\",\"domain\":\".weibo.cn\",\"hostOnly\":false,\"path\":\"/\",\"secure\":true,\"httpOnly\":false,\"session\":false,\"expirationDate\":1762582954.983985,\"sameSite\":\"no_restriction\"},{\"name\":\"XSRF-TOKEN\",\"value\":\"X6l6D7sNsI04BvofggjtRlnG\",\"domain\":\"weibo.com\",\"hostOnly\":true,\"path\":\"/\",\"secure\":true,\"httpOnly\":false,\"session\":true,\"sameSite\":\"unspecified\"},{\"name\":\"WBPSESS\",\"value\":\"4_PjK3QcjlR77QxvLr24DoBdkbltn1NshoboJiuo8WtNHSAls3vh2fEQ08-k8TTJa7jz_V8tzKmWopdZ8yIYrMdjKYT8sRc5yoCmgtjg1iq6dAKfe-FjJWbKVGhWECXaHMdBP4gdXxiJjGW9Nv5Uqg==\",\"domain\":\"weibo.com\",\"hostOnly\":true,\"path\":\"/\",\"secure\":true,\"httpOnly\":true,\"session\":false,\"expirationDate\":1760077355.154347,\"sameSite\":\"unspecified\"}]","platformLocalStorage":"{\"__url__\":\"https://e.weibo.com/v1/eps/manage/home?url=https%3A%2F%2Fe.weibo.com%2Fv1%2Feps%2Fhomepage\"}"}],"authorization":"sess_95feb2bda820d374300a1636fba166ed2d2dc9b8e79c5746cc2d08b8bd805c98"},
        '123',
      );
      console.log(JSON.stringify(result, null, 2));
      await Task.Delay(40 * 60 * 1000);
    },
    40 * 60 * 1000,
  );
});
