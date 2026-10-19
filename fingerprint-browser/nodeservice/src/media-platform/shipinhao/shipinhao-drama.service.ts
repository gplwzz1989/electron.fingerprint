import { $http } from '../../http';
import { GetTimeStamp, Guid, isJson } from '../../utils';

/**
 * 获取视频号剧集列表
 * @param cookie
 * @param keyWord 搜索关键词，为空时获取默认剧集列表
 * @param finderUsername 可选，默认空
 * @param pageNum 翻页页码，默认首页为1
 */
export const getDramaListResponse = async (
  cookie: string,
  keyWord: string,
  finderUsername: string,
  pageNum: number = 1,
): Promise<ShipinhaoDramaResponse> => {
  const pageUrl = 'https://channels.weixin.qq.com/micro/content/post/create';
  const url =
    `https://channels.weixin.qq.com/micro/content/cgi-bin/mmfinderassistant-bin/post/search_drama_component?_aid=${Guid.NewGuid()}` +
    `&_rid=${Guid.NewGuid()}&_pageUrl=${encodeURIComponent(pageUrl)}`;

  const headers = {
    referer: pageUrl,
    origin: 'https://channels.weixin.qq.com',
    cookie: cookie,
    'Content-Type': 'application/json',
  };

  const postData = {
    ...(keyWord ? { queryString: keyWord } : {}),
    currentPage: pageNum,
    pageSize: 5,
    sceneType: 3,
    timestamp: GetTimeStamp(13),
    _log_finder_uin: null,
    _log_finder_id: finderUsername,
    rawKeyBuff: '',
    pluginSessionId: null,
    scene: 7,
    reqScene: 7,
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface ShipinhaoDramaResponse {
  /**
   * 状态码
   */
  errCode: number;
  /**
   * 提示消息
   */
  errMsg: string;
  /**
   * 数据体
   */
  data: {
    /**
     * 剧集列表
     */
    list: Array<ShipinhaoDramaInfo>;
    /**
     * 总数量
     */
    totalCount: number;
  };
}

export interface ShipinhaoDramaInfo {
  /**
   * 剧集id
   */
  id: string;
  /**
   * 剧集封面
   */
  coverUrl: string;
  /**
   * 剧集名称
   */
  name: string;
  /**
   * 剧集作品数量
   */
  mediaCount: number;
  /**
   * 是否可用
   */
  usable: boolean;
  /**
   * 不可用原因
   */
  unusableReason: string;
}
