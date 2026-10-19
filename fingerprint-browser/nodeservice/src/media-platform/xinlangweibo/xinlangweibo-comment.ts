import { CommentContentListInfoResponse, CommentListInfoResponse } from '@/media-platform';
import {
  CommentBackItem,
  ContentBackItem,
  Platforms,
  SetCommentResultOutPut,
} from '@/service/datasync-service-manager';
import { AxiosError } from 'axios';
import { errorCode } from '@/media-platform/errorCode';
import { getXinlangweiboUserInfo } from '@/media-platform/xinlangweibo/xinlangweibo-common';
import { getContentListAsync } from '@/media-platform/xinlangweibo/xinlangweibo-content-list.service';
import {
  createContentComment,
  deleteContentComment,
  digContentComment,
  getContentCommentListResponse,
  getContentSecondCommentListResponse,
  replyContentComment,
} from '@/media-platform/xinlangweibo/xinlangweibo-comment.service';
import { BaseResult } from '@/media-platform/baseResult';

export const getXinlangweiboCommentContent = async (
  cookie: string,
  nextPage?: string,
  uid?: string,
): Promise<CommentContentListInfoResponse> => {
  const re: CommentContentListInfoResponse = { code: 0, msg: '', dataList: [] };
  try {
    let cursor = Number(nextPage ?? 1) ?? 1;
    if (!cursor) {
      cursor = 1;
    }
    if (!uid) {
      const userInfo = await getXinlangweiboUserInfo(cookie);
      uid = userInfo?.data?.user?.id?.toString() ?? '0';
    }
    const tmpContentList = await getContentListAsync(cookie, Number(uid), cursor);
    re.code = tmpContentList?.ok === 1 ? 0 : tmpContentList?.ok === 0 ? -1 : tmpContentList?.ok;
    re.msg = tmpContentList?.message;
    if (tmpContentList?.data?.list?.length) {
      if (tmpContentList?.data?.list?.length > 19) {
        re.nextPage = (cursor + 1).toString();
      }
      for (const item of tmpContentList.data?.list) {
        const id = item.idstr?.toString() ?? item.mid?.toString();
        const newItem: ContentBackItem = {
          platform: Platforms.XinLangWeiBo,
          contentId: id,
          title: item.text_raw,
          timestamp: new Date(item.created_at).getTime(),
          accountId: uid,
          cover: item?.page_info?.pic_info?.pic_big?.url,
          documentId: id,
          commentCount: Number(item.comments_count) ?? 0,
          //raw: item,
        };
        re.dataList?.push(newItem);
      }
    }
  } catch (e) {
    console.error('获取评论作品数据异常', e);
    re.code = -2;
    re.msg = (e as Error)?.message ?? e?.toString();
  }
  return re;
};

