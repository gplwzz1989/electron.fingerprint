import { afterEach, describe, expect, test, vi } from 'vitest';
import { $http } from '@/http';
import { buildShipinhaoTagInfo } from '@/media-platform/shipinhao/shipinhao-base.service';
import { ShipinhaoStatementType } from '@/media-platform/shipinhao/shipinhao-types';

describe('视频号创作申明标识', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('没有创作申明时不请求tagKey', async () => {
    const postSpy = vi.spyOn($http, 'post');
    const result = await buildShipinhaoTagInfo('cookie=1', undefined, 'finder-id', 'raw-key');

    expect(result).toBeUndefined();
    expect(postSpy).not.toHaveBeenCalled();
  });

  test('有创作申明时用接口tagKey构造tagInfo', async () => {
    const postSpy = vi.spyOn($http, 'post').mockResolvedValue({
      data: {
        errCode: 0,
        errMsg: 'request successful',
        data: {
          tagKey: 'dynamic-tag-key',
        },
      },
    } as never);

    const result = await buildShipinhaoTagInfo(
      'cookie=1',
      { type: ShipinhaoStatementType['内容为转载'], repostSource: '转载来源' },
      'finder-id',
      'raw-key',
    );

    expect(result).toEqual({
      tagType: ShipinhaoStatementType['内容为转载'],
      tagKey: 'dynamic-tag-key',
      repostSource: '转载来源',
    });
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy.mock.calls[0][0]).toContain('/post/finder_get_object_tag_list');
    expect(postSpy.mock.calls[0][1]).toMatchObject({
      source: 1,
      _log_finder_id: 'finder-id',
      rawKeyBuff: 'raw-key',
      scene: 7,
      reqScene: 7,
    });
    expect(postSpy.mock.calls[0][2]?.headers?.cookie).toBe('cookie=1');
  });

  test('接口未返回tagKey时抛出中文错误', async () => {
    vi.spyOn($http, 'post').mockResolvedValue({
      data: {
        errCode: 0,
        errMsg: 'request successful',
        data: {},
      },
    } as never);

    await expect(
      buildShipinhaoTagInfo('cookie=1', { type: ShipinhaoStatementType['含AI生成内容'] }, '', ''),
    ).rejects.toThrow('获取视频号创作申明标识失败，未返回tagKey');
  });
});
