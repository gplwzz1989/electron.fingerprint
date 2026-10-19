import { describe, expect, test } from 'vitest';
import { publishToutiaohaoArticle, ToutiaohaoArticleTaskInput } from '@/media-platform/toutiaohao/toutiaohao-article';
import { EventEmitter } from 'events';
import { Toutiaohao } from '../../../src';

describe.runIf(true)('【真实测试】', () => {
  test('头条号图文发布测试', async () => {
    const cookie =
      'gfgarrcache_79ad4616=1; s_v_web_id=verify_m7ojereu_pWMw08Df_XYiJ_4nIz_ByLy_2d0pND68rz7x; passport_csrf_token=892d62990eb1aa5f20640e32ca419df4; passport_csrf_token_default=892d62990eb1aa5f20640e32ca419df4; n_mh=NiapHmvsv_kDNVSiFvIHBvsbNE4_RRoW3EqcWkBYrBU; sso_uid_tt=00dd6fe5fa860dd9528fe9eb3d28aa17; sso_uid_tt_ss=00dd6fe5fa860dd9528fe9eb3d28aa17; toutiao_sso_user=67476f98aad704875fe106093212bf90; toutiao_sso_user_ss=67476f98aad704875fe106093212bf90; sid_ucp_sso_v1=1.0.0-KGE3YzkwMDc0Y2RjMGZjMGM5MGUxMDJmODNjZjg0YjdjMWQ5YzlhNzgKHQiCva_l-wEQ6PeFvgYYzwkgDDCK-pLNBTgGQPQHGgJobCIgNjc0NzZmOThhYWQ3MDQ4NzVmZTEwNjA5MzIxMmJmOTA; ssid_ucp_sso_v1=1.0.0-KGE3YzkwMDc0Y2RjMGZjMGM5MGUxMDJmODNjZjg0YjdjMWQ5YzlhNzgKHQiCva_l-wEQ6PeFvgYYzwkgDDCK-pLNBTgGQPQHGgJobCIgNjc0NzZmOThhYWQ3MDQ4NzVmZTEwNjA5MzIxMmJmOTA; passport_auth_status=411dc86bf73523c81f3ec51612dc61e8%2C; passport_auth_status_ss=411dc86bf73523c81f3ec51612dc61e8%2C; sid_guard=7ee189b02f2d9aaee15dbba4da311355%7C1740733418%7C5184000%7CTue%2C+29-Apr-2025+09%3A03%3A38+GMT; uid_tt=d2ce74c9375c55588297f6644b9478d3; uid_tt_ss=d2ce74c9375c55588297f6644b9478d3; sid_tt=7ee189b02f2d9aaee15dbba4da311355; sessionid=7ee189b02f2d9aaee15dbba4da311355; sessionid_ss=7ee189b02f2d9aaee15dbba4da311355; is_staff_user=false; sid_ucp_v1=1.0.0-KGUzOGEwMmU2ZTQxY2VlOGRlMzlmYWJkNzY5NTA5ODY0MzAzM2Y5NmYKFwiCva_l-wEQ6veFvgYYzwkgDDgGQPQHGgJscSIgN2VlMTg5YjAyZjJkOWFhZWUxNWRiYmE0ZGEzMTEzNTU; ssid_ucp_v1=1.0.0-KGUzOGEwMmU2ZTQxY2VlOGRlMzlmYWJkNzY5NTA5ODY0MzAzM2Y5NmYKFwiCva_l-wEQ6veFvgYYzwkgDDgGQPQHGgJscSIgN2VlMTg5YjAyZjJkOWFhZWUxNWRiYmE0ZGEzMTEzNTU; store-region=cn-hn; store-region-src=uid; gfkadpd=1231,25897; csrf_session_id=def4887086aaedc44ad5ac5708dcdac4; tt_webid=7476390673634297384; _ga=GA1.1.897664607.1742459495; odin_tt=d870eaa27d1de829d0abb30194c789eeec92cc19fc1b56e652f2c2c9d2a74ff36729009a7024eb055963ece4a0c2199a; ttwid=1%7CJP4pY9aBLizfFLDtL_3pIWKqxj9aZ1IEJ0KqSlTYvlg%7C1742461559%7C2bcc7a66922f4a7a34acded7afe343a065ca3c490f765811ed72d6cb7fb960a0; _ga_QEHZPBE5HH=GS1.1.1742459495.1.1.1742461559.0.0.0';

    const taskData: ToutiaohaoArticleTaskInput = {
      taskId: '66182f65-342c-4c0c-b87d-4e64ef2395b6',
      pubType: 1,
      title: '确认了！裁员6000余人！',
      covers: [
        {
          width: 478,
          height: 265,
          size: 29901,
          pathOrUrl:
            'C:\\Users\\ADMINI~1\\AppData\\Local\\Temp\\yixiaoer-lite\\image\\b2f0a5c0-f911-4546-8020-e2b3d44149ea.jpg',
        },
      ],
      content:
        '<p></p><div data-testid="article" xmlns="http://www.w3.org/1999/xhtml"><div><!--s-frag--><p data-mce-style="max-width: 100%;">5月31日，黑龙江哈尔滨遭遇强对流天气，同时伴随雷电和弱降雨，大风引发了短暂的扬沙。</p><!--/s-frag--></div><div><!--s-frag--><p data-mce-style="max-width: 100%;">有网友发帖称“哈尔滨著名景点索菲亚教堂棚顶掀飞”，6月1日，哈尔滨市道里区文化和旅游局工作人员向潇湘晨报记者表示，未收到索菲亚教堂受损报告。</p><!--/s-frag--></div><div><img src="https://oss-v2.yixiaoer.cn/ml/test/t-6821ac8d50bc5fd636fa9801/1780308154317.jpg" width="1169"></div><div><!--s-frag--><p data-mce-style="max-width: 100%;">△来自小红书截图</p><!--/s-frag--></div><div><img src="https://oss-v2.yixiaoer.cn/ml/test/t-6821ac8d50bc5fd636fa9801/1780308154321.jpg" width="1170"></div><div><!--s-frag--><p data-mce-style="max-width: 100%;">△5月31日下午6时的索菲亚教堂，图片来源@冰城小编</p><!--/s-frag--></div><div><!--s-frag--><p data-mce-style="max-width: 100%;">该工作人员称，当地文旅部门统计了各景区的损毁情况，“但索菲亚教堂没给我们上报”。工作人员还告诉记者，目前哈尔滨松花江观光索道都已经关闭，后续营业时间要看天气。</p><!--/s-frag--></div><div><!--s-frag--><p data-mce-style="max-width: 100%;">附近居民王先生@冰城小编 在社交平台发布了6月1日早上的教堂视频，他表示现场一切正常，有很多游客，但是今天的风还是很大。</p><!--/s-frag--></div><div><img src="https://oss-v2.yixiaoer.cn/ml/test/t-6821ac8d50bc5fd636fa9801/1780308155007.jpg" width="1170"></div><div><!--s-frag--><p data-mce-style="max-width: 100%;">△6月1日早上8时的索菲亚教堂，图片来源@冰城小编</p><!--/s-frag--></div><div><!--s-frag--><p data-mce-style="max-width: 100%;">位于索菲亚教堂景区内的商家“哈小雪·冻梨酥”告诉记者，今天店铺仍正常营业。</p><!--/s-frag--></div><div><!--s-frag--><p data-mce-style="max-width: 100%;">据哈尔滨市气象台消息，2026年6月1日1时30分继续发布大风黄色预警信号：未来15小时，全市平均风力4~6级，阵风8~9级，局地10级，大风同时多发分散性阵雨或雷阵雨，局地可能有冰雹，请注意防范。<span data-mce-style="max-width: 100%; text-transform: none;"></span></p><!--/s-frag--></div><div><!--s-frag--><p data-mce-style="max-width: 100%;">潇湘晨报·晨视频记者 罗海碧</p><!--/s-frag--></div><div><div><span data-testid="report-btn">举报/反馈</span></div></div></div><p></p>',
      adType: 0,
      location: {
        city: '',
        city_code: '',
      },
      claimExclusive: 0,
    };

    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });

    const result = await publishToutiaohaoArticle(cookie, taskData, eventCall);
    // assets
    console.log('头条图文发布：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('头条号图文状态查询', async () => {
    const cookie =
      'passport_csrf_token=2e56d08c57791ba40a7df6afc990c36d; passport_csrf_token_default=2e56d08c57791ba40a7df6afc990c36d; s_v_web_id=verify_m33t9x0i_MqoGU4A0_KGWX_4n7V_8Ep7_4MzobgLCYV5P; n_mh=vzBueMd0IslOEX34KAK9JtrhFU5IBWqJZPtO8_uOKbw; is_staff_user=false; store-region=cn-hn; store-region-src=uid; ttwid=1%7Cnf2fAJVYtgIaEqltbcFkqOfL5Z13eBXIDrDnv-0GdBU%7C1731049570%7Ce8f21bd4f61c0a7d01fbd4d3200597616b572173dbf5fb3f8d1ebe4e7191207b; sso_uid_tt=7359e13f31f924fb0eb0c77cb9b61b4a; sso_uid_tt_ss=7359e13f31f924fb0eb0c77cb9b61b4a; toutiao_sso_user=0ce154be5f716b607f462f355ef6efb0; toutiao_sso_user_ss=0ce154be5f716b607f462f355ef6efb0; sid_ucp_sso_v1=1.0.0-KDBjNzI4YzI1NWRjNTU5OTdmNDBjMGJlYjcyN2I3MjEzYTY5MjAwZGMKHQiZ8t_43AIQ7PC2uQYYzwkgDDC_ssDUBTgGQPQHGgJobCIgMGNlMTU0YmU1ZjcxNmI2MDdmNDYyZjM1NWVmNmVmYjA; ssid_ucp_sso_v1=1.0.0-KDBjNzI4YzI1NWRjNTU5OTdmNDBjMGJlYjcyN2I3MjEzYTY5MjAwZGMKHQiZ8t_43AIQ7PC2uQYYzwkgDDC_ssDUBTgGQPQHGgJobCIgMGNlMTU0YmU1ZjcxNmI2MDdmNDYyZjM1NWVmNmVmYjA; passport_auth_status=0aca321de4f51fc071735e300807fb14%2Cd04e8fc753ea74130f7323babf469483; passport_auth_status_ss=0aca321de4f51fc071735e300807fb14%2Cd04e8fc753ea74130f7323babf469483; sid_guard=5a83adc2d067959effa9f04e82c473b2%7C1731049581%7C5184001%7CTue%2C+07-Jan-2025+07%3A06%3A22+GMT; uid_tt=5ac97af9633845d485d6d1e1d4df1461; uid_tt_ss=5ac97af9633845d485d6d1e1d4df1461; sid_tt=5a83adc2d067959effa9f04e82c473b2; sessionid=5a83adc2d067959effa9f04e82c473b2; sessionid_ss=5a83adc2d067959effa9f04e82c473b2; sid_ucp_v1=1.0.0-KDdlZjAyMGEzMWMwNjUyZWRhMmNiZWM4ODgwNDA0Mjc1M2I5MDU2NTIKFwiZ8t_43AIQ7fC2uQYYzwkgDDgGQPQHGgJsZiIgNWE4M2FkYzJkMDY3OTU5ZWZmYTlmMDRlODJjNDczYjI; ssid_ucp_v1=1.0.0-KDdlZjAyMGEzMWMwNjUyZWRhMmNiZWM4ODgwNDA0Mjc1M2I5MDU2NTIKFwiZ8t_43AIQ7fC2uQYYzwkgDDgGQPQHGgJsZiIgNWE4M2FkYzJkMDY3OTU5ZWZmYTlmMDRlODJjNDczYjI; gfkadpd=1231,25897; odin_tt=f8da8d6874a3b24037d9210baa50b21dc81e6f7f132b019c36710cb5a273e59d5ac7f225b225cbd54c854c7de8e41fd7; ttcid=2d214732a9214a03b57bb25fddea000d43; tt_scid=f3eIy0SCrtRE3aQECkYiU5R3hJYNsT7yCjLorWYt2zUoACcb7sKSxN348RSME1GM2d79; csrf_session_id=cad7ecc9935e925eff509aef6ad46ba6';

    const result = await Toutiaohao.getToutiaohaoArticleStatus(cookie, '7441840173383565850');
    // assets
    console.log('头条图文发布：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});
