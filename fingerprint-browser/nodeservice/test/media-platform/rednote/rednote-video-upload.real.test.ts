import { describe, expect, it } from 'vitest';
import { uploadRedNoteVideoFromPath } from '@/media-platform/rednote';

const cookie =
  process.env.REDNOTE_COOKIE ??
  '';
const videoPath = process.env.REDNOTE_VIDEO_PATH ?? '/Users/yixiaoer/Downloads/飞书20260902-164238.mp4';

describe.runIf(Boolean(cookie && videoPath))('RedNote real video upload', () => {
  it('uploads a local video through the real multipart endpoint', async () => {
    const result = await uploadRedNoteVideoFromPath(cookie, videoPath, undefined, 3);
    expect(result.fileId).toBeTruthy();
    expect(result.completeResponse).toContain(result.fileId);
    console.info(JSON.stringify({ fileId: result.fileId, uploaded: true }));
  }, 120_000);
});
