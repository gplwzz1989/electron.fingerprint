import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'events';

const { imageMock, videoMock, postMock, topicMock } = vi.hoisted(() => ({
  imageMock: vi.fn(), videoMock: vi.fn(), postMock: vi.fn(), topicMock: vi.fn(),
}));
vi.mock('@/media-platform/rednote/rednote-image-upload.service', () => ({
  uploadRedNoteImageFromPath: imageMock,
}));
vi.mock('@/media-platform/rednote/rednote-video-upload.service', () => ({
  uploadRedNoteVideoFromPath: videoMock,
}));
vi.mock('@/media-platform/rednote/rednote-signed-request.service', () => ({
  redNoteSignedPostRaw: postMock,
}));
vi.mock('@/media-platform/rednote/rednote-topic.service', () => ({
  createRedNoteTopicResponse: topicMock,
}));

import { publishRedNoteDynamic, publishRedNoteVideo } from '@/media-platform/rednote/rednote-publish.service';

describe('RedNote task proxy scope', () => {
  const proxy = { serverAdd: '127.0.0.1', serverPort: 7890, type: 'http' as const };
  const common = {
    taskId: 'task-1', title: 'title', desc: '<p><topic text="test" /></p>',
    visibilityType: 0 as const, proxy,
  };
  beforeEach(() => {
    vi.clearAllMocks();
    imageMock.mockResolvedValue({ fileId: 'image-id' });
    videoMock.mockResolvedValue({ fileId: 'video-id' });
    postMock.mockResolvedValue({ code: 0, data: { id: 'note-id' } });
    topicMock.mockResolvedValue({ data: { topic_infos: [{ id: 'topic-id', name: 'test' }] } });
  });

  it('uploads images and resolves topics without task proxy, then publishes with it', async () => {
    const result = await publishRedNoteDynamic('cookie', {
      ...common, images: [{ pathOrUrl: '/tmp/image.png' }],
    }, new EventEmitter());
    expect(result.code).toBe(0);
    expect(imageMock).toHaveBeenCalledWith('cookie', '/tmp/image.png');
    expect(topicMock).toHaveBeenCalledWith('cookie', 'test');
    expect(postMock.mock.calls[0][3].proxy).toBe(proxy);
  });

  it('uploads video and cover without task proxy, then publishes with it', async () => {
    const result = await publishRedNoteVideo('cookie', {
      ...common,
      video: { localPath: '/tmp/video.mp4', width: 1080, height: 1920, duration: 10 },
      cover: { pathOrUrl: '/tmp/cover.png', width: 1080, height: 1920 },
    }, new EventEmitter());
    expect(result.code).toBe(0);
    expect(videoMock).toHaveBeenCalledWith('cookie', '/tmp/video.mp4', undefined, 3, expect.any(Function));
    expect(imageMock).toHaveBeenCalledWith('cookie', '/tmp/cover.png');
    expect(topicMock).toHaveBeenCalledWith('cookie', 'test');
    expect(postMock.mock.calls[0][3].proxy).toBe(proxy);
  });
});
