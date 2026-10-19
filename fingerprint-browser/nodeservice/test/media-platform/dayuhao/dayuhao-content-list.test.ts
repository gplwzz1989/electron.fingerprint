import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import {
  getContentListAsync,
  getDayuhaoContentSingleListAsync,
} from '@/media-platform/dayuhao/dayuhao-content-list.service';

describe('【Mock】', () => {
  describe('获取大鱼号内容列表', () => {
    const server = setupServer(
      rest.get('https://mp.dayu.com*/dashboard/getNewContentList', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              dataList: {
                data: [
                  {
                    _id: '585576782357339136',
                    content_id: '585576782357339136',
                    xss_item_id: '11453638048237276672',
                    origin_id: '4bb40fa1512a47308c812443f4aa95e8',
                    reproduce_from: {
                      wm_id: '',
                      wm_name: '',
                      article_id: '',
                    },
                    article_category: 1,
                    title: 's32赛季真的太好玩了',
                    cover_url: 'http://image.uc.cn/s/wemedia/s/upload/2023/9078dc06b50d56750ab7b75ef255ef00.jpg',
                    vertical_cover_url: '',
                    covers: [],
                    publish_at: '2023-11-06 18:26:08',
                    status: 1,
                    audit_status: 1,
                    is_show_ad: false,
                    is_original: 0,
                    is_exclusive: 0,
                    is_fans_show: 0,
                    _created_at: '2023-11-06T18:26:08.810+0800',
                    update_status_source: 0,
                    is_review: 0,
                    show_tips: false,
                    content_type: 1001,
                    show_modify: false,
                    not_modifiable_reason: '发布超过一周无法修改',
                    is_story: 0,
                    promotion_url: '',
                    format_type: 1002,
                    similar_item_status: 0,
                    hit_control_rule: '',
                    realData: {
                      cid: '585576782357339136',
                      click_pv: 0,
                      video_vv: 356,
                      like_pv: 0,
                      share_pv: 0,
                      comment_pv: 0,
                      fav_pv: 0,
                    },
                    item_type: 3,
                    qualityLevel: '',
                    qualityTags: [],
                    is_exclusive_disabled: false,
                    second_title: '',
                    other_info: {
                      video_id: 'cc734446aa156c0d',
                      video_playurl: 'http://v.ums.uc.cn/video/v_cc734446aa156c0d.html',
                      video_duration: 94000,
                      video_filename: '1.mp4',
                      video_status: 1,
                      width: 1560,
                      height: 720,
                      bitrate: '3554',
                      is_low_tag: false,
                      black: true,
                      video_crop: false,
                      delogotrace: false,
                    },
                    _app_extra: {
                      audit_remark: '',
                      source_platform: '1',
                      time_for_release: 0,
                    },
                    previewUrl:
                      'https://mobile.dayu.com/preview.html?type=2&wm_cid=585576782357339136&ts=1700012526252&acl=f31427c37362bac7ddee74e679dbf79a&uc_biz_str=S:custom%7CC:iflow_wm2&uc_param_str=frdnsnpfvecpntnwprdssskt&wm_id=9dd14278b7814534ae9bad91ab8d1d76',
                    ucUrl:
                      'https://mparticle.uc.cn/video.html?uc_param_str=frdnsnpfvecpntnwprdssskt&wm_id=9dd14278b7814534ae9bad91ab8d1d76&wm_aid=4bb40fa1512a47308c812443f4aa95e8',
                    videoStatLink: '/dashboard/stat/single-product#!content_id=585576782357339136&type=video',
                    longVideo: false,
                  },
                  {
                    _id: '521587132702131200',
                    content_id: '521587132702131200',
                    xss_item_id: '2508728391486048301',
                    origin_id: 'a67f65abeedc4cc5857c2cc89e5df9a0',
                    reproduce_from: {
                      wm_id: '',
                      wm_name: '',
                      article_id: '',
                    },
                    article_category: 1,
                    title: 's29赛季赵云真的很无解，出装铭文是关键',
                    cover_url: 'http://image.uc.cn/s/wemedia/s/upload/2022/f343486e71c467a4d4f86c1d697e2c9a.jpg',
                    vertical_cover_url: '',
                    covers: [],
                    publish_at: '2022-11-18 14:42:06',
                    status: 1,
                    audit_status: 1,
                    is_show_ad: false,
                    is_original: 0,
                    is_exclusive: 0,
                    is_fans_show: 0,
                    _created_at: '2022-11-18T14:42:06.113+0800',
                    update_status_source: 0,
                    is_review: 0,
                    show_tips: false,
                    content_type: 1001,
                    show_modify: false,
                    not_modifiable_reason: '发布超过一周无法修改',
                    is_story: 0,
                    promotion_url: '',
                    format_type: 1002,
                    similar_item_status: 0,
                    hit_control_rule: '',
                    realData: {
                      cid: '521587132702131200',
                      click_pv: 1,
                      video_vv: 7,
                      like_pv: 0,
                      share_pv: 0,
                      comment_pv: 0,
                      fav_pv: 0,
                    },
                    item_type: 3,
                    qualityLevel: '',
                    qualityTags: [],
                    is_exclusive_disabled: false,
                    second_title: '',
                    other_info: {
                      video_id: '99f54b768b49a6bc',
                      video_playurl: 'http://v.ums.uc.cn/video/v_99f54b768b49a6bc.html',
                      video_duration: 94000,
                      video_filename: '横版视频.mp4',
                      video_status: 1,
                      width: 1560,
                      height: 720,
                      bitrate: '3554',
                      is_low_tag: false,
                      black: false,
                      video_crop: false,
                      delogotrace: false,
                    },
                    _app_extra: {
                      audit_remark: '',
                      source_platform: '1',
                      time_for_release: 0,
                    },
                    previewUrl:
                      'https://mobile.dayu.com/preview.html?type=2&wm_cid=521587132702131200&ts=1700012526252&acl=7d07016e4b7baf60d52cad41b12d998a&uc_biz_str=S:custom%7CC:iflow_wm2&uc_param_str=frdnsnpfvecpntnwprdssskt&wm_id=9dd14278b7814534ae9bad91ab8d1d76',
                    ucUrl:
                      'https://mparticle.uc.cn/video.html?uc_param_str=frdnsnpfvecpntnwprdssskt&wm_id=9dd14278b7814534ae9bad91ab8d1d76&wm_aid=a67f65abeedc4cc5857c2cc89e5df9a0',
                    videoStatLink: '/dashboard/stat/single-product#!content_id=521587132702131200&type=video',
                    longVideo: false,
                  },
                  {
                    _id: '521587012866671616',
                    content_id: '521587012866671616',
                    xss_item_id: '8951269245991701870',
                    origin_id: '752b6937d3aa480988178639382ebee9',
                    reproduce_from: {
                      wm_id: '',
                      wm_name: '',
                      article_id: '',
                    },
                    article_category: 0,
                    title: '那些很会穿的女生，原来都在这里买衣服',
                    cover_url: 'http://image.uc.cn/s/wemedia/s/2022/7a0f5ec5301fb73a73330f1f2883b90d.jpg',
                    vertical_cover_url: '',
                    covers: [
                      {
                        source: 1,
                        url: 'http://image.uc.cn/s/wemedia/s/2022/7a0f5ec5301fb73a73330f1f2883b90d.jpg',
                        format: 'jpeg',
                        height: 607,
                        width: 1080,
                        phash: '2736141E0F8DDD69',
                        size: 70660,
                        srcUrl: 'http://image.uc.cn/s/wemedia/s/2022/7a0f5ec5301fb73a73330f1f2883b90d.jpg',
                      },
                      {
                        source: 1,
                        url: 'http://image.uc.cn/s/wemedia/s/2022/6bc9617e84c65755693ce2a16ee223eb.jpg',
                        format: 'jpeg',
                        height: 360,
                        width: 640,
                        phash: '6C4CABCAAC859DAA',
                        size: 59782,
                        srcUrl: 'http://image.uc.cn/s/wemedia/s/2022/6bc9617e84c65755693ce2a16ee223eb.jpg',
                      },
                      {
                        source: 1,
                        url: 'http://image.uc.cn/s/wemedia/s/2022/e8c3f34c7a867a09b016762e085e7ff0.jpg',
                        format: 'jpeg',
                        height: 421,
                        width: 750,
                        phash: 'CCCCCD4CACAC3571',
                        size: 27737,
                        srcUrl: 'http://image.uc.cn/s/wemedia/s/2022/e8c3f34c7a867a09b016762e085e7ff0.jpg',
                      },
                    ],
                    publish_at: '2022-11-18 14:41:08',
                    status: 1,
                    audit_status: 4,
                    is_show_ad: false,
                    is_original: 0,
                    is_exclusive: 0,
                    is_fans_show: 0,
                    _created_at: '2022-11-18T14:41:08.971+0800',
                    update_status_source: 0,
                    is_review: 0,
                    show_tips: true,
                    content_type: 1001,
                    show_modify: false,
                    not_modifiable_reason: '发布超过一周无法修改',
                    is_story: 0,
                    promotion_url: '',
                    format_type: 1001,
                    similar_item_status: 0,
                    hit_control_rule: '',
                    realData: {
                      cid: '521587012866671616',
                      click_pv: 3,
                      video_vv: 0,
                      like_pv: 0,
                      share_pv: 0,
                      comment_pv: 0,
                      fav_pv: 0,
                    },
                    item_type: 1,
                    qualityLevel: '',
                    qualityTags: [],
                    is_exclusive_disabled: false,
                    second_title: '',
                    _app_extra: {
                      audit_remark: '内容质量不符合要求，可能无法获得平台推荐。',
                      source_platform: '1',
                      time_for_release: 0,
                    },
                    articleStatLink: '/dashboard/stat/single-product#!content_id=521587012866671616&type=article',
                    previewUrl:
                      'https://mparticle.uc.cn/preview.html?type=2&wm_cid=521587012866671616&ts=1700012526252&acl=ce8fe4673347905b73faa31e8a99d256&uc_biz_str=S:custom%7CC:iflow_wm2&uc_param_str=frdnsnpfvecpntnwprdssskt&wm_id=9dd14278b7814534ae9bad91ab8d1d76',
                  },
                ],
                totalPage: 1,
                metadata: {
                  total: 3,
                  max_pos: 1000000,
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
        const result = await getContentListAsync('success', 1, 'all', 'all');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.dataList.data).length(3);
      });
    });
  });

  describe('获取大鱼号单篇内容列表', () => {
    const server = setupServer(
      rest.get('https://mp.dayu.com*/api/stat/productList', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              data: [
                {
                  _id: '584821882478398464',
                  content_id: '584821882478398464',
                  aid: '584821905033269248',
                  wm_id: 'b4aac901c7fa40769082058b29a53ebf',
                  title: '你用千里眼来看看，发现了什么？！#段子 #搞笑视频',
                  cover_url: 'http://image.uc.cn/s/wemedia/s/upload/2023/210a4321c83e0b2f919411aeb4d32364.jpg',
                  publish_at: '2023-11-02 14:26:44',
                  status: 1,
                  horizontal_cover_url:
                    'http://image.uc.cn/s/wemedia/s/upload/2023/210a4321c83e0b2f919411aeb4d32364.jpg',
                  format_type: 1002,
                  biz_id: 1035,
                  vugc_object_id: '584821905033269248',
                  read_pv_all: 0,
                  video_vv_all: 31,
                  txt_list_click_ratio: '0.0',
                  vdo_list_click_ratio: 0,
                  avg_read_times: 0,
                  avg_play_times: 5,
                  show_pv_all: 75,
                  like_pv_all: 0,
                  comment_pv_all: 0,
                  share_url:
                    'https://share.v.uc.cn/video/share?module_id=0&size=4&biz_id=1014&scene_id=muggle&xss_item_id=&video_id=584821905033269248',
                  ds: 20231114,
                },
                {
                  _id: '584503785670312960',
                  content_id: '584503785670312960',
                  aid: '584503808093068288',
                  wm_id: 'b4aac901c7fa40769082058b29a53ebf',
                  title: '半速集合啦~上车！',
                  cover_url: 'http://image.uc.cn/s/wemedia/s/upload/2023/4ad97f6277af3e0847b1ae057bb08a7b.jpg',
                  publish_at: '2023-10-31 20:18:43',
                  status: 1,
                  horizontal_cover_url:
                    'http://image.uc.cn/s/wemedia/s/upload/2023/4ad97f6277af3e0847b1ae057bb08a7b.jpg',
                  format_type: 1002,
                  biz_id: 1035,
                  vugc_object_id: '584503808093068288',
                  read_pv_all: 0,
                  video_vv_all: 93,
                  txt_list_click_ratio: '0.0',
                  vdo_list_click_ratio: 0,
                  avg_read_times: 0,
                  avg_play_times: 3,
                  show_pv_all: 291,
                  like_pv_all: 0,
                  comment_pv_all: 0,
                  share_url:
                    'https://share.v.uc.cn/video/share?module_id=0&size=4&biz_id=1014&scene_id=muggle&xss_item_id=&video_id=584503808093068288',
                  ds: 20231114,
                },
              ],
              total: 16,
              metadata: {
                total: 31,
                max_pos: 1699977599,
                since_pos: 1652889600,
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
        const result = await getDayuhaoContentSingleListAsync('success', '', 'all', 1, 10);
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.data).length(2);
      });
    });
  });
});

