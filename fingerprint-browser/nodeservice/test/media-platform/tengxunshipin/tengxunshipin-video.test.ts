import { describe, expect, test } from 'vitest';
import { Cloud, Platforms, Tengxunshipin } from '../../../src';
import { EventEmitter } from 'events';
import { TengXunShiPinVideoTaskInput } from '../../../src/media-platform/tengxunshipin/tengxunshipin-video';
import { convertCookieStr, Task } from '../../../src/utils';

describe.runIf(true)('【真实测试】', () => {
  const cookie = convertCookieStr(
    'video_guid=95b2608b29b9e85c; qq_domain_video_guid_verify=95b2608b29b9e85c; _qimei_uuid42=1991d0e361f100247495d9b54c2b343cc77a0a4e86; video_platform=2; _qimei_i_3=42cd5684c05f04899491fb6552827ae9a4bba2f0145852d6b18f2a5b219b213d336164943989e2a782bc; _qimei_h38=e06dd3557495d9b54c2b343c0200000c11991d; main_login=qq; vqq_vuserid=3448646108; vqq_openid=C923CB9607B71CBDD0324CFC868F56CC; vqq_appid=101483052; v_vurefresh=BA89y7xKgH85MyFBFzk3f1rNIFYnDXw6llcOydTTmLCeiRMiBNq4CravcmFpmeV5Qg; v_main_login=qq; v_t_appid=101483052; v_t_openid=C923CB9607B71CBDD0324CFC868F56CC; v_vuserid=3448646108; qq_nick=%E7%8E%8B%E8%80%85%E4%BD%93%E9%AA%8C%E6%9C%8D; qq_head=https%3A%2F%2Ftvpic.gtimg.cn%2Fhead%2F13ac287746010364e3279f71daa8a54cda39a3ee5e6b4b0d3255bfef95601890afd80709%2F344; role=0; p_vuserid=0; vqq_access_token=8AE8EBC80CBE0AE11DB87A42EDF4EBC4; vqq_refresh_token=E2CC502CF3CE278B72B404CAB4407ABC; v_t_access_token=8AE8EBC80CBE0AE11DB87A42EDF4EBC4; v_t_refresh_token=E2CC502CF3CE278B72B404CAB4407ABC; _new_next_refresh_time=7200; last_refresh_vuserid=3448646108; _qimei_fingerprint=bbbf9062ce7ff02e1a295a4fc597e178; vcuid=9015271708; _qimei_i_1=2cfc5bd7955c048fc292fb375f8d76b4febca1f541595181b08c7b582493206c616364943980ebdd82fcdff5; vqq_vusession=BYte8ACGcWnr-LxnOGzA5UQrKrhfezErnQNmv1loEC8AllJabwSIPSG3dNbmmsnmbhwlmqPO1WqgMjzYV6vW01so4cr6O7rOie82lpZGOb8Q9wtF0Moq7kvm6ZVD3vUXI35F23SChoDItuPNHdnebAfBmCknQ0TbUf9U2XDMb-aKqn_6hZka6yb8hw.O; v_vusession=BYte8ACGcWnr-LxnOGzA5UQrKrhfezErnQNmv1loEC8AllJabwSIPSG3dNbmmsnmbhwlmqPO1WqgMjzYV6vW01so4cr6O7rOie82lpZGOb8Q9wtF0Moq7kvm6ZVD3vUXI35F23SChoDItuPNHdnebAfBmCknQ0TbUf9U2XDMb-aKqn_6hZka6yb8hw.O; v_qq_com_session_lapse_time=1761817349521; last_refresh_time=1761810149522',
  );
  test('腾讯视频视视频发布', async () => {
    const taskData: TengXunShiPinVideoTaskInput = {
      taskId: '13123123',
      pubType: 0,
      video: {
        localPath: 'I:\\download\\144DCF495ACF4F503914FBC3F36D80F4f121.mp4',
        width: 1080,
        height: 1920,
        duration: 0,
      },
      cover: {
        pathOrUrl: 'I:\\download\\20251030-153423.jpg',
        width: 1920,
        height: 1080,
      },
      title: '我是一个测试视频',
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    const result = await Tengxunshipin.publishVideo(cookie, taskData, eventCall);

    console.log('腾讯视频视频发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);

  test('腾讯视频视频状态', async () => {
    const result = await Tengxunshipin.getTengXunShiPinVideoStatus(cookie, 'q3092i5s1oi');

    console.log('腾讯视频视频状态：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('腾讯视频视频删除', async () => {
    const result = await Tengxunshipin.deleteTengXunShiPinContent(cookie, 'l30922x8ahd');

    console.log('腾讯视频删除：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('腾讯视频搜索话题', async () => {
    const result = await Tengxunshipin.searchTengXunShiPinTopicList(cookie, '搞笑');

    console.log('腾讯视频搜索话题：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【新版发布流程】', () => {
  test(
    '腾讯视频新视频发布',
    async () => {
      const result = Cloud.pushOpenPlatformPublishTask(
        {
          callBackData: { teamId: '6821ac8d50bc5fd636fa9801', userId: '6842b9707731899191a8ada5' },
          publishType: 'video',
          tasks: [
            {
              taskId: '68f72018d8d17f9335a65a0b',
              publishData: {
                video: {
                  duration: 11.167,
                  width: 576,
                  height: 854,
                  size: 1334329,
                  url: 'https://oss-v2.yixiaoer.cn/yfb/test/t-6821ac8d50bc5fd636fa9801/a3zfqppaazzs1poqwno9a',
                  localPath: '',
                },
                covers: [
                  {
                    width: 1439,
                    height: 959,
                    size: 310061,
                    pathOrUrl: 'https://oss-v2.yixiaoer.cn/yfb/test/t-6821ac8d50bc5fd636fa9801/-dpsdnbc4f0mazunumygt',
                    format: '',
                  },
                ],
                title: '这样的画面，就是垃圾',
                tags: [],
                prePubTime: 0,
                pubType: 1,
                statement: null,
              },
              authorInfo: {
                platformName: '腾讯视频',
                id: 'cmg4rxq1m000ode0jvouwzymx',
                proxy: { serverAdd: '10.0.0.6', serverPort: '4843' },
              },
            },
          ],
          publishChannel: 'cloud',
          platform: [
            {
              id: 'cmg4rxq1m000ode0jvouwzymx',
              platformCode: 'TengXunShiPin',
              platformUserId: '9015271708',
              platformUserName: '王者体验服',
              platformCookie:
                '[{"name":"video_guid","value":"95b2608b29b9e85c","domain":".v.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1790664871,"sameSite":"unspecified"},{"name":"qq_domain_video_guid_verify","value":"95b2608b29b9e85c","domain":".qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1790664871,"sameSite":"unspecified"},{"name":"_qimei_uuid42","value":"1991d0e361f100247495d9b54c2b343cc77a0a4e86","domain":".qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1790664871,"sameSite":"unspecified"},{"name":"video_platform","value":"2","domain":".video.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1795169341.887936,"sameSite":"unspecified"},{"name":"video_guid","value":"95b2608b29b9e85c","domain":".video.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1795169341.891106,"sameSite":"unspecified"},{"name":"video_platform","value":"2","domain":".v.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341,"sameSite":"unspecified"},{"name":"_qimei_fingerprint","value":"bbbf9062ce7ff02e1a295a4fc597e178","domain":".qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1790664871,"sameSite":"unspecified"},{"name":"_qimei_i_3","value":"42cd5684c05f04899491fb6552827ae9a4bba2f0145852d6b18f2a5b219b213d336164943989e2a782bc","domain":".qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1790664871,"sameSite":"unspecified"},{"name":"_qimei_h38","value":"e06dd3557495d9b54c2b343c0200000c11991d","domain":".qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341,"sameSite":"unspecified"},{"name":"vqq_openid","value":"C923CB9607B71CBDD0324CFC868F56CC","domain":".video.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341.037972,"sameSite":"unspecified"},{"name":"vqq_access_token","value":"8AE8EBC80CBE0AE11DB87A42EDF4EBC4","domain":".video.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341.038006,"sameSite":"unspecified"},{"name":"vqq_refresh_token","value":"E2CC502CF3CE278B72B404CAB4407ABC","domain":".video.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341.038037,"sameSite":"unspecified"},{"name":"vqq_vuserid","value":"3448646108","domain":".video.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341.038066,"sameSite":"unspecified"},{"name":"vqq_next_refresh_time","value":"7200","domain":".video.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341.037827,"sameSite":"unspecified"},{"name":"vqq_appid","value":"101483052","domain":".video.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341.037931,"sameSite":"unspecified"},{"name":"main_login","value":"qq","domain":".video.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341.03815,"sameSite":"unspecified"},{"name":"v_t_openid","value":"C923CB9607B71CBDD0324CFC868F56CC","domain":".video.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341.038617,"sameSite":"unspecified"},{"name":"v_next_refresh_time","value":"7200","domain":".video.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341.038709,"sameSite":"unspecified"},{"name":"v_p_vuserid","value":"0","domain":".video.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341.038831,"sameSite":"unspecified"},{"name":"v_role","value":"0","domain":".video.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341.038801,"sameSite":"unspecified"},{"name":"v_main_login","value":"qq","domain":".video.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341.038862,"sameSite":"unspecified"},{"name":"v_t_appid","value":"101483052","domain":".video.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341.038888,"sameSite":"unspecified"},{"name":"v_t_access_token","value":"8AE8EBC80CBE0AE11DB87A42EDF4EBC4","domain":".video.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341.03865,"sameSite":"unspecified"},{"name":"v_t_refresh_token","value":"E2CC502CF3CE278B72B404CAB4407ABC","domain":".video.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341.038921,"sameSite":"unspecified"},{"name":"v_vuserid","value":"3448646108","domain":".video.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341.038949,"sameSite":"unspecified"},{"name":"v_vurefresh","value":"BA89y7xKgH85MyFBFzk3f1rNIFYnDXw6llcOydTTmLCeiRMiBNq4CravcmFpmeV5Qg","domain":".video.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341.038772,"sameSite":"unspecified"},{"name":"role","value":"0","domain":".video.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341.038559,"sameSite":"unspecified"},{"name":"p_vuserid","value":"0","domain":".video.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341.03859,"sameSite":"unspecified"},{"name":"login_time_init","value":"2025-9-29 14:55:9","domain":".video.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"main_login","value":"qq","domain":".v.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341,"sameSite":"unspecified"},{"name":"vqq_vuserid","value":"3448646108","domain":".v.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341,"sameSite":"unspecified"},{"name":"vqq_openid","value":"C923CB9607B71CBDD0324CFC868F56CC","domain":".v.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341,"sameSite":"unspecified"},{"name":"vqq_appid","value":"101483052","domain":".v.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341,"sameSite":"unspecified"},{"name":"v_vurefresh","value":"BA89y7xKgH85MyFBFzk3f1rNIFYnDXw6llcOydTTmLCeiRMiBNq4CravcmFpmeV5Qg","domain":".v.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341,"sameSite":"unspecified"},{"name":"v_main_login","value":"qq","domain":".v.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341,"sameSite":"unspecified"},{"name":"v_t_appid","value":"101483052","domain":".v.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341,"sameSite":"unspecified"},{"name":"v_t_openid","value":"C923CB9607B71CBDD0324CFC868F56CC","domain":".v.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341,"sameSite":"unspecified"},{"name":"v_vuserid","value":"3448646108","domain":".v.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341,"sameSite":"unspecified"},{"name":"qq_nick","value":"%E7%8E%8B%E8%80%85%E4%BD%93%E9%AA%8C%E6%9C%8D","domain":".v.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341,"sameSite":"unspecified"},{"name":"qq_head","value":"https%3A%2F%2Ftvpic.gtimg.cn%2Fhead%2F13ac287746010364e3279f71daa8a54cda39a3ee5e6b4b0d3255bfef95601890afd80709%2F344","domain":".v.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341,"sameSite":"unspecified"},{"name":"qq_nick","value":"%E7%8E%8B%E8%80%85%E4%BD%93%E9%AA%8C%E6%9C%8D","domain":".video.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341,"sameSite":"unspecified"},{"name":"qq_head","value":"https%3A%2F%2Ftvpic.gtimg.cn%2Fhead%2F13ac287746010364e3279f71daa8a54cda39a3ee5e6b4b0d3255bfef95601890afd80709%2F344","domain":".video.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341,"sameSite":"unspecified"},{"name":"role","value":"0","domain":".v.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341,"sameSite":"unspecified"},{"name":"p_vuserid","value":"0","domain":".v.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341,"sameSite":"unspecified"},{"name":"vqq_access_token","value":"8AE8EBC80CBE0AE11DB87A42EDF4EBC4","domain":".v.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341,"sameSite":"unspecified"},{"name":"vqq_refresh_token","value":"E2CC502CF3CE278B72B404CAB4407ABC","domain":".v.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341,"sameSite":"unspecified"},{"name":"v_t_access_token","value":"8AE8EBC80CBE0AE11DB87A42EDF4EBC4","domain":".v.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341,"sameSite":"unspecified"},{"name":"v_t_refresh_token","value":"E2CC502CF3CE278B72B404CAB4407ABC","domain":".v.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341,"sameSite":"unspecified"},{"name":"_new_next_refresh_time","value":"7200","domain":".v.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341,"sameSite":"unspecified"},{"name":"last_refresh_vuserid","value":"3448646108","domain":".v.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341,"sameSite":"unspecified"},{"name":"vqq_vusession","value":"BBm5VW-xInjQ4vJkO9--t6ONjpjEVNjyJg42OVPSi8Zmk65GmsRpCVGFdNy8JHNcdGrVFpTd-Qf8GOCMgYtLxH1foIO9r0wNuSRTYLyw5s1VbPsPMHYVNncBrB1wWJaC0Fw8iTX0V4dXtp5lQCI8GYzCF3jOtgyZe0eARAJu3uYjV8j-xB7WwfLm1A.O","domain":".video.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341.038093,"sameSite":"unspecified"},{"name":"vqq_login_time_init","value":"1760609341","domain":".video.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341.038123,"sameSite":"unspecified"},{"name":"v_vusession","value":"BBm5VW-xInjQ4vJkO9--t6ONjpjEVNjyJg42OVPSi8Zmk65GmsRpCVGFdNy8JHNcdGrVFpTd-Qf8GOCMgYtLxH1foIO9r0wNuSRTYLyw5s1VbPsPMHYVNncBrB1wWJaC0Fw8iTX0V4dXtp5lQCI8GYzCF3jOtgyZe0eARAJu3uYjV8j-xB7WwfLm1A.O","domain":".video.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341.03874,"sameSite":"unspecified"},{"name":"v_login_time_init","value":"1760609341","domain":".video.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341.038679,"sameSite":"unspecified"},{"name":"vqq_vusession","value":"BBm5VW-xInjQ4vJkO9--t6ONjpjEVNjyJg42OVPSi8Zmk65GmsRpCVGFdNy8JHNcdGrVFpTd-Qf8GOCMgYtLxH1foIO9r0wNuSRTYLyw5s1VbPsPMHYVNncBrB1wWJaC0Fw8iTX0V4dXtp5lQCI8GYzCF3jOtgyZe0eARAJu3uYjV8j-xB7WwfLm1A.O","domain":".v.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341,"sameSite":"unspecified"},{"name":"v_vusession","value":"BBm5VW-xInjQ4vJkO9--t6ONjpjEVNjyJg42OVPSi8Zmk65GmsRpCVGFdNy8JHNcdGrVFpTd-Qf8GOCMgYtLxH1foIO9r0wNuSRTYLyw5s1VbPsPMHYVNncBrB1wWJaC0Fw8iTX0V4dXtp5lQCI8GYzCF3jOtgyZe0eARAJu3uYjV8j-xB7WwfLm1A.O","domain":".v.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341,"sameSite":"unspecified"},{"name":"v_qq_com_session_lapse_time","value":"1760616541047","domain":".v.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1760616541,"sameSite":"unspecified"},{"name":"login_time_last","value":"2025-10-16 18:9:1","domain":".video.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"last_refresh_time","value":"1760609341049","domain":".v.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341,"sameSite":"unspecified"},{"name":"vcuid","value":"9015271708","domain":".v.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1760681342.114506,"sameSite":"unspecified"},{"name":"vcuid","value":"9015271708","domain":".video.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1760616542.200644,"sameSite":"unspecified"},{"name":"_qimei_i_1","value":"76c577d7955c048fc292fb375f8d76b4febca1f541595181b08c7b582493206c616364943980ebdd828de5e6","domain":".qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792145341,"sameSite":"unspecified"},{"name":"_vcuid_debug","value":"\\"2025-10-16 18:09:02.440095837 +0800 CST m=+1824197.274902691\\"","domain":".video.qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1760616542.200552,"sameSite":"unspecified"}]',
              platformLocalStorage: '{"__url__":"https://mp.v.qq.com/homepage"}',
            },
          ],
          authorization: 'sess_8022d2641b12c9e1f665e7c1ff8de89e77aacdf62116e405e30277cb7c7d5414',
        },
        '123',
      );
      console.log(JSON.stringify(result, null, 2));
      await Task.Delay(40 * 60 * 1000);
    },
    40 * 60 * 1000,
  );
});
