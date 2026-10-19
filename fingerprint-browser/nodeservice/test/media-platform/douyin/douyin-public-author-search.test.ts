import { beforeEach, describe, expect, test, vi } from 'vitest';
import { $http } from '../../../src/http';
import { getDouyinPublicAuthorSearchHtml } from '../../../src/media-platform/douyin/douyin-user.service';

vi.mock('../../../src/http', () => ({
  $http: {
    get: vi.fn(),
  },
  HttpConfig: {
    sec_ch_ua_mobile: '?0',
    sec_ch_ua_platform: '"Windows"',
  },
}));

describe('抖音公开作者搜索', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('首屏结果不匹配关键词时应携带响应 cookie 重试普通搜索', async () => {
    const getMock = vi.mocked($http.get);
    getMock
      .mockResolvedValueOnce({
        data: 'business_data 无关结果',
        headers: {
          'set-cookie': ['search_webid=mock-webid; Path=/;'],
        },
      })
      .mockResolvedValueOnce({
        data: 'business_data 蚁小二',
        headers: {},
      });

    const html = await getDouyinPublicAuthorSearchHtml('old=1;', '蚁小二', undefined, (searchHtml) => {
      return searchHtml.includes('蚁小二');
    });
    const secondUrl = getMock.mock.calls[1][0]?.toString() ?? '';
    const secondOptions = getMock.mock.calls[1][1] as { headers: { cookie: string } };

    expect(html).toBe('business_data 蚁小二');
    expect(getMock).toHaveBeenCalledTimes(2);
    expect(secondUrl).toContain('enter_method=normal_search');
    expect(secondUrl).not.toContain('group_id=');
    expect(secondOptions.headers.cookie).toContain('search_webid=mock-webid');
  });
});
