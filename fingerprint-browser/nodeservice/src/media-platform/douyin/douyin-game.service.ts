import { $http, HttpConfig } from '@/http';

export const getGameListResponse = async (cookie: string, keyWord?: string): Promise<DouYinGameMountResponse> => {
  const url = `https://creator.douyin.com/webcast/gamecp/mount_page/search?game_name=${
    keyWord ?? ''
  }&count=20&scene=1&version_code=24.0.0&aid=2906&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=${encodeURIComponent(
    HttpConfig.userAgent,
  )}&browser_online=true&timezone_name=Asia%2FShanghai&support_h265=1`;
  const headers = {
    cookie: cookie,
    referer: 'https://creator.douyin.com/creator-micro/content/post/video?enter_from=publish_page',
  };
  const result = await $http.get(url, {
    headers: headers,
  });

  return result.data;
};

/**
 * anchor_icon 结构
 */
interface DouYinGameAnchorIcon {
  url_list: string[];
  uri: string;
  height: number;
  width: number;
}

/**
 * game_attr 结构（anchor_content 内嵌的深层字段）
 */
interface DouYinGameAttr {
  game_name: string;
  android_package_version: string;
  android_package_name: string;
  ios_bundle_id: string;
  ios_app_store_id: string;
  game_category: string;
  developer: string;
  sdk_type: string;
  sdk_version: string;
  game_stage: number;
  open_schema: string;
  game_platform: number;
  settle_cloud: number;
}

/**
 * simple_game_info_msg 结构（anchor_content 内嵌）
 */
interface DouYinSimpleGameInfoMsg {
  game_id: string;
  stage: number;
  biz_type: number;
  biz_id: string;
  biz_mode: string;
  game_attr: string; // 实际是 GameAttr 的 JSON 字符串，需解析
  game_extra: string;
}

/**
 * anchor_content 结构
 */
export interface DouYinGameAnchorContent {
  open_url: string;
  anchor_tag: string;
  icon_uri: string;
  anchor_title: string;
  type: number;
  content: string; // 实际是包含 simple_game_info_msg 的 JSON 字符串，需解析
  anchor_id: string;
  from_source: number;
  gamecp_passive_anchor_close_able: number;
}

/**
 * short_video_point 核心结构
 */
export interface DouYinGameShortVideoPoint {
  anchor_business_type: number;
  anchor_icon: DouYinGameAnchorIcon;
  anchor_title: string;
  source: number;
  anchor_id: string;
  anchor_content: string; // 实际是 AnchorContent 的 JSON 字符串，需解析
}

/**
 * 单个游戏信息（包含完整 ShortVideoPoint 类型）
 */
interface DouYinGameGameInfo {
  game_platform: number;
  /**
   * 游戏图标
   */
  icon: string;
  /**
   * 游戏名称
   */
  name: string;
  settle_cloud: number;
  /**
   * 挂载时的主要信息
   */
  short_video_point: string | DouYinGameShortVideoPoint; // 兼容字符串/解析后对象
  stage: number;
  tag_names: string[];
  /**
   * 游戏id
   */
  unified_game_id: string;
}

/**
 * 挂载游戏列表项
 */
interface DouYinGameMountGameItem {
  game_info: DouYinGameGameInfo;
  is_official: boolean;
  supprot_modes: Array<{
    biz_mode: number;
  }>;
}

/**
 * 顶层响应接口
 */
export interface DouYinGameMountResponse {
  data: {
    mount_games: DouYinGameMountGameItem[];
  };
  status_code: number;
  status_msg: string;
}
