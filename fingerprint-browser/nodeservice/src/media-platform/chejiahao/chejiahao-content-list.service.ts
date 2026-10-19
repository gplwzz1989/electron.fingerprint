//https://www.meipai.com/medias/video_convert_list

import { $http } from '@/http';

/**
 *
 * @param cookie
 * @param page
 * @param type 0:全部 2:视频 1::图文（文章）
 * @param pageSize
 * @param status 默认空为全部，1:已发布 0:审核中 2:未通过
 */
export const getCheJiaHaoContentListResponse = async (
  cookie: string,
  page: number = 1,
  type: number = 0,
  pageSize: number = 10,
  status: '' | '0' | '1' | '2' = '',
): Promise<CheJiaHaoContentListResponse> => {
  const url = `https://creator.autohome.com.cn/openapi/ypttd/yjc/csc/creator/workslist?`;

  const headers = {
    cookie: cookie,
    referer: 'https://creator.autohome.com.cn/web/publish/video',
    Origin: 'https://creator.autohome.com.cn',
  };

  const params = {
    pageno: page,
    infotype: type,
    status: status,
    searchtext: '',
    pagesize: pageSize,
    source: 0,
    contenttype: 0,
    userid: '',
    isdel: 0,
  };

  const result = await $http.get(url, { headers: headers, params: params });

  return result.data;
};

export interface CheJiaHaoContentListResponse {
  message: string;
  result: {
    pageid: string;
    result: Array<CheJiaHaoContentItem>;
    totalcount: number;
  };
  returncode: number;
}

export interface CheJiaHaoContentItem {
  app_url: string;
  author_id: number;
  author_img: string;
  author_name: string;
  /**
   * publishid  docid
   */
  biz_id: number;
  biz_types: number;
  biz_update_time: string;
  client_type: number;
  club_bbs_id: number;
  club_bbs_type: string | null;
  club_delete_flag: number;
  club_is_poll: number;
  club_qa_summary: string | null;
  content_icon_dto: {
    exchangevideostatus: number;
    ishighgrade: number;
    rejectreason: string | null;
    share: number;
    videostatus: number;
  };
  contenttype: number;
  creator_infoid: number;
  datum: {
    bizid: number;
    biztype: number;
    click: number;
    ctr: number;
    eventname: string | null;
    itemid: string | null;
    pv: number;
    starttime: string | null;
    status: number;
    targetvalue: number;
  };
  durationstr: string;
  first: number;
  global_id: string;
  img_url: string;
  info_source: number;
  is_cooperate: number;
  is_delete: number;
  is_publish: number;
  is_recommending: number;
  is_tuwen: number;
  like_count: number;
  main_data_type: string;
  new_energy_icon: number;
  original: number;
  pc_url: string;
  publish_time: string;
  publish_timing: string | null;
  pv: number;
  recommended: number;
  /**
   * 审核失败提示
   */
  reject_reason: string;
  reply_count: number;
  sequenceno: string | null;
  source_name: string | null;
  status: number;
  taskid: number;
  title: string;
  video_source: string | null;
  video_type: number;
  vote_id: number;
  vote_num: number;
  vv: number;
}
