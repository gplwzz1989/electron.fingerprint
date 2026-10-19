import { describe, expect, test } from 'vitest';
import { AIDeepSeek } from '../../../src/ai-platform/deepseek';
import { convertCookieStr } from '../../../src/utils';
import { AccountService, Cloud, Platforms } from '../../../src';

// 真实 Cookie - 需要替换为有效的DeepSeek cookie
const cookie = convertCookieStr(
  '[{"name":"intercom-device-id-guh50jw4","value":"94d52b69-164e-41d9-ab2c-0e69588eaf5a","domain":"chat.deepseek.com"},{"name":"HWWAFSESID","value":"ce75d30453c6485bd5f","domain":"chat.deepseek.com"},{"name":"HWWAFSESTIME","value":"1774329493570","domain":"chat.deepseek.com"},{"name":"ds_session_id","value":"c0c4f6058fff4c06b2365657da1668ed","domain":"chat.deepseek.com"},{"name":"accToken","value":"cS3DkZoBlkId73MI8Qc3x64mwhYLsI6xd411EOb1cPFo9jUAUuweX2n+wCjRredz"}]',
);

// 或者直接使用token
// const token = 'uif5tnROgjVxMmRCt65bxBIbeXu5wkJp4Ml3N6DPuF/RQLVikmV225rXwyLBtY1U';

describe.runIf(true)('【DeepSeek User 测试】', () => {
  test('获取用户信息', async () => {
    const userInfo = await Cloud.getPlatformUserInfo(Platforms.AI_DeepSeek, cookie);

    console.log('用户信息:', JSON.stringify(userInfo, null, 2));

    expect(userInfo).toBeDefined();
    expect(userInfo.code).toBeDefined();

    if (userInfo.code === 0) {
      expect(userInfo.yixiaoerId).toBeDefined();
      expect(userInfo.yixiaoerName).toBeDefined();
      console.log('用户ID:', userInfo.yixiaoerId);
      console.log('用户名:', userInfo.yixiaoerName);
    } else {
      console.log('获取用户信息失败:', userInfo.msg);
    }
  });
});

describe.runIf(true)('【DeepSeek User 测试】', () => {
  test('获取用户信息', async () => {
    const service = new AccountService(cookie, Platforms.AI_DeepSeek);
    const userInfo = await service.checkAccountAlive();

    console.log('用户有效:', JSON.stringify(userInfo, null, 2));
  });
});
