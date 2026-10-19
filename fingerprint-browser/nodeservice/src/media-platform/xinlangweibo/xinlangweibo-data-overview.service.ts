import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { GetTimeStamp } from '../../utils';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 获取视频播放趋势
 * @param cookie
 * @param startTime 开始日期
 * @param endTime 结束日期
 * @param proxyAgent
 */
export const getVideoPlayTrendAsync = async (
  cookie: string,
  startTime: string,
  endTime: string,
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<XinlangweiboVideoPlayTrendResponse> => {
  const result = await $http.get<unknown, AxiosResponse<XinlangweiboVideoPlayTrendResponse>>(
    'https://dss.sc.weibo.com/pc/aj/chart/video/videoPlayTrend',
    {
      headers: {
        cookie: cookie,
        referer: 'https://dss.sc.weibo.com/pc/index',
        'x-requested-with': 'XMLHttpRequest',
      },
      params: {
        starttime: startTime,
        endtime: endTime,
        _: GetTimeStamp(13),
      },
      httpsAgent: proxyAgent,
      httpAgent: proxyAgent,
    },
  );

  // 请求失败
  if (result.data?.code !== 100000) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface XinlangweiboVideoPlayTrendResponse {
  code: number;
  msg: string;
  data: {
    chart: {
      videoPlayTrend: {
        starttime: string;
        videoCountTrend: Array<number>;
        videoCountTotal: number;
        videoPlayTrend: Array<number>;
        videoPlayTotal: number;
      };
    };
    param: {
      followers_count: number;
      starttime: string;
      endtime: string;
    };
  };
}

/**
 * 获取视频互动趋势
 * @param cookie
 * @param startTime 开始日期
 * @param endTime 结束日期
 * @param proxyAgent
 */
export const getVideoInteractTrendAsync = async (
  cookie: string,
  startTime: string,
  endTime: string,
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<XinlangweiboVideoInteractTrendResponse> => {
  const result = await $http.get<unknown, AxiosResponse<XinlangweiboVideoInteractTrendResponse>>(
    'https://dss.sc.weibo.com/pc/aj/chart/video/videoInteract',
    {
      headers: {
        cookie: cookie,
        referer: 'https://dss.sc.weibo.com/pc/index',
        'x-requested-with': 'XMLHttpRequest',
      },
      params: {
        starttime: startTime,
        endtime: endTime,
        _: GetTimeStamp(13),
      },
      httpsAgent: proxyAgent,
      httpAgent: proxyAgent,
    },
  );

  // 请求失败
  if (result.data?.code !== 100000) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface XinlangweiboVideoInteractTrendResponse {
  code: number;
  msg: string;
  data: {
    chart: {
      videoInteract: {
        starttime: string;

        /**
         * 转发
         */
        repostTrend: Array<number>;
        repostTotal: number;

        /**
         * 评论
         */
        commentTrend: Array<number>;
        commentTotal: number;

        /**
         * 点赞
         */
        likeTrend: Array<number>;
        likeTotal: number;

        /**
         * 互动
         */
        interTrend: Array<number>;
        interTotal: number;
      };
    };
    param: {
      followers_count: number;
      starttime: string;
      endtime: string;
    };
  };
}

/**
 * 获取单个视频播放趋势
 * @param cookie
 * @param mid 视频mid
 * @param oid 视频信息oid
 */
export const getSingleVideoPlayTrendAsync = async (
  cookie: string,
  mid: string,
  oid: string,
): Promise<XinlangweiboSingleVideoPlayTrendResponse> => {
  const result = await $http.get<unknown, AxiosResponse<XinlangweiboSingleVideoPlayTrendResponse>>(
    'https://dss.sc.weibo.com/pc/aj/chart/video/singleVideoPlayTrend',
    {
      headers: {
        cookie: cookie,
        referer: 'https://dss.sc.weibo.com/pc/index',
        'x-requested-with': 'XMLHttpRequest',
      },
      params: {
        mid: mid,
        oid: oid,
        _: GetTimeStamp(13),
      },
    },
  );

  // 请求失败
  if (result.data?.code !== 100000) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface XinlangweiboSingleVideoPlayTrendResponse {
  code: number;
  msg: string;
  data: {
    chart: {
      singleVideoPlayTrend: {
        starttime: string;
        playTrend: Array<number>;
        playPeopleTrend: Array<number>;
        playTotal: number;
        playPeopleTotal: number;
      };
    };
    param: {
      followers_count: number;
      mid: string;
      oid: string;
      starttime: string;
      endtime: string;
    };
  };
}

/**
 * 获取单个视频互动趋势
 * @param cookie
 * @param mid 视频mid
 * @param oid 视频信息oid
 */
export const getSingleVideoInteractAsync = async (
  cookie: string,
  mid: string,
  oid: string,
): Promise<XinlangweiboSingleVideoInteractResponse> => {
  const result = await $http.get<unknown, AxiosResponse<XinlangweiboSingleVideoInteractResponse>>(
    'https://dss.sc.weibo.com/pc/aj/chart/video/singleVideoInter',
    {
      headers: {
        cookie: cookie,
        referer: 'https://dss.sc.weibo.com/pc/index',
        'x-requested-with': 'XMLHttpRequest',
      },
      params: {
        mid: mid,
        oid: oid,
        _: GetTimeStamp(13),
      },
    },
  );

  // 请求失败
  if (result.data?.code !== 100000) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface XinlangweiboSingleVideoInteractResponse {
  code: number;
  msg: string;
  data: {
    chart: {
      singleVideoInter: {
        starttime: string;
        repostTrend: Array<number>;
        repostTotal: number;
        commentTrend: Array<number>;
        commentTotal: number;
        likeTrend: Array<number>;
        likeTotal: number;
      };
    };
    param: {
      followers_count: number;
      mid: string;
      oid: string;
      starttime: string;
      endtime: string;
    };
  };
}

/**
 * 获取微博文章阅读趋势
 * @param cookie
 * @param startTime 开始日期
 * @param endTime 结束日期
 */
export const getArticleReadTrendAsync = async (
  cookie: string,
  startTime: string,
  endTime: string,
): Promise<XinlangweiboArticleReadTrendResponse> => {
  const result = await $http.get<unknown, AxiosResponse<XinlangweiboArticleReadTrendResponse>>(
    'https://dss.sc.weibo.com/pc/aj/chart/article/articleReadTrend',
    {
      headers: {
        cookie: cookie,
        referer: 'https://dss.sc.weibo.com/pc/index',
        'x-requested-with': 'XMLHttpRequest',
      },
      params: {
        starttime: startTime,
        endtime: endTime,
        _: GetTimeStamp(13),
      },
    },
  );

  // 请求失败
  if (result.data?.code !== 100000) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface XinlangweiboArticleReadTrendResponse {
  code: number;
  msg: string;
  data: {
    chart: {
      articleReadTrend: {
        starttime: string;
        articleReadTrend: Array<number>;
        articleReadTotal: number;
        articleSendTrend: Array<number>;
        articleSendTotal: number;
      };
    };
    param: {
      followers_count: number;
      starttime: string;
      endtime: string;
    };
  };
}

/**
 * 获取微博文章互动趋势
 * @param cookie
 * @param startTime 开始日期
 * @param endTime 结束日期
 */
export const getArticleInteractTrendAsync = async (
  cookie: string,
  startTime: string,
  endTime: string,
): Promise<XinlangweiboArticleInteractTrendResponse> => {
  const result = await $http.get<unknown, AxiosResponse<XinlangweiboArticleInteractTrendResponse>>(
    'https://dss.sc.weibo.com/pc/aj/chart/article/articleInteractTrend',
    {
      headers: {
        cookie: cookie,
        referer: 'https://dss.sc.weibo.com/pc/index',
        'x-requested-with': 'XMLHttpRequest',
      },
      params: {
        starttime: startTime,
        endtime: endTime,
        _: GetTimeStamp(13),
      },
    },
  );

  // 请求失败
  if (result.data?.code !== 100000) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface XinlangweiboArticleInteractTrendResponse {
  code: number;
  msg: string;
  data: {
    chart: {
      articleInteractTrend: {
        starttime: string;
        repostTrend: Array<number>;
        repostTotal: number;
        commentTrend: Array<number>;
        commentTotal: number;
        likeTrend: Array<number>;
        likeTotal: number;
        interTrend: Array<number>;
        interTotal: number;
      };
    };
    param: {
      followers_count: number;
      starttime: string;
      endtime: string;
    };
  };
}

/**
 * 获取单个文章阅读趋势
 * @param cookie
 * @param mid 图文mid
 * @param oid 图文oid
 */
export const getSingleArticleReadTrendAsync = async (
  cookie: string,
  mid: string,
  oid: string,
): Promise<XinlangweiboSingleArticleReadTrendResponse> => {
  const result = await $http.get<unknown, AxiosResponse<XinlangweiboSingleArticleReadTrendResponse>>(
    'https://dss.sc.weibo.com/pc/aj/chart/article/singleArticleReadTrend',
    {
      headers: {
        cookie: cookie,
        referer: 'https://dss.sc.weibo.com/pc/index',
        'x-requested-with': 'XMLHttpRequest',
      },
      params: {
        mid: mid,
        oid: oid,
        _: GetTimeStamp(13),
      },
    },
  );

  // 请求失败
  if (result.data?.code !== 100000) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface XinlangweiboSingleArticleReadTrendResponse {
  code: number;
  msg: string;
  data: {
    chart: {
      singleArticleReadTrend: {
        starttime: string;
        readTrend: Array<number>;
        readTotal: number;
        readPeopleTrend: Array<number>;
        readPeopleTotal: number;
        averageRead: number;
      };
    };
    param: {
      followers_count: number;
      mid: string;
      oid: string;
      starttime: string;
      endtime: string;
    };
  };
}

/**
 * 获取单个文章互动趋势
 * @param cookie
 * @param mid 图文mid
 */
export const getSingleArticleInteractAsync = async (
  cookie: string,
  mid: string,
): Promise<XinlangweiboSingleArticleInteractResponse> => {
  const result = await $http.get<unknown, AxiosResponse<XinlangweiboSingleArticleInteractResponse>>(
    'https://dss.sc.weibo.com/pc/aj/chart/article/singleArticleInter',
    {
      headers: {
        cookie: cookie,
        referer: 'https://dss.sc.weibo.com/pc/index',
        'x-requested-with': 'XMLHttpRequest',
      },
      params: {
        mid: mid,
        _: GetTimeStamp(13),
      },
    },
  );

  // 请求失败
  if (result.data?.code !== 100000) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface XinlangweiboSingleArticleInteractResponse {
  code: number;
  msg: string;
  data: {
    chart: {
      singleArticleInter: {
        starttime: string;
        repostTrend: Array<number>;
        repostTotal: number;
        commentTrend: Array<number>;
        commentTotal: number;
        likeTrend: Array<number>;
        likeTotal: number;
      };
    };
    param: {
      followers_count: number;
      mid: string;
      starttime: string;
      endtime: string;
    };
  };
}

/**
 * 获取微博短内容阅读趋势
 * @param cookie
 * @param startTime 开始日期
 * @param endTime 结束日期
 * @param proxyAgent
 */
export const getWeiboReadTrendAsync = async (
  cookie: string,
  startTime: string,
  endTime: string,
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<XinlangweiboWeiboReadTrendResponse> => {
  const result = await $http.get<unknown, AxiosResponse<XinlangweiboWeiboReadTrendResponse>>(
    'https://dss.sc.weibo.com/pc/aj/chart/content/weiboReadTrend',
    {
      headers: {
        cookie: cookie,
        referer: 'https://dss.sc.weibo.com/pc/index',
        'x-requested-with': 'XMLHttpRequest',
      },
      params: {
        starttime: startTime,
        endtime: endTime,
        _: GetTimeStamp(13),
      },
      httpsAgent: proxyAgent,
      httpAgent: proxyAgent,
    },
  );

  // 请求失败
  if (result.data?.code !== 100000) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface XinlangweiboWeiboReadTrendResponse {
  code: number;
  msg: string;
  data: {
    chart: {
      weiboReadTrend: {
        starttime: string;
        weibos: Array<number>;
        reads: Array<number>;
        readTotal: number;
        weiboTotal: number;
      };
    };
    param: {
      followers_count: number;
      starttime: string;
      endtime: string;
    };
  };
}

/**
 * 获取微博文章互动趋势
 * @param cookie
 * @param startTime 开始日期
 * @param endTime 结束日期
 * @param proxyAgent
 */
export const getWeiboInteractTrendAsync = async (
  cookie: string,
  startTime: string,
  endTime: string,
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<XinlangweiboWeiboInteractTrendResponse> => {
  const result = await $http.get<unknown, AxiosResponse<XinlangweiboWeiboInteractTrendResponse>>(
    'https://dss.sc.weibo.com/pc/aj/chart/content/weiboInteract',
    {
      headers: {
        cookie: cookie,
        referer: 'https://dss.sc.weibo.com/pc/index',
        'x-requested-with': 'XMLHttpRequest',
      },
      params: {
        starttime: startTime,
        endtime: endTime,
        _: GetTimeStamp(13),
      },
      httpAgent: proxyAgent,
      httpsAgent: proxyAgent,
    },
  );

  // 请求失败
  if (result.data?.code !== 100000) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface XinlangweiboWeiboInteractTrendResponse {
  code: number;
  msg: string;
  data: {
    chart: {
      weiboInteract: {
        interTotal: number;
        repostTotal: number;
        commentTotal: number;
        likeTotal: number;
        repostTrend: Array<number>;
        commentTrend: Array<number>;
        likeTrend: Array<number>;
        weiboInteractTrend: Array<number>;
        starttime: string;
      };
    };
    param: {
      followers_count: number;
      starttime: string;
      endtime: string;
    };
  };
}

/**
 * 获取单个微博阅读趋势
 * @param cookie
 * @param mid 微博短内容id
 */
export const getSingleWeiboReadTrendAsync = async (
  cookie: string,
  mid: string,
): Promise<XinlangweiboSingleWeiboReadTrendResponse> => {
  const result = await $http.get<unknown, AxiosResponse<XinlangweiboSingleWeiboReadTrendResponse>>(
    'https://dss.sc.weibo.com/pc/aj/chart/content/singleWeiboReadTrend',
    {
      headers: {
        cookie: cookie,
        referer: 'https://dss.sc.weibo.com/pc/index',
        'x-requested-with': 'XMLHttpRequest',
      },
      params: {
        mid: mid,
        _: GetTimeStamp(13),
      },
    },
  );

  // 请求失败
  if (result.data?.code !== 100000) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface XinlangweiboSingleWeiboReadTrendResponse {
  code: number;
  msg: string;
  data: {
    chart: {
      singleWeiboReadTrend: {
        starttime: string;
        readTrend: Array<number>;
        readPeopleTrend: Array<number>;
        readTotal: number;
        readPeopleTotal: number;
      };
    };
    param: {
      followers_count: number;
      mid: string;
      starttime: string;
      endtime: string;
    };
  };
}

/**
 * 获取单个微博互动趋势
 * @param cookie
 * @param mid
 */
export const getSingleWeiboInteractAsync = async (
  cookie: string,
  mid: string,
): Promise<XinlangweiboSingleWeiboInteractResponse> => {
  const result = await $http.get<unknown, AxiosResponse<XinlangweiboSingleWeiboInteractResponse>>(
    'https://dss.sc.weibo.com/pc/aj/chart/content/singleWeiboInteract',
    {
      headers: {
        cookie: cookie,
        referer: 'https://dss.sc.weibo.com/pc/index',
        'x-requested-with': 'XMLHttpRequest',
      },
      params: {
        mid: mid,
        _: GetTimeStamp(13),
      },
    },
  );

  // 请求失败
  if (result.data?.code !== 100000) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface XinlangweiboSingleWeiboInteractResponse {
  code: number;
  msg: string;
  data: {
    chart: {
      singleWeiboInteract: {
        starttime: string;
        repostTrend: Array<number>;
        repostTotal: number;
        commentTrend: Array<number>;
        commentTotal: number;
        likeTrend: Array<number>;
        likeTotal: number;
      };
    };
    param: {
      followers_count: number;
      mid: string;
      starttime: string;
      endtime: string;
    };
  };
}

/**
 * 获取微博粉丝趋势
 * @param cookie
 * @param startTime 开始日期
 * @param endTime 结束日期
 * @param proxyAgent
 */
export const getWeiboFansTrendAsync = async (
  cookie: string,
  startTime: string,
  endTime: string,
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<XinlangweiboWeiboFansTrendResponse> => {
  const url = 'https://dss.sc.weibo.com/pc/aj/chart/fans/fansTrend';

  const result = await $http.get(url, {
    headers: {
      cookie: cookie,
      referer: 'https://dss.sc.weibo.com/pc/index',
      'x-requested-with': 'XMLHttpRequest',
    },
    params: {
      starttime: startTime,
      endtime: endTime,
      _: GetTimeStamp(13),
    },
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};

export interface XinlangweiboWeiboFansTrendResponse {
  code: number;
  msg: string;
  data: {
    chart: {
      fansTrend: {
        tIncrTrend: Array<number>;
        starttime: string;
      };
    };
    param: {
      followers_count: number;
      starttime: string;
      endtime: string;
    };
  };
}
