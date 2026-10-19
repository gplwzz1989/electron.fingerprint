import { describe, expect, it, test } from 'vitest';
import {
  checkLogin,
  getXinlangweiboSchedulePostFrequency,
  getXinlangweiboUserInfo, searchXinlangweiboPublicAuthorList,
} from '@/media-platform/xinlangweibo/xinlangweibo-common';
import {
  XinlangweiboMicroArticleTaskInput,
  xinlangweiboPublishMicroArticle,
} from '@/media-platform/xinlangweibo/xinlangweibo-micro-article-service';
import { EventEmitter } from 'events';
import { getUserHomeDataAsync } from '@/media-platform/xinlangweibo/xinlangweibo-user.service';
import { AccountService, Cloud, Platforms, searchXinlangweiboPublicWorkList } from '../../../src';
import { Xinlangweibo} from '../../../src/media-platform/xinlangweibo';
import { convertCookieStr } from '../../../src/utils';

describe.runIf(true)('获取新浪微博用户信息', () => {
  it('有效检测', async () => {
    // Mock the cookie or provide a valid one for testing
    const cookie = convertCookieStr(
      'SCF=AsPFLZFtvZ8KZJhOkXDXXLUsgpWi-IH_DzcgGvmTPz35ahMO5Z0rF0xKGLGuhlOAtUv_LeSw8NiDRi6QNQ5MEts.; SUB=_2A25HmxVSDeRhGedH6FoT-S_IwzuIHXVk2SiarDV8PUNbmtANLUfHkW9NUKlckjaLGAN8yDxfxNMzl2EsgPPgjU7Y; SUBP=0033WrSXqPxfM725Ws9jqgMF55529P9D9WFZoHfG_g9rORszupA9X7GO5JpX5KzhUgL.Fo24e0nE1K2X1hM2dJLoIEBLxKqL1h.L12BLxK-L1KeLBK-LxKnLBo5L1hnLxK-LB.qL1het; ALF=02_1791422978; XSRF-TOKEN=qHg-8D7WlU9hab0Nhj1toVIr; WBPSESS=nvMUbyJW9mCARtk-ziczRAibzxWshA-Bf5RqMOYtvpZIWnrGvelpM61FbVSYpEDV3DBKUSBGvrWTCHCvF1Dw4CXwPozdliy2Lou_1L_KFmjr2nFmfNEMtqvaY5q2GpzQg5--pJRKLlueo6eYW8lZ0A==',
      'weibo.com',
    );

    //const checkWorker = new AccountService(cookie, Platforms.XinLangWeiBo);
    //console.log('是否有效:', await checkLogin(cookie));
    // Call the function
    const result = await getXinlangweiboUserInfo(cookie);

    console.log(result);
    // Assert the result
    // expect(result.code).toBe(0);
    // expect(result.msg).toBe('ok');
    // You can add more assertions based on the expected behavior
  });
});

