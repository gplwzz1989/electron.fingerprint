import { beforeEach, describe, expect, it, vi } from 'vitest';

const httpState = vi.hoisted(() => ({
  create: vi.fn(),
  get: vi.fn(),
}));

vi.mock('@/http', () => ({
  createHttpInstance: httpState.create,
}));

import { getDongCheHaoVideoStatus } from './dongchehao';

describe('懂车号视频状态查询', () => {
  beforeEach(() => {
    httpState.create.mockReturnValue({ get: httpState.get });
    httpState.get.mockReset();
  });

  it('queries both normal and vertical video lists even when the first one matches', async () => {
    httpState.get.mockImplementation((url: string) => {
      if (url.includes('/short_video')) {
        return Promise.resolve({ data: { status: 0, data: { list: [], has_more: false } } });
      }
      return Promise.resolve({
        data: {
          status: 0,
          data: {
            list: [{ item_id: 'video-1', status: 2, status_desc: '已发布', share_url: 'https://example.com/video-1' }],
            has_more: false,
          },
        },
      });
    });

    const result = await getDongCheHaoVideoStatus('session=abc', 'video-1', 1);

    expect(httpState.get).toHaveBeenCalledTimes(2);
    expect(httpState.get.mock.calls.map(([url]) => url).sort()).toEqual([
      'https://mp.dcdapp.com/motor/creator/api/content/v2/get_graphic',
      'https://mp.dcdapp.com/motor/mp_index/api/short_video',
    ]);
    expect(result).toMatchObject({
      code: 0,
      publishId: 'video-1',
      docId: 'video-1',
      openUrl: 'https://example.com/video-1',
    });
  });
});
