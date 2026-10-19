import { beforeEach, describe, expect, it, vi } from 'vitest';

const { signedPostMock } = vi.hoisted(() => ({ signedPostMock: vi.fn() }));

vi.mock('@/media-platform/rednote/rednote-signed-request.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/media-platform/rednote/rednote-signed-request.service')>();
  return { ...actual, redNoteSignedPost: signedPostMock };
});

import {
  REDNOTE_CREATOR_ORIGIN,
  REDNOTE_MENTION_USER_SEARCH_PATH,
  getRedNoteMentionUserList,
  getRedNoteMentionUserListResponse,
} from '@/media-platform/rednote';

describe('RedNote mention user search', () => {
  beforeEach(() => signedPostMock.mockReset());

  it('uses the captured creator request with an explicit search id', async () => {
    signedPostMock.mockResolvedValue({ code: 0, success: true, data: { user_info_dtos: [] } });
    await getRedNoteMentionUserListResponse('cookie', {
      keyword: '',
      searchId: '1786524910394.3905',
    });
    expect(signedPostMock).toHaveBeenCalledWith(
      'cookie',
      REDNOTE_MENTION_USER_SEARCH_PATH,
      {
        keyword: '',
        search_id: '1786524910394.3905',
        page: { page_size: 20, page: 1 },
      },
      {
        proxy: undefined,
        referer: `${REDNOTE_CREATOR_ORIGIN}/`,
        headers: { Origin: REDNOTE_CREATOR_ORIGIN },
      },
    );
  });

  it('maps mention users and preserves the official user object', async () => {
    signedPostMock.mockResolvedValue({
      code: 0,
      success: true,
      msg: '成功',
      data: {
        has_more: true,
        user_info_dtos: [
          {
            fans_total: 100,
            user_base_dto: {
              user_id: 'user-1',
              user_nickname: 'RedNote user',
              image: 'https://example.com/avatar.jpg',
              desc: '用户简介',
              red_id: 'red-id',
            },
          },
        ],
      },
    });

    const result = await getRedNoteMentionUserList('cookie', 'RedNote', 1);
    expect(result).toMatchObject({
      code: 0,
      msg: '成功',
      nextPage: '2',
      dataList: [
        {
          yixiaoerId: 'user-1',
          yixiaoerName: 'RedNote user',
          yixiaoerImageUrl: 'https://example.com/avatar.jpg',
          yixiaoerDesc: '用户简介',
          raw: {
            user_id: 'user-1',
            user_nickname: 'RedNote user',
            red_id: 'red-id',
          },
        },
      ],
    });
  });
});
