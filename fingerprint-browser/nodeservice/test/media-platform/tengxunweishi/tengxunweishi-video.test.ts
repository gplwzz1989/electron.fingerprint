import { describe, expect, test } from 'vitest';
import { WeishiVideoTaskInput, Tengxunweishi } from '../../../src/media-platform/tengxunweishi';
import { EventEmitter } from 'events';

describe.runIf(true)('【真实测试】', () => {
  const cookie =
    'RK=eVcFZ8c+Fb; ptcz=ae5235539e0f68e705068b289426dcc44afaa3e1ad2f6428124ffed26d0b2e67; sThrAppid=1101083114; iAuthType=1; openid=68013C5EF6A0600AB0E82062A8488DD7; sSessionKey=D937778EE26DCFA48AE7C62D8FD737C5; person_id=1561461888716807';
  test('微视视频发布', async () => {
    const taskData: WeishiVideoTaskInput = {
      taskId: '13123123',
      video: {
        localPath: 'I:\\download\\20251111-143247.mp4',
        width: 576,
        height: 854,
        duration: 11,
      },
      cover: {
        pathOrUrl: 'I:\\download\\7e860fa4fdfd190b94b37e2dd0774cce.jpeg',
        width:800,
        height: 1068,
      },
      desc: '哈哈哈哈，不给我审',
      publishTime: 0,
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const result = await Tengxunweishi.publishVideo(cookie, taskData, eventCall);

    console.log('微视视频发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);

  test('微视视频状态', async () => {
    const result = await Tengxunweishi.getWeiShiVideoStatus(
      cookie,
      'gzc_7247_1047_0b53vuadwaaa7uadzehb3ztrpliehowqao2a',
    );

    console.log('微视视频状态：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});
