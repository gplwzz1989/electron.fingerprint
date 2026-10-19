import { $http } from '../../http';
import { isJson } from '../../utils';
import { getNewSign } from './xiaohongshu-base.service';
/**
 * 获取/搜索话题信息
 * @param cookie
 * @param keyWord  搜索关键词
 * @param pageNum 翻页页码,默认值1
 */
export const getTopicListResponse = async (
  cookie: string,
  keyWord: string,
  pageNum: number = 1,
): Promise<XiaohongshuTopicResponse> => {
  const urlPath = '/web_api/sns/v1/search/topic';
  const url = `https://edith.xiaohongshu.com${urlPath}`;

  const postData = {
    keyword: keyWord ?? '',
    suggest_topic_request: { title: '', desc: `#${keyWord ?? ''}` },
    page: { page_size: 20, page: pageNum > 0 ? pageNum : 1 },
  };

  const sign = await getNewSign(urlPath, JSON.stringify(postData));
  const signJo = JSON.parse(sign);
  if (signJo['a1']) {
    cookie = cookie.replace('a1=', 'a1old=');
    cookie = `${cookie};a1=${signJo['a1']}`;
  }
  const headers = {
    cookie: cookie,
    referer: 'https://creator.xiaohongshu.com/',
    Authorization: '',
    Origin: 'https://creator.xiaohongshu.com',
  };
  headers['X-t'] = signJo['X-t'];
  headers['X-s'] = signJo['X-s'];
  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface XiaohongshuTopicResponse {
  success: true;
  msg: string;
  data: {
    topic_info_dtos: Array<XiaohongshuTopicInfo>;
  };
  /**
   * 状态码0正常 非0异常 -100登录过期/未登录
   */
  code: number;
}

export interface XiaohongshuTopicInfo {
  /**
   * 话题类型
   */
  type: string;
  smart: boolean;
  /**
   * 话题id
   */
  id: string;
  /**
   * 话题名称
   */
  name: string;
  /**
   * 话题链接
   */
  link: string;
  /**
   * 热度/阅读数
   */
  view_num: number;
}

export const createTopicResponse = async (
  cookie: string,
  keyWord: string,
): Promise<XiaohongshuCreateTopicResponse | null> => {
  const urlPath = '/web_api/sns/capa/postgw/topic/batch_customized';
  const url = `https://edith.xiaohongshu.com${urlPath}`;

  const postData = { topic_names: keyWord };

  const sign = await getNewSign(urlPath, JSON.stringify(postData));
  if (!sign) {
    return null;
  }
  const signJo = JSON.parse(sign);

  if (signJo['a1']) {
    cookie.replace('a1=', 'a1old=');
    cookie = `${cookie};a1=${signJo['a1']}`;
  }
  const headers = {
    cookie: cookie,
    referer: 'https://creator.xiaohongshu.com/',
    Authorization: '',
    Origin: 'https://creator.xiaohongshu.com',
  };
  headers['X-t'] = signJo['X-t'];
  headers['X-s'] = signJo['X-s'];

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface XiaohongshuCreateTopicResponse {
  msg: string;
  data: { topic_infos: Array<{ id: string; name: string }> };
  result: number;
  success: boolean;
}


