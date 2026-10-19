import { GetTimeStamp, isJson } from '../../utils';
import { $http } from '../../http';

/**
 * 获取合集信息
 * @param cookie
 * @param finderUsername
 * @param pageNum
 */
export const getCollectionListResponse = async (
  cookie: string,
  finderUsername: string,
  pageNum: number = 1,
): Promise<ShipinhaoCollectionResponse> => {
  const url = 'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/collection/get_collection_list';

  const headers = {
    cookie: cookie,
  };
  const postData = {
    pageNum: pageNum,
    pageSize: 20,
    timestamp: GetTimeStamp(13),
    _log_finder_uin: null,
    _log_finder_id: finderUsername,
    rawKeyBuff: null,
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

export interface ShipinhaoCollectionResponse {
  /**
   * 状态码
   * -0正常 非0异常
   */
  errCode: number;
  /**
   * 提示消息
   */
  errMsg: string;
  /**
   * 数据体
   */
  data?: {
    /**
     * 合集数据列表
     */
    collectionList: Array<ShipinhaoCollectionInfo>;

    /**
     *合集数量
     */
    collectionListCount: number;

    baseResp: {
      // noinspection SpellCheckingInspection
      errcode: number;
    };
  };
}
export interface ShipinhaoCollectionInfo {
  /**
   * 合集id
   */
  id: string;
  /**
   * 合集名称
   */
  name: string;
  /**
   * 合集描述
   */
  desc?: '';
  /**
   * 合集封面
   */
  coverImgUrl?: string;
  /**
   * 创建时间戳
   */
  createTime?: number;
  /**
   * 阅读数
   */
  totalReadCount?: string;
  /**
   * 作品数
   */
  feedCount?: number;
}