describe.runIf(true)('搜索新浪微博作者列表', () => {
  it('搜索作者列表', async () => {
    const cookie = convertCookieStr(
      '[{"name":"tid","value":"01AYTzlPPB2PjpsT2bWKiflecdCTFpL_1hKXgzay8iKXjq","domain":"passport.weibo.com","hostOnly":true,"path":"/visitor","secure":false,"httpOnly":false,"session":false,"expirationDate":1783336790,"sameSite":"unspecified"},{"name":"SCF","value":"AiRxHD-8OFoaEmbPa5YTvB7HMWqTz1rjmZtsbmLqG5vrTBZeYCsw_wB3X58zHPWMaTISN0NwEDy4Ft-nIbKJ8X0.","domain":".weibo.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1776999475.142628,"sameSite":"no_restriction"},{"name":"SINAGLOBAL","value":"7632103368820.031.1743072963898","domain":".weibo.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1777632963.899162,"sameSite":"unspecified"},{"name":"SRT","value":"D.QqHBJZPFTmsJR!Mb4cYGS4uKisSB4ZYDJruuT8sHNEYdUNsFUsMpMERt4EP1RckKAdHJ4cSsTsVoObi8RqYGMdSmU-Y!PNs8QsH8UOEF4b9lSduqS!boPZSo*B.vAflW-P9Rc0lR-ykZDvnJqiQVbiRVPBtS!r3JZPQVqbgVdWiMZ4siOzu4DbmKPWfNeBKRdWLPFShTZY3T4okd4ysPcPTi49ndDPIOdYPSrnlMc0kJEi65ZWbTFPnS4kbJcM1OFyHM4HJ5mjkOmHII4oCU3EJ5mkiODEfU!oCU-uJ5mjlOmzkJ!noNqHJ5mkiODEfI!noIQ9r","domain":".passport.weibo.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1787824779.986598,"sameSite":"no_restriction"},{"name":"SRF","value":"1753264779","domain":".passport.weibo.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1787824779.986634,"sameSite":"no_restriction"},{"name":"ULV","value":"1743072964003:1:1:1:7632103368820.031.1743072963898:","domain":".weibo.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1774176964,"sameSite":"unspecified"},{"name":"XSRF-TOKEN","value":"MQi-2urLQavIYQZXQeETnVbr","domain":".me.weibo.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"tgc","value":"TGT-NTM2MjAwMzExMw==-1753264779-wq-5E410830855E0E2DCC382139E3412D8A-1","domain":".login.sina.com.cn","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":true,"sameSite":"no_restriction"},{"name":"LT","value":"1753264779","domain":".login.sina.com.cn","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"SUBP","value":"0033WrSXqPxfM725Ws9jqgMF55529P9D9WhJpNagOTfkj8wiLmYOuVeZ5JpX5KzhUgL.Fo-0Soz7ehepeKe2dJLoIEBLxK-LBK-LBoqLxKML1hnLBonLxK.LB-2L1K2LxKML1h.L1-zt","domain":".weibo.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1787125182.557804,"sameSite":"no_restriction"},{"name":"SUBP","value":"0033WrSXqPxfM725Ws9jqgMF55529P9D9WhJpNagOTfkj8wiLmYOuVeZ5NHD95Qfe0qEeh50eK20Ws4Dqcj.i--fi-2fi-zci--NiKnRi-zRi--4i-8WiK.pi--NiKn4iKLF","domain":".weibo.cn","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1787125182.795325,"sameSite":"no_restriction"},{"name":"XSRF-TOKEN","value":"aFL_72jYpydK2nE7qbHg9Fxn","domain":"weibo.com","hostOnly":true,"path":"/","secure":true,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"X-CSRF-TOKEN","value":"CK-YcoFwc_4iC_EmJXE9EWvvCXBKp_IRCHDsp_FzCoERca5HCo4=","domain":".passport.weibo.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"SUB","value":"_2A25FoFpuDeRhGeNN7VAR8C3Nyj-IHXVm3NOmrDV8PUNbmtAbLUj9kW9NSbc8GH1ww6jXqmwYNfDzjEEu0ufye8iH","domain":".weibo.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1787125182.557732,"sameSite":"no_restriction"},{"name":"ALC","value":"ALC-5QSpXb-1755589182-4-1415499657-3405568f8eb2bd8d0d32fcdc40fd-2","domain":".passport.weibo.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1758181182.557832,"sameSite":"no_restriction"},{"name":"ALF","value":"02_1758181182","domain":".weibo.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1758181182.557856,"sameSite":"unspecified"},{"name":"ALF","value":"02_1758181183","domain":".sina.com.cn","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1758181182.703614,"sameSite":"unspecified"},{"name":"ALC","value":"ALC-5QSpXb-1755589183-6-530681316-2b7f4b51ddcde87e992279079934-2","domain":".login.sina.com.cn","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1758181182.703579,"sameSite":"no_restriction"},{"name":"SCF","value":"AiRxHD-8OFoaEmbPa5YTvB7HMWqTz1rjmZtsbmLqG5vrW3CVPi_kh5wBOW6Cr8eugHulAz3RrUO01o9T8__WHDY.","domain":".sina.com.cn","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1790149183.703652,"sameSite":"no_restriction"},{"name":"SUB","value":"_2A25FoFpvDeRhGeNN7VAR8C3Nyj-IHXVm3NOnrDV_PUJbkNAYLXeskW9NSbc8GDpqdNVZPg0UvaRu_tJwXJ6Dd9Qm","domain":".sina.com.cn","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1787125182.703676,"sameSite":"no_restriction"},{"name":"SUBP","value":"0033WrSXqPxfM725Ws9jqgMF55529P9D9WhJpNagOTfkj8wiLmYOuVeZ5NHD95Qfe0qEeh50eK20Ws4Dqcj.i--fi-2fi-zci--NiKnRi-zRi--4i-8WiK.pi--NiKn4iKLF","domain":".sina.com.cn","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1756193982.7037,"sameSite":"no_restriction"},{"name":"SCF","value":"AiRxHD-8OFoaEmbPa5YTvB7HMWqTz1rjmZtsbmLqG5vrW3CVPi_kh5wBOW6Cr8eugE5-buf71bDdiIXUbs49qXY.","domain":".weibo.cn","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1790149183.795241,"sameSite":"no_restriction"},{"name":"SUB","value":"_2A25FoFpvDeRhGeNN7VAR8C3Nyj-IHXVm3NOnrDV6PUJbktAYLW3kkW1NSbc8GDIWspq0qxOYtpa2bB6GdYqNeGcP","domain":".weibo.cn","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1787125182.795305,"sameSite":"no_restriction"},{"name":"SSOLoginState","value":"1755589183","domain":".weibo.cn","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":true,"sameSite":"no_restriction"},{"name":"ALF","value":"1758181183","domain":".weibo.cn","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1758181182.795364,"sameSite":"no_restriction"},{"name":"WBPSESS","value":"NHDq0lzsaBJqFsTL9scgp5C2LIKi_mtLzO5uhMx0f9jQT1FBHX-GMvnWjWOjnB36kb0VLyl_oe7I6kh6VcT976ksw5xrvh4PWoP_Fgf3KsQLCCm5IU2CQ3pJATNwS2mza5x-2eTtwCkVVDiqIM0cVw==","domain":"weibo.com","hostOnly":true,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1755675584.116415,"sameSite":"unspecified"}]',
      'weibo.com',
    );

    const result = await searchXinlangweiboPublicAuthorList('人民日报');

    console.log(JSON.stringify(result, null, 2));
  });
});

