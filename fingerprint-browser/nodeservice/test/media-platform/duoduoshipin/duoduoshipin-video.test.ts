import { describe, expect, test } from 'vitest';
import { Duoduoshipin, Tengxunshipin } from '../../../src';
import { EventEmitter } from 'events';
import { TengXunShiPinVideoTaskInput } from '../../../src/media-platform/tengxunshipin/tengxunshipin-video';
import { DuoDuoVideoTaskInput } from '../../../src/media-platform/duoduoshipin/duoduoshipin-video';

describe.runIf(true)('【真实测试】', () => {
  const cookie =
    '_nano_fp=Xpm8l0PxnqC8n0TYXo_s2snHT8y1lVZDqJ3rMZ7u; ru1k=5705e0ca-0942-4cc2-935f-874b57d01d79; _f77=5705e0ca-0942-4cc2-935f-874b57d01d79; ru2k=ca66459a-2704-434c-8afe-9fb1f111d169; _a42=ca66459a-2704-434c-8afe-9fb1f111d169; api_uid=ZeIuHWn9mqOKEwBkxljhAg==; L_PASS_ID=6CZBJ4B7VPXIMY2N2HP6S36SO3HJBIJC2IANU4NXF7W3WAB4ORDA1213192; L_PASS_TYPE=2; pdd_user_id=2182716721; rckk=1bejMO6rOgU2gcHMThckt4e0lMjyA1l2; _bee=1bejMO6rOgU2gcHMThckt4e0lMjyA1l2; L_PASS_DEAD=1780830862';
  test('多多视频视视频发布', async () => {
    const taskData: DuoDuoVideoTaskInput = {
      taskId: '13123123',
      video: {
        localPath: 'I:\\desktop\\新建文件夹\\190克超轻【无双2】体考短跑和跳远性能拉满了.mp4',
        width: 1080,
        height: 1920,
        duration: 0,
      },
      cover: {
        pathOrUrl: 'I:\\desktop\\新建文件夹\\89ccd09d-1c02-4a31-b6d4-b0822d68e52c.png',
        width: 1920,
        height: 1080,
      },
      desc: '<p>190克超轻【无双2】体考短跑和跳远性能拉满了</p><p><topic>#音速猫</topic></p>',
      publishTime: new Date('2026-5-12').getTime(),

    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const result = await Duoduoshipin.publishVideo(cookie, taskData, eventCall);

    console.log('多多视频视频发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);

  test('多多视频视频删除', async () => {
    const result = await Duoduoshipin.deleteDuoDuoShiPinContent(cookie, '6676039354094997813');

    console.log('多多视频视频删除：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('多多视频视频状态', async () => {
    const result = await Duoduoshipin.getDuoDuoVideoStatus(cookie, '6910458210313379019');

    console.log('多多视频状态：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('多多视频获取商品信息', async () => {
    const result = await Duoduoshipin.getDuoduoshipinGoodsList(cookie, '877427997470');

    console.log('多多视频状态：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);


});
