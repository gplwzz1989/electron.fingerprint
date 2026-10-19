import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { getUserStatisticAsync } from '@/media-platform/toutiaohao/toutiaohao-user.service';
import { AccountService, Platforms, Toutiaohao } from '../../../src';

describe.runIf(true)('【真实测试】', () => {
  const cookie =
    's_v_web_id=verify_m8zjdlbb_W0zWv760_eNoV_4pet_AlkY_lKYm1Z7rPFOh; passport_csrf_token=e293d5735a6546610d0217c7e5ff107f; passport_csrf_token_default=e293d5735a6546610d0217c7e5ff107f; ttwid=1%7CgV63G1vC-VLjSBSMSRkGyFVSwQjatjrOZUiKJCzISwI%7C1743574792%7C3380b17220c6829966459348194bcd90f5208986f535abfc98a003856c49d3d4; n_mh=f16olLl6uQ_vd2lFcTR9JL_SYQdaQ7ml_NDMVAoPlbw; sso_uid_tt=afad15d8805326cef6737e87e4d45794; sso_uid_tt_ss=afad15d8805326cef6737e87e4d45794; toutiao_sso_user=8dfb04faf0b6c2444cb01bffa81a243a; toutiao_sso_user_ss=8dfb04faf0b6c2444cb01bffa81a243a; sid_ucp_sso_v1=1.0.0-KDg2Zjg2NzY2OGQ2MGZhZWZlMjNlMmIwZmM2ODI1MDAxYmIwYzc1MzcKHgi4wND4qI3dBBCJrrO_BhjPCSAMMPrjo5UGOAhAJhoCaGwiIDhkZmIwNGZhZjBiNmMyNDQ0Y2IwMWJmZmE4MWEyNDNh; ssid_ucp_sso_v1=1.0.0-KDg2Zjg2NzY2OGQ2MGZhZWZlMjNlMmIwZmM2ODI1MDAxYmIwYzc1MzcKHgi4wND4qI3dBBCJrrO_BhjPCSAMMPrjo5UGOAhAJhoCaGwiIDhkZmIwNGZhZjBiNmMyNDQ0Y2IwMWJmZmE4MWEyNDNh; odin_tt=0b83294d972a37daecb01a7dc55251cd3515eaa4cd85a6423151a5fdc0ddd5db602c20fa0814aea5c104d95e33120e7ee3ee8add62f44847a688a0c6571f4260; passport_auth_status=8756514269ee0fb0addcf58c592ee5a7%2C26b0de1aa497d9fba254a720644a592b; passport_auth_status_ss=8756514269ee0fb0addcf58c592ee5a7%2C26b0de1aa497d9fba254a720644a592b; sid_guard=20d40bd4d6804deb437d2bba2051b790%7C1743574793%7C5184002%7CSun%2C+01-Jun-2025+06%3A19%3A55+GMT; uid_tt=84acd0873ea2a5431f92c6fe61eb43b6; uid_tt_ss=84acd0873ea2a5431f92c6fe61eb43b6; sid_tt=20d40bd4d6804deb437d2bba2051b790; sessionid=20d40bd4d6804deb437d2bba2051b790; sessionid_ss=20d40bd4d6804deb437d2bba2051b790; is_staff_user=false; sid_ucp_v1=1.0.0-KGVlNWI2MmYyNmYwZDE3ZjFmZTZkY2ExOWIxZWI3ODQzNWY0OGQ4ZjEKGAi4wND4qI3dBBCJrrO_BhjPCSAMOAhAJhoCaGwiIDIwZDQwYmQ0ZDY4MDRkZWI0MzdkMmJiYTIwNTFiNzkw; ssid_ucp_v1=1.0.0-KGVlNWI2MmYyNmYwZDE3ZjFmZTZkY2ExOWIxZWI3ODQzNWY0OGQ4ZjEKGAi4wND4qI3dBBCJrrO_BhjPCSAMOAhAJhoCaGwiIDIwZDQwYmQ0ZDY4MDRkZWI0MzdkMmJiYTIwNTFiNzkw; gfkadpd=1231,25897; csrf_session_id=7d83ff7e5350db9537304594a0f0a418';
  test('头条号用户统计数据', async () => {
    const result = await getUserStatisticAsync(cookie);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);

  test('搜索头条公开作者', async () => {
    const result = await Toutiaohao.searchToutiaohaoPublicAuthorList('人民日报');
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);

  test('搜索头条公开作品', async () => {
    const result = await Toutiaohao.searchToutiaohaoPublicWorkList('AI快速发展带来的益处');
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);

  test('头条号用户数据', async () => {
    const result = await Toutiaohao.getToutiaohaoUserInfo(cookie);
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);

  test('检测用户有效性', async () => {
    const cookie =
      's_v_web_id=verify_m6u692f6_LE4qYZZk_7pmu_4kNf_8M9g_4uCdHeSmyz4P; ttwid=1%7CtlDqjk34XaxRBWMBiyAiCVnrf29gYdCMyc2_P0bqGsY%7C1738896790%7Cf6cec33a5df3b4819ee97cb49247f615e6798c71b20c7b5d60502b2f283ed7ab; passport_csrf_token=5079991d332a4f3476ec0296dd885d31; passport_csrf_token_default=5079991d332a4f3476ec0296dd885d31; sso_uid_tt=939073136333a6d0d5cf9d1ecbfb7460; sso_uid_tt_ss=939073136333a6d0d5cf9d1ecbfb7460; toutiao_sso_user=b8fd356721fa89ed81090efb061bd9a6; toutiao_sso_user_ss=b8fd356721fa89ed81090efb061bd9a6; sid_ucp_sso_v1=1.0.0-KDM3YTYxZTNmYTljOWMyZGU2NzBlY2U0ZWE0OGZlOTk0NGI4YzYxMWQKFAirhpTihwIQpuuVvQYYzwk4CEALGgJobCIgYjhmZDM1NjcyMWZhODllZDgxMDkwZWZiMDYxYmQ5YTY; ssid_ucp_sso_v1=1.0.0-KDM3YTYxZTNmYTljOWMyZGU2NzBlY2U0ZWE0OGZlOTk0NGI4YzYxMWQKFAirhpTihwIQpuuVvQYYzwk4CEALGgJobCIgYjhmZDM1NjcyMWZhODllZDgxMDkwZWZiMDYxYmQ5YTY; odin_tt=c0d429b1f4829fcfbc53d7ee267fd5b02c1399e2623753e1d6f5730aa3aebdd5753a3fd9a82752fb7fb5f7ad9e8ffa0d; sid_guard=4a3ea9d89a102cf9f011fe971790f3ba%7C1738896806%7C3024002%7CFri%2C+14-Mar-2025+02%3A53%3A28+GMT; uid_tt=54805a1a99ed29bd78572be18ad43a95; uid_tt_ss=54805a1a99ed29bd78572be18ad43a95; sid_tt=4a3ea9d89a102cf9f011fe971790f3ba; sessionid=4a3ea9d89a102cf9f011fe971790f3ba; sessionid_ss=4a3ea9d89a102cf9f011fe971790f3ba; is_staff_user=false; sid_ucp_v1=1.0.0-KDM2NjM4MjJmYjc3ZTE3N2Y4MTI1YTRkY2QzNjZkNDk4ZGJhNzY1YWUKFQirhpTihwIQpuuVvQYYGCAMOAhACxoCbHEiIDRhM2VhOWQ4OWExMDJjZjlmMDExZmU5NzE3OTBmM2Jh; ssid_ucp_v1=1.0.0-KDM2NjM4MjJmYjc3ZTE3N2Y4MTI1YTRkY2QzNjZkNDk4ZGJhNzY1YWUKFQirhpTihwIQpuuVvQYYGCAMOAhACxoCbHEiIDRhM2VhOWQ4OWExMDJjZjlmMDExZmU5NzE3OTBmM2Jh; store-region=cn-sc; store-region-src=uid; gfkadpd=1231,25897';
    const result = await new AccountService(cookie, Platforms.TouTiaoHao).checkAccountAlive();
    console.log('有效性:' + result);
    expect(result).toBe(1);
  });
});
