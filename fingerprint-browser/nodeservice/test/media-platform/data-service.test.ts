import { describe, expect, test } from 'vitest';
import { Cloud, DataService, Platforms } from '../../src';
import { MediaAccount } from '../../src/service/model/media-account';
import { convertCookieStr, Task } from '../../src/utils';
import { EventEmitter } from 'events';
import { HttpsProxyAgent } from 'https-proxy-agent';

describe.runIf(true)('【获取账号概览数据】', () => {
  test('获取腾讯微视数据总览', async () => {
    const pr = new HttpsProxyAgent('http://@127.0.0.1:8888');
    //const eventcall=new EventEmitter();
    const cookie =
      'RK=Uzc0x4dqNb; ptcz=65ebe751c759b070cca74957c882b804c53d597e6bd7d949b730a7b55c98b761; sThrAppid=1101083114; iAuthType=1; openid=D12C68BBF650C6186F6DB0295A84EE9A; sSessionKey=DA02D754A90EB56258A9572E1BB33085; person_id=1740582073363129; _qpsvr_localtk=0.6158418027027933';
    const result = await DataService.SyncDataService.getAccountData(Platforms.TengXunWeiShi, cookie, '', undefined);
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
  test('获取爱奇艺数据总览', async () => {
    //const eventcall=new EventEmitter();
    const cookie =
      'QC006=iqzq0eauwu7gsrr6ytnkxctk; __uuid=cd2eab79-080e-b546-dc57-bb6ee0e988f9; P00004=.1761706578.943445a993; QC005=5e6ac77657327056d1b8d6acf6096a26; P00001=acdQ5eWbjEkBqem1vpuBVXm3uKZgdjYBBNNq8wjc0QG1xsYYqYCdTZHOa15duaepxaR5ef; P00007=acdQ5eWbjEkBqem1vpuBVXm3uKZgdjYBBNNq8wjc0QG1xsYYqYCdTZHOa15duaepxaR5ef; P00003=5779306756299776; P00010=5779306756299776; P01010=1761753600; P00PRU=5779306756299776; P00002=%7B%22uid%22%3A%225779306756299776%22%2C%22pru%22%3A5779306756299776%2C%22user_name%22%3A%22151****7128%22%2C%22nickname%22%3A%22%5Cu74dc%5Cu5b50%5Cu7231%5Cu6d4b%5Cu8bd5%22%2C%22pnickname%22%3A%22%5Cu74dc%5Cu5b50%5Cu7231%5Cu6d4b%5Cu8bd5%22%2C%22type%22%3A11%2C%22email%22%3Anull%7D; QC160=%7B%22type%22%3A3%2C%22conformLoginType%22%3A0%7D; __dfp=a1bf1de18150664e56b3972dd94b9969ce58420593011e4954da52f51ba6c02218@1763002575666@1761706576666';
    const result = await DataService.SyncDataService.getAccountData(Platforms.AiQiYi, cookie, '', undefined);
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取抖音数据总览', async () => {
    //const eventcall=new EventEmitter();
    const cookie =
      'x-web-secsdk-uid=059e6440-7886-4b01-a7ad-e9d258aad5ff; gfkadpd=2906,33638; _tea_utm_cache_2906=undefined; csrf_session_id=e3f24437df4a4c5df301c5a00875d9c9; bd_ticket_guard_regenerate_keys_time=2026-08-24/13:43:04; passport_csrf_token=ca634614a063529c93d3a2561d75c2e7; passport_csrf_token_default=ca634614a063529c93d3a2561d75c2e7; bd_ticket_guard_client_web_domain=2; s_v_web_id=verify_mt6t869a_WOK5R5ks_2apf_4aef_AnkK_RYp7cvO12bCk; passport_mfa_token=CjXEjHRSpQvIGLn8ngCZOCdU7ivzcqyQR4hPoehcKK1XmwdNdLN%2FqOAFwOEq%2B3JnaCzqn3wtXRpKCjwAAAAAAAAAAAAAUNECcb3wEU9F8LWznmMrVBmqdjZvvzA%2FmtjTpNMcVTuEN3P9Vf4VHUn%2FY%2BuFikNnfWAQxbGaDhj2sdFsIAIiAQMhUxGE; d_ticket=4a4477199153c2102ad07df81046045f6c051; biz_trace_id=05a6bdc2; passport_assist_user=Cj04XkyKzPlQ5vJEnETmS6FXo85iv_uF6JL9sNRzcs-nDshXzp_-CEXyhvpGxcxd0tAGOqwAO03hRaUZoH_ZGkoKPAAAAAAAAAAAAABQ0Rj0yrwhJGgoICNEhykIOhIVx3MxjOZqUiKfX_QyYt88nOopxiWOFVKseeVsbrji4RCssZoOGImv1lQgASIBAyhNiV0%3D; n_mh=9-mIeuD4wZnlYrrOvfzG3MuT6aQmCUtmr8FxV8Kl8xY; sid_guard=9082944e8fe912e962316acf401e6e25%7C1787550336%7C5184000%7CFri%2C+23-Oct-2026+05%3A45%3A36+GMT; uid_tt=7e23e826723373633c3e5d93acab50db; uid_tt_ss=7e23e826723373633c3e5d93acab50db; sid_tt=9082944e8fe912e962316acf401e6e25; sessionid=9082944e8fe912e962316acf401e6e25; sessionid_ss=9082944e8fe912e962316acf401e6e25; session_tlb_tag=sttt%7C8%7CkIKUTo_pEuliMWrPQB5uJf_________MniBTSIw7UZF4p8J0ELGAswSAHyMz0LWbC6b6-afJA84%3D; is_staff_user=true; has_biz_token=true; sid_ucp_v1=1.0.0-KDNlODk5MzMxNjk1MTE2NGFhNDc1MzQxNTczNTJiZWNjOTg0YzdkOWMKHwi99PP9jQMQgLWv1AYY2hYgDDCR4snfBTgHQPQHSAQaAmxxIiA5MDgyOTQ0ZThmZTkxMmU5NjIzMTZhY2Y0MDFlNmUyNQ; ssid_ucp_v1=1.0.0-KDNlODk5MzMxNjk1MTE2NGFhNDc1MzQxNTczNTJiZWNjOTg0YzdkOWMKHwi99PP9jQMQgLWv1AYY2hYgDDCR4snfBTgHQPQHSAQaAmxxIiA5MDgyOTQ0ZThmZTkxMmU5NjIzMTZhY2Y0MDFlNmUyNQ; is_dbsc=false; x_tt_token=009082944e8fe912e962316acf401e6e2505c1ebf6b002813a72abc4c6d4aa9065b01587a7747a5155c1cddcf6a6f53da021d1cfd9414da2df1ee22779020dd6f15fde36933b5431735fe4b8d5dc617a0ac37bcce88d35fc5bf1bda521137617556e4--0a490a20335c75c16b9367c82d0d075b24573a9a4d571af968ba8b2f3140996c645bcf451220223d461b3f572e38c417acc284a553e19669db2b9d45758ce08209e1860ca23e18f6b4d309-3.0.4; _bd_ticket_crypt_doamin=2; bd_ticket_guard_ts_sign_id=ts.2.95b7e4c54eb21c8; _bd_ticket_crypt_cookie=02e2fd22a46b3cb6874394fb8d9d0aba; __security_mc_1_s_sdk_sign_data_key_web_protect=0db22610-439d-952c; __security_mc_1_s_sdk_cert_key=9d14710f-490f-b61e; __security_mc_1_s_sdk_crypt_sdk=96aacdd8-4e45-ab90; __security_server_data_status=1; gd_random=eyJtYXRjaCI6ZmFsc2UsInBlcmNlbnQiOjAuNjU2NjcwNTQwMjAxOTk0Nn0=.NgrLsXWiC02NHTcEmtYRR3QIVNGSSLL4qTQyRBPHKiA=; ttwid=1%7CMSFuRseTwB3-6xd3C8a-hxrcWtk1o5e-Y_y7r665NcY%7C1787642347%7Cf0fb4aa6962d5e63afb8b0ea70f6b2f3f5c4f448a6399873f78940a030783795; bd_ticket_guard_client_data=eyJiZC10aWNrZXQtZ3VhcmQtdmVyc2lvbiI6MiwiYmQtdGlja2V0LWd1YXJkLWl0ZXJhdGlvbi12ZXJzaW9uIjoxLCJiZC10aWNrZXQtZ3VhcmQtcmVlLXB1YmxpYy1rZXkiOiJCTHQzSERHNTJ6aEFvWVdibVplalpzdzlPZEFaK1kyTGw2Q2dDK2pUYS9XZGZCRFh6Q2s0REpsMzdhb3hiKy9FK2NuR1JUMmo1a05DbE1JQnErKzM0WE09IiwiYmQtdGlja2V0LWd1YXJkLXdlYi12ZXJzaW9uIjoyfQ%3D%3D; odin_tt=223fda083af60bcb1bd53d8d680c8932da107ff26ac21ab1411e78852c6b58d272bdc95a2cc633bbc8c98f009ff8ae3907069004632586a2382f820d3ef53ea0; _tea_utm_cache_1128=undefined';
    // const decodeCookieBuffer = buffer.Buffer.from(zip, 'base64');
    // const decodeCookieStr = pako.inflate(decodeCookieBuffer, { to: 'string' });
    // let cookie =
    //   'x-web-secsdk-uid=97470532-83de-4957-828b-cfc4e4464ae1; csrf_session_id=4047ee614f2b431fbc847db863e70060; __security_mc_1_s_sdk_crypt_sdk=be27c4a3-45bb-9b4f; bd_ticket_guard_client_web_domain=2; passport_csrf_token=f6ca0bfaafdc1889a176f5a3ff938acd; passport_csrf_token_default=f6ca0bfaafdc1889a176f5a3ff938acd; biz_trace_id=da5f56e0; passport_mfa_token=CjccGNsrxscT8SzYU9yjCm3i7jTibVkXGARa6vbITUzNiO5b1eU86Ts0kburdoSgZ%2FhI%2B%2BaDjxdeGkoKPAAAAAAAAAAAAABPRiNBO5wnDNNICCh7Fj%2BAJMxbtrWjy6uKhQnhE74GkGhbmJfQWkkSBnKIVy%2BNOpu%2FoxDq1vcNGPax0WwgAiIBA5jpl8I%3D; d_ticket=6c71d5e8f5f32c6ec83baaf96d71f02dc86b6; passport_assist_user=CkF56yvVtbXCHFbp2aoUbRu1YCWK-JPARdhmiplJYMIe4l6OmeU_cIoBBaYvyHUQISETRYqilVglAeVim8MNrHFSpxpKCjwAAAAAAAAAAAAAT0askgDZeJJz6Za5CwUtZaAOyP6R-yAjJ1qaNu-VXbl8sg3_sbEuTOco1L_UOsCw2eoQl9f3DRiJr9ZUIAEiAQMJEU2T; n_mh=XKutLHrFWXxvtsRAOgO42oBvB_2oj9w7eU134_3lnFI; sid_guard=c39ab01c83ac0913c1c192ca8524bf36%7C1753448121%7C5184000%7CTue%2C+23-Sep-2025+12%3A55%3A21+GMT; uid_tt=ec3ee80d520f55743461cdfb0cada490; uid_tt_ss=ec3ee80d520f55743461cdfb0cada490; sid_tt=c39ab01c83ac0913c1c192ca8524bf36; sessionid=c39ab01c83ac0913c1c192ca8524bf36; sessionid_ss=c39ab01c83ac0913c1c192ca8524bf36; session_tlb_tag=sttt%7C13%7Cw5qwHIOsCRPBwZLKhSS_Nv_________twYALorUhqCrmwp133Tu4qD1YXKWaSL2fJuLZRcgY1eM%3D; is_staff_user=false; sid_ucp_v1=1.0.0-KDQxMGIwNjE2NmMzOGFhZTc1Y2Y5Y2Y2ODE3Y2RmNTgzNTExOGRmYWUKIQiplpDJvc3qBRC5_Y3EBhjaFiAMMK2l9q0GOAdA9AdIBBoCbGYiIGMzOWFiMDFjODNhYzA5MTNjMWMxOTJjYTg1MjRiZjM2; ssid_ucp_v1=1.0.0-KDQxMGIwNjE2NmMzOGFhZTc1Y2Y5Y2Y2ODE3Y2RmNTgzNTExOGRmYWUKIQiplpDJvc3qBRC5_Y3EBhjaFiAMMK2l9q0GOAdA9AdIBBoCbGYiIGMzOWFiMDFjODNhYzA5MTNjMWMxOTJjYTg1MjRiZjM2; _bd_ticket_crypt_doamin=2; _bd_ticket_crypt_cookie=445cff2587d1263bb4416d3165c9712e; __security_mc_1_s_sdk_sign_data_key_web_protect=b0c58515-4194-be71; __security_mc_1_s_sdk_cert_key=639800d9-4cf4-9625; __security_server_data_status=1; passport_fe_beating_status=true; odin_tt=6077ae63bb77db6e386102d2ee82c69a158f92eec3cbe71ea9938fe6acce3d77224244cd161babb16410dd197c1de736924e6adf17d4514d3934d88bb84d4cf3; gfkadpd=2906,33638; _tea_utm_cache_2906=undefined; ttwid=1%7CrONwdKwxXLHv1fCcfydB_p185Y3InCKJ6OTfneS6hGE%7C1754621752%7C969522eda34b59e7cbcd1c7121adc571330d283b467315d72d22384240931bb2; bd_ticket_guard_client_data=eyJiZC10aWNrZXQtZ3VhcmQtdmVyc2lvbiI6MiwiYmQtdGlja2V0LWd1YXJkLWl0ZXJhdGlvbi12ZXJzaW9uIjoxLCJiZC10aWNrZXQtZ3VhcmQtcmVlLXB1YmxpYy1rZXkiOiJCRCt4V0E3SW1mMzNJdG5SQ2QyZFFPT1MyNVdRR1AwMHZsc0J6SGFWaUtMMXk1bTd0TEZZWDJHcEpQcnNadGJoc2lHb2w4RWxUS0ZCZUtnMEVhaTF0bDA9IiwiYmQtdGlja2V0LWd1YXJkLXdlYi12ZXJzaW9uIjoyfQ%3D%3D; gd_random=eyJtYXRjaCI6dHJ1ZSwicGVyY2VudCI6MC44Njk1NjMyMTExNjM3MDE3fQ==.AFVx298ScrRpaV1NhgQOSmsE+no1GUbFUZpYHQXSIJA=';
    // cookie = decodeCookieStr;
    const result = await DataService.SyncDataService.getAccountData(Platforms.DouYin, cookie, '', undefined);
    // assets
    //delete result.data;
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取快手数据总览', async () => {
    const cookie =
      '_did=web_30657122871A017; kwfv1=PnGU+9+Y8008S+nH0U+0mjPf8fP08f+98f+nLlwnrIP9+Sw/ZFGfzY+eGlGf+f+e4SGfbYP0QfGnLFwBLU80mYGAzY+/LMGADEwBHM8fclG0L9+Bz0GAq7GA+j+eQjGAYY+/4Y+/bfG9rlwn+j+9GhP0+08eW7P/PlG0LE8fH7P0QD8nch+erMG/LFG0L9G9H7+fP7GnP9GnGh+fcl8BH7+Z==; did=web_8b8e808b72d7a80e1d50b01a1100d1d72d9e; bUserId=1000426152498; userId=4652467589; kuaishou.web.cp.api_st=ChZrdWFpc2hvdS53ZWIuY3AuYXBpLnN0ErABaoQ54Yjfnc7OAAhpCPdnldnYbxnL8zJnW0ynJXYDJEKWNaQ0sLctDPuQ98W7xIqMYnJzppCLQFaQGU9VR6R2TCpAV6hLQkWgJZSKwxJeM5775mwy4LvongMqPOnRjnTWoh4a1ka5LK6oelGAD3JdLmuMXF56e0cXhP0yprMkZt1oifxJdrpD3rIrfmaMfK6Z8TU2GNevn9AKUibaD9LwfatKavsbscbbVQP0sMH_ZKIaEigiXAXbikfxY_eaMpqy56wmIiIgb-kxGz3Iw7Osj748lkfg0_3ukd8ktI4F5F3ByPFHCUMoBTAB; kuaishou.web.cp.api_ph=1ba150a77dee537735da7ed49c3067f1290c';
    const result = await DataService.SyncDataService.getAccountData(Platforms.KuaiShou, cookie, '', undefined);
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取视频号s视频数据总览', async () => {
    const cookie =
      convertCookieStr('[{"name":"sessionid","value":"BgAA1bcnyfItjXC9%2BV0enNkJ4%2FDtPi1YM%2B5273DGtB9vQtzCiBk9cP9tp%2BAe2VP3p7lOj9wI5tz9MwbWhCBP%2F%2B0wYyqGQgsn6Q8wNDinqIgK","domain":"channels.weixin.qq.com","hostOnly":true,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1822285043.987921,"sameSite":"no_restriction"},{"name":"wxuin","value":"2813985289","domain":"channels.weixin.qq.com","hostOnly":true,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1822285043.988033,"sameSite":"no_restriction"}]');
    const result = await DataService.SyncDataService.getAccountData(Platforms.ShiPinHao, cookie, '', undefined);
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取视频号图文数据总览', async () => {
    const cookie =
      convertCookieStr('[{"name":"sessionid","value":"BgAA1bcnyfItjXC9%2BV0enNkJ4%2FDtPi1YM%2B5273DGtB9vQtzCiBk9cP9tp%2BAe2VP3p7lOj9wI5tz9MwbWhCBP%2F%2B0wYyqGQgsn6Q8wNDinqIgK","domain":"channels.weixin.qq.com","hostOnly":true,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1822285043.987921,"sameSite":"no_restriction"},{"name":"wxuin","value":"2813985289","domain":"channels.weixin.qq.com","hostOnly":true,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1822285043.988033,"sameSite":"no_restriction"}]');
    const result = await DataService.getAccountReport(Platforms.ShiPinHao, cookie, 'video');
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取小红书数据总览', async () => {
    const cookie =
      'xsecappid=ugc; a1=19c929dcc0e2ke0o72krvn7um1fl8c423d3exzn2450000182022; webId=ddc4b8ff21e595554dc40a8bc2b4b8fa; gid=yjSjJjfKdWqdyjSjJjfSSfuI8dJTd8lWJTFhqJ4IW76yid281YS4JC888yYJ8JJ8WDW0Y2D2; x-user-id-creator.xiaohongshu.com=605418e20000000001008a3e; customerClientId=339460620170646; access-token-creator.xiaohongshu.com=customer.creator.AT-68c517610623486797971465qwpwac2yexc15dh7; galaxy_creator_session_id=PnGpHYwJYfXiSPjnkHDuQAhBM35C70ZgIjVP; galaxy.creator.beaker.session.id=1771986365630026010615; loadts=1774255547881; websectiga=10f9a40ba454a07755a08f27ef8194c53637eba4551cf9751c009d9afb564467; sec_poison_id=4aeaf5d3-bd9b-4934-8ef1-8bb4ca31167a';
    const result = await DataService.SyncDataService.getAccountData(Platforms.XiaoHongShu, cookie, '', undefined);
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
  test('获取公众号数据总览', async () => {
    const cookie =
      'ua_id=Ny4LDBZrddBfYvdvAAAAAO2MrFNv17EOyKzMJyhbVdQ=; _clck=t0tzkl|1|g4l|0; wxuin=74264573918107; uuid=9259bb3e2561e7a855584482d7a2d1fb; rand_info=CAESIFSESaatoUVrl/JrP5vcrOVBmf3i0Vlp7oV+5ejS33EE; slave_bizuin=3927238210; data_bizuin=3927238210; bizuin=3927238210; data_ticket=coaZ1lA0O7QXOxOKK323MIO8goKgPeMqp9uzk4R7ODQli6PIoBfes9I9F4NaKW59; slave_sid=OXZ1STlQbndocGZkR2RHb2g0RkRFSTlxT29tcmlTbUFUQ0ljX3V1clVUdktfZVM1akFtRjZSdzBPODdUNkthZ2g2WXpRa3JEYmxnY3YxWDJZY2x5MjN0bHRzQWVtN0tNSnRkWmdYZ2FlZU9GMWU5ZkhhWEo5S1JaeVVOWUZUdDBRMHlMTGFVcGNYMXdHQzRl; slave_user=gh_c6e61f562741; xid=3f1450ec1cbb9118067dccf75c8e3e00; mm_lang=zh_CN; _clsk=13ih6ns|1774270099329|3|1|mp.weixin.qq.com/weheat-agent/payload/record';
    const result = await DataService.SyncDataService.getAccountData(Platforms.WeiXinGongZhongHao, cookie, '', undefined);
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
  test('获取B站数据总览', async () => {
    const cookie =
      'buvid3=1A87FD69-E123-E062-BEAA-43ED8C04BCAF13811infoc; b_nut=1758181613; buvid_fp=ca884197b0e55ac5e1e3efa4bb441b26; SESSDATA=fbfc4f6e%2C1773733626%2Cb29e4%2A92CjDtHjGRP2n0mSXyVixwmHMYejzXvLD8ieNRS7BSLZblaX6K-3vrW6_e2PeDbggAcN0SVkxYTVZlaV9TQlFZOWVlOHA0Slc0WmNMRUY1MFh2MlRwUGtMMDNxLThfeUVFNXNPX2JwMkM4WkFpOGNmOE9lb0RScG5wczBaWEdYZ1JZbGxzSk1tNE5BIIEC; bili_jct=c2512c840827422a20f59952a95769c4; DedeUserID=401253285; DedeUserID__ckMd5=ba6d48fa993ce777; sid=q9ob9rgz; _uuid=6D710A5110-B6F3-23A7-936D-39F4977A5F7623639infoc; enable_web_push=DISABLE; home_feed_column=5; browser_resolution=1920-960; theme-tip-show=SHOWED; buvid4=F27BACAD-546F-290C-5C2F-73B201ABB9D914435-025091815-oXXAX2v2saks+S4HadIvsw%3D%3D; b_lsid=4E54106AB_19B26AFCB94';
    const result = await DataService.SyncDataService.getAccountData(Platforms.BiLiBiLi, cookie, '', undefined);
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取百家号数据总览', async () => {
    const cookie =
      'theme=bjh; BAIDUID=530476EEF7F30F2E212222CA56E6C37A:FG=1; BAIDUID_BFESS=530476EEF7F30F2E212222CA56E6C37A:FG=1; PHPSESSID=gi4i3h6fgaflrdb4fvl4398ug2; RECENT_LOGIN=1; HMACCOUNT=670E456C080FE1BF; BDUSS=JJdFBMdmFVdlNSbGo1TnVoR3pIM1o2dDhSZ1FVRUtZdG8wMjFRfkhTSkx4enRwSUFBQUFBJCQAAAAAAAAAAAEAAABdGAzMyrLDtM62tcC1xLnP19MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEs6FGlLOhRpem; BDUSS_BFESS=JJdFBMdmFVdlNSbGo1TnVoR3pIM1o2dDhSZ1FVRUtZdG8wMjFRfkhTSkx4enRwSUFBQUFBJCQAAAAAAAAAAAEAAABdGAzMyrLDtM62tcC1xLnP19MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEs6FGlLOhRpem; ppfuid=FOCoIC3q5fKa8fgJnwzbE67EJ49BGJeplOzf+4l4EOvDuu2RXBRv6R3A1AZMa49I27C0gDDLrJyxcIIeAeEhD8JYsoLTpBiaCXhLqvzbzmvy3SeAW17tKgNq/Xx+RgOdb8TWCFe62MVrDTY6lMf2Gixx7aLvAhqvNkvAJQDmQheTJbcu/AFainBdW3mPgxdz5OfNyUCwYGCwdaCAvb4zIAXiPbbFPDQVtPAPnuC7GKo4JBM7053Q+UyCTEj7Fgd4l4Arsz+u5qykCI0DqyHtMkt49OC+Tx5guSJPFG/G6oDtRp3bqUFgYeNkP3aLQT5kYjAh8A8yft+s3B4RtKRu8VzjBYc3VZO8C3FJKPf/VpOiS8DHSHR/nhAJRNzx8LHyGWhocXrPp5Y8evA8e3q50aUamr+SmbWOK+U2n1YNoW+ioTSKU4nQaaWWJj1AnjrL+sma/I9in8l5AhdP95hxKdnTNS/pLMWceus0e757/UP9wfDgkA/VfIUQpG5Qx8UEAAv3LCf1Y7/fHL3PTSf9vid/u2VLX4h1nBtx8EF07eCMhWVv+2qjbPV7ZhXk3reaWRFEeso3s/Kc9n/UXtUfNU1sHiCdbrCW5yYsuSM9SPGDZsl7FhTAKw7qIu38vFZiq+DRc8Vbf7jOiN9xPe0lOdZHUhGHZ82rL5jTCsILwcRVCndrarbwmu7G154MpYiKmTXZkqV7Alo4QZzicdyMbWvwvmR2/m//YVTM8qeZWgDSHjDmtehgLWM45zARbPujeqU0T92Gmgs89l2htrSKIX9zrq0pn8eNCqEZdl62PlP6XXmpqIV64NeHXkzPGk+yvai6OYUn80FYgTtVBKXFxZdImdyxYIjA1uSy2hfTFv/d3cnXH4nh+maaicAPllDgrppZTr0lDf2Vsiy73L8egP9ck5gsaaSE4obz9V1JGvyp8lNw+IyCN2Gou0efGgcYQBug3EYJEWCj3Pc/9aTWTZA4/akL8FB7FMLdbBSTKQ1rGRChHnhPuJeIKACPXiVuli9ItRLEkdb1mLxNHAk3uJy88YX/Rf/sKUjR12zxRTDxxJNDJS+Dlsbqu3n4I65ujli/3rQ8Zk1MjmTOsz9+kTqOM4upsnQ6IWq/zeZTItMCgHpQhuhr4ip73honuzoJgge1cqWBFYvpabAPTOERTOP1kmx5SXPARX5uxyJzAiNILBC8zh7fGfNXOWV37O9g7EF4Bhdyo1ub8rfchHyXakg3FbqEqM6JmRHqkwRhSJQL7FZBzjoNULxTpfhfCsp4zRszeYvFyXCPSuJ5oyoOgoCPKXE8fX73WOZ0mAlF1mc=; __bid_n=19a7af457089216d9ddb2a; Hm_lvt_f7b8c775c6c8b6a716a75df506fb72df=1765769123,1767683006; Hm_lpvt_f7b8c775c6c8b6a716a75df506fb72df=1767949016; ab_sr=1.0.1_ZDM5YTdiNmQ4MDE5ZTliMTk5YzNhZDIxZmU4OGIwZDdhNmY3M2FjZWYwZGE3NzUxZTVmNDgwYjU4OTA0MTE1ZDM2OGUzODI3NGNkZjNlNzY5NjQ0M2NmMzUyMmFiZTJiYTI1OTY1NzI2NTdiNmY4YTAxZjk1YjU1OTJhNDkwN2RlNzFiMThmZjJkNWZjNzBlMGNhYTE3ODVlNjg5MTJmYWZiOGM1NTdjNmZkNTI1MWIyY2E3YWNkYzkyNzY3OWEw; devStoken=f9bd9c8dcd5d7756af2ea51fb44edde029dfd2e20906d65866ff68b9ec213df8; bjhStoken=0201d0b715909be2ae86310e4ad2ca1329dfd2e20906d65866ff68b9ec213df8; RT="z=1&dm=baidu.com&si=a916d6d7-a5ee-42be-96aa-46ebe9038232&ss=mk6n7t1i&sl=3&tt=126&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf&ld=o0w"';
    const result = await DataService.SyncDataService.getAccountData(Platforms.BaiJiaHao, cookie, '', undefined);
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取头条号数据总览', async () => {
    const cookie =
      's_v_web_id=verify_mfuvxwt2_GViYOjzI_zJNY_4n1G_8kwE_LliPflS7q5XJ; passport_csrf_token=4601c9902e5ea574344ebbcae6b0bceb; passport_csrf_token_default=4601c9902e5ea574344ebbcae6b0bceb; n_mh=NiapHmvsv_kDNVSiFvIHBvsbNE4_RRoW3EqcWkBYrBU; sso_uid_tt=0fa01e7a38e98ad80815caeb28df5e89; sso_uid_tt_ss=0fa01e7a38e98ad80815caeb28df5e89; toutiao_sso_user=1d583e2e7c37140c608bedca3780888c; toutiao_sso_user_ss=1d583e2e7c37140c608bedca3780888c; sid_ucp_sso_v1=1.0.0-KGU3YmY1NzZmYjU2MTRkMWYxODBlNGM2MGI2ZTNmZDlkMGVlZDdiMDYKHAiCva_l-wEQ3pvExgYYzwkgDDCK-pLNBTgIQCYaAmhsIiAxZDU4M2UyZTdjMzcxNDBjNjA4YmVkY2EzNzgwODg4Yw; ssid_ucp_sso_v1=1.0.0-KGU3YmY1NzZmYjU2MTRkMWYxODBlNGM2MGI2ZTNmZDlkMGVlZDdiMDYKHAiCva_l-wEQ3pvExgYYzwkgDDCK-pLNBTgIQCYaAmhsIiAxZDU4M2UyZTdjMzcxNDBjNjA4YmVkY2EzNzgwODg4Yw; sid_guard=ab472f75bdd80005a4e726050c96c040%7C1758531039%7C5184001%7CFri%2C+21-Nov-2025+08%3A50%3A40+GMT; uid_tt=6425ecb04a8fa62bb8a8cd6120a27102; uid_tt_ss=6425ecb04a8fa62bb8a8cd6120a27102; sid_tt=ab472f75bdd80005a4e726050c96c040; sessionid=ab472f75bdd80005a4e726050c96c040; sessionid_ss=ab472f75bdd80005a4e726050c96c040; session_tlb_tag=sttt%7C2%7Cq0cvdb3YAAWk5yYFDJbAQP_________QNIo2rl0IRAYKZzdf1KrcjkyffM8mp96ie6tv0QpQg58%3D; is_staff_user=false; sid_ucp_v1=1.0.0-KGE1YmI1ODJmZDFiYmZmMmFhNmRjNTM0MjVkNmViYmQwOTYwMWM0MTQKFgiCva_l-wEQ35vExgYYzwkgDDgIQCYaAmxmIiBhYjQ3MmY3NWJkZDgwMDA1YTRlNzI2MDUwYzk2YzA0MA; ssid_ucp_v1=1.0.0-KGE1YmI1ODJmZDFiYmZmMmFhNmRjNTM0MjVkNmViYmQwOTYwMWM0MTQKFgiCva_l-wEQ35vExgYYzwkgDDgIQCYaAmxmIiBhYjQ3MmY3NWJkZDgwMDA1YTRlNzI2MDUwYzk2YzA0MA; ttcid=7b4c68641af6432fac1959a9be64f1e638; tt_scid=Cl1tGSw77iUWrCGTnI3VN5t0yuuBVWWBgLYz8FfdjcQjw33RvIt2UoPzR-yg7Rdf735f; odin_tt=9eaa5062649feaa0118db519c971f9282830e9a76c387b2ec60256556374991d575125534809ba676e97e1cd41ed2171; x-web-secsdk-uid=f7b23b18-efe9-4b91-b3d0-65f07b10155c; csrf_session_id=9b7752832e86b11e1aa10565220c4186; gfkadpd=1231,25897; ttwid=1%7Cg_Ek8HyiyGBld4nfaTHQOt61StBUB7aZzV-i-bS2sJA%7C1762324880%7Cffe7bfa3e6a4b8e21054a1a32294ee496d3cef213e573c1a4f9c3c78c2dfb142';
    const result = await DataService.SyncDataService.getAccountData(Platforms.TouTiaoHao, cookie, '', undefined);
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取新浪微博视频数据总览', async () => {
    const cookie =
      'SCF=Al5T1d4JUYFCar6klRTCxuhzH5ultRoXhKgAB04-vko28zD4H_CfftqiV_CMVxBplW2Kf-kS0rhdPoyNkXV_DYg.; SUB=_2A25EDCazDeRhGeVH41UQ9CjOwzuIHXVnYCZ7rDV8PUNbmtANLWLnkW9NTzB_N1mof9INnscHEnpAGN2A0BGx8bUG; SUBP=0033WrSXqPxfM725Ws9jqgMF55529P9D9WFocrCIbkORgQyaQXUySSLF5NHD95Q01KnNeKBceonNWs4Dqcj_i--fi-isi-8Fi--Xi-z4iK.7i--NiKLWiKnXi--fiK.Ri-iFi--4i-zpi-ih; ALF=02_1764746211; SINAGLOBAL=4571543693241.713.1762157142818; ULV=1762157142871:1:1:1:4571543693241.713.1762157142818:; XSRF-TOKEN=IaXdL5wJUb4_tcdHrsNK7c6E; _s_tentry=-; Apache=4571543693241.713.1762157142818; WBPSESS=s5sLdEOQfTRzUuegeiqUDR5NClEufe7I1-tGR7ctsbAyENMOL_Wg_J1uP-_XL9_Z5ZGIcWyuathiOfflBwnlNfyoNfX15jngrFJ-m5uGtuaFI--iMTKd9o-1n6uIukHb';
    const result = await DataService.SyncDataService.getAccountData(Platforms.XinLangWeiBo, cookie, '', undefined);
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
  test('获取新浪微博博文数据总览', async () => {
    const cookie = convertCookieStr(
      'SCF=AvIMenX58GDJXbZqN8C_qt4Lht5PJhNI_o8hQ6tPJMoWg5hWR7KShuwjiABH-Pk4FR9b58VS_pYw9-kB0vu7RtQ.; SUB=_2A25EuMaFDeRhGeVH41UQ9CjOwzuIHXVntEZNrDV8PUNbmtAbLWX7kW9NTzB_N00iBEVHGoNccDqcT1jZtW_7jK3s; SUBP=0033WrSXqPxfM725Ws9jqgMF55529P9D9WFocrCIbkORgQyaQXUySSLF5NHD95Q01KnNeKBceonNWs4Dqcj_i--fi-isi-8Fi--Xi-z4iK.7i--NiKLWiKnXi--fiK.Ri-iFi--4i-zpi-ih; ALF=02_1776567253; XSRF-TOKEN=9Ks1lWFz--kgg5Z_VaynX7-9; WBPSESS=pCnfi4EeoIkPvjAjZchhRlK7VdIS8yO-JE6jZY8MWiYjFOVqJcHj99o8T2i7-ty_PeI2Uyq1ca2vm9cUgbbGkWB20JPQGdIrfzMwmI6bq-k6DRl5EeE6rh3bp6R8i6IekLnhWAEmf4jlf9ZFlRgQwg==',
    );
    const result = await DataService.getAccountReport(Platforms.XinLangWeiBo, cookie, 'dynamic');
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取知乎数据总览', async () => {
    const cookie =
      '_zap=04a9b2e1-a391-4ee3-919a-f10242e9ce7d; Hm_lvt_98beee57fd2ef70ccdd5ca52b9740c49=1760680197; d_c0=jpBTLphBPBuPTsouSPAlsFm14aqE8--F454=|1760680195; __snaker__id=lekyZ0B32ozldNJd; gdxidpyhxdE=0%2BNW7f2AfU3OaVAUYfyDHk%2BKhMShBWmLoPEZLSOUQVyce4QSBQSnQTlb8K%2F27Sf8BXbAL347O7rDCfLil0WpACY%2B%5CdrAtJRbHDbJTVWt5lTMfXfvoheTGuJTIajdjQ8INJzuZDKGCGim306UsGnIgMdTMjnbm2cLlklJOnZ%2FNrce0U3k%3A1760681098165; captcha_session_v2=2|1:0|10:1760680233|18:captcha_session_v2|88:V2ZtQWk2NEhDTE9ZY0pkdU45RFg2UndqcFh5Zyt5NDE4QVBSaVkvYkVQMkMrV09oM015cHVIdVgxc0NCU0llMQ==|d23f8c2d67d1d84501ba7783562cd03f245ac7aa8386bdf648a468ea9af95120; captcha_ticket_v2=2|1:0|10:1760680252|17:captcha_ticket_v2|728:eyJ2YWxpZGF0ZSI6IkNOMzFfeVRlQ3RULktfc3hTU3pKYnpqcU5mb1V2bTZkbG1MWW5RZjJ5UmNtejNXbklZZnRQZDRYUEY5clZxZEhMbWl4Ykc0Q2l0UUVnclRUelBpRE95dWhvdkVDS1M5QndBZ2NsMTFZSFZiNmtBWXdGd2lZOFdYc0pkUlV1YU1UWDNxQ1NsblkwSHdHbHhFZjJFKmZNakI5ZElXcDVpOTRVX2Z3MlJZam9Jck5rU3dTUi42RjFPcmJYOWpuVjRpMGxOWEkuNV8uKm1wYm53cHJuLkpYLnFwTGV3UVdtMFE1T3pkZTlScFV5UE5nd09mYlpkSXFyMFQ5T0gzWGZCaVEuM1RvTy5UaktqSjl1UlF0ZTloNkhSRzRXY1JfNFBJZzN2d1dHWlIweiptVjlXRDFieFVLZVlEWUVCenpWcTZSWkQwVGFqR2pYdXBWbWNvWWRSUGliYzlLaEdFYkMwM3pUaXpsOHpkMG91X3ZjMkZLc2JadkF4dDB4aDI0UW1GcER3TEMyWFg5OGVsc1IqTFhpS2ZKX2hYMTJmU25IMS42TlF5UHJvUGRzSHB2QzFWUENuT3BoaUY1TG9HSmZDTGlTaGpnLi5oT0h6WTk1aS50MjJ5ZlpsYjJuQ2VHSmxZX1Q1dnJzanp0TG9CaVd0cy5SZmZMWWRJSkgwbFNhRFZrUWpKaypuMWxpbVk3N192X2lfMSJ9|9bba1f8674760133e76df3b7d3d9238009d0fb73b2ea2f31253d387f36bbfb1e; z_c0=2|1:0|10:1760680252|4:z_c0|92:Mi4xUE1IZlhBQUFBQUNPa0ZNdW1FRThHeVlBQUFCZ0FsVk5QQ2ZmYVFDbFJOT0lpOU15TUo0djR6VkxLVmo1R0F6dXdB|19581d6070587f60e868eea7f83303a790a41c94d2859e106305862edb7a916e; _xsrf=cdfe1218-a871-4453-88c3-55d6306b354c; HMACCOUNT=B169BBB6DC6301FD; DATE=1760680197366; cmci9xde=U2FsdGVkX18soVo9Yg2mJBDkuQBs5VAZJTApvfjLqM1kHl/AOdVJheJvqpQkv8QBC0zvN9kn4QauwCaj90lKhg==; pmck9xge=U2FsdGVkX1/BMIaCLWMUytzdqPuK7KNhpnw/ftQyGmU=; assva6=U2FsdGVkX19UwRG9U/I+20RtobLUg0IJ9drVRpx0rdc=; assva5=U2FsdGVkX19ZRGd8tw1GlcMskyKidHCU7JlDuQYE2rbn97NhOPiWY/QKCWx4BLqlzu4G49EtvbKgabOwHPFAng==; crystal=U2FsdGVkX1/So+z1Sj5vsQmxlkaRZ73wKIz4BHZ3nZVERD0Dj3/I1vc5yxv5Nnwha8wLcHSeZ3eiSjNQghj0EbwUbd9LmDmY1kyRGByVl6VtP2vu0MIR1wBAPv3gqXGe+UtnOql2NIaeTNc50sMlY4gDWp5w4fGT/FOS9x74Q0lOTsRwZnLvgu2u9Nda2gjCyf6KGi+CU51+GXwpx56s1M6uRQztFkdEoB1Q1+R9ZNeNw5XSoByFNpcQwVK2WIWy; vmce9xdq=U2FsdGVkX1/TfjbeQF4LHH2DCM2ImHCjw5YQCCyZAgMxDsxiHlijGKaGtPpG797oEmHU209yqtFG7HFVM6DTFKaaLDpi4M2owS8+a0cmcB24K2wME1K/MBMAnoY3puALLejKnR4TkyWkmnYVlqCpp8SZnQ83AVRFlKe252eD7h8=; SESSIONID=cdSm4wlsHUocnJKgL33gdtluk4zKtPqQ3563o46deQP; JOID=UlkVBUoqXlo-E7jYZ1rZyceK_-R8SDsPVCbOtRJjCjRbevOSASmAqlATuN9mVX7Y7lvKQYlQhLg0TKHVBl0a05c=; osd=V1oSB00vXV08FL3bYFjezMSN_eN5SzwNUyPNshBkDzdcePSXAi6CrVUQv91hUH3f7FzPQo5Sg703S6PSA14d0ZA=; SUBMIT_0=a5700183-70f9-47b6-8d66-ff61fc28bbbb; BEC=7aabe613cb4d97a48eb82ad02e0db63f; Hm_lpvt_98beee57fd2ef70ccdd5ca52b9740c49=1762345848';
    const result = await DataService.SyncDataService.getAccountData(Platforms.ZhiHu, cookie, '', undefined);
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取企鹅-视频数据总览', async () => {
    const cookie =
      'userid=24272470; logintype=3; srcopenid=760600C4A679918F744E451309505093; pgv_pvid=8349931854; ts_uid=6290747413; csrfToken=csrf-1762332595742; RK=Uzc0x4dqNb; ptcz=2591e4eba9b0c5b26022c8287c6f2ff19d73a74f076d9fd0d7359e84ac050d72; omaccesstoken=001c2429d7ba391d431d7e8e6b303dddf9afe2c259d3a97dbd8d7ada19b7c0a73b053dda688201622472bed53255b4ba2a6b82230286248949a846fc19417851baee; omtoken=001c2429d7ba391d431d7e8e6b303dddf9afe2c259d3a97dbd8d7ada19b7c0a73b053dda688201622472bed53255b4ba2a6b82230286248949a846fc19417851baee; srcaccessToken=34E50E3F858AE2E0614712C66DC500C5; pgv_info=ssid=s9556320299; _qpsvr_localtk=0.7903532378448714';
    const result = await DataService.SyncDataService.getAccountData(Platforms.QiEHao, cookie, '', undefined);
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取企鹅-文章数据总览', async () => {
    const cookie =
      'pgv_info=ssid=s9965792037; ts_last=om.qq.com/userAuth/index; pgv_pvid=5515919120; ts_uid=3989126633; csrfToken=csrf-1749436280543; _qpsvr_localtk=0.5195439789056651; RK=vyd006drY5; ptcz=ba9278b28a62f1ac8bd5ca48e7d9619f3b846079d75d7bbf47e9e94f99513a37; userid=24272470; omaccesstoken=00c94bc1c8cf1686ba3c0ea77729752ed23c179fe07b7deeb7c34ed253d352176692412408d41af42837f9dfdd56d7772fd53804cc6c469466fb64adcfd5d6e02dah; omtoken=00c94bc1c8cf1686ba3c0ea77729752ed23c179fe07b7deeb7c34ed253d352176692412408d41af42837f9dfdd56d7772fd53804cc6c469466fb64adcfd5d6e02dah; logintype=3; srcopenid=760600C4A679918F744E451309505093; srcaccessToken=63015A7E47DC66DF8BE42699C962AB1E';
    const result = await DataService.getAccountReport(Platforms.QiEHao, cookie, 'article');
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取搜狐号数据总览', async () => {
    const cookie =
      'SUV=1767751424940ut2rtg; clt=1767751424; cld=20260107100344; reqtype=pc; gidinf=x099980109ee1be0696f6c82d000474116c0cd46592b; _dfp=HY/je2caOJNxLwrwUgu6hbFOFF7TXnGQXtDNA4e9yVs=; jv=8d90335851c4eb618b79f1517922a80a-2Me3yMJ11767751467468; ppinf=2|1767751467|1768961067|bG9naW5pZDowOnx1c2VyaWQ6Mjg6MTUwNDY0NjM4MDMwNjg0MTYwMEBzb2h1LmNvbXxzZXJ2aWNldXNlOjMwOjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMHxjcnQ6MTA6MjAyNi0wMS0wN3xlbXQ6MTowfGFwcGlkOjY6MTEzODA1fHBsYXQ6Mzpwd2R8dHJ1c3Q6MToxfHBhcnRuZXJpZDoxOjB8cmVsYXRpb246MDp8dXVpZDoxNjpzYTBkOTBjNWVkY2ZiZDgzfHVpZDoxNjpzYTBkOTBjNWVkY2ZiZDgzfHVuaXFuYW1lOjA6fA; pprdig=awvXgoQAe1n3EgWqWEoQf9z_JRbabcwlWqbhIev2MInxRIPOPKJwrGHyxPuZuS06MH8E7ohqQCUs3BMNaZB7Nr2XW-q05w8GO3v-2MJpQV-SqVj-AJVZ3Oy51LZRxPMbT8WssoSOai3Gw5CJygrTp1yQTyb6UzE6Vk-VKpOcmXY; ppmdig=17677514670000003a2031d54731912248cc417b90133d16; mp-cv=100-1767751471288-4edfaaf305884204ac851ac6d5ccbf5e; t=1767751502885';
    const result = await DataService.getAccountReport(Platforms.SouHuHao, cookie);
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
  test('获取一点号数据总览', async () => {
    const cookie =
      'DID=node4280117078ca7226; login-label=2107053591; BUILD_VERSION=B3mChobtax1754295402818; JSESSIONID=302279b267f4e1f8e91c8e2e4c9f1d0f6defe322e3a799f65fe91f378cde4c29';
    const result = await DataService.SyncDataService.getAccountData(Platforms.YiDianHao, cookie, '', undefined);
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
  test('获取大鱼号数据总览', async () => {
    const cookie =
      'cna=12eIIWx4kiICASSFEi+qxB9t; _UP_A4A_11_=wb9ce12cd599442e86d0667b7a1b8fed; _UP_D_=pc; _UP_30C_6A_=st9ce6201315n49wum9zawpgzsqetryz; _UP_TS_=sg16a1a1c7444e0d51bf2b24bade5c31774; _UP_E37_B7_=sg16a1a1c7444e0d51bf2b24bade5c31774; _UP_TG_=st9ce6201315n49wum9zawpgzsqetryz; _UP_335_2B_=1; xlly_s=1; _UP_F7E_8D_=hpVDhcJbVA0fO66JWpCrWEsem8D%2BGJzLUdRO7YsGUI%2BibipNZ4wWoKA3nkVDHeUjK77U6xYgqMbXDik4ZZxmO%2B6jibaMeh%2F15GPrrCl5M87ivs0EP%2FjAQTQimMgEdat62Byd22%2BZGM5U7nmz3gAv9U1Ea%2Fy7%2B8byvOTidzNw8s%2FWtKAIxWbnCzZn4%2FJMBUub0OScUYeEhusT3lIXsH8ykRzAeiGo5GedeU0zHn2%2B3FbU1Ma8ezJKcRU4wR0Pq7NklczEGdRq2nIAcu7v22Uw2o%2FxMY0xBdeC9Korm5%2FNHnxl6K%2Bd6FXSoT9a3XIMQO359auZPiZWzrNlZe%2BqnOahXcx7KAhQIRqSvjbedmJdViOx%2FgYBqTnLfzoXy7vJAVuH%2FRDtEJJ8rZTq0BdC23Bz%2B0MrsdgbK%2BiW; USER_TMP=kLqEpB7dvQJNawGMbNkNDA._JF_emgR4_We_V6duNP7eHTbbEJ5HJK-KTh7RkomVV3sNYd10QWvhvC6sElirCZQU2frgVluSuXRpfewO1yZxFGAHPbePubl-iH2oLAx9in-55Su_FmDDYVktdM0r0Ngzkc9PYYgqNB8f528tQuNjt9NdnSe6i_xsKH8IxIIo1il26AuqCHd65-SK2Rjh2j8FVTfQBLjLvK2dRHj_6qZ0W9pQqHVCzplmlbizmquZBSEX7alzuZ0UePJUCXyrJOczx_A2Zdb4l3S5XcgqQYE3geIUO70g5Z-3SQhbzjRTKIvXVkIYm5rPwRokacI-rCN3Cy9uYhytexWZD6bkyTNDxubf4PlXnnUpaQM72bUWYbSqZLDA0zwDb0yE6leJsqA7RXCBxEg016VCVgFsfAGQLmwoMHoKxRjuoUzIkeERa32k9-6zyKNkKZqmXLGoE_jUIlk5fAGx680M1NZhaH0IYor-TTEd1AxYdPwojFsYF60vs7w1PlqNJqk5uRIeam504KSNtLNvn9Q2ludOWJmnFcgov04f94XC6DJL9ngCbYODClcrmREp5FfvzVuGK7L_XAk5XWQII6GS6MSplu3E5f35LAPvbt9oGSFMloc8i2Mz0ZNxFtvwDNedX1ZPNkqOO09gSjtlnvn8JxjfLnZoIO_7-dws7Z4wLZrR8mHUiLGhpYFBOe7fa40krAbLA04zpejobDz1X5w-x8zHTJNQdpmdagCRxtjo73BLjNkmKWHjoYvnDUBxVMcCwky5j1bm0DndHQHrTV0o2B56x91NFyQdhvUx7ZoGz6u_160bRH3unsSTUrsqiAMXgkE30WtEsUJuZyAXdtH7OwRuwgIQV78k-sT84tHWy06s4ALwpIiC5TlzsNFYNLLOaJ9wR0ARfAm_d5vqYvM7HiKPQOnNfStnb--rpZznvxPyxXduWxlwJTkrp6zV7d4U-cf5z1h337it-JXgDr2C1Nn4Vvz3rIfWx9CXspPqeyv5Rnhq7IFuf8BE1OIrvClFp_R4RuLx0EnSMrQ0MhLNC7UtkxdN88N4U6HDOo6RtwR25aXhmqZqpDHymHm2wlWNTw28xIjXxwGUqguUlHnUV2BXoFTgqREQwafIGdJ1uFAO0HgIN3SLWZspOehnw1dIACmkxBWsmEcSpvSrjaM8rY7pJbmw5dDGVZJX2jjDaMMBTR9SaI.1762397488466.604800000.JZgJTl9epwUbHbWGXrxwiMNefp562YW3IyAEdW2jRp4; isg=BFJSCY96b-G1vpMQNcGWGKu8oxg0Y1b9KfPEmByqYoXwL_MpBPYIDTNdmYsTRM6V; tfstk=gnDqBwjh4Kp4Dv7Wh4eNYZUwWGwYBR8InAa_jcmgcr4mcRGzbViVG5YYhAurJVWj5CebQ50LymN6WnIGDYuFCtTvMcXaCRYBRp9IDseTIeGJtZAzklnuS3N0BF9CZRYBRL9IDmeTImwZ0j9rqzEajOXmSgvuyl70jV40ZaqUvR4iSVxrqzHWD53gI3ouyl2gSV2M40c47ADVUrPDVzE2-uc40SznmzmjcYqVRym0zOXMfoPDVm4PIOD-s5l6KrAdVPebkmqqWpBYn5lih8DDrd2n94katJR6DSmZaVejEhf0-jgb1xFPosqU3rPnn79eq0FiaYyjnFCKV0z0T8GWwEN_3qlLJSAJyVozlVD4ZZ875XiSn7uHPTuT_fDbExYkLgSfWu0RUAhVS1P02uzB43osJB9CtrnG11CTZ3EzRH-F61F02uzBYH5O67084yteY';
    const result = await DataService.SyncDataService.getAccountData(Platforms.DaYuHao, cookie, '', undefined);
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取网易-数据总览', async () => {
    const cookie =
      'P_INFO=18874070066|1761212863|1|subscribe|00&99|hun&1761200286&subscribe#CN&null#10#0#0|&0||18874070066; _antanalysis_s_id=1761212822508; NTES_YD_SESS=KrLsDZrtKm2Nh4e8oQPKFcvpcLcCxbI3UZ.AtVg2t6JcUGQvUZBPoCIbJ2Ss8yj3HzP7N.8cXKWgqruuMHExAp1oK3Ui.YdjPMQjk2mg3d7CuYr0f4HjaEOCKn7u5xHn0ecKKwggl32BCKAuZr8mj0F4DeEbPA7t4DmSyM3nfKpVq2NA13FU6imKmoK9wueoO6Mix69_RmYuOkgESVXTTgGjBZDjC3_2LD.5G2A3QYrRj; S_INFO=1761212863|0|0&60##|18874070066; _ntes_origin_from=; _ntes_nuid=8d7f2d743035a3fc10a0ff221926ddf7; NTESwebSI=CC9AB695CC1621FA0B4A21124F365CBB';
    const result = await DataService.SyncDataService.getAccountData(Platforms.WangYiHao, cookie, '', undefined);
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});

describe.runIf(true)('【获取账号7天作品数据】', () => {
  test('微信公众号作品数据', async () => {
    const cookie =
      'mm_lang=zh_CN; rewardsn=; wxtokenkey=777; ua_id=AMMjRaPjvzaHBk9gAAAAAEMlsIcQeGYR5TuxQdH9N9c=; wxuin=84707557990843; uuid=ad6b31ea89dcd4750953564b7ac053e0; rand_info=CAESIPC1iDvVOwLFgtjrPdGTHrjyZOaEzUjy5a3RdLhxAI9F; slave_bizuin=3896246758; data_bizuin=3896246758; bizuin=3896246758; data_ticket=8TStZyyWc1Bsl5IabHUSYiwnlpOgnww696NXog2U+nHXUqNwQjZPpBC5JIweYq2q; slave_sid=MHU2YldSS2JNdTZ4Mk9kMDNPbEcyT0dOdHNPTTdjczZteldHRGVZa2RsNjVaQnBvWDhyOEFSM0ZHX19KSzRla3NDSkVUaGZTWG5rMk5SYnYxT21jVzVsTHRaa1BxU0FMb3hKYXRzOHN0RDhZZjVudlVyQkVoYWdoQ09sR1ZvVmI5VUo3a1k4YmpTVWc0WUY4; slave_user=gh_b23b8049adbb; xid=bdb03af2f23a8057440cc4af2fe45be9; _clck=3896246758|1|g7z|0; _clsk=11c9abl|1784804676208|1|1|mp.weixin.qq.com/weheat-agent/payload/record';
    const result = await DataService.SyncDataService.getAccountContentData(
      Platforms.WeiXinGongZhongHao,
      cookie,
      '',
      undefined,
      3000,
      100,
    );
    // assets
    console.log(`数量${result.contentStatisticsData}`);
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取腾讯微视作品数据', async () => {
    const cookie =
      'RK=0bdcVEgK6I; ptcz=126c5fda158762634e3327fc6748b1bf82920b2da993dc0c986b181d3545fb35; sThrAppid=1101083114; iAuthType=1; openid=CFBCB2B8CA2D2C12C5B5C9B275366B05; sSessionKey=6F1C87F026380634776D5D9A38F07C55; person_id=1524573372375732; pvid=3811624250';
    const result = await DataService.getAccountContentList(
      Platforms.TengXunWeiShi,
      false,
      cookie,
      'all',
      undefined,
      1000,
      30,
    );
    // assets
    console.log(`数量${result.data?.length}`);
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
  test('获取爱奇艺作品数据', async () => {
    const cookie =
      'QC006=g040uq1xybl1n9wbtm1hop0j; P00004=.1747052080.673868b73b; P00001=9dglyvbZXRrjIe3R3Z6pxM77Cy6ym1XR8nt2svVYZu4EYgjexisUCTheMYtHdjlLpOi94; P00007=9dglyvbZXRrjIe3R3Z6pxM77Cy6ym1XR8nt2svVYZu4EYgjexisUCTheMYtHdjlLpOi94; P00003=5779306756299776; P00010=5779306756299776; P01010=1747065600; P00PRU=5779306756299776; P00002=%7B%22uid%22%3A%225779306756299776%22%2C%22pru%22%3A5779306756299776%2C%22user_name%22%3A%22151****7128%22%2C%22nickname%22%3A%22%5Cu74dc%5Cu5b50%5Cu7231%5Cu6d4b%5Cu8bd5%22%2C%22pnickname%22%3A%22%5Cu74dc%5Cu5b50%5Cu7231%5Cu6d4b%5Cu8bd5%22%2C%22type%22%3A11%2C%22email%22%3Anull%7D; QC160=%7B%22type%22%3A3%2C%22conformLoginType%22%3A0%7D';
    const result = await DataService.getAccountContentList(Platforms.AiQiYi, false, cookie, 'all', undefined, 20, 100);
    // assets
    console.log(`数量${result.data?.length}`);
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
  test('获取网易号作品数据', async () => {
    const cookie =
      '_ntes_origin_from=; _ntes_nuid=b32f306d2f83fec12fe3ee8e1971e9f8; _antanalysis_s_id=1739157221760; ntes_utid=tid._.Lf1g%252FvbOxn1BAlVVQBfDZf46vfVAHW4u._.0; NTES_CMT_USER_INFO=259919543%7C%E8%81%AA%E6%98%8E%E7%9A%84%E4%BF%AE%E9%9A%90%E5%B0%8F%E6%98%93%7Chttp%3A%2F%2Fdingyue.ws.126.net%2F2023%2F0822%2Fe163703ej00rzrth40004d0004g004gp.jpg%7Cfalse%7CeWQuNjkyYTM1N2U0YzFhNGI1ZjhAMTYzLmNvbQ%3D%3D; NTES_P_UTID=B2HzVQePKRinUEB1TPtZKDNsTEDZHIKl|1747726916; NTES_YD_SESS=VurgT0zyhAaHtRRWVrJVh_dyagW.ErditYOfBVv2upH0zSAkzfcxNLRTvDBYXGW5tIx8myX0PVqM72__dtg.oQsNV5zEy41WxdAWZD3M518o9WYGgdgWe9Zw2PwBc3sK.yDY50LCklclafPjvEds0c47Bkzto6PG3TE0zO0R3e.ZbC4urbuy66VZu.WRbDEwxRXmxpIeKOjTcz09RGRBg30Y.rNlmDbzz8aMTFzdNT6jW; S_INFO=1747726931|0|0&60##|18874070066; P_INFO=18874070066|1747726931|1|subscribe|00&99|hun&1745720370&subscribe#hun&430100#10#0#0|&0||18874070066; NTESwebSI=6E44CB21F2FBF801BAD56158CA304A9C; NTESwebSI=6E44CB21F2FBF801BAD56158CA304A9C';
    const result = await DataService.getAccountContentList(
      Platforms.WangYiHao,
      false,
      cookie,
      'all',
      undefined,
      20,
      100,
    );
    // assets
    console.log(`数量${result.data?.length}`);
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取抖音作品数据', async () => {
    const eventcall = new EventEmitter();
    eventcall.on('content_back', (data) => {
      console.log('收到数据', JSON.stringify(data, null, 2));
    });
    const cookie =
      'bd_ticket_guard_client_web_domain=2; n_mh=byxiM_ijziWB3z1vxKWCSaKcFO34y7VfFxcGQaNi6g4; is_staff_user=false; store-region=cn-sc; store-region-src=uid; _bd_ticket_crypt_doamin=2; __security_server_data_status=1; passport_csrf_token=eb2f365ca6c67eb601c99335b8d57248; passport_csrf_token_default=eb2f365ca6c67eb601c99335b8d57248; gfkadpd=2906,33638; _tea_utm_cache_2906=undefined; _tea_utm_cache_1128=undefined; gd_random=eyJtYXRjaCI6dHJ1ZSwicGVyY2VudCI6MC40MzYxODMyOTUwNjcyNDA4NX0=.YvOsSDxRJLzeNLfSqZSklDJZ6HoTckHSf5gbqqQy/ZA=; gfkadpd=2906,33638; x-web-secsdk-uid=b9340df5-8ede-42a1-9fad-fdfb08dcf95e; csrf_session_id=d053301b784f408c54e59aa2321c8774; csrf_session_id=d053301b784f408c54e59aa2321c8774; sdk_source_info=7e276470716a68645a606960273f276364697660272927676c715a6d6069756077273f276364697660272927666d776a68605a607d71606b766c6a6b5a7666776c7571273f275e58272927666a6b766a69605a696c6061273f27636469766027292762696a6764695a7364776c6467696076273f275e5827292771273f27333d3630303d363537343332342778; bit_env=-Jzzu3Fi-sn_6mXZLHswPT52rQDxXhOjWpAeO_a1fcboO8K4YrnYu0RublN61plF3DMr5h4fJ8s2M87gwvwq4WOJod_YQsLP9cAX4nvjU9vcCLWN5AIupF5JopV8IZ8bSS3Xy4BIkvnU_ZddVjk4W0v0jIM9mB7PpnqfkSmiyPDKNuLB9GCftMp1dEzi-BvMW6LAeiNBe0WDuf7FZ7zor7QkuRS6fghhMiht7OhUmCatx5pJmO3KzJez9Y_eYo4hn-GiICVV19rZnq_6tSw3vs5BjIXAtUL6SmHEumdmDgEnYUELbrIjE9jiMK6UMADCH0Jt-80r72nuweROrep34k0iI1UWNpChCKEs0iHK8JaPMbFI2AkQXQGbbi1xGi6YeiTCpxUBpnaoxXuZ4xhnSkDG3RC-dGcNep_6MKDddS3Z1zpWn_DtQrNDbxCKCaFLv3AjeFQyWQBAoKYEox3uxYJwZ4Ex8JA-rCZFH_odMO5C8pF0qwyUfIM_p52D68iYx5S6ZB0-5JthwWCCCCQ3ytGZll7X3RUJpqTub5Dg9zI%3D; gulu_source_res=eyJwX2luIjoiNThkYTc5OGM0MmRjZGQzNmQzNmFkYTA0MzhjZDNkZmZiMDM1ODdmNmEwZDg5NzkyNDFmZDcyN2QxYTViODkwYSJ9; passport_auth_mix_state=ejiguxkm4x75k6tn3imns2pr12du1nc658k2gyqbwg4ie0s9; passport_fe_beating_status=false; biz_trace_id=d4909f8c; odin_tt=22e8ac16047150f5e828d9c7f59bb942261be32f41fd44ab92aadc09ff7a3432a440fd75f0e17ee7f75fa6b9776560e2; passport_assist_user=CjxkPfiaNqa7nbf4fjQ22LIKUFsfW6Za2rpOzYQC-ezuc4d0HfICow9l7QUwDvc9fA1STkRJsLnbrJbRwOgaSgo8AAAAAAAAAAAAAE-gWAwWD7CJHw7AfCwlTvJIvAKYPiNiC-ZoZFPcvp2bfcVoucJamA-zVit1NhYBzSc2EKTL_w0Yia_WVCABIgEDbhc0jA%3D%3D; sid_guard=61983d5baddc4efc7a7225a76032ad56%7C1761203875%7C5184000%7CMon%2C+22-Dec-2025+07%3A17%3A55+GMT; uid_tt=6c7ace5140a03e90275184dc235073a3; uid_tt_ss=6c7ace5140a03e90275184dc235073a3; sid_tt=61983d5baddc4efc7a7225a76032ad56; sessionid=61983d5baddc4efc7a7225a76032ad56; sessionid_ss=61983d5baddc4efc7a7225a76032ad56; session_tlb_tag=sttt%7C14%7CYZg9W63cTvx6ciWnYDKtVv_________4ysUmU2qaexSMnCKZCxMjiQFf_PU0MAYv0MALICN7Iq4%3D; sid_ucp_v1=1.0.0-KGQxNGI2MjhhMzg3NWRhNGRkNTEyNTI0NGFhNmRjNThjYjgyMDFiOTAKHwjUlrWVoAIQo63nxwYY2hYgDDCJ4uPQBTgHQPQHSAQaAmhsIiA2MTk4M2Q1YmFkZGM0ZWZjN2E3MjI1YTc2MDMyYWQ1Ng; ssid_ucp_v1=1.0.0-KGQxNGI2MjhhMzg3NWRhNGRkNTEyNTI0NGFhNmRjNThjYjgyMDFiOTAKHwjUlrWVoAIQo63nxwYY2hYgDDCJ4uPQBTgHQPQHSAQaAmhsIiA2MTk4M2Q1YmFkZGM0ZWZjN2E3MjI1YTc2MDMyYWQ1Ng; _bd_ticket_crypt_cookie=7aeaabadeb76f00c13f3a9cdeb7cc571; __security_mc_1_s_sdk_sign_data_key_web_protect=f428004f-4095-9778; __security_mc_1_s_sdk_cert_key=cc1114ba-4624-8aea; __security_mc_1_s_sdk_crypt_sdk=126aadf3-4e42-9e3b; gd_random=eyJtYXRjaCI6dHJ1ZSwicGVyY2VudCI6MC40MzYxODMyOTUwNjcyNDA4NX0=.YvOsSDxRJLzeNLfSqZSklDJZ6HoTckHSf5gbqqQy/ZA=; ttwid=1%7COUngAMEsv4bd2Hq0mD5k4F9t2IIrGDiSk0z_JhU-Coo%7C1761203876%7C93020faca5659981f2e619683868c41f0ab02418c9fa0e04ddb97e793941222b; bd_ticket_guard_client_data=eyJiZC10aWNrZXQtZ3VhcmQtdmVyc2lvbiI6MiwiYmQtdGlja2V0LWd1YXJkLWl0ZXJhdGlvbi12ZXJzaW9uIjoxLCJiZC10aWNrZXQtZ3VhcmQtcmVlLXB1YmxpYy1rZXkiOiJCTDVHQUZqRDZjWVp3aUtSNytQdHdZOVVrS3RlQjdLd25pb1lrOTd3bXVUQllPT1ZIdVVIVEcxKzlETk1ZNXAxRTN4Z3ZTek8yTnp4T3hBMnBtUkJvaXc9IiwiYmQtdGlja2V0LWd1YXJkLXdlYi12ZXJzaW9uIjoyfQ%3D%3D; bd_ticket_guard_client_data_v2=eyJyZWVfcHVibGljX2tleSI6IkJMNUdBRmpENmNZWndpS1I3K1B0d1k5VWtLdGVCN0t3bmlvWWs5N3dtdVRCWU9PVkh1VUhURzErOUROTVk1cDFFM3hndlN6TzJOenhPeEEycG1SQm9pdz0iLCJ0c19zaWduIjoidHMuMi40ODE5YjgwYWU2NjcyMTViYTYyNDFmZjVjNjU1YTJiNTBmODFiNzQ5ZmVlYmUxNDc2ZWNkZjlmOGY3YmM2ZjQyYzRmYmU4N2QyMzE5Y2YwNTMxODYyNGNlZGExNDkxMWNhNDA2ZGVkYmViZWRkYjJlMzBmY2U4ZDRmYTAyNTc1ZCIsInJlcV9jb250ZW50Ijoic2VjX3RzIiwicmVxX3NpZ24iOiJHdmRlUmVaZGlDWlZNVHhxendYN3BGYlVBYWRldW1jcjl6Mm1JSmxVMUpzPSIsInNlY190cyI6IiMyam5zRU96ZnltcFlybjFnMllZRC9xKzBaSFlVSE1CMlJRTXVQVGIxbzc3ZTJRb1NZYVU4Y1UrbEFoMXkifQ%3D%3D';
    const result = await DataService.getAccountContentList(Platforms.DouYin, false, cookie, 'all', eventcall, 90);
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取快手作品数据', async () => {
    const cookie =
      '_did=web_112785823F8C1056; kwfv1=PnGU+9+Y8008S+nH0U+0mjPf8fP08f+98f+nLlwnrIP9P9G98YPf8jPBQSweS0+nr9G0mD8B+fP/L98/qlPe4f8BrAP/pDwePI8frlG0W9weqFGncMP9LhG0PU+eW78eLh+/cU8B+DP/ZM+/pfP/ZFw/DM+eb0GnLh+BbD+AWlwBL=; did=web_8a3b5b9213dc76654365472e2b95dad6ce63; bUserId=1000438835707; userId=1695906108; kuaishou.web.cp.api_st=ChZrdWFpc2hvdS53ZWIuY3AuYXBpLnN0ErAB8LNnbIF-OrtwbHIrMWpI3KtrjtLzd6-74Ho5UEEL5Meq-_sDzf_jA99lHH6LNPSsa73s4WzonP_9o1jvGe6PtFjVMbcP8wgtuCBuw1gvHD54i2qUfvVcLebebs9uGqUSdzXHpwufPC03A_2R6WbphQh3oNuWES-gZFzLREI1VjLKWxkswCjaSDLhXf8xDjRDW5VqjDPAaDGjRPd3X1AsfOhtVoR2qndv4595G0Ggx-8aEigiXAXbikfxY_eaMpqy56wmIiIgLdf2ZSW1ZcODfWW0J20pRMA4D4GU2jHzciDDyT494ksoBTAB; kuaishou.web.cp.api_ph=0a67b460a569166aaf644ba0c51f0660bc92';
    const result = await DataService.getAccountContentList(Platforms.KuaiShou, false, cookie, 'all', undefined, 7);
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取视频号-视频作品数据', async () => {
    const cookie =
      convertCookieStr('[{"name":"sessionid","value":"BgAA1bcnyfItjXC9%2BV0enNkJ4%2FDtPi1YM%2B5273DGtB9vQtzCiBk9cP9tp%2BAe2VP3p7lOj9wI5tz9MwbWhCBP%2F%2B0wYyqGQgsn6Q8wNDinqIgK","domain":"channels.weixin.qq.com","hostOnly":true,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1822285043.987921,"sameSite":"no_restriction"},{"name":"wxuin","value":"2813985289","domain":"channels.weixin.qq.com","hostOnly":true,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1822285043.988033,"sameSite":"no_restriction"}]');
    const result = await DataService.getAccountContentList(
      Platforms.ShiPinHao,
      false,
      cookie,
      'video',
      undefined,
      1000,
      200,
    );
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取视频号-图文作品数据', async () => {
    const cookie =
      'sessionid=BgAABst5E25PA0rroCR5dnSb2Rdl6j2k0%2BsOw4T%2Ftef98uwoNzYSzZQkh2%2FrfRDVPX6WsMZZej2Hqm69sXaM%2B6VF5Yw7mXeYAabK6az1GNdZ; wxuin=1884663739; sessionid=BgAABst5E25PA0rroCR5dnSb2Rdl6j2k0%2BsOw4T%2Ftef98uwoNzYSzZQkh2%2FrfRDVPX6WsMZZej2Hqm69sXaM%2B6VF5Yw7mXeYAabK6az1GNdZ; wxuin=1884663739; authorId=v2_060000231003b20faec8cae28e19c7dcce00ea32b0772576bf3a50931c4c14362e31bb701fd5@finder';
    const result = await DataService.getAccountContentList(
      Platforms.ShiPinHao,
      false,
      cookie,
      'dynamic',
      undefined,
      10000,
      10000,
    );
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取B站-视频作品数据', async () => {
    const cookie =
      'buvid3=733220E6-32FE-A789-6EA3-FC3C5BA4296646924infoc; b_nut=1761117446; buvid_fp=6f2e0bc0aba5e2108d76ff30c7a8a006; SESSDATA=5d776f41%2C1776669499%2C0a716%2Aa1CjDrADIo6htHHXczYYXiswYb6C7ek5xt4WXwzI5oyjOKaNlGkq1uZc-yz2Q2c-DCfU8SVkNaaUswcXZXLW03bWl5R0FBT3NQZWEyN2U1amJSbkEtYXBnWGNWUzd0WTNyMXNYQmFwNi0xWUZOZF9NbW16Z0N1ZUpjb211S0dFSWxWT2JNVDRYdUZRIIEC; bili_jct=ea53397df4f2b23ad6f8e1d370a9f7db; DedeUserID=631896225; DedeUserID__ckMd5=d5c0d89442163ca9; sid=n20jbm3q; _uuid=FFED16110-29510-E239-81DB-EB3EC6CCF102E01373infoc; enable_web_push=DISABLE; home_feed_column=4; browser_resolution=1254-720; theme-tip-show=SHOWED; buvid4=0910ED43-7E18-812F-BF6B-ECE85FBC49A447633-025102215-1Sl5MUBOW+w5lKHzG9WJMw%3D%3D; bili_ticket=eyJhbGciOiJIUzI1NiIsImtpZCI6InMwMyIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjEzNzY3MDEsImlhdCI6MTc2MTExNzQ0MSwicGx0IjotMX0.7oQB3xaZbNYL48Z7_vykmD1nZzxirMm4Cplnm9f7k2o; bili_ticket_expires=1761376641; b_lsid=97582E29_19A1027F3AC';
    const result = await DataService.getAccountContentList(
      Platforms.BiLiBiLi,
      false,
      cookie,
      'video',
      undefined,
      60,
      20,
    );
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取B站-文章作品数据', async () => {
    const cookie =
      'buvid3=733220E6-32FE-A789-6EA3-FC3C5BA4296646924infoc; b_nut=1761117446; buvid_fp=6f2e0bc0aba5e2108d76ff30c7a8a006; SESSDATA=5d776f41%2C1776669499%2C0a716%2Aa1CjDrADIo6htHHXczYYXiswYb6C7ek5xt4WXwzI5oyjOKaNlGkq1uZc-yz2Q2c-DCfU8SVkNaaUswcXZXLW03bWl5R0FBT3NQZWEyN2U1amJSbkEtYXBnWGNWUzd0WTNyMXNYQmFwNi0xWUZOZF9NbW16Z0N1ZUpjb211S0dFSWxWT2JNVDRYdUZRIIEC; bili_jct=ea53397df4f2b23ad6f8e1d370a9f7db; DedeUserID=631896225; DedeUserID__ckMd5=d5c0d89442163ca9; sid=n20jbm3q; _uuid=FFED16110-29510-E239-81DB-EB3EC6CCF102E01373infoc; enable_web_push=DISABLE; home_feed_column=4; browser_resolution=1254-720; theme-tip-show=SHOWED; buvid4=0910ED43-7E18-812F-BF6B-ECE85FBC49A447633-025102215-1Sl5MUBOW+w5lKHzG9WJMw%3D%3D; bili_ticket=eyJhbGciOiJIUzI1NiIsImtpZCI6InMwMyIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjEzNzY3MDEsImlhdCI6MTc2MTExNzQ0MSwicGx0IjotMX0.7oQB3xaZbNYL48Z7_vykmD1nZzxirMm4Cplnm9f7k2o; bili_ticket_expires=1761376641; b_lsid=97582E29_19A1027F3AC';
    const result = await DataService.getAccountContentList(
      Platforms.BiLiBiLi,
      false,
      cookie,
      'article',
      undefined,
      60,
      20,
    );
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取小红书作品数据', async () => {
    const cookie =
      'x-user-id-creator.xiaohongshu.com=5b7b6eb42352610001dcd389; gid=yjJ8dfqWDy8SyjJ8dfqWyDjEyS3W14CfACvYfhTUAFxvS828Eyy6qu888qKW42y88y8yWqy4; customerClientId=552074963824658; abRequestId=841896570d55aa0b6bf12e6426212fc0; a1=1998f0afb951ex31o2zudmwr5o9npzcyk3ij59z5v50000260591; webId=c41126e1cbbb3fcfd91acb0c10db88af; web_session=0400697b5fc526e683df7c5bd23a4bbcb07419; xsecappid=ugc; access-token-creator.xiaohongshu.com=customer.creator.AT-68c517559031493529944076cflku4enpicph1tx; galaxy_creator_session_id=rmgCERY9F9YFfgqjjPX5xTCCaze7mulvyToc; galaxy.creator.beaker.session.id=1759974168399062032387; webBuild=4.81.0; unread={%22ub%22:%226427d6fe0000000013032208%22%2C%22ue%22:%22643b85a30000000012033a85%22%2C%22uc%22:25}; loadts=1761206754076; acw_tc=0ad5277e17612067544517913e1fa538dbee9e4ce5188b251e58e770de2c9e; websectiga=6169c1e84f393779a5f7de7303038f3b47a78e47be716e7bec57ccce17d45f99; sec_poison_id=c49b03a8-05c0-4beb-9be8-f45b7ba67f3c';
    const result = await DataService.getAccountContentList(
      Platforms.XiaoHongShu,
      false,
      cookie,
      'all',
      undefined,
      7,
      20,
    );
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取百家号-视频作品数据', async () => {
    const cookie =
      '[{"name":"XFI","value":"7e0c33b0-b3a5-11f0-97cc-91becc217fbe","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/theme/bjh","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"XFCS","value":"4F988A434B3D0C6329A614A88246E268B4A6217AEE936C724BF81FD83C592EDD","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/theme/bjh","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"XFT","value":"37pTZ4rmLDoQ4OoQUFyU2izez+74sar8v8o9/g0mndM=","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/theme/bjh","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"RECENT_LOGIN","value":"0","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/rc","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"XFI","value":"8cbc1ec0-b3a5-11f0-b410-e52d7e782a2f","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/rc","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"XFT","value":"PrrRbY5vCxZUxb30gre/TBUsP70c63B5mttAt7kYfeA=","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/rc","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"XFCS","value":"D4B2A2C5C92638DF584449A7D7B9F3DD7F593A30BC5EF3CEC156DE1372D5DE19","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/rc","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"BAIDUID","value":"5FE81CF7AFAA4783749CF893D2C8EE19:FG=1","domain":".baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1793154376.977651,"sameSite":"unspecified"},{"name":"BAIDUID_BFESS","value":"5FE81CF7AFAA4783749CF893D2C8EE19:FG=1","domain":".baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1793154376.977769,"sameSite":"no_restriction"},{"name":"PHPSESSID","value":"cujr9v246l005396bbh2njv395","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"theme","value":"bjh","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1793154377,"sameSite":"unspecified"},{"name":"XFS","value":"Nd%2FwPhcs0OR8p3CxPn%2FFR5mfrr9fA5U%2BJIs8eeNc1q4%3D","domain":"xlab.baidu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"ppfuid","value":"FOCoIC3q5fKa8fgJnwzbE67EJ49BGJeplOzf+4l4EOvDuu2RXBRv6R3A1AZMa49I27C0gDDLrJyxcIIeAeEhD8JYsoLTpBiaCXhLqvzbzmvy3SeAW17tKgNq/Xx+RgOdb8TWCFe62MVrDTY6lMf2Gixx7aLvAhqvNkvAJQDmQheTJbcu/AFainBdW3mPgxdz5OfNyUCwYGCwdaCAvb4zIAXiPbbFPDQVtPAPnuC7GKo4JBM7053Q+UyCTEj7Fgd4Qjf7Fwwxu/AI7RIzfKl8vlXuSd+bz+n+1d8dX5DnU9btRp3bqUFgYeNkP3aLQT5kYjAh8A8yft+s3B4RtKRu8VzjBYc3VZO8C3FJKPf/VpOiS8DHSHR/nhAJRNzx8LHyGWhocXrPp5Y8evA8e3q50dwS4aDQAkiFo5ICsCM8PWWioTSKU4nQaaWWJj1AnjrL+sma/I9in8l5AhdP95hxKdnTNS/pLMWceus0e757/UNlp6ejKpVpYqvC5R0tHOIbAAv3LCf1Y7/fHL3PTSf9vid/u2VLX4h1nBtx8EF07eCMhWVv+2qjbPV7ZhXk3reaWRFEeso3s/Kc9n/UXtUfNU1sHiCdbrCW5yYsuSM9SPGDZsl7FhTAKw7qIu38vFZiq+DRc8Vbf7jOiN9xPe0lOdZHUhGHZ82rL5jTCsILwcRVCndrarbwmu7G154MpYiKmTXZkqV7Alo4QZzicdyMbWvwvmR2/m//YVTM8qeZWgDSHjDmtehgLWM45zARbPujeqU0T92Gmgs89l2htrSKIan9AYlRrJmspRGnWVLZGjVuXk3Cf4ihuJII/iECNwCRko9Kr1p/AdwEaV0L74IvHZdImdyxYIjA1uSy2hfTFv/d3cnXH4nh+maaicAPllDgrppZTr0lDf2Vsiy73L8egP9ck5gsaaSE4obz9V1JGvyp8lNw+IyCN2Gou0efGgcYQBug3EYJEWCj3Pc/9aTWTdkWlrrMbxT1KilviimMUmBrGRChHnhPuJeIKACPXiVuli9ItRLEkdb1mLxNHAk3uJy88YX/Rf/sKUjR12zxRTDxxJNDJS+Dlsbqu3n4I65ujli/3rQ8Zk1MjmTOsz9+kTqOM4upsnQ6IWq/zeZTItMCgHpQhuhr4ip73honuzoJhfJJqPUSX01viD97GXfw7kf+R6as3JPAEXsdOdDsWEAgJn+ZMVrELI7pXz8Jko9Xv3uSDHo/C3kmFLrauvEYpUg3FbqEqM6JmRHqkwRhSJQp2TZ695APscnHWK3k1vm0zRszeYvFyXCPSuJ5oyoOgoCPKXE8fX73WOZ0mAlF1mc=","domain":".baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"HOSUPPORT","value":"1","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1796178381.224739,"sameSite":"unspecified"},{"name":"HOSUPPORT_BFESS","value":"1","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1796178381.224825,"sameSite":"no_restriction"},{"name":"pplogid","value":"6611xAMorBCIaO8iqKzTIuBpPAWFRaiXXPfbNsHCVau9Ia4MW5rMwv5VC05hPK4q3OANc%2BGJ%2BorbDTRBCwPT9iduok8kDNO5h01Vlj%2FQeG%2FItwjkNSiHzi9zzBMPGV3g%2B9SQ","domain":"passport.baidu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1761877581.615418,"sameSite":"unspecified"},{"name":"pplogid_BFESS","value":"6611xAMorBCIaO8iqKzTIuBpPAWFRaiXXPfbNsHCVau9Ia4MW5rMwv5VC05hPK4q3OANc%2BGJ%2BorbDTRBCwPT9iduok8kDNO5h01Vlj%2FQeG%2FItwjkNSiHzi9zzBMPGV3g%2B9SQ","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1761877590.265807,"sameSite":"no_restriction"},{"name":"UBI","value":"fi_PncwhpxZ%7ETaJc6YPQmCfh-ZB2F5GHEP%7Eu2PPT222yi8Y1o-Dl7mxb06JD5pcGkUqh4OfKqfP6CyEQp0%7E","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1796178393.161635,"sameSite":"unspecified"},{"name":"UBI_BFESS","value":"fi_PncwhpxZ%7ETaJc6YPQmCfh-ZB2F5GHEP%7Eu2PPT222yi8Y1o-Dl7mxb06JD5pcGkUqh4OfKqfP6CyEQp0%7E","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1796178393.161692,"sameSite":"no_restriction"},{"name":"logTraceID","value":"fa0e344203dd4f108760ed192f81101ae464f33b1cfdb822b9","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1761704799.852529,"sameSite":"unspecified"},{"name":"STOKEN","value":"24b1a5535fd5573d10cb066193bab2e7d37fc1df4780584246667aab79598737","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1796178401.26978,"sameSite":"unspecified"},{"name":"USERNAMETYPE","value":"3","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1796178401.269859,"sameSite":"unspecified"},{"name":"SAVEUSERID","value":"bd278c320866a7b4c8d06dedb6df5f","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1796178401.269882,"sameSite":"unspecified"},{"name":"BDUSS","value":"XBubFdJVEN2U0Y0VTNtYkl1Wm1Bbjl5UlkxZnlLS3h1SlVabjA3ZDF5VGh0aWRwRVFBQUFBJCQAAAAAAAAAAAEAAAAOHD9ManhyeTAwMDIxNgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOEpAGnhKQBpM","domain":".baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1796178401.269902,"sameSite":"unspecified"},{"name":"PTOKEN","value":"2d78d0e5e061ff39664500a8bde56848","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1796178401.269943,"sameSite":"unspecified"},{"name":"HISTORY","value":"69cd43e692d345bc10cd8f8aef36a104351e54","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1796178401.270019,"sameSite":"unspecified"},{"name":"BDUSS_BFESS","value":"XBubFdJVEN2U0Y0VTNtYkl1Wm1Bbjl5UlkxZnlLS3h1SlVabjA3ZDF5VGh0aWRwRVFBQUFBJCQAAAAAAAAAAAEAAAAOHD9ManhyeTAwMDIxNgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOEpAGnhKQBpM","domain":".baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1796178401.270044,"sameSite":"no_restriction"},{"name":"STOKEN_BFESS","value":"24b1a5535fd5573d10cb066193bab2e7d37fc1df4780584246667aab79598737","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1796178401.270071,"sameSite":"no_restriction"},{"name":"USERNAMETYPE_BFESS","value":"3","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1796178401.270118,"sameSite":"no_restriction"},{"name":"SAVEUSERID_BFESS","value":"bd278c320866a7b4c8d06dedb6df5f","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1796178401.27018,"sameSite":"no_restriction"},{"name":"PTOKEN_BFESS","value":"2d78d0e5e061ff39664500a8bde56848","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1796178401.270232,"sameSite":"no_restriction"},{"name":"HISTORY_BFESS","value":"69cd43e692d345bc10cd8f8aef36a104351e54","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1796178401.270262,"sameSite":"no_restriction"},{"name":"BDUSS","value":"XBubFdJVEN2U0Y0VTNtYkl1Wm1Bbjl5UlkxZnlLS3h1SlVabjA3ZDF5VGh0aWRwRVFBQUFBJCQAAAAAAAAAAAEAAAAOHD9ManhyeTAwMDIxNgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOEpAGnhKQBpM","domain":".apollo.auto","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1764210401.436654,"sameSite":"no_restriction"},{"name":"BDUSS","value":"XBubFdJVEN2U0Y0VTNtYkl1Wm1Bbjl5UlkxZnlLS3h1SlVabjA3ZDF5VGh0aWRwRVFBQUFBJCQAAAAAAAAAAAEAAAAOHD9ManhyeTAwMDIxNgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOEpAGnhKQBpM","domain":".yoojia.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1793154401.679012,"sameSite":"no_restriction"},{"name":"RECENT_LOGIN","value":"1","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"HMACCOUNT","value":"335FE3C0372EF639","domain":".hm.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1796178402.990357,"sameSite":"unspecified"},{"name":"HMACCOUNT_BFESS","value":"335FE3C0372EF639","domain":".hm.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1796178402.990431,"sameSite":"no_restriction"},{"name":"Hm_lvt_f7b8c775c6c8b6a716a75df506fb72df","value":"1761618403","domain":".baijiahao.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1793154405,"sameSite":"unspecified"},{"name":"HMACCOUNT","value":"335FE3C0372EF639","domain":".baijiahao.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"__bid_n","value":"19a28a3a29d43686f36293","domain":".baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1796178406.612797,"sameSite":"unspecified"},{"name":"Hm_lpvt_f7b8c775c6c8b6a716a75df506fb72df","value":"1761618405","domain":".baijiahao.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"ab_jid","value":"91254fcd48e64139653329b5d4ca7aedfb39","domain":".miao.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1796178406.371337,"sameSite":"no_restriction"},{"name":"ab_bid","value":"91254fcd48e64139653329b5d4ca7aedfb39","domain":".miao.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1796178406.371439,"sameSite":"no_restriction"},{"name":"ab_sr","value":"1.0.1_MzcwNGFmNGI4MTc1NGYyMTQ4ZWVkZTU5OTVkN2I4NjU4MWQ1Y2QxNDc1ZTFlMTcwNjJjMzAzNWMyYWI0ZGU2ZWJmNGY5M2FiNmFkOTUxYTE0ZWZiM2UzZWNkMjM4OTExMDhlZjNmMjRjYzM2ZmQ0Y2I3OWZjMjY5MDA5MzlmNGI3ODlkYjM5ODQ5ZTNkMGNjNGFmZGVlNzk2MzE4MzljNTVkOTBiY2NmYzU0MmUxZGM4MjY4ODA1MTg5MWE5YjU3","domain":".baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1761625606.371477,"sameSite":"no_restriction"},{"name":"ab_jid_BFESS","value":"91254fcd48e64139653329b5d4ca7aedfb39","domain":".miao.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1796178406.371534,"sameSite":"no_restriction"},{"name":"devStoken","value":"f816238db0ba2d309e719946be003a0c35b15e47d07ea992a79d7b0ae93ac3f2","domain":".baijiahao.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1766802406.972141,"sameSite":"unspecified"},{"name":"bjhStoken","value":"5e685028ae67954c7cb73e0eb65811f235b15e47d07ea992a79d7b0ae93ac3f2","domain":".baijiahao.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1766802406.972207,"sameSite":"unspecified"},{"name":"RT","value":"\\"z=1&dm=baidu.com&si=b8225c5d-8605-4397-ac8c-bd3c82b2d6bd&ss=mh9y3ixc&sl=3&tt=81n&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf&ld=paj\\"","domain":".baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1762223209,"sameSite":"lax"}]';
    const result = await DataService.SyncDataService.getAccountContentData(
      Platforms.BaiJiaHao,
      cookie,
      '',
      undefined,
      17,
      1000,
      undefined,
    );
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取百家号-小视频作品数据', async () => {
    const cookie =
      '[{"name":"XFI","value":"7e0c33b0-b3a5-11f0-97cc-91becc217fbe","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/theme/bjh","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"XFCS","value":"4F988A434B3D0C6329A614A88246E268B4A6217AEE936C724BF81FD83C592EDD","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/theme/bjh","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"XFT","value":"37pTZ4rmLDoQ4OoQUFyU2izez+74sar8v8o9/g0mndM=","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/theme/bjh","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"RECENT_LOGIN","value":"0","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/rc","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"XFI","value":"8cbc1ec0-b3a5-11f0-b410-e52d7e782a2f","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/rc","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"XFT","value":"PrrRbY5vCxZUxb30gre/TBUsP70c63B5mttAt7kYfeA=","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/rc","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"XFCS","value":"D4B2A2C5C92638DF584449A7D7B9F3DD7F593A30BC5EF3CEC156DE1372D5DE19","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/builder/rc","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"BAIDUID","value":"5FE81CF7AFAA4783749CF893D2C8EE19:FG=1","domain":".baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1793154376.977651,"sameSite":"unspecified"},{"name":"BAIDUID_BFESS","value":"5FE81CF7AFAA4783749CF893D2C8EE19:FG=1","domain":".baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1793154376.977769,"sameSite":"no_restriction"},{"name":"PHPSESSID","value":"cujr9v246l005396bbh2njv395","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"theme","value":"bjh","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1793154377,"sameSite":"unspecified"},{"name":"XFS","value":"Nd%2FwPhcs0OR8p3CxPn%2FFR5mfrr9fA5U%2BJIs8eeNc1q4%3D","domain":"xlab.baidu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"ppfuid","value":"FOCoIC3q5fKa8fgJnwzbE67EJ49BGJeplOzf+4l4EOvDuu2RXBRv6R3A1AZMa49I27C0gDDLrJyxcIIeAeEhD8JYsoLTpBiaCXhLqvzbzmvy3SeAW17tKgNq/Xx+RgOdb8TWCFe62MVrDTY6lMf2Gixx7aLvAhqvNkvAJQDmQheTJbcu/AFainBdW3mPgxdz5OfNyUCwYGCwdaCAvb4zIAXiPbbFPDQVtPAPnuC7GKo4JBM7053Q+UyCTEj7Fgd4Qjf7Fwwxu/AI7RIzfKl8vlXuSd+bz+n+1d8dX5DnU9btRp3bqUFgYeNkP3aLQT5kYjAh8A8yft+s3B4RtKRu8VzjBYc3VZO8C3FJKPf/VpOiS8DHSHR/nhAJRNzx8LHyGWhocXrPp5Y8evA8e3q50dwS4aDQAkiFo5ICsCM8PWWioTSKU4nQaaWWJj1AnjrL+sma/I9in8l5AhdP95hxKdnTNS/pLMWceus0e757/UNlp6ejKpVpYqvC5R0tHOIbAAv3LCf1Y7/fHL3PTSf9vid/u2VLX4h1nBtx8EF07eCMhWVv+2qjbPV7ZhXk3reaWRFEeso3s/Kc9n/UXtUfNU1sHiCdbrCW5yYsuSM9SPGDZsl7FhTAKw7qIu38vFZiq+DRc8Vbf7jOiN9xPe0lOdZHUhGHZ82rL5jTCsILwcRVCndrarbwmu7G154MpYiKmTXZkqV7Alo4QZzicdyMbWvwvmR2/m//YVTM8qeZWgDSHjDmtehgLWM45zARbPujeqU0T92Gmgs89l2htrSKIan9AYlRrJmspRGnWVLZGjVuXk3Cf4ihuJII/iECNwCRko9Kr1p/AdwEaV0L74IvHZdImdyxYIjA1uSy2hfTFv/d3cnXH4nh+maaicAPllDgrppZTr0lDf2Vsiy73L8egP9ck5gsaaSE4obz9V1JGvyp8lNw+IyCN2Gou0efGgcYQBug3EYJEWCj3Pc/9aTWTdkWlrrMbxT1KilviimMUmBrGRChHnhPuJeIKACPXiVuli9ItRLEkdb1mLxNHAk3uJy88YX/Rf/sKUjR12zxRTDxxJNDJS+Dlsbqu3n4I65ujli/3rQ8Zk1MjmTOsz9+kTqOM4upsnQ6IWq/zeZTItMCgHpQhuhr4ip73honuzoJhfJJqPUSX01viD97GXfw7kf+R6as3JPAEXsdOdDsWEAgJn+ZMVrELI7pXz8Jko9Xv3uSDHo/C3kmFLrauvEYpUg3FbqEqM6JmRHqkwRhSJQp2TZ695APscnHWK3k1vm0zRszeYvFyXCPSuJ5oyoOgoCPKXE8fX73WOZ0mAlF1mc=","domain":".baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"HOSUPPORT","value":"1","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1796178381.224739,"sameSite":"unspecified"},{"name":"HOSUPPORT_BFESS","value":"1","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1796178381.224825,"sameSite":"no_restriction"},{"name":"pplogid","value":"6611xAMorBCIaO8iqKzTIuBpPAWFRaiXXPfbNsHCVau9Ia4MW5rMwv5VC05hPK4q3OANc%2BGJ%2BorbDTRBCwPT9iduok8kDNO5h01Vlj%2FQeG%2FItwjkNSiHzi9zzBMPGV3g%2B9SQ","domain":"passport.baidu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1761877581.615418,"sameSite":"unspecified"},{"name":"pplogid_BFESS","value":"6611xAMorBCIaO8iqKzTIuBpPAWFRaiXXPfbNsHCVau9Ia4MW5rMwv5VC05hPK4q3OANc%2BGJ%2BorbDTRBCwPT9iduok8kDNO5h01Vlj%2FQeG%2FItwjkNSiHzi9zzBMPGV3g%2B9SQ","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1761877590.265807,"sameSite":"no_restriction"},{"name":"UBI","value":"fi_PncwhpxZ%7ETaJc6YPQmCfh-ZB2F5GHEP%7Eu2PPT222yi8Y1o-Dl7mxb06JD5pcGkUqh4OfKqfP6CyEQp0%7E","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1796178393.161635,"sameSite":"unspecified"},{"name":"UBI_BFESS","value":"fi_PncwhpxZ%7ETaJc6YPQmCfh-ZB2F5GHEP%7Eu2PPT222yi8Y1o-Dl7mxb06JD5pcGkUqh4OfKqfP6CyEQp0%7E","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1796178393.161692,"sameSite":"no_restriction"},{"name":"logTraceID","value":"fa0e344203dd4f108760ed192f81101ae464f33b1cfdb822b9","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1761704799.852529,"sameSite":"unspecified"},{"name":"STOKEN","value":"24b1a5535fd5573d10cb066193bab2e7d37fc1df4780584246667aab79598737","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1796178401.26978,"sameSite":"unspecified"},{"name":"USERNAMETYPE","value":"3","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1796178401.269859,"sameSite":"unspecified"},{"name":"SAVEUSERID","value":"bd278c320866a7b4c8d06dedb6df5f","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1796178401.269882,"sameSite":"unspecified"},{"name":"BDUSS","value":"XBubFdJVEN2U0Y0VTNtYkl1Wm1Bbjl5UlkxZnlLS3h1SlVabjA3ZDF5VGh0aWRwRVFBQUFBJCQAAAAAAAAAAAEAAAAOHD9ManhyeTAwMDIxNgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOEpAGnhKQBpM","domain":".baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1796178401.269902,"sameSite":"unspecified"},{"name":"PTOKEN","value":"2d78d0e5e061ff39664500a8bde56848","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1796178401.269943,"sameSite":"unspecified"},{"name":"HISTORY","value":"69cd43e692d345bc10cd8f8aef36a104351e54","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1796178401.270019,"sameSite":"unspecified"},{"name":"BDUSS_BFESS","value":"XBubFdJVEN2U0Y0VTNtYkl1Wm1Bbjl5UlkxZnlLS3h1SlVabjA3ZDF5VGh0aWRwRVFBQUFBJCQAAAAAAAAAAAEAAAAOHD9ManhyeTAwMDIxNgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOEpAGnhKQBpM","domain":".baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1796178401.270044,"sameSite":"no_restriction"},{"name":"STOKEN_BFESS","value":"24b1a5535fd5573d10cb066193bab2e7d37fc1df4780584246667aab79598737","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1796178401.270071,"sameSite":"no_restriction"},{"name":"USERNAMETYPE_BFESS","value":"3","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1796178401.270118,"sameSite":"no_restriction"},{"name":"SAVEUSERID_BFESS","value":"bd278c320866a7b4c8d06dedb6df5f","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1796178401.27018,"sameSite":"no_restriction"},{"name":"PTOKEN_BFESS","value":"2d78d0e5e061ff39664500a8bde56848","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1796178401.270232,"sameSite":"no_restriction"},{"name":"HISTORY_BFESS","value":"69cd43e692d345bc10cd8f8aef36a104351e54","domain":".passport.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1796178401.270262,"sameSite":"no_restriction"},{"name":"BDUSS","value":"XBubFdJVEN2U0Y0VTNtYkl1Wm1Bbjl5UlkxZnlLS3h1SlVabjA3ZDF5VGh0aWRwRVFBQUFBJCQAAAAAAAAAAAEAAAAOHD9ManhyeTAwMDIxNgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOEpAGnhKQBpM","domain":".apollo.auto","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1764210401.436654,"sameSite":"no_restriction"},{"name":"BDUSS","value":"XBubFdJVEN2U0Y0VTNtYkl1Wm1Bbjl5UlkxZnlLS3h1SlVabjA3ZDF5VGh0aWRwRVFBQUFBJCQAAAAAAAAAAAEAAAAOHD9ManhyeTAwMDIxNgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOEpAGnhKQBpM","domain":".yoojia.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1793154401.679012,"sameSite":"no_restriction"},{"name":"RECENT_LOGIN","value":"1","domain":"baijiahao.baidu.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"HMACCOUNT","value":"335FE3C0372EF639","domain":".hm.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1796178402.990357,"sameSite":"unspecified"},{"name":"HMACCOUNT_BFESS","value":"335FE3C0372EF639","domain":".hm.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1796178402.990431,"sameSite":"no_restriction"},{"name":"Hm_lvt_f7b8c775c6c8b6a716a75df506fb72df","value":"1761618403","domain":".baijiahao.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1793154405,"sameSite":"unspecified"},{"name":"HMACCOUNT","value":"335FE3C0372EF639","domain":".baijiahao.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"__bid_n","value":"19a28a3a29d43686f36293","domain":".baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1796178406.612797,"sameSite":"unspecified"},{"name":"Hm_lpvt_f7b8c775c6c8b6a716a75df506fb72df","value":"1761618405","domain":".baijiahao.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"ab_jid","value":"91254fcd48e64139653329b5d4ca7aedfb39","domain":".miao.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1796178406.371337,"sameSite":"no_restriction"},{"name":"ab_bid","value":"91254fcd48e64139653329b5d4ca7aedfb39","domain":".miao.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1796178406.371439,"sameSite":"no_restriction"},{"name":"ab_sr","value":"1.0.1_MzcwNGFmNGI4MTc1NGYyMTQ4ZWVkZTU5OTVkN2I4NjU4MWQ1Y2QxNDc1ZTFlMTcwNjJjMzAzNWMyYWI0ZGU2ZWJmNGY5M2FiNmFkOTUxYTE0ZWZiM2UzZWNkMjM4OTExMDhlZjNmMjRjYzM2ZmQ0Y2I3OWZjMjY5MDA5MzlmNGI3ODlkYjM5ODQ5ZTNkMGNjNGFmZGVlNzk2MzE4MzljNTVkOTBiY2NmYzU0MmUxZGM4MjY4ODA1MTg5MWE5YjU3","domain":".baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1761625606.371477,"sameSite":"no_restriction"},{"name":"ab_jid_BFESS","value":"91254fcd48e64139653329b5d4ca7aedfb39","domain":".miao.baidu.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1796178406.371534,"sameSite":"no_restriction"},{"name":"devStoken","value":"f816238db0ba2d309e719946be003a0c35b15e47d07ea992a79d7b0ae93ac3f2","domain":".baijiahao.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1766802406.972141,"sameSite":"unspecified"},{"name":"bjhStoken","value":"5e685028ae67954c7cb73e0eb65811f235b15e47d07ea992a79d7b0ae93ac3f2","domain":".baijiahao.baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":true,"session":false,"expirationDate":1766802406.972207,"sameSite":"unspecified"},{"name":"RT","value":"\\"z=1&dm=baidu.com&si=b8225c5d-8605-4397-ac8c-bd3c82b2d6bd&ss=mh9y3ixc&sl=3&tt=81n&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf&ld=paj\\"","domain":".baidu.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1762223209,"sameSite":"lax"}]';
    const result = await DataService.getAccountContentList(Platforms.BaiJiaHao, true, cookie, 'miniVideo');
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取百家号-文章作品数据', async () => {
    const cookie =
      'BAIDUID=80514DCFF008C9D6520827670D1E10CA:FG=1; BAIDUID_BFESS=80514DCFF008C9D6520827670D1E10CA:FG=1; PHPSESSID=6c66cib2mu12mck4g3bpcp1776; theme=bjh; ppfuid=FOCoIC3q5fKa8fgJnwzbE67EJ49BGJeplOzf+4l4EOvDuu2RXBRv6R3A1AZMa49I27C0gDDLrJyxcIIeAeEhD8JYsoLTpBiaCXhLqvzbzmvy3SeAW17tKgNq/Xx+RgOdb8TWCFe62MVrDTY6lMf2Gixx7aLvAhqvNkvAJQDmQheTJbcu/AFainBdW3mPgxdz5OfNyUCwYGCwdaCAvb4zIAXiPbbFPDQVtPAPnuC7GKo4JBM7053Q+UyCTEj7Fgd4l4Arsz+u5qykCI0DqyHtMkt49OC+Tx5guSJPFG/G6oDtRp3bqUFgYeNkP3aLQT5kYjAh8A8yft+s3B4RtKRu8VzjBYc3VZO8C3FJKPf/VpOiS8DHSHR/nhAJRNzx8LHyGWhocXrPp5Y8evA8e3q50aUamr+SmbWOK+U2n1YNoW+ioTSKU4nQaaWWJj1AnjrL+sma/I9in8l5AhdP95hxKdnTNS/pLMWceus0e757/UP9wfDgkA/VfIUQpG5Qx8UEAAv3LCf1Y7/fHL3PTSf9vid/u2VLX4h1nBtx8EF07eCMhWVv+2qjbPV7ZhXk3reaWRFEeso3s/Kc9n/UXtUfNU1sHiCdbrCW5yYsuSM9SPGDZsl7FhTAKw7qIu38vFZiq+DRc8Vbf7jOiN9xPe0lOdZHUhGHZ82rL5jTCsILwcRVCndrarbwmu7G154MpYiKmTXZkqV7Alo4QZzicdyMbWvwvmR2/m//YVTM8qeZWgDSHjDmtehgLWM45zARbPujeqU0T92Gmgs89l2htrSKIX9zrq0pn8eNCqEZdl62PlP6XXmpqIV64NeHXkzPGk+yvai6OYUn80FYgTtVBKXFxZdImdyxYIjA1uSy2hfTFv/d3cnXH4nh+maaicAPllDgrppZTr0lDf2Vsiy73L8egP9ck5gsaaSE4obz9V1JGvyp8lNw+IyCN2Gou0efGgcYQBug3EYJEWCj3Pc/9aTWTZA4/akL8FB7FMLdbBSTKQ1rGRChHnhPuJeIKACPXiVuli9ItRLEkdb1mLxNHAk3uJy88YX/Rf/sKUjR12zxRTDxxJNDJS+Dlsbqu3n4I65ujli/3rQ8Zk1MjmTOsz9+kTqOM4upsnQ6IWq/zeZTItMCgHpQhuhr4ip73honuzoJgge1cqWBFYvpabAPTOERTOP1kmx5SXPARX5uxyJzAiNILBC8zh7fGfNXOWV37O9g7EF4Bhdyo1ub8rfchHyXakg3FbqEqM6JmRHqkwRhSJQL7FZBzjoNULxTpfhfCsp4zRszeYvFyXCPSuJ5oyoOgoCPKXE8fX73WOZ0mAlF1mc=; BDUSS=ZHQ05DQkpjeEh6Z3ZXZldJUXNBNlhoTHA1WFVTdG9HUUM3dVFDSnJnRlVtdmhvSUFBQUFBJCQAAAAAAAAAAAEAAABdGAzMyrLDtM62tcC1xLnP19MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFQN0WhUDdFoQV; BDUSS_BFESS=ZHQ05DQkpjeEh6Z3ZXZldJUXNBNlhoTHA1WFVTdG9HUUM3dVFDSnJnRlVtdmhvSUFBQUFBJCQAAAAAAAAAAAEAAABdGAzMyrLDtM62tcC1xLnP19MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFQN0WhUDdFoQV; RECENT_LOGIN=1; HMACCOUNT=73FB4C1CC3037492; __bid_n=199709c1d7b491246f2f2d; devStoken=b0f7de756f6cda6677118713bfa2ab7f78812b2b8f77850a2447d0b705a6bc0e; bjhStoken=efdb9fdc29a8ac4a53fe536059713d6478812b2b8f77850a2447d0b705a6bc0e; RT="z=1&dm=baidu.com&si=4db27738-9dcc-4f76-aab9-491ee6a0ef39&ss=mgt2zdp3&sl=0&tt=0&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf"; Hm_lvt_f7b8c775c6c8b6a716a75df506fb72df=1758530902,1760598657; Hm_lpvt_f7b8c775c6c8b6a716a75df506fb72df=1760598657; ab_sr=1.0.1_Mzg3Yzk2MDAyYWM1MmJkOTg5ODQxYjVmMjMyMDMyMDVmYzMyNmViYjcyYmViMDVkYmU2NzA1N2EwNmY2YWJmOThkMjk3ZDA5NTRmYWYxNTgzOGI2NDVjZGIxODA1YjI0Yzc3NjkzYmQ2YWMyYmI5ZTA5MjU4YjU5Yjg2ZTE4ZWIzMmVlODkyYTdkNjhhMjhkNjBjZGVkODU2YzAyY2UzOWYyOTkzNjcwYjE2NTA4YTIyZjIwYjY3NzY0NGU4MjQy';
    const result = await DataService.getAccountContentList(Platforms.BaiJiaHao, false, cookie);
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取头条号-视频作品数据', async () => {
    const cookie =
      'passport_csrf_token=04875eb0879a78ff1c23115fdd6119ca; passport_csrf_token_default=04875eb0879a78ff1c23115fdd6119ca; s_v_web_id=verify_m2ucqjki_aoBnyijK_9ie0_4qSv_AAFD_wFJpUAgN1hxi; ttwid=1%7C7NAILBve31rdBGnEvQmvDuy18OeCw25WKqUnOMJ9QpA%7C1730200554%7C3f6317657b568ef620da1e6518c708f9073a79baaae43c9f3add5daaaeb07f6f; n_mh=vzBueMd0IslOEX34KAK9JtrhFU5IBWqJZPtO8_uOKbw; sso_uid_tt=2cec70f01f4304a5410f10b802898b54; sso_uid_tt_ss=2cec70f01f4304a5410f10b802898b54; toutiao_sso_user=f2ed97a3736738ff8595d714eccd6808; toutiao_sso_user_ss=f2ed97a3736738ff8595d714eccd6808; sid_ucp_sso_v1=1.0.0-KGZlMWNiNTA2YjQ2ZDM4Yjk4NWU0Y2RmOTY4MmJmNTE3YThkZjA0YzIKHQiZ8t_43AIQj4iDuQYYzwkgDDC_ssDUBTgGQPQHGgJobCIgZjJlZDk3YTM3MzY3MzhmZjg1OTVkNzE0ZWNjZDY4MDg; ssid_ucp_sso_v1=1.0.0-KGZlMWNiNTA2YjQ2ZDM4Yjk4NWU0Y2RmOTY4MmJmNTE3YThkZjA0YzIKHQiZ8t_43AIQj4iDuQYYzwkgDDC_ssDUBTgGQPQHGgJobCIgZjJlZDk3YTM3MzY3MzhmZjg1OTVkNzE0ZWNjZDY4MDg; odin_tt=d30f113eb7244126a2e69ec16f7fc09de178e36d56db05735e2a8d1ba791bb1c4c94fdcdae8410abaa933dbedc39a321; sid_guard=19b02604d6308d39e14ec3d3f40c87c8%7C1730200593%7C5184000%7CSat%2C+28-Dec-2024+11%3A16%3A33+GMT; uid_tt=be5e2cdded301e79e320ff9e22000cec; uid_tt_ss=be5e2cdded301e79e320ff9e22000cec; sid_tt=19b02604d6308d39e14ec3d3f40c87c8; sessionid=19b02604d6308d39e14ec3d3f40c87c8; sessionid_ss=19b02604d6308d39e14ec3d3f40c87c8; is_staff_user=false; sid_ucp_v1=1.0.0-KDZjNTY3YzY4NWRiZjQ0YzQ1MGMwMzliNTM1ZTMyZDZlMDU1MDEwZTgKFwiZ8t_43AIQkYiDuQYYzwkgDDgGQPQHGgJobCIgMTliMDI2MDRkNjMwOGQzOWUxNGVjM2QzZjQwYzg3Yzg; ssid_ucp_v1=1.0.0-KDZjNTY3YzY4NWRiZjQ0YzQ1MGMwMzliNTM1ZTMyZDZlMDU1MDEwZTgKFwiZ8t_43AIQkYiDuQYYzwkgDDgGQPQHGgJobCIgMTliMDI2MDRkNjMwOGQzOWUxNGVjM2QzZjQwYzg3Yzg; store-region=cn-hn; store-region-src=uid; gfkadpd=1231,25897; csrf_session_id=ffe72ea9bea1001ec6261a1b8dad1847';
    const result = await DataService.getAccountContentList(Platforms.TouTiaoHao, true, cookie, 'video');
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取头条号-小视频作品数据', async () => {
    const cookie =
      'passport_csrf_token=04875eb0879a78ff1c23115fdd6119ca; passport_csrf_token_default=04875eb0879a78ff1c23115fdd6119ca; s_v_web_id=verify_m2ucqjki_aoBnyijK_9ie0_4qSv_AAFD_wFJpUAgN1hxi; ttwid=1%7C7NAILBve31rdBGnEvQmvDuy18OeCw25WKqUnOMJ9QpA%7C1730200554%7C3f6317657b568ef620da1e6518c708f9073a79baaae43c9f3add5daaaeb07f6f; n_mh=vzBueMd0IslOEX34KAK9JtrhFU5IBWqJZPtO8_uOKbw; sso_uid_tt=2cec70f01f4304a5410f10b802898b54; sso_uid_tt_ss=2cec70f01f4304a5410f10b802898b54; toutiao_sso_user=f2ed97a3736738ff8595d714eccd6808; toutiao_sso_user_ss=f2ed97a3736738ff8595d714eccd6808; sid_ucp_sso_v1=1.0.0-KGZlMWNiNTA2YjQ2ZDM4Yjk4NWU0Y2RmOTY4MmJmNTE3YThkZjA0YzIKHQiZ8t_43AIQj4iDuQYYzwkgDDC_ssDUBTgGQPQHGgJobCIgZjJlZDk3YTM3MzY3MzhmZjg1OTVkNzE0ZWNjZDY4MDg; ssid_ucp_sso_v1=1.0.0-KGZlMWNiNTA2YjQ2ZDM4Yjk4NWU0Y2RmOTY4MmJmNTE3YThkZjA0YzIKHQiZ8t_43AIQj4iDuQYYzwkgDDC_ssDUBTgGQPQHGgJobCIgZjJlZDk3YTM3MzY3MzhmZjg1OTVkNzE0ZWNjZDY4MDg; odin_tt=d30f113eb7244126a2e69ec16f7fc09de178e36d56db05735e2a8d1ba791bb1c4c94fdcdae8410abaa933dbedc39a321; sid_guard=19b02604d6308d39e14ec3d3f40c87c8%7C1730200593%7C5184000%7CSat%2C+28-Dec-2024+11%3A16%3A33+GMT; uid_tt=be5e2cdded301e79e320ff9e22000cec; uid_tt_ss=be5e2cdded301e79e320ff9e22000cec; sid_tt=19b02604d6308d39e14ec3d3f40c87c8; sessionid=19b02604d6308d39e14ec3d3f40c87c8; sessionid_ss=19b02604d6308d39e14ec3d3f40c87c8; is_staff_user=false; sid_ucp_v1=1.0.0-KDZjNTY3YzY4NWRiZjQ0YzQ1MGMwMzliNTM1ZTMyZDZlMDU1MDEwZTgKFwiZ8t_43AIQkYiDuQYYzwkgDDgGQPQHGgJobCIgMTliMDI2MDRkNjMwOGQzOWUxNGVjM2QzZjQwYzg3Yzg; ssid_ucp_v1=1.0.0-KDZjNTY3YzY4NWRiZjQ0YzQ1MGMwMzliNTM1ZTMyZDZlMDU1MDEwZTgKFwiZ8t_43AIQkYiDuQYYzwkgDDgGQPQHGgJobCIgMTliMDI2MDRkNjMwOGQzOWUxNGVjM2QzZjQwYzg3Yzg; store-region=cn-hn; store-region-src=uid; gfkadpd=1231,25897; csrf_session_id=ffe72ea9bea1001ec6261a1b8dad1847';
    const result = await DataService.getAccountContentList(Platforms.TouTiaoHao, true, cookie);
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取头条号-文章作品数据', async () => {
    const cookie =
      'passport_csrf_token=04875eb0879a78ff1c23115fdd6119ca; passport_csrf_token_default=04875eb0879a78ff1c23115fdd6119ca; s_v_web_id=verify_m2ucqjki_aoBnyijK_9ie0_4qSv_AAFD_wFJpUAgN1hxi; ttwid=1%7C7NAILBve31rdBGnEvQmvDuy18OeCw25WKqUnOMJ9QpA%7C1730200554%7C3f6317657b568ef620da1e6518c708f9073a79baaae43c9f3add5daaaeb07f6f; n_mh=vzBueMd0IslOEX34KAK9JtrhFU5IBWqJZPtO8_uOKbw; sso_uid_tt=2cec70f01f4304a5410f10b802898b54; sso_uid_tt_ss=2cec70f01f4304a5410f10b802898b54; toutiao_sso_user=f2ed97a3736738ff8595d714eccd6808; toutiao_sso_user_ss=f2ed97a3736738ff8595d714eccd6808; sid_ucp_sso_v1=1.0.0-KGZlMWNiNTA2YjQ2ZDM4Yjk4NWU0Y2RmOTY4MmJmNTE3YThkZjA0YzIKHQiZ8t_43AIQj4iDuQYYzwkgDDC_ssDUBTgGQPQHGgJobCIgZjJlZDk3YTM3MzY3MzhmZjg1OTVkNzE0ZWNjZDY4MDg; ssid_ucp_sso_v1=1.0.0-KGZlMWNiNTA2YjQ2ZDM4Yjk4NWU0Y2RmOTY4MmJmNTE3YThkZjA0YzIKHQiZ8t_43AIQj4iDuQYYzwkgDDC_ssDUBTgGQPQHGgJobCIgZjJlZDk3YTM3MzY3MzhmZjg1OTVkNzE0ZWNjZDY4MDg; odin_tt=d30f113eb7244126a2e69ec16f7fc09de178e36d56db05735e2a8d1ba791bb1c4c94fdcdae8410abaa933dbedc39a321; sid_guard=19b02604d6308d39e14ec3d3f40c87c8%7C1730200593%7C5184000%7CSat%2C+28-Dec-2024+11%3A16%3A33+GMT; uid_tt=be5e2cdded301e79e320ff9e22000cec; uid_tt_ss=be5e2cdded301e79e320ff9e22000cec; sid_tt=19b02604d6308d39e14ec3d3f40c87c8; sessionid=19b02604d6308d39e14ec3d3f40c87c8; sessionid_ss=19b02604d6308d39e14ec3d3f40c87c8; is_staff_user=false; sid_ucp_v1=1.0.0-KDZjNTY3YzY4NWRiZjQ0YzQ1MGMwMzliNTM1ZTMyZDZlMDU1MDEwZTgKFwiZ8t_43AIQkYiDuQYYzwkgDDgGQPQHGgJobCIgMTliMDI2MDRkNjMwOGQzOWUxNGVjM2QzZjQwYzg3Yzg; ssid_ucp_v1=1.0.0-KDZjNTY3YzY4NWRiZjQ0YzQ1MGMwMzliNTM1ZTMyZDZlMDU1MDEwZTgKFwiZ8t_43AIQkYiDuQYYzwkgDDgGQPQHGgJobCIgMTliMDI2MDRkNjMwOGQzOWUxNGVjM2QzZjQwYzg3Yzg; store-region=cn-hn; store-region-src=uid; gfkadpd=1231,25897; csrf_session_id=ffe72ea9bea1001ec6261a1b8dad1847';
    const result = await DataService.getAccountContentList(Platforms.TouTiaoHao, true, cookie);
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取微博-视频作品数据', async () => {
    const cookie = convertCookieStr(
      'SCF=AvIMenX58GDJXbZqN8C_qt4Lht5PJhNI_o8hQ6tPJMoWg5hWR7KShuwjiABH-Pk4FR9b58VS_pYw9-kB0vu7RtQ.; SUB=_2A25EuMaFDeRhGeVH41UQ9CjOwzuIHXVntEZNrDV8PUNbmtAbLWX7kW9NTzB_N00iBEVHGoNccDqcT1jZtW_7jK3s; SUBP=0033WrSXqPxfM725Ws9jqgMF55529P9D9WFocrCIbkORgQyaQXUySSLF5NHD95Q01KnNeKBceonNWs4Dqcj_i--fi-isi-8Fi--Xi-z4iK.7i--NiKLWiKnXi--fiK.Ri-iFi--4i-zpi-ih; ALF=02_1776567253; XSRF-TOKEN=9Ks1lWFz--kgg5Z_VaynX7-9; WBPSESS=pCnfi4EeoIkPvjAjZchhRlK7VdIS8yO-JE6jZY8MWiYjFOVqJcHj99o8T2i7-ty_PeI2Uyq1ca2vm9cUgbbGkWB20JPQGdIrfzMwmI6bq-k6DRl5EeE6rh3bp6R8i6IekLnhWAEmf4jlf9ZFlRgQwg==',
    );
    const result = await DataService.getAccountContentList(
      Platforms.XinLangWeiBo,
      false,
      cookie,
      'video',
      undefined,
      600,
      20,
    );
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取微博-头条文章作品数据', async () => {
    const cookie = convertCookieStr(
      'SCF=AvIMenX58GDJXbZqN8C_qt4Lht5PJhNI_o8hQ6tPJMoWg5hWR7KShuwjiABH-Pk4FR9b58VS_pYw9-kB0vu7RtQ.; SUB=_2A25EuMaFDeRhGeVH41UQ9CjOwzuIHXVntEZNrDV8PUNbmtAbLWX7kW9NTzB_N00iBEVHGoNccDqcT1jZtW_7jK3s; SUBP=0033WrSXqPxfM725Ws9jqgMF55529P9D9WFocrCIbkORgQyaQXUySSLF5NHD95Q01KnNeKBceonNWs4Dqcj_i--fi-isi-8Fi--Xi-z4iK.7i--NiKLWiKnXi--fiK.Ri-iFi--4i-zpi-ih; ALF=02_1776567253; XSRF-TOKEN=9Ks1lWFz--kgg5Z_VaynX7-9; WBPSESS=pCnfi4EeoIkPvjAjZchhRlK7VdIS8yO-JE6jZY8MWiYjFOVqJcHj99o8T2i7-ty_PeI2Uyq1ca2vm9cUgbbGkWB20JPQGdIrfzMwmI6bq-k6DRl5EeE6rh3bp6R8i6IekLnhWAEmf4jlf9ZFlRgQwg==',
    );
    const result = await DataService.getAccountContentList(
      Platforms.XinLangWeiBo,
      false,
      cookie,
      'article',
      undefined,
      1600,
      20,
    );
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取知乎作品数据', async () => {
    const cookie =
      ' _zap=6950dcdb-48cc-4110-adfc-3714479f3325; _xsrf=67cf9478-0c70-43ab-99a5-043f7e990e0f; Hm_lvt_98beee57fd2ef70ccdd5ca52b9740c49=1768208024; HMACCOUNT=7CB633EE0A54838F; d_c0=12SUafttrBuPTtwNuYQ_UvCrej0dIxlu6ek=|1768208023; DATE=1768208024961; cmci9xde=U2FsdGVkX18w1p8HPjV4y7dKLZt0Mi3gfvg2Ykq/hG+JcLc4pbQXkGdhQCh1s0pZbAdY6NJMMvYysWvWhqlk5g==; pmck9xge=U2FsdGVkX19lazkWr2m4VAvhV4+22R0b70t3h72rFrM=; captcha_session_v2=2|1:0|10:1768208024|18:captcha_session_v2|88:QlRzTGY1anNuQUJJamJBcEM4dlB3K1RJWDlYWmJJbXRxNTdQT0RyRkJtNWg2OVhnZVJjWG9VM1F2c043SEhiRg==|c3b9b578773b6e08f776711a1ebead43f9c4df36b80234f43ddad7cc72553d01; crystal=U2FsdGVkX1+Z0hwoyyicfi2GGrV+4XgR86g7aTnlmhZgOCBPnnCUyoPUKZhLa/cWDD1n6koo6tVzzwK7Yx0+YnhnJel39Vubo25vh3g4h9Zx/qwwawNMxV3kwKt4t+fVVBO8YgUhl5N9xHFRDFFlvJu2O+ONgA3d0iQmP+4NuPrEh3ssLqlxuwSxdXaO0Z60SsCRZtiivrZoJSvBbwdS1QPmsa4mVulCGvn31emL0xn7ujx770krBVF7XT+pc3Q9; assva6=U2FsdGVkX1+vvT+SmMaEjSTbVK0ka1w6z9yksWiju54=; assva5=U2FsdGVkX19dqMTuPJjxnixPOneMUndTA9Mwt+uQxtvBkYKyQf4MmVlNnWFCCGWEP6vJtze3B2vA+bErkVnsSw==; __snaker__id=rwnhB5sLX8V2gPLX; gdxidpyhxdE=KWAA129Go%2FJCsKWsi0RbAYC1yugR1xfI9k%2Fbr5bhibJY%2FWzUsQk7PsK2dhAIDHNmnocVwtPjLjS8ifZ%2Fo%5CP3w%2BvhAQxD1n04QEnPMXOjLCqnTVJDmXN5WhNXjrZ24gatPJEm34dbAiijXU%5CK7m0WjGnXeSG%5CA5YmGhNPZlw%2FH7jgTWcp%3A1768208926151; vmce9xdq=U2FsdGVkX1+1R+Qkmdwqho+8zw32wJa0ZbNJ3o+8CSRuiCUY/8me0ajOVBV2ceYb7bJAne+2r/mvPaRz8qaKQxWkcDNM+TLynDn9hIPVeY+BzLfj3M06rYNEunEMG6uJDnQftM5XG/i9zslPhCoB1J7sI+MeiZg2D+zPy0zwVDs=; captcha_ticket_v2=2|1:0|10:1768208060|17:captcha_ticket_v2|728:eyJ2YWxpZGF0ZSI6IkNOMzFfNipUcDNSdkV1RkFlVzFkcjJHVnRUeFJuMHBzNUNXUWlXdC5tVjBvbHJoZ3hLeVhMcVUqZXhpbnZUZnJBc0lXQUlFTy55b3VFamdKY3p4a2wxV1kzX2ZhQVdMdWt2cmxLaFIweFJBcHFBQTRLbmJSbldneEpDNDM4dHZTZWtZQmQ4NEYqSGw1SGN0KnJfSS5WZ3p3MEMueHlBbHpiUkd6dkJWVG5SMlNNeWxHaUkwMExkbG4wazZuQmtwRmtIamswYjZPQVMxeFNNVVJQbkRoRkMqeVkyV3dadGE5aklRMTI1X1Z4LkRDQnF3S3FvMld2UVRkNk1hcXJ0SlpaM1BRdlB3eWlIUlNWRVRDeSpmNnByTkFjR0MzdDVkYVA2OUk0U0lnY1RCUEdDbF9fZjRBVkptaWhUeWRWWmhCZVFyOHFIWDV1aDg1NlA1S1ZwV19Ed21nU0lxY3ZKS1YuRFhJb0F1MXRjUk0zLmZVMi5wb0o0Q0VTWVV1Q19DVndqZndjYmZZQ1NWTHVCdzNPVUJ6NTBNUDNEVFlWbUhmYkpxRmhDYjJPQSplX2hWdTVvNHQzbTZhaUx3SXRkbUFDaGNGYUQwQjBzM3NnbCouSmlGRWN5ZFhINVlUOHBTM19BdVM2X0tZcjNLLlc2dTFldTh3cWxMX0dvR1E0UnUxKkZvWWl4ZnA5SFg3N192X2lfMSJ9|d0fe44217a77da5cfc637e4dce33c57af5ee69c959a909db3cbed2178e429a42; SUBMIT_0=58bc4b18-5ce4-487b-88b3-b795a7a084ac; z_c0=2|1:0|10:1769074756|4:z_c0|92:Mi4xNm5RMm5RQUFBQURYWkpScC0yMnNHeVlBQUFCZ0FsVk52QVJTYWdCNGNBengzTXJNbzBjaHMzQ0FOM1A1cDA2TjB3|02d5188585fc0113c6ba3842040c213151dc93e740980ed17a8f56f1d6e1ec34; SESSIONID=71r8nmuNRdvFox4JeM6QGEWwgs1fuS4Or7ZIrUwosTb; JOID=VFsTAE4ZUEIN6-6aYeAR1uoUhjB6K2Q1M4aG6ipIMTFOgpWrLlygMGHt7ppiaSFOZJ1l74JYs40XABTQf0lXuHY=; osd=UF4XC00dVUYG6OqfZesS0u8QjTN-LmA-MIKD7iFLNTRKiZavK1irM2Xo6pFhbSRKb55h6oZTsIkSBB_Te0xTs3U=; Hm_lpvt_98beee57fd2ef70ccdd5ca52b9740c49=1769074869; BEC=fc13dc7850b2e749d88c66e883fdd0e4';
    Cloud.pushDataSyncTask(
      Platforms.ZhiHu,
      'contentList',
      { cookie: cookie, platformAccountId: '123', platformAuthorId: '' },
      undefined,
      7,
      20,
    );
    // assets
    await Task.Delay(10000000);
  }, 10000000);

  test('获取知乎-文章作品数据', async () => {
    const cookie =
      ' _zap=6950dcdb-48cc-4110-adfc-3714479f3325; _xsrf=67cf9478-0c70-43ab-99a5-043f7e990e0f; Hm_lvt_98beee57fd2ef70ccdd5ca52b9740c49=1768208024; HMACCOUNT=7CB633EE0A54838F; d_c0=12SUafttrBuPTtwNuYQ_UvCrej0dIxlu6ek=|1768208023; DATE=1768208024961; cmci9xde=U2FsdGVkX18w1p8HPjV4y7dKLZt0Mi3gfvg2Ykq/hG+JcLc4pbQXkGdhQCh1s0pZbAdY6NJMMvYysWvWhqlk5g==; pmck9xge=U2FsdGVkX19lazkWr2m4VAvhV4+22R0b70t3h72rFrM=; captcha_session_v2=2|1:0|10:1768208024|18:captcha_session_v2|88:QlRzTGY1anNuQUJJamJBcEM4dlB3K1RJWDlYWmJJbXRxNTdQT0RyRkJtNWg2OVhnZVJjWG9VM1F2c043SEhiRg==|c3b9b578773b6e08f776711a1ebead43f9c4df36b80234f43ddad7cc72553d01; crystal=U2FsdGVkX1+Z0hwoyyicfi2GGrV+4XgR86g7aTnlmhZgOCBPnnCUyoPUKZhLa/cWDD1n6koo6tVzzwK7Yx0+YnhnJel39Vubo25vh3g4h9Zx/qwwawNMxV3kwKt4t+fVVBO8YgUhl5N9xHFRDFFlvJu2O+ONgA3d0iQmP+4NuPrEh3ssLqlxuwSxdXaO0Z60SsCRZtiivrZoJSvBbwdS1QPmsa4mVulCGvn31emL0xn7ujx770krBVF7XT+pc3Q9; assva6=U2FsdGVkX1+vvT+SmMaEjSTbVK0ka1w6z9yksWiju54=; assva5=U2FsdGVkX19dqMTuPJjxnixPOneMUndTA9Mwt+uQxtvBkYKyQf4MmVlNnWFCCGWEP6vJtze3B2vA+bErkVnsSw==; __snaker__id=rwnhB5sLX8V2gPLX; gdxidpyhxdE=KWAA129Go%2FJCsKWsi0RbAYC1yugR1xfI9k%2Fbr5bhibJY%2FWzUsQk7PsK2dhAIDHNmnocVwtPjLjS8ifZ%2Fo%5CP3w%2BvhAQxD1n04QEnPMXOjLCqnTVJDmXN5WhNXjrZ24gatPJEm34dbAiijXU%5CK7m0WjGnXeSG%5CA5YmGhNPZlw%2FH7jgTWcp%3A1768208926151; vmce9xdq=U2FsdGVkX1+1R+Qkmdwqho+8zw32wJa0ZbNJ3o+8CSRuiCUY/8me0ajOVBV2ceYb7bJAne+2r/mvPaRz8qaKQxWkcDNM+TLynDn9hIPVeY+BzLfj3M06rYNEunEMG6uJDnQftM5XG/i9zslPhCoB1J7sI+MeiZg2D+zPy0zwVDs=; captcha_ticket_v2=2|1:0|10:1768208060|17:captcha_ticket_v2|728:eyJ2YWxpZGF0ZSI6IkNOMzFfNipUcDNSdkV1RkFlVzFkcjJHVnRUeFJuMHBzNUNXUWlXdC5tVjBvbHJoZ3hLeVhMcVUqZXhpbnZUZnJBc0lXQUlFTy55b3VFamdKY3p4a2wxV1kzX2ZhQVdMdWt2cmxLaFIweFJBcHFBQTRLbmJSbldneEpDNDM4dHZTZWtZQmQ4NEYqSGw1SGN0KnJfSS5WZ3p3MEMueHlBbHpiUkd6dkJWVG5SMlNNeWxHaUkwMExkbG4wazZuQmtwRmtIamswYjZPQVMxeFNNVVJQbkRoRkMqeVkyV3dadGE5aklRMTI1X1Z4LkRDQnF3S3FvMld2UVRkNk1hcXJ0SlpaM1BRdlB3eWlIUlNWRVRDeSpmNnByTkFjR0MzdDVkYVA2OUk0U0lnY1RCUEdDbF9fZjRBVkptaWhUeWRWWmhCZVFyOHFIWDV1aDg1NlA1S1ZwV19Ed21nU0lxY3ZKS1YuRFhJb0F1MXRjUk0zLmZVMi5wb0o0Q0VTWVV1Q19DVndqZndjYmZZQ1NWTHVCdzNPVUJ6NTBNUDNEVFlWbUhmYkpxRmhDYjJPQSplX2hWdTVvNHQzbTZhaUx3SXRkbUFDaGNGYUQwQjBzM3NnbCouSmlGRWN5ZFhINVlUOHBTM19BdVM2X0tZcjNLLlc2dTFldTh3cWxMX0dvR1E0UnUxKkZvWWl4ZnA5SFg3N192X2lfMSJ9|d0fe44217a77da5cfc637e4dce33c57af5ee69c959a909db3cbed2178e429a42; SUBMIT_0=58bc4b18-5ce4-487b-88b3-b795a7a084ac; z_c0=2|1:0|10:1769074756|4:z_c0|92:Mi4xNm5RMm5RQUFBQURYWkpScC0yMnNHeVlBQUFCZ0FsVk52QVJTYWdCNGNBengzTXJNbzBjaHMzQ0FOM1A1cDA2TjB3|02d5188585fc0113c6ba3842040c213151dc93e740980ed17a8f56f1d6e1ec34; SESSIONID=71r8nmuNRdvFox4JeM6QGEWwgs1fuS4Or7ZIrUwosTb; JOID=VFsTAE4ZUEIN6-6aYeAR1uoUhjB6K2Q1M4aG6ipIMTFOgpWrLlygMGHt7ppiaSFOZJ1l74JYs40XABTQf0lXuHY=; osd=UF4XC00dVUYG6OqfZesS0u8QjTN-LmA-MIKD7iFLNTRKiZavK1irM2Xo6pFhbSRKb55h6oZTsIkSBB_Te0xTs3U=; Hm_lpvt_98beee57fd2ef70ccdd5ca52b9740c49=1769074869; BEC=fc13dc7850b2e749d88c66e883fdd0e4';
    const result = await DataService.getAccountContentList(Platforms.ZhiHu, false, cookie, 'article', undefined, 7, 20);
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取知乎-视频作品数据', async () => {
    const cookie =
      ' __snaker__id=Ker11EzL2OVfalDv; _xsrf=358b2019-197f-4dd4-939b-e8487a1e6c41; KLBRSID=53650870f91603bc3193342a80cf198c|1707120097|1707120097; HMACCOUNT=9878FBFA85951A65; SESSIONID=qzCTiEtXrMp7L6mHckDvyXLrL0vYOrKJhxuaFK63SX5; JOID=Ul4XC01hhMba9YSCY2i0VzdfmT92KsKoh7T71wwx7_OIkNq0CdykqLX1hoxnibl82F0ONbY1ky3LLQ-aer-cwcs=; osd=Ul8SAUhhhcPQ8ISDZmKxVzZakzp2K8eigrT60gY07_KNmt-0CNmurbX0g4Ziibh50lgONLM_li3KKAWfer6Zy84=; _zap=2f6c671c-529e-4108-a191-d48ce2d6d179; d_c0=rZLTd7UYdhqPTi7i9Y2okZ5NreP1EjrR1Pc=|1747381922; Hm_lvt_98beee57fd2ef70ccdd5ca52b9740c49=1747381924; z_c0=2|1:0|10:1747381924|4:z_c0|80:MS4xbHlfNEFnQUFBQUFtQUFBQVlBSlZUYVE4RkdrMERGMnlEMnlHWFZoTTl1RnRURlZZQ2ZfY3ZBPT0=|ac87f565a2a33f4b7963f74a471847e95dc95528e2e6286a8dffc94840a159b4; SESSIONID=PN8mXkp6NxyXoD6pCliBEMRg9i9BltLOwYhUK7kVrIY; JOID=UV4XBUowjBiK2HZ8AjS7iml1ZsYURPJf2bM2DF5AxGy5k0IUTpdiPeffd3wBzGnirediCvz4AYQ2jcQikPehezg=; osd=UFkTBkIxixyJ0Hd7Bjezi25xZc4VQ_Zc0bIxCF1IxWu9kEoVSZNhNebYc38JzW7mru9jDfj7CYUxiccqkfCleDA=; __zse_ck=004_PRwnqsC5XVUUzS9kyswzhCQFvBKFvad=5Li3A3amsuxN22nktarsRIiZjOwZe3ILG6dM3W3L/cS/Uiw5uaoEhNSqiGxgoENe1=oUgub3CXlxI1gtja14ftaY5=B7LUv/-UP5cdEEJwEDigIDa547v3WFGhKbYoEW3OfcEZG8mSEgiomQiZML2RK3N/0o/U7GPiCl7ihAeX1xompg4keQp11wy+/5KbL+R8wPaI3tVsoqOWOuUBPXeeMRyl8g4j2Ca; Hm_lpvt_98beee57fd2ef70ccdd5ca52b9740c49=1747382084; BEC=d892da65acb7e34c89a3073e8fa2254f';
    const result = await DataService.getAccountContentList(
      Platforms.ZhiHu,
      false,
      cookie,
      'video',
      undefined,
      1600,
      20,
    );
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取企鹅号-文章作品数据', async () => {
    const cookie =
      'pgv_info=ssid=s9965792037; ts_last=om.qq.com/userAuth/index; pgv_pvid=5515919120; ts_uid=3989126633; csrfToken=csrf-1749436280543; _qpsvr_localtk=0.5195439789056651; RK=vyd006drY5; ptcz=ba9278b28a62f1ac8bd5ca48e7d9619f3b846079d75d7bbf47e9e94f99513a37; userid=24272470; omaccesstoken=00c94bc1c8cf1686ba3c0ea77729752ed23c179fe07b7deeb7c34ed253d352176692412408d41af42837f9dfdd56d7772fd53804cc6c469466fb64adcfd5d6e02dah; omtoken=00c94bc1c8cf1686ba3c0ea77729752ed23c179fe07b7deeb7c34ed253d352176692412408d41af42837f9dfdd56d7772fd53804cc6c469466fb64adcfd5d6e02dah; logintype=3; srcopenid=760600C4A679918F744E451309505093; srcaccessToken=63015A7E47DC66DF8BE42699C962AB1E';
    const result = await DataService.getAccountContentList(
      Platforms.QiEHao,
      false,
      cookie,
      'article',
      undefined,
      1600,
      20,
    );
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取企鹅号-视频作品数据', async () => {
    const cookie =
      'ts_last=om.qq.com/userAuth/index; pgv_pvid=9316797129; ts_uid=3980601640; csrfToken=csrf-1747051635141; RK=H7c0k6dba5; ptcz=d9d126252bedd678efd308bbd2f9d6e363fa7b4634c4e1f68a4d0d4859166770; userid=24272470; omaccesstoken=005a419c3d34d0c798d12a7af6f491986c2f88cfefa4b014c9f486d68e5482e91ef929b1a74e23c7a634df2265521dc741cbd162610cab42cd626cbb746d804629zd; omtoken=005a419c3d34d0c798d12a7af6f491986c2f88cfefa4b014c9f486d68e5482e91ef929b1a74e23c7a634df2265521dc741cbd162610cab42cd626cbb746d804629zd; logintype=3; srcopenid=760600C4A679918F744E451309505093; srcaccessToken=5A1B8E8F438C7320787F4A7AB2BD4C01';
    const result = await DataService.getAccountContentList(
      Platforms.QiEHao,
      false,
      cookie,
      'video',
      undefined,
      1600,
      20,
    );
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);

  test('获取搜狐号作品数据', async () => {
    const cookie =
      'SUV=17399592346300knh08; clt=1739959234; cld=20250219180034; mp-cv=100-1739959234742-8f25ca00517d41e391fa0ead119d4b06; reqtype=pc; gidinf=x099980109ee1a42467b42091000232c3e4f04af4e2e; _dfp=+v8lhurnxSHJQpOx2lb8WGAQnhGgNWbgfyxCbf7WDUo=; jv=752820e4555ba768c68787f2518b1b1c-yj2WR9s31746600679353; ppinf=2|1746600680|1747810280|bG9naW5pZDowOnx1c2VyaWQ6Mjg6MTUwNDY0NjM4MDMwNjg0MTYwMEBzb2h1LmNvbXxzZXJ2aWNldXNlOjMwOjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMHxjcnQ6MTA6MjAyNS0wNS0wN3xlbXQ6MTowfGFwcGlkOjY6MTEzODA1fHBsYXQ6Mzpwd2R8dHJ1c3Q6MToxfHBhcnRuZXJpZDoxOjB8cmVsYXRpb246MDp8dXVpZDoxNjpzYTBkOTBjNWVkY2ZiZDgzfHVpZDoxNjpzYTBkOTBjNWVkY2ZiZDgzfHVuaXFuYW1lOjA6fA; pprdig=o69jYwnT2NKpMO2jUOb0eBpl6Me2JEcDdv9GpwSTxno9XyCZS1s2YHzw-g8S6rb1Ovcpd0mFemEtijURAb8dete4gXLHXBOWbekJUaafEuSTR2Kl6hPmOidBZLQfAlccrGEnO2pRsI1F4hYNsFUdae-JGT4QoCdOOfmON4nFLWU; umab_user_id=052881b998c21000; t=1747646808510; umab_access_token=BearerES+eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJpc3MiOiJjb20uc29odS51bWFiIiwic3ViIjoiMDUyODgxYjk5OGMyMTAwMCIsImF1dGgiOiIwNTI4ODFiOTk4YzIxMDAwLDEwNjA4Mzg1ZmNjMTAwMDAsMTUwNDY0NjM4MDMwNjg0MTYwMEBzb2h1LmNvbSxzbXBjLDEwLGYsZixmLHByb2QsMTg4NzQwNzAwNjYiLCJleHAiOjE3NTI4MzA4MDh9.Qiiw15P2ZrEUYOuohaa58GY-vWBrRm12lOcyRsYnSGmjZfkuyIuoOZI5CIoEbnAeBm9ILcqKpUkmvz75L6skMQ; umab_refresh_token=BearerES+eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJpc3MiOiJjb20uc29odS51bWFiIiwic3ViIjoiMDUyODgxYjk5OGMyMTAwMCIsImF1dGgiOiIwNTI4ODFiOTk4YzIxMDAwLDEwNjA4Mzg1ZmNjMTAwMDAscmVmcmVzaF90b2tlbixmLDE4ODc0MDcwMDY2IiwiZXhwIjoxNzc5MTgyODA4fQ.Nt2XI1DUrH78eBW2dRP8A8dF_nRnG2YQrsISeVrWGu7jQv2jaiG1Me8BfE8u1mCbbHLZvPkAmKVRWvLrnkdz2g; ppmdig=174764722200000021774d89025c50d100963da23c5119c7; ppmdig=174764722200000021774d89025c50d100963da23c5119c7; tgw_l7_route=d130a8ed883f0fe15c57cdb74b5e2881';
    const result = await DataService.getAccountContentList(
      Platforms.SouHuHao,
      false,
      cookie,
      'all',
      undefined,
      1600,
      20,
    );
    // assets
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
  test('获取一点号作品数据', async () => {
    const cookie = convertCookieStr(
      'DID=nodeb6b75bbef88c3b57; login-label=2107053591; BUILD_VERSION=gTPphk428e1780989765621; JSESSIONID=302279b267f4e1f8e91c8e2e4c9f1d0f6defe322e3a799f65fe91f378cde4c29',
    );
    const result = await DataService.SyncDataService.getAccountContentData(
      Platforms.YiDianHao,
      cookie,
      '1231231',
      undefined,
      7,
      1000,
      undefined,
    );
    // assets
    console.log(`数量${result.contentStatisticsData?.length}`);
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
  test('获取大鱼号作品数据', async () => {
    const cookie =
      'cna=xNSoIB8rgXECAXb55M49E7uJ; _UP_A4A_11_=wb9c915fbafc486b9131092c99326026; _UP_30C_6A_=st9c9620114001bj191jhoradhvqi1m6; _UP_TS_=sg1420d074c2da5eb9baac1b2a74169251a; _UP_E37_B7_=sg1420d074c2da5eb9baac1b2a74169251a; _UP_TG_=st9c9620114001bj191jhoradhvqi1m6; _UP_335_2B_=1; _UP_D_=pc; xlly_s=1; USER_TMP=FkkK-FMe9qdGQdtUQ21qUw.qbWGaSV_VEczQeJsQuPPfySUmBgjiXYZWy_JQVhIFrnIhDc9fpH9xCnSKKKBGKLUEw_SRQuS9PvXIw9IlX9M8hnXqdrvRWWSg9owdNqpcl4T4oqGpOyP9B6MHcgY1U445Sb2JZH7Cf3mB58FQcBWDvH9I_XqfB8utKnBOmdpwBX8Zpm2_Ljt5nibOpvVjxguOp5xCMUCeZjYazJrVq2JZQdztSwZ-ZMZv4yL-NePC_uA6WqRuVCdK8GHz9fJ1md9otMai3vk2eDTxonIRzYv0ZGUs-fD72Lsc-l8WZiGQjRgK4N35wSyVag-Q32HFzPZNcrnXjMtGuaRbzG412yQ84B-iGOUeOOzY-KMfIhIcCF6RWVfHy8Qj4fdMw-TXqO7ixirnHpc0oV9dQCrd74-Z9hdP9cesFI2X-4eEs012stAXOyo1uMNE1HTNvX6N7QIq5s2E9nYcJfX0B3BdmXz6QUfEWHf4PXYjjmHWpxggtYxz53ItWXGWm7NkQ-W2eDv7845C3FrfZeoiKaiPBKbuOoDzBD1Y5kwlTr26li1N3PzxbmXyMYOkxip1KH2JJwFa-Y9SEU4yK32unsHhvWvFE-lt-vUUQqz5CzXmNLz2aVvhhr-1sEuDaP4yj4UsKukWNda4Y_FaLVhWB5ymoZvFALipk-1KVeMvKElt5Xw7Lgusd4KgpjaF5Jd0UbI7C8Zw7qFSeCudqIwrZ49wBz7VqPGxGBLN9GH-w8ju91pIKYeXs7BtpWIXTQZPa7OPXNXDm1km57JbWELQ0pymxXie9p2hyzhzAhGWfgCRC4wQ5E60deCyObtJaQvt9YVp9OX18hbtN1FhxejI23G4RHFPZl_vRgdNDsWqXljNTaZILEHZYKJ06gJaEnCknQM-3EI1HSsW1GBWhNACaKQfi2ztB9bXjxwEF5mJIVdned7YVvvPTsQ4aghDyJ5VwTSq0pgaOdP6v_4rOuqJwMBpQwxavP7YLRe4S3DvktL1xsM7dzbRZ9KtZU6ipGfgoUq1A-t57I5KSqg2RKFnCRfPhLUMDHxzFx_LbAYw5Um_ojtLbF2OFPMwC-FnaWfeLxkJuR9EHk9BXfsH2bSqvXcLbXG0wOj-93nxd_W2WyZ8cvZMYkxfmyY2U8_JSWFtDlVYlMgyxk66zhEQpR91JPmY6aE7zySJ_n4DvcFzi5d88G3CVl9NVBayTVeXbG84T4E-AtMWGeZkvvxdSyDJOd009BVNQ.1747719967590.604800000.ngIPCJOj_hRHRFcGM7ilZnLbmKKWTCgjCbFVnGaUdso; tfstk=gHZrnp9M3gIPsSc-roie7qTl_xi-VD5_-kGIKJ2nFbcuFDaqLWwyP2f-VkP46W-7OwnSY2VtMuG7dXtU8ReLT2B-OXcUOJ45hGs_e8nKxy51fGZW9gGa8QmnZ9jmFDkl9yu_z8nKxsTBqS9Qe7hD9SVnxtomLAAoxvDl3qDsKDxo-3YDijhmxY0oKK0mLv-kEXV3ntkKiXmnxWmc3vhu982H0AgldNugsvYpi4hgEj-HbdHrrd2WR3xu0Yuzx8cqFYZqU4ls-mc69uVbKuZ-kZYqv-aaTyVGGUGu7APq5z5w45P-KJk3aGpZiuyU04UXChyq8bz0qqJHx-wmtVaUa_8-ZzNqWx0DLGHb1j28qrWpi8Vsa0DmlGXan24b2VE5i3ogW8i7-5fXPb4ZKg7y9xVaxkUyteuoHxl13trzTJj5xi451eLKocHq1TMWJe3oHxl13t8pJqcx3f6SF; isg=BNLSgH0W7kFg8BKwKl4ImPrwI5i049Z9bmmiFJwqrgVwr3qphHGZjbuNGwuT304V';
    const result = await DataService.getAccountContentList(Platforms.DaYuHao, false, cookie, 'all', undefined, 20, 100);
    // assets
    console.log(`数量${result.data?.length}`);
    console.log(JSON.stringify(result, null, 2));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});

describe.runIf(true)('【获取账号7天作品数据】', () => {
  test('数据同步服务', async () => {
    //获取需要同步的账号列表
    const accountList: Array<MediaAccount> = [
      // {
      //   platformName: '抖音',
      //   id: 'test123123',
      //   cookie:
      //     'n_mh=byxiM_ijziWB3z1vxKWCSaKcFO34y7VfFxcGQaNi6g4; oc_login_type=LOGIN_PERSON; store-region-src=uid; bd_ticket_guard_client_web_domain=2; LOGIN_STATUS=1; store-region=cn-sc; ttcid=9573c54772fc4b88a2e7a3643ebaa7af19; d_ticket=6fc2617dc006cb9834570024fce4c1896a5ef; msToken=tKr898cM_S6ZQPFjuhToaR4VbTDdeyOPqV6ywWu_7cD2E5k0mZMP7BP2kiOnWNFBdDHBAGz67hDakaO3XmpF_ahOn_tvide0paUqVkecUSseYr6LJW-KEokASojV; tt_scid=zPnxGJHvqZuY23phsuXcj7UuQ6QpJqx2-uQUBTtsRhCkAZ5OonAv8F5jK8IcKfGh3e45; oc_login_type=LOGIN_PERSON; passport_fe_beating_status=true; x-web-secsdk-uid=a51af88c-a778-4863-8ba4-2c8a738db150; csrf_session_id=caa5022d41afdce0f0efae89f5ff0473; gfkadpd=2906,33638; __security_mc_1_s_sdk_crypt_sdk=81484b36-4575-9c7a; __security_mc_1_s_sdk_cert_key=83b02ee5-4b1f-8076; passport_csrf_token=190d2d443dd7434e3f2c05ff1aa91288; passport_csrf_token_default=190d2d443dd7434e3f2c05ff1aa91288; biz_trace_id=4e9c3fce; sdk_source_info=7e276470716a68645a606960273f276364697660272927676c715a6d6069756077273f276364697660272927666d776a68605a607d71606b766c6a6b5a7666776c7571273f275e58272927666a6b766a69605a696c6061273f27636469766027292762696a6764695a7364776c6467696076273f275e5827292771273f273635353330333d3c32303632342778; bit_env=3tUQJ5YqVh-662_q_meZcH5iHOJwQiio_XqcTfJXFzptx07ZPHDNc5PEtKOkzfeLPdCwge-Ixh4XzVCzX4R6cUrNiZKGtlfYImRfubCKUwGTHr66RF5QIB7L2Nv5CismvbdV9-DEYRrNMDZE7M2Mh7_3piZfIjWaKCEJdxl1CUIvRAe6ks5Lrm9_8Ozb2gpm0zGFS0vf-SPKWRX0ovnFtsk1_U1oB2UV8wW4m4p_i59lP2eeIKXWXN7K9vra-iCpBJDeNiAqZi_jqfr_9ln2Py0q6TwieDllu_SnwcgxGTsChv1rVE_ez0IGU901pY6j-DE5VC5zG7HFoiza8Cz_GMJFoMYDuiKE4GW6S2Q_LU7D_SvypgKTZu3-0q05QVNbi7AsOFsqDAJ9UNPcJMRNxAssymfDWkX2UBU5u-jsUFE2G9NgbxLoh0dswVEfBYDJRQ18X0LhwV23tx_ulYRsNxmPn4yLCuwSJIZc1RmH1ZavRNMaBg_ARoVne55DGcRcWh8txMr0IGOnuvDNSjY3_3nW2VnfgcSEk9VSU4uwuJY%3D; gulu_source_res=eyJwX2luIjoiNThkYTc5OGM0MmRjZGQzNmQzNmFkYTA0MzhjZDNkZmZiMDM1ODdmNmEwZDg5NzkyNDFmZDcyN2QxYTViODkwYSJ9; passport_auth_mix_state=ucx4uhrw9z4refkoykruwhtnya22hufuefnad2ict0s3fspx; passport_assist_user=Cjx5jhYF6gdeI_3gTY_FFk-BYLGn5sJ24AjqWJba2uyBpnrzRpmr_j4lwZu-L2ALQVOXEynseTV_H8ZqR5EaSgo8F546kuYbgumsmsY0b8hKUsuK8a9ItuoD-9Wizcx1RVKgo5PSgcaRt_xmZS_1u6kWIcDvq8Nd0tKwFw3WEOje5Q0Yia_WVCABIgEDbWEK6w%3D%3D; sso_uid_tt=d00b610fde7433ac3817513b2a61cf85; sso_uid_tt_ss=d00b610fde7433ac3817513b2a61cf85; toutiao_sso_user=c573c7f1bdd40a062c556749b546e7b1; toutiao_sso_user_ss=c573c7f1bdd40a062c556749b546e7b1; sid_ucp_sso_v1=1.0.0-KDdiMzM3YWRlOTA2M2I0ZDY4ZTMxNWQzZGJlMmZiZGU3ODdiMzBlYzMKHQjUlrWVoAIQ99_YuwYY2hYgDDCJ4uPQBTgGQPQHGgJobCIgYzU3M2M3ZjFiZGQ0MGEwNjJjNTU2NzQ5YjU0NmU3YjE; ssid_ucp_sso_v1=1.0.0-KDdiMzM3YWRlOTA2M2I0ZDY4ZTMxNWQzZGJlMmZiZGU3ODdiMzBlYzMKHQjUlrWVoAIQ99_YuwYY2hYgDDCJ4uPQBTgGQPQHGgJobCIgYzU3M2M3ZjFiZGQ0MGEwNjJjNTU2NzQ5YjU0NmU3YjE; odin_tt=6b4b6adc410667b95516270e9118fb733c40d1ac07baeb31a7ea4a1e363be3e36b8fb101b03f6d28a044547e7d1580c8; passport_auth_status=fd7ee14a2dfc1e3452180d916b28bfa3%2C; passport_auth_status_ss=fd7ee14a2dfc1e3452180d916b28bfa3%2C; sid_guard=424458762f615d8877d978cd5778bca8%7C1735798777%7C5184000%7CMon%2C+03-Mar-2025+06%3A19%3A37+GMT; uid_tt=0bd7ad86e3280eb6a5994d840ab13ef5; uid_tt_ss=0bd7ad86e3280eb6a5994d840ab13ef5; sid_tt=424458762f615d8877d978cd5778bca8; sessionid=424458762f615d8877d978cd5778bca8; sessionid_ss=424458762f615d8877d978cd5778bca8; is_staff_user=false; sid_ucp_v1=1.0.0-KDVkODk1MTcyNmNmNTRjYWFiNTU0ODlhM2MxNGJiZjI0YTNkZDExZmIKGQjUlrWVoAIQ-d_YuwYY2hYgDDgGQPQHSAQaAmxmIiA0MjQ0NTg3NjJmNjE1ZDg4NzdkOTc4Y2Q1Nzc4YmNhOA; ssid_ucp_v1=1.0.0-KDVkODk1MTcyNmNmNTRjYWFiNTU0ODlhM2MxNGJiZjI0YTNkZDExZmIKGQjUlrWVoAIQ-d_YuwYY2hYgDDgGQPQHSAQaAmxmIiA0MjQ0NTg3NjJmNjE1ZDg4NzdkOTc4Y2Q1Nzc4YmNhOA; _tea_utm_cache_2906=undefined; csrf_session_id=caa5022d41afdce0f0efae89f5ff0473; _bd_ticket_crypt_doamin=2; _bd_ticket_crypt_cookie=1f643557c99cea0963b9e7242ce74111; __security_mc_1_s_sdk_sign_data_key_web_protect=26613e0f-4c34-895c; __security_server_data_status=1; ttwid=1%7CiKG5Oex8Lxb6Hc2Yb_lsBF5LaH_wgDqzUurocn4BK9w%7C1735798809%7Ceb5bff0b0fefea795b99847a344749549c889e5338b0a4bbe6e604cbdb335059; bd_ticket_guard_client_data=eyJiZC10aWNrZXQtZ3VhcmQtdmVyc2lvbiI6MiwiYmQtdGlja2V0LWd1YXJkLWl0ZXJhdGlvbi12ZXJzaW9uIjoxLCJiZC10aWNrZXQtZ3VhcmQtcmVlLXB1YmxpYy1rZXkiOiJCQ0tZaXUrYXM3WExJSEVuN1JxbEQ2STdSMHlPR0Y4T2JxVHVPaCtIa2lGYnA0TzNQK2VIMS8wMkppcGhWNUNYRXFSdFZOTkdVMVZvOVNHSjMyVGxHd0U9IiwiYmQtdGlja2V0LWd1YXJkLXdlYi12ZXJzaW9uIjoyfQ%3D%3D',
      // },
    ];

    //监听入库作品数据
    DataService.SyncDataService.eventCallBack.on(DataService.SyncDataService.eventNames.contentData, (data) => {
      console.log('作品数据', data);
    });
    //监听入库账号数据
    DataService.SyncDataService.eventCallBack.on(DataService.SyncDataService.eventNames.accountData, (data) => {
      console.log('账号数据', data);
    });
    //开始执行
    await DataService.SyncDataService.start(accountList, 8, 3);
    await Task.Delay(10 * 1000 * 10);
    // assets
  }, 10000000);
});
