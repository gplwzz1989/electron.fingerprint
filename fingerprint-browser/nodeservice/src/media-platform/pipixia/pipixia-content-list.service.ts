import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { PipixiaDataOverviewResponse } from '@/media-platform/pipixia/pipixia-data-overview.service';
import { pipixiaBdms } from './pipixia-bdms-runtime';

const PPX_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.7204.185 Safari/537.36';

/**
 * 获取皮皮虾投稿列表
 * @param cookie
 * @param status 数据类型（1：已通过，2：审核中，3：未通过）
 * @param offset 分页起始数据，（页码-1）*每页数量
 * @param count 每页数量
 *
 * 说明：item_list 需要有效的 a_bogus 反爬签名，外部签名服务已无法生成，
 * 改用本地 bdms 运行时(pipixiaBdms)注入 a_bogus。参数顺序需与签名时保持一致，
 * 且必须使用 pipix.com 域名(mp.pipix.com 亦可，但统一用 pipix.com)。
 */
export const getContentListAsync = async (
  cookie: string,
  status: 1 | 2 | 3,
  offset: number,
  count: number = 10,
): Promise<PipixiaContentListResponse> => {
  // 参数顺序与浏览器一致：status、offset、count、media_type，a_bogus 由 bdms 追加到末尾
  const queryStr = `/api/mp/bds/webapi/item_list/?status=${status}&offset=${offset}&count=${count}&media_type=3`;

  const doRequest = async (): Promise<AxiosResponse<PipixiaContentListResponse>> => {
    const signedPath = await pipixiaBdms.signUrl(queryStr);
    const url = signedPath.startsWith('http') ? signedPath : `https://pipix.com${signedPath}`;
    return $http.get<unknown, AxiosResponse<PipixiaContentListResponse>>(url, {
      headers: {
        cookie: cookie,
        referer: 'https://pipix.com/mp/upload?status=pass',
        'User-Agent': PPX_UA,
        accept: 'application/json, text/plain, */*',
      },
    });
  };

  let result = await doRequest();
  // 空响应通常意味着 a_bogus 被拒(token 失效)，重置运行时后重试一次
  if (!result.data || (result.data as unknown as string) === '') {
    pipixiaBdms.reset();
    result = await doRequest();
  }

  return result.data;
};

export interface PipixiaMediaContent {
  /**
   * 作品id
   */
  item_id: number;

  /**
   * 作品id（字符串类型）
   */
  item_id_str: string;

  /**
   * 发布时间
   */
  create_time: number;

  /**
   * 状态 （1已发布，2审核中，3未通过）
   */
  status: number;

  /**
   * 标题
   */
  content: string;

  /**
   * 封面信息
   */
  cover: {
    url_list: Array<{
      url: string;
    }>;
  };
  share: {
    douyin_url: string;
  };
  stats: {
    go_detail_count: number;
    impression_count: number;

    /**
     * 评论数
     */
    comment_count: number;

    /**
     * 点赞数
     */
    like_count: number;

    /**
     * 分享数
     */
    share_count: number;

    /**
     * 播放量
     */
    play_count: number;
    dubbing_count: number;
    bury_count: number;
    bullet_count: number;
    view_count: number;
    reward_count: number;
  };

  /**
   * 视频时长
   */
  duration: number;
}

export interface PipixiaContentListResponse {
  status_code: number;
  message: string;
  prompt: string;
  time: number;
  data: {
    total: number;
    items: Array<PipixiaMediaContent>;
  };
}
