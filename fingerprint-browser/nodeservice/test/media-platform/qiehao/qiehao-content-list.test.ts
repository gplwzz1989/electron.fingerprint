import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { getContentListAsync } from '@/media-platform/qiehao/qiehao-content-list.service';

describe('【Mock】', () => {
  describe('获取企鹅号内容列表', () => {
    const server = setupServer(
      rest.get('https://om.qq.com*/marticle/article/list', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              response: {
                code: 0,
                msg: 'suc',
              },
              data: {
                articles: [
                  {
                    activity: null,
                    alt_time: '2023-10-31 19:33:33',
                    appeal_status: 0,
                    appeal_timeout: 1,
                    article_id: '20231031V08Y8I',
                    article_modify_flag: 1,
                    business_cash_handle_status: 0,
                    caimaiInfo: '{}',
                    channelDisInfo: null,
                    co_creation_info: null,
                    comment: [],
                    commentnum: 0,
                    content_reproduce: '0',
                    copyrightAssociation: {
                      has: 0,
                      list: null,
                      msg: '',
                      status: 0,
                    },
                    cover_pics: [
                      'https://inews.gtimg.com/om_ls/Oe4WB8AUoOnw_ybT7ZllGoLFk4T1OlvY5zGWzmXrL-nIwAA_196130/0',
                    ],
                    cover_type: '0',
                    daihuoInfo: null,
                    date: '2023-10-31 19:20:12',
                    del_flag: 0,
                    exposure: 0,
                    global_play_control_id: '',
                    highlight: '',
                    horizontal_video: '0',
                    hotActivity: null,
                    howtoInfo: null,
                    imgurl: 'https://inews.gtimg.com/om_ls/Oe4WB8AUoOnw_ybT7ZllGoLFk4T1OlvY5zGWzmXrL-nIwAA_196130/0',
                    imgurl_ext:
                      '[{"1":"https://inews.gtimg.com/om_ls/Oe4WB8AUoOnw_ybT7ZllGoLFk4T1OlvY5zGWzmXrL-nIwAA/0","150120":"https://inews.gtimg.com/om_ls/Oe4WB8AUoOnw_ybT7ZllGoLFk4T1OlvY5zGWzmXrL-nIwAA_150120/0","196130":"https://inews.gtimg.com/om_ls/Oe4WB8AUoOnw_ybT7ZllGoLFk4T1OlvY5zGWzmXrL-nIwAA_196130/0","294195":"https://inews.gtimg.com/om_ls/Oe4WB8AUoOnw_ybT7ZllGoLFk4T1OlvY5zGWzmXrL-nIwAA_294195/0","300240":"https://inews.gtimg.com/om_ls/Oe4WB8AUoOnw_ybT7ZllGoLFk4T1OlvY5zGWzmXrL-nIwAA_300240/0","450360":"https://inews.gtimg.com/om_ls/Oe4WB8AUoOnw_ybT7ZllGoLFk4T1OlvY5zGWzmXrL-nIwAA_450360/0","496280":"https://inews.gtimg.com/om_ls/Oe4WB8AUoOnw_ybT7ZllGoLFk4T1OlvY5zGWzmXrL-nIwAA_496280/0","640360":"https://inews.gtimg.com/om_ls/Oe4WB8AUoOnw_ybT7ZllGoLFk4T1OlvY5zGWzmXrL-nIwAA_640360/0","640480":"https://inews.gtimg.com/om_ls/Oe4WB8AUoOnw_ybT7ZllGoLFk4T1OlvY5zGWzmXrL-nIwAA_640480/0"}]',
                    isHowto: '0',
                    isSticked: 0,
                    is_10w_article: 0,
                    is_commercial: '0',
                    multiActivity: [],
                    needDeleteFlag: 0,
                    ori_title: null,
                    original_status: 0,
                    payInfo: '{"payTag":0}',
                    productInfo: {
                      code: '',
                      has: 0,
                      msg: '',
                      passed: 0,
                      source: '',
                      status: 0,
                      type: 0,
                      version: 0,
                    },
                    pub_time: '2023-10-31 19:20:12',
                    publishFailedShow: '0',
                    pushClient: '-1',
                    pushedFlag: 0,
                    qq_push_errno: 21000,
                    qq_push_state: 0,
                    qq_push_time: '',
                    read: 0,
                    refute_flag: '0',
                    refute_rumor_auth: '0',
                    reject_reason: '',
                    reject_reason_msg: '',
                    revisable: 0,
                    revisableCode: 14208,
                    revisableReason: '非文章或组图内容，不支持修改',
                    reviseStatus: 0,
                    rights_candidate: 0,
                    schedule_del: null,
                    self_declare: null,
                    similar_count: 0,
                    source: '0',
                    standard_reject_reason: '',
                    status: '1',
                    sub_source: '0',
                    targetid: '8222410724',
                    title: '小荷才露尖尖角，夏天，你好~',
                    title2: '',
                    top_plan: 0,
                    total_image_count: 0,
                    type: '56',
                    typos_found: 0,
                    url: 'https://page.om.qq.com/page/OQmJlMwwpPkpCxsH9n_IyBVw0',
                    user_id: 21426919,
                    v_appealstatus: '0',
                    v_censor_reason: [],
                    v_censorback: {
                      standardback: 0,
                    },
                    v_logoappealstatus: 0,
                    v_logoreviewstatus: 0,
                    v_normalize: 0,
                    v_orgvideo: '',
                    v_ori: '0',
                    v_orireason: '',
                    v_oriurl: '',
                    v_orivheight: '1080',
                    v_orivwidth: '1920',
                    v_pubunfinished: 0,
                    v_rc: 0,
                    v_status: '2',
                    v_videocanappeal: 1,
                    v_videoreviewtime: null,
                    vcg_image_count: 0,
                    vid: 'o3517t7imf2',
                    video: {
                      desc: '“小荷才露尖尖角,早有蜻蜓立上头。”多美的意境，表明了夏天的到来。夏秋的风景，一览无遗！',
                      duration: '00:00:24',
                      img: {
                        imgurl1000: {
                          height: '480',
                          imgurl:
                            'https://inews.gtimg.com/om_ls/Oe4WB8AUoOnw_ybT7ZllGoLFk4T1OlvY5zGWzmXrL-nIwAA_640480/0',
                          width: '640',
                        },
                        imgurl640: {
                          height: '480',
                          imgurl:
                            'https://inews.gtimg.com/om_ls/Oe4WB8AUoOnw_ybT7ZllGoLFk4T1OlvY5zGWzmXrL-nIwAA_640480/0',
                          width: '640',
                        },
                      },
                      imgurlsrc: 'usersystem',
                      newcat: '旅游',
                      newsubcat: '旅途风光',
                      title: '小荷才露尖尖角，夏天，你好~',
                      type: 'video',
                      vid: 'o3517t7imf2',
                      vid_character: 0,
                      vid_type: '24',
                    },
                    video_reject_reason: [],
                    yooExclusive: 0,
                  },
                ],
                cost: 311,
                totalNumber: 0,
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
        const result = await getContentListAsync('success', '', 1, '');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.response.code).toBe(0);
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('获取企鹅号内容列表', async () => {
    const cookie =
      'pac_uid=0_c2b637e12e21c; iip=0; ptui_loginuin=33325126; RK=mH2YkWa5H4; ptcz=9e3b6d78d2eadb7eb1284a327cf3cc5de6c3db259c8487942655dc70cf7d57f3; qq_domain_video_guid_verify=1938ff17d2cf12fc; _qimei_uuid42=17a1e091e23100697f375c35a34c81641dde860015; _qimei_fingerprint=df2e68cad149762f4b814b424f0da1ae; _qimei_q36=; _qimei_h38=2db8a9497f375c35a34c816402000006517a1e; pgv_pvid=781622335; ts_uid=5374132440; csrfToken=csrf-1698915773065; userid=21426919; omaccesstoken=00a6a2077a257ea05facdbcd6edfc9fe3f8700b7a90a9a10b96e1c26ef8f1621476982751f95dc30536ebcd74d1f5ff656ded6894d4824dd787f74d5eea498b24dk3; logintype=4; srcopenid=osiAywsUnCNiGhVdX6EDCGtP6AVg; srcaccessToken=74_z5PJ2-QJ4GYioxIhRjR6W4MfMo6B4KaRcGdsMZsI6hH1qbWCbtqdhMHyGM56zpgCx-vA10yZxmxDrhDM7Hgs0iwK5uCyv82mz-57c_zrvkI; omtoken=00a6a2077a257ea05facdbcd6edfc9fe3f8700b7a90a9a10b96e1c26ef8f1621476982751f95dc30536ebcd74d1f5ff656ded6894d4824dd787f74d5eea498b24dk3';

    const result = await getContentListAsync(cookie, '', 1, '');
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.response.code).toBe(0);
  }, 10000000);
});
