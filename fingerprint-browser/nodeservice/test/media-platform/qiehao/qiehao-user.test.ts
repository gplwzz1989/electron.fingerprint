import { describe, expect, test } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { initMock } from '@@/mock/mock';
import { getUserHomeDataAsync } from '@/media-platform/qiehao/qiehao-user.service';
import { AccountService, Platforms, Qiehao } from '../../../src';

describe('【Mock】', () => {
  describe('企鹅号首页数据', () => {
    const server = setupServer(
      rest.get('https://om.qq.com*/mindex/homeInfo', (req, res, context) => {
        const cookie = req.url.searchParams.get('cookie');

        // success
        if (cookie === 'success') {
          return res(
            context.status(200),
            context.json({
              response: {
                code: 0,
                msg: '',
              },
              data: {
                name: '聪明的企鹅SIA',
                avatar: 'https://inews.gtimg.com/om_ls/O0Q4OqNSfZUJNLxZQAve-rFpD0GNalNm_REyhEu6mdiNAAA_200200/0',
                blackMarketScore: 0,
                unreadCount: 0,
                total_index_score: 0,
                pv: 91334,
                subscriberCount: 65,
                vv: 1136,
                accountType: 1,
                idNameEncrypt: '李**',
                idNumberEncrypt: '4****************0',
                isCopyrightCp: 0,
                userCategory: 1,
                rightsCandidate: 6,
                rightsIsOrigin: 0,
                rightsIsAuthed: 0,
                rights_auth_state: 0,
                weishi_rights_auth_state: 4,
                rights_type: 0,
                rightsNew: 0,
                rightsDaren: 0,
                rightsRank: 0,
                highQuality: 0,
                totalIncome: 4.33,
                showHighQuality: 0,
                high_quality_channel: {},
                articleFlow: 0,
                videoFlow: 3,
                dailyFansNum: 0,
                mediaDailyLastDate: '2023-11-02',
                dailyFansLastDate: '2023-11-02',
              },
            }),
          );
        }

        return req.passthrough();
      }),
    );

    initMock(server);

    test('获取成功', async () => {
      expect(async () => {
        const result = await getUserHomeDataAsync('success');
        // assets
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
        expect(result.response.code).toBe(0);
      });
    });
  });
});

