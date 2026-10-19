import { $http } from '@/http';
import { getNewSign } from '@/media-platform/xiaohongshu/xiaohongshu-base.service';

/**
 * 获取最新评论列表
 * @param cookie
 * @param cursor
 */
export const getXiaohongshuCommentTimeLineResponse = async (
  cookie: string,
  cursor: number = 0,
): Promise<XiaohongshuCommentTimeLineResponse> => {
  const urlPath = `/api/sns/web/v1/you/mentions?num=20&cursor=${cursor ? cursor.toString() : ''}`;

  const url = `https://edith.xiaohongshu.com${urlPath}`;

  const sign = await getNewSign(urlPath, undefined);

  const headers = {
    cookie: cookie,
    referer: 'https://www.xiaohongshu.com',
  };
  headers['X-s'] = sign['X-s'];
  headers['X-t'] = sign['X-t'];

  const result = await $http.get(url, { headers: headers });

  return result.data;
};

export interface XiaohongshuCommentTimeLineResponse {
  success: boolean;
  msg: string;
  data: {
    message_list: Array<{
      title: string; // '评论了你的笔记';
      item_info: {
        user_info: {
          userid: string;
          nickname: string;
          image: string;
          red_official_verify_type: number;
        };
        xsec_token: string;
        image: string;
        image_info: {
          height: number;
          url: string;
          width: number;
        };
        illegal_info: {
          status: number;
          desc: '';
          illegal_status: string; //'NORMAL'
        };
        link: string;
        status: number;
        type: string;
        id: string;
      };
      comment_info: {
        /**
         * 评论内容
         */
        content: string;
        illegal_info: { desc: ''; illegal_status: string; status: number };
        status: number;
        liked: boolean;
        /**
         * 点赞数
         */
        like_count: number;
        id: string;
      };
      track_type: string;
      liked: boolean;
      id: string;
      type: string; // 'comment/item';
      /**
       * 10位时间戳
       */
      time: number;
      score: number;
      /**
       * 评论人
       */
      user_info: {
        nickname: string;
        image: string;
        red_official_verify_type: number;
        indicator: string; //'你的粉丝';
        xsec_token: string;
        userid: string;
      };
      time_flag: 0;
    }>;
    has_more: boolean;
    cursor: number;
  };
  /**
   * 0:正常 非0异常
   */
  code: number;
}

/**
 * 删除评论
 * @param cookie
 * @param noteId
 * @param commentId
 */
export const deleteXiaohongshuCommentResponse = async (
  cookie: string,
  noteId: string,
  commentId: string,
): Promise<XiaohongshuDeleteCommentResponse> => {
  const urlPath = `/api/sns/web/v1/comment/delete`;

  const url = `https://edith.xiaohongshu.com${urlPath}`;

  const postData = { note_id: noteId, comment_id: commentId };

  const signStr = await getNewSign(urlPath, JSON.stringify(postData));
  const sign = JSON.parse(signStr);
  if (sign['a1']) {
    cookie = `${cookie};a1=${sign['a1']}`;
  }
  const headers = {
    cookie: cookie,
    referer: 'https://www.xiaohongshu.com',
  };
  headers['X-s'] = sign['X-s'];
  headers['X-t'] = sign['X-t'];

  const result = await $http.post(url, postData, { headers: headers });

  return result.data;
};

export interface XiaohongshuDeleteCommentResponse {
  code: number;
  success: boolean;
  msg: string;
}

/**
 * 删除评论
 * @param cookie
 * @param noteId
 * @param commentId
 * @param type
 */
export const digXiaohongshuCommentResponse = async (
  cookie: string,
  noteId: string,
  commentId: string,
  type: 'like' | 'dislike' = 'like',
): Promise<XiaohongshuDigCommentResponse> => {
  const urlPath = `/api/sns/web/v1/comment/${type}`;

  const url = `https://edith.xiaohongshu.com${urlPath}`;

  const postData = { note_id: noteId, comment_id: commentId };

  const signStr = await getNewSign(urlPath, JSON.stringify(postData));
  const sign = JSON.parse(signStr);
  if (sign['a1']) {
    cookie = `${cookie};a1=${sign['a1']}`;
  }
  const headers = {
    cookie: cookie,
    referer: 'https://www.xiaohongshu.com',
  };
  headers['X-s'] = sign['X-s'];
  headers['X-t'] = sign['X-t'];

  const result = await $http.post(url, postData, { headers: headers });

  return result.data;
};

export interface XiaohongshuDigCommentResponse {
  code: number;
  success: boolean;
  msg: string;
}

/**
 * 添加,回复评论
 * @param cookie
 * @param noteId 作品id
 * @param targetCommentId 评论id
 * @param commentContent 评论内容
 */
export const addXiaohongshuCommentResponse = async (
  cookie: string,
  noteId: string,
  commentContent: string,
  targetCommentId?: string,
): Promise<XiaohongshuAddCommentResponse> => {
  const urlPath = `/api/sns/web/v1/comment/post`;

  const url = `https://edith.xiaohongshu.com${urlPath}`;

  const postData = { note_id: noteId, content: commentContent, at_users: [] };
  if (targetCommentId) {
    postData['target_comment_id'] = targetCommentId;
  }

  const signStr = await getNewSign(urlPath, JSON.stringify(postData));
  const sign = JSON.parse(signStr);
  if (sign['a1']) {
    cookie = `${cookie};a1=${sign['a1']}`;
  }
  const headers = {
    cookie: cookie,
    referer: 'https://www.xiaohongshu.com',
  };
  headers['X-s'] = sign['X-s'];
  headers['X-t'] = sign['X-t'];

  const result = await $http.post(url, postData, { headers: headers });

  return result.data;
};

