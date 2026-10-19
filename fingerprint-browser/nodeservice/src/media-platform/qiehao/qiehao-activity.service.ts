import { $http } from '../../http';
import { isJson } from '../../utils';
import { BadRequestException } from '../../error';

/**
 * 获取活动列表
 * @param cookie
 * @param page 页码
 * @param limit 每页数量
 */
export const getActivityListAsync = async (
  cookie: string,
  page: number,
  limit: number,
): Promise<QiehaoActivityResponse> => {
  const url = 'https://om.qq.com/mother/crowdsource/getactivityInfo4Media';

  const headers = {
    cookie: cookie,
    Referer: 'https://om.qq.com/main/creation/video',
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    params: {
      page: page,
      limit: limit,
      article_scope: 2,
      source_platform: '',
      only_active: 2,
      relogin: 1,
      art_type: 2,
      contribute_way: '0,1',
    },
  });

  if (result.data.response.code !== 0) {
    throw new BadRequestException(result.data?.response.msg, result.data?.response.code, result.data);
  }

  return result.data;
};

export interface QiehaoActivityInfo {
  activity_article_total: number;
  activity_detail: string;
  activity_draft_category: string;
  activity_draft_payment: string;
  activity_type: string;
  apply_audit_result_confirm: number;
  apply_audit_type: number;
  apply_audit_way: number;
  apply_cond_switch: number;
  apply_end: string;
  apply_recruit_limit: number;
  apply_reject_reason: string;
  apply_state: number;
  article_scope: number;
  article_scope_categoryId: string;
  article_scope_detail: string;
  article_scope_type: string;
  banner: string;
  banner_id: string;
  bonus_type: number;
  business_order_tags: string;
  business_time_module: {
    announce_time: string;
    announce_time_name: string;
    custom_style_pic: string;
    end_time: string;
    end_time_name: string;
    name: string;
    sorted_time_module: Array<{
      name: string;
      time: string;
      type: string;
    }>;
    start_time: string;
    start_time_name: string;
    style: number;
  };
  can_apply: number;
  category: string;
  commercial_data: string;
  commercial_type: number;
  content_agreements: string;
  content_items: string;
  content_platform_banner: string;
  content_platform_cover: string;
  content_platform_ip_id: string;
  content_platform_publisher_name: string;
  content_platform_publisher_type: number;
  contribute_account_type: number;
  contribute_way: number;
  desc: string;
  description_module_name: string;
  diy_bonus_text: string;
  end_time: string;
  finish_general_budget_cent: number;
  fuyao_media_scope_condition: string;
  fuyao_media_scope_level_list: string;
  general_budget_cent: number;
  h5_url_news: string;
  id: string;
  imgurl: string;
  income_type: number;
  is_content_agreement: boolean;
  is_hide_detail: number;
  is_need_apply: number;
  is_show_in_trade: boolean;
  is_test_activity: boolean;
  is_top: boolean;
  long_term: string;
  max_bonus: number;
  name: string;
  need_apply_info: number;
  origin: number;
  origin_id: string;
  priority: number;
  product_state: number;
  pub_limit: number;
  publisher: string;
  remain_count: number;
  show_way_v2: string;
  source_platform: string;
  start_time: string;
  submit_count: number;
  submit_state: number;
  time_module: string;
  type: number;
  upload_limit_once: number;
  works_configured_article_list: string;
  works_configured_article_module_name: string;
  writer_amount: number;
  writer_content_amount: number;
}

export interface QiehaoActivityResponse {
  response: {
    code: number;
    msg: string;
  };
  data: {
    info: Array<QiehaoActivityInfo>;
    total: number;
    page: number;
  };
}
