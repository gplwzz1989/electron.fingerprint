import { describe, expect, test } from 'vitest';
import { AccountService, Cloud, Platforms } from '../../../src';

describe.runIf(true)('【真实测试】', () => {
  test('获取简书用户信息', async () => {
    const cookie =
      'web_login_version=MTc1NDYzNjg3NQ%3D%3D--2d2b407af9fa50a35d7bf2f78b19956136ea9992; remember_user_token=W1s2NzE5MTA2XSwiJDJhJDEwJFQ3cGV2d05pS1ZhcTF1dlFLTUJVMHUiLCIxNzU2NDU5NjA5LjkzNzM2MSJd--6ef4cfcc8c09ca23948ef912bfbde08252779667; Hm_lvt_0c0e9d9b1e7d617b3e6842e85b9fb068=1754636863,1756459610; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%226719106%22%2C%22first_id%22%3A%221988881c42ffd9-0b1dbba94b3166-5a500919-1892970-1988881c4301b4%22%2C%22props%22%3A%7B%22%24latest_traffic_source_type%22%3A%22%E7%9B%B4%E6%8E%A5%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC_%E7%9B%B4%E6%8E%A5%E6%89%93%E5%BC%80%22%2C%22%24latest_referrer%22%3A%22%22%7D%2C%22%24device_id%22%3A%221988881c42ffd9-0b1dbba94b3166-5a500919-1892970-1988881c4301b4%22%7D; read_mode=day; default_font=font2; locale=zh-CN; HMACCOUNT=5406D38D67A47646; BAIDU_SSP_lcr=https://open.weixin.qq.com/; Hm_lpvt_0c0e9d9b1e7d617b3e6842e85b9fb068=1756460549';

    const result = await Cloud.getPlatformUserInfo(Platforms.JianShu, cookie);
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);

  test('获取简书用户有效性检测', async () => {
    const cookie =
      "[{\"name\":\"read_mode\",\"value\":\"day\",\"domain\":\"www.jianshu.com\",\"hostOnly\":true,\"path\":\"/\",\"secure\":false,\"httpOnly\":false,\"session\":true,\"sameSite\":\"unspecified\"},{\"name\":\"default_font\",\"value\":\"font2\",\"domain\":\"www.jianshu.com\",\"hostOnly\":true,\"path\":\"/\",\"secure\":false,\"httpOnly\":false,\"session\":true,\"sameSite\":\"unspecified\"},{\"name\":\"locale\",\"value\":\"zh-CN\",\"domain\":\"www.jianshu.com\",\"hostOnly\":true,\"path\":\"/\",\"secure\":false,\"httpOnly\":false,\"session\":true,\"sameSite\":\"unspecified\"},{\"name\":\"HMACCOUNT_BFESS\",\"value\":\"183A9FCC08A99C62\",\"domain\":\".hm.baidu.com\",\"hostOnly\":false,\"path\":\"/\",\"secure\":true,\"httpOnly\":false,\"session\":false,\"expirationDate\":1793099143.403402,\"sameSite\":\"no_restriction\"},{\"name\":\"Hm_lvt_0c0e9d9b1e7d617b3e6842e85b9fb068\",\"value\":\"1758539144\",\"domain\":\".jianshu.com\",\"hostOnly\":false,\"path\":\"/\",\"secure\":false,\"httpOnly\":false,\"session\":false,\"expirationDate\":1790075190,\"sameSite\":\"unspecified\"},{\"name\":\"HMACCOUNT\",\"value\":\"183A9FCC08A99C62\",\"domain\":\".jianshu.com\",\"hostOnly\":false,\"path\":\"/\",\"secure\":false,\"httpOnly\":false,\"session\":true,\"sameSite\":\"unspecified\"},{\"name\":\"sajssdk_2015_cross_new_user\",\"value\":\"1\",\"domain\":\".jianshu.com\",\"hostOnly\":false,\"path\":\"/\",\"secure\":false,\"httpOnly\":false,\"session\":false,\"expirationDate\":1758556799,\"sameSite\":\"unspecified\"},{\"name\":\"web_login_version\",\"value\":\"MTc1ODUzOTE5MQ%3D%3D--2f4a355062e762ed7c228eaa4f8ac1d770ba829a\",\"domain\":\".jianshu.com\",\"hostOnly\":false,\"path\":\"/\",\"secure\":false,\"httpOnly\":true,\"session\":false,\"expirationDate\":1761131190.571396,\"sameSite\":\"unspecified\"},{\"name\":\"_m7e_session_core\",\"value\":\"603d7c0cbbcbb331b4a4078a60708e03\",\"domain\":\".jianshu.com\",\"hostOnly\":false,\"path\":\"/\",\"secure\":true,\"httpOnly\":true,\"session\":false,\"expirationDate\":1758560794.969472,\"sameSite\":\"unspecified\"},{\"name\":\"sensorsdata2015jssdkcross\",\"value\":\"%7B%22distinct_id%22%3A%2230760575%22%2C%22first_id%22%3A%221997119d99e366-0dd241ad7cf3538-68346760-2359296-1997119d99f1313%22%2C%22props%22%3A%7B%7D%2C%22%24device_id%22%3A%221997119d99e366-0dd241ad7cf3538-68346760-2359296-1997119d99f1313%22%7D\",\"domain\":\".jianshu.com\",\"hostOnly\":false,\"path\":\"/\",\"secure\":false,\"httpOnly\":false,\"session\":false,\"expirationDate\":1793099190.91253,\"sameSite\":\"unspecified\"},{\"name\":\"Hm_lpvt_0c0e9d9b1e7d617b3e6842e85b9fb068\",\"value\":\"1758539191\",\"domain\":\".jianshu.com\",\"hostOnly\":false,\"path\":\"/\",\"secure\":false,\"httpOnly\":false,\"session\":true,\"sameSite\":\"unspecified\"},{\"name\":\"BAIDUID_BFESS\",\"value\":\"52F56A44C9678C3E81611970CCBCAD05:FG=1\",\"domain\":\".baidu.com\",\"hostOnly\":false,\"path\":\"/\",\"secure\":true,\"httpOnly\":false,\"session\":false,\"expirationDate\":1790075191.204983,\"sameSite\":\"no_restriction\"}]";

    const result = await new AccountService(cookie, Platforms.JianShu).checkAccountAlive();
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result).toBe(1);
  }, 10000000);
});
