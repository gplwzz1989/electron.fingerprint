import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { isJson } from '../../utils';

/**
 * 头条号图文合集列表
 * @param cookie
 * @param user_id 用户id
 * @param page_num 页码
 * @param page_size 每页数量
 */
export const getArticleCollectionAsync = async (
  cookie: string,
  user_id: number,
  page_num: number,
  page_size: number,
): Promise<ToutiaohaoArticleCollectionResponse> => {
  const result = await $http.get<unknown, AxiosResponse<ToutiaohaoArticleCollectionResponse>>(
    'https://mp.toutiao.com/mp/fe_api/collection/list',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.toutiao.com/profile_v4/graphic/publish',
        authority: 'mp.toutiao.com',
      },
      params: {
        user_id: user_id,
        page_num: page_num,
        page_size: page_size,
        need_sub_item_count: true,
        item_status_list: '40,20,25,15,10,7,9',
      },
    },
  );

  // 请求失败
  if (result.data.code !== 0) {
    throw new BadRequestException(result.data?.message, result.data?.code, result.data);
  }

  return result.data;
};

export interface ToutiaohaoArticleCollectionResponse {
  data: Array<{
    /**
     * 合集id
     */
    id: string;
    collection_attr: {
      /**
       * 合集内容标题
       */
      title: string;

      /**
       * 内容封面信息
       */
      cover_image: {
        url: string;
        uri: string;
        width: number;
        height: number;
        mime_type: string;
      };

      /**
       * 合集内容状态
       */
      item_status: number;
      visibility_level: number;

      /**
       * 创建时间
       */
      create_time: string;
      suppress_reason: string;

      /**
       * 用户id
       */
      user_id: string;
    };
    collection_stat: {
      impression_count: string;
      go_detail_count: string;
      repin_count: string;
      forward_count: string;
    };
    sub_item_count: number;
    item_status_desc: string;
  }>;
  total_count: string;
  code: number;
  message: string;
}

/**
 * 获取视频合集
 * @param cookie
 * @param offset 翻页参数，合集索引值，默认0
 */
export const getVideoCollectionResponse = async (
  cookie: string,
  offset: number = 0,
): Promise<ToutiaohaoVideoCollectionResponse> => {
  const url = 'https://mp.toutiao.com/xigua/api/pSeries/simpleGetAlbumInfoByMediaId/';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.toutiao.com/profile_v4/xigua/upload-video',
  };

  const params = {
    params: `{"Limit":0,"Offset":${offset},"SortType":1}`,
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

export interface ToutiaohaoVideoCollectionResponse {
  /**
   * 状态码 0:正常，非0异常
   */
  status: number;
  /**
   * 合集key-value列表（非数组形式）
   */
  data: {
    /**
     * key,合集id
     */
    [key: string]: ToutiaohaoVideoCollectionInfo;
  };
  /**
   * 提示消息
   */
  message?: string;
}
export interface ToutiaohaoVideoCollectionInfo {
  /**
   * 合集id
   */
  collectionId: string;
  /**
   * 审核状态，咱不知道什么用
   */
  AuditStatus: number;
  /**
   * 合集名称
   */
  Title: string;
  /**
   * 合集内内容数
   */
  SeqsCount: number;
  /**
   * 合集封面url
   */
  CoverUrl: string;
  /**
   * 合集封面uri
   */
  CoverUri: string;
  CoverHeight: number;
  CoverWidth: number;
}
