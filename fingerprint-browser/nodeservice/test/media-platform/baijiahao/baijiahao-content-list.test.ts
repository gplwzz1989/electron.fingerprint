import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { getContentListAsync } from '@/media-platform/baijiahao/baijiahao-content-list.service';

describe('【Mock】', () => {
  describe('获取百家号内容列表', () => {
    const server = setupServer(
      rest.get('https://baijiahao.baidu.com*/pcui/article/lists', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              errno: 0,
              errmsg: 'success',
              data: {
                list: [
                  {
                    abstract: '纯也（CHUNYEA）贝壳纯水湿纸巾',
                    app_id: '1717839316314860',
                    article_id: '17874365636150636405',
                    audit_msg: '',
                    authentication_type: '名人',
                    bjhtopic_id: '167944444946292055',
                    commit_at: '2023-08-24 18:50:57',
                    cover_images:
                      '[{"src":"http:\\/\\/t13.baidu.com\\/it\\/u=575450794,2933144342&fm=255&app=106&f=JPEG?w=660&h=370"}]',
                    cover_layout: 'one',
                    created_at: '2023-08-24 18:50:57',
                    crosswise_cover: 'http://t13.baidu.com/it/u=575450794,2933144342&fm=255&app=106&f=JPEG?w=660&h=370',
                    displaytype_exinfo:
                      '{"uid":"3538496558","sourceid":3000104,"name":"李先森约翰","display_name":"李先森约翰","https_avatar":"https://gips0.baidu.com/it/u=2694182123,4180810459&fm=3012&app=3012&autime=1691810897&size=b200,200","http_avatar":"http://gips0.baidu.com/it/u=2694182123,4180810459&fm=3012&app=3012&autime=1691810897&size=b200,200","authentication_type":"名人","source":"ugc_baijiahao","is_authenticated":"0","app_id":"1717839316314860","source_from":"vsv_bjh_pc","ugcvideo":{"feed_id":"8910825815593371407"},"mediaId":"mda-phpe9ex9vei7359c","cate1":"","cate2":"","tag":"","play_http":"http://vd3.bdstatic.com/mda-phpe9ex9vei7359c/360p/h264/1692871490539838948/mda-phpe9ex9vei7359c.mp4","video_info":{"durationInSecond":34,"fileSizeInByte":1379754,"heightInPixel":464,"widthInPixel":360},"long":34,"set_id":null,"recommend_is_free":null,"distribution_special":null,"channel":"ugc","uk":"Ae_bC9SqO8kXBVd3qVPU9Q","data_type":"5","play_https":"https://vd3.bdstatic.com/mda-phpe9ex9vei7359c/360p/h264/1692871490539838948/mda-phpe9ex9vei7359c.mp4"}',
                    feed_id: '5026599775927019538',
                    file_name: '5d980fd44a44808cc978bb6e8b15fb3a',
                    is_authenticated: 0,
                    is_published: 1,
                    issue_status: 1,
                    nid: '5026599775927019538',
                    original_status: 0,
                    publish_at: '2023-08-24 18:51:52',
                    publish_time: '2023-08-24 18:51:52',
                    quality_audit_type: 'qm',
                    quality_not_pass_reason: '机审质量拒绝$$小视频-黑名单模型',
                    quality_status: 'rejected',
                    rmb_checkAccept: 1,
                    rmb_checkRejectReason: '机审质量拒绝$$小视频-黑名单模型',
                    rmb_effectiveEndTime: '1695484799',
                    rmb_isSelfBuild: 1,
                    rmb_microCheckInfo:
                      '{"titleQuality":"优质","crosswiseCoverQuality":"小图","crosswiseCoverBigpicMsg":{"status":"robot","bigpic":"小图","noBigpicReason":"clarity"},"newCategory":"生活","newSubCategory":"好物推荐","accuracy":0.81726843118668,"bjhTopicRelative":1}',
                    rmb_status: 1,
                    rmb_url: 'http://www.internal.video.baidu.com/229fcd3ae8db6fdf85635c62f13f15b0.html',
                    rmb_videoType: '3',
                    secure_status: 'publish',
                    shoubai_c_articleid: '17874365636150636405',
                    source_name: '百家号',
                    source_reprinted_allow: 0,
                    source_reprinted_astrict: 'abstract',
                    source_trace: 'CMS_VIDEO_PUBLISH',
                    source_type: 'ugc',
                    status: 'publish',
                    sub_status_id: 1,
                    thread_id: 1019000059529510,
                    title: '纯也（CHUNYEA）贝壳纯水湿纸巾',
                    transform_id: '17874365636150636405',
                    type: 'ugc_video',
                    ugc_source_from: 'vsv_bjh_pc',
                    ugc_target: [],
                    updated_at: '2023-08-24 18:52:23',
                    url: 'http://baijiahao.baidu.com/builder/preview/s?id=5026599775927019538',
                    video_clarity_score: 5.1224,
                    weixin_import_type: 16,
                    id: '17874365636150636405',
                    goods_list: [],
                    certify_url: '',
                    timer_time: 0,
                    similar_article_id: '',
                    withdraw_status: {
                      withdraw_msg: '',
                      has_withdraw_times: {
                        news: 3,
                      },
                      can_withdraw: -1,
                    },
                    modify_status: {
                      edit_msg: '',
                      can_edit: 1,
                    },
                    delete_status: {
                      delete_msg: '',
                      can_delete: 1,
                    },
                    recover_status: {
                      recover_msg: '',
                      can_recover: 0,
                    },
                    activity_list: [],
                    read_amount: 1,
                    comment_amount: 0,
                    share_amount: 0,
                    like_amount: 0,
                    collection_amount: 0,
                    activity_ids: [],
                    solicit_info: {
                      tag: null,
                      point: null,
                      inspire: null,
                    },
                    group_can_share: 0,
                    group_already_shared: 0,
                    flow_invest_status: 53,
                    flow_invest_msg: '',
                    package_invest_status: 0,
                    audit_msg_color: '#EE2433',
                    audit_msg_icon: '',
                    share_url:
                      'https://mbd.baidu.com/newspage/data/dtlandingwise?sourceFrom=baijiahao&nid=dt_5026599775927019538',
                    v_type: 0,
                    v_intro: '',
                    video_num: 0,
                    can_edit_goods: 0,
                    history_video_set_nids: '',
                    auto_generate_id: '',
                    add_video_set_status: {
                      can_add_video_set: 0,
                      add_video_set_msg: '视频质量待提升，暂无法加入合集',
                    },
                  },
                ],
                guide_share_list: [],
                message_num: 1,
                ability: {
                  dynamic_tab_show: 1,
                  can_show_training_user_info: false,
                  can_use_se_keyword: 1,
                },
                page: {
                  currentPage: 1,
                  pageSize: 1,
                  totalCount: 125,
                  totalPage: 125,
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
        const result = await getContentListAsync('success', 1, 10);
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.errno).toBe(0);
      });
    });
  });
});

