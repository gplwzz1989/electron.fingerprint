import { describe, expect, test } from 'vitest';
import { AccountService, Platforms } from '../../../src';
import { MeiPai } from '../../../src/media-platform/meipai';

describe.runIf(true)('【真实测试】', () => {
  test('美拍视频用户信息', async () => {
    const cookie =
      'isg=BCsr_6-Wx-NgJBu3Sgzn5VeTuk8VQD_CBx9tnZ2oNmrBPEueJRK2EshVknxSHJe6;tfstk=g2hZiC_l8CdwN5jB1DFV4NZb4JVTMS-5gjZboq005lqi5SMUumgNC-xT1joU6XM1GltTgqm7g3tWNQgtW7PDV3gSRWi_irAbmpwg3Wz9S3tWNBgtWSFDVmwEp4P3kk4goo2D8W44lSj0omq3Kz45jSVmmey3zrWGnlXg-k4bxoV0im0H8rE3SSVmm2YUkbhSSqfUPRY3gAkoVKTzau0gYsfPyPyg6QEFiMhU72roS2fciXzaBXjNf824Cx08efg2g6FszvV3ujLl3oyrnfNnsHAup-cnxym6ltUE3qc86RQAM0PZ08cgLZfYsSqTTycklTEITlim_JY5a-NnN8VidpK_h5zrmfnNusmoR4GTpj-PxoH_yW4qMUX40-jPJiUnV6lxQiX4IyUUVe8U3H05EL7aEkXAHJV88uT_5tBYIX4UVF1dHteTpyrW7AC..;_sm=1987986143329e9-03232bf7015fbc8-26011151-2073600-19879861434357d;meitustat={%22wgid%22:%221987986143329e9-03232bf7015fbc8-26011151-2073600-19879861434357d%22};__mt_web_access_token__=cUJke57uwAXwlDJH8Q2V4iDAHY1wTzdFa7_rN5T7pysgb2bAwQ0Qmy_KX_GqrndkRtTBRdUHNumO2ER6TAzhLyrhUjECMnUln2v-xLmELEeeXZWdLAWfpMfwv7zJE1ixvCuoBbaP3Cti1uSDC8qyaAObZJ4Udq_vs1h6IymctSyuFgeqn8ixISn_xYntdk97;__mt_web_client_id__=1089867636;__mt_web_login__=1754385646;__mt_uid__=1882133759;__mt_web_access_token__=10jY5VNwyXFziJJ6gd_pU-WOO0HQuGuHGEPanQ87_neVtq2GRlPTIjBTqqvm_o6_bkDBNEv37pByJSRRGF_U-NVEnlKpCpQdNAHA9cdMQ4svmMxPxlFAd3gxN6_E8uUuySSqaBuqUhnzVd5dR9PF3nbHQZXC0r2kNjNBoS-8K9q23CkGcZvRCDAJz-P42v9W;__mt_web_client_id__=1089867636;__mt_web_login__=1754385646;__mt_uid__=1882133759';

    const result = await MeiPai.getMeiPaiUserInfo(cookie);
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【真实测试】', () => {
  test('美拍视频用户信息', async () => {
    const cookie =
      'isg=BCsr_6-Wx-NgJBu3Sgzn5VeTuk8VQD_CBx9tnZ2oNmrBPEueJRK2EshVknxSHJe6;tfstk=g2hZiC_l8CdwN5jB1DFV4NZb4JVTMS-5gjZboq005lqi5SMUumgNC-xT1joU6XM1GltTgqm7g3tWNQgtW7PDV3gSRWi_irAbmpwg3Wz9S3tWNBgtWSFDVmwEp4P3kk4goo2D8W44lSj0omq3Kz45jSVmmey3zrWGnlXg-k4bxoV0im0H8rE3SSVmm2YUkbhSSqfUPRY3gAkoVKTzau0gYsfPyPyg6QEFiMhU72roS2fciXzaBXjNf824Cx08efg2g6FszvV3ujLl3oyrnfNnsHAup-cnxym6ltUE3qc86RQAM0PZ08cgLZfYsSqTTycklTEITlim_JY5a-NnN8VidpK_h5zrmfnNusmoR4GTpj-PxoH_yW4qMUX40-jPJiUnV6lxQiX4IyUUVe8U3H05EL7aEkXAHJV88uT_5tBYIX4UVF1dHteTpyrW7AC..;_sm=1987986143329e9-03232bf7015fbc8-26011151-2073600-19879861434357d;meitustat={%22wgid%22:%221987986143329e9-03232bf7015fbc8-26011151-2073600-19879861434357d%22};__mt_web_access_token__=cUJke57uwAXwlDJH8Q2V4iDAHY1wTzdFa7_rN5T7pysgb2bAwQ0Qmy_KX_GqrndkRtTBRdUHNumO2ER6TAzhLyrhUjECMnUln2v-xLmELEeeXZWdLAWfpMfwv7zJE1ixvCuoBbaP3Cti1uSDC8qyaAObZJ4Udq_vs1h6IymctSyuFgeqn8ixISn_xYntdk97;__mt_web_client_id__=1089867636;__mt_web_login__=1754385646;__mt_uid__=1882133759;__mt_web_access_token__=10jY5VNwyXFziJJ6gd_pU-WOO0HQuGuHGEPanQ87_neVtq2GRlPTIjBTqqvm_o6_bkDBNEv37pByJSRRGF_U-NVEnlKpCpQdNAHA9cdMQ4svmMxPxlFAd3gxN6_E8uUuySSqaBuqUhnzVd5dR9PF3nbHQZXC0r2kNjNBoS-8K9q23CkGcZvRCDAJz-P42v9W;__mt_web_client_id__=1089867636;__mt_web_login__=1754385646;__mt_uid__=1882133759';

    const result = await new AccountService(cookie, '美拍').checkAccountAlive();
    console.log('有效性', result);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result).toBe(1);
  }, 10000000);
});
