import { describe, expect, test } from 'vitest';
import { AccountService, Platforms } from '../../../src';
import { KuaiChuanHao } from '../../../src/media-platform/kuaichuanhao/kuaichuanhao';

describe.runIf(true)('【真实测试】', () => {
  test('简书用户信息', async () => {
    const cookie =
      '__guid=66415028.1936393035361360400.1753773982213.1746; __asc=8c28a460e63939d522618379f97e1d66.1039.1760362419397; __asc2=25beb3595a43fc557614e6b5e3691c93cb4d226502f8.11ba.1760362419397; __DC_sid=66415028.761397761632235900.1761892139094.3345; PHPSESSID=6cbtvgca44iojdl98ts35u7um1; __quc_silent__=1; Q=u%3D360H3548013474%26n%3D%26le%3D%26m%3DZGHkWGWOWGWOWGWOWGWOWGWOZGV4%26qid%3D3548013474%26im%3D1_t011655040b3ed000bf%26src%3Dpcw_so%26t%3D1; __NS_Q=u%3D360H3548013474%26n%3D%26le%3D%26m%3DZGHkWGWOWGWOWGWOWGWOWGWOZGV4%26qid%3D3548013474%26im%3D1_t011655040b3ed000bf%26src%3Dpcw_so%26t%3D1; T=s%3D47da27b390388d9ac3e0a29f79e71d2b%26t%3D1761892362%26lm%3D0-1%26lf%3D2%26sk%3D68dbba26f4297bd6c0f5dce9f1fba0d4%26mt%3D1761892362%26rc%3D%26v%3D2.0%26a%3D1; __NS_T=s%3D47da27b390388d9ac3e0a29f79e71d2b%26t%3D1761892362%26lm%3D0-1%26lf%3D2%26sk%3D68dbba26f4297bd6c0f5dce9f1fba0d4%26mt%3D1761892362%26rc%3D%26v%3D2.0%26a%3D1; test_cookie_enable=null; __DC_monitor_count=2; __DC_gid=66415028.838190152.1753773983116.1761892368106.16';

    const result = await KuaiChuanHao.getKuaiChuanUserInfo(cookie);
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【真实测试】', () => {
  test('简书号用户信息', async () => {
    const cookie =
      '__guid=66415028.2488513434647137300.1748929788786.2205;PHPSESSID=kvbjfevadnrc4q6ttnv60ss6f4;Q=u%3D360H2916656783%26n%3D%26le%3D%26m%3DZGHjWGWOWGWOWGWOWGWOWGWOAwV5%26qid%3D2916656783%26im%3D1_t011bd1a43861defab2%26src%3Dpcw_so%26t%3D1;__NS_Q=u%3D360H2916656783%26n%3D%26le%3D%26m%3DZGHjWGWOWGWOWGWOWGWOWGWOAwV5%26qid%3D2916656783%26im%3D1_t011bd1a43861defab2%26src%3Dpcw_so%26t%3D1;T=s%3Dbe7f9cb86d2cc4ddd1214d39919b0204%26t%3D1748929856%26lm%3D0-4%26lf%3D%26sk%3D38f260820599ae6ee5b8e47e31296229%26mt%3D1748929856%26rc%3D%26v%3D2.0%26a%3D1;__NS_T=s%3Dbe7f9cb86d2cc4ddd1214d39919b0204%26t%3D1748929856%26lm%3D0-4%26lf%3D%26sk%3D38f260820599ae6ee5b8e47e31296229%26mt%3D1748929856%26rc%3D%26v%3D2.0%26a%3D1;test_cookie_enable=null;__DC_gid=66415028.764208711.1748929789763.1750069044510.13;';

    const result = await new AccountService(cookie, Platforms.KuaiChuanHao).checkAccountAlive();
    console.log('有效性', result);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result).toBe(1);
  }, 10000000);
});
