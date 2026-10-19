import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import {
  getArticleInteractTrendAsync,
  getArticleReadTrendAsync,
  getSingleArticleInteractAsync,
  getSingleArticleReadTrendAsync,
  getSingleVideoInteractAsync,
  getSingleVideoPlayTrendAsync,
  getVideoInteractTrendAsync,
  getVideoPlayTrendAsync,
} from '@/media-platform/xinlangweibo/xinlangweibo-data-overview.service';
import fs from 'fs';
import path from 'path';
import { getXinlangweiboWeiboReadTrend } from '../../../src/media-platform/xinlangweibo/xinlangweibo-common';

export const getCookie = (fileName: string = 'cookie.txt'): string => {
  return fs.readFileSync(path.resolve(__dirname, fileName), { encoding: 'utf8' }).trim();
};

describe('【Mock】', () => {
  describe('获取新浪微博视频播放报表数据', () => {
    const server = setupServer(
      rest.get('https://dss.sc.weibo.com*/pc/aj/chart/video/videoPlayTrend', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 100000,
              msg: '操作成功',
              data: {
                chart: {
                  videoPlayTrend: {
                    starttime: '2024-01-27',
                    videoCountTrend: [
                      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0,
                    ],
                    videoCountTotal: 1,
                    videoPlayTrend: [
                      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 0, 0, 0, 0,
                    ],
                    videoPlayTotal: 7,
                  },
                },
                param: {
                  followers_count: 12,
                  starttime: '2024-01-27',
                  endtime: '2024-02-25',
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
        const result = await getVideoPlayTrendAsync('success', '', '');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(100000);
      });
    });
  });

  describe('获取新浪微博视频转发评论赞报表', () => {
    const server = setupServer(
      rest.get('https://dss.sc.weibo.com*/pc/aj/chart/video/videoInteract', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 100000,
              msg: '操作成功',
              data: {
                chart: {
                  videoInteract: {
                    starttime: '2024-01-27',
                    repostTrend: [
                      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    ],
                    repostTotal: 0,
                    commentTrend: [
                      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    ],
                    commentTotal: 0,
                    likeTrend: [
                      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    ],
                    likeTotal: 0,
                    interTrend: [
                      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    ],
                    interTotal: 0,
                  },
                },
                param: {
                  followers_count: 12,
                  starttime: '2024-01-27',
                  endtime: '2024-02-25',
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
        const result = await getVideoInteractTrendAsync('success', '', '');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(100000);
      });
    });
  });

  describe('获取新浪微博视频单篇浏览数', () => {
    const server = setupServer(
      rest.get('https://dss.sc.weibo.com*/pc/aj/chart/video/singleVideoPlayTrend', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 100000,
              msg: '操作成功',
              data: {
                chart: {
                  singleVideoPlayTrend: {
                    starttime: '2024-02-21',
                    playTrend: [7, 0, 0, 0, 0, 0, 1],
                    playPeopleTrend: [1, 0, 0, 0, 0, 0, 1],
                    playTotal: 8,
                    playPeopleTotal: 2,
                  },
                },
                param: {
                  followers_count: 12,
                  mid: '5003805047917196',
                  oid: '1034:5003804710731826',
                  starttime: '2024-02-21',
                  endtime: '2024-02-27',
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
        const result = await getSingleVideoPlayTrendAsync('success', '', '');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(100000);
      });
    });
  });

  describe('获取新浪微博视频单篇转发评论赞', () => {
    const server = setupServer(
      rest.get('https://dss.sc.weibo.com*/pc/aj/chart/video/singleVideoInter', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 100000,
              msg: '操作成功',
              data: {
                chart: {
                  singleVideoInter: {
                    starttime: '2024-02-21',
                    repostTrend: [0, 0, 0, 0, 0, 0, 0],
                    repostTotal: 0,
                    commentTrend: [0, 0, 0, 0, 0, 0, 0],
                    commentTotal: 0,
                    likeTrend: [0, 0, 0, 0, 0, 0, 0],
                    likeTotal: 0,
                  },
                },
                param: {
                  followers_count: 12,
                  mid: '5003805047917196',
                  oid: '1034:5003804710731826',
                  starttime: '2024-02-21',
                  endtime: '2024-02-27',
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
        const result = await getSingleVideoInteractAsync('success', '', '');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(100000);
      });
    });
  });

  describe('获取新浪微博图文播放报表数据', () => {
    const server = setupServer(
      rest.get('https://dss.sc.weibo.com*/pc/aj/chart/article/articleReadTrend', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 100000,
              msg: '操作成功',
              data: {
                chart: {
                  articleReadTrend: {
                    starttime: '2024-02-23',
                    articleReadTrend: [573, 81, 41],
                    articleReadTotal: 695,
                    articleSendTrend: [0, 0, 0],
                    articleSendTotal: 0,
                  },
                },
                param: {
                  followers_count: 12,
                  starttime: '2024-01-27',
                  endtime: '2024-02-25',
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
        const result = await getArticleReadTrendAsync('success', '', '');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(100000);
      });
    });
  });

  describe('获取新浪微博图文转发评论赞报表', () => {
    const server = setupServer(
      rest.get('https://dss.sc.weibo.com*/pc/aj/chart/article/articleInteractTrend', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 100000,
              msg: '操作成功',
              data: {
                chart: {
                  articleInteractTrend: {
                    starttime: '2024-01-27',
                    repostTrend: [
                      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    ],
                    repostTotal: 0,
                    commentTrend: [
                      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    ],
                    commentTotal: 0,
                    likeTrend: [
                      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    ],
                    likeTotal: 0,
                    interTrend: [
                      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                    ],
                    interTotal: 0,
                  },
                },
                param: {
                  followers_count: 12,
                  starttime: '2024-01-27',
                  endtime: '2024-02-25',
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
        const result = await getArticleInteractTrendAsync('success', '', '');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(100000);
      });
    });
  });

  describe('获取新浪微博图文单篇浏览数', () => {
    const server = setupServer(
      rest.get('https://dss.sc.weibo.com*/pc/aj/chart/article/singleArticleReadTrend', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 100000,
              msg: '操作成功',
              data: {
                chart: {
                  singleArticleReadTrend: {
                    starttime: '2024-02-22',
                    readTrend: [73, 573, 81, 41, 25, 8],
                    readTotal: 801,
                    readPeopleTrend: [3, 15, 1, 1, 1, 2],
                    readPeopleTotal: 23,
                    averageRead: 134,
                  },
                },
                param: {
                  followers_count: 12,
                  mid: '5004223778131497',
                  oid: '2309405004223778521161',
                  starttime: '2024-02-21',
                  endtime: '2024-02-27',
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
        const result = await getSingleArticleReadTrendAsync('success', '', '');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(100000);
      });
    });
  });

  describe('获取新浪微博图文单篇转发评论赞', () => {
    const server = setupServer(
      rest.get('https://dss.sc.weibo.com*/pc/aj/chart/article/singleArticleInter', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 100000,
              msg: '操作成功',
              data: {
                chart: {
                  singleArticleInter: {
                    starttime: '2024-02-22',
                    repostTrend: [0, 0, 0, 0, 0, 0],
                    repostTotal: 0,
                    commentTrend: [0, 0, 0, 0, 0, 0],
                    commentTotal: 0,
                    likeTrend: [0, 0, 0, 0, 0, 0],
                    likeTotal: 0,
                  },
                },
                param: {
                  followers_count: 12,
                  mid: '5004223778131497',
                  starttime: '2024-02-21',
                  endtime: '2024-02-27',
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
        const result = await getSingleArticleInteractAsync('success', '');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(100000);
      });
    });
  });
});

