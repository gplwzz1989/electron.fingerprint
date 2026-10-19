import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { getContentListAsync } from '@/media-platform/pipixia/pipixia-content-list.service';

describe('【Mock】', () => {
  describe('获取皮皮虾作品列表', () => {
    const server = setupServer(
      rest.get('https://mp.pipix.com*/api/mp/bds/webapi/item_list/', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              status_code: 0,
              message: 'success',
              prompt: '',
              time: 1698311352271,
              data: {
                total: 49,
                items: [
                  {
                    item_id: 7283127054743116069,
                    item_id_str: '7283127054743116069',
                    item_type: 2,
                    create_time: 1695735160,
                    status: 0,
                    comments: [],
                    content: '单日再添19金！中国队断层领先亚运奖牌榜',
                    cover: {
                      width: 0,
                      height: 0,
                      uri: 'tos-cn-i-8gu37r9deh/oczSABA6IBliEEhmXNY3CTJAC63uWQMgAPAAfy',
                      url_list: [
                        {
                          url: 'https://p3-ppx-sign.byteimg.com/tos-cn-i-8gu37r9deh/oczSABA6IBliEEhmXNY3CTJAC63uWQMgAPAAfy~tplv-f3gpralwbh-noop-v4:0:0:q60.webp?x-expires=1729847352&x-signature=Y4nt%2BZNmxDEbvuu%2FLXNkRIUzXSg%3D',
                        },
                      ],
                      is_gif: false,
                      download_list: [
                        {
                          url: 'https://p6-ppx-sign.byteimg.com/tos-cn-i-8gu37r9deh/oczSABA6IBliEEhmXNY3CTJAC63uWQMgAPAAfy~tplv-f3gpralwbh-logo.jpeg?x-expires=1729847352&x-signature=e0nJQM1SsjeY4cHV7KbLskOHm1s%3D',
                        },
                      ],
                    },
                    share: {
                      share_url:
                        'https://h5.pipix.com/item/7283127054743116069?app_id=0&app=&timestamp=1698311352&user_id=93668768025&carrier_region=cn&region=cn&language=zh&utm_source=weixin',
                      title: '单日再添19金！中国队断层领先亚运奖牌榜',
                      content: '[皮皮虾] 搞笑娱乐神评论，皮这一下很开心',
                      image_url:
                        'https://p3-ppx-sign.byteimg.com/p1056/cbccb44c6fda4d2494f360ad7fa5dca1~tplv-f3gpralwbh-c5-v1:300:300:q60.jpeg?x-expires=1729847352&x-signature=HKJh8aZ6sOCYEMiLx%2F4fqotpAEY%3D',
                      compound_page_url:
                        'https://h5.pipix.com/bds_web/share/backup/?item_id=7283127054743116069&app_id=0&carrier_region=cn&region=cn&language=zh',
                      ios: {
                        channel: 1,
                        weixin_strategy: 4,
                        moments_strategy: 4,
                        qq_strategy: 4,
                        qzone_strategy: 4,
                      },
                      android: {
                        channel: 1,
                        weixin_strategy: 4,
                        moments_strategy: 2,
                        qq_strategy: 4,
                        qzone_strategy: 2,
                      },
                      link_text:
                        '单日再添19金！中国队断层领先亚运奖牌榜\nhttps://h5.pipix.com/item/7283127054743116069?app_id=0&app=&timestamp=1698311352&user_id=93668768025&carrier_region=cn&region=cn&language=zh&utm_source=weixin',
                      share_text: '[皮皮虾]单日再添19金！中国队断层领先亚运奖牌榜\n',
                      weixin_strategy: 4,
                      moments_strategy: 2,
                      qq_strategy: 4,
                      qzone_strategy: 2,
                      wechat_url:
                        'https://h5.pipix.com/item/7283127054743116069?app_id=0&app=&timestamp=1698311352&user_id=93668768025&carrier_region=cn&region=cn&language=zh&utm_source=weixin',
                      moments_url:
                        'https://h5.pipix.com/item/7283127054743116069?app_id=0&app=&timestamp=1698311352&user_id=93668768025&carrier_region=cn&region=cn&language=zh&utm_source=weixin_moments',
                      qq_url:
                        'https://h5.pipix.com/item/7283127054743116069?app_id=0&app=&timestamp=1698311352&user_id=93668768025&carrier_region=cn&region=cn&language=zh&utm_source=mobile_qq',
                      qzone_url:
                        'https://h5.pipix.com/item/7283127054743116069?app_id=0&app=&timestamp=1698311352&user_id=93668768025&carrier_region=cn&region=cn&language=zh&utm_source=qzone',
                      douyin_url:
                        'https://h5.pipix.com/item/7283127054743116069?app_id=0&app=&timestamp=1698311352&user_id=93668768025&carrier_region=cn&region=cn&language=zh&utm_source=douyin',
                      schema: 'bds://cell_detail?item_id=7283127054743116069&type=2&item_cell_type=1',
                      large_image_url: '',
                    },
                    author: {
                      id: 93668768025,
                      id_str: '93668768025',
                      name: '疯了的皮皮侠',
                      avatar: {
                        width: 200,
                        height: 200,
                        uri: 'tos-cn-i-8gu37r9deh/88b72ae6468d468a93b5fa48818f6031',
                        url_list: [
                          {
                            url: 'https://p3-ppx-sign.byteimg.com/tos-cn-i-8gu37r9deh/88b72ae6468d468a93b5fa48818f6031~tplv-f3gpralwbh-noop-v4:200:200:q60.webp?x-expires=1729847352&x-signature=oNfSfFLVjNagP%2FLmx3Os3MCNC3Y%3D',
                          },
                        ],
                        is_gif: false,
                        download_list: [
                          {
                            url: 'https://p9-ppx-sign.byteimg.com/tos-cn-i-8gu37r9deh/88b72ae6468d468a93b5fa48818f6031~tplv-f3gpralwbh-image.image?x-expires=1729847352&x-signature=4ZEBnakZSk%2FpNTF0VgbqGCQANTs%3D',
                          },
                        ],
                      },
                      is_following: null,
                      followers_count: 0,
                      followings_count: 0,
                      like_count: 81,
                      level: 0,
                      description: '',
                      profile_schema: 'bds://user/profile?user_id=93668768025&page_index=1',
                      is_followed: null,
                      god_comment_count: 0,
                      vote_count: 0,
                      certify_info: null,
                      achievements: null,
                      status: 0,
                      author_info: {
                        user_id: 93668768025,
                        username: '疯了的皮皮侠',
                        author_type: 104007473,
                        level: 0,
                        author_item_type: 1,
                        owner: 'script',
                        tags: [],
                        recommend_tag: '',
                        origin_status: 0,
                        AuthorStatus: 1,
                      },
                      broadcast_info: null,
                      live_auth: false,
                      region: 'cn',
                      language: 'zh',
                      punishments: null,
                      recommend_tag: null,
                      recommend_reason: null,
                      commerce_permission_list: null,
                      decoration_list: null,
                      interaction_limitation: null,
                      creative_level_info: null,
                      gender: 0,
                      age: '',
                      horoscope: '',
                      hide_age: false,
                      liveing_info: null,
                      medal_info: null,
                    },
                    stats: {
                      go_detail_count: 64,
                      impression_count: 802,
                      comment_count: 0,
                      like_count: 1,
                      share_count: 0,
                      play_count: 275,
                      dubbing_count: 0,
                      bury_count: -1,
                      bullet_count: 0,
                      digg_counts: [],
                      bury_counts: [
                        {
                          bury_type: 10,
                          bury_count: -1,
                        },
                      ],
                      view_count: 803,
                      reward_count: 0,
                    },
                    item_relation: {
                      is_like: false,
                      is_favorite: false,
                      is_bury: false,
                      digg_type: 10,
                      bury_type: 10,
                    },
                    default_schema: 'bds://cell_detail?item_id=7283127054743116069&type=2&item_cell_type=1',
                    vital_comments: null,
                    note: null,
                    video: {
                      video_id: 'v0304cg10000ck9dqp3c77uajko5k3hg',
                      text: '单日再添19金！中国队断层领先亚运奖牌榜',
                      hashtag_schema: [
                        {
                          base_hashtag: {
                            id: 156040,
                            id_str: '156040',
                            name: '朋友圈素材集中地',
                            intro: '皮友们，我很久没发朋友圈了，你懂的！',
                            status: 1,
                            icon: {
                              width: 200,
                              height: 200,
                              uri: 'tos-cn-i-0000/5fa9b10f39954e389168932124c1a9f7',
                              url_list: [
                                {
                                  url: 'https://p6-ppx-sign.byteimg.com/tos-cn-i-0000/5fa9b10f39954e389168932124c1a9f7~tplv-f3gpralwbh-noop-v4:200:200:q60.jpeg?x-expires=1729847352&x-signature=O%2BPwe%2BcSiVtgMpzSiHkGa1SzaOQ%3D',
                                },
                              ],
                              is_gif: false,
                              download_list: [
                                {
                                  url: 'https://p9-ppx-sign.byteimg.com/tos-cn-i-0000/5fa9b10f39954e389168932124c1a9f7~tplv-f3gpralwbh-logo.jpeg?x-expires=1729847352&x-signature=F8cQ79QAxrIjBeIW5dzEWoVMBI8%3D',
                                },
                              ],
                            },
                            background_image: {
                              width: 0,
                              height: 0,
                              uri: '',
                              url_list: [],
                              is_gif: false,
                              download_list: null,
                            },
                            activity_icon: {
                              name: '朋友圈素材集中地',
                              color: 'FFFF6880',
                              icon_image: {
                                width: 69,
                                height: 69,
                                uri: 'p1056/88c5ea2b90134313b99cf2f9a87e9ca1',
                                url_list: [
                                  {
                                    url: 'https://p3-ppx-sign.byteimg.com/p1056/88c5ea2b90134313b99cf2f9a87e9ca1~tplv-f3gpralwbh-image.image?x-expires=1729847352&x-signature=5nQbWqCr50NqZrcDndteFE5Lkmo%3D',
                                  },
                                ],
                                is_gif: false,
                                download_list: [
                                  {
                                    url: 'https://p6-ppx-sign.byteimg.com/p1056/88c5ea2b90134313b99cf2f9a87e9ca1~tplv-f3gpralwbh-logo.jpeg?x-expires=1729847352&x-signature=OKfT9mmUslIXmOxBlFiO4fkF%2FqU%3D',
                                  },
                                ],
                              },
                            },
                            tag: null,
                            extra: null,
                            intro_schema: [],
                            hashtag_type: 1,
                            jump_link: null,
                            top_status: 1,
                            top_item_ids: ['6979312462390630695'],
                            guide_word: null,
                            guide_text: null,
                            guide_link: '',
                            atmosphere: null,
                            avatars: null,
                            hashtag_top_type: 1,
                            top_gif: null,
                            top_text: '',
                            target_tcs_id: null,
                            target_tcs_id_str: null,
                            forbidden_post_item: false,
                            category_list: [],
                            action_start_time: 0,
                            action_end_time: 0,
                            boost_info: null,
                            sponsor_avatar: null,
                            sponsor_rank_schema: null,
                            create_time: 1625216908,
                            modify_time: 1625649293,
                            hashtag_position: [],
                          },
                          schema:
                            'bds://hashtag/feed?hashtag_id=156040&hashtag_text=%E6%9C%8B%E5%8F%8B%E5%9C%88%E7%B4%A0%E6%9D%90%E9%9B%86%E4%B8%AD%E5%9C%B0',
                          is_follow: false,
                          works_num: 4814,
                          followers_num: 19236,
                          status: null,
                          intro: null,
                          icon: null,
                          background_image: null,
                          tag: null,
                          extra: null,
                          enter_num: 1122960,
                          id_str: '156040',
                          show_num: 49709005,
                          display_tag: null,
                          display_tag_info: null,
                          is_host: false,
                          host_avatar: [],
                          host_user_ids: null,
                          is_visit: null,
                          new_item_num: null,
                          modules: [],
                          master_host_uids: null,
                          ordinary_host_uids: null,
                        },
                      ],
                      cover_image: {
                        width: 540,
                        height: 540,
                        uri: 'tos-cn-i-8gu37r9deh/oczSABA6IBliEEhmXNY3CTJAC63uWQMgAPAAfy',
                        url_list: [
                          {
                            url: 'https://p9-ppx-sign.byteimg.com/tos-cn-i-8gu37r9deh/oczSABA6IBliEEhmXNY3CTJAC63uWQMgAPAAfy~tplv-f3gpralwbh-origin:540:540:q60.jpeg?x-expires=1729847352&x-signature=Bmb8eAHMGeC5gH%2BVIR3%2BfQWh1XI%3D',
                          },
                        ],
                        is_gif: false,
                        download_list: null,
                      },
                      duration: 0,
                      video_width: 0,
                      video_height: 0,
                      title: null,
                      hashtag_module_map: {
                        '156040': {
                          id: 0,
                          module_name: '',
                          sort: 0,
                        },
                      },
                      video_download: {
                        uri: 'v0304cg10000ck9dqp3c77uajko5k3hg',
                        width: 540,
                        height: 540,
                        url_list: [],
                        cover_image: {
                          width: 540,
                          height: 540,
                          uri: 'tos-cn-i-8gu37r9deh/oczSABA6IBliEEhmXNY3CTJAC63uWQMgAPAAfy',
                          url_list: [
                            {
                              url: 'https://p3-ppx-sign.byteimg.com/tos-cn-i-8gu37r9deh/oczSABA6IBliEEhmXNY3CTJAC63uWQMgAPAAfy~tplv-f3gpralwbh-origin:540:540:q60.jpeg?x-expires=1729847352&x-signature=eU%2B%2FTcn32TZiegpQPeWVr5A34Zg%3D',
                            },
                          ],
                          is_gif: false,
                          download_list: null,
                        },
                        duration: 0,
                        alarm_text: null,
                        codec_type: null,
                        definition: null,
                        video_model: '',
                        p2p_type: null,
                        file_hash: null,
                        animated_cover_image: null,
                      },
                      video_low: null,
                      video_mid: null,
                      video_high: {
                        uri: 'v0304cg10000ck9dqp3c77uajko5k3hg',
                        width: 540,
                        height: 540,
                        url_list: [],
                        cover_image: {
                          width: 540,
                          height: 540,
                          uri: 'tos-cn-i-8gu37r9deh/oczSABA6IBliEEhmXNY3CTJAC63uWQMgAPAAfy',
                          url_list: [
                            {
                              url: 'https://p9-ppx-sign.byteimg.com/tos-cn-i-8gu37r9deh/oczSABA6IBliEEhmXNY3CTJAC63uWQMgAPAAfy~tplv-f3gpralwbh-origin:540:540:q60.jpeg?x-expires=1729847352&x-signature=Bmb8eAHMGeC5gH%2BVIR3%2BfQWh1XI%3D',
                            },
                          ],
                          is_gif: false,
                          download_list: null,
                        },
                        duration: 0,
                        alarm_text: null,
                        codec_type: null,
                        definition: null,
                        video_model:
                          '{"status":2002,"message":"未授权, 禁止访问","enable_ssl":false,"auto_definition":"","enable_adaptive":false,"video_id":"v0304cg10000ck9dqp3c77uajko5k3hg","video_duration":16.672,"media_type":"","popularity_level":0,"has_embedded_subtitle":false}',
                        p2p_type: 0,
                        file_hash: null,
                        animated_cover_image: null,
                      },
                      video_fallback: {
                        uri: 'v0304cg10000ck9dqp3c77uajko5k3hg',
                        width: 540,
                        height: 540,
                        url_list: [],
                        cover_image: {
                          width: 540,
                          height: 540,
                          uri: 'tos-cn-i-8gu37r9deh/oczSABA6IBliEEhmXNY3CTJAC63uWQMgAPAAfy',
                          url_list: [
                            {
                              url: 'https://p3-ppx-sign.byteimg.com/tos-cn-i-8gu37r9deh/oczSABA6IBliEEhmXNY3CTJAC63uWQMgAPAAfy~tplv-f3gpralwbh-origin:540:540:q60.jpeg?x-expires=1729847352&x-signature=eU%2B%2FTcn32TZiegpQPeWVr5A34Zg%3D',
                            },
                          ],
                          is_gif: false,
                          download_list: null,
                        },
                        duration: 0,
                        alarm_text: null,
                        codec_type: null,
                        definition: null,
                        video_model: '',
                        p2p_type: null,
                        file_hash: null,
                        animated_cover_image: null,
                      },
                      video_god_comment_urls: null,
                      animate: null,
                      transport: false,
                      transport_text: '',
                      support_live_photo: false,
                      tail_ad_passthrough: '',
                    },
                    link: null,
                    text_schema: [],
                    level: null,
                    source: null,
                    debug_info: null,
                    stage: null,
                    user_status: null,
                    post_source: 104007473,
                    expire_time: null,
                    review_status: null,
                    frozen_toast: '',
                    duration: 0,
                    video_type: 3,
                    related_id: null,
                    ancestor_id: '7283127054743116069',
                    origin_video_id: 'v0304cg10000ck9dqp3c77uajko5k3hg',
                    related_comment_id: 0,
                    ancestor_comment_id: null,
                    origin_video_download: null,
                    comment_post_item: false,
                    hot_info: null,
                    author_display_tags: null,
                    rating: 2,
                    ancestor_schema: null,
                    jump_link: null,
                    micro_app_id: null,
                    recreate_meta_info_list: [],
                    neihan_style: 0,
                    mapping_gids: null,
                    human_tags: null,
                    admin_debug: null,
                    ai_tag: null,
                    ward_info: {
                      is_ward: false,
                      ward_comment_id: 0,
                      ward_reply_id: 0,
                      ward_users: [],
                      ward_count: 0,
                      has_new: false,
                      trend_messages: [],
                      is_visible: false,
                    },
                    related_comment_id_str: '0',
                    interact_egg: {
                      like_style: 'default',
                    },
                    club_info: null,
                    album_intro: null,
                    episode_info: null,
                    drainage_info: null,
                    item_cell_type: 1,
                    can_download: true,
                    club_relation: null,
                    game_card_info: null,
                    privilege: {
                      bullet_play: false,
                      bullet_post: false,
                    },
                    activity: null,
                    show_feature_digg: true,
                    show_feature_bury: true,
                    promotion_info: null,
                    aha_image: [],
                    quality_level: null,
                    is_origin: null,
                    animations: null,
                    new_app_visible: null,
                    dup_item_schema: null,
                    position: null,
                    audit_info: null,
                    last_comment_time: null,
                    recommend_tags: null,
                    interaction_status: null,
                    is_best: null,
                    reward_info: null,
                    is_hashtag_top: null,
                    log_item_extra:
                      '{"item_source":"0","item_type":"2","item_genre":"4","item_quality":"4,6","hashtag_id":"156040","hashtag_name":"朋友圈素材集中地","hashtag_type":"1","item_refer_user_num":"0","post_source":"104007473","origin_source":"0","bullet_play":false,"bullet_post":false,"follow":1,"author_id":93668768025,"author_type":104007473}',
                    author_tags: '',
                    cell_ui_ctrl: {
                      show_author_tags: false,
                      image_style: null,
                      display_style: null,
                    },
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
        const result = await getContentListAsync('success', 1, 1, 20);
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.status_code).toBe(0);
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('获取皮皮虾作品列表', async () => {
    const cookie =
      's_v_web_id=lo6lzcby_e9baABks_ZmzB_4q3s_8mBt_u2KmIFwEoyfS; MONITOR_WEB_ID=36562fad-0466-45cd-9826-1cd101fcf1a5; csrf_session_id=b97990dd79d0f21207d188fe3ba642ba; passport_csrf_token=ee4d8ad08aee317a03779ec24a517a28; passport_csrf_token_default=ee4d8ad08aee317a03779ec24a517a28; n_mh=vzBueMd0IslOEX34KAK9JtrhFU5IBWqJZPtO8_uOKbw; sso_auth_status=e048dc4c72285d8feb930d94e0d600de; sso_auth_status_ss=e048dc4c72285d8feb930d94e0d600de; sso_uid_tt=d7e6cbad5fcd249f3ebec1fd8efa8d86; sso_uid_tt_ss=d7e6cbad5fcd249f3ebec1fd8efa8d86; toutiao_sso_user=1abcfe95fe49ecb1c782fdaa341892d0; toutiao_sso_user_ss=1abcfe95fe49ecb1c782fdaa341892d0; sid_ucp_sso_v1=1.0.0-KDA1NWJlNDc1MjUwYTdmYjdkNDI4YWNiZGUxNTc4ZjMwMmQ3MTUzMzgKFQiZ8t_43AIQrbLnqQYYpwo4AkDxBxoCbGYiIDFhYmNmZTk1ZmU0OWVjYjFjNzgyZmRhYTM0MTg5MmQw; ssid_ucp_sso_v1=1.0.0-KDA1NWJlNDc1MjUwYTdmYjdkNDI4YWNiZGUxNTc4ZjMwMmQ3MTUzMzgKFQiZ8t_43AIQrbLnqQYYpwo4AkDxBxoCbGYiIDFhYmNmZTk1ZmU0OWVjYjFjNzgyZmRhYTM0MTg5MmQw; passport_auth_status=67e243f719a4e3484d6bc7233a70024e%2Ca1a4bf4ca7393eb20103915ec9647bd5; passport_auth_status_ss=67e243f719a4e3484d6bc7233a70024e%2Ca1a4bf4ca7393eb20103915ec9647bd5; sid_guard=e82721fface46d64deb0ec289a2e9df9%7C1698289965%7C5184002%7CMon%2C+25-Dec-2023+03%3A12%3A47+GMT; uid_tt=9bcc4056c071f68e3a0db4e6fd0cefba; uid_tt_ss=9bcc4056c071f68e3a0db4e6fd0cefba; sid_tt=e82721fface46d64deb0ec289a2e9df9; sessionid=e82721fface46d64deb0ec289a2e9df9; sessionid_ss=e82721fface46d64deb0ec289a2e9df9; sid_ucp_v1=1.0.0-KDViZDhmNjQ3ODI3NGZmYTJhYmZkODk1MGU5NzI5Nzg3Y2ExNzZjMWQKFQiZ8t_43AIQrbLnqQYYpwo4AkDxBxoCbGYiIGU4MjcyMWZmYWNlNDZkNjRkZWIwZWMyODlhMmU5ZGY5; ssid_ucp_v1=1.0.0-KDViZDhmNjQ3ODI3NGZmYTJhYmZkODk1MGU5NzI5Nzg3Y2ExNzZjMWQKFQiZ8t_43AIQrbLnqQYYpwo4AkDxBxoCbGYiIGU4MjcyMWZmYWNlNDZkNjRkZWIwZWMyODlhMmU5ZGY5; store-region=cn-hn; store-region-src=uid';

    const result = await getContentListAsync(cookie, 1, 0, 10);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.status_code).toBe(0);
  }, 10000000);
});
