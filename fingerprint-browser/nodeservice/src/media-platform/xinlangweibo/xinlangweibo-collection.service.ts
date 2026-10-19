import { $http } from '../../http';
import { isJson } from '../../utils';

export const getVideoCollectionResponse = async (
  cookie: string,
  xsrfToken: string,
  page: number = 1,
  source: number = 339644097,
  uid: string = '',
): Promise<XinlangweiboCollectionResponse> => {
  const url = 'https://weibo.com/ajax/multimedia/user_playlists_get';

  const headers = {
    cookie: cookie,
    referer: 'https://weibo.com/upload/channel',
    'X-XSRF-TOKEN': xsrfToken,
  };

  const params = {
    source: source,
    uid: uid,
    playlist_type: 2,
    filter_empty: 'false',
    count: 50,
    page: page ?? 1,
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface XinlangweiboCollectionResponse {
  data: {
    playlists: Array<XinlangweiboCollectionInfo>;
    total_count: number;
  };
  /**
   * 状态码 1:正常，否则异常
   */
  ok: number;
  error: string;
  error_code: number;
}

export interface XinlangweiboCollectionInfo {
  /**
   * 合集id
   */
  id: number;
  /**
   * 合集id字符串
   *
   */
  id_str: string;
  type: string;
  playlist_type: number;
  /**
   * 合集名称
   */
  name: string;
  /**
   * 合集作者
   */
  author: number;
  /**
   * 合集描述
   */
  description: string;
  cover: {
    url: string;
  };
  biz_info: string;
  latest_item_id: number;
  /**
   * 合集下作品数
   */
  item_count: number;
}

export const getToutiaoCollectionResponse = async (
  cookie: string,
  xsrfToken: string,
  uid: string = '',
): Promise<WeiboToutiaoCollectionResponse> => {
  const url = 'https://card.weibo.com/article/v3/aj/editor/collection/listcollection?';

  const headers = {
    cookie: cookie,
    referer: 'https://card.weibo.com/article/v3/editor',
    'X-XSRF-TOKEN': xsrfToken,
  };

  const params = {
    uid: uid,
    type: 1,
    allow_pay: 1,
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface WeiboToutiaoCollectionResponse {
  /**
   * 状态码
   * 100000 正常
   */
  code: number;
  /**
   * 提示消息
   */
  msg: string;
  data: {
    /**
     * 合集列表
     */
    list: Array<WeiboToutiaoCollectionInfo>;
  };
}

export interface WeiboToutiaoCollectionInfo {
  /**
   * 是否免费
   * 1 是
   * 0 否
   */
  allow_free: number;
  /**
   * 当前合下下文章数
   */
  article_num: number;
  /**
   * 购买人数
   */
  buy_count: number;

  /**
   * 合集标题
   */
  title: string;
  /**
   * 封面图
   */
  cover: string;
  created_time: string;
  /**
   * 创建人
   */
  creator: number;
  edited_time: string;
  finished: number;
  follow_num: number;
  id: number;
  sibling: number;
  source: number;
}
