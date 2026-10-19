import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { getAuthInfoAsync, getPersonalInfoAsync } from '@/media-platform/tengxunweishi/tengxunweishi-user.service';
import { AccountService, Platforms } from '../../../src';

describe('【Mock】', () => {
  describe('获取腾讯微视个人信息', () => {
    const server = setupServer(
      rest.get('https://media.weishi.qq.com*/media-api/getPersonalInfo', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 0,
              msg: 'success',
              personDetail: {
                personId: '1586339338503863',
                avatar: 'http://avatar1.weishi.qq.com/bbccc03682b44dc79ed5506c03d2avatar_640.jpg',
                nickName: '修隐',
                fansNum: 46,
                interestNum: 5,
                receivePraiseNum: 321,
                lastUpdateTime: '1697080766',
                totalVideoNum: '0',
                incVideoNum: '0',
                totalPlayVv: '0',
                incPlayVv: '0',
                incFansNum: '0',
              },
              isMainAccount: 1,
              showSyncToOmBtn: 0,
              isDataAlyEnabled: 0,
              talentLevel: 200,
            }),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const result = await getPersonalInfoAsync('success', '');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(0);
      });
    });
  });

  describe('获取腾讯微视登录信息', () => {
    const server = setupServer(
      rest.get('https://h5.weishi.qq.com*/weishi/getauthinfo', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 0,
              errorMsg: 'success',
              data: {
                weishiOpenid: 'omdR2twWOlI6DXYBZWksW2TVHoZ0',
                personid: '1586339338503863',
                authType: '3',
                openid: 'osjlD5kL01dLNOEUp32Kjm33XLBc',
                accessToken:
                  '73_NG9vdxVkOWuQ_96lZSmQSgeyFoblAPm-21oqug3hFnyN6uMyDbSeBPQFF6EqWRZmfYNXFccyU12mtpULv3UZdS7Hk_XeTsuezooLV3RklCE',
                appid: 'wx4e681083a33bb413',
                refreshToken:
                  '73_112eD2ptMCkxJp1vLWsl3PipLOSF30zMO6Y3AE2HJ6X5-ItRfhDnE-p2_ah9o5gHQJuC2XnfDPfyAnohEj4zvHog8ffFVq_ClUvFwiVaJaI',
                wsToken: '',
              },
            }),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const result = await getAuthInfoAsync('success');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(0);
      });
    });
  });
});

describe.runIf(true)('【真实测试】', () => {
  const cookie =
    'RK=Hyc0w4d7c5; ptcz=2c504637af9be23c8220eb4c640ed5041423ff7fe50224d6e08f2b5e21d0b7d1; person_id_wsbeacon=5183045383418659; pvid=1514245545; sThrAppid=1101083114; iAuthType=1; openid=D12C68BBF650C6186F6DB0295A84EE9A; sSessionKey=2521FC6D6CF9AE588439942C1282F0B0; person_id=1740582073363129';

  test('腾讯微视', async () => {
    const result = await new AccountService(cookie, Platforms.TengXunWeiShi).checkAccountAlive();
    console.log('登录状态:', JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result).toBe(1);
  }, 10000000);

  test('获取腾讯微视个人信息', async () => {
    const authInfo = await getAuthInfoAsync(cookie);
    const result = await getPersonalInfoAsync(cookie, authInfo.data.personid);
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);

  test('获取腾讯微视登录信息', async () => {
    const result = await getAuthInfoAsync(cookie);
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);

  test('检测用户有效性', async () => {
    const cookie =
      'RK=0xEQnhGbVI; ptcz=c1bf789687f61299453858a17ce44da4439e97ad683957a28508aa9a197a28d3; pvid=9185592320; sThrAppid=1101083114; iAuthType=1; openid=6CE1A8C8FD851E7D886E8AACD0405BEC; sSessionKey=F335E67C8C9AF104382FEDE304A588F2; person_id=1533223486215476';
    const result = await new AccountService(cookie, Platforms.TengXunWeiShi).checkAccountAlive();
    console.log('有效性:' + result);
    expect(result).toBe(1);
  });
});
