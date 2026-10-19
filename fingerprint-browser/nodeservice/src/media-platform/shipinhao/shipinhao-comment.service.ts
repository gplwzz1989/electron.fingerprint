import { $http } from '@/http';
import { generateRandomString } from '../xinlangweibo/xinlangweibo-common';
import { Guid } from '@/utils';

/**
 *
 * @param cookie
 * @param type 类型 12:图文 13：视频
 * @param finderName 用户finderName
 * @param page 页码，默认首页为 1
 * @param pageSize 单页数量，默认10
 */
export const getShipinhaoCommentContentListResponse = async (
  cookie: string,
  type: 12 | 13,
  finderName: string,
  page: number = 1,
  pageSize: number = 10,
): Promise<ShipinhaoCommentImageListResponse> => {
  const url =
    'https://channels.weixin.qq.com/micro/interaction/cgi-bin/mmfinderassistant-bin/post/post_list?_rid=679303fd-0ef8fc49';

  const header = {
    referer: 'https://channels.weixin.qq.com/platform/post/create',
    cookie: cookie,
    Origin: 'https://channels.weixin.qq.com',
  };

  const postData = {
    pageSize: pageSize,
    currentPage: page,
    onlyUnread: false,
    userpageType: type,
    needAllCommentCount: true,
    forMcn: false,
    timestamp: new Date().getTime(),
    _log_finder_uin: '',
    _log_finder_id: finderName,
    rawKeyBuff: null,
    pluginSessionId: null,
    scene: 7,
    reqScene: 7,
  };

  const result = await $http.post(url, postData, { headers: header });

  return result.data;
};

export interface ShipinhaoCommentImageListResponse {
  /**
   * 状态码 0:正常
   */
  errCode: number;
  /**
   * 提示小时
   */
  errMsg: string;
  data: {
    list: Array<ShipinhaoCommentContent>;

    /**
     * 总数
     */
    totalCount: number;

    continueFlag: boolean;
  };
}

export interface ShipinhaoCommentContent {
  commentList: [];
  /**
   * 作品id
   */
  objectId: string;
  /**
   * 10位时间戳
   */
  createTime: 1737024434;
  likeCount: 0;
  /**
   * 评论数
   */
  commentCount: 0;
  readCount: 4;
  forwardCount: 0;
  favCount: 0;
  /**
   * 是否关闭了评论 0:否 1:是
   */
  commentClose: 0;
  /**
   * 可见类型
   */
  visibleType: 1;
  status: 1;
  desc: {
    media: Array<{
      thumbUrl: string;
    }>;
    mentionedMusics: [];
    /**
     * 视频短标题
     */
    shortTitle: [];
    /**
     * 描述
     */
    description: string;
    /**
     * 作品类型 2:图文， 4貌似是视频
     */
    mediaType: number;
    finderNewlifeDesc: {
      /**
       * 图文标题
       */
      richTextTitle: string;
    };
  };
  /**
   * 这个也是作品的某一种id
   */
  objectNonce: string;
  /**
   * 作品id，看起来和objectId是一样的，评论相关功能都用这个id
   */
  exportId: string;

  followCount: 0;
  forwardSnsCount: 0;
  forwardAllChatCount: 0;
  yesterdayReadCount: 0;
}

/**
 * 获取视频评论，包含二级评论
 * @param cookie
 * @param exportId 作品id
 * @param finderName 用户finderName
 * @param lastBuff 下一页参数，来自当前接口返回值，首页默认为空
 * @param rootCommentId 当获取二级评论时，一级评论的id
 */
export const getShipinhaoCommentListResponse = async (
  cookie: string,
  exportId: string,
  finderName: string,
  lastBuff: string = '',
  rootCommentId?: string,
): Promise<ShipinhaoCommentListResponse> => {
  const url =
    'https://channels.weixin.qq.com/micro/interaction/cgi-bin/mmfinderassistant-bin/comment/comment_list?_rid=6793038d-093ee861';

  const header = {
    referer: 'https://channels.weixin.qq.com/platform/post/create',
    cookie: cookie,
    Origin: 'https://channels.weixin.qq.com',
  };

  const postData = {
    lastBuff: lastBuff ?? '',
    exportId: exportId,
    commentSelection: false,
    forMcn: false,
    timestamp: new Date().getTime(),
    _log_finder_uin: '',
    _log_finder_id: finderName,
    rawKeyBuff: null,
    pluginSessionId: null,
    scene: 7,
    reqScene: 7,
  };
  if (rootCommentId) {
    postData['rootCommentId'] = rootCommentId;
  }

  const result = await $http.post(url, postData, { headers: header });

  return result.data;
};

