import { ListInfoResponse } from '@/media-platform';
import { AxiosError } from 'axios';
import { errorCode } from '@/media-platform/errorCode';
import { getXiaohongshuCollectionResponse } from './xiaohongshu-collection.service';

export const getXiaohongshuCollection = async (cookie: string, nextPage?: string): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    const topicResult = await getXiaohongshuCollectionResponse(cookie, nextPage);

    result.code = topicResult?.result ?? -1;
    result.msg = topicResult.msg;
    if (topicResult.data?.collection_info_list?.length) {
      result.nextPage = topicResult?.data?.next_cursor;
      result.dataList = topicResult.data?.collection_info_list.map((obj) => ({
        yixiaoerId: obj.id?.toString(),
        yixiaoerName: obj.name,
        yixiaoerDesc: obj.desc,
        yixiaoerImageUrl: obj.icon,
        viewNum: obj.view_num,
        //raw: obj,
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