export const getXinlangweiboCommentByContent = async (
  cookie: string,
  contentId: string,
  commentId?: string,
  nextPage?: string,
  uid?: string,
): Promise<CommentListInfoResponse> => {
  const re: CommentListInfoResponse = { code: 0, msg: '', nextPage: '', dataList: [] };
  try {
    if (!uid) {
      const userInfo = await getXinlangweiboUserInfo(cookie);
      uid = userInfo?.data?.user?.id?.toString() ?? '0';
    }
    re.code = 0;
    re.msg = undefined;

    if (!commentId) {
      const tmpComment = await getContentCommentListResponse(cookie, contentId, uid, nextPage ?? '');
      if (tmpComment?.ok != 1) {
        re.code = tmpComment?.ok === 1 ? 0 : tmpComment?.ok === 0 ? -1 : tmpComment?.ok;
        re.msg = tmpComment?.message ? tmpComment?.message : '获取评论失败 ';
        return re;
      }
      if (tmpComment?.data?.length) {
        if (tmpComment.max_id) {
          re.nextPage = tmpComment.max_id.toString();
        }
        const backCommentList: Array<CommentBackItem> = [];
        for (const comment of tmpComment?.data) {
          const newItem: CommentBackItem = {
            platform: Platforms.XinLangWeiBo,
            accountId: uid ?? '',
            contentId: contentId,
            commentId: comment.id?.toString(),
            content: comment.text_raw,
            timestamp: new Date(comment.created_at).getTime(),
            commentUserId: comment.user?.idstr ?? comment?.user?.id?.toString(),
            commentUserName: comment.user?.screen_name,
            commentUserAvatar: comment.user?.avatar_hd,
            commentCount: Number(comment.total_number ?? 0) ?? 0,
          };
          backCommentList.push(newItem);
        }
        re.dataList = backCommentList;
        return re;
      }
    } else {
      const tmpComment = await getContentSecondCommentListResponse(cookie, commentId, uid, nextPage);
      if (tmpComment?.ok != 1) {
        re.code = tmpComment?.ok === 1 ? 0 : tmpComment?.ok === 0 ? -1 : tmpComment?.ok;
        re.msg = tmpComment?.message ? tmpComment?.message : '获取评论失败 ';
        return re;
      }
      if (tmpComment?.data?.length) {
        if (tmpComment.max_id) {
          re.nextPage = tmpComment.max_id.toString();
        }
        const backCommentList: Array<CommentBackItem> = [];
        for (const comment of tmpComment?.data) {
          const newItem: CommentBackItem = {
            platform: Platforms.XinLangWeiBo,
            accountId: uid ?? '',
            contentId: contentId,
            commentId: comment.idstr ?? comment.id?.toString(),
            content: comment.text_raw,
            timestamp: new Date(comment.created_at).getTime(),
            commentUserId: comment.user?.idstr ?? comment?.user?.id?.toString(),
            commentUserName: comment.user?.screen_name,
            commentUserAvatar: comment.user?.avatar_hd,
            parentId: commentId,
            replyToCommentId: comment?.reply_comment?.idstr?.toString() ?? comment?.reply_comment?.id?.toString(),
            replyToUserId: comment?.reply_comment?.user?.idstr ?? comment?.reply_comment?.user?.id?.toString(),
            replyToUserName: comment.reply_comment?.user?.screen_name,
          };
          backCommentList.push(newItem);
        }
        re.dataList = backCommentList;
        return re;
      }
    }

    return re;
  } catch (e) {
    console.error('获取作品评论数据异常', e);
    re.code = -2;
    re.msg = (e as Error)?.message ?? e?.toString();
  }
  return re;
};
/**
 * 添加/回复评论
 * @param cookie
 * @param commentMsg 评论内容
 * @param contentId 评论所属的作品id
 * @param commentId 如果是回复评论时，评论的id
 * @param commentUserId 如果是评论时，评论所属的作者id
 */
export const addXinlangweiboComment = async (
  cookie: string,
  commentMsg: string,
  contentId: string,
  commentId?: string,
  commentUserId?: string,
): Promise<SetCommentResultOutPut> => {
  const result: SetCommentResultOutPut = {
    code: 0,
    msg: '',
  };

  try {
    const userStatusResult = commentId
      ? await replyContentComment(cookie, contentId, commentId, commentMsg, '')
      : await createContentComment(cookie, contentId, commentMsg, '');

    result.code = userStatusResult?.ok == 1 ? 0 : userStatusResult.ok;
    result.msg = userStatusResult.message ?? '';
    if (!userStatusResult?.data?.id) {
      result.code = result?.code ?? -1;
      result.msg = `评论失败 ${result.msg ?? ''}`;
      return result;
    }
    result.commentId = userStatusResult?.data?.id?.toString();
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export const delXinlangweiboComment = async (
  cookie: string,
  contentId: string,
  commentId: string,
): Promise<SetCommentResultOutPut> => {
  const result: SetCommentResultOutPut = {
    code: 0,
    msg: '',
  };

  try {
    const userStatusResult = await deleteContentComment(cookie, commentId);

    result.code = userStatusResult?.ok == 1 ? 0 : userStatusResult.ok;
    result.msg = userStatusResult.message ?? '';
    if (!userStatusResult.data && result.code == 0) {
      result.code = result.code ?? -1;
      result.msg = `删除评论失败${result.msg ?? ''}`;
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export const digXinlangweiboComment = async (
  cookie: string,
  contentId: string,
  commentId: string,
  type: 'updateLike' | 'destroyLike' = 'updateLike',
): Promise<BaseResult> => {
  const result: SetCommentResultOutPut = {
    code: 0,
    msg: '',
  };

  try {
    const userStatusResult = await digContentComment(cookie, commentId, type);

    result.code = userStatusResult?.ok == 1 ? 0 : userStatusResult.ok === 0 ? -1 : userStatusResult.ok;
    result.msg = userStatusResult.message ?? '';
    if (result.code != 0) {
      result.msg = `${type === 'updateLike' ? '点赞' : '取消点赞'}评论失败 ${result.msg ?? ''}`;
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};
