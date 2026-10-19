import { $http, HttpConfig } from '@/http';
import { isJson } from '@/utils';
import { clientSign, clientSign_v2 } from './douyin-video.service';

const buildDouyinCommentHeaders = async (cookie: string, csrfToken: string, path: string) => {
  let pubKey = '';
  if (cookie?.includes('bd_ticket_guard_client_data=')) {
    pubKey = JSON.parse(
      Buffer.from(
        decodeURIComponent(cookie.split('bd_ticket_guard_client_data=')[1]?.split(';')[0]?.trim()),
        'base64',
      ).toString('utf-8'),
    )['bd-ticket-guard-ree-public-key'];
  } else if (cookie?.includes('bd_ticket_guard_client_data_v2=')) {
    pubKey = JSON.parse(
      Buffer.from(
        decodeURIComponent(cookie.split('bd_ticket_guard_client_data_v2=')[1]?.split(';')[0]?.trim()),
        'base64',
      ).toString('utf-8'),
    )['ree_public_key'];
  }

  const signValue = await clientSign_v2(cookie, 'comment', { path });
  const signObj = JSON.parse(
    JSON.parse(
      decodeURIComponent(cookie.split('security-sdk/s_sdk_sign_data_key/web_protect=')[1]?.split(';')[0]?.trim()),
    ).data,
  );
  const webVer = signObj.ticket?.startsWith('hash') ? '2' : '1';

  return {
    cookie: cookie,
    'User-Agent': HttpConfig.userAgent,
    'Content-Type': 'application/json',
    'x-secsdk-csrf-token': csrfToken,
    'bd-ticket-guard-web-version': webVer,
    'bd-ticket-guard-version': '2',
    'bd-ticket-guard-iteration-version': '1',
    'bd-ticket-guard-web-sign-type': '1',
    'bd-ticket-guard-ree-public-key': pubKey,
    'bd-ticket-guard-client-data': signValue,
    Referer: 'https://creator.douyin.com/creator-micro/interactive/comment',
    Origin: 'https://creator.douyin.com/',
  };
};

/**
 * 点赞/不喜欢操作
 * @param cookie
 * @param sdkToken
 * @param commentId 评论id
 * @param type 1:点赞 2:不喜欢 3:取消点赞 4:取消不喜欢
 */
