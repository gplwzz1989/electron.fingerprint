import { describe, expect, test } from 'vitest';
import { EventEmitter } from 'events';
import { Baijiahao, Cloud, Platforms } from '../../../src';
import { BaiJiaHaoDynamicTaskInput } from '../../../src/media-platform/baijiahao/baijiahao-dynamic';
import { PubContentEnum } from '../../../src/cloud/model/TypeEnum';
import { Task } from '../../../src/utils';

describe.runIf(true)('【真实测试】', () => {
  test('百家号活动', async () => {
    const cookie =
      'theme=bjh; BAIDUID=4E0FC962692A2159EEB70823C5F85F64:FG=1; BAIDUID_BFESS=4E0FC962692A2159EEB70823C5F85F64:FG=1; BDUSS=AtV2syUVQxQkUwYXhDbzY4dXM4NC1UbGVVNUJmQTdzQzFZZEVBbVlRSm9LS1ZvSVFBQUFBJCQAAAAAAAAAAAEAAACYj7PqxMLT42RheQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGibfWhom31od3; BDUSS_BFESS=AtV2syUVQxQkUwYXhDbzY4dXM4NC1UbGVVNUJmQTdzQzFZZEVBbVlRSm9LS1ZvSVFBQUFBJCQAAAAAAAAAAAEAAACYj7PqxMLT42RheQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGibfWhom31od3; __bid_n=1982b3259f3929627ecd9d; PHPSESSID=78n30f0cnfk6ftjit14sbqopq5; ppfuid=FOCoIC3q5fKa8fgJnwzbE67EJ49BGJeplOzf+4l4EOvDuu2RXBRv6R3A1AZMa49I27C0gDDLrJyxcIIeAeEhD8JYsoLTpBiaCXhLqvzbzmvy3SeAW17tKgNq/Xx+RgOdb8TWCFe62MVrDTY6lMf2GrfqL8c87KLF2qFER3obJGnRPnrAdRzWz2cXL9q+Icxy62NM9rQl32fbT+RbwRjup+ti94/aebzvoussIeRnUjvXnHbhleo7Y9TqpkEyFV4CpKpNgGABXiP+0W+EqshNO4dWP+6GLLCgGWCAVHMIFRvSD3rH8JOudPxJORNS7SCt6rEeCerZiOC2HS/q3kWYbpA5RdGpipmODqHTwPvOqFLOQHvyhUQrrHDS6OPGdMUX5FnJNp5c2Cvgs1aHt7uhfUHv1DxZiH330Apc6oKkZo0Y6IJXad8xN1gQMZ1tOmckSecr9yhMSRLVoFktEC1isIoEUuh2L0ZKEXbxZOgmKXcFMb7+JFWxNGoA0JNiv6hCb0gkXpkEpISi6tVHh+hsQifjACGGz0MbLI9AAutvQNmLovQE8DrrUkOPSWZkiBwIUvxonSGS2lgiNZBxgK/Nad6P3sfvyvYhyXNwxm6SzH+Oja1l6cy9uoP7y446ILa1CLEOaV1jDkGoksNhRtn7B81CemkusdgER6aaUV34R4eGWiTUlCqdbf8oGHYcombWYX5RweDqStPwMzdS8AT76ygViv7lnF4xrYkhgSKNlMQwPkP86GfIbGCquGAObJfCou294/nZR7mpfc0ZPaB61buGGK/Nqbydyy5VRMY9E3z0CFai2ttXKypq/Loo0JrnLa7elPNSWU9pSPwamQJULfVlddlyjf2DSNdFaksc04YpQi9Awgg8unrypyhixqbwVqksZ1okMqQxKIZFYz8tMzZDiNeQT9xKCyi5pIFMa30nZL4/01GYZeql7Qjzv5qan7KSdu/hwDrm5vVP9Uw6tEtNjDznQmW+r3/wA4+ylTnWEx+WDzOjUGRWIcQYNHqw3oxcimP1vQ6HC8rDNEx2ov8eWtxPkJGqOFtWjIVteQYMsH/AaSJonqw+WLiZvGjYfm9p0alEyujapoTy77HzDcUoU1wUSXa5xS/Z6hXEr2OnLi0LdPVcGjz8lpLcdVeSfm9p0alEyujapoTy77HzDWf5PERRSTFqLd9BTUHLyY4Ji3EQLGQPaM1aeHxG1bJZH0s1Si/KwzTaTYzu6ziQiqwcr2kaYUiH+fMOxn69/BhNJVMhpQkhprc1KZuJRvXjppq0gKweencPxgS/jd0rjw==; HMACCOUNT=79FAA68A43063093; RECENT_LOGIN=0; XFI=bcb39670-65fe-11f0-98c3-e3f286fdeb45; XFCS=EC798419F4F3B16BCAF5992D45A581E240B7B1A723D671222A7A2D28F51EAF1E; XFT=UHbntaalt0Izh0HB6RVjDtv1/lzpub1p30HAMKcHFyA=; Hm_lvt_f7b8c775c6c8b6a716a75df506fb72df=1758075297; XFI=1dfb87e0-936c-11f0-ad17-5b6e8669a11b; XFT=joXE4p700ZWrX9Hz6JbVmoxl6cElA68AA4WI0O2Hl6M=; XFCS=7FBED5A4517B0FE94B1EA0E11F90D009CC964C6E18E38C1704AAF518FB76D83E; devStoken=b177f3ab92c0d2d71d02ab677e49036eba426a1dbcb62d20d94adf85807f1f42; bjhStoken=fdcab1807eaf2af4a6f64ecc105c804dba426a1dbcb62d20d94adf85807f1f42; Hm_lpvt_f7b8c775c6c8b6a716a75df506fb72df=1758094651; RT="z=1&dm=baidu.com&si=4f119af5-7337-4d6d-bdf6-2e3a3092676e&ss=mfnfjtj5&sl=0&tt=0&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf"';

    //const tokenResult = await getBaijiahaoBaseToken(cookie);

    const result = await Baijiahao.getBaijiahaoActivityList(cookie, 'microArticle');
    // assets
    console.log('百家号活动：', JSON.stringify(result, null, 2));
    expect(result.code).toBe(0);
  }, 10000000);
});

