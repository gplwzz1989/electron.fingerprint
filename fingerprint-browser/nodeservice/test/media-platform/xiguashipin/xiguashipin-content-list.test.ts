import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import {
  getShortContentListAsync,
  getContentListAsync,
} from '@/media-platform/xiguashipin/xiguashipin-content-list.service';

describe('【Mock】', () => {
  describe('获取西瓜视频内容列表', () => {
    const server = setupServer(
      rest.get('https://studio.ixigua.com*/api/content/list', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              status: 0,
              message: 'success',
              data: {
                NextOffset: 20,
                Total: 124,
                IncomeReadyTs: 1697990399,
                IndexTotal: 124,
                ArticleList: [
                  {
                    BanDanmaku: false,
                    VersionCode: 0,
                    PreAudit: false,
                    ItemId: '7281158337583186473',
                    GroupSource: 2,
                    IsOrigin: false,
                    CanEdit: true,
                    CanDelete: true,
                    CanHide: true,
                    CanPublic: false,
                    ViewData: true,
                    ViewComment: true,
                    ViewIncome: true,
                    CreateTime: 1695276782,
                    IsTop: false,
                    CanTop: true,
                    CanShare: true,
                    UserId: 93668768025,
                    IsRewardProject: false,
                    DraftUpdateTime: 1695276782,
                    ArticleAdType: 2,
                    VisibilityLevel: 40,
                    CanJumpDetail: true,
                    CanEditHideInfo: true,
                    ColumnID: 0,
                    CanEditCommentLevel: true,
                    IsVR: false,
                    IsCommerceVideo: false,
                    VideoData: {
                      Duration: 73,
                      Width: 1920,
                      Height: 1080,
                      IsLandscape: true,
                      Title: '《亲亲我的宝贝》周华健老师的词写的太好了~',
                      Abstract: '《亲亲我的宝贝》周华健老师的词写的太好了~',
                      CoverUri: 'tos-cn-i-0004/oAlACHLD2CvEeAfRDAaITu3AACAQgDtAH93zhh',
                      CoverUrl:
                        'https://p26-sign.bdxiguaimg.com/tos-cn-i-0004/oAlACHLD2CvEeAfRDAaITu3AACAQgDtAH93zhh~tplv-pk90l89vgd-crop-center:0:0.jpeg?from=3762548883&x-expires=1700732319&x-signature=xGV3nrSmLxWOqFcq%2B8idM7LaaxQ%3D',
                      PlayUrl: 'https://www.ixigua.com/i7281158337583186473/',
                      VCloudPlayUrl:
                        'https://video-cn-public.bytedance.net/storage/v1/tos-cn-ve-4/oktMswgCtAI6r9MsQzRlVmBrFhADfAA98eOE7L?a=32&ch=0&cr=0&dr=0&er=0&lr=default&&br=1557&bt=1557&cs=0&ds=4&eid=6147&mime_type=video_mp4&qs=2&rc=ZGQ1aTw8ODo4aDwzNDdkZUBpampxOGU6ZnB3bjMzNDczM0BeMS0zYV5jNTYxXjQvNjU0YSNpb2FycjRfcTJgLS1kLTBzcw%3D%3D&dy_q=1698140318&l=2023102417383896ADFCD26ECAB0C7ABEF&x-tos-algorithm=v2&x-tos-authkey=5bf25627da095a5cba28ace592de46cc&x-tos-expires=1699349991&x-tos-signature=V2vkkWupiuuC4JZGLypyDPWjpGs&caller=toutiao.video.biz_article_publish',
                      OfflinePlayUrl:
                        'https://video-cn-public.bytedance.net/storage/v1/tos-cn-ve-4/oktMswgCtAI6r9MsQzRlVmBrFhADfAA98eOE7L?a=32&ch=0&cr=0&dr=0&er=0&lr=default&&br=1557&bt=1557&cs=0&ds=4&eid=6147&mime_type=video_mp4&qs=2&rc=ZGQ1aTw8ODo4aDwzNDdkZUBpampxOGU6ZnB3bjMzNDczM0BeMS0zYV5jNTYxXjQvNjU0YSNpb2FycjRfcTJgLS1kLTBzcw%3D%3D&dy_q=1698140318&l=2023102417383896ADFCD26ECAB0C7ABEF&x-tos-algorithm=v2&x-tos-authkey=5bf25627da095a5cba28ace592de46cc&x-tos-expires=1699349991&x-tos-signature=V2vkkWupiuuC4JZGLypyDPWjpGs&caller=toutiao.video.biz_article_publish',
                      VideoID: 'v03004g10000ck5ttmbc77ubu5dnrglg',
                    },
                    SyncType: 0,
                    TimerData: {
                      TimerTime: 0,
                      CanPostNow: false,
                      TimerStatus: 0,
                      TimerArticleStatus: 0,
                    },
                    CommodityData: {
                      HasCommodity: false,
                    },
                    AlbumData: {
                      AddToAlbum: false,
                      AlbumId: 0,
                      CanAddToAlbum: true,
                      Rank: 0,
                      SeqsCount: 0,
                      AlbumName: '',
                      NoAddRightReason: '',
                    },
                    AuditData: {
                      FeedbackList: [],
                    },
                    ArticleStatData: {
                      RecommendCount: 3907,
                      RecommentCountI64: 3907,
                      PlayCount: 1322,
                      PlayCountI64: 1322,
                      CommentCount: 0,
                      CommentCountI64: 0,
                      DiggCount: 0,
                      DiggCountI64: 0,
                      DanmakuCount: 0,
                      DanmakuCountI64: 0,
                      RepinCount: 1,
                      RepinCountI64: 1,
                      Income: 0,
                      VideoExclusiveIncome: 0,
                      FansCount: 0,
                      ShareCount: 0,
                    },
                    CommentLevel: 1,
                    CanNotEditReason: '',
                    SyncToAweme: {
                      IsSyncToAweme: false,
                      CanSyncToAweme: true,
                      NoSyncToAwemeReason: '',
                    },
                    ArticleStatus: 2,
                    ItemStatus: 20,
                    History: {
                      Items: [
                        {
                          Version: 0,
                          CreateTime: 1695276782,
                          ArticleStatus: 2,
                          ItemStatus: 20,
                        },
                      ],
                    },
                    ArticleStatusText: '已发布',
                    ShareUrl: 'https://m.ixigua.com/group/7281158337583186473/?app=video_article&timestamp=1698140319',
                    VideoExclusive: {
                      CanCancelVideoExclusive: false,
                      Type: 0,
                      CanNotCancelVideoExclusiveReason: '只有独家视频支持取消独家',
                    },
                    CanNotHideReason: '',
                    CanNotDeleteReason: '',
                    IncomeComposition: 2,
                    AttrsValueMap: {},
                    BoostLandingUrl: '',
                    TortStatus: -2,
                    CanNotJumpReason: '',
                    HideType: 0,
                    HashtagList: [
                      {
                        HashtagId: '7170154934418021387',
                        HashtagName: '周华健亲亲我的宝贝',
                      },
                    ],
                  },
                ],
                BaseResp: {
                  StatusMessage: 'SUCCESS',
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
        const result = await getContentListAsync('success', 1, '', 0, 0);
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.status).toBe(0);
        expect(result.data.ArticleList).length(1);
        expect(result).toHaveProperty('ArticleList[0].ItemId', '7281158337583186473');
      });
    });
  });

  describe('获取西瓜短视频内容列表', () => {
    const server = setupServer(
      rest.get('https://studio.ixigua.com*/api/content/short_list', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              data: {
                HttpCode: 200,
                Code: 0,
                Message: 'success',
                Contents: [
                  {
                    ArticleAttr: {
                      Gid: '7288908817650289939',
                      Type: 4,
                      TypeDesc: '小视频',
                      Title:
                        '#萌娃 帅就一个字，我只说一次，哈哈哈~#萌娃日常 #萌娃搞笑日常 #萌娃搞笑瞬间 @皮蛋不圆 @迪迦奥特 @??????',
                      RichTitle:
                        '#萌娃 帅就一个字，我只说一次，哈哈哈~#萌娃日常 #萌娃搞笑日常 #萌娃搞笑瞬间 @皮蛋不圆 @迪迦奥特 @??????',
                      Abstract:
                        '#萌娃 帅就一个字，我只说一次，哈哈哈~#萌娃日常 #萌娃搞笑日常 #萌娃搞笑瞬间 @皮蛋不圆 @迪迦奥特 @??????',
                      CreateTime: 1697081361,
                      PopScore: 1697081361,
                      ModifyTime: 1697081361,
                      Status: 2,
                      StatusDesc: '',
                      CoverImage: {
                        ImageURL:
                          'https://p0-image-private.ixigua.com/tos-cn-i-dy/2d9f8767754447abaa72804a6aa5509f~noop.jpeg?policy=eyJ2bSI6MywidWlkIjoiOTM2Njg3NjgwMjUifQ%3D%3D&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=2013759868&x-orig-sign=ZXop%2BRD3s7wyZpZNeMWYa27e%2Fws%3D',
                        Width: 720,
                        Height: 1280,
                        ImageURI: 'tos-cn-i-dy/2d9f8767754447abaa72804a6aa5509f',
                      },
                      MpId: 0,
                      ActionUrls: {},
                      ShowTime: 1697081361,
                      ItemId: '7288908817650289939',
                      CommentStatus: 0,
                      UploadStatus: 0,
                      StatusList: {
                        IsStick: false,
                        IsAnonymous: false,
                        SyncAwemeStatus: 0,
                      },
                      MenuList: {
                        ShowDelete: true,
                        ShowModify: false,
                        ShowHide: false,
                        ShowStick: true,
                        ShowShare: true,
                        ShowAnonymous: false,
                        ShowComment: true,
                        ShowBoost: true,
                        ShowTimerPublish: false,
                        ShowSyncAweme: false,
                        ForbidToDetail: false,
                        ShowCopy: false,
                        ShowGraphic2Video: false,
                        ShowAds: false,
                        ForbidDeleteReason: '',
                        ForbidModifyReason: '',
                        ForbidHideReason: '',
                        ForbidBoostReason: '',
                        ForbidTimerPublishReason: '',
                        ForbidSyncAweme: '',
                        ForbidToDetailReason: '',
                        ForbidChangeAdsReason: '',
                      },
                      IsGallery: false,
                      IsQuestion: false,
                      VerifyReason: '',
                      Duration: 19,
                      ImageCnt: 0,
                      VisibilityLevel: 45,
                      LeaderSensitive: false,
                      IsExclusive: false,
                      Extra: {
                        group_source: '19',
                        user_name: '聪明的熊猫SIA',
                        impr_id: '20231024174429631610E7CAAA21C60BC8',
                      },
                      ShortVideoBoundInfo: {
                        TopicInfo: {
                          Type: 2,
                          ConcernId: '1604257214529613',
                          Word: '萌娃',
                          Id: 1604257214529613,
                        },
                      },
                      GroupSource: 19,
                      ArticleType: 'shortvideo',
                    },
                  },
                ],
                TotalCount: 72,
                StartCursor: 1697081361940,
                EndCursor: 1697081361938,
                HasMore: true,
                BaseResp: {
                  StatusMessage: 'success',
                  StatusCode: 0,
                },
              },
              status: 0,
              message: 'success',
            }),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const result = await getShortContentListAsync('success', 0, 0);
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.status).toBe(0);
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('获取西瓜视频视频列表', async () => {
    const cookie =
      '_tea_utm_cache_3062=undefined; MONITOR_WEB_ID=36562fad-0466-45cd-9826-1cd101fcf1a5; passport_csrf_token=29632347a66f8d1e51749835cb064ab2; passport_csrf_token_default=29632347a66f8d1e51749835cb064ab2; studio_web_id=7291914075281655346; Hm_lvt_5ef88140a857780eb79a65f7d563f9ef=1698024595; passport_auth_status=c380793b0b56d2275a10ec1b16430c10%2C2e669a4fabfb16c43e2efca32e5f0fa2; passport_auth_status_ss=c380793b0b56d2275a10ec1b16430c10%2C2e669a4fabfb16c43e2efca32e5f0fa2; sid_guard=3ce9d8c4fdd122a46c0021605f7a8363%7C1698025258%7C5184002%7CFri%2C+22-Dec-2023+01%3A41%3A00+GMT; uid_tt=59b7e5ff2c346463b334c673da06c742; uid_tt_ss=59b7e5ff2c346463b334c673da06c742; sid_tt=3ce9d8c4fdd122a46c0021605f7a8363; sessionid=3ce9d8c4fdd122a46c0021605f7a8363; sessionid_ss=3ce9d8c4fdd122a46c0021605f7a8363; sid_ucp_v1=1.0.0-KGMzZTUyZGRmMGE1MjEyZDY2MzA2NDNhYzI5MDk5MTllNDgxZjhkM2IKFQiZ8t_43AIQqp7XqQYY9hc4AkDxBxoCbGYiIDNjZTlkOGM0ZmRkMTIyYTQ2YzAwMjE2MDVmN2E4MzYz; ssid_ucp_v1=1.0.0-KGMzZTUyZGRmMGE1MjEyZDY2MzA2NDNhYzI5MDk5MTllNDgxZjhkM2IKFQiZ8t_43AIQqp7XqQYY9hc4AkDxBxoCbGYiIDNjZTlkOGM0ZmRkMTIyYTQ2YzAwMjE2MDVmN2E4MzYz; csrf_session_id=0105d819a56a8b36f402cbcabf20a8cb; s_v_web_id=f12b6064bee460ffb1d736b1d4ea05bc64d43061a68a932161; ttwid=1%7CTs4IVIuTKwndep8x1NcxA0yINuSxsw1yUtOrNg_EuVI%7C1698127334%7Ca43f2b03c43682e1236cf7bd17cd24efd53d41f5fd6645cef6259a1b495afdfa';

    const result = await getContentListAsync(cookie, 1, '', 0, 20);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.status).toBe(0);
  }, 10000000);

  test('获取西瓜视频小视频列表', async () => {
    const cookie =
      '_tea_utm_cache_3062=undefined; MONITOR_WEB_ID=36562fad-0466-45cd-9826-1cd101fcf1a5; passport_csrf_token=29632347a66f8d1e51749835cb064ab2; passport_csrf_token_default=29632347a66f8d1e51749835cb064ab2; studio_web_id=7291914075281655346; Hm_lvt_5ef88140a857780eb79a65f7d563f9ef=1698024595; passport_auth_status=c380793b0b56d2275a10ec1b16430c10%2C2e669a4fabfb16c43e2efca32e5f0fa2; passport_auth_status_ss=c380793b0b56d2275a10ec1b16430c10%2C2e669a4fabfb16c43e2efca32e5f0fa2; sid_guard=3ce9d8c4fdd122a46c0021605f7a8363%7C1698025258%7C5184002%7CFri%2C+22-Dec-2023+01%3A41%3A00+GMT; uid_tt=59b7e5ff2c346463b334c673da06c742; uid_tt_ss=59b7e5ff2c346463b334c673da06c742; sid_tt=3ce9d8c4fdd122a46c0021605f7a8363; sessionid=3ce9d8c4fdd122a46c0021605f7a8363; sessionid_ss=3ce9d8c4fdd122a46c0021605f7a8363; sid_ucp_v1=1.0.0-KGMzZTUyZGRmMGE1MjEyZDY2MzA2NDNhYzI5MDk5MTllNDgxZjhkM2IKFQiZ8t_43AIQqp7XqQYY9hc4AkDxBxoCbGYiIDNjZTlkOGM0ZmRkMTIyYTQ2YzAwMjE2MDVmN2E4MzYz; ssid_ucp_v1=1.0.0-KGMzZTUyZGRmMGE1MjEyZDY2MzA2NDNhYzI5MDk5MTllNDgxZjhkM2IKFQiZ8t_43AIQqp7XqQYY9hc4AkDxBxoCbGYiIDNjZTlkOGM0ZmRkMTIyYTQ2YzAwMjE2MDVmN2E4MzYz; csrf_session_id=0105d819a56a8b36f402cbcabf20a8cb; s_v_web_id=f12b6064bee460ffb1d736b1d4ea05bc64d43061a68a932161; ttwid=1%7CTs4IVIuTKwndep8x1NcxA0yINuSxsw1yUtOrNg_EuVI%7C1698127334%7Ca43f2b03c43682e1236cf7bd17cd24efd53d41f5fd6645cef6259a1b495afdfa';

    const result = await getShortContentListAsync(cookie, 0, 20);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.status).toBe(0);
  }, 10000000);
});
