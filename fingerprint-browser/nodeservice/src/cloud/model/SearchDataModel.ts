import { Platforms } from '../../service/datasync-service-manager';
import { LocationType } from '../../../src/platform-body/common';
import { IWebProxy } from '@/media-platform/webproxy';
import { BaseResult } from '../../../src/media-platform/baseResult';
import { GeoLocation, ListItemInfo } from '@/media-platform';

export interface ConfigDataRequest {
  /**
   * lite鉴权token
   */
  authToken: string;

  /**
   * 平台
   */
  platform: Platforms;

  /**
   * 媒体号空间id
   */
  platformAccountSpaceId: string;

  /**
   * 搜索关键词
   */
  keyWord?: string;

  /**
   * 下一页参数
   */
  nextPage?: string;
}

export interface SearchLocationParams {
  keyWord?: string;
  locationType?: LocationType;
  nextPage?: string;
  proxy?: IWebProxy;
  coords?: GeoLocation;
  city?: ListItemInfo;
}

export interface CheckGoodsParams {
  shopping_cart: object | Array<object>;
}

export interface LocationTypePrivilege extends BaseResult {
  locationType?: LocationType;
  locationSalesPermission?: boolean;
  scheduled_enable?: boolean;
  has_ad_permission?: boolean;
  video_original?:boolean;
  article_original?:boolean;
}

export interface ShoppingPrivilege extends BaseResult {
  shopping_cart?: boolean;
  group_shopping?: boolean;
}

export interface MiniAppPrivilege extends BaseResult {
  has_app_permission?: boolean;
}