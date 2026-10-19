import { $http } from '../../http';
import { isJson } from '../../utils';

export const getVideoActivityResponse = async (
  cookie: string,
  categoryName: string = '推荐',
): Promise<ToutiaohaoVideoActivityResponse> => {
  const url = 'https://mp.toutiao.com/xigua/api/activity/user-activity-list-v2/';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.toutiao.com/profile_v4/xigua/upload-video',
  };

  const params = {
    params: `{"offset":0,"limit":9,"category":"${categoryName ?? '推荐'}","act_status":2,"part_status":0}`,
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

export interface ToutiaohaoVideoActivityResponse {
  /**
   * 活动数据
   */
  data: {
    /**
     * 活动列表
     */
    Activities: Array<ToutiaohaoVideoActivityInfo>;
    /**
     * 活动数量
     */
    ActivityNum: 1;
  };
  /**
   * 提示消息
   */
  message: string;
}

export interface ToutiaohaoVideoActivityInfo {
  /**
   * 状态，暂时不知道具体意义，正常是2
   */
  status: number;
  /**
   * 奖金总额/元
   */
  max_award: number;
  /**
   * 活动id，发布使用参数
   */
  activity_id: number;
  /**
   * 活动开始时间，10位时间戳
   */
  activity_start_time: number;
  /**
   * 活动结束时间
   */
  activity_end_time: number;
  /**
   * 活动标题
   */
  title: string;
  introduction?: string;
  part_in: number;
  entry_picture: string;
  is_inprocess: number;
  /**
   * 活动详情链接
   */
  href: string;
  activity_image_url: string;
  activity_creator: string;
  fresh: number;
  /**
   * 活动起止日期
   */
  activity_time: string;
  echo_url: string;
  /**
   *  参与人数
   */
  part_num: number;
}
