import { CommentContentListInfoResponse, CommentListInfoResponse } from '@/media-platform';
import {
  CommentBackItem,
  ContentBackItem,
  Platforms,
  SetCommentResultOutPut,
} from '@/service/datasync-service-manager';
import { BaseResult } from '@/media-platform/baseResult';
import { errorCode } from '@/media-platform/errorCode';
import { IWebProxy } from '@/media-platform/webproxy';
import { getXiaohongshuhomeUserInfo } from './xiaohongshuhome-user';
import {
  deleteXiaohongshuhomeComment,
  getXiaohongshuhomeCommentNoticePage,
  getXiaohongshuhomeCommentPage,
  getXiaohongshuhomeNoteList,
  getXiaohongshuhomeSubCommentPage,
  likeXiaohongshuhomeComment,
  postXiaohongshuhomeComment,
  XiaohongshuhomeComment,
  XiaohongshuhomeCommentNotice,
  XiaohongshuhomeNote,
} from './xiaohongshuhome-comment.service';
import { normalizeXiaohongshuhomeTimestamp } from './xiaohongshuhome-message.service';
import {
  getXiaohongshuContentList,
  XiaohongshuMediaContent,
} from '@/media-platform/xiaohongshuhome/xiaohongshuhome-common';

const toNumber = (value: unknown, defaultValue: number = 0): number => {
  const result = Number(value);
  return Number.isFinite(result) ? result : defaultValue;
};

const getNoteTimestamp = (note: XiaohongshuhomeNote): number => {
  return normalizeXiaohongshuhomeTimestamp(note.time ?? note.create_time ?? note.last_update_time ?? 0);
};

const getNoteCover = (note: XiaohongshuhomeNote): string => {
  return note.cover?.url ?? '';
};

const getCommentUserId = (comment: XiaohongshuhomeComment): string => {
  return String(comment.user_info?.user_id ?? comment.user_info?.userid ?? '');
};

const getCommentUserName = (comment: XiaohongshuhomeComment): string => {
  return comment.user_info?.nickname ?? '';
};

const getCommentUserAvatar = (comment: XiaohongshuhomeComment): string => {
  return comment.user_info?.avatar ?? comment.user_info?.image ?? '';
};

const isCommentAuthor = (commentUserId: string, accountId: string): boolean => {
  return Boolean(commentUserId && accountId && commentUserId === accountId);
};

const resolveContentId = (contentId: string, xsecToken?: string): { noteId: string; xsecToken: string } => {
  if (xsecToken) {
    return { noteId: contentId, xsecToken };
  }
  const separatorIndex = contentId.indexOf('_');
  if (separatorIndex < 1 || separatorIndex >= contentId.length - 1) {
    return { noteId: contentId, xsecToken: '' };
  }
  return {
    noteId: contentId.slice(0, separatorIndex),
    xsecToken: contentId.slice(separatorIndex + 1),
  };
};

const toContentBackItem = (note: XiaohongshuMediaContent, accountId: string): ContentBackItem => {
  const noteId = String(note.id ?? '');
  return {
    platform: Platforms.XiaoHongShuHome,
    accountId,
    contentId: noteId,
    documentId: noteId,
    xsecToken: note.xsec_token,
    title: note?.display_title??'',
    cover: note?.images_list[0].url,
    timestamp: new Date(note.time).getTime(),
    commentCount: toNumber(note.comments_count, 0),
    //raw: note,
  };
};

const toCommentBackItem = (
  comment: XiaohongshuhomeComment,
  accountId: string,
  contentId: string,
  xsecToken: string,
  documentId?: string,
  parentId?: string,
): CommentBackItem => {
  const targetComment = comment.target_comment;
  return {
    platform: Platforms.XiaoHongShuHome,
    accountId,
    contentId,
    xsecToken,
    documentId,
    commentId: String(comment.id ?? ''),
    content: comment.content ?? '',
    timestamp: normalizeXiaohongshuhomeTimestamp(comment.create_time),
    commentCount: toNumber(comment.sub_comment_count, 0),
    commentUserId: getCommentUserId(comment),
    commentUserName: getCommentUserName(comment),
    commentUserAvatar: getCommentUserAvatar(comment),
    isAuthor: isCommentAuthor(getCommentUserId(comment), accountId),
    parentId,
    replyToCommentId: targetComment?.id,
    replyToUserId: targetComment?.user_info?.user_id,
    replyToUserName: targetComment?.user_info?.nickname,
    hasMore: comment.sub_comment_has_more,
    //raw: comment,
  };
};

