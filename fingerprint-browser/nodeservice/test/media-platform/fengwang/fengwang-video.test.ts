import { describe, expect, test } from 'vitest';
import { Duoduoshipin, Tengxunshipin } from '../../../src';
import { EventEmitter } from 'events';
import { TengXunShiPinVideoTaskInput } from '../../../src/media-platform/tengxunshipin/tengxunshipin-video';
import { DuoDuoVideoTaskInput } from '../../../src/media-platform/duoduoshipin/duoduoshipin-video';
import { MeiPai } from '../../../src/media-platform/meipai';
import { MeiPaiVideoTaskInput } from '../../../src/media-platform/meipai/meipai-video';
import { CheJiaHaoVideoTaskInput } from '../../../src/media-platform/chejiahao/chejiahao-video';
import { CheJiaHao } from '../../../src/media-platform/chejiahao';
import { YiCheHaoVideoTaskInput } from '../../../src/media-platform/yichehao/yichehao-video';
import { YiCheHao } from '../../../src/media-platform/yichehao';
import { FengWang } from '../../../src/media-platform/fengwang';
import { FengWangVideoTaskInput } from '../../../src/media-platform/fengwang/fengwang-video';

describe.runIf(true)('【真实测试】', () => {
  const cookie =
    'o_user_id=245829853; o_auto_login=1; o_loginInfo=%7B%22user_id%22%3A%22245829853%22%2C%22user_name%22%3A%2218684805708%22%2C%22token%22%3A%22E8FTPo7pPoa6epuXnQrbXZW13VruK1J4Xjc-yRoRMKrLqVyuTfrjetL4j8yCxC-TKH5YXFlr98X-rjEoTvyroSkE47YnJEgpxXUER_t5ohw%22%2C%22phone%22%3A%2218684805708%22%2C%22focuser_id%22%3A%2216519%22%2C%22shead%22%3A%22https%3A%5C%2F%5C%2Fimg.funshion.com%5C%2Fsdw%3Foid%3D0e597d9808537e7590b8b78e3e567920%26w%3D0%26h%3D0%22%7D; PHPSESSID=a6ppcao4d1clje3en00qk6c161';
  test('蜂网视视频发布', async () => {
    const taskData: FengWangVideoTaskInput = {
      taskId: '13123123',
      video: {
        localPath:
          'I:\\download\\1742382013268喜不喜欢？短短十秒的视频冒雨下水用两个小时拍摄.mp4',
        width: 1080,
        height: 1920,
        duration: 0,
      },
      pubType:0,
      cover: {
        pathOrUrl: 'I:\\download\\391df57a-410a-4e83-99d5-4cea395c9106 (2).jpg',
        width: 1080,
        height: 1920,
      },
      title: '开车的时候12，要懂得欣赏风景，是这样的',
      desc: '<p>风景好了开12车也好了</p><p><topic>#搞笑</topic></p>',
      //publishTime: new Date('2025-8-28').getTime(),
      tags: ['记录'],
      subCategory: { yixiaoerId: '54', yixiaoerName: 'hags' },
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const result = await FengWang.publishVideo(cookie, taskData, eventCall);

    console.log('蜂网视频视频发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);

  test('易车号视频视频删除', async () => {
    const result = await YiCheHao.deleteYiCheHaoContent(cookie, '113516623');

    console.log('易车号视频视频删除：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('蜂网视频状态', async () => {
    const result = await FengWang.getFengWangMediaStatus(cookie, '70372906', 10, '');

    console.log('蜂网视频状态：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('蜂网视频分类', async () => {
    const result = await FengWang.getFengWangVideoCategory(cookie);

    console.log('蜂网视频分类：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});
