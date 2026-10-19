import { describe, expect, test } from 'vitest';
import { AccountService, Azhan, Platforms } from '../../../src';

describe.runIf(true)('【真实测试】', () => {
  test('获取A站用户信息', async () => {
    const cookie =
      '_did=web_38651825917FF3AA; Hm_lvt_2af69bc2b378fb58ae04ed2a04257ed1=1748929484; ac_username=XxXxXxXxCc; ac_userimg=https%3A%2F%2Fimgs.aixifan.com%2Fstyle%2Fimage%2F201907%2FdytOs5icCUsbhzxD2rhaf9JwAYWuXCVl.jpg; acPostHint=2edfbe5462f1b38e989ef1f7fa857affdce9; acPasstoken=ChVpbmZyYS5hY2Z1bi5wYXNzdG9rZW4SYKt6n-Y8_lk2smzwq90pYX8T-OtYvbgwejkHbQ1H1Euo6LB_T-ypU52RsaCwTbpo6rbZP5o2ud_Sx-nt6vJnGN6p_P0XZ9xRCRyQtS2PPQNOsJMEXe7DNoFyBOia6EPCNhoSAxpUclERLkvrvWRT1WxekAG-IiBviRFVo1NWee9cZOx47wXryg21KslM_MrsuTwk95oQcigFMAE; auth_key=1369776; Hm_lpvt_2af69bc2b378fb58ae04ed2a04257ed1=1748929484; HMACCOUNT=3867B335D1F50DEF; cur_req_id=239092038AF2D96E_self_609936b5b31645b19d3c9dc8848382c5; cur_group_id=239092038AF2D96E_self_609936b5b31645b19d3c9dc8848382c5_0; cur_req_id=10210532588E8E94_self_609936b5b31645b19d3c9dc8848382c5; cur_group_id=10210532588E8E94_self_609936b5b31645b19d3c9dc8848382c5_0';

    const result = await Azhan.getAzhanUserInfo(cookie);
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);

  test('获取A站用户有效性检测', async () => {
    const cookie =
      '_did=web_4579899573B68E70; Hm_lvt_2af69bc2b378fb58ae04ed2a04257ed1=1754970165; HMACCOUNT=B70D28686BD0EF00; ac_username=A%E7%AB%99%E7%93%9C%E5%AD%90; ac_userimg=https%3A%2F%2Fimgs.aixifan.com%2Fstyle%2Fimage%2FdefaultAvatar.jpg; auth_key=77093305; acPostHint=51d88168248154b2f7e8756d2868b0796831; acPasstoken=ChVpbmZyYS5hY2Z1bi5wYXNzdG9rZW4SYI_N6tD8IaAkfFqsuaVzrdBgc1X9hdFNFXftNe8lgOYLT_bpbrzbCaPR8MGpTRH-dIqAOVqDXL7Nt0ePIxFf2Nfaz3rIvyHsqfe_SO4bqiZocsCzsn_IraOmGy6uv4tWXRoSdSuBLVtUzMYDGvG86sSYtPn6IiByMzPlSvnNnh8pgJnySNZDBskfsdtc6DxB9NWjmrREYSgFMAE; cur_req_id=759944464FDB7DD7_self_609936b5b31645b19d3c9dc8848382c5; cur_group_id=759944464FDB7DD7_self_609936b5b31645b19d3c9dc8848382c5_0; Hm_lpvt_2af69bc2b378fb58ae04ed2a04257ed1=1754979519';

    const result = await new AccountService(cookie, Platforms.AcFun).checkAccountAlive();
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result).toBe(1);
  }, 10000000);
});
