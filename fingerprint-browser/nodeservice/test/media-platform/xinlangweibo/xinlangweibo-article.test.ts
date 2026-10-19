import { Xinlangweibo, XinlangweiboArticleTaskInput } from '../../../src/media-platform/xinlangweibo/index';
import { describe, expect, test, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
export const getCookie = (fileName: string = 'cookie.txt'): string => {
  return fs.readFileSync(path.resolve(__dirname, fileName), { encoding: 'utf8' }).trim();
};

if (true) {
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
  test('新浪微博头条文章发布', async () => {
    const cookie = getCookie();

    const taskData: XinlangweiboArticleTaskInput = {
      taskId: '13123123',
      pubType: 1,
      uid: 0,
      markpos: 1,
      nick: '',
      title: '我就是天气好1',
      content: '<p> 未来的教育会如何</p><p><topic text="搞笑">#搞笑</topic></p>',
      cover: { pathOrUrl: 'I:\\download\\niao.jpg' },
      contentText: '',
      follow_to_read: 0,
      rank: 0,
      time: '',
      topics: ['天气', '阳光'],
      // collection: [
      //   {
      //     allow_free: 1,
      //     article_num: 4,
      //     article_num_info: '共计4/0篇内容',
      //     buy_count: 0,
      //     cover: 'https://img.t.sinajs.cn/t6/style/images/pagecard/pic03.jpg',
      //     created_time: '1970-01-01 08:33:40',
      //     creator: 3993848527,
      //     edited_time: '1970-01-01 08:33:42',
      //     finished: 1,
      //     follow_num: 0,
      //     id: 7589408955471873,
      //     is_pay: 0,
      //     oid: '1022:2327187589408955471873',
      //     pay_options: {
      //       price: 0,
      //       promote_enable: false,
      //       promote_price: 0,
      //       promote_time: '',
      //     },
      //     published: 0,
      //     read_num: 0,
      //     sibling: 1,
      //     source: 0,
      //     status: 20,
      //     summary: '欢迎关注我的专栏！',
      //     summary_images: [],
      //     tag_category: '1042015:tagCategory_1004',
      //     title: '嘻嘻哈哈',
      //     total: 4,
      //     type: 2,
      //     publish_time: '',
      //   },
      // ],
      // mentionedFriends: [
      //   { uid: 5186027114, screen_name: '微博视频', remark: '' },
      //   { uid: 6068931041, screen_name: '生活在成都', remark: '' },
      // ],
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const userInfo = await Xinlangweibo.getXinlangweiboUserInfo(cookie);
    taskData.uid = userInfo.data.user?.id ?? 0;

    const result = await Xinlangweibo.publishArticle(cookie, taskData, eventCall);

    console.log('新浪头条文章发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);
  //1022:2309405151021570588792
  test('微博头条合集获取', async () => {
    const cookie = getCookie();
    const result = await Xinlangweibo.getXinlangweiboVideoStatus(cookie, '1022:2309405151021570588792');

    console.log('微博头条状态：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(false)('【真实测试】', () => {
  test('微博头条合集获取', async () => {
    const cookie = getCookie();
    const userInfo = await Xinlangweibo.getXinlangweiboUserInfo(cookie);
    const result = await Xinlangweibo.getWeiboToutiaoCollectionList(cookie, userInfo.data.user?.id.toString() ?? '');

    console.log('微博头条合集获取：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(false)('【真实测试】', () => {
  test('微博头条合集获取', async () => {
    const cookie = getCookie();

    const result = await Xinlangweibo.getxinlangweiboLocationList(cookie, '天府广场');

    console.log('微博头条合集获取：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});


//endregion