export const digDouyinContentCommentResponse = async (
  cookie: string,
  sdkToken: string,
  commentId: string,
  type: 1 | 2 | 3 | 4,
): Promise<DouyinDeleteCommentResponse> => {
  const msToken = getDouyinMsToken(cookie, 'digDouyinContentCommentResponse');
  const path = '/aweme/v1/creator/comment/action/';
  const url = `https://creator.douyin.com${path}?msToken=${encodeURIComponent(msToken)}&a_bogus=`;
  const headers = await buildDouyinCommentHeaders(cookie, sdkToken, path);

  const postData = {
    action_type: type,
    comment_Id: commentId,
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

/**
 * 删除评论
 * @param cookie
 * @param sdkToken
 * @param commentId 评论id
 */
export const deleteDouyinContentCommentResponse = async (
  cookie: string,
  sdkToken: string,
  commentId: string,
): Promise<DouyinDeleteCommentResponse> => {
  const msToken = getDouyinMsToken(cookie, 'deleteDouyinContentCommentResponse');
  const path = '/aweme/v1/creator/comment/delete/';
  const url = `https://creator.douyin.com${path}?msToken=${encodeURIComponent(msToken)}&a_bogus=`;
  const headers = await buildDouyinCommentHeaders(cookie, sdkToken, path);

  const postData = {
    comment_Id: commentId,
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

/**
 * 删除评论 V2
 * @param cookie
 * @param csrfToken
 * @param commentId 评论id
 * @param needBlock 是否同步拉黑
 * @param proxyAgent 代理
 */
export const deleteDouyinContentCommentResponseV2 = async (
  cookie: string,
  csrfToken: string,
  commentId: string,
  needBlock: boolean = false,
  proxyAgent?: object,
): Promise<DouyinDeleteCommentV2Response> => {
  const msToken = getDouyinMsToken(cookie, 'deleteDouyinContentCommentResponseV2');
  const path = '/aweme/janus/creator/comment/aweme/v1/web/comment/multi_delete/';
  const url = `https://creator.douyin.com${path}?cids=${encodeURIComponent(
    commentId,
  )}&need_block=${needBlock}&aid=2906&device_platform=webapp&msToken=${encodeURIComponent(msToken)}&a_bogus=`;

  let pubKey = '';
  if (cookie?.includes('bd_ticket_guard_client_data=')) {
    pubKey = JSON.parse(
      Buffer.from(
        decodeURIComponent(cookie.split('bd_ticket_guard_client_data=')[1]?.split(';')[0]?.trim()),
        'base64',
      ).toString('utf-8'),
    )['bd-ticket-guard-ree-public-key'];
  } else if (cookie?.includes('bd_ticket_guard_client_data_v2=')) {
    pubKey = JSON.parse(
      Buffer.from(
        decodeURIComponent(cookie.split('bd_ticket_guard_client_data_v2=')[1]?.split(';')[0]?.trim()),
        'base64',
      ).toString('utf-8'),
    )['ree_public_key'];
  }

  const signValue = await clientSign_v2(cookie, 'comment', { path });
  const signObj = JSON.parse(
    JSON.parse(
      decodeURIComponent(cookie.split('security-sdk/s_sdk_sign_data_key/web_protect=')[1]?.split(';')[0]?.trim()),
    ).data,
  );
  const webVer = signObj.ticket?.startsWith('hash') ? '2' : '1';
  const headers = {
    cookie: cookie,
    'User-Agent': HttpConfig.userAgent,
    'Content-Type': 'application/json',
    'x-secsdk-csrf-token': csrfToken,
    'bd-ticket-guard-web-version': webVer,
    'bd-ticket-guard-version': '2',
    'bd-ticket-guard-iteration-version': '1',
    'bd-ticket-guard-web-sign-type': '1',
    'bd-ticket-guard-ree-public-key': pubKey,
    'bd-ticket-guard-client-data': signValue,
    Referer: 'https://creator.douyin.com/creator-micro/interactive/comment',
    Origin: 'https://creator.douyin.com/',
  };

  const postData = {
    cids: commentId,
    need_block: needBlock,
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};

export interface DouyinDeleteCommentResponse {
  /**
   *
   */
  extra: { now: number };
  /**
   * 0:正常
   */
  status_code: number;
  /**
   * 提示消息
   */
  status_msg: string;
}

export interface DouyinDeleteCommentV2Response extends DouyinDeleteCommentResponse {
  delete_result: Array<{
    /**
     * 评论id
     */
    cid: string;
    result: boolean;
  }>;
  block_result: unknown;
  control_comment_check: boolean;
  extra: {
    fatal_item_ids?: Array<string>;
    logid?: string;
    now: number;
  };
  log_pb?: {
    impr_id?: string;
  };
}

/**
 * 添加评论
 * @param cookie
 * @param csrfToken
 * @param text 评论内容（喊表情字符串）
 * @param item_id 作品加密id
 * @param commentId 评论id
 */
export const addDouyinContentCommentResponse = async (
  cookie: string,
  csrfToken: string,
  text: string,
  item_id: string,
  commentId?: string,
  proxyAgent?: object,
): Promise<DouyinAddCommentResponse> => {
  const msToken = getDouyinMsToken(cookie, 'addDouyinContentCommentResponse');
  const path = '/aweme/v1/creator/comment/reply/';
  const url = `https://creator.douyin.com${path}?msToken=${encodeURIComponent(msToken)}&a_bogus=`;

  // const url = `https://creator.douyin.com/aweme/janus/creator/comment/aweme/v1/comment/publish/?aweme_id=${item_id}&text=${encodeURIComponent(
  //   text,
  // )}&aid=2906&device_platform=webapp&msToken=${cookie.split('msToken=')[1]?.split('&')[0]}&a_bogus=`;

  const headers = await buildDouyinCommentHeaders(cookie, csrfToken, path);

  const postData = {
    comment_Id: commentId ?? '',
    item_id: item_id,
    text: text,
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};

/**
 * janus 明文 id 发布/回复评论（创作者中心官方页面当前使用的端点，2026-08 实测抓包）：
 * - 主评论: POST /aweme/janus/creator/comment/aweme/v1/comment/publish/
 *     query: aweme_id=<明文作品id> & text=<内容>
 * - 回复:   POST /aweme/janus/creator/comment/aweme/v1/web/comment/multi_publish/
 *     query: aweme_id=<明文作品id> & text=<内容> & reply_to_comment_ids=<明文评论cid> & channel_id=618
 * 业务参数全部在 query、全部为明文 id；与 V1（加密 item_id/comment_id）互不通用。
 * @param awemeId 明文作品 id（即评论回调里的 documentId）
 * @param replyToCommentId 回复目标评论的明文 cid；缺省则发主评论
 */
export const addDouyinContentCommentJanusResponse = async (
  cookie: string,
  csrfToken: string,
  text: string,
  awemeId: string,
  replyToCommentId?: string,
  proxyAgent?: object,
): Promise<DouyinJanusAddCommentResponse> => {
  const msToken = getDouyinMsToken(cookie, 'addDouyinContentCommentJanusResponse');
  const path = replyToCommentId
    ? '/aweme/janus/creator/comment/aweme/v1/web/comment/multi_publish/'
    : '/aweme/janus/creator/comment/aweme/v1/comment/publish/';
  const replyParams = replyToCommentId
    ? `&reply_to_comment_ids=${encodeURIComponent(replyToCommentId)}&channel_id=618`
    : '';
  const url =
    `https://creator.douyin.com${path}?aweme_id=${encodeURIComponent(awemeId)}` +
    `&text=${encodeURIComponent(text)}${replyParams}` +
    `&aid=2906&device_platform=webapp&msToken=${encodeURIComponent(msToken)}&a_bogus=`;

  let pubKey = '';
  if (cookie?.includes('bd_ticket_guard_client_data=')) {
    pubKey = JSON.parse(
      Buffer.from(
        decodeURIComponent(cookie.split('bd_ticket_guard_client_data=')[1]?.split(';')[0]?.trim()),
        'base64',
      ).toString('utf-8'),
    )['bd-ticket-guard-ree-public-key'];
  } else if (cookie?.includes('bd_ticket_guard_client_data_v2=')) {
    pubKey = JSON.parse(
      Buffer.from(
        decodeURIComponent(
          cookie.split('bd_ticket_guard_client_data_v2=')[1]?.split(';')[0]?.trim(),
        ),
        'base64',
      ).toString('utf-8'),
    )['ree_public_key'];
  }

  const signValue = await clientSign_v2(cookie, 'comment', { path });
  // 签名材料解析失败时不再直接抛栈：这类失败与「参数不合法」是同一类根因（账号 cookie 里
  // 的 security-sdk 材料缺失/过期），必须留下可判读的痕迹而不是一个无上下文的异常。
  let signObj: { ticket?: string; ts_sign?: string; client_cert?: string } = {};
  let signParseError = '';
  try {
    signObj = JSON.parse(
      JSON.parse(
        decodeURIComponent(
          cookie.split('security-sdk/s_sdk_sign_data_key/web_protect=')[1]?.split(';')[0]?.trim(),
        ),
      ).data,
    );
  } catch (e) {
    signParseError = e instanceof Error ? e.message : String(e);
  }
  const webVer = signObj.ticket?.startsWith('hash') ? '2' : '1';
  const headers = {
    cookie: cookie,
    'User-Agent': HttpConfig.userAgent,
    'Content-Type': 'application/json',
    'x-secsdk-csrf-token': csrfToken,
    'bd-ticket-guard-web-version': webVer,
    'bd-ticket-guard-version': '2',
    'bd-ticket-guard-iteration-version': '1',
    'bd-ticket-guard-web-sign-type': '1',
    'bd-ticket-guard-ree-public-key': pubKey,
    'bd-ticket-guard-client-data': signValue,
    Referer: 'https://creator.douyin.com/creator-micro/interactive/comment',
    Origin: 'https://creator.douyin.com/',
  };

  const result = await $http.post(
    url,
    {},
    {
      retryCondition: (error, response) => {
        return !isJson(response.data);
      },
      headers: headers,
      httpsAgent: proxyAgent,
      httpAgent: proxyAgent,
    },
  );

  // 明文 janus 回复的诊断留痕。
  //
  // 同一请求构造在浏览器登录态下实测 status_code=0 成功，服务端却回「参数不合法」，
  // 差异只可能在这份 cookie 携带的签名材料上（ticket/ts_sign/私钥/公钥，账号级且有时效）。
  // 响应体被上层裁成一句 msg 后无从判断到底缺哪一项，这里把完整响应与各签名材料的
  // 「是否存在」一并打出——只记录长度与布尔，不输出私钥、ticket 原文等敏感值。
  const payload = result.data as DouyinJanusAddCommentResponse | undefined;
  if (!payload || payload.status_code !== 0) {
    console.error(
      `[janus回复失败] path=${path} awemeId=${awemeId} replyTo=${replyToCommentId ?? ''} ` +
        `status_code=${payload?.status_code} status_msg=${payload?.status_msg ?? ''} ` +
        `signParseError=${signParseError || 'none'} ` +
        `hasTicket=${!!signObj.ticket} ticketPrefix=${String(signObj.ticket || '').slice(0, 5)} ` +
        `hasTsSign=${!!signObj.ts_sign} hasClientCert=${!!signObj.client_cert} ` +
        `pubKeyLen=${pubKey?.length ?? 0} signValueLen=${signValue?.length ?? 0} ` +
        `csrfTokenLen=${csrfToken?.length ?? 0} msTokenLen=${msToken?.length ?? 0} ` +
        `hasCryptSdk=${cookie?.includes('security-sdk/s_sdk_crypt_sdk')} ` +
        `hasGuardData=${cookie?.includes('bd_ticket_guard_client_data')} ` +
        `webVer=${webVer} proxy=${!!proxyAgent} ` +
        `body=${JSON.stringify(result.data).slice(0, 500)}`,
    );
  }

  return result.data;
};

export interface DouyinJanusAddCommentResponse {
  status_code: number;
  status_msg?: string;
  /** multi_publish 实测响应：新建的回复以 comments 数组返回（2026-08 抓包验证） */
  comments?: Array<{ cid?: string; text?: string }>;
  /** publish 主评论场景的兜底字段（未实测，保留多种取法） */
  comment?: { cid?: string };
  comment_info?: { comment_id?: string; cid?: string };
  extra?: { now?: number };
}

export interface DouyinAddCommentResponse {
  comment_info: {
    /**
     * 评论id
     */
    comment_id: string; //'@ifBr6bJOREz+ts5G6L/svM54pyaZbyDzKKwsOqdrj5gTq52GOgMF+Gw4F7KRjv7X';
    /**
     * 10位时间戳
     */
    create_time: string; // '1739867105';
    digg_count: '0';
    followed: false;
    following: false;
    is_author: true;
    /**
     * 1级还是2级评论
     */
    level: number;
    /**
     * 回复数量
     */
    reply_count: '0';
    status: 7;
    /**
     * 评论内容
     */
    text: string; // '我评论作品\n[微笑][色]';
    user_digg: false;
    user_info: {
      avatar_url: string;
      screen_name: string;
      /**
       * 用户加密id
       */
      user_id: string;
    };
  };
  extra: { now: 1739867105000 };
  status_code: number;
  status_msg: string;
}

/**
 * 获取单个作品下的一级评论
 * @param cookie
 * @param item_id 作品的加密id
 * @param cursor 下一页参数，首页位0
 * @param count 单页数量
 */
export const getDouyinSignleContentCommentListResponse = async (
  cookie: string,
  item_id: string,
  cursor: number = 0,
  count: number = 10,
): Promise<DouyinCommentListResponse> => {
  const msToken = getDouyinMsToken(cookie, 'getDouyinSignleContentCommentListResponse');
  const url = `https://creator.douyin.com/aweme/v1/creator/comment/list/?cursor=${cursor}&count=${count}&item_id=${encodeURIComponent(
    item_id,
  )}&sort=TIME&msToken=${encodeURIComponent(msToken)}&a_bogus=`;

  const headers = {
    cookie: cookie,
    referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
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
 * 获取二级评论
 * @param cookie
 * @param comment_id 一级评论id
 * @param cursor 下一页参数
 * @param count 单页数量
 */
export const getDouyinLevel2ContentCommentListResponse = async (
  cookie: string,
  comment_id: string,
  cursor: number = 0,
  count: number = 10,
): Promise<DouyinCommentListResponse> => {
  const msToken = getDouyinMsToken(cookie, 'getDouyinLevel2ContentCommentListResponse');
  const url = `https://creator.douyin.com/aweme/v1/creator/comment/reply/list/?cursor=${cursor}&count=${count}&comment_id=${encodeURIComponent(
    comment_id,
  )}&msToken=${encodeURIComponent(msToken)}&a_bogus=`;

  const headers = {
    cookie: cookie,
    referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
  };
  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface DouyinCommentListResponse {
  comment_info_list: Array<DouyinCommentItem>;
  /**
   * 下一页参数
   */
  cursor: number;
  extra: { now: number };
  /**
   * 是否有下一页
   */
  has_more: boolean;
  has_vcd_filter: false;
  status_code: number;
  status_msg: string;
  /**
   * 评论总数
   */
  total_count: number;
}

export interface DouyinCommentItem {
  /**
   * 评论id
   */
  comment_id: string; //'@ifBr6bJOREz+ts5G6L/uvMF5pSqQYi/3JqoqO6dhjpiqrKz5YOUjf0x2bPeF6egN';
  /**
   * 10w位时间戳
   */
  create_time: number; // '1735281534';
  /**
   * 点赞数字符串
   */
  digg_count: string; // '0';
  followed: false;
  following: false;
  /**
   * 是否作者
   */
  is_author: false;
  /**
   * 级别，1级评论，2级？
   */
  level: number;
  /**
   * 回复数量字符串
   */
  reply_count: string; //'0';
  /**
   * 回复目标用户
   */
  reply_to_user_info: {
    /**
     * 头像
     */
    avatar_url: string;
    /**
     * 昵称
     */
    screen_name: string;
    /**
     * 用户加密id,
     */
    user_id: string;
  };
  status: number;
  /**
   * 评论内容
   */
  text: string; //'是自己跳成这样，还是你把那个屏幕的方向调整了';
  user_bury: false;
  user_digg: false;
  /**
   * 评论人信息
   */
  user_info: {
    /**
     * 评论人头像
     */
    avatar_url: string; //'https://p26.douyinpic.com/aweme/100x100/aweme-avatar/tos-cn-i-0813c001_ocoEozd3IACAAuAAAAjhLKdAFEDegAfEyoCTXt.jpeg?from=2956013662';
    screen_name: string; //'琉星、9月';
    user_id: string; //'@ifBr6bJOREz+ts5G7rnrt8B2oCmZZin+K6srO5BdvJ0qUIZyVAkX30cd2M+cM1eJ';
  };
  label_text: string;
}

const getDouyinCookieValue = (cookie: string, key: string): string => {
  const cookiePart = cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${key}=`));

  return cookiePart ? cookiePart.slice(key.length + 1) : '';
};

/**
 * 取 cookie 里的 msToken。
 *
 * 此前各处写的是 cookie.split('msToken=')[1]?.split('&')[0]：cookie 用 ';' 分隔，按 '&' 切
 * 会把后面的 cookie 一并带上；cookie 里压根没有 msToken 时更会得到 undefined，拼进 URL 就成了
 * 字面量 "msToken=undefined"。抖音对这种请求返回非 JSON 空响应，触发三次无意义重试后抛「重试200」——
 * 看起来像平台风控，实际是我们自己的参数错了。缺失时留日志并返回空串，让这类问题能被直接看见。
 */
const getDouyinMsToken = (cookie: string, apiName: string): string => {
  const value = getDouyinCookieValue(cookie, 'msToken');
  if (!value) {
    console.error(
      `[msToken缺失] api=${apiName} cookieLen=${cookie?.length ?? 0} ` +
        `含msToken字样=${!!cookie?.includes('msToken')}`,
    );
  }
  return value;
};

const getDouyinChromeVersion = (): string => {
  const match = HttpConfig.userAgent.match(/Chrome\/([\d.]+)/i);
  return match?.[1] ?? '138.0.7204.185';
};

/**
 * 获取最新评论通知列表
 * @param cookie
 * @param max_time 翻页时间参数，首页传0
 * @param count 单页数量
 * @param notice_group 通知分组，960为评论通知
 * @param proxyAgent 代理
 * @param min_time 最小时间参数，默认0
 * @param is_mark_read 是否标记已读，默认0避免影响站内状态
 */
export const getDouyinNoticeCommentListResponse = async (
  cookie: string,
  max_time: number = 0,
  count: number = 10,
  notice_group: number = 960,
  proxyAgent?: object,
  min_time: number = 0,
  is_mark_read: 0 | 1 = 0,
): Promise<DouyinNoticeCommentListResponse> => {
  const msToken = getDouyinCookieValue(cookie, 'msToken');
  const verifyFp = getDouyinCookieValue(cookie, 's_v_web_id') || getDouyinCookieValue(cookie, 'fp');
  const uifid = getDouyinCookieValue(cookie, 'UIFID') || getDouyinCookieValue(cookie, 'UIFID_TEMP');
  const browserVersion = getDouyinChromeVersion();
  const url =
    `https://www.douyin.com/aweme/v1/web/notice/?device_platform=webapp&aid=6383&channel=channel_pc_web` +
    `&is_new_notice=1&is_mark_read=${is_mark_read}&notice_group=${notice_group}&count=${count}` +
    `&min_time=${min_time}&max_time=${max_time}&update_version_code=170400&pc_client_type=1` +
    `&pc_libra_divert=Windows&support_h265=1&support_dash=1&cpu_core_num=6&version_code=170400` +
    `&version_name=17.4.0&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN` +
    `&browser_platform=Win32&browser_name=Chrome&browser_version=${encodeURIComponent(browserVersion)}` +
    `&browser_online=true&engine_name=Blink&engine_version=${encodeURIComponent(browserVersion)}` +
    `&os_name=Windows&os_version=10&device_memory=8&platform=PC&downlink=10&effective_type=4g` +
    `&round_trip_time=150&webid=&uifid=${encodeURIComponent(uifid)}&msToken=${encodeURIComponent(msToken)}` +
    `&a_bogus=&verifyFp=${encodeURIComponent(verifyFp)}&fp=${encodeURIComponent(verifyFp)}`;

  const headers = {
    cookie: cookie,
    referer: 'https://www.douyin.com/jingxuan',
  };

  const result = await $http.get(url, {
    timeout: 5000,
    headers: headers,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};

export interface DouyinNoticeCommentListResponse {
  status_code: number;
  status_msg: string;
  has_more: number;
  max_time: number;
  min_time: number;
  notice_list_v2: Array<DouyinNoticeCommentItem>;
  extra?: {
    now?: number;
  };
}

export interface DouyinNoticeCommentItem {
  nid: number;
  nid_str?: string;
  type: number;
  create_time: number;
  aweme_id?: string;
  comment?: {
    comment?: {
      cid: string;
      text: string;
      aweme_id: string;
      content_type?: number;
      image_list?: Array<{
        origin_url?: {
          url_list?: string[];
        };
        crop_url?: {
          url_list?: string[];
        };
      }>;
      user?: {
        uid: string;
        nickname: string;
        avatar_thumb?: {
          url_list?: string[];
        };
        avatar_larger?: {
          url_list?: string[];
        };
      };
    };
    aweme?: {
      aweme_id?: string;
    };
  };
}

/**
 * 获取作品列表
 * @param cookie
 * @param cursor 返回的下一页参数
 */
export const getCommentContentListResponse = async (
  cookie: string,
  cursor: string = '',
): Promise<DouyinCommentContentResponse> => {
  const msToken = getDouyinMsToken(cookie, 'getCommentContentListResponse');
  const url = `https://creator.douyin.com/aweme/v1/creator/item/list/?cursor=${cursor}&msToken=${msToken}&a_bogus=`;
  const headers = {
    cookie: cookie,
    referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
  };
  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface DouyinCommentContentResponse {
  /**
   * 下一页参数
   */
  cursor: string; //'1729761277000';
  extra: { now: number };
  /**
   * 是否有下一页
   */
  has_more: true;
  item_info_list: Array<DouyinCommentContentItem>;
  /**
   * 状态 0:正常
   */
  status_code: number;

  /**
   * 提示信息
   */
  status_msg: string;
  /**
   * 总作品数
   */
  total_count: number;
}

export interface DouyinCommentContentItem {
  anchor_user_id: string; //77354322772;
  /**
   * 评论数
   */
  comment_count: number;
  /**
   * 封面地址
   */
  cover_image_url: string; // 'https://p26-sign.douyinpic.com/tos-cn-i-dy/fc07a3a1e9564f0b8369589995e1de1e~tplv-dy-resize-walign-adapt-aq:540:q75.jpeg?lk3s=138a59ce&x-expires=1741064400&x-signature=Qoe1FmLlbbKJVM5458juievjsok%3D&from=327834062&s=PackSourceEnum_PUBLISH&se=false&sc=cover&biz_tag=aweme_video&l=20250218135410FC522EBB1C10BA0260CD';
  /**
   * 发布日期
   */
  create_time: string; // '发布于2025年02月14日 10:22';
  creator_item_setting: { charge_comment_audit: boolean };
  /**
   * 时长,毫秒
   */
  duration: number;
  /**
   * 作品加密id
   */
  item_id: string; //'@ifBr6bJOREz+ts5G6L/sv8h3pi+QYy/zKq8oOq1ujZhmpei3DKI8dx0CDrNbA6T7';
  /**
   * 作品id
   */
  item_id_plain: string; //'7471094105645255975';
  /**
   * url访问地址
   */
  item_link: string; //'https://www.iesdouyin.com/share/video/7471094105645255975/?region=CN&mid=7471094541437733659&u_code=mgc8985k&did=MS4wLjABAAAANwkJuWIRFOzg5uCpDRpMj4OX-QryoDgn-yYlXQnRwQQ&iid=MS4wLjABAAAANwkJuWIRFOzg5uCpDRpMj4OX-QryoDgn-yYlXQnRwQQ&with_sec_did=1&titleType=title&share_sign=M1yQjlVkeawJdgK_KlFGT5SjS5mad40ibboFvX5x61w-&share_version=210100&ts=1739858050&from_aid=1128&from_ssr=1';
  /**
   * 类型，4:视频，2:貌似是图文
   */
  media_type: number;
  /**
   * 标题/描述
   */
  title: string;
  /**
   * 作者
   */
  label_text: string;

  is_author?: boolean;
}

/**
 * 获取单个作品下的一级评论 V2
 * @param cookie
 * @param doc_id
 * @param cursor 下一页参数，首页传0
 * @param count 单页数量
 */
export const getDouyinSignleContentCommentListResponseV2 = async (
  cookie: string,
  doc_id: string,
  cursor: number = 0,
  count: number = 10,
  csrfToken?: string,
  proxyAgent?: object,
): Promise<DouyinCommentListV2Response> => {
  const msToken = getDouyinMsToken(cookie, 'getDouyinSignleContentCommentListResponseV2');
  const url = `https://creator.douyin.com/web/api/third_party/aweme/api/comment/read/aweme/v1/web/comment/list/select/?aweme_id=${encodeURIComponent(
    doc_id,
  )}&cursor=${cursor}&count=${count}&comment_select_options=0&sort_options=0&channel_id=618&app_id=2906&aid=2906&device_platform=webapp&msToken=${encodeURIComponent(
    msToken,
  )}&a_bogus=`;

  const headers: Record<string, string> = {
    cookie: cookie,
    'User-Agent': HttpConfig.userAgent,
    Accept: 'application/json, text/plain, */*',
    referer: 'https://creator.douyin.com/creator-micro/interactive/comment',
  };
  if (csrfToken) {
    headers['x-secsdk-csrf-token'] = csrfToken;
  }
  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};

/**
 * 获取二级评论 V2
 * @param cookie
 * @param comment_id 一级评论id
 * @param doc_id
 * @param cursor 下一页参数
 * @param count 单页数量
 */
export const getDouyinLevel2ContentCommentListResponseV2 = async (
  cookie: string,
  comment_id: string,
  doc_id: string,
  cursor: number = 0,
  count: number = 10,
): Promise<DouyinCommentListV2Response> => {
  const msToken = getDouyinMsToken(cookie, 'getDouyinLevel2ContentCommentListResponseV2');
  const url = `https://creator.douyin.com/web/api/third_party/aweme/api/comment/read/aweme/v1/web/comment/list/reply/?comment_id=${encodeURIComponent(
    comment_id,
  )}&item_id=${encodeURIComponent(
    doc_id,
  )}&cursor=${cursor}&count=${count}&app_id=2906&aid=2906&device_platform=webapp&msToken=${encodeURIComponent(
    msToken,
  )}&a_bogus=`;

  const headers = {
    cookie: cookie,
    referer: 'https://creator.douyin.com/creator-micro/interactive/comment',
  };
  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface DouyinCommentListV2Response {
  comments: Array<DouyinCommentItemV2>;
  /**
   * 下一页参数
   */
  cursor: number;
  extra?: {
    fatal_item_ids?: Array<string> | null;
    logid?: string;
    now?: number;
    scenes?: Array<string> | null;
  };
  has_more: number;
  log_pb?: {
    impr_id?: string;
  };
  merge_cursor?: string;
  status_code: number;
  status_msg?: string;
  /**
   * 评论总数
   */
  total: number;
}

export interface DouyinCommentItemV2 {
  /**
   * 评论id
   */
  cid: string;
  /**
   * 评论内容
   */
  text: string;
  aweme_id: string;
  /**
   * 10位时间戳
   */
  create_time: number;
  /**
   * 点赞数
   */
  digg_count: number;
  status: number;
  user: DouyinCommentUserV2;
  reply_id?: string;
  reply_comment_total?: number;
  comment_reply_total?: number;
  root_comment_id?: string;
  level?: number;
  user_digged?: number;
  user_buried?: boolean;
  reply_comment?: unknown;
  text_extra?: unknown[];
  label_text?: string;
  label_type?: number;
  reply_to_reply_id?: string;
  stick_position?: number;
  is_author_digged?: boolean;
  is_hot?: boolean;
  text_music_info?: unknown;
  image_list?: unknown;
  is_note_comment?: number;
  ip_label?: string;
  can_share?: boolean;
  item_comment_total?: number;
  video_list?: unknown;
  content_type?: number;
  is_folded?: boolean;
  enter_from?: string;
  decorated_emoji_info?: unknown;
  ent_parachute_tip?: number;
  merge_comment_label?: unknown;
  can_collect?: boolean;
  create_aweme_config?: {
    text?: string;
    content?: string;
    text_extra?: unknown[];
    text_prefix_end?: number;
    create_aweme_button_text?: string;
    create_aweme_toast?: string;
    create_aweme_toast_type?: number;
    gray_prefix_end?: number;
    action?: number;
    create_text_aweme_button_text?: string;
    create_image_aweme_button_text?: string;
    create_aweme_button_text2?: string;
  };
  [key: string]: unknown;
}

export interface DouyinCommentUserV2 {
  uid: string;
  short_id?: string;
  nickname: string;
  signature?: string;
  avatar_larger?: DouyinCommentUserAvatarV2;
  avatar_thumb?: DouyinCommentUserAvatarV2;
  avatar_medium?: DouyinCommentUserAvatarV2;
  [key: string]: unknown;
}

export interface DouyinCommentUserAvatarV2 {
  uri?: string;
  url_list?: Array<string>;
  width?: number;
  height?: number;
}
