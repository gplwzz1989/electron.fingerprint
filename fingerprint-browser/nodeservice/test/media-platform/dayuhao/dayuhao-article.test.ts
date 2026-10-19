import { describe, expect, test } from 'vitest';
import { EventEmitter } from 'events';
import { IDayuhaoArticleData } from '../../../src/media-platform/dayuhao/dayuhao-article';
import { Dayuhao } from '../../../src';

describe.runIf(true)('【真实测试】', () => {
  const cookie =
    'cna=12eIIWx4kiICASSFEi+qxB9t; _UP_A4A_11_=wb9ce12cd599442e86d0667b7a1b8fed; _UP_D_=pc; _UP_30C_6A_=st9ce6201315n49wum9zawpgzsqetryz; _UP_TS_=sg16a1a1c7444e0d51bf2b24bade5c31774; _UP_E37_B7_=sg16a1a1c7444e0d51bf2b24bade5c31774; _UP_TG_=st9ce6201315n49wum9zawpgzsqetryz; _UP_335_2B_=1; xlly_s=1; USER_TMP=J4M0_dvnSYFF7Jq1bEUbRA.JGtZq-Qoe_MOptQrjTx3JcX5YM0h7uMDkFoQyX8yn_ubiGPdkySxWJvbF1Vj95XhHekkFM2fWBQZjw0hSiyJglGH1FopVuI8SxFxleBjGu57RVzE9ufh7CKwhXKdPw1QmMs94H978YL09o3sqtFKzCmuHnPRAr2F51UvJIlDihvwzDfQbtXmnIvUH0DsG5ZPI7TvD_lTnjDrMhHb86p5Xl_Cozhtiiy04FO0pCMpyFpfvSqhShjg_uDVZ8BfCAANPJEEkNWueROTW4uFKJBFkn5WuhfxtWnNx4hUjySoA3CCee4atuiFwpEpTpt7lvEnTKpjMGxMt3wUR71Ek5-LqfzQlMCrnacvYUsWJDWFviK1tgVd2tDkbxisnMPNOdOoP2EEUpeAF3pSkepcy0xYTW9uI-dhFdvEzBsP-IBEBS13ftumUmBzNWVkPRKufS4nymZEcnr7PbkVeQM_fulC75YY1bgDEuWSOzSD73q9HMc52Z3Fc8GkeYfO53rZ8aJR7LA0MNDwD956jCWfrsbXkF4WXiY9zV9PNffzK8TVeSBuYBJZx6sp0345ObWfD7r_SljceK4mK3KAQV0bcFUDcvY-yYKCj0ypmOxZxt8YzNJoWTvY7njzLw8pGDufWM3CWYqs9t9RYgJEK0U1p-nWGkYZg-Y-wGF8HN33O-J6h7SavFR7iZunIA0SaJQTTp4mVd7_MO2UdaCRMXlpIO7kIvmC-V8s0IWyHajegBrBsgItdFIgN4mY-4MHv54m_95lGwxHT_w2CBUZsTS5vZtzCNrqgTLcuSt2EnHrLOc9GUdf1r-eoFvlFlWjA6dr6C4NV-kiUXob2e3BNdKFwNrutwQ2iwJH9G5ebtIYYhIen6jtrSIpv0zEWBYKeHLOKoykPsanf6aF3raqvYZ4WdVjZjggNwpcjKhtlP-ya3e2LOWOtxkwG94tnmXURrHeszJM77RJXvMDjpDG5TLXSvGztuUIjP02Tp49h3oNOfl6x0k39sL8eEfqzNVeVSiQ0Zei4agJT0T3HxirVTcF4PPeL88xj81ucTOw_pQPgcc9JOeqpiupZd27B9fZdPZmBun3kSrmH8Fyo3cj4mPpzX0PeYSAB2Tb-c2j26KXGupnbLQDpy64DE4xom9Ty_KXb2Xurnn4K1UbliumIes1HCR-r0edUciT4o5yCz2WNDNQ2b_oRJi5t2Hnape3CspbbO3NQV0_XaSjxytfxKNF1zKMqA.1762397488466.604800000.PYgi8b_7xdVC5qwQM35L66jQ1Slengi4GdXE2RtrBqQ; tfstk=gEEEYq9DQMIEkBd1A5ny3gHxFKiKX05jxuGSE82odXc3d0aZU7weR4fKAuPaM7-QNanI44Vx69HSNyGPUSG9OYaIN3JLbS-WA6QLE3oSqs1fciwpJ0nlG12IyEJKFY-krQTnjGmSUQI4KfyLp0p9PBV60JIrfMbmE0VojfD-30xnqvXZSxMoqH0kxFAi6YmoqXx3IADILBDkqHXaIfHoqbVoqOoi6YmoZ7moZA23Ehkj-OGDptN6WFnxiJcwqnJxI2xYdUtwblkEBu2m_AM_bvuEG4lVLSZ318qQvVQM70e_u7zui1TItrk4_qaFgHP49Y2rEWSv3fqUUluL5Kt4Q4lUSk0wE32_Ib0bzW5eJX4Q_qHiSLSxCSGgpk4NeC23GXonIVsc3R0u5k3YA1xEmreIAzVc1eG3uYjzoQHGK6Z88QYr-AHZGOWaFSQfceNp4ALJyVmxQj6IdUL--AHZGOWwyU3i6Alfdv1..; isg=BFBQA95jDd6OU9HWg8v0dqVWIZ6iGTRj92kG3kogf6tIhf0v9y1-8DHzWU1lVew7';

  test('大鱼号文章发布', async () => {
    const taskData: IDayuhaoArticleData = {
      taskId: '',

      title: '团队管理、业务管理、服务管理三个大方向',
      covers: [
        // {
        //   width: 800,
        //   height: 769,
        //   size: 59674,
        //   pathOrUrl: 'G:\\download\\20241112-144920.jpg',
        // },
      ],

      content: '<p>记录一下瓜子的第二天</p>',
      pulishId: '',
      save: false,
      // prePubTime: 1735181803155,
    };

    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });

    const result = await Dayuhao.publishArticle(taskData, cookie, eventCall);
    // assets
    console.log('大鱼号文章发布：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);

  test('获取大鱼号图文状态查询', async () => {
    const result = await Dayuhao.getDayuhaoMediaStatus(cookie, '82655914076f4c6695e2a4fb485fa65d');
    console.debug(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(2000000);
  }, 10000000);
});
