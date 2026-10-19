import { $http } from '@/http';

export const getDeWuTopicResponse = async (cookie: string, keyWord: string): Promise<DeWuTagApiResponse> => {
  const url = `https://creator.dewu.com/sns-creator-center/v1/h5/content/search-tag?title=${encodeURIComponent(
    keyWord,
  )}&sign=`;

  const headers = {
    'Content-Type': 'application/json',
    referer: 'https://creator.dewu.com/release',
    Origin: 'https://creator.dewu.com',
    cookie: cookie,
    appVersion: '5.40.0',
    v: '5.45.0',
    'x-auth-token': decodeURIComponent(cookie.split('dewu_creator_x-auth-token=')[1]?.split(';')[0]),
    //traceparent: 00-f545518468aeba63b5616d9f0f825f90-d95c8eaee45455a4-01
  };
  const result = await $http.get(url, {
    headers: headers,
  });

  return result.data;
};
/**
 * 标签信息接口
 * 表示推荐标签的详细信息
 */
export interface DeWuTagItem {
  /** 标签唯一标识ID */
  tagId: number;
  /** 标签名称（可能包含表情符号） */
  tagName: string;
  /** 标签类型图标（当前数据为空字符串，预留字段） */
  tagTypeIcon: string;
  /** 标签热度数值（可能为0表示热度较低） */
  hotNumber: number;
}

/**
 * 推荐内容接口
 * 包含推荐标签列表
 */
export interface DeWuRecommendData {
  /** 推荐标签数组 */
  tags: DeWuTagItem[];
}

/**
 * 接口响应数据主体接口
 * 包含推荐相关数据
 */
export interface DeWuResponseData {
  /** 推荐内容数据 */
  recommend: DeWuRecommendData;
  list: DeWuTagItem[];
}

/**
 * 完整接口响应结果接口
 * 包含状态信息、数据及追踪信息
 */
export interface DeWuTagApiResponse {
  /** 业务状态码 */
  code: number;
  /** 状态码（与code保持一致） */
  status: number;
  /** 响应消息 */
  msg: string;
  /** 响应数据主体 */
  data: DeWuResponseData;
  /** 响应时间戳（毫秒级） */
  timestamp: number;
  /** 请求追踪ID，用于问题排查 */
  traceId: string;
}