const toNoticeCommentBackItem = (notice: XiaohongshuhomeCommentNotice, accountId: string): CommentBackItem => {
  const noteId = String(notice.item_info?.id ?? '');
  const xsecToken = notice.item_info?.xsec_token ?? '';
  const commentId = String(notice.comment_info?.id ?? notice.id ?? '');
  const commentUserId = String(notice.user_info?.userid ?? notice.user_info?.user_id ?? '');
  return {
    platform: Platforms.XiaoHongShuHome,
    accountId,
    contentId: noteId,
    documentId: noteId,
    xsecToken,
    docTitle: notice.item_info?.title ?? notice.item_info?.content ?? '',
    docCover: notice.item_info?.image ?? '',
    commentId,
    content: notice.comment_info?.content ?? '',
    timestamp: normalizeXiaohongshuhomeTimestamp(notice.time),
    commentUserId,
    commentUserName: notice.user_info?.nickname ?? '',
    commentUserAvatar: notice.user_info?.image ?? notice.user_info?.avatar ?? '',
    isAuthor: isCommentAuthor(commentUserId, accountId),
    replyToCommentId: notice.comment_info?.target_comment_id,
    //raw: notice,
  };
};

const getAccountId = async (cookie: string, accountId?: string, proxy?: IWebProxy): Promise<string> => {
  if (accountId) {
    return accountId;
  }
  const userInfo = await getXiaohongshuhomeUserInfo(cookie, proxy);
  return userInfo.yixiaoerId ?? '';
};

/**
 * 获取小红书主页当前用户作品列表，供评论任务使用。
 */
export const getXiaohongshuhomeCommentContent = async (
  cookie: string,
  nextPage?: string,
  accountId?: string,
  proxy?: IWebProxy,
): Promise<CommentContentListInfoResponse> => {
  const result: CommentContentListInfoResponse = { code: 0, msg: '', dataList: [] };

  try {
    const ownerId = await getAccountId(cookie, accountId, proxy);
    if (!ownerId) {
      return { code: errorCode.notLogin, msg: '获取小红书主页用户信息失败' };
    }
    const pageNo = Number(nextPage ?? '0') ?? 0;
    const response = await getXiaohongshuContentList(cookie, 1, pageNo ?? 0, proxy);
    result.code = response.code ?? -1;
    result.msg = response.msg ?? '';
    result.dataList = (response.data?.notes ?? []).map((note) => toContentBackItem(note, ownerId));
    if (response.data?.notes?.length ) {
      result.nextPage = (pageNo+1).toString();
    }
  } catch {
    result.code = errorCode.exception;
    result.msg = '获取小红书主页作品列表失败，请稍后重试';
  }

  return result;
};

/**
 * 获取小红书主页指定作品的一级评论或二级评论。
 */
export const getXiaohongshuhomeCommentByContent = async (
  cookie: string,
  contentId: string,
  commentId?: string,
  nextPage?: string,
  accountId?: string,
  proxy?: IWebProxy,
  xsecToken?: string,
): Promise<CommentListInfoResponse> => {
  const result: CommentListInfoResponse = { code: 0, msg: '', dataList: [] };
  const content = resolveContentId(contentId, xsecToken);
  if (!content.noteId) {
    return { code: errorCode.data_error, msg: '作品id不能为空', dataList: [] };
  }

  try {
    const ownerId = await getAccountId(cookie, accountId, proxy);
    const response = commentId
      ? await getXiaohongshuhomeSubCommentPage(
          cookie,
          content.noteId,
          commentId,
          content.xsecToken,
          nextPage ?? '',
          10,
          proxy,
        )
      : await getXiaohongshuhomeCommentPage(cookie, content.noteId, content.xsecToken, nextPage ?? '', proxy);
    result.code = response.code ?? -1;
    result.msg = response.msg ?? '';
    result.dataList = (response.data?.comments ?? []).map((comment) =>
      toCommentBackItem(comment, ownerId, content.noteId, content.xsecToken, content.noteId, commentId),
    );
    if (response.data?.has_more && response.data.cursor) {
      result.nextPage = response.data.cursor;
    }
  } catch {
    result.code = errorCode.exception;
    result.msg = '获取小红书主页评论失败，请稍后重试';
  }

  return result;
};

