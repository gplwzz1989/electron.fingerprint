import { $http } from '@/http';
import FormData from 'form-data';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 *
 * @param cookie
 * @param imgUrl 图片url地址
 * @param accountId 用户账号id
 */
export const getImgFromUrl = async (
  cookie: string,
  imgUrl: string,
  accountId: number,
): Promise<SouhuhaoImgFromUrlResponse> => {
  const url = 'https://mp.sohu.com/commons/front/outerUpload/v2/url';

  const headers = {
    cookie: cookie,
    referer: `https://mp.sohu.com`,
    'X-Requested-With': 'XMLHttpRequest',
  };

  const multiFormData = new FormData();
  multiFormData.append('url', imgUrl);
  multiFormData.append('accountId', accountId);

  const result = await $http.post(url, multiFormData, {
    headers: headers,
  });

  return result.data;
};

export interface SouhuhaoImgFromUrlResponse {
  /**
   * 图片地址，不带协议头  //www.pic.com/123.jpeg
   */
  url: string;
  width: number;
  height: number;
  size: number;
  type: string;
  ori: ImgFromUrlItem;
  tl: ImgFromUrlItem;
  code: number;
  msg: string;
}

export interface ImgFromUrlItem {
  /**
   * 图片地址，不带协议头  //www.pic.com/123.jpeg
   */
  url: string;
  width: number;
  height: number;
  size: number;
  type: string;
}

export const publishArticle = async (
  cookie: string,
  pubType: number,
  postData: string,
  accountId: number,
  isPre: boolean = false,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<PublishArticleResponse> => {
  let url: string = `https://mp.sohu.com/mpbp/bp/news/v4/news/${
    pubType === 1 ? 'publish' : 'draft'
  }?accountId=${accountId}`;

  if (isPre) {
    url = `https://mp.sohu.com/mpbp/bp/news/v4/news/schedulePublish?accountId=${accountId}`;
  }

  const mpcv = cookie.split('mp-cv=')[1]?.split(';')[0];

  const headers = {
    cookie: cookie,
    referer: 'https://mp.sohu.com/mpfe/v3/main/news/addarticle?contentStatus=1',
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    'sp-cm': mpcv,
  };

  const result = await $http.post(url, postData, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface PublishArticleResponse {
  data: number; //| { ailureRelatedNewsTitle: string };  originalStatus: number;
  code: number; //2000000
  msg: string;
  success: boolean;
}
