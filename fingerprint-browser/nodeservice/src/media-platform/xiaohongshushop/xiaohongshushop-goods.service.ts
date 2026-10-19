import { $http } from '../../http';
import { isJson } from '../../utils';

export interface XiahongshushopShowGoodsResponse {
  /**
   * 状态码，0:正常，非0异常
   */
  code: number;
  success: boolean;
  /**
   * 提示消息
   */
  msg: string;
  /**
   * 第一级商品信息列表
   */
  data: Array<{
    goods_info: XiaohongshushopShowGoodsInfo;
  }>;
}

export interface XiaohongshushopShowGoodsInfo {
  /**
   * 商品名称
   */
  name: string;
  /**
   * 商品图片
   */
  image: string;
  /**
   * 商品唯一id，获取商品二级详细列表使用
   */
  goods_id: string;
  /**
   * 是否审核通过 1:表示通过，其他表示不可用
   */
  passed: number;

  /**
   * 商品价格/展示价格，单位/分
   */
  purchase_price: number;
}

export interface XiaohongshushopPubGoodsResponse {
  /**
   * 状态码 0：正常,非0异常
   */
  code: number;
  /**
   * 是否成功
   */
  success: boolean;
  /**
   * 提示消息
   */
  msg: string;
  data: {
    goods_all_variant: {
      content: Array<XiaohongshushopPubGoodsInfo>;
    };
  };
}

export interface XiaohongshushopPubGoodsInfo {
  /**
   * 商品名称
   */
  name: string;
  /**
   * 商品图片
   */
  image: string;
  /**
   * 商品唯一id，发布使用
   */
  goods_id: string;
  /**
   * 是否审核通过 1:表示通过，其他表示不可用
   */
  item_status: number;

  /**
   * 商品价格/展示价格，单位/元
   */
  price: number;
  /**
   * 商品款式/类型参数，这个参数和具体商品唯一对应
   */
  variants: Array<{
    /**
     *  属性id
     */
    id: string;
    /**
     * 属性名称
     */
    name: string;
    /**
     * 属性值
     */
    value: string;
  }>;

  goods_seller_type:string,
}

export const getXiaohongshuShowGoodsResponse = async (
  cookie: string,
  keyWord: string,
  pageNum: number = 1,
): Promise<XiaoHongShuShopGoodsResponse> => {
  const url = 'https://ark.xiaohongshu.com/api/edith/snsbridge/ark/goods_list_v2';
  const headers = {
    cookie: cookie,
    Referer: 'https://ark.xiaohongshu.com/',
    Origin: 'https://ark.xiaohongshu.com',
  };

  const postData = {
    goods_option_type: 'goods_seller',
    keyword: keyWord ?? '',
    page_num: pageNum ? pageNum : 1,
    tab_type: 1,
    order_column: 'first_buyable_time',
    order_asc: false,
    goods_id_for_memory: [],
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

interface XiaoHongShuShopGoodsInfo {
  image: string;
  ai_recommend: number;
  related_note_total_count: number;
  goods_seller_type: string;
  inventory: number;
  sale_qty_recent30: number;
  purchase_price_range: string;
  item_id: string;
  name: string;
  deep_link: string;
  base_image: string;
  sale_qty_total: number;
  extension: {
    itemId: string;
    aiPublishPermission: string;
  };
  related_note_30d_count: number;
  goods_id: string;
  original_price: number;
  purchase_price: number;
  passed: number;
  variants: string;
}

export interface XiaoHongShuShopGoodsResponse {
  code: number;
  success: boolean;
  msg: string;
  data: {
    result: {
      end_tag: number;
      total: number;
    };
    data: Array<{
      goods_info: XiaoHongShuShopGoodsInfo;
    }>;
  };
}

export const getXiaohongshuPubGoodsResponse = async (
  cookie: string,
  goodsId: string,
): Promise<XiaohongshushopPubGoodsResponse> => {
  const url = 'https://ark.xiaohongshu.com/api/edith/snsbridge/ark/variants-cfg';

  const headers = {
    cookie: cookie,
    Referer: 'https://ark.xiaohongshu.com/',
    Origin: 'https://ark.xiaohongshu.com',
  };

  const params = { goods_id: goodsId };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    params: params,
  });

  return result.data;
};
