import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';

/**
 * 获取好看视频作品列表
 * @param cookie
 * @param status 数据状态（''：全部，'publish‘：已发布，'analyze'：待发布，'rejected'：未通过，'withdraw'：已撤回，'draft'：草稿）
 * @param page 页码
 * @param size 每页数量
 * @param videoType 数据类型 默认0（0是全部，1：视频，3：小视频，6：合集）
 */
export const getContentListAsync = async (
  cookie: string,
  status: '' | 'publish' | 'analyze' | 'rejected' | 'withdraw' | 'draft' = '',
  page: number = 1,
  size: number = 10,
  videoType: 0 | 1 | 3 | 6 = 0,
): Promise<HaokanshipinContentListResponse> => {
  let params: {
    status: string;
    page: number;
    size: number;
    videoType?: unknown;
  } = {
    status: status,
    page: page,
    size: size,
  };

  if (videoType !== 0) {
    params = { ...params, videoType: videoType };
  }

  const result = await $http.get<unknown, AxiosResponse<HaokanshipinContentListResponse>>(
    'https://dream.haokan.com/creator/pccontentlist',
    {
      headers: {
        cookie: cookie,
        referer: 'https://dream.haokan.com/author/production',
        authority: 'dream.haokan.com',
      },
      params,
    },
  );

  // 请求失败
  if (result.data.status !== 0) {
    throw new BadRequestException(result.data?.msg, result.data?.status, result.data);
  }

  return result.data;
};

export interface HaokanshipinMediaContent {
  /**
   * 作品id
   */
  nid: string;

  /**
   * 视频类型
   */
  video_type: string;

  /**
   * 发布时间
   */
  publish_time: string;

  /**
   * 发布时间中文
   */
  publish_time_text: string;

  /**
   * 作品状态
   */
  ucenter_production_status: string;

  /**
   * 作品状态中文
   */
  ucenter_production_status_text: string;

  /**
   * 标题
   */
  title: string;

  /**
   * 封面
   */
  cover_src: string;

  /**
   * 视频时长
   */
  duration: number;

  /**
   * 播放量
   */
  play_cnt: number;

  /**
   * 推荐量
   */
  production_recommend_cnt: number;

  /**
   * 评论数
   */
  comment_cnt: number;

  /**
   * 点赞数
   */
  praise_cnt: number;

  /**
   * 收藏数
   */
  collect_cnt: number;

  /**
   * 分享量
   */
  share_cnt: number;
}

export interface HaokanshipinContentListResponse {
  status: number;
  msg: string;
  data: {
    user_role: string;
    pageNum: number;
    list: Array<HaokanshipinMediaContent>;
  };
}
