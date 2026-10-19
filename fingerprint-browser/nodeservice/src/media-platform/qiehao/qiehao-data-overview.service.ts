import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';

/**
 * 企鹅号图文单篇列表
 * @param cookie
 * @param page
 * @param pageSize
 */
export const getDataOverviewArticleListAsync = async (
  cookie: string,
  page: number,
  pageSize: number,
): Promise<QiehaoDataOverviewArticleListResponse> => {
  const result = await $http.get<unknown, AxiosResponse<QiehaoDataOverviewArticleListResponse>>(
    'https://om.qq.com/mstatistic/ommixin/GetArticleList',
    {
      headers: {
        cookie: cookie,
        referer: 'https://om.qq.com/main/statistic/articleList',
        host: 'om.qq.com',
        'x-requested-with': 'XMLHttpRequest',
      },
      params: {
        page: page,
        limit: pageSize,
        keyword: '',
        isPartDst: 0,
        relogin: 1,
      },
    },
  );

  // 请求失败
  if (result.data.response.code !== 0) {
    throw new BadRequestException(result.data?.response.msg, result.data?.response.code, result.data);
  }

  return result.data;
};

/**
 * 企鹅号视频单篇列表
 * @param cookie
 * @param page
 * @param pageSize
 */
export const getDataOverviewVideoListAsync = async (
  cookie: string,
  page: number,
  pageSize: number,
): Promise<QiehaoDataOverviewVideoListResponse> => {
  const result = await $http.get<unknown, AxiosResponse<QiehaoDataOverviewVideoListResponse>>(
    'https://om.qq.com/mstatistic/ommixin/GetVideoList',
    {
      headers: {
        cookie: cookie,
        referer: 'https://om.qq.com/main/statistic/videoList',
        host: 'om.qq.com',
        'x-requested-with': 'XMLHttpRequest',
      },
      params: {
        page: page,
        limit: pageSize,
        keyword: '',
        isPartDst: 0,
        relogin: 1,
      },
    },
  );

  // 请求失败
  if (result.data.response.code !== 0) {
    throw new BadRequestException(result.data?.response.msg, result.data?.response.code, result.data);
  }

  return result.data;
};

/**
 * 企鹅号数据总览粉丝分析
 * @param cookie
 * @param start_date 开始日期 （××××-××-××）
 * @param end_date 结束日期（××××-××-××）
 */
export const getDataOverviewFansAsync = async (
  cookie: string,
  start_date: string,
  end_date: string,
): Promise<QiehaoDataOverviewFansResponse> => {
  const result = await $http.get<unknown, AxiosResponse<QiehaoDataOverviewFansResponse>>(
    'https://om.qq.com/mstatistic/ommixin/getFansDetailStatistic',
    {
      headers: {
        cookie: cookie,
        referer: 'https://om.qq.com/main/statistic/fans',
        host: 'om.qq.com',
        'x-requested-with': 'XMLHttpRequest',
      },
      params: {
        startDate: start_date,
        endDate: end_date,
        app: '',
        relogin: 1,
      },
    },
  );

  // 请求失败
  if (result.data.response.code !== 0) {
    throw new BadRequestException(result.data?.response.msg, result.data?.response.code, result.data);
  }

  return result.data;
};

/**
 * 企鹅号数据总览图文分析
 * @param cookie
 * @param start_date 开始日期 （××××-××-××）
 * @param end_date 结束日期（××××-××-××）
 */
export const getDataOverviewArticleAsync = async (
  cookie: string,
  start_date: string,
  end_date: string,
): Promise<QiehaoDataOverviewArticleResponse> => {
  const url: string = 'https://om.qq.com/mstatistic/ommixin/GetArticleReadpvStatistic';

  const headers = {
    cookie: cookie,
    referer: 'https://om.qq.com/main/statistic/article',
    Origin: 'https://om.qq.com',
    'Content-Type': 'application/json',
  };

  const postData = {
    start_date: start_date,
    end_date: end_date,
    relogin: 1,
  };

  const result = await $http.post<never, AxiosResponse<QiehaoDataOverviewArticleResponse>>(url, postData, {
    headers: headers,
  });

  return result.data;
};

/**
 * 企鹅号数据总览视频分析
 * @param cookie
 * @param start_date 开始日期（××××-××-××）
 * @param end_date 结束日期（××××-××-××）
 */