export interface ShipinhaoCommentListResponse {
  /**
   * 状态码 0:正常
   */
  errCode: number;
  /**
   * 提示消息
   */
  errMsg: string;
  data: {
    comment: Array<ShipinhaoCommentItem>;
    /**
     * 下一页参数
     */
    lastBuff: string;
    /**
     * 总评论数
     */
    commentCount: number;
    downContinueFlag: number;
  };
}

export interface ShipinhaoCommentItem {
  /**
   * 二级评论
   */
  levelTwoComment: Array<ShipinhaoCommentItem>;
  commentId: string;
  /**
   * 评论人昵称
   */
  commentNickname: string;
  /**
   * 评论内容
   */
  commentContent: string;
  /**
   * 评论人头像
   */
  commentHeadurl: string;
  /**
   * 评论时间，10位时间戳字符串
   */
  commentCreatetime: string;
  /**
   * 评论点赞数
   */
  commentLikeCount: number;
  /**
   * 评论回复的目标评论id
   */
  replyCommentId: string;
  /**
   * 评论回复的目标评论内容
   */
  replyContent: string;
  /**
   * 评论回复的目标用户昵称
   */
  replyNickname: string;
  /**
   * 二级评论请求开始索引
   */
  lastBuff: string;
  /**
   * 是否还有二级评论需要加载
   */
  downContinueFlag: number;
  visibleFlag: 1;
  readFlag: true;
  displayFlag: number;
  blacklistFlag: 0;
  likeFlag: 0;
}

/**
 * 添加/回复评论
 * @param cookie
 * @param exportId 作品id
 * @param content 回复的内容
 * @param finderName 用户id
 * @param commentId 回复指定评论的id
 * @param rootCommentId 回复指定评论为二级评论时的顶级评论id
 */
export const addShipinhaoCommentResponse = async (
  cookie: string,
  exportId: string,
  content: string,
  finderName: string,
  commentId?: string,
  rootCommentId?: string,
  proxyAgent?: object,
): Promise<ShipinhaoAddCommentResponse> => {
  const url =
    'https://channels.weixin.qq.com/micro/interaction/cgi-bin/mmfinderassistant-bin/comment/create_comment?_rid=67a42597-efbbfe4d';

  const header = {
    referer: 'https://channels.weixin.qq.com/platform/post/create',
    cookie: cookie,
    Origin: 'https://channels.weixin.qq.com',
  };

  const postData = {
    content: content,
    clientId: generateRandomString(32),
    comment: {},
    exportId: exportId,
    timestamp: new Date().getTime().toString(),
    _log_finder_uin: '',
    _log_finder_id: finderName,
    rawKeyBuff: null,
    pluginSessionId: null,
    scene: 7,
    reqScene: 7,
  };
  if (commentId) {
    postData['replyCommentId'] = commentId;
    if (rootCommentId) {
      postData['rootCommentId'] = rootCommentId;
    }
    postData.comment = {
      levelTwoComment: [],
      commentId: commentId,
      commentNickname: '',
      commentContent: '',
      commentHeadurl: '',
      commentCreatetime: '1735111383',
      commentLikeCount: 0,
      replyCommentId: rootCommentId,
      replyContent: '',
      lastBuff: '',
      downContinueFlag: 0,
      visibleFlag: 0,
      readFlag: true,
      displayFlag: 0,
      blacklistFlag: 0,
      likeFlag: 0,
    };
  }

  const result = await $http.post(url, postData, { headers: header, httpAgent: proxyAgent, httpsAgent: proxyAgent });

  return result.data;
};

/**
 * 添加/回复评论
 */
