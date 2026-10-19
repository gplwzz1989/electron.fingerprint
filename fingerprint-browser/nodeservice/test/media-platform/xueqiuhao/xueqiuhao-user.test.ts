import { describe, expect, test } from 'vitest';
import { AccountService, Xueqiuhao } from '../../../src';

describe.runIf(true)('【真实测试】', () => {
  test('获取雪球号用户数据', async () => {
    const cookie =
      'cookiesu=921748930009785; device_id=055dcd5c7c8c67330be0be68528d0d77; Hm_lvt_1db88642e346389874251b5a1eded6e3=1748930013; HMACCOUNT=510C2F78264F7FCE; smidV2=20250603135333b36bc6b946628b817d0e1c644b3f708d00cbd9a4dc7e60ad0; .thumbcache_f24b8bbe5a5934237bbc0eda20c1b6e7=tS5hzVJi3VEfnGZhxWdmrjf5iwku4nkGVuAwbWZEHBxFCuL7c6yN9vp9BGAQfG9gNLkTMLrVc0K3ATLn1BqC5w%3D%3D; s=al11d1dn8m; xq_is_login=1; u=4265832436; Hm_lpvt_1db88642e346389874251b5a1eded6e3=1748930027; xq_a_token=8956bb27c30f4359d39dcc6430b3776d5f8b1716; xqat=8956bb27c30f4359d39dcc6430b3776d5f8b1716; xq_id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJ1aWQiOjQyNjU4MzI0MzYsImlzcyI6InVjIiwiZXhwIjoxNzUzOTI3NDEyLCJjdG0iOjE3NTEzMzU0MTI1NTYsImNpZCI6ImQ5ZDBuNEFadXAifQ.Y3ugTbN5itn2eH6wmKx8UNqCdVE7VQ1IP6Gn5GsMQ1wJi3AWSYBVaOcGo3Ib0Iqliv_TQ-E3GZFfJ0JlQ-ztmoiSAZg-nT_tn8SF6QS6JIfVm5myfTxLKc2BWXHZ69joDRQ6DNVO64GM3dZZox7p5J7S-TsRglinFy0QQvCKFM14MzZQL7vH8iYe9-62E1YsTsMsJ4j_tRxmyvd9yE1l_mS4MKugS3IgLdhBWxmZbloLCS6xCXG4QMzocbzB2fzM_pKJ4vyjiB73DCTFA46KGtPLwpxGYYq04PtugVEVkLUP2eXoaQBSqJ-J0wqiRqzh6R1iUfL1qnDx9w0hfjCkVw; xq_r_token=5825964dfae9ce7f3340b070d1e3f0015b641c1d; acw_tc=ac11000117513582520728244e6480c3d960c353c3c8e0ca625b18ce444750';
    const result = await Xueqiuhao.getXueqiuhaoUserInfo(cookie);
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取雪球号有效检测', async () => {
    const cookie =
      'cookiesu=921748930009785; device_id=055dcd5c7c8c67330be0be68528d0d77; Hm_lvt_1db88642e346389874251b5a1eded6e3=1748930013; HMACCOUNT=510C2F78264F7FCE; smidV2=20250603135333b36bc6b946628b817d0e1c644b3f708d00cbd9a4dc7e60ad0; .thumbcache_f24b8bbe5a5934237bbc0eda20c1b6e7=tS5hzVJi3VEfnGZhxWdmrjf5iwku4nkGVuAwbWZEHBxFCuL7c6yN9vp9BGAQfG9gNLkTMLrVc0K3ATLn1BqC5w%3D%3D; s=al11d1dn8m; xq_is_login=1; u=4265832436; Hm_lpvt_1db88642e346389874251b5a1eded6e3=1748930027; xq_a_token=8956bb27c30f4359d39dcc6430b3776d5f8b1716; xqat=8956bb27c30f4359d39dcc6430b3776d5f8b1716; xq_id_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJ1aWQiOjQyNjU4MzI0MzYsImlzcyI6InVjIiwiZXhwIjoxNzUzOTI3NDEyLCJjdG0iOjE3NTEzMzU0MTI1NTYsImNpZCI6ImQ5ZDBuNEFadXAifQ.Y3ugTbN5itn2eH6wmKx8UNqCdVE7VQ1IP6Gn5GsMQ1wJi3AWSYBVaOcGo3Ib0Iqliv_TQ-E3GZFfJ0JlQ-ztmoiSAZg-nT_tn8SF6QS6JIfVm5myfTxLKc2BWXHZ69joDRQ6DNVO64GM3dZZox7p5J7S-TsRglinFy0QQvCKFM14MzZQL7vH8iYe9-62E1YsTsMsJ4j_tRxmyvd9yE1l_mS4MKugS3IgLdhBWxmZbloLCS6xCXG4QMzocbzB2fzM_pKJ4vyjiB73DCTFA46KGtPLwpxGYYq04PtugVEVkLUP2eXoaQBSqJ-J0wqiRqzh6R1iUfL1qnDx9w0hfjCkVw; xq_r_token=5825964dfae9ce7f3340b070d1e3f0015b641c1d; acw_tc=ac11000117513582520728244e6480c3d960c353c3c8e0ca625b18ce444750';
    const result = await new AccountService(cookie, '雪球号').checkAccountAlive();
    console.log('有效当否', JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});