describe.runIf(false)('【真实测试】', () => {
  test('获取大鱼号内容列表', async () => {
    const cookie =
      'cna=cLmZHS8x8HUCAdzK6KvT+DDo; _UP_A4A_11_=wb9051252d0048d4bf67e9d3f7ebc5a3; _UP_335_2B_=1; _pk_id.0044d54c18eb.bb64=cfbfbec8-fc95-4cef-8eaa-b610b5675290.1695795359.1.1695795359.1695795359.; _pk_id.0044d54c18eb.bb64=cfbfbec8-fc95-4cef-8eaa-b610b5675290.1695795359.1.1695795359.1695795359.; xlly_s=1; _UP_D_=pc; _UP_30C_6A_=st9076201dar8fd8iy5dl3l3mpvg8f1k; _UP_TS_=sg15e636e9659842608c7edd24f22f1231e; _UP_E37_B7_=sg15e636e9659842608c7edd24f22f1231e; _UP_TG_=st9076201dar8fd8iy5dl3l3mpvg8f1k; USER_TMP=uEyJWRKhpWGHgX8JwBWypg.T_7-DdhAfrG-2O26hhcCAGk_cdffD7OkrLEJqzhRCB6SQ5Ud3glmtkBQJ6UIZOV7K-vNg7wZFNPlymThprji3q3xpGYUTo2t2Mj8FY-HMXFVGFaqyEZLIKIjmM2_O81E6pOpDqgrclnAWUt52yTFxYktFttdqD4qXJZe1Zd43zEkmvj-3B9ho1-mbV0owp0g_aUn0xqbHBl2AukEv2YaSGzBys61VbQTGGHCSjTOuN64vtJN4cg_Rj0ZwygWFSza0YfeGiesFUEZ1kfXCEcd-CpMFpfbEdAS8wnK4e0zlU6fA12PEHAj4DD436_-ZEcEoSkH6Z8Kp4MYlFmrUlXnHSLMKNlW5_AkeqAGep9zVTjKh6ie14dFselrmKlzRxzqR7fQGwG1ZdhIsz0eAvT0GjF8-oQqXtMzzs9F50NkOsB2n0uPsfPhlybRHztU-nH2jpe6JKTUw72RI3GRkswqJKV_jO7ixnTfWrsHpGpBiosA_UStIcC7X8deNjFpXUX0jUSyv5_rWU0bn4MgVZ6GWVQ-51BcFBQ_bGtqmsc4u-nwo6xde5Bb3lwH7nzMsxvf8pfNweROqFasXXEiXhWkQzutIHgTSOZXgDXkDGnDcu_PWQBl08og8ZVU-afODGjzI8686JPEnPtuJ6YCpC53ApKH-3xn5pSiEudlnkDeMCdNCs-Vl-xWD6e4NZm51niIC-eazycMEfghFOR5s76RO_CYaUC9PJi0ypDtuIElQriSgfqkSTB59kEXZp9c4atGm3K3WJ3SYviDhNR2PkdcYQPBQXBT_YCHa7sUcCn25WoJeiSEQHDR5UqFY-il1Dkf4GDoJ8wn2IPjkbiKUwYeavRCxtiD3Jw5sUHfZobY5TPZdwPwZvmMUR6uGW7aJ1XOsP6DTzwrYonUaegLnrMG8n3p_48_GkLRHMmtM61fofHfaP0lOT1J3pFE3Zg_KN0KamNs_8y81hZIfeSJ1nZzsPf9y3-rVz13kemcutbhIvABwB4z44ft9JgKz1cRebSnPexqNr6EDYxYq9QSDO3y4viFK8EU9zcdXyga2iN-Z5jAROvAC8MfodK6nLOsTfMPThkgP0OiUu8wpz6I_9ILo91YwSC2PR2eRTnR32NMqIor4Go07fngn6RYh_8yMxPf8YnnI7YRwtajWOO3G9p0QSnKaWsrOZZWBBERXyukYWA.1699952630765.604800000.Xatney5lcZt_i3meQathq-VoserQEKHkT2f7LlkMtuM; tfstk=dcq9mJGuB6fM3vtTUCQhg8YewsBhZleN95yWmjcMlWFLt-gbmN8McyFbTVc1gNlXHSFFQxfqfm3bU5EimOo6GqNgFPVY3OkjGSNxiPbhqRyZ0m1oDgbuQuAbNp6k0QEKimofZ_YHcVS-07KqCsItQn1yS9tgjyH1oL1WfIGWOY3tNJQycnKoQQc8Cv-XcXDOQuEu2CgDZbHD59BpuEusLi93oJ1..; isg=BERENrFw_WPpvklv3TzKih6FFcI2XWjHl1kTJV7lco_SieVThm1dVr1oySFRlqAf';

    const result = await getContentListAsync(cookie, 1, 'all', 'all');
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.dataList.data).length(10);
  }, 10000000);

  test('获取大鱼号单篇内容列表', async () => {
    const cookie =
      'cna=cLmZHS8x8HUCAdzK6KvT+DDo; _UP_A4A_11_=wb9051252d0048d4bf67e9d3f7ebc5a3; _UP_335_2B_=1; _pk_id.0044d54c18eb.bb64=cfbfbec8-fc95-4cef-8eaa-b610b5675290.1695795359.1.1695795359.1695795359.; _pk_id.0044d54c18eb.bb64=cfbfbec8-fc95-4cef-8eaa-b610b5675290.1695795359.1.1695795359.1695795359.; xlly_s=1; _UP_D_=pc; _UP_30C_6A_=st9076201dar8fd8iy5dl3l3mpvg8f1k; _UP_TS_=sg15e636e9659842608c7edd24f22f1231e; _UP_E37_B7_=sg15e636e9659842608c7edd24f22f1231e; _UP_TG_=st9076201dar8fd8iy5dl3l3mpvg8f1k; USER_TMP=uEyJWRKhpWGHgX8JwBWypg.T_7-DdhAfrG-2O26hhcCAGk_cdffD7OkrLEJqzhRCB6SQ5Ud3glmtkBQJ6UIZOV7K-vNg7wZFNPlymThprji3q3xpGYUTo2t2Mj8FY-HMXFVGFaqyEZLIKIjmM2_O81E6pOpDqgrclnAWUt52yTFxYktFttdqD4qXJZe1Zd43zEkmvj-3B9ho1-mbV0owp0g_aUn0xqbHBl2AukEv2YaSGzBys61VbQTGGHCSjTOuN64vtJN4cg_Rj0ZwygWFSza0YfeGiesFUEZ1kfXCEcd-CpMFpfbEdAS8wnK4e0zlU6fA12PEHAj4DD436_-ZEcEoSkH6Z8Kp4MYlFmrUlXnHSLMKNlW5_AkeqAGep9zVTjKh6ie14dFselrmKlzRxzqR7fQGwG1ZdhIsz0eAvT0GjF8-oQqXtMzzs9F50NkOsB2n0uPsfPhlybRHztU-nH2jpe6JKTUw72RI3GRkswqJKV_jO7ixnTfWrsHpGpBiosA_UStIcC7X8deNjFpXUX0jUSyv5_rWU0bn4MgVZ6GWVQ-51BcFBQ_bGtqmsc4u-nwo6xde5Bb3lwH7nzMsxvf8pfNweROqFasXXEiXhWkQzutIHgTSOZXgDXkDGnDcu_PWQBl08og8ZVU-afODGjzI8686JPEnPtuJ6YCpC53ApKH-3xn5pSiEudlnkDeMCdNCs-Vl-xWD6e4NZm51niIC-eazycMEfghFOR5s76RO_CYaUC9PJi0ypDtuIElQriSgfqkSTB59kEXZp9c4atGm3K3WJ3SYviDhNR2PkdcYQPBQXBT_YCHa7sUcCn25WoJeiSEQHDR5UqFY-il1Dkf4GDoJ8wn2IPjkbiKUwYeavRCxtiD3Jw5sUHfZobY5TPZdwPwZvmMUR6uGW7aJ1XOsP6DTzwrYonUaegLnrMG8n3p_48_GkLRHMmtM61fofHfaP0lOT1J3pFE3Zg_KN0KamNs_8y81hZIfeSJ1nZzsPf9y3-rVz13kemcutbhIvABwB4z44ft9JgKz1cRebSnPexqNr6EDYxYq9QSDO3y4viFK8EU9zcdXyga2iN-Z5jAROvAC8MfodK6nLOsTfMPThkgP0OiUu8wpz6I_9ILo91YwSC2PR2eRTnR32NMqIor4Go07fngn6RYh_8yMxPf8YnnI7YRwtajWOO3G9p0QSnKaWsrOZZWBBERXyukYWA.1699952630765.604800000.Xatney5lcZt_i3meQathq-VoserQEKHkT2f7LlkMtuM; tfstk=dcq9mJGuB6fM3vtTUCQhg8YewsBhZleN95yWmjcMlWFLt-gbmN8McyFbTVc1gNlXHSFFQxfqfm3bU5EimOo6GqNgFPVY3OkjGSNxiPbhqRyZ0m1oDgbuQuAbNp6k0QEKimofZ_YHcVS-07KqCsItQn1yS9tgjyH1oL1WfIGWOY3tNJQycnKoQQc8Cv-XcXDOQuEu2CgDZbHD59BpuEusLi93oJ1..; isg=BERENrFw_WPpvklv3TzKih6FFcI2XWjHl1kTJV7lco_SieVThm1dVr1oySFRlqAf';

    const result = await getDayuhaoContentSingleListAsync(cookie, '2022-05-19', '2023-11-14', 1, 2);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.data).length(2);
  }, 10000000);
});
