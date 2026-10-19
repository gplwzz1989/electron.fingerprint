import { describe, expect, test } from 'vitest';
import { AccountService, Cloud, Platforms } from '../../../src';
import { convertCookieStr } from '../../../src/utils';

describe.runIf(true)('【真实测试】', () => {
  test('豆包视频用户信息', async () => {
    const cookie = convertCookieStr(
      'gd_random=eyJwZXJjZW50IjowLjQzMDg2ODU1MDc2Mzg3MjEsIm1hdGNoIjpmYWxzZX0=.1uoufUvZs9yGjo+DKEsuYNsqZcC+hrOMLlU9oLNCt44=; hook_slardar_session_id=202604231353232E243876EBCA1895B7A5; s_v_web_id=verify_mnd0rx9u_kjKsDFYF_IZCc_4j0b_8jxc_clymb1G32CUz; passport_csrf_token=33af23f98358d3b3ac6d84baeec6b361; passport_csrf_token_default=33af23f98358d3b3ac6d84baeec6b361; multi_sids=889966524371632%3A5e4e63c07b21b27a19f3e6fd4f7edcd1; odin_tt=a3c17ae7433e531f96ce18fae04acfcfa9ce5c3aa7ccd21ed286a9fe33adcc3e7b1a8b208565fea8fce2483484f9db28846d3d67d9d74c22667ca9c17090fcfc; n_mh=ZWAHLX8HzBA6zFtA1kPTOTad0tS9bb2Kp7TAnX74Uug; uid_tt=39b83664cdd0146ec492f70cc92d7492; uid_tt_ss=39b83664cdd0146ec492f70cc92d7492; sid_tt=5e4e63c07b21b27a19f3e6fd4f7edcd1; sessionid=5e4e63c07b21b27a19f3e6fd4f7edcd1; sessionid_ss=5e4e63c07b21b27a19f3e6fd4f7edcd1; is_staff_user=false; has_biz_token=false; flow_cur_user_sec_id=Kz9bAGEdJCBsLCAyKEYvBgkAPTlFJTYgSxopIWg6VFN6Ay1DL3ULK0wEHj93CBFPJAc4RlkZMA==; __tea__ug__uid=7618942795521623598; locale=; et=236531fd82ce517049be0ba9528f8e78; sid_guard=5e4e63c07b21b27a19f3e6fd4f7edcd1%7C1776060567%7C2592000%7CWed%2C+13-May-2026+06%3A09%3A27+GMT; session_tlb_tag=sttt%7C12%7CXk5jwHshsnoZ8-b9T37c0f_________rNaDdsUCN-P0dEo2o7qCFFu-tNA8gEbMPnZoGqpWreLM%3D; sid_ucp_v1=1.0.0-KDM5Yzg3M2JlMjkyNjU4ZGQ1NjMzZmNiM2U1NGUwOTk0NDc2YjFlNmEKIAiwpbDUt63KARCXkfLOBhjCsR4gDDDt0N7NBjgHQPQHGgJscSIgNWU0ZTYzYzA3YjIxYjI3YTE5ZjNlNmZkNGY3ZWRjZDE; ssid_ucp_v1=1.0.0-KDM5Yzg3M2JlMjkyNjU4ZGQ1NjMzZmNiM2U1NGUwOTk0NDc2YjFlNmEKIAiwpbDUt63KARCXkfLOBhjCsR4gDDDt0N7NBjgHQPQHGgJscSIgNWU0ZTYzYzA3YjIxYjI3YTE5ZjNlNmZkNGY3ZWRjZDE; i18next=zh; flow_ssr_sidebar_expand=1; ttwid=1%7CwCFvF9yfjECBAj6Kqjk_iEbxP5SWf4x850YlK5XpFLs%7C1776923605%7Caae8f98b1434deb58a1c793b07157dc54fe3a48185a89e71b53d4c1ca5b9a1b9; biz_trace_id=594eaa2a',
    );
    const result = await Cloud.getPlatformUserInfo(Platforms.AI_DouBao, cookie);
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【真实测试】', () => {
  test('豆包用户有效性', async () => {
    const cookie =
      'i18next=zh; flow_ssr_sidebar_expand=1; s_v_web_id=verify_mliyfebm_v3GlzxbP_NrCn_4EX2_AVm3_pGjpcL79IaUG; passport_csrf_token=aa562ee09021c8108953a983602c8ab1; passport_csrf_token_default=aa562ee09021c8108953a983602c8ab1; odin_tt=1affcca2168a09bf26de9d224fccc4c0eafa677479b350e85b90b7377e4369e76abae90c237da82e209ad22ad915ffdf9e167f927b5d9b34bdc4015db5f36194; n_mh=Ly3cpI0HttCrDVWQcDXGfjjyhQBUNl2br9iT9DWATKY; sid_guard=b5532c9b71c7ea8611ddf808e5d51e39%7C1770870267%7C2592000%7CSat%2C+14-Mar-2026+04%3A24%3A27+GMT; uid_tt=34825a5ec3c01e929259d73877326d7c; uid_tt_ss=34825a5ec3c01e929259d73877326d7c; sid_tt=b5532c9b71c7ea8611ddf808e5d51e39; sessionid=b5532c9b71c7ea8611ddf808e5d51e39; sessionid_ss=b5532c9b71c7ea8611ddf808e5d51e39; session_tlb_tag=sttt%7C4%7CtVMsm3HH6oYR3fgI5dUeOf_________B12RvGRbNa_5CR8qsclb6gUhzkmk7dCb_BEFAMgU55gs%3D; is_staff_user=false; sid_ucp_v1=1.0.0-KDk5NDcxMWEwMzliOTQ3MjdjZDYxYjdiMzkxMGIzZGFmNWE0NmU2OTgKIAiZ97DP382zBxD7q7XMBhjCsR4gDDDqvP6-BjgHQPQHGgJobCIgYjU1MzJjOWI3MWM3ZWE4NjExZGRmODA4ZTVkNTFlMzk; ssid_ucp_v1=1.0.0-KDk5NDcxMWEwMzliOTQ3MjdjZDYxYjdiMzkxMGIzZGFmNWE0NmU2OTgKIAiZ97DP382zBxD7q7XMBhjCsR4gDDDqvP6-BjgHQPQHGgJobCIgYjU1MzJjOWI3MWM3ZWE4NjExZGRmODA4ZTVkNTFlMzk; ttwid=1%7CI1-v_J31qZj3pKSiAUjb-RGD58hRbJp_a3b1aRt1NC4%7C1770870268%7C51d7c52bafc73734c752fdae961aba45b35e0875b7822383391db42d86462d82; passport_fe_beating_status=true';

    const result = await new AccountService(cookie, Platforms.AI_DouBao).checkAccountAlive();
    console.log('有效性', result);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result).toBe(1);
  }, 10000000);
});
