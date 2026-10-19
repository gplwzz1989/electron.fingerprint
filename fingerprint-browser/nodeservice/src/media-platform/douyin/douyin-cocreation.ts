import { ListInfoResponse, ListItemInfoLevel } from '@/media-platform';
import { errorCode } from '@/media-platform/errorCode';
import { AxiosError } from 'axios';
import { getCoCreationResponse } from '@/media-platform/douyin/douyin-cocreation.service';

export const getDouyinCoCreation = async (cookie: string): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: errorCode.ok,
    msg: '',
    dataList: [],
    permission: false,
  } as never;
  try {
    const collectionResult = await getCoCreationResponse(cookie);
    result.code = collectionResult?.status_code ?? -1;
    result.msg = collectionResult?.status_msg;
    if (collectionResult.data?.entry_status === 1) {
      result['permission'] = true;
      for (const item of collectionResult.data?.roles) {
        const collection: ListItemInfoLevel = {
          yixiaoerId: item.id?.toString(),
          yixiaoerName: item.title,
          yixiaoerDesc: item.desc,
          maxNum: item.max_num ?? 99,
        } as never;

        result.dataList?.push(collection);
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
