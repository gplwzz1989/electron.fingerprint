import { $http, HttpConfig } from '../../http';
import { isJson } from '../../utils';

export const getCategoryInfo = async (cookie: string): Promise<categoryInfoResponse> => {
  const headers = {
    cookie: cookie,
    referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
  };

  const url = `https://creator.douyin.com/aweme/v1/creator/selftag/get/alltags?cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=${HttpConfig.userAgent}&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&_signature=`;

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface categoryInfoResponse {
  /**
   * 状态码
   * -0正常，非0异常
   */
  status_code: number;

  /**
   * 提示消息
   */
  status_msg: string;

  /**
   * 分类列表，列表下的第三级是分类下属的标签
   */
  tag_list: Array<DouyinCategoryInfo>;
}

export interface DouyinCategoryInfo {
  /**
   * 分类id
   */
  tag_id: number;
  /**
   * 分类名称
   */
  show_name: string;
  /**
   * 子类列表
   */
  child_list: Array<DouyinCategoryInfo>;
}
