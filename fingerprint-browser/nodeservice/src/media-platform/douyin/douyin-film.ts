import { ListInfoResponse, ListItemInfo } from '@/media-platform';
import { errorCode } from '@/media-platform/errorCode';
import { AxiosError } from 'axios';
import { getFilmListResponse } from './douyin-film.service';

export const getDouyinFilmList = async (cookie: string, keyword?: string): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: errorCode.ok,
    msg: '',
    dataList: [],
  };
  try {
    const collectionResult = await getFilmListResponse(cookie, keyword);
    result.code = collectionResult?.status_code ?? -1;
    result.msg = collectionResult?.status_msg;
    if (collectionResult?.search_list?.length) {
      for (const item of collectionResult?.search_list) {
        const collection: ListItemInfo = {
          yixiaoerId: item.id,
          yixiaoerName: item.name,
          yixiaoerDesc: item.type_name,
          yixiaoerImageUrl: item.poster?.url_list[0],
          viewNum: item.play_cnt,
          raw: {},
        };

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