describe.runIf(true)('【真实测试】', () => {
  test('获取新浪微博视频播放报表数据', async () => {
    const cookie = getCookie();

    const result = await getVideoPlayTrendAsync(cookie, '2024-10-01', '2024-10-29');
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(100000);
  }, 10000000);

  test('获取新浪微博视频转发评论赞报表', async () => {
    const cookie = getCookie();

    const result = await getVideoInteractTrendAsync(cookie, '2024-10-01', '2024-10-29');
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(100000);
  }, 10000000);

  test('获取新浪微博视频单篇浏览数', async () => {
    const cookie = getCookie();

    const result = await getSingleVideoPlayTrendAsync(cookie, '5003805047917196', '1034:5003804710731826');
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(100000);
  }, 10000000);

  test('获取新浪微博视频单篇转发评论赞', async () => {
    const cookie = getCookie();

    const result = await getSingleVideoInteractAsync(cookie, '5003805047917196', '1034:5003804710731826');
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(100000);
  }, 10000000);

  test('获取新浪微博图文播放报表数据', async () => {
    const cookie = getCookie();

    const result = await getArticleReadTrendAsync(cookie, '2024-10-22', '2024-11-21');
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(100000);
  }, 10000000);

  test('获取新浪微博图文转发评论赞报表', async () => {
    const cookie = getCookie();

    const result = await getArticleInteractTrendAsync(cookie, '2024-10-01', '2024-10-29');
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(100000);
  }, 10000000);

  test('获取新浪微博图文单篇浏览数', async () => {
    const cookie = getCookie();

    const result = await getSingleArticleReadTrendAsync(cookie, '5004223778131497', '2309405004223778521161');
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(100000);
  }, 10000000);

  test('获取新浪微博图文单篇转发评论赞', async () => {
    const cookie = getCookie();

    const result = await getSingleArticleInteractAsync(cookie, '5004223778131497');
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(100000);
  }, 10000000);
  test('获取新浪微博博文阅读报表数据', async () => {
    const cookie = getCookie();

    const result = await getXinlangweiboWeiboReadTrend(cookie, new Date('2024-10-22'), new Date('2024-11-21'));
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(100000);
  }, 10000000);
});
