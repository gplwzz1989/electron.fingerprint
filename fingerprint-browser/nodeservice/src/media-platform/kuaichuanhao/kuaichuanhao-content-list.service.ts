import { $http } from '@/http';

export const getKuaiChunContentListResponse = async (
  cookie: string,
  startDDateStr: string,
  endDateStr: string,
  page: number = 1,
  title?: string,
): Promise<KuaichuanhaoContentListResponse> => {
  const url = 'https://kuaichuan.360kuai.com/content/contentList';

  const headers = {
    cookie: cookie,
    referer: 'https://kuaichuan.360kuai.com',
    Origin: 'https://kuaichuan.360kuai.com',
  };

  const params = {
    page: page,
    start_date: startDDateStr,
    end_date: endDateStr,
    title: title,
  };

  const result = await $http.get(url, { headers: headers, params: params });

  return result.data;
};

export interface KuaichuanhaoContentListResponse {
  errno: number;
  errmsg: string;
  data: {
    cur_time: number;
    list: Array<KuaiChuanHaoContentItem>;
    status: Array<string>;
    page_info: { total: number; page: number; page_size: number };
  };
}

export interface KuaiChuanHaoContentItem {
  id: string;
  qid: string;
  type: string;
  /**
   *  '3':不通过
   */
  status: string;
  source: string;
  title: string;
  content_id: string;
  trans_url:string;
  /**
   * 不通过原因
   */
  op_reason: string;
  create_time: string;
  publish_time: string;
  audit_time: string;
  update_time: string;
  edit_time: string;
  image_list: Array<string>;
  image_style: string;
  url: string;
  original_status: string;
  fixed_time: string;
  transcode_status: string;
  ext: string;
  act: string;
  recommend_num: number;
  pv_num: number;
}
