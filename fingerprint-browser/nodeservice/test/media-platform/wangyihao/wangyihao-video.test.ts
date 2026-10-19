import { Wangyihao, WangyiVideoTaskInput } from '../../../src/media-platform/wangyihao/index';
import { describe, expect, test, it } from 'vitest';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

export const getCookie = (fileName: string = 'cookie.txt'): string => {
  return fs.readFileSync(path.resolve(__dirname, fileName), { encoding: 'utf8' }).trim();
};

if (false) {
  it('获取用户信息', async () => {
    const cookie = getCookie();
    const result = await Wangyihao.getWangyihaoUserInfo(cookie);
    console.log(result);
  });
}

describe.runIf(true)('【真实测试】', () => {
  test('网易视频发布', async () => {
    const cookie = getCookie();

    const taskData: WangyiVideoTaskInput = {
      taskId: '13123123',
      pubType: 1,
      video: {
        localPath:
          'I:\\download\\自驾游济南章丘白云湖，乡村小道绿树成荫很漂亮\\自驾游济南章丘白云湖，乡村小道绿树成荫很漂亮.mp4',
        width: 1080,
        height: 1920,
        duration: 0,
      },
      cover: {
        pathOrUrl: 'I:\\download\\20250214-114230.jpg',
        width: 1920,
        height: 1080,
      },

      title: '分享一套熊猫GIF表情套装',
      tags: ['搞笑', '同行', '旅行'],
      category: { categoryName: '综艺', level: 1 },
      subCategory: { categoryName: '综艺吐槽', level: 2 },
      // topics: [
      //   {
      //     subjectId: '101436',
      //     title: '#回南天有多离谱#',
      //     keyword: '#回南天有多离谱#',
      //     introduction: '二月三月回南天，客厅秒变淋浴间，让回南天给北方人亿点点震撼！',
      //     bizzType: 4,
      //     location: 1,
      //     status: 1,
      //     showStatus: 1,
      //     pickStatus: 1,
      //     pendantId: '0',
      //     url: 'https://c.m.163.com/news/topic/101436.html',
      //     headPicture: 'http://mobilepics.ws.126.net/qM5mpAFAmt3e6RnrqOEm5bdlc5LhWIEu0klbf1ooe.png',
      //     headPictureType: '1',
      //     relatedDocId: '',
      //     hostPostId: null,
      //     hotValue: 55629,
      //     interest: '',
      //     hotRankWord: '',
      //     wordGroup: '',
      //     motifId: '',
      //     recommendStatus: 0,
      //     recommendLocation: 0,
      //     operator: 'TASK',
      //     createTime: '2024-03-11 11:37:22',
      //     modifyTime: '2024-03-13 11:18:07',
      //     moduleTags: '精华,视频',
      //     postid: '1',
      //   },
      //   {
      //     subjectId: '101437',
      //     title: '#微短剧为何让人如此上头？#',
      //     keyword: '#微短剧为何让人如此上头#',
      //     introduction:
      //       '市场规模300亿，爆款短剧编剧月入超10万，周星驰、王晶、尹正等明星纷纷“下场”加入。微短剧为什么会这么火？',
      //     bizzType: 4,
      //     location: 6,
      //     status: 1,
      //     showStatus: 0,
      //     pickStatus: 1,
      //     pendantId: '0',
      //     url: 'https://c.m.163.com/news/topic/101437.html',
      //     headPicture: 'http://mobilepics.ws.126.net/4k3kKHDR89VZ25GwnOQ8JNtKRVi7sXjn0klbm5m91.png',
      //     headPictureType: '1',
      //     relatedDocId: '',
      //     hostPostId: null,
      //     hotValue: 8211,
      //     interest: '',
      //     hotRankWord: '',
      //     wordGroup: '',
      //     motifId: '',
      //     recommendStatus: 0,
      //     recommendLocation: 0,
      //     operator: 'TASK',
      //     createTime: '2024-03-11 13:38:32',
      //     modifyTime: '2024-03-13 11:18:10',
      //     moduleTags: '精华,视频',
      //     postid: '1',
      //   },
      // ],
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const result = await Wangyihao.publishVideo(cookie, taskData, eventCall);

    console.log('网易视频发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);

  test('网易文章状态', async () => {
    const cookie = getCookie();

    const result = await Wangyihao.getWangyihaoMediaStatus(cookie, 'JBLHOV2P0552ZF94', 'article');

    console.log('网易图文状态：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('网易视频状态', async () => {
    const cookie = getCookie();

    const result = await Wangyihao.getWangyihaoMediaStatus(cookie, 'VKQFVEPTA', 'video');

    console.log('网易视频状态：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
  test('网易视频分类', async () => {
    const cookie = getCookie();

    const userInfo = await Wangyihao.getWangyihaoUserInfo(cookie);
    const result = await Wangyihao.getWangyihaoCategory(cookie, userInfo.data?.wemediaId ?? '');

    console.log('网易视频分类：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('网易话题活动', async () => {
    const cookie = getCookie();

    const userInfo = await Wangyihao.getWangyihaoUserInfo(cookie);
    const result = await Wangyihao.getWangyihaoHotTopic(cookie, userInfo.data?.wemediaId ?? '');

    console.log('网易话题活动：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

//endregion
