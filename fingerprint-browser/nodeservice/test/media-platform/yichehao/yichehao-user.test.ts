import { describe, expect, test } from 'vitest';
import { AccountService, Cloud, Platforms } from '../../../src';
import { YiCheHao } from '../../../src/media-platform/yichehao';
import { convertCookieStr } from '../../../src/utils';

describe.runIf(true)('【真实测试】', () => {
  test('易车号视频用户信息', async () => {
    const cookie = convertCookieStr(
      'suid=z594ghfwvjw2jv3ep42qkgb9tjdv3i9v;report-cookie-id=920619030_1781171702149;auto_id=db9647a2e4ac3f8aaf93cd36502cb444;HMACCOUNT_BFESS=C58F557F9F854DC9;Hm_lvt_610fee5a506c80c9e1a46aa9a2de2e44=1781171702;Hm_lpvt_610fee5a506c80c9e1a46aa9a2de2e44=1781171702;HMACCOUNT=C58F557F9F854DC9;.ASPXAUTH=C0E9ED3505F35977E7E4209A889326BC10CEC3E121C03C6DE9A495B705B736947A777E48E97DD04B0C5B64125876EBCCC6AD618E72616637F30359748BFD5AED93D634CD86A304E17595B2693F6F338F47A02DEC6638A84E327A5FFD6E62BC064837F62D2FBC274CC2A5EA55E802550FF372B3C2072721BA1188972D3848070D08D4E19E17B1C6085E9CBEEC70F4E048EEA37058069735B08EF8A99D651ECDF9CA9FB842E083CBE7090B5E4BEE4E00942FB1A7DB;userid=269295647;username=%E4%BC%98%E7%A7%80%E7%9A%84%E8%8A%B1%E6%A4%92%E6%A0%911312;UserGuid=5b8320bb-5e76-458b-a56e-4640767cc0d5;CIGUID=5b8320bb-5e76-458b-a56e-4640767cc0d5',
    );
    const result = await Cloud.getPlatformUserInfo(Platforms.YiCheHao, cookie);
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【真实测试2】', () => {
  test('易车号视频用户信息实名', async () => {
    const cookie = convertCookieStr(
      '[{"name":"isWebP","value":"true","domain":".yiche.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1773853110,"sameSite":"unspecified"},{"name":"report-cookie-id","value":"838676215_1773824310790","domain":"i.yiche.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"auto_id","value":"01ab6db381c4398d8b5f374793760a71","domain":".yiche.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1808384310.787754,"sameSite":"unspecified"},{"name":"HMACCOUNT_BFESS","value":"3DE4E1C6FA3FC677","domain":".hm.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1808384311.134931,"sameSite":"no_restriction"},{"name":"Hm_lvt_610fee5a506c80c9e1a46aa9a2de2e44","value":"1773824311","domain":".yiche.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1805360311,"sameSite":"unspecified"},{"name":"Hm_lpvt_610fee5a506c80c9e1a46aa9a2de2e44","value":"1773824311","domain":".yiche.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"HMACCOUNT","value":"3DE4E1C6FA3FC677","domain":".yiche.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":".ASPXAUTH","value":"6CBCB863205F77691F0FAAA9590054CC28288A2819872638F39EFFE6F82FEFB4AEEFD2D52411C76DD64D75E135604121D14B47A9EC225929A1B46E7D283A8856AC5670A34815C573A236CE04739188FE12368D2FA7F78C2FDE74BAC5F9016C3C804B44889D4326CF52D134AC0F0338218E10D67EDF17855D14C38DE369FE94996DEF8F0166C276B0E33817746EC8A733E3624D65060056314831CE86F09C336E3BDB6E0D6297AFFBD2DF1892A10D1A6BF925529D","domain":".yiche.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1776416315.598184,"sameSite":"lax"},{"name":"userid","value":"116150969","domain":".yiche.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1776416315.598318,"sameSite":"unspecified"},{"name":"username","value":"%E8%BD%A6%E6%89%8B32744110IL","domain":".yiche.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1776416315.598348,"sameSite":"unspecified"},{"name":"UserGuid","value":"5b8d156e-2757-4878-b35e-ad38b8168f90","domain":".yiche.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1776416315.598374,"sameSite":"unspecified"},{"name":"CIGUID","value":"5b8d156e-2757-4878-b35e-ad38b8168f90","domain":".yiche.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1808384315.605269,"sameSite":"unspecified"}]',
    );
    const result = await YiCheHao.getYiCheHaoUserRealAuthResponse(cookie);
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});

describe.runIf(true)('【真实测试】', () => {
  test('易车号用户有效性', async () => {
    const cookie =
      'suid=z594ghfwvjw2jv3ep42qkgb9tjdv3i9v;report-cookie-id=920619030_1781171702149;auto_id=db9647a2e4ac3f8aaf93cd36502cb444;HMACCOUNT_BFESS=C58F557F9F854DC9;Hm_lvt_610fee5a506c80c9e1a46aa9a2de2e44=1781171702;Hm_lpvt_610fee5a506c80c9e1a46aa9a2de2e44=1781171702;HMACCOUNT=C58F557F9F854DC9;.ASPXAUTH=C0E9ED3505F35977E7E4209A889326BC10CEC3E121C03C6DE9A495B705B736947A777E48E97DD04B0C5B64125876EBCCC6AD618E72616637F30359748BFD5AED93D634CD86A304E17595B2693F6F338F47A02DEC6638A84E327A5FFD6E62BC064837F62D2FBC274CC2A5EA55E802550FF372B3C2072721BA1188972D3848070D08D4E19E17B1C6085E9CBEEC70F4E048EEA37058069735B08EF8A99D651ECDF9CA9FB842E083CBE7090B5E4BEE4E00942FB1A7DB;userid=269295647;username=%E4%BC%98%E7%A7%80%E7%9A%84%E8%8A%B1%E6%A4%92%E6%A0%911312;UserGuid=5b8320bb-5e76-458b-a56e-4640767cc0d5;CIGUID=5b8320bb-5e76-458b-a56e-4640767cc0d5';

    const result = await new AccountService(cookie, Platforms.YiCheHao).checkAccountAlive();
    console.log('有效性', result);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result).toBe(1);
  }, 10000000);
});
