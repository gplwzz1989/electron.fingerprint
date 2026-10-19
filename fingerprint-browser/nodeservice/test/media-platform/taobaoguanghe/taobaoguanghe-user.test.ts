import { afterEach, describe, expect, it, vi } from 'vitest';
import { $http } from '@/http';
import {
  getTaoBaoGuangHeUserInfo,
  TaoBaoGuangHeUserInfoUrl,
} from '@/media-platform/taobaoguanghe/taobaoguanghe-user.service';
import { TaoBaoGuangHe } from '@/media-platform/taobaoguanghe';
import { AccountService } from '@/service/account-browser-service';
import { Platforms } from '@/service/datasync-service-manager';

describe('淘宝光合授权', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('通过 queryPerson 携带 Cookie 请求账号信息', async () => {
    const post = vi.spyOn($http, 'post').mockResolvedValue({
      data: {
        code: 0,
        data: {
          id: 123,
          userNick: 'demo',
          avatar: 'https://example.com/avatar.png',
        },
      },
      status: 200,
      statusText: 'OK',
    } as never);

    const result = await getTaoBaoGuangHeUserInfo('sid=demo');

    expect(result.data?.id).toBe(123);
    expect(post).toHaveBeenCalledWith(
      TaoBaoGuangHeUserInfoUrl,
      {},
      expect.objectContaining({
        headers: expect.objectContaining({
          cookie: 'sid=demo',
          Origin: 'https://creator.guanghe.taobao.com',
          Referer: 'https://creator.guanghe.taobao.com/page',
        }),
      }),
    );
  });

  it('登录态有效时返回统一账号信息', async () => {
    vi.spyOn(TaoBaoGuangHe, 'getTaoBaoGuangHeUserInfo').mockResolvedValue({
      code: 0,
      data: {
        id: 'account-id',
        userNick: 'demo',
        avatar: 'https://example.com/avatar.png',
      },
    });

    const service = new AccountService('sid=demo', '淘宝光合');
    const result = await service.checkAccountAlive();

    expect(result).toBe(1);
    expect(service.userInfo).toMatchObject({
      code: 0,
      yixiaoerId: 'account-id',
      yixiaoerName: 'demo',
      yixiaoerImageUrl: 'https://example.com/avatar.png',
    });
  });

  it('接口返回未登录时标记为失效', async () => {
    vi.spyOn(TaoBaoGuangHe, 'getTaoBaoGuangHeUserInfo').mockResolvedValue({
      code: 172403,
      msg: '登录失效',
    });

    const service = new AccountService('sid=expired', Platforms.TaoBaoGuangHe);

    await expect(service.checkAccountAlive()).resolves.toBe(0);
    expect(service.userInfo).toBeUndefined();
  });
});
