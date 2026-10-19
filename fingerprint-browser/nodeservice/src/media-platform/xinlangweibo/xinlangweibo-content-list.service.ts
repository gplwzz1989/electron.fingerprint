import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { generateRandomString } from '@/media-platform/xinlangweibo/xinlangweibo-common';
import { getXsrfToken } from '@/media-platform/xinlangweibo/xinlangweibo-base.service';

/**
 * 获取微博列表
 * @param cookie
 * @param uid 用户id
 * @param page 页码
 */
export const getContentListAsync = async (
  cookie: string,
  uid: number,
  page: number,
): Promise<XinlangweiboContentListResponse> => {
  const xsrfToken = getXsrfToken(cookie) ?? '';
  const result = await $http.get<unknown, AxiosResponse<XinlangweiboContentListResponse>>(
    'https://weibo.com/ajax/statuses/mymblog',
    {
      headers: {
        cookie: cookie,
        referer: `https://weibo.com/u/${uid}?tabtype=feed`,
        'x-requested-with': 'XMLHttpRequest',
        'X-XSRF-TOKEN': xsrfToken,
      },
      params: {
        page: page,
        uid: uid,
        feature: 0,
      },
    },
  );

  return result.data;
};

export interface XinlangweiboMediaContent {
  visible: {
    type: number;
    list_id: number;
  };

  /**
   * 发布时间
   */
  created_at: string;
  id: number;
  idstr: string;
  mid: string;
  mblogid: string;
  can_edit: false;
  text_raw: string;
  textLength: number;
  annotations: [
    {
      oid: string;
      type: string;
    },
  ];
  source: string;
  favorited: false;
  rid: string;

  /**
   * 阅读
   */
  reads_count: number;
  pic_ids: [string];
  pic_infos: {
    [key: string]: {
      thumbnail: {
        url: string;
        width: number;
        height: number;
        cut_type: number;
        type: string;
      };
      bmiddle: {
        url: string;
        width: number;
        height: number;
        cut_type: number;
        type: string;
      };
      large: {
        url: string;
        width: number;
        height: number;
        cut_type: number;
        type: string;
      };
      original: {
        url: string;
        width: number;
        height: number;
        cut_type: number;
        type: string;
      };
      largest: {
        url: string;
        width: number;
        height: number;
        cut_type: number;
        type: string;
      };
      mw2000: {
        url: string;
        width: number;
        height: number;
        cut_type: number;
        type: string;
      };
      largecover: {
        url: string;
        width: number;
        height: number;
        cut_type: number;
        type: string;
      };
      focus_point: {
        left: number;
        top: number;
        width: number;
        height: number;
      };
      object_id: string;
      pic_id: string;
      photo_tag: number;
      type: string;
      pic_status: number;
    };
  };
  pic_num: number;
  is_paid: false;
  mblog_vip_type: number;
  number_display_strategy: {
    apply_scenario_flag: number;
    display_text_min_number: number;
    display_text: string;
  };
  /**
   * 转发
   */
  reposts_count: number;

  /**
   * 评论
   */
  comments_count: number;

  /**
   * 点赞
   */
  attitudes_count: number;
  attitudes_status: number;
  isLongText: boolean;
  mlevel: number;
  /**
   * 0：普通 1：首发
   */
  content_auth: number;
  is_show_bulletin: number;
  comment_manage_info: {
    comment_manage_button: number;
    comment_permission_type: number;
    approval_comment_type: number;
    comment_sort_type: number;
  };
  share_repost_type: number;
  url_struct: [
    {
      url_title: string;
      url_type_pic: string;
      ori_url: string;
      page_id: string;

      /**
       * 短链接
       */
      short_url: string;

      /**
       * 长链接
       */
      long_url: string;
      url_type: number;
      result: boolean;
      actionlog: {
        act_type: number;
        act_code: number;
        oid: string;
        uuid: number;
        cardid: string;
        lcardid: string;
        uicode: string;
        luicode: string;
        fid: string;
        lfid: string;
        ext: string;
        source: string;
        fromlog: string;
      };
      storage_type: string;
      hide: number;
      object_type: string;
      h5_target_url: string;
      need_save_obj: number;
    },
  ];
  mblogtype: number;
  showFeedRepost: boolean;
  showFeedComment: boolean;
  pictureViewerSign: boolean;
  showPictureViewer: boolean;
  rcList: [];

