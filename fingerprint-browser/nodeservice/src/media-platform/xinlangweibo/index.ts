export * from './xinlangweibo';
export { Xinlangweibo } from './xinlangweibo';
export { parseXinlangweiboPublicAuthorSearchHtml, searchXinlangweiboPublicAuthorList } from './xinlangweibo-common';
export {
  parseXinlangweiboPublicWorkSearchResponse,
  searchXinlangweiboPublicWorkList,
} from './xinlangweibo-public-work-search.service';
export type {
  PlatformPublicAuthorInfo,
  PlatformPublicAuthorListOutput,
  PlatformPublicWorkInfo,
  PlatformPublicWorkListOutput,
} from '../baseModel';
export type { XinlangweiboPublicWorkSearchContentType } from './xinlangweibo-public-work-search.service';
