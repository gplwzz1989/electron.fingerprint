import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'events';
import { syncContentEventName } from '@/media-platform/data-service';

const { postedNotesMock } = vi.hoisted(() => ({ postedNotesMock: vi.fn() }));
vi.mock('@/media-platform/rednote/rednote-content-status.service', () => ({
  getRedNotePostedNotes: postedNotesMock,
}));

import { getRedNoteContentListView } from '@/media-platform/rednote/rednote-content-list.service';

describe('RedNote content list', () => {
  beforeEach(() => postedNotesMock.mockReset());

  it('maps the real posted-note response and stops when page is -1', async () => {
    postedNotesMock.mockResolvedValue({
      success: true,
      code: 0,
      data: {
        page: -1,
        notes: [
          {
            id: '6a86ed95000000000c033c01',
            display_title: '家庭現金流的隱形風險',
            type: 'normal',
            time: '2026-08-20 20:05',
            view_count: 10,
            comments_count: 1,
            likes: 2,
            collected_count: 3,
            shared_count: 4,
            permission_code: 0,
            images_list: [{ url: 'https://cdn.example/cover.jpg' }],
            xsec_token: 'token',
            xsec_source: 'pc_creatormng',
          },
        ],
      },
    });

    const result = await getRedNoteContentListView('cookie', undefined, 30, 20);

    expect(result).toMatchObject({
      code: 0,
      data: [
        {
          id: '6a86ed95000000000c033c01',
          title: '家庭現金流的隱形風險',
          type: 'dynamic',
          read: '10',
          comment: '1',
          great: '2',
          collect: '3',
          share: '4',
          pageUrl:
            'https://www.rednote.com/explore/6a86ed95000000000c033c01?xsec_token=token&xsec_source=pc_creatormng',
        },
      ],
    });
    expect(postedNotesMock).toHaveBeenCalledTimes(1);
  });

  it('filters private notes and emits page batches', async () => {
    postedNotesMock.mockResolvedValue({
      code: 0,
      data: {
        page: -1,
        notes: [
          { id: 'private', permission_code: 1, time: '2026-08-20 20:05' },
          { id: 'video', type: 'video', permission_code: 0, time: '2026-08-20 20:05' },
        ],
      },
    });
    const event = new EventEmitter();
    const batches: unknown[] = [];
    event.on(syncContentEventName, (value) => batches.push(value));

    const result = await getRedNoteContentListView('cookie', event, 30, 20);

    expect(batches).toHaveLength(1);
    expect(batches[0]).toMatchObject({ data: [{ id: 'video', type: 'video' }] });
    expect(result.data).toEqual([]);
  });

  it('returns the platform error without requesting another page', async () => {
    postedNotesMock.mockResolvedValue({ code: -100, msg: '登录失效' });
    await expect(getRedNoteContentListView('cookie')).resolves.toMatchObject({ code: -100, msg: '登录失效' });
    expect(postedNotesMock).toHaveBeenCalledTimes(1);
  });
});
