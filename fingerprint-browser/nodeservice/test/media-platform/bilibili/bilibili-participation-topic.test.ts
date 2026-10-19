import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }));

vi.mock('../../../src/http', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/http')>();
  return {
    ...actual,
    $http: { get: getMock },
  };
});

import {
  BILIBILI_VIDEO_PARTICIPATION_TOPIC_REFERER,
  BILIBILI_VIDEO_PARTICIPATION_TOPIC_SEARCH_URL,
  BILIBILI_VIDEO_PARTICIPATION_TOPIC_URL,
  getBilibiliVideoParticipationTopicResponse,
} from '../../../src/media-platform/bilibili/bilibili-participation-topic.service';
import { getBilibiliVideoParticipationTopic } from '../../../src/media-platform/bilibili/bilibili-common';
import { buildPostData } from '../../../src/media-platform/bilibili/bilibili-video.service';

describe('Bilibili participation topic', () => {
  beforeEach(() => getMock.mockReset());

  it('requests recommendation data from the v2 participation-topic endpoint', async () => {
    getMock.mockResolvedValue({
      data: {
        code: 0,
        message: 'OK',
        data: { maxpage: 0, topics: [] },
      },
    });

    await getBilibiliVideoParticipationTopicResponse('cookie=value', {
      categoryId: 21,
      parentCategoryId: 1029,
      title: '作品标题',
      trackId: 'track-id',
      uploadId: 'upload-id',
      zipUrl: 'upos://svfboss/example.zip',
    });

    expect(getMock).toHaveBeenCalledWith(
      BILIBILI_VIDEO_PARTICIPATION_TOPIC_URL,
      expect.objectContaining({
        headers: { cookie: 'cookie=value', Referer: BILIBILI_VIDEO_PARTICIPATION_TOPIC_REFERER },
        params: expect.objectContaining({
          pn: 0,
          ps: 200,
          title: '作品标题',
          track_id: 'track-id',
          upload_id: 'upload-id',
          zip_url: 'upos://svfboss/example.zip',
          platform: 'pc',
          type_id: 21,
          type_pid: 1029,
          t: expect.any(Number),
        }),
      }),
    );
  });

  it('maps recommendation and search response shapes to separate list items', async () => {
    getMock.mockResolvedValueOnce({
      data: {
        code: 0,
        message: 'OK',
        data: {
          maxpage: 1,
          topics: [
            {
              topic_id: 1279324,
              topic_name: '寻找100个宝藏vlogger',
              topic_description: '参与说明',
              mission_id: 4067173,
            },
          ],
        },
      },
    });

    await expect(getBilibiliVideoParticipationTopic('cookie=value', { categoryId: 21 })).resolves.toMatchObject({
      code: 0,
      dataList: [
        {
          yixiaoerId: '1279324',
          yixiaoerName: '寻找100个宝藏vlogger',
          yixiaoerDesc: '参与说明',
          raw: { topic_id: 1279324, mission_id: 4067173 },
        },
      ],
      nextPage: '1',
    });

    getMock.mockResolvedValueOnce({
      data: {
        code: 0,
        message: 'OK',
        data: {
          result: {
            page_info: { page_num: 0, offset: 50, has_more: true },
            topics: [{ id: 1343095, name: '玩游戏学英语', mission_id: 4069312, description: '搜索说明' }],
          },
        },
      },
    });

    await expect(getBilibiliVideoParticipationTopic('cookie=value', { keyWord: '游戏' })).resolves.toMatchObject({
      code: 0,
      dataList: [
        {
          yixiaoerId: '1343095',
          yixiaoerName: '玩游戏学英语',
          yixiaoerDesc: '搜索说明',
          raw: { id: 1343095, mission_id: 4069312 },
        },
      ],
      nextPage: '1',
    });
    expect(getMock).toHaveBeenLastCalledWith(
      BILIBILI_VIDEO_PARTICIPATION_TOPIC_SEARCH_URL,
      expect.objectContaining({
        params: expect.objectContaining({ keywords: '游戏', page_size: 50, offset: 0 }),
      }),
    );
  });

  it('submits the selected participation topic without replacing ordinary tags/topics', async () => {
    const postData = JSON.parse(
      await buildPostData(
        {
          pubType: 1,
          taskId: 'task-id',
          video: { localPath: '/tmp/video.mp4' },
          cover: { pathOrUrl: '/tmp/cover.jpg' },
          title: '作品标题',
          desc: '作品描述',
          source: '',
          no_reprint: 1,
          open_elec: 0,
          tags: ['自定义标签'],
          tid: 21,
          up_close_reply: false,
          up_close_danmu: false,
          up_selection_reply: false,
          participationTopic: {
            yixiaoerId: '1343095',
            yixiaoerName: '玩游戏学英语',
            raw: { id: 1343095, name: '玩游戏学英语', mission_id: 4069312 },
          },
        },
        'https://example.com/cover.jpg',
        { OK: 1, biz_id: 123 },
        'csrf-token',
        'folder/video.mp4',
        'cookie=value',
      ),
    );

    expect(postData.tag).toBe('自定义标签,玩游戏学英语');
    expect(postData.topic_id).toBe(1343095);
    expect(postData.mission_id).toBe(4069312);
    expect(postData.topic_detail).toEqual({ from_source: 'arc.web.recommend', from_topic_id: 1343095 });
  });
});
