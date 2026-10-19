import { EventEmitter } from 'events';
import { describe, expect, test } from 'vitest';
import {
  buildPostData,
  publishToutiaohaoVideo,
  resolveToutiaohaoVideoTopicNames,
  validateToutiaohaoVideoTags,
} from '@/media-platform/toutiaohao/toutiaohao-video';
import { errorCode } from '@/media-platform/errorCode';

describe('头条横版视频 tags', () => {
  test('校验 1 至 5 个字符串标签', () => {
    expect(validateToutiaohaoVideoTags(['科技'])).toBe(true);
    expect(validateToutiaohaoVideoTags(new Array(5).fill('标签'))).toBe(true);
    expect(validateToutiaohaoVideoTags(['a'.repeat(10000)])).toBe(true);
    expect(validateToutiaohaoVideoTags([])).toBe(false);
    expect(validateToutiaohaoVideoTags(new Array(6).fill('标签'))).toBe(false);
    expect(validateToutiaohaoVideoTags(['科技', 1])).toBe(false);
  });

  test('优先使用独立话题，没有独立话题时使用 tags 生成话题', () => {
    expect(resolveToutiaohaoVideoTopicNames(['旅行'], ['科技', '生活'])).toEqual(['旅行']);
    expect(resolveToutiaohaoVideoTopicNames([], ['科技', '生活'])).toEqual(['科技', '生活']);
  });

  test('无效标签在上传前返回参数错误', async () => {
    const taskData = {
      taskId: 'task-without-tags',
      tags: [],
      video: { localPath: 'not-exist.mp4' },
    } as unknown as Parameters<typeof publishToutiaohaoVideo>[1];

    const result = await publishToutiaohaoVideo('', taskData, new EventEmitter());

    expect(result.code).toBe(errorCode.data_error);
    expect(result.msg).toContain('标签');
  });

  test('发布请求 body 包含 tags 数组', () => {
    const taskData = {
      title: '测试视频',
      desc: '测试描述',
      tags: ['科技', '生活', '分享'],
    } as Parameters<typeof buildPostData>[0];
    const coverInfo = { data: [{ uri: 'cover-uri' }] } as Parameters<typeof buildPostData>[1];
    const videoInfo = {
      Result: {
        Results: [
          {
            Vid: 'video-id',
            VideoMeta: { Duration: 12, Uri: 'video-uri' },
          },
        ],
      },
    } as Parameters<typeof buildPostData>[2];

    const body = JSON.parse(buildPostData(taskData, coverInfo, videoInfo, '', '', undefined, ['topic-id-1']));

    expect(body.tags).toEqual(['科技', '生活', '分享']);
    expect(body.HashtagIds).toEqual(['topic-id-1']);
  });
});
