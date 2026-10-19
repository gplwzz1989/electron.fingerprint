import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { ImagePartInfo } from '../douyin/douyin-base.service';
import crypto from 'crypto';
import { getSignServerUrl, Task } from '@/utils';
import { HttpsProxyAgent } from 'https-proxy-agent';

export const getXiguaToken = async (cookie: string): Promise<Array<string>> => {
  const url = 'https://mp.toutiao.com/xigua/api/contract/GetContractInfoList/';
  const result = await $http.get(url, {
    headers: {
      cookie: cookie,
    },
  });
  return result.headers['set-cookie'] ?? [];
};

/**
 * 获取用户信息
 * @param cookie
 * @param proxyAgent
 */
export const getUserInfoAsync = async (
  cookie: string,
  proxyAgent: object | undefined = undefined,
): Promise<ToutiaohaoUserInfoResponse> => {
  const result = await $http.get<unknown, AxiosResponse<ToutiaohaoUserInfoResponse>>(
    'https://mp.toutiao.com/mp/agw/media/get_media_info',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.toutiao.com/profile_v4/graphic/publish',
        authority: 'mp.toutiao.com',
      },
      params: {},
      httpsAgent: proxyAgent,
      httpAgent: proxyAgent,
    },
  );

  return result.data;
};

export interface ToutiaohaoUserInfoResponse {
  code: number;
  data: {
    account_status_info: {
      authorize_uri_status: number;
      company_name_status: number;
      license_uri_status: number;
      media_qualification_status: number;
      overall_status: number;
      overall_status_with_institution: number;
      tip_type: number;
    };
    author_info: {
      column_attach_card_permission: number;
      media_impr_boost_pkg_permission: number;
      media_keep_bjh_permission: number;
      media_keep_bjh_personal_page: string;
      media_type: number;
      need_confirm_info_src: boolean;
      plog_genre: number;
      primary_classification: number;
    };
    creator_project_info: {
      creator_project_banned_flag: boolean;
      praise_count_remained: number;
    };
    grayscale_test_permission: number;
    media: {
      ad_cooperation_permission: number;
      allow_reaudit_count: number;
      article_media_level: number;
      audio_cp_permission: number;
      audio_mp_cp_role: number;
      audio_original_permission: number;
      audio_permission: number;
      audio_track_permission: number;
      audited_special_qualification: number;
      avoid_confirm_sms_permission: number;
      ban_income_module: boolean;
      breaking_news_permission: number;
      can_appeal_modify_mobile: number;
      can_modify_type: number;
      can_sync_aweme_tuwen: boolean;
      can_user_modify: boolean;
      cancel_custom_menu: number;
      category: string;
      circumvent_tax_agreement: number;
      circumvent_tax_permission: number;
      claim_origin_permission: boolean;
      claim_video_origin_permission: boolean;
      column_quintessence_permission: number;
      comic_permission: number;
      comic_share_card_permission: number;
      commission_level: string;
      community_card_permission: number;
      community_column_permission: number;
      community_paid_checkin: boolean;
      community_sync: number;
      complaint_black_draft_permission: number;
      complaint_no_need_auth_permission: number;
      confirm_result: string;
      create_time: string;
      creative_lab_permission: number;
      /**
       * 媒体账号名称
       */
      display_name: string;
      display_submit_ocr_tip: boolean;
      doctor_id: string;
      edu_channel_permission: number;
      email_pending_verify: boolean;
      extra_spell_check: number;
      fans_article_count_remained: number;
      fans_red_packet: number;
      flipchat_permission: number;
      force_modify_base_info_in_audit: boolean;
      force_modify_base_info_to_submit: boolean;
      force_ocr_in_audit: boolean;
      force_ocr_to_submit: boolean;
      from_ad: number;
      full_member_qualification_info: string;
      full_member_qualification_type: number;
      gov_type_name: string;
      has_abtest_permission: boolean;
      has_ad_permission: boolean;
      has_already_authentication: boolean;
      has_app_permission: boolean;
      has_avoid_bind_phone_permission: boolean;
      has_column_card_permission: number;
      has_column_permission: boolean;
      has_comment_2_fans_permission: boolean;
      has_deal_platform_permission: number;
      has_feed_insert_permission: number;
      has_film_review_permission: boolean;
      has_hide_comment_permission: boolean;
      has_live_permission: boolean;
      has_media_lab_permission: boolean;
      has_praise_permission: boolean;
      has_private_letter_permission: boolean;
      has_product_permission: boolean;
      has_qingyun_self_recommendation_permission: number;
      has_quote_hot_permission: number;
      has_referral_permission: boolean;
      has_rss_permission: boolean;
      has_set_external_cover_permission: number;
      has_shown_annual_review_2019: number;
      has_shown_impr_boost_pkg_protocol_on_editor: number;
      has_shown_ocr_notify_on_editor: number;
      has_shown_ocr_notify_onboard: number;
      has_spread_applied: boolean;
      has_third_party_ad_permission: boolean;
      has_toutiao_ad_permission: boolean;
      has_toutiao_store_permission: number;
      has_view_media_lab: boolean;
      has_weixin_permission: boolean;
      has_wenda_contract_permission: number;
      has_wqqs_permission: boolean;
      hide_inspiration_item: number;
      highest_category: string;
      hot_article_flag: number;
      /**
       * 媒体用户头像url
       */
      https_avatar_url: string;
      https_display_avatar_url: string;
      /**
       * 媒体账号id
       */
      id: number;
      id_str: string;
      impr_boost_pkg_permission: number;
      in_guidance_white_list: boolean;
      in_mobile_appeal: number;
      income_belong_to_primary_media: number;
      income_type: number;
      invalid_creative_way: boolean;
      invalid_quality_score: boolean;
      invalid_security_grade: boolean;
      is_enable: boolean;
      is_hotkeys_whitelist: number;
      is_low_media: number;
      is_new_register: boolean;
      is_silent: boolean;
      keep_wx_permission: number;
      limit_date: string;
      live_product_permission: number;
      manual_publish_ad: number;
      matrix_collection: number;
      matrix_manage_permission: boolean;
      matrix_only_primary_function: boolean;
      matrix_withdraw_income_permission: number;
      mcn_pay_column_permission: number;
      media_invite_register_permission: number;
      media_matrix_invite_permission: boolean;
      media_status_str: string;
      media_writing_space_status: number;
      modify_type_status: number;
      month_salary_10k_count: number;
      new_hand: boolean;
      no_check_modify_time_permission: number;
      normative_information_area: string;
      not_claim_origin_cnt: number;
      novel_serial_cp: number;
      novel_serial_person: number;
      novel_share_card_permission: number;
      ocr_status: number;
      origin_debut_check_pgc_gallery: boolean;
      origin_debut_check_pgc_normal: boolean;
      overseas_account: number;
      pay_column_permission: number;
      pay_live_permission: number;
      pay_wenda_permission: number;
      pgc_custom_menu_permission: boolean;
      praise_count_remained: number;
      primary_classification: string;
      professional_media_service: number;
      profit_delegation: number;
      public_sentiment_analyze_permission: number;
      retain_third_party_ad_when_buyout: number;
      rss_origin_permission: number;
      rumor_library_permission: number;
      search_task_permission: number;
      self_recommendation_remained: number;
      serial_freeze_withdraw: number;
      short_video_profit: number;
      short_video_relate_game: string;
      show_creation_btn: number;
      show_fans_advance_func: boolean;
      show_guidance_bubble: boolean;
      show_paid_column_tab: boolean;
      show_wenda_corner_sign: boolean;
      status: number;
      story_account: number;
      story_depress_whitelist: number;
      third_title_permission: number;
      tie_fans: boolean;
      tma_permission: number;
      tree_plan_permission: number;
      type: number;
      use_financial_stock_card_permission: number;
      video_copyright_permission: boolean;
      video_product_permission: number;
      visit_task_plaza: number;
      watermark: number;
      weibo_crawl_permission: number;
      white_sync_aweme: string;
      writing_race_2020_count: number;
      writing_race_count_remained: number;
      wx_content_source_bayout: number;
      xigua_media_level: number;
      xigua_yangshimeiti: number;
    };
    media_enum_info: {
      video_ai_title: number;
    };
    other_biz_info: {
      show_creation_task: boolean;
    };
    pii_info: {
      enhance_picboolean: boolean;
    };
    profile_completeness_info: {
      authorization_info: {
        detail: string;
        status: number;
      };
      company_name_info: {
        detail: string;
        status: number;
      };
      license_info: {
        detail: string;
        status: number;
      };
      news_media_qualification_info: {
        detail: string;
        status: number;
      };
    };
    tag_info: {
      article_modify_white: number;
    };
    user: {
      allow_modify_white: number;
      attach_card_column: number;
      author_benefit_gray: number;
      author_benefit_hot_gallery: number;
      author_benefit_pay_column: number;
      author_benefit_praise: number;
      author_benefit_video_praise: number;
      ban_status: number;
      breaking_news_permission: number;
      check_mobile_exemption: number;
      create_time: number;
      creator_project: number;
      draft_to_cloud: number;
      flipchat_sync: number;
      /**
       * 用户头像url
       */
      https_avatar_url: string;
      /**
       * 用户账号id
       */
      id: number;
      id_str: string;
      live_room_permission: number;
      overseas_account: number;
      punish_status: number;
      /**
       * 用户账号昵称
       */
      screen_name: string;
      thread_product_permission: boolean;
      user_auth_info: string;
    };
  };
  err_no: number;
  message: string;
  now: number;
  reason: string;
}

