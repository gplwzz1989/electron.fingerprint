import { describe, expect, test } from 'vitest';
import {
  getDataOverviewListAsync,
  getSingleDataOverviewAsync,
} from '@/media-platform/shipinhao/shipinhao-data-overview.service';
import { getUserinfo } from '@/media-platform/shipinhao/shipinhao-base.service';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';

describe('【Mock】', () => {
  describe('获取视频号视频数据列表', () => {
    const server = setupServer(
      rest.get(
        'https://channels.weixin.qq.com*/cgi-bin/mmfinderassistant-bin/statistic/new_post_total_data',
        (req, res, context) => {
          const cookie = req.url.searchParams.get('cookie');

          // success
          if (cookie === 'success') {
            return res(
              context.status(200),
              context.json({
                errCode: 0,
                errMsg: 'request successful',
                data: {
                  dataByTabtype: [
                    {
                      tabType: 3,
                      data: {
                        browse: ['0', '0', '0', '0', '0', '0', '0'],
                        like: ['0', '0', '0', '0', '0', '0', '0'],
                        comment: ['0', '0', '0', '0', '0', '0', '0'],
                        forward: ['0', '0', '0', '0', '0', '0', '0'],
                        fav: ['0', '0', '0', '0', '0', '0', '0'],
                        ringset: ['0', '0', '0', '0', '0', '0', '0'],
                        snscover: ['0', '0', '0', '0', '0', '0', '0'],
                        statusref: ['0', '0', '0', '0', '0', '0', '0'],
                        forwardAggregation: ['0', '0', '0', '0', '0', '0', '0'],
                        follow: ['0', '0', '0', '0', '0', '0', '0'],
                      },
                      tabTypeName: '关注',
                    },
                    {
                      tabType: 4,
                      data: {
                        browse: ['0', '0', '0', '0', '0', '0', '0'],
                        like: ['0', '0', '0', '0', '0', '0', '0'],
                        comment: ['0', '0', '0', '0', '0', '0', '0'],
                        forward: ['0', '0', '0', '0', '0', '0', '0'],
                        fav: ['0', '0', '0', '0', '0', '0', '0'],
                        ringset: ['0', '0', '0', '0', '0', '0', '0'],
                        snscover: ['0', '0', '0', '0', '0', '0', '0'],
                        statusref: ['0', '0', '0', '0', '0', '0', '0'],
                        forwardAggregation: ['0', '0', '0', '0', '0', '0', '0'],
                        follow: ['0', '0', '0', '0', '0', '0', '0'],
                      },
                      tabTypeName: '推荐',
                    },
                    {
                      tabType: 6,
                      data: {
                        browse: ['0', '0', '0', '0', '0', '0', '0'],
                        like: ['0', '0', '0', '0', '0', '0', '0'],
                        comment: ['0', '0', '0', '0', '0', '0', '0'],
                        forward: ['0', '0', '0', '0', '0', '0', '0'],
                        fav: ['0', '0', '0', '0', '0', '0', '0'],
                        ringset: ['0', '0', '0', '0', '0', '0', '0'],
                        snscover: ['0', '0', '0', '0', '0', '0', '0'],
                        statusref: ['0', '0', '0', '0', '0', '0', '0'],
                        forwardAggregation: ['0', '0', '0', '0', '0', '0', '0'],
                        follow: ['0', '0', '0', '0', '0', '0', '0'],
                      },
                      tabTypeName: '分享',
                    },
                    {
                      tabType: 20,
                      data: {
                        browse: ['0', '0', '0', '0', '0', '0', '0'],
                        like: ['0', '0', '0', '0', '0', '0', '0'],
                        comment: ['0', '0', '0', '0', '0', '0', '0'],
                        forward: ['0', '0', '0', '0', '0', '0', '0'],
                        fav: ['0', '0', '0', '0', '0', '0', '0'],
                        ringset: ['0', '0', '0', '0', '0', '0', '0'],
                        snscover: ['0', '0', '0', '0', '0', '0', '0'],
                        statusref: ['0', '0', '0', '0', '0', '0', '0'],
                        forwardAggregation: ['0', '0', '0', '0', '0', '0', '0'],
                        follow: ['0', '0', '0', '0', '0', '0', '0'],
                      },
                      tabTypeName: '主页',
                    },
                    {
                      tabType: 8,
                      data: {
                        browse: ['0', '0', '0', '0', '0', '0', '0'],
                        like: ['0', '0', '0', '0', '0', '0', '0'],
                        comment: ['0', '0', '0', '0', '0', '0', '0'],
                        forward: ['0', '0', '0', '0', '0', '0', '0'],
                        fav: ['0', '0', '0', '0', '0', '0', '0'],
                        ringset: ['0', '0', '0', '0', '0', '0', '0'],
                        snscover: ['0', '0', '0', '0', '0', '0', '0'],
                        statusref: ['0', '0', '0', '0', '0', '0', '0'],
                        forwardAggregation: ['0', '0', '0', '0', '0', '0', '0'],
                        follow: ['0', '0', '0', '0', '0', '0', '0'],
                      },
                      tabTypeName: '朋友♡',
                    },
                    {
                      tabType: 15,
                      data: {
                        browse: ['0', '0', '0', '0', '0', '0', '0'],
                        like: ['0', '0', '0', '0', '0', '0', '0'],
                        comment: ['0', '0', '0', '0', '0', '0', '0'],
                        forward: ['0', '0', '0', '0', '0', '0', '0'],
                        fav: ['0', '0', '0', '0', '0', '0', '0'],
                        ringset: ['0', '0', '0', '0', '0', '0', '0'],
                        snscover: ['0', '0', '0', '0', '0', '0', '0'],
                        statusref: ['0', '0', '0', '0', '0', '0', '0'],
                        forwardAggregation: ['0', '0', '0', '0', '0', '0', '0'],
                        follow: ['0', '0', '0', '0', '0', '0', '0'],
                      },
                      tabTypeName: 'PC微信',
                    },
                    {
                      tabType: 16,
                      data: {
                        browse: ['0', '0', '0', '0', '0', '0', '0'],
                        like: ['0', '0', '0', '0', '0', '0', '0'],
                        comment: ['0', '0', '0', '0', '0', '0', '0'],
                        forward: ['0', '0', '0', '0', '0', '0', '0'],
                        fav: ['0', '0', '0', '0', '0', '0', '0'],
                        ringset: ['0', '0', '0', '0', '0', '0', '0'],
                        snscover: ['0', '0', '0', '0', '0', '0', '0'],
                        statusref: ['0', '0', '0', '0', '0', '0', '0'],
                        forwardAggregation: ['0', '0', '0', '0', '0', '0', '0'],
                        follow: ['0', '0', '0', '0', '0', '0', '0'],
                      },
                      tabTypeName: '订阅号消息',
                    },
                    {
                      tabType: 0,
                      data: {
                        browse: ['2', '0', '0', '0', '0', '0', '0'],
                        like: ['0', '0', '0', '0', '0', '0', '0'],
                        comment: ['0', '0', '0', '0', '0', '0', '0'],
                        forward: ['0', '0', '0', '0', '0', '0', '0'],
                        fav: ['0', '0', '0', '0', '0', '0', '0'],
                        ringset: ['0', '0', '0', '0', '0', '0', '0'],
                        snscover: ['0', '0', '0', '0', '0', '0', '0'],
                        statusref: ['0', '0', '0', '0', '0', '0', '0'],
                        forwardAggregation: ['0', '0', '0', '0', '0', '0', '0'],
                        follow: ['0', '0', '0', '0', '0', '0', '0'],
                      },
                      tabTypeName: '其他',
                    },
                  ],
                  dataByFanstype: [
                    {
                      dataByTabtype: [
                        {
                          tabType: 999,
                          data: {
                            browse: ['2', '0', '0', '0', '0', '0', '0'],
                            like: ['0', '0', '0', '0', '0', '0', '0'],
                            comment: ['0', '0', '0', '0', '0', '0', '0'],
                            forward: ['0', '0', '0', '0', '0', '0', '0'],
                            fav: ['0', '0', '0', '0', '0', '0', '0'],
                            ringset: ['0', '0', '0', '0', '0', '0', '0'],
                            snscover: ['0', '0', '0', '0', '0', '0', '0'],
                            statusref: ['0', '0', '0', '0', '0', '0', '0'],
                            forwardAggregation: ['0', '0', '0', '0', '0', '0', '0'],
                            follow: ['0', '0', '0', '0', '0', '0', '0'],
                          },
                          tabTypeName: '全部',
                        },
                        {
                          tabType: 3,
                          data: {
                            browse: ['0', '0', '0', '0', '0', '0', '0'],
                            like: ['0', '0', '0', '0', '0', '0', '0'],
                            comment: ['0', '0', '0', '0', '0', '0', '0'],
                            forward: ['0', '0', '0', '0', '0', '0', '0'],
                            fav: ['0', '0', '0', '0', '0', '0', '0'],
                            ringset: ['0', '0', '0', '0', '0', '0', '0'],
                            snscover: ['0', '0', '0', '0', '0', '0', '0'],
                            statusref: ['0', '0', '0', '0', '0', '0', '0'],
                            forwardAggregation: ['0', '0', '0', '0', '0', '0', '0'],
                            follow: ['0', '0', '0', '0', '0', '0', '0'],
                          },
                          tabTypeName: '关注',
                        },
                        {
                          tabType: 8,
                          data: {
                            browse: ['0', '0', '0', '0', '0', '0', '0'],
                            like: ['0', '0', '0', '0', '0', '0', '0'],
                            comment: ['0', '0', '0', '0', '0', '0', '0'],
                            forward: ['0', '0', '0', '0', '0', '0', '0'],
                            fav: ['0', '0', '0', '0', '0', '0', '0'],
                            ringset: ['0', '0', '0', '0', '0', '0', '0'],
                            snscover: ['0', '0', '0', '0', '0', '0', '0'],
                            statusref: ['0', '0', '0', '0', '0', '0', '0'],
                            forwardAggregation: ['0', '0', '0', '0', '0', '0', '0'],
                            follow: ['0', '0', '0', '0', '0', '0', '0'],
                          },
                          tabTypeName: '朋友♡',
                        },
                        {
                          tabType: 4,
                          data: {
                            browse: ['0', '0', '0', '0', '0', '0', '0'],
                            like: ['0', '0', '0', '0', '0', '0', '0'],
                            comment: ['0', '0', '0', '0', '0', '0', '0'],
                            forward: ['0', '0', '0', '0', '0', '0', '0'],
                            fav: ['0', '0', '0', '0', '0', '0', '0'],
                            ringset: ['0', '0', '0', '0', '0', '0', '0'],
                            snscover: ['0', '0', '0', '0', '0', '0', '0'],
                            statusref: ['0', '0', '0', '0', '0', '0', '0'],
                            forwardAggregation: ['0', '0', '0', '0', '0', '0', '0'],
                            follow: ['0', '0', '0', '0', '0', '0', '0'],
                          },
                          tabTypeName: '推荐',
                        },
                        {
                          tabType: 6,
                          data: {
                            browse: ['0', '0', '0', '0', '0', '0', '0'],
                            like: ['0', '0', '0', '0', '0', '0', '0'],
                            comment: ['0', '0', '0', '0', '0', '0', '0'],
                            forward: ['0', '0', '0', '0', '0', '0', '0'],
                            fav: ['0', '0', '0', '0', '0', '0', '0'],
                            ringset: ['0', '0', '0', '0', '0', '0', '0'],
                            snscover: ['0', '0', '0', '0', '0', '0', '0'],
                            statusref: ['0', '0', '0', '0', '0', '0', '0'],
                            forwardAggregation: ['0', '0', '0', '0', '0', '0', '0'],
                            follow: ['0', '0', '0', '0', '0', '0', '0'],
                          },
                          tabTypeName: '分享',
                        },
                        {
                          tabType: 16,
                          data: {
                            browse: ['0', '0', '0', '0', '0', '0', '0'],
                            like: ['0', '0', '0', '0', '0', '0', '0'],
                            comment: ['0', '0', '0', '0', '0', '0', '0'],
                            forward: ['0', '0', '0', '0', '0', '0', '0'],
                            fav: ['0', '0', '0', '0', '0', '0', '0'],
                            ringset: ['0', '0', '0', '0', '0', '0', '0'],
                            snscover: ['0', '0', '0', '0', '0', '0', '0'],
                            statusref: ['0', '0', '0', '0', '0', '0', '0'],
                            forwardAggregation: ['0', '0', '0', '0', '0', '0', '0'],
                            follow: ['0', '0', '0', '0', '0', '0', '0'],
                          },
                          tabTypeName: '订阅号消息',
                        },
                        {
                          tabType: 0,
                          data: {
                            browse: ['2', '0', '0', '0', '0', '0', '0'],
                            like: ['0', '0', '0', '0', '0', '0', '0'],
                            comment: ['0', '0', '0', '0', '0', '0', '0'],
                            forward: ['0', '0', '0', '0', '0', '0', '0'],
                            fav: ['0', '0', '0', '0', '0', '0', '0'],
                            ringset: ['0', '0', '0', '0', '0', '0', '0'],
                            snscover: ['0', '0', '0', '0', '0', '0', '0'],
                            statusref: ['0', '0', '0', '0', '0', '0', '0'],
                            forwardAggregation: ['0', '0', '0', '0', '0', '0', '0'],
                            follow: ['0', '0', '0', '0', '0', '0', '0'],
                          },
                          tabTypeName: '其他',
                        },
                      ],
                      fansType: 1,
                    },
                    {
                      dataByTabtype: [
                        {
                          tabType: 999,
                          data: {
                            browse: ['0', '0', '0', '0', '0', '0', '0'],
                            like: ['0', '0', '0', '0', '0', '0', '0'],
                            comment: ['0', '0', '0', '0', '0', '0', '0'],
                            forward: ['0', '0', '0', '0', '0', '0', '0'],
                            fav: ['0', '0', '0', '0', '0', '0', '0'],
                            ringset: ['0', '0', '0', '0', '0', '0', '0'],
                            snscover: ['0', '0', '0', '0', '0', '0', '0'],
                            statusref: ['0', '0', '0', '0', '0', '0', '0'],
                            forwardAggregation: ['0', '0', '0', '0', '0', '0', '0'],
                            follow: ['0', '0', '0', '0', '0', '0', '0'],
                          },
                          tabTypeName: '全部',
                        },
                        {
                          tabType: 3,
                          data: {
                            browse: ['0', '0', '0', '0', '0', '0', '0'],
                            like: ['0', '0', '0', '0', '0', '0', '0'],
                            comment: ['0', '0', '0', '0', '0', '0', '0'],
                            forward: ['0', '0', '0', '0', '0', '0', '0'],
                            fav: ['0', '0', '0', '0', '0', '0', '0'],
                            ringset: ['0', '0', '0', '0', '0', '0', '0'],
                            snscover: ['0', '0', '0', '0', '0', '0', '0'],
                            statusref: ['0', '0', '0', '0', '0', '0', '0'],
                            forwardAggregation: ['0', '0', '0', '0', '0', '0', '0'],
                            follow: ['0', '0', '0', '0', '0', '0', '0'],
                          },
                          tabTypeName: '关注',
                        },
                        {
                          tabType: 8,
                          data: {
                            browse: ['0', '0', '0', '0', '0', '0', '0'],
                            like: ['0', '0', '0', '0', '0', '0', '0'],
                            comment: ['0', '0', '0', '0', '0', '0', '0'],
                            forward: ['0', '0', '0', '0', '0', '0', '0'],
                            fav: ['0', '0', '0', '0', '0', '0', '0'],
                            ringset: ['0', '0', '0', '0', '0', '0', '0'],
                            snscover: ['0', '0', '0', '0', '0', '0', '0'],
                            statusref: ['0', '0', '0', '0', '0', '0', '0'],
                            forwardAggregation: ['0', '0', '0', '0', '0', '0', '0'],
                            follow: ['0', '0', '0', '0', '0', '0', '0'],
                          },
                          tabTypeName: '朋友♡',
                        },
                        {
                          tabType: 4,
                          data: {
                            browse: ['0', '0', '0', '0', '0', '0', '0'],
                            like: ['0', '0', '0', '0', '0', '0', '0'],
                            comment: ['0', '0', '0', '0', '0', '0', '0'],
                            forward: ['0', '0', '0', '0', '0', '0', '0'],
                            fav: ['0', '0', '0', '0', '0', '0', '0'],
                            ringset: ['0', '0', '0', '0', '0', '0', '0'],
                            snscover: ['0', '0', '0', '0', '0', '0', '0'],
                            statusref: ['0', '0', '0', '0', '0', '0', '0'],
                            forwardAggregation: ['0', '0', '0', '0', '0', '0', '0'],
                            follow: ['0', '0', '0', '0', '0', '0', '0'],
                          },
                          tabTypeName: '推荐',
                        },
                        {
                          tabType: 6,
                          data: {
                            browse: ['0', '0', '0', '0', '0', '0', '0'],
                            like: ['0', '0', '0', '0', '0', '0', '0'],
                            comment: ['0', '0', '0', '0', '0', '0', '0'],
                            forward: ['0', '0', '0', '0', '0', '0', '0'],
                            fav: ['0', '0', '0', '0', '0', '0', '0'],
                            ringset: ['0', '0', '0', '0', '0', '0', '0'],
                            snscover: ['0', '0', '0', '0', '0', '0', '0'],
                            statusref: ['0', '0', '0', '0', '0', '0', '0'],
                            forwardAggregation: ['0', '0', '0', '0', '0', '0', '0'],
                            follow: ['0', '0', '0', '0', '0', '0', '0'],
                          },
                          tabTypeName: '分享',
                        },
                        {
                          tabType: 16,
                          data: {
                            browse: ['0', '0', '0', '0', '0', '0', '0'],
                            like: ['0', '0', '0', '0', '0', '0', '0'],
                            comment: ['0', '0', '0', '0', '0', '0', '0'],
                            forward: ['0', '0', '0', '0', '0', '0', '0'],
                            fav: ['0', '0', '0', '0', '0', '0', '0'],
                            ringset: ['0', '0', '0', '0', '0', '0', '0'],
                            snscover: ['0', '0', '0', '0', '0', '0', '0'],
                            statusref: ['0', '0', '0', '0', '0', '0', '0'],
                            forwardAggregation: ['0', '0', '0', '0', '0', '0', '0'],
                            follow: ['0', '0', '0', '0', '0', '0', '0'],
                          },
                          tabTypeName: '订阅号消息',
                        },
                        {
                          tabType: 0,
                          data: {
                            browse: ['0', '0', '0', '0', '0', '0', '0'],
                            like: ['0', '0', '0', '0', '0', '0', '0'],
                            comment: ['0', '0', '0', '0', '0', '0', '0'],
                            forward: ['0', '0', '0', '0', '0', '0', '0'],
                            fav: ['0', '0', '0', '0', '0', '0', '0'],
                            ringset: ['0', '0', '0', '0', '0', '0', '0'],
                            snscover: ['0', '0', '0', '0', '0', '0', '0'],
                            statusref: ['0', '0', '0', '0', '0', '0', '0'],
                            forwardAggregation: ['0', '0', '0', '0', '0', '0', '0'],
                            follow: ['0', '0', '0', '0', '0', '0', '0'],
                          },
                          tabTypeName: '其他',
                        },
                      ],
                      fansType: 2,
                    },
                    {
                      dataByTabtype: [
                        {
                          tabType: 999,
                          data: {
                            browse: ['2', '0', '0', '0', '0', '0', '0'],
                            like: ['0', '0', '0', '0', '0', '0', '0'],
                            comment: ['0', '0', '0', '0', '0', '0', '0'],
                            forward: ['0', '0', '0', '0', '0', '0', '0'],
                            fav: ['0', '0', '0', '0', '0', '0', '0'],
                            ringset: ['0', '0', '0', '0', '0', '0', '0'],
                            snscover: ['0', '0', '0', '0', '0', '0', '0'],
                            statusref: ['0', '0', '0', '0', '0', '0', '0'],
                            forwardAggregation: ['0', '0', '0', '0', '0', '0', '0'],
                            follow: ['0', '0', '0', '0', '0', '0', '0'],
                          },
                          tabTypeName: '全部',
                        },
                        {
                          tabType: 3,
                          data: {
                            browse: ['0', '0', '0', '0', '0', '0', '0'],
                            like: ['0', '0', '0', '0', '0', '0', '0'],
                            comment: ['0', '0', '0', '0', '0', '0', '0'],
                            forward: ['0', '0', '0', '0', '0', '0', '0'],
                            fav: ['0', '0', '0', '0', '0', '0', '0'],
                            ringset: ['0', '0', '0', '0', '0', '0', '0'],
                            snscover: ['0', '0', '0', '0', '0', '0', '0'],
                            statusref: ['0', '0', '0', '0', '0', '0', '0'],
                            forwardAggregation: ['0', '0', '0', '0', '0', '0', '0'],
                            follow: ['0', '0', '0', '0', '0', '0', '0'],
                          },
                          tabTypeName: '关注',
                        },
                        {
                          tabType: 8,
                          data: {
                            browse: ['0', '0', '0', '0', '0', '0', '0'],
                            like: ['0', '0', '0', '0', '0', '0', '0'],
                            comment: ['0', '0', '0', '0', '0', '0', '0'],
                            forward: ['0', '0', '0', '0', '0', '0', '0'],
                            fav: ['0', '0', '0', '0', '0', '0', '0'],
                            ringset: ['0', '0', '0', '0', '0', '0', '0'],
                            snscover: ['0', '0', '0', '0', '0', '0', '0'],
                            statusref: ['0', '0', '0', '0', '0', '0', '0'],
                            forwardAggregation: ['0', '0', '0', '0', '0', '0', '0'],
                            follow: ['0', '0', '0', '0', '0', '0', '0'],
                          },
                          tabTypeName: '朋友♡',
                        },
                        {
                          tabType: 4,
                          data: {
                            browse: ['0', '0', '0', '0', '0', '0', '0'],
                            like: ['0', '0', '0', '0', '0', '0', '0'],
                            comment: ['0', '0', '0', '0', '0', '0', '0'],
                            forward: ['0', '0', '0', '0', '0', '0', '0'],
                            fav: ['0', '0', '0', '0', '0', '0', '0'],
                            ringset: ['0', '0', '0', '0', '0', '0', '0'],
                            snscover: ['0', '0', '0', '0', '0', '0', '0'],
                            statusref: ['0', '0', '0', '0', '0', '0', '0'],
                            forwardAggregation: ['0', '0', '0', '0', '0', '0', '0'],
                            follow: ['0', '0', '0', '0', '0', '0', '0'],
                          },
                          tabTypeName: '推荐',
                        },
                        {
                          tabType: 6,
                          data: {
                            browse: ['0', '0', '0', '0', '0', '0', '0'],
                            like: ['0', '0', '0', '0', '0', '0', '0'],
                            comment: ['0', '0', '0', '0', '0', '0', '0'],
                            forward: ['0', '0', '0', '0', '0', '0', '0'],
                            fav: ['0', '0', '0', '0', '0', '0', '0'],
                            ringset: ['0', '0', '0', '0', '0', '0', '0'],
                            snscover: ['0', '0', '0', '0', '0', '0', '0'],
                            statusref: ['0', '0', '0', '0', '0', '0', '0'],
                            forwardAggregation: ['0', '0', '0', '0', '0', '0', '0'],
                            follow: ['0', '0', '0', '0', '0', '0', '0'],
                          },
                          tabTypeName: '分享',
                        },
                        {
                          tabType: 16,
                          data: {
                            browse: ['0', '0', '0', '0', '0', '0', '0'],
                            like: ['0', '0', '0', '0', '0', '0', '0'],
                            comment: ['0', '0', '0', '0', '0', '0', '0'],
                            forward: ['0', '0', '0', '0', '0', '0', '0'],
                            fav: ['0', '0', '0', '0', '0', '0', '0'],
                            ringset: ['0', '0', '0', '0', '0', '0', '0'],
                            snscover: ['0', '0', '0', '0', '0', '0', '0'],
                            statusref: ['0', '0', '0', '0', '0', '0', '0'],
                            forwardAggregation: ['0', '0', '0', '0', '0', '0', '0'],
                            follow: ['0', '0', '0', '0', '0', '0', '0'],
                          },
                          tabTypeName: '订阅号消息',
                        },
                        {
                          tabType: 0,
                          data: {
                            browse: ['2', '0', '0', '0', '0', '0', '0'],
                            like: ['0', '0', '0', '0', '0', '0', '0'],
                            comment: ['0', '0', '0', '0', '0', '0', '0'],
                            forward: ['0', '0', '0', '0', '0', '0', '0'],
                            fav: ['0', '0', '0', '0', '0', '0', '0'],
                            ringset: ['0', '0', '0', '0', '0', '0', '0'],
                            snscover: ['0', '0', '0', '0', '0', '0', '0'],
                            statusref: ['0', '0', '0', '0', '0', '0', '0'],
                            forwardAggregation: ['0', '0', '0', '0', '0', '0', '0'],
                            follow: ['0', '0', '0', '0', '0', '0', '0'],
                          },
                          tabTypeName: '其他',
                        },
                      ],
                      fansType: 3,
                    },
                  ],
                  totalData: {
                    browse: ['2', '0', '0', '0', '0', '0', '0'],
                    like: ['0', '0', '0', '0', '0', '0', '0'],
                    comment: ['0', '0', '0', '0', '0', '0', '0'],
                    forward: ['0', '0', '0', '0', '0', '0', '0'],
                    fav: ['0', '0', '0', '0', '0', '0', '0'],
                    ringset: ['0', '0', '0', '0', '0', '0', '0'],
                    snscover: ['0', '0', '0', '0', '0', '0', '0'],
                    statusref: ['0', '0', '0', '0', '0', '0', '0'],
                    forwardAggregation: ['0', '0', '0', '0', '0', '0', '0'],
                    follow: ['0', '0', '0', '0', '0', '0', '0'],
                  },
                  notExistFansData: true,
                },
              }),
            );
          }

          return req.passthrough();
        },
      ),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const result = await getDataOverviewListAsync('success', '0', '0', '', 0);
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.errCode).toBe(0);
      });
    });
  });
});

