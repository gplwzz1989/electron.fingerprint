import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { GetTimeStamp } from '../../utils';
import { BadRequestException } from '../../error';

/**
 * 获取活动话题
 * @param cookie
 * @param realUserId 用户信息realUserId
 * @param wemediaId 用户信息wemediaId
 */
export const getActivityTopicAsync = async (
  cookie: string,
  realUserId: string,
  wemediaId: string,
): Promise<WangyihaoActivityTopicResponse> => {
  const result = await $http.get<unknown, AxiosResponse<WangyihaoActivityTopicResponse>>(
    'https://mp.163.com/wemedia/video/getActivity.do',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.163.com/subscribe_v3/index.html',
        Origin: 'https://mp.163.com',
        Host: 'mp.163.com',
      },
      params: {
        _: GetTimeStamp(13),
        realUserId: realUserId,
        wemediaId: wemediaId,
      },
    },
  );

  // 请求失败
  if (result.data.code !== 1) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface WangyihaoActivityTopicResponse {
  code: number;
  msg: string;
  data: Array<{
    activityId: string;
    activityName: string;
    activityUrl: string;
    subjectId: string;
    subjectTitle: string;
  }>;
}

/**
 * 获取热门话题
 * @param cookie
 * @param realUserId 用户信息realUserId
 * @param wemediaId 用户信息wemediaId
 */
export const getHotTopicAsync = async (
  cookie: string,
  realUserId: string,
  wemediaId: string,
): Promise<WangyihaoHotTopicResponse> => {
  const result = await $http.get<unknown, AxiosResponse<WangyihaoHotTopicResponse>>(
    'https://mp.163.com/wemedia/subject/getTopSubjects.do',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.163.com/subscribe_v3/index.html',
        Origin: 'https://mp.163.com',
      },
      params: {
        _: GetTimeStamp(13),
        realUserId: realUserId,
        wemediaId: wemediaId,
      },
    },
  );

  // 请求失败
  if (result.data.code !== 1) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface WangyiVideoTopicInfo {
  /**
   * 话题id
   */
  subjectId: string;
  /**
   * 话题名称，前后带#
   */
  title: string;
  keyword: string;
  /**
   * 话题描述
   */
  introduction: string;
  bizzType: number;
  location: number;
  /**
   * 状态，咱不知道用处
   */
  status: number;
  showStatus: number;
  pickStatus: number;
  pendantId: string;
  /**
   * 话题详情地址
   */
  url: string;
  /**
   * 话题封面
   */
  headPicture: string;
  headPictureType: string;
  /**
   * 关联的作品id
   */
  relatedDocId: string;
  hostPostId: string;
  /**
   * 热度
   */
  hotValue: number;
  interest: string;
  hotRankWord: string;
  wordGroup: string;
  motifId: string;
  recommendStatus: number;
  recommendLocation: number;
  operator: string;
  /**
   * 话题创建时间
   */
  createTime: string;
  /**
   * 话题修改时间
   */
  modifyTime: string;
  /**
   *
   */
  postid: string;
}

export interface WangyihaoHotTopicResponse {
  /**
   * 状态码
   * 1 正常
   */
  code: number;
  /**
   * 提示消息
   */
  msg: string;
  data: {
    /**
     * 总量
     */
    total: number;
    /**
     * 话题列表
     */
    list: Array<WangyiVideoTopicInfo>;
  };
}

/**
 * 搜索话题
 * @param cookie
 * @param realUserId 用户信息realUserId
 * @param wemediaId 用户信息wemediaId
 * @param keyword 搜索关键字
 * @param pageNo 页码
 * @param size 每页数量
 */
export const getSearchTopicAsync = async (
  cookie: string,
  realUserId: string,
  wemediaId: string,
  keyword: string,
  pageNo: number,
  size: number,
): Promise<WangyihaoSearchTopicResponse> => {
  const url = 'https://mp.163.com/wemedia/subject/searchSubjects.do';

  const postData = {
    pageNo: pageNo,
    size: size,
    titleLike: keyword,
  };

  const headers = {
    cookie: cookie,
    referer: 'https://mp.163.com/subscribe_v3/index.html',
    Origin: 'https://mp.163.com',
  };

  const result = await $http.post<never, AxiosResponse<WangyihaoSearchTopicResponse>>(url, postData, {
    headers: headers,
    params: {
      _: GetTimeStamp(13),
      realUserId: realUserId,
      wemediaId: wemediaId,
    },
  });

  if (result.data.code !== 1) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface WangyihaoSearchTopicResponse {
  /**
   * 状态码
   * 1 正常
   */
  code: number;
  /**
   * 提示消息
   */
  msg: string;
  data: {
    total: number;
    list: Array<WangyiVideoTopicInfo>;
  };
}
