import { describe, expect, it } from 'vitest';
import { buildRedNoteDynamicPostData, buildRedNoteVideoPostData, REDNOTE_NOTE_PUBLISH_PATH } from '@/media-platform/rednote';

describe('RedNote dynamic publish payload', () => {
  it('uses the RedNote note endpoint and omits unsupported binds', async () => {
    expect(REDNOTE_NOTE_PUBLISH_PATH).toBe('/web_api/sns/v2/note');
    const body = await buildRedNoteDynamicPostData(
      'web_session=session',
      {
        taskId: 'task-1',
        title: 'RedNote title',
        desc: 'RedNote content',
        images: [{ pathOrUrl: '/tmp/image.png' }],
        visibilityType: 0,
        postTime: 1786500000000,
        group: {
          yixiaoerId: 'group-1',
          yixiaoerName: 'group name',
          yixiaoerDesc: 'group desc',
          yixiaoerImageUrl: 'https://example.com/group.png',
        },
        isOriginal: 1,
      },
      [{ fileId: 'oss-sg/file-id', width: 1080, height: 1440, mimeType: 'image/png', originSizeKb: 512 }],
    );

    const payload = JSON.parse(body);
    const businessBinds = JSON.parse(payload.common.business_binds);
    expect(payload).toMatchObject({
      common: {
        title: 'RedNote title',
        desc: 'RedNote content',
        privacy_info: { op_type: 1, type: 0 },
      },
      image_info: { images: [{ file_id: 'oss-sg/file-id', width: 1080, height: 1440 }] },
      video_info: null,
    });
    expect(businessBinds.groupBind).toEqual({
      groupId: 'group-1',
      groupName: 'group name',
      desc: 'group desc',
      avatar: 'https://example.com/group.png',
    });
    expect(businessBinds.notePostTiming).toEqual({ postTime: 1786500000000 });
    // 抓包协议需要空占位，但没有任何合集、商品或直播数据进入请求。
    expect(businessBinds.noteCollectionBind).toEqual({ id: '' });
    expect(businessBinds.noteSketchCollectionBind).toEqual({ id: '' });
    expect(businessBinds).not.toHaveProperty('liveNoticeBind');
    expect(payload.common.goods_info).toEqual({});
    expect(payload.common.biz_relations).toEqual([]);
    expect(JSON.parse(payload.image_info.images[0].extra_info_json)).toEqual({
      mimeType: 'image/png',
      image_metadata: { bg_color: '', origin_size: 512 },
    });
  });
});

describe('RedNote video publish payload', () => {
  it('uses uploaded video and cover file ids', async () => {
    const body = await buildRedNoteVideoPostData(
      'web_session=session',
      {
        taskId: 'video-task',
        title: 'Video title',
        desc: 'Video content',
        visibilityType: 0,
        video: { localPath: '/tmp/video.mp4', duration: 12.5, width: 1080, height: 1920 },
        cover: { pathOrUrl: '/tmp/cover.jpg', width: 1080, height: 1920 },
      },
      'oss-sg/video-id',
      'oss-sg/cover-id',
    );
    const payload = JSON.parse(body);
    expect(payload.common.type).toBe('video');
    expect(payload.image_info).toBeNull();
    expect(payload.video_info).toMatchObject({
      file_id: 'oss-sg/video-id',
      format_width: 1080,
      format_height: 1920,
      video_preview_type: 'full_vertical_screen',
      cover: {
        file_id: 'oss-sg/cover-id',
        frame: { is_upload: true },
        stickers: { neptune: [], version: 2 },
        fonts: [],
        extra_info_json: '{}',
      },
      composite_metadata: { video: { duration: 12500 }, audio: { duration: 12500 } },
      segments: {
        count: 1,
        need_slice: false,
        items: [{ duration: 12.5, media_source: 1, original_metadata: { video: { duration: 12500 } } }],
      },
      pk_cover_biz_relations: [],
    });
    expect(JSON.parse(payload.common.capa_trace_info.contextJson).recommend_topics).toEqual({ used: [] });
  });

  it('maps declarations and topics to the captured RedNote fields', async () => {
    const body = await buildRedNoteVideoPostData(
      'web_session=session',
      {
        taskId: 'video-task',
        desc: 'content',
        visibilityType: 1,
        topics: [{ yixiaoerId: 'topic-1', yixiaoerName: 'History', raw: { id: 'topic-1', name: 'History' } }],
        statement: { origin: 2 },
        video: { localPath: '/tmp/video.mp4', duration: 4.084, width: 1280, height: 720 },
        cover: { pathOrUrl: '/tmp/cover.jpg', width: 1278, height: 1710 },
      },
      'oss-sg/video-id',
      'oss-sg/cover-id',
    );
    const payload = JSON.parse(body);
    expect(JSON.parse(payload.common.business_binds).userDeclarationBind).toEqual({ origin: 2 });
    expect(payload.common.hash_tag).toEqual([{ id: 'topic-1', name: 'History', type: 'topic' }]);
    expect(payload.video_info.composite_metadata.video.duration).toBe(4084);
    expect(payload.video_info.segments.items[0].duration).toBe(4.084);
    expect(JSON.parse(payload.common.capa_trace_info.contextJson).recommend_topics.used[0]).toMatchObject({
      id: 'topic-1',
      topic_source: 'recommend',
    });
  });

  it('maps a selected group into the video business binds', async () => {
    const body = await buildRedNoteVideoPostData(
      'web_session=session',
      {
        taskId: 'video-task',
        visibilityType: 0,
        group: {
          yixiaoerId: 'group-1',
          yixiaoerName: '测试群聊',
          yixiaoerDesc: '群简介',
          yixiaoerImageUrl: 'https://example.com/avatar.png',
        },
        video: { localPath: '/tmp/video.mp4', duration: 4, width: 1280, height: 720 },
        cover: { pathOrUrl: '/tmp/cover.jpg', width: 1280, height: 720 },
      },
      'oss-sg/video-id',
      'oss-sg/cover-id',
    );

    const businessBinds = JSON.parse(JSON.parse(body).common.business_binds);
    expect(businessBinds.groupBind).toEqual({
      groupId: 'group-1',
      groupName: '测试群聊',
      desc: '群简介',
      avatar: 'https://example.com/avatar.png',
    });
  });
});
