import { $http } from '../../http';
import { GetTimeStamp, Guid, isJson } from '../../utils';

/**
 * 获取活动信息接口
 * @param cookie
 * @param keyWord 搜索关键词，不能为空
 * @param finderUsername 可选参数，默认空
 * @param lastBuff 下一页参数
 * @param uin
 */
export const getActivityListResponse = async (
  cookie: string,
  keyWord: string,
  finderUsername?: string,
  lastBuff: string = '',
  uin: number = 0,
): Promise<ShipinhaoActivityResponse> => {
  const url = 'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/post/post_search_event';

  const headers = {
    cookie: cookie,
    referer: 'https://channels.weixin.qq.com/platform/post/create',
    'X-WECHAT-UIN': uin,
    'finger-print-device-id': Guid.NewGuid().replaceAll('-', ''),
  };

  const postData = {
    query: keyWord ? keyWord : '',
    lastBuff: lastBuff ? lastBuff : '',
    requestId: Guid.NewGuid(),
    timestamp: GetTimeStamp(13),
    _log_finder_uin: '',
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

export interface ShipinhaoActivityResponse {
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
     * 活动数据列表
     */
    eventList: Array<ShipinhaoActivityInfo>;
    /**
     * 翻页下一页参数
     */
    lastBuff: string;
    /**
     * 是否有下一页
     */
    continueFlag: boolean;
  };
}
export interface ShipinhaoActivityInfo {
  /**
   * 活动id
   */
  eventTopicId: string;
  /**
   * 活动名称
   */
  eventName: string;
  /**
   * 活动创作者
   */
  eventCreatorNickname: string;
}
