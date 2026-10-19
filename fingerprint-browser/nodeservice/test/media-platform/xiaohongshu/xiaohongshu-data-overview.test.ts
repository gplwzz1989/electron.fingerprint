import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { getDataOverviewSingleListAsync } from '@/media-platform/xiaohongshu/xiaohongshu-data-overview.service';
import {
  getXiaohongshuContentListView,
  getXiaohongshuDataOverviewNewList,
} from '../../../src/media-platform/xiaohongshu/xiaohongshu-common';
import { Xiaohongshu } from '../../../src';

describe.runIf(true)('【真实测试1】', () => {
  test('获取小红书笔记数据列表new', async () => {
    const cookie =
      'xsecappid=ugc; a1=19a9a10cab1n38axhdpsoppg0a6oxhql3362o2ueu30000192833; webId=6564cc332b439019285efe824b91669f; gid=yj0j0y8f4Sqjyj0j0y8S0qJ7DyIqY0CxfUMlKd7UUk80KJq8lCxA1l888yjJYqq8dfiyjqd0; x-user-id-creator.xiaohongshu.com=5f326081000000000101ff2c; customerClientId=316590064830864; access-token-creator.xiaohongshu.com=customer.creator.AT-68c517574266708896464902nd2ozx4teryfg2o3; galaxy_creator_session_id=pmrBsw5p19wBFxLkuSI0AQZFBQqIV1MyIUIg; galaxy.creator.beaker.session.id=1763521393774007808073; acw_tc=0a0d0ad817654392595252274e2c4cee125f07cdcd76d1f14dc2c2f6599630; loadts=1765439260136; websectiga=a9bdcaed0af874f3a1431e94fbea410e8f738542fbb02df1e8e30c29ef3d91ac; sec_poison_id=18170640-0a11-48c5-936d-a838bec3ef9d';

    const result = await getXiaohongshuContentListView(cookie,undefined,30);
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});
describe.runIf(true)('【真实测试】', () => {
  test('获取小红书笔记数据列表', async () => {
    const cookie =
      'xsecappid=ugc; a1=192fb8d5a557qvxnpmvx0rsnyjfejfd2jribdi7r050000121283; webId=9f01a736a5ce6f0d66417fa5bf0b41c7; gid=yjJiDYfK28VjyjJiDYf20F3W22WAhCIU6hC83F8FMIvViD28dVifJf888yJyJYq8JDDqfKfy; x-user-id-creator.xiaohongshu.com=5b7b6eb42352610001dcd389; customerClientId=464725333911111; access-token-creator.xiaohongshu.com=customer.creator.AT-68c51743371744323125403459mmx9smlcdierar; galaxy_creator_session_id=uXMmrpzRSdzFdYzw05pEL2G3RvH7CemXrj3T; galaxy.creator.beaker.session.id=1730797217098063295010; acw_tc=0a00df6217322430562737432e9cd8e847147f68bde785a5caecc8ec333d15; websectiga=2845367ec3848418062e761c09db7caf0e8b79d132ccdd1a4f8e64a11d0cac0d; sec_poison_id=cbb1559a-db8f-4966-aeaf-4697ccd1adff';

    const result = await getDataOverviewSingleListAsync(cookie, 1, 48);
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.result).toBe(0);
  }, 10000000);

  test('获取小红书笔记数据列表', async () => {
    const cookie =
      'xsecappid=ugc; a1=192fb8d5a557qvxnpmvx0rsnyjfejfd2jribdi7r050000121283; webId=9f01a736a5ce6f0d66417fa5bf0b41c7; gid=yjJiDYfK28VjyjJiDYf20F3W22WAhCIU6hC83F8FMIvViD28dVifJf888yJyJYq8JDDqfKfy; x-user-id-creator.xiaohongshu.com=5b7b6eb42352610001dcd389; customerClientId=464725333911111; access-token-creator.xiaohongshu.com=customer.creator.AT-68c51743371744323125403459mmx9smlcdierar; galaxy_creator_session_id=uXMmrpzRSdzFdYzw05pEL2G3RvH7CemXrj3T; galaxy.creator.beaker.session.id=1730797217098063295010; acw_tc=0a00df6217322430562737432e9cd8e847147f68bde785a5caecc8ec333d15; websectiga=2845367ec3848418062e761c09db7caf0e8b79d132ccdd1a4f8e64a11d0cac0d; sec_poison_id=cbb1559a-db8f-4966-aeaf-4697ccd1adff';

    const result = await getXiaohongshuDataOverviewNewList(cookie);
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});
