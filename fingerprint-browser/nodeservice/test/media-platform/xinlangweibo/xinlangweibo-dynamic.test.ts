import { Xinlangweibo, XinlangweiboMicroArticleTaskInput } from '../../../src/media-platform/xinlangweibo/index';
import { describe, expect, it, test } from 'vitest';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { PubContentEnum } from '../../../src/cloud/model/TypeEnum';

export const getCookie = (fileName: string = 'cookie.txt'): string => {
  return fs.readFileSync(path.resolve(__dirname, fileName), { encoding: 'utf8' }).trim();
};

if (false) {
  it('获取用户信息', async () => {
    const cookie = getCookie();
    const result = await Xinlangweibo.getXinlangweiboUserInfo(cookie);
    console.log(result);
  });
}

//region 真实测试
// 在此编写需要进行真实测试的代码，CI不会运行下列代码。
// ⚠️⚠️⚠️请注意，真实测试会真实发送请求，因此请谨慎使用。⚠️⚠️⚠️
// 将 describe.runIf(false) 改为 describe.runIf(true) 即可开启真实测试。测试完成需要改回 false。

describe.runIf(true)('【真实测试】', () => {
  test('新浪微博短内容发布', async () => {
    const cookie = getCookie();

    const taskData: XinlangweiboMicroArticleTaskInput = {
      taskId: '13123123',
      visible: 0,
      contentText: '<p>啊手动滑稽<topic text="搞笑">#搞笑</topic> <topic text="天气">#天气</topic> 久啊速度快</p>"',

      // topics: ['天气', '阳光'],
      // mentionedFriends: [
      //   { uid: 5186027114, screen_name: '微博视频', remark: '' },
      //   { uid: 6068931041, screen_name: '生活在成都', remark: '' },
      // ],
      //schedule_timestamp: 1745818134213,
      images:[{pathOrUrl:'I:\\download\\20251217-164426.jpg'}]
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const userInfo = await Xinlangweibo.getXinlangweiboUserInfo(cookie);

    const result = await Xinlangweibo.publishDynamic(
      cookie,
      userInfo.data?.user?.id,
      userInfo.data.user?.watermark.markpos,
      userInfo.data.user?.watermark.nick,
      taskData,
      eventCall,
    );

    console.log('新浪微动态频发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【真实测试】', () => {
  test('新浪微博好友获取', async () => {
    const cookie = getCookie();

    const result = await Xinlangweibo.getXinlangweiboFriendList(cookie);

    console.log('新浪微博好友获取：', result);
    expect(result.code).toBe(0);
  }, 10000000);

  test('新浪微博好友获取', async () => {
    const cookie = getCookie();

    const result = await Xinlangweibo.getXinlangweiboVideoStatus(cookie, '5097372767750862');

    console.log('新浪微博好友获取：', result);
    expect(result.code).toBe(0);
  }, 10000000);

  //schedule_id=5160037707157447

  test('新浪微博状态', async () => {
    const cookie = getCookie();

    const result = await Xinlangweibo.getXinlangweiboVideoStatus(cookie, '5160037707157447');

    console.log('新浪微博状态：', result);
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【真实测试】', () => {
  test('删除', async () => {
    const cookie = getCookie();

    const result = await Xinlangweibo.deleteXinlangweiboContent(
      cookie,
      '5215857116447450',
      PubContentEnum.dynamic,
      false,
      '',
    );

    console.log('微博删除：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

//endregion