test('百家图文发布', async () => {
  const cookie =
    'BAIDUID=5FE81CF7AFAA4783749CF893D2C8EE19:FG=1; BAIDUID_BFESS=5FE81CF7AFAA4783749CF893D2C8EE19:FG=1; PHPSESSID=cujr9v246l005396bbh2njv395; theme=bjh; XFS=Nd%2FwPhcs0OR8p3CxPn%2FFR5mfrr9fA5U%2BJIs8eeNc1q4%3D; ppfuid=FOCoIC3q5fKa8fgJnwzbE67EJ49BGJeplOzf+4l4EOvDuu2RXBRv6R3A1AZMa49I27C0gDDLrJyxcIIeAeEhD8JYsoLTpBiaCXhLqvzbzmvy3SeAW17tKgNq/Xx+RgOdb8TWCFe62MVrDTY6lMf2Gixx7aLvAhqvNkvAJQDmQheTJbcu/AFainBdW3mPgxdz5OfNyUCwYGCwdaCAvb4zIAXiPbbFPDQVtPAPnuC7GKo4JBM7053Q+UyCTEj7Fgd4Qjf7Fwwxu/AI7RIzfKl8vlXuSd+bz+n+1d8dX5DnU9btRp3bqUFgYeNkP3aLQT5kYjAh8A8yft+s3B4RtKRu8VzjBYc3VZO8C3FJKPf/VpOiS8DHSHR/nhAJRNzx8LHyGWhocXrPp5Y8evA8e3q50dwS4aDQAkiFo5ICsCM8PWWioTSKU4nQaaWWJj1AnjrL+sma/I9in8l5AhdP95hxKdnTNS/pLMWceus0e757/UNlp6ejKpVpYqvC5R0tHOIbAAv3LCf1Y7/fHL3PTSf9vid/u2VLX4h1nBtx8EF07eCMhWVv+2qjbPV7ZhXk3reaWRFEeso3s/Kc9n/UXtUfNU1sHiCdbrCW5yYsuSM9SPGDZsl7FhTAKw7qIu38vFZiq+DRc8Vbf7jOiN9xPe0lOdZHUhGHZ82rL5jTCsILwcRVCndrarbwmu7G154MpYiKmTXZkqV7Alo4QZzicdyMbWvwvmR2/m//YVTM8qeZWgDSHjDmtehgLWM45zARbPujeqU0T92Gmgs89l2htrSKIan9AYlRrJmspRGnWVLZGjVuXk3Cf4ihuJII/iECNwCRko9Kr1p/AdwEaV0L74IvHZdImdyxYIjA1uSy2hfTFv/d3cnXH4nh+maaicAPllDgrppZTr0lDf2Vsiy73L8egP9ck5gsaaSE4obz9V1JGvyp8lNw+IyCN2Gou0efGgcYQBug3EYJEWCj3Pc/9aTWTdkWlrrMbxT1KilviimMUmBrGRChHnhPuJeIKACPXiVuli9ItRLEkdb1mLxNHAk3uJy88YX/Rf/sKUjR12zxRTDxxJNDJS+Dlsbqu3n4I65ujli/3rQ8Zk1MjmTOsz9+kTqOM4upsnQ6IWq/zeZTItMCgHpQhuhr4ip73honuzoJhfJJqPUSX01viD97GXfw7kf+R6as3JPAEXsdOdDsWEAgJn+ZMVrELI7pXz8Jko9Xv3uSDHo/C3kmFLrauvEYpUg3FbqEqM6JmRHqkwRhSJQp2TZ695APscnHWK3k1vm0zRszeYvFyXCPSuJ5oyoOgoCPKXE8fX73WOZ0mAlF1mc=; BDUSS=XBubFdJVEN2U0Y0VTNtYkl1Wm1Bbjl5UlkxZnlLS3h1SlVabjA3ZDF5VGh0aWRwRVFBQUFBJCQAAAAAAAAAAAEAAAAOHD9ManhyeTAwMDIxNgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOEpAGnhKQBpM; BDUSS_BFESS=XBubFdJVEN2U0Y0VTNtYkl1Wm1Bbjl5UlkxZnlLS3h1SlVabjA3ZDF5VGh0aWRwRVFBQUFBJCQAAAAAAAAAAAEAAAAOHD9ManhyeTAwMDIxNgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOEpAGnhKQBpM; RECENT_LOGIN=1; HMACCOUNT=335FE3C0372EF639; devStoken=f816238db0ba2d309e719946be003a0c35b15e47d07ea992a79d7b0ae93ac3f2; bjhStoken=5e685028ae67954c7cb73e0eb65811f235b15e47d07ea992a79d7b0ae93ac3f2; __bid_n=19b0d1683089216607e3b0; Hm_lvt_f7b8c775c6c8b6a716a75df506fb72df=1765451289; Hm_lpvt_f7b8c775c6c8b6a716a75df506fb72df=1765451289; MBDFEEDSG=80d66fad628ec6dc189ab3504600e993_1765451303; ab_sr=1.0.1_ZGVkNTRjNTc4MzBjZTU5ZDQ4MzcyNTJkOGY2ZjQ2ZWVmZTUwOTdiMTEyNWUyYTUyY2QxZGI5Mzc4ZTJkODJjNjgwNWRjZTAyYzY0NDkxNGNkMWQxMGRkMmM1M2ZmNWRlM2U4ZTVkMDZiYzlkMzc3YzAyOTJkM2E1ZjI0NDlkNmJiOTliNWU5OGIxYjUxYTc1MGQxNWIwYjFkNjNjYWY4Zg==; RT="z=1&dm=baidu.com&si=443233de-6c11-46da-bb0f-34d4713a8114&ss=mj1c12mx&sl=b&tt=gm4&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf&ld=3msq&nu=3egnthvf&cl=39ml"';
  const params: BaiJiaHaoDynamicTaskInput = {
    taskId: '1728003741082443776',
    cover: {
      height: 0,
      pathOrUrl: 'https://yixiaoer-image-oss.yixiaoer.cn/20250702/8d34d4e7-7488-47dd-879e-37bc158fd05e.jpg',
      size: 0,
      width: 0,
    },
    images: [
      {
        pathOrUrl: 'https://yixiaoer-image-oss.yixiaoer.cn/20250702/32be9be4-b443-451f-bd45-f4dda4dcfa15.jpg',
      },
      {
        pathOrUrl: 'https://yixiaoer-image-oss.yixiaoer.cn/20250702/0dd572d2-004a-42d1-bfdc-9ce4b7716027.jpg',
      },
      {
        pathOrUrl: 'https://yixiaoer-image-oss.yixiaoer.cn/20250702/8d34d4e7-7488-47dd-879e-37bc158fd05e.jpg',
      },
    ],
    isAigc: false,
    desc: '<p>对同行残忍<topic text="搞笑" raw="{&quot;id&quot;:0,&quot;cha_name&quot;:&quot;沟通&quot;,&quot;status&quot;:1}"></topic>就是对<friend raw="{&quot;userId&quot;:1317651205,&quot;nickname&quot;:&quot;尽心无悔907❤️&quot;,&quot;fansCount&quot;:0,&quot;headUrl&quot;:&quot;&quot;}"></friend>自己仁慈</p>',
  };

  // params.mix_id = '42121223112312';
  // params.mix_order = 0;
  const eventCall = new EventEmitter();
  eventCall.on('publishing', (per, msg) => {
    console.log(`${per}-${msg}`);
  });
  const result = await Baijiahao.publishDynamic(cookie, params, 0, '', eventCall);
  console.log('百家图文发布：', result);
}, 10000000);

