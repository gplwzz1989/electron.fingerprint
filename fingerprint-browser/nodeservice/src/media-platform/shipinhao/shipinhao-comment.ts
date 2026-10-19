import { EventEmitter } from 'events';
import {
  CommentBackItem,
  ContentBackItem,
  DataSyncTaskItem,
  Platforms,
  SetCommentResultOutPut,
  SyncEventName,
} from '../../service/datasync-service-manager';
import {
  addShipinhaoCommentResponse,
  delShipinhaoCommentResponse,
  digShipinhaoCommentResponse,
  getShipinhaoCommentContentListResponse,
  getShipinhaoCommentListResponse,
  setTopShipinhaoCommentResponse,
  ShipinhaoCommentContent,
} from './shipinhao-comment.service';
import { getUserinfo } from './shipinhao-base.service';
import { Task } from '@/utils';
import { AxiosError } from 'axios';
import { errorCode } from '../errorCode';
import { CommentContentListInfoResponse, CommentListInfoResponse } from '@/media-platform';
import { PubContentEnum } from '@/cloud/model/TypeEnum';
import { ac } from 'vitest/dist/chunks/reporters.d.DG9VKi4m';
import {
  getDouyinLevel2ContentCommentListResponse,
  getDouyinSignleContentCommentListResponse,
} from '@/media-platform/douyin/douyin-comment.service';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '@/media-platform/webproxy';

/**
 * 获取评论
 * @param task
 * @param dataBackEvent
 * @param taskProgressEvent
 */
