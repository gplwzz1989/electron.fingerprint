import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import {
  getDataOverviewAsync,
  getDataOverviewStatisticAsync,
  getDataOverviewIncomeAsync,
  getDataOverviewIncomeStatisticAsync,
  getDataOverviewFansAsync,
  getDataOverviewFansStatisticAsync,
  getSingleDataOverviewStatisticAsync,
  getSingleDataOverviewAsync,
} from '@/media-platform/wangyihao/wangyihao-data-overview.service';

describe('【Mock】', () => {
  describe('获取网易号内容分析', () => {
    const server = setupServer(
      rest.get('https://mp.163.com*/wemedia/data/content/article/pv/list.do', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 1,
              msg: '操作成功',
              data: {
                total: 7,
                list: [
                  {
                    readCount: 32,
                    recommendCount: 574,
                    commentCount: 0,
                    shareCount: 0,
                    statDate: '2023-10-26',
                    tname: '聪明的修隐小易',
                    voteCount: null,
                  },
                  {
                    readCount: 74,
                    recommendCount: 1009,
                    commentCount: 0,
                    shareCount: 0,
                    statDate: '2023-10-27',
                    tname: '聪明的修隐小易',
                    voteCount: null,
                  },
                  {
                    readCount: 377,
                    recommendCount: 2033,
                    commentCount: 0,
                    shareCount: 0,
                    statDate: '2023-10-28',
                    tname: '聪明的修隐小易',
                    voteCount: null,
                  },
                  {
                    readCount: 545,
                    recommendCount: 4207,
                    commentCount: 0,
                    shareCount: 0,
                    statDate: '2023-10-29',
                    tname: '聪明的修隐小易',
                    voteCount: null,
                  },
                  {
                    readCount: 311,
                    recommendCount: 2763,
                    commentCount: 0,
                    shareCount: 0,
                    statDate: '2023-10-30',
                    tname: '聪明的修隐小易',
                    voteCount: null,
                  },
                  {
                    readCount: 140,
                    recommendCount: 943,
                    commentCount: 0,
                    shareCount: 0,
                    statDate: '2023-10-31',
                    tname: '聪明的修隐小易',
                    voteCount: null,
                  },
                  {
                    readCount: 16,
                    recommendCount: 279,
                    commentCount: 0,
                    shareCount: 0,
                    statDate: '2023-11-01',
                    tname: '聪明的修隐小易',
                    voteCount: null,
                  },
                ],
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
        const result = await getDataOverviewAsync('success', '', '', '', '');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(1);
      });
    });
  });

  describe('获取网易号内容头部统计', () => {
    const server = setupServer(
      rest.get('https://mp.163.com*/wemedia/data/content/article/count.do', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 1,
              msg: '操作成功',
              data: {
                wemediaId: 'W2905703798683225716',
                totalCount: 17053,
                yesterdayReadCount: 16,
                recommendCount: 279,
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
        const result = await getDataOverviewStatisticAsync('success', '', '');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(1);
      });
    });
  });

  describe('获取网易号收益分析', () => {
    const server = setupServer(
      rest.get('https://mp.163.com*/wemedia/profit/list.do', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 1,
              msg: '操作成功',
              data: {
                total: 7,
                list: [
                  {
                    date: '2023-10-26',
                    income: 0.0,
                    articleIncome: 0.0,
                    videoIncome: 0.0,
                    dynamicIncome: 0,
                    originalArticleIncome: 0.0,
                    starIncome: 0.0,
                    articleFlowIncome: 0.0,
                    articleTalentIncome: 0.0,
                    originalVideoIncome: 0.0,
                    videoStarIncome: 0.0,
                    videoFlowIncome: 0.0,
                    videoTalentIncome: 0.0,
                  },
                  {
                    date: '2023-10-27',
                    income: 0.0,
                    articleIncome: 0.0,
                    videoIncome: 0.0,
                    dynamicIncome: 0,
                    originalArticleIncome: 0.0,
                    starIncome: 0.0,
                    articleFlowIncome: 0.0,
                    articleTalentIncome: 0.0,
                    originalVideoIncome: 0.0,
                    videoStarIncome: 0.0,
                    videoFlowIncome: 0.0,
                    videoTalentIncome: 0.0,
                  },
                  {
                    date: '2023-10-28',
                    income: 0.0,
                    articleIncome: 0.0,
                    videoIncome: 0.0,
                    dynamicIncome: 0,
                    originalArticleIncome: 0.0,
                    starIncome: 0.0,
                    articleFlowIncome: 0.0,
                    articleTalentIncome: 0.0,
                    originalVideoIncome: 0,
                    videoStarIncome: 0,
                    videoFlowIncome: 0.0,
                    videoTalentIncome: 0.0,
                  },
                  {
                    date: '2023-10-29',
                    income: 0.0,
                    articleIncome: 0.0,
                    videoIncome: 0.0,
                    dynamicIncome: 0,
                    originalArticleIncome: 0.0,
                    starIncome: 0.0,
                    articleFlowIncome: 0.0,
                    articleTalentIncome: 0.0,
                    originalVideoIncome: 0,
                    videoStarIncome: 0,
                    videoFlowIncome: 0.0,
                    videoTalentIncome: 0.0,
                  },
                  {
                    date: '2023-10-30',
                    income: 0.0,
                    articleIncome: 0.0,
                    videoIncome: 0.0,
                    dynamicIncome: 0,
                    originalArticleIncome: 0.0,
                    starIncome: 0.0,
                    articleFlowIncome: 0.0,
                    articleTalentIncome: 0.0,
                    originalVideoIncome: 0,
                    videoStarIncome: 0,
                    videoFlowIncome: 0.0,
                    videoTalentIncome: 0.0,
                  },
                  {
                    date: '2023-10-31',
                    income: 0.0,
                    articleIncome: 0.0,
                    videoIncome: 0.0,
                    dynamicIncome: 0,
                    originalArticleIncome: 0.0,
                    starIncome: 0.0,
                    articleFlowIncome: 0.0,
                    articleTalentIncome: 0.0,
                    originalVideoIncome: 0,
                    videoStarIncome: 0,
                    videoFlowIncome: 0.0,
                    videoTalentIncome: 0.0,
                  },
                  {
                    date: '2023-11-01',
                    income: 0.0,
                    articleIncome: 0.0,
                    videoIncome: 0.0,
                    dynamicIncome: 0,
                    originalArticleIncome: 0.0,
                    starIncome: 0.0,
                    articleFlowIncome: 0.0,
                    articleTalentIncome: 0.0,
                    originalVideoIncome: 0.0,
                    videoStarIncome: 0.0,
                    videoFlowIncome: 0.0,
                    videoTalentIncome: 0.0,
                  },
                ],
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
        const result = await getDataOverviewIncomeAsync('success', '', '', '', '');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(1);
      });
    });
  });

  describe('获取网易号收益头部统计数据', () => {
    const server = setupServer(
      rest.get('https://mp.163.com*/wemedia/profit/view.do', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 1,
              msg: '操作成功',
              data: {
                sumProfit: 0.19,
                sumArticleProfit: 0.19,
                sumVideoProfit: 0.0,
                profit: 0.0,
                articleProfit: 0.0,
                videoProfit: 0.0,
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
        const result = await getDataOverviewIncomeStatisticAsync('success', '', '');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(1);
      });
    });
  });

  describe('获取网易号粉丝分析', () => {
    const server = setupServer(
      rest.get('https://mp.163.com*/wemedia/subs.json', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 1,
              msg: '操作成功',
              data: {
                ename: 'T1644810609036',
                icon: 'https://dingyue.ws.126.net/2023/0822/e163703ej00rzrth40004d0004g004gp.jpg',
                tname: '聪明的修隐小易',
                list: [
                  {
                    ename: 'T1644810609036',
                    statsDate: '2023-10-27',
                    sum: 27,
                    subs: null,
                    unsubs: null,
                    incr: 0,
                    tname: null,
                    id: null,
                  },
                  {
                    ename: 'T1644810609036',
                    statsDate: '2023-10-28',
                    sum: 27,
                    subs: null,
                    unsubs: null,
                    incr: 0,
                    tname: null,
                    id: null,
                  },
                  {
                    ename: 'T1644810609036',
                    statsDate: '2023-10-29',
                    sum: 27,
                    subs: null,
                    unsubs: null,
                    incr: 0,
                    tname: null,
                    id: null,
                  },
                  {
                    ename: 'T1644810609036',
                    statsDate: '2023-10-30',
                    sum: 27,
                    subs: null,
                    unsubs: null,
                    incr: 0,
                    tname: null,
                    id: null,
                  },
                  {
                    ename: 'T1644810609036',
                    statsDate: '2023-10-31',
                    sum: 27,
                    subs: null,
                    unsubs: null,
                    incr: 0,
                    tname: null,
                    id: null,
                  },
                  {
                    ename: 'T1644810609036',
                    statsDate: '2023-11-01',
                    sum: 27,
                    subs: null,
                    unsubs: null,
                    incr: 0,
                    tname: null,
                    id: null,
                  },
                ],
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
        const result = await getDataOverviewFansAsync('success', '', '', '', '');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(1);
      });
    });
  });

  describe('获取网易号粉丝头部数据', () => {
    const server = setupServer(
      rest.get('https://mp.163.com*/wemedia/general.json', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 1,
              msg: '操作成功',
              data: {
                mediaTotalPv: 17053,
                sumSubs: 27,
                incr: 0,
                pvsIncr: 16,
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
        const result = await getDataOverviewFansStatisticAsync('success', '', '');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(1);
      });
    });
  });

  describe('获取网易号单篇统计数据', () => {
    const server = setupServer(
      rest.get('https://mp.163.com*/wemedia/content/manage/dataView.do', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 1,
              msg: '操作成功',
              data: {
                recommendCount: 1397,
                pvCount: 13,
                processRate: 731,
                voteCount: 0,
                againstCount: 0,
                commentCount: 2,
                shareCount: 0,
                propCount: 0,
                articleId: 'HAIVMAGQ0552ZF94',
                skipId: '',
                wemediaId: 'W2905703798683225716',
                title: '你好，啤酒~~',
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
        const result = await getSingleDataOverviewStatisticAsync('success', '', '', '');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(1);
      });
    });
  });

  describe('获取网易号单篇报表数据', () => {
    const server = setupServer(
      rest.get('https://mp.163.com*/wemedia/contentDailyStat/list.do', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 1,
              msg: '操作成功',
              data: [
                {
                  docId: 'IFJC7VC50552ZF94',
                  skipId: null,
                  title: '分享：我的iPhone 15 Pro Max使用FineWoven手机壳艰难的一周',
                  date: '2023-11-30',
                  pvWeightCount: 0,
                  recommendWeightCount: 66,
                  commentCount: 0,
                  shareCount: 0,
                  upVote: 0,
                  downVote: 0,
                  prop: '',
                  gold: 0,
                },
                {
                  docId: 'IFJC7VC50552ZF94',
                  skipId: null,
                  title: '分享：我的iPhone 15 Pro Max使用FineWoven手机壳艰难的一周',
                  date: '2023-11-27',
                  pvWeightCount: 0,
                  recommendWeightCount: 8,
                  commentCount: 0,
                  shareCount: 0,
                  upVote: 0,
                  downVote: 0,
                  prop: '',
                  gold: 0,
                },
                {
                  docId: 'IFJC7VC50552ZF94',
                  skipId: null,
                  title: '分享：我的iPhone 15 Pro Max使用FineWoven手机壳艰难的一周',
                  date: '2023-11-26',
                  pvWeightCount: 0,
                  recommendWeightCount: 16,
                  commentCount: 0,
                  shareCount: 0,
                  upVote: 0,
                  downVote: 0,
                  prop: '',
                  gold: 0,
                },
                {
                  docId: 'IFJC7VC50552ZF94',
                  skipId: null,
                  title: '分享：我的iPhone 15 Pro Max使用FineWoven手机壳艰难的一周',
                  date: '2023-11-25',
                  pvWeightCount: 16,
                  recommendWeightCount: 91,
                  commentCount: 0,
                  shareCount: 0,
                  upVote: 0,
                  downVote: 0,
                  prop: '{}',
                  gold: 0,
                },
                {
                  docId: 'IFJC7VC50552ZF94',
                  skipId: null,
                  title: '分享：我的iPhone 15 Pro Max使用FineWoven手机壳艰难的一周',
                  date: '2023-11-24',
                  pvWeightCount: 0,
                  recommendWeightCount: 16,
                  commentCount: 0,
                  shareCount: 0,
                  upVote: 0,
                  downVote: 0,
                  prop: '',
                  gold: 0,
                },
              ],
            }),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const result = await getSingleDataOverviewAsync('success', '', '', '', '', '', 0);
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(1);
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('获取网易号内容分析', async () => {
    const cookie =
      '_ga=GA1.1.1472123012.1696830052; _ga_Z0JVTF6WF2=GS1.1.1696830052.1.0.1696831780.0.0.0; NTES_CMT_USER_INFO=259919543%7C%E8%81%AA%E6%98%8E%E7%9A%84%E4%BF%AE%E9%9A%90%E5%B0%8F%E6%98%93%7Chttp%3A%2F%2Fdingyue.ws.126.net%2F2023%2F0822%2Fe163703ej00rzrth40004d0004g004gp.jpg%7Cfalse%7CeWQuNjkyYTM1N2U0YzFhNGI1ZjhAMTYzLmNvbQ%3D%3D; __snaker__id=nGsUsN5PUMLXp60K; gdxidpyhxdE=dS%2B%5CNm0ZkYlrr2zCbLVEj5fQHs3Zye%2FJwY3l5xHXn%2FCyxYdKVHO0rZiwEilk%2BNGDw%5CzMdLvODSTsWtodG%5Cwl%5C02u6rqNE1c%5Cq%5C3969dKmLI%2FhYjm3hNT%2BHgu98JG7oS6pISOOnv0OxGGhCGcfoUOqDJWP40DQqoupjwNbKTZ6S5CXMD7%3A1700806638277; _ntes_origin_from=; _ntes_nuid=a39383c59440f95cfe5ef0a0e41c76ef; _antanalysis_s_id=1701396519807; NTES_YD_SESS=OZxPErZQN4dZwtXw1orLEJDoGM33Dg5j5Q90uGZ7I9GTa7s5atXR4ybC3M8VzqnDQ6RUrWzPIOlkegBBZQvjY1K4ODaJWifnRZsnHM2kDfUyN51.IxYX3ok51mq1A5VkrbbViUVcc3z6bufliSGikdxrBcio94hk1bosuN9K1gVtbvR.smT4a4QuIHfYsEFlWFRVEyfyhSPt0HqLhYXFtl9xqKGgrerCHBqCK4PRpRFFn; S_INFO=1701396554|0|0&60##|18874070066; P_INFO=18874070066|1701396554|1|subscribe|00&99|null&null&null#hun&null#10#0|&0|null|18874070066; NTESwebSI=9F29B520EF872522E7AD470A174F5B0A';

    const result = await getDataOverviewAsync(
      cookie,
      'yd.692a357e4c1a4b5f8%40163.com',
      'W2905703798683225716',
      '2023-10-30',
      '2023-10-31',
    );
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(1);
  }, 10000000);

  test('获取网易号内容头部统计', async () => {
    const cookie =
      '_ga=GA1.1.1472123012.1696830052; _ga_Z0JVTF6WF2=GS1.1.1696830052.1.0.1696831780.0.0.0; NTES_CMT_USER_INFO=259919543%7C%E8%81%AA%E6%98%8E%E7%9A%84%E4%BF%AE%E9%9A%90%E5%B0%8F%E6%98%93%7Chttp%3A%2F%2Fdingyue.ws.126.net%2F2023%2F0822%2Fe163703ej00rzrth40004d0004g004gp.jpg%7Cfalse%7CeWQuNjkyYTM1N2U0YzFhNGI1ZjhAMTYzLmNvbQ%3D%3D; __snaker__id=nGsUsN5PUMLXp60K; gdxidpyhxdE=dS%2B%5CNm0ZkYlrr2zCbLVEj5fQHs3Zye%2FJwY3l5xHXn%2FCyxYdKVHO0rZiwEilk%2BNGDw%5CzMdLvODSTsWtodG%5Cwl%5C02u6rqNE1c%5Cq%5C3969dKmLI%2FhYjm3hNT%2BHgu98JG7oS6pISOOnv0OxGGhCGcfoUOqDJWP40DQqoupjwNbKTZ6S5CXMD7%3A1700806638277; _ntes_origin_from=; _ntes_nuid=a39383c59440f95cfe5ef0a0e41c76ef; _antanalysis_s_id=1701396519807; NTES_YD_SESS=OZxPErZQN4dZwtXw1orLEJDoGM33Dg5j5Q90uGZ7I9GTa7s5atXR4ybC3M8VzqnDQ6RUrWzPIOlkegBBZQvjY1K4ODaJWifnRZsnHM2kDfUyN51.IxYX3ok51mq1A5VkrbbViUVcc3z6bufliSGikdxrBcio94hk1bosuN9K1gVtbvR.smT4a4QuIHfYsEFlWFRVEyfyhSPt0HqLhYXFtl9xqKGgrerCHBqCK4PRpRFFn; S_INFO=1701396554|0|0&60##|18874070066; P_INFO=18874070066|1701396554|1|subscribe|00&99|null&null&null#hun&null#10#0|&0|null|18874070066; NTESwebSI=9F29B520EF872522E7AD470A174F5B0A';

    const result = await getDataOverviewStatisticAsync(
      cookie,
      'yd.692a357e4c1a4b5f8%40163.com',
      'W2905703798683225716',
    );
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(1);
  }, 10000000);

  test('获取网易号收益分析', async () => {
    const cookie =
      '_ga=GA1.1.1472123012.1696830052; _ga_Z0JVTF6WF2=GS1.1.1696830052.1.0.1696831780.0.0.0; NTES_CMT_USER_INFO=259919543%7C%E8%81%AA%E6%98%8E%E7%9A%84%E4%BF%AE%E9%9A%90%E5%B0%8F%E6%98%93%7Chttp%3A%2F%2Fdingyue.ws.126.net%2F2023%2F0822%2Fe163703ej00rzrth40004d0004g004gp.jpg%7Cfalse%7CeWQuNjkyYTM1N2U0YzFhNGI1ZjhAMTYzLmNvbQ%3D%3D; __snaker__id=nGsUsN5PUMLXp60K; gdxidpyhxdE=dS%2B%5CNm0ZkYlrr2zCbLVEj5fQHs3Zye%2FJwY3l5xHXn%2FCyxYdKVHO0rZiwEilk%2BNGDw%5CzMdLvODSTsWtodG%5Cwl%5C02u6rqNE1c%5Cq%5C3969dKmLI%2FhYjm3hNT%2BHgu98JG7oS6pISOOnv0OxGGhCGcfoUOqDJWP40DQqoupjwNbKTZ6S5CXMD7%3A1700806638277; _ntes_origin_from=; _ntes_nuid=a39383c59440f95cfe5ef0a0e41c76ef; _antanalysis_s_id=1701396519807; NTES_YD_SESS=OZxPErZQN4dZwtXw1orLEJDoGM33Dg5j5Q90uGZ7I9GTa7s5atXR4ybC3M8VzqnDQ6RUrWzPIOlkegBBZQvjY1K4ODaJWifnRZsnHM2kDfUyN51.IxYX3ok51mq1A5VkrbbViUVcc3z6bufliSGikdxrBcio94hk1bosuN9K1gVtbvR.smT4a4QuIHfYsEFlWFRVEyfyhSPt0HqLhYXFtl9xqKGgrerCHBqCK4PRpRFFn; S_INFO=1701396554|0|0&60##|18874070066; P_INFO=18874070066|1701396554|1|subscribe|00&99|null&null&null#hun&null#10#0|&0|null|18874070066; NTESwebSI=9F29B520EF872522E7AD470A174F5B0A';

    const result = await getDataOverviewIncomeAsync(
      cookie,
      'yd.692a357e4c1a4b5f8%40163.com',
      'W2905703798683225716',
      '2023-10-30',
      '2023-10-31',
    );
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(1);
  }, 10000000);

  test('获取网易号收益头部统计数据', async () => {
    const cookie =
      '_ga=GA1.1.1472123012.1696830052; _ga_Z0JVTF6WF2=GS1.1.1696830052.1.0.1696831780.0.0.0; NTES_CMT_USER_INFO=259919543%7C%E8%81%AA%E6%98%8E%E7%9A%84%E4%BF%AE%E9%9A%90%E5%B0%8F%E6%98%93%7Chttp%3A%2F%2Fdingyue.ws.126.net%2F2023%2F0822%2Fe163703ej00rzrth40004d0004g004gp.jpg%7Cfalse%7CeWQuNjkyYTM1N2U0YzFhNGI1ZjhAMTYzLmNvbQ%3D%3D; __snaker__id=nGsUsN5PUMLXp60K; gdxidpyhxdE=dS%2B%5CNm0ZkYlrr2zCbLVEj5fQHs3Zye%2FJwY3l5xHXn%2FCyxYdKVHO0rZiwEilk%2BNGDw%5CzMdLvODSTsWtodG%5Cwl%5C02u6rqNE1c%5Cq%5C3969dKmLI%2FhYjm3hNT%2BHgu98JG7oS6pISOOnv0OxGGhCGcfoUOqDJWP40DQqoupjwNbKTZ6S5CXMD7%3A1700806638277; _ntes_origin_from=; _ntes_nuid=a39383c59440f95cfe5ef0a0e41c76ef; _antanalysis_s_id=1701396519807; NTES_YD_SESS=OZxPErZQN4dZwtXw1orLEJDoGM33Dg5j5Q90uGZ7I9GTa7s5atXR4ybC3M8VzqnDQ6RUrWzPIOlkegBBZQvjY1K4ODaJWifnRZsnHM2kDfUyN51.IxYX3ok51mq1A5VkrbbViUVcc3z6bufliSGikdxrBcio94hk1bosuN9K1gVtbvR.smT4a4QuIHfYsEFlWFRVEyfyhSPt0HqLhYXFtl9xqKGgrerCHBqCK4PRpRFFn; S_INFO=1701396554|0|0&60##|18874070066; P_INFO=18874070066|1701396554|1|subscribe|00&99|null&null&null#hun&null#10#0|&0|null|18874070066; NTESwebSI=9F29B520EF872522E7AD470A174F5B0A';

    const result = await getDataOverviewIncomeStatisticAsync(
      cookie,
      'yd.692a357e4c1a4b5f8%40163.com',
      'W2905703798683225716',
    );
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(1);
  }, 10000000);

  test('获取网易号粉丝分析', async () => {
    const cookie =
      '_ga=GA1.1.1472123012.1696830052; _ga_Z0JVTF6WF2=GS1.1.1696830052.1.0.1696831780.0.0.0; NTES_CMT_USER_INFO=259919543%7C%E8%81%AA%E6%98%8E%E7%9A%84%E4%BF%AE%E9%9A%90%E5%B0%8F%E6%98%93%7Chttp%3A%2F%2Fdingyue.ws.126.net%2F2023%2F0822%2Fe163703ej00rzrth40004d0004g004gp.jpg%7Cfalse%7CeWQuNjkyYTM1N2U0YzFhNGI1ZjhAMTYzLmNvbQ%3D%3D; __snaker__id=nGsUsN5PUMLXp60K; gdxidpyhxdE=dS%2B%5CNm0ZkYlrr2zCbLVEj5fQHs3Zye%2FJwY3l5xHXn%2FCyxYdKVHO0rZiwEilk%2BNGDw%5CzMdLvODSTsWtodG%5Cwl%5C02u6rqNE1c%5Cq%5C3969dKmLI%2FhYjm3hNT%2BHgu98JG7oS6pISOOnv0OxGGhCGcfoUOqDJWP40DQqoupjwNbKTZ6S5CXMD7%3A1700806638277; _ntes_origin_from=; _ntes_nuid=a39383c59440f95cfe5ef0a0e41c76ef; _antanalysis_s_id=1701396519807; NTES_YD_SESS=OZxPErZQN4dZwtXw1orLEJDoGM33Dg5j5Q90uGZ7I9GTa7s5atXR4ybC3M8VzqnDQ6RUrWzPIOlkegBBZQvjY1K4ODaJWifnRZsnHM2kDfUyN51.IxYX3ok51mq1A5VkrbbViUVcc3z6bufliSGikdxrBcio94hk1bosuN9K1gVtbvR.smT4a4QuIHfYsEFlWFRVEyfyhSPt0HqLhYXFtl9xqKGgrerCHBqCK4PRpRFFn; S_INFO=1701396554|0|0&60##|18874070066; P_INFO=18874070066|1701396554|1|subscribe|00&99|null&null&null#hun&null#10#0|&0|null|18874070066; NTESwebSI=9F29B520EF872522E7AD470A174F5B0A';

    const result = await getDataOverviewFansAsync(
      cookie,
      'yd.692a357e4c1a4b5f8%40163.com',
      'W2905703798683225716',
      '2023-10-30',
      '2023-10-31',
    );
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(1);
  }, 10000000);

  test('获取网易号粉丝头部数据', async () => {
    const cookie =
      '_ga=GA1.1.1472123012.1696830052; _ga_Z0JVTF6WF2=GS1.1.1696830052.1.0.1696831780.0.0.0; NTES_CMT_USER_INFO=259919543%7C%E8%81%AA%E6%98%8E%E7%9A%84%E4%BF%AE%E9%9A%90%E5%B0%8F%E6%98%93%7Chttp%3A%2F%2Fdingyue.ws.126.net%2F2023%2F0822%2Fe163703ej00rzrth40004d0004g004gp.jpg%7Cfalse%7CeWQuNjkyYTM1N2U0YzFhNGI1ZjhAMTYzLmNvbQ%3D%3D; __snaker__id=nGsUsN5PUMLXp60K; gdxidpyhxdE=dS%2B%5CNm0ZkYlrr2zCbLVEj5fQHs3Zye%2FJwY3l5xHXn%2FCyxYdKVHO0rZiwEilk%2BNGDw%5CzMdLvODSTsWtodG%5Cwl%5C02u6rqNE1c%5Cq%5C3969dKmLI%2FhYjm3hNT%2BHgu98JG7oS6pISOOnv0OxGGhCGcfoUOqDJWP40DQqoupjwNbKTZ6S5CXMD7%3A1700806638277; _ntes_origin_from=; _ntes_nuid=a39383c59440f95cfe5ef0a0e41c76ef; _antanalysis_s_id=1701396519807; NTES_YD_SESS=OZxPErZQN4dZwtXw1orLEJDoGM33Dg5j5Q90uGZ7I9GTa7s5atXR4ybC3M8VzqnDQ6RUrWzPIOlkegBBZQvjY1K4ODaJWifnRZsnHM2kDfUyN51.IxYX3ok51mq1A5VkrbbViUVcc3z6bufliSGikdxrBcio94hk1bosuN9K1gVtbvR.smT4a4QuIHfYsEFlWFRVEyfyhSPt0HqLhYXFtl9xqKGgrerCHBqCK4PRpRFFn; S_INFO=1701396554|0|0&60##|18874070066; P_INFO=18874070066|1701396554|1|subscribe|00&99|null&null&null#hun&null#10#0|&0|null|18874070066; NTESwebSI=9F29B520EF872522E7AD470A174F5B0A';

    const result = await getDataOverviewFansStatisticAsync(
      cookie,
      'yd.692a357e4c1a4b5f8%40163.com',
      'W2905703798683225716',
    );
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(1);
  }, 10000000);

  test('获取网易号单篇统计数据', async () => {
    const cookie =
      '_ga=GA1.1.1472123012.1696830052; _ga_Z0JVTF6WF2=GS1.1.1696830052.1.0.1696831780.0.0.0; NTES_CMT_USER_INFO=259919543%7C%E8%81%AA%E6%98%8E%E7%9A%84%E4%BF%AE%E9%9A%90%E5%B0%8F%E6%98%93%7Chttp%3A%2F%2Fdingyue.ws.126.net%2F2023%2F0822%2Fe163703ej00rzrth40004d0004g004gp.jpg%7Cfalse%7CeWQuNjkyYTM1N2U0YzFhNGI1ZjhAMTYzLmNvbQ%3D%3D; __snaker__id=nGsUsN5PUMLXp60K; gdxidpyhxdE=dS%2B%5CNm0ZkYlrr2zCbLVEj5fQHs3Zye%2FJwY3l5xHXn%2FCyxYdKVHO0rZiwEilk%2BNGDw%5CzMdLvODSTsWtodG%5Cwl%5C02u6rqNE1c%5Cq%5C3969dKmLI%2FhYjm3hNT%2BHgu98JG7oS6pISOOnv0OxGGhCGcfoUOqDJWP40DQqoupjwNbKTZ6S5CXMD7%3A1700806638277; _ntes_origin_from=; _ntes_nuid=a39383c59440f95cfe5ef0a0e41c76ef; _antanalysis_s_id=1701396519807; NTES_YD_SESS=OZxPErZQN4dZwtXw1orLEJDoGM33Dg5j5Q90uGZ7I9GTa7s5atXR4ybC3M8VzqnDQ6RUrWzPIOlkegBBZQvjY1K4ODaJWifnRZsnHM2kDfUyN51.IxYX3ok51mq1A5VkrbbViUVcc3z6bufliSGikdxrBcio94hk1bosuN9K1gVtbvR.smT4a4QuIHfYsEFlWFRVEyfyhSPt0HqLhYXFtl9xqKGgrerCHBqCK4PRpRFFn; S_INFO=1701396554|0|0&60##|18874070066; P_INFO=18874070066|1701396554|1|subscribe|00&99|null&null&null#hun&null#10#0|&0|null|18874070066; NTESwebSI=9F29B520EF872522E7AD470A174F5B0A';

    const result = await getSingleDataOverviewStatisticAsync(
      cookie,
      'HAIVMAGQ0552ZF94',
      'yd.692a357e4c1a4b5f8%40163.com',
      'W2905703798683225716',
    );
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(1);
  }, 10000000);

  test('获取网易号单篇报表数据', async () => {
    const cookie =
      '_ga=GA1.1.1472123012.1696830052; _ga_Z0JVTF6WF2=GS1.1.1696830052.1.0.1696831780.0.0.0; NTES_CMT_USER_INFO=259919543%7C%E8%81%AA%E6%98%8E%E7%9A%84%E4%BF%AE%E9%9A%90%E5%B0%8F%E6%98%93%7Chttp%3A%2F%2Fdingyue.ws.126.net%2F2023%2F0822%2Fe163703ej00rzrth40004d0004g004gp.jpg%7Cfalse%7CeWQuNjkyYTM1N2U0YzFhNGI1ZjhAMTYzLmNvbQ%3D%3D; __snaker__id=nGsUsN5PUMLXp60K; gdxidpyhxdE=dS%2B%5CNm0ZkYlrr2zCbLVEj5fQHs3Zye%2FJwY3l5xHXn%2FCyxYdKVHO0rZiwEilk%2BNGDw%5CzMdLvODSTsWtodG%5Cwl%5C02u6rqNE1c%5Cq%5C3969dKmLI%2FhYjm3hNT%2BHgu98JG7oS6pISOOnv0OxGGhCGcfoUOqDJWP40DQqoupjwNbKTZ6S5CXMD7%3A1700806638277; _ntes_origin_from=; _ntes_nuid=a39383c59440f95cfe5ef0a0e41c76ef; _antanalysis_s_id=1701396519807; NTES_YD_SESS=OZxPErZQN4dZwtXw1orLEJDoGM33Dg5j5Q90uGZ7I9GTa7s5atXR4ybC3M8VzqnDQ6RUrWzPIOlkegBBZQvjY1K4ODaJWifnRZsnHM2kDfUyN51.IxYX3ok51mq1A5VkrbbViUVcc3z6bufliSGikdxrBcio94hk1bosuN9K1gVtbvR.smT4a4QuIHfYsEFlWFRVEyfyhSPt0HqLhYXFtl9xqKGgrerCHBqCK4PRpRFFn; S_INFO=1701396554|0|0&60##|18874070066; P_INFO=18874070066|1701396554|1|subscribe|00&99|null&null&null#hun&null#10#0|&0|null|18874070066; NTESwebSI=9F29B520EF872522E7AD470A174F5B0A';

    const result = await getSingleDataOverviewAsync(
      cookie,
      'IFJC7VC50552ZF94',
      'yd.692a357e4c1a4b5f8%40163.com',
      'W2905703798683225716',
      '2023-11-24',
      '2023-11-30',
      0,
    );
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(1);
  }, 10000000);
});
