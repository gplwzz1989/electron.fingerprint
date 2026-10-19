import { afterEach, describe, expect, test, vi } from 'vitest';
import { ShiPinHaoMsgWorker } from '@/cloud/task/shipinhao-msg-worker';
import { Shipinhao } from '@/media-platform';

describe('ShiPinHaoMsgWorker', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test('首次无游标拉取只返回30分钟内的私信', async () => {
    const now = new Date('2026-08-03T12:00:00+08:00');
    vi.useFakeTimers();
    vi.setSystemTime(now);
    vi.spyOn(Shipinhao, 'getShipinhaoMessageInitInfo').mockResolvedValue({
      yixiaoerId: 'author-id',
      raw: { finderUsername: 'finder-username' },
    } as any);
    vi.spyOn(Shipinhao, 'getShiPinHaoNewMessageList').mockImplementation(async () => ({
      code: 0,
      msg: '',
      nextPage: 'next-page',
      dataList: [
        {
          platform: 'ShiPinHao' as any,
          accountId: 'author-id',
          messageId: 'within-30-minutes',
          content: '保留',
          timestamp: now.getTime() - 30 * 60 * 1000,
          messageUserId: 'user-id',
        },
        {
          platform: 'ShiPinHao' as any,
          accountId: 'author-id',
          messageId: 'over-30-minutes',
          content: '过滤',
          timestamp: now.getTime() - 30 * 60 * 1000 - 1,
          messageUserId: 'user-id',
        },
      ],
    }));

    const worker = new ShiPinHaoMsgWorker('sessionid=test; wxuin=test');
    const result = await worker.getNewMessageList({ platformAuthorId: 'author-id' });

    expect(result.dataList?.map((item) => item.messageId)).toEqual(['within-30-minutes']);

    const nextPageResult = await worker.getNewMessageList({
      nextPage: 'next-page',
      platformAuthorId: 'author-id',
    });
    expect(nextPageResult.dataList?.map((item) => item.messageId)).toEqual([
      'within-30-minutes',
      'over-30-minutes',
    ]);
  });
});
