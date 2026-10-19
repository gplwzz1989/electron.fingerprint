import { EventEmitter } from 'events';
import { describe, expect, test, vi, afterEach } from 'vitest';
import { MessageWorkerService } from '../../src/cloud/task/message_worker_service';
import { BaseMsgWorker } from '../../src/cloud/task/base-msg-worker';
import { Platforms } from '../../src/service/datasync-service-manager';
import { errorCode } from '../../src/media-platform/errorCode';

class TestMsgWorker extends BaseMsgWorker {
  public async fetchNewMessages(): Promise<any> {
    return { code: errorCode.loginExpire, msg: '登录失效', dataList: [] };
  }
}

describe('私信登录失效统一处理', () => {
  let service: MessageWorkerService | undefined;

  afterEach(() => {
    service?.stop();
    service = undefined;
    vi.restoreAllMocks();
  });

  test('私信监控发现登录失效时应该回调并停止', async () => {
    service = new MessageWorkerService(Platforms.DouYin, {
      cookie: 'sessionid=test; wxuin=123456',
      platformAccountId: 'test-account',
      platformAuthorId: 'test-author',
      localStorage: {},
    });

    service['worker'] = {
      fetchNewMessages: async () => ({ code: errorCode.loginExpire, msg: '登录失效', dataList: [] }),
      dropMsgService: async () => ({ code: 0, msg: '' }),
      disposeWebSocketService: () => undefined,
    } as any;

    const webhookSpy = vi.spyOn(service as any, 'postBackPrivateMsgLoginExpire').mockResolvedValue(undefined);
    const stopSpy = vi.spyOn(service, 'stop');

    await service['fetchAndPushNewMessagesInner'](undefined);

    expect(webhookSpy).toHaveBeenCalledTimes(1);
    expect(stopSpy).toHaveBeenCalledTimes(1);
    expect(service['drop']).toBe(true);
  });

  test('基础Worker应该透传消息状态码', async () => {
    const worker = new TestMsgWorker('sessionid=test; wxuin=123456');
    const event = new EventEmitter();

    const result = await worker.createMsgService({ platformAuthorId: 'test-author' }, event);

    expect(result.code).toBe(errorCode.loginExpire);
    expect(result.msg).toBe('登录失效');
  });
});