/**
 * 发布小红书主页评论或回复评论。
 */
export const addXiaohongshuhomeComment = async (
  cookie: string,
  commentMsg: string,
  contentId: string,
  commentId?: string,
  proxy?: IWebProxy,
): Promise<SetCommentResultOutPut> => {
  const result: SetCommentResultOutPut = { code: 0, msg: '' };
  const content = resolveContentId(contentId);
  if (!content.noteId) {
    return { code: errorCode.data_error, msg: '小红书主页评论缺少作品id' };
  }

  try {
    const response = await postXiaohongshuhomeComment(cookie, content.noteId, commentMsg, commentId, proxy);
    result.code = response.code ?? -1;
    result.msg = response.msg ?? '';
    result.commentId = response.data?.comment?.id;
    if (result.code === 0 && !result.commentId) {
      result.code = -1;
      result.msg = '小红书主页评论发布结果缺少评论id';
    }
  } catch {
    result.code = errorCode.exception;
    result.msg = '发布小红书主页评论失败，请稍后重试';
  }

  return result;
};

/**
 * 删除小红书主页评论。
 */
export const delXiaohongshuhomeComment = async (
  cookie: string,
  contentId: string,
  commentId: string,
  proxy?: IWebProxy,
): Promise<SetCommentResultOutPut> => {
  const content = resolveContentId(contentId);
  try {
    const response = await deleteXiaohongshuhomeComment(cookie, commentId, content.noteId, proxy);
    return { code: response.code ?? -1, msg: response.msg ?? '' };
  } catch {
    return {
      code: errorCode.exception,
      msg: '删除小红书主页评论失败，请稍后重试',
    };
  }
};

/**
 * 点赞小红书主页评论。
 */
export const digXiaohongshuhomeComment = async (
  cookie: string,
  contentId: string,
  commentId: string,
  proxy?: IWebProxy,
): Promise<BaseResult> => {
  const content = resolveContentId(contentId);
  try {
    const response = await likeXiaohongshuhomeComment(cookie, commentId, content.noteId, proxy);
    return { code: response.code ?? -1, msg: response.msg ?? '' };
  } catch {
    return {
      code: errorCode.exception,
      msg: '点赞小红书主页评论失败，请稍后重试',
    };
  }
};

/**
 * 获取小红书主页评论通知，用于私信 Worker 的评论增量监听。
 */
export const getXiaohongshuhomeLatestCommentNoticeList = async (
  cookie: string,
  cursor?: string,
  accountId: string = '',
  proxy?: IWebProxy,
): Promise<CommentListInfoResponse> => {
  const result: CommentListInfoResponse = { code: 0, msg: '', dataList: [] };

  try {
    const response = await getXiaohongshuhomeCommentNoticePage(cookie, cursor ?? '', 20, proxy);
    result.code = response.code ?? -1;
    result.msg = response.msg ?? '';
    const notices = (response.data?.message_list ?? []).filter((notice) => notice.type === 'comment/item');
    result.dataList = notices.map((notice) => toNoticeCommentBackItem(notice, accountId));
    result.nextPage = String(response.data?.strCursor ?? response.data?.cursor ?? '');
  } catch {
    result.code = errorCode.exception;
    result.msg = '获取小红书主页评论通知失败，请稍后重试';
  }

  return result;
};
