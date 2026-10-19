import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { getUserInfoAsync } from '@/media-platform/duoduoshipin/duoduoshipin-user.service';
import { Duoduoshipin } from '../../../src';

describe.runIf(true)('【真实测试】', () => {
  test('获取多多视频用户信息', async () => {
    const cookie =
      'webp=true; _nano_fp=XpmyX0PxlpCyl0TqXC_2ewFndN9yKVV6ihEUc1Oq; api_uid=rBUUx2hSY2Q4ICea8tilAg==; rckk=CHhiCFIvw2ChlVcy6E85HBJFpaxfSImh; _bee=CHhiCFIvw2ChlVcy6E85HBJFpaxfSImh; ru1k=c18d69c3-a32b-41dc-abc1-3ce59b33366a; _f77=c18d69c3-a32b-41dc-abc1-3ce59b33366a; ru2k=2830a4df-f41a-4e61-ba36-35f07578f832; _a42=2830a4df-f41a-4e61-ba36-35f07578f832; L_PASS_ID=YZOYOE5FPLBGTFK6MLVVSPCT77YMWD5BD4RTQTBNFJWHRKLVHZAA121b862; L_PASS_TYPE=2; L_PASS_DEAD=1752821863; L_PASS_ID=YZOYOE5FPLBGTFK6MLVVSPCT77YMWD5BD4RTQTBNFJWHRKLVHZAA121b862; L_PASS_DEAD=1752847080';

    const result = await Duoduoshipin.getDuoduoshipinUserInfo(cookie);
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);
});
