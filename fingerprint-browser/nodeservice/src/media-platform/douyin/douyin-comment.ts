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
  addDouyinContentCommentResponse,
  deleteDouyinContentCommentResponse,
  digDouyinContentCommentResponse,
  DouyinCommentContentItem,
  addDouyinContentCommentJanusResponse,
  DouyinNoticeCommentItem,
  getCommentContentListResponse,
  getDouyinLevel2ContentCommentListResponse,
  getDouyinLevel2ContentCommentListResponseV2,
  getDouyinNoticeCommentListResponse,
  getDouyinSignleContentCommentListResponse,
  getDouyinSignleContentCommentListResponseV2,
} from './douyin-comment.service';
import { Task } from '@/utils';
import { AxiosError } from 'axios';
import { errorCode } from '@/media-platform/errorCode';
import { getSdkToken } from '@/media-platform/douyin/douyin-base.service';
import { BaseResult } from '@/media-platform/baseResult';
import { CommentContentListInfoResponse, CommentListInfoResponse } from '@/media-platform';
import { createKuaiProxyAgent, IWebProxy, KuaiDaiLiProxy } from '@/media-platform/webproxy';

const appendDouyinCommentSecurityCookies = (cookie: string, localStorageStr?: string | object): string => {
  if (!localStorageStr) {
    return cookie;
  }

  let localStorageData: Record<string, unknown> = {};
  if (typeof localStorageStr === 'string') {
    localStorageData = JSON.parse(localStorageStr);
  } else if (typeof localStorageStr === 'object') {
    localStorageData = localStorageStr as Record<string, unknown>;
  }

  return `${cookie};security-sdk/s_sdk_sign_data_key/web_protect=${encodeURIComponent(
    localStorageData['security-sdk/s_sdk_sign_data_key/web_protect'] as string,
  )};security-sdk/s_sdk_crypt_sdk=${encodeURIComponent(localStorageData['security-sdk/s_sdk_crypt_sdk'] as string)}`;
};

const buildDouyinNoticeCommentItem = (
  item: DouyinNoticeCommentItem,
  accountId?: string,
): CommentBackItem | undefined => {
  const comment = item.comment?.comment;
  const awemeId = comment?.aweme_id?.toString() ?? '';
  if (!comment?.cid || !comment?.user?.uid || !awemeId) {
    return undefined;
  }

  const content =
    comment.content_type === 2 && comment.image_list?.length
      ? '[图片]'
      : comment.text?.toString()?.trim() || (comment.image_list?.length ? '[图片]' : '');

  if (!content) {
    return undefined;
  }

  return {
    platform: Platforms.DouYin,
    accountId: accountId ?? '',
    contentId: '',
    documentId: awemeId,
    // 明文评论 cid 随通知携带。下游凭它免去「按内容+昵称+时间」翻加密评论列表的模糊
    // 匹配，回复走 janus 明文端点（reply_to_comment_ids=cid）。创作者中心官方页面已
    // 全面使用该明文 id 体系（列表/回复均实测验证），此前置空纯属丢弃可用信息。
    commentId: comment.cid.toString(),
    content,
    timestamp: Number(item.create_time) * 1000,
    commentUserId: comment.user.uid.toString(),
    commentUserName: comment.user.nickname?.toString() ?? '',
    commentUserAvatar: comment.user.avatar_thumb?.url_list?.[0] ?? comment.user.avatar_larger?.url_list?.[0] ?? '',
    //raw: item,
    isAuthor: false,
  };
};

/**
 * 获取最新评论通知
 * @param cookie
 * @param accountId
 * @param options
 */
