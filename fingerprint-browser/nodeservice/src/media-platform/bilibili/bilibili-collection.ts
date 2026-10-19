import { ListInfoResponse } from '@/media-platform';
import { AxiosError } from 'axios';
import { errorCode } from '@/media-platform/errorCode';
import { getVideoCollectionResponse, getBilibiliEquityResponse } from './bilibili-collection.service';
import { BaseResult } from '@/media-platform/baseResult';

/**
 * 获取B站合集列表
 * @param cookie
 */
export const getBilibiliCollection = async (cookie: string): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    const topicResult = await getVideoCollectionResponse(cookie);

    result.code = topicResult?.code ?? -1;
    result.msg = topicResult.message;
    if (topicResult.data?.seasons?.length) {
      result.dataList = topicResult.data.seasons?.map((obj) => ({
        yixiaoerId: obj.season.id?.toString(),
        yixiaoerName: obj.season.title,
      }));
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

/**
 * 检查用户是否有合集权限
 * @param cookie
 * @returns 权限检查结果
 */
export const checkBilibiliCollectionEquity = async (
  cookie: string,
): Promise<BaseResult & { hasEquity: boolean; level: number; fans: number }> => {
  const result = {
    code: 0,
    msg: '',
    hasEquity: false,
    level: 0,
    fans: 0,
  };

  try {
    const ratingResult = await getBilibiliEquityResponse(cookie);

    if (ratingResult.code !== 0) {
      result.code = ratingResult.code;
      result.msg = ratingResult.message || '获取权益信息失败';
      return result;
    }

    result.level = ratingResult.data?.level || 0;
    result.fans = ratingResult.data?.fans || 0;

    const equityList = ratingResult.data?.equity?.list || [];
    const collectionEquity = equityList.find((item) => item.name === 'multipleArc');

    if (!collectionEquity) {
      result.code = errorCode.data_error;
      result.msg = '未找到合集权益信息';
      return result;
    }

    // state: 0=未开通 1=已开通
    result.hasEquity = collectionEquity.state === 1;
    result.msg = result.hasEquity ? '已开通合集权限' : collectionEquity.detail?.condition || '未满足合集权限条件';

    return result;
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
    return result;
  }
};
