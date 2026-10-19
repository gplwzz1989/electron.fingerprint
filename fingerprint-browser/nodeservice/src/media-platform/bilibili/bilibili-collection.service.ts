import { $http } from '@/http';
import { isJson } from '@/utils';

export const getVideoCollectionResponse = async (
  cookie: string,
  page: number = 1,
): Promise<BiliBiliCollectionListResponse> => {
  const url = `https://member.bilibili.com/x2/creative/web/seasons?pn=${
    page ?? 1
  }&ps=50&order=desc&sort=mtime&filter=1&t=${Date.now()}`;

  const headers = {
    cookie: cookie,
    Referer: 'https://member.bilibili.com/platform/upload/video/frame',
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

/**
 * 获取B站权益信息（包含合集权限等）
 * @param cookie
 */
export const getBilibiliEquityResponse = async (cookie: string): Promise<BilibiliRatingIndexResponse> => {
  const url = 'https://api.bilibili.com/studio/up-rating/v4/rating/index?plat=web&web_location=333.1402';

  const headers = {
    cookie: cookie,
    Referer: 'https://member.bilibili.com/',
  };

  const result = await $http.get(url, {
    headers: headers,
  });

  return result.data;
};

/** B站权益信息响应 */
export interface BilibiliRatingIndexResponse {
  code: number;
  message: string;
  ttl: number;
  data: {
    mid: number;
    name: string;
    fans: number;
    credit: number;
    level: number;
    face: string;
    equity: {
      list: Array<{
        name: string;
        equity_name: string;
        icon: string;
        credit: number;
        state: number; // 0=未开通 1=已开通
        level: number;
        detail: {
          url: string;
          condition: string;
          desc: string;
          reason: string;
          extra: unknown;
          flag: number;
          button_text: string;
          short_desc: string;
          is_new: boolean;
        };
      }>;
    };
  };
}

/** 合集列表返回数据 - 合并版完整接口定义 */
export interface BiliBiliCollectionListResponse {
  code: number;
  message: string;
  ttl: number;
  data: {
    seasons: Array<{
      season: {
        id: number;
        title: string;
        desc: string;
        cover: string;
        isEnd: 0 | 1; // 是否完结，0=未完结 1=完结
        mid: number; // UP主mid
        isAct: 0 | 1; // 是否活动相关
        is_pay: 0 | 1; // 是否付费
        state: number; // 状态码
        partState: number;
        signState: number;
        rejectReason: string; // 驳回原因
        ctime: number; // 创建时间戳(秒)
        mtime: number; // 修改时间戳(秒)
        no_section: 0 | 1; // 是否无分节
        forbid: 0 | 1; // 是否封禁
        protocol_id: string;
        ep_num: number; // 剧集数
        season_price: number; // 合集价格
        is_opened: 0 | 1; // 是否开启
        has_charging_pay: 0 | 1; // 是否有充电付费
        has_pugv_pay: 0 | 1; // 是否有PUGV付费
        SeasonUpfrom: number; // 合集来源
      };
      course: null; // 固定返回null
      checkin: {
        status: number; // 签到状态
        status_reason: string; // 签到状态原因
        season_status: number; // 合集签到状态
      };
      seasonStat: {
        view: number; // 播放量
        danmaku: number; // 弹幕数
        reply: number; // 评论数
        fav: number; // 收藏数
        coin: number; // 投币数
        share: number; // 分享数
        nowRank: number; // 当前排名
        hisRank: number; // 历史排名
        like: number; // 点赞数
        subscription: number; // 订阅数
        vt: number; // 视频播放相关统计
      };
      sections: {
        sections: Array<{
          id: number;
          type: number; // 分节类型
          seasonId: number; // 所属合集id
          title: string; // 分节标题
          order: number; // 排序号
          state: number; // 状态码
          partState: number;
          rejectReason: string; // 驳回原因
          ctime: number; // 创建时间戳(秒)
          mtime: number; // 修改时间戳(秒)
          epCount: number; // 该分节剧集数
          cover: string; // 分节封面
          has_charging_pay: 0 | 1; // 是否有充电付费
          Episodes: null; // 固定返回null
          show: 0 | 1; // 是否展示
          has_pugv_pay: 0 | 1; // 是否有PUGV付费
        }>;
      };
      part_episodes: null; // 固定返回null
    }>;
    tip: {
      title: string;
      url: string;
    };
    total: number; // 合集总数
    play_type: number; // 播放类型
  };
}