  /**
   * 内容标题
   */
  text: string;
  region_name: string;
  customIcons: [];
  page_info: {
    type: string;
    page_id: string;
    object_type: string;
    page_desc: string;
    oid: number;
    page_title: string;
    page_pic: string;
    type_icon: string;
    page_url: string;
    object_id: string;
    author_id: number;
    authorid: number;
    content1: string;
    content2: string;
    content3: string;
    preload: boolean;
    content4: string;
    user: {
      id: string;
      screen_name: string;
      profile_image_url: string;
      avatar_large: string;
    };
    pic_info: {
      pic_big: {
        height: string;
        url: string;
        width: string;
      };
    };
    source_type: string;
    button_type: string;
    button_follow_uid: string;
    need_lmid: string;
    actionlog: {
      act_type: number;
      act_code: number;
      oid: string;
      uuid: number;
      cardid: string;
      lcardid: string;
      uicode: string;
      luicode: string;
      fid: string;
      lfid: string;
      ext: string;
      source: string;
      fromlog: string;
    };
    transition_pics: [
      {
        pic_big: {
          height: string;
          url: string;
          width: string;
        };
      },
    ];
    alpha_time: string;
    pause_time: string;
  };
  tag_struct: Array<{
    tag_name: string;
    tag_scheme: string;
    url_type_pic: string;
    oid: string;
    otype: string;
    tag_type: number;
    tag_hidden: number;
    ori_url: string;
    actionlog: {
      act_code: number;
      oid: string;
      uicode: string;
      luicode: string;
      fid: string;
      ext: string;
    };
    is_checkin: number;
  }>;
}

export interface XinlangweiboContentListResponse {
  data: {
    since_id: string;
    list: Array<XinlangweiboMediaContent>;
    status_visible: number;
    bottom_tips_visible: boolean;
    bottom_tips_text: string;
    topicList: [];
    total: number;
  };
  ok: number;
  message?:string;
}

/**
 * 获取微博定时发布列表
 * @param cookie
 */
export const getPrepubContentListAsync = async (cookie: string): Promise<XinlangweiboPreContentResponse> => {
  const url = 'https://www.weibo.com/ajax/statuses/schedule/list?type=0&max_id=';

  const result = await $http.get(url, {
    headers: {
      cookie: cookie,
      referer: 'https://weibo.com/',
      'X-XSRF-TOKEN': cookie.split('XSRF-TOKEN')[1]?.split(';')[0],
    },
  });

  return result.data;
};

export interface XinlangweiboPreContentResponse {
  ok: number;
  data: {
    statuses: Array<XinlangweiboPreContent>;
  };
}

export interface XinlangweiboPreContent {
  url_objects: Array<{ object_id: string; url_ori: string }>;

  schedule_id: string;

  schedule_at: string;
}

