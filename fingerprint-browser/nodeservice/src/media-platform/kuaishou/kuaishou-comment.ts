import {
  CommentBackItem,
  ContentBackItem,
  DataSyncTaskItem,
  Platforms,
  SetCommentResultOutPut,
  SyncEventName,
} from '../../service/datasync-service-manager';
import { EventEmitter } from 'events';
import {
  addCommentResponse,
  cancelCommentTopResponse,
  CommentContent,
  delCommentResponse,
  digCommentTopResponse,
  getCommentContentListResponse,
  getCommentListResponse,
  getSubCommentListResponse,
  setCommentTopResponse,
} from './kuaishou-comment.service';
import { Task } from '@/utils';
import { AxiosError } from 'axios';
import { errorCode } from '../errorCode';
import { CommentContentListInfoResponse, CommentListInfoResponse } from '@/media-platform';
import { BaseResult } from '@/media-platform/baseResult';

/**
 * 获取评论
 * @param task
 * @param dataBackEvent
 * @param taskProgressEvent
 */
export const getKuaiShouComment = async (
  task: DataSyncTaskItem,
  dataBackEvent: EventEmitter,
  taskProgressEvent: EventEmitter,
): Promise<void> => {
  try {
    const now = new Date();
    const maxPage = task.maxPage ? task.maxPage : 5;
    const minDate = task.textMinDateTime ? task.textMinDateTime : new Date(new Date().setDate(now.getDate() - 7));
    const minDateTimeStamp = minDate.getTime();
    const contentList: Array<CommentContent> = [];
    let cursor = 0;

    //获取内容列表，确定要抓取评论的内容范围
    for (let i = 0; i < maxPage; i++) {
      const tmpContentList = await getCommentContentListResponse(task.accountCookieStr, cursor);
      if (tmpContentList.data?.photoList?.length > 0) {
        let isEnd = false;
        if (tmpContentList.data.photoList.length > 9) {
          cursor = tmpContentList.data.pcursor;
        } else {
          isEnd = true;
        }
        const backList: Array<ContentBackItem> = [];
        for (const item of tmpContentList.data.photoList) {
          contentList.push(item);
          backList.push({
            platform: Platforms.KuaiShou,
            accountId: task.accountId,
            contentId: item.photoId.toString(),
            title: item.title,
            timestamp: item.uploadTime,
            raw: item,
          });
          if (item.uploadTime < minDateTimeStamp) {
            isEnd = true;
            break;
          }
        }
        //每一页上报一次内容数据
        dataBackEvent.emit(SyncEventName.content_data_back, backList);
        if (isEnd) {
          break;
        }
      } else {
        break;
      }
    }
    if (contentList.length <= 0) {
      return;
    }

    taskProgressEvent.emit(SyncEventName.content_progress, `0/${contentList.length}`);
    //开始遍历获取作品下的品论
    let n = 0;
    for (const item of contentList) {
      n++;
      //内容处理进度
      taskProgressEvent.emit(SyncEventName.content_progress, `${n}/${contentList.length}`);
      let sigCommentCursor = 0;
      if (item.commentCount <= 0) {
        continue;
      }

      //一级评论
      for (let i = 0; i < task.maxPage; i++) {
        const tmpComment = await getCommentListResponse(task.accountCookieStr, item.photoId, sigCommentCursor);
        await Task.Delay(1000);
        let isCmtEnd = false;
        if (tmpComment?.data?.list?.length > 0) {
          if (tmpComment.data.pcursor) {
            sigCommentCursor = tmpComment.data.pcursor;
          } else {
            isCmtEnd = true;
          }
          const backCommentList: Array<CommentBackItem> = [];
          for (const comment of tmpComment.data.list) {
            backCommentList.push({
              platform: Platforms.KuaiShou,
              accountId: task.accountId,
              contentId: item.photoId.toString(),
              commentId: comment.commentId.toString(),
              content: comment.content,
              timestamp: comment.timestamp,
              commentUserId: comment.authorId.toString(),
              commentUserName: comment.authorName,
              commentUserAvatar: comment.headurl,
              raw: comment,
              isAuthor: task.accountId === comment.authorId.toString(),
            });
            if (comment.timestamp < minDateTimeStamp) {
              isCmtEnd = true;
              break;
            }
          }
          //每一页评论上报一次
          dataBackEvent.emit(SyncEventName.comment_data_back, backCommentList);
          //获取评论下的二级评论和回复
          for (const comment of tmpComment.data.list) {
            if (comment.subComments?.length > 0) {
              let pCursor = 0;
              for (let i = 0; i < task.maxPage; i++) {
                const tmpSubComment = await getSubCommentListResponse(
                  task.accountCookieStr,
                  item.photoId,
                  comment.commentId,
                  pCursor,
                );
                if (tmpSubComment?.data?.list?.length > 0) {
                  let endPage = false;
                  const backCommentList: Array<CommentBackItem> = [];
                  for (const subComment of tmpSubComment.data.list) {
                    backCommentList.push({
                      platform: Platforms.KuaiShou,
                      accountId: task.accountId,
                      contentId: item.photoId.toString(),
                      commentId: subComment.commentId.toString(),
                      content: subComment.content,
                      timestamp: subComment.timestamp,
                      commentUserId: subComment.authorId.toString(),
                      commentUserName: subComment.authorName,
                      commentUserAvatar: subComment.headurl,
                      parentId: comment.commentId.toString(),
                      replyToUserId: subComment.replyTo.toString(),
                      replyToUserName: subComment.replyToUserName,
                      raw: subComment,
                      isAuthor: task.accountId === subComment.authorId.toString(),
                    });
                    if (subComment.timestamp < minDateTimeStamp) {
                      endPage = true;
                      break;
                    }
                  }
                  if (backCommentList.length > 0) {
                    dataBackEvent.emit(SyncEventName.comment_data_back, backCommentList);
                  }
                  if (tmpSubComment?.data?.pcursor && !endPage) {
                    pCursor = tmpSubComment.data.pcursor;
                  } else {
                    break;
                  }
                } else {
                  break;
                }
              }
            }
          }

          if (isCmtEnd) {
            break;
          }
        } else {
          break;
        }
      }
    }
  } catch (e) {
    console.error('获取评论数据异常', e);
  }
};
export const getKuaiShouCommentContent = async (
  cookie: string,
  nextPage?: string,
  accountId?: string,
): Promise<CommentContentListInfoResponse> => {
  const re: CommentContentListInfoResponse = { code: 0, msg: '', dataList: [] };
  try {
    let cursor = Number(nextPage ?? 0) ?? 0;
    if (!cursor) {
      cursor = 0;
    }

    const tmpContentList = await getCommentContentListResponse(cookie, cursor);
    re.code = tmpContentList?.result === 1 ? 0 : tmpContentList?.result === 0 ? -1 : tmpContentList?.result;
    re.msg = tmpContentList?.message ?? '获取作品列表失败 ';
    if (tmpContentList?.data?.photoList?.length) {
      if (tmpContentList?.data?.photoList?.length > 9) {
        re.nextPage = tmpContentList.data.pcursor.toString();
      }
      for (const item of tmpContentList.data?.photoList) {
        const id = item.photoId.toString();
        const newItem: ContentBackItem = {
          platform: Platforms.KuaiShou,
          contentId: id,
          title: item.title,
          timestamp: item.uploadTime,
          accountId: accountId,
          cover: item?.cover,
          documentId: id,
          commentCount: Number(item.commentCount) ?? 0,
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

export const getKuaiShouCommentByContent = async (
  cookie: string,
  contentId: string,
  commentId?: string,
  nextPage?: string,
  accountId?: string,
): Promise<CommentListInfoResponse> => {
  const re: CommentListInfoResponse = { code: 0, msg: '', nextPage: '', dataList: [] };
  try {
    let sigCommentCursor = Number(nextPage ?? 0) ?? 0;
    if (!sigCommentCursor) {
      sigCommentCursor = 0;
    }

    re.code = 0;
    re.msg = undefined;

    if (!commentId) {
      const tmpComment = await getCommentListResponse(cookie, contentId, sigCommentCursor);
      if (tmpComment?.result != 1) {
        re.code = tmpComment?.result === 1 ? 0 : tmpComment?.result === 0 ? -1 : tmpComment?.result;
        re.msg = tmpComment?.message ? tmpComment?.message : '获取评论失败 ';
        return re;
      }
      if (tmpComment?.data?.list?.length) {
        if (tmpComment.data?.pcursor) {
          re.nextPage = tmpComment.data?.pcursor.toString();
        }
        const backCommentList: Array<CommentBackItem> = [];
        for (const comment of tmpComment?.data?.list) {
          const newItem: CommentBackItem = {
            platform: Platforms.KuaiShou,
            accountId: accountId ?? '',
            contentId: contentId,
            commentId: comment.commentId?.toString(),
            content: comment.content,
            timestamp: comment.timestamp,
            commentUserId: comment.authorId?.toString(),
            commentUserName: comment.authorName,
            commentUserAvatar: comment.headurl,
            commentCount: Number(comment.subCommentCount ?? 0) ?? 0,
            isAuthor: comment.authorId.toString() === accountId,
          };
          backCommentList.push(newItem);
        }
        re.dataList = backCommentList;
        return re;
      }
    } else {
      const tmpComment = await getSubCommentListResponse(cookie, contentId, Number(commentId), sigCommentCursor);
      if (tmpComment?.result != 1) {
        re.code = tmpComment?.result === 1 ? 0 : tmpComment?.result === 0 ? -1 : tmpComment?.result;
        re.msg = tmpComment?.message ? tmpComment?.message : '获取评论失败 ';
        return re;
      }
      if (tmpComment?.data?.list?.length) {
        if (tmpComment.data?.pcursor) {
          re.nextPage = tmpComment.data?.pcursor.toString();
        }
        const backCommentList: Array<CommentBackItem> = [];
        for (const comment of tmpComment?.data?.list) {
          const newItem: CommentBackItem = {
            platform: Platforms.KuaiShou,
            accountId: accountId ?? '',
            contentId: contentId,
            commentId: comment.commentId?.toString(),
            content: comment.content,
            timestamp: comment.timestamp,
            commentUserId: comment.authorId?.toString(), //视频号没有
            commentUserName: comment.authorName,
            commentUserAvatar: comment.headurl,
            parentId: commentId,
            replyToCommentId: comment.replyToCommentId ? comment.replyToCommentId?.toString() : '',
            replyToUserId: comment.replyTo?.toString(),
            replyToUserName: comment.replyToUserName,
            isAuthor: comment.authorId.toString() === accountId,
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
export const addKuaishouComment = async (
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
    const userStatusResult = await addCommentResponse(
      cookie,
      contentId,
      commentMsg,
      Number(commentId ?? '0'),
      Number(commentUserId ?? '0'),
    );

    result.code = userStatusResult?.result == 1 ? 0 : userStatusResult.result;
    result.msg = userStatusResult.message ?? '';
    if (!userStatusResult?.data?.commentId) {
      result.code = result?.code ?? -1;
      result.msg = `评论失败 ${result.msg ?? ''}`;
      return result;
    }
    result.commentId = userStatusResult?.data?.commentId?.toString();
    result.raw = userStatusResult?.data;
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

/**
 * 删除评论
 * @param cookie
 * @param contentId 评论所属作品id
 * @param commentId 评论id
 */
export const delKuaishouComment = async (
  cookie: string,
  contentId: string,
  commentId: string,
): Promise<SetCommentResultOutPut> => {
  const result: SetCommentResultOutPut = {
    code: 0,
    msg: '',
  };

  try {
    const userStatusResult = await delCommentResponse(cookie, contentId, parseInt(commentId));

    result.code = userStatusResult?.result == 1 ? 0 : userStatusResult.result;
    result.msg = userStatusResult.message ?? '';
    if (!userStatusResult.data && result.code == 0) {
      result.code = -1;
      result.msg = '删除评论失败';
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

/**
 * 评论置顶
 * @param cookie
 * @param contentId 评论所属作品id
 * @param commentId 评论id
 */
export const setKuaishouCommentTop = async (
  cookie: string,
  contentId: string,
  commentId: string,
): Promise<SetCommentResultOutPut> => {
  const result: SetCommentResultOutPut = {
    code: 0,
    msg: '',
  };

  try {
    const userStatusResult = await setCommentTopResponse(cookie, contentId, parseInt(commentId));

    result.code = userStatusResult?.result == 1 ? 0 : userStatusResult.result;
    result.msg = userStatusResult.message ?? '';
    if (!userStatusResult.data && result.code == 0) {
      result.code = -1;
      result.msg = '置顶评论失败';
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

/**
 * 取消评论置顶
 * @param cookie
 * @param contentId 评论所属作品id
 * @param commentId 评论id
 */
export const cancelKuaishouCommentTop = async (
  cookie: string,
  contentId: string,
  commentId: string,
): Promise<SetCommentResultOutPut> => {
  const result: SetCommentResultOutPut = {
    code: 0,
    msg: '',
  };

  try {
    const userStatusResult = await cancelCommentTopResponse(cookie, contentId, parseInt(commentId));

    result.code = userStatusResult?.result == 1 ? 0 : userStatusResult.result;
    result.msg = userStatusResult.message ?? '';
    if (!userStatusResult.data && result.code == 0) {
      result.code = -1;
      result.msg = '取消评论置顶失败';
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

export const digKuaishouComment = async (
  cookie: string,
  contentId: string,
  commentId: string,
  type: 'like' | 'cancelLike',
): Promise<BaseResult> => {
  const result: SetCommentResultOutPut = {
    code: 0,
    msg: '',
  };

  try {
    const userStatusResult = await digCommentTopResponse(cookie, contentId, parseInt(commentId), type);

    result.code = userStatusResult?.result == 1 ? 0 : userStatusResult.result === 0 ? -1 : userStatusResult.result;
    result.msg = userStatusResult.message ?? '';
    if (!userStatusResult.data && result.code == 0) {
      result.msg = `${type === 'like' ? '点赞' : '取消点赞'}评论失败 ${result.msg ?? ''}`;
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
