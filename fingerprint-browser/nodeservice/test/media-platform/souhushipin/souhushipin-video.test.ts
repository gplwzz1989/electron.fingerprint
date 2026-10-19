import { describe, expect, test } from 'vitest';
import { EventEmitter } from 'events';
import { SouHuShiPinVideoTaskInput } from '../../../src/media-platform/souhushipin/souhushipin-video';
import { SouHuShiPin } from '../../../src/media-platform/souhushipin';

describe.runIf(true)('【真实测试】', () => {
  const cookie =
    'ifoxinstalled=false; newpuid=17558483045651088970; fuid=17558483045663556688; reqtype=pc; gidinf=x099980109ee1b2f0a7a268a90005f9841ed15965aec; _dfp=cyO99bFfXdAK41jA9Yr8HJ8DrxTrXDD+iKeQYXkkPhs%3D; t=1757312114509; jv=60e73f780abf9f1d9cfca2727aaaa587-aK5NufJz1757312137036; ppinf=2|1757312137|1758521737|bG9naW5pZDowOnx1c2VyaWQ6Mjg6MTg5NDY3NDM2NDMzOTc5ODAxNkBzb2h1LmNvbXxzZXJ2aWNldXNlOjMwOjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMHxjcnQ6MTA6MjAyNS0wOS0wOHxlbXQ6MTowfGFwcGlkOjY6MTA3NDA1fHBsYXQ6Njptb2JpbGV8dHJ1c3Q6MToxfHBhcnRuZXJpZDoxOjB8cmVsYXRpb246MDp8dXVpZDoxNjpzMjA3NGJmMWNhN2YxYzUxfHVpZDoxNjpzMjA3NGJmMWNhN2YxYzUxfHVuaXFuYW1lOjA6fA; pprdig=33hbQhGz-n5OJVS333BmVUHuv4rHoKn_MAfUhQaqesUAtQinc3X-doVJAFKlS0ksC153I_pIXUOiymHePFeKCNMrmx5rhxUMIVeIr8JdTqiicW552ihKnPesuQYlhpa1GvC2qKUtSOjkhhk_892a9a9fAv9tLQKPLEf7Ns1FmiI; beans_freq=1; ppmdig=1757554899000000344cda1c499c5e35d9f23ac84f5a0876; tv-vlt=1757555112653';
  test('搜狐视频视视频发布', async () => {
    const taskData: SouHuShiPinVideoTaskInput = {
      taskId: '13123123',
      pubType: 1,
      video: {
        localPath: 'I:\\download\\niao.mp4',
        width: 1080,
        height: 1920,
        duration: 0,
      },
      cover: {
        pathOrUrl: 'I:\\download\\20250530-114657.jpg',
        width: 1920,
        height: 1080,
      },
      desc: 'asd是的就是',
      title: `转码失败的时候是这样${Date.now()}`,
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const result = await SouHuShiPin.publishVideo(cookie, taskData, eventCall);

    console.log('搜狐视频视频发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);

  test('搜狐视频视频状态', async () => {
    const result = await SouHuShiPin.getSouHuShiPinVideoStatus(cookie, '645318976');

    console.log('搜狐视频视频状态：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('搜狐视频视频删除', async () => {
    const result = await SouHuShiPin.deleteSouhushipinContent(cookie, '645245254', '');

    console.log('搜狐视频删除：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});
