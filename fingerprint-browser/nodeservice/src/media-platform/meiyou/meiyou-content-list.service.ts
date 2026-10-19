import { $http } from '@/http';

/**
 *
 * @param cookie
 * @param page
 * @param type 2:文章 12 视频
 */
export const getMeiYouContentResponse = async (
  cookie: string,
  page: number = 1,
  type: 2 | 12,
): Promise<ContentListResponse> => {
  const url = `https://mp.meiyou.com/news?type=${type}&status=&page=${page}&title=&is_rss=0&source_type=0`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.meiyou.com/page/home/manager/2?noConfirm=true',
    Origin: 'https://mp.meiyou.com',
  };

  const result = await $http.get(url, { headers: headers });

  return result.data;
};

/**
 * 1. 列表项单独定义（data.data 中的单个元素，核心业务数据模型）
 */
export interface ContentItem {
  /** 内容ID */
  id: number;
  /** 标题（空字符串表示无标题） */
  title: string;
  /** 创建时间戳（秒级） */
  created_at: number;
  /** 发布日期（格式：YYYY-MM-DD HH:mm:ss） */
  published_date: string;
  /** 查看次数 */
  view_times: number;
  /** 评论次数 */
  review_count: number;
  /** 分类ID */
  category_id: number;
  /** 扁平化图片地址（空字符串表示无图片） */
  flat_images: string;
  /** 内容状态（5 为具体业务状态码） */
  status: number;
  /** 视频扁平化缩略图地址 */
  video_flat_thumb: string;
  /** 视频时长（格式：HH:mm） */
  video_time: string;
  /** 分享次数 */
  share_count: number;
  /** 收藏次数 */
  collect_count: number;
  /** 内容类型（4 为视频类型，推测） */
  type: number;
  /** 审核原因ID */
  reason_id: number;
  /** 审核时间（格式：YYYY-MM-DD HH:mm:ss） */
  audited_at: string;
  /** 新增日期（与 published_date 格式一致，可能为业务冗余字段） */
  new_date: string;
  /** 播放次数（视频专属） */
  play_times: number;
  /** 来源类型（3 为具体来源标识） */
  source_type: number;
  /** 视频缩略图地址（与 video_flat_thumb 可能一致，备用字段） */
  video_thumb: string;
  /** 展示次数 */
  show_times: number;
  /** 缩略图列表（空数组表示无缩略图） */
  thumb: never[];
  /** 是否置顶（0=否，1=是） */
  is_top: number;
  /** 分类名称（空字符串表示无分类名称） */
  category_name: string;
  /** 审核原因名称（空字符串表示无原因描述） */
  reason_name: string;
  /** 修改次数 */
  modified_times: number;
  /** 是否推荐 */
  is_recommend: boolean;
  /** 提示信息（空字符串表示无提示） */
  tips: string;
  /** 是否停用 */
  is_stop: boolean;
  /** 是否禁止 */
  is_forbid: boolean;
  /** 是否原创（0=否，1=是） */
  is_original: number;
  /** 是否自动发布（0=否，1=是） */
  auto_publish: number;
  /** 是否活动内容（0=否，1=是） */
  is_activities: number;
  /** 是否幼苗内容（0=否，1=是，推测为新人内容标识） */
  is_seedlings: number;
  /** 头条图片列表（空数组表示无头条图片） */
  headlines_images: never[];
  /** 头条内容（空字符串表示无头条内容） */
  headlines_content: string;
  /** 点赞次数 */
  praise_count: number;
  /** 内容条数（可能为子内容数量，0 表示无） */
  content_count: number;
}

/**
 * 2. 其余结构整合定义（顶层响应 + 分页 + 数据容器）
 */
export interface ContentListResponse {
  /** 状态码（0=成功，非0=失败） */
  code: number;
  /** 业务核心数据（分页信息 + 内容列表） */
  data: {
    /** 分页信息 */
    page_info: {
      /** 当前页码（从1开始） */
      page: number;
      /** 总数据条数 */
      total_number: number;
      /** 总页数 */
      total_page: number;
      /** 每页条数 */
      page_size: number;
    };
    /** 内容列表（元素类型为单独定义的 ContentItem） */
    data: ContentItem[];
  };
  /** 提示信息（成功时为空字符串，失败时返回错误描述） */
  message: string;
}
