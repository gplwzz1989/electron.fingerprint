import { $http } from '@/http';

export const getWeiboConversationListResponse = async (cookie: string): Promise<XinlangweiboConversationResponse> => {
  const url = `https://api.weibo.com/webim/2/direct_messages/contacts.json?special_source=3&add_virtual_user=3%2C4&is_include_group=0&need_back=0%2C0&is_include_folder=1&count=500&source=209678993&t=${Date.now()}`;
  const seps = cookie.split('XSRF-TOKEN=');
  const headers = {
    cookie: cookie,
    referer: 'https://api.weibo.com/chat',
    origin: 'https://weibo.com',
    'X-XSRF-TOKEN': seps?.length ? seps[1]?.split(';')[0] : '',
  };

  const result = await $http.get(url, {
    headers: headers,
  });

  return result.data;
};

export interface XinlangweiboConversationResponse {
  show_tab: number; //1全部
  total_number: number;
  special_user: number;
  next_cursor: number;
  contacts: Array<XinlangweiboConversationItem>;
  error_code: number;
  error: string;
}

export interface XinlangweiboConversationItem {
  unread_count: number;
  message: {
    idstr: string;
    msgType: number;
    sysType: number;
    created_at: string; //'Wed Dec 24 09:31:43 +0800 2025';
    mid: string;
    oriImageId: number;
    source: string;
    sys_type: number;
    sender_id: number;
    sender: { idstr: string; screen_name: string; profile_image_url: string };
    dm_type: number;
    status_id: number;
    isLargeDm: boolean;
    matchKeyword: boolean;
    media_type: number;
    sender_screen_name: string;
    id: number;
    /**
     * 文本消息
     */
    text: string;
    recipient_id: number;
    is_redenvelope: number;
    source_msg_id: number;
    att_ids: [];
    ip: number;

    recall_status: number;
    recipient_screen_name: string;
    burn_time: number;
    subType: number;
  };
  /**
   * 会话用户信息
   */
  user: {
    /**
     * 是否是粉丝
     */
    follow_me: boolean;
    /**
     * 用户id/会话id
     */
    idStr: string;
    level: number;
    /**
     * 认证用户
     */
    verified: boolean;
    /**
     * 会话头像
     */
    profile_image_url: string;
    remark: '';
    /**
     * 类型 1:用户私信，12:系统通知，
     */
    type: number;
    verified_type: number;
    verified_type_ext: number;
    avatar_large: string;
    is_blocked: false;
    /**
     * 是否接受消息，1:接受，其他屏蔽
     */
    receive_message: number;
    user_type: number;
    /**
     * 是否关注
     */
    following: boolean;
    /**
     * 昵称
     */
    name: string;
    trash_user: number;
    id: number;
    label_sub_type: number;
    position: number;
  };
}

export const sendWeiboMessageResponse = async (
  cookie: string,
  sessionId: string,
  text: string,
  imgId: string = '',
  peoxyAgent?: object,
  clientId: string = '1r25y1kczceojjhlpuidzuqtt9ccw6',
  source: string = '209678993',
): Promise<sendWeiboMessageResponse> => {
  const url = 'https://api.weibo.com/webim/2/direct_messages/new.json';
  const seps = cookie.split('XSRF-TOKEN=');
  const headers = {
    cookie: cookie,
    referer: 'https://api.weibo.com/chat',
    origin: 'https://weibo.com',
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-XSRF-TOKEN': seps?.length ? seps[1]?.split(';')[0] : '',
  };

  let postData = `text=${encodeURIComponent(
    text ? text : '分享图片',
  )}&uid=${sessionId}&extensions=%7B%22clientid%22%3A%22${encodeURIComponent(
    clientId,
  )}%22%7D&is_encoded=0&decodetime=1&source=${source}`;
  if (imgId) {
    postData = postData + `&fids=${imgId}`;
  }

  const result = await $http.post(url, postData, {
    headers: headers,
    httpsAgent: peoxyAgent,
    httpAgent: peoxyAgent,
  });

  return result.data;
};

