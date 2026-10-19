import { describe, expect, test } from 'vitest';
import { AccountService, Cloud, Platforms } from '../../../src';

describe.runIf(true)('【真实测试】', () => {
  test('获取csdn用户信息', async () => {
    const cookie =
      'fid=20_26532783714-1733813367477-247240;uuid_tt_dd=10_19961232730-1733813367454-573028;UN=pppppppasS;loginbox_strategy=%7B%22taskId%22%3A317%2C%22abCheckTime%22%3A1754380724035%2C%22version%22%3A%22ExpA%22%2C%22nickName%22%3A%22pppppppasS%22%7D;Hm_lvt_6bcd52f51e9b3dce32bec4a3997715ac=1754380725;UserName=pppppppasS;UserInfo=67d6930ad3da49f29dfb9237db69eaf2;UserToken=67d6930ad3da49f29dfb9237db69eaf2;UserNick=pppppppasS;AU=38B;BT=1754380755409;p_uid=U010000;csdn_newcert_pppppppasS=1;dc_sid=1ff124c640e64dd82553a8f78ca2ac8b;c_first_ref=default;c_segment=4;HMACCOUNT=4BA11B844C1A2262;c_first_page=https%3A//mp.csdn.net/;SESSION=c7eade19-bbee-4bbe-a2b0-9ecdb3dc1f1c;c_pref=default;dc_session_id=10_1756169396020.629241;c_page_id=default;log_Id_click=2;log_Id_pv=5;Hm_lpvt_6bcd52f51e9b3dce32bec4a3997715ac=1756169444;log_Id_view=60;dc_tos=t1ktgu;c_ref=default;c_dsid=11_1756170035286.147291;';
    const result = await Cloud.getPlatformUserInfo(Platforms.CSDN, cookie);
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(200);
  }, 10000000);
});

describe.runIf(true)('【真实测试】', () => {
  test('获取csdn用户有效性', async () => {
    const cookie =
      'dc_sid=8a82c0685007b124b4bedb49119e019f; c_pref=default; fid=20_90842149222-1725868634618-804164; c_first_ref=default; c_first_page=https%3A//mp.csdn.net/; uuid_tt_dd=10_19960782430-1725868627363-796245; c_segment=5; HMACCOUNT=5643AA0F77471DDA; UN=weixin_44188796; BT=1725868640624; c_ref=default; Hm_lvt_6bcd52f51e9b3dce32bec4a3997715ac=1737093788; Hm_lpvt_6bcd52f51e9b3dce32bec4a3997715ac=1737093788; loginbox_strategy=%7B%22taskId%22%3A317%2C%22abCheckTime%22%3A1756171836963%2C%22version%22%3A%22ExpA%22%2C%22nickName%22%3A%22%E6%A9%98%E5%AD%90%E5%91%B3%E7%9A%84%E6%A9%99%E6%B1%81%E5%84%BF%22%7D; SESSION=3916af6f-fdd5-424c-bab5-dcb80b61af28';
    const result = await new AccountService(cookie, Platforms.CSDN).checkAccountAlive();
    console.log('有效性', result);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});
