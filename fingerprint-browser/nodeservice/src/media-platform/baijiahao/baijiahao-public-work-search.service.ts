import { AxiosError, AxiosResponse } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { $http, HttpConfig } from '../../http';
import { GetMD5 } from '../../utils';
import { errorCode } from '../errorCode';
import { PublicAuthorPlatformCode } from '../baseModel';
import type {
  PlatformPublicAuthorInfo,
  PlatformPublicWorkInfo,
  PlatformPublicWorkListOutput,
  PlatformPublicWorkSearchContentType,
} from '../baseModel';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '../webproxy';
import { getBaijiahaoPublicAuthorSearchCookie } from './baijiahao-user.service';

export type BaijiahaoPublicWorkSearchContentType = PlatformPublicWorkSearchContentType;

const BaijiahaoPublicWorkSearchUserAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';
const BaijiahaoPublicWorkSearchSecChUa = '"Google Chrome";v="150", "Chromium";v="150", "Not)A;Brand";v="24"';
const BaijiahaoPublicWorkSearchAcceptLanguage = 'zh-CN,zh;q=0.9';

const buildBaijiahaoPublicWorkSearchSign = (
  pageNum: number,
  keyWord: string,
  pageSize: number,
  timestamp: number,
  version: number,
): string => {
  return GetMD5([pageNum, encodeURIComponent(keyWord), pageSize, timestamp, version].join('_'));
};

const getBaijiahaoPublicWorkSearchType = (
  contentType: BaijiahaoPublicWorkSearchContentType = 'video',
): 'video' | 'ugc_video' => {
  return contentType === 'miniVideo' ? 'ugc_video' : 'video';
};

