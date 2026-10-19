import { $http } from '@/http';

export const getUserInfoResponse = async (cookie: string): Promise<XimalayaUserinfoResponse> => {
  const url = 'https://studio.ximalaya.com/api/home/userInfo';
  const result = await $http.get(url, {
    headers: {
      cookie: cookie,
      referer: 'https://studio.ximalaya.com/upload',
    },
  });

  return result.data;
};

export interface XimalayaUserinfoResponse {
  //'0';
  code: string;
  msg: string;
  data: {
    /**
     * 用户id
     */
    uid: number;
    /**
     * 用户昵称
     */
    nickName: string;
    /**
     * 头像url
     */
    logoPic: string;
    anchorGrade: -1;
    gradeScore: null;
    nextGradeGapScore: null;
    fansCount: null;
    subCount: null;
    mvpGrade: 1;
    mvpWhiteList: true;
    anchorIsPodcast: true;
    verifyStatus: 1;
    vlogoType: -1;
  };
}

export const getCategoryResponse = async (cookie: string): Promise<XimalayaCategoryResponse> => {
  const url = 'https://www.ximalaya.com/reform-upload/common/categoryList';
  const result = await $http.get(url, {
    headers: {
      cookie: cookie,
      referer: 'https://studio.ximalaya.com/upload',
    },
  });

  return result.data;
};

export interface XimalayaCategoryResponse {
  ret: number;
  msg: string;
  data: Array<{ id: number; name: string; title: string }>;
}

export const getAlbumResponse = async (
  cookie: string,
  page: number = 1,
  pageSize: number = 10,
  keyword: string = '',
): Promise<XimalayaAlbumResponse> => {
  const result = await $http.get('https://www.ximalaya.com/reform-upload/album/choose', {
    params: { page, pageSize, kw: keyword },
    headers: {
      cookie,
      referer: 'https://www.ximalaya.com/reform-upload/page/webCenter/upload',
    },
  });

  return result.data;
};

/** 搜索指定分类下的话题。categoryId 与 keyword 均为喜马拉雅接口必填参数。 */
export const getTopicPageResponse = async (
  cookie: string,
  categoryId: string,
  keyword: string,
  pageNo: number = 1,
  pageSize: number = 10,
): Promise<XimalayaTopicPageResponse> => {
  const result = await $http.get('https://www.ximalaya.com/reform-upload/upload/getTopicPage', {
    params: { categoryId, pageNo, pageSize, keyword },
    headers: {
      cookie,
      referer: 'https://www.ximalaya.com/reform-upload/page/webCenter/upload',
    },
  });
  return result.data;
};

export interface XimalayaTopicPageResponse {
  ret: number;
  msg: string;
  data?: {
    currentPage: number;
    pageSize: number;
    totalSize: number;
    infos: Array<{
      id: number | string;
      /** 最终发布 soundTags/topicTags 使用的键。 */
      metadataId?: number | string;
      topicId?: number | string;
      name: string;
      topicDesc?: string;
      hotScore?: number;
      [key: string]: unknown;
    }>;
  };
}

export interface XimalayaAlbumResponse {
  ret: number;
  msg: string;
  data: {
    currentPage: number;
    pageSize: number;
    totalSize: number;
    infos: Array<{
      /**
       * 专辑id
       */
      albumId: number;
      /**
       * 专辑名称
       */
      title: string;
      /**
       * 专辑关键词
       */
      customTitle: string;
      shortIntro: '';
      musicCategory: '';
      userSource: 1;
      coverPath: string;
      /**
       * 专辑封面
       */
      fullCoverPath: string;
      /**
       * 专辑分类，和发布时作品分类一样的数据
       */
      categoryId: number;
      priceTypeId: 0;
      price: '';
      discountedPrice: '';
      uploadSource: 0;
      lastTrackTitle: null;
      userInfo: null;
      uriInfo: null;
      statInfo: { playCount: 0; trackCount: 0 };
      albumStatusInfo: {
        isPaid: false;
        isFinished: false;
        isPublic: true;
        isSample: false;
        isDefault: false;
        isVipFirst: false;
        isDesc: false;
        canShareAndStealListen: false;
        canInviteListen: false;
        albumStatus: 1;
        albumOfflineType: 0;
        isSvip: false;
        aplus: false;
      };
      type: 0;
      additionalInfo: { freeTracks: 0 };
      svipAlbumInfo: null;
    }>;
  };
}
