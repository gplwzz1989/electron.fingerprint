import { getNewSign } from '@/media-platform/xiaohongshu/xiaohongshu-base.service';
import { $http } from '@/http';

export const getActivityTopicResponse = async (cookie: string): Promise<XiaohongshuActivityListResponse> => {
  const urlPath = `/api/galaxy/v2/creator/activity_center/list?sort=1&type=1&source=3&topic_activity=1`;

  const url = `https://creator.xiaohongshu.com${urlPath}`;

  const signStr = await getNewSign(urlPath, undefined);

  if (!signStr) {
    return { code: 401, msg: '签名失败，稍后重试' } as XiaohongshuActivityListResponse;
  }
  const sign = JSON.parse(signStr);
  if (sign['a1']) {
    cookie = `${cookie};a1=${sign['a1']}`;
  }
  const headers = {
    cookie: cookie,
    referer: 'https://www.xiaohongshu.com',
  };
  headers['X-s'] = sign['X-s'];
  headers['X-t'] = sign['X-t'];

  const result = await $http.get(url, { headers: headers });

  return result.data;
};
/**
 * 小红书创作者活动中心-活动列表响应数据结构
 */
export interface XiaohongshuActivityListResponse {
  success: boolean;
  msg: string;
  data: {
    activity_list: Array<{
      page_id: string;
      activity_id: number;
      activity_reward: string;
      picture_link: string;
      activity_link: string;
      capa_deep_link: string;
      pc_post_link: string;
      instance_id: number;
      start_time: number; // 毫秒级时间戳
      end_time: number; // 毫秒级时间戳
      topic_infos: Array<{
        id: string;
        name: string;
        link: string;
      }>;
      activity_name: string;
      focus_status: number;
      activity_status: number;
      sort_score: string;
    }>;
    focus_total: number;
  };
  code: number;
}