describe.runIf(true)('【真实测试】', () => {
  const cookie =
    'pgv_info=ssid=s2585497569; ts_last=om.qq.com/userAuth/index; pgv_pvid=3466359586; ts_uid=4075933092; csrfToken=csrf-1762330810510; _qpsvr_localtk=0.8992076908218604; appOmDownClose=1; RK=GbdcVkgLsq; ptcz=fecb11febe2b4c528ac6c16367c4c8f9877fcc09f59504409d5b90cd50956148; userid=22482890; omaccesstoken=007d0a047e2f229430c516320278349fe84ed18655f7b39995437749647d940befdc6ad2097747d626614d3035355cdd494bb69d70581dd8bf73ab567aa60f77e7nn; omtoken=007d0a047e2f229430c516320278349fe84ed18655f7b39995437749647d940befdc6ad2097747d626614d3035355cdd494bb69d70581dd8bf73ab567aa60f77e7nn; logintype=3; srcopenid=BFF10E3AE6FF2541F5D52AF35DCDBBCD; srcaccessToken=19995CA8289D4B9CB41DD212475F9A0F';
  test('企鹅号首页数据', async () => {
    const cookie =
      'pac_uid=0_c2b637e12e21c; iip=0; ptui_loginuin=33325126; RK=mH2YkWa5H4; ptcz=9e3b6d78d2eadb7eb1284a327cf3cc5de6c3db259c8487942655dc70cf7d57f3; qq_domain_video_guid_verify=1938ff17d2cf12fc; _qimei_uuid42=17a1e091e23100697f375c35a34c81641dde860015; _qimei_fingerprint=df2e68cad149762f4b814b424f0da1ae; _qimei_q36=; _qimei_h38=2db8a9497f375c35a34c816402000006517a1e; pgv_pvid=781622335; ts_uid=5374132440; csrfToken=csrf-1698915773065; userid=21426919; omaccesstoken=00a6a2077a257ea05facdbcd6edfc9fe3f8700b7a90a9a10b96e1c26ef8f1621476982751f95dc30536ebcd74d1f5ff656ded6894d4824dd787f74d5eea498b24dk3; logintype=4; srcopenid=osiAywsUnCNiGhVdX6EDCGtP6AVg; srcaccessToken=74_z5PJ2-QJ4GYioxIhRjR6W4MfMo6B4KaRcGdsMZsI6hH1qbWCbtqdhMHyGM56zpgCx-vA10yZxmxDrhDM7Hgs0iwK5uCyv82mz-57c_zrvkI; omtoken=00a6a2077a257ea05facdbcd6edfc9fe3f8700b7a90a9a10b96e1c26ef8f1621476982751f95dc30536ebcd74d1f5ff656ded6894d4824dd787f74d5eea498b24dk3';

    const result = await getUserHomeDataAsync(cookie);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.response.code).toBe(0);
  }, 10000000);

  test('企鹅号有效性检测', async () => {
    const result = await new AccountService(
      'pgv_pvid=8182441515; ts_uid=4502893136; RK=lzc004dKd7; ptcz=3f54bfdbeb7442124a70c1b0141df715c32d61fcac4727c85927da09c9313177; pgv_info=ssid=s5437735571; ts_last=om.qq.com/userAuth/index; csrfToken=csrf-1744613053132; _qpsvr_localtk=0.8196805856615155',
      Platforms.QiEHao,
    ).checkAccountAlive();
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('企鹅号用户数据', async () => {
    const result = await Qiehao.getQiehaoUserInfo(cookie);
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);

  test('检测用户有效性', async () => {
    const cookie =
      '_UP_A4A_11_=wb9c61b126d64406b732383ec57393d8; _UP_D_=pc; _UP_30C_6A_=st9c66202393njjsb0ifvpx4xwhnl24w; _UP_TS_=sg1dc1f24f32c4e1c02acae24d26a59b870; _UP_E37_B7_=sg1dc1f24f32c4e1c02acae24d26a59b870; _UP_TG_=st9c66202393njjsb0ifvpx4xwhnl24w; _UP_335_2B_=1; USER_TMP=mfq9ZFai1JFOtgk-fZzRSQ.X8gCjKDteqBfuQrnaH-OBgsmBG1amvRhn5tNU83Tq9lPfINrxOIvJy6VNk73uzGkv83exzl_BhXkFUOwTU-75XSO1_tAE5ob40fbsqV2XcVk1IHL_YG9yHX9QYoHNC5na7Gzc5WGKeFyK6sezZ9ulyVGXSYkudFgUMPUtKFFVK06o1bq71Ajd8sm_07aj-W9Rlnh2j2tqXTg3D9MjXpppReBhp04-ITmIMdC86p5Z-w8BAZpgoTzJNBSRnJbQV6HyX8Toc5XODydAkgDhBbjq8qmfsOIA9C0Qj1PD7F4cWPsaTExhULbYPjm-wWoFG6owEA8-KKPIg858YpCbp-iiMvBALNzqUcWuKTOLBodmt5D-xd3v7FuL8N9c0uv8X4qMNfJrL_IupEZ5ODdYY9gHoDTnzxsoV9_gV8TPlu8wMgi38ItjLKh9LrMwJXAHdVuSkHMM9C1VIH_LvoQXkDRK5gHeBk7RDF28i-0eZRozlXvSR3rYttfwAPzESsEG-f_Jw7RpJtfybFpeorrKPxjrYYEyTAxBA5aETH6PDGHdoIOhTou7CEoCADr6rAmdN8BWQxoAvFgNNoiMmSxa10mApkvJClgRxU4z1QvJZKyCQHhuWYfi2C3P-Ll5dzrMD2SonPstPYrGfIS7ClOH31aFdK8PjwZsFQF493olbFdIs9ExdyimeKHa8hq2iwdkZQf-LCDx1GkkjDQmW68DqVJxgczn3hyqdB3I_1v8Rja03DlJR0u1z36o3kKic1AcP9oCCEgte7LJECSh6oRyoccuZqVVzXt4uohLyNA159czsPxYBVNFGx-eqgr68xK41fc8BcSsuv_Iqj03pZLxsZwscPJ4r2-V0vRq2nbFzar4puWI5NCgOaI6BIayv_-OBO4DlBE39s9jDDPFfNYBFhg2yrueiFVmJOPS5-GTIpUJ0_fjETTZDAhqYgjD6MVe2FwApf8Roxohe7Qn8ewdzk6_sVidFUTim1mwUX8A3clUUjVL8WKeeF3uMMcqUd5ICuQR_Z3BPht974013yugsNGaJigE2ogoEI3b4JDsRc5M53yI8RSnhYUdyq8x-cp7NY6HBBs2ReYhcIAWXWZKo1q-fS-l4C-e01Y9tZZVj2W3JEs0uRmS4yTL-Y-sBCvc7rzawLCIoslZV08SokIfUzMz7dmaVJeMl3CeVm5vtTVL2oqRkuzBji58xG2A1wYFT7h.1739861120473.604800000.frw4oaLd8ZipA5sDIPUeB3dD8eOU1NhwANeB_AJqhFg; tfstk=geISIt6P3bcSlkGcE7e2h0_i4p-CA6ZaNv9dI9nrp3KRA9df68DyU9dCOsRcY8APYe1CT9SewaWedD6k2ebyTQRBA9f_35rabTXkxeFa_l5s2ZepxBEevr-A3z37i5rabTHMnLg0_gRThHRWpHpJJUEYhp9BpHLpvqeXppl-J0CdH-ODBp3ppDLvHp9iyHKd9teXKIp-Zpk6dzOlF83MPaK-6B6JGDndDkYW1T3EvDIXFUsdeIMrUi9WPC80PjCf2sWd4gY0uqxh3N1CJ64Zo36dy3pNEuiXXTQVAKSUL2ORZi6AqEMZbU_pdFKplvndh3AXkMtTXj9ckT7dq_MIvLjPbeOMlJnH8nIwWNCSKRXv2pCHSMPiqQBdIGbwfouJXt_d1wsrOcR1-TgIhFmBhCybh20h3J__-j74SVYJnLT4h-GR-UpDhcybhbPwyKvcn-wjWvf..; isg=BJSURxPej_OGkBs_8uSFeQcDZdIG7bjXnJ8kri5wAJ-iGTRjVvldZ00LHxGB4fAv; cna=OzpDIIY6gz4CAdpYKHiZcB8Y';
    const result = await new AccountService(cookie, Platforms.QiEHao).checkAccountAlive();
    console.log('有效性:' + result);
    expect(result).toBe(1);
  });
});
