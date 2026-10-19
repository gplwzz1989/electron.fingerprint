import { describe, test, expect } from 'vitest';
import { getUserDataAsync, getUserInfoAsync } from '@/media-platform/xiguashipin/xiguashipin-user.service';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { AccountService, Platforms } from '../../../src';

describe('【Mock】', () => {
  describe('获取西瓜视频用户信息', () => {
    const server = setupServer(
      rest.get('https://www.ixigua.com*/home', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.body(
              '"AuthorDetailInfo":{"user_id":"93668768025","media_id":"1721836553964548","name":"聪明的熊猫SIA","introduce":"头条说：我创作的，就是头条！😁","avatar":"https:\u002F\u002Fsf1-cdn-tos.bdxiguastatic.com\u002Fimg\u002Fuser-avatar\u002F11190030976122138ad9f3591f74e3e8~300x300.image?from=avatar","user_auth_info":"","follow":false,"fansNum":"158","followNum":"2","diggNum":578,"articleDiggNum":573,"commentDiggNum":5,"danmakuDiggNum":0,"is_living":false,"verified_content":"","is_blocking":false,"is_blocked":false,"user_report":false,"is_fetched":true,',
            ),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const result = await getUserDataAsync('success', '');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.status).toBe(0);
        expect(result.data.followNum).toBe('2');
        expect(result.data.fansNum).toBe('158');
        expect(result.data.diggNum).toBe('578');
      });
    });
  });
});

