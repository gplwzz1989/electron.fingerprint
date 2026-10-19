import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { getContentListAsync } from '@/media-platform/toutiaohao/toutiaohao-content-list.service';

describe('【Mock】', () => {
  describe('获取头条号视频列表', () => {
    const server = setupServer(
      rest.get('https://mp.toutiao.com*/mp/agw/creator_center/list', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              code: 0,
              contents: [
                {
                  article_attr: {
                    abstract: '',
                    article_item_v2: {
                      AlbumData: {
                        AddToAlbum: false,
                        AlbumId: 0,
                        AlbumName: '',
                        CanAddToAlbum: true,
                        NoAddRightReason: '',
                        Rank: 0,
                        SeqsCount: 0,
                      },
                      ArticleAdType: 3,
                      ArticleStatData: {
                        CommentCount: 0,
                        CommentCountI64: 0,
                        DanmakuCount: 0,
                        DanmakuCountI64: 0,
                        DiggCount: 0,
                        DiggCountI64: 0,
                        FansCount: 0,
                        Income: 0,
                        PlayCount: 0,
                        PlayCountI64: 0,
                        RecommendCount: 53,
                        RecommentCountI64: 53,
                        RepinCount: 0,
                        RepinCountI64: 0,
                        ShareCount: 0,
                        VideoExclusiveIncome: 0,
                      },
                      ArticleStatus: 2,
                      ArticleStatusText: '已发布',
                      AttrsValueMap: {
                        InternalChangeVidInfo:
                          '{"original_vid":"v0d004g10000ckvlv9vog65ihhefrgbg","third_vid":"v0300fg10000ckvlv6bc77u29s9q0emg","original_poster_delay":0,"original_poster_uri":"tos-cn-i-dy/05e3eac869ff46dd8e54718f6eeb407c","change_scene":"asx_hot","step_bit":1,"create_time":1698652071}',
                        IsNeedInternalChangeVid: '1',
                        SubImages:
                          '[{"id":7295655532491391488,"scene":"video","uri":"tos-cn-i-dy/05e3eac869ff46dd8e54718f6eeb407c","WebUri":"tos-cn-i-dy/05e3eac869ff46dd8e54718f6eeb407c","Width":1280,"Height":720,"ImageType":1,"MimeType":"image/jpeg"}]',
                        SubTitles:
                          '[{"id":7295655608387174948,"text":"新款日产Serena即将申报，配天籁同款中网，预计14.98万起售！","visibility_level":60,"source":"author","master":1,"status":0,"version":"","rich_text":""}]',
                        aweme_mix_id: '7270422225616898083',
                      },
                      AuditData: {
                        FeedbackList: [],
                      },
                      AwemeItem: {
                        ArticleStatus: 2,
                        ArticleStatusText: '已发布',
                        StatData: {
                          CommentCount: 1,
                          CommentCountI64: 1,
                          DiggCount: 0,
                          DiggCountI64: 0,
                          Income: 0,
                          PlayCount: 99,
                          PlayCountI64: 99,
                          RecommendCount: 0,
                          VideoExclusiveIncome: 0,
                        },
                      },
                      BoostLandingUrl: '',
                      CanDelete: true,
                      CanEdit: true,
                      CanEditCommentLevel: true,
                      CanEditHideInfo: true,
                      CanHide: true,
                      CanJumpDetail: true,
                      CanNotDeleteReason: '',
                      CanNotEditReason: '',
                      CanNotHideReason: '',
                      CanNotJumpReason: '',
                      CanPublic: false,
                      CanShare: true,
                      CanTop: true,
                      ColumnID: 0,
                      CommentLevel: 1,
                      CommodityData: {
                        HasCommodity: false,
                      },
                      CreateTime: 1698652071,
                      DraftUpdateTime: 1698652071,
                      GroupSource: 2,
                      HideType: 0,
                      History: {
                        Items: [
                          {
                            ArticleStatus: 2,
                            CreateTime: 1698652071,
                            ItemStatus: 20,
                            Version: 0,
                          },
                        ],
                      },
                      IncomeComposition: 2,
                      IsCommerceVideo: false,
                      IsOrigin: false,
                      IsRewardProject: false,
                      IsTop: false,
                      IsVR: false,
                      ItemStatus: 20,
                      ShareUrl:
                        'https://m.ixigua.com/group/7295655095240000000/?app=video_article&timestamp=1698733645',
                      SyncToAweme: {
                        CanSyncToAweme: false,
                        IsSyncToAweme: false,
                        NoSyncToAwemeReason: '从抖音同步的视频',
                      },
                      SyncType: 2,
                      TimerData: {
                        CanPostNow: false,
                        TimerArticleStatus: 0,
                        TimerStatus: 0,
                        TimerTime: 0,
                      },
                      TortStatus: -2,
                      UserId: 93668768025,
                      VideoData: {
                        Abstract: '',
                        CoverUri: 'tos-cn-i-dy/05e3eac869ff46dd8e54718f6eeb407c',
                        CoverUrl:
                          'https://p3-sign.toutiaoimg.com/tos-cn-i-dy/05e3eac869ff46dd8e54718f6eeb407c~tplv-pk90l89vgd-crop-center:0:0.jpeg?from=3762548883&x-expires=1701325645&x-signature=EyrbekMGYlSHl%2B%2Byr3ZdJjHh6Yg%3D',
                        Duration: 123,
                        Height: 720,
                        IsLandscape: true,
                        OfflinePlayUrl:
                          'https://video-cn-public.bytedance.net/storage/v1/tos-cn-ve-15c001-alinc2/oMnIzeffw71Lef6LbZBpAQBPek0AiwBYATvJbc?a=32&ch=0&cr=0&dr=0&er=0&lr=default&&br=1024&bt=1024&cs=0&ds=3&mime_type=video_mp4&qs=0&rc=ZTQ1ZWk5Z2dkNTs1Zjc5ZEBpamppa2w5cjxvbjMzNDczM0AvNi4tNGM1NjMxYi1hXzE2YSNfb2JlMmRzc3NgLS1kLWFzcw%3D%3D&dy_q=1698733645&l=20231031142724C88B4A8F332FE114CE1D&x-tos-algorithm=v2&x-tos-authkey=5bf25627da095a5cba28ace592de46cc&x-tos-expires=1699943368&x-tos-signature=BJxBoXLV6PSVxjnl3Scb-IGHgAQ&caller=toutiao.video.biz_article_publish',
                        PlayUrl: 'https://www.ixigua.com/i7295655095240000000/',
                        Title: '新款日产Serena即将申报，配天籁同款中网，预计14.98万起售！',
                        VCloudPlayUrl:
                          'https://video-cn-public.bytedance.net/storage/v1/tos-cn-ve-15c001-alinc2/oMnIzeffw71Lef6LbZBpAQBPek0AiwBYATvJbc?a=32&ch=0&cr=0&dr=0&er=0&lr=default&&br=1024&bt=1024&cs=0&ds=3&mime_type=video_mp4&qs=0&rc=ZTQ1ZWk5Z2dkNTs1Zjc5ZEBpamppa2w5cjxvbjMzNDczM0AvNi4tNGM1NjMxYi1hXzE2YSNfb2JlMmRzc3NgLS1kLWFzcw%3D%3D&dy_q=1698733645&l=20231031142724C88B4A8F332FE114CE1D&x-tos-algorithm=v2&x-tos-authkey=5bf25627da095a5cba28ace592de46cc&x-tos-expires=1699943368&x-tos-signature=BJxBoXLV6PSVxjnl3Scb-IGHgAQ&caller=toutiao.video.biz_article_publish',
                        VideoID: 'v0d004g10000ckvlv9vog65ihhefrgbg',
                        Width: 1280,
                      },
                      VideoExclusive: {
                        CanCancelVideoExclusive: false,
                        CanNotCancelVideoExclusiveReason: '只有独家视频支持取消独家',
                        Type: 0,
                      },
                      ViewComment: true,
                      ViewData: true,
                      ViewIncome: true,
                      VisibilityLevel: 45,
                    },
                    article_type: 'video',
                    comment_status: 0,
                    cover_image: {
                      height: 0,
                      image_uri: '',
                      image_url:
                        'https://p3-sign.toutiaoimg.com/tos-cn-i-dy/05e3eac869ff46dd8e54718f6eeb407c~tplv-pk90l89vgd-crop-center:0:0.jpeg?from=3762548883&x-expires=1701325645&x-signature=EyrbekMGYlSHl%2B%2Byr3ZdJjHh6Yg%3D',
                      width: 0,
                    },
                    create_time: 1698652071,
                    duration: 123,
                    extra: {
                      impr_id: '20231031142724C88B4A8F332FE114CE1D',
                      user_name: '聪明的熊猫SIA',
                    },
                    gid: '7295655095240000000',
                    group_source: 2,
                    image_cnt: 0,
                    is_exclusive: false,
                    is_gallery: false,
                    is_question: false,
                    item_id: '7295655095240000000',
                    leader_sensitive: false,
                    menu_list: {
                      forbid_boost_reason: '',
                      forbid_change_ads_reason: '',
                      forbid_delete_reason: '',
                      forbid_hide_reason: '',
                      forbid_modify_reason: '',
                      forbid_sync_aweme: '',
                      forbid_timer_publish_reason: '',
                      forbid_to_detail: false,
                      forbid_to_detail_reason: '',
                      show_ads: false,
                      show_anonymous: false,
                      show_boost: true,
                      show_comment: true,
                      show_copy: false,
                      show_delete: true,
                      show_graphic2_video: false,
                      show_hide: true,
                      show_modify: true,
                      show_share: true,
                      show_stick: true,
                      show_sync_aweme: false,
                      show_timer_publish: false,
                    },
                    modify_time: 1698652071,
                    mp_id: 54,
                    pop_score: 1698652071,
                    rich_title: '新款日产Serena即将申报，配天籁同款中网，预计14.98万起售！',
                    show_time: 1698652071,
                    status: 2,
                    status_desc: '已发布',
                    status_list: {
                      is_anonymous: false,
                      is_from_writingo: false,
                      stick: false,
                      sync_aweme_status: 0,
                    },
                    title: '新款日产Serena即将申报，配天籁同款中网，预计14.98万起售！',
                    type: 3,
                    type_desc: '视频',
                    upload_status: 0,
                    verify_reason: '',
                    visibility_level: 0,
                  },
                  article_stat: {
                    answer_count: 0,
                    comment_count: 0,
                    counters: [
                      {
                        Count: 53,
                        Name: '展现',
                      },
                      {
                        Count: 0,
                        Name: '播放',
                      },
                      {
                        Count: 0,
                        Name: '评论',
                      },
                    ],
                    digg_count: 0,
                    go_detail_count: 0,
                    impression_count: 53,
                    play_count: 0,
                    repin_count: 0,
                  },
                },
              ],
              count: 10,
              end_cursor: 1695276781,
              has_more: true,
              message: 'success',
              page_time: [
                {
                  index: 1,
                  time_stamp: 0,
                },
                {
                  index: 2,
                  time_stamp: 1695120693,
                },
                {
                  index: 3,
                  time_stamp: 1694597652,
                },
                {
                  index: 37,
                  time_stamp: 1649341168,
                },
                {
                  index: 38,
                  time_stamp: 1648723689,
                },
              ],
              total_count: 373,
            }),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const result = await getContentListAsync('success', 1, 10);
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(0);
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('获取头条号视频列表', async () => {
    const cookie =
      'tt_webid=7278476931607217721; _ga=GA1.1.1952899537.1694652487; passport_csrf_token=372f72462c5a5c674aff3d62ec80c566; passport_auth_status_ss=b9d045f10bffd3e8db153ae08d56ff2b%2C90f7dfed05974cde181f11afd3a24921; sso_auth_status_ss=7de4bac58a53b0c817906b50d456315f%2C3985f460862241c1f308ad310f4aa959; sso_uid_tt_ss=6029e8532c46b0c87d029f4286408ada; toutiao_sso_user_ss=4811594b00c7e35f171a6b09d13a5f27; ssid_ucp_sso_v1=1.0.0-KGIwNWJiODQ3YzliYTZhNDBmYWQ2MWQxZWVjZTI2NjZhNzJjZDJiZTIKHQiZ8t_43AIQqp7XqQYY9hcgDDC_ssDUBTgCQPEHGgJobCIgNDgxMTU5NGIwMGM3ZTM1ZjE3MWE2YjA5ZDEzYTVmMjc; uid_tt_ss=6029e8532c46b0c87d029f4286408ada; sessionid_ss=4811594b00c7e35f171a6b09d13a5f27; csrf_session_id=b97990dd79d0f21207d188fe3ba642ba; ttcid=5337eade85da46f19bd04dc8e51cf4ac92; odin_tt=e691c699ebebe86259c5dc04d7e94a2e2fe0af57d362199c29201e1a304307da2450498f8378486c904e6c596fbef456; _ga_QEHZPBE5HH=GS1.1.1698722721.3.1.1698722731.0.0.0; ttwid=1%7CTs4IVIuTKwndep8x1NcxA0yINuSxsw1yUtOrNg_EuVI%7C1698722892%7Ca8e41d6f3665d7d0392ddd5bde2dc8fd55cbebd3448eb5ad85827bf26fb1b964; tt_scid=blsKPZK.cpB92A7QD-e4jS1BFhV8ypZvnYg1hFDWrk-G.eq64Dv2l6yPuO5Z68vW2e3b; msToken=8Hjl7WhA6vPBxvvWVqe1YzBYQRqvFwiPe9l7EQCmzfRguG-YRsztvUkxMGMTVJQ_dM92Ad9irK2Uwlf04hQsiiFaaRELYwrvjtCw7DhWLxNsvMsmTigxcaCC9Z5XUA==';

    const result = await getContentListAsync(cookie, 1, 10);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);
});
