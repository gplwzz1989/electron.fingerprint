import { beforeEach, describe, expect, it, vi, test } from 'vitest';

const { signedPostMock } = vi.hoisted(() => ({ signedPostMock: vi.fn() }));

vi.mock('@/media-platform/rednote/rednote-signed-request.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/media-platform/rednote/rednote-signed-request.service')>();
  return { ...actual, redNoteSignedPost: signedPostMock };
});

import { REDNOTE_TOPIC_SEARCH_PATH, getRedNoteTopicList, getRedNoteTopicListResponse } from '@/media-platform/rednote';
import { createRedNoteTopicResponse } from '@/media-platform/rednote/rednote-topic.service';
import type { RedNoteTopicResponse } from '@/media-platform/rednote';

const cookie =
  'abRequestId=3bd98900-c118-5707-9f14-19b47955ce94;ets=1786437337737;a1=19feff682c99lm3gi9uxnei6ytecpmbgaelcrlbci30000390374;webId=53193e5da7398e95bfb3e2c92ad014e0;unread={%22ub%22:%2264bbd076000000001701916d%22%2C%22ue%22:%226a584051000000000f007fc2%22%2C%22uc%22:52};gid=yjidiiKSfK0WyjidiiKYJd1DSjj16qk3j7CI1S3d3Kv9dSq8SU6DkF888qj8qW48iJJdSfiy;webBuild=1.13.0;xsecappid=ugc;websectiga=2845367ec3848418062e761c09db7caf0e8b79d132ccdd1a4f8e64a11d0cac0d;sec_poison_id=0e09f690-f5ec-4db7-872c-8abb9f906c2a;acw_tc=0a587ca117865046167574107e438a38e70126d837a1839795877ac2c961d0;web_session=040069b884fd3d650c57b7ad4e384b0333cdd9;id_token=VjEAAKVcFGTf0gqW7YfBYRgxOSiN9+vH/nhMlAURqoH5nI4FO6FNnIOi3XJBukfVp7VjjnVtf1uxA7ZhW3++yNj9Jato0WawPj+poOxHNq6L8kU8htBw777/+UcK5rWwysrtKXpj;x-rednote-datactry=SG;x-rednote-holderctry=HK;loadts=1786504673077';

describe('RedNote topic search', () => {
  beforeEach(() => signedPostMock.mockReset());

  it('uses the shared RedNote signed request client', async () => {
    signedPostMock.mockResolvedValue({ code: 0, success: true, data: { topic_info_dtos: [] } });
    await getRedNoteTopicListResponse(cookie, '台', 0);
    expect(signedPostMock).toHaveBeenCalledWith(
      cookie,
      REDNOTE_TOPIC_SEARCH_PATH,
      {
        keyword: '台',
        suggest_topic_request: { title: '', desc: '' },
        page: { page_size: 20, page: 1 },
      },
      { proxy: undefined },
    );
  });

  it('maps official topics to ListInfoResponse', async () => {
    signedPostMock.mockResolvedValue({
      code: 0,
      success: true,
      msg: '成功',
      data: {
        topic_info_dtos: [{ id: 'topic-1', name: '台', view_num: 19987507, type: 'official', smart: false }],
      },
    });
    const result = await getRedNoteTopicListResponse(cookie, '台', 0);
    console.log(JSON.stringify(result));
    await expect(getRedNoteTopicList(cookie, '台')).resolves.toMatchObject({
      code: 0,
      msg: '成功',
      dataList: [
        {
          yixiaoerId: 'topic-1',
          yixiaoerName: '台',
          yixiaoerDesc: '19987507',
        },
      ],
    });
  });

  it('creates a customized topic for the internal publish flow', async () => {
    signedPostMock.mockResolvedValue({
      result: 0,
      success: true,
      data: { topic_infos: [{ id: 'topic-2', name: '卫shiya' }] },
    });

    await expect(createRedNoteTopicResponse(cookie, '卫shiya')).resolves.toMatchObject({
      result: 0,
      success: true,
    });
    expect(signedPostMock).toHaveBeenCalledWith(
      cookie,
      '/web_api/sns/capa/postgw/topic/batch_customized',
      { topic_names: '卫shiya' },
      {
        proxy: undefined,
        referer: 'https://creator.rednote.com/',
        headers: { Origin: 'https://creator.rednote.com' },
      },
    );
  });
});

describe.runIf(true)('【真实测试】', () => {
  test('获取标签列表', async () => {
    // 本文件顶部 mock 了 redNoteSignedPost；真实请求必须显式加载原始实现。
    const { redNoteSignedPost } = await vi.importActual<
      typeof import('@/media-platform/rednote/rednote-signed-request.service')
    >('@/media-platform/rednote/rednote-signed-request.service');
    const rawResult = await redNoteSignedPost<RedNoteTopicResponse>(
      cookie,
      REDNOTE_TOPIC_SEARCH_PATH,
      {
        keyword: '台',
        suggest_topic_request: { title: '', desc: '' },
        page: { page_size: 20, page: 1 },
      },
    );
    const result = {
      code: rawResult.code,
      success: rawResult.success,
      msg: rawResult.msg,
      topics: rawResult.data?.topic_info_dtos ?? [],
    };
    console.log('RedNote话题接口原始响应：', JSON.stringify(rawResult, null, 2));
    console.log('RedNote话题列表：', JSON.stringify(result, null, 2));
  }, 10000000);
});
