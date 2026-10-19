import { describe, expect, it, vi } from 'vitest';
import { getXiaohongshuhomeMessageConversationInfo } from '../../../src/media-platform/xiaohongshuhome/xiaohongshuhome-message.service';

const { requestMock } = vi.hoisted(() => ({
  requestMock: vi.fn(),
}));

vi.mock('../../../src/media-platform/xiaohongshuhome/xiaohongshuhome-http.service', () => ({
  requestXiaohongshuhome: requestMock,
}));

describe('小红书主页会话详情', () => {
  it('应获取并转换指定用户的会话详情', async () => {
    requestMock.mockResolvedValueOnce({
      code: 0,
      msg: '成功',
      data: {
        chat_user_id2_info: {
          'user-id': {
            id: 'user-id',
            nickname: '测试用户',
            avatar: 'https://example.com/avatar.jpg',
          },
        },
      },
    });

    const result = await getXiaohongshuhomeMessageConversationInfo(
      'cookie',
      'session-id',
      'owner-id',
      'user-id',
      'account-id',
    );

    expect(requestMock).toHaveBeenCalledWith(
      'cookie',
      '/api/im/web/v3/chats/info?chat_user_ids=user-id',
      'GET',
      undefined,
      undefined,
    );
    expect(result.dataList).toEqual([
      expect.objectContaining({
        accountId: 'account-id',
        messageUserId: 'user-id',
        messageUserName: '测试用户',
        messageUserAvatar: 'https://example.com/avatar.jpg',
        sessionId: 'session-id',
        secSessionId: 'owner-id',
      }),
    ]);
  });

  it('缺少messageUserId时应回退使用sessionId', async () => {
    requestMock.mockResolvedValueOnce({
      code: 0,
      data: {
        chat_user_id2_info: {
          'session-id': {
            id: 'session-id',
            user_name: '回退用户',
          },
        },
      },
    });

    const result = await getXiaohongshuhomeMessageConversationInfo('cookie', 'session-id');

    expect(requestMock).toHaveBeenCalledWith(
      'cookie',
      '/api/im/web/v3/chats/info?chat_user_ids=session-id',
      'GET',
      undefined,
      undefined,
    );
    expect(result.dataList?.[0]?.messageUserName).toBe('回退用户');
  });
});