describe.runIf(true)('【真实测试】', () => {
  test('获取百家号内容列表', async () => {
    const cookie =
      'PSTM=1659435413; BIDUPSID=9AD8F95371FB5F95E3E4AF2EC9181314; BAIDUID=F051C5FB12677EFE099E29815E11DB98:SL=0:NR=10:FG=1; theme=bjh; gray=1; canary=0; MCITY=-%3A; BDSFRCVID=YXuOJexroG3B_xQJhrNWMFcHYuweG7bTDYrEOwXPsp3LGJLVdLE8EG0Pts1-dEu-S2OOogKKLmOTHpKF_2uxOjjg8UtVJeC6EG0Ptf8g0M5; H_BDCLCKID_SF=tRAOoC_-tDvDqTrP-trf5DCShUFs3x-JB2Q-XPoO3KOI_Pnhy47KX6DIQxb7XRQf5mkf3fbgy4op8P3y0bb2DUA1y4vpKU74fgTxoUJ2-KDVeh5Gqq-KXU4ebPRiWPr9QgbjahQ7tt5W8ncFbT7l5hKpbt-q0x-jLTnhVn0MBCK0hD89DjKKD6PVKgTa54cbb4o2WbCQyxnh8pcN2b5oQTtYBp7IBtvHBHvuKJOdy45beq06-lOUWJDkXpJvQnJjt2JxaqRC5pRpbh5jDh3MKToDb-oteltHB2Oy0hvcBn6cShnxyUjrDRLbXU6BK5vPbNcZ0l8K3l02V-bIe-t2XjQh-p52f6KjJnKt3H; H_WISE_SIDS=61027_61053_61075_61141_61161_61218_61206_61210_61215_61240; BDRCVFR[feWj1Vr5u3D]=I67x6TjHwwYf0; delPer=0; PSINO=7; BAIDUID_BFESS=F051C5FB12677EFE099E29815E11DB98:SL=0:NR=10:FG=1; BDSFRCVID_BFESS=YXuOJexroG3B_xQJhrNWMFcHYuweG7bTDYrEOwXPsp3LGJLVdLE8EG0Pts1-dEu-S2OOogKKLmOTHpKF_2uxOjjg8UtVJeC6EG0Ptf8g0M5; H_BDCLCKID_SF_BFESS=tRAOoC_-tDvDqTrP-trf5DCShUFs3x-JB2Q-XPoO3KOI_Pnhy47KX6DIQxb7XRQf5mkf3fbgy4op8P3y0bb2DUA1y4vpKU74fgTxoUJ2-KDVeh5Gqq-KXU4ebPRiWPr9QgbjahQ7tt5W8ncFbT7l5hKpbt-q0x-jLTnhVn0MBCK0hD89DjKKD6PVKgTa54cbb4o2WbCQyxnh8pcN2b5oQTtYBp7IBtvHBHvuKJOdy45beq06-lOUWJDkXpJvQnJjt2JxaqRC5pRpbh5jDh3MKToDb-oteltHB2Oy0hvcBn6cShnxyUjrDRLbXU6BK5vPbNcZ0l8K3l02V-bIe-t2XjQh-p52f6KjJnKt3H; ZFY=TXS3auL7ioD2x4BPLySkDPoq6I:Aqdxdl3iBZJVmZuNk:C; log_first_time=1732527218583; log_last_time=1732527237882; BDRCVFR[S4-dAuiWMmn]=I67x6TjHwwYf0; ZD_ENTRY=baidu; H_WISE_SIDS_BFESS=61027_61053_61075_61141_61161_61218_61206_61210_61215_61240; BA_HECTOR=2l2k0la52h008g2k210g0k0g1g8m1c1jkip1b1v; BDORZ=B490B5EBF6F3CD402E515D22BCDA1598; PHPSESSID=nqeckllfrk2h322i2l7cnagob4; ppfuid=FOCoIC3q5fKa8fgJnwzbE0LGziLN3VHbX8wfShDP6RCsfXQp/69CStRUAcn/QmhIlFDxPrAc/s5tJmCocrihdwitHd04Lvs3Nfz26Zt2holplnIKVacidp8Sue4dMTyfg65BJnOFhn1HthtSiwtygiD7piS4vjG/W9dLb1VAdqPNMaFa6COBr2OFC12lralcO0V6uxgO+hV7+7wZFfXG0MSpuMmh7GsZ4C7fF/kTgmuR/6nKv9JHDlbfxVRs8b2Q2yg1mRZO3kKtoXhXTvRGEXPXJGNvkH57irinoYdS2+41v2iwj13daM+9aWJ5GJCQu/SUbF5jV5AUyz/jBiIgKVObaDCHgWJZH3ZrTGYHmi7XJB9z3y2o8Kqxep5XBCsu5WSoiGtkBmuxgNnGvSmhCsTtlheGhftBTbUILzt33xSjQXz/gJEgSYx1vUQMipXdSecr9yhMSRLVoFktEC1isBapCm9qVt/6kSSW7Xg8l3SvK/S9Ff5RtLDcahg8QCqqP/JUZA7BRBFh68uqDQax10gfXgGxCNf3Sx8e4KXUBrqV/g3hEEf9luu8oPziRIwanIJY1XZupqPZgmfh8BLwT9YUuyc0u8RKTitzO23hSwGX7sI4U3M5cfLBwVX5m74NveYUNi7Li87S8ZbXy31eyxBDK4IiDGlt1VFsxDIz0RsVHZudegSJ4zYa95fLOW41HdqdlVsa4ORVPwaoYgWzWigT4KUSvejPWWbczD37o0JAMY0Xq/mt7JbC+fPJzgUfRzNZgPhgVUh3SShPYyzuP+stUM5mgs1HaIotoPws+vONShWJwz1YFh50cD2nHuAUHJMc4xeuRg7bfpEY/vwboa87Mf4DRxb3AAPFSzwHIQupzieM+QALqe3EwFiIk9Nti8jfUCnxofA3zANcmlfc4RXkuNYCZBWkNbmLJnCAaUdSDiq641gRtF4fILNK7ztfbqw6aD8guGaAe30S21IxszqOo2R7vfZvyT+BEUNopxhC8xSSMxCu8WMUnnfbjsasJYugTW5lGCyFRXKtKIQxSMPpLP2HQMI1/SI1/h9WAqjxxJNDJS+Dlsbqu3n4I65ujli/3rQ8Zk1MjmTOsz9+kTqOM4upsnQ6IWq/zeZTItMCgHpQhuhr4ip73honuzoJhfJJqPUSX01viD97GXfw7kf+R6as3JPAEXsdOdDsWEAgJn+ZMVrELI7pXz8Jko9Xv3uSDHo/C3kmFLrauvEYpUg3FbqEqM6JmRHqkwRhSJRrF+MyOoYKm6kqRoe11cJkzRszeYvFyXCPSuJ5oyoOgoCPKXE8fX73WOZ0mAlF1mc=; Hm_lvt_f7b8c775c6c8b6a716a75df506fb72df=1732863101; HMACCOUNT=302DC822FE42C2EB; __bid_n=191efa9c485982449ec431; XFT=q9gRflkSFpOgGclqCAJJtsqeJsXZN3kwnk0iE1uIrjE=; H_PS_PSSID=61027_61141_61206_61210_61215_61240_61188_61281; BDUSS=FIelVOU09kQjdLc0N3OVo2RU9GM0YzT0xmYWE3cThnanZkSTlpMTE3THg5WEJuRVFBQUFBJCQAAAAAAAAAAAEAAACuA1kz09DIpLjj0Ka1xGVuAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPFoSWfxaElnMn; BDUSS_BFESS=FIelVOU09kQjdLc0N3OVo2RU9GM0YzT0xmYWE3cThnanZkSTlpMTE3THg5WEJuRVFBQUFBJCQAAAAAAAAAAAEAAACuA1kz09DIpLjj0Ka1xGVuAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPFoSWfxaElnMn; ab_sr=1.0.1_NmJmNzc4YjAzYTBlZTFlMWYzNDZlNTZmOGY0YmYxNjkyZjU5YWU1NjcwMjdlNzZmYjBjMjYzNGZkNzY3ZmRmMzQwNDVjYmQ1NWE3M2Y5ZDgwMzM1YjQ4NmM0ODliMTU0ZTU5MTQzYWVlNGFiNWQ3N2M5Y2U3MGQ5ZDEwMmNhYThmNDBkZDY3NDYxY2RkM2FlNTYzZDM0ZTRkNjRmMGNmOTcwNTAzZDc5MGEzNGRjYmYyYWMzZGFlMzEwYTE5Zjk2; Hm_lpvt_f7b8c775c6c8b6a716a75df506fb72df=1732864911; RECENT_LOGIN=0; XFI=9c1e3080-ae22-11ef-919c-c133126ccbee; XFCS=129B8927829E724D84EB1FB2B5E43E6BDC251FEEA09D7D7A147B6A459DD92428; devStoken=a1e8925fc00d72728e7c739c44615e07b9ade114a8dc2f593576e1012bcb47b0; bjhStoken=25ee5e24b3b338e4207fb8e5260d4b5ab9ade114a8dc2f593576e1012bcb47b0; RT="z=1&dm=baidu.com&si=5a1ffe1e-b148-42e2-bc9c-3b1385e7983a&ss=m42dy532&sl=1m&tt=1qca&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf&r=4sodh7rg&ul=12xqz"';

    const result = await getContentListAsync(cookie, 1, 10);
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.errno).toBe(0);
  }, 10000000);
});
