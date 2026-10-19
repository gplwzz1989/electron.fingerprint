import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { getDataOverviewAsync } from '@/media-platform/duoduoshipin/duoduoshipin-data-overview.service';

describe.runIf(false)('【真实测试】', () => {
  test('获取多多视频视频数据列表', async () => {
    const cookie =
      '_nano_fp=XpEbl0XaXqgolpdJl9_~DwgY6_w1~0sLkOvycxV7; api_uid=rBUUmmU6M5ZwXSt2njC8Ag==; _bee=z41WL5WXTgx3gT0iBU5p3bmi31jgLlQL; _f77=8c0d1795-31e0-4658-b6de-18c90a69c3ff; _a42=d4f3d23f-8079-4f75-bdeb-f5d39d0ef385; rckk=z41WL5WXTgx3gT0iBU5p3bmi31jgLlQL; ru1k=8c0d1795-31e0-4658-b6de-18c90a69c3ff; ru2k=d4f3d23f-8079-4f75-bdeb-f5d39d0ef385; L_PASS_TYPE=2; L_PASS_ID=HJBSAWLBSZEKBGSWT4X3II3ZMU454KJTCXJ5TG7A4AD7PV2WG4QA1221315; L_PASS_DEAD=1700975967';

    const result = await getDataOverviewAsync(cookie);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.errorCode).toBe(1000000);
  }, 10000000);
});
