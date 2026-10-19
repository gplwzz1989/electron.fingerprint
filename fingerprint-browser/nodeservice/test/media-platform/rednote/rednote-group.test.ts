import { beforeEach, describe, expect, it, vi } from 'vitest';

const { signedGetMock } = vi.hoisted(() => ({ signedGetMock: vi.fn() }));

vi.mock('@/media-platform/rednote/rednote-signed-request.service', () => ({
  redNoteSignedGet: signedGetMock,
}));

import {
  REDNOTE_GROUP_LIST_PATH,
  getRedNoteGroupList,
  getRedNoteGroupListResponse,
} from '@/media-platform/rednote';

describe('RedNote group list', () => {
  beforeEach(() => signedGetMock.mockReset());

  it('requests the signed group-list endpoint with creator headers', async () => {
    signedGetMock.mockResolvedValue({ code: 0, success: true, data: { group_list: [] } });
    await getRedNoteGroupListResponse('cookie');
    expect(signedGetMock).toHaveBeenCalledWith('cookie', REDNOTE_GROUP_LIST_PATH, {
      proxy: undefined,
      referer: 'https://creator.rednote.com/',
      headers: { Origin: 'https://creator.rednote.com' },
    });
  });

  it('maps groups to the common list-item contract used by publishing', async () => {
    const group = {
      group_id: 'group-1',
      group_name: '测试群聊',
      desc: '群简介',
      avatar: 'https://example.com/avatar.png',
      linkable: true,
    };
    signedGetMock.mockResolvedValue({ code: 0, success: true, data: { group_list: [group] } });
    await expect(getRedNoteGroupList('cookie')).resolves.toMatchObject({
      code: 0,
      dataList: [
        {
          yixiaoerId: 'group-1',
          yixiaoerName: '测试群聊',
          yixiaoerDesc: '群简介',
          yixiaoerImageUrl: 'https://example.com/avatar.png',
          raw: group,
        },
      ],
    });
  });
});
