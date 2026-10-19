import { describe, expect, test } from 'vitest';
import { Yidianhao, YidianhaoVideoTaskInput } from '../../../src/media-platform/yidianhao';
import { EventEmitter } from 'events';

describe.runIf(true)('【真实测试】', () => {
  const cookie =
    'wuid=291131398635194; wuid_createAt=2025-05-28 20:55:28; DID=node7cd7fda3abb8c6f9; login-label=2107053591; JSESSIONID=302279b267f4e1f8e91c8e2e4c9f1d0f6defe322e3a799f65fe91f378cde4c29; BUILD_VERSION=9W3m4l6T37V1751966015868';
  test('一点号视频发布', async () => {
    const taskData: YidianhaoVideoTaskInput = {
      taskId: '13123123',
      pubType: 0,
      video: {
        localPath: 'I:\\download\\132835268627695428.mp4',
        width: 1080,
        height: 1920,
        duration: 0,
      },
      cover: {
        pathOrUrl: 'I:\\download\\20250530-114657.jpg',
        width: 1920,
        height: 1080,
      },

      title: '分享一套熊猫GIF表情套装',
      tags: ['搞笑', '同行', '旅行'],
      desc: '我是视频描述',
      categoryName: '生活',
      publishTime: 1734048000000,
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const result = await Yidianhao.publishVideo(cookie, taskData, eventCall);

    console.log('一点号视频发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);

  test('一点号视频状态', async () => {
    const result = await Yidianhao.getYidianhaoMediaStatus(cookie, '897986016342432');

    console.log('一点号视频状态：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  //wuid=291131398635194; wuid_createAt=2025-05-28 20:55:28; DID=node7cd7fda3abb8c6f9; login-label=2107053591; JSESSIONID=302279b267f4e1f8e91c8e2e4c9f1d0f6defe322e3a799f65fe91f378cde4c29; BUILD_VERSION=9W3m4l6T37V1751966015868
  test('一点号视频分类', async () => {
    const result = await Yidianhao.getYidianhaoVideoCategory(cookie);

    console.log('一点号视频分类：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});
