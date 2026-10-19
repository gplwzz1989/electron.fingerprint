//https://www.meipai.com/medias/video_convert_list

import { $http } from '@/http';
import { GetMD5, Guid } from '@/utils';
import { getHeaderSign } from '@/media-platform/yichehao/yichehao-user.service';

/**
 *
 * @param cookie
 * @param page
 * @param pageSize
 */
export const getYiCheHaoMiniVideoListResponse = async (
  cookie: string,
  page: number = 1,
  pageSize: number = 10,
): Promise<YiCheHaoMiniVideoListResponse> => {
  const now = parseInt((Date.now() / 1000).toFixed(0));

  const url = `https://mp.yiche.com/web_mp/api/v1/small_video/small_video_list?cid=500&ver=1.0.0&uid=&t=${now}&sign=${getHeaderSign(
    now,
  )}&param=%7B%22currentPage%22%3A${page}%2C%22pageSize%22%3A${pageSize}%7D`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.yiche.com/',
    Origin: 'https://mp.yiche.com',
    cid: 500,
    ver: '1.0.4',
    'x-user-guid': Guid.NewGuid().toString(),
    encrypttype: '2',
  };

  const result = await $http.get(url, { headers: headers });

  return result.data;
};

export interface YiCheHaoMiniVideoListResponse {
  /** 状态码，"1" 表示成功 */
  status: string;
  /** 状态描述信息 */
  message: string;
  /** 核心数据（包含分页和列表） */
  data: {
    /** 当前页码 */
    currentPage: number;
    /** 每页条数 */
    pageSize: number;
    /** 总记录数 */
    total: number;
    /** 总页数 */
    totalPage: number;
    /** 文章列表数据 */
    dataList: Array<YiCheHaoVideoContentItem>;
  };
  /** 错误代码，空字符串表示无错误 */
  ercd: string;
}

export interface YiCheHaoVideoContentItem {
  /** 文章ID */
  id: number;
  /** 状态码（2:已发布、3:已拒绝 ,4 :定时发布 */
  status: number;
  /** 封面图片URL */
  imageUrl: string;
  /** 发布时间（时间戳，毫秒级） */
  publishTime: string;
  /** 文章标题 */
  title: string;
  /** 系列名称（如专栏名称） */
  serialName: string;
  /** 话题名称（可能为null） */
  topicName: string | null;
  /** 评论数 */
  commentNumber: number;
  /** 点赞数 */
  praiseNumber: number;
  /** 浏览数 */
  viewNumber: number;
  /** 商业任务信息（可能为null） */
  businessTaskInfo: unknown | null;
}

export const getYiCheHaoVideoListResponse = async (
  cookie: string,
  page: number = 1,
  pageSize: number = 15,
): Promise<YiCheHaoVideoListResponse> => {
  const now = parseInt((Date.now() / 1000).toFixed(0));

  if (!page) {
    page = 1;
  }

  const postData = {
    cid: 500,
    ver: '1.0.0',
    uid: '',
    t: now,
    sign: '',
    param: {
      title: '',
      tabType: '1',
      beginPublishTime: '',
      endPublishTime: '',
      currentPage: page,
      pageSize: pageSize ?? 15,
    },
  };
  const signStr =
    'cid=' +
    postData.cid +
    ';param=' +
    JSON.stringify(postData.param) +
    ';ver=' +
    postData.ver +
    ';t=' +
    postData.t +
    ';' +
    '6AC46B43FC8DCD6E49F66F6C016F393F';
  postData.sign = GetMD5(signStr);
  const url = `https://mp.yiche.com/web_mp/api/v1/manage/videolist`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.yiche.com/detailManage/videos',
    Origin: 'https://mp.yiche.com',
    encrypttype: '2',
    'Content-Type': 'application/json',
  };

  const result = await $http.post(url, postData, { headers: headers });

  return result.data;
};

export interface YiCheHaoVideoListResponse {
  /**
   * '1' 成功
   */
  status: string;
  message: string;
  data: {
    count: number;
    list: Array<YiCheHaoVideoListItem>;
  };
  ercd: '';
}

export interface YiCheHaoVideoListItem {
  videoId: number;
  uniqueId: string;
  title: string;
  imageUrl: string;
  imageUrlWp: string;
  pubStatus: number;
  commentCount: number;
  supportCount: number;
  playCount: number;
  pvCount: number;
  playUrl: string;
  status: number;
  pubTime: string;
  createTime: string;
  sourceType: number;
  checkSate: number;
  refuseReason: string | null;
  showDot: boolean;
  isTimedPublish: number;
  publishTime: string;
  isLocked: number;
  level: number;
  businessTaskInfo: unknown | null;
  pubPointFocusUptFlag: boolean;
}

export const getYiCheHaoArticleListResponse = async (
  cookie: string,
  page: number = 1,
  pageSize: number = 15,
): Promise<YiCheHaoArticleListResponse> => {
  const now = parseInt((Date.now() / 1000).toFixed(0));

  if (!page) {
    page = 1;
  }

  const postData = {
    cid: 500,
    ver: '1.0.0',
    uid: '',
    t: now,
    sign: '',
    param: {
      title: '',
      beginPublishTime: '',
      endPublishTime: '',
      contentType: 0,
      currentPage: page,
      pageSize: pageSize ?? 15,
      status: -1,
    },
  };
  const signStr =
    'cid=' +
    postData.cid +
    ';param=' +
    JSON.stringify(postData.param) +
    ';ver=' +
    postData.ver +
    ';t=' +
    postData.t +
    ';' +
    '6AC46B43FC8DCD6E49F66F6C016F393F';
  postData.sign = GetMD5(signStr);
  const url = `https://mp.yiche.com/web_mp/api/v1/manage/newslist`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.yiche.com/',
    Origin: 'https://mp.yiche.com',
    encrypttype: '2',
    'Content-Type': 'application/json',
  };

  const result = await $http.post(url, postData, { headers: headers });

  return result.data;
};

export interface YiCheHaoArticleListResponse {
  /**
   * '1' 成功
   */
  status: string;
  message: string;
  data: {
    count: number;
    list: Array<YiCheHaoArticleContentItem>;
  };
  ercd: '';
}

export interface YiCheHaoArticleContentItem {
  newsId: number;
  uniqueId: string;
  title: string;
  shortTitle: string;
  cover: Array<string>;

  url: string;
  copyright: 'original';
  newsType: 0;
  /**
   * 2:已发布
   */
  publishStatus: number;
  publishTime: string; //'2025-11-29 15:48:51'
  refuseReason: null;
  commentCount: number;
  pv: number;
  pvCount: number;
  checkUserName: string;
  lockStatus: number;
  recommendGrade: string;
  level: number;
  businessTaskInfo: null;
}
