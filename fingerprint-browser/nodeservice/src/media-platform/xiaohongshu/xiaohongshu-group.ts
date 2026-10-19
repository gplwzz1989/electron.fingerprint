import { ListInfoResponse } from '@/media-platform';
import { AxiosError } from 'axios';
import { errorCode } from '@/media-platform/errorCode';
import { getXiaohongshuGroupResponse } from './xiaohongshu-group.service';

export const getXiaohongshuGroup = async (cookie: string, nextPage?: string): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    const topicResult = await getXiaohongshuGroupResponse(cookie, nextPage);

    result.code = topicResult?.code ?? -1;
    result.msg = topicResult.msg;
    if (topicResult.data?.group_list?.length) {
      result.dataList = topicResult.data?.group_list.map((obj) => ({
        yixiaoerId: obj.group_id?.toString(),
        yixiaoerName: obj.group_name,
        yixiaoerDesc: obj.desc,
        yixiaoerImageUrl: obj.avatar,
        //viewNum: obj.view_num,
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
