import { Xiaohongshu, XiaohongshuVideoTaskInput } from '@/media-platform/xiaohongshu/xiaohongshu';
import { describe, expect, it, test } from 'vitest';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { getUserInfo } from '../../../src/media-platform/xiaohongshu/xiaohongshu-base.service';
import { AccountService, Cloud, Platforms } from '../../../src';
import { convertCookieStr, Task } from '../../../src/utils';

export const getCookie = (fileName: string = 'cookie.txt'): string => {
  return fs.readFileSync(path.resolve(__dirname, fileName), { encoding: 'utf8' }).trim();
};

describe.runIf(true)('【真实测试】', () => {
  test('小红书发布', async () => {
    const cookie = getCookie();

    const taskData: XiaohongshuVideoTaskInput = {
      pubType: 1,
      taskId: '13123123',
      video: {
        localPath: 'I:\\download\\niao.mp4',
        size: 17876417,
        duration: 86,
      },
      cover: {
        pathOrUrl: 'I:\\download\\20250530-114657.jpg',
        width: 960,
        height: 720,
      },
      visibilityType: 1,
      isOriginal: 1,
      title: '',
      //desc: '对同行心慈手软就是对自己残忍',
      desc: '',
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
      //postTime: 1750176000000,
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
      // userDeclarationBind: {
      //   bind: 1,
      // },
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const result = await Xiaohongshu.publishVideo(cookie, taskData, eventCall);

    console.log('小红书发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【有效查询】', () => {
  test('小红书有效查询', async () => {
    const cookie = getCookie();
    const result = await Xiaohongshu.getXiaohongshuLiveDataOverview(cookie);
    console.log(JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【状态查询】', () => {
  test('小红书状态查询', async () => {
    const cookie = getCookie();
    const result = await Xiaohongshu.getXiaohongshuMediaStatus(cookie, '6a5ec3de0000000001030db8');
    console.log(JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
    expect(result.code).toBe(0);
  }, 10000000);
});
if (true) {
  it('用户信息有效性', async () => {
    const cookie = getCookie();
    const result = await new AccountService(cookie, Platforms.XiaoHongShu).checkAccountAlive();
    console.log(result);
    expect(result).toBe(1);
  });
  it('获取用户信息', async () => {
    const cookie = getCookie();
    const result = await getUserInfo(cookie);
    console.log(result);
    expect(result.result).toBe(0);
  });
  it('获取好友/用户', async () => {
    const cookie = getCookie();
    const result = await Xiaohongshu.getXiaohongshuFriendList(cookie, '');
    console.log(JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  });

  it('获取话题', async () => {
    const cookie = getCookie();
    const result = await Xiaohongshu.getXiaohongshuTopicList(cookie, '搞笑');
    console.log(JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  });
  it('获取地点', async () => {
    const cookie = getCookie();
    const result = await Xiaohongshu.getXiaohongshuLocationList(cookie, '五一广场');
    console.log(JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  });
  it('获取作品审核状态', async () => {
    const cookie = getCookie();
    const result = await Xiaohongshu.getXiaohongshuMediaStatus(cookie, '6685fbb1000000001f0045dd');
    console.log(JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  });
}

describe.runIf(true)('【好友查询】', () => {
  test('小红书状态查询', async () => {
    const cookie = getCookie();

    const result = await Xiaohongshu.getXiaohongshuFriendList(cookie, '蚁小二');
    console.log(JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
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
              platformCode: Platforms.XiaoHongShu,
              platformCookie:
                'a1=1993ceace54dfu3npu5atbgxpy6cqxnelzud853z950000285482; webId=3b37b5e5a1032e9aec95aa0be72b7d53; customer-sso-sid=68c517549108255059574784plzfjrgzbzqx28gy; x-user-id-ark.xiaohongshu.com=605418e20000000001008a3e; customerClientId=746042430884954; gid=yjjqSdfyK21fyjjqSd0Sdu2q24fi7qIU72097ujDkCUvKf28SACIdY888JY24YJ8W4YS8D2i; access-token-ark.xiaohongshu.com=customer.ark.AT-68c517550142130997280780vari1wy71d2br1rs; xsecappid=ugc; x-user-id-creator.xiaohongshu.com=605418e20000000001008a3e; access-token-creator.xiaohongshu.com=customer.creator.AT-68c51755014711315914752804rjhuzdtrttn5xa; galaxy_creator_session_id=WFPhdpueOM902sWXrDk8TPg8x5VAZVTNBqKH; galaxy.creator.beaker.session.id=1757905612754062227132; websectiga=2845367ec3848418062e761c09db7caf0e8b79d132ccdd1a4f8e64a11d0cac0d; sec_poison_id=a123e538-b948-4a92-b337-b4ba2976a864; acw_tc=0a0d0eb817579068162053426e7425a9e21b201e2b8e8518f7496325a4bc4b; loadts=1757906816898',
            },
          ],
          tasks: [
            {
              taskId: '7',
              authorInfo: {
                platform: Platforms.XiaoHongShu,
                id: '81231231237',
                cookie: '',
                authorId: '',
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
                desc: '<p>我是<topic text="辣条">#ahsh#</topic>描述啊</p><p><friend raw=\'{"yixiaoerId":"61b8073f000000001000c5c2","yixiaoerName":"蚁小二一键分发系统","yixiaoerImageUrl":"https://sns-avatar-qc.xhscdn.com/avatar/6720a8c7930b300001933136.jpg?imageView2/2/w/80/format/jpg","raw":{"image_size_large":"https://sns-avatar-qc.xhscdn.com/avatar/6720a8c7930b300001933136.jpg?imageView2/2/w/120/format/jpg","red_official_verified":true,"show_red_official_verify_icon":true,"red_id":"1499404136","user_id":"61b8073f000000001000c5c2","user_nickname":"蚁小二一键分发系统","desc":"有空就分享一些自媒体运营小知识 \\\\n自媒体一键分发工具\\\\n觉得我分享的运营知识有用就关注我呗 \\\\n欢迎私信","image":"https://sns-avatar-qc.xhscdn.com/avatar/6720a8c7930b300001933136.jpg?imageView2/2/w/80/format/jpg","followed":false,"red_official_verify_type":2}}\'></friend>挂车</p>',
                visibleType: 1,
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

describe.runIf(true)('【活动话题查询】', () => {
  test('活动话题查询', async () => {
    const cookie = getCookie();

    const result = await Xiaohongshu.getXiaoHongShuActivityListInfo(cookie);
    console.log(JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
    expect(result.code).toBe(0);
  }, 10000000);
});
