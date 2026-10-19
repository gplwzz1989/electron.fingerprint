import { describe, expect, test } from 'vitest';
import { AccountService, Platforms } from '../../../src';
import { MeiYou } from '../../../src/media-platform/meiyou/meiyou';
import { convertCookieStr } from '../../../src/utils';
import { QueryWorker } from '../../../src/cloud/task/taskService';

describe.runIf(true)('【真实测试】', () => {
  test('美柚视频用户信息', async () => {
    const cookie =
      'aliyungf_tc=28cc3b31d9deb53e51886b4f36e7169faed234519259c2ad9053ff2e46ebac52; Hm_lvt_355b11fbaa46dee50a73dbe3c3a9944b=1760670258; HMACCOUNT=C8563F944436220B; my2_session=7407ac585746c5416df1520322e5ae94; my_sso_nick=MEIYOU%E7%93%9C%E5%AD%90; my_sso_avatar=https%3A%2F%2Fsc.seeyouyima.com%2Favatar_605285951; my_sso_passport=5.cagMyMgBKyxyaNorj5s8Qput4_WrAEs2R5Mbvv-kWdRXZPdoKU9FA1WaXbj-m3UNi4zzcCUgUWC0SymO9kOcpZU4o5fIGbnbaD88vjH5o4c; my_sso_platform=4; webLoginStatus=1; expireTime=1761832591; meiyou_mp=RpXpQlZYtBasRee4XFO-pUZlIzl1-akeTDdgVq5R-NFoE3iMBPmkTALbdsGxriSItuH87GCuJx2w628_hlgRN2A5zmJupfQCHSIUdxhwGzqR5gJcz3Yx5yo9WQn6Z1pccPimSQ48RKBDpTevMRlwpMVTcdCKFvTDOlLIDe3d2ppju-ZfH3BVh0NxxK94-zNOlIMvRLPQBmKUjOu8NHxcnUZGgJ2q41eDk7P5otEiXlQBH6SmL_kad_4OAg_vcxCklbQmanIEhfJov8c3z39p2ShwMVevaAUAa9f1ugy38eZR84T7ZP6lb-Yy0lLfkBTLD7rAE2pwDWpRPpFpWoN0RU1FzZnPEycXfp-8-_1tr2cmUtiG2nRcpa92GauHAoIaGyPPiBoz1ohraSpBiw8LAvPcZ6eKPRVxI_PWYdjVvvsv7_hUmpuGuwOOBf-QBb9L; Hm_lpvt_355b11fbaa46dee50a73dbe3c3a9944b=1761825390';

    const result = await new QueryWorker('', Platforms.MeiYou, {
      platformAccountId: '123',
      cookie: cookie,
    }).checkAccountAlive();
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});

describe.runIf(true)('【真实测试】', () => {
  test('美柚视频用户信息', async () => {
    const cookie =
      'aliyungf_tc=28cc3b31d9deb53e51886b4f36e7169faed234519259c2ad9053ff2e46ebac52; Hm_lvt_355b11fbaa46dee50a73dbe3c3a9944b=1760670258; HMACCOUNT=C8563F944436220B; my2_session=7407ac585746c5416df1520322e5ae94; my_sso_nick=MEIYOU%E7%93%9C%E5%AD%90; my_sso_avatar=https%3A%2F%2Fsc.seeyouyima.com%2Favatar_605285951; my_sso_passport=5.cagMyMgBKyxyaNorj5s8Qput4_WrAEs2R5Mbvv-kWdRXZPdoKU9FA1WaXbj-m3UNi4zzcCUgUWC0SymO9kOcpZU4o5fIGbnbaD88vjH5o4c; my_sso_platform=4; webLoginStatus=1; expireTime=1761832591; meiyou_mp=RpXpQlZYtBasRee4XFO-pUZlIzl1-akeTDdgVq5R-NFoE3iMBPmkTALbdsGxriSItuH87GCuJx2w628_hlgRN2A5zmJupfQCHSIUdxhwGzqR5gJcz3Yx5yo9WQn6Z1pccPimSQ48RKBDpTevMRlwpMVTcdCKFvTDOlLIDe3d2ppju-ZfH3BVh0NxxK94-zNOlIMvRLPQBmKUjOu8NHxcnUZGgJ2q41eDk7P5otEiXlQBH6SmL_kad_4OAg_vcxCklbQmanIEhfJov8c3z39p2ShwMVevaAUAa9f1ugy38eZR84T7ZP6lb-Yy0lLfkBTLD7rAE2pwDWpRPpFpWoN0RU1FzZnPEycXfp-8-_1tr2cmUtiG2nRcpa92GauHAoIaGyPPiBoz1ohraSpBiw8LAvPcZ6eKPRVxI_PWYdjVvvsv7_hUmpuGuwOOBf-QBb9L; Hm_lpvt_355b11fbaa46dee50a73dbe3c3a9944b=1761825390';

    const result = await new QueryWorker('', Platforms.MeiYou, {
      platformAccountId: '123',
      cookie: cookie,
    }).checkUserCanPublish();
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});
