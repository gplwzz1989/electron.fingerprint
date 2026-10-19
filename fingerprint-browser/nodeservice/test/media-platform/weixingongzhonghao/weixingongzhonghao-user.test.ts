import { describe, expect, test } from 'vitest';
import { getUserHomeDataAsync } from '@/media-platform/weixingongzhonghao/weixingongzhonghao-user.service';
import {
  Weixingongzhonghao,
  WeiXinGongZhongHaoCreateVoteRequest,
} from '../../../src/media-platform/weixingongzhonghao/index';
import { AccountService, Cloud, Platforms } from '../../../src';


describe.runIf(false)('【真实测试】', () => {
  test('获取微信公众号首页数据', async () => {
    const cookie =
      'ua_id=j8aaN4FYJlDY2Vo7AAAAAEdtygyItRzOrTHP0i3o9K0=;wxuin=56192463991500;rand_info=CAESII2aKDOrKqLdCZLfYDTPZl8kXT6mxrjMREy0XbXh4vE0;slave_bizuin=3223473596;data_bizuin=3223473596;bizuin=3223473596;data_ticket=m/zJer3e4NjniXcFAgctciqi/rbJlxPFFzyWNGJqpP3jup/TGgDxcNvtxlKur7Jz;slave_sid=Zl9sODhydGlvMkpvRXFVTnlFYXRUN25MZjNqd25oRnY2ZkRJd0xLVzBPd0ZRRU51amNxb0JTeTE5UVlUaWpiMjJ6R3VYbWYyYzdXUV9DS2ozS3BSS1VhT0hpd2V3YVlHUExrOVpPek1CU1pld05MSzdiUW5wT09BcmVIMzJ5Z1ZVMGZDTU5weXNBUTdnUmk0;slave_user=gh_7271ce0a8a0f;xid=271bf1a3671a8f1f090c02ee1ab2e9c6;mm_lang=zh_CN;uuid=bc15e7628d17d2f8e3e26c1e25d1acd0;_clck=3223473596|1|fyu|0;_clsk=jczcat|1756358117287|13|1|mp.weixin.qq.com/weheat-agent/payload/record;';

    const result = await getUserHomeDataAsync(cookie, 2143341598);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.base_resp.ret).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【真实测试】', () => {
  test('获取微信公众号用户信息', async () => {
    const cookie =
      "[{\"name\":\"ua_id\",\"value\":\"Dy6RYoaVG8pxFf7AAAAAAEpaDx7L62eyC8ojtb2lpG0=\",\"domain\":\"mp.weixin.qq.com\",\"hostOnly\":true,\"path\":\"/\",\"secure\":true,\"httpOnly\":true,\"session\":false,\"expirationDate\":1792505206.42622,\"sameSite\":\"unspecified\"},{\"name\":\"_clck\",\"value\":\"1onttr2|1|fzc|0\",\"domain\":\".qq.com\",\"hostOnly\":false,\"path\":\"/\",\"secure\":false,\"httpOnly\":false,\"session\":false,\"expirationDate\":1789481174,\"sameSite\":\"unspecified\"},{\"name\":\"uuid\",\"value\":\"af0f33bfbfbd6139e444f5428b27bdf2\",\"domain\":\"mp.weixin.qq.com\",\"hostOnly\":true,\"path\":\"/\",\"secure\":true,\"httpOnly\":true,\"session\":true,\"sameSite\":\"unspecified\"},{\"name\":\"wxuin\",\"value\":\"57945175387073\",\"domain\":\"mp.weixin.qq.com\",\"hostOnly\":true,\"path\":\"/\",\"secure\":false,\"httpOnly\":false,\"session\":false,\"expirationDate\":1792505175.11801,\"sameSite\":\"unspecified\"},{\"name\":\"rand_info\",\"value\":\"CAESILQkbxnlkQwEyWnGOKXVP18TglDsjIdR0mvk6U2q5EJ8\",\"domain\":\"mp.weixin.qq.com\",\"hostOnly\":true,\"path\":\"/\",\"secure\":true,\"httpOnly\":true,\"session\":false,\"expirationDate\":1758290811,\"sameSite\":\"unspecified\"},{\"name\":\"slave_bizuin\",\"value\":\"3623085645\",\"domain\":\"mp.weixin.qq.com\",\"hostOnly\":true,\"path\":\"/\",\"secure\":true,\"httpOnly\":true,\"session\":false,\"expirationDate\":1758290811,\"sameSite\":\"unspecified\"},{\"name\":\"data_bizuin\",\"value\":\"3623085645\",\"domain\":\"mp.weixin.qq.com\",\"hostOnly\":true,\"path\":\"/\",\"secure\":true,\"httpOnly\":true,\"session\":false,\"expirationDate\":1758290811,\"sameSite\":\"unspecified\"},{\"name\":\"bizuin\",\"value\":\"3623085645\",\"domain\":\"mp.weixin.qq.com\",\"hostOnly\":true,\"path\":\"/\",\"secure\":true,\"httpOnly\":true,\"session\":false,\"expirationDate\":1758290811,\"sameSite\":\"unspecified\"},{\"name\":\"data_ticket\",\"value\":\"mO4mVc+I9dHvq317HwEWdS2SsV6DmnjPU6k1tGfTldrcg/7I1Da0UJJ7TvwZYAWT\",\"domain\":\"mp.weixin.qq.com\",\"hostOnly\":true,\"path\":\"/\",\"secure\":true,\"httpOnly\":true,\"session\":false,\"expirationDate\":1758290811,\"sameSite\":\"unspecified\"},{\"name\":\"slave_sid\",\"value\":\"RWgzNFBWZFFSWFRpQmw4QU1WdUdHZWhRQ0JkdURIUWkyR2tvaUNjaDNEbWJXQWZwWU5adjNpS2JlMTc5S0lZN0lCVW5XN1B4anRJM0hBakZQQzdqWWtIS1JmMUgzT1ZIV0d6NzFDSmhFWEMyeDhkS2N3TGsyb2Z4aDQ0Z09sakJYNGZaZEZ3Umlmc1MwdlJy\",\"domain\":\"mp.weixin.qq.com\",\"hostOnly\":true,\"path\":\"/\",\"secure\":true,\"httpOnly\":true,\"session\":false,\"expirationDate\":1758290811,\"sameSite\":\"unspecified\"},{\"name\":\"slave_user\",\"value\":\"gh_72e3b4763902\",\"domain\":\"mp.weixin.qq.com\",\"hostOnly\":true,\"path\":\"/\",\"secure\":true,\"httpOnly\":true,\"session\":false,\"expirationDate\":1758290811,\"sameSite\":\"unspecified\"},{\"name\":\"xid\",\"value\":\"8c4bff401bbbd3c1688f0f8bf44bc715\",\"domain\":\"mp.weixin.qq.com\",\"hostOnly\":true,\"path\":\"/\",\"secure\":true,\"httpOnly\":true,\"session\":false,\"expirationDate\":1792505206.426889,\"sameSite\":\"unspecified\"},{\"name\":\"mm_lang\",\"value\":\"zh_CN\",\"domain\":\"mp.weixin.qq.com\",\"hostOnly\":true,\"path\":\"/\",\"secure\":true,\"httpOnly\":false,\"session\":false,\"expirationDate\":1792505206.427439,\"sameSite\":\"unspecified\"},{\"name\":\"_clsk\",\"value\":\"1x01rg0|1757945210170|1|1|mp.weixin.qq.com/weheat-agent/payload/record\",\"domain\":\".qq.com\",\"hostOnly\":false,\"path\":\"/\",\"secure\":false,\"httpOnly\":false,\"session\":false,\"expirationDate\":1758031610,\"sameSite\":\"unspecified\"}]";
    const result = await Cloud.getPlatformUserInfo(Platforms.WeiXinGongZhongHao, cookie);
    console.log('获取微信用户信息', result);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(false)('【真实测试】', () => {
  test('获取微信公众号用户信息', async () => {
    const cookie =
      'ua_id=c6uwuBDMjbiYs6EYAAAAAKU0dbytZC5dhic8klek0-U=; _clck=ec9u8w|1|fwh|0; wxuin=49026600580741; uuid=aef5409bfa16c209dd5ac7f2bf7b215f; rand_info=CAESINJaeBGRReNyvzaa35hLsAqngb0/rNbYBIAipX4aFKc/; slave_bizuin=3223473596; data_bizuin=3223473596; bizuin=3223473596; data_ticket=FowRyGqAAwnAopC2qIBdGF8DTXEY6gECCK6+zUnISWDVIYqbzlihXauR3VxgTVSM; slave_sid=V01FanhnTF9IWGNnNU5LbVZmT0JMY0lVSFlZQ2U1ZEhJbUdtU1RiaVdYem5wazNmRm80clJkaHJYY0RrV080ODFoX19TbXZTZWFwMTFweGFhMzNybDdtRVZvR05CNmc4TTVFRUtNUGpsN3Fmc2hhWXZaRU1QNHJ0bTN2OTAzSUtlVUxMV29tU1M0ZDRLUUl2; slave_user=gh_7271ce0a8a0f; xid=0d6dcbab7676822c540b2f958c53ad4b; mm_lang=zh_CN; slave_user=gh_7271ce0a8a0f; slave_sid=V01FanhnTF9IWGNnNU5LbVZmT0JMY0lVSFlZQ2U1ZEhJbUdtU1RiaVdYem5wazNmRm80clJkaHJYY0RrV080ODFoX19TbXZTZWFwMTFweGFhMzNybDdtRVZvR05CNmc4TTVFRUtNUGpsN3Fmc2hhWXZaRU1QNHJ0bTN2OTAzSUtlVUxMV29tU1M0ZDRLUUl2; bizuin=3223473596; data_bizuin=3223473596; data_ticket=FowRyGqAAwnAopC2qIBdGF8DTXEY6gECCK6+zUnISWDVIYqbzlihXauR3VxgTVSM; slave_bizuin=3223473596; rand_info=CAESINJaeBGRReNyvzaa35hLsAqngb0/rNbYBIAipX4aFKc/; ua_id=c6uwuBDMjbiYs6EYAAAAAKU0dbytZC5dhic8klek0-U=';

    const result = await Weixingongzhonghao.getWeixingongzhonghaoUserInfo(cookie);
    console.log('获取微信用户信息', result);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【真实测试】', () => {
  test('获取微信公众号有效检测', async () => {
    const cookie ='[{"name":"ua_id","value":"b66xM8oDyu0VpOQOAAAAADAZQlM49wC0DXfsfWZRrKg=","domain":"mp.weixin.qq.com","hostOnly":true,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1792820659.865259,"sameSite":"unspecified"},{"name":"_clck","value":"xs9fqh|1|fzg|0","domain":".qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1789796636,"sameSite":"unspecified"},{"name":"uuid","value":"0f819febc18cb3c1e446745e1257f04a","domain":"mp.weixin.qq.com","hostOnly":true,"path":"/","secure":true,"httpOnly":true,"session":true,"sameSite":"unspecified"},{"name":"wxuin","value":"58260637352689","domain":"mp.weixin.qq.com","hostOnly":true,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1792820636.955703,"sameSite":"unspecified"},{"name":"rand_info","value":"CAESIDvBd14XtqdCS25jA0z1F6wkToenNx97Mdoq9LlyQ8JP","domain":"mp.weixin.qq.com","hostOnly":true,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1758606262,"sameSite":"unspecified"},{"name":"slave_bizuin","value":"3623085645","domain":"mp.weixin.qq.com","hostOnly":true,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1758606262,"sameSite":"unspecified"},{"name":"data_bizuin","value":"3623085645","domain":"mp.weixin.qq.com","hostOnly":true,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1758606262,"sameSite":"unspecified"},{"name":"bizuin","value":"3623085645","domain":"mp.weixin.qq.com","hostOnly":true,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1758606262,"sameSite":"unspecified"},{"name":"data_ticket","value":"taexMRpmDzlRSQc+gAVwP0+7s4VkePH2nF/WHlmiERfhspmZveKvh7JfXe4R8PiY","domain":"mp.weixin.qq.com","hostOnly":true,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1758606262,"sameSite":"unspecified"},{"name":"slave_sid","value":"MjBtcjRNNmJGX18xYWk3a0RaVUUwbFpFVDBvYXJfYjZJNUxJNXpXaGx5WWozYTBmVkRldVpJOHhndkJLY2w1eURLeVQ0UGlxdHZDcTJ5d2VRWHBXMVpWejR5eHJNZnBuejdIV3VwOWE0ck13QVFyRmx1Z3Mzd1ZVeFJ5UVBQWEZwaTRJdFJHVER6aDVkZXZM","domain":"mp.weixin.qq.com","hostOnly":true,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1758606262,"sameSite":"unspecified"},{"name":"slave_user","value":"gh_72e3b4763902","domain":"mp.weixin.qq.com","hostOnly":true,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1758606262,"sameSite":"unspecified"},{"name":"xid","value":"29406f5429fac5a0f207a734fe8ada55","domain":"mp.weixin.qq.com","hostOnly":true,"path":"/","secure":true,"httpOnly":true,"session":false,"expirationDate":1792820659.865329,"sameSite":"unspecified"},{"name":"mm_lang","value":"zh_CN","domain":"mp.weixin.qq.com","hostOnly":true,"path":"/","secure":true,"httpOnly":false,"session":false,"expirationDate":1792820659.8654,"sameSite":"unspecified"},{"name":"_clsk","value":"wp8cp4|1758260662453|1|1|mp.weixin.qq.com/weheat-agent/payload/record","domain":".qq.com","hostOnly":false,"path":"/","secure":false,"httpOnly":false,"session":false,"expirationDate":1758347062,"sameSite":"unspecified"}]';
    const result = await new AccountService(cookie, Platforms.WeiXinGongZhongHao).checkAccountAlive();
    console.log('是否有效', result);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});

describe.runIf(true)('【真实测试】', () => {
  test('搜索公众号列表', async () => {
    const cookie =
      'ua_id=c6uwuBDMjbiYs6EYAAAAAKU0dbytZC5dhic8klek0-U=; _clck=ec9u8w|1|fwh|0; wxuin=49026600580741; uuid=aef5409bfa16c209dd5ac7f2bf7b215f; rand_info=CAESINJaeBGRReNyvzaa35hLsAqngb0/rNbYBIAipX4aFKc/; slave_bizuin=3223473596; data_bizuin=3223473596; bizuin=3223473596; data_ticket=FowRyGqAAwnAopC2qIBdGF8DTXEY6gECCK6+zUnISWDVIYqbzlihXauR3VxgTVSM; slave_sid=V01FanhnTF9IWGNnNU5LbVZmT0JMY0lVSFlZQ2U1ZEhJbUdtU1RiaVdYem5wazNmRm80clJkaHJYY0RrV080ODFoX19TbXZTZWFwMTFweGFhMzNybDdtRVZvR05CNmc4TTVFRUtNUGpsN3Fmc2hhWXZaRU1QNHJ0bTN2OTAzSUtlVUxMV29tU1M0ZDRLUUl2; slave_user=gh_7271ce0a8a0f; xid=0d6dcbab7676822c540b2f958c53ad4b; mm_lang=zh_CN; slave_user=gh_7271ce0a8a0f; slave_sid=V01FanhnTF9IWGNnNU5LbVZmT0JMY0lVSFlZQ2U1ZEhJbUdtU1RiaVdYem5wazNmRm80clJkaHJYY0RrV080ODFoX19TbXZTZWFwMTFweGFhMzNybDdtRVZvR05CNmc4TTVFRUtNUGpsN3Fmc2hhWXZaRU1QNHJ0bTN2OTAzSUtlVUxMV29tU1M0ZDRLUUl2; bizuin=3223473596; data_bizuin=3223473596; data_ticket=FowRyGqAAwnAopC2qIBdGF8DTXEY6gECCK6+zUnISWDVIYqbzlihXauR3VxgTVSM; slave_bizuin=3223473596; rand_info=CAESINJaeBGRReNyvzaa35hLsAqngb0/rNbYBIAipX4aFKc/; ua_id=c6uwuBDMjbiYs6EYAAAAAKU0dbytZC5dhic8klek0-U=';

    const result = await Weixingongzhonghao.searchWeiXinGongZhongHaoUserList(cookie, '王者');
    console.log('用户列表', JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});

describe.runIf(true)('【真实测试】', () => {
  test('搜索视频号号列表', async () => {
    const cookie =
      'ua_id=c6uwuBDMjbiYs6EYAAAAAKU0dbytZC5dhic8klek0-U=; _clck=ec9u8w|1|fwh|0; wxuin=49026600580741; uuid=aef5409bfa16c209dd5ac7f2bf7b215f; rand_info=CAESINJaeBGRReNyvzaa35hLsAqngb0/rNbYBIAipX4aFKc/; slave_bizuin=3223473596; data_bizuin=3223473596; bizuin=3223473596; data_ticket=FowRyGqAAwnAopC2qIBdGF8DTXEY6gECCK6+zUnISWDVIYqbzlihXauR3VxgTVSM; slave_sid=V01FanhnTF9IWGNnNU5LbVZmT0JMY0lVSFlZQ2U1ZEhJbUdtU1RiaVdYem5wazNmRm80clJkaHJYY0RrV080ODFoX19TbXZTZWFwMTFweGFhMzNybDdtRVZvR05CNmc4TTVFRUtNUGpsN3Fmc2hhWXZaRU1QNHJ0bTN2OTAzSUtlVUxMV29tU1M0ZDRLUUl2; slave_user=gh_7271ce0a8a0f; xid=0d6dcbab7676822c540b2f958c53ad4b; mm_lang=zh_CN; slave_user=gh_7271ce0a8a0f; slave_sid=V01FanhnTF9IWGNnNU5LbVZmT0JMY0lVSFlZQ2U1ZEhJbUdtU1RiaVdYem5wazNmRm80clJkaHJYY0RrV080ODFoX19TbXZTZWFwMTFweGFhMzNybDdtRVZvR05CNmc4TTVFRUtNUGpsN3Fmc2hhWXZaRU1QNHJ0bTN2OTAzSUtlVUxMV29tU1M0ZDRLUUl2; bizuin=3223473596; data_bizuin=3223473596; data_ticket=FowRyGqAAwnAopC2qIBdGF8DTXEY6gECCK6+zUnISWDVIYqbzlihXauR3VxgTVSM; slave_bizuin=3223473596; rand_info=CAESINJaeBGRReNyvzaa35hLsAqngb0/rNbYBIAipX4aFKc/; ua_id=c6uwuBDMjbiYs6EYAAAAAKU0dbytZC5dhic8klek0-U=';

    const result = await Weixingongzhonghao.searchWeiXinShipinhaoUserList(
      cookie,
      '王者',
      '3I0aYgfQnR7XhXQ4HXA0LvO/kW3D4REuxsS0ENeJaeG9kT2JMUvitrw4eHJ6a4imBwX0FOUDE4Pk1crz6NKvAg==',
    );
    console.log('用户列表', JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});

describe.runIf(true)('【真实测试】', () => {
  test('获取视频号下内容列表', async () => {
    const cookie =
      'ua_id=c6uwuBDMjbiYs6EYAAAAAKU0dbytZC5dhic8klek0-U=; _clck=ec9u8w|1|fwh|0; wxuin=49026600580741; uuid=aef5409bfa16c209dd5ac7f2bf7b215f; rand_info=CAESINJaeBGRReNyvzaa35hLsAqngb0/rNbYBIAipX4aFKc/; slave_bizuin=3223473596; data_bizuin=3223473596; bizuin=3223473596; data_ticket=FowRyGqAAwnAopC2qIBdGF8DTXEY6gECCK6+zUnISWDVIYqbzlihXauR3VxgTVSM; slave_sid=V01FanhnTF9IWGNnNU5LbVZmT0JMY0lVSFlZQ2U1ZEhJbUdtU1RiaVdYem5wazNmRm80clJkaHJYY0RrV080ODFoX19TbXZTZWFwMTFweGFhMzNybDdtRVZvR05CNmc4TTVFRUtNUGpsN3Fmc2hhWXZaRU1QNHJ0bTN2OTAzSUtlVUxMV29tU1M0ZDRLUUl2; slave_user=gh_7271ce0a8a0f; xid=0d6dcbab7676822c540b2f958c53ad4b; mm_lang=zh_CN; slave_user=gh_7271ce0a8a0f; slave_sid=V01FanhnTF9IWGNnNU5LbVZmT0JMY0lVSFlZQ2U1ZEhJbUdtU1RiaVdYem5wazNmRm80clJkaHJYY0RrV080ODFoX19TbXZTZWFwMTFweGFhMzNybDdtRVZvR05CNmc4TTVFRUtNUGpsN3Fmc2hhWXZaRU1QNHJ0bTN2OTAzSUtlVUxMV29tU1M0ZDRLUUl2; bizuin=3223473596; data_bizuin=3223473596; data_ticket=FowRyGqAAwnAopC2qIBdGF8DTXEY6gECCK6+zUnISWDVIYqbzlihXauR3VxgTVSM; slave_bizuin=3223473596; rand_info=CAESINJaeBGRReNyvzaa35hLsAqngb0/rNbYBIAipX4aFKc/; ua_id=c6uwuBDMjbiYs6EYAAAAAKU0dbytZC5dhic8klek0-U=';

    const result = await Weixingongzhonghao.getWeiXinShipinhaoUserContentList(
      cookie,
      'v2_060000231003b20faec8c6e78811c0d7cb05e834b0778ad50edf7f09c4fc1cb79cd09922ad7d@finder',
      '',
    );
    console.log('内容列表', JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});

describe.runIf(true)('【真实测试】', () => {
  test('创建不过期投票', async () => {
    const cookie =
      'ua_id=c6uwuBDMjbiYs6EYAAAAAKU0dbytZC5dhic8klek0-U=; _clck=ec9u8w|1|fwh|0; wxuin=49026600580741; uuid=aef5409bfa16c209dd5ac7f2bf7b215f; rand_info=CAESINJaeBGRReNyvzaa35hLsAqngb0/rNbYBIAipX4aFKc/; slave_bizuin=3223473596; data_bizuin=3223473596; bizuin=3223473596; data_ticket=FowRyGqAAwnAopC2qIBdGF8DTXEY6gECCK6+zUnISWDVIYqbzlihXauR3VxgTVSM; slave_sid=V01FanhnTF9IWGNnNU5LbVZmT0JMY0lVSFlZQ2U1ZEhJbUdtU1RiaVdYem5wazNmRm80clJkaHJYY0RrV080ODFoX19TbXZTZWFwMTFweGFhMzNybDdtRVZvR05CNmc4TTVFRUtNUGpsN3Fmc2hhWXZaRU1QNHJ0bTN2OTAzSUtlVUxMV29tU1M0ZDRLUUl2; slave_user=gh_7271ce0a8a0f; xid=0d6dcbab7676822c540b2f958c53ad4b; mm_lang=zh_CN; slave_user=gh_7271ce0a8a0f; slave_sid=V01FanhnTF9IWGNnNU5LbVZmT0JMY0lVSFlZQ2U1ZEhJbUdtU1RiaVdYem5wazNmRm80clJkaHJYY0RrV080ODFoX19TbXZTZWFwMTFweGFhMzNybDdtRVZvR05CNmc4TTVFRUtNUGpsN3Fmc2hhWXZaRU1QNHJ0bTN2OTAzSUtlVUxMV29tU1M0ZDRLUUl2; bizuin=3223473596; data_bizuin=3223473596; data_ticket=FowRyGqAAwnAopC2qIBdGF8DTXEY6gECCK6+zUnISWDVIYqbzlihXauR3VxgTVSM; slave_bizuin=3223473596; rand_info=CAESINJaeBGRReNyvzaa35hLsAqngb0/rNbYBIAipX4aFKc/; ua_id=c6uwuBDMjbiYs6EYAAAAAKU0dbytZC5dhic8klek0-U=';

    const voteDate: WeiXinGongZhongHaoCreateVoteRequest = {
      title: '这是一个不过期投票',
      vote_permission: '1',
      expire_time: 0,
      vote_subject: [
        {
          title: '为什么会不过期-单选',
          type: '1',
          options: [
            {
              name: '因为这是带了图片的',
              url: 'https://mmbiz.qpic.cn/sz_mmbiz_jpg/QTMqVTVBGv4QstiaKUCQZ5eMBs0tHWxI7XgezkBV2BicyicogpWevEx4P6QogrZTeQqTIy7k7Gbkw6eq4BBuibTARA/0?wx_fmt=jpeg&from=appmsg',
            },
            { name: '因为这是第一个没带图片', url: '' },
            { name: '因为这是第二个没带图片', url: '' },
          ],
        },
        {
          title: '为什么不会过期-多选',
          type: '2',
          options: [
            { name: '多选选项1-无图', url: '' },
            { name: '多选选项2-无图', url: '' },
            { name: '多选选项3-无图', url: '' },
          ],
        },
      ],
      is_editing: 0,
      vote_create_type: 0,
    };

    const result = await Weixingongzhonghao.createWeiXinGongZhongHaoVote(cookie, voteDate);
    console.log('内容列表', JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});

describe.runIf(true)('【真实测试】', () => {
  test('创建过期投票', async () => {
    const cookie =
      'ua_id=c6uwuBDMjbiYs6EYAAAAAKU0dbytZC5dhic8klek0-U=; _clck=ec9u8w|1|fwh|0; wxuin=49026600580741; uuid=aef5409bfa16c209dd5ac7f2bf7b215f; rand_info=CAESINJaeBGRReNyvzaa35hLsAqngb0/rNbYBIAipX4aFKc/; slave_bizuin=3223473596; data_bizuin=3223473596; bizuin=3223473596; data_ticket=FowRyGqAAwnAopC2qIBdGF8DTXEY6gECCK6+zUnISWDVIYqbzlihXauR3VxgTVSM; slave_sid=V01FanhnTF9IWGNnNU5LbVZmT0JMY0lVSFlZQ2U1ZEhJbUdtU1RiaVdYem5wazNmRm80clJkaHJYY0RrV080ODFoX19TbXZTZWFwMTFweGFhMzNybDdtRVZvR05CNmc4TTVFRUtNUGpsN3Fmc2hhWXZaRU1QNHJ0bTN2OTAzSUtlVUxMV29tU1M0ZDRLUUl2; slave_user=gh_7271ce0a8a0f; xid=0d6dcbab7676822c540b2f958c53ad4b; mm_lang=zh_CN; slave_user=gh_7271ce0a8a0f; slave_sid=V01FanhnTF9IWGNnNU5LbVZmT0JMY0lVSFlZQ2U1ZEhJbUdtU1RiaVdYem5wazNmRm80clJkaHJYY0RrV080ODFoX19TbXZTZWFwMTFweGFhMzNybDdtRVZvR05CNmc4TTVFRUtNUGpsN3Fmc2hhWXZaRU1QNHJ0bTN2OTAzSUtlVUxMV29tU1M0ZDRLUUl2; bizuin=3223473596; data_bizuin=3223473596; data_ticket=FowRyGqAAwnAopC2qIBdGF8DTXEY6gECCK6+zUnISWDVIYqbzlihXauR3VxgTVSM; slave_bizuin=3223473596; rand_info=CAESINJaeBGRReNyvzaa35hLsAqngb0/rNbYBIAipX4aFKc/; ua_id=c6uwuBDMjbiYs6EYAAAAAKU0dbytZC5dhic8klek0-U=';

    const voteDate: WeiXinGongZhongHaoCreateVoteRequest = {
      title: '这是一个HUI过期投票',
      vote_permission: '1',
      expire_time: 1764597734,
      vote_subject: [
        {
          title: '为什么会不过期-单选',
          type: '1',
          options: [
            {
              name: '因为这是带了图片的',
              url: 'https://mmbiz.qpic.cn/sz_mmbiz_jpg/QTMqVTVBGv4QstiaKUCQZ5eMBs0tHWxI7XgezkBV2BicyicogpWevEx4P6QogrZTeQqTIy7k7Gbkw6eq4BBuibTARA/0?wx_fmt=jpeg&from=appmsg',
            },
            { name: '因为这是第一个没带图片', url: '' },
            { name: '因为这是第二个没带图片', url: '' },
          ],
        },
        {
          title: '为什么不会过期-多选',
          type: '2',
          options: [
            { name: '多选选项1-无图', url: '' },
            { name: '多选选项2-无图', url: '' },
            { name: '多选选项3-无图', url: '' },
          ],
        },
      ],
      is_editing: 0,
      vote_create_type: 0,
    };

    const result = await Weixingongzhonghao.createWeiXinGongZhongHaoVote(cookie, voteDate);
    console.log('内容列表', JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});

describe.runIf(true)('【真实测试】', () => {
  test('获取投票列表', async () => {
    const cookie =
      'ua_id=c6uwuBDMjbiYs6EYAAAAAKU0dbytZC5dhic8klek0-U=; _clck=ec9u8w|1|fwh|0; wxuin=49026600580741; uuid=aef5409bfa16c209dd5ac7f2bf7b215f; rand_info=CAESINJaeBGRReNyvzaa35hLsAqngb0/rNbYBIAipX4aFKc/; slave_bizuin=3223473596; data_bizuin=3223473596; bizuin=3223473596; data_ticket=FowRyGqAAwnAopC2qIBdGF8DTXEY6gECCK6+zUnISWDVIYqbzlihXauR3VxgTVSM; slave_sid=V01FanhnTF9IWGNnNU5LbVZmT0JMY0lVSFlZQ2U1ZEhJbUdtU1RiaVdYem5wazNmRm80clJkaHJYY0RrV080ODFoX19TbXZTZWFwMTFweGFhMzNybDdtRVZvR05CNmc4TTVFRUtNUGpsN3Fmc2hhWXZaRU1QNHJ0bTN2OTAzSUtlVUxMV29tU1M0ZDRLUUl2; slave_user=gh_7271ce0a8a0f; xid=0d6dcbab7676822c540b2f958c53ad4b; mm_lang=zh_CN; slave_user=gh_7271ce0a8a0f; slave_sid=V01FanhnTF9IWGNnNU5LbVZmT0JMY0lVSFlZQ2U1ZEhJbUdtU1RiaVdYem5wazNmRm80clJkaHJYY0RrV080ODFoX19TbXZTZWFwMTFweGFhMzNybDdtRVZvR05CNmc4TTVFRUtNUGpsN3Fmc2hhWXZaRU1QNHJ0bTN2OTAzSUtlVUxMV29tU1M0ZDRLUUl2; bizuin=3223473596; data_bizuin=3223473596; data_ticket=FowRyGqAAwnAopC2qIBdGF8DTXEY6gECCK6+zUnISWDVIYqbzlihXauR3VxgTVSM; slave_bizuin=3223473596; rand_info=CAESINJaeBGRReNyvzaa35hLsAqngb0/rNbYBIAipX4aFKc/; ua_id=c6uwuBDMjbiYs6EYAAAAAKU0dbytZC5dhic8klek0-U=';

    const result = await Weixingongzhonghao.getWeiXinGongZhongHaoVoteList(cookie);
    console.log('投票列表', JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});

describe.runIf(true)('【真实测试】', () => {
  test('获取投票详情', async () => {
    const cookie =
      'ua_id=c6uwuBDMjbiYs6EYAAAAAKU0dbytZC5dhic8klek0-U=; _clck=ec9u8w|1|fwh|0; wxuin=49026600580741; uuid=aef5409bfa16c209dd5ac7f2bf7b215f; rand_info=CAESINJaeBGRReNyvzaa35hLsAqngb0/rNbYBIAipX4aFKc/; slave_bizuin=3223473596; data_bizuin=3223473596; bizuin=3223473596; data_ticket=FowRyGqAAwnAopC2qIBdGF8DTXEY6gECCK6+zUnISWDVIYqbzlihXauR3VxgTVSM; slave_sid=V01FanhnTF9IWGNnNU5LbVZmT0JMY0lVSFlZQ2U1ZEhJbUdtU1RiaVdYem5wazNmRm80clJkaHJYY0RrV080ODFoX19TbXZTZWFwMTFweGFhMzNybDdtRVZvR05CNmc4TTVFRUtNUGpsN3Fmc2hhWXZaRU1QNHJ0bTN2OTAzSUtlVUxMV29tU1M0ZDRLUUl2; slave_user=gh_7271ce0a8a0f; xid=0d6dcbab7676822c540b2f958c53ad4b; mm_lang=zh_CN; slave_user=gh_7271ce0a8a0f; slave_sid=V01FanhnTF9IWGNnNU5LbVZmT0JMY0lVSFlZQ2U1ZEhJbUdtU1RiaVdYem5wazNmRm80clJkaHJYY0RrV080ODFoX19TbXZTZWFwMTFweGFhMzNybDdtRVZvR05CNmc4TTVFRUtNUGpsN3Fmc2hhWXZaRU1QNHJ0bTN2OTAzSUtlVUxMV29tU1M0ZDRLUUl2; bizuin=3223473596; data_bizuin=3223473596; data_ticket=FowRyGqAAwnAopC2qIBdGF8DTXEY6gECCK6+zUnISWDVIYqbzlihXauR3VxgTVSM; slave_bizuin=3223473596; rand_info=CAESINJaeBGRReNyvzaa35hLsAqngb0/rNbYBIAipX4aFKc/; ua_id=c6uwuBDMjbiYs6EYAAAAAKU0dbytZC5dhic8klek0-U=';

    const result = await Weixingongzhonghao.getWeiXinGongZhongHaoVoteDetail(cookie, '489224598');
    console.log('投票详情', JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});

describe.runIf(true)('【真实测试】', () => {
  test('上传投票图片', async () => {
    const cookie =
      'ua_id=c6uwuBDMjbiYs6EYAAAAAKU0dbytZC5dhic8klek0-U=; _clck=ec9u8w|1|fwh|0; wxuin=49026600580741; uuid=aef5409bfa16c209dd5ac7f2bf7b215f; rand_info=CAESINJaeBGRReNyvzaa35hLsAqngb0/rNbYBIAipX4aFKc/; slave_bizuin=3223473596; data_bizuin=3223473596; bizuin=3223473596; data_ticket=FowRyGqAAwnAopC2qIBdGF8DTXEY6gECCK6+zUnISWDVIYqbzlihXauR3VxgTVSM; slave_sid=V01FanhnTF9IWGNnNU5LbVZmT0JMY0lVSFlZQ2U1ZEhJbUdtU1RiaVdYem5wazNmRm80clJkaHJYY0RrV080ODFoX19TbXZTZWFwMTFweGFhMzNybDdtRVZvR05CNmc4TTVFRUtNUGpsN3Fmc2hhWXZaRU1QNHJ0bTN2OTAzSUtlVUxMV29tU1M0ZDRLUUl2; slave_user=gh_7271ce0a8a0f; xid=0d6dcbab7676822c540b2f958c53ad4b; mm_lang=zh_CN; slave_user=gh_7271ce0a8a0f; slave_sid=V01FanhnTF9IWGNnNU5LbVZmT0JMY0lVSFlZQ2U1ZEhJbUdtU1RiaVdYem5wazNmRm80clJkaHJYY0RrV080ODFoX19TbXZTZWFwMTFweGFhMzNybDdtRVZvR05CNmc4TTVFRUtNUGpsN3Fmc2hhWXZaRU1QNHJ0bTN2OTAzSUtlVUxMV29tU1M0ZDRLUUl2; bizuin=3223473596; data_bizuin=3223473596; data_ticket=FowRyGqAAwnAopC2qIBdGF8DTXEY6gECCK6+zUnISWDVIYqbzlihXauR3VxgTVSM; slave_bizuin=3223473596; rand_info=CAESINJaeBGRReNyvzaa35hLsAqngb0/rNbYBIAipX4aFKc/; ua_id=c6uwuBDMjbiYs6EYAAAAAKU0dbytZC5dhic8klek0-U=';

    const result = await Weixingongzhonghao.uploadWeiXinGongZhongHaoVoteImage(
      cookie,
      'I:\\download\\16-9.jpg',
      '',
      '',
      0,
    );
    console.log('图片信息', JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
  }, 10000000);
});
