import { describe, expect, test } from 'vitest';
import { EventEmitter } from 'events';
import { ZhiHuDynamicTaskInput } from '../../../src/media-platform/zhihu/zhihu-dynamic';
import { Toutiaohao, Zhihu } from '../../../src';
import { PubContentEnum } from '../../../src/cloud/model/TypeEnum';
import { TouTiaoDynamicTaskInput } from '../../../src/media-platform/toutiaohao/toutiaohao-dynamic';
import { TouTiaoHao } from '../../../src/article-parse/platForms/TouTiaoHao';

describe.runIf(true)('【真实测试】', () => {
  test('头条短内容发布', async () => {
    const cookie =
      's_v_web_id=verify_mih4gwsz_8RtzetG7_84XY_4U0B_9BqL_DVxi7rRd39Es; passport_csrf_token=f029365e690999e323e96567f64d2f48; passport_csrf_token_default=f029365e690999e323e96567f64d2f48; passport_mfa_token=CjXkdDYlImReH7WV2G3RjYPeR%2BrF9JWms6obhNB2tkeGyj0b0J%2FD7Z0LQXFLwgcpkbVDF%2FW3dhpKCjwAAAAAAAAAAAAAT8PDfxYfcNMpQ35tzHV3iCKMkLyS%2BcD0WOZZUNiMMq4QURv6ewsFQ%2Bj0envGSpb5hLQQ4tSCDhj2sdFsIAIiAQN%2BIj88; d_ticket=83d6e965cac82fe1d875811832c17c7958dfa; n_mh=NiapHmvsv_kDNVSiFvIHBvsbNE4_RRoW3EqcWkBYrBU; sso_uid_tt=b1d4cd02434a521d72d82ab25941fa29; sso_uid_tt_ss=b1d4cd02434a521d72d82ab25941fa29; toutiao_sso_user=d82a3d1fb5fa777dfbb5a844c1be565e; toutiao_sso_user_ss=d82a3d1fb5fa777dfbb5a844c1be565e; sid_ucp_sso_v1=1.0.0-KGUyOTVkOTZlOWI5YjA2OWY0YjhmNzMwMmU2YTI4ZjU2MWIyMmUyMjkKHQiCva_l-wEQl4CgyQYYzwkgDDCK-pLNBTgCQPEHGgJobCIgZDgyYTNkMWZiNWZhNzc3ZGZiYjVhODQ0YzFiZTU2NWU; ssid_ucp_sso_v1=1.0.0-KGUyOTVkOTZlOWI5YjA2OWY0YjhmNzMwMmU2YTI4ZjU2MWIyMmUyMjkKHQiCva_l-wEQl4CgyQYYzwkgDDCK-pLNBTgCQPEHGgJobCIgZDgyYTNkMWZiNWZhNzc3ZGZiYjVhODQ0YzFiZTU2NWU; odin_tt=d8398ef5029046f89694cdbc0e98950fa82c4d83e85edb9d9be2d9b8676cda7c5a73614a4bbf194c009549985f9a15ae; sid_guard=ad5e8504f83a2cc3c2eb10bb587a08a4%7C1764229144%7C5184001%7CMon%2C+26-Jan-2026+07%3A39%3A05+GMT; uid_tt=49e2ffabc17511c376efa2dbf111d00f; uid_tt_ss=49e2ffabc17511c376efa2dbf111d00f; sid_tt=ad5e8504f83a2cc3c2eb10bb587a08a4; sessionid=ad5e8504f83a2cc3c2eb10bb587a08a4; sessionid_ss=ad5e8504f83a2cc3c2eb10bb587a08a4; session_tlb_tag=sttt%7C12%7CrV6FBPg6LMPC6xC7WHoIpP________-nGgZsze8g2RaVcwjQIQ-faRpEVIBdOWU56P-nLHV15p4%3D; session_tlb_tag_bk=sttt%7C12%7CrV6FBPg6LMPC6xC7WHoIpP________-nGgZsze8g2RaVcwjQIQ-faRpEVIBdOWU56P-nLHV15p4%3D; is_staff_user=false; sid_ucp_v1=1.0.0-KGZmMWQ2NjBiZTBjY2Y5ZjVhMTgwMGVmNDdiZWUzMWU1NTk4NWEzOTQKFwiCva_l-wEQmICgyQYYzwkgDDgCQPEHGgJscSIgYWQ1ZTg1MDRmODNhMmNjM2MyZWIxMGJiNTg3YTA4YTQ; ssid_ucp_v1=1.0.0-KGZmMWQ2NjBiZTBjY2Y5ZjVhMTgwMGVmNDdiZWUzMWU1NTk4NWEzOTQKFwiCva_l-wEQmICgyQYYzwkgDDgCQPEHGgJscSIgYWQ1ZTg1MDRmODNhMmNjM2MyZWIxMGJiNTg3YTA4YTQ; x-web-secsdk-uid=43c1772a-1b1c-4687-b3e0-c994bf6c044c; csrf_session_id=1d68a4682c64371e7a1d0ad84fdb16c0; gfkadpd=1231,25897; ttwid=1%7CYazrkFZXspzjZ17canTbQenuAKTSNxevfY8N7erF7j4%7C1768297628%7C65cdb3fadcf0d70ce3f51f7d394c4f5cc453041deb6cfe198f6b9abd79da4075';

    const taskData: TouTiaoDynamicTaskInput = {
      taskId: '13123123',
      desc: '<p>啊手动滑稽<topic text="搞笑">#搞笑ytuy</topic> <topic text="天气">#天气123</topic> 久啊速度快</p>"',

      images: [{width:1020,height:720,pathOrUrl:'I:\\download\\ac9f9f1a-320a-40d4-9cd4-d33bba55f6fb.jpg'}],
      pubType:0
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });

    const result = await Toutiaohao.publishDynamic(cookie, taskData, eventCall);

    console.log('头条态频发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('删除微头条', () => {
  test('删除微头条', async () => {
    const cookie =
      's_v_web_id=verify_memi75hl_bKWFheZK_UFrk_4MLH_8kRh_roFBvNGKVZfD; passport_csrf_token=0f8415663fc6057444c40adb5688f97e; passport_csrf_token_default=0f8415663fc6057444c40adb5688f97e; n_mh=NiapHmvsv_kDNVSiFvIHBvsbNE4_RRoW3EqcWkBYrBU; sso_uid_tt=f295c3165c639beeb7dd68435dfe985b; sso_uid_tt_ss=f295c3165c639beeb7dd68435dfe985b; toutiao_sso_user=27b04fe76b95d578db2000934d655ed6; toutiao_sso_user_ss=27b04fe76b95d578db2000934d655ed6; sid_ucp_sso_v1=1.0.0-KDcyMjYxMDFjYzcwOGUxMWIwNDI4NmMzMTVjZGZmZjQzNjE0MTM5ODYKHAiCva_l-wEQj7agxQYYzwkgDDCK-pLNBTgIQCYaAmhsIiAyN2IwNGZlNzZiOTVkNTc4ZGIyMDAwOTM0ZDY1NWVkNg; ssid_ucp_sso_v1=1.0.0-KDcyMjYxMDFjYzcwOGUxMWIwNDI4NmMzMTVjZGZmZjQzNjE0MTM5ODYKHAiCva_l-wEQj7agxQYYzwkgDDCK-pLNBTgIQCYaAmhsIiAyN2IwNGZlNzZiOTVkNTc4ZGIyMDAwOTM0ZDY1NWVkNg; odin_tt=ad75502d2f6fc5239f9f49587a2f6d1d324b3a11f918195051b77fb709bd5d4494c17bae01c45163b23112c380f52985; passport_auth_status=cdef58878fec91d410ade5ac1c76b1b4%2C87d47c1ea342731199b7ee117e2650b0; passport_auth_status_ss=cdef58878fec91d410ade5ac1c76b1b4%2C87d47c1ea342731199b7ee117e2650b0; sid_guard=e426e598dee4ceec2fb300640608b66a%7C1755847440%7C5184001%7CTue%2C+21-Oct-2025+07%3A24%3A01+GMT; uid_tt=ee453198e4397ec48c7965d7530dfe7b; uid_tt_ss=ee453198e4397ec48c7965d7530dfe7b; sid_tt=e426e598dee4ceec2fb300640608b66a; sessionid=e426e598dee4ceec2fb300640608b66a; sessionid_ss=e426e598dee4ceec2fb300640608b66a; session_tlb_tag=sttt%7C1%7C5CblmN7kzuwvswBkBgi2av_________DhWrTud7A1npf-KMIB7ogPlcaB00KS_9Qmk0IdPSgs6M%3D; is_staff_user=false; sid_ucp_v1=1.0.0-KGRlNzMwNDJiYzhkNWI4YjM4ZDIyZjIxY2Q1N2ExOTg5ZTdlMDc5OWIKFgiCva_l-wEQkLagxQYYzwkgDDgIQCYaAmhsIiBlNDI2ZTU5OGRlZTRjZWVjMmZiMzAwNjQwNjA4YjY2YQ; ssid_ucp_v1=1.0.0-KGRlNzMwNDJiYzhkNWI4YjM4ZDIyZjIxY2Q1N2ExOTg5ZTdlMDc5OWIKFgiCva_l-wEQkLagxQYYzwkgDDgIQCYaAmhsIiBlNDI2ZTU5OGRlZTRjZWVjMmZiMzAwNjQwNjA4YjY2YQ; csrf_session_id=c06059c351e558ba24402303f16f0789; gfkadpd=1231,25897; ttwid=1%7C45HHtVH0HUqaWMRK0mR5O3w0hazFfRfn1CoVKxTTawA%7C1756951316%7C98539419e65811e74acbd6eb7b19b37b71d6b80e7a13b2bbb04df8c77775f1a9';

    const result = await Toutiaohao.deleteToutiaohaoContent(cookie, PubContentEnum.dynamic, '1842311651054604');

    console.log('微头条发布：', result);
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('查询微头条', () => {
  test('头条查询微头条', async () => {
    const cookie =
      's_v_web_id=verify_mfxvb7iy_LF7rZpP8_yqDs_4RwX_ASUx_UR5BYOVwCVYt; passport_csrf_token=e33e5baab7f5a84b81508da421269c31; passport_csrf_token_default=e33e5baab7f5a84b81508da421269c31; n_mh=f16olLl6uQ_vd2lFcTR9JL_SYQdaQ7ml_NDMVAoPlbw; sso_uid_tt=e713dbcaea7d24937c5a80787bcb9fb2; sso_uid_tt_ss=e713dbcaea7d24937c5a80787bcb9fb2; toutiao_sso_user=f45fe059c418e5adcbfd23a99262c9a9; toutiao_sso_user_ss=f45fe059c418e5adcbfd23a99262c9a9; sid_ucp_sso_v1=1.0.0-KGI1M2IzNTA3M2QwNTM5M2U1MzlkYmIyMjhlOWQ1M2RjNWZmYWE5MDcKHwi4wND4qI3dBBDMnM_GBhjPCSAMMPrjo5UGOAZA9AcaAmhsIiBmNDVmZTA1OWM0MThlNWFkY2JmZDIzYTk5MjYyYzlhOQ; ssid_ucp_sso_v1=1.0.0-KGI1M2IzNTA3M2QwNTM5M2U1MzlkYmIyMjhlOWQ1M2RjNWZmYWE5MDcKHwi4wND4qI3dBBDMnM_GBhjPCSAMMPrjo5UGOAZA9AcaAmhsIiBmNDVmZTA1OWM0MThlNWFkY2JmZDIzYTk5MjYyYzlhOQ; odin_tt=d0f988d58d7e67ce6d3c19da9c1ad6823fbd07d077e264a23a2103fd81b58fc25d83a97bd44daa6df24fee886a24faa418baec6c43370ef416f692a1e644ca3c; passport_auth_status=a11a0ec6dbd31d5f3193ab015a9f73f8%2C; passport_auth_status_ss=a11a0ec6dbd31d5f3193ab015a9f73f8%2C; sid_guard=022389d922bf7b96976d3755cfae61b9%7C1758711375%7C5183999%7CSun%2C+23-Nov-2025+10%3A56%3A14+GMT; uid_tt=0f32e48bb327fade027d825fb9d835eb; uid_tt_ss=0f32e48bb327fade027d825fb9d835eb; sid_tt=022389d922bf7b96976d3755cfae61b9; sessionid=022389d922bf7b96976d3755cfae61b9; sessionid_ss=022389d922bf7b96976d3755cfae61b9; session_tlb_tag=sttt%7C8%7CAiOJ2SK_e5aXbTdVz65huf________-7Dcd69lMuXiUZl0tW3HI64KLHJyvi5pTIwQz1yyzDetA%3D; is_staff_user=false; sid_ucp_v1=1.0.0-KGU4N2RlY2EyZjhmZTFlMGEzZjc4YTc0YmE2ZWZkNDFmMzIyYzFmYjAKGQi4wND4qI3dBBDPnM_GBhjPCSAMOAZA9AcaAmxmIiAwMjIzODlkOTIyYmY3Yjk2OTc2ZDM3NTVjZmFlNjFiOQ; ssid_ucp_v1=1.0.0-KGU4N2RlY2EyZjhmZTFlMGEzZjc4YTc0YmE2ZWZkNDFmMzIyYzFmYjAKGQi4wND4qI3dBBDPnM_GBhjPCSAMOAZA9AcaAmxmIiAwMjIzODlkOTIyYmY3Yjk2OTc2ZDM3NTVjZmFlNjFiOQ; x-web-secsdk-uid=290e6d79-c1d0-48a3-8025-6c3a6776f6aa; csrf_session_id=4e65a2c9d58b12d7f026a5661089cf06; gfkadpd=1231,25897; ttwid=1%7C-DFoZFkb0e2qlP6D-WtbZVqSHXcZKkZO4fjeD0sRrJ8%7C1759042575%7Ccd611ce2eb0dee031a2399c615d072213bc39c9b3293a12665e6c26523df226fs_v_web_id=verify_mfxvb7iy_LF7rZpP8_yqDs_4RwX_ASUx_UR5BYOVwCVYt; passport_csrf_token=e33e5baab7f5a84b81508da421269c31; passport_csrf_token_default=e33e5baab7f5a84b81508da421269c31; n_mh=f16olLl6uQ_vd2lFcTR9JL_SYQdaQ7ml_NDMVAoPlbw; sso_uid_tt=e713dbcaea7d24937c5a80787bcb9fb2; sso_uid_tt_ss=e713dbcaea7d24937c5a80787bcb9fb2; toutiao_sso_user=f45fe059c418e5adcbfd23a99262c9a9; toutiao_sso_user_ss=f45fe059c418e5adcbfd23a99262c9a9; sid_ucp_sso_v1=1.0.0-KGI1M2IzNTA3M2QwNTM5M2U1MzlkYmIyMjhlOWQ1M2RjNWZmYWE5MDcKHwi4wND4qI3dBBDMnM_GBhjPCSAMMPrjo5UGOAZA9AcaAmhsIiBmNDVmZTA1OWM0MThlNWFkY2JmZDIzYTk5MjYyYzlhOQ; ssid_ucp_sso_v1=1.0.0-KGI1M2IzNTA3M2QwNTM5M2U1MzlkYmIyMjhlOWQ1M2RjNWZmYWE5MDcKHwi4wND4qI3dBBDMnM_GBhjPCSAMMPrjo5UGOAZA9AcaAmhsIiBmNDVmZTA1OWM0MThlNWFkY2JmZDIzYTk5MjYyYzlhOQ; odin_tt=d0f988d58d7e67ce6d3c19da9c1ad6823fbd07d077e264a23a2103fd81b58fc25d83a97bd44daa6df24fee886a24faa418baec6c43370ef416f692a1e644ca3c; passport_auth_status=a11a0ec6dbd31d5f3193ab015a9f73f8%2C; passport_auth_status_ss=a11a0ec6dbd31d5f3193ab015a9f73f8%2C; sid_guard=022389d922bf7b96976d3755cfae61b9%7C1758711375%7C5183999%7CSun%2C+23-Nov-2025+10%3A56%3A14+GMT; uid_tt=0f32e48bb327fade027d825fb9d835eb; uid_tt_ss=0f32e48bb327fade027d825fb9d835eb; sid_tt=022389d922bf7b96976d3755cfae61b9; sessionid=022389d922bf7b96976d3755cfae61b9; sessionid_ss=022389d922bf7b96976d3755cfae61b9; session_tlb_tag=sttt%7C8%7CAiOJ2SK_e5aXbTdVz65huf________-7Dcd69lMuXiUZl0tW3HI64KLHJyvi5pTIwQz1yyzDetA%3D; is_staff_user=false; sid_ucp_v1=1.0.0-KGU4N2RlY2EyZjhmZTFlMGEzZjc4YTc0YmE2ZWZkNDFmMzIyYzFmYjAKGQi4wND4qI3dBBDPnM_GBhjPCSAMOAZA9AcaAmxmIiAwMjIzODlkOTIyYmY3Yjk2OTc2ZDM3NTVjZmFlNjFiOQ; ssid_ucp_v1=1.0.0-KGU4N2RlY2EyZjhmZTFlMGEzZjc4YTc0YmE2ZWZkNDFmMzIyYzFmYjAKGQi4wND4qI3dBBDPnM_GBhjPCSAMOAZA9AcaAmxmIiAwMjIzODlkOTIyYmY3Yjk2OTc2ZDM3NTVjZmFlNjFiOQ; x-web-secsdk-uid=290e6d79-c1d0-48a3-8025-6c3a6776f6aa; csrf_session_id=4e65a2c9d58b12d7f026a5661089cf06; gfkadpd=1231,25897; ttwid=1%7C-DFoZFkb0e2qlP6D-WtbZVqSHXcZKkZO4fjeD0sRrJ8%7C1759042575%7Ccd611ce2eb0dee031a2399c615d072213bc39c9b3293a12665e6c26523df226f';

    const result = await Toutiaohao.getToutiaohaoDynamicStatus(cookie, '1844490132284428','');

    console.log('微头条查询：', result);
    expect(result.code).toBe(0);
  }, 10000000);
});
//endregion
