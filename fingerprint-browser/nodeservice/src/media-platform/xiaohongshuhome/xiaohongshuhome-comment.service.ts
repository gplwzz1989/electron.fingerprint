import { IWebProxy } from '@/media-platform/webproxy';
import { requestXiaohongshuhome, XiaohongshuhomeApiResponse } from './xiaohongshuhome-http.service';

export interface XiaohongshuhomeNote {
  note_id: string;
  title?: string;
  display_title?: string;
  type?: string;
  cover?: { url?: string; url_pre?: string } | null;
  xsec_token: string;
  time?: number | string;
  create_time?: number | string;
  last_update_time?: number | string;
  interact_info?: {
    liked_count?: string | number;
    collected_count?: string | number;
    comment_count?: string | number;
    shared_count?: string | number;
  };
  user?: { user_id?: string; nickname?: string; avatar?: string };
  [key: string]: any;
}

export interface XiaohongshuhomeComment {
  id: string;
  content: string;
  create_time: number | string;
  like_count?: number | string;
  sub_comment_count?: number | string;
  sub_comment_has_more?: boolean;
  sub_comment_cursor?: string;
  target_comment?: {
    id?: string;
    user_info?: {
      user_id?: string;
      nickname?: string;
      avatar?: string;
      image?: string;
    };
  };
  user_info?: {
    user_id?: string;
    userid?: string;
    nickname?: string;
    avatar?: string;
    image?: string;
  };
  [key: string]: any;
}

export interface XiaohongshuhomeCommentNotice {
  id: string;
  type?: string;
  title?: string;
  time?: number | string;
  user_info?: {
    userid?: string;
    user_id?: string;
    nickname?: string;
    image?: string;
    avatar?: string;
  };
  comment_info?: {
    id?: string;
    content?: string;
    like_count?: number | string;
    target_comment_id?: string;
  };
  item_info?: {
    id?: string;
    title?: string;
    content?: string;
    type?: string;
    xsec_token?: string;
    link?: string;
    image?: string;
  };
  [key: string]: any;
}

export interface XiaohongshuhomeNoteListData {
  notes?: XiaohongshuhomeNote[];
  cursor?: string;
  has_more?: boolean;
  [key: string]: any;
}

export interface XiaohongshuhomeCommentPageData {
  comments?: XiaohongshuhomeComment[];
  cursor?: string;
  has_more?: boolean;
  [key: string]: any;
}

export interface XiaohongshuhomeCommentNoticeData {
  message_list?: XiaohongshuhomeCommentNotice[];
  cursor?: string | number;
  strCursor?: string;
  has_more?: boolean;
  [key: string]: any;
}

export const getXiaohongshuhomeNoteList = async (
  cookie: string,
  userId: string,
  cursor: string = '',
  num: number = 30,
  proxy?: IWebProxy,
): Promise<XiaohongshuhomeApiResponse<XiaohongshuhomeNoteListData>> => {
  const path =
    `/api/sns/web/v1/user_posted?num=${num}&cursor=${encodeURIComponent(cursor)}` +
    `&user_id=${encodeURIComponent(userId)}&image_formats=jpg,webp,avif&xsec_token=&xsec_source=`;
  return requestXiaohongshuhome<XiaohongshuhomeNoteListData>(cookie, path, 'GET', undefined, proxy);
};

export const getXiaohongshuhomeCommentPage = async (
  cookie: string,
  noteId: string,
  xsecToken: string,
  cursor: string = '',
  proxy?: IWebProxy,
): Promise<XiaohongshuhomeApiResponse<XiaohongshuhomeCommentPageData>> => {
  const path =
    `/api/sns/web/v2/comment/page?note_id=${encodeURIComponent(noteId)}` +
    `&cursor=${encodeURIComponent(cursor)}&top_comment_id=&image_formats=jpg,webp,avif` +
    `&xsec_token=${encodeURIComponent(xsecToken)}`;
  return requestXiaohongshuhome<XiaohongshuhomeCommentPageData>(cookie, path, 'GET', undefined, proxy);
};

export const getXiaohongshuhomeSubCommentPage = async (
  cookie: string,
  noteId: string,
  rootCommentId: string,
  xsecToken: string,
  cursor: string = '',
  num: number = 10,
  proxy?: IWebProxy,
): Promise<XiaohongshuhomeApiResponse<XiaohongshuhomeCommentPageData>> => {
  const path =
    `/api/sns/web/v2/comment/sub/page?note_id=${encodeURIComponent(noteId)}` +
    `&root_comment_id=${encodeURIComponent(rootCommentId)}&num=${num}` +
    `&cursor=${encodeURIComponent(cursor)}&image_formats=jpg,webp,avif` +
    `&xsec_token=${encodeURIComponent(xsecToken)}`;
  return requestXiaohongshuhome<XiaohongshuhomeCommentPageData>(cookie, path, 'GET', undefined, proxy);
};

export const postXiaohongshuhomeComment = async (
  cookie: string,
  noteId: string,
  content: string,
  targetCommentId?: string,
  proxy?: IWebProxy,
): Promise<XiaohongshuhomeApiResponse<{ comment?: XiaohongshuhomeComment }>> => {
  const body: Record<string, any> = { note_id: noteId, content, at_users: [] };
  if (targetCommentId) {
    body.target_comment_id = targetCommentId;
  }
  return requestXiaohongshuhome<{ comment?: XiaohongshuhomeComment }>(
    cookie,
    '/api/sns/web/v1/comment/post',
    'POST',
    body,
    proxy,
  );
};

export const likeXiaohongshuhomeComment = async (
  cookie: string,
  commentId: string,
  noteId: string,
  proxy?: IWebProxy,
): Promise<XiaohongshuhomeApiResponse> => {
  return requestXiaohongshuhome(
    cookie,
    '/api/sns/web/v1/comment/like',
    'POST',
    {
      comment_id: commentId,
      note_id: noteId,
      like_type: 1,
    },
    proxy,
  );
};

export const deleteXiaohongshuhomeComment = async (
  cookie: string,
  commentId: string,
  noteId: string,
  proxy?: IWebProxy,
): Promise<XiaohongshuhomeApiResponse> => {
  return requestXiaohongshuhome(
    cookie,
    '/api/sns/web/v1/comment/delete',
    'POST',
    {
      comment_id: commentId,
      note_id: noteId,
    },
    proxy,
  );
};

export const getXiaohongshuhomeCommentNoticePage = async (
  cookie: string,
  cursor: string = '',
  num: number = 20,
  proxy?: IWebProxy,
): Promise<XiaohongshuhomeApiResponse<XiaohongshuhomeCommentNoticeData>> => {
  const path = `/api/sns/web/v1/you/mentions?num=${num}&cursor=${encodeURIComponent(cursor)}`;
  return requestXiaohongshuhome<XiaohongshuhomeCommentNoticeData>(cookie, path, 'GET', undefined, proxy);
};
