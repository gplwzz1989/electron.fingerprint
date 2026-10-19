import { $http } from '@/http';

export const getWiFiContentListResponse = async (
  cookie: string,
  page: number = 0,
  count: number = 2,
): Promise<WiFiContentListResponse> => {
  const url = `https://mp.lsttnews.com/media-center/manager/news/listdata.do`;

  const headers = {
    cookie: cookie,
    accept: 'application/json, text/plain, */*',
    referer: 'https://mp.lsttnews.com/',
    Origin: 'https://mp.lsttnews.com',
  };

  const params = {
    su: 0,
    start: page * count,
    limit: count,
  };

  const result = await $http.get(url, { headers: headers, params: params });

  return result.data;
};

/**
 * 新闻列表项数据结构
 */
interface NewsItem {
  // 评论状态（0 可能表示关闭/未开启，可根据业务扩展）
  cmtStatus: number;
  // 新闻标题
  title: string;
  // 阅读量（空字符串表示未统计/无数据）
  readCount: string;
  // 新闻类型标识（2 为具体类型值，可根据业务定义枚举）
  newsType: number;
  // 状态文本描述（如"已提交"）
  statusLabel: string;
  // 评论数量
  cmtCount: number;
  // 新闻项ID（字符串类型的 null，实际值为"null"）
  news_item_id: 'null';
  // 分享组件HTML字符串
  share: string;
  // 新闻唯一ID
  id: string;
  // 创建时间戳（毫秒级，如 1756710396000）
  create_date: number;
  // 分类标识（字符串类型的数字，如"1"、"28"）
  category: string;
  // 创建时间格式化字符串（如"2025-09-01 15:06:36"）
  createDate: string;
  // 新闻状态（1 可能表示"已提交/正常"，可根据业务扩展）
  status: number;
}

/**
 * 分页元数据结构
 */
interface NewsMeta {
  // 当前页数据量（0 表示当前页无数据）
  count: number;
  // 数据偏移量（分页起始位置）
  offset: number;
  // 当前页码（从 0 开始计数）
  page: number;
  // 总数据量
  total: number;
}

/**
 * 新闻列表响应根数据结构
 */
export interface WiFiContentListResponse {
  // 新闻列表数据数组
  data: NewsItem[];
  // 分页元数据信息
  meta: NewsMeta;
  // 请求成功标识
  success: boolean;

  error?: { code: number; message: string };
}