test('百家图文状态查询', async () => {
  const cookie =
    'RECENT_LOGIN=0; RECENT_LOGIN=0; XFI=963521a0-5332-11f0-8557-6f1d1d29d089; XFI=963521a0-5332-11f0-8557-6f1d1d29d089; XFCS=74F80605C47F303A5956632BEB8827A61E2A174FDA0A5858E5EF9CF3DE171031; XFCS=74F80605C47F303A5956632BEB8827A61E2A174FDA0A5858E5EF9CF3DE171031; BAIDUID=1E18DC30A13C37FCA7BE0677BB3B4ECD:FG=1; BAIDUID_BFESS=1E18DC30A13C37FCA7BE0677BB3B4ECD:FG=1; theme=bjh; PHPSESSID=seiosq21bac4360jkg8l8lmj75; PHPSESSID=seiosq21bac4360jkg8l8lmj75; ppfuid=FOCoIC3q5fKa8fgJnwzbE67EJ49BGJeplOzf+4l4EOvDuu2RXBRv6R3A1AZMa49I27C0gDDLrJyxcIIeAeEhD8JYsoLTpBiaCXhLqvzbzmvy3SeAW17tKgNq/Xx+RgOdb8TWCFe62MVrDTY6lMf2GrfqL8c87KLF2qFER3obJGmxmYcRxjc0nkx8EFDwF2WPFQ+UXgnkKFgFie+Z8z19dOti94/aebzvoussIeRnUjsp/n9fFPmunRZkgZZX81RXqGvpYSsWB83BCHBoL4uwVZvdicvlaaj/EU2gI/DbqBbSD3rH8JOudPxJORNS7SCt6rEeCerZiOC2HS/q3kWYbpA5RdGpipmODqHTwPvOqFLOQHvyhUQrrHDS6OPGdMUX5FnJNp5c2Cvgs1aHt7uhfWP4kyNq1GSn4oCX2UcCf6pBXPbwIPaqwGt1Mt3Eb9rnSecr9yhMSRLVoFktEC1isH7iwCnXPPB0SobvU7X/A7kFMb7+JFWxNGoA0JNiv6hCb0gkXpkEpISi6tVHh+hsQifjACGGz0MbLI9AAutvQNmLovQE8DrrUkOPSWZkiBwIUvxonSGS2lgiNZBxgK/Nad6P3sfvyvYhyXNwxm6SzH+Oja1l6cy9uoP7y446ILa1CLEOaV1jDkGoksNhRtn7B81CemkusdgER6aaUV34R4eGWiTUlCqdbf8oGHYcombWYX5RweDqStPwMzdS8AT76ygViv7lnF4xrYkhgSKNlMQwPkP86GfIbGCquGAObJfCYkWzbhpEMafq8Amle/PqYL0JOuH11AVQp/mkbZQeq+PwWbdRVYUN5dsKbr5SzEyBLa7elPNSWU9pSPwamQJULfVlddlyjf2DSNdFaksc04b/VWExfB29+0/cixuio4XrC/YQPbe/eXOYkOWEDCDut2vE1x9M/4Pzds3G/ghwrJOU4yMp72LTzOOrJ6QBGMchB+HGQ6trr+1zpyaeDCUI0jzkovG4kdAIyuxdvhnpBOcuRCO3PwUSWeipr32kg7rh+26VQGmUjUFB9qdWM7cM+xhEMNzi6OXbElHkA3erw54tXrxfzO8r5i/hVAMD5lmRW7zauvTts98AVvqIMSVA8vSA4Tm4Z6OA+zAWRuAfqTZYRlp9I4pEOc85gAEpZ4sd1dl7ZsDQM77UWVHypv4+aIVxlWi6jkMK+VCGNGG+ki2NSHb/I1/IeOdtnUD+FFEjsEVUO27UponOPHnWdM3X7FUjxzui04WbenLVj7Cu3YJ8jm/klJ3aRE1kTuzptCsDnIwjfVJ9QODEOux3qU+1RQ==; BDUSS=h5bmt5N2o5eHNSOVFiMmRFTUFWZWUtZUQxNm96TW11S29QdjVaZUJLdFE1b1ZvSUFBQUFBJCQAAAAAAAAAAAEAAABdGAzMyrLDtM62tcC1xLnP19MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFBZXmhQWV5oRl; BDUSS_BFESS=h5bmt5N2o5eHNSOVFiMmRFTUFWZWUtZUQxNm96TW11S29QdjVaZUJLdFE1b1ZvSUFBQUFBJCQAAAAAAAAAAAEAAABdGAzMyrLDtM62tcC1xLnP19MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFBZXmhQWV5oRl; RECENT_LOGIN=1; RECENT_LOGIN=1; Hm_lvt_f7b8c775c6c8b6a716a75df506fb72df=1751013715; HMACCOUNT=347FE50A47FD7F1A; Hm_ck_1751013714755=42; __bid_n=197b08cf1828592234d952; RT="z=1&dm=baidu.com&si=4cb45979-bde7-4151-b5da-f8797ab74aa8&ss=mcekc5m0&sl=4&tt=43j&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf"; Hm_lpvt_f7b8c775c6c8b6a716a75df506fb72df=1751013717; Hm_ck_1751013716924=42; devStoken=78760e137c3ca7ffa799e7bfcf934caa0fbd3bd26f1c2f093c422acc30d7edca; bjhStoken=5332b5de75014169306c1c2cceb2c7600fbd3bd26f1c2f093c422acc30d7edca';

  const result = await Baijiahao.getBaijiahaoDynamicStatus(cookie, '5292055731495172223');
  console.log('百家图文状态：', result);
}, 10000000);

