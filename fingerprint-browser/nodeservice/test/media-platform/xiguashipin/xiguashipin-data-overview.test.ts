import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import {
  getDataOverviewStatisticAsync,
  getDataOverviewAsync,
  getIncomeAsync,
} from '@/media-platform/xiguashipin/xiguashipin-data-overview.service';

describe('【Mock】', () => {
  describe('获取西瓜视频数据中心顶部数据', () => {
    const server = setupServer(
      rest.get('https://studio.ixigua.com*/api/data/overview_data_v3', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              status: 0,
              data: {
                isShowLoyal: false,
                isNewLoyal: false,
                overviewList: [
                  {
                    MeetCondition: true,
                    TotalCount: 10085,
                    FansCount: 102,
                    DataType: 1,
                    TotalCountText: '播放量',
                    LatestUpdateDateTotal: '2023-10-23',
                    FansCountText: '粉丝播放量',
                    LatestUpdateDateFans: '2023-10-23',
                  },
                  {
                    MeetCondition: true,
                    TotalCount: 14,
                    FansCount: 0,
                    DataType: 3,
                    TotalCountText: '评论量',
                    LatestUpdateDateTotal: '2023-10-23',
                    FansCountText: '粉丝评论量',
                    LatestUpdateDateFans: '2023-10-23',
                  },
                  {
                    MeetCondition: true,
                    TotalCount: 55,
                    DataType: 6,
                    TotalCountText: '粉丝量',
                    LatestUpdateDateTotal: '2023-10-23',
                  },
                  {
                    MeetCondition: true,
                    TotalCount: 0,
                    DataType: 13,
                    TotalCountText: '视频创作收益/元',
                    LatestUpdateDateTotal: '2023-10-23',
                  },
                ],
              },
              message: 'SUCCESS',
            }),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const result = await getDataOverviewStatisticAsync('success', 0, 0, '', '');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.status).toBe(0);
      });
    });
  });

  describe('获取西瓜视频数据中心报表数据', () => {
    const server = setupServer(
      rest.get('https://studio.ixigua.com*/api/data/data_trend_v2', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              data: {
                AccountCreateTime: 1548727290,
                IsShowLoyal: false,
                IsNewLoyal: false,
                CreatorDataTrends: [
                  {
                    TimeType: 0,
                    MeetCondition: true,
                    DataType: 14,
                    Details: [
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1700,
                        DataTime: 1695571200,
                        DataType: 14,
                        TotalCountText: '新增粉丝',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1701,
                        DataTime: 1695657600,
                        DataType: 14,
                        TotalCountText: '新增粉丝',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1702,
                        DataTime: 1695744000,
                        DataType: 14,
                        TotalCountText: '新增粉丝',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1703,
                        DataTime: 1695830400,
                        DataType: 14,
                        TotalCountText: '新增粉丝',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1704,
                        DataTime: 1695916800,
                        DataType: 14,
                        TotalCountText: '新增粉丝',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1705,
                        DataTime: 1696003200,
                        DataType: 14,
                        TotalCountText: '新增粉丝',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1706,
                        DataTime: 1696089600,
                        DataType: 14,
                        TotalCountText: '新增粉丝',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1707,
                        DataTime: 1696176000,
                        DataType: 14,
                        TotalCountText: '新增粉丝',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1708,
                        DataTime: 1696262400,
                        DataType: 14,
                        TotalCountText: '新增粉丝',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1709,
                        DataTime: 1696348800,
                        DataType: 14,
                        TotalCountText: '新增粉丝',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1710,
                        DataTime: 1696435200,
                        DataType: 14,
                        TotalCountText: '新增粉丝',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1711,
                        DataTime: 1696521600,
                        DataType: 14,
                        TotalCountText: '新增粉丝',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1712,
                        DataTime: 1696608000,
                        DataType: 14,
                        TotalCountText: '新增粉丝',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1713,
                        DataTime: 1696694400,
                        DataType: 14,
                        TotalCountText: '新增粉丝',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1714,
                        DataTime: 1696780800,
                        DataType: 14,
                        TotalCountText: '新增粉丝',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1715,
                        DataTime: 1696867200,
                        DataType: 14,
                        TotalCountText: '新增粉丝',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1716,
                        DataTime: 1696953600,
                        DataType: 14,
                        TotalCountText: '新增粉丝',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1717,
                        DataTime: 1697040000,
                        DataType: 14,
                        TotalCountText: '新增粉丝',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1718,
                        DataTime: 1697126400,
                        DataType: 14,
                        TotalCountText: '新增粉丝',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1719,
                        DataTime: 1697212800,
                        DataType: 14,
                        TotalCountText: '新增粉丝',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1720,
                        DataTime: 1697299200,
                        DataType: 14,
                        TotalCountText: '新增粉丝',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1721,
                        DataTime: 1697385600,
                        DataType: 14,
                        TotalCountText: '新增粉丝',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1722,
                        DataTime: 1697472000,
                        DataType: 14,
                        TotalCountText: '新增粉丝',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1723,
                        DataTime: 1697558400,
                        DataType: 14,
                        TotalCountText: '新增粉丝',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1724,
                        DataTime: 1697644800,
                        DataType: 14,
                        TotalCountText: '新增粉丝',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1725,
                        DataTime: 1697731200,
                        DataType: 14,
                        TotalCountText: '新增粉丝',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1726,
                        DataTime: 1697817600,
                        DataType: 14,
                        TotalCountText: '新增粉丝',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1727,
                        DataTime: 1697904000,
                        DataType: 14,
                        TotalCountText: '新增粉丝',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1728,
                        DataTime: 1697990400,
                        DataType: 14,
                        TotalCountText: '新增粉丝',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                    ],
                    LatestUpdateDate: '2023-10-23',
                  },
                  {
                    TimeType: 0,
                    MeetCondition: true,
                    DataType: 16,
                    Details: [
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1700,
                        DataTime: 1695571200,
                        DataType: 16,
                        TotalCountText: '视频发布数',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1701,
                        DataTime: 1695657600,
                        DataType: 16,
                        TotalCountText: '视频发布数',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1702,
                        DataTime: 1695744000,
                        DataType: 16,
                        TotalCountText: '视频发布数',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1703,
                        DataTime: 1695830400,
                        DataType: 16,
                        TotalCountText: '视频发布数',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1704,
                        DataTime: 1695916800,
                        DataType: 16,
                        TotalCountText: '视频发布数',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1705,
                        DataTime: 1696003200,
                        DataType: 16,
                        TotalCountText: '视频发布数',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1706,
                        DataTime: 1696089600,
                        DataType: 16,
                        TotalCountText: '视频发布数',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1707,
                        DataTime: 1696176000,
                        DataType: 16,
                        TotalCountText: '视频发布数',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1708,
                        DataTime: 1696262400,
                        DataType: 16,
                        TotalCountText: '视频发布数',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1709,
                        DataTime: 1696348800,
                        DataType: 16,
                        TotalCountText: '视频发布数',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1710,
                        DataTime: 1696435200,
                        DataType: 16,
                        TotalCountText: '视频发布数',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1711,
                        DataTime: 1696521600,
                        DataType: 16,
                        TotalCountText: '视频发布数',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1712,
                        DataTime: 1696608000,
                        DataType: 16,
                        TotalCountText: '视频发布数',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1713,
                        DataTime: 1696694400,
                        DataType: 16,
                        TotalCountText: '视频发布数',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1714,
                        DataTime: 1696780800,
                        DataType: 16,
                        TotalCountText: '视频发布数',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1715,
                        DataTime: 1696867200,
                        DataType: 16,
                        TotalCountText: '视频发布数',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1716,
                        DataTime: 1696953600,
                        DataType: 16,
                        TotalCountText: '视频发布数',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1717,
                        DataTime: 1697040000,
                        DataType: 16,
                        TotalCountText: '视频发布数',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1718,
                        DataTime: 1697126400,
                        DataType: 16,
                        TotalCountText: '视频发布数',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1719,
                        DataTime: 1697212800,
                        DataType: 16,
                        TotalCountText: '视频发布数',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1720,
                        DataTime: 1697299200,
                        DataType: 16,
                        TotalCountText: '视频发布数',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1721,
                        DataTime: 1697385600,
                        DataType: 16,
                        TotalCountText: '视频发布数',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1722,
                        DataTime: 1697472000,
                        DataType: 16,
                        TotalCountText: '视频发布数',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1723,
                        DataTime: 1697558400,
                        DataType: 16,
                        TotalCountText: '视频发布数',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1724,
                        DataTime: 1697644800,
                        DataType: 16,
                        TotalCountText: '视频发布数',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1725,
                        DataTime: 1697731200,
                        DataType: 16,
                        TotalCountText: '视频发布数',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1726,
                        DataTime: 1697817600,
                        DataType: 16,
                        TotalCountText: '视频发布数',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1727,
                        DataTime: 1697904000,
                        DataType: 16,
                        TotalCountText: '视频发布数',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                      {
                        MeetCondition: true,
                        TotalCount: 0,
                        TimeAfterPublish: 1728,
                        DataTime: 1697990400,
                        DataType: 16,
                        TotalCountText: '视频发布数',
                        LatestUpdateDateTotal: '2023-10-23',
                      },
                    ],
                    LatestUpdateDate: '2023-10-23',
                  },
                ],
                BaseResp: {
                  StatusMessage: 'SUCCESS',
                  StatusCode: 0,
                },
                dates: [
                  '2023-09-25',
                  '2023-09-26',
                  '2023-09-27',
                  '2023-09-28',
                  '2023-09-29',
                  '2023-09-30',
                  '2023-10-01',
                  '2023-10-02',
                  '2023-10-03',
                  '2023-10-04',
                  '2023-10-05',
                  '2023-10-06',
                  '2023-10-07',
                  '2023-10-08',
                  '2023-10-09',
                  '2023-10-10',
                  '2023-10-11',
                  '2023-10-12',
                  '2023-10-13',
                  '2023-10-14',
                  '2023-10-15',
                  '2023-10-16',
                  '2023-10-17',
                  '2023-10-18',
                  '2023-10-19',
                  '2023-10-20',
                  '2023-10-21',
                  '2023-10-22',
                  '2023-10-23',
                ],
                data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                newGroupCntList: [
                  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                ],
                fansData: [
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                ],
                loyalFansData: [
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                  null,
                ],
                metricName: {
                  TotalCountText: '新增粉丝',
                  FansCountText: '',
                  LoyalFansCountText: '',
                },
                accountCreateDate: '2019-01-29',
              },
              status: 0,
              message: 'SUCCESS',
            }),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const result = await getDataOverviewAsync('success', '', '', 0, 1);
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.status).toBe(0);
      });
    });
  });

  describe('获取西瓜视频数据中心收益数据', () => {
    const server = setupServer(
      rest.get('https://studio.ixigua.com*/api/income/creator_income_by_time', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              status: 0,
              message: 'success',
              data: {
                IsTotalIncomeSynced: true,
                TotalIncome: 0,
                Details: [
                  {
                    Name: '创作收益',
                    Amount: 0,
                    Type: 1,
                    IsSynced: true,
                    Details: [
                      {
                        Name: '基础收益',
                        Amount: 0,
                        IsSynced: true,
                        Type: 1,
                      },
                      {
                        Name: '铁粉补贴',
                        Amount: 0,
                        IsSynced: true,
                        Type: 3,
                      },
                      {
                        Name: '闪光时刻补贴',
                        Amount: 0,
                        IsSynced: true,
                        Type: 6,
                      },
                      {
                        Name: '萌芽补贴',
                        Amount: 0,
                        IsSynced: true,
                        Type: 5,
                      },
                      {
                        Name: '其他补贴',
                        Amount: 0,
                        IsSynced: true,
                        Type: 17,
                      },
                    ],
                  },
                  {
                    Name: '抖音创作收益',
                    Amount: 0,
                    Type: 2,
                    IsSynced: true,
                    Details: [
                      {
                        Name: '基础收益',
                        Amount: 0,
                        IsSynced: true,
                        Type: 2,
                      },
                      {
                        Name: '铁粉补贴',
                        Amount: 0,
                        IsSynced: true,
                        Type: 4,
                      },
                    ],
                  },
                  {
                    Name: '独家收益',
                    Amount: 0,
                    Type: 3,
                    IsSynced: true,
                  },
                  {
                    Name: '特殊激励收益',
                    Amount: 0,
                    Type: 4,
                    IsSynced: true,
                    Details: [
                      {
                        Name: '宝藏视频',
                        Amount: 0,
                        IsSynced: true,
                        Type: 10,
                      },
                      {
                        Name: '强烈点赞',
                        Amount: 0,
                        IsSynced: true,
                        Type: 11,
                      },
                    ],
                  },
                  {
                    Name: '签约收益',
                    Amount: 0,
                    Type: 5,
                    IsSynced: true,
                    Details: [
                      {
                        Name: '西瓜签约',
                        Amount: 0,
                        IsSynced: true,
                        Type: 7,
                      },
                      {
                        Name: '抖音签约',
                        Amount: 0,
                        IsSynced: true,
                        Type: 8,
                      },
                      {
                        Name: '定额合作费',
                        Amount: 0,
                        IsSynced: true,
                        Type: 9,
                      },
                    ],
                  },
                  {
                    Name: '其他收益',
                    Amount: 0,
                    Type: 6,
                    IsSynced: true,
                    Details: [
                      {
                        Name: '赞赏',
                        Amount: 0,
                        IsSynced: true,
                        Type: 12,
                      },
                      {
                        Name: '专栏',
                        Amount: 0,
                        IsSynced: true,
                        Type: 13,
                      },
                      {
                        Name: '扣款',
                        Amount: 0,
                        IsSynced: true,
                        Type: 14,
                      },
                      {
                        Name: '补款',
                        Amount: 0,
                        IsSynced: true,
                        Type: 15,
                      },
                      {
                        Name: '活动图文等',
                        Amount: 0,
                        IsSynced: true,
                        Type: 16,
                      },
                    ],
                  },
                  {
                    Name: '游戏收益',
                    Amount: 0,
                    Type: 7,
                    IsSynced: true,
                    Details: [
                      {
                        Name: '游戏推广收益',
                        Amount: 0,
                        IsSynced: true,
                        Type: 18,
                      },
                    ],
                  },
                ],
                HasRealTimePayment: false,
                LastReadyDate: '2023-10-23',
                BaseResp: {
                  StatusMessage: 'success',
                  StatusCode: 0,
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
        const result = await getIncomeAsync('success');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.status).toBe(0);
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('获取西瓜视频数据中心顶部数据', async () => {
    const cookie =
      '_tea_utm_cache_3062=undefined; MONITOR_WEB_ID=36562fad-0466-45cd-9826-1cd101fcf1a5; passport_csrf_token=29632347a66f8d1e51749835cb064ab2; passport_csrf_token_default=29632347a66f8d1e51749835cb064ab2; studio_web_id=7291914075281655346; Hm_lvt_5ef88140a857780eb79a65f7d563f9ef=1698024595; csrf_session_id=b97990dd79d0f21207d188fe3ba642ba; passport_auth_status=c380793b0b56d2275a10ec1b16430c10%2C2e669a4fabfb16c43e2efca32e5f0fa2; passport_auth_status_ss=c380793b0b56d2275a10ec1b16430c10%2C2e669a4fabfb16c43e2efca32e5f0fa2; sid_guard=3ce9d8c4fdd122a46c0021605f7a8363%7C1698025258%7C5184002%7CFri%2C+22-Dec-2023+01%3A41%3A00+GMT; uid_tt=59b7e5ff2c346463b334c673da06c742; uid_tt_ss=59b7e5ff2c346463b334c673da06c742; sid_tt=3ce9d8c4fdd122a46c0021605f7a8363; sessionid=3ce9d8c4fdd122a46c0021605f7a8363; sessionid_ss=3ce9d8c4fdd122a46c0021605f7a8363; sid_ucp_v1=1.0.0-KGMzZTUyZGRmMGE1MjEyZDY2MzA2NDNhYzI5MDk5MTllNDgxZjhkM2IKFQiZ8t_43AIQqp7XqQYY9hc4AkDxBxoCbGYiIDNjZTlkOGM0ZmRkMTIyYTQ2YzAwMjE2MDVmN2E4MzYz; ssid_ucp_v1=1.0.0-KGMzZTUyZGRmMGE1MjEyZDY2MzA2NDNhYzI5MDk5MTllNDgxZjhkM2IKFQiZ8t_43AIQqp7XqQYY9hc4AkDxBxoCbGYiIDNjZTlkOGM0ZmRkMTIyYTQ2YzAwMjE2MDVmN2E4MzYz; Hm_lpvt_5ef88140a857780eb79a65f7d563f9ef=1698025260; s_v_web_id=f12b6064bee460ffb1d736b1d4ea05bc64d43061a68a932161';

    const result = await getDataOverviewStatisticAsync(cookie, 0, 0, '2023-09-24', '2023-10-24');
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.status).toBe(0);
  }, 10000000);

  test('获取西瓜视频数据中心报表数据', async () => {
    const cookie =
      '_tea_utm_cache_3062=undefined; MONITOR_WEB_ID=36562fad-0466-45cd-9826-1cd101fcf1a5; passport_csrf_token=29632347a66f8d1e51749835cb064ab2; passport_csrf_token_default=29632347a66f8d1e51749835cb064ab2; studio_web_id=7291914075281655346; Hm_lvt_5ef88140a857780eb79a65f7d563f9ef=1698024595; csrf_session_id=b97990dd79d0f21207d188fe3ba642ba; passport_auth_status=c380793b0b56d2275a10ec1b16430c10%2C2e669a4fabfb16c43e2efca32e5f0fa2; passport_auth_status_ss=c380793b0b56d2275a10ec1b16430c10%2C2e669a4fabfb16c43e2efca32e5f0fa2; sid_guard=3ce9d8c4fdd122a46c0021605f7a8363%7C1698025258%7C5184002%7CFri%2C+22-Dec-2023+01%3A41%3A00+GMT; uid_tt=59b7e5ff2c346463b334c673da06c742; uid_tt_ss=59b7e5ff2c346463b334c673da06c742; sid_tt=3ce9d8c4fdd122a46c0021605f7a8363; sessionid=3ce9d8c4fdd122a46c0021605f7a8363; sessionid_ss=3ce9d8c4fdd122a46c0021605f7a8363; sid_ucp_v1=1.0.0-KGMzZTUyZGRmMGE1MjEyZDY2MzA2NDNhYzI5MDk5MTllNDgxZjhkM2IKFQiZ8t_43AIQqp7XqQYY9hc4AkDxBxoCbGYiIDNjZTlkOGM0ZmRkMTIyYTQ2YzAwMjE2MDVmN2E4MzYz; ssid_ucp_v1=1.0.0-KGMzZTUyZGRmMGE1MjEyZDY2MzA2NDNhYzI5MDk5MTllNDgxZjhkM2IKFQiZ8t_43AIQqp7XqQYY9hc4AkDxBxoCbGYiIDNjZTlkOGM0ZmRkMTIyYTQ2YzAwMjE2MDVmN2E4MzYz; Hm_lpvt_5ef88140a857780eb79a65f7d563f9ef=1698025260; s_v_web_id=f12b6064bee460ffb1d736b1d4ea05bc64d43061a68a932161';

    const result = await getDataOverviewAsync(cookie, '2023-09-24', '2023-10-24', 0, 1);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.status).toBe(0);
  }, 10000000);

  test('获取西瓜视频数据中心收益数据', async () => {
    const cookie =
      '_tea_utm_cache_3062=undefined; MONITOR_WEB_ID=36562fad-0466-45cd-9826-1cd101fcf1a5; passport_csrf_token=29632347a66f8d1e51749835cb064ab2; passport_csrf_token_default=29632347a66f8d1e51749835cb064ab2; studio_web_id=7291914075281655346; Hm_lvt_5ef88140a857780eb79a65f7d563f9ef=1698024595; csrf_session_id=b97990dd79d0f21207d188fe3ba642ba; passport_auth_status=c380793b0b56d2275a10ec1b16430c10%2C2e669a4fabfb16c43e2efca32e5f0fa2; passport_auth_status_ss=c380793b0b56d2275a10ec1b16430c10%2C2e669a4fabfb16c43e2efca32e5f0fa2; sid_guard=3ce9d8c4fdd122a46c0021605f7a8363%7C1698025258%7C5184002%7CFri%2C+22-Dec-2023+01%3A41%3A00+GMT; uid_tt=59b7e5ff2c346463b334c673da06c742; uid_tt_ss=59b7e5ff2c346463b334c673da06c742; sid_tt=3ce9d8c4fdd122a46c0021605f7a8363; sessionid=3ce9d8c4fdd122a46c0021605f7a8363; sessionid_ss=3ce9d8c4fdd122a46c0021605f7a8363; sid_ucp_v1=1.0.0-KGMzZTUyZGRmMGE1MjEyZDY2MzA2NDNhYzI5MDk5MTllNDgxZjhkM2IKFQiZ8t_43AIQqp7XqQYY9hc4AkDxBxoCbGYiIDNjZTlkOGM0ZmRkMTIyYTQ2YzAwMjE2MDVmN2E4MzYz; ssid_ucp_v1=1.0.0-KGMzZTUyZGRmMGE1MjEyZDY2MzA2NDNhYzI5MDk5MTllNDgxZjhkM2IKFQiZ8t_43AIQqp7XqQYY9hc4AkDxBxoCbGYiIDNjZTlkOGM0ZmRkMTIyYTQ2YzAwMjE2MDVmN2E4MzYz; Hm_lpvt_5ef88140a857780eb79a65f7d563f9ef=1698025260; s_v_web_id=f12b6064bee460ffb1d736b1d4ea05bc64d43061a68a932161';

    const result = await getIncomeAsync(cookie);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.status).toBe(0);
  }, 10000000);
});