export interface XiaohongshuAddCommentResponse {
  code: number;
  success: boolean;
  msg: string;
  data: {
    comment: {
      id: string;
      note_id: string;
      /**
       * 13位时间戳
       */
      create_time: number;
      /**
       * 回复对象的作者
       */
      target_comment: {
        user_info: {
          image: string;
          user_id: string;
          nickname: string;
        };
        id: string;
      };
      show_tags: Array<string>; // ['is_author'];
      ip_location: string;
      status: number;
      content: string;
      at_users: [];
      liked: false;
      like_count: string;
      user_info: {
        nickname: string;
        image: string;
        user_id: string;
      };
    };
    /**
     * 13位时间戳
     */
    time: number;
    toast: string; //'你的回复已发布';
  };
}

/**
 * 获取作品下的评论
 * @param cookie
 * @param nodeId
 * @param xsec_token 作品下的参数
 * @param cursor
 * @param topicCommentId
 */
export const getContentCommentResponse = async (
  cookie: string,
  nodeId: string,
  xsec_token: string,
  cursor: string = '',
  topicCommentId: string = '',
): Promise<XiaohongshuContentCommentResponse> => {
  const urlPath = `/api/sns/web/v2/comment/page?note_id=${nodeId}&cursor=${
    cursor ?? ''
  }&top_comment_id=${topicCommentId}&image_formats=jpg,webp,avif&xsec_token=${encodeURIComponent(xsec_token)}`;

  const url = `https://edith.xiaohongshu.com${urlPath}`;

  const signStr = await getNewSign(urlPath, undefined);

  if (!signStr) {
    return {} as XiaohongshuContentCommentResponse;
  }
  const sign = JSON.parse(signStr);
  if (sign['a1']) {
    cookie = `${cookie};a1=${sign['a1']}`;
  }
  const headers = {
    cookie: cookie,
    referer: 'https://www.xiaohongshu.com',
  };
  headers['X-s'] = sign['X-s'];
  headers['X-t'] = sign['X-t'];

  const result = await $http.get(url, { headers: headers });

  return result.data;
};

export interface XiaohongshuContentCommentResponse {
  success: boolean;
  msg: string;
  data: {
    time: number;
    xsec_token: string;
    user_id: string;
    comments: Array<{
      /**
       * 评论内容
       */
      content: string; // 表情是中括号括起来的:'[哭惹R]';
      show_tags: [];
      sub_comment_has_more: boolean;
      sub_comment_count: string;
      status: string;
      like_count: string;
      user_info: {
        user_id: string;
        nickname: string;
        image: string;
        xsec_token: string;
      };
      /**
       * 13位时间戳
       */
      create_time: number;
      id: string;
      note_id: string;
      liked: boolean;
      at_users: [];
      sub_comments: Array<{
        id: string;
        note_id: string;
        status: number;
        content: string;
        like_count: string;
        /**
         * 13位时间戳
         */
        create_time: number;
        at_users: [];
        liked: boolean;
        user_info: {
          xsec_token: string;
          user_id: string;
          nickname: string;
          image: string;
        };
        show_tags: Array<string>;
        ip_location: string;
        target_comment: {
          user_info: {
            user_id: string;
            nickname: string;
            image: string;
            xsec_token: string;
          };
          id: string;
        };
      }>;
      sub_comment_cursor: string;
      target_comment?: {
        id: string;
        user_info: {
          user_id: string;
          nickname: string;
          image: string;
          xsec_token: string;
        };
      };
    }>;
    cursor: string;
    has_more: boolean;
  };
  code: number;
}

/**
 * 获取评论的子评论列表
 * @param cookie
 * @param nodeId
 * @param xsec_token
 * @param cursor
 * @param parentCommentId
 * @param topicCommentId
 */
export const getContentCommentSubListResponse = async (
  cookie: string,
  nodeId: string,
  xsec_token: string,
  cursor: string,
  parentCommentId: string = '',
  topicCommentId: string = '',
): Promise<XiaohongshuSubCommentResponse> => {
  const urlPath = `/api/sns/web/v2/comment/sub/page?note_id=${nodeId}&root_comment_id=${parentCommentId}&num=10&cursor=${cursor}&image_formats=jpg,webp,avif&top_comment_id=${topicCommentId}&xsec_token=${encodeURIComponent(
    xsec_token,
  )}`;

  const url = `https://edith.xiaohongshu.com${urlPath}`;

  const signStr = await getNewSign(urlPath, undefined);
  const sign = JSON.parse(signStr);
  if (sign['a1']) {
    cookie = `${cookie};a1=${sign['a1']}`;
  }
  const headers = {
    cookie: cookie,
    referer: 'https://www.xiaohongshu.com',
  };
  headers['X-s'] = sign['X-s'];
  headers['X-t'] = sign['X-t'];

  const result = await $http.get(url, { headers: headers });

  return result.data;
};

export interface XiaohongshuSubCommentResponse {
  code: number;
  success: boolean;
  msg: string;
  data: {
    /**
     * 13位时间戳
     */
    time: number;
    xsec_token: string;
    user_id: string;
    comments: Array<{
      id: string;
      note_id: string;
      content: string;
      liked: boolean;
      user_info: {
        user_id: string;
        nickname: string;
        image: string;
        xsec_token: string;
      };
      ip_location: string;
      status: number;
      at_users: [];
      like_count: string;
      show_tags: Array<string>;
      /**
       * 13位时间戳
       */
      create_time: number;
      target_comment: {
        id: string;
        user_info: {
          user_id: string;
          nickname: string;
          image: string;
          xsec_token: string;
        };
      };
    }>;
    cursor: string;
    has_more: boolean;
  };
}
