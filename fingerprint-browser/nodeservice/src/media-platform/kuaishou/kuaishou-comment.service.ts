import { $http } from '@/http';
import { Guid } from '@/utils';
import { getSign, regex } from './kuaishou-base.service';

export const getCommentListResponse = async (
  cookie: string,
  photoId: string,
  cursor: number,
): Promise<CommentResponse> => {
  const headers = {
    cookie: cookie,
    'X-Requested-With': 'XMLHttpRequest',
    Referer: 'https://cp.kuaishou.com/article/comment',
    returnSetRootDomainLoginUrl: true,
    'Content-Type': 'application/json;charset=UTF-8',
  };

  const match = regex.exec(cookie);
  const webapiId = match ? match[1] : Guid.NewGuid().toString().replace(/-/g, '');

  const postDataOb = {
    photoId: photoId,
    sortType: '',
    selectedComment: false,
    'kuaishou.web.cp.api_ph': webapiId,
  };
  if (cursor) {
    postDataOb['pcursor'] = cursor;
  }
  const postData = JSON.stringify(postDataOb);
  const sign = await getSign(postData);
  const url = `https://cp.kuaishou.com/rest/cp/creator/comment/commentList?__NS_sig3=${sign}`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export const getSubCommentListResponse = async (
  cookie: string,
  photoId: string,
  commentId: number,
  cursor: number,
): Promise<CommentResponse> => {
  const headers = {
    cookie: cookie,
    'X-Requested-With': 'XMLHttpRequest',
    Referer: 'https://cp.kuaishou.com/article/comment',
    returnSetRootDomainLoginUrl: true,
    'Content-Type': 'application/json;charset=UTF-8',
  };

  const match = regex.exec(cookie);
  const webapiId = match ? match[1] : Guid.NewGuid().toString().replace(/-/g, '');

  const postDataOb = {
    commentId: commentId,
    photoId: photoId,
    'kuaishou.web.cp.api_ph': webapiId,
  };
  if (cursor) {
    postDataOb['pcursor'] = cursor;
  }

  const postData = JSON.stringify(postDataOb);
  const sign = await getSign(postData);
  const url = `https://cp.kuaishou.com/rest/cp/creator/comment/subCommentList?__NS_sig3=${sign}`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface CommentResponse {
  result: number;
  message:string;
  data: {
    list: Array<CommentItem>;
    pcursor: number;
  };
}

export interface CommentItem {
  photoId: number; // 147771351301;
  authorId: number; // 47445000;
  headurl: string; //'https://p66-pro.a.yximgs.com/uhead/AB/2022/10/31/11/BMjAyMjEwMzExMTM2NDhfNDc0NDUwMDBfMV9oZDQ0NV8yNTE=_s.jpg';
  /**
   * 评论人昵称
   */
  authorName: string;
  /**
   * 评论人id
   */
  commentId: number;
  /**
   * string
   */
  content: string;
  /**
   * 回复目标用户id
   */
  replyTo: number;

  /**
   * 回复目标用户昵称
   */
  replyToUserName: string;

  replyToCommentId:number;
  /**
   * 13位时间戳
   */
  timestamp: number;
  /**
   * 点赞数
   */
  likedCount: number;

  /**
   * 二级评论数数量
   */
  subCommentCount: number;
  /**
   * 下一级评论
   */
  subComments: Array<CommentItem>;
}

export const getCommentContentListResponse = async (
  cookie: string,
  cursor: number,
): Promise<CommentContentResponse> => {
  const headers = {
    cookie: cookie,
    'X-Requested-With': 'XMLHttpRequest',
    Referer: 'https://cp.kuaishou.com/article/comment',
    returnSetRootDomainLoginUrl: true,
    'Content-Type': 'application/json;charset=UTF-8',
  };

  const match = regex.exec(cookie);
  const webapiId = match ? match[1] : Guid.NewGuid().toString().replace(/-/g, '');

  const postDataOb = { 'kuaishou.web.cp.api_ph': webapiId };
  if (cursor) {
    postDataOb['pcursor'] = cursor;
  }

  const postData = JSON.stringify(postDataOb);
  const sign = await getSign(postData);
  const url = `https://cp.kuaishou.com/rest/cp/creator/comment/photoList?__NS_sig3=${sign}`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface CommentContentResponse {
  data: {
    /**
     * 下一页参数
     */
    pcursor: number;
    /**
     * 作品列表
     */
    photoList: Array<CommentContent>;
    totalCount: number;
  };
  /**
   * 1:正常
   */
  result:number;
  message:string;
}

export interface CommentContent {
  /**
   * 评论数
   */
  commentCount: number;
  /**
   * 作品id
   */
  photoId: string;
  /**
   * 标题
   *
   */
  title: string;
  /**
   * 发布时间
   */
  uploadTime: number;
  cover:string;
}

/**
 *
 * @param cookie
 * @param photoId
 * @param commentMsg
 * @param toCommentId
 * @param toCommentUserId
 */
export const addCommentResponse = async (
  cookie: string,
  photoId: string,
  commentMsg: string,
  toCommentId?: number,
  toCommentUserId?: number,
): Promise<AddCommentResponse> => {
  const headers = {
    cookie: cookie,
    'X-Requested-With': 'XMLHttpRequest',
    Referer: 'https://cp.kuaishou.com/article/comment',
    returnSetRootDomainLoginUrl: true,
    'Content-Type': 'application/json;charset=UTF-8',
  };

  const match = regex.exec(cookie);
  const webapiId = match ? match[1] : Guid.NewGuid().toString().replace(/-/g, '');

  const postDataOb = { content: commentMsg, photoId: photoId, 'kuaishou.web.cp.api_ph': webapiId };
  if (toCommentId || toCommentUserId) {
    postDataOb['replyToCommentId'] = toCommentId;
    postDataOb['replyTo'] = toCommentUserId;
  }

  const postData = JSON.stringify(postDataOb);
  const sign = await getSign(postData);
  const url = `https://cp.kuaishou.com/rest/cp/creator/comment/add?__NS_sig3=${sign}`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface AddCommentResponse {
  result: number;
  currentTime: number;
  data: {
    /**
     * 成功评论后的评论Id
     */
    commentId: number;
  };
  message: string;
}

export const delCommentResponse = async (
  cookie: string,
  photoId: string,
  commentId: number,
): Promise<SetCommentResponse> => {
  const headers = {
    cookie: cookie,
    'X-Requested-With': 'XMLHttpRequest',
    Referer: 'https://cp.kuaishou.com/article/comment',
    returnSetRootDomainLoginUrl: true,
    'Content-Type': 'application/json;charset=UTF-8',
  };

  const match = regex.exec(cookie);
  const webapiId = match ? match[1] : Guid.NewGuid().toString().replace(/-/g, '');

  const postDataOb = { commentIdList: [commentId], photoId: photoId, 'kuaishou.web.cp.api_ph': webapiId };

  const postData = JSON.stringify(postDataOb);
  const sign = await getSign(postData);
  const url = `https://cp.kuaishou.com/rest/cp/creator/comment/delete?__NS_sig3=${sign}`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export const setCommentTopResponse = async (
  cookie: string,
  photoId: string,
  commentId: number,
): Promise<SetCommentResponse> => {
  const headers = {
    cookie: cookie,
    'X-Requested-With': 'XMLHttpRequest',
    Referer: 'https://cp.kuaishou.com/article/comment',
    returnSetRootDomainLoginUrl: true,
    'Content-Type': 'application/json;charset=UTF-8',
  };

  const match = regex.exec(cookie);
  const webapiId = match ? match[1] : Guid.NewGuid().toString().replace(/-/g, '');

  const postDataOb = {
    commentId: commentId,
    photoId: photoId,
    'kuaishou.web.cp.api_ph': webapiId,
  };

  const postData = JSON.stringify(postDataOb);
  const sign = await getSign(postData);
  const url = `https://cp.kuaishou.com/rest/cp/creator/comment/setTopComment?__NS_sig3=${sign}`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export const cancelCommentTopResponse = async (
  cookie: string,
  photoId: string,
  commentId: number,
): Promise<SetCommentResponse> => {
  const headers = {
    cookie: cookie,
    'X-Requested-With': 'XMLHttpRequest',
    Referer: 'https://cp.kuaishou.com/article/comment',
    returnSetRootDomainLoginUrl: true,
    'Content-Type': 'application/json;charset=UTF-8',
  };

  const match = regex.exec(cookie);
  const webapiId = match ? match[1] : Guid.NewGuid().toString().replace(/-/g, '');

  const postDataOb = {
    commentId: commentId,
    photoId: photoId,
    'kuaishou.web.cp.api_ph': webapiId,
  };

  const postData = JSON.stringify(postDataOb);
  const sign = await getSign(postData);
  const url = `https://cp.kuaishou.com/rest/cp/creator/comment/removeTopComment?__NS_sig3=${sign}`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};
export interface SetCommentResponse {
  result: number;
  currentTime: number;
  data: boolean;
  message: string;
}


export const digCommentTopResponse = async (
  cookie: string,
  photoId: string,
  commentId: number,
  type: 'like' | 'cancelLike',
): Promise<SetCommentResponse> => {
  const headers = {
    cookie: cookie,
    'X-Requested-With': 'XMLHttpRequest',
    Referer: 'https://cp.kuaishou.com/article/comment',
    returnSetRootDomainLoginUrl: true,
    'Content-Type': 'application/json;charset=UTF-8',
  };

  const match = regex.exec(cookie);
  const webapiId = match ? match[1] : Guid.NewGuid().toString().replace(/-/g, '');

  const postDataOb = {
    commentId: commentId,
    photoId: photoId,
    'kuaishou.web.cp.api_ph': webapiId,
  };

  const postData = JSON.stringify(postDataOb);
  const sign = await getSign(postData);
  const url = `https://cp.kuaishou.com/rest/cp/creator/comment/${type}?__NS_sig3=${sign}`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};