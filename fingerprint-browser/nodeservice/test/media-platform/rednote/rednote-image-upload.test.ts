import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Buffer } from 'buffer';

const { getMock, putMock, signMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  putMock: vi.fn(),
  signMock: vi.fn(),
}));

vi.mock('@/http', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/http')>();
  return { ...actual, $http: { get: getMock, put: putMock } };
});
vi.mock('@/media-platform/xhs-remote-sign.service', () => ({ getXhsRemoteSign: signMock }));

import {
  REDNOTE_IMAGE_UPLOAD_PERMIT_PATH,
  getRedNoteImageUploadPermit,
  uploadRedNoteImage,
} from '@/media-platform/rednote';

describe('RedNote direct image upload', () => {
  beforeEach(() => {
    getMock.mockReset();
    putMock.mockReset();
    signMock.mockReset();
    signMock.mockResolvedValue({
      'X-s': 'xs',
      'X-t': 'xt',
      'X-S-Common': 'common',
      a1: 'signed-a1',
    });
  });

  it('signs and requests the creator permit endpoint', async () => {
    getMock.mockResolvedValue({ data: { code: 0, success: true, data: { uploadTempPermits: [] } } });
    await getRedNoteImageUploadPermit('a1=old; web_session=session');
    const path = `${REDNOTE_IMAGE_UPLOAD_PERMIT_PATH}?biz_name=spectrum&scene=image&file_count=1&version=1&source=web`;
    expect(signMock).toHaveBeenCalledWith(path);
    expect(getMock.mock.calls[0][0]).toBe(`https://creator.rednote.com${path}`);
    expect(getMock.mock.calls[0][1].headers.Cookie).toBe('web_session=session; a1=signed-a1');
  });

  it('uses permit.token as x-cos-security-token for a single direct PUT', async () => {
    putMock.mockResolvedValue({ headers: { 'x-ros-preview-url': 'https://preview/file-id' }, data: '' });
    const node = {
      fileIds: ['oss-sg/spectrum/file-id'],
      token: 'permit-token',
      uploadAddr: 'upload.rnote.com',
    };
    const image = Buffer.from('image');
    const result = await uploadRedNoteImage(image, node);
    expect(putMock).toHaveBeenCalledTimes(1);
    expect(putMock.mock.calls[0][0]).toBe('https://upload.rnote.com/oss-sg/spectrum/file-id');
    expect(putMock.mock.calls[0][1]).toBe(image);
    expect(putMock.mock.calls[0][2].headers['x-cos-security-token']).toBe('permit-token');
    expect(result).toMatchObject({ fileId: 'oss-sg/spectrum/file-id', previewUrl: 'https://preview/file-id' });
  });
});