export interface sendWeiboMessageResponse {
  error_code: number;
  error: string;
  id: number;
  /**
   * 消息id
   */
  idstr: string;
  created_at: string;
  text: string;
  sys_type: number;
  msg_status: number;
  sender_trash_user: number;
  sender_id: number;
  recipient_id: number;
  sender_screen_name: string;
  recipient_screen_name: string;
  sender: {
    id: number;
    idstr: string;
    class: number;
    screen_name: string;
    name: string;
    province: string;
    city: string;
    location: string;
    description: string;
    url: string;
    profile_image_url: string;
    light_ring: boolean;
    cover_image_phone: string;
    profile_url: string;
    domain: string;
    weihao: string;
    gender: string;
    followers_count: number;
    followers_count_str: string;
    friends_count: number;
    pagefriends_count: number;
    statuses_count: number;
    video_status_count: number;
    video_play_count: number;
    super_topic_not_syn_count: number;
    favourites_count: number;
    created_at: string;
    following: boolean;
    allow_all_act_msg: boolean;
    geo_enabled: boolean;
    verified: boolean;
    verified_type: number;
    remark: string;
    insecurity: {
      sexual_content: boolean;
    };
    ptype: number;
    allow_all_comment: boolean;
    avatar_large: string;
    avatar_hd: string;
    verified_reason: string;
    verified_trade: string;
    verified_reason_url: string;
    verified_source: string;
    verified_source_url: string;
    follow_me: boolean;
    like: boolean;
    like_me: boolean;
    online_status: number;
    bi_followers_count: number;
    lang: string;
    star: number;
    mbtype: number;
    mbrank: number;
    svip: number;
    vvip: number;
    mb_expire_time: number;
    block_word: number;
    block_app: number;
    chaohua_ability: number;
    brand_ability: number;
    nft_ability: number;
    vplus_ability: number;
    wenda_ability: number;
    live_ability: number;
    gongyi_ability: number;
    paycolumn_ability: number;
    newbrand_ability: number;
    ecommerce_ability: number;
    hardfan_ability: number;
    wbcolumn_ability: number;
    interaction_user: number;
    audio_ability: number;
    place_ability: number;
    credit_score: number;
    user_ability: number;
    urank: number;
    story_read_state: number;
    vclub_member: number;
    is_teenager: number;
    is_guardian: number;
    is_teenager_list: number;
    pc_new: number;
    special_follow: boolean;
    planet_video: number;
    video_mark: number;
    live_status: number;
    user_ability_extend: number;
    status_total_counter: {
      total_cnt: number;
      repost_cnt: number;
      comment_cnt: number;
      like_cnt: number;
      comment_like_cnt: number;
    };
    video_total_counter: {
      play_cnt: number;
    };
    brand_account: number;
    hongbaofei: number;
    reward_status: number;
    green_mode: number;
    green_mode_source: number;
    delete_mode_time: number;
    urisk: number;
    unfollowing_recom_switch: number;
    avatar_type: number;
    is_big: number;
    auth_status: number;
    auth_realname: string | null;
    auth_career: string | null;
    auth_career_name: string | null;
    show_auth: number;
    is_auth: number;
    is_punish: number;
    avatar_hd_pid: string;
    like_display: number;
    comment_display: number;
  };
  recipient: {
    id: number;
    idstr: string;
    class: number;
    screen_name: string;
    name: string;
    province: string;
    city: string;
    location: string;
    description: string;
    url: string;
    profile_image_url: string;
    light_ring: boolean;
    cover_image_phone: string;
    profile_url: string;
    domain: string;
    weihao: string;
    gender: string;
    followers_count: number;
    followers_count_str: string;
    friends_count: number;
    pagefriends_count: number;
    statuses_count: number;
    video_status_count: number;
    video_play_count: number;
    super_topic_not_syn_count: number;
    favourites_count: number;
    created_at: string;
    following: boolean;
    allow_all_act_msg: boolean;
    geo_enabled: boolean;
    verified: boolean;
    verified_type: number;
    remark: string;
    insecurity: {
      sexual_content: boolean;
    };
    ptype: number;
    allow_all_comment: boolean;
    avatar_large: string;
    avatar_hd: string;
    verified_reason: string;
    verified_trade: string;
    verified_reason_url: string;
    verified_source: string;
    verified_source_url: string;
    follow_me: boolean;
    like: boolean;
    like_me: boolean;
    online_status: number;
    bi_followers_count: number;
    lang: string;
    star: number;
    mbtype: number;
    mbrank: number;
    svip: number;
    vvip: number;
    mb_expire_time: number;
    block_word: number;
    block_app: number;
    chaohua_ability: number;
    brand_ability: number;
    nft_ability: number;
    vplus_ability: number;
    wenda_ability: number;
    live_ability: number;
    gongyi_ability: number;
    paycolumn_ability: number;
    newbrand_ability: number;
    ecommerce_ability: number;
    hardfan_ability: number;
    wbcolumn_ability: number;
    interaction_user: number;
    audio_ability: number;
    place_ability: number;
    credit_score: number;
    user_ability: number;
    urank: number;
    story_read_state: number;
    vclub_member: number;
    is_teenager: number;
    is_guardian: number;
    is_teenager_list: number;
    pc_new: number;
    special_follow: boolean;
    planet_video: number;
    video_mark: number;
    live_status: number;
    user_ability_extend: number;
    status_total_counter: {
      total_cnt: number;
      repost_cnt: number;
      comment_cnt: number;
      like_cnt: number;
      comment_like_cnt: number;
    };
    video_total_counter: {
      play_cnt: number;
    };
    brand_account: number;
    hongbaofei: number;
    reward_status: number;
    green_mode: number;
    green_mode_source: number;
    delete_mode_time: number;
    urisk: number;
    unfollowing_recom_switch: number;
    avatar_type: number;
    is_big: number;
    auth_status: number;
    auth_realname: string | null;
    auth_career: string | null;
    auth_career_name: string | null;
    show_auth: number;
    is_auth: number;
    is_punish: number;
    like_display: number;
    comment_display: number;
  };
  mid: string;
  isLargeDm: boolean;
  msgExpireTime: number;
  source: string;
  status_id: number;
  geo: null;
  dm_type: number;
  media_type: number;
  sub_type: number;
  ip: number;
  ipv6: null;
  burn_time: number;
  ext_text: {
    send_from: string;
    pub_dm_month: number;
    clientid: string;
    msg_source: number;
  };
  matchKeyword: boolean;
  topublic: boolean;
  receiver_box_type: string;
  pushToMPS: boolean;
  oriImageId: number;
  recall_status: number;
  folder_remind: number;
  corner_tips: {
    scheme: string;
    color: string;
    color_dark: string;
    content: string;
  };
}