describe.runIf(true)('【真实测试】', () => {
  test('获取数据分析列表', async () => {
    const cookie =
      'sessionid=BgAAZq9QmwRO55NfvArJld6ipm1CGPdEjYbDURljDMvhjHFDHIF8HWXwqh7VBOy4zqP1yq51SbVR5%2FKdK8h%2FG5TvbKA9YG4nCQNL; wxuin=3232023014';

    const startTs = '1727107200';
    const endTs = '1732204800';

    const userInfo = await getUserinfo(cookie);

    const finderUsername = userInfo?.data?.finderUser?.finderUsername ?? 'asdfsdf';
    const wxuin = userInfo?.data?.finderUser?.uin ?? 0;

    const result = await getDataOverviewListAsync(cookie, startTs, endTs, finderUsername, wxuin);
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.errCode).toBe(0);
  }, 10000000);

  test('获取数据单篇数据', async () => {
    const cookie =
      'pgv_pvid=1971602178; qq_domain_video_guid_verify=1938ff17d2cf12fc; _qimei_q36=; _qimei_h38=2db8a9497f375c35a34c816402000006517a1e; ptui_loginuin=33325126; RK=NP3Yx0aZEa; ptcz=1e65915780472831993b6a92e1e1418cda259cecff4af49c01859d04efd09d25; _qimei_fingerprint=69928e0a84b1b926582c4c55b6a55269; _clck=3509922215|1|fh3|0; sessionid=BgAA9VxqhbIfylHBLWXS%2BQB43v6Fy899CP03WdgVjR02dl1HztMy7nZxjKDIyXZrU37KKCJ%2F89nChgL1mETErpi6yBC3YAPD3CC2; wxuin=3002489383; _finder_fake_uin=LN7eDrRg1CA2fAHv56a86pxXvvoyTuSQVXHavREzZrQgGeil7HU80cJED34dUulIzm6khh0KH4EJfnVoIlgxTYloyLoil%2FA1Hxzy7gGrK0gPDbd%2FMpd5aAK0wFAsCijQwbDtgsJL';

    const startTs = '1700668800';
    const endTs = '1701187200';

    const userInfo = await getUserinfo(cookie);

    const finderUsername = userInfo?.data?.finderUser?.finderUsername ?? 'asdfsdf';
    const wxuin = userInfo?.data?.finderUser?.uin ?? 0;

    const result = await getSingleDataOverviewAsync(
      cookie,
      '14266823253461899528',
      startTs,
      endTs,
      finderUsername,
      wxuin,
    );
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.errCode).toBe(0);
  }, 10000000);
});
