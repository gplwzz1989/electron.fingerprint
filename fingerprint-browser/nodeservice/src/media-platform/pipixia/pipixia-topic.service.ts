import { $http } from '@/http';
import { AxiosResponse } from 'axios';
import { pipixiaBdms } from './pipixia-bdms-runtime';

const PPX_TOPIC_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.7204.185 Safari/537.36';

export const getPipixiaTopicResponse = async (
  cookie: string,
  keyWord?: string,
): Promise<PipixiaTopicResponse> => {
  const keyword = keyWord?.trim() ?? '';
  const queryStr = keyword
    ? `/api/mp/bds/webapi/hashtag_search/?tag_name=${encodeURIComponent(keyword)}&msToken=`
    : '/api/mp/bds/webapi/hashtag_recommend/?msToken=';

  const doRequest = async (): Promise<AxiosResponse<PipixiaTopicRawResponse>> => {
    const signedPath = await pipixiaBdms.signUrl(queryStr);
    const url = signedPath.startsWith('http') ? signedPath : `https://pipix.com${signedPath}`;
    return $http.get<unknown, AxiosResponse<PipixiaTopicRawResponse>>(url, {
      headers: {
        cookie: cookie,
        referer: 'https://pipix.com/mp/upload',
        'User-Agent': PPX_TOPIC_UA,
        accept: 'application/json, text/plain, */*',
      },
    });
  };

  let result = await doRequest();
  // 空响应通常意味着 a_bogus 被拒(token 失效)，重置运行时后重试一次
  if (!result.data || (result.data as unknown as string) === '') {
    pipixiaBdms.reset();
    result = await doRequest();
  }

  const tags = result.data?.data?.hashtags?.map(convertTopicItem) ?? [];
  const code = result.data?.status_code === 0 ? 200 : result.data?.status_code ?? -1;
  const message = result.data?.message ?? '';

  return {
    code: code,
    status: code,
    msg: message === 'success' ? '成功' : message,
    data: {
      recommend: {
        tags: tags,
      },
      list: tags,
    },
    timestamp: result.data?.time ?? Date.now(),
    traceId: result.headers['x-tt-logid']?.toString() ?? '',
  };
};

const convertTopicItem = (item: PipixiaHashtagItem): PipixiaTagItem => {
  const tagId = item.base_hashtag?.id ?? Number(item.id_str);

  return {
    tagId: Number.isFinite(tagId) ? tagId : 0,
    tagName: item.base_hashtag?.name ?? '',
    tagTypeIcon: item.base_hashtag?.icon?.url_list?.[0]?.url ?? item.icon?.url_list?.[0]?.url ?? '',
    hotNumber: item.show_num ?? item.enter_num ?? item.works_num ?? 0,
  };
};

export interface PipixiaImageInfo {
  /** 图片宽度 */
  width: number;
  /** 图片高度 */
  height: number;
  /** 图片资源标识 */
  uri: string;
  /** 图片地址列表 */
  url_list: Array<{
    url: string;
  }>;
  /** 是否为动图 */
  is_gif: boolean;
  /** 下载地址列表 */
  download_list?: Array<{
    url: string;
  }>;
}

export interface PipixiaTopicCategory {
  /** 分类ID */
  id: number;
  /** 分类名称 */
  name: string;
  /** 展示顺序 */
  display_order: number;
}

export interface PipixiaBaseHashtag {
  /** 话题数字ID */
  id: number;
  /** 话题字符串ID */
  id_str: string;
  /** 话题名称 */
  name: string;
  /** 话题简介 */
  intro: string;
  /** 话题状态 */
  status: number;
  /** 话题图标 */
  icon?: PipixiaImageInfo | null;
  /** 话题背景图 */
  background_image?: PipixiaImageInfo | null;
  /** 活动图标 */
  activity_icon?: unknown;
  /** 话题标签 */
  tag?: unknown;
  /** 扩展信息 */
  extra?: unknown;
  /** 话题类型 */
  hashtag_type?: number;
  /** 跳转链接 */
  jump_link?: string | null;
  /** 置顶状态 */
  top_status?: number;
  /** 分类列表 */
  category_list?: Array<PipixiaTopicCategory>;
  /** 创建时间 */
  create_time?: number;
  /** 修改时间 */
  modify_time?: number;
  [key: string]: unknown;
}

export interface PipixiaHashtagItem {
  /** 话题基础信息 */
  base_hashtag: PipixiaBaseHashtag;
  /** 话题跳转协议 */
  schema: string;
  /** 是否已关注 */
  is_follow: boolean;
  /** 作品数量 */
  works_num: number;
  /** 关注数量 */
  followers_num: number;
  /** 话题状态 */
  status: unknown;
  /** 话题简介 */
  intro: string | null;
  /** 话题图标 */
  icon: PipixiaImageInfo | null;
  /** 话题背景图 */
  background_image: PipixiaImageInfo | null;
  /** 话题标签 */
  tag: unknown;
  /** 扩展信息 */
  extra: string | null;
  /** 进入数量 */
  enter_num: number;
  /** 话题字符串ID */
  id_str: string;
  /** 展示数量 */
  show_num: number;
  [key: string]: unknown;
}

export interface PipixiaTopicRawResponse {
  /** 0 表示成功，非 0 表示异常 */
  status_code: number;
  /** 响应消息 */
  message: string;
  /** 提示信息 */
  prompt: string;
  /** 响应时间 */
  time: number;
  /** 响应数据 */
  data: {
    hashtags: Array<PipixiaHashtagItem>;
  };
}

/**
 * 标签信息接口
 * 与得物话题返回项保持一致
 */
export interface PipixiaTagItem {
  /** 标签唯一标识ID */
  tagId: number;
  /** 标签名称 */
  tagName: string;
  /** 标签类型图标 */
  tagTypeIcon: string;
  /** 标签热度数值 */
  hotNumber: number;
}

/**
 * 推荐内容接口
 * 包含推荐标签列表
 */
export interface PipixiaRecommendData {
  /** 推荐标签数组 */
  tags: PipixiaTagItem[];
}

/**
 * 接口响应数据主体接口
 * 包含推荐相关数据
 */
export interface PipixiaResponseData {
  /** 推荐内容数据 */
  recommend: PipixiaRecommendData;
  list: PipixiaTagItem[];
}

/**
 * 完整接口响应结果接口
 * 与得物话题返回结构保持一致
 */
export interface PipixiaTopicResponse {
  /** 业务状态码 */
  code: number;
  /** 状态码（与code保持一致） */
  status: number;
  /** 响应消息 */
  msg: string;
  /** 响应数据主体 */
  data: PipixiaResponseData;
  /** 响应时间戳（毫秒级） */
  timestamp: number;
  /** 请求追踪ID，用于问题排查 */
  traceId: string;
}
