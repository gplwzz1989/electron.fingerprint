import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { getUserHomeDataAsync, getUserIncomeAsync } from '@/media-platform/aiqiyi/aiqiyi-user.service';
import { AccountService, Aiqiyi, Platforms } from '../../../src';

describe('【Mock】', () => {
  describe('爱奇艺首页数据', () => {
    const server = setupServer(
      rest.get('https://mp-api.iqiyi.com*/stat/api/1.0/user/yesterday', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 0,
              msg: 'success',
              data: {
                totalVv: 3667,
                yestodayVv: 3,
                vvUpdated: true,
                totalLikeNum: 43,
                yesterdayLikeNum: 0,
                totalPv: 44567,
                totalPlaytime: 75348000,
                totalBvvDuration: 218865,
                playCompletePercent: 0.3443,
                totalCommentNum: 2,
                fansTotalNum: 90,
                fansChange: 0,
                fansUpdated: true,
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
        const result = await getUserHomeDataAsync('success');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(0);
      });
    });
  });

  describe('爱奇艺收益数据', () => {
    const server = setupServer(
      rest.get('https://mp-api.iqiyi.com*/income/api/1.0/home_aggregate', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 0,
              msg: 'success',
              data: {
                totalIncome: 0.01,
                yesterdayIncome: {
                  date: '2023-10-25',
                  videoAdIncome: 0.0,
                  videoAdFansIncome: 0.0,
                  feedIncome: 0.0,
                  feedFansIncome: null,
                  smallVideoIncome: 0.0,
                  smallVideoFansIncome: 0.0,
                  rewardIncome: 0.0,
                  shortVideoIncome: 0.0,
                  shortVideoFansIncome: 0.0,
                  shortVideoUnFansIncome: 0.0,
                  wangdaAdIncome: null,
                  wangdaPayIncome: null,
                  wangdaPdIncome: null,
                  wangdaIncome: 0.0,
                  wangjuAdIncome: null,
                  wangjuPayIncome: null,
                  wangjuPdIncome: null,
                  wangjuIncome: 0.0,
                  childAdIncome: null,
                  childPayIncome: null,
                  childPdIncome: null,
                  childIncome: 0.0,
                  cartoonAdIncome: null,
                  cartoonPayIncome: null,
                  cartoonPdIncome: null,
                  cartoonIncome: 0.0,
                  packIncome: 0.0,
                  bookWordsIncome: null,
                  bookNoWordsIncome: null,
                  bookIncome: 0.0,
                  comicWordsIncome: null,
                  comicOrderIncome: null,
                  comicIncome: 0.0,
                  novelOrderPayIncome: null,
                  novelOriginalIncome: null,
                  novelIncome: 0.0,
                  clubIncome: null,
                  income: 0.0,
                  varietyAdIncome: null,
                  varietyPayIncome: null,
                  varietyPdIncome: null,
                  varietyMemberIncome: 0.0,
                  documentaryAdIncome: null,
                  documentaryPayIncome: null,
                  documentaryPdIncome: null,
                  documentaryMemberIncome: 0.0,
                  gameAdIncome: null,
                  gamePayIncome: null,
                  gamePdIncome: null,
                  gameMemberIncome: 0.0,
                  fansMemberIncome: 0.0,
                  mallIncome: 0.0,
                  duanjuAdIncome: null,
                  duanjuPayIncome: null,
                  duanjuPdIncome: null,
                  duanjuIncome: 0.0,
                  platformXiyuIncome: null,
                  platformXiyuPopularIncome: null,
                  platformXinyeIncome: null,
                  platformRewardIncome: null,
                  platformZhuiGuangIncome: null,
                  educationIncome: null,
                  weijuIncome: 0.0,
                  weijuAdRechargeIncome: null,
                  weijuAdShareIncome: null,
                  weijuPayRechargeIncome: null,
                  weijuPayShareIncome: null,
                  hasFeed: false,
                  hasVideo: true,
                },
                yesterdayCalculate: true,
              },
              errorReason: null,
              context: null,
              debug_note: null,
              debug_info: null,
            }),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const result = await getUserIncomeAsync('success');
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
    'QC006=yzxxe5joi7kta2merduhxx5q; __uuid=0cb7dc37-c04d-7f7d-97e5-4b68807fd404; QC005_PCA=was2umw25xvxpuby4xknldgqwzrxgsxx; P00003_PCA=1778782853; P00004=.1740538629.eab1bdb257; isRefreshAuth=1; QC160=%7B%22type%22%3A-1%2C%22conformLoginType%22%3A0%7D; P00001=92Cim3I2UGrzeG3iKcx8l5WMJA6XvyndY1F85C1etx8ORHFZYPdUjS1m16ZKm3KEFTrx601; P00007=92Cim3I2UGrzeG3iKcx8l5WMJA6XvyndY1F85C1etx8ORHFZYPdUjS1m16ZKm3KEFTrx601; P00003=5716190131518464; P00002=%7B%22uid%22%3A5716190131518464%2C%22pru%22%3A5716190131518464%2C%22user_name%22%3A%22193****2991%22%2C%22nickname%22%3A%22%5Cu7528%5Cu6237%40144ed83a41fc00%22%2C%22pnickname%22%3A%22%5Cu7528%5Cu6237%40144ed83a41fc00%22%2C%22type%22%3A11%2C%22email%22%3A%22%22%7D; P00010=5716190131518464; P01010=1740585600; P00PRU=5716190131518464; __dfp=a13cdf189b18d94375a7309d130bf48cd3b84aadef9ae6d2e62af0ed567619410a@1745990366714@1744694367714';

  test('爱奇艺首页数据', async () => {
    const result = await getUserHomeDataAsync(cookie);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);

  test('爱奇艺收益数据', async () => {
    const result = await getUserIncomeAsync(cookie);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);

  test('爱奇艺用户信息', async () => {
    const result = await Aiqiyi.getAiqiyiUserInfo(cookie);
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);

  test('检测用户有效性', async () => {
    const cookie =
      'QC006=yzxxe5joi7kta2merduhxx5q; __uuid=0cb7dc37-c04d-7f7d-97e5-4b68807fd404; QC005_PCA=was2umw25xvxpuby4xknldgqwzrxgsxx; P00003_PCA=1778782853; P00004=.1740538629.eab1bdb257; isRefreshAuth=1; QC160=%7B%22type%22%3A-1%2C%22conformLoginType%22%3A0%7D; P00001=92Cim3I2UGrzeG3iKcx8l5WMJA6XvyndY1F85C1etx8ORHFZYPdUjS1m16ZKm3KEFTrx601; P00007=92Cim3I2UGrzeG3iKcx8l5WMJA6XvyndY1F85C1etx8ORHFZYPdUjS1m16ZKm3KEFTrx601; P00003=5716190131518464; P00002=%7B%22uid%22%3A5716190131518464%2C%22pru%22%3A5716190131518464%2C%22user_name%22%3A%22193****2991%22%2C%22nickname%22%3A%22%5Cu7528%5Cu6237%40144ed83a41fc00%22%2C%22pnickname%22%3A%22%5Cu7528%5Cu6237%40144ed83a41fc00%22%2C%22type%22%3A11%2C%22email%22%3A%22%22%7D; P00010=5716190131518464; P01010=1740585600; P00PRU=5716190131518464; __dfp=a13cdf189b18d94375a7309d130bf48cd3b84aadef9ae6d2e62af0ed567619410a@1745990366714@1744694367714';
    const result = await new AccountService(cookie, Platforms.AiQiYi).checkAccountAlive();
    console.log('有效性:' + result);
    expect(result).toBe(1);
  });
});