describe.runIf(true)('搜索新浪微博作品列表', () => {
  it('搜索作品列表', async () => {
    const cookie = convertCookieStr(
      '[{"name":"tid","value":"01AYTzlPPB2PjpsT2bWKiflecdCTFpL_1hKXgzay8iKXjq","domain":"passport.weibo.com","hostOnly":true,"path":"/visitor","secure":false,"httpOnly":false,"session":false,"expirationDate":1783336790,"sameSite":"unspecified"},{"name":"SCF","value":"AiRxHD-8OFoaEmbPa5YTvB7HMWqTz1rjmZtsbmLqG5vrTBZeYCsw_wB3X58zHPWMaTISN0NwEDy4Ft-nIbKJ8X0.","domain":".weibo.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1776999475.142628,"sameSite":"no_restriction"},{"name":"SINAGLOBAL","value":"7632103368820.031.1743072963898","domain":".weibo.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1777632963.899162,"sameSite":"unspecified"},{"name":"SRT","value":"D.QqHBJZPFTmsJR!Mb4cYGS4uKisSB4ZYDJruuT8sHNEYdUNsFUsMpMERt4EP1RckKAdHJ4cSsTsVoObi8RqYGMdSmU-Y!PNs8QsH8UOEF4b9lSduqS!boPZSo*B.vAflW-P9Rc0lR-ykZDvnJqiQVbiRVPBtS!r3JZPQVqbgVdWiMZ4siOzu4DbmKPWfNeBKRdWLPFShTZY3T4okd4ysPcPTi49ndDPIOdYPSrnlMc0kJEi65ZWbTFPnS4kbJcM1OFyHM4HJ5mjkOmHII4oCU3EJ5mkiODEfU!oCU-uJ5mjlOmzkJ!noNqHJ5mkiODEfI!noIQ9r","domain":".passport.weibo.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1787824779.986598,"sameSite":"no_restriction"},{"name":"SRF","value":"1753264779","domain":".passport.weibo.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1787824779.986634,"sameSite":"no_restriction"},{"name":"ULV","value":"1743072964003:1:1:1:7632103368820.031.1743072963898:","domain":".weibo.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1774176964,"sameSite":"unspecified"},{"name":"XSRF-TOKEN","value":"MQi-2urLQavIYQZXQeETnVbr","domain":".me.weibo.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"tgc","value":"TGT-NTM2MjAwMzExMw==-1753264779-wq-5E410830855E0E2DCC382139E3412D8A-1","domain":".login.sina.com.cn","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":true,"sameSite":"no_restriction"},{"name":"LT","value":"1753264779","domain":".login.sina.com.cn","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"SUBP","value":"0033WrSXqPxfM725Ws9jqgMF55529P9D9WhJpNagOTfkj8wiLmYOuVeZ5JpX5KzhUgL.Fo-0Soz7ehepeKe2dJLoIEBLxK-LBK-LBoqLxKML1hnLBonLxK.LB-2L1K2LxKML1h.L1-zt","domain":".weibo.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1787125182.557804,"sameSite":"no_restriction"},{"name":"SUBP","value":"0033WrSXqPxfM725Ws9jqgMF55529P9D9WhJpNagOTfkj8wiLmYOuVeZ5NHD95Qfe0qEeh50eK20Ws4Dqcj.i--fi-2fi-zci--NiKnRi-zRi--4i-8WiK.pi--NiKn4iKLF","domain":".weibo.cn","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1787125182.795325,"sameSite":"no_restriction"},{"name":"XSRF-TOKEN","value":"aFL_72jYpydK2nE7qbHg9Fxn","domain":"weibo.com","hostOnly":true,"path":"/","secure":true,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"X-CSRF-TOKEN","value":"CK-YcoFwc_4iC_EmJXE9EWvvCXBKp_IRCHDsp_FzCoERca5HCo4=","domain":".passport.weibo.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":true,"sameSite":"unspecified"},{"name":"SUB","value":"_2A25FoFpuDeRhGeNN7VAR8C3Nyj-IHXVm3NOmrDV8PUNbmtAbLUj9kW9NSbc8GH1ww6jXqmwYNfDzjEEu0ufye8iH","domain":".weibo.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1787125182.557732,"sameSite":"no_restriction"},{"name":"ALC","value":"ALC-5QSpXb-1755589182-4-1415499657-3405568f8eb2bd8d0d32fcdc40fd-2","domain":".passport.weibo.com","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1758181182.557832,"sameSite":"no_restriction"},{"name":"ALF","value":"02_1758181182","domain":".weibo.com","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1758181182.557856,"sameSite":"unspecified"},{"name":"ALF","value":"02_1758181183","domain":".sina.com.cn","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1758181182.703614,"sameSite":"unspecified"},{"name":"ALC","value":"ALC-5QSpXb-1755589183-6-530681316-2b7f4b51ddcde87e992279079934-2","domain":".login.sina.com.cn","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1758181182.703579,"sameSite":"no_restriction"},{"name":"SCF","value":"AiRxHD-8OFoaEmbPa5YTvB7HMWqTz1rjmZtsbmLqG5vrW3CVPi_kh5wBOW6Cr8eugHulAz3RrUO01o9T8__WHDY.","domain":".sina.com.cn","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1790149183.703652,"sameSite":"no_restriction"},{"name":"SUB","value":"_2A25FoFpvDeRhGeNN7VAR8C3Nyj-IHXVm3NOnrDV_PUJbkNAYLXeskW9NSbc8GDpqdNVZPg0UvaRu_tJwXJ6Dd9Qm","domain":".sina.com.cn","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1787125182.703676,"sameSite":"no_restriction"},{"name":"SUBP","value":"0033WrSXqPxfM725Ws9jqgMF55529P9D9WhJpNagOTfkj8wiLmYOuVeZ5NHD95Qfe0qEeh50eK20Ws4Dqcj.i--fi-2fi-zci--NiKnRi-zRi--4i-8WiK.pi--NiKn4iKLF","domain":".sina.com.cn","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1756193982.7037,"sameSite":"no_restriction"},{"name":"SCF","value":"AiRxHD-8OFoaEmbPa5YTvB7HMWqTz1rjmZtsbmLqG5vrW3CVPi_kh5wBOW6Cr8eugE5-buf71bDdiIXUbs49qXY.","domain":".weibo.cn","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1790149183.795241,"sameSite":"no_restriction"},{"name":"SUB","value":"_2A25FoFpvDeRhGeNN7VAR8C3Nyj-IHXVm3NOnrDV6PUJbktAYLW3kkW1NSbc8GDIWspq0qxOYtpa2bB6GdYqNeGcP","domain":".weibo.cn","hostOnly":false,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1787125182.795305,"sameSite":"no_restriction"},{"name":"SSOLoginState","value":"1755589183","domain":".weibo.cn","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":true,"sameSite":"no_restriction"},{"name":"ALF","value":"1758181183","domain":".weibo.cn","hostOnly":false,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1758181182.795364,"sameSite":"no_restriction"},{"name":"WBPSESS","value":"NHDq0lzsaBJqFsTL9scgp5C2LIKi_mtLzO5uhMx0f9jQT1FBHX-GMvnWjWOjnB36kb0VLyl_oe7I6kh6VcT976ksw5xrvh4PWoP_Fgf3KsQLCCm5IU2CQ3pJATNwS2mza5x-2eTtwCkVVDiqIM0cVw==","domain":"weibo.com","hostOnly":true,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1755675584.116415,"sameSite":"unspecified"}]',
      'weibo.com',
    );

    const result = await searchXinlangweiboPublicWorkList('中国人一旦吃饱就触发善良人格');

    console.log(JSON.stringify(result, null, 2));
  });
});

