/**
 * 抖音明文评论 id 链路的纯单元测试（mock service 层，无真实网络）。
 *
 * 覆盖三处分流决策，防止明文/加密两套 id 体系互串：
 * 1. 通知推送补明文 cid（buildDouyinNoticeCommentItem 经 getDouYinLatestCommentNoticeList）
 * 2. addDouYinComment：明文 cid 回复走 janus 端点、缺 documentId 时明确报错、加密 id 走 V1
 * 3. getDouYinCommentByContent：documentId 携带时走 V2 明文列表，加密 commentId 不误入 V2
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@/media-platform/douyin/douyin-comment.service', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    getDouyinNoticeCommentListResponse: vi.fn(),
    addDouyinContentCommentResponse: vi.fn(),
    addDouyinContentCommentJanusResponse: vi.fn(),
    getDouyinSignleContentCommentListResponse: vi.fn(),
    getDouyinSignleContentCommentListResponseV2: vi.fn(),
  };
});

import {
  addDouYinComment,
  getDouYinCommentByContent,
  getDouYinLatestCommentNoticeList,
} from '@/media-platform/douyin/douyin-comment';
import {
  addDouyinContentCommentJanusResponse,
  addDouyinContentCommentResponse,
  getDouyinNoticeCommentListResponse,
  getDouyinSignleContentCommentListResponse,
  getDouyinSignleContentCommentListResponseV2,
} from '@/media-platform/douyin/douyin-comment.service';

const localStorageStr = JSON.stringify({
  'security-sdk/s_sdk_sign_data_key/web_protect': 'stub-protect',
  'security-sdk/s_sdk_crypt_sdk': 'stub-crypt',
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('通知推送携带明文 cid', () => {
  test('推送条目 commentId 取通知里的明文 cid', async () => {
    vi.mocked(getDouyinNoticeCommentListResponse).mockResolvedValue({
      status_code: 0,
      status_msg: '',
      has_more: 0,
      max_time: 1786506334,
      min_time: 0,
      notice_list_v2: [
        {
          nid: 1,
          type: 31,
          create_time: 1786506334,
          comment: {
            comment: {
              cid: '7674913014172336939',
              text: '怎么买',
              aweme_id: '7672729059075362098',
              user: { uid: '593332736900807', nickname: '今日中转小雨' },
            },
          },
        },
      ],
    } as never);

    const result = await getDouYinLatestCommentNoticeList('cookie', 'acct-1', {
      lastCreateTime: 0,
      isFirstFetch: false,
    });

    expect(result.dataList).toHaveLength(1);
    expect(result.dataList?.[0].commentId).toBe('7674913014172336939');
    expect(result.dataList?.[0].documentId).toBe('7672729059075362098');
    expect(result.dataList?.[0].contentId).toBe('');
  });
});

describe('addDouYinComment 明文/加密分流', () => {
  test('明文 cid + documentId 走 janus 明文端点，不碰 V1', async () => {
    // multi_publish 实测响应结构：新回复位于 comments 数组（2026-08 抓包）
    vi.mocked(addDouyinContentCommentJanusResponse).mockResolvedValue({
      status_code: 0,
      status_msg: '',
      comments: [{ cid: '7674920000000000001', text: '感谢支持' }],
    } as never);

    const result = await addDouYinComment(
      'cookie',
      'sdk-token',
      '感谢支持',
      '@encrypted-content-id',
      '7674913014172336939',
      undefined,
      localStorageStr,
      '7672729059075362098',
    );

    expect(result.code).toBe(0);
    expect(result.commentId).toBe('7674920000000000001');
    expect(addDouyinContentCommentJanusResponse).toHaveBeenCalledTimes(1);
    const janusArgs = vi.mocked(addDouyinContentCommentJanusResponse).mock.calls[0];
    expect(janusArgs[3]).toBe('7672729059075362098'); // awemeId=documentId
    expect(janusArgs[4]).toBe('7674913014172336939'); // reply_to_comment_ids=cid
    expect(addDouyinContentCommentResponse).not.toHaveBeenCalled();
  });

  test('明文 cid 但缺 documentId 时明确报错，绝不落入 V1 加密端点', async () => {
    const result = await addDouYinComment(
      'cookie',
      'sdk-token',
      '感谢支持',
      '@encrypted-content-id',
      '7674913014172336939',
      undefined,
      localStorageStr,
      undefined,
    );

    expect(result.code).toBe(400);
    expect(result.msg).toContain('documentId');
    expect(addDouyinContentCommentJanusResponse).not.toHaveBeenCalled();
    expect(addDouyinContentCommentResponse).not.toHaveBeenCalled();
  });

  test('加密 commentId 维持原 V1 路径不变', async () => {
    vi.mocked(addDouyinContentCommentResponse).mockResolvedValue({
      status_code: 0,
      status_msg: '',
      comment_info: { comment_id: '@encrypted-new-comment' },
    } as never);

    const result = await addDouYinComment(
      'cookie',
      'sdk-token',
      '感谢支持',
      '@encrypted-content-id',
      '@encrypted-comment-id',
      undefined,
      localStorageStr,
      '7672729059075362098',
    );

    expect(result.code).toBe(0);
    expect(result.commentId).toBe('@encrypted-new-comment');
    expect(addDouyinContentCommentResponse).toHaveBeenCalledTimes(1);
    expect(addDouyinContentCommentJanusResponse).not.toHaveBeenCalled();
  });
});

describe('getDouYinCommentByContent V2 路由', () => {
  test('携带 documentId 且无 commentId 时走 V2 明文列表', async () => {
    vi.mocked(getDouyinSignleContentCommentListResponseV2).mockResolvedValue({
      status_code: 0,
      total: 1,
      cursor: 0,
      has_more: 0,
      comments: [
        {
          cid: '7674913014172336939',
          text: '怎么买',
          aweme_id: '7672729059075362098',
          create_time: 1786506334,
          user: { uid: '593332736900807', nickname: '今日中转小雨' },
        },
      ],
    } as never);

    const result = await getDouYinCommentByContent(
      'cookie',
      '@encrypted-content-id',
      '',
      '',
      'acct-1',
      '7672729059075362098',
    );

    expect(result.code).toBe(0);
    expect(result.dataList?.[0].commentId).toBe('7674913014172336939');
    expect(getDouyinSignleContentCommentListResponseV2).toHaveBeenCalledTimes(1);
    expect(getDouyinSignleContentCommentListResponse).not.toHaveBeenCalled();
  });

  test('加密 commentId 即使携带 documentId 也不误入 V2', async () => {
    vi.mocked(getDouyinSignleContentCommentListResponse).mockResolvedValue({
      status_code: 0,
      cursor: 0,
      has_more: false,
      comment_info_list: [],
    } as never);

    await getDouYinCommentByContent(
      'cookie',
      '@encrypted-content-id',
      '@encrypted-comment-id',
      '',
      'acct-1',
      '7672729059075362098',
    );

    expect(getDouyinSignleContentCommentListResponseV2).not.toHaveBeenCalled();
  });
});
