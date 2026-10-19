import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { getUserHomeDataAsync } from '@/media-platform/zhihu/zhihu-user.service';
import { AccountService, Platforms, Zhihu } from '../../../src';

describe('【Mock】', () => {
  describe('获取知乎首页数据', () => {
    const server = setupServer(
      rest.get('https://www.zhihu.com*/api/v4/creators/new_task/homepage_card', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              list: [
                {
                  token: 'upgrade_level',
                  data: {
                    level_axis: {
                      current_level: 4,
                      current_score: 9046,
                      points: [
                        {
                          level: 1,
                          need_score: 0,
                          right: '',
                        },
                        {
                          level: 2,
                          need_score: 250,
                          right: '',
                        },
                        {
                          level: 3,
                          need_score: 600,
                          right: '',
                        },
                        {
                          level: 4,
                          need_score: 2500,
                          right: 'super_vote',
                        },
                        {
                          level: 5,
                          need_score: 9500,
                          right: '',
                        },
                        {
                          level: 6,
                          need_score: 24000,
                          right: '',
                        },
                        {
                          level: 7,
                          need_score: 60000,
                          right: 'RightIncome',
                        },
                        {
                          level: 8,
                          need_score: 115000,
                          right: '',
                        },
                        {
                          level: 9,
                          need_score: 225000,
                          right: '',
                        },
                        {
                          level: 10,
                          need_score: 450000,
                          right: '',
                        },
                      ],
                    },
                    pins: {
                      card_list: [
                        {
                          link: 'https://www.zhihu.com/topic/28454227',
                          title: '和知友们一起讨论 #四大名著考考你 吧',
                          token: '28454227',
                        },
                        {
                          link: 'https://www.zhihu.com/topic/28535522',
                          title: '有 2000 知友正在讨论 #人生毕业照',
                          token: '28535522',
                        },
                        {
                          link: 'https://www.zhihu.com/topic/28541597',
                          title: '分享一下关于 #选调过来人 的看法吧',
                          token: '28541597',
                        },
                        {
                          link: 'https://www.zhihu.com/topic/28495400',
                          title: '和知友们一起讨论 #珍藏表情包大赏 吧',
                          token: '28495400',
                        },
                      ],
                    },
                    questions: {
                      card_list: [
                        {
                          icon: '',
                          title: '大众一般都买哪些牌子的智能手表？',
                          sub_title: '试试帮她解答~',
                          link: 'https://www.zhihu.com/question/627167136',
                          token: '627167136',
                        },
                        {
                          icon: '',
                          title: '2023年智能手表有哪些推荐？',
                          sub_title: '试试帮她解答~',
                          link: 'https://www.zhihu.com/question/628053045',
                          token: '628053045',
                        },
                        {
                          icon: '',
                          title: '乳胶垫发黄了怎么办？',
                          sub_title: '你可能感兴趣',
                          link: 'https://www.zhihu.com/question/628188574',
                          token: '628188574',
                        },
                        {
                          icon: '',
                          title: '双11，有什么好的床垫产品推荐？',
                          sub_title: 'Molicjz 在线等你解答',
                          link: 'https://www.zhihu.com/question/628367211',
                          token: '628367211',
                        },
                      ],
                    },
                    self_recommend: {
                      description: '推荐创作内容，获得更多流量曝光',
                      link: 'https://www.zhihu.com/creator/recommend',
                      title: '内容自荐',
                    },
                    tasks: [
                      {
                        task_id: 1086,
                        title: '发布 1 篇 100 字以上的回答',
                        sub_title: '5',
                        status: 0,
                        has_goal: false,
                        goal: 1,
                        progress: 0,
                        extra: {
                          name: '',
                          app_link:
                            'zhihu://compose_answer_tab?default_selected_page=1&extra_from=creator_center_mission&page_source=creator',
                          web_link: 'https://www.zhihu.com/creator/featured-question/invited',
                          introduction: '',
                          new_app_url: '',
                          task_second_type: '1',
                          new_web_url: 'https://www.zhihu.com/creator/featured-question/recommend',
                        },
                        task_type: 'creator_task',
                      },
                      {
                        task_id: 1087,
                        title: '发布 1 条 20 字以上带 3 图的想法',
                        sub_title: '15',
                        status: 0,
                        has_goal: false,
                        goal: 1,
                        progress: 0,
                        extra: {
                          name: 'DayOnePin',
                          app_link: 'https://www.zhihu.com/appview/topic/v2/playground?zh_hide_nav_bar=true',
                          web_link: 'isPinModal',
                          introduction: '',
                          new_app_url:
                            'zhihu://community/short_pin_editor?editState=true&cursorPosition=begin&sourceType=task&openScene=dialog',
                          task_second_type: '2',
                          new_web_url: 'isPinModal',
                        },
                        task_type: 'creator_task',
                      },
                      {
                        task_id: 1088,
                        title: '赞同 1 篇认可的内容 \t',
                        sub_title: '3',
                        status: 0,
                        has_goal: false,
                        goal: 1,
                        progress: 0,
                        extra: {
                          name: '',
                          app_link: 'https://www.zhihu.com/followfeed/recommend',
                          web_link: '',
                          introduction: '',
                          new_app_url: '',
                          task_second_type: '3',
                          new_web_url: 'https://www.zhihu.com/follow',
                        },
                        task_type: 'creator_task',
                      },
                      {
                        task_id: 1089,
                        title: '关注 1 位感兴趣的知友',
                        sub_title: '3',
                        status: 0,
                        has_goal: false,
                        goal: 1,
                        progress: 0,
                        extra: {
                          name: '',
                          app_link:
                            'https://www.zhihu.com/appview/feed/user_square?ab_signature=CiRBQkJYWkFkbGpCWkxCWGl2QnAweGNOMEVYelBuTXNzVEozcz0SIGEyY2IzNTBhY2MyN2I5MDFmNGIzZjRlZmMyZDYzYjY5GhEIARIGOC41Ny4wGgUxNTIyNg==',
                          web_link: '',
                          introduction: '',
                          new_app_url: '',
                          task_second_type: '4',
                          new_web_url: 'isFollowModal',
                        },
                        task_type: 'creator_task',
                      },
                    ],
                  },
                },
                {
                  token: 'earn_income',
                  data: {
                    today_income: 0,
                    total_income: 0,
                    yesterday_income: 0,
                  },
                },
                {
                  token: 'creation_statistics',
                  data: {
                    interaction: {
                      total_follower_count: 62,
                      yesterday_follower_count: 0,
                      total_read_count: 0,
                      yesterday_read_count: 138,
                      today_read_count: 46,
                      total_upvoted_count: 0,
                      yesterday_upvoted_count: 0,
                      today_upvoted_count: 1,
                      total_video_play_num: 0,
                      yesterday_video_play_num: 4,
                      total_comment_num: 0,
                      yesterday_comment_num: 0,
                      total_thanked_num: null,
                      yesterday_thanked_num: null,
                      total_collected_num: null,
                      yesterday_collected_num: null,
                      total_7d_read_count: 969,
                      total_7d_upvoted_count: 2,
                    },
                    lastest_creation: {
                      basic_info: {
                        type: 'zvideo',
                        data: {
                          id: '1702778454825607168',
                          url_token: '1702778454825607168',
                          title: '半速集合啦~上车！',
                          excerpt: '半速集合啦~上车！',
                          thumbnail: 'https://pic1.zhimg.com/v2-ca8755415389c5bff63b244dc3de05ab_r.jpg?source=117bd250',
                          comment_permission: 'all',
                          duration: 11.632,
                          created_time: 1698754021,
                          updated_time: 1698755272,
                          co_creation: {
                            is_co_creation: false,
                            own: 1,
                          },
                        },
                      },
                      interaction: {
                        comment_count: 0,
                        reviewing_comment_count: 0,
                        vote_up_count: 0,
                        read_count: null,
                        like_count: 0,
                        collect_count: 0,
                        play_count: 3,
                        repin_count: null,
                        reaction_count: null,
                        view_count: null,
                        answer_count: null,
                        follow_count: null,
                      },
                    },
                  },
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
        const result = await getUserHomeDataAsync('success');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.list).length(3);
      });
    });
  });
});

