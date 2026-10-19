import { EventEmitter } from 'events';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SyncEventName } from '../../../src/service/datasync-service-manager';
import { XiaohongshuhomeMsgWorker } from '../../../src/cloud/task/xiaohongshuhome-msg-worker';

describe('小红书主页私信服务评论轮询', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('未读数不变时不获取最新评论，变化时按上次评论时间抛出新评论', async () => {
    const getUnreadCount = vi
      .fn()
      .mockResolvedValueOnce({ code: 0, data: { mentions: 1 } })
      .mockResolvedValueOnce({ code: 0, data: { mentions: 2 } })
      .mockResolvedValueOnce({ code: 0, data: { mentions: 2 } });
    const getLatestCommentNoticeList = vi
      .fn()
      .mockResolvedValueOnce({
        code: 0,
        dataList: [{ commentId: 'old-comment', timestamp: 100, content: '旧评论' }],
      })
      .mockResolvedValueOnce({
        code: 0,
        dataList: [
          { commentId: 'new-comment', timestamp: 101, content: '新评论' },
          { commentId: 'old-comment', timestamp: 100, content: '旧评论' },
        ],
      });
    const worker = new XiaohongshuhomeMsgWorker('cookie', undefined, { platformAuthorId: 'account-id' });
    (worker as any).platformWorker = {
      getUnreadCount,
      getLatestCommentNoticeList,
    };
    const event = new EventEmitter();
    const pushedComments: Array<{ commentId?: string }> = [];
    event.on(SyncEventName.comment_data_back, (comments) => pushedComments.push(...comments));

    await (worker as any).fetchLatestComments('account-id', event);
    await (worker as any).fetchLatestComments('account-id', event);
    await (worker as any).fetchLatestComments('account-id', event);

    expect(getUnreadCount).toHaveBeenCalledTimes(3);
    expect(getLatestCommentNoticeList).toHaveBeenCalledTimes(2);
    expect(pushedComments.map((comment) => comment.commentId)).toEqual(['new-comment']);
    expect((worker as any).lastCommentCreateTime).toBe(101);
  });
});