test('百家图文删除', async () => {
  const cookie =
    'RECENT_LOGIN=0; RECENT_LOGIN=0; XFI=963521a0-5332-11f0-8557-6f1d1d29d089; XFI=963521a0-5332-11f0-8557-6f1d1d29d089; XFCS=74F80605C47F303A5956632BEB8827A61E2A174FDA0A5858E5EF9CF3DE171031; XFCS=74F80605C47F303A5956632BEB8827A61E2A174FDA0A5858E5EF9CF3DE171031; BAIDUID=1E18DC30A13C37FCA7BE0677BB3B4ECD:FG=1; BAIDUID_BFESS=1E18DC30A13C37FCA7BE0677BB3B4ECD:FG=1; theme=bjh; PHPSESSID=seiosq21bac4360jkg8l8lmj75; PHPSESSID=seiosq21bac4360jkg8l8lmj75; ppfuid=FOCoIC3q5fKa8fgJnwzbE67EJ49BGJeplOzf+4l4EOvDuu2RXBRv6R3A1AZMa49I27C0gDDLrJyxcIIeAeEhD8JYsoLTpBiaCXhLqvzbzmvy3SeAW17tKgNq/Xx+RgOdb8TWCFe62MVrDTY6lMf2GrfqL8c87KLF2qFER3obJGmxmYcRxjc0nkx8EFDwF2WPFQ+UXgnkKFgFie+Z8z19dOti94/aebzvoussIeRnUjsp/n9fFPmunRZkgZZX81RXqGvpYSsWB83BCHBoL4uwVZvdicvlaaj/EU2gI/DbqBbSD3rH8JOudPxJORNS7SCt6rEeCerZiOC2HS/q3kWYbpA5RdGpipmODqHTwPvOqFLOQHvyhUQrrHDS6OPGdMUX5FnJNp5c2Cvgs1aHt7uhfWP4kyNq1GSn4oCX2UcCf6pBXPbwIPaqwGt1Mt3Eb9rnSecr9yhMSRLVoFktEC1isH7iwCnXPPB0SobvU7X/A7kFMb7+JFWxNGoA0JNiv6hCb0gkXpkEpISi6tVHh+hsQifjACGGz0MbLI9AAutvQNmLovQE8DrrUkOPSWZkiBwIUvxonSGS2lgiNZBxgK/Nad6P3sfvyvYhyXNwxm6SzH+Oja1l6cy9uoP7y446ILa1CLEOaV1jDkGoksNhRtn7B81CemkusdgER6aaUV34R4eGWiTUlCqdbf8oGHYcombWYX5RweDqStPwMzdS8AT76ygViv7lnF4xrYkhgSKNlMQwPkP86GfIbGCquGAObJfCYkWzbhpEMafq8Amle/PqYL0JOuH11AVQp/mkbZQeq+PwWbdRVYUN5dsKbr5SzEyBLa7elPNSWU9pSPwamQJULfVlddlyjf2DSNdFaksc04b/VWExfB29+0/cixuio4XrC/YQPbe/eXOYkOWEDCDut2vE1x9M/4Pzds3G/ghwrJOU4yMp72LTzOOrJ6QBGMchB+HGQ6trr+1zpyaeDCUI0jzkovG4kdAIyuxdvhnpBOcuRCO3PwUSWeipr32kg7rh+26VQGmUjUFB9qdWM7cM+xhEMNzi6OXbElHkA3erw54tXrxfzO8r5i/hVAMD5lmRW7zauvTts98AVvqIMSVA8vSA4Tm4Z6OA+zAWRuAfqTZYRlp9I4pEOc85gAEpZ4sd1dl7ZsDQM77UWVHypv4+aIVxlWi6jkMK+VCGNGG+ki2NSHb/I1/IeOdtnUD+FFEjsEVUO27UponOPHnWdM3X7FUjxzui04WbenLVj7Cu3YJ8jm/klJ3aRE1kTuzptCsDnIwjfVJ9QODEOux3qU+1RQ==; BDUSS=h5bmt5N2o5eHNSOVFiMmRFTUFWZWUtZUQxNm96TW11S29QdjVaZUJLdFE1b1ZvSUFBQUFBJCQAAAAAAAAAAAEAAABdGAzMyrLDtM62tcC1xLnP19MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFBZXmhQWV5oRl; BDUSS_BFESS=h5bmt5N2o5eHNSOVFiMmRFTUFWZWUtZUQxNm96TW11S29QdjVaZUJLdFE1b1ZvSUFBQUFBJCQAAAAAAAAAAAEAAABdGAzMyrLDtM62tcC1xLnP19MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFBZXmhQWV5oRl; RECENT_LOGIN=1; RECENT_LOGIN=1; Hm_lvt_f7b8c775c6c8b6a716a75df506fb72df=1751013715; HMACCOUNT=347FE50A47FD7F1A; Hm_ck_1751013714755=42; __bid_n=197b08cf1828592234d952; RT="z=1&dm=baidu.com&si=4cb45979-bde7-4151-b5da-f8797ab74aa8&ss=mcekc5m0&sl=4&tt=43j&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf"; Hm_lpvt_f7b8c775c6c8b6a716a75df506fb72df=1751013717; Hm_ck_1751013716924=42; devStoken=78760e137c3ca7ffa799e7bfcf934caa0fbd3bd26f1c2f093c422acc30d7edca; bjhStoken=5332b5de75014169306c1c2cceb2c7600fbd3bd26f1c2f093c422acc30d7edca';

  const result = await Baijiahao.deleteBaijiahaoContent(cookie, PubContentEnum.dynamic, '4408898202093658723');
  console.log('百家图文删除：', result);
}, 10000000);

