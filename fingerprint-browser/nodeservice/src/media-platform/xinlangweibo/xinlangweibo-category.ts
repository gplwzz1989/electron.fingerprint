import { ListItemInfoLevel, ListLevelInfoResponse } from '@/media-platform';
import { AxiosError } from 'axios';
import { errorCode } from '@/media-platform/errorCode';
import { getWeiBoVideoCategoryResponse } from './xinlangweibo-category.service';

export const getWeiboCategory = async (cookie: string): Promise<ListLevelInfoResponse> => {
  const result: ListLevelInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    const categoryResult = await getWeiBoVideoCategoryResponse(cookie);
    if (categoryResult.data?.list?.length) {
      for (const item of categoryResult.data?.list) {
        const firstCate: ListItemInfoLevel = {
          yixiaoerId: item.channel_id_str ?? '',
          yixiaoerName: item.desc,
        };
        if (item.sub_channels?.length) {
          firstCate.child = [];
          const j = 0;
          for (const child of item.sub_channels) {
            firstCate.child?.push({
              yixiaoerId: child.sub_channel_id_str ?? '',
              yixiaoerName: child.name,
            });
          }
        }
        result.dataList?.push(firstCate);
      }
    }
    result.code =
      categoryResult?.code === '100000' ? 0 : Number(categoryResult?.code) ? Number(categoryResult?.code) : -1;
    result.msg = categoryResult.msg;
    result.data = categoryResult.data;
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
