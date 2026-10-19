import { ListInfoResponse } from '@/media-platform';
import { AxiosError } from 'axios';
import { errorCode } from '@/media-platform/errorCode';
import { getBaijiahaoCollectionResponse } from './baijiahhao-collection.service';

export const getBaijiahaoCollection = async (cookie: string): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    const topicResult = await getBaijiahaoCollectionResponse(cookie);

    result.code = topicResult?.errno ?? -1;
    result.msg = topicResult.errmsg;
    if (topicResult.data?.list?.length) {
      result.dataList = topicResult.data.list?.map((obj) => ({
        yixiaoerId: obj.nid,
        yixiaoerName: obj.title,
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
