import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getMock, postMock, signMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  signMock: vi.fn(),
}));

vi.mock('@/http', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/http')>();
  return { ...actual, $http: { get: getMock, post: postMock } };
});

vi.mock('@/media-platform/xhs-remote-sign.service', () => ({ getXhsRemoteSign: signMock }));

import { REDNOTE_WEB_API_ORIGIN, redNoteSignedGet, redNoteSignedPost, replaceCookieA1 } from '@/media-platform/rednote';

describe('RedNote signed requests', () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    signMock.mockReset();
    signMock.mockResolvedValue({
      'X-s': 'signed-xs',
      'X-t': 1234567890,
      'X-S-Common': 'signed-common',
      a1: 'signed-a1',
    });
  });

  it('replaces only the a1 cookie without mutating the input', () => {
    const original = 'web_session=session; a1=old-a1; id_token=token';
    expect(replaceCookieA1(original, 'new-a1')).toBe('web_session=session; id_token=token; a1=new-a1');
    expect(original).toBe('web_session=session; a1=old-a1; id_token=token');
  });

  it('signs and sends the exact same JSON body to RedNote', async () => {
    postMock.mockResolvedValue({ data: { code: 0, success: true } });
    const data = { keyword: '台', page: { page_size: 20, page: 1 } };
    const expectedBody = JSON.stringify(data);

    await redNoteSignedPost('a1=old; web_session=session', '/web_api/test', data);

    expect(signMock).toHaveBeenCalledWith('/web_api/test', expectedBody);
    const [url, actualBody, config] = postMock.mock.calls[0];
    expect(url).toBe(`${REDNOTE_WEB_API_ORIGIN}/web_api/test`);
    expect(actualBody).toBe(expectedBody);
    expect(config.headers.Cookie).toBe('web_session=session; a1=signed-a1');
    expect(config.headers['X-s']).toBe('signed-xs');
    expect(config.headers['X-t']).toBe('1234567890');
    expect(config.headers['X-S-Common']).toBe('signed-common');
    expect(config.headers.Origin).toBe('https://www.rednote.com');
  });

  it('signs GET requests without a body', async () => {
    getMock.mockResolvedValue({ data: { code: 0 } });
    await redNoteSignedGet('a1=old', '/api/test');
    expect(signMock).toHaveBeenCalledWith('/api/test');
    expect(getMock.mock.calls[0][0]).toBe(`${REDNOTE_WEB_API_ORIGIN}/api/test`);
  });

  it('can send a signed GET request to the creator site', async () => {
    getMock.mockResolvedValue({ data: { code: 0 } });
    await redNoteSignedGet('a1=old', '/api/galaxy/test', { requestOrigin: 'https://creator.rednote.com' });
    expect(getMock.mock.calls[0][0]).toBe('https://creator.rednote.com/api/galaxy/test');
  });
});
