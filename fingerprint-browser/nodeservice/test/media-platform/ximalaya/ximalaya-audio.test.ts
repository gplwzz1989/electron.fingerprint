import { EventEmitter } from 'events';
import { describe, expect, test } from 'vitest';
import { StatementTypeEnum } from '@/cloud/model/BaseTaskFormModel';
import { VisibleTypeEnum } from '@/cloud/model/TypeEnum';
import { Ximalaya } from '@/media-platform/ximalaya';
import type { XimalayaAudioTaskInput } from '@/media-platform/ximalaya/ximalaya-audio';

// 填入以下值后会执行真实发布测试。不要提交真实 Cookie 或本地文件路径。
const cookie = '';
const audioFilePath = '';
// 支持本地路径或 HTTP(S) 图片 URL。
const coverFilePath = '';

const publishTaskData: XimalayaAudioTaskInput = {
  taskId: `ximalaya-audio-test-${Date.now()}`,
  audio: { localPath: audioFilePath },
  cover: { localPath: coverFilePath },
  title: '测试音频标题',
  desc: '测试音频简介',
  soundRichIntro: '<p>测试音频简介</p>',
  // 请填写喜马拉雅分类 ID；示例 4 为“娱乐”。
  categoryId: '4',
  tags: ['测试标签'],
  // 话题请先调用 Ximalaya.searchTopic()，使用结果中的 yixiaoerId（metadataId）。
  topics: [],
  visibleType: VisibleTypeEnum.public,
  statement: { type: StatementTypeEnum.不声明 },
};

const hasRealPublishInput = Boolean(cookie.trim() && audioFilePath.trim() && coverFilePath.trim());

describe('喜马拉雅音频真实发布', () => {
  test.skipIf(!hasRealPublishInput)('使用真实 Cookie 发布音频', async () => {
    const event = new EventEmitter();
    const progress: string[] = [];
    event.on('progress', (status, message) => {
      progress.push(message);
      console.info('喜马拉雅发布进度:', { status, message });
    });

    const result = await Ximalaya.publishAudio(cookie, publishTaskData, event);
    console.info('喜马拉雅发布结果:', result);

    expect(result.code).toBe(0);
    expect(result.publishId).toEqual(expect.any(String));
    expect(progress).toContain('喜马拉雅音频上传完成');
  });
});
