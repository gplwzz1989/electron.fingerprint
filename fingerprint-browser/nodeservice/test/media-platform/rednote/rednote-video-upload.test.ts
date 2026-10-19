import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Buffer } from 'buffer';

const { postMock, putMock } = vi.hoisted(() => ({ postMock: vi.fn(), putMock: vi.fn() }));
vi.mock('@/http', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/http')>();
  return { ...actual, $http: { post: postMock, put: putMock } };
});

import {
  completeRedNoteMultipartUpload,
  createRedNoteMultipartUpload,
  uploadRedNoteVideoPart,
} from '@/media-platform/rednote';

describe('RedNote multipart video upload', () => {
  const node = { fileIds: ['oss-sg/spectrum/video-id'], token: 'token', uploadAddr: 'upload.rnote.com' };

  beforeEach(() => {
    postMock.mockReset();
    putMock.mockReset();
  });

  it('creates an upload and extracts UploadId from COS XML', async () => {
    postMock.mockResolvedValue({ data: '<InitiateMultipartUploadResult><UploadId>upload-1</UploadId></InitiateMultipartUploadResult>' });
    await expect(createRedNoteMultipartUpload(node)).resolves.toBe('upload-1');
    expect(postMock.mock.calls[0][0]).toBe('https://upload.rnote.com/oss-sg/spectrum/video-id?uploads');
    expect(postMock.mock.calls[0][2].headers['x-cos-security-token']).toBe('token');
  });

  it('uploads numbered parts and returns their etag', async () => {
    putMock.mockResolvedValue({ data: '', headers: { etag: '"part-etag"' } });
    await expect(uploadRedNoteVideoPart(node, 'upload-1', 2, Buffer.from('part'))).resolves.toBe('"part-etag"');
    expect(putMock.mock.calls[0][0]).toContain('?partNumber=2&uploadId=upload-1');
  });

  it('completes ordered parts with a Content-MD5 header', async () => {
    postMock.mockResolvedValue({ data: '<Location>oss-sg/spectrum/video-id</Location>' });
    await completeRedNoteMultipartUpload(node, 'upload-1', ['"etag-1"', '"etag-2"']);
    expect(postMock.mock.calls[0][1]).toContain('<PartNumber>1</PartNumber><ETag>"etag-1"</ETag>');
    expect(postMock.mock.calls[0][2].headers['Content-MD5']).toBeTruthy();
  });
});
