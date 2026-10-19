import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import {
  getUserInfoAsync,
  getUserUserHomeDateAsync,
  getUserNewsInfoAsync,
} from '@/media-platform/souhuhao/souhuhao-user.service';
import { AccountService, Platforms } from '../../../src';
import { getSouhuhaoUserInfo } from '../../../src/media-platform/souhuhao/souhuhao-common';

describe.runIf(true)('【真实测试】', () => {
  test('获取搜狐号用户信息', async () => {
    const cookie =
      'SUV=17887599217609ln8j6; clt=1788759921; cld=20260907134521; reqtype=pc; gidinf=x099980109ee1d197654a98600003bcc9d7572e7ddd9; _dfp=ymN+eoyMibZOIbR4DHZ3DTiLULRJ/PM2tcnFodTNplg=; jv=0eff3b3af7ca9de1d6b0216204a78a5d-Q95PBqDQ1788760093463; ppinf=2|1788760093|1789969693|bG9naW5pZDowOnx1c2VyaWQ6Mjg6MTYyMjc4MDQ1NjAyMzk0OTMxMkBzb2h1LmNvbXxzZXJ2aWNldXNlOjMwOjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMHxjcnQ6MTA6MjAyNi0wOS0wN3xlbXQ6MTowfGFwcGlkOjY6MTEzODA1fHBsYXQ6Njptb2JpbGV8dHJ1c3Q6MToxfHBhcnRuZXJpZDoxOjB8cmVsYXRpb246MDp8dXVpZDoxNjpzNzYxOTZjMjFjYjgwNzFjfHVpZDoxNjpzNzYxOTZjMjFjYjgwNzFjfHVuaXFuYW1lOjA6fA; pprdig=b1rhqYwDIIbbv_ZE3WoMWrd9hGbAEIguimWCx9ltcEQ_vk5KqTUBhm2rPDnQMxh5bZVNRQJQabM8alszB_EVc1sgjBM9BISxEXuUGePxwsKIQBGeE-7XQDq1MoOj71RAw878jp5RCLqxgVm75LIp3NUefxRjDWiLiaRMA_-4jRE; ppmdig=17887600930000001aeb17470bf89e9632063cee07a0cd96; mp-cv=100-1788760093716-c2d073c215dc4150a7d104907876f87b; mpCreatorId=%7B%22id%22%3A120200910%2C%22status%22%3A1%7D; tgw_l7_route=632e20bf787d79623d2f5548ef898768; t=1788762910994';

    const result = await getSouhuhaoUserInfo(cookie);

    console.log(JSON.stringify(result, null, 2));
    expect(result.verify).toBe(true);
  }, 10000000);

  test('获取搜狐号用户统计数据', async () => {
    const cookie =
      'SUV=1698810496971kn1djy; gidinf=x099980109ee17dd1c810cc5900011b6fcb5ecd27da5; clt=1698887944; cld=20231102091904; reqtype=pc; _dfp=RiOsKSgVB5ahf8cH1DIVHXmgel18n/btqmarFUNE0iU=; jv=0814325a531f9e1743c3688b91fc9fb4-VbN7uDV61698887972907; ppinf=2|1698887973|1700097573|bG9naW5pZDowOnx1c2VyaWQ6Mjg6MTUwNDY0NjM4MDMwNjg0MTYwMEBzb2h1LmNvbXxzZXJ2aWNldXNlOjMwOjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMHxjcnQ6MTA6MjAyMy0xMS0wMnxlbXQ6MTowfGFwcGlkOjY6MTEzODA1fHRydXN0OjE6MXxwYXJ0bmVyaWQ6MTowfHJlbGF0aW9uOjA6fHV1aWQ6MTY6c2EwZDkwYzVlZGNmYmQ4M3x1aWQ6MTY6c2EwZDkwYzVlZGNmYmQ4M3x1bmlxbmFtZTowOnw; pprdig=OjiGiABlQ18lugNL6w5sI74r5o5hk7sMNHrDSJi28TzYqfiRt-VMbJnnyCYgb544IHcqCsnOUsANC3BJsgYSBKE_O7tAL0QaquWOzBmmJixHgcDAGKfJHaWGMuDv96fdZgpi1BihF-lk173-cTdHWWnTPNjsTy17ZlWmA5Mj_yY; t=1698887990074; ppmdig=16988909960000008a1a2536c0ecef64a7c54a4d4c725aa1; tgw_l7_route=632e20bf787d79623d2f5548ef898768';

    const result = await getUserUserHomeDateAsync(cookie, 121349544);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(2000000);
  }, 10000000);

  test('获取搜狐号用户内容统计数据', async () => {
    const cookie =
      'SUV=1698810496971kn1djy; gidinf=x099980109ee17dd1c810cc5900011b6fcb5ecd27da5; clt=1698887944; cld=20231102091904; reqtype=pc; _dfp=RiOsKSgVB5ahf8cH1DIVHXmgel18n/btqmarFUNE0iU=; jv=0814325a531f9e1743c3688b91fc9fb4-VbN7uDV61698887972907; ppinf=2|1698887973|1700097573|bG9naW5pZDowOnx1c2VyaWQ6Mjg6MTUwNDY0NjM4MDMwNjg0MTYwMEBzb2h1LmNvbXxzZXJ2aWNldXNlOjMwOjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMHxjcnQ6MTA6MjAyMy0xMS0wMnxlbXQ6MTowfGFwcGlkOjY6MTEzODA1fHRydXN0OjE6MXxwYXJ0bmVyaWQ6MTowfHJlbGF0aW9uOjA6fHV1aWQ6MTY6c2EwZDkwYzVlZGNmYmQ4M3x1aWQ6MTY6c2EwZDkwYzVlZGNmYmQ4M3x1bmlxbmFtZTowOnw; pprdig=OjiGiABlQ18lugNL6w5sI74r5o5hk7sMNHrDSJi28TzYqfiRt-VMbJnnyCYgb544IHcqCsnOUsANC3BJsgYSBKE_O7tAL0QaquWOzBmmJixHgcDAGKfJHaWGMuDv96fdZgpi1BihF-lk173-cTdHWWnTPNjsTy17ZlWmA5Mj_yY; t=1698887990074; ppmdig=16988909960000008a1a2536c0ecef64a7c54a4d4c725aa1; tgw_l7_route=632e20bf787d79623d2f5548ef898768';

    const result = await getUserNewsInfoAsync(cookie, 121349544);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(2000000);
  }, 10000000);

  test('检测用户有效性', async () => {
    const cookie =
      'SUV=17399592346300knh08; clt=1739959234; cld=20250219180034; mp-cv=100-1739959234742-8f25ca00517d41e391fa0ead119d4b06; reqtype=pc; gidinf=x099980109ee1a42467b42091000232c3e4f04af4e2e; _dfp=+v8lhurnxSHJQpOx2lb8WGAQnhGgNWbgfyxCbf7WDUo=; jv=8beabf74397789d5287433416bac88eb-06yd7Aj91739959280039; ppinf=2|1739959280|1741168880|bG9naW5pZDowOnx1c2VyaWQ6Mjg6MTUwNDY0NjM4MDMwNjg0MTYwMEBzb2h1LmNvbXxzZXJ2aWNldXNlOjMwOjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMHxjcnQ6MTA6MjAyNS0wMi0xOXxlbXQ6MTowfGFwcGlkOjY6MTEzODA1fHBsYXQ6Njptb2JpbGV8dHJ1c3Q6MToxfHBhcnRuZXJpZDoxOjB8cmVsYXRpb246MDp8dXVpZDoxNjpzYTBkOTBjNWVkY2ZiZDgzfHVpZDoxNjpzYTBkOTBjNWVkY2ZiZDgzfHVuaXFuYW1lOjA6fA; pprdig=GuY3UV03n0RZumrfUoAqvX9jfG48k8tdCh54bMJrs4LdrFT1rIAmoOVnX2hQCa1iWKkkKffzOBtk8REMXYrPvIr97wVc-iws97DcLFEkhBXCZmgU5atcQPc-39H_lwfP77pNXrWa1_YR3MwgrKXU0VGQ_3wWy2m6eK1QaYMsX_M; IPLOC=CN4401; umab_user_id=052881b998c21000; umab_access_token=BearerES+eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJpc3MiOiJjb20uc29odS51bWFiIiwic3ViIjoiMDUyODgxYjk5OGMyMTAwMCIsImF1dGgiOiIwNTI4ODFiOTk4YzIxMDAwLDEwNjA4Mzg1ZmNjMTAwMDAsMTUwNDY0NjM4MDMwNjg0MTYwMEBzb2h1LmNvbSxzbXBjLDEwLGYsZixmLHByb2QiLCJleHAiOjE3NDUyMDQwMDR9.V2BbuCaVzNQ9G2_9YcD2vPwz635kw90KITmT19blXfdRZwX5DVt_VfnSJ_TGY9IBZcW2Eh57-uA8qJdJg2eq9w; umab_refresh_token=BearerES+eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJpc3MiOiJjb20uc29odS51bWFiIiwic3ViIjoiMDUyODgxYjk5OGMyMTAwMCIsImF1dGgiOiIwNTI4ODFiOTk4YzIxMDAwLDEwNjA4Mzg1ZmNjMTAwMDAscmVmcmVzaF90b2tlbixmIiwiZXhwIjoxNzcxNTU2MDA0fQ.onPB67h3QD_Tma7bcqYDQYreklQ9dXK8xR8FOQDtszilfkmoVdl-kgFHneo6fdzMB0_LBi2e1F2XUUX1HbCt6Q; tgw_l7_route=a614ee340c42f0cf510d055c19dc2294; t=1740394106149; ppmdig=17403941060000002f3b2213cac67ecee9b7fc535492eada; ppmdig=17403941060000002f3b2213cac67ecee9b7fc535492eada';
    const result = await new AccountService(cookie, Platforms.SouHuHao).checkAccountAlive();
    console.log('有效性:' + result);
    expect(result).toBe(1);
  });
});
