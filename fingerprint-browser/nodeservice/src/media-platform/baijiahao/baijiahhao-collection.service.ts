import { $http } from '@/http';
import { isJson } from '@/utils';

export const getBaijiahaoCollectionResponse = async (
  cookie: string,
  page: number = 1,
): Promise<BaijiahaoCollectionListResponse> => {
  const url = `https://baijiahao.baidu.com/builder/author/article/listSet`;

  const headers = {
    cookie: cookie,
    Referer: 'https://baijiahao.baidu.com/builder/rc/edit?type=videoV2&is_from_cms=1',
    Origin: 'https://baijiahao.baidu.com',
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const postData = `type=video_set&pageSize=50&videoSetNids=&currentPage=${page ?? 1}&tab=canadd&search=&from=edit`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

/** 百家号合集列表返回数据 */
export interface BaijiahaoCollectionListResponse {
  errno: number;
  errmsg: string;
  data: {
    page: {
      currentPage: number;
      pageSize: number;
      totalCount: number;
      totalPage: number;
    };
    list: Array<{
      nid: string;
      app_name: string;
      app_id: number;
      bapp_id: number;
      created_at: string;
      publish_at: string;
      updated_at: string;
      status: string;
      title: string;
      type: string;
      article_id: string;
      source_name: string;
      source_id: number;
      url: string;
      cover_images: string;
      video_num: number;
      set_is_over: number;
      is_pay_subscribe: number;
      news_num: number;
      dt_num: number;
      is_pay_playlet: number;
      is_set_selected: number;
      unselected_message: string;
      cover_image: string;
    }>;
  };
  request_id: string;
  ie: string;
}