describe.runIf(true)('短内容发布', () => {
  it('should return a valid result', async () => {
    // Mock the cookie or provide a valid one for testing
    const cookie =
      'SINAGLOBAL=3015929870534.333.1695171180512; SCF=Au2c1s-vqA2JpDT-FBAQl15yL9zdYGK1iKmQg5av_s3kX4dliG4HVGA4XPaTWgPq4qav2MP7SchHdE8JciWcmFk.; XSRF-TOKEN=dCb7Erlf_d6RzRXmPVJPb4gd; _s_tentry=weibo.com; Apache=3510665495402.7715.1705891907367; ULV=1705891907413:5:1:1:3510665495402.7715.1705891907367:1703483682274; PC_TOKEN=1270d1ce9f; ALF=1708497639; SUB=_2A25Iqn23DeRhGeNK6VQW8izOzTuIHXVrxv9_rDV8PUJbkNANLUT8kW1NSSupNpQx1rfdLoy69wNwUed-PMKMhNAt; SUBP=0033WrSXqPxfM725Ws9jqgMF55529P9D9W54TsqBboKmiLbVQhvcU5Ie5JpX5KzhUgL.Fo-XeoqNeozESoM2dJLoI0MLxKqL1KnL1-qLxKqLBozLBoeLxKBLBonL12BLxK-L12qL122LxKBLB.BLBK5LxKqL1-2L1K9o; WBPSESS=Dt2hbAUaXfkVprjyrAZT_G_tHsqvEC2ek9rLVbILJpuO2rKVyVLw1FpjplzULd2AKkjhxT6mYvcp47EpbruWT1tkjWNLmUkmGXkt7PhtJiTAIdHscICA_rfsfe64G0A2OjmPDFKaOJmjMQ1qk1VyJq1aDQPbe8iinBec3soKo_XypF6DLia8jdsupn5x7lPaLsBUWhCHm_M__74QYbpm9g==';

    // Call the function

    const result = await getXinlangweiboUserInfo(cookie);

    const taksData: XinlangweiboMicroArticleTaskInput = {
      taskId: '45645',
      title: '"真正的力量不在于剑的锋芒，而在于你内心的坚定和信念。" - 桐人',
      images: [
        {
          pathOrUrl:
            'https://yixiaoer-img.oss-cn-shanghai.aliyuncs.com/20240124/2b7d2060-752b-4944-a011-61c3f813b31a.jpg',
        },
        {
          pathOrUrl:
            'https://yixiaoer-img.oss-cn-shanghai.aliyuncs.com/20240124/935449d6-a006-40d7-bbf5-e06990cda6e3.jpg',
        },
        {
          pathOrUrl:
            'https://yixiaoer-img.oss-cn-shanghai.aliyuncs.com/20240124/a3578bf3-8609-440d-ac4f-5d08d0699666.jpg',
        },
        {
          pathOrUrl:
            'https://yixiaoer-img.oss-cn-shanghai.aliyuncs.com/20240124/eb79b659-65d3-45cf-8ddc-d88646f68d16.jpg',
        },
        {
          pathOrUrl:
            'https://yixiaoer-img.oss-cn-shanghai.aliyuncs.com/20240124/bbe69f36-fc91-4fff-a694-408c5ff355f7.jpg',
        },
        {
          pathOrUrl:
            'https://yixiaoer-img.oss-cn-shanghai.aliyuncs.com/20240124/f0d78e4b-3755-44f8-ac42-c2d79dd6f14b.jpg',
        },
        {
          pathOrUrl:
            'https://yixiaoer-img.oss-cn-shanghai.aliyuncs.com/20240124/b555c67d-9132-4a05-a9d7-575bd263fc3c.jpg',
        },
        {
          pathOrUrl:
            'https://yixiaoer-img.oss-cn-shanghai.aliyuncs.com/20240124/ec10d1bd-68ad-4282-bbaa-b65edf271e22.jpg',
        },
        {
          pathOrUrl:
            'https://yixiaoer-img.oss-cn-shanghai.aliyuncs.com/20240124/1effbc0d-e4f3-45c6-bd1a-b0f6a0f4687e.jpg',
        },
      ],
      visible: 0,
      topics: ['刀剑神域', '电脑壁纸', '高清壁纸'],
    };
    const eventCall = new EventEmitter();
    eventCall.on('publishing', (per, msg) => {
      console.log(`${per}-${msg}`);
    });
    if (result.data.user) {
      const pubResult = await xinlangweiboPublishMicroArticle(
        cookie,
        result.data.user.id,
        result.data.user.watermark.markpos,
        result.data.user.watermark.nick,
        taksData,
        eventCall,
      );

      console.log('新浪微博短内容发布结果:', pubResult);
    }
  });
});

