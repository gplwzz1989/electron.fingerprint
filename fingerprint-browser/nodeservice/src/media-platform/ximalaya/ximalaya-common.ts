import { ListInfoResponse, ListLevelInfoResponse, PlatformAuthorInfo } from '../../media-platform';
import { AxiosError } from 'axios';
import { errorCode } from '../../media-platform/errorCode';
import { getAlbumResponse, getCategoryResponse, getTopicPageResponse, getUserInfoResponse } from './ximalaya-base.service';

export const getXimalayaUserInfo = async (cookie: string): Promise<PlatformAuthorInfo> => {
  const result: PlatformAuthorInfo = {
    code: 0,
    msg: '',
  };
  try {
    const user = await getUserInfoResponse(cookie);
    result.code = user?.code === '0' ? 0 : -1;
    result.msg = user?.msg;
    result.yixiaoerId = user?.data?.uid?.toString();
    result.yixiaoerName = user?.data?.nickName;
    result.yixiaoerImageUrl = user?.data?.logoPic;
    result.raw = user.data;
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

export const getXimalayaCategory = async (cookie: string): Promise<ListLevelInfoResponse> => {
  const result: ListLevelInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };
  try {
    const cateData = await getCategoryResponse(cookie);
    if (cateData?.data?.length) {
      for (const item of cateData?.data) {
        result.dataList?.push({ yixiaoerId: item?.id?.toString(), yixiaoerName: item?.name, raw: item });
      }
    }
    result.code = cateData?.ret ?? -1;
    result.msg = cateData?.msg;
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

/** 查询喜马拉雅专辑列表；专辑可直接作为音频发布的 albumId。 */
export const getXimalayaAlbum = async (
  cookie: string,
  page: number = 1,
  pageSize: number = 10,
  keyword: string = '',
): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };
  try {
    const cateData = await getAlbumResponse(cookie, page, pageSize, keyword);
    if (cateData?.data?.infos?.length) {
      for (const item of cateData?.data?.infos) {
        result.dataList?.push({
          yixiaoerId: item?.albumId?.toString(),
          yixiaoerName: item?.title,
          yixiaoerImageUrl: item?.fullCoverPath,
          raw: item,
        });
      }
    }
    result.code = cateData?.ret ?? -1;
    result.msg = cateData?.msg;
    const currentPage = Number(cateData?.data?.currentPage ?? page);
    const responsePageSize = Number(cateData?.data?.pageSize ?? pageSize);
    const totalSize = Number(cateData?.data?.totalSize ?? 0);
    if (currentPage > 0 && responsePageSize > 0 && currentPage * responsePageSize < totalSize) {
      result.nextPage = String(currentPage + 1);
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

/** 按分类和关键词搜索喜马拉雅话题，返回项目统一的话题列表结构。 */
export const searchXimalayaTopic = async (
  cookie: string,
  categoryId: string,
  keyword: string,
  pageNo: number = 1,
  pageSize: number = 10,
): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = { code: 0, msg: '', dataList: [] };
  if (!categoryId?.trim() || !keyword?.trim()) {
    return { code: errorCode.data_error, msg: 'categoryId和keyword不能为空', dataList: [] };
  }
  try {
    const response = await getTopicPageResponse(cookie, categoryId, keyword, pageNo, pageSize);
    result.code = response.ret ?? errorCode.data_error;
    result.msg = response.msg ?? '';
    for (const item of response.data?.infos ?? []) {
      const metadataId = item.metadataId ?? item.topicId ?? item.id;
      if (metadataId == null || !item.name) continue;
      result.dataList?.push({
        yixiaoerId: String(metadataId),
        yixiaoerName: item.name,
        raw: item,
      });
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.code = errorCode.unknown_error;
      result.msg = String(e ?? '搜索话题失败');
    }
  }
  return result;
};
