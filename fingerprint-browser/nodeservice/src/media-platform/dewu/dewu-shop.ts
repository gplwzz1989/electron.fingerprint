import { ListGoodsInfoResponse } from '@/media-platform';
import { AxiosError } from 'axios';
import { errorCode } from '@/media-platform/errorCode';
import { getDeWuGoodsResponse } from './dewu-shop.service';

export const getDeWuGoodsList = async (cookie: string, keyword: string): Promise<ListGoodsInfoResponse> => {
  const result: ListGoodsInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };
  try {
    const goodsResult = await getDeWuGoodsResponse(cookie, keyword);
    if (goodsResult?.data?.list?.length) {
      for (const content of goodsResult.data.list) {
        result.dataList?.push({
          yixiaoerId: content.productId.toString(),
          yixiaoerName: content.title,
          yixiaoerImageUrl: content.logoUrl,
          raw: content,
        });
      }
    }

    result.code = goodsResult?.code ?? -1;
    result.msg = goodsResult?.msg;
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
