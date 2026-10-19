import { beforeEach, describe, expect, it, vi } from 'vitest';
import WebSocket from 'ws';

const { requestMock, contentListMock, unreadCountMock } = vi.hoisted(() => ({
  requestMock: vi.fn(),
  contentListMock: vi.fn(),
  unreadCountMock: vi.fn(),
}));

vi.mock('../../../src/media-platform/xiaohongshuhome/xiaohongshuhome-http.service', () => ({
  requestXiaohongshuhome: requestMock,
}));

vi.mock('../../../src/media-platform/xiaohongshuhome/xiaohongshuhome-common', () => ({
  getXiaohongshuContentList: contentListMock,
  getXiaohongshuhomeUnreadCount: unreadCountMock,
}));

import {
  getXiaohongshuhomeCommentByContent,
  getXiaohongshuhomeCommentContent,
  getXiaohongshuhomeLatestCommentNoticeList,
} from '../../../src/media-platform/xiaohongshuhome/xiaohongshuhome-comment';
import { XiaohongshuhomeMessageWebSocketService } from '../../../src/media-platform/xiaohongshuhome/xiaohongshuhome-message-websocket.service';

describe('小红书主页评论归一化', () => {
  beforeEach(() => {
    requestMock.mockReset();
    contentListMock.mockReset();
    unreadCountMock.mockReset();
  });

  it('应根据当前账号 id 标记评论作者', async () => {
    requestMock.mockResolvedValueOnce({
      code: 0,
      msg: '',
      data: {
        comments: [
          {
            id: 'comment-author',
            content: '作者评论',
            create_time: 1710000000,
            user_info: { user_id: 'account-id', nickname: '作者' },
          },
          {
            id: 'comment-other',
            content: '普通评论',
            create_time: 1710000001,
            user_info: { user_id: 'other-id', nickname: '用户' },
          },
        ],
      },
    });

    const result = await getXiaohongshuhomeCommentByContent(
      'cookie',
      'note-id_xsec-token',
      undefined,
      undefined,
      'account-id',
    );

    expect(result.dataList?.map((item) => item.isAuthor)).toEqual([true, false]);
    expect(result.dataList?.map((item) => item.contentId)).toEqual(['note-id', 'note-id']);
    expect(result.dataList?.map((item) => item.xsecToken)).toEqual(['xsec-token', 'xsec-token']);
    expect(requestMock.mock.calls[0]?.[1]).toContain('note_id=note-id');
    expect(requestMock.mock.calls[0]?.[1]).toContain('xsec_token=xsec-token');
  });

  it('应使用独立的 xsecToken 查询评论', async () => {
    requestMock.mockResolvedValueOnce({
      code: 0,
      msg: '',
      data: { comments: [] },
    });

    await getXiaohongshuhomeCommentByContent(
      'cookie',
      'note-id',
      undefined,
      undefined,
      'account-id',
      undefined,
      'xsec-token',
    );

    expect(requestMock.mock.calls[0]?.[1]).toContain('note_id=note-id');
    expect(requestMock.mock.calls[0]?.[1]).toContain('xsec_token=xsec-token');
  });

  it('评论作品列表应返回独立的 xsecToken', async () => {
    contentListMock.mockResolvedValueOnce({
      code: 0,
      msg: '',
      data: {
        notes: [
          {
            id: 'note-id',
            xsec_token: 'xsec-token',
            display_title: '作品标题',
            images_list: [{ url: 'cover-url' }],
            time: '1710000000000',
            comments_count: 3,
          },
        ],
      },
    });

    const result = await getXiaohongshuhomeCommentContent('cookie', undefined, 'account-id');

    expect(result.dataList?.[0]).toMatchObject({
      contentId: 'note-id',
      documentId: 'note-id',
      xsecToken: 'xsec-token',
    });
  });

  it('应在评论通知中标记评论作者', async () => {
    requestMock.mockResolvedValueOnce({
      code: 0,
      msg: '',
      data: {
        message_list: [
          {
            id: 'notice-author',
            type: 'comment/item',
            time: 1710000000,
            user_info: { userid: 'account-id', nickname: '作者' },
            comment_info: { id: 'comment-author', content: '作者评论' },
            item_info: { id: 'note-id', xsec_token: 'xsec-token' },
          },
        ],
      },
    });

    const result = await getXiaohongshuhomeLatestCommentNoticeList('cookie', undefined, 'account-id');

    expect(result.dataList?.[0]?.isAuthor).toBe(true);
    expect(result.dataList?.[0]).toMatchObject({
      contentId: 'note-id',
      documentId: 'note-id',
      xsecToken: 'xsec-token',
    });
  });

  it('应在长连接评论轮询中跳过首次历史数据并推送后续新评论', async () => {
    const buildNotice = (commentId: string, time: number) => ({
      id: `notice-${commentId}`,
      type: 'comment/item',
      time,
      user_info: { userid: 'other-id', nickname: '用户' },
      comment_info: { id: commentId, content: commentId },
      item_info: { id: 'note-id', xsec_token: 'xsec-token' },
    });

    requestMock
      .mockResolvedValueOnce({ code: 0, msg: '', data: { message_list: [buildNotice('old-comment', 1710000000)] } })
      .mockResolvedValueOnce({
        code: 0,
        msg: '',
        data: {
          message_list: [buildNotice('new-comment', 1710000001), buildNotice('old-comment', 1710000000)],
        },
      });
    unreadCountMock
      .mockResolvedValueOnce({ code: 0, data: { mentions: 1 } })
      .mockResolvedValueOnce({ code: 0, data: { mentions: 2 } });

    const service = new XiaohongshuhomeMessageWebSocketService({
      cookie: 'cookie',
      accountId: 'account-id',
      userId: 'account-id',
      aLt: 'aLt',
      commentPollingIntervalMs: 60000,
    });
    const internalService = service as any;
    internalService.ws = { readyState: WebSocket.OPEN, close: vi.fn() };
    const pushedComments: Array<{ commentId: string }> = [];
    service.on('newComment', (event: { comments: Array<{ commentId: string }> }) => {
      pushedComments.push(...event.comments);
    });

    internalService.startCommentPolling();
    await internalService.pollLatestComments(2);
    internalService.stopCommentPolling();
    await internalService.pollLatestComments(3);

    expect(pushedComments.map((comment) => comment.commentId)).toEqual(['new-comment']);
    service.close();
  });
});
