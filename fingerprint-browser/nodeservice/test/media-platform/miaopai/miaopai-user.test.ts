import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { getUserInfoAsync, getUserStatisticAsync } from '@/media-platform/miaopai/miaopai-user.service';

describe('【Mock】', () => {
  describe('秒拍用户信息', () => {
    const server = setupServer(
      rest.get('https://creator.miaopai.com*/profile/getInfo', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 200,
              msg: '操作成功',
              data: {
                id: 1020568292326176809,
                birthday: '1990-01-01',
                email: '',
                phone: '18874070066',
                nick: '聪明的妙妙SIA',
                area: '湖南 益阳',
                gender: 0,
                createTime: 1646899288077,
                createTimeNice: '2022-03-10 16:01:28',
                iconSafe: 'http://imgaliyuncdn.miaopai.com/creator/05db43dcace7daa6eb7c544ed3008cb3_avatar.jpg',
                icon: 'http://imgaliyuncdn.miaopai.com/creator/05db43dcace7daa6eb7c544ed3008cb3_avatar.jpg',
                lastModifyTime: '2023-08-22 10:38:33',
                desc: '聪明的妙妙，就是妙妙啊',
                loginName: 'miaopaijx_sv081d9ob',
                otherLoginMode: 4,
                coverSafe: 'http://wscdn.miaopai.com/cover/241.jpg',
                cover: 'http://wscdn.miaopai.com/cover/241.jpg',
                profileUrl: 'http://www.miaopai.com/u/miaopaijx_sv081d9ob',
                platform: {
                  atype: 1,
                  type: 1,
                  abroad_type: 0,
                  cate_id: '4',
                  org_name: '',
                  org_code: '',
                  org_level: '',
                  org_img: '',
                  locate: '湖南 长沙',
                  province: '湖南',
                  city: '长沙',
                  name: '李藏龙',
                  qq: '',
                  phone: '18874070066',
                  email: '18874070066@163.com',
                  platform: '1',
                  level: '0',
                  id_no: '430626199305288090',
                  id_no_img: 'http://wsqncdn.miaopai.com/creator/7d656d8c4a04343607c3cafe89b5a4cb_identify.jpg',
                  mediaDesc: '',
                  status: 0,
                  trial_status: '1',
                  trial_cnt: 0,
                  agree: 0,
                  failedDesc: '',
                  createTime: '2022-03-10 19:19:41',
                  modifyTime: '2023-10-27 10:52:04',
                  invite: '',
                  qualify: ['', '', '', '', ''],
                  bobo_uid: '0',
                  mcn: 0,
                },
                weibo: {
                  nick: '',
                  icon: '',
                  profileUrl: '',
                  oauthUrl: 'http://sso.miaopai.com/1/sso/requestcode?vend=creator&mode=3&action=bind',
                },
                account_info: {
                  amount: null,
                },
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
        const result = await getUserInfoAsync('success');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(200);
      });
    });
  });

  describe('秒拍首页统计数据', () => {
    const server = setupServer(
      rest.get('https://creator.miaopai.com*/profile/getstatis', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 200,
              msg: '操作成功',
              data: {
                income: 0,
                play_cnt: 0,
                fans_cnt: 2,
                credit: 100,
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
        const result = await getUserStatisticAsync('success');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(200);
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('秒拍用户信息', async () => {
    const cookie =
      'PHPSESSID=ac429e9f509040274b2f9fc94ea66310; weiba_captcha=257a5113d395c54ace400d5d43454216; SRV_CREATOR_COOKIE_LOGIN_TOKEN=a2HGavOKijyxnFtw9yLy5V5FNmB5LlruAIbcwJwXU2uFS%7Eed';

    const result = await getUserInfoAsync(cookie);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(200);
  }, 10000000);

  test('秒拍首页统计数据', async () => {
    const cookie =
      'PHPSESSID=ac429e9f509040274b2f9fc94ea66310; weiba_captcha=257a5113d395c54ace400d5d43454216; SRV_CREATOR_COOKIE_LOGIN_TOKEN=a2HGavOKijyxnFtw9yLy5V5FNmB5LlruAIbcwJwXU2uFS%7Eed';

    const result = await getUserStatisticAsync(cookie);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(200);
  }, 10000000);
});
