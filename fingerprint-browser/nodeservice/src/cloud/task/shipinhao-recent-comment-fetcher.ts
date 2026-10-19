import { EventEmitter } from 'events';
import { PubContentEnum } from '@/cloud/model/TypeEnum';
import { BaseResult } from '@/media-platform/baseResult';
import { CommentContentListInfoResponse, CommentListInfoResponse, Shipinhao } from '@/media-platform';
import { CommentBackItem, ContentBackItem, SyncEventName } from '@/service/datasync-service-manager';
import { logger, Task } from '@/utils';

export interface ShipinhaoRecentCommentFetchParams {
  days: number;
  platformAuthorId?: string;
  event?: EventEmitter;
}

export interface ShipinhaoRecentCommentFetchResult extends BaseResult {
  data?: {
    contentCount: number;
    commentCount: number;
  };
}

interface ShipinhaoRecentCommentFetcherOptions {
  getCookie: () => string;
  ensureIdentity: (platformAuthorId?: string) => Promise<{ platformAuthorId: string; finderUsername: string }>;
}

interface ShipinhaoRecentCommentContentCache {
  contentId: string;
  documentId?: string;
  commentCount: number;
  timestamp: number;
  lastCommentTimestamp: number;
  fetchedOnce: boolean;
}

interface ShipinhaoCommentFetchResult extends BaseResult {
  commentCount: number;
  maxCommentTimestamp: number;
}

export class ShipinhaoRecentCommentFetcher {
  private static readonly MAX_PAGE = 100000;
  private static readonly COMMENT_PAGE_DELAY_MS = 1000;
  private static readonly INITIAL_COMMENT_PUSH_WINDOW_MS = 30 * 60 * 1000;

  private readonly contentCache: Map<string, ShipinhaoRecentCommentContentCache> = new Map();
  private running = false;
  private initialFetchCompleted = false;

  constructor(private readonly options: ShipinhaoRecentCommentFetcherOptions) {}

  public reset(): void {
    this.contentCache.clear();
    this.running = false;
    this.initialFetchCompleted = false;
  }

  public async fetch(params: ShipinhaoRecentCommentFetchParams): Promise<ShipinhaoRecentCommentFetchResult> {
    const days = Number(params?.days);
    if (!Number.isFinite(days) || days <= 0) {
      return { code: 400, msg: '参数days必须是大于0的数字' };
    }

    if (this.running) {
      return { code: 429, msg: '视频号评论抓取正在执行，请稍后再试' };
    }

    this.running = true;
    try {
      const now = Date.now();
      const minTimestamp = now - days * 24 * 60 * 60 * 1000;
      const pushMinTimestamp = this.initialFetchCompleted
        ? minTimestamp
        : Math.max(minTimestamp, now - ShipinhaoRecentCommentFetcher.INITIAL_COMMENT_PUSH_WINDOW_MS);
      const identity = await this.options.ensureIdentity(params.platformAuthorId);
      if (!identity.platformAuthorId || !identity.finderUsername) {
        return { code: 400, msg: '获取视频号账号信息失败' };
      }

      let contentCount = 0;
      let commentCount = 0;
      const seenContentIds = new Set<string>();
      const contentTypes = [PubContentEnum.video, PubContentEnum.dynamic];
      for (const contentType of contentTypes) {
        const contentResult = await this.fetchRecentCommentContents(identity, contentType, minTimestamp);
        if (contentResult.code !== 0) {
          return { code: contentResult.code, msg: contentResult.msg };
        }

        for (const content of contentResult.dataList ?? []) {
          if (seenContentIds.has(content.contentId)) {
            continue;
          }
          seenContentIds.add(content.contentId);
          contentCount++;

          const contentFetchResult = await this.fetchChangedContentComments(
            content,
            identity,
            minTimestamp,
            pushMinTimestamp,
            params.event,
          );
          if (contentFetchResult.code !== 0) {
            return { code: contentFetchResult.code, msg: contentFetchResult.msg };
          }
          commentCount += contentFetchResult.commentCount;
        }
      }

      this.clearExpiredContentCache(minTimestamp);
      this.initialFetchCompleted = true;
      return { code: 0, msg: '执行完成', data: { contentCount, commentCount } };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : error?.toString?.() ?? '';
      logger.error(`视频号评论抓取异常:${errMsg}`);
      return { code: -1, msg: `视频号评论抓取失败:${errMsg}` };
    } finally {
      this.running = false;
    }
  }

  private async fetchRecentCommentContents(
    identity: { platformAuthorId: string; finderUsername: string },
    contentType: PubContentEnum,
    minTimestamp: number,
  ): Promise<CommentContentListInfoResponse> {
    const result: CommentContentListInfoResponse = { code: 0, msg: '', dataList: [] };
    let nextPage: string | undefined = undefined;
    for (let page = 0; page < ShipinhaoRecentCommentFetcher.MAX_PAGE; page++) {
      const contentResult = await Shipinhao.getShiPinHaoCommentContent(
        this.options.getCookie(),
        nextPage,
        identity.platformAuthorId,
        identity.finderUsername,
        contentType,
      );
      if (contentResult.code !== 0) {
        return contentResult;
      }

      if (!contentResult.dataList?.length) {
        break;
      }

      let reachedTimeLimit = false;
      for (const content of contentResult.dataList) {
        const timestamp = Number(content.timestamp) || 0;
        if (timestamp < minTimestamp) {
          reachedTimeLimit = true;
          break;
        }
        result.dataList?.push(content);
      }

      if (reachedTimeLimit || !contentResult.nextPage || contentResult.nextPage === nextPage) {
        break;
      }
      nextPage = contentResult.nextPage;
    }

    return result;
  }

