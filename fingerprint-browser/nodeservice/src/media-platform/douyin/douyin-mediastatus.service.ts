import { $http, HttpConfig } from '../../http';
import { auditStatusEnum, isJson } from '../../utils';

export const getMediaStatus = async (
  cookie: string,
  publishId: string,
  maxPage: number = 10,
): Promise<DouyinVideoStatusResultOutput> => {
  let pubCursor = 0;
  let audCursor = 0;
  let denyCursor = 0;
  let videoList: douyinVideoListInfo | undefined = undefined;
  for (let i = 0; i < maxPage; i++) {
    //已发布
    videoList = await getVideoList(cookie, pubCursor, 1);
    if (videoList?.aweme_list?.length > 0) {
      if (videoList?.has_more) {
        pubCursor = videoList.max_cursor;
      }
      for (const item of videoList.aweme_list) {
        // noinspection SpellCheckingInspection
        const awemeId = item?.aweme_id;
        if (awemeId === publishId) {
          const result = {
            code: 0,
            msg: '',
            auditStatus: auditStatusEnum.published,
            create_time: item.create_time,
            docId: item.aweme_id,
            publishId: publishId,
            data: item,
            openUrl: item.share_url,
            coverUrl: item.Cover?.url_list[0],
          };
          if (item?.status_value == 144) {
            result.auditStatus = auditStatusEnum.deny;
          }
          if (item?.timer?.status == 0) {
            result.auditStatus = auditStatusEnum.prePublish;
          }
          return result as DouyinVideoStatusResultOutput;
        }
      }
    }
    //审核中
    videoList = await getVideoList(cookie, audCursor, 2);
    if (videoList?.aweme_list?.length > 0) {
      if (videoList?.has_more) {
        audCursor = videoList.max_cursor;
      }
      for (const item of videoList.aweme_list) {
        // noinspection SpellCheckingInspection
        const awemeId = item?.aweme_id;
        if (awemeId === publishId) {
          const result = {
            code: 0,
            msg: '',
            auditStatus: auditStatusEnum.inAudit,
            docId: item.aweme_id,
            publishId: publishId,
            create_time: item.create_time,
            data: item,
            coverUrl: item.Cover?.url_list[0],
          };

          if (item?.status_value == 144) {
            result.auditStatus = auditStatusEnum.deny;
          }
          if (item?.timer?.public_time) {
            result.auditStatus = auditStatusEnum.prePublish;
          }
          return result as DouyinVideoStatusResultOutput;
        }
      }
    }
    //未通过
    videoList = await getVideoList(cookie, denyCursor, 3);
    if (videoList?.aweme_list?.length > 0) {
      if (videoList?.has_more) {
        denyCursor = videoList.max_cursor;
      }
      for (const item of videoList.aweme_list) {
        // noinspection SpellCheckingInspection
        const awemeId = item?.aweme_id;
        if (awemeId === publishId) {
          const result = {
            code: 0,
            msg: '',
            auditStatus: auditStatusEnum.deny,
            docId: item.aweme_id,
            publishId: publishId,
            create_time: item.create_time,
            data: item,
            coverUrl: item?.Cover?.url_list[0],
          };
          if (item?.status_value == 144) {
            result.auditStatus = auditStatusEnum.deny;
          }
          return result as DouyinVideoStatusResultOutput;
        }
      }
    }
  }
  return {
    code: videoList?.status_code ?? 404,
    msg: `未找到作品`,
    create_time: 0,
    publishId: publishId,
  };
};

export interface DouyinVideoStatusResultOutput {
  /**
   * 结果状态
   */
  code: number;

  /**
   * 提示信息
   */
  msg: string;

  /**
   * 发布产生的id
   */
  publishId: string;

  /**
   * 作品唯一id
   */
  docId?: string;

  /**
   * 公开访问url
   */
  openUrl?: string;

  /**
   * 封面url
   */
  coverUrl?: string;
  /**
   * 审核状态
   */
  auditStatus?: auditStatusEnum;
  /**
   * 作品创建时间
   */
  create_time?: number;

  /**
   * 视频信息
   */
  data?: douyinVideoInfo;
}

const getVideoList = async (cookie: string, cursor: number, status: number = 0): Promise<douyinVideoListInfo> => {
  const headers = {
    cookie: cookie,
    referer: 'https://creator.douyin.com/creator-micro/content/manage',
  };
  const url = `https://creator.douyin.com/web/api/media/aweme/post/?scene=star_atlas&status=${status}&count=12&max_cursor=${cursor}&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=${encodeURIComponent(
    HttpConfig.userAgent,
  )}&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&msToken=`;
  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });
  return result.data;
};

export interface douyinVideoListInfo {
  // noinspection SpellCheckingInspection
  aweme_list: Array<douyinVideoInfo>;
  /**
   * 索引下标
   */
  max_cursor: number;
  cursor: number;
  /**
   * 是否还有更多
   */
  has_more: number;
  /**
   * 响应状态码
   */
  status_code: number;

  /**
   *  提示消息
   */
  status_msg?: number;
}

export interface douyinVideoInfo {
  Cover: {
    /**
     *  封面列表
     */
    url_list: Array<string>;
  };
  /**
   * 作者id
   */
  author_user_id: string;
  // noinspection SpellCheckingInspection
  /**
   * 作品id
   */
  aweme_id: string;

  /**
   * 发布时间
   */
  create_time: number;
  /**
   * 描述
   */
  desc: string;
  /**
   * 时长/毫秒
   */
  duration: number;

  group_id: string;

  item_id: string;

  review_struct: {
    /**
     * 审核状态
     */
    status: number;
    /**
     * 状态说明
     */
    status_desc: string;
  };
  /**
   * 作品url地址
   */
  share_url: string;
  /**
   * 审核状态
   * -144不适宜公开/审核未通过
   * -143 140 私密/好友可见
   */
  status_value: number;

  status: {
    /**
     * 1和2表示非公开的视频 私密/好友可见
     */
    private_status: number;
  };
  timer: {
    public_time: number;
    /**
     * 定时状态
     * -0：定时中
     */
    status: number;
  };
}
