import { getXsrfToken } from './xinlangweibo-base.service';
import { $http } from '@/http';

export const getWeiBoVideoCategoryResponse = async (cookie: string): Promise<WeiBoCategoryListResponse> => {
  const xsrfToken = getXsrfToken(cookie) ?? '';
  const url = `https://weibo.com/aj/video/getchannellist?ajwvr=6&__rnd=${Date.now()}`;
  const result = await $http.get(url, {
    headers: {
      cookie: cookie,
      referer: `https://weibo.com`,
      'x-requested-with': 'XMLHttpRequest',
      'X-XSRF-TOKEN': xsrfToken,
    },
  });

  return result.data;
};

/**
 * 渠道/分类列表响应数据结构
 */
export interface WeiBoCategoryListResponse {
  code: string;
  msg: string;
  data: {
    list: Array<{
      sub_channels: Array<{
        name: string;
        sub_channel_id: number;
        sub_channel_id_str: string;
        desc: string;
        tags: Array<never>; // 空数组（无元素）
        supported_video_type: string[];
      }>;
      channel_id: number;
      channel_id_str: string;
      desc: string;
    }>;
    social_video_watermark: null; // 明确为null类型
  };
}
