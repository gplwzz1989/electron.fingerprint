import { describe, expect, test } from 'vitest';
import { Toutiaohao, ToutiaohaoVideoTaskInput } from '@/media-platform/toutiaohao';
import { EventEmitter } from 'events';

describe.runIf(true)('【真实测试】', () => {
  test('头条号视频发布测试', async () => {
    const cookie =
      'gd_random=eyJwZXJjZW50IjowLjM3NDgxOTQ3NjI2OTg3NjQ0LCJtYXRjaCI6dHJ1ZX0=.xX8n8+xP0/fujusXunt33Uf+Tuh6APxMWIdroDEwOGA=; s_v_web_id=verify_msr3k4me_ZeBOeVQr_7Yg3_4EQ0_9z34_ly1lilknplYE; passport_csrf_token=db90e7da9c94162a0275477e951ee9fc; passport_csrf_token_default=db90e7da9c94162a0275477e951ee9fc; passport_mfa_token=CjVqiZS4sgHaDFz3ZG7pMUWhIgufN%2B7dRRAhSmc0YwLRP7%2BqcE%2B6Dy%2BNOIpbyS4bRSrEYoIO2hpKCjwAAAAAAAAAAAAAUMZuUDm9nzmCR0v%2BE6Z71v87VHT1JC%2BjXnicoAVk34Etcag7qVckbcbPC3PN5r7%2BGMEQk7aZDhj2sdFsIAIiAQOVgvL9; d_ticket=c69ef152946788761bac6695bece7fda66b94; n_mh=NiapHmvsv_kDNVSiFvIHBvsbNE4_RRoW3EqcWkBYrBU; sso_auth_status=c9f82f2752fd3b74470668a0a1fd43fd; sso_auth_status_ss=c9f82f2752fd3b74470668a0a1fd43fd; sso_uid_tt=f43495b95f7a6daa7f35d133d5ae75ca; sso_uid_tt_ss=f43495b95f7a6daa7f35d133d5ae75ca; toutiao_sso_user=5dabd86f321e33a92e389b067ada32d8; toutiao_sso_user_ss=5dabd86f321e33a92e389b067ada32d8; sid_ucp_sso_v1=1.0.0-KGUzMTYxOTJlNWI5MTQwNzYzMWQwYzRlYjFmMTBkYTZkOGQwOTY5NGIKHQiCva_l-wEQrrX10wYYzwkgDDCK-pLNBTgCQPEHGgJsZiIgNWRhYmQ4NmYzMjFlMzNhOTJlMzg5YjA2N2FkYTMyZDg; ssid_ucp_sso_v1=1.0.0-KGUzMTYxOTJlNWI5MTQwNzYzMWQwYzRlYjFmMTBkYTZkOGQwOTY5NGIKHQiCva_l-wEQrrX10wYYzwkgDDCK-pLNBTgCQPEHGgJsZiIgNWRhYmQ4NmYzMjFlMzNhOTJlMzg5YjA2N2FkYTMyZDg; odin_tt=bf9b2620846966e8fe45d9ad2b03fc1639253a513bcee28c2e937bf913bdcd93125072e31d96a417d7f4c0cb2711b092; passport_auth_status=3aaf907799b550897b13ea0fd17c44a3%2C8cad0eaa752c15a9bb511f23ed44caa5; passport_auth_status_ss=3aaf907799b550897b13ea0fd17c44a3%2C8cad0eaa752c15a9bb511f23ed44caa5; sid_guard=ee4d297c4453f2334eb95eb64adbe22c%7C1786600110%7C5184001%7CMon%2C+12-Oct-2026+05%3A48%3A31+GMT; uid_tt=e81b664b94a1d011fcaaf88e7d3eeacd; uid_tt_ss=e81b664b94a1d011fcaaf88e7d3eeacd; sid_tt=ee4d297c4453f2334eb95eb64adbe22c; sessionid=ee4d297c4453f2334eb95eb64adbe22c; sessionid_ss=ee4d297c4453f2334eb95eb64adbe22c; session_tlb_tag=sttt%7C7%7C7k0pfERT8jNOuV62StviLP________-vnvD0EzpLJTB471SqtiW09zIGmLE5JBxmbuIEY_t1y1Q%3D; is_staff_user=false; has_biz_token=false; sid_ucp_v1=1.0.0-KDgyNTZiNGZlNWZjNTgzNjY1MTk1ZTFlZjc0OTViNmRmZjhhNWVmNGEKFwiCva_l-wEQrrX10wYYzwkgDDgCQPEHGgJscSIgZWU0ZDI5N2M0NDUzZjIzMzRlYjk1ZWI2NGFkYmUyMmM; ssid_ucp_v1=1.0.0-KDgyNTZiNGZlNWZjNTgzNjY1MTk1ZTFlZjc0OTViNmRmZjhhNWVmNGEKFwiCva_l-wEQrrX10wYYzwkgDDgCQPEHGgJscSIgZWU0ZDI5N2M0NDUzZjIzMzRlYjk1ZWI2NGFkYmUyMmM; gfkadpd=1231,25897; x-web-secsdk-uid=dbbf99f1-2136-4026-9cd4-dcd9bd5020a1; csrf_session_id=7ad80d0e26b66b381df6b9871a171b76; ttwid=1%7C38Jgeihr4PTToe7wMKEvSRODu_CFYtnFf5iS3XpXDqo%7C1786603811%7Ca699851b6f2dc3dbe2057fbdc5be044fbcbc94b6d09e85b0208e6baeef6f43af; xg_p_tos_token=ed4f29858d07839ccfe11e4d91c37f10; xigua_csrf_token=YB2CB-2a_f3kUkm__dYK1RNz';

    const taskData: ToutiaohaoVideoTaskInput = {
      pubType: 0,
      taskId: '1717809227264909312',
      cover: {
        pathOrUrl: 'https://i0.hdslb.com/bfs/article/060f9d1f63d78c4f09501b8bfc134d30413715923.jpg',
      },

      // 标题
      title: '这次旅行，小丁全部都帮我们搞定了，小丁丁真好！',

      //描述
      desc: '这次旅行，小丁全部都帮我们搞定了，小丁丁真好！，来吧',

      tags: ['旅行', '生活'],

      video: {
        localPath: 'I:\\download\\xiaomi.mp4',
      },

      tags: ['搞笑', '旅行'],
      //活动
      //activityId: 1787502887494667,
      //合集
      //collectionId: '7262915326474781219',
      visibilityType: 1,
      // proxy: {
      //   serverAdd: 'd393.kdltpspro.com',
      //   serverPort: 15818,
      //   type: 'kuaidaili',
      //   userName: 't13552986932913',
      //   password: '2mbl9d6n',
      //   area: '',
      //   province: '11',
      // },
    };

    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });

    const result = await Toutiaohao.publishVideo(cookie, taskData, eventCall, '');
    // assets
    console.log('头条横版视频发布：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(false)('【真实测试】', () => {
  test('头条横版视频合集', async () => {
    const cookie =
      '_ba=BA0.2-20230818-5110e-Kxo0EaVdDsnkaE6t2o7C; n_mh=vzBueMd0IslOEX34KAK9JtrhFU5IBWqJZPtO8_uOKbw; store-region=cn-hn; store-region-src=uid; _ga=GA1.1.185860520.1692665073; d_ticket=aefb51cd909fcb0f7a3fd56e8be089b20d189; ttcid=cebe8b702e1f40ba919f429c4783aafc49; passport_csrf_token=c67c0e7519538c76b7cc1307ab81c80d; passport_csrf_token_default=c67c0e7519538c76b7cc1307ab81c80d; sso_auth_status=6f55773f9b707e41cfef572a4afab8bc; sso_auth_status_ss=6f55773f9b707e41cfef572a4afab8bc; sso_uid_tt=8f29107fa203d3b7ad9cf66ca38ccd89; sso_uid_tt_ss=8f29107fa203d3b7ad9cf66ca38ccd89; toutiao_sso_user=338885a11b61456aa39c06fb334ec426; toutiao_sso_user_ss=338885a11b61456aa39c06fb334ec426; sid_ucp_sso_v1=1.0.0-KDQwMzM5MzdkNzRjY2ZmZjIzMTYzYzNlMTNhZTQ3ZDgzNzAxMWQ4NzAKHQiZ8t_43AIQx97erAYYzwkgDDC_ssDUBTgCQPEHGgJobCIgMzM4ODg1YTExYjYxNDU2YWEzOWMwNmZiMzM0ZWM0MjY; ssid_ucp_sso_v1=1.0.0-KDQwMzM5MzdkNzRjY2ZmZjIzMTYzYzNlMTNhZTQ3ZDgzNzAxMWQ4NzAKHQiZ8t_43AIQx97erAYYzwkgDDC_ssDUBTgCQPEHGgJobCIgMzM4ODg1YTExYjYxNDU2YWEzOWMwNmZiMzM0ZWM0MjY; passport_auth_status=9ecf770328791a4f7b6205c2d4846ed3%2Cdfe15381d902084c62b8e5a0143c8967; passport_auth_status_ss=9ecf770328791a4f7b6205c2d4846ed3%2Cdfe15381d902084c62b8e5a0143c8967; sid_guard=82be2fc6285f368e6ec400e0b21351cf%7C1704439623%7C5184001%7CTue%2C+05-Mar-2024+07%3A27%3A04+GMT; uid_tt=44a2c25befa298d0e315f9812233ad88; uid_tt_ss=44a2c25befa298d0e315f9812233ad88; sid_tt=82be2fc6285f368e6ec400e0b21351cf; sessionid=82be2fc6285f368e6ec400e0b21351cf; sessionid_ss=82be2fc6285f368e6ec400e0b21351cf; sid_ucp_v1=1.0.0-KDBkNDU1MjBhMDkxNDA0MWU2MjgyMDhmNTdiNjQyMDdlY2VkMTQ5NjAKFwiZ8t_43AIQx97erAYYzwkgDDgCQPEHGgJscSIgODJiZTJmYzYyODVmMzY4ZTZlYzQwMGUwYjIxMzUxY2Y; ssid_ucp_v1=1.0.0-KDBkNDU1MjBhMDkxNDA0MWU2MjgyMDhmNTdiNjQyMDdlY2VkMTQ5NjAKFwiZ8t_43AIQx97erAYYzwkgDDgCQPEHGgJscSIgODJiZTJmYzYyODVmMzY4ZTZlYzQwMGUwYjIxMzUxY2Y; tt_webid=7320512302976157219; odin_tt=9cd6a85c19ed8edc7683f3358cf6c29ded3bef8cf4cb0bcdbbc7702c9c0e98e96f1d2d8d609eba84f3a3446453b881c2; _ga_QEHZPBE5HH=GS1.1.1704765930.11.0.1704765930.0.0.0; s_v_web_id=verify_lr0bbypt_Zx3SlUCF_Er50_4uQK_8bun_8jGohD359HB8; tt_scid=giO2SMt-k.XS3QNnJUwu9stviacN6P1-LmCfvSKvbFOUMaF.s692J3LPwVyQ2IXS4acc; csrf_session_id=e8d288be3c57e6eb19cf6d3574a384ca; csrf_session_id=e8d288be3c57e6eb19cf6d3574a384ca; xg_p_tos_token=34ba8ee906af7faa6826bd1a64671505; msToken=wMSQkrXArsRJ6TEsF_XjigU5K9-i-UrZh3UKCysrGYvHN3BfPlczUd0PfZpt8dJbwcQrADG018dagdBtUTDhwmWNjrbbvH3Tg1JDISCZB2Ig0iHIhCaxzYdYUeiah_0=; xigua_csrf_token=R1VcFGHiz4NtiIcK4sqkqvc4; ttwid=1%7C6Cktee8Y7TjMb7R5qf64s6SM3LJLQzHz5u9yDUw9y50%7C1705391136%7Cfcfa40090d73651f57c7eeb4875dda057c57b276b7b6fe6e5d8cc1b3028d800e; tt_scid=lm9F4uEkQT41M2lP1PwPCGgc8JieTbsPd5iv1EkrdmiLdVAks7dl7Q1habGx6-ZUc210';

    const result = await Toutiaohao.getToutiaohaoVideoCollectionList(cookie, 1);
    // assets
    console.log('头条横版合集：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(false)('【真实测试】', () => {
  test('头条横版视频活动', async () => {
    const cookie =
      '_ba=BA0.2-20230818-5110e-Kxo0EaVdDsnkaE6t2o7C; n_mh=vzBueMd0IslOEX34KAK9JtrhFU5IBWqJZPtO8_uOKbw; store-region=cn-hn; store-region-src=uid; _ga=GA1.1.185860520.1692665073; d_ticket=aefb51cd909fcb0f7a3fd56e8be089b20d189; ttcid=cebe8b702e1f40ba919f429c4783aafc49; passport_csrf_token=c67c0e7519538c76b7cc1307ab81c80d; passport_csrf_token_default=c67c0e7519538c76b7cc1307ab81c80d; sso_auth_status=6f55773f9b707e41cfef572a4afab8bc; sso_auth_status_ss=6f55773f9b707e41cfef572a4afab8bc; sso_uid_tt=8f29107fa203d3b7ad9cf66ca38ccd89; sso_uid_tt_ss=8f29107fa203d3b7ad9cf66ca38ccd89; toutiao_sso_user=338885a11b61456aa39c06fb334ec426; toutiao_sso_user_ss=338885a11b61456aa39c06fb334ec426; sid_ucp_sso_v1=1.0.0-KDQwMzM5MzdkNzRjY2ZmZjIzMTYzYzNlMTNhZTQ3ZDgzNzAxMWQ4NzAKHQiZ8t_43AIQx97erAYYzwkgDDC_ssDUBTgCQPEHGgJobCIgMzM4ODg1YTExYjYxNDU2YWEzOWMwNmZiMzM0ZWM0MjY; ssid_ucp_sso_v1=1.0.0-KDQwMzM5MzdkNzRjY2ZmZjIzMTYzYzNlMTNhZTQ3ZDgzNzAxMWQ4NzAKHQiZ8t_43AIQx97erAYYzwkgDDC_ssDUBTgCQPEHGgJobCIgMzM4ODg1YTExYjYxNDU2YWEzOWMwNmZiMzM0ZWM0MjY; passport_auth_status=9ecf770328791a4f7b6205c2d4846ed3%2Cdfe15381d902084c62b8e5a0143c8967; passport_auth_status_ss=9ecf770328791a4f7b6205c2d4846ed3%2Cdfe15381d902084c62b8e5a0143c8967; sid_guard=82be2fc6285f368e6ec400e0b21351cf%7C1704439623%7C5184001%7CTue%2C+05-Mar-2024+07%3A27%3A04+GMT; uid_tt=44a2c25befa298d0e315f9812233ad88; uid_tt_ss=44a2c25befa298d0e315f9812233ad88; sid_tt=82be2fc6285f368e6ec400e0b21351cf; sessionid=82be2fc6285f368e6ec400e0b21351cf; sessionid_ss=82be2fc6285f368e6ec400e0b21351cf; sid_ucp_v1=1.0.0-KDBkNDU1MjBhMDkxNDA0MWU2MjgyMDhmNTdiNjQyMDdlY2VkMTQ5NjAKFwiZ8t_43AIQx97erAYYzwkgDDgCQPEHGgJscSIgODJiZTJmYzYyODVmMzY4ZTZlYzQwMGUwYjIxMzUxY2Y; ssid_ucp_v1=1.0.0-KDBkNDU1MjBhMDkxNDA0MWU2MjgyMDhmNTdiNjQyMDdlY2VkMTQ5NjAKFwiZ8t_43AIQx97erAYYzwkgDDgCQPEHGgJscSIgODJiZTJmYzYyODVmMzY4ZTZlYzQwMGUwYjIxMzUxY2Y; tt_webid=7320512302976157219; odin_tt=9cd6a85c19ed8edc7683f3358cf6c29ded3bef8cf4cb0bcdbbc7702c9c0e98e96f1d2d8d609eba84f3a3446453b881c2; _ga_QEHZPBE5HH=GS1.1.1704765930.11.0.1704765930.0.0.0; s_v_web_id=verify_lr0bbypt_Zx3SlUCF_Er50_4uQK_8bun_8jGohD359HB8; tt_scid=giO2SMt-k.XS3QNnJUwu9stviacN6P1-LmCfvSKvbFOUMaF.s692J3LPwVyQ2IXS4acc; csrf_session_id=e8d288be3c57e6eb19cf6d3574a384ca; csrf_session_id=e8d288be3c57e6eb19cf6d3574a384ca; xg_p_tos_token=34ba8ee906af7faa6826bd1a64671505; msToken=wMSQkrXArsRJ6TEsF_XjigU5K9-i-UrZh3UKCysrGYvHN3BfPlczUd0PfZpt8dJbwcQrADG018dagdBtUTDhwmWNjrbbvH3Tg1JDISCZB2Ig0iHIhCaxzYdYUeiah_0=; xigua_csrf_token=R1VcFGHiz4NtiIcK4sqkqvc4; ttwid=1%7C6Cktee8Y7TjMb7R5qf64s6SM3LJLQzHz5u9yDUw9y50%7C1705391136%7Cfcfa40090d73651f57c7eeb4875dda057c57b276b7b6fe6e5d8cc1b3028d800e; tt_scid=lm9F4uEkQT41M2lP1PwPCGgc8JieTbsPd5iv1EkrdmiLdVAks7dl7Q1habGx6-ZUc210';

    const result = await Toutiaohao.getToutiaohaoVideoActivityList(cookie);
    // assets
    console.log('头条横版活动：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});
//ItemId=7325325940001767947

describe.runIf(false)('【真实测试】', () => {
  test('头条横版视频状态', async () => {
    const cookie =
      'passport_csrf_token=0c9eb6963b416647fd1d8db2cebc1d94; passport_csrf_token_default=0c9eb6963b416647fd1d8db2cebc1d94; s_v_web_id=verify_m25hk68z_eOIDZVF6_spwk_4KIm_9m2Q_CbtUxhxqRa6J; n_mh=AcDxV4OadUGLiz0t_24ftKYCkjtkISeR_LVvYNQdYr0; sso_uid_tt=2b88a6dac290dd3b374ff401f9b0e060; sso_uid_tt_ss=2b88a6dac290dd3b374ff401f9b0e060; toutiao_sso_user=6ffe9e10f2ce9739eafa75c68818f361; toutiao_sso_user_ss=6ffe9e10f2ce9739eafa75c68818f361; sid_ucp_sso_v1=1.0.0-KGEzZTJiNWFjM2M2NGY4YTBkNThjNzQ1YmQ5ZGNhNzNhOTEzZDAxOGQKHQibicTt4gIQwaWnuAYYzwkgDDC3yc6ABjgGQPQHGgJobCIgNmZmZTllMTBmMmNlOTczOWVhZmE3NWM2ODgxOGYzNjE; ssid_ucp_sso_v1=1.0.0-KGEzZTJiNWFjM2M2NGY4YTBkNThjNzQ1YmQ5ZGNhNzNhOTEzZDAxOGQKHQibicTt4gIQwaWnuAYYzwkgDDC3yc6ABjgGQPQHGgJobCIgNmZmZTllMTBmMmNlOTczOWVhZmE3NWM2ODgxOGYzNjE; passport_auth_status=359274813ceb628bec4c3f04f14eb7e1%2C; passport_auth_status_ss=359274813ceb628bec4c3f04f14eb7e1%2C; sid_guard=96465f6000c892985936a588f1264612%7C1728697026%7C5184001%7CWed%2C+11-Dec-2024+01%3A37%3A07+GMT; uid_tt=1bd059cbe9fa50192b461eea58ef5d61; uid_tt_ss=1bd059cbe9fa50192b461eea58ef5d61; sid_tt=96465f6000c892985936a588f1264612; sessionid=96465f6000c892985936a588f1264612; sessionid_ss=96465f6000c892985936a588f1264612; is_staff_user=false; sid_ucp_v1=1.0.0-KDIzNjhhOTBkYjkyMTFjYmI0MDBkMDI5OWUzNGE4YjRjZThkMmE1ZTYKFwibicTt4gIQwqWnuAYYzwkgDDgGQPQHGgJscSIgOTY0NjVmNjAwMGM4OTI5ODU5MzZhNTg4ZjEyNjQ2MTI; ssid_ucp_v1=1.0.0-KDIzNjhhOTBkYjkyMTFjYmI0MDBkMDI5OWUzNGE4YjRjZThkMmE1ZTYKFwibicTt4gIQwqWnuAYYzwkgDDgGQPQHGgJscSIgOTY0NjVmNjAwMGM4OTI5ODU5MzZhNTg4ZjEyNjQ2MTI; store-region=cn-hn; store-region-src=uid; tt_webid=7424696954679281152; _ga=GA1.1.1394452692.1728698597; odin_tt=f8eedd7fc16fa3634249527e80a4ca354f825d6584656ab2c221d028d5afbc1d15c070950e22360665909701759e6f76; ttcid=f5950f82f3e94508b6a67555e80ec63d40; gfkadpd=1231,25897; csrf_session_id=fd1e07986a6d8c52f76f7ad3deacce89; gfkadpd=1231,25897; xigua_csrf_token=-NqsNFBEzer5uJpz53tSp2MC; xg_p_tos_token=68d97a888038c0f8b0534bc3605d4b53; tt_scid=m1GXVia49yt3ZT-qlSsQVsEZR9r5MuSdgMJdwkKxwY0woOhBfv9rc5yI6yc62uemb9ca; csrf_session_id=fd1e07986a6d8c52f76f7ad3deacce89; _ga_QEHZPBE5HH=GS1.1.1729750756.2.1.1729750894.0.0.0; ttwid=1%7CzERZLYg0VGEoSXLcXot7fdx1Zxt_aGBmkPP1a3aCcao%7C1729750895%7C70b38a701a3fd4f2b19e68652eb9b32b06bae8c854df123cd5d11e5038f51a58; tt_scid=g9OL7NZM9fWiPN.H67.HR4FXiXi7woHCG5wHNVWYaIvfmYKrIMgJjb3bj7pueL4A0ff2';

    const result = await Toutiaohao.getToutiaohaoVideoStatus(cookie, '7391737089521680424');
    // assets
    console.log('头条横版状态：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(false)('【真实测试】', () => {
  test('头条竖版视频状态', async () => {
    const cookie =
      'passport_csrf_token=0c9eb6963b416647fd1d8db2cebc1d94; passport_csrf_token_default=0c9eb6963b416647fd1d8db2cebc1d94; s_v_web_id=verify_m25hk68z_eOIDZVF6_spwk_4KIm_9m2Q_CbtUxhxqRa6J; n_mh=AcDxV4OadUGLiz0t_24ftKYCkjtkISeR_LVvYNQdYr0; sso_uid_tt=2b88a6dac290dd3b374ff401f9b0e060; sso_uid_tt_ss=2b88a6dac290dd3b374ff401f9b0e060; toutiao_sso_user=6ffe9e10f2ce9739eafa75c68818f361; toutiao_sso_user_ss=6ffe9e10f2ce9739eafa75c68818f361; sid_ucp_sso_v1=1.0.0-KGEzZTJiNWFjM2M2NGY4YTBkNThjNzQ1YmQ5ZGNhNzNhOTEzZDAxOGQKHQibicTt4gIQwaWnuAYYzwkgDDC3yc6ABjgGQPQHGgJobCIgNmZmZTllMTBmMmNlOTczOWVhZmE3NWM2ODgxOGYzNjE; ssid_ucp_sso_v1=1.0.0-KGEzZTJiNWFjM2M2NGY4YTBkNThjNzQ1YmQ5ZGNhNzNhOTEzZDAxOGQKHQibicTt4gIQwaWnuAYYzwkgDDC3yc6ABjgGQPQHGgJobCIgNmZmZTllMTBmMmNlOTczOWVhZmE3NWM2ODgxOGYzNjE; passport_auth_status=359274813ceb628bec4c3f04f14eb7e1%2C; passport_auth_status_ss=359274813ceb628bec4c3f04f14eb7e1%2C; sid_guard=96465f6000c892985936a588f1264612%7C1728697026%7C5184001%7CWed%2C+11-Dec-2024+01%3A37%3A07+GMT; uid_tt=1bd059cbe9fa50192b461eea58ef5d61; uid_tt_ss=1bd059cbe9fa50192b461eea58ef5d61; sid_tt=96465f6000c892985936a588f1264612; sessionid=96465f6000c892985936a588f1264612; sessionid_ss=96465f6000c892985936a588f1264612; is_staff_user=false; sid_ucp_v1=1.0.0-KDIzNjhhOTBkYjkyMTFjYmI0MDBkMDI5OWUzNGE4YjRjZThkMmE1ZTYKFwibicTt4gIQwqWnuAYYzwkgDDgGQPQHGgJscSIgOTY0NjVmNjAwMGM4OTI5ODU5MzZhNTg4ZjEyNjQ2MTI; ssid_ucp_v1=1.0.0-KDIzNjhhOTBkYjkyMTFjYmI0MDBkMDI5OWUzNGE4YjRjZThkMmE1ZTYKFwibicTt4gIQwqWnuAYYzwkgDDgGQPQHGgJscSIgOTY0NjVmNjAwMGM4OTI5ODU5MzZhNTg4ZjEyNjQ2MTI; store-region=cn-hn; store-region-src=uid; tt_webid=7424696954679281152; _ga=GA1.1.1394452692.1728698597; odin_tt=f8eedd7fc16fa3634249527e80a4ca354f825d6584656ab2c221d028d5afbc1d15c070950e22360665909701759e6f76; ttcid=f5950f82f3e94508b6a67555e80ec63d40; gfkadpd=1231,25897; csrf_session_id=fd1e07986a6d8c52f76f7ad3deacce89; gfkadpd=1231,25897; xigua_csrf_token=-NqsNFBEzer5uJpz53tSp2MC; xg_p_tos_token=68d97a888038c0f8b0534bc3605d4b53; tt_scid=m1GXVia49yt3ZT-qlSsQVsEZR9r5MuSdgMJdwkKxwY0woOhBfv9rc5yI6yc62uemb9ca; csrf_session_id=fd1e07986a6d8c52f76f7ad3deacce89; _ga_QEHZPBE5HH=GS1.1.1729750756.2.1.1729750894.0.0.0; ttwid=1%7CzERZLYg0VGEoSXLcXot7fdx1Zxt_aGBmkPP1a3aCcao%7C1729750895%7C70b38a701a3fd4f2b19e68652eb9b32b06bae8c854df123cd5d11e5038f51a58; tt_scid=g9OL7NZM9fWiPN.H67.HR4FXiXi7woHCG5wHNVWYaIvfmYKrIMgJjb3bj7pueL4A0ff2';

    const result = await Toutiaohao.getToutiaohaoMiniVideoStatus(cookie, '7391737089521680424');
    // assets
    console.log('头条竖版状态：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});
