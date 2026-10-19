import { describe, expect, it } from 'vitest';
import { auditStatusEnum } from '@/utils';
import {
  buildDongCheHaoContentListParams,
  buildDongCheHaoShortVideoContentListParams,
  getDongCheHaoContentListItems,
  mapDongCheHaoAuditStatus,
} from './dongchehao';

describe('懂车号作品列表', () => {
  it('uses the browser list parameters for article, video, and image-text dynamic', () => {
    expect(buildDongCheHaoContentListParams('article')).toEqual({
      feature: 0,
      sort: 2,
      status: 0,
      page_size: 20,
    });
    expect(buildDongCheHaoContentListParams('video')).toEqual({
      feature: 1,
      sort: 2,
      status: 0,
      page_size: 20,
    });
    expect(buildDongCheHaoContentListParams('imageText')).toEqual({
      count: 7,
      offset: 0,
      status: 0,
    });
    expect(buildDongCheHaoShortVideoContentListParams()).toEqual({
      count: 7,
      offset: 0,
      status: 0,
    });
    expect(buildDongCheHaoShortVideoContentListParams({ count: 7, offset: '1788431232' })).toEqual({
      count: 7,
      offset: '1788431232',
      status: 0,
    });
  });

  it('normalizes the list shapes returned by the three endpoints', () => {
    const articleResponse = {
      status: 0,
      data: {
        total: 1,
        has_more: false,
        list: [{ item_id: 'article-1' }],
      },
    };
    const dynamicResponse = {
      status: 0,
      has_more: false,
      data: [{ thread_id: 'dynamic-1' }],
    };

    expect(getDongCheHaoContentListItems(articleResponse)).toEqual([{ item_id: 'article-1' }]);
    expect(getDongCheHaoContentListItems(dynamicResponse)).toEqual([{ thread_id: 'dynamic-1' }]);
  });

  it('maps the official article and image-text status values', () => {
    expect(mapDongCheHaoAuditStatus({ status: 1, status_desc: '审核中' }, 'article')).toBe(auditStatusEnum.inAudit);
    expect(mapDongCheHaoAuditStatus({ status: 2, status_desc: '已发布' }, 'article')).toBe(auditStatusEnum.published);
    expect(mapDongCheHaoAuditStatus({ status: 20, thread_id: 'dynamic-1' }, 'imageText')).toBe(
      auditStatusEnum.published,
    );
    expect(mapDongCheHaoAuditStatus({ status: 3, group_id: 'short-video-1' }, 'video', 'shortVideo')).toBe(
      auditStatusEnum.published,
    );
  });
});
