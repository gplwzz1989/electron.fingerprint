import { afterEach, describe, expect, it, vi } from 'vitest';
import { PubContentEnum } from '@/cloud/model/TypeEnum';
import { BiliBiliWorker } from '@/cloud/task/platform/bilibiliworker';
import { Bilibili } from '@/media-platform/bilibili';

describe('BiliBiliWorker participation topic flow', () => {
  afterEach(() => vi.restoreAllMocks());

  it('routes the existing activity-list flow to participation-topic recommendation', async () => {
    const participationTopicMock = vi
      .spyOn(Bilibili, 'getBilibiliVideoParticipationTopic')
      .mockResolvedValue({ code: 0, dataList: [] });
    const worker = new BiliBiliWorker('cookie=value');

    await worker.getActivityList(PubContentEnum.video, '21', undefined, {
      parentCategoryId: 1029,
      title: '作品标题',
      trackId: 'track-id',
      uploadId: 'upload-id',
      zipUrl: 'upos://svfboss/example.zip',
    });

    expect(participationTopicMock).toHaveBeenCalledWith(
      worker.cookies,
      expect.objectContaining({
        categoryId: '21',
        parentCategoryId: 1029,
        title: '作品标题',
        trackId: 'track-id',
        uploadId: 'upload-id',
        zipUrl: 'upos://svfboss/example.zip',
      }),
    );
  });

  it('routes a keyword through participation-topic search while keeping ordinary topic search separate', async () => {
    const participationTopicMock = vi
      .spyOn(Bilibili, 'getBilibiliVideoParticipationTopic')
      .mockResolvedValue({ code: 0, dataList: [] });
    const ordinaryTopicMock = vi.spyOn(Bilibili, 'getBilibiliVideoTopic').mockResolvedValue({ code: 0, dataList: [] });
    const worker = new BiliBiliWorker('cookie=value');

    await worker.getActivityList(PubContentEnum.video, '21', '游戏');
    expect(participationTopicMock).toHaveBeenCalledWith(
      worker.cookies,
      expect.objectContaining({ categoryId: '21', keyWord: '游戏' }),
    );

    await worker.searchTopic('游戏', PubContentEnum.video, '21');
    expect(ordinaryTopicMock).toHaveBeenCalledWith(worker.cookies, 21, '游戏');
  });
});
