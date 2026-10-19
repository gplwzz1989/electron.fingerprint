import { describe, expect, it, vi } from 'vitest';
import { auditStatusEnum, publishStatusEnum } from '@/utils';
import { PubContentEnum } from '@/cloud/model/TypeEnum';
import { Platforms } from '@/service/datasync-service-manager';
import { TaoBaoGuangHe } from '@/media-platform';
import { TaoBaoGuangHeWorker } from './taobaoguangheworker';

describe('TaoBaoGuangHeWorker', () => {
  it('delegates publish status checks to the GuangHe content list API', async () => {
    const getMediaStatus = vi.spyOn(TaoBaoGuangHe, 'getTaoBaoGuangHeMediaStatus').mockResolvedValue({
      code: 0,
      msg: '定时发布中',
      publishId: 'publish-001',
      auditStatus: auditStatusEnum.prePublish,
    });
    const worker = new TaoBaoGuangHeWorker('');

    const result = await worker.checkAuditStatus('publish-001');

    expect(result).toMatchObject({
      code: 0,
      publishId: 'publish-001',
      msg: '定时发布中',
      auditStatus: auditStatusEnum.prePublish,
    });
    expect(getMediaStatus).toHaveBeenCalledWith('', 'publish-001');
    getMediaStatus.mockRestore();
  });

  it('requires a publish id when checking the publish result', async () => {
    const worker = new TaoBaoGuangHeWorker('');

    await expect(worker.checkAuditStatus('')).rejects.toThrow('publishId不能为空');
  });

  it('does not expose the platform topic search capability', async () => {
    const worker = new TaoBaoGuangHeWorker('');

    await expect(worker.searchTopic('游戏', PubContentEnum.video)).resolves.toMatchObject({
      code: 444,
      msg: '不支持的平台',
    });
  });

  it('uses the GuangHe delete endpoint through the common worker entry', async () => {
    const deleteContent = vi
      .spyOn(TaoBaoGuangHe, 'deleteTaoBaoGuangHeContent')
      .mockResolvedValue({ code: 0, msg: '删除成功' });
    const worker = new TaoBaoGuangHeWorker('cookie');

    await expect(worker.deleteContent('2161672207112615')).resolves.toEqual({ code: 0, msg: '删除成功' });
    expect(deleteContent).toHaveBeenCalledWith('cookie', '2161672207112615');
    deleteContent.mockRestore();
  });

  it.each([PubContentEnum.video, PubContentEnum.dynamic])(
    'returns scheduled %s publishing without a push success event',
    async (publishType) => {
      const publishId = `publish-scheduled-${publishType}`;
      const publish =
        publishType === PubContentEnum.video
          ? vi.spyOn(TaoBaoGuangHe, 'publishTaoBaoGuangHeVideo').mockResolvedValue({
              publishId,
              fileId: 'file-001',
              coverUrl: 'cover-001',
              raw: {},
            })
          : vi.spyOn(TaoBaoGuangHe, 'publishTaoBaoGuangHeImageText').mockResolvedValue({
              publishId,
              pictureIds: ['picture-001'],
              raw: {},
            });
      const worker = new TaoBaoGuangHeWorker('cookie');
      const progressStatuses: publishStatusEnum[] = [];
      worker.event.on('progress', (status) => progressStatuses.push(status));

      const result = await worker.publish({
        taskId: `scheduled-${publishType}`,
        publishType,
        platform: Platforms.TaoBaoGuangHe,
        prePubTime: Date.now() + 60_000,
        covers: [],
        images: [],
        video: { duration: 1, width: 1, height: 1, localPath: 'video.mp4' },
        title: '标题',
        short_title: '标题',
        desc: '',
        pubType: 1,
        platformAccount: { platformAccountId: 'account-001', cookie: 'cookie' },
      } as never);

      expect(result).toMatchObject({
        code: 0,
        msg: '定时发布中',
        publishId,
        scheduled: true,
      });
      expect(progressStatuses).not.toContain(publishStatusEnum.pushSuccess);
      expect(publish).toHaveBeenCalledOnce();
      publish.mockRestore();
    },
  );
});
