import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { getContentListAsync } from '@/media-platform/tengxunshipin/tengxunshipin-content-list.service';

describe('【Mock】', () => {
  describe('获取腾讯视频视频列表', () => {
    const server = setupServer(
      rest.get(
        'https://access.v.qq.com*/trpc.creator_center.backend.VideoFusion/GetUserVideoList',
        (req, res, context) => {
          const cookie = req.url.searchParams.get('cookie');

          // success
          if (cookie === 'success') {
            return res(
              context.status(200),
              context.json({
                code: 0,
                msg: '',
                data: {
                  pagination: {
                    total: 5,
                    page: 1,
                    page_size: 10,
                    page_total: 1,
                  },
                  list: [
                    {
                      vid: 'i33461u5qja',
                      title: '微风惬意，有你刚刚好',
                      image_url: 'http://puui.qpic.cn/vpic_cover/i33461u5qja/i33461u5qja_hz.jpg/1280webp?1698637986',
                      upload_time: '2022-07-07 19:33',
                      duration: '00:18',
                      like: '1',
                      comment: '1',
                      allnumc: '348',
                      is_top: false,
                      is_delivery_successful: false,
                      is_exclusive: false,
                      is_vip: false,
                      status_show: {
                        '1': {
                          content: '',
                          title: '审核通过',
                          status: 2,
                        },
                      },
                      button: {
                        '1': {
                          button_status: 1,
                          reason: '',
                        },
                        '2': {
                          button_status: 1,
                          reason: '',
                        },
                        '3': {
                          button_status: 1,
                          reason: '视频将在个人频道页置顶',
                        },
                        '5': {
                          button_status: 3,
                          reason:
                            '该内容不可推广，可能原因：\n1.内测中，仅部分品类可用\n2.视频时长少于10s\n3.视频发布时间超过20天\n4.与同类视频内容重复度过高\n5.搬运其他视频\n6.内容与平台调性不相符\n7.视频画质等内容质量欠佳\n8.视频仍在审核中或审核不通过',
                        },
                      },
                      like_rot_count: 1,
                      comment_rot_count: 0,
                      schedule_publish: '',
                      toast: {},
                      payment_due_date: '',
                      cid: '',
                    },
                    {
                      vid: 'i33387i7fum',
                      title: 's27赛季，巅峰低分赵云真的很无解',
                      image_url: 'http://puui.qpic.cn/vpic_cover/i33387i7fum/i33387i7fum_hz.jpg/1280webp?1698637986',
                      upload_time: '2022-05-19 22:07',
                      duration: '01:28',
                      like: '0',
                      comment: '0',
                      allnumc: '3600',
                      is_top: false,
                      is_delivery_successful: false,
                      is_exclusive: false,
                      is_vip: false,
                      status_show: {
                        '1': {
                          content: '',
                          title: '审核通过',
                          status: 2,
                        },
                      },
                      button: {
                        '1': {
                          button_status: 1,
                          reason: '',
                        },
                        '2': {
                          button_status: 1,
                          reason: '',
                        },
                        '3': {
                          button_status: 1,
                          reason: '视频将在个人频道页置顶',
                        },
                        '5': {
                          button_status: 3,
                          reason:
                            '该内容不可推广，可能原因：\n1.内测中，仅部分品类可用\n2.视频时长少于10s\n3.视频发布时间超过20天\n4.与同类视频内容重复度过高\n5.搬运其他视频\n6.内容与平台调性不相符\n7.视频画质等内容质量欠佳\n8.视频仍在审核中或审核不通过',
                        },
                      },
                      like_rot_count: 0,
                      comment_rot_count: 0,
                      schedule_publish: '',
                      toast: {},
                      payment_due_date: '',
                      cid: '',
                    },
                    {
                      vid: 'b33389sylew',
                      title: 's27赛季，廉颇未老，对面武则天直接坐牢',
                      image_url: 'http://puui.qpic.cn/vpic_cover/b33389sylew/b33389sylew_hz.jpg/1280webp?1698637986',
                      upload_time: '2022-05-19 21:13',
                      duration: '01:03',
                      like: '0',
                      comment: '0',
                      allnumc: '353',
                      is_top: false,
                      is_delivery_successful: false,
                      is_exclusive: false,
                      is_vip: false,
                      status_show: {
                        '1': {
                          content: '',
                          title: '审核通过',
                          status: 2,
                        },
                      },
                      button: {
                        '1': {
                          button_status: 1,
                          reason: '',
                        },
                        '2': {
                          button_status: 1,
                          reason: '',
                        },
                        '3': {
                          button_status: 1,
                          reason: '视频将在个人频道页置顶',
                        },
                        '5': {
                          button_status: 3,
                          reason:
                            '该内容不可推广，可能原因：\n1.内测中，仅部分品类可用\n2.视频时长少于10s\n3.视频发布时间超过20天\n4.与同类视频内容重复度过高\n5.搬运其他视频\n6.内容与平台调性不相符\n7.视频画质等内容质量欠佳\n8.视频仍在审核中或审核不通过',
                        },
                      },
                      like_rot_count: 0,
                      comment_rot_count: 0,
                      schedule_publish: '',
                      toast: {},
                      payment_due_date: '',
                      cid: '',
                    },
                    {
                      vid: 'e33387hvsdn',
                      title: '没想到霸道总裁现实生活中是这样子《致命爱人》',
                      image_url: 'http://puui.qpic.cn/vpic_cover/e33387hvsdn/e33387hvsdn_vt.jpg/720webp?1698637986',
                      upload_time: '2022-05-17 23:28',
                      duration: '00:37',
                      like: '47',
                      comment: '0',
                      allnumc: '4913',
                      is_top: false,
                      is_delivery_successful: false,
                      is_exclusive: false,
                      is_vip: false,
                      status_show: {
                        '1': {
                          content: '',
                          title: '审核通过',
                          status: 2,
                        },
                      },
                      button: {
                        '1': {
                          button_status: 1,
                          reason: '',
                        },
                        '2': {
                          button_status: 1,
                          reason: '',
                        },
                        '3': {
                          button_status: 1,
                          reason: '视频将在个人频道页置顶',
                        },
                        '5': {
                          button_status: 3,
                          reason:
                            '该内容不可推广，可能原因：\n1.内测中，仅部分品类可用\n2.视频时长少于10s\n3.视频发布时间超过20天\n4.与同类视频内容重复度过高\n5.搬运其他视频\n6.内容与平台调性不相符\n7.视频画质等内容质量欠佳\n8.视频仍在审核中或审核不通过',
                        },
                      },
                      like_rot_count: 21,
                      comment_rot_count: 0,
                      schedule_publish: '',
                      toast: {},
                      payment_due_date: '',
                      cid: '',
                    },
                    {
                      vid: 'o33389ap5lx',
                      title: 's27 新赛季吕布有点无 敌，看我高能时刻',
                      image_url: 'http://puui.qpic.cn/vpic_cover/o33389ap5lx/o33389ap5lx_hz.jpg/1280webp?1698637986',
                      upload_time: '2022-05-17 20:59',
                      duration: '01:35',
                      like: '2',
                      comment: '0',
                      allnumc: '1372',
                      is_top: false,
                      is_delivery_successful: false,
                      is_exclusive: false,
                      is_vip: false,
                      status_show: {
                        '1': {
                          content: '',
                          title: '审核通过',
                          status: 2,
                        },
                      },
                      button: {
                        '1': {
                          button_status: 1,
                          reason: '',
                        },
                        '2': {
                          button_status: 1,
                          reason: '',
                        },
                        '3': {
                          button_status: 1,
                          reason: '视频将在个人频道页置顶',
                        },
                        '5': {
                          button_status: 3,
                          reason:
                            '该内容不可推广，可能原因：\n1.内测中，仅部分品类可用\n2.视频时长少于10s\n3.视频发布时间超过20天\n4.与同类视频内容重复度过高\n5.搬运其他视频\n6.内容与平台调性不相符\n7.视频画质等内容质量欠佳\n8.视频仍在审核中或审核不通过',
                        },
                      },
                      like_rot_count: 2,
                      comment_rot_count: 0,
                      schedule_publish: '',
                      toast: {},
                      payment_due_date: '',
                      cid: '',
                    },
                  ],
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
        const result = await getContentListAsync('success', 385423148, 1583409860, 1, 10);
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.code).toBe(0);
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('获取腾讯视频视频列表', async () => {
    const cookie =
      'pac_uid=0_c2b637e12e21c; iip=0; ptui_loginuin=33325126; RK=mH2YkWa5H4; ptcz=9e3b6d78d2eadb7eb1284a327cf3cc5de6c3db259c8487942655dc70cf7d57f3; video_guid=1938ff17d2cf12fc; qq_domain_video_guid_verify=1938ff17d2cf12fc; video_platform=2; _qpsvr_localtk=0.3418940691408938; main_login=qq; vqq_vuserid=380323299; vqq_access_token=861E73F17D4FEFE0A323EAC5D4BA7578; vqq_refresh_token=796B642F5064801D0CA845CB6C120267; vqq_openid=0F58E60E4310988B529DF46446EA5BA8; vqq_appid=101483052; qq_nick=%3A; qq_head=https://tvpic.gtimg.cn/head/c4282c97b1d125a76bc55a0e5b5da04910b985e959901c0a6e246922aa8e48589a5da28e/380; vcuid=9000389565; _qimei_uuid42=17a1e091e23100697f375c35a34c81641dde860015; _qimei_fingerprint=df2e68cad149762f4b814b424f0da1ae; _qimei_q36=; _qimei_h38=2db8a9497f375c35a34c816402000006517a1e; v_qq_com_session_lapse_time=1698656454256; vqq_vusession=e8ZP5ht2EuexAznKbOF_Jw.M';

    const result = await getContentListAsync(cookie, 385423148, 1583409860, 1, 10);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);
});
