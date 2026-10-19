import { ListActivityInfoResponse } from '@/media-platform';
import { errorCode } from '@/media-platform/errorCode';
import { AxiosError } from 'axios';
import { getActivityTopicResponse } from '@/media-platform/xiaohongshu/xiaohongshu-activity.service';
import dayjs from 'dayjs';

export const getXiaoHongShuActivityListInfo = async (cookie: string): Promise<ListActivityInfoResponse> => {
  const result: ListActivityInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    const activityResponse = await getActivityTopicResponse(cookie);
    result.code = activityResponse?.code ?? errorCode?.data_error;
    result.msg = activityResponse?.msg;
    if (activityResponse?.data?.activity_list?.length) {
      for (const item of activityResponse?.data?.activity_list) {
        const topItem = item.topic_infos[0];
        result.dataList?.push({
          yixiaoerId: topItem.id,
          yixiaoerName: topItem.name,
          yixiaoerDesc: item.activity_reward,
          yixiaoerImageUrl: item.picture_link,
          start_date: dayjs(item.start_time).format('MM-DD'),
          end_date: dayjs(item.end_time).format('MM-DD'),
          raw: topItem,
        });
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
