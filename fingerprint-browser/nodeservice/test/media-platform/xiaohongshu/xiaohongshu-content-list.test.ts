import { describe, expect, test } from 'vitest';
import {
  getAnalyzeContentListResponse,
  getContentListAsync,
} from '@/media-platform/xiaohongshu/xiaohongshu-content-list.service';
describe.runIf(false)('【真实测试】', () => {
  test('获取小红书笔记列表', async () => {
    const cookie =
      'xsecappid=ugc;a1=198088aab178vrwcvzdo3mcas52u1l2py35vmztud50000264120;webId=df0df5615e8e171eca66b577be452a88;gid=yjY8YY0S8yvKyjY8YY00Dqu9yWYhFEShuflq27f6S0M2Jh287y1JU6888JK4yJ88qd8WYD4j;customer-sso-sid=68c517526887408694915442cqrecemqiujwzmfm;x-user-id-creator.xiaohongshu.com=6671534200000000070043c7;customerClientId=111152070417828;access-token-creator.xiaohongshu.com=customer.creator.AT-68c517526887408695234677kteuufwwnsv0ixgp;galaxy_creator_session_id=FJhksYetpDKip0L0U2kwwrV6Uvb9iFBlnhxp;galaxy.creator.beaker.session.id=1752490040541097841355;acw_tc=0ad5877917527414915382310ef8d908d2c18c5f4f1f04e1e40d8ed8c90c6e;websectiga=cf46039d1971c7b9a650d87269f31ac8fe3bf71d61ebf9d9a0a87efb414b816c;sec_poison_id=c75169d3-f307-400a-908c-de2b67ab6cb7;';

    const result = await getContentListAsync(cookie, 1);
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});
describe.runIf(true)('【真实测试】', () => {
  //getAnalyzeContentListResponse
  test('获取小红书笔记列表', async () => {
    const cookie =
      'xsecappid=ugc; a1=19a9a10cab1n38axhdpsoppg0a6oxhql3362o2ueu30000192833; webId=6564cc332b439019285efe824b91669f; gid=yj0j0y8f4Sqjyj0j0y8S0qJ7DyIqY0CxfUMlKd7UUk80KJq8lCxA1l888yjJYqq8dfiyjqd0; x-user-id-creator.xiaohongshu.com=5f326081000000000101ff2c; customerClientId=316590064830864; access-token-creator.xiaohongshu.com=customer.creator.AT-68c517574266708896464902nd2ozx4teryfg2o3; galaxy_creator_session_id=pmrBsw5p19wBFxLkuSI0AQZFBQqIV1MyIUIg; galaxy.creator.beaker.session.id=1763521393774007808073; acw_tc=0a0d0f5817653664840931289eb61eeabe160170b8cf3a35649ef4aa70e03a; loadts=1765366484806; websectiga=2a3d3ea002e7d92b5c9743590ebd24010cf3710ff3af8029153751e41a6af4a3; sec_poison_id=41159aa6-2422-415f-8c25-0602a2462258';

    const result = await getAnalyzeContentListResponse(cookie, 1);
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});