export const getDouYinLatestCommentNoticeList = async (
  cookie: string,
  accountId?: string,
  options?: {
    lastCreateTime?: number;
    isFirstFetch?: boolean;
    proxy?: IWebProxy;
    count?: number;
  },
): Promise<CommentListInfoResponse> => {
  const re: CommentListInfoResponse = { code: 0, msg: '', dataList: [] };

  try {
    let webProxy: object | undefined = undefined;
    if (options?.proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(options.proxy);
    }

    const count = options?.isFirstFetch ? 1 : options?.count ?? 10;
    const noticeResult = await getDouyinNoticeCommentListResponse(cookie, 0, count, 960, webProxy);
    re.code = noticeResult?.status_code ?? -1;
    re.msg = noticeResult?.status_code != 0 ? `获取最新评论通知失败 ${noticeResult?.status_msg ?? ''}` : '';
    re.nextPage = noticeResult?.max_time?.toString?.() ?? '';

    if (noticeResult?.status_code != 0) {
      return re;
    }

    if (!noticeResult?.notice_list_v2?.length) {
      re.data = {
        lastCreateTime: options?.lastCreateTime ?? 0,
      };
      return re;
    }

    const sortedList = [...noticeResult.notice_list_v2].sort((a, b) => Number(b.create_time) - Number(a.create_time));
    const filteredList = options?.isFirstFetch
      ? sortedList.slice(0, 1)
      : sortedList.filter((item) => Number(item.create_time) > Number(options?.lastCreateTime ?? 0));

    const dataList: Array<CommentBackItem> = [];
    for (const item of filteredList) {
      if (item.type !== 31) {
        continue;
      }
      const backItem = buildDouyinNoticeCommentItem(item, accountId);
      if (backItem) {
        dataList.push(backItem);
      }
    }

    re.dataList = dataList.sort((a, b) => a.timestamp - b.timestamp);
    re.data = {
      lastCreateTime: Math.max(
        Number(options?.lastCreateTime ?? 0),
        ...sortedList.map((item) => Number(item.create_time) || 0),
      ),
    };
  } catch (e) {
    console.error('获取最新评论通知异常', e);
    re.code = -2;
    re.msg = (e as Error)?.message ?? e?.toString();
  }

  return re;
};

/**
 * 获取评论
 * @param task
 * @param dataBackEvent
 * @param taskProgressEvent
 */
