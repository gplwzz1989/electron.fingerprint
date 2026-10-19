import { describe, expect, test } from 'vitest';
import { AccountService, Cloud, Platforms } from '../../../src';

describe.runIf(true)('【真实测试】', () => {
  test('峰网视频用户信息', async () => {
    const cookie =
      'o_user_id=383546557; o_auto_login=1; o_loginInfo=%7B%22user_id%22%3A%22383546557%22%2C%22user_name%22%3A%2215105307128%22%2C%22token%22%3A%22eGHj7Qg2MQBT4X8fcPPqyYfbA17PT2VgsKroSJyUujDJjTKgrUH3SSsUk8rzEckZ18xHpSQbUP77OcKP9HfNCyVfqIeXNOgzot3de9nSQz0%22%2C%22phone%22%3A%2215105307128%22%2C%22focuser_id%22%3A%2253653%22%2C%22shead%22%3A%22https%3A%5C%2F%5C%2Fimg.funshion.com%5C%2Fsdw%3Foid%3D0e597d9808537e7590b8b78e3e567920%26w%3D0%26h%3D0%22%7D; PHPSESSID=ltla7vihj6au6qhfn1dmpjbtr3';

    const result = await Cloud.getPlatformUserInfo(Platforms.FengWang, cookie);
    console.log(JSON.stringify(result, null, 2));
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.code).toBe(0);
  }, 10000000);
});

describe.runIf(true)('【真实测试】', () => {
  test('峰网用户有效性', async () => {
    const cookie =
      'o_user_id=383546557; o_auto_login=1; o_loginInfo=%7B%22user_id%22%3A%22383546557%22%2C%22user_name%22%3A%2215105307128%22%2C%22token%22%3A%22eGHj7Qg2MQBT4X8fcPPqyYfbA17PT2VgsKroSJyUujDJjTKgrUH3SSsUk8rzEckZ18xHpSQbUP77OcKP9HfNCyVfqIeXNOgzot3de9nSQz0%22%2C%22phone%22%3A%2215105307128%22%2C%22focuser_id%22%3A%2253653%22%2C%22shead%22%3A%22https%3A%5C%2F%5C%2Fimg.funshion.com%5C%2Fsdw%3Foid%3D0e597d9808537e7590b8b78e3e567920%26w%3D0%26h%3D0%22%7D; PHPSESSID=ltla7vihj6au6qhfn1dmpjbtr3';

    const result = await new AccountService(cookie, Platforms.FengWang).checkAccountAlive();
    console.log('有效性', result);
    // assets
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result).toBe(1);
  }, 10000000);
});
