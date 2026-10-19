import { describe, expect, it } from 'vitest';
import {
  buildDongCheHaoArticlePostData,
  buildDongCheHaoArticleImageUploadHeaders,
  buildDongCheHaoArticlePublishHeaders,
  buildDongCheHaoBindVideoPostData,
  buildDongCheHaoDynamicPostData,
  buildDongCheHaoDynamicPublishHeaders,
  buildDongCheHaoImageUploadHeaders,
  buildDongCheHaoVodApplyUploadParams,
  buildDongCheHaoVodCommitUploadRequest,
  buildDongCheHaoVideoPostData,
  buildDongCheHaoVideoPublishHeaders,
  getDongCheHaoDynamicPublishId,
  getDongCheHaoDynamicImageSources,
  getDongCheHaoImageCommitUri,
  DongCheHaoArticleTaskInput,
  DongCheHaoDynamicTaskInput,
  DongCheHaoVideoTaskInput,
} from './dongchehao';

describe('懂车号发布数据', () => {
  it('builds article, dynamic, and video payloads', () => {
    const article: DongCheHaoArticleTaskInput = {
      taskId: 'article',
      title: '文章标题',
      content: '<p>正文</p>',
      covers: [],
      pubType: 1,
      isOriginal: 1,
    };
    const video: DongCheHaoVideoTaskInput = {
      taskId: 'video',
      title: '视频标题',
      desc: '视频说明',
      video: { localPath: 'video.mp4', duration: 3, width: 1920, height: 1080 },
      creatorStatement: { text: '内容含AI生成', input: '' },
      pubType: 1,
    };

    expect(JSON.parse(buildDongCheHaoArticlePostData(article, []))).toMatchObject({
      title: article.title,
      extra: { claim_origin: 1 },
    });
    expect(buildDongCheHaoBindVideoPostData('v03faag/1')).toBe('vid=v03faag%2F1');
    const videoPostData = buildDongCheHaoVideoPostData(video, { vid: 'v1', video: { duration: 3 } }, 'cover-1', {
      uri: 'tos-cn-i-f042mdwyw7/vertical-cover',
      width: 540,
      height: 720,
    });
    const videoParams = new URLSearchParams(videoPostData);
    expect(videoParams.get('video_id')).toBe('v1');
    expect(videoParams.get('praise')).toBe('0');
    expect(videoParams.get('timer_time')).toBeNull();
    expect(videoParams.get('key_frames')).toBe('[]');
    expect(videoParams.get('item_id')).toBe('');
    expect(videoParams.get('claim_origin')).toBe('0');
    expect(videoParams.get('width')).toBe('1920');
    expect(videoParams.get('height')).toBe('1080');
    expect(videoParams.get('CoverTitles')).toBe('[]');
    expect(videoParams.get('TerminalType')).toBe('01');
    expect(videoParams.get('vertical_cover_image')).toBe(
      JSON.stringify({
        uri: 'tos-cn-i-f042mdwyw7/vertical-cover',
        height: 720,
        width: 540,
      }),
    );
    expect(videoParams.get('creator_statement')).toBe(JSON.stringify({ text: '内容含AI生成', input: '' }));

    const scheduledVideo = {
      ...video,
      prePubTime: 1788889201000,
    } satisfies DongCheHaoVideoTaskInput;
    const scheduledParams = new URLSearchParams(
      buildDongCheHaoVideoPostData(scheduledVideo, { vid: 'v1', video: { duration: 15.104 } }, 'cover-1'),
    );
    expect(scheduledParams.get('publish_type')).toBe('1');
    expect(scheduledParams.get('timer_time')).toBe('1788889201');

    const officialStyleVideo = {
      ...video,
      creatorStatement: { text: '内容含AI生成' },
    } satisfies DongCheHaoVideoTaskInput;
    const officialStylePostData = buildDongCheHaoVideoPostData(
      officialStyleVideo,
      { vid: 'v1', video: { duration: 0, width: 0, height: 0 } },
      'cover-1',
      { uri: 'vertical-cover', width: 540, height: 720 },
      '7680811896379032089',
    );
    const officialStyleParams = new URLSearchParams(officialStylePostData);
    expect(officialStyleParams.get('creator_statement')).toBe(JSON.stringify({ text: '内容含AI生成' }));
    expect(officialStyleParams.get('item_id')).toBe('7680811896379032089');
    expect(officialStyleParams.get('video_duration')).toBe('3');
    expect(officialStyleParams.get('width')).toBe('1920');
    expect(officialStyleParams.get('height')).toBe('1080');

    const roundedDurationParams = new URLSearchParams(
      buildDongCheHaoVideoPostData(video, { vid: 'v1', video: { duration: 4.086009 } }, 'cover-1'),
    );
    expect(roundedDurationParams.get('video_duration')).toBe('4.086');
  });

  it('includes anti tokens in the final video publish headers', () => {
    const headers = buildDongCheHaoVideoPublishHeaders('session=abc', undefined, 'anti-token', 'sec-token');

    expect(headers['tt-anti-token']).toBe('anti-token');
    expect(headers['x-secsdk-csrf-token']).toBe('sec-token');
    expect(headers['Content-Type']).toBe('application/x-www-form-urlencoded; charset=utf-8');
  });

  it('matches the official article publish form', () => {
    const cover = {
      thumb_height: 516,
      thumb_width: 683,
      uri: 'tos-cn-i-f042mdwyw7/a3468e2c1c954fc3af597e62998582bb',
      url: 'https://p0-dcd-private.dcdapp.com/tos-cn-i-f042mdwyw7/a3468e2c1c954fc3af597e62998582bb~noop.image',
    };
    const article: DongCheHaoArticleTaskInput = {
      taskId: 'article',
      title: '这是标题',
      content: '<p><br></p><div class="pgc-img"><img class="" src="https://example.com/image.jpg"></div>',
      covers: [{ pathOrUrl: cover.url }],
      contentWords: 5,
      pubType: 0,
      isOriginal: 0,
    };
    const body = JSON.parse(buildDongCheHaoArticlePostData(article, [cover]));

    expect(body).toMatchObject({
      save: 0,
      source: 20,
      title: article.title,
      content: article.content,
      extra: {
        article_ad_type: 3,
        content_word_cnt: 5,
        pgc_feed_covers: [cover],
        timer_status: 0,
        timer_time: '',
        title_id: '',
        vertical_cover_image: JSON.stringify({
          uri: cover.uri,
          height: 516,
          width: 683,
        }),
        publisher_ai_info: JSON.stringify({ use_ai_img: 0, ai_img_list: [] }),
      },
    });
    expect(body.extra.claim_origin).toBeUndefined();
  });

  it('keeps the article vertical cover separate from the horizontal cover', () => {
    const horizontalCover = {
      thumb_height: 516,
      thumb_width: 683,
      uri: 'tos-cn-i-f042mdwyw7/horizontal-cover',
      url: 'https://example.com/horizontal-cover.jpg',
    };
    const verticalCover = {
      thumb_height: 1024,
      thumb_width: 768,
      uri: 'tos-cn-i-f042mdwyw7/vertical-cover',
      url: 'https://example.com/vertical-cover.jpg',
    };
    const article: DongCheHaoArticleTaskInput = {
      taskId: 'article',
      title: '定时文章',
      content: '<p>正文</p>',
      adType: 2,
      pubType: 1,
      prePubTime: new Date('2026-09-04T10:20:00+08:00').getTime(),
    };
    const body = JSON.parse(buildDongCheHaoArticlePostData(article, [horizontalCover], verticalCover));

    expect(body).toMatchObject({
      save: 1,
      extra: {
        article_ad_type: 2,
        pgc_feed_covers: [horizontalCover],
        timer_status: 1,
        timer_time: '2026-09-04 10:20',
        vertical_cover_image: JSON.stringify({
          uri: verticalCover.uri,
          height: verticalCover.thumb_height,
          width: verticalCover.thumb_width,
        }),
      },
    });
  });

  it('includes the article page csrf token in publish headers', () => {
    const headers = buildDongCheHaoArticlePublishHeaders('session=abc', undefined, 'sec-token');

    expect(headers.Referer).toBe('https://mp.dcdapp.com/profile_v2/publish/article');
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers.Priority).toBe('u=1, i');
    expect(headers['x-secsdk-csrf-token']).toBe('sec-token');
    expect(headers['tt-anti-token']).toBeUndefined();
  });

  it('matches the official image-text dynamic publish form', () => {
    const dynamic: DongCheHaoDynamicTaskInput = {
      taskId: 'dynamic',
      desc: '分享美图',
      images: [],
    };
    const params = new URLSearchParams(
      buildDongCheHaoDynamicPostData(dynamic, ['tos-cn-i-f042mdwyw7/image-1', 'tos-cn-i-f042mdwyw7/image-2']),
    );

    expect(params.get('content')).toBe('分享美图');
    expect(params.get('publisher_ai_info')).toBe(JSON.stringify({ use_ai_img: 0, ai_img_list: [] }));
    expect(params.get('image_urls')).toBe('tos-cn-i-f042mdwyw7/image-1,tos-cn-i-f042mdwyw7/image-2');
    expect(params.get('image_uris')).toBeNull();
    expect(params.get('motor_type')).toBe('2');
    expect(params.get('common_source')).toBe('80070');
    expect(params.get('sync_to_toutiao')).toBe('1');

    const noDescriptionParams = new URLSearchParams(buildDongCheHaoDynamicPostData({ taskId: 'dynamic', images: [] }));
    expect(noDescriptionParams.get('content')).toBe('');

    const headers = buildDongCheHaoDynamicPublishHeaders('session=abc; csrf_session_id=csrf', undefined, 'csrf-token');
    expect(headers['Content-Type']).toBe('application/x-www-form-urlencoded;charset=utf-8');
    expect(headers.Referer).toBe('https://mp.dcdapp.com/profile_v2/publish/post');
    expect(headers['x-secsdk-csrf-token']).toBe('csrf-token');
  });

  it('uses only the official dynamic images field', () => {
    const task: DongCheHaoDynamicTaskInput = {
      taskId: 'dynamic',
      desc: '内容',
      images: [
        { pathOrUrl: '/tmp/content-image.png' },
        { pathOrUrl: '/tmp/content-image.png' },
        { pathOrUrl: '/tmp/second-image.png' },
      ],
    };

    expect(getDongCheHaoDynamicImageSources(task)).toEqual(['/tmp/content-image.png', '/tmp/second-image.png']);
  });

  it('reads the gid from the official image-text dynamic response', () => {
    expect(
      getDongCheHaoDynamicPublishId({
        status: 'success',
        data: {
          gid: 7681147367076593726,
          gid_str: '7681147367076593726',
          thread_id: 7681147367076593726,
        },
      }),
    ).toBe('7681147367076593726');
  });

  it('matches the official VOD upload commit request', () => {
    const request = buildDongCheHaoVodCommitUploadRequest('session-key');

    expect(JSON.parse(request.body)).toEqual({ SessionKey: 'session-key', Functions: [] });
    expect(request.params).toEqual({
      Action: 'CommitUploadInner',
      Version: '2020-11-19',
      SpaceName: 'motor_content_cloud',
    });
  });

  it('matches the official VOD upload apply parameters', () => {
    expect(buildDongCheHaoVodApplyUploadParams(13260199, 'request-id')).toEqual({
      Action: 'ApplyUploadInner',
      Version: '2020-11-19',
      SpaceName: 'motor_content_cloud',
      FileType: 'video',
      IsInner: 1,
      FileSize: 13260199,
      s: 'request-id',
    });
  });

  it('reads the image URI from the official image commit response', () => {
    expect(
      getDongCheHaoImageCommitUri({
        Result: {
          Results: [{ Uri: 'tos-cn-i-f042mdwyw7/raw-image', ImageWidth: 640 }],
          PluginResult: [{ ImageUri: 'tos-cn-i-f042mdwyw7/processed-image', ImageWidth: 320 }],
        },
      }),
    ).toBe('tos-cn-i-f042mdwyw7/raw-image');
    expect(
      getDongCheHaoImageCommitUri({
        Result: { PluginResult: [{ ImageUri: 'tos-cn-i-f042mdwyw7/processed-image' }] },
      }),
    ).toBe('tos-cn-i-f042mdwyw7/processed-image');
  });

  it('matches the official image binary upload headers', () => {
    const headers = buildDongCheHaoImageUploadHeaders('SpaceKey/auth', 'user/1', Buffer.from('image'), {
      'X-Upload-Header': 'official',
    });

    expect(headers.Authorization).toBe('SpaceKey/auth');
    expect(headers['X-Storage-U']).toBe('user%2F1');
    expect(headers['Content-CRC32']).toMatch(/^[0-9a-f]{8}$/);
    expect(headers['Content-Length']).toBeUndefined();
    expect(headers['Content-Type']).toBe('application/octet-stream');
    expect(headers['Content-Disposition']).toBe('attachment; filename="undefined"');
    expect(headers['X-Upload-Header']).toBe('official');
    expect(headers.Origin).toBe('https://mp.dcdapp.com');
    expect(headers.Referer).toBe('https://mp.dcdapp.com/');
    expect(headers.Priority).toBeUndefined();

    const articleHeaders = buildDongCheHaoArticleImageUploadHeaders(
      'SpaceKey/auth',
      '67589889666',
      Buffer.from('image'),
    );
    expect(articleHeaders.Authorization).toBe('SpaceKey/auth');
    expect(articleHeaders['X-Storage-U']).toBe('67589889666');
    expect(articleHeaders['Content-Length']).toBe(String(Buffer.from('image').length));
    expect(articleHeaders.Priority).toBe('u=1, i');
  });
});
