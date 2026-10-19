import { $http } from '../../http';
import { regex } from './kuaishou-base.service';
import { Guid, isJson } from '../../utils';

/**
 * 获取商品列表信息
 * @param cookie
 * @param keyWord 搜搜关键词
 * @param cursor 翻页下一页参数，首页默认为空，来自接口返回的相应参数，返回值为'-1'时表示没有下一页
 */
export const getGoodsResponse = async (
  cookie: string,
  keyWord: string,
  cursor: string = '',
): Promise<KuaishouGoodsResponse> => {
  const url = 'https://cp.kuaishou.com/rest/cp/works/v2/video/pc/relation/list';

  const headers = {
    cookie: cookie,
    Referer: 'https://cp.kuaishou.com/article/publish/video',
  };

  const match = regex.exec(cookie);
  const webapiId = match ? match[1] : Guid.NewGuid().toString().replace(/-/g, '');
  const postData = { type: 1, cursor: cursor, 'kuaishou.web.cp.api_ph': webapiId };
  if (keyWord) {
    postData['title'] = keyWord;
  }

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface KuaishouGoodsResponse {
  /**
   * 状态码 1正常 非1异常
   */
  result: number;
  data?: {
    list: Array<KuaishouGoodsInfo>;
    /**
     * 下一页参数
     */
    cursor: string;
  };
  /**
   * 提示消息
   */
  message: string;
}

export interface KuaishouGoodsInfo {
  /**
   * 商品名称
   */
  title: string;
  /**
   * 商品图片链接
   */
  url: string;
  /**
   * 发布使用的参数体
   */
  associateTaskId: {
    taskId: number;
    bindId: string;
    entranceType: number;
    bindType: string;
    taskType: string;
  };
  /**
   * 价格，1位小数，单位-元
   */
  price: number;
}
