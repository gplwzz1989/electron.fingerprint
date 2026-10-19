import { beforeEach, describe, expect, it, vi } from 'vitest';

const { signedPostMock } = vi.hoisted(() => ({ signedPostMock: vi.fn() }));

vi.mock('@/media-platform/rednote/rednote-signed-request.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/media-platform/rednote/rednote-signed-request.service')>();
  return { ...actual, redNoteSignedPost: signedPostMock };
});

import {
  REDNOTE_CREATOR_ORIGIN,
  REDNOTE_LOCATION_SEARCH_PATH,
  getRedNoteLocationList,
  getRedNoteLocationListResponse,
} from '@/media-platform/rednote';

describe('RedNote location search', () => {
  beforeEach(() => signedPostMock.mockReset());

  it('uses creator.rednote.com headers and the captured request body', async () => {
    signedPostMock.mockResolvedValue({ code: 0, success: true, data: { poi_list: [] } });
    await getRedNoteLocationListResponse('cookie', { keyword: '香港' });
    expect(signedPostMock).toHaveBeenCalledWith(
      'cookie',
      REDNOTE_LOCATION_SEARCH_PATH,
      {
        latitude: 0,
        longitude: 0,
        keyword: '香港',
        page: 1,
        size: 50,
        source: 'WEB',
        type: 3,
      },
      {
        proxy: undefined,
        referer: `${REDNOTE_CREATOR_ORIGIN}/`,
        headers: { Origin: REDNOTE_CREATOR_ORIGIN },
      },
    );
  });

  it('maps POIs and preserves the raw publishing fields', async () => {
    signedPostMock.mockResolvedValue({
      code: 0,
      success: true,
      msg: '成功',
      data: {
        has_more: true,
        poi_list: [
          {
            poi_id: 'poi-1',
            poi_type: 3,
            name: '香港公园',
            full_address: '香港中西区红棉路19号',
            latitude: 22.277,
            longitude: 114.16,
          },
        ],
      },
    });

    const result = await getRedNoteLocationList('cookie', '香港', 1);
    expect(result).toMatchObject({
      code: 0,
      msg: '成功',
      nextPage: '2',
      dataList: [
        {
          yixiaoerId: 'poi-1',
          yixiaoerName: '香港公园',
          yixiaoerDesc: '香港中西区红棉路19号',
          raw: {
            poi_id: 'poi-1',
            poiOid: 'poi-1',
            poiLongId: 'poi-1',
            recommendType: 3,
            subname: '香港中西区红棉路19号',
          },
        },
      ],
    });
  });

  it('passes unified coordinates to the official request', async () => {
    signedPostMock.mockResolvedValue({ code: 0, success: true, data: { poi_list: [] } });
    await getRedNoteLocationList('cookie', '香港', 2, undefined, {
      latitude: 22.3193,
      longitude: 114.1694,
    });
    expect(signedPostMock.mock.calls[0][2]).toMatchObject({
      keyword: '香港',
      page: 2,
      latitude: 22.3193,
      longitude: 114.1694,
    });
  });
});
