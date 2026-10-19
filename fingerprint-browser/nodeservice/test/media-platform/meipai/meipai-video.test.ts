import { describe, expect, test } from 'vitest';
import { Duoduoshipin, Tengxunshipin } from '../../../src';
import { EventEmitter } from 'events';
import { TengXunShiPinVideoTaskInput } from '../../../src/media-platform/tengxunshipin/tengxunshipin-video';
import { DuoDuoVideoTaskInput } from '../../../src/media-platform/duoduoshipin/duoduoshipin-video';
import { MeiPai } from '../../../src/media-platform/meipai';
import { MeiPaiVideoTaskInput } from '../../../src/media-platform/meipai/meipai-video';

describe.runIf(true)('【真实测试】', () => {
  const cookie =
    'HWWAFSESID=4f3059ac6d78e2ca77; HWWAFSESTIME=1754469054955; MUSID=1b8c0cdc71439a5d864c82388368ba24; MP_WEB_GID=244769058152639; pvid=cRa15qaH9ljnFZstqPvUqa5BdFNz3wPR; sid=1b8c0cdc71439a5d864c82388368ba24; __mapp_access_token__=_v2NDgxNDg4NmYjMTc1NzkyNTEwNSMyNTYjNjAjNjAyM2I0YzVjYmI0ZDI0MGQwYmI4NWE0NDYyNTIzNTU5ZSNIVUFXRUlfQVoxI0JKX0hXIzY4OTMxMmYy; ASID=279e2ae93660280a1a2fd30a8c10b9b6';
  test('美拍视频视视频发布', async () => {
    const taskData: MeiPaiVideoTaskInput = {
      taskId: '13123123',
      video: {
        localPath:
          'I:\\download\\1742382013268喜不喜欢？短短十秒的视频冒雨下水用两个小时拍摄，就为缓解你内心的不安和焦虑#简单拍一夏 #荷塘美景 #麒麟水乡.mp4',
        width: 1080,
        height: 1920,
        duration: 0,
      },
      cover: {
        pathOrUrl: 'I:\\download\\20250213-111807.jpg',
        width: 1920,
        height: 1080,
      },
      title: '我是标题哦',
      desc: '<p>我是一个测试视频的描述</p><p><topic>#搞笑</topic></p>',
      publishTime: new Date('2025-8-13').getTime(),
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const result = await MeiPai.publishVideo(cookie, taskData, eventCall);

    console.log('美拍视频视频发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);

  test('美拍视频视频删除', async () => {
    const result = await MeiPai.deleteMeiPaiShiPinContent(cookie, '5179631');

    console.log('美拍视频视频删除：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('美拍视频视频状态', async () => {
    const result = await MeiPai.getMeiPaiVideoStatus(cookie, '689b08950432d1358');

    console.log('美拍视频状态：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
  test('获取美拍分类', async () => {
    const result = await MeiPai.getMeiPaiVideoCategory(cookie);

    console.log('美拍分类：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});
