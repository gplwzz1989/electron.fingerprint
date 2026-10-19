import { describe, expect, test } from 'vitest';
import { Cloud, Duoduoshipin, Platforms, Tengxunshipin } from '../../../src';
import { EventEmitter } from 'events';
import { TengXunShiPinVideoTaskInput } from '../../../src/media-platform/tengxunshipin/tengxunshipin-video';
import { DuoDuoVideoTaskInput } from '../../../src/media-platform/duoduoshipin/duoduoshipin-video';
import { MeiPai } from '../../../src/media-platform/meipai';
import { MeiPaiVideoTaskInput } from '../../../src/media-platform/meipai/meipai-video';
import { MeiYouVideoTaskInput } from '../../../src/media-platform/meiyou/meiyou-video';
import { MeiYou } from '../../../src/media-platform/meiyou';
import { Task } from '../../../src/utils';

describe.runIf(true)('【真实测试】', () => {
  const cookie =
    'aliyungf_tc=8235cba55ad0da8c6701196641be73e1ba19db1191d940596f2124376f34cb18;HMACCOUNT_BFESS=75B9FC80C3D1C002;Hm_lvt_355b11fbaa46dee50a73dbe3c3a9944b=1758594785;HMACCOUNT=75B9FC80C3D1C002;aliyungf_tc=596674c29e54c2f15786f897073ac5063f8d051418c531b3cd704bd5ba022729;my_sso_platform=4;my2_session=ed61b441f93e82d59a3256bc9288676c;my_sso_nick=%E7%AC%91%E6%AD%BB%E5%90%A7;my_sso_avatar=https%3A%2F%2Fsc.seeyouyima.com%2Favatar_56726373;my_sso_passport=5.RhdAM3E-8oMKGWrrCL53sePzvzw4MrDgRjtQR0dizKeECeRxTv5w6074Vugqv4Owv8QtITq5CO-weMy-tHMDvHIbQKGLe82j5RDWNwGX7V8;my_sso_auto=true;webLoginStatus=1;expireTime=1759200651;meiyou_mp=RpXpQlZYtBasRee4XFO-pf1i61njh9Q2SnUi6EyBxCdfmouIbakOwRLCoPb09SfJCVQ1gaqa93wkkfWFr4tEbAY6FWm83ClfijIcVM34EWtDKcGS4m6zGluyPxZOS_ojhKKYQrqaw-NOUfwb4JjX2ySIswGd-1bkVS89UobWApnTB1J1QLEGHEbcCL208vzcFBZ1YWejcmOhDlNzppPU254A7SEw_9C3aWnPW5c5KbcRa2V2lKLwIuXR-SSemlNt6BXh1GuBXCwOLCMyP4O5iVjsFNwOwtG5FI-9KYV0TNhzaBMqFOYX7b0sPDs4hbDGPnMLINO266XeyigxuDnhq19L97OkcP6lqIBafjhwUGX8VJqxFhe-AxB4wDjBrmqL9HSnOmMv4yDHQSwdAF5IuAzl13mrkCYU2GTZJasAsog;Hm_lpvt_355b11fbaa46dee50a73dbe3c3a9944b=1758595852';
  test('美柚视频视视频发布', async () => {
    const taskData: MeiYouVideoTaskInput = {
      taskId: '13123123',
      video: {
        localPath: 'I:\\download\\wbzckqfvel26fry6i0f8u',
        width: 1080,
        height: 1920,
        duration: 0,
      },
      cover: {
        pathOrUrl: 'I:\\download\\20250213-111807.jpg',
        width: 1920,
        height: 1080,
      },
      title: '记录是一种习惯',
      //publishTime: new Date('2025-9-10').getTime(),
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const result = await MeiYou.publishVideo(cookie, taskData, eventCall);

    console.log('美柚视频视频发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);

  test('美柚视频视频删除', async () => {
    const result = await MeiYou.deleteMeiYouContent(cookie, '78997851');

    console.log('美柚视频视频删除：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('美柚视频视频状态', async () => {
    const result = await MeiYou.getMeiYouMediaStatus(cookie, '78997346');

    console.log('美柚视频状态：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【新版发布流程】', () => {
  test(
    '新视频发布',
    async () => {
      const result = Cloud.pushOpenPlatformPublishTask(
        {
          callBackData: { teamId: '6821ac8d50bc5fd636fa9801', userId: '6842b9707731899191a8ada5' },
          publishType: 'video',
          tasks: [
            {
              taskId: '68d90acdc60d75bd0802279c',
              publishData: {
                video: {
                  duration: 11.167,
                  width: 576,
                  height: 854,
                  size: 1334329,
                  url: 'https://oss.yixiaoer.cn/1124188f942dcda4eff89de4e392f1c7/68da5c4e/yfb/test/t-6821ac8d50bc5fd636fa9801/wsrt_subw6py7iweczvvt',
                  localPath: '',
                },
                covers: [
                  {
                    width: 576,
                    height: 854,
                    size: 472187,
                    pathOrUrl:
                      'https://oss.yixiaoer.cn/cd9ed42d84e4a3f656eb811a9e044e9f/68da5c4e/yfb/test/t-6821ac8d50bc5fd636fa9801/jo21d5us6yx2mndy1qmsr',
                    format: '',
                  },
                ],
                title: '瓜子啊瓜子',
                prePubTime: 0,
              },
              authorInfo: {
                platformName: '美柚',
                id: 'cmfvykfg6001nj00j0ci89vw4',

              },
            },
          ],
          publishChannel: 'cloud',
          platform: [
            {
              id: 'cmfvykfg6001nj00j0ci89vw4',
              platformCode: 'MeiYou',
              platformUserId: 'NTY3MjYzNzM=',
              platformUserName: '笑死吧',
              platformCookie:
                '[{"name":"HMACCOUNT_BFESS","value":"75B9FC80C3D1C002","domain":".hm.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1793154784.660637,"sameSite":"no_restriction"},{"name":"Hm_lvt_355b11fbaa46dee50a73dbe3c3a9944b","value":"1758594785","domain":".mp.meiyou.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1790560588,"sameSite":"unspecified"},{"name":"my_sso_platform","value":"4","domain":".meiyou.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1759200651.384533,"sameSite":"unspecified"},{"name":"my_sso_nick","value":"%E7%AC%91%E6%AD%BB%E5%90%A7","domain":".meiyou.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1759200651.380905,"sameSite":"unspecified"},{"name":"my_sso_avatar","value":"https%3A%2F%2Fsc.seeyouyima.com%2Favatar_56726373","domain":".meiyou.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1759200651.383582,"sameSite":"unspecified"},{"name":"my_sso_passport","value":"5.RhdAM3E-8oMKGWrrCL53sePzvzw4MrDgRjtQR0dizKeECeRxTv5w6074Vugqv4Owv8QtITq5CO-weMy-tHMDvHIbQKGLe82j5RDWNwGX7V8","domain":".meiyou.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1759200651.384066,"sameSite":"unspecified"},{"name":"my_sso_auto","value":"true","domain":".meiyou.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1759200651.384852,"sameSite":"unspecified"},{"name":"webLoginStatus","value":"1","domain":".meiyou.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1759200651.966335,"sameSite":"unspecified"},{"name":"expireTime","value":"1759200651","domain":".meiyou.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1759200651.966526,"sameSite":"unspecified"},{"name":"meiyou_mp","value":"RpXpQlZYtBasRee4XFO-pf1i61njh9Q2SnUi6EyBxCdfmouIbakOwRLCoPb09SfJCVQ1gaqa93wkkfWFr4tEbAY6FWm83ClfijIcVM34EWtDKcGS4m6zGluyPxZOS_ojhKKYQrqaw-NOUfwb4JjX2ySIswGd-1bkVS89UobWApnTB1J1QLEGHEbcCL208vzcFBZ1YWejcmOhDlNzppPU254A7SEw_9C3aWnPW5c5KbcRa2V2lKLwIuXR-SSemlNt6BXh1GuBXCwOLCMyP4O5iVjsFNwOwtG5FI-9KYV0TNhzaBMqFOYX7b0sPDs4hbDGPnMLINO266XeyigxuDnhq19L97OkcP6lqIBafjhwUGX8VJqxFhe-AxB4wDjBrmqL9HSnOmMv4yDHQSwdAF5IuAzl13mrkCYU2GTZJasAsog","domain":".meiyou.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1759200651.966598,"sameSite":"unspecified"},{"name":"aliyungf_tc","value":"8235cba55ad0da8c6701196641be73e1ba19db1191d940596f2124376f34cb18","domain":"mp.meiyou.com","hostOnly":true,"path":"/","secure":false,"httpOnly":true,"session":true,"sameSite":"unspecified"},{"name":"HMACCOUNT","value":"75B9FC80C3D1C002","domain":".mp.meiyou.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"aliyungf_tc","value":"596674c29e54c2f15786f897073ac5063f8d051418c531b3cd704bd5ba022729","domain":"sso.meiyou.com","hostOnly":true,"path":"/","secure":false,"httpOnly":true,"session":true,"sameSite":"unspecified"},{"name":"my2_session","value":"ed61b441f93e82d59a3256bc9288676c","domain":"mp.meiyou.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"Hm_lpvt_355b11fbaa46dee50a73dbe3c3a9944b","value":"1759024589","domain":".mp.meiyou.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"}]',
              platformLocalStorage: '{"__url__":"https://mp.meiyou.com/page/redirect"}',
            },
          ],
          authorization: 'sess_c021ec76914e6dc72ee8d0a4cd50ff1c52d52858b3bebaa6f5ac7dba524ff225',
        },
        'sess_c021ec76914e6dc72ee8d0a4cd50ff1c52d52858b3bebaa6f5ac7dba524ff225',
      );
      console.log(JSON.stringify(result, null, 2));
      await Task.Delay(40 * 60 * 1000);
    },
    40 * 60 * 1000,
  );
});
