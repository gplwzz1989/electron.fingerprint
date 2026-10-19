import { $http } from '../../http';
import { GetTimeStamp, isJson } from '../../utils';

/**
 * 获取商品列表
 * @param cookie
 * @param keyWord 搜索关键词
 * @param finderUsername 可选,默认空
 * @param lastBuffer 可选,默认空
 */
export const getGoodsListResponse = async (
  cookie: string,
  keyWord: string,
  finderUsername?: string,
  lastBuffer?: string,
): Promise<ShipinhaoGoodsResponse> => {
  let url = 'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/shop/get_all_window_products';
  if (keyWord) {
    url = 'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/shop/search_products';
  }

  const headers = {
    referer: 'https://channels.weixin.qq.com',
    cookie: cookie,
  };

  const postData = {
    status: 1,
    lastBuffer: lastBuffer ?? '',
    notNeedTestProduct: 1,
    miniAppsVersion: 2,
    order: 1,
    orderType: 2,
    branchId: 0,
    notNeedProductOn: 0,
    timestamp: GetTimeStamp(13),
    _log_finder_uin: null,
    _log_finder_id: finderUsername,
    rawKeyBuff: null,
    pluginSessionId: null,
    scene: 1,
    reqScene: 1,
  };
  if (keyWord) {
    postData['queryWords'] = keyWord?.trim();
  }
  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface ShipinhaoGoodsResponse {
  /**
   *  错误码
   */
  errCode: number;
  /**
   * 提示消息
   */
  errMsg: string;
  data?: {
    /**
     * 商品列表
     */
    products: Array<ShipinhaoGoodsInfo>;
  };

  /**
   * 下一页参数值
   */
  lastBuffer: string;

  /**
   * 是否还有下一页数据
   */
  continueFlag: number;
}

export interface ShipinhaoGoodsInfo {
  /**
   * 商品标题
   */
  title: string;

  /**
   *商品id，发布用
   */
  productId: string;
  /**
   *商品id，可显示在界面上的
   */
  outProductId: string;

  /**
   * 商品图片
   */
  imgUrls: Array<string>;

  /**
   * 商品所属平台名称
   */
  platformName: string;

  /**
   * 售价 单位:分
   */
  sellingPrice: number;

  /**
   * 库存
   */
  stock: number;
}
