import { describe, expect, test } from 'vitest';
import { AccountService, Cloud, Platforms } from '../../../src';

describe.runIf(true)('【真实测试】', () => {
  test('车家号视频用户信息', async () => {
    const cookie =
      'fvlid=17288738673752QZWLuqwEq; __utma=1.1491185447.1728873868.1728873868.1728873868.1; sessionid=A7CFF251-C571-41E2-9100-667D824E65D3%7C%7C2024-10-14+10%3A44%3A25.261%7C%7C0; autoid=c159f0d7bb71f346d4fed868ba77c9c5; sessionuid=A7CFF251-C571-41E2-9100-667D824E65D3%7C%7C2024-10-14+10%3A44%3A25.261%7C%7C0; pcpopclub=e97a8f3201684098b8a1630723fb65440d782187; clubUserShow=225976711|0|0|%e6%88%91%e7%9a%84MG%e5%a4%a9%e4%b8%8b%e6%97%a0%e6%95%8c|0|0|0|/g31/M03/87/11/120x120_0_q87_autohomecar__ChxoHWYFcdCALNCGAABcoJ030GY548.jpg|2024-10-14 10:44:43|0; sessionlogin=e97a8f3201684098b8a1630723fb65440d782187; autouserid=225976711; __ah_uuid_ng=u_225976711; tfstk=gG1ZnK1CdIjCQk5ameAqLTeZx5A9MCqWistXoZbD5hxMfF9mng_wnPL6ciuVxMW6nld1g9ScAhDf5Cc4i1XDkK29fZ0D666sGhZ9gZjWguZ7N7_OWCd0VuNFGd6viEVXmJ9gOVcn-uZ7NWwi-IraVGNRJ6FekHYimFcg8BY2lIciiixHKUYmsIAcmy8HuUHmsdvgtwYWxnADiib38EHbSNbmTU9guyOhWSnP9d-lSHlPJ68MCAQMYjhAT9Jwqs-EijfeWwGuzLGgaHX1n1OhskcwtaBCjeRzwcxfda5VENUrQ36GyLWWdDMC4GsCTp6aHVKhLwXW-14SpH6HuadF9PMpJTTDt1Xrojbe_O9k-GmZiiS1A6JCQ-39x97hFpXLbvKG6EjvesZ-6hbcy_BWa7nMc9_PgtSPZmLHr3CAQmDDIeLeVyzFFpcTgosoBfMxHpAJ83a65xHvIILeVy5-HxpTWe-7Sdf..; __utmc=1; _ac=WHW-_Quht5s17m0pVcdd01NRfCMwRa_bJ4YpUtWQnbEQb99tm9l8; sessionip=171.88.65.205; area=510116; sessionvid=061F82EA-D430-4BE1-979F-4E864469698D; ahpvno=7; v_no=2; visit_info_ad=A7CFF251-C571-41E2-9100-667D824E65D3||061F82EA-D430-4BE1-979F-4E864469698D||-1||-1||2; ref=0%7C0%7C0%7C0%7C2025-09-03+11%3A54%3A35.804%7C2025-04-28+10%3A16%3A26.974; ahrlid=1756861598842bgfXU3GCii-1756871688586';

    const result = await Cloud.getPlatformUserInfo(Platforms.CheJiaHao, cookie);
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【真实测试】', () => {
  test('车家号用户信息', async () => {
    const cookie =
      'fvlid=17288738673752QZWLuqwEq; __utma=1.1491185447.1728873868.1728873868.1728873868.1; sessionid=A7CFF251-C571-41E2-9100-667D824E65D3%7C%7C2024-10-14+10%3A44%3A25.261%7C%7C0; autoid=c159f0d7bb71f346d4fed868ba77c9c5; sessionuid=A7CFF251-C571-41E2-9100-667D824E65D3%7C%7C2024-10-14+10%3A44%3A25.261%7C%7C0; pcpopclub=e97a8f3201684098b8a1630723fb65440d782187; clubUserShow=225976711|0|0|%e6%88%91%e7%9a%84MG%e5%a4%a9%e4%b8%8b%e6%97%a0%e6%95%8c|0|0|0|/g31/M03/87/11/120x120_0_q87_autohomecar__ChxoHWYFcdCALNCGAABcoJ030GY548.jpg|2024-10-14 10:44:43|0; sessionlogin=e97a8f3201684098b8a1630723fb65440d782187; autouserid=225976711; __ah_uuid_ng=u_225976711; __utmc=1; _ac=aw_k8j2L-IkD1VATfLVDmiwjdC8lDJy-88sVwUAoekBz-5wJRb5t; sessionip=218.88.40.60; area=510116; _as=ffflCL6EpOuRpvBhINuu_7KeqmscM3a2SU1iAIMzF9zGWzr5J-FP; v_no=5; visit_info_ad=A7CFF251-C571-41E2-9100-667D824E65D3||CDF5624A-C199-4BD2-A7CD-58478E02D41C||-1||-1||5; ref=0%7C0%7C0%7C0%7C2025-08-13+16%3A32%3A29.719%7C2025-04-28+10%3A16%3A26.974; tfstk=gEtjjjbmSSVjm6TdlGkzA2OgyWIsTYoe6R69KdE4BiIA6lp6LEy2BqqOBQdAgZkDB1O6a_-V7iBwfQOehifGSdI16dvv1NDc_1C6_dLqUDoenKjGXFGEYD5JSWcyc1FNXijJuJfoYDoenKeVHvJ-YhkNUYX16GQYXuURZO6OBCCYwY6OQSCOMCp-F_X_DlCA6TERLO2AXGd9eY6Gw1IOkCp-FOfR6v2_dOgfiKMB_790z4D1-_ZTX36-s6pfgTXkVT7f9aC7X-t5hZ1p3HTRunXJ43_FzRuh2pYyMTsIxSCwzpt6JKDQl68vKwTFz7zyOIRyVa8jS-fJPLLFenHUr_8RCpjWqxzlEeWO2nLQBlp5cE7deIFbXCO2a3_ylV2cwU9J8aLoGzfvmOdG-hl3msp9KHYFADVA_UJBfFsPbk5Qay4_FwqOF6kSFP4iWbnNuVEhct7AEt_rFYNvSZBlFCHSFPqGkTXr_YM78df..; ahpvno=5';

    const result = await new AccountService(cookie, Platforms.CheJiaHao).checkAccountAlive();
    console.log('有效性', result);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result).toBe(1);
  }, 10000000);
});
