import { describe, expect, it, vi } from 'vitest';

const { requestMock } = vi.hoisted(() => ({
  requestMock: vi.fn(),
}));

vi.mock('../../../src/media-platform/xiaohongshuhome/xiaohongshuhome-http.service', () => ({
  requestXiaohongshuhome: requestMock,
}));

import { getXiaohongshuhomeUnreadCount } from '../../../src/media-platform/xiaohongshuhome/xiaohongshuhome-common';

describe('小红书主页评论未读数', () => {
  it('应调用未读数接口并返回mentions', async () => {
    requestMock.mockResolvedValueOnce({
      code: 0,
      msg: '成功',
      data: { likes: 0, connections: 0, mentions: 3, unread_count: 3 },
    });

    const result = await getXiaohongshuhomeUnreadCount('cookie');

    expect(requestMock).toHaveBeenCalledWith(
      'cookie',
      '/api/sns/web/unread_count',
      'GET',
      undefined,
      undefined,
    );
    expect(result.data?.mentions).toBe(3);
  });
});
