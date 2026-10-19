import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import {
  getDataOverviewAsync,
  getDataOverviewFansAsync,
} from '@/media-platform/haokanshipin/haokanshipin-data-overview.service';

describe('【Mock】', () => {
  describe('获取好看视频整体数据', () => {
    const server = setupServer(
      rest.get('https://dream.haokan.com*/creator/pccontentlist', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              timestamp: 1698212661,
              logid: '2661009267',
              status: 0,
              msg: '',
              data: {
                trendInfo: [
                  [
                    '09/25',
                    '09/26',
                    '09/27',
                    '09/28',
                    '09/29',
                    '09/30',
                    '10/01',
                    '10/02',
                    '10/03',
                    '10/04',
                    '10/05',
                    '10/06',
                    '10/07',
                    '10/08',
                    '10/09',
                    '10/10',
                    '10/11',
                    '10/12',
                    '10/13',
                    '10/14',
                    '10/15',
                    '10/16',
                    '10/17',
                    '10/18',
                    '10/19',
                    '10/20',
                    '10/21',
                    '10/22',
                    '10/23',
                    '10/24',
                  ],
                  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 2, 1, 0, 1, 0, 1, 2],
                ],
                allTrendInfo: {
                  date: [
                    '09/25',
                    '09/26',
                    '09/27',
                    '09/28',
                    '09/29',
                    '09/30',
                    '10/01',
                    '10/02',
                    '10/03',
                    '10/04',
                    '10/05',
                    '10/06',
                    '10/07',
                    '10/08',
                    '10/09',
                    '10/10',
                    '10/11',
                    '10/12',
                    '10/13',
                    '10/14',
                    '10/15',
                    '10/16',
                    '10/17',
                    '10/18',
                    '10/19',
                    '10/20',
                    '10/21',
                    '10/22',
                    '10/23',
                    '10/24',
                  ],
                  data: [
                    {
                      name: '推荐量',
                      data: [0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 2, 1, 0, 1, 0, 1, 1],
                    },
                    {
                      name: '播放量',
                      data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 2, 1, 0, 1, 0, 1, 2],
                    },
                    {
                      name: '播放完成率',
                      data: [
                        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 28, 0, 0, 0, 0, 0, 7, 0, 3, 17, 0, 64, 0, 32, 19,
                      ],
                    },
                    {
                      name: '评论量',
                      data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    },
                    {
                      name: '点赞量',
                      data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    },
                    {
                      name: '收藏量',
                      data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    },
                    {
                      name: '分享量',
                      data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    },
                  ],
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
        const result = await getDataOverviewAsync('success', 1, 1);
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.status).toBe(0);
      });
    });
  });

  describe('获取好看视频粉丝分析', () => {
    const server = setupServer(
      rest.get('https://dream.haokan.com*/creator/pcfansdetail', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              timestamp: 1698214380,
              logid: '0780572553',
              status: 0,
              msg: '',
              data: {
                trendInfo: [
                  [
                    '09/26',
                    '09/27',
                    '09/28',
                    '09/29',
                    '09/30',
                    '10/01',
                    '10/02',
                    '10/03',
                    '10/04',
                    '10/05',
                    '10/06',
                    '10/07',
                    '10/08',
                    '10/09',
                    '10/10',
                    '10/11',
                    '10/12',
                    '10/13',
                    '10/14',
                    '10/15',
                    '10/16',
                    '10/17',
                    '10/18',
                    '10/19',
                    '10/20',
                    '10/21',
                    '10/22',
                    '10/23',
                    '10/24',
                  ],
                  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                ],
                allTrendInfo: {
                  date: [
                    '09/26',
                    '09/27',
                    '09/28',
                    '09/29',
                    '09/30',
                    '10/01',
                    '10/02',
                    '10/03',
                    '10/04',
                    '10/05',
                    '10/06',
                    '10/07',
                    '10/08',
                    '10/09',
                    '10/10',
                    '10/11',
                    '10/12',
                    '10/13',
                    '10/14',
                    '10/15',
                    '10/16',
                    '10/17',
                    '10/18',
                    '10/19',
                    '10/20',
                    '10/21',
                    '10/22',
                    '10/23',
                    '10/24',
                  ],
                  data: [
                    {
                      name: '新增粉丝',
                      data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    },
                    {
                      name: '取消关注',
                      data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    },
                    {
                      name: '净增粉丝',
                      data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    },
                    {
                      name: '粉丝总数',
                      data: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
                    },
                  ],
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
        const result = await getDataOverviewFansAsync('success', 1, 1);
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.status).toBe(0);
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('获取好看视频整体数据', async () => {
    const cookie =
      'BDUSS=AwekU1MGpscXNtWFVKU0FNbGlGNE9YU2JkaXhwV1Etc1o0QWNiUlA5N3FFbUJsSVFBQUFBJCQAAAAAAAAAAAEAAAB0BbF8ueLXxcaoucm1xL3F0b4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOqFOGXqhThlRj; RT="z=1&dm=haokan.com&si=59e322b7-ce63-4392-b07d-d2481cfa24c2&ss=lo569q57&sl=c&tt=7ys&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf&ld=d6y7&nu=3ozua3c&cl=5zkq"';

    const result = await getDataOverviewAsync(cookie, 1695620274, 1698163199);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.status).toBe(0);
  }, 10000000);

  test('获取好看视频粉丝分析', async () => {
    const cookie =
      'BDUSS=AwekU1MGpscXNtWFVKU0FNbGlGNE9YU2JkaXhwV1Etc1o0QWNiUlA5N3FFbUJsSVFBQUFBJCQAAAAAAAAAAAEAAAB0BbF8ueLXxcaoucm1xL3F0b4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOqFOGXqhThlRj; RT="z=1&dm=haokan.com&si=59e322b7-ce63-4392-b07d-d2481cfa24c2&ss=lo569q57&sl=c&tt=7ys&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf&ld=d6y7&nu=3ozua3c&cl=5zkq"';

    const result = await getDataOverviewFansAsync(cookie, 1695620274, 1698163199);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.status).toBe(0);
  }, 10000000);
});