describe.runIf(true)('【真实测试】', () => {
  test('获取知乎首页数据', async () => {
    const cookie =
      '_zap=06dc3a78-192f-4c2a-bb46-759af275de91; d_c0=AHAWkIgiVBaPTvmafr3ufkZBSjGnrlshzYA=|1676383319; _xsrf=CCiQPKwIFK1ByYUmNluRkw8vSHJQv2Pn; __snaker__id=WGQ5txxQ5yFO1CcX; YD00517437729195%3AWM_TID=V5WbGn4nasFBAABUVAPAnONMBbXYsZdQ; q_c1=5e063e8e2b2d41379bdf6cae1074cfc0|1697590976000|1697590976000; tst=r; SESSIONID=mD1xLEEZQ2rjoyB4ho7Zm62lCU8v59fnJAeMLhDFBkv; JOID=UlAUCk1yiX6j5YhJCnoHLjw3FzMcF8RH1K_FBVglswXBhfcDNystPc_riUgNHAaLRFzikoliKGBx1a4ycwvh0kE=; osd=U1gSCkhzgXij4IlBDHoCLzQxFzYdH8JH0a7NA1ggsg3HhfICPy0tOM7jj0gIHQ6NRFnjmo9iLWF50643cgPn0kQ=; YD00517437729195%3AWM_NI=qrAr8Y1jIGw2F4CINaVr5CrzNhgRJxWvTqmNTBrqBpuWo0moWpGlqU%2FFO9%2BHJXlveVjYXHnQuVKaLtBKa0Ro5JUpyyx0k7wp01j8JXTHOvVV2wf4Ux6lLRqX8d%2BOBuyyYUQ%3D; YD00517437729195%3AWM_NIKE=9ca17ae2e6ffcda170e2e6eea9d4428287e1a7d64aed928ab3d54f828a8fb0c467fcbca5a4bc72ac8aa9aab32af0fea7c3b92ab3ae8f93bb53f3b687a8f63a86ec8daacd6b96aefba4f1728eb8a9b3c97495aa9c92f046989ebe92c17cb789a1d1f06595b0898df45fed9a81daaa448a88a497e85eaa8798a9ed5bb78a8582cf808295afd1d165f7969b91fc73bcf0a5d8f67cf4efa6d9c95498988197d55ef2a9aad5d874f6b484b3f454fcbce5b0c17fbba797b6d437e2a3; gdxidpyhxdE=k09rrojBJ83XnR1ZvOtx0un1CS8YrhcN0dVw5RiI2K0%5CbtSIgtr7vUT%2BqUYfAd%2F%2BUoIrEpd5tnH5fJclKDLVLfn6fMGQ5wWazWO4ERvuuDrML%5CN9LCWZzXkY2VYYbAYJ5d%5CU5MdQKxje%2BsaKCcRU8pCTJnVX%2F%2FeYb3NZzL%2FYXN7c53t1%3A1699001024235; captcha_session_v2=2|1:0|10:1699000387|18:captcha_session_v2|88:bC9jc3UzZXhwYkwvTXBFR0N0N2EvN25QQk1OUEF0Nmk0WHFTZy9uL0NZd2RvcWQyc2Vtd21sTUNaRlV3dVpYaA==|864d5d083870987ab941afd5dfa0ee6a3e0d431ad894d63b98aa8d201aeeb4ec; captcha_ticket_v2=2|1:0|10:1699000402|17:captcha_ticket_v2|728:eyJ2YWxpZGF0ZSI6IkNOMzFfNWoxNktvRipyU05Ec3k5a2phNnVVbXNYcWd1Q1pkVVpWNDlBZE5NS0oqS3dXamtIQ1hyUkhJMXl2VGdobE5WYUpXRi5FKnEzY3doY2N4elBRZElRS3J6TTUxM3dTWUNYaXFhbGhRa19ITypmMXloRE1oQ2dNR09BWm9EM3hwUmI5RVpiQ0dlKnhaelM4MEJFQ2JsS29KelVjeVdOaWJOOCpMRTVCV1RlejVFbUVrbVdnRkczWFFFSjBMb1NJMEdXNFJLMU42U2tsNS5TNnRLYmUzYTlpVFVhOFlMOExTOGhCUUFxU0FFSGFUOTFHcHpDa0tQdEVfcmxfV3ZNVGNWT0MyNFlrUVVSQ0puSjRsNVA5M0wzcEV3V0xmRG9ianZCVEVELmpzc19DOVguRjlSVmpIX1EwZ05OcWlqQ0lkTUJuWDRlUGdWOUppZUp1TjZnMWgzYWlNVFk5VGtab2sxbzJRQnpkNkZkNU8zZ0l1T0Y1cmtWc3JPSzhCRGdyS01EMVgzV3N0VW0qYXI5enpiMjE2QURyNnFkRUZlS1lIWU5pUzROTGFCNFhFNVJHekRUSFpkUEhrLjFDVzZPSFV6VlFodnppSEVvYk9QQ2JNengwQmxfbmMuemY0QkVCSkt3YzE0S3BlbVN4eVBCSmZWc0RnR3hVOVZrcWJDd1F0T284VnNmV2c3N192X2lfMSJ9|bec81214d3337181ef6dc5a2da3fcf10310500e5ab8e20a716949a38b9ecd377; z_c0=2|1:0|10:1699000403|4:z_c0|92:Mi4xX0p2bkNnQUFBQUFBY0JhUWlDSlVGaVlBQUFCZ0FsVk5VdjR4WmdCRmhPbmo0TVYtSkZJUUp6NV9IbUVySXQ2RHpB|ba3602afa889ac2f4bd1ecbd6a78a7ae646127b3bc6bd36e8f6e11091d61b5e6; SUBMIT_0=c2bb75ee-f665-43ad-be41-d0ace77edc8e; KLBRSID=4efa8d1879cb42f8c5b48fe9f8d37c16|1699001781|1698997591';

    const result = await getUserHomeDataAsync(cookie);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.list).length(3);
  }, 10000000);

  test('获取知乎用户信息', async () => {
    const cookie =
      '_xsrf=C8BgKZRwq2JkqBa62RQgTGZwDAa560PT; _zap=e605ed55-b6f6-4e37-a1d1-4800c283a52a; d_c0=AVDS6QAK_RmPTsg_m4MtI2fwf1HENNKLk70=|1739257894; Hm_lvt_98beee57fd2ef70ccdd5ca52b9740c49=1743650750; HMACCOUNT=67D5C53B67395D08; captcha_session_v2=2|1:0|10:1743650751|18:captcha_session_v2|88:dU0xWUZSWWZFVFN4K3llVWVlN2lCcytKZEhoRmhLc3RpVldncTZVREpnYllXOXUvM1k3Mk9kWHRnTGkyVHlORw==|534ebd215627467a6052189463c7c50744242c6fd3674403f1f4cd109c94b2e0; SESSIONID=TsL3Oc4jGv5a1WAuOXMEeUWlMofitB8zgz5oqBx7wif; JOID=W18RBE54CWgRqdUBCHbZNrHEpD0fInknIOq4NmEzcV5zmo5Ofsr2hHir2AEJmVU76zEvA3CUK43ylaEPsjbFk0Y=; osd=WlARAUN5BmgUpNQOCHPUN77EoTAeLXkiLeu3NmQ-cFFzn4NPccrziXmk2AQEmFo77jwuDHCRJoz9laQCsznFlks=; __snaker__id=1sAgK81d6WiTVYXj; gdxidpyhxdE=KLiwJbjKYviJbIpE%2BlCXZpvHoWnv%2FzYtoyDqivzHhcwfd7xqVwjwRuU8c%2Fx2vGoEnc1MY7J%2FywomQHLsbagQ0U%5CaucKVA1C7jSmHexAxuAui%2Bauouc7Z%5CA%2B26xbmH6uUpjRQ3fpXgLDj1KO1%2BvLxbDjpQBuB0nC6kg%5CbQsaVBayohpqg%3A1743651651565; captcha_ticket_v2=2|1:0|10:1743650776|17:captcha_ticket_v2|728:eyJ2YWxpZGF0ZSI6IkNOMzFfeUlwX3NUQTg5bmlCZlhQNmVVOUFpVDBfNW9RLk8qck5GLmdoX01CX3dSKlBoVXE4VFFocEtsVmFPak0qTyo0M204aEVXT1dxcW5oc2dFYTB1amNVMUdibUZYVnBic1NaYVlMZF8uVHdlc2Fsb2RkZ0g4MkxfOHVQZDBpY2RCcHk1b0R5cnB1YnRsVlFoYVFmZ21saHBWbGt1UmpLcVh5cGttbnpJbjFMSVdvX05JWmxnMldDaXdRVkhIYXVoZ0dSdmhuR2Y4ZypiMjYuQ01td0VQc2tsTTVHaEpKLkZaaXRhVFRpczlqTC5NbUVCMFY0azhEd2MwaVZBTXE2RjlJNFIuc0pOd3pSZ0ZBQjYwdHU4ako1MGNEdzVMZzJROCpwLjJIWnJmWW5UbHR1VnBZODAucHFUdzZJaTBVM1YxS0FMbmladlQ2R0hPRzFNWWY1Kk90aVcqc1VLWjZfOEhPaXJIUnNLa3ZsSUF4VjJEQ0lWRlFEMnlIY0R6VEhWdkxqbkhjeFZuQktLUF9NbmFacUsxTkhzd3ZXcDh4T29zV2lqTVlXQ0V1a0d1NUVrQVFpc2VtNllWTHVxNWluR2ltODNndWtfKnpsMlMzV3RLdmExWmxpM216eVhpYmRSNmhibnIyd1Q5QlJSZ21URXFwKlppRFFBZUd1MVMqTWprM05Sa2FTVVk3N192X2lfMSJ9|421877876a55e0d04f3cec994843a9cf8977b4fb070e246042e7d5fe5c02f006; o_act=login; ref_source=other_https://www.zhihu.com/signin; q_c1=30547214b6704c9c83402b74d6baa3f5|1743650932000|1743650932000; tst=r; z_c0=2|1:0|10:1743650934|4:z_c0|92:Mi4xM3RIVlhRQUFBQUFCVU5McEFBcjlHU1lBQUFCZ0FsVk5WMDdiYUFCSTJZWUFTMVdiUk9BeHYxdTRST2J0YmpJVXF3|662e6c5f9814349f062a871576dbfb8c89a1ebc9ae5863afc50e88fe440d466e; __zse_ck=004_/RlMkxe5xgxlhLjZjA8mWylY/EjExPj7WFucXj6LPkqkDXeDcmuUmj1wMR1U2PPbM21buceiQL6cvIKA3v=go3hSnVDxSbl5=kyjaUD0suRPM60XVZ2YuwrF064Hw9Dz-D6unwVRtKRLtKkC1pJLJslC14qBfx/ypt1/J93XvG0BzgiY8rwLaKhcbieFacbsPBo/OMcBePKNDB0tWGXAC49yWzZNnIRS6fOWjDf4tuLVREx6tFO6NvTleOcFrI2yo; SUBMIT_0=4629fbb5-37ba-467a-a587-8fad2bff3096; BEC=d6322fc1daba6406210e61eaa4ec5a7a; unlock_ticket=GKLT4v9_PhomAAAAYAJVTZcJ7mf4s0OX9s8jMel-lgI-qhR6Sul0Bw==; Hm_lpvt_98beee57fd2ef70ccdd5ca52b9740c49=1743652047';

    const result = await Zhihu.getZhihuUserInfo(cookie);
    console.debug(result);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('检测用户有效性', async () => {
    const cookie =
      '_zap=ef68fb3d-4349-460f-82e5-2ac01d2b94c2; _xsrf=a0228dcb-1111-47f6-941f-34a57f07f762; BEC=8ce9e721fafad59a55ed220f1ad7f253; Hm_lvt_98beee57fd2ef70ccdd5ca52b9740c49=1750389980; Hm_lpvt_98beee57fd2ef70ccdd5ca52b9740c49=1750389980; HMACCOUNT=10CB27C0A9EAD21B; d_c0=bvbTFozrohqPTjL1M-fPMEQFm_8ARqt4Xpk=|1750389982; captcha_session_v2=2|1:0|10:1750389982|18:captcha_session_v2|88:WmVJODY4OGtjeW1QQXQwaGZWUVBMdHJqaDE5L2gvazFEbEJjbjZ1czZVTXBTTkFsd2xvOUpoY3ZTV1hUSGg1cg==|a431c2d73aa550c4a28245ae3934dfb0f61ae27f6781677e5b2ae3c0f1af98c6; SESSIONID=VNfn9bubyiXiGoexnEyTli7gov46npLr0vHYEeco9zk; DATE=1750389981120; assva6=U2FsdGVkX19fgTGWm9F+41/PMV0wy7CuqJI31nFFWoc=; assva5=U2FsdGVkX18uw/pFaU0K2yQ0MP8gihODgyT9B5kaqL9Z10c2HBT89f1scCf5FX1ZFmUdCbv7WHWCpkdjsm/6UA==; __snaker__id=EwjsIwSKEveaUMmk; cmci9xde=U2FsdGVkX187lGm+sPPULVAS2GEtuOnvmT013c5lfN1PrtRNTMvXHQQhsmSKD06g1Y3I44mfuPVrdGRedx0krA==; pmck9xge=U2FsdGVkX19EpnHbj5qrLdttoI0W+n+mr1b725zrc9s=; crystal=U2FsdGVkX1/O+yTQU2xFU9b6pD787YFhy4VE58E0NGuca0xj3r6vDi/5HzLZmn2K5bs5wZ7R+Cr8ZATtH9khzSU1okC2bfwbw4gMuZHpOKPq+8nCFns0dR8WGEEOh1ncnWfLgORmKPO4Ml7mWG6vn9DgW17zcSOQYaFvo282vt/Hy6B5SuLiSLlKABgWq7m2sAAbXHqRNYRX7b/e3Fa6v2Jzj9j5vUkxibORdfNsd8hTbGCQZHv5mUWB1v3LRi1Y; JOID=U1gQCkrK-rRVq6sxH7TsJPAjSJIBnbHeM5LIQXGzkukw5MRVYhAn5DWqrzgbY2BSPRfZlLfUVNrnJ3-4OT6CaWA=; osd=WlgcC0LD-rhUo6IxE7XkLfAvSZoInb3fO5vITXC7m-k85cxcYhwm7DyqozkTamBePB_QlLvVXNPnK36wMD6OaGg=; vmce9xdq=U2FsdGVkX1+hWhc/xS0bHLy91B5wa/nGz90A69FoY420Rz/f4QhgRZtjrlJz2QbIYJfJnujTrUYcBNpA/F7aMAIm104KfRDxwphYvZlEXyBiXdJNBtuNod27lnUDtRlIrr109815yx8GnnM4VMOS3HmXqspUewjis8im7yfIMvM=; gdxidpyhxdE=n3gv9P3TIlDeGYdUS4DenO4WnGVcOtLg%2Fckvvr2MTMPy7GwGi9PB%2FsZB%2Foy9zYCkyLRJvNOZynOkc65pyOw6%5CAyM5fEShHP11fMnZEKlDe1hcyKDQZBVb0xoppTN3zL1GLB6QJWTdnQL5jolvvpEarT5rSPdKIKZIoE5uBtlsnThGWCt%3A1750390882159; captcha_ticket_v2=2|1:0|10:1750389992|17:captcha_ticket_v2|728:eyJ2YWxpZGF0ZSI6IkNOMzFfemxfTFhJSEVRT3Z5YlBidF8zLkQ2bjkxTktVdkVSd090VkZMZ09FRU0qWEJaZzQzc2ZvQkhvX0R4cjQ4b0M4ODVnNmxzNDE1SzMyZndMRE5OaTZhU2ZyUEg2d3lpVk1oa3pBWGMzNmc4b2NKREN2S2Y2bEhDTmI1eHkuRk52U3YzKkp2X09veFJWSUhwNnRXNGFDT0Q5TVduMW1EQndfR1hGQUpVeDhvd2o4c0daQnZXa0xRdnNaNCptQ00xY0Q4ZTlCVEVQU0lpSWVnYTVKVnF1VG5tSEFZZ1NLdV9QSnNSd0VEczZtZ2JBKldqbEQxUWtlU1M1NlZqMDJCQ09WWkxCVnhlMHMuYjZVOC42X3lSX0kqX1BaaXdjVVZ2QnZYbmh3R2llczJyZUtwOVRBTGQ2R0xvQyo2alpINFdtZjNJRjlSbzJ4b2FpdWJEQnBGekJxUFdpTWxYVXRpcG96QzVhZGlHMXJUMipDaklrcnVmX2RtV19zWVZUeUgwYWI5OF9tWUhtOWJ0aEpZU0pDYk1RWnVkVy5hQ2p2bEtwTWZJRkE5OWI4X0ZiNTFWX3dYRE9WbWxCRGZUNENWRkJ0ZjJEeTJkS2gyUGVoQ1B3TUE1ZDRiNXpBVTBiX09LRHlpdEdyVF9sZmVxSnU2REJxYm5TbVFzM3BpSlFWdWVUUjR6MG5wY1k3N192X2lfMSJ9|af262a7b9a761da324b3ff68df91a02f41fc143b4925258b0e1e75b52911834f; z_c0=2|1:0|10:1750390022|4:z_c0|92:Mi4xd0VTUFJ3QUFBQUJ1OXRNV2pPdWlHaVlBQUFCZ0FsVk5CaU5DYVFCQ0tKQ3lLQ3JKSmJxczBaU1NkLVRHUmVLQ25B|c927c927acda3ca4a5d99af2ab1cde225e78891f9d191f8a1a067ef8d90be1b0';
    const result = await new AccountService(cookie, Platforms.ZhiHu).checkAccountAlive();
    console.log('有效性:' + result);
    expect(result).toBe(1);
  });
});
