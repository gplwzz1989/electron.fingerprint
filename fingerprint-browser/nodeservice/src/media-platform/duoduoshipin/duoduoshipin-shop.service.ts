import { $http } from '@/http';

export const getGoodsInfoResponse = async (
  cookie: string,
  goodsId: string,
  anti_content?: string,
): Promise<DuoDuoGoodsBatchResponse> => {
  const url = 'https://live.pinduoduo.com/api/backbone/goods/check';

  const headers = {
    cookie: cookie,
    referer: 'https://live.pinduoduo.com',
    'Anti-Content': anti_content,
    'content-type': 'application/json',
  };

  const postData = { goodsIds: [Number(goodsId)] };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

/**
 * 单个商品信息（独立抽离，便于复用）
 */
export interface DuoDuoGoodsItem {
  /**
   * 商品id，发布用
   */
  goodsId: number;
  /**
   * 商品名称
   */
  title: string;
  /**
   * 封面
   */
  image: string;
  /**
   * 价格、分
   */
  price: number;
  stock: number;
  stockTip: string;
  priceTip: string;
  /**
   * 已枪n件描述
   */
  soldQuantityTip: string;
  commissionPercentTip: string;
  commissionTip: string;
  mallId: null | number;
  linkUrl: null | string;
  promotionRate: number;
}

/**
 * 接口整体响应（包含所有嵌套结构）
 */
interface DuoDuoGoodsBatchResponse {
  success: boolean;
  errorCode: number;
  errorMsg: null | string;
  result: {
    successCount: number;
    failureCount: number;
    reasons: [{ reason: string }];
    goodsList: DuoDuoGoodsItem[];
    riskCheckDiffGoods: any[];
    pubHiddenGoodsIds: any[];
  };
}