export const getDouYinComment = async (
  task: DataSyncTaskItem,
  dataBackEvent: EventEmitter,
  taskProgressEvent?: EventEmitter,
): Promise<BaseResult> => {
  const re: BaseResult = { code: 0, msg: '' };
  try {
    const now = new Date();
    const maxPage = task.maxPage ? task.maxPage : 5;
    const minDate = task.textMinDateTime ? task.textMinDateTime : new Date(new Date().setDate(now.getDate() - 7));
    const minDateTimeStamp = minDate.getTime();
    const contentMinDateTime = (
      task.contentMinDateTime ? task.contentMinDateTime : new Date(new Date().setDate(now.getDate() - 7))
    ).getTime();
    const contentList: Array<DouyinCommentContentItem> = [];
    let cursor = '';
    if (!task.contentList) {
      task.contentList = {};
    }
    //获取内容列表，确定要抓取评论的内容范围
    for (let i = 0; i < maxPage; i++) {
      const tmpContentList = await getCommentContentListResponse(task.accountCookieStr, cursor);
      re.code = tmpContentList?.status_code ?? -1;
      re.msg = tmpContentList?.status_code != 0 ? '获取评作品失败 ' + tmpContentList?.status_msg : '';
      if (tmpContentList?.has_more) {
        cursor = tmpContentList.cursor;
      }
      if (tmpContentList?.item_info_list?.length > 0) {
        let isEnd = false;
        const backList: Array<ContentBackItem> = [];
        for (const item of tmpContentList.item_info_list) {
          const id = item.item_id?.toString();
          if (task.contentList && task.contentList[id] && task.contentList[id].commentCount === item.comment_count) {
            //没变化的作品
            continue;
          }
          const dateStr = item.create_time
            .replace('发布于', '')
            .replace('年', '-')
            .replace('月', '-')
            .replace('日', '');
          const date = new Date(dateStr);
          const newItem = {
            platform: Platforms.DouYin,
            accountId: task.accountId,
            contentId: id,
            title: item.title,
            cover: item.cover_image_url,
            timestamp: date.getTime(),
            documentId: item.item_id_plain.toString(),
            commentCount: item.comment_count,
            addCommentCount: item.comment_count - (task.contentList[id]?.commentCount ?? item.comment_count),
            //raw: item,
          };
          if (newItem.timestamp < contentMinDateTime) {
            isEnd = true;
            break;
          }
          contentList.push(item);
          backList.push(newItem);
        }
        //每一页上报一次内容数据
        dataBackEvent.emit(SyncEventName.content_data_back, backList);
        if (isEnd) {
          break;
        }
      } else {
        break;
      }
      if (!tmpContentList?.has_more) {
        break;
      }
    }
    if (contentList.length <= 0) {
      return re;
    }

    taskProgressEvent?.emit(SyncEventName.content_progress, `0/${contentList.length}`);
    //开始遍历获取作品下的品论
    let n = 0;
    for (const item of contentList) {
      n++;
      //内容处理进度
      taskProgressEvent?.emit(SyncEventName.content_progress, `${n}/${contentList.length}`);
      let sigCommentCursor = 0;
      if (item.comment_count <= 0) {
        continue;
      }
      re.code = 0;
      re.msg = undefined;
      //一级评论
      for (let i = 0; i < task.maxPage; i++) {
        const tmpComment = await getDouyinSignleContentCommentListResponse(
          task.accountCookieStr,
          item.item_id,
          sigCommentCursor,
        );
        if (tmpComment?.status_code != 0) {
          re.code = tmpComment?.status_code ?? -1;
          re.msg = tmpComment?.status_code != 0 ? '获取评作品失败 ' + tmpComment?.status_msg : '';
          return re;
        }
        await Task.Delay(1000);
        let isCmtEnd = false;
        if (tmpComment?.comment_info_list?.length > 0) {
          if (tmpComment.has_more) {
            sigCommentCursor = tmpComment.cursor;
          }
          const backCommentList: Array<CommentBackItem> = [];
          for (const comment of tmpComment?.comment_info_list) {
            const newItem = {
              platform: Platforms.DouYin,
              accountId: task.accountId,
              contentId: item.item_id.toString(),
              commentId: comment.comment_id.toString(),
              content: comment.text,
              timestamp: comment.create_time * 1000,
              commentCount: Number(comment.reply_count) ?? 0,
              commentUserId: comment.user_info.user_id.toString(),
              commentUserName: comment.user_info.screen_name.toString(),
              commentUserAvatar: comment.user_info.avatar_url,
              raw: {}, //comment,
              isAuthor: item?.is_author ?? item.label_text === '作者',
            };
            if (newItem.timestamp < minDateTimeStamp) {
              isCmtEnd = true;
              break;
            }
            backCommentList.push(newItem);
          }
          //每一页评论上报一次
          dataBackEvent.emit(SyncEventName.comment_data_back, backCommentList);
          //获取评论下的二级评论和回复
          for (const comment of tmpComment.comment_info_list) {
            if (parseInt(comment.reply_count) > 0) {
              let pCursor = 0;
              for (let i = 0; i < task.maxPage; i++) {
                const tmpSubComment = await getDouyinLevel2ContentCommentListResponse(
                  task.accountCookieStr,
                  comment.comment_id,
                  pCursor,
                );
                if (tmpSubComment?.has_more) {
                  pCursor = tmpSubComment.cursor;
                }
                if (tmpSubComment?.comment_info_list?.length > 0) {
                  let endPage = false;
                  const backCommentList: Array<CommentBackItem> = [];
                  for (const subComment of tmpSubComment.comment_info_list) {
                    const newItem = {
                      platform: Platforms.DouYin,
                      accountId: task.accountId,
                      contentId: item.item_id.toString(),
                      commentId: subComment.comment_id.toString(),
                      content: subComment.text,
                      timestamp: subComment.create_time * 1000,
                      commentUserId: subComment.user_info?.user_id?.toString(),
                      commentUserName: subComment.user_info?.screen_name?.toString(),
                      commentUserAvatar: subComment.user_info?.avatar_url,
                      parentId: comment.comment_id.toString(),
                      replyToUserId: subComment.reply_to_user_info?.user_id?.toString(),
                      replyToUserName: subComment.reply_to_user_info?.screen_name?.toString(),
                      raw: {}, //subComment,
                      isAuthor: item.is_author ?? item.label_text === '作者',
                    };
                    if (newItem.timestamp < minDateTimeStamp) {
                      endPage = true;
                      break;
                    }
                    backCommentList.push(newItem);
                  }
                  if (backCommentList.length > 0) {
                    dataBackEvent.emit(SyncEventName.comment_data_back, backCommentList);
                  }
                  if (tmpSubComment?.has_more && !endPage) {
                    pCursor = tmpSubComment.cursor;
                  } else {
                    break;
                  }
                } else {
                  break;
                }
                if (!tmpSubComment?.has_more) {
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
        if (!tmpComment?.has_more) {
          break;
        }
      }
    }
  } catch (e) {
    console.error('获取评论数据异常', e);
    re.code = -2;
    re.msg = (e as Error)?.message ?? e?.toString();
  }
  return re;
};

export const monitDouYinCommentContent = async (
  task: DataSyncTaskItem,
  dataBackEvent: EventEmitter,
): Promise<BaseResult> => {
  const re: BaseResult = { code: 0, msg: '' };
  try {
    const now = new Date();
    const maxPage = task.maxPage ? task.maxPage : 5;
    const contentMinDateTime = (
      task.contentMinDateTime ? task.contentMinDateTime : new Date(new Date().setDate(now.getDate() - 7))
    ).getTime();
    const contentList: Array<DouyinCommentContentItem> = [];
    let cursor = '';
    if (!task.contentList) {
      task.contentList = {};
    }
    //获取内容列表，确定要抓取评论的内容范围
    for (let i = 0; i < maxPage; i++) {
      const tmpContentList = await getCommentContentListResponse(task.accountCookieStr, cursor);
      re.code = tmpContentList?.status_code ?? -1;
      re.msg = tmpContentList?.status_code != 0 ? '获取评作品失败 ' + tmpContentList?.status_msg : '';
      if (tmpContentList?.has_more) {
        cursor = tmpContentList.cursor;
      }
      if (tmpContentList?.item_info_list?.length > 0) {
        let isEnd = false;
        const backList: Array<ContentBackItem> = [];
        for (const item of tmpContentList.item_info_list) {
          const id = item.item_id.toString();
          if (task.contentList && task.contentList[id] && task.contentList[id].commentCount === item.comment_count) {
            //没变化的作品
            continue;
          }
          const dateStr = item.create_time
            .replace('发布于', '')
            .replace('年', '-')
            .replace('月', '-')
            .replace('日', '');
          const date = new Date(dateStr);
          contentList.push(item);
          const newItem = {
            platform: Platforms.DouYin,
            accountId: task.accountId,
            contentId: item.item_id.toString(),
            title: item.title,
            cover: item.cover_image_url,
            timestamp: date.getTime(),
            documentId: item.item_id_plain.toString(),
            commentCount: item.comment_count,
            addCommentCount: item.comment_count - (task.contentList[id]?.commentCount ?? item.comment_count),
            //raw: item,
          };
          if (newItem.timestamp < contentMinDateTime) {
            isEnd = true;
            break;
          }
          backList.push(newItem);
        }
        //每一页上报一次内容数据
        dataBackEvent.emit(SyncEventName.content_data_back, backList);
        await Task.Delay(1000);
        if (isEnd) {
          break;
        }
      } else {
        break;
      }
      if (!tmpContentList?.has_more) {
        break;
      }
    }
  } catch (e) {
    console.error('获取评论作品数据异常', e);
    re.code = -2;
    re.msg = (e as Error)?.message ?? e?.toString();
  }
  return re;
};

export const getDouYinCommentContent = async (
  cookie: string,
  nextPage?: string,
  accountId?: string,
): Promise<CommentContentListInfoResponse> => {
  const re: CommentContentListInfoResponse = { code: 0, msg: '', dataList: [] };
  try {
    const cursor = nextPage ? nextPage : '';
    const tmpContentList = await getCommentContentListResponse(cookie, cursor);
    re.code = tmpContentList?.status_code ?? -1;
    re.msg = tmpContentList?.status_code != 0 ? '获取作品列表失败 ' + tmpContentList?.status_msg : '';
    if (tmpContentList?.has_more) {
      re.nextPage = tmpContentList.cursor;
    }
    if (tmpContentList?.item_info_list?.length > 0) {
      for (const item of tmpContentList.item_info_list) {
        const id = item.item_id.toString();

        const dateStr = item.create_time.replace('发布于', '').replace('年', '-').replace('月', '-').replace('日', '');
        const date = new Date(dateStr);
        const newItem: ContentBackItem = {
          platform: Platforms.DouYin,
          accountId: accountId,
          contentId: id,
          title: item.title,
          cover: item.cover_image_url,
          timestamp: date.getTime(),
          documentId: item.item_id_plain.toString(),
          commentCount: item.comment_count,
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
export const getDouYinCommentByContent = async (
  cookie: string,
  contentId: string,
  commentId?: string,
  nextPage?: string,
  accountId?: string,
  documentId?: string,
): Promise<CommentListInfoResponse> => {
  const re: CommentListInfoResponse = { code: 0, msg: '', nextPage: '', dataList: [] };
  try {
    //创作者中心取消，先屏蔽，不知道用途不要修改
    documentId = undefined;

    // 调用方携带明文 documentId(aweme_id) 时走明文 V2 列表（返回明文 cid，与通知推送、
    // janus 明文回复同一 id 体系）。二级评论查询需要明文 cid，因此 commentId 为加密串
    // （@ 开头等非纯数字）时不进 V2，回退 V1，避免拿加密 id 查明文接口。
    if (documentId && (!commentId || /^\d{5,}$/.test(commentId))) {
      return getDouYinCommentByContent_V2(cookie, contentId, commentId, nextPage, accountId, documentId);
    }
    const sigCommentCursor = nextPage ? Number(nextPage) ?? 0 : 0;

    re.code = 0;
    re.msg = undefined;
    if (!commentId) {
      const tmpComment = await getDouyinSignleContentCommentListResponse(cookie, contentId, sigCommentCursor);
      if (tmpComment?.status_code != 0) {
        re.code = tmpComment?.status_code ?? -1;
        re.msg = tmpComment?.status_code != 0 ? '获取评论失败 ' + tmpComment?.status_msg : '';
        return re;
      }
      if (tmpComment?.comment_info_list?.length > 0) {
        if (tmpComment.has_more) {
          re.nextPage = tmpComment.cursor?.toString();
        }
        const backCommentList: Array<CommentBackItem> = [];
        for (const comment of tmpComment?.comment_info_list) {
          const newItem = {
            platform: Platforms.DouYin,
            accountId: accountId ?? '',
            contentId: contentId,
            commentId: comment.comment_id.toString(),
            content: comment.text,
            timestamp: comment.create_time * 1000,
            commentCount: Number(comment.reply_count) ?? 0,
            commentUserId: comment.user_info.user_id.toString(),
            commentUserName: comment.user_info.screen_name.toString(),
            commentUserAvatar: comment.user_info.avatar_url,
            raw: {}, //comment,
            isAuthor: comment?.is_author ?? comment?.label_text === '作者',
          };
          backCommentList.push(newItem);
        }
        re.dataList = backCommentList;
        return re;
      }
      return re;
    } else {
      const tmpSubComment = await getDouyinLevel2ContentCommentListResponse(cookie, commentId, sigCommentCursor);
      if (tmpSubComment?.status_code != 0) {
        re.code = tmpSubComment?.status_code ?? -1;
        re.msg = tmpSubComment?.status_code != 0 ? '获取评论失败 ' + tmpSubComment?.status_msg : '';
        return re;
      }
      if (tmpSubComment?.has_more) {
        re.nextPage = tmpSubComment.cursor?.toString();
      }
      if (tmpSubComment?.comment_info_list?.length > 0) {
        const backCommentList: Array<CommentBackItem> = [];
        for (const subComment of tmpSubComment.comment_info_list) {
          const newItem = {
            platform: Platforms.DouYin,
            accountId: accountId ?? '',
            contentId: contentId,
            commentId: subComment.comment_id.toString(),
            content: subComment.text,
            timestamp: subComment.create_time * 1000,
            commentUserId: subComment.user_info?.user_id?.toString(),
            commentUserName: subComment.user_info?.screen_name?.toString(),
            commentUserAvatar: subComment.user_info?.avatar_url,
            parentId: commentId,
            replyToUserId: subComment.reply_to_user_info?.user_id?.toString(),
            replyToUserName: subComment.reply_to_user_info?.screen_name?.toString(),
            raw: {}, //subComment,
            isAuthor: subComment?.is_author ?? subComment?.label_text === '作者',
          };
          backCommentList.push(newItem);
        }
        re.dataList = backCommentList;
      }
      return re;
    }
  } catch (e) {
    console.error('获取评论数据异常', e);
    re.code = -2;
    re.msg = (e as Error)?.message ?? e?.toString();
  }
  return re;
};

export const getDouYinCommentByContent_V2 = async (
  cookie: string,
  contentId: string,
  commentId?: string,
  nextPage?: string,
  accountId?: string,
  documentId?: string,
): Promise<CommentListInfoResponse> => {
  const re: CommentListInfoResponse = { code: 0, msg: '', nextPage: '', dataList: [] };
  try {
    const sigCommentCursor = nextPage ? Number(nextPage) ?? 0 : 0;

    re.code = 0;
    re.msg = undefined;
    if (!documentId) {
      re.code = 400;
      re.msg = 'documentId不能为空';
      return re;
    }
    if (!commentId) {
      const tmpComment = await getDouyinSignleContentCommentListResponseV2(cookie, documentId ?? '', sigCommentCursor);
      if (tmpComment?.status_code != 0) {
        re.code = tmpComment?.status_code ?? -1;
        re.msg = tmpComment?.status_code != 0 ? '获取评论失败 ' + tmpComment?.status_msg : '';
        return re;
      }
      if (tmpComment?.comments?.length > 0) {
        if (tmpComment.has_more) {
          re.nextPage = tmpComment.cursor?.toString();
        }
        const backCommentList: Array<CommentBackItem> = [];
        for (const comment of tmpComment?.comments) {
          const newItem = {
            platform: Platforms.DouYin,
            accountId: accountId ?? '',
            contentId: contentId,
            commentId: comment.cid.toString(),
            content: comment.text,
            timestamp: comment.create_time * 1000,
            commentCount: Number(comment.item_comment_total) ?? 0,
            commentUserId: comment.user?.uid?.toString(),
            commentUserName: comment.user?.nickname?.toString(),
            commentUserAvatar:
              comment.user.avatar_thumb && comment.user.avatar_thumb.url_list
                ? comment.user.avatar_thumb.url_list[0]
                : '',
            raw: {}, //comment,
            isAuthor: comment?.label_text === '作者',
          };
          backCommentList.push(newItem);
        }
        re.dataList = backCommentList;
        return re;
      }
      return re;
    } else {
      const tmpSubComment = await getDouyinLevel2ContentCommentListResponseV2(
        cookie,
        commentId,
        documentId ?? '',
        sigCommentCursor,
      );
      if (tmpSubComment?.status_code != 0) {
        re.code = tmpSubComment?.status_code ?? -1;
        re.msg = tmpSubComment?.status_code != 0 ? '获取评论失败 ' + tmpSubComment?.status_msg : '';
        return re;
      }
      if (tmpSubComment?.has_more) {
        re.nextPage = tmpSubComment.cursor?.toString();
      }
      if (tmpSubComment?.comments?.length > 0) {
        const backCommentList: Array<CommentBackItem> = [];
        for (const subComment of tmpSubComment.comments) {
          const newItem = {
            platform: Platforms.DouYin,
            accountId: accountId ?? '',
            contentId: contentId,
            commentId: subComment.cid.toString(),
            content: subComment.text,
            timestamp: subComment.create_time * 1000,
            commentUserId: subComment.user?.uid?.toString(),
            commentUserName: subComment.user?.nickname?.toString(),
            commentUserAvatar:
              subComment.user.avatar_thumb && subComment.user.avatar_thumb.url_list
                ? subComment.user.avatar_thumb.url_list[0]
                : '',
            parentId: commentId,
            raw: {}, //subComment,
            isAuthor: subComment?.label_text === '作者',
          };
          backCommentList.push(newItem);
        }
        re.dataList = backCommentList;
      }
      return re;
    }
  } catch (e) {
    console.error('获取评论数据异常', e);
    re.code = -2;
    re.msg = (e as Error)?.message ?? e?.toString();
  }
  return re;
};

/**
 * 添加/回复评论
 * @param cookie
 * @param sdkToken 来自getSdkToken接口，这个值在同一一次登录可反复使用
 * @param commentMsg  评论内容,表情字符串
 * @param contentId 作品加密id，在获取评论是返回的作品数据中的作品id
 * @param commentId 评论id，当回复某个评论时需要
 * @param proxy
 * @param localStorageStr
 */
export const addDouYinComment = async (
  cookie: string,
  sdkToken: string,
  commentMsg: string,
  contentId: string,
  commentId?: string,
  proxy?: KuaiDaiLiProxy,
  localStorageStr?: string | object,
  documentId?: string,
): Promise<SetCommentResultOutPut> => {
  const result: SetCommentResultOutPut = {
    code: 0,
    msg: '',
  };

  try {
    if (!localStorageStr) {
      result.code = 400;
      result.msg = '账号信息缺失，请重新授权登录';
      return result;
    }
    if (!sdkToken) {
      sdkToken = await getSdkToken(cookie);
    }
    let webProxy: object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    cookie = appendDouyinCommentSecurityCookies(cookie, localStorageStr);

    // 明文 cid 回复（评论 id 来自通知推送的明文体系）走 janus 端点；V1 回复端点只认
    // 加密 comment_id，两套 id 互不通用，绝不能把明文 id 塞进 V1。加密 id（@ 开头）
    // 与主评论保持原 V1 路径不变。
    const isPlainCommentId = !!commentId && /^\d{5,}$/.test(commentId);
    if (isPlainCommentId) {
      if (!documentId || !/^\d{5,}$/.test(documentId)) {
        result.code = 400;
        result.msg = '明文评论回复缺少作品明文id（documentId）';
        return result;
      }
      const janusResult = await addDouyinContentCommentJanusResponse(
        cookie,
        sdkToken,
        commentMsg,
        documentId,
        commentId,
        webProxy,
      );
      result.code = janusResult?.status_code ?? -1;
      result.msg = janusResult?.status_msg ?? '';
      // multi_publish 实测把新回复放在 comments 数组里返回；其余字段名为兜底
      result.commentId = (
        janusResult?.comments?.[0]?.cid ??
        janusResult?.comment?.cid ??
        janusResult?.comment_info?.cid ??
        janusResult?.comment_info?.comment_id ??
        ''
      ).toString();
      result.raw = janusResult?.comments?.[0] ?? janusResult?.comment ?? janusResult?.comment_info;
      return result;
    }

    const userStatusResult = await addDouyinContentCommentResponse(
      cookie,
      sdkToken,
      commentMsg,
      contentId,
      commentId ?? '',
      webProxy,
    );

    result.code = userStatusResult?.status_code ?? -1;
    result.msg = userStatusResult.status_msg ?? '';
    result.commentId = userStatusResult?.comment_info?.comment_id?.toString();
    result.raw = userStatusResult?.comment_info;
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
 * @param sdkToken 来自getSdkToken接口，这个值在同一一次登录可反复使用
 * @param commentId 评论id
 * @param localStorageStr 账号web中的localStorage
 */
export const delDouYinComment = async (
  cookie: string,
  sdkToken: string,
  commentId: string,
  localStorageStr?: string | object,
): Promise<SetCommentResultOutPut> => {
  const result: SetCommentResultOutPut = {
    code: 0,
    msg: '',
  };

  try {
    if (!sdkToken) {
      sdkToken = await getSdkToken(cookie);
    }
    cookie = appendDouyinCommentSecurityCookies(cookie, localStorageStr);
    const userStatusResult = await deleteDouyinContentCommentResponse(cookie, sdkToken, commentId);

    result.code = userStatusResult?.status_code ?? -1;
    result.msg = userStatusResult?.status_msg ?? '';
    if (result?.code !== 0) {
      result.code = result?.code ?? -1;
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
 * @param sdkToken 来自getSdkToken接口，这个值在同一一次登录可反复使用
 * @param commentId 评论id
 * @param type 1:点赞 2:点踩 3:取消点赞 4:取消点踩
 * @param localStorageStr 账号web中的localStorage
 */
export const digDouYinComment = async (
  cookie: string,
  sdkToken: string,
  commentId: string,
  type: 1 | 2 | 3 | 4,
  localStorageStr?: string | object,
): Promise<SetCommentResultOutPut> => {
  const result: SetCommentResultOutPut = {
    code: 0,
    msg: '',
  };

  try {
    if (!sdkToken) {
      sdkToken = await getSdkToken(cookie);
    }
    cookie = appendDouyinCommentSecurityCookies(cookie, localStorageStr);
    const userStatusResult = await digDouyinContentCommentResponse(cookie, sdkToken, commentId, type);

    result.code = userStatusResult?.status_code ?? -1;
    result.msg = userStatusResult.status_msg ?? '';
    if (result?.code !== 0) {
      result.code = -1;
      result.msg =
        type % 2 == 1
          ? `${type === 3 ? '取消' : ''}点赞评论失败${userStatusResult?.status_msg}`
          : `${type === 4 ? '取消' : ''}点踩评论失败`;
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
