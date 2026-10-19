import { ListActivityInfoResponse, ListLevelInfoResponse } from '@/media-platform';
import {
  getActivityCategoryResponse,
  getActivityListResponse,
} from '@/media-platform/kuaishou/kuaishou-activity.service';
import { AxiosError } from 'axios';
import { errorCode } from '@/media-platform/errorCode';
import dayjs from 'dayjs';

export const getKuaiShouActivityCategory = async (cookie: string): Promise<ListLevelInfoResponse> => {
  const result: ListLevelInfoResponse = {
    code: 0,
    dataList: [],
  };

  try {
    const activityCategoryResult = await getActivityCategoryResponse(cookie);
    result.code =
      activityCategoryResult?.result === 1
        ? 0
        : activityCategoryResult?.result === 0
        ? -1
        : activityCategoryResult.result ?? -1;
    result.msg = activityCategoryResult?.message;
    if (activityCategoryResult?.data?.list?.length) {
      for (const item of activityCategoryResult?.data?.list) {
        result.dataList?.push({ yixiaoerId: item.value?.toString(), yixiaoerName: item.label });
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

export const getKuaiShouActivityListInfo = async (
  cookie: string,
  categoryId: string = '0',
  nextPage: string = '1',
): Promise<ListActivityInfoResponse> => {
  const result: ListActivityInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    if (!categoryId) {
      categoryId = '0';
    }
    if (!nextPage) {
      nextPage = '1';
    }
    const activityResponse = await getActivityListResponse(cookie, Number(categoryId), Number(nextPage));
    result.code =
      activityResponse?.result === 1 ? 0 : activityResponse?.result === 0 ? -1 : activityResponse.result ?? -1;
    result.msg = activityResponse?.message;
    if (activityResponse?.data?.list) {
      if (activityResponse?.data?.list?.length > 19) {
        result.nextPage = (Number(nextPage) + 1).toString();
      }
      for (const item of activityResponse?.data?.list) {
        const newItem = {
          yixiaoerId: item.sourceId?.toString(),
          yixiaoerName: item.title,
          yixiaoerDesc: item.brief,
          yixiaoerImageUrl: item.headUrl,
          tags: [''],
          start_date: dayjs(item.beginTime).format('MM.DD'),
          end_date: dayjs(item.endTime).format('MM.DD'),
          raw: { activityId: item.activityId, name: item.title },
        };
        newItem.tags = [];
        if (item.customTag) {
          newItem.tags.push(item.customTag);
        }
        if (item.tagLabels?.length) {
          newItem.tags.push(...item.tagLabels);
        }

        result.dataList?.push(newItem);
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