export const getUserStatusInfoAsync = async (
  cookie: string,
  proxyAgent: object | undefined = undefined,
): Promise<TouTiaoHaoUserStatusResponse> => {
  const url = 'https://mp.toutiao.com/mp/agw/media/get_user_base_info';
  const result = await $http.get(url, {
    headers: {
      cookie: cookie,
      referer: 'https://mp.toutiao.com/profile_v4/graphic/publish',
      authority: 'mp.toutiao.com',
    },
    params: {},
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};
export interface TouTiaoHaoUserStatusResponse {
  code: number;
  /**
   * false为为实名认证
   */
  is_auth: boolean;
  /**
   * 4，
   */
  media_status: number;
  message: '';
  oversea_auth_status: number;
}

/**
 * 从服务器上签名
 */
export const getPubSign = async (
  userAgent: string,
  queryStr: string,
  body: string,
  microArticle: boolean = false,
): Promise<string> => {
  const signPreStr = { qr: queryStr, body: body, ua: userAgent };

  const postData = { url: '', cookie: JSON.stringify(signPreStr), signType: 'browser', signCommand: 'toutiao' };
  if (microArticle) {
    postData.cookie = postData.cookie.replace(/\\/g, '\\\\').replace(/"/g, '"');
  }
  for (let i = 0; i < 3; i++) {
    try {
      const url = getSignServerUrl('toutiaohao') + '/Sign/GetSign';

      const headers = {
        'Content-Type': 'application/json',
      };

      const result = await $http.post(url, JSON.stringify(postData), { headers });

      const signStr = result.data?.signature ?? '';
      if (signStr) {
        return signStr;
      } else {
        await Task.Delay(1000);
      }
    } catch (e) {
      console.debug('头条签名一次:' + e);
    }
  }

  return '';
};