describe.runIf(true)('查询定时发布剩余次数', () => {
  it('查询定时发布剩余次数', async () => {
    const cookie =
      'SCF=AsPFLZFtvZ8KZJhOkXDXXLUsgpWi-IH_DzcgGvmTPz35ahMO5Z0rF0xKGLGuhlOAtUv_LeSw8NiDRi6QNQ5MEts.; SUB=_2A25HmxVSDeRhGedH6FoT-S_IwzuIHXVk2SiarDV8PUNbmtANLUfHkW9NUKlckjaLGAN8yDxfxNMzl2EsgPPgjU7Y; SUBP=0033WrSXqPxfM725Ws9jqgMF55529P9D9WFZoHfG_g9rORszupA9X7GO5JpX5KzhUgL.Fo24e0nE1K2X1hM2dJLoIEBLxKqL1h.L12BLxK-L1KeLBK-LxKnLBo5L1hnLxK-LB.qL1het; ALF=02_1791422978; XSRF-TOKEN=qHg-8D7WlU9hab0Nhj1toVIr; WBPSESS=nvMUbyJW9mCARtk-ziczRAibzxWshA-Bf5RqMOYtvpZIWnrGvelpM61FbVSYpEDV3DBKUSBGvrWTCHCvF1Dw4CXwPozdliy2Lou_1L_KFmjr2nFmfNEMtqvaY5q2GpzQg5--pJRKLlueo6eYW8lZ0A==';
    const result = await getXinlangweiboSchedulePostFrequency(cookie);
    console.log(JSON.stringify(result, null, 2));
  });
});

