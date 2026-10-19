import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }));

vi.mock('@/http', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/http')>();
  return {
    ...actual,
    $http: { get: getMock },
  };
});

import {
  getRedNoteUserInfo,
  getRedNoteUserInfoResponse,
  isRedNoteLoginExpired,
  isValidRedNoteUserInfo,
} from '@/media-platform/rednote';

describe('RedNote user info', () => {
  beforeEach(() => getMock.mockReset());

  it('requests user info with Cookie and without signature headers', async () => {
    getMock.mockResolvedValue({
      data: { code: 0, success: true, data: { userId: 'user-1', userName: 'RedNote user' } },
    });

    const result = await getRedNoteUserInfoResponse('web_session=session-value');
    const [, config] = getMock.mock.calls[0];

    expect(isValidRedNoteUserInfo(result)).toBe(true);
    expect(config.headers.Cookie).toBe('web_session=session-value');
    expect(config.headers.Referer).toBe('https://creator.rednote.com/publish/publish');
    expect(config.headers['X-s']).toBeUndefined();
    expect(config.headers['X-t']).toBeUndefined();
    expect(config.headers['X-S-Common']).toBeUndefined();
  });

  it('maps a successful response to PlatformAuthorInfo', async () => {
    getMock.mockResolvedValue({
      data: {
        code: 0,
        success: true,
        data: {
          userId: 'user-1',
          userName: 'RedNote user',
          userAvatar: 'https://example.com/avatar.jpg',
          realNameVerified: true,
        },
      },
    });

    await expect(getRedNoteUserInfo('web_session=session-value')).resolves.toMatchObject({
      code: 0,
      yixiaoerId: 'user-1',
      yixiaoerName: 'RedNote user',
      yixiaoerImageUrl: 'https://example.com/avatar.jpg',
      verify: true,
    });
  });

  it('recognizes an expired login response', () => {
    expect(isRedNoteLoginExpired({ code: -100, success: false })).toBe(true);
    expect(isRedNoteLoginExpired({ code: 1, success: false, message: 'Please login' })).toBe(true);
  });
});