export const getWeiboConversationInfoResponse = async (
  cookie: string,
  sessionId: string,
  maxId = '0',
  count: number = 15,
): Promise<WeiboConversationInfoResponse> => {
  const url = `https://api.weibo.com/webim/2/direct_messages/public/conversation.json?convert_emoji=1&count=${
    count ?? 15
  }&max_id=${maxId}&uid=${sessionId}&is_include_group=0&from_contacts=1&source=209678993&t=${Date.now()}`;
  const seps = cookie.split('XSRF-TOKEN=');
  const headers = {
    cookie: cookie,
    referer: 'https://api.weibo.com/chat',
    origin: 'https://weibo.com',
    'X-XSRF-TOKEN': seps?.length ? seps[1]?.split(';')[0] : '',
  };

  const result = await $http.get(url, {
    headers: headers,
  });

  return result.data;
};

export interface WeiboConversationInfoResponse {
  error_code: number;
  error: string;
  private_time: number;
  corner_tips: {
    scheme: string;
    color: string;
    color_dark: string;
    content: string;
  };
  total_number: number;
  notice_messages: string; // 实际为 JSON 字符串，内部是通知消息数组
  next_cursor: number;
  online_status: number;
  last_read_mid: number;
  direct_messages: Array<{
    idstr: string;
    receiver_box_type: string;
    msgExpireTime: number;
    created_at: string;
    att_ids:Array<number>;
    mid: string;
    sys_type: number;
    source: string;
    oriImageId: number;
    sender_id: number;
    dm_type: number;
    folder_remind: number;
    status_id: number;
    sender_screen_name: string;
    isLargeDm: boolean;
    media_type: number;
    sub_type: number;
    matchKeyword: boolean;
    id: number;
    text: string;
    recipient_id: number;
    sender_trash_user: number;
    msg_status: number;
    pushToMPS: boolean;
    ext_text: {
      hasDmBefore?: boolean;
      autoReply?: boolean;
      sender_box_type?: string;
      send_from?: string;
      pub_dm_month?: number;
      clientid?: string;
      msg_source?: number;
    };
    recall_status: number;
    recipient_screen_name: string;
    sender: {
      is_teenager: number;
      favourites_count: number;
      vplus_ability: number;
      province: string;
      screen_name: string;
      interaction_user: number;
      id: number;
      geo_enabled: boolean;
      delete_mode_time: number;
      like_me: boolean;
      light_ring: boolean;
      wenda_ability: number;
      video_total_counter: {
        play_cnt: number;
      };
      nft_ability: number;
      avatar_hd_pid: string;
      show_auth: number;
      ecommerce_ability: number;
      domain: string;
      following: boolean;
      audio_ability: number;
      reward_status: number;
      follow_me: boolean;
      friends_count: number;
      credit_score: number;
      user_ability_extend: number;
      gender: string;
      city: string;
      profile_url: string;
      brand_ability: number;
      super_topic_not_syn_count: number;
      unfollowing_recom_switch: number;
      created_at: string;
      wbcolumn_ability: number;
      live_ability: number;
      bi_followers_count: number;
      is_teenager_list: number;
      verified_reason: string;
      video_status_count: number;
      newbrand_ability: number;
      urisk: number;
      star: number;
      status_total_counter: {
        total_cnt: number;
        repost_cnt: number;
        comment_like_cnt: number;
        like_cnt: number;
        comment_cnt: number;
      };
      online_status: number;
      block_app: number;
      url: string;
      avatar_large: string;
      planet_video: number;
      gongyi_ability: number;
      hardfan_ability: number;
      statuses_count: number;
      insecurity: {
        sexual_content: boolean;
      };
      verified_source: string;
      allow_all_act_msg: boolean;
      urank: number;
      verified_trade: string;
      is_auth: number;
      weihao: string;
      green_mode: number;
      mb_expire_time: number;
      verified_source_url: string;
      comment_display: number;
      green_mode_source: number;
      auth_status: number;
      video_mark: number;
      live_status: number;
      special_follow: boolean;
      followers_count_str: string;
      chaohua_ability: number;
      like: boolean;
      place_ability: number;
      verified_type: number;
      pagefriends_count: number;
      name: string;
      cover_image_phone: string;
      like_display: number;
      idstr: string;
      is_big: number;
      description: string;
      remark: string;
      ptype: number;
      verified_reason_url: string;
      block_word: number;
      avatar_type: number;
      vvip: number;
      avatar_hd: string;
      hongbaofei: number;
      video_play_count: number;
      mbtype: number;
      user_ability: number;
      story_read_state: number;
      mbrank: number;
      lang: string;
      class: number;
      is_punish: number;
      allow_all_comment: boolean;
      verified: boolean;
      profile_image_url: string;
      pc_new: number;
      paycolumn_ability: number;
      brand_account: number;
      vclub_member: number;
      followers_count: number;
      is_guardian: number;
      location: string;
      svip: number;
    };
    burn_time: number;
    recipient: {
      is_teenager: number;
      favourites_count: number;
      vplus_ability: number;
      province: string;
      screen_name: string;
      interaction_user: number;
      id: number;
      geo_enabled: boolean;
      delete_mode_time: number;
      like_me: boolean;
      light_ring: boolean;
      wenda_ability: number;
      video_total_counter: {
        play_cnt: number;
      };
      nft_ability: number;
      avatar_hd_pid: string;
      show_auth: number;
      ecommerce_ability: number;
      domain: string;
      following: boolean;
      audio_ability: number;
      reward_status: number;
      follow_me: boolean;
      friends_count: number;
      credit_score: number;
      user_ability_extend: number;
      gender: string;
      city: string;
      profile_url: string;
      brand_ability: number;
      super_topic_not_syn_count: number;
      unfollowing_recom_switch: number;
      created_at: string;
      wbcolumn_ability: number;
      live_ability: number;
      bi_followers_count: number;
      is_teenager_list: number;
      verified_reason: string;
      video_status_count: number;
      newbrand_ability: number;
      urisk: number;
      star: number;
      status_total_counter: {
        total_cnt: number;
        repost_cnt: number;
        comment_like_cnt: number;
        like_cnt: number;
        comment_cnt: number;
      };
      online_status: number;
      block_app: number;
      url: string;
      avatar_large: string;
      planet_video: number;
      gongyi_ability: number;
      hardfan_ability: number;
      statuses_count: number;
      insecurity: {
        sexual_content: boolean;
      };
      verified_source: string;
      allow_all_act_msg: boolean;
      urank: number;
      verified_trade: string;
      is_auth: number;
      weihao: string;
      green_mode: number;
      mb_expire_time: number;
      verified_source_url: string;
      comment_display: number;
      green_mode_source: number;
      auth_status: number;
      video_mark: number;
      live_status: number;
      special_follow: boolean;
      followers_count_str: string;
      chaohua_ability: number;
      like: boolean;
      place_ability: number;
      verified_type: number;
      pagefriends_count: number;
      name: string;
      cover_image_phone: string;
      like_display: number;
      idstr: string;
      is_big: number;
      description: string;
      remark: string;
      ptype: number;
      verified_reason_url: string;
      block_word: number;
      avatar_type: number;
      vvip: number;
      avatar_hd: string;
      hongbaofei: number;
      video_play_count: number;
      mbtype: number;
      user_ability: number;
      story_read_state: number;
      mbrank: number;
      lang: string;
      class: number;
      is_punish: number;
      allow_all_comment: boolean;
      verified: boolean;
      profile_image_url: string;
      pc_new: number;
      paycolumn_ability: number;
      brand_account: number;
      vclub_member: number;
      followers_count: number;
      is_guardian: number;
      location: string;
      svip: number;
    };
    url_objects?: Array<{
      search_topic_read_count: number;
      like_count: number;
      returned_object_id: string;
      object_id: string;
      follower_count: number;
      super_topic_photo_count: number;
      search_topic_count: number;
      super_topic_status_count: number;
      search_topic_mention_day_count: number;
      asso_like_count: number;
      url_ori: string;
      isActionType: boolean;
      card_info_un_integrity: boolean;
      info: {
        result: boolean;
        url_short: string;
        ext_status: number;
        url_long: string;
        trusted_state: number;
        transcode: number;
        description: string;
        type: number;
        title: string;
        last_modified: number;
      };
      object: {
        uuidstr: string;
        object_type: string;
        activate_status: string;
        is_longtext: boolean;
        safe_extparam: string;
        request_oid: string;
        safe_status: number;
        object_id: string;
        uuid: number;
        act_status: string;
        object_domain_id: string;
        containerid: string;
        show_status: string;
        last_modified: string;
        actions: Array<unknown>;
        timestamp: number;
        object: {
          summary: string;
          image: {
            width: number;
            url: string;
            height: number;
          };
          action_button: string;
          scheme: string;
          object_type: string;
          author: {
            summary: string;
            image: string;
            scheme: string;
            object_type: string;
            target_url: string;
            full_image: string;
            id: number;
            display_name: string;
            url: string;
            content: string;
          };
          target_url: string;
          full_image: string;
          pic: string;
          display_name: string;
          card_type: number;
          url: string;
          content: string;
          biz: {
            biz_id: string;
            containerid: string;
          };
          action: string;
          id: string;
        };
      };
    }>;
    topublic: boolean;
  }>;
}