const toNumber = (value: unknown): number => {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const parseBaijiahaoPublicWorkCount = (value: unknown): number => {
  const text = String(value ?? '')
    .replace(/,/g, '')
    .trim();
  const match = text.match(/([\d.]+)\s*([万亿]?)/);
  if (!match) {
    return 0;
  }
  const numberValue = Number(match[1]);
  if (!Number.isFinite(numberValue)) {
    return 0;
  }
  const unit = match[2];
  if (unit === '亿') {
    return Math.round(numberValue * 100000000);
  }
  if (unit === '万') {
    return Math.round(numberValue * 10000);
  }
  return Math.round(numberValue);
};

const parseBaijiahaoPublicWorkDurationMs = (duration: unknown): number => {
  const text = String(duration ?? '').trim();
  if (!text) {
    return 0;
  }
  const parts = text.split(':').map((item) => Number(item));
  if (!parts.length || parts.some((item) => !Number.isFinite(item))) {
    return 0;
  }
  const seconds = parts.reduce((total, item) => total * 60 + item, 0);
  return seconds * 1000;
};

const decodeBaijiahaoPublicWorkText = (value: unknown): string => {
  return String(value ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
};

const getBaijiahaoPublicWorkTitleTags = (title: string): Array<string> => {
  const result = new Set<string>();
  const tagReg = /#\s*([^#\s，,。；;!！?？]+)/g;
  let match: RegExpExecArray | null;
  while ((match = tagReg.exec(title))) {
    const tag = match[1]?.trim();
    if (tag) {
      result.add(tag);
    }
  }
  return Array.from(result);
};

const getCurrentTimestampSecond = (): string => {
  return Math.floor(Date.now() / 1000).toString();
};

const toTimestampSecondString = (value: unknown): string => {
  const fallback = getCurrentTimestampSecond();
  const text = String(value ?? '').trim();
  if (!text) {
    return fallback;
  }
  const numberValue = Number(text);
  if (Number.isFinite(numberValue) && numberValue > 0) {
    return Math.floor(numberValue > 9999999999 ? numberValue / 1000 : numberValue).toString();
  }
  const relativeMatch = text.match(/(\d+)\s*(分钟|小时|天|个月|月|年)前/);
  if (relativeMatch) {
    const amount = Number(relativeMatch[1]);
    const unit = relativeMatch[2];
    const date = new Date();
    if (unit === '分钟') {
      date.setMinutes(date.getMinutes() - amount);
    } else if (unit === '小时') {
      date.setHours(date.getHours() - amount);
    } else if (unit === '天') {
      date.setDate(date.getDate() - amount);
    } else if (unit === '个月' || unit === '月') {
      date.setMonth(date.getMonth() - amount);
    } else if (unit === '年') {
      date.setFullYear(date.getFullYear() - amount);
    }
    return Math.floor(date.getTime() / 1000).toString();
  }
  if (/^\d{4}[-/年]\d{1,2}([-/月]\d{1,2}日?)?(\s+\d{1,2}:\d{1,2}(:\d{1,2})?)?$/.test(text)) {
    const parsedTime = Date.parse(text.replace(/年|月/g, '-').replace(/日/g, ''));
    if (Number.isFinite(parsedTime)) {
      return Math.floor(parsedTime / 1000).toString();
    }
  }
  return fallback;
};

const getBaijiahaoPublicWorkPublishedAt = (item: BaijiahaoPublicWorkSearchItem): string => {
  const publishTime = item.publish_time ?? item.publishTime ?? item.create_time ?? item.createTime;
  if (publishTime !== undefined && publishTime !== null) {
    return toTimestampSecondString(publishTime);
  }
  return toTimestampSecondString(item.publishTimeText);
};

const parseBaijiahaoPublicWorkAuthor = (item: BaijiahaoPublicWorkSearchItem): PlatformPublicAuthorInfo => {
  const extAuthorId = String(item.author_id ?? item.appid ?? '').trim();
  return {
    platform_code: PublicAuthorPlatformCode.BaiJiaHao,
    ext_author_id: extAuthorId,
    nickname: decodeBaijiahaoPublicWorkText(item.author ?? item.author_name ?? item.name),
    avatar_url: item.author_icon ?? item.avatar_url ?? item.avatar ?? '',
    description: decodeBaijiahaoPublicWorkText(item.intro ?? item.description),
    aut_index: extAuthorId ? `https://baijiahao.baidu.com/u?app_id=${extAuthorId}` : '',
    aut_spi_url: extAuthorId ? `app_id=${extAuthorId}` : '',
    follower_count: toNumber(item.fansCnt ?? item.fans_count),
    total_views: 0,
    total_comments: 0,
    total_likes: 0,
    work_count: toNumber(item.videoCnt ?? item.video_count),
  };
};

const parseBaijiahaoPublicWorkSearchItem = (
  item: BaijiahaoPublicWorkSearchItem,
  contentType: BaijiahaoPublicWorkSearchContentType,
): PlatformPublicWorkInfo | undefined => {
  const docid = String(item?.vid ?? item?.id ?? '').trim();
  if (!docid) {
    return undefined;
  }
  const title = decodeBaijiahaoPublicWorkText(item.title);
  const author = parseBaijiahaoPublicWorkAuthor(item);
  return {
    platform_code: PublicAuthorPlatformCode.BaiJiaHao,
    docid,
    title,
    url: item.url || `https://haokan.baidu.com/v?vid=${docid}`,
    cover_url: item.cover_src ?? item.cover ?? '',
    content_type: contentType,
    category: '其他',
    ext_category_id: '',
    ext_author_id: author.ext_author_id,
    author,
    published_at: getBaijiahaoPublicWorkPublishedAt(item),
    tags: getBaijiahaoPublicWorkTitleTags(title),
    metrics: {
      view: parseBaijiahaoPublicWorkCount(item.read_num ?? item.play_num ?? item.play_count),
      like: toNumber(item.like_num ?? item.like_count),
      comment: toNumber(item.comment_num ?? item.comment_count),
      share: toNumber(item.share_num ?? item.share_count),
    },
    video_info: {
      duration_ms: parseBaijiahaoPublicWorkDurationMs(item.duration),
      download_url: item.video_url ?? item.download_url ?? '',
    },
  };
};

export const parseBaijiahaoPublicWorkSearchResponse = (
  response: BaijiahaoPublicWorkSearchResponse,
  contentType: BaijiahaoPublicWorkSearchContentType = 'video',
): Array<PlatformPublicWorkInfo> => {
  const exists = new Set<string>();
  const dataList: Array<PlatformPublicWorkInfo> = [];
  if (!response?.data?.list?.length) {
    return dataList;
  }
  for (const item of response.data.list) {
    const work = parseBaijiahaoPublicWorkSearchItem(item, contentType);
    if (!work || exists.has(work.docid)) {
      continue;
    }
    exists.add(work.docid);
    dataList.push(work);
  }
  return dataList;
};

export const getBaijiahaoPublicWorkSearchResponse = async (
  cookie: string | undefined,
  keyWord: string,
  pageNum: number = 1,
  contentType: BaijiahaoPublicWorkSearchContentType = 'video',
  proxyAgent: HttpsProxyAgent<string> | object | undefined = undefined,
): Promise<BaijiahaoPublicWorkSearchResponse> => {
  const pageSize = 10;
  const version = 1;
  const timestamp = Date.now();
  const requestCookie = await getBaijiahaoPublicAuthorSearchCookie(cookie, proxyAgent);
  const params = new URLSearchParams({
    pn: pageNum.toString(),
    rn: pageSize.toString(),
    type: getBaijiahaoPublicWorkSearchType(contentType),
    query: keyWord ?? '',
    sign: buildBaijiahaoPublicWorkSearchSign(pageNum, keyWord ?? '', pageSize, timestamp, version),
    version: version.toString(),
    timestamp: timestamp.toString(),
  });
  const result = await $http.get<unknown, AxiosResponse<BaijiahaoPublicWorkSearchResponse>>(
    `https://haokan.baidu.com/haokan/ui-search/pc/search/video?${params.toString()}`,
    {
      headers: {
        cookie: requestCookie,
        Host: 'haokan.baidu.com',
        referer: `https://haokan.baidu.com/web/search/page?query=${encodeURIComponent(keyWord ?? '')}`,
        'User-Agent': BaijiahaoPublicWorkSearchUserAgent,
        Accept: '*/*',
        'Accept-Language': BaijiahaoPublicWorkSearchAcceptLanguage,
        'x-requested-with': 'xmlhttprequest',
        'sec-ch-ua': BaijiahaoPublicWorkSearchSecChUa,
        'sec-ch-ua-mobile': HttpConfig.sec_ch_ua_mobile,
        'sec-ch-ua-platform': HttpConfig.sec_ch_ua_platform,
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
      },
      httpAgent: proxyAgent,
      httpsAgent: proxyAgent,
    },
  );
  return result.data;
};

export const searchBaijiahaoPublicWorkList = async (
  keyWord: string,
  cookie?: string | undefined,
  nextPage?: string,
  proxy?: KuaiDaiLiProxy,
  contentType: BaijiahaoPublicWorkSearchContentType = 'video',
): Promise<PlatformPublicWorkListOutput> => {
  const result: PlatformPublicWorkListOutput = {
    code: 0,
    msg: '',
    dataList: [],
  };
  if (!keyWord?.trim()) {
    result.code = errorCode.data_error;
    result.msg = '搜索关键词不能为空';
    return result;
  }
  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const pageNum = Number(nextPage ?? 1) || 1;
    const workSearchResponse = await getBaijiahaoPublicWorkSearchResponse(
      cookie,
      keyWord,
      pageNum,
      contentType,
      webProxy,
    );
    result.code = workSearchResponse?.status ?? -1;
    result.msg = workSearchResponse?.msg ?? '';
    result.dataList = parseBaijiahaoPublicWorkSearchResponse(workSearchResponse, contentType);
    if (workSearchResponse?.data?.has_more) {
      result.nextPage = String(workSearchResponse.data.pn ?? pageNum + 1);
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = '请求百家号作品搜索失败';
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = '解析百家号作品搜索结果失败';
    } else {
      result.msg = '百家号作品搜索失败';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};

export interface BaijiahaoPublicWorkSearchItem {
  appid?: string;
  author?: string;
  author_icon?: string;
  author_id?: string;
  author_name?: string;
  avatar?: string;
  avatar_url?: string;
  category?: string;
  cover?: string;
  cover_src?: string;
  create_time?: number | string;
  createTime?: number | string;
  description?: string;
  download_url?: string;
  duration?: string;
  fans_count?: number | string;
  fansCnt?: number | string;
  id?: string;
  intro?: string;
  like_count?: number | string;
  like_num?: number | string;
  name?: string;
  comment_count?: number | string;
  comment_num?: number | string;
  play_count?: number | string;
  play_num?: number | string;
  publish_time?: number | string;
  publishTime?: number | string;
  publishTimeText?: string;
  read_num?: string;
  share_count?: number | string;
  share_num?: number | string;
  title?: string;
  url?: string;
  vid?: string;
  video_count?: number | string;
  videoCnt?: number | string;
  video_url?: string;
}

export interface BaijiahaoPublicWorkSearchResponse {
  status: number;
  msg: string;
  data?: {
    cate?: Array<string>;
    has_more?: number;
    list?: Array<BaijiahaoPublicWorkSearchItem>;
    pn?: number;
    wordseg?: Array<string>;
  };
  timestamp?: number;
  logid?: string;
  login_status?: number;
}
