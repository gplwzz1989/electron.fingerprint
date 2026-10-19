import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { isJson } from '../../utils';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 头条号作品管理
 * @param cookie
 * @param page 页码
 * @param pageSize 每页数量
 * @param status 内容状态（8：全部，2：已通过，1：审核中，3：未通过，4：仅我可见）
 * @param proxyAgent
 */
export const getContentListAsync = async (
  cookie: string,
  page: number,
  pageSize: number,
  status: 8 | 2 | 1 | 3 | 4 = 2,
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<ToutiaohaoContentListResponse> => {
  const url = `https://mp.toutiao.com/mp/agw/creator_center/list?type=0&status=${status}&start_cursor=0&end_cursor=0&total_end_cursor=0&size=${pageSize}&mode=2&need_stat=true&wenda_type=1&page_time=%7B%22index%22%3A${page}%2C%22time_stamp%22%3A0%7D&filter_params=%7B%22search_word%22%3A%22%22%2C%22source%22%3A0%7D&wtt_need_comment=true&app_id=1231`;
  const result = await $http.get<unknown, AxiosResponse<ToutiaohaoContentListResponse>>(url, {
    headers: {
      cookie: cookie,
      referer: 'https://mp.toutiao.com/profile_v4/manage/content/all',
      authority: 'mp.toutiao.com',
      'Content-Type': 'application/json',
    },
    params: {},
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  // 请求失败
  if (result.data.code !== 0) {
    throw new BadRequestException(result.data?.message, result.data?.code, result.data);
  }

  return result.data;
};

export interface ToutiaohaoMediaContent {
  article_attr: {
    article_type: string;
    comment_status: number;

    /**
     * 封面信息
     */
    cover_image: {
      image_url: string;
    };

    /**
     * 发布时间
     */
    create_time: number;

    /**
     * 时长
     */
    duration: number;

    /**
     * 作品id
     */
    item_id: string;
    rich_title: string;
    show_time: number;

    /**
     * 状态
     */
    status: number;

    /**
     * 状态描述
     */
    status_desc: string;

    /**
     * 标题
     */
    title: string;

    /**
     * 数据类型
     */
    type: number;

    /**
     * 数据类型描述
     */
    type_desc: string;
  };
  article_stat: {
    /**
     * 回答数
     */
    answer_count: number;

    /**
     * 评论数
     */
    comment_count: number;
    counters: Array<{
      Count: number;
      Name: string;
    }>;

    /**
     * 点赞数
     */
    digg_count: number;
    go_detail_count: number;

    /**
     * 展现量
     */
    impression_count: number;

    /**
     * 播放量
     */
    play_count: number;
    repin_count: number;
  };
}

export interface ToutiaohaoContentListResponse {
  code: number;
  contents: Array<ToutiaohaoMediaContent>;
  count: number;
  end_cursor: number;
  has_more: boolean;
  message: string;
  total_count: number;
}

/**
 * 头条号文章，横版视频作品管理
 * @param cookie
 * @param page 页码 首页为1，往后+1
 * @param pageSize 每页数量 默认10
 * @param uid 用户id
 * @param status 内容状态（8：全部，2：已通过，1：审核中，3：未通过，4：仅我可见）
 * @param category 类型，支持全部（包含所有类型），图文，横版视频，不支持竖版视频（小视频）
 * @param keyword 搜索关键字
 * @param start 开始日期
 * @param end 结束日期
 * @param proxyAgent
 */
export const getNewContentListAsync = async (
  cookie: string,
  page: number,
  pageSize: number = 10,
  uid: number = 0,
  status: 8 | 2 | 1 | 3 | 4 = 2,
  category: 'mp_all' | 'mp_videos' | 'mp_article' = 'mp_all',
  keyword?: string | '',
  start?: number,
  end?: number,
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<ToutiaohaoContentListNewResponse> => {
  const url = 'https://mp.toutiao.com/api/feed/mp_provider/v1/';

  const params = {
    provider_type: 'mp_provider',
    aid: 13,
    app_name: 'news_article',
    category: category,
    stream_api_version: 88,
    genre_type_switch: JSON.stringify({
      repost: 1,
      small_video: 1,
      toutiao_graphic: 1,
      weitoutiao: 1,
      xigua_video: 1,
    }),
    device_platform: 'pc',
    platform_id: 0,
    visited_uid: uid,
    offset: (page - 1) * pageSize,
    count: pageSize,
    keyword: keyword,
    client_extra_params: JSON.stringify({
      category: 'mp_all',
      real_app_id: '1231',
      need_forward: 'true',
      offset_mode: '1',
      page_index: page,
      status: status,
      source: '0',
      start_cursor_ms: start,
      end_cursor_ms: end,
    }),
    app_id: 1231,
  };

  const result = await $http.get<unknown, AxiosResponse<ToutiaohaoContentListNewResponse>>(url, {
    headers: {
      cookie: cookie,
      referer: 'https://mp.toutiao.com/profile_v4/manage/content/all',
      authority: 'mp.toutiao.com',
      'Content-Type': 'application/json',
    },
    params: params,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  // 请求失败
  if (result.data.errno != 20100 || result.data.message != 'success') {
    throw new BadRequestException(result.data.message, result.data.errno, result.data);
  }

  return result.data;
};

export interface ToutiaohaoNewMediaContent {
  dataType: number;
  assembleCell: {
    itemCell: {
      articleBase: {
        groupID: number;
        abstractText: string;
        articleURL: string;
        subTitle: string;
        gidStr: string;
        publishTime: number;
        displayURL: string;
        displayFlags: string;
        title: string;
        content: string;
        schema: string;
        createTime: number;
        itemStatus: number;
        visibilityLevel: number;
      };
      cellCtrl: {
        dspStyle: null;
      };
      shareInfo: {
        shareURL: string;
      };
      itemCounter: {
        /**
         *  评论
         */
        commentCount: number;
        /**
         * 点赞
         */
        diggCount: number;
        /**
         * 阅读/播放
         */
        readCount: number;
        /**
         * 展现
         */
        showCount: number;
        repinCount: number;
        videoWatchCount: number;
      };
      extra: {
        answer_count: string;
        origin_content: string;
      };
      containsElements: {
        hasVideo: boolean;
        hasImage: boolean;
      };
      articleClassification: {
        bizTag: number;
        articleType: number;
        articleSubType: number;
        groupSource: number;
        bizID: number;
        isSubject: boolean;
        isStick: boolean;
        isOriginal: boolean;
      };
      imageList: {
        staggerFeedCover: [
          {
            url: string;
            width: number;
            uri: string;
            height: number;
          },
        ];
        thumbImageList: [
          {
            height: number;
            url: string;
            width: number;
            uri: string;
          },
        ];
      };
      richContentInfo: {
        titleRichSpan: string;
        richContent: string;
      };
    };
    behotTime: number;
    cursor: number;
    rid: string;
  };
  code: string;
}

export interface ToutiaohaoContentListNewResponse {
  data: Array<ToutiaohaoNewMediaContent>;
  sub_entrance_list: [];
  errno: number;
  message: string;
  total_number: number;
  has_more: boolean;
  login_status: number;
  show_et_status: number;
  post_content_hint: string;
  has_more_to_refresh: boolean;
  action_to_last_stick: number;
  sub_entrance_style: number;
  feed_flag: number;
  follow_recommend_tips: string;
  hide_topcell_count: number;
  is_use_bytedance_stream: boolean;
  get_offline_pool: boolean;
  api_base_info: {
    info_type: number;
    app_extra_params: string;
  };
  show_last_read: boolean;
  last_response_extra: {
    data: string;
  };
  offset: number;
  tail: string;
  extra: string;
}

/**
 * 获取头条文章列表
 * @param cookie
 * @param page
 * @param pageSize
 * @param status
 */
export const getArticleContentListAsync = async (
  cookie: string,
  page: number,
  pageSize: number,
  status: 8 | 2 | 1 | 3 | 4 = 2,
): Promise<ToutiaohaoArticleContentListResponse> => {
  const url = `https://mp.toutiao.com/mp/agw/creator_center/list?type=2&status=${status}&start_cursor=0&end_cursor=0&size=${pageSize}&mode=2&need_stat=true&page_time=%7B%22index%22%3A${page}%2C%22time_stamp%22%3A%220%22%7D&filter_params=%7B%22search_word%22%3A%22%22%2C%22source%22%3A0%7D&app_id=1231
`;
  const result = await $http.get<unknown, AxiosResponse<ToutiaohaoArticleContentListResponse>>(url, {
    headers: {
      cookie: cookie,
      referer: 'https://mp.toutiao.com/profile_v4/manage/content/all',
      authority: 'mp.toutiao.com',
    },
    params: {},
  });

  // 请求失败
  if (result.data.code !== 0) {
    throw new BadRequestException(result.data?.message, result.data?.code, result.data);
  }

  return result.data;
};

/**
 * 获取小视频列表
 * @param cookie
 * @param endCursor 下一页参数
 * @param totalEndCursor 不知道什么意义
 * @param status 0:全部 1:审核中 2:已发布 3:未通过 4:仅我可见
 * @param proxyAgent
 */
export const getMiniVideoContentListResponse = async (
  cookie: string,
  endCursor: number = 0,
  totalEndCursor: number = 0,
  status: 0 | 2 | 1 | 3 | 4 = 0,
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<ToutiaohaoArticleContentListResponse> => {
  const url = 'https://mp.toutiao.com/mp/agw/creator_center/list';

  const headers = {
    cookie: cookie,
    referer: '',
  };

  const params = {
    type: 4,
    status: status,
    size: 20,
    mode: 1,
    need_stat: true,
    total_end_cursor: totalEndCursor,
    end_cursor: endCursor,
    start_cursor: 0,
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    params: params,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface ToutiaohaoArticleMediaContent {
  article_attr: {
    action_urls: {
      [key: string]: { click_cell: string; share: string };
    };
    abstract: string;
    article_type: string;
    comment_status: number;
    cover_image: {
      height: number;
      image_uri: string;
      image_url: string;
      width: number;
    };
    create_time: number;
    duration: number;
    extra: {
      WordCnt: string;
      display_flags: string;
      impr_id: string;
      sub_titles: string;
      user_name: string;
    };
    gid: string;
    group_source: number;
    image_cnt: number;
    is_exclusive: boolean;
    is_gallery: boolean;
    is_question: boolean;
    item_id: string;
    leader_sensitive: boolean;
    menu_list: {
      forbid_boost_reason: string;
      forbid_change_ads_reason: string;
      forbid_delete_reason: string;
      forbid_hide_reason: string;
      forbid_modify_reason: string;
      forbid_sync_aweme: string;
      forbid_timer_publish_reason: string;
      forbid_to_detail: boolean;
      forbid_to_detail_reason: string;
      show_add_collection: boolean;
      show_ads: boolean;
      show_anonymous: boolean;
      show_boost: boolean;
      show_comment: boolean;
      show_copy: boolean;
      show_delete: boolean;
      show_graphic2_video: boolean;
      show_hide: boolean;
      show_modify: boolean;
      show_share: boolean;
      show_stick: boolean;
      show_sync_aweme: boolean;
      show_timer_publish: boolean;
    };
    modify_time: number;
    mp_id: number;
    pgc_cell: string;
    pop_score: number;
    rich_title: string;
    show_time: number;
    status: number;
    status_desc: string;
    status_list: {
      is_anonymous: boolean;
      is_from_writingo: boolean;
      stick: boolean;
      sync_aweme_status: number;
    };
    title: string;
    type: number;
    type_desc: string;
    upload_status: number;
    verify_reason: string;
    visibility_level: number;
  };
  article_stat: {
    answer_count: number;
    comment_count: number;
    counters: Array<{
      Count: number;
      Name: string;
    }>;
    digg_count: number;
    go_detail_count: number;
    impression_count: number;
    play_count: number;
    repin_count: number;
  };
}

export interface ToutiaohaoArticleContentListResponse {
  code: number;
  contents: Array<ToutiaohaoArticleMediaContent>;
  count: number;
  end_cursor: number;
  has_more: boolean;
  message: string;
  total_count: number;
}

/**
 *
 * @param cookie
 * @param offset 翻页参数，作品开始索引，默认从0开始
 * @param status 状态 1:全部 2:已发布 3:未通过 5:仅我可见
 */
export const getVideoContentListResponse = async (
  cookie: string,
  offset: number = 0,
  status: 1 | 2 | 3 | 5 = 1,
): Promise<ToutiaohaoVideoContentListResponse> => {
  const url = 'https://mp.toutiao.com/xigua/api/video/getarticlelist/';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.toutiao.com/profile_v4/xigua/content-manage-v2',
  };

  const params = {
    params: `{"Keyword":"","Status":${status},"Source":"all","Offset":${offset},"Size":20,"StartTime":0,"EndTime":0,"Feature":1,"PageIdentyInstance":0,"NeedAuthorTop":true,"CommonParams":{"AppId":1231}}`,
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

export interface ToutiaohaoVideoContentListResponse {
  /**
   *  数据体
   */
  data: {
    /**
     * 视频列表
     */
    ArticleList: Array<ToutiaohaoVideoMediaContent>;
    /**
     *  下一页参数
     */
    NextOffset: number;
    /**
     * 总数量
     */
    Total: number;
    IncomeReadyTs: number;
    IndexTotal: number;
  };
  /**
   * 状态码，0:正常，非0异常
   */
  status: number;
  /**
   * 提示消息
   */
  message: string;
}

export interface ToutiaohaoVideoMediaContent {
  /**
   * 作品唯一id
   */
  ItemId: string;
  GroupSource: number;
  /**
   * 视频详情
   */
  VideoData: {
    /**
     * 标题
     */
    Title: string;
    /**
     * 描述
     */
    Abstract: string;
    /**
     * 封面uri
     */
    CoverUri: string;
    /**
     * 封面url
     */
    CoverUrl: string;
    /**
     * 视频时长
     */
    Duration: number;
    /**
     * 作品地址
     */
    PlayUrl: string;
    Width: number;
    Height: number;
    IsLandscape: boolean;
    VCloudPlayUrl: string;
    OfflinePlayUrl: string;
    /**
     * 视频id
     */
    VideoID: string;
  };
  /**
   * 合集
   */
  AlbumData: {
    AddToAlbum: false;
    /**
     * 合集id
     */
    AlbumId: string;
    /**
     * 合集名称
     */
    AlbumName: string;
    /**
     * 是否能添加到合集
     */
    CanAddToAlbum: boolean;
  };
  /**
   * 互动数据
   */
  ArticleStatData: {
    /**
     * 推荐
     */
    RecommendCount: number;
    /**
     * 推荐数int64
     */
    RecommentCountI64: number;
    /**
     * 播放数
     */
    PlayCount: number;

    PlayCountI64: number;
    CommentCount: number;
    CommentCountI64: number;
    DiggCount: number;
    DiggCountI64: number;
    DanmakuCount: number;
    DanmakuCountI64: number;
    RepinCount: number;
    RepinCountI64: number;
    Income: number;
    VideoExclusiveIncome: number;
    FansCount: number;
    ShareCount: number;
  };
  /**
   * 是否原创
   */
  IsOrigin: boolean;
  CommentLevel: number;
  CanEdit: boolean;
  CanDelete: boolean;
  CanHide: boolean;
  CanPublic: boolean;
  ViewData: boolean;
  ViewComment: boolean;
  ViewIncome: boolean;
  SyncToAweme: {
    IsSyncToAweme: boolean;
    CanSyncToAweme: boolean;
  };
  ArticleStatus: number;

  ItemStatus: number;

  /**
   * 创建时间,10位时间戳
   */
  CreateTime: number;

  /**
   * 发布状态描述
   */
  ArticleStatusText: string;
  IsTop: boolean;
  CanTop: boolean;
  CanShare: boolean;
  /**
   * 作品url地址
   */
  ShareUrl: string;
  /**
   * 作者id
   */
  UserId: number;
  IncomeComposition: number;
  BoostLandingUrl: string;
  TortStatus: number;
  DraftUpdateTime: number;
  ArticleAdType: number;
  VisibilityLevel: number;
  HideType: number;
  /**
   * 话题列表
   */
  HashtagList: [
    {
      HashtagId: string;
      HashtagName: string;
    },
  ];
}
export const getDynamicContentListAsync = async (
  cookie: string,
  userId:string,
  page: number = 0,
  pageSize: number = 10,
): Promise<TouTiaoDynamicListResponse> => {
  const url = `https://mp.toutiao.com/api/feed/mp_provider/v1/?provider_type=mp_provider&aid=13&app_name=news_article&category=mp_wtt&channel=&stream_api_version=88&genre_type_switch=%7B%22repost%22%3A1%2C%22small_video%22%3A1%2C%22toutiao_graphic%22%3A1%2C%22weitoutiao%22%3A1%2C%22xigua_video%22%3A1%7D&device_platform=pc&platform_id=0&visited_uid=${userId}&offset=${
    page * pageSize
  }&count=${pageSize}&keyword=&client_extra_params=&app_id=1231`;
  const result = await $http.get<unknown, AxiosResponse<TouTiaoDynamicListResponse>>(url, {
    headers: {
      cookie: cookie,
      referer: 'https://mp.toutiao.com/profile_v4/manage/content/all',
      authority: 'mp.toutiao.com',
    },
    params: {},
  });


  return result.data;
};

export interface TouTiaoDynamicListResponse {
  data: DynamicDataItem[]; // 文章列表数据
  errno: number; // 错误码（20100=成功）
  message: string; // 提示信息（如"success"）
  total_number: number; // 总数量
  has_more: boolean; // 是否有更多数据
  login_status: number; // 登录状态（1=已登录）
  show_et_status: number; // 显示ET状态
}

interface DynamicDataItem {
  // 组装单元格核心数据
  assembleCell: {
    // 项目单元格数据
    itemCell: {
      // 文章基础信息
      articleBase: {
        articleURL: string;
        content: string;
        groupID: number;
        title: string;
        displayFlags: string;
        displayURL: string;
        publishTime: number;
        subTitle: string;
        gidStr: string;
        itemStatus: number;
        schema: string;
        abstractText: string;
        createTime: number;
        visibilityLevel: number;
      };
    };
  };
}