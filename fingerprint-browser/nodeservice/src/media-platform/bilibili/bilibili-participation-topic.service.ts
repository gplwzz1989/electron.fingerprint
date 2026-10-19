import { $http } from '../../http';
import { isJson } from '../../utils';
import { ListItemInfo } from '../baseModel';

/**
 * B站视频发布页“参与话题”推荐接口。
 *
 * 该接口与普通话题接口（/topic/type、/topic/search）分开维护，返回的数据
 * 需要在发布时转换为 topic_id、mission_id 和 topic_detail。
 */
export const BILIBILI_VIDEO_PARTICIPATION_TOPIC_URL = 'https://member.bilibili.com/x/vupre/web/topic/type/v2';

/** B站视频发布页“参与话题”搜索接口。 */
export const BILIBILI_VIDEO_PARTICIPATION_TOPIC_SEARCH_URL = 'https://member.bilibili.com/x/vupre/web/topic/search';

export const BILIBILI_VIDEO_PARTICIPATION_TOPIC_REFERER =
  'https://member.bilibili.com/platform/upload/video/frame?page_from=creative_home_top_upload';

/**
 * 参与话题查询参数。
 *
 * categoryId、parentCategoryId 对应官方接口的 type_id、type_pid；上传相关
 * 参数用于发布页根据当前作品获取推荐参与话题。
 */
export interface BilibiliVideoParticipationTopicQuery {
  /** 视频分区 id，对应 type_id。 */
  categoryId?: number | string;
  /** 视频父分区 id，对应 type_pid。 */
  parentCategoryId?: number | string;
  /** 页码，从 0 开始，对应 pn。 */
  pageNum?: number;
  /** 每页数量，对应 ps。 */
  pageSize?: number;
  /** 搜索接口使用的 offset；未提供时由 pageNum/pageSize 计算。 */
  offset?: number;
  /** 作品标题，对应推荐接口的 title。 */
  title?: string | null;
  /** 上传追踪 id，对应 track_id。 */
  trackId?: string;
  /** 上传 id，对应 upload_id。 */
  uploadId?: string;
  /** 上传压缩包地址，对应 zip_url。 */
  zipUrl?: string;
  /** 客户端平台，对应 platform，默认为 pc。 */
  platform?: string;
  /** 有值时走参与话题搜索接口。 */
  keyWord?: string;
}

/**
 * 参与话题原始数据。
 *
 * 推荐接口返回 topic_id/topic_name，搜索接口返回 id/name，因此两组字段
 * 都保留，raw 原样返回给调用方以便发布时提交官方需要的任务字段。
 */
export interface BilibiliVideoParticipationTopicInfo {
  topic_id?: number | string;
  topic_name?: string;
  topic_description?: string;
  mission_id?: number | string;
  activity_text?: string;
  activity_description?: string;
  arc_play_vv?: number;
  similarity_score?: number;
  final_score?: number;
  show_activity_icon?: boolean;
  id?: number | string;
  name?: string;
  uname?: string;
  state?: number;
  description?: string;
  [key: string]: unknown;
}

export interface BilibiliVideoParticipationTopicResponse {
  code: number;
  message?: string;
  data?: {
    maxpage?: number;
    request_id?: string;
    source_type?: number;
    tags?: unknown;
    topics?: Array<BilibiliVideoParticipationTopicInfo>;
  };
}

export interface BilibiliVideoParticipationTopicSearchResponse {
  code: number;
  message?: string;
  data?: {
    result?: {
      has_create_jurisdiction?: boolean;
      is_new_topic?: boolean;
      page_info?: {
        page_num?: number;
        offset?: number;
        has_more?: boolean;
      };
      tips?: string;
      topics?: Array<BilibiliVideoParticipationTopicInfo>;
    };
  };
}

/** 参与话题选择项，兼容官方原始项和统一列表项。 */
export type BilibiliVideoParticipationTopicSelection = BilibiliVideoParticipationTopicInfo | ListItemInfo;

const toNonNegativeInteger = (value: unknown, fallback: number): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback;
};

const participationTopicHeaders = (cookie: string) => ({
  cookie,
  Referer: BILIBILI_VIDEO_PARTICIPATION_TOPIC_REFERER,
});

/**
 * 获取 B站视频发布页推荐的参与话题。
 */
