import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';

/**
 * 西瓜视频内容管理-视频列表
 * @param cookie
 * @param status 数据类型 （1：全部，2：已发布，3：未通过，4：审核中，5：仅我可见）
 * @param keyword 搜索关键字
 * @param offset 分页起始数字 （首页为0，后面的数字等于页码-1乘以20）
 * @param size 每页数量 （20）
 */
export const getContentListAsync = async (
  cookie: string,
  status: 1 | 2 | 3 | 4 | 5,
  keyword: string,
  offset: number,
  size: number,
): Promise<XiguashipinContentListResponse> => {
  const result = await $http.get<unknown, AxiosResponse<XiguashipinContentListResponse>>(
    'https://studio.ixigua.com/api/content/list',
    {
      headers: {
        cookie: cookie,
        referer: 'https://studio.ixigua.com/content',
      },
      params: {
        params: JSON.stringify({ Status: status, Keyword: keyword, Offset: offset, Size: size }),
      },
    },
  );

  // 请求失败
  if (result.data.status !== 0) {
    throw new BadRequestException(result.data?.message, result.data?.status, result.data);
  }

  return result.data;
};

/**
 * 西瓜视频内容管理-小视频列表
 * @param cookie
 * @param cursor 分页起始位置（首页为0，下一页使用上一页返回对应EndCursor参数）
 * @param pageSize 每页数量（20）
 */
export const getShortContentListAsync = async (
  cookie: string,
  cursor: number,
  pageSize: number,
): Promise<XiguashipinShortContentListResponse> => {
  const result = await $http.get<unknown, AxiosResponse<XiguashipinShortContentListResponse>>(
    'https://studio.ixigua.com/api/content/short_list',
    {
      headers: {
        cookie: cookie,
        referer: 'https://studio.ixigua.com/content',
      },
      params: {
        params: JSON.stringify({ Type: 4, Status: 0, PageSize: pageSize, Cursor: cursor, NeedStat: true }),
      },
    },
  );

  // 请求失败
  if (result.data.status !== 0) {
    throw new BadRequestException(result.data?.message, result.data?.status, result.data);
  }

  return result.data;
};

export interface XiguashipinMediaContent {
  /**
   * 作品id
   */
  ItemId: string;

  /**
   * 是否原创
   */
  IsOrigin: boolean;

  /**
   * 发布时间
   */
  CreateTime: number;

  /**
   * 用户id
   */
  UserId: number;

  /**
   * 视频信息
   */
  VideoData: {
    /**
     * 视频时长
     */
    Duration: number;

    /**
     * 视频宽度
     */
    Width: number;

    /**
     * 视频高度
     */
    Height: number;

    /**
     * 标题
     */
    Title: string;

    /**
     * 封面url
     */
    CoverUrl: string;

    /**
     * 视频播放地址
     */
    PlayUrl: string;
  };

  /**
   * 内容统计数据
   */
  ArticleStatData: {
    /**
     * 展现量
     */
    RecommendCount: number;

    /**
     * 播放数
     */
    PlayCount: number;

    /**
     * 评论数
     */
    CommentCount: number;

    /**
     * 点赞数
     */
    DiggCount: number;

    /**
     * 弹幕数
     */
    DanmakuCount: number;
    RepinCount: number;

    /**
     * 收益数
     */
    Income: number;
    FansCount: number;
    ShareCount: number;
  };
  CommentLevel: number;
  CanNotEditReason: string;

  /**
   * 内容状态
   */
  ArticleStatus: number;
  ItemStatus: number;
  ArticleStatusText: string;

  /**
   * 分享链接
   */
  ShareUrl: string;
}

export interface XiguashipinContentListResponse {
  status: number;
  message: string;
  data: {
    NextOffset: number;
    Total: number;
    IncomeReadyTs: number;
    IndexTotal: number;
    ArticleList: Array<XiguashipinMediaContent>;
  };
}

export interface XiguashipinShortMediaContent {
  ArticleAttr: {
    /**
     * 作品id
     */
    Gid: string;

    /**
     * 作品类型
     */
    Type: number;

    /**
     * 作品类型中文
     */
    TypeDesc: string;

    /**
     * 标题
     */
    Title: string;

    /**
     * 作品状态
     */
    Status: number;

    /**
     * 作品状态中文
     */
    StatusDesc: string;

    /**
     * 封面信息
     */
    CoverImage: {
      ImageURL: string;
      Width: number;
      Height: number;
      ImageURI: string;
    };

    /**
     * 发布时间
     */
    ShowTime: number;

    /**
     * 作品id
     */
    ItemId: string;

    /**
     * 小视频时长
     */
    Duration: number;

    /**
     * 作品类型
     */
    ArticleType: string;
  };
  ArticleStat: {
    /**
     * 展现量
     */
    ImpressionCount: number;
    GoDetailCount: number;

    /**
     * 评论数
     */
    CommentCount: number;

    /**
     * 播放量
     */
    PlayCount: number;
    AnswerCount: number;

    /**
     * 点赞数
     */
    DiggCount: number;
    RepinCount: number;
  };
}

export interface XiguashipinShortContentListResponse {
  status: number;
  message: string;
  data: {
    TotalCount: number;
    StartCursor: number;
    EndCursor: number;
    HasMore: boolean;
    Contents: Array<XiguashipinShortMediaContent>;
  };
}
