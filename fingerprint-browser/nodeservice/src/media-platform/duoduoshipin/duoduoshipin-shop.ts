import { ListGoodsInfoResponse } from '@/media-platform';
import { AxiosError } from 'axios';
import { errorCode } from '@/media-platform/errorCode';
import { getGoodsInfoResponse } from '@/media-platform/duoduoshipin/duoduoshipin-shop.service';

export const getDuoduoshipinGoodsList = async (cookie: string, keyWord?: string): Promise<ListGoodsInfoResponse> => {
  const result: ListGoodsInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };
  try {
    const goodsResult = await getGoodsInfoResponse(cookie, keyWord ?? '0');
    if (goodsResult?.result?.goodsList?.length) {
      for (const content of goodsResult.result.goodsList) {
        result.dataList?.push({
          yixiaoerId: content.goodsId?.toString(),
          yixiaoerName: content.title,
          yixiaoerImageUrl: content.image,
          yixiaoerDesc: content.soldQuantityTip,
          price: content.price,
          raw: {}, //content.goods_info,
        });
      }
    }

    result.code = goodsResult?.errorCode === 1000000 ? 0 : -1;
    result.msg = goodsResult?.errorMsg ?? '';
    if (goodsResult?.result?.reasons?.length) {
      result.code = 400;
      result.msg = goodsResult.result.reasons[0].reason;
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};