export const getDataOverviewVideoAsync = async (
  cookie: string,
  start_date: string,
  end_date: string,
): Promise<QiehaoDataOverviewVideoResponse> => {
  const url: string = 'https://om.qq.com/mstatistic/ommixin/GetVideoPlayvvStatistic';

  const headers = {
    cookie: cookie,
    referer: 'https://om.qq.com/main/statistic/video',
    Origin: 'https://om.qq.com',
    'Content-Type': 'application/json',
  };

  const postData = {
    start_date: start_date,
    end_date: end_date,
    relogin: 1,
  };

  const result = await $http.post<never, AxiosResponse<QiehaoDataOverviewVideoResponse>>(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface QiehaoDataOverviewArticleMediaContent {
  Furl: string;
  Falt_time: string;

  /**
   * 评论量
   */
  commentpv: string;
  Fuser_id: string;

  /**
   * 标题
   */
  Ftitle: string;
  Fcan_redirect: string;

  /**
   * 阅读完成率
   */
  aver_complete_rate: string;
  Ftype: string;
  Fsource: string;
  Fhighlight: string;

  /**
   * 发布时间
   */
  Fpub_time: string;
  Ftitle2: string;
  Fpub_flag: string;
  hasTitle2: string;

  /**
   * 阅读量
   */
  readpv: string;
  Fshort_content: string;

  /**
   * 作品id
   */
  Farticle_id: string;

  /**
   * 平均阅读时长（分钟）
   */
  aver_time_long: string;

  /**
   * 封面地址
   */
  Fimgurl: string;
}

export interface QiehaoDataOverviewArticleListResponse {
  response: {
    code: number;
    msg: string;
  };
  data: {
    list: Array<QiehaoDataOverviewArticleMediaContent>;
    pageInfo: {
      page: number;
      limit: number;
      total: number;
    };
  };
}

export interface QiehaoDataOverviewVideoMediaContent {
  Fcan_redirect: string;
  aver_time_long: string;
  Fuser_id: string;

  /**
   * 封面地址
   */
  Fimgurl: string;

  /**
   * 作品id
   */
  Farticle_id: string;
  aver_complete_rate: string;

  /**
   * 发布时间
   */
  Fpub_time: string;
  Fsource: string;
  Furl: string;
  Falt_time: string;
  Fhighlight: string;

  /**
   * 标题
   */
  Ftitle: string;
  Ftype: string;
  Fpub_flag: string;

  /**
   * 播放量
   */
  playvv: string;

  /**
   * 评论量
   */
  commentvv: string;
}

export interface QiehaoDataOverviewVideoListResponse {
  response: {
    code: number;
    msg: string;
  };
  data: {
    list: Array<QiehaoDataOverviewVideoMediaContent>;
    pageInfo: {
      page: number;
      limit: number;
      total: number;
    };
  };
}

export interface QiehaoDataOverviewFansResponse {
  response: {
    code: number;
    msg: string;
  };
  data: {
    app_statistic: string;
    statistic: string;
    tableStatistic: string;
  };
}

export interface QiehaoDataOverviewArticleResponse {
  response: {
    code: number;
    msg: string;
  };
  data: {
    app_statistic: string;
    statistic: string;
    tableStatistic: string;
  };
}

export interface QiehaoDataOverviewVideoResponse {
  response: {
    code: number;
    msg: string;
  };
  data: {
    app_statistic: string;
    statistic: string;
    tableStatistic: string;
  };
}

/**
 * 企鹅号单篇统计数据
 * @param cookie
 * @param articleId
 */
export const getSingleDataOverviewStatisticAsync = async (
  cookie: string,
  articleId: string,
): Promise<QiehaoSingleDataOverviewStatisticResponse> => {
  const result = await $http.get<unknown, AxiosResponse<QiehaoSingleDataOverviewStatisticResponse>>(
    'https://om.qq.com/mstatistic/ommixin/GetVideoDetailTopInfo',
    {
      headers: {
        cookie: cookie,
        referer: 'https://om.qq.com/main/statistic/videoDetail?articleId=' + articleId,
        host: 'om.qq.com',
        'x-requested-with': 'XMLHttpRequest',
      },
      params: {
        articleId: articleId,
        app: '',
        relogin: 1,
      },
    },
  );

  // 请求失败
  if (result.data.response.code !== 0) {
    throw new BadRequestException(result.data?.response.msg, result.data?.response.code, result.data);
  }

  return result.data;
};

export interface QiehaoSingleDataOverviewStatisticResponse {
  response: {
    code: number;
    msg: string;
  };
  data: {
    statistic: {
      /**
       * 总播放量
       */
      playvv: string;

      /**
       * 播放完成率
       */
      aver_complete_rate: string;

      /**
       * 作品地址
       */
      Furl: string;
      Fuser_id: string;

      /**
       * 封面地址
       */
      Fimgurl: string;
      Fpub_flag: string;
      Fcan_redirect: string;
      Ftype: string;

      /**
       * 作品id
       */
      Farticle_id: string;
      Falt_time: string;

      /**
       * 平均播放时长（秒）
       */
      aver_time_long: string;

      /**
       * 总评论数
       */
      commentvv: string;

      /**
       * 总点赞数
       */
      likevv: string;

      /**
       * 总分享数
       */
      relayvv: string;
      Fhighlight: string;

      /**
       * 标题
       */
      Ftitle: string;

      /**
       * 发布时间
       */
      Fpub_time: string;
      Fsource: string;
    };
  };
}

/**
 * 企鹅号单篇作品报表数据
 * @param cookie
 * @param articleId 作品id
 * @param startDate 开始日期
 * @param endDate 结束如期
 */
export const getSingleDataOverviewAsync = async (
  cookie: string,
  articleId: string,
  startDate: string,
  endDate: string,
): Promise<QiehaoSingleDataOverviewResponse> => {
  const result = await $http.get<unknown, AxiosResponse<QiehaoSingleDataOverviewResponse>>(
    'https://om.qq.com/mstatistic/ommixin/GetVideoDetailStatistic',
    {
      headers: {
        cookie: cookie,
        referer: 'https://om.qq.com/main/statistic/videoDetail?articleId=' + articleId,
        host: 'om.qq.com',
        'x-requested-with': 'XMLHttpRequest',
      },
      params: {
        articleId: articleId,
        app: '',
        startDate: startDate,
        endDate: endDate,
        relogin: 1,
        type: 'flow',
      },
    },
  );

  // 请求失败
  if (result.data.response.code !== 0) {
    throw new BadRequestException(result.data?.response.msg, result.data?.response.code, result.data);
  }

  return result.data;
};

export interface QiehaoSingleDataOverviewResponse {
  response: {
    code: number;
    msg: string;
  };
  data: {
    tableStatistic: Array<{
      /**
       * 播放完成率
       */
      aver_complete_rate: string;

      /**
       * 平均播放时长（秒）
       */
      aver_time_long: string;

      /**
       * 评论数
       */
      commentvv: string;

      /**
       * 点赞数
       */
      likevv: string;

      /**
       * 分享数
       */
      relayvv: string;

      /**
       * 日期
       */
      imp_date: string;

      /**
       * 播放量
       */
      playvv: string;
    }>;
  };
}

/**
 * 企鹅号视频总览数据
 * @param cookie
 * @param dateStr
 * @param type
 */
export const getTotalStatic = async (
  cookie: string,
  dateStr: string,
  type: 'Article' | 'Video',
): Promise<QiehaoVideoTotalStatisticResponse> => {
  const url = `https://om.qq.com/mstatistic/ommixin/Get${type}TotalStatistic?app=&base_date=${dateStr}&relogin=1`;
  const result = await $http.get(url, {
    headers: {
      cookie: cookie,
      referer: 'https://om.qq.com/main/statistic/video',
      'x-requested-with': 'XMLHttpRequest',
    },
  });

  return result.data;
};

export interface QiehaoVideoTotalStatisticResponse {
  data: {
    data: string;
  };
  response: {
    code: number;
    msg: string;
  };
}
export interface VideoTotalStatisticDetail {
  aver_complete_rate_day_ratio: string;
  aver_complete_rate_day_value: string;
  aver_complete_rate_month_ratio: string;
  aver_complete_rate_month_value: string;
  aver_complete_rate_week_ratio: string;
  aver_complete_rate_week_value: string;
  aver_complete_rate_yesterday_value: string;
  aver_time_long_day_ratio: string;
  aver_time_long_day_value: string;
  aver_time_long_month_ratio: string;
  aver_time_long_month_value: string;
  aver_time_long_week_ratio: string;
  aver_time_long_week_value: string;
  aver_time_long_yesterday_value: string;
  comment_day_ratio: string;
  comment_day_value: string;
  comment_month_ratio: string;
  comment_month_value: string;
  comment_week_ratio: string;
  comment_week_value: string;
  comment_yesterday_value: string;
  costs_day_ratio: string;
  costs_day_value: string;
  costs_month_ratio: string;
  costs_month_value: string;
  costs_week_ratio: string;
  costs_week_value: string;
  costs_yesterday_value: string;
  flow_day_ratio: string;
  flow_day_value: string;
  flow_month_ratio: string;
  flow_month_value: string;
  flow_week_ratio: string;
  flow_week_value: string;
  flow_yesterday_value: string;
  like_day_ratio: string;
  like_day_value: string;
  like_month_ratio: string;
  like_month_value: string;
  like_week_ratio: string;
  like_week_value: string;
  like_yesterday_value: string;
  relay_day_ratio: string;
  relay_day_value: string;
  relay_month_ratio: string;
  relay_month_value: string;
  relay_week_ratio: string;
  relay_week_value: string;
  relay_yesterday_value: string;
}