describe.runIf(true)('【新版发布流程】', () => {
  test(
    '新动态发布',
    async () => {
      const result = Cloud.pushOpenPlatformPublishTask(
        {
          publishType: 'dynamic',
          authorization: '1231231',
          platform: [
            {
              id: '81231231237',
              platformAvatar: '',
              platformUserId: '',
              platformUserName: '',
              platformCode: Platforms.BaiJiaHao,
              platformCookie:
                'theme=bjh; BAIDUID=4E0FC962692A2159EEB70823C5F85F64:FG=1; BAIDUID_BFESS=4E0FC962692A2159EEB70823C5F85F64:FG=1; BDUSS=AtV2syUVQxQkUwYXhDbzY4dXM4NC1UbGVVNUJmQTdzQzFZZEVBbVlRSm9LS1ZvSVFBQUFBJCQAAAAAAAAAAAEAAACYj7PqxMLT42RheQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGibfWhom31od3; BDUSS_BFESS=AtV2syUVQxQkUwYXhDbzY4dXM4NC1UbGVVNUJmQTdzQzFZZEVBbVlRSm9LS1ZvSVFBQUFBJCQAAAAAAAAAAAEAAACYj7PqxMLT42RheQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGibfWhom31od3; __bid_n=1982b3259f3929627ecd9d; PHPSESSID=78n30f0cnfk6ftjit14sbqopq5; ppfuid=FOCoIC3q5fKa8fgJnwzbE67EJ49BGJeplOzf+4l4EOvDuu2RXBRv6R3A1AZMa49I27C0gDDLrJyxcIIeAeEhD8JYsoLTpBiaCXhLqvzbzmvy3SeAW17tKgNq/Xx+RgOdb8TWCFe62MVrDTY6lMf2GrfqL8c87KLF2qFER3obJGnRPnrAdRzWz2cXL9q+Icxy62NM9rQl32fbT+RbwRjup+ti94/aebzvoussIeRnUjvXnHbhleo7Y9TqpkEyFV4CpKpNgGABXiP+0W+EqshNO4dWP+6GLLCgGWCAVHMIFRvSD3rH8JOudPxJORNS7SCt6rEeCerZiOC2HS/q3kWYbpA5RdGpipmODqHTwPvOqFLOQHvyhUQrrHDS6OPGdMUX5FnJNp5c2Cvgs1aHt7uhfUHv1DxZiH330Apc6oKkZo0Y6IJXad8xN1gQMZ1tOmckSecr9yhMSRLVoFktEC1isIoEUuh2L0ZKEXbxZOgmKXcFMb7+JFWxNGoA0JNiv6hCb0gkXpkEpISi6tVHh+hsQifjACGGz0MbLI9AAutvQNmLovQE8DrrUkOPSWZkiBwIUvxonSGS2lgiNZBxgK/Nad6P3sfvyvYhyXNwxm6SzH+Oja1l6cy9uoP7y446ILa1CLEOaV1jDkGoksNhRtn7B81CemkusdgER6aaUV34R4eGWiTUlCqdbf8oGHYcombWYX5RweDqStPwMzdS8AT76ygViv7lnF4xrYkhgSKNlMQwPkP86GfIbGCquGAObJfCou294/nZR7mpfc0ZPaB61buGGK/Nqbydyy5VRMY9E3z0CFai2ttXKypq/Loo0JrnLa7elPNSWU9pSPwamQJULfVlddlyjf2DSNdFaksc04YpQi9Awgg8unrypyhixqbwVqksZ1okMqQxKIZFYz8tMzZDiNeQT9xKCyi5pIFMa30nZL4/01GYZeql7Qjzv5qan7KSdu/hwDrm5vVP9Uw6tEtNjDznQmW+r3/wA4+ylTnWEx+WDzOjUGRWIcQYNHqw3oxcimP1vQ6HC8rDNEx2ov8eWtxPkJGqOFtWjIVteQYMsH/AaSJonqw+WLiZvGjYfm9p0alEyujapoTy77HzDcUoU1wUSXa5xS/Z6hXEr2OnLi0LdPVcGjz8lpLcdVeSfm9p0alEyujapoTy77HzDWf5PERRSTFqLd9BTUHLyY4Ji3EQLGQPaM1aeHxG1bJZH0s1Si/KwzTaTYzu6ziQiqwcr2kaYUiH+fMOxn69/BhNJVMhpQkhprc1KZuJRvXjppq0gKweencPxgS/jd0rjw==; HMACCOUNT=79FAA68A43063093; RECENT_LOGIN=0; XFI=bcb39670-65fe-11f0-98c3-e3f286fdeb45; XFCS=EC798419F4F3B16BCAF5992D45A581E240B7B1A723D671222A7A2D28F51EAF1E; XFT=UHbntaalt0Izh0HB6RVjDtv1/lzpub1p30HAMKcHFyA=; Hm_lvt_f7b8c775c6c8b6a716a75df506fb72df=1758075297; XFI=1dfb87e0-936c-11f0-ad17-5b6e8669a11b; XFT=joXE4p700ZWrX9Hz6JbVmoxl6cElA68AA4WI0O2Hl6M=; XFCS=7FBED5A4517B0FE94B1EA0E11F90D009CC964C6E18E38C1704AAF518FB76D83E; devStoken=b177f3ab92c0d2d71d02ab677e49036eba426a1dbcb62d20d94adf85807f1f42; bjhStoken=fdcab1807eaf2af4a6f64ecc105c804dba426a1dbcb62d20d94adf85807f1f42; Hm_lpvt_f7b8c775c6c8b6a716a75df506fb72df=1758094651; RT="z=1&dm=baidu.com&si=4f119af5-7337-4d6d-bdf6-2e3a3092676e&ss=mfnfjtj5&sl=0&tt=0&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf"',
            },
          ],
          tasks: [
            {
              taskId: '7',
              authorInfo: {
                platform: Platforms.BaiJiaHao,
                id: '81231231237',
                cookie: '',
                authorId: '',
              },
              publishData: {
                covers: [
                  {
                    pathOrUrl: 'I:\\download\\20250707-171022.jpg',
                    width: 1024,
                    height: 768,
                    size: 123,
                  },
                ],
                images:[{
                  pathOrUrl: 'I:\\download\\20250707-171022.jpg',
                  width: 1024,
                  height: 768,
                  size: 123,
                }],
                title: '我是标题啊',
                desc: '有什么活动啊',
                visibleType: 0,
                activity: {
                  yixiaoerId: '1601673',
                  yixiaoerName: '百度带货夏令营',
                  yixiaoerDesc: '现金激励',
                  yixiaoerImageUrl: 'https://pic.rmb.bdstatic.com/gomis/upload_excel/20250801-115405.1234.jpg',
                  viewNum: 32853,
                  raw: {
                    id: '1601673',
                    task_name: '百度带货夏令营',
                    brief_image: 'https://pic.rmb.bdstatic.com/gomis/upload_excel/20250801-115405.1234.jpg',
                    is_inspire: 0,
                    participant_num: 32853,
                    task_type: '1',
                    task_subtitle: '带货达人养成计划',
                    reward_description: '现金激励',
                    task_url: 'https://baijiahao.baidu.com/builder/na/taskSquare/article?taskId=1601673',
                    has_perm: 1,
                    task_character: '2',
                    remain_time: 116247,
                    topic_list: [
                      {
                        id: '175402060819556713',
                        title: '百度带货夏令营',
                      },
                    ],
                    is_need: 0,
                    task_origin: 'market',
                    start_time: 1754841600,
                    task_star_type: '1',
                    tiaozhan_info: null,
                    claim_award_location: '',
                    activity_link: '',
                    article_cash_info: true,
                    scheme: 'https://baijiahao.baidu.com/builder/na/taskSquare/article?taskId=1601673',
                    collection: 0,
                    task_tag: 'task_open,task_hot',
                  },
                },
              },
            },
          ],
          callBackData: {},
          publishChannel: '',
          clientId: '',
        },
        '123',
      );
      console.log(JSON.stringify(result, null, 2));
      await Task.Delay(40 * 60 * 1000);
    },
    40 * 60 * 1000,
  );
});