import { describe, expect, test } from 'vitest';
import { AccountService, Cloud, Platforms } from '../../../src';

describe.runIf(true)('【真实测试】', () => {
  test('得物视频用户信息', async () => {
    const cookie =
      'dw_edge_er_cookie=1ce800c5-4b5f-aeed-729d-c1ebb80b4936; sajssdk_2015_cross_new_user=1; sk=9RXfOu0X3hplUk9mAPQN0c2gDIOnwIis9yGVdB3bp2tCDi1DSnZEJMC7jrMy3atd9gm6WqUUHQ27KJ7DuynDGIoQ771r; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%22198ea5d3ce62ad-00a16558b45bdd7-4c657b58-2073600-198ea5d3ce7933%22%2C%22first_id%22%3A%22%22%2C%22props%22%3A%7B%22%24latest_traffic_source_type%22%3A%22%E7%9B%B4%E6%8E%A5%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC_%E7%9B%B4%E6%8E%A5%E6%89%93%E5%BC%80%22%2C%22%24latest_referrer%22%3A%22%22%7D%2C%22identities%22%3A%22eyIkaWRlbnRpdHlfY29va2llX2lkIjoiMTk4ZWE1ZDNjZTYyYWQtMDBhMTY1NThiNDViZGQ3LTRjNjU3YjU4LTIwNzM2MDAtMTk4ZWE1ZDNjZTc5MzMifQ%3D%3D%22%2C%22history_login_id%22%3A%7B%22name%22%3A%22%22%2C%22value%22%3A%22%22%7D%2C%22%24device_id%22%3A%22198ea5d3ce62ad-00a16558b45bdd7-4c657b58-2073600-198ea5d3ce7933%22%7D; dewu_creator_x-auth-token=Bearer%20eyJhbGciOiJSUzI1NiJ9.eyJpYXQiOjE3NTYyNzkxMDUsImV4cCI6MTc4NzgxNTEwNSwidXNlcklkIjoyNjUxNDg2MTEzLCJpc0d1ZXN0IjpmYWxzZX0.mReeOlHsgs5jOhrfqIK1Zy5BZztYcHgS-DgMpU67Mce0nLjWbjMNQdV4LZETkyFARlRVrGAPbr33F7I0axO41G3LPK2Y8VfZk-CPZrrgP8LWk8dpwEblaSIFYJgx4tRDY22EMLizwLDTUykkuqmDuE0Yx592mj1oJ0vR2vR4FWjILxytDNYeZEFu1W5A8Y8U_xRU9GDxj04OUVEITzGHbrGOw1AkTTiuT2q8H10oU1wX3-kuqABNz3ohddtwuz2uy-nFPVgTEUxSdkQwl846bJG1KkUEJVIqexk-xb2KtgLZ5QKKzd2pVuQ_LaqPLEEWApb8TpKUENxAe_TNwscZDg; dewu_creator_duToken=4e822f3eb28489f03700ba79edae6bb1935a51292309eacc2c3eae64a08de5c6eb09aa824a4094de924f650449d3a47c|2651486113|1756279105|098a8216d8f4d0f294352a7ab969f8b17302c67d|2-0; dewu_creator_userInfo={%22userId%22:2651486113%2C%22userName%22:%22%E5%BE%97%E7%89%A9er-X8E4W8F7%22%2C%22icon%22:%22https://qiniu.dewucdn.com/FopKJAJnH2BCZ5M2MId0OmBVkvdp%22%2C%22sex%22:0%2C%22idiograph%22:%22%22%2C%22formatTime%22:%22%E5%88%9A%E5%88%9A%22%2C%22banned%22:0%2C%22vip%22:0%2C%22amount%22:0%2C%22amountSign%22:%22b37e38060e294be96da74a3e6889f02e%22%2C%22isOlder%22:0%2C%22isQuestionExpert%22:0%2C%22isAdmin%22:0%2C%22isBindMobile%22:1%2C%22isComplete%22:1%2C%22joinDays%22:0%2C%22isReadProtocol%22:0%2C%22isCertify%22:0%2C%22mobile%22:%22138****3847%22%2C%22addTime%22:1756279105%2C%22mobileMd5%22:%220dd24acf81e02659a665cc55ff426228%22%2C%22account%22:%22%22%2C%22accountType%22:0}; dewu_creator_xdwMark=2651486113; aliyungf_tc=2881afe326bddaacce57cffb42534696c0318659c5d35e1a6b7b4163f0bd3f3a';

    const result = await Cloud.getPlatformUserInfo(Platforms.DeWu, cookie);
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【真实测试】', () => {
  test('得物用户有效性', async () => {
    const cookie = 'PHPSESSID=hm6vhicf68ek4lkuufbp9iosb2';

    const result = await new AccountService(cookie, Platforms.DeWu).checkAccountAlive();
    console.log('有效性', result);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result).toBe(1);
  }, 10000000);
});
