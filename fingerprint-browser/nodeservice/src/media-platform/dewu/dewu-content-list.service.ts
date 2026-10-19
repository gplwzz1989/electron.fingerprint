//https://www.meipai.com/medias/video_convert_list

import { $http } from '@/http';

/**
 *
 * @param cookie
 * @param page
 */
export const getDeWuVideoListResponse = async (cookie: string, page: number = 1): Promise<DeWuContentApiResponse> => {
  const url = 'https://creator.dewu.com/sns-creator-center/v1/h5/content/user-video-list?sign=';

  const headers = {
    cookie: cookie,
    referer: 'https://creator.dewu.com/',
    Origin: 'https://creator.dewu.com',
    'Content-Type': 'application/json;charset=UTF-8',
    appVersion: '5.40.0',
    v: '5.45.0',
    'x-auth-token': decodeURIComponent(cookie.split('dewu_creator_x-auth-token=')[1]?.split(';')[0]),
  };

  const postData = { page: page, pageSize: 5 };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

/**
 * 内容统计数据接口
 * 包含阅读、收藏、回复等互动数据
 */
interface ContentCounter {
  /** 阅读量 */
  read: number;
  /** 点赞量 */
  fav: number;
  /** 回复量 */
  reply: number;
  /** 分享量 */
  share: number;
  /** 收藏量 */
  collect: number;
}

/**
 * 内容列表项接口
 * 表示单个视频/文章内容的详细信息
 */
interface DeWuContentItem {
  /** 内容唯一标识ID */
  contentId: number;
  /** 内容标题（可能为空字符串） */
  title: string;
  /** 发布时间戳（毫秒级） */
  publishTime: number;
  /** 用户设置的状态（具体含义需根据业务场景确定） */
  userSetStatus: number;
  /** 封面图片URL */
  cover: string;
  /** 视频播放URL */
  videoUrl: string;
  /** 内容互动统计数据 */
  counter: ContentCounter;
}

/**
 * 接口响应数据主体接口
 * 包含内容列表及总数信息
 */
interface DeWuContentResponseData {
  /** 内容总数 */
  total: number;
  /** 内容列表数组 */
  list: DeWuContentItem[];
}

/**
 * 完整接口响应结果接口
 * 包含状态信息、数据及追踪信息
 */
export interface DeWuContentApiResponse {
  /** 业务状态码 */
  code: number;
  /** 状态码（与code保持一致） */
  status: number;
  /** 响应消息 */
  msg: string;
  /** 响应数据主体 */
  data: DeWuContentResponseData;
  /** 响应时间戳（毫秒级） */
  timestamp: number;
  /** 请求追踪ID，用于问题排查 */
  traceId: string;
}