export const getBilibiliVideoParticipationTopicResponse = async (
  cookie: string,
  query: BilibiliVideoParticipationTopicQuery = {},
): Promise<BilibiliVideoParticipationTopicResponse> => {
  const pageNum = toNonNegativeInteger(query.pageNum, 0);
  const pageSize = toNonNegativeInteger(query.pageSize, 200) || 200;
  const categoryId = toNonNegativeInteger(query.categoryId, 21) || 21;
  const params: Record<string, unknown> = {
    pn: pageNum,
    ps: pageSize,
    title: query.title ?? '',
    platform: query.platform ?? 'pc',
    type_id: categoryId,
    t: Date.now(),
  };

  if (query.parentCategoryId !== undefined && query.parentCategoryId !== null) {
    params.type_pid = query.parentCategoryId;
  }
  if (query.trackId) {
    params.track_id = query.trackId;
  }
  if (query.uploadId) {
    params.upload_id = query.uploadId;
  }
  if (query.zipUrl) {
    params.zip_url = query.zipUrl;
  }

  const result = await $http.get(BILIBILI_VIDEO_PARTICIPATION_TOPIC_URL, {
    retryCondition: (error, response) => !isJson(response.data),
    headers: participationTopicHeaders(cookie),
    params,
  });

  return result.data;
};

/**
 * 搜索 B站视频发布页可参与的话题。
 */
export const searchBilibiliVideoParticipationTopicResponse = async (
  cookie: string,
  keyWord: string,
  pageNum: number = 0,
  pageSize: number = 50,
  offset?: number,
): Promise<BilibiliVideoParticipationTopicSearchResponse> => {
  const normalizedPageSize = toNonNegativeInteger(pageSize, 50) || 50;
  const normalizedPageNum = toNonNegativeInteger(pageNum, 0);
  const params = {
    keywords: keyWord ?? '',
    page_size: normalizedPageSize,
    offset:
      offset === undefined
        ? normalizedPageNum * normalizedPageSize
        : toNonNegativeInteger(offset, normalizedPageNum * normalizedPageSize),
    t: Date.now(),
  };

  const result = await $http.get(BILIBILI_VIDEO_PARTICIPATION_TOPIC_SEARCH_URL, {
    retryCondition: (error, response) => !isJson(response.data),
    headers: participationTopicHeaders(cookie),
    params,
  });

  return result.data;
};

/**
 * 将参与话题原始项转换为统一列表项，同时保留完整 raw。
 */
export const toBilibiliVideoParticipationTopicListItem = (
  item?: BilibiliVideoParticipationTopicInfo,
): ListItemInfo | undefined => {
  if (!item) {
    return undefined;
  }

  const topicId = item.topic_id ?? item.id;
  const topicName = item.topic_name ?? item.name;
  if (topicId === undefined || topicId === null || topicName === undefined || topicName === null) {
    return undefined;
  }

  return {
    yixiaoerId: String(topicId),
    yixiaoerName: String(topicName),
    yixiaoerDesc: item.topic_description ?? item.description,
    viewNum: item.arc_play_vv,
    raw: item,
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

/**
 * 解析发布时传入的参与话题，兼容统一列表项、推荐原始项以及搜索原始项。
 */
export const resolveBilibiliVideoParticipationTopic = (
  selection?: BilibiliVideoParticipationTopicSelection,
): BilibiliVideoParticipationTopicInfo | undefined => {
  if (!selection || !isRecord(selection)) {
    return undefined;
  }

  const selectionRecord = selection as Record<string, unknown>;
  let raw: Record<string, unknown> = selectionRecord;
  if (isRecord(selectionRecord.raw)) {
    raw = selectionRecord.raw;
    if (!('topic_id' in raw) && !('id' in raw) && isRecord(raw.raw)) {
      raw = raw.raw;
    }
  }

  const topicId = raw.topic_id ?? raw.id ?? selectionRecord.yixiaoerId;
  const topicName = raw.topic_name ?? raw.name ?? selectionRecord.yixiaoerName;
  if (topicId === undefined || topicId === null || topicName === undefined || topicName === null) {
    return undefined;
  }

  return {
    ...raw,
    topic_id: topicId as number | string,
    topic_name: String(topicName),
  } as BilibiliVideoParticipationTopicInfo;
};
