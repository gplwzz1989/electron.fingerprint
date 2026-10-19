import { $http } from '@/http';
import { Guid } from '@/utils';

export const searchMiniAppResponse = async (
  cookie: string,
  keyWord: string,
  userToken: number,
): Promise<WeixingongzhonghaoMiniappResponse> => {
  const url = 'https://mp.weixin.qq.com/cgi-bin/operate_appmsg?sub=search_weapp';

  const headers = {
    cookie: cookie,
    'X-Requested-With': 'XMLHttpRequest',
    Referer: 'https://mp.weixin.qq.com/cgi-bin/home',
    Origin: 'https://mp.weixin.qq.com',
    'Content-Type': 'application/x-www-form-urlencoded',
    Charset: 'UTF-8',
  };

  const postData = `key=${encodeURIComponent(keyWord ?? '')}&fingerprint=${Guid.NewGuid()
    .toString()
    .replace(/-/g, '')}&token=${userToken}&lang=zh_CN&f=json&ajax=1`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export const searchLinkMiniAppResponse = async (
  cookie: string,
  linkWord: string,
  userToken: number,
): Promise<WeixingongzhonghaoLinkMiniappResponse> => {
  const url = 'https://mp.weixin.qq.com/cgi-bin/operate_appmsg?sub=search_weapp_link';

  const headers = {
    cookie: cookie,
    'X-Requested-With': 'XMLHttpRequest',
    Referer: 'https://mp.weixin.qq.com/cgi-bin/home',
    Origin: 'https://mp.weixin.qq.com',
    'Content-Type': 'application/x-www-form-urlencoded',
    Charset: 'UTF-8',
  };

  const postData = `link=${encodeURIComponent(linkWord ?? '')}&fingerprint=${Guid.NewGuid()
    .toString()
    .replace(/-/g, '')}&token=${userToken}&lang=zh_CN&f=json&ajax=1`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface WeixingongzhonghaoMiniappResponse {
  base_resp: {
    err_msg: string;
    /**
     * 0正常 非0异常
     */
    ret: number;
  };
  items: Array<{
    weapp: WeiXingGongZhongHaoMiniAppInfo;
  }>;
}

export interface WeixingongzhonghaoLinkMiniappResponse {
  base_resp: {
    err_msg: string;
    /**
     * 0正常 非0异常
     */
    ret: number;
  };
  weapp: WeiXingGongZhongHaoMiniAppInfo;
  weapp_path: string;
}

export interface WeiXingGongZhongHaoMiniAppInfo {
  appid: string;
  func_infos: [];
  has_guarantee_flag: number;
  headimg_url: string;
  main_page: string;
  nickname: string;
  released: number;
  service_type: number;
  username: string;
}
