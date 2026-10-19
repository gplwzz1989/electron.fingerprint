/**
 * 媒体资源类型
 */
export enum MediaType {
  image = 20304,
  video = 20302,
}

/**
 * 视频号创作申明
 */
export enum ShipinhaoStatementType {
  '无需标准' = 0,
  '含AI生成内容' = 1,
  '内容包含营销广告' = 2,
  '内容为虚构剧情，仅供娱乐' = 3,
  '内容为转载' = 7,
  '个人观点，仅供参考' = 8,
}

/**
 * 视频号创作申明
 */
export interface ShipinhaoContentStatement {
  type: ShipinhaoStatementType;
  repostSource?:string
}

export interface ShipinhaoTagInfo {
  tagType: ShipinhaoStatementType;
  tagKey: string;
  repostSource?: string;
}

export const SHIPINHAO_TRACE_TAG_KEY = 'bd0a8444042c785d1783578551016192BC0ADA2E2AEDA';
export const SHIPINHAO_TRACE_REPOST_SOURCE = '';
