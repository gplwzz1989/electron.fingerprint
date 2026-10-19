import { EventEmitter } from 'events';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { PubContentEnum } from '../../../src/cloud/model/TypeEnum';
import { ShipinhaoRecentCommentFetcher } from '../../../src/cloud/task/shipinhao-recent-comment-fetcher';
import { Shipinhao } from '../../../src/media-platform';
import { CommentBackItem, Platforms, SyncEventName } from '../../../src/service/datasync-service-manager';

describe('视频号近期评论抓取', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('首次只推送60分钟内评论，后续只推送新增评论', async () => {
    const now = new Date('2026-08-03T10:00:00+08:00').getTime();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    let contentCommentCount = 2;
    let comments = [
      createComment('近期评论', now - 30 * 60 * 1000),
      createComment('历史评论', now - 2 * 60 * 60 * 1000),
    ];
    vi.spyOn(Shipinhao, 'getShiPinHaoCommentContent').mockImplementation(
      async (_cookie, _nextPage, _platformAuthorId, _finderUsername, contentType) => {
        if (contentType !== PubContentEnum.video) {
          return { code: 0, msg: '', dataList: [] };
        }

        return {
          code: 0,
          msg: '',
          dataList: [
            {
              platform: Platforms.ShiPinHao,
              contentId: '内容1',
              timestamp: now,
              commentCount: contentCommentCount,
            },
          ],
        };
      },
    );
    vi.spyOn(Shipinhao, 'getShiPinHaoCommentByContent').mockImplementation(async () => ({
      code: 0,
      msg: '',
      dataList: comments,
    }));

    const fetcher = new ShipinhaoRecentCommentFetcher({
      getCookie: () => '测试Cookie',
      ensureIdentity: async () => ({ platformAuthorId: '账号1', finderUsername: '视频号1' }),
    });
    const event = new EventEmitter();
    const pushedCommentIds: string[] = [];
    event.on(SyncEventName.comment_data_back, (commentList: CommentBackItem[]) => {
      pushedCommentIds.push(...commentList.map((comment) => comment.commentId));
    });

    const firstResult = await fetcher.fetch({ days: 7, event });
    expect(firstResult.data?.commentCount).toBe(1);
    expect(pushedCommentIds).toEqual(['近期评论']);

    contentCommentCount = 3;
    comments = [
      createComment('新增评论', now - 10 * 60 * 1000),
      createComment('近期评论', now - 30 * 60 * 1000),
      createComment('历史评论', now - 2 * 60 * 60 * 1000),
    ];
    const secondResult = await fetcher.fetch({ days: 7, event });

    expect(secondResult.data?.commentCount).toBe(1);
    expect(pushedCommentIds).toEqual(['近期评论', '新增评论']);
  });
});

function createComment(commentId: string, timestamp: number): CommentBackItem {
  return {
    platform: Platforms.ShiPinHao,
    accountId: '账号1',
    contentId: '内容1',
    commentId,
    content: commentId,
    timestamp,
    commentUserId: '用户1',
    commentUserName: '测试用户',
    commentUserAvatar: '',
  };
}