export const getXinlangweiboVideoListResponse = async (
  cookie: string,
  cursor: string = '0',
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<XinlangweiVideoListResponse> => {
  const url = 'https://me.weibo.com/api/video/list';

  const xsrfToken = cookie.includes('XSRF-TOKEN=') ? cookie.split('XSRF-TOKEN=')[1]?.split(';')[0] : '';

  const headers = {
    cookie: cookie,
    Referer: 'https://me.weibo.com/content/video',
    'X-XSRF-TOKEN': xsrfToken,
  };

  const params = {
    cursor: cursor,
  };

  const result = await $http.get(url, {
    headers: headers,
    params: params,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};

export interface XinlangweiVideoListResponse {
  data: {
    videos: Array<{
      oid: string; // '1034:5099579654209589';
      mid: number; // 5099579768570707;
      mid_str: string;
      titles: Array<{ title: string }>;
      categories: [];
      tags: [];
      covers: Array<{ url: string; type: string }>;
      playlists_ids: [];
      duration: number;
      width: number;
      height: number;
      play_count: number;
      create_time: number;
      statistics: {
        comment_count: number;
        /**
         * 点赞
         */
        attitude_count: number;
        reposts_count: number;
        play_count: number;
        danmaku_count: number;
      };
      /**
       * 0:公开
       */
      video_visibility: number;
      /**
       * 是否可编辑
       */
      editable: number;
      video_tail: number;
      /**
       * 是否可添加到合计
       */
      add_to_album_enable: number;
    }>;
    /**
     * 下一页参数
     */
    next_cursor: string;
    video_overload_count: number;
  };
  /**
   * 1:正常
   */
  ok: number;
}

/**
 *
 * @param cookie
 * @param pageNum 首页为1,胡须累加1
 * @param proxyAgent
 */
export const getXinlangweiboArticleListResponse = async (
  cookie: string,
  pageNum: number = 1,
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<XinlangweiboArticleListResponse> => {
  const url = 'https://me.weibo.com/api/article/artlist';

  const xsrfToken = cookie.includes('XSRF-TOKEN=') ? cookie.split('XSRF-TOKEN=')[1]?.split(';')[0] : '';

  const headers = {
    cookie: cookie,
    Referer: 'https://me.weibo.com/content/video',
    'X-XSRF-TOKEN': xsrfToken,
  };

  const params = {
    page: pageNum,
  };

  const result = await $http.get(url, {
    headers: headers,
    params: params,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};

export interface XinlangweiboArticleListResponse {
  /**
   * 状态码，1:正常
   */
  ok: number;
  data: {
    list: Array<{
      title: string;
      uid: string;
      oid: string; //'1022:2309404918025542566747';
      mid: string; //'4918025545581839';
      deleted: number;
      visible: { type: number; list_id: number };
      countList: { reposts_count: number; comments_count: number; attitudes_count: number };
      other_collection: [];
      image: string;
      summary: string;
      created: string; //'2023-06-29 17:48:45';
      status: number;
      pclink: string;
      editlink: string;
    }>;
    totalnum: string;
  };
}

export const getXinlangweiboArticleDraftListResponse = async (
  cookie: string,
  proxyAgent: HttpsProxyAgent<string> | object | undefined = undefined,
): Promise<XinlangweiboArticleDraftListResponse> => {
  const url = `https://card.weibo.com/article/v3/aj/editor/draft/list?uid=3993848527&allow_pay=1&_rid=${generateRandomString(
    16,
  )}`;

  const xsrfToken = cookie.includes('XSRF-TOKEN=') ? cookie.split('XSRF-TOKEN=')[1]?.split(';')[0] : '';

  const headers = {
    cookie: cookie,
    Referer: 'https://card.weibo.com/article/v3/editor',
    'X-XSRF-TOKEN': xsrfToken,
  };

  const result = await $http.get(url, {
    headers: headers,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};

export interface XinlangweiboArticleDraftListResponse {
  code: number;
  msg: string;
  data: {
    list: [];
    count: number;
    max_count: number;
  };
}

//
// {
//   id: '3753389';
//   title: '\u6211\u5c31\u662f\u5929\u6c14\u597d1';
//   updated: '2025-09-17 14:07:21';
//   subtitle: '';
//   type: '';
//   status: 0;
//   is_article_free: 0;
//   is_draft_to_svip: 0;
//   svip_protocol_type: 0;
//   is_word: '0';
//   publish_at: '';
//   error_msg: '';
//   error_code: 0;
//   collection: [];
// }
