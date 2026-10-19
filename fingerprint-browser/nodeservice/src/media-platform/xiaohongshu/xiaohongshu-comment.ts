import { EventEmitter } from 'events';
import {
  CommentBackItem,
  ContentBackItem,
  DataSyncTaskItem,
  Platforms,
  SetCommentResultOutPut,
  SyncEventName,
} from '../../service/datasync-service-manager';
import { getContentListAsync, XiaohongshuMediaContent } from './xiaohongshu-content-list.service';
import {
  addXiaohongshuCommentResponse,
  deleteXiaohongshuCommentResponse,
  digXiaohongshuCommentResponse,
  getContentCommentResponse,
  getContentCommentSubListResponse,
} from './xiaohongshu-comment.service';
import { Task } from '@/utils';
import { AxiosError } from 'axios';
import { errorCode } from '../..//media-platform/errorCode';
import { CommentContentListInfoResponse, CommentListInfoResponse } from '@/media-platform';

/**
 * 获取评论
 * @param task
 * @param dataBackEvent
 * @param taskProgressEvent
 */
export const getXiaohongshuComment = async (
  task: DataSyncTaskItem,
  dataBackEvent: EventEmitter,
  taskProgressEvent: EventEmitter,
): Promise<void> => {
  try {
    const now = new Date();
    const maxPage = task.maxPage ? task.maxPage : 5;
    const minDate = task.textMinDateTime ? task.textMinDateTime : new Date(new Date().setDate(now.getDate() - 7));
    const minDateTimeStamp = minDate.getTime();
    const contentList: Array<XiaohongshuMediaContent> = [];

    //获取内容列表，确定要抓取评论的内容范围
    for (let i = 0; i < maxPage; i++) {
      const tmpContentList = await getContentListAsync(task.accountCookieStr, 1, i);
      if (tmpContentList?.data?.notes && tmpContentList?.data?.notes?.length > 0) {
        let isEnd = false;

        const backList: Array<ContentBackItem> = [];
        for (const item of tmpContentList.data.notes) {
          if (item.permission_code != 0) {
            continue;
          }
          contentList.push(item);
          const newItem = {
            platform: Platforms.XiaoHongShu,
            accountId: task.accountId,
            contentId: item.id.toString(),
            title: item.display_title,
            timestamp: new Date(item.time).getTime(),
            raw: item,
          };
          backList.push(newItem);
          if (newItem.timestamp < minDateTimeStamp) {
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
      if (!item.comments_count || item.comments_count <= 0) {
        continue;
      }

      //一级评论
      let firstLevelCorsor = '';
      //暂时还不知道后续值怎么来的
      const topicCommentId = '';
      for (let i = 0; i < task.maxPage; i++) {
        const tmpComment = await getContentCommentResponse(
          task.accountCookieStr,
          item.id,
          item.xsec_token,
          firstLevelCorsor,
          topicCommentId,
        );
        await Task.Delay(1000);
        let isCmtEnd = false;
        if (tmpComment?.data?.comments?.length > 0) {
          if (tmpComment.data.has_more) {
            firstLevelCorsor = tmpComment.data.cursor;
          } else {
            isCmtEnd = true;
          }
          const backCommentList: Array<CommentBackItem> = [];
          for (const comment of tmpComment.data.comments) {
            backCommentList.push({
              platform: Platforms.XiaoHongShu,
              accountId: task.accountId,
              contentId: item.id.toString(),
              commentId: comment.id,
              content: comment.content,
              timestamp: comment.create_time,
              commentUserId: comment.user_info.user_id.toString(),
              commentUserName: comment.user_info.nickname,
              commentUserAvatar: comment.user_info.image,
              raw: comment,
            });
            if (comment.sub_comments?.length > 0) {
              for (const subComment of comment.sub_comments) {
                backCommentList.push({
                  platform: Platforms.XiaoHongShu,
                  accountId: task.accountId,
                  contentId: item.id.toString(),
                  commentId: subComment.id,
                  content: subComment.content,
                  timestamp: subComment.create_time,
                  commentUserId: subComment.user_info.user_id.toString(),
                  commentUserName: subComment.user_info.nickname,
                  commentUserAvatar: subComment.user_info.image,
                  parentId: comment.id,
                  replyToUserId: subComment.target_comment.user_info.user_id,
                  replyToUserName: subComment.target_comment.user_info.nickname,
                  raw: subComment,
                });
              }
            }
            if (comment.create_time < minDateTimeStamp) {
              isCmtEnd = true;
              break;
            }
          }

          //每一页评论上报一次
          dataBackEvent.emit(SyncEventName.comment_data_back, backCommentList);
          if (backCommentList.length == 0) {
            break;
          }
          //获取评论下的二级评论和回复
          for (const comment of backCommentList) {
            if (comment.raw && comment.raw['sub_comment_has_more']) {
              let pCursor = '';
              const subTopicCommentId = '';
              for (let i = 0; i < task.maxPage; i++) {
                const tmpSubComment = await getContentCommentSubListResponse(
                  task.accountCookieStr,
                  item.id.toString(),
                  item.xsec_token,
                  pCursor,
                  comment.commentId,
                  subTopicCommentId,
                );
                if (tmpSubComment?.data?.comments?.length > 0) {
                  let endPage = false;
                  const backCommentList: Array<CommentBackItem> = [];
                  for (const subComment of tmpSubComment.data.comments) {
                    backCommentList.push({
                      platform: Platforms.XiaoHongShu,
                      accountId: task.accountId,
                      contentId: item.id.toString(),
                      commentId: subComment.id,
                      content: subComment.content,
                      timestamp: subComment.create_time,
                      commentUserId: subComment.user_info.user_id.toString(),
                      commentUserName: subComment.user_info.nickname,
                      commentUserAvatar: subComment.user_info.image,
                      parentId: comment.commentId.toString(),
                      replyToUserId: subComment.target_comment.user_info.user_id,
                      replyToUserName: subComment.target_comment.user_info.nickname,
                      raw: subComment,
                    });
                    if (subComment.create_time < minDateTimeStamp) {
                      endPage = true;
                      break;
                    }
                  }
                  if (backCommentList.length > 0) {
                    dataBackEvent.emit(SyncEventName.comment_data_back, backCommentList);
                  }
                  if (tmpSubComment?.data?.has_more && !endPage) {
                    pCursor = tmpSubComment.data.cursor;
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

export const getXiaoHongShuCommentContent = async (
  cookie: string,
  nextPage?: string,
  accountId?: string,
): Promise<CommentContentListInfoResponse> => {
  const re: CommentContentListInfoResponse = { code: 0, msg: '', dataList: [] };
  try {
    const cursor = Number(nextPage ?? 0) ?? 0;

    const tmpContentList = await getContentListAsync(cookie, 1, cursor);
    re.code = tmpContentList?.code ?? -1;
    re.msg = tmpContentList?.msg ?? '获取作品列表失败 ';
    if (tmpContentList?.data?.page && tmpContentList?.data?.page > 0) {
      re.nextPage = tmpContentList?.data?.page.toString();
    }
    if (tmpContentList?.data?.notes) {
      for (const item of tmpContentList.data?.notes) {
        const id = item.id.toString();
        const newItem: ContentBackItem = {
          platform: Platforms.XiaoHongShu,
          contentId: `${id}_${item.xsec_token}`,
          title: item.display_title ?? '',
          timestamp: new Date(item.time).getTime(),
          accountId: accountId,
          cover: item?.images_list?.length ? item?.images_list[0]?.url : '',
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

export const getXiaoHongShuCommentByContent = async (
  cookie: string,
  contentId: string,
  commentId?: string,
  nextPage?: string,
  accountId?: string,
): Promise<CommentListInfoResponse> => {
  const re: CommentListInfoResponse = { code: 0, msg: '', nextPage: '', dataList: [] };
  try {
    const sigCommentCursor = nextPage ?? '';

    re.code = 0;
    re.msg = undefined;
    const seps = contentId?.split('_');
    const tmpComment = await getContentCommentResponse(cookie, seps[0], seps[1], sigCommentCursor, commentId);
    if (tmpComment?.code != 0) {
      re.code = tmpComment?.code ?? -1;
      re.msg = tmpComment?.msg ? tmpComment?.msg : '获取评论失败 ';
      return re;
    }
    if (tmpComment?.data?.comments?.length) {
      if (tmpComment.data?.has_more === true) {
        re.nextPage = tmpComment.data?.cursor?.toString();
      }
      const backCommentList: Array<CommentBackItem> = [];
      for (const comment of tmpComment?.data?.comments) {
        const newItem: CommentBackItem = {
          platform: Platforms.XiaoHongShu,
          accountId: accountId ?? '',
          contentId: contentId,
          commentId: comment.id?.toString(),
          content: comment.content,
          timestamp: comment.create_time,
          commentUserId: comment.user_info?.user_id,
          commentUserName: comment.user_info.nickname,
          commentUserAvatar: comment.user_info.image,
        };
        if (commentId) {
          newItem.parentId = commentId;
          newItem.replyToCommentId = comment.target_comment?.id;
          newItem.replyToUserId = comment.target_comment?.user_info?.user_id;
          newItem.replyToUserName = comment.target_comment?.user_info?.nickname;
        } else {
          newItem.commentCount = Number(comment.sub_comment_count);
        }
        backCommentList.push(newItem);
      }
      re.dataList = backCommentList;
      return re;
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
 */
export const addXiaohongshuComment = async (
  cookie: string,
  commentMsg: string,
  contentId: string,
  commentId?: string,
): Promise<SetCommentResultOutPut> => {
  const result: SetCommentResultOutPut = {
    code: 0,
    msg: '',
  };

  try {
    const userStatusResult = await addXiaohongshuCommentResponse(
      cookie,
      contentId?.split('_')[0],
      commentMsg,
      commentId,
    );

    result.code = userStatusResult?.code ?? -1;
    result.msg = userStatusResult.msg ?? '';
    if (!userStatusResult?.data?.comment?.id) {
      result.code = -1;
      result.msg = `评论失败${userStatusResult.msg ?? ''}`;
    }
    result.commentId = userStatusResult.data.comment.id;
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
export const delXiaohongshuComment = async (
  cookie: string,
  contentId: string,
  commentId: string,
): Promise<SetCommentResultOutPut> => {
  const result: SetCommentResultOutPut = {
    code: 0,
    msg: '',
  };

  try {
    const userStatusResult = await deleteXiaohongshuCommentResponse(cookie, contentId?.split('_')[0], commentId);

    result.code = userStatusResult?.code ?? -1;
    result.msg = userStatusResult.msg ?? '';
    if (!userStatusResult.success || result.code !== 0) {
      result.code = -1;
      result.msg = `删除评论失败${userStatusResult.msg ?? ''}`;
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
 * 点赞/取消评论
 * @param cookie
 * @param contentId 评论所属作品id
 * @param commentId 评论id
 * @param type
 */
export const digXiaohongshuComment = async (
  cookie: string,
  contentId: string,
  commentId: string,
  type: 'like' | 'dislike' = 'like',
): Promise<SetCommentResultOutPut> => {
  const result: SetCommentResultOutPut = {
    code: 0,
    msg: '',
  };

  try {
    const userStatusResult = await digXiaohongshuCommentResponse(cookie, contentId?.split('_')[0], commentId, type);

    result.code = userStatusResult?.code ?? -1;
    result.msg = userStatusResult.msg ?? '';
    if (!userStatusResult.success || result.code !== 0) {
      result.code = -1;
      result.msg = `${type === 'like' ? '点赞' : '取消点赞'}失败${userStatusResult.msg ?? ''}`;
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