  private async fetchChangedContentComments(
    content: ContentBackItem,
    identity: { platformAuthorId: string; finderUsername: string },
    minTimestamp: number,
    pushMinTimestamp: number,
    event?: EventEmitter,
  ): Promise<ShipinhaoCommentFetchResult> {
    const contentId = content.contentId;
    const commentCount = Number(content.commentCount) || 0;
    const cached = this.contentCache.get(contentId);
    const shouldFetch = commentCount > 0 && (!cached?.fetchedOnce || cached.commentCount !== commentCount);
    const sinceTimestamp = cached?.fetchedOnce ? cached.lastCommentTimestamp : 0;

    this.contentCache.set(contentId, {
      contentId,
      documentId: content.documentId,
      commentCount,
      timestamp: Number(content.timestamp) || 0,
      lastCommentTimestamp: cached?.lastCommentTimestamp ?? 0,
      fetchedOnce: cached?.fetchedOnce ?? false,
    });

    if (!shouldFetch) {
      return { code: 0, msg: '', commentCount: 0, maxCommentTimestamp: cached?.lastCommentTimestamp ?? 0 };
    }

    const commentResult = await this.fetchContentComments(
      content,
      identity,
      minTimestamp,
      pushMinTimestamp,
      sinceTimestamp ?? 0,
      event,
    );
    if (commentResult.code !== 0) {
      return commentResult;
    }

    const nextCache = this.contentCache.get(contentId);
    if (nextCache) {
      nextCache.commentCount = commentCount;
      nextCache.fetchedOnce = true;
      nextCache.lastCommentTimestamp = Math.max(nextCache.lastCommentTimestamp, commentResult.maxCommentTimestamp);
    }

    return commentResult;
  }

  private async fetchContentComments(
    content: ContentBackItem,
    identity: { platformAuthorId: string; finderUsername: string },
    minTimestamp: number,
    pushMinTimestamp: number,
    sinceTimestamp: number,
    event?: EventEmitter,
  ): Promise<ShipinhaoCommentFetchResult> {
    const sentCommentIds = new Set<string>();
    let nextPage = '';
    let totalCommentCount = 0;
    let maxCommentTimestamp = sinceTimestamp;

    for (let page = 0; page < ShipinhaoRecentCommentFetcher.MAX_PAGE; page++) {
      const commentResult = await this.fetchCommentPage(content.contentId, nextPage, identity);
      if (commentResult.code !== 0) {
        return {
          code: commentResult.code,
          msg: commentResult.msg,
          commentCount: totalCommentCount,
          maxCommentTimestamp,
        };
      }

      if (!commentResult.dataList?.length) {
        break;
      }

      let reachedTimeLimit = false;
      const backCommentList: CommentBackItem[] = [];
      for (const comment of commentResult.dataList) {
        comment.docTitle = content.title ? content.title : content.desc;
        comment.docCover = content.cover;
        const timestamp = Number(comment.timestamp) || 0;
        if (timestamp < minTimestamp) {
          reachedTimeLimit = true;
          break;
        }
        if (timestamp > sinceTimestamp && !sentCommentIds.has(comment.commentId)) {
          sentCommentIds.add(comment.commentId);
          maxCommentTimestamp = Math.max(maxCommentTimestamp, timestamp);
          if (timestamp >= pushMinTimestamp) {
            backCommentList.push(comment);
          }
        }
      }

      totalCommentCount += this.emitCommentList(event, backCommentList);
      if (reachedTimeLimit || !commentResult.nextPage || commentResult.nextPage === nextPage) {
        break;
      }
      nextPage = commentResult.nextPage;
      await Task.Delay(ShipinhaoRecentCommentFetcher.COMMENT_PAGE_DELAY_MS);
    }

    return { code: 0, msg: '', commentCount: totalCommentCount, maxCommentTimestamp };
  }

  private async fetchCommentPage(
    contentId: string,
    nextPage: string,
    identity: { platformAuthorId: string; finderUsername: string },
  ): Promise<CommentListInfoResponse> {
    return Shipinhao.getShiPinHaoCommentByContent(
      this.options.getCookie(),
      contentId,
      '',
      nextPage,
      identity.platformAuthorId,
      identity.finderUsername,
    );
  }

  private emitCommentList(event: EventEmitter | undefined, comments: CommentBackItem[]): number {
    if (!comments.length) {
      return 0;
    }
    event?.emit(SyncEventName.comment_data_back, comments);
    return comments.length;
  }

  private clearExpiredContentCache(minTimestamp: number): void {
    for (const [contentId, content] of this.contentCache.entries()) {
      if (content.timestamp < minTimestamp) {
        this.contentCache.delete(contentId);
      }
    }
  }
}