describe.runIf(true)('【真实测试】', () => {
  test('获取西瓜视频用户数据', async () => {
    const cookie =
      '_tea_utm_cache_3062=undefined; MONITOR_WEB_ID=36562fad-0466-45cd-9826-1cd101fcf1a5; passport_csrf_token=29632347a66f8d1e51749835cb064ab2; passport_csrf_token_default=29632347a66f8d1e51749835cb064ab2; studio_web_id=7291914075281655346; Hm_lvt_5ef88140a857780eb79a65f7d563f9ef=1698024595; passport_auth_status=c380793b0b56d2275a10ec1b16430c10%2C2e669a4fabfb16c43e2efca32e5f0fa2; passport_auth_status_ss=c380793b0b56d2275a10ec1b16430c10%2C2e669a4fabfb16c43e2efca32e5f0fa2; sid_guard=3ce9d8c4fdd122a46c0021605f7a8363%7C1698025258%7C5184002%7CFri%2C+22-Dec-2023+01%3A41%3A00+GMT; uid_tt=59b7e5ff2c346463b334c673da06c742; uid_tt_ss=59b7e5ff2c346463b334c673da06c742; sid_tt=3ce9d8c4fdd122a46c0021605f7a8363; sessionid=3ce9d8c4fdd122a46c0021605f7a8363; sessionid_ss=3ce9d8c4fdd122a46c0021605f7a8363; sid_ucp_v1=1.0.0-KGMzZTUyZGRmMGE1MjEyZDY2MzA2NDNhYzI5MDk5MTllNDgxZjhkM2IKFQiZ8t_43AIQqp7XqQYY9hc4AkDxBxoCbGYiIDNjZTlkOGM0ZmRkMTIyYTQ2YzAwMjE2MDVmN2E4MzYz; ssid_ucp_v1=1.0.0-KGMzZTUyZGRmMGE1MjEyZDY2MzA2NDNhYzI5MDk5MTllNDgxZjhkM2IKFQiZ8t_43AIQqp7XqQYY9hc4AkDxBxoCbGYiIDNjZTlkOGM0ZmRkMTIyYTQ2YzAwMjE2MDVmN2E4MzYz; csrf_session_id=0105d819a56a8b36f402cbcabf20a8cb; ttwid=1%7CTs4IVIuTKwndep8x1NcxA0yINuSxsw1yUtOrNg_EuVI%7C1698126192%7Cfd7d31ec1a41a41aa14555233fac8e21ad71c1e01e00674473392e865b7c7bca; s_v_web_id=f12b6064bee460ffb1d736b1d4ea05bc64d43061a68a932161';
    const result = await getUserDataAsync(cookie, '93668768025');
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.status).toBe(0);
  }, 10000000);

  test('获取西瓜视频用户数据', async () => {
    const cookie =
      'uid_tt=88ae12c524507052a26dc97c9dcacd6b;passport_csrf_token_default=2a3e7a520d95c975649de91ed4add3a7;ssid_ucp_v1=1.0.0-KGExOTM4Y2MwZDhlNTFlZDIxZDdiZjQwNmYwNGZlMTcyYzY2MjllNDUKFwio1vDvpfTqARCW4oSvBhj2FzgCQPEHGgJscSIgYjFlM2VjOGU5ZDVjMWJmNWU1ZTc3NGNiNzU4NjE2OGM;passport_auth_status=1d5eb70d20f01a1f6501c7fdc2ce4d1d%2C;sessionid=b1e3ec8e9d5c1bf5e5e774cb7586168c;sid_tt=b1e3ec8e9d5c1bf5e5e774cb7586168c;s_v_web_id=verify_lt7zh46d_ctQhxdnP_8G5V_4R7o_AlR8_2si55lrT0A08;uid_tt_ss=88ae12c524507052a26dc97c9dcacd6b;_tea_utm_cache_3062=undefined;csrf_session_id=294a357b08beccce45a06edd1e8889d2;MONITOR_WEB_ID=1c9c3148-b98c-4593-ba51-886d726a369b;passport_auth_status_ss=1d5eb70d20f01a1f6501c7fdc2ce4d1d%2C;passport_csrf_token=2a3e7a520d95c975649de91ed4add3a7;sessionid_ss=b1e3ec8e9d5c1bf5e5e774cb7586168c;sid_guard=b1e3ec8e9d5c1bf5e5e774cb7586168c%7C1709256982%7C2953855%7CThu%2C+04-Apr-2024+06%3A07%3A17+GMT;sid_ucp_v1=1.0.0-KGExOTM4Y2MwZDhlNTFlZDIxZDdiZjQwNmYwNGZlMTcyYzY2MjllNDUKFwio1vDvpfTqARCW4oSvBhj2FzgCQPEHGgJscSIgYjFlM2VjOGU5ZDVjMWJmNWU1ZTc3NGNiNzU4NjE2OGM;studio_web_id=7341202780784199183';
    const result = await getUserInfoAsync(cookie);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.status).toBe(0);
  }, 10000000);

  test('检测用户有效性', async () => {
    const cookie =
      'xsecappid=ugc; a1=1951d01798fkxas6znefudp7yv42gbzhfrjwyyxds50000112997; webId=ccddf944b8cbec4f84daf50d4be6dcd8; gid=yj2yf8yYy0i2yj2yf8yWjFvCYiTC0MKuIdi7VfMfUWvh4E28JkDuxv888yyJjjW8WYdq8yDY; customer-sso-sid=68c517473021518006637498c5a38512c2e6370d; x-user-id-creator.xiaohongshu.com=6436d3da000000000d01b667; customerClientId=723439318446495; access-token-creator.xiaohongshu.com=customer.creator.AT-68c517473021518006637502ras8es0bjy1thzt7; galaxy_creator_session_id=xMQMaSFpg0api3zj8oKZqyr0e3ILyoiS2JR2; galaxy.creator.beaker.session.id=1739948410269049250263; acw_tc=0a00d2d717403944467965038eadcf67375eb843692ce6b33399e81cb5c2b6; websectiga=59d3ef1e60c4aa37a7df3c23467bd46d7f1da0b1918cf335ee7f2e9e52ac04cf; sec_poison_id=87248340-1fa5-4ea7-8755-cb4c19b85f86';
    const result = await new AccountService(cookie, Platforms.XiGuaShiPin).checkAccountAlive();
    console.log('有效性:' + result);
    expect(result).toBe(1);
  });
});