export const getShipinhaoComment = async (
  task: DataSyncTaskItem,
  dataBackEvent: EventEmitter,
  taskProgressEvent: EventEmitter,
): Promise<void> => {
  try {
    const now = new Date();
    const maxPage = task.maxPage ? task.maxPage : 5;
    const minDate = task.textMinDateTime ? task.textMinDateTime : new Date(new Date().setDate(now.getDate() - 7));
    const minDateTimeStamp = minDate.getTime();
    const contentList: Array<ShipinhaoCommentContent> = [];

    const userInfo = await getUserinfo(task.accountCookieStr, undefined);
    if (!userInfo?.data?.finderUser?.finderUsername) {
      throw new Error(userInfo.errMsg ?? '获取用户信息失败');
    }
    //获取内容列表，确定要抓取评论的内容范围,图文
    for (let i = 1; i <= maxPage; i++) {
      const tmpContentList = await getShipinhaoCommentContentListResponse(
        task.accountCookieStr,
        12,
        userInfo.data.finderUser.finderUsername,
        i,
      );
      if (tmpContentList.data?.list?.length > 0) {
        let isEnd = false;
        if (tmpContentList.data.list.length > 9) {
        } else {
          isEnd = true;
        }
        const backList: Array<ContentBackItem> = [];
        for (const item of tmpContentList.data.list) {
          contentList.push(item);
          const newItem = {
            platform: Platforms.ShiPinHao,
            accountId: task.accountId,
            contentId: item.exportId.toString(),
            title: item.desc?.finderNewlifeDesc?.richTextTitle ?? item.desc?.description,
            timestamp: item.createTime * 1000,
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

    //获取内容列表，确定要抓取评论的内容范围,视频
    for (let i = 1; i <= maxPage; i++) {
      const tmpContentList = await getShipinhaoCommentContentListResponse(
        task.accountCookieStr,
        13,
        userInfo.data.finderUser.finderUsername,
        i,
      );
      if (tmpContentList.data?.list?.length > 0) {
        let isEnd = false;
        if (tmpContentList.data.list.length > 9) {
        } else {
          isEnd = true;
        }
        const backList: Array<ContentBackItem> = [];
        for (const item of tmpContentList.data.list) {
          contentList.push(item);
          const newItem = {
            platform: Platforms.ShiPinHao,
            accountId: task.accountId,
            contentId: item.exportId.toString(),
            title: item.desc?.finderNewlifeDesc?.richTextTitle ?? item.desc?.description,
            timestamp: item.createTime * 1000,
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
      let firstLevelLastBuff = '';
      if (item.commentCount <= 0) {
        continue;
      }

      //一级评论
      for (let i = 0; i < task.maxPage; i++) {
        const tmpComment = await getShipinhaoCommentListResponse(
          task.accountCookieStr,
          item.exportId,
          userInfo.data?.finderUser?.finderUsername,
          firstLevelLastBuff,
        );
        await Task.Delay(1000);
        let isCmtEnd = false;
        if (tmpComment?.data?.comment?.length > 0) {
          if (tmpComment.data.downContinueFlag && tmpComment.data.lastBuff) {
            firstLevelLastBuff = tmpComment.data.lastBuff;
          } else {
            isCmtEnd = true;
          }
          const backCommentList: Array<CommentBackItem> = [];
          for (const comment of tmpComment.data.comment) {
            const newItem = {
              platform: Platforms.ShiPinHao,
              accountId: task.accountId,
              contentId: item.exportId.toString(),
              commentId: comment.commentId.toString(),
              content: comment.commentContent,
              timestamp: parseInt(comment.commentCreatetime) * 1000,
              commentUserId: '', //视频号没有
              commentUserName: comment.commentNickname,
              commentUserAvatar: comment.commentHeadurl,
              raw: comment,
            };
            backCommentList.push(newItem);
            if (newItem.timestamp < minDateTimeStamp) {
              isCmtEnd = true;
              break;
            }
          }
          //每一页评论上报一次
          dataBackEvent.emit(SyncEventName.comment_data_back, backCommentList);
          //获取评论下的二级评论和回复
          for (const comment of tmpComment.data.comment) {
            if (comment.levelTwoComment?.length > 0) {
              //先从一级数据下的二级评论判断是否需要请求获取二级评论
              let endPre = false;
              const backCommentListPre: Array<CommentBackItem> = [];
              for (const subComment of comment.levelTwoComment) {
                const newItem = {
                  platform: Platforms.ShiPinHao,
                  accountId: task.accountId,
                  contentId: item.exportId.toString(),
                  commentId: subComment.commentId.toString(),
                  content: subComment.commentContent,
                  timestamp: parseInt(subComment.commentCreatetime) * 1000,
                  commentUserId: '',
                  commentUserName: subComment.commentNickname,
                  commentUserAvatar: subComment.commentHeadurl,
                  parentId: comment.commentId.toString(),
                  replyToCommentId: subComment.replyCommentId,
                  replyToUserId: '',
                  replyToUserName: subComment.replyNickname,
                  raw: subComment,
                };
                backCommentListPre.push(newItem);
                if (newItem.timestamp < minDateTimeStamp) {
                  endPre = true;
                  break;
                }
              }
              if (backCommentListPre?.length > 0) {
                dataBackEvent.emit(SyncEventName.comment_data_back, backCommentListPre);
              }
              if (endPre || !comment.downContinueFlag) {
                continue;
              }

              //通过请求获取更多的二级评论
              let twoLevelLastBuff = comment.lastBuff;
              for (let i = 0; i < task.maxPage; i++) {
                const tmpSubComment = await getShipinhaoCommentListResponse(
                  task.accountCookieStr,
                  item.exportId,
                  userInfo.data?.finderUser?.finderUsername,
                  twoLevelLastBuff,
                  comment.commentId,
                );
                if (tmpSubComment?.data?.comment?.length > 0) {
                  let endPage = false;
                  const backCommentList: Array<CommentBackItem> = [];
                  for (const subComment of tmpSubComment.data.comment) {
                    const newItem = {
                      platform: Platforms.ShiPinHao,
                      accountId: task.accountId,
                      contentId: item.exportId.toString(),
                      commentId: subComment.commentId.toString(),
                      content: subComment.commentContent,
                      timestamp: parseInt(subComment.commentCreatetime) * 1000,
                      commentUserId: '',
                      commentUserName: subComment.commentNickname,
                      commentUserAvatar: subComment.commentHeadurl,
                      parentId: comment.commentId.toString(),
                      replyToCommentId: subComment.replyCommentId,
                      replyToUserId: '',
                      replyToUserName: subComment.replyNickname,
                      raw: subComment,
                    };
                    backCommentList.push(newItem);
                    if (newItem.timestamp < minDateTimeStamp) {
                      endPage = true;
                      break;
                    }
                  }
                  if (backCommentList.length > 0) {
                    dataBackEvent.emit(SyncEventName.comment_data_back, backCommentList);
                  }
                  if (tmpSubComment?.data?.downContinueFlag && !endPage) {
                    twoLevelLastBuff = tmpSubComment.data.lastBuff;
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

export const getShiPinHaoCommentContent = async (
  cookie: string,
  nextPage?: string,
  accountId?: string,
  finderUserName?: string,
  contentType?: PubContentEnum,
): Promise<CommentContentListInfoResponse> => {
  const re: CommentContentListInfoResponse = { code: 0, msg: '', dataList: [] };
  try {
    const cursor = Number(nextPage ?? 1) ?? 1;
    if (!finderUserName) {
      const userInfo = await getUserinfo(cookie);
      if (userInfo?.data?.finderUser?.finderUsername) {
        finderUserName = userInfo.data?.finderUser?.finderUsername;
      } else {
        re.code = userInfo?.errCode ?? -1;
        re.msg = userInfo?.errMsg ?? '获取用户信息失败';
      }
    }
    const tmpContentList = await getShipinhaoCommentContentListResponse(
      cookie,
      contentType === PubContentEnum.dynamic ? 12 : 13,
      finderUserName ?? '',
      cursor,
    );
    re.code = tmpContentList?.errCode ?? -1;
    re.msg = tmpContentList?.errMsg ?? '获取作品列表失败 ';
    if (tmpContentList?.data?.continueFlag) {
      re.nextPage = (cursor + 1).toString();
    }
    if (tmpContentList?.data?.list) {
      for (const item of tmpContentList.data?.list) {
        const id = item.exportId.toString();
        const newItem: ContentBackItem = {
          platform: Platforms.ShiPinHao,
          contentId: id,
          title: item.desc?.finderNewlifeDesc?.richTextTitle ?? item.desc?.description,
          timestamp: item.createTime * 1000,
          accountId: accountId,
          cover: item?.desc?.media[0]?.thumbUrl,
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

export const getShiPinHaoCommentByContent = async (
  cookie: string,
  contentId: string,
  commentId?: string,
  nextPage?: string,
  accountId?: string,
  finderUserName?: string,
): Promise<CommentListInfoResponse> => {
  const re: CommentListInfoResponse = { code: 0, msg: '', nextPage: '', dataList: [] };
  try {
    if (!finderUserName) {
      const userInfo = await getUserinfo(cookie);
      if (userInfo?.data?.finderUser?.finderUsername) {
        finderUserName = userInfo.data?.finderUser?.finderUsername;
      } else {
        re.code = userInfo?.errCode ?? -1;
        re.msg = userInfo?.errMsg ?? '获取用户信息失败';
      }
    }

    const sigCommentCursor = nextPage ?? '';

    re.code = 0;
    re.msg = undefined;
    const tmpComment = await getShipinhaoCommentListResponse(
      cookie,
      contentId,
      finderUserName ?? '',
      sigCommentCursor,
      commentId,
    );
    if (tmpComment?.errCode != 0) {
      re.code = tmpComment?.errCode ?? -1;
      re.msg = tmpComment?.errMsg ? tmpComment?.errMsg : '获取评论失败 ';
      return re;
    }
    if (tmpComment?.data?.comment?.length > 0) {
      if (tmpComment.data?.downContinueFlag) {
        re.nextPage = tmpComment.data?.lastBuff;
      }
      const backCommentList: Array<CommentBackItem> = [];
      for (const comment of tmpComment?.data?.comment) {
        const newItem: CommentBackItem = {
          platform: Platforms.ShiPinHao,
          accountId: accountId ?? '',
          contentId: contentId,
          commentId: comment.commentId,
          content: comment.commentContent,
          timestamp: parseInt(comment.commentCreatetime) * 1000,
          commentUserId: '', //视频号没有
          commentUserName: comment.commentNickname,
          commentUserAvatar: comment.commentHeadurl,
          isAuthor: comment.displayFlag === 131074,
        };
        if (commentId) {
          newItem.parentId = commentId;
          (newItem.replyToCommentId = comment.replyCommentId), (newItem.replyToUserId = '');
          newItem.replyToUserName = comment.replyNickname;
        } else {
          newItem.commentCount =
            comment.downContinueFlag === 1 ? comment.levelTwoComment.length + 1 : comment.levelTwoComment.length ?? 0;
          newItem.hasMore = comment.downContinueFlag === 1;
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
 * @param finderUserName 用户信息中的finderUserName
 * @param commentMsg 评论内容
 * @param contentId 评论所属的作品id
 * @param commentId 如果是回复评论时，评论的id
 * @param commentParentId 如果回复的评论是二级评论时，该评论的parentId
 */
export const addShipinhaoComment = async (
  cookie: string,
  finderUserName: string,
  commentMsg: string,
  contentId: string,
  commentId?: string,
  commentParentId?: string,
  proxy?: KuaiDaiLiProxy,
): Promise<SetCommentResultOutPut> => {
  const result: SetCommentResultOutPut = {
    code: 0,
    msg: '',
  };

  try {
    if (!finderUserName) {
      const userInfo = await getUserinfo(cookie);
      finderUserName = userInfo?.data?.finderUser?.finderUsername ?? '';
      if (!finderUserName) {
        result.msg = userInfo?.errMsg ?? `获取用户信息失败`;
        result.code = userInfo?.errCode ?? -1;
        return result;
      }
    }

    let webProxy: undefined | object = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userStatusResult = await addShipinhaoCommentResponse(
      cookie,
      contentId,
      commentMsg,
      finderUserName,
      commentId,
      commentParentId,
      webProxy,
    );

    result.code = userStatusResult?.errCode ?? -1;
    result.msg = userStatusResult?.errMsg ?? userStatusResult?.data?.baseResp?.errmsg;
    // if (!userStatusResult?.data?.commentId) {
    //   result.code = -1;
    //   result.msg = '评论失败';
    // }
    result.commentId = userStatusResult.data.commentId.toString();
    //result.raw = userStatusResult.data;
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
 * @param finderUserName 用户信息中的finderUserName
 * @param contentId 评论所属作品id
 * @param commentId 评论id
 */
export const delShipinhaoComment = async (
  cookie: string,
  finderUserName: string,
  contentId: string,
  commentId: string,
): Promise<SetCommentResultOutPut> => {
  const result: SetCommentResultOutPut = {
    code: 0,
    msg: '',
  };

  try {
    if (!finderUserName) {
      const userInfo = await getUserinfo(cookie);
      finderUserName = userInfo?.data?.finderUser?.finderUsername ?? '';
      if (!finderUserName) {
        result.msg = `参数finderUserName不能为空`;
        result.code = userInfo?.errCode ?? -1;
        return result;
      }
    }
    const userStatusResult = await delShipinhaoCommentResponse(cookie, contentId, finderUserName, commentId);

    result.code = userStatusResult?.errCode ?? -1;
    result.msg = userStatusResult?.errMsg ?? userStatusResult?.data?.baseResp?.errmsg;
    if (userStatusResult?.data?.baseResp?.errcode != 0 || result.code != 0) {
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
 * @param finderUserName 用户信息中的finderUserName
 * @param contentId 评论所属作品id
 * @param commentId 评论id
 */
export const setTopShipinhaoCommentTop = async (
  cookie: string,
  finderUserName: string,
  contentId: string,
  commentId: string,
): Promise<SetCommentResultOutPut> => {
  const result: SetCommentResultOutPut = {
    code: 0,
    msg: '',
  };

  try {
    if (!finderUserName) {
      const userInfo = await getUserinfo(cookie);
      finderUserName = userInfo?.data?.finderUser?.finderUsername ?? '';
      if (!finderUserName) {
        result.msg = `参数finderUserName不能为空`;
        result.code = userInfo?.errCode ?? -1;
        return result;
      }
    }
    const userStatusResult = await setTopShipinhaoCommentResponse(cookie, contentId, finderUserName, commentId);

    result.code = userStatusResult?.errCode ?? -1;
    result.msg = userStatusResult?.errMsg ?? userStatusResult?.data?.baseResp?.errmsg;
    if (userStatusResult?.data?.baseResp?.errcode != 0 || result.code != 0) {
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
 *
 * @param cookie
 * @param finderUserName
 * @param contentId
 * @param commentId
 * @param type 1:点赞  2:取消点赞
 */
export const digShipinhaoComment = async (
  cookie: string,
  finderUserName: string,
  contentId: string,
  commentId: string,
  type: 1 | 2 = 1,
): Promise<SetCommentResultOutPut> => {
  const result: SetCommentResultOutPut = {
    code: 0,
    msg: '',
  };

  try {
    if (!finderUserName) {
      const userInfo = await getUserinfo(cookie);
      finderUserName = userInfo?.data?.finderUser?.finderUsername ?? '';
      if (!finderUserName) {
        result.msg = `参数finderUserName不能为空`;
        result.code = userInfo?.errCode ?? -1;
        return result;
      }
    }
    const userStatusResult = await digShipinhaoCommentResponse(cookie, contentId, finderUserName, commentId, type);

    result.code = userStatusResult?.errCode ?? -1;
    result.msg = userStatusResult?.errMsg ?? userStatusResult?.data?.baseResp?.errmsg;
    if (userStatusResult?.data?.baseResp?.errcode != 0 || result.code != 0) {
      result.code = -1;
      result.msg = `${type === 1 ? '点赞' : '取消点赞'}评论失败 ${result.msg ?? ''}`;
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
