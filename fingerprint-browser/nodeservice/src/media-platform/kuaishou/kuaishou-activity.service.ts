import { $http } from '@/http';

export const getActivityCategoryResponse = async (cookie: string): Promise<KuaishouActivityCategoryResponse> => {
  const url = 'https://cp.kuaishou.com/rest/v2/creator/activity/pc/tab?__NS_sig3=';

  const headers = {
    cookie: cookie,
    Referer: 'https://cp.kuaishou.com/article/publish/video',
  };

  const postData = { 'kuaishou.web.cp.api_ph': cookie.split('kuaishou.web.cp.api_ph=')[1]?.split(';')[0] };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface KuaishouActivityCategoryResponse {
  /**
   * 1:正常
   */
  result: number;
  message: string;
  data: {
    list: [{ value: number; label: string; recommend: boolean }];
  };
}

export const getActivityListResponse = async (
  cookie: string,
  categoryId: number,
  page: number = 1,
): Promise<KuaishouActivityResponse> => {
  const url = 'https://cp.kuaishou.com/rest/v2/creator/activity/pc/list?__NS_sig3=';

  const headers = {
    cookie: cookie,
    Referer: 'https://cp.kuaishou.com/article/publish/video',
  };

  const postData = {
    page: page,
    count: 20,
    category: categoryId,
    sortType: 0,
    rewardType: 0,
    pageSource: 2,
    'kuaishou.web.cp.api_ph': cookie.split('kuaishou.web.cp.api_ph=')[1]?.split(';')[0],
  };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface KuaishouActivityResponse {
  /**
   * 1:正常
   */
  result: number;
  message: string;
  data: {
    list: [KuaishouActivityInfo];
    totalCount: number;
  };
}

export interface KuaishouActivityInfo {
  id: number;
  activityId: string;
  /**
   * 领取活动时需要的id
   */
  sourceId: number;
  /**
   * 名称
   */
  title: string;
  /**
   * 图片
   */
  headUrl: string;
  number: 586;
  /**
   * 开始时间戳
   */
  beginTime: number;
  /**
   * 结束时间戳
   */
  endTime: number;
  viewCountDown: false;
  countDoneTime: number;
  topGain: string;
  status: number;

  /**
   * 描述1.2
   */
  tagLabels: Array<string>;
  newActivity: false;
  overSoon: false;
  unclaimed: true;

  /**
   * 描述1.1
   */
  customTag: string;
  /**
   * 描述2
   */
  brief: string;
  collect: false;
}

/**
 * 领取活动
 * @param cookie
 * @param sourceId
 */
export const setActivityResponse = async (
  cookie: string,
  sourceId: number,
): Promise<{ result: number; message: string }> => {
  const url = 'https://cp.kuaishou.com/rest/cp/creator/pc/task/claim?__NS_sig3=';

  const headers = {
    cookie: cookie,
    Referer: 'https://cp.kuaishou.com/article/publish/video',
  };

  const postData = {
    'kuaishou.web.cp.api_ph': cookie.split('kuaishou.web.cp.api_ph=')[1]?.split(';')[0],
    taskId: sourceId,
  };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};
