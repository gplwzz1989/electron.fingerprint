import { $http, HttpConfig } from '../../http';
import { ListItemInfoLevel } from '@/media-platform';
const category = [
  { category_id: '1_1', category_name: '推荐', type: 'recommend' },
  { category_id: '7088298745502646280', category_name: '热门榜', type: 'rank' },
  { category_id: '1_2', category_name: '收藏', type: 'fav' },
  { category_id: '7088297994563059748', category_name: '飙升榜', type: 'rank' },
  { category_id: '6854399861215747336', category_name: '原创榜', type: 'rank' },
  { category_id: '7395823327471782694', category_name: '卡点', type: 'category' },
  { category_id: '7397340776264420134', category_name: '纯音乐', type: 'category' },
  { category_id: '7397321654973549338', category_name: '旅行', type: 'category' },
  { category_id: '7395861511152864050', category_name: 'DJ', type: 'category' },
  { category_id: '7397653031963167526', category_name: '搞笑', type: 'category' },
  { category_id: '7397326893978405683', category_name: '流行', type: 'category' },
  { category_id: '7397328346998213386', category_name: '伤感', type: 'category' },
];
/**
 * 获取抖音音乐分类
 */
export const getDouyinMusicCategory = async (): Promise<{
  code: number;
  msg: string;
  dataList: Array<ListItemInfoLevel>;
}> => {
  //https://creator.douyin.com/web/api/media/music/category?cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=5.0+%28Windows+NT+10.0%3B+Win64%3B+x64%29+AppleWebKit%2F537.36+%28KHTML%2C+like+Gecko%29+360%2F4.6.9+Chrome%2F138.0.7204.185+Safari%2F537.36&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&support_h265=1&msToken=8J9nm_u0Sgjga8m7x5linVnn0VjftNLcJ-BRLAaPMyf9Gf3uEjur01K6kGuW5pnghIqj_SZcg5kC78MdJwwiRZQ64mn6u0RSy3KIEfUqYcE-YdZ5KNf4H-booGiKiVnRQ8TEHcv5-qWiCwHiuxWkV2xGdaepnPJL5-eTVklIwI8r&a_bogus=x7U5hwWwDZmnC3MS8cPatXFUAlxANTWyFMToSLwnyPNMcq0blrHygrS3roqImiwULupChFn7dE4%2FOVVc04siZlnpzmpkuuzyxz5I9W8oZqqRGFkQDqjgezzzKwBnURsqe%2FVviAhIgUtq6fVAiqdg%2Fd5Jt%2FKC5cWBP3xjk%2FYcE9Bg1zyAg1clPdbkNXJT0tOX
  const result = category?.map((item) => ({
    yixiaoerId: item.category_id,
    yixiaoerName: item.category_name,
    raw: item,
  }));
  return { code: 0, msg: '', dataList: result };
};

/**
 * 根据分类id获取分类下的音乐
 * @param cookie 账号cookie
 * @param sdkToken
 * @param categoryId  分类id
 * @param cursor 翻页游标，默认首页为0，翻页+20，当返回数据中有更多数据才能翻页
 */
export const getDouyinMusicResponse = async (
  cookie: string,
  categoryId: string = '1_1',
  cursor: number = 0,
  sdkToken: string = '',
): Promise<DouyinMusicResponse> => {
  const categoryINfo = category.find((x) => x.category_id === categoryId);
  categoryId = categoryId?.split('_')[0];

  const url = `https://creator.douyin.com/web/api/media/music/list?cursor=0&category_id=${categoryId}&type=${
    categoryINfo?.type ?? 'category'
  }&count=20&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=${encodeURIComponent(
    HttpConfig.userAgent,
  )}&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&support_h265=1&msToken=&a_bogus=&cursor=${cursor}`;

  const headers = {
    cookie: cookie,
    'x-secsdk-csrf-token': sdkToken,
    referer: 'https://creator.douyin.com/creator-micro/content/publish-media/image-text?enter_from=publish_page',
  };

  const result = await $http.get(url, {
    headers: headers,
  });

  return result?.data;
};

/**
 * 根据关键词搜索音乐
 * @param cookie
 * @param keyWord 关键词
 * @param agwAuth 认证token
 * @param cursor 翻页游标，默认0，翻页+20，当返回数据中有更多数据才能翻页
 */
export const searchDouyinMusicResponse = async (
  cookie: string,
  keyWord: string,
  agwAuth: string,
  cursor: number = 0,
): Promise<DouyinSearchMusicResponse> => {
  const url = `https://tsearch.amemv.com/openapi/aweme/v1/music/search/?aid=1128&count=20&search_source=normal_search&keyword=${encodeURIComponent(
    keyWord,
  )}&cursor=${cursor}&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=${encodeURIComponent(
    HttpConfig.userAgent,
  )}&browser_online=true&timezone_name=Asia%2FShanghai&msToken=&X-Bogus=&_signature=`;

  const headers = {
    cookie: cookie,
    'Agw-Auth': agwAuth,
    referer: 'https://creator.douyin.com/creator-micro/content/publish-media/image-text?enter_from=publish_page',
  };

  const result = await $http.get(url, {
    headers: headers,
  });

  return result?.data;
};

export interface DouyinMusicCategory {
  /**
   * 分类id ，后续查询音乐列表的 categoryId
   */
  id: string;
  /**
   * 分类名称
   */
  name: string;
}

export interface DouyinMusicResponse {
  /**
   * 是否有下一页
   */
  has_more: boolean;
  /**
   * 音乐列表
   */
  songs?: Array<DouyinMusicInfo>;
  /**
   *状态码，0:正常 非0:异常 8:登录失效/未登录
   */
  status_code: number;

  /**
   * 总计数量，不一定有，避免使用
   */
  total?: number;

  /**
   * 提示消息
   */
  status_msg: string;
}
export interface DouyinSearchMusicResponse {
  /**
   * 是否有下一页  1:有下一页,非1:没有下一页
   */
  has_more: number;
  /**
   * 音乐列表
   */
  music: Array<DouyinMusicInfoEx>;
  /**
   *状态码，0:正常 非0:异常 8:登录失效/未登录
   */
  status_code: number;
  /**
   * 提示消息
   */
  status_msg: string;
}

export interface DouyinMusicInfo {
  cover_url: string;
  duration: number;
  music_author: string;
  music_id: string;
  id_str:string,
  id:number,
  music_name: string;
  play_url: string;
  user_count: number;
}
interface DouyinMusicInfoEx {
  /**
   *所属作者昵称
   */
  author: string;
  /**
   *音乐时长/秒
   */
  duration: number;
  /**
   * 音乐id
   */
  id_str: string;
  /**
   * 播放地址
   */
  play_url: { uri: string };
  /**
   * 音乐名称
   */
  title: string;
}
