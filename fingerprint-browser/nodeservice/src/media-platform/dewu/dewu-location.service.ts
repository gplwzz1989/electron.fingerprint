import { $http } from '@/http';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { GeoLocation } from '@/media-platform';

export const getLocationResponse = async (
  cookie: string,
  keyWord: string,
  proxyAgent?: HttpsProxyAgent<string> | object | undefined,
  geo?: GeoLocation | undefined,
): Promise<PositionApiResponse> => {
  const url = 'https://creator.dewu.com/sns-creator-center/v1/h5/content/geo-search?sign=';

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

  const postData = { address: keyWord };

  const result = await $http.post(url, postData, {
    headers: headers,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};

/**
 * 位置信息列表项接口
 * 描述单个位置的详细信息（如广场、地铁站、公交站、酒店等）
 */
export interface PositionItem {
  /** 位置名称（如"天府广场"、"天府广场[地铁站]"） */
  title: string;
  /** 位置详细地址/线路信息
   * - 普通地点：具体地址（如"四川省成都市青羊区人民南路一段86号"）
   * - 交通站点：线路信息（如"地铁2号线,地铁1号线"、"16路,64路等8条线路"）
   */
  address: string;
  /** 纬度坐标（字符串格式，便于直接使用地理相关API） */
  lat: string;
  /** 经度坐标（字符串格式，便于直接使用地理相关API） */
  lng: string;
  /** 距离信息（当前数据为空字符串，预留字段用于后续距离计算场景） */
  distance: string;
}

/**
 * 接口返回数据的核心数据体接口
 * 封装位置信息列表的顶层结构
 */
export interface PositionResponseData {
  /** 位置信息数组，包含多个符合PositionItem结构的位置数据 */
  position: PositionItem[];
}

/**
 * 完整接口响应结果接口
 * 符合后端返回的标准格式（包含状态码、消息、数据、时间戳、追踪ID）
 */
export interface PositionApiResponse {
  /** 业务状态码（200表示成功，其他值表示对应错误状态） */
  code: number;
  /** HTTP状态码（与code字段语义一致，通常保持相同值） */
  status: number;
  /** 响应消息（成功时为"成功"，错误时为具体错误描述） */
  msg: string;
  /** 响应核心数据（成功时返回位置信息，错误时可能为null/undefined） */
  data: PositionResponseData;
  /** 接口响应时间戳（毫秒级，用于时间相关校验或日志记录） */
  timestamp: number;
  /** 接口请求追踪ID（用于问题排查，关联前后端请求日志） */
  traceId: string;
}
