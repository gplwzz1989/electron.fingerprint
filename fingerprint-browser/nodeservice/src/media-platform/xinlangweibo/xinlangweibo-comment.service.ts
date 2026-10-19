import { $http } from '@/http';

export const createContentComment = async (
  cookie: string,
  contentId: string,
  text: string,
  picid?: string,
): Promise<XinlangweiboCommentResponse> => {
  const url = `https://weibo.com/ajax/comments/create`;
  const seps = cookie.split('XSRF-TOKEN=');
  const headers = {
    cookie: cookie,
    referer: 'https://weibo.com/',
    origin: 'https://weibo.com',
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-XSRF-TOKEN': seps?.length ? seps[1]?.split(';')[0] : '',
  };

  const postData = `id=${contentId}&comment=${encodeURIComponent(text ?? '')}&pic_id=${
    picid ?? ''
  }&is_repost=0&comment_ori=0&is_comment=0`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export const replyContentComment = async (
  cookie: string,
  contentId: string,
  commentId: string,
  text: string,
  picid?: string,
): Promise<XinlangweiboCommentResponse> => {
  const url = `https://weibo.com/ajax/comments/reply`;
  const seps = cookie.split('XSRF-TOKEN=');
  const headers = {
    cookie: cookie,
    referer: 'https://weibo.com/',
    origin: 'https://weibo.com',
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-XSRF-TOKEN': seps?.length ? seps[1]?.split(';')[0] : '',
  };

  const postData = `id=${contentId}&cid=${commentId}&comment=${encodeURIComponent(text ?? '')}&pic_id=${
    picid ?? ''
  }&is_repost=0&comment_ori=0&is_comment=0`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export const deleteContentComment = async (cookie: string, commentId: string): Promise<XinlangweiboCommentResponse> => {
  const url = `https://weibo.com/ajax/statuses/destroyComment`;
  const seps = cookie.split('XSRF-TOKEN=');
  const headers = {
    cookie: cookie,
    referer: 'https://weibo.com/',
    origin: 'https://weibo.com',
    'Content-Type': 'application/json',
    'X-XSRF-TOKEN': seps?.length ? seps[1]?.split(';')[0] : '',
  };

  const postData = { cid: Number(commentId), filter: {} };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export const digContentComment = async (
  cookie: string,
  commentId: string,
  type: 'updateLike' | 'destroyLike' = 'updateLike',
): Promise<XinlangweiboCommentResponse> => {
  const url = `https://weibo.com/ajax/statuses/${type}`;
  const seps = cookie.split('XSRF-TOKEN=');
  const headers = {
    cookie: cookie,
    referer: 'https://weibo.com/',
    origin: 'https://weibo.com',
    'Content-Type': 'application/json',
    'X-XSRF-TOKEN': seps?.length ? seps[1]?.split(';')[0] : '',
  };

  const postData = { object_id: commentId, object_type: 'comment' };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface XinlangweiboCommentResponse {
  /**
   * 1:正常
   */
  ok: number;
  data: {
    created_at: string; //'Wed Dec 17 14:22:49 +0800 2025';
    /**
     * 评论id
     */
    id: number;
  };
  //msg: string;
  message: string;
}

export const getContentCommentListResponse = async (
  cookie: string,
  contentId: string,
  uid?: string,
  nextPage?: string,
): Promise<XinlangweiboCommentListResponse> => {
  const url = `https://weibo.com/ajax/statuses/buildComments?flow=0&is_reload=1&id=${contentId}&is_show_bulletin=2&is_mix=0&count=10&uid=${uid}&fetch_level=0&locale=zh-CN${
    nextPage ? `&max_id=${nextPage}` : ''
  }`;
  const seps = cookie.split('XSRF-TOKEN=');
  const headers = {
    cookie: cookie,
    referer: 'https://weibo.com/',
    origin: 'https://weibo.com',
    'Content-Type': 'application/json',
    'X-XSRF-TOKEN': seps?.length ? seps[1]?.split(';')[0] : '',
  };

  const result = await $http.get(url, {
    headers: headers,
  });

  return result.data;
};

export const getContentSecondCommentListResponse = async (
  cookie: string,
  commentId: string,
  uid?: string,
  nextPage?: string,
): Promise<XinlangweiboCommentListResponse> => {
  const url = `https://weibo.com/ajax/statuses/buildComments?flow=1&is_reload=1&id=${commentId}&is_show_bulletin=2&is_mix=1&fetch_level=1&max_id=0&count=20&uid=${uid}&locale=zh-CN${
    nextPage ? `&max_id=${nextPage}` : ''
  }`;
  const seps = cookie.split('XSRF-TOKEN=');
  const headers = {
    cookie: cookie,
    referer: 'https://weibo.com/',
    origin: 'https://weibo.com',
    'Content-Type': 'application/json',
    'X-XSRF-TOKEN': seps?.length ? seps[1]?.split(';')[0] : '',
  };

  const result = await $http.get(url, {
    headers: headers,
  });

  return result.data;
};
export interface XinlangweiboCommentListResponse {
  /**
   * 1：正常
   */
  ok: number;

  data: [XinlangweiboCommentItemInfo];
  total_number: number;
  max_id: number;
  message:string
}

export interface XinlangweiboCommentItemInfo {
  /**
   * 时间
   */
  created_at: string; //'Wed Dec 17 16:38:18 +0800 2025';
  /**
   * 评论id
   */
  id: number;
  rootid: number;
  rootidstr: string;
  floor_number: number;
  /**
   * 内容
   */
  text: string; // '123<img alt="[女孩儿]" title="[女孩儿]" src="https://face.t.sinajs.cn/t4/appstyle/expression/ext/normal/39/2018new_nvhai_org.png" /><img alt="[熊猫]" title="[熊猫]" src="https://face.t.sinajs.cn/t4/appstyle/expression/ext/normal/aa/2018new_xiongmao_org.png" /><img alt="[加油]" title="[加油]" src="https://face.t.sinajs.cn/t4/appstyle/expression/ext/normal/9f/2018new_jiayou_org.png" /> ';

  user: {
    id: number;
    idstr: string;
    screen_name: string;
    profile_image_url: string;

    avatar_large: string;
    avatar_hd: string;
  };
  reply_comment:{
    id:number;
    idstr:string;
    user:{
      id: number;
      idstr: string;
      screen_name: string;
      profile_image_url: string;

      avatar_large: string;
      avatar_hd: string;
    };
  },
  mid: string;
  idstr: string;
  liked: false;
  /**
   * 图片数
   */
  pic_num: number;

  allow_follow: false;
  item_category: string; // 'comment';
  degrade_type: string; // 'normal';
  /**
   * 二级评论数
   */
  total_number: number;

  /**
   * 图片长地址
   */
  url_struct: [
    {
      url_type_pic: string;
      ori_url: string;
      short_url: string;
      long_url: string;
    },
  ];
  /**
   * 点赞数
   */
  like_counts: number;
  /**
   * 文本内容
   */
  text_raw: string;
  isExpand: false;
}