export const getWeiboConnectClientResponse = async (cookie: string): Promise<Array<XinlangweiboConnectClientResponse>> => {
  const url = `https://web.im.weibo.com/im/handshake`;
  const seps = cookie.split('XSRF-TOKEN=');
  const headers = {
    cookie: cookie,
    referer: 'https://api.weibo.com/chat',
    origin: 'https://weibo.com',
    'Content-Type': 'application/json',
    'X-XSRF-TOKEN': seps?.length ? seps[1]?.split(';')[0] : '',
  };
  const postData = [
    {
      id: '1',
      version: '1.0',
      minimumVersion: '1.0',
      channel: '/meta/handshake',
      supportedConnectionTypes: ['long-polling', 'callback-polling'],
      advice: { timeout: 60000, interval: 0 },
    },
  ];
  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface XinlangweiboConnectClientResponse {
  ext: { ack: true };
  minimumVersion: string;
  clientId: string;
  supportedConnectionTypes: Array<string>; //['websocket', 'long-polling', 'callback-polling'];
  channel: string;
  id: string;
  version: string;
  successful: boolean;
}

export const getWeiboNewMsgResponse = async (
  cookie: string,
  id: string,
  clientId: string,
): Promise<Array<WeiboImMessageReceiveData>> => {
  const url = `https://web.im.weibo.com/im/connect`;
  const seps = cookie.split('XSRF-TOKEN=');
  const headers = {
    cookie: cookie,
    referer: 'https://api.weibo.com/chat',
    origin: 'https://weibo.com',
    'Content-Type': 'application/json',
    'X-XSRF-TOKEN': seps?.length ? seps[1]?.split(';')[0] : '',
  };
  const postData = [{ id: id, channel: '/meta/connect', connectionType: 'long-polling', clientId: clientId }];
  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};
/**
 * 微博 IM 推送数据结构（优化易读版）
 */
export interface WeiboImMessageReceiveData {
  data: {
    ext: {
      send_from: string;
      dm_type: number;
      pub_dm_month: number;
      source_msg_id: number;
      hasDmBefore: boolean;
      push_proc_ext: {
        conv_ext: string;
      };
      msg_source: number;
      client_switch: string;
      is_first_send: number;
    };
    push_did: string;
    type: string;
    dm_isRemind: number;
    items: Array<
      [
        number, // fromuid
        string, // content
        number, // time
        string, // 空字符串占位
        string, // 空字符串占位
        [], // 空数组占位
        string, // dmid
        number, // status
      ]
    >;
    info: {
      dm_type: number;
      receive_message: number;
      receiver_box_type: number;
      fromuid: number;
      resource: string;
      media_type: number;
      show_message_count: number;
      comment: string;
      time: number;
      dmid: string;
      content: string;
      att_ids: string;
    };
  };
  channel: string;
  id: string;
  successful: boolean;
}
