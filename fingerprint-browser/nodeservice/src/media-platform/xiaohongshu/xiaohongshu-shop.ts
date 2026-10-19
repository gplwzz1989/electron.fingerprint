import { AxiosError } from 'axios';
import { errorCode } from '@/media-platform/errorCode';
import { ShoppingPrivilege } from '@/cloud/model/SearchDataModel';
import {
  getXiaohongshuGoodsEntranceResponse,
  getXiaohongshuGoodsListResponse,
  getXiaohongshuZhiBoResponse,
} from './xiaohongshu-shop.service';
import { ListGoodsInfoResponse, ListInfoResponse } from '@/media-platform';

export const getXiaoHongShuShopPrivilege = async (cookie: string): Promise<ShoppingPrivilege> => {
  const result: ShoppingPrivilege = {
    code: 0,
    msg: '',
    shopping_cart: false,
  };

  try {
    const shopResult = await getXiaohongshuGoodsEntranceResponse(cookie);

    result.code = shopResult?.code ?? -1;
    result.msg = shopResult?.msg ?? '';
    if (result.code == 0 && shopResult.data?.entrance_list?.length) {
      for (const item of shopResult.data.entrance_list) {
        if (item.option_name?.includes('商品')) {
          result.shopping_cart = true;

          return result;
        }
      }
      result.shopping_cart = false;
    } else if (result.code == 0) {
      result.shopping_cart = false;
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

export const getXiaoHongShuZhiBoPlanList = async (cookie: string, userId?: string): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: '',
  };
  result.dataList = [];

  try {
    const shopResult = await getXiaohongshuZhiBoResponse(cookie, userId ?? '');

    result.code = shopResult?.code ?? -1;
    result.msg = shopResult?.msg ?? '';
    if (result.code == 0 && shopResult.data?.can_bind_trailer_complex_plan_info_list?.length) {
      for (const item of shopResult.data.can_bind_trailer_complex_plan_info_list) {
        item.trailer_info['type'] = item.type;
        const newItem = {
          yixiaoerId: item.trailer_info?.id_str,
          yixiaoerName: item.trailer_info.title,
          subscribeNum: item.trailer_info.subscribe_num,
          noteCount: item.trailer_info.note_count,
          startTime: item.trailer_info.start_time,
          raw: item.trailer_info,
        };
        result.dataList.push(newItem as never);
      }
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

export const getXiaoHongShuGoodsList = async (
  cookie: string,
  nextPage: string = '1',
  keyWord: string = '',
): Promise<ListGoodsInfoResponse> => {
  const result: ListGoodsInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };
  try {
    const goodsResult = await getXiaohongshuGoodsListResponse(cookie, nextPage, keyWord);
    if (goodsResult?.data?.data?.length) {
      // 下一页参数
      if (goodsResult?.data?.result?.end_tag == 0) {
        result.nextPage = (Number(nextPage) + 1).toString();
      }
      for (const content of goodsResult.data.data) {
        result.dataList?.push({
          yixiaoerId: content.goods_info?.goods_id?.toString(),
          yixiaoerName: content.goods_info.name,
          yixiaoerImageUrl: content.goods_info.image,
          yixiaoerDesc: content.goods_info.variants,
          price: content.goods_info.purchase_price,
          raw: {}, //content.goods_info,
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
