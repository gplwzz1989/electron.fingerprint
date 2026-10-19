import { $http } from '@/http';

export const getXiaohongshuGoodsEntranceResponse = async (
  cookie: string,
): Promise<XiaoHongShuGoodsEntranceResponse> => {
  const urlPath = `/api/edith/bridge/trade_note/permission`;

  const url = `https://ark.xiaohongshu.com${urlPath}`;

  const postData = {};

  // const signStr = await getNewSign(urlPath, JSON.stringify(postData));
  // const sign = JSON.parse(signStr);
  // if (sign['a1']) {
  //   cookie = `${cookie};a1=${sign['a1']}`;
  // }
  const headers = {
    cookie: cookie,
    Origin: 'https://creator.xiaohongshu.com',
    referer: 'https://www.xiaohongshu.com',
  };
  // headers['X-s'] = sign['X-s'];
  // headers['X-t'] = sign['X-t'];

  const result = await $http.post(url, postData, { headers: headers });

  return result.data;
};
/**
 * 商品选择入口配置响应数据结构
 */
interface XiaoHongShuGoodsEntranceResponse {
  code: number;
  success: boolean;
  msg: string;
  data: {
    entrance_list: Array<{
      goods_type_options: string[];
      option_name: string;
      option_desc: string;
      tab_infos: Array<{
        tab_desc: string;
        multi_goods_permission: boolean;
        tab_id: number;
        tab_type: 'all' | 'ai' | 'hot' | 'new' | 'trend' | 'potential'; // 枚举化固定值
        tab_name: string;
        goods_seller_type: string;
      }>;
      max_bind_goods: number;
      entrance: number;
      deeplink: string;
      trade_note_type: string;
      option_button: string;
      note_flag: string;
    }>;
    entrance_desc: string;
    entrance_name: string;
    option_entrance_name: string;
    publish_permissions: Array<{
      permission: boolean;
      type: number;
    }>;
    response: {
      success: boolean;
    };
  };
}

export const getXiaohongshuZhiBoResponse = async (
  cookie: string,
  userId: string,
): Promise<XiaoHongShuTrailerPlanResponse> => {
  const urlPath = `/api/sns/red/livemall/manager/pc/v1/trailer/trailer_complex_plan/info?user_id=${userId}`;

  const url = `https://live-mall.xiaohongshu.com${urlPath}`;

  // const signStr = await getNewSign(urlPath, undefined);
  // const sign = JSON.parse(signStr);
  // if (sign['a1']) {
  //   cookie = `${cookie};a1=${sign['a1']}`;
  // }
  const headers = {
    cookie: cookie,
    Origin: 'https://creator.xiaohongshu.com',
    referer: 'https://www.xiaohongshu.com',
  };
  // headers['X-s'] = sign['X-s'];
  // headers['X-t'] = sign['X-t'];

  const result = await $http.get(url, { headers: headers });

  return result.data;
};
/**
 * 预告片绑定计划响应数据结构
 */
interface XiaoHongShuTrailerPlanResponse {
  code: number;
  success: boolean;
  msg: string;
  data: {
    result: {
      success: boolean;
      code: number;
      message: string;
    };
    can_bind_trailer_complex_plan_info_list: Array<{
      type: number;
      start_time: number; // 毫秒级时间戳
      trailer_info: {
        start_time: number;
        title: string;
        subscribe_num: number;
        note_count: number;
        id_str: string;
        plan_id_str: string;
        pool_id_str: string;
        id: number;
        plan_id: number;
        pool_id: number;
      };
    }>;
    cannot_bind_trailer_complex_plan_info_list: []; // 固定空数组
  };
}

export const getXiaohongshuGoodsListResponse = async (
  cookie: string,
  pageNum: string = '1',
  keyWord:string=''
): Promise<XiaoHongSHuGoodsListResponse> => {
  const urlPath = `/api/edith/snsbridge/ark/goods_list_v2`;

  const url = `https://ark.xiaohongshu.com${urlPath}`;

  const postData = {
    goods_option_type: 'goods_seller',
    keyword: keyWord??'',
    page_num: Number(pageNum)?Number(pageNum):1,
    tab_type: 1,
    order_column: 'first_buyable_time',
    order_asc: false,
    goods_id_for_memory: [],
  };

  // const signStr = await getNewSign(urlPath, JSON.stringify(postData));
  // const sign = JSON.parse(signStr);
  // if (sign['a1']) {
  //   cookie = `${cookie};a1=${sign['a1']}`;
  // }
  const headers = {
    cookie: cookie,
    Origin: 'https://creator.xiaohongshu.com',
    referer: 'https://www.xiaohongshu.com',
  };
  // headers['X-s'] = sign['X-s'];
  // headers['X-t'] = sign['X-t'];

  const result = await $http.post(url, postData, { headers: headers });

  return result.data;
};

/**
 * 单个商品信息（独立抽离的核心接口）
 */
export interface XiaoHongShuGoodsInfo {
  /**
   * 是否审核通过 1:表示通过，其他表示不可用
   */
  passed: number;
  ai_recommend: number;
  sale_qty_total: number;
  /**
   * 商品名称
   */
  name: string;
  /**
   * 商品图片
   */
  image: string;
  goods_seller_type: string;
  deep_link: string;
  related_note_30d_count: number;
  related_note_total_count: number;
  /**
   * 商品id，挂载时需要
   */
  goods_id: string;
  base_image: string;
  sale_qty_recent30: number;
  purchase_price_range: string;
  original_price: number;
  /**
   * 商品价格/展示价格，单位/分
   */
  purchase_price: number;
  extension: {
    itemId: string;
    aiPublishPermission: string;
  };
  inventory: number;
  //规格描述
  variants: string;
  item_id: string;
}

/**
 * 商品列表接口整体响应（包含所有嵌套结构，仅这一个顶层定义）
 */
export interface XiaoHongSHuGoodsListResponse {
  code: number;
  success: boolean;
  msg: string;
  data: {
    data: Array<{
      goods_info: XiaoHongShuGoodsInfo; // 引用独立的商品信息接口
    }>;
    result: {
      total: number;
      end_tag: number;
    };
  };
}
