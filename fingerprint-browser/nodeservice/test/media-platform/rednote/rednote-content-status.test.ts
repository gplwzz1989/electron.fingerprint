import { beforeEach, describe, expect, it, vi } from 'vitest';
import { auditStatusEnum } from '@/utils';

const { signedGetMock } = vi.hoisted(() => ({ signedGetMock: vi.fn() }));
vi.mock('@/media-platform/rednote/rednote-signed-request.service', () => ({ redNoteSignedGet: signedGetMock }));

import { getRedNoteMediaStatus, mapRedNoteAuditStatus } from '@/media-platform/rednote/rednote-content-status.service';

describe('RedNote content status', () => {
  beforeEach(() => signedGetMock.mockReset());

  it('maps the provisional RedNote status values', () => {
    expect(mapRedNoteAuditStatus({ id: '1', tab_status: 1 })).toBe(auditStatusEnum.published);
    expect(mapRedNoteAuditStatus({ id: '1', tab_status: 2 })).toBe(auditStatusEnum.inAudit);
    expect(mapRedNoteAuditStatus({ id: '1', tab_status: 3 })).toBe(auditStatusEnum.deny);
    expect(mapRedNoteAuditStatus({ id: '1', tab_status: 4 })).toBe(auditStatusEnum.prePublish);
    expect(mapRedNoteAuditStatus({ id: '1', tab_status: 1, permission_code: 1 })).toBe(auditStatusEnum.notPublic);
  });

  it('searches pages by publishId and returns the mapped audit result', async () => {
    signedGetMock
      .mockResolvedValueOnce({ code: 0, data: { notes: [{ id: 'other', tab_status: 1 }] } })
      .mockResolvedValueOnce({
        code: 0,
        data: {
          notes: [{ id: 'target', tab_status: 1, xsec_token: 'token', xsec_source: 'source' }],
        },
      });

    await expect(getRedNoteMediaStatus('cookie', 'target')).resolves.toMatchObject({
      code: 0,
      docId: 'target',
      publishId: 'target',
      auditStatus: auditStatusEnum.published,
      openUrl: 'https://www.rednote.com/explore/target?xsec_token=token&xsec_source=source',
    });
    expect(signedGetMock).toHaveBeenCalledTimes(2);
  });

  it('returns the existing not-found contract after an empty page', async () => {
    signedGetMock.mockResolvedValue({ code: 0, data: { notes: [] } });
    await expect(getRedNoteMediaStatus('cookie', 'missing')).resolves.toMatchObject({
      code: 0,
      msg: '未找到作品',
      publishId: 'missing',
    });
  });
});
