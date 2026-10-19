import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { getDataOverviewAsync } from '@/media-platform/azhan/azhan-data-overview.service';

describe('【Mock】', () => {
  describe('获取A站数据中心视频数据', () => {
    const server = setupServer(
      rest.get('https://member.acfun.cn*/dataCenter/api/overview', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              result: 0,
              beginDate: '20231029',
              overview: {
                dougaPlayCount: 17,
                dougaPlayGrowth: 17,
                dougaCommentCount: 0,
                dougaCommentGrowth: 0,
                dougaDanmakuCount: 0,
                dougaDanmakuGrowth: 0,
                dougaStowCount: 0,
                dougaStowGrowth: 0,
                dougaShareCount: 0,
                dougaShareGrowth: 0,
                dougaBananaCount: 0,
                dougaBananaGrowth: 0,
                dougaGiftPeachCount: 0,
                dougaGiftPeachGrowth: 0,
                dougaLiketCount: 0,
                dougaLikeGrowth: 0,
                pureDougaGiftPeachCount: 0,
                articleViewCount: 0,
                articleViewGrowth: -2,
                articleCommentCount: 0,
                articleCommentGrowth: 0,
                articleStowCount: 0,
                articleStowGrowth: 0,
                articleShareCount: 0,
                articleShareGrowth: 0,
                articleBananaCount: 0,
                articleBananaGrowth: 0,
                userFansCount: 0,
                userFansTotal: 0,
              },
              dailyData: [
                {
                  date: '20231029',
                  dougaPlayCount: 17,
                  dougaCommentCount: 0,
                  dougaDanmakuCount: 0,
                  dougaStowCount: 0,
                  dougaShareCount: 0,
                  dougaBananaCount: 0,
                  dougaGiftPeachCount: 0,
                  dougaLiketCount: 0,
                  articleViewCount: 0,
                  articleCommentCount: 0,
                  articleStowCount: 0,
                  articleShareCount: 0,
                  articleBananaCount: 0,
                  userFansCount: 0,
                },
              ],
              endDate: '20231029',
              days: 1,
            }),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const result = await getDataOverviewAsync('success', 1);
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.result).toBe(0);
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('获取A站数据中心视频数据', async () => {
    const cookie =
      '_did=web_681241185A1C3225; acPasstoken=ChVpbmZyYS5hY2Z1bi5wYXNzdG9rZW4ScArQoqZA5iaW-Nl9dsjogui9gd97nzJNdyC87JH9LoKhFuJfLSNCTU6hLZbfv2Vn6ZEwqr6GU4Hw_oIouajhqYZUk6EwklQLTB35LoffR0N0_ACvkQ--Mstww4iO4x3Lodce8jPEHNgyBbNqX1faVaoaEoD_UlfWnTtdbPwn-r4gJIuAMyIg0t38VU6b8TR1m2ZRG1DLdqjkVmn45Z7T1_CH2bYU7yAoBTAB; auth_key=65894801; ac_username=%E8%81%AA%E6%98%8E%E7%9A%84Funcy; acPostHint=6c8d599483451543d556fe1df941a54da068; ac_userimg=https%3A%2F%2Fimgs.aixifan.com%2Fstyle%2Fimage%2FdefaultAvatar.jpg; limitRequest=1; cur_req_id=183356603AD6354E_self_06683b7dd01b079d305752f2422b0f97; cur_group_id=183356603AD6354E_self_06683b7dd01b079d305752f2422b0f97_0';

    const result = await getDataOverviewAsync(cookie, 1);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.result).toBe(0);
  }, 10000000);
});