export interface ShipinhaoAddCommentResponse {
  /**
   * 0:正常，非0异常
   */
  errCode: 0;
  /**
   * 提示消息
   */
  errMsg: 'request successful';
  data: {
    commentId: '14586202003063445961';
    clientId: '7945dcb4-b4b8-436a-8618-fd939cd1d556';
    comment: {
      levelTwoComment: [];
      commentId: '14586202003063445961';
      commentContent: '电饭锅电饭锅';
      commentCreatetime: '1738810778';
      commentLikeCount: 0;
      replyCommentId: '14555169232883554430';
      replyContent: '哈哈';
      visibleFlag: 1;
      displayFlag: 2;
      username: 'v2_060000231003b20faec8c4e68f1cc7d5c903ea33b0774b0ae2979b4f3373ebb37df95ec4740d@finder';
    };
    baseResp: { errcode: 0; errmsg: '' };
  };
}

/**
 * 删除评论
 * @param cookie
 * @param exportId 作品id
 * @param finderName 用户id
 * @param commentId 评论id
 */
export const delShipinhaoCommentResponse = async (
  cookie: string,
  exportId: string,
  finderName: string,
  commentId: string,
): Promise<ShipinhaoDelCommentResponse> => {
  const url =
    'https://channels.weixin.qq.com/micro/interaction/cgi-bin/mmfinderassistant-bin/comment/del_comment?_rid=67a4255c-5441ea07';

  const header = {
    referer: 'https://channels.weixin.qq.com/platform/post/create',
    cookie: cookie,
    Origin: 'https://channels.weixin.qq.com',
  };

  const postData = {
    exportId: exportId,
    commentId: commentId,
    timestamp: new Date().getTime().toString(),
    _log_finder_uin: '',
    _log_finder_id: finderName,
    rawKeyBuff: null,
    pluginSessionId: null,
    scene: 7,
    reqScene: 7,
  };

  const result = await $http.post(url, postData, { headers: header });

  return result.data;
};

export interface ShipinhaoDelCommentResponse {
  /**
   * 0正常，非0异常
   */
  errCode: number;
  errMsg: string;
  data: { baseResp: { errcode: number; errmsg: string } };
}

/**
 * 置顶评论，只能置顶一级评论
 * @param cookie
 * @param exportId 作品id
 * @param finderName 用户id
 * @param commentId 评论id
 */
export const setTopShipinhaoCommentResponse = async (
  cookie: string,
  exportId: string,
  finderName: string,
  commentId: string,
): Promise<ShipinhaoDelCommentResponse> => {
  const url =
    'https://channels.weixin.qq.com/micro/interaction/cgi-bin/mmfinderassistant-bin/comment/set_top_comment?_rid=67a4277f-cee1147b';

  const header = {
    referer: 'https://channels.weixin.qq.com/platform/post/create',
    cookie: cookie,
    Origin: 'https://channels.weixin.qq.com',
  };

  const postData = {
    exportId: exportId,
    commentId: commentId,
    opType: 1,
    timestamp: new Date().getTime().toString(),
    _log_finder_uin: '',
    _log_finder_id: finderName,
    rawKeyBuff: null,
    pluginSessionId: null,
    scene: 7,
    reqScene: 7,
  };

  const result = await $http.post(url, postData, { headers: header });

  return result.data;
};

/**
 * 点赞/取消
 * @param cookie
 * @param exportId
 * @param finderName
 * @param commentId
 * @param type 1:点赞 2:取消
 */
export const digShipinhaoCommentResponse = async (
  cookie: string,
  exportId: string,
  finderName: string,
  commentId: string,
  type: 1 | 2 = 1,
): Promise<ShipinhaoDelCommentResponse> => {
  const url = `https://channels.weixin.qq.com/micro/interaction/cgi-bin/mmfinderassistant-bin/comment/like_comment?_aid=${Guid.NewGuid().toString()}&_rid=693120bf-5ea3d1f0&_pageUrl=https:%2F%2Fchannels.weixin.qq.com%2Fmicro%2Finteraction%2Fcomment`;

  const header = {
    referer: 'https://channels.weixin.qq.com/micro/interaction/comment',
    cookie: cookie,
    Origin: 'https://channels.weixin.qq.com',
  };

  const postData = {
    commentId: commentId,
    scene: type,
    exportId: exportId,
    timestamp: Date.now().toString(),
    _log_finder_uin: '',
    _log_finder_id: finderName,
    rawKeyBuff: null,
    pluginSessionId: null,
    reqScene: 7,
  };

  const result = await $http.post(url, postData, { headers: header });

  return result.data;
};