describe.runIf(true)('【真实测试】', () => {
  test('获取新浪微博主页数据', async () => {
    const cookie =
      'SUBP=0033WrSXqPxfM725Ws9jqgMF55529P9D9W5oo5z1KbHFmJ6EI9C7DgsT5JpX5KzhUgL.Fo-XSoe7SKq4Son2dJLoI0MLxKqL1hnL1K2LxKML1-qLBK-LxK.L1h2L1KeLxKBLB.BLBK5LxKBLB.eL1-2LxKqL1-BLBKH.;SUB=_2A25I2CbaDeRhGeNK7VER9SjFzTSIHXVrlCYSrDV8PUJbkNANLWbgkW1NSUAZwyIyG8A_L3hTE98u11N43GZatJGY;ALF=1711530890;SINAGLOBAL=9451595448663.96.1708938936682;ULV=1708938936689:1:1:1:9451595448663.96.1708938936682:;WBPSESS=qtzassr8d3hqc1MELnofFbSyonK4GhuufJ7hqOsDctGufYZ5SCpsUGDuB0VvqmuVJNPxAGsZdV2uGsPbnGh2UOVpfRGbFztjA-RZObn1svlPEIVb1n_jtkdC47ECpGyWnyjvf0QmxTzM2vK4HTdovg==;XSRF-TOKEN=EIeaqG40ex-B4SnI5zywV_MX';

    const result = await getUserHomeDataAsync(cookie, 5463056968);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.ok).toBe(1);
    expect(result.data.user.id).toBe(5463056968);
  }, 10000000);

  test('检测用户有效性', async () => {
    const cookie =
      'SCF=AhoLE5VUkS88r1R1ntFlwO0J5ifgWMIaEXMyvJOlbYL7kO5VQ902Omvu6YodJ_ppZBLPAQ6qdb1SyIIf7_ODFbs.; SINAGLOBAL=2444454525143.8354.1739266266916; SUB=_2A25KsfJFDeRhGeBL4lER8S_Nwj-IHXVpzwuNrDV8PUNbmtAbLVLEkW9NRtTmX567ZMq3GvIMVnaEyVb7tZhxrOSt; SUBP=0033WrSXqPxfM725Ws9jqgMF55529P9D9WhRHc9Qy97ePFoMY3P11UKQ5JpX5KzhUgL.Foqf1Ke7eK2p1Ke2dJLoIEYLxKML1-eL1-qLxKML1-2L1hBLxK-L1h2L1hMLxKML1-2L1hBLxK-L1K-L122pentt; ALF=02_1742540565; ULV=1740037362761:3:3:3:274604403835.05258.1740037362727:1739432590909; XSRF-TOKEN=DAxrmcyGbek00PxiuZ8-WHXK; WBPSESS=RPmUPTP14nJNbUgBJwKI5dV1egr2eDyzFXGiX47BkQI6xjlT42ft7_dwLQbOAePc5c88jQremUlbtPgS04NS9H3M5xIAS7zcHkaeSbVQAmFOSTqdrVYcJbfSZOGklkEZ';
    const result = await new AccountService(cookie, Platforms.XinLangWeiBo).checkAccountAlive();
    console.log('有效性:' + result);
    expect(result).toBe(1);
  });
});
