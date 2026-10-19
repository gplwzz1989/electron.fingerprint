import { afterEach, describe, expect, test, vi } from 'vitest';
import { $http } from '@/http';
import {
  getChannelsSessionByXiaodianCredential,
  XiaodianLoginPollingController,
} from '../../../src/media-platform/shipinhao/xiaodian-login';

describe('微信小店二维码登录轮询', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test('二维码结果已返回等待状态后不再重复抛出等待事件', async () => {
    vi.useFakeTimers();
    vi.spyOn($http, 'get').mockResolvedValue({
      status: 200,
      data: { code: 0, data: { status: 0 } },
      headers: {},
    } as never);
    const controller = new XiaodianLoginPollingController(
      {
        loginSessionId: 'login-session-id',
        qrTicket: 'qr-ticket',
        deviceId: 'device-id',
        cookies: {},
        createdAt: Date.now(),
        expireAt: Date.now() + 60_000,
        userAgent: 'user-agent',
        emittedStatuses: new Set(['waiting'] as const),
      },
      'login-session-id',
      { intervalMs: 1_000 },
    );
    const waitingListener = vi.fn();
    controller.on('waiting', waitingListener);

    controller.start();
    await vi.advanceTimersByTimeAsync(3_000);
    controller.stop();

    expect(waitingListener).not.toHaveBeenCalled();
  });

  test('手机扫码后未确认时只抛出一次扫码事件', async () => {
    vi.useFakeTimers();
    vi.spyOn($http, 'get').mockResolvedValue({
      status: 200,
      data: { code: 0, status: 2 },
      headers: {},
    } as never);
    const controller = new XiaodianLoginPollingController(
      {
        loginSessionId: 'login-session-id',
        qrTicket: 'qr-ticket',
        deviceId: 'device-id',
        cookies: {},
        createdAt: Date.now(),
        expireAt: Date.now() + 60_000,
        userAgent: 'user-agent',
      },
      'login-session-id',
      { intervalMs: 1_000 },
    );
    const scannedListener = vi.fn();
    controller.on('scanned', scannedListener);

    controller.start();
    await vi.advanceTimersByTimeAsync(3_000);
    controller.stop();

    expect(scannedListener).toHaveBeenCalledTimes(1);
  });

  test('同一授权会话的多个轮询只抛出一次确认状态事件', async () => {
    vi.spyOn($http, 'get').mockResolvedValue({
      status: 200,
      data: { code: 0, status: 3 },
      headers: {},
    } as never);
    const context = {
      loginSessionId: 'login-session-id',
      qrTicket: 'qr-ticket',
      deviceId: 'device-id',
      cookies: {},
      createdAt: Date.now(),
      expireAt: Date.now() + 60_000,
      userAgent: 'user-agent',
    };
    const firstController = new XiaodianLoginPollingController(context, 'login-session-id', {});
    const secondController = new XiaodianLoginPollingController(context, 'login-session-id', {});
    const confirmedListener = vi.fn();
    const failedListener = vi.fn();
    firstController.on('confirmed', confirmedListener);
    secondController.on('confirmed', confirmedListener);
    firstController.on('failed', failedListener);
    secondController.on('failed', failedListener);

    firstController.start();
    secondController.start();

    await vi.waitFor(() => expect(failedListener).toHaveBeenCalledTimes(2));
    expect(confirmedListener).toHaveBeenCalledTimes(1);
  });

  test('不同事件名称携带相同确认状态时只抛出第一个事件', () => {
    const controller = new XiaodianLoginPollingController(
      {
        loginSessionId: 'login-session-id',
        qrTicket: 'qr-ticket',
        deviceId: 'device-id',
        cookies: {},
        createdAt: Date.now(),
        expireAt: Date.now() + 60_000,
        userAgent: 'user-agent',
      },
      'login-session-id',
      {},
    );
    const confirmedListener = vi.fn();
    const loggedInListener = vi.fn();
    const credentialListener = vi.fn();
    controller.on('confirmed', confirmedListener);
    controller.on('loggedIn', loggedInListener);
    controller.on('xiaodianCredential', credentialListener);

    controller['emitEvent']('confirmed', {
      loginSessionId: 'login-session-id',
      status: 'confirmed',
      message: '扫码确认完成',
    });
    controller['emitEvent']('loggedIn', {
      loginSessionId: 'login-session-id',
      status: 'confirmed',
      message: '已登录微信小店',
      credentials: [],
    });
    controller['emitEvent']('xiaodianCredential', {
      loginSessionId: 'login-session-id',
      status: 'confirmed',
      message: '已获取微信小店登录凭据',
      credentials: [],
    });

    expect(confirmedListener).toHaveBeenCalledTimes(1);
    expect(loggedInListener).not.toHaveBeenCalled();
    expect(credentialListener).not.toHaveBeenCalled();
  });

  test('使用小店凭据获取视频号鉴权失败时返回指定错误码', async () => {
    vi.spyOn($http, 'get').mockResolvedValue({
      status: 200,
      data: { code: 10001, errMsg: '登录凭据已失效' },
      headers: {},
    } as never);

    await expect(getChannelsSessionByXiaodianCredential('biz_token=token')).rejects.toMatchObject({
      code: 300333,
      message: expect.stringContaining('鉴权失败'),
    });
  });
});
