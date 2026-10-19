import { describe, expect, test, vi } from 'vitest';
import { SouHuHaoWorker } from '@/cloud/task/platform/souhuhaoworkder';
import { BaseSinglePublishTaskArticle } from '@/cloud/model/BaseTaskFormModel';
import { PubContentEnum } from '@/cloud/model/TypeEnum';
import { Souhuhao } from '@/media-platform/souhuhao';
import { Platforms } from '@/service/datasync-service-manager';

describe('搜狐号文章任务数据', () => {
  test('将统一任务的 desc 传给搜狐号发布参数', async () => {
    const publishArticleSpy = vi.spyOn(Souhuhao, 'publishArticle').mockResolvedValue({
      code: 0,
      msg: '',
      taskId: 'task-1',
    });

    const task = {
      publishType: PubContentEnum.article,
      taskId: 'task-1',
      platform: Platforms.SouHuHao,
      covers: [],
      title: '标题',
      short_title: '',
      desc: '文章摘要',
      platformAccount: {},
      pubType: 1,
      content: '<p>正文</p>',
      contentPublishUrl: '',
    } as BaseSinglePublishTaskArticle;

    try {
      await new SouHuHaoWorker('cookie').publish(task);

      expect(publishArticleSpy).toHaveBeenCalledTimes(1);
      expect(publishArticleSpy.mock.calls[0][1].desc).toBe('文章摘要');
    } finally {
      publishArticleSpy.mockRestore();
    }
  });
});
