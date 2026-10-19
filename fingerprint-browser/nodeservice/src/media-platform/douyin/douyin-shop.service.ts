import { $http, HttpConfig } from '../../http';
import { douyinPublishGoodsInfo } from '../douyin/douyin-base.service';
import { isJson } from '../../utils';
import { AxiosProxyConfig } from 'axios';
import { getSign } from '@/media-platform/douyin/douyin-base';
/**
 *
 * @param cookie
 * @param goodsUrl
 * @param sdkToken
 */
export const parseGoodsInfo = async (
  cookie: string,
  goodsUrl: string,
  sdkToken: string,
): Promise<douyinGoodsResponse> => {
  let url = `https://creator.douyin.com/web/api/media/shop/promotion/link/?`;
  const headers = {
    cookie: cookie,
    'x-secsdk-csrf-token': sdkToken,
    'Content-Type': 'application/x-www-form-urlencoded',
    referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
    'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/110.0.0.0'
  };
  const postData = 'promotion_link=' + encodeURIComponent(goodsUrl);
  const msToken = cookie?.includes('msToken')
    ? cookie?.split('msToken=')[1]?.split(';')[0]
    : `${Date.now()}yahsjyanjgasnd`;
  const signData = JSON.stringify({ msToken: msToken, body: postData });
  const sign = await getSign(signData);
  url = `${url}msToken=${msToken}&a_bogus=${sign}`;

  const result = await $http.post(url, postData, {
    // retryCondition: (error, response) => {
    //   return !isJson(response.data);
    // },
    headers: headers,
  });
  return result?.data;
};

export const checkGoodsIsInvalid = async (
  cookie: string,
  sdkToken: string,
  goodsListInfo: Array<DouyinGoodsInfo>,
  proxy: AxiosProxyConfig | undefined = undefined,
): Promise<{ shop_draft_id: string; status_code: number; status_msg: string }> => {
  const shops: Array<douyinPublishGoodsInfo> = [];

  for (const item of goodsListInfo) {
    const imgs: Array<string> = [];
    if (item.goods_imgs?.length > 0) {
      for (const img of item.goods_imgs) {
        imgs.push(img?.elastic_img?.uri);
      }
    }

    const rawData: douyinPublishGoodsInfo = {
      promotion_id: item.promotion_id,
      elastic_title: item.elastic_title,
      elastic_img: imgs.join(','),
      label: null,
      product_id: item?.gid,
      promotion_source: item?.promotion_source,
      third_party: 2,
    };
    shops.push(rawData);
  }

  const headers = {
    cookie: cookie,
    'x-secsdk-csrf-token': sdkToken,
    referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
  };
  const postData = 'raw_draft=' + encodeURIComponent(JSON.stringify(shops));
  const url = `https://creator.douyin.com/web/api/media/shop/draft/update/?cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=${encodeURIComponent(
    HttpConfig.userAgent,
  )}&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&_signature=`;

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    proxy: proxy,
  });
  return result.data;
};

/**
 * 商品计息响应
 */
export interface douyinGoodsResponse {
  /**
   * 状态码
   * -0正常，非0异常
   */
  status_code: number;

  /**
   *提示消息
   */
  status_msg: string;

  /**
   * 商品列表
   */
  promotions: Array<DouyinGoodsInfo>;
}

/**
 * 商品信息
 */
export interface DouyinGoodsInfo {
  /**
   * 商品所属平台logo图片地址
   */
  brand_icon: {
    url_list: Array<string>;
  };
  /**
   * 佣金，单位RBM分
   */
  cos_fee: number;
  cos_radio: number;
  /**
   * 产品id
   */
  gid: string;
  /**
   * 商品图片列表
   */
  goods_imgs: Array<{
    elastic_img: {
      uri: string;
      //单个图片地址cnd列表
      url_list: Array<string>;
    };
  }>;
  imgs: Array<{
    uri: string;
    url_list: Array<string>;
  }>;
  item_type: number;
  label: null;
  /**
   * 原价
   */
  market_price: number;
  /**
   * 售价
   */
  price: number;
  /**
   *商品id
   */
  promotion_id: string;

  /**
   * 商品来源
   */
  promotion_source: number;
  /**
   * 销量
   */
  sales: number;
  /**
   * 商品名称
   */
  title: string;
  /**
   * 自定义短标题
   */
  elastic_title: string;
  /**
   * 商品地址
   */
  url: string;
}
