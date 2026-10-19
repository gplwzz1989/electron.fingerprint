import { $http } from '../../http';
import { GetTimeStamp, isJson } from '../../utils';

/**
 * 获取内容列表
 * @param cookie
 * @param finderUsername 可选,默认空
 * @param pageNum 翻页参数，可选,默认1
 * @param rawKeyBuff
 */
export const getVideoList = async (
  cookie: string,
  finderUsername: string,
  pageNum: number = 1,
  rawKeyBuff: string | null = null,
): Promise<ShipinhaoVideoListResponse> => {
  const url = 'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/post/post_list';

  const headers = {
    cookie: cookie,
    referer: 'https://channels.weixin.qq.com/platform/post/list',
  };

  const postData = {
    pageSize: 20,
    currentPage: pageNum,
    timestamp: GetTimeStamp(13),
    _log_finder_uin: null,
    _log_finder_id: finderUsername,
    rawKeyBuff: rawKeyBuff,
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

export interface ShipinhaoVideoListResponse {
  /**
   * 错误码
   */
  errCode: number;
  /**
   * 提示信息
   */
  errMsg: string;

  data?: {
    /**
     * 当前页视频列表
     */
    list?: Array<ShipinhaoVideoInfo>;
    /**
     * 视频总量
     */
    totalCount: number;
  };
}

export interface ShipinhaoVideoInfo {
  /**
   *  内容id，docid
   */
  objectId: string;
  /**
   * 创建事件,时间戳，10位
   */
  createTime: number;
  /**
   * 点赞数
   */
  likeCount: number;
  /**
   * 评论数
   */
  commentCount: number;
  /**
   * 播放/阅读数
   */
  readCount: number;
  /**
   * 转发数
   */
  forwardCount: number;
  /**
   * 收藏数
   */
  favCount: number;
  /**
   * 是否关闭了评论
   */
  commentClose: number;
  /**
   * 可见类型
   */
  visibleType: number;
  /**
   * 状态
   */
  status: number;

  /**
   * 定时发布时间
   */
  effectiveTime: number;
  desc: {
    media: Array<{
      /**
       * 视频播放url
       */
      url: string;
      /**
       * 封面
       */
      thumbUrl: string;
      /**
       * 封面
       */
      fullThumbUrl: string;
      mediaType: number;
      videoPlayLen: number;
      width: number;
      height: number;
      md5sum: string;
      /**
       * 封面
       */
      coverUrl: string;
    }>;
    description: '';
    mediaType: number;
  };
  objectNonce: string;
  permissionFlag: number;
  exportId: string;
  followCount: number;
  /**
   * 视频处理进度,1:转码中 2:转码完成定时发布,5:转码失败
   */
  handleStatus?: number;
}
