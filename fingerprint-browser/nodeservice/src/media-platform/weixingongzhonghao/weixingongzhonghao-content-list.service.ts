import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';

/**
 * 微信公众号内容列表（旧版本，返回 JSON）
 * @param cookie
 * @param begin 数据起始数字
 * @param count 每页数量
 * @param token 用户账号token
 */
export const getContentListAsync = async (
  cookie: string,
  begin: number,
  count: number,
  token: number,
): Promise<WeixingongzhonghaoContentListResponse> => {
  const result = await $http.get<unknown, AxiosResponse<WeixingongzhonghaoContentListResponse>>(
    'https://mp.weixin.qq.com/cgi-bin/appmsgpublish',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.weixin.qq.com/cgi-bin/appmsgpublish',
        authority: 'mp.weixin.qq.com',
      },
      params: {
        sub: 'list',
        begin: begin,
        count: count,
        token: token,
        type: '101_1_102_103',
        free_publish_type: '1_102_103',
        lang: 'zh_CN',
        f: 'json',
      },
    },
  );

  // 请求失败
  if (result.data.base_resp.ret !== 0) {
    throw new BadRequestException(result.data.base_resp.err_msg, result.data.base_resp.ret, result.data);
  }

  return result.data;
};

/**
 * 微信公众号内容列表（新版本，从 HTML 中解析）
 * @param cookie
 * @param begin 数据起始数字
 * @param count 每页数量
 * @param token 用户账号token
 */
export const getContentListFromHtmlAsync = async (
  cookie: string,
  begin: number,
  count: number,
  token: string,
  proxyAgent?: object,
): Promise<WeixingongzhonghaoPublishPage> => {
  const result = await $http.get<string>('https://mp.weixin.qq.com/cgi-bin/appmsgpublish', {
    headers: {
      cookie: cookie,
      referer: 'https://mp.weixin.qq.com/cgi-bin/appmsgpublish',
      authority: 'mp.weixin.qq.com',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    },
    params: {
      sub: 'list',
      begin: begin,
      count: count,
      token: token,
      lang: 'zh_CN',
    },
    responseType: 'text',
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  // 从 HTML 中提取 publish_page 数据
  const htmlContent = result.data;

  // 匹配 publish_page 变量（在 script 标签内）
  const publishPageMatch = htmlContent.match(/let\s+publish_page;\s*let\s+isPublishPageNoEncod;\s*publish_page\s*=\s*({[\s\S]+?})\s*;[\s\S]*?<\/script>/);

  if (!publishPageMatch) {
    throw new BadRequestException('无法从响应中提取内容列表数据', -1, { html: htmlContent.substring(0, 500) });
  }

  try {
    // 解析 JSON 数据
    const publishPageData = JSON.parse(publishPageMatch[1]);

    // 解析 publish_list 中的 publish_info（它们是 JSON 字符串）
    if (publishPageData.publish_list && Array.isArray(publishPageData.publish_list)) {
      publishPageData.publish_list = publishPageData.publish_list.map((item: any) => {
        if (item.publish_info && typeof item.publish_info === 'string') {
          try {
            // publish_info 是 HTML 转义的 JSON 字符串，需要先解码
            const decodedInfo = item.publish_info
              .replace(/&quot;/g, '"')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>');
            item.publish_info = JSON.parse(decodedInfo);
          } catch (e) {
            console.error('解析 publish_info 失败:', e);
          }
        }
        return item;
      });
    }

    return publishPageData;
  } catch (error) {
    throw new BadRequestException('解析内容列表数据失败', -1, { error: (error as Error)?.message });
  }
};

export interface WeixingongzhonghaoContentListResponse {
  base_resp: {
    err_msg: string;
    ret: number;
  };
  publish_page: string;
}

export interface WeixingongzhonghaoPublishPage {
  total_count: number;
  publish_count: number;
  masssend_count: number;
  featured_count: number;
  publish_list: PublishItem[];
}

export interface PublishItem {
  publish_type: number;
  publish_info: PublishInfo | string;
}

export interface PublishInfo {
  type: number;
  msgid: number;
  sent_info: {
    time: number;
    func_flag: number;
    is_send_all: boolean;
    is_published: number;
  };
  publish_info?:{create_time?:number}
  sent_status: {
    total: number;
    succ: number;
    fail: number;
    progress: number;
    userprotect: number;
  };
  sent_result: {
    msg_status: number;
    refuse_reason: string;
    reject_index_list: any[];
    update_time: number;
    msg_fail_reason?: string;
  };
  appmsg_info: AppmsgInfo[];
  appmsgex: any[];
  copy_type: number;
  copy_appmsg_id: number;
  new_publish: number;
  publish_type: number;
}

export interface AppmsgInfo {
  share_type: number;
  appmsgid: number;
  content_url: string;
  title: string;
  is_deleted: boolean;
  copyright_status: number;
  copyright_type: number;
  read_num: number;
  like_num: number;
  comment_id: string;
  is_comment_enable: boolean;
  comment_num: number;
  reprint_num?: number;
  vote_id: any[];
  super_vote_id: any[];
  cover: string;
  smart_product: number;
  modify_status?: number;
  appmsg_like_type: number;
  can_delete_status?: number;
  old_like_num: number;
  itemidx: number;
  videoid?:string;
  is_pay_subscribe: number;
  is_from_transfer: number;
  public_tag_info: {
    public_tag_list: any[];
    modify_times: number;
    init_tag_list_size: number;
  };
  appmsg_album_info: {
    appmsg_album_infos: any[];
  };
  digest: string;
  delete_time?: number;
  delete_nickname?: string;
  open_fansmsg: number;
  is_cooling_article: number;
  pic_cdn_url_235_1: string;
  pic_cdn_url_16_9: string;
  disable_recommend: number;
  line_info: {
    use_line: number;
    line_count: number;
    send_time: number;
    is_appmsg_flag: number;
    is_use_flag: number;
  };
  claim_source_type: number;
  claim_source?: {
    is_user_no_claim_source?: number;
  };
  is_forced_reprint?: number;
  share_num: number;
  is_rumor_refutation: number;
  segment_comment_id: string;
  is_segment_comment_enable: boolean;
  multi_picture_cover: number;
  share_imageinfo: any[];
  moment_like_num: number;
  item_show_type: number;
  ad_info: {
    has_agreement_ad: number;
    is_recruit_agreement_ad: number;
  };
  audio_in_appmsg: any[];
  modify_wording?: string;
  can_modify?: number;
  modify_detail_wording: string[];
  appmsg_modified?: number;
  total_comment_count_contains_reply: number;
}
